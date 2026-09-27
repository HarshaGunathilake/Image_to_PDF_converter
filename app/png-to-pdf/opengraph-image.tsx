import { renderOgImage, ogSize } from "@/lib/og-image";

export const alt = "Free PNG to PDF Converter Online";
export const size = ogSize;
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderOgImage(
    "Free PNG to PDF Converter Online",
    "Convert PNG images to PDF quickly and easily with our free online PNG to PDF converter. Fast, simple, secure, and easy to use.",
  );
}
