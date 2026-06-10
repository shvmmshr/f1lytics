import * as React from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────
   Broadcast / FIA-graphic atoms
   Used across the app to give every screen the same
   "telemetry overlay" identity.
   ───────────────────────────────────────────────────────────── */

export const F1 = {
  ink: "#08080A",
  bg: "#0C0C0E",
  bg2: "#141418",
  bg3: "#1C1C22",
  bg4: "#26262E",
  fg: "#F4F4F5",
  fg2: "#B4B4BD",
  fg3: "#84848F",
  fg4: "#5C5C66",
  line: "#27272A",
  lineHi: "#3F3F46",
  red: "#FF1801",
  redDeep: "#C20012",
  amber: "#F5A623",
  green: "#22C55E",
  yellow: "#EAB308",
  cyan: "#27F4D2",
  purple: "#B07CFF",
} as const;

/* Inline mono span — used for any tabular numbers / labels */
export function Mono({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span className={cn("font-mono", className)} style={style}>
      {children}
    </span>
  );
}

/* Four corner brackets — "FIA broadcast frame" */
export function Brackets({
  color = F1.fg3,
  size = 10,
  weight = 1.5,
}: {
  color?: string;
  size?: number;
  weight?: number;
}) {
  const c: React.CSSProperties = {
    position: "absolute",
    width: size,
    height: size,
    borderColor: color,
    pointerEvents: "none",
  };
  return (
    <>
      <span style={{ ...c, top: -1, left: -1, borderTop: `${weight}px solid`, borderLeft: `${weight}px solid` }} />
      <span style={{ ...c, top: -1, right: -1, borderTop: `${weight}px solid`, borderRight: `${weight}px solid` }} />
      <span style={{ ...c, bottom: -1, left: -1, borderBottom: `${weight}px solid`, borderLeft: `${weight}px solid` }} />
      <span style={{ ...c, bottom: -1, right: -1, borderBottom: `${weight}px solid`, borderRight: `${weight}px solid` }} />
    </>
  );
}

/* Diagonal racing-stripes texture overlay */
export function RacingStripes({
  color = F1.red,
  opacity = 0.08,
  size = 16,
}: {
  color?: string;
  opacity?: number;
  size?: number;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: `repeating-linear-gradient(135deg, ${color} 0 1px, transparent 1px ${size}px)`,
        opacity,
      }}
    />
  );
}

/* Subtle grid background overlay */
export function Grid({
  color = F1.line,
  size = 32,
  opacity = 0.5,
}: {
  color?: string;
  size?: number;
  opacity?: number;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        opacity,
        backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
        backgroundSize: `${size}px ${size}px`,
      }}
    />
  );
}

/* Pulsing live indicator dot */
export function LiveDot({
  color = F1.red,
  size = 8,
  className,
}: {
  color?: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("inline-block rounded-full animate-f1pulse align-middle", className)}
      style={{ width: size, height: size, background: color }}
    />
  );
}

/* Uppercase mono caption */
export function DataLabel({
  children,
  color,
  className,
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={cn("font-mono uppercase", className)}
      style={{
        fontSize: 10,
        letterSpacing: "0.16em",
        color: color ?? F1.fg3,
      }}
    >
      {children}
    </span>
  );
}

/* Antonio condensed numeric / display value */
export function StatValue({
  children,
  size = 48,
  color = F1.fg,
  weight = 600,
  className,
  style,
}: {
  children: React.ReactNode;
  size?: number;
  color?: string;
  weight?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={cn("font-display tabular-nums", className)}
      style={{
        fontSize: size,
        lineHeight: 0.9,
        color,
        letterSpacing: "-0.02em",
        fontWeight: weight,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/* Position pill — gold/silver/bronze for podium, gray fallback */
export function PosPill({ pos, size = "md" }: { pos: number; size?: "sm" | "md" | "lg" }) {
  const colors: Record<number, string> = { 1: F1.amber, 2: "#C0C0C8", 3: "#CD7F32" };
  const bg = colors[pos] || F1.bg3;
  const fg = pos <= 3 ? F1.ink : F1.fg;
  const dim = size === "sm" ? { w: 22, h: 22, f: 11 } : size === "lg" ? { w: 44, h: 44, f: 18 } : { w: 32, h: 32, f: 14 };
  return (
    <span
      className="inline-flex items-center justify-center font-display"
      style={{
        width: dim.w,
        height: dim.h,
        background: bg,
        color: fg,
        fontWeight: 700,
        fontSize: dim.f,
        letterSpacing: "-0.02em",
      }}
    >
      {pos}
    </span>
  );
}

/* Tire compound dot (S/M/H/I/W) */
export function Tire({ compound = "M", size = 16 }: { compound?: string; size?: number }) {
  const map: Record<string, string> = {
    S: "#EF4444",
    M: "#EAB308",
    H: "#FFFFFF",
    I: "#22C55E",
    W: "#3B82F6",
  };
  const color = map[compound] ?? F1.fg3;
  return (
    <span
      className="inline-flex items-center justify-center font-display"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `2px solid ${color}`,
        color,
        fontWeight: 700,
        fontSize: size * 0.55,
        background: "rgba(0,0,0,0.4)",
      }}
    >
      {compound}
    </span>
  );
}

/* Sector segment — purple (fastest) / green (PB) / yellow / dim */
export function SectorBar({ color }: { color: "p" | "g" | "y" | "n" }) {
  const map = { p: F1.purple, g: F1.green, y: F1.yellow, n: F1.line };
  return <span aria-hidden style={{ display: "inline-block", width: 18, height: 4, background: map[color] }} />;
}

/* Section header — "01 / SECTION TITLE" */
export function SectionHeader({
  index,
  label,
  accent = F1.red,
  right,
}: {
  index?: string;
  label: string;
  accent?: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-baseline gap-4 pb-3.5 mb-5"
      style={{ borderBottom: `1px solid ${F1.line}` }}
    >
      {index ? (
        <span
          className="font-mono"
          style={{ fontSize: 11, color: accent, letterSpacing: "0.18em" }}
        >
          {index}
        </span>
      ) : (
        <span
          aria-hidden
          style={{ width: 28, height: 1, background: accent, alignSelf: "center" }}
        />
      )}
      <h3
        className="font-display flex-1 m-0 uppercase"
        style={{
          fontWeight: 500,
          fontSize: 22,
          letterSpacing: "0.02em",
          color: F1.fg,
        }}
      >
        {label}
      </h3>
      {right && <div>{right}</div>}
    </div>
  );
}

/* Trend arrow */
export function Trend({ dir }: { dir: "up" | "down" | "flat" }) {
  if (dir === "up") return <span style={{ color: F1.green }}>▲</span>;
  if (dir === "down") return <span style={{ color: F1.red }}>▼</span>;
  return <span style={{ color: F1.fg3 }}>—</span>;
}

