/** Ids without a dependency: UUIDs for rows, a short unambiguous code for URLs. */

const SHARE_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

export function newId(): string {
  return crypto.randomUUID();
}

function randomFrom(alphabet: string, length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

/** 10 lowercase chars, no 0/o/1/l: safe to read aloud and to type from a card. */
export function newShareId(): string {
  return randomFrom(SHARE_ALPHABET, 10);
}
