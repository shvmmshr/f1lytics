"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { F1, Mono } from "@/components/shared/broadcast";
import { authClient } from "@/lib/auth/client";

export function AccountForm({ displayName, newsletterOptIn }: { displayName: string; newsletterOptIn: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(displayName);
  const [opt, setOpt] = useState(newsletterOptIn);
  const [state, setState] = useState<{ kind: "idle" | "busy" | "saved" | "error"; message?: string }>({ kind: "idle" });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ kind: "busy" });
    const res = await fetch("/api/lockin/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: name, newsletterOptIn: opt }),
    });
    const json = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) {
      setState({ kind: "error", message: json?.error ?? "Could not save." });
      return;
    }
    setState({ kind: "saved" });
    router.refresh();
  };

  const signOut = async () => {
    await authClient.signOut();
    router.push("/lockin");
    router.refresh();
  };

  return (
    <form onSubmit={save} className="grid gap-4" style={{ background: F1.bg2, border: `1px solid ${F1.line}`, padding: "clamp(16px, 3vw, 24px)" }}>
      <label>
        <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.2em" }}>DISPLAY NAME</Mono>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
          className="mt-2 w-full focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_#F4F4F5]"
          style={{ background: F1.bg, border: `1px solid ${F1.line}`, color: F1.fg, padding: "12px", fontSize: 16 }}
        />
        <span className="mt-1.5 block" style={{ fontSize: 12, color: F1.fg3 }}>Shown on leaderboards and share cards. 2 to 24 letters, digits, spaces or underscores.</span>
      </label>
      <label className="flex items-start gap-2.5" style={{ color: F1.fg2, fontSize: 14, lineHeight: 1.5 }}>
        <input type="checkbox" checked={opt} onChange={(e) => setOpt(e.target.checked)} className="mt-1" />
        <span>Race-weekend briefing and Lock In reminders by email.</span>
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={state.kind === "busy"} className="font-display" style={{ background: F1.red, color: F1.ink, fontSize: 16, fontWeight: 700, letterSpacing: "0.06em", padding: "12px 22px", border: "none", cursor: "pointer" }}>
          {state.kind === "busy" ? "SAVING…" : "SAVE CHANGES"}
        </button>
        <button type="button" onClick={signOut} className="font-mono" style={{ background: "transparent", color: F1.fg2, fontSize: 11, letterSpacing: "0.16em", padding: "12px 16px", border: `1px solid ${F1.lineHi}`, cursor: "pointer" }}>
          SIGN OUT
        </button>
        <span aria-live="polite" style={{ fontSize: 12, color: state.kind === "error" ? F1.red : F1.fg3 }}>
          {state.kind === "saved" ? "Saved." : state.kind === "error" ? state.message : ""}
        </span>
      </div>
    </form>
  );
}
