import { notFound } from "next/navigation";
import { positiveInteger } from "@/lib/live/request";
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
  const replaySessionKey = positiveInteger(replay ?? null);
  if (replay !== undefined && replaySessionKey === null) notFound();

  // Most recently completed race — powers the "Replay last race" demo button.
  const [lastRaceSessionKey, callouts] = await Promise.all([getLatestCompletedRaceKey(), getLiveCallouts()]);

  return (
    <PageTransition>
      <header className="border-b border-line bg-bg-secondary px-4 py-4 sm:px-6">
        <h1 className="font-display text-2xl uppercase text-text-primary">F1 live timing</h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-text-secondary">Positions, gaps, lap times and race control.</p>
      </header>
      <LiveContent
        replaySessionKey={replaySessionKey}
        lastRaceSessionKey={lastRaceSessionKey}
        callouts={callouts}
      />
      <details className="border-t border-line bg-bg-secondary px-4 py-2 text-sm leading-relaxed text-text-secondary sm:px-6">
        <summary className="w-fit cursor-pointer py-3 underline underline-offset-4">Timing guide</summary>
        <div className="grid max-w-5xl gap-4 sm:grid-cols-3">
          <p><strong className="text-text-primary">Gap and interval.</strong> Gap measures the distance in time to the leader. Interval measures the distance to the car ahead. A lapped car may have a lap gap instead of a time.</p>
          <p><strong className="text-text-primary">Live and review.</strong> Live timing follows incoming session updates. Race review shows the recorded session data, rather than a second-by-second playback or video broadcast.</p>
          <p><strong className="text-text-primary">Missing data.</strong> Telemetry may be unavailable even when timing positions are present. A locked feed means details are unavailable; it does not mean the session was cancelled.</p>
        </div>
        <a href="/about#methodology" className="mt-4 inline-block underline underline-offset-4">Read the data methodology</a>
      </details>
    </PageTransition>
  );
}
