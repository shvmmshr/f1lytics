import { describe, expect, it } from "vitest";
import manifest from "../../scripts/reference-manifest.json";
import standing from "./__fixtures__/camara-jolpica-standing.json";
import { DRIVERS } from "@/lib/constants/drivers";
import { getEligibleDriverIds } from "@/lib/lockin/eligibility";
import { driverProfileHref, getDriverFromJolpica, jolpicaDriverCode } from "./driver-map";

// Exact 2026 Jolpica standings row observed after São Paulo (2026-11-09).
// Missing optional identity fields are intentional, not fixture defaults.
describe("reviewed Jolpica driver identities", () => {
  it("resolves the incomplete Câmara source row without modifying it", () => {
    const before = structuredClone(standing);
    expect(getDriverFromJolpica(standing.Driver)).toBe(DRIVERS.camara);
    expect(jolpicaDriverCode(standing.Driver)).toBe("CAM");
    expect(driverProfileHref(standing.Driver)).toBe("/drivers/rafael-camara");
    expect(standing).toEqual(before);
    expect(standing.Driver).not.toHaveProperty("code");
    expect(standing.Driver).not.toHaveProperty("permanentNumber");
    expect(standing.Driver).not.toHaveProperty("dateOfBirth");
  });

  it("keeps the runtime source ID aligned with the reviewed sync manifest", () => {
    const reference = manifest.drivers.find((driver) => driver.id === "camara");
    expect(reference?.sourceId).toBe(standing.Driver.driverId);
    expect(getDriverFromJolpica(standing.Driver)?.id).toBe(reference?.id);
    expect(getDriverFromJolpica(standing.Driver)?.slug).toBe(reference?.slug);
  });

  it("uses the reviewed source ID independently of optional display fields", () => {
    expect(getDriverFromJolpica({ ...standing.Driver, familyName: "Updated spelling" })).toBe(DRIVERS.camara);
  });

  it("does not treat an unreviewed ID with the same surname as a known entrant", () => {
    for (const driverId of ["other_camara", "unknown", "__proto__"]) {
      expect(getDriverFromJolpica({ ...standing.Driver, driverId })).toBeUndefined();
    }
    expect(getDriverFromJolpica({ familyName: "Camara" })).toBeUndefined();
    const unknown = { driverId: "ryo_hirakawa", code: "HIR", familyName: "Hirakawa" };
    expect(getDriverFromJolpica(unknown)).toBeUndefined();
    expect(jolpicaDriverCode(unknown)).toBe("HIR");
    expect(driverProfileHref(unknown)).toBeNull();
  });

  it("preserves existing code and local-ID lookups, including former entrants", () => {
    expect(getDriverFromJolpica({ code: "cam", familyName: "Unknown spelling" })).toBe(DRIVERS.camara);
    expect(getDriverFromJolpica({ driverId: "ocon", familyName: "Ocon" })).toBe(DRIVERS.ocon);
    expect(getDriverFromJolpica({ driverId: "max_verstappen", code: "VER", familyName: "Verstappen" })).toBe(DRIVERS.verstappen);
    expect(jolpicaDriverCode({ familyName: "Unlisted" })).toBe("UNL");
  });

  it.each(["Câmara", "Camara", "Ca\u0302mara"])("retains race-grid name-only links for %s", (familyName) => {
    expect(driverProfileHref({ familyName })).toBe("/drivers/rafael-camara");
  });

  it("does not broaden date-specific eligibility or rewrite historical identity", () => {
    expect(getEligibleDriverIds("2026-11-08").has("camara")).toBe(true);
    for (const date of ["2026-11-01", "2026-11-07", "2026-11-09", "2026-11-22"]) {
      expect(getEligibleDriverIds(date).has("camara")).toBe(false);
    }
    expect(getEligibleDriverIds("2026-10-25").has("ocon")).toBe(true);
    expect(getDriverFromJolpica({ driverId: "ocon", code: "OCO", familyName: "Ocon" })?.id).toBe("ocon");
  });
});
