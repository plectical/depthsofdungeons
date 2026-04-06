/**
 * Mobile Game Profiler v1.0
 * Injectable performance profiler for browser-based games on mobile web.
 * Inject via <script src="profiler.js"> or bookmarklet.
 * Public API: window.__GP__ = { show, hide, toggle, report, export }
 */
(function () {
  'use strict';

  if (window.__GP_ACTIVE__) {
    if (window.__GP__) window.__GP__.toggle();
    return;
  }
  window.__GP_ACTIVE__ = true;

  // ─────────────────────────────────────────────
  // CONFIG
  // ─────────────────────────────────────────────
  const CFG = {
    FPS_WARN: 45,
    FPS_CRIT: 25,
    LONGTASK_WARN_MS: 100,
    LONGTASK_CRIT_MS: 300,
    RAF_DELTA_LONGTASK_MS: 80, // iOS Safari fallback: flag frame gaps > Nms
    MEM_SAMPLE_INTERVAL_MS: 5000,
    MEM_LEAK_WINDOW_MS: 30000,
    MEM_LEAK_RATIO: 0.25,
    MEM_HIGH_PCT: 0.80,
    MEM_WARN_PCT: 0.60,
    INPUT_LAG_WARN_MS: 100,
    THERMAL_WINDOW_MS: 10000,
    THERMAL_DROP_RATIO: 0.35,
    MAX_ISSUES: 500,
    FPS_HISTORY_SIZE: 60, // 1 per second
  };

  // ─────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────
  const S = {
    // Session
    startTime: performance.now(),
    frameCount: 0,
    lastRaf: 0,

    // FPS
    currentFps: 0,
    avgFps: 0,
    minFps: Infinity,
    maxFps: 0,
    frameTime: 0,
    framesThisSec: 0,
    lastSecTs: 0,
    fpsHistory: [], // 1 sample/sec, max CFG.FPS_HISTORY_SIZE

    // Memory
    mem: { ok: false, used: 0, total: 0, limit: 0 },
    memSamples: [], // { t, used }

    // Long tasks
    longTaskCount: 0,
    longTaskTotalMs: 0,
    worstLongTask: 0,
    hasNativeLongTask: false,

    // Input latency
    touchPendingTs: 0,
    inputLagSamples: [],
    avgInputLag: 0,

    // CLS
    cls: 0,

    // Errors
    errorCount: 0,

    // WebGL
    webgl: { present: false, renderer: null, vendor: null, contextLost: false },

    // Thermal
    thermalWindow: [], // { t, fps }
    thermalThrottled: false,

    // Issues
    issues: [],
    dedupTs: {}, // key → last fired timestamp
    errorCount_byLevel: { error: 0, warn: 0, info: 0 },

    // UI
    expanded: false,
    activeTab: 'metrics',
    shadow: null,
    pill: null,
    panel: null,
    sparkCanvas: null,
    sparkCtx: null,
    bigCanvas: null,
    bigCtx: null,
  };

  // ─────────────────────────────────────────────
  // ISSUE LOGGER
  // ─────────────────────────────────────────────
  function issue(level, category, msg, detail, dedupKey, cooldownMs) {
    const now = performance.now();

    if (dedupKey) {
      const last = S.dedupTs[dedupKey] || 0;
      if (now - last < (cooldownMs || 5000)) return;
      S.dedupTs[dedupKey] = now;
    }

    const entry = {
      t: Math.round((now - S.startTime) / 1000),
      level, // 'error' | 'warn' | 'info'
      category,
      msg,
      detail: detail || null,
    };

    S.issues.push(entry);
    if (S.issues.length > CFG.MAX_ISSUES) S.issues.shift();
    S.errorCount_byLevel[level] = (S.errorCount_byLevel[level] || 0) + 1;

    refreshBadge();
    if (S.expanded && S.activeTab === 'issues') renderIssuesTab();
  }

  // ─────────────────────────────────────────────
  // RAF LOOP + FPS
  // ─────────────────────────────────────────────
  function rafLoop(now) {
    if (!window.__GP_ACTIVE__) return;

    if (S.lastRaf > 0) {
      const dt = now - S.lastRaf;
      S.frameTime = dt;
      S.frameCount++;

      // iOS Safari long-task fallback: big rAF gap = main thread was blocked
      if (!S.hasNativeLongTask && dt > CFG.RAF_DELTA_LONGTASK_MS) {
        const dur = Math.round(dt);
        S.longTaskCount++;
        S.longTaskTotalMs += dur;
        S.worstLongTask = Math.max(S.worstLongTask, dur);
        const lvl = dur >= CFG.LONGTASK_CRIT_MS ? 'error' : 'warn';
        issue(lvl, 'longtask',
          `Frame gap: ${dur}ms main thread blocked`,
          dur >= CFG.LONGTASK_CRIT_MS ? 'Severe jank — visible freeze' : 'Dropped frames',
          `lt_${Math.round(now / 500)}`, 500);
      }

      // Per-second FPS sample
      S.framesThisSec++;
      if (now - S.lastSecTs >= 1000) {
        const elapsed = now - S.lastSecTs;
        S.currentFps = Math.round(S.framesThisSec / elapsed * 1000);
        S.framesThisSec = 0;
        S.lastSecTs = now;

        if (S.currentFps > 0) {
          S.minFps = Math.min(S.minFps, S.currentFps);
          S.maxFps = Math.max(S.maxFps, S.currentFps);
          S.fpsHistory.push(S.currentFps);
          if (S.fpsHistory.length > CFG.FPS_HISTORY_SIZE) S.fpsHistory.shift();

          // Rolling avg (last 10s)
          const recent = S.fpsHistory.slice(-10);
          S.avgFps = Math.round(recent.reduce((a, b) => a + b, 0) / recent.length);

          // Thermal throttle check
          checkThermal(now);

          // FPS issues
          if (S.currentFps < CFG.FPS_CRIT) {
            issue('error', 'fps', `Critical FPS: ${S.currentFps}`,
              'Game is nearly unplayable', 'fps_crit', 5000);
          } else if (S.currentFps < CFG.FPS_WARN) {
            issue('warn', 'fps', `Low FPS: ${S.currentFps}`,
              'Noticeable lag and dropped frames', 'fps_warn', 8000);
          }
        }
      }

      // Input lag resolution
      if (S.touchPendingTs > 0) {
        const lag = now - S.touchPendingTs;
        S.inputLagSamples.push(lag);
        if (S.inputLagSamples.length > 30) S.inputLagSamples.shift();
        S.avgInputLag = S.inputLagSamples.reduce((a, b) => a + b, 0) / S.inputLagSamples.length;
        S.touchPendingTs = 0;
        if (lag > CFG.INPUT_LAG_WARN_MS) {
          issue('warn', 'input', `Input lag: ${Math.round(lag)}ms`,
            'Touch response feels delayed', 'input_lag', 3000);
        }
      }
    } else {
      S.lastSecTs = now; // initialize
    }

    S.lastRaf = now;

    // Update HUD (every frame for pill, sparkline throttled)
    updatePill();
    if (S.frameCount % 60 === 0) drawSparkline(S.sparkCanvas, S.sparkCtx, 14);
    if (S.expanded && S.activeTab === 'metrics') {
      drawSparkline(S.bigCanvas, S.bigCtx, 44);
      refreshMetricsRows();
    }

    requestAnimationFrame(rafLoop);
  }

  function checkThermal(now) {
    S.thermalWindow.push({ t: now, fps: S.currentFps });
    const cutoff = now - CFG.THERMAL_WINDOW_MS;
    S.thermalWindow = S.thermalWindow.filter(s => s.t > cutoff);

    if (S.thermalWindow.length >= 8 && S.maxFps > 40) {
      const early = S.thermalWindow.slice(0, 4);
      const late = S.thermalWindow.slice(-4);
      const earlyAvg = early.reduce((a, s) => a + s.fps, 0) / early.length;
      const lateAvg = late.reduce((a, s) => a + s.fps, 0) / late.length;
      const wasThrottled = S.thermalThrottled;
      S.thermalThrottled = earlyAvg > 40 && (earlyAvg - lateAvg) / earlyAvg > CFG.THERMAL_DROP_RATIO;
      if (S.thermalThrottled && !wasThrottled) {
        issue('warn', 'device', 'Thermal throttling detected',
          `FPS fell from ~${Math.round(earlyAvg)} → ~${Math.round(lateAvg)} in 10s. Device overheating.`,
          'thermal', 60000);
      }
    }
  }

  // ─────────────────────────────────────────────
  // MEMORY
  // ─────────────────────────────────────────────
  function sampleMemory() {
    if (!performance.memory) return;
    S.mem.ok = true;
    S.mem.used = performance.memory.usedJSHeapSize;
    S.mem.total = performance.memory.totalJSHeapSize;
    S.mem.limit = performance.memory.jsHeapSizeLimit;

    const now = performance.now();
    S.memSamples.push({ t: now, used: S.mem.used });
    const cutoff = now - CFG.MEM_LEAK_WINDOW_MS;
    S.memSamples = S.memSamples.filter(s => s.t > cutoff);

    const pct = S.mem.used / S.mem.limit;
    if (pct > CFG.MEM_HIGH_PCT) {
      issue('error', 'memory', `Critical memory: ${Math.round(pct * 100)}% of heap limit`,
        `${fmtBytes(S.mem.used)} / ${fmtBytes(S.mem.limit)} — tab may crash`,
        'mem_crit', 15000);
    } else if (pct > CFG.MEM_WARN_PCT) {
      issue('warn', 'memory', `High memory: ${Math.round(pct * 100)}% of heap limit`,
        `${fmtBytes(S.mem.used)} / ${fmtBytes(S.mem.limit)}`,
        'mem_warn', 30000);
    }

    if (S.memSamples.length >= 4) {
      const oldest = S.memSamples[0].used;
      const newest = S.memSamples[S.memSamples.length - 1].used;
      if (oldest > 0 && (newest - oldest) / oldest > CFG.MEM_LEAK_RATIO) {
        issue('warn', 'memory',
          `Possible memory leak: +${Math.round((newest - oldest) / oldest * 100)}% in 30s`,
          `${fmtBytes(oldest)} → ${fmtBytes(newest)}`,
          'mem_leak', 30000);
      }
    }
  }
  setInterval(sampleMemory, CFG.MEM_SAMPLE_INTERVAL_MS);

  // ─────────────────────────────────────────────
  // PERFORMANCE OBSERVERS
  // ─────────────────────────────────────────────
  // Long Tasks (Chrome/Android — not iOS Safari)
  try {
    new PerformanceObserver(list => {
      S.hasNativeLongTask = true;
      list.getEntries().forEach(e => {
        const dur = Math.round(e.duration);
        S.longTaskCount++;
        S.longTaskTotalMs += dur;
        S.worstLongTask = Math.max(S.worstLongTask, dur);
        const lvl = dur >= CFG.LONGTASK_CRIT_MS ? 'error' : 'warn';
        issue(lvl, 'longtask', `Long task: ${dur}ms`,
          dur >= CFG.LONGTASK_CRIT_MS ? 'Severe jank — may cause visible freeze' : 'Dropped frames',
          `lt_${Math.round(performance.now() / 500)}`, 500);
      });
    }).observe({ type: 'longtask', buffered: false });
  } catch (e) {
    issue('info', 'platform', 'Long Task API unavailable (likely iOS Safari)',
      'Using rAF delta fallback for frame-gap detection');
  }

  // CLS
  try {
    new PerformanceObserver(list => {
      list.getEntries().forEach(e => {
        if (!e.hadRecentInput) {
          S.cls += e.value;
          if (S.cls > 0.1) {
            issue('warn', 'rendering', `Layout shift: CLS = ${S.cls.toFixed(3)}`,
              'DOM elements are moving unexpectedly — hurts UX and may indicate reflow churn',
              'cls', 15000);
          }
        }
      });
    }).observe({ type: 'layout-shift', buffered: true });
  } catch (e) {}

  // ─────────────────────────────────────────────
  // ERROR LISTENERS
  // ─────────────────────────────────────────────
  const _origOnError = window.onerror;
  window.onerror = function (msg, src, line, col, err) {
    S.errorCount++;
    const file = src ? src.split('/').pop() : '?';
    issue('error', 'js-error', String(msg).slice(0, 120),
      `${file}:${line}:${col}`);
    return _origOnError ? _origOnError.apply(this, arguments) : false;
  };

  const _origOnUnhandled = window.onunhandledrejection;
  window.onunhandledrejection = function (e) {
    S.errorCount++;
    const reason = e.reason ? String(e.reason).slice(0, 120) : 'Unhandled promise rejection';
    issue('error', 'js-error', reason, 'Unhandled Promise');
    if (_origOnUnhandled) _origOnUnhandled.call(this, e);
  };

  // ─────────────────────────────────────────────
  // WEBGL TRACKING
  // ─────────────────────────────────────────────
  function attachWebGL(canvas) {
    if (!canvas || canvas.__gp_bound__) return;
    canvas.__gp_bound__ = true;
    canvas.addEventListener('webglcontextlost', () => {
      S.webgl.contextLost = true;
      issue('error', 'webgl', 'WebGL context lost!',
        'GPU context reclaimed — game will freeze without a webglcontextrestored handler');
    }, { passive: true });
    canvas.addEventListener('webglcontextrestored', () => {
      S.webgl.contextLost = false;
      issue('info', 'webgl', 'WebGL context restored',
        'Game may need to reload GPU assets');
    }, { passive: true });
  }

  document.querySelectorAll('canvas').forEach(attachWebGL);
  new MutationObserver(muts => {
    muts.forEach(m => m.addedNodes.forEach(n => {
      if (n.tagName === 'CANVAS') attachWebGL(n);
      if (n.querySelectorAll) n.querySelectorAll('canvas').forEach(attachWebGL);
    }));
  }).observe(document.documentElement, { childList: true, subtree: true });

  // ─────────────────────────────────────────────
  // INPUT LATENCY
  // ─────────────────────────────────────────────
  window.addEventListener('touchstart', e => {
    S.touchPendingTs = e.timeStamp;
  }, { passive: true, capture: true });
  window.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch') S.touchPendingTs = e.timeStamp;
  }, { passive: true, capture: true });

  // ─────────────────────────────────────────────
  // DEVICE INFO
  // ─────────────────────────────────────────────
  const DEVICE = (function collectDevice() {
    const ua = navigator.userAgent;
    const d = {
      browser: parseBrowser(ua),
      os: parseOS(ua),
      ua,
      cores: navigator.hardwareConcurrency || 'N/A',
      ram: navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'N/A',
      screen: screen.width + '×' + screen.height,
      viewport: window.innerWidth + '×' + window.innerHeight,
      dpr: window.devicePixelRatio || 1,
      connection: null,
      battery: null,
      webgl: null,
    };

    if (navigator.connection) {
      const c = navigator.connection;
      d.connection = {
        type: c.effectiveType || '?',
        downlink: c.downlink != null ? c.downlink + ' Mbps' : 'N/A',
        rtt: c.rtt != null ? c.rtt + 'ms' : 'N/A',
        saveData: !!c.saveData,
      };
      if (/slow-2g|2g/.test(c.effectiveType)) {
        issue('warn', 'network', `Slow network: ${c.effectiveType}`,
          'Asset loads will be very slow — ensure everything is cached');
      }
    }

    if (navigator.getBattery) {
      navigator.getBattery().then(b => {
        d.battery = {
          level: Math.round(b.level * 100) + '%',
          charging: b.charging,
        };
        if (!b.charging && b.level < 0.2) {
          issue('warn', 'device', `Low battery: ${Math.round(b.level * 100)}%`,
            'Device may throttle CPU/GPU on low battery');
        }
      }).catch(() => {});
    }

    // WebGL
    try {
      const tmpC = document.createElement('canvas');
      const gl = tmpC.getContext('webgl') || tmpC.getContext('experimental-webgl');
      if (gl) {
        S.webgl.present = true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
        const vendor = ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
        S.webgl.renderer = renderer;
        S.webgl.vendor = vendor;
        d.webgl = {
          renderer,
          vendor,
          maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        };
        if (/mali-4|mali-t|adreno 3[0-4]|powervr sgx/i.test(renderer)) {
          issue('warn', 'device', `Low-end GPU: ${renderer}`,
            'Reduce shader complexity, draw calls, and texture sizes');
        }
      }
    } catch (e) {}

    if (navigator.deviceMemory && navigator.deviceMemory <= 2) {
      issue('warn', 'device', `Low device RAM: ${navigator.deviceMemory}GB`,
        'Tab may be killed by OS under memory pressure. Keep asset footprint minimal.');
    }
    if (window.devicePixelRatio >= 3) {
      issue('warn', 'device', `High DPR: ${window.devicePixelRatio}×`,
        'Canvas rendering at full DPR is expensive. Consider capping canvas resolution at 2×.');
    }

    return d;
  })();

  function parseBrowser(ua) {
    if (/CriOS/.test(ua)) return 'Chrome (iOS)';
    if (/FxiOS/.test(ua)) return 'Firefox (iOS)';
    if (/EdgA/.test(ua)) return 'Edge (Android)';
    if (/SamsungBrowser/.test(ua)) return 'Samsung Browser';
    if (/OPR|Opera/.test(ua)) return 'Opera';
    if (/Chrome/.test(ua) && /Android/.test(ua)) return 'Chrome (Android)';
    if (/Chrome/.test(ua)) return 'Chrome';
    if (/Firefox/.test(ua)) return 'Firefox';
    if (/Safari/.test(ua) && /iPhone|iPad|iPod/.test(ua)) return 'Safari (iOS)';
    if (/Safari/.test(ua)) return 'Safari';
    return 'Unknown';
  }
  function parseOS(ua) {
    if (/iPhone/.test(ua)) { const m = ua.match(/OS (\d+[_\d]+)/); return 'iOS ' + (m ? m[1].replace(/_/g, '.') : ''); }
    if (/iPad/.test(ua)) { const m = ua.match(/OS (\d+[_\d]+)/); return 'iPadOS ' + (m ? m[1].replace(/_/g, '.') : ''); }
    if (/Android/.test(ua)) { const m = ua.match(/Android ([\d.]+)/); return 'Android ' + (m ? m[1] : ''); }
    if (/Windows/.test(ua)) return 'Windows';
    if (/Macintosh/.test(ua)) return 'macOS';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Unknown';
  }

  // ─────────────────────────────────────────────
  // UTILITIES
  // ─────────────────────────────────────────────
  function fmtBytes(b) {
    if (!b) return '0 B';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    if (b < 1073741824) return (b / 1048576).toFixed(1) + ' MB';
    return (b / 1073741824).toFixed(2) + ' GB';
  }
  function fmtDur(ms) {
    const s = Math.round(ms / 1000);
    if (s < 60) return s + 's';
    return Math.floor(s / 60) + 'm ' + (s % 60) + 's';
  }
  function fpsColor(f) {
    if (f >= CFG.FPS_WARN) return '#4ade80';
    if (f >= CFG.FPS_CRIT) return '#facc15';
    return '#f87171';
  }
  function fpsClass(f) {
    if (f >= CFG.FPS_WARN) return 'good';
    if (f >= CFG.FPS_CRIT) return 'warn';
    return 'bad';
  }

  // ─────────────────────────────────────────────
  // HUD — SHADOW DOM
  // ─────────────────────────────────────────────
  const CSS = `
    :host { all: initial; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    #wrap {
      position: fixed; top: 12px; right: 12px; z-index: 2147483647;
      font-family: ui-monospace, 'SF Mono', 'Cascadia Code', Consolas, monospace;
      user-select: none; touch-action: none;
    }
    #pill {
      display: flex; align-items: center; gap: 6px;
      background: rgba(5,5,15,0.88); border: 1px solid #2a2a3a;
      border-radius: 22px; padding: 6px 12px;
      cursor: pointer; backdrop-filter: blur(8px);
      box-shadow: 0 2px 12px rgba(0,0,0,0.5);
    }
    #fps-num { font-size: 15px; font-weight: 700; color: #4ade80; min-width: 26px; }
    #pill canvas { display: block; }
    #badge {
      font-size: 10px; font-weight: 700; border-radius: 10px;
      padding: 1px 6px; display: none; background: #ef4444; color: #fff;
    }
    #panel {
      display: none; flex-direction: column;
      background: rgba(8,8,20,0.96); border: 1px solid #1e1e30;
      border-radius: 14px; width: 300px; max-height: 72vh;
      overflow: hidden; margin-top: 6px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.6);
      backdrop-filter: blur(10px);
    }
    #panel.open { display: flex; }
    #tabs {
      display: flex; border-bottom: 1px solid #1e1e30; flex-shrink: 0;
    }
    .tab {
      flex: 1; padding: 9px 2px; text-align: center; font-size: 11px;
      color: #555; cursor: pointer; border-bottom: 2px solid transparent;
      transition: color 0.15s;
    }
    .tab.active { color: #e0e0e0; border-bottom-color: #7c3aed; }
    #tab-body {
      overflow-y: auto; flex: 1; padding: 10px 12px;
      -webkit-overflow-scrolling: touch;
    }
    .sec { font-size: 10px; text-transform: uppercase; color: #3a3a5a;
      letter-spacing: 1px; padding: 10px 0 4px; }
    .sec:first-child { padding-top: 2px; }
    .mrow {
      display: flex; justify-content: space-between; align-items: center;
      padding: 4px 0; border-bottom: 1px solid #0e0e1a; font-size: 12px;
    }
    .mrow:last-of-type { border-bottom: none; }
    .ml { color: #555; }
    .mv { color: #c0c0d0; font-weight: 600; }
    .mv.good { color: #4ade80; }
    .mv.warn { color: #facc15; }
    .mv.bad  { color: #f87171; }
    .ii {
      padding: 5px 8px; margin-bottom: 5px; border-radius: 6px;
      font-size: 11px; line-height: 1.45;
    }
    .ii.error { background: rgba(239,68,68,.12); border-left: 3px solid #ef4444; }
    .ii.warn  { background: rgba(250,204,21,.08); border-left: 3px solid #facc15; }
    .ii.info  { background: rgba(96,165,250,.08); border-left: 3px solid #60a5fa; }
    .ii-t { color: #444; font-size: 10px; }
    .ii-m { color: #d0d0e0; margin: 1px 0; }
    .ii-d { color: #666; font-size: 10px; }
    .dr { font-size: 11px; color: #888; padding: 3px 0; }
    .dr b { color: #bbb; }
    .btn {
      display: block; width: 100%; padding: 9px; border-radius: 8px;
      font-size: 12px; font-weight: 600; cursor: pointer; margin-top: 7px;
      border: 1px solid; text-align: center;
    }
    .btn-dl  { background: #1a1a3a; border-color: #4f46e5; color: #a5b4fc; }
    .btn-cp  { background: #0f1f0f; border-color: #15803d; color: #86efac; }
    .btn-clr { background: transparent; border-color: #222; color: #555; }
    .none { color: #333; font-size: 11px; text-align: center; padding: 24px 0; }
    .thermal-alert {
      background: rgba(250,120,21,.12); border: 1px solid #f97316;
      border-radius: 6px; padding: 5px 8px; font-size: 11px; color: #fdba74;
      margin: 4px 0;
    }
  `;

  const host = document.createElement('div');
  host.id = '__gp_host__';
  (document.body || document.documentElement).appendChild(host);
  const shadow = host.attachShadow({ mode: 'closed' });
  S.shadow = shadow;

  const styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  shadow.appendChild(styleEl);

  const wrap = document.createElement('div');
  wrap.id = 'wrap';
  shadow.appendChild(wrap);

  // Pill
  const pill = document.createElement('div');
  pill.id = 'pill';
  pill.innerHTML = '<span id="fps-num">--</span>';
  S.pill = pill;

  const sparkCanvas = document.createElement('canvas');
  sparkCanvas.width = 40; sparkCanvas.height = 14;
  S.sparkCanvas = sparkCanvas;
  S.sparkCtx = sparkCanvas.getContext('2d');
  pill.appendChild(sparkCanvas);

  const badge = document.createElement('span');
  badge.id = 'badge';
  pill.appendChild(badge);
  wrap.appendChild(pill);

  // Panel
  const panel = document.createElement('div');
  panel.id = 'panel';
  S.panel = panel;
  panel.innerHTML = `
    <div id="tabs">
      <div class="tab active" data-tab="metrics">Metrics</div>
      <div class="tab" data-tab="issues">Issues</div>
      <div class="tab" data-tab="device">Device</div>
      <div class="tab" data-tab="export">Export</div>
    </div>
    <div id="tab-body"></div>
  `;
  wrap.appendChild(panel);

  // Tab switching
  panel.querySelector('#tabs').addEventListener('click', e => {
    const t = e.target.dataset.tab;
    if (!t) return;
    S.activeTab = t;
    panel.querySelectorAll('.tab').forEach(el => el.classList.toggle('active', el.dataset.tab === t));
    renderTab(t);
  });

  // Toggle expand
  pill.addEventListener('click', () => {
    S.expanded = !S.expanded;
    panel.classList.toggle('open', S.expanded);
    if (S.expanded) renderTab(S.activeTab);
  }, { passive: true });

  // Drag (touch + mouse)
  let dragState = null;
  pill.addEventListener('pointerdown', e => {
    if (e.target.tagName === 'CANVAS') return; // don't block sparkline tap
    dragState = {
      startX: e.clientX, startY: e.clientY,
      origLeft: wrap.offsetLeft, origTop: wrap.offsetTop,
      moved: false,
    };
    pill.setPointerCapture(e.pointerId);
    e.stopPropagation();
  });
  wrap.addEventListener('pointermove', e => {
    if (!dragState) return;
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragState.moved = true;
      const rect = host.getBoundingClientRect();
      const nx = rect.left + dx;
      const ny = rect.top + dy;
      wrap.style.position = 'fixed';
      // Use parent (wrap is inside shadow, position host)
      host.style.cssText = `position:fixed;top:${Math.max(0,ny)}px;left:${Math.max(0,nx)}px;right:auto;z-index:2147483647`;
      dragState.startX = e.clientX; dragState.startY = e.clientY;
    }
  });
  wrap.addEventListener('pointerup', e => {
    if (dragState && dragState.moved) e.stopPropagation();
    dragState = null;
  });

  // ─────────────────────────────────────────────
  // HUD — UPDATE FUNCTIONS
  // ─────────────────────────────────────────────
  function refreshBadge() {
    const errs = S.errorCount_byLevel.error || 0;
    const warns = S.errorCount_byLevel.warn || 0;
    const total = errs + warns;
    badge.style.display = total > 0 ? 'inline-block' : 'none';
    badge.textContent = errs > 0 ? errs : warns;
    badge.style.background = errs > 0 ? '#ef4444' : '#d97706';
    badge.style.color = errs > 0 ? '#fff' : '#000';
  }

  function updatePill() {
    const fpsEl = shadow.getElementById('fps-num');
    if (fpsEl) {
      fpsEl.textContent = S.currentFps || '--';
      fpsEl.style.color = fpsColor(S.currentFps);
    }
  }

  function drawSparkline(canvas, ctx, h) {
    if (!canvas || !ctx) return;
    const w = canvas.width;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    const hist = S.fpsHistory;
    if (hist.length < 2) return;
    const step = w / (hist.length - 1);
    ctx.beginPath();
    hist.forEach((f, i) => {
      const x = i * step;
      const y = h - Math.max(2, Math.round((Math.min(f, 70) / 70) * (h - 2)));
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = fpsColor(S.currentFps);
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function renderTab(name) {
    const body = shadow.getElementById('tab-body');
    if (!body) return;
    if (name === 'metrics') renderMetricsTab(body);
    else if (name === 'issues') renderIssuesTab(body);
    else if (name === 'device') renderDeviceTab(body);
    else if (name === 'export') renderExportTab(body);
  }

  function mrow(label, val, cls) {
    return `<div class="mrow"><span class="ml">${label}</span><span class="mv ${cls || ''}">${val}</span></div>`;
  }

  function renderMetricsTab(body) {
    const up = fmtDur(performance.now() - S.startTime);
    const memStr = S.mem.ok
      ? `${fmtBytes(S.mem.used)} / ${fmtBytes(S.mem.limit)}`
      : 'N/A (non-Chrome)';
    const memPct = S.mem.ok ? Math.round(S.mem.used / S.mem.limit * 100) : null;
    const memCls = memPct ? (memPct > 80 ? 'bad' : memPct > 60 ? 'warn' : 'good') : '';
    const inputStr = S.inputLagSamples.length > 0 ? Math.round(S.avgInputLag) + 'ms' : 'N/A';
    const inputCls = S.avgInputLag > CFG.INPUT_LAG_WARN_MS ? 'bad' : S.avgInputLag > 60 ? 'warn' : 'good';
    const ltClass = S.longTaskCount > 10 ? 'bad' : S.longTaskCount > 3 ? 'warn' : 'good';

    body.innerHTML = `
      <div class="sec">Frame Rate</div>
      <canvas id="big-spark" width="276" height="44" style="display:block;margin:4px 0 8px;"></canvas>
      ${mrow('Current FPS', S.currentFps || '--', fpsClass(S.currentFps))}
      ${mrow('Avg FPS (10s)', S.avgFps || '--', fpsClass(S.avgFps))}
      ${mrow('Min FPS', S.minFps === Infinity ? '--' : S.minFps, fpsClass(S.minFps))}
      ${mrow('Frame Time', S.frameTime ? S.frameTime.toFixed(1) + 'ms' : '--', S.frameTime > 33 ? 'bad' : S.frameTime > 20 ? 'warn' : 'good')}
      ${S.thermalThrottled ? '<div class="thermal-alert">Thermal throttling active — device overheating</div>' : ''}
      <div class="sec">Memory</div>
      ${mrow('JS Heap', memStr, memCls)}
      ${memPct != null ? mrow('Heap %', memPct + '%', memCls) : ''}
      <div class="sec">Main Thread</div>
      ${mrow('Long Tasks', S.longTaskCount, ltClass)}
      ${mrow('Worst Task', S.worstLongTask ? S.worstLongTask + 'ms' : '--', S.worstLongTask > CFG.LONGTASK_CRIT_MS ? 'bad' : S.worstLongTask > CFG.LONGTASK_WARN_MS ? 'warn' : '')}
      ${mrow('Total Blocked', S.longTaskTotalMs ? fmtDur(S.longTaskTotalMs) : '--')}
      <div class="sec">Input &amp; Other</div>
      ${mrow('Input Lag', inputStr, inputCls)}
      ${mrow('CLS', S.cls.toFixed(3), S.cls > 0.25 ? 'bad' : S.cls > 0.1 ? 'warn' : 'good')}
      ${mrow('JS Errors', S.errorCount, S.errorCount > 0 ? 'bad' : 'good')}
      ${mrow('Session', up)}
    `;

    S.bigCanvas = body.querySelector('#big-spark');
    S.bigCtx = S.bigCanvas ? S.bigCanvas.getContext('2d') : null;
    drawSparkline(S.bigCanvas, S.bigCtx, 44);
  }

  function refreshMetricsRows() {
    // Quick refresh without full re-render — just update text nodes
    // (only if currently showing metrics tab)
    if (S.activeTab !== 'metrics') return;
    const body = shadow.getElementById('tab-body');
    if (body && body.querySelector('#big-spark')) {
      renderMetricsTab(body); // re-render is fast enough at 60fps
    }
  }

  function renderIssuesTab(body) {
    body = body || shadow.getElementById('tab-body');
    if (!body) return;
    const total = S.issues.length;
    if (total === 0) {
      body.innerHTML = '<div class="none">No issues detected yet.</div>';
      return;
    }
    const errCount = S.errorCount_byLevel.error || 0;
    const warnCount = S.errorCount_byLevel.warn || 0;
    const items = [...S.issues].reverse().slice(0, 60).map(i => `
      <div class="ii ${i.level}">
        <div class="ii-t">+${i.t}s &nbsp;·&nbsp; ${i.category.toUpperCase()}</div>
        <div class="ii-m">${i.msg}</div>
        ${i.detail ? `<div class="ii-d">${i.detail}</div>` : ''}
      </div>
    `).join('');
    body.innerHTML = `
      <div style="font-size:10px;color:#444;margin-bottom:6px">
        ${total} total &nbsp;·&nbsp; ${errCount} errors &nbsp;·&nbsp; ${warnCount} warnings
      </div>
      ${items}
      <button class="btn btn-clr" id="clr-btn">Clear all issues</button>
    `;
    body.querySelector('#clr-btn').addEventListener('click', () => {
      S.issues = []; S.errorCount_byLevel = { error: 0, warn: 0, info: 0 };
      refreshBadge();
      renderIssuesTab(body);
    }, { passive: true });
  }

  function renderDeviceTab(body) {
    const c = DEVICE.connection;
    const b = DEVICE.battery;
    const w = DEVICE.webgl;
    body.innerHTML = `
      <div class="sec">Platform</div>
      <div class="dr"><b>Browser:</b> ${DEVICE.browser}</div>
      <div class="dr"><b>OS:</b> ${DEVICE.os}</div>
      <div class="dr"><b>Screen:</b> ${DEVICE.screen} @ ${DEVICE.dpr}× DPR</div>
      <div class="dr"><b>Viewport:</b> ${DEVICE.viewport}</div>
      <div class="sec">Hardware</div>
      <div class="dr"><b>CPU Cores:</b> ${DEVICE.cores}</div>
      <div class="dr"><b>Device RAM:</b> ${DEVICE.ram}</div>
      ${b ? `<div class="dr"><b>Battery:</b> ${b.level} ${b.charging ? '⚡ charging' : '🔋 discharging'}</div>` : ''}
      ${c ? `
        <div class="sec">Network</div>
        <div class="dr"><b>Type:</b> ${c.type}</div>
        <div class="dr"><b>Downlink:</b> ${c.downlink}</div>
        <div class="dr"><b>RTT:</b> ${c.rtt}</div>
        ${c.saveData ? '<div class="dr" style="color:#facc15"><b>Data Saver ON</b></div>' : ''}
      ` : ''}
      ${w ? `
        <div class="sec">WebGL / GPU</div>
        <div class="dr"><b>Renderer:</b> ${w.renderer || 'N/A'}</div>
        <div class="dr"><b>Vendor:</b> ${w.vendor || 'N/A'}</div>
        <div class="dr"><b>Max Texture:</b> ${w.maxTextureSize}px</div>
        ${S.webgl.contextLost ? '<div class="dr" style="color:#f87171"><b>⚠ Context currently LOST</b></div>' : ''}
      ` : '<div class="sec">WebGL</div><div class="dr">No canvas/WebGL detected</div>'}
    `;
  }

  function renderExportTab(body) {
    const up = fmtDur(performance.now() - S.startTime);
    body.innerHTML = `
      <div style="font-size:11px;color:#555;line-height:1.6;margin-bottom:4px;">
        Exports a full JSON report with all metrics, issue log, device info, FPS history, and memory samples.
      </div>
      <div style="font-size:10px;color:#333;margin-bottom:10px;">
        Session: ${up} &nbsp;·&nbsp; Issues: ${S.issues.length} &nbsp;·&nbsp; Errors: ${S.errorCount} &nbsp;·&nbsp; Long Tasks: ${S.longTaskCount}
      </div>
      <button class="btn btn-dl" id="exp-dl">Download JSON Report</button>
      <button class="btn btn-cp" id="exp-cp">Copy to Clipboard</button>
    `;
    body.querySelector('#exp-dl').addEventListener('click', doExport, { passive: true });
    body.querySelector('#exp-cp').addEventListener('click', doCopy, { passive: true });
  }

  // ─────────────────────────────────────────────
  // EXPORT
  // ─────────────────────────────────────────────
  function buildReport() {
    return {
      meta: {
        profilerVersion: '1.0',
        url: location.href,
        exportedAt: new Date().toISOString(),
        sessionDurationMs: Math.round(performance.now() - S.startTime),
      },
      device: DEVICE,
      summary: {
        avgFps: S.avgFps,
        minFps: S.minFps === Infinity ? null : S.minFps,
        maxFps: S.maxFps,
        totalFrames: S.frameCount,
        jsErrorCount: S.errorCount,
        longTaskCount: S.longTaskCount,
        longTaskTotalMs: S.longTaskTotalMs,
        worstLongTaskMs: S.worstLongTask,
        cls: S.cls,
        avgInputLagMs: S.inputLagSamples.length > 0 ? Math.round(S.avgInputLag) : null,
        memUsedBytes: S.mem.ok ? S.mem.used : null,
        memLimitBytes: S.mem.ok ? S.mem.limit : null,
        thermalThrottled: S.thermalThrottled,
        webglContextLost: S.webgl.contextLost,
      },
      issues: S.issues,
      fpsHistory: S.fpsHistory,
      memSamples: S.memSamples,
    };
  }

  function doExport() {
    const data = JSON.stringify(buildReport(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-profile-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function doCopy() {
    const data = JSON.stringify(buildReport(), null, 2);
    navigator.clipboard?.writeText(data).then(() => {
      const btn = shadow.getElementById('exp-cp');
      if (btn) { btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = 'Copy to Clipboard'; }, 2000); }
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = data; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
  }

  // ─────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────
  window.__GP__ = {
    show:   () => { S.expanded = true;  panel.classList.add('open');    renderTab(S.activeTab); },
    hide:   () => { S.expanded = false; panel.classList.remove('open'); },
    toggle: () => window.__GP__[S.expanded ? 'hide' : 'show'](),
    report: buildReport,
    export: doExport,
    state:  S,
  };

  // ─────────────────────────────────────────────
  // START
  // ─────────────────────────────────────────────
  sampleMemory();
  requestAnimationFrame(rafLoop);

  console.log(
    '%c[GameProfiler v1.0] Running%c — tap the FPS pill · window.__GP__.toggle() · window.__GP__.export()',
    'color:#7c3aed;font-weight:bold', 'color:#666'
  );
})();
