import type { Metadata } from "next";
import { getConstructorStandings, getDriverStandings } from "@/lib/api/jolpica";
import { DRIVER_LIST, TEAM_LIST, TEAMS } from "@/lib/constants";
import { PageTransition } from "@/components/layout/page-transition";
import {
  F1,
  Mono,
  StatValue,
  PosPill,
  SectionHeader,
  Trend,
  Grid as BroadcastGrid,
} from "@/components/shared/broadcast";

export const metadata: Metadata = {
  title: "Standings",
  description: "Driver and constructor championship standings for the 2026 F1 season",
};

const CONSTRUCTOR_TO_TEAM: Record<string, string> = {
  mclaren: "mclaren",
  ferrari: "ferrari",
  red_bull: "red_bull",
  mercedes: "mercedes",
  aston_martin: "aston_martin",
  alpine: "alpine",
  williams: "williams",
  rb: "racing_bulls",
  racing_bulls: "racing_bulls",
  haas: "haas",
  sauber: "audi",
  kick_sauber: "audi",
  audi: "audi",
  cadillac: "cadillac",
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function mapConstructorToTeamId(constructorId: string, constructorName: string): string | undefined {
  const mappedId = CONSTRUCTOR_TO_TEAM[constructorId];
  if (mappedId && TEAMS[mappedId]) return mappedId;

  const normalizedName = normalize(constructorName);

  if (normalizedName.includes("racingbulls") || normalizedName === "rb") return "racing_bulls";
  if (normalizedName.includes("sauber")) return "audi";
  if (normalizedName.includes("redbull")) return "red_bull";

  const matchedTeam = TEAM_LIST.find((team) => {
    const teamName = normalize(team.name);
    const teamFullName = normalize(team.fullName);
    return (
      teamName === normalizedName ||
      teamFullName.includes(normalizedName) ||
      normalizedName.includes(teamName)
    );
  });

  return matchedTeam?.id;
}

export default async function StandingsPage() {
  let driverStandings: Awaited<ReturnType<typeof getDriverStandings>> = [];
  let constructorStandings: Awaited<ReturnType<typeof getConstructorStandings>> = [];

  try {
    [driverStandings, constructorStandings] = await Promise.all([
      getDriverStandings("2026"),
      getConstructorStandings("2026"),
    ]);
  } catch {
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
          style={{ padding: "40px 32px 28px", borderBottom: `1px solid ${F1.line}` }}
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
              fontSize: "clamp(56px, 8vw, 96px)",
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
        <div
          className="grid"
          style={{
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 380px)",
            gap: 1,
            background: F1.line,
          }}
        >
          {/* DRIVERS table */}
          <div style={{ background: F1.bg, padding: 0 }}>
            <div
              className="grid items-center"
              style={{
                gridTemplateColumns: "44px 6px 56px minmax(0, 1fr) 80px 60px",
                gap: 10,
                padding: "12px 24px",
                borderBottom: `1px solid ${F1.line}`,
                background: F1.bg2,
              }}
            >
              {["POS", "", "CODE", "DRIVER · TEAM", "PTS", "WINS"].map((h, i) => (
                <Mono
                  key={i}
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
                  className="relative grid items-center"
                  style={{
                    gridTemplateColumns: "44px 6px 56px minmax(0, 1fr) 80px 60px",
                    gap: 10,
                    padding: "14px 24px",
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
                      width: `${ptsPct}%`,
                      background: `linear-gradient(90deg, ${d.color}26 0%, transparent 100%)`,
                      pointerEvents: "none",
                    }}
                  />
                  <span style={{ position: "relative" }}>
                    <PosPill pos={d.position} size={d.position <= 3 ? "md" : "sm"} />
                  </span>
                  <span
                    style={{
                      width: 4,
                      height: 36,
                      background: d.color,
                      alignSelf: "center",
                      position: "relative",
                    }}
                  />
                  <Mono
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
                        lineHeight: 1,
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
              const gap = i === 0 ? "—" : `−${(maxConstructorPts - c.points).toFixed(0)}`;
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
                          color: i === 0 ? F1.green : F1.fg3,
                        }}
                      >
                        <Trend dir={i === 0 ? "up" : "flat"} /> {gap}
                      </Mono>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, height: 3, background: F1.bg3 }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${ptsPct}%`,
                        background: c.color,
                      }}
                    />
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
