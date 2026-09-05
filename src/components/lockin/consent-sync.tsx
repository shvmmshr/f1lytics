"use client";

import { useEffect } from "react";

/**
 * After sign-in, forward the newsletter choice made on the sign-in form to
 * the profile once, then forget it. Mounted in the Lock In layout.
 */
export function ConsentSync({ signedIn }: { signedIn: boolean }) {
  useEffect(() => {
    if (!signedIn) return;
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("lockin-consent");
    } catch {
      return;
    }
    if (stored !== "yes" && stored !== "no") return;
    fetch("/api/lockin/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newsletterOptIn: stored === "yes" }),
    })
      .then((res) => {
        if (res.ok) localStorage.removeItem("lockin-consent");
      })
      .catch(() => undefined);
  }, [signedIn]);
  return null;
}
