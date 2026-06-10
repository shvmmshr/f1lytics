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
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
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
