"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (!lineRef.current) return;

      gsap.from(lineRef.current, {
        scaleX: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 85%",
        },
      });
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="mb-10">
      <h1 className="text-4xl font-bold tracking-[-0.05em] text-text-primary md:text-5xl">
        {title}
      </h1>
      <span
        ref={lineRef}
        className="mt-3 block h-[2px] w-16 origin-left bg-status-red"
        aria-hidden="true"
      />
      {subtitle && (
        <p className="mt-3 text-lg text-text-secondary">{subtitle}</p>
      )}
    </div>
  );
}
