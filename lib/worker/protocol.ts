import type { ConversionErrorCode, ConvertItem, ConvertStage } from "../pdf/types";
import type { PdfSettings } from "../pdf/settings";

export type WorkerRequest =
  | { type: "thumb"; id: string; file: Blob }
  | { type: "convert"; items: ConvertItem[]; settings: PdfSettings; title: string }
  | { type: "cancel" };

export type WorkerResponse =
  | { type: "thumb"; id: string; width: number; height: number; thumb: Blob }
  | { type: "thumb-error"; id: string; code: "too-large" | "unreadable" }
  | { type: "progress"; stage: ConvertStage; done: number; total: number }
  | { type: "done"; buffer: ArrayBuffer; pageCount: number }
  | { type: "convert-error"; code: ConversionErrorCode; fileName?: string };

/**
 * Create the processing worker, or null when the browser can't run it
 * (no module workers / OffscreenCanvas) — callers then fall back to the main thread.
 */
export function createConverterWorker(): Worker | null {
  if (typeof window === "undefined" || typeof Worker === "undefined") return null;
  if (typeof OffscreenCanvas === "undefined" || typeof OffscreenCanvas.prototype.convertToBlob !== "function") return null;
  try {
    return new Worker(new URL("./converter.worker.ts", import.meta.url), { type: "module", name: "pdf-converter" });
  } catch {
    return null;
  }
}
