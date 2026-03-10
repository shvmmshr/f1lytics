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

function countryCodeToFlag(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return "";
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}

export function DriverCard({ driver, points, position }: DriverCardProps) {
  const team = TEAMS[driver.teamId];
  const isPodium = position !== undefined && position <= 3;

  return (
    <Link href={`/drivers/${driver.slug}`}>
      <div
        data-animate="driver-card"
        className="group relative overflow-hidden rounded-xl border border-border-subtle bg-bg-secondary transition-all duration-300 hover:border-transparent hover:shadow-lg"
        style={{
          ["--team-color" as string]: team.color,
        }}
      >
        {/* Top team color accent line */}
        <div
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{ backgroundColor: team.color }}
        />

        {/* Background: large driver number watermark */}
        <div
          className="pointer-events-none absolute -right-4 -top-4 select-none font-mono text-[120px] font-black leading-none opacity-[0.04] transition-opacity duration-300 group-hover:opacity-[0.08]"
          style={{ color: team.color }}
        >
          {driver.number}
        </div>

        <div className="relative flex items-center gap-4 p-4 sm:p-5">
          {/* Position badge */}
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-mono text-lg font-bold"
            style={{
              backgroundColor: isPodium ? team.color + "20" : undefined,
              color: isPodium ? team.color : "var(--color-text-muted)",
              border: isPodium
                ? `1px solid ${team.color}40`
                : "1px solid var(--color-border-subtle)",
            }}
          >
            {position ?? "-"}
          </div>

          {/* Team logo */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center">
            <Image
              src={team.logo}
              alt={team.name}
              width={32}
              height={32}
              className="object-contain opacity-60 transition-opacity group-hover:opacity-100"
              unoptimized
            />
          </div>

          {/* Driver info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm text-text-secondary">
                {driver.firstName}
              </span>
              <span className="text-base font-bold tracking-tight text-text-primary">
                {driver.lastName.toUpperCase()}
              </span>
              <span className="ml-1 text-xs text-text-muted">
                {countryCodeToFlag(driver.countryCode)}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: team.color }}
              />
              <span className="text-xs text-text-muted">{team.name}</span>
              <span className="font-mono text-xs text-text-muted opacity-50">
                #{driver.number}
              </span>
            </div>
          </div>

          {/* Points */}
          <div className="shrink-0 text-right">
            {points !== undefined ? (
              <div>
                <p className="font-mono text-2xl font-bold text-text-primary">
                  {points}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-text-muted">
                  PTS
                </p>
              </div>
            ) : (
              <p className="font-mono text-lg text-text-muted">&mdash;</p>
            )}
          </div>
        </div>

        {/* Bottom hover glow */}
        <div
          className="absolute inset-x-0 bottom-0 h-16 translate-y-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
          style={{
            background: `linear-gradient(to top, ${team.color}10, transparent)`,
          }}
        />
      </div>
    </Link>
  );
}
