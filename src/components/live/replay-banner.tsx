"use client";

import Link from "next/link";
import { F1, Mono } from "@/components/shared/broadcast";

interface ReplayBannerProps {
  sessionName: string;
  countryName: string;
}

/** Amber bar shown above the timing screen when viewing a past session in replay. */
export function ReplayBanner({ sessionName, countryName }: ReplayBannerProps) {
  return (
    <div
      className="flex items-center justify-between gap-3"
      style={{
        background: F1.amber,
        color: F1.ink,
        padding: "8px clamp(12px, 2.5vw, 24px)",
        borderBottom: `1px solid ${F1.line}`,
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <svg
          className="shrink-0"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        <Mono
          className="truncate"
          style={{
            fontSize: 10,
            letterSpacing: "0.22em",
            fontWeight: 700,
            color: F1.ink,
          }}
        >
          REVIEW · {sessionName.toUpperCase()}
          {countryName ? ` · ${countryName.toUpperCase()}` : ""}
        </Mono>
      </div>
      <Link
        href="/live"
        className="shrink-0 whitespace-nowrap"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: "0.16em",
          fontWeight: 700,
          color: F1.ink,
          textDecoration: "none",
        }}
      >
        ✕ EXIT REVIEW
      </Link>
    </div>
  );
}
