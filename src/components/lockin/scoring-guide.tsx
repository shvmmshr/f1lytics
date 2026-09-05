import { F1, Mono } from "@/components/shared/broadcast";
import { POINTS } from "@/lib/lockin/scoring";

const ROWS: [string, string][] = [
  ["Pole position", `${POINTS.pole}`],
  ["Each podium step exact", `${POINTS.podiumExact}`],
  ["Podium driver, wrong step", `${POINTS.podiumClose}`],
  ["All three podium steps exact", `+${POINTS.podiumPerfect}`],
  ["Fastest lap", `${POINTS.fastestLap}`],
  ["Sprint winner (sprint weekends)", `${POINTS.sprintWinner}`],
];

export function ScoringGuide() {
  return (
    <section aria-labelledby="scoring-heading" style={{ background: F1.bg2, border: `1px solid ${F1.line}`, padding: "clamp(16px, 3vw, 24px)" }}>
      <Mono id="scoring-heading" style={{ fontSize: 11, color: F1.fg3, letterSpacing: "0.22em", fontWeight: 700 }}>HOW POINTS WORK</Mono>
      <dl className="mt-3 grid gap-y-2" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
        {ROWS.map(([label, pts]) => (
          <div key={label} className="contents">
            <dt style={{ color: F1.fg2, fontSize: 14 }}>{label}</dt>
            <dd className="font-display m-0 text-right" style={{ fontSize: 18, fontWeight: 700, color: F1.fg }}>{pts}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3" style={{ fontSize: 13, color: F1.fg3, lineHeight: 1.6 }}>
        Up to 30 points a weekend, 33 with a sprint. Ties break on the winning margin: the closest guess ranks higher. Calls lock when the weekend&apos;s first competitive session starts, and results settle from the official classification.
      </p>
    </section>
  );
}
