"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { OpenF1Position } from "@/lib/api/types";
import { TEAMS } from "@/lib/constants";
import { F1, Mono } from "@/components/shared/broadcast";

interface PositionChartDriver {
  driverNumber: number;
  label: string;
  color?: string;
  teamId?: string;
}

interface PositionChartProps {
  positions: OpenF1Position[];
  drivers?: PositionChartDriver[];
  height?: number | string;
}

interface ChartSeries {
  key: string;
  label: string;
  color: string;
  values: OpenF1Position[];
}

type ChartRow = {
  lap: number;
} & Record<string, number | null>;

function normalizeColor(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (value.startsWith("#")) return value;
  if (/^[0-9a-fA-F]{6}$/.test(value)) return `#${value}`;
  return undefined;
}

function getSeries(positions: OpenF1Position[], drivers: PositionChartDriver[]): ChartSeries[] {
  const grouped = new Map<number, OpenF1Position[]>();
  positions.forEach((item) => {
    const nextItems = [...(grouped.get(item.driver_number) ?? []), item].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    grouped.set(item.driver_number, nextItems);
  });

  const driverMap = new Map(drivers.map((driver) => [driver.driverNumber, driver]));
  const sortedNumbers = Array.from(grouped.keys()).sort((a, b) => a - b);

  return sortedNumbers.map((driverNumber) => {
    const metadata = driverMap.get(driverNumber);
    const fallbackColor =
      metadata?.teamId && TEAMS[metadata.teamId] ? TEAMS[metadata.teamId].color : "#6B7280";

    return {
      key: metadata?.label ?? `D${driverNumber}`,
      label: metadata?.label ?? `#${driverNumber}`,
      color: normalizeColor(metadata?.color) ?? fallbackColor,
      values: grouped.get(driverNumber) ?? [],
    };
  });
}

function buildChartData(series: ChartSeries[]): ChartRow[] {
  // Build a sorted union of all unique timestamps across all drivers.
  // OpenF1Position has no lap number field — only a `date` string — so we align
  // by timestamp index (Nth sample in the shared sorted union), carrying forward
  // each driver's last known position for timestamps where they have no sample.
  const allTimestamps = Array.from(
    new Set(series.flatMap((s) => s.values.map((v) => v.date)))
  ).sort();

  if (allTimestamps.length === 0) return [];

  return allTimestamps.map((ts, index) => {
    const row: ChartRow = { lap: index + 1 };

    series.forEach((item) => {
      // Find the most recent sample at or before this timestamp (carry-forward).
      let carry: number | null = null;
      for (const v of item.values) {
        if (v.date <= ts) carry = v.position;
        else break; // values are already sorted ascending by date via getSeries
      }
      row[item.key] = carry;
    });

    return row;
  });
}

export function PositionChart({ positions, drivers = [], height = "clamp(300px, 55vw, 420px)" }: PositionChartProps) {
  if (positions.length === 0) {
    return (
      <div
        style={{
          height,
          background: F1.bg2,
          border: `1px solid ${F1.line}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <Mono style={{ fontSize: 13, color: F1.fg2, letterSpacing: "0.2em", fontWeight: 600 }}>
          NO DATA
        </Mono>
        <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.14em" }}>
          OPENF1 DATA AVAILABLE AFTER SESSION ENDS
        </Mono>
      </div>
    );
  }

  const series = getSeries(positions, drivers);
  const chartData = buildChartData(series);
  const maxPosition = Math.max(...positions.map((item) => item.position), 20);

  return (
    <div style={{ background: "#141418", border: "1px solid #27272A", padding: 16 }}>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 20, left: 8, bottom: 8 }}>
            <CartesianGrid stroke="rgba(161,161,170,0.18)" strokeDasharray="3 3" />
            <XAxis
              dataKey="lap"
              tick={{ fill: "#A1A1AA", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "rgba(161,161,170,0.35)" }}
              label={{ value: "Lap", position: "insideBottomRight", fill: "#A1A1AA" }}
            />
            <YAxis
              type="number"
              domain={[maxPosition, 1]}
              allowDecimals={false}
              tick={{ fill: "#A1A1AA", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "rgba(161,161,170,0.35)" }}
              label={{ value: "Position", angle: -90, position: "insideLeft", fill: "#A1A1AA" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#141418",
                border: "1px solid #27272A",
                borderRadius: 8,
                color: "#F4F4F5",
              }}
            />
            <Legend wrapperStyle={{ color: "#A1A1AA", fontSize: 12 }} />

            {series.map((item) => (
              <Line
                key={item.key}
                type="monotone"
                dataKey={item.key}
                stroke={item.color}
                strokeWidth={2}
                dot={false}
                connectNulls
                isAnimationActive
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
