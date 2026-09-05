"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { F1, Mono, Brackets } from "@/components/shared/broadcast";
import type { RoundState, RoundSummary } from "@/lib/lockin/rounds";
import type { Breakdown, Picks } from "@/lib/lockin/scoring";

interface Summary {
  round: RoundSummary;
  state: RoundState;
  players: number;
  me: { picks: Picks | null; score: { points: number; rank: number | null; players: number | null; breakdown: Breakdown } | null } | null;
}

/**
 * Race-page island: the page stays static; this fetches the round summary
 * after mount and renders nothing at all when Lock In is switched off.
 */
export function LockInPanel({ raceDate, slug }: { raceDate: string; slug: string }) {
  const [summary, setSummary] = useState<Summary | null | "off">(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/lockin/summary?round=${raceDate}`)
      .then(async (res) => {
        if (res.status === 503 || res.status === 404) return "off" as const;
        if (!res.ok) return null;
        return (await res.json()) as Summary;
      })
      .then((s) => {
        if (!cancelled) setSummary(s);
      })
      .catch(() => {
        if (!cancelled) setSummary("off");
      });
    return () => {
      cancelled = true;
    };
  }, [raceDate]);

  if (summary === null || summary === "off") return null;
  const { state, players, me } = summary;
  const href = `/lockin/${slug}`;
  const label =
    state === "open"
      ? "OPEN FOR CALLS"
      : state === "locked"
        ? "CALLS LOCKED"
        : state === "settling"
          ? "RESULTS PENDING"
          : state === "settled"
            ? "SETTLED"
            : "OPENS SOON";
  const color = state === "open" ? F1.red : state === "settled" ? F1.green : F1.amber;

  return (
    <Link href={href} className="relative block transition-shadow hover:shadow-[inset_0_0_0_999px_rgba(255,255,255,0.03)]" style={{ background: F1.bg2, border: `1px solid ${F1.line}`, padding: "14px 16px", textDecoration: "none", color: F1.fg }}>
      <Brackets color={color} size={10} />
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <span className="flex items-center gap-3">
          <Mono style={{ fontSize: 11, color, letterSpacing: "0.22em", fontWeight: 700 }}>LOCK IN · {label}</Mono>
          <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.16em" }}>
            {players} {players === 1 ? "PLAYER" : "PLAYERS"}
          </Mono>
        </span>
        <span className="font-display" style={{ fontSize: 16, fontWeight: 600 }}>
          {me?.score
            ? `You scored ${me.score.points}${me.score.rank ? `, P${me.score.rank}` : ""}`
            : me?.picks
              ? state === "open"
                ? "Your calls are in. Change them until qualifying"
                : "Your calls are locked"
              : state === "open"
                ? "Call pole, the podium and fastest lap"
                : state === "settled"
                  ? "See who called it"
                  : "See the calls"}
        </span>
      </div>
    </Link>
  );
}
