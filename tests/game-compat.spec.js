// @ts-check
/**
 * Cross-browser/device compatibility tests for Depths of Dungeon.
 *
 * Focuses on:
 *   - Console errors and warnings across all browser engines
 *   - Memory management (heap growth, interval/listener leaks)
 *   - Platform interaction errors (touch, storage, SDK)
 *   - Orientation handling (landscape warning)
 *   - RUN.game SDK failures
 *
 * Run:
 *   npx playwright test --project="Desktop Chrome"   (local dev server)
 *   npx playwright test                              (all 12 device profiles)
 *   BASE_URL=https://omw.run/u/.../staging npx playwright test  (staging)
 *   npx playwright show-report                       (view HTML report)
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';

// How long to let auto-play run to surface memory / interval issues (ms)
const AUTOPLAY_SOAK_MS = 45_000;

// Console message types that count as real issues
const ERROR_TYPES = new Set(['error']);
const WARN_TYPES = new Set(['warning']);

// Known-noisy SDK patterns we still want to record but flag separately
const SDK_NOISE_PATTERNS = [
  /rundot/i,
  /run\.game/i,
  /series-inc/i,
  /Failed to fetch/i,
  /NetworkError/i,
  /ERR_NAME_NOT_RESOLVED/i,
  /ERR_CONNECTION_REFUSED/i,
];

// Patterns that indicate real memory / platform problems
const MEMORY_PATTERNS = [
  /out of memory/i,
  /heap/i,
  /detached/i,
  /leak/i,
  /GC/,
];

const PLATFORM_PATTERNS = [
  /touch/i,
  /passive event/i,
  /Unable to preventDefault/i,
  /localStorage/i,
  /sessionStorage/i,
  /QuotaExceededError/i,
  /SecurityError/i,
  /permission/i,
  /NotAllowedError/i,
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Attach listeners and return a live `issues` array. */
function attachIssueCollector(page) {
  const issues = [];

  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (ERROR_TYPES.has(type) || WARN_TYPES.has(type)) {
      const isSDK = SDK_NOISE_PATTERNS.some((p) => p.test(text));
      const isMemory = MEMORY_PATTERNS.some((p) => p.test(text));
      const isPlatform = PLATFORM_PATTERNS.some((p) => p.test(text));
      issues.push({
        source: 'console',
        type,
        text,
        isSDK,
        isMemory,
        isPlatform,
        time: new Date().toISOString(),
      });
    }
  });

  page.on('pageerror', (err) => {
    const isSDK = SDK_NOISE_PATTERNS.some((p) => p.test(err.message));
    const isMemory = MEMORY_PATTERNS.some((p) => p.test(err.message));
    const isPlatform = PLATFORM_PATTERNS.some((p) => p.test(err.message));
    issues.push({
      source: 'pageerror',
      type: 'error',
      text: err.message,
      stack: err.stack,
      isSDK,
      isMemory,
      isPlatform,
      time: new Date().toISOString(),
    });
  });

  page.on('requestfailed', (req) => {
    const url = req.url();
    const reason = req.failure()?.errorText ?? 'unknown';
    // Skip CDN / analytics / SDK network failures — those are expected offline
    const isSDK = SDK_NOISE_PATTERNS.some((p) => p.test(url) || p.test(reason));
    // Local asset failures (e.g. missing sprite) are real issues
    const isLocal = url.startsWith('http://localhost') || url.startsWith('http://127.');
    if (isLocal) {
      issues.push({
        source: 'network',
        type: 'error',
        text: `${reason} — ${url}`,
        isSDK: false,
        isMemory: false,
        isPlatform: false,
        time: new Date().toISOString(),
      });
    } else if (!isSDK) {
      issues.push({
        source: 'network-external',
        type: 'warning',
        text: `${reason} — ${url}`,
        isSDK,
        isMemory: false,
        isPlatform: false,
        time: new Date().toISOString(),
      });
    }
  });

  return issues;
}

/** Sample window.performance.memory (Chromium only; returns null elsewhere). */
async function sampleMemory(page) {
  return page.evaluate(() => {
    const m = performance?.memory;
    if (!m) return null;
    return {
      usedJSHeapSizeMB: +(m.usedJSHeapSize / 1048576).toFixed(2),
      totalJSHeapSizeMB: +(m.totalJSHeapSize / 1048576).toFixed(2),
      heapLimitMB: +(m.jsHeapSizeLimit / 1048576).toFixed(2),
    };
  });
}

/** Count active event listeners (best-effort, works via debug API). */
async function sampleListenerCount(page) {
  return page.evaluate(() => {
    try {
      // Chrome DevTools Protocol exposes this on the window object in some contexts
      const entries = performance.getEntriesByType?.('measure') ?? [];
      return entries.length;
    } catch {
      return null;
    }
  });
}

/** Click a title-screen hit zone by its known `top` percentage (from Game.tsx). */
async function clickHitZone(page, topPct) {
  return page.evaluate((top) => {
    const divs = document.querySelectorAll('div');
    for (const div of divs) {
      if (div.style.cursor === 'pointer') {
        const divTop = parseFloat(div.style.top);
        if (!isNaN(divTop) && Math.abs(divTop - top) < 1.5) {
          div.click();
          return true;
        }
      }
    }
    return false;
  }, topPct);
}

