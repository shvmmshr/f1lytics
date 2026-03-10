"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { staggerEntrance } from "@/lib/gsap";

export function DriversGrid({ children }: { children: React.ReactNode }) {
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!gridRef.current) return;
      staggerEntrance("[data-animate='driver-card']", gridRef.current);
    },
    { scope: gridRef }
  );

  return (
    <div
      ref={gridRef}
      className="mx-auto flex max-w-4xl flex-col gap-3"
    >
      {children}
    </div>
  );
}
