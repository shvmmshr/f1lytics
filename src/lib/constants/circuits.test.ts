import { describe, expect, it } from "vitest";
import { CIRCUIT_LIST, getApiRound, getCircuitBySlug } from "./circuits";

function bySlug(slug: string) {
  const c = getCircuitBySlug(slug);
  if (!c) throw new Error(`missing circuit ${slug}`);
  return c;
}

describe("getApiRound", () => {
  const cancelled = CIRCUIT_LIST.filter((c) => c.cancelled);

  it("has exactly the cancelled rounds the calendar documents", () => {
    expect(cancelled.map((c) => c.slug).sort()).toEqual(["bahrain-gp", "saudi-arabian-gp"]);
  });

  it("leaves rounds before any cancellation unchanged", () => {
    expect(getApiRound(bySlug("australian-gp"))).toBe(1);
    expect(getApiRound(bySlug("japanese-gp"))).toBe(3);
  });

  it("shifts rounds after the cancellations down by the cancelled count", () => {
    const miami = bySlug("miami-gp");
    expect(getApiRound(miami)).toBe(miami.round - cancelled.length);
    const abuDhabi = bySlug("abu-dhabi-gp");
    expect(getApiRound(abuDhabi)).toBe(abuDhabi.round - cancelled.length);
  });

  it("maps the active calendar onto a dense 1..N range with no duplicates", () => {
    const apiRounds = CIRCUIT_LIST.filter((c) => !c.cancelled).map(getApiRound);
    expect(new Set(apiRounds).size).toBe(apiRounds.length);
    expect(Math.min(...apiRounds)).toBe(1);
    expect(Math.max(...apiRounds)).toBe(apiRounds.length);
  });

  it("keeps race dates unique, since race date is the join key", () => {
    const dates = CIRCUIT_LIST.map((c) => c.raceDate);
    expect(new Set(dates).size).toBe(dates.length);
  });
});
