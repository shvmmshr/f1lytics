/** League invite codes: 8 uppercase chars from an alphabet without 0/O/1/I. */
export const LEAGUE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const LEAGUE_CODE_LENGTH = 8;

export function generateLeagueCode(): string {
  const bytes = new Uint8Array(LEAGUE_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += LEAGUE_CODE_ALPHABET[b % LEAGUE_CODE_ALPHABET.length];
  return out;
}

export function normalizeLeagueCode(input: string): string | null {
  const code = input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length !== LEAGUE_CODE_LENGTH) return null;
  for (const ch of code) if (!LEAGUE_CODE_ALPHABET.includes(ch)) return null;
  return code;
}
