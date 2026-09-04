import { toNextJsHandler } from "better-auth/next-js";
import { env } from "@/lib/env";
import { getAuth } from "@/lib/auth/server";
import { disabled } from "@/lib/lockin/http";

export const dynamic = "force-dynamic";

// Built once per instance. When Lock In is off the handlers answer 503 so a
// deploy without secrets never throws at import time.
const handler = env.lockInEnabled ? toNextJsHandler(getAuth()) : null;

export async function GET(req: Request): Promise<Response> {
  return handler ? handler.GET(req) : disabled();
}

export async function POST(req: Request): Promise<Response> {
  return handler ? handler.POST(req) : disabled();
}
