import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRaceResults, getDriverStandings } from "@/lib/api/jolpica";
import { DRIVER_LIST, getDriverBySlug, TEAMS } from "@/lib/constants";
import { PageTransition } from "@/components/layout/page-transition";
import {
  F1,
  Mono,
  Brackets,
  Grid as BroadcastGrid,
  StatValue,
  PosPill,
  SectionHeader,
} from "@/components/shared/broadcast";

interface DriverProfilePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return DRIVER_LIST.map((driver) => ({ slug: driver.slug }));
}

export async function generateMetadata({ params }: DriverProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const driver = getDriverBySlug(slug);
  if (!driver) return { title: "Not Found" };
  return {
    title: `${driver.firstName} ${driver.lastName}`,
    description: `${driver.firstName} ${driver.lastName} driver profile, stats, and season results`,
  };
}

function countryCodeToFlag(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return "";
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function formatDOB(dob: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dob}T00:00:00Z`));
}

export default async function DriverProfilePage({ params }: DriverProfilePageProps) {
  const { slug } = await params;
  const driver = getDriverBySlug(slug);
  if (!driver) notFound();

  const team = TEAMS[driver.teamId];

  let raceResults: Awaited<ReturnType<typeof getRaceResults>> = [];
  let standings: Awaited<ReturnType<typeof getDriverStandings>> = [];

  try {
    [raceResults, standings] = await Promise.all([
      getRaceResults("2026"),
      getDriverStandings("2026"),
    ]);
  } catch {}

  const historyYears = ["2022", "2023", "2024", "2025"];
  const historicalStandings: { year: string; position: number | null; points: number; wins: number }[] = [];

  try {
    const histResults = await Promise.all(
      historyYears.map((y) => getDriverStandings(y).catch(() => []))
    );
    for (let i = 0; i < historyYears.length; i++) {
      const yearStandings = histResults[i];
      const entry = yearStandings.find(
        (s) => s.Driver.code?.toUpperCase() === driver.abbreviation
      );
      if (entry) {
        const pos = Number.parseInt(entry.position, 10);
        historicalStandings.push({
          year: historyYears[i],
          position: Number.isNaN(pos) ? null : pos,
          points: Number.parseFloat(entry.points) || 0,
          wins: Number.parseInt(entry.wins, 10) || 0,
        });
      }
    }
  } catch {}

  const driverStanding = standings.find(
    (s) => s.Driver.code?.toUpperCase() === driver.abbreviation
  );

  const teammate = DRIVER_LIST.find(
    (d) => d.teamId === driver.teamId && d.id !== driver.id
  );
  const teammateStanding = teammate
    ? standings.find((s) => s.Driver.code?.toUpperCase() === teammate.abbreviation)
    : undefined;

  const driverRaceResults = raceResults
    .map((race) => {
      const result = race.Results?.find(
        (e) => e.Driver.code?.toUpperCase() === driver.abbreviation
      );
      if (!result) return null;
      const pos = Number.parseInt(result.position, 10);
      return {
        round: Number.parseInt(race.round, 10),
        raceName: race.raceName,
        position: Number.isNaN(pos) ? null : pos,
        points: Number.parseFloat(result.points) || 0,
        grid: Number.parseInt(result.grid, 10) || null,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const wins = driverRaceResults.filter((r) => r.position === 1).length;
  const podiums = driverRaceResults.filter((r) => r.position !== null && r.position <= 3).length;
  const totalPoints = driverStanding ? Number.parseFloat(driverStanding.points) || 0 : 0;
  const champPos = driverStanding ? Number.parseInt(driverStanding.position, 10) : null;
  const bestFinish = driverRaceResults.length
    ? Math.min(...driverRaceResults.filter((r) => r.position !== null).map((r) => r.position!))
    : null;
  const avgFinish = driverRaceResults.length
    ? (
        driverRaceResults.reduce((sum, r) => sum + (r.position ?? 0), 0) /
        driverRaceResults.filter((r) => r.position !== null).length
      ).toFixed(1)
    : null;

  const driverPts = driverStanding ? Number.parseFloat(driverStanding.points) || 0 : 0;
  const teammatePts = teammateStanding ? Number.parseFloat(teammateStanding.points) || 0 : 0;
  const maxPairPts = Math.max(driverPts, teammatePts, 1);

  const stats = [
    { label: "CHAMPIONSHIP", value: champPos ? `P${champPos}` : "—", accent: true },
    { label: "POINTS · 2026", value: String(totalPoints) },
    { label: "WINS · 2026", value: String(wins), highlight: wins > 0 },
    { label: "PODIUMS", value: String(podiums) },
    { label: "BEST FINISH", value: bestFinish ? `P${bestFinish}` : "—" },
    { label: "AVG FINISH", value: avgFinish ?? "—" },
  ];

  return (
    <PageTransition>
      <div style={{ background: F1.bg, color: F1.fg, position: "relative" }}>
        <BroadcastGrid color={F1.line} size={64} opacity={0.18} />

        {/* HERO BAND — team-color sweep + giant number watermark */}
        <div
          className="relative overflow-hidden"
          style={{
            minHeight: 460,
            borderBottom: `1px solid ${F1.line}`,
            background: `linear-gradient(110deg, ${team.color}55 0%, ${team.color}10 35%, transparent 60%), ${F1.bg}`,
          }}
        >
          {/* Radial glow */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: -200,
              left: -200,
              width: 800,
              height: 800,
              background: `radial-gradient(circle, ${team.color}30 0%, transparent 60%)`,
              filter: "blur(40px)",
              pointerEvents: "none",
            }}
          />

          {/* Giant number watermark */}
          <div
            aria-hidden
            className="font-display absolute select-none pointer-events-none"
            style={{
              right: -40,
              top: -60,
              fontSize: 640,
              fontWeight: 700,
              lineHeight: 0.8,
              color: team.color,
              opacity: 0.16,
              letterSpacing: "-0.06em",
            }}
          >
            {driver.number}
          </div>

          {/* Breadcrumb */}
          <div
            className="relative flex items-center gap-3"
            style={{ padding: "20px 32px 0" }}
          >
            <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.18em" }}>
              <Link href="/" className="hover:text-white transition-colors">F1LYTICS</Link>
              {" › "}
              <Link href="/drivers" className="hover:text-white transition-colors">DRIVERS · 2026</Link>
              {" › "}
              <span style={{ color: F1.fg }}>
                {driver.lastName.toUpperCase()} · #{driver.number}
              </span>
            </Mono>
          </div>

          {/* Identity */}
          <div
            className="relative grid"
            style={{
              gridTemplateColumns: "minmax(260px, 320px) minmax(0, 1fr)",
              gap: 32,
              padding: "32px 32px 40px",
              alignItems: "end",
            }}
          >
            <div
              className="relative"
              style={{
                width: "100%",
                aspectRatio: "3/4",
                maxHeight: 400,
                background: F1.bg2,
                border: `1px solid ${F1.line}`,
                overflow: "hidden",
              }}
            >
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: team.color,
                  zIndex: 2,
                }}
              />
              <Image
                src={driver.image}
                alt={`${driver.firstName} ${driver.lastName}`}
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 100vw, 320px"
                unoptimized
                priority
              />
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0"
                style={{
                  height: "40%",
                  background: "linear-gradient(to top, rgba(8,8,10,0.9), transparent)",
                }}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <span
                  style={{
                    width: 4,
                    height: 28,
                    background: team.color,
                    display: "inline-block",
                  }}
                />
                <Mono style={{ fontSize: 11, color: F1.fg2, letterSpacing: "0.18em" }}>
                  {team.name.toUpperCase()} · {team.engine.toUpperCase()}
                </Mono>
              </div>
              <div
                className="font-display"
                style={{
                  fontSize: "clamp(28px, 3vw, 40px)",
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  lineHeight: 0.9,
                  color: F1.fg2,
                }}
              >
                {driver.firstName.toUpperCase()}
              </div>
              <h1
                className="font-display uppercase m-0"
                style={{
                  fontSize: "clamp(72px, 10vw, 156px)",
                  fontWeight: 700,
                  lineHeight: 0.85,
                  letterSpacing: "-0.05em",
                  color: F1.fg,
                }}
              >
                {driver.lastName}
                <span style={{ color: team.color }}>.</span>
              </h1>

              {/* Identity strip */}
              <div
                className="flex flex-wrap items-center mt-5"
                style={{ gap: "0 24px", rowGap: 8 }}
              >
                {[
                  { label: "BORN", value: formatDOB(driver.dateOfBirth) },
                  { label: "AGE", value: `${calculateAge(driver.dateOfBirth)}` },
                  { label: "NATIONALITY", value: `${countryCodeToFlag(driver.countryCode)} ${driver.nationality}` },
                  { label: "CAR", value: `#${driver.number}` },
                  { label: "CODE", value: driver.abbreviation },
                ].map((row) => (
                  <div key={row.label} className="flex items-baseline gap-2">
                    <Mono
                      style={{
                        fontSize: 9,
                        color: F1.fg3,
                        letterSpacing: "0.18em",
                      }}
                    >
                      {row.label}
                    </Mono>
                    <Mono
                      style={{
                        fontSize: 13,
                        color: F1.fg,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {row.value}
                    </Mono>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* STAT TILES — 3×2 grid with corner brackets */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
            gap: 1,
            background: F1.line,
            borderBottom: `1px solid ${F1.line}`,
          }}
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="relative"
              style={{
                background: F1.bg,
                padding: "24px 20px",
                minHeight: 124,
              }}
            >
              <Brackets color={F1.fg4} size={8} />
              <Mono
                style={{
                  fontSize: 9,
                  color: F1.fg3,
                  letterSpacing: "0.18em",
                  display: "block",
                }}
              >
                {s.label}
              </Mono>
              <StatValue
                size={48}
                color={s.accent ? team.color : s.highlight ? F1.amber : F1.fg}
                style={{ marginTop: 12, display: "block" }}
              >
                {s.value}
              </StatValue>
            </div>
          ))}
        </div>

        {/* MAIN CONTENT — season results + side panel */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 380px)",
            gap: 1,
            background: F1.line,
          }}
        >
          {/* SEASON FORM (race results) */}
          <div style={{ background: F1.bg, padding: "28px 32px" }}>
            <SectionHeader
              label="SEASON FORM · 2026"
              right={
                <Mono style={{ fontSize: 10, color: F1.fg3 }}>
                  {driverRaceResults.length} ROUNDS COMPLETED
                </Mono>
              }
            />

            {driverRaceResults.length === 0 ? (
              <div className="mt-6">
                <Mono style={{ color: F1.fg3, fontSize: 12, letterSpacing: "0.18em" }}>
                  NO RACE RESULTS YET FOR 2026.
                </Mono>
              </div>
            ) : (
              <div className="mt-6">
                {/* Header row */}
                <div
                  className="grid items-center"
                  style={{
                    gridTemplateColumns: "44px minmax(0, 1fr) 60px 60px 60px 50px",
                    gap: 12,
                    padding: "10px 12px",
                    background: F1.bg2,
                    borderBottom: `1px solid ${F1.line}`,
                  }}
                >
                  {["RND", "GRAND PRIX", "GRID", "FIN", "Δ", "PTS"].map((h, i) => (
                    <Mono
                      key={h}
                      style={{
                        fontSize: 9,
                        color: F1.fg3,
                        letterSpacing: "0.18em",
                        textAlign: i >= 2 ? "right" : "left",
                      }}
                    >
                      {h}
                    </Mono>
                  ))}
                </div>

                {driverRaceResults.map((r, i) => {
                  const gained = r.grid && r.position ? r.grid - r.position : null;
                  return (
                    <div
                      key={r.round}
                      className="grid items-center"
                      style={{
                        gridTemplateColumns: "44px minmax(0, 1fr) 60px 60px 60px 50px",
                        gap: 12,
                        padding: "12px",
                        background: i % 2 === 0 ? F1.bg : F1.bg2,
                        borderBottom: `1px solid ${F1.line}`,
                      }}
                    >
                      <Mono style={{ fontSize: 11, color: F1.fg3, letterSpacing: "0.08em" }}>
                        R{String(r.round).padStart(2, "0")}
                      </Mono>
                      <span
                        className="font-display truncate"
                        style={{
                          fontSize: 16,
                          fontWeight: 500,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {r.raceName.replace(/Grand Prix/i, "GP").toUpperCase()}
                      </span>
                      <Mono
                        style={{
                          fontSize: 13,
                          color: F1.fg2,
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {r.grid ?? "—"}
                      </Mono>
                      <div style={{ textAlign: "right" }}>
                        {r.position !== null ? (
                          <PosPill pos={r.position} size="sm" />
                        ) : (
                          <Mono style={{ fontSize: 13, color: F1.fg3 }}>DNF</Mono>
                        )}
                      </div>
                      <Mono
                        style={{
                          fontSize: 11,
                          color:
                            gained === null
                              ? F1.fg3
                              : gained > 0
                                ? F1.green
                                : gained < 0
                                  ? F1.red
                                  : F1.fg3,
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {gained === null ? "—" : gained > 0 ? `+${gained}` : gained === 0 ? "0" : gained}
                      </Mono>
                      <Mono
                        style={{
                          fontSize: 13,
                          color: r.points > 0 ? F1.fg : F1.fg3,
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                          fontWeight: 600,
                        }}
                      >
                        {r.points > 0 ? r.points : "—"}
                      </Mono>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CAREER TIMELINE */}
            {historicalStandings.length > 0 && (
              <div className="mt-10">
                <SectionHeader
                  label="CAREER TIMELINE"
                  right={
                    <Mono style={{ fontSize: 10, color: F1.fg3 }}>
                      LAST {historicalStandings.length + 1} SEASONS
                    </Mono>
                  }
                />
                <div
                  className="grid mt-6"
                  style={{
                    gridTemplateColumns: `repeat(${historicalStandings.length + 1}, minmax(0, 1fr))`,
                    gap: 1,
                    background: F1.line,
                    border: `1px solid ${F1.line}`,
                  }}
                >
                  {historicalStandings.map((h) => (
                    <div
                      key={h.year}
                      style={{ background: F1.bg, padding: "16px 12px", textAlign: "center" }}
                    >
                      <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.18em" }}>
                        {h.year}
                      </Mono>
                      <StatValue size={28} style={{ display: "block", marginTop: 6 }}>
                        {h.position ? `P${h.position}` : "—"}
                      </StatValue>
                      <Mono style={{ fontSize: 10, color: F1.fg3, marginTop: 4, display: "block" }}>
                        {h.points} PTS · {h.wins}W
                      </Mono>
                    </div>
                  ))}
                  <div
                    style={{
                      background: F1.bg,
                      padding: "16px 12px",
                      textAlign: "center",
                      borderTop: `2px solid ${team.color}`,
                    }}
                  >
                    <Mono style={{ fontSize: 10, color: team.color, letterSpacing: "0.18em", fontWeight: 600 }}>
                      2026
                    </Mono>
                    <StatValue size={28} color={team.color} style={{ display: "block", marginTop: 6 }}>
                      {champPos ? `P${champPos}` : "—"}
                    </StatValue>
                    <Mono style={{ fontSize: 10, color: F1.fg3, marginTop: 4, display: "block" }}>
                      {totalPoints} PTS · {wins}W
                    </Mono>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SIDE PANEL — teammate H2H + team card */}
          <div style={{ background: F1.bg, padding: "28px 24px" }}>
            {teammate && (
              <>
                <SectionHeader label="TEAMMATE H2H" />
                <div className="mt-5 space-y-4">
                  {[
                    { d: driver, s: driverStanding, pts: driverPts, isFocus: true },
                    { d: teammate, s: teammateStanding, pts: teammatePts, isFocus: false },
                  ].map(({ d, s, pts, isFocus }) => {
                    const pos = s?.position ? Number.parseInt(s.position, 10) : null;
                    return (
                      <Link
                        key={d.id}
                        href={`/drivers/${d.slug}`}
                        className="block group"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="relative shrink-0"
                            style={{
                              width: 40,
                              height: 40,
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
                              unoptimized
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className="font-display truncate"
                              style={{
                                fontSize: 16,
                                fontWeight: 600,
                                letterSpacing: "-0.01em",
                                color: isFocus ? F1.fg : F1.fg2,
                              }}
                            >
                              {d.lastName.toUpperCase()}
                            </div>
                            <Mono style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.14em" }}>
                              #{d.number} · {d.abbreviation}
                            </Mono>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <StatValue size={20} color={isFocus ? team.color : F1.fg2}>
                              {pos ? `P${pos}` : "—"}
                            </StatValue>
                            <Mono style={{ fontSize: 10, color: F1.fg3, display: "block" }}>
                              {pts} PTS
                            </Mono>
                          </div>
                        </div>
                        {/* mirrored bar */}
                        <div
                          style={{
                            marginTop: 8,
                            height: 4,
                            background: F1.bg3,
                            position: "relative",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${(pts / maxPairPts) * 100}%`,
                              background: team.color,
                              opacity: isFocus ? 1 : 0.45,
                            }}
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}

            {/* TEAM CARD */}
            <div className="mt-8">
              <SectionHeader label="CONSTRUCTOR" />
              <Link
                href={`/teams/${team.slug}`}
                className="block mt-5 group"
                style={{
                  background: F1.bg2,
                  border: `1px solid ${F1.line}`,
                  borderTop: `2px solid ${team.color}`,
                  padding: 20,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      background: F1.bg,
                      border: `1px solid ${F1.line}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
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
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-display"
                      style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" }}
                    >
                      {team.name.toUpperCase()}
                    </div>
                    <Mono style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.14em" }}>
                      {team.fullName.toUpperCase()}
                    </Mono>
                  </div>
                  <Mono style={{ fontSize: 16, color: F1.fg3 }}>→</Mono>
                </div>
                <div
                  className="grid mt-4"
                  style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}
                >
                  {[
                    { label: "ENGINE", value: team.engine },
                    { label: "BASE", value: team.base },
                    { label: "PRINCIPAL", value: team.principal },
                    { label: "LINEUP", value: team.drivers.join(" · ") },
                  ].map((row) => (
                    <div key={row.label}>
                      <Mono style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.18em" }}>
                        {row.label}
                      </Mono>
                      <div
                        style={{
                          fontSize: 12,
                          color: F1.fg,
                          marginTop: 2,
                          letterSpacing: "0.02em",
                        }}
                      >
                        {row.value}
                      </div>
                    </div>
                  ))}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
