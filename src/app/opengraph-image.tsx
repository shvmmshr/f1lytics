import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { CIRCUIT_LIST } from "@/lib/constants/circuits";
import { DRIVER_LIST } from "@/lib/constants/drivers";
import { TEAM_LIST } from "@/lib/constants/teams";

export const alt = "F1lytics · Formula 1 telemetry, standings and live timing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const RED = "#E10600";
const INK = "#08080A";

// Bundled fonts (Satori only knows fonts handed to it as ArrayBuffers; it
// ignores CSS font-family + next/font). Read from disk via import.meta.url so
// Next bundles the assets and they work at build-time prerender.
function loadFont(file: string) {
  return readFile(fileURLToPath(new URL(`./_fonts/${file}`, import.meta.url)));
}

// The full brand lockup (car + wordmark, transparent PNG) embedded as a data
// URI — Satori can't fetch relative URLs at build time. Lives in design/brand
// (read from disk here, never served as a public URL).
async function loadLockup() {
  const buf = await readFile(
    fileURLToPath(
      new URL("../../design/brand/f1lytics-lockup-dark.png", import.meta.url)
    )
  );
  return `data:image/png;base64,${buf.toString("base64")}`;
}

export default async function OGImage() {
  const [monoBoldData, monoMedData, antonioBoldData, lockupSrc] =
    await Promise.all([
      loadFont("JetBrainsMono-Bold.ttf"),
      loadFont("JetBrainsMono-Medium.ttf"),
      loadFont("Antonio-Bold.ttf"),
      loadLockup(),
    ]);

  const races = CIRCUIT_LIST.filter((c) => !c.cancelled).length;
  const sprints = CIRCUIT_LIST.filter((c) => !c.cancelled && c.isSprint).length;
  const stats: [string, string][] = [
    ["ROUNDS", String(races)],
    ["DRIVERS", String(DRIVER_LIST.length)],
    ["TEAMS", String(TEAM_LIST.length)],
    ["SPRINTS", String(sprints)],
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: INK,
          fontFamily: "Mono",
          overflow: "hidden",
        }}
      >
        {/* Soft red glow behind the lockup */}
        <div
          style={{
            position: "absolute",
            top: "6%",
            left: "18%",
            width: 780,
            height: 460,
            background:
              "radial-gradient(ellipse at center, rgba(225,6,0,0.15) 0%, rgba(225,6,0,0.05) 45%, transparent 72%)",
            display: "flex",
          }}
        />

        {/* Faint broadcast grid lines */}
        {[157, 315, 472].map((top) => (
          <div
            key={`h-${top}`}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top,
              height: 1,
              background: "rgba(255,255,255,0.03)",
              display: "flex",
            }}
          />
        ))}

        {/* Top red edge line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(to right, transparent, ${RED} 22%, ${RED} 72%, transparent)`,
            display: "flex",
          }}
        />

        {/* Corner brackets (broadcast frame) */}
        <div style={{ position: "absolute", top: 28, left: 28, width: 30, height: 3, background: RED, display: "flex" }} />
        <div style={{ position: "absolute", top: 28, left: 28, width: 3, height: 30, background: RED, display: "flex" }} />
        <div style={{ position: "absolute", top: 28, right: 28, width: 30, height: 3, background: RED, display: "flex" }} />
        <div style={{ position: "absolute", top: 28, right: 28, width: 3, height: 30, background: RED, display: "flex" }} />
        <div style={{ position: "absolute", bottom: 28, left: 28, width: 30, height: 3, background: RED, display: "flex" }} />
        <div style={{ position: "absolute", bottom: 28, left: 28, width: 3, height: 30, background: RED, display: "flex" }} />
        <div style={{ position: "absolute", bottom: 28, right: 28, width: 30, height: 3, background: RED, display: "flex" }} />
        <div style={{ position: "absolute", bottom: 28, right: 28, width: 3, height: 30, background: RED, display: "flex" }} />

        {/* ===== The logo IS the card ===== */}
        { }
        <img
          src={lockupSrc}
          width={820}
          height={237}
          alt=""
          style={{ display: "flex" }}
        />

        {/* Tagline */}
        <div
          style={{
            marginTop: 34,
            fontFamily: "Mono",
            fontWeight: 500,
            fontSize: 21,
            letterSpacing: 7,
            color: "rgba(250,250,250,0.6)",
            display: "flex",
          }}
        >
          TELEMETRY · STANDINGS · LIVE TIMING
        </div>

        {/* Stat strip */}
        <div
          style={{
            marginTop: 40,
            display: "flex",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          {stats.map(([label, value], i) => (
            <div
              key={label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "13px 34px 15px",
                borderLeft: i === 0 ? "none" : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div
                style={{
                  fontFamily: "Mono",
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: 3,
                  color: "rgba(250,250,250,0.4)",
                  display: "flex",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  marginTop: 5,
                  fontFamily: "Antonio",
                  fontWeight: 700,
                  fontSize: 42,
                  lineHeight: 1,
                  color: "#FAFAFA",
                  display: "flex",
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Site URL, bottom center */}
        <div
          style={{
            position: "absolute",
            bottom: 34,
            fontFamily: "Mono",
            fontWeight: 500,
            fontSize: 15,
            letterSpacing: 4,
            color: "rgba(250,250,250,0.35)",
            display: "flex",
          }}
        >
          f1lytics.com · 2026 SEASON
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Antonio", data: antonioBoldData, weight: 700, style: "normal" },
        { name: "Mono", data: monoBoldData, weight: 700, style: "normal" },
        { name: "Mono", data: monoMedData, weight: 500, style: "normal" },
      ],
    }
  );
}
