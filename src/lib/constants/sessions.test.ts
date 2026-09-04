import { describe, expect, it } from "vitest";
import {
  WEEKEND_SCHEDULES,
  getActiveHeadlineSession,
  getActiveSession,
  getLiveWindowSession,
} from "./sessions";

const ms = (iso: string) => new Date(iso).getTime();
const MIN = 60_000;

describe("getActiveSession", () => {
  const aus = WEEKEND_SCHEDULES["2026-03-08"];
  const chn = WEEKEND_SCHEDULES["2026-03-15"];

  it("is null one millisecond before the race starts", () => {
    expect(getActiveSession(ms(aus.race) - 1)).toBeNull();
  });

  it("is the race at exactly race start (inclusive)", () => {
    expect(getActiveSession(ms(aus.race))).toEqual({ raceDate: "2026-03-08", session: "race" });
  });

  it("is still the race at start plus 150 minutes (inclusive end)", () => {
    expect(getActiveSession(ms(aus.race) + 150 * MIN)).toEqual({ raceDate: "2026-03-08", session: "race" });
  });

  it("is null one millisecond after the race window", () => {
    expect(getActiveSession(ms(aus.race) + 150 * MIN + 1)).toBeNull();
  });

  it("reports practice as active but not as a headline session", () => {
    const t = ms(aus.fp1!) + 10 * MIN;
    expect(getActiveSession(t)).toEqual({ raceDate: "2026-03-08", session: "fp1" });
    expect(getActiveHeadlineSession(t)).toBeNull();
  });

  it("reports the sprint as both active and headline", () => {
    const t = ms(chn.sprint!) + 10 * MIN;
    expect(getActiveSession(t)).toEqual({ raceDate: "2026-03-15", session: "sprint" });
    expect(getActiveHeadlineSession(t)).toEqual({ raceDate: "2026-03-15", session: "sprint" });
  });

  it("is null in the dead zone between weekends", () => {
    expect(getActiveSession(ms("2026-03-11T12:00:00Z"))).toBeNull();
  });
});

describe("getLiveWindowSession", () => {
  const ita = WEEKEND_SCHEDULES["2026-09-06"];

  it("prefers the running session, then the upcoming one, over a finished one in its tail", () => {
    // FP1 tail (ends 13:45 UTC) overlaps FP2 lead (from 13:30 UTC).
    expect(getLiveWindowSession(ms(ita.fp1!) + 80 * MIN)).toEqual({ raceDate: "2026-09-06", session: "fp1" });
    expect(getLiveWindowSession(ms(ita.fp2!) - 10 * MIN)).toEqual({ raceDate: "2026-09-06", session: "fp2" });
    expect(getLiveWindowSession(ms(ita.fp2!) + 5 * MIN)).toEqual({ raceDate: "2026-09-06", session: "fp2" });
  });

  it("opens 30 minutes before the weekend's first session starts", () => {
    expect(getLiveWindowSession(ms(ita.fp1!) - 30 * MIN)).toEqual({ raceDate: "2026-09-06", session: "fp1" });
    expect(getLiveWindowSession(ms(ita.fp1!) - 30 * MIN - 1)).toBeNull();
  });

  it("stays open for 120 minutes after the nominal end, for delays and red flags", () => {
    const end = ms(ita.race) + 150 * MIN;
    expect(getLiveWindowSession(end + 120 * MIN)).toEqual({ raceDate: "2026-09-06", session: "race" });
    expect(getLiveWindowSession(end + 120 * MIN + 1)).toBeNull();
  });

  it("is closed at 21:35 UTC on the Friday of the Italian GP (the production bug)", () => {
    expect(getLiveWindowSession(ms("2026-09-04T21:35:00Z"))).toBeNull();
  });
});
