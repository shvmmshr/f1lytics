import type { RaceResult } from "@/lib/api/types";
import type { Circuit } from "@/lib/constants/circuits";
import { getWeekendSchedule, SESSION_DURATIONS_MS } from "@/lib/constants/sessions";

/** A calendar round number is not a safe join after cancellations. */
export function matchingCircuitRace(circuit: Circuit, race?: RaceResult): RaceResult | undefined {
  return !circuit.cancelled && race?.season === "2026" && race.date === circuit.raceDate ? race : undefined;
}

export function circuitWeekendState(circuit: Circuit, now: number, race?: RaceResult) {
  if (circuit.cancelled) return "cancelled";
  if (matchingCircuitRace(circuit, race)?.Results?.some(result => result.position === "1")) return "completed";
  const schedule = getWeekendSchedule(circuit.raceDate);
  const start = Date.parse(`${circuit.raceDate}T${circuit.raceTime}`);
  const opening = schedule?.fp1 ? Date.parse(schedule.fp1) : start;
  if (now < opening) return "upcoming";
  if (now < start + SESSION_DURATIONS_MS.race) return "weekend";
  // A scheduled finish never proves the race has finished or results are ready.
  return "awaiting";
}

function lapMilliseconds(time: string | undefined): number | null {
  const parts = time?.match(/^(\d+):([0-5]\d)\.(\d{3})$/);
  if (!parts) return null;
  const value = Number(parts[1]) * 60000 + Number(parts[2]) * 1000 + Number(parts[3]);
  return value > 0 ? value : null;
}

/** Race laps only. A maiden venue can gain its first record once results arrive. */
export function circuitLapRecord(circuit: Circuit, race?: RaceResult) {
  let time = circuit.lapRecord;
  let best = lapMilliseconds(time);
  let holder = circuit.lapRecordHolder;
  let year = circuit.lapRecordYear;
  let source: "guide" | "classification" = "guide";
  for (const result of matchingCircuitRace(circuit, race)?.Results ?? []) {
    if (/disqualified/i.test(result.status)) continue;
    const candidate = lapMilliseconds(result.FastestLap?.Time.time);
    if (candidate !== null && (best === null || candidate < best)) {
      time = result.FastestLap!.Time.time;
      best = candidate;
      holder = `${result.Driver.givenName} ${result.Driver.familyName}`;
      year = 2026;
      source = "classification";
    }
  }
  return best === null ? null : { time, holder, year, source };
}
