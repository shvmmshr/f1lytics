"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { F1, Mono, Brackets } from "@/components/shared/broadcast";
import { useCountdownTick } from "@/hooks/use-countdown-tick";
import type { BoardDriver } from "@/lib/lockin/board-data";
import type { Picks } from "@/lib/lockin/scoring";
import type { RoundSummary } from "@/lib/lockin/rounds";

type SlotKey = "pole" | "p1" | "p2" | "p3" | "fastestLap" | "sprintWinner";

const SLOTS: { key: SlotKey; label: string; hint: string; sprintOnly?: boolean }[] = [
  { key: "pole", label: "POLE", hint: "Fastest in qualifying" },
  { key: "p1", label: "P1", hint: "Race winner" },
  { key: "p2", label: "P2", hint: "Second" },
  { key: "p3", label: "P3", hint: "Third" },
  { key: "fastestLap", label: "FL", hint: "Fastest race lap" },
  { key: "sprintWinner", label: "SPR", hint: "Sprint winner", sprintOnly: true },
];

type Draft = Record<SlotKey, string | null> & { marginSeconds: string };

const emptyDraft = (): Draft => ({ pole: null, p1: null, p2: null, p3: null, fastestLap: null, sprintWinner: null, marginSeconds: "" });

function draftFromPicks(picks: Picks): Draft {
  return {
    pole: picks.pole,
    p1: picks.p1,
    p2: picks.p2,
    p3: picks.p3,
    fastestLap: picks.fastestLap,
    sprintWinner: picks.sprintWinner,
    marginSeconds: (picks.marginMs / 1000).toFixed(3),
  };
}

