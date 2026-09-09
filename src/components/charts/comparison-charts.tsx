"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { F1, Mono } from "@/components/shared/broadcast";
import type { PointsPerRound } from "@/lib/analytics/comparison";

/* ── Points Progression Chart ── */

export function PointsProgressionChart({
  dataA,
  dataB,
  colorA,
  colorB,
  nameA,
  nameB,
}: {
  dataA: PointsPerRound[];
  dataB: PointsPerRound[];
  colorA: string;
  colorB: string;
  nameA: string;
  nameB: string;
}) {
  const allRounds = new Set<number>();
  for (const d of dataA) allRounds.add(d.round);
  for (const d of dataB) allRounds.add(d.round);
  const rounds = Array.from(allRounds).sort((a, b) => a - b);

  const mapA = new Map(dataA.map((d) => [d.round, d.cumulativePoints]));
  const mapB = new Map(dataB.map((d) => [d.round, d.cumulativePoints]));

  const chartData = rounds.reduce<{ round: string; [key: string]: string | number }[]>(
    (acc, round) => {
      const prevA = acc.length > 0 ? (acc[acc.length - 1]["a"] as number) : 0;
      const prevB = acc.length > 0 ? (acc[acc.length - 1]["b"] as number) : 0;
      acc.push({
        round: `R${round}`,
        a: mapA.get(round) ?? prevA,
        b: mapB.get(round) ?? prevB,
      });
      return acc;
    },
    []
  );

  if (chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height: 192 }}
      >
        <Mono style={{ fontSize: 11, color: F1.fg3, letterSpacing: "0.18em" }}>
          NO RACE DATA
        </Mono>
      </div>
    );
  }

  return (
    <div style={{ height: 224, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 600, height: 224 }}>
        <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={F1.line} />
          <XAxis
            dataKey="round"
            tick={{ fill: F1.fg3, fontSize: 10, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={{ stroke: F1.line }}
          />
          <YAxis
            tick={{ fill: F1.fg3, fontSize: 10, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={{ stroke: F1.line }}
            width={36}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: F1.bg2,
              border: `1px solid ${F1.line}`,
              borderRadius: 0,
              fontSize: 11,
              fontFamily: "var(--font-mono)",
            }}
            labelStyle={{ color: F1.fg3 }}
          />
          <Legend
            wrapperStyle={{
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.14em",
              paddingTop: 8,
              textTransform: "uppercase",
            }}
          />
          <Line
            isAnimationActive={false}
            type="linear"
            dataKey="a"
            name={nameA}
            stroke={colorA}
            strokeWidth={2}
            dot={{ r: 3, fill: colorA }}
            activeDot={{ r: 5 }}
          />
          <Line
            isAnimationActive={false}
            type="linear"
            dataKey="b"
            name={nameB}
            stroke={colorB}
            strokeWidth={2}
            dot={{ r: 3, fill: colorB }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
