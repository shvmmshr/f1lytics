"use client";

import { useRef, useState, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { getNextEvent } from "@/lib/constants";
import { format } from "date-fns";

function getTimeRemaining(targetDate: Date) {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

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

  const targetDate = event
    ? new Date(`${event.eventDate}T14:00:00`)
    : null;

  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!targetDate) return;

    // Set immediately on mount, then tick every second
    setTime(getTimeRemaining(targetDate));
    const interval = setInterval(() => {
      setTime(getTimeRemaining(targetDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate?.getTime()]);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      const boxes = sectionRef.current.querySelectorAll("[data-countdown-unit]");
      gsap.from(boxes, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
      });
    },
    { scope: sectionRef }
  );

  if (!event || !nextRace) return null;

  const units = [
    { value: time.days, label: "Days" },
    { value: time.hours, label: "Hours" },
    { value: time.minutes, label: "Mins" },
    { value: time.seconds, label: "Secs" },
  ];

  return (
    <section ref={sectionRef} className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex gap-4 md:gap-6">
            {units.map((unit) => (
              <div
                key={unit.label}
                data-countdown-unit
                className="flex flex-col items-center rounded-xl border border-border-subtle bg-bg-secondary p-4 md:p-6"
              >
                <span className="text-4xl md:text-5xl font-mono font-bold text-text-primary">
                  {String(unit.value).padStart(2, "0")}
                </span>
                <span className="text-xs text-text-muted uppercase mt-2">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">
                {nextRace.fullName}
              </h2>
              {event.eventType === "sprint" && (
                <span className="rounded-full bg-status-yellow/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-status-yellow">
                  Sprint
                </span>
              )}
            </div>
            <p className="text-text-secondary">
              {nextRace.name} &mdash; {nextRace.city}, {nextRace.country}
            </p>
            <p className="text-sm text-text-muted">
              {format(new Date(`${event.eventDate}T12:00:00`), "MMMM d, yyyy")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
