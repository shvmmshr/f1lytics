import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getConstructorStandings } from "@/lib/api/jolpica";
import { TEAM_LIST } from "@/lib/constants";
import { mapConstructorToTeamId } from "@/lib/constructor-map";
import { DRIVERS } from "@/lib/constants/drivers";
import { PageTransition } from "@/components/layout/page-transition";
import {
  F1,
  Mono,
  Grid as BroadcastGrid,
  StatValue,
} from "@/components/shared/broadcast";

export const metadata: Metadata = {
  title: "Teams",
  description: "All 11 teams competing in the 2026 Formula 1 season",
};

export default async function TeamsPage() {
  let constructorStandings: Awaited<ReturnType<typeof getConstructorStandings>> = [];
  try {
    constructorStandings = await getConstructorStandings("2026");
  } catch {}

  const standingsByTeam = new Map<string, { position: number; points: number; wins: number }>();

  constructorStandings.forEach((s) => {
    const teamId = mapConstructorToTeamId(s.Constructor.constructorId, s.Constructor.name);
    if (!teamId) return;
    const pos = Number.parseInt(s.position, 10);
    const pts = Number.parseFloat(s.points) || 0;
    const wins = Number.parseInt(s.wins, 10) || 0;
    if (!Number.isNaN(pos)) standingsByTeam.set(teamId, { position: pos, points: pts, wins });
  });

  const sortedTeams = [...TEAM_LIST].sort((a, b) => {
    const aS = standingsByTeam.get(a.id);
    const bS = standingsByTeam.get(b.id);
    if (aS && bS) return aS.position - bS.position;
    if (aS) return -1;
    if (bS) return 1;
    return 0;
  });

  const maxPoints = Math.max(...sortedTeams.map((t) => standingsByTeam.get(t.id)?.points ?? 0), 1);

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
              SECTION 04
            </Mono>
            <span style={{ width: 40, height: 1, background: F1.line }} />
            <Mono style={{ color: F1.fg3, fontSize: 11, letterSpacing: "0.18em" }}>
              CONSTRUCTORS · {sortedTeams.length} TEAMS · 2026
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
            THE TEAMS<span style={{ color: F1.red }}>.</span>
          </h1>
          <div className="mt-3" style={{ fontSize: 16, color: F1.fg2, maxWidth: 540 }}>
            Eleven constructors. Twenty‑two cars. One championship.
          </div>
        </div>

        {/* Team tile grid */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: "minmax(0, 1fr)",
            gap: 1,
            background: F1.line,
            borderTop: `1px solid ${F1.line}`,
            borderBottom: `1px solid ${F1.line}`,
          }}
        >
          {sortedTeams.map((team) => {
            const standing = standingsByTeam.get(team.id);
            const teamDrivers = team.drivers.map((id) => DRIVERS[id]).filter(Boolean);
            const barPct = standing ? (standing.points / maxPoints) * 100 : 0;
            return (
              <Link
                key={team.id}
                href={`/teams/${team.slug}`}
                className="group relative block"
                style={{
                  background: F1.bg,
                  borderTop: `2px solid ${team.color}`,
                  padding: 20,
                  overflow: "hidden",
                }}
              >
                {/* Sweep on hover */}
                <div
                  aria-hidden
                  className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(135deg, ${team.color}18 0%, transparent 60%)`,
                    transition: "opacity 200ms",
                  }}
                />

                <div className="relative flex items-center gap-4">
                  {/* Position pill */}
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 44,
                      height: 44,
                      background: standing ? `${team.color}22` : F1.bg2,
                      border: `1px solid ${team.color}55`,
                    }}
                  >
                    <Mono
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: team.color,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {standing ? String(standing.position).padStart(2, "0") : "—"}
                    </Mono>
                  </div>

                  {/* Logo */}
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 44,
                      height: 44,
                      background: F1.bg2,
                      border: `1px solid ${F1.line}`,
                      padding: 8,
                    }}
                  >
                    <Image
                      src={team.logo}
                      alt={team.name}
                      width={28}
                      height={28}
                      className="object-contain"
                      unoptimized
                    />
                  </div>

                  {/* Name */}
                  <div className="min-w-0 flex-1">
                    <h2
                      className="font-display truncate"
                      style={{
                        fontSize: 20,
                        fontWeight: 600,
                        letterSpacing: "-0.02em",
                        lineHeight: 1,
                      }}
                    >
                      {team.name.toUpperCase()}
                    </h2>
                    <Mono
                      style={{
                        fontSize: 9,
                        color: F1.fg3,
                        letterSpacing: "0.18em",
                        marginTop: 4,
                        display: "block",
                      }}
                    >
                      {team.engine.toUpperCase()}
                    </Mono>
                  </div>

                  {/* Points */}
                  <div style={{ textAlign: "right" }}>
                    <StatValue size={28} color={F1.fg}>
                      {standing
                        ? standing.points % 1 === 0
                          ? standing.points
                          : standing.points.toFixed(1)
                        : "—"}
                    </StatValue>
                    <Mono
                      style={{
                        fontSize: 9,
                        color: F1.fg3,
                        letterSpacing: "0.18em",
                        display: "block",
                        marginTop: 2,
                      }}
                    >
                      PTS{standing && standing.wins > 0 ? ` · ${standing.wins}W` : ""}
                    </Mono>
                  </div>
                </div>

                {/* Points bar */}
                <div className="relative mt-4" style={{ height: 3, background: F1.bg3 }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${barPct}%`,
                      background: team.color,
                    }}
                  />
                </div>

                {/* Drivers */}
                <div className="relative flex gap-1 mt-4" style={{ maxWidth: 520 }}>
                  {teamDrivers.map((d) => (
                    <div
                      key={d.id}
                      className="flex flex-1 items-center gap-2"
                      style={{
                        background: F1.bg2,
                        border: `1px solid ${F1.line}`,
                        padding: "6px 8px",
                      }}
                    >
                      <div
                        className="relative shrink-0 overflow-hidden"
                        style={{
                          width: 26,
                          height: 26,
                          background: F1.bg,
                          border: `1px solid ${F1.line}`,
                        }}
                      >
                        <Image
                          src={d.image}
                          alt={`${d.firstName} ${d.lastName}`}
                          fill
                          className="object-cover object-top"
                          unoptimized
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Mono
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: F1.fg,
                            letterSpacing: "0.04em",
                            display: "block",
                          }}
                        >
                          {d.lastName.toUpperCase()}
                        </Mono>
                        <Mono
                          style={{
                            fontSize: 9,
                            color: F1.fg3,
                            letterSpacing: "0.14em",
                          }}
                        >
                          #{d.number}
                        </Mono>
                      </div>
                    </div>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </PageTransition>
  );
}
