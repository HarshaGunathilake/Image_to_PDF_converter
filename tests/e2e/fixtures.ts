import type { Page } from "@playwright/test";

export interface FilePayload {
  name: string;
  mimeType: string;
  buffer: Buffer;
}

/** Render a solid-colour image with a big label, encoded by the browser. */
export async function makeImage(
  page: Page,
  opts: { name: string; width: number; height: number; color: string; type: "image/jpeg" | "image/png" | "image/webp"; transparent?: boolean; label?: string; noise?: boolean },
): Promise<FilePayload> {
  const base64 = await page.evaluate(async (o) => {
    const c = new OffscreenCanvas(o.width, o.height);
    const ctx = c.getContext("2d")!;
    if (o.transparent) {
      ctx.clearRect(0, 0, o.width, o.height);
      ctx.fillStyle = o.color;
      ctx.beginPath();
      ctx.arc(o.width / 2, o.height / 2, Math.min(o.width, o.height) / 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = o.color;
      ctx.fillRect(0, 0, o.width, o.height);
    }
    if (o.noise) {
      // Photographic-ish content so encoders produce realistic file sizes.
      for (let i = 0; i < 4000; i++) {
        ctx.fillStyle = `hsl(${(i * 37) % 360} 60% 50% / 0.5)`;
        ctx.fillRect((i * 7919) % o.width, (i * 104729) % o.height, 40, 40);
      }
    }
    if (o.label) {
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.round(Math.min(o.width, o.height) / 3)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(o.label, o.width / 2, o.height / 2);
    }
    const blob = await c.convertToBlob({ type: o.type, quality: 0.9 });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }, opts);
  return { name: opts.name, mimeType: opts.type, buffer: Buffer.from(base64, "base64") };
}

/** Insert an EXIF APP1 segment carrying the given orientation right after the JPEG SOI marker. */
export function withExifOrientation(jpeg: Buffer, orientation: number): Buffer {
  const app1 = Buffer.from([
    0xff, 0xe1, 0x00, 0x22, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00,
    0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08,
    0x00, 0x01, 0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, orientation, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
  ]);
  return Buffer.concat([jpeg.subarray(0, 2), app1, jpeg.subarray(2)]);
}

/** Minimal 24-bit BMP. */
export function makeBmp(width: number, height: number, rgb: [number, number, number]): Buffer {
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const size = 54 + rowSize * height;
  const b = Buffer.alloc(size);
  b.write("BM", 0);
  b.writeUInt32LE(size, 2);
  b.writeUInt32LE(54, 10);
  b.writeUInt32LE(40, 14);
  b.writeInt32LE(width, 18);
  b.writeInt32LE(height, 22);
  b.writeUInt16LE(1, 26);
  b.writeUInt16LE(24, 28);
  b.writeUInt32LE(rowSize * height, 34);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const o = 54 + y * rowSize + x * 3;
      b[o] = rgb[2];
      b[o + 1] = rgb[1];
      b[o + 2] = rgb[0];
    }
  return b;
}
