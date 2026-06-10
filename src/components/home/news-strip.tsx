import Link from "next/link";
import { fetchAllNews, type NewsItem } from "@/lib/api/news";
import { F1, Mono } from "@/components/shared/broadcast";

// Server component — top headlines for the home page. Renders nothing if all
// feeds are unavailable, so it never breaks the landing page.
export async function NewsStrip() {
  let items: NewsItem[] = [];
  try {
    items = await fetchAllNews(3);
  } catch (err) {
    console.error("[f1lytics] news strip fetch failed:", err);
    return null;
  }
  if (items.length === 0) return null;

  return (
    <section
      style={{
        background: F1.bg,
        borderTop: `1px solid ${F1.line}`,
        borderBottom: `1px solid ${F1.line}`,
        padding: "60px 32px",
      }}
    >
      <div className="mx-auto" style={{ maxWidth: 1280 }}>
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <Mono style={{ color: F1.red, fontSize: 11, letterSpacing: "0.24em", fontWeight: 700 }}>
              LATEST NEWS
            </Mono>
            <span style={{ width: 40, height: 1, background: F1.line }} />
          </div>
          <Link
            href="/news"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: F1.fg3,
              letterSpacing: "0.18em",
              textDecoration: "none",
            }}
          >
            ALL STORIES →
          </Link>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          style={{ gap: 1, background: F1.line, border: `1px solid ${F1.line}` }}
        >
          {items.slice(0, 3).map((item) => (
            <a
              key={item.url}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col transition-colors hover:bg-white/[0.04]"
              style={{ background: F1.bg, textDecoration: "none", color: F1.fg }}
            >
              {item.imageUrl && (
                <div style={{ aspectRatio: "16 / 9", overflow: "hidden", background: F1.bg2 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
              )}
              <div style={{ padding: "16px 20px" }}>
                <Mono style={{ fontSize: 9, color: F1.red, letterSpacing: "0.2em" }}>
                  {item.source.toUpperCase()}
                </Mono>
                <div
                  className="font-display"
                  style={{ marginTop: 8, fontSize: 16, fontWeight: 600, lineHeight: 1.25 }}
                >
                  {item.title}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
