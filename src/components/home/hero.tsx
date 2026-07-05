"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useCountdownTick } from "@/hooks/use-countdown-tick";
import Image from "next/image";
import Link from "next/link";
import { getNextEvent, TEAMS, CIRCUIT_LIST, DRIVER_LIST, TEAM_LIST } from "@/lib/constants";
import {
  getWeekendSchedule,
  getActiveHeadlineSession,
  SESSION_LABELS,
  type ActiveSession,
} from "@/lib/constants/sessions";
import {
  F1,
  LiveDot,
  Mono,
  Brackets,
  RacingStripes,
  DataLabel,
  StatValue,
} from "@/components/shared/broadcast";
import { StartLights } from "@/components/home/start-lights";
import { SessionSchedule } from "@/components/shared/session-schedule";
import type { GridRow, RecentRace } from "@/lib/api/weekend";

type Standing = {
  position: number;
  name: string;
  teamId: string;
  points: number;
};

/** Server-computed race-weekend context for the UP NEXT card. */
export interface WeekendInfo {
  raceSlug: string;
  isSprint: boolean;
  /** Top of the starting grid (OpenF1, minutes after qualifying). P1 = pole. */
  grid?: GridRow[];
  /** Sprint winner, once the sprint has run (sprint weekends only). */
  sprintWinner?: { name: string };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}


