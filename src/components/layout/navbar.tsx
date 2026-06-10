"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, useCallback, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { F1, LiveDot, Mono } from "@/components/shared/broadcast";
import { getNextEvent, CIRCUIT_LIST } from "@/lib/constants";

const NAV_ITEMS = [
  { label: "LIVE", href: "/live", live: true },
  { label: "STANDINGS", href: "/standings" },
  { label: "DRIVERS", href: "/drivers" },
  { label: "TEAMS", href: "/teams" },
  { label: "RACES", href: "/races" },
  { label: "CALENDAR", href: "/calendar" },
  { label: "CIRCUITS", href: "/circuits" },
  { label: "NEWS", href: "/news" },
  { label: "COMPARE", href: "/compare" },
];

// Schedule size (max round number) for the "RD xx/NN" chip. Uses total scheduled
// rounds so it stays consistent with the raw round numbers shown elsewhere
// (round numbers run 1..N including the cancelled slots).
const TOTAL_ROUNDS = CIRCUIT_LIST.length;

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const mobileOverlayRef = useRef<HTMLDivElement>(null);
  const mobileNavItemsRef = useRef<HTMLLIElement[]>([]);

  const event = getNextEvent();
  const nextRace = event?.circuit;

  useGSAP(
    () => {
      if (!headerRef.current) return;
      gsap.fromTo(
        headerRef.current,
        { backgroundColor: "rgba(8, 8, 10, 0.6)" },
        {
          backgroundColor: "rgba(8, 8, 10, 0.96)",
          ease: "none",
          scrollTrigger: { start: "top top", end: "100px top", scrub: true },
        },
      );
    },
    { scope: headerRef },
  );

  useGSAP(
    () => {
      if (!mobileMenuOpen || isClosing) return;
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
    { dependencies: [mobileMenuOpen, isClosing] },
  );

  useEffect(() => {
    if (mobileMenuOpen) document.body.classList.add("overflow-hidden");
    else document.body.classList.remove("overflow-hidden");
    return () => document.body.classList.remove("overflow-hidden");
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
    if (mobileMenuOpen) closeMobileMenu();
    else setMobileMenuOpen(true);
  }, [mobileMenuOpen, closeMobileMenu]);

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-50 w-full backdrop-blur-2xl"
        style={{
          background: "rgba(8,8,10,0.6)",
          borderBottom: `1px solid ${F1.line}`,
        }}
      >
        {/* Top status strip — desktop only */}
        <div
          className="hidden md:flex items-center justify-between font-mono"
          style={{
            padding: "6px 24px",
            background: F1.bg,
            borderBottom: `1px solid ${F1.line}`,
            fontSize: 10,
            color: F1.fg2,
            letterSpacing: "0.1em",
          }}
        >
          <div className="flex gap-6">
            <span>
              <span style={{ color: F1.fg3 }}>SEASON</span> · 2026
            </span>
            {nextRace && (
              <span>
                <span style={{ color: F1.fg3 }}>NEXT</span> ·{" "}
                <span style={{ color: F1.red }}>
                  {nextRace.country.toUpperCase()}
                </span>{" "}
                · RD {String(nextRace.round).padStart(2, "0")}/{TOTAL_ROUNDS}
              </span>
            )}
          </div>
          <div className="flex gap-6 items-center">
            <span className="inline-flex items-center gap-2">
              <LiveDot />
              LIVE TIMING · OPENF1
            </span>
          </div>
        </div>

        {/* Main nav row */}
        <nav
          className="flex items-stretch"
          style={{ height: 56 }}
        >
          {/* Logo wedge */}
          <Link
            href="/"
            className="flex items-center gap-3 relative overflow-hidden"
            style={{
              padding: "0 20px",
              borderRight: `1px solid ${F1.line}`,
              background: F1.bg,
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                background: F1.red,
              }}
            />
            <span
              className="font-display flex items-center justify-center"
              style={{
                width: 32,
                height: 32,
                background: F1.red,
                color: F1.ink,
                fontWeight: 700,
                fontSize: 18,
                clipPath: "polygon(0 0, 100% 0, 85% 100%, 0 100%)",
              }}
            >
              F1
            </span>
            <span className="hidden sm:flex flex-col">
              <span
                className="font-display"
                style={{
                  fontWeight: 600,
                  fontSize: 18,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                  color: F1.fg,
                }}
              >
                F1LYTICS
              </span>
              <Mono
                style={{
                  fontSize: 8,
                  color: F1.fg3,
                  letterSpacing: "0.2em",
                  marginTop: 2,
                }}
              >
                TELEMETRY · ANALYSIS
              </Mono>
            </span>
          </Link>

          {/* Desktop nav items */}
          <ul className="hidden md:flex items-stretch flex-1 list-none m-0 p-0">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href} className="flex">
                  <Link
                    href={item.href}
                    className={cn(
                      "nav-underline relative flex items-center font-mono transition-colors gap-2",
                    )}
                    style={{
                      padding: "0 18px",
                      fontSize: 11,
                      letterSpacing: "0.14em",
                      color: isActive ? F1.fg : F1.fg2,
                      borderRight: `1px solid ${F1.line}`,
                      background: isActive ? F1.bg2 : "transparent",
                    }}
                  >
                    {isActive && (
                      <span
                        aria-hidden
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 2,
                          background: F1.red,
                        }}
                      />
                    )}
                    {item.live && <LiveDot size={6} />}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Right utilities (desktop) */}
          <div className="hidden md:flex items-center">
            <a
              href="https://github.com/shvmmshr/f1lytics"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono inline-flex items-center transition-colors hover:bg-white/5"
              aria-label="GitHub"
              style={{
                padding: "0 14px",
                height: "100%",
                borderLeft: `1px solid ${F1.line}`,
                color: F1.fg2,
                fontSize: 11,
                letterSpacing: "0.14em",
              }}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
            <Link
              href="/live"
              className="font-display inline-flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-90"
              style={{
                padding: "0 18px",
                height: "100%",
                borderLeft: `1px solid ${F1.line}`,
                background: F1.red,
                color: F1.ink,
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: "0.06em",
              }}
            >
              <LiveDot color={F1.ink} size={6} />
              WATCH LIVE
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={handleMobileToggle}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
            className="md:hidden inline-flex items-center justify-center transition-colors ml-auto"
            style={{
              padding: "0 18px",
              borderLeft: `1px solid ${F1.line}`,
              color: F1.fg2,
            }}
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

      {/* Mobile full-screen overlay */}
      {mobileMenuOpen && (
        <div
          ref={mobileOverlayRef}
          className="fixed inset-0 z-40 flex flex-col backdrop-blur-2xl md:hidden"
          style={{ background: "rgba(8,8,10,0.96)" }}
        >
          <div className="h-14 shrink-0" />
          <ul className="flex flex-1 flex-col justify-center gap-1 px-6 list-none m-0 p-0">
            {NAV_ITEMS.map((item, index) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
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
                    className="font-display flex items-center gap-3 px-4 py-4 transition-colors uppercase"
                    style={{
                      fontSize: 24,
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      color: isActive ? F1.fg : F1.fg2,
                      borderLeft: isActive
                        ? `3px solid ${F1.red}`
                        : "3px solid transparent",
                    }}
                  >
                    {item.live && <LiveDot size={8} />}
                    {item.label}
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
