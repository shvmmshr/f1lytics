"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

interface MapDot {
  id: string;
  x: number;
  y: number;
  r: number;
  fill: string;
  label: string;
}

interface AnimatedMapProps {
  dots: MapDot[];
}

export function AnimatedMap({ dots }: AnimatedMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      if (!svgRef.current) return;
      const circles = svgRef.current.querySelectorAll("[data-dot]");
      gsap.from(circles, {
        scale: 0,
        opacity: 0,
        duration: 0.4,
        stagger: 0.04,
        ease: "back.out(1.7)",
        transformOrigin: "center center",
        scrollTrigger: {
          trigger: svgRef.current,
          start: "top 80%",
        },
      });
    },
    { scope: svgRef }
  );

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-border-subtle bg-bg-secondary p-4">
      <p className="mb-3 text-xs uppercase tracking-widest text-text-muted">
        World Map
      </p>
      <svg
        ref={svgRef}
        viewBox="0 0 1000 500"
        className="h-auto w-full rounded-xl border border-border-subtle bg-bg-primary"
        role="img"
        aria-label="World map with Formula 1 circuit locations"
      >
        <defs>
          <pattern
            id="grid"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          </pattern>
          <radialGradient id="mapGlow" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="1000" height="500" fill="url(#grid)" />
        <ellipse cx="500" cy="250" rx="430" ry="190" fill="url(#mapGlow)" />

        {dots.map((dot) => (
          <g key={dot.id} className="group cursor-pointer">
            <circle
              data-dot
              cx={dot.x}
              cy={dot.y}
              r={dot.r}
              fill={dot.fill}
              opacity={0.95}
            />
            {/* Tooltip background */}
            <rect
              x={dot.x - 60}
              y={dot.y - 28}
              width="120"
              height="20"
              rx="4"
              fill="rgba(12,12,14,0.9)"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
              className="pointer-events-none opacity-0 transition-opacity group-hover:opacity-100"
            />
            {/* Tooltip text */}
            <text
              x={dot.x}
              y={dot.y - 15}
              textAnchor="middle"
              fill="#F4F4F5"
              fontSize="10"
              fontFamily="var(--font-sans)"
              className="pointer-events-none opacity-0 transition-opacity group-hover:opacity-100"
            >
              {dot.label}
            </text>
          </g>
        ))}
      </svg>
    </section>
  );
}
