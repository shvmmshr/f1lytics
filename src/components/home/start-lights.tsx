"use client";

/*
 * The five start lights. On page load they illuminate one by one, hold, then
 * extinguish TOGETHER — lights out, the race is on. Pure CSS (see
 * .start-lights in globals.css); each light's on-time is staggered inside a
 * shared fixed-duration animation so the extinguish instant is simultaneous,
 * exactly like the real gantry. prefers-reduced-motion gets a static row.
 */
export function StartLights({ size = 12 }: { size?: number }) {
  return (
    <div className="start-lights flex" style={{ gap: size * 0.8 }} aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
          }}
        />
      ))}
    </div>
  );
}
