import { F1, Mono, Brackets } from "@/components/shared/broadcast";
import { driverById, labelForDriverId } from "@/lib/lockin/board-data";
import type { Breakdown, Picks, RoundResult } from "@/lib/lockin/scoring";
import type { RoundSummary } from "@/lib/lockin/rounds";
import { Stamp } from "./stamp";

interface PicksCardProps {
  round: RoundSummary;
  picks: Picks;
  /** Official outcome so far; null before qualifying settles. */
  result: RoundResult | null;
  breakdown: Breakdown | null;
  displayName: string;
  points?: number | null;
  rank?: number | null;
  players?: number | null;
  /** Sealed plate treatment for locked rounds. */
  sealed?: boolean;
}

const CALLS: { key: keyof Pick<Picks, "pole" | "p1" | "p2" | "p3" | "fastestLap" | "sprintWinner">; label: string; sprintOnly?: boolean }[] = [
  { key: "pole", label: "POLE" },
  { key: "p1", label: "P1" },
  { key: "p2", label: "P2" },
  { key: "p3", label: "P3" },
  { key: "fastestLap", label: "FL" },
  { key: "sprintWinner", label: "SPR", sprintOnly: true },
];

function scoreFor(breakdown: Breakdown | null, key: (typeof CALLS)[number]["key"]) {
  if (!breakdown) return null;
  if (key === "sprintWinner") return breakdown.sprintWinner;
  return breakdown[key];
}

/** A player's calls for a round, with result stamps once the round settles. */
export function PicksCard({ round, picks, result, breakdown, displayName, points, rank, players, sealed = false }: PicksCardProps) {
  const calls = CALLS.filter((c) => !c.sprintOnly || round.isSprint);
  const settled = breakdown !== null && result !== null && result.p1 !== null;
  return (
    <article
      className="relative"
      style={{ background: F1.bg2, border: `1px solid ${settled ? F1.lineHi : F1.line}`, padding: "clamp(16px, 3vw, 24px)" }}
      aria-label={`${displayName}'s calls for the ${round.fullName}`}
    >
      <Brackets color={settled ? F1.fg2 : F1.red} size={12} />
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <Mono style={{ fontSize: 11, color: F1.red, letterSpacing: "0.22em", fontWeight: 700 }}>
          LOCK IN · ROUND {String(round.round).padStart(2, "0")}
        </Mono>
        <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.16em" }}>{displayName.toUpperCase()}</Mono>
      </div>
      <h2 className="font-display mt-2 uppercase" style={{ fontSize: "clamp(24px, 4.5vw, 34px)", fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em", margin: "8px 0 0" }}>
        {round.fullName}
      </h2>

      <div className="mt-4 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(calls.length, 3)}, minmax(0, 1fr))` }}>
        {calls.map((c) => {
          const pickId = picks[c.key];
          const driver = driverById(pickId);
          const actual = result ? result[c.key] : null;
          const s = scoreFor(breakdown, c.key);
          return (
            <div key={c.key} className="relative" style={{ background: F1.bg, borderLeft: `4px solid ${driver?.color ?? F1.line}`, padding: "10px 10px 10px 12px", minHeight: 96 }}>
              <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.2em", fontWeight: 700 }}>{c.label}</Mono>
              <div className="font-display mt-1" style={{ fontSize: 28, lineHeight: 1, fontWeight: 700, letterSpacing: "-0.02em", color: F1.fg }}>
                {driver?.code ?? "—"}
              </div>
              <Mono className="mt-1 block truncate" style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.1em" }}>
                {driver ? driver.lastName.toUpperCase() : ""}
              </Mono>
              {s && s.stamp !== "pending" && (
                <div className="absolute right-1.5 top-1.5">
                  <Stamp kind={s.stamp} points={s.points} small />
                </div>
              )}
              {actual && s && s.stamp !== "hit" && s.stamp !== "pending" && (
                <Mono className="mt-1.5 block" style={{ fontSize: 9, color: F1.fg2, letterSpacing: "0.1em" }}>
                  ACTUAL {labelForDriverId(actual)}
                </Mono>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.16em" }}>
          MARGIN {(picks.marginMs / 1000).toFixed(3)}S
          {result?.marginMs !== null && result?.marginMs !== undefined ? ` · ACTUAL ${(result.marginMs / 1000).toFixed(3)}S` : ""}
        </Mono>
        {settled && breakdown && breakdown.podiumBonus > 0 && (
          <Mono style={{ fontSize: 10, color: F1.green, letterSpacing: "0.16em", fontWeight: 700 }}>PERFECT PODIUM +{breakdown.podiumBonus}</Mono>
        )}
      </div>

      {(settled || sealed) && (
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3" style={{ borderTop: `1px solid ${F1.line}`, paddingTop: 14 }}>
          {settled ? (
            <>
              <div>
                <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.2em" }}>POINTS</Mono>
                <div className="font-display" style={{ fontSize: 44, lineHeight: 0.9, fontWeight: 700, letterSpacing: "-0.03em", color: F1.fg }}>
                  {points ?? 0}
                </div>
              </div>
              {rank !== null && rank !== undefined && (
                <div className="text-right">
                  <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.2em" }}>ROUND RANK</Mono>
                  <div className="font-display" style={{ fontSize: 28, lineHeight: 1, fontWeight: 700, color: F1.fg }}>
                    {rank}
                    <span style={{ color: F1.fg3, fontSize: 16 }}>{players ? ` / ${players}` : ""}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Mono style={{ fontSize: 10, color: F1.amber, letterSpacing: "0.2em", fontWeight: 700 }}>LOCKED IN · RESULTS AFTER THE RACE</Mono>
          )}
        </div>
      )}
    </article>
  );
}
