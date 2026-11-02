import { describe, expect, it } from "vitest";
import type { RaceResult, ResultItem } from "@/lib/api/types";
import dutchResults from "@/lib/lockin/__fixtures__/dutch-gp-2026.results.json";
import { profileRaceRound, teamRaceEntries } from "./profile-results";

const dutch = dutchResults.MRData.RaceTable.Races[0] as RaceResult;

describe("profile calendar rounds", () => {
  it("keeps cancelled-round offsets consistent across driver and team profiles", () => {
    expect(profileRaceRound({ date: "2026-03-29", round: "3" })).toBe(3);
    expect(profileRaceRound({ date: "2026-05-03", round: "4" })).toBe(6);
    expect(profileRaceRound(dutch)).toBe(14);
    expect(profileRaceRound({ date: "2026-11-01", round: "19" })).toBe(21);
  });
  it("does not assign an unknown or historical date to a current-season race", () => {
    expect(profileRaceRound({ date: "2025-11-01", round: "20" })).toBe(20);
    expect(profileRaceRound({ date: "2026-11-02", round: "19" })).toBe(19);
  });
});

describe("profile constructor attribution", () => {
  it("keeps Lawson's Red Bull substitution points out of Racing Bulls results", () => {
    const rows = dutch.Results!;
    const racingBulls = teamRaceEntries(rows, "racing_bulls", new Set(["LAW", "LIN"]));
    expect(racingBulls.map((row) => row.Driver.code).sort()).toEqual(["LIN", "TSU"]);
    expect(racingBulls.reduce((total, row) => total + Number(row.points), 0)).toBe(0);
    const redBull = teamRaceEntries(rows, "red_bull", new Set(["VER", "HAD"]));
    expect(redBull.find((row) => row.Driver.code === "LAW")?.points).toBe("6");
    expect(rows.find((row) => row.Driver.code === "LAW")?.Constructor.constructorId).toBe("red_bull");
  });
  it("retains Mexico's Haas reserve classification without changing its permanent lineup", () => {
    const hirakawa = {
      ...dutch.Results![0],
      Driver: { ...dutch.Results![0].Driver, code: "HIR", driverId: "ryo_hirakawa", familyName: "Hirakawa" },
      Constructor: { ...dutch.Results![0].Constructor, constructorId: "haas", name: "Haas F1 Team" },
      position: "13", points: "0",
    } as ResultItem;
    expect(teamRaceEntries([hirakawa], "haas", new Set(["OCO", "BEA"]))).toEqual([hirakawa]);
    expect(teamRaceEntries([hirakawa], "racing_bulls", new Set(["LAW", "LIN"]))).toEqual([]);
  });
  it("uses driver fallback only when the constructor cannot be identified", () => {
    const lawson = dutch.Results!.find((row) => row.Driver.code === "LAW")!;
    const unknown = { ...lawson, Constructor: { ...lawson.Constructor, constructorId: "unknown", name: "Unlisted Racing" } };
    expect(teamRaceEntries([unknown], "racing_bulls", new Set(["LAW", "LIN"]))).toEqual([unknown]);
    expect(teamRaceEntries([lawson], "racing_bulls", new Set(["LAW", "LIN"]))).toEqual([]);
  });
});
