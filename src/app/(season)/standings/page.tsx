import type { Metadata } from "next";
import { getConstructorStandings, getDriverStandings } from "@/lib/api/jolpica";
import { DRIVER_LIST, TEAMS } from "@/lib/constants";
import { mapConstructorToTeamId } from "@/lib/constructor-map";
import { PageTransition } from "@/components/layout/page-transition";
import {
  F1,
  Mono,
  StatValue,
  PosPill,
  SectionHeader,
  Grid as BroadcastGrid,
} from "@/components/shared/broadcast";
import { AnimatedBar } from "@/components/shared/animated-bar";

export const metadata: Metadata = {
  title: "Standings",
  description: "Driver and constructor championship standings for the 2026 F1 season",
};

export default async function StandingsPage() {
  let driverStandings: Awaited<ReturnType<typeof getDriverStandings>> = [];
  let constructorStandings: Awaited<ReturnType<typeof getConstructorStandings>> = [];

  try {
    [driverStandings, constructorStandings] = await Promise.all([
      getDriverStandings("2026"),
      getConstructorStandings("2026"),
    ]);
  } catch (err) {
    console.error("[f1lytics] standings fetch failed:", err);
    // Empty arrays render the empty-state row.
  }

  const drivers = driverStandings
    .map((s) => {
      const code = s.Driver.code?.toUpperCase();
      const localDriver = code
        ? DRIVER_LIST.find((d) => d.abbreviation === code)
        : undefined;
      const team = localDriver ? TEAMS[localDriver.teamId] : undefined;
      return {
        id: s.Driver.driverId,
        code: code ?? s.Driver.familyName.slice(0, 3).toUpperCase(),
        first: s.Driver.givenName,
        last: s.Driver.familyName,
        number: s.Driver.permanentNumber ?? "",
        position: Number.parseInt(s.position, 10),
        points: Number.parseFloat(s.points),
        wins: Number.parseInt(s.wins, 10),
        teamName: team?.name ?? s.Constructors[0]?.name ?? "",
        color: team?.color ?? "#6B7280",
      };
    })
    .sort((a, b) => a.position - b.position);

  const constructors = constructorStandings
    .map((s) => {
      const teamId = mapConstructorToTeamId(s.Constructor.constructorId, s.Constructor.name);
      const team = teamId ? TEAMS[teamId] : undefined;
      return {
        id: s.Constructor.constructorId,
        position: Number.parseInt(s.position, 10),
        name: team?.name ?? s.Constructor.name,
        short: team?.id?.slice(0, 3).toUpperCase() ?? s.Constructor.name.slice(0, 3).toUpperCase(),
        points: Number.parseFloat(s.points),
        wins: Number.parseInt(s.wins, 10),
        color: team?.color ?? "#6B7280",
      };
    })
    .sort((a, b) => a.position - b.position);

  const maxDriverPts = drivers[0]?.points ?? 1;
  const maxConstructorPts = constructors[0]?.points ?? 1;

  return (
    <PageTransition>
      <div style={{ background: F1.bg, color: F1.fg, position: "relative" }}>
        <BroadcastGrid color={F1.line} size={64} opacity={0.18} />

        {/* Page header */}
        <div
          className="relative"
          style={{ padding: "40px clamp(16px, 4vw, 32px) 28px", borderBottom: `1px solid ${F1.line}` }}
        >
          <div className="flex items-center gap-3.5">
            <Mono style={{ color: F1.red, fontSize: 11, letterSpacing: "0.24em" }}>
              SECTION 02
            </Mono>
            <span style={{ width: 40, height: 1, background: F1.line }} />
            <Mono style={{ color: F1.fg3, fontSize: 11, letterSpacing: "0.18em" }}>
              2026 CHAMPIONSHIP · {drivers.length} DRIVERS · {constructors.length} TEAMS
            </Mono>
          </div>
          <h1
            className="font-display uppercase m-0 mt-3"
            style={{
              fontWeight: 700,
              fontSize: "clamp(36px, 8vw, 96px)",
              lineHeight: 0.9,
              letterSpacing: "-0.04em",
            }}
          >
            THE STANDINGS<span style={{ color: F1.red }}>.</span>
          </h1>
          <div className="mt-3" style={{ fontSize: 16, color: F1.fg2, maxWidth: 540 }}>
            Drivers and constructors after each round. Gap‑to‑leader, wins, momentum.
          </div>
        </div>

        {/* MAIN — drivers table + constructors sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] hairline-cells">
          {/* DRIVERS table */}
          <div style={{ background: F1.bg, padding: 0 }}>
            <div
              className="standings-grid grid items-center"
              style={{
                gap: 10,
                padding: "12px clamp(14px, 3vw, 24px)",
                borderBottom: `1px solid ${F1.line}`,
                background: F1.bg2,
              }}
            >
              {["POS", "", "CODE", "DRIVER · TEAM", "PTS", "WINS"].map((h, i) => (
                <Mono
                  key={i}
                  // Hide colour strip (1), CODE (2) and WINS (5) on mobile so the
                  // name column gets real room; show from md up.
                  className={i === 1 || i === 2 || i === 5 ? "hidden md:block" : ""}
                  style={{
                    fontSize: 9,
                    color: F1.fg3,
                    letterSpacing: "0.18em",
                    textAlign: i >= 4 ? "right" : "left",
                  }}
                >
                  {h}
                </Mono>
              ))}
            </div>

            {drivers.length === 0 && (
              <div className="p-6">
                <Mono style={{ color: F1.fg3, fontSize: 12, letterSpacing: "0.18em" }}>
                  STANDINGS WILL APPEAR ONCE RACE RESULTS ARE AVAILABLE.
                </Mono>
              </div>
            )}

            {drivers.map((d, i) => {
              const ptsPct = (d.points / maxDriverPts) * 100;
              return (
                <div
                  key={d.id}
                  className="standings-grid relative grid items-center"
                  style={{
                    gap: 10,
                    padding: "14px clamp(14px, 3vw, 24px)",
                    borderBottom: `1px solid ${F1.line}`,
                    background: i % 2 === 0 ? F1.bg : F1.bg2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    aria-hidden
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: "100%",
                      pointerEvents: "none",
                      overflow: "hidden",
                    }}
                  >
                    <AnimatedBar
                      widthPercent={ptsPct}
                      color={`linear-gradient(90deg, ${d.color}26 0%, transparent 100%)`}
                      height="100%"
                      track="transparent"
                    />
                  </div>
                  <span style={{ position: "relative" }}>
                    <PosPill pos={d.position} size={d.position <= 3 ? "md" : "sm"} />
                  </span>
                  <span
                    className="hidden md:block"
                    style={{
                      width: 4,
                      height: 36,
                      background: d.color,
                      alignSelf: "center",
                      position: "relative",
                    }}
                  />
                  <Mono
                    className="hidden md:block"
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      position: "relative",
                    }}
                  >
                    {d.code}
                  </Mono>
                  <div className="relative flex flex-col min-w-0">
                    <span
                      className="font-display truncate"
                      style={{
                        fontSize: 22,
                        fontWeight: 600,
                        letterSpacing: "-0.01em",
                        // lineHeight 1 + truncate's overflow:hidden clips
                        // descenders (the g in "George", "Sergio"). Loosen the
                        // line box and pad the bottom so they clear the clip.
                        lineHeight: 1.2,
                        paddingBottom: 2,
                      }}
                    >
                      {d.first} {d.last.toUpperCase()}
                    </span>
                    <Mono
                      style={{
                        fontSize: 10,
                        color: F1.fg3,
                        letterSpacing: "0.14em",
                        marginTop: 4,
                      }}
                    >
                      {d.teamName.toUpperCase()}
                      {d.number && ` · #${d.number}`}
                    </Mono>
                  </div>
                  <div style={{ position: "relative", textAlign: "right" }}>
                    <StatValue size={28} color={F1.fg}>
                      {d.points}
                    </StatValue>
                  </div>
                  <Mono
                    className="hidden md:block"
                    style={{
                      fontSize: 14,
                      color: d.wins ? F1.amber : F1.fg3,
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                      position: "relative",
                    }}
                  >
                    {d.wins}
                  </Mono>
                </div>
              );
            })}
          </div>

          {/* CONSTRUCTORS sidebar */}
          <div style={{ background: F1.bg, padding: 24 }}>
            <SectionHeader
              label="CONSTRUCTORS"
              right={
                <Mono style={{ fontSize: 10, color: F1.fg3 }}>
                  {constructors.length} TEAMS · 2026
                </Mono>
              }
            />

            {constructors.length === 0 && (
              <Mono style={{ color: F1.fg3, fontSize: 12, letterSpacing: "0.18em" }}>
                CONSTRUCTOR STANDINGS UNAVAILABLE.
              </Mono>
            )}

            {constructors.map((c, i) => {
              const ptsPct = (c.points / maxConstructorPts) * 100;
              // Gap to leader. No trend arrow — we have no previous-round data,
              // so an up/flat glyph would be decoration pretending to be data.
              const gap = i === 0 ? "LEADER" : `−${(maxConstructorPts - c.points).toFixed(0)}`;
              return (
                <div
                  key={c.id}
                  className="relative"
                  style={{
                    padding: "12px 0",
                    borderBottom:
                      i < constructors.length - 1 ? `1px solid ${F1.line}` : "none",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Mono
                      style={{
                        fontSize: 12,
                        color: F1.fg3,
                        fontWeight: 600,
                        width: 18,
                      }}
                    >
                      {String(c.position).padStart(2, "0")}
                    </Mono>
                    <span style={{ width: 4, height: 28, background: c.color }} />
                    <div className="flex-1 min-w-0">
                      <span
                        className="font-display truncate inline-block max-w-full"
                        style={{
                          fontSize: 18,
                          fontWeight: 600,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {c.name.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <StatValue size={20}>{c.points}</StatValue>
                    </div>
                    <div style={{ width: 50, textAlign: "right" }}>
                      <Mono
                        style={{
                          fontSize: 10,
                          color: i === 0 ? F1.amber : F1.fg3,
                          letterSpacing: i === 0 ? "0.08em" : undefined,
                          fontWeight: i === 0 ? 700 : 400,
                        }}
                      >
                        {gap}
                      </Mono>
                    </div>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <AnimatedBar widthPercent={ptsPct} color={c.color} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
