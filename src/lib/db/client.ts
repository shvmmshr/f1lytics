import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { env } from "@/lib/env";
import * as schema from "./schema";

export type Db = NeonHttpDatabase<typeof schema>;

export class DbUnavailableError extends Error {
  constructor() {
    super("DATABASE_URL is not configured");
    this.name = "DbUnavailableError";
  }
}

let cached: Db | null = null;

/**
 * Drizzle over Neon's HTTP driver: one HTTPS request per query, no connection
 * pool to manage, and `db.batch()` for the one atomic write Lock In needs.
 * Throws DbUnavailableError when the feature is switched off, so callers fail
 * fast instead of hanging on a missing connection string.
 */
export function getDb(): Db {
  if (!env.DATABASE_URL) throw new DbUnavailableError();
  if (!cached) cached = drizzle({ client: neon(env.DATABASE_URL), schema });
  return cached;
}
