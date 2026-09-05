import { describe, expect, it } from "vitest";
import { isSessionRunning, isStreamCurrent, parseTrackLocal } from "./live-stream-status";

const base = { name: "Practice 2", type: "Practice", circuitShortName: "Monza", countryName: "Italy", extrapolating: false };
const MIN = 60_000;

describe("parseTrackLocal", () => {
  it("converts a track-local end date with its GMT offset to UTC", () => {
    expect(parseTrackLocal("2026-09-04T17:00:00", "02:00:00")).toBe(new Date("2026-09-04T15:00:00Z").getTime());
    expect(parseTrackLocal("2026-11-22T22:00:00", "-08:00:00")).toBe(new Date("2026-11-23T06:00:00Z").getTime());
  });

  it("returns null for missing or malformed input", () => {
    expect(parseTrackLocal(undefined, "02:00:00")).toBeNull();
    expect(parseTrackLocal("2026-09-04T17:00:00", "2h")).toBeNull();
  });
});

describe("isStreamCurrent", () => {
  it("treats a running session as current", () => {
    expect(isStreamCurrent({ ...base, status: "Started", endsAtMs: null }, 0)).toBe(true);
  });

  it("keeps a just-finished session for 45 minutes", () => {
    const ends = 1_000_000;
    expect(isStreamCurrent({ ...base, status: "Finalised", endsAtMs: ends }, ends + 44 * MIN)).toBe(true);
    expect(isStreamCurrent({ ...base, status: "Finalised", endsAtMs: ends }, ends + 45 * MIN)).toBe(false);
  });

  it("rejects the production snapshot: Finalised, ended six hours ago", () => {
    const ends = new Date("2026-09-04T15:00:00Z").getTime();
    expect(isStreamCurrent({ ...base, status: "Finalised", endsAtMs: ends }, new Date("2026-09-04T21:35:00Z").getTime())).toBe(false);
  });

  it("trusts the stream when the status is missing", () => {
    expect(isStreamCurrent({ ...base, status: null, endsAtMs: null }, 0)).toBe(true);
    expect(isStreamCurrent(null, 0)).toBe(true);
  });
});

describe("isSessionRunning", () => {
  it("is true while started, aborted, or waiting to start", () => {
    expect(isSessionRunning({ ...base, status: "Started", endsAtMs: null })).toBe(true);
    expect(isSessionRunning({ ...base, status: "Aborted", endsAtMs: null })).toBe(true);
    expect(isSessionRunning({ ...base, status: "Inactive", endsAtMs: null })).toBe(true);
  });

  it("is false once the session has finished, even inside the display grace period", () => {
    expect(isSessionRunning({ ...base, status: "Finalised", endsAtMs: 0 })).toBe(false);
    expect(isSessionRunning({ ...base, status: "Finished", endsAtMs: 0 })).toBe(false);
    expect(isSessionRunning({ ...base, status: "Ends", endsAtMs: 0 })).toBe(false);
  });
});
