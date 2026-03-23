import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getConstructorStandings, getDriverStandings, getRaceResults } from "@/lib/api/jolpica";
import { TEAM_LIST, TEAMS, getTeamBySlug } from "@/lib/constants";
import { DRIVERS, type Driver } from "@/lib/constants/drivers";
import { PageTransition } from "@/components/layout/page-transition";

interface TeamPageProps {
  params: Promise<{ slug: string }>;
}

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
  const n = normalize(constructorName);
  if (n.includes("racingbulls") || n === "rb") return "racing_bulls";
  if (n.includes("sauber")) return "audi";
  if (n.includes("redbull")) return "red_bull";
  return TEAM_LIST.find((t) => n.includes(normalize(t.name)) || normalize(t.name).includes(n))?.id;
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
  } catch {
    // ignore
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
  } catch {
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
    if (pos === null) return "var(--color-text-muted)";
    if (pos === 1) return "#FFD700";
    if (pos === 2) return "#C0C0C0";
    if (pos === 3) return "#CD7F32";
    if (pos <= 10) return team.color;
    return "var(--color-text-secondary)";
  };

  return (
    <PageTransition>
      <div className="grid auto-rows-auto grid-cols-2 gap-3 md:grid-cols-6">

        {/* ── A. Team Hero — wide banner ── */}
        <div
          className="col-span-2 overflow-hidden rounded-2xl border border-border-subtle md:col-span-4"
          style={{ backgroundImage: `linear-gradient(135deg, ${team.color}18 0%, transparent 60%)` }}
        >
          <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: team.color }} />
          <div className="relative p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-border-subtle bg-bg-primary p-3">
                <Image src={team.logo} alt={team.name} width={40} height={40} className="object-contain" unoptimized />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Constructor</p>
                <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
                  {team.name}
                </h1>
                <p className="mt-0.5 text-sm text-text-secondary">{team.fullName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── B. Championship Position ── */}
        <div
          className="col-span-2 flex flex-col items-center justify-center rounded-2xl border p-6 text-center"
          style={{ borderColor: team.color + "30", backgroundColor: team.color + "08" }}
        >
          <p className="text-[10px] uppercase tracking-widest text-text-muted">Championship</p>
          <p className="mt-2 font-mono text-5xl font-black" style={{ color: team.color }}>
            {constructorStanding?.position ? `P${constructorStanding.position}` : "-"}
          </p>
          <p className="mt-1 font-mono text-sm text-text-secondary">
            {totalPoints} <span className="text-text-muted">pts</span> · {totalWins} <span className="text-text-muted">wins</span>
          </p>
        </div>

        {/* ── C. Drivers — wide card with headshots ── */}
        <div className="col-span-2 rounded-2xl border border-border-subtle bg-bg-secondary p-5 md:col-span-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Drivers</h3>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {teamDrivers.map((d) => {
              const standing = driverStandingMap.get(d.abbreviation);
              const pos = standing?.position;
              const pts = standing?.points ?? 0;
              return (
                <Link
                  key={d.id}
                  href={`/drivers/${d.slug}`}
                  className="flex items-center gap-4 rounded-xl border border-border-subtle bg-bg-tertiary p-4 transition-colors hover:bg-bg-primary"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 bg-bg-primary" style={{ borderColor: team.color }}>
                    <Image src={d.image} alt={`${d.firstName} ${d.lastName}`} fill className="object-cover object-top" unoptimized />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-text-primary">
                      {d.firstName} <span style={{ color: team.color }}>{d.lastName}</span>
                    </p>
                    <p className="text-xs text-text-muted">#{d.number} · {d.abbreviation}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs font-bold" style={{ color: team.color }}>
                      {pos ? `P${pos}` : "-"}
                    </p>
                    <p className="font-mono text-lg font-bold text-text-primary">
                      {pts}<span className="text-[9px] text-text-muted"> pts</span>
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── D. Team Info ── */}
        <div className="col-span-2 rounded-2xl border border-border-subtle bg-bg-secondary p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Details</h3>
          <div className="mt-4 space-y-4">
            {[
              { label: "Engine", value: team.engine },
              { label: "Base", value: team.base },
              { label: "Principal", value: team.principal },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between border-b border-border-subtle pb-3 last:border-0 last:pb-0">
                <span className="text-xs text-text-muted">{row.label}</span>
                <span className="text-right text-sm font-medium text-text-primary">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── E. Constructor History ── */}
        {historicalStandings.length > 0 && (
          <div className="col-span-2 rounded-2xl border border-border-subtle bg-bg-secondary p-5 md:col-span-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Constructor Timeline</h3>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {historicalStandings.map((h) => (
                <div key={h.year} className="rounded-xl border border-border-subtle bg-bg-tertiary p-4 text-center">
                  <p className="font-mono text-xs text-text-muted">{h.year}</p>
                  <p className="mt-2 font-mono text-2xl font-bold" style={{ color: posColor(h.position) }}>
                    {h.position ? `P${h.position}` : "-"}
                  </p>
                  <div className="mx-auto mt-2 h-1 w-8 rounded-full" style={{ backgroundColor: posColor(h.position), opacity: 0.4 }} />
                  <p className="mt-2 font-mono text-[10px] text-text-muted">{h.points} pts</p>
                  <p className="font-mono text-[10px] text-text-muted">{h.wins} {h.wins === 1 ? "win" : "wins"}</p>
                </div>
              ))}
              <div className="rounded-xl border p-4 text-center" style={{ borderColor: team.color + "40", backgroundColor: team.color + "06" }}>
                <p className="font-mono text-xs font-semibold" style={{ color: team.color }}>2026</p>
                <p className="mt-2 font-mono text-2xl font-bold" style={{ color: team.color }}>
                  {constructorStanding?.position ? `P${constructorStanding.position}` : "-"}
                </p>
                <div className="mx-auto mt-2 h-1 w-8 rounded-full" style={{ backgroundColor: team.color, opacity: 0.5 }} />
                <p className="mt-2 font-mono text-[10px] text-text-muted">{totalPoints} pts</p>
                <p className="font-mono text-[10px] text-text-muted">{totalWins} {totalWins === 1 ? "win" : "wins"}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── F. Season Results Table ── */}
        <div className="col-span-2 rounded-2xl border border-border-subtle bg-bg-secondary p-5 md:col-span-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted">2026 Race Results</h3>

          {raceData.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-lg border border-border-subtle">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle bg-bg-tertiary text-[10px] uppercase tracking-widest text-text-muted">
                    <th className="px-4 py-2.5 text-left font-medium">Rnd</th>
                    <th className="px-4 py-2.5 text-left font-medium">Race</th>
                    {teamDrivers.map((d) => (
                      <th key={d.id} className="hidden px-4 py-2.5 text-right font-medium sm:table-cell">{d.abbreviation}</th>
                    ))}
                    <th className="px-4 py-2.5 text-right font-medium">Pts</th>
                    <th className="px-4 py-2.5 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {raceData.map((r) => (
                    <tr key={r.round} className="border-b border-border-subtle last:border-0">
                      <td className="px-4 py-3 font-mono text-text-muted">R{r.round}</td>
                      <td className="px-4 py-3 text-text-primary">{r.raceName}</td>
                      {r.driverResults.map((dr) => (
                        <td key={dr.driver.id} className="hidden px-4 py-3 text-right sm:table-cell">
                          <span className="font-mono font-bold" style={{ color: posColor(dr.position) }}>
                            {dr.position ? `P${dr.position}` : "-"}
                          </span>
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right font-mono text-text-secondary">
                        {r.racePoints > 0 ? r.racePoints : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-text-primary">
                        {r.cumulativePoints}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-text-muted">No race data available yet for 2026.</p>
          )}
        </div>

        {/* ── G. Points Progression Bars ── */}
        {raceData.length > 0 && (
          <div className="col-span-2 rounded-2xl border border-border-subtle bg-bg-secondary p-5 md:col-span-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Points Progression</h3>
            <div className="mt-4 space-y-2">
              {raceData.map((r) => {
                const maxCum = raceData[raceData.length - 1].cumulativePoints || 1;
                const pct = Math.max((r.cumulativePoints / maxCum) * 100, 3);
                return (
                  <div key={r.round}>
                    <div className="mb-1 flex items-center justify-between text-[10px] text-text-muted">
                      <span>R{r.round} · {r.raceName}</span>
                      <span className="font-mono">{r.cumulativePoints} pts</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-bg-tertiary">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: team.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
