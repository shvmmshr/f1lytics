"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  OpenF1Position,
  OpenF1Interval,
  OpenF1Driver,
} from "@/lib/api/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LiveSessionInfo {
  key: number;
  name: string;
  type: string;
  circuitShortName: string;
  countryName: string;
  dateStart: string;
  dateEnd: string | null;
}

interface LiveApiResponse {
  isLive: boolean;
  status: "NO SESSION" | "LIVE" | "FINISHED";
  session?: LiveSessionInfo;
  positions?: OpenF1Position[];
  intervals?: OpenF1Interval[];
  drivers?: OpenF1Driver[];
  error?: string;
}

export interface UseLiveSessionReturn {
  isLive: boolean;
  status: "NO SESSION" | "LIVE" | "FINISHED";
  session: LiveSessionInfo | null;
  positions: OpenF1Position[];
  intervals: OpenF1Interval[];
  drivers: OpenF1Driver[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POLL_LIVE_MS = 10_000; // 10 seconds when live
const POLL_IDLE_MS = 60_000; // 60 seconds when no session
const MAX_BACKOFF_MS = 60_000; // cap exponential backoff at 60s
const BASE_BACKOFF_MS = 10_000; // start backoff at 10s

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useLiveSession(): UseLiveSessionReturn {
  const [data, setData] = useState<LiveApiResponse>({
    isLive: false,
    status: "NO SESSION",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const errorCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const fetchLiveData = useCallback(async () => {
    try {
      const res = await fetch("/api/live");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json: LiveApiResponse = await res.json();

      if (!mountedRef.current) return;

      setData(json);
      setError(json.error ?? null);
      setLastUpdated(new Date());
      setLoading(false);

      // Reset backoff on success
      errorCountRef.current = 0;

      // Schedule next poll
      const interval = json.isLive ? POLL_LIVE_MS : POLL_IDLE_MS;
      timerRef.current = setTimeout(fetchLiveData, interval);
    } catch (err) {
      if (!mountedRef.current) return;

      errorCountRef.current += 1;
      const message =
        err instanceof Error ? err.message : "Failed to fetch live data";
      setError(message);
      setLoading(false);

      // Exponential backoff: 10s, 20s, 40s, capped at 60s
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
    loading,
    error,
    lastUpdated,
  };
}
