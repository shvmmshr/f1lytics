import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { magicLink } from "better-auth/plugins";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Used only by: npx auth@1.7.2 generate --config scripts/auth-schema.config.ts --output src/lib/db/auth-schema.ts
// Keep plugins and rateLimit storage identical to src/lib/auth/server.ts.
export const auth = betterAuth({
  database: drizzleAdapter(drizzle({ client: neon(process.env.DATABASE_URL ?? "postgresql://x:y@localhost/db") }), {
    provider: "pg",
  }),
  rateLimit: { enabled: true, storage: "database", modelName: "rateLimit" },
  socialProviders: { google: { clientId: "generate", clientSecret: "generate" } },
  plugins: [magicLink({ sendMagicLink: async () => {} })],
});
