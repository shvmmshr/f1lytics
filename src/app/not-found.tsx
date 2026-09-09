import Link from "next/link";

export default function NotFound() {
  return <section className="flex min-h-[70vh] flex-col items-center justify-center bg-bg-primary px-6 py-16 text-center text-text-primary">
    <p className="font-mono text-sm tracking-widest text-signal-red">404 · OFF THE CIRCUIT</p>
    <h1 className="mt-4 font-display text-5xl uppercase sm:text-7xl">This page is missing.</h1>
    <p className="mt-4 max-w-md text-base leading-relaxed text-text-secondary">The link may be outdated, or this driver, team or race is not part of the current season.</p>
    <div className="mt-8 flex flex-wrap justify-center gap-3"><Link className="bg-signal-red px-6 py-3 font-mono text-sm text-bg-ink" href="/">Return home</Link><Link className="border border-line-hi px-6 py-3 font-mono text-sm" href="/calendar">Explore the calendar</Link></div>
  </section>;
}
