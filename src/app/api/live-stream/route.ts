import type { NextRequest } from "next/server";
import WebSocket from "ws";

// F1's free live-timing SignalR feed (same source FastF1 / f1-dash use). We proxy
// it through this route as Server-Sent Events so the browser gets real-time timing
// without F1 auth and without CORS issues. Node runtime is required for `ws`
// (custom WebSocket request headers); fluid compute lets the function run up to
// ~5 min, after which the client EventSource auto-reconnects and gets a fresh
// snapshot — so nothing is lost across the reconnect.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const STATUS_URL = "https://livetiming.formula1.com/static/StreamingStatus.json";
const NEGOTIATE_URL = "https://livetiming.formula1.com/signalr/negotiate";
const CONNECT_URL = "wss://livetiming.formula1.com/signalr/connect";
const HUB = JSON.stringify([{ name: "Streaming" }]);

// Topics needed for the timing tower + side panel. We deliberately skip the
// zlib-deflated CarData.z / Position.z telemetry streams (not needed for timing,
// and they'd require inflate handling).
const TOPICS = [
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

const RECONNECT_MARGIN_MS = 280_000; // close before the 300s function cap
const HEARTBEAT_MS = 15_000;

/** Read F1's streaming status. Returns "Offline" on any failure (fail closed). */
async function getStreamingStatus(): Promise<string> {
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

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  // A minimal one-shot stream that emits a single `offline` event then closes,
  // so the client can stop retrying and fall back to OpenF1/replay/idle.
  const offlineStream = () =>
    new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`event: offline\ndata: {}\n\n`));
          controller.close();
        },
      }),
      { headers: sseHeaders() },
    );

  const status = await getStreamingStatus();
  if (status === "Offline") return offlineStream();

  // Negotiate: returns a ConnectionToken + AWS load-balancer cookies that must be
  // echoed back on the WebSocket upgrade. Returns 401 when no session is live.
  let token: string;
  let cookieHeader: string;
  try {
    const negUrl = `${NEGOTIATE_URL}?connectionData=${encodeURIComponent(HUB)}&clientProtocol=1.5`;
    const negRes = await fetch(negUrl, {
      headers: { "User-Agent": "BestHTTP", "Accept-Encoding": "gzip,identity" },
      cache: "no-store",
    });
    if (!negRes.ok) return offlineStream();
    const negJson = (await negRes.json()) as { ConnectionToken?: string };
    if (!negJson.ConnectionToken) return offlineStream();
    token = negJson.ConnectionToken;
    const setCookies = negRes.headers.getSetCookie?.() ?? [];
    cookieHeader = setCookies.map((c) => c.split(";")[0]).join("; ");
  } catch (err) {
    console.error("[f1lytics] live-stream negotiate failed:", err);
    return offlineStream();
  }

  const wsUrl =
    `${CONNECT_URL}?clientProtocol=1.5&transport=webSockets` +
    `&connectionToken=${encodeURIComponent(token)}` +
    `&connectionData=${encodeURIComponent(HUB)}`;

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      let heartbeat: ReturnType<typeof setInterval>;
      let maxTimer: ReturnType<typeof setTimeout>;

      const ws = new WebSocket(wsUrl, {
        headers: {
          "User-Agent": "BestHTTP",
          "Accept-Encoding": "gzip,identity",
          Cookie: cookieHeader,
        },
      });

      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          cleanup();
        }
      };

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        clearTimeout(maxTimer);
        try {
          ws.close();
        } catch {
          /* noop */
        }
        try {
          controller.close();
        } catch {
          /* noop */
        }
      };

      ws.on("open", () => {
        // SignalR hub invocation: subscribe to all timing topics at once.
        ws.send(
          JSON.stringify({ H: "Streaming", M: "Subscribe", A: [TOPICS], I: 1 }),
        );
      });

      ws.on("message", (raw: WebSocket.RawData) => {
        let msg: { R?: unknown; M?: Array<{ M?: string; A?: unknown[] }> };
        try {
          msg = JSON.parse(raw.toString());
        } catch {
          return;
        }
        // `R` = the reply to our Subscribe invocation: a full snapshot of every
        // subscribed topic. `M` = subsequent feed messages (partial deltas).
        if (msg.R) {
          send("snapshot", msg.R);
        } else if (Array.isArray(msg.M)) {
          for (const m of msg.M) {
            if (m.M === "feed" && Array.isArray(m.A)) {
              send("update", { topic: m.A[0], data: m.A[1], timestamp: m.A[2] });
            }
          }
        }
      });

      ws.on("error", (err: Error) => {
        console.error("[f1lytics] live-stream ws error:", err.message);
        send("offline", {});
        cleanup();
      });
      ws.on("close", () => {
        send("reconnect", {});
        cleanup();
      });

      heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          cleanup();
        }
      }, HEARTBEAT_MS);

      // Close before the serverless cap; client reconnects and gets a fresh snapshot.
      maxTimer = setTimeout(() => {
        send("reconnect", {});
        cleanup();
      }, RECONNECT_MARGIN_MS);

      req.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, { headers: sseHeaders() });
}

function sseHeaders(): HeadersInit {
  return {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  };
}
