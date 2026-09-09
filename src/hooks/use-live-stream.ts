"use client";

import { useEffect, useState } from "react";
import { adaptFeed, deepMerge, isPlainObject, type AdaptedLiveData, type FeedState } from "@/lib/live/feed-adapter";
import { createStreamConnection, type StreamState } from "@/lib/live/stream-connection";
import { getLiveWindowSession } from "@/lib/constants/sessions";

export type { AdaptedLiveData } from "@/lib/live/feed-adapter";
export type { StreamState } from "@/lib/live/stream-connection";

export interface UseLiveStreamReturn {
  state: StreamState;
  data: AdaptedLiveData | null;
  lastUpdated: Date | null;
  checkedAt: number;
}

export function useLiveStream(enabled = true): UseLiveStreamReturn {
  const [state, setState] = useState<StreamState>("connecting");
  const [data, setData] = useState<AdaptedLiveData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [checkedAt, setCheckedAt] = useState(0);

  useEffect(() => {
    let feed: FeedState = {};
    let flush: ReturnType<typeof setTimeout> | undefined;
    const connection = createStreamConnection({
      open: () => {
        feed = {};
        return new EventSource("/api/live-stream");
      },
      canConnect: () => enabled && !document.hidden && getLiveWindowSession(Date.now()) !== null,
      now: Date.now,
      onState: (next) => {
        setState(next);
        if (next !== "live") {
          clearTimeout(flush);
          flush = undefined;
          setData(null);
        }
      },
      onMessage: (type, raw) => {
        try {
          const parsed: unknown = JSON.parse(raw);
          if (!isPlainObject(parsed)) return false;
          if (type === "snapshot") feed = parsed;
          else {
            if (typeof parsed.topic !== "string" || !("data" in parsed) || ["__proto__", "constructor", "prototype"].includes(parsed.topic)) return false;
            const existing = feed[parsed.topic];
            if (isPlainObject(existing) && isPlainObject(parsed.data)) deepMerge(existing, parsed.data);
            else feed[parsed.topic] = parsed.data;
          }
        } catch { return false; }
        // Coalesce bursts of topic deltas into at most ten React updates/second.
        if (flush === undefined) flush = setTimeout(() => {
          flush = undefined;
          setData(adaptFeed(feed));
          setLastUpdated(new Date());
          setCheckedAt(Date.now());
        }, 100);
        return true;
      },
    });
    const check = () => { connection.tick(); setCheckedAt(Date.now()); };
    const initial = setTimeout(check, 0);
    const timer = setInterval(check, 5_000);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
      clearTimeout(flush);
      document.removeEventListener("visibilitychange", check);
      connection.dispose();
    };
  }, [enabled]);

  return { state, data, lastUpdated, checkedAt };
}
