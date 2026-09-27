/**
 * Central brand + SEO configuration.
 * Rename the product or change the production URL here — everything else reads from it.
 */
export const site = {
  name: "Pagefold",
  tagline: "Free PNG to PDF Converter",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://pagefold.app").replace(/\/$/, ""),
  title: "Free PNG to PDF Converter Online",
  description:
    "Convert images to PDF online for free. Upload JPG, PNG or WEBP images, arrange them, and create a PDF in seconds. Secure, fast and no file storage.",
  keywords: [
    "image to pdf",
    "jpg to pdf",
    "png to pdf",
    "webp to pdf",
    "convert images to pdf",
    "photo to pdf",
    "combine images into pdf",
    "free pdf converter",
  ],
} as const;
