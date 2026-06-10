import type {
  OpenF1Session,
  OpenF1Position,
  OpenF1CarData,
  OpenF1Lap,
  OpenF1Stint,
  OpenF1Interval,
  OpenF1Location,
  OpenF1RaceControl,
  OpenF1Pit,
  OpenF1Driver,
  OpenF1TeamRadio,
} from "./types";

const BASE_URL = "https://api.openf1.org/v1";

type QueryParams = Record<string, string | number | undefined>;

/**
 * Generic fetcher for the OpenF1 API.
 *
 * Builds URL with query params (stripping undefined values), supports
 * Next.js ISR via `next: { revalidate }`, and always returns `T[]`
 * since every OpenF1 endpoint returns a JSON array.
 *
 * When `revalidate` is omitted the request uses `cache: "no-store"`,
 * which is appropriate for live/real-time endpoints.
 */
async function fetchOpenF1<T>(
  endpoint: string,
  params: QueryParams = {},
  revalidate?: number
): Promise<T[]> {
  const url = new URL(`${BASE_URL}${endpoint}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  const fetchOptions: RequestInit = {};

  if (revalidate !== undefined) {
    fetchOptions.next = { revalidate };
  } else {
    fetchOptions.cache = "no-store";
  }

  const response = await fetch(url.toString(), fetchOptions);

  if (!response.ok) {
    throw new Error(
      `OpenF1 API error: ${response.status} ${response.statusText} — ${endpoint}`
    );
  }

  return response.json() as Promise<T[]>;
}

// =============================================================================
// Session endpoints
// =============================================================================

/** Fetch sessions, optionally filtered by year, session_type, etc. */
export async function getSessions(
  params: QueryParams = {}
): Promise<OpenF1Session[]> {
  return fetchOpenF1<OpenF1Session>("/sessions", params, 3600);
}

/** Get the most recent session of a given type (defaults to "Race"). */
export async function getLatestSession(
  sessionType = "Race"
): Promise<OpenF1Session | null> {
  const sessions = await fetchOpenF1<OpenF1Session>(
    "/sessions",
    { session_type: sessionType, year: new Date().getFullYear() },
    3600
  );

  return sessions.length > 0 ? sessions[sessions.length - 1] : null;
}

// =============================================================================
// Lap data
// =============================================================================

/** Fetch lap timing data for a session (optionally for a single driver). */
export async function getLaps(params: {
  session_key: number;
  driver_number?: number;
}): Promise<OpenF1Lap[]> {
  return fetchOpenF1<OpenF1Lap>("/laps", params, 3600);
}

// =============================================================================
// Stint data (tire compounds, stint lengths)
// =============================================================================

/** Fetch tyre stint data for a session (optionally for a single driver). */
export async function getStints(params: {
  session_key: number;
  driver_number?: number;
}): Promise<OpenF1Stint[]> {
  return fetchOpenF1<OpenF1Stint>("/stints", params, 3600);
}

// =============================================================================
// Interval / gap data (live — no cache)
// =============================================================================

/** Fetch gap-to-leader and interval data. No cache (live data). */
export async function getIntervals(params: {
  session_key: number;
  driver_number?: number;
}): Promise<OpenF1Interval[]> {
  return fetchOpenF1<OpenF1Interval>("/intervals", params);
}

// =============================================================================
// Car location on track (live — no cache)
// =============================================================================

/** Fetch car x/y/z coordinates on track. No cache (live data). */
export async function getLocations(params: {
  session_key: number;
  driver_number?: number;
  date?: string;
}): Promise<OpenF1Location[]> {
  return fetchOpenF1<OpenF1Location>("/location", params);
}

// =============================================================================
// Race control messages (flags, incidents)
// =============================================================================

/** Fetch race control messages (flags, safety car, penalties, etc.). */
export async function getRaceControl(params: {
  session_key: number;
}): Promise<OpenF1RaceControl[]> {
  return fetchOpenF1<OpenF1RaceControl>("/race_control", params, 3600);
}

// =============================================================================
// Pit stop data
// =============================================================================

/** Fetch pit stop data for a session (optionally for a single driver). */
export async function getPits(params: {
  session_key: number;
  driver_number?: number;
}): Promise<OpenF1Pit[]> {
  return fetchOpenF1<OpenF1Pit>("/pit", params, 3600);
}

// =============================================================================
// Driver info (per session)
// =============================================================================

/** Fetch driver information for a given session. */
export async function getDrivers(params: {
  session_key: number;
}): Promise<OpenF1Driver[]> {
  return fetchOpenF1<OpenF1Driver>("/drivers", params, 3600);
}

// =============================================================================
// Telemetry / car data (live — no cache)
// =============================================================================

/** Fetch car telemetry (speed, RPM, gear, throttle, brake, DRS). No cache. */
export async function getCarData(params: {
  session_key: number;
  driver_number: number;
  date?: string;
}): Promise<OpenF1CarData[]> {
  return fetchOpenF1<OpenF1CarData>("/car_data", params);
}

// =============================================================================
// Position data (live — no cache)
// =============================================================================

/** Fetch position data for a session (optionally for a single driver). No cache. */
export async function getPositions(params: {
  session_key: number;
  driver_number?: number;
}): Promise<OpenF1Position[]> {
  return fetchOpenF1<OpenF1Position>("/position", params);
}

// =============================================================================
// Team radio (live — no cache)
// =============================================================================

/** Fetch team radio recordings for a session (optionally per driver). */
export async function getTeamRadio(params: {
  session_key: number;
  driver_number?: number;
}): Promise<OpenF1TeamRadio[]> {
  return fetchOpenF1<OpenF1TeamRadio>("/team_radio", params);
}