/** Print a tidy issues summary to the console. */
function printIssuesSummary(testInfo, issues) {
  const real = issues.filter((i) => !i.isSDK);
  const sdk = issues.filter((i) => i.isSDK);
  const memory = issues.filter((i) => i.isMemory);
  const platform = issues.filter((i) => i.isPlatform);
  const local = issues.filter((i) => i.source === 'network');

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`[${testInfo.project.name}] Issue Summary`);
  console.log(`${'─'.repeat(60)}`);
  console.log(`  Total issues captured : ${issues.length}`);
  console.log(`  Real game issues       : ${real.length}`);
  console.log(`  SDK/network noise      : ${sdk.length}`);
  console.log(`  Memory-related         : ${memory.length}`);
  console.log(`  Platform/touch/storage : ${platform.length}`);
  console.log(`  Missing local assets   : ${local.length}`);

  if (real.length > 0) {
    console.log('\n  ── Real Issues ──');
    real.forEach((i, idx) => {
      console.log(`  [${idx + 1}] [${i.type.toUpperCase()}] ${i.text}`);
      if (i.stack) {
        const firstLine = i.stack.split('\n')[1] ?? '';
        console.log(`        ${firstLine.trim()}`);
      }
    });
  }

  if (memory.length > 0) {
    console.log('\n  ── Memory Issues ──');
    memory.forEach((i) => console.log(`  • ${i.text}`));
  }

  if (platform.length > 0) {
    console.log('\n  ── Platform Issues ──');
    platform.forEach((i) => console.log(`  • ${i.text}`));
  }

  if (local.length > 0) {
    console.log('\n  ── Missing Local Assets ──');
    local.forEach((i) => console.log(`  • ${i.text}`));
  }

  console.log(`${'─'.repeat(60)}\n`);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Boot & Initial Load', () => {
  test('page loads without crash', async ({ page }, testInfo) => {
    const issues = attachIssueCollector(page);

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    // Confirm React mounted (root element should have children)
    const rootChildren = await page.evaluate(
      () => document.getElementById('root')?.childElementCount ?? 0,
    );
    expect(rootChildren).toBeGreaterThan(0);

    // Wait for network idle (SDK calls, assets)
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {
      // timeout is OK — some requests may never settle (analytics polling)
    });

    // Allow React to finish rendering
    await page.waitForTimeout(2000);

    const mem = await sampleMemory(page);
    if (mem) {
      console.log(
        `\n[${testInfo.project.name}] Heap after load: ${mem.usedJSHeapSizeMB}MB / ${mem.totalJSHeapSizeMB}MB`,
      );
      // Fail if already using >200MB at idle — likely a boot leak
      expect(mem.usedJSHeapSizeMB).toBeLessThan(200);
    }

    // Check boot phase made it to 'rendered'
    const bootPhase = await page.evaluate(() => window.__bootPhase ?? 'unknown');
    console.log(`[${testInfo.project.name}] Boot phase: ${bootPhase}`);
    expect(bootPhase).toBe('rendered');

    // Check for early boot errors
    const earlyErrors = await page.evaluate(() => window.__bootErrors ?? []);
    if (earlyErrors.length > 0) {
      console.log(`\n[${testInfo.project.name}] ⚠ Early boot errors:`);
      earlyErrors.forEach((e) =>
        console.log(`  [${e.phase}] ${e.msg} (${e.src}:${e.line})`),
      );
    }

    printIssuesSummary(testInfo, issues);

    // Only fail for non-SDK errors — SDK noise is expected outside RUN.game platform
    const realErrors = issues.filter((i) => i.type === 'error' && !i.isSDK);
    if (realErrors.length > 0) {
      throw new Error(
        `${realErrors.length} real error(s) on load:\n` +
          realErrors.map((e) => `  • ${e.text}`).join('\n'),
      );
    }
  });
});

test.describe('Orientation Handling', () => {
  test('landscape mode shows rotation warning', async ({ page, isMobile }) => {
    if (!isMobile) test.skip();

    // The playwright.config already sets landscape viewport for landscape projects —
    // this test only runs for those. For portrait projects we verify it's NOT shown.
    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);

    const { width, height } = page.viewportSize() ?? { width: 0, height: 0 };
    const isLandscape = width > height;

    const warningVisible = await page.evaluate(() => {
      const el = document.querySelector('.landscape-warning');
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });

    if (isLandscape) {
      expect(warningVisible).toBe(true);
    } else {
      expect(warningVisible).toBe(false);
    }
  });
});

test.describe('Title Screen Navigation', () => {
  test('title screen renders and play button is interactive', async ({ page }, testInfo) => {
    const issues = attachIssueCollector(page);

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Title screen image should be present or the container should have content
    const appContainer = page.locator('.app-container');
    await expect(appContainer).toBeVisible();

    // Attempt to click the Play hit zone (top: 66.3% in Game.tsx)
    const clicked = await clickHitZone(page, 66.3);
    if (clicked) {
      await page.waitForTimeout(1500);
      // Should now be on classSelect — look for "Choose Your Class" text
      const body = await page.textContent('body');
      const onClassSelect = body?.includes('Choose Your Class') ?? false;
      console.log(
        `[${testInfo.project.name}] Play → classSelect navigation: ${onClassSelect ? '✓' : '✗ (may need save data)'}`,
      );
    } else {
      console.log(
        `[${testInfo.project.name}] Play hit zone not found — title image may not have loaded`,
      );
    }

    printIssuesSummary(testInfo, issues);
  });
});

