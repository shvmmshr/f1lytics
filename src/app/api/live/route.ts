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
import { getActiveSession, type WeekendSchedule } from "@/lib/constants/sessions";
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

/** F1's streaming status — the real-time authority for "is a session live now".
 *  Free, no auth. Returns "Offline" on any failure (fail closed). */
async function getStreamingStatus(): Promise<string> {
  try {
    const res = await fetch(
      "https://livetiming.formula1.com/static/StreamingStatus.json",
      { cache: "no-store" },
    );
    if (!res.ok) return "Offline";
    const text = await res.text();
    // Served with a UTF-8 BOM, which breaks JSON.parse.
    const parsed = JSON.parse(text.replace(/^﻿/, "")) as { Status?: string };
    return parsed.Status ?? "Offline";
  } catch {
    return "Offline";
  }
}

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
  if ((await getStreamingStatus()) !== "Available") return null;
  const active = getActiveSession(Date.now());
  const circuit = active
    ? CIRCUIT_LIST.find((c) => c.raceDate === active.raceDate)
    : undefined;
  const label = active
    ? SESSION_LABELS[active.session]
    : { name: "LIVE SESSION", type: "" };
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
    const focusedDriverNumber = focusedDriverParam
      ? Number.parseInt(focusedDriverParam, 10)
      : null;
    // Replay mode: load a specific past session by key (demo / review anytime).
    const sessionOverrideParam = url.searchParams.get("session");
    const sessionOverride = sessionOverrideParam
      ? Number.parseInt(sessionOverrideParam, 10)
      : null;

    const now = new Date();
    const year = now.getFullYear();

    let session: Awaited<ReturnType<typeof getSessions>>[number] | undefined;
    let activeSession: typeof session;

    if (sessionOverride) {
      // Fetch the exact session for replay.
      const overrideSessions = await getSessions({ session_key: sessionOverride }, true);
      session = overrideSessions[0];
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
      getPositions({ session_key: sessionKey }, true).catch(() => []),
      getIntervals({ session_key: sessionKey }).catch(() => []),
      getDrivers({ session_key: sessionKey }, true).catch(() => []),
      getLaps({ session_key: sessionKey }, true).catch(() => []),
      getStints({ session_key: sessionKey }, true).catch(() => []),
      getRaceControl({ session_key: sessionKey }, true).catch(() => []),
      getTeamRadio({ session_key: sessionKey }).catch(() => []),
      getWeather({ session_key: sessionKey }).catch(() => []),
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
        const sample = await getCarData({
          session_key: sessionKey,
          driver_number: focusedDriverNumber,
        });
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
    const locked = await scheduledLiveResponse();
    if (locked) return locked;
    console.error("Live API error:", error);
    return NextResponse.json({
      isLive: false,
      status: "NO SESSION",
      error: "Failed to fetch live data",
    });
  }
}
