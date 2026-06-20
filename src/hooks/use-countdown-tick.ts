"use client";

import { useEffect, useRef } from "react";

export type CountdownRemaining = {
  d: number;
  h: number;
  m: number;
  s: number;
  /** true once the target time has passed (all fields are 0). */
  done: boolean;
};

function computeRemaining(targetMs: number, nowMs: number): CountdownRemaining {
  const diff = targetMs - nowMs;
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, done: true };
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff / 3_600_000) % 24),
    m: Math.floor((diff / 60_000) % 60),
    s: Math.floor((diff / 1000) % 60),
    done: false,
  };
}

// One setInterval for the entire app, regardless of how many countdowns are
// mounted. Ref-counted: starts on the first subscriber, stops on the last.
type TickCallback = (nowMs: number) => void;
const subscribers = new Set<TickCallback>();
let timerId: ReturnType<typeof setInterval> | null = null;

function subscribe(cb: TickCallback): () => void {
  if (subscribers.size === 0) {
    timerId = setInterval(() => {
      const now = Date.now();
      subscribers.forEach((fn) => fn(now));
    }, 1000);
  }
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
    if (subscribers.size === 0 && timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  };
}

/**
 * Subscribes to a single app-wide 1-second ticker and invokes `onTick` with the
 * time remaining until `targetMs`. The callback is expected to write directly to
 * DOM refs — this hook never triggers a React re-render, which is the whole point:
 * a countdown driven through React state reconciles its entire subtree every
 * second. Fires once immediately on mount so the digits paint without waiting a
 * full second.
 */
export function useCountdownTick(
  targetMs: number | null,
  onTick: (remaining: CountdownRemaining) => void
) {
  // Keep the latest callback in a ref so changing it between renders does not
  // force a resubscribe (the subscribe effect only depends on targetMs). The ref
  // is synced in its own effect — declared first so it runs before the subscribe
  // effect's immediate first tick on mount.
  const cbRef = useRef(onTick);
  useEffect(() => {
    cbRef.current = onTick;
  });

  useEffect(() => {
    if (targetMs === null) return;
    const run = (now: number) => cbRef.current(computeRemaining(targetMs, now));
    run(Date.now()); // immediate first paint
    return subscribe(run);
  }, [targetMs]);
}
