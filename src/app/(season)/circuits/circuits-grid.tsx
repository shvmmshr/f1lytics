"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { staggerEntrance } from "@/lib/gsap";
import { F1 } from "@/components/shared/broadcast";

interface CircuitsGridProps {
  children: React.ReactNode;
}

export function CircuitsGrid({ children }: CircuitsGridProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      staggerEntrance("[data-circuit-card]", ref.current);
    },
    { scope: ref }
  );

  return (
    <div
      ref={ref}
      className="grid hairline-cells"
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        borderTop: `1px solid ${F1.line}`,
      }}
    >
      {children}
    </div>
  );
}
