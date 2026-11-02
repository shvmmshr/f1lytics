import { afterEach, describe, expect, it, vi } from "vitest";
import { requestLockIn } from "./client-request";

afterEach(() => vi.unstubAllGlobals());

describe("retryable Lock In requests", () => {
  it.each([
    ["/api/lockin/profile", "PATCH"],
    ["/api/lockin/leagues", "POST"],
    ["/api/lockin/leagues/ABCDEFGH/join", "POST"],
  ])("resolves a rejected %s request to an error and allows a successful retry", async (url, method) => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(Response.json({ code: "ABCDEFGH" }));
    vi.stubGlobal("fetch", fetchMock);
    const failed = await requestLockIn(url, { method }, "Could not save.");
    expect(failed).toEqual({ ok: false, error: "Network problem. Check your connection and try again." });
    expect(await requestLockIn(url, { method }, "Could not save.")).toEqual({ ok: true, data: { code: "ABCDEFGH" } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("preserves a server validation message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "League is full." }, { status: 409 })));
    expect(await requestLockIn("/test", {}, "Could not join.")).toEqual({ ok: false, error: "League is full." });
  });

  it("uses the form's fallback for a non-JSON HTTP failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Unavailable", { status: 503 })));
    expect(await requestLockIn("/test", {}, "Could not join.")).toEqual({ ok: false, error: "Could not join." });
  });
});
