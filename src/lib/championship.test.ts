import { describe, expect, it } from "vitest";
import { getConfirmedDriverChampionship } from "./championship";
import { showChampion } from "./home/champion";

describe("confirmed driver championship", () => {
  it("only labels the confirmed driver in the title season", () => {
    const now = Date.parse("2026-11-02T00:00:00Z");
    expect(getConfirmedDriverChampionship(2026, "antonelli", now)?.season).toBe(2026);
    for (const driverId of ["max_verstappen", "russell", "ANT", "", "unknown"]) {
      expect(getConfirmedDriverChampionship(2026, driverId, now)).toBeNull();
    }
    expect(getConfirmedDriverChampionship(2025, "antonelli", now)).toBeNull();
    expect(getConfirmedDriverChampionship(2027, "antonelli", now)).toBeNull();
  });

  it("does not award a title before confirmation, even to the eventual champion", () => {
    const confirmation = Date.parse("2026-11-01T23:00:00Z");
    expect(getConfirmedDriverChampionship(2026, "antonelli", confirmation - 1)).toBeNull();
    expect(getConfirmedDriverChampionship(2026, "antonelli", confirmation)).not.toBeNull();
    expect(getConfirmedDriverChampionship(2026, "antonelli", Number.NaN)).toBeNull();
  });

  it("keeps the 2026 title after the temporary celebration expires", () => {
    const now = Date.parse("2027-01-01T00:00:00Z");
    expect(showChampion(now)).toBe(false);
    expect(getConfirmedDriverChampionship(2026, "antonelli", now)).not.toBeNull();
    expect(getConfirmedDriverChampionship(2027, "antonelli", now)).toBeNull();
  });
});
