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
  /** How many OTHER sources ran a near-identical headline (set by fetchAllNews). */
  corroboration?: number;
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

/** Named entities feeds emit beyond the basic set (smart quotes, dashes, …). */
const NAMED_ENTITIES: Record<string, string> = {
  apos: "'",
  nbsp: " ",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  hellip: "…",
  ndash: "–",
  mdash: "—",
  trade: "™",
  copy: "©",
  reg: "®",
  deg: "°",
};

function decodeEntities(value: string): string {
  return (
    value
      // Numeric entities (decimal &#8217; and hex &#x2019;) — covers curly
      // quotes, dashes, ellipses, accented letters, etc. without a huge table.
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
        String.fromCodePoint(parseInt(hex, 16))
      )
      .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&([a-z]+);/gi, (match, name) =>
        name.toLowerCase() in NAMED_ENTITIES
          ? NAMED_ENTITIES[name.toLowerCase()]
          : match
      )
      // &amp; last so a literal "&amp;lt;" doesn't get double-decoded above.
      .replace(/&amp;/g, "&")
  );
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

/** Tokenize a headline for near-duplicate comparison. */
function titleTokens(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3),
  );
}

/** Jaccard similarity of two token sets. */
function similarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

const IMPORTANT_KEYWORDS = [
  "fia", "steward", "penalty", "penalt", "ban", "disqualif", "protest",
  "confirm", "official", "announce", "statement", "ruling", "verdict",
  "sign", "contract", "deal", "exit", "leave", "join", "replace", "sack",
  "retire", "champion", "title", "win", "victory", "pole", "crash",
  "injur", "cancel", "postpone", "investigat", "breach", "appeal",
];

/**
 * Heuristic importance score for surfacing "big" stories: decision/announcement
 * keywords + corroboration (how many sources ran a near-identical headline).
 */
export function scoreImportance(item: NewsItem, corroboration = 0): number {
  const t = item.title.toLowerCase();
  let score = corroboration * 3;
  for (const kw of IMPORTANT_KEYWORDS) if (t.includes(kw)) score += 1;
  const ageHours =
    (Date.now() - new Date(item.publishedAt).getTime()) / 3_600_000;
  if (ageHours < 6) score += 2;
  else if (ageHours < 24) score += 1;
  return score;
}

/**
 * Fetch and merge all F1 news feeds. Failed feeds are logged and skipped — the
 * result is never empty because of one bad source. Deduped by URL AND by
 * near-identical headline across sources (outlets often run the same story);
 * newest first. Items deduped by headline get `corroboration` bumped so the
 * importance score can reward multi-source stories.
 */
export async function fetchAllNews(
  maxItems = 40,
  opts: { noCache?: boolean } = {},
): Promise<NewsItem[]> {
  const settled = await Promise.allSettled(
    FEEDS.map(async (feed) => {
      const res = await fetch(feed.url, {
        // noCache path is for the live diagnostic (?fresh=1); normal path is ISR.
        ...(opts.noCache
          ? { cache: "no-store" as const }
          : { next: { revalidate: REVALIDATE_SECONDS } }),
        // Per-feed timeout: a single hung feed must not stall the whole render
        // past the serverless function limit (which would blank ALL news).
        signal: AbortSignal.timeout(8000),
        headers: {
          // A browser-like UA: some feeds 301/serve-empty (or, from datacenter
          // IPs, return a bot-challenge page) without one.
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          Accept: "application/rss+xml, application/xml, text/xml, */*",
        },
      });
      if (!res.ok) throw new Error(`${feed.name}: HTTP ${res.status}`);
      // Size guard: a compromised/misbehaving feed could serve an enormous
      // body that the regex parser would then buffer and scan in full.
      const MAX_FEED_BYTES = 3_000_000;
      const declared = Number(res.headers.get("content-length"));
      if (Number.isFinite(declared) && declared > MAX_FEED_BYTES) {
        throw new Error(`${feed.name}: feed too large (${declared}b)`);
      }
      let text = await res.text();
      if (text.length > MAX_FEED_BYTES) text = text.slice(0, MAX_FEED_BYTES);
      // A 200 that isn't a feed (e.g. a Cloudflare/bot challenge served to
      // datacenter IPs) parses to zero items silently — flag it instead.
      if (!/<(?:rss|feed|item|rdf)\b/i.test(text)) {
        throw new Error(
          `${feed.name}: 200 but non-feed response (${text.length}b) — likely IP/bot block`,
        );
      }
      const items = parseFeed(text, feed);
      if (items.length === 0) throw new Error(`${feed.name}: 0 items parsed`);
      return items;
    }),
  );

  const all: NewsItem[] = [];
  for (const result of settled) {
    if (result.status === "fulfilled") all.push(...result.value);
    else console.error("[f1lytics/news] feed failed:", result.reason);
  }

  const seen = new Set<string>();
  const byUrl = all
    .filter((item) => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );

  // Near-duplicate headline collapse: keep the earliest-seen (newest) copy,
  // prefer one with an image, and count the duplicates as corroboration.
  const kept: { item: NewsItem; tokens: Set<string>; corroboration: number }[] = [];
  for (const item of byUrl) {
    const tokens = titleTokens(item.title);
    const dup = kept.find((k) => similarity(k.tokens, tokens) >= 0.55);
    if (dup) {
      dup.corroboration += 1;
      if (!dup.item.imageUrl && item.imageUrl) dup.item.imageUrl = item.imageUrl;
      continue;
    }
    kept.push({ item, tokens, corroboration: 0 });
  }

  return kept.slice(0, maxItems).map((k) => ({
    ...k.item,
    corroboration: k.corroboration,
  }));
}