export function Hero({
  driverStandings = [] as Standing[],
  constructorStandings = [] as Standing[],
  weekend = null,
  recentRace = null,
}: {
  driverStandings?: Standing[];
  constructorStandings?: Standing[];
  weekend?: WeekendInfo | null;
  recentRace?: RecentRace | null;
}) {
  const [view, setView] = useState<"drivers" | "constructors">("drivers");
  const heroRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const event = getNextEvent();
  const nextRace = event?.circuit;
  const weekendSchedule = nextRace ? getWeekendSchedule(nextRace.raceDate) : undefined;

  // Live-session awareness (quali / sprint quali / sprint / race only) — same
  // client-side schedule check the navbar dot uses; null until mounted so the
  // SSR and first client render agree.
  const [liveSession, setLiveSession] = useState<ActiveSession | null>(null);
  useEffect(() => {
    const check = () => setLiveSession(getActiveHeadlineSession(Date.now()));
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, []);
  // Count down to the actual next event — on sprint weekends that's the
  // sprint, not the Sunday race.
  const targetTime = event
    ? new Date(`${event.eventDate}T${event.eventTime}`).getTime()
    : null;

  // Countdown digits are written straight to the DOM via refs once per second,
  // bypassing React entirely — ticking through state would reconcile the whole
  // Hero subtree every second.
  const cdHeaderD = useRef<HTMLSpanElement>(null);
  const cdHeaderH = useRef<HTMLSpanElement>(null);
  const cdDays = useRef<HTMLSpanElement>(null);
  const cdHours = useRef<HTMLSpanElement>(null);
  const cdMins = useRef<HTMLSpanElement>(null);
  const cdSecs = useRef<HTMLSpanElement>(null);
  // The headline's own ticking clock (LIGHTS OUT state).
  const hlTime = useRef<HTMLSpanElement>(null);

  useCountdownTick(targetTime, ({ d, h, m, s }) => {
    if (cdHeaderD.current) cdHeaderD.current.textContent = String(d);
    if (cdHeaderH.current) cdHeaderH.current.textContent = pad(h);
    if (cdDays.current) cdDays.current.textContent = pad(d);
    if (cdHours.current) cdHours.current.textContent = pad(h);
    if (cdMins.current) cdMins.current.textContent = pad(m);
    if (cdSecs.current) cdSecs.current.textContent = pad(s);
    if (hlTime.current)
      hlTime.current.textContent =
        d > 0 ? `${d}D ${pad(h)}:${pad(m)}` : `${pad(h)}:${pad(m)}:${pad(s)}`;
  });

  // ── The headline is generated from season state, not a slogan ──
  // live session → "IT'S LIVE."; race weekend → "LIGHTS OUT" + ticking clock;
  // otherwise → the championship story from the standings we already fetched.
  const leader = driverStandings[0];
  const runnerUp = driverStandings[1];
  const leaderGap =
    leader && runnerUp && leader.points > runnerUp.points
      ? Math.round(leader.points - runnerUp.points)
      : null;
  const leaderLastName = leader?.name.split(" ").pop()?.toUpperCase() ?? null;
  const headlineState: "live" | "countdown" | "season" = liveSession
    ? "live"
    : weekend && targetTime
      ? "countdown"
      : "season";

  useGSAP(
    () => {
      // Initial hidden state is set HERE (pre-paint via useGSAP's layout
      // effect), never inline in JSX — if GSAP fails to run, the content
      // renders visible instead of being stuck invisible-but-interactive.
      gsap.set([subRef.current, ctaRef.current, statsRef.current, tickerRef.current], { y: 24, opacity: 0 });
      const tl = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.1 });
      tl.from(headlineRef.current, { y: 40, opacity: 0, duration: 0.8 }, 0)
        .to(subRef.current, { y: 0, opacity: 1, duration: 0.5 }, 0.5)
        .to(ctaRef.current, { y: 0, opacity: 1, duration: 0.5 }, 0.65)
        .to(tickerRef.current, { y: 0, opacity: 1, duration: 0.5 }, 0.6)
        .to(statsRef.current, { y: 0, opacity: 1, duration: 0.5 }, 0.8)
        // Refresh ScrollTrigger once, after the entrance settles and layout is
        // stable, instead of on every staggerEntrance() call across the page.
        .call(() => ScrollTrigger.refresh(), undefined, ">");
    },
    { scope: heroRef }
  );

  const top5 = (view === "drivers" ? driverStandings : constructorStandings).slice(0, 5);

  return (
    <section
      ref={heroRef}
      className="relative flex flex-col overflow-hidden"
      style={{ background: F1.ink, color: F1.fg, minHeight: "100vh" }}
    >
      {/* Background image + treatments (decorative — never intercepts clicks/drags) */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.45 }}>
        {/* This is the page's LCP element (biggest paint). Optimized (NOT
            unoptimized): phones get a ~750px variant instead of the full
            1920px file, and priority+fetchPriority emit the preload hint. */}
        <Image
          src="/hero-bg.avif"
          alt=""
          fill
          priority
          fetchPriority="high"
          className="object-cover"
          style={{ filter: "grayscale(0.4) contrast(1.1)" }}
          sizes="100vw"
        />
      </div>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, rgba(8,8,10,0.4) 0%, rgba(8,8,10,0.85) 50%, ${F1.ink} 100%)`,
        }}
      />
      <RacingStripes color={F1.red} opacity={0.04} size={20} />

      {/* Hero content — flex-grows to fill the viewport so the ticker pins to the
          bottom (no dead black space below it). Single column on mobile. */}
      <div
        className="relative grid mx-auto w-full grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
        style={{
          maxWidth: 1440,
          padding: "clamp(32px, 5vw, 64px) clamp(20px, 5vw, 64px) 40px",
          gap: "clamp(32px, 4vw, 56px)",
          flex: 1,
          alignContent: "center",
        }}
      >
        {/* LEFT — headline */}
        <div className="min-w-0">
          {/* Start lights: illuminate in sequence, extinguish together, once. */}
          <div className="flex items-center gap-5 mb-7">
            <StartLights size={12} />
            <Mono style={{ fontSize: 11, color: F1.fg3, letterSpacing: "0.24em" }}>
              {headlineState === "live" && liveSession
                ? `ON AIR · ${SESSION_LABELS[liveSession.session]}`
                : headlineState === "countdown" && nextRace
                  ? `RD ${String(nextRace.round).padStart(2, "0")} · ${nextRace.fullName.toUpperCase()}`
                  : "2026 SEASON · TELEMETRY & ANALYSIS"}
            </Mono>
          </div>

          {/* The countdown digits live in a SIBLING of the h1 (aria-hidden),
              not inside it — crawlers and screen readers get a keyword-bearing
              heading ("LIGHTS OUT · British Grand Prix"), never "--:--:--". */}
          <div ref={headlineRef}>
            <h1
              className="font-display uppercase m-0"
              style={{
                fontWeight: 700,
                fontSize: "clamp(48px, 10.5vw, 148px)",
                lineHeight: 0.88,
                letterSpacing: "-0.04em",
                color: F1.fg,
              }}
            >
              {headlineState === "live" && liveSession ? (
                <>
                  IT&apos;S LIVE<span style={{ color: F1.red }}>.</span>
                  <br />
                  <span style={{ WebkitTextStroke: `2px ${F1.fg}`, color: "transparent" }}>
                    {SESSION_LABELS[liveSession.session]}.
                  </span>
                </>
              ) : headlineState === "countdown" ? (
                <>
                  LIGHTS OUT
                  {nextRace && <span className="sr-only"> · {nextRace.fullName}</span>}
                </>
              ) : leaderLastName && leaderGap ? (
                <>
                  {leaderLastName}
                  <br />
                  <span style={{ WebkitTextStroke: `2px ${F1.fg}`, color: "transparent" }}>
                    LEADS BY {leaderGap}
                  </span>
                  <span style={{ color: F1.red }}>.</span>
                </>
              ) : (
                <>
                  FORMULA 1<span style={{ color: F1.red }}>,</span>
                  <br />
                  <span style={{ WebkitTextStroke: `2px ${F1.fg}`, color: "transparent" }}>
                    DECODED.
                  </span>
                </>
              )}
            </h1>
            {headlineState === "countdown" && (
              <div
                aria-hidden
                className="font-display uppercase tabular-nums m-0"
                style={{
                  fontWeight: 700,
                  fontSize: "clamp(48px, 10.5vw, 148px)",
                  lineHeight: 0.88,
                  letterSpacing: "-0.04em",
                  WebkitTextStroke: `2px ${F1.red}`,
                  color: "transparent",
                }}
              >
                IN <span ref={hlTime}>--:--:--</span>
              </div>
            )}
          </div>

          <div
            ref={subRef}
            className="mt-8"
            style={{ maxWidth: 520, fontSize: "clamp(15px, 4vw, 18px)", lineHeight: 1.5, color: F1.fg2 }}
          >
            {headlineState === "live"
              ? "Positions, gaps and race control — streaming now on the live timing screen."
              : headlineState === "countdown" && nextRace
                ? // fullName is the GP name ("British Grand Prix") — the circuit
                  // name can contain the city ("Silverstone Circuit from
                  // Silverstone") and read like a stutter.
                  `The ${nextRace.fullName} from ${nextRace.city}. Starting grid, schedule and live timing in one place.`
                : "Standings, race analysis, telemetry and the full 2026 season — in one place."}
          </div>

          {/* CTAs — the primary action follows the headline's state */}
          <div ref={ctaRef} className="mt-9 flex items-center flex-wrap" style={{ gap: 14 }}>
            <Link
              href={
                headlineState === "live"
                  ? "/live"
                  : headlineState === "countdown" && weekend?.grid
                    ? `/races/${weekend.raceSlug}#starting-grid`
                    : "/standings"
              }
              className="font-display inline-flex items-center cursor-pointer transition-opacity hover:opacity-90"
              style={{
                background: F1.red,
                color: F1.ink,
                fontWeight: 700,
                fontSize: 16,
                letterSpacing: "0.06em",
                padding: "16px 32px",
              }}
            >
              {headlineState === "live"
                ? "WATCH LIVE TIMING"
                : headlineState === "countdown" && weekend?.grid
                  ? "STARTING GRID"
                  : "VIEW STANDINGS"}
            </Link>
            <Link
              href={
                headlineState === "live" && weekend
                  ? `/races/${weekend.raceSlug}`
                  : headlineState === "countdown"
                    ? "/standings"
                    : "/races"
              }
              className="font-mono inline-flex items-center cursor-pointer hover:bg-white/5 transition-colors"
              style={{
                padding: "17px 26px",
                background: "transparent",
                color: F1.fg,
                border: `1px solid ${F1.lineHi}`,
                fontSize: 12,
                letterSpacing: "0.18em",
              }}
            >
              {headlineState === "live" && weekend
                ? "RACE CENTRE →"
                : headlineState === "countdown"
                  ? "VIEW STANDINGS →"
                  : "EXPLORE RACES →"}
            </Link>
          </div>

          {/* Stat row */}
          <div
            ref={statsRef}
            style={{ marginTop: "clamp(32px, 6vw, 64px)" }}
          >
            <div
              className="grid grid-cols-2 sm:grid-cols-4"
              style={{
                gap: 1,
                background: F1.line,
                borderTop: `1px solid ${F1.line}`,
              }}
            >
              {[
                ["ROUND", `${event ? String(event.circuit.round).padStart(2, "0") : "—"}/${CIRCUIT_LIST.length}`],
                ["DRIVERS", String(DRIVER_LIST.length)],
                ["TEAMS", String(TEAM_LIST.length)],
                ["CIRCUITS", String(CIRCUIT_LIST.filter((c) => !c.cancelled).length)],
              ].map(([l, v], i) => (
                <div
                  key={i}
                  style={{
                    background: F1.bg,
                    padding: "16px clamp(12px, 2vw, 20px) 18px",
                  }}
                >
                  <DataLabel>{l}</DataLabel>
                  <div style={{ marginTop: 8 }}>
                    <StatValue size="clamp(26px, 5vw, 36px)">{v}</StatValue>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Up next + championship ticker. Nudged up slightly at lg so
            the standings card clears the fold. */}
        <div ref={tickerRef} className="flex flex-col gap-4 min-w-0 lg:-mt-12">
          {/* LAST RACE card — podium of the GP that finished within 3 days */}
          {recentRace && recentRace.podium.length > 0 && (
            <div
              className="relative"
              style={{
                background: F1.bg2,
                border: `1px solid ${F1.line}`,
                borderTop: `2px solid ${F1.amber}`,
                padding: 20,
              }}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <Mono style={{ color: F1.amber, fontSize: 11, letterSpacing: "0.2em", fontWeight: 700 }}>
                  LAST RACE · ROUND {String(recentRace.round).padStart(2, "0")}
                </Mono>
                <Link
                  href={`/races/${recentRace.slug}`}
                  className="font-mono shrink-0 transition-colors hover:text-white"
                  style={{
                    fontSize: 10,
                    color: F1.fg3,
                    letterSpacing: "0.16em",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  FULL RESULTS →
                </Link>
              </div>
              <div
                className="font-display"
                style={{
                  fontSize: "clamp(20px, 4.5vw, 26px)",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                  color: F1.fg,
                  marginBottom: 14,
                }}
              >
                {recentRace.name.toUpperCase()}
              </div>
              <div className="flex flex-col gap-1.5">
                {recentRace.podium.map((p) => (
                  <div
                    key={p.position}
                    className="grid items-center"
                    style={{
                      gridTemplateColumns: "28px 4px 1fr auto",
                      gap: 10,
                      background: F1.bg,
                      padding: "8px 10px",
                    }}
                  >
                    <Mono
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: p.position === 1 ? F1.amber : p.position === 2 ? "#C0C0C0" : "#CD7F32",
                      }}
                    >
                      P{p.position}
                    </Mono>
                    <span style={{ width: 3, height: 22, background: p.teamColor }} />
                    <span
                      className="font-display truncate"
                      style={{ fontSize: 14, fontWeight: 600, color: F1.fg }}
                    >
                      {p.driverName}
                    </span>
                    {p.time && (
                      <Mono
                        className="shrink-0"
                        style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.08em" }}
                      >
                        {p.time}
                      </Mono>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* UP NEXT card */}
          {nextRace && (
            <div
              className="relative"
              style={{
                background: F1.bg2,
                border: `1px solid ${F1.line}`,
                padding: 20,
              }}
            >
              <Brackets color={F1.red} size={12} />

              {/* LIVE banner — only rendered while quali/sprint/race is on-track */}
              {liveSession && (
                <Link
                  href="/live"
                  className="flex items-center justify-between gap-3 mb-4 transition-opacity hover:opacity-90"
                  style={{
                    background: F1.red,
                    color: F1.ink,
                    padding: "10px 14px",
                    textDecoration: "none",
                  }}
                >
                  <span className="inline-flex items-center gap-2.5 min-w-0">
                    <LiveDot color={F1.ink} size={8} />
                    <Mono
                      className="truncate"
                      style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em" }}
                    >
                      LIVE NOW · {SESSION_LABELS[liveSession.session]}
                    </Mono>
                  </span>
                  <Mono
                    className="shrink-0"
                    style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em" }}
                  >
                    WATCH →
                  </Mono>
                </Link>
              )}

              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-2.5">
                  {liveSession ? (
                    <LiveDot />
                  ) : (
                    <span
                      aria-hidden
                      style={{ width: 6, height: 6, background: F1.red, borderRadius: "50%" }}
                    />
                  )}
                  <Mono style={{ color: F1.red, fontSize: 11, letterSpacing: "0.2em" }}>
                    {weekend ? "RACE WEEKEND" : "UP NEXT"} · ROUND{" "}
                    {String(nextRace.round).padStart(2, "0")}
                  </Mono>
                </span>
                <Mono style={{ color: F1.fg3, fontSize: 10, letterSpacing: "0.16em" }}>
                  IN <span ref={cdHeaderD}>--</span>D <span ref={cdHeaderH}>--</span>H
                </Mono>
              </div>
              <div
                className="font-display"
                style={{
                  fontSize: "clamp(26px, 6vw, 38px)",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                  color: F1.fg,
                }}
              >
                {nextRace.name.toUpperCase()}
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: 11,
                  color: F1.fg3,
                  marginTop: 4,
                  letterSpacing: "0.18em",
                }}
              >
                {nextRace.fullName.toUpperCase()}
              </div>

              {/* Weekend context — sprint winner + starting grid preview as
                  they get decided (grid is OpenF1-live, minutes after quali) */}
              {weekend && (weekend.grid || weekend.sprintWinner) && (
                <div
                  className="flex flex-col gap-2"
                  style={{
                    marginTop: 14,
                    paddingTop: 14,
                    borderTop: `1px solid ${F1.line}`,
                  }}
                >
                  {weekend.sprintWinner && (
                    <div className="flex items-center justify-between gap-3">
                      <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.2em" }}>
                        SPRINT WINNER
                      </Mono>
                      <Mono
                        className="truncate"
                        style={{ fontSize: 11, color: F1.amber, fontWeight: 700, letterSpacing: "0.1em" }}
                      >
                        {weekend.sprintWinner.name.toUpperCase()}
                      </Mono>
                    </div>
                  )}
                  {weekend.grid && weekend.grid.length > 0 && (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <Mono
                          style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.2em" }}
                        >
                          STARTING GRID
                        </Mono>
                        <Link
                          href={`/races/${weekend.raceSlug}#starting-grid`}
                          className="font-mono shrink-0 transition-colors hover:text-white"
                          style={{
                            fontSize: 10,
                            color: F1.fg3,
                            letterSpacing: "0.16em",
                            fontWeight: 700,
                            textDecoration: "none",
                          }}
                        >
                          FULL GRID →
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        {weekend.grid.map((row) => (
                          <div
                            key={row.position}
                            className="flex items-center gap-2 min-w-0"
                            style={{
                              background: F1.bg,
                              borderLeft: `2px solid ${row.teamColor}`,
                              padding: "5px 8px",
                            }}
                          >
                            <Mono
                              className="shrink-0"
                              style={{
                                fontSize: 10,
                                color: row.position === 1 ? F1.amber : F1.fg3,
                                fontWeight: 700,
                                width: 20,
                              }}
                            >
                              P{row.position}
                            </Mono>
                            <span
                              className="font-display truncate"
                              style={{ fontSize: 12, fontWeight: 600, color: F1.fg }}
                            >
                              {row.familyName.toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Countdown digits — rendered with "--" placeholders (matching SSR)
                  and filled by the shared ticker via refs, no re-render. Hidden
                  once the grid preview is in (card must fit one viewport; the
                  header's "IN xD xH" still shows the countdown). */}
              <div
                className="flex"
                style={{
                  marginTop: 18,
                  gap: 10,
                  fontFamily: "var(--font-display)",
                  display: weekend?.grid?.length ? "none" : undefined,
                }}
              >
                {(
                  [
                    [cdDays, "DAYS"],
                    [cdHours, "HRS"],
                    [cdMins, "MIN"],
                    [cdSecs, "SEC"],
                  ] as const
                ).map(([ref, l]) => (
                  <div key={l} style={{ flex: 1, textAlign: "center" }}>
                    <div
                      style={{
                        background: F1.bg,
                        padding: "6px 0",
                        fontSize: "clamp(22px, 5.5vw, 30px)",
                        fontWeight: 700,
                        color: F1.fg,
                        letterSpacing: "-0.02em",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      <span ref={ref}>--</span>
                    </div>
                    <Mono
                      style={{
                        fontSize: 8,
                        color: F1.fg3,
                        letterSpacing: "0.2em",
                        marginTop: 4,
                        display: "block",
                      }}
                    >
                      {l}
                    </Mono>
                  </div>
                ))}
              </div>

              {/* Compact weekend schedule in the viewer's local time */}
              {weekendSchedule && (
                <div
                  className="mt-4 pt-4"
                  style={{ borderTop: `1px solid ${F1.line}` }}
                >
                  <SessionSchedule schedule={weekendSchedule} variant="compact" />
                </div>
              )}
            </div>
          )}

          {/* Top 5 standings preview */}
          {top5.length > 0 && (
            <div
              className="relative"
              style={{
                background: F1.bg2,
                border: `1px solid ${F1.line}`,
                padding: 20,
              }}
            >
              <div className="flex items-center justify-between mb-4 gap-3">
                <div
                  role="tablist"
                  aria-label="Standings view"
                  className="inline-flex"
                  style={{
                    border: `1px solid ${F1.lineHi}`,
                    background: F1.bg,
                    padding: 2,
                  }}
                >
                  {(
                    [
                      ["drivers", "DRIVERS"],
                      ["constructors", "TEAMS"],
                    ] as const
                  ).map(([key, label]) => {
                    const active = view === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setView(key)}
                        className="font-mono cursor-pointer transition-colors"
                        style={{
                          background: active ? F1.red : "transparent",
                          color: active ? F1.ink : F1.fg2,
                          fontWeight: 700,
                          fontSize: 10,
                          letterSpacing: "0.2em",
                          // Tall enough to tap comfortably on mobile.
                          padding: "9px 12px",
                          border: "none",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <Mono style={{ color: F1.fg3, fontSize: 10, letterSpacing: "0.16em" }}>
                  POINTS
                </Mono>
              </div>
              <div className="flex flex-col gap-1.5">
                {top5.map((s) => {
                  const team = TEAMS[s.teamId];
                  const code = s.name.split(" ").pop()?.slice(0, 3).toUpperCase() ?? "";
                  return (
                    <div
                      key={s.position}
                      className="grid items-center"
                      style={{
                        gridTemplateColumns: "24px 4px 1fr 64px",
                        gap: 10,
                        background: F1.bg,
                        padding: "8px 10px",
                      }}
                    >
                      <Mono
                        style={{
                          color: F1.fg3,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {String(s.position).padStart(2, "0")}
                      </Mono>
                      <span
                        style={{
                          width: 3,
                          height: 22,
                          background: team?.color ?? F1.fg3,
                        }}
                      />
                      <span
                        className="font-display truncate"
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          letterSpacing: "0.02em",
                          color: F1.fg,
                        }}
                      >
                        {s.name}
                        {view === "drivers" && (
                          <>
                            {" "}
                            <Mono style={{ color: F1.fg3, fontSize: 11, marginLeft: 6 }}>
                              {code}
                            </Mono>
                          </>
                        )}
                      </span>
                      <Mono
                        style={{
                          fontSize: 13,
                          color: s.position === 1 ? F1.amber : F1.fg,
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {s.points}
                      </Mono>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar — season progress. One segment per round: red = raced,
          amber = sprint weekend raced, white = next up, ghosted = cancelled.
          The season's shape at a glance; links to the calendar. */}
      <Link
        href="/calendar"
        className="flex items-center gap-4 transition-colors hover:bg-white/[0.03]"
        style={{
          borderTop: `1px solid ${F1.line}`,
          background: F1.ink,
          padding: "12px clamp(16px, 4vw, 32px)",
          textDecoration: "none",
        }}
        aria-label={`Season progress: round ${nextRace ? nextRace.round : "—"} of ${CIRCUIT_LIST.length}. View calendar`}
      >
        <Mono
          className="shrink-0"
          style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.22em" }}
        >
          2026
        </Mono>
        <div className="flex flex-1" style={{ gap: 3 }} aria-hidden>
          {CIRCUIT_LIST.map((c) => {
            const isNext = nextRace ? c.round === nextRace.round : false;
            const done = nextRace ? c.round < nextRace.round : false;
            return (
              <span
                key={c.id}
                title={c.fullName}
                style={{
                  flex: 1,
                  height: 6,
                  background: c.cancelled
                    ? F1.bg3
                    : isNext
                      ? F1.fg
                      : done
                        ? c.isSprint
                          ? F1.amber
                          : F1.red
                        : F1.bg4,
                  opacity: c.cancelled ? 0.35 : 1,
                }}
              />
            );
          })}
        </div>
        <Mono
          className="shrink-0"
          style={{ fontSize: 9, color: F1.fg2, letterSpacing: "0.18em" }}
        >
          RD {nextRace ? String(nextRace.round).padStart(2, "0") : "—"}/
          {CIRCUIT_LIST.length}
        </Mono>
      </Link>
    </section>
  );
}
