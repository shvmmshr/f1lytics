/**
 * Pure helpers for judging whether an F1 live-timing snapshot describes a
 * session worth showing as live. Kept free of React so they unit-test in node.
 */

export interface LiveSessionInfo {
  name: string;
  type: string;
  circuitShortName: string;
  countryName: string;
  /** F1 SessionInfo.SessionStatus: Inactive | Started | Aborted | Finished | Finalised | Ends */
  status: string | null;
  /** Scheduled end as a UTC epoch (EndDate is track-local; GmtOffset converts). */
  endsAtMs: number | null;
  /** ExtrapolatedClock.Extrapolating: false once the session clock has stopped. */
  extrapolating: boolean;
}

/** "2026-09-04T17:00:00" (track local) + "02:00:00" → UTC epoch ms, or null. */
export function parseTrackLocal(local: unknown, gmtOffset: unknown): number | null {
  if (typeof local !== "string" || typeof gmtOffset !== "string") return null;
  const m = gmtOffset.match(/^(-?)(\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  const sign = m[1] === "-" ? -1 : 1;
  const offsetMs = sign * ((Number(m[2]) * 60 + Number(m[3])) * 60 + Number(m[4])) * 1000;
  const asUtc = new Date(`${local}Z`).getTime();
  return Number.isNaN(asUtc) ? null : asUtc - offsetMs;
}

const RUNNING_STATUSES = new Set(["Inactive", "Started", "Aborted"]);
const ENDED_STATUSES = new Set(["Finished", "Finalised", "Ends"]);
const ENDED_GRACE_MS = 45 * 60_000;

/**
 * Whether a stream snapshot describes a session worth showing as live. F1's
 * feed keeps serving the last session all weekend, so a snapshot alone is not
 * evidence of a live session.
 */
export function isStreamCurrent(session: LiveSessionInfo | null, nowMs: number): boolean {
  if (!session || session.status === null) return true; // no signal; the relay's window guard applies
  if (RUNNING_STATUSES.has(session.status)) return true;
  if (ENDED_STATUSES.has(session.status)) {
    return session.endsAtMs !== null && nowMs - session.endsAtMs < ENDED_GRACE_MS;
  }
  return true;
}
