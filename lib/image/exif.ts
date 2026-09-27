/**
 * Minimal JPEG EXIF orientation reader.
 * Browsers auto-rotate decoded images, but raw JPEG bytes embedded straight into a PDF are not rotated,
 * so we need to know whether a JPEG can be embedded as-is (orientation 1) or must be re-encoded.
 * Returns 1–8, or 1 when no orientation tag is present / the data is not a JPEG.
 */
export function readJpegOrientation(buffer: ArrayBuffer): number {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return 1;

  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset);
    if ((marker & 0xff00) !== 0xff00) return 1;
    const size = view.getUint16(offset + 2);
    if (marker === 0xffe1 && offset + 10 <= view.byteLength && view.getUint32(offset + 4) === 0x45786966 /* "Exif" */) {
      return readTiffOrientation(view, offset + 10);
    }
    if (marker === 0xffda /* start of scan */) return 1;
    offset += 2 + size;
  }
  return 1;
}

function readTiffOrientation(view: DataView, tiff: number): number {
  if (tiff + 8 > view.byteLength) return 1;
  const little = view.getUint16(tiff) === 0x4949;
  const ifd = tiff + view.getUint32(tiff + 4, little);
  if (ifd + 2 > view.byteLength) return 1;
  const entries = view.getUint16(ifd, little);
  for (let i = 0; i < entries; i++) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > view.byteLength) return 1;
    if (view.getUint16(entry, little) === 0x0112) {
      const value = view.getUint16(entry + 8, little);
      return value >= 1 && value <= 8 ? value : 1;
    }
  }
  return 1;
}
