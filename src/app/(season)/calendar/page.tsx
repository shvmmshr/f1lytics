import { PageHeader } from "@/components/shared/page-header";
import { CircuitMap } from "@/components/shared/circuit-map";
import { countryCodeToFlag } from "@/lib/utils";
import Link from "next/link";
import { getRaceResults } from "@/lib/api/jolpica";
import { CIRCUIT_LIST } from "@/lib/constants";
import { getWeekendSchedule } from "@/lib/constants/sessions";
import { PageTransition } from "@/components/layout/page-transition";
import { CountdownTimer } from "@/components/shared/countdown-timer";
import { SessionSchedule } from "@/components/shared/session-schedule";
import { CalendarGrid } from "./calendar-grid";
import {
  F1,
  Mono,
  DataLabel,
  LiveDot,
  RacingStripes,
  SectionHeader,
  Grid as BroadcastGrid,
} from "@/components/shared/broadcast";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "2026 F1 Calendar: Race Dates & Start Times",
  description:
    "View every 2026 F1 race date, sprint weekend, and session start time with automatic timezone conversion and a countdown to the next Grand Prix.",
  path: "/calendar",
  imageEyebrow: "2026 CALENDAR",
});

function formatDateMonthDay(date: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", timeZone: "UTC" })
    .format(new Date(`${date}T00:00:00Z`))
    .toUpperCase();
}


// Post-session-sensitive data (results/standings/grid); see AGENTS.md caching rules.
export const revalidate = 300;

