"use client";

import { startTransition, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { pageRefreshDue, pageRefreshInterval } from "@/lib/data/page-refresh";

/** ISR refreshes the server cache, but does not update an already-open page. */
export function DataRefresh() {
  const path = usePathname();
  const router = useRouter();
  useEffect(() => {
    const interval = pageRefreshInterval(path);
    if (interval === null) return;
    let last = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    function schedule() {
      clearTimeout(timer);
      if (document.visibilityState === "visible" && navigator.onLine) timer = setTimeout(tick, Math.max(10000, interval! - (Date.now() - last)));
    }
    function tick() {
      const editing = Boolean(document.activeElement?.matches("input, select, textarea, [contenteditable='true']") || document.querySelector("dialog[open], [role='dialog'][data-state='open']"));
      const now = Date.now();
      if (pageRefreshDue(last, now, interval!, document.visibilityState === "visible", navigator.onLine, editing)) {
        last = now;
        startTransition(() => router.refresh());
      }
      schedule();
    }
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("online", tick);
    window.addEventListener("offline", schedule);
    schedule();
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("online", tick);
      window.removeEventListener("offline", schedule);
    };
  }, [path, router]);
  return null;
}
