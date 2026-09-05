import WebSocket from "ws";
import { CONNECT_URL, RS, TOPICS, negotiate } from "./f1-signalr";
import type { FeedState } from "./feed-adapter";

/**
 * One-shot read of the F1 feed: negotiate, connect, subscribe, take the first
 * full snapshot, close. Used by the cached homepage endpoint so many visitors
 * share one short connection instead of each holding a relay socket.
 */
export async function fetchFeedSnapshot(timeoutMs = 8_000): Promise<FeedState | null> {
  const negotiated = await negotiate();
  if (!negotiated) return null;
  const wsUrl = `${CONNECT_URL}?id=${encodeURIComponent(negotiated.token)}`;

  return new Promise<FeedState | null>((resolve) => {
    let settled = false;
    let subscribed = false;
    const ws = new WebSocket(wsUrl, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept-Encoding": "gzip,identity", Cookie: negotiated.cookieHeader },
    });
    const finish = (value: FeedState | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        ws.close();
      } catch {
        /* noop */
      }
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    const send = (obj: unknown) => {
      try {
        ws.send(JSON.stringify(obj) + RS);
      } catch {
        /* noop */
      }
    };
    ws.on("open", () => send({ protocol: "json", version: 1 }));
    ws.on("message", (raw: WebSocket.RawData) => {
      for (const part of raw.toString().split(RS)) {
        if (!part) continue;
        let msg: { type?: number; result?: unknown };
        try {
          msg = JSON.parse(part);
        } catch {
          continue;
        }
        if (msg.type === undefined) {
          if (!subscribed) {
            subscribed = true;
            send({ type: 1, invocationId: "0", target: "Subscribe", arguments: [TOPICS] });
          }
          continue;
        }
        if (msg.type === 3 && msg.result && typeof msg.result === "object") {
          finish(msg.result as FeedState);
          return;
        }
      }
    });
    ws.on("error", () => finish(null));
    ws.on("close", () => finish(null));
  });
}
