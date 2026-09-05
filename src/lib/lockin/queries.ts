import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { leagueMembers, leagues, predictions, profiles, roundResults, scores } from "@/lib/db/schema";
import { newId, newShareId } from "./ids";
import { generateLeagueCode, normalizeLeagueCode } from "./league-code";
import { compareSeason, type Breakdown, type Picks } from "./scoring";

export const LEAGUE_MAX_MEMBERS = 200;
export const LEAGUE_NAME_MIN = 3;
export const LEAGUE_NAME_MAX = 40;

// ── Picks ────────────────────────────────────────────────────────────────

export interface StoredPicks extends Picks {
  shareId: string;
  updatedAt: Date;
}

export async function getPicks(userId: string, raceDate: string): Promise<StoredPicks | null> {
  const rows = await getDb()
    .select()
    .from(predictions)
    .where(and(eq(predictions.userId, userId), eq(predictions.raceDate, raceDate)))
    .limit(1);
  const p = rows[0];
  if (!p) return null;
  return { pole: p.pole, p1: p.p1, p2: p.p2, p3: p.p3, fastestLap: p.fastestLap, marginMs: p.marginMs, sprintWinner: p.sprintWinner, shareId: p.shareId, updatedAt: p.updatedAt };
}

export async function upsertPicks(userId: string, raceDate: string, picks: Picks): Promise<{ shareId: string }> {
  const now = new Date();
  const rows = await getDb()
    .insert(predictions)
    .values({ id: newId(), userId, raceDate, ...picks, shareId: newShareId(), createdAt: now, updatedAt: now })
    .onConflictDoUpdate({ target: [predictions.userId, predictions.raceDate], set: { ...picks, updatedAt: now } })
    .returning({ shareId: predictions.shareId });
  return { shareId: rows[0].shareId };
}

export async function countPlayers(raceDate: string): Promise<number> {
  const rows = await getDb().select({ n: count() }).from(predictions).where(eq(predictions.raceDate, raceDate));
  return rows[0]?.n ?? 0;
}

// ── Scores and leaderboards ──────────────────────────────────────────────

export interface RoundScoreRow {
  userId: string;
  displayName: string;
  tier: "free" | "supporter";
  points: number;
  exactHits: number;
  rank: number | null;
  players: number | null;
  breakdown: Breakdown;
  tiebreakMs: number | null;
}

