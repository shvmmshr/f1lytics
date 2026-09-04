import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { disabled, jsonError } from "@/lib/lockin/http";
import { getRoundByDate } from "@/lib/lockin/rounds";
import { ensureSettled } from "@/lib/lockin/settle";

export const dynamic = "force-dynamic";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/** Manual settlement, mirrors /api/revalidate: header secret, fail closed in production. */
export async function POST(request: NextRequest): Promise<Response> {
  if (!env.lockInEnabled) return disabled();
  const secret = request.headers.get("x-revalidate-secret");
  if (env.isProduction) {
    const expected = env.REVALIDATION_SECRET;
    if (!expected || !secret || !safeEqual(secret, expected)) return jsonError(401, "Invalid secret");
  }
  const raceDate = request.nextUrl.searchParams.get("round");
  const round = raceDate ? getRoundByDate(raceDate) : undefined;
  if (!round) return jsonError(404, "Pass ?round=YYYY-MM-DD of a scheduled round");
  const status = await ensureSettled(round, { force: true });
  return NextResponse.json(status);
}
