"use client";

import { useEffect } from "react";
import { F1, Mono } from "@/components/shared/broadcast";

/**
 * Shared body for route-group error boundaries. Broadcast-styled crash
 * containment: the surrounding group layout (navbar/footer) stays mounted;
 * reset() re-renders the failed segment.
 */
export function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // warn, not error: surfaced crashes here are usually flaky upstream data;
    // the boundary itself is the alert.
    console.warn("[f1lytics] route error boundary:", error);
  }, [error]);

  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4"
      style={{ background: F1.bg, padding: "48px 24px" }}
    >
      <Mono style={{ fontSize: 11, color: F1.red, letterSpacing: "0.22em" }}>
        RED FLAG
      </Mono>
      <Mono style={{ fontSize: 14, color: F1.fg, letterSpacing: "0.06em" }}>
        THIS SECTION HIT A PROBLEM LOADING ITS DATA.
      </Mono>
      <Mono style={{ fontSize: 11, color: F1.fg3, letterSpacing: "0.08em" }}>
        USUALLY TRANSIENT. THE FEEDS RATE-LIMIT HARD.
      </Mono>
      <button
        type="button"
        onClick={reset}
        style={{
          marginTop: 8,
          padding: "10px 22px",
          background: F1.red,
          color: F1.fg,
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: 12,
          letterSpacing: "0.14em",
        }}
      >
        RESTART SESSION
      </button>
    </div>
  );
}
