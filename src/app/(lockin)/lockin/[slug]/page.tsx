import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { F1, Mono } from "@/components/shared/broadcast";
import { CountdownTimer } from "@/components/shared/countdown-timer";
import { ComingSoon } from "@/components/lockin/coming-soon";
import { LeaderboardTable } from "@/components/lockin/leaderboard-table";
import { PickBoard } from "@/components/lockin/pick-board";
import { PicksCard } from "@/components/lockin/picks-card";
import { RoundHeader } from "@/components/lockin/round-header";
import { ShareActions } from "@/components/lockin/share-actions";
import { env } from "@/lib/env";
import { nowMs } from "@/lib/clock";
import { getCurrentUser } from "@/lib/auth/session";
import { getBoardDrivers, labelForDriverId } from "@/lib/lockin/board-data";
import { getProfile } from "@/lib/lockin/profile";
import { countPlayers, getPicks, getRoundLeaderboard, getUserRoundScore } from "@/lib/lockin/queries";
import { getRoundBySlug, getRoundState, getRounds, toRoundSummary } from "@/lib/lockin/rounds";
import { ensureSettled } from "@/lib/lockin/settle";
import { createPageMetadata, SITE_URL } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const round = getRoundBySlug(slug);
  if (!round) return { title: "Not Found" };
  return createPageMetadata({
    title: `Lock In: 2026 ${round.fullName} Predictions`,
    description: `Call pole, the podium and fastest lap for the 2026 ${round.fullName}, then see who called it. Free, with leagues and a season leaderboard.`,
    path: `/lockin/${round.slug}`,
  });
}

