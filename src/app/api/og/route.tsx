import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { ROOT_TITLE } from "@/lib/seo/metadata";

// Node runtime so the brand lockup and the bundled fonts can be read from disk,
// exactly like the root opengraph-image. Satori only knows fonts it is handed.
export const runtime = "nodejs";

const INK = "#08080A";
const BG2 = "#141418";
const LINE = "#27272A";
const FG = "#F4F4F5";
const FG2 = "#B4B4BD";
const FG3 = "#84848F";
const RED = "#FF1801";

function loadFont(file: string) {
  return readFile(fileURLToPath(new URL(`../../_fonts/${file}`, import.meta.url)));
}

async function loadLockup(): Promise<string> {
  const buf = await readFile(fileURLToPath(new URL("../../../../design/brand/f1lytics-lockup-dark.png", import.meta.url)));
  return `data:image/png;base64,${buf.toString("base64")}`;
}

/** Strip characters Satori cannot shape and keep titles to one strong line or two. */
function clean(value: string | null, max: number): string {
  return (value ?? "").replace(/[^\x20-\x7E -ɏ–—’·]/g, "").trim().slice(0, max);
}

/**
 * Social card for every page: `?title=` is the page title, `?sub=` an optional
 * eyebrow such as the section name. Cached for a day at the edge.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const title = clean(url.searchParams.get("title"), 120) || ROOT_TITLE;
  const sub = clean(url.searchParams.get("sub"), 60) || "2026 FORMULA 1 SEASON";
  const [antonio, mono, lockup] = await Promise.all([loadFont("Antonio-Bold.ttf"), loadFont("JetBrainsMono-Medium.ttf"), loadLockup()]);
  const size = title.length > 72 ? 56 : title.length > 44 ? 68 : 84;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: INK,
          color: FG,
          padding: "44px 64px 48px",
          borderTop: `10px solid ${RED}`,
          fontFamily: "Mono",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lockup} alt="" width={330} height={72} style={{ objectFit: "contain", objectPosition: "left" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 10, height: 10, background: RED, borderRadius: 999, display: "flex" }} />
            <div style={{ fontSize: 18, letterSpacing: "0.22em", color: FG3, display: "flex" }}>F1LYTICS.COM</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 54, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 4, background: RED, display: "flex" }} />
            <div style={{ fontSize: 20, letterSpacing: "0.22em", color: FG2, display: "flex" }}>{sub.toUpperCase()}</div>
          </div>
          <div
            style={{
              fontFamily: "Antonio",
              fontSize: size,
              lineHeight: 0.98,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              maxWidth: 1040,
              marginTop: 20,
              display: "flex",
            }}
          >
            {title}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${LINE}`, paddingTop: 22 }}>
          <div style={{ display: "flex", gap: 26 }}>
            {["STANDINGS", "RESULTS", "LIVE TIMING", "LOCK IN"].map((item) => (
              <div key={item} style={{ fontSize: 15, letterSpacing: "0.2em", color: FG3, display: "flex" }}>
                {item}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: BG2, border: `1px solid ${LINE}`, padding: "8px 14px" }}>
            <div style={{ fontSize: 14, letterSpacing: "0.2em", color: FG2, display: "flex" }}>UNOFFICIAL FAN PROJECT</div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Antonio", data: antonio, weight: 700, style: "normal" },
        { name: "Mono", data: mono, weight: 500, style: "normal" },
      ],
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
