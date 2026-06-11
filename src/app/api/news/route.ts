import { NextResponse } from "next/server";
import { fetchAllNews } from "@/lib/api/news";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(
    Number.parseInt(url.searchParams.get("limit") ?? "40", 10) || 40,
    60,
  );
  // ?fresh=1 bypasses the cache for a true live read — use it on the deployed
  // site to confirm whether Vercel's servers can actually reach the feeds.
  const fresh = url.searchParams.get("fresh") === "1";
  try {
    const items = await fetchAllNews(limit, { noCache: fresh });
    const sources = [...new Set(items.map((i) => i.source))];
    return NextResponse.json({
      count: items.length,
      sources,
      fresh,
      fetchedAt: new Date().toISOString(),
      items,
    });
  } catch (err) {
    console.error("[f1lytics/news] route error:", err);
    return NextResponse.json(
      { items: [], error: "Failed to fetch news" },
      { status: 500 },
    );
  }
}
