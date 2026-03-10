"use client";

import { useRef, useState, lazy, Suspense } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import Link from "next/link";
import type { F1CarSceneHandle } from "@/components/three/f1-car-scene";

const F1CarScene = lazy(() =>
  import("@/components/three/f1-car-scene").then((mod) => ({
    default: mod.F1CarScene,
  }))
);

const speedLines = [
  { width: "60%", top: "45%", opacity: 0.4 },
  { width: "80%", top: "48%", opacity: 0.6 },
  { width: "45%", top: "50%", opacity: 0.3 },
  { width: "70%", top: "52%", opacity: 0.5 },
  { width: "55%", top: "55%", opacity: 0.35 },
  { width: "40%", top: "57%", opacity: 0.25 },
];

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const speedLinesRef = useRef<HTMLDivElement>(null);
  const streakRef = useRef<SVGSVGElement>(null);
  const gridRef = useRef<HTMLSpanElement>(null);
  const lockRef = useRef<HTMLSpanElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<F1CarSceneHandle>(null);

  const [particlesActive, setParticlesActive] = useState(false);

  useGSAP(
    () => {
      // Set initial states for animated elements
      gsap.set(subtitleRef.current, { y: 20 });
      gsap.set(ctaRef.current, { y: 20 });

      // Small delay for lazy-loaded 3D scene to mount
      const timer = setTimeout(() => {
        const carGroup = sceneRef.current?.carGroup;
        if (!carGroup) return;

        // Start car off-screen right
        carGroup.position.x = 15;

        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl
          // Car drives in from right to center
          .to(carGroup.position, { x: 0, duration: 1.5 }, 0)

          // Red light streak traces car path
          .to(streakRef.current, { opacity: 1, duration: 0.2 }, 0.7)
          .to(
            streakRef.current?.querySelector("line"),
            {
              strokeDashoffset: 0,
              duration: 0.8,
              ease: "power2.inOut",
            },
            0.8
          )

          // "GRID" text wipe reveal
          .to(
            gridRef.current,
            {
              clipPath: "inset(0 0% 0 0)",
              duration: 0.6,
            },
            1.0
          )

          // "LOCK" text wipe reveal
          .to(
            lockRef.current,
            {
              clipPath: "inset(0 0% 0 0)",
              duration: 0.6,
            },
            1.2
          )

          // Trigger particle burst
          .call(() => setParticlesActive(true), [], 1.3)

          // Speed lines fade in
          .to(speedLinesRef.current, { opacity: 1, duration: 0.3 }, 1.5)

          // Fade streak back out
          .to(streakRef.current, { opacity: 0, duration: 0.5 }, 2.0)

          // Subtitle fade up
          .to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.5 }, 2.0)

          // CTA buttons fade up
          .to(ctaRef.current, { opacity: 1, y: 0, duration: 0.5 }, 2.2);
      }, 300);

      return () => clearTimeout(timer);
    },
    { scope: heroRef }
  );

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Background Layer 1: Checkered pattern */}
      <div
        className="absolute inset-0 animate-checkered-fade"
        style={{
          background:
            "repeating-conic-gradient(rgba(255,255,255,0.03) 0% 25%, transparent 0% 50%) 0 0 / 40px 40px",
        }}
      />

      {/* Background Layer 2: Dark radial gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, var(--color-bg-primary) 70%)",
        }}
      />

      {/* Speed Lines */}
      <div
        ref={speedLinesRef}
        className="absolute right-0 top-1/2 -translate-y-1/2 w-full h-full opacity-0"
      >
        {speedLines.map((line, i) => (
          <div
            key={i}
            className="absolute right-0"
            style={{
              width: line.width,
              top: line.top,
              height: i % 2 === 0 ? "1px" : "2px",
              opacity: line.opacity,
              background:
                "linear-gradient(to left, var(--color-status-red), transparent)",
            }}
          />
        ))}
      </div>

      {/* Red light streak SVG */}
      <svg
        ref={streakRef}
        className="absolute top-1/2 left-0 w-full h-4 -translate-y-1/2 opacity-0"
      >
        <line
          x1="100%"
          y1="50%"
          x2="50%"
          y2="50%"
          stroke="var(--color-status-red)"
          strokeWidth="2"
          strokeDasharray="1000"
          strokeDashoffset="1000"
        />
      </svg>

      {/* 3D Car Scene */}
      <div className="absolute inset-0 md:left-1/3">
        <Suspense fallback={null}>
          <F1CarScene ref={sceneRef} particlesActive={particlesActive} />
        </Suspense>
      </div>

      {/* Content overlay */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-2xl">
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-display">
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
            className="mt-4 text-lg sm:text-xl text-text-secondary opacity-0"
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