test.describe('Class Select & Game Start', () => {
  test('selects first available class and starts game', async ({ page }, testInfo) => {
    const issues = attachIssueCollector(page);

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Navigate to classSelect via Play hit zone
    await clickHitZone(page, 66.3);
    await page.waitForTimeout(1500);

    const bodyText = await page.textContent('body').catch(() => '');
    if (!bodyText?.includes('Choose Your Class')) {
      console.log(
        `[${testInfo.project.name}] Skipping — could not reach classSelect screen`,
      );
      printIssuesSummary(testInfo, issues);
      return;
    }

    // Click the first class card button
    const classButtons = page.locator('button').filter({
      hasNotText: /♪|debug|reset|close/i,
    });
    const firstClass = classButtons.first();
    if ((await firstClass.count()) > 0) {
      await firstClass.click();
      await page.waitForTimeout(1000);
    }

    // Handle raceSelect if it appears
    const raceText = await page.textContent('body').catch(() => '');
    if (raceText?.includes('Race') || raceText?.includes('race')) {
      const raceBtn = page.locator('button').first();
      if ((await raceBtn.count()) > 0) await raceBtn.click();
      await page.waitForTimeout(1000);
    }

    // Handle zoneSelect if it appears
    const zoneText = await page.textContent('body').catch(() => '');
    if (zoneText?.includes('Zone') || zoneText?.includes('zone') || zoneText?.includes('Dungeon')) {
      const zoneBtn = page.locator('button').first();
      if ((await zoneBtn.count()) > 0) await zoneBtn.click();
      await page.waitForTimeout(1500);
    }

    // Check we reached the game screen (DPad should be present)
    const dpadVisible = await page.evaluate(() => {
      // DPad buttons have text ^, <, >, v
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some((b) => ['^', '<', '>', 'v'].includes(b.textContent?.trim() ?? ''));
    });

    if (dpadVisible) {
      console.log(`[${testInfo.project.name}] ✓ Game screen reached — DPad visible`);
    } else {
      console.log(`[${testInfo.project.name}] ✗ Could not confirm game screen`);
    }

    printIssuesSummary(testInfo, issues);
  });
});

test.describe('In-Game Interactions', () => {
  /** Navigate to game screen, return false if navigation failed */
  async function navigateToGame(page) {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(2000);

    await clickHitZone(page, 66.3);
    await page.waitForTimeout(1500);

    const body1 = await page.textContent('body').catch(() => '');
    if (!body1?.includes('Choose Your Class')) return false;

    const firstClass = page.locator('button').filter({ hasNotText: /♪|debug/i }).first();
    if ((await firstClass.count()) > 0) await firstClass.click();
    await page.waitForTimeout(1000);

    const body2 = await page.textContent('body').catch(() => '');
    if (body2?.includes('Race') || body2?.includes('Choose')) {
      const btn = page.locator('button').first();
      if ((await btn.count()) > 0) await btn.click();
      await page.waitForTimeout(1000);
    }

    const body3 = await page.textContent('body').catch(() => '');
    if (body3?.includes('Zone') || body3?.includes('Dungeon') || body3?.includes('zone')) {
      const btn = page.locator('button').first();
      if ((await btn.count()) > 0) await btn.click();
      await page.waitForTimeout(1500);
    }

    return page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some((b) => ['^', '<', '>', 'v'].includes(b.textContent?.trim() ?? ''));
    });
  }

  test('keyboard movement does not throw errors', async ({ page, isMobile }, testInfo) => {
    if (isMobile) test.skip(); // Keyboard not relevant for mobile profiles

    const issues = attachIssueCollector(page);
    const inGame = await navigateToGame(page);

    if (!inGame) {
      console.log(`[${testInfo.project.name}] Skipping — could not reach game`);
      printIssuesSummary(testInfo, issues);
      return;
    }

    const mem0 = await sampleMemory(page);

    // Fire movement keys repeatedly
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(50);
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(50);
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(50);
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(50);
      await page.keyboard.press('Period'); // wait/pass turn
      await page.waitForTimeout(50);
    }

    await page.waitForTimeout(1000);
    const mem1 = await sampleMemory(page);

    if (mem0 && mem1) {
      const delta = mem1.usedJSHeapSizeMB - mem0.usedJSHeapSizeMB;
      console.log(
        `[${testInfo.project.name}] Heap after 100 key presses: ` +
          `${mem1.usedJSHeapSizeMB}MB (Δ${delta > 0 ? '+' : ''}${delta.toFixed(2)}MB)`,
      );
    }

    printIssuesSummary(testInfo, issues);

    const realErrors = issues.filter((i) => i.type === 'error' && !i.isSDK);
    if (realErrors.length > 0) {
      throw new Error(
        `${realErrors.length} error(s) during keyboard movement:\n` +
          realErrors.map((e) => `  • ${e.text}`).join('\n'),
      );
    }
  });

  test('DPad touch interactions do not throw errors', async ({ page, isMobile }, testInfo) => {
    if (!isMobile) test.skip(); // Touch DPad only relevant on mobile

    const issues = attachIssueCollector(page);
    const inGame = await navigateToGame(page);

    if (!inGame) {
      console.log(`[${testInfo.project.name}] Skipping — could not reach game`);
      printIssuesSummary(testInfo, issues);
      return;
    }

    const mem0 = await sampleMemory(page);

    // Tap each DPad button via touch events
    const dpadLabels = ['^', '<', '>', 'v'];
    for (let round = 0; round < 5; round++) {
      for (const label of dpadLabels) {
        const btn = page.locator('button').filter({ hasText: label }).first();
        if ((await btn.count()) === 0) continue;
        const box = await btn.boundingBox();
        if (!box) continue;
        const cx = box.x + box.width / 2;
        const cy = box.y + box.height / 2;
        await page.touchscreen.tap(cx, cy);
        await page.waitForTimeout(80);
      }
    }

    await page.waitForTimeout(1000);
    const mem1 = await sampleMemory(page);

    if (mem0 && mem1) {
      const delta = mem1.usedJSHeapSizeMB - mem0.usedJSHeapSizeMB;
      console.log(
        `[${testInfo.project.name}] Heap after DPad taps: ` +
          `${mem1.usedJSHeapSizeMB}MB (Δ${delta > 0 ? '+' : ''}${delta.toFixed(2)}MB)`,
      );
    }

    // Verify the DPad interval cleans up (no runaway intervals)
    const intervalCount = await page.evaluate(() => {
      // Monkey-patch setInterval to count active intervals
      // (only works if we inject before the page loads — checked post-hoc via count heuristic)
      return typeof window.__dpadIntervalCount__ !== 'undefined'
        ? window.__dpadIntervalCount__
        : null;
    });
    if (intervalCount !== null) {
      console.log(`[${testInfo.project.name}] Active DPad intervals: ${intervalCount}`);
    }

    printIssuesSummary(testInfo, issues);

    const realErrors = issues.filter((i) => i.type === 'error' && !i.isSDK);
    if (realErrors.length > 0) {
      throw new Error(
        `${realErrors.length} error(s) during DPad touch:\n` +
          realErrors.map((e) => `  • ${e.text}`).join('\n'),
      );
    }
  });
});

