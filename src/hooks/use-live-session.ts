"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

interface LiveApiResponse {
  isLive: boolean;
  status: "NO SESSION" | "LIVE" | "FINISHED";
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
  status: "NO SESSION" | "LIVE" | "FINISHED";
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
const MAX_BACKOFF_MS = 60_000;
const BASE_BACKOFF_MS = 10_000;

export function useLiveSession(): UseLiveSessionReturn {
  const [data, setData] = useState<LiveApiResponse>({
    isLive: false,
    status: "NO SESSION",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [focusedDriverNumber, setFocusedDriverNumber] = useState<number | null>(null);

  const errorCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const focusedRef = useRef<number | null>(null);

  useEffect(() => {
    focusedRef.current = focusedDriverNumber;
  }, [focusedDriverNumber]);

  const fetchLiveData = useCallback(async () => {
    try {
      const focused = focusedRef.current;
      const url = focused ? `/api/live?focusedDriver=${focused}` : "/api/live";
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json: LiveApiResponse = await res.json();
      if (!mountedRef.current) return;

      setData(json);
      setError(json.error ?? null);
      setLastUpdated(new Date());
      setLoading(false);

      errorCountRef.current = 0;

      const interval = json.isLive ? POLL_LIVE_MS : POLL_IDLE_MS;
      timerRef.current = setTimeout(fetchLiveData, interval);
    } catch (err) {
      if (!mountedRef.current) return;

      errorCountRef.current += 1;
      const message =
        err instanceof Error ? err.message : "Failed to fetch live data";
      setError(message);
      setLoading(false);

      const backoff = Math.min(
        BASE_BACKOFF_MS * Math.pow(2, errorCountRef.current - 1),
        MAX_BACKOFF_MS
      );
      timerRef.current = setTimeout(fetchLiveData, backoff);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchLiveData();

    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [fetchLiveData]);

  return {
    isLive: data.isLive,
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
