import { describe, expect, it } from "vitest";
import { compareSeason, maxPoints, rankRound, scoreRound, tiebreakDistance, type Picks, type RoundResult } from "./scoring";

const picks: Picks = { pole: "norris", p1: "norris", p2: "antonelli", p3: "russell", fastestLap: "leclerc", marginMs: 10_000, sprintWinner: null };
const dutch: RoundResult = { pole: "norris", p1: "norris", p2: "antonelli", p3: "russell", fastestLap: "leclerc", marginMs: 11_536, sprintWinner: "russell" };

describe("scoreRound", () => {
  it("awards the maximum for a perfect normal weekend", () => {
    const s = scoreRound(picks, dutch, false);
    expect(s.points).toBe(30);
    expect(maxPoints(false)).toBe(30);
    expect(s.exactHits).toBe(5);
    expect(s.breakdown.podiumBonus).toBe(5);
  });

  it("gives 2 for a podium driver on the wrong step and no bonus", () => {
    const s = scoreRound({ ...picks, p2: "russell", p3: "antonelli" }, dutch, false);
    expect(s.breakdown.p2).toEqual({ points: 2, stamp: "close" });
    expect(s.breakdown.p3).toEqual({ points: 2, stamp: "close" });
    expect(s.breakdown.podiumBonus).toBe(0);
    expect(s.points).toBe(5 + 5 + 2 + 2 + 5);
  });

  it("marks pending fields with zero points before that phase settles", () => {
    const s = scoreRound(picks, { ...dutch, p1: null, p2: null, p3: null, fastestLap: null, marginMs: null }, false);
    expect(s.points).toBe(5);
    expect(s.breakdown.p1.stamp).toBe("pending");
  });

  it("scores the sprint winner only on sprint weekends", () => {
    const withSprint = { ...picks, sprintWinner: "russell" };
    expect(scoreRound(withSprint, dutch, true).points).toBe(33);
    expect(maxPoints(true)).toBe(33);
    expect(scoreRound(withSprint, dutch, false).breakdown.sprintWinner).toBeNull();
  });
});

describe("tiebreak and ranking", () => {
  it("measures distance to the real margin, or null when unknown", () => {
    expect(tiebreakDistance(picks, dutch)).toBe(1_536);
    expect(tiebreakDistance(picks, { ...dutch, marginMs: null })).toBeNull();
  });

  it("ranks by points, then closest margin, with competition ranks on ties", () => {
    const ranked = rankRound([
      { id: "a", points: 10, tiebreakMs: 500, exactHits: 2 },
      { id: "b", points: 12, tiebreakMs: null, exactHits: 2 },
      { id: "c", points: 10, tiebreakMs: 100, exactHits: 2 },
      { id: "d", points: 10, tiebreakMs: 100, exactHits: 2 },
      { id: "e", points: 1, tiebreakMs: 0, exactHits: 0 },
    ]);
    expect(ranked.map((r) => [r.id, r.rank])).toEqual([["b", 1], ["c", 2], ["d", 2], ["a", 4], ["e", 5]]);
  });

  it("orders the season by points, exact hits, then earliest join", () => {
    const rows = [
      { id: "late", points: 40, exactHits: 8, joinedAtMs: 20 },
      { id: "early", points: 40, exactHits: 8, joinedAtMs: 10 },
      { id: "sharp", points: 40, exactHits: 9, joinedAtMs: 30 },
    ].sort(compareSeason);
    expect(rows.map((r) => r.id)).toEqual(["sharp", "early", "late"]);
  });
});
