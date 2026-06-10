"use client";

import type { OpenF1Stint } from "@/lib/api/types";
import { F1, Mono } from "@/components/shared/broadcast";

interface TireStrategyDriver {
  driverNumber: number;
  label: string;
}

interface TireStrategyVizProps {
  stints: OpenF1Stint[];
  drivers?: TireStrategyDriver[];
}

const COMPOUND_COLORS: Record<string, string> = {
  soft: "#EF4444",
  medium: "#EAB308",
  hard: "#F4F4F5",
  intermediate: "#22C55E",
  wet: "#3B82F6",
};

function getCompoundColor(compound: string): string {
  const normalized = compound.toLowerCase().trim();
  return COMPOUND_COLORS[normalized] ?? "#6B7280";
}

function getDriverLabel(driverNumber: number, drivers: TireStrategyDriver[]): string {
  const match = drivers.find((driver) => driver.driverNumber === driverNumber);
  return match?.label ?? `#${driverNumber}`;
}

export function TireStrategyViz({ stints, drivers = [] }: TireStrategyVizProps) {
  if (stints.length === 0) {
    return (
      <div
        style={{
          minHeight: 200,
          background: F1.bg2,
          border: `1px solid ${F1.line}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <Mono style={{ fontSize: 13, color: F1.fg2, letterSpacing: "0.2em", fontWeight: 600 }}>
          NO DATA
        </Mono>
        <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.14em" }}>
          OPENF1 DATA AVAILABLE AFTER SESSION ENDS
        </Mono>
      </div>
    );
  }

  const grouped = stints.reduce<Record<number, OpenF1Stint[]>>((acc, stint) => {
    const next = acc[stint.driver_number] ?? [];
    return {
      ...acc,
      [stint.driver_number]: [...next, stint].sort((a, b) => a.stint_number - b.stint_number),
    };
  }, {});

  const maxLap = Math.max(...stints.map((stint) => stint.lap_end), 1);
  const driverNumbers = Object.keys(grouped)
    .map((value) => Number.parseInt(value, 10))
    .sort((a, b) => a - b);

  return (
    <div style={{ background: "#141418", border: "1px solid #27272A", padding: 20 }}>
      <div className="mb-4 flex flex-wrap gap-3 text-xs uppercase tracking-widest text-zinc-500">
        {Object.entries(COMPOUND_COLORS).map(([compound, color]) => (
          <span key={compound} className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            {compound}
          </span>
        ))}
      </div>

      <div className="space-y-3">
        {driverNumbers.map((driverNumber) => {
          const driverStints = grouped[driverNumber] ?? [];

          return (
            <div key={driverNumber} className="grid grid-cols-[72px_1fr] items-center gap-3">
              <p className="font-mono text-xs text-text-secondary">
                {getDriverLabel(driverNumber, drivers)}
              </p>
              <div className="relative flex h-8 overflow-hidden rounded-md bg-bg-tertiary">
                {driverStints.map((stint, index) => {
                  const stintLaps = Math.max(stint.lap_end - stint.lap_start + 1, 1);
                  const width = (stintLaps / maxLap) * 100;
                  const color = getCompoundColor(stint.compound);

                  return (
                    <div
                      key={`${driverNumber}-${stint.stint_number}-${stint.lap_start}`}
                      className="relative flex items-center justify-center text-[10px] font-semibold text-black"
                      style={{
                        width: `${width}%`,
                        backgroundColor: color,
                      }}
                      title={`${stint.compound} · laps ${stint.lap_start}-${stint.lap_end}`}
                    >
                      {stint.compound.slice(0, 1).toUpperCase()}
                      {index < driverStints.length - 1 && (
                        <span className="absolute top-0 right-0 h-full w-px bg-black/40" />
                      )}
                    </div>
                  );
                })}

                {driverStints.slice(0, -1).map((stint) => {
                  const pitLap = stint.lap_end;
                  const left = (pitLap / maxLap) * 100;

                  return (
                    <span
                      key={`${driverNumber}-pit-${pitLap}-${stint.stint_number}`}
                      className="pointer-events-none absolute top-0 h-full w-0.5 bg-status-blue"
                      style={{ left: `${left}%` }}
                      title={`Pit stop after lap ${pitLap}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
