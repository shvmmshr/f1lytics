"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Drivers", href: "/drivers" },
  { label: "Teams", href: "/teams" },
  { label: "Standings", href: "/standings" },
  { label: "Calendar", href: "/calendar" },
  { label: "Circuits", href: "/circuits" },
  { label: "Live", href: "/live" },
  { label: "Compare", href: "/compare" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-bg-primary/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tighter text-text-primary">
            GRIDLOCK
          </span>
          <span className="rounded bg-status-red px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
            2026
          </span>
        </Link>

        {/* Desktop navigation */}
        <ul className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-bg-tertiary text-text-primary"
                      : "text-text-secondary hover:bg-bg-tertiary/50 hover:text-text-primary"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary md:hidden"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation menu"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
              />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="border-t border-border-subtle bg-bg-primary/95 backdrop-blur-xl md:hidden">
          <ul className="space-y-1 px-4 py-3">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-bg-tertiary text-text-primary"
                        : "text-text-secondary hover:bg-bg-tertiary/50 hover:text-text-primary"
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
}
