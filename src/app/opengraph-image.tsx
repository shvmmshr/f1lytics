import { renderSocialImage } from "@/lib/seo/social-image";

export const alt = "F1lytics · 2026 Formula 1 standings, race results, live timing and legendary cars";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 300;

/** The direct fallback uses the same design and season constants as page cards. */
export default async function OGImage() {
  return renderSocialImage({ path: "/", eyebrow: "FORMULA 1 · THE 2026 SEASON" });
}
