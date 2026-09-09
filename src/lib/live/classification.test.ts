import { describe, expect, it } from "vitest";
import { classifiedPositions } from "./classification";
import { adaptFeed, deepMerge } from "./feed-adapter";
import type { OpenF1Position, OpenF1SessionResult } from "@/lib/api/types";
const position = { driver_number: 18, position: 12, session_key: 1, meeting_key: 1, date: "" } satisfies OpenF1Position;
const result = { driver_number: 18, position: 20, session_key: 1, meeting_key: 1, number_of_laps: 30, dnf: true, dns: false, dsq: false, duration: null, gap_to_leader: null } satisfies OpenF1SessionResult;
describe("timing classifications", () => {
  it("uses final position and DNF instead of the last on-track position", () => {
    expect(classifiedPositions([position], [result])[0]).toMatchObject({ position: 20, status: "DNF" });
    expect(classifiedPositions([position], [])).toEqual([position]);
  });
  it("includes unpositioned DNS drivers and prioritizes disqualification", () => {
    expect(classifiedPositions([], [{ ...result, position: null, dns: true }])[0]).toMatchObject({ position: 0, status: "DNS" });
    expect(classifiedPositions([position], [{ ...result, position: null, dsq: true }])[0]).toMatchObject({ position: 0, status: "DSQ" });
  });
  it("never calls a stopped or lapped car retired without an explicit flag", () => {
    const feed = { TimingData: { Lines: { "18": { Position: "20", Stopped: true, GapToLeader: "2L", Retired: false } } } };
    expect(adaptFeed(feed).positions[0].status).toBeUndefined();
    deepMerge(feed, { TimingData: { Lines: { "18": { Retired: true } } } });
    expect(adaptFeed(feed).positions[0].status).toBe("RET");
    deepMerge(feed, { TimingData: { Lines: { "18": { Retired: false } } } });
    expect(adaptFeed(feed).positions[0].status).toBeUndefined();
  });
});
