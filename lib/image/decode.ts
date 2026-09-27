/**
 * Image decoding / re-encoding helpers.
 * Written against APIs available both in Web Workers (OffscreenCanvas) and on the main thread
 * (HTMLCanvasElement fallback), so the same code runs in either place.
 */
import { MAX_MEGAPIXELS } from "./validate";

/** Largest canvas area that every major browser (incl. iOS Safari) can allocate reliably. */
export const MAX_CANVAS_AREA = 16_777_216;

export class ImageTooLargeError extends Error {
  constructor() {
    super("image-too-large");
  }
}
export class ImageDecodeError extends Error {
  constructor() {
    super("image-unreadable");
  }
}

type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;
type AnyContext = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

export function canUseOffscreenCanvas(): boolean {
  return (
    typeof OffscreenCanvas !== "undefined" &&
    typeof OffscreenCanvas.prototype.convertToBlob === "function" &&
    typeof createImageBitmap === "function"
  );
}

function createCanvas(width: number, height: number): AnyCanvas {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function get2d(canvas: AnyCanvas, alpha: boolean): AnyContext {
  const ctx = canvas.getContext("2d", { alpha }) as AnyContext | null;
  if (!ctx) throw new ImageTooLargeError();
  return ctx;
}

async function canvasToBlob(canvas: AnyCanvas, type: string, quality?: number): Promise<Blob> {
  if ("convertToBlob" in canvas) return canvas.convertToBlob({ type, quality });
  return new Promise((resolve, reject) =>
    (canvas as HTMLCanvasElement).toBlob((b) => (b ? resolve(b) : reject(new ImageTooLargeError())), type, quality),
  );
}

function release(canvas: AnyCanvas) {
  // Shrinking to 0×0 frees the backing store immediately instead of waiting for GC (matters on iOS).
  canvas.width = 0;
  canvas.height = 0;
}

/** Decode a file into a bitmap, honouring EXIF orientation. */
export async function decodeImage(blob: Blob): Promise<ImageBitmap> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
  } catch {
    throw new ImageDecodeError();
  }
  if (bitmap.width === 0 || bitmap.height === 0) {
    bitmap.close();
    throw new ImageDecodeError();
  }
  if (bitmap.width * bitmap.height > MAX_MEGAPIXELS * 1_000_000) {
    bitmap.close();
    throw new ImageTooLargeError();
  }
  return bitmap;
}

/**
 * Draw `source` scaled to (w, h) on a white background.
 * Large reductions are done in halving steps, which looks noticeably sharper than a single
 * drawImage in browsers with basic resampling.
 */
function drawScaled(source: CanvasImageSource & { width: number; height: number }, w: number, h: number): AnyCanvas {
  let current: CanvasImageSource & { width: number; height: number } = source;
  let cw = source.width;
  let ch = source.height;
  const temps: AnyCanvas[] = [];

  while (cw / 2 >= w && ch / 2 >= h && cw * ch > 4_000_000) {
    cw = Math.round(cw / 2);
    ch = Math.round(ch / 2);
    const step = createCanvas(cw, ch);
    const sctx = get2d(step, true); // keep transparency until the final white composite
    sctx.imageSmoothingEnabled = true;
    sctx.imageSmoothingQuality = "high";
    sctx.drawImage(current, 0, 0, cw, ch);
    temps.push(step);
    current = step;
  }

  const out = createCanvas(w, h);
  const ctx = get2d(out, false);
  ctx.fillStyle = "#ffffff"; // transparent areas become white, as on paper
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(current, 0, 0, w, h);
  temps.forEach(release);
  return out;
}

export function targetSize(width: number, height: number, maxDimension: number | null) {
  let scale = 1;
  if (maxDimension) scale = Math.min(scale, maxDimension / Math.max(width, height));
  scale = Math.min(scale, Math.sqrt(MAX_CANVAS_AREA / (width * height)));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** Re-encode a decoded bitmap for embedding (downscaled if needed). */
export async function encodeBitmap(
  bitmap: ImageBitmap,
  options: { maxDimension: number | null; type: "image/jpeg" | "image/png"; quality?: number },
): Promise<Uint8Array> {
  const { width, height } = targetSize(bitmap.width, bitmap.height, options.maxDimension);
  const canvas = drawScaled(bitmap, width, height);
  try {
    const blob = await canvasToBlob(canvas, options.type, options.quality);
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    release(canvas);
  }
}

/** Read dimensions and build a small JPEG thumbnail for the image grid. */
export async function createThumbnail(file: Blob, maxSide = 360): Promise<{ width: number; height: number; thumb: Blob }> {
  const bitmap = await decodeImage(file);
  try {
    const { width, height } = bitmap;
    const scale = Math.min(1, maxSide / Math.max(width, height));
    const canvas = drawScaled(bitmap, Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale)));
    try {
      const thumb = await canvasToBlob(canvas, "image/jpeg", 0.82);
      return { width, height, thumb };
    } finally {
      release(canvas);
    }
  } finally {
    bitmap.close();
  }
}
