import { NextResponse } from "next/server";
import {
  getSessions,
  getPositions,
  getIntervals,
  getDrivers,
} from "@/lib/api/openf1";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const year = now.getFullYear();

    // Fetch all sessions for current year
    const sessions = await getSessions({ year });

    // Find active session: date_start <= now <= date_end (or no date_end yet)
    const activeSession = sessions.find((s) => {
      const start = new Date(s.date_start);
      const end = s.date_end ? new Date(s.date_end) : null;
      return start <= now && (!end || end >= now);
    });

    // Also check for recently finished sessions (within last 2 hours)
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

    // Fetch live data in parallel
    const [positions, intervals, drivers] = await Promise.all([
      getPositions({ session_key: sessionKey }),
      getIntervals({ session_key: sessionKey }),
      getDrivers({ session_key: sessionKey }),
    ]);

    // Get latest position per driver (positions are chronological, take last entry per driver)
    const latestPositions = new Map<number, (typeof positions)[number]>();
    for (const p of positions) {
      latestPositions.set(p.driver_number, p);
    }

    // Get latest interval per driver
    const latestIntervals = new Map<number, (typeof intervals)[number]>();
    for (const i of intervals) {
      latestIntervals.set(i.driver_number, i);
    }

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
