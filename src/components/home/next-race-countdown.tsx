"use client";

import { useRef, useState, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import { staggerEntrance } from "@/lib/gsap";
import { getNextEvent } from "@/lib/constants";
import { getWeekendSchedule } from "@/lib/constants/sessions";
import { format } from "date-fns";
import { F1, Mono, LiveDot, Brackets } from "@/components/shared/broadcast";
import { SessionSchedule } from "@/components/shared/session-schedule";

/** Parse a "YYYY-MM-DD" string as a local-midnight Date so the calendar day never
 *  shifts across timezones (unlike `new Date("YYYY-MM-DD")`, which is parsed as UTC). */
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getTimeRemaining(targetDate: Date) {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function NextRaceCountdown() {
  const sectionRef = useRef<HTMLElement>(null);
  const event = getNextEvent();
  const nextRace = event?.circuit;

  const targetTime = event
    ? new Date(`${event.eventDate}T${event.eventTime}`).getTime()
    : null;

  // null until mounted — server HTML shows "--" placeholders, no zero-flash.
  const [time, setTime] = useState<ReturnType<typeof getTimeRemaining> | null>(null);

  useEffect(() => {
    if (targetTime === null) return;
    const target = new Date(targetTime);
    const interval = setInterval(() => {
      setTime(getTimeRemaining(target));
    }, 1000);
    const raf = requestAnimationFrame(() => setTime(getTimeRemaining(target)));
    return () => {
      clearInterval(interval);
      cancelAnimationFrame(raf);
    };
  }, [targetTime]);

  useGSAP(
    () => {
      if (!sectionRef.current) return;
      staggerEntrance("[data-countdown-unit]", sectionRef.current);
    },
    { scope: sectionRef }
  );

  if (!event || !nextRace) return null;

  const weekendSchedule = getWeekendSchedule(nextRace.raceDate);

  const inProgress =
    time !== null &&
    time.days + time.hours + time.minutes + time.seconds === 0;

  const units = [
    { value: time?.days ?? null, label: "DAYS" },
    { value: time?.hours ?? null, label: "HOURS" },
    { value: time?.minutes ?? null, label: "MINS" },
    { value: time?.seconds ?? null, label: "SECS" },
  ];

  return (
    <section
      ref={sectionRef}
      style={{
        background: F1.bg,
        borderTop: `1px solid ${F1.line}`,
        borderBottom: `1px solid ${F1.line}`,
        padding: "60px 32px",
        position: "relative",
      }}
    >
      <div className="mx-auto max-w-6xl">
        {/* Broadcast caption */}
        <div className="flex items-center gap-3.5 mb-6">
          <LiveDot size={8} />
          <Mono style={{ color: F1.red, fontSize: 11, letterSpacing: "0.24em", fontWeight: 700 }}>
            UP NEXT
          </Mono>
          <span style={{ width: 40, height: 1, background: F1.line }} />
          <Mono style={{ color: F1.fg3, fontSize: 11, letterSpacing: "0.18em" }}>
            ROUND {String(nextRace.round).padStart(2, "0")} · {nextRace.country.toUpperCase()}
          </Mono>
        </div>

        {/* Race title */}
        <div className="flex items-baseline gap-3 flex-wrap">
          <h2
            className="font-display uppercase m-0"
            style={{
              fontWeight: 700,
              fontSize: "clamp(40px, 6vw, 72px)",
              lineHeight: 0.9,
              letterSpacing: "-0.04em",
              color: F1.fg,
            }}
          >
            {nextRace.name}
            <span style={{ color: F1.red }}>.</span>
          </h2>
          {event.eventType === "sprint" && (
            <Mono
              style={{
                fontSize: 10,
                background: F1.amber,
                color: F1.ink,
                padding: "3px 10px",
                letterSpacing: "0.24em",
                fontWeight: 700,
              }}
            >
              SPRINT
            </Mono>
          )}
        </div>
        <Mono
          style={{
            fontSize: 12,
            color: F1.fg2,
            letterSpacing: "0.14em",
            marginTop: 10,
            display: "block",
          }}
        >
          {nextRace.fullName.toUpperCase()} · {nextRace.city.toUpperCase()},{" "}
          {nextRace.country.toUpperCase()} ·{" "}
          {format(parseLocalDate(event.eventDate), "MMM d, yyyy").toUpperCase()}
        </Mono>

        {/* Countdown + full weekend schedule, side by side so they fill the
            width instead of stranding the right half of the section. */}
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 mt-10 items-start">
          {/* Countdown — sharp-edged broadcast frames */}
          {inProgress ? (
            <div className="flex items-center gap-3">
              <LiveDot size={8} />
              <Mono
                style={{
                  fontSize: 14,
                  color: F1.red,
                  letterSpacing: "0.22em",
                  fontWeight: 700,
                }}
              >
                SESSION IN PROGRESS
              </Mono>
            </div>
          ) : (
            <div
              className="grid"
              style={{
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 1,
                background: F1.line,
                border: `1px solid ${F1.line}`,
              }}
            >
              {units.map((unit) => (
                <div
                  key={unit.label}
                  data-countdown-unit
                  className="relative"
                  style={{
                    background: F1.bg,
                    padding: "24px 12px 18px",
                    textAlign: "center",
                  }}
                >
                  <Brackets color={F1.fg4} size={8} />
                  <span
                    className="font-display block tabular-nums"
                    style={{
                      fontSize: "clamp(40px, 5vw, 72px)",
                      fontWeight: 700,
                      lineHeight: 1,
                      letterSpacing: "-0.04em",
                      color: F1.fg,
                    }}
                  >
                    {unit.value === null ? "--" : String(unit.value).padStart(2, "0")}
                  </span>
                  <Mono
                    style={{
                      fontSize: 10,
                      color: F1.fg3,
                      letterSpacing: "0.24em",
                      marginTop: 10,
                      display: "block",
                    }}
                  >
                    {unit.label}
                  </Mono>
                </div>
              ))}
            </div>
          )}

          {/* Full weekend session times in the viewer's timezone */}
          {weekendSchedule && (
            <SessionSchedule schedule={weekendSchedule} />
          )}
        </div>
      </div>
    </section>
  );
}
