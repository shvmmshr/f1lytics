import Image from "next/image";

// Keep in sync with images.remotePatterns in next.config.ts. Unknown feed
// hosts deliberately bypass the optimizer so a publisher CDN change degrades
// to a normal browser image instead of failing the route.
export const OPTIMIZED_IMAGE_HOSTS = [
  /^cdn-[\w-]+\.motorsport\.com$/,
  /^ichef\.bbci\.co\.uk$/,
  /^d3cm515ijfiu6w\.cloudfront\.net$/,
  /^storage\.ghost\.io$/,
] as const;

export function canOptimizeImage(url: string): boolean {
  try {
    return OPTIMIZED_IMAGE_HOSTS.some((pattern) => pattern.test(new URL(url).hostname));
  } catch {
    return false;
  }
}
export function NewsImage({
  src,
  sizes,
  eager = false,
  className = "",
}: {
  src: string;
  sizes: string;
  eager?: boolean;
  className?: string;
}) {
  if (canOptimizeImage(src)) {
    return (
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        priority={eager}
        className={className}
        style={{ objectFit: "cover" }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading={eager ? "eager" : "lazy"}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
