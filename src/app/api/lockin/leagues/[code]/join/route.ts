import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/session";
import { disabled, jsonError, unauthorized } from "@/lib/lockin/http";
import { joinLeague } from "@/lib/lockin/queries";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ code: string }> }): Promise<Response> {
  if (!env.lockInEnabled) return disabled();
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { code } = await params;
  const joined = await joinLeague(user.id, code);
  if (!joined.ok) {
    if (joined.error === "not-found") return jsonError(404, "No league with that code");
    if (joined.error === "full") return jsonError(409, "That league is full");
    return jsonError(400, "Could not join the league");
  }
  return NextResponse.json({ ok: true, code: joined.league.code, name: joined.league.name });
}
