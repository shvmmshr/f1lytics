import { Hero } from "@/components/home/hero";
import { NextRaceCountdown } from "@/components/home/next-race-countdown";
import { ChampionshipSnapshot } from "@/components/home/championship-snapshot";
import { SeasonCalendarStrip } from "@/components/home/season-calendar-strip";
import { StatsRow } from "@/components/home/stats-row";
import { getDriverStandings, getConstructorStandings } from "@/lib/api/jolpica";
import { DRIVER_LIST, TEAM_LIST } from "@/lib/constants";

export default async function Home() {
  // Fallback data from static constants
  let driverStandings = DRIVER_LIST.slice(0, 5).map((d, i) => ({
    position: i + 1,
    name: `${d.firstName} ${d.lastName}`,
    teamId: d.teamId,
    points: (5 - i) * 50 + (i * 7) % 10,
  }));

  let constructorStandings = TEAM_LIST.slice(0, 5).map((t, i) => ({
    position: i + 1,
    name: t.name,
    teamId: t.id,
    points: (5 - i) * 100 + (i * 13) % 20,
  }));

  try {
    const [drivers, constructors] = await Promise.all([
      getDriverStandings(),
      getConstructorStandings(),
    ]);

    if (drivers.length > 0) {
      driverStandings = drivers.slice(0, 5).map((d) => ({
        position: Number(d.position),
        name: `${d.Driver.givenName} ${d.Driver.familyName}`,
        teamId: d.Constructors[0]?.constructorId ?? "",
        points: Number(d.points),
      }));
    }

    if (constructors.length > 0) {
      constructorStandings = constructors.slice(0, 5).map((c) => ({
        position: Number(c.position),
        name: c.Constructor.name,
        teamId: c.Constructor.constructorId,
        points: Number(c.points),
      }));
    }
  } catch {
    // Use static fallback data defined above
  }

  return (
    <>
      <Hero />
      <div className="space-y-0">
        <NextRaceCountdown />
        <ChampionshipSnapshot
          driverStandings={driverStandings}
          constructorStandings={constructorStandings}
        />
        <SeasonCalendarStrip />
        <StatsRow />
      </div>
    </>
  );
}
