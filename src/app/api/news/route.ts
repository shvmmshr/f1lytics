import { NextResponse } from "next/server";
import { fetchAllNews } from "@/lib/api/news";

// ISR: refresh the aggregated feed every 15 minutes.
export const revalidate = 900;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(
      Number.parseInt(url.searchParams.get("limit") ?? "40", 10) || 40,
      60,
    );
    const items = await fetchAllNews(limit);
    return NextResponse.json({ items, fetchedAt: new Date().toISOString() });
  } catch (err) {
    console.error("[f1lytics/news] route error:", err);
    return NextResponse.json(
      { items: [], error: "Failed to fetch news" },
      { status: 500 },
    );
  }
}
