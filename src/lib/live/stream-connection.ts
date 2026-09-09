export type StreamState = "connecting" | "live" | "offline" | "error";
export interface StreamSource {
  addEventListener(type: string, listener: (event: { data: string }) => void): void;
  close(): void;
}

/** A testable lifecycle shared by the hook's timer and visibility listener. */
export function createStreamConnection(options: {
  open: () => StreamSource;
  canConnect: () => boolean;
  now: () => number;
  onState: (state: StreamState) => void;
  onMessage: (type: "snapshot" | "update", data: string) => boolean;
}) {
  let source: StreamSource | null = null;
  let disposed = false;
  let retryAt = 0;
  let lastMessageAt = 0;
  let failures = 0;
  const disconnect = () => {
    const old = source;
    source = null;
    old?.close();
  };
  const retry = (state: StreamState, delay: number) => {
    disconnect();
    retryAt = options.now() + delay;
    options.onState(state);
  };
  const tick = () => {
    if (disposed) return;
    if (!options.canConnect()) {
      disconnect();
      retryAt = 0;
      options.onState("offline");
      return;
    }
    if (source && options.now() - lastMessageAt >= 45_000) retry("error", 5_000);
    if (source || options.now() < retryAt) return;
    options.onState("connecting");
    let next: StreamSource;
    try { next = options.open(); } catch { retry("error", 30_000); return; }
    source = next;
    lastMessageAt = options.now();
    for (const type of ["snapshot", "update"] as const) {
      next.addEventListener(type, (event) => {
        if (disposed || source !== next) return;
        if (!options.onMessage(type, event.data)) return;
        lastMessageAt = options.now();
        failures = 0;
        options.onState("live");
      });
    }
    next.addEventListener("offline", () => {
      if (!disposed && source === next) retry("offline", 30_000);
    });
    next.addEventListener("reconnect", () => {
      if (!disposed && source === next) retry("connecting", 1_000);
    });
    next.addEventListener("error", () => {
      if (!disposed && source === next) retry("error", Math.min(5_000 * 2 ** failures++, 60_000));
    });
  };
  return { tick, dispose: () => { disposed = true; disconnect(); } };
}
