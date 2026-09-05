import Link from "next/link";
import { F1, Mono } from "@/components/shared/broadcast";
import { ComingSoon } from "@/components/lockin/coming-soon";
import { CreateLeagueForm, JoinLeagueForm } from "@/components/lockin/league-forms";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserLeagues } from "@/lib/lockin/queries";
import { createPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Lock In Leagues: Play F1 Predictions With Friends",
  description: "Start a private Lock In league, share the invite link, and race your friends on the season leaderboard.",
  path: "/lockin/leagues",
});

export default async function LeaguesPage() {
  if (!env.lockInEnabled) return <ComingSoon />;
  const user = await getCurrentUser();
  const leagues = user ? await getUserLeagues(user.id) : [];

  return (
    <>
      <header style={{ padding: "clamp(28px, 5vw, 44px) clamp(16px, 4vw, 32px) 24px", borderBottom: `1px solid ${F1.line}` }}>
        <Mono style={{ fontSize: 11, color: F1.red, letterSpacing: "0.22em", fontWeight: 700 }}>LOCK IN</Mono>
        <h1 className="font-display mt-3 uppercase" style={{ fontSize: "clamp(40px, 8vw, 88px)", fontWeight: 700, lineHeight: 0.9, letterSpacing: "-0.04em", margin: "12px 0 0" }}>
          Leagues<span style={{ color: F1.red }}>.</span>
        </h1>
        <p className="mt-4 max-w-xl" style={{ color: F1.fg2, fontSize: 15, lineHeight: 1.6 }}>
          A league is a private leaderboard for the people you watch races with. Start one, send the link, and every settled round updates the table.
        </p>
      </header>
      <div style={{ padding: "clamp(16px, 3vw, 28px) clamp(12px, 3vw, 32px) clamp(24px, 4vw, 40px)" }}>
        {!user ? (
          <div style={{ background: F1.bg2, border: `1px solid ${F1.line}`, padding: "clamp(16px, 3vw, 24px)" }}>
            <p style={{ color: F1.fg2, fontSize: 15, margin: 0 }}>Sign in to start or join a league.</p>
            <Link href="/lockin/sign-in?next=%2Flockin%2Fleagues" className="font-display mt-4 inline-block" style={{ background: F1.red, color: F1.ink, fontSize: 16, fontWeight: 700, letterSpacing: "0.06em", padding: "12px 22px" }}>
              SIGN IN
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <section aria-labelledby="mine-heading">
              <Mono id="mine-heading" style={{ fontSize: 11, color: F1.fg3, letterSpacing: "0.22em", fontWeight: 700 }}>YOUR LEAGUES</Mono>
              <div className="mt-3 grid gap-2">
                {leagues.length === 0 && (
                  <p style={{ color: F1.fg2, fontSize: 14, margin: 0 }}>You are not in a league yet. Start one on the right, or paste a code a friend sent you.</p>
                )}
                {leagues.map((l) => (
                  <Link key={l.id} href={`/lockin/l/${l.code}`} className="flex items-center justify-between gap-3 transition-shadow hover:shadow-[inset_0_0_0_999px_rgba(255,255,255,0.04)]" style={{ background: F1.bg2, border: `1px solid ${F1.line}`, padding: "14px 16px", textDecoration: "none" }}>
                    <span className="font-display truncate" style={{ fontSize: 20, fontWeight: 600, color: F1.fg }}>{l.name}</span>
                    <Mono className="shrink-0" style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.16em" }}>
                      {l.members} {l.members === 1 ? "PLAYER" : "PLAYERS"} · {l.code}
                    </Mono>
                  </Link>
                ))}
              </div>
            </section>
            <div className="grid gap-4">
              <CreateLeagueForm />
              <JoinLeagueForm />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
