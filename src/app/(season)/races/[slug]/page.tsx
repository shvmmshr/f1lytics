import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRaceResults } from "@/lib/api/jolpica";
import { getLaps, getPositions, getRaceControl, getSessions, getStints } from "@/lib/api/openf1";
import { CIRCUIT_LIST, TEAMS, getApiRound, getCircuitBySlug } from "@/lib/constants";
import { getWeekendSchedule } from "@/lib/constants/sessions";
import { SessionSchedule } from "@/components/shared/session-schedule";
import { PageTransition } from "@/components/layout/page-transition";
import { PositionBadge } from "@/components/shared/position-badge";
import {
  F1,
  Mono,
  Brackets,
  Grid as BroadcastGrid,
  SectionHeader,
  StatValue,
} from "@/components/shared/broadcast";
import Link from "next/link";
import { formatLapTime, positionChange } from "@/lib/utils";
import { PositionChart } from "@/components/charts/position-chart";
import { TireStrategyViz } from "@/components/charts/tire-strategy-viz";
import { LapTimeChart } from "@/components/charts/lap-time-chart";

interface RacePageProps {
  params: Promise<{
    slug: string;
  }>;
}

function ChartEmptyState({ label }: { label: string }) {
  return (
    <div
      style={{
        minHeight: 200,
        background: F1.bg2,
        border: `1px solid ${F1.line}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <Mono style={{ fontSize: 13, color: F1.fg2, letterSpacing: "0.2em", fontWeight: 600 }}>
        {label.toUpperCase()} · NO DATA
      </Mono>
      <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.14em" }}>
        OPENF1 DATA AVAILABLE AFTER SESSION ENDS
      </Mono>
    </div>
  );
}

interface OpenF1SessionCandidate {
  session_key: number;
  date_start: string;
  session_name: string;
  country_name: string;
  circuit_short_name: string;
}

// Regenerate every 5 minutes. Without this, a page built BEFORE its race
// happened skips every data fetch (raceHasHappened is false at build time),
// so Next.js marks it fully static and it never picks up results/points
// until the next deploy — this is why a just-finished GP showed no data.
export const revalidate = 300;

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
  const weekendSchedule = getWeekendSchedule(circuit.raceDate);

  let race = null as Awaited<ReturnType<typeof getRaceResults>>[number] | null;
  let laps: Awaited<ReturnType<typeof getLaps>> = [];
  let stints: Awaited<ReturnType<typeof getStints>> = [];
  let positions: Awaited<ReturnType<typeof getPositions>> = [];
  let raceControl: Awaited<ReturnType<typeof getRaceControl>> = [];
  let matchedSession: OpenF1SessionCandidate | null = null;

  // No data exists for races that haven't run — skip both APIs for them.
  // This also keeps the build's request burst well under the free-tier
  // rate limits (16 of 24 races are in the future at season midpoint).
  const raceHasHappened = circuit.raceDate <= new Date().toISOString().split("T")[0];

  if (!circuit.cancelled && raceHasHappened) {
    try {
      // Jolpica drops cancelled races from its calendar, so its round numbers
      // differ from ours — getApiRound translates. The date check guards
      // against any further renumbering returning a different race entirely.
      const raceResults = await getRaceResults("2026", String(getApiRound(circuit)));
      const candidate = raceResults[0] ?? null;
      race = candidate && candidate.date === circuit.raceDate ? candidate : null;
      if (candidate && !race) {
        console.error(
          `[f1lytics] round mismatch for ${circuit.slug}: API returned ${candidate.raceName} (${candidate.date}), expected ${circuit.raceDate}`
        );
      }
    } catch (err) {
      console.error("[f1lytics] race result fetch failed:", err);
      // Keep rendering static race shell if Jolpica is unavailable.
    }

    try {
      const sessions = (await getSessions({
        year: 2026,
        session_name: "Race",
      })) as OpenF1SessionCandidate[];

      // Closest race session by date — but only trust it if it falls within
      // the race weekend (±4 days), so a missing session can never silently
      // attach another grand prix's telemetry to this page.
      const WEEKEND_MS = 4 * 24 * 60 * 60 * 1000;
      matchedSession =
        sessions
          .filter((session) => session.session_name.toLowerCase() === "race")
          .map((session) => ({
            session,
            diff: Math.abs(new Date(session.date_start).getTime() - raceDate.getTime()),
          }))
          .filter(({ diff }) => diff <= WEEKEND_MS)
          .sort((a, b) => a.diff - b.diff)[0]?.session ?? null;

      if (matchedSession) {
        // Each call tolerates failure (e.g. an OpenF1 429 during the build
        // burst) so one throttled endpoint costs one chart, not all four.
        const logAndEmpty = (endpoint: string) => (err: unknown) => {
          console.error(`[f1lytics] race ${endpoint} fetch failed:`, err);
          return [];
        };
        [laps, stints, positions, raceControl] = await Promise.all([
          getLaps({ session_key: matchedSession.session_key }).catch(logAndEmpty("laps")),
          getStints({ session_key: matchedSession.session_key }).catch(logAndEmpty("stints")),
          getPositions({ session_key: matchedSession.session_key }).catch(logAndEmpty("positions")),
          getRaceControl({ session_key: matchedSession.session_key }).catch(logAndEmpty("race control")),
        ]);
      }
    } catch (err) {
      console.error("[f1lytics] race OpenF1 data fetch failed:", err);
      // OpenF1 data is optional for the initial race page implementation.
    }
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
      <div style={{ background: F1.bg, color: F1.fg, position: "relative" }}>
        <BroadcastGrid color={F1.line} size={64} opacity={0.18} />

        {circuit.cancelled && (
          <div
            style={{
              padding: "10px clamp(16px, 4vw, 32px)",
              background: F1.red,
              color: F1.fg,
              textAlign: "center",
            }}
          >
            <Mono style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em" }}>
              THIS GRAND PRIX HAS BEEN CANCELLED FOR 2026
            </Mono>
          </div>
        )}

        {/* HERO */}
        <section
          className="relative overflow-hidden"
          style={{
            borderBottom: `1px solid ${F1.line}`,
            padding: "44px clamp(16px, 4vw, 32px) 36px",
            background: `linear-gradient(135deg, ${F1.red}1a 0%, transparent 60%)`,
          }}
        >
          <div className="relative mx-auto" style={{ maxWidth: 1400 }}>
            <div className="flex items-center gap-3.5 mb-5">
              <Mono style={{ color: F1.red, fontSize: 11, letterSpacing: "0.24em", fontWeight: 700 }}>
                ROUND {String(circuit.round).padStart(2, "0")}
              </Mono>
              <span style={{ width: 40, height: 1, background: F1.line }} />
              <Mono style={{ color: F1.fg3, fontSize: 11, letterSpacing: "0.18em" }}>
                <Link href="/races" style={{ color: F1.fg3 }}>SEASON / RACES</Link> /{" "}
                {circuit.country.toUpperCase()}
              </Mono>
            </div>
            <h1
              className="font-display uppercase m-0"
              style={{
                fontWeight: 700,
                fontSize: "clamp(48px, 7vw, 96px)",
                lineHeight: 0.9,
                letterSpacing: "-0.04em",
                color: F1.fg,
              }}
            >
              {circuit.fullName}
              <span style={{ color: F1.red }}>.</span>
            </h1>
            <Mono
              className="block mt-3"
              style={{ fontSize: 13, color: F1.fg2, letterSpacing: "0.16em", wordBreak: "break-word" }}
            >
              {circuit.name.toUpperCase()} · {circuit.city.toUpperCase()},{" "}
              {circuit.country.toUpperCase()} · {formatRaceDate(circuit.raceDate).toUpperCase()}
            </Mono>
          </div>
        </section>

        {/* WEEKEND SCHEDULE — session times in the viewer's timezone */}
        {weekendSchedule && (
          <section
            className="relative"
            style={{ padding: "40px clamp(16px, 4vw, 32px)", borderBottom: `1px solid ${F1.line}` }}
          >
            <div className="mx-auto" style={{ maxWidth: 1400 }}>
              <SectionHeader label="WEEKEND SCHEDULE" />
              <div style={{ maxWidth: 640 }}>
                <SessionSchedule schedule={weekendSchedule} />
              </div>
            </div>
          </section>
        )}

        {/* PODIUM */}
        <section
          className="relative"
          style={{ padding: "40px clamp(16px, 4vw, 32px)", borderBottom: `1px solid ${F1.line}` }}
        >
          <div className="mx-auto" style={{ maxWidth: 1400 }}>
            <SectionHeader label="PODIUM" />
            {podium.length > 0 ? (
              <div
                className="grid grid-cols-1 sm:grid-cols-3"
                style={{
                  gap: 1,
                  background: F1.line,
                  border: `1px solid ${F1.line}`,
                }}
              >
                {podium.map((result) => {
                  const color = mapConstructorToTeamColor(result.Constructor.name);
                  const position = Number.parseInt(result.position, 10);
                  const podiumColor =
                    position === 1 ? F1.amber : position === 2 ? "#C0C0C0" : "#CD7F32";
                  return (
                    <div
                      key={result.Driver.driverId}
                      className="relative"
                      style={{
                        background: F1.bg,
                        borderTop: `2px solid ${color}`,
                        padding: "24px 22px",
                      }}
                    >
                      <Brackets color={F1.fg4} size={8} />
                      <div
                        className="font-display"
                        style={{
                          fontSize: 56,
                          fontWeight: 700,
                          color: podiumColor,
                          letterSpacing: "-0.04em",
                          lineHeight: 1,
                        }}
                      >
                        P{position}
                      </div>
                      <div
                        className="font-display mt-3"
                        style={{
                          fontSize: 24,
                          fontWeight: 600,
                          color: F1.fg,
                          letterSpacing: "-0.02em",
                          lineHeight: 1.05,
                        }}
                      >
                        {result.Driver.givenName.toUpperCase()}{" "}
                        <span style={{ color }}>{result.Driver.familyName.toUpperCase()}</span>
                      </div>
                      <Mono
                        className="block mt-1.5"
                        style={{ fontSize: 11, color: F1.fg3, letterSpacing: "0.16em" }}
                      >
                        {result.Constructor.name.toUpperCase()}
                      </Mono>
                      <div className="mt-4 flex items-baseline gap-2">
                        <StatValue size={28} color={F1.fg}>
                          {Number.parseFloat(result.points).toFixed(0)}
                        </StatValue>
                        <Mono
                          style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.2em" }}
                        >
                          PTS
                        </Mono>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Mono style={{ color: F1.fg3, fontSize: 12, letterSpacing: "0.14em" }}>
                {circuit.cancelled
                  ? "THIS ROUND WAS CANCELLED — NO PODIUM FOR 2026."
                  : "PODIUM DATA WILL APPEAR WHEN RACE RESULTS ARE AVAILABLE."}
              </Mono>
            )}
          </div>
        </section>

        {/* FULL RESULTS */}
        <section
          className="relative"
          style={{ padding: "40px clamp(16px, 4vw, 32px)", borderBottom: `1px solid ${F1.line}` }}
        >
          <div className="mx-auto" style={{ maxWidth: 1400 }}>
            <SectionHeader
              label="FULL RESULTS"
              right={
                <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.18em" }}>
                  {results.length > 0
                    ? `${results.length} CLASSIFIED`
                    : "NO RACE RESULTS YET"}
                </Mono>
              }
            />
            {results.length > 0 ? (
              <div className="overflow-x-auto"
                style={{
                  background: F1.bg2,
                  border: `1px solid ${F1.line}`,
                }}
              >
                <table
                    className="w-full"
                    style={{ borderCollapse: "collapse", minWidth: 860 }}
                  >
                    <thead>
                      <tr style={{ background: F1.bg, borderBottom: `1px solid ${F1.line}` }}>
                        {["POS", "DRIVER", "TEAM", "GRID", "Δ", "GAP / TIME", "PTS"].map((h) => (
                          <th
                            key={h}
                            className="font-mono text-left"
                            style={{
                              padding: "12px 16px",
                              fontSize: 10,
                              color: F1.fg3,
                              letterSpacing: "0.2em",
                              fontWeight: 600,
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedResults.map((result) => {
                        const position = Number.parseInt(result.position, 10);
                        const grid = Number.parseInt(result.grid, 10);
                        // grid === 0 means pit-lane start; only compute delta for grid >= 1
                        const isPitLane = !Number.isNaN(grid) && grid === 0;
                        const change =
                          Number.isNaN(grid) || isPitLane
                            ? undefined
                            : positionChange(grid, position);
                        const isLeader = position === 1;
                        const teamColor = mapConstructorToTeamColor(result.Constructor.name);

                        return (
                          <tr
                            key={`${result.Driver.driverId}-${result.position}`}
                            style={{ borderBottom: `1px solid ${F1.line}` }}
                          >
                            <td style={{ padding: "12px 16px" }}>
                              <PositionBadge position={position} />
                            </td>
                            <td
                              className="font-display"
                              style={{
                                padding: "12px 16px",
                                color: F1.fg,
                                fontSize: 14,
                                fontWeight: 500,
                                letterSpacing: "-0.01em",
                              }}
                            >
                              <span
                                aria-hidden
                                style={{
                                  display: "inline-block",
                                  width: 3,
                                  height: 16,
                                  background: teamColor,
                                  marginRight: 10,
                                  verticalAlign: "middle",
                                }}
                              />
                              {result.Driver.givenName} {result.Driver.familyName}
                            </td>
                            <td
                              className="font-mono"
                              style={{ padding: "12px 16px", color: F1.fg2, fontSize: 12 }}
                            >
                              {result.Constructor.name}
                            </td>
                            <td
                              className="font-mono tabular-nums"
                              style={{ padding: "12px 16px", color: F1.fg3, fontSize: 13 }}
                            >
                              {Number.isNaN(grid) ? "—" : grid === 0 ? "PL" : grid}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              {isPitLane ? (
                                <Mono
                                  style={{
                                    fontSize: 11,
                                    color: F1.fg3,
                                    fontVariantNumeric: "tabular-nums",
                                  }}
                                >
                                  PL
                                </Mono>
                              ) : change === undefined ? (
                                <Mono style={{ fontSize: 11, color: F1.fg3 }}>—</Mono>
                              ) : change === 0 ? (
                                <Mono style={{ fontSize: 11, color: F1.fg3 }}>{"="}</Mono>
                              ) : (
                                <Mono
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: change > 0 ? F1.green : F1.red,
                                    fontVariantNumeric: "tabular-nums",
                                  }}
                                >
                                  {change > 0 ? `+${change}` : change}
                                </Mono>
                              )}
                            </td>
                            <td
                              className="font-mono tabular-nums"
                              style={{
                                padding: "12px 16px",
                                color: isLeader ? F1.amber : F1.fg2,
                                fontSize: 12,
                                fontWeight: isLeader ? 700 : 400,
                              }}
                            >
                              {isLeader ? "LEADER" : result.Time?.time ?? result.status}
                            </td>
                            <td
                              className="font-mono tabular-nums"
                              style={{
                                padding: "12px 16px",
                                color: F1.fg,
                                fontSize: 13,
                                fontWeight: 700,
                              }}
                            >
                              {Number.parseFloat(result.points).toFixed(1)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
              </div>
            ) : (
              <Mono style={{ color: F1.fg3, fontSize: 12, letterSpacing: "0.14em" }}>
                {circuit.cancelled
                  ? "THIS ROUND WAS CANCELLED — NO RESULTS FOR 2026."
                  : "RESULTS TABLE WILL POPULATE AFTER THIS RACE IS COMPLETED."}
              </Mono>
            )}
          </div>
        </section>

        {/* TELEMETRY META */}
        <section
          className="relative"
          style={{ padding: "40px clamp(16px, 4vw, 32px)", borderBottom: `1px solid ${F1.line}` }}
        >
          <div className="mx-auto" style={{ maxWidth: 1400 }}>
            <SectionHeader label="OPENF1 TELEMETRY" />
            <div
              className="grid grid-cols-1 sm:grid-cols-3"
              style={{
                gap: 1,
                background: F1.line,
                border: `1px solid ${F1.line}`,
              }}
            >
              {[
                {
                  label: "SESSION",
                  value: matchedSession ? String(matchedSession.session_key) : "—",
                  sub: matchedSession
                    ? `${matchedSession.country_name} · ${matchedSession.circuit_short_name}`
                    : "Waiting for synchronized metadata",
                },
                {
                  label: "LAP SAMPLES",
                  value: String(laps.length),
                  sub:
                    openF1Drivers > 0
                      ? `${openF1Drivers} drivers with lap data`
                      : "No lap telemetry yet",
                },
                {
                  label: "TYRE STINTS",
                  value: String(stints.length),
                  sub: `Fastest lap: ${formatLapTime(fastestLapDuration)}`,
                },
              ].map((tile) => (
                <div
                  key={tile.label}
                  style={{ background: F1.bg, padding: "18px 22px" }}
                >
                  <Mono
                    style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.2em" }}
                  >
                    {tile.label}
                  </Mono>
                  <div style={{ marginTop: 8 }}>
                    <StatValue size={32} color={F1.fg}>
                      {tile.value}
                    </StatValue>
                  </div>
                  <Mono
                    className="block"
                    style={{
                      fontSize: 10,
                      color: F1.fg3,
                      marginTop: 6,
                      letterSpacing: "0.12em",
                    }}
                  >
                    {tile.sub}
                  </Mono>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CHARTS */}
        <section className="relative" style={{ padding: "40px clamp(16px, 4vw, 32px) 60px" }}>
          <div className="mx-auto" style={{ maxWidth: 1400 }}>
            <div className="space-y-10">
              <div>
                <SectionHeader label="POSITION CHANGES" />
                {positions.length === 0 ? (
                  <ChartEmptyState label="RACE POSITIONS" />
                ) : (
                  <PositionChart positions={positions} drivers={chartDrivers} />
                )}
              </div>
              <div>
                <SectionHeader label="TIRE STRATEGY" />
                {stints.length === 0 ? (
                  <ChartEmptyState label="TIRE STRATEGY" />
                ) : (
                  <TireStrategyViz stints={stints} drivers={chartDrivers} />
                )}
              </div>
              <div>
                <SectionHeader label="LAP TIMES" />
                {laps.length === 0 ? (
                  <ChartEmptyState label="LAP TIME ANALYSIS" />
                ) : (
                  <LapTimeChart laps={laps} drivers={chartDrivers} raceControl={raceControl} />
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
