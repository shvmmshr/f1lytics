import { defineConfig } from "drizzle-kit";

// Migrations run against Neon's DIRECT endpoint (no "-pooler"): the
// transaction-mode pooler rejects the session features DDL tooling relies on.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED ?? "" },
});
