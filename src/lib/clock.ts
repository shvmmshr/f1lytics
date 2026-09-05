/** The wall clock as a seam: server components read it here, tests pass their own. */
export function nowMs(): number {
  return Date.now();
}
