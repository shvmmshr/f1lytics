import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve modern formats; the optimizer resizes to device-appropriate widths
    // and emits a srcset. All assets are local under /public, so no remotePatterns.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
