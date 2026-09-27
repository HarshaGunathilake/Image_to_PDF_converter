"use client";

import { computeLayout, type Rotation } from "@/lib/pdf/layout";
import type { PdfSettings } from "@/lib/pdf/settings";

interface Props {
  thumbUrl: string | null;
  width: number;
  height: number;
  rotation: Rotation;
  settings: PdfSettings;
  alt: string;
  /** Box the page is fitted into. */
  className?: string;
}

/**
 * A miniature of the real PDF page: same page proportions, margins, fit and rotation
 * the generator will use (it calls the exact same layout function).
 */
export function PagePreview({ thumbUrl, width, height, rotation, settings, alt, className }: Props) {
  const ready = thumbUrl && width > 0 && height > 0;
  const layout = computeLayout(ready ? width : 3, ready ? height : 4, rotation, settings);
  const { pageWidth: pw, pageHeight: ph } = layout;

  // Convert PDF coordinates (origin bottom-left) into CSS percentages (origin top-left).
  const clip = layout.clip ?? { x: 0, y: 0, width: pw, height: ph };
  const img = layout.image;
  const clipStyle = {
    left: `${(clip.x / pw) * 100}%`,
    top: `${((ph - clip.y - clip.height) / ph) * 100}%`,
    width: `${(clip.width / pw) * 100}%`,
    height: `${(clip.height / ph) * 100}%`,
  };
  const imgStyle = {
    left: `${((img.x - clip.x) / clip.width) * 100}%`,
    top: `${((clip.y + clip.height - img.y - img.height) / clip.height) * 100}%`,
    width: `${(img.width / clip.width) * 100}%`,
    height: `${(img.height / clip.height) * 100}%`,
  };
  const sideways = rotation === 90 || rotation === 270;

  return (
    <div className={`flex items-center justify-center ${className ?? ""}`}>
      <div
        className="relative max-h-full max-w-full bg-white shadow-paper ring-1 ring-black/5 transition-[aspect-ratio] duration-200"
        style={{
          aspectRatio: `${pw} / ${ph}`,
          // Fill whichever dimension is limiting.
          height: pw / ph > 1 ? "auto" : "100%",
          width: pw / ph > 1 ? "100%" : "auto",
          borderRadius: 2,
        }}
      >
        {ready ? (
          <div className="absolute overflow-hidden" style={clipStyle}>
            <div className="absolute" style={imgStyle}>
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob URL */}
              <img
                src={thumbUrl}
                alt={alt}
                draggable={false}
                decoding="async"
                className="absolute left-1/2 top-1/2 max-w-none select-none"
                style={{
                  width: sideways ? `${(img.height / img.width) * 100}%` : "100%",
                  height: sideways ? `${(img.width / img.height) * 100}%` : "100%",
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                }}
              />
            </div>
          </div>
        ) : (
          <div className="absolute inset-[12%] animate-pulse rounded-sm bg-slate-200/80" aria-hidden />
        )}
      </div>
    </div>
  );
}
