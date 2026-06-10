import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRaceResults } from "@/lib/api/jolpica";
import { CIRCUIT_LIST, getCircuitBySlug } from "@/lib/constants";
import { PageTransition } from "@/components/layout/page-transition";
import {
  F1,
  Mono,
  Grid as BroadcastGrid,
  SectionHeader,
} from "@/components/shared/broadcast";

interface CircuitPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return CIRCUIT_LIST.map((circuit) => ({ slug: circuit.slug }));
}

export async function generateMetadata({ params }: CircuitPageProps): Promise<Metadata> {
  const { slug } = await params;
  const circuit = getCircuitBySlug(slug);
  if (!circuit) return { title: "Not Found" };
  return {
    title: `${circuit.fullName}`,
    description: `${circuit.fullName} circuit stats, schedule, and track information`,
  };
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

function countryCodeToFlag(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return "";
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}

export default async function CircuitPage({ params }: CircuitPageProps) {
  const { slug } = await params;
  const circuit = getCircuitBySlug(slug);
  if (!circuit) notFound();

  // Find adjacent circuits for prev/next nav
  const idx = CIRCUIT_LIST.findIndex((c) => c.id === circuit.id);
  const prev = idx > 0 ? CIRCUIT_LIST[idx - 1] : null;
  const next = idx < CIRCUIT_LIST.length - 1 ? CIRCUIT_LIST[idx + 1] : null;

  let lastWinner: string | null = null;
  let topResults: { position: string; driverId: string; driver: string; team: string; time: string }[] = [];

  if (!circuit.cancelled) {
    try {
      const raceResults = await getRaceResults("2026", String(circuit.round));
      const race = raceResults[0];
      if (race?.Results) {
        const winner = race.Results.find((r) => r.position === "1");
        if (winner) lastWinner = `${winner.Driver.givenName} ${winner.Driver.familyName}`;
        topResults = [...race.Results].sort((a, b) => Number.parseInt(a.position, 10) - Number.parseInt(b.position, 10)).slice(0, 5).map((r) => ({
          position: r.position,
          driverId: r.Driver.driverId,
          driver: `${r.Driver.givenName} ${r.Driver.familyName}`,
          team: r.Constructor?.name ?? "",
          time: r.Time?.time ?? (r.status || ""),
        }));
      }
    } catch (err) {
      console.error("[f1lytics] circuit race results fetch failed:", err);
      // No data yet
    }
  }

  return (
    <PageTransition>
      <div style={{ background: F1.bg, color: F1.fg, position: "relative" }}>
        <BroadcastGrid color={F1.line} size={64} opacity={0.18} />

        {circuit.cancelled && (
          <div
            style={{
              padding: "10px 32px",
              background: F1.red,
              color: F1.fg,
              textAlign: "center",
            }}
          >
            <Mono style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em" }}>
              THIS GRAND PRIX HAS BEEN CANCELLED FOR 2026
            </Mono>
          </div>
        )}

        {/* HERO — track + stats split */}
        <section
          className="relative"
          style={{
            borderBottom: `1px solid ${F1.line}`,
            padding: "44px 32px 36px",
          }}
        >
          <div className="relative mx-auto" style={{ maxWidth: 1400 }}>
            <div className="flex items-center gap-3.5 mb-5">
              <Mono style={{ color: F1.red, fontSize: 11, letterSpacing: "0.24em", fontWeight: 700 }}>
                ROUND {String(circuit.round).padStart(2, "0")}
              </Mono>
              <span style={{ width: 40, height: 1, background: F1.line }} />
              <Mono style={{ color: F1.fg3, fontSize: 11, letterSpacing: "0.18em" }}>
                <Link href="/circuits" style={{ color: F1.fg3 }}>
                  SEASON / CIRCUITS
                </Link>{" "}
                / {circuit.country.toUpperCase()}
              </Mono>
              {circuit.isSprint && !circuit.cancelled && (
                <Mono
                  style={{
                    fontSize: 9,
                    background: F1.amber,
                    color: F1.ink,
                    padding: "3px 8px",
                    letterSpacing: "0.2em",
                    fontWeight: 700,
                    marginLeft: 4,
                  }}
                >
                  SPRINT
                </Mono>
              )}
            </div>

            <div
              className="grid"
              style={{
                gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)",
                gap: 1,
                background: F1.line,
                border: `1px solid ${F1.line}`,
              }}
            >
              {/* Track image */}
              <div
                className="relative flex items-center justify-center"
                style={{ background: F1.bg2, padding: 28, minHeight: 280 }}
              >
                <Image
                  src={circuit.trackImage}
                  alt={`${circuit.name} track layout`}
                  width={400}
                  height={400}
                  className="h-full max-h-72 w-auto object-contain"
                  style={{ filter: "brightness(0) invert(1)", opacity: 0.9 }}
                  unoptimized
                />
              </div>

              {/* Identity */}
              <div style={{ background: F1.bg, padding: "28px 32px" }}>
                <h1
                  className="font-display uppercase m-0"
                  style={{
                    fontWeight: 700,
                    fontSize: "clamp(40px, 5.6vw, 72px)",
                    lineHeight: 0.9,
                    letterSpacing: "-0.04em",
                    color: F1.fg,
                  }}
                >
                  {circuit.name}
                  <span style={{ color: F1.red }}>.</span>
                </h1>
                <Mono
                  className="block mt-2"
                  style={{ fontSize: 12, color: F1.fg2, letterSpacing: "0.16em" }}
                >
                  {circuit.fullName.toUpperCase()}
                </Mono>
                <Mono
                  className="block mt-1"
                  style={{ fontSize: 11, color: F1.fg3, letterSpacing: "0.14em" }}
                >
                  {countryCodeToFlag(circuit.countryCode)} {circuit.city.toUpperCase()},{" "}
                  {circuit.country.toUpperCase()}
                </Mono>

                <div
                  className="grid mt-7"
                  style={{
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: 1,
                    background: F1.line,
                    border: `1px solid ${F1.line}`,
                  }}
                >
                  {[
                    {
                      label: "RACE DATE",
                      value: formatDate(circuit.raceDate).toUpperCase(),
                      sub:
                        circuit.isSprint && circuit.sprintDate
                          ? `SPRINT · ${formatDate(circuit.sprintDate).toUpperCase()}`
                          : null,
                      subColor: F1.amber,
                    },
                    {
                      label: "LENGTH",
                      value: `${circuit.length.toFixed(3)} KM`,
                    },
                    {
                      label: "TURNS",
                      value: String(circuit.turns),
                    },
                    {
                      label: "LAP RECORD",
                      value: circuit.lapRecord,
                      sub: circuit.lapRecordHolder,
                      subColor: F1.fg3,
                    },
                  ].map((tile) => (
                    <div
                      key={tile.label}
                      style={{ background: F1.bg, padding: "12px 14px" }}
                    >
                      <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.18em" }}>
                        {tile.label}
                      </Mono>
                      <div
                        className="font-display tabular-nums"
                        style={{
                          fontSize: 18,
                          fontWeight: 600,
                          color: F1.fg,
                          letterSpacing: "-0.01em",
                          marginTop: 4,
                          lineHeight: 1.1,
                        }}
                      >
                        {tile.value}
                      </div>
                      {tile.sub && (
                        <Mono
                          className="block"
                          style={{
                            fontSize: 9,
                            color: tile.subColor ?? F1.fg3,
                            letterSpacing: "0.14em",
                            marginTop: 4,
                          }}
                        >
                          {tile.sub}
                        </Mono>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RESULTS / PREVIEW */}
        <section
          className="relative"
          style={{ padding: "40px 32px", borderBottom: `1px solid ${F1.line}` }}
        >
          <div className="mx-auto" style={{ maxWidth: 1400 }}>
            <SectionHeader
              label={
                lastWinner
                  ? "RACE RESULTS"
                  : circuit.cancelled
                    ? "RACE STATUS"
                    : "RACE PREVIEW"
              }
            />
            {topResults.length > 0 ? (
              <div
                style={{
                  background: F1.bg2,
                  border: `1px solid ${F1.line}`,
                  overflow: "hidden",
                }}
              >
                <table className="w-full" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: F1.bg, borderBottom: `1px solid ${F1.line}` }}>
                      {["POS", "DRIVER", "TEAM", "TIME"].map((h, i) => (
                        <th
                          key={h}
                          className={`font-mono ${i === 3 ? "text-right" : "text-left"} ${
                            i === 2 ? "hidden sm:table-cell" : ""
                          }`}
                          style={{
                            padding: "12px 18px",
                            fontSize: 10,
                            color: F1.fg3,
                            letterSpacing: "0.2em",
                            fontWeight: 600,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topResults.map((r) => (
                      <tr key={r.driverId} style={{ borderBottom: `1px solid ${F1.line}` }}>
                        <td
                          className="font-mono"
                          style={{
                            padding: "14px 18px",
                            color: F1.fg,
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          P{r.position}
                        </td>
                        <td
                          className="font-display"
                          style={{
                            padding: "14px 18px",
                            color: F1.fg,
                            fontSize: 14,
                            fontWeight: 500,
                          }}
                        >
                          {r.driver}
                        </td>
                        <td
                          className="font-mono hidden sm:table-cell"
                          style={{ padding: "14px 18px", color: F1.fg3, fontSize: 12 }}
                        >
                          {r.team}
                        </td>
                        <td
                          className="font-mono text-right tabular-nums"
                          style={{ padding: "14px 18px", color: F1.fg2, fontSize: 12 }}
                        >
                          {r.time}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                style={{
                  background: F1.bg2,
                  border: `1px dashed ${F1.line}`,
                  padding: "32px 24px",
                  textAlign: "center",
                }}
              >
                <Mono
                  className="block"
                  style={{ fontSize: 12, color: F1.fg3, letterSpacing: "0.16em" }}
                >
                  {circuit.cancelled
                    ? "THIS ROUND WAS CANCELLED — NO RESULTS FOR 2026."
                    : `RACE RESULTS WILL APPEAR AFTER ${formatDate(circuit.raceDate).toUpperCase()}.`}
                </Mono>
                {lastWinner && (
                  <div
                    className="font-display mt-3"
                    style={{ fontSize: 16, color: F1.fg, fontWeight: 600 }}
                  >
                    WINNER · {lastWinner.toUpperCase()}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* PREV / NEXT */}
        <section className="relative" style={{ padding: "32px 32px 60px" }}>
          <div
            className="mx-auto grid"
            style={{
              maxWidth: 1400,
              gridTemplateColumns: "1fr 1fr",
              gap: 1,
              background: F1.line,
              border: `1px solid ${F1.line}`,
            }}
          >
            {prev ? (
              <Link
                href={`/circuits/${prev.slug}`}
                className="group flex items-center gap-3"
                style={{ background: F1.bg, padding: "16px 22px" }}
              >
                <span style={{ color: F1.fg3, fontSize: 18 }}>←</span>
                <div className="min-w-0">
                  <Mono
                    className="block"
                    style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.2em" }}
                  >
                    PREV · ROUND {String(prev.round).padStart(2, "0")}
                  </Mono>
                  <div
                    className="font-display truncate"
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: F1.fg,
                      letterSpacing: "-0.01em",
                      marginTop: 2,
                    }}
                  >
                    {prev.fullName.toUpperCase()}
                  </div>
                </div>
              </Link>
            ) : (
              <div style={{ background: F1.bg }} />
            )}
            {next ? (
              <Link
                href={`/circuits/${next.slug}`}
                className="group flex items-center justify-end gap-3 text-right"
                style={{ background: F1.bg, padding: "16px 22px" }}
              >
                <div className="min-w-0">
                  <Mono
                    className="block"
                    style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.2em" }}
                  >
                    NEXT · ROUND {String(next.round).padStart(2, "0")}
                  </Mono>
                  <div
                    className="font-display truncate"
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: F1.fg,
                      letterSpacing: "-0.01em",
                      marginTop: 2,
                    }}
                  >
                    {next.fullName.toUpperCase()}
                  </div>
                </div>
                <span style={{ color: F1.fg3, fontSize: 18 }}>→</span>
              </Link>
            ) : (
              <div style={{ background: F1.bg }} />
            )}
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
