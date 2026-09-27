"use client";

import { useEffect, useRef } from "react";
import type { ConvertProgress } from "@/lib/pdf/types";

interface Props {
  progress: ConvertProgress & { finishing?: boolean };
  onCancel: () => void;
}

export function progressInfo(p: Props["progress"]) {
  if (p.finishing) return { label: "Almost done…", percent: 100 };
  if (p.stage === "generating") return { label: "Generating PDF…", percent: 94 };
  const ratio = p.total ? p.done / p.total : 0;
  return { label: "Preparing images…", percent: Math.round(4 + ratio * 84) };
}

export function ConversionProgress({ progress, onCancel }: Props) {
  const { label, percent } = progressInfo(progress);
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => cancelRef.current?.focus(), []);

  return (
    <div
      className="fade-in absolute inset-0 z-20 flex justify-center rounded-[inherit] bg-surface/92 px-6 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="false"
      aria-labelledby="progress-label"
    >
      {/* Sticky so the status stays on screen even when the workspace is taller than the viewport */}
      <div className="sticky top-[max(6rem,calc(50dvh-9rem))] h-fit w-full max-w-sm py-12 text-center">
        <div className="relative mx-auto h-16 w-12" aria-hidden>
          <div className="absolute inset-0 rounded-[3px] bg-white shadow-paper ring-1 ring-black/5" />
          <div className="sheet-feed absolute inset-x-2 top-3 h-1 rounded-full bg-teal" />
          <div className="absolute inset-x-2 top-7 h-1 rounded-full bg-slate-200" />
          <div className="absolute inset-x-2 top-10 h-1 w-5 rounded-full bg-slate-200" />
        </div>
        <p id="progress-label" className="mt-5 text-lg font-semibold text-ink" aria-live="polite">
          {label}
        </p>
        <p className="tabular mt-1 text-sm text-graphite">
          {progress.stage === "preparing" && !progress.finishing
            ? `${progress.done} of ${progress.total} ${progress.total === 1 ? "image" : "images"}`
            : `${progress.total} ${progress.total === 1 ? "page" : "pages"}`}
        </p>
        <div
          className="mt-5 h-2 overflow-hidden rounded-full bg-surface-2 ring-1 ring-rule"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="Conversion progress"
        >
          <div
            className="h-full rounded-full bg-teal transition-[width] duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <button
          ref={cancelRef}
          type="button"
          onClick={onCancel}
          disabled={progress.finishing}
          className="mt-5 rounded-lg px-3 py-1.5 text-sm font-medium text-graphite hover:bg-surface-2 hover:text-ink disabled:invisible"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
