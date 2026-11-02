"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Trophy, X } from "lucide-react";
import { CHAMPION_SOURCE, readCelebration, saveCelebration } from "@/lib/home/champion";
import { scheduleChampionReveal, REVEAL_DURATION_MS } from "@/lib/home/champion-reveal";
import styles from "./champion-celebration.module.css";

/** An ephemeral layer, never a homepage section or a modal. Navigation stays usable. */
export function ChampionCelebration() {
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);
  const replay = useRef<HTMLButtonElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const cleanup = useRef<() => void>(() => {});
  const finish = useCallback(() => {
    cleanup.current();
    // Return focus only if the disappearing reveal held it; never steal it
    // from someone already using the navigation or underlying page.
    if (layer.current?.contains(document.activeElement)) replay.current?.focus();
    setVisible(false);
  }, []);

  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReduced(motion.matches);
    updateMotion();
    motion.addEventListener("change", updateMotion);
    const frame = requestAnimationFrame(() => {
      if (!readCelebration("reveal-seen") && !readCelebration("dismissed")) {
        saveCelebration("reveal-seen");
        setVisible(true);
      }
    });
    return () => { cancelAnimationFrame(frame); motion.removeEventListener("change", updateMotion); };
  }, []);

  useEffect(() => {
    if (!visible) return;
    cleanup.current = scheduleChampionReveal(finish, reduced);
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") finish(); };
    const onVisibility = () => { if (document.hidden) finish(); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cleanup.current();
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [visible, reduced, finish]);

  return (
    <>
      <button ref={replay} className={styles.replay} aria-label="Replay Antonelli championship celebration" title="Celebrate Kimi’s 2026 title" onClick={() => {
        if (visible) finish();
        else setVisible(true);
      }}><Trophy size={15} /><span>12 / CHAMPION</span></button>
      {visible && (
        <div ref={layer} className={`${styles.reveal} ${reduced ? styles.reduced : ""}`} aria-label="Antonelli championship celebration" style={{ "--reveal-duration": `${REVEAL_DURATION_MS}ms` } as CSSProperties}>
          <div className={styles.ambient} aria-hidden="true" />
          <div className={styles.stage}>
            <span className={styles.number} aria-hidden="true">12</span>
            <div className={styles.portrait} aria-hidden="true">
              <div className={styles.backlight} />
              <Image src="/drivers/antonelli-champion-2026.webp" alt="" fill sizes="(max-width: 640px) 120vw, 75vw" className={styles.driver} />
              <div className={styles.lightSweep} />
            </div>
            <div className={styles.topline} aria-hidden="true"><span>F1LYTICS / CHAMPION EDITION</span><span>2026</span></div>
            <div className={styles.copy}>
              <p className={styles.name}><span className={styles.nameRule} aria-hidden="true" />KIMI ANTONELLI<span className={styles.driverNumber}> / 12</span></p>
              <h2 className={styles.title}><span><b>WORLD</b></span><span><b>CHAMPION.</b></span></h2>
              <p className={styles.team}>MERCEDES<span aria-hidden="true"> / </span>ITALY<span className={styles.firstTitle}>FIRST WORLD TITLE</span></p>
            </div>
            <div className={styles.bottomline}>
              <a href={CHAMPION_SOURCE} className={styles.source} target="_blank" rel="noopener noreferrer">MEXICO CITY · 01 NOV 2026 <span aria-hidden="true">↗</span></a>
              <span className={styles.season}>WORLD DRIVERS’ CHAMPIONSHIP</span>
            </div>
          </div>
          <button className={styles.skip} onClick={() => { saveCelebration("dismissed"); finish(); }}>Skip celebration <X size={16} /></button>
          <p className={styles.announcement} role="status">Kimi Antonelli, 2026 World Drivers’ Champion.</p>
        </div>
      )}
    </>
  );
}
