"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { barFill } from "@/lib/gsap";
import { F1 } from "@/components/shared/broadcast";

interface AnimatedBarProps {
  widthPercent: number;
  color: string;
  height?: number | string;
  track?: string;
}

export function AnimatedBar({
  widthPercent,
  color,
  height = 3,
  track = F1.bg3,
}: AnimatedBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const clamped = Math.max(0, Math.min(100, widthPercent));

  useGSAP(
    () => {
      if (!barRef.current) return;
      barFill(barRef.current, clamped);
    },
    { scope: containerRef, dependencies: [clamped] }
  );

  return (
    <div
      ref={containerRef}
      style={{ height, background: track, width: "100%", overflow: "hidden" }}
    >
      <div
        ref={barRef}
        style={{
          height: "100%",
          width: "0%",
          background: color,
        }}
      />
    </div>
  );
}
