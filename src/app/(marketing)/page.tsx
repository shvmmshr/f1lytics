import { Hero } from "@/components/home/hero";
import { NextRaceCountdown } from "@/components/home/next-race-countdown";
import { SeasonCalendarStrip } from "@/components/home/season-calendar-strip";
import { StatsRow } from "@/components/home/stats-row";
import { getDriverStandings, getConstructorStandings } from "@/lib/api/jolpica";
import { DRIVER_LIST, TEAM_LIST } from "@/lib/constants";
import { mapConstructorToTeamId } from "@/lib/constructor-map";

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

  return (
    <>
      <Hero driverStandings={driverStandings} constructorStandings={constructorStandings} />
      <div className="space-y-0">
        <NextRaceCountdown />
        <SeasonCalendarStrip />
        <StatsRow />
      </div>
    </>
  );
}
