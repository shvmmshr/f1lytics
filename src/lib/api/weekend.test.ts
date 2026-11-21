import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CIRCUIT_LIST } from "@/lib/constants";
import { getDrivers, getRaceStartingGrid, getSessionResult, getSessions } from "./openf1";
import { getQualifyingResults } from "./jolpica";
import { getStartingGrid } from "./weekend";
import { publishedGridSnapshot } from "./published-grids";

vi.mock("./openf1", () => ({
  getDrivers: vi.fn(),
  getRaceStartingGrid: vi.fn(),
  getSessionResult: vi.fn(),
  getSessions: vi.fn(),
}));

vi.mock("./jolpica", () => ({
  getQualifyingResults: vi.fn(),
  getRaceResults: vi.fn(),
}));

const vegas = CIRCUIT_LIST.find((c) => c.slug === "las-vegas-gp")!;
const drivers = [
  { driver_number: 3, full_name: "Max Verstappen", team_name: "Red Bull Racing" },
  { driver_number: 12, full_name: "Kimi Antonelli", team_name: "Mercedes" },
  { driver_number: 51, full_name: "Rafael Câmara", team_name: "Haas F1 Team" },
].map((row) => ({ session_key: 2, name_acronym: "", team_colour: "", headshot_url: null, country_code: "", ...row }));

describe("weekend starting grid", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.mocked(getSessions).mockImplementation(async ({ session_name } = {}) => [{
      session_key: session_name === "Race" ? 2 : 1,
      meeting_key: 9,
      date_start: session_name === "Race" ? "2026-11-22T04:00:00Z" : "2026-11-21T04:00:00Z",
      date_end: "",
      session_name: String(session_name),
      session_type: String(session_name),
      location: "Las Vegas",
      country_name: "United States",
      circuit_short_name: "Las Vegas",
      year: 2026,
    }]);
    vi.mocked(getDrivers).mockResolvedValue(drivers);
    vi.mocked(getQualifyingResults).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses the race-session starting_grid feed over the qualifying classification", async () => {
    vi.setSystemTime(new Date("2026-11-21T06:00:00Z"));
    vi.mocked(getRaceStartingGrid).mockResolvedValue([
      { position: 6, driver_number: 12, lap_duration: 93.893, session_key: 2, meeting_key: 9 },
      { position: 1, driver_number: 3, lap_duration: 94.151, session_key: 2, meeting_key: 9 },
      { position: 0, driver_number: 51, lap_duration: null, session_key: 2, meeting_key: 9 },
      { position: 2, driver_number: 51, lap_duration: null, session_key: 1, meeting_key: 9 },
    ]);
    const grid = await getStartingGrid(vegas);
    expect(getSessions).toHaveBeenCalledWith({ year: "2026", session_name: "Race" });
    expect(getRaceStartingGrid).toHaveBeenCalledWith({ session_key: 2 });
    expect(getSessionResult).not.toHaveBeenCalled();
    expect(grid?.status).toBe("published");
    expect(grid?.rows.map(({ position, familyName, time }) => [position, familyName, time]))
      .toEqual([[1, "Verstappen", "1:34.151"], [6, "Antonelli", "1:33.893"]]);
  });

  it("uses the complete published FIA Vegas grid when OpenF1 has no race grid", async () => {
    vi.setSystemTime(new Date("2026-11-21T08:00:00Z"));
    vi.mocked(getRaceStartingGrid).mockResolvedValue([]);
    const grid = await getStartingGrid(vegas);
    expect(grid?.status).toBe("published-provisional");
    expect(grid?.rows).toHaveLength(22);
    expect(grid?.rows[0]).toMatchObject({ position: 1, familyName: "Verstappen" });
    expect(grid?.rows[5]).toMatchObject({ position: 6, familyName: "Antonelli" });
    expect(grid?.rows[14]).toMatchObject({ position: 15, familyName: "Câmara" });
    expect(getSessionResult).not.toHaveBeenCalled();
  });

  it("lets a complete Vegas feed replace the snapshot even when one driver has no numbered grid place", async () => {
    const now = new Date("2026-11-21T08:00:00Z");
    vi.setSystemTime(now);
    const snapshot = publishedGridSnapshot(vegas.raceDate, +now)!;
    vi.mocked(getRaceStartingGrid).mockResolvedValue(snapshot.rows.map((row) => ({
      position: row.position === 22 ? null : row.position,
      driver_number: row.position,
      lap_duration: null,
      session_key: 2,
      meeting_key: 9,
    })));
    vi.mocked(getDrivers).mockResolvedValue(snapshot.rows.map((row) => ({
      ...drivers[0],
      driver_number: row.position,
      full_name: row.driverName,
      team_name: row.teamName,
    })));
    const grid = await getStartingGrid(vegas);
    expect(grid?.status).toBe("published");
    expect(grid?.rows).toHaveLength(21);
    expect(grid?.rows[0]).toMatchObject({ position: 1, familyName: "Verstappen" });
    expect(grid?.rows.some((row) => row.position <= 0)).toBe(false);
  });

  it("labels unadjusted qualifying as a preview before a grid publishes (Antonelli Q1)", async () => {
    vi.setSystemTime(new Date("2026-11-21T06:00:00Z"));
    vi.mocked(getRaceStartingGrid).mockResolvedValue([]);
    vi.mocked(getSessionResult).mockResolvedValue([
      {
        position: 1, driver_number: 12, duration: [94.684, 95.086, 93.893], session_key: 1, meeting_key: 9,
        number_of_laps: 26, dnf: false, dns: false, dsq: false, gap_to_leader: null,
      },
    ]);
    const grid = await getStartingGrid(vegas);
    expect(grid?.status).toBe("qualifying-preview");
    expect(grid?.rows[0]).toMatchObject({ position: 1, familyName: "Antonelli", time: "1:33.893" });
  });
});
