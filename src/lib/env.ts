import { z } from "zod";

/**
 * Server-side environment, parsed once. Every Lock In variable is optional so
 * a deploy without them still builds and serves the rest of the site; the
 * derived flags decide what is switched on. Never import this from a client
 * component: it holds secrets.
 */

// Treat an empty string the way Vercel's dashboard can produce it: as unset.
const optionalString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().optional(),
);

const envSchema = z.object({
  DATABASE_URL: optionalString,
  DATABASE_URL_UNPOOLED: optionalString,
  BETTER_AUTH_SECRET: optionalString,
  BETTER_AUTH_URL: optionalString,
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  RESEND_API_KEY: optionalString,
  RESEND_FROM: optionalString,
  REVALIDATION_SECRET: optionalString,
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
});

export type RawEnv = z.infer<typeof envSchema>;

export interface AppEnv extends RawEnv {
  /** Database plus auth secret and URL: the minimum for any Lock In route. */
  lockInEnabled: boolean;
  googleEnabled: boolean;
  magicLinkEnabled: boolean;
  isProduction: boolean;
}

export function parseEnv(source: Record<string, string | undefined>): AppEnv {
  const raw = envSchema.parse(source);
  return {
    ...raw,
    lockInEnabled: Boolean(raw.DATABASE_URL && raw.BETTER_AUTH_SECRET && raw.BETTER_AUTH_URL),
    googleEnabled: Boolean(raw.GOOGLE_CLIENT_ID && raw.GOOGLE_CLIENT_SECRET),
    magicLinkEnabled: Boolean(raw.RESEND_API_KEY && raw.RESEND_FROM),
    isProduction: raw.NODE_ENV === "production",
  };
}

export const env: AppEnv = parseEnv(process.env);
