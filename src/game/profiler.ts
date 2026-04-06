/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Mobile Game Profiler v1.0 — ES module, no Shadow DOM.
 * Call initProfiler() to start. Subsequent calls toggle visibility.
 */
export function initProfiler(): void {
  const w = window as any;
  if (w.__GP_ACTIVE__) {
    if (w.__GP__) w.__GP__.toggle();
    return;
  }
  w.__GP_ACTIVE__ = true;

  const CFG = {
    FPS_WARN: 45, FPS_CRIT: 25,
    LONGTASK_WARN_MS: 100, LONGTASK_CRIT_MS: 300,
    RAF_DELTA_LONGTASK_MS: 80,
    MEM_SAMPLE_INTERVAL_MS: 5000, MEM_LEAK_WINDOW_MS: 30000, MEM_LEAK_RATIO: 0.25,
    MEM_HIGH_PCT: 0.80, MEM_WARN_PCT: 0.60,
    INPUT_LAG_WARN_MS: 100,
    THERMAL_WINDOW_MS: 10000, THERMAL_DROP_RATIO: 0.35,
    MAX_ISSUES: 500, FPS_HISTORY_SIZE: 60,
  };

  const S: any = {
    startTime: performance.now(), frameCount: 0, lastRaf: 0,
    currentFps: 0, avgFps: 0, minFps: Infinity, maxFps: 0, frameTime: 0,
    framesThisSec: 0, lastSecTs: 0, fpsHistory: [] as number[],
    mem: { ok: false, used: 0, total: 0, limit: 0 }, memSamples: [] as any[],
    longTaskCount: 0, longTaskTotalMs: 0, worstLongTask: 0, hasNativeLongTask: false,
    touchPendingTs: 0, inputLagSamples: [] as number[], avgInputLag: 0,
    cls: 0, errorCount: 0,
    webgl: { present: false, renderer: null as string | null, vendor: null as string | null, contextLost: false },
    thermalWindow: [] as any[], thermalThrottled: false,
    issues: [] as any[], dedupTs: {} as Record<string, number>,
    errorCount_byLevel: { error: 0, warn: 0, info: 0 } as Record<string, number>,
    expanded: false, activeTab: 'metrics',
    // Action timing
    actionTimings: [] as { action: string; ms: number; t: number }[],
    actionStats: {} as Record<string, { count: number; totalMs: number; maxMs: number; minMs: number; avgMs: number }>,
    activeTimers: {} as Record<string, number>,
  };

  // Cleanup tracking for memory leak prevention
  const _cleanup = {
    intervals: [] as number[],
    observers: [] as PerformanceObserver[],
    listeners: [] as { el: EventTarget; type: string; fn: EventListener; opts?: AddEventListenerOptions }[],
    origErr: null as any,
    origRej: null as any,
  };

  // ── Helpers ──
  function fmtBytes(b: number) {
    if (!b) return '0 B';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    if (b < 1073741824) return (b / 1048576).toFixed(1) + ' MB';
    return (b / 1073741824).toFixed(2) + ' GB';
  }
  function fmtDur(ms: number) {
    const s = Math.round(ms / 1000);
    return s < 60 ? s + 's' : Math.floor(s / 60) + 'm ' + (s % 60) + 's';
  }
  function fpsColor(f: number) { return f >= CFG.FPS_WARN ? '#4ade80' : f >= CFG.FPS_CRIT ? '#facc15' : '#f87171'; }
  function fpsClass(f: number) { return f >= CFG.FPS_WARN ? 'good' : f >= CFG.FPS_CRIT ? 'warn' : 'bad'; }

  // ── Issue logger ──
  let badgeEl: HTMLElement;
  let issuesBody: HTMLElement | null = null;

  function issue(level: string, category: string, msg: string, detail?: string, dedupKey?: string, cooldownMs?: number) {
    const now = performance.now();
    if (dedupKey) {
      const last = S.dedupTs[dedupKey] || 0;
      if (now - last < (cooldownMs || 5000)) return;
      S.dedupTs[dedupKey] = now;
    }
    S.issues.push({ t: Math.round((now - S.startTime) / 1000), level, category, msg, detail: detail || null });
    if (S.issues.length > CFG.MAX_ISSUES) S.issues.shift();
    S.errorCount_byLevel[level] = (S.errorCount_byLevel[level] || 0) + 1;
    refreshBadge();
    if (S.expanded && S.activeTab === 'issues' && issuesBody) renderIssuesTab(issuesBody);
  }

  function refreshBadge() {
    if (!badgeEl) return;
    const errs = S.errorCount_byLevel.error || 0;
    const warns = S.errorCount_byLevel.warn || 0;
    const total = errs + warns;
    badgeEl.style.display = total > 0 ? 'inline-block' : 'none';
    badgeEl.textContent = String(errs > 0 ? errs : warns);
    badgeEl.style.background = errs > 0 ? '#ef4444' : '#d97706';
    badgeEl.style.color = errs > 0 ? '#fff' : '#000';
  }

  // ── RAF loop ──
  function rafLoop(now: number) {
    if (!w.__GP_ACTIVE__) return;
    if (S.lastRaf > 0) {
      const dt = now - S.lastRaf;
      S.frameTime = dt; S.frameCount++;
      if (!S.hasNativeLongTask && dt > CFG.RAF_DELTA_LONGTASK_MS) {
        const dur = Math.round(dt);
        S.longTaskCount++; S.longTaskTotalMs += dur;
        S.worstLongTask = Math.max(S.worstLongTask, dur);
        issue(dur >= CFG.LONGTASK_CRIT_MS ? 'error' : 'warn', 'longtask',
          `Frame gap: ${dur}ms`, dur >= CFG.LONGTASK_CRIT_MS ? 'Severe jank' : 'Dropped frames',
          `lt_${Math.round(now / 500)}`, 500);
      }
      S.framesThisSec++;
      if (now - S.lastSecTs >= 1000) {
        S.currentFps = Math.round(S.framesThisSec / (now - S.lastSecTs) * 1000);
        S.framesThisSec = 0; S.lastSecTs = now;
        if (S.currentFps > 0) {
          S.minFps = Math.min(S.minFps, S.currentFps);
          S.maxFps = Math.max(S.maxFps, S.currentFps);
          S.fpsHistory.push(S.currentFps);
          if (S.fpsHistory.length > CFG.FPS_HISTORY_SIZE) S.fpsHistory.shift();
          const recent = S.fpsHistory.slice(-10);
          S.avgFps = Math.round(recent.reduce((a: number, b: number) => a + b, 0) / recent.length);
          checkThermal(now);
          if (S.currentFps < CFG.FPS_CRIT) issue('error', 'fps', `Critical FPS: ${S.currentFps}`, 'Unplayable', 'fps_crit', 5000);
          else if (S.currentFps < CFG.FPS_WARN) issue('warn', 'fps', `Low FPS: ${S.currentFps}`, 'Lag detected', 'fps_warn', 8000);
        }
      }
      if (S.touchPendingTs > 0) {
        const lag = now - S.touchPendingTs;
        S.inputLagSamples.push(lag);
        if (S.inputLagSamples.length > 30) S.inputLagSamples.shift();
        S.avgInputLag = S.inputLagSamples.reduce((a: number, b: number) => a + b, 0) / S.inputLagSamples.length;
        S.touchPendingTs = 0;
        if (lag > CFG.INPUT_LAG_WARN_MS) issue('warn', 'input', `Input lag: ${Math.round(lag)}ms`, 'Delayed', 'input_lag', 3000);
      }
    } else { S.lastSecTs = now; }
    S.lastRaf = now;
    // Update pill FPS number
    if (fpsNumEl) { fpsNumEl.textContent = String(S.currentFps || '--'); fpsNumEl.style.color = fpsColor(S.currentFps); }
    requestAnimationFrame(rafLoop);
  }

  function checkThermal(now: number) {
    S.thermalWindow.push({ t: now, fps: S.currentFps });
    S.thermalWindow = S.thermalWindow.filter((s: any) => s.t > now - CFG.THERMAL_WINDOW_MS);
    if (S.thermalWindow.length >= 8 && S.maxFps > 40) {
      const early = S.thermalWindow.slice(0, 4);
      const late = S.thermalWindow.slice(-4);
      const eAvg = early.reduce((a: number, s: any) => a + s.fps, 0) / early.length;
      const lAvg = late.reduce((a: number, s: any) => a + s.fps, 0) / late.length;
      const was = S.thermalThrottled;
      S.thermalThrottled = eAvg > 40 && (eAvg - lAvg) / eAvg > CFG.THERMAL_DROP_RATIO;
      if (S.thermalThrottled && !was) issue('warn', 'device', 'Thermal throttling', `FPS: ~${Math.round(eAvg)} → ~${Math.round(lAvg)}`, 'thermal', 60000);
    }
  }

  function sampleMemory() {
    const perf = performance as any;
    if (!perf.memory) return;
    S.mem.ok = true; S.mem.used = perf.memory.usedJSHeapSize; S.mem.total = perf.memory.totalJSHeapSize; S.mem.limit = perf.memory.jsHeapSizeLimit;
    const now = performance.now();
    S.memSamples.push({ t: now, used: S.mem.used });
    S.memSamples = S.memSamples.filter((s: any) => s.t > now - CFG.MEM_LEAK_WINDOW_MS);
    const pct = S.mem.used / S.mem.limit;
    if (pct > CFG.MEM_HIGH_PCT) issue('error', 'memory', `Critical: ${Math.round(pct * 100)}%`, `${fmtBytes(S.mem.used)} / ${fmtBytes(S.mem.limit)}`, 'mem_crit', 15000);
    else if (pct > CFG.MEM_WARN_PCT) issue('warn', 'memory', `High: ${Math.round(pct * 100)}%`, `${fmtBytes(S.mem.used)} / ${fmtBytes(S.mem.limit)}`, 'mem_warn', 30000);
    if (S.memSamples.length >= 4) {
      const oldest = S.memSamples[0].used, newest = S.memSamples[S.memSamples.length - 1].used;
      if (oldest > 0 && (newest - oldest) / oldest > CFG.MEM_LEAK_RATIO)
        issue('warn', 'memory', `Leak: +${Math.round((newest - oldest) / oldest * 100)}% in 30s`, `${fmtBytes(oldest)} → ${fmtBytes(newest)}`, 'mem_leak', 30000);
    }
  }
  _cleanup.intervals.push(setInterval(sampleMemory, CFG.MEM_SAMPLE_INTERVAL_MS) as unknown as number);

  // Observers — track for cleanup
  try {
    const ltObserver = new PerformanceObserver(list => {
      S.hasNativeLongTask = true;
      list.getEntries().forEach(e => {
        const dur = Math.round(e.duration); S.longTaskCount++; S.longTaskTotalMs += dur;
        S.worstLongTask = Math.max(S.worstLongTask, dur);
        issue(dur >= CFG.LONGTASK_CRIT_MS ? 'error' : 'warn', 'longtask', `Long task: ${dur}ms`, dur >= CFG.LONGTASK_CRIT_MS ? 'Severe jank' : 'Dropped frames', `lt_${Math.round(performance.now() / 500)}`, 500);
      });
    });
    ltObserver.observe({ type: 'longtask', buffered: false });
    _cleanup.observers.push(ltObserver);
  } catch (_e) { /* not supported */ }
  try {
    const clsObserver = new PerformanceObserver(list => {
      list.getEntries().forEach((e: any) => { if (!e.hadRecentInput) { S.cls += e.value; } });
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
    _cleanup.observers.push(clsObserver);
  } catch (_e) { /* not supported */ }

  // Error listeners — store originals for cleanup
  _cleanup.origErr = w.onerror;
  w.onerror = function (msg: any, src: any, line: any, col: any) {
    S.errorCount++; issue('error', 'js-error', String(msg).slice(0, 120), `${src ? String(src).split('/').pop() : '?'}:${line}:${col}`);
    return _cleanup.origErr ? _cleanup.origErr.apply(w, arguments) : false;
  };
  _cleanup.origRej = w.onunhandledrejection;
  w.onunhandledrejection = function (e: any) {
    S.errorCount++; issue('error', 'js-error', e.reason ? String(e.reason).slice(0, 120) : 'Unhandled promise', 'Promise');
    if (_cleanup.origRej) _cleanup.origRej.call(w, e);
  };

  // Input latency — track listeners for cleanup
  const touchHandler = (e: TouchEvent) => { S.touchPendingTs = e.timeStamp; };
  const pointerHandler = (e: PointerEvent) => { if (e.pointerType === 'touch') S.touchPendingTs = e.timeStamp; };
  window.addEventListener('touchstart', touchHandler as EventListener, { passive: true, capture: true });
  window.addEventListener('pointerdown', pointerHandler as EventListener, { passive: true, capture: true });
  _cleanup.listeners.push(
    { el: window, type: 'touchstart', fn: touchHandler as EventListener, opts: { passive: true, capture: true } },
    { el: window, type: 'pointerdown', fn: pointerHandler as EventListener, opts: { passive: true, capture: true } }
  );

  // Device info
  const nav = navigator as any;
  function parseBrowser(u: string) {
    if (/CriOS/.test(u)) return 'Chrome (iOS)'; if (/FxiOS/.test(u)) return 'Firefox (iOS)';
    if (/SamsungBrowser/.test(u)) return 'Samsung'; if (/Chrome/.test(u) && /Android/.test(u)) return 'Chrome (Android)';
    if (/Chrome/.test(u)) return 'Chrome'; if (/Firefox/.test(u)) return 'Firefox';
    if (/Safari/.test(u) && /iPhone|iPad|iPod/.test(u)) return 'Safari (iOS)'; if (/Safari/.test(u)) return 'Safari'; return '?';
  }
  function parseOS(u: string) {
    if (/iPhone/.test(u)) { const m = u.match(/OS (\d+[_\d]+)/); return 'iOS ' + (m && m[1] ? m[1].replace(/_/g, '.') : ''); }
    if (/iPad/.test(u)) { const m = u.match(/OS (\d+[_\d]+)/); return 'iPadOS ' + (m && m[1] ? m[1].replace(/_/g, '.') : ''); }
    if (/Android/.test(u)) { const m = u.match(/Android ([\d.]+)/); return 'Android ' + (m ? m[1] : ''); }
    if (/Windows/.test(u)) return 'Windows'; if (/Mac/.test(u)) return 'macOS'; return '?';
  }
  const uaStr = navigator.userAgent;
  const DEVICE: any = {
    browser: parseBrowser(uaStr), os: parseOS(uaStr),
    cores: nav.hardwareConcurrency || '?', ram: nav.deviceMemory ? nav.deviceMemory + 'GB' : '?',
    screen: screen.width + 'x' + screen.height, dpr: window.devicePixelRatio || 1,
    viewport: window.innerWidth + 'x' + window.innerHeight,
  };

  // ── BUILD UI (no Shadow DOM — plain divs with inline styles) ──
  const PREFIX = '__gp_';
  const ss = (el: HTMLElement, styles: Record<string, string>) => { Object.assign(el.style, styles); return el; };
  const ce = (tag: string, id?: string) => { const e = document.createElement(tag); if (id) e.id = PREFIX + id; return e; };

  // Container — fixed position, high z-index
  const container = ss(ce('div', 'root'), {
    position: 'fixed', top: '12px', right: '12px', zIndex: '2147483647',
    fontFamily: "ui-monospace, 'SF Mono', Consolas, monospace",
    userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none',
  });

  // Pill
  const pill = ss(ce('div', 'pill'), {
    display: 'flex', alignItems: 'center', gap: '6px',
    background: 'rgba(5,5,15,0.92)', border: '1px solid #2a2a3a',
    borderRadius: '22px', padding: '6px 12px', cursor: 'pointer',
    boxShadow: '0 2px 12px rgba(0,0,0,0.5)', pointerEvents: 'auto',
  });
  const fpsNumEl = ss(ce('span', 'fps'), { fontSize: '15px', fontWeight: '700', color: '#4ade80', minWidth: '26px' });
  fpsNumEl.textContent = '--';
  pill.appendChild(fpsNumEl);

  badgeEl = ss(ce('span', 'badge'), {
    fontSize: '10px', fontWeight: '700', borderRadius: '10px',
    padding: '1px 6px', display: 'none', background: '#ef4444', color: '#fff',
  });
  pill.appendChild(badgeEl);
  container.appendChild(pill);

  // Panel
  const panel = ss(ce('div', 'panel'), {
    display: 'none', flexDirection: 'column',
    background: 'rgba(8,8,20,0.96)', border: '1px solid #1e1e30',
    borderRadius: '14px', width: '280px', maxHeight: '65vh',
    overflow: 'hidden', marginTop: '6px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.6)', pointerEvents: 'auto',
  });

  // Tabs
  const tabNames = ['metrics', 'actions', 'issues', 'device', 'export'] as const;
  const tabBar = ss(ce('div'), { display: 'flex', borderBottom: '1px solid #1e1e30' });
  const tabEls: HTMLElement[] = [];
  tabNames.forEach(name => {
    const tab = ss(ce('div'), {
      flex: '1', padding: '9px 2px', textAlign: 'center', fontSize: '11px',
      color: name === 'metrics' ? '#e0e0e0' : '#555', cursor: 'pointer',
      borderBottom: name === 'metrics' ? '2px solid #7c3aed' : '2px solid transparent',
    });
    tab.textContent = name.charAt(0).toUpperCase() + name.slice(1);
    tab.addEventListener('click', () => {
      S.activeTab = name;
      tabEls.forEach((t, i) => {
        t.style.color = tabNames[i] === name ? '#e0e0e0' : '#555';
        t.style.borderBottomColor = tabNames[i] === name ? '#7c3aed' : 'transparent';
      });
      renderTab(name);
    });
    tabEls.push(tab);
    tabBar.appendChild(tab);
  });
  panel.appendChild(tabBar);

  const tabBody = ss(ce('div', 'body'), {
    overflowY: 'auto', flex: '1', padding: '10px 12px',
    WebkitOverflowScrolling: 'touch', maxHeight: '55vh',
  });
  panel.appendChild(tabBody);
  container.appendChild(panel);

  // Toggle panel
  pill.addEventListener('click', () => {
    S.expanded = !S.expanded;
    panel.style.display = S.expanded ? 'flex' : 'none';
    if (S.expanded) renderTab(S.activeTab);
  });

  // Inject into DOM
  document.body.appendChild(container);

  // ── Tab renderers ──
  function mrow(label: string, val: any, cls?: string) {
    const colors: Record<string, string> = { good: '#4ade80', warn: '#facc15', bad: '#f87171' };
    const vc = cls && colors[cls] ? `color:${colors[cls]}` : 'color:#c0c0d0';
    return `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #0e0e1a;font-size:12px"><span style="color:#555">${label}</span><span style="font-weight:600;${vc}">${val}</span></div>`;
  }
  function sec(t: string) { return `<div style="font-size:10px;text-transform:uppercase;color:#3a3a5a;letter-spacing:1px;padding:10px 0 4px">${t}</div>`; }

  function renderTab(name: string) {
    if (name === 'metrics') renderMetrics();
    else if (name === 'actions') renderActions();
    else if (name === 'issues') renderIssuesTab(tabBody);
    else if (name === 'device') renderDevice();
    else if (name === 'export') renderExport();
  }

  function renderMetrics() {
    const up = fmtDur(performance.now() - S.startTime);
    const memStr = S.mem.ok ? `${fmtBytes(S.mem.used)} / ${fmtBytes(S.mem.limit)}` : 'N/A';
    const memPct = S.mem.ok ? Math.round(S.mem.used / S.mem.limit * 100) : null;
    const memCls = memPct ? (memPct > 80 ? 'bad' : memPct > 60 ? 'warn' : 'good') : '';
    const inputStr = S.inputLagSamples.length > 0 ? Math.round(S.avgInputLag) + 'ms' : 'N/A';
    const inputCls = S.avgInputLag > CFG.INPUT_LAG_WARN_MS ? 'bad' : S.avgInputLag > 60 ? 'warn' : 'good';
    const ltCls = S.longTaskCount > 10 ? 'bad' : S.longTaskCount > 3 ? 'warn' : 'good';
    tabBody.innerHTML = `
      ${sec('Frame Rate')}
      ${mrow('Current FPS', S.currentFps || '--', fpsClass(S.currentFps))}
      ${mrow('Avg FPS (10s)', S.avgFps || '--', fpsClass(S.avgFps))}
      ${mrow('Min FPS', S.minFps === Infinity ? '--' : S.minFps, fpsClass(S.minFps))}
      ${mrow('Frame Time', S.frameTime ? S.frameTime.toFixed(1) + 'ms' : '--', S.frameTime > 33 ? 'bad' : S.frameTime > 20 ? 'warn' : 'good')}
      ${S.thermalThrottled ? '<div style="background:rgba(250,120,21,.12);border:1px solid #f97316;border-radius:6px;padding:5px 8px;font-size:11px;color:#fdba74;margin:4px 0">Thermal throttling!</div>' : ''}
      ${sec('Memory')}
      ${mrow('JS Heap', memStr, memCls)}
      ${memPct != null ? mrow('Heap %', memPct + '%', memCls) : ''}
      ${sec('Main Thread')}
      ${mrow('Long Tasks', S.longTaskCount, ltCls)}
      ${mrow('Worst', S.worstLongTask ? S.worstLongTask + 'ms' : '--', S.worstLongTask > CFG.LONGTASK_CRIT_MS ? 'bad' : S.worstLongTask > CFG.LONGTASK_WARN_MS ? 'warn' : '')}
      ${sec('Input')}
      ${mrow('Input Lag', inputStr, inputCls)}
      ${mrow('CLS', S.cls.toFixed(3), S.cls > 0.25 ? 'bad' : S.cls > 0.1 ? 'warn' : 'good')}
      ${mrow('JS Errors', S.errorCount, S.errorCount > 0 ? 'bad' : 'good')}
      ${mrow('Session', up)}
    `;
  }

  function renderActions() {
    const stats = S.actionStats;
    const keys = Object.keys(stats).sort((a, b) => stats[b].totalMs - stats[a].totalMs);
    if (keys.length === 0) {
      tabBody.innerHTML = '<div style="color:#333;font-size:11px;text-align:center;padding:24px 0">No actions recorded yet. Play the game!</div>';
      return;
    }

    // Summary stats table
    const rows = keys.map(k => {
      const s = stats[k];
      const avgColor = s.avgMs > 50 ? 'color:#f87171' : s.avgMs > 16 ? 'color:#facc15' : 'color:#4ade80';
      const maxColor = s.maxMs > 100 ? 'color:#f87171' : s.maxMs > 33 ? 'color:#facc15' : 'color:#4ade80';
      return `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #0e0e1a;font-size:11px;gap:4px">
        <span style="color:#888;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${k}">${k}</span>
        <span style="color:#666;min-width:28px;text-align:right">${s.count}x</span>
        <span style="${avgColor};min-width:42px;text-align:right;font-weight:600">${s.avgMs.toFixed(1)}</span>
        <span style="${maxColor};min-width:42px;text-align:right">${Math.round(s.maxMs)}</span>
      </div>`;
    }).join('');

    // Recent slow actions (>16ms)
    const slow = [...S.actionTimings].reverse().filter((t: any) => t.ms > 16).slice(0, 20);
    const recentHtml = slow.length === 0 ? '<div style="color:#333;font-size:10px;padding:8px 0;text-align:center">No slow actions yet</div>' :
      slow.map((t: any) => {
        const c = t.ms > 100 ? '#f87171' : t.ms > 33 ? '#facc15' : '#4ade80';
        return `<div style="display:flex;justify-content:space-between;padding:2px 0;font-size:10px;border-bottom:1px solid #0a0a14">
          <span style="color:#555">+${t.t}s</span>
          <span style="color:#888">${t.action}</span>
          <span style="color:${c};font-weight:600">${t.ms.toFixed(1)}ms</span>
        </div>`;
      }).join('');

    tabBody.innerHTML = `
      ${sec('Action Performance')}
      <div style="display:flex;justify-content:space-between;padding:2px 0;font-size:9px;color:#3a3a5a;border-bottom:1px solid #1e1e30">
        <span style="flex:1">Action</span>
        <span style="min-width:28px;text-align:right">Calls</span>
        <span style="min-width:42px;text-align:right">Avg ms</span>
        <span style="min-width:42px;text-align:right">Max ms</span>
      </div>
      ${rows}
      ${sec('Recent Slow Actions (>16ms)')}
      ${recentHtml}
    `;
  }

  function renderIssuesTab(body: HTMLElement) {
    issuesBody = body;
    if (S.issues.length === 0) { body.innerHTML = '<div style="color:#333;font-size:11px;text-align:center;padding:24px 0">No issues yet.</div>'; return; }
    const items = [...S.issues].reverse().slice(0, 40).map((i: any) => {
      const bg = i.level === 'error' ? 'rgba(239,68,68,.12)' : i.level === 'warn' ? 'rgba(250,204,21,.08)' : 'rgba(96,165,250,.08)';
      const bc = i.level === 'error' ? '#ef4444' : i.level === 'warn' ? '#facc15' : '#60a5fa';
      return `<div style="padding:5px 8px;margin-bottom:5px;border-radius:6px;font-size:11px;line-height:1.45;background:${bg};border-left:3px solid ${bc}">
        <div style="color:#444;font-size:10px">+${i.t}s · ${i.category.toUpperCase()}</div>
        <div style="color:#d0d0e0;margin:1px 0">${i.msg}</div>
        ${i.detail ? `<div style="color:#666;font-size:10px">${i.detail}</div>` : ''}
      </div>`;
    }).join('');
    body.innerHTML = `<div style="font-size:10px;color:#444;margin-bottom:6px">${S.issues.length} total</div>${items}`;
  }

  function renderDevice() {
    tabBody.innerHTML = `
      ${sec('Platform')}
      <div style="font-size:11px;color:#888;padding:3px 0"><b style="color:#bbb">Browser:</b> ${DEVICE.browser}</div>
      <div style="font-size:11px;color:#888;padding:3px 0"><b style="color:#bbb">OS:</b> ${DEVICE.os}</div>
      <div style="font-size:11px;color:#888;padding:3px 0"><b style="color:#bbb">Screen:</b> ${DEVICE.screen} @ ${DEVICE.dpr}x</div>
      <div style="font-size:11px;color:#888;padding:3px 0"><b style="color:#bbb">Viewport:</b> ${DEVICE.viewport}</div>
      ${sec('Hardware')}
      <div style="font-size:11px;color:#888;padding:3px 0"><b style="color:#bbb">CPU:</b> ${DEVICE.cores} cores</div>
      <div style="font-size:11px;color:#888;padding:3px 0"><b style="color:#bbb">RAM:</b> ${DEVICE.ram}</div>
    `;
  }

  function buildReport() {
    return {
      meta: { profilerVersion: '1.0', url: location.href, exportedAt: new Date().toISOString(), sessionDurationMs: Math.round(performance.now() - S.startTime) },
      device: DEVICE,
      summary: { avgFps: S.avgFps, minFps: S.minFps === Infinity ? null : S.minFps, maxFps: S.maxFps, totalFrames: S.frameCount, jsErrorCount: S.errorCount, longTaskCount: S.longTaskCount, longTaskTotalMs: S.longTaskTotalMs, worstLongTaskMs: S.worstLongTask, cls: S.cls, avgInputLagMs: S.inputLagSamples.length > 0 ? Math.round(S.avgInputLag) : null, memUsedBytes: S.mem.ok ? S.mem.used : null, memLimitBytes: S.mem.ok ? S.mem.limit : null, thermalThrottled: S.thermalThrottled },
      issues: S.issues, fpsHistory: S.fpsHistory, memSamples: S.memSamples,
      actionStats: S.actionStats, recentActions: S.actionTimings.slice(-100),
    };
  }

  function doExport() {
    const data = JSON.stringify(buildReport(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `game-profile-${Date.now()}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function doCopy() {
    const data = JSON.stringify(buildReport(), null, 2);
    navigator.clipboard?.writeText(data).then(() => {
      const btn = tabBody.querySelector('#__gp_cp_btn') as HTMLElement;
      if (btn) { btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = 'Copy to Clipboard'; }, 2000); }
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = data; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
  }

  function renderExport() {
    const up = fmtDur(performance.now() - S.startTime);
    const btnStyle = 'display:block;width:100%;padding:9px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;margin-top:7px;border:1px solid;text-align:center';
    tabBody.innerHTML = `
      <div style="font-size:11px;color:#555;line-height:1.6;margin-bottom:4px">Exports a full JSON report with all metrics, issue log, device info, FPS history, and memory samples.</div>
      <div style="font-size:10px;color:#333;margin-bottom:10px">Session: ${up} · Issues: ${S.issues.length} · Errors: ${S.errorCount} · Long Tasks: ${S.longTaskCount}</div>
      <button id="__gp_dl_btn" style="${btnStyle};background:#1a1a3a;border-color:#4f46e5;color:#a5b4fc">Download JSON Report</button>
      <button id="__gp_cp_btn" style="${btnStyle};background:#0f1f0f;border-color:#15803d;color:#86efac">Copy to Clipboard</button>
    `;
    tabBody.querySelector('#__gp_dl_btn')!.addEventListener('click', doExport);
    tabBody.querySelector('#__gp_cp_btn')!.addEventListener('click', doCopy);
  }

  // Auto-refresh metrics while expanded — track for cleanup
  _cleanup.intervals.push(setInterval(() => {
    if (S.expanded && S.activeTab === 'metrics') renderMetrics();
    if (S.expanded && S.activeTab === 'actions') renderActions();
  }, 1000) as unknown as number);

  // ── Action timing API ──
  function timeStart(action: string) {
    S.activeTimers[action] = performance.now();
  }

  function timeEnd(action: string) {
    const start = S.activeTimers[action];
    if (start === undefined) return;
    delete S.activeTimers[action];
    const ms = performance.now() - start;
    const t = Math.round((performance.now() - S.startTime) / 1000);

    // Store individual timing
    S.actionTimings.push({ action, ms: Math.round(ms * 100) / 100, t });
    if (S.actionTimings.length > 500) S.actionTimings.shift();

    // Update aggregate stats
    let stat = S.actionStats[action];
    if (!stat) { stat = { count: 0, totalMs: 0, maxMs: 0, minMs: Infinity, avgMs: 0 }; S.actionStats[action] = stat; }
    stat.count++;
    stat.totalMs += ms;
    stat.maxMs = Math.max(stat.maxMs, ms);
    stat.minMs = Math.min(stat.minMs, ms);
    stat.avgMs = Math.round(stat.totalMs / stat.count * 100) / 100;

    // Flag slow actions as issues
    if (ms > 50) {
      issue(ms > 200 ? 'error' : 'warn', 'action', `Slow: ${action} took ${Math.round(ms)}ms`,
        ms > 200 ? 'Causes visible freeze' : 'May drop frames',
        `action_${action}`, 2000);
    }
  }

  // Convenience: time a sync function
  function timeAction<T>(action: string, fn: () => T): T {
    timeStart(action);
    try { return fn(); } finally { timeEnd(action); }
  }

  // Cleanup function to prevent memory leaks
  function destroy() {
    // Stop the RAF loop
    w.__GP_ACTIVE__ = false;

    // Clear all intervals
    _cleanup.intervals.forEach(id => clearInterval(id));
    _cleanup.intervals.length = 0;

    // Disconnect all observers
    _cleanup.observers.forEach(obs => obs.disconnect());
    _cleanup.observers.length = 0;

    // Remove all event listeners
    _cleanup.listeners.forEach(({ el, type, fn, opts }) => {
      el.removeEventListener(type, fn, opts);
    });
    _cleanup.listeners.length = 0;

    // Restore original error handlers
    w.onerror = _cleanup.origErr;
    w.onunhandledrejection = _cleanup.origRej;

    // Remove UI from DOM
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }

    // Clear the global reference
    delete w.__GP__;
  }

  // Public API
  w.__GP__ = {
    show: () => { S.expanded = true; panel.style.display = 'flex'; renderTab(S.activeTab); },
    hide: () => { S.expanded = false; panel.style.display = 'none'; },
    toggle: () => w.__GP__[S.expanded ? 'hide' : 'show'](),
    report: buildReport,
    export: doExport,
    destroy,
    state: S,
    timeStart,
    timeEnd,
    time: timeAction,
  };

  // Start
  sampleMemory();
  requestAnimationFrame(rafLoop);
}
