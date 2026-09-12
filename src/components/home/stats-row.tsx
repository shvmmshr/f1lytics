import { F1, Mono } from "@/components/shared/broadcast";
import { CIRCUIT_LIST, DRIVER_LIST, TEAM_LIST } from "@/lib/constants";

// Derived from constants so cancelled rounds (Bahrain, Saudi) are excluded.
const activeRaces = CIRCUIT_LIST.filter((c) => !c.cancelled);
const stats = [
  { value: activeRaces.length, label: "RACES" },
  { value: TEAM_LIST.length, label: "TEAMS" },
  { value: DRIVER_LIST.length, label: "DRIVERS" },
  { value: activeRaces.filter((c) => c.isSprint).length, label: "SPRINTS" },
];

export function StatsRow() {
  return (
    <section
      style={{
        background: F1.bg,
        borderTop: `1px solid ${F1.line}`,
        borderBottom: `1px solid ${F1.line}`,
        padding: "clamp(36px, 6vw, 60px) clamp(16px, 4vw, 32px)",
      }}
    >
      <div
        className="mx-auto grid grid-cols-2 sm:grid-cols-4"
        style={{
          maxWidth: "var(--content-wide)",
          gap: 1,
          background: F1.line,
          border: `1px solid ${F1.line}`,
        }}
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: F1.bg,
              padding: "clamp(20px, 4vw, 32px) 16px",
              textAlign: "center",
            }}
          >
            <span
              className="font-display tabular-nums"
              style={{
                fontSize: "clamp(40px, 6vw, 72px)",
                fontWeight: 700,
                color: F1.fg,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                display: "block",
              }}
            >
              {stat.value}
            </span>
            <Mono
              className="block"
              style={{
                fontSize: 11,
                color: F1.fg3,
                letterSpacing: "0.24em",
                marginTop: 12,
              }}
            >
              {stat.label}
            </Mono>
          </div>
        ))}
      </div>
    </section>
  );
}
