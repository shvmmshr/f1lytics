import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve modern formats; the optimizer resizes to device-appropriate widths
    // and emits a srcset.
    formats: ["image/avif", "image/webp"],
    // News thumbnails come from the feeds' CDNs. Keep in sync with
    // OPTIMIZED_IMAGE_HOSTS in src/app/(season)/news/page.tsx — unknown hosts
    // fall back to a plain <img> there rather than crashing the page.
    remotePatterns: [
      { protocol: "https", hostname: "**.motorsport.com" },
      { protocol: "https", hostname: "ichef.bbci.co.uk" },
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "**.ghost.io" },
    ],
  },
};

export default nextConfig;
