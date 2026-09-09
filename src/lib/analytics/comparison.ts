import type { DriverStanding, ConstructorStanding, RaceResult, QualifyingResult, SprintRace } from "@/lib/api/types";
import { mapConstructorToTeamId } from "@/lib/constructor-map";
import { isRaceFinisher } from "./results";
import { buildPointsProgression } from "./points";

function driverCode(driver: { code?: string; familyName: string }): string {
  return (driver.code ?? driver.familyName.slice(0, 3)).toUpperCase();
}

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

/** Separate official championship totals from Grand Prix-only race statistics. */
export function buildComparisonStats(
  driverStandings: DriverStanding[], constructorStandings: ConstructorStanding[],
  raceResults: RaceResult[], qualifyingResults: QualifyingResult[], sprintResults: SprintRace[],
) {
  // Build driver stats map
  const driverStats: Record<string, DriverStat> = {};

  for (const s of driverStandings) {
    const code = driverCode(s.Driver);
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


  // Sort race results by round
  const sortedRaces = [...raceResults].sort(
    (a, b) => Number.parseInt(a.round, 10) - Number.parseInt(b.round, 10)
  );

  // Enrich with race results
  for (const race of sortedRaces) {
    const round = Number.parseInt(race.round, 10);
    for (const result of race.Results ?? []) {
      const code = driverCode(result.Driver);
      if (!driverStats[code]) continue;
      const pos = Number.parseInt(result.position, 10);
      const pts = Number.parseFloat(result.points) || 0;
      const isFinished = isRaceFinisher(result.status);

      driverStats[code].races++;
      if (!Number.isNaN(pos)) {
        // Podiums/best finish only count classified finishes (a retirement
        // can still carry a numeric classification position).
        if (isFinished && pos <= 3) driverStats[code].podiums++;
        if (
          isFinished &&
          (driverStats[code].bestFinish === null || pos < driverStats[code].bestFinish!)
        ) {
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
      const code = driverCode(result.Driver);
      if (!driverStats[code]) continue;
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
    // Key by our internal team id (handles Cadillac/Haas/Audi which the old
    // name-substring match missed). Falls back to a normalized name key.
    const teamId =
      mapConstructorToTeamId(s.Constructor.constructorId, s.Constructor.name) ??
      s.Constructor.name?.toLowerCase().replace(/[^a-z]/g, "");
    if (!teamId) continue;
    const pos = Number.parseInt(s.position, 10);
    constructorStats[teamId] = {
      position: Number.isNaN(pos) ? null : pos,
      points: Number.parseFloat(s.points) || 0,
      wins: Number.parseInt(s.wins, 10) || 0,
      pointsPerRound: [],
    };
  }

  const progression = buildPointsProgression(raceResults, sprintResults);
  for (const [code, stat] of Object.entries(driverStats)) stat.pointsPerRace = progression.drivers[code] ?? [];
  for (const [id, stat] of Object.entries(constructorStats)) stat.pointsPerRound = progression.teams[id] ?? [];
  return { driverStats, constructorStats };
}