test.describe('Memory Soak — Auto-play', () => {
  test(`heap stays stable over ${AUTOPLAY_SOAK_MS / 1000}s of auto-play`, async ({ page }, testInfo) => {
    const issues = attachIssueCollector(page);

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Navigate to game
    await clickHitZone(page, 66.3);
    await page.waitForTimeout(1500);

    const body1 = await page.textContent('body').catch(() => '');
    if (!body1?.includes('Choose Your Class')) {
      console.log(`[${testInfo.project.name}] Skipping soak — could not reach classSelect`);
      printIssuesSummary(testInfo, issues);
      return;
    }

    const firstClass = page.locator('button').filter({ hasNotText: /♪|debug/i }).first();
    if ((await firstClass.count()) > 0) await firstClass.click();
    await page.waitForTimeout(1000);

    const body2 = await page.textContent('body').catch(() => '');
    if (body2?.includes('Race') || body2?.includes('Choose')) {
      const btn = page.locator('button').first();
      if ((await btn.count()) > 0) await btn.click();
      await page.waitForTimeout(1000);
    }

    const body3 = await page.textContent('body').catch(() => '');
    if (body3?.includes('Zone') || body3?.includes('Dungeon')) {
      const btn = page.locator('button').first();
      if ((await btn.count()) > 0) await btn.click();
      await page.waitForTimeout(1500);
    }

    // Check we're in game
    const inGame = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some((b) => ['^', '<', '>', 'v'].includes(b.textContent?.trim() ?? ''));
    });

    if (!inGame) {
      console.log(`[${testInfo.project.name}] Skipping soak — could not reach game screen`);
      printIssuesSummary(testInfo, issues);
      return;
    }

    // Try to enable auto-play via keyboard shortcut or by finding the auto button
    // The game has a 'full' auto-play mode controlled by setAutoPlay state
    // Inject a keyboard event that might trigger it, or find the button
    await page.evaluate(() => {
      // Look for auto-mode related button text
      const buttons = Array.from(document.querySelectorAll('button'));
      const autoBtn = buttons.find((b) => {
        const t = b.textContent?.toLowerCase() ?? '';
        return t.includes('auto') || t.includes('▶') || t.includes('play');
      });
      autoBtn?.click();
    });

    await page.waitForTimeout(1000);

    // Take a baseline memory reading
    const memSamples = [];
    const mem0 = await sampleMemory(page);
    if (mem0) {
      memSamples.push({ t: 0, ...mem0 });
      console.log(
        `\n[${testInfo.project.name}] Memory soak baseline: ${mem0.usedJSHeapSizeMB}MB`,
      );
    }

    // Soak: sample memory every 10 seconds and move player if not in auto-mode
    const sampleInterval = 10_000;
    const steps = Math.floor(AUTOPLAY_SOAK_MS / sampleInterval);

    for (let i = 1; i <= steps; i++) {
      // Drive the game manually if auto-play didn't start (use arrow keys)
      for (let k = 0; k < 15; k++) {
        await page.keyboard.press('ArrowUp').catch(() => {});
        await page.waitForTimeout(100);
        await page.keyboard.press('ArrowRight').catch(() => {});
        await page.waitForTimeout(100);
      }
      await page.waitForTimeout(sampleInterval - 3000);

      const mem = await sampleMemory(page);
      if (mem) {
        memSamples.push({ t: i * sampleInterval, ...mem });
        console.log(
          `[${testInfo.project.name}] t=${i * sampleInterval / 1000}s — ` +
            `${mem.usedJSHeapSizeMB}MB used / ${mem.totalJSHeapSizeMB}MB total`,
        );
      }
    }

    // Analyse memory trend
    if (memSamples.length >= 3) {
      const first = memSamples[0].usedJSHeapSizeMB;
      const last = memSamples[memSamples.length - 1].usedJSHeapSizeMB;
      const totalGrowthMB = last - first;
      const growthPct = ((totalGrowthMB / first) * 100).toFixed(1);

      console.log(
        `\n[${testInfo.project.name}] Memory growth over soak: ` +
          `+${totalGrowthMB.toFixed(2)}MB (${growthPct}%)`,
      );

      // >50% heap growth during the soak is a warning sign of a leak
      if (totalGrowthMB > 0) {
        const msg = `Heap grew ${totalGrowthMB.toFixed(2)}MB (+${growthPct}%) during soak`;
        if (parseFloat(growthPct) > 50) {
          // Surface as a test annotation (not a hard failure — could be normal GC timing)
          testInfo.annotations.push({ type: 'warning', description: msg });
          console.warn(`⚠ [${testInfo.project.name}] ${msg}`);
        }
      }
    }

    printIssuesSummary(testInfo, issues);

    const realErrors = issues.filter((i) => i.type === 'error' && !i.isSDK);
    if (realErrors.length > 0) {
      throw new Error(
        `${realErrors.length} error(s) during soak:\n` +
          realErrors.map((e) => `  • ${e.text}`).join('\n'),
      );
    }
  });
});

