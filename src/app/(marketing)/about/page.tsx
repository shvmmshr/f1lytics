import Link from "next/link";
import { F1, Mono, Grid as BroadcastGrid, SectionHeader } from "@/components/shared/broadcast";
import { JsonLd } from "@/components/shared/json-ld";
import { createPageMetadata, absoluteUrl, SITE_NAME, SITE_URL } from "@/lib/seo/metadata";

const description =
  "Learn how F1lytics sources, validates, caches, and presents Formula 1 data, including update cadence, limitations, independence, and corrections.";

export const metadata = createPageMetadata({
  title: "About F1lytics: Data Sources & Methodology",
  description,
  path: "/about",
  imageEyebrow: "ABOUT F1LYTICS",
});

const sources = [
  ["Jolpica-F1", "Race classifications, championship standings, qualifying, sprint results, and points."],
  ["OpenF1", "Session discovery, laps, stints, positions, weather, team radio, and historical telemetry."],
  ["F1 live timing", "Live-session timing data when it is publicly available and the upstream is streaming."],
  ["Publisher RSS feeds", "Attributed headlines from BBC Sport, Motorsport.com, Autosport, The Race, and PlanetF1."],
] as const;

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "About F1lytics",
          description,
          url: absoluteUrl("/about"),
          isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
        }}
      />
      <main className="relative" style={{ background: F1.bg, color: F1.fg }}>
        <BroadcastGrid color={F1.line} size={64} opacity={0.18} />
        <header
          className="relative"
          style={{ padding: "56px clamp(20px, 6vw, 80px) 44px", borderBottom: `1px solid ${F1.line}` }}
        >
          <Mono style={{ color: F1.red, fontSize: 11, letterSpacing: "0.24em" }}>ABOUT / METHODOLOGY</Mono>
          <h1 className="font-display mt-3 uppercase" style={{ fontSize: "clamp(42px, 8vw, 96px)", fontWeight: 700, lineHeight: 0.9 }}>
            DATA WITH CONTEXT<span style={{ color: F1.red }}>.</span>
          </h1>
          <p className="mt-5 max-w-3xl text-lg" style={{ color: F1.fg2 }}>
            F1lytics is an unofficial, open-source Formula 1 analytics and timing project built to make the 2026 season easier to explore.
          </p>
        </header>

        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-12 md:px-10">
          <section>
            <SectionHeader label="DATA SOURCES" />
            <div className="grid gap-px md:grid-cols-2" style={{ background: F1.line, border: `1px solid ${F1.line}` }}>
              {sources.map(([name, detail]) => (
                <article key={name} className="p-6" style={{ background: F1.bg2 }}>
                  <h2 className="font-display text-2xl">{name}</h2>
                  <p className="mt-2" style={{ color: F1.fg2 }}>{detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section>
            <SectionHeader label="FRESHNESS & CACHING" />
            <p style={{ color: F1.fg2 }}>
              Current results and standings normally refresh every five minutes. Historical data is cached longer once it is settled. Independent feeds are allowed to fail independently, so one unavailable chart or publisher does not take down an otherwise useful page.
            </p>
          </section>

          <section>
            <SectionHeader label="METHODOLOGY & LIMITATIONS" />
            <div className="space-y-3" style={{ color: F1.fg2 }}>
              <p>Race dates, rather than renumbered API rounds, are the stable join key across sources. Cancelled events keep their original local calendar slot.</p>
              <p>Qualifying classifications are the best available grid preview; post-qualifying penalties can still change the official starting order. Jolpica can lag after a session, and OpenF1 or detailed live timing may be locked during live running.</p>
              <p>When trustworthy sporting data is unavailable, F1lytics shows an honest empty state or explicit zero fallback. It does not invent results.</p>
            </div>
          </section>

          <section>
            <SectionHeader label="INDEPENDENCE & OPEN SOURCE" />
            <p style={{ color: F1.fg2 }}>
              F1lytics is editorially and commercially independent and is not affiliated with Formula 1, its teams, or its governing bodies. External news stays attributed to its publisher.
            </p>
            <p className="mt-4" style={{ color: F1.fg2 }}>
              The source is available on{" "}
              <a className="underline hover:text-white" href="https://github.com/shvmmshr/f1lytics" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              . Corrections can be reported there with a source and the affected page.
            </p>
          </section>

          <div>
            <Link href="/" className="font-mono text-xs tracking-[0.18em] hover:text-white" style={{ color: F1.fg2 }}>
              ← RETURN TO F1LYTICS
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
