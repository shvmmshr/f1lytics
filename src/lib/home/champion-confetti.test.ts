import { afterEach, expect, it, vi } from "vitest";
import { confetti } from "./champion-confetti";
afterEach(() => vi.unstubAllGlobals());
it("does not touch the canvas or schedule frames with reduced motion", () => {
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  const getContext = vi.fn();
  const request = vi.fn();
  vi.stubGlobal("requestAnimationFrame", request);
  confetti({ getContext } as unknown as HTMLCanvasElement)();
  expect(getContext).not.toHaveBeenCalled();
  expect(request).not.toHaveBeenCalled();
});
it("bounds animation duration and cancels frames and listeners on cleanup", () => {
  const motion = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal("matchMedia", () => motion);
  vi.stubGlobal("devicePixelRatio", 3);
  const context = { scale: vi.fn(), clearRect: vi.fn(), save: vi.fn(), translate: vi.fn(), rotate: vi.fn(), fillRect: vi.fn(), restore: vi.fn() };
  const canvas = { clientWidth: 390, clientHeight: 440, width: 0, height: 0, getContext: () => context };
  let tick: FrameRequestCallback = () => {};
  const request = vi.fn((callback: FrameRequestCallback) => { tick = callback; return 1; });
  const cancel = vi.fn();
  vi.stubGlobal("requestAnimationFrame", request);
  vi.stubGlobal("cancelAnimationFrame", cancel);
  const cleanup = confetti(canvas as unknown as HTMLCanvasElement);
  expect(canvas.width).toBe(780); // DPR capped to avoid oversized mobile canvases.
  tick(100); tick(4000);
  expect(request).toHaveBeenCalledTimes(2); // No perpetual loop after the burst.
  expect(cancel).toHaveBeenCalled();
  cleanup();
  expect(motion.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
});

it("cancels pending finale and finish when skipped before the reveal", async () => {
  vi.useFakeTimers();
  const { scheduleChampionReveal } = await import("./champion-confetti");
  const getContext = vi.fn();
  const finish = vi.fn();
  const cleanup = scheduleChampionReveal({ getContext } as unknown as HTMLCanvasElement, finish, false);
  cleanup();
  vi.runAllTimers();
  expect(finish).not.toHaveBeenCalled();
  expect(getContext).not.toHaveBeenCalled();
  vi.useRealTimers();
});
it("delivers a static reduced-motion announcement and automatically clears it", async () => {
  vi.useFakeTimers();
  const { scheduleChampionReveal } = await import("./champion-confetti");
  const getContext = vi.fn();
  const finish = vi.fn();
  const cleanup = scheduleChampionReveal({ getContext } as unknown as HTMLCanvasElement, finish, true);
  vi.advanceTimersByTime(3499);
  expect(finish).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(finish).toHaveBeenCalledOnce();
  expect(getContext).not.toHaveBeenCalled();
  cleanup();
  vi.useRealTimers();
});
it("starts one finale and stops all work after repeated replay/skip cycles", async () => {
  vi.useFakeTimers();
  const { scheduleChampionReveal } = await import("./champion-confetti");
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  const getContext = vi.fn(() => null);
  const finish = vi.fn();
  for (let i = 0; i < 4; i++) {
    const cleanup = scheduleChampionReveal({ getContext } as unknown as HTMLCanvasElement, finish, false);
    vi.advanceTimersByTime(1400);
    cleanup();
  }
  vi.runAllTimers();
  expect(getContext).toHaveBeenCalledTimes(4);
  expect(finish).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
  vi.useRealTimers();
});
