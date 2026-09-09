"use client";

import { useState, useEffect } from "react";
import type {
  OpenF1Position,
  OpenF1Interval,
  OpenF1Driver,
  OpenF1Stint,
  OpenF1RaceControl,
  OpenF1TeamRadio,
  OpenF1CarData,
} from "@/lib/api/types";

interface LiveSessionInfo {
  key: number;
  name: string;
  type: string;
  circuitShortName: string;
  countryName: string;
  dateStart: string;
  dateEnd: string | null;
}

export interface LapStats {
  driver_number: number;
  last: number | null;
  best: number | null;
  sectors: [number | null, number | null, number | null];
  lapNumber: number;
}

export interface LiveWeather {
  air_temperature: number;
  track_temperature: number;
  humidity: number;
  rainfall: number;
}

// LIVE_LOCKED: a session is on track per the baked schedule, but every free
// data feed paywalls/blocks access during the session (OpenF1 401, F1 SignalR
// auth-walled, static .jsonStream 403). We know WHAT is live, just not the data.
type LiveStatus = "NO SESSION" | "LIVE" | "FINISHED" | "REPLAY" | "LIVE_LOCKED";

interface LiveApiResponse {
  isLive: boolean;
  isReplay?: boolean;
  dataLocked?: boolean;
  status: LiveStatus;
  session?: LiveSessionInfo;
  positions?: OpenF1Position[];
  intervals?: OpenF1Interval[];
  drivers?: OpenF1Driver[];
  stints?: OpenF1Stint[];
  lapStats?: LapStats[];
  raceControl?: OpenF1RaceControl[];
  teamRadio?: OpenF1TeamRadio[];
  focusedCarData?: OpenF1CarData | null;
  focusedDriverNumber?: number | null;
  weather?: LiveWeather | null;
  error?: string;
}

export interface UseLiveSessionReturn {
  isLive: boolean;
  isReplay: boolean;
  status: LiveStatus;
  session: LiveSessionInfo | null;
  positions: OpenF1Position[];
  intervals: OpenF1Interval[];
  drivers: OpenF1Driver[];
  stints: OpenF1Stint[];
  lapStats: LapStats[];
  raceControl: OpenF1RaceControl[];
  teamRadio: OpenF1TeamRadio[];
  focusedCarData: OpenF1CarData | null;
  focusedDriverNumber: number | null;
  setFocusedDriverNumber: (n: number | null) => void;
  weather: LiveWeather | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const POLL_LIVE_MS = 10_000;
const POLL_IDLE_MS = 60_000;
const POLL_REPLAY_MS = 300_000;

export function useLiveSession(replaySessionKey: number | null = null, enabled = true): UseLiveSessionReturn {
  const [data, setData] = useState<LiveApiResponse>({ isLive: false, status: "NO SESSION" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [focusedDriverNumber, setFocusedDriverNumber] = useState<number | null>(null);

  useEffect(() => {
    let disposed = false;
    let generation = 0;
    let failures = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let request: AbortController | undefined;
    const load = async () => {
      if (disposed || !enabled || document.hidden) return;
      const current = ++generation;
      request?.abort();
      request = new AbortController();
      const controller = request;
      const timeout = setTimeout(() => controller.abort(), 30_000);
      try {
        const params = new URLSearchParams();
        if (replaySessionKey !== null) params.set("session", String(replaySessionKey));
        if (focusedDriverNumber !== null) params.set("focusedDriver", String(focusedDriverNumber));
        const res = await fetch(`/api/live?${params}`, { signal: request.signal });
        if (!res.ok) throw new Error(`Timing data temporarily unavailable (${res.status})`);
        const json: LiveApiResponse = await res.json();
        if (disposed || current !== generation) return;
        if (json.error) throw new Error(json.error);
        setData(json);
        setError(null);
        setLoading(false);
        setLastUpdated(new Date());
        failures = 0;
        timer = setTimeout(load, replaySessionKey !== null ? POLL_REPLAY_MS : json.isLive ? POLL_LIVE_MS : POLL_IDLE_MS);
      } catch (err) {
        if (disposed || current !== generation) return;
        setError(err instanceof Error ? err.message : "Timing data temporarily unavailable");
        setLoading(false);
        // Retain the last useful rows, but never claim a failed refresh is live.
        setData((previous) => ({ ...previous, isLive: false }));
        timer = setTimeout(load, Math.min(10_000 * 2 ** failures++, 60_000));
      } finally { clearTimeout(timeout); }
    };
    const resume = () => {
      clearTimeout(timer);
      ++generation;
      request?.abort();
      if (!document.hidden) void load();
    };
    timer = setTimeout(load, 0);
    document.addEventListener("visibilitychange", resume);
    return () => {
      disposed = true;
      ++generation;
      clearTimeout(timer);
      request?.abort();
      document.removeEventListener("visibilitychange", resume);
    };
  }, [replaySessionKey, focusedDriverNumber, enabled]);

  return {
    isLive: data.isLive,
    isReplay: data.isReplay ?? false,
    status: data.status,
    session: data.session ?? null,
    positions: data.positions ?? [],
    intervals: data.intervals ?? [],
    drivers: data.drivers ?? [],
    stints: data.stints ?? [],
    lapStats: data.lapStats ?? [],
    raceControl: data.raceControl ?? [],
    teamRadio: data.teamRadio ?? [],
    focusedCarData: data.focusedCarData ?? null,
    focusedDriverNumber,
    setFocusedDriverNumber,
    weather: data.weather ?? null,
    loading,
    error,
    lastUpdated,
  };
}
