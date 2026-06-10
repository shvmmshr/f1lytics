"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import Image from "next/image";
import Link from "next/link";
import { getNextEvent, TEAMS } from "@/lib/constants";
import {
  F1,
  LiveDot,
  Mono,
  Brackets,
  RacingStripes,
  DataLabel,
  StatValue,
} from "@/components/shared/broadcast";

type Standing = {
  position: number;
  name: string;
  teamId: string;
  points: number;
};

function getCountdown(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff / 3_600_000) % 24),
    m: Math.floor((diff / 60_000) % 60),
    s: Math.floor((diff / 1000) % 60),
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function Hero({
  driverStandings = [] as Standing[],
  constructorStandings = [] as Standing[],
}: {
  driverStandings?: Standing[];
  constructorStandings?: Standing[];
}) {
  const [view, setView] = useState<"drivers" | "constructors">("drivers");
  const heroRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const event = getNextEvent();
  const nextRace = event?.circuit;
  const targetTime = nextRace
    ? new Date(`${nextRace.raceDate}T${nextRace.raceTime}`).getTime()
    : null;
  const [tick, setTick] = useState<ReturnType<typeof getCountdown> | null>(null);

  useEffect(() => {
    if (targetTime === null) return;
    const target = new Date(targetTime);
    const raf = requestAnimationFrame(() => setTick(getCountdown(target)));
    const id = setInterval(() => setTick(getCountdown(target)), 1000);
    return () => {
      clearInterval(id);
      cancelAnimationFrame(raf);
    };
  }, [targetTime]);

  useGSAP(
    () => {
      gsap.set([subRef.current, ctaRef.current, statsRef.current, tickerRef.current], { y: 24, opacity: 0 });
      const tl = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.1 });
      tl.from(headlineRef.current, { y: 40, opacity: 0, duration: 0.8 }, 0)
        .to(subRef.current, { y: 0, opacity: 1, duration: 0.5 }, 0.5)
        .to(ctaRef.current, { y: 0, opacity: 1, duration: 0.5 }, 0.65)
        .to(tickerRef.current, { y: 0, opacity: 1, duration: 0.5 }, 0.6)
        .to(statsRef.current, { y: 0, opacity: 1, duration: 0.5 }, 0.8);
    },
    { scope: heroRef }
  );

  const top5 = (view === "drivers" ? driverStandings : constructorStandings).slice(0, 5);

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden"
      style={{ background: F1.ink, color: F1.fg, minHeight: "100vh" }}
    >
      {/* Background image + treatments */}
      <div className="absolute inset-0" style={{ opacity: 0.45 }}>
        <Image
          src="/hero-bg.avif"
          alt=""
          fill
          priority
          unoptimized
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

      {/* Top status strip */}
      <div
        className="relative flex items-center justify-between font-mono"
        style={{
          padding: "10px 32px",
          borderBottom: `1px solid ${F1.line}`,
          background: "rgba(8,8,10,0.85)",
          backdropFilter: "blur(10px)",
          fontSize: 10,
          color: F1.fg2,
          letterSpacing: "0.16em",
        }}
      >
        <span>F1LYTICS · 2026 SEASON</span>
        {nextRace && (
          <span className="inline-flex items-center gap-2">
            <LiveDot />
            UP NEXT · {nextRace.country.toUpperCase()} GP
          </span>
        )}
      </div>

      {/* Hero content */}
      <div
        className="relative grid mx-auto"
        style={{
          maxWidth: 1440,
          padding: "64px 64px 0",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
          gap: 56,
        }}
      >
        {/* LEFT — headline */}
        <div className="min-w-0">
          <div className="flex items-center gap-4 mb-7">
            <span style={{ width: 56, height: 1, background: F1.red, display: "inline-block" }} />
            <Mono style={{ fontSize: 11, color: F1.red, letterSpacing: "0.24em" }}>
              GRAND PRIX TELEMETRY · LIVE
            </Mono>
          </div>

          <h1
            ref={headlineRef}
            className="font-display uppercase m-0"
            style={{
              fontWeight: 700,
              fontSize: "clamp(72px, 11.6vw, 168px)",
              lineHeight: 0.86,
              letterSpacing: "-0.045em",
              color: F1.fg,
            }}
          >
            FORMULA 1<span style={{ color: F1.red }}>,</span>
            <br />
            <span
              style={{
                WebkitTextStroke: `2px ${F1.fg}`,
                color: "transparent",
              }}
            >
              DECODED.
            </span>
          </h1>

          <div
            ref={subRef}
            className="mt-8"
            style={{ maxWidth: 520, fontSize: 18, lineHeight: 1.5, color: F1.fg2 }}
          >
            Live timing, telemetry and the full 2026 season — in one place.
          </div>

          {/* CTAs */}
          <div ref={ctaRef} className="mt-9 flex items-center" style={{ gap: 0 }}>
            <Link
              href="/live"
              className="font-display inline-flex items-center gap-3 cursor-pointer transition-opacity hover:opacity-90"
              style={{
                background: F1.red,
                color: F1.ink,
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: "0.06em",
                padding: "18px 44px 18px 28px",
                clipPath: "polygon(0 0, 100% 0, 95% 100%, 0 100%)",
              }}
            >
              <LiveDot color={F1.ink} size={6} />
              ENTER LIVE SESSION
            </Link>
            <Link
              href="/standings"
              className="font-mono cursor-pointer hover:bg-white/5 transition-colors"
              style={{
                padding: "18px 24px",
                background: "transparent",
                color: F1.fg,
                border: `1px solid ${F1.lineHi}`,
                fontSize: 12,
                letterSpacing: "0.18em",
                marginLeft: -8,
              }}
            >
              VIEW STANDINGS →
            </Link>
          </div>

          {/* Stat row */}
          <div
            ref={statsRef}
            className="grid"
            style={{
              marginTop: 64,
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 0,
              borderTop: `1px solid ${F1.line}`,
              paddingTop: 24,
            }}
          >
            {[
              ["ROUND", `${event ? String(event.circuit.round).padStart(2, "0") : "—"}/22`],
              ["DRIVERS", "22"],
              ["TEAMS", "11"],
              ["CIRCUITS", "22"],
            ].map(([l, v], i) => (
              <div
                key={i}
                style={{
                  borderRight: i < 3 ? `1px solid ${F1.line}` : "none",
                  paddingLeft: i ? 20 : 0,
                  paddingRight: 20,
                }}
              >
                <DataLabel>{l}</DataLabel>
                <div style={{ marginTop: 8 }}>
                  <StatValue size={36}>{v}</StatValue>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Up next + championship ticker */}
        <div ref={tickerRef} className="flex flex-col gap-4 min-w-0">
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
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-2.5">
                  <LiveDot />
                  <Mono style={{ color: F1.red, fontSize: 11, letterSpacing: "0.2em" }}>
                    UP NEXT · ROUND {String(nextRace.round).padStart(2, "0")}
                  </Mono>
                </span>
                {tick && (
                  <Mono style={{ color: F1.fg3, fontSize: 10, letterSpacing: "0.16em" }}>
                    IN {tick.d}D {pad(tick.h)}H
                  </Mono>
                )}
              </div>
              <div
                className="font-display"
                style={{
                  fontSize: 38,
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

              {/* Countdown digits */}
              {tick && (
                <div
                  className="flex"
                  style={{
                    marginTop: 18,
                    gap: 10,
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {[
                    [pad(tick.d), "DAYS"],
                    [pad(tick.h), "HRS"],
                    [pad(tick.m), "MIN"],
                    [pad(tick.s), "SEC"],
                  ].map(([v, l], i) => (
                    <div key={i} style={{ flex: 1, textAlign: "center" }}>
                      <div
                        style={{
                          background: F1.bg,
                          padding: "6px 0",
                          fontSize: 30,
                          fontWeight: 700,
                          color: F1.fg,
                          letterSpacing: "-0.02em",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {v}
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
                          padding: "5px 12px",
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

      {/* Bottom red ticker tape */}
      <div
        className="relative mt-20 font-mono overflow-hidden"
        style={{
          background: F1.red,
          color: F1.ink,
          padding: "10px 24px",
          fontSize: 11,
          letterSpacing: "0.18em",
          whiteSpace: "nowrap",
          display: "flex",
          gap: 32,
        }}
      >
        <span>● 2026 SEASON · 22 ROUNDS · 11 TEAMS · 22 DRIVERS</span>
        <span>● LIVE TIMING POWERED BY OPENF1</span>
        <span>● HISTORICAL DATA · JOLPICA F1</span>
        <span>● BUILT FOR SPEED</span>
      </div>
    </section>
  );
}
