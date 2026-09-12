import { describe, expect, it } from "vitest";
import { pageRefreshDue, pageRefreshInterval } from "./page-refresh";

describe("visible page freshness", () => {
  it("refreshes data pages without polling games, live timing or 3D viewers", () => {
    expect(pageRefreshInterval("/standings")).toBe(300000);
    expect(pageRefreshInterval("/circuits/madrid-gp")).toBe(300000);
    expect(pageRefreshInterval("/news")).toBe(900000);
    for (const path of ["/lockin", "/lockin/daily", "/live", "/garage", "/about"]) expect(pageRefreshInterval(path)).toBeNull();
  });
  it("waits for the interval, visibility, network and the end of editing", () => {
    expect(pageRefreshDue(1000, 300999, 300000, true, true, false)).toBe(false);
    expect(pageRefreshDue(1000, 301000, 300000, true, true, false)).toBe(true);
    expect(pageRefreshDue(1000, 901000, 300000, false, true, false)).toBe(false);
    expect(pageRefreshDue(1000, 901000, 300000, true, false, false)).toBe(false);
    expect(pageRefreshDue(1000, 901000, 300000, true, true, true)).toBe(false);
  });
});
