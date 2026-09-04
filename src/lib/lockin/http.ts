import { NextResponse } from "next/server";

export function jsonError(status: number, error: string): NextResponse {
  return NextResponse.json({ error }, { status });
}

export const disabled = () => jsonError(503, "Lock In is not enabled on this deployment");
export const unauthorized = () => jsonError(401, "Sign in required");

/** Body parser that never throws: malformed JSON becomes null. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
