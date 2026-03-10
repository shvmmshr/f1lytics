"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { staggerEntrance } from "@/lib/gsap";

export function CircuitsGrid({ children }: { children: React.ReactNode }) {
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!gridRef.current) return;
      staggerEntrance("[data-animate='circuit-card']", gridRef.current);
    },
    { scope: gridRef }
  );

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      {children}
    </div>
  );
}
