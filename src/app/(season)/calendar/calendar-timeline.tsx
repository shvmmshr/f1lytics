"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

export function CalendarTimeline({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current || !lineRef.current) return;

      // Timeline line draws on scroll
      gsap.fromTo(
        lineRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
            end: "bottom 20%",
            scrub: true,
          },
        }
      );

      // Animate cards from their respective sides
      const cards =
        containerRef.current.querySelectorAll("[data-animate='calendar-card']");
      cards.forEach((card) => {
        const side = card.getAttribute("data-side");
        gsap.from(card, {
          x: side === "left" ? -30 : 30,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
          },
        });
      });
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Center timeline line (left on mobile, center on desktop) */}
      <div
        ref={lineRef}
        className="absolute left-3 top-0 bottom-0 w-px origin-top bg-border-subtle md:left-1/2 md:-translate-x-1/2"
      />
      <div className="space-y-4 md:space-y-6">{children}</div>
    </div>
  );
}
