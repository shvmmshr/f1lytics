"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { staggerEntrance } from "@/lib/gsap";
import { F1 } from "@/components/shared/broadcast";

interface TeamsGridProps {
  children: React.ReactNode;
}

export function TeamsGrid({ children }: TeamsGridProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      staggerEntrance("[data-team-card]", ref.current);
    },
    { scope: ref }
  );

  return (
    <div
      ref={ref}
      className="grid hairline-cells grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
      style={{
        borderTop: `1px solid ${F1.line}`,
        borderBottom: `1px solid ${F1.line}`,
      }}
    >
      {children}
    </div>
  );
}
