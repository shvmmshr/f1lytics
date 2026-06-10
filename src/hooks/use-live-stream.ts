"use client";

import { useEffect, useRef, useState } from "react";
import type {
  OpenF1Position,
  OpenF1Interval,
  OpenF1Driver,
  OpenF1Stint,
  OpenF1RaceControl,
} from "@/lib/api/types";
import type { LapStats, LiveWeather } from "@/hooks/use-live-session";

// ── F1 SignalR feed → app view-model adapter ───────────────────────────────
//
// The /api/live-stream route proxies F1's live-timing SignalR feed as SSE. The
// feed's shapes differ from OpenF1's, so this hook maps them onto the SAME view
// model the existing timing tower already consumes (positions/intervals/drivers/
// stints/lapStats/raceControl/weather/currentLap). That lets the broadcast UI be
// reused as-is for true live data.
//
// NOTE: the live-session path is implemented to F1's documented SignalR protocol
// (and matches FastF1 / f1-dash). It can only be exercised end-to-end during an
// actual session; off-session the route emits `offline` and this hook reports it.

export type StreamState = "connecting" | "live" | "offline" | "error";

export interface AdaptedLiveData {
  positions: OpenF1Position[];
  intervals: OpenF1Interval[];
  drivers: OpenF1Driver[];
  stints: OpenF1Stint[];
  lapStats: LapStats[];
  raceControl: OpenF1RaceControl[];
  weather: LiveWeather | null;
  currentLap: number | null;
  session: {
    name: string;
    type: string;
    circuitShortName: string;
    countryName: string;
  } | null;
}

export interface UseLiveStreamReturn {
  state: StreamState;
  data: AdaptedLiveData | null;
  lastUpdated: Date | null;
}

// Raw F1 feed state accumulated from snapshot + deltas, keyed by topic name.
type FeedState = Record<string, unknown>;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Recursively merge F1 delta `source` into `target` (mutates target). */
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
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
  if (value.includes("L")) return null; // lapped ("1L") — not a time gap
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
  return Object.entries(obj).filter(
    ([k, v]) => /^\d+$/.test(k) && isPlainObject(v),
  ) as [string, Record<string, unknown>][];
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
    headshot_url: (d.HeadshotUrl as string) ?? null,
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
    const interval = isPlainObject(line.IntervalToPositionAhead)
      ? line.IntervalToPositionAhead.Value
      : null;
    return {
      session_key: 0,
      meeting_key: 0,
      driver_number: Number(num),
      date: "",
      gap_to_leader: parseGap(line.GapToLeader),
      interval: parseGap(interval),
    };
  });
}

function deriveLapStats(state: FeedState): LapStats[] {
  return deriveTimingDataLines(state).map(([num, line]) => {
    const sectorsObj = isPlainObject(line.Sectors) ? line.Sectors : {};
    const sectorVal = (i: number): number | null => {
      const s = (sectorsObj as Record<string, unknown>)[String(i)];
      return isPlainObject(s) ? parseLapTime(s.Value) : null;
    };
    const last = isPlainObject(line.LastLapTime) ? line.LastLapTime.Value : null;
    const best = isPlainObject(line.BestLapTime) ? line.BestLapTime.Value : null;
    return {
      driver_number: Number(num),
      last: parseLapTime(last),
      best: parseLapTime(best),
      sectors: [sectorVal(0), sectorVal(1), sectorVal(2)] as [
        number | null,
        number | null,
        number | null,
      ],
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
    const stintsObj = line.Stints;
    const stintEntries = numericEntries(stintsObj);
    if (stintEntries.length === 0) continue;
    // Latest stint = highest numeric key.
    const [stintKey, stint] = stintEntries.sort(
      (a, b) => Number(b[0]) - Number(a[0]),
    )[0];
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
  const list = Array.isArray(messages)
    ? messages
    : isPlainObject(messages)
      ? Object.values(messages)
      : [];
  return (list as Record<string, unknown>[])
    .filter(isPlainObject)
    .map((m): OpenF1RaceControl => ({
      session_key: 0,
      date: String(m.Utc ?? ""),
      category: String(m.Category ?? "Other"),
      message: String(m.Message ?? ""),
      flag: (m.Flag as string) ?? null,
      driver_number: (m.RacingNumber as number) ?? null,
      lap_number: (m.Lap as number) ?? null,
    }))
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

function deriveCurrentLap(state: FeedState): number | null {
  const lc = state.LapCount;
  if (!isPlainObject(lc)) return null;
  const n = Number.parseInt(String(lc.CurrentLap ?? ""), 10);
  return Number.isNaN(n) ? null : n;
}

function deriveSession(state: FeedState): AdaptedLiveData["session"] {
  const si = state.SessionInfo;
  if (!isPlainObject(si)) return null;
  const meeting = isPlainObject(si.Meeting) ? si.Meeting : {};
  const circuit = isPlainObject(meeting.Circuit) ? meeting.Circuit : {};
  const country = isPlainObject(meeting.Country) ? meeting.Country : {};
  return {
    name: String(si.Name ?? meeting.Name ?? "SESSION"),
    type: String(si.Type ?? ""),
    circuitShortName: String(circuit.ShortName ?? meeting.Name ?? ""),
    countryName: String(country.Name ?? ""),
  };
}

function adapt(state: FeedState): AdaptedLiveData {
  return {
    positions: derivePositions(state),
    intervals: deriveIntervals(state),
    drivers: deriveDrivers(state),
    stints: deriveStints(state),
    lapStats: deriveLapStats(state),
    raceControl: deriveRaceControl(state),
    weather: deriveWeather(state),
    currentLap: deriveCurrentLap(state),
    session: deriveSession(state),
  };
}

export function useLiveStream(enabled = true): UseLiveStreamReturn {
  const [state, setState] = useState<StreamState>("connecting");
  const [data, setData] = useState<AdaptedLiveData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const feedRef = useRef<FeedState>({});

  useEffect(() => {
    if (!enabled) {
      setState("offline");
      return;
    }

    feedRef.current = {};
    const es = new EventSource("/api/live-stream");
    let cancelled = false;

    const recompute = () => {
      if (cancelled) return;
      setData(adapt(feedRef.current));
      setLastUpdated(new Date());
      setState("live");
    };

    es.addEventListener("snapshot", (e) => {
      try {
        feedRef.current = JSON.parse((e as MessageEvent).data) as FeedState;
      } catch {
        return;
      }
      recompute();
    });

    es.addEventListener("update", (e) => {
      try {
        const { topic, data: delta } = JSON.parse((e as MessageEvent).data) as {
          topic: string;
          data: unknown;
        };
        if (!topic) return;
        const existing = feedRef.current[topic];
        if (isPlainObject(existing) && isPlainObject(delta)) {
          deepMerge(existing, delta);
        } else {
          feedRef.current[topic] = delta;
        }
      } catch {
        return;
      }
      recompute();
    });

    // Server signals no live session — stop here, don't let EventSource retry.
    es.addEventListener("offline", () => {
      if (cancelled) return;
      setState("offline");
      es.close();
    });

    // Native onerror fires on connection drop; EventSource auto-reconnects and
    // will receive a fresh snapshot, so we only flag a transient error state.
    es.onerror = () => {
      if (cancelled) return;
      // If we never connected at all, treat as offline after the browser's retries.
      setState((prev) => (prev === "live" ? "live" : "error"));
    };

    return () => {
      cancelled = true;
      es.close();
    };
  }, [enabled]);

  return { state, data, lastUpdated };
}
