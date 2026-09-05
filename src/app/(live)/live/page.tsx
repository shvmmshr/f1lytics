import { PageTransition } from "@/components/layout/page-transition";
import { getLatestCompletedRaceKey } from "@/lib/api/openf1";
import { LiveContent } from "./live-content";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getLiveCallouts } from "@/lib/lockin/callouts";

export const metadata = createPageMetadata({
  title: "F1 Live Timing, Telemetry & Race Tracker",
  description:
    "Follow F1 positions, gaps, sectors, tyres, race control, weather, and replay data, with clear limitations when live timing is locked.",
  path: "/live",
  imageEyebrow: "LIVE TIMING",
});

export const dynamic = "force-dynamic";

interface LivePageProps {
  searchParams: Promise<{ replay?: string }>;
}

export default async function LivePage({ searchParams }: LivePageProps) {
  const { replay } = await searchParams;
  const parsed = replay ? Number.parseInt(replay, 10) : NaN;
  const replaySessionKey = Number.isNaN(parsed) ? null : parsed;

  // Most recently completed race — powers the "Replay last race" demo button.
  const [lastRaceSessionKey, callouts] = await Promise.all([getLatestCompletedRaceKey(), getLiveCallouts()]);

  return (
    <PageTransition>
      {/* The timing screen is all data chrome — give crawlers/screen readers
          the page's one h1 without altering the broadcast layout. */}
      <h1 className="sr-only">Live F1 timing — positions, gaps and race control</h1>
      <LiveContent
        replaySessionKey={replaySessionKey}
        lastRaceSessionKey={lastRaceSessionKey}
        callouts={callouts}
      />
    </PageTransition>
  );
}
