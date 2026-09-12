"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { scrollEdges } from "@/lib/design/scroll-edges";

/** Server-rendered children stay untouched: scrolling only changes edge attributes. */
export function ScrollableRegion({ children, className, label, ...props }: ComponentProps<"div"> & { label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => {
      const edges = scrollEdges(element.scrollLeft, element.clientWidth, element.scrollWidth);
      element.dataset.scrollLeft = String(edges.left);
      element.dataset.scrollRight = String(edges.right);
      element.dataset.scrollReady = "true";
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    for (const child of element.children) observer.observe(child);
    element.addEventListener("scroll", update, { passive: true });
    return () => { observer.disconnect(); element.removeEventListener("scroll", update); };
  }, [children]);

  return <div {...props} ref={ref} role="region" aria-label={label} tabIndex={0} className={cn("min-w-0 overflow-x-auto scroll-fade-x", className)}>{children}</div>;
}
