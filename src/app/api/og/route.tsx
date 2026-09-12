import { renderSocialImage } from "@/lib/seo/social-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Short CDN caching; versioned, content-specific URLs avoid stale redesigns. */
export async function GET(request: Request) {
  if (request.url.length > 4096) return new Response("Image request too long", { status: 414 });
  const params = new URL(request.url).searchParams;
  return renderSocialImage({ path: params.get("path"), title: params.get("title"), description: params.get("description"), eyebrow: params.get("sub") });
}
