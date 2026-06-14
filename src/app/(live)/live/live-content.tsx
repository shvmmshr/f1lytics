"use client";

import { useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { getNextEvent } from "@/lib/constants/circuits";
import { CountdownTimer } from "@/components/shared/countdown-timer";
import { ReplayBanner } from "@/components/live/replay-banner";
import { TEAMS } from "@/lib/constants";
import { useLiveSession, type LapStats } from "@/hooks/use-live-session";
import { useLiveStream } from "@/hooks/use-live-stream";
import type {
  OpenF1Position,
  OpenF1Interval,
  OpenF1Driver,
  OpenF1Stint,
  OpenF1RaceControl,
  OpenF1TeamRadio,
  OpenF1CarData,
} from "@/lib/api/types";
import {
  F1,
  Mono,
  LiveDot,
  Brackets,
  Grid as BroadcastGrid,
  StatValue,
  PosPill,
  Tire,
  SectorBar,
  SectionHeader as BroadcastSectionHeader,
} from "@/components/shared/broadcast";

// ─── Helpers ───────────────────────────────────────────────────────────

function formatGap(gap: number | string | null | undefined): string {
  if (gap === null || gap === undefined) return "—";
  // OpenF1 overloads gap_to_leader with a string like "+1 LAP" for lapped
  // cars — show it verbatim rather than calling .toFixed() on a string.
  if (typeof gap === "string") {
    const trimmed = gap.trim();
    return trimmed === "" ? "—" : trimmed;
  }
  return `+${gap.toFixed(3)}`;
}

function formatLapTime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "—";
  const min = Math.floor(seconds / 60);
  const sec = (seconds - min * 60).toFixed(3);
  return `${min}:${sec.padStart(6, "0")}`;
}

function formatTimeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "JUST NOW";
  if (seconds < 60) return `${seconds}s AGO`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m AGO`;
}

function teamColorFromDriverTeam(teamName: string): string {
  const normalized = teamName.toLowerCase().replace(/\s+/g, "_");
  if (TEAMS[normalized]) return TEAMS[normalized].color;
  for (const [key, team] of Object.entries(TEAMS)) {
    if (
      normalized.includes(key) ||
      key.includes(normalized) ||
      team.name.toLowerCase().includes(teamName.toLowerCase()) ||
      teamName.toLowerCase().includes(team.name.toLowerCase())
    ) {
      return team.color;
    }
  }
  return F1.fg4;
}

function compoundShort(c: string | null): "S" | "M" | "H" | "I" | "W" | "?" {
  if (!c) return "?"; // OpenF1 sometimes reports stints with a null compound
  const u = c.toUpperCase();
  if (u.startsWith("S")) return "S";
  if (u.startsWith("M")) return "M";
  if (u.startsWith("H")) return "H";
  if (u.startsWith("I")) return "I";
  return "W";
}

// ─── Top Broadcast Bar ─────────────────────────────────────────────────

function TopBroadcastBar({
  isLive,
  sessionName,
  sessionType,
  countryName,
  circuit,
  currentLap,
  airTemp,
  trackTemp,
}: {
  isLive: boolean;
  sessionName: string;
  sessionType: string;
  countryName: string;
  circuit: string;
  currentLap: number | null;
  airTemp: number | null;
  trackTemp: number | null;
}) {
  return (
    // Mobile: two stacked rows (pill+title, then the 4 tiles). At lg the two
    // wrappers below become `contents`, promoting their children into this grid
    // so the desktop single-row 6-column layout is unchanged.
    <div
      className="flex flex-col lg:grid lg:items-stretch"
      style={{
        gridTemplateColumns:
          "auto minmax(0, 1fr) repeat(4, minmax(0, 110px))",
        background: F1.bg,
        borderBottom: `1px solid ${F1.line}`,
      }}
    >
      <div className="flex items-stretch lg:contents">
        {/* LIVE pill */}
        <div
          className="flex items-center gap-2"
          style={{
            padding: "0 18px",
            background: isLive ? F1.red : F1.bg2,
            color: isLive ? F1.ink : F1.fg2,
            clipPath: "polygon(0 0, 100% 0, 92% 100%, 0 100%)",
            minHeight: 64,
          }}
        >
          <LiveDot color={isLive ? F1.ink : F1.fg3} size={8} />
          <Mono
            style={{
              fontSize: 12,
              letterSpacing: "0.18em",
              fontWeight: 700,
            }}
          >
            {isLive ? "LIVE" : "FINISHED"}
          </Mono>
        </div>

        {/* Session title */}
        <div
          className="flex flex-1 flex-col justify-center min-w-0"
          style={{
            padding: "8px 24px",
            borderRight: `1px solid ${F1.line}`,
          }}
        >
          <Mono style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.24em" }}>
            {sessionType.toUpperCase()} · {countryName.toUpperCase()}
          </Mono>
          <span
            className="font-display truncate"
            style={{
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              marginTop: 2,
            }}
          >
            {sessionName.toUpperCase()}
          </span>
        </div>
      </div>

      <div
        className="grid grid-cols-2 sm:grid-cols-4 lg:contents"
        style={{ borderTop: `1px solid ${F1.line}` }}
      >
        {/* Lap */}
        <TopTile label="LAP" value={currentLap !== null ? `${currentLap}` : "—"} />
        {/* Circuit */}
        <TopTile label="CIRCUIT" value={circuit.toUpperCase()} small />
        {/* Air */}
        <TopTile
          label="AIR"
          value={airTemp !== null ? `${airTemp.toFixed(0)}°C` : "—°C"}
        />
        {/* Track */}
        <TopTile
          label="TRACK"
          value={trackTemp !== null ? `${trackTemp.toFixed(0)}°C` : "—°C"}
        />
      </div>
    </div>
  );
}

function TopTile({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div
      style={{
        padding: "10px 16px",
        borderRight: `1px solid ${F1.line}`,
      }}
    >
      <Mono style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.24em" }}>
        {label}
      </Mono>
      <div
        className="font-display"
        style={{
          fontSize: small ? 16 : 24,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          marginTop: 2,
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          color: F1.fg,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ─── Timing Tower ──────────────────────────────────────────────────────

interface TimingTowerProps {
  positions: OpenF1Position[];
  intervals: OpenF1Interval[];
  drivers: OpenF1Driver[];
  stints: OpenF1Stint[];
  lapStats: LapStats[];
  focusedDriverNumber: number | null;
  onSelect: (n: number) => void;
}

function TimingTower({
  positions,
  intervals,
  drivers,
  stints,
  lapStats,
  focusedDriverNumber,
  onSelect,
}: TimingTowerProps) {
  const driverMap = useMemo(() => {
    const map = new Map<number, OpenF1Driver>();
    for (const d of drivers) map.set(d.driver_number, d);
    return map;
  }, [drivers]);

  const intervalMap = useMemo(() => {
    const map = new Map<number, OpenF1Interval>();
    for (const i of intervals) map.set(i.driver_number, i);
    return map;
  }, [intervals]);

  const stintMap = useMemo(() => {
    const map = new Map<number, OpenF1Stint>();
    for (const s of stints) map.set(s.driver_number, s);
    return map;
  }, [stints]);

  const lapMap = useMemo(() => {
    const map = new Map<number, LapStats>();
    for (const l of lapStats) map.set(l.driver_number, l);
    return map;
  }, [lapStats]);

  const sortedPositions = useMemo(
    () => [...positions].sort((a, b) => a.position - b.position),
    [positions]
  );

  // Find purple sectors (best of session)
  const bestSectors = useMemo<[number | null, number | null, number | null]>(() => {
    const best: [number | null, number | null, number | null] = [null, null, null];
    for (const l of lapStats) {
      for (let i = 0; i < 3; i++) {
        const s = l.sectors[i];
        if (s !== null && (best[i] === null || s < best[i]!)) best[i] = s;
      }
    }
    return best;
  }, [lapStats]);

  if (sortedPositions.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <Mono style={{ fontSize: 12, color: F1.fg3, letterSpacing: "0.18em" }}>
          WAITING FOR POSITION DATA…
        </Mono>
      </div>
    );
  }

  return (
    // Horizontal scroll on narrow screens — the column set needs ~700px.
    <div className="overflow-x-auto">
    <div style={{ minWidth: 700 }}>
      {/* Header row */}
      <div
        className="grid items-center"
        style={{
          gridTemplateColumns:
            "44px 6px 56px minmax(0, 1fr) 90px 90px 76px 76px 56px 96px",
          gap: 8,
          padding: "10px 16px",
          background: F1.bg2,
          borderBottom: `1px solid ${F1.line}`,
        }}
      >
        {["POS", "", "CODE", "DRIVER · TEAM", "LAST", "BEST", "GAP", "INT", "TYRE", "SECTORS"].map(
          (h, i) => (
            <Mono
              key={i}
              style={{
                fontSize: 9,
                color: F1.fg3,
                letterSpacing: "0.18em",
                textAlign: i >= 4 && i <= 7 ? "right" : "left",
              }}
            >
              {h}
            </Mono>
          )
        )}
      </div>

      {sortedPositions.map((pos, i) => {
        const d = driverMap.get(pos.driver_number);
        const interval = intervalMap.get(pos.driver_number);
        const stint = stintMap.get(pos.driver_number);
        const lap = lapMap.get(pos.driver_number);
        const focused = pos.driver_number === focusedDriverNumber;
        const teamColor = d ? teamColorFromDriverTeam(d.team_name) : F1.fg4;
        const code = d?.name_acronym ?? `#${pos.driver_number}`;
        const last = d?.full_name?.split(" ").pop() ?? "";

        return (
          <button
            key={pos.driver_number}
            type="button"
            onClick={() => onSelect(pos.driver_number)}
            className="grid items-center w-full text-left"
            style={{
              gridTemplateColumns:
                "44px 6px 56px minmax(0, 1fr) 90px 90px 76px 76px 56px 96px",
              gap: 8,
              padding: "10px 16px",
              background: focused
                ? `${teamColor}14`
                : i % 2 === 0
                  ? F1.bg
                  : F1.bg2,
              borderBottom: `1px solid ${F1.line}`,
              borderLeft: focused ? `3px solid ${teamColor}` : "3px solid transparent",
              cursor: "pointer",
            }}
          >
            <PosPill pos={pos.position} size={pos.position <= 3 ? "md" : "sm"} />
            <span
              style={{
                width: 4,
                height: 28,
                background: teamColor,
                alignSelf: "center",
              }}
            />
            <Mono
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: F1.fg,
              }}
            >
              {code}
            </Mono>
            <div className="flex flex-col min-w-0">
              <span
                className="font-display truncate"
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.05,
                  color: F1.fg,
                }}
              >
                {last.toUpperCase()}
              </span>
              <Mono
                style={{
                  fontSize: 9,
                  color: F1.fg3,
                  letterSpacing: "0.14em",
                  marginTop: 2,
                }}
              >
                {(d?.team_name ?? "—").toUpperCase()}
              </Mono>
            </div>
            <Mono
              style={{
                fontSize: 12,
                color: F1.fg,
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatLapTime(lap?.last)}
            </Mono>
            <Mono
              style={{
                fontSize: 12,
                color: F1.cyan,
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatLapTime(lap?.best)}
            </Mono>
            <Mono
              style={{
                fontSize: 12,
                color: F1.fg2,
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {pos.position === 1 ? "LEADER" : formatGap(interval?.gap_to_leader)}
            </Mono>
            <Mono
              style={{
                fontSize: 12,
                color: F1.fg2,
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {pos.position === 1 ? "—" : formatGap(interval?.interval)}
            </Mono>
            {stint ? (
              <div className="flex items-center gap-1.5">
                <Tire compound={compoundShort(stint.compound)} />
                <Mono style={{ fontSize: 10, color: F1.fg3 }}>
                  {(() => {
                    // Laps run on the CURRENT tyre set, not the absolute race lap.
                    if (lap?.lapNumber == null) return "—";
                    const lapsOnTyre =
                      lap.lapNumber - stint.lap_start + 1 + stint.tyre_age_at_start;
                    return `L${Math.max(0, lapsOnTyre)}`;
                  })()}
                </Mono>
              </div>
            ) : (
              <Mono style={{ fontSize: 11, color: F1.fg3 }}>—</Mono>
            )}
            <div className="flex items-center gap-[3px]">
              {[0, 1, 2].map((idx) => {
                const sec = lap?.sectors[idx] ?? null;
                const best = bestSectors[idx];
                let color: "p" | "g" | "y" | "n" = "n";
                if (sec !== null) {
                  if (best !== null && sec === best) color = "p";
                  else if (sec < (best ?? Infinity) * 1.005) color = "g";
                  else color = "y";
                }
                return <SectorBar key={idx} color={color} />;
              })}
            </div>
          </button>
        );
      })}
    </div>
    </div>
  );
}

