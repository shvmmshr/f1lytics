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

interface PositionChartDriver {
  driverNumber: number;
  label: string;
  color?: string;
  teamId?: string;
}

interface PositionChartProps {
  positions: OpenF1Position[];
  drivers?: PositionChartDriver[];
  height?: number;
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
  const maxLapSamples = Math.max(...series.map((item) => item.values.length), 0);

  return Array.from({ length: maxLapSamples }, (_, index) => {
    const row: ChartRow = { lap: index + 1 };

    series.forEach((item) => {
      const position = item.values[index]?.position;
      row[item.key] = position ?? null;
    });

    return row;
  });
}

export function PositionChart({ positions, drivers = [], height = 420 }: PositionChartProps) {
  if (positions.length === 0) {
    return (
      <div className="rounded-xl border border-border-subtle bg-bg-secondary p-6">
        <p className="text-sm text-text-muted">No position data available for this session.</p>
      </div>
    );
  }

  const series = getSeries(positions, drivers);
  const chartData = buildChartData(series);
  const maxPosition = Math.max(...positions.map((item) => item.position), 20);

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-secondary p-4">
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
