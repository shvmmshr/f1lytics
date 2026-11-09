import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, describe, expect, it, vi } from "vitest";
import standing from "./__fixtures__/camara-jolpica-standing.json";
import { getDriverStandings } from "./api/jolpica";
import type { RaceResult, ResultItem } from "./api/types";
import { buildComparisonStats } from "./analytics/comparison";
import { buildPointsProgression } from "./analytics/points";
import { teamRaceEntries } from "./analytics/profile-results";
import DriversPage from "@/app/(season)/drivers/page";
import DriverProfilePage from "@/app/(season)/drivers/[slug]/page";
import TeamPage from "@/app/(season)/teams/[slug]/page";
import StandingsPage from "@/app/(season)/standings/page";

// Vitest's node transform uses classic JSX; Next uses its automatic runtime.
vi.stubGlobal("React", React);
afterAll(() => vi.unstubAllGlobals());
vi.mock("@/app/(season)/drivers/drivers-grid", () => ({
  DriversGrid: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/lib/api/jolpica", () => ({
  getDriverStandings: vi.fn(async (season: string) => season === "2026" ? [standing] : []),
  getConstructorStandings: vi.fn(async () => []),
  getRaceResults: vi.fn(async () => [saoPaulo]),
}));

const result: ResultItem = {
  Driver: standing.Driver,
  Constructor: standing.Constructors[0],
  number: "51", position: "20", positionText: "20", points: "0",
  grid: "11", laps: "69", status: "Lapped",
};
const saoPaulo: RaceResult = {
  season: "2026", round: "20", raceName: "São Paulo Grand Prix", date: "2026-11-08",
  url: "https://en.wikipedia.org/wiki/2026_S%C3%A3o_Paulo_Grand_Prix",
  Circuit: { circuitId: "interlagos", circuitName: "Autódromo José Carlos Pace", url: "", Location: { lat: "-23.7036", long: "-46.6997", locality: "São Paulo", country: "Brazil" } },
  Results: [result],
};

function driverCard(html: string) {
  return html.match(/<a\b[^>]*href="\/drivers\/rafael-camara"[\s\S]*?<\/a>/)?.[0];
}

describe("incomplete Jolpica driver readers", () => {
  it("shows Câmara's official directory position once, without an additional entrant duplicate", async () => {
    const html = renderToStaticMarkup(await DriversPage());
    expect(driverCard(html)).toContain(">25</span>");
    expect(html).not.toContain("Rafael Camara</p>");
    expect(html).not.toContain("Additional 2026 race entrants");
  });

  it("keeps unreviewed entrants visible instead of matching a shared surname", async () => {
    vi.mocked(getDriverStandings).mockResolvedValueOnce([standing, {
      ...standing, Driver: { ...standing.Driver, driverId: "other_camara", givenName: "Another" },
    }]);
    const html = renderToStaticMarkup(await DriversPage());
    expect(html).toContain("Additional 2026 race entrants");
    expect(html).toContain("Another Camara</p>");
    expect(html).not.toContain("Rafael Camara</p>");
  });

  it("includes the source standings and race row on his profile", async () => {
    const html = renderToStaticMarkup(await DriverProfilePage({ params: Promise.resolve({ slug: "rafael-camara" }) }));
    expect(html).toContain("P25");
    expect(html).toContain("SÃO PAULO GP");
    expect(html).toContain(">20</span>");
  });

  it("includes his standings and race finish on the Haas profile", async () => {
    const html = renderToStaticMarkup(await TeamPage({ params: Promise.resolve({ slug: "haas" }) }));
    expect(driverCard(html)).toContain("P25");
    const raceRow = html.match(/<tr\b[^>]*>[\s\S]*?São Paulo Grand Prix[\s\S]*?<\/tr>/)?.[0];
    expect(raceRow).toContain(">P20</td>");
  });

  it("links the standings row to the local profile and keeps the reviewed number", async () => {
    const html = renderToStaticMarkup(await StandingsPage());
    expect(driverCard(html)).toBeDefined();
    expect(html).toContain("#51");
  });

  it("uses one code for comparison and progression when optional code/spelling changes", () => {
    const accented = { ...result, Driver: { ...standing.Driver, familyName: "Câmara" } };
    const race = { ...saoPaulo, Results: [accented] };
    const progression = buildPointsProgression([race], []);
    expect(progression.drivers).toEqual({ CAM: [{ round: 22, cumulativePoints: 0 }] });
    const comparison = buildComparisonStats([standing], [], [race], [], []);
    expect(Object.keys(comparison.driverStats)).toEqual(["CAM"]);
    expect(comparison.driverStats.CAM).toMatchObject({ position: 25, races: 1, points: 0, pointsPerRace: progression.drivers.CAM });
    expect(comparison.driverStats.CAM.raceHistory[0]).toMatchObject({ points: 0, raceName: "São Paulo Grand Prix" });
  });

  it("retains source constructor ownership while resolving the incomplete driver fallback", () => {
    const unlistedTeam = { ...result, Constructor: { ...result.Constructor, constructorId: "unknown", name: "Unlisted Racing" } };
    expect(teamRaceEntries([unlistedTeam], "haas", new Set(["CAM", "BEA"]))).toEqual([unlistedTeam]);
    expect(teamRaceEntries([result], "racing_bulls", new Set(["CAM"]))).toEqual([]);
  });
});
