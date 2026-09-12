import { describe, expect, it } from "vitest";
import { TEAMS } from "@/lib/constants/teams";
import { getTeamTextColor } from "./team-color";

function luminance(hex: string) {
  const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

describe("team text contrast", () => {
  it.each(Object.values(TEAMS))("keeps $name legible on every broadcast surface", (team) => {
    for (const background of ["#08080A", "#0C0C0E", "#141418", "#1C1C22", "#26262E"]) {
      expect((luminance(getTeamTextColor(team.color)) + 0.05) / (luminance(background) + 0.05)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("preserves bright brand colours and safely handles missing upstream colours", () => {
    expect(getTeamTextColor("#27F4D2")).toBe("#27F4D2");
    expect(getTeamTextColor("unknown")).toBe("#B4B4BD");
    expect(getTeamTextColor("#1E3D2F")).not.toBe("#1E3D2F");
  });
});
