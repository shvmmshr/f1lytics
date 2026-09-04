import { CIRCUIT_LIST, getApiRound, type Circuit } from "@/lib/constants/circuits";
import { SESSION_DURATIONS_MS, getWeekendSchedule } from "@/lib/constants/sessions";

/**
 * A Lock In round is one race weekend, keyed by race date (the join key the
 * whole app uses; Jolpica renumbers rounds after cancellations). Times are
 * UTC epoch milliseconds derived from the baked weekend timetable.
 */
export interface Round {
  raceDate: string;
  slug: string;
  name: string;
  fullName: string;
  round: number;
  isSprint: boolean;
  apiRound: number;
  /** Picks freeze here: sprint qualifying on sprint weekends, else qualifying. */
  lockAtMs: number;
  qualiEndsAtMs: number;
  sprintEndsAtMs: number | null;
  raceEndsAtMs: number;
}

export type RoundPhase = "quali" | "sprint" | "race";

export type RoundState = "upcoming" | "open" | "locked" | "settling" | "settled";

function toRound(circuit: Circuit): Round | null {
  const sched = getWeekendSchedule(circuit.raceDate);
  if (!sched || !sched.qualifying) return null;
  const qualiStart = new Date(sched.qualifying).getTime();
  const sprintQualiStart = sched.sprintQualifying ? new Date(sched.sprintQualifying).getTime() : null;
  const sprintStart = sched.sprint ? new Date(sched.sprint).getTime() : null;
  const raceStart = new Date(sched.race).getTime();
  return {
    raceDate: circuit.raceDate,
    slug: circuit.slug,
    name: circuit.name,
    fullName: circuit.fullName,
    round: circuit.round,
    isSprint: circuit.isSprint,
    apiRound: getApiRound(circuit),
    lockAtMs: sprintQualiStart ?? qualiStart,
    qualiEndsAtMs: qualiStart + SESSION_DURATIONS_MS.qualifying,
    sprintEndsAtMs: sprintStart !== null ? sprintStart + SESSION_DURATIONS_MS.sprint : null,
    raceEndsAtMs: raceStart + SESSION_DURATIONS_MS.race,
  };
}

let cachedRounds: Round[] | null = null;

/** Every non-cancelled round with a timetable, in calendar order. */
export function getRounds(): Round[] {
  if (!cachedRounds) {
    cachedRounds = CIRCUIT_LIST.filter((c) => !c.cancelled)
      .map(toRound)
      .filter((r): r is Round => r !== null);
  }
  return cachedRounds;
}

export function getRoundByDate(raceDate: string): Round | undefined {
  return getRounds().find((r) => r.raceDate === raceDate);
}

export function getRoundBySlug(slug: string): Round | undefined {
  return getRounds().find((r) => r.slug === slug);
}

/** The single round accepting picks: the earliest whose lock time is still ahead. */
export function getOpenRound(nowMs: number): Round | undefined {
  return getRounds().find((r) => r.lockAtMs > nowMs);
}

/** The round whose weekend contains now, for the live-tower overlay: lock time minus 3 days to race end plus 1 day. */
export function getWeekendRound(nowMs: number): Round | undefined {
  const DAY = 24 * 60 * 60_000;
  return getRounds().find((r) => nowMs >= r.lockAtMs - 3 * DAY && nowMs <= r.raceEndsAtMs + DAY);
}

/** Phases that apply to a round, in settlement order. */
export function roundPhases(round: Round): RoundPhase[] {
  return round.isSprint ? ["quali", "sprint", "race"] : ["quali", "race"];
}

/** When a phase's data can exist: after that session's scheduled end. */
export function phaseEndsAtMs(round: Round, phase: RoundPhase): number {
  if (phase === "quali") return round.qualiEndsAtMs;
  if (phase === "sprint") return round.sprintEndsAtMs ?? round.raceEndsAtMs;
  return round.raceEndsAtMs;
}

export function getRoundState(round: Round, nowMs: number, raceSettled: boolean): RoundState {
  if (raceSettled) return "settled";
  if (nowMs >= round.raceEndsAtMs) return "settling";
  if (nowMs >= round.lockAtMs) return "locked";
  const open = getOpenRound(nowMs);
  return open?.raceDate === round.raceDate ? "open" : "upcoming";
}

/** Serializable subset of a round for API responses and client components. */
export interface RoundSummary {
  raceDate: string;
  slug: string;
  name: string;
  fullName: string;
  round: number;
  isSprint: boolean;
  lockAtMs: number;
  raceEndsAtMs: number;
}

export function toRoundSummary(round: Round): RoundSummary {
  return {
    raceDate: round.raceDate,
    slug: round.slug,
    name: round.name,
    fullName: round.fullName,
    round: round.round,
    isSprint: round.isSprint,
    lockAtMs: round.lockAtMs,
    raceEndsAtMs: round.raceEndsAtMs,
  };
}
