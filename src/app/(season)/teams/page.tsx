import type { Metadata } from "next";
import Link from "next/link";
import { getConstructorStandings } from "@/lib/api/jolpica";
import { TEAM_LIST, TEAMS } from "@/lib/constants";
import { DRIVERS } from "@/lib/constants/drivers";
import { PageTransition } from "@/components/layout/page-transition";
import { SectionHeader } from "@/components/shared/section-header";
import { TeamsGrid } from "./teams-grid";

export const metadata: Metadata = {
  title: "Teams — GridLock F1 2026",
  description: "All 11 teams competing in the 2026 Formula 1 season",
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

export default async function TeamsPage() {
  let constructorStandings: Awaited<ReturnType<typeof getConstructorStandings>> = [];

  try {
    constructorStandings = await getConstructorStandings("2026");
  } catch {
    // Fall back to static teams list if API is unavailable.
  }

  const standingsByTeam = new Map<string, { position: number; points: number }>();

  constructorStandings.forEach((standing) => {
    const teamId = mapConstructorToTeamId(
      standing.Constructor.constructorId,
      standing.Constructor.name
    );
    if (!teamId) return;

    standingsByTeam.set(teamId, {
      position: Number.parseInt(standing.position, 10),
      points: Number.parseFloat(standing.points),
    });
  });

  const sortedTeams = [...TEAM_LIST].sort((a, b) => {
    const aStanding = standingsByTeam.get(a.id);
    const bStanding = standingsByTeam.get(b.id);

    if (aStanding && bStanding) return aStanding.position - bStanding.position;
    if (aStanding) return -1;
    if (bStanding) return 1;
    return 0;
  });

  return (
    <PageTransition>
      <SectionHeader title="Teams" subtitle="Constructor Championship" />

      <TeamsGrid>
        {sortedTeams.map((team) => {
          const standing = standingsByTeam.get(team.id);
          const teamDrivers = team.drivers.map((driverId) => DRIVERS[driverId]);

          return (
            <Link key={team.id} href={`/teams/${team.slug}`}>
              <article
                data-animate="team-card"
                className="group h-full overflow-hidden rounded-xl border border-border-subtle bg-bg-secondary p-5 transition-all duration-200 hover:-translate-y-1"
                style={{
                  backgroundImage: `linear-gradient(160deg, ${team.color}30 0%, ${team.color}08 40%, transparent 70%)`,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-text-muted">Constructor</p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-text-primary">{team.name}</h2>
                    <p className="mt-1 text-sm text-text-secondary">{team.fullName}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs uppercase tracking-widest text-text-muted">Championship</p>
                    <p className="mt-1 font-mono text-xl font-bold text-text-primary">
                      {standing ? `P${standing.position}` : "\u2014"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {teamDrivers.map((driver) => (
                    <span
                      key={driver.id}
                      className="rounded-full border border-border-subtle bg-bg-tertiary px-3 py-1 text-xs text-text-secondary"
                    >
                      {driver.firstName} {driver.lastName}
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-text-muted">Points</span>
                  <span className="font-mono text-lg font-bold text-text-primary">
                    {standing ? standing.points.toFixed(1) : "\u2014"}
                  </span>
                </div>

                {/* Expandable extra info on hover */}
                <div className="mt-0 max-h-0 overflow-hidden transition-all duration-300 group-hover:mt-4 group-hover:max-h-20">
                  <div className="flex justify-between border-t border-border-subtle pt-3 text-xs text-text-muted">
                    <span>{team.engine} engine</span>
                    <span>{team.base}</span>
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </TeamsGrid>
    </PageTransition>
  );
}
