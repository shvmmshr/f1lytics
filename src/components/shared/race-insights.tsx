import type { ResultItem } from "@/lib/api/types";
import { raceInsights } from "@/lib/analytics/results";
import { F1, SectionHeader } from "./broadcast";

export function RaceInsights({ results }: { results: ResultItem[] }) {
  const insights = raceInsights(results);
  if (!insights.length) return null;
  return <section aria-label="Race at a glance" className="relative border-b border-line px-4 py-8 sm:px-8">
    <SectionHeader label="THE RACE AT A GLANCE" />
    <div className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
      {insights.map((item) => <article key={item.label} className="min-w-0 bg-bg-secondary p-5">
        <h3 className="font-mono text-xs uppercase tracking-widest text-text-secondary">{item.label}</h3>
        <p className="my-3 break-words font-display text-3xl sm:text-4xl" style={{ color: item.label === "Fastest lap" ? F1.purple : F1.fg }}>{item.value}</p>
        <p className="text-sm leading-relaxed text-text-secondary">{item.detail}</p>
      </article>)}
    </div>
    <p className="mt-3 text-xs leading-relaxed text-text-secondary">Recovery is measured from starting grid to finish; pit-lane starts are excluded.</p>
  </section>;
}
