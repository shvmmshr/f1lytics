/**
 * Lock In scoring. Pure functions, no I/O. Picks and results use driver ids
 * from src/lib/constants/drivers.ts; a null result field means that phase has
 * not settled yet.
 */

export interface Picks {
  pole: string;
  p1: string;
  p2: string;
  p3: string;
  fastestLap: string;
  /** Predicted winning margin over P2, milliseconds. Tiebreaker only. */
  marginMs: number;
  /** Sprint weekends only; null otherwise. */
  sprintWinner: string | null;
}

export interface RoundResult {
  pole: string | null;
  p1: string | null;
  p2: string | null;
  p3: string | null;
  fastestLap: string | null;
  /** null when P2 was lapped or the gap is unavailable. */
  marginMs: number | null;
  sprintWinner: string | null;
}

export type Stamp = "hit" | "close" | "miss" | "pending";

export interface PickScore {
  points: number;
  stamp: Stamp;
}

export interface Breakdown {
  pole: PickScore;
  p1: PickScore;
  p2: PickScore;
  p3: PickScore;
  podiumBonus: number;
  fastestLap: PickScore;
  sprintWinner: PickScore | null;
}

export const POINTS = {
  pole: 5,
  podiumExact: 5,
  podiumClose: 2,
  podiumPerfect: 5,
  fastestLap: 5,
  sprintWinner: 3,
} as const;

/** 30 on a normal weekend, 33 with a sprint. */
export function maxPoints(isSprint: boolean): number {
  return POINTS.pole + 3 * POINTS.podiumExact + POINTS.podiumPerfect + POINTS.fastestLap + (isSprint ? POINTS.sprintWinner : 0);
}

function exact(pick: string, actual: string | null, points: number): PickScore {
  if (actual === null) return { points: 0, stamp: "pending" };
  return pick === actual ? { points, stamp: "hit" } : { points: 0, stamp: "miss" };
}

function podiumStep(pick: string, actual: string | null, podium: (string | null)[]): PickScore {
  if (actual === null) return { points: 0, stamp: "pending" };
  if (pick === actual) return { points: POINTS.podiumExact, stamp: "hit" };
  if (podium.includes(pick)) return { points: POINTS.podiumClose, stamp: "close" };
  return { points: 0, stamp: "miss" };
}

export interface RoundScore {
  points: number;
  exactHits: number;
  breakdown: Breakdown;
}

export function scoreRound(picks: Picks, result: RoundResult, isSprint: boolean): RoundScore {
  const podium = [result.p1, result.p2, result.p3];
  const p1 = podiumStep(picks.p1, result.p1, podium);
  const p2 = podiumStep(picks.p2, result.p2, podium);
  const p3 = podiumStep(picks.p3, result.p3, podium);
  const podiumBonus = p1.stamp === "hit" && p2.stamp === "hit" && p3.stamp === "hit" ? POINTS.podiumPerfect : 0;
  const breakdown: Breakdown = {
    pole: exact(picks.pole, result.pole, POINTS.pole),
    p1,
    p2,
    p3,
    podiumBonus,
    fastestLap: exact(picks.fastestLap, result.fastestLap, POINTS.fastestLap),
    sprintWinner:
      isSprint && picks.sprintWinner !== null
        ? exact(picks.sprintWinner, result.sprintWinner, POINTS.sprintWinner)
        : null,
  };
  const parts = [breakdown.pole, p1, p2, p3, breakdown.fastestLap, breakdown.sprintWinner].filter(
    (x): x is PickScore => x !== null,
  );
  const points = parts.reduce((sum, x) => sum + x.points, 0) + podiumBonus;
  const exactHits = parts.filter((x) => x.stamp === "hit").length;
  return { points, exactHits, breakdown };
}

/** Absolute distance between the predicted and actual winning margin, or null when unknown. */
export function tiebreakDistance(picks: Picks, result: RoundResult): number | null {
  if (result.marginMs === null) return null;
  return Math.abs(picks.marginMs - result.marginMs);
}

export interface Rankable {
  points: number;
  /** Smaller is better; null sorts last among equals. */
  tiebreakMs: number | null;
  exactHits: number;
}

/** Round order: points, then closest margin, then exact hits. Negative when a ranks first. */
export function compareRound(a: Rankable, b: Rankable): number {
  if (b.points !== a.points) return b.points - a.points;
  const ta = a.tiebreakMs ?? Number.POSITIVE_INFINITY;
  const tb = b.tiebreakMs ?? Number.POSITIVE_INFINITY;
  if (ta !== tb) return ta - tb;
  return b.exactHits - a.exactHits;
}

/** Assign competition ranks (1,2,2,4) in the order produced by compareRound. */
export function rankRound<T extends Rankable>(rows: T[]): (T & { rank: number })[] {
  const sorted = [...rows].sort(compareRound);
  let rank = 0;
  let prev: Rankable | null = null;
  return sorted.map((row, i) => {
    if (!prev || compareRound(prev, row) !== 0) rank = i + 1;
    prev = row;
    return { ...row, rank };
  });
}

export interface SeasonRankable {
  points: number;
  exactHits: number;
  /** Earlier sign-up wins the last tiebreak. */
  joinedAtMs: number;
}

export function compareSeason(a: SeasonRankable, b: SeasonRankable): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.exactHits !== a.exactHits) return b.exactHits - a.exactHits;
  return a.joinedAtMs - b.joinedAtMs;
}
