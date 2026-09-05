import { CIRCUIT_LIST, type Circuit } from "@/lib/constants";
import { SESSION_LABELS, type ActiveSession } from "@/lib/constants/sessions";
import type { GridRow, RecentRace } from "@/lib/api/weekend";

/**
 * The homepage headline, generated from season state rather than a slogan.
 *
 * Every phase derives from data the page already has: the server-computed
 * weekend context (grid, sprint winner), the recent race, the standings, and
 * the client-side "session on track" check. Nothing here reads the clock.
 */

/** Server-computed race-weekend context (the homepage's `WeekendInfo`). */
export interface HeroWeekend {
  raceSlug: string;
  isSprint: boolean;
  /** Top of the starting grid once qualifying results publish. P1 = pole. */
  grid?: GridRow[];
  /** Sprint winner, once the sprint has run (sprint weekends only). */
  sprintWinner?: { name: string };
}

export interface HeroStanding {
  name: string;
  points: number;
}

export interface HeroCopyInput {
  /** Competitive session on track right now (client clock; null until mounted). */
  liveSession: ActiveSession | null;
  /** The next event's circuit, or null once the season is over. */
  nextRace: Circuit | null;
  /** What the countdown targets: the sprint or the race. */
  eventType: "sprint" | "race" | null;
  weekend: HeroWeekend | null;
  recentRace: RecentRace | null;
  leader?: HeroStanding;
  runnerUp?: HeroStanding;
}

export type HeroPhase =
  | "live"
  | "grid-set"
  | "sprint-done"
  | "weekend"
  | "post-race"
  | "season"
  | "fallback";

export interface HeroLink {
  label: string;
  href: string;
}

export interface HeroCopy {
  phase: HeroPhase;
  /** Small mono line above the headline. */
  eyebrow: string;
  /** First display line, solid. */
  line1: string;
  /** Second display line, stroked. Null when the ticking clock is the second line. */
  line2: string | null;
  /** Screen-reader-only suffix so the heading always names the Grand Prix. */
  srSuffix: string | null;
  /**
   * Ticking clock under the headline. `label: null` renders the big inline
   * form ("IN 1D 05:25"); a label renders it small above the digits.
   */
  clock: { label: string | null } | null;
  description: string;
  primary: HeroLink;
  secondary: HeroLink;
}

// ── Width rule ──────────────────────────────────────────────────────────────
// The headline is Antonio Bold at clamp(48px, 10.5vw, 148px) with -0.04em
// tracking, in a column that is 4.95em wide at the 1440px layout and 4.77em
// at the 1024px one. Advance widths below were measured in the browser at
// 1000px and reproduce whole-string widths within 0.002em (see the tests).
const GLYPH_EM: Record<string, number> = {
  "0": 0.493, "1": 0.33, "2": 0.464, "3": 0.469, "4": 0.464, "5": 0.464, "6": 0.464, "7": 0.464, "8": 0.464, "9": 0.464,
  A: 0.453, B: 0.48, C: 0.473, D: 0.492, E: 0.391, F: 0.386, G: 0.488, H: 0.508, I: 0.265, J: 0.462, K: 0.479, L: 0.367,
  M: 0.692, N: 0.522, O: 0.488, P: 0.46, Q: 0.488, R: 0.484, S: 0.427, T: 0.345, U: 0.495, V: 0.454, W: 0.664, X: 0.438,
  Y: 0.429, Z: 0.365,
  " ": 0.179, ".": 0.26, ",": 0.238, ":": 0.271, "'": 0.207, "+": 0.395, "-": 0.34, "&": 0.514,
};
const TRACKING_EM = -0.04;
/** Widest line that fits the heading column at every desktop width. */
export const HEADLINE_MAX_EM = 4.7;

/** Rendered width of a headline line, in em of its font size. */
export function headlineWidthEm(text: string): number {
  const upper = text.toUpperCase();
  let width = 0;
  for (const ch of upper) width += GLYPH_EM[ch] ?? 0.5;
  return width + Math.max(0, upper.length - 1) * TRACKING_EM;
}

export function fitsHeadline(text: string): boolean {
  return headlineWidthEm(text) <= HEADLINE_MAX_EM;
}

