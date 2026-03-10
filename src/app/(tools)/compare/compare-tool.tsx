"use client";

import { useState } from "react";
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

/* ------------------------------------------------------------------ */
/*  Driver Comparison                                                  */
/* ------------------------------------------------------------------ */

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
            {d.firstName} {d.lastName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DriverStatRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border-subtle py-3 last:border-0">
      <span className="text-xs uppercase tracking-widest text-text-muted">
        {label}
      </span>
      <span className="font-mono text-sm text-text-primary">{value}</span>
    </div>
  );
}

function DriverCard({ driver }: { driver: Driver }) {
  const team = TEAMS[driver.teamId];

  return (
    <div
      className="flex-1 rounded-xl border border-border-subtle bg-bg-secondary p-5"
      style={{ borderLeftColor: team.color, borderLeftWidth: 3 }}
    >
      <div className="mb-4">
        <p className="text-2xl font-bold tracking-tight text-text-primary">
          {driver.firstName}{" "}
          <span style={{ color: team.color }}>{driver.lastName}</span>
        </p>
        <p className="text-xs uppercase tracking-widest text-text-muted">
          {team.name}
        </p>
      </div>

      <DriverStatRow label="Number" value={`#${driver.number}`} />
      <DriverStatRow label="Abbreviation" value={driver.abbreviation} />
      <DriverStatRow label="Nationality" value={driver.nationality} />
      <DriverStatRow label="Team" value={team.name} />
      <DriverStatRow label="Date of Birth" value={driver.dateOfBirth} />
    </div>
  );
}

function DriverComparison() {
  const [driverA, setDriverA] = useState(DRIVER_LIST[0].id);
  const [driverB, setDriverB] = useState(DRIVER_LIST[1].id);

  const selectedA = DRIVER_LIST.find((d) => d.id === driverA)!;
  const selectedB = DRIVER_LIST.find((d) => d.id === driverB)!;

  return (
    <div className="space-y-6">
      {/* Selectors */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DriverSelector
          value={driverA}
          onChange={setDriverA}
          exclude={driverB}
        />
        <DriverSelector
          value={driverB}
          onChange={setDriverB}
          exclude={driverA}
        />
      </div>

      {/* Comparison cards */}
      <div className="flex flex-col items-stretch gap-4 md:flex-row">
        <DriverCard driver={selectedA} />

        {/* VS badge */}
        <div className="flex items-center justify-center md:px-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-status-red text-sm font-bold text-white">
            VS
          </span>
        </div>

        <DriverCard driver={selectedB} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Team Comparison                                                    */
/* ------------------------------------------------------------------ */

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

function TeamStatRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border-subtle py-3 last:border-0">
      <span className="text-xs uppercase tracking-widest text-text-muted">
        {label}
      </span>
      <span className="font-mono text-sm text-text-primary">{value}</span>
    </div>
  );
}

function TeamCard({ team }: { team: Team }) {
  const driverNames = team.drivers
    .map((dId) => {
      const d = DRIVER_LIST.find((dr) => dr.id === dId);
      return d ? `${d.firstName} ${d.lastName}` : dId;
    })
    .join(", ");

  return (
    <div
      className="flex-1 rounded-xl border border-border-subtle bg-bg-secondary p-5"
      style={{
        background: `linear-gradient(160deg, ${team.color}30 0%, transparent 70%), var(--color-bg-secondary)`,
      }}
    >
      <div className="mb-4">
        <p className="text-2xl font-bold tracking-tight text-text-primary">
          {team.name}
        </p>
        <p className="text-xs uppercase tracking-widest text-text-muted">
          {team.fullName}
        </p>
      </div>

      <TeamStatRow label="Engine" value={team.engine} />
      <TeamStatRow label="Base" value={team.base} />
      <TeamStatRow label="Principal" value={team.principal} />
      <TeamStatRow label="Drivers" value={driverNames} />
    </div>
  );
}

function TeamComparison() {
  const [teamA, setTeamA] = useState(TEAM_LIST[0].id);
  const [teamB, setTeamB] = useState(TEAM_LIST[1].id);

  const selectedA = TEAM_LIST.find((t) => t.id === teamA)!;
  const selectedB = TEAM_LIST.find((t) => t.id === teamB)!;

  return (
    <div className="space-y-6">
      {/* Selectors */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TeamSelector value={teamA} onChange={setTeamA} exclude={teamB} />
        <TeamSelector value={teamB} onChange={setTeamB} exclude={teamA} />
      </div>

      {/* Comparison cards */}
      <div className="flex flex-col items-stretch gap-4 md:flex-row">
        <TeamCard team={selectedA} />

        {/* VS badge */}
        <div className="flex items-center justify-center md:px-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-status-red text-sm font-bold text-white">
            VS
          </span>
        </div>

        <TeamCard team={selectedB} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main CompareTool                                                   */
/* ------------------------------------------------------------------ */

export function CompareTool() {
  return (
    <Tabs defaultValue="drivers" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="drivers">Drivers</TabsTrigger>
        <TabsTrigger value="teams">Teams</TabsTrigger>
      </TabsList>

      <TabsContent value="drivers">
        <DriverComparison />
      </TabsContent>

      <TabsContent value="teams">
        <TeamComparison />
      </TabsContent>
    </Tabs>
  );
}