// ─── Telemetry block ───────────────────────────────────────────────────

function TelemetryBlock({
  carData,
  driver,
  teamColor,
}: {
  carData: OpenF1CarData | null;
  driver: OpenF1Driver | null;
  teamColor: string;
}) {
  if (!driver) {
    return (
      <div style={{ padding: 24 }}>
        <Mono style={{ fontSize: 11, color: F1.fg3, letterSpacing: "0.18em" }}>
          SELECT A DRIVER FROM THE TIMING TOWER →
        </Mono>
      </div>
    );
  }

  const speed = carData?.speed ?? 0;
  const gear = carData?.gear ?? 0;
  const rpm = carData?.rpm ?? 0;
  const throttle = carData?.throttle ?? 0;
  const brake = carData?.brake ?? 0;
  const drs = carData?.drs ?? 0;
  const drsActive = drs >= 10 && drs !== 0 && drs !== 8;

  return (
    <div style={{ padding: 24 }}>
      {/* Driver header */}
      <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
        <span style={{ width: 4, height: 36, background: teamColor }} />
        <div>
          <Mono style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.18em" }}>
            FOCUS · #{driver.driver_number} · {driver.name_acronym}
          </Mono>
          <div
            className="font-display"
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1,
              marginTop: 2,
            }}
          >
            {driver.full_name.split(" ").pop()?.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Speed / Gear / RPM */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "1fr 80px 1fr",
          gap: 1,
          background: F1.line,
          border: `1px solid ${F1.line}`,
        }}
      >
        <div style={{ background: F1.bg, padding: 14 }}>
          <Mono style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.24em" }}>
            SPEED
          </Mono>
          <StatValue size={36} color={teamColor} style={{ display: "block", marginTop: 4 }}>
            {speed}
          </StatValue>
          <Mono style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.18em" }}>
            KM/H
          </Mono>
        </div>
        <div style={{ background: F1.bg, padding: 14, textAlign: "center" }}>
          <Mono style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.24em" }}>
            GEAR
          </Mono>
          <StatValue size={36} style={{ display: "block", marginTop: 4 }}>
            {gear || "N"}
          </StatValue>
        </div>
        <div style={{ background: F1.bg, padding: 14, textAlign: "right" }}>
          <Mono style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.24em" }}>
            RPM
          </Mono>
          <StatValue size={36} style={{ display: "block", marginTop: 4 }}>
            {rpm.toLocaleString("en-US")}
          </StatValue>
          <Mono style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.18em" }}>
            REV/MIN
          </Mono>
        </div>
      </div>

      {/* Throttle / Brake bars */}
      <div style={{ marginTop: 16 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
          <Mono style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.18em" }}>
            THROTTLE
          </Mono>
          <Mono
            style={{
              fontSize: 10,
              color: F1.green,
              letterSpacing: "0.04em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {throttle}%
          </Mono>
        </div>
        <div style={{ height: 8, background: F1.bg3 }}>
          <div
            style={{
              height: "100%",
              width: `${throttle}%`,
              background: F1.green,
              transition: "width 200ms",
            }}
          />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
          <Mono style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.18em" }}>
            BRAKE
          </Mono>
          <Mono
            style={{
              fontSize: 10,
              color: F1.red,
              letterSpacing: "0.04em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {brake}%
          </Mono>
        </div>
        <div style={{ height: 8, background: F1.bg3 }}>
          <div
            style={{
              height: "100%",
              width: `${brake}%`,
              background: F1.red,
              transition: "width 200ms",
            }}
          />
        </div>
      </div>

      {/* DRS */}
      <div
        className="flex items-center justify-between"
        style={{
          marginTop: 16,
          padding: "10px 14px",
          background: drsActive ? `${F1.green}22` : F1.bg2,
          border: `1px solid ${drsActive ? F1.green : F1.line}`,
        }}
      >
        <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.24em" }}>
          DRS
        </Mono>
        <Mono
          style={{
            fontSize: 13,
            color: drsActive ? F1.green : F1.fg3,
            letterSpacing: "0.18em",
            fontWeight: 700,
          }}
        >
          {drsActive ? "ACTIVE" : "OFF"}
        </Mono>
      </div>
    </div>
  );
}

// ─── Race control + Team radio feed ────────────────────────────────────

function FlagPill({ flag }: { flag: string | null }) {
  if (!flag) return null;
  const f = flag.toUpperCase();
  const map: Record<string, { bg: string; fg: string }> = {
    GREEN: { bg: F1.green, fg: F1.ink },
    YELLOW: { bg: F1.yellow, fg: F1.ink },
    "DOUBLE YELLOW": { bg: F1.yellow, fg: F1.ink },
    RED: { bg: F1.red, fg: F1.fg },
    BLUE: { bg: "#3B82F6", fg: F1.fg },
    CHEQUERED: { bg: F1.fg, fg: F1.ink },
    BLACK: { bg: F1.ink, fg: F1.fg },
  };
  const style = map[f] ?? { bg: F1.bg3, fg: F1.fg2 };
  return (
    <span
      className="inline-flex items-center"
      style={{
        background: style.bg,
        color: style.fg,
        padding: "1px 6px",
        fontFamily: "var(--font-mono)",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.14em",
      }}
    >
      {f}
    </span>
  );
}

function RaceControlFeed({
  raceControl,
  teamRadio,
  drivers,
}: {
  raceControl: OpenF1RaceControl[];
  teamRadio: OpenF1TeamRadio[];
  drivers: OpenF1Driver[];
}) {
  const driverMap = useMemo(() => {
    const map = new Map<number, OpenF1Driver>();
    for (const d of drivers) map.set(d.driver_number, d);
    return map;
  }, [drivers]);

  return (
    <div style={{ padding: 24 }}>
      <BroadcastSectionHeader label="RACE CONTROL" />
      <div className="mt-4 space-y-3">
        {raceControl.length === 0 && (
          <Mono style={{ fontSize: 11, color: F1.fg3, letterSpacing: "0.18em" }}>
            NO MESSAGES
          </Mono>
        )}
        {raceControl.map((m) => {
          const time = new Date(m.date).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZone: "UTC",
          });
          return (
            <div
              key={`${m.date}-${m.message}`}
              style={{
                padding: "8px 12px",
                background: F1.bg2,
                borderLeft: `2px solid ${m.flag ? F1.amber : F1.line}`,
              }}
            >
              <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                <Mono style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.14em" }}>
                  {time}
                </Mono>
                {m.flag && <FlagPill flag={m.flag} />}
                <Mono style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.14em" }}>
                  {m.category.toUpperCase()}
                </Mono>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: F1.fg,
                  letterSpacing: "0.01em",
                  lineHeight: 1.35,
                }}
              >
                {m.message}
              </div>
            </div>
          );
        })}
      </div>

      {/* Team radio */}
      <div style={{ marginTop: 28 }}>
        <BroadcastSectionHeader label="TEAM RADIO" />
        <div className="mt-4 space-y-2">
          {teamRadio.length === 0 && (
            <Mono style={{ fontSize: 11, color: F1.fg3, letterSpacing: "0.18em" }}>
              NO RADIO TRANSMISSIONS
            </Mono>
          )}
          {teamRadio.map((r) => {
            const d = driverMap.get(r.driver_number);
            const time = new Date(r.date).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              timeZone: "UTC",
            });
            const teamColor = d ? teamColorFromDriverTeam(d.team_name) : F1.fg4;
            return (
              <a
                key={`${r.date}-${r.driver_number}`}
                href={r.recording_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 group"
                style={{
                  padding: "8px 12px",
                  background: F1.bg2,
                  borderLeft: `2px solid ${teamColor}`,
                  textDecoration: "none",
                }}
              >
                <Mono style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.14em" }}>
                  {time}
                </Mono>
                <Mono
                  style={{
                    fontSize: 11,
                    color: F1.fg,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                  }}
                >
                  {d?.name_acronym ?? `#${r.driver_number}`}
                </Mono>
                <span style={{ color: F1.fg3, fontSize: 12, marginLeft: "auto" }}>
                  ▶
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Idle / no-session view ────────────────────────────────────────────

function IdleView({ lastRaceSessionKey }: { lastRaceSessionKey: number | null }) {
  const event = useMemo(() => getNextEvent(), []);
  const nextRace = event?.circuit;
  return (
    <div className="relative" style={{ padding: "clamp(32px, 8vw, 60px) clamp(16px, 4vw, 32px)" }}>
      <div
        className="relative max-w-3xl mx-auto"
        style={{
          background: F1.bg2,
          border: `1px solid ${F1.line}`,
          padding: "clamp(28px, 6vw, 48px) clamp(16px, 4vw, 32px)",
          textAlign: "center",
        }}
      >
        <Brackets color={F1.red} size={14} weight={2} />
        <div className="flex items-center justify-center gap-3" style={{ marginBottom: 18 }}>
          <LiveDot size={10} />
          <Mono
            style={{
              fontSize: 11,
              color: F1.red,
              letterSpacing: "0.24em",
              fontWeight: 700,
            }}
          >
            STANDBY · NO ACTIVE SESSION
          </Mono>
        </div>
        <h2
          className="font-display"
          style={{
            fontSize: "clamp(40px, 6vw, 72px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 0.9,
            margin: 0,
          }}
        >
          OFF-AIR<span style={{ color: F1.red }}>.</span>
        </h2>
        {nextRace && (
          <div style={{ marginTop: 20 }}>
            <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.24em" }}>
              NEXT · {nextRace.country.toUpperCase()} · ROUND{" "}
              {String(nextRace.round).padStart(2, "0")}
            </Mono>
            <div
              className="font-display"
              style={{
                fontSize: 28,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                marginTop: 6,
              }}
            >
              {nextRace.name.toUpperCase()}
            </div>
            <div className="flex justify-center" style={{ marginTop: 24 }}>
              <CountdownTimer
                targetDate={new Date(`${event!.eventDate}T${event!.eventTime}`)}
                label={`${event!.eventType === "sprint" ? "SPRINT" : "RACE"} COVERAGE BEGINS IN`}
              />
            </div>
          </div>
        )}

        {lastRaceSessionKey && (
          <div style={{ marginTop: 32, borderTop: `1px solid ${F1.line}`, paddingTop: 24 }}>
            <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.18em" }}>
              WHILE YOU WAIT — REVIEW THE TIMING SCREEN FROM THE LAST RACE
            </Mono>
            <div className="flex justify-center" style={{ marginTop: 14 }}>
              <Link
                href={`/live?replay=${lastRaceSessionKey}`}
                className="inline-flex items-center gap-2"
                style={{
                  background: F1.red,
                  color: F1.ink,
                  padding: "11px 22px",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textDecoration: "none",
                }}
              >
                ▶ REVIEW LAST RACE
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Loading / connecting view (shown until the first state resolves) ────

function LoadingView({ replay }: { replay: boolean }) {
  return (
    <div className="relative" style={{ padding: "clamp(32px, 8vw, 60px) clamp(16px, 4vw, 32px)" }}>
      <div
        className="relative max-w-3xl mx-auto"
        style={{
          background: F1.bg2,
          border: `1px solid ${F1.line}`,
          padding: "clamp(28px, 6vw, 48px) clamp(16px, 4vw, 32px)",
          textAlign: "center",
        }}
      >
        <Brackets color={F1.fg3} size={14} weight={2} />
        <div className="flex items-center justify-center gap-3" style={{ marginBottom: 18 }}>
          <LiveDot color={F1.fg3} size={10} />
          <Mono
            style={{
              fontSize: 11,
              color: F1.fg3,
              letterSpacing: "0.24em",
              fontWeight: 700,
            }}
          >
            {replay ? "LOADING RACE REVIEW" : "CONNECTING TO TIMING FEED"}
          </Mono>
        </div>
        <h2
          className="font-display"
          style={{
            fontSize: "clamp(40px, 6vw, 72px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 0.9,
            margin: 0,
            color: F1.fg2,
          }}
        >
          STAND BY<span className="animate-pulse" style={{ color: F1.red }}>…</span>
        </h2>
        {/* Skeleton tower rows to signal the timing screen is on its way. */}
        <div style={{ marginTop: 30 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse flex items-center"
              style={{
                gap: 12,
                padding: "10px 8px",
                borderBottom: `1px solid ${F1.line}`,
                opacity: 1 - i * 0.16,
              }}
            >
              <span style={{ width: 28, height: 20, background: F1.bg3 }} />
              <span style={{ width: 4, height: 24, background: F1.bg3 }} />
              <span style={{ flex: 1, height: 14, background: F1.bg3 }} />
              <span style={{ width: 56, height: 14, background: F1.bg3 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Live-but-locked view (session on track, free data feeds gated) ──────

function LiveLockedView({
  session,
  lastRaceSessionKey,
}: {
  session: {
    name: string;
    type: string;
    circuitShortName: string;
    countryName: string;
  } | null;
  lastRaceSessionKey: number | null;
}) {
  const where = session?.circuitShortName || session?.countryName || "";
  return (
    <div className="relative" style={{ padding: "clamp(32px, 8vw, 60px) clamp(16px, 4vw, 32px)" }}>
      <div
        className="relative max-w-3xl mx-auto"
        style={{
          background: F1.bg2,
          border: `1px solid ${F1.line}`,
          padding: "clamp(28px, 6vw, 48px) clamp(16px, 4vw, 32px)",
          textAlign: "center",
        }}
      >
        <Brackets color={F1.red} size={14} weight={2} />
        <div className="flex items-center justify-center gap-3" style={{ marginBottom: 18 }}>
          <LiveDot color={F1.red} size={10} />
          <Mono
            style={{
              fontSize: 11,
              color: F1.red,
              letterSpacing: "0.24em",
              fontWeight: 700,
            }}
          >
            ON AIR · SESSION IN PROGRESS
          </Mono>
        </div>
        <h2
          className="font-display"
          style={{
            fontSize: "clamp(40px, 6vw, 72px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 0.9,
            margin: 0,
          }}
        >
          {(session?.name || "LIVE").toUpperCase()}
          <span style={{ color: F1.red }}>.</span>
        </h2>
        {where && (
          <div
            className="font-display"
            style={{
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              marginTop: 10,
            }}
          >
            {where.toUpperCase()}
          </div>
        )}
        <div
          style={{ marginTop: 22, maxWidth: 540, marginLeft: "auto", marginRight: "auto" }}
        >
          <Mono
            style={{
              fontSize: 11,
              color: F1.fg3,
              letterSpacing: "0.06em",
              lineHeight: 1.8,
            }}
          >
            FORMULA 1 LOCKS ALL FREE LIVE-TIMING DATA WHILE A SESSION IS RUNNING.
            THE FULL TIMING TOWER AND REVIEW UNLOCK THE MOMENT THIS SESSION ENDS.
          </Mono>
        </div>

        {lastRaceSessionKey && (
          <div style={{ marginTop: 32, borderTop: `1px solid ${F1.line}`, paddingTop: 24 }}>
            <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.18em" }}>
              WHILE YOU WAIT — REVIEW THE TIMING SCREEN FROM THE LAST RACE
            </Mono>
            <div className="flex justify-center" style={{ marginTop: 14 }}>
              <Link
                href={`/live?replay=${lastRaceSessionKey}`}
                className="inline-flex items-center gap-2"
                style={{
                  background: F1.red,
                  color: F1.ink,
                  padding: "11px 22px",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textDecoration: "none",
                }}
              >
                ▶ REVIEW LAST RACE
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────

interface LiveContentProps {
  /** When set, load this past session's OpenF1 data (replay mode). */
  replaySessionKey?: number | null;
  /** Most recent completed race key, for the idle "replay last race" button. */
  lastRaceSessionKey?: number | null;
}

export function LiveContent({
  replaySessionKey = null,
  lastRaceSessionKey = null,
}: LiveContentProps) {
  const isReplayRoute = replaySessionKey !== null;

  // OpenF1-based session: drives replay, recently-finished, and the idle countdown.
  const live = useLiveSession(replaySessionKey);
  // F1 SignalR SSE for TRUE live data — disabled in replay mode (uses OpenF1 history).
  const stream = useLiveStream(!isReplayRoute);

  // Focus state lives in the OpenF1 hook (it also drives the telemetry fetch); we
  // reuse it for row highlighting in both modes.
  const { focusedDriverNumber, setFocusedDriverNumber } = live;

  // Prefer the real-time SSE feed whenever it is actively delivering data.
  const usingStream = stream.state === "live" && stream.data !== null;

  // Unified view model from whichever source is active.
  const view = useMemo(() => {
    if (usingStream && stream.data) {
      const s = stream.data;
      return {
        positions: s.positions,
        intervals: s.intervals,
        drivers: s.drivers,
        stints: s.stints,
        lapStats: s.lapStats,
        raceControl: s.raceControl,
        teamRadio: [] as OpenF1TeamRadio[],
        weather: s.weather,
        currentLap: s.currentLap,
        focusedCarData: null as OpenF1CarData | null,
        sessionName: s.session?.name ?? "LIVE SESSION",
        sessionType: s.session?.type ?? "",
        circuitShortName: s.session?.circuitShortName ?? "",
        countryName: s.session?.countryName ?? "",
        feedLabel: "F1 LIVE TIMING",
        lastUpdated: stream.lastUpdated,
        isLive: true,
        hasSession: s.session !== null || s.positions.length > 0,
        loading: false,
      };
    }
    const currentLap =
      live.lapStats.length > 0
        ? Math.max(...live.lapStats.map((l) => l.lapNumber))
        : null;
    return {
      positions: live.positions,
      intervals: live.intervals,
      drivers: live.drivers,
      stints: live.stints,
      lapStats: live.lapStats,
      raceControl: live.raceControl,
      teamRadio: live.teamRadio,
      weather: live.weather,
      currentLap,
      focusedCarData: live.focusedCarData,
      sessionName: live.session?.name ?? "",
      sessionType: live.session?.type ?? "",
      circuitShortName: live.session?.circuitShortName ?? "",
      countryName: live.session?.countryName ?? "",
      feedLabel: live.isReplay ? "REVIEW · OPENF1" : "OPENF1",
      lastUpdated: live.lastUpdated,
      isLive: live.isLive,
      hasSession: live.session !== null,
      loading: live.loading,
    };
  }, [usingStream, stream.data, stream.lastUpdated, live]);

  // Show the timing screen when SSE is live, or OpenF1 has a session (live/finished/replay).
  const showLiveData =
    usingStream ||
    live.status === "LIVE" ||
    live.status === "FINISHED" ||
    live.status === "REPLAY";

  // First-paint guard: until we actually know the state, show a loading screen
  // instead of flashing OFF-AIR. In replay we wait for OpenF1's first fetch; live
  // we also wait for the SSE relay to resolve (connecting → live | offline).
  const initializing =
    live.loading || (!isReplayRoute && stream.state === "connecting");

  const focusedDriver = useMemo(
    () =>
      focusedDriverNumber !== null
        ? (view.drivers.find((d) => d.driver_number === focusedDriverNumber) ?? null)
        : null,
    [view.drivers, focusedDriverNumber]
  );

  const focusedTeamColor = focusedDriver
    ? teamColorFromDriverTeam(focusedDriver.team_name)
    : F1.red;

  // Auto-focus the leader ONCE, after data first arrives. A ref guard means the
  // user can later deselect/select a different driver without it snapping back.
  const autoFocusedRef = useRef(false);
  useEffect(() => {
    if (!showLiveData) return;
    if (autoFocusedRef.current) return;
    if (focusedDriverNumber !== null) return;
    const leader = [...view.positions].sort((a, b) => a.position - b.position)[0];
    if (leader) {
      autoFocusedRef.current = true;
      setFocusedDriverNumber(leader.driver_number);
    }
  }, [showLiveData, view.positions, focusedDriverNumber, setFocusedDriverNumber]);

  return (
    <div style={{ background: F1.bg, color: F1.fg, position: "relative" }}>
      <BroadcastGrid color={F1.line} size={64} opacity={0.14} />

      {showLiveData && (view.hasSession || view.positions.length > 0) ? (
        <>
          {live.isReplay && (
            <ReplayBanner
              sessionName={view.sessionName || "PAST SESSION"}
              countryName={view.countryName}
            />
          )}
          <TopBroadcastBar
            isLive={view.isLive}
            sessionName={view.sessionName}
            sessionType={view.sessionType}
            countryName={view.countryName}
            circuit={view.circuitShortName}
            currentLap={view.currentLap}
            airTemp={view.weather?.air_temperature ?? null}
            trackTemp={view.weather?.track_temperature ?? null}
          />

          {/* Main grid — single column on mobile, tower + side panel on desktop */}
          <div
            className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]"
            style={{
              gap: 1,
              background: F1.line,
            }}
          >
            <div style={{ background: F1.bg, padding: 0 }}>
              {view.loading && view.positions.length === 0 ? (
                <div style={{ padding: 24 }}>
                  <Mono style={{ fontSize: 11, color: F1.fg3, letterSpacing: "0.18em" }}>
                    LOADING TIMING DATA…
                  </Mono>
                </div>
              ) : (
                <TimingTower
                  positions={view.positions}
                  intervals={view.intervals}
                  drivers={view.drivers}
                  stints={view.stints}
                  lapStats={view.lapStats}
                  focusedDriverNumber={focusedDriverNumber}
                  onSelect={setFocusedDriverNumber}
                />
              )}
            </div>

            <div style={{ background: F1.bg }}>
              <TelemetryBlock
                carData={view.focusedCarData}
                driver={focusedDriver}
                teamColor={focusedTeamColor}
              />
              <div style={{ borderTop: `1px solid ${F1.line}` }}>
                <RaceControlFeed
                  raceControl={view.raceControl}
                  teamRadio={view.teamRadio}
                  drivers={view.drivers}
                />
              </div>
            </div>
          </div>

          {/* Footer ticker */}
          <div
            className="flex items-center justify-between"
            style={{
              padding: "10px 24px",
              background: F1.bg2,
              borderTop: `1px solid ${F1.line}`,
            }}
          >
            <Mono style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.24em" }}>
              FEED · {view.feedLabel}
              {view.lastUpdated && ` · UPDATED ${formatTimeSince(view.lastUpdated)}`}
            </Mono>
            <Mono style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.24em" }}>
              CLICK A DRIVER ROW TO FOCUS TELEMETRY
            </Mono>
          </div>
        </>
      ) : initializing ? (
        <LoadingView replay={isReplayRoute} />
      ) : live.status === "LIVE_LOCKED" ? (
        <LiveLockedView session={live.session} lastRaceSessionKey={lastRaceSessionKey} />
      ) : (
        <IdleView lastRaceSessionKey={lastRaceSessionKey} />
      )}
    </div>
  );
}
