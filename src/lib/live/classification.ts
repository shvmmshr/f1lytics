import type { OpenF1Position, OpenF1SessionResult } from "@/lib/api/types";

/** Final classifications replace stale timing positions; absent results preserve the feed. */
export function classifiedPositions(positions: OpenF1Position[], results: OpenF1SessionResult[]): OpenF1Position[] {
  const rows = new Map(positions.map((row) => [row.driver_number, row]));
  for (const result of results) {
    const previous = rows.get(result.driver_number);
    rows.set(result.driver_number, {
      session_key: result.session_key, meeting_key: result.meeting_key,
      driver_number: result.driver_number, date: previous?.date ?? "",
      position: result.position ?? 0,
      status: result.dsq ? "DSQ" : result.dns ? "DNS" : result.dnf ? "DNF" : undefined,
    });
  }
  return [...rows.values()];
}
