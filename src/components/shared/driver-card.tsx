"use client";

import Link from "next/link";
import { TEAMS } from "@/lib/constants";
import type { Driver } from "@/lib/constants/drivers";

interface DriverCardProps {
  driver: Driver;
  points?: number;
  position?: number;
}

export function DriverCard({ driver, points, position }: DriverCardProps) {
  const team = TEAMS[driver.teamId];

  return (
    <Link href={`/drivers/${driver.slug}`}>
      <div
        data-animate="driver-card"
        className="group relative overflow-hidden rounded-lg border border-border-subtle bg-bg-secondary transition-all duration-200 hover:scale-[1.02] hover:-translate-y-1"
        style={{
          borderLeftWidth: "3px",
          borderLeftColor: team.color,
          boxShadow: "0 0 0 0 transparent",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${team.color}33`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 0 transparent";
        }}
      >
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              {position !== undefined && (
                <span className="font-mono text-xs text-text-muted">
                  P{position}
                </span>
              )}
              <p className="text-sm text-text-secondary">{driver.firstName}</p>
              <p className="text-lg font-bold tracking-[-0.05em] text-text-primary">
                {driver.lastName.toUpperCase()}
              </p>
            </div>
            <span
              className="font-mono text-4xl font-bold opacity-[0.08]"
              style={{ color: team.color }}
            >
              {driver.number}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-text-muted">{team.name}</span>
            {points !== undefined && (
              <span className="font-mono text-sm font-bold text-text-primary">
                {points} PTS
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
