import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getConstructorStandings } from "@/lib/api/jolpica";
import { TEAM_LIST, TEAMS } from "@/lib/constants";
import { DRIVERS } from "@/lib/constants/drivers";
import { PageTransition } from "@/components/layout/page-transition";
import { SectionHeader } from "@/components/shared/section-header";
import { TeamsGrid } from "./teams-grid";

export const metadata: Metadata = {
  title: "Teams",
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

    const pos = Number.parseInt(standing.position, 10);
    const pts = Number.parseFloat(standing.points) || 0;
    if (!Number.isNaN(pos)) {
      standingsByTeam.set(teamId, { position: pos, points: pts });
    }
  });

  const sortedTeams = [...TEAM_LIST].sort((a, b) => {
    const aStanding = standingsByTeam.get(a.id);
    const bStanding = standingsByTeam.get(b.id);

    if (aStanding && bStanding) return aStanding.position - bStanding.position;
    if (aStanding) return -1;
    if (bStanding) return 1;
    return 0;
  });

  const maxPoints = Math.max(
    ...sortedTeams.map((t) => standingsByTeam.get(t.id)?.points ?? 0),
    1
  );

  return (
    <PageTransition>
      <SectionHeader title="Teams" subtitle="Constructor Championship 2026" />

      <TeamsGrid>
        {sortedTeams.map((team) => {
          const standing = standingsByTeam.get(team.id);
          const teamDrivers = team.drivers.map((driverId) => DRIVERS[driverId]);
          const barPct = standing ? (standing.points / maxPoints) * 100 : 0;
          const isPodium = standing !== undefined && standing.position <= 3;

          return (
            <Link key={team.id} href={`/teams/${team.slug}`}>
              <article className="group relative overflow-hidden rounded-xl border border-border-subtle bg-bg-secondary transition-colors duration-200 hover:bg-bg-tertiary">
                {/* Top team color accent */}
                <div className="absolute inset-x-0 top-0 h-0.5" style={{ backgroundColor: team.color }} />

                <div className="p-4">
                  {/* Header row: position + logo + name + points */}
                  <div className="flex items-center gap-3">
                    {/* Position badge */}
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold"
                      style={{
                        backgroundColor: isPodium ? team.color + "20" : "var(--color-bg-tertiary)",
                        color: isPodium ? team.color : "var(--color-text-muted)",
                      }}
                    >
                      {standing ? standing.position : "-"}
                    </div>

                    {/* Team logo */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                      <Image
                        src={team.logo}
                        alt={team.name}
                        width={28}
                        height={28}
                        className="object-contain opacity-70 group-hover:opacity-100"
                        unoptimized
                      />
                    </div>

                    {/* Team name */}
                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm font-bold tracking-tight text-text-primary">{team.name}</h2>
                      <p className="truncate text-[10px] text-text-muted">{team.engine}</p>
                    </div>

                    {/* Points */}
                    <div className="shrink-0 text-right">
                      <span className="font-mono text-lg font-bold text-text-primary">
                        {standing ? (standing.points % 1 === 0 ? standing.points : standing.points.toFixed(1)) : "—"}
                      </span>
                      <span className="ml-1 text-[9px] text-text-muted">pts</span>
                    </div>
                  </div>

                  {/* Points bar */}
                  {standing && (
                    <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-bg-tertiary">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${barPct}%`, backgroundColor: team.color }}
                      />
                    </div>
                  )}

                  {/* Drivers row */}
                  <div className="mt-3 flex gap-2">
                    {teamDrivers.map((d) => (
                      <div key={d.id} className="flex flex-1 items-center gap-2 rounded-lg bg-bg-tertiary/50 p-2">
                        <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-border-subtle bg-bg-primary">
                          <Image
                            src={d.image}
                            alt={`${d.firstName} ${d.lastName}`}
                            fill
                            className="object-cover object-top"
                            unoptimized
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-text-primary">{d.lastName}</p>
                          <p className="text-[10px] text-text-muted">#{d.number}</p>
                        </div>
                      </div>
                    ))}
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
