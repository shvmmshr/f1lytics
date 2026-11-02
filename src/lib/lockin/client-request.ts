export type LockInResponse<T> = { ok: true; data: T | null } | { ok: false; error: string };

/** Always resolve to a retryable result, including when fetch rejects offline. */
export async function requestLockIn<T>(url: string, init: RequestInit, fallback: string): Promise<LockInResponse<T>> {
  try {
    const response = await fetch(url, init);
    const data: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const error = data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error : fallback;
      return { ok: false, error };
    }
    return { ok: true, data: data as T | null };
  } catch {
    return { ok: false, error: "Network problem. Check your connection and try again." };
  }
}
