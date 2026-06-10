import type { Metadata } from "next";
import { fetchAllNews, type NewsItem } from "@/lib/api/news";
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

export default async function NewsPage() {
  let items: NewsItem[] = [];
  try {
    items = await fetchAllNews(42);
  } catch (err) {
    console.error("[f1lytics] news page fetch failed:", err);
  }

  return (
    <PageTransition>
      <div style={{ background: F1.bg, color: F1.fg, position: "relative" }}>
        <BroadcastGrid color={F1.line} size={48} opacity={0.18} />

        {/* Header */}
        <div
          className="relative"
          style={{ padding: "40px 32px 28px", borderBottom: `1px solid ${F1.line}` }}
        >
          <div className="flex items-center gap-3.5">
            <Mono style={{ color: F1.red, fontSize: 11, letterSpacing: "0.24em" }}>
              PADDOCK FEED
            </Mono>
            <span style={{ width: 40, height: 1, background: F1.line }} />
            <Mono style={{ color: F1.fg3, fontSize: 11, letterSpacing: "0.18em" }}>
              {items.length} STORIES · UPDATED EVERY 15 MIN
            </Mono>
          </div>
          <h1
            className="font-display uppercase m-0 mt-3"
            style={{
              fontWeight: 700,
              fontSize: "clamp(56px, 8vw, 96px)",
              lineHeight: 0.9,
              letterSpacing: "-0.04em",
            }}
          >
            F1 NEWS<span style={{ color: F1.red }}>.</span>
          </h1>
          <div className="mt-3" style={{ fontSize: 14, color: F1.fg3, maxWidth: 620 }}>
            Aggregated from BBC Sport · Motorsport.com · Autosport · The Race · PlanetF1.
          </div>
        </div>

        {/* Grid */}
        <div className="relative" style={{ padding: 32 }}>
          {items.length === 0 ? (
            <Mono style={{ fontSize: 12, color: F1.fg3, letterSpacing: "0.18em" }}>
              NEWS FEED UNAVAILABLE — TRY AGAIN SHORTLY.
            </Mono>
          ) : (
            <div
              className="grid"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 1,
                background: F1.line,
                border: `1px solid ${F1.line}`,
              }}
            >
              {items.map((item, i) => (
                <a
                  key={item.url}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col transition-colors hover:bg-white/[0.04]"
                  style={{ background: F1.bg, textDecoration: "none", color: F1.fg }}
                >
                  {item.imageUrl && (
                    <div
                      style={{
                        aspectRatio: "16 / 9",
                        overflow: "hidden",
                        background: F1.bg2,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl}
                        alt=""
                        loading={i < 6 ? "eager" : "lazy"}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col" style={{ padding: "16px 20px" }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                      <Mono style={{ fontSize: 9, color: F1.red, letterSpacing: "0.2em" }}>
                        {item.source.toUpperCase()}
                      </Mono>
                      <Mono style={{ fontSize: 9, color: F1.fg4, letterSpacing: "0.14em" }}>
                        · {timeAgo(item.publishedAt)}
                      </Mono>
                    </div>
                    <div
                      className="font-display"
                      style={{
                        fontSize: 17,
                        fontWeight: 600,
                        lineHeight: 1.25,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {item.title}
                    </div>
                    {item.description && (
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 13,
                          color: F1.fg2,
                          lineHeight: 1.5,
                        }}
                      >
                        {item.description}
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
