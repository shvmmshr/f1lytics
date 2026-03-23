import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0B",
          borderRadius: 6,
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: "#E10600",
            fontFamily: "system-ui, sans-serif",
            letterSpacing: "-0.05em",
          }}
        >
          F1
        </span>
      </div>
    ),
    { ...size }
  );
}
