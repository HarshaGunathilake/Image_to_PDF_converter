/**
 * Main-thread API for converting images into a PDF.
 * Spawns a dedicated worker per conversion (so it can be cancelled instantly by terminating it),
 * and falls back to in-page processing on browsers without OffscreenCanvas.
 */
import { createConverterWorker, type WorkerResponse } from "../worker/protocol";
import { ConversionError, type ConvertItem, type ConvertProgress } from "./types";
import type { PdfSettings } from "./settings";

export interface ConversionResult {
  blob: Blob;
  pageCount: number;
}

export interface ConversionHandle {
  promise: Promise<ConversionResult>;
  cancel: () => void;
}

export function convertToPdf(
  items: ConvertItem[],
  settings: PdfSettings,
  options: { title: string; onProgress: (p: ConvertProgress) => void },
): ConversionHandle {
  const worker = createConverterWorker();
  if (!worker) return convertOnMainThread(items, settings, options);

  let settle: { reject: (e: Error) => void } | null = null;
  const promise = new Promise<ConversionResult>((resolve, reject) => {
    settle = { reject };
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;
      if (msg.type === "progress") options.onProgress(msg);
      else if (msg.type === "done") {
        worker.terminate();
        resolve({ blob: new Blob([msg.buffer], { type: "application/pdf" }), pageCount: msg.pageCount });
      } else if (msg.type === "convert-error") {
        worker.terminate();
        reject(new ConversionError(msg.code, msg.fileName));
      }
    };
    worker.onerror = (e) => {
      e.preventDefault();
      worker.terminate();
      // Worker couldn't boot — retry in the page so the user still gets their PDF.
      convertOnMainThread(items, settings, options).promise.then(resolve, reject);
    };
    worker.postMessage({ type: "convert", items, settings, title: options.title });
  });

  return {
    promise,
    cancel: () => {
      worker.terminate();
      settle?.reject(new ConversionError("cancelled"));
    },
  };
}

function convertOnMainThread(
  items: ConvertItem[],
  settings: PdfSettings,
  options: { title: string; onProgress: (p: ConvertProgress) => void },
): ConversionHandle {
  const signal = { aborted: false };
  const promise = import("./generate").then(async ({ generatePdf }) => {
    const { bytes, pageCount } = await generatePdf(items, settings, { ...options, signal });
    return { blob: new Blob([bytes as BlobPart], { type: "application/pdf" }), pageCount };
  });
  return {
    promise,
    cancel: () => {
      signal.aborted = true;
    },
  };
}