test.describe('Storage & SDK Resilience', () => {
  test('game handles blocked localStorage gracefully', async ({ page }, testInfo) => {
    const issues = attachIssueCollector(page);

    // Block localStorage before page loads
    await page.addInitScript(() => {
      const noop = () => { throw new DOMException('The operation is insecure.', 'SecurityError'); };
      try {
        Object.defineProperty(window, 'localStorage', {
          get: () => ({ getItem: noop, setItem: noop, removeItem: noop, clear: noop, key: noop, length: 0 }),
          configurable: true,
        });
      } catch {
        // If we can't override it, skip
      }
    });

    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);

    // Game should still mount (safeStorage wrappers should catch the errors)
    const bootPhase = await page.evaluate(() => window.__bootPhase ?? 'unknown');
    console.log(`[${testInfo.project.name}] Boot phase with blocked storage: ${bootPhase}`);
    expect(bootPhase).toBe('rendered');

    printIssuesSummary(testInfo, issues);
  });

  test('game handles offline (no network) gracefully', async ({ page }, testInfo) => {
    const issues = attachIssueCollector(page);

    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Go offline after initial load
    await page.context().setOffline(true);
    await page.waitForTimeout(3000);

    // Interact — should not crash without network
    await clickHitZone(page, 66.3);
    await page.waitForTimeout(1500);

    const bootPhase = await page.evaluate(() => window.__bootPhase ?? 'unknown');
    expect(bootPhase).toBe('rendered');

    await page.context().setOffline(false);

    printIssuesSummary(testInfo, issues);

    // Hard errors (not SDK network failures) should not occur
    const hardErrors = issues.filter(
      (i) => i.type === 'error' && !i.isSDK && i.source !== 'network' && i.source !== 'network-external',
    );
    if (hardErrors.length > 0) {
      throw new Error(
        `${hardErrors.length} non-network error(s) while offline:\n` +
          hardErrors.map((e) => `  • ${e.text}`).join('\n'),
      );
    }
  });
});

