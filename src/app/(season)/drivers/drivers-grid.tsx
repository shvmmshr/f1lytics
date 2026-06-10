"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { staggerEntrance } from "@/lib/gsap";
import { F1 } from "@/components/shared/broadcast";

export function DriversGrid({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      staggerEntrance("[data-driver-card]", ref.current);
    },
    { scope: ref }
  );

  return (
    <div
      ref={ref}
      className="grid"
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 1,
        background: F1.line,
      }}
    >
      {children}
    </div>
  );
}
