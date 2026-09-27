"use client";

import { ChevronDown, ChevronUp, Maximize2, Minimize2, Minus, Plus } from "lucide-react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * In-page PDF viewer built on PDF.js (loaded on demand — it's only needed on the result screen).
 * Renders the actual generated file, page by page, lazily as pages scroll into view.
 */

// The "legacy" build ships polyfills for newer JS features the modern build assumes
// (e.g. Map.getOrInsertComputed), so it works in all current Safari/Chrome/Firefox/Edge versions.
type PdfJs = typeof import("pdfjs-dist");
let pdfjsPromise: Promise<PdfJs> | null = null;
function loadPdfJs(): Promise<PdfJs> {
  pdfjsPromise ??= (import("pdfjs-dist/legacy/build/pdf.mjs") as Promise<PdfJs>).then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerPort = new Worker(new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url), {
      type: "module",
      name: "pdfjs",
    });
    return pdfjs;
  });
  return pdfjsPromise;
}

interface PageSize {
  width: number;
  height: number;
}

const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];

export default function PdfPreview({ blob }: { blob: Blob }) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [sizes, setSizes] = useState<PageSize[]>([]);
  const [failed, setFailed] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(2); // 100% = fit width
  const [current, setCurrent] = useState(1);
  const [width, setWidth] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Load the document.
  useEffect(() => {
    let cancelled = false;
    let task: ReturnType<PdfJs["getDocument"]> | null = null;
    (async () => {
      try {
        const pdfjs = await loadPdfJs();
        const data = new Uint8Array(await blob.arrayBuffer());
        if (cancelled) return;
        task = pdfjs.getDocument({ data });
        const loaded = await task.promise;
        const pageSizes: PageSize[] = [];
        for (let i = 1; i <= loaded.numPages; i++) {
          const page = await loaded.getPage(i);
          const vp = page.getViewport({ scale: 1 });
          pageSizes.push({ width: vp.width, height: vp.height });
        }
        if (cancelled) return;
        setSizes(pageSizes);
        setDoc(loaded);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      // Destroying the loading task tears down the document and frees its worker-side memory.
      void task?.destroy();
    };
  }, [blob]);

  // Track available width for "fit width".
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Which page is most visible?
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || sizes.length === 0) return;
    const ratios = new Map<number, number>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => ratios.set(Number((e.target as HTMLElement).dataset.page), e.intersectionRatio));
        let best = 1;
        let bestRatio = -1;
        ratios.forEach((r, p) => {
          if (r > bestRatio) {
            best = p;
            bestRatio = r;
          }
        });
        setCurrent(best);
      },
      { root, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    pageRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [sizes]);

  // Fullscreen: native API where supported, CSS overlay otherwise (e.g. iPhone Safari).
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setFullscreen(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggleFullscreen = async () => {
    const el = rootRef.current;
    if (!el) return;
    if (fullscreen) {
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
      setFullscreen(false);
      return;
    }
    setFullscreen(true);
    if (el.requestFullscreen) await el.requestFullscreen().catch(() => undefined);
  };
  useEffect(() => {
    if (!fullscreen || document.fullscreenElement) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFullscreen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  const goTo = useCallback((page: number) => {
    const el = pageRefs.current[page - 1];
    const root = scrollRef.current;
    if (!el || !root) return;
    root.scrollTo({ top: el.offsetTop - 16, behavior: "smooth" });
  }, []);

  const pageCount = sizes.length;
  const zoom = ZOOMS[zoomIndex];
  const maxPageWidth = Math.max(1, ...sizes.map((s) => s.width));
  // "100%" means the widest page fits the viewer width.
  const baseScale = width > 0 ? Math.min((width - 32) / maxPageWidth, 2.5) : 0;
  const scale = baseScale * zoom;

  return (
    <div
      ref={rootRef}
      className={`flex flex-col overflow-hidden bg-[#dfe4ea] dark:bg-[#0b0f12] ${
        fullscreen ? "fixed inset-0 z-50" : "h-[min(72vh,760px)] min-h-[420px] rounded-xl ring-1 ring-rule"
      }`}
      role="region"
      aria-label="PDF preview"
    >
      <div className="flex items-center gap-1 border-b border-rule bg-surface px-2 py-1.5 sm:gap-2 sm:px-3">
        <ToolButton label="Previous page" onClick={() => goTo(current - 1)} disabled={current <= 1}>
          <ChevronUp className="size-4" aria-hidden />
        </ToolButton>
        <ToolButton label="Next page" onClick={() => goTo(current + 1)} disabled={current >= pageCount}>
          <ChevronDown className="size-4" aria-hidden />
        </ToolButton>
        <p className="tabular px-1 text-[13px] text-graphite" aria-live="polite">
          Page <span className="font-medium text-ink">{pageCount ? current : "–"}</span> of {pageCount || "–"}
        </p>
        <div className="ml-auto flex items-center gap-1">
          <ToolButton label="Zoom out" onClick={() => setZoomIndex((z) => Math.max(0, z - 1))} disabled={zoomIndex === 0}>
            <Minus className="size-4" aria-hidden />
          </ToolButton>
          <button
            type="button"
            onClick={() => setZoomIndex(2)}
            className="tabular hidden h-8 min-w-14 rounded-lg px-2 text-xs font-medium text-graphite hover:bg-surface-2 hover:text-ink sm:block"
            aria-label="Fit to width"
            title="Fit to width"
          >
            {Math.round(zoom * 100)}%
          </button>
          <ToolButton
            label="Zoom in"
            onClick={() => setZoomIndex((z) => Math.min(ZOOMS.length - 1, z + 1))}
            disabled={zoomIndex === ZOOMS.length - 1}
          >
            <Plus className="size-4" aria-hidden />
          </ToolButton>
          <span className="mx-1 h-5 w-px bg-rule" aria-hidden />
          <ToolButton label={fullscreen ? "Exit full screen" : "Full screen"} onClick={toggleFullscreen}>
            {fullscreen ? <Minimize2 className="size-4" aria-hidden /> : <Maximize2 className="size-4" aria-hidden />}
          </ToolButton>
        </div>
      </div>

      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-auto overscroll-contain">
        {failed ? (
          <p className="p-8 text-center text-sm text-graphite">
            Preview isn&apos;t available in this browser, but your PDF is ready to download.
          </p>
        ) : !doc ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-48 w-36 animate-pulse rounded-[3px] bg-white/70 shadow-paper" aria-label="Loading preview" />
          </div>
        ) : (
          <div className="flex w-max min-w-full flex-col items-center gap-4 p-4">
            {sizes.map((size, i) => (
              <div
                key={i}
                ref={(el) => {
                  pageRefs.current[i] = el;
                }}
                data-page={i + 1}
                className="relative shrink-0 bg-white shadow-paper"
                style={{ width: size.width * scale, height: size.height * scale }}
              >
                <PdfPageCanvas doc={doc} pageNumber={i + 1} scale={scale} root={scrollRef} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Renders one page when it's near the viewport and frees the bitmap when it's far away. */
function PdfPageCanvas({
  doc,
  pageNumber,
  scale,
  root,
}: {
  doc: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  root: React.RefObject<HTMLDivElement | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      root: root.current,
      rootMargin: "150% 0px",
    });
    io.observe(canvas);
    return () => io.disconnect();
  }, [root]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || scale <= 0) return;
    if (!visible) {
      canvas.width = 0;
      canvas.height = 0;
      return;
    }
    let task: RenderTask | null = null;
    let cancelled = false;
    // Debounce so rapid zooming doesn't queue many renders.
    const timer = setTimeout(async () => {
      try {
        const page = await doc.getPage(pageNumber);
        if (cancelled) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: scale * dpr });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        task = page.render({ canvas, viewport });
        await task.promise;
      } catch {
        /* render cancelled (zoom/scroll) or document closed */
      }
    }, 60);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      task?.cancel();
    };
  }, [doc, pageNumber, scale, visible]);

  return <canvas ref={canvasRef} className="absolute inset-0 size-full" aria-label={`Page ${pageNumber}`} role="img" />;
}

function ToolButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex size-8 items-center justify-center rounded-lg text-graphite hover:bg-surface-2 hover:text-ink disabled:opacity-35"
    >
      {children}
    </button>
  );
}
