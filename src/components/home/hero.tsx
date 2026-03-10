"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import Image from "next/image";
import Link from "next/link";

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLSpanElement>(null);
  const lockRef = useRef<HTMLSpanElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.set(subtitleRef.current, { y: 20 });
      gsap.set(ctaRef.current, { y: 20 });

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        delay: 0.15,
      });

      tl
        // Background image scales down from slight zoom
        .fromTo(
          imageRef.current,
          { scale: 1.1, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1.2, ease: "power2.out" },
          0
        )

        // "GRID" text wipe reveal
        .to(
          gridRef.current,
          { clipPath: "inset(0 0% 0 0)", duration: 0.6 },
          0.3
        )

        // "LOCK" text wipe reveal
        .to(
          lockRef.current,
          { clipPath: "inset(0 0% 0 0)", duration: 0.6 },
          0.5
        )

        // Subtitle fade up
        .to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.5 }, 1.0)

        // CTA buttons fade up
        .to(ctaRef.current, { opacity: 1, y: 0, duration: 0.5 }, 1.2);
    },
    { scope: heroRef }
  );

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-screen items-center overflow-hidden"
    >
      {/* Hero background image */}
      <div ref={imageRef} className="absolute inset-0 opacity-0">
        <Image
          src="/hero-bg.avif"
          alt=""
          fill
          priority
          unoptimized
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Darken overlay so text remains readable */}
        <div className="absolute inset-0 bg-black/50" />
        {/* Bottom gradient fade into page bg */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[var(--color-bg-primary)] to-transparent" />
        {/* Left gradient for text readability */}
        <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-[var(--color-bg-primary)]/80 to-transparent" />
      </div>


      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h1 className="text-6xl font-bold tracking-display sm:text-7xl md:text-8xl lg:text-9xl">
            <span
              ref={gridRef}
              className="inline-block"
              style={{ clipPath: "inset(0 100% 0 0)" }}
            >
              GRID
            </span>
            <span
              ref={lockRef}
              className="inline-block text-status-red"
              style={{ clipPath: "inset(0 100% 0 0)" }}
            >
              LOCK
            </span>
          </h1>

          <p
            ref={subtitleRef}
            className="mt-4 text-lg text-text-secondary opacity-0 sm:text-xl"
          >
            2026 F1 Season Dashboard
          </p>

          <div ref={ctaRef} className="mt-8 flex gap-4 opacity-0">
            <Link
              href="/calendar"
              className="rounded-lg bg-status-red px-6 py-3 text-sm font-semibold text-white transition-shadow hover:shadow-[0_0_20px_var(--color-glow-red)]"
            >
              Explore Season
            </Link>
            <Link
              href="/live"
              className="rounded-lg border border-white/10 px-6 py-3 text-sm font-semibold text-text-primary transition-all hover:border-status-red/50 hover:shadow-[0_0_20px_var(--color-glow-red)]"
            >
              Live Timing
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
