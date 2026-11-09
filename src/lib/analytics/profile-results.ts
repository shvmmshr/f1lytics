import type { RaceResult, ResultItem } from "@/lib/api/types";
import { CIRCUIT_LIST } from "@/lib/constants/circuits";
import { mapConstructorToTeamId } from "@/lib/constructor-map";
import { getDriverFromJolpica } from "@/lib/driver-map";

/** Match the reviewed calendar by date, since cancelled events shift API rounds.
 * Unknown dates retain their source round rather than attaching another race. */
export function profileRaceRound(race: Pick<RaceResult, "date" | "round">): number {
  return CIRCUIT_LIST.find((circuit) => !circuit.cancelled && circuit.raceDate === race.date)?.round
    ?? Number.parseInt(race.round, 10);
}

/** The constructor on the classification owns these points, even when a driver
 * normally races for another team. Driver fallback is only for unknown teams. */
export function teamRaceEntries(
  results: ResultItem[],
  teamId: string,
  fallbackDriverCodes: ReadonlySet<string> = new Set(),
): ResultItem[] {
  return results.filter((result) => {
    const mapped = mapConstructorToTeamId(result.Constructor.constructorId, result.Constructor.name);
    if (mapped) return mapped === teamId;
    const code = getDriverFromJolpica(result.Driver)?.abbreviation ?? result.Driver.code?.toUpperCase();
    return Boolean(code && fallbackDriverCodes.has(code));
  });
}
