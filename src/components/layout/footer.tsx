import Link from "next/link";
import { F1, Mono, LiveDot } from "@/components/shared/broadcast";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer
      style={{
        background: F1.ink,
        borderTop: `2px solid ${F1.red}`,
        color: F1.fg2,
      }}
    >
      <div
        className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between"
        style={{
          padding: "20px 24px",
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: "0.18em",
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-display"
            style={{
              color: F1.fg,
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: "-0.01em",
            }}
          >
            F1LYTICS
          </Link>
          <span style={{ width: 1, height: 12, background: F1.line }} />
          <Mono style={{ color: F1.fg3 }}>
            {year} · UNOFFICIAL FAN PROJECT
          </Mono>
        </div>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-2">
            <LiveDot size={6} />
            <Mono style={{ color: F1.fg3 }}>
              FEED · OPENF1 · JOLPICA‑F1
            </Mono>
          </span>
          <a
            href="https://github.com/shvmmshr/f1lytics"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            style={{ color: F1.fg2, transition: "color 200ms" }}
            className="hover:text-white"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
