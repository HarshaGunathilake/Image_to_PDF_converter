import { describe, expect, it } from "vitest";
import { formatBytes, MAX_FILE_BYTES, resolveMime, validateFile } from "@/lib/image/validate";
import { readJpegOrientation } from "@/lib/image/exif";

describe("validateFile", () => {
  const ok = { size: 1000 };
  it("accepts common image types", () => {
    for (const [name, type] of [
      ["a.jpg", "image/jpeg"],
      ["a.png", "image/png"],
      ["a.webp", "image/webp"],
      ["a.gif", "image/gif"],
    ]) {
      expect(validateFile({ name, type, ...ok })).toBeNull();
    }
  });
  it("falls back to the extension when MIME is missing", () => {
    expect(resolveMime({ name: "photo.JPEG", type: "" })).toBe("image/jpeg");
  });
  it("rejects unsupported types even with an image-looking name", () => {
    expect(validateFile({ name: "doc.png", type: "application/pdf", ...ok })).toBe("unsupported");
    expect(validateFile({ name: "photo.heic", type: "image/heic", ...ok })).toBe("unsupported");
    expect(validateFile({ name: "notes.txt", type: "text/plain", ...ok })).toBe("unsupported");
  });
  it("rejects empty and oversized files", () => {
    expect(validateFile({ name: "a.png", type: "image/png", size: 0 })).toBe("empty");
    expect(validateFile({ name: "a.png", type: "image/png", size: MAX_FILE_BYTES + 1 })).toBe("too-large");
  });
});

describe("formatBytes", () => {
  it("formats sizes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(5.5 * 1024 * 1024)).toBe("5.5 MB");
  });
});

describe("readJpegOrientation", () => {
  it("returns 1 for non-JPEG data", () => {
    expect(readJpegOrientation(new Uint8Array([1, 2, 3, 4]).buffer)).toBe(1);
  });
  it("reads orientation 6 from a big-endian EXIF block", () => {
    // SOI, APP1(len 34) "Exif\0\0", TIFF MM header, IFD with 1 entry: 0x0112 SHORT 1 = 6
    const bytes = [
      0xff, 0xd8, 0xff, 0xe1, 0x00, 0x22, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00,
      0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08,
      0x00, 0x01, 0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, 0x06, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
    ];
    expect(readJpegOrientation(new Uint8Array(bytes).buffer)).toBe(6);
  });
});
