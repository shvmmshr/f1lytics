import { afterEach, describe, expect, it, vi } from "vitest";
import { CHAMPION_KEY, readCelebration, saveCelebration, showChampion } from "./champion";

afterEach(() => vi.unstubAllGlobals());
describe("2026 champion celebration", () => {
  it("is limited to the confirmed title window, not historical or future seasons", () => {
    expect(showChampion(Date.parse("2026-10-31"))).toBe(false);
    expect(showChampion(Date.parse("2026-11-02"))).toBe(true);
    expect(showChampion(Date.parse("2026-12-31T23:59:59Z"))).toBe(true);
    expect(showChampion(Date.parse("2027-01-01"))).toBe(false);
  });
  it("persists separate seen and dismissal preferences across mounts", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", { getItem: (key: string) => values.get(key), setItem: (key: string, value: string) => values.set(key, value) });
    expect(readCelebration("seen")).toBe(false);
    saveCelebration("seen");
    expect(readCelebration("seen")).toBe(true);
    expect(readCelebration("dismissed")).toBe(false);
    saveCelebration("dismissed");
    expect(values.get(`${CHAMPION_KEY}:dismissed`)).toBe("1");
  });
  it("works when browser storage is unavailable", () => {
    vi.stubGlobal("localStorage", { getItem: () => { throw Error("blocked"); }, setItem: () => { throw Error("blocked"); } });
    expect(readCelebration("seen")).toBe(false);
    expect(() => saveCelebration("dismissed")).not.toThrow();
  });
});
