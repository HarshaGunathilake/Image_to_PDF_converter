/**
 * File validation shared by the uploader (UI) and the converter (worker).
 * Pure functions — no DOM access — so they are unit-testable.
 */

export const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB per image
export const MAX_FILES = 200;
/** Images above this many megapixels are refused before decoding (browser memory safety). */
export const MAX_MEGAPIXELS = 120;

type Format = { mime: string; exts: string[]; label: string };

export const SUPPORTED_FORMATS: Format[] = [
  { mime: "image/jpeg", exts: ["jpg", "jpeg", "jfif", "pjpeg"], label: "JPG" },
  { mime: "image/png", exts: ["png"], label: "PNG" },
  { mime: "image/webp", exts: ["webp"], label: "WEBP" },
  { mime: "image/gif", exts: ["gif"], label: "GIF" },
  { mime: "image/bmp", exts: ["bmp"], label: "BMP" },
  { mime: "image/avif", exts: ["avif"], label: "AVIF" },
];

/** Value for <input accept>. Extensions are included because some platforms report empty MIME types. */
export const ACCEPT_ATTR = [
  ...SUPPORTED_FORMATS.map((f) => f.mime),
  ...SUPPORTED_FORMATS.flatMap((f) => f.exts.map((e) => `.${e}`)),
].join(",");

export type ValidationErrorCode = "unsupported" | "too-large" | "empty" | "unreadable" | "too-many";

export const ERROR_MESSAGES: Record<ValidationErrorCode | "no-files" | "conversion", string> = {
  unsupported: "This file type isn't supported. Please upload JPG, PNG or WEBP images.",
  "too-large": "This image is too large to process. Please choose a smaller file.",
  empty: "This file is empty. Please choose another image.",
  unreadable: "We couldn't read this image. It may be damaged — please try another file.",
  "too-many": `You can add up to ${MAX_FILES} images per PDF.`,
  "no-files": "Please select at least one image.",
  conversion: "Something went wrong while creating your PDF. Please try again.",
};

function extensionOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}

/** Resolve a supported MIME type from the file's reported type, falling back to its extension. */
export function resolveMime(file: { name: string; type: string }): string | null {
  const type = file.type.toLowerCase();
  if (type) {
    const byType = SUPPORTED_FORMATS.find((f) => f.mime === type || (type === "image/jpg" && f.mime === "image/jpeg"));
    if (byType) return byType.mime;
    // A known non-image or unsupported image type — reject even if the extension looks right.
    if (type !== "application/octet-stream") return null;
  }
  const ext = extensionOf(file.name);
  return SUPPORTED_FORMATS.find((f) => f.exts.includes(ext))?.mime ?? null;
}

export function validateFile(file: { name: string; type: string; size: number }): ValidationErrorCode | null {
  if (!resolveMime(file)) return "unsupported";
  if (file.size === 0) return "empty";
  if (file.size > MAX_FILE_BYTES) return "too-large";
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}
