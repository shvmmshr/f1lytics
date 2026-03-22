import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRaceResults } from "@/lib/api/jolpica";
import { CIRCUIT_LIST, getCircuitBySlug } from "@/lib/constants";
import { PageTransition } from "@/components/layout/page-transition";

interface CircuitPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return CIRCUIT_LIST.map((circuit) => ({ slug: circuit.slug }));
}

export async function generateMetadata({ params }: CircuitPageProps): Promise<Metadata> {
  const { slug } = await params;
  const circuit = getCircuitBySlug(slug);
  if (!circuit) return { title: "Circuit Not Found — F1lytics 2026" };
  return {
    title: `${circuit.name} — F1lytics 2026`,
    description: `${circuit.fullName} circuit stats, schedule, and track information`,
  };
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

function countryCodeToFlag(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return "";
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}

export default async function CircuitPage({ params }: CircuitPageProps) {
  const { slug } = await params;
  const circuit = getCircuitBySlug(slug);
  if (!circuit) notFound();

  // Find adjacent circuits for prev/next nav
  const idx = CIRCUIT_LIST.findIndex((c) => c.id === circuit.id);
  const prev = idx > 0 ? CIRCUIT_LIST[idx - 1] : null;
  const next = idx < CIRCUIT_LIST.length - 1 ? CIRCUIT_LIST[idx + 1] : null;

  let lastWinner: string | null = null;
  let topResults: { position: string; driver: string; team: string; time: string }[] = [];

  try {
    const raceResults = await getRaceResults("2026", String(circuit.round));
    const race = raceResults[0];
    if (race?.Results) {
      const winner = race.Results.find((r) => r.position === "1");
      if (winner) lastWinner = `${winner.Driver.givenName} ${winner.Driver.familyName}`;
      topResults = race.Results.slice(0, 5).map((r) => ({
        position: r.position,
        driver: `${r.Driver.givenName} ${r.Driver.familyName}`,
        team: r.Constructor?.name ?? "",
        time: r.Time?.time ?? (r.status || ""),
      }));
    }
  } catch {
    // No data yet
  }

  return (
    <PageTransition>
      {/* ── Hero header with track image ── */}
      <section className="relative mb-8 overflow-hidden rounded-2xl border border-border-subtle bg-bg-secondary">
        <div className="flex flex-col lg:flex-row">
          {/* Track layout image */}
          <div className="relative flex h-64 items-center justify-center bg-bg-primary p-6 lg:h-auto lg:w-2/5">
            <Image
              src={circuit.trackImage}
              alt={`${circuit.name} track layout`}
              width={400}
              height={400}
              className={`h-full max-h-56 w-auto object-contain opacity-90 lg:max-h-72${
                circuit.id === "bahrain" ? " invert" : ""
              }`}
              unoptimized
            />
          </div>

          {/* Circuit info */}
          <div className="flex-1 p-6 lg:p-8">
            <div className="flex items-center gap-3">
              <span className="rounded-md bg-status-red/20 px-2 py-1 font-mono text-xs font-bold text-status-red">
                ROUND {circuit.round}
              </span>
              {circuit.isSprint && (
                <span className="rounded-md bg-status-yellow/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-status-yellow">
                  Sprint Weekend
                </span>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-text-primary lg:text-4xl">
              {circuit.fullName}
            </h1>
            <p className="mt-2 text-lg text-text-secondary">{circuit.name}</p>
            <p className="mt-2 text-sm text-text-muted">
              {countryCodeToFlag(circuit.countryCode)} {circuit.city}, {circuit.country}
            </p>

            {/* Key stats inline */}
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Race Date</p>
                <p className="mt-0.5 text-sm font-medium text-text-primary">{formatDate(circuit.raceDate)}</p>
                {circuit.isSprint && circuit.sprintDate && (
                  <p className="mt-0.5 text-xs text-status-yellow">Sprint: {formatDate(circuit.sprintDate)}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Length</p>
                <p className="mt-0.5 font-mono text-sm font-medium text-text-primary">{circuit.length.toFixed(3)} km</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Turns</p>
                <p className="mt-0.5 font-mono text-sm font-medium text-text-primary">{circuit.turns}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Lap Record</p>
                <p className="mt-0.5 font-mono text-sm font-medium text-text-primary">{circuit.lapRecord}</p>
                <p className="text-xs text-text-muted">{circuit.lapRecordHolder}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Race Results ── */}
      <section className="mb-8 rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <h2 className="text-xl font-bold tracking-tight text-text-primary">
          {lastWinner ? "Race Results" : "Race Preview"}
        </h2>

        {topResults.length > 0 ? (
          <div className="mt-4 overflow-hidden rounded-lg border border-border-subtle">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-bg-tertiary text-xs uppercase tracking-widest text-text-muted">
                  <th className="px-4 py-2.5 text-left font-medium">Pos</th>
                  <th className="px-4 py-2.5 text-left font-medium">Driver</th>
                  <th className="hidden px-4 py-2.5 text-left font-medium sm:table-cell">Team</th>
                  <th className="px-4 py-2.5 text-right font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {topResults.map((r) => (
                  <tr key={r.position} className="border-b border-border-subtle last:border-0">
                    <td className="px-4 py-3 font-mono font-bold text-text-primary">P{r.position}</td>
                    <td className="px-4 py-3 text-text-primary">{r.driver}</td>
                    <td className="hidden px-4 py-3 text-text-muted sm:table-cell">{r.team}</td>
                    <td className="px-4 py-3 text-right font-mono text-text-secondary">{r.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-border-subtle bg-bg-tertiary/50 p-8 text-center">
            <p className="text-sm text-text-muted">
              Race results will appear after the event on {formatDate(circuit.raceDate)}.
            </p>
            {lastWinner && (
              <p className="mt-2 text-text-primary">
                Winner: <span className="font-bold">{lastWinner}</span>
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── Prev / Next navigation ── */}
      <div className="flex items-stretch gap-4">
        {prev ? (
          <Link
            href={`/circuits/${prev.slug}`}
            className="flex flex-1 items-center gap-3 rounded-xl border border-border-subtle bg-bg-secondary p-4 transition-colors hover:bg-bg-tertiary"
          >
            <span className="text-text-muted">&larr;</span>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-text-muted">Round {prev.round}</p>
              <p className="truncate text-sm font-medium text-text-primary">{prev.fullName}</p>
            </div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {next ? (
          <Link
            href={`/circuits/${next.slug}`}
            className="flex flex-1 items-center justify-end gap-3 rounded-xl border border-border-subtle bg-bg-secondary p-4 text-right transition-colors hover:bg-bg-tertiary"
          >
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-text-muted">Round {next.round}</p>
              <p className="truncate text-sm font-medium text-text-primary">{next.fullName}</p>
            </div>
            <span className="text-text-muted">&rarr;</span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </PageTransition>
  );
}
