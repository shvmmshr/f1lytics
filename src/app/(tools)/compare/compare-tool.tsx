"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { DRIVER_LIST, TEAM_LIST, TEAMS } from "@/lib/constants";
import type { Team } from "@/lib/constants";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  F1,
  Mono,
  Brackets,
  SectionHeader as BroadcastSectionHeader,
  StatValue,
} from "@/components/shared/broadcast";
import type {
  DriverStat,
  ConstructorStat,
  PointsPerRound,
  RecentFormEntry,
} from "./page";

interface CompareToolProps {
  driverStats: Record<string, DriverStat>;
  constructorStats: Record<string, ConstructorStat>;
}

/* ── Broadcast frame: sharp-edged container with corner brackets ── */
function BroadcastFrame({
  children,
  className,
  padding = 24,
}: {
  children: React.ReactNode;
  className?: string;
  padding?: number;
}) {
  return (
    <div
      className={`relative ${className ?? ""}`}
      style={{
        background: F1.bg2,
        border: `1px solid ${F1.line}`,
        padding,
      }}
    >
      <Brackets color={F1.fg4} size={10} />
      {children}
    </div>
  );
}

/* ── Comparison Bar — mirrored, sharp edges, ★ winner ── */

function CompareBar({
  label,
  valueA,
  valueB,
  colorA,
  colorB,
  format = "number",
  lowerIsBetter = false,
}: {
  label: string;
  valueA: number;
  valueB: number;
  colorA: string;
  colorB: string;
  format?: "number" | "position";
  lowerIsBetter?: boolean;
}) {
  let pctA: number;
  let pctB: number;
  if (lowerIsBetter && valueA > 0 && valueB > 0) {
    const invA = 1 / valueA;
    const invB = 1 / valueB;
    const maxInv = Math.max(invA, invB);
    pctA = (invA / maxInv) * 100;
    pctB = (invB / maxInv) * 100;
  } else {
    const max = Math.max(valueA, valueB, 1);
    pctA = (valueA / max) * 100;
    pctB = (valueB / max) * 100;
  }

  const aWins = lowerIsBetter
    ? valueA > 0 && (valueB === 0 || valueA < valueB)
    : valueA > valueB;
  const bWins = lowerIsBetter
    ? valueB > 0 && (valueA === 0 || valueB < valueA)
    : valueB > valueA;

  const displayA = format === "position" && valueA > 0 ? `P${valueA}` : valueA || "—";
  const displayB = format === "position" && valueB > 0 ? `P${valueB}` : valueB || "—";

  return (
    <div style={{ padding: "14px 0" }}>
      <div className="flex justify-center">
        <Mono
          style={{
            fontSize: 9,
            color: F1.fg3,
            letterSpacing: "0.24em",
            marginBottom: 10,
          }}
        >
          {label}
        </Mono>
      </div>
      <div className="flex items-center" style={{ gap: 12 }}>
        {/* Left value */}
        <div
          className="flex items-center gap-1.5 justify-end"
          style={{ width: 72 }}
        >
          {aWins && (
            <span style={{ color: colorA, fontSize: 11 }} aria-hidden>
              ★
            </span>
          )}
          <Mono
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: aWins ? colorA : F1.fg3,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {displayA}
          </Mono>
        </div>

        {/* Bars (mirrored) */}
        <div className="flex flex-1 gap-px">
          <div
            className="flex flex-1 justify-end"
            style={{ height: 10, background: F1.bg3 }}
          >
            <div
              style={{
                height: "100%",
                width: `${pctA}%`,
                background: colorA,
                opacity: aWins ? 1 : 0.4,
                transition: "width 400ms ease",
              }}
            />
          </div>
          <div
            className="flex flex-1"
            style={{ height: 10, background: F1.bg3 }}
          >
            <div
              style={{
                height: "100%",
                width: `${pctB}%`,
                background: colorB,
                opacity: bWins ? 1 : 0.4,
                transition: "width 400ms ease",
              }}
            />
          </div>
        </div>

        {/* Right value */}
        <div className="flex items-center gap-1.5" style={{ width: 72 }}>
          <Mono
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: bWins ? colorB : F1.fg3,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {displayB}
          </Mono>
          {bWins && (
            <span style={{ color: colorB, fontSize: 11 }} aria-hidden>
              ★
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Recent Form Chips ── */

function RecentFormChips({ form }: { form: RecentFormEntry[] }) {
  if (form.length === 0) {
    return (
      <Mono style={{ fontSize: 11, color: F1.fg3, letterSpacing: "0.14em" }}>
        NO DATA
      </Mono>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {form.map((entry) => {
        let bgColor: string;
        let label: string;

        if (entry.position === null) {
          bgColor = F1.red;
          label = "DNF";
        } else if (entry.position <= 3) {
          bgColor = F1.green;
          label = `P${entry.position}`;
        } else if (entry.position <= 10) {
          bgColor = F1.amber;
          label = `P${entry.position}`;
        } else {
          bgColor = F1.fg4;
          label = `P${entry.position}`;
        }

        return (
          <span
            key={entry.round}
            className="inline-flex items-center justify-center font-mono"
            style={{
              minWidth: 40,
              height: 24,
              padding: "0 6px",
              background: bgColor,
              color: F1.ink,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
            title={entry.raceName}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

/* ── Head-to-Head Donut ── */

function HeadToHeadDonut({
  winsA,
  winsB,
  colorA,
  colorB,
  nameA,
  nameB,
}: {
  winsA: number;
  winsB: number;
  colorA: string;
  colorB: string;
  nameA: string;
  nameB: string;
}) {
  const total = winsA + winsB;
  const data =
    total > 0
      ? [
          { name: nameA, value: winsA, fill: colorA },
          { name: nameB, value: winsB, fill: colorB },
        ]
      : [{ name: "No data", value: 1, fill: F1.bg4 }];

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ height: 168, width: 168 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={72}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              stroke="none"
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <StatValue size={26}>
            {total > 0 ? `${winsA}–${winsB}` : "—"}
          </StatValue>
        </div>
      </div>
      <Mono
        style={{
          fontSize: 9,
          color: F1.fg3,
          letterSpacing: "0.24em",
          marginTop: 8,
        }}
      >
        H2H FINISHES
      </Mono>
    </div>
  );
}

/* ── Points Progression Chart ── */

function PointsProgressionChart({
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
      const prevA = acc.length > 0 ? (acc[acc.length - 1][nameA] as number) : 0;
      const prevB = acc.length > 0 ? (acc[acc.length - 1][nameB] as number) : 0;
      acc.push({
        round: `R${round}`,
        [nameA]: mapA.get(round) ?? prevA,
        [nameB]: mapB.get(round) ?? prevB,
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
      <ResponsiveContainer width="100%" height="100%">
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
            type="monotone"
            dataKey={nameA}
            stroke={colorA}
            strokeWidth={2}
            dot={{ r: 3, fill: colorA }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey={nameB}
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

/* ── Selectors ── */

function DriverSelector({
  value,
  onChange,
  exclude,
  side,
}: {
  value: string;
  onChange: (id: string) => void;
  exclude?: string;
  side: "A" | "B";
}) {
  return (
    <div>
      <Mono
        style={{
          fontSize: 9,
          color: F1.fg3,
          letterSpacing: "0.24em",
          marginBottom: 6,
          display: "block",
        }}
      >
        DRIVER {side}
      </Mono>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className="w-full font-mono"
          style={{
            background: F1.bg2,
            border: `1px solid ${F1.line}`,
            borderRadius: 0,
            color: F1.fg,
            fontSize: 12,
            letterSpacing: "0.06em",
            height: 40,
          }}
        >
          <SelectValue placeholder="Select driver" />
        </SelectTrigger>
        <SelectContent
          style={{
            background: F1.bg2,
            border: `1px solid ${F1.line}`,
            borderRadius: 0,
          }}
        >
          {DRIVER_LIST.map((d) => (
            <SelectItem key={d.id} value={d.id} disabled={d.id === exclude}>
              {d.firstName} {d.lastName}
              {TEAMS[d.teamId] ? ` — ${TEAMS[d.teamId].name}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function TeamSelector({
  value,
  onChange,
  exclude,
  side,
}: {
  value: string;
  onChange: (id: string) => void;
  exclude?: string;
  side: "A" | "B";
}) {
  return (
    <div>
      <Mono
        style={{
          fontSize: 9,
          color: F1.fg3,
          letterSpacing: "0.24em",
          marginBottom: 6,
          display: "block",
        }}
      >
        TEAM {side}
      </Mono>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className="w-full font-mono"
          style={{
            background: F1.bg2,
            border: `1px solid ${F1.line}`,
            borderRadius: 0,
            color: F1.fg,
            fontSize: 12,
            letterSpacing: "0.06em",
            height: 40,
          }}
        >
          <SelectValue placeholder="Select team" />
        </SelectTrigger>
        <SelectContent
          style={{
            background: F1.bg2,
            border: `1px solid ${F1.line}`,
            borderRadius: 0,
          }}
        >
          {TEAM_LIST.map((t) => (
            <SelectItem key={t.id} value={t.id} disabled={t.id === exclude}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ── VS hero ── */

function VsHero({
  side,
  color,
  number,
  imageSrc,
  imageAlt,
  primaryName,
  secondaryName,
}: {
  side: "A" | "B";
  color: string;
  number: string | number;
  imageSrc: string;
  imageAlt: string;
  primaryName: string;
  secondaryName?: string;
}) {
  const isLeft = side === "A";
  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: isLeft
          ? `linear-gradient(110deg, ${color}55 0%, ${color}10 50%, transparent 80%), ${F1.bg}`
          : `linear-gradient(-110deg, ${color}55 0%, ${color}10 50%, transparent 80%), ${F1.bg}`,
        borderTop: `2px solid ${color}`,
        minHeight: 240,
        padding: 24,
      }}
    >
      {/* Giant number watermark */}
      <div
        aria-hidden
        className="font-display absolute pointer-events-none select-none"
        style={{
          [isLeft ? "left" : "right"]: -20,
          top: -40,
          fontSize: 280,
          fontWeight: 700,
          lineHeight: 0.8,
          color,
          opacity: 0.18,
          letterSpacing: "-0.06em",
        }}
      >
        {number}
      </div>

      <div
        className={`relative flex items-end gap-4 h-full ${isLeft ? "" : "flex-row-reverse text-right"}`}
        style={{ minHeight: 200 }}
      >
        <div
          className="relative shrink-0"
          style={{
            width: 100,
            height: 130,
            background: F1.bg2,
            border: `1px solid ${F1.line}`,
            overflow: "hidden",
          }}
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover object-top"
            sizes="100px"
            unoptimized
          />
        </div>
        <div className={`min-w-0 flex-1 ${isLeft ? "" : "flex flex-col items-end"}`}>
          {secondaryName && (
            <div
              className="font-display"
              style={{
                fontSize: 16,
                color: F1.fg2,
                fontWeight: 500,
                letterSpacing: "-0.01em",
                lineHeight: 1,
              }}
            >
              {secondaryName.toUpperCase()}
            </div>
          )}
          <div
            className="font-display"
            style={{
              fontSize: "clamp(36px, 5vw, 56px)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 0.9,
              marginTop: 4,
              color: F1.fg,
            }}
          >
            {primaryName.toUpperCase()}
            <span style={{ color }}>.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Driver Comparison ── */

const emptyDriverStat: DriverStat = {
  position: null,
  points: 0,
  wins: 0,
  podiums: 0,
  races: 0,
  bestFinish: null,
  recentForm: [],
  pointsPerRace: [],
  raceHistory: [],
  qualifyingHistory: [],
  avgQualifying: null,
};

function DriverComparison({ stats }: { stats: Record<string, DriverStat> }) {
  const [driverA, setDriverA] = useState(DRIVER_LIST[0].id);
  const [driverB, setDriverB] = useState(DRIVER_LIST[1].id);

  const selectedA = DRIVER_LIST.find((d) => d.id === driverA)!;
  const selectedB = DRIVER_LIST.find((d) => d.id === driverB)!;
  const teamA = TEAMS[selectedA.teamId];
  const teamB = TEAMS[selectedB.teamId];

  const statA = stats[selectedA.abbreviation] ?? emptyDriverStat;
  const statB = stats[selectedB.abbreviation] ?? emptyDriverStat;

  const h2h = useMemo(() => {
    let winsA = 0;
    let winsB = 0;
    const historyA = new Map(statA.raceHistory.map((r) => [r.round, r.position]));
    for (const entry of statB.raceHistory) {
      const posA = historyA.get(entry.round);
      const posB = entry.position;
      if (posA !== undefined && posA !== null && posB !== null) {
        if (posA < posB) winsA++;
        else if (posB < posA) winsB++;
      }
    }
    return { winsA, winsB };
  }, [statA.raceHistory, statB.raceHistory]);

  return (
    <div className="space-y-6">
      {/* Selectors */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DriverSelector value={driverA} onChange={setDriverA} exclude={driverB} side="A" />
        <DriverSelector value={driverB} onChange={setDriverB} exclude={driverA} side="B" />
      </div>

      {/* VS hero — 1fr / 100px / 1fr */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "minmax(0, 1fr) 100px minmax(0, 1fr)",
          background: F1.line,
          gap: 1,
          border: `1px solid ${F1.line}`,
        }}
      >
        <VsHero
          side="A"
          color={teamA.color}
          number={selectedA.number}
          imageSrc={selectedA.image}
          imageAlt={selectedA.lastName}
          primaryName={selectedA.lastName}
          secondaryName={selectedA.firstName}
        />
        <div
          className="flex items-center justify-center"
          style={{ background: F1.bg }}
        >
          <span
            className="font-display"
            style={{
              fontSize: 90,
              fontWeight: 700,
              letterSpacing: "-0.06em",
              color: F1.red,
              lineHeight: 1,
            }}
          >
            VS
          </span>
        </div>
        <VsHero
          side="B"
          color={teamB.color}
          number={selectedB.number}
          imageSrc={selectedB.image}
          imageAlt={selectedB.lastName}
          primaryName={selectedB.lastName}
          secondaryName={selectedB.firstName}
        />
      </div>

      {/* Season Overview */}
      <BroadcastFrame padding={24}>
        <BroadcastSectionHeader label="SEASON OVERVIEW" />
        <div className="mt-4">
          <CompareBar
            label="CHAMPIONSHIP"
            valueA={statA.position ?? 0}
            valueB={statB.position ?? 0}
            colorA={teamA.color}
            colorB={teamB.color}
            format="position"
            lowerIsBetter
          />
          <CompareBar
            label="POINTS"
            valueA={statA.points}
            valueB={statB.points}
            colorA={teamA.color}
            colorB={teamB.color}
          />
          <CompareBar
            label="WINS"
            valueA={statA.wins}
            valueB={statB.wins}
            colorA={teamA.color}
            colorB={teamB.color}
          />
          <CompareBar
            label="PODIUMS"
            valueA={statA.podiums}
            valueB={statB.podiums}
            colorA={teamA.color}
            colorB={teamB.color}
          />
          <CompareBar
            label="RACES"
            valueA={statA.races}
            valueB={statB.races}
            colorA={teamA.color}
            colorB={teamB.color}
          />
          <CompareBar
            label="BEST FINISH"
            valueA={statA.bestFinish ?? 0}
            valueB={statB.bestFinish ?? 0}
            colorA={teamA.color}
            colorB={teamB.color}
            format="position"
            lowerIsBetter
          />
        </div>
      </BroadcastFrame>

      {/* Form & Trends */}
      <BroadcastFrame padding={24}>
        <BroadcastSectionHeader label="FORM & TRENDS" />

        <div className="mt-5">
          <Mono
            style={{
              fontSize: 9,
              color: F1.fg3,
              letterSpacing: "0.24em",
              display: "block",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            LAST 5 RACES
          </Mono>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center gap-2">
              <Mono
                style={{
                  fontSize: 10,
                  color: F1.fg2,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                }}
              >
                {selectedA.lastName.toUpperCase()}
              </Mono>
              <RecentFormChips form={statA.recentForm} />
            </div>
            <div className="flex flex-col items-center gap-2">
              <Mono
                style={{
                  fontSize: 10,
                  color: F1.fg2,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                }}
              >
                {selectedB.lastName.toUpperCase()}
              </Mono>
              <RecentFormChips form={statB.recentForm} />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Mono
            style={{
              fontSize: 9,
              color: F1.fg3,
              letterSpacing: "0.24em",
              display: "block",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            POINTS PROGRESSION
          </Mono>
          <PointsProgressionChart
            dataA={statA.pointsPerRace}
            dataB={statB.pointsPerRace}
            colorA={teamA.color}
            colorB={teamB.color}
            nameA={selectedA.lastName}
            nameB={selectedB.lastName}
          />
        </div>
      </BroadcastFrame>

      {/* Head-to-Head */}
      <BroadcastFrame padding={24}>
        <BroadcastSectionHeader label="HEAD‑TO‑HEAD" />
        <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2 mt-5">
          <HeadToHeadDonut
            winsA={h2h.winsA}
            winsB={h2h.winsB}
            colorA={teamA.color}
            colorB={teamB.color}
            nameA={selectedA.lastName}
            nameB={selectedB.lastName}
          />
          <div>
            <CompareBar
              label="AVG QUALIFYING POSITION"
              valueA={statA.avgQualifying ?? 0}
              valueB={statB.avgQualifying ?? 0}
              colorA={teamA.color}
              colorB={teamB.color}
              format="position"
              lowerIsBetter
            />
          </div>
        </div>
      </BroadcastFrame>

      {/* Profile cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { driver: selectedA, stat: statA },
          { driver: selectedB, stat: statB },
        ].map(({ driver, stat }) => {
          const team = TEAMS[driver.teamId];
          return (
            <div
              key={driver.id}
              style={{
                background: F1.bg2,
                border: `1px solid ${F1.line}`,
                borderTop: `2px solid ${team.color}`,
              }}
            >
              {[
                { label: "NUMBER", value: `#${driver.number}` },
                { label: "NATIONALITY", value: driver.nationality },
                { label: "DATE OF BIRTH", value: driver.dateOfBirth },
                { label: "TEAM", value: team.name },
                { label: "ENGINE", value: team.engine },
                { label: "POINTS", value: stat.points },
              ].map((row, i, arr) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between"
                  style={{
                    padding: "10px 18px",
                    borderBottom:
                      i < arr.length - 1 ? `1px solid ${F1.line}` : "none",
                  }}
                >
                  <Mono
                    style={{
                      fontSize: 10,
                      color: F1.fg3,
                      letterSpacing: "0.18em",
                    }}
                  >
                    {row.label}
                  </Mono>
                  <Mono
                    style={{
                      fontSize: 12,
                      color: F1.fg,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {row.value}
                  </Mono>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Team Comparison ── */

function getConstructorStat(team: Team, stats: Record<string, ConstructorStat>): ConstructorStat {
  // Stats are now keyed by f1lytics team id (see compare/page.tsx), so this is a
  // direct lookup — no fragile name-substring matching.
  return stats[team.id] ?? { position: null, points: 0, wins: 0, pointsPerRound: [] };
}

function TeamVsHero({
  side,
  team,
}: {
  side: "A" | "B";
  team: Team;
}) {
  const isLeft = side === "A";
  const number = team.id.slice(0, 3).toUpperCase();
  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: isLeft
          ? `linear-gradient(110deg, ${team.color}55 0%, ${team.color}10 50%, transparent 80%), ${F1.bg}`
          : `linear-gradient(-110deg, ${team.color}55 0%, ${team.color}10 50%, transparent 80%), ${F1.bg}`,
        borderTop: `2px solid ${team.color}`,
        minHeight: 200,
        padding: 24,
      }}
    >
      <div
        aria-hidden
        className="font-display absolute pointer-events-none select-none"
        style={{
          [isLeft ? "left" : "right"]: -10,
          bottom: -50,
          fontSize: 200,
          fontWeight: 700,
          lineHeight: 0.8,
          color: team.color,
          opacity: 0.16,
          letterSpacing: "-0.06em",
        }}
      >
        {number}
      </div>
      <div
        className={`relative flex items-end gap-4 h-full ${isLeft ? "" : "flex-row-reverse text-right"}`}
        style={{ minHeight: 152 }}
      >
        <div
          className="shrink-0 flex items-center justify-center"
          style={{
            width: 80,
            height: 80,
            background: F1.bg2,
            border: `1px solid ${F1.line}`,
            padding: 14,
          }}
        >
          <Image
            src={team.logo}
            alt={team.name}
            width={48}
            height={48}
            className="object-contain"
            unoptimized
          />
        </div>
        <div className={`min-w-0 flex-1 ${isLeft ? "" : "flex flex-col items-end"}`}>
          <div
            className="font-display"
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 0.9,
              color: F1.fg,
            }}
          >
            {team.name.toUpperCase()}
            <span style={{ color: team.color }}>.</span>
          </div>
          <Mono
            style={{
              fontSize: 10,
              color: F1.fg3,
              letterSpacing: "0.18em",
              marginTop: 6,
            }}
          >
            {team.engine.toUpperCase()}
          </Mono>
        </div>
      </div>
    </div>
  );
}

function TeamComparison({ stats }: { stats: Record<string, ConstructorStat> }) {
  const [teamA, setTeamA] = useState(TEAM_LIST[0].id);
  const [teamB, setTeamB] = useState(TEAM_LIST[1].id);

  const selectedA = TEAM_LIST.find((t) => t.id === teamA)!;
  const selectedB = TEAM_LIST.find((t) => t.id === teamB)!;

  const statA = getConstructorStat(selectedA, stats);
  const statB = getConstructorStat(selectedB, stats);

  const driversA = selectedA.drivers
    .map((id) => DRIVER_LIST.find((d) => d.id === id)!)
    .filter(Boolean);
  const driversB = selectedB.drivers
    .map((id) => DRIVER_LIST.find((d) => d.id === id)!)
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TeamSelector value={teamA} onChange={setTeamA} exclude={teamB} side="A" />
        <TeamSelector value={teamB} onChange={setTeamB} exclude={teamA} side="B" />
      </div>

      {/* VS hero */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "minmax(0, 1fr) 100px minmax(0, 1fr)",
          background: F1.line,
          gap: 1,
          border: `1px solid ${F1.line}`,
        }}
      >
        <TeamVsHero side="A" team={selectedA} />
        <div
          className="flex items-center justify-center"
          style={{ background: F1.bg }}
        >
          <span
            className="font-display"
            style={{
              fontSize: 90,
              fontWeight: 700,
              letterSpacing: "-0.06em",
              color: F1.red,
              lineHeight: 1,
            }}
          >
            VS
          </span>
        </div>
        <TeamVsHero side="B" team={selectedB} />
      </div>

      {/* Stats */}
      <BroadcastFrame padding={24}>
        <BroadcastSectionHeader label="CONSTRUCTOR STATS" />
        <div className="mt-4">
          <CompareBar
            label="CHAMPIONSHIP"
            valueA={statA.position ?? 0}
            valueB={statB.position ?? 0}
            colorA={selectedA.color}
            colorB={selectedB.color}
            format="position"
            lowerIsBetter
          />
          <CompareBar
            label="POINTS"
            valueA={statA.points}
            valueB={statB.points}
            colorA={selectedA.color}
            colorB={selectedB.color}
          />
          <CompareBar
            label="WINS"
            valueA={statA.wins}
            valueB={statB.wins}
            colorA={selectedA.color}
            colorB={selectedB.color}
          />
        </div>
      </BroadcastFrame>

      {/* Points progression */}
      <BroadcastFrame padding={24}>
        <BroadcastSectionHeader label="POINTS PROGRESSION" />
        <div className="mt-5">
          <PointsProgressionChart
            dataA={statA.pointsPerRound}
            dataB={statB.pointsPerRound}
            colorA={selectedA.color}
            colorB={selectedB.color}
            nameA={selectedA.name}
            nameB={selectedB.name}
          />
        </div>
      </BroadcastFrame>

      {/* Profile cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { team: selectedA, stat: statA, drivers: driversA },
          { team: selectedB, stat: statB, drivers: driversB },
        ].map(({ team, stat, drivers }) => (
          <div
            key={team.id}
            style={{
              background: F1.bg2,
              border: `1px solid ${F1.line}`,
              borderTop: `2px solid ${team.color}`,
            }}
          >
            {[
              { label: "FULL NAME", value: team.fullName },
              { label: "ENGINE", value: team.engine },
              { label: "BASE", value: team.base },
              { label: "PRINCIPAL", value: team.principal },
              { label: "POINTS", value: stat.points },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                className="flex items-center justify-between"
                style={{
                  padding: "10px 18px",
                  borderBottom:
                    i < arr.length - 1 ? `1px solid ${F1.line}` : "none",
                }}
              >
                <Mono
                  style={{
                    fontSize: 10,
                    color: F1.fg3,
                    letterSpacing: "0.18em",
                  }}
                >
                  {row.label}
                </Mono>
                <Mono
                  style={{
                    fontSize: 12,
                    color: F1.fg,
                    textAlign: "right",
                  }}
                >
                  {row.value}
                </Mono>
              </div>
            ))}

            <div
              style={{
                padding: 16,
                borderTop: `1px solid ${F1.line}`,
              }}
            >
              <Mono
                style={{
                  fontSize: 9,
                  color: F1.fg3,
                  letterSpacing: "0.24em",
                  display: "block",
                  marginBottom: 10,
                }}
              >
                LINEUP
              </Mono>
              <div className="flex gap-2">
                {drivers.map((d) => (
                  <div
                    key={d.id}
                    className="flex flex-1 items-center gap-2"
                    style={{
                      background: F1.bg3,
                      border: `1px solid ${F1.line}`,
                      padding: "8px 10px",
                    }}
                  >
                    <div
                      className="relative shrink-0 overflow-hidden"
                      style={{
                        width: 28,
                        height: 28,
                        background: F1.bg,
                        border: `1px solid ${F1.line}`,
                      }}
                    >
                      <Image
                        src={d.image}
                        alt={d.lastName}
                        fill
                        className="object-cover object-top"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0">
                      <Mono
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: F1.fg,
                          letterSpacing: "0.04em",
                          display: "block",
                        }}
                      >
                        {d.lastName.toUpperCase()}
                      </Mono>
                      <Mono
                        style={{
                          fontSize: 9,
                          color: F1.fg3,
                          letterSpacing: "0.14em",
                        }}
                      >
                        #{d.number}
                      </Mono>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main ── */

export function CompareTool({ driverStats, constructorStats }: CompareToolProps) {
  return (
    <Tabs defaultValue="drivers" className="w-full">
      <TabsList
        className="mb-6"
        style={{
          background: F1.bg2,
          border: `1px solid ${F1.line}`,
          borderRadius: 0,
          padding: 4,
        }}
      >
        <TabsTrigger
          value="drivers"
          className="font-mono"
          style={{
            borderRadius: 0,
            fontSize: 11,
            letterSpacing: "0.18em",
            padding: "8px 18px",
          }}
        >
          DRIVERS
        </TabsTrigger>
        <TabsTrigger
          value="teams"
          className="font-mono"
          style={{
            borderRadius: 0,
            fontSize: 11,
            letterSpacing: "0.18em",
            padding: "8px 18px",
          }}
        >
          TEAMS
        </TabsTrigger>
      </TabsList>

      <TabsContent value="drivers">
        <DriverComparison stats={driverStats} />
      </TabsContent>

      <TabsContent value="teams">
        <TeamComparison stats={constructorStats} />
      </TabsContent>
    </Tabs>
  );
}
