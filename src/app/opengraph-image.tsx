import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "F1lytics · 2026 Formula 1 stats, standings, and results";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0A0A0B",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* === Background layers === */}

        {/* Deep radial gradient base */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 120% 80% at 30% 50%, rgba(225,6,0,0.08) 0%, transparent 60%), radial-gradient(ellipse 80% 120% at 80% 30%, rgba(225,6,0,0.05) 0%, transparent 50%)",
          }}
        />

        {/* Perspective grid floor */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 280,
            background:
              "linear-gradient(to top, rgba(225,6,0,0.06) 0%, transparent 100%)",
            display: "flex",
          }}
        />

        {/* Horizontal speed lines — left side */}
        {[60, 140, 195, 310, 400, 470, 530].map((top, i) => (
          <div
            key={`line-l-${i}`}
            style={{
              position: "absolute",
              top,
              left: 0,
              width: [280, 180, 320, 220, 160, 260, 200][i],
              height: 1,
              background: `linear-gradient(to right, rgba(225,6,0,${[0.3, 0.15, 0.25, 0.12, 0.2, 0.08, 0.18][i]}) 0%, transparent 100%)`,
            }}
          />
        ))}

        {/* Horizontal speed lines — right side */}
        {[80, 160, 250, 350, 420, 500].map((top, i) => (
          <div
            key={`line-r-${i}`}
            style={{
              position: "absolute",
              top,
              right: 0,
              width: [200, 260, 150, 300, 180, 220][i],
              height: 1,
              background: `linear-gradient(to left, rgba(225,6,0,${[0.2, 0.1, 0.25, 0.08, 0.15, 0.12][i]}) 0%, transparent 100%)`,
            }}
          />
        ))}

        {/* Diagonal racing stripe — top left */}
        <div
          style={{
            position: "absolute",
            top: -40,
            left: -20,
            width: 3,
            height: 200,
            background: "rgba(225,6,0,0.4)",
            transform: "rotate(35deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -30,
            left: -5,
            width: 1,
            height: 160,
            background: "rgba(225,6,0,0.2)",
            transform: "rotate(35deg)",
          }}
        />

        {/* Diagonal racing stripe — bottom right */}
        <div
          style={{
            position: "absolute",
            bottom: -40,
            right: 40,
            width: 3,
            height: 200,
            background: "rgba(225,6,0,0.3)",
            transform: "rotate(35deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -30,
            right: 55,
            width: 1,
            height: 160,
            background: "rgba(225,6,0,0.15)",
            transform: "rotate(35deg)",
          }}
        />

        {/* Checkered flag pattern — top right corner */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 120,
            height: 120,
            display: "flex",
            flexWrap: "wrap",
            opacity: 0.04,
          }}
        >
          {Array.from({ length: 36 }).map((_, i) => (
            <div
              key={`check-${i}`}
              style={{
                width: 20,
                height: 20,
                background:
                  (Math.floor(i / 6) + (i % 6)) % 2 === 0
                    ? "white"
                    : "transparent",
              }}
            />
          ))}
        </div>

        {/* Central red glow — main */}
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 700,
            height: 400,
            background:
              "radial-gradient(ellipse, rgba(225,6,0,0.12) 0%, rgba(225,6,0,0.04) 40%, transparent 70%)",
          }}
        />

        {/* === Content === */}

        {/* Top bar — season badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "48px 64px 0",
            gap: 12,
          }}
        >
          {/* Red dot */}
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#E10600",
              boxShadow: "0 0 12px rgba(225,6,0,0.6)",
            }}
          />
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "rgba(250,250,250,0.5)",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            2026 Season
          </span>
        </div>

        {/* Main title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "32px 64px 0",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
            }}
          >
            <span
              style={{
                fontSize: 120,
                fontWeight: 900,
                color: "#FAFAFA",
                letterSpacing: "-0.04em",
                lineHeight: 1,
              }}
            >
              F1
            </span>
            <span
              style={{
                fontSize: 120,
                fontWeight: 900,
                color: "#E10600",
                letterSpacing: "-0.04em",
                lineHeight: 1,
              }}
            >
              LYTICS
            </span>
          </div>

          {/* Red accent bar under title */}
          <div
            style={{
              width: 100,
              height: 4,
              background:
                "linear-gradient(to right, #E10600, rgba(225,6,0,0.3))",
              borderRadius: 2,
              marginTop: 8,
            }}
          />

          {/* Description */}
          <p
            style={{
              fontSize: 22,
              color: "rgba(250,250,250,0.55)",
              marginTop: 24,
              fontWeight: 400,
              lineHeight: 1.5,
              maxWidth: 540,
            }}
          >
            Standings, race results, driver and team stats, telemetry, and the
            full 2026 Formula 1 season.
          </p>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 64px 40px",
          }}
        >
          {/* Feature pills */}
          <div style={{ display: "flex", gap: 16 }}>
            {["Standings", "Race Results", "Telemetry", "Live Timing"].map(
              (label) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 16px",
                    borderRadius: 20,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: "#E10600",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      color: "rgba(250,250,250,0.45)",
                      fontWeight: 500,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {label}
                  </span>
                </div>
              )
            )}
          </div>

          {/* URL */}
          <span
            style={{
              fontSize: 14,
              color: "rgba(250,250,250,0.3)",
              fontWeight: 500,
              letterSpacing: "0.05em",
            }}
          >
            f1lytics.com
          </span>
        </div>

        {/* Top edge red line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background:
              "linear-gradient(to right, transparent, #E10600 30%, #E10600 70%, transparent)",
          }}
        />

        {/* Bottom edge subtle line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 1,
            background:
              "linear-gradient(to right, transparent, rgba(225,6,0,0.3) 30%, rgba(225,6,0,0.3) 70%, transparent)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
