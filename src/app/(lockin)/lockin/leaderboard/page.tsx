import Link from "next/link";
import { F1, Mono } from "@/components/shared/broadcast";
import { ComingSoon } from "@/components/lockin/coming-soon";
import { LeaderboardTable } from "@/components/lockin/leaderboard-table";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/session";
import { getLatestSettledRaceDate, getRoundLeaderboard, getSeasonLeaderboard, getUserSeason } from "@/lib/lockin/queries";
import { getRoundByDate } from "@/lib/lockin/rounds";
import { createPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Lock In Leaderboard: 2026 F1 Predictions Standings",
  description: "Season standings for Lock In, the free F1 predictions game on F1lytics, plus the latest round's scores.",
  path: "/lockin/leaderboard",
  imageEyebrow: "LOCK IN LEADERBOARD",
});

export default async function LeaderboardPage() {
  if (!env.lockInEnabled) return <ComingSoon />;
  const user = await getCurrentUser();
  const [season, latestDate, mine] = await Promise.all([
    getSeasonLeaderboard(100),
    getLatestSettledRaceDate(),
    user ? getUserSeason(user.id) : Promise.resolve(null),
  ]);
  const latestRound = latestDate ? getRoundByDate(latestDate) : undefined;
  const latestRows = latestDate ? await getRoundLeaderboard(latestDate, 50) : [];

  return (
    <>
      <header style={{ padding: "clamp(28px, 5vw, 44px) clamp(16px, 4vw, 32px) 24px", borderBottom: `1px solid ${F1.line}` }}>
        <Mono style={{ fontSize: 11, color: F1.red, letterSpacing: "0.22em", fontWeight: 700 }}>LOCK IN · 2026</Mono>
        <h1 className="font-display mt-3 uppercase" style={{ fontSize: "clamp(40px, 8vw, 88px)", fontWeight: 700, lineHeight: 0.9, letterSpacing: "-0.04em", margin: "12px 0 0" }}>
          Leaderboard<span style={{ color: F1.red }}>.</span>
        </h1>
        {mine && (
          <p className="mt-4" style={{ color: F1.fg2, fontSize: 15 }}>
            You are <strong style={{ color: F1.fg }}>P{mine.rank}</strong> with {mine.points} points across {mine.rounds} {mine.rounds === 1 ? "round" : "rounds"}.
          </p>
        )}
        {user && !mine && (
          <p className="mt-4" style={{ color: F1.fg2, fontSize: 15 }}>
            You will appear here after your first settled round. <Link href="/lockin" style={{ color: F1.fg, textDecoration: "underline" }}>Lock in this week</Link>.
          </p>
        )}
      </header>
      <div className="grid gap-6 lg:grid-cols-2" style={{ padding: "clamp(16px, 3vw, 28px) clamp(12px, 3vw, 32px) clamp(24px, 4vw, 40px)" }}>
        <section aria-labelledby="season-heading">
          <Mono id="season-heading" style={{ fontSize: 11, color: F1.fg3, letterSpacing: "0.22em", fontWeight: 700 }}>SEASON</Mono>
          <div className="mt-3">
            <LeaderboardTable rows={season} highlightUserId={user?.id ?? null} showRounds emptyText="No round has settled yet. Standings appear after the first race weekend." />
          </div>
        </section>
        <section aria-labelledby="round-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <Mono id="round-heading" style={{ fontSize: 11, color: F1.fg3, letterSpacing: "0.22em", fontWeight: 700 }}>
              {latestRound ? `LATEST ROUND · ${latestRound.fullName.toUpperCase()}` : "LATEST ROUND"}
            </Mono>
            {latestRound && (
              <Link href={`/lockin/${latestRound.slug}`} className="font-mono transition-colors hover:text-white" style={{ fontSize: 10, letterSpacing: "0.16em", color: F1.fg3 }}>
                ROUND PAGE
              </Link>
            )}
          </div>
          <div className="mt-3">
            <LeaderboardTable
              rows={latestRows.map((r) => ({ userId: r.userId, displayName: r.displayName, tier: r.tier, points: r.points, exactHits: r.exactHits, rank: r.rank ?? 0 }))}
              highlightUserId={user?.id ?? null}
              emptyText="The first round settles after the first race weekend."
            />
          </div>
        </section>
      </div>
    </>
  );
}
