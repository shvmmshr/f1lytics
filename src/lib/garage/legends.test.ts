import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { GARAGE_LEGENDS, getGarageLegend } from "./legends";

describe("legendary garage collection", () => {
  it("resolves canonical links and handles unknown or legacy livery values", () => {
    expect(getGarageLegend("w11").driver).toBe("Lewis Hamilton");
    expect(getGarageLegend("f2004").driver).toBe("Michael Schumacher");
    for (const id of [null, undefined, "unknown", "era-2004", "__proto__"]) expect(getGarageLegend(id).id).toBe("rb19");
  });
  it("has distinct exhibits with local previews and explicit attribution", () => {
    expect(new Set(GARAGE_LEGENDS.map((car) => car.id)).size).toBe(GARAGE_LEGENDS.length);
    for (const car of GARAGE_LEGENDS) {
      expect(car.modelId).toMatch(/^[a-f0-9]{32}$/);
      expect(existsSync(`public${car.poster}`)).toBe(true);
      expect(new URL(car.modelUrl).hostname).toBe("sketchfab.com");
      expect(new URL(car.creatorUrl).hostname).toBe("sketchfab.com");
      expect(car.credit).not.toBe("");
    }
  });
});
