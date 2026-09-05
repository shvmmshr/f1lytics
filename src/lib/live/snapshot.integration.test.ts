import { describe, expect, it } from "vitest";
import { adaptFeed } from "./feed-adapter";
import { fetchFeedSnapshot } from "./snapshot";

/**
 * Talks to F1's real hub. Skipped unless F1_LIVE_INTEGRATION=1, because the
 * result depends on whether F1 is streaming at all. Run it during a race
 * weekend to confirm the one-shot reader still understands the protocol.
 */
describe.skipIf(!process.env.F1_LIVE_INTEGRATION)("fetchFeedSnapshot (live F1 hub)", () => {
  it("returns a snapshot with session info and timing lines", async () => {
    const state = await fetchFeedSnapshot(12_000);
    expect(state).not.toBeNull();
    const data = adaptFeed(state!);
    expect(data.session?.name).toBeTruthy();
    expect(data.positions.length).toBeGreaterThan(0);
    console.log("session:", data.session?.name, data.session?.status, "positions:", data.positions.length, "lap:", data.currentLap, "/", data.totalLaps, "track:", data.trackStatus?.message);
  }, 20_000);
});
