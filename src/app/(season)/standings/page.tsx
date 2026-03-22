import type { Metadata } from "next";
import { getConstructorStandings, getDriverStandings } from "@/lib/api/jolpica";
import { DRIVER_LIST, TEAM_LIST, TEAMS } from "@/lib/constants";
import { PageTransition } from "@/components/layout/page-transition";
import { SectionHeader } from "@/components/shared/section-header";
import { StandingsBar, type StandingsBarEntry } from "@/components/charts/standings-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Standings — F1lytics 2026",
  description: "Driver and constructor championship standings for the 2026 F1 season",
};

const CONSTRUCTOR_TO_TEAM: Record<string, string> = {
  mclaren: "mclaren",
  ferrari: "ferrari",
  red_bull: "red_bull",
  mercedes: "mercedes",
  aston_martin: "aston_martin",
  alpine: "alpine",
  williams: "williams",
  rb: "racing_bulls",
  racing_bulls: "racing_bulls",
  haas: "haas",
  sauber: "audi",
  kick_sauber: "audi",
  audi: "audi",
  cadillac: "cadillac",
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function mapConstructorToTeamId(constructorId: string, constructorName: string): string | undefined {
  const mappedId = CONSTRUCTOR_TO_TEAM[constructorId];
  if (mappedId && TEAMS[mappedId]) return mappedId;

  const normalizedName = normalize(constructorName);

  if (normalizedName.includes("racingbulls") || normalizedName === "rb") return "racing_bulls";
  if (normalizedName.includes("sauber")) return "audi";
  if (normalizedName.includes("redbull")) return "red_bull";

  const matchedTeam = TEAM_LIST.find((team) => {
    const teamName = normalize(team.name);
    const teamFullName = normalize(team.fullName);
    return (
      teamName === normalizedName ||
      teamFullName.includes(normalizedName) ||
      normalizedName.includes(teamName)
    );
  });

  return matchedTeam?.id;
}

export default async function StandingsPage() {
  let driverStandings: Awaited<ReturnType<typeof getDriverStandings>> = [];
  let constructorStandings: Awaited<ReturnType<typeof getConstructorStandings>> = [];

  try {
    [driverStandings, constructorStandings] = await Promise.all([
      getDriverStandings("2026"),
      getConstructorStandings("2026"),
    ]);
  } catch {
    // Keep page rendering with empty states when API is unavailable.
  }

  const driverEntries: StandingsBarEntry[] = driverStandings
    .map((standing) => {
      const code = standing.Driver.code?.toUpperCase();
      const localDriver = code
        ? DRIVER_LIST.find((driver) => driver.abbreviation === code)
        : undefined;
      const team = localDriver ? TEAMS[localDriver.teamId] : undefined;

      return {
        id: standing.Driver.driverId,
        label: `${standing.Driver.givenName} ${standing.Driver.familyName}`,
        sublabel: team?.name,
        position: Number.parseInt(standing.position, 10),
        points: Number.parseFloat(standing.points),
        wins: Number.parseInt(standing.wins, 10),
        color: team?.color ?? "#6B7280",
      };
    })
    .sort((a, b) => a.position - b.position);

  const constructorEntries: StandingsBarEntry[] = constructorStandings
    .map((standing) => {
      const teamId = mapConstructorToTeamId(
        standing.Constructor.constructorId,
        standing.Constructor.name
      );
      const team = teamId ? TEAMS[teamId] : undefined;

      return {
        id: standing.Constructor.constructorId,
        label: standing.Constructor.name,
        sublabel: team?.engine,
        position: Number.parseInt(standing.position, 10),
        points: Number.parseFloat(standing.points),
        wins: Number.parseInt(standing.wins, 10),
        color: team?.color ?? "#6B7280",
      };
    })
    .sort((a, b) => a.position - b.position);

  return (
    <PageTransition>
      <SectionHeader title="Standings" subtitle="2026 Championship Rankings" />

      <Tabs defaultValue="drivers" className="w-full">
        <TabsList className="bg-bg-tertiary p-1">
          <TabsTrigger value="drivers" className="data-[state=active]:bg-bg-secondary">
            Drivers
          </TabsTrigger>
          <TabsTrigger value="constructors" className="data-[state=active]:bg-bg-secondary">
            Constructors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="drivers" className="mt-4">
          <StandingsBar
            entries={driverEntries}
            emptyLabel="Driver standings will appear once race results are available. Try refreshing the page."
          />
        </TabsContent>

        <TabsContent value="constructors" className="mt-4">
          <StandingsBar
            entries={constructorEntries}
            emptyLabel="Constructor standings will appear once race results are available. Try refreshing the page."
          />
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}
