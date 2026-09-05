"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { F1, Mono } from "@/components/shared/broadcast";

const input: React.CSSProperties = { background: "#0C0C0E", border: "1px solid #27272A", color: "#F4F4F5", padding: "12px", fontSize: 16, width: "100%" };
const primary: React.CSSProperties = { background: F1.red, color: F1.ink, fontFamily: "var(--font-antonio)", fontSize: 16, fontWeight: 700, letterSpacing: "0.06em", padding: "12px 20px", border: "none", cursor: "pointer" };

export function CreateLeagueForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [state, setState] = useState<{ kind: "idle" | "busy" | "error"; message?: string }>({ kind: "idle" });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ kind: "busy" });
    const res = await fetch("/api/lockin/leagues", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const json = (await res.json().catch(() => null)) as { error?: string; code?: string } | null;
    if (!res.ok || !json?.code) {
      setState({ kind: "error", message: json?.error ?? "Could not create the league." });
      return;
    }
    router.push(`/lockin/l/${json.code}`);
  };
  return (
    <form onSubmit={submit} className="grid gap-3" style={{ background: F1.bg2, border: `1px solid ${F1.line}`, padding: "clamp(16px, 3vw, 24px)" }}>
      <Mono style={{ fontSize: 11, color: F1.fg3, letterSpacing: "0.22em", fontWeight: 700 }}>START A LEAGUE</Mono>
      <label>
        <span className="sr-only">League name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="League name, 3 to 40 characters" maxLength={40} style={input} className="focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_#F4F4F5]" />
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={state.kind === "busy" || name.trim().length < 3} style={{ ...primary, opacity: name.trim().length < 3 ? 0.5 : 1 }}>
          {state.kind === "busy" ? "CREATING…" : "CREATE LEAGUE"}
        </button>
        <span aria-live="polite" style={{ fontSize: 12, color: F1.red }}>{state.kind === "error" ? state.message : ""}</span>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: F1.fg3 }}>You get an invite link to share. Up to 200 players per league.</p>
    </form>
  );
}

export function JoinLeagueForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [state, setState] = useState<{ kind: "idle" | "busy" | "error"; message?: string }>({ kind: "idle" });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ kind: "busy" });
    const clean = code.trim().toUpperCase();
    const res = await fetch(`/api/lockin/leagues/${encodeURIComponent(clean)}/join`, { method: "POST" });
    const json = (await res.json().catch(() => null)) as { error?: string; code?: string } | null;
    if (!res.ok || !json?.code) {
      setState({ kind: "error", message: json?.error ?? "Could not join." });
      return;
    }
    router.push(`/lockin/l/${json.code}`);
  };
  return (
    <form onSubmit={submit} className="grid gap-3" style={{ background: F1.bg2, border: `1px solid ${F1.line}`, padding: "clamp(16px, 3vw, 24px)" }}>
      <Mono style={{ fontSize: 11, color: F1.fg3, letterSpacing: "0.22em", fontWeight: 700 }}>JOIN WITH A CODE</Mono>
      <label>
        <span className="sr-only">League code</span>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="8-character code" maxLength={12} style={{ ...input, fontFamily: "var(--font-jetbrains-mono)", letterSpacing: "0.2em", textTransform: "uppercase" }} className="focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_#F4F4F5]" />
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={state.kind === "busy" || code.trim().length < 8} style={{ ...primary, background: F1.fg, opacity: code.trim().length < 8 ? 0.5 : 1 }}>
          {state.kind === "busy" ? "JOINING…" : "JOIN LEAGUE"}
        </button>
        <span aria-live="polite" style={{ fontSize: 12, color: F1.red }}>{state.kind === "error" ? state.message : ""}</span>
      </div>
    </form>
  );
}

export function JoinLeagueButton({ code }: { code: string }) {
  const router = useRouter();
  const [state, setState] = useState<{ kind: "idle" | "busy" | "error"; message?: string }>({ kind: "idle" });
  const join = async () => {
    setState({ kind: "busy" });
    const res = await fetch(`/api/lockin/leagues/${encodeURIComponent(code)}/join`, { method: "POST" });
    const json = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) {
      setState({ kind: "error", message: json?.error ?? "Could not join." });
      return;
    }
    router.refresh();
  };
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={join} disabled={state.kind === "busy"} style={primary}>
        {state.kind === "busy" ? "JOINING…" : "JOIN THIS LEAGUE"}
      </button>
      <span aria-live="polite" style={{ fontSize: 12, color: F1.red }}>{state.kind === "error" ? state.message : ""}</span>
    </div>
  );
}
