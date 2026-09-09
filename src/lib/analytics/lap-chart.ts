import type { OpenF1Lap, OpenF1RaceControl } from "@/lib/api/types";

export interface ChartDriver { driverNumber: number; label: string; color?: string }
export interface LapChartModel {
  rows: ({ lap: number } & Record<string, number | null>)[];
  series: { key: string; label: string; color: string }[];
  safetyCars: { startLap: number; endLap: number }[];
}

/** Display filter only: the source model and accessible table retain all laps. */
export function lapChartView(model: LapChartModel, selected: string[], includeLongLaps: boolean) {
  const limits = new Map(selected.map((key) => {
    const values = model.rows.map((row) => row[key]).filter((v): v is number => typeof v === "number").sort((a, b) => a - b);
    const middle = Math.floor(values.length / 2);
    const median = values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
    return [key, median * 1.5] as const;
  }));
  let omitted = 0;
  const rows = model.rows.map((row) => {
    const visible = { ...row };
    for (const key of selected) {
      if (!includeLongLaps && typeof visible[key] === "number" && visible[key] > limits.get(key)!) {
        visible[key] = null;
        omitted++;
      }
    }
    return visible;
  });
  return { rows, omitted };
}

/** Normalize once on the server: never serialize raw telemetry into chart props. */
export function buildLapChart(laps: OpenF1Lap[], drivers: ChartDriver[], events: OpenF1RaceControl[]): LapChartModel {
  const byLap = new Map<number, LapChartModel["rows"][number]>();
  const numbers = new Set<number>();
  for (const lap of laps) {
    if (!Number.isInteger(lap.lap_number) || lap.lap_number < 1 || lap.lap_duration === null || !Number.isFinite(lap.lap_duration) || lap.lap_duration <= 0) continue;
    const row = byLap.get(lap.lap_number) ?? { lap: lap.lap_number };
    row[`d${lap.driver_number}`] = lap.lap_duration;
    byLap.set(lap.lap_number, row);
    numbers.add(lap.driver_number);
  }
  // Preserve classification order, with unclassified timing entries afterwards.
  const ordered = [...drivers.map((d) => d.driverNumber).filter((n) => numbers.has(n)), ...[...numbers].filter((n) => !drivers.some((d) => d.driverNumber === n)).sort((a, b) => a - b)];
  const series = [...new Set(ordered)].map((n) => {
    const driver = drivers.find((d) => d.driverNumber === n);
    const color = driver?.color?.replace(/^#/, "");
    return { key: `d${n}`, label: driver?.label ?? `#${n}`, color: color && /^[\da-f]{6}$/i.test(color) ? `#${color}` : "#A1A1AA" };
  });
  const rows = [...byLap.values()].sort((a, b) => a.lap - b.lap);
  const safetyCars: LapChartModel["safetyCars"] = [];
  let start: number | null = null;
  for (const event of [...events].sort((a, b) => Date.parse(a.date) - Date.parse(b.date))) {
    if (!event.lap_number) continue;
    const message = event.message.toUpperCase();
    if (/SAFETY CAR DEPLOYED/.test(message) && start === null) start = event.lap_number;
    else if (/SAFETY CAR IN THIS LAP|SAFETY CAR ENDED|VSC ENDING|VIRTUAL SAFETY CAR ENDED|GREEN FLAG/.test(message) && start !== null) {
      safetyCars.push({ startLap: start, endLap: event.lap_number });
      start = null;
    }
  }
  if (start !== null && rows.length) safetyCars.push({ startLap: start, endLap: rows[rows.length - 1].lap });
  return { rows, series, safetyCars };
}
