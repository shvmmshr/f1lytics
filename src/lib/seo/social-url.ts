/** Bump when the social-card design changes, so crawlers request a fresh image. */
export const SOCIAL_IMAGE_VERSION = "2026-09-12.1";

export function socialImagePath({ title, description, path, eyebrow }: { title: string; description: string; path: string; eyebrow?: string }): `/${string}` {
  const params = new URLSearchParams({ v: SOCIAL_IMAGE_VERSION, path, title, description });
  if (eyebrow) params.set("sub", eyebrow);
  return `/api/og?${params}`;
}

export function versionedImagePath(path: `/${string}`): `/${string}` {
  const url = new URL(path, "https://f1lytics.com");
  url.searchParams.set("v", SOCIAL_IMAGE_VERSION);
  return `${url.pathname}${url.search}` as `/${string}`;
}
