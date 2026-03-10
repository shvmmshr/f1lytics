"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { animateCounter } from "@/lib/gsap";

const stats = [
  { value: 24, label: "Races" },
  { value: 11, label: "Teams" },
  { value: 22, label: "Drivers" },
  { value: 6, label: "Sprints" },
];

export function StatsRow() {
  const sectionRef = useRef<HTMLElement>(null);
  const numberRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useGSAP(
    () => {
      numberRefs.current.forEach((el, i) => {
        if (el) {
          animateCounter(el, stats[i].value);
        }
      });
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="bg-bg-secondary rounded-xl border border-border-subtle p-6 text-center"
            >
              <span
                ref={(el) => {
                  numberRefs.current[i] = el;
                }}
                className="text-5xl md:text-6xl font-bold font-mono text-text-primary"
              >
                0
              </span>
              <p className="text-sm text-text-secondary mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
