import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-bg-primary">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <Link href="/" className="text-sm font-bold tracking-tighter text-text-primary">
            F1LYTICS
          </Link>
          <p className="mt-1 text-xs text-text-muted">
            F1 2026 Season &mdash; Unofficial fan project
          </p>
        </div>
        <p className="text-xs text-text-muted">
          Data from OpenF1 &amp; Jolpica-F1 APIs
        </p>
      </div>
    </footer>
  );
}
