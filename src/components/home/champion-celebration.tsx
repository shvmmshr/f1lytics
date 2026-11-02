"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, PartyPopper, X } from "lucide-react";
import { CHAMPION_SOURCE, readCelebration, saveCelebration } from "@/lib/home/champion";
import { confetti } from "@/lib/home/champion-confetti";
import styles from "./champion-celebration.module.css";

export function ChampionCelebration() {
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const cleanup = useRef<() => void>(() => {});
  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReduced(motion.matches);
    updateMotion();
    motion.addEventListener("change", updateMotion);
    const frame = requestAnimationFrame(() => {
      const dismissed = readCelebration("dismissed");
      setVisible(!dismissed);
    });
    return () => { cancelAnimationFrame(frame); motion.removeEventListener("change", updateMotion); };
  }, []);
  useEffect(() => {
    if (!visible || !canvas.current) return;
    if (!readCelebration("seen")) {
      saveCelebration("seen");
      cleanup.current = confetti(canvas.current);
    }
    return () => cleanup.current();
  }, [visible]);
  if (!visible) return null;
  return (
    <section className={styles.champion} aria-labelledby="champion-title">
      <canvas ref={canvas} className={styles.confetti} aria-hidden="true" />
      <div className={styles.grid} aria-hidden="true" />
      <button className={styles.dismiss} aria-label="Dismiss championship celebration" onClick={() => {
        cleanup.current(); saveCelebration("dismissed"); setVisible(false);
      }}><X size={18} /></button>
      <div className={styles.copy}>
        <p className={styles.eyebrow}><span /> THE CROWN IS HIS · 2026</p>
        <h2 id="champion-title" className={styles.title}>KIMI ANTONELLI<span>WORLD CHAMPION.</span></h2>
        <p className={styles.description}>History made. A first world title. A new era in silver.</p>
        <div className={styles.actions}>
          <Link href="/drivers/kimi-antonelli" className={styles.profile}>Meet the champion <ArrowUpRight size={16} /></Link>
          <button className={styles.replay} disabled={reduced} onClick={() => {
            cleanup.current(); if (canvas.current) cleanup.current = confetti(canvas.current);
          }}><PartyPopper size={16} /> {reduced ? "Motion reduced" : "Let it rain"}</button>
        </div>
        <a className={styles.source} href={CHAMPION_SOURCE} target="_blank" rel="noopener noreferrer">TITLE CLINCHED · MEXICO, 01 NOV 2026 ↗</a>
      </div>
      <div className={styles.portrait}>
        <span className={styles.number} aria-hidden="true">12</span>
        <Image src="/drivers/antonelli.webp" alt="Kimi Antonelli" fill sizes="(max-width: 640px) 180px, 400px" className={styles.driver} />
        <span className={styles.signature}>KIMI / MERCEDES</span>
      </div>
    </section>
  );
}
