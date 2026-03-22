"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { getNextEvent } from "@/lib/constants/circuits";
import { CountdownTimer } from "@/components/shared/countdown-timer";
import { TEAMS } from "@/lib/constants";
import { useLiveSession } from "@/hooks/use-live-session";
import type { OpenF1Position, OpenF1Interval, OpenF1Driver } from "@/lib/api/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRaceDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dateStr}T00:00:00Z`));
}

function formatGap(gap: number | null): string {
  if (gap === null) return "---";
  return `+${gap.toFixed(3)}`;
}

function formatTimeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
}

/** Map OpenF1 team_name to a TEAMS key for color lookup */
function teamColorFromDriverTeam(teamName: string): string {
  const normalized = teamName.toLowerCase().replace(/\s+/g, "_");
  // Try direct match first
  if (TEAMS[normalized]) return TEAMS[normalized].color;
  // Fuzzy match against known team keys
  for (const [key, team] of Object.entries(TEAMS)) {
    if (
      normalized.includes(key) ||
      key.includes(normalized) ||
      team.name.toLowerCase().includes(teamName.toLowerCase()) ||
      teamName.toLowerCase().includes(team.name.toLowerCase())
    ) {
      return team.color;
    }
  }
  return "#27272A";
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PulsingDot() {
  return (
    <span className="relative flex h-3 w-3">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-red opacity-75" />
      <span className="relative inline-flex h-3 w-3 rounded-full bg-status-red" />
    </span>
  );
}

function StatusBadge({ status }: { status: "NO SESSION" | "LIVE" | "FINISHED" }) {
  const styles = {
    "NO SESSION": "bg-bg-tertiary text-text-muted",
    LIVE: "bg-status-red/20 text-status-red",
    FINISHED: "bg-status-green/20 text-status-green",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest ${styles[status]}`}
    >
      {status}
    </span>
  );
}

interface InfoCardProps {
  label: string;
  value: string;
}

function InfoCard({ label, value }: InfoCardProps) {
  return (
    <motion.div
      variants={item}
      className="rounded-xl border border-border-subtle bg-bg-secondary p-5"
    >
      <p className="text-[11px] font-medium uppercase tracking-widest text-text-muted">
        {label}
      </p>
      <p className="mt-2 font-mono text-lg font-bold text-text-primary">
        {value}
      </p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton for the position table
// ---------------------------------------------------------------------------

function PositionTableSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="mt-10 overflow-hidden rounded-2xl border border-border-subtle"
    >
      {/* Table header */}
      <div className="grid grid-cols-[3rem_1fr_1fr_6rem_6rem] gap-2 border-b border-border-subtle bg-bg-tertiary px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-text-muted">
        <span>Pos</span>
        <span>Driver</span>
        <span>Team</span>
        <span className="text-right">Gap</span>
        <span className="text-right">Interval</span>
      </div>

      {/* Skeleton rows */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-[3rem_1fr_1fr_6rem_6rem] items-center gap-2 border-b border-border-subtle/50 px-4 py-3"
        >
          <div className="h-4 w-6 animate-pulse rounded bg-bg-tertiary" />
          <div className="h-4 w-32 animate-pulse rounded bg-bg-tertiary" />
          <div className="h-4 w-24 animate-pulse rounded bg-bg-tertiary" />
          <div className="ml-auto h-4 w-16 animate-pulse rounded bg-bg-tertiary" />
          <div className="ml-auto h-4 w-16 animate-pulse rounded bg-bg-tertiary" />
        </div>
      ))}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Live position table with real data
// ---------------------------------------------------------------------------

interface LivePositionTableProps {
  positions: OpenF1Position[];
  intervals: OpenF1Interval[];
  drivers: OpenF1Driver[];
}

function LivePositionTable({ positions, intervals, drivers }: LivePositionTableProps) {
  // Build lookup maps
  const driverMap = useMemo(() => {
    const map = new Map<number, OpenF1Driver>();
    for (const d of drivers) {
      map.set(d.driver_number, d);
    }
    return map;
  }, [drivers]);

  const intervalMap = useMemo(() => {
    const map = new Map<number, OpenF1Interval>();
    for (const i of intervals) {
      map.set(i.driver_number, i);
    }
    return map;
  }, [intervals]);

  // Sort positions by position number
  const sortedPositions = useMemo(
    () => [...positions].sort((a, b) => a.position - b.position),
    [positions]
  );

  if (sortedPositions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-10 rounded-2xl border border-border-subtle bg-bg-secondary p-8 text-center"
      >
        <p className="text-sm text-text-secondary">
          Waiting for position data...
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="mt-10 overflow-hidden rounded-2xl border border-border-subtle"
    >
      {/* Table header */}
      <div className="grid grid-cols-[3rem_1fr_1fr_6rem_6rem] gap-2 border-b border-border-subtle bg-bg-tertiary px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-text-muted">
        <span>Pos</span>
        <span>Driver</span>
        <span>Team</span>
        <span className="text-right">Gap</span>
        <span className="text-right">Interval</span>
      </div>

      {/* Table rows */}
      {sortedPositions.map((pos) => {
        const driver = driverMap.get(pos.driver_number);
        const interval = intervalMap.get(pos.driver_number);
        const driverName = driver
          ? `${driver.name_acronym} ${driver.full_name.split(" ").pop()}`
          : `#${pos.driver_number}`;
        const teamName = driver?.team_name ?? "Unknown";
        const teamColor = driver
          ? teamColorFromDriverTeam(driver.team_name)
          : "#27272A";

        return (
          <div
            key={pos.driver_number}
            className="grid grid-cols-[3rem_1fr_1fr_6rem_6rem] items-center gap-2 border-b border-border-subtle/50 border-l-[3px] px-4 py-3 transition-colors hover:bg-bg-tertiary/50"
            style={{ borderLeftColor: teamColor }}
          >
            <span className="font-mono text-sm font-bold text-text-primary">
              {String(pos.position).padStart(2, "0")}
            </span>
            <span className="text-sm font-semibold text-text-primary">
              {driverName}
            </span>
            <span className="text-sm text-text-secondary">
              {teamName}
            </span>
            <span className="text-right font-mono text-sm tabular-nums text-text-secondary">
              {pos.position === 1 ? "LEADER" : formatGap(interval?.gap_to_leader ?? null)}
            </span>
            <span className="text-right font-mono text-sm tabular-nums text-text-secondary">
              {pos.position === 1 ? "---" : formatGap(interval?.interval ?? null)}
            </span>
          </div>
        );
      })}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function LiveContent() {
  const event = useMemo(() => getNextEvent(), []);
  const nextRace = event?.circuit;

  const {
    isLive,
    status,
    session,
    positions,
    intervals,
    drivers,
    loading,
    lastUpdated,
  } = useLiveSession();

  const showLiveData = status === "LIVE" || status === "FINISHED";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* ---------------------------------------------------------------- */}
      {/* Header                                                          */}
      {/* ---------------------------------------------------------------- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-wrap items-center gap-4"
      >
        <div className="flex items-center gap-3">
          {isLive && <PulsingDot />}
          <h1 className="text-4xl font-bold tracking-[-0.05em] text-text-primary md:text-5xl">
            Live Session
          </h1>
        </div>
        <StatusBadge status={status} />
      </motion.div>

      <motion.span
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mt-4 block h-[2px] w-16 origin-left bg-status-red"
        aria-hidden="true"
      />

      {/* ---------------------------------------------------------------- */}
      {/* Active / Recently Finished Session Info                          */}
      {/* ---------------------------------------------------------------- */}
      {showLiveData && session && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mt-10 rounded-2xl border border-border-subtle bg-bg-secondary p-6"
        >
          <p className="text-[11px] font-medium uppercase tracking-widest text-text-muted">
            {status === "LIVE" ? "Live Now" : "Recently Finished"}
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary">
            {session.name}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-secondary">
            <span className="flex items-center gap-2">
              <span className="text-text-muted">Circuit</span>
              {session.circuitShortName}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-text-muted">Location</span>
              {session.countryName}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-text-muted">Type</span>
              {session.type}
            </span>
          </div>
        </motion.div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Live / Finished Position Table                                   */}
      {/* ---------------------------------------------------------------- */}
      {showLiveData && loading && <PositionTableSkeleton />}

      {showLiveData && !loading && (
        <>
          <LivePositionTable
            positions={positions}
            intervals={intervals}
            drivers={drivers}
          />

          {/* Last updated indicator */}
          {lastUpdated && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-3 text-right text-xs text-text-muted"
            >
              Last updated {formatTimeSince(lastUpdated)}
            </motion.p>
          )}
        </>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Next Race Info Card (when no live session)                       */}
      {/* ---------------------------------------------------------------- */}
      {!showLiveData && nextRace && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mt-10 rounded-2xl border border-border-subtle bg-bg-secondary p-6"
        >
          <p className="text-[11px] font-medium uppercase tracking-widest text-text-muted">
            Next Event
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary">
            {nextRace.fullName}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-secondary">
            <span className="flex items-center gap-2">
              <span className="text-text-muted">Circuit</span>
              {nextRace.name}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-text-muted">Location</span>
              {nextRace.city}, {nextRace.country}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-text-muted">Date</span>
              {formatRaceDate(event!.eventDate)}
              {event!.eventType === "sprint" && (
                <span className="rounded-full bg-status-yellow/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-status-yellow">
                  Sprint
                </span>
              )}
            </span>
          </div>
        </motion.div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* No Session State                                                 */}
      {/* ---------------------------------------------------------------- */}
      {!showLiveData && (
        <div className="mt-16">
          {/* Animated glow card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-border-subtle bg-bg-secondary p-12 text-center"
          >
            {/* Subtle animated border glow */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_40px_var(--color-glow-red)] opacity-20 animate-pulse-glow" />

            {/* Checkered overlay */}
            <div
              className="pointer-events-none absolute inset-0 animate-checkered-fade opacity-0"
              style={{
                backgroundImage:
                  "repeating-conic-gradient(#ffffff08 0% 25%, transparent 0% 50%)",
                backgroundSize: "24px 24px",
              }}
            />

            <div className="relative z-10">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-bg-tertiary shadow-[0_0_20px_var(--color-glow-red)]">
                <span className="relative flex h-4 w-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-red opacity-75" />
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-status-red" />
                </span>
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
                No Active Session
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-text-secondary">
                There is no live session right now. Coverage will begin
                automatically when the next session goes live.
              </p>

              {/* Countdown */}
              {nextRace && (
                <div className="mt-8 flex justify-center">
                  <CountdownTimer
                    targetDate={new Date(`${event!.eventDate}T14:00:00Z`)}
                    label={`${event!.eventType === "sprint" ? "Sprint" : "Race"} coverage begins in`}
                  />
                </div>
              )}
            </div>
          </motion.div>

          {/* Stat cards grid */}
          {nextRace && (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4"
            >
              <InfoCard label="Next Race" value={nextRace.fullName} />
              <InfoCard label="Circuit" value={nextRace.name} />
              <InfoCard
                label="Round"
                value={`${nextRace.round} / 24`}
              />
              <InfoCard
                label="Sprint Weekend"
                value={nextRace.isSprint ? "Yes" : "No"}
              />
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
