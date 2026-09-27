"use client";

import { ImagePlus } from "lucide-react";

interface Props {
  onBrowse: () => void;
  dragActive: boolean;
}

/** Empty state: the large drop target. Dropping is handled page-wide by the converter. */
export function ImageUploader({ onBrowse, dragActive }: Props) {
  return (
    <div
      className="tray-border relative flex min-h-[340px] flex-col items-center justify-center rounded-2xl px-6 py-12 text-center transition-colors duration-150 data-[active=true]:bg-teal-soft/60 sm:min-h-[380px]"
      data-active={dragActive}
    >
      <SheetStack active={dragActive} />
      <p className="mt-8 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
        {dragActive ? "Release to add your images" : "Drop your images here"}
      </p>
      <p className="mt-2 text-graphite">or</p>
      <button
        type="button"
        onClick={onBrowse}
        className="mt-3 inline-flex h-12 items-center gap-2 rounded-xl bg-teal px-6 text-[15px] font-semibold text-on-teal shadow-sm transition-colors hover:bg-teal-hover active:translate-y-px"
      >
        <ImagePlus className="size-5" aria-hidden />
        Browse Files
      </button>
      <p className="mt-6 text-sm text-graphite">You can upload multiple images</p>
      <p className="mt-1 text-xs text-graphite/90">JPG, PNG, WEBP, GIF, BMP and AVIF, up to 50 MB each</p>
    </div>
  );
}

/** Three blank sheets that fan out when files are dragged over. */
function SheetStack({ active }: { active: boolean }) {
  const t = "transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)]";
  return (
    <div className="relative h-24 w-20" aria-hidden>
      <div
        className={`absolute inset-0 rounded-[3px] bg-white shadow-paper ring-1 ring-black/5 ${t}`}
        style={{ transform: active ? "rotate(-14deg) translate(-18px, 4px)" : "rotate(-6deg) translate(-6px, 2px)" }}
      />
      <div
        className={`absolute inset-0 rounded-[3px] bg-white shadow-paper ring-1 ring-black/5 ${t}`}
        style={{ transform: active ? "rotate(12deg) translate(18px, 4px)" : "rotate(5deg) translate(6px, 1px)" }}
      />
      <div
        className={`absolute inset-0 flex flex-col gap-1.5 rounded-[3px] bg-white p-2.5 shadow-paper ring-1 ring-black/5 ${t}`}
        style={{ transform: active ? "translateY(-10px)" : "none" }}
      >
        <div className="h-9 rounded-[2px] bg-teal/80" />
        <div className="h-1 w-full rounded-full bg-slate-200" />
        <div className="h-1 w-3/4 rounded-full bg-slate-200" />
        <div className="h-1 w-5/6 rounded-full bg-slate-200" />
      </div>
    </div>
  );
}
