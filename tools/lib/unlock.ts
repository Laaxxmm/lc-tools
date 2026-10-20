// One unlock across every tool. A student who gives their WhatsApp number on the
// predictor should not be asked again on the study plan an hour later -- that is
// the fastest way to turn a lead into a bounce.
//
// Stored client-side only, as a timestamp, for 30 days. It is a courtesy, not a
// security boundary: the gated rows are in the page either way. What matters is
// that the lead reached WordPress before this is ever set.

export const UNLOCK_KEY = 'lc-lead:v1';
export const UNLOCK_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/** Fired on window after an unlock, so every gate on the page opens together. */
export const UNLOCK_EVENT = 'lc-unlock';

type Store = Pick<Storage, 'getItem' | 'setItem'>;

/**
 * True when this browser has given a lead within the last 30 days, or gave one
 * for this specific tool under the old per-tool key (those students already
 * handed over an email; asking again would punish them for being early).
 *
 * Every storage access is guarded: private mode and in-app browsers can throw.
 */
export function isUnlocked(store: Store | null | undefined, now: number, slug?: string): boolean {
  if (!store) return false;
  try {
    const raw = store.getItem(UNLOCK_KEY);
    if (raw) {
      const at = Number(JSON.parse(raw)?.at);
      if (Number.isFinite(at) && at <= now && now - at < UNLOCK_TTL_MS) return true;
    }
    if (slug && store.getItem(`lc-unlock:${slug}`) === '1') return true;
  } catch {
    // Corrupt value or blocked storage: treat as locked, never crash a tool.
  }
  return false;
}

export function markUnlocked(store: Store | null | undefined, now: number): void {
  if (!store) return;
  try {
    store.setItem(UNLOCK_KEY, JSON.stringify({ at: now }));
  } catch {
    // Storage blocked. The lead is already saved; the student simply gets asked
    // again next visit, which is the right failure.
  }
}

/** localStorage, or null where touching it throws (some in-app browsers). */
export function browserStore(): Store | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}
