/** Prevent the initial render from overwriting a draft before hydration reads it. */
export function createDraftStorage<T>(
  key: string,
  decode: (raw: string) => T | null,
  storage: () => Pick<Storage, "getItem" | "setItem"> = () => localStorage,
) {
  let restored = false;
  return {
    restore(skipStored = false): T | null {
      try {
        if (skipStored) return null; // Saved server picks take precedence.
        const raw = storage().getItem(key);
        return raw === null ? null : decode(raw);
      } catch {
        return null; // Corrupt or unavailable storage must not block the board.
      } finally {
        restored = true;
      }
    },
    persist(draft: T): void {
      if (!restored) return;
      try { storage().setItem(key, JSON.stringify(draft)); }
      catch { /* Keep the in-memory draft usable when storage is unavailable. */ }
    },
  };
}
