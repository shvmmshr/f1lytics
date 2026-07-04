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
  OpenF1Weather,
  OpenF1SessionResult,
} from "./types";
import { fetchWithRetry } from "./fetch-retry";

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
 *
 * `noStore` forces `cache: "no-store"` even when a `revalidate` value is
 * provided — used when an otherwise-cacheable endpoint is called from the
 * live route, where stale data (up to an hour) would break live timing.
 */
async function fetchOpenF1<T>(
  endpoint: string,
  params: QueryParams = {},
  revalidate?: number,
  noStore = false
): Promise<T[]> {
  const url = new URL(`${BASE_URL}${endpoint}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  const fetchOptions: RequestInit = {};

  if (noStore) {
    fetchOptions.cache = "no-store";
  } else if (revalidate !== undefined) {
    fetchOptions.next = { revalidate };
  } else {
    fetchOptions.cache = "no-store";
  }

  const response = await fetchWithRetry(url.toString(), fetchOptions);

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

/** Fetch sessions, optionally filtered by year, session_type, etc.
 *  Pass `noStore` when called from the live route so a new/active session is
 *  detected immediately rather than up to an hour late. */
export async function getSessions(
  params: QueryParams = {},
  noStore = false
): Promise<OpenF1Session[]> {
  return fetchOpenF1<OpenF1Session>("/sessions", params, 3600, noStore);
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

/**
 * Resolve the session_key of the most recently COMPLETED race, for the live
 * page's replay/demo button. Returns null if none found.
 */
export async function getLatestCompletedRaceKey(
  year = new Date().getFullYear()
): Promise<number | null> {
  try {
    const sessions = await getSessions({ year, session_type: "Race" }, true);
    const now = Date.now();
    const past = sessions
      .filter((s) => new Date(s.date_start).getTime() < now)
      .sort(
        (a, b) =>
          new Date(b.date_start).getTime() - new Date(a.date_start).getTime()
      );
    return past[0]?.session_key ?? null;
  } catch (err) {
    console.error("[f1lytics] getLatestCompletedRaceKey failed:", err);
    return null;
  }
}

// =============================================================================
// Lap data
// =============================================================================

/** Fetch lap timing data for a session (optionally for a single driver).
 *  `revalidate` can be raised for settled sessions whose data is immutable. */
export async function getLaps(
  params: {
    session_key: number;
    driver_number?: number;
  },
  noStore = false,
  revalidate = 3600
): Promise<OpenF1Lap[]> {
  return fetchOpenF1<OpenF1Lap>("/laps", params, revalidate, noStore);
}

// =============================================================================
// Stint data (tire compounds, stint lengths)
// =============================================================================

/** Fetch tyre stint data for a session (optionally for a single driver).
 *  `revalidate` can be raised for settled sessions whose data is immutable. */
export async function getStints(
  params: {
    session_key: number;
    driver_number?: number;
  },
  noStore = false,
  revalidate = 3600
): Promise<OpenF1Stint[]> {
  return fetchOpenF1<OpenF1Stint>("/stints", params, revalidate, noStore);
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

/** Fetch race control messages (flags, safety car, penalties, etc.).
 *  `revalidate` can be raised for settled sessions whose data is immutable. */
export async function getRaceControl(
  params: {
    session_key: number;
  },
  noStore = false,
  revalidate = 3600
): Promise<OpenF1RaceControl[]> {
  return fetchOpenF1<OpenF1RaceControl>("/race_control", params, revalidate, noStore);
}

// =============================================================================
// Session results (final classification — available minutes after a session)
// =============================================================================

/** Fetch the final classification of a session. Published by OpenF1 within
 *  minutes of the chequered flag — hours before Jolpica/Ergast mirrors it.
 *  Returns [] when the session hasn't produced results yet (OpenF1 responds
 *  with a non-array "no results" object in that case). */
export async function getSessionResult(
  params: { session_key: number },
  revalidate = 300
): Promise<OpenF1SessionResult[]> {
  const rows = await fetchOpenF1<OpenF1SessionResult>(
    "/session_result",
    params,
    revalidate
  );
  return Array.isArray(rows) ? rows : [];
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
export async function getDrivers(
  params: {
    session_key: number;
  },
  noStore = false
): Promise<OpenF1Driver[]> {
  return fetchOpenF1<OpenF1Driver>("/drivers", params, 3600, noStore);
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
export async function getPositions(
  params: {
    session_key: number;
    driver_number?: number;
  },
  noStore = false,
  revalidate = 3600
): Promise<OpenF1Position[]> {
  // Cached by default (historical positions never change); the live route
  // passes noStore. An uncached fetch here would also force `revalidate: 0`,
  // which breaks static prerendering of the race pages that call this.
  return fetchOpenF1<OpenF1Position>("/position", params, revalidate, noStore);
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

// =============================================================================
// Weather (live — no cache)
// =============================================================================

/** Fetch weather readings for a session (air/track temp, humidity, rainfall, wind). */
export async function getWeather(params: {
  session_key: number;
}): Promise<OpenF1Weather[]> {
  return fetchOpenF1<OpenF1Weather>("/weather", params);
}
