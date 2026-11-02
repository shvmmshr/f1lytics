import { describe, expect, it } from "vitest";
import { mapConstructorToTeamId, teamColorForName } from "./constructor-map";
import { TEAMS } from "./constants/teams";

describe("external constructor names", () => {
  it.each([null, undefined, ""])("handles missing OpenF1 team name %s without crashing replay", (name) => {
    expect(teamColorForName(name)).toBe("#84848F");
    expect(teamColorForName(name, "#123456")).toBe("#123456");
    expect(mapConstructorToTeamId("", name)).toBeUndefined();
  });

  it("retains known constructor IDs when their optional display name is missing", () => {
    expect(mapConstructorToTeamId("rb", null)).toBe("racing_bulls");
    expect(mapConstructorToTeamId("mercedes", undefined)).toBe("mercedes");
  });

  it("keeps known team colours and safely falls back for an unfamiliar team", () => {
    expect(teamColorForName("Red Bull Racing")).toBe(TEAMS.red_bull.color);
    expect(teamColorForName("Mercedes")).toBe(TEAMS.mercedes.color);
    expect(teamColorForName("New unknown constructor")).toBe("#84848F");
  });
});
