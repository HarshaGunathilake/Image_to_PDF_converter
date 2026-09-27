/**
 * Main-thread API: read an image's dimensions and create a thumbnail, using the worker when available.
 */
import { createConverterWorker, type WorkerResponse } from "../worker/protocol";
import { createThumbnail, ImageTooLargeError } from "./decode";

export interface ImageMetadata {
  width: number;
  height: number;
  thumb: Blob;
}

export class ImageReadError extends Error {
  constructor(public code: "too-large" | "unreadable") {
    super(code);
  }
}

type Pending = { file: Blob; resolve: (m: ImageMetadata) => void; reject: (e: Error) => void };

let worker: Worker | null | undefined;
const pending = new Map<string, Pending>();
let seq = 0;

// Main-thread fallback runs one image at a time.
let fallbackQueue: Promise<unknown> = Promise.resolve();
function readOnMainThread(file: Blob): Promise<ImageMetadata> {
  const run = fallbackQueue.then(async () => {
    try {
      return await createThumbnail(file);
    } catch (err) {
      throw new ImageReadError(err instanceof ImageTooLargeError ? "too-large" : "unreadable");
    }
  });
  fallbackQueue = run.catch(() => undefined);
  return run;
}

function getWorker(): Worker | null {
  if (worker !== undefined) return worker;
  worker = createConverterWorker();
  if (!worker) return null;
  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const msg = event.data;
    if (msg.type !== "thumb" && msg.type !== "thumb-error") return;
    const job = pending.get(msg.id);
    if (!job) return;
    pending.delete(msg.id);
    if (msg.type === "thumb") job.resolve({ width: msg.width, height: msg.height, thumb: msg.thumb });
    else job.reject(new ImageReadError(msg.code));
  };
  worker.onerror = () => {
    // Worker failed to start or crashed: finish outstanding work on the main thread.
    worker?.terminate();
    worker = null;
    const jobs = [...pending.values()];
    pending.clear();
    jobs.forEach((job) => readOnMainThread(job.file).then(job.resolve, job.reject));
  };
  return worker;
}

export function readImageMetadata(file: Blob): Promise<ImageMetadata> {
  const w = getWorker();
  if (!w) return readOnMainThread(file);
  return new Promise((resolve, reject) => {
    const id = `t${++seq}`;
    pending.set(id, { file, resolve, reject });
    w.postMessage({ type: "thumb", id, file });
  });
}
