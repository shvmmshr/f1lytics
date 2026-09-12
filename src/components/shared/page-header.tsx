import type { ReactNode } from "react";

/** The season/tool index header. Detail identities and the live desk have their own scale. */
export function PageHeader({ eyebrow, meta, title, description }: {
  eyebrow: string;
  meta: ReactNode;
  title: string;
  description?: string;
}) {
  return <header className="relative border-b border-line px-[var(--page-gutter)] pt-10 pb-7">
    <div className="flex flex-col items-start gap-2 font-mono text-[11px] uppercase sm:flex-row sm:flex-wrap sm:items-center sm:gap-3.5">
      <span className="shrink-0 tracking-[0.24em] text-signal-red">{eyebrow}</span>
      <span aria-hidden className="hidden h-px w-10 shrink-0 bg-line sm:block" />
      <span className="min-w-0 leading-relaxed tracking-[0.16em] text-text-muted">{meta}</span>
    </div>
    <h1 className="page-title mt-3">{title}<span className="text-signal-red">.</span></h1>
    {description && <p className="mt-3 max-w-[56ch] text-base leading-relaxed text-text-secondary">{description}</p>}
  </header>;
}
