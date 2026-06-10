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
} from "@/lib/api/openf1";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const focusedDriverParam = url.searchParams.get("focusedDriver");
    const focusedDriverNumber = focusedDriverParam
      ? Number.parseInt(focusedDriverParam, 10)
      : null;

    const now = new Date();
    const year = now.getFullYear();

    const sessions = await getSessions({ year });

    const activeSession = sessions.find((s) => {
      const start = new Date(s.date_start);
      const end = s.date_end ? new Date(s.date_end) : null;
      return start <= now && (!end || end >= now);
    });

    const recentSession = !activeSession
      ? sessions.find((s) => {
          if (!s.date_end) return false;
          const end = new Date(s.date_end);
          const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
          return end >= twoHoursAgo && end <= now;
        })
      : null;

    const session = activeSession || recentSession;

    if (!session) {
      return NextResponse.json({ isLive: false, status: "NO SESSION" });
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
    ] = await Promise.all([
      getPositions({ session_key: sessionKey }),
      getIntervals({ session_key: sessionKey }),
      getDrivers({ session_key: sessionKey }),
      getLaps({ session_key: sessionKey }).catch(() => []),
      getStints({ session_key: sessionKey }).catch(() => []),
      getRaceControl({ session_key: sessionKey }).catch(() => []),
      getTeamRadio({ session_key: sessionKey }).catch(() => []),
    ]);

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
      isLive: !!activeSession,
      status: activeSession ? "LIVE" : "FINISHED",
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
    });
  } catch (error) {
    console.error("Live API error:", error);
    return NextResponse.json({
      isLive: false,
      status: "NO SESSION",
      error: "Failed to fetch live data",
    });
  }
}
