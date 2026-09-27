# Pagefold — Image to PDF Converter

A production-ready, privacy-first web app that converts JPG, PNG, WEBP, GIF, BMP and AVIF images into a single PDF — **entirely in the browser**. Files are never uploaded, stored, or sent anywhere.

Built with **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · pdf-lib · PDF.js · dnd-kit**.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

Production:

```bash
npm run build
npm run start
```

Set your public URL (used for canonical links, Open Graph, sitemap and robots) before deploying:

```bash
# .env.local
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

The brand name, title and description live in `lib/site.ts` — change them there and everything (metadata, OG image, JSON-LD, UI) follows.

## Pages

| Route | Title | Notes |
|-------|-------|-------|
| `/` | Image to PDF Converter – Convert JPG, PNG & WEBP to PDF | All formats |
| `/png-to-pdf` | Free PNG to PDF Converter Online | PNG-focused copy and FAQ; defaults to **Maximum** quality so PNGs are embedded losslessly |

Each page is a thin wrapper around `components/LandingPage.tsx` with its own metadata, canonical URL, Open Graph image, FAQ and structured data. To add another format page (e.g. `/jpg-to-pdf`), copy `app/png-to-pdf/`, adjust the copy, add a FAQ list in `lib/content.ts`, and add the route to `app/sitemap.ts`.

## Features

- Multi-image upload: file picker, drag & drop anywhere on the page, or paste from the clipboard
- Live page thumbnails that show **exactly** how each PDF page will look (same layout code as the generator)
- Reorder by drag & drop, keyboard, or move buttons; sort by name; rotate; remove; clear all
- Lightbox preview with zoom and previous/next
- PDF settings: page size (A4 / Letter / A3 / original), orientation (portrait / landscape / auto), fit (fit / fill / original size), margins, quality
- Progress with cancel; duplicate conversions are blocked
- Result screen with an in-page PDF.js viewer (page navigation, zoom, full screen), editable file name, page count, file size and download
- Light / dark theme, fully responsive, accessible (keyboard, screen reader announcements, focus states, native `<dialog>`)
- SEO: metadata, canonical, Open Graph + Twitter images (generated), JSON-LD (WebApplication + FAQPage), robots, sitemap, manifest

## How privacy is guaranteed

- Images are read with `File`/`Blob` APIs and processed in a **Web Worker** (`lib/worker/converter.worker.ts`) using `OffscreenCanvas` + `pdf-lib`. Browsers without OffscreenCanvas fall back to the same code on the main thread.
- There is no backend, database, account system or storage of any kind.
- The Content Security Policy in `next.config.ts` sets `connect-src 'self'`, so the page is technically unable to send data to a third-party server.
- Object URLs (thumbnails, previews, downloads) are revoked when images are removed, when you start over, and on unmount. Refreshing the page clears everything.

## Quality presets

| Preset   | Behaviour |
|----------|-----------|
| Standard | Long side ≤ 2000 px, JPEG 80 % — small files for email |
| High     | Long side ≤ 3500 px, JPEG 92 % — print quality (default) |
| Maximum  | Full resolution. JPEG and PNG originals are embedded **byte-for-byte** (no re-compression); other formats are re-encoded at high quality |

EXIF orientation (phone photos) is respected. Transparent areas become white, as on paper.

## Project structure

```
app/                   layout, page, metadata routes (OG image, robots, sitemap, manifest, icon)
components/
  Converter.tsx        orchestrates the flow (hero, workspace, drag/drop, paste)
  ImageUploader.tsx    empty state / drop target
  ImageList.tsx        sortable page grid (dnd-kit)
  PagePreview.tsx      live miniature of each PDF page
  ImagePreview.tsx     lightbox
  PdfSettings.tsx      settings panel (accordion on mobile)
  ConversionProgress.tsx
  PdfPreview.tsx       PDF.js viewer (lazy-loaded)
  DownloadResult.tsx
  sections/            How it works, Features, Privacy, FAQ, footer
hooks/useConverter.ts  state (useReducer) + resource cleanup
lib/
  image/               validation, decoding/encoding, EXIF, thumbnails
  pdf/                 settings, layout math, generation, conversion client
  worker/              Web Worker + message protocol
  site.ts, content.ts  brand/SEO config and FAQ copy
tests/unit             Vitest: layout math, validation, EXIF
tests/e2e              Playwright: full user flows
```

## Tests

```bash
npm run lint
npm run typecheck
npm test               # unit tests (Vitest)
npx playwright install chromium   # first time only
npm run test:e2e       # builds, starts the server, runs browser tests
```

The end-to-end suite generates its own test images and covers: multi-format upload, unsupported / corrupt / oversized files, EXIF rotation, removing, keyboard + pointer + button reordering, the lightbox, conversion with page-size verification of the downloaded PDF, the PDF.js preview, renaming and downloading, a 6000×4000 image at Maximum quality, cancelling, refresh behaviour, drag & drop, the main-thread fallback, object-URL cleanup, console errors under the CSP, and the mobile layout.

## Limits

- 50 MB per image, 200 images per PDF, 120 megapixels per image (see `lib/image/validate.ts`).
- HEIC/HEIF isn't supported by browsers' image decoders, so it's rejected with a clear message.
- Animated GIFs use their first frame.

## Deploying

It's a static-friendly Next.js app — deploy to Vercel, Netlify, Cloudflare, or any Node host with `npm run build && npm run start`. Keep the security headers from `next.config.ts` (or replicate them on your host) to preserve the no-upload guarantee.
