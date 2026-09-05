import type { OpenF1Driver, OpenF1Interval, OpenF1Position, OpenF1RaceControl, OpenF1Stint } from "@/lib/api/types";
import type { LapStats, LiveWeather } from "@/hooks/use-live-session";
import { parseTrackLocal, type LiveSessionInfo } from "@/hooks/live-stream-status";

/**
 * F1 SignalR feed state to the app's view model. Pure functions shared by the
 * browser hook (deltas merged over time) and the server snapshot endpoint
 * (one-shot). The feed's shapes differ from OpenF1's, so this maps them onto
 * the same types the timing tower already consumes.
 */

/** Raw F1 feed state accumulated from snapshot + deltas, keyed by topic name. */
export type FeedState = Record<string, unknown>;

export interface TrackStatus {
  /** F1 codes: 1 clear, 2 yellow, 4 safety car, 5 red, 6 VSC, 7 VSC ending. */
  code: string;
  message: string;
}

export interface AdaptedLiveData {
  positions: OpenF1Position[];
  intervals: OpenF1Interval[];
  drivers: OpenF1Driver[];
  stints: OpenF1Stint[];
  lapStats: LapStats[];
  raceControl: OpenF1RaceControl[];
  weather: LiveWeather | null;
  currentLap: number | null;
  totalLaps: number | null;
  trackStatus: TrackStatus | null;
  session: LiveSessionInfo | null;
}

export function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Recursively merge F1 delta `source` into `target` (mutates target). */
export function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = target[key];
    if (isPlainObject(sv) && isPlainObject(tv)) {
      deepMerge(tv, sv);
    } else {
      target[key] = sv;
    }
  }
  return target;
}

// ── Field parsers ──────────────────────────────────────────────────────────

/** "+1.234" / "1.234" / "1L" / "" → number of seconds, or null. */
function parseGap(value: unknown): number | null {
  if (typeof value !== "string" || value === "") return null;
  if (value.includes("L")) return null; // lapped ("1L"): not a time gap
  const n = Number.parseFloat(value.replace("+", ""));
  return Number.isNaN(n) ? null : n;
}

/** "1:23.456" or "23.456" → seconds, or null. */
function parseLapTime(value: unknown): number | null {
  if (typeof value !== "string" || value === "") return null;
  const parts = value.split(":");
  if (parts.length === 2) {
    const m = Number.parseInt(parts[0], 10);
    const s = Number.parseFloat(parts[1]);
    if (Number.isNaN(m) || Number.isNaN(s)) return null;
    return m * 60 + s;
  }
  const s = Number.parseFloat(value);
  return Number.isNaN(s) ? null : s;
}

function numericEntries(obj: unknown): [string, Record<string, unknown>][] {
  if (!isPlainObject(obj)) return [];
  return Object.entries(obj).filter(([k, v]) => /^\d+$/.test(k) && isPlainObject(v)) as [string, Record<string, unknown>][];
}

// ── Topic → view-model derivations ───────────────────────────────────────────

function deriveDrivers(state: FeedState): OpenF1Driver[] {
  return numericEntries(state.DriverList).map(([num, d]) => ({
    session_key: 0,
    driver_number: Number(num),
    full_name: String(d.FullName ?? d.BroadcastName ?? `#${num}`),
    name_acronym: String(d.Tla ?? `#${num}`),
    team_name: String(d.TeamName ?? ""),
    team_colour: String(d.TeamColour ?? ""),
    headshot_url: typeof d.HeadshotUrl === "string" ? d.HeadshotUrl : null,
    country_code: String(d.CountryCode ?? ""),
  }));
}

function deriveTimingDataLines(state: FeedState): [string, Record<string, unknown>][] {
  const td = state.TimingData;
  if (!isPlainObject(td)) return [];
  return numericEntries(td.Lines);
}

function derivePositions(state: FeedState): OpenF1Position[] {
  return deriveTimingDataLines(state)
    .map(([num, line]) => ({
      session_key: 0,
      meeting_key: 0,
      driver_number: Number(num),
      date: "",
      position: Number.parseInt(String(line.Position ?? "0"), 10) || 0,
    }))
    .filter((p) => p.position > 0);
}

function deriveIntervals(state: FeedState): OpenF1Interval[] {
  return deriveTimingDataLines(state).map(([num, line]) => {
    const interval = isPlainObject(line.IntervalToPositionAhead) ? line.IntervalToPositionAhead.Value : null;
    // Lapped cars carry "1L" style gaps; keep the string so the UI can show "+1 LAP".
    const rawGap = typeof line.GapToLeader === "string" ? line.GapToLeader : null;
    const gap = parseGap(rawGap);
    return {
      session_key: 0,
      meeting_key: 0,
      driver_number: Number(num),
      date: "",
      gap_to_leader: gap ?? (rawGap && rawGap.includes("L") ? `+${rawGap.replace("L", " LAP")}` : null),
      interval: parseGap(interval),
    };
  });
}

function deriveLapStats(state: FeedState): LapStats[] {
  return deriveTimingDataLines(state).map(([num, line]) => {
    const sectorsObj = isPlainObject(line.Sectors) ? line.Sectors : {};
    const sectorVal = (i: number): number | null => {
      const s = sectorsObj[String(i)];
      return isPlainObject(s) ? parseLapTime(s.Value) : null;
    };
    const last = isPlainObject(line.LastLapTime) ? line.LastLapTime.Value : null;
    const best = isPlainObject(line.BestLapTime) ? line.BestLapTime.Value : null;
    return {
      driver_number: Number(num),
      last: parseLapTime(last),
      best: parseLapTime(best),
      sectors: [sectorVal(0), sectorVal(1), sectorVal(2)] as [number | null, number | null, number | null],
      lapNumber: Number.parseInt(String(line.NumberOfLaps ?? "0"), 10) || 0,
    };
  });
}

