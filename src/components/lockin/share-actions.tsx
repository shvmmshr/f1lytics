"use client";

import { useState } from "react";
import { F1 } from "@/components/shared/broadcast";

/** Copy, native share, X and WhatsApp intents for a card URL. */
export function ShareActions({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const encoded = encodeURIComponent(`${text} ${url}`);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked; the link is still visible on the page */
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title: "Lock In", text, url });
    } catch {
      /* user dismissed */
    }
  };

  const button: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    letterSpacing: "0.16em",
    fontWeight: 700,
    padding: "10px 14px",
    border: `1px solid ${F1.lineHi}`,
    background: "transparent",
    color: F1.fg,
    cursor: "pointer",
    textDecoration: "none",
  };

  return (
    <div className="flex flex-wrap gap-2">
      {canShare && (
        <button type="button" onClick={share} style={{ ...button, background: F1.red, color: F1.ink, borderColor: F1.red }}>
          SHARE
        </button>
      )}
      <button type="button" onClick={copy} style={button} aria-live="polite">
        {copied ? "LINK COPIED" : "COPY LINK"}
      </button>
      <a href={`https://twitter.com/intent/tweet?text=${encoded}`} target="_blank" rel="noopener noreferrer" style={button}>
        POST ON X
      </a>
      <a href={`https://wa.me/?text=${encoded}`} target="_blank" rel="noopener noreferrer" style={button}>
        WHATSAPP
      </a>
    </div>
  );
}
