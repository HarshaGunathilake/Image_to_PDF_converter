import {
  ArrowDownUp,
  EyeIcon,
  Files,
  Gauge,
  Hand,
  Ruler,
  ShieldCheck,
  Smartphone,
  SlidersHorizontal,
} from "lucide-react";

const FEATURES = [
  { icon: Files, title: "Multiple images", body: "Combine up to 200 images into one PDF, one image per page." },
  { icon: Hand, title: "Drag & drop", body: "Drop files anywhere on the page, or paste an image from your clipboard." },
  { icon: ArrowDownUp, title: "Image reordering", body: "Drag pages into place, sort by name, or rotate any image." },
  { icon: EyeIcon, title: "PDF preview", body: "Page through the finished PDF before you download it." },
  { icon: Ruler, title: "Custom page sizes", body: "A4, Letter, A3 or pages that match each image, with margins." },
  { icon: SlidersHorizontal, title: "Quality controls", body: "Pick a small file for email or full resolution for print." },
  { icon: Gauge, title: "Fast browser processing", body: "Conversion runs in the background, so the page never freezes." },
  { icon: ShieldCheck, title: "No file storage", body: "Nothing is uploaded, so there's nothing to keep or delete." },
  { icon: Smartphone, title: "Mobile friendly", body: "Pick photos from your camera roll and save the PDF to your phone." },
];

export function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="scroll-mt-20 grid gap-10 lg:grid-cols-[280px_1fr] lg:gap-16">
      <div>
        <h2 id="features-title" className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Features
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-graphite">
          Everything you need to turn photos, scans and screenshots into a clean document, and nothing you don&apos;t.
        </p>
      </div>
      <ul className="grid gap-x-10 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-3.5">
            <Icon className="mt-0.5 size-5 shrink-0 text-teal" strokeWidth={1.75} aria-hidden />
            <div>
              <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-graphite">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