export default async function CalendarPage() {
  let raceResults: Awaited<ReturnType<typeof getRaceResults>> = [];

  try {
    raceResults = await getRaceResults("2026");
  } catch (err) {
    console.error("[f1lytics] calendar race results fetch failed:", err);
    // Continue with static calendar.
  }

  // Keyed by race date, not round — Jolpica renumbers rounds when races are
  // cancelled, so its round numbers don't match our calendar's.
  const winnerByDate = new Map<string, string>();
  raceResults.forEach((race) => {
    const winner = race.Results?.find((r) => r.position === "1");
    if (!winner) return;
    winnerByDate.set(
      race.date,
      `${winner.Driver.givenName.slice(0, 1)}. ${winner.Driver.familyName}`,
    );
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const nextRace = CIRCUIT_LIST.find(
    (c) => !c.cancelled && c.raceDate >= todayStr && !winnerByDate.has(c.raceDate),
  );

  return (
    <PageTransition>
      <div style={{ background: F1.bg, color: F1.fg, position: "relative" }}>
        <BroadcastGrid color={F1.line} size={48} opacity={0.18} />

        {/* Header */}
        <PageHeader eyebrow="SECTION 05" meta={<>2026 SEASON · {CIRCUIT_LIST.length} ROUNDS</>} title="THE CALENDAR" />

        {/* Featured next race */}
        {nextRace && (
          <div
            className="relative grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
            style={{
              gap: 0,
              borderBottom: `1px solid ${F1.line}`,
            }}
          >
            <div
              className="relative overflow-hidden"
              style={{ padding: "clamp(20px, 5vw, 32px)", background: F1.bg2 }}
            >
              <RacingStripes color={F1.red} opacity={0.05} size={20} />
              <div
                className="inline-flex items-center gap-2.5"
                style={{
                  padding: "6px 12px",
                  background: F1.red,
                  color: F1.ink,
                }}
              >
                <LiveDot color={F1.ink} size={6} />
                <Mono
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                  }}
                >
                  UP NEXT · ROUND {String(nextRace.round).padStart(2, "0")}
                </Mono>
              </div>
              <div
                className="font-display uppercase mt-4"
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                  color: F1.fg2,
                }}
              >
                {countryCodeToFlag(nextRace.countryCode)} {nextRace.country}
              </div>
              <div
                className="font-display uppercase"
                style={{
                  fontSize: "clamp(34px, 7vw, 84px)",
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                  lineHeight: 0.85,
                  marginTop: 4,
                  wordBreak: "break-word",
                }}
              >
                {nextRace.city.toUpperCase()}
              </div>
              <div
                className="font-display uppercase"
                style={{
                  fontSize: 32,
                  fontWeight: 500,
                  color: F1.red,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                  marginTop: 4,
                }}
              >
                GRAND PRIX
              </div>

              <div
                className="grid grid-cols-2 sm:grid-cols-4 mt-6"
                style={{ gap: 10 }}
              >
                {[
                  ["DATE", formatDateMonthDay(nextRace.raceDate)],
                  ["TURNS", String(nextRace.turns)],
                  ["LENGTH", `${nextRace.length} KM`],
                  ["LAP REC", nextRace.lapRecord],
                ].map(([l, v]) => (
                  <div
                    key={l}
                    style={{
                      background: F1.bg,
                      padding: "10px 12px",
                      border: `1px solid ${F1.line}`,
                    }}
                  >
                    <Mono
                      style={{
                        fontSize: 11,
                        color: F1.fg3,
                        letterSpacing: "0.18em",
                      }}
                    >
                      {l}
                    </Mono>
                    <div
                      className="font-display"
                      style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}
                    >
                      {v}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6" style={{ maxWidth: 420 }}>
                <CountdownTimer
                  targetDate={new Date(`${nextRace.raceDate}T${nextRace.raceTime}`)}
                />
              </div>

              {/* Session times in the viewer's timezone */}
              {(() => {
                const weekendSchedule = getWeekendSchedule(nextRace.raceDate);
                return weekendSchedule ? (
                  <div className="mt-6" style={{ maxWidth: 480 }}>
                    <SessionSchedule schedule={weekendSchedule} />
                  </div>
                ) : null;
              })()}
            </div>

            <figure className="flex min-w-0 flex-col border-t border-line bg-bg-ink p-5 md:border-l md:border-t-0 sm:p-6">
              <figcaption>
                <DataLabel>CIRCUIT MAP · 2026</DataLabel>
                <h3 className="mt-3 font-display text-3xl uppercase leading-tight">{nextRace.name}</h3>
              </figcaption>
              <div className="my-auto py-5"><CircuitMap circuit={nextRace} sizes="(max-width: 768px) 100vw, 50vw" /></div>
              <div className="grid grid-cols-1 gap-4 border-t border-line pt-5 sm:grid-cols-2">
                <div>
                  <DataLabel>RACE LAP RECORD</DataLabel>
                  <p className="mt-2 font-display text-2xl">{nextRace.lapRecord === "—" ? "Not established" : nextRace.lapRecord}</p>
                  {nextRace.lapRecordHolder !== "—" && <p className="mt-1 text-xs text-text-secondary">{nextRace.lapRecordHolder}{nextRace.lapRecordYear ? ` · ${nextRace.lapRecordYear}` : ""}</p>}
                </div>
                <Link href={`/circuits/${nextRace.slug}`} className="inline-flex min-h-11 items-center justify-between gap-4 border border-line px-4 py-3 text-sm text-text-secondary hover:bg-white/[0.04]">Explore the circuit <span aria-hidden>→</span></Link>
              </div>
            </figure>
          </div>
        )}

        {/* Calendar grid */}
        <div className="relative" style={{ padding: "32px clamp(16px, 4vw, 32px)" }}>
          <SectionHeader
            label="FULL SEASON"
            right={
              <div className="flex gap-4">
                {[
                  [F1.fg3, "DONE"],
                  [F1.amber, "NEXT"],
                  [F1.fg4, "UPCOMING"],
                ].map(([c, l]) => (
                  <span
                    key={l}
                    className="inline-flex items-center gap-1.5"
                  >
                    <span
                      style={{ width: 8, height: 8, background: c, display: "inline-block" }}
                    />
                    <Mono style={{ fontSize: 10, color: F1.fg2 }}>{l}</Mono>
                  </span>
                ))}
              </div>
            }
          />

          <CalendarGrid>
            {CIRCUIT_LIST.map((c) => {
              const isCancelled = c.cancelled === true;
              const isPast = c.raceDate < todayStr;
              const isNext = nextRace?.id === c.id;
              const winner = isCancelled ? undefined : winnerByDate.get(c.raceDate);
              const stateColor = isCancelled
                ? F1.fg4
                : isNext
                  ? F1.amber
                  : isPast
                    ? F1.fg3
                    : F1.fg4;

              return (
                <div
                  key={c.id}
                  data-cal-card
                  className="group relative block transition-colors hover:bg-white/5"
                  style={{
                    background: isNext ? F1.bg2 : F1.bg,
                    padding: 16,
                    opacity: isCancelled ? 0.45 : isPast ? 0.85 : 1,
                    borderTop: `2px solid ${stateColor}`,
                  }}
                >
                  <Link
                    href={`/races/${c.slug}`}
                    aria-label={`${c.fullName} race centre`}
                    className="absolute inset-0 z-10"
                  />
                  {isNext && <RacingStripes color={F1.amber} opacity={0.06} size={12} />}
                  <div className="relative flex justify-between items-baseline">
                    <Mono
                      style={{
                        fontSize: 10,
                        color: F1.fg3,
                        letterSpacing: "0.16em",
                        fontWeight: 700,
                      }}
                    >
                      RD {String(c.round).padStart(2, "0")}
                    </Mono>
                    <Mono
                      style={{
                        fontSize: 10,
                        color: stateColor,
                        letterSpacing: "0.18em",
                        fontWeight: 700,
                      }}
                    >
                      {isCancelled
                        ? "CANCELLED"
                        : isNext
                          ? "NEXT"
                          : isPast
                            ? "✓"
                            : formatDateMonthDay(c.raceDate)}
                    </Mono>
                  </div>
                  <div className="relative mt-2.5 flex items-baseline gap-2">
                    <span style={{ fontSize: 18 }}>
                      {countryCodeToFlag(c.countryCode)}
                    </span>
                    <span
                      className="font-display uppercase truncate"
                      style={{
                        fontSize: 24,
                        fontWeight: 600,
                        letterSpacing: "-0.01em",
                        lineHeight: 1,
                        color: isCancelled ? F1.fg3 : F1.fg,
                      }}
                    >
                      {c.city.toUpperCase()}
                    </span>
                  </div>
                  <Mono
                    style={{
                      fontSize: 10,
                      color: F1.fg3,
                      letterSpacing: "0.16em",
                      display: "block",
                      marginTop: 2,
                    }}
                  >
                    {c.country.toUpperCase()} · {formatDateMonthDay(c.raceDate)}
                    {c.isSprint && (
                      <span style={{ color: F1.amber, marginLeft: 6 }}>· SPRINT</span>
                    )}
                  </Mono>
                  {winner ? (
                    <div
                      className="relative mt-3 pt-2.5 flex items-center gap-2"
                      style={{ borderTop: `1px dashed ${F1.line}` }}
                    >
                      <Mono
                        style={{
                          fontSize: 11,
                          color: F1.fg3,
                          letterSpacing: "0.16em",
                        }}
                      >
                        WINNER
                      </Mono>
                      <Mono
                        style={{
                          fontSize: 11,
                          color: F1.amber,
                          fontWeight: 700,
                          letterSpacing: "0.04em",
                          marginLeft: "auto",
                        }}
                      >
                        {winner.toUpperCase()}
                      </Mono>
                    </div>
                  ) : (
                    <div
                      className="relative mt-3 pt-2.5 flex justify-between"
                      style={{ borderTop: `1px dashed ${F1.line}` }}
                    >
                      <Mono
                        style={{
                          fontSize: 11,
                          color: F1.fg3,
                          letterSpacing: "0.16em",
                        }}
                      >
                        {/* Same vocabulary as the races index: a run race
                            awaiting classification is "pending", a future
                            one is genuinely undecided. */}
                        {isCancelled ? "—" : isPast ? "RESULT PENDING" : "TBD"}
                      </Mono>
                      <Mono
                        style={{
                          fontSize: 11,
                          color: F1.fg4,
                          letterSpacing: "0.14em",
                        }}
                      >
                        ›
                      </Mono>
                    </div>
                  )}
                  <Link
                    href={`/circuits/${c.slug}`}
                    className="control-md relative z-20 mt-3 justify-start font-mono text-[10px] tracking-[0.14em] text-zinc-400 hover:text-white"
                  >
                    CIRCUIT GUIDE →
                  </Link>
                </div>
              );
            })}
          </CalendarGrid>
        </div>

      </div>
    </PageTransition>
  );
}
