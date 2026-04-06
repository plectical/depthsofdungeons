import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { reportError } from './errorReporting';

/**
 * Safe storage wrappers with timeout protection and deduplication.
 * Prevents the H5_APP_STORAGE_SET_ITEM timeout cascades seen in crash reports
 * (166 occurrences, 77 users — some hanging for 9+ minutes).
 *
 * localStorage is used as a backup: writes are mirrored there so that if the
 * SDK storage times out on read, we can still recover the data locally.
 */

// ── localStorage backup helpers ──

const LS_PREFIX = 'dod_backup_';

function lsSet(key: string, value: string): void {
  try { localStorage.setItem(LS_PREFIX + key, value); } catch { /* quota / private mode */ }
}

function lsGet(key: string): string | null {
  try { return localStorage.getItem(LS_PREFIX + key); } catch { return null; }
}

// ── Timeout wrapper ──

/** Race a promise against a timeout — returns null on timeout instead of hanging forever. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

// ── Write deduplication ──
// Prevents stacking identical writes when multiple save triggers fire simultaneously
// (visibilitychange + pagehide + beforeunload + freeze can all fire at once).

const _pendingWrites = new Map<string, Promise<void>>();

/**
 * Write a value to appStorage with timeout protection and deduplication.
 * - If a write for the same key is already in-flight, it's skipped (no stacking).
 * - Writes time out after 15 seconds instead of hanging indefinitely (increased from 8s
 *   to reduce the 475 timeout occurrences seen in crash reports).
 * - Errors are reported but never propagated (best-effort).
 * - Always mirrors the write to localStorage as a backup.
 */
export async function safeSetItem(key: string, value: string): Promise<void> {
  // Always write to localStorage immediately (sync, fast)
  lsSet(key, value);

  // Skip SDK write if there's already an in-flight write for this key
  if (_pendingWrites.has(key)) return;

  const writePromise = (async () => {
    try {
      const result = await withTimeout(
        RundotGameAPI.appStorage.setItem(key, value),
        15000, // Increased from 8s to reduce timeout cascades on slow mobile networks
      );
      if (result === null) {
        // Storage timeouts are non-fatal — the game keeps running.
        // Data is safe in localStorage backup.
        try {
          RundotGameAPI.analytics.recordCustomEvent('storage_warning', {
            key,
            type: 'write_timeout',
            message: `setItem('${key}') timed out after 15s — localStorage backup available`,
          }).catch(() => {});
        } catch { /* analytics unavailable */ }
      }
    } catch (e) {
      reportError('storage_write', e, { key });
    } finally {
      _pendingWrites.delete(key);
    }
  })();

  _pendingWrites.set(key, writePromise);
  await writePromise;
}

/**
 * Read a value from appStorage with timeout protection.
 * - Returns null on timeout or error (same as "key not found").
 * - Reads time out after 10 seconds.
 * - Falls back to localStorage backup if SDK read fails or times out.
 */
export async function safeGetItem(key: string): Promise<string | null> {
  try {
    const result = await withTimeout(
      RundotGameAPI.appStorage.getItem(key),
      10000,
    );
    if (result != null) {
      // Mirror to localStorage so backup stays fresh
      lsSet(key, result);
      return result;
    }
    // SDK returned null — could be timeout or genuinely empty.
    // Check localStorage backup before giving up.
    const backup = lsGet(key);
    if (backup !== null) {
      try {
        RundotGameAPI.analytics.recordCustomEvent('storage_warning', {
          key,
          type: 'read_fallback_to_localstorage',
          message: `getItem('${key}') returned null — recovered from localStorage`,
        }).catch(() => {});
      } catch { /* analytics unavailable */ }
    }
    return backup;
  } catch (e) {
    reportError('storage_read', e, { key });
    // Last resort: try localStorage
    return lsGet(key);
  }
}

/**
 * Safely get the current player profile, returning null if the SDK isn't ready
 * or the call fails. This prevents "Profile not available" crashes.
 */
export function safeGetProfile() {
  try {
    return RundotGameAPI.getProfile();
  } catch {
    return null;
  }
}
