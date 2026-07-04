import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const secret = searchParams.get("secret");

  // Allow without secret in development, require in production
  if (process.env.NODE_ENV === "production" && secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  // Revalidate all data-dependent pages
  const paths = ["/standings", "/compare", "/calendar", "/drivers", "/teams", "/races", "/"];
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
