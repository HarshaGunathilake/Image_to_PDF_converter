export type PageSize = "a4" | "letter" | "a3" | "original";
export type Orientation = "portrait" | "landscape" | "auto";
export type ImageFit = "fit" | "fill" | "original";
export type Margin = "none" | "small" | "medium" | "large";
export type Quality = "standard" | "high" | "maximum";

export interface PdfSettings {
  pageSize: PageSize;
  orientation: Orientation;
  fit: ImageFit;
  margin: Margin;
  quality: Quality;
}

export const DEFAULT_SETTINGS: PdfSettings = {
  pageSize: "a4",
  orientation: "auto",
  fit: "fit",
  margin: "small",
  quality: "high",
};

/** Portrait page sizes in PDF points (1pt = 1/72 in). */
export const PAGE_DIMENSIONS: Record<Exclude<PageSize, "original">, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
  a3: [841.89, 1190.55],
};

/** Margins in points: 0, ~6 mm, ~12 mm, ~20 mm. */
export const MARGIN_POINTS: Record<Margin, number> = {
  none: 0,
  small: 18,
  medium: 36,
  large: 56,
};

/**
 * Encoding presets.
 * - standard: long side ≤ 2000px, JPEG 80% — small files, great for sharing/email.
 * - high:     long side ≤ 3500px, JPEG 92% — print-quality at A4/Letter.
 * - maximum:  full resolution; JPEG/PNG bytes are embedded untouched when possible.
 */
export const QUALITY_PRESETS: Record<Quality, { maxDimension: number | null; jpegQuality: number }> = {
  standard: { maxDimension: 2000, jpegQuality: 0.8 },
  high: { maxDimension: 3500, jpegQuality: 0.92 },
  maximum: { maxDimension: null, jpegQuality: 0.95 },
};

/** CSS pixels → PDF points (96 dpi screen → 72 dpi PDF). */
export const PX_TO_PT = 0.75;
/** PDF viewers cap page dimensions at 200 inches. */
export const MAX_PAGE_PT = 14400;

export const OPTION_LABELS = {
  pageSize: { a4: "A4", letter: "Letter", a3: "A3", original: "Original image size" },
  orientation: { portrait: "Portrait", landscape: "Landscape", auto: "Auto" },
  fit: { fit: "Fit to page", fill: "Fill page", original: "Original size" },
  margin: { none: "None", small: "Small", medium: "Medium", large: "Large" },
  quality: { standard: "Standard", high: "High", maximum: "Maximum" },
} as const;
