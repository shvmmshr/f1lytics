import { F1 } from "./broadcast";

export function RouteLoading() {
  return <div role="status" aria-busy="true" className="min-h-[65vh] px-5 py-10 sm:px-8" style={{ background: F1.bg, color: F1.fg2 }}>
    <p className="font-mono text-xs uppercase tracking-widest">Loading F1lytics</p>
    <p className="mt-3 text-sm">Preparing the latest available data…</p>
    <div aria-hidden className="mt-8 grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((key) => <div key={key} className="h-36 border border-line bg-bg-secondary" />)}</div>
  </div>;
}
