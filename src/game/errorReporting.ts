import RundotGameAPI from '@series-inc/rundot-game-sdk/api';

/**
 * Centralized error reporting — catches uncaught errors, reports to analytics
 * and SDK logging so crashes can be traced and diagnosed.
 */

// ── Device context (captured once) ──

function getDeviceContext(): Record<string, unknown> {
  // Prefer the early-boot snapshot if available, otherwise gather now
  const boot = (window as any).__bootDevice;
  if (boot) return boot;
  const nav = navigator as any;
  return {
    ua: (nav.userAgent || '').slice(0, 200),
    mem: nav.deviceMemory ?? -1,
    cores: nav.hardwareConcurrency ?? -1,
    online: nav.onLine !== false,
    conn: (nav.connection || nav.mozConnection || nav.webkitConnection || {}).effectiveType || '',
    screen_w: screen.width || 0,
    screen_h: screen.height || 0,
    dpr: window.devicePixelRatio || 1,
  };
}

// ── Game context for error reports ──

interface GameContext {
  screen: string;
  playerClass: string;
  zone: string;
  floor: number;
  generation: number;
  playerId: string;
}

let _gameCtx: GameContext = {
  screen: 'title',
  playerClass: '',
  zone: '',
  floor: 0,
  generation: 0,
  playerId: '',
};

/** Update the current game context so error reports include what the player was doing. */
export function updateErrorContext(partial: Partial<GameContext>) {
  _gameCtx = { ..._gameCtx, ...partial };
}

// ── Deduplication — don't spam the same error repeatedly ──

const _recentErrors = new Set<string>();
const MAX_RECENT = 50;

function isDuplicate(key: string): boolean {
  if (_recentErrors.has(key)) return true;
  if (_recentErrors.size >= MAX_RECENT) _recentErrors.clear();
  _recentErrors.add(key);
  return false;
}

// ── Core reporting function ──

export function reportError(
  source: string,
  error: unknown,
  extra?: Record<string, unknown>,
) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack ?? '' : '';

  // Deduplicate by source + message
  const key = `${source}:${message}`;
  if (isDuplicate(key)) return;

  // 1) SDK structured logging (viewable in support tools)
  RundotGameAPI.error(`[${source}] ${message}`, {
    source,
    message,
    stack,
    ..._gameCtx,
    ...extra,
  });

  // 2) Analytics custom event (queryable in dashboard) — fire-and-forget with 5s timeout
  const device = getDeviceContext();
  try {
    const analyticsPromise = RundotGameAPI.analytics.recordCustomEvent('crash_report', {
      source,
      message: message.slice(0, 200), // truncate for analytics
      stack: stack.slice(0, 500),
      screen: _gameCtx.screen,
      player_class: _gameCtx.playerClass,
      zone: _gameCtx.zone,
      floor: _gameCtx.floor,
      generation: _gameCtx.generation,
      player_id: _gameCtx.playerId,
      device_ua: String(device['ua'] ?? '').slice(0, 200),
      device_mem: device['mem'] ?? -1,
      device_conn: device['conn'] ?? '',
      device_online: device['online'] ?? true,
      ...extra,
    });
    // Don't await indefinitely — timeout after 5s to prevent cascading hangs
    Promise.race([
      analyticsPromise,
      new Promise<void>((resolve) => setTimeout(resolve, 5000)),
    ]).catch(() => {});
  } catch {
    // Analytics itself failed — nothing we can do
  }
}

// ── Global handlers for uncaught errors ──

let _installed = false;

export function installGlobalErrorHandlers() {
  if (_installed) return;
  _installed = true;

  // Uncaught synchronous errors
  window.onerror = (
    message: string | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error,
  ) => {
    reportError('uncaught_error', error ?? message, {
      file: source ?? '',
      line: lineno ?? 0,
      col: colno ?? 0,
    });
    // Don't suppress — let the ErrorBoundary also handle if applicable
    return false;
  };

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const msg = event.reason instanceof Error ? event.reason.message : String(event.reason ?? '');

    // Filter platform SDK internal RPC timeouts — these are not from our code,
    // spam crash reports, and don't affect gameplay. Each of these has been
    // verified in production crash data as pure platform noise:
    //   H5_DEBUG: 78+ occurrences, SDK debug channel
    //   H5_LOG_ANALYTICS_EVENT: platform analytics delivery
    //   H5_TRIGGER_HAPTIC: ~820 occurrences, OS-level haptic feedback (not called by our game)
    //   H5_APP_STORAGE_SET_ITEM: handled by safeStorage.ts with localStorage fallback
    //   H5_APP_STORAGE_GET_ITEM: handled by safeStorage.ts with localStorage fallback
    // Platform SDK RPC timeouts — not from our code
    const platformRpcNoise = [
      'H5_DEBUG',
      'H5_LOG_ANALYTICS_EVENT',
      'H5_TRIGGER_HAPTIC',
      'H5_APP_STORAGE_SET_ITEM',
      'H5_APP_STORAGE_GET_ITEM',
    ];
    if (platformRpcNoise.some((rpc) => msg.includes(rpc))) return;

    // Transient errors handled by retry logic or not actionable
    // "signal is aborted without reason" (409 occurrences) — AbortController cancellation
    // "Failed to start the audio device" (55) — iOS autoplay restriction, harmless
    if (msg.includes('signal is aborted without reason')) return;
    if (msg.includes('Failed to start the audio device')) return;

    reportError('unhandled_promise', event.reason, {
      promise_type: typeof event.reason,
    });
  });
}

// ── Safe wrapper for game engine calls ──

/**
 * Wraps a game engine function call in a try/catch.
 * If it throws, reports the error and returns null so the game can recover.
 */
export function safeEngineCall<T>(
  fnName: string,
  fn: () => T,
): T | null {
  try {
    return fn();
  } catch (error) {
    reportError(`engine_${fnName}`, error);
    return null;
  }
}
