"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { F1, Mono, Brackets } from "@/components/shared/broadcast";
import { ERA_LIVERIES, TEAM_LIVERIES, getLivery, type Livery } from "@/lib/garage/liveries";

const GarageCar = dynamic(() => import("./garage-car").then((m) => ({ default: m.GarageCar })), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center" style={{ background: F1.bg }}>
      <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.2em" }}>ROLLING THE CAR OUT</Mono>
    </div>
  ),
});

function Swatches({ livery }: { livery: Livery }) {
  return (
    <span className="inline-flex gap-1" aria-hidden>
      {[livery.primary, livery.secondary, livery.accent].map((c, i) => (
        <span key={i} style={{ width: 10, height: 10, background: c, border: `1px solid ${F1.line}` }} />
      ))}
    </span>
  );
}

function LiveryButton({ livery, active, onSelect }: { livery: Livery; active: boolean; onSelect: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(livery.id)}
      aria-pressed={active}
      className="flex w-full items-center justify-between gap-3 text-left transition-shadow hover:shadow-[inset_0_0_0_999px_rgba(255,255,255,0.04)] focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_#F4F4F5]"
      style={{ padding: "9px 12px", background: active ? `${livery.primary}22` : F1.bg2, borderLeft: `4px solid ${livery.primary}`, border: `1px solid ${active ? livery.primary : F1.line}`, borderLeftWidth: 4, cursor: "pointer" }}
    >
      <span className="min-w-0">
        <span className="font-display block truncate" style={{ fontSize: 16, fontWeight: 600, color: F1.fg }}>{livery.name}</span>
        <Mono className="block" style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.16em" }}>{livery.era}</Mono>
      </span>
      <Swatches livery={livery} />
    </button>
  );
}

/** The garage: a spinning stylised car you can paint in any colourway and orbit around. */
export function Garage({ initialLiveryId }: { initialLiveryId: string }) {
  const [liveryId, setLiveryId] = useState(initialLiveryId);
  const [spinning, setSpinning] = useState(true);
  const livery = getLivery(liveryId);

  // Reduced motion: no idle spin; the visitor still drags to orbit.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      if (mq.matches) setSpinning(false);
    };
    const raf = requestAnimationFrame(apply);
    mq.addEventListener("change", apply);
    return () => {
      cancelAnimationFrame(raf);
      mq.removeEventListener("change", apply);
    };
  }, []);

  return (
    <div className="grid gap-px lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start" style={{ background: F1.line, border: `1px solid ${F1.line}` }}>
      {/* Fixed stage height: the list beside it scrolls instead of stretching the canvas. */}
      <div className="relative h-[clamp(380px,62vh,640px)]" style={{ background: F1.bg }}>
        <Brackets color={livery.primary} size={14} weight={2} />
        <div className="absolute left-4 top-4 z-10 flex flex-col gap-1">
          <Mono style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.22em" }}>{livery.era}</Mono>
          <span className="font-display" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em", color: F1.fg }}>
            {livery.name}
          </span>
        </div>
        <div className="absolute right-4 top-4 z-10 flex gap-2">
          <button
            type="button"
            onClick={() => setSpinning((s) => !s)}
            aria-pressed={spinning}
            className="font-mono focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_#F4F4F5]"
            style={{ fontSize: 10, letterSpacing: "0.18em", padding: "8px 12px", background: spinning ? F1.red : F1.bg2, color: spinning ? F1.ink : F1.fg2, border: `1px solid ${spinning ? F1.red : F1.lineHi}`, cursor: "pointer" }}
          >
            {spinning ? "SPINNING" : "SPIN"}
          </button>
        </div>
        <div className="absolute inset-0">
          <GarageCar livery={livery} spinning={spinning} />
        </div>
        <Mono className="absolute bottom-3 left-4 z-10" style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.18em" }}>
          DRAG TO ORBIT · SCROLL OR PINCH TO ZOOM
        </Mono>
      </div>
      <aside className="flex flex-col lg:max-h-[clamp(380px,62vh,640px)] lg:overflow-y-auto" style={{ background: F1.bg, padding: 14 }} aria-label="Colourways">
        <Mono style={{ fontSize: 10, color: F1.red, letterSpacing: "0.22em", fontWeight: 700 }}>2026 GRID</Mono>
        <div className="mt-2 grid gap-1">
          {TEAM_LIVERIES.map((l) => (
            <LiveryButton key={l.id} livery={l} active={l.id === livery.id} onSelect={setLiveryId} />
          ))}
        </div>
        <Mono className="mt-5" style={{ fontSize: 10, color: F1.amber, letterSpacing: "0.22em", fontWeight: 700 }}>ERA COLOURWAYS</Mono>
        <div className="mt-2 grid gap-1">
          {ERA_LIVERIES.map((l) => (
            <LiveryButton key={l.id} livery={l} active={l.id === livery.id} onSelect={setLiveryId} />
          ))}
        </div>
      </aside>
    </div>
  );
}
