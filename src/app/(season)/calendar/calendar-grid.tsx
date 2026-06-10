"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { staggerEntrance } from "@/lib/gsap";
import { F1 } from "@/components/shared/broadcast";

/** Client wrapper that scroll-reveals the season race cards with a GSAP stagger. */
export function CalendarGrid({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (ref.current) staggerEntrance("[data-cal-card]", ref.current);
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      className="grid hairline-cells"
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        border: `1px solid ${F1.line}`,
      }}
    >
      {children}
    </div>
  );
}
