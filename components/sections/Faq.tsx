import { Plus } from "lucide-react";
import { FAQ } from "@/lib/content";

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20 grid gap-8 lg:grid-cols-[280px_1fr] lg:gap-16">
      <div>
        <h2 id="faq-title" className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          FAQ
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-graphite">Quick answers about converting images to PDF.</p>
      </div>
      <div className="divide-y divide-rule border-y border-rule">
        {FAQ.map(({ q, a }) => (
          <details key={q} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[16px] font-medium text-ink [&::-webkit-details-marker]:hidden">
              <h3>{q}</h3>
              <Plus
                className="size-5 shrink-0 text-graphite transition-transform duration-200 group-open:rotate-45"
                aria-hidden
              />
            </summary>
            <p className="max-w-[68ch] pb-5 pr-8 text-[15px] leading-relaxed text-graphite">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
