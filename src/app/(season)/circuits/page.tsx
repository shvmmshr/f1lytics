import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CIRCUIT_LIST } from "@/lib/constants";
import { PageTransition } from "@/components/layout/page-transition";
import { F1, Mono, Grid as BroadcastGrid } from "@/components/shared/broadcast";
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
      <div style={{ background: F1.bg, color: F1.fg, position: "relative" }}>
        <BroadcastGrid color={F1.line} size={64} opacity={0.18} />

        <div
          className="relative"
          style={{ padding: "40px clamp(16px, 4vw, 32px) 28px", borderBottom: `1px solid ${F1.line}` }}
        >
          <div className="flex items-center gap-3.5">
            <Mono style={{ color: F1.red, fontSize: 11, letterSpacing: "0.24em" }}>
              SECTION 06
            </Mono>
            <span style={{ width: 40, height: 1, background: F1.line }} />
            <Mono style={{ color: F1.fg3, fontSize: 11, letterSpacing: "0.18em" }}>
              CIRCUITS · {CIRCUIT_LIST.length} TRACKS · WORLD TOUR
            </Mono>
          </div>
          <h1
            className="font-display uppercase m-0 mt-3"
            style={{
              fontWeight: 700,
              fontSize: "clamp(36px, 8vw, 96px)",
              lineHeight: 0.9,
              letterSpacing: "-0.04em",
            }}
          >
            THE CIRCUITS<span style={{ color: F1.red }}>.</span>
          </h1>
          <div className="mt-3" style={{ fontSize: 16, color: F1.fg2, maxWidth: 540 }}>
            Every track on the 2026 Formula 1 world tour. Spin the globe.
          </div>
        </div>

        <CircuitGlobeWrapper circuits={globeCircuits} />

        <CircuitsGrid>
          {CIRCUIT_LIST.map((circuit) => (
            <Link
              key={circuit.id}
              href={`/circuits/${circuit.slug}`}
              data-circuit-card
              className="group relative block"
              style={{
                background: F1.bg,
                opacity: circuit.cancelled ? 0.5 : 1,
                borderTop: circuit.isSprint
                  ? `2px solid ${F1.amber}`
                  : `2px solid ${F1.line}`,
                overflow: "hidden",
              }}
            >
              <div
                className="relative"
                style={{
                  height: 168,
                  background: F1.bg2,
                  borderBottom: `1px solid ${F1.line}`,
                }}
              >
                <Image
                  src={circuit.trackImage}
                  alt={`${circuit.name} track layout`}
                  fill
                  className="object-contain p-6 transition-opacity"
                  style={{ filter: "brightness(0) invert(1)", opacity: 0.85 }}
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                />
                <div
                  className="absolute"
                  style={{ top: 12, left: 12, display: "flex", gap: 6 }}
                >
                  <Mono
                    style={{
                      fontSize: 10,
                      color: F1.fg,
                      background: F1.bg,
                      border: `1px solid ${F1.line}`,
                      padding: "2px 8px",
                      letterSpacing: "0.14em",
                      fontWeight: 700,
                    }}
                  >
                    R{String(circuit.round).padStart(2, "0")}
                  </Mono>
                </div>
                {circuit.isSprint && !circuit.cancelled && (
                  <div className="absolute" style={{ top: 12, right: 12 }}>
                    <Mono
                      style={{
                        fontSize: 9,
                        background: F1.amber,
                        color: F1.ink,
                        padding: "3px 8px",
                        letterSpacing: "0.18em",
                        fontWeight: 700,
                      }}
                    >
                      SPRINT
                    </Mono>
                  </div>
                )}
                {circuit.cancelled && (
                  <div className="absolute" style={{ top: 12, right: 12 }}>
                    <Mono
                      style={{
                        fontSize: 9,
                        background: F1.red,
                        color: F1.fg,
                        padding: "3px 8px",
                        letterSpacing: "0.18em",
                        fontWeight: 700,
                      }}
                    >
                      CANCELLED
                    </Mono>
                  </div>
                )}
              </div>
              <div style={{ padding: 18 }}>
                <h2
                  className="font-display"
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.05,
                    color: F1.fg,
                  }}
                >
                  {circuit.fullName.toUpperCase()}
                </h2>
                <Mono
                  style={{
                    fontSize: 10,
                    color: F1.fg3,
                    letterSpacing: "0.14em",
                    marginTop: 6,
                    display: "block",
                  }}
                >
                  {countryCodeToFlag(circuit.countryCode)} {circuit.city.toUpperCase()} ·{" "}
                  {circuit.country.toUpperCase()}
                </Mono>
                <div className="flex items-center gap-3" style={{ marginTop: 12 }}>
                  <Mono
                    style={{
                      fontSize: 11,
                      color: F1.fg2,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {circuit.length.toFixed(3)} KM
                  </Mono>
                  <span style={{ width: 1, height: 12, background: F1.line }} />
                  <Mono style={{ fontSize: 11, color: F1.fg2 }}>
                    {circuit.turns} TURNS
                  </Mono>
                  <span style={{ width: 1, height: 12, background: F1.line }} />
                  <Mono style={{ fontSize: 11, color: F1.fg2 }}>
                    {circuit.isSprint && circuit.sprintDate
                      ? `${formatRaceDate(circuit.sprintDate)} / ${formatRaceDate(circuit.raceDate)}`
                      : formatRaceDate(circuit.raceDate)}
                  </Mono>
                </div>
              </div>
            </Link>
          ))}
        </CircuitsGrid>
      </div>
    </PageTransition>
  );
}
