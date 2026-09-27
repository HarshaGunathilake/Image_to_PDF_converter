import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.name} — Convert images to PDF in your browser`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const sheet = (rotate: number, x: number, y: number, fill: string) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 210,
      height: 280,
      background: "#ffffff",
      borderRadius: 6,
      boxShadow: "0 12px 32px rgba(22,32,43,0.18)",
      transform: `rotate(${rotate}deg)`,
      display: "flex",
      flexDirection: "column",
      padding: 18,
      gap: 10,
    }}
  >
    <div style={{ height: 150, borderRadius: 4, background: fill }} />
    <div style={{ height: 8, width: "100%", borderRadius: 4, background: "#e2e8f0" }} />
    <div style={{ height: 8, width: "70%", borderRadius: 4, background: "#e2e8f0" }} />
  </div>
);

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#eef1f4", padding: 72, position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", width: 640 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 34, fontWeight: 600, color: "#16202b" }}>
            <div style={{ width: 40, height: 48, borderRadius: 6, background: "#0e6e63" }} />
            {site.name}
          </div>
          <div style={{ marginTop: 70, fontSize: 70, lineHeight: 1.08, fontWeight: 700, color: "#16202b", letterSpacing: -2 }}>
            Convert images to PDF in seconds
          </div>
          <div style={{ marginTop: 28, fontSize: 30, color: "#56616e", lineHeight: 1.4 }}>
            JPG, PNG and WEBP to PDF. Processed in your browser, never stored.
          </div>
        </div>
        {sheet(-8, 760, 150, "#9cc9bf")}
        {sheet(5, 880, 190, "#6aa8c9")}
        {sheet(-1, 820, 230, "#0e6e63")}
      </div>
    ),
    size,
  );
}
