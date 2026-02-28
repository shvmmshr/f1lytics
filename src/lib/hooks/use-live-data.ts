"use client";

import { useQuery } from "@tanstack/react-query";
import * as openf1 from "@/lib/api/openf1";

/**
 * Poll live position data every 5 seconds.
 * Returns the full array of OpenF1Position entries for the session.
 */
export function useLivePositions(sessionKey: number | null) {
  return useQuery({
    queryKey: ["live-positions", sessionKey],
    queryFn: () => openf1.getPositions({ session_key: sessionKey! }),
    enabled: !!sessionKey,
    refetchInterval: 5_000,
  });
}

/**
 * Poll live gap / interval data every 5 seconds.
 */
export function useLiveIntervals(sessionKey: number | null) {
  return useQuery({
    queryKey: ["live-intervals", sessionKey],
    queryFn: () => openf1.getIntervals({ session_key: sessionKey! }),
    enabled: !!sessionKey,
    refetchInterval: 5_000,
  });
}

/**
 * Poll race control messages (flags, safety car, penalties) every 10 seconds.
 */
export function useLiveRaceControl(sessionKey: number | null) {
  return useQuery({
    queryKey: ["live-race-control", sessionKey],
    queryFn: () => openf1.getRaceControl({ session_key: sessionKey! }),
    enabled: !!sessionKey,
    refetchInterval: 10_000,
  });
}

/**
 * Poll car location coordinates every 5 seconds.
 * Optionally filter by driver number.
 */
export function useLiveLocations(
  sessionKey: number | null,
  driverNumber?: number
) {
  return useQuery({
    queryKey: ["live-locations", sessionKey, driverNumber],
    queryFn: () =>
      openf1.getLocations({
        session_key: sessionKey!,
        driver_number: driverNumber,
      }),
    enabled: !!sessionKey,
    refetchInterval: 5_000,
  });
}
