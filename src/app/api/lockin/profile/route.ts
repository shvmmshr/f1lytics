import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/session";
import { disabled, jsonError, readJson, unauthorized } from "@/lib/lockin/http";
import { updateProfile } from "@/lib/lockin/profile";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  displayName: z.string().min(1).max(60).optional(),
  newsletterOptIn: z.boolean().optional(),
});

export async function PATCH(req: Request): Promise<Response> {
  if (!env.lockInEnabled) return disabled();
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = patchSchema.safeParse(await readJson(req));
  if (!body.success) return jsonError(400, "Body may contain displayName and newsletterOptIn");
  const updated = await updateProfile(user.id, body.data);
  if (!updated.ok) return jsonError(400, updated.error);
  return NextResponse.json({ ok: true });
}
