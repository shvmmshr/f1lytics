/** Reject partial numeric strings, signs, fractions and unsafe identifiers. */
export function positiveInteger(value: string | null, max = 1_000_000): number | null {
  if (value === null || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed <= max ? parsed : null;
}
