"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { LapChartModel } from "@/lib/analytics/lap-chart";
import { lapChartView } from "@/lib/analytics/lap-chart";
import { formatLapTime } from "@/lib/utils";
import { F1 } from "@/components/shared/broadcast";

export function LapTimeChart({ model }: { model: LapChartModel }) {
  const [selected, setSelected] = useState(() => model.series.slice(0, 5).map((s) => s.key));
  const [showTable, setShowTable] = useState(false);
  const [includeLongLaps, setIncludeLongLaps] = useState(false);
  const series = model.series.filter((s) => selected.includes(s.key));
  const view = lapChartView(model, selected, includeLongLaps);
  const times = view.rows.flatMap((row) => series.map((s) => row[s.key]).filter((v): v is number => typeof v === "number"));
  const min = times.length ? Math.floor(Math.min(...times) - 1) : 0;
  const max = times.length ? Math.ceil(Math.max(...times) + 1) : 1;

  return (
    <div className="border p-4 sm:p-5" style={{ background: F1.bg2, borderColor: F1.line }}>
      <details className="mb-2 text-sm leading-relaxed" style={{ color: F1.fg2 }}>
        <summary className="w-fit cursor-pointer py-3 underline underline-offset-4">Chart guide</summary>
        <p className="mb-3 max-w-3xl">Select drivers to compare their laps. Shading marks safety-car periods. Laps longer than 150% of each driver’s median are hidden by default to keep the chart readable; use the toggle to include them. The table always retains every recorded lap.</p>
      </details>
      <label className="mb-4 flex min-h-11 cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={includeLongLaps} onChange={(event) => setIncludeLongLaps(event.target.checked)} className="h-4 w-4 accent-red-600" />Include long laps{view.omitted > 0 ? ` (${view.omitted} hidden)` : ""}</label>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Drivers shown on the lap chart">
        {model.series.map((s) => (
          <button key={s.key} type="button" aria-pressed={selected.includes(s.key)}
            onClick={() => setSelected((previous) => previous.includes(s.key) ? previous.filter((key) => key !== s.key) : [...previous, s.key])}
            className="min-h-11 border px-3 font-mono text-xs"
            style={{ borderColor: selected.includes(s.key) ? s.color : F1.lineHi, color: selected.includes(s.key) ? F1.fg : F1.fg3 }}>
            <span aria-hidden style={{ color: s.color }}>● </span>{s.label}
          </button>
        ))}
      </div>
      <div className="h-[clamp(300px,55vw,420px)]" aria-label="Lap times in minutes and seconds">
        {times.length ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 600, height: 420 }}>
            <LineChart data={view.rows} margin={{ top: 12, right: 12, left: 0, bottom: 4 }} accessibilityLayer>
              <CartesianGrid stroke={F1.line} strokeDasharray="3 3" />
              <XAxis dataKey="lap" tick={{ fill: F1.fg2, fontSize: 11 }} tickLine={false} />
              <YAxis domain={[min, max]} tick={{ fill: F1.fg2, fontSize: 11 }} tickFormatter={(s: number) => `${Math.floor(Math.round(s) / 60)}:${String(Math.round(s) % 60).padStart(2, "0")}`} width={48} tickLine={false} />
              {model.safetyCars.map((window, i) => <ReferenceArea key={i} x1={window.startLap} x2={window.endLap} fill={F1.amber} fillOpacity={0.12} strokeOpacity={0} />)}
              <Tooltip contentStyle={{ backgroundColor: F1.bg2, border: `1px solid ${F1.lineHi}`, color: F1.fg }} formatter={(v) => typeof v === "number" ? formatLapTime(v) : "—"} labelFormatter={(lap) => `Lap ${lap}`} />
              {series.map((s, index) => <Line key={s.key} type="linear" dataKey={s.key} name={s.label} stroke={s.color} strokeDasharray={index % 2 ? "5 3" : undefined} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />)}
            </LineChart>
          </ResponsiveContainer>
        ) : <p className="flex h-full items-center justify-center text-sm" style={{ color: F1.fg2 }}>Select a driver with recorded laps to view their times.</p>}
      </div>
      <details className="mt-4 text-sm" onToggle={(e) => setShowTable(e.currentTarget.open)}>
        <summary className="cursor-pointer py-3 underline underline-offset-4">View selected lap times as a table</summary>
        {showTable && <div className="max-h-96 overflow-auto"><table className="w-full text-left font-mono text-xs"><caption className="sr-only">Recorded lap times for selected drivers</caption><thead><tr><th scope="col" className="p-2">Lap</th>{series.map((s) => <th scope="col" key={s.key} className="p-2">{s.label}</th>)}</tr></thead><tbody>{model.rows.map((row) => <tr key={row.lap}><th scope="row" className="p-2">{row.lap}</th>{series.map((s) => <td key={s.key} className="p-2">{typeof row[s.key] === "number" ? formatLapTime(row[s.key]) : "—"}</td>)}</tr>)}</tbody></table></div>}
      </details>
    </div>
  );
}
