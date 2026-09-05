"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { F1, Mono, LiveDot, PosPill, Tire, Brackets } from "@/components/shared/broadcast";
import { getLiveWindowSession } from "@/lib/constants/sessions";
import type { LiveSnapshot, SnapshotResponse } from "@/lib/live/snapshot-types";

const POLL_MS = 12_000;
const WINDOW_CHECK_MS = 30_000;

const TRACK_STATUS: Record<string, { label: string; color: string }> = {
  "1": { label: "GREEN", color: F1.green },
  "2": { label: "YELLOW", color: F1.yellow },
  "4": { label: "SAFETY CAR", color: F1.amber },
  "5": { label: "RED FLAG", color: F1.red },
  "6": { label: "VIRTUAL SC", color: F1.amber },
  "7": { label: "VSC ENDING", color: F1.amber },
};

function formatLap(seconds: number | null): string {
  if (seconds === null) return "";
  const m = Math.floor(seconds / 60);
  const s = (seconds - m * 60).toFixed(3).padStart(6, "0");
  return m > 0 ? `${m}:${s}` : s;
}

/**
 * Homepage live panel. Mounts empty; after hydration it checks the baked
 * schedule and, only inside a session window, polls the CDN-cached snapshot
 * every 12 seconds. Shows the running session, or the final order for 45
 * minutes after the flag, then disappears and lets the podium card take over.
 */
export function LiveNow() {
  const [inWindow, setInWindow] = useState(false);
  const [snap, setSnap] = useState<LiveSnapshot | null>(null);

  useEffect(() => {
    const check = () => setInWindow(getLiveWindowSession(Date.now()) !== null);
    const raf = requestAnimationFrame(check);
    const id = setInterval(check, WINDOW_CHECK_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!inWindow) return;
    let cancelled = false;
    const load = () =>
      fetch("/api/live/snapshot", { cache: "no-store" })
        .then((res) => (res.ok ? (res.json() as Promise<SnapshotResponse>) : null))
        .then((json) => {
          if (cancelled || !json) return;
          setSnap(json.live ? json : null);
        })
        .catch(() => undefined);
    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [inWindow]);

  if (!inWindow || !snap) return null;

  const accent = snap.running ? F1.red : F1.amber;
  const track = snap.trackStatus ? TRACK_STATUS[snap.trackStatus.code] : undefined;
  const isRace = /race|sprint/i.test(snap.session?.type ?? "") || /race|sprint/i.test(snap.session?.name ?? "");
  const rows = snap.rows.slice(0, 5);

  return (
    <section
      aria-label={snap.running ? "Live session" : "Session just finished"}
      className="relative"
      style={{ background: F1.bg2, border: `1px solid ${F1.line}`, borderTop: `2px solid ${accent}`, padding: 16 }}
    >
      <Brackets color={accent} size={12} />
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <span className="inline-flex items-center gap-2.5 min-w-0">
          <LiveDot color={accent} size={8} pulse={snap.running} />
          <Mono className="truncate" style={{ fontSize: 11, color: accent, letterSpacing: "0.2em", fontWeight: 700 }}>
            {snap.running ? "LIVE" : "FINISHED"} · {(snap.session?.name ?? "SESSION").toUpperCase()}
          </Mono>
        </span>
        <span className="inline-flex items-center gap-2">
          {track && track.label !== "GREEN" && (
            <Mono style={{ fontSize: 9, color: F1.ink, background: track.color, letterSpacing: "0.16em", fontWeight: 700, padding: "2px 6px" }}>
              {track.label}
            </Mono>
          )}
          {isRace && snap.currentLap !== null && (
            <Mono style={{ fontSize: 11, color: F1.fg, letterSpacing: "0.14em", fontVariantNumeric: "tabular-nums" }}>
              LAP {snap.currentLap}
              {snap.totalLaps !== null ? ` / ${snap.totalLaps}` : ""}
            </Mono>
          )}
        </span>
      </div>

      <ol className="mt-3 flex flex-col gap-1 m-0 p-0 list-none" aria-label="Top positions">
        {rows.map((r) => (
          <li
            key={r.driverNumber}
            className="grid items-center"
            style={{ gridTemplateColumns: "24px 4px minmax(0,1fr) auto auto", gap: 10, background: F1.bg, padding: "7px 10px" }}
          >
            <PosPill pos={r.position} size="sm" />
            <span aria-hidden style={{ width: 3, height: 22, background: r.teamColor }} />
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="font-display" style={{ fontSize: 15, fontWeight: 700, color: F1.fg }}>
                {r.code}
              </span>
              <Mono className="truncate hidden sm:inline" style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.12em" }}>
                {r.lastName.toUpperCase()}
              </Mono>
            </span>
            <Mono style={{ fontSize: 11, color: r.position === 1 ? F1.fg : F1.fg2, fontVariantNumeric: "tabular-nums", textAlign: "right" }}>
              {r.gap || formatLap(r.lastLap)}
            </Mono>
            <span className="inline-flex w-5 justify-end">{r.compound ? <Tire compound={r.compound} size={14} /> : null}</span>
          </li>
        ))}
        {rows.length === 0 && (
          <li style={{ padding: "8px 10px" }}>
            <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.16em" }}>WAITING FOR POSITIONS</Mono>
          </li>
        )}
      </ol>

      <div className="mt-3 flex items-center justify-between gap-3">
        <Mono style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.18em" }}>
          {snap.session?.circuit ? snap.session.circuit.toUpperCase() : ""}
          {snap.weather ? ` · TRACK ${Math.round(snap.weather.track)}°` : ""}
        </Mono>
        <Link href="/live" className="font-mono shrink-0 transition-colors hover:text-white" style={{ fontSize: 10, color: F1.fg2, letterSpacing: "0.16em", fontWeight: 700, textDecoration: "none" }}>
          FULL TIMING
        </Link>
      </div>
    </section>
  );
}
