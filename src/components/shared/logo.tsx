import Image from "next/image";
import Link from "next/link";

/*
 * F1LYTICS wordmark (public/brand/f1lytics-wordmark-dark.png) — the italic
 * white/red lettering from the brand lockup, extracted with real alpha so it
 * sits directly on the carbon background. Source ratio ≈ 10.2 : 1.
 */
const WORDMARK_RATIO = 640 / 63;

export function Logo({
  size = "md",
  href = "/",
}: {
  /** md = navbar/footer, lg = splash / mobile menu */
  size?: "md" | "lg";
  /** Set null to render a non-link (e.g. inside another link). */
  href?: string | null;
}) {
  const height = size === "lg" ? 28 : 20;
  const width = Math.round(height * WORDMARK_RATIO);

  const mark = (
    <Image
      src="/brand/f1lytics-wordmark-dark.png"
      alt="F1lytics"
      width={width}
      height={height}
      priority={size === "md"}
      style={{ display: "block", height, width }}
    />
  );

  if (!href) return mark;
  return (
    <Link href={href} aria-label="F1lytics home" className="inline-flex" style={{ textDecoration: "none" }}>
      {mark}
    </Link>
  );
}
