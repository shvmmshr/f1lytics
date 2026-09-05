/** Wire shape of /api/live/snapshot, shared by the route and the homepage panel. */

export interface SnapshotRow {
  position: number;
  driverNumber: number;
  code: string;
  lastName: string;
  teamName: string;
  teamColor: string;
  /** "LEADER", "+1.234", "+1 LAP" or "" */
  gap: string;
  compound: string | null;
  lastLap: number | null;
}

export interface LiveSnapshot {
  live: true;
  /** True while the session is running; false during the post-session grace period. */
  running: boolean;
  session: { name: string; type: string; circuit: string; country: string; status: string | null } | null;
  currentLap: number | null;
  totalLaps: number | null;
  trackStatus: { code: string; message: string } | null;
  weather: { air: number; track: number; rainfall: number } | null;
  rows: SnapshotRow[];
  updatedAt: string;
}

export interface SnapshotOffline {
  live: false;
  reason: string;
}

export type SnapshotResponse = LiveSnapshot | SnapshotOffline;
