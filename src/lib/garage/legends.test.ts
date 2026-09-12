import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { GARAGE_LEGENDS, getGarageLegend } from "./legends";

describe("legendary garage collection", () => {
  it("resolves canonical links and handles unknown or legacy livery values", () => {
    expect(getGarageLegend("w11").driver).toBe("Lewis Hamilton");
    expect(getGarageLegend("f2004").driver).toBe("Michael Schumacher");
    for (const id of [null, undefined, "unknown", "era-2004", "__proto__"]) expect(getGarageLegend(id).id).toBe("rb19");
  });
  it("has distinct exhibits with local previews and explicit attribution", () => {
    const sources = JSON.parse(readFileSync("docs/garage/model-sources.json", "utf8")) as { id?: string; uid?: string; viewerUrl?: string; url?: string }[];
    expect(new Set(GARAGE_LEGENDS.map((car) => car.id)).size).toBe(GARAGE_LEGENDS.length);
    for (const car of GARAGE_LEGENDS) {
      expect(getGarageLegend(car.id)).toBe(car);
      expect(car.modelId).toMatch(/^[a-f0-9]{32}$/);
      expect(existsSync(`public${car.poster}`)).toBe(true);
      expect(new URL(car.modelUrl).hostname).toBe("sketchfab.com");
      expect(new URL(car.creatorUrl).hostname).toBe("sketchfab.com");
      expect(car.credit).not.toBe("");
      const source = sources.find((entry) => (entry.id ?? entry.uid) === car.modelId);
      expect(source?.viewerUrl ?? source?.url).toBe(car.modelUrl);
    }
  });
});
