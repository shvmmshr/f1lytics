import { describe, expect, it, vi } from "vitest";
import { createDraftStorage } from "./draft-storage";

const blank = { p1: null, marginSeconds: "" };
const calls = { p1: "antonelli", marginSeconds: "4.250" };

function fixture(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  const storage = { getItem: vi.fn((key: string) => values.get(key) ?? null), setItem: vi.fn((key: string, value: string) => { values.set(key, value); }) };
  const session = (key: string) => createDraftStorage<typeof blank | typeof calls>(key, JSON.parse, () => storage);
  return { values, storage, session };
}

describe("draft restoration before persistence", () => {
  it("does not overwrite saved calls during the initial render or repeated effects", () => {
    const { session, storage, values } = fixture({ mexico: JSON.stringify(calls) });
    const draft = session("mexico");
    draft.persist(blank);
    draft.persist(blank);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(draft.restore()).toEqual(calls);
    draft.persist(calls);
    expect(JSON.parse(values.get("mexico")!)).toEqual(calls);
  });

  it("starts a new round with a closed write gate and restores only that round", () => {
    const otherCalls = { ...calls, p1: "verstappen" };
    const { session, values } = fixture({ mexico: JSON.stringify(calls), brazil: JSON.stringify(otherCalls) });
    const mexico = session("mexico");
    mexico.restore();
    const brazil = session("brazil");
    brazil.persist(calls);
    expect(brazil.restore()).toEqual(otherCalls);
    brazil.persist(otherCalls);
    expect(JSON.parse(values.get("mexico")!)).toEqual(calls);
    expect(JSON.parse(values.get("brazil")!)).toEqual(otherCalls);
  });

  it("lets saved server picks take precedence without reading a stale local draft", () => {
    const { session, storage, values } = fixture({ mexico: JSON.stringify(calls) });
    const draft = session("mexico");
    const saved = { ...calls, p1: "norris" };
    expect(draft.restore(true)).toBeNull();
    expect(storage.getItem).not.toHaveBeenCalled();
    draft.persist(saved);
    expect(JSON.parse(values.get("mexico")!)).toEqual(saved);
  });

  it.each([undefined, "{broken"])("permits subsequent edits with missing or corrupt storage: %s", (raw) => {
    const { session, values } = fixture(raw ? { mexico: raw } : {});
    const draft = session("mexico");
    expect(draft.restore()).toBeNull();
    draft.persist(calls);
    expect(JSON.parse(values.get("mexico")!)).toEqual(calls);
  });

  it("keeps editing usable when storage access is blocked", () => {
    const draft = createDraftStorage("mexico", JSON.parse, () => { throw new Error("Storage denied"); });
    expect(draft.restore()).toBeNull();
    expect(() => draft.persist(calls)).not.toThrow();
  });
});
