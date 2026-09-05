"use client";

import { useState } from "react";
import { F1, Mono } from "@/components/shared/broadcast";
import { authClient } from "@/lib/auth/client";

const CONSENT_KEY = "lockin-consent";

interface SignInFormProps {
  googleEnabled: boolean;
  magicLinkEnabled: boolean;
  /** Path to return to after sign-in. */
  next: string;
}

export function SignInForm({ googleEnabled, magicLinkEnabled, next }: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<{ kind: "idle" | "busy" | "sent" | "error"; message?: string }>({ kind: "idle" });

  const rememberConsent = () => {
    try {
      localStorage.setItem(CONSENT_KEY, consent ? "yes" : "no");
    } catch {
      /* ignore */
    }
  };

  const google = async () => {
    setState({ kind: "busy" });
    rememberConsent();
    try {
      await authClient.signIn.social({ provider: "google", callbackURL: next });
    } catch {
      setState({ kind: "error", message: "Google sign-in did not start. Try again." });
    }
  };

  const magic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setState({ kind: "error", message: "Enter a valid email address." });
      return;
    }
    setState({ kind: "busy" });
    rememberConsent();
    const { error } = await authClient.signIn.magicLink({ email, callbackURL: next, newUserCallbackURL: next });
    if (error) {
      setState({ kind: "error", message: error.status === 429 ? "Too many attempts. Wait a minute and try again." : "Could not send the link. Check the address and try again." });
      return;
    }
    setState({ kind: "sent" });
  };

  const button: React.CSSProperties = {
    width: "100%",
    fontFamily: "var(--font-antonio)",
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: "0.06em",
    padding: "15px 20px",
    cursor: "pointer",
    border: "none",
  };

  if (state.kind === "sent") {
    return (
      <div role="status" style={{ background: F1.bg2, border: `1px solid ${F1.line}`, padding: 24 }}>
        <Mono style={{ fontSize: 11, color: F1.green, letterSpacing: "0.22em", fontWeight: 700 }}>LINK SENT</Mono>
        <p className="mt-3" style={{ color: F1.fg, fontSize: 15, lineHeight: 1.6 }}>
          Check <strong>{email}</strong> and open the link. It works once and expires in 15 minutes. You can close this tab.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {googleEnabled && (
        <button type="button" onClick={google} disabled={state.kind === "busy"} style={{ ...button, background: F1.fg, color: F1.ink }}>
          CONTINUE WITH GOOGLE
        </button>
      )}
      {googleEnabled && magicLinkEnabled && (
        <div className="flex items-center gap-3" aria-hidden>
          <span style={{ flex: 1, height: 1, background: F1.line }} />
          <Mono style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.2em" }}>OR</Mono>
          <span style={{ flex: 1, height: 1, background: F1.line }} />
        </div>
      )}
      {magicLinkEnabled && (
        <form onSubmit={magic} className="grid gap-2">
          <label>
            <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.2em" }}>EMAIL</Mono>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_#F4F4F5]"
              style={{ background: F1.bg, border: `1px solid ${F1.line}`, color: F1.fg, padding: "13px 12px", fontSize: 16 }}
            />
          </label>
          <button type="submit" disabled={state.kind === "busy"} style={{ ...button, background: F1.red, color: F1.ink }}>
            {state.kind === "busy" ? "SENDING…" : "EMAIL ME A SIGN-IN LINK"}
          </button>
        </form>
      )}
      {!googleEnabled && !magicLinkEnabled && (
        <p style={{ color: F1.fg2, fontSize: 14 }}>Sign-in is being set up. Check back shortly.</p>
      )}
      <label className="mt-1 flex items-start gap-2.5" style={{ color: F1.fg2, fontSize: 13, lineHeight: 1.5 }}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
        <span>Email me a short race-weekend briefing and Lock In reminders. Unsubscribe any time.</span>
      </label>
      <p aria-live="polite" style={{ minHeight: "1.2em", margin: 0, fontSize: 12, color: F1.red }}>
        {state.kind === "error" ? state.message : ""}
      </p>
      <p style={{ margin: 0, fontSize: 12, color: F1.fg3, lineHeight: 1.6 }}>
        By continuing you accept that F1lytics stores your email, a display name and your calls. See the <a href="/privacy" style={{ color: F1.fg2, textDecoration: "underline" }}>privacy note</a>.
      </p>
    </div>
  );
}
