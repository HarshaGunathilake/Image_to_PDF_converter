import { expect, test } from "@playwright/test";
import { makeImage } from "./fixtures";

// Simulates browsers without OffscreenCanvas (e.g. older Safari): conversion runs on the main thread.
test("converts without Web Worker / OffscreenCanvas support", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop only");
  await page.goto("/");
  const imgs = [
    await makeImage(page, { name: "one.png", width: 500, height: 700, color: "#27ae60", type: "image/png", transparent: true }),
    await makeImage(page, { name: "two.webp", width: 900, height: 500, color: "#2980b9", type: "image/webp" }),
  ];
  await page.addInitScript(() => {
    // @ts-expect-error — simulate an older browser
    delete window.OffscreenCanvas;
  });
  await page.reload();
  expect(await page.evaluate(() => typeof OffscreenCanvas)).toBe("undefined");
  await page.locator('input[type="file"]').setInputFiles(imgs);
  await expect(page.getByText("900 × 500")).toBeVisible();
  await page.getByRole("button", { name: "Convert to PDF" }).first().click();
  await expect(page.getByRole("heading", { name: "Your PDF is ready!" })).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("dd", { hasText: /^2$/ })).toBeVisible();
});