export default async function LockInRoundPage({ params }: Props) {
  const { slug } = await params;
  if (!env.lockInEnabled) return <ComingSoon />;
  const round = getRoundBySlug(slug);
  if (!round) notFound();
  const now = nowMs();
  const user = await getCurrentUser();
  const status = now >= round.qualiEndsAtMs ? await ensureSettled(round, { nowMs: now }).catch(() => null) : null;
  const state = getRoundState(round, now, status?.raceSettled ?? false);
  const summary = toRoundSummary(round);
  const [picks, players, profile, score] = await Promise.all([
    user ? getPicks(user.id, round.raceDate) : Promise.resolve(null),
    countPlayers(round.raceDate),
    user ? getProfile(user.id) : Promise.resolve(null),
    user ? getUserRoundScore(user.id, round.raceDate) : Promise.resolve(null),
  ]);

  if (state === "open") {
    const initialPicks = picks
      ? { pole: picks.pole, p1: picks.p1, p2: picks.p2, p3: picks.p3, fastestLap: picks.fastestLap, marginMs: picks.marginMs, sprintWinner: picks.sprintWinner }
      : null;
    return (
      <>
        <RoundHeader round={summary} state={state} players={players} />
        <div style={{ padding: "clamp(16px, 3vw, 28px) clamp(12px, 3vw, 32px)" }}>
          <PickBoard round={summary} drivers={getBoardDrivers()} initialPicks={initialPicks} signedIn={user !== null} signInHref={`/lockin/sign-in?next=${encodeURIComponent(`/lockin/${round.slug}`)}`} />
        </div>
      </>
    );
  }

  if (state === "upcoming") {
    const open = getRounds().find((r) => r.lockAtMs > now);
    return (
      <>
        <RoundHeader round={summary} state={state} players={players} />
        <div style={{ padding: "clamp(24px, 4vw, 40px) clamp(16px, 4vw, 32px)" }}>
          <p style={{ color: F1.fg2, fontSize: 15 }}>One round is open at a time. This one opens when the current round locks.</p>
          {open && (
            <Link href={`/lockin/${open.slug}`} className="font-mono mt-4 inline-block" style={{ fontSize: 11, letterSpacing: "0.18em", color: F1.fg }}>
              GO TO THE OPEN ROUND
            </Link>
          )}
        </div>
      </>
    );
  }

  const leaderboard = state === "settled" ? await getRoundLeaderboard(round.raceDate, 25) : [];
  const shareUrl = picks ? `${SITE_URL}/lockin/c/${picks.shareId}` : null;
  const result = status?.result ?? null;

  return (
    <>
      <RoundHeader round={summary} state={state} players={players}>
        {state === "locked" && (
          <div className="mt-5">
            <CountdownTimer targetDate={new Date(round.raceEndsAtMs - 150 * 60_000)} label="LIGHTS OUT IN" />
          </div>
        )}
      </RoundHeader>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" style={{ padding: "clamp(16px, 3vw, 28px) clamp(12px, 3vw, 32px)" }}>
        <div className="grid gap-4">
          {picks && profile ? (
            <>
              <PicksCard
                round={summary}
                picks={picks}
                result={result}
                breakdown={score?.breakdown ?? null}
                displayName={profile.displayName}
                points={score?.points ?? null}
                rank={score?.rank ?? null}
                players={score?.players ?? null}
                sealed={state === "locked"}
              />
              {shareUrl && (
                <div>
                  <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.2em" }}>SHARE YOUR CARD</Mono>
                  <div className="mt-2">
                    <ShareActions url={shareUrl} text={score ? `I scored ${score.points} on Lock In for the ${round.fullName}.` : `My Lock In calls for the ${round.fullName}.`} />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ background: F1.bg2, border: `1px solid ${F1.line}`, padding: "clamp(16px, 3vw, 24px)" }}>
              <Mono style={{ fontSize: 11, color: F1.amber, letterSpacing: "0.22em", fontWeight: 700 }}>NO CALLS LOCKED IN</Mono>
              <p className="mt-3" style={{ color: F1.fg2, fontSize: 15, lineHeight: 1.6 }}>
                {user ? "You did not lock in for this round." : "Sign in to see your calls for this round."} The next round opens the moment this one locks.
              </p>
              <Link href="/lockin" className="font-mono mt-4 inline-block" style={{ fontSize: 11, letterSpacing: "0.18em", color: F1.fg }}>
                THIS WEEK&apos;S ROUND
              </Link>
            </div>
          )}
        </div>

        <div className="grid gap-4">
          {result && (result.pole || result.p1) && (
            <section aria-labelledby="official-heading" style={{ background: F1.bg2, border: `1px solid ${F1.line}`, padding: "clamp(16px, 3vw, 24px)" }}>
              <Mono id="official-heading" style={{ fontSize: 11, color: F1.fg3, letterSpacing: "0.22em", fontWeight: 700 }}>OFFICIAL RESULT</Mono>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                {[
                  ["POLE", result.pole],
                  ["P1", result.p1],
                  ["P2", result.p2],
                  ["P3", result.p3],
                  ["FL", result.fastestLap],
                  ...(round.isSprint ? [["SPRINT", result.sprintWinner] as const] : []),
                ].map(([label, id]) => (
                  <div key={label}>
                    <dt><Mono style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.2em" }}>{label}</Mono></dt>
                    <dd className="font-display m-0" style={{ fontSize: 24, fontWeight: 700, color: id ? F1.fg : F1.fg4 }}>{id ? labelForDriverId(id) : "—"}</dd>
                  </div>
                ))}
              </dl>
              {result.marginMs !== null && (
                <Mono className="mt-3 block" style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.16em" }}>WINNING MARGIN {(result.marginMs / 1000).toFixed(3)}S</Mono>
              )}
            </section>
          )}
          {state === "settled" && (
            <section aria-labelledby="round-board-heading">
              <Mono id="round-board-heading" style={{ fontSize: 11, color: F1.fg3, letterSpacing: "0.22em", fontWeight: 700 }}>ROUND LEADERBOARD</Mono>
              <div className="mt-3">
                <LeaderboardTable rows={leaderboard.map((r) => ({ userId: r.userId, displayName: r.displayName, tier: r.tier, points: r.points, exactHits: r.exactHits, rank: r.rank ?? 0 }))} highlightUserId={user?.id ?? null} emptyText="No scores yet." />
              </div>
            </section>
          )}
          {state === "settling" && (
            <p style={{ color: F1.fg3, fontSize: 13, lineHeight: 1.6 }}>Official results usually publish within a few hours of the flag. Scores appear here as soon as they do.</p>
          )}
        </div>
      </div>
    </>
  );
}
