"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, useCallback, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
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
        { backgroundColor: "rgba(var(--color-bg-primary-rgb, 10, 10, 10), 0.6)" },
        {
          backgroundColor: "rgba(var(--color-bg-primary-rgb, 10, 10, 10), 0.95)",
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
              GRIDLOCK
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
        </div>
      )}
    </>
  );
}
