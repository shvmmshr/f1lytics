import type { NextRequest } from "next/server";
import WebSocket from "ws";

// F1's free live-timing feed, proxied as Server-Sent Events so the browser gets
// real-time timing without F1 auth or CORS issues.
//
// IMPORTANT (2025+): F1 migrated the feed from the legacy ASP.NET SignalR hub
// (`/signalr`, now 401 Basic/Bearer) to ASP.NET Core SignalR (`/signalrcore`).
// The new hub accepts UNAUTHENTICATED connections — all timing topics stream
// freely; only Position.z (GPS) and CarData.z (telemetry) are gated behind an
// F1TV token, and we don't subscribe to those. Node runtime is required for `ws`
// (custom WS headers + cookie echo); fluid compute allows ~5 min, after which the
// client EventSource auto-reconnects and gets a fresh snapshot.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const STATUS_URL = "https://livetiming.formula1.com/static/StreamingStatus.json";
const NEGOTIATE_URL =
  "https://livetiming.formula1.com/signalrcore/negotiate?negotiateVersion=1";
const CONNECT_URL = "wss://livetiming.formula1.com/signalrcore";

// ASP.NET Core SignalR frames each message with the 0x1e record separator.
const RS = "\x1e";

// Timing topics for the tower + side panel. We deliberately skip Position.z /
// CarData.z (zlib-deflated, and gated behind F1TV since the 2025 Dutch GP).
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
const HEARTBEAT_MS = 15_000; // SSE keep-alive to the browser
const WS_PING_MS = 10_000; // SignalR Core ping to F1 to keep the socket open

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

  // A one-shot stream that emits a single `offline` event then closes, so the
  // client stops retrying and falls back to OpenF1 / locked-live / idle.
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

  // Negotiate (POST, SignalR Core): returns a connectionToken + AWS load-balancer
  // cookies that must be echoed back on the WebSocket upgrade (else CloudFront 404s).
  let token: string;
  let cookieHeader: string;
  try {
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
    if (!negRes.ok) return offlineStream();
    const negJson = (await negRes.json()) as { connectionToken?: string };
    if (!negJson.connectionToken) return offlineStream();
    token = negJson.connectionToken;
    const setCookies = negRes.headers.getSetCookie?.() ?? [];
    cookieHeader = setCookies.map((c) => c.split(";")[0]).join("; ");
  } catch (err) {
    console.error("[f1lytics] live-stream negotiate failed:", err);
    return offlineStream();
  }

  const wsUrl = `${CONNECT_URL}?id=${encodeURIComponent(token)}`;

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      let subscribed = false;
      let heartbeat: ReturnType<typeof setInterval> | undefined;
      let wsPing: ReturnType<typeof setInterval> | undefined;
      let maxTimer: ReturnType<typeof setTimeout> | undefined;

      const ws = new WebSocket(wsUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0",
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
        clearInterval(wsPing);
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

      const wsSend = (obj: unknown) => {
        try {
          ws.send(JSON.stringify(obj) + RS);
        } catch {
          /* noop */
        }
      };

      ws.on("open", () => {
        // SignalR Core handshake — must precede any hub invocation.
        wsSend({ protocol: "json", version: 1 });
      });

      ws.on("message", (raw: WebSocket.RawData) => {
        // Frames are 0x1e-separated; a single payload may carry several.
        for (const part of raw.toString().split(RS)) {
          if (!part) continue;
          let msg: {
            type?: number;
            target?: string;
            result?: Record<string, unknown>;
            arguments?: unknown[];
          };
          try {
            msg = JSON.parse(part);
          } catch {
            continue;
          }

          // The handshake response is an empty object (no `type`). Once it
          // arrives, subscribe to all timing topics in one invocation.
          if (msg.type === undefined) {
            if (!subscribed) {
              subscribed = true;
              wsSend({
                type: 1,
                invocationId: "0",
                target: "Subscribe",
                arguments: [TOPICS],
              });
            }
            continue;
          }

          // type 3 = completion of our Subscribe: `result` is the full snapshot.
          if (msg.type === 3 && msg.result) {
            send("snapshot", msg.result);
          } else if (msg.type === 1 && msg.target === "feed" && msg.arguments) {
            // Partial delta: [topic, data, timestamp].
            send("update", { topic: msg.arguments[0], data: msg.arguments[1] });
          }
          // type 6 = ping from server; nothing to forward.
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

      // Keep the SignalR Core socket alive (ping type 6).
      wsPing = setInterval(() => {
        if (closed) return;
        wsSend({ type: 6 });
      }, WS_PING_MS);

      // SSE keep-alive comment so proxies don't drop the response.
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
