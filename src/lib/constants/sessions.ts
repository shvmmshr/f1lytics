/**
 * Full 2026 race-weekend session schedules (UTC), baked from the Jolpica
 * Ergast schedule (https://api.jolpi.ca/ergast/f1/2026.json) so no runtime
 * fetch is needed. Keyed by RACE DATE, not round number, because Jolpica
 * renumbers rounds when races are cancelled (see getApiRound).
 *
 * Sprint weekends carry sprintQualifying + sprint instead of fp2/fp3.
 */

export interface WeekendSchedule {
  /** ISO 8601 UTC datetimes, e.g. "2026-03-06T01:30:00Z" */
  fp1?: string;
  fp2?: string;
  fp3?: string;
  sprintQualifying?: string;
  sprint?: string;
  qualifying?: string;
  race: string;
}

export const WEEKEND_SCHEDULES: Record<string, WeekendSchedule> = {
  // R01 Australian Grand Prix
  "2026-03-08": { fp1: "2026-03-06T01:30:00Z", fp2: "2026-03-06T05:00:00Z", fp3: "2026-03-07T01:30:00Z", qualifying: "2026-03-07T05:00:00Z", race: "2026-03-08T04:00:00Z" },
  // R02 Chinese Grand Prix
  "2026-03-15": { fp1: "2026-03-13T03:30:00Z", sprintQualifying: "2026-03-13T07:30:00Z", sprint: "2026-03-14T03:00:00Z", qualifying: "2026-03-14T07:00:00Z", race: "2026-03-15T07:00:00Z" },
  // R03 Japanese Grand Prix
  "2026-03-29": { fp1: "2026-03-27T02:30:00Z", fp2: "2026-03-27T06:00:00Z", fp3: "2026-03-28T02:30:00Z", qualifying: "2026-03-28T06:00:00Z", race: "2026-03-29T05:00:00Z" },
  // R04 Miami Grand Prix
  "2026-05-03": { fp1: "2026-05-01T16:00:00Z", sprintQualifying: "2026-05-01T20:30:00Z", sprint: "2026-05-02T16:00:00Z", qualifying: "2026-05-02T20:00:00Z", race: "2026-05-03T20:00:00Z" },
  // R05 Canadian Grand Prix
  "2026-05-24": { fp1: "2026-05-22T16:30:00Z", sprintQualifying: "2026-05-22T20:30:00Z", sprint: "2026-05-23T16:00:00Z", qualifying: "2026-05-23T20:00:00Z", race: "2026-05-24T20:00:00Z" },
  // R06 Monaco Grand Prix
  "2026-06-07": { fp1: "2026-06-05T11:30:00Z", fp2: "2026-06-05T15:00:00Z", fp3: "2026-06-06T10:30:00Z", qualifying: "2026-06-06T14:00:00Z", race: "2026-06-07T13:00:00Z" },
  // R07 Barcelona Grand Prix
  "2026-06-14": { fp1: "2026-06-12T11:30:00Z", fp2: "2026-06-12T15:00:00Z", fp3: "2026-06-13T10:30:00Z", qualifying: "2026-06-13T14:00:00Z", race: "2026-06-14T13:00:00Z" },
  // R08 Austrian Grand Prix
  "2026-06-28": { fp1: "2026-06-26T11:30:00Z", fp2: "2026-06-26T15:00:00Z", fp3: "2026-06-27T10:30:00Z", qualifying: "2026-06-27T14:00:00Z", race: "2026-06-28T13:00:00Z" },
  // R09 British Grand Prix
  "2026-07-05": { fp1: "2026-07-03T11:30:00Z", sprintQualifying: "2026-07-03T15:30:00Z", sprint: "2026-07-04T11:00:00Z", qualifying: "2026-07-04T15:00:00Z", race: "2026-07-05T14:00:00Z" },
  // R10 Belgian Grand Prix
  "2026-07-19": { fp1: "2026-07-17T11:30:00Z", fp2: "2026-07-17T15:00:00Z", fp3: "2026-07-18T10:30:00Z", qualifying: "2026-07-18T14:00:00Z", race: "2026-07-19T13:00:00Z" },
  // R11 Hungarian Grand Prix
  "2026-07-26": { fp1: "2026-07-24T11:30:00Z", fp2: "2026-07-24T15:00:00Z", fp3: "2026-07-25T10:30:00Z", qualifying: "2026-07-25T14:00:00Z", race: "2026-07-26T13:00:00Z" },
  // R12 Dutch Grand Prix
  "2026-08-23": { fp1: "2026-08-21T10:30:00Z", sprintQualifying: "2026-08-21T14:30:00Z", sprint: "2026-08-22T10:00:00Z", qualifying: "2026-08-22T14:00:00Z", race: "2026-08-23T13:00:00Z" },
  // R13 Italian Grand Prix
  "2026-09-06": { fp1: "2026-09-04T10:30:00Z", fp2: "2026-09-04T14:00:00Z", fp3: "2026-09-05T10:30:00Z", qualifying: "2026-09-05T14:00:00Z", race: "2026-09-06T13:00:00Z" },
  // R14 Spanish Grand Prix
  "2026-09-13": { fp1: "2026-09-11T11:30:00Z", fp2: "2026-09-11T15:00:00Z", fp3: "2026-09-12T10:30:00Z", qualifying: "2026-09-12T14:00:00Z", race: "2026-09-13T13:00:00Z" },
  // R15 Azerbaijan Grand Prix
  "2026-09-26": { fp1: "2026-09-24T08:30:00Z", fp2: "2026-09-24T12:00:00Z", fp3: "2026-09-25T08:30:00Z", qualifying: "2026-09-25T12:00:00Z", race: "2026-09-26T11:00:00Z" },
  // R16 Singapore Grand Prix
  "2026-10-11": { fp1: "2026-10-09T08:30:00Z", sprintQualifying: "2026-10-09T12:30:00Z", sprint: "2026-10-10T09:00:00Z", qualifying: "2026-10-10T13:00:00Z", race: "2026-10-11T12:00:00Z" },
  // R17 United States Grand Prix
  "2026-10-25": { fp1: "2026-10-23T17:30:00Z", fp2: "2026-10-23T21:00:00Z", fp3: "2026-10-24T17:30:00Z", qualifying: "2026-10-24T21:00:00Z", race: "2026-10-25T20:00:00Z" },
  // R18 Mexico City Grand Prix
  "2026-11-01": { fp1: "2026-10-30T18:30:00Z", fp2: "2026-10-30T22:00:00Z", fp3: "2026-10-31T17:30:00Z", qualifying: "2026-10-31T21:00:00Z", race: "2026-11-01T20:00:00Z" },
  // R19 Brazilian Grand Prix
  "2026-11-08": { fp1: "2026-11-06T15:30:00Z", fp2: "2026-11-06T19:00:00Z", fp3: "2026-11-07T14:30:00Z", qualifying: "2026-11-07T18:00:00Z", race: "2026-11-08T17:00:00Z" },
  // R20 Las Vegas Grand Prix
  "2026-11-22": { fp1: "2026-11-20T00:30:00Z", fp2: "2026-11-20T04:00:00Z", fp3: "2026-11-21T00:30:00Z", qualifying: "2026-11-21T04:00:00Z", race: "2026-11-22T04:00:00Z" },
  // R21 Qatar Grand Prix
  "2026-11-29": { fp1: "2026-11-27T13:30:00Z", fp2: "2026-11-27T17:00:00Z", fp3: "2026-11-28T14:30:00Z", qualifying: "2026-11-28T18:00:00Z", race: "2026-11-29T16:00:00Z" },
  // R22 Abu Dhabi Grand Prix
  "2026-12-06": { fp1: "2026-12-04T09:30:00Z", fp2: "2026-12-04T13:00:00Z", fp3: "2026-12-05T10:30:00Z", qualifying: "2026-12-05T14:00:00Z", race: "2026-12-06T13:00:00Z" },
};

