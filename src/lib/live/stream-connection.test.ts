import { describe, expect, it, vi } from "vitest";
import { createStreamConnection, type StreamSource } from "./stream-connection";
import { positiveInteger } from "./request";

function setup() {
  let time = 0;
  let allowed = true;
  const sources: (StreamSource & { emit: (type: string, data?: string) => void })[] = [];
  const onState = vi.fn();
  const onMessage = vi.fn(() => true);
  const connection = createStreamConnection({ now: () => time, canConnect: () => allowed, onState, onMessage, open: () => {
    const listeners = new Map<string, (event: { data: string }) => void>();
    const source = { addEventListener: (type: string, listener: (event: { data: string }) => void) => { listeners.set(type, listener); }, close: vi.fn(), emit: (type: string, data = "{}") => listeners.get(type)?.({ data }) };
    sources.push(source);
    return source;
  } });
  return { connection, sources, onState, onMessage, advance: (ms: number) => { time += ms; connection.tick(); }, allow: (value: boolean) => { allowed = value; connection.tick(); } };
}

describe("live stream lifecycle", () => {
  it("re-arms from an idle window and pauses when hidden", () => {
    const s = setup(); s.allow(false); expect(s.sources).toHaveLength(0);
    s.allow(true); expect(s.sources).toHaveLength(1);
    s.sources[0].emit("snapshot"); expect(s.onState).toHaveBeenLastCalledWith("live");
    s.allow(false); expect(s.sources[0].close).toHaveBeenCalledOnce();
    s.allow(true); expect(s.sources).toHaveLength(2);
  });
  it("retries offline replies without treating old messages as current", () => {
    const s = setup(); s.connection.tick(); s.sources[0].emit("offline");
    s.advance(29_999); expect(s.sources).toHaveLength(1);
    s.advance(1); expect(s.sources).toHaveLength(2);
    s.sources[0].emit("update"); expect(s.onMessage).not.toHaveBeenCalled();
  });
  it("expires silent connections and stops permanently on disposal", () => {
    const s = setup(); s.connection.tick(); s.advance(45_000);
    expect(s.onState).toHaveBeenLastCalledWith("error");
    s.advance(5_000); expect(s.sources).toHaveLength(2);
    s.connection.dispose(); s.advance(100_000);
    expect(s.sources).toHaveLength(2);
    expect(s.sources[1].close).toHaveBeenCalledOnce();
  });
  it("backs off errors and resets after valid data", () => {
    const s = setup(); s.connection.tick(); s.sources[0].emit("error");
    s.advance(5_000); s.sources[1].emit("error"); s.advance(5_000);
    expect(s.sources).toHaveLength(2);
    s.advance(5_000); s.sources[2].emit("snapshot"); s.sources[2].emit("error");
    s.advance(5_000); expect(s.sources).toHaveLength(4);
  });
});

describe("live request validation", () => {
  it.each([null, "", "0", "-1", "1.2", "1e3", "123bad", " 12", "999999999999999999"])("rejects %s", (value) => expect(positiveInteger(value)).toBeNull());
  it("accepts complete identifiers within the requested bound", () => {
    expect(positiveInteger("12345")).toBe(12345);
    expect(positiveInteger("99", 99)).toBe(99);
    expect(positiveInteger("100", 99)).toBeNull();
  });
});
