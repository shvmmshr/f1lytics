import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
import { countryCodeToFlag } from "@/lib/utils";
import { CircuitMap } from "@/components/shared/circuit-map";
import { CIRCUIT_LIST } from "@/lib/constants";
import { PageTransition } from "@/components/layout/page-transition";
import { F1, Mono, Grid as BroadcastGrid } from "@/components/shared/broadcast";
import { CircuitGlobeWrapper } from "./circuit-globe-wrapper";
import { CircuitsGrid } from "./circuits-grid";
import { JsonLd } from "@/components/shared/json-ld";
import { createPageMetadata } from "@/lib/seo/metadata";
import { collectionSchema } from "@/lib/seo/schema";

const description =
  "Explore 2026 F1 circuit maps, lap records, track lengths, turns, race dates, weekend schedules, and results.";
export const metadata = createPageMetadata({
  title: "2026 F1 Circuits: Track Guides & Calendar",
  description,
  path: "/circuits",
});

function formatRaceDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
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
      <JsonLd
        data={collectionSchema(
          "2026 F1 circuits",
          description,
          "/circuits",
          CIRCUIT_LIST.map((circuit) => ({
            name: circuit.name,
            path: `/circuits/${circuit.slug}` as const,
          })),
        )}
      />
      <div style={{ background: F1.bg, color: F1.fg, position: "relative" }}>
        <BroadcastGrid color={F1.line} size={64} opacity={0.18} />

        <PageHeader eyebrow="SECTION 06" meta={<>CIRCUITS · {CIRCUIT_LIST.length} TRACKS · WORLD TOUR</>} title="THE CIRCUITS" description="Every track on the 2026 Formula 1 world tour. Spin the globe." />

        <CircuitGlobeWrapper circuits={globeCircuits} />

        <CircuitsGrid>
          {CIRCUIT_LIST.map((circuit) => (
            <Link
              key={circuit.id}
              href={`/circuits/${circuit.slug}`}
              data-circuit-card
              className="group relative block transition-shadow hover:shadow-[inset_0_0_0_999px_rgba(255,255,255,0.03)]"
              style={{
                background: F1.bg,
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
                <CircuitMap circuit={circuit} className="h-full" sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" />
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
                        fontSize: 11,
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
                        fontSize: 11,
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
