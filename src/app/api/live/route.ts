import { unstable_cache } from "next/cache";
import { positiveInteger } from "@/lib/live/request";
import { latestByDriver, latestRows } from "@/lib/live/latest";
import { getStreamingStatus } from "@/lib/live/f1-signalr";
import { NextResponse } from "next/server";
import {
  getSessions,
  getPositions,
  getIntervals,
  getDrivers,
  getLaps,
  getStints,
  getRaceControl,
  getTeamRadio,
  getCarData,
  getWeather,
} from "@/lib/api/openf1";
import { getLiveWindowSession, type WeekendSchedule } from "@/lib/constants/sessions";
import { CIRCUIT_LIST } from "@/lib/constants/circuits";

export const dynamic = "force-dynamic";

/** Friendly display name + broadcast type per schedule session key. */
const SESSION_LABELS: Record<keyof WeekendSchedule, { name: string; type: string }> = {
  fp1: { name: "PRACTICE 1", type: "Practice" },
  fp2: { name: "PRACTICE 2", type: "Practice" },
  fp3: { name: "PRACTICE 3", type: "Practice" },
  sprintQualifying: { name: "SPRINT QUALIFYING", type: "Qualifying" },
  sprint: { name: "SPRINT", type: "Race" },
  qualifying: { name: "QUALIFYING", type: "Qualifying" },
  race: { name: "RACE", type: "Race" },
};

/**
 * Fallback for the live window. Both free real-time feeds are gated DURING a
 * session: OpenF1 paywalls all access (even past sessions) until ~30 min after
 * it ends, and the SSE relay may not reach F1 from serverless. When a session
 * IS genuinely live we surface status LIVE_LOCKED instead of a misleading "NO
 * SESSION".
 *
 * Authority for "is it live" is F1's StreamingStatus — NOT the baked schedule,
 * whose generous window would otherwise keep claiming "in progress" for up to
 * 30 min after the race actually ends. The schedule only supplies the label
 * (which session / circuit). Returns null when F1 says nothing is streaming.
 */