/** Look up a weekend's sessions by the race's date string ("YYYY-MM-DD"). */
export function getWeekendSchedule(raceDate: string): WeekendSchedule | undefined {
  return WEEKEND_SCHEDULES[raceDate];
}

/**
 * Approximate broadcast duration of each session type, in ms. Generous so the
 * "live" window covers the full session plus the cool-down/podium, without
 * bleeding into the next one. Used purely to decide whether something is
 * on-track right now (e.g. the navbar LIVE indicator) — not for exact timing.
 */
const SESSION_DURATIONS_MS: Record<keyof WeekendSchedule, number> = {
  fp1: 75 * 60_000,
  fp2: 75 * 60_000,
  fp3: 75 * 60_000,
  sprintQualifying: 60 * 60_000,
  sprint: 75 * 60_000,
  qualifying: 75 * 60_000,
  race: 150 * 60_000,
};

export interface ActiveSession {
  /** Race-date key of the weekend this session belongs to. */
  raceDate: string;
  /** Which session is currently running. */
  session: keyof WeekendSchedule;
}

/**
 * Return the session (FP1/FP2/FP3/SQ/Sprint/Quali/Race) that is on-track at
 * `nowMs`, or null if nothing is live. Schedule-based (no network), so it can
 * gate UI like the navbar LIVE dot purely from the baked calendar.
 */
/** Display names for each session key, for LIVE banners and labels. */
export const SESSION_LABELS: Record<keyof WeekendSchedule, string> = {
  fp1: "PRACTICE 1",
  fp2: "PRACTICE 2",
  fp3: "PRACTICE 3",
  sprintQualifying: "SPRINT QUALIFYING",
  sprint: "SPRINT",
  qualifying: "QUALIFYING",
  race: "RACE",
};

/**
 * Competitive sessions that warrant the site-wide LIVE treatment (navbar red
 * dot, homepage banner). Practice sessions deliberately excluded.
 */
const HEADLINE_SESSIONS = new Set<keyof WeekendSchedule>([
  "sprintQualifying",
  "sprint",
  "qualifying",
  "race",
]);

/**
 * Like getActiveSession, but only for quali / sprint quali / sprint / race —
 * returns null while a practice session is running.
 */
export function getActiveHeadlineSession(nowMs: number): ActiveSession | null {
  const active = getActiveSession(nowMs);
  return active && HEADLINE_SESSIONS.has(active.session) ? active : null;
}

export function getActiveSession(nowMs: number): ActiveSession | null {
  for (const raceDate of Object.keys(WEEKEND_SCHEDULES)) {
    const sched = WEEKEND_SCHEDULES[raceDate];
    for (const key of Object.keys(sched) as (keyof WeekendSchedule)[]) {
      const iso = sched[key];
      if (!iso) continue;
      const start = new Date(iso).getTime();
      const end = start + SESSION_DURATIONS_MS[key];
      if (nowMs >= start && nowMs <= end) {
        return { raceDate, session: key };
      }
    }
  }
  return null;
}
