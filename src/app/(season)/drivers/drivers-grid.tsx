"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { staggerEntrance } from "@/lib/gsap";

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
      className="grid hairline-cells"
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))",
      }}
    >
      {children}
    </div>
  );
}