/** First candidate that fits the column; the last candidate must always fit. */
function fit(candidates: string[]): string {
  return candidates.find(fitsHeadline) ?? candidates[candidates.length - 1];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const surname = (fullName: string): string => fullName.trim().split(/\s+/).pop() ?? fullName;

/**
 * OpenF1 writes surnames in capitals ("Pierre GASLY", "Nyck DE VRIES"). The
 * headline uppercases everything anyway; sentence copy wants "Pierre Gasly".
 */
export function properName(name: string): string {
  return name
    .split(" ")
    .map((word) =>
      word.length > 1 && word === word.toUpperCase()
        ? word.toLowerCase().replace(/(^|['-])(\p{L})/gu, (_, lead: string, letter: string) => lead + letter.toUpperCase())
        : word
    )
    .join(" ");
}

const rd = (circuit: Circuit): string => `RD ${String(circuit.round).padStart(2, "0")}`;

/** "Sunday 13 September" for a UTC race date. */
function longDate(raceDate: string): string {
  return new Date(`${raceDate}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function circuitBySlug(slug: string): Circuit | undefined {
  return CIRCUIT_LIST.find((c) => c.slug === slug);
}

function circuitByRaceDate(raceDate: string): Circuit | undefined {
  return CIRCUIT_LIST.find((c) => c.raceDate === raceDate);
}

/** Rounds still to run this season, counting the next one. */
function roundsToGo(nextRace: Circuit): number {
  return CIRCUIT_LIST.filter((c) => !c.cancelled && c.round >= nextRace.round).length;
}

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? "" : "s"}`;

/** "ahead of Russell and Piastri" from a classification, or "" when short. */
function aheadOf(rows: GridRow[]): string {
  const [, p2, p3] = rows;
  if (p2 && p3) return `, ahead of ${properName(p2.familyName)} and ${properName(p3.familyName)}`;
  if (p2) return `, ahead of ${properName(p2.familyName)}`;
  return "";
}

const STANDINGS: HeroLink = { label: "VIEW STANDINGS", href: "/standings" };
const STANDINGS_SECONDARY: HeroLink = { label: "VIEW STANDINGS →", href: "/standings" };

const SESSION_SENTENCE: Record<ActiveSession["session"], string> = {
  fp1: "Practice 1",
  fp2: "Practice 2",
  fp3: "Practice 3",
  sprintQualifying: "Sprint qualifying",
  sprint: "The sprint",
  qualifying: "Qualifying",
  race: "The race",
};

// ── Phases ──────────────────────────────────────────────────────────────────

function liveCopy(session: ActiveSession): HeroCopy {
  const circuit = circuitByRaceDate(session.raceDate);
  const label = SESSION_LABELS[session.session];
  const where = circuit ? ` at ${circuit.city}` : "";
  return {
    phase: "live",
    eyebrow: `ON AIR · ${label}`,
    line1: "IT'S LIVE.",
    // "SPRINT QUALIFYING." is the one label that overflows the column.
    line2: fit([`${label}.`, session.session === "sprintQualifying" ? "SPRINT QUALI." : "ON TRACK."]),
    srSuffix: circuit ? ` · ${circuit.fullName}` : null,
    clock: null,
    description: `${SESSION_SENTENCE[session.session]} is under way${where}. Positions, gaps and race control, streaming now on the live timing screen.`,
    primary: { label: "WATCH LIVE TIMING", href: "/live" },
    secondary: circuit
      ? { label: "RACE CENTRE →", href: `/races/${circuit.slug}` }
      : { label: "EXPLORE RACES →", href: "/races" },
  };
}

function clockFor(eventType: HeroCopyInput["eventType"]): HeroCopy["clock"] {
  return { label: eventType === "sprint" ? "SPRINT IN" : "LIGHTS OUT IN" };
}

function gridSetCopy(circuit: Circuit, weekend: HeroWeekend, grid: GridRow[], eventType: HeroCopyInput["eventType"]): HeroCopy {
  const pole = grid[0];
  return {
    phase: "grid-set",
    eyebrow: `GRID SET · ${rd(circuit)} · ${circuit.fullName.toUpperCase()}`,
    line1: pole.familyName.toUpperCase(),
    line2: "ON POLE.",
    srSuffix: ` · ${circuit.fullName}`,
    clock: clockFor(eventType),
    description: `${properName(pole.driverName)} takes pole for ${pole.teamName}${aheadOf(grid)}. Penalties can still move the grid. Full order, schedule and live timing in one place.`,
    primary: { label: "STARTING GRID", href: `/races/${weekend.raceSlug}#starting-grid` },
    secondary: STANDINGS_SECONDARY,
  };
}

function sprintDoneCopy(circuit: Circuit, weekend: HeroWeekend, winner: string, eventType: HeroCopyInput["eventType"]): HeroCopy {
  return {
    phase: "sprint-done",
    eyebrow: `SPRINT DONE · ${rd(circuit)} · ${circuit.fullName.toUpperCase()}`,
    line1: surname(winner).toUpperCase(),
    line2: fit(["WINS SPRINT.", "SPRINT WIN."]),
    srSuffix: ` · ${circuit.fullName}`,
    clock: clockFor(eventType),
    description: `${properName(winner)} wins the sprint at ${circuit.city}. Qualifying sets Sunday's grid next, and it lands here minutes after the session.`,
    primary: { label: "RACE CENTRE", href: `/races/${weekend.raceSlug}` },
    secondary: STANDINGS_SECONDARY,
  };
}

function weekendCopy(circuit: Circuit, weekend: HeroWeekend, eventType: HeroCopyInput["eventType"]): HeroCopy {
  const description =
    eventType === "sprint"
      ? `A sprint weekend from ${circuit.city}. The sprint comes first, then qualifying sets Sunday's grid. Results land here minutes after each session.`
      : `The ${circuit.fullName} from ${circuit.city}. Qualifying sets the grid, and it lands here minutes after the session, with the schedule and live timing alongside.`;
  return {
    phase: "weekend",
    eyebrow: `RACE WEEKEND · ${rd(circuit)} · ${circuit.fullName.toUpperCase()}`,
    line1: "LIGHTS OUT",
    line2: null,
    srSuffix: ` · ${circuit.fullName}`,
    clock: { label: null },
    description,
    primary: { label: "RACE CENTRE", href: `/races/${weekend.raceSlug}` },
    secondary: STANDINGS_SECONDARY,
  };
}

function postRaceCopy(recent: RecentRace): HeroCopy {
  const circuit = circuitBySlug(recent.slug);
  const gpName = circuit?.fullName ?? recent.name;
  const winner = recent.podium[0];
  // The OpenF1 fallback carries no points, and a post-race penalty can still
  // change the classification until the official result is out.
  const provisional = winner.time === null;
  const line2 = fit([
    ...(circuit ? [`WINS ${circuit.city.toUpperCase()}.`] : []),
    `WINS RD ${String(recent.round).padStart(2, "0")}.`,
    "WINS.",
  ]);
  return {
    phase: "post-race",
    eyebrow: `${provisional ? "PROVISIONAL RESULT" : "CHEQUERED FLAG"} · RD ${String(recent.round).padStart(2, "0")} · ${gpName.toUpperCase()}`,
    line1: winner.familyName.toUpperCase(),
    line2,
    srSuffix: ` · ${gpName}`,
    clock: null,
    description: `${properName(winner.driverName)} wins the ${gpName} for ${winner.teamName}${aheadOf(recent.podium)}. ${
      provisional ? "Provisional until the official classification is published." : "Full results, lap times and strategy are in."
    }`,
    primary: { label: "FULL RESULTS", href: `/races/${recent.slug}` },
    secondary: STANDINGS_SECONDARY,
  };
}

function seasonCopy(nextRace: Circuit | null, leader?: HeroStanding, runnerUp?: HeroStanding): HeroCopy {
  const eyebrow = nextRace
    ? `NEXT · ${rd(nextRace)} · ${nextRace.fullName.toUpperCase()}`
    : "2026 SEASON · TELEMETRY & ANALYSIS";
  const nextUp = nextRace
    ? ` Next up: the ${nextRace.fullName} at ${nextRace.city}, ${longDate(nextRace.raceDate)}.`
    : "";
  const secondary: HeroLink = nextRace
    ? { label: "NEXT RACE →", href: `/races/${nextRace.slug}` }
    : { label: "EXPLORE RACES →", href: "/races" };

  const gap = leader && runnerUp && leader.points > runnerUp.points ? Math.round(leader.points - runnerUp.points) : null;
  if (leader && runnerUp && gap !== null) {
    const toGo = nextRace ? ` with ${plural(roundsToGo(nextRace), "round")} to go` : "";
    return {
      phase: "season",
      eyebrow,
      line1: surname(leader.name).toUpperCase(),
      line2: fit([`LEADS BY ${gap}.`, `LEADS +${gap}.`, "LEADS."]),
      srSuffix: null,
      clock: null,
      description: `${surname(leader.name)} leads ${surname(runnerUp.name)} by ${plural(gap, "point")}${toGo}.${nextUp}`,
      primary: STANDINGS,
      secondary,
    };
  }

  // No standings yet, a tie at the top, or the API fallback with zero points:
  // never invent a story.
  return {
    phase: "fallback",
    eyebrow,
    line1: "FORMULA 1,",
    line2: "DECODED.",
    srSuffix: null,
    clock: null,
    description: `Standings, race analysis, telemetry and the full 2026 season in one place.${nextUp}`,
    primary: STANDINGS,
    secondary,
  };
}

/**
 * Precedence: a session on track, then the grid, then a sprint result, then
 * the weekend countdown, then the race that just finished, then the season.
 */
export function heroCopy(input: HeroCopyInput): HeroCopy {
  const { liveSession, nextRace, eventType, recentRace, leader, runnerUp } = input;
  // The weekend object is computed on the server when the page is rendered;
  // the next race comes from the client clock. Around the two-hour post-race
  // rollover they can disagree, so weekend data only counts for its own race.
  const weekend = input.weekend && nextRace && input.weekend.raceSlug === nextRace.slug ? input.weekend : null;

  if (liveSession) return liveCopy(liveSession);
  if (weekend && nextRace) {
    if (weekend.grid && weekend.grid.length > 0) return gridSetCopy(nextRace, weekend, weekend.grid, eventType);
    if (weekend.sprintWinner) return sprintDoneCopy(nextRace, weekend, weekend.sprintWinner.name, eventType);
    return weekendCopy(nextRace, weekend, eventType);
  }
  if (recentRace && recentRace.podium.length > 0) return postRaceCopy(recentRace);
  return seasonCopy(nextRace, leader, runnerUp);
}
