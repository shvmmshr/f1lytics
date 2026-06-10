import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getRaceResults } from "@/lib/api/jolpica";
import { CIRCUIT_LIST } from "@/lib/constants";
import { PageTransition } from "@/components/layout/page-transition";
import { CountdownTimer } from "@/components/shared/countdown-timer";
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

export const metadata: Metadata = {
  title: "Race Calendar",
  description: "2026 Formula 1 calendar timeline with countdown to the next race",
};

function formatDateMonthDay(date: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit" })
    .format(new Date(`${date}T00:00:00Z`))
    .toUpperCase();
}

function countryCodeToFlag(countryCode: string): string {
  if (!/^[A-Za-z]{2}$/.test(countryCode)) return "🏁";
  return countryCode
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

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
    (c) => !c.cancelled && c.raceDate >= todayStr,
  );

  return (
    <PageTransition>
      <div style={{ background: F1.bg, color: F1.fg, position: "relative" }}>
        <BroadcastGrid color={F1.line} size={48} opacity={0.18} />

        {/* Header */}
        <div
          className="relative"
          style={{ padding: "40px 32px 28px", borderBottom: `1px solid ${F1.line}` }}
        >
          <div className="flex items-center gap-3.5">
            <Mono style={{ color: F1.red, fontSize: 11, letterSpacing: "0.24em" }}>
              SECTION 05
            </Mono>
            <span style={{ width: 40, height: 1, background: F1.line }} />
            <Mono style={{ color: F1.fg3, fontSize: 11, letterSpacing: "0.18em" }}>
              2026 SEASON · {CIRCUIT_LIST.length} ROUNDS
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
            THE CALENDAR<span style={{ color: F1.red }}>.</span>
          </h1>
        </div>

        {/* Featured next race */}
        {nextRace && (
          <div
            className="relative grid"
            style={{
              gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)",
              gap: 0,
              borderBottom: `1px solid ${F1.line}`,
            }}
          >
            <div
              className="relative overflow-hidden"
              style={{ padding: 32, background: F1.bg2 }}
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
                  fontSize: "clamp(56px, 7vw, 84px)",
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                  lineHeight: 0.85,
                  marginTop: 4,
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
                className="grid mt-6"
                style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}
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
                        fontSize: 9,
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
            </div>

            <div
              className="relative overflow-hidden"
              style={{ background: F1.ink, minHeight: 360 }}
            >
              <Image
                src={nextRace.trackImage}
                alt={nextRace.name}
                fill
                className="object-contain"
                style={{ filter: "invert(1) opacity(0.85)" }}
              />
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `radial-gradient(ellipse at center, transparent 30%, ${F1.ink} 100%)`,
                }}
              />
              <div
                style={{ position: "absolute", top: 20, left: 20, right: 20 }}
              >
                <DataLabel>CIRCUIT MAP</DataLabel>
                <div
                  className="font-display"
                  style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}
                >
                  {nextRace.name.toUpperCase()}
                </div>
              </div>
              <div
                className="flex justify-between"
                style={{
                  position: "absolute",
                  bottom: 20,
                  left: 20,
                  right: 20,
                }}
              >
                <div>
                  <DataLabel>LAP RECORD</DataLabel>
                  <div
                    className="font-display"
                    style={{ fontSize: 18, fontWeight: 600 }}
                  >
                    {nextRace.lapRecord}
                  </div>
                </div>
                <div>
                  <DataLabel>HOLDER</DataLabel>
                  <div
                    className="font-display"
                    style={{ fontSize: 18, fontWeight: 600 }}
                  >
                    {nextRace.lapRecordHolder.toUpperCase()}
                  </div>
                </div>
                <div>
                  <DataLabel>{nextRace.isSprint ? "SPRINT" : "FORMAT"}</DataLabel>
                  <div
                    className="font-display"
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: nextRace.isSprint ? F1.amber : F1.fg,
                    }}
                  >
                    {nextRace.isSprint ? "YES" : "STANDARD"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calendar grid */}
        <div className="relative" style={{ padding: "32px" }}>
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
                <Link
                  key={c.id}
                  href={`/circuits/${c.slug}`}
                  data-cal-card
                  className="relative block transition-colors hover:bg-white/5"
                  style={{
                    background: isNext ? F1.bg2 : F1.bg,
                    padding: 16,
                    opacity: isCancelled ? 0.45 : isPast ? 0.85 : 1,
                    borderTop: `2px solid ${stateColor}`,
                  }}
                >
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
                          fontSize: 9,
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
                          fontSize: 9,
                          color: F1.fg3,
                          letterSpacing: "0.16em",
                        }}
                      >
                        {isCancelled ? "—" : "TBD"}
                      </Mono>
                      <Mono
                        style={{
                          fontSize: 9,
                          color: F1.fg4,
                          letterSpacing: "0.14em",
                        }}
                      >
                        ›
                      </Mono>
                    </div>
                  )}
                </Link>
              );
            })}
          </CalendarGrid>
        </div>

      </div>
    </PageTransition>
  );
}
