"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { DRIVER_LIST, TEAM_LIST, TEAMS } from "@/lib/constants";
import type { Driver, Team } from "@/lib/constants";
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

/* ── Comparison Bar ── */

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

  const displayA = format === "position" && valueA > 0 ? `P${valueA}` : valueA || "-";
  const displayB = format === "position" && valueB > 0 ? `P${valueB}` : valueB || "-";

  return (
    <div className="py-3">
      <p className="mb-2 text-center text-[10px] uppercase tracking-widest text-text-muted">{label}</p>
      <div className="flex items-center gap-3">
        {/* Left value */}
        <span
          className="w-12 text-right font-mono text-lg font-bold"
          style={{ color: aWins ? colorA : "var(--color-text-muted)" }}
        >
          {displayA}
        </span>

        {/* Bars */}
        <div className="flex flex-1 gap-1">
          {/* Left bar (grows right-to-left) */}
          <div className="flex h-6 flex-1 justify-end overflow-hidden rounded-l-md bg-bg-tertiary">
            <div
              className="h-full rounded-l-md transition-all duration-500"
              style={{ width: `${pctA}%`, backgroundColor: colorA, opacity: aWins ? 1 : 0.4 }}
            />
          </div>
          {/* Right bar (grows left-to-right) */}
          <div className="flex h-6 flex-1 overflow-hidden rounded-r-md bg-bg-tertiary">
            <div
              className="h-full rounded-r-md transition-all duration-500"
              style={{ width: `${pctB}%`, backgroundColor: colorB, opacity: bWins ? 1 : 0.4 }}
            />
          </div>
        </div>

        {/* Right value */}
        <span
          className="w-12 font-mono text-lg font-bold"
          style={{ color: bWins ? colorB : "var(--color-text-muted)" }}
        >
          {displayB}
        </span>
      </div>
    </div>
  );
}

/* ── Recent Form Chips ── */

