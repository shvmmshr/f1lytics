"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { getNextRace } from "@/lib/constants/circuits";
import { CountdownTimer } from "@/components/shared/countdown-timer";
import { DRIVER_LIST } from "@/lib/constants/drivers";
import { TEAMS } from "@/lib/constants";

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
// Placeholder live table (future-ready)
// ---------------------------------------------------------------------------

function LivePositionTable() {
  // Placeholder rows using driver constants so the UI can be previewed
  const rows = DRIVER_LIST.slice(0, 10).map((driver, idx) => ({
    pos: idx + 1,
    name: `${driver.firstName.charAt(0)}. ${driver.lastName}`,
    team: driver.teamId,
    gap: idx === 0 ? "LEADER" : `+${(idx * 1.234).toFixed(3)}`,
    lastLap: `1:${(30 + Math.random() * 2).toFixed(3)}`,
    tire: ["S", "M", "H"][idx % 3],
    teamColor: driver.teamId,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="mt-10 overflow-hidden rounded-2xl border border-border-subtle"
    >
      {/* Table header */}
      <div className="grid grid-cols-[3rem_1fr_1fr_6rem_6rem_4rem] gap-2 border-b border-border-subtle bg-bg-tertiary px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-text-muted">
        <span>Pos</span>
        <span>Driver</span>
        <span>Team</span>
        <span className="text-right">Gap</span>
        <span className="text-right">Last Lap</span>
        <span className="text-center">Tire</span>
      </div>

      {/* Table rows */}
      {rows.map((row) => (
        <div
          key={row.pos}
          className="grid grid-cols-[3rem_1fr_1fr_6rem_6rem_4rem] items-center gap-2 border-b border-border-subtle/50 border-l-[3px] px-4 py-3 transition-colors hover:bg-bg-tertiary/50"
          style={{ borderLeftColor: TEAMS[row.teamColor]?.color ?? "#27272A" }}
        >
          <span className="font-mono text-sm font-bold text-text-primary">
            {String(row.pos).padStart(2, "0")}
          </span>
          <span className="text-sm font-semibold text-text-primary">
            {row.name}
          </span>
          <span className="text-sm text-text-secondary">
            {row.team.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
          <span className="text-right font-mono text-sm tabular-nums text-text-secondary">
            {row.gap}
          </span>
          <span className="text-right font-mono text-sm tabular-nums text-text-secondary">
            {row.lastLap}
          </span>
          <span className="text-center text-sm font-semibold text-text-primary">
            {row.tire}
          </span>
        </div>
      ))}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function LiveContent() {
  const nextRace = useMemo(() => getNextRace(), []);
  const isLive = false; // Will be driven by real data in the future

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
          <PulsingDot />
          <h1 className="text-4xl font-bold tracking-[-0.05em] text-text-primary md:text-5xl">
            Live Session
          </h1>
        </div>
        <StatusBadge status={isLive ? "LIVE" : "NO SESSION"} />
      </motion.div>

      <motion.span
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mt-4 block h-[2px] w-16 origin-left bg-status-red"
        aria-hidden="true"
      />

      {/* ---------------------------------------------------------------- */}
      {/* Next Race Info Card                                              */}
      {/* ---------------------------------------------------------------- */}
      {nextRace && (
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
              {formatRaceDate(nextRace.raceDate)}
            </span>
          </div>
        </motion.div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* No Session State (primary view for 2026)                        */}
      {/* ---------------------------------------------------------------- */}
      {!isLive && (
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
                    targetDate={new Date(`${nextRace.raceDate}T14:00:00Z`)}
                    label="Coverage begins in"
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

      {/* ---------------------------------------------------------------- */}
      {/* Live Session State (future-ready)                               */}
      {/* ---------------------------------------------------------------- */}
      {isLive && <LivePositionTable />}
    </div>
  );
}
