"use client";

import { track } from "@vercel/analytics";

/** Fixed event names and canonical IDs only. Local previews never send events. */
export function trackInteraction(name: "comparison_changed" | "comparison_shared", properties: { mode: string }) {
  if (typeof window === "undefined" || !["f1lytics.com", "www.f1lytics.com"].includes(window.location.hostname) || navigator.doNotTrack === "1") return;
  try { track(name, properties); } catch { /* Analytics must not block the tool. */ }
}
