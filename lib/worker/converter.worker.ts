/// <reference lib="webworker" />
/**
 * Off-main-thread image processing. Handles two jobs:
 *  - "thumb":   read dimensions + make a small preview for the image grid
 *  - "convert": build the full PDF
 * Files arrive as Blobs (zero-copy handles to the user's local files) and never leave the browser.
 */
import { createThumbnail, ImageTooLargeError } from "../image/decode";
import { ConversionError, generatePdf, type ConvertItem } from "../pdf/generate";
import type { PdfSettings } from "../pdf/settings";
import type { WorkerRequest, WorkerResponse } from "./protocol";

declare const self: DedicatedWorkerGlobalScope;

const post = (msg: WorkerResponse, transfer: Transferable[] = []) => self.postMessage(msg, transfer);

// Thumbnails are processed one at a time to keep peak memory low with large batches.
let thumbQueue: Promise<void> = Promise.resolve();
const abort = { aborted: false };

async function handleThumb(id: string, file: Blob) {
  try {
    const { width, height, thumb } = await createThumbnail(file);
    post({ type: "thumb", id, width, height, thumb });
  } catch (err) {
    post({ type: "thumb-error", id, code: err instanceof ImageTooLargeError ? "too-large" : "unreadable" });
  }
}

async function handleConvert(items: ConvertItem[], settings: PdfSettings, title: string) {
  try {
    const { bytes, pageCount } = await generatePdf(items, settings, {
      title,
      signal: abort,
      onProgress: (p) => post({ type: "progress", ...p }),
    });
    const buffer = bytes.buffer as ArrayBuffer;
    post({ type: "done", buffer, pageCount }, [buffer]);
  } catch (err) {
    const e = err instanceof ConversionError ? err : new ConversionError("conversion");
    post({ type: "convert-error", code: e.code, fileName: e.fileName });
  }
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;
  switch (msg.type) {
    case "thumb":
      thumbQueue = thumbQueue.then(() => handleThumb(msg.id, msg.file));
      break;
    case "convert":
      abort.aborted = false;
      void handleConvert(msg.items, msg.settings, msg.title);
      break;
    case "cancel":
      abort.aborted = true;
      break;
  }
};
