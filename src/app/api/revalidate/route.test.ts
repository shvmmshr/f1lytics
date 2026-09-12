import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { state, path, tag } = vi.hoisted(() => ({ state: { isProduction: true, REVALIDATION_SECRET: "local-test-secret" as string | undefined }, path: vi.fn(), tag: vi.fn() }));
vi.mock("@/lib/env", () => ({ env: state }));
vi.mock("next/cache", () => ({ revalidatePath: path, revalidateTag: tag }));
import { POST } from "./route";

describe("on-demand data refresh", () => {
  beforeEach(() => { vi.clearAllMocks(); state.isProduction = true; state.REVALIDATION_SECRET = "local-test-secret"; });
  it("fails closed without a valid production secret", async () => {
    for (const secret of [undefined, "wrong", "local-test-secreu"]) {
      const response = await POST(new NextRequest("http://localhost/api/revalidate", { method: "POST", headers: secret ? { "x-revalidate-secret": secret } : {} }));
      expect(response.status).toBe(401);
    }
    state.REVALIDATION_SECRET = undefined;
    expect((await POST(new NextRequest("http://localhost/api/revalidate?secret=local-test-secret", { method: "POST" }))).status).toBe(401);
    expect(path).not.toHaveBeenCalled(); expect(tag).not.toHaveBeenCalled();
  });
  it("refreshes shared current feeds and all affected pages after authentication", async () => {
    const response = await POST(new NextRequest("http://localhost/api/revalidate?secret=wrong", { method: "POST", headers: { "x-revalidate-secret": "local-test-secret" } }));
    expect(response.status).toBe(200);
    expect(tag).toHaveBeenCalledWith("f1-current-season", { expire: 0 });
    expect(tag).toHaveBeenCalledWith("f1-news", { expire: 0 });
    for (const route of ["/circuits", "/news", "/garage", "/opengraph-image", "/twitter-image"]) expect(path).toHaveBeenCalledWith(route);
    expect(path).toHaveBeenCalledWith("/circuits/[slug]", "page");
  });
});
