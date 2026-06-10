// Free F1 news aggregation from public RSS feeds. Runs server-side (ISR-cached),
// so there are no client CORS issues and no API keys. Feeds verified working
// June 2026 (BBC, Motorsport.com, Autosport, The Race, PlanetF1).

export interface NewsItem {
  title: string;
  url: string;
  description: string;
  publishedAt: string; // ISO 8601
  imageUrl: string | null;
  source: string;
  sourceUrl: string;
}

interface Feed {
  name: string;
  url: string;
  siteUrl: string;
}

const FEEDS: Feed[] = [
  {
    name: "BBC Sport",
    url: "https://feeds.bbci.co.uk/sport/formula1/rss.xml",
    siteUrl: "https://www.bbc.co.uk/sport/formula1",
  },
  {
    name: "Motorsport.com",
    url: "https://www.motorsport.com/rss/f1/news/",
    siteUrl: "https://www.motorsport.com/f1/",
  },
  {
    name: "Autosport",
    url: "https://www.autosport.com/rss/f1/news/",
    siteUrl: "https://www.autosport.com/f1/",
  },
  {
    name: "The Race",
    url: "https://www.the-race.com/rss/",
    siteUrl: "https://www.the-race.com",
  },
  {
    name: "PlanetF1",
    url: "https://www.planetf1.com/ps-rss",
    siteUrl: "https://www.planetf1.com",
  },
];

const REVALIDATE_SECONDS = 900; // 15 min
const MAX_ITEMS_PER_FEED = 15;

function stripCdata(value: string): string {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

/** Extract the text content of the first `<tag>` (namespace-agnostic). */
function extractTag(xml: string, tag: string): string | null {
  const re = new RegExp(
    `<(?:[a-z0-9]+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[a-z0-9]+:)?${tag}>`,
    "i",
  );
  const m = xml.match(re);
  return m ? stripCdata(m[1]) : null;
}

/** Extract an attribute value from the first matching (possibly self-closing) tag. */
function extractAttr(xml: string, tag: string, attr: string): string | null {
  const re = new RegExp(`<(?:[a-z0-9]+:)?${tag}\\b[^>]*?\\s${attr}="([^"]*)"`, "i");
  const m = xml.match(re);
  return m ? m[1] : null;
}

function parseFeed(xml: string, feed: Feed): NewsItem[] {
  const chunks = xml.split(/<item\b/i).slice(1);
  const items: NewsItem[] = [];

  for (const raw of chunks.slice(0, MAX_ITEMS_PER_FEED)) {
    const content = raw.split(/<\/item>/i)[0] ?? raw;

    const title = extractTag(content, "title");
    const link = extractTag(content, "link");
    if (!title || !link) continue;

    const pubDate = extractTag(content, "pubDate");
    const rawDescription = extractTag(content, "description") ?? "";

    // Image: try the common enclosure / media:* tags in priority order.
    const imageUrl =
      extractAttr(content, "enclosure", "url") ??
      extractAttr(content, "thumbnail", "url") ??
      extractAttr(content, "content", "url") ??
      null;

    const description = decodeEntities(rawDescription)
      .replace(/<[^>]+>/g, "")
      .trim()
      .slice(0, 220);

    const publishedAt = pubDate ? new Date(pubDate) : new Date(NaN);

    items.push({
      title: decodeEntities(title.replace(/<[^>]+>/g, "")),
      url: link.replace(/^<!\[CDATA\[|\]\]>$/g, "").trim(),
      description,
      publishedAt: Number.isNaN(publishedAt.getTime())
        ? new Date(0).toISOString()
        : publishedAt.toISOString(),
      imageUrl,
      source: feed.name,
      sourceUrl: feed.siteUrl,
    });
  }

  return items;
}

/**
 * Fetch and merge all F1 news feeds. Failed feeds are logged and skipped — the
 * result is never empty because of one bad source. Deduped by URL, newest first.
 */
export async function fetchAllNews(maxItems = 40): Promise<NewsItem[]> {
  const settled = await Promise.allSettled(
    FEEDS.map(async (feed) => {
      const res = await fetch(feed.url, {
        next: { revalidate: REVALIDATE_SECONDS },
        headers: {
          // Some feeds (e.g. The Race) 301/serve-empty without a browser-like UA.
          "User-Agent": "Mozilla/5.0 (compatible; F1lytics/1.0; +https://f1lytics.com)",
          Accept: "application/rss+xml, application/xml, text/xml, */*",
        },
      });
      if (!res.ok) throw new Error(`${feed.name}: HTTP ${res.status}`);
      return parseFeed(await res.text(), feed);
    }),
  );

  const all: NewsItem[] = [];
  for (const result of settled) {
    if (result.status === "fulfilled") all.push(...result.value);
    else console.error("[f1lytics/news] feed failed:", result.reason);
  }

  const seen = new Set<string>();
  return all
    .filter((item) => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )
    .slice(0, maxItems);
}
