"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { OpenF1Lap, OpenF1RaceControl } from "@/lib/api/types";
import { TEAMS } from "@/lib/constants";

interface LapTimeDriver {
  driverNumber: number;
  label: string;
  color?: string;
  teamId?: string;
}

interface LapTimeChartProps {
  laps: OpenF1Lap[];
  drivers?: LapTimeDriver[];
  raceControl?: OpenF1RaceControl[];
  height?: number;
}

type LapChartRow = {
  lap: number;
} & Record<string, number | null>;

interface SafetyCarWindow {
  startLap: number;
  endLap: number;
}

function normalizeColor(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (value.startsWith("#")) return value;
  if (/^[0-9a-fA-F]{6}$/.test(value)) return `#${value}`;
  return undefined;
}

function buildSafetyCarWindows(events: OpenF1RaceControl[]): SafetyCarWindow[] {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const windows = [] as SafetyCarWindow[];
  let activeStart: number | null = null;

  sortedEvents.forEach((event) => {
    if (!event.lap_number) return;

    const message = event.message.toUpperCase();
    const isStart =
      message.includes("SAFETY CAR DEPLOYED") ||
      message.includes("VIRTUAL SAFETY CAR DEPLOYED");
    const isEnd =
      message.includes("SAFETY CAR IN THIS LAP") ||
      message.includes("SAFETY CAR ENDED") ||
      message.includes("VSC ENDING") ||
      message.includes("VIRTUAL SAFETY CAR ENDED") ||
      message.includes("GREEN FLAG");

    if (isStart && activeStart === null) {
      activeStart = event.lap_number;
      return;
    }

    if (isEnd && activeStart !== null) {
      windows.push({ startLap: activeStart, endLap: event.lap_number });
      activeStart = null;
    }
  });

  return windows;
}

export function LapTimeChart({
  laps,
  drivers = [],
  raceControl = [],
  height = 420,
}: LapTimeChartProps) {
  if (laps.length === 0) {
    return (
      <div style={{ background: "#141418", border: "1px solid #27272A", padding: 24 }}>
        <p className="text-sm">No lap-time data available for this session.</p>
      </div>
    );
  }

  const validLaps = laps.filter((lap) => lap.lap_duration !== null && lap.lap_number > 0);
  const maxLap = Math.max(...validLaps.map((lap) => lap.lap_number), 1);

  const driverNumbers = Array.from(new Set(validLaps.map((lap) => lap.driver_number))).sort(
    (a, b) => a - b
  );
  const driverMap = new Map(drivers.map((driver) => [driver.driverNumber, driver]));

  const chartData = Array.from({ length: maxLap }, (_, index) => {
    const lapNumber = index + 1;
    const row: LapChartRow = { lap: lapNumber };

    driverNumbers.forEach((driverNumber) => {
      const key = driverMap.get(driverNumber)?.label ?? `D${driverNumber}`;
      const lap = validLaps.find(
        (candidate) =>
          candidate.driver_number === driverNumber && candidate.lap_number === lapNumber
      );
      row[key] = lap?.lap_duration ?? null;
    });

    return row;
  });

  const series = driverNumbers.map((driverNumber) => {
    const metadata = driverMap.get(driverNumber);
    const fallbackColor =
      metadata?.teamId && TEAMS[metadata.teamId] ? TEAMS[metadata.teamId].color : "#6B7280";

    return {
      key: metadata?.label ?? `D${driverNumber}`,
      label: metadata?.label ?? `#${driverNumber}`,
      color: normalizeColor(metadata?.color) ?? fallbackColor,
    };
  });

  const allLapTimes = validLaps.map((lap) => lap.lap_duration as number);
  const minLap = Math.min(...allLapTimes);
  const maxLapTime = Math.max(...allLapTimes);
  const safetyCarWindows = buildSafetyCarWindows(raceControl);

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
              domain={[minLap * 0.995, maxLapTime * 1.005]}
              tick={{ fill: "#A1A1AA", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "rgba(161,161,170,0.35)" }}
              label={{
                value: "Lap Time (s)",
                angle: -90,
                position: "insideLeft",
                fill: "#A1A1AA",
              }}
            />

            {safetyCarWindows.map((window, index) => (
              <ReferenceArea
                key={`sc-${window.startLap}-${window.endLap}-${index}`}
                x1={window.startLap}
                x2={window.endLap}
                fill="#EAB308"
                fillOpacity={0.12}
                strokeOpacity={0}
              />
            ))}

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
                dot={{ r: 1.5 }}
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
