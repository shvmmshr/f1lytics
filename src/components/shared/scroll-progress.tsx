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
    if (SUPPORTS_SCROLL_TIMELINE) {
      // Clear the SSR-shipped scaleX(0) so the CSS scroll-timeline animation
      // takes over. Done here (not in JSX) because the server can't know the
      // browser's support — branching in render caused a hydration mismatch.
      if (barRef.current) barRef.current.style.transform = "";
      return; // CSS handles it — no listener needed.
    }

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
      // top-14 = just under the 56px sticky navbar. At top-0 the growing red
      // line overlays the nav's own red accents (active-tab bar, logo stripe)
      // and reads as the header itself shifting while you scroll.
      className="scroll-progress-bar fixed top-14 left-0 right-0 h-0.5 bg-status-red z-[49]"
      // Deterministic on server AND first client render (no support-dependent
      // branch — that differs between server and browser and breaks hydration).
      // The mount effect clears the transform when CSS scroll-timeline drives it.
      style={{
        transformOrigin: "left",
        transform: "scaleX(0)",
      }}
    />
  );
}
