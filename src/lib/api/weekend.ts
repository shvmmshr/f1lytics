import { getSessions, getSessionResult, getDrivers } from "./openf1";
import { getQualifyingResults, getRaceResults } from "./jolpica";
import type { OpenF1Session } from "./types";
import { CIRCUIT_LIST, getApiRound, type Circuit } from "@/lib/constants";
import { TEAMS } from "@/lib/constants/teams";
import { getWeekendSchedule } from "@/lib/constants/sessions";
import { formatLapTime } from "@/lib/utils";

/** One slot of a starting grid / podium, normalized across data sources. */
export interface GridRow {
  position: number;
  driverName: string;
  familyName: string;
  teamName: string;
  teamColor: string;
  /** Best qualifying lap (grid) or points (podium), already formatted. */
  time: string | null;
}

/** The most recently finished Grand Prix, for the homepage LAST RACE card. */
export interface RecentRace {
  slug: string;
  name: string;
  round: number;
  podium: GridRow[];
}

/** How long after lights-out the homepage keeps celebrating the last race. */
const RECENT_RACE_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;
/** A race is treated as finished ~2.5h after its scheduled start. */
const RACE_DURATION_MS = 2.5 * 60 * 60 * 1000;
const WEEKEND_MS = 4 * 24 * 60 * 60 * 1000;

/** Fuzzy team-name → brand colour, tolerant of OpenF1 vs Jolpica naming
 *  ("Red Bull Racing" / "Red Bull" / "Racing Bulls" …). */
function teamColorFromName(teamName: string): string {
  const normalized = teamName.toLowerCase();
  let best: { color: string; score: number } | null = null;
  for (const team of Object.values(TEAMS)) {
    const name = team.name.toLowerCase();
    const full = team.fullName.toLowerCase();
    let score = 0;
    if (normalized === name) score = 3;
    else if (full.includes(normalized) || normalized.includes(name)) score = 2;
    else if (name.includes(normalized)) score = 1;
    // Longer matches win so "Racing Bulls" beats "Red Bull" partial overlap.
    if (score > 0 && (!best || score > best.score)) best = { color: team.color, score };
  }
  return best?.color ?? "#84848F";
}

/** Find an OpenF1 session of the given name inside a circuit's race weekend. */
async function findWeekendSession(
  circuit: Circuit,
  sessionName: string
): Promise<OpenF1Session | null> {
  const raceMs = new Date(`${circuit.raceDate}T00:00:00Z`).getTime();
  const sessions = await getSessions({ year: 2026, session_name: sessionName });
  return (
    sessions
      .map((s) => ({ s, diff: Math.abs(new Date(s.date_start).getTime() - raceMs) }))
      .filter(({ diff }) => diff <= WEEKEND_MS)
      .sort((a, b) => a.diff - b.diff)[0]?.s ?? null
  );
}

/** Classification of an OpenF1 session as GridRows (names joined from the
 *  session's driver list). Returns [] when results aren't out yet. */
async function openF1Classification(
  circuit: Circuit,
  sessionName: string
): Promise<GridRow[]> {
  const session = await findWeekendSession(circuit, sessionName);
  if (!session) return [];
  const [results, drivers] = await Promise.all([
    getSessionResult({ session_key: session.session_key }),
    getDrivers({ session_key: session.session_key }),
  ]);
  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));
  return results
    .filter((r) => r.position !== null && !r.dns)
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
    .map((r) => {
      const d = driverMap.get(r.driver_number);
      const fullName = d?.full_name ?? `#${r.driver_number}`;
      // duration is [Q1,Q2,Q3] for quali (best = last stint reached), or a
      // single number for races.
      const laps = Array.isArray(r.duration) ? r.duration : [r.duration];
      const bestLap = [...laps].reverse().find((t) => typeof t === "number") ?? null;
      const teamName = d?.team_name ?? "—";
      return {
        position: r.position ?? 0,
        driverName: fullName,
        familyName: fullName.split(" ").pop() ?? fullName,
        teamName,
        teamColor: d?.team_colour ? `#${d.team_colour}` : teamColorFromName(teamName),
        time: bestLap !== null ? formatLapTime(bestLap) : null,
      };
    });
}

