import Link from "next/link";
import { F1, Mono, LiveDot } from "@/components/shared/broadcast";
import type { RoundState, RoundSummary } from "@/lib/lockin/rounds";

const STATE_LABEL: Record<RoundState, string> = {
  upcoming: "OPENS AFTER THE CURRENT ROUND",
  open: "OPEN FOR CALLS",
  locked: "LOCKED · RACE PENDING",
  settling: "RACE DONE · WAITING FOR OFFICIAL RESULTS",
  settled: "SETTLED",
};

export function RoundHeader({ round, state, players, children }: { round: RoundSummary; state: RoundState; players: number; children?: React.ReactNode }) {
  const color = state === "open" ? F1.red : state === "settled" ? F1.green : F1.amber;
  return (
    <header style={{ padding: "clamp(28px, 5vw, 44px) clamp(16px, 4vw, 32px) 24px", borderBottom: `1px solid ${F1.line}` }}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-2">
          <LiveDot color={color} size={7} pulse={state === "open"} />
          <Mono style={{ fontSize: 11, color, letterSpacing: "0.22em", fontWeight: 700 }}>{STATE_LABEL[state]}</Mono>
        </span>
        <Mono style={{ fontSize: 11, color: F1.fg3, letterSpacing: "0.18em" }}>
          ROUND {String(round.round).padStart(2, "0")} · {players} {players === 1 ? "PLAYER" : "PLAYERS"} LOCKED IN
        </Mono>
      </div>
      <h1 className="font-display mt-3 uppercase" style={{ fontSize: "clamp(40px, 8vw, 88px)", fontWeight: 700, lineHeight: 0.9, letterSpacing: "-0.04em", margin: "12px 0 0" }}>
        {round.fullName}
        <span style={{ color: F1.red }}>.</span>
      </h1>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Mono style={{ fontSize: 11, color: F1.fg2, letterSpacing: "0.14em" }}>{round.name.toUpperCase()}</Mono>
        <Link href={`/races/${round.slug}`} className="font-mono transition-colors hover:text-white" style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.16em" }}>
          RACE PAGE
        </Link>
      </div>
      {children}
    </header>
  );
}