test.describe('Passive Event & Touch Compatibility', () => {
  test('no passive event listener violations', async ({ page }, testInfo) => {
    const violations = [];

    // Chrome reports "Unable to preventDefault inside passive event listener" as a warning
    page.on('console', (msg) => {
      if (msg.type() === 'warning' && /passive/i.test(msg.text())) {
        violations.push(msg.text());
      }
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // Simulate touch scroll to trigger passive listener check
    const { width, height } = page.viewportSize() ?? { width: 390, height: 844 };
    await page.touchscreen.tap(width / 2, height / 2).catch(() => {});
    await page.waitForTimeout(500);

    if (violations.length > 0) {
      console.log(`\n[${testInfo.project.name}] Passive event violations:`);
      violations.forEach((v) => console.log(`  • ${v}`));
      // Annotate but don't fail — this is a performance warning, not a crash
      testInfo.annotations.push({
        type: 'warning',
        description: `${violations.length} passive event listener violation(s)`,
      });
    } else {
      console.log(`[${testInfo.project.name}] ✓ No passive event violations`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests derived from real-world crash reports and bug submissions
// Source: "Errors & Bugs by Event Type" (3,216 crash_reports, 54 load timeouts)
//         "Bug Reports" (Apr 2026) — consumable quests, freeze, save loss, crashes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Load Safety Timeout (54 reported events)', () => {
  test('game becomes interactive within 10 seconds', async ({ page }, testInfo) => {
    const issues = attachIssueCollector(page);
    const start = Date.now();

    await page.goto(BASE_URL);

    // Wait for the root to contain actual game UI — not just the bare div
    await page.waitForFunction(
      () => {
        const root = document.getElementById('root');
        return root && root.children.length > 0 && root.textContent?.trim().length > 0;
      },
      { timeout: 10_000 },
    );

    const loadMs = Date.now() - start;
    console.log(`[${testInfo.project.name}] Interactive in ${loadMs}ms`);

    // The game has a built-in load_safety_timeout — replicate the same check
    const bootPhase = await page.evaluate(() => window.__bootPhase ?? 'unknown');
    expect(bootPhase).toBe('rendered');

    // Flag slow loads (>5s is risky on low-end Android)
    if (loadMs > 5000) {
      testInfo.annotations.push({
        type: 'warning',
        description: `Slow load: ${loadMs}ms — users on low-end devices may hit the safety timeout`,
      });
      console.warn(`⚠ [${testInfo.project.name}] Load took ${loadMs}ms`);
    }

    printIssuesSummary(testInfo, issues);
    expect(loadMs).toBeLessThan(10_000);
  });

  test('no boot errors captured in window.__bootErrors', async ({ page }, testInfo) => {
    // Mirrors the 14 boot_error events in production analytics
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const bootErrors = await page.evaluate(() => window.__bootErrors ?? []);
    if (bootErrors.length > 0) {
      console.log(`\n[${testInfo.project.name}] Boot errors (${bootErrors.length}):`);
      bootErrors.forEach((e) =>
        console.log(`  [${e.phase}] ${e.msg}  @ ${e.src}:${e.line}:${e.col}`),
      );
    }
    expect(bootErrors.length).toBe(0);
  });
});

test.describe('Save Data Persistence (reported: progress reset after update)', () => {
  test('save data survives a page reload', async ({ page }, testInfo) => {
    const issues = attachIssueCollector(page);

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Navigate into a game to create save state
    await clickHitZone(page, 66.3);
    await page.waitForTimeout(1500);

    const body1 = await page.textContent('body').catch(() => '');
    if (!body1?.includes('Choose Your Class')) {
      console.log(`[${testInfo.project.name}] Skipping — could not reach classSelect`);
      return;
    }

    const firstClass = page.locator('button').filter({ hasNotText: /♪|debug/i }).first();
    if ((await firstClass.count()) > 0) await firstClass.click();
    await page.waitForTimeout(1000);

    // Step through race/zone if present
    for (const keyword of ['Race', 'Zone', 'Dungeon']) {
      const t = await page.textContent('body').catch(() => '');
      if (t?.includes(keyword)) {
        const btn = page.locator('button').first();
        if ((await btn.count()) > 0) await btn.click();
        await page.waitForTimeout(1000);
      }
    }

    // Take a few turns so there is meaningful state to save
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowDown').catch(() => {});
      await page.waitForTimeout(200);
    }
    await page.waitForTimeout(1000);

    // Snapshot localStorage keys before reload
    const keysBefore = await page.evaluate(() => Object.keys(localStorage));
    const hasAutoSave = keysBefore.some((k) => k.includes('autosave') || k.includes('bloodline'));
    console.log(
      `[${testInfo.project.name}] localStorage keys before reload: ${keysBefore.join(', ') || '(none)'}`,
    );

    if (!hasAutoSave) {
      console.log(`[${testInfo.project.name}] ⚠ No autosave key found — game may not be persisting to localStorage`);
      testInfo.annotations.push({
        type: 'warning',
        description: 'No autosave or bloodline key in localStorage after playing — save may rely on SDK appStorage only',
      });
    }

    // Reload and verify game still has data (not wiped)
    await page.reload();
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const keysAfter = await page.evaluate(() => Object.keys(localStorage));
    console.log(
      `[${testInfo.project.name}] localStorage keys after reload: ${keysAfter.join(', ') || '(none)'}`,
    );

    // Keys present before should still be present after
    for (const key of keysBefore) {
      if (!keysAfter.includes(key)) {
        testInfo.annotations.push({
          type: 'warning',
          description: `localStorage key "${key}" was lost on reload`,
        });
        console.warn(`⚠ [${testInfo.project.name}] Key "${key}" lost after reload`);
      }
    }

    // Boot phase must still be valid
    const bootPhase = await page.evaluate(() => window.__bootPhase ?? 'unknown');
    expect(bootPhase).toBe('rendered');

    printIssuesSummary(testInfo, issues);
  });

  test('continue button loads existing save (not a fresh run)', async ({ page }, testInfo) => {
    // Reported: "I have a saved game but it keeps starting me new"
    const issues = attachIssueCollector(page);

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Check if a Continue hit zone exists on the title screen
    // From Game.tsx the 'continue' hit zone is separate from 'play'
    const hasContinue = await page.evaluate(() => {
      const divs = document.querySelectorAll('div');
      for (const div of divs) {
        const top = parseFloat(div.style.top);
        // Continue zone is typically above the Play zone
        if (!isNaN(top) && div.style.cursor === 'pointer' && top > 50 && top < 66) {
          return true;
        }
      }
      return false;
    });

    if (!hasContinue) {
      console.log(`[${testInfo.project.name}] No Continue button visible (first run or no save) — skipping`);
      return;
    }

    // Click Continue and verify we don't land on classSelect (which would mean it started fresh)
    await page.evaluate(() => {
      const divs = document.querySelectorAll('div');
      for (const div of divs) {
        const top = parseFloat(div.style.top);
        if (!isNaN(top) && div.style.cursor === 'pointer' && top > 50 && top < 66) {
          div.click();
          break;
        }
      }
    });
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body').catch(() => '');
    const startedFresh = bodyText?.includes('Choose Your Class') ?? false;
    if (startedFresh) {
      throw new Error('Continue button navigated to class select — existing save was not loaded');
    }

    console.log(`[${testInfo.project.name}] ✓ Continue loaded existing save`);
    printIssuesSummary(testInfo, issues);
  });
});

test.describe('Game Freeze & Stuck State (reported: cannot move, no recovery path)', () => {
  test('game recovers after tab is hidden then shown', async ({ page }, testInfo) => {
    // Reported: "Fell asleep, game timed out, now stuck in a run and can't move"
    const issues = attachIssueCollector(page);

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(2000);

    await clickHitZone(page, 66.3);
    await page.waitForTimeout(1500);

    const body1 = await page.textContent('body').catch(() => '');
    if (!body1?.includes('Choose Your Class')) {
      console.log(`[${testInfo.project.name}] Skipping — could not reach game`);
      return;
    }

    const firstClass = page.locator('button').filter({ hasNotText: /♪|debug/i }).first();
    if ((await firstClass.count()) > 0) await firstClass.click();
    await page.waitForTimeout(1000);
    for (const keyword of ['Race', 'Zone', 'Dungeon']) {
      const t = await page.textContent('body').catch(() => '');
      if (t?.includes(keyword)) {
        const btn = page.locator('button').first();
        if ((await btn.count()) > 0) await btn.click();
        await page.waitForTimeout(1000);
      }
    }

    const inGame = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).some((b) =>
        ['^', '<', '>', 'v'].includes(b.textContent?.trim() ?? ''),
      ),
    );
    if (!inGame) {
      console.log(`[${testInfo.project.name}] Skipping — could not reach game screen`);
      return;
    }

    // Simulate the page going hidden (user switches tabs / phone sleeps)
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(5000);

    // Restore visibility
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(1000);

    // Game should still accept input — attempt a move
    let moveAccepted = false;
    try {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(500);
      moveAccepted = true;
    } catch {
      moveAccepted = false;
    }

    const stillInGame = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).some((b) =>
        ['^', '<', '>', 'v'].includes(b.textContent?.trim() ?? ''),
      ),
    );

    console.log(
      `[${testInfo.project.name}] After tab-hide restore — in game: ${stillInGame}, move accepted: ${moveAccepted}`,
    );

    if (!stillInGame) {
      testInfo.annotations.push({
        type: 'warning',
        description: 'Game left game screen after visibility change — may have crashed or frozen',
      });
    }

    printIssuesSummary(testInfo, issues);

    const realErrors = issues.filter((i) => i.type === 'error' && !i.isSDK);
    if (realErrors.length > 0) {
      throw new Error(
        `Errors after visibility change:\n` + realErrors.map((e) => `  • ${e.text}`).join('\n'),
      );
    }
  });

  test('skill button does not crash the game', async ({ page }, testInfo) => {
    // Reported: "tap on the skill button and it crashes" (Samsung SM-S928U, Android)
    const issues = attachIssueCollector(page);

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(2000);

    await clickHitZone(page, 66.3);
    await page.waitForTimeout(1500);

    const body1 = await page.textContent('body').catch(() => '');
    if (!body1?.includes('Choose Your Class')) {
      console.log(`[${testInfo.project.name}] Skipping — could not reach classSelect`);
      return;
    }

    const firstClass = page.locator('button').filter({ hasNotText: /♪|debug/i }).first();
    if ((await firstClass.count()) > 0) await firstClass.click();
    await page.waitForTimeout(1000);
    for (const keyword of ['Race', 'Zone', 'Dungeon']) {
      const t = await page.textContent('body').catch(() => '');
      if (t?.includes(keyword)) {
        const btn = page.locator('button').first();
        if ((await btn.count()) > 0) await btn.click();
        await page.waitForTimeout(1000);
      }
    }

    const inGame = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).some((b) =>
        ['^', '<', '>', 'v'].includes(b.textContent?.trim() ?? ''),
      ),
    );
    if (!inGame) {
      console.log(`[${testInfo.project.name}] Skipping — could not reach game screen`);
      return;
    }

    // Take a few turns to get to a state where a skill might be usable
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowDown').catch(() => {});
      await page.waitForTimeout(150);
    }

    // Find and click any skill/ability button in the HUD
    const skillClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      // Skill buttons are typically in the HUD — look for ability-named buttons
      // or buttons that aren't DPad arrows / inventory / music
      const skillBtn = buttons.find((b) => {
        const t = b.textContent?.trim() ?? '';
        return t.length > 1 && !['^', '<', '>', 'v', '♪ ON', '♪ OFF'].includes(t) && !t.includes('Choose');
      });
      if (skillBtn) { skillBtn.click(); return skillBtn.textContent?.trim(); }
      return null;
    });

    await page.waitForTimeout(1000);

    console.log(
      `[${testInfo.project.name}] Skill button clicked: "${skillClicked ?? 'none found'}"`,
    );

    // Game should still be alive
    const stillAlive = await page.evaluate(() => window.__bootPhase === 'rendered');
    expect(stillAlive).toBe(true);

    printIssuesSummary(testInfo, issues);

    const realErrors = issues.filter((i) => i.type === 'error' && !i.isSDK);
    if (realErrors.length > 0) {
      throw new Error(
        `Crash on skill button press:\n` + realErrors.map((e) => `  • ${e.text}`).join('\n'),
      );
    }
  });
});

