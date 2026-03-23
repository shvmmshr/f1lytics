import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRaceResults } from "@/lib/api/jolpica";
import { getLaps, getPositions, getRaceControl, getSessions, getStints } from "@/lib/api/openf1";
import { CIRCUIT_LIST, TEAMS, getCircuitBySlug } from "@/lib/constants";
import { PageTransition } from "@/components/layout/page-transition";
import { PositionBadge } from "@/components/shared/position-badge";
import { formatLapTime, positionChange } from "@/lib/utils";
import { PositionChart } from "@/components/charts/position-chart";
import { TireStrategyViz } from "@/components/charts/tire-strategy-viz";
import { LapTimeChart } from "@/components/charts/lap-time-chart";

interface RacePageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface OpenF1SessionCandidate {
  session_key: number;
  date_start: string;
  session_name: string;
  country_name: string;
  circuit_short_name: string;
}

export function generateStaticParams() {
  return CIRCUIT_LIST.map((circuit) => ({
    slug: circuit.slug,
  }));
}

export async function generateMetadata({ params }: RacePageProps): Promise<Metadata> {
  const { slug } = await params;
  const circuit = getCircuitBySlug(slug);

  if (!circuit) {
    return {
      title: "Not Found",
    };
  }

  return {
    title: `${circuit.fullName} Results`,
    description: `Race results, podium, and telemetry overview for the ${circuit.fullName}`,
  };
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function mapConstructorToTeamColor(constructorName: string): string {
  const normalizedConstructor = normalize(constructorName);

  const team = Object.values(TEAMS).find((candidate) => {
    const normalizedName = normalize(candidate.name);
    const normalizedFullName = normalize(candidate.fullName);
    return (
      normalizedConstructor === normalizedName ||
      normalizedFullName.includes(normalizedConstructor) ||
      normalizedConstructor.includes(normalizedName)
    );
  });

  return team?.color ?? "#6B7280";
}

function formatRaceDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

export default async function RacePage({ params }: RacePageProps) {
  const { slug } = await params;
  const circuit = getCircuitBySlug(slug);

  if (!circuit) notFound();

  const raceDate = new Date(`${circuit.raceDate}T00:00:00Z`);

  let race = null as Awaited<ReturnType<typeof getRaceResults>>[number] | null;
  let laps: Awaited<ReturnType<typeof getLaps>> = [];
  let stints: Awaited<ReturnType<typeof getStints>> = [];
  let positions: Awaited<ReturnType<typeof getPositions>> = [];
  let raceControl: Awaited<ReturnType<typeof getRaceControl>> = [];
  let matchedSession: OpenF1SessionCandidate | null = null;

  try {
    const raceResults = await getRaceResults("2026", String(circuit.round));
    race = raceResults[0] ?? null;
  } catch {
    // Keep rendering static race shell if Jolpica is unavailable.
  }

  try {
    const sessions = (await getSessions({
      year: 2026,
      session_name: "Race",
    })) as OpenF1SessionCandidate[];

    matchedSession =
      sessions
        .filter((session) => session.session_name.toLowerCase() === "race")
        .sort((a, b) => {
          const diffA = Math.abs(new Date(a.date_start).getTime() - raceDate.getTime());
          const diffB = Math.abs(new Date(b.date_start).getTime() - raceDate.getTime());
          return diffA - diffB;
        })[0] ?? null;

    if (matchedSession) {
      [laps, stints, positions, raceControl] = await Promise.all([
        getLaps({ session_key: matchedSession.session_key }),
        getStints({ session_key: matchedSession.session_key }),
        getPositions({ session_key: matchedSession.session_key }),
        getRaceControl({ session_key: matchedSession.session_key }),
      ]);
    }
  } catch {
    // OpenF1 data is optional for the initial race page implementation.
  }

  const results = race?.Results ?? [];
  const sortedResults = [...results].sort(
    (a, b) => Number.parseInt(a.position, 10) - Number.parseInt(b.position, 10)
  );
  const podium = sortedResults.slice(0, 3);

  const chartDrivers = sortedResults.map((result) => {
    const driverNumber = Number.parseInt(result.number, 10);
    const label = result.Driver.code ?? result.Driver.familyName.slice(0, 3).toUpperCase();
    const color = mapConstructorToTeamColor(result.Constructor.name);
    const normalizedConstructor = normalize(result.Constructor.name);
    const teamEntry = Object.entries(TEAMS).find(([, team]) => {
      const normalizedName = normalize(team.name);
      const normalizedFullName = normalize(team.fullName);
      return (
        normalizedConstructor === normalizedName ||
        normalizedFullName.includes(normalizedConstructor) ||
        normalizedConstructor.includes(normalizedName)
      );
    });
    const teamId = teamEntry?.[0];

    return { driverNumber, label, color, teamId };
  });

  const fastestLapDuration =
    laps.length > 0
      ? laps.reduce((best, lap) => {
          if (lap.lap_duration === null) return best;
          if (best === null) return lap.lap_duration;
          return Math.min(best, lap.lap_duration);
        }, null as number | null)
      : null;

  const openF1Drivers = new Set(laps.map((lap) => lap.driver_number)).size;

  return (
    <PageTransition>
      <section className="mb-8 rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-text-muted">Round {circuit.round}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-display text-text-primary">{circuit.fullName}</h1>
        <p className="mt-2 text-text-secondary">
          {circuit.name} · {circuit.city}, {circuit.country}
        </p>
        <p className="mt-1 text-sm text-text-muted">{formatRaceDate(circuit.raceDate)}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Podium</h2>
        {podium.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {podium.map((result, index) => {
              const color = mapConstructorToTeamColor(result.Constructor.name);
              const position = Number.parseInt(result.position, 10);
              return (
                <article
                  key={result.Driver.driverId}
                  className="animate-in fade-in slide-in-from-bottom-2 rounded-xl border border-border-subtle bg-bg-secondary p-5 duration-300"
                  style={{
                    animationDelay: `${index * 120}ms`,
                    boxShadow: `inset 4px 0 0 0 ${color}`,
                  }}
                >
                  <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
                    Position {position}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-text-primary">
                    {result.Driver.givenName} {result.Driver.familyName}
                  </h3>
                  <p className="mt-1 text-sm text-text-secondary">{result.Constructor.name}</p>
                  <p className="mt-3 font-mono text-lg font-bold text-text-primary">
                    {Number.parseFloat(result.points).toFixed(1)} PTS
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm text-text-muted">Podium data will appear when race results are available.</p>
        )}
      </section>

      <section className="mb-8 rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Full Results</h2>
          <p className="text-xs uppercase tracking-widest text-text-muted">
            {results.length > 0 ? `${results.length} classified drivers` : "No race results yet"}
          </p>
        </div>

        {results.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border-subtle text-xs uppercase tracking-widest text-text-muted">
                  <th className="px-3 py-2">Pos</th>
                  <th className="px-3 py-2">Driver</th>
                  <th className="px-3 py-2">Team</th>
                  <th className="px-3 py-2">Grid</th>
                  <th className="px-3 py-2">Change</th>
                  <th className="px-3 py-2">Gap / Time</th>
                  <th className="px-3 py-2">Points</th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((result) => {
                  const position = Number.parseInt(result.position, 10);
                  const grid = Number.parseInt(result.grid, 10);
                  const change = Number.isNaN(grid) ? undefined : positionChange(grid, position);
                  const isLeader = position === 1;

                  return (
                    <tr
                      key={`${result.Driver.driverId}-${result.position}`}
                      className="border-b border-border-subtle text-sm text-text-secondary"
                    >
                      <td className="px-3 py-3">
                        <PositionBadge position={position} />
                      </td>
                      <td className="px-3 py-3 text-text-primary">
                        {result.Driver.givenName} {result.Driver.familyName}
                      </td>
                      <td className="px-3 py-3">{result.Constructor.name}</td>
                      <td className="px-3 py-3 font-mono">{Number.isNaN(grid) ? "—" : grid}</td>
                      <td className="px-3 py-3">
                        {change !== undefined ? (
                          <PositionBadge position={position} change={change} />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-3 font-mono">
                        {isLeader ? "LEADER" : result.Time?.time ?? result.status}
                      </td>
                      <td className="px-3 py-3 font-mono text-text-primary">
                        {Number.parseFloat(result.points).toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-text-muted">Results table will populate after this race is completed.</p>
        )}
      </section>

      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-border-subtle bg-bg-secondary p-4">
          <p className="text-xs uppercase tracking-widest text-text-muted">OpenF1 Session</p>
          <p className="mt-2 font-mono text-lg text-text-primary">
            {matchedSession ? matchedSession.session_key : "Not matched"}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {matchedSession
              ? `${matchedSession.country_name} · ${matchedSession.circuit_short_name}`
              : "Waiting for synchronized session metadata"}
          </p>
        </article>
        <article className="rounded-xl border border-border-subtle bg-bg-secondary p-4">
          <p className="text-xs uppercase tracking-widest text-text-muted">Lap Samples</p>
          <p className="mt-2 font-mono text-lg text-text-primary">{laps.length}</p>
          <p className="mt-1 text-xs text-text-muted">
            {openF1Drivers > 0 ? `${openF1Drivers} drivers with lap data` : "No lap telemetry yet"}
          </p>
        </article>
        <article className="rounded-xl border border-border-subtle bg-bg-secondary p-4">
          <p className="text-xs uppercase tracking-widest text-text-muted">Tyre Stints</p>
          <p className="mt-2 font-mono text-lg text-text-primary">{stints.length}</p>
          <p className="mt-1 text-xs text-text-muted">
            Fastest lap from OpenF1: {formatLapTime(fastestLapDuration)}
          </p>
        </article>
      </section>

      <section className="space-y-8">
        <div>
          <h3 className="mb-4 text-lg font-semibold text-text-primary">Position Changes</h3>
          <PositionChart positions={positions} drivers={chartDrivers} />
        </div>
        <div>
          <h3 className="mb-4 text-lg font-semibold text-text-primary">Tire Strategy</h3>
          <TireStrategyViz stints={stints} drivers={chartDrivers} />
        </div>
        <div>
          <h3 className="mb-4 text-lg font-semibold text-text-primary">Lap Times</h3>
          <LapTimeChart laps={laps} drivers={chartDrivers} raceControl={raceControl} />
        </div>
      </section>
    </PageTransition>
  );
}
