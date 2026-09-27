import { Converter, type ConverterProps } from "@/components/Converter";
import { Faq } from "@/components/sections/Faq";
import { Features } from "@/components/sections/Features";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Privacy } from "@/components/sections/Privacy";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import type { FaqItem } from "@/lib/content";
import { site } from "@/lib/site";

interface Props extends ConverterProps {
  /** Route path, e.g. "/" or "/png-to-pdf" — used for structured data. */
  path: string;
  /** Name and description for the WebApplication structured data. */
  appName: string;
  description: string;
  featureList: string[];
  faq: FaqItem[];
  faqIntro: string;
}

/** Shared layout for the converter landing pages (home and per-format pages). */
export function LandingPage({ path, appName, description, featureList, faq, faqIntro, ...converter }: Props) {
  const url = `${site.url}${path === "/" ? "/" : path}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: appName,
        url,
        description,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any (web browser)",
        browserRequirements: "Requires JavaScript and a modern web browser",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        featureList,
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <SiteHeader />
      <main>
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-16">
          <Converter {...converter} />
        </div>
        <div className="mx-auto max-w-6xl space-y-20 px-4 pb-24 sm:space-y-28 sm:px-6">
          <HowItWorks />
          <Features />
          <Privacy />
          <Faq items={faq} intro={faqIntro} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
