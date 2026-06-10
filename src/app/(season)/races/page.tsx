import type { Metadata } from "next";
import Link from "next/link";
import { CIRCUIT_LIST } from "@/lib/constants";
import { getRaceResults } from "@/lib/api/jolpica";
import { PageTransition } from "@/components/layout/page-transition";
import { F1, Mono, Grid as BroadcastGrid } from "@/components/shared/broadcast";

export const metadata: Metadata = {
  title: "Races",
  description: "Every round of the 2026 Formula 1 season with results",
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
  } catch (err) {
    console.error("[f1lytics] races index results fetch failed:", err);
    // Continue with static data if API is unavailable.
  }

  // Keyed by race date, not round — Jolpica renumbers rounds when races are
  // cancelled, so its round 4 (Miami) ≠ our round 4 (cancelled Bahrain).
  const winnerByDate = new Map<
    string,
    { name: string; constructor: string }
  >();
  raceResults.forEach((race) => {
    const winner = race.Results?.find((result) => result.position === "1");
    if (!winner) return;

    winnerByDate.set(race.date, {
      name: `${winner.Driver.givenName} ${winner.Driver.familyName}`,
      constructor: winner.Constructor.name,
    });
  });

  const today = new Date().toISOString().split("T")[0];

  return (
    <PageTransition>
      <div style={{ background: F1.bg, color: F1.fg, position: "relative" }}>
        <BroadcastGrid color={F1.line} size={64} opacity={0.18} />

        <div
          className="relative"
          style={{ padding: "40px 32px 28px", borderBottom: `1px solid ${F1.line}` }}
        >
          <div className="flex items-center gap-3.5">
            <Mono style={{ color: F1.red, fontSize: 11, letterSpacing: "0.24em" }}>
              SECTION 08
            </Mono>
            <span style={{ width: 40, height: 1, background: F1.line }} />
            <Mono style={{ color: F1.fg3, fontSize: 11, letterSpacing: "0.18em" }}>
              RACES · {CIRCUIT_LIST.length} ROUNDS · 2026
            </Mono>
          </div>
          <h1
            className="font-display uppercase m-0 mt-3"
            style={{
              fontWeight: 700,
              fontSize: "clamp(56px, 8vw, 96px)",
              lineHeight: 0.9,
              letterSpacing: "-0.04em",
            }}
          >
            THE RACES<span style={{ color: F1.red }}>.</span>
          </h1>
          <div className="mt-3" style={{ fontSize: 16, color: F1.fg2, maxWidth: 540 }}>
            Every round of the 2026 Formula 1 World Championship.
          </div>
        </div>

        <div
          className="grid hairline-cells"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            borderTop: `1px solid ${F1.line}`,
            borderBottom: `1px solid ${F1.line}`,
          }}
        >
          {CIRCUIT_LIST.map((circuit) => {
            const isCancelled = circuit.cancelled === true;
            const isPast = circuit.raceDate < today;
            const winner = !isCancelled ? winnerByDate.get(circuit.raceDate) : undefined;
            const accent = isCancelled
              ? F1.red
              : circuit.isSprint
                ? F1.amber
                : isPast
                  ? F1.fg4
                  : F1.fg2;

            return (
              <Link
                key={circuit.id}
                href={`/races/${circuit.slug}`}
                className="group block"
                style={{
                  background: F1.bg,
                  borderTop: `2px solid ${accent}`,
                  padding: "20px 22px",
                  opacity: isCancelled ? 0.55 : 1,
                  position: "relative",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Mono
                      className="block"
                      style={{
                        fontSize: 10,
                        color: F1.fg3,
                        letterSpacing: "0.2em",
                      }}
                    >
                      ROUND {String(circuit.round).padStart(2, "0")}
                    </Mono>
                    <h2
                      className="font-display mt-1 truncate"
                      style={{
                        fontSize: 22,
                        fontWeight: 600,
                        color: isCancelled ? F1.fg2 : F1.fg,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {circuit.fullName.toUpperCase()}
                    </h2>
                    <Mono
                      className="block mt-1.5"
                      style={{
                        fontSize: 11,
                        color: F1.fg2,
                        letterSpacing: "0.14em",
                      }}
                    >
                      {circuit.city.toUpperCase()} · {circuit.country.toUpperCase()}
                    </Mono>
                  </div>
                  {isCancelled ? (
                    <Mono
                      style={{
                        fontSize: 9,
                        background: F1.red,
                        color: F1.fg,
                        padding: "3px 8px",
                        letterSpacing: "0.2em",
                        fontWeight: 700,
                      }}
                    >
                      CANCELLED
                    </Mono>
                  ) : circuit.isSprint ? (
                    <Mono
                      style={{
                        fontSize: 9,
                        background: F1.amber,
                        color: F1.ink,
                        padding: "3px 8px",
                        letterSpacing: "0.2em",
                        fontWeight: 700,
                      }}
                    >
                      SPRINT
                    </Mono>
                  ) : null}
                </div>

                {!isCancelled && (
                  <div
                    className="mt-3"
                    style={{ borderTop: `1px solid ${F1.line}`, paddingTop: 12 }}
                  >
                    {circuit.isSprint && circuit.sprintDate && (
                      <Mono
                        className="block"
                        style={{ fontSize: 10, color: F1.amber, letterSpacing: "0.16em" }}
                      >
                        SPRINT · {formatRaceDate(circuit.sprintDate).toUpperCase()}
                      </Mono>
                    )}
                    <Mono
                      className="block"
                      style={{ fontSize: 11, color: F1.fg2, letterSpacing: "0.14em", marginTop: 2 }}
                    >
                      RACE · {formatRaceDate(circuit.raceDate).toUpperCase()}
                    </Mono>
                  </div>
                )}

                {winner && (
                  <div
                    className="mt-3 flex items-center gap-2.5"
                    style={{
                      borderLeft: `2px solid ${F1.amber}`,
                      paddingLeft: 10,
                    }}
                  >
                    <Mono
                      style={{ fontSize: 9, color: F1.amber, letterSpacing: "0.18em", fontWeight: 700 }}
                    >
                      P1
                    </Mono>
                    <span
                      className="font-display truncate"
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: F1.fg,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {winner.name.toUpperCase()}
                    </span>
                    <Mono
                      className="truncate"
                      style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.12em" }}
                    >
                      {winner.constructor.toUpperCase()}
                    </Mono>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </PageTransition>
  );
}
