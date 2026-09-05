"use client";

import { useEffect, useRef, useState } from "react";
import { adaptFeed, deepMerge, isPlainObject, type AdaptedLiveData, type FeedState } from "@/lib/live/feed-adapter";

export type { AdaptedLiveData } from "@/lib/live/feed-adapter";

// ── F1 SignalR feed → app view-model adapter ───────────────────────────────
//
// The /api/live-stream route proxies F1's live-timing SignalR feed as SSE. The
// feed's shapes differ from OpenF1's, so src/lib/live/feed-adapter.ts maps them
// onto the SAME view model the existing timing tower already consumes. That
// lets the broadcast UI be reused as-is for true live data.
//
// NOTE: the live-session path is implemented to F1's documented SignalR protocol
// (and matches FastF1 / f1-dash). It can only be exercised end-to-end during an
// actual session; off-session the route emits `offline` and this hook reports it.

export type StreamState = "connecting" | "live" | "offline" | "error";

export interface UseLiveStreamReturn {
  state: StreamState;
  data: AdaptedLiveData | null;
  lastUpdated: Date | null;
}

export function useLiveStream(enabled = true): UseLiveStreamReturn {
  const [state, setState] = useState<StreamState>("connecting");
  const [data, setData] = useState<AdaptedLiveData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const feedRef = useRef<FeedState>({});

  useEffect(() => {
    if (!enabled) {
      const raf = requestAnimationFrame(() => setState("offline"));
      return () => cancelAnimationFrame(raf);
    }

    feedRef.current = {};
    const es = new EventSource("/api/live-stream");
    let cancelled = false;

    const recompute = () => {
      if (cancelled) return;
      setData(adaptFeed(feedRef.current));
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

    // Server signals no live session: stop here, don't let EventSource retry.
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
