import { describe, expect, it } from "vitest";
import { CIRCUITS } from "@/lib/constants/circuits";
import { WEEKEND_SCHEDULES, SESSION_DURATIONS_MS } from "@/lib/constants/sessions";
import type { RaceResult, ResultItem } from "@/lib/api/types";
import { circuitLapRecord, circuitWeekendState, matchingCircuitRace } from "./weekend";

const madrid = CIRCUITS.madrid;
function race(time = "1:32.000", date = madrid.raceDate, season = "2026"): RaceResult {
  return { season, round: "14", date, raceName: "Spanish Grand Prix", url: "", Circuit: { circuitId: "madrid", url: "", circuitName: "Madring", Location: { lat: "0", long: "0", locality: "Madrid", country: "Spain" } }, Results: [{ position: "1", status: "Finished", Driver: { driverId: "test", givenName: "Test", familyName: "Driver" }, FastestLap: { Time: { time } } } as ResultItem] };
}

describe("circuit weekend freshness", () => {
  it("does not turn a scheduled finish into a published result", () => {
    const schedule = WEEKEND_SCHEDULES[madrid.raceDate];
    expect(circuitWeekendState(madrid, Date.parse(schedule.fp1!) - 1)).toBe("upcoming");
    expect(circuitWeekendState(madrid, Date.parse(schedule.fp1!))).toBe("weekend");
    expect(circuitWeekendState(madrid, Date.parse(schedule.qualifying!) + 3600000)).toBe("weekend");
    expect(circuitWeekendState(madrid, Date.parse(schedule.race) + SESSION_DURATIONS_MS.race)).toBe("awaiting");
    expect(circuitWeekendState(madrid, Date.parse(schedule.race) + 86400000, race())).toBe("completed");
  });
  it("rejects results from a renumbered wrong race or another season", () => {
    expect(matchingCircuitRace(madrid, race("1:20.000", "2026-09-06"))).toBeUndefined();
    expect(matchingCircuitRace(madrid, race("1:20.000", madrid.raceDate, "2025"))).toBeUndefined();
    expect(circuitWeekendState(madrid, Date.parse("2026-09-15"), race("1:20.000", "2026-09-06"))).toBe("awaiting");
  });
  it("keeps cancelled events cancelled, even if a result is supplied", () => {
    expect(circuitWeekendState(CIRCUITS.bahrain, Date.parse("2026-12-01"), race("1:20.000", CIRCUITS.bahrain.raceDate))).toBe("cancelled");
    expect(matchingCircuitRace(CIRCUITS.bahrain, race("1:20.000", CIRCUITS.bahrain.raceDate))).toBeUndefined();
  });
  it("fills a maiden circuit record from its first published race", () => {
    expect(circuitLapRecord(madrid)).toBeNull();
    expect(circuitLapRecord(madrid, race())).toEqual({ time: "1:32.000", holder: "Test Driver", year: 2026, source: "classification" });
    expect(circuitLapRecord(madrid, race("1:20.000", "2026-09-06"))).toBeNull();
  });
  it("only improves an existing record with a valid faster race lap", () => {
    const circuit = { ...madrid, lapRecord: "1:30.000", lapRecordHolder: "Previous Driver", lapRecordYear: 2025 };
    expect(circuitLapRecord(circuit, race())?.holder).toBe("Previous Driver");
    expect(circuitLapRecord(circuit, race("1:29.999"))?.holder).toBe("Test Driver");
    for (const time of ["0:00.000", "1:99.000", "NaN", "", "-1:20.000"]) expect(circuitLapRecord(circuit, race(time))?.holder).toBe("Previous Driver");
    const disqualified = race("1:20.000");
    disqualified.Results![0].status = "Disqualified";
    expect(circuitLapRecord(circuit, disqualified)?.holder).toBe("Previous Driver");
  });
});
