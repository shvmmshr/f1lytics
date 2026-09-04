"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The root boundary replaces the whole document, so this is the only
    // record of what failed once the page is gone.
    console.error("[f1lytics] global error boundary:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: "#0C0C0E",
          color: "#EDEDF2",
          fontFamily: "ui-monospace, monospace",
        }}
      >
        <div style={{ color: "#FF1801", fontSize: 12, letterSpacing: "0.22em" }}>
          RED FLAG
        </div>
        <div style={{ fontSize: 14 }}>F1LYTICS HIT AN UNEXPECTED ERROR.</div>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "10px 22px",
            background: "#FF1801",
            color: "#EDEDF2",
            border: "none",
            cursor: "pointer",
            letterSpacing: "0.14em",
          }}
        >
          RESTART SESSION
        </button>
      </body>
    </html>
  );
}
