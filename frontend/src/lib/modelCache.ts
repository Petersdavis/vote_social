/**
 * Shared model-cache preference for the browser-side embedding widgets.
 *
 * Both the semantic categorization widget and the auto-moderation widget load
 * the same Transformers.js model into the same Cache Storage bucket. When a
 * user clears that cache we must remember the decision globally—otherwise the
 * other widget (or a later mount) would immediately re-download the model.
 *
 * The flag lives in `localStorage` so it survives full page reloads and is
 * shared across every widget instance on the origin. While the flag is set,
 * nothing should trigger a model download; only an explicit "Reload model"
 * action clears it.
 */

/** localStorage key holding the global "do not auto-download the model" flag. */
export const MODEL_CACHE_CLEARED_KEY = "model_cache_manually_cleared";

/** True when the user has manually cleared the model cache and not reloaded. */
export function isModelCacheManuallyCleared(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MODEL_CACHE_CLEARED_KEY) === "true";
  } catch {
    return false;
  }
}

/** Persist the global "cache was manually cleared" flag. */
export function setModelCacheManuallyCleared(cleared: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (cleared) {
      window.localStorage.setItem(MODEL_CACHE_CLEARED_KEY, "true");
    } else {
      window.localStorage.removeItem(MODEL_CACHE_CLEARED_KEY);
    }
  } catch {
    // Ignore localStorage quota/privacy errors.
  }
}

/**
 * Subscribe to changes of the global flag. Fires for same-tab writes (via the
 * custom event) and cross-tab writes (via the native `storage` event).
 * Returns an unsubscribe function.
 */
export function subscribeModelCacheCleared(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key === MODEL_CACHE_CLEARED_KEY) listener();
  };
  const onLocal = () => listener();

  window.addEventListener("storage", onStorage);
  window.addEventListener(MODEL_CACHE_CLEARED_EVENT, onLocal);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(MODEL_CACHE_CLEARED_EVENT, onLocal);
  };
}

/** Internal event name used to notify same-tab subscribers of flag changes. */
const MODEL_CACHE_CLEARED_EVENT = "model-cache-cleared-change";

/**
 * Set the flag and notify same-tab subscribers. Prefer this over
 * `setModelCacheManuallyCleared` when other widgets are mounted in the same tab.
 */
export function broadcastModelCacheCleared(cleared: boolean): void {
  setModelCacheManuallyCleared(cleared);
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(MODEL_CACHE_CLEARED_EVENT));
}
