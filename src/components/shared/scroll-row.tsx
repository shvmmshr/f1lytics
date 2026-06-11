"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { F1 } from "@/components/shared/broadcast";

/**
 * Horizontally scrollable row with edge chevron buttons so mouse users (no
 * touchpad/touch) can page through. Buttons render only when that direction
 * has overflow left to scroll.
 */
export function ScrollRow({
  children,
  className,
  style,
  ariaLabel = "Scrollable row",
  centerSelector,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  /** CSS selector for a child to center horizontally on first mount (e.g. the
   *  active/next item). Centered instantly so there's no left→center flash. */
  centerSelector?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [update]);

  // Center the active item once on mount. rect-delta math avoids offsetParent
  // ambiguity and accounts for any pre-existing scroll. clamped so the first/
  // last items don't leave the row scrolled into empty space.
  useEffect(() => {
    if (!centerSelector) return;
    const el = ref.current;
    if (!el) return;
    const target = el.querySelector<HTMLElement>(centerSelector);
    if (!target) return;
    const elRect = el.getBoundingClientRect();
    const tRect = target.getBoundingClientRect();
    const current = tRect.left - elRect.left;
    const desired = el.clientWidth / 2 - tRect.width / 2;
    const next = el.scrollLeft + (current - desired);
    el.scrollLeft = Math.max(0, Math.min(next, el.scrollWidth - el.clientWidth));
    update();
  }, [centerSelector, update]);

  const page = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const btnStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: 36,
    height: 48,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(8,8,10,0.92)",
    border: `1px solid ${F1.lineHi}`,
    color: F1.fg,
    fontSize: 18,
    lineHeight: 1,
    cursor: "pointer",
    zIndex: 10,
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        role="region"
        aria-label={ariaLabel}
        className={cn(
          "flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
          className,
        )}
        style={style}
      >
        {children}
      </div>
      {canLeft && (
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => page(-1)}
          className="transition-colors hover:bg-white/10"
          style={{ ...btnStyle, left: 0 }}
        >
          ‹
        </button>
      )}
      {canRight && (
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => page(1)}
          className="transition-colors hover:bg-white/10"
          style={{ ...btnStyle, right: 0 }}
        >
          ›
        </button>
      )}
    </div>
  );
}
