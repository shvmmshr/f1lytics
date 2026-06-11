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

/** Compact, scannable date: "SUN · MAR 8". Year is implied (whole page is 2026). */
function formatRaceDate(date: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).formatToParts(new Date(`${date}T00:00:00Z`));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("weekday")} · ${get("month")} ${get("day")}`.toUpperCase();
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

    // Abbreviate to "A. ANTONELLI" — punchier in the card footer than the full name.
    const initial = winner.Driver.givenName.trim().charAt(0).toUpperCase();
    winnerByDate.set(race.date, {
      name: `${initial}. ${winner.Driver.familyName.toUpperCase()}`,
      constructor: winner.Constructor.name,
    });
  });

  const today = new Date().toISOString().split("T")[0];
  // The single soonest race still to come — only this one gets the "UP NEXT" accent.
  const nextRaceDate = CIRCUIT_LIST.find(
    (c) => !c.cancelled && c.raceDate >= today
  )?.raceDate;

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
              fontSize: "clamp(36px, 8vw, 96px)",
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
            gridTemplateColumns: "repeat(auto-fill, minmax(min(340px, 100%), 1fr))",
            borderTop: `1px solid ${F1.line}`,
            borderBottom: `1px solid ${F1.line}`,
          }}
        >
          {CIRCUIT_LIST.map((circuit) => {
            const isCancelled = circuit.cancelled === true;
            const isPast = circuit.raceDate < today;
            const isNext = circuit.raceDate === nextRaceDate;
            const winner = !isCancelled ? winnerByDate.get(circuit.raceDate) : undefined;

            // Only meaningful states earn a colored top edge — sprint (amber)
            // and cancelled (red). Plain rounds get the neutral hairline so the
            // grid reads calm instead of a rainbow of borders.
            const topAccent = isCancelled
              ? F1.red
              : circuit.isSprint
                ? F1.amber
                : "transparent";

            return (
              <Link
                key={circuit.id}
                href={`/races/${circuit.slug}`}
                className="group flex flex-col transition-colors hover:bg-white/[0.025]"
                style={{
                  background: F1.bg,
                  borderTop: `2px solid ${topAccent}`,
                  padding: "18px 22px 16px",
                  minHeight: 188,
                  opacity: isCancelled ? 0.5 : 1,
                  position: "relative",
                }}
              >
                {/* Top row: round (left) · date + chevron (right) */}
                <div className="flex items-center justify-between gap-3">
                  <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.22em" }}>
                    R{String(circuit.round).padStart(2, "0")}
                  </Mono>
                  <div className="flex items-center gap-2">
                    {!isCancelled && (
                      <Mono
                        style={{
                          fontSize: 10,
                          color: isNext ? F1.amber : F1.fg3,
                          letterSpacing: "0.16em",
                        }}
                      >
                        {formatRaceDate(circuit.raceDate)}
                      </Mono>
                    )}
                    <span
                      className="text-[#5C5C66] transition-colors group-hover:text-white"
                      style={{ fontSize: 13, lineHeight: 1 }}
                      aria-hidden
                    >
                      ›
                    </span>
                  </div>
                </div>

                {/* Hero: GP name + status badge */}
                <div className="mt-4 flex items-start justify-between gap-3">
                  <h2
                    className="font-display"
                    style={{
                      fontSize: 23,
                      fontWeight: 600,
                      lineHeight: 1.04,
                      color: isCancelled ? F1.fg3 : F1.fg,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {circuit.fullName.toUpperCase()}
                  </h2>
                  {isCancelled ? (
                    <Mono
                      className="shrink-0"
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
                  ) : circuit.isSprint ? (
                    <Mono
                      className="shrink-0"
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
                  ) : null}
                </div>

                {/* Location — sentence case, demoted, no caps wall */}
                <div
                  className="mt-1.5"
                  style={{ fontSize: 13, color: F1.fg3, letterSpacing: "0.01em" }}
                >
                  {circuit.city} · {circuit.country}
                </div>

                {/* Footer pinned to the bottom: the row's "result" line. */}
                <div className="mt-auto pt-3" style={{ borderTop: `1px solid ${F1.line}` }}>
                  {isCancelled ? (
                    <Mono style={{ fontSize: 10, color: F1.fg4, letterSpacing: "0.16em" }}>
                      NOT HELD IN 2026
                    </Mono>
                  ) : winner ? (
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Mono
                        style={{
                          fontSize: 9,
                          color: F1.amber,
                          letterSpacing: "0.16em",
                          fontWeight: 700,
                        }}
                      >
                        P1
                      </Mono>
                      <span
                        className="font-display truncate"
                        style={{ fontSize: 14, fontWeight: 600, color: F1.fg }}
                      >
                        {winner.name}
                      </span>
                      <span
                        className="truncate"
                        style={{ fontSize: 11, color: F1.fg3, letterSpacing: "0.01em" }}
                      >
                        {winner.constructor}
                      </span>
                    </div>
                  ) : isPast ? (
                    <Mono style={{ fontSize: 10, color: F1.fg4, letterSpacing: "0.16em" }}>
                      RESULT PENDING
                    </Mono>
                  ) : circuit.isSprint && circuit.sprintDate ? (
                    <Mono style={{ fontSize: 10, color: F1.amber, letterSpacing: "0.14em" }}>
                      SPRINT · {formatRaceDate(circuit.sprintDate)}
                    </Mono>
                  ) : (
                    <Mono
                      style={{
                        fontSize: 10,
                        color: isNext ? F1.amber : F1.fg4,
                        letterSpacing: "0.16em",
                      }}
                    >
                      {isNext ? "UP NEXT" : "UPCOMING"}
                    </Mono>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </PageTransition>
  );
}