/**
 * Starting grid for a circuit's Grand Prix, OpenF1-first (live minutes after
 * qualifying — the same source as /live) with Jolpica as fallback once the
 * slower mirror publishes. Grid order is the qualifying classification;
 * penalties may still shuffle it.
 */
export async function getStartingGrid(circuit: Circuit): Promise<GridRow[]> {
  try {
    const rows = await openF1Classification(circuit, "Qualifying");
    if (rows.length > 0) return rows;
  } catch (err) {
    console.warn("[f1lytics] OpenF1 grid fetch failed:", err);
  }

  try {
    const quali = await getQualifyingResults("2026", String(getApiRound(circuit)));
    const race = quali[0] ?? null;
    if (!race || race.date !== circuit.raceDate) return [];
    return [...(race.QualifyingResults ?? [])]
      .sort((a, b) => Number.parseInt(a.position, 10) - Number.parseInt(b.position, 10))
      .map((r) => ({
        position: Number.parseInt(r.position, 10),
        driverName: `${r.Driver.givenName} ${r.Driver.familyName}`,
        familyName: r.Driver.familyName,
        teamName: r.Constructor.name,
        teamColor: teamColorFromName(r.Constructor.name),
        time: r.Q3 ?? r.Q2 ?? r.Q1 ?? null,
      }));
  } catch (err) {
    console.warn("[f1lytics] Jolpica grid fallback failed:", err);
    return [];
  }
}

/**
 * The Grand Prix that finished within the last 3 days, with its podium —
 * Jolpica-first (official points), OpenF1 fallback so the homepage can
 * celebrate the winner minutes after the flag.
 */
export async function getRecentRace(): Promise<RecentRace | null> {
  const now = Date.now();
  const recent = CIRCUIT_LIST.filter((c) => {
    if (c.cancelled) return false;
    const startIso = getWeekendSchedule(c.raceDate)?.race;
    if (!startIso) return false;
    const raceEnd = new Date(startIso).getTime() + RACE_DURATION_MS;
    return now >= raceEnd && now - raceEnd <= RECENT_RACE_WINDOW_MS;
  }).sort((a, b) => (a.raceDate < b.raceDate ? 1 : -1))[0];
  if (!recent) return null;

  try {
    const results = await getRaceResults("2026", String(getApiRound(recent)));
    const race = results[0] ?? null;
    if (race && race.date === recent.raceDate && (race.Results?.length ?? 0) > 0) {
      const podium = [...(race.Results ?? [])]
        .sort((a, b) => Number.parseInt(a.position, 10) - Number.parseInt(b.position, 10))
        .slice(0, 3)
        .map((r) => ({
          position: Number.parseInt(r.position, 10),
          driverName: `${r.Driver.givenName} ${r.Driver.familyName}`,
          familyName: r.Driver.familyName,
          teamName: r.Constructor.name,
          teamColor: teamColorFromName(r.Constructor.name),
          time: `${Number.parseFloat(r.points).toFixed(0)} PTS`,
        }));
      return { slug: recent.slug, name: recent.name, round: recent.round, podium };
    }
  } catch (err) {
    console.warn("[f1lytics] recent race Jolpica fetch failed:", err);
  }

  try {
    const podium = (await openF1Classification(recent, "Race")).slice(0, 3);
    if (podium.length === 0) return null;
    return {
      slug: recent.slug,
      name: recent.name,
      round: recent.round,
      podium: podium.map((p) => ({ ...p, time: null })),
    };
  } catch (err) {
    console.warn("[f1lytics] recent race OpenF1 fallback failed:", err);
    return null;
  }
}
