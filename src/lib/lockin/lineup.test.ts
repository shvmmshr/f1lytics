import { describe, expect, it } from "vitest";
import manifest from "../../../scripts/reference-manifest.json";
import { DRIVERS, getDriverBySlug } from "@/lib/constants/drivers";
import type { Driver as JolpicaDriver } from "@/lib/api/types";
import { driverById, getBoardDrivers, labelForDriverId } from "./board-data";
import { clearIneligibleSelections, getEligibleDriverIds } from "./eligibility";
import { validatePicks } from "./picks";
import { driverIdFromJolpica } from "./results";

const slots = ["pole", "p1", "p2", "p3", "fastestLap", "sprintWinner"] as const;
const good = { pole: "norris", p1: "norris", p2: "antonelli", p3: "russell", fastestLap: "leclerc", sprintWinner: "norris", marginMs: 12345 };
const sourceDriver = (familyName: string, code?: string): JolpicaDriver => ({
  driverId: "rafael_camara", givenName: "Rafael", familyName, code,
  url: "", dateOfBirth: "2005-05-05", nationality: "Brazilian",
});

describe("dated Haas lineup", () => {
  it("registers Câmara separately with his official number and slug", () => {
    expect(DRIVERS.camara).toMatchObject({ id: "camara", number: 51, slug: "rafael-camara", lastName: "Câmara" });
    expect(getDriverBySlug("rafael-camara")?.id).toBe("camara");
    expect(getDriverBySlug("esteban-ocon")?.id).toBe("ocon");
    expect(driverById("ocon")).toMatchObject({ id: "ocon", code: "OCO", number: 31 });
    expect(labelForDriverId("ocon")).toBe("OCO");
  });

  it.each(["2026-10-25", "2026-11-01", "2026-11-07", "2026-11-09", "2026-11-21", "2026-12-06"])("does not extrapolate Câmara to %s", (raceDate) => {
    expect(getEligibleDriverIds(raceDate).has("camara")).toBe(false);
    expect(validatePicks({ ...good, pole: "camara" }, { isSprint: true, raceDate }).ok).toBe(false);
  });

  it("accepts Câmara in every São Paulo slot", () => {
    expect(getEligibleDriverIds("2026-11-08").has("camara")).toBe(true);
    for (const slot of slots) {
      expect(validatePicks({ ...good, [slot]: "camara" }, { isSprint: true, raceDate: "2026-11-08" }).ok).toBe(true);
    }
  });

  it.each(["2026-11-01", "2026-11-08", "2026-11-21", "2026-12-06"])("rejects Ocon in every submission slot on %s", (raceDate) => {
    for (const slot of slots) {
      const result = validatePicks({ ...good, [slot]: "ocon" }, { isSprint: true, raceDate });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toContain(`${slot}:`);
    }
  });

  it("retains historical Ocon validation and normal-weekend sprint normalization", () => {
    expect(validatePicks({ ...good, pole: "ocon" }, { isSprint: false, raceDate: "2026-10-25" }).ok).toBe(true);
    const result = validatePicks({ ...good, sprintWinner: "ocon" }, { isSprint: false, raceDate: "2026-11-21" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.picks.sprintWinner).toBeNull();
  });

  it("keeps date-specific boards independent while retaining historical lookups", () => {
    const saoPaulo = getBoardDrivers("2026-11-08");
    const historical = getBoardDrivers("2026-10-25");
    const future = getBoardDrivers("2026-11-21");
    expect(saoPaulo.filter(d => d.teamId === "haas").map(d => d.id).sort()).toEqual(["bearman", "camara"]);
    expect(historical.filter(d => d.teamId === "haas").map(d => d.id).sort()).toEqual(["bearman", "ocon"]);
    expect(future.filter(d => d.teamId === "haas").map(d => d.id)).toEqual(["bearman"]);
    expect(getBoardDrivers("2026-11-08")).toEqual(saoPaulo);
    expect(driverById("ocon")?.code).toBe("OCO");
  });

  it("preserves the Mexico-only Hirakawa exception without remapping his identity", () => {
    expect(manifest.confirmedSubstitutions.filter(entry => entry.sourceId === "ryo_hirakawa")).toEqual([{
      sourceId: "ryo_hirakawa", teamId: "haas", dates: ["2026-11-01"],
      source: "https://www.haasf1team.com/news/team-statement-driver-update",
    }]);
    expect(driverIdFromJolpica({ ...sourceDriver("Hirakawa", "HIR"), driverId: "ryo_hirakawa", givenName: "Ryo" })).toBe("code:HIR");
    expect(labelForDriverId("code:HIR")).toBe("HIR");
    expect(getEligibleDriverIds("2026-11-01").has("camara")).toBe(false);
  });

  it.each(["Câmara", "Camara", "Ca\u0302mara"])("maps %s results to Câmara without requiring a code", (name) => {
    expect(driverIdFromJolpica(sourceDriver(name))).toBe("camara");
  });

  it("maps CAM case-insensitively and preserves Ocon result identity", () => {
    expect(driverIdFromJolpica(sourceDriver("Different upstream spelling", "cam"))).toBe("camara");
    expect(driverIdFromJolpica({ ...sourceDriver("Ocon", "OCO"), driverId: "ocon", givenName: "Esteban" })).toBe("ocon");
  });

  it("clears only ineligible editable slots, preserving the original stored selections and margin", () => {
    const saved = Object.freeze({ ...good, pole: "ocon", fastestLap: "unknown", sprintWinner: "ocon", marginSeconds: "12.345" });
    const edited = clearIneligibleSelections(saved, slots, getEligibleDriverIds("2026-11-08"));
    expect(edited).not.toBe(saved);
    expect(edited).toEqual({ ...saved, pole: null, fastestLap: null, sprintWinner: null });
    expect(saved.pole).toBe("ocon");
    expect(saved.fastestLap).toBe("unknown");
    expect(saved.sprintWinner).toBe("ocon");
    expect(edited.marginSeconds).toBe("12.345");
    const nextRound = clearIneligibleSelections({ ...good, pole: "camara" }, slots, getEligibleDriverIds("2026-11-21"));
    expect(nextRound.pole).toBeNull();
  });
});