function deriveStints(state: FeedState): OpenF1Stint[] {
  const ta = state.TimingAppData;
  if (!isPlainObject(ta)) return [];
  // Per-driver current lap count, to express "laps on this tyre" via the OpenF1
  // stint shape the UI expects (it computes lapNumber - lap_start + 1 + age).
  const lapByDriver = new Map<number, number>();
  for (const s of deriveLapStats(state)) lapByDriver.set(s.driver_number, s.lapNumber);

  const out: OpenF1Stint[] = [];
  for (const [num, line] of numericEntries(ta.Lines)) {
    const stintEntries = numericEntries(line.Stints);
    if (stintEntries.length === 0) continue;
    // Latest stint = highest numeric key.
    const [stintKey, stint] = stintEntries.sort((a, b) => Number(b[0]) - Number(a[0]))[0];
    const totalLaps = Number.parseInt(String(stint.TotalLaps ?? "0"), 10) || 0;
    const driverNum = Number(num);
    const lapNumber = lapByDriver.get(driverNum) ?? totalLaps;
    out.push({
      session_key: 0,
      driver_number: driverNum,
      stint_number: Number(stintKey) + 1,
      compound: String(stint.Compound ?? "UNKNOWN"),
      // Choose lap_start so the UI's laps-on-tyre formula yields totalLaps.
      lap_start: lapNumber - totalLaps + 1,
      lap_end: lapNumber,
      tyre_age_at_start: 0,
    });
  }
  return out;
}

function deriveRaceControl(state: FeedState): OpenF1RaceControl[] {
  const rc = state.RaceControlMessages;
  if (!isPlainObject(rc)) return [];
  const messages = rc.Messages;
  const list = Array.isArray(messages) ? messages : isPlainObject(messages) ? Object.values(messages) : [];
  return (list as unknown[])
    .filter(isPlainObject)
    .map(
      (m): OpenF1RaceControl => ({
        session_key: 0,
        date: String(m.Utc ?? ""),
        category: String(m.Category ?? "Other"),
        message: String(m.Message ?? ""),
        flag: typeof m.Flag === "string" ? m.Flag : null,
        driver_number: typeof m.RacingNumber === "number" ? m.RacingNumber : null,
        lap_number: typeof m.Lap === "number" ? m.Lap : null,
      }),
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);
}

function deriveWeather(state: FeedState): LiveWeather | null {
  const w = state.WeatherData;
  if (!isPlainObject(w)) return null;
  return {
    air_temperature: Number.parseFloat(String(w.AirTemp ?? "0")) || 0,
    track_temperature: Number.parseFloat(String(w.TrackTemp ?? "0")) || 0,
    humidity: Number.parseFloat(String(w.Humidity ?? "0")) || 0,
    rainfall: Number.parseFloat(String(w.Rainfall ?? "0")) || 0,
  };
}

function deriveLapCount(state: FeedState): { current: number | null; total: number | null } {
  const lc = state.LapCount;
  if (!isPlainObject(lc)) return { current: null, total: null };
  const current = Number.parseInt(String(lc.CurrentLap ?? ""), 10);
  const total = Number.parseInt(String(lc.TotalLaps ?? ""), 10);
  return { current: Number.isNaN(current) ? null : current, total: Number.isNaN(total) ? null : total };
}

function deriveTrackStatus(state: FeedState): TrackStatus | null {
  const ts = state.TrackStatus;
  if (!isPlainObject(ts)) return null;
  return { code: String(ts.Status ?? ""), message: String(ts.Message ?? "") };
}

function deriveSession(state: FeedState): LiveSessionInfo | null {
  const si = state.SessionInfo;
  if (!isPlainObject(si)) return null;
  const meeting = isPlainObject(si.Meeting) ? si.Meeting : {};
  const circuit = isPlainObject(meeting.Circuit) ? meeting.Circuit : {};
  const country = isPlainObject(meeting.Country) ? meeting.Country : {};
  const clock = isPlainObject(state.ExtrapolatedClock) ? state.ExtrapolatedClock : {};
  return {
    name: String(si.Name ?? meeting.Name ?? "SESSION"),
    type: String(si.Type ?? ""),
    circuitShortName: String(circuit.ShortName ?? meeting.Name ?? ""),
    countryName: String(country.Name ?? ""),
    status: typeof si.SessionStatus === "string" ? si.SessionStatus : null,
    endsAtMs: parseTrackLocal(si.EndDate, si.GmtOffset),
    extrapolating: clock.Extrapolating === true,
  };
}

export function adaptFeed(state: FeedState): AdaptedLiveData {
  const laps = deriveLapCount(state);
  return {
    positions: derivePositions(state),
    intervals: deriveIntervals(state),
    drivers: deriveDrivers(state),
    stints: deriveStints(state),
    lapStats: deriveLapStats(state),
    raceControl: deriveRaceControl(state),
    weather: deriveWeather(state),
    currentLap: laps.current,
    totalLaps: laps.total,
    trackStatus: deriveTrackStatus(state),
    session: deriveSession(state),
  };
}
