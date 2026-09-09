import type { RaceResult, SprintRace, ResultItem } from "@/lib/api/types";
import { CIRCUIT_LIST, getApiRound } from "@/lib/constants/circuits";
import { mapConstructorToTeamId } from "@/lib/constructor-map";

export interface PointsEntry { round: number; cumulativePoints: number }

/** Join on race date; use local calendar numbers after cancelled rounds. */
export function buildPointsProgression(races: RaceResult[], sprints: SprintRace[]) {
  const weekends = new Map<string, { round: number; rows: ResultItem[] }>();
  for (const race of [...races, ...sprints]) {
    const circuit = CIRCUIT_LIST.find((c) => !c.cancelled && c.raceDate === race.date);
    if (!circuit || Number(race.round) !== getApiRound(circuit)) continue;
    const weekend = weekends.get(race.date) ?? { round: circuit.round, rows: [] };
    weekend.rows.push(...("SprintResults" in race ? race.SprintResults ?? [] : (race as RaceResult).Results ?? []));
    weekends.set(race.date, weekend);
  }
  const drivers: Record<string, PointsEntry[]> = {};
  const teams: Record<string, PointsEntry[]> = {};
  const driverTotals: Record<string, number> = {};
  const teamTotals: Record<string, number> = {};
  for (const weekend of [...weekends.values()].sort((a, b) => a.round - b.round)) {
    for (const row of weekend.rows) {
      const points = Number(row.points);
      if (!Number.isFinite(points) || points < 0) continue;
      const code = (row.Driver.code ?? row.Driver.familyName.slice(0, 3)).toUpperCase();
      driverTotals[code] = (driverTotals[code] ?? 0) + points;
      const id = mapConstructorToTeamId(row.Constructor.constructorId, row.Constructor.name);
      if (id) teamTotals[id] = (teamTotals[id] ?? 0) + points;
    }
    for (const [code, total] of Object.entries(driverTotals)) (drivers[code] ??= []).push({ round: weekend.round, cumulativePoints: total });
    for (const [id, total] of Object.entries(teamTotals)) (teams[id] ??= []).push({ round: weekend.round, cumulativePoints: total });
  }
  return { drivers, teams };
}
