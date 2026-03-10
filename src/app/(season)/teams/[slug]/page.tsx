import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getConstructorStandings, getDriverStandings, getRaceResults } from "@/lib/api/jolpica";
import { TEAM_LIST, TEAMS, getTeamBySlug } from "@/lib/constants";
import { DRIVERS, type Driver } from "@/lib/constants/drivers";
import { PageTransition } from "@/components/layout/page-transition";
import { DriverCard } from "@/components/shared/driver-card";
import { TeamBadge } from "@/components/shared/team-badge";

interface TeamPageProps {
  params: Promise<{
    slug: string;
  }>;
}

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

export function generateStaticParams() {
  return TEAM_LIST.map((team) => ({
    slug: team.slug,
  }));
}

export async function generateMetadata({ params }: TeamPageProps): Promise<Metadata> {
  const { slug } = await params;
  const team = getTeamBySlug(slug);

  if (!team) {
    return {
      title: "Team Not Found — GridLock F1 2026",
    };
  }

  return {
    title: `${team.name} — GridLock F1 2026`,
    description: `${team.fullName} team profile, drivers, and season results`,
  };
}

interface TeamRaceSummary {
  round: number;
  raceName: string;
  date: string;
  bestFinish: number | null;
  racePoints: number;
  cumulativePoints: number;
}

