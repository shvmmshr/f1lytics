"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { OpenF1CarData } from "@/lib/api/types";

interface TraceDriver {
  label: string;
  color: string;
}

interface TelemetryTraceProps {
  leftData: OpenF1CarData[];
  rightData: OpenF1CarData[];
  leftDriver: TraceDriver;
  rightDriver: TraceDriver;
  height?: number | string;
}

interface TraceRow {
  point: number;
  leftSpeed: number | null;
  rightSpeed: number | null;
}

interface AdvantageSegment {
  start: number;
  end: number;
  winner: "left" | "right";
}

function buildTraceRows(leftData: OpenF1CarData[], rightData: OpenF1CarData[]): TraceRow[] {
  const sampleCount = Math.min(leftData.length, rightData.length);

  return Array.from({ length: sampleCount }, (_, index) => ({
    point: index + 1,
    leftSpeed: leftData[index]?.speed ?? null,
    rightSpeed: rightData[index]?.speed ?? null,
  }));
}

function buildAdvantageSegments(rows: TraceRow[]): AdvantageSegment[] {
  const segments = [] as AdvantageSegment[];
  let currentWinner: "left" | "right" | null = null;
  let startPoint = 1;

  rows.forEach((row, index) => {
    const winner =
      row.leftSpeed === null || row.rightSpeed === null
        ? null
        : row.leftSpeed >= row.rightSpeed
          ? "left"
          : "right";

    if (winner === null) return;

    if (currentWinner === null) {
      currentWinner = winner;
      startPoint = row.point;
      return;
    }

    if (winner !== currentWinner) {
      segments.push({
        start: startPoint,
        end: rows[index - 1]?.point ?? row.point,
        winner: currentWinner,
      });
      currentWinner = winner;
      startPoint = row.point;
    }
  });

  if (currentWinner !== null && rows.length > 0) {
    segments.push({
      start: startPoint,
      end: rows[rows.length - 1].point,
      winner: currentWinner,
    });
  }

  return segments;
}

export function TelemetryTrace({
  leftData,
  rightData,
  leftDriver,
  rightDriver,
  height = "clamp(300px, 55vw, 420px)",
}: TelemetryTraceProps) {
  if (leftData.length === 0 || rightData.length === 0) {
    return (
      <div style={{ background: "#141418", border: "1px solid #27272A", padding: 24 }}>
        <p className="text-sm">
          Telemetry trace requires car data for both compared drivers.
        </p>
      </div>
    );
  }

  const rows = buildTraceRows(leftData, rightData);
  const segments = buildAdvantageSegments(rows);
  const speeds = rows
    .flatMap((row) => [row.leftSpeed, row.rightSpeed])
    .filter((value): value is number => value !== null);
  const maxSpeed = Math.max(...speeds, 1);

  return (
    <div style={{ background: "#141418", border: "1px solid #27272A", padding: 16 }}>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {/* No axis titles — they overlap tick values at phone widths; the
              tooltip carries the km/h unit. */}
          <AreaChart data={rows} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid stroke="rgba(161,161,170,0.18)" strokeDasharray="3 3" />
            <XAxis
              dataKey="point"
              tick={{ fill: "#A1A1AA", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "rgba(161,161,170,0.35)" }}
            />
            <YAxis
              domain={[0, Math.ceil((maxSpeed * 1.05) / 10) * 10]}
              tick={{ fill: "#A1A1AA", fontSize: 11 }}
              tickFormatter={(v) => `${v}`}
              width={40}
              tickLine={false}
              axisLine={{ stroke: "rgba(161,161,170,0.35)" }}
            />

            {segments.map((segment, index) => (
              <ReferenceArea
                key={`segment-${segment.start}-${segment.end}-${index}`}
                x1={segment.start}
                x2={segment.end}
                fill={segment.winner === "left" ? leftDriver.color : rightDriver.color}
                fillOpacity={0.08}
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
              formatter={(value) =>
                typeof value === "number" ? `${value} km/h` : (value ?? "—")
              }
            />
            <Legend wrapperStyle={{ color: "#A1A1AA", fontSize: 11 }} />

            <Area
              type="monotone"
              dataKey="leftSpeed"
              name={leftDriver.label}
              stroke={leftDriver.color}
              fill={leftDriver.color}
              fillOpacity={0.14}
              strokeWidth={2}
              connectNulls
            />
            <Area
              type="monotone"
              dataKey="rightSpeed"
              name={rightDriver.label}
              stroke={rightDriver.color}
              fill={rightDriver.color}
              fillOpacity={0.14}
              strokeWidth={2}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
