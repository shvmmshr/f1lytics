import { describe, expect, it } from "vitest";
import { globeMotion, INITIAL_GLOBE_MOTION } from "./globe-motion";

describe("globe rotation preference and controls", () => {
  it("starts still and only auto-rotates once a normal-motion preference is known", () => {
    expect(INITIAL_GLOBE_MOTION.playing).toBe(false);
    expect(globeMotion(INITIAL_GLOBE_MOTION, { type: "preference", reducedMotion: false }).playing).toBe(true);
    expect(globeMotion(INITIAL_GLOBE_MOTION, { type: "preference", reducedMotion: true }).playing).toBe(false);
  });

  it("lets reduced-motion users explicitly opt into rotation and pause it again", () => {
    const paused = globeMotion(INITIAL_GLOBE_MOTION, { type: "preference", reducedMotion: true });
    const resumed = globeMotion(paused, { type: "toggle" });
    expect(resumed.playing).toBe(true);
    expect(globeMotion(resumed, { type: "toggle" }).playing).toBe(false);
  });

  it("stops an already rotating globe when reduced motion is requested", () => {
    const rotating = globeMotion(INITIAL_GLOBE_MOTION, { type: "preference", reducedMotion: false });
    const paused = globeMotion(rotating, { type: "preference", reducedMotion: true });
    expect(paused.playing).toBe(false);
    expect(globeMotion(paused, { type: "preference", reducedMotion: false }).playing).toBe(false);
  });

  it("does not override an explicit pause when the preference changes", () => {
    const rotating = globeMotion(INITIAL_GLOBE_MOTION, { type: "preference", reducedMotion: false });
    const paused = globeMotion(rotating, { type: "toggle" });
    expect(globeMotion(paused, { type: "preference", reducedMotion: false }).playing).toBe(false);
  });
});
