import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { PDFDocument, PDFName, PDFRawStream } from "pdf-lib";
import { makeImage } from "./fixtures";

test("PNG to PDF landing page: SEO, lossless default, conversion", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop only");
  await page.goto("/png-to-pdf");

  await expect(page).toHaveTitle("Free PNG to PDF Converter Online");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Convert PNG images to PDF quickly and easily with our free online PNG to PDF converter. Fast, simple, secure, and easy to use.",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/png-to-pdf$/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "Free PNG to PDF Converter Online");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /png-to-pdf\/opengraph-image/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Free PNG to PDF Converter Online");
  await expect(
    page.getByText("Convert PNG images to PDF quickly and easily with our free online PNG to PDF converter. Fast, simple, secure, and easy to use.", { exact: true }),
  ).toBeVisible();
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(ld["@graph"][1].mainEntity[0].name).toBe("How do I convert PNG to PDF?");
  await expect(page.getByRole("link", { name: "PNG to PDF", exact: true }).first()).toHaveAttribute("aria-current", "page");

  // A transparent PNG, converted with the page's default (Maximum) quality.
  const png = await makeImage(page, { name: "screenshot.png", width: 900, height: 600, color: "#2563eb", type: "image/png", transparent: true, label: "PNG" });
  await page.locator('input[type="file"]').setInputFiles([png]);
  await expect(page.getByText("900 × 600")).toBeVisible();
  await expect(page.getByRole("radio", { name: "Maximum" })).toBeChecked();
  await page.getByRole("button", { name: "Convert to PDF" }).first().click();
  await expect(page.getByRole("heading", { name: "Your PDF is ready!" })).toBeVisible({ timeout: 30_000 });

  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download PDF" }).click()]);
  const doc = await PDFDocument.load(await readFile((await download.path())!));
  expect(doc.getPageCount()).toBe(1);
  // Lossless: the image is stored Flate-compressed (not JPEG/DCT) at full resolution, with an alpha mask.
  const images = doc.context
    .enumerateIndirectObjects()
    .map(([, obj]) => obj)
    .filter((o): o is PDFRawStream => o instanceof PDFRawStream && o.dict.get(PDFName.of("Subtype")) === PDFName.of("Image"));
  const main = images.find((o) => o.dict.get(PDFName.of("SMask")));
  expect(main).toBeTruthy();
  expect(String(main!.dict.get(PDFName.of("Filter")))).toBe("/FlateDecode");
  expect(Number(String(main!.dict.get(PDFName.of("Width"))))).toBe(900);
});

test("home page keeps its own title and links to the PNG page", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop only");
  await page.goto("/");
  await expect(page).toHaveTitle("Image to PDF Converter – Convert JPG, PNG & WEBP to PDF");
  await expect(page.getByRole("radio", { name: "High" })).toHaveCount(0); // settings only render once images exist
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "PNG to PDF" }).click();
  await expect(page).toHaveURL(/\/png-to-pdf$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Free PNG to PDF Converter Online");
  const sitemap = await (await page.request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/png-to-pdf");
  expect((await page.request.get("/png-to-pdf/opengraph-image")).headers()["content-type"]).toBe("image/png");
});
