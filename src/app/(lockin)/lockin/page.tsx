import Link from "next/link";
import { F1, Mono } from "@/components/shared/broadcast";
import { ComingSoon } from "@/components/lockin/coming-soon";
import { PickBoard } from "@/components/lockin/pick-board";
import { RoundHeader } from "@/components/lockin/round-header";
import { ScoringGuide } from "@/components/lockin/scoring-guide";
import { Stamp } from "@/components/lockin/stamp";
import { env } from "@/lib/env";
import { nowMs } from "@/lib/clock";
import { getCurrentUser } from "@/lib/auth/session";
import { getBoardDrivers } from "@/lib/lockin/board-data";
import { countPlayers, getPicks, getUserRoundScore } from "@/lib/lockin/queries";
import { getOpenRound, getRoundState, getRounds, toRoundSummary } from "@/lib/lockin/rounds";
import { ensureSettled } from "@/lib/lockin/settle";
import { createPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Lock In: Call Pole, the Podium and Fastest Lap Every F1 Weekend",
  description:
    "Free F1 predictions game. Lock in pole, the podium, fastest lap and the winning margin before qualifying, then see who called it. Leagues with friends, season leaderboard.",
  path: "/lockin",
});

export default async function LockInPage() {
  if (!env.lockInEnabled) return <ComingSoon />;
  const now = nowMs();
  const round = getOpenRound(now);
  const user = await getCurrentUser();

  if (!round) {
    return (
      <div style={{ padding: "clamp(40px, 8vw, 80px) clamp(16px, 4vw, 32px)" }}>
        <Mono style={{ fontSize: 11, color: F1.red, letterSpacing: "0.24em", fontWeight: 700 }}>LOCK IN</Mono>
        <h1 className="font-display mt-3 uppercase" style={{ fontSize: "clamp(40px, 7vw, 72px)", fontWeight: 700, lineHeight: 0.9, letterSpacing: "-0.03em" }}>
          Season over<span style={{ color: F1.red }}>.</span>
        </h1>
        <p className="mt-4 max-w-md" style={{ color: F1.fg2, fontSize: 15 }}>Every round is settled. The final standings are on the leaderboard.</p>
        <Link href="/lockin/leaderboard" className="font-mono mt-6 inline-block" style={{ fontSize: 11, letterSpacing: "0.18em", color: F1.fg }}>SEASON LEADERBOARD</Link>
      </div>
    );
  }

  const previous = [...getRounds()].reverse().find((r) => r.lockAtMs <= now) ?? null;
  const [picks, players, previousStatus, previousScore] = await Promise.all([
    user ? getPicks(user.id, round.raceDate) : Promise.resolve(null),
    countPlayers(round.raceDate),
    previous && now >= previous.qualiEndsAtMs ? ensureSettled(previous, { nowMs: now }).catch(() => null) : Promise.resolve(null),
    user && previous ? getUserRoundScore(user.id, previous.raceDate).catch(() => null) : Promise.resolve(null),
  ]);
  const summary = toRoundSummary(round);
  const initialPicks = picks
    ? { pole: picks.pole, p1: picks.p1, p2: picks.p2, p3: picks.p3, fastestLap: picks.fastestLap, marginMs: picks.marginMs, sprintWinner: picks.sprintWinner }
    : null;

  return (
    <>
      <RoundHeader round={summary} state={getRoundState(round, now, false)} players={players}>
        <p className="mt-4 max-w-xl" style={{ color: F1.fg2, fontSize: 15, lineHeight: 1.6 }}>
          Call pole, the podium in order, the fastest lap{round.isSprint ? ", the sprint winner" : ""} and the winning margin. Everything locks when {round.isSprint ? "sprint qualifying" : "qualifying"} starts.
        </p>
      </RoundHeader>

      <div style={{ padding: "clamp(16px, 3vw, 28px) clamp(12px, 3vw, 32px)" }}>
        <PickBoard round={summary} drivers={getBoardDrivers()} initialPicks={initialPicks} signedIn={user !== null} signInHref="/lockin/sign-in?next=%2Flockin" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2" style={{ padding: "0 clamp(12px, 3vw, 32px) clamp(24px, 4vw, 40px)" }}>
        <ScoringGuide />
        {previous && (
          <section aria-labelledby="previous-heading" style={{ background: F1.bg2, border: `1px solid ${F1.line}`, padding: "clamp(16px, 3vw, 24px)" }}>
            <Mono id="previous-heading" style={{ fontSize: 11, color: F1.fg3, letterSpacing: "0.22em", fontWeight: 700 }}>LAST ROUND</Mono>
            <div className="font-display mt-2 uppercase" style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em" }}>{previous.fullName}</div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {previousScore ? (
                <>
                  <span className="font-display" style={{ fontSize: 40, fontWeight: 700, lineHeight: 0.9, letterSpacing: "-0.03em" }}>{previousScore.points}</span>
                  <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.18em" }}>
                    PTS{previousScore.rank ? ` · RANK ${previousScore.rank}${previousScore.players ? ` / ${previousScore.players}` : ""}` : ""}
                  </Mono>
                  {previousScore.breakdown.p1.stamp !== "pending" && <Stamp kind={previousScore.breakdown.p1.stamp} small />}
                </>
              ) : (
                <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.16em" }}>
                  {previousStatus?.raceSettled ? "SETTLED" : "RESULTS PENDING"}{user ? " · YOU DID NOT LOCK IN" : ""}
                </Mono>
              )}
            </div>
            <Link href={`/lockin/${previous.slug}`} className="font-mono mt-4 inline-block transition-colors hover:text-white" style={{ fontSize: 11, letterSpacing: "0.18em", color: F1.fg2 }}>
              SEE THE ROUND
            </Link>
          </section>
        )}
      </div>
    </>
  );
}
