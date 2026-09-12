"use client";

import { useEffect, useRef, useState } from "react";
import { NewsImage } from "@/components/shared/news-image";

export interface NewsCardItem {
  title: string;
  url: string;
  imageUrl: string | null;
  source: string;
  timeLabel: string;
  corroboration: number;
}

const BATCH_SIZE = 9;

/** Top stories stay server-owned; the chronological tail is revealed on demand. */
export function NewsStories({ items }: { items: NewsCardItem[] }) {
  const [visible, setVisible] = useState(BATCH_SIZE);
  const [announcement, setAnnouncement] = useState("");
  const grid = useRef<HTMLDivElement>(null);
  const firstNew = useRef<number | null>(null);
  useEffect(() => {
    if (firstNew.current === null) return;
    grid.current?.querySelectorAll<HTMLAnchorElement>("a")[firstNew.current]?.focus({ preventScroll: true });
    firstNew.current = null;
  }, [visible]);

  const showMore = () => {
    const next = Math.min(visible + BATCH_SIZE, items.length);
    firstNew.current = visible;
    setVisible(next);
    setAnnouncement(`${next - visible} more stories shown. Showing ${next} of ${items.length}.`);
  };

  return <>
    <div ref={grid} id="chronological-stories" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.slice(0, visible).map((item) => <a key={item.url} href={item.url} target="_blank" rel="noopener noreferrer" className="group flex flex-col border border-line bg-bg-secondary text-text-primary transition-shadow hover:shadow-[inset_0_0_0_999px_#ffffff08]">
        {item.imageUrl && <div className="relative aspect-video overflow-hidden border-b border-line bg-bg-tertiary"><NewsImage src={item.imageUrl} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 460px" className="transition-transform duration-300 group-hover:scale-[1.03]" /></div>}
        <div className="flex flex-1 flex-col px-[18px] pt-3.5 pb-[18px]">
          <div className="flex flex-wrap gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-wider"><span className="text-signal-red">{item.source}</span><span className="text-text-muted">· {item.timeLabel}</span>{item.corroboration > 0 && <span className="text-signal-amber">· {item.corroboration + 1} sources</span>}</div>
          <h3 className="font-display mt-2 text-lg leading-snug font-semibold">{item.title}</h3>
        </div>
      </a>)}
    </div>
    <div className="mt-6 flex flex-wrap items-center gap-4">
      {visible < items.length && <button type="button" onClick={showMore} aria-controls="chronological-stories" className="control-md border border-line-hi px-5 font-mono text-xs uppercase tracking-wider hover:bg-bg-tertiary">Show {Math.min(BATCH_SIZE, items.length - visible)} more stories <span aria-hidden className="ml-3">↓</span></button>}
      <p className="text-sm text-text-secondary">{Math.min(visible, items.length)} of {items.length} recent stories</p>
    </div>
    <p role="status" className="sr-only">{announcement}</p>
    <noscript><p className="mt-4 text-sm text-text-secondary">Showing the most recent reports. Follow the publisher links above for full coverage.</p></noscript>
  </>;
}
