"use client";

import type { LapChartModel } from "@/lib/analytics/lap-chart";
import { DeferredPanel } from "@/components/shared/deferred-panel";
import dynamic from "next/dynamic";
import { F1, Mono } from "@/components/shared/broadcast";

/** Recharts is ~100 KB gzipped; load it only when a race page with laps renders. */
const Chart = dynamic(() => import("./lap-time-chart").then((m) => ({ default: m.LapTimeChart })), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: 320, background: F1.bg2, border: `1px solid ${F1.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.18em" }}>LOADING LAP CHART</Mono>
    </div>
  ),
});

export function LapTimeChart({ model }: { model: LapChartModel }) {
  return <DeferredPanel height={420} label="Lap-time comparison"><Chart model={model} /></DeferredPanel>;
}
