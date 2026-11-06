import { describe, expect, it } from "vitest";
import { validatePicks } from "./picks";

const good = { pole: "norris", p1: "norris", p2: "antonelli", p3: "russell", fastestLap: "leclerc", marginMs: 12_345 };

describe("validatePicks", () => {
  it("accepts a valid normal-weekend submission and nulls the sprint winner", () => {
    const v = validatePicks({ ...good, sprintWinner: "russell" }, { isSprint: false, raceDate: "2026-11-08" });
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.picks.sprintWinner).toBeNull();
  });

  it("requires a sprint winner on sprint weekends", () => {
    expect(validatePicks(good, { isSprint: true, raceDate: "2026-08-23" })).toEqual({ ok: false, error: "sprintWinner: pick a sprint winner" });
  });

  it("rejects duplicate podium drivers", () => {
    const v = validatePicks({ ...good, p3: "norris" }, { isSprint: false, raceDate: "2026-11-08" });
    expect(v.ok).toBe(false);
  });

  it("rejects unknown drivers, negative margins and non-integers", () => {
    expect(validatePicks({ ...good, pole: "schumacher" }, { isSprint: false, raceDate: "2026-11-08" }).ok).toBe(false);
    expect(validatePicks({ ...good, marginMs: -1 }, { isSprint: false, raceDate: "2026-11-08" }).ok).toBe(false);
    expect(validatePicks({ ...good, marginMs: 1.5 }, { isSprint: false, raceDate: "2026-11-08" }).ok).toBe(false);
    expect(validatePicks({ ...good, marginMs: 600_001 }, { isSprint: false, raceDate: "2026-11-08" }).ok).toBe(false);
  });
});
