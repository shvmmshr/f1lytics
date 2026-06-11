import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { CIRCUIT_LIST } from "@/lib/constants/circuits";
import { DRIVER_LIST } from "@/lib/constants/drivers";
import { TEAM_LIST } from "@/lib/constants/teams";

export const alt = "F1lytics · Formula 1 2026, decoded";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const RED = "#E10600";
const INK = "#08080A";

// Bundled fonts (Satori only knows fonts handed to it as ArrayBuffers; it
// ignores CSS font-family + next/font). These mirror the site: Antonio for the
// condensed display headline, JetBrains Mono for the broadcast labels.
// Read from disk via import.meta.url so Next bundles the .ttf and it works at
// both build-time prerender and request time (fetch() of a relative asset URL
// fails during the build, which has no server to resolve it against).
function loadFont(file: string) {
  return readFile(fileURLToPath(new URL(`./_fonts/${file}`, import.meta.url)));
}

export default async function OGImage() {
  const [antonioBoldData, antonioSemiData, monoBoldData, monoMedData] =
    await Promise.all([
      loadFont("Antonio-Bold.ttf"),
      loadFont("Antonio-SemiBold.ttf"),
      loadFont("JetBrainsMono-Bold.ttf"),
      loadFont("JetBrainsMono-Medium.ttf"),
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
          position: "relative",
          background: INK,
          fontFamily: "Mono",
          overflow: "hidden",
        }}
      >
        {/* Soft red glow, off-centre right (matches the hero's ambient red). */}
        <div
          style={{
            position: "absolute",
            top: "8%",
            left: "34%",
            width: 760,
            height: 520,
            background:
              "radial-gradient(ellipse at center, rgba(225,6,0,0.16) 0%, rgba(225,6,0,0.05) 42%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Faint broadcast grid lines */}
        {[160, 320, 480].map((top) => (
          <div
            key={`h-${top}`}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top,
              height: 1,
              background: "rgba(255,255,255,0.035)",
              display: "flex",
            }}
          />
        ))}

        {/* Checkered corner, top right */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 132,
            height: 132,
            display: "flex",
            flexWrap: "wrap",
            opacity: 0.05,
          }}
        >
          {Array.from({ length: 36 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 22,
                height: 22,
                display: "flex",
                background:
                  (Math.floor(i / 6) + (i % 6)) % 2 === 0 ? "#FFFFFF" : "transparent",
              }}
            />
          ))}
        </div>

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
        <div style={{ position: "absolute", bottom: 28, right: 28, width: 30, height: 3, background: RED, display: "flex" }} />
        <div style={{ position: "absolute", bottom: 28, right: 28, width: 3, height: 30, background: RED, display: "flex" }} />

        {/* ===== Content ===== */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: "62px 70px",
            position: "relative",
          }}
        >
          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: 46, height: 2, background: RED, display: "flex" }} />
            <div
              style={{
                marginLeft: 16,
                fontFamily: "Mono",
                fontWeight: 700,
                fontSize: 19,
                letterSpacing: 6,
                color: RED,
                display: "flex",
              }}
            >
              2026 SEASON · TELEMETRY &amp; ANALYSIS
            </div>
          </div>

          {/* Headline */}
          <div style={{ display: "flex", flexDirection: "column", marginTop: -8 }}>
            <div
              style={{
                fontFamily: "Antonio",
                fontWeight: 700,
                fontSize: 142,
                lineHeight: 0.9,
                letterSpacing: -2,
                color: "#FAFAFA",
                display: "flex",
              }}
            >
              FORMULA 1
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <div
                style={{
                  fontFamily: "Antonio",
                  fontWeight: 700,
                  fontSize: 142,
                  lineHeight: 0.9,
                  letterSpacing: -2,
                  color: RED,
                  display: "flex",
                }}
              >
                DECODED
              </div>
              <div
                style={{
                  fontFamily: "Antonio",
                  fontWeight: 700,
                  fontSize: 142,
                  lineHeight: 0.9,
                  color: "#FAFAFA",
                  display: "flex",
                }}
              >
                .
              </div>
            </div>

            {/* Subtitle */}
            <div
              style={{
                marginTop: 26,
                maxWidth: 760,
                fontFamily: "Mono",
                fontWeight: 500,
                fontSize: 23,
                lineHeight: 1.5,
                color: "rgba(250,250,250,0.62)",
                display: "flex",
              }}
            >
              Standings, race results, driver &amp; team stats, telemetry and the
              full Formula 1 season, all in one place.
            </div>
          </div>

          {/* Bottom: stat strip + wordmark */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            {/* Stat strip */}
            <div
              style={{
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
                    padding: "14px 26px 16px",
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
                      marginTop: 6,
                      fontFamily: "Antonio",
                      fontWeight: 700,
                      fontSize: 50,
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

            {/* Wordmark */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <div
                  style={{
                    fontFamily: "Antonio",
                    fontWeight: 700,
                    fontSize: 40,
                    letterSpacing: -1,
                    color: "#FAFAFA",
                    display: "flex",
                  }}
                >
                  F1
                </div>
                <div
                  style={{
                    fontFamily: "Antonio",
                    fontWeight: 700,
                    fontSize: 40,
                    letterSpacing: -1,
                    color: RED,
                    display: "flex",
                  }}
                >
                  LYTICS
                </div>
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontFamily: "Mono",
                  fontWeight: 500,
                  fontSize: 15,
                  letterSpacing: 3,
                  color: "rgba(250,250,250,0.35)",
                  display: "flex",
                }}
              >
                f1lytics.com
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Antonio", data: antonioBoldData, weight: 700, style: "normal" },
        { name: "Antonio", data: antonioSemiData, weight: 600, style: "normal" },
        { name: "Mono", data: monoBoldData, weight: 700, style: "normal" },
        { name: "Mono", data: monoMedData, weight: 500, style: "normal" },
      ],
    }
  );
}
