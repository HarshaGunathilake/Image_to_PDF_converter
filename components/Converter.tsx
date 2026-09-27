"use client";

import { FileDown, ImagePlus, Lock, Plus, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useConverter, type Notice, type SortMode } from "@/hooks/useConverter";
import { ACCEPT_ATTR, ERROR_MESSAGES } from "@/lib/image/validate";
import type { PdfSettings as Settings } from "@/lib/pdf/settings";
import { ConversionProgress } from "./ConversionProgress";
import { DownloadResult } from "./DownloadResult";
import { ImageList } from "./ImageList";
import { ImagePreview } from "./ImagePreview";
import { ImageUploader } from "./ImageUploader";
import { PdfSettings } from "./PdfSettings";
import { Toasts, type Toast } from "./Toasts";

// PDF.js is ~1 MB; only fetch it when a result is on screen.
const PdfPreview = dynamic(() => import("./PdfPreview"), {
  ssr: false,
  loading: () => <div className="h-[min(72vh,760px)] min-h-[420px] animate-pulse rounded-xl bg-surface-2 ring-1 ring-rule" />,
});

function noticeToToast(n: Notice, id: number): Toast {
  const files = n.files ?? [];
  const who =
    files.length === 1 ? `“${files[0]}”` : files.length > 1 ? `${files.length} files` : null;
  const titles: Record<Notice["code"], string> = {
    unsupported: who ? `${who} ${files.length > 1 ? "weren't" : "wasn't"} added` : "File not added",
    "too-large": who ? `${who} ${files.length > 1 ? "are" : "is"} too large` : "Image too large",
    empty: who ? `${who} ${files.length > 1 ? "are" : "is"} empty` : "Empty file",
    unreadable: who ? `${who} couldn't be read` : "Image couldn't be read",
    "too-many": "Image limit reached",
    "no-files": "No images yet",
    conversion: "PDF not created",
  };
  return { id, title: titles[n.code], message: ERROR_MESSAGES[n.code] };
}

function fileNameFor(timestamp: number) {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `converted-images-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.pdf`;
}

export interface ConverterProps {
  /** Page headline (the page's only h1). */
  title: string;
  intro: string;
  /** Per-page defaults, e.g. lossless quality on the PNG page. */
  initialSettings?: Partial<Settings>;
}

