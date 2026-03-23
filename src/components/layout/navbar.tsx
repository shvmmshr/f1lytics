"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, useCallback, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
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
  const [isClosing, setIsClosing] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const mobileOverlayRef = useRef<HTMLDivElement>(null);
  const mobileNavItemsRef = useRef<HTMLLIElement[]>([]);

  // Scroll-driven background opacity via GSAP + ScrollTrigger
  useGSAP(
    () => {
      if (!headerRef.current) return;

      gsap.fromTo(
        headerRef.current,
        { backgroundColor: "rgba(12, 12, 14, 0.6)" },
        {
          backgroundColor: "rgba(12, 12, 14, 0.95)",
          ease: "none",
          scrollTrigger: {
            start: "top top",
            end: "100px top",
            scrub: true,
          },
        }
      );
    },
    { scope: headerRef }
  );

  // Mobile menu open animation
  useGSAP(
    () => {
      if (!mobileMenuOpen || isClosing) return;
      if (!mobileOverlayRef.current) return;

      const items = mobileNavItemsRef.current.filter(Boolean);
      if (items.length === 0) return;

      gsap.from(items, {
        x: 40,
        opacity: 0,
        duration: 0.4,
        stagger: 0.05,
        ease: "power3.out",
      });
    },
    { dependencies: [mobileMenuOpen, isClosing] }
  );

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [mobileMenuOpen]);

  const closeMobileMenu = useCallback(() => {
    if (!mobileMenuOpen || isClosing) return;

    const items = mobileNavItemsRef.current.filter(Boolean);
    if (items.length === 0) {
      setMobileMenuOpen(false);
      return;
    }

    setIsClosing(true);

    gsap.to(items, {
      x: 40,
      opacity: 0,
      duration: 0.3,
      stagger: 0.03,
      ease: "power3.in",
      onComplete: () => {
        setMobileMenuOpen(false);
        setIsClosing(false);
      },
    });
  }, [mobileMenuOpen, isClosing]);

  const handleMobileToggle = useCallback(() => {
    if (mobileMenuOpen) {
      closeMobileMenu();
    } else {
      setMobileMenuOpen(true);
    }
  }, [mobileMenuOpen, closeMobileMenu]);

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-bg-primary/60 backdrop-blur-2xl"
      >
        <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Wordmark with red accent line */}
          <Link href="/" className="flex items-center gap-2">
            <span className="relative text-lg font-bold tracking-tighter text-text-primary">
              F1LYTICS
              <span
                className="absolute -bottom-1 left-0 h-[2px] w-full origin-left scale-x-100 bg-status-red transition-transform duration-300"
                aria-hidden="true"
              />
            </span>
            <span className="rounded bg-status-red px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
              2026
            </span>
          </Link>

          {/* Desktop navigation */}
          <ul className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href + "/");
              const isLive = item.label === "Live";

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors",
                      isActive
                        ? "text-text-primary"
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {isLive && (
                      <span
                        className="animate-pulse-glow inline-block h-2 w-2 rounded-full bg-status-red"
                        aria-hidden="true"
                      />
                    )}
                    {item.label}

                    {/* Sliding underline on hover */}
                    <span
                      className={cn(
                        "absolute bottom-0 left-3 right-3 h-[1px] origin-left bg-text-primary transition-transform duration-300",
                        isActive ? "scale-x-0" : "scale-x-0 group-hover:scale-x-100"
                      )}
                      aria-hidden="true"
                    />

                    {/* Active red dot indicator */}
                    {isActive && (
                      <span
                        className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-status-red"
                        style={{
                          boxShadow: "0 0 6px var(--color-glow-red)",
                        }}
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* GitHub link */}
          <a
            href="https://github.com/shvmmshr/f1lytics"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center rounded-lg p-2 text-text-secondary transition-colors hover:bg-white/[0.06] hover:text-text-primary md:inline-flex"
            aria-label="Star on GitHub"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 text-text-secondary transition-colors hover:bg-white/[0.06] hover:text-text-primary md:hidden"
            onClick={handleMobileToggle}
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
      </header>

      {/* Full-screen mobile overlay */}
      {mobileMenuOpen && (
        <div
          ref={mobileOverlayRef}
          className="fixed inset-0 z-40 flex flex-col bg-bg-primary/95 backdrop-blur-2xl md:hidden"
        >
          {/* Spacer to push content below the header */}
          <div className="h-14 shrink-0" />

          <ul className="flex flex-1 flex-col justify-center gap-2 px-8">
            {NAV_ITEMS.map((item, index) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href + "/");
              const isLive = item.label === "Live";

              return (
                <li
                  key={item.href}
                  ref={(el) => {
                    if (el) mobileNavItemsRef.current[index] = el;
                  }}
                >
                  <Link
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-lg font-medium transition-colors",
                      isActive
                        ? "text-text-primary"
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {isLive && (
                      <span
                        className="animate-pulse-glow inline-block h-2.5 w-2.5 rounded-full bg-status-red"
                        aria-hidden="true"
                      />
                    )}
                    {item.label}

                    {/* Active red dot indicator */}
                    {isActive && (
                      <span
                        className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-status-red"
                        style={{
                          boxShadow: "0 0 6px var(--color-glow-red)",
                        }}
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <a
            href="https://github.com/shvmmshr/f1lytics"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-8 mb-8 flex items-center justify-center gap-2 rounded-lg border border-white/10 py-3 text-sm text-text-secondary transition-colors hover:bg-white/[0.06] hover:text-text-primary"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Star on GitHub
          </a>
        </div>
      )}
    </>
  );
}
