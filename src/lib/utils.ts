import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { TEAMS } from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// Lap / gap formatting
// ---------------------------------------------------------------------------

/**
 * Format a lap duration in seconds to a human-readable string.
 *
 * - >= 60 s  ->  "M:SS.mmm"   (e.g. "1:23.456")
 * - <  60 s  ->  "SS.mmm"     (e.g. "23.456")
 * - null     ->  "—"
 */
export function formatLapTime(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "\u2014";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const fixed = secs.toFixed(3).padStart(6, "0");
  return mins > 0 ? `${mins}:${fixed}` : fixed;
}

/**
 * Format a gap value.
 *
 * - 0 or null  ->  "LEADER"
 * - positive   ->  "+1.234"
 */
export function formatGap(gap: number | null): string {
  if (gap === null || gap === undefined || gap === 0) return "LEADER";
  return `+${gap.toFixed(3)}`;
}

// ---------------------------------------------------------------------------
// Team helpers
// ---------------------------------------------------------------------------

/** Default fallback colour when the team ID is unknown. */
const DEFAULT_TEAM_COLOR = "#888888";

/**
 * Look up the primary colour for a team by its ID (e.g. "mclaren", "red_bull").
 * Returns a hex colour string, falling back to a neutral grey.
 */
export function getTeamColor(teamId: string): string {
  return TEAMS[teamId]?.color ?? DEFAULT_TEAM_COLOR;
}

// ---------------------------------------------------------------------------
// Position helpers
// ---------------------------------------------------------------------------

/**
 * Calculate how many places a driver gained or lost.
 * Positive = gained positions, negative = lost positions.
 */
export function positionChange(grid: number, finish: number): number {
  return grid - finish;
}

/**
 * Return an ordinal suffix string for a position number.
 *
 * 1 -> "1st", 2 -> "2nd", 3 -> "3rd", 4 -> "4th", 11 -> "11th", 21 -> "21st"
 */
export function positionSuffix(pos: number): string {
  const mod100 = pos % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${pos}th`;
  switch (pos % 10) {
    case 1:
      return `${pos}st`;
    case 2:
      return `${pos}nd`;
    case 3:
      return `${pos}rd`;
    default:
      return `${pos}th`;
  }
}
