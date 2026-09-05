import { NextResponse } from "next/server";
import { getLiveWindowSession, SESSION_LABELS } from "@/lib/constants/sessions";
import { CIRCUIT_LIST } from "@/lib/constants/circuits";
import { isStreamCurrent } from "@/hooks/live-stream-status";
import { adaptFeed } from "@/lib/live/feed-adapter";
import { getStreamingStatus } from "@/lib/live/f1-signalr";
import { fetchFeedSnapshot } from "@/lib/live/snapshot";
import type { LiveSnapshot, SnapshotRow } from "@/lib/live/snapshot-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const RUNNING = new Set(["Started", "Aborted"]);

function gapLabel(position: number, gap: number | string | null): string {
  if (position === 1) return "LEADER";
  if (gap === null) return "";
  if (typeof gap === "string") return gap;
  return `+${gap.toFixed(3)}`;
}

function compoundShort(c: string | null): string | null {
  if (!c) return null;
  const u = c.toUpperCase();
  for (const k of ["S", "M", "H", "I", "W"]) if (u.startsWith(k)) return k;
  return null;
}

function offline(reason: string, maxAge: number): NextResponse {
  return NextResponse.json(
    { live: false, reason },
    { headers: { "Cache-Control": `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}` } },
  );
}

/**
 * Compact, CDN-cached picture of the live session for the homepage. One F1
 * connection per cache window per region, however many visitors are looking.
 */
export async function GET(): Promise<Response> {
  const nowMs = Date.now();
  const window = getLiveWindowSession(nowMs);
  if (!window) return offline("no-session-window", 60);
  if ((await getStreamingStatus()) !== "Available") return offline("not-streaming", 30);

  const state = await fetchFeedSnapshot();
  if (!state) return offline("feed-unavailable", 15);
  const data = adaptFeed(state);
  if (!isStreamCurrent(data.session, nowMs)) return offline("session-ended", 60);

  const driverMap = new Map(data.drivers.map((d) => [d.driver_number, d]));
  const intervalMap = new Map(data.intervals.map((i) => [i.driver_number, i]));
  const stintMap = new Map(data.stints.map((s) => [s.driver_number, s]));
  const lapMap = new Map(data.lapStats.map((l) => [l.driver_number, l]));
  const rows: SnapshotRow[] = [...data.positions]
    .sort((a, b) => a.position - b.position)
    .slice(0, 10)
    .map((p) => {
      const d = driverMap.get(p.driver_number);
      const colour = d?.team_colour ? `#${d.team_colour.replace(/^#/, "")}` : "#84848F";
      return {
        position: p.position,
        driverNumber: p.driver_number,
        code: d?.name_acronym ?? `#${p.driver_number}`,
        lastName: d?.full_name?.split(" ").pop() ?? "",
        teamName: d?.team_name ?? "",
        teamColor: colour,
        gap: gapLabel(p.position, intervalMap.get(p.driver_number)?.gap_to_leader ?? null),
        compound: compoundShort(stintMap.get(p.driver_number)?.compound ?? null),
        lastLap: lapMap.get(p.driver_number)?.last ?? null,
      };
    });

  const circuit = CIRCUIT_LIST.find((c) => c.raceDate === window.raceDate);
  const body: LiveSnapshot = {
    live: true,
    running: data.session?.status !== null && data.session !== null && RUNNING.has(data.session.status ?? ""),
    session: {
      name: data.session?.name ?? SESSION_LABELS[window.session],
      type: data.session?.type ?? "",
      circuit: data.session?.circuitShortName || circuit?.name || "",
      country: data.session?.countryName || circuit?.country || "",
      status: data.session?.status ?? null,
    },
    currentLap: data.currentLap,
    totalLaps: data.totalLaps,
    trackStatus: data.trackStatus,
    weather: data.weather ? { air: data.weather.air_temperature, track: data.weather.track_temperature, rainfall: data.weather.rainfall } : null,
    rows,
    updatedAt: new Date(nowMs).toISOString(),
  };
  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20" },
  });
}
