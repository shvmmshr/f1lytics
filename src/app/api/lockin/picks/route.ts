import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/session";
import { disabled, jsonError, readJson, unauthorized } from "@/lib/lockin/http";
import { validatePicks } from "@/lib/lockin/picks";
import { getPicks, upsertPicks } from "@/lib/lockin/queries";
import { getOpenRound, getRoundByDate, getRoundState, toRoundSummary } from "@/lib/lockin/rounds";

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  if (!env.lockInEnabled) return disabled();
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const now = Date.now();
  const raceDate = new URL(req.url).searchParams.get("round");
  const round = raceDate ? getRoundByDate(raceDate) : getOpenRound(now);
  if (!round) return jsonError(404, "No such round");
  const picks = await getPicks(user.id, round.raceDate);
  return NextResponse.json({ round: toRoundSummary(round), state: getRoundState(round, now, false), picks });
}

const putSchema = z.object({ raceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), picks: z.unknown() });

export async function PUT(req: Request): Promise<Response> {
  if (!env.lockInEnabled) return disabled();
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = putSchema.safeParse(await readJson(req));
  if (!body.success) return jsonError(400, "Body must be { raceDate, picks }");
  const now = Date.now();
  const round = getRoundByDate(body.data.raceDate);
  if (!round) return jsonError(404, "No such round");
  if (now >= round.lockAtMs) return jsonError(409, "Picks are locked for this round");
  const open = getOpenRound(now);
  if (open?.raceDate !== round.raceDate) return jsonError(409, "Only the next round is open for picks");
  const validated = validatePicks(body.data.picks, round);
  if (!validated.ok) return jsonError(400, validated.error);
  const { shareId } = await upsertPicks(user.id, round.raceDate, validated.picks);
  return NextResponse.json({ ok: true, shareId, lockAtMs: round.lockAtMs });
}
