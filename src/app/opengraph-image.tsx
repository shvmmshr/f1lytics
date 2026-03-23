import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "F1lytics — Formula 1 2026 Dashboard";
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
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Red glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            height: 300,
            background: "radial-gradient(ellipse, rgba(225,6,0,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Brand name */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 0,
            position: "relative",
          }}
        >
          <span
            style={{
              fontSize: 96,
              fontWeight: 800,
              color: "#FAFAFA",
              letterSpacing: "-0.05em",
            }}
          >
            F1
          </span>
          <span
            style={{
              fontSize: 96,
              fontWeight: 800,
              color: "#E10600",
              letterSpacing: "-0.05em",
            }}
          >
            LYTICS
          </span>
        </div>

        {/* Red accent line */}
        <div
          style={{
            width: 80,
            height: 3,
            background: "#E10600",
            marginTop: 16,
            borderRadius: 2,
          }}
        />

        {/* Subtitle */}
        <p
          style={{
            fontSize: 24,
            color: "rgba(250,250,250,0.6)",
            marginTop: 24,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          Formula 1 · 2026 Season
        </p>

        {/* Bottom tagline */}
        <p
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 16,
            color: "rgba(250,250,250,0.35)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          Live Standings · Race Results · Driver Analytics
        </p>
      </div>
    ),
    { ...size }
  );
}
