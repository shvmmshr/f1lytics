import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getConstructorStandings, getDriverStandings, getRaceResults } from "@/lib/api/jolpica";
import { TEAM_LIST, getTeamBySlug } from "@/lib/constants";
import { mapConstructorToTeamId } from "@/lib/constructor-map";
import { DRIVERS, type Driver } from "@/lib/constants/drivers";
import { PageTransition } from "@/components/layout/page-transition";
import {
  F1,
  Mono,
  Brackets,
  Grid as BroadcastGrid,
  StatValue,
  SectionHeader,
} from "@/components/shared/broadcast";

interface TeamPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return TEAM_LIST.map((team) => ({ slug: team.slug }));
}

export async function generateMetadata({ params }: TeamPageProps): Promise<Metadata> {
  const { slug } = await params;
  const team = getTeamBySlug(slug);
  if (!team) return { title: "Not Found" };
  return {
    title: `${team.name}`,
    description: `${team.fullName} team profile, drivers, and season results`,
  };
}

function getTeamDrivers(ids: [string, string]): Driver[] {
  return ids.map((id) => DRIVERS[id]).filter(Boolean);
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Fetch historical constructor standings
async function getHistoricalStandings(teamName: string) {
  const years = ["2022", "2023", "2024", "2025"];
  const results: { year: string; position: number | null; points: number; wins: number }[] = [];

  try {
    const all = await Promise.all(years.map((y) => getConstructorStandings(y).catch(() => [])));
    for (let i = 0; i < years.length; i++) {
      const n = normalize(teamName);
      const entry = all[i].find((s) => {
        const cn = normalize(s.Constructor.name);
        return cn.includes(n) || n.includes(cn);
      });
      if (entry) {
        const pos = Number.parseInt(entry.position, 10);
        results.push({
          year: years[i],
          position: Number.isNaN(pos) ? null : pos,
          points: Number.parseFloat(entry.points) || 0,
          wins: Number.parseInt(entry.wins, 10) || 0,
        });
      }
    }
  } catch (err) {
    console.error("[f1lytics] historical constructor standings fetch failed:", err);
  }

  return results;
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { slug } = await params;
  const team = getTeamBySlug(slug);
  if (!team) notFound();

  const teamDrivers = getTeamDrivers(team.drivers);
  const driverCodeSet = new Set(teamDrivers.map((d) => d.abbreviation));

  let constructorStandings: Awaited<ReturnType<typeof getConstructorStandings>> = [];
  let driverStandings: Awaited<ReturnType<typeof getDriverStandings>> = [];
  let raceResults: Awaited<ReturnType<typeof getRaceResults>> = [];

  try {
    [constructorStandings, driverStandings, raceResults] = await Promise.all([
      getConstructorStandings("2026"),
      getDriverStandings("2026"),
      getRaceResults("2026"),
    ]);
  } catch (err) {
    console.error("[f1lytics] team page data fetch failed:", err);
    // API unavailable
  }

  const historicalStandings = await getHistoricalStandings(team.name);

  const constructorStanding = constructorStandings.find(
    (s) => mapConstructorToTeamId(s.Constructor.constructorId, s.Constructor.name) === team.id
  );

  const driverStandingMap = new Map<string, { points: number; position: number | null }>();
  for (const s of driverStandings) {
    const code = s.Driver.code?.toUpperCase();
    if (!code) continue;
    const pos = Number.parseInt(s.position, 10);
    driverStandingMap.set(code, {
      points: Number.parseFloat(s.points) || 0,
      position: Number.isNaN(pos) ? null : pos,
    });
  }

  // Build race summaries
  const raceSummaries = raceResults
    .map((race) => {
      const teamEntries = (race.Results ?? []).filter((e) => {
        const mapped = mapConstructorToTeamId(e.Constructor.constructorId, e.Constructor.name);
        if (mapped === team.id) return true;
        const code = e.Driver.code?.toUpperCase();
        return Boolean(code && driverCodeSet.has(code));
      });
      if (!teamEntries.length) return null;

      const positions = teamEntries.map((e) => Number.parseInt(e.position, 10)).filter((p) => !Number.isNaN(p));
      const bestFinish = positions.length ? Math.min(...positions) : null;
      const racePoints = teamEntries.reduce((sum, e) => sum + (Number.parseFloat(e.points) || 0), 0);

      // Per-driver results
      const driverResults = teamDrivers.map((d) => {
        const entry = teamEntries.find((e) => e.Driver.code?.toUpperCase() === d.abbreviation);
        if (!entry) return { driver: d, position: null, points: 0 };
        const pos = Number.parseInt(entry.position, 10);
        return {
          driver: d,
          position: Number.isNaN(pos) ? null : pos,
          points: Number.parseFloat(entry.points) || 0,
        };
      });

      return {
        round: Number.parseInt(race.round, 10),
        raceName: race.raceName,
        bestFinish,
        racePoints,
        driverResults,
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => a.round - b.round);

  // Cumulative points
  const raceData = raceSummaries.reduce<(typeof raceSummaries[number] & { cumulativePoints: number })[]>((acc, s) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].cumulativePoints : 0;
    acc.push({ ...s, cumulativePoints: Math.round((prev + s.racePoints) * 10) / 10 });
    return acc;
  }, []);

  const totalPoints = constructorStanding ? Number.parseFloat(constructorStanding.points) || 0 : 0;
  const totalWins = raceData.filter((r) => r.bestFinish === 1).length;

  const posColor = (pos: number | null) => {
    if (pos === null) return F1.fg4;
    if (pos === 1) return F1.amber;
    if (pos === 2) return "#C0C0C0";
    if (pos === 3) return "#CD7F32";
    if (pos <= 10) return team.color;
    return F1.fg3;
  };

  const teamSlugUpper = team.name.toUpperCase();

  return (
    <PageTransition>
      <div style={{ background: F1.bg, color: F1.fg, position: "relative" }}>
        <BroadcastGrid color={F1.line} size={64} opacity={0.18} />

        {/* HERO BAND */}
        <section
          className="relative overflow-hidden"
          style={{
            borderBottom: `1px solid ${F1.line}`,
            background: `linear-gradient(135deg, ${team.color}26 0%, ${team.color}08 30%, transparent 60%)`,
            padding: "44px clamp(16px, 4vw, 32px) 36px",
          }}
        >
          {/* Giant watermark team name */}
          <div
            aria-hidden
            className="font-display absolute pointer-events-none select-none"
            style={{
              right: -24,
              top: -12,
              fontSize: "clamp(180px, 22vw, 360px)",
              fontWeight: 700,
              lineHeight: 0.85,
              letterSpacing: "-0.06em",
              color: team.color,
              opacity: 0.08,
              whiteSpace: "nowrap",
            }}
          >
            {teamSlugUpper}
          </div>

          <div className="relative mx-auto" style={{ maxWidth: 1400 }}>
            <div className="flex items-center gap-3.5 mb-5">
              <Mono style={{ color: F1.red, fontSize: 11, letterSpacing: "0.24em", fontWeight: 700 }}>
                CONSTRUCTOR
              </Mono>
              <span style={{ width: 40, height: 1, background: F1.line }} />
              <Mono style={{ color: F1.fg3, fontSize: 11, letterSpacing: "0.18em" }}>
                <Link href="/teams" style={{ color: F1.fg3 }}>SEASON / TEAMS</Link> / {teamSlugUpper}
              </Mono>
            </div>

            <div
              className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
              style={{
                gap: 32,
                alignItems: "stretch",
              }}
            >
              {/* IDENTITY */}
              <div className="flex items-center gap-5 min-w-0">
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 84,
                    height: 84,
                    background: F1.bg,
                    border: `1px solid ${F1.line}`,
                    padding: 14,
                  }}
                >
                  <Image
                    src={team.logo}
                    alt={team.name}
                    width={56}
                    height={56}
                    className="object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <h1
                    className="font-display uppercase m-0"
                    style={{
                      fontWeight: 700,
                      fontSize: "clamp(48px, 6vw, 80px)",
                      lineHeight: 0.9,
                      letterSpacing: "-0.04em",
                      color: F1.fg,
                    }}
                  >
                    {team.name}
                    <span style={{ color: team.color }}>.</span>
                  </h1>
                  <Mono
                    className="block mt-2"
                    style={{
                      fontSize: 12,
                      color: F1.fg2,
                      letterSpacing: "0.16em",
                    }}
                  >
                    {team.fullName.toUpperCase()}
                  </Mono>
                </div>
              </div>

              {/* CHAMPIONSHIP TILE */}
              <div
                className="relative"
                style={{
                  background: F1.bg2,
                  border: `1px solid ${team.color}55`,
                  padding: "20px 24px",
                }}
              >
                <Brackets color={team.color} size={10} />
                <Mono
                  className="block"
                  style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.2em" }}
                >
                  CHAMPIONSHIP
                </Mono>
                <div
                  className="font-display"
                  style={{
                    fontSize: "clamp(40px, 9vw, 64px)",
                    fontWeight: 700,
                    color: team.color,
                    lineHeight: 1,
                    letterSpacing: "-0.04em",
                    marginTop: 6,
                  }}
                >
                  {constructorStanding?.position ? `P${constructorStanding.position}` : "—"}
                </div>
                <Mono
                  className="block"
                  style={{ fontSize: 11, color: F1.fg2, marginTop: 8, letterSpacing: "0.14em" }}
                >
                  {totalPoints} <span style={{ color: F1.fg3 }}>PTS</span> · {totalWins}{" "}
                  <span style={{ color: F1.fg3 }}>{totalWins === 1 ? "WIN" : "WINS"}</span>
                </Mono>
              </div>
            </div>

            {/* DETAILS STRIP */}
            <div
              className="grid grid-cols-1 sm:grid-cols-3 mt-9"
              style={{
                gap: 1,
                background: F1.line,
                border: `1px solid ${F1.line}`,
              }}
            >
              {[
                ["ENGINE", team.engine],
                ["BASE", team.base],
                ["PRINCIPAL", team.principal],
              ].map(([label, value]) => (
                <div key={label} style={{ background: F1.bg, padding: "16px 20px" }}>
                  <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.2em" }}>
                    {label}
                  </Mono>
                  <div
                    className="font-display"
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: F1.fg,
                      letterSpacing: "-0.01em",
                      marginTop: 6,
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DRIVERS */}
        <section
          className="relative"
          style={{ padding: "40px clamp(16px, 4vw, 32px)", borderBottom: `1px solid ${F1.line}` }}
        >
          <div className="mx-auto" style={{ maxWidth: 1400 }}>
            <SectionHeader label="DRIVERS" accent={team.color} />
            <div
              className="grid grid-cols-1 lg:grid-cols-2"
              style={{
                gap: 1,
                background: F1.line,
                border: `1px solid ${F1.line}`,
              }}
            >
              {teamDrivers.map((d) => {
                const standing = driverStandingMap.get(d.abbreviation);
                const pos = standing?.position;
                const pts = standing?.points ?? 0;
                return (
                  <Link
                    key={d.id}
                    href={`/drivers/${d.slug}`}
                    className="group flex items-center gap-4"
                    style={{
                      background: F1.bg,
                      borderTop: `2px solid ${team.color}`,
                      padding: "16px 18px",
                    }}
                  >
                    <div
                      className="relative shrink-0 overflow-hidden"
                      style={{
                        width: 60,
                        height: 60,
                        background: F1.bg2,
                        border: `1px solid ${team.color}55`,
                      }}
                    >
                      <Image
                        src={d.image}
                        alt={`${d.firstName} ${d.lastName}`}
                        fill
                        sizes="60px"
                        className="object-cover object-top"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Mono
                        className="block"
                        style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.18em" }}
                      >
                        {d.firstName.toUpperCase()}
                      </Mono>
                      <div
                        className="font-display"
                        style={{
                          fontSize: 22,
                          fontWeight: 700,
                          color: F1.fg,
                          letterSpacing: "-0.02em",
                          lineHeight: 1.05,
                        }}
                      >
                        {d.lastName.toUpperCase()}
                      </div>
                      <Mono
                        className="block"
                        style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.16em", marginTop: 4 }}
                      >
                        #{d.number} · {d.abbreviation}
                      </Mono>
                    </div>
                    <div className="text-right shrink-0">
                      <Mono
                        className="block"
                        style={{
                          fontSize: 11,
                          color: pos ? team.color : F1.fg3,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                        }}
                      >
                        {pos ? `P${pos}` : "—"}
                      </Mono>
                      <StatValue size={26} color={F1.fg}>
                        {pts}
                      </StatValue>
                      <Mono
                        className="block"
                        style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.18em" }}
                      >
                        PTS
                      </Mono>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* CONSTRUCTOR TIMELINE */}
        {historicalStandings.length > 0 && (
          <section
            className="relative"
            style={{ padding: "40px clamp(16px, 4vw, 32px)", borderBottom: `1px solid ${F1.line}` }}
          >
            <div className="mx-auto" style={{ maxWidth: 1400 }}>
              <SectionHeader label="CONSTRUCTOR TIMELINE" accent={team.color} />
              <div className="overflow-x-auto">
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${historicalStandings.length + 1}, minmax(90px, 1fr))`,
                  minWidth: (historicalStandings.length + 1) * 90,
                  gap: 1,
                  background: F1.line,
                  border: `1px solid ${F1.line}`,
                }}
              >
                {historicalStandings.map((h) => (
                  <div
                    key={h.year}
                    style={{
                      background: F1.bg,
                      padding: "20px 16px",
                      textAlign: "center",
                    }}
                  >
                    <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.2em" }}>
                      {h.year}
                    </Mono>
                    <div
                      className="font-display"
                      style={{
                        fontSize: "clamp(26px, 4.5vw, 36px)",
                        fontWeight: 700,
                        color: posColor(h.position),
                        lineHeight: 1,
                        letterSpacing: "-0.03em",
                        marginTop: 8,
                      }}
                    >
                      {h.position ? `P${h.position}` : "—"}
                    </div>
                    <div
                      className="mx-auto"
                      style={{
                        marginTop: 8,
                        height: 2,
                        width: 32,
                        background: posColor(h.position),
                        opacity: 0.6,
                      }}
                    />
                    <Mono
                      className="block"
                      style={{ fontSize: 10, color: F1.fg3, marginTop: 8 }}
                    >
                      {h.points} pts
                    </Mono>
                    <Mono
                      className="block"
                      style={{ fontSize: 10, color: F1.fg3 }}
                    >
                      {h.wins} {h.wins === 1 ? "win" : "wins"}
                    </Mono>
                  </div>
                ))}
                <div
                  style={{
                    background: F1.bg,
                    padding: "20px 16px",
                    textAlign: "center",
                    borderTop: `2px solid ${team.color}`,
                    boxShadow: `inset 0 0 0 1px ${team.color}40`,
                  }}
                >
                  <Mono style={{ fontSize: 10, color: team.color, letterSpacing: "0.2em", fontWeight: 700 }}>
                    2026
                  </Mono>
                  <div
                    className="font-display"
                    style={{
                      fontSize: "clamp(26px, 4.5vw, 36px)",
                      fontWeight: 700,
                      color: team.color,
                      lineHeight: 1,
                      letterSpacing: "-0.03em",
                      marginTop: 8,
                    }}
                  >
                    {constructorStanding?.position ? `P${constructorStanding.position}` : "—"}
                  </div>
                  <div
                    className="mx-auto"
                    style={{
                      marginTop: 8,
                      height: 2,
                      width: 32,
                      background: team.color,
                    }}
                  />
                  <Mono className="block" style={{ fontSize: 10, color: F1.fg3, marginTop: 8 }}>
                    {totalPoints} pts
                  </Mono>
                  <Mono className="block" style={{ fontSize: 10, color: F1.fg3 }}>
                    {totalWins} {totalWins === 1 ? "win" : "wins"}
                  </Mono>
                </div>
              </div>
              </div>
            </div>
          </section>
        )}

        {/* RACE RESULTS */}
        <section
          className="relative"
          style={{ padding: "40px clamp(16px, 4vw, 32px)", borderBottom: `1px solid ${F1.line}` }}
        >
          <div className="mx-auto" style={{ maxWidth: 1400 }}>
            <SectionHeader label="2026 RACE RESULTS" accent={team.color} />
            {raceData.length > 0 ? (
              <div
                className="overflow-x-auto"
                style={{
                  background: F1.bg2,
                  border: `1px solid ${F1.line}`,
                }}
              >
                <table className="w-full" style={{ borderCollapse: "collapse", minWidth: 480 }}>
                  <thead>
                    <tr style={{ background: F1.bg, borderBottom: `1px solid ${F1.line}` }}>
                      <th
                        className="font-mono text-left"
                        style={{
                          padding: "12px 18px",
                          fontSize: 10,
                          color: F1.fg3,
                          letterSpacing: "0.2em",
                          fontWeight: 600,
                        }}
                      >
                        RND
                      </th>
                      <th
                        className="font-mono text-left"
                        style={{
                          padding: "12px 18px",
                          fontSize: 10,
                          color: F1.fg3,
                          letterSpacing: "0.2em",
                          fontWeight: 600,
                        }}
                      >
                        RACE
                      </th>
                      {teamDrivers.map((d) => (
                        <th
                          key={d.id}
                          className="font-mono text-right hidden sm:table-cell"
                          style={{
                            padding: "12px 18px",
                            fontSize: 10,
                            color: F1.fg3,
                            letterSpacing: "0.2em",
                            fontWeight: 600,
                          }}
                        >
                          {d.abbreviation}
                        </th>
                      ))}
                      <th
                        className="font-mono text-right"
                        style={{
                          padding: "12px 18px",
                          fontSize: 10,
                          color: F1.fg3,
                          letterSpacing: "0.2em",
                          fontWeight: 600,
                        }}
                      >
                        PTS
                      </th>
                      <th
                        className="font-mono text-right"
                        style={{
                          padding: "12px 18px",
                          fontSize: 10,
                          color: F1.fg3,
                          letterSpacing: "0.2em",
                          fontWeight: 600,
                        }}
                      >
                        TOTAL
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {raceData.map((r) => (
                      <tr
                        key={r.round}
                        style={{ borderBottom: `1px solid ${F1.line}` }}
                      >
                        <td
                          className="font-mono"
                          style={{
                            padding: "14px 18px",
                            color: F1.fg3,
                            fontSize: 12,
                            letterSpacing: "0.08em",
                          }}
                        >
                          R{String(r.round).padStart(2, "0")}
                        </td>
                        <td
                          className="font-display"
                          style={{
                            padding: "14px 18px",
                            color: F1.fg,
                            fontSize: 14,
                            fontWeight: 500,
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {r.raceName}
                        </td>
                        {r.driverResults.map((dr) => (
                          <td
                            key={dr.driver.id}
                            className="font-mono text-right hidden sm:table-cell tabular-nums"
                            style={{
                              padding: "14px 18px",
                              color: posColor(dr.position),
                              fontSize: 13,
                              fontWeight: 700,
                            }}
                          >
                            {dr.position ? `P${dr.position}` : "—"}
                          </td>
                        ))}
                        <td
                          className="font-mono text-right tabular-nums"
                          style={{
                            padding: "14px 18px",
                            color: F1.fg2,
                            fontSize: 13,
                          }}
                        >
                          {r.racePoints > 0 ? r.racePoints : "—"}
                        </td>
                        <td
                          className="font-mono text-right tabular-nums"
                          style={{
                            padding: "14px 18px",
                            color: F1.fg,
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        >
                          {r.cumulativePoints}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Mono style={{ color: F1.fg3, fontSize: 12, letterSpacing: "0.14em" }}>
                NO RACE DATA AVAILABLE YET FOR 2026.
              </Mono>
            )}
          </div>
        </section>

        {/* POINTS PROGRESSION */}
        {raceData.length > 0 && (
          <section className="relative" style={{ padding: "40px clamp(16px, 4vw, 32px) 60px" }}>
            <div className="mx-auto" style={{ maxWidth: 1400 }}>
              <SectionHeader label="POINTS PROGRESSION" accent={team.color} />
              <div
                style={{
                  background: F1.bg2,
                  border: `1px solid ${F1.line}`,
                  padding: "20px 24px",
                }}
              >
                <div className="space-y-3">
                  {raceData.map((r) => {
                    const maxCum = raceData[raceData.length - 1].cumulativePoints || 1;
                    const pct = Math.max((r.cumulativePoints / maxCum) * 100, 3);
                    return (
                      <div key={r.round}>
                        <div className="flex items-center justify-between mb-1.5">
                          <Mono
                            style={{
                              fontSize: 10,
                              color: F1.fg3,
                              letterSpacing: "0.14em",
                            }}
                          >
                            R{String(r.round).padStart(2, "0")} · {r.raceName.toUpperCase()}
                          </Mono>
                          <Mono
                            style={{
                              fontSize: 11,
                              color: F1.fg,
                              fontWeight: 700,
                              letterSpacing: "0.08em",
                            }}
                          >
                            {r.cumulativePoints} PTS
                          </Mono>
                        </div>
                        <div
                          className="relative"
                          style={{ height: 3, background: F1.bg }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${pct}%`,
                              background: team.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </PageTransition>
  );
}
