/** A bounded, decorative canvas: no animation dependency, input interception or loop at rest. */
export function confetti(canvas: HTMLCanvasElement): () => void {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const context = canvas.getContext("2d");
  if (!context) return () => {};
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  context.scale(ratio, ratio);
  const colors = ["#27F4D2", "#CFD5D6", "#E8BE68"];
  const pieces = Array.from({ length: 85 }, (_, i) => ({
    x: width * (i % 2 ? 0.15 : 0.85), y: height * 0.85,
    vx: (Math.random() - 0.5) * 440, vy: -240 - Math.random() * 360,
    rotation: Math.random() * Math.PI, color: colors[i % colors.length],
  }));
  let frame = 0;
  let start: number | undefined;
  let previous = 0;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const stop = () => { cancelAnimationFrame(frame); context.clearRect(0, 0, width, height); };
  const tick = (time: number) => {
    start ??= time;
    const elapsed = (time - start) / 1000;
    const dt = Math.min((time - (previous || time)) / 1000, 0.04);
    previous = time;
    context.clearRect(0, 0, width, height);
    context.globalAlpha = Math.min(1, (3.6 - elapsed) / 0.8);
    for (const piece of pieces) {
      piece.x += piece.vx * dt; piece.y += piece.vy * dt;
      piece.vy += 260 * dt; piece.rotation += dt * 4;
      context.save(); context.translate(piece.x, piece.y); context.rotate(piece.rotation);
      context.fillStyle = piece.color; context.fillRect(-3, -5, 6, 10); context.restore();
    }
    if (elapsed < 3.6 && !motion.matches) frame = requestAnimationFrame(tick);
    else stop();
  };
  motion.addEventListener("change", stop);
  frame = requestAnimationFrame(tick);
  return () => { stop(); motion.removeEventListener("change", stop); };
}

/** Delay the finale until the title lands. Every timer and frame is cancellable. */
export function scheduleChampionReveal(canvas: HTMLCanvasElement, finish: () => void, reduced: boolean): () => void {
  let stopConfetti = () => {};
  const finale = reduced ? undefined : setTimeout(() => { stopConfetti = confetti(canvas); }, 1400);
  const end = setTimeout(finish, reduced ? 3500 : 6200);
  return () => { clearTimeout(finale); clearTimeout(end); stopConfetti(); };
}
