import { Suspense } from "react";
import { getDriverStandings, getConstructorStandings, getRaceResults, getAllQualifyingResults, getAllSprintResults } from "@/lib/api/jolpica";
import { buildComparisonStats } from "@/lib/analytics/comparison";
import { DataNotice } from "@/components/shared/data-notice";
import { PageTransition } from "@/components/layout/page-transition";
import { F1, Mono, Grid as BroadcastGrid } from "@/components/shared/broadcast";
import { CompareTool } from "./compare-tool";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "F1 Driver & Team Comparison Tool",
  description:
    "Compare F1 drivers and teams head to head across points, wins, podiums, qualifying pace, finishes, and recent form.",
  path: "/compare",
  imageEyebrow: "HEAD TO HEAD",
});

// Post-session-sensitive data (results/standings/grid); see AGENTS.md caching rules.
export const revalidate = 300;

export default async function ComparePage() {
  const failed: string[] = [];
  const fallback = (label: string) => (error: unknown) => {
    console.warn(`[f1lytics] compare ${label} unavailable:`, error);
    failed.push(label);
    return [];
  };
  const [drivers, teams, races, qualifying, sprints] = await Promise.all([
    getDriverStandings("2026").catch(fallback("driver standings")),
    getConstructorStandings("2026").catch(fallback("constructor standings")),
    getRaceResults("2026").catch(fallback("race results")),
    getAllQualifyingResults("2026").catch(fallback("qualifying")),
    getAllSprintResults("2026").catch(fallback("sprint results")),
  ]);
  const { driverStats, constructorStats } = buildComparisonStats(drivers, teams, races, qualifying, sprints);

  return (
    <PageTransition>
      <div style={{ background: F1.bg, color: F1.fg, position: "relative" }}>
        <BroadcastGrid color={F1.line} size={64} opacity={0.18} />
        <div
          className="relative"
          style={{ padding: "40px clamp(16px, 4vw, 32px) 28px", borderBottom: `1px solid ${F1.line}` }}
        >
          <div className="flex flex-wrap items-center gap-2 sm:gap-3.5">
            <Mono style={{ color: F1.red, fontSize: 11, letterSpacing: "0.24em" }}>
              SECTION 07
            </Mono>
            <span className="hidden sm:block" style={{ width: 40, height: 1, background: F1.line }} />
            <Mono style={{ color: F1.fg3, fontSize: 11, letterSpacing: "0.18em" }}>
              HEAD‑TO‑HEAD · DRIVERS · CONSTRUCTORS
            </Mono>
          </div>
          <h1
            className="font-display uppercase m-0 mt-3"
            style={{
              fontWeight: 700,
              fontSize: "clamp(40px, 8vw, 96px)",
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
            }}
          >
            COMPARE<span style={{ color: F1.red }}>.</span>
          </h1>
          <div className="mt-3" style={{ fontSize: "clamp(14px, 4vw, 16px)", color: F1.fg2, maxWidth: 540 }}>
            Compare drivers and teams across points, qualifying and race results.
          </div>
        </div>
        <div style={{ padding: "32px clamp(16px, 4vw, 32px)" }}>
          {(failed.length > 0 || !drivers.length || !teams.length) && <DataNotice unavailable>Some statistics are unavailable{failed.length ? ` (${failed.join(", ")})` : ""}. Try again shortly.</DataNotice>}
          <Suspense fallback={<p className="min-h-96 text-text-secondary">Loading driver and team comparisons…</p>}><CompareTool driverStats={driverStats} constructorStats={constructorStats} /></Suspense>
          <details className="mt-8 border-t border-line pt-2">
            <summary className="w-fit cursor-pointer py-3 text-sm text-text-secondary underline underline-offset-4">How to read this comparison</summary>
            <p className="mt-2 text-sm text-text-secondary">Points include sprints; race form and head-to-heads use Grands Prix only.</p>
            <div className="mt-4 grid gap-6 text-sm leading-relaxed sm:grid-cols-3" style={{ color: F1.fg2 }}>
              <p><strong style={{ color: F1.fg }}>Start with the same opportunities.</strong> Race head-to-heads compare shared Grands Prix. Different cars, reliability and missed sessions affect the result; a points lead alone is not a measure of driver skill.</p>
              <p><strong style={{ color: F1.fg }}>Separate qualifying from race execution.</strong> Qualifying averages use session classifications. Race form considers completed finishes, while championship points also reward sprint results.</p>
              <p><strong style={{ color: F1.fg }}>Look for a trend.</strong> Recent form shows the last five Grands Prix. The full progression helps distinguish a consistent advantage from one unusually strong weekend.</p>
            </div>
            <a href="/about#methodology" className="mt-4 inline-block py-3 text-sm text-text-secondary underline underline-offset-4">Sources & methodology</a>
          </details>
        </div>
      </div>
    </PageTransition>
  );
}
