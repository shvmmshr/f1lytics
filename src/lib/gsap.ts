"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Respect prefers-reduced-motion: collapse all GSAP tweens to near-instant so
// content still ends in its final (visible) state, but without perceived motion.
// (CSS animations/transitions are handled separately in globals.css.)
if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const apply = () => gsap.globalTimeline.timeScale(mq.matches ? 1000 : 1);
  apply();
  mq.addEventListener?.("change", apply);
}

export { gsap, ScrollTrigger };

export function animateCounter(
  element: HTMLElement,
  target: number,
  duration = 1.5
) {
  return gsap.to(element, {
    textContent: target,
    duration,
    ease: "power2.out",
    snap: { textContent: 1 },
    scrollTrigger: {
      trigger: element,
      start: "top 95%",
      once: true,
    },
  });
}

/**
 * Scroll-reveals cards with a short fade/rise. Per-element batching (not one
 * container-level trigger) so above-fold items appear immediately, plus a
 * safety pass that force-reveals anything a mis-measured trigger left hidden —
 * content can never be stranded at opacity 0.
 */
export function staggerEntrance(selector: string, container: HTMLElement) {
  const targets = gsap.utils.toArray<HTMLElement>(
    container.querySelectorAll(selector)
  );
  if (targets.length === 0) return;

  gsap.set(targets, { opacity: 0, y: 14 });
  ScrollTrigger.batch(targets, {
    start: "top 97%",
    once: true,
    onEnter: (els) =>
      gsap.to(els, {
        opacity: 1,
        y: 0,
        duration: 0.45,
        stagger: 0.04,
        ease: "power2.out",
        overwrite: true,
        clearProps: "opacity,transform",
      }),
  });
  // ScrollTrigger.refresh() forces a synchronous full-page layout recalc. It is
  // called once globally after the hero entrance settles (see hero.tsx), not on
  // every staggerEntrance() call, which is what made it expensive on mount.

  gsap.delayedCall(1.2, () => {
    const stranded = targets.filter(
      (el) => Number(gsap.getProperty(el, "opacity")) < 1
    );
    if (stranded.length === 0) return; // common case — nothing left hidden
    // Batch all layout reads in one pass before filtering, so we don't interleave
    // getBoundingClientRect() reads with anything that could dirty layout.
    // Only elements still in (or above) the viewport count as stranded —
    // below-fold cards keep their scroll reveal.
    const vh = window.innerHeight;
    const tops = stranded.map((el) => el.getBoundingClientRect().top);
    const visible = stranded.filter((_, i) => tops[i] < vh);
    if (visible.length > 0)
      gsap.to(visible, {
        opacity: 1,
        y: 0,
        duration: 0.3,
        overwrite: true,
        clearProps: "opacity,transform",
      });
  });
}

export function barFill(element: HTMLElement, targetWidthPercent: number) {
  return gsap.fromTo(
    element,
    { width: "0%" },
    {
      width: `${targetWidthPercent}%`,
      duration: 1.2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: element,
        start: "top 95%",
        once: true,
      },
    }
  );
}
