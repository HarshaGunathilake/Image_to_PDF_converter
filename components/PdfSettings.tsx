"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import { OPTION_LABELS, type PdfSettings as Settings } from "@/lib/pdf/settings";

interface Props {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  disabled?: boolean;
}

const QUALITY_HINTS: Record<Settings["quality"], string> = {
  standard: "Smallest file. Good for email and sharing.",
  high: "Sharp enough to print. Balanced file size.",
  maximum: "Full resolution. Largest file.",
};

export function PdfSettings({ settings, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const originalPage = settings.pageSize === "original";

  const summary = [
    OPTION_LABELS.pageSize[settings.pageSize].replace(" image size", ""),
    originalPage ? null : OPTION_LABELS.orientation[settings.orientation],
    originalPage ? null : OPTION_LABELS.fit[settings.fit],
    `${OPTION_LABELS.quality[settings.quality]} quality`,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <section aria-labelledby={`${panelId}-title`}>
      {/* Mobile: collapsible. Desktop: always open. */}
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 py-1 text-left lg:hidden"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          <span id={`${panelId}-title`} className="block text-[15px] font-semibold text-ink">
            PDF settings
          </span>
          <span className="block text-sm text-graphite">{summary}</span>
        </span>
        <ChevronDown className={`size-5 shrink-0 text-graphite transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      <h2 className="hidden text-[15px] font-semibold text-ink lg:block">PDF settings</h2>

      <div id={panelId} className={`${open ? "block" : "hidden"} mt-4 space-y-5 lg:block`}>
        <Segmented
          legend="Page size"
          value={settings.pageSize}
          options={[
            ["a4", "A4"],
            ["letter", "Letter"],
            ["a3", "A3"],
            ["original", "Original"],
          ]}
          onChange={(pageSize) => onChange({ pageSize })}
          disabled={disabled}
          hint={originalPage ? "Each page matches its image's dimensions." : undefined}
        />
        <Segmented
          legend="Orientation"
          value={settings.orientation}
          options={[
            ["portrait", "Portrait"],
            ["landscape", "Landscape"],
            ["auto", "Auto"],
          ]}
          onChange={(orientation) => onChange({ orientation })}
          disabled={disabled || originalPage}
          hint={settings.orientation === "auto" && !originalPage ? "Wide images get landscape pages." : undefined}
        />
        <Segmented
          legend="Image fit"
          value={settings.fit}
          options={[
            ["fit", "Fit"],
            ["fill", "Fill"],
            ["original", "Original"],
          ]}
          labels={{ fit: "Fit to page", fill: "Fill page", original: "Original size" }}
          onChange={(fit) => onChange({ fit })}
          disabled={disabled || originalPage}
          hint={
            originalPage
              ? undefined
              : settings.fit === "fill"
                ? "Covers the page; edges may be cropped."
                : settings.fit === "original"
                  ? "Printed at actual size, shrunk only if too large."
                  : "Whole image visible, scaled to the page."
          }
        />
        <Segmented
          legend="Margins"
          value={settings.margin}
          options={[
            ["none", "None"],
            ["small", "Small"],
            ["medium", "Medium"],
            ["large", "Large"],
          ]}
          onChange={(margin) => onChange({ margin })}
          disabled={disabled}
        />
        <Segmented
          legend="Image quality"
          value={settings.quality}
          options={[
            ["standard", "Standard"],
            ["high", "High"],
            ["maximum", "Maximum"],
          ]}
          onChange={(quality) => onChange({ quality })}
          disabled={disabled}
          hint={QUALITY_HINTS[settings.quality]}
        />
      </div>
    </section>
  );
}

function Segmented<T extends string>({
  legend,
  value,
  options,
  labels,
  onChange,
  disabled,
  hint,
}: {
  legend: string;
  value: T;
  options: [T, string][];
  labels?: Partial<Record<T, string>>;
  onChange: (v: T) => void;
  disabled?: boolean;
  hint?: string;
}) {
  const name = useId();
  return (
    <fieldset disabled={disabled} className="group/fs min-w-0 disabled:opacity-55">
      <legend className="mb-2 text-[13px] font-medium text-graphite">{legend}</legend>
      <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-surface-2 p-1 ring-1 ring-rule">
        {options.map(([v, label]) => (
          <label key={v} className="relative min-w-0">
            <input
              type="radio"
              name={name}
              value={v}
              checked={value === v}
              onChange={() => onChange(v)}
              className="peer sr-only"
              aria-label={labels?.[v] ?? label}
            />
            <span className="flex h-9 cursor-pointer items-center justify-center truncate rounded-lg px-1.5 text-[13px] font-medium text-graphite transition-colors peer-checked:bg-surface peer-checked:text-ink peer-checked:shadow-sm peer-checked:ring-1 peer-checked:ring-rule peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-teal hover:text-ink group-disabled/fs:cursor-not-allowed">
              {label}
            </span>
          </label>
        ))}
      </div>
      {hint ? <p className="mt-1.5 text-xs text-graphite">{hint}</p> : null}
    </fieldset>
  );
}
