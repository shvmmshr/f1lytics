import { eq } from "drizzle-orm";
import { getDb, type Db } from "@/lib/db/client";
import { predictions, roundResults, scores, settlements } from "@/lib/db/schema";
import { getQualifyingResults, getRaceResults, getSprintResults } from "@/lib/api/jolpica";
import { extractQualiResult, extractRaceResult, extractSprintResult } from "./results";
import { phaseEndsAtMs, roundPhases, type Round, type RoundPhase } from "./rounds";
import { rankRound, scoreRound, tiebreakDistance, type RoundResult } from "./scoring";

/** Do not ask Jolpica again for the same pending phase within this window. */
const RECHECK_MS = 5 * 60_000;

export interface SettlementStatus {
  raceDate: string;
  settled: Record<RoundPhase, boolean>;
  result: RoundResult;
  /** The race phase is what turns a round into "settled" for players. */
  raceSettled: boolean;
  lastCheckedAt: Date | null;
}

type ResultRow = typeof roundResults.$inferSelect;

function toStatus(raceDate: string, row: ResultRow | null): SettlementStatus {
  return {
    raceDate,
    settled: {
      quali: row?.qualiSettledAt !== null && row?.qualiSettledAt !== undefined,
      sprint: row?.sprintSettledAt !== null && row?.sprintSettledAt !== undefined,
      race: row?.raceSettledAt !== null && row?.raceSettledAt !== undefined,
    },
    result: {
      pole: row?.pole ?? null,
      p1: row?.p1 ?? null,
      p2: row?.p2 ?? null,
      p3: row?.p3 ?? null,
      fastestLap: row?.fastestLap ?? null,
      marginMs: row?.marginMs ?? null,
      sprintWinner: row?.sprintWinner ?? null,
    },
    raceSettled: row?.raceSettledAt !== null && row?.raceSettledAt !== undefined,
    lastCheckedAt: row?.lastCheckedAt ?? null,
  };
}

async function readRow(db: Db, raceDate: string): Promise<ResultRow | null> {
  const rows = await db.select().from(roundResults).where(eq(roundResults.raceDate, raceDate)).limit(1);
  return rows[0] ?? null;
}

export async function getSettlementStatus(raceDate: string): Promise<SettlementStatus> {
  return toStatus(raceDate, await readRow(getDb(), raceDate));
}

/** Fetch one phase's outcome from Jolpica, or null when it is not published yet. */
async function fetchPhase(round: Round, phase: RoundPhase): Promise<Partial<RoundResult> | null> {
  const apiRound = String(round.apiRound);
  if (phase === "quali") {
    const outcome = extractQualiResult(await getQualifyingResults("2026", apiRound), round.raceDate);
    return outcome ? { pole: outcome.pole } : null;
  }
  if (phase === "sprint") {
    const outcome = extractSprintResult(await getSprintResults("2026", apiRound), round.raceDate);
    return outcome ? { sprintWinner: outcome.sprintWinner } : null;
  }
  const outcome = extractRaceResult(await getRaceResults("2026", apiRound), round.raceDate);
  return outcome
    ? { p1: outcome.p1, p2: outcome.p2, p3: outcome.p3, fastestLap: outcome.fastestLap, marginMs: outcome.marginMs }
    : null;
}

function isDuplicateSettlement(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /settlements_pkey|duplicate key/i.test(message);
}

/**
 * Apply one phase atomically. The settlements insert has no conflict clause,
 * so a second concurrent settle of the same phase fails the whole batch and
 * nothing is double-applied. Scores are recomputed for every prediction in
 * the round with the merged result (pending fields stay null, scoring zero).
 */
