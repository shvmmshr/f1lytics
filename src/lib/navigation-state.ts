"use client";

// Tracks whether the most recent client-side navigation was a history
// restore (back/forward). Pages mounted right after a popstate skip their
// entrance animations so history navigation feels instant, like a native
// app: replaying the entrance choreography on back reads as a full reload.
//
// Time-window based (not a consumed flag) so it is idempotent across React
// StrictMode double-invocation. On the server and on hard loads,
// `popstateAt` stays 0, so `isHistoryNavigation()` is false and SSR/client
// initial renders agree: no hydration mismatch.
let popstateAt = 0;

if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    popstateAt = Date.now();
  });
}

/** True if a back/forward navigation happened within the last second. */
export function isHistoryNavigation(): boolean {
  return Date.now() - popstateAt < 1000;
}
