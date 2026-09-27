import { MAX_FILE_BYTES, MAX_FILES } from "./image/validate";

const maxMb = Math.round(MAX_FILE_BYTES / 1024 / 1024);

export type FaqItem = { q: string; a: string };

/** FAQ copy — rendered on the page and reused for FAQPage structured data. */
export const FAQ: FaqItem[] = [
  {
    q: "How do I convert images to PDF?",
    a: "Select your images or drag them onto the converter, put them in the order you want, choose a page size if you need something other than A4, and select Convert to PDF. Your PDF is ready to preview and download a moment later.",
  },
  {
    q: "Which image formats are supported?",
    a: "JPG and JPEG, PNG, WEBP, GIF, BMP and AVIF. Transparent areas in PNG, WEBP and GIF images are placed on a white page. Animated GIFs use their first frame. HEIC photos from iPhones aren't supported yet — most iPhones can share photos as JPG instead.",
  },
  {
    q: "Can I convert multiple images into one PDF?",
    a: `Yes. Add up to ${MAX_FILES} images and each one becomes a page in a single PDF, in the order shown in the converter.`,
  },
  {
    q: "Are my images stored?",
    a: "No. Your images are converted inside your own browser and are never uploaded to a server, so there is nothing for us to store. The finished PDF lives only in your browser tab until you download it or close the page.",
  },
  {
    q: "Can I reorder images?",
    a: "Yes. Drag any page by its handle to a new position, or use Sort to order them by file name. Keyboard users can focus a handle, press Space to pick it up, move it with the arrow keys and press Space again to drop it.",
  },
  {
    q: "Does it work on mobile?",
    a: "Yes. It works in current versions of Safari, Chrome, Firefox and Edge on phones and tablets. You can pick photos straight from your camera roll, reorder them with your finger and download the PDF to your device.",
  },
  {
    q: "Is there a file size limit?",
    a: `Each image can be up to ${maxMb} MB. Because everything runs on your device, very large batches depend on how much memory your phone or computer has — if a conversion fails, try Standard quality or fewer images at a time.`,
  },
  {
    q: "Is the converter free?",
    a: "Yes. There's no sign-up, no watermark and no limit on how many PDFs you make.",
  },
];

/** FAQ for the /png-to-pdf landing page. */
export const PNG_FAQ: FaqItem[] = [
  {
    q: "How do I convert PNG to PDF?",
    a: "Select your PNG files or drag them onto the converter, put them in the order you want, and select Convert to PDF. Your PDF is ready to preview and download a moment later.",
  },
  {
    q: "Will my PNG lose quality in the PDF?",
    a: "No. This page uses Maximum quality by default, which places your PNG into the PDF exactly as it is, pixel for pixel, with no re-compression. Screenshots, diagrams and text stay perfectly sharp. Choose Standard or High if you'd rather have a smaller file.",
  },
  {
    q: "What happens to transparent backgrounds?",
    a: "Transparent areas of a PNG appear white in the PDF, just as they would when printed on paper.",
  },
  {
    q: "Can I combine multiple PNG files into one PDF?",
    a: `Yes. Add up to ${MAX_FILES} PNG images and each one becomes a page in a single PDF, in the order shown in the converter. You can mix in JPG, WEBP and other images too.`,
  },
  {
    q: "Can I keep each page the same size as my PNG?",
    a: "Yes. Set Page size to Original and every page will match its image's dimensions — ideal for screenshots and slides. Or choose A4, Letter or A3 for a standard printable document.",
  },
  {
    q: "Are my PNG files uploaded or stored?",
    a: "No. Your PNG images are converted inside your own browser and never uploaded to a server, so there is nothing for us to store. Close the tab and everything is gone.",
  },
  {
    q: "Does it work on mobile?",
    a: "Yes. It works in current versions of Safari, Chrome, Firefox and Edge on phones and tablets, so you can turn screenshots into a PDF right on your phone.",
  },
  {
    q: "Is the PNG to PDF converter free?",
    a: `Yes. There's no sign-up, no watermark and no limit on how many PDFs you make. Each PNG can be up to ${maxMb} MB.`,
  },
];
