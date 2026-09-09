import Link from "next/link";
import { F1 } from "./broadcast";

/** Explain provenance and partial results without inventing a fetch timestamp. */
export function DataNotice({ children, unavailable = false }: { children: React.ReactNode; unavailable?: boolean }) {
  if (!unavailable) {
    return (
      <details className="text-sm leading-relaxed" style={{ color: F1.fg2 }}>
        <summary className="w-fit cursor-pointer py-3 underline underline-offset-4">About these stats</summary>
        <div className="max-w-3xl pb-4">
          <p className="mb-2">{children}</p>
          <Link href="/about#methodology" className="inline-block py-2 underline underline-offset-4">Sources & methodology</Link>
        </div>
      </details>
    );
  }
  return (
    <aside className="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-l-2 px-4 py-3 text-sm leading-relaxed"
      aria-label="About this data"
      style={{ background: F1.bg2, color: F1.fg2, borderColor: unavailable ? F1.amber : F1.lineHi }}>
      <p className="m-0 flex-1 min-w-[200px]">{unavailable && <strong style={{ color: F1.amber }}>Partial data. </strong>}{children}</p>
    </aside>
  );
}
