"use client";

import { useEffect, useState } from "react";
import { getNextEvent, type NextEvent } from "@/lib/constants/circuits";

/** Keep hydration identical to the server snapshot, then follow weekend rollover. */
export function useNextEvent(initialEvent?: NextEvent) {
  const [event, setEvent] = useState(initialEvent);
  useEffect(() => {
    const refresh = () => setEvent(getNextEvent());
    const initial = setTimeout(refresh, 0);
    const interval = setInterval(refresh, 30_000);
    return () => { clearTimeout(initial); clearInterval(interval); };
  }, []);
  return event;
}
