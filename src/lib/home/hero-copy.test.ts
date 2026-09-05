import { describe, expect, it } from "vitest";
import { CIRCUIT_LIST, DRIVER_LIST } from "@/lib/constants";
import type { GridRow, RecentRace } from "@/lib/api/weekend";
import { HEADLINE_MAX_EM, fitsHeadline, headlineWidthEm, heroCopy, properName, type HeroCopyInput } from "./hero-copy";

const monza = CIRCUIT_LIST.find((c) => c.slug === "italian-gp")!;
const madrid = CIRCUIT_LIST.find((c) => c.slug === "madrid-gp")!;
const sprintRound = CIRCUIT_LIST.find((c) => c.isSprint && !c.cancelled)!;

const row = (position: number, driverName: string, teamName: string, time: string | null = "1:21.786"): GridRow => ({
  position,
  driverName,
  familyName: driverName.split(" ").pop()!,
  teamName,
  teamColor: "#000000",
  time,
});

const monzaGrid = [row(1, "Pierre Gasly", "Alpine"), row(2, "George Russell", "Mercedes"), row(3, "Oscar Piastri", "McLaren")];

const monzaResult: RecentRace = {
  slug: "italian-gp",
  name: monza.name,
  round: monza.round,
  podium: [row(1, "George Russell", "Mercedes", "25 PTS"), row(2, "Kimi Antonelli", "Mercedes", "18 PTS"), row(3, "Oscar Piastri", "McLaren", "15 PTS")],
};

const standings = { leader: { name: "Andrea Kimi Antonelli", points: 242 }, runnerUp: { name: "George Russell", points: 183 } };

const base: HeroCopyInput = {
  liveSession: null,
  nextRace: monza,
  eventType: "race",
  weekend: { raceSlug: "italian-gp", isSprint: false },
  recentRace: null,
  ...standings,
};

describe("headline width rule", () => {
  it("reproduces the browser measurements (Antonio Bold, -0.04em tracking)", () => {
    const measured: Array<[string, number]> = [
      ["LIGHTS OUT", 3.548],
      ["WINS MADRID.", 4.756],
      ["HULKENBERG", 4.244],
      ["SPRINT QUALI.", 4.53],
      ["LEADS BY 159.", 4.436],
    ];
    for (const [text, em] of measured) expect(Math.abs(headlineWidthEm(text) - em)).toBeLessThan(0.005);
  });

  it("keeps the limit under the narrowest desktop column (4.77em)", () => {
    expect(HEADLINE_MAX_EM).toBeLessThan(4.77);
  });

  it("accepts every 2026 surname and the fixed lines, rejects the known overflows", () => {
    for (const d of DRIVER_LIST) expect(fitsHeadline(d.lastName), d.lastName).toBe(true);
    for (const line of ["LIGHTS OUT", "IN 1D 05:25", "IN 21:35:46", "ON POLE.", "WINS SPRINT.", "WINS MONZA.", "LEADS BY 159.", "QUALIFYING.", "SPRINT QUALI."]) {
      expect(fitsHeadline(line), line).toBe(true);
    }
    expect(fitsHeadline("SPRINT QUALIFYING.")).toBe(false);
    expect(fitsHeadline("WINS MADRID.")).toBe(false);
  });
});

