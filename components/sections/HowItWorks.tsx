const STEPS = [
  { title: "Upload Images", body: "Select or drag your images into the converter." },
  { title: "Arrange & Customize", body: "Reorder images and choose your PDF settings." },
  { title: "Convert & Download", body: "Create your PDF and download it instantly." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-20">
      <h2 id="how-title" className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        How It Works
      </h2>
      <ol className="relative mt-8 grid gap-8 sm:grid-cols-3 sm:gap-6">
        {/* The rule between the step markers shows they are one sequence */}
        <span className="absolute left-5 right-[calc(33.333%-1.25rem)] top-5 hidden h-px bg-rule-strong sm:block" aria-hidden />
        {STEPS.map((step, i) => (
          <li key={step.title} className="relative flex gap-4 sm:block">
            <span className="tabular relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-[15px] font-semibold text-teal ring-1 ring-rule-strong">
              {i + 1}
            </span>
            <div className="sm:mt-5">
              <h3 className="text-[17px] font-semibold text-ink">{step.title}</h3>
              <p className="mt-1 max-w-[30ch] text-[15px] leading-relaxed text-graphite">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
