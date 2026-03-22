"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import Image from "next/image";
import Link from "next/link";
import { getNextEvent } from "@/lib/constants";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLSpanElement>(null);
  const lockRef = useRef<HTMLSpanElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

  const event = getNextEvent();
  const nextRace = event?.circuit;

  useGSAP(
    () => {
      gsap.set(subtitleRef.current, { y: 20 });
      gsap.set(ctaRef.current, { y: 20 });
      if (infoRef.current) gsap.set(infoRef.current, { y: 20 });

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        delay: 0.15,
      });

      tl.fromTo(
        imageRef.current,
        { scale: 1.08, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.4, ease: "power2.out" },
        0
      )
        .to(gridRef.current, { clipPath: "inset(0 0% 0 0)", duration: 0.6 }, 0.3)
        .to(lockRef.current, { clipPath: "inset(0 0% 0 0)", duration: 0.6 }, 0.5)
        .to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.5 }, 1.0)
        .to(ctaRef.current, { opacity: 1, y: 0, duration: 0.5 }, 1.15)
        .to(infoRef.current, { opacity: 1, y: 0, duration: 0.5 }, 1.3);
    },
    { scope: heroRef }
  );

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-screen items-center overflow-hidden"
    >
      {/* Background image — pushed to right half */}
      <div ref={imageRef} className="absolute inset-0 opacity-0">
        <Image
          src="/hero-bg.avif"
          alt=""
          fill
          priority
          unoptimized
          className="object-cover object-[75%_center]"
          sizes="100vw"
        />
        {/* Overall darken */}
        <div className="absolute inset-0 bg-black/40" />
        {/* Strong left-to-right fade — keeps text area clean */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, var(--color-bg-primary) 0%, var(--color-bg-primary) 15%, transparent 55%)",
          }}
        />
        {/* Bottom fade into page */}
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[var(--color-bg-primary)] to-transparent" />
        {/* Top subtle fade */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[var(--color-bg-primary)]/60 to-transparent" />
      </div>

      {/* Subtle red ambient glow behind car area */}
      <div
        className="pointer-events-none absolute right-[10%] top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full opacity-[0.06] blur-[120px]"
        style={{ background: "var(--color-status-red)" }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          {/* Season tag */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-status-red" />
            <span className="text-xs font-medium tracking-wider text-text-secondary">
              2026 SEASON
            </span>
          </div>

          <h1 className="text-6xl font-bold tracking-display sm:text-7xl md:text-8xl lg:text-9xl">
            <span
              ref={gridRef}
              className="inline-block"
              style={{ clipPath: "inset(0 100% 0 0)" }}
            >
              F1
            </span>
            <span
              ref={lockRef}
              className="inline-block text-status-red"
              style={{ clipPath: "inset(0 100% 0 0)" }}
            >
              LYTICS
            </span>
          </h1>

          <p
            ref={subtitleRef}
            className="mt-4 max-w-md text-base text-text-secondary opacity-0 sm:text-lg"
          >
            Real-time standings, race results, driver stats, and live timing for
            the 2026 Formula 1 World Championship.
          </p>

          <div ref={ctaRef} className="mt-8 flex gap-4 opacity-0">
            <Link
              href="/calendar"
              className="rounded-lg bg-status-red px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 hover:shadow-[0_0_24px_var(--color-glow-red)]"
            >
              Explore Season
            </Link>
            <Link
              href="/live"
              className="rounded-lg border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-text-primary backdrop-blur-sm transition-all hover:border-status-red/50 hover:shadow-[0_0_24px_var(--color-glow-red)]"
            >
              Live Timing
            </Link>
          </div>

          {/* Next race info */}
          {nextRace && (
            <div
              ref={infoRef}
              className="mt-10 flex items-center gap-4 rounded-lg border border-white/5 bg-white/[0.03] px-4 py-3 opacity-0 backdrop-blur-sm"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-status-red/20 font-mono text-xs font-bold text-status-red">
                R{nextRace.round}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary">
                  {nextRace.fullName}
                </p>
                <p className="text-xs text-text-muted">
                  {nextRace.name} · {formatDate(nextRace.raceDate)}
                  {nextRace.isSprint && (
                    <span className="ml-2 text-status-yellow">Sprint Weekend</span>
                  )}
                </p>
              </div>
              <Link
                href={`/circuits/${nextRace.slug}`}
                className="shrink-0 text-xs font-medium text-status-red transition-colors hover:text-white"
              >
                Details &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
