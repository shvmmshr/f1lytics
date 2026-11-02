// Confirmed 1 November 2026 by Mercedes and the FIA. Keep this celebration
// on the current-season homepage only; never infer a title from live points.
export const CHAMPION_SOURCE = "https://www.mercedesamgf1.com/reports/race-report-kimi-antonelli-becomes-youngest-ever-world-champion-with-mexico-podium";
export const CHAMPION_KEY = "f1lytics:antonelli-2026";
export function showChampion(now: number): boolean {
  return now >= Date.parse("2026-11-01T23:00:00Z") && now < Date.parse("2027-01-01T00:00:00Z");
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
