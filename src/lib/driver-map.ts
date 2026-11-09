import { DRIVERS, DRIVER_LIST, type Driver } from "@/lib/constants/drivers";

interface SourceDriver {
  driverId?: string;
  code?: string;
  familyName: string;
}

// Reviewed São Paulo 2026 classification / identity:
// https://api.jolpi.ca/ergast/f1/2026/20/results.json
// https://www.formula1.com/en/drivers/rafael-camara
// Jolpica omits Câmara's code, permanentNumber, DOB, nationality and URL.
// Identity is independent of race eligibility; never enrich the raw API rows.
const SOURCE_DRIVER_IDS = new Map([["rafael_camara", "camara"]]);

/** Resolve only reviewed source IDs, local IDs and existing driver codes. */
export function getDriverFromJolpica(driver: SourceDriver): Driver | undefined {
  const sourceId = driver.driverId && SOURCE_DRIVER_IDS.get(driver.driverId);
  if (sourceId) return DRIVERS[sourceId];
  const code = driver.code?.toUpperCase();
  return DRIVER_LIST.find((candidate) =>
    (code && candidate.abbreviation === code) || candidate.id === driver.driverId,
  );
}

/** Keep unknown entrants' existing display keys without creating a profile. */
export function jolpicaDriverCode(driver: SourceDriver): string {
  return getDriverFromJolpica(driver)?.abbreviation
    ?? (driver.code ?? driver.familyName.slice(0, 3)).toUpperCase();
}

/** Race grids can also come from OpenF1, which supplies only the family name. */
export function driverProfileHref(driver: SourceDriver): `/drivers/${string}` | null {
  const normalize = (value: string) => value.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const family = normalize(driver.familyName);
  const local = getDriverFromJolpica(driver)
    ?? DRIVER_LIST.find((candidate) => family && normalize(candidate.lastName) === family);
  return local ? `/drivers/${local.slug}` : null;
}