async function settlePhase(db: Db, round: Round, phase: RoundPhase, outcome: Partial<RoundResult>, now: Date): Promise<void> {
  const existing = await readRow(db, round.raceDate);
  const merged: RoundResult = { ...toStatus(round.raceDate, existing).result, ...outcome };
  const picks = await db.select().from(predictions).where(eq(predictions.raceDate, round.raceDate));

  const scored = picks.map((p) => {
    const s = scoreRound(
      { pole: p.pole, p1: p.p1, p2: p.p2, p3: p.p3, fastestLap: p.fastestLap, marginMs: p.marginMs, sprintWinner: p.sprintWinner },
      merged,
      round.isSprint,
    );
    return {
      userId: p.userId,
      points: s.points,
      exactHits: s.exactHits,
      breakdown: s.breakdown,
      tiebreakMs: tiebreakDistance({ pole: p.pole, p1: p.p1, p2: p.p2, p3: p.p3, fastestLap: p.fastestLap, marginMs: p.marginMs, sprintWinner: p.sprintWinner }, merged),
    };
  });
  const ranked = phase === "race" ? rankRound(scored) : scored.map((s) => ({ ...s, rank: null as number | null }));
  const players = phase === "race" ? scored.length : null;

  const resultValues = {
    raceDate: round.raceDate,
    pole: merged.pole,
    p1: merged.p1,
    p2: merged.p2,
    p3: merged.p3,
    fastestLap: merged.fastestLap,
    marginMs: merged.marginMs,
    sprintWinner: merged.sprintWinner,
    qualiSettledAt: phase === "quali" ? now : (existing?.qualiSettledAt ?? null),
    sprintSettledAt: phase === "sprint" ? now : (existing?.sprintSettledAt ?? null),
    raceSettledAt: phase === "race" ? now : (existing?.raceSettledAt ?? null),
    lastCheckedAt: now,
  };
  const { raceDate: _key, ...resultUpdate } = resultValues;
  void _key;

  const scoreStatements = ranked.map((s) =>
    db
      .insert(scores)
      .values({
        userId: s.userId,
        raceDate: round.raceDate,
        points: s.points,
        exactHits: s.exactHits,
        breakdown: s.breakdown,
        tiebreakMs: s.tiebreakMs,
        rank: s.rank,
        players,
      })
      .onConflictDoUpdate({
        target: [scores.userId, scores.raceDate],
        set: { points: s.points, exactHits: s.exactHits, breakdown: s.breakdown, tiebreakMs: s.tiebreakMs, rank: s.rank, players },
      }),
  );

  try {
    await db.batch([
      db.insert(settlements).values({ raceDate: round.raceDate, phase, settledAt: now }),
      db.insert(roundResults).values(resultValues).onConflictDoUpdate({ target: roundResults.raceDate, set: resultUpdate }),
      ...scoreStatements,
    ]);
  } catch (err) {
    if (isDuplicateSettlement(err)) return; // another request settled this phase first
    throw err;
  }
}

async function touchChecked(db: Db, raceDate: string, now: Date): Promise<void> {
  await db
    .insert(roundResults)
    .values({ raceDate, lastCheckedAt: now })
    .onConflictDoUpdate({ target: roundResults.raceDate, set: { lastCheckedAt: now } });
}

/**
 * Settle whatever can be settled for a round. Cheap when nothing is pending;
 * throttled to one Jolpica look per five minutes while results are awaited;
 * idempotent under concurrency. `force` skips the throttle (manual endpoint).
 */
export async function ensureSettled(round: Round, opts: { nowMs?: number; force?: boolean } = {}): Promise<SettlementStatus> {
  const db = getDb();
  const nowMs = opts.nowMs ?? Date.now();
  const now = new Date(nowMs);
  let row = await readRow(db, round.raceDate);
  let status = toStatus(round.raceDate, row);

  const pending = roundPhases(round).filter((phase) => !status.settled[phase] && nowMs >= phaseEndsAtMs(round, phase));
  if (pending.length === 0) return status;
  if (!opts.force && status.lastCheckedAt && nowMs - status.lastCheckedAt.getTime() < RECHECK_MS) return status;

  let checked = false;
  for (const phase of pending) {
    let outcome: Partial<RoundResult> | null = null;
    try {
      outcome = await fetchPhase(round, phase);
    } catch (err) {
      console.warn(`[f1lytics/lockin] ${phase} results fetch failed for ${round.raceDate}:`, err);
    }
    if (outcome) {
      await settlePhase(db, round, phase, outcome, now);
    } else if (!checked) {
      await touchChecked(db, round.raceDate, now);
      checked = true;
    }
  }
  row = await readRow(db, round.raceDate);
  status = toStatus(round.raceDate, row);
  return status;
}
