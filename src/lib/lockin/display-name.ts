export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 24;

/** Letters, digits, spaces, underscores; collapsed whitespace; length-bounded. */
export function sanitizeDisplayName(input: string): string | null {
  const cleaned = input.replace(/[^A-Za-z0-9 _]/g, "").replace(/\s+/g, " ").trim();
  if (cleaned.length < DISPLAY_NAME_MIN) return null;
  return cleaned.slice(0, DISPLAY_NAME_MAX).trim();
}

/** Default from the email local part: "max.verstappen+f1@x.com" becomes "max verstappen". */
export function defaultDisplayName(email: string): string {
  const local = email.split("@")[0] ?? "";
  const base = local.split("+")[0].replace(/[._-]+/g, " ");
  return sanitizeDisplayName(base) ?? "Player";
}

/** Append a two-digit suffix when a name is taken; stays inside the max length. */
export function withSuffix(name: string, attempt: number): string {
  const suffix = String(10 + ((attempt * 37) % 90));
  return `${name.slice(0, DISPLAY_NAME_MAX - suffix.length - 1)} ${suffix}`;
}
