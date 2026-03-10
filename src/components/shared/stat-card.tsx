"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
}

export function StatCard({ label, value, suffix = "" }: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-lg border border-border-subtle bg-bg-secondary p-4"
    >
      <p className="text-xs font-medium uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-text-primary">
        {displayValue}
        {suffix}
      </p>
    </motion.div>
  );
}
