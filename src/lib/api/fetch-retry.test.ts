import { afterEach, expect, it, vi } from "vitest";
import { fetchWithRetry } from "./fetch-retry";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
it("does not retry an intentional abort", async () => {
  const controller = new AbortController(); controller.abort();
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  await expect(fetchWithRetry("https://example.test", { signal: controller.signal })).rejects.toThrow();
  expect(fetcher).not.toHaveBeenCalled();
});
it("returns a non-retryable response immediately", async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 404 })); vi.stubGlobal("fetch", fetcher);
  expect((await fetchWithRetry("https://example.test")).status).toBe(404);
  expect(fetcher).toHaveBeenCalledOnce();
});
it("releases failed bodies and retries transient errors", async () => {
  vi.useFakeTimers();
  const failed = new Response("busy", { status: 429 });
  const cancel = vi.spyOn(failed.body!, "cancel");
  const fetcher = vi.fn().mockResolvedValueOnce(failed).mockResolvedValue(new Response("ok")); vi.stubGlobal("fetch", fetcher);
  const pending = fetchWithRetry("https://example.test", {}, 2);
  await vi.runAllTimersAsync();
  expect((await pending).status).toBe(200);
  expect(cancel).toHaveBeenCalledOnce();
  expect(fetcher).toHaveBeenCalledTimes(2);
});
