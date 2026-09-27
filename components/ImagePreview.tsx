"use client";

import { ChevronLeft, ChevronRight, Minus, Plus, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ImageItem } from "@/hooks/useConverter";
import { formatBytes } from "@/lib/image/validate";

interface Props {
  items: ImageItem[];
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

const ZOOM_STEPS = [1, 1.5, 2, 3, 4];

/** Lightweight lightbox built on the native <dialog> (focus trap, Esc and inert background for free). */
export function ImagePreview({ items, index, onIndexChange, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const open = index !== null && index >= 0 && index < items.length;
  const item = open ? items[index] : null;

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const go = useCallback(
    (delta: number) => {
      if (index === null || items.length < 2) return;
      onIndexChange((index + delta + items.length) % items.length);
    },
    [index, items.length, onIndexChange],
  );

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-label={item ? `Preview of ${item.name}` : "Image preview"}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-white"
    >
      {item ? (
        <Viewer
          key={item.id}
          item={item}
          position={index! + 1}
          total={items.length}
          onNavigate={go}
          onClose={() => dialogRef.current?.close()}
        />
      ) : null}
    </dialog>
  );
}

function Viewer({
  item,
  position,
  total,
  onNavigate,
  onClose,
}: {
  item: ImageItem;
  position: number;
  total: number;
  onNavigate: (delta: number) => void;
  onClose: () => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [zoomStep, setZoomStep] = useState(0);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [url, setUrl] = useState<string | null>(null);

  // Full-resolution object URL for the image on screen only; released as soon as it's not shown.
  useEffect(() => {
    const u = URL.createObjectURL(item.file);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with an external resource (object URL)
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [item.file]);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setStage({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const zoomBy = (d: number) => setZoomStep((z) => Math.min(ZOOM_STEPS.length - 1, Math.max(0, z + d)));

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") onNavigate(1);
    else if (e.key === "ArrowLeft") onNavigate(-1);
    else if (e.key === "+" || e.key === "=") zoomBy(1);
    else if (e.key === "-") zoomBy(-1);
    else if (e.key === "0") setZoomStep(0);
    else return;
    e.preventDefault();
  };

  // Fit the (rotated) image to the stage, then apply zoom.
  const zoom = ZOOM_STEPS[zoomStep];
  const sideways = item.rotation === 90 || item.rotation === 270;
  const rw = sideways ? item.height : item.width;
  const rh = sideways ? item.width : item.height;
  const fit = stage.w && rw ? Math.min(1, (stage.w - 32) / rw, (stage.h - 32) / rh) : 0;
  const w = rw * fit * zoom;
  const h = rh * fit * zoom;

  return (
    <div className="flex h-full flex-col" onKeyDown={onKeyDown}>
      <header className="flex items-center gap-3 px-3 py-3 sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{item.name}</p>
          <p className="tabular text-xs text-white/65">
            {position} of {total}
            <span className="mx-2 text-white/30" aria-hidden>
              /
            </span>
            {item.width} × {item.height}, {formatBytes(item.size)}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-white/10 p-1">
          <DarkButton label="Zoom out" onClick={() => zoomBy(-1)} disabled={zoomStep === 0}>
            <Minus className="size-4" aria-hidden />
          </DarkButton>
          <button
            type="button"
            onClick={() => setZoomStep(0)}
            className="tabular h-8 min-w-14 rounded-lg px-2 text-xs font-medium hover:bg-white/10"
            aria-label={`Zoom ${Math.round(zoom * 100)} percent. Reset zoom`}
          >
            {Math.round(zoom * 100)}%
          </button>
          <DarkButton label="Zoom in" onClick={() => zoomBy(1)} disabled={zoomStep === ZOOM_STEPS.length - 1}>
            <Plus className="size-4" aria-hidden />
          </DarkButton>
        </div>
        <DarkButton label="Close preview" onClick={onClose} autoFocus>
          <X className="size-5" aria-hidden />
        </DarkButton>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={stageRef}
          className="absolute inset-0 overflow-auto overscroll-contain"
          onDoubleClick={() => setZoomStep((z) => (z === 0 ? 2 : 0))}
        >
          <div className="flex min-h-full min-w-full items-center justify-center p-4" style={{ width: w + 32, height: h + 32 }}>
            <div className="relative shrink-0" style={{ width: w, height: h }}>
              {url && fit ? (
                // eslint-disable-next-line @next/next/no-img-element -- local blob URL
                <img
                  src={url}
                  alt={item.name}
                  className="absolute left-1/2 top-1/2 max-w-none select-none bg-white"
                  draggable={false}
                  style={{
                    width: sideways ? h : w,
                    height: sideways ? w : h,
                    transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                  }}
                />
              ) : null}
            </div>
          </div>
        </div>
        {total > 1 ? (
          <>
            <NavButton side="left" label="Previous image" onClick={() => onNavigate(-1)}>
              <ChevronLeft className="size-6" aria-hidden />
            </NavButton>
            <NavButton side="right" label="Next image" onClick={() => onNavigate(1)}>
              <ChevronRight className="size-6" aria-hidden />
            </NavButton>
          </>
        ) : null}
      </div>
    </div>
  );
}

function DarkButton({
  label,
  onClick,
  children,
  disabled,
  autoFocus,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      autoFocus={autoFocus}
      className="flex size-9 items-center justify-center rounded-lg text-white hover:bg-white/15 focus-visible:outline-white disabled:opacity-35"
    >
      {children}
    </button>
  );
}

function NavButton({
  side,
  label,
  onClick,
  children,
}: {
  side: "left" | "right";
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`absolute top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/15 backdrop-blur hover:bg-black/65 focus-visible:outline-white ${
        side === "left" ? "left-3 sm:left-5" : "right-3 sm:right-5"
      }`}
    >
      {children}
    </button>
  );
}
