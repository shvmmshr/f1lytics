"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, barFill } from "@/lib/gsap";
import { getTeamColor } from "@/lib/utils";

interface ChampionshipSnapshotProps {
  driverStandings: Array<{
    position: number;
    name: string;
    teamId: string;
    points: number;
  }>;
  constructorStandings: Array<{
    position: number;
    name: string;
    teamId: string;
    points: number;
  }>;
}

export function ChampionshipSnapshot({
  driverStandings,
  constructorStandings,
}: ChampionshipSnapshotProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      const bars = sectionRef.current.querySelectorAll<HTMLElement>(
        "[data-bar]"
      );
      bars.forEach((bar) => {
        const target = Number(bar.dataset.barWidth);
        barFill(bar, target);
      });
    },
    { scope: sectionRef }
  );

  const maxDriverPoints =
    driverStandings.length > 0 ? driverStandings[0].points : 1;
  const maxConstructorPoints =
    constructorStandings.length > 0 ? constructorStandings[0].points : 1;

  return (
    <section ref={sectionRef} className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-text-primary mb-10 text-center">
          Championship Battle
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Drivers Column */}
          <div>
            <h3 className="text-lg font-semibold text-text-secondary mb-4">
              Drivers
            </h3>
            <div className="space-y-3">
              {driverStandings.map((entry) => {
                const color = getTeamColor(entry.teamId);
                const widthPct =
                  maxDriverPoints > 0
                    ? (entry.points / maxDriverPoints) * 100
                    : 0;

                return (
                  <div key={entry.position} className="flex items-center gap-3">
                    <span className="w-6 text-sm font-mono text-text-muted text-right">
                      {entry.position}
                    </span>
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm font-medium text-text-primary w-36 truncate">
                      {entry.name}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-bg-tertiary overflow-hidden">
                      <div
                        data-bar
                        data-bar-width={widthPct}
                        className="h-full rounded-full"
                        style={{ backgroundColor: color, width: "0%" }}
                      />
                    </div>
                    <span className="text-sm font-mono text-text-secondary w-12 text-right">
                      {entry.points}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Constructors Column */}
          <div>
            <h3 className="text-lg font-semibold text-text-secondary mb-4">
              Constructors
            </h3>
            <div className="space-y-3">
              {constructorStandings.map((entry) => {
                const color = getTeamColor(entry.teamId);
                const widthPct =
                  maxConstructorPoints > 0
                    ? (entry.points / maxConstructorPoints) * 100
                    : 0;

                return (
                  <div key={entry.position} className="flex items-center gap-3">
                    <span className="w-6 text-sm font-mono text-text-muted text-right">
                      {entry.position}
                    </span>
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm font-medium text-text-primary w-36 truncate">
                      {entry.name}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-bg-tertiary overflow-hidden">
                      <div
                        data-bar
                        data-bar-width={widthPct}
                        className="h-full rounded-full"
                        style={{ backgroundColor: color, width: "0%" }}
                      />
                    </div>
                    <span className="text-sm font-mono text-text-secondary w-12 text-right">
                      {entry.points}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
