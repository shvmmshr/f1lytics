"use client";

import { useEffect, useState } from "react";
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
} from "date-fns";

interface CountdownTimerProps {
  targetDate: Date;
  label?: string;
}

export function CountdownTimer({ targetDate, label }: CountdownTimerProps) {
  // Initialize to targetDate so server renders all zeros; client corrects on mount
  const [now, setNow] = useState(() => targetDate);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
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
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-text-muted">{label}</p>
      )}
      <div className="flex gap-3">
        {blocks.map((block) => (
          <div key={block.label} className="text-center">
            <div className="rounded-lg bg-bg-secondary px-3 py-2 font-mono text-2xl font-bold tabular-nums text-text-primary">
              {String(block.value).padStart(2, "0")}
            </div>
            <p className="mt-1 text-[10px] font-medium text-text-muted">{block.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
