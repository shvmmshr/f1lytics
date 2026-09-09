"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Box, Rotate3D, X } from "lucide-react";
import { GARAGE_LEGENDS, getGarageLegend, type GarageLegend } from "@/lib/garage/legends";

function ModelStage({ car }: { car: GarageLegend }) {
  const [active, setActive] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const openButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!active || loaded) return;
    const timeout = setTimeout(() => setFailed(true), 30_000);
    return () => clearTimeout(timeout);
  }, [active, loaded, attempt]);
  const open = () => { setLoaded(false); setFailed(false); setActive(true); setAttempt((value) => value + 1); };
  const close = () => {
    setActive(false); setLoaded(false); setFailed(false);
    requestAnimationFrame(() => openButton.current?.focus());
  };
  return (
    <div>
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-line bg-bg-secondary px-4">
        <span className="font-mono text-[11px] uppercase tracking-widest text-text-secondary">{active ? "Interactive exhibit" : "The collection"} / {car.year}</span>
        {active ? <button type="button" onClick={close} className="flex min-h-11 items-center gap-2 text-sm text-text-secondary hover:text-text-primary"><X size={16} aria-hidden />Close 3D</button> : <span className="flex items-center gap-2 font-mono text-[11px] text-text-muted"><Box size={14} aria-hidden />360°</span>}
      </div>
      <div className="relative aspect-[4/3] overflow-hidden bg-bg-ink sm:aspect-[16/10]" aria-label={`${car.team} ${car.name} model`}>
        {!active || failed ? (
          <>
            <Image src={car.poster} alt={`${car.year} ${car.team} ${car.name}, detailed 3D model preview`} fill sizes="(min-width: 1024px) 70vw, 100vw" className="object-contain" priority />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 to-transparent" aria-hidden />
            <div className="absolute inset-x-0 bottom-5 flex flex-col items-center gap-2 px-4 sm:bottom-8">
              {failed && <p role="status" className="max-w-sm text-center text-sm text-white">The viewer couldn’t open. Try again or use the original model link below.</p>}
              <button ref={openButton} type="button" onClick={open} className="inline-flex min-h-12 items-center gap-3 border border-white/30 bg-bg-ink px-6 font-mono text-xs font-bold uppercase tracking-widest text-white shadow-lg hover:bg-bg-hover"><Rotate3D size={19} aria-hidden />{failed ? "Retry 3D viewer" : "Explore in 3D"}</button>
              <span className="text-xs text-white/80">Interactive viewer by Sketchfab</span>
            </div>
          </>
        ) : (
          <>
            {!loaded && <p role="status" className="absolute inset-0 flex items-center justify-center font-mono text-xs tracking-widest text-text-secondary">OPENING THE EXHIBIT…</p>}
            <iframe key={attempt} title={`${car.year} ${car.team} ${car.name} interactive 3D model by ${car.creator}`}
              src={`https://sketchfab.com/models/${car.modelId}/embed?autostart=1&autospin=0&ui_infos=0&ui_inspector=0&ui_theme=dark`}
              className="absolute inset-0 h-full w-full border-0" allow="autoplay; fullscreen; xr-spatial-tracking" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"
              onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-5 border-t border-line px-4 py-1 text-xs text-text-muted">
        <p className="py-2">{active ? "Drag to orbit · pinch or scroll to zoom" : "Preview first. Load 3D when you’re ready."}</p>
        <a href={car.modelUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 underline underline-offset-4 hover:text-text-primary">Open original viewer<ArrowUpRight size={13} aria-hidden /></a>
      </div>
    </div>
  );
}

export function Garage({ initialCarId }: { initialCarId: string }) {
  const params = useSearchParams();
  const car = getGarageLegend(params.get("car") ?? initialCarId);
  const [copied, setCopied] = useState("");
  const select = (id: string) => { window.history.pushState(null, "", `/garage?car=${id}`); setCopied(""); };
  const share = async () => {
    try { await navigator.clipboard.writeText(`${window.location.origin}/garage?car=${car.id}`); setCopied("Link copied."); }
    catch { setCopied("Copy the page address to share this car."); }
  };
  return (
    <div className="relative">
      <div className="grid grid-cols-3 gap-2 px-3 py-4 sm:gap-3 sm:px-6 lg:px-8" role="group" aria-label="Choose a legendary car">
        {GARAGE_LEGENDS.map((entry, index) => (
          <button key={entry.id} type="button" aria-pressed={entry.id === car.id} onClick={() => select(entry.id)} className="group min-w-0 border bg-bg-secondary p-2 text-left transition-colors hover:bg-bg-hover sm:flex sm:items-center sm:gap-4 sm:p-3" style={{ borderColor: entry.id === car.id ? entry.accent : "#27272A" }}>
            <div className="relative mb-2 aspect-video overflow-hidden sm:mb-0 sm:w-28 sm:shrink-0"><Image src={entry.poster} alt="" fill sizes="112px" className="object-cover" /></div>
            <div className="min-w-0"><span className="font-mono text-[10px] tracking-widest text-text-muted">0{index + 1} / {entry.year}</span><span className="block font-display text-2xl uppercase leading-tight text-text-primary sm:text-3xl">{entry.name}</span><span className="mt-1 hidden truncate text-xs text-text-secondary sm:block">{entry.driver}</span></div>
          </button>
        ))}
      </div>
      <div className="grid border-y border-line lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 lg:border-r lg:border-line"><ModelStage key={car.id} car={car} /></div>
        <article className="min-w-0 border-t border-line bg-bg-secondary p-5 sm:p-7 lg:border-t-0">
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-text-secondary"><span className="h-1.5 w-6" style={{ background: car.accent }} aria-hidden />{car.team}</div>
          <h2 className="my-3 font-display text-6xl uppercase leading-none sm:text-7xl">{car.name}</h2>
          <p className="font-display text-2xl uppercase text-text-secondary">{car.tagline}</p>
          <div className="my-6 flex items-center gap-4 border-y border-line py-4"><span className="font-display text-4xl text-text-muted">#{car.number}</span><div><span className="block font-mono text-[10px] uppercase tracking-widest text-text-muted">The driver</span><span className="font-display text-2xl">{car.driver}</span></div></div>
          <p className="text-sm leading-relaxed text-text-secondary">{car.story}</p>
          <dl className="mt-6 grid grid-cols-3 gap-3 lg:grid-cols-1 lg:gap-4">{car.stats.map((stat) => <div key={stat.label} className="flex flex-col lg:flex-row lg:items-baseline lg:justify-between lg:gap-3"><dt className="order-2 text-xs text-text-muted lg:text-right">{stat.label}</dt><dd className="order-1 font-display text-3xl text-text-primary">{stat.value}</dd></div>)}</dl>
          <button type="button" onClick={share} className="mt-5 min-h-11 text-sm text-text-secondary underline underline-offset-4 hover:text-text-primary">Copy exhibit link</button>
          <p role="status" className="text-xs text-text-secondary">{copied}</p>
        </article>
      </div>
      <div className="grid gap-6 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div><h3 className="mb-2 font-mono text-xs uppercase tracking-widest text-text-muted">Look closer</h3><p className="max-w-2xl text-sm leading-relaxed text-text-secondary">{car.detail}</p></div>
        <details className="text-sm text-text-secondary"><summary className="w-fit cursor-pointer py-2 underline underline-offset-4">Model credits & exhibit notes</summary><div className="space-y-3 py-3 leading-relaxed"><p><a href={car.modelUrl} target="_blank" rel="noopener noreferrer" className="underline">{car.name} model</a> by <a href={car.creatorUrl} target="_blank" rel="noopener noreferrer" className="underline">{car.creator}</a>. {car.credit}{car.credit === "CC BY 4.0" && <> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="underline">License</a></>}.</p><p>Artist-made reconstruction, not official team CAD. Bodywork and liveries represent the creator’s chosen specification. Previews are resized model thumbnails; interactive models remain hosted by their creators on Sketchfab.</p><p><a href={car.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">Read the team’s season history</a> · <a href="/privacy" className="underline">Privacy</a></p></div></details>
      </div>
    </div>
  );
}
