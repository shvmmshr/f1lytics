import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/session";
import { disabled, jsonError, readJson, unauthorized } from "@/lib/lockin/http";
import { createLeague, LEAGUE_NAME_MAX, LEAGUE_NAME_MIN } from "@/lib/lockin/queries";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ name: z.string().min(1).max(80) });

export async function POST(req: Request): Promise<Response> {
  if (!env.lockInEnabled) return disabled();
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = bodySchema.safeParse(await readJson(req));
  if (!body.success) return jsonError(400, "Body must be { name }");
  const created = await createLeague(user.id, body.data.name);
  if (!created.ok) {
    if (created.error === "name") return jsonError(400, `League names are ${LEAGUE_NAME_MIN} to ${LEAGUE_NAME_MAX} characters`);
    if (created.error === "limit") return jsonError(409, "You already own 10 leagues");
    return jsonError(400, "Could not create the league");
  }
  return NextResponse.json({ ok: true, code: created.league.code, name: created.league.name });
}
