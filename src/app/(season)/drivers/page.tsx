import type { Metadata } from "next";
import { DRIVER_LIST } from "@/lib/constants";
import { getDriverStandings } from "@/lib/api/jolpica";
import { DriverCard } from "@/components/shared/driver-card";
import { PageTransition } from "@/components/layout/page-transition";
import { SectionHeader } from "@/components/shared/section-header";
import { DriversGrid } from "./drivers-grid";

export const metadata: Metadata = {
  title: "Drivers",
  description: "All 22 drivers competing in the 2026 Formula 1 season",
};

export default async function DriversPage() {
  let standings: Awaited<ReturnType<typeof getDriverStandings>> = [];
  try {
    standings = await getDriverStandings("2026");
  } catch {
    // Fall back to static data if API unavailable.
  }

  const pointsMap = new Map<string, { points: number; position: number }>();
  standings.forEach((standing) => {
    const code = standing.Driver.code?.toUpperCase();
    if (!code) return;

    const pts = Number.parseFloat(standing.points) || 0;
    const pos = Number.parseInt(standing.position, 10);
    if (!Number.isNaN(pos)) {
      pointsMap.set(code, { points: pts, position: pos });
    }
  });

  const sortedDrivers = [...DRIVER_LIST].sort((a, b) => {
    const aStanding = pointsMap.get(a.abbreviation);
    const bStanding = pointsMap.get(b.abbreviation);

    if (aStanding && bStanding) return aStanding.position - bStanding.position;
    if (aStanding) return -1;
    if (bStanding) return 1;
    return 0;
  });

  return (
    <PageTransition>
      <SectionHeader title="Drivers" subtitle="2026 F1 Season Grid" />

      <DriversGrid>
        {sortedDrivers.map((driver) => {
          const standing = pointsMap.get(driver.abbreviation);

          return (
            <DriverCard
              key={driver.id}
              driver={driver}
              points={standing?.points}
              position={standing?.position}
            />
          );
        })}
      </DriversGrid>
    </PageTransition>
  );
}
