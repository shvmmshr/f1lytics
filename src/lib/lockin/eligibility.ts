import { DRIVER_LIST } from "@/lib/constants/drivers";

/** Entries are keyed by race date, never by the upstream round number.
 * Haas: https://www.haasf1team.com/news/team-statement-driver-update-0
 * Câmara is confirmed for São Paulo only; Ocon will not return in 2026.
 * Mexico's Hirakawa classification remains a dated manifest substitution.
 * Keep identity/history in DRIVERS independent from selectable entries.
 */
export function getEligibleDriverIds(raceDate: string): Set<string> {
  return new Set(DRIVER_LIST.filter((driver) => {
    if (driver.id === "camara") return raceDate === "2026-11-08";
    if (driver.id === "ocon") return raceDate < "2026-11-01";
    return true;
  }).map((driver) => driver.id));
}

/** Clears only the editable copy; never rewrites persisted or historical picks. */
export function clearIneligibleSelections<T extends Record<string, unknown>>(
  draft: T,
  slots: readonly (keyof T)[],
  eligibleIds: ReadonlySet<string>,
): T {
  const next = { ...draft };
  for (const slot of slots) {
    if (typeof next[slot] === "string" && !eligibleIds.has(next[slot] as string)) {
      next[slot] = null as T[keyof T];
    }
  }
  return next;
}
