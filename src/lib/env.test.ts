import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

const core = {
  DATABASE_URL: "postgresql://u:p@h/db",
  BETTER_AUTH_SECRET: "s".repeat(32),
  BETTER_AUTH_URL: "https://f1lytics.com",
};

describe("parseEnv", () => {
  it("switches everything off with an empty environment", () => {
    const env = parseEnv({});
    expect(env.lockInEnabled).toBe(false);
    expect(env.googleEnabled).toBe(false);
    expect(env.magicLinkEnabled).toBe(false);
  });

  it("enables Lock In with the three core variables only", () => {
    const env = parseEnv(core);
    expect(env.lockInEnabled).toBe(true);
    expect(env.googleEnabled).toBe(false);
    expect(env.magicLinkEnabled).toBe(false);
  });

  it("treats empty strings as unset", () => {
    expect(parseEnv({ ...core, DATABASE_URL: "   " }).lockInEnabled).toBe(false);
  });

  it("needs both Google values and both Resend values", () => {
    expect(parseEnv({ ...core, GOOGLE_CLIENT_ID: "id" }).googleEnabled).toBe(false);
    expect(parseEnv({ ...core, GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "x" }).googleEnabled).toBe(true);
    expect(parseEnv({ ...core, RESEND_API_KEY: "re_x" }).magicLinkEnabled).toBe(false);
    expect(parseEnv({ ...core, RESEND_API_KEY: "re_x", RESEND_FROM: "a@b.c" }).magicLinkEnabled).toBe(true);
  });

  it("ignores unrelated variables", () => {
    expect(Object.keys(parseEnv({ ...core, PATH: "/usr/bin" }))).not.toContain("PATH");
  });
});
