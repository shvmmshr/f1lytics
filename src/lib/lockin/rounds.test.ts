import { describe, expect, it } from "vitest";
import { WEEKEND_SCHEDULES } from "@/lib/constants/sessions";
import { getOpenRound, getRoundBySlug, getRoundState, getRounds, getWeekendRound, phaseEndsAtMs, roundPhases } from "./rounds";

const ms = (iso: string) => new Date(iso).getTime();

describe("rounds", () => {
  it("skips cancelled races and keeps calendar order", () => {
    const slugs = getRounds().map((r) => r.slug);
    expect(slugs).not.toContain("bahrain-gp");
    expect(slugs).not.toContain("saudi-arabian-gp");
    expect(slugs[0]).toBe("australian-gp");
    expect(slugs[slugs.length - 1]).toBe("abu-dhabi-gp");
  });

  it("locks at sprint qualifying on sprint weekends and qualifying otherwise", () => {
    const china = getRoundBySlug("chinese-gp")!;
    const japan = getRoundBySlug("japanese-gp")!;
    expect(china.lockAtMs).toBe(ms(WEEKEND_SCHEDULES["2026-03-15"].sprintQualifying!));
    expect(japan.lockAtMs).toBe(ms(WEEKEND_SCHEDULES["2026-03-29"].qualifying!));
    expect(roundPhases(china)).toEqual(["quali", "sprint", "race"]);
    expect(roundPhases(japan)).toEqual(["quali", "race"]);
  });

  it("opens exactly one round: the earliest whose lock is ahead", () => {
    const spain = getRoundBySlug("madrid-gp")!;
    const italy = getRoundBySlug("italian-gp")!;
    expect(getOpenRound(ms("2026-09-05T13:59:59Z"))?.slug).toBe("italian-gp");
    expect(getOpenRound(ms("2026-09-05T14:00:00Z"))?.slug).toBe("madrid-gp");
    expect(getRoundState(italy, ms("2026-09-05T14:00:00Z"), false)).toBe("locked");
    expect(getRoundState(spain, ms("2026-09-05T14:00:00Z"), false)).toBe("open");
    expect(getRoundState(getRoundBySlug("azerbaijan-gp")!, ms("2026-09-05T14:00:00Z"), false)).toBe("upcoming");
  });

  it("moves to settling after the race ends and settled when told so", () => {
    const italy = getRoundBySlug("italian-gp")!;
    expect(getRoundState(italy, italy.raceEndsAtMs, false)).toBe("settling");
    expect(getRoundState(italy, italy.raceEndsAtMs, true)).toBe("settled");
    expect(phaseEndsAtMs(italy, "race")).toBe(italy.raceEndsAtMs);
    expect(phaseEndsAtMs(italy, "quali")).toBe(ms("2026-09-05T14:00:00Z") + 75 * 60_000);
  });

  it("finds the weekend round for the live overlay", () => {
    expect(getWeekendRound(ms("2026-09-06T13:30:00Z"))?.slug).toBe("italian-gp");
    expect(getWeekendRound(ms("2026-09-09T12:00:00Z"))).toBeUndefined();
  });

  it("has no round after the season ends", () => {
    expect(getOpenRound(ms("2026-12-06T00:00:00Z"))).toBeUndefined();
  });
});
