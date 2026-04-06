import { StrictMode } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { theme, applyTheme } from './theme';
import { installGlobalErrorHandlers } from './game/errorReporting';

// ── Boot phase tracking ──
// window.__bootPhase is set by the inline script in index.html.
// We update it at each milestone so crash reports show where the failure happened.
declare global {
  interface Window {
    __bootTimestamp?: number;
    __bootPhase?: string;
    __bootErrors?: Array<{ ts: number; phase: string; msg: string; src: string; line: number; col: number }>;
    __bootDevice?: Record<string, unknown>;
  }
}

const bootTime = window.__bootTimestamp ?? Date.now();
window.__bootPhase = 'module_loaded';

// Install global error handlers ASAP — before anything else can throw
installGlobalErrorHandlers();
window.__bootPhase = 'error_handlers_installed';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('[run-template-2d-react] Root element not found');
}

window.__bootPhase = 'creating_root';
const root = createRoot(rootElement);

const render = (node: ReactNode) => {
  root.render(<StrictMode>{node}</StrictMode>);
};

applyTheme(theme);

window.__bootPhase = 'rendering';
render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
window.__bootPhase = 'rendered';

// ── Fire boot telemetry ──
// Report how long it took to get from HTML parse → first React render,
// plus any errors that were captured before our module loaded.
const bootDuration = Date.now() - bootTime;
const earlyErrors = window.__bootErrors ?? [];
const device = window.__bootDevice ?? {};

try {
  RundotGameAPI.analytics.recordCustomEvent('boot_telemetry', {
    boot_ms: bootDuration,
    early_error_count: earlyErrors.length,
    early_errors: JSON.stringify(earlyErrors.slice(0, 5)),
    device_ua: String(device['ua'] ?? '').slice(0, 200),
    device_mem: device['mem'] ?? -1,
    device_cores: device['cores'] ?? -1,
    device_online: device['online'] ?? true,
    device_conn: device['conn'] ?? '',
    device_screen: `${device['screen_w'] ?? 0}x${device['screen_h'] ?? 0}`,
    device_dpr: device['dpr'] ?? 1,
    device_touch: device['touch'] ?? false,
  }).catch(() => {});
} catch {
  // SDK not ready — telemetry lost, but game continues
}

// If there were early errors, also send them individually for easier querying
if (earlyErrors.length > 0) {
  try {
    for (const err of earlyErrors.slice(0, 5)) {
      RundotGameAPI.analytics.recordCustomEvent('boot_error', {
        phase: err.phase,
        message: err.msg,
        source: err.src,
        line: err.line,
        col: err.col,
        time_from_boot_ms: err.ts,
        device_ua: String(device['ua'] ?? '').slice(0, 200),
        device_mem: device['mem'] ?? -1,
        device_conn: device['conn'] ?? '',
      }).catch(() => {});
    }
  } catch {
    // analytics unavailable
  }
}