function RecentFormChips({
  form,
}: {
  form: RecentFormEntry[];
}) {
  if (form.length === 0) {
    return <p className="text-xs text-text-muted">No data</p>;
  }

  return (
    <div className="flex items-center gap-1.5">
      {form.map((entry) => {
        let bgColor: string;
        let label: string;

        if (entry.position === null) {
          bgColor = "var(--color-status-red)";
          label = "DNF";
        } else if (entry.position <= 3) {
          bgColor = "var(--color-status-green)";
          label = `P${entry.position}`;
        } else if (entry.position <= 10) {
          bgColor = "var(--color-status-yellow)";
          label = `P${entry.position}`;
        } else {
          bgColor = "var(--color-text-muted)";
          label = `P${entry.position}`;
        }

        return (
          <span
            key={entry.round}
            className="inline-flex h-7 min-w-[36px] items-center justify-center rounded-md px-1.5 font-mono text-[10px] font-bold text-white"
            style={{ backgroundColor: bgColor }}
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
      : [{ name: "No data", value: 1, fill: "#333" }];

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-40 w-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={65}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              stroke="none"
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Centered text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-lg font-bold text-text-primary">
            {total > 0 ? `${winsA}-${winsB}` : "—"}
          </span>
        </div>
      </div>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-text-muted">
        Head-to-Head Finishes
      </p>
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
  // Merge both datasets by round
  const allRounds = new Set<number>();
  for (const d of dataA) allRounds.add(d.round);
  for (const d of dataB) allRounds.add(d.round);
  const rounds = Array.from(allRounds).sort((a, b) => a - b);

  const mapA = new Map(dataA.map((d) => [d.round, d.cumulativePoints]));
  const mapB = new Map(dataB.map((d) => [d.round, d.cumulativePoints]));

  let lastA = 0;
  let lastB = 0;
  const chartData = rounds.map((round) => {
    lastA = mapA.get(round) ?? lastA;
    lastB = mapB.get(round) ?? lastB;
    return {
      round: `R${round}`,
      [nameA]: lastA,
      [nameB]: lastB,
    };
  });

  if (chartData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-text-muted">
        No race data available
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="round"
            tick={{ fill: "var(--color-text-muted)", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
          />
          <YAxis
            tick={{ fill: "var(--color-text-muted)", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            width={35}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "var(--color-text-muted)" }}
          />
          <Legend
            wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }}
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

/* ── Driver Comparison ── */

function DriverSelector({
  value,
  onChange,
  exclude,
}: {
  value: string;
  onChange: (id: string) => void;
  exclude?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full border-border-subtle bg-bg-tertiary text-text-primary">
        <SelectValue placeholder="Select a driver" />
      </SelectTrigger>
      <SelectContent className="border-border-subtle bg-bg-secondary">
        {DRIVER_LIST.map((d) => (
          <SelectItem key={d.id} value={d.id} disabled={d.id === exclude}>
            {d.firstName} {d.lastName} — {TEAMS[d.teamId].name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DriverHeader({ driver }: { driver: Driver }) {
  const team = TEAMS[driver.teamId];
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-2 bg-bg-primary" style={{ borderColor: team.color }}>
        <Image src={driver.image} alt={driver.lastName} fill className="object-cover object-top" unoptimized />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-text-primary">
          {driver.firstName} <span style={{ color: team.color }}>{driver.lastName}</span>
        </p>
        <p className="flex items-center justify-center gap-1.5 text-xs text-text-muted">
          <Image src={team.logo} alt={team.name} width={12} height={12} className="object-contain" unoptimized />
          {team.name} · #{driver.number}
        </p>
      </div>
    </div>
  );
}

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

  // Compute head-to-head: rounds where both finished
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DriverSelector value={driverA} onChange={setDriverA} exclude={driverB} />
        <DriverSelector value={driverB} onChange={setDriverB} exclude={driverA} />
      </div>

      {/* Heads */}
      <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <div className="flex items-start justify-between">
          <DriverHeader driver={selectedA} />
          <div className="flex items-center self-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-status-red text-sm font-bold text-white shadow-lg shadow-status-red/20">
              VS
            </span>
          </div>
          <DriverHeader driver={selectedB} />
        </div>
      </div>

      {/* Season Overview */}
      <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <p className="mb-4 text-[10px] uppercase tracking-widest text-text-muted">Season Overview</p>
        <div className="divide-y divide-border-subtle">
          <CompareBar
            label="Championship Position"
            valueA={statA.position ?? 0}
            valueB={statB.position ?? 0}
            colorA={teamA.color}
            colorB={teamB.color}
            format="position"
            lowerIsBetter
          />
          <CompareBar
            label="Points"
            valueA={statA.points}
            valueB={statB.points}
            colorA={teamA.color}
            colorB={teamB.color}
          />
          <CompareBar
            label="Wins"
            valueA={statA.wins}
            valueB={statB.wins}
            colorA={teamA.color}
            colorB={teamB.color}
          />
          <CompareBar
            label="Podiums"
            valueA={statA.podiums}
            valueB={statB.podiums}
            colorA={teamA.color}
            colorB={teamB.color}
          />
          <CompareBar
            label="Races"
            valueA={statA.races}
            valueB={statB.races}
            colorA={teamA.color}
            colorB={teamB.color}
          />
          <CompareBar
            label="Best Finish"
            valueA={statA.bestFinish ?? 0}
            valueB={statB.bestFinish ?? 0}
            colorA={teamA.color}
            colorB={teamB.color}
            format="position"
            lowerIsBetter
          />
        </div>
      </div>

      {/* Form & Trends */}
      <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <p className="mb-4 text-[10px] uppercase tracking-widest text-text-muted">Form & Trends</p>

        {/* Recent Form */}
        <div className="mb-6">
          <p className="mb-3 text-center text-[10px] uppercase tracking-widest text-text-muted">Last 5 Races</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs font-bold text-text-secondary">{selectedA.lastName}</p>
              <RecentFormChips form={statA.recentForm} />
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs font-bold text-text-secondary">{selectedB.lastName}</p>
              <RecentFormChips form={statB.recentForm} />
            </div>
          </div>
        </div>

        {/* Points Progression */}
        <div>
          <p className="mb-3 text-center text-[10px] uppercase tracking-widest text-text-muted">Points Progression</p>
          <PointsProgressionChart
            dataA={statA.pointsPerRace}
            dataB={statB.pointsPerRace}
            colorA={teamA.color}
            colorB={teamB.color}
            nameA={selectedA.lastName}
            nameB={selectedB.lastName}
          />
        </div>
      </div>

      {/* Head-to-Head */}
      <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <p className="mb-4 text-[10px] uppercase tracking-widest text-text-muted">Head-to-Head</p>
        <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2">
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
              label="Avg. Qualifying Position"
              valueA={statA.avgQualifying ?? 0}
              valueB={statB.avgQualifying ?? 0}
              colorA={teamA.color}
              colorB={teamB.color}
              format="position"
              lowerIsBetter
            />
          </div>
        </div>
      </div>

      {/* Side-by-side profiles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { driver: selectedA, stat: statA },
          { driver: selectedB, stat: statB },
        ].map(({ driver, stat }) => {
          const team = TEAMS[driver.teamId];
          return (
            <div key={driver.id} className="rounded-xl border border-border-subtle bg-bg-secondary" style={{ borderTopColor: team.color, borderTopWidth: 3 }}>
              <div className="space-y-0 divide-y divide-border-subtle">
                {[
                  { label: "Number", value: `#${driver.number}` },
                  { label: "Nationality", value: driver.nationality },
                  { label: "Date of Birth", value: driver.dateOfBirth },
                  { label: "Team", value: team.name },
                  { label: "Engine", value: team.engine },
                  { label: "Points", value: stat.points },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between px-5 py-2.5">
                    <span className="text-xs text-text-muted">{row.label}</span>
                    <span className="font-mono text-sm text-text-primary">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Team Comparison ── */

function TeamSelector({
  value,
  onChange,
  exclude,
}: {
  value: string;
  onChange: (id: string) => void;
  exclude?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full border-border-subtle bg-bg-tertiary text-text-primary">
        <SelectValue placeholder="Select a team" />
      </SelectTrigger>
      <SelectContent className="border-border-subtle bg-bg-secondary">
        {TEAM_LIST.map((t) => (
          <SelectItem key={t.id} value={t.id} disabled={t.id === exclude}>
            {t.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TeamHeader({ team }: { team: Team }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 bg-bg-primary p-3" style={{ borderColor: team.color }}>
        <Image src={team.logo} alt={team.name} width={40} height={40} className="object-contain" unoptimized />
      </div>
      <div className="text-center">
        <p className="font-bold text-text-primary">{team.name}</p>
        <p className="text-xs text-text-muted">{team.engine}</p>
      </div>
    </div>
  );
}

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, "");
}

function getConstructorStat(team: Team, stats: Record<string, ConstructorStat>): ConstructorStat {
  for (const [key, stat] of Object.entries(stats)) {
    if (
      key.includes(normalize(team.name)) ||
      normalize(team.name).includes(key) ||
      (team.id === "red_bull" && key.includes("redbull")) ||
      (team.id === "racing_bulls" && (key.includes("racingbulls") || key === "rb")) ||
      (team.id === "audi" && key.includes("sauber"))
    ) {
      return stat;
    }
  }
  return { position: null, points: 0, wins: 0, pointsPerRound: [] };
}

function TeamComparison({ stats }: { stats: Record<string, ConstructorStat> }) {
  const [teamA, setTeamA] = useState(TEAM_LIST[0].id);
  const [teamB, setTeamB] = useState(TEAM_LIST[1].id);

  const selectedA = TEAM_LIST.find((t) => t.id === teamA)!;
  const selectedB = TEAM_LIST.find((t) => t.id === teamB)!;

  const statA = getConstructorStat(selectedA, stats);
  const statB = getConstructorStat(selectedB, stats);

  const driversA = selectedA.drivers.map((id) => DRIVER_LIST.find((d) => d.id === id)!).filter(Boolean);
  const driversB = selectedB.drivers.map((id) => DRIVER_LIST.find((d) => d.id === id)!).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TeamSelector value={teamA} onChange={setTeamA} exclude={teamB} />
        <TeamSelector value={teamB} onChange={setTeamB} exclude={teamA} />
      </div>

      <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <div className="flex items-start justify-between">
          <TeamHeader team={selectedA} />
          <div className="flex items-center self-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-status-red text-sm font-bold text-white shadow-lg shadow-status-red/20">
              VS
            </span>
          </div>
          <TeamHeader team={selectedB} />
        </div>

        <div className="mt-6 divide-y divide-border-subtle">
          <CompareBar
            label="Championship Position"
            valueA={statA.position ?? 0}
            valueB={statB.position ?? 0}
            colorA={selectedA.color}
            colorB={selectedB.color}
            format="position"
            lowerIsBetter
          />
          <CompareBar
            label="Points"
            valueA={statA.points}
            valueB={statB.points}
            colorA={selectedA.color}
            colorB={selectedB.color}
          />
          <CompareBar
            label="Wins"
            valueA={statA.wins}
            valueB={statB.wins}
            colorA={selectedA.color}
            colorB={selectedB.color}
          />
        </div>
      </div>

      {/* Constructor Points Progression */}
      <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <p className="mb-4 text-[10px] uppercase tracking-widest text-text-muted">Points Progression</p>
        <PointsProgressionChart
          dataA={statA.pointsPerRound}
          dataB={statB.pointsPerRound}
          colorA={selectedA.color}
          colorB={selectedB.color}
          nameA={selectedA.name}
          nameB={selectedB.name}
        />
      </div>

      {/* Side-by-side team cards with drivers */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { team: selectedA, stat: statA, drivers: driversA },
          { team: selectedB, stat: statB, drivers: driversB },
        ].map(({ team, stat, drivers }) => (
          <div key={team.id} className="rounded-xl border border-border-subtle bg-bg-secondary" style={{ borderTopColor: team.color, borderTopWidth: 3 }}>
            {/* Team details */}
            <div className="divide-y divide-border-subtle">
              {[
                { label: "Full Name", value: team.fullName },
                { label: "Engine", value: team.engine },
                { label: "Base", value: team.base },
                { label: "Principal", value: team.principal },
                { label: "Points", value: stat.points },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between px-5 py-2.5">
                  <span className="text-xs text-text-muted">{row.label}</span>
                  <span className="text-right text-xs font-medium text-text-primary">{row.value}</span>
                </div>
              ))}
            </div>

            {/* Drivers */}
            <div className="border-t border-border-subtle p-4">
              <p className="mb-3 text-[10px] uppercase tracking-widest text-text-muted">Drivers</p>
              <div className="flex gap-3">
                {drivers.map((d) => (
                  <div key={d.id} className="flex flex-1 items-center gap-2 rounded-lg bg-bg-tertiary p-2.5">
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-bg-primary">
                      <Image src={d.image} alt={d.lastName} fill className="object-cover object-top" unoptimized />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-text-primary">{d.lastName}</p>
                      <p className="text-[10px] text-text-muted">#{d.number}</p>
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
      <TabsList className="mb-6">
        <TabsTrigger value="drivers">Drivers</TabsTrigger>
        <TabsTrigger value="teams">Teams</TabsTrigger>
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
