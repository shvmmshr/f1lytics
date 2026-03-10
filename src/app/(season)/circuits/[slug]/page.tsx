import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRaceResults } from "@/lib/api/jolpica";
import { CIRCUIT_LIST, getCircuitBySlug } from "@/lib/constants";
import { PageTransition } from "@/components/layout/page-transition";

interface CircuitPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export function generateStaticParams() {
  return CIRCUIT_LIST.map((circuit) => ({
    slug: circuit.slug,
  }));
}

export async function generateMetadata({ params }: CircuitPageProps): Promise<Metadata> {
  const { slug } = await params;
  const circuit = getCircuitBySlug(slug);

  if (!circuit) {
    return {
      title: "Circuit Not Found — GridLock F1 2026",
    };
  }

  return {
    title: `${circuit.name} — GridLock F1 2026`,
    description: `${circuit.fullName} circuit stats, schedule, and track information`,
  };
}

function formatRaceDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

function countryCodeToFlag(countryCode: string): string {
  if (!/^[A-Za-z]{2}$/.test(countryCode)) return "🏁";
  return countryCode
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

export default async function CircuitPage({ params }: CircuitPageProps) {
  const { slug } = await params;
  const circuit = getCircuitBySlug(slug);

  if (!circuit) notFound();

  let lastWinner: string | null = null;

  try {
    const raceResults = await getRaceResults("2026", String(circuit.round));
    const race = raceResults[0];
    const winner = race?.Results?.find((result) => result.position === "1");
    if (winner) {
      lastWinner = `${winner.Driver.givenName} ${winner.Driver.familyName}`;
    }
  } catch {
    // No winner data yet for this round.
  }

  return (
    <PageTransition>
      <section className="mb-8 rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-text-muted">Round {circuit.round}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-display text-text-primary">{circuit.name}</h1>
        <p className="mt-2 text-text-secondary">{circuit.fullName}</p>
        <p className="mt-3 text-sm text-text-secondary">
          {countryCodeToFlag(circuit.countryCode)} {circuit.city}, {circuit.country}
        </p>
      </section>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-border-subtle bg-bg-secondary p-4">
          <p className="text-xs uppercase tracking-widest text-text-muted">Race Date</p>
          <p className="mt-2 text-lg font-semibold text-text-primary">{formatRaceDate(circuit.raceDate)}</p>
          {circuit.isSprint && circuit.sprintDate && (
            <p className="mt-1 text-xs text-status-yellow">Sprint: {formatRaceDate(circuit.sprintDate)}</p>
          )}
        </article>
        <article className="rounded-xl border border-border-subtle bg-bg-secondary p-4">
          <p className="text-xs uppercase tracking-widest text-text-muted">Length</p>
          <p className="mt-2 font-mono text-lg font-semibold text-text-primary">
            {circuit.length.toFixed(3)} km
          </p>
        </article>
        <article className="rounded-xl border border-border-subtle bg-bg-secondary p-4">
          <p className="text-xs uppercase tracking-widest text-text-muted">Turns</p>
          <p className="mt-2 font-mono text-lg font-semibold text-text-primary">{circuit.turns}</p>
        </article>
        <article className="rounded-xl border border-border-subtle bg-bg-secondary p-4">
          <p className="text-xs uppercase tracking-widest text-text-muted">Lap Record</p>
          <p className="mt-2 font-mono text-lg font-semibold text-text-primary">{circuit.lapRecord}</p>
          <p className="mt-1 text-xs text-text-muted">{circuit.lapRecordHolder}</p>
        </article>
      </section>

      <section className="mb-8 rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Race Snapshot</h2>
        <p className="mt-2 text-text-secondary">
          {lastWinner
            ? `Latest winner for Round ${circuit.round}: ${lastWinner}`
            : "Winner data will appear once race results are available."}
        </p>
        {circuit.isSprint && (
          <span className="mt-4 inline-flex rounded-full bg-status-yellow/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-status-yellow">
            Sprint Weekend
          </span>
        )}
      </section>

      <section className="rounded-2xl border border-dashed border-border-subtle bg-bg-tertiary p-8">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">3D Track Scene</h2>
        <p className="mt-3 max-w-2xl text-text-secondary">
          Interactive 3D circuit rendering placeholder. This section will be replaced in Phase 7
          with the React Three Fiber track scene implementation.
        </p>
      </section>
    </PageTransition>
  );
}
