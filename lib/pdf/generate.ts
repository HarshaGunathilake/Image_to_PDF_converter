/**
 * Core Image → PDF generation. Runs inside a Web Worker (preferred) or on the main thread as a fallback.
 * Everything happens in memory; nothing is uploaded or persisted.
 */
import { PDFDocument, clip, degrees, endPath, popGraphicsState, pushGraphicsState, rectangle, type PDFImage } from "pdf-lib";
import { decodeImage, encodeBitmap, ImageDecodeError, ImageTooLargeError } from "../image/decode";
import { readJpegOrientation } from "../image/exif";
import { site } from "../site";
import { computeLayout, rotatedDrawArgs } from "./layout";
import { QUALITY_PRESETS, type PdfSettings } from "./settings";
import { ConversionError, type ConvertItem, type ConvertProgress } from "./types";

export { ConversionError } from "./types";
export type { ConvertItem, ConvertProgress } from "./types";

export interface GenerateOptions {
  title: string;
  onProgress?: (p: ConvertProgress) => void;
  signal?: { aborted: boolean };
}

async function embedItem(doc: PDFDocument, item: ConvertItem, settings: PdfSettings): Promise<PDFImage> {
  const preset = QUALITY_PRESETS[settings.quality];

  if (settings.quality === "maximum" && (item.mime === "image/jpeg" || item.mime === "image/png")) {
    // Embed the original bytes untouched: zero quality loss and usually the smallest output.
    const buffer = await item.file.arrayBuffer();
    try {
      if (item.mime === "image/jpeg" && readJpegOrientation(buffer) === 1) return await doc.embedJpg(buffer);
      if (item.mime === "image/png") return await doc.embedPng(buffer);
    } catch {
      // Unusual encodings (e.g. some CMYK/12-bit files) fall through to a browser re-encode.
    }
  }

  const bitmap = await decodeImage(item.file);
  try {
    // Lossless for palette-style formats at Maximum, JPEG otherwise (photos compress far better).
    const lossless = settings.quality === "maximum" && (item.mime === "image/png" || item.mime === "image/gif" || item.mime === "image/bmp");
    const bytes = await encodeBitmap(bitmap, {
      maxDimension: preset.maxDimension,
      type: lossless ? "image/png" : "image/jpeg",
      quality: lossless ? undefined : preset.jpegQuality,
    });
    return lossless ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
  } finally {
    bitmap.close();
  }
}

export async function generatePdf(items: ConvertItem[], settings: PdfSettings, options: GenerateOptions) {
  const { onProgress, signal } = options;
  const total = items.length;
  const doc = await PDFDocument.create();
  doc.setTitle(options.title);
  doc.setCreator(site.name);
  doc.setProducer(`${site.name} – in-browser image to PDF`);
  const now = new Date();
  doc.setCreationDate(now);
  doc.setModificationDate(now);

  onProgress?.({ stage: "preparing", done: 0, total });

  for (let i = 0; i < total; i++) {
    if (signal?.aborted) throw new ConversionError("cancelled");
    const item = items[i];
    let image: PDFImage;
    try {
      image = await embedItem(doc, item, settings);
    } catch (err) {
      if (err instanceof ImageTooLargeError) throw new ConversionError("too-large", item.name);
      if (err instanceof ImageDecodeError) throw new ConversionError("unreadable", item.name);
      throw new ConversionError("conversion", item.name);
    }

    const layout = computeLayout(item.width, item.height, item.rotation, settings);
    const page = doc.addPage([layout.pageWidth, layout.pageHeight]);
    if (layout.clip) {
      const c = layout.clip;
      page.pushOperators(pushGraphicsState(), rectangle(c.x, c.y, c.width, c.height), clip(), endPath());
    }
    const args = rotatedDrawArgs(layout.image, item.rotation);
    page.drawImage(image, {
      x: args.x,
      y: args.y,
      width: args.width,
      height: args.height,
      rotate: degrees(args.degrees),
    });
    if (layout.clip) page.pushOperators(popGraphicsState());

    onProgress?.({ stage: "preparing", done: i + 1, total });
  }

  if (signal?.aborted) throw new ConversionError("cancelled");
  onProgress?.({ stage: "generating", done: total, total });
  const bytes = await doc.save({ useObjectStreams: true });
  return { bytes, pageCount: doc.getPageCount() };
}
