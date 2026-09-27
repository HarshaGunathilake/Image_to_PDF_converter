import { MAX_FILE_BYTES, MAX_FILES } from "./image/validate";

const maxMb = Math.round(MAX_FILE_BYTES / 1024 / 1024);

/** FAQ copy — rendered on the page and reused for FAQPage structured data. */
export const FAQ: { q: string; a: string }[] = [
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
