"use client";

import { useEffect, useRef, useState } from "react";

/** Defer browser-heavy panels until they approach the viewport. */
export function DeferredPanel({ children, height = 320, label = "Loading chart" }: { children: React.ReactNode; height?: number; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      const timer = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(timer);
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: "400px" });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} style={{ minHeight: height }}>{visible ? children : <div className="flex items-center justify-center border border-line bg-bg-secondary text-sm text-text-secondary" style={{ height }}>{label}<noscript> · Enable JavaScript for interactive charts.</noscript></div>}</div>;
}
