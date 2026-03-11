import type { Metadata } from "next";
import { getDriverStandings, getConstructorStandings, getRaceResults } from "@/lib/api/jolpica";
import { PageTransition } from "@/components/layout/page-transition";
import { SectionHeader } from "@/components/shared/section-header";
import { CompareTool } from "./compare-tool";

export const metadata: Metadata = {
  title: "Compare — GridLock F1 2026",
  description: "Head-to-head comparison of F1 drivers and teams",
};

export default async function ComparePage() {
  let driverStandings: Awaited<ReturnType<typeof getDriverStandings>> = [];
  let constructorStandings: Awaited<ReturnType<typeof getConstructorStandings>> = [];
  let raceResults: Awaited<ReturnType<typeof getRaceResults>> = [];

  try {
    [driverStandings, constructorStandings, raceResults] = await Promise.all([
      getDriverStandings("2026"),
      getConstructorStandings("2026"),
      getRaceResults("2026"),
    ]);
  } catch {
    // API unavailable
  }

  // Build driver stats map
  const driverStats: Record<string, {
    position: number | null;
    points: number;
    wins: number;
    podiums: number;
    races: number;
    bestFinish: number | null;
  }> = {};

  for (const s of driverStandings) {
    const code = s.Driver.code?.toUpperCase();
    if (!code) continue;
    const pos = Number.parseInt(s.position, 10);
    driverStats[code] = {
      position: Number.isNaN(pos) ? null : pos,
      points: Number.parseFloat(s.points) || 0,
      wins: Number.parseInt(s.wins, 10) || 0,
      podiums: 0,
      races: 0,
      bestFinish: null,
    };
  }

  // Enrich with race results
  for (const race of raceResults) {
    for (const result of race.Results ?? []) {
      const code = result.Driver.code?.toUpperCase();
      if (!code || !driverStats[code]) continue;
      const pos = Number.parseInt(result.position, 10);
      if (Number.isNaN(pos)) continue;
      driverStats[code].races++;
      if (pos <= 3) driverStats[code].podiums++;
      if (driverStats[code].bestFinish === null || pos < driverStats[code].bestFinish!) {
        driverStats[code].bestFinish = pos;
      }
    }
  }

  // Build constructor stats map
  const constructorStats: Record<string, {
    position: number | null;
    points: number;
    wins: number;
  }> = {};

  for (const s of constructorStandings) {
    const name = s.Constructor.name?.toLowerCase().replace(/[^a-z]/g, "");
    if (!name) continue;
    const pos = Number.parseInt(s.position, 10);
    constructorStats[name] = {
      position: Number.isNaN(pos) ? null : pos,
      points: Number.parseFloat(s.points) || 0,
      wins: Number.parseInt(s.wins, 10) || 0,
    };
  }

  return (
    <PageTransition>
      <SectionHeader title="Compare" subtitle="Head-to-head analysis" />
      <CompareTool driverStats={driverStats} constructorStats={constructorStats} />
    </PageTransition>
  );
}
