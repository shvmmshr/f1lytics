import type { GridRow, StartingGrid } from "./weekend";
import { teamColorForName } from "@/lib/constructor-map";

// Race-specific resilience against lag or unavailability in the OpenF1 grid
// feed. Never infer penalties by shifting qualifying positions locally.
const vegas: ReadonlyArray<readonly [string, string, string]> = [
  ["Max Verstappen", "Red Bull Racing", "1:34.151"],
  ["George Russell", "Mercedes", "1:34.224"],
  ["Lando Norris", "McLaren", "1:34.244"],
  ["Isack Hadjar", "Red Bull Racing", "1:34.592"],
  ["Arvid Lindblad", "Racing Bulls", "1:34.668"],
  ["Kimi Antonelli", "Mercedes", "1:33.893"],
  ["Liam Lawson", "Racing Bulls", "1:35.090"],
  ["Pierre Gasly", "Alpine", "1:35.105"],
  ["Franco Colapinto", "Alpine", "1:35.314"],
  ["Charles Leclerc", "Ferrari", "1:35.197"],
  ["Lewis Hamilton", "Ferrari", "1:35.253"],
  ["Nico Hülkenberg", "Audi", "1:35.460"],
  ["Gabriel Bortoleto", "Audi", "1:35.993"],
  ["Alexander Albon", "Williams", "1:36.125"],
  ["Rafael Câmara", "Haas F1 Team", "1:36.220"],
  ["Sergio Pérez", "Cadillac", "1:37.383"],
  ["Oscar Piastri", "McLaren", "1:34.899"],
  ["Fernando Alonso", "Aston Martin", "1:37.400"],
  ["Valtteri Bottas", "Cadillac", "1:37.601"],
  ["Carlos Sainz", "Williams", "1:35.641"],
  ["Lance Stroll", "Aston Martin", "1:37.550"],
  ["Oliver Bearman", "Haas F1 Team", "1:48.005"],
];

/**
 * FIA Doc 49 (Provisional Starting Grid), published at 23:45 PST on Nov 20:
 * https://www.fia.com/system/files/decision-document/2026_las_vegas_grand_prix_-_provisional_starting_grid.pdf
 * Corroborated by https://www.formula1.com/en/results/2026/races/1300/las-vegas/starting-grid
 */
export function publishedGridSnapshot(raceKey: string, now: number): StartingGrid | null {
  if (raceKey !== "2026-11-22" || now < Date.parse("2026-11-21T07:45:00Z")) return null;
  const rows: GridRow[] = vegas.map(([driverName, teamName, time], i) => ({
    position: i + 1,
    driverName,
    familyName: driverName.split(" ").at(-1) ?? driverName,
    teamName,
    teamColor: teamColorForName(teamName),
    time,
  }));
  return { status: "published-provisional", rows };
}
