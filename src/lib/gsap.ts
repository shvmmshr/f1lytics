"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

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
      start: "top 85%",
    },
  });
}

export function staggerEntrance(selector: string, container: HTMLElement) {
  return gsap.fromTo(
    selector,
    { x: -30, y: 20, opacity: 0 },
    {
      x: 0,
      y: 0,
      opacity: 1,
      duration: 0.5,
      stagger: 0.06,
      ease: "power3.out",
      scrollTrigger: {
        trigger: container,
        start: "top 85%",
      },
    }
  );
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
        start: "top 85%",
      },
    }
  );
}
