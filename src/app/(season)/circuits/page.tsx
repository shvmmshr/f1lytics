import type { Metadata } from "next";
import Link from "next/link";
import { CIRCUIT_LIST } from "@/lib/constants";
import { PageTransition } from "@/components/layout/page-transition";
import { SectionHeader } from "@/components/shared/section-header";
import { CircuitGlobe } from "./circuit-globe";
import { CircuitsGrid } from "./circuits-grid";

export const metadata: Metadata = {
  title: "Circuits — GridLock F1 2026",
  description: "All 24 circuits on the 2026 Formula 1 calendar",
};

function formatRaceDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

function countryCodeToFlag(countryCode: string): string {
  if (!/^[A-Za-z]{2}$/.test(countryCode)) return "\u{1F3C1}";
  return countryCode
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

export default function CircuitsPage() {
  const globeCircuits = CIRCUIT_LIST.map((circuit) => ({
    id: circuit.id,
    lat: circuit.coordinates.lat,
    lng: circuit.coordinates.lng,
    name: circuit.name,
    isSprint: circuit.isSprint,
  }));

  return (
    <PageTransition>
      <SectionHeader
        title="Circuits"
        subtitle="Every track on the 2026 Formula 1 world tour"
      />

      <CircuitGlobe circuits={globeCircuits} />

      <CircuitsGrid>
        {CIRCUIT_LIST.map((circuit) => (
          <Link key={circuit.id} href={`/circuits/${circuit.slug}`}>
            <article
              data-animate="circuit-card"
              className="h-full rounded-xl border border-border-subtle bg-bg-secondary p-5 transition-all duration-200 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
                    Round {circuit.round}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-text-primary">
                    {circuit.name}
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    {circuit.fullName}
                  </p>
                </div>
                {circuit.isSprint && (
                  <span className="inline-flex rounded-full bg-status-yellow/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-status-yellow">
                    Sprint
                  </span>
                )}
              </div>

              <p className="mt-3 text-sm text-text-secondary">
                {countryCodeToFlag(circuit.countryCode)} {circuit.city},{" "}
                {circuit.country}
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-lg border border-border-subtle bg-bg-tertiary p-2">
                  <p className="text-[10px] uppercase tracking-widest text-text-muted">
                    {circuit.isSprint ? "Sprint / Race" : "Race Date"}
                  </p>
                  <p className="mt-1 text-xs text-text-primary">
                    {circuit.isSprint && circuit.sprintDate
                      ? `${formatRaceDate(circuit.sprintDate)} / ${formatRaceDate(circuit.raceDate)}`
                      : formatRaceDate(circuit.raceDate)}
                  </p>
                </div>
                <div className="rounded-lg border border-border-subtle bg-bg-tertiary p-2">
                  <p className="text-[10px] uppercase tracking-widest text-text-muted">
                    Length
                  </p>
                  <p className="mt-1 font-mono text-text-primary">
                    {circuit.length.toFixed(3)} km
                  </p>
                </div>
                <div className="rounded-lg border border-border-subtle bg-bg-tertiary p-2">
                  <p className="text-[10px] uppercase tracking-widest text-text-muted">
                    Turns
                  </p>
                  <p className="mt-1 font-mono text-text-primary">
                    {circuit.turns}
                  </p>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </CircuitsGrid>
    </PageTransition>
  );
}
