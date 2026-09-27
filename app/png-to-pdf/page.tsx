import type { Metadata } from "next";
import { LandingPage } from "@/components/LandingPage";
import { PNG_FAQ } from "@/lib/content";
import { site } from "@/lib/site";

const title = "Free PNG to PDF Converter Online";
const description =
  "Convert PNG images to PDF quickly and easily with our free online PNG to PDF converter. Fast, simple, secure, and easy to use.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  keywords: ["png to pdf", "convert png to pdf", "png to pdf converter", "free png to pdf", "screenshot to pdf", "combine png into pdf"],
  alternates: { canonical: "/png-to-pdf" },
  openGraph: { type: "website", url: "/png-to-pdf", siteName: site.name, title, description, locale: "en_US" },
  twitter: { card: "summary_large_image", title, description },
};

export default function PngToPdfPage() {
  return (
    <LandingPage
      path="/png-to-pdf"
      appName={`${site.name} PNG to PDF Converter`}
      description={description}
      featureList={[
        "Convert PNG images to PDF",
        "Lossless: PNG pixels are embedded without re-compression",
        "Transparent backgrounds become white pages",
        "Combine multiple PNG files into one PDF",
        "A4, Letter, A3 or original image page sizes",
        "Processing in the browser with no file storage",
      ]}
      title={title}
      intro={description}
      initialSettings={{ quality: "maximum" }}
      faq={PNG_FAQ}
      faqIntro="Quick answers about converting PNG images to PDF."
    />
  );
}
