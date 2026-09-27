import { renderOgImage, ogSize } from "@/lib/og-image";
import { site } from "@/lib/site";

export const alt = `${site.name} — Convert images to PDF in your browser`;
export const size = ogSize;
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderOgImage("Convert images to PDF in seconds", "JPG, PNG and WEBP to PDF. Processed in your browser, never stored.");
}
