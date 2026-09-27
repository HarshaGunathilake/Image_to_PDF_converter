import type { Rotation } from "./layout";

/** Shared conversion types — kept free of pdf-lib so the main bundle stays small. */
export interface ConvertItem {
  id: string;
  name: string;
  file: Blob;
  mime: string;
  /** Pixel size after EXIF orientation, before user rotation. */
  width: number;
  height: number;
  rotation: Rotation;
}

export type ConvertStage = "preparing" | "generating";

export interface ConvertProgress {
  stage: ConvertStage;
  done: number;
  total: number;
}

export type ConversionErrorCode = "too-large" | "unreadable" | "conversion" | "cancelled";

export class ConversionError extends Error {
  constructor(
    public code: ConversionErrorCode,
    public fileName?: string,
  ) {
    super(code);
  }
}

