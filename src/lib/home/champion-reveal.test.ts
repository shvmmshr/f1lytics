import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { scheduleChampionReveal, REVEAL_DURATION_MS, REDUCED_REVEAL_DURATION_MS } from "./champion-reveal";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it("holds the reveal for its full duration and finishes exactly once", () => {
  const finish = vi.fn();
  scheduleChampionReveal(finish, false);
  vi.advanceTimersByTime(REVEAL_DURATION_MS - 1);
  expect(finish).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(finish).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});

it("cancels the pending finish on skip or unmount", () => {
  const finish = vi.fn();
  const cleanup = scheduleChampionReveal(finish, false);
  cleanup();
  vi.runAllTimers();
  expect(finish).not.toHaveBeenCalled();
});

it("uses the shorter lifetime for the static reduced-motion announcement", () => {
  const finish = vi.fn();
  scheduleChampionReveal(finish, true);
  vi.advanceTimersByTime(REDUCED_REVEAL_DURATION_MS - 1);
  expect(finish).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(finish).toHaveBeenCalledOnce();
});

it("leaves no scheduled work after repeated replay and skip", () => {
  const finish = vi.fn();
  for (let i = 0; i < 4; i++) {
    const cleanup = scheduleChampionReveal(finish, false);
    vi.advanceTimersByTime(1200);
    cleanup();
  }
  vi.runAllTimers();
  expect(finish).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});
