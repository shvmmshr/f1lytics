"use client";

import { useEffect, useRef } from "react";

// Where supported, the bar is driven entirely by CSS `animation-timeline: scroll()`
// (see .scroll-progress-bar in globals.css) — zero JS after mount, runs on the
// compositor. Older browsers fall back to a rAF-coalesced ref write below. Either
// way there is no React state and no re-render on scroll.
const SUPPORTS_SCROLL_TIMELINE =
  typeof CSS !== "undefined" &&
  typeof CSS.supports === "function" &&
  CSS.supports("animation-timeline: scroll()");

export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (SUPPORTS_SCROLL_TIMELINE) return; // CSS handles it — no listener needed.

    let rafId = 0;
    function onScroll() {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const p = docHeight > 0 ? Math.min(window.scrollY / docHeight, 1) : 0;
        if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={barRef}
      className="scroll-progress-bar fixed top-0 left-0 right-0 h-0.5 bg-status-red z-[100]"
      style={{
        transformOrigin: "left",
        // CSS keyframes drive the transform when supported; otherwise start at 0.
        transform: SUPPORTS_SCROLL_TIMELINE ? undefined : "scaleX(0)",
      }}
    />
  );
}
