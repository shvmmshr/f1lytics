import { CONFIRMED_DRIVER_CHAMPIONSHIP, getConfirmedDriverChampionship } from "../championship";

// Keep the temporary celebration on the current-season homepage only.
export const CHAMPION_SOURCE = CONFIRMED_DRIVER_CHAMPIONSHIP.source;
export const CHAMPION_KEY = "f1lytics:antonelli-2026";
export function showChampion(now: number): boolean {
  return getConfirmedDriverChampionship(2026, "antonelli", now) !== null && now < Date.parse("2027-01-01T00:00:00Z");
}
const sessionPreferences = new Set<string>();
export function readCelebration(key: string): boolean {
  if (sessionPreferences.has(key)) return true;
  try { return localStorage.getItem(`${CHAMPION_KEY}:${key}`) === "1"; }
  catch { return false; }
}
export function saveCelebration(key: string): void {
  sessionPreferences.add(key);
  try { localStorage.setItem(`${CHAMPION_KEY}:${key}`, "1"); }
  catch { /* Private browsing must not prevent celebration or dismissal. */ }
}
