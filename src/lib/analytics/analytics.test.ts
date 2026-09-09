import { describe, expect, it } from "vitest";
import type { DriverStanding, OpenF1Lap, OpenF1RaceControl, RaceResult, ResultItem, SprintRace } from "@/lib/api/types";
import { CIRCUIT_LIST, getApiRound } from "@/lib/constants/circuits";
import { mapConstructorToTeamId } from "@/lib/constructor-map";
import { buildPointsProgression } from "./points";
import { buildLapChart, lapChartView } from "./lap-chart";
import { isRaceFinisher, raceInsights } from "./results";
import { parseComparisonSelection } from "./comparison-selection";
import { buildComparisonStats } from "./comparison";

function result(overrides: Partial<ResultItem> = {}): ResultItem {
  return { Driver: { code: "NOR", familyName: "Norris", givenName: "Lando" }, Constructor: { constructorId: "mclaren", name: "McLaren" }, points: "25", position: "1", grid: "4", status: "Finished", ...overrides } as ResultItem;
}
const weekends = CIRCUIT_LIST.filter((c) => !c.cancelled);
function race(index: number, rows: ResultItem[]): RaceResult {
  const c = weekends[index];
  return { date: c.raceDate, round: String(getApiRound(c)), Results: rows } as RaceResult;
}

describe("championship progression", () => {
  it("combines sprint and race points and retains local calendar round labels", () => {
    const gp = race(5, [result()]);
    const sprint = { ...gp, Results: undefined, SprintResults: [result({ points: "8" })] } as SprintRace;
    const totals = buildPointsProgression([gp], [sprint]);
    expect(totals.drivers.NOR).toEqual([{ round: weekends[5].round, cumulativePoints: 33 }]);
    expect(totals.teams.mclaren).toEqual(totals.drivers.NOR);
  });
  it("retains a sprint-only weekend and carries absent drivers forward", () => {
    const sprint = { ...race(0, []), SprintResults: [result({ points: "8" })] } as SprintRace;
    const other = result({ Driver: { code: "PIA", familyName: "Piastri" } as ResultItem["Driver"] });
    const totals = buildPointsProgression([race(1, [other])], [sprint]);
    expect(totals.drivers.NOR.map((p) => p.cumulativePoints)).toEqual([8, 8]);
    expect(totals.teams.mclaren.at(-1)?.cumulativePoints).toBe(33);
  });
  it("rejects a date/round mismatch and invalid points", () => {
    expect(buildPointsProgression([{ ...race(0, [result()]), round: "99" }], []).drivers).toEqual({});
    expect(buildPointsProgression([race(0, [result({ points: "NaN" })])], []).drivers).toEqual({});
  });
  it("does not assign empty or unknown constructors to a real team", () => {
    expect(mapConstructorToTeamId("", "")).toBeUndefined();
    expect(mapConstructorToTeamId("unknown", "Unlisted Racing")).toBeUndefined();
  });
});

describe("race insights", () => {
  it("keeps official points while excluding retirements from best-finish comparisons", () => {
    const standing = { Driver: result().Driver, points: "100", position: "3", wins: "0" } as DriverStanding;
    const stats = buildComparisonStats([standing], [], [race(0, [result({ position: "2", status: "Engine" })]), race(1, [result({ position: "4", points: "12" })])], [], []).driverStats.NOR;
    expect(stats.points).toBe(100);
    expect(stats.bestFinish).toBe(4);
    expect(stats.podiums).toBe(0);
    expect(stats.recentForm.map((r) => r.position)).toEqual([null, 4]);
    expect(stats.avgQualifying).toBeNull();
  });
  it.each(["Finished", "+1 Lap", "+2 Laps"])("counts %s as a finish", (status) => expect(isRaceFinisher(status)).toBe(true));
  it.each(["Engine", "Disqualified", "Accident", "Not classified"])("excludes %s from finish metrics", (status) => expect(isRaceFinisher(status)).toBe(false));
  it("excludes retirements and pit-lane starters from recovery", () => {
    const insights = raceInsights([result({ grid: "0" }), result({ grid: "20", position: "2", status: "Engine" })]);
    expect(insights.find((i) => i.label === "Biggest recovery")).toBeUndefined();
    expect(raceInsights([])).toEqual([]);
  });
});

describe("lap chart normalization", () => {
  it("filters long laps only in the visual view without changing source values", () => {
    const model = { rows: [{ lap: 1, d4: 90 }, { lap: 2, d4: 91 }, { lap: 3, d4: 1900 }], series: [], safetyCars: [] };
    expect(lapChartView(model, ["d4"], false)).toEqual({ rows: [{ lap: 1, d4: 90 }, { lap: 2, d4: 91 }, { lap: 3, d4: null }], omitted: 1 });
    expect(lapChartView(model, ["d4"], true).rows).toEqual(model.rows);
    expect(model.rows[2].d4).toBe(1900);
  });
  it("sorts sparse laps, omits invalid timings, and preserves unknown cars", () => {
    const laps = [{ lap_number: 2, driver_number: 4, lap_duration: 90 }, { lap_number: 1, driver_number: 81, lap_duration: 91 }, { lap_number: 1, driver_number: 4, lap_duration: null }, { lap_number: 3, driver_number: 4, lap_duration: -1 }] as OpenF1Lap[];
    const model = buildLapChart(laps, [{ driverNumber: 4, label: "NOR", color: "ff8800" }], []);
    expect(model.rows).toEqual([{ lap: 1, d81: 91 }, { lap: 2, d4: 90 }]);
    expect(model.series.map((s) => s.label)).toEqual(["NOR", "#81"]);
    expect(model.series[0].color).toBe("#ff8800");
  });
  it("closes a safety-car period at the last recorded lap", () => {
    const events = [{ date: "2026-01-01T00:00:00Z", lap_number: 2, message: "SAFETY CAR DEPLOYED" }] as OpenF1RaceControl[];
    expect(buildLapChart([{ lap_number: 5, driver_number: 4, lap_duration: 100 }] as OpenF1Lap[], [], events).safetyCars).toEqual([{ startLap: 2, endLap: 5 }]);
  });
});

it("normalizes malformed comparison links to distinct canonical entrants", () => {
  const selection = parseComparisonSelection(new URLSearchParams("mode=invalid&driverA=unknown&driverB=unknown&teamA=unknown"));
  expect(selection.mode).toBe("drivers");
  expect(selection.driverA).not.toBe(selection.driverB);
  expect(selection.teamA).not.toBe(selection.teamB);
});
