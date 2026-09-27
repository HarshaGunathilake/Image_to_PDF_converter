import { MARGIN_POINTS, MAX_PAGE_PT, PAGE_DIMENSIONS, PX_TO_PT, type PdfSettings } from "./settings";

export type Rotation = 0 | 90 | 180 | 270;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PageLayout {
  pageWidth: number;
  pageHeight: number;
  /** Where the (already rotated) image lands on the page, in PDF coordinates (origin bottom-left). */
  image: Rect;
  /** Clip region; only set when the image overflows the content box ("Fill page"). */
  clip: Rect | null;
}

/**
 * Compute the page size and image placement for one image.
 * `width`/`height` are the source image's pixel dimensions *before* the user's rotation.
 * Pure function — covered by unit tests.
 */
export function computeLayout(width: number, height: number, rotation: Rotation, settings: PdfSettings): PageLayout {
  const rotated = rotation === 90 || rotation === 270;
  const imgW = (rotated ? height : width) * PX_TO_PT;
  const imgH = (rotated ? width : height) * PX_TO_PT;
  const margin = MARGIN_POINTS[settings.margin];

  if (settings.pageSize === "original") {
    // Page wraps the image; very large images are scaled down to the PDF page-size limit.
    const maxContent = MAX_PAGE_PT - margin * 2;
    const scale = Math.min(1, maxContent / imgW, maxContent / imgH);
    const w = imgW * scale;
    const h = imgH * scale;
    return {
      pageWidth: w + margin * 2,
      pageHeight: h + margin * 2,
      image: { x: margin, y: margin, width: w, height: h },
      clip: null,
    };
  }

  const [portraitW, portraitH] = PAGE_DIMENSIONS[settings.pageSize];
  const landscape =
    settings.orientation === "landscape" || (settings.orientation === "auto" && imgW > imgH);
  const pageWidth = landscape ? portraitH : portraitW;
  const pageHeight = landscape ? portraitW : portraitH;

  const box: Rect = {
    x: margin,
    y: margin,
    width: pageWidth - margin * 2,
    height: pageHeight - margin * 2,
  };

  let scale: number;
  switch (settings.fit) {
    case "fill":
      scale = Math.max(box.width / imgW, box.height / imgH);
      break;
    case "original":
      // Actual size, shrunk only when it would not fit on the page.
      scale = Math.min(1, box.width / imgW, box.height / imgH);
      break;
    case "fit":
    default:
      scale = Math.min(box.width / imgW, box.height / imgH);
  }

  const w = imgW * scale;
  const h = imgH * scale;
  const image: Rect = {
    x: box.x + (box.width - w) / 2,
    y: box.y + (box.height - h) / 2,
    width: w,
    height: h,
  };
  const overflows = w > box.width + 0.01 || h > box.height + 0.01;
  return { pageWidth, pageHeight, image, clip: overflows ? box : null };
}

/**
 * pdf-lib rotates images counter-clockwise around their bottom-left corner.
 * Given the target box for the rotated image and a clockwise rotation, return
 * the drawImage() arguments that make the rotated image fill exactly that box.
 */
export function rotatedDrawArgs(box: Rect, rotation: Rotation) {
  switch (rotation) {
    case 90: // clockwise 90° == -90° in PDF space
      return { x: box.x, y: box.y + box.height, width: box.height, height: box.width, degrees: -90 };
    case 180:
      return { x: box.x + box.width, y: box.y + box.height, width: box.width, height: box.height, degrees: 180 };
    case 270:
      return { x: box.x + box.width, y: box.y, width: box.height, height: box.width, degrees: 90 };
    default:
      return { x: box.x, y: box.y, width: box.width, height: box.height, degrees: 0 };
  }
}