function getTeamDrivers(teamDriverIds: [string, string]): Driver[] {
  return teamDriverIds
    .map((driverId) => DRIVERS[driverId])
    .filter((driver): driver is Driver => Boolean(driver));
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { slug } = await params;
  const team = getTeamBySlug(slug);

  if (!team) notFound();

  const teamDrivers = getTeamDrivers(team.drivers);
  const driverCodeSet = new Set(teamDrivers.map((driver) => driver.abbreviation));

  let constructorStandings: Awaited<ReturnType<typeof getConstructorStandings>> = [];
  let driverStandings: Awaited<ReturnType<typeof getDriverStandings>> = [];
  let raceResults: Awaited<ReturnType<typeof getRaceResults>> = [];

  try {
    [constructorStandings, driverStandings, raceResults] = await Promise.all([
      getConstructorStandings("2026"),
      getDriverStandings("2026"),
      getRaceResults("2026"),
    ]);
  } catch {
    // Render static profile details when APIs are unavailable.
  }

  const constructorStanding = constructorStandings.find((standing) => {
    return (
      mapConstructorToTeamId(standing.Constructor.constructorId, standing.Constructor.name) ===
      team.id
    );
  });

  const driverStandingMap = new Map<
    string,
    {
      points: number;
      position: number;
    }
  >();

  driverStandings.forEach((standing) => {
    const code = standing.Driver.code?.toUpperCase();
    if (!code) return;

    driverStandingMap.set(code, {
      points: Number.parseFloat(standing.points),
      position: Number.parseInt(standing.position, 10),
    });
  });

  const raceSummariesRaw = raceResults
    .map((race) => {
      const teamEntries = (race.Results ?? []).filter((entry) => {
        const mappedTeamId = mapConstructorToTeamId(
          entry.Constructor.constructorId,
          entry.Constructor.name
        );
        if (mappedTeamId === team.id) return true;

        const code = entry.Driver.code?.toUpperCase();
        return Boolean(code && driverCodeSet.has(code));
      });

      if (teamEntries.length === 0) return null;

      const bestFinish = teamEntries.reduce((best, entry) => {
        const position = Number.parseInt(entry.position, 10);
        return Number.isNaN(position) ? best : Math.min(best, position);
      }, Number.POSITIVE_INFINITY);

      const racePoints = teamEntries.reduce((sum, entry) => {
        const points = Number.parseFloat(entry.points);
        return sum + (Number.isNaN(points) ? 0 : points);
      }, 0);

      return {
        round: Number.parseInt(race.round, 10),
        raceName: race.raceName,
        date: race.date,
        bestFinish: Number.isFinite(bestFinish) ? bestFinish : null,
        racePoints,
      };
    })
    .filter((summary): summary is NonNullable<typeof summary> => summary !== null)
    .sort((a, b) => a.round - b.round);

  const raceSummaries: TeamRaceSummary[] = raceSummariesRaw.reduce<TeamRaceSummary[]>(
    (summaries, summary) => {
      const previousTotal = summaries[summaries.length - 1]?.cumulativePoints ?? 0;
      const cumulativePoints = Math.round((previousTotal + summary.racePoints) * 10) / 10;

      return [
        ...summaries,
        {
          ...summary,
          cumulativePoints,
        },
      ];
    },
    []
  );

  const maxCumulative = raceSummaries[raceSummaries.length - 1]?.cumulativePoints ?? 0;

  return (
    <PageTransition>
      <section
        className="mb-8 overflow-hidden rounded-2xl border border-[hsl(var(--border-subtle))] p-6"
        style={{
          backgroundImage: `linear-gradient(135deg, ${team.color}1F 0%, transparent 62%)`,
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="font-mono text-sm uppercase tracking-widest text-text-muted">
              Team Profile
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-display text-text-primary">
              {team.name}
            </h1>
            <p className="mt-2 text-text-secondary">{team.fullName}</p>
            <div className="mt-4">
              <TeamBadge team={team} size="lg" />
            </div>
          </div>

          <div className="rounded-xl border border-[hsl(var(--border-subtle))] bg-bg-tertiary px-6 py-5 text-right">
            <p className="text-xs uppercase tracking-widest text-text-muted">Championship</p>
            <p className="mt-2 font-mono text-4xl font-bold text-text-primary">
              {constructorStanding ? `P${constructorStanding.position}` : "—"}
            </p>
            <p className="mt-1 font-mono text-sm text-text-secondary">
              {constructorStanding ? `${constructorStanding.points} PTS` : "No data"}
            </p>
          </div>
        </div>
      </section>

      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-[hsl(var(--border-subtle))] bg-surface-secondary p-4">
          <p className="text-xs uppercase tracking-widest text-text-muted">Engine</p>
          <p className="mt-2 text-lg font-semibold text-text-primary">{team.engine}</p>
        </article>
        <article className="rounded-xl border border-[hsl(var(--border-subtle))] bg-surface-secondary p-4">
          <p className="text-xs uppercase tracking-widest text-text-muted">Base</p>
          <p className="mt-2 text-lg font-semibold text-text-primary">{team.base}</p>
        </article>
        <article className="rounded-xl border border-[hsl(var(--border-subtle))] bg-surface-secondary p-4">
          <p className="text-xs uppercase tracking-widest text-text-muted">Team Principal</p>
          <p className="mt-2 text-lg font-semibold text-text-primary">{team.principal}</p>
        </article>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Drivers</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {teamDrivers.map((driver) => {
            const standing = driverStandingMap.get(driver.abbreviation);
            return (
              <DriverCard
                key={driver.id}
                driver={driver}
                points={standing?.points}
                position={standing?.position}
              />
            );
          })}
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-[hsl(var(--border-subtle))] bg-surface-secondary p-6">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Points Progression</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Race-by-race constructor points accumulation through the 2026 season.
        </p>

        {raceSummaries.length > 0 ? (
          <div className="mt-5 space-y-3">
            {raceSummaries.map((summary) => {
              const widthPercent =
                maxCumulative > 0 ? Math.max((summary.cumulativePoints / maxCumulative) * 100, 3) : 0;

              return (
                <div key={`${summary.round}-${summary.raceName}`}>
                  <div className="mb-1 flex items-center justify-between text-xs text-text-secondary">
                    <span>
                      R{summary.round} · {summary.raceName}
                    </span>
                    <span className="font-mono">{summary.cumulativePoints.toFixed(1)} PTS</span>
                  </div>
                  <div className="h-2 rounded-full bg-bg-tertiary">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${widthPercent}%`,
                        backgroundColor: team.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm text-text-muted">No race data available yet for this team in 2026.</p>
        )}
      </section>

      <section className="rounded-2xl border border-[hsl(var(--border-subtle))] bg-surface-secondary p-6">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Season Results</h2>
        <p className="mt-2 text-sm text-text-secondary">Per-race result summary for both team cars.</p>

        {raceSummaries.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[hsl(var(--border-subtle))] text-xs uppercase tracking-widest text-text-muted">
                  <th className="px-3 py-2">Round</th>
                  <th className="px-3 py-2">Race</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Best Finish</th>
                  <th className="px-3 py-2">Race Pts</th>
                  <th className="px-3 py-2">Total Pts</th>
                </tr>
              </thead>
              <tbody>
                {raceSummaries.map((summary) => (
                  <tr
                    key={`table-${summary.round}-${summary.raceName}`}
                    className="border-b border-[hsl(var(--border-subtle))] text-sm text-text-secondary"
                  >
                    <td className="px-3 py-3 font-mono text-text-primary">{summary.round}</td>
                    <td className="px-3 py-3">{summary.raceName}</td>
                    <td className="px-3 py-3 font-mono">{summary.date}</td>
                    <td className="px-3 py-3 font-mono">
                      {summary.bestFinish ? `P${summary.bestFinish}` : "—"}
                    </td>
                    <td className="px-3 py-3 font-mono">{summary.racePoints.toFixed(1)}</td>
                    <td className="px-3 py-3 font-mono text-text-primary">
                      {summary.cumulativePoints.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-text-muted">Season results will appear after races are available.</p>
        )}
      </section>
    </PageTransition>
  );
}
