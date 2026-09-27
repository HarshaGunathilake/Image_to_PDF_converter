import { CloudOff, FileText, ImageIcon, Laptop, ShieldCheck } from "lucide-react";

export function Privacy() {
  return (
    <section
      id="privacy"
      aria-labelledby="privacy-title"
      className="scroll-mt-20 overflow-hidden rounded-[20px] bg-surface ring-1 ring-rule"
    >
      <div className="grid lg:grid-cols-2">
        <div className="p-6 sm:p-10">
          <p className="flex items-center gap-2 text-sm font-semibold text-teal">
            <ShieldCheck className="size-4" aria-hidden />
            Private by design
          </p>
          <h2 id="privacy-title" className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Your images never leave your device
          </h2>
          <p className="mt-4 max-w-[60ch] text-[15px] leading-relaxed text-graphite">
            Most online converters upload your files to their servers and promise to delete them later. This one
            doesn&apos;t upload them at all. The conversion runs inside your browser, so your photos, receipts and
            documents stay on your phone or computer the whole time.
          </p>
          <ul className="mt-6 space-y-2.5 text-[15px] text-ink">
            <li className="flex gap-2.5">
              <Dot /> No uploads, no accounts, no file storage
            </li>
            <li className="flex gap-2.5">
              <Dot /> Temporary data is cleared as soon as you remove images or start over
            </li>
            <li className="flex gap-2.5">
              <Dot /> Close the tab and everything is gone
            </li>
          </ul>
        </div>

        {/* Where the data goes, drawn as it actually happens */}
        <div className="flex items-center justify-center border-t border-rule bg-surface-2 p-6 sm:p-10 lg:border-l lg:border-t-0">
          <figure className="w-full max-w-sm">
            <div className="rounded-2xl bg-surface p-5 ring-1 ring-rule">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Laptop className="size-4 text-graphite" aria-hidden />
                Your browser
              </p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex -space-x-3">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="flex size-11 items-center justify-center rounded-md bg-white shadow-paper ring-1 ring-black/5"
                      style={{ transform: `rotate(${(i - 1) * 6}deg)` }}
                    >
                      <ImageIcon className="size-5 text-slate-400" aria-hidden />
                    </span>
                  ))}
                </div>
                <span className="h-px flex-1 bg-teal" aria-hidden />
                <span className="flex h-14 w-11 items-center justify-center rounded-[3px] bg-white shadow-paper ring-1 ring-black/5">
                  <FileText className="size-5 text-teal" aria-hidden />
                </span>
              </div>
              <p className="mt-3 text-xs text-graphite">Images become a PDF right here.</p>
            </div>
            <div className="mx-auto h-8 w-px border-l border-dashed border-rule-strong" aria-hidden />
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-rule-strong p-5">
              <CloudOff className="size-5 shrink-0 text-graphite" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-ink">Our servers</p>
                <p className="text-xs text-graphite">Receive none of your files.</p>
              </div>
            </div>
            <figcaption className="sr-only">
              Images are converted to a PDF inside your browser. No files are sent to our servers.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

function Dot() {
  return <span className="mt-2 size-1.5 shrink-0 rounded-full bg-teal" aria-hidden />;
}
