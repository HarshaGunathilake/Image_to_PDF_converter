import { expect, test, type Page } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { makeBmp, makeImage, withExifOrientation, type FilePayload } from "./fixtures";

const A4 = { w: 595.28, h: 841.89 };

/** Track object URLs so we can assert temporary resources are released. */
async function trackObjectUrls(page: Page) {
  await page.addInitScript(() => {
    const live = new Set<string>();
    const create = URL.createObjectURL.bind(URL);
    const revoke = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = (obj: Blob | MediaSource) => {
      const u = create(obj);
      live.add(u);
      return u;
    };
    URL.revokeObjectURL = (u: string) => {
      live.delete(u);
      revoke(u);
    };
    (window as unknown as { __liveUrls: () => number }).__liveUrls = () => live.size;
  });
}

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

async function fixtures(page: Page) {
  const red = await makeImage(page, { name: "a-landscape.jpg", width: 1200, height: 800, color: "#c0392b", type: "image/jpeg", label: "A" });
  const green = await makeImage(page, { name: "b-portrait.png", width: 600, height: 900, color: "#27ae60", type: "image/png", transparent: true, label: "B" });
  const blue = await makeImage(page, { name: "c-square.webp", width: 800, height: 800, color: "#2980b9", type: "image/webp", label: "C" });
  const exifBase = await makeImage(page, { name: "d-rotated.jpg", width: 800, height: 400, color: "#8e44ad", type: "image/jpeg", label: "D" });
  const exif: FilePayload = { ...exifBase, buffer: withExifOrientation(exifBase.buffer, 6) };
  const bmp: FilePayload = { name: "e-small.bmp", mimeType: "image/bmp", buffer: makeBmp(100, 50, [240, 180, 20]) };
  return { red, green, blue, exif, bmp };
}

const fileInput = (page: Page) => page.locator('input[type="file"]');
const cardNames = (page: Page) =>
  page.locator('ol[aria-label="Pages in your PDF"] > li p[title]').allTextContents();

async function pickSetting(page: Page, legend: string, label: string) {
  await page.locator("fieldset", { has: page.locator("legend", { hasText: legend }) }).getByText(label, { exact: true }).click();
}

async function downloadPdf(page: Page) {
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download PDF" }).click()]);
  const path = await download.path();
  const bytes = await readFile(path!);
  return { name: download.suggestedFilename(), doc: await PDFDocument.load(bytes), bytes };
}

