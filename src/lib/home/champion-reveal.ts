export const REVEAL_DURATION_MS = 6600;
export const REDUCED_REVEAL_DURATION_MS = 3500;

/** A single cancellable lifetime; CSS handles the reveal without a render loop. */
export function scheduleChampionReveal(finish: () => void, reduced: boolean): () => void {
  const end = setTimeout(finish, reduced ? REDUCED_REVEAL_DURATION_MS : REVEAL_DURATION_MS);
  return () => clearTimeout(end);
}
