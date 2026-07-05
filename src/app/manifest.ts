import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "F1lytics · Formula 1 2026 Stats",
    short_name: "F1lytics",
    description:
      "Formula 1 2026 standings, race results, driver and team stats, telemetry, and live timing.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0B",
    theme_color: "#E10600",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
