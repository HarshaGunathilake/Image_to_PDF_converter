import { LandingPage } from "@/components/LandingPage";
import { FAQ } from "@/lib/content";
import { site } from "@/lib/site";

export default function Home() {
  return (
    <LandingPage
      path="/"
      appName={`${site.name} ${site.tagline}`}
      description={site.description}
      featureList={[
        "Convert JPG, PNG, WEBP, GIF, BMP and AVIF images to PDF",
        "Combine multiple images into one PDF",
        "Drag and drop reordering",
        "A4, Letter, A3 and original page sizes",
        "Processing in the browser with no file storage",
      ]}
      title="Convert Images to PDF in Seconds"
      intro="Turn JPG, PNG, WEBP and other image files into a single PDF. Fast, simple and secure — with no file storage."
      faq={FAQ}
      faqIntro="Quick answers about converting images to PDF."
    />
  );
}