test.describe("desktop", () => {
  test.skip(({ isMobile }) => isMobile, "desktop only");

  test("SEO metadata and landing content", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Image to PDF Converter – Convert JPG, PNG & WEBP to PDF");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Convert images to PDF online for free/);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
    expect(ld["@graph"].map((n: { "@type": string }) => n["@type"])).toEqual(["WebApplication", "FAQPage"]);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Convert Images to PDF in Seconds");
    for (const id of ["how-it-works", "features", "privacy", "faq"]) await expect(page.locator(`#${id}`)).toBeVisible();
  });

  test("full flow: upload, validate, reorder, preview, convert, verify PDF, download, clean up", async ({ page }) => {
    await trackObjectUrls(page);
    const errors = collectErrors(page);
    await page.goto("/");
    const f = await fixtures(page);

    // Upload valid + invalid files together.
    const hugePath = test.info().outputPath("huge.png");
    await writeFile(hugePath, Buffer.alloc(51 * 1024 * 1024, 1));
    // Playwright can't mix buffers with paths, so write everything to disk for this batch.
    const toPath = async (p: FilePayload) => {
      const path = test.info().outputPath(p.name);
      await writeFile(path, p.buffer);
      return path;
    };
    await fileInput(page).setInputFiles([
      ...(await Promise.all([f.red, f.green, f.blue, f.bmp].map(toPath))),
      await toPath({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello") }),
      await toPath({ name: "broken.jpg", mimeType: "image/jpeg", buffer: Buffer.from("this is not really a jpeg") }),
      hugePath,
    ]);
    await expect(page.getByText("This file type isn't supported. Please upload JPG, PNG or WEBP images.")).toBeVisible();
    await expect(page.getByText("This image is too large to process. Please choose a smaller file.")).toBeVisible();
    await expect(page.getByText(/We couldn't read this image/)).toBeVisible();
    await expect(page.getByText("4 images selected")).toBeVisible();
    await expect(page.getByText("1200 × 800")).toBeVisible();

    // Remove one.
    await page.getByRole("button", { name: "Remove e-small.bmp" }).click();
    await expect(page.getByText("3 images selected")).toBeVisible();

    // Add more — EXIF-rotated JPEG should report its displayed dimensions.
    await fileInput(page).setInputFiles([f.exif]);
    await expect(page.getByText("4 images selected")).toBeVisible();
    await expect(page.getByText("400 × 800")).toBeVisible();
    expect(await cardNames(page)).toEqual(["a-landscape.jpg", "b-portrait.png", "c-square.webp", "d-rotated.jpg"]);

    // Keyboard reorder: move the first page one step right.
    const handle = page.getByRole("button", { name: /^Reorder a-landscape\.jpg/ });
    await handle.focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Space");
    await expect.poll(() => cardNames(page)).toEqual(["b-portrait.png", "a-landscape.jpg", "c-square.webp", "d-rotated.jpg"]);

    // Pointer drag: last page to the front.
    const from = await page.getByRole("button", { name: /^Reorder d-rotated\.jpg/ }).boundingBox();
    const to = await page.getByRole("button", { name: "Preview b-portrait.png" }).boundingBox();
    await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2);
    await page.mouse.down();
    await page.mouse.move(from!.x - 20, from!.y, { steps: 5 });
    await page.mouse.move(to!.x + 20, to!.y + to!.height / 2, { steps: 15 });
    await page.mouse.up();
    await expect.poll(() => cardNames(page)).toEqual(["d-rotated.jpg", "b-portrait.png", "a-landscape.jpg", "c-square.webp"]);

    // Button-based move (accessible alternative).
    await page.getByRole("button", { name: "Move c-square.webp earlier" }).focus();
    await page.keyboard.press("Enter");
    await expect.poll(() => cardNames(page)).toEqual(["d-rotated.jpg", "b-portrait.png", "c-square.webp", "a-landscape.jpg"]);

    // Lightbox: open, navigate, zoom, close.
    await page.getByRole("button", { name: "Preview d-rotated.jpg" }).click();
    const dialog = page.getByRole("dialog", { name: /Preview of d-rotated\.jpg/ });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("1 of 4")).toBeVisible();
    await expect(dialog.locator("img")).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("dialog", { name: /b-portrait\.png/ }).getByText("2 of 4")).toBeVisible();
    await page.getByRole("button", { name: "Zoom in" }).click();
    await expect(page.getByRole("button", { name: /Zoom 150 percent/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // Page size = original, no margins → each page exactly matches its image.
    await pickSetting(page, "Page size", "Original");
    await pickSetting(page, "Margins", "None");
    await page.getByRole("button", { name: "Convert to PDF" }).first().click();
    await expect(page.getByRole("heading", { name: "Your PDF is ready!" })).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("dd", { hasText: /^4$/ })).toBeVisible();

    // PDF.js preview rendered the first page.
    const firstCanvas = page.locator('[data-page="1"] canvas');
    // Pixels were actually painted (not just a sized, empty canvas).
    await expect
      .poll(
        async () =>
          firstCanvas.evaluate((c: HTMLCanvasElement) => {
            if (!c.width) return 0;
            const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
            let painted = 0;
            for (let i = 3; i < d.length; i += 400) if (d[i] > 0) painted++;
            return painted;
          }),
        { timeout: 15_000 },
      )
      .toBeGreaterThan(0);
    await expect(page.getByText(/Page\s*1\s*of 4/)).toBeVisible();

    const first = await downloadPdf(page);
    expect(first.name).toMatch(/^converted-images-\d{4}-\d{2}-\d{2}\.pdf$/);
    const sizes = first.doc.getPages().map((p) => p.getSize()).map(({ width, height }) => [Math.round(width), Math.round(height)]);
    // d: 800×400 with EXIF 6 → 400×800 px; b: 600×900; c: 800×800; a: 1200×800 (px × 0.75 = pt)
    expect(sizes).toEqual([
      [300, 600],
      [450, 675],
      [600, 600],
      [900, 600],
    ]);
    expect(first.doc.getTitle()).toBeTruthy();

    // Convert More Images keeps the images; change settings and rotate one.
    await page.getByRole("button", { name: "Convert More Images" }).click();
    await expect(page.getByText("4 images selected")).toBeVisible();
    await pickSetting(page, "Page size", "A4");
    await pickSetting(page, "Image fit", "Fill");
    await pickSetting(page, "Image quality", "Standard");
    await page.getByRole("button", { name: "Rotate d-rotated.jpg" }).click({ force: true });
    await page.getByRole("button", { name: "Convert to PDF" }).first().click();
    await expect(page.getByRole("heading", { name: "Your PDF is ready!" })).toBeVisible({ timeout: 30_000 });
    // Rename before downloading.
    await page.getByLabel("File name").fill("my scans / final");
    const second = await downloadPdf(page);
    expect(second.name).toBe("my scans - final.pdf");
    const a4 = second.doc.getPages().map((p) => p.getSize());
    expect(a4).toHaveLength(4);
    // Page 1 was 400×800 portrait, rotated 90° → landscape → auto orientation gives landscape A4.
    expect(a4[0].width).toBeCloseTo(A4.h, 1);
    expect(a4[1].width).toBeCloseTo(A4.w, 1);
    expect(a4[3].width).toBeCloseTo(A4.h, 1);

    // Start over releases everything (only the two download URLs may still be pending release).
    await page.getByRole("button", { name: "Start Over" }).click();
    await expect(page.getByText("Drop your images here")).toBeVisible();
    const live = await page.evaluate(() => (window as unknown as { __liveUrls: () => number }).__liveUrls());
    expect(live).toBeLessThanOrEqual(2);

    expect(errors.filter((e) => !/Failed to load resource/.test(e))).toEqual([]);
  });

  test("large image at maximum quality, and cancel", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    const big = await makeImage(page, { name: "big.jpg", width: 6000, height: 4000, color: "#34495e", type: "image/jpeg", noise: true });
    await fileInput(page).setInputFiles([big]);
    await expect(page.getByText("6000 × 4000")).toBeVisible({ timeout: 20_000 });
    await pickSetting(page, "Image quality", "Maximum");
    await page.getByRole("button", { name: "Convert to PDF" }).first().click();
    await expect(page.getByRole("heading", { name: "Your PDF is ready!" })).toBeVisible({ timeout: 60_000 });
    const pdf = await downloadPdf(page);
    expect(pdf.doc.getPageCount()).toBe(1);
    // Maximum embeds the original JPEG untouched: the PDF is barely bigger than the source.
    expect(pdf.bytes.length).toBeLessThan(big.buffer.length + 20_000);

    // Cancel: many images, cancel as soon as progress appears.
    await page.getByRole("button", { name: "Start Over" }).click();
    const many: typeof big[] = [];
    for (let i = 0; i < 12; i++) {
      many.push(await makeImage(page, { name: `p${i}.webp`, width: 3000, height: 2200, color: "#16a085", type: "image/webp", noise: true }));
    }
    await fileInput(page).setInputFiles(many);
    await expect(page.getByText("12 images selected")).toBeVisible();
    await expect(page.getByRole("button", { name: "Convert to PDF" }).first()).toBeEnabled({ timeout: 30_000 });
    await page.getByRole("button", { name: "Convert to PDF" }).first().click();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("progressbar")).toHaveCount(0);
    await expect(page.getByText("12 images selected")).toBeVisible();
    // Converting again after a cancel still works.
    await page.getByRole("button", { name: "Convert to PDF" }).first().click();
    await expect(page.getByRole("heading", { name: "Your PDF is ready!" })).toBeVisible({ timeout: 60_000 });
    expect(errors.filter((e) => !/Failed to load resource/.test(e))).toEqual([]);
  });

  test("nothing survives a page refresh", async ({ page }) => {
    await page.goto("/");
    const img = await makeImage(page, { name: "x.png", width: 300, height: 300, color: "#e67e22", type: "image/png" });
    await fileInput(page).setInputFiles([img]);
    await expect(page.getByText("1 image selected")).toBeVisible();
    await page.reload();
    await expect(page.getByText("Drop your images here")).toBeVisible();
    await expect(page.getByText(/image selected/)).toHaveCount(0);
  });

  test("drag and drop files onto the page", async ({ page }) => {
    await page.goto("/");
    const img = await makeImage(page, { name: "dropped.png", width: 320, height: 200, color: "#2c3e50", type: "image/png" });
    const dataTransfer = await page.evaluateHandle(
      ({ b64, name }) => {
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        const dt = new DataTransfer();
        dt.items.add(new File([bytes], name, { type: "image/png" }));
        return dt;
      },
      { b64: img.buffer.toString("base64"), name: img.name },
    );
    const tray = page.locator(".tray-border");
    await tray.dispatchEvent("dragenter", { dataTransfer });
    await expect(page.getByText("Release to add your images")).toBeVisible();
    await tray.dispatchEvent("drop", { dataTransfer });
    await expect(page.getByText("1 image selected")).toBeVisible();
    await expect(page.getByText("320 × 200")).toBeVisible();
  });
});

test("mobile layout @mobile", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile project only");
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  const f = await fixtures(page);
  await fileInput(page).setInputFiles([f.red, f.green, f.blue]);
  await expect(page.getByText("3 images selected")).toBeVisible();
  // Settings are collapsed into an accordion.
  const toggle = page.getByRole("button", { name: /PDF settings/ });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await pickSetting(page, "Margins", "Large");
  // No horizontal scrolling.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  // Sticky convert button.
  const convert = page.getByRole("button", { name: "Convert to PDF" }).last();
  await expect(convert).toBeInViewport();
  await convert.click();
  await expect(page.getByRole("heading", { name: "Your PDF is ready!" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Download PDF" })).toBeInViewport();
  const pdf = await downloadPdf(page);
  expect(pdf.doc.getPageCount()).toBe(3);
});
