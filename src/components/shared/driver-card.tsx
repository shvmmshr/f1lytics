"use client";

import Link from "next/link";
import Image from "next/image";
import { TEAMS } from "@/lib/constants";
import type { Driver } from "@/lib/constants/drivers";

interface DriverCardProps {
  driver: Driver;
  points?: number;
  position?: number;
}

export function DriverCard({ driver, points, position }: DriverCardProps) {
  const team = TEAMS[driver.teamId];
  const isPodium = position !== undefined && position <= 3;

  return (
    <Link href={`/drivers/${driver.slug}`}>
      <div className="group relative overflow-hidden rounded-lg border border-border-subtle bg-bg-secondary transition-colors duration-200 hover:bg-bg-tertiary">
        {/* Left team color accent */}
        <div
          className="absolute inset-y-0 left-0 w-1"
          style={{ backgroundColor: team.color }}
        />

        {/* Large number watermark */}
        <div
          className="pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2 select-none font-mono text-[80px] font-black leading-none opacity-[0.04]"
          style={{ color: team.color }}
        >
          {driver.number}
        </div>

        <div className="relative flex items-center gap-4 py-3 pl-5 pr-4">
          {/* Position */}
          <span
            className="w-6 shrink-0 text-center font-mono text-base font-bold"
            style={{ color: isPodium ? team.color : "var(--color-text-muted)" }}
          >
            {position ?? "-"}
          </span>

          {/* Driver headshot */}
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border-subtle bg-bg-primary">
            <Image
              src={driver.image}
              alt={`${driver.firstName} ${driver.lastName}`}
              fill
              className="object-cover object-top"
              unoptimized
            />
          </div>

          {/* Driver name */}
          <div className="min-w-0 flex-1">
            <span className="text-sm text-text-secondary">
              {driver.firstName}{" "}
            </span>
            <span className="text-sm font-bold tracking-tight text-text-primary">
              {driver.lastName.toUpperCase()}
            </span>
            <span className="ml-2 text-xs text-text-muted">{team.name}</span>
          </div>

          {/* Points */}
          <div className="shrink-0 text-right">
            {points !== undefined ? (
              <span className="font-mono text-base font-bold text-text-primary">
                {points}
                <span className="ml-1 text-[10px] font-normal uppercase tracking-widest text-text-muted">
                  pts
                </span>
              </span>
            ) : (
              <span className="font-mono text-sm text-text-muted">&mdash;</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
