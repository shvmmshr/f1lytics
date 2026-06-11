"use client";

import { useEffect, useMemo, useState } from "react";
import type { WeekendSchedule } from "@/lib/constants/sessions";
import { F1, Mono } from "@/components/shared/broadcast";

/**
 * Race-weekend session times (FP1 → Race) rendered in the viewer's timezone.
 *
 * Detects the local zone via Intl on mount (times show "--:--" server-side so
 * the HTML never disagrees with the client), and offers a picker over the full
 * IANA zone list. The chosen zone persists in localStorage and syncs across
 * every instance on the page via a custom window event.
 */

const TZ_STORAGE_KEY = "f1lytics-timezone";
const TZ_CHANGE_EVENT = "f1lytics:timezone-change";

/** Curated zones surfaced at the top of the picker; the full list follows. */
const POPULAR_ZONES = [
  "America/Los_Angeles",
  "America/New_York",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Madrid",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Melbourne",
];

function allTimezones(): string[] {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return POPULAR_ZONES;
  }
}

/** "Asia/Kolkata" → "Kolkata, Asia (GMT+5:30)" */
function zoneLabel(zone: string, when: Date): string {
  const parts = zone.split("/");
  const city = (parts[parts.length - 1] ?? zone).replaceAll("_", " ");
  const region = parts.length > 1 ? parts[0].replaceAll("_", " ") : "";
  let offset = "";
  try {
    offset =
      new Intl.DateTimeFormat("en-US", {
        timeZone: zone,
        timeZoneName: "shortOffset",
      })
        .formatToParts(when)
        .find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    /* unknown zone */
  }
  return `${city}${region ? `, ${region}` : ""}${offset ? ` (${offset})` : ""}`;
}

function useTimezone() {
  // null until mounted — the server can't know the visitor's zone.
  const [zone, setZone] = useState<string | null>(null);

  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const stored = localStorage.getItem(TZ_STORAGE_KEY);
    const raf = requestAnimationFrame(() => setZone(stored || detected));

    const onChange = (e: Event) => {
      const next = (e as CustomEvent<string>).detail;
      if (next) setZone(next);
    };
    window.addEventListener(TZ_CHANGE_EVENT, onChange);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener(TZ_CHANGE_EVENT, onChange);
    };
  }, []);

  const select = (next: string) => {
    if (next === "auto") {
      localStorage.removeItem(TZ_STORAGE_KEY);
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setZone(detected);
      window.dispatchEvent(new CustomEvent(TZ_CHANGE_EVENT, { detail: detected }));
    } else {
      localStorage.setItem(TZ_STORAGE_KEY, next);
      setZone(next);
      window.dispatchEvent(new CustomEvent(TZ_CHANGE_EVENT, { detail: next }));
    }
  };

  return { zone, select };
}

const SESSION_ORDER: { key: keyof WeekendSchedule; label: string }[] = [
  { key: "fp1", label: "PRACTICE 1" },
  { key: "fp2", label: "PRACTICE 2" },
  { key: "fp3", label: "PRACTICE 3" },
  { key: "sprintQualifying", label: "SPRINT QUALI" },
  { key: "sprint", label: "SPRINT" },
  { key: "qualifying", label: "QUALIFYING" },
  { key: "race", label: "RACE" },
];

interface SessionScheduleProps {
  schedule: WeekendSchedule;
  title?: string;
}

