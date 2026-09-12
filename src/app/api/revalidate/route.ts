import { revalidatePath, revalidateTag } from "next/cache";
import { env } from "@/lib/env";
import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

/** Constant-time comparison — a plain !== leaks the secret byte-by-byte
 *  through response timing over many probes. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export async function POST(request: NextRequest) {
  // Prefer the header (query strings land in server logs and proxies);
  // the query param stays supported for existing callers.
  const secret =
    request.headers.get("x-revalidate-secret") ??
    request.nextUrl.searchParams.get("secret");

  // Fail closed in production: missing env, missing secret, or mismatch all 401.
  if (env.isProduction) {
    const expected = env.REVALIDATION_SECRET;
    if (!expected || !secret || !safeEqual(secret, expected)) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }
  }

  // Revalidate all data-dependent pages
  const paths = ["/standings", "/compare", "/calendar", "/drivers", "/teams", "/races", "/circuits", "/news", "/garage", "/opengraph-image", "/twitter-image", "/"];
  // Invalidate shared current data as well as the pages that consume it.
  // Historical seasons keep their longer caches.
  revalidateTag("f1-current-season", { expire: 0 });
  revalidateTag("f1-news", { expire: 0 });
  for (const path of paths) {
    revalidatePath(path);
  }
  // Dynamic-slug pages (each /races/<slug>, /drivers/<slug>, ...) are separate
  // static pages — revalidating the index above does NOT touch them.
  for (const dynamicPath of ["/races/[slug]", "/drivers/[slug]", "/teams/[slug]", "/circuits/[slug]"]) {
    revalidatePath(dynamicPath, "page");
  }

  return NextResponse.json({ revalidated: true, paths, now: Date.now() });
}
