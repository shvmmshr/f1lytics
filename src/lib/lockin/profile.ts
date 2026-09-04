import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { defaultDisplayName, sanitizeDisplayName, withSuffix } from "./display-name";

export interface Profile {
  userId: string;
  displayName: string;
  tier: "free" | "supporter";
  newsletterOptIn: boolean;
  createdAt: Date;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const rows = await getDb().select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return rows[0] ?? null;
}

/**
 * Called from the auth user-create hook. Display names are unique, so on a
 * collision a numeric suffix is tried a few times before giving up with a
 * random one. Idempotent: a second call for the same user does nothing.
 */
export async function createProfileForUser(user: { id: string; email: string; name: string | null }): Promise<void> {
  const db = getDb();
  const base = (user.name && sanitizeDisplayName(user.name)) || defaultDisplayName(user.email);
  const candidates = [base, ...Array.from({ length: 5 }, (_, i) => withSuffix(base, i + 1)), `Player ${crypto.randomUUID().slice(0, 6)}`];
  for (const displayName of candidates) {
    try {
      await db.insert(profiles).values({ userId: user.id, displayName }).onConflictDoNothing({ target: profiles.userId });
      return;
    } catch (err) {
      // Unique violation on display_name: try the next candidate.
      const message = err instanceof Error ? err.message : String(err);
      if (!/display_name|unique/i.test(message)) throw err;
    }
  }
}

export async function updateProfile(
  userId: string,
  patch: { displayName?: string; newsletterOptIn?: boolean },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const values: Partial<{ displayName: string; newsletterOptIn: boolean }> = {};
  if (patch.displayName !== undefined) {
    const clean = sanitizeDisplayName(patch.displayName);
    if (!clean) return { ok: false, error: "Display name must be 2 to 24 letters, digits, spaces or underscores" };
    values.displayName = clean;
  }
  if (patch.newsletterOptIn !== undefined) values.newsletterOptIn = patch.newsletterOptIn;
  if (Object.keys(values).length === 0) return { ok: true };
  try {
    await getDb().update(profiles).set(values).where(eq(profiles.userId, userId));
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/display_name|unique/i.test(message)) return { ok: false, error: "That display name is taken" };
    throw err;
  }
}
