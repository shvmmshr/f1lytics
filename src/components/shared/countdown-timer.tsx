"use client";

import { useEffect, useState } from "react";
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
} from "date-fns";
import { F1, Mono } from "@/components/shared/broadcast";

interface CountdownTimerProps {
  targetDate: Date;
  label?: string;
}

export function CountdownTimer({ targetDate, label }: CountdownTimerProps) {
  // Render nothing time-sensitive until mounted so server HTML and the first client
  // render match (no zero-flash / hydration mismatch).
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // diff > 0 means the event is still in the future
  const diff = now ? targetDate.getTime() - now.getTime() : null;
  const isPast = diff !== null && diff <= 0;

  const days = now ? Math.max(0, differenceInDays(targetDate, now)) : null;
  const hours = now ? Math.max(0, differenceInHours(targetDate, now) % 24) : null;
  const minutes = now ? Math.max(0, differenceInMinutes(targetDate, now) % 60) : null;
  const seconds = now ? Math.max(0, differenceInSeconds(targetDate, now) % 60) : null;

  const renderLabel = label && (
    <Mono
      className="mb-3 block uppercase"
      style={{ fontSize: 11, color: F1.fg3, letterSpacing: "0.18em" }}
    >
      {label}
    </Mono>
  );

  // Once the event has started, never show negative/zero counters — show a live state.
  if (isPast) {
    return (
      <div>
        {renderLabel}
        <Mono
          className="block uppercase"
          style={{ fontSize: 14, color: F1.red, letterSpacing: "0.2em", fontWeight: 700 }}
        >
          ● SESSION IN PROGRESS
        </Mono>
      </div>
    );
  }

  // `null` values (pre-mount) render as "--" placeholders to preserve layout.
  const blocks = [
    { value: days, label: "DAYS" },
    { value: hours, label: "HRS" },
    { value: minutes, label: "MIN" },
    { value: seconds, label: "SEC" },
  ];

  return (
    <div>
      {renderLabel}
      <div className="flex" style={{ gap: 1, background: F1.line }}>
        {blocks.map((block) => (
          <div
            key={block.label}
            className="text-center flex-1"
            style={{ background: F1.bg, padding: "10px 14px" }}
          >
            <div
              className="font-display tabular-nums"
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: F1.fg,
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {block.value === null ? "--" : String(block.value).padStart(2, "0")}
            </div>
            <Mono
              className="block"
              style={{
                fontSize: 9,
                color: F1.fg3,
                letterSpacing: "0.2em",
                marginTop: 6,
              }}
            >
              {block.label}
            </Mono>
          </div>
        ))}
      </div>
    </div>
  );
}
