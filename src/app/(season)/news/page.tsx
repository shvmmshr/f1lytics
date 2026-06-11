import type { Metadata } from "next";
import { fetchAllNews, scoreImportance, type NewsItem } from "@/lib/api/news";
import { PageTransition } from "@/components/layout/page-transition";
import { F1, Mono, Grid as BroadcastGrid } from "@/components/shared/broadcast";

export const metadata: Metadata = {
  title: "F1 News",
  description:
    "Latest Formula 1 news aggregated from BBC Sport, Motorsport.com, Autosport, The Race and PlanetF1.",
};

export const revalidate = 900;

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function SourceLine({ item }: { item: NewsItem }) {
  return (
    <div className="flex items-center gap-2">
      <Mono style={{ fontSize: 9, color: F1.red, letterSpacing: "0.2em" }}>
        {item.source.toUpperCase()}
      </Mono>
      <Mono style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.14em" }}>
        · {timeAgo(item.publishedAt)}
      </Mono>
      {(item.corroboration ?? 0) > 0 && (
        <Mono style={{ fontSize: 9, color: F1.amber, letterSpacing: "0.14em" }}>
          · {(item.corroboration ?? 0) + 1} SOURCES
        </Mono>
      )}
    </div>
  );
}

export default async function NewsPage() {
  let items: NewsItem[] = [];
  try {
    items = await fetchAllNews(36);
  } catch (err) {
    console.error("[f1lytics] news page fetch failed:", err);
  }

  // Top stories: rank by decision/announcement keywords + multi-source
  // corroboration + recency; the rest stay chronological.
  const ranked = [...items].sort(
    (a, b) =>
      scoreImportance(b, b.corroboration ?? 0) -
      scoreImportance(a, a.corroboration ?? 0),
  );
  const featured = ranked[0];
  const topSide = ranked.slice(1, 5);
  const topUrls = new Set([featured, ...topSide].filter(Boolean).map((i) => i!.url));
  const rest = items.filter((i) => !topUrls.has(i.url));

  return (
    <PageTransition>
      <div style={{ background: F1.bg, color: F1.fg, position: "relative" }}>
        <BroadcastGrid color={F1.line} size={48} opacity={0.18} />

        {/* Header */}
        <div
          className="relative"
          style={{ padding: "40px clamp(16px, 4vw, 32px) 28px", borderBottom: `1px solid ${F1.line}` }}
        >
          <div className="flex items-center gap-3.5">
            <Mono style={{ color: F1.red, fontSize: 11, letterSpacing: "0.24em" }}>
              PADDOCK FEED
            </Mono>
            <span style={{ width: 40, height: 1, background: F1.line }} />
            <Mono style={{ color: F1.fg3, fontSize: 11, letterSpacing: "0.18em" }}>
              UPDATED EVERY 15 MIN
            </Mono>
          </div>
          <h1
            className="font-display uppercase m-0 mt-3"
            style={{
              fontWeight: 700,
              fontSize: "clamp(36px, 8vw, 96px)",
              lineHeight: 0.9,
              letterSpacing: "-0.04em",
            }}
          >
            F1 NEWS<span style={{ color: F1.red }}>.</span>
          </h1>
        </div>

        {items.length === 0 ? (
          <div className="relative" style={{ padding: "32px clamp(16px, 4vw, 32px)" }}>
            <Mono style={{ fontSize: 12, color: F1.fg3, letterSpacing: "0.18em" }}>
              NEWS FEED UNAVAILABLE — TRY AGAIN SHORTLY.
            </Mono>
          </div>
        ) : (
          <>
            {/* TOP STORIES — featured + ranked headlines */}
            {featured && (
              <div
                className="relative"
                style={{ padding: "32px clamp(16px, 4vw, 32px) 40px", borderBottom: `1px solid ${F1.line}` }}
              >
                <div className="flex items-center gap-3.5" style={{ marginBottom: 20 }}>
                  <Mono
                    style={{
                      color: F1.red,
                      fontSize: 11,
                      letterSpacing: "0.24em",
                      fontWeight: 700,
                    }}
                  >
                    TOP STORIES
                  </Mono>
                  <span style={{ width: 40, height: 1, background: F1.line }} />
                  <Mono style={{ color: F1.fg3, fontSize: 10, letterSpacing: "0.16em" }}>
                    BIG DECISIONS · MULTI-SOURCE HEADLINES
                  </Mono>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-6">
                  {/* Featured story */}
                  <a
                    href={featured.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block"
                    style={{
                      border: `1px solid ${F1.line}`,
                      background: F1.bg2,
                      textDecoration: "none",
                      color: F1.fg,
                      overflow: "hidden",
                    }}
                  >
                    {featured.imageUrl && (
                      <div
                        style={{
                          aspectRatio: "16 / 8",
                          overflow: "hidden",
                          borderBottom: `1px solid ${F1.line}`,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={featured.imageUrl}
                          alt=""
                          loading="eager"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                      </div>
                    )}
                    <div style={{ padding: "20px 24px 24px" }}>
                      <SourceLine item={featured} />
                      <div
                        className="font-display"
                        style={{
                          marginTop: 10,
                          fontSize: "clamp(22px, 2.4vw, 30px)",
                          fontWeight: 700,
                          lineHeight: 1.12,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {featured.title}
                      </div>
                      {featured.description && (
                        <div
                          style={{
                            marginTop: 10,
                            fontSize: 14,
                            color: F1.fg2,
                            lineHeight: 1.55,
                            maxWidth: 640,
                          }}
                        >
                          {featured.description}
                        </div>
                      )}
                    </div>
                  </a>

                  {/* Ranked side headlines */}
                  <div className="flex flex-col" style={{ border: `1px solid ${F1.line}` }}>
                    {topSide.map((item, i) => (
                      <a
                        key={item.url}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex gap-4 transition-colors hover:bg-white/[0.04]"
                        style={{
                          padding: "16px 18px",
                          borderBottom:
                            i < topSide.length - 1 ? `1px solid ${F1.line}` : "none",
                          textDecoration: "none",
                          color: F1.fg,
                          flex: 1,
                        }}
                      >
                        <Mono
                          style={{
                            fontSize: 18,
                            color: F1.fg4,
                            fontWeight: 700,
                            lineHeight: 1,
                            paddingTop: 2,
                          }}
                        >
                          {String(i + 2).padStart(2, "0")}
                        </Mono>
                        <div className="min-w-0">
                          <SourceLine item={item} />
                          <div
                            className="font-display"
                            style={{
                              marginTop: 6,
                              fontSize: 16,
                              fontWeight: 600,
                              lineHeight: 1.25,
                              letterSpacing: "-0.01em",
                            }}
                          >
                            {item.title}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ALL STORIES — chronological, breathing room */}
            <div className="relative" style={{ padding: "32px clamp(16px, 4vw, 32px)" }}>
              <div className="flex items-center gap-3.5" style={{ marginBottom: 20 }}>
                <Mono
                  style={{
                    color: F1.fg2,
                    fontSize: 11,
                    letterSpacing: "0.24em",
                    fontWeight: 700,
                  }}
                >
                  ALL STORIES
                </Mono>
                <span style={{ width: 40, height: 1, background: F1.line }} />
                <Mono style={{ color: F1.fg3, fontSize: 10, letterSpacing: "0.16em" }}>
                  BBC SPORT · MOTORSPORT.COM · AUTOSPORT · THE RACE · PLANETF1
                </Mono>
              </div>
              <div
                className="grid"
                style={{
                  gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))",
                  gap: 20,
                }}
              >
                {rest.map((item) => (
                  <a
                    key={item.url}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col transition-colors hover:bg-white/[0.04]"
                    style={{
                      background: F1.bg2,
                      border: `1px solid ${F1.line}`,
                      textDecoration: "none",
                      color: F1.fg,
                    }}
                  >
                    {item.imageUrl && (
                      <div
                        style={{
                          aspectRatio: "16 / 9",
                          overflow: "hidden",
                          background: F1.bg3,
                          borderBottom: `1px solid ${F1.line}`,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col" style={{ padding: "14px 18px 18px" }}>
                      <SourceLine item={item} />
                      <div
                        className="font-display"
                        style={{
                          marginTop: 8,
                          fontSize: 16,
                          fontWeight: 600,
                          lineHeight: 1.3,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {item.title}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}
