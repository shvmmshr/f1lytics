import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CIRCUIT_LIST } from "@/lib/constants";
import { PageTransition } from "@/components/layout/page-transition";
import { SectionHeader } from "@/components/shared/section-header";
import { CircuitGlobeWrapper } from "./circuit-globe-wrapper";
import { CircuitsGrid } from "./circuits-grid";

export const metadata: Metadata = {
  title: "Circuits",
  description: "All 24 circuits on the 2026 Formula 1 calendar",
};

function formatRaceDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
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
    fullName: circuit.fullName,
    country: circuit.country,
    round: circuit.round,
    raceDate: circuit.raceDate,
    isSprint: circuit.isSprint,
  }));

  return (
    <PageTransition>
      <SectionHeader
        title="Circuits"
        subtitle="Every track on the 2026 Formula 1 world tour"
      />

      <CircuitGlobeWrapper circuits={globeCircuits} />

      <CircuitsGrid>
        {CIRCUIT_LIST.map((circuit) => (
          <Link key={circuit.id} href={`/circuits/${circuit.slug}`}>
            <article className={`group h-full overflow-hidden rounded-xl border border-border-subtle bg-bg-secondary transition-colors duration-200 hover:bg-bg-tertiary${circuit.cancelled ? " opacity-40" : ""}`}>
              {/* Track layout image */}
              <div className="relative h-44 w-full bg-bg-primary">
                <Image
                  src={circuit.trackImage}
                  alt={`${circuit.name} track layout`}
                  fill
                  className={`object-contain p-4 opacity-80 transition-opacity duration-200 group-hover:opacity-100${
                    circuit.id === "bahrain" ? " invert" : ""
                  }`}
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  unoptimized
                />
                {/* Round badge */}
                <span className="absolute left-3 top-3 rounded-md bg-bg-secondary/80 px-2 py-1 font-mono text-[11px] font-bold text-text-secondary backdrop-blur-sm">
                  R{circuit.round}
                </span>
                {/* Sprint badge */}
                {circuit.isSprint && !circuit.cancelled && (
                  <span className="absolute right-3 top-3 rounded-md bg-status-yellow/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-status-yellow backdrop-blur-sm">
                    Sprint Weekend
                  </span>
                )}
                {/* Cancelled badge */}
                {circuit.cancelled && (
                  <span className="absolute right-3 top-3 rounded-md bg-status-red/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-status-red backdrop-blur-sm">
                    Cancelled
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h2 className="text-base font-bold tracking-tight text-text-primary">
                  {circuit.fullName}
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  {countryCodeToFlag(circuit.countryCode)} {circuit.name} · {circuit.city}, {circuit.country}
                </p>

                <div className="mt-3 flex items-center gap-3 text-xs text-text-muted">
                  <span className="font-mono">{circuit.length.toFixed(1)} km</span>
                  <span className="opacity-30">|</span>
                  <span>{circuit.turns} turns</span>
                  <span className="opacity-30">|</span>
                  <span>
                    {circuit.isSprint && circuit.sprintDate
                      ? `${formatRaceDate(circuit.sprintDate)} / ${formatRaceDate(circuit.raceDate)}`
                      : formatRaceDate(circuit.raceDate)}
                  </span>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </CircuitsGrid>
    </PageTransition>
  );
}
