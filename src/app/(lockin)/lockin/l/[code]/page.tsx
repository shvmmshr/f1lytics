import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { F1, Mono } from "@/components/shared/broadcast";
import { ComingSoon } from "@/components/lockin/coming-soon";
import { LeaderboardTable } from "@/components/lockin/leaderboard-table";
import { JoinLeagueButton } from "@/components/lockin/league-forms";
import { ShareActions } from "@/components/lockin/share-actions";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/session";
import { getLeagueByCode, getLeagueStandings, isLeagueMember } from "@/lib/lockin/queries";
import { createPageMetadata, SITE_URL } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const league = env.lockInEnabled ? await getLeagueByCode(code).catch(() => null) : null;
  return createPageMetadata({
    title: league ? `${league.name}: Lock In League` : "Lock In League",
    description: league ? `Join ${league.name} on Lock In and race your friends' F1 predictions across the 2026 season.` : "A private Lock In league.",
    path: `/lockin/l/${code.toUpperCase()}`,
    noIndex: true,
  });
}

export default async function LeaguePage({ params }: Props) {
  const { code } = await params;
  if (!env.lockInEnabled) return <ComingSoon />;
  const league = await getLeagueByCode(code);
  if (!league) notFound();
  const user = await getCurrentUser();
  const [standings, member] = await Promise.all([getLeagueStandings(league.id), user ? isLeagueMember(user.id, league.id) : Promise.resolve(false)]);
  const inviteUrl = `${SITE_URL}/lockin/l/${league.code}`;

  return (
    <>
      <header style={{ padding: "clamp(28px, 5vw, 44px) clamp(16px, 4vw, 32px) 24px", borderBottom: `1px solid ${F1.line}` }}>
        <Mono style={{ fontSize: 11, color: F1.red, letterSpacing: "0.22em", fontWeight: 700 }}>LOCK IN LEAGUE · {league.code}</Mono>
        <h1 className="font-display mt-3" style={{ fontSize: "clamp(36px, 7vw, 80px)", fontWeight: 700, lineHeight: 0.92, letterSpacing: "-0.03em", margin: "12px 0 0" }}>
          {league.name}
        </h1>
        <p className="mt-3" style={{ color: F1.fg2, fontSize: 15 }}>
          {standings.length} {standings.length === 1 ? "player" : "players"}. Season points, updated every settled round.
        </p>
        <div className="mt-5">
          {member ? (
            <div>
              <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.2em" }}>INVITE FRIENDS</Mono>
              <div className="mt-2">
                <ShareActions url={inviteUrl} text={`Join my Lock In league "${league.name}" and call the F1 podium every weekend.`} />
              </div>
            </div>
          ) : user ? (
            <JoinLeagueButton code={league.code} />
          ) : (
            <Link href={`/lockin/sign-in?next=${encodeURIComponent(`/lockin/l/${league.code}`)}`} className="font-display inline-block" style={{ background: F1.red, color: F1.ink, fontSize: 16, fontWeight: 700, letterSpacing: "0.06em", padding: "12px 22px" }}>
              SIGN IN TO JOIN
            </Link>
          )}
        </div>
      </header>
      <div style={{ padding: "clamp(16px, 3vw, 28px) clamp(12px, 3vw, 32px) clamp(24px, 4vw, 40px)" }}>
        <LeaderboardTable rows={standings} highlightUserId={user?.id ?? null} showRounds emptyText="Nobody has joined yet." />
      </div>
    </>
  );
}
