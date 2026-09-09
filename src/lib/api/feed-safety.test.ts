import { expect, it } from "vitest";
import { decodeCodePoint, feedUrl, readBoundedFeed } from "./feed-safety";

it.each(["javascript:alert(1)", "data:text/html,test", "https://user:pass@example.com", "/relative"])("rejects unsafe feed URL %s", (value) => expect(feedUrl(value)).toBeNull());
it("preserves normal publisher URLs", () => expect(feedUrl("https://example.com/story?a=1&b=2")).toBe("https://example.com/story?a=1&b=2"));
it("tolerates invalid Unicode references without losing the feed", () => {
  expect(decodeCodePoint("2019", 16)).toBe("’");
  expect(decodeCodePoint("9999999999", 10)).toBe("�");
  expect(decodeCodePoint("d800", 16)).toBe("�");
});
it("limits actual response bytes even without a content length", async () => {
  await expect(readBoundedFeed(new Response("123456"), 5)).rejects.toThrow("size limit");
  await expect(readBoundedFeed(new Response("ééé"), 5)).rejects.toThrow("size limit");
  await expect(readBoundedFeed(new Response("12345"), 5)).resolves.toBe("12345");
});
