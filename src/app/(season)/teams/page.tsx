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
        {(() => {
          const maxPoints = Math.max(
            ...sortedTeams.map((t) => standingsByTeam.get(t.id)?.points ?? 0),
            1
          );

          return sortedTeams.map((team) => {
            const standing = standingsByTeam.get(team.id);
            const teamDrivers = team.drivers.map((driverId) => DRIVERS[driverId]);
            const barPct = standing ? (standing.points / maxPoints) * 100 : 0;
            const isPodium = standing !== undefined && standing.position <= 3;

            return (
              <Link key={team.id} href={`/teams/${team.slug}`}>
                <article
                  data-animate="team-card"
                  className="group relative overflow-hidden rounded-xl border border-border-subtle bg-bg-secondary transition-all duration-300 hover:border-transparent hover:shadow-lg"
                >
                  {/* Left accent stripe */}
                  <div
                    className="absolute inset-y-0 left-0 w-1"
                    style={{ backgroundColor: team.color }}
                  />

                  {/* Background gradient wash */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.04] transition-opacity duration-300 group-hover:opacity-[0.08]"
                    style={{
                      background: `linear-gradient(135deg, ${team.color}, transparent 60%)`,
                    }}
                  />

                  <div className="relative flex items-center gap-5 py-5 pl-6 pr-5">
                    {/* Position */}
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg font-mono text-xl font-bold"
                      style={{
                        backgroundColor: isPodium ? team.color + "20" : undefined,
                        color: isPodium ? team.color : "var(--color-text-muted)",
                        border: isPodium
                          ? `1px solid ${team.color}40`
                          : "1px solid var(--color-border-subtle)",
                      }}
                    >
                      {standing ? standing.position : "-"}
                    </div>

                    {/* Team logo */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                      <Image
                        src={team.logo}
                        alt={team.name}
                        width={40}
                        height={40}
                        className="object-contain opacity-70 transition-opacity group-hover:opacity-100"
                        unoptimized
                      />
                    </div>

                    {/* Team info */}
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-bold tracking-tight text-text-primary">
                        {team.name}
                      </h2>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {teamDrivers.map((driver) => (
                          <span
                            key={driver.id}
                            className="rounded-md border border-border-subtle bg-bg-primary/50 px-2 py-0.5 text-xs text-text-secondary"
                          >
                            {driver.firstName[0]}. {driver.lastName}
                          </span>
                        ))}
                        <span className="hidden items-center gap-1 text-xs text-text-muted sm:flex">
                          {team.engine}
                        </span>
                      </div>
                    </div>

                    {/* Points + bar */}
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      {standing ? (
                        <>
                          <div className="text-right">
                            <span className="font-mono text-2xl font-bold text-text-primary">
                              {standing.points % 1 === 0
                                ? standing.points
                                : standing.points.toFixed(1)}
                            </span>
                            <span className="ml-1 text-[10px] uppercase tracking-widest text-text-muted">
                              PTS
                            </span>
                          </div>
                          {/* Mini points bar */}
                          <div className="h-1 w-24 overflow-hidden rounded-full bg-bg-tertiary">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${barPct}%`,
                                backgroundColor: team.color,
                              }}
                            />
                          </div>
                        </>
                      ) : (
                        <span className="font-mono text-sm text-text-muted">&mdash;</span>
                      )}
                    </div>
                  </div>

                  {/* Bottom hover glow */}
                  <div
                    className="absolute inset-x-0 bottom-0 h-16 translate-y-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
                    style={{
                      background: `linear-gradient(to top, ${team.color}10, transparent)`,
                    }}
                  />
                </article>
              </Link>
            );
          });
        })()}
      </TeamsGrid>
    </PageTransition>
  );
}
