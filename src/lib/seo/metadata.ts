import type { Metadata } from "next";

export const SITE_NAME = "F1lytics";
export const SITE_URL = "https://f1lytics.com";
export const SITE_LOCALE = "en_US";
export const ROOT_TITLE = "F1lytics · 2026 Formula 1 Stats & Standings";
export const ROOT_DESCRIPTION =
  "Standings, race results, driver and team stats, telemetry, and the full 2026 Formula 1 calendar in one place, plus live timing when sessions are running.";

export interface PageMetadataInput {
  title: string;
  description: string;
  path: "/" | `/${string}`;
  absoluteTitle?: boolean;
  noIndex?: boolean;
  imagePath?: `/${string}`;
}

export type RaceSeoState =
  | "upcoming"
  | "weekend"
  | "completed"
  | "cancelled";

export function absoluteUrl(path: PageMetadataInput["path"]): string {
  return new URL(path, `${SITE_URL}/`).toString();
}

export function createPageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
  noIndex = false,
  imagePath,
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const image = absoluteUrl(
    imagePath ?? (`/api/og?title=${encodeURIComponent(title)}` as `/${string}`),
  );

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      locale: SITE_LOCALE,
      siteName: SITE_NAME,
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: `${title} social card` }],
    },
    twitter: {
      title,
      description,
      card: "summary_large_image",
      images: [image],
    },
    robots: noIndex
      ? {
          index: false,
          follow: true,
          googleBot: { index: false, follow: true },
        }
      : undefined,
  };
}
