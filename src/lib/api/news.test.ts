import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAllNews } from "./news";

const item = (title: string, link: string) => `<item><title>${title}</title><link>${link}</link><pubDate>Mon, 02 Nov 2026 12:00:00 GMT</pubDate></item>`;
const rss = (items: string[]) => `<rss><channel>${items.join("")}</channel></rss>`;
function mockFeeds(mixedItems: string[]) {
  vi.stubGlobal("fetch", vi.fn(async (input: string) => new Response(input.includes("the-race.com")
    ? rss(mixedItems)
    : rss([item("Formula 1 paddock report", "https://example.com/paddock-report")]))));
}
afterEach(() => vi.unstubAllGlobals());

describe("F1-only news aggregation", () => {
  it("excludes other series even when a MotoGP headline mentions F1, and keeps F1 coverage", async () => {
    mockFeeds([
      item("F1 champion praises MotoGP winner", "https://www.the-race.com/motogp/f1-champion-praises-winner/"),
      item("IndyCar transfer news", "https://www.the-race.com/indycar/transfer-news/"),
      item("Antonelli wins the title", "https://www.the-race.com/formula-1/antonelli-wins-title/"),
      item("What F1 can learn from MotoGP", "https://the-race.com/formula-1/learning-from-motogp/"),
    ]);
    const news = await fetchAllNews();
    expect(news.filter((entry) => entry.source === "The Race").map((entry) => entry.url)).toEqual([
      "https://www.the-race.com/formula-1/antonelli-wins-title/",
      "https://the-race.com/formula-1/learning-from-motogp/",
    ]);
    expect(news.some((entry) => entry.source !== "The Race")).toBe(true);
  });

  it("applies the per-feed cap after filtering unrelated stories", async () => {
    mockFeeds([
      ...Array.from({ length: 15 }, (_, i) => item(`MotoGP report ${i}`, `https://www.the-race.com/motogp/report-${i}/`)),
      item("Hamilton and Ferrari prepare for Brazil", "https://www.the-race.com/formula-1/hamilton-brazil/"),
    ]);
    const news = await fetchAllNews();
    expect(news.filter((entry) => entry.source === "The Race")).toHaveLength(1);
    expect(news.some((entry) => entry.url.endsWith("/hamilton-brazil/"))).toBe(true);
  });

  it("accepts at most fifteen F1 articles and rejects lookalike publishers and sections", async () => {
    mockFeeds([
      item("External article", "https://example.com/formula-1/external/"),
      item("Publisher lookalike", "https://www.the-race.com.example.com/formula-1/lookalike/"),
      item("Section lookalike", "https://www.the-race.com/formula-1-extra/lookalike/"),
      ...Array.from({ length: 20 }, (_, i) => item(`Uniqueheadline${i}`, `https://www.the-race.com/formula-1/report-${i}/`)),
    ]);
    const articles = (await fetchAllNews()).filter((entry) => entry.source === "The Race");
    expect(articles).toHaveLength(15);
    expect(articles[0].url).toBe("https://www.the-race.com/formula-1/report-0/");
    expect(articles[14].url).toBe("https://www.the-race.com/formula-1/report-14/");
  });
});
