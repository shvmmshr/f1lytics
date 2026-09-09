import type { ResultItem } from "@/lib/api/types";

/** Numeric classification positions also exist for retirements. */
export function isRaceFinisher(status: string): boolean {
  return status === "Finished" || /^\+\d+ Laps?$/.test(status);
}

export interface RaceInsight { label: string; value: string; detail: string }

/** Only describe published classifications; omit insights with missing inputs. */
export function raceInsights(results: ResultItem[]): RaceInsight[] {
  const rows = [...results].sort((a, b) => Number(a.position) - Number(b.position));
  const insights: RaceInsight[] = [];
  const winner = rows.find((r) => r.position === "1");
  const second = rows.find((r) => r.position === "2");
  if (winner) insights.push({ label: "Race winner", value: winner.Driver.familyName, detail: `${winner.Constructor.name} · ${winner.points} points` });
  if (second?.Time?.time) insights.push({ label: "Winning margin", value: second.Time.time, detail: `Ahead of ${second.Driver.givenName} ${second.Driver.familyName}` });
  const fastest = rows.find((r) => r.FastestLap?.rank === "1" && r.FastestLap.Time.time);
  if (fastest?.FastestLap) insights.push({ label: "Fastest lap", value: fastest.FastestLap.Time.time, detail: `${fastest.Driver.familyName} · lap ${fastest.FastestLap.lap}` });
  const gains = rows.filter((r) => isRaceFinisher(r.status) && Number(r.grid) > 0 && Number(r.position) > 0)
    .map((r) => ({ name: r.Driver.familyName, gained: Number(r.grid) - Number(r.position) }));
  const most = Math.max(0, ...gains.map((r) => r.gained));
  if (most > 0) insights.push({ label: "Biggest recovery", value: `+${most} places`, detail: `${gains.filter((r) => r.gained === most).map((r) => r.name).join(" / ")} · finishers from the grid` });
  return insights;
}
