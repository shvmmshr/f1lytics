import { Hero } from "@/components/home/hero";
import { NextRaceCountdown } from "@/components/home/next-race-countdown";
import { SeasonCalendarStrip } from "@/components/home/season-calendar-strip";
import { NewsStrip } from "@/components/home/news-strip";
import { StatsRow } from "@/components/home/stats-row";
import {
  getDriverStandings,
  getConstructorStandings,
  getSprintResults,
} from "@/lib/api/jolpica";
import { getStartingGrid, getRecentRace, type RecentRace } from "@/lib/api/weekend";
import { DRIVER_LIST, TEAM_LIST, getNextEvent, getApiRound } from "@/lib/constants";
import { mapConstructorToTeamId } from "@/lib/constructor-map";
import type { WeekendInfo } from "@/components/home/hero";

export default async function Home() {
  // Honest fallback (shown only if the API is unavailable): real names, 0 points
  // — never invented numbers. teamId is already an internal id here.
  let driverStandings = DRIVER_LIST.slice(0, 5).map((d, i) => ({
    position: i + 1,
    name: `${d.firstName} ${d.lastName}`,
    teamId: d.teamId,
    points: 0,
  }));

  let constructorStandings = TEAM_LIST.slice(0, 5).map((t, i) => ({
    position: i + 1,
    name: t.name,
    teamId: t.id,
    points: 0,
  }));

  try {
    const [drivers, constructors] = await Promise.all([
      getDriverStandings("2026"),
      getConstructorStandings("2026"),
    ]);

    if (drivers.length > 0) {
      driverStandings = drivers.slice(0, 5).map((d) => {
        const constructorId = d.Constructors[0]?.constructorId ?? "";
        return {
          position: Number(d.position),
          name: `${d.Driver.givenName} ${d.Driver.familyName}`,
          // Map Jolpica constructorId -> internal team id so Hero's TEAMS[teamId]
          // resolves team colour for rb/sauber/audi/cadillac etc.
          teamId:
            mapConstructorToTeamId(constructorId, d.Constructors[0]?.name ?? "") ??
            constructorId,
          points: Number(d.points),
        };
      });
    }

    if (constructors.length > 0) {
      constructorStandings = constructors.slice(0, 5).map((c) => ({
        position: Number(c.position),
        name: c.Constructor.name,
        teamId:
          mapConstructorToTeamId(c.Constructor.constructorId, c.Constructor.name) ??
          c.Constructor.constructorId,
        points: Number(c.points),
      }));
    }
  } catch (err) {
    console.error("[f1lytics] home standings fetch failed:", err);
    // Use honest static fallback defined above
  }

  // Weekend mode: once the next event's race weekend is underway (race day
  // minus 3 days), surface what's already decided — the starting grid (from
  // OpenF1, minutes after qualifying) and the sprint winner — in the Hero's
  // UP NEXT card. After a race, the LAST RACE podium card shows for 3 days.
  let weekend: WeekendInfo | null = null;
  let recentRace: RecentRace | null = null;
  const event = getNextEvent();
  const nextCircuit = event?.circuit;
  // Non-null exactly when the next event's race weekend is underway.
  const circuit =
    nextCircuit &&
    !nextCircuit.cancelled &&
    Date.now() >=
      new Date(`${nextCircuit.raceDate}T00:00:00Z`).getTime() - 3 * 24 * 60 * 60 * 1000
      ? nextCircuit
      : null;

  try {
    const [grid, sprint, recent] = await Promise.all([
      circuit ? getStartingGrid(circuit) : Promise.resolve([]),
      circuit?.isSprint
        ? getSprintResults("2026", String(getApiRound(circuit)))
        : Promise.resolve(null),
      getRecentRace(),
    ]);
    recentRace = recent;
    if (circuit) {
      weekend = { raceSlug: circuit.slug, isSprint: circuit.isSprint };
      if (grid.length > 0) weekend.grid = grid.slice(0, 8);
      const sprintWinner =
        sprint?.date === circuit.raceDate
          ? sprint.SprintResults?.find((r) => r.position === "1")
          : undefined;
      if (sprintWinner) {
        weekend.sprintWinner = { name: sprintWinner.Driver.familyName };
      }
    }
  } catch (err) {
    // warn, not error: transient 429s are expected and self-heal via ISR.
    console.warn("[f1lytics] home weekend data fetch failed:", err);
    // Weekend banner still renders without highlights.
  }

  return (
    <>
      <Hero
        driverStandings={driverStandings}
        constructorStandings={constructorStandings}
        weekend={weekend}
        recentRace={recentRace}
      />
      <div className="space-y-0">
        <NextRaceCountdown />
        <SeasonCalendarStrip />
        <NewsStrip />
        <StatsRow />
        {/* Single data-source attribution for the whole site (kept off the
            navbar/footer/ticker on purpose — mentioned once, small, here). */}
        <div
          className="text-center font-mono"
          style={{
            padding: "18px 24px",
            fontSize: 9,
            letterSpacing: "0.18em",
            color: "#5C5C66",
            background: "#08080A",
            borderTop: "1px solid #27272A",
          }}
        >
          DATA · OPENF1 + JOLPICA-F1 + F1 LIVE TIMING — NOT AFFILIATED WITH FORMULA 1
        </div>
      </div>
    </>
  );
}