function draftKey(raceDate: string) {
  return `lockin-draft-${raceDate}`;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

interface PickBoardProps {
  round: RoundSummary;
  drivers: BoardDriver[];
  initialPicks: Picks | null;
  signedIn: boolean;
  /** Where to send a signed-out player to sign in, returning here afterwards. */
  signInHref: string;
}

/**
 * The pit wall. Tap a slot then a driver (or a driver then a slot) to make a
 * call. Podium slots refuse duplicates. A signed-out player can build a full
 * set of calls; the draft survives sign-in through localStorage.
 */
export function PickBoard({ round, drivers, initialPicks, signedIn, signInHref }: PickBoardProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => (initialPicks ? draftFromPicks(initialPicks) : emptyDraft()));
  const [armedSlot, setArmedSlot] = useState<SlotKey | null>(null);
  const [armedDriver, setArmedDriver] = useState<string | null>(null);
  const [status, setStatus] = useState<{ kind: "idle" | "saving" | "saved" | "error"; message?: string }>({ kind: "idle" });
  const [restored, setRestored] = useState(false);
  const countdownRef = useRef<HTMLSpanElement>(null);

  const slots = useMemo(() => SLOTS.filter((s) => !s.sprintOnly || round.isSprint), [round.isSprint]);

  // Restore a draft made before signing in (or before a reload), once, after
  // hydration. Deferred a frame so the server HTML and first client render agree.
  useEffect(() => {
    if (initialPicks) return;
    const raf = requestAnimationFrame(() => {
      try {
        const raw = localStorage.getItem(draftKey(round.raceDate));
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<Draft>;
        const hasContent =
          Boolean(parsed.pole || parsed.p1 || parsed.p2 || parsed.p3 || parsed.fastestLap || parsed.sprintWinner) ||
          Boolean(parsed.marginSeconds);
        if (!hasContent) return; // a blank draft from a previous visit is not worth announcing
        setDraft((d) => ({ ...d, ...parsed }));
        setRestored(true);
      } catch {
        /* ignore a corrupt draft */
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [initialPicks, round.raceDate]);

  // Persist the draft locally so nothing is lost across sign-in or a refresh.
  useEffect(() => {
    try {
      localStorage.setItem(draftKey(round.raceDate), JSON.stringify(draft));
    } catch {
      /* storage unavailable */
    }
  }, [draft, round.raceDate]);

  useCountdownTick(round.lockAtMs, ({ d, h, m, s, done }) => {
    if (!countdownRef.current) return;
    countdownRef.current.textContent = done
      ? "LOCKED"
      : d > 0
        ? `${d}D ${pad(h)}H ${pad(m)}M`
        : `${pad(h)}:${pad(m)}:${pad(s)}`;
  });

  const assign = useCallback(
    (slot: SlotKey, driverId: string) => {
      setDraft((d) => {
        const next = { ...d };
        // A driver can hold one podium step only; moving them clears the old step.
        if (slot === "p1" || slot === "p2" || slot === "p3") {
          for (const k of ["p1", "p2", "p3"] as const) if (next[k] === driverId && k !== slot) next[k] = null;
        }
        next[slot] = driverId;
        return next;
      });
      setArmedSlot(null);
      setArmedDriver(null);
      setStatus({ kind: "idle" });
    },
    [],
  );

  const onSlot = (slot: SlotKey) => {
    if (armedDriver) return assign(slot, armedDriver);
    setArmedSlot((s) => (s === slot ? null : slot));
  };

  const onDriver = (driverId: string) => {
    if (armedSlot) return assign(armedSlot, driverId);
    setArmedDriver((d) => (d === driverId ? null : driverId));
  };

  const clearSlot = (slot: SlotKey) => {
    setDraft((d) => ({ ...d, [slot]: null }));
    setStatus({ kind: "idle" });
  };

  const marginMs = Math.round(Number.parseFloat(draft.marginSeconds || "0") * 1000);
  const complete =
    slots.every((s) => draft[s.key] !== null) && Number.isFinite(marginMs) && marginMs >= 0 && marginMs <= 600_000;

  const submit = async () => {
    if (!complete) return;
    if (!signedIn) {
      router.push(signInHref);
      return;
    }
    setStatus({ kind: "saving" });
    const picks = {
      pole: draft.pole,
      p1: draft.p1,
      p2: draft.p2,
      p3: draft.p3,
      fastestLap: draft.fastestLap,
      marginMs,
      sprintWinner: round.isSprint ? draft.sprintWinner : null,
    };
    try {
      const res = await fetch("/api/lockin/picks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raceDate: round.raceDate, picks }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setStatus({ kind: "error", message: json?.error ?? "Could not save your calls. Try again." });
        return;
      }
      setStatus({ kind: "saved" });
      router.refresh();
    } catch {
      setStatus({ kind: "error", message: "Network problem. Your calls are kept on this device; try again." });
    }
  };

  const byId = useMemo(() => new Map(drivers.map((d) => [d.id, d])), [drivers]);
  const usedInPodium = new Set([draft.p1, draft.p2, draft.p3].filter(Boolean));

  return (
    <div className="grid gap-px lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]" style={{ background: F1.line, border: `1px solid ${F1.line}` }}>
      {/* Calls column */}
      <section aria-label="Your calls" className="relative" style={{ background: F1.bg2, padding: "clamp(16px, 3vw, 24px)" }}>
        <Brackets color={F1.red} size={12} />
        <div className="flex items-baseline justify-between gap-3">
          <Mono style={{ fontSize: 11, color: F1.red, letterSpacing: "0.22em", fontWeight: 700 }}>YOUR CALLS</Mono>
          <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.16em" }}>
            LOCKS IN <span ref={countdownRef} style={{ color: F1.fg }}>--</span>
          </Mono>
        </div>
        {restored && (
          <p className="mt-2" style={{ fontSize: 12, color: F1.fg3 }}>
            Your unsaved calls from earlier are back.
          </p>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-3" role="group" aria-label="Call slots">
          {slots.map((slot) => {
            const driver = byId.get(draft[slot.key] ?? "") ?? null;
            const armed = armedSlot === slot.key;
            return (
              <button
                key={slot.key}
                type="button"
                onClick={() => onSlot(slot.key)}
                aria-pressed={armed}
                aria-label={`${slot.label}: ${driver ? `${driver.firstName} ${driver.lastName}` : "empty"}. ${slot.hint}`}
                className="relative text-left transition-shadow focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_#F4F4F5]"
                style={{
                  minHeight: 88,
                  padding: "10px 10px 8px",
                  background: F1.bg,
                  border: `1px solid ${armed ? F1.red : driver ? F1.lineHi : F1.line}`,
                  boxShadow: armed ? `inset 0 0 0 1px ${F1.red}` : undefined,
                  borderLeft: `4px solid ${driver ? driver.color : armed ? F1.red : F1.line}`,
                  cursor: "pointer",
                }}
              >
                <Mono style={{ fontSize: 10, color: armed ? F1.red : F1.fg3, letterSpacing: "0.2em", fontWeight: 700 }}>{slot.label}</Mono>
                <div className="mt-1.5 font-display" style={{ fontSize: 26, lineHeight: 1, fontWeight: 700, letterSpacing: "-0.02em", color: driver ? F1.fg : F1.fg4 }}>
                  {driver ? driver.code : "—"}
                </div>
                <Mono className="mt-1 block truncate" style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.08em" }}>
                  {driver ? driver.lastName.toUpperCase() : armed ? "PICK A DRIVER" : slot.hint.toUpperCase()}
                </Mono>
                {driver && (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Clear ${slot.label}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSlot(slot.key);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        clearSlot(slot.key);
                      }
                    }}
                    className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center"
                    style={{ color: F1.fg3, fontSize: 12, lineHeight: 1 }}
                  >
                    ×
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <label className="mt-5 block">
          <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.2em" }}>WINNING MARGIN, SECONDS (TIEBREAK)</Mono>
          <input
            inputMode="decimal"
            value={draft.marginSeconds}
            onChange={(e) => {
              setDraft((d) => ({ ...d, marginSeconds: e.target.value.replace(/[^0-9.]/g, "") }));
              setStatus({ kind: "idle" });
            }}
            placeholder="e.g. 4.250"
            className="mt-2 w-full font-mono focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_#F4F4F5]"
            style={{
              background: F1.bg,
              border: `1px solid ${F1.line}`,
              color: F1.fg,
              padding: "12px 12px",
              fontSize: 16,
              fontVariantNumeric: "tabular-nums",
            }}
          />
          <span className="mt-1.5 block" style={{ fontSize: 12, color: F1.fg3 }}>
            How far ahead the winner finishes. Closest guess wins ties, 0 to 600.
          </span>
        </label>

        <div className="mt-5">
          <button
            type="button"
            onClick={submit}
            disabled={!complete || status.kind === "saving"}
            className="w-full font-display transition-opacity disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_#F4F4F5]"
            style={{ background: F1.red, color: F1.ink, fontSize: 18, fontWeight: 700, letterSpacing: "0.06em", padding: "16px 20px" }}
          >
            {status.kind === "saving" ? "LOCKING IN…" : signedIn ? "LOCK IN" : "SIGN IN TO LOCK IN"}
          </button>
          <p className="mt-2.5 min-h-[1.2em]" style={{ fontSize: 12, color: status.kind === "error" ? F1.red : F1.fg3 }} aria-live="polite">
            {status.kind === "saved" && "Locked in. You can change your calls until qualifying starts."}
            {status.kind === "error" && status.message}
            {status.kind === "idle" && !complete && `Fill every slot${round.isSprint ? ", including the sprint winner," : ""} and the margin.`}
            {status.kind === "idle" && complete && initialPicks && "Change anything, then lock in again to save."}
          </p>
        </div>
      </section>

      {/* Grid column */}
      <section aria-label="Drivers" style={{ background: F1.bg, padding: "clamp(12px, 2vw, 20px)" }}>
        <div className="flex items-baseline justify-between gap-3 px-1">
          <Mono style={{ fontSize: 11, color: F1.fg3, letterSpacing: "0.22em", fontWeight: 700 }}>THE GRID</Mono>
          <Mono style={{ fontSize: 10, color: armedSlot ? F1.red : F1.fg3, letterSpacing: "0.16em" }} aria-live="polite">
            {armedSlot ? `CHOOSE ${SLOTS.find((s) => s.key === armedSlot)?.label}` : armedDriver ? "NOW TAP A SLOT" : "TAP A SLOT, THEN A DRIVER"}
          </Mono>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4" role="group" aria-label="Driver plates">
          {drivers.map((d) => {
            const armed = armedDriver === d.id;
            const held = [...slots.map((s) => draft[s.key])].includes(d.id);
            const podiumHeld = usedInPodium.has(d.id) && armedSlot !== null && (armedSlot === "p1" || armedSlot === "p2" || armedSlot === "p3") && draft[armedSlot] !== d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onDriver(d.id)}
                aria-pressed={armed}
                aria-label={`${d.firstName} ${d.lastName}, ${d.teamName}, car ${d.number}`}
                className="flex items-center gap-2.5 text-left transition-shadow hover:shadow-[inset_0_0_0_999px_rgba(255,255,255,0.04)] focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_#F4F4F5]"
                style={{
                  padding: "8px 10px 8px 0",
                  background: armed ? `${d.color}22` : F1.bg2,
                  border: `1px solid ${armed ? d.color : F1.line}`,
                  borderLeft: `5px solid ${d.color}`,
                  opacity: podiumHeld ? 0.45 : 1,
                  cursor: "pointer",
                  minHeight: 56,
                }}
              >
                <span className="font-display shrink-0 text-right" style={{ width: 34, fontSize: 20, fontWeight: 700, color: F1.fg3, letterSpacing: "-0.02em" }}>
                  {d.number}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-display block" style={{ fontSize: 20, lineHeight: 1, fontWeight: 700, letterSpacing: "-0.01em", color: F1.fg }}>
                    {d.code}
                  </span>
                  <Mono className="block truncate" style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.12em", marginTop: 3 }}>
                    {d.lastName.toUpperCase()}
                  </Mono>
                </span>
                {held && <span aria-hidden className="mr-2 h-2 w-2 shrink-0 rounded-full" style={{ background: F1.red }} />}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
