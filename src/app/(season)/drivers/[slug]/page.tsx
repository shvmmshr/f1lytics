import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRaceResults, getDriverStandings } from "@/lib/api/jolpica";
import { DRIVER_LIST, getDriverBySlug, TEAMS } from "@/lib/constants";
import { PageTransition } from "@/components/layout/page-transition";
import { StatCard } from "@/components/shared/stat-card";
import { TeamBadge } from "@/components/shared/team-badge";

interface DriverProfilePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export function generateStaticParams() {
  return DRIVER_LIST.map((driver) => ({
    slug: driver.slug,
  }));
}

export async function generateMetadata({
  params,
}: DriverProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const driver = getDriverBySlug(slug);

  if (!driver) {
    return {
      title: "Driver Not Found — GridLock F1 2026",
    };
  }

  return {
    title: `${driver.firstName} ${driver.lastName} — GridLock F1 2026`,
    description: `${driver.firstName} ${driver.lastName} driver profile, stats, and season results`,
  };
}

export default async function DriverProfilePage({ params }: DriverProfilePageProps) {
  const { slug } = await params;
  const driver = getDriverBySlug(slug);

  if (!driver) notFound();

  const team = TEAMS[driver.teamId];

  let raceResults: Awaited<ReturnType<typeof getRaceResults>> = [];
  let standings: Awaited<ReturnType<typeof getDriverStandings>> = [];

  try {
    [raceResults, standings] = await Promise.all([
      getRaceResults("2026"),
      getDriverStandings("2026"),
    ]);
  } catch {
    // Render static profile data when APIs are unavailable.
  }

  const driverStanding = standings.find(
    (standing) => standing.Driver.code?.toUpperCase() === driver.abbreviation
  );

  const teammate = DRIVER_LIST.find(
    (candidate) => candidate.teamId === driver.teamId && candidate.id !== driver.id
  );
  const teammateStanding = teammate
    ? standings.find(
        (standing) => standing.Driver.code?.toUpperCase() === teammate.abbreviation
      )
    : undefined;

  const driverRaceResults = raceResults
    .map((race) => {
      const result = race.Results?.find(
        (entry) => entry.Driver.code?.toUpperCase() === driver.abbreviation
      );
      if (!result) return null;

      return {
        round: Number.parseInt(race.round, 10),
        raceName: race.raceName,
        position: Number.parseInt(result.position, 10),
        points: Number.parseFloat(result.points),
      };
    })
    .filter((result): result is NonNullable<typeof result> => result !== null);

  const racesEntered = driverRaceResults.length;
  const wins = driverRaceResults.filter((result) => result.position === 1).length;
  const podiums = driverRaceResults.filter((result) => result.position <= 3).length;
  const totalPoints = driverStanding ? Number.parseFloat(driverStanding.points) : 0;
  const averageFinish =
    racesEntered > 0
      ? Math.round(
          (driverRaceResults.reduce((sum, result) => sum + result.position, 0) / racesEntered) *
            10
        ) / 10
      : 0;

  return (
    <PageTransition>
      <section
        className="mb-8 overflow-hidden rounded-2xl border border-border-subtle bg-bg-secondary p-6"
        style={{
          boxShadow: `inset 4px 0 0 0 ${team.color}`,
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="font-mono text-sm uppercase tracking-widest text-text-muted">
              Driver Profile
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-display text-text-primary">
              {driver.firstName} {driver.lastName}
            </h1>
            <p className="mt-2 text-text-secondary">
              #{driver.number} · {driver.abbreviation} · {driver.nationality}
            </p>
            <div className="mt-4">
              <TeamBadge team={team} />
            </div>
          </div>

          <div className="rounded-xl border border-border-subtle bg-bg-tertiary px-6 py-5 text-center">
            <p className="text-xs uppercase tracking-widest text-text-muted">Championship</p>
            <p className="mt-2 font-mono text-4xl font-bold text-text-primary">
              {driverStanding ? `P${driverStanding.position}` : "—"}
            </p>
          </div>
        </div>
      </section>

      <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Points" value={Math.round(totalPoints)} />
        <StatCard label="Wins" value={wins} />
        <StatCard label="Podiums" value={podiums} />
        <StatCard label="Races" value={racesEntered} />
        <StatCard label="Avg Finish" value={Math.round(averageFinish)} />
      </section>

      <section className="mb-8 rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <h2 className="text-xl font-semibold tracking-tight text-text-primary">Position Trend</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Interactive race-by-race position chart will be enabled in the Phase 6 chart tasks.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {driverRaceResults.slice(0, 12).map((result) => (
            <div
              key={`${result.round}-${result.raceName}`}
              className="rounded-lg border border-border-subtle bg-bg-tertiary p-3"
            >
              <p className="text-[10px] uppercase tracking-widest text-text-muted">R{result.round}</p>
              <p className="mt-1 font-mono text-lg font-bold text-text-primary">P{result.position}</p>
              <p className="mt-1 text-xs text-text-secondary">{result.raceName}</p>
            </div>
          ))}
          {driverRaceResults.length === 0 && (
            <p className="text-sm text-text-muted">No race results available yet for 2026.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <h2 className="text-xl font-semibold tracking-tight text-text-primary">Teammate Comparison</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Same-team comparison snapshot for the current season.
        </p>

        {teammate ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border-subtle bg-bg-tertiary p-4">
              <p className="text-sm text-text-secondary">{driver.firstName} {driver.lastName}</p>
              <p className="mt-2 font-mono text-2xl font-bold text-text-primary">
                {driverStanding ? `${driverStanding.points} PTS` : "—"}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {driverStanding ? `P${driverStanding.position} in championship` : "No standing available"}
              </p>
            </div>

            <div className="rounded-lg border border-border-subtle bg-bg-tertiary p-4">
              <p className="text-sm text-text-secondary">{teammate.firstName} {teammate.lastName}</p>
              <p className="mt-2 font-mono text-2xl font-bold text-text-primary">
                {teammateStanding ? `${teammateStanding.points} PTS` : "—"}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {teammateStanding
                  ? `P${teammateStanding.position} in championship`
                  : "No standing available"}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-text-muted">No teammate data available.</p>
        )}
      </section>
    </PageTransition>
  );
}
