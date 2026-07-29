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
    <nav aria-label="Breadcrumb" style={{ color: F1.fg3 }}>
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={`${item.name}-${index}`} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden>/</span>}
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-white">
                <Mono style={{ fontSize: 10, letterSpacing: "0.16em" }}>
                  {item.name.toUpperCase()}
                </Mono>
              </Link>
            ) : (
              <Mono aria-current="page" style={{ fontSize: 10, color: F1.fg2, letterSpacing: "0.16em" }}>
                {item.name.toUpperCase()}
              </Mono>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