describe("heroCopy phases", () => {
  it("live: names the session, links the timing screen and that race's page", () => {
    const copy = heroCopy({ ...base, liveSession: { raceDate: monza.raceDate, session: "qualifying" } });
    expect(copy.phase).toBe("live");
    expect(copy.eyebrow).toBe("ON AIR · QUALIFYING");
    expect(copy.line1).toBe("IT'S LIVE.");
    expect(copy.line2).toBe("QUALIFYING.");
    expect(copy.srSuffix).toContain("Italian Grand Prix");
    expect(copy.clock).toBeNull();
    expect(copy.description).toContain("Qualifying is under way at Monza");
    expect(copy.primary).toEqual({ label: "WATCH LIVE TIMING", href: "/live" });
    expect(copy.secondary.href).toBe("/races/italian-gp");
  });

  it("live: sprint qualifying gets the short label that fits", () => {
    const copy = heroCopy({ ...base, nextRace: sprintRound, weekend: null, liveSession: { raceDate: sprintRound.raceDate, session: "sprintQualifying" } });
    expect(copy.line2).toBe("SPRINT QUALI.");
    expect(fitsHeadline(copy.line2!)).toBe(true);
  });

  it("live wins over a set grid", () => {
    const copy = heroCopy({ ...base, weekend: { ...base.weekend!, grid: monzaGrid }, liveSession: { raceDate: monza.raceDate, session: "race" } });
    expect(copy.phase).toBe("live");
    expect(copy.description).toContain("The race is under way at Monza");
  });

  it("grid set: pole sitter in the headline, labelled clock, grid button", () => {
    const copy = heroCopy({ ...base, weekend: { ...base.weekend!, grid: monzaGrid } });
    expect(copy.phase).toBe("grid-set");
    expect(copy.eyebrow).toBe("GRID SET · RD 15 · ITALIAN GRAND PRIX");
    expect(copy.line1).toBe("GASLY");
    expect(copy.line2).toBe("ON POLE.");
    expect(copy.srSuffix).toBe(" · Italian Grand Prix");
    expect(copy.clock).toEqual({ label: "LIGHTS OUT IN" });
    expect(copy.description).toBe(
      "Pierre Gasly takes pole for Alpine, ahead of Russell and Piastri. Penalties can still move the grid. Full order, schedule and live timing in one place."
    );
    expect(copy.primary).toEqual({ label: "STARTING GRID", href: "/races/italian-gp#starting-grid" });
    expect(copy.secondary.href).toBe("/standings");
  });

  it("grid set: OpenF1's capitalised surnames read as names in the sentence", () => {
    const openF1Grid = [row(1, "Pierre GASLY", "Alpine"), row(2, "George RUSSELL", "Mercedes"), row(3, "Nyck DE VRIES", "Audi")];
    const copy = heroCopy({ ...base, weekend: { ...base.weekend!, grid: openF1Grid } });
    expect(copy.line1).toBe("GASLY");
    expect(copy.description.startsWith("Pierre Gasly takes pole for Alpine, ahead of Russell and Vries.")).toBe(true);
    expect(properName("Pato O'WARD")).toBe("Pato O'Ward");
    expect(properName("Kimi Antonelli")).toBe("Kimi Antonelli");
    expect(properName("Nyck DE VRIES")).toBe("Nyck De Vries");
  });

  it("grid set: a short classification still reads correctly", () => {
    const copy = heroCopy({ ...base, weekend: { ...base.weekend!, grid: [monzaGrid[0]] } });
    expect(copy.description).toContain("takes pole for Alpine. Penalties");
  });

  it("sprint done: winner in the headline until the grid is set", () => {
    const weekend = { raceSlug: sprintRound.slug, isSprint: true, sprintWinner: { name: "Verstappen" } };
    const copy = heroCopy({ ...base, nextRace: sprintRound, weekend });
    expect(copy.phase).toBe("sprint-done");
    expect(copy.line1).toBe("VERSTAPPEN");
    expect(copy.line2).toBe("WINS SPRINT.");
    expect(copy.eyebrow.startsWith("SPRINT DONE · ")).toBe(true);
    expect(copy.clock).toEqual({ label: "LIGHTS OUT IN" });
    expect(copy.description).toContain("Verstappen wins the sprint");
    expect(copy.primary.href).toBe(`/races/${sprintRound.slug}`);
  });

  it("grid set beats sprint done", () => {
    const weekend = { raceSlug: sprintRound.slug, isSprint: true, sprintWinner: { name: "Verstappen" }, grid: monzaGrid };
    expect(heroCopy({ ...base, nextRace: sprintRound, weekend }).phase).toBe("grid-set");
  });

  it("weekend under way: LIGHTS OUT with the inline clock and the race centre", () => {
    const copy = heroCopy(base);
    expect(copy.phase).toBe("weekend");
    expect(copy.eyebrow).toBe("RACE WEEKEND · RD 15 · ITALIAN GRAND PRIX");
    expect(copy.line1).toBe("LIGHTS OUT");
    expect(copy.line2).toBeNull();
    expect(copy.clock).toEqual({ label: null });
    expect(copy.srSuffix).toBe(" · Italian Grand Prix");
    expect(copy.description).toContain("The Italian Grand Prix from Monza. Qualifying sets the grid");
    expect(copy.primary).toEqual({ label: "RACE CENTRE", href: "/races/italian-gp" });
    expect(copy.secondary).toEqual({ label: "VIEW STANDINGS →", href: "/standings" });
  });

  it("weekend under way: sprint weekends count down to the sprint first", () => {
    const copy = heroCopy({ ...base, nextRace: sprintRound, eventType: "sprint", weekend: { raceSlug: sprintRound.slug, isSprint: true } });
    expect(copy.line1).toBe("LIGHTS OUT");
    expect(copy.description).toContain("A sprint weekend from");
  });

  it("ignores weekend data for a race that is no longer next (post-race rollover)", () => {
    const stale = { raceSlug: "italian-gp", isSprint: false, grid: monzaGrid };
    const afterRace = heroCopy({ ...base, nextRace: madrid, weekend: stale, recentRace: monzaResult });
    expect(afterRace.phase).toBe("post-race");
    const noResultYet = heroCopy({ ...base, nextRace: madrid, weekend: stale });
    expect(noResultYet.phase).toBe("season");
  });

  it("post-race: winner in the headline, city when it fits, full results button", () => {
    const copy = heroCopy({ ...base, nextRace: madrid, weekend: null, recentRace: monzaResult });
    expect(copy.phase).toBe("post-race");
    expect(copy.eyebrow).toBe("CHEQUERED FLAG · RD 15 · ITALIAN GRAND PRIX");
    expect(copy.line1).toBe("RUSSELL");
    expect(copy.line2).toBe("WINS MONZA.");
    expect(copy.srSuffix).toBe(" · Italian Grand Prix");
    expect(copy.description).toBe(
      "George Russell wins the Italian Grand Prix for Mercedes, ahead of Antonelli and Piastri. Full results, lap times and strategy are in."
    );
    expect(copy.primary).toEqual({ label: "FULL RESULTS", href: "/races/italian-gp" });
  });

  it("post-race: a provisional (OpenF1) result says so", () => {
    const provisional: RecentRace = { ...monzaResult, podium: monzaResult.podium.map((p) => ({ ...p, time: null })) };
    const copy = heroCopy({ ...base, nextRace: madrid, weekend: null, recentRace: provisional });
    expect(copy.eyebrow.startsWith("PROVISIONAL RESULT")).toBe(true);
    expect(copy.description).toContain("Provisional until the official classification");
  });

  it("post-race: a long city falls back to the round number", () => {
    const madridResult: RecentRace = { ...monzaResult, slug: "madrid-gp", name: madrid.name, round: madrid.round };
    const copy = heroCopy({ ...base, nextRace: null, weekend: null, recentRace: madridResult });
    expect(copy.line2).toBe("WINS RD 16.");
    expect(fitsHeadline(copy.line2!)).toBe(true);
  });

  it("season: the gap, rounds to go and the next race with its date", () => {
    const copy = heroCopy({ ...base, nextRace: madrid, weekend: null });
    const toGo = CIRCUIT_LIST.filter((c) => !c.cancelled && c.round >= madrid.round).length;
    expect(copy.phase).toBe("season");
    expect(copy.eyebrow).toBe(`NEXT · RD 16 · ${madrid.fullName.toUpperCase()}`);
    expect(copy.line1).toBe("ANTONELLI");
    expect(copy.line2).toBe("LEADS BY 59.");
    expect(copy.clock).toBeNull();
    expect(copy.description).toBe(
      `Antonelli leads Russell by 59 points with ${toGo} rounds to go. Next up: the ${madrid.fullName} at Madrid, Sunday 13 September.`
    );
    expect(copy.primary).toEqual({ label: "VIEW STANDINGS", href: "/standings" });
    expect(copy.secondary).toEqual({ label: "NEXT RACE →", href: "/races/madrid-gp" });
  });

  it("season: a one-point lead is singular and a huge lead still fits", () => {
    const one = heroCopy({ ...base, nextRace: madrid, weekend: null, leader: { name: "Lando Norris", points: 100 }, runnerUp: { name: "Max Verstappen", points: 99 } });
    expect(one.description).toContain("by 1 point with");
    const huge = heroCopy({ ...base, nextRace: madrid, weekend: null, leader: { name: "Max Verstappen", points: 400 }, runnerUp: { name: "Lando Norris", points: 241 } });
    expect(huge.line2).toBe("LEADS BY 159.");
    expect(fitsHeadline(huge.line2!)).toBe(true);
  });

  it("fallback: no standings story means no invented story", () => {
    const tied = heroCopy({ ...base, nextRace: madrid, weekend: null, leader: { name: "A B", points: 0 }, runnerUp: { name: "C D", points: 0 } });
    expect(tied.phase).toBe("fallback");
    expect(tied.line1).toBe("FORMULA 1,");
    expect(tied.line2).toBe("DECODED.");
    expect(tied.description).toContain(`Next up: the ${madrid.fullName}`);
    const seasonOver = heroCopy({ ...base, nextRace: null, weekend: null, leader: undefined, runnerUp: undefined });
    expect(seasonOver.eyebrow).toBe("2026 SEASON · TELEMETRY & ANALYSIS");
    expect(seasonOver.secondary).toEqual({ label: "EXPLORE RACES →", href: "/races" });
  });
});