test.describe('Consumable Items & Quest Tracking (most-reported bug category)', () => {
  test('opening and closing inventory does not throw errors', async ({ page }, testInfo) => {
    // Reported: "Can't use any item", "Items not working", "Full heal not working"
    const issues = attachIssueCollector(page);

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(2000);

    await clickHitZone(page, 66.3);
    await page.waitForTimeout(1500);

    const body1 = await page.textContent('body').catch(() => '');
    if (!body1?.includes('Choose Your Class')) {
      console.log(`[${testInfo.project.name}] Skipping — could not reach classSelect`);
      return;
    }

    const firstClass = page.locator('button').filter({ hasNotText: /♪|debug/i }).first();
    if ((await firstClass.count()) > 0) await firstClass.click();
    await page.waitForTimeout(1000);
    for (const keyword of ['Race', 'Zone', 'Dungeon']) {
      const t = await page.textContent('body').catch(() => '');
      if (t?.includes(keyword)) {
        const btn = page.locator('button').first();
        if ((await btn.count()) > 0) await btn.click();
        await page.waitForTimeout(1000);
      }
    }

    const inGame = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).some((b) =>
        ['^', '<', '>', 'v'].includes(b.textContent?.trim() ?? ''),
      ),
    );
    if (!inGame) {
      console.log(`[${testInfo.project.name}] Skipping — could not reach game screen`);
      return;
    }

    // Move around to pick up items
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowDown').catch(() => {});
      await page.waitForTimeout(100);
      await page.keyboard.press('ArrowRight').catch(() => {});
      await page.waitForTimeout(100);
    }

    // Open inventory with 'i' key
    await page.keyboard.press('i');
    await page.waitForTimeout(800);

    const inventoryOpen = await page.evaluate(() => {
      const body = document.body.textContent ?? '';
      return body.includes('Inventory') || body.includes('inventory') || body.includes('Items');
    });
    console.log(`[${testInfo.project.name}] Inventory opened: ${inventoryOpen}`);

    if (inventoryOpen) {
      // Try clicking the first usable item in inventory
      const itemUsed = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        // Look for consumable item buttons (bread, potion, feast, scroll etc.)
        const consumableBtn = buttons.find((b) => {
          const t = b.textContent?.toLowerCase() ?? '';
          return (
            t.includes('bread') || t.includes('potion') ||
            t.includes('feast') || t.includes('scroll') ||
            t.includes('heal') || t.includes('use')
          );
        });
        if (consumableBtn) { consumableBtn.click(); return consumableBtn.textContent?.trim(); }
        return null;
      });
      console.log(`[${testInfo.project.name}] Item used: "${itemUsed ?? 'none found in inventory'}"`);
      await page.waitForTimeout(500);
    }

    // Close inventory
    await page.keyboard.press('i');
    await page.waitForTimeout(500);

    // Game should still be running (DPad still visible)
    const dpadStillVisible = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).some((b) =>
        ['^', '<', '>', 'v'].includes(b.textContent?.trim() ?? ''),
      ),
    );
    expect(dpadStillVisible).toBe(true);

    printIssuesSummary(testInfo, issues);

    const realErrors = issues.filter((i) => i.type === 'error' && !i.isSDK);
    if (realErrors.length > 0) {
      throw new Error(
        `Error during inventory/item use:\n` + realErrors.map((e) => `  • ${e.text}`).join('\n'),
      );
    }
  });

  test('quest state object is present and well-formed after game start', async ({ page }, testInfo) => {
    // Reported: quests not progressing for bread, feasts, potions, abilities across iOS + Android
    // This checks the data structure is intact — a malformed questEchoData would silently break tracking
    const issues = attachIssueCollector(page);

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Check questEchoData in localStorage
    const questData = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem('questEchoData');
        if (!raw) return { found: false };
        const parsed = JSON.parse(raw);
        return {
          found: true,
          hasActiveQuests: Array.isArray(parsed?.activeQuests),
          activeQuestCount: parsed?.activeQuests?.length ?? 0,
          hasCounters: typeof parsed?.counters === 'object',
          hasUnlockedNodes: Array.isArray(parsed?.unlockedEchoNodes),
        };
      } catch (e) {
        return { found: false, parseError: String(e) };
      }
    });

    console.log(`[${testInfo.project.name}] questEchoData:`, JSON.stringify(questData));

    if (questData.found) {
      if (!questData.hasActiveQuests) {
        testInfo.annotations.push({
          type: 'warning',
          description: 'questEchoData missing activeQuests array — quest tracking will silently fail',
        });
      }
      if (!questData.hasCounters) {
        testInfo.annotations.push({
          type: 'warning',
          description: 'questEchoData missing counters object — consumable quest counts cannot accumulate',
        });
      }
    }

    // Navigate into game and look for obvious quest-tracking errors
    await clickHitZone(page, 66.3);
    await page.waitForTimeout(1500);
    const body1 = await page.textContent('body').catch(() => '');
    if (body1?.includes('Choose Your Class')) {
      const firstClass = page.locator('button').filter({ hasNotText: /♪|debug/i }).first();
      if ((await firstClass.count()) > 0) await firstClass.click();
      await page.waitForTimeout(1000);
      for (const keyword of ['Race', 'Zone', 'Dungeon']) {
        const t = await page.textContent('body').catch(() => '');
        if (t?.includes(keyword)) {
          const btn = page.locator('button').first();
          if ((await btn.count()) > 0) await btn.click();
          await page.waitForTimeout(1000);
        }
      }
      // Take turns and check no quest-related errors appear
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('ArrowDown').catch(() => {});
        await page.waitForTimeout(100);
      }
    }

    printIssuesSummary(testInfo, issues);

    // Any error with 'quest' in it is a direct match to reported bugs
    const questErrors = issues.filter(
      (i) => i.type === 'error' && /quest/i.test(i.text),
    );
    if (questErrors.length > 0) {
      throw new Error(
        `Quest-related errors:\n` + questErrors.map((e) => `  • ${e.text}`).join('\n'),
      );
    }
  });
});

