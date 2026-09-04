import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { magicLink } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { env } from "@/lib/env";
import { getDb } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { sendMagicLinkEmail } from "./email";
import { createProfileForUser } from "@/lib/lockin/profile";

const DAY = 60 * 60 * 24;

/**
 * Better Auth, self-hosted. Google first (no email needed), magic link as the
 * fallback. Each provider is wired only when its environment is present, so a
 * partial setup degrades to fewer sign-in buttons instead of a broken page.
 * Built lazily: importing this module must not throw when Lock In is off.
 */
function buildAuth() {
  return betterAuth({
    appName: "F1lytics",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(getDb(), { provider: "pg", schema }),
    trustedOrigins: [
      "https://f1lytics.com",
      "https://www.f1lytics.com",
      ...(env.isProduction ? [] : ["http://localhost:3000", "http://localhost:3200"]),
    ],
    session: {
      expiresIn: 90 * DAY,
      updateAge: DAY,
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    rateLimit: {
      enabled: true,
      // Memory storage resets per serverless instance; the database does not.
      storage: "database",
      modelName: "rateLimit",
      customRules: {
        "/sign-in/magic-link": { window: 60, max: 3 },
        "/sign-in/social": { window: 60, max: 10 },
      },
    },
    socialProviders: env.googleEnabled
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
            prompt: "select_account",
          },
        }
      : {},
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await createProfileForUser({ id: user.id, email: user.email, name: user.name });
          },
        },
      },
    },
    plugins: [
      ...(env.magicLinkEnabled
        ? [
            magicLink({
              expiresIn: 15 * 60,
              sendMagicLink: async ({ email, url }) => {
                await sendMagicLinkEmail({ email, url });
              },
            }),
          ]
        : []),
      // Must stay last so it can set cookies from server actions.
      nextCookies(),
    ],
  });
}

let cached: ReturnType<typeof buildAuth> | null = null;

export function getAuth(): ReturnType<typeof buildAuth> {
  if (!env.lockInEnabled) throw new Error("Lock In is not configured");
  if (!cached) cached = buildAuth();
  return cached;
}

export type Auth = ReturnType<typeof buildAuth>;
