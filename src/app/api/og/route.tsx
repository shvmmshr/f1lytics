import { ImageResponse } from "next/og";
import { ROOT_TITLE } from "@/lib/seo/metadata";

export const runtime = "edge";

export function GET(request: Request) {
  const requestedTitle = new URL(request.url).searchParams.get("title")?.trim();
  const title = (requestedTitle || ROOT_TITLE).slice(0, 120);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "58px 64px",
          background: "#08080A",
          color: "#F4F4F5",
          borderTop: "8px solid #E10600",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 64, height: 8, background: "#E10600", display: "flex" }} />
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "0.2em", display: "flex" }}>
            F1LYTICS
          </div>
        </div>
        <div style={{ maxWidth: 1060, fontSize: title.length > 64 ? 58 : 72, lineHeight: 1.02, fontWeight: 800, display: "flex" }}>
          {title}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, color: "#A1A1AA", letterSpacing: "0.12em" }}>
          <span>2026 FORMULA 1 ANALYTICS</span>
          <span>F1LYTICS.COM</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
