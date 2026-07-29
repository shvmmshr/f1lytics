const baseUrl = new URL(process.env.SEO_BASE_URL ?? "http://127.0.0.1:3200");
const productionOrigin = "https://f1lytics.com";
const concurrency = 6;
const cancelledRacePaths = ["/races/bahrain-gp", "/races/saudi-arabian-gp"];

const failures = [];
const report = (condition, message) => {
  if (!condition) failures.push(message);
};
const matches = (html, pattern) => [...html.matchAll(pattern)];
const attr = (tag, name) =>
  tag.match(new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`, "i"))?.slice(1).find(Boolean);

async function fetchPath(path, init) {
  return fetch(new URL(path, baseUrl), { redirect: "manual", ...init });
}

async function pool(items, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await worker(items[index], index);
      }
    }),
  );
  return results;
}

function productionUrl(pathname) {
  return pathname === "/" ? productionOrigin : `${productionOrigin}${pathname}`;
}

function metaByName(html, name) {
  return matches(html, /<meta\b[^>]*>/gi)
    .filter(([tag]) => attr(tag, "name")?.toLowerCase() === name.toLowerCase())
    .map(([tag]) => attr(tag, "content"));
}

function metaByProperty(html, property) {
  return matches(html, /<meta\b[^>]*>/gi)
    .filter(([tag]) => attr(tag, "property")?.toLowerCase() === property.toLowerCase())
    .map(([tag]) => attr(tag, "content"));
}

function jsonLdTypes(value, output = new Set()) {
  if (!value || typeof value !== "object") return output;
  if (Array.isArray(value)) {
    value.forEach((item) => jsonLdTypes(item, output));
    return output;
  }
  const type = value["@type"];
  if (Array.isArray(type)) type.forEach((item) => output.add(item));
  else if (typeof type === "string") output.add(type);
  Object.values(value).forEach((item) => jsonLdTypes(item, output));
  return output;
}

const robots = await fetchPath("/robots.txt");
report(robots.status === 200, `robots.txt returned ${robots.status}`);
const robotsText = await robots.text();
report(/Sitemap:\s*https:\/\/f1lytics\.com\/sitemap\.xml/i.test(robotsText), "robots.txt lacks the production sitemap");

const sitemapResponse = await fetchPath("/sitemap.xml");
report(sitemapResponse.status === 200, `sitemap.xml returned ${sitemapResponse.status}`);
const sitemapXml = await sitemapResponse.text();
const sitemapUrls = matches(sitemapXml, /<loc>(.*?)<\/loc>/g).map((match) => match[1]);
report(sitemapUrls.length > 0, "sitemap.xml has no URLs");
report(new Set(sitemapUrls).size === sitemapUrls.length, "sitemap.xml contains duplicate URLs");

const pages = await pool(sitemapUrls, async (url) => {
  const production = new URL(url);
  const response = await fetchPath(`${production.pathname}${production.search}`);
  const html = await response.text();
  return { url, pathname: production.pathname, response, html };
});

const titles = new Map();
const descriptions = new Map();
const graph = new Map(sitemapUrls.map((url) => [url, new Set()]));
const allInternalTargets = new Set();

for (const { url, pathname, response, html } of pages) {
  report(response.status === 200, `${pathname} returned ${response.status}`);
  const title = matches(html, /<title[^>]*>([\s\S]*?)<\/title>/gi).map((match) => match[1].trim());
  const description = metaByName(html, "description");
  const canonicals = matches(html, /<link\b[^>]*rel=(?:"canonical"|'canonical')[^>]*>/gi).map(([tag]) => attr(tag, "href"));
  const h1 = matches(html, /<h1\b[^>]*>/gi);
  const expected = productionUrl(pathname);

  report(title.length === 1, `${pathname} has ${title.length} titles`);
  report(description.length === 1, `${pathname} has ${description.length} descriptions`);
  report(canonicals.length === 1, `${pathname} has ${canonicals.length} canonicals`);
  report(h1.length === 1, `${pathname} has ${h1.length} H1 elements`);
  report(canonicals[0] === expected, `${pathname} canonical is ${canonicals[0] ?? "missing"}, expected ${expected}`);

  const required = [
    ["og:title", metaByProperty(html, "og:title")],
    ["og:description", metaByProperty(html, "og:description")],
    ["og:url", metaByProperty(html, "og:url")],
    ["og:image", metaByProperty(html, "og:image")],
    ["twitter:title", metaByName(html, "twitter:title")],
    ["twitter:description", metaByName(html, "twitter:description")],
    ["twitter:image", metaByName(html, "twitter:image")],
    ["twitter:card", metaByName(html, "twitter:card")],
  ];
  required.forEach(([name, values]) => report(values.length === 1, `${pathname} has ${values.length} ${name} tags`));
  report(metaByProperty(html, "og:url")[0] === expected, `${pathname} og:url is not self-referential`);
  report(metaByName(html, "twitter:card")[0] === "summary_large_image", `${pathname} lacks a large Twitter card`);

  if (title[0]) {
    report(!titles.has(title[0]), `${pathname} duplicates title from ${titles.get(title[0])}`);
    titles.set(title[0], pathname);
  }
  if (description[0]) {
    report(!descriptions.has(description[0]), `${pathname} duplicates description from ${descriptions.get(description[0])}`);
    descriptions.set(description[0], pathname);
  }

  const types = new Set();
  for (const match of matches(html, /<script\b[^>]*type=(?:"application\/ld\+json"|'application\/ld\+json')[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      jsonLdTypes(JSON.parse(match[1]), types);
    } catch (error) {
      failures.push(`${pathname} has invalid JSON-LD: ${error.message}`);
    }
  }
  const expectedType =
    /^\/drivers\/[^/]+$/.test(pathname) ? "Person" :
    /^\/teams\/[^/]+$/.test(pathname) ? "SportsTeam" :
    /^\/circuits\/[^/]+$/.test(pathname) ? "Place" :
    /^\/races\/[^/]+$/.test(pathname) ? "SportsEvent" :
    ["/drivers", "/teams", "/circuits", "/races", "/news"].includes(pathname) ? "CollectionPage" :
    pathname === "/" ? "WebSite" : null;
  if (expectedType) report(types.has(expectedType), `${pathname} lacks ${expectedType} JSON-LD`);
  if (/^\/(drivers|teams|circuits|races)\/[^/]+$/.test(pathname)) {
    report(types.has("BreadcrumbList"), `${pathname} lacks BreadcrumbList JSON-LD`);
  }

  for (const [, rawHref] of matches(html, /<a\b[^>]*href=(?:"([^"]*)"|'([^']*)')[^>]*>/gi).map((match) => [match[0], match[1] ?? match[2]])) {
    if (!rawHref || rawHref.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(rawHref)) continue;
    const target = new URL(rawHref, productionOrigin);
    if (target.origin !== productionOrigin || target.pathname.startsWith("/api/")) continue;
    target.hash = "";
    const normalized = target.pathname === "/" ? productionOrigin : `${productionOrigin}${target.pathname}${target.search}`;
    allInternalTargets.add(normalized);
    if (graph.has(normalized)) graph.get(normalized).add(url);
  }
}

const brokenTargets = await pool([...allInternalTargets], async (url) => {
  const target = new URL(url);
  const response = await fetchPath(`${target.pathname}${target.search}`, { method: "HEAD" });
  return response.status >= 400 ? `${target.pathname} returned ${response.status}` : null;
});
brokenTargets.filter(Boolean).forEach((message) => failures.push(message));

for (const [url, inbound] of graph) {
  report(inbound.size > 0, `${new URL(url).pathname} has zero inbound sitemap links`);
  if (/^\/races\/[^/]+$/.test(new URL(url).pathname)) {
    report(inbound.size >= 3, `${new URL(url).pathname} has only ${inbound.size} inbound sources`);
  }
}

const indexResponse = await fetchPath("/index");
report([301, 308].includes(indexResponse.status), `/index redirect is ${indexResponse.status}, expected 301/308`);
report(indexResponse.headers.get("location") === "/", `/index redirects to ${indexResponse.headers.get("location")}`);

const missingResponse = await fetchPath("/this-route-does-not-exist");
const missingHtml = await missingResponse.text();
report(missingResponse.status === 404, `nonexistent route returned ${missingResponse.status}`);
report(metaByName(missingHtml, "robots").some((value) => /noindex/i.test(value ?? "")), "404 page lacks noindex");

for (const path of cancelledRacePaths) {
  report(!sitemapUrls.includes(productionUrl(path)), `${path} is present in sitemap`);
  const response = await fetchPath(path);
  const html = await response.text();
  report(response.status === 200, `${path} returned ${response.status}`);
  const robotsValues = metaByName(html, "robots").join(",");
  report(/noindex/i.test(robotsValues) && /follow/i.test(robotsValues), `${path} lacks noindex, follow`);
}

console.log(`SEO crawl checked ${sitemapUrls.length} sitemap URLs and ${allInternalTargets.size} internal targets.`);
if (failures.length) {
  console.error(`\n${failures.length} SEO check failure(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("SEO checks passed.");
}
