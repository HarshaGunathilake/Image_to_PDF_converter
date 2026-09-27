import { Converter } from "@/components/Converter";
import { Faq } from "@/components/sections/Faq";
import { Features } from "@/components/sections/Features";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Privacy } from "@/components/sections/Privacy";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { FAQ } from "@/lib/content";
import { site } from "@/lib/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: `${site.name} ${site.tagline}`,
      url: site.url,
      description: site.description,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any (web browser)",
      browserRequirements: "Requires JavaScript and a modern web browser",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      featureList: [
        "Convert JPG, PNG, WEBP, GIF, BMP and AVIF images to PDF",
        "Combine multiple images into one PDF",
        "Drag and drop reordering",
        "A4, Letter, A3 and original page sizes",
        "Processing in the browser with no file storage",
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <SiteHeader />
      <main>
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-16">
          <Converter />
        </div>
        <div className="mx-auto max-w-6xl space-y-20 px-4 pb-24 sm:space-y-28 sm:px-6">
          <HowItWorks />
          <Features />
          <Privacy />
          <Faq />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
