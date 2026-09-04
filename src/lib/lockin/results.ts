import type { Driver as JolpicaDriver, QualifyingResult, RaceResult, SprintRace } from "@/lib/api/types";
import { DRIVER_LIST } from "@/lib/constants/drivers";

/**
 * Jolpica classification rows to Lock In result fields. Every extractor
 * applies the date guard (Jolpica renumbers rounds after cancellations) and
 * returns null when the round is not the one asked for or has no rows yet.
 */

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Jolpica driver to constants id; unknown drivers become "code:XXX" so no pick can match them by accident. */
export function driverIdFromJolpica(driver: JolpicaDriver): string {
  const code = driver.code?.toUpperCase();
  const byCode = code ? DRIVER_LIST.find((d) => d.abbreviation === code) : undefined;
  if (byCode) return byCode.id;
  const family = normalize(driver.familyName);
  const byName = DRIVER_LIST.find((d) => normalize(d.lastName) === family);
  if (byName) return byName.id;
  return `code:${code ?? driver.driverId}`;
}

export interface QualiOutcome {
  pole: string;
}

export function extractQualiResult(races: QualifyingResult[], raceDate: string): QualiOutcome | null {
  const race = races.find((r) => r.date === raceDate);
  if (!race) return null;
  const rows = race.QualifyingResults ?? [];
  const p1 = rows.find((r) => r.position === "1");
  if (!p1) return null;
  return { pole: driverIdFromJolpica(p1.Driver) };
}

export interface RaceOutcome {
  p1: string;
  p2: string;
  p3: string;
  fastestLap: string | null;
  marginMs: number | null;
}

export function extractRaceResult(races: RaceResult[], raceDate: string): RaceOutcome | null {
  const race = races.find((r) => r.date === raceDate);
  if (!race) return null;
  const rows = race.Results ?? [];
  const byPos = (p: string) => rows.find((r) => r.position === p);
  const p1 = byPos("1");
  const p2 = byPos("2");
  const p3 = byPos("3");
  if (!p1 || !p2 || !p3) return null;
  const fastest = rows.find((r) => r.FastestLap?.rank === "1");
  const p1Ms = p1.Time?.millis ? Number.parseInt(p1.Time.millis, 10) : Number.NaN;
  const p2Ms = p2.Time?.millis ? Number.parseInt(p2.Time.millis, 10) : Number.NaN;
  const marginMs = Number.isFinite(p1Ms) && Number.isFinite(p2Ms) && p2Ms >= p1Ms ? p2Ms - p1Ms : null;
  return {
    p1: driverIdFromJolpica(p1.Driver),
    p2: driverIdFromJolpica(p2.Driver),
    p3: driverIdFromJolpica(p3.Driver),
    fastestLap: fastest ? driverIdFromJolpica(fastest.Driver) : null,
    marginMs,
  };
}

export interface SprintOutcome {
  sprintWinner: string;
}

export function extractSprintResult(sprint: SprintRace | null, raceDate: string): SprintOutcome | null {
  if (!sprint || sprint.date !== raceDate) return null;
  const winner = (sprint.SprintResults ?? []).find((r) => r.position === "1");
  if (!winner) return null;
  return { sprintWinner: driverIdFromJolpica(winner.Driver) };
}
