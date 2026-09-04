import { describe, expect, it } from "vitest";
import type { QualifyingTable, RaceTable, SprintTable, JolpicaResponse } from "@/lib/api/types";
import qualifyingFixture from "./__fixtures__/dutch-gp-2026.qualifying.json";
import resultsFixture from "./__fixtures__/dutch-gp-2026.results.json";
import sprintFixture from "./__fixtures__/dutch-gp-2026.sprint.json";
import { driverIdFromJolpica, extractQualiResult, extractRaceResult, extractSprintResult } from "./results";

const quali = (qualifyingFixture as JolpicaResponse<QualifyingTable>).MRData.RaceTable.Races;
const results = (resultsFixture as JolpicaResponse<RaceTable>).MRData.RaceTable.Races;
const sprint = (sprintFixture as JolpicaResponse<SprintTable>).MRData.RaceTable.Races[0] ?? null;
const RACE_DATE = "2026-08-23";

describe("Dutch GP 2026 fixtures", () => {
  it("extracts pole from qualifying", () => {
    expect(extractQualiResult(quali, RACE_DATE)).toEqual({ pole: "norris" });
  });

  it("extracts podium, fastest lap and margin from the race", () => {
    expect(extractRaceResult(results, RACE_DATE)).toEqual({
      p1: "norris",
      p2: "antonelli",
      p3: "russell",
      fastestLap: "leclerc",
      marginMs: 11_536,
    });
  });

  it("extracts the sprint winner", () => {
    expect(extractSprintResult(sprint, RACE_DATE)).toEqual({ sprintWinner: "russell" });
  });

  it("refuses a round whose date does not match (Jolpica renumbering guard)", () => {
    expect(extractQualiResult(quali, "2026-08-30")).toBeNull();
    expect(extractRaceResult(results, "2026-08-30")).toBeNull();
    expect(extractSprintResult(sprint, "2026-08-30")).toBeNull();
  });

  it("maps unknown drivers to a code tag that no pick can match", () => {
    expect(driverIdFromJolpica({ driverId: "reserve_driver", code: "RES", url: "", givenName: "Re", familyName: "Serve", dateOfBirth: "2000-01-01", nationality: "x" })).toBe("code:RES");
  });

  it("returns a null margin when P2 has no time (lapped)", () => {
    const race = structuredClone(results[0]);
    const p2 = race.Results!.find((r) => r.position === "2")!;
    delete p2.Time;
    expect(extractRaceResult([race], RACE_DATE)?.marginMs).toBeNull();
  });
});