async function scheduledLiveResponse() {
  // Both must hold: a session is scheduled now AND F1 says it is streaming.
  // The status file alone says "Available" for entire weekends.
  const active = getLiveWindowSession(Date.now());
  if (!active) return null;
  if ((await getStreamingStatus()) !== "Available") return null;
  const circuit = CIRCUIT_LIST.find((c) => c.raceDate === active.raceDate);
  const label = SESSION_LABELS[active.session];
  return NextResponse.json({
    isLive: true,
    status: "LIVE_LOCKED",
    dataLocked: true,
    session: {
      key: 0,
      name: label.name,
      type: label.type,
      circuitShortName: circuit?.name ?? "",
      countryName: circuit?.country ?? "",
      dateStart: "",
      dateEnd: null,
    },
  });
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const focusedDriverParam = url.searchParams.get("focusedDriver");
    const sessionParam = url.searchParams.get("session");
    const focusedDriverNumber = positiveInteger(focusedDriverParam, 99);
    const sessionOverride = positiveInteger(sessionParam);
    if ((focusedDriverParam !== null && focusedDriverNumber === null) || (sessionParam !== null && sessionOverride === null)) {
      return NextResponse.json({ error: "Invalid session or driver identifier" }, { status: 400 });
    }

    const now = new Date();
    const year = now.getFullYear();

    let session: Awaited<ReturnType<typeof getSessions>>[number] | undefined;
    let activeSession: typeof session;

    if (sessionOverride) {
      // Fetch the exact session for replay.
      const overrideSessions = await getSessions({ session_key: sessionOverride }, true);
      session = overrideSessions[0];
      if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
      if (!session.date_end || Date.parse(session.date_end) > now.getTime()) {
        return NextResponse.json({ error: "This session has not finished. Open live timing instead." }, { status: 409 });
      }
    } else {
      // no-store: the session list must be fresh so a newly-started session is
      // detected immediately rather than up to an hour later (ISR cache).
      const sessions = await getSessions({ year }, true);

      activeSession = sessions.find((s) => {
        const start = new Date(s.date_start);
        const end = s.date_end ? new Date(s.date_end) : null;
        return start <= now && (!end || end >= now);
      });

      // Pick the MOST RECENT session that ended in the last 2h (sort by end desc —
      // OpenF1 does not guarantee chronological order, so `find` could grab FP2
      // instead of the race).
      const recentSession = !activeSession
        ? [...sessions]
            .filter((s) => {
              if (!s.date_end) return false;
              const end = new Date(s.date_end);
              const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
              return end >= twoHoursAgo && end <= now;
            })
            .sort(
              (a, b) =>
                new Date(b.date_end!).getTime() - new Date(a.date_end!).getTime()
            )[0]
        : null;

      session = activeSession || recentSession || undefined;
    }

    if (!session) {
      // OpenF1 returned a list but nothing's running/recent. If F1 says a
      // session IS streaming, surface the locked-live state.
      return (await scheduledLiveResponse()) ?? NextResponse.json({ isLive: false, status: "NO SESSION" });
    }

    const sessionKey = session.session_key;
    const historical = Boolean(session.date_end && Date.parse(session.date_end) < now.getTime() - 30 * 60_000);
    // Keep the route dynamic. Only completed-session datasets enter the shared
    // Data Cache, with errors caught outside so a failed panel is never cached.
    const read = <T,>(panel: string, fetcher: () => Promise<T>): Promise<T> => historical
      ? unstable_cache(fetcher, ["openf1-review-v2", String(sessionKey), panel], { revalidate: 3600 })()
      : fetcher();

    const [
      positions,
      intervals,
      drivers,
      laps,
      stints,
      raceControl,
      teamRadio,
      weather,
    ] = await Promise.all([
      // Every call tolerates failure (e.g. an OpenF1 429) so one bad endpoint
      // degrades that panel rather than blanking the whole timing screen.
      read("positions", async () => latestByDriver(await getPositions({ session_key: sessionKey }, true))).catch(() => []),
      read("intervals", async () => latestByDriver(await getIntervals({ session_key: sessionKey }))).catch(() => []),
      read("drivers", () => getDrivers({ session_key: sessionKey }, true)).catch(() => []),
      read("laps", () => getLaps({ session_key: sessionKey }, true)).catch(() => []),
      read("stints", () => getStints({ session_key: sessionKey }, true)).catch(() => []),
      read("race-control", async () => latestRows(await getRaceControl({ session_key: sessionKey }, true), 10)).catch(() => []),
      read("radio", async () => latestRows(await getTeamRadio({ session_key: sessionKey }), 8)).catch(() => []),
      read("weather", async () => latestRows(await getWeather({ session_key: sessionKey }), 1)).catch(() => []),
    ]);

    // Latest weather reading (rows are chronological; take the last one)
    const latestWeather = weather.length > 0 ? weather[weather.length - 1] : null;

    // Latest position per driver
    const latestPositions = new Map<number, (typeof positions)[number]>();
    for (const p of positions) {
      latestPositions.set(p.driver_number, p);
    }

    // Latest interval per driver
    const latestIntervals = new Map<number, (typeof intervals)[number]>();
    for (const i of intervals) {
      latestIntervals.set(i.driver_number, i);
    }

    // Latest stint per driver (most recent compound + tyre age)
    const latestStints = new Map<number, (typeof stints)[number]>();
    for (const s of stints) {
      const prev = latestStints.get(s.driver_number);
      if (!prev || s.stint_number > prev.stint_number) {
        latestStints.set(s.driver_number, s);
      }
    }

    // Lap stats per driver (last + best)
    interface LapStats {
      last: number | null;
      best: number | null;
      sectors: [number | null, number | null, number | null];
      lapNumber: number;
    }
    const lapStatsByDriver = new Map<number, LapStats>();
    const sortedLaps = [...laps].sort((a, b) => a.lap_number - b.lap_number);
    for (const lap of sortedLaps) {
      const prev = lapStatsByDriver.get(lap.driver_number);
      const dur = lap.lap_duration;
      lapStatsByDriver.set(lap.driver_number, {
        last: dur,
        best:
          prev && prev.best !== null && (dur === null || prev.best <= dur)
            ? prev.best
            : (dur ?? prev?.best ?? null),
        sectors: [
          lap.sector_1_duration,
          lap.sector_2_duration,
          lap.sector_3_duration,
        ],
        lapNumber: lap.lap_number,
      });
    }

    // Telemetry for the focused driver only — avoid pulling all 20
    let focusedCarData: Awaited<ReturnType<typeof getCarData>>[number] | null = null;
    if (focusedDriverNumber) {
      try {
        const until = historical ? Date.parse(session.date_end) : now.getTime();
        const sample = await read(`car-${focusedDriverNumber}`, async () => latestRows(await getCarData({
          session_key: sessionKey,
          driver_number: focusedDriverNumber,
          "date>": new Date(until - 5 * 60_000).toISOString(),
          "date<": new Date(until).toISOString(),
        }), 1));
        if (sample.length > 0) {
          focusedCarData = sample[sample.length - 1];
        }
      } catch {
        focusedCarData = null;
      }
    }

    // Most recent race control messages (last 10)
    const recentRaceControl = [...raceControl]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    // Most recent team radio (last 8)
    const recentTeamRadio = [...teamRadio]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);

    // Serialize lap stats map → array of objects
    const lapStats = Array.from(lapStatsByDriver.entries()).map(
      ([driver_number, s]) => ({ driver_number, ...s })
    );

    return NextResponse.json({
      isLive: !sessionOverride && !!activeSession,
      isReplay: !!sessionOverride,
      status: sessionOverride ? "REPLAY" : activeSession ? "LIVE" : "FINISHED",
      session: {
        key: session.session_key,
        name: session.session_name,
        type: session.session_type,
        circuitShortName: session.circuit_short_name,
        countryName: session.country_name,
        dateStart: session.date_start,
        dateEnd: session.date_end,
      },
      positions: Array.from(latestPositions.values()),
      intervals: Array.from(latestIntervals.values()),
      drivers,
      stints: Array.from(latestStints.values()),
      lapStats,
      raceControl: recentRaceControl,
      teamRadio: recentTeamRadio,
      focusedCarData,
      focusedDriverNumber,
      weather: latestWeather
        ? {
            air_temperature: latestWeather.air_temperature,
            track_temperature: latestWeather.track_temperature,
            humidity: latestWeather.humidity,
            rainfall: latestWeather.rainfall,
          }
        : null,
    });
  } catch (error) {
    // Expected during a live session: OpenF1 401s ("Live F1 session in progress")
    // until the session ends. Don't spam stack traces for it — fall back to the
    // schedule so the page shows the locked-live state, not a generic error.
    const locked = new URL(req.url).searchParams.has("session") ? null : await scheduledLiveResponse();
    if (locked) return locked;
    console.error("Live API error:", error);
    return NextResponse.json({
      isLive: false,
      status: "NO SESSION",
      error: "Failed to fetch live data",
    });
  }
}
