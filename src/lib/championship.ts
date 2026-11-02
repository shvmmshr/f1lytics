// Confirmed by Mercedes and the FIA on 1 November 2026. Title records are
// editorial facts, never inferred from a driver's current position or points.
export const CONFIRMED_DRIVER_CHAMPIONSHIP = {
  season: 2026,
  driverId: "antonelli",
  confirmedAt: Date.parse("2026-11-01T23:00:00Z"),
  source: "https://www.mercedesamgf1.com/reports/race-report-kimi-antonelli-becomes-youngest-ever-world-champion-with-mexico-podium",
} as const;

/** A season title stays true after its temporary homepage celebration ends. */
export function getConfirmedDriverChampionship(season: number, driverId: string, now = Date.now()) {
  const title = CONFIRMED_DRIVER_CHAMPIONSHIP;
  return season === title.season && driverId === title.driverId && now >= title.confirmedAt
    ? title
    : null;
}
