import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "F1lytics — Formula 1 2026",
    short_name: "F1lytics",
    description:
      "Live F1 standings, results, and timing for the 2026 season",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0B",
    theme_color: "#E10600",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
