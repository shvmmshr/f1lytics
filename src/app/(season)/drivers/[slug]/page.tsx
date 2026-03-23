import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRaceResults, getDriverStandings } from "@/lib/api/jolpica";
import { DRIVER_LIST, getDriverBySlug, TEAMS } from "@/lib/constants";
import { PageTransition } from "@/components/layout/page-transition";

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
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dob}T00:00:00Z`));
}

export default async function DriverProfilePage({ params }: DriverProfilePageProps) {
  const { slug } = await params;
  const driver = getDriverBySlug(slug);
  if (!driver) notFound();

  const team = TEAMS[driver.teamId];

  // Fetch current 2026 data
  let raceResults: Awaited<ReturnType<typeof getRaceResults>> = [];
  let standings: Awaited<ReturnType<typeof getDriverStandings>> = [];

  try {
    [raceResults, standings] = await Promise.all([
      getRaceResults("2026"),
      getDriverStandings("2026"),
    ]);
  } catch {
    // APIs unavailable
  }

  // Fetch historical standings (2022-2025)
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
  } catch {
    // Historical data unavailable
  }

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
  const bestFinish = driverRaceResults.length
    ? Math.min(...driverRaceResults.filter((r) => r.position !== null).map((r) => r.position!))
    : null;
  const avgFinish = driverRaceResults.length
    ? (
        driverRaceResults.reduce((sum, r) => sum + (r.position ?? 0), 0) /
        driverRaceResults.filter((r) => r.position !== null).length
      ).toFixed(1)
    : null;

  // Position color helper
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
      {/* ── Bento Grid — 6 col base with varied spans ── */}
      <div className="grid auto-rows-auto grid-cols-2 gap-3 md:grid-cols-6">

        {/* ── A. Driver Photo — tall left column ── */}
        <div className="relative col-span-2 overflow-hidden rounded-2xl border border-border-subtle bg-bg-secondary md:row-span-5">
          <div className="absolute inset-x-0 top-0 z-10 h-1" style={{ backgroundColor: team.color }} />

          <div className="relative h-full min-h-[420px] w-full md:min-h-[560px]">
            <Image
              src={driver.image}
              alt={`${driver.firstName} ${driver.lastName}`}
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, 33vw"
              unoptimized
            />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

            {/* Number watermark */}
            <div
              className="pointer-events-none absolute -right-4 top-6 select-none font-mono text-[140px] font-black leading-none opacity-[0.08]"
              style={{ color: team.color }}
            >
              {driver.number}
            </div>

            {/* Info overlay */}
            <div className="absolute inset-x-0 bottom-0 p-6">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 p-1 backdrop-blur-sm">
                  <Image src={team.logo} alt={team.name} width={18} height={18} className="object-contain" unoptimized />
                </div>
                <span className="text-xs font-medium text-white/70">{team.name}</span>
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {driver.firstName}
                <br />
                <span style={{ color: team.color }}>{driver.lastName}</span>
              </h1>
              <p className="mt-1 text-sm text-white/50">
                {countryCodeToFlag(driver.countryCode)} {driver.nationality} · #{driver.number}
              </p>
            </div>
          </div>
        </div>

        {/* ── B. Championship — wide accent card ── */}
        <div
          className="col-span-2 flex items-center gap-5 rounded-2xl border p-6"
          style={{ borderColor: team.color + "30", backgroundColor: team.color + "08" }}
        >
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Championship</p>
            <p className="mt-1 font-mono text-6xl font-black leading-none" style={{ color: team.color }}>
              {driverStanding?.position ? `P${driverStanding.position}` : "-"}
            </p>
          </div>
          <div className="h-12 w-px bg-border-subtle" />
          <div>
            <p className="font-mono text-3xl font-bold text-text-primary">{totalPoints}</p>
            <p className="text-xs text-text-muted">points scored</p>
          </div>
        </div>

        {/* ── C. Wins — small square ── */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border-subtle bg-bg-secondary p-5 text-center">
          <p className="text-[10px] uppercase tracking-widest text-text-muted">Wins</p>
          <p className="mt-2 font-mono text-3xl font-bold" style={{ color: wins > 0 ? team.color : "var(--color-text-primary)" }}>
            {wins}
          </p>
        </div>

        {/* ── D. Podiums — small square ── */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border-subtle bg-bg-secondary p-5 text-center">
          <p className="text-[10px] uppercase tracking-widest text-text-muted">Podiums</p>
          <p className="mt-2 font-mono text-3xl font-bold" style={{ color: podiums > 0 ? team.color : "var(--color-text-primary)" }}>
            {podiums}
          </p>
        </div>

        {/* ── E. Profile — tall info card ── */}
        <div className="col-span-2 row-span-2 rounded-2xl border border-border-subtle bg-bg-secondary p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Profile</h3>
          <div className="mt-4 space-y-4">
            {[
              { label: "Date of Birth", value: formatDOB(driver.dateOfBirth) },
              { label: "Age", value: `${calculateAge(driver.dateOfBirth)} years` },
              { label: "Nationality", value: `${countryCodeToFlag(driver.countryCode)} ${driver.nationality}` },
              { label: "Number", value: `#${driver.number}` },
              { label: "Code", value: driver.abbreviation },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between border-b border-border-subtle pb-3 last:border-0 last:pb-0">
                <span className="text-xs text-text-muted">{row.label}</span>
                <span className="text-sm font-medium text-text-primary">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── F. Best Finish — small ── */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border-subtle bg-bg-secondary p-5 text-center">
          <p className="text-[10px] uppercase tracking-widest text-text-muted">Best</p>
          <p
            className="mt-2 font-mono text-3xl font-bold"
            style={{ color: bestFinish !== null && bestFinish <= 3 ? posColor(bestFinish) : "var(--color-text-primary)" }}
          >
            {bestFinish ? `P${bestFinish}` : "-"}
          </p>
        </div>

        {/* ── G. Avg Finish — small ── */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border-subtle bg-bg-secondary p-5 text-center">
          <p className="text-[10px] uppercase tracking-widest text-text-muted">Avg Pos</p>
          <p className="mt-2 font-mono text-3xl font-bold text-text-primary">
            {avgFinish ?? "-"}
          </p>
        </div>

        {/* ── H. Team — wide card with link ── */}
        <div className="col-span-2 rounded-2xl border border-border-subtle bg-bg-secondary p-5">
          <Link
            href={`/teams/${team.slug}`}
            className="flex items-center gap-4 rounded-xl border border-border-subtle bg-bg-tertiary p-4 transition-colors hover:bg-bg-primary"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-bg-primary p-2">
              <Image src={team.logo} alt={team.name} width={32} height={32} className="object-contain" unoptimized />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-text-primary">{team.name}</p>
              <p className="truncate text-xs text-text-muted">{team.fullName}</p>
            </div>
            <span className="text-xs text-text-muted">&rarr;</span>
          </Link>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {[
              { label: "Engine", value: team.engine },
              { label: "Base", value: team.base },
              { label: "Principal", value: team.principal },
            ].map((row) => (
              <div key={row.label}>
                <p className="text-[10px] uppercase tracking-widest text-text-muted">{row.label}</p>
                <p className="mt-1 text-xs font-medium text-text-primary">{row.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── I. Season History — full width timeline ── */}
        {historicalStandings.length > 0 && (
          <div className="col-span-2 rounded-2xl border border-border-subtle bg-bg-secondary p-5 md:col-span-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Career Timeline</h3>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {historicalStandings.map((h) => (
                <div key={h.year} className="rounded-xl border border-border-subtle bg-bg-tertiary p-4 text-center">
                  <p className="font-mono text-xs text-text-muted">{h.year}</p>
                  <p
                    className="mt-2 font-mono text-2xl font-bold"
                    style={{ color: posColor(h.position) }}
                  >
                    {h.position ? `P${h.position}` : "-"}
                  </p>
                  <div className="mx-auto mt-2 h-1 w-8 rounded-full" style={{ backgroundColor: posColor(h.position), opacity: 0.4 }} />
                  <p className="mt-2 font-mono text-[10px] text-text-muted">
                    {h.points} pts
                  </p>
                  <p className="font-mono text-[10px] text-text-muted">
                    {h.wins} {h.wins === 1 ? "win" : "wins"}
                  </p>
                </div>
              ))}
              {/* 2026 current */}
              <div
                className="rounded-xl border p-4 text-center"
                style={{ borderColor: team.color + "40", backgroundColor: team.color + "06" }}
              >
                <p className="font-mono text-xs font-semibold" style={{ color: team.color }}>2026</p>
                <p className="mt-2 font-mono text-2xl font-bold" style={{ color: team.color }}>
                  {driverStanding?.position ? `P${driverStanding.position}` : "-"}
                </p>
                <div className="mx-auto mt-2 h-1 w-8 rounded-full" style={{ backgroundColor: team.color, opacity: 0.5 }} />
                <p className="mt-2 font-mono text-[10px] text-text-muted">
                  {totalPoints} pts
                </p>
                <p className="font-mono text-[10px] text-text-muted">
                  {wins} {wins === 1 ? "win" : "wins"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── J. Race Results — wide table ── */}
        <div className="col-span-2 rounded-2xl border border-border-subtle bg-bg-secondary p-5 md:col-span-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted">2026 Race Results</h3>

          {driverRaceResults.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-lg border border-border-subtle">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle bg-bg-tertiary text-[10px] uppercase tracking-widest text-text-muted">
                    <th className="px-4 py-2.5 text-left font-medium">Rnd</th>
                    <th className="px-4 py-2.5 text-left font-medium">Race</th>
                    <th className="hidden px-4 py-2.5 text-right font-medium sm:table-cell">Grid</th>
                    <th className="px-4 py-2.5 text-right font-medium">Finish</th>
                    <th className="px-4 py-2.5 text-right font-medium">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {driverRaceResults.map((r) => {
                    const gained = r.grid && r.position ? r.grid - r.position : null;
                    return (
                      <tr key={r.round} className="border-b border-border-subtle last:border-0">
                        <td className="px-4 py-3 font-mono text-text-muted">R{r.round}</td>
                        <td className="px-4 py-3 text-text-primary">{r.raceName}</td>
                        <td className="hidden px-4 py-3 text-right font-mono text-text-muted sm:table-cell">
                          {r.grid ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono font-bold" style={{ color: posColor(r.position) }}>
                            {r.position !== null ? `P${r.position}` : "-"}
                          </span>
                          {gained !== null && gained !== 0 && (
                            <span className={`ml-1.5 text-[10px] ${gained > 0 ? "text-green-500" : "text-red-400"}`}>
                              {gained > 0 ? `+${gained}` : gained}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-text-secondary">
                          {r.points > 0 ? r.points : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-text-muted">No race results available yet for 2026.</p>
          )}
        </div>

        {/* ── K. Teammate Battle — sidebar alongside results ── */}
        {teammate && (
          <div className="col-span-2 rounded-2xl border border-border-subtle bg-bg-secondary p-5">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Teammate Battle</h3>
            <p className="mt-1 text-[10px] text-text-muted">{team.name}</p>

            <div className="mt-4 space-y-3">
              {[
                { d: driver, s: driverStanding },
                { d: teammate, s: teammateStanding },
              ].map(({ d, s }) => {
                const pos = s?.position ? Number.parseInt(String(s.position), 10) : null;
                const displayPos = pos !== null && !Number.isNaN(pos) ? `P${pos}` : "-";
                const pts = s ? Number.parseFloat(s.points) || 0 : 0;
                const maxPts = Math.max(
                  driverStanding ? Number.parseFloat(driverStanding.points) || 0 : 0,
                  teammateStanding ? Number.parseFloat(teammateStanding.points) || 0 : 0,
                  1
                );
                return (
                  <Link
                    key={d.id}
                    href={`/drivers/${d.slug}`}
                    className="block rounded-xl border border-border-subtle bg-bg-tertiary p-4 transition-colors hover:bg-bg-primary"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border-subtle bg-bg-primary">
                        <Image src={d.image} alt={`${d.firstName} ${d.lastName}`} fill className="object-cover object-top" unoptimized />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-text-primary">
                          {d.firstName} <span style={{ color: team.color }}>{d.lastName}</span>
                        </p>
                        <p className="text-[10px] text-text-muted">#{d.number}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-xs font-bold" style={{ color: team.color }}>{displayPos}</p>
                        <p className="font-mono text-lg font-bold text-text-primary">{pts}<span className="text-[9px] text-text-muted"> pts</span></p>
                      </div>
                    </div>
                    {/* Points bar */}
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-bg-primary">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(pts / maxPts) * 100}%`, backgroundColor: team.color }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
