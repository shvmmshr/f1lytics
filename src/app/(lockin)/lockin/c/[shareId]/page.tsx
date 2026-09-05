import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { F1, Mono } from "@/components/shared/broadcast";
import { ComingSoon } from "@/components/lockin/coming-soon";
import { PicksCard } from "@/components/lockin/picks-card";
import { env } from "@/lib/env";
import { getShare } from "@/lib/lockin/queries";
import { getRoundByDate, toRoundSummary } from "@/lib/lockin/rounds";
import { createPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ shareId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shareId } = await params;
  const share = env.lockInEnabled ? await getShare(shareId).catch(() => null) : null;
  const round = share ? getRoundByDate(share.raceDate) : undefined;
  const title = share && round ? `${share.displayName} called the 2026 ${round.fullName}` : "Lock In card";
  return createPageMetadata({
    title,
    description: share?.score ? `${share.score.points} points on Lock In. Make your own calls before the next race.` : "Pole, podium, fastest lap and the margin, locked in before qualifying.",
    path: `/lockin/c/${shareId}`,
    imagePath: `/api/og/lockin?share=${encodeURIComponent(shareId)}`,
    noIndex: true,
  });
}

export default async function ShareCardPage({ params }: Props) {
  const { shareId } = await params;
  if (!env.lockInEnabled) return <ComingSoon />;
  const share = await getShare(shareId);
  if (!share) notFound();
  const round = getRoundByDate(share.raceDate);
  if (!round) notFound();
  const result = share.result.raceSettled || share.result.pole ? { ...share.result } : null;

  return (
    <div className="mx-auto max-w-2xl" style={{ padding: "clamp(24px, 4vw, 40px) clamp(12px, 3vw, 24px)" }}>
      <PicksCard
        round={toRoundSummary(round)}
        picks={share.picks}
        result={result}
        breakdown={share.score?.breakdown ?? null}
        displayName={share.displayName}
        points={share.score?.points ?? null}
        rank={share.score?.rank ?? null}
        players={share.score?.players ?? null}
        sealed={!share.result.raceSettled}
      />
      <div className="mt-6" style={{ background: F1.bg2, border: `1px solid ${F1.line}`, padding: "clamp(16px, 3vw, 24px)" }}>
        <Mono style={{ fontSize: 11, color: F1.red, letterSpacing: "0.22em", fontWeight: 700 }}>YOUR TURN</Mono>
        <p className="mt-2" style={{ color: F1.fg2, fontSize: 15, lineHeight: 1.6 }}>
          Call pole, the podium and the fastest lap before the next race weekend. Free, no app, one tap to sign in.
        </p>
        <Link href="/lockin" className="font-display mt-4 inline-block" style={{ background: F1.red, color: F1.ink, fontSize: 16, fontWeight: 700, letterSpacing: "0.06em", padding: "12px 22px" }}>
          LOCK IN YOUR CALLS
        </Link>
      </div>
    </div>
  );
}
