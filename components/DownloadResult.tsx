"use client";

import { Check, Download, FilePlus2, RotateCcw, ShieldCheck } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { formatBytes } from "@/lib/image/validate";

interface Props {
  blob: Blob;
  pageCount: number;
  defaultFileName: string;
  onConvertMore: () => void;
  onStartOver: () => void;
}

function sanitizeFileName(input: string, fallback: string) {
  const base = input
    .trim()
    .replace(/\.pdf$/i, "")
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 120);
  return `${base || fallback.replace(/\.pdf$/i, "")}.pdf`;
}

export function DownloadResult({ blob, pageCount, defaultFileName, onConvertMore, onStartOver }: Props) {
  const [name, setName] = useState(defaultFileName.replace(/\.pdf$/i, ""));
  const [downloaded, setDownloaded] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const inputId = useId();

  // Move focus to the result so screen readers announce it.
  useEffect(() => headingRef.current?.focus(), []);

  const download = () => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = sanitizeFileName(name, defaultFileName);
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Give the browser time to start the download before releasing the in-memory file.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    setDownloaded(true);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="pop-in flex size-11 items-center justify-center rounded-full bg-teal-soft text-teal">
        <Check className="size-6" strokeWidth={2.5} aria-hidden />
      </div>
      <h2 ref={headingRef} tabIndex={-1} className="mt-4 text-2xl font-semibold tracking-tight text-ink outline-none">
        Your PDF is ready!
      </h2>
      <p className="mt-1.5 text-[15px] leading-relaxed text-graphite">
        Your images have been successfully converted into a PDF.
      </p>

      <dl className="mt-6 divide-y divide-rule rounded-xl ring-1 ring-rule">
        <div className="px-4 py-3">
          <dt>
            <label htmlFor={inputId} className="text-xs font-medium text-graphite">
              File name
            </label>
          </dt>
          <dd className="mt-1 flex items-center rounded-lg bg-surface-2 ring-1 ring-rule focus-within:ring-2 focus-within:ring-teal">
            <input
              id={inputId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm font-medium text-ink outline-none"
            />
            <span className="pr-3 text-sm text-graphite">.pdf</span>
          </dd>
        </div>
        <div className="grid grid-cols-2 divide-x divide-rule">
          <div className="px-4 py-3">
            <dt className="text-xs font-medium text-graphite">Pages</dt>
            <dd className="tabular mt-0.5 text-lg font-semibold text-ink">{pageCount}</dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-xs font-medium text-graphite">File size</dt>
            <dd className="tabular mt-0.5 text-lg font-semibold text-ink">{formatBytes(blob.size)}</dd>
          </div>
        </div>
      </dl>

      <button
        type="button"
        onClick={download}
        className="mt-6 inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-teal px-6 text-base font-semibold text-on-teal shadow-sm transition-colors hover:bg-teal-hover active:translate-y-px"
      >
        <Download className="size-5" aria-hidden />
        Download PDF
      </button>
      <p className="mt-2 h-5 text-center text-xs text-graphite" aria-live="polite">
        {downloaded ? "Download started. Check your downloads folder." : ""}
      </p>

      <div className="mt-3 grid gap-2">
        <button
          type="button"
          onClick={onConvertMore}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-surface px-3 text-sm font-medium text-ink ring-1 ring-rule transition-colors hover:bg-surface-2"
        >
          <FilePlus2 className="size-4" aria-hidden />
          Convert More Images
        </button>
        <button
          type="button"
          onClick={onStartOver}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-surface px-3 text-sm font-medium text-ink ring-1 ring-rule transition-colors hover:bg-surface-2"
        >
          <RotateCcw className="size-4" aria-hidden />
          Start Over
        </button>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-graphite">
        “Convert More Images” keeps your current images so you can add or change them. “Start Over” clears everything.
      </p>

      <p className="mt-auto flex items-start gap-2 pt-6 text-xs leading-relaxed text-graphite">
        <ShieldCheck className="mt-px size-4 shrink-0 text-teal" aria-hidden />
        This PDF was made in your browser and exists only in this tab. Nothing was uploaded.
      </p>
    </div>
  );
}