export function Converter({ title, intro, initialSettings }: ConverterProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastSeq = useRef(0);
  const notify = useCallback((n: Notice) => {
    const toast = noticeToToast(n, ++toastSeq.current);
    setToasts((t) => [...t.slice(-3), toast]);
  }, []);
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const c = useConverter(notify, initialSettings);
  const { items, settings, phase, progress, result } = c.state;
  const inputRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const browse = useCallback(() => inputRef.current?.click(), []);

  const acceptFiles = useCallback(
    (files: FileList | File[]) => {
      if (phase === "converting") return;
      if (phase === "done") c.backToEdit();
      c.addFiles(files);
    },
    [phase, c],
  );

  // Page-wide drag & drop and paste — dropping a file anywhere never navigates away from the page.
  useEffect(() => {
    let depth = 0;
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
    const onEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth++;
      setDragActive(true);
    };
    const onOver = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    };
    const onLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragActive(false);
    };
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setDragActive(false);
      if (e.dataTransfer?.files.length) acceptFiles(e.dataTransfer.files);
    };
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable]")) return;
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length) {
        e.preventDefault();
        acceptFiles(files);
      }
    };
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragover", onOver);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("paste", onPaste);
    };
  }, [acceptFiles]);

  // Bring the result into view once it's ready.
  useEffect(() => {
    if (phase !== "done") return;
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [phase]);

  // Keep the lightbox index valid as items change.
  const safePreview = previewIndex !== null && previewIndex < items.length ? previewIndex : null;

  const loadingCount = items.filter((it) => it.status !== "ready").length;
  const count = items.length;
  const countLabel = `${count} ${count === 1 ? "image" : "images"} selected`;
  const converting = phase === "converting";

  const convertButton = (extra = "") => (
    <button
      type="button"
      onClick={() => void c.convert()}
      disabled={converting || loadingCount > 0}
      className={`inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-teal px-6 text-base font-semibold text-on-teal shadow-sm transition-colors hover:bg-teal-hover active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 ${extra}`}
    >
      <FileDown className="size-5" aria-hidden />
      {loadingCount > 0 ? "Reading images…" : converting ? "Converting…" : "Convert to PDF"}
    </button>
  );

  return (
    <>
      {/* Hero */}
      <div className="max-w-2xl">
        <h1 className="text-[2.125rem] font-semibold leading-[1.1] tracking-[-0.025em] text-ink sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-graphite sm:text-lg">
          {intro}
        </p>
        <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
          <button
            type="button"
            onClick={browse}
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-ink px-6 text-[15px] font-semibold text-surface transition-opacity hover:opacity-90 active:translate-y-px"
          >
            <ImagePlus className="size-5" aria-hidden />
            Select Images
          </button>
          <p className="flex items-center gap-1.5 text-sm text-graphite">
            <Lock className="size-4 text-teal" aria-hidden />
            Your files are processed securely and are never stored.
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_ATTR}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          if (e.target.files) acceptFiles(e.target.files);
          e.target.value = ""; // allow picking the same file again
        }}
      />

      {/* Workspace */}
      <div
        ref={sectionRef}
        id="converter"
        className="relative mt-10 scroll-mt-20 rounded-[20px] bg-surface shadow-panel ring-1 ring-rule sm:mt-12"
        aria-label="Image to PDF converter"
        role="region"
      >
        {phase === "done" && result ? (
          <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
            <div className="order-2 lg:order-1">
              <PdfPreview blob={result.blob} />
            </div>
            <div className="order-1 lg:order-2">
              <DownloadResult
                key={result.createdAt}
                blob={result.blob}
                pageCount={result.pageCount}
                defaultFileName={fileNameFor(result.createdAt)}
                onConvertMore={c.backToEdit}
                onStartOver={c.clearAll}
              />
            </div>
          </div>
        ) : count === 0 ? (
          <div className="p-3 sm:p-4">
            <ImageUploader onBrowse={browse} dragActive={dragActive} />
          </div>
        ) : (
          <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center gap-2 sm:mb-5">
                <p className="mr-auto text-[15px] font-semibold text-ink" aria-live="polite">
                  {countLabel}
                </p>
                <label className="sr-only" htmlFor="sort-images">
                  Sort images
                </label>
                <select
                  id="sort-images"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) c.sort(e.target.value as SortMode);
                  }}
                  disabled={converting}
                  className="h-9 rounded-lg bg-surface px-2.5 text-sm font-medium text-ink ring-1 ring-rule hover:bg-surface-2"
                >
                  <option value="">Sort…</option>
                  <option value="name-asc">Name A–Z</option>
                  <option value="name-desc">Name Z–A</option>
                  <option value="reverse">Reverse order</option>
                </select>
                <button
                  type="button"
                  onClick={browse}
                  disabled={converting}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-surface px-3 text-sm font-medium text-ink ring-1 ring-rule hover:bg-surface-2"
                >
                  <Plus className="size-4" aria-hidden />
                  Add
                </button>
                <button
                  type="button"
                  onClick={c.clearAll}
                  disabled={converting}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-graphite hover:bg-danger-soft hover:text-danger"
                >
                  <Trash2 className="size-4" aria-hidden />
                  Clear All
                </button>
              </div>
              <ImageList
                items={items}
                settings={settings}
                onReorder={c.reorder}
                onRemove={c.removeItem}
                onRotate={c.rotate}
                onPreview={setPreviewIndex}
                onAdd={browse}
              />
              <p className="mt-4 hidden text-xs text-graphite sm:block">
                Drag pages to change their order. Each thumbnail shows exactly how the page will look.
              </p>
            </div>

            <aside className="border-t border-rule p-4 sm:p-6 lg:border-l lg:border-t-0" aria-label="PDF settings and convert">
              <div className="lg:sticky lg:top-24">
                <PdfSettings settings={settings} onChange={c.updateSettings} disabled={converting} />
                <div className="mt-6 hidden lg:block">{convertButton()}</div>
                <p className="mt-4 hidden items-start gap-2 text-xs leading-relaxed text-graphite lg:flex">
                  <Lock className="mt-px size-3.5 shrink-0 text-teal" aria-hidden />
                  Images are processed directly in your browser and never uploaded.
                </p>
              </div>
            </aside>
          </div>
        )}

        {converting && progress ? <ConversionProgress progress={progress} onCancel={c.cancel} /> : null}

        {dragActive && count > 0 && phase !== "converting" ? (
          <div className="pointer-events-none absolute inset-2 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-teal bg-teal-soft/85">
            <p className="text-lg font-semibold text-teal">Drop to add images</p>
          </div>
        ) : null}
      </div>

      {/* Mobile: convert action stays within thumb reach */}
      {phase !== "done" && count > 0 ? (
        <>
          <div className="h-20 lg:hidden" aria-hidden />
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-surface/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
            {convertButton()}
          </div>
        </>
      ) : null}

      <ImagePreview items={items} index={safePreview} onIndexChange={setPreviewIndex} onClose={() => setPreviewIndex(null)} />
      <Toasts toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
