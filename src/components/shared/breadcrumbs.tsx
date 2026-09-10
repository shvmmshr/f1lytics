import Link from "next/link";
import { F1, Mono } from "@/components/shared/broadcast";

export interface BreadcrumbItem {
  name: string;
  href?: "/" | `/${string}`;
}
export interface BreadcrumbsProps {
  items: readonly BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="min-w-0 max-w-full basis-full sm:basis-auto" aria-label="Breadcrumb" style={{ color: F1.fg3 }}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-0">
        {items.map((item, index) => (
          <li key={`${item.name}-${index}`} className="flex min-w-0 max-w-full items-center gap-2">
            {index > 0 && <span className="shrink-0" aria-hidden>/</span>}
            {item.href ? (
              <Link href={item.href} className="inline-flex min-w-0 min-h-9 items-center transition-colors hover:text-white">
                <Mono className="break-words" style={{ fontSize: 10, letterSpacing: "0.16em" }}>
                  {item.name.toUpperCase()}
                </Mono>
              </Link>
            ) : (
              <Mono className="break-words" aria-current="page" style={{ fontSize: 10, color: F1.fg2, letterSpacing: "0.16em" }}>
                {item.name.toUpperCase()}
              </Mono>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
