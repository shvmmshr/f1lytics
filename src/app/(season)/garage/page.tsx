import { F1, Mono, Grid as BroadcastGrid } from "@/components/shared/broadcast";
import { Garage } from "@/components/garage/garage";
import { PageTransition } from "@/components/layout/page-transition";
import { TEAM_LIVERIES } from "@/lib/garage/liveries";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "The Garage: Spin a 3D F1-Style Car in Every 2026 Colourway",
  description:
    "Orbit a stylised open-wheel car in 3D and paint it in any 2026 team colourway or a classic era scheme. Built from geometry, so it loads fast on any device.",
  path: "/garage",
  imageEyebrow: "THE GARAGE · 3D",
});

export default async function GaragePage({ searchParams }: { searchParams: Promise<{ livery?: string }> }) {
  const { livery } = await searchParams;
  const initial = TEAM_LIVERIES.some((l) => l.id === livery) || livery?.startsWith("era-") ? livery! : TEAM_LIVERIES[0].id;
  return (
    <PageTransition>
      <div style={{ background: F1.bg, color: F1.fg, position: "relative" }}>
        <BroadcastGrid color={F1.line} size={64} opacity={0.18} />
        <header className="relative" style={{ padding: "40px clamp(16px, 4vw, 32px) 28px", borderBottom: `1px solid ${F1.line}` }}>
          <Mono style={{ color: F1.red, fontSize: 11, letterSpacing: "0.24em" }}>THE GARAGE</Mono>
          <h1 className="font-display mt-3 uppercase" style={{ fontSize: "clamp(40px, 8vw, 88px)", fontWeight: 700, lineHeight: 0.9, letterSpacing: "-0.04em", margin: "12px 0 0" }}>
            Walk around it<span style={{ color: F1.red }}>.</span>
          </h1>
          <p className="mt-4 max-w-xl" style={{ color: F1.fg2, fontSize: 15, lineHeight: 1.6 }}>
            A stylised 2026-era car you can orbit, zoom and repaint. Built from geometry rather than a downloaded model, so it is light, fast, and nobody else&apos;s.
          </p>
        </header>
        <div className="relative" style={{ padding: "clamp(16px, 3vw, 28px) clamp(12px, 3vw, 32px) clamp(24px, 4vw, 40px)" }}>
          <Garage initialLiveryId={initial} />
        </div>
      </div>
    </PageTransition>
  );
}