export async function getUserRoundScore(userId: string, raceDate: string): Promise<RoundScoreRow | null> {
  const rows = await getDb()
    .select({
      userId: scores.userId,
      displayName: profiles.displayName,
      tier: profiles.tier,
      points: scores.points,
      exactHits: scores.exactHits,
      rank: scores.rank,
      players: scores.players,
      breakdown: scores.breakdown,
      tiebreakMs: scores.tiebreakMs,
    })
    .from(scores)
    .innerJoin(profiles, eq(profiles.userId, scores.userId))
    .where(and(eq(scores.userId, userId), eq(scores.raceDate, raceDate)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getRoundLeaderboard(raceDate: string, limit = 100): Promise<RoundScoreRow[]> {
  return getDb()
    .select({
      userId: scores.userId,
      displayName: profiles.displayName,
      tier: profiles.tier,
      points: scores.points,
      exactHits: scores.exactHits,
      rank: scores.rank,
      players: scores.players,
      breakdown: scores.breakdown,
      tiebreakMs: scores.tiebreakMs,
    })
    .from(scores)
    .innerJoin(profiles, eq(profiles.userId, scores.userId))
    .where(eq(scores.raceDate, raceDate))
    .orderBy(sql`${scores.rank} nulls last`, desc(scores.points), asc(profiles.createdAt))
    .limit(limit);
}

export interface SeasonRow {
  userId: string;
  displayName: string;
  tier: "free" | "supporter";
  points: number;
  exactHits: number;
  rounds: number;
  joinedAtMs: number;
  rank: number;
}

const SEASON_CAP = 5000;

/** Season totals for every player with at least one settled round, ranked. */
export async function getSeasonLeaderboard(limit = 100, filterUserIds?: string[]): Promise<SeasonRow[]> {
  const db = getDb();
  const base = db
    .select({
      userId: scores.userId,
      displayName: profiles.displayName,
      tier: profiles.tier,
      points: sql<number>`coalesce(sum(${scores.points}), 0)::int`,
      exactHits: sql<number>`coalesce(sum(${scores.exactHits}), 0)::int`,
      rounds: sql<number>`count(*)::int`,
      joinedAt: profiles.createdAt,
    })
    .from(scores)
    .innerJoin(profiles, eq(profiles.userId, scores.userId))
    .groupBy(scores.userId, profiles.displayName, profiles.tier, profiles.createdAt)
    .limit(SEASON_CAP);
  const rows = await (filterUserIds
    ? base.where(sql`${scores.userId} in ${filterUserIds}`)
    : base);
  const ranked = rows
    .map((r) => ({ ...r, joinedAtMs: r.joinedAt.getTime() }))
    .sort(compareSeason);
  let rank = 0;
  let prev: SeasonRow | null = null;
  const out: SeasonRow[] = [];
  ranked.forEach((r, i) => {
    const row: SeasonRow = { userId: r.userId, displayName: r.displayName, tier: r.tier, points: r.points, exactHits: r.exactHits, rounds: r.rounds, joinedAtMs: r.joinedAtMs, rank: 0 };
    if (!prev || compareSeason(prev, row) !== 0) rank = i + 1;
    row.rank = rank;
    prev = row;
    out.push(row);
  });
  return out.slice(0, limit);
}

export async function getUserSeason(userId: string): Promise<SeasonRow | null> {
  const all = await getSeasonLeaderboard(SEASON_CAP);
  return all.find((r) => r.userId === userId) ?? null;
}

// ── Share cards ──────────────────────────────────────────────────────────

export interface ShareRow {
  raceDate: string;
  displayName: string;
  picks: Picks;
  score: { points: number; exactHits: number; rank: number | null; players: number | null; breakdown: Breakdown } | null;
  result: { pole: string | null; p1: string | null; p2: string | null; p3: string | null; fastestLap: string | null; marginMs: number | null; sprintWinner: string | null; raceSettled: boolean };
}

export async function getShare(shareId: string): Promise<ShareRow | null> {
  const db = getDb();
  const rows = await db
    .select({ p: predictions, displayName: profiles.displayName })
    .from(predictions)
    .innerJoin(profiles, eq(profiles.userId, predictions.userId))
    .where(eq(predictions.shareId, shareId))
    .limit(1);
  const hit = rows[0];
  if (!hit) return null;
  const { p } = hit;
  const [scoreRows, resultRows] = await Promise.all([
    db.select().from(scores).where(and(eq(scores.userId, p.userId), eq(scores.raceDate, p.raceDate))).limit(1),
    db.select().from(roundResults).where(eq(roundResults.raceDate, p.raceDate)).limit(1),
  ]);
  const s = scoreRows[0];
  const r = resultRows[0];
  return {
    raceDate: p.raceDate,
    displayName: hit.displayName,
    picks: { pole: p.pole, p1: p.p1, p2: p.p2, p3: p.p3, fastestLap: p.fastestLap, marginMs: p.marginMs, sprintWinner: p.sprintWinner },
    score: s ? { points: s.points, exactHits: s.exactHits, rank: s.rank, players: s.players, breakdown: s.breakdown } : null,
    result: {
      pole: r?.pole ?? null,
      p1: r?.p1 ?? null,
      p2: r?.p2 ?? null,
      p3: r?.p3 ?? null,
      fastestLap: r?.fastestLap ?? null,
      marginMs: r?.marginMs ?? null,
      sprintWinner: r?.sprintWinner ?? null,
      raceSettled: Boolean(r?.raceSettledAt),
    },
  };
}

// ── Leagues ──────────────────────────────────────────────────────────────

export interface League {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  createdAt: Date;
}

export type LeagueError = "name" | "not-found" | "full" | "limit";

export async function createLeague(userId: string, rawName: string): Promise<{ ok: true; league: League } | { ok: false; error: LeagueError }> {
  const name = rawName.replace(/[^\p{L}\p{N} _'\-]/gu, "").replace(/\s+/g, " ").trim();
  if (name.length < LEAGUE_NAME_MIN || name.length > LEAGUE_NAME_MAX) return { ok: false, error: "name" };
  const db = getDb();
  const owned = await db.select({ n: count() }).from(leagues).where(eq(leagues.ownerId, userId));
  if ((owned[0]?.n ?? 0) >= 10) return { ok: false, error: "limit" };
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateLeagueCode();
    try {
      const league = { id: newId(), name, code, ownerId: userId, createdAt: new Date() };
      await db.batch([
        db.insert(leagues).values(league),
        db.insert(leagueMembers).values({ leagueId: league.id, userId, joinedAt: league.createdAt }),
      ]);
      return { ok: true, league };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!/leagues_code|unique/i.test(message)) throw err;
    }
  }
  throw new Error("Could not allocate a league code");
}

export async function getLeagueByCode(rawCode: string): Promise<League | null> {
  const code = normalizeLeagueCode(rawCode);
  if (!code) return null;
  const rows = await getDb().select().from(leagues).where(eq(leagues.code, code)).limit(1);
  return rows[0] ?? null;
}

export async function joinLeague(userId: string, rawCode: string): Promise<{ ok: true; league: League } | { ok: false; error: LeagueError }> {
  const league = await getLeagueByCode(rawCode);
  if (!league) return { ok: false, error: "not-found" };
  const db = getDb();
  const members = await db.select({ n: count() }).from(leagueMembers).where(eq(leagueMembers.leagueId, league.id));
  if ((members[0]?.n ?? 0) >= LEAGUE_MAX_MEMBERS) return { ok: false, error: "full" };
  await db.insert(leagueMembers).values({ leagueId: league.id, userId }).onConflictDoNothing();
  return { ok: true, league };
}

export async function isLeagueMember(userId: string, leagueId: string): Promise<boolean> {
  const rows = await getDb()
    .select({ userId: leagueMembers.userId })
    .from(leagueMembers)
    .where(and(eq(leagueMembers.leagueId, leagueId), eq(leagueMembers.userId, userId)))
    .limit(1);
  return rows.length > 0;
}

export async function getUserLeagues(userId: string): Promise<(League & { members: number })[]> {
  const db = getDb();
  const mine = await db
    .select({ league: leagues })
    .from(leagueMembers)
    .innerJoin(leagues, eq(leagues.id, leagueMembers.leagueId))
    .where(eq(leagueMembers.userId, userId))
    .orderBy(asc(leagues.createdAt));
  if (mine.length === 0) return [];
  const ids = mine.map((m) => m.league.id);
  const counts = await db
    .select({ leagueId: leagueMembers.leagueId, n: count() })
    .from(leagueMembers)
    .where(sql`${leagueMembers.leagueId} in ${ids}`)
    .groupBy(leagueMembers.leagueId);
  const byId = new Map(counts.map((c) => [c.leagueId, c.n]));
  return mine.map((m) => ({ ...m.league, members: byId.get(m.league.id) ?? 0 }));
}

export interface LeagueStandingRow {
  userId: string;
  displayName: string;
  tier: "free" | "supporter";
  points: number;
  exactHits: number;
  rounds: number;
  rank: number;
}

/** Members ranked by season totals; members with no settled round yet show zero. */
export async function getLeagueStandings(leagueId: string): Promise<LeagueStandingRow[]> {
  const db = getDb();
  const members = await db
    .select({ userId: leagueMembers.userId, displayName: profiles.displayName, tier: profiles.tier, joinedAt: profiles.createdAt })
    .from(leagueMembers)
    .innerJoin(profiles, eq(profiles.userId, leagueMembers.userId))
    .where(eq(leagueMembers.leagueId, leagueId))
    .limit(LEAGUE_MAX_MEMBERS);
  if (members.length === 0) return [];
  const season = await getSeasonLeaderboard(LEAGUE_MAX_MEMBERS, members.map((m) => m.userId));
  const byUser = new Map(season.map((s) => [s.userId, s]));
  const rows = members.map((m) => {
    const s = byUser.get(m.userId);
    return { userId: m.userId, displayName: m.displayName, tier: m.tier, points: s?.points ?? 0, exactHits: s?.exactHits ?? 0, rounds: s?.rounds ?? 0, joinedAtMs: m.joinedAt.getTime() };
  });
  rows.sort(compareSeason);
  let rank = 0;
  let prev: (typeof rows)[number] | null = null;
  return rows.map((r, i) => {
    if (!prev || compareSeason(prev, r) !== 0) rank = i + 1;
    prev = r;
    return { userId: r.userId, displayName: r.displayName, tier: r.tier, points: r.points, exactHits: r.exactHits, rounds: r.rounds, rank };
  });
}

// ── Rounds ───────────────────────────────────────────────────────────────

/** Race date of the most recently settled round, or null before the first one. */
export async function getLatestSettledRaceDate(): Promise<string | null> {
  const rows = await getDb()
    .select({ raceDate: roundResults.raceDate })
    .from(roundResults)
    .where(sql`${roundResults.raceSettledAt} is not null`)
    .orderBy(desc(roundResults.raceDate))
    .limit(1);
  return rows[0]?.raceDate ?? null;
}
