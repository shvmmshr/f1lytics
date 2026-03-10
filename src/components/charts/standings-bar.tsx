"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { useGSAP } from "@gsap/react";
import { barFill } from "@/lib/gsap";

export interface StandingsBarEntry {
  id: string;
  label: string;
  sublabel?: string;
  position: number;
  points: number;
  color: string;
  wins?: number;
}

interface StandingsBarProps {
  entries: StandingsBarEntry[];
  emptyLabel?: string;
}

export function StandingsBar({
  entries,
  emptyLabel = "Standings data is not available right now.",
}: StandingsBarProps) {
  const listRef = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      if (!listRef.current) return;
      const bars = listRef.current.querySelectorAll<HTMLElement>("[data-bar]");
      bars.forEach((bar) => {
        const target = parseFloat(bar.dataset.target || "0");
        barFill(bar, target);
      });
    },
    { scope: listRef }
  );

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border-subtle bg-bg-secondary p-6">
        <p className="text-sm text-text-muted">{emptyLabel}</p>
      </div>
    );
  }

  const maxPoints = Math.max(...entries.map((entry) => entry.points), 1);

  return (
    <ol ref={listRef} className="space-y-3">
      {entries.map((entry) => {
        const widthPercent = Math.max((entry.points / maxPoints) * 100, 2);

        return (
          <motion.li
            key={entry.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border-subtle bg-bg-secondary p-4"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
                  P{entry.position}
                </p>
                <p className="truncate text-lg font-semibold text-text-primary">
                  {entry.label}
                </p>
                {entry.sublabel && (
                  <p className="truncate text-sm text-text-secondary">
                    {entry.sublabel}
                  </p>
                )}
              </div>

              <div className="text-right">
                <p className="font-mono text-xl font-bold text-text-primary">
                  {entry.points.toFixed(1)}
                </p>
                {entry.wins !== undefined && (
                  <p className="text-xs text-text-muted">
                    {entry.wins} {entry.wins === 1 ? "win" : "wins"}
                  </p>
                )}
              </div>
            </div>

            <div className="h-2 rounded-full bg-bg-tertiary">
              <div
                data-bar
                data-target={widthPercent}
                className="h-2 rounded-full"
                style={{
                  width: "0%",
                  backgroundColor: entry.color,
                }}
              />
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
