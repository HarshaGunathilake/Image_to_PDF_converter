import { site } from "@/lib/site";

/** Brand mark: a photo sheet folding over into a document page. */
export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden fill="none">
      <rect x="4" y="3" width="20" height="26" rx="3" className="fill-teal" />
      <path d="M12 7h12.5a3.5 3.5 0 0 1 3.5 3.5V26a3 3 0 0 1-3 3H12a3 3 0 0 1-3-3V10a3 3 0 0 1 3-3Z" className="fill-surface stroke-teal" strokeWidth="2" />
      <path d="M13 22.5l3.6-4.2a1 1 0 0 1 1.5 0l1.6 1.8 1.3-1.4a1 1 0 0 1 1.5 0L25 21.5" className="stroke-teal" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="21" cy="13.5" r="1.8" className="fill-teal" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-tight text-ink">{site.name}</span>
    </span>
  );
}