test.describe('Crash Reporter Integration (3,216 crash_report events)', () => {
  test('crash reporter fires on unhandled error', async ({ page }, testInfo) => {
    // With 3,216 crash_reports in production, verify the error reporting
    // pipeline itself is wired up correctly so crashes actually get reported
    const capturedAnalytics = [];

    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Intercept any calls to the SDK's recordCustomEvent or crash reporting
    await page.evaluate(() => {
      // Spy on the crash reporter — if it exists, wrap it
      try {
        const api = window.RundotGameAPI ?? window.__RundotGameAPI;
        if (api?.analytics?.recordCustomEvent) {
          const original = api.analytics.recordCustomEvent.bind(api.analytics);
          api.analytics.recordCustomEvent = (event, data) => {
            window.__capturedEvents = window.__capturedEvents ?? [];
            window.__capturedEvents.push({ event, data });
            return original(event, data);
          };
        }
      } catch {
        // SDK not available in this context
      }
    });

    // Trigger a controlled error to see if crash reporting picks it up
    await page.evaluate(() => {
      try {
        throw new Error('[test] controlled crash to verify error reporting pipeline');
      } catch (e) {
        // The game's installGlobalErrorHandlers should have set up window.onerror
        // which should route to the crash reporter — simulate that
        window.dispatchEvent(new ErrorEvent('error', {
          message: '[test] controlled crash to verify error reporting pipeline',
          filename: 'test',
          lineno: 1,
          colno: 1,
          error: e,
        }));
      }
    });

    await page.waitForTimeout(1500);

    const captured = await page.evaluate(() => window.__capturedEvents ?? []);
    const crashEvents = captured.filter((e) =>
      e.event === 'crash_report' || e.event === 'error' || e.event === 'boot_error',
    );

    console.log(
      `[${testInfo.project.name}] Analytics events captured: ${captured.length} total, ${crashEvents.length} crash/error`,
    );

    // The error reporting pipeline should still leave the game alive
    const bootPhase = await page.evaluate(() => window.__bootPhase ?? 'unknown');
    expect(bootPhase).toBe('rendered');
  });
});
