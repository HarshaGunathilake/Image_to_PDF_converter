import { describe, expect, it } from "vitest";
import { computeLayout, rotatedDrawArgs } from "@/lib/pdf/layout";
import { DEFAULT_SETTINGS, MARGIN_POINTS, PAGE_DIMENSIONS, type PdfSettings } from "@/lib/pdf/settings";

const s = (over: Partial<PdfSettings>): PdfSettings => ({ ...DEFAULT_SETTINGS, ...over });
const [A4W, A4H] = PAGE_DIMENSIONS.a4;

describe("computeLayout", () => {
  it("auto orientation picks landscape for wide images", () => {
    const l = computeLayout(4000, 3000, 0, s({ orientation: "auto" }));
    expect(l.pageWidth).toBeCloseTo(A4H);
    expect(l.pageHeight).toBeCloseTo(A4W);
  });

  it("auto orientation picks portrait for tall images", () => {
    const l = computeLayout(3000, 4000, 0, s({ orientation: "auto" }));
    expect(l.pageWidth).toBeCloseTo(A4W);
  });

  it("rotation by 90° swaps the orientation decision", () => {
    const l = computeLayout(4000, 3000, 90, s({ orientation: "auto" }));
    expect(l.pageWidth).toBeCloseTo(A4W);
    expect(l.pageHeight).toBeCloseTo(A4H);
  });

  it("forced portrait stays portrait", () => {
    const l = computeLayout(4000, 1000, 0, s({ orientation: "portrait" }));
    expect(l.pageWidth).toBeCloseTo(A4W);
  });

  it("fit keeps the image inside the margins, centred, without clipping", () => {
    const m = MARGIN_POINTS.medium;
    const l = computeLayout(1000, 1000, 0, s({ orientation: "portrait", margin: "medium", fit: "fit" }));
    expect(l.image.width).toBeCloseTo(A4W - 2 * m);
    expect(l.image.x).toBeCloseTo(m);
    expect(l.image.y + l.image.height / 2).toBeCloseTo(A4H / 2);
    expect(l.clip).toBeNull();
  });

  it("fill covers the content box and clips the overflow", () => {
    const l = computeLayout(1000, 1000, 0, s({ orientation: "portrait", margin: "none", fit: "fill" }));
    expect(l.image.height).toBeCloseTo(A4H);
    expect(l.image.width).toBeGreaterThan(A4W);
    expect(l.clip).toEqual({ x: 0, y: 0, width: A4W, height: A4H });
  });

  it("original size does not upscale small images", () => {
    const l = computeLayout(200, 100, 0, s({ fit: "original" }));
    expect(l.image.width).toBeCloseTo(150);
    expect(l.image.height).toBeCloseTo(75);
  });

  it("original size shrinks images that are bigger than the page", () => {
    const l = computeLayout(8000, 2000, 0, s({ fit: "original", margin: "none" }));
    expect(l.image.width).toBeCloseTo(A4H);
  });

  it("original page size wraps the image plus margins", () => {
    const m = MARGIN_POINTS.small;
    const l = computeLayout(800, 600, 0, s({ pageSize: "original", margin: "small" }));
    expect(l.pageWidth).toBeCloseTo(600 + 2 * m);
    expect(l.pageHeight).toBeCloseTo(450 + 2 * m);
  });

  it("original page size is capped at the PDF maximum", () => {
    const l = computeLayout(40000, 1000, 0, s({ pageSize: "original", margin: "none" }));
    expect(l.pageWidth).toBeLessThanOrEqual(14400);
  });
});

describe("rotatedDrawArgs", () => {
  const box = { x: 10, y: 20, width: 300, height: 200 };
  it("0° is unchanged", () => expect(rotatedDrawArgs(box, 0)).toMatchObject({ ...box, degrees: 0 }));
  it("90° swaps size and anchors top-left", () =>
    expect(rotatedDrawArgs(box, 90)).toEqual({ x: 10, y: 220, width: 200, height: 300, degrees: -90 }));
  it("180° anchors top-right", () =>
    expect(rotatedDrawArgs(box, 180)).toEqual({ x: 310, y: 220, width: 300, height: 200, degrees: 180 }));
  it("270° anchors bottom-right", () =>
    expect(rotatedDrawArgs(box, 270)).toEqual({ x: 310, y: 20, width: 200, height: 300, degrees: 90 }));
});
