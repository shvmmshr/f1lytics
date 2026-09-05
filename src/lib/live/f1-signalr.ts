/**
 * F1 live-timing SignalR Core endpoints and the pieces shared by the SSE relay
 * (long-lived) and the snapshot endpoint (one-shot). Node runtime only: the
 * WebSocket upgrade needs custom headers and the negotiated cookie.
 */

export const STATUS_URL = "https://livetiming.formula1.com/static/StreamingStatus.json";
export const NEGOTIATE_URL = "https://livetiming.formula1.com/signalrcore/negotiate?negotiateVersion=1";
export const CONNECT_URL = "wss://livetiming.formula1.com/signalrcore";

/** ASP.NET Core SignalR frames each message with the 0x1e record separator. */
export const RS = "\x1e";

/** Timing topics for the tower + side panel. Position.z / CarData.z are
 *  deliberately excluded (compressed, and gated behind F1TV). */
export const TOPICS = [
  "SessionInfo",
  "DriverList",
  "TimingData",
  "TimingAppData",
  "TimingStats",
  "TrackStatus",
  "LapCount",
  "WeatherData",
  "RaceControlMessages",
  "ExtrapolatedClock",
];

/** Read F1's streaming status. Returns "Offline" on any failure (fail closed). */
export async function getStreamingStatus(): Promise<string> {
  try {
    const res = await fetch(STATUS_URL, { cache: "no-store" });
    if (!res.ok) return "Offline";
    const text = await res.text();
    // The file is served with a UTF-8 BOM, which breaks JSON.parse.
    const parsed = JSON.parse(text.replace(/^﻿/, "")) as { Status?: string };
    return parsed.Status ?? "Offline";
  } catch {
    return "Offline";
  }
}

export interface Negotiated {
  token: string;
  /** AWS load-balancer cookies that must be echoed on the WebSocket upgrade. */
  cookieHeader: string;
}

/** SignalR Core negotiate step. Returns null when F1 refuses or the shape is wrong. */
export async function negotiate(): Promise<Negotiated | null> {
  const negRes = await fetch(NEGOTIATE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0",
      "Accept-Encoding": "gzip,identity",
    },
    body: "{}",
    cache: "no-store",
  });
  if (!negRes.ok) return null;
  const negJson = (await negRes.json()) as { connectionToken?: string };
  if (!negJson.connectionToken) return null;
  const setCookies = negRes.headers.getSetCookie?.() ?? [];
  return { token: negJson.connectionToken, cookieHeader: setCookies.map((c) => c.split(";")[0]).join("; ") };
}
