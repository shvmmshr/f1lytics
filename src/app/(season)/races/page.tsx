import type { Metadata } from "next";
import Link from "next/link";
import { CIRCUIT_LIST } from "@/lib/constants";
import { getRaceResults } from "@/lib/api/jolpica";
import { PageTransition } from "@/components/layout/page-transition";
import { SectionHeader } from "@/components/shared/section-header";

export const metadata: Metadata = {
  title: "Races",
  description: "All 24 rounds of the 2026 Formula 1 season with results",
};

function formatRaceDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

export default async function RacesPage() {
  let raceResults: Awaited<ReturnType<typeof getRaceResults>> = [];

  try {
    raceResults = await getRaceResults("2026");
  } catch {
    // Continue with static data if API is unavailable.
  }

  const winnerByRound = new Map<
    number,
    { name: string; constructor: string }
  >();
  raceResults.forEach((race) => {
    const round = Number.parseInt(race.round, 10);
    const winner = race.Results?.find((result) => result.position === "1");
    if (!winner) return;

    winnerByRound.set(round, {
      name: `${winner.Driver.givenName} ${winner.Driver.familyName}`,
      constructor: winner.Constructor.name,
    });
  });

  return (
    <PageTransition>
      <SectionHeader
        title="Races"
        subtitle="All 24 rounds of the 2026 Formula 1 season"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CIRCUIT_LIST.map((circuit) => {
          const isCancelled = circuit.cancelled === true;
          const winner = !isCancelled ? winnerByRound.get(circuit.round) : undefined;

          return (
            <Link key={circuit.id} href={`/races/${circuit.slug}`}>
              <article
                data-animate="race-card"
                className={`h-full rounded-xl border border-border-subtle bg-bg-secondary p-5 transition-all duration-200 hover:-translate-y-1${isCancelled ? " opacity-40" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
                      Round {circuit.round}
                    </p>
                    <h2 className={`mt-1 text-xl font-semibold text-text-primary${isCancelled ? " line-through" : ""}`}>
                      {circuit.fullName}
                    </h2>
                    <p className="mt-1 text-sm text-text-secondary">
                      {circuit.name} · {circuit.city}, {circuit.country}
                    </p>
                  </div>
                  {isCancelled ? (
                    <span className="inline-flex rounded-full bg-status-red/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-status-red">
                      Cancelled
                    </span>
                  ) : circuit.isSprint ? (
                    <span className="inline-flex rounded-full bg-status-yellow/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-status-yellow">
                      Sprint Weekend
                    </span>
                  ) : null}
                </div>

                {isCancelled ? (
                  <p className="mt-3 font-mono text-sm text-status-red">
                    This race has been cancelled
                  </p>
                ) : (
                  <div className="mt-3 font-mono text-sm text-text-secondary">
                    {circuit.isSprint && circuit.sprintDate && (
                      <p className="text-xs text-status-yellow">
                        Sprint: {formatRaceDate(circuit.sprintDate)}
                      </p>
                    )}
                    <p>Race: {formatRaceDate(circuit.raceDate)}</p>
                  </div>
                )}

                {winner && (
                  <div className="mt-3 rounded-lg border border-border-subtle bg-bg-tertiary px-3 py-2">
                    <p className="text-[10px] uppercase tracking-widest text-text-muted">
                      Winner
                    </p>
                    <p className="mt-1 text-sm font-semibold text-text-primary">
                      {winner.name}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {winner.constructor}
                    </p>
                  </div>
                )}
              </article>
            </Link>
          );
        })}
      </div>
    </PageTransition>
  );
}
