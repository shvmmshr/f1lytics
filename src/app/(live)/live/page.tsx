import type { Metadata } from "next";
import { PageTransition } from "@/components/layout/page-transition";
import { getLatestCompletedRaceKey } from "@/lib/api/openf1";
import { LiveContent } from "./live-content";

export const metadata: Metadata = {
  title: "Live Timing",
  description:
    "Live F1 session timing, positions, and race control data for the 2026 season",
};

export const dynamic = "force-dynamic";

interface LivePageProps {
  searchParams: Promise<{ replay?: string }>;
}

export default async function LivePage({ searchParams }: LivePageProps) {
  const { replay } = await searchParams;
  const parsed = replay ? Number.parseInt(replay, 10) : NaN;
  const replaySessionKey = Number.isNaN(parsed) ? null : parsed;

  // Most recently completed race — powers the "Replay last race" demo button.
  const lastRaceSessionKey = await getLatestCompletedRaceKey();

  return (
    <PageTransition>
      <LiveContent
        replaySessionKey={replaySessionKey}
        lastRaceSessionKey={lastRaceSessionKey}
      />
    </PageTransition>
  );
}
