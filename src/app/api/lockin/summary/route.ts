import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/session";
import { disabled, jsonError } from "@/lib/lockin/http";
import { countPlayers, getPicks, getUserRoundScore } from "@/lib/lockin/queries";
import { getOpenRound, getRoundByDate, getRoundState, toRoundSummary } from "@/lib/lockin/rounds";
import { ensureSettled, type SettlementStatus } from "@/lib/lockin/settle";

export const dynamic = "force-dynamic";

/**
 * Public round summary used by the race-page island and the homepage card:
 * state, player count, official result once settled, and the caller's own
 * picks and score when signed in. Viewing a finished round is what triggers
 * settlement, so this endpoint is also the lazy settle trigger.
 */
export async function GET(req: Request): Promise<Response> {
  if (!env.lockInEnabled) return disabled();
  const now = Date.now();
  const raceDate = new URL(req.url).searchParams.get("round");
  const round = raceDate ? getRoundByDate(raceDate) : getOpenRound(now);
  if (!round) return jsonError(404, "No such round");

  let status: SettlementStatus | null = null;
  if (now >= round.qualiEndsAtMs) {
    try {
      status = await ensureSettled(round, { nowMs: now });
    } catch (err) {
      console.warn("[f1lytics/lockin] settlement check failed:", err);
    }
  }
  const [players, user] = await Promise.all([countPlayers(round.raceDate), getCurrentUser()]);
  const me = user
    ? await Promise.all([getPicks(user.id, round.raceDate), getUserRoundScore(user.id, round.raceDate)]).then(([picks, score]) => ({
        picks,
        score,
      }))
    : null;
  return NextResponse.json(
    {
      round: toRoundSummary(round),
      state: getRoundState(round, now, status?.raceSettled ?? false),
      players,
      result: status?.result ?? null,
      settled: status?.settled ?? null,
      me,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
