import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve modern formats; the optimizer resizes to device-appropriate widths
    // and emits a srcset.
    formats: ["image/avif", "image/webp"],
    // News thumbnails come from the feeds' CDNs. Literal hosts only — a
    // wildcard like **.cloudfront.net would let a compromised feed point the
    // image optimizer at ANY CloudFront tenant (open-proxy surface). Keep in
    // sync with OPTIMIZED_IMAGE_HOSTS in src/app/(season)/news/page.tsx —
    // unknown hosts fall back to a plain <img> there, so a feed switching
    // CDNs degrades gracefully instead of crashing.
    remotePatterns: [
      { protocol: "https", hostname: "cdn-*.motorsport.com" }, // motorsport.com + autosport
      { protocol: "https", hostname: "ichef.bbci.co.uk" }, // BBC Sport
      { protocol: "https", hostname: "d3cm515ijfiu6w.cloudfront.net" }, // PlanetF1
      { protocol: "https", hostname: "storage.ghost.io" }, // The Race
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // No MIME sniffing, no hostile-iframe embedding, lean referrers,
          // and no powerful-feature access. (A full CSP needs an inline-style
          // audit first — this app styles heavily inline — so it's deferred.)
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
