import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Drivers",
  description: "All 22 drivers competing in the 2026 Formula 1 season",
};

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

  return (
    <PageTransition>
      <div style={{ background: F1.bg, color: F1.fg, position: "relative" }}>
        <BroadcastGrid color={F1.line} size={64} opacity={0.18} />

        {/* Page header */}
        <div
          className="relative"
          style={{ padding: "40px 32px 28px", borderBottom: `1px solid ${F1.line}` }}
        >
          <div className="flex items-center gap-3.5">
            <Mono style={{ color: F1.red, fontSize: 11, letterSpacing: "0.24em" }}>
              SECTION 03
            </Mono>
            <span style={{ width: 40, height: 1, background: F1.line }} />
            <Mono style={{ color: F1.fg3, fontSize: 11, letterSpacing: "0.18em" }}>
              2026 GRID · {DRIVER_LIST.length} DRIVERS · {Object.keys(TEAMS).length} TEAMS
            </Mono>
          </div>
          <h1
            className="font-display uppercase m-0 mt-3"
            style={{
              fontWeight: 700,
              fontSize: "clamp(56px, 8vw, 96px)",
              lineHeight: 0.9,
              letterSpacing: "-0.04em",
            }}
          >
            THE GRID<span style={{ color: F1.red }}>.</span>
          </h1>
          <div className="mt-3" style={{ fontSize: 16, color: F1.fg2, maxWidth: 540 }}>
            Every driver on the 2026 grid. Sorted by championship position.
          </div>
        </div>

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
                      unoptimized
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
                        fontSize: 9,
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
                    <Mono style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.18em" }}>
                      POINTS
                    </Mono>
                    <StatValue size={22} style={{ display: "block", marginTop: 2 }}>
                      {stat ? stat.points : "—"}
                    </StatValue>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Mono style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.18em" }}>
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
      </div>
    </PageTransition>
  );
}
