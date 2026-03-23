import type { Metadata } from "next";
import { getDriverStandings, getConstructorStandings, getRaceResults, getAllQualifyingResults } from "@/lib/api/jolpica";
import { PageTransition } from "@/components/layout/page-transition";
import { SectionHeader } from "@/components/shared/section-header";
import { CompareTool } from "./compare-tool";

export const metadata: Metadata = {
  title: "Compare",
  description: "Head-to-head comparison of F1 drivers and teams",
};

export interface RecentFormEntry {
  round: number;
  position: number | null; // null = DNF
  raceName: string;
}

export interface PointsPerRound {
  round: number;
  cumulativePoints: number;
}

export interface RaceHistoryEntry {
  round: number;
  position: number | null;
  points: number;
  raceName: string;
}

export interface QualifyingHistoryEntry {
  round: number;
  position: number;
  raceName: string;
}

export interface DriverStat {
  position: number | null;
  points: number;
  wins: number;
  podiums: number;
  races: number;
  bestFinish: number | null;
  recentForm: RecentFormEntry[];
  pointsPerRace: PointsPerRound[];
  raceHistory: RaceHistoryEntry[];
  qualifyingHistory: QualifyingHistoryEntry[];
  avgQualifying: number | null;
}

export interface ConstructorStat {
  position: number | null;
  points: number;
  wins: number;
  pointsPerRound: PointsPerRound[];
}

export default async function ComparePage() {
  let driverStandings: Awaited<ReturnType<typeof getDriverStandings>> = [];
  let constructorStandings: Awaited<ReturnType<typeof getConstructorStandings>> = [];
  let raceResults: Awaited<ReturnType<typeof getRaceResults>> = [];
  let qualifyingResults: Awaited<ReturnType<typeof getAllQualifyingResults>> = [];

  try {
    [driverStandings, constructorStandings, raceResults, qualifyingResults] = await Promise.all([
      getDriverStandings("2026"),
      getConstructorStandings("2026"),
      getRaceResults("2026"),
      getAllQualifyingResults("2026"),
    ]);
  } catch {
    // API unavailable
  }

  // Build driver stats map
  const driverStats: Record<string, DriverStat> = {};

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
      recentForm: [],
      pointsPerRace: [],
      raceHistory: [],
      qualifyingHistory: [],
      avgQualifying: null,
    };
  }

  // Per-driver cumulative points tracker
  const cumulativePoints: Record<string, number> = {};

  // Sort race results by round
  const sortedRaces = [...raceResults].sort(
    (a, b) => Number.parseInt(a.round, 10) - Number.parseInt(b.round, 10)
  );

  // Enrich with race results
  for (const race of sortedRaces) {
    const round = Number.parseInt(race.round, 10);
    for (const result of race.Results ?? []) {
      const code = result.Driver.code?.toUpperCase();
      if (!code || !driverStats[code]) continue;
      const pos = Number.parseInt(result.position, 10);
      const pts = Number.parseFloat(result.points) || 0;
      const isFinished = result.status === "Finished" || result.status?.startsWith("+");

      driverStats[code].races++;
      if (!Number.isNaN(pos)) {
        if (pos <= 3) driverStats[code].podiums++;
        if (driverStats[code].bestFinish === null || pos < driverStats[code].bestFinish!) {
          driverStats[code].bestFinish = pos;
        }
      }

      // Race history for h2h computation on client
      const finishPos = !Number.isNaN(pos) && isFinished ? pos : null;
      driverStats[code].raceHistory.push({
        round,
        position: finishPos,
        points: pts,
        raceName: race.raceName,
      });

      // Cumulative points
      cumulativePoints[code] = (cumulativePoints[code] ?? 0) + pts;
      driverStats[code].pointsPerRace.push({
        round,
        cumulativePoints: cumulativePoints[code],
      });
    }
  }

  // Compute recent form (last 5 races)
  for (const code of Object.keys(driverStats)) {
    const history = driverStats[code].raceHistory;
    const last5 = history.slice(-5);
    driverStats[code].recentForm = last5.map((h) => ({
      round: h.round,
      position: h.position,
      raceName: h.raceName,
    }));
  }

  // Qualifying data
  for (const quali of qualifyingResults) {
    const round = Number.parseInt(quali.round, 10);
    for (const result of quali.QualifyingResults ?? []) {
      const code = result.Driver.code?.toUpperCase();
      if (!code || !driverStats[code]) continue;
      const pos = Number.parseInt(result.position, 10);
      if (!Number.isNaN(pos)) {
        driverStats[code].qualifyingHistory.push({
          round,
          position: pos,
          raceName: quali.raceName,
        });
      }
    }
  }

  // Compute average qualifying position
  for (const code of Object.keys(driverStats)) {
    const qHistory = driverStats[code].qualifyingHistory;
    if (qHistory.length > 0) {
      const sum = qHistory.reduce((acc, q) => acc + q.position, 0);
      driverStats[code].avgQualifying = Math.round((sum / qHistory.length) * 10) / 10;
    }
  }

  // Build constructor stats map
  const constructorStats: Record<string, ConstructorStat> = {};

  for (const s of constructorStandings) {
    const name = s.Constructor.name?.toLowerCase().replace(/[^a-z]/g, "");
    if (!name) continue;
    const pos = Number.parseInt(s.position, 10);
    constructorStats[name] = {
      position: Number.isNaN(pos) ? null : pos,
      points: Number.parseFloat(s.points) || 0,
      wins: Number.parseInt(s.wins, 10) || 0,
      pointsPerRound: [],
    };
  }

  // Compute constructor cumulative points per round
  const constructorCumulative: Record<string, number> = {};
  for (const race of sortedRaces) {
    // Aggregate points by constructor for this round
    const roundConstructorPoints: Record<string, number> = {};
    const round = Number.parseInt(race.round, 10);
    for (const result of race.Results ?? []) {
      const cName = result.Constructor.name?.toLowerCase().replace(/[^a-z]/g, "");
      if (!cName) continue;
      roundConstructorPoints[cName] = (roundConstructorPoints[cName] ?? 0) + (Number.parseFloat(result.points) || 0);
    }
    for (const [cName, pts] of Object.entries(roundConstructorPoints)) {
      constructorCumulative[cName] = (constructorCumulative[cName] ?? 0) + pts;
      if (constructorStats[cName]) {
        constructorStats[cName].pointsPerRound.push({
          round,
          cumulativePoints: constructorCumulative[cName],
        });
      }
    }
  }

  return (
    <PageTransition>
      <SectionHeader title="Compare" subtitle="Head-to-head analysis" />
      <CompareTool driverStats={driverStats} constructorStats={constructorStats} />
    </PageTransition>
  );
}
