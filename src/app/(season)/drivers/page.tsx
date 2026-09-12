import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
import Image from "next/image";
import { DRIVER_LIST, TEAMS } from "@/lib/constants";
import { getDriverStandings } from "@/lib/api/jolpica";
import { PageTransition } from "@/components/layout/page-transition";
import {
  F1,
  Mono,
  Grid as BroadcastGrid,
  StatValue,
  PosPill,
} from "@/components/shared/broadcast";
import { DriversGrid } from "./drivers-grid";
import { JsonLd } from "@/components/shared/json-ld";
import { createPageMetadata } from "@/lib/seo/metadata";
import { collectionSchema } from "@/lib/seo/schema";
import { mapConstructorToTeamId } from "@/lib/constructor-map";

const description =
  "Explore every 2026 F1 driver with championship points, wins, teams, race form, career history, and teammate comparisons.";
export const metadata = createPageMetadata({
  title: "2026 F1 Drivers: Profiles, Teams & Standings",
  description,
  path: "/drivers",
});

// Post-session-sensitive data (results/standings/grid); see AGENTS.md caching rules.
export const revalidate = 300;

export default async function DriversPage() {
  let standings: Awaited<ReturnType<typeof getDriverStandings>> = [];
  try {
    standings = await getDriverStandings("2026");
  } catch (err) {
    console.error("[f1lytics] drivers standings fetch failed:", err);
  }

  const pointsMap = new Map<string, { points: number; position: number; wins: number }>();
  standings.forEach((s) => {
    const code = s.Driver.code?.toUpperCase();
    if (!code) return;
    const pts = Number.parseFloat(s.points) || 0;
    const pos = Number.parseInt(s.position, 10);
    const wins = Number.parseInt(s.wins, 10) || 0;
    if (!Number.isNaN(pos)) pointsMap.set(code, { points: pts, position: pos, wins });
  });

  const sortedDrivers = [...DRIVER_LIST].sort((a, b) => {
    const aS = pointsMap.get(a.abbreviation);
    const bS = pointsMap.get(b.abbreviation);
    if (aS && bS) return aS.position - bS.position;
    if (aS) return -1;
    if (bS) return 1;
    return 0;
  });
  const additionalEntrants = standings.filter(entry => !DRIVER_LIST.some(driver => driver.abbreviation === entry.Driver.code?.toUpperCase()));

  return (
    <PageTransition>
      <JsonLd
        data={collectionSchema(
          "2026 F1 drivers",
          description,
          "/drivers",
          DRIVER_LIST.map((driver) => ({
            name: `${driver.firstName} ${driver.lastName}`,
            path: `/drivers/${driver.slug}` as const,
          })),
        )}
      />
      <div style={{ background: F1.bg, color: F1.fg, position: "relative" }}>
        <BroadcastGrid color={F1.line} size={64} opacity={0.18} />

        {/* Page header */}
        <PageHeader eyebrow="SECTION 03" meta={<>2026 LINEUP · {DRIVER_LIST.length} LISTED DRIVERS · {Object.keys(TEAMS).length} TEAMS</>} title="THE GRID" description="The listed season lineup, sorted by championship position. Additional race entrants appear below." />

        {/* Driver tile grid */}
        <DriversGrid>
            {sortedDrivers.map((d) => {
              const team = TEAMS[d.teamId];
              const stat = pointsMap.get(d.abbreviation);
              return (
                <Link
                  key={d.id}
                  href={`/drivers/${d.slug}`}
                  data-driver-card
                  className="relative group"
                  style={{
                  background: F1.bg,
                  padding: 0,
                  minHeight: 260,
                  overflow: "hidden",
                  display: "block",
                  borderTop: `2px solid ${team.color}`,
                  transition: "background 200ms",
                }}
              >
                {/* Team-color sweep on hover */}
                <div
                  aria-hidden
                  className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(135deg, ${team.color}18 0%, transparent 50%)`,
                    transition: "opacity 200ms",
                  }}
                />

                {/* Giant number watermark */}
                <div
                  aria-hidden
                  className="font-display absolute pointer-events-none select-none"
                  style={{
                    right: -16,
                    top: -24,
                    fontSize: 200,
                    fontWeight: 700,
                    lineHeight: 0.8,
                    color: team.color,
                    opacity: 0.18,
                    letterSpacing: "-0.06em",
                  }}
                >
                  {d.number}
                </div>

                {/* Top row — position pill + team strip */}
                <div
                  className="relative flex items-center gap-3"
                  style={{ padding: "16px 20px 10px" }}
                >
                  {stat ? (
                    <PosPill pos={stat.position} size="sm" />
                  ) : (
                    <Mono
                      style={{
                        fontSize: 11,
                        color: F1.fg3,
                        letterSpacing: "0.14em",
                      }}
                    >
                      —
                    </Mono>
                  )}
                  <span
                    style={{
                      width: 4,
                      height: 24,
                      background: team.color,
                    }}
                  />
                  <Mono
                    style={{
                      fontSize: 10,
                      color: F1.fg3,
                      letterSpacing: "0.18em",
                    }}
                  >
                    {team.name.toUpperCase()}
                  </Mono>
                </div>

                {/* Driver image + name */}
                <div className="relative flex items-end gap-3" style={{ padding: "0 20px" }}>
                  <div
                    className="relative shrink-0"
                    style={{
                      width: 88,
                      height: 110,
                      background: F1.bg2,
                      border: `1px solid ${F1.line}`,
                      overflow: "hidden",
                    }}
                  >
                    <Image
                      src={d.image}
                      alt={`${d.firstName} ${d.lastName}`}
                      fill
                      className="object-cover object-top"
                      sizes="88px"
                    />
                  </div>
                  <div className="min-w-0 flex-1 pb-2">
                    <div
                      className="font-display"
                      style={{
                        fontSize: 14,
                        color: F1.fg2,
                        fontWeight: 500,
                        letterSpacing: "-0.01em",
                        lineHeight: 1,
                      }}
                    >
                      {d.firstName.toUpperCase()}
                    </div>
                    <div
                      className="font-display truncate"
                      style={{
                        fontSize: 30,
                        color: F1.fg,
                        fontWeight: 700,
                        letterSpacing: "-0.03em",
                        lineHeight: 0.9,
                        marginTop: 4,
                      }}
                    >
                      {d.lastName.toUpperCase()}
                    </div>
                    <Mono
                      style={{
                        fontSize: 11,
                        color: F1.fg3,
                        letterSpacing: "0.18em",
                        marginTop: 6,
                        display: "block",
                      }}
                    >
                      #{d.number} · {d.abbreviation}
                    </Mono>
                  </div>
                </div>

                {/* Footer — points + wins */}
                <div
                  className="relative flex items-center justify-between"
                  style={{
                    padding: "12px 20px 14px",
                    marginTop: 12,
                    borderTop: `1px solid ${F1.line}`,
                    background: F1.bg2,
                  }}
                >
                  <div>
                    <Mono style={{ fontSize: 11, color: F1.fg3, letterSpacing: "0.18em" }}>
                      POINTS
                    </Mono>
                    <StatValue size={22} style={{ display: "block", marginTop: 2 }}>
                      {stat ? stat.points : "—"}
                    </StatValue>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Mono style={{ fontSize: 11, color: F1.fg3, letterSpacing: "0.18em" }}>
                      WINS
                    </Mono>
                    <StatValue
                      size={22}
                      color={stat && stat.wins > 0 ? F1.amber : F1.fg}
                      style={{ display: "block", marginTop: 2 }}
                    >
                      {stat ? stat.wins : "—"}
                    </StatValue>
                  </div>
                </div>
              </Link>
            );
          })}
        </DriversGrid>
        {additionalEntrants.length > 0 && <section className="border-t border-line px-[var(--page-gutter)] py-8">
          <h2 className="font-display text-3xl uppercase">Additional 2026 race entrants</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-text-secondary">Substitute appearances are included in the championship. Teams below reflect the standings feed’s season entries.</p>
          <ul className="mt-5 divide-y divide-line border border-line bg-bg-secondary">
            {additionalEntrants.map(entry => <li key={entry.Driver.driverId} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div><p className="font-display text-2xl">{entry.Driver.givenName} {entry.Driver.familyName}</p><p className="mt-1 text-xs text-text-secondary">{entry.Constructors.map(constructor => { const id = mapConstructorToTeamId(constructor.constructorId, constructor.name); return id ? TEAMS[id].name : constructor.name; }).join(" / ")}</p></div>
              <p className="font-mono text-sm text-text-secondary">P{entry.position} · {entry.points} pts</p>
            </li>)}
          </ul>
          <Link href="/standings" className="mt-4 inline-flex min-h-11 items-center text-sm text-text-secondary underline underline-offset-4">Full driver standings →</Link>
        </section>}
      </div>
    </PageTransition>
  );
}