export function SessionSchedule({ schedule, title = "WEEKEND SCHEDULE" }: SessionScheduleProps) {
  const { zone, select } = useTimezone();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setNow(Date.now()));
    // Minute-level is plenty for dimming finished sessions.
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(interval);
    };
  }, []);

  const sessions = useMemo(
    () =>
      SESSION_ORDER.filter((s) => schedule[s.key]).map((s) => {
        const iso = schedule[s.key] as string;
        return { ...s, iso, ts: new Date(iso).getTime() };
      }),
    [schedule]
  );

  // The first session that hasn't started yet gets the accent.
  const SESSION_MS = 2 * 60 * 60 * 1000;
  const nextIdx = now === null ? -1 : sessions.findIndex((s) => s.ts + SESSION_MS > now);

  const zones = useMemo(() => {
    // Offsets in labels are computed for the weekend itself, so DST is right.
    const sample = sessions.length > 0 ? new Date(sessions[0].ts) : new Date(0);
    const popular = POPULAR_ZONES.filter((z) => z !== zone);
    const rest = zone
      ? allTimezones().filter((z) => z !== zone && !POPULAR_ZONES.includes(z))
      : [];
    return { sample, popular, rest };
  }, [zone, sessions]);

  const fmtDay = (ts: number) =>
    zone
      ? new Intl.DateTimeFormat("en-US", {
          timeZone: zone,
          weekday: "short",
          month: "short",
          day: "numeric",
        })
          .format(new Date(ts))
          .toUpperCase()
      : "---";

  const fmtTime = (ts: number) =>
    zone
      ? new Intl.DateTimeFormat("en-US", {
          timeZone: zone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(new Date(ts))
      : "--:--";

  return (
    <div style={{ border: `1px solid ${F1.line}`, background: F1.bg }}>
      {/* Header: title + timezone picker */}
      <div
        className="flex items-center justify-between gap-3 flex-wrap"
        style={{ padding: "12px 16px", borderBottom: `1px solid ${F1.line}` }}
      >
        <Mono
          style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.22em", fontWeight: 700 }}
        >
          {title}
        </Mono>
        <div className="flex items-center gap-2 min-w-0">
          <Mono style={{ fontSize: 9, color: F1.fg4, letterSpacing: "0.18em" }}>
            TIMEZONE
          </Mono>
          <select
            aria-label="Timezone for session times"
            value={zone ?? ""}
            onChange={(e) => select(e.target.value)}
            disabled={!zone}
            className="font-mono"
            style={{
              background: F1.bg2,
              color: F1.fg2,
              border: `1px solid ${F1.line}`,
              fontSize: 11,
              padding: "5px 8px",
              maxWidth: 220,
              cursor: "pointer",
            }}
          >
            {!zone ? (
              <option value="">Detecting…</option>
            ) : (
              <>
                <option value={zone}>{zoneLabel(zone, zones.sample)}</option>
                <option value="auto">Reset to my local time</option>
                <optgroup label="Popular">
                  {zones.popular.map((z) => (
                    <option key={z} value={z}>
                      {zoneLabel(z, zones.sample)}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="All timezones">
                  {zones.rest.map((z) => (
                    <option key={z} value={z}>
                      {zoneLabel(z, zones.sample)}
                    </option>
                  ))}
                </optgroup>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Session rows */}
      <div>
        {sessions.map((s, i) => {
          const isDone = now !== null && s.ts + SESSION_MS <= now;
          const isNext = i === nextIdx;
          const isRace = s.key === "race";
          const isSprintFamily = s.key === "sprint" || s.key === "sprintQualifying";
          const labelColor = isDone
            ? F1.fg4
            : isRace
              ? F1.red
              : isSprintFamily
                ? F1.amber
                : F1.fg3;
          return (
            <div
              key={s.key}
              className="flex items-center justify-between gap-3"
              style={{
                padding: "9px 16px",
                borderTop: i > 0 ? `1px solid ${F1.line}` : undefined,
                background: isNext ? "rgba(255,255,255,0.025)" : undefined,
                opacity: isDone ? 0.55 : 1,
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {isNext && (
                  <span
                    aria-hidden
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: F1.red,
                      flexShrink: 0,
                    }}
                  />
                )}
                <Mono
                  style={{
                    fontSize: 10,
                    color: labelColor,
                    letterSpacing: "0.18em",
                    fontWeight: isRace || isNext ? 700 : 500,
                  }}
                >
                  {s.label}
                </Mono>
              </div>
              <div className="flex items-baseline gap-3">
                <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.1em" }}>
                  {fmtDay(s.ts)}
                </Mono>
                <Mono
                  className="tabular-nums"
                  style={{
                    fontSize: 13,
                    color: isDone ? F1.fg3 : F1.fg,
                    fontWeight: isRace || isNext ? 700 : 500,
                  }}
                >
                  {fmtTime(s.ts)}
                </Mono>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
