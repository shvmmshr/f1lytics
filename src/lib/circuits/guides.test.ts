import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CIRCUIT_LIST, CIRCUITS } from "@/lib/constants/circuits";
import { CIRCUIT_FACTS } from "./facts";
import { CIRCUIT_GUIDES } from "./guides";

describe("circuit reference integrity", () => {
  it.each(CIRCUIT_LIST)("provides a sourced guide and valid local map for $name", circuit => {
    const id = circuit.id as keyof typeof CIRCUIT_FACTS;
    const facts = CIRCUIT_FACTS[id];
    const guide = CIRCUIT_GUIDES[id];
    expect(facts).toBeDefined();
    expect(guide.sections).toHaveLength(3);
    expect(facts.firstGrandPrix).toBeGreaterThanOrEqual(1950);
    expect(facts.raceLaps).toBeGreaterThan(30);
    expect(new URL(facts.source).hostname).toBe("www.formula1.com");
    for (const [turns] of guide.sections) for (const turn of turns.match(/\d+/g) ?? []) expect(Number(turn)).toBeLessThanOrEqual(circuit.turns);
    const file = join(process.cwd(), "public", circuit.trackImage);
    expect(existsSync(file)).toBe(true);
    if (!circuit.cancelled) {
      const bytes = readFileSync(file);
      expect(bytes.toString("ascii", 0, 4)).toBe("RIFF");
      expect(bytes.toString("ascii", 8, 12)).toBe("WEBP");
      expect(bytes.byteLength).toBeLessThan(300000);
      expect(facts.mapYear).toBe(2026);
    }
  });
  it("uses the revised Madrid and Barcelona layouts", () => {
    expect(CIRCUITS.madrid.length).toBe(5.414);
    expect(CIRCUITS.madrid.turns).toBe(22);
    expect(CIRCUITS.barcelona.turns).toBe(14);
  });
});
