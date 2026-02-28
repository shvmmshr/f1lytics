import type {
  JolpicaResponse,
  RaceTable,
  RaceResult,
  StandingsTable,
  DriverStanding,
  ConstructorStanding,
  QualifyingTable,
  QualifyingResult,
  ScheduleTable,
  RaceSchedule,
} from "./types";

const BASE_URL = "https://api.jolpi.ca/ergast/f1";

/**
 * Generic fetch helper for the Jolpica-F1 API.
 *
 * Uses Next.js ISR via `next: { revalidate }` to cache responses.
 * Default cache duration is 24 hours (86400 seconds).
 */
async function fetchJolpica<T>(
  path: string,
  revalidate: number = 86400
): Promise<JolpicaResponse<T>> {
  const url = `${BASE_URL}${path}`;

  const res = await fetch(url, {
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(
      `Jolpica API error: ${res.status} ${res.statusText} for ${url}`
    );
  }

  return res.json() as Promise<JolpicaResponse<T>>;
}

// -----------------------------------------------------------------------------
// Public API functions
// -----------------------------------------------------------------------------

/**
 * Fetch the race schedule for a given season.
 * Returns an array of RaceSchedule entries.
 */
export async function getRaceSchedule(
  season: string = "current"
): Promise<RaceSchedule[]> {
  const data = await fetchJolpica<ScheduleTable>(`/${season}.json`);
  return data.MRData.RaceTable.Races;
}

/**
 * Fetch race results for a given season, optionally filtered by round.
 * Returns an array of RaceResult entries (each containing a Results array).
 */
export async function getRaceResults(
  season: string,
  round?: string
): Promise<RaceResult[]> {
  const path = round
    ? `/${season}/${round}/results.json`
    : `/${season}/results.json`;
  const data = await fetchJolpica<RaceTable>(path);
  return data.MRData.RaceTable.Races;
}

/**
 * Fetch driver standings for a given season.
 * Returns an array of DriverStanding entries.
 * Revalidates every hour (3600s) since standings change frequently during a season.
 */
export async function getDriverStandings(
  season: string = "current"
): Promise<DriverStanding[]> {
  const data = await fetchJolpica<StandingsTable>(
    `/${season}/driverStandings.json`,
    3600
  );
  const lists = data.MRData.StandingsTable.StandingsLists;
  return lists.length > 0 ? (lists[0].DriverStandings ?? []) : [];
}

/**
 * Fetch constructor standings for a given season.
 * Returns an array of ConstructorStanding entries.
 * Revalidates every hour (3600s) since standings change frequently during a season.
 */
export async function getConstructorStandings(
  season: string = "current"
): Promise<ConstructorStanding[]> {
  const data = await fetchJolpica<StandingsTable>(
    `/${season}/constructorStandings.json`,
    3600
  );
  const lists = data.MRData.StandingsTable.StandingsLists;
  return lists.length > 0 ? (lists[0].ConstructorStandings ?? []) : [];
}

/**
 * Fetch qualifying results for a specific season and round.
 * Returns an array of QualifyingResult entries.
 */
export async function getQualifyingResults(
  season: string,
  round: string
): Promise<QualifyingResult[]> {
  const data = await fetchJolpica<QualifyingTable>(
    `/${season}/${round}/qualifying.json`
  );
  return data.MRData.RaceTable.Races;
}

/**
 * Fetch the most recent race result.
 * Revalidates every hour (3600s) to pick up new results promptly.
 * Returns the latest RaceResult or null if no results are available.
 */
export async function getLastRaceResult(): Promise<RaceResult | null> {
  const data = await fetchJolpica<RaceTable>(
    "/current/last/results.json",
    3600
  );
  const races = data.MRData.RaceTable.Races;
  return races.length > 0 ? races[0] : null;
}
