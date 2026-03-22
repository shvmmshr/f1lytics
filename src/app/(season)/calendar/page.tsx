import type { Metadata } from "next";
import { getRaceResults } from "@/lib/api/jolpica";
import { CIRCUIT_LIST } from "@/lib/constants";
import { PageTransition } from "@/components/layout/page-transition";
import { CountdownTimer } from "@/components/shared/countdown-timer";
import { SectionHeader } from "@/components/shared/section-header";
import { CalendarTimeline } from "./calendar-timeline";

export const metadata: Metadata = {
  title: "Calendar — F1lytics 2026",
  description: "2026 Formula 1 calendar timeline with countdown to the next race",
};

function formatRaceDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
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
  } catch {
    // Continue with static calendar data if API is unavailable.
  }

  const winnerByRound = new Map<number, string>();
  raceResults.forEach((race) => {
    const round = Number.parseInt(race.round, 10);
    const winner = race.Results?.find((result) => result.position === "1");
    if (!winner) return;

    winnerByRound.set(round, `${winner.Driver.givenName} ${winner.Driver.familyName}`);
  });

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const nextRace = CIRCUIT_LIST.find((circuit) => circuit.raceDate >= todayStr);

  return (
    <PageTransition>
      <SectionHeader title="Race Calendar" subtitle="2026 Season Schedule" />

      {nextRace && (
        <section className="mb-8 rounded-2xl border border-status-red/50 bg-bg-secondary p-6 shadow-[0_0_20px_var(--color-glow-red)]">
          <p className="font-mono text-xs uppercase tracking-widest text-text-muted">Next Race</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary">
            R{nextRace.round} · {nextRace.fullName}
          </h2>
          <p className="mt-1 text-text-secondary">
            {countryCodeToFlag(nextRace.countryCode)} {nextRace.city}, {nextRace.country} ·{" "}
            {formatRaceDate(nextRace.raceDate)}
          </p>
          <div className="mt-5">
            <CountdownTimer
              targetDate={new Date(`${nextRace.raceDate}T14:00:00Z`)}
              label="Countdown to race weekend"
            />
          </div>
        </section>
      )}

      <section>
        <CalendarTimeline>
          {CIRCUIT_LIST.map((circuit, index) => {
            const isPast = circuit.raceDate < todayStr;
            const isNext = nextRace?.id === circuit.id;
            const winner = winnerByRound.get(circuit.round);
            const side = index % 2 === 0 ? "left" : "right";

            return (
              <article
                key={circuit.id}
                data-animate="calendar-card"
                data-side={side}
                className={[
                  "relative rounded-xl border border-border-subtle bg-bg-secondary p-4 transition-colors",
                  // Mobile: offset for left-side timeline
                  "ml-8 md:ml-0",
                  // Desktop: alternating sides
                  side === "left"
                    ? "md:mr-auto md:w-[calc(50%-1rem)] md:pr-8"
                    : "md:ml-auto md:w-[calc(50%-1rem)] md:pl-8",
                  isPast ? "opacity-50" : "",
                  isNext
                    ? "border-status-red/40 opacity-100 shadow-[0_0_15px_var(--color-glow-red)]"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {/* Dot connector — mobile (left side) */}
                <div
                  className={[
                    "absolute top-5 -left-[23px] h-2.5 w-2.5 rounded-full border-2 bg-bg-primary md:hidden",
                    isNext
                      ? "border-status-red shadow-[0_0_8px_var(--color-glow-red)]"
                      : "border-border-subtle",
                  ].join(" ")}
                />

                {/* Dot connector — desktop (timeline side) */}
                <div
                  className={[
                    "absolute top-5 hidden h-2.5 w-2.5 rounded-full border-2 bg-bg-primary md:block",
                    side === "left" ? "-right-[21px]" : "-left-[21px]",
                    isNext
                      ? "border-status-red shadow-[0_0_8px_var(--color-glow-red)]"
                      : "border-border-subtle",
                  ].join(" ")}
                />

                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
                      Round {circuit.round}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-text-primary">
                      {circuit.fullName}
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary">
                      {countryCodeToFlag(circuit.countryCode)} {circuit.name} · {circuit.city},{" "}
                      {circuit.country}
                    </p>
                  </div>

                  <div className="text-right">
                    {circuit.isSprint && circuit.sprintDate && (
                      <p className="font-mono text-xs text-status-yellow">
                        Sprint: {formatRaceDate(circuit.sprintDate)}
                      </p>
                    )}
                    <p className="font-mono text-sm text-text-primary">
                      Race: {formatRaceDate(circuit.raceDate)}
                    </p>
                    {circuit.isSprint && (
                      <span className="mt-2 inline-flex rounded-full bg-status-yellow/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-status-yellow">
                        Sprint Weekend
                      </span>
                    )}
                    {isNext && (
                      <span className="mt-2 ml-2 inline-flex rounded-full bg-status-red/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-status-red">
                        Next
                      </span>
                    )}
                  </div>
                </div>

                {isPast && winner && (
                  <p className="mt-3 text-xs uppercase tracking-widest text-text-muted">
                    🏁 Winner: <span className="text-text-primary">{winner}</span>
                  </p>
                )}
              </article>
            );
          })}
        </CalendarTimeline>
      </section>
    </PageTransition>
  );
}
