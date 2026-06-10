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
  // Initialize to targetDate so server renders all zeros; client corrects on mount
  const [now, setNow] = useState(() => targetDate);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    const raf = requestAnimationFrame(() => {
      setNow(new Date());
    });

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(raf);
    };
  }, []);

  const days = differenceInDays(targetDate, now);
  const hours = differenceInHours(targetDate, now) % 24;
  const minutes = differenceInMinutes(targetDate, now) % 60;
  const seconds = differenceInSeconds(targetDate, now) % 60;

  if (days < 0) return null;

  const blocks = [
    { value: days, label: "DAYS" },
    { value: hours, label: "HRS" },
    { value: minutes, label: "MIN" },
    { value: seconds, label: "SEC" },
  ];

  return (
    <div>
      {label && (
        <Mono
          className="mb-3 block uppercase"
          style={{ fontSize: 11, color: F1.fg3, letterSpacing: "0.18em" }}
        >
          {label}
        </Mono>
      )}
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
              {String(block.value).padStart(2, "0")}
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
