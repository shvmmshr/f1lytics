import { describe, expect, it } from "vitest";
import { defaultDisplayName, sanitizeDisplayName, withSuffix } from "./display-name";
import { generateLeagueCode, normalizeLeagueCode } from "./league-code";

describe("display names", () => {
  it("strips symbols, collapses spaces and bounds length", () => {
    expect(sanitizeDisplayName("  Max <b>Verstappen</b>  ")).toBe("Max bVerstappenb");
    expect(sanitizeDisplayName("x")).toBeNull();
    expect(sanitizeDisplayName("a".repeat(40))).toHaveLength(24);
  });

  it("derives a default from the email local part", () => {
    expect(defaultDisplayName("max.verstappen+f1@example.com")).toBe("max verstappen");
    expect(defaultDisplayName("x@example.com")).toBe("Player");
  });

  it("keeps suffixed names inside the maximum", () => {
    expect(withSuffix("a".repeat(24), 1)).toHaveLength(24);
  });
});

describe("league codes", () => {
  it("generates 8 unambiguous characters", () => {
    const code = generateLeagueCode();
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
  });

  it("normalizes user input and rejects bad codes", () => {
    expect(normalizeLeagueCode(" abcd-efgh ")).toBe("ABCDEFGH");
    expect(normalizeLeagueCode("ABCD0EFG")).toBeNull();
    expect(normalizeLeagueCode("ABC")).toBeNull();
  });
});
