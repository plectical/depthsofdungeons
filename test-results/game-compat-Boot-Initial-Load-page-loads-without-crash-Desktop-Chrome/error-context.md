# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: game-compat.spec.js >> Boot & Initial Load >> page loads without crash
- Location: tests\game-compat.spec.js:229:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "rendered"
Received: "game_ready"
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e8]:
        - generic [ref=e9]:
          - generic [ref=e10]: Warrior
          - generic [ref=e11]: Lv1
          - generic [ref=e12]: HP
          - generic [ref=e13]:
            - text: "[███████"
            - text: "]"
          - generic [ref=e14]: 30/30
        - generic [ref=e15]:
          - generic [ref=e16]: Rage
          - generic [ref=e17]:
            - text: "["
            - text: ░░░░░░░]
          - generic [ref=e18]: 0/100
        - generic [ref=e19]:
          - generic [ref=e20]: Food
          - generic [ref=e21]:
            - text: "[███████"
            - text: "]"
          - generic [ref=e22]: 100/100
          - generic [ref=e23]: "|"
          - generic [ref=e24]: XP
          - generic [ref=e25]:
            - text: "["
            - text: ░░░░]
        - generic [ref=e26]:
          - generic [ref=e27]: Atk:7
          - generic [ref=e28]: Def:3
          - generic [ref=e29]: Spd:7
          - generic [ref=e30]: "|"
          - generic [ref=e31]: Gold:0
          - generic [ref=e32]: F:1
      - generic [ref=e33]:
        - generic [ref=e34]:
          - generic [ref=e35]: Journey
          - generic [ref=e37]: 0%
        - generic [ref=e38]:
          - generic [ref=e39]: Move
          - generic [ref=e40]: Pick up
          - generic [ref=e41]: Kill
          - generic [ref=e42]: Use item
          - generic [ref=e43]: Auto
          - generic [ref=e44]: Floor 2
          - generic [ref=e45]: Die
      - generic [ref=e46]:
        - button "⭐ 2x Gold" [ref=e47] [cursor=pointer]
        - button "♪" [ref=e48] [cursor=pointer]
      - link "Discord" [ref=e49] [cursor=pointer]:
        - /url: https://discord.gg/A9ayUtVv2Q
      - generic [ref=e54] [cursor=pointer]: F1 [+]
      - generic [ref=e55]:
        - generic [ref=e56]: "> You enter Stone Depths as a Warrior!"
        - generic [ref=e57]: "> Tap to move. Find the stairs (>) to descend."
      - generic [ref=e58]:
        - button "[ RAGE ]" [disabled] [ref=e60]
        - generic [ref=e62]:
          - button "^" [ref=e63] [cursor=pointer]
          - button "<" [ref=e64] [cursor=pointer]
          - button ">" [ref=e65] [cursor=pointer]
          - button "v" [ref=e66] [cursor=pointer]
        - generic [ref=e67]:
          - button "[ Me ]" [ref=e68] [cursor=pointer]
          - button "[ Quests ]" [ref=e69] [cursor=pointer]
          - button "[ Skills ]" [ref=e70] [cursor=pointer]
          - button "[ Bag ]" [ref=e71] [cursor=pointer]
          - button "[ Wait ]" [ref=e72] [cursor=pointer]
          - button "[ End Run ]" [ref=e73] [cursor=pointer]
          - generic [ref=e74]:
            - button "[ Auto ]" [ref=e75] [cursor=pointer]
            - button "FULL" [ref=e76] [cursor=pointer]
    - insertion [ref=e79]:
      - iframe [ref=e81]:
        
  - generic [ref=e83] [cursor=pointer]:
    - img "The Elder" [ref=e85]
    - generic [ref=e86]:
      - generic [ref=e87]: The Elder
      - generic [ref=e88]: Another soul in the depths... I am The Elder. No one ever leaves. Move with the arrows. Walk into monsters to fight. Find the stairs > to go deeper.
      - generic [ref=e89]: "[ Tap to continue ]"
```

# Test source

```ts
  160 | }
  161 | 
  162 | /** Click a title-screen hit zone by its known `top` percentage (from Game.tsx). */
  163 | async function clickHitZone(page, topPct) {
  164 |   return page.evaluate((top) => {
  165 |     const divs = document.querySelectorAll('div');
  166 |     for (const div of divs) {
  167 |       if (div.style.cursor === 'pointer') {
  168 |         const divTop = parseFloat(div.style.top);
  169 |         if (!isNaN(divTop) && Math.abs(divTop - top) < 1.5) {
  170 |           div.click();
  171 |           return true;
  172 |         }
  173 |       }
  174 |     }
  175 |     return false;
  176 |   }, topPct);
  177 | }
  178 | 
  179 | /** Print a tidy issues summary to the console. */
  180 | function printIssuesSummary(testInfo, issues) {
  181 |   const real = issues.filter((i) => !i.isSDK);
  182 |   const sdk = issues.filter((i) => i.isSDK);
  183 |   const memory = issues.filter((i) => i.isMemory);
  184 |   const platform = issues.filter((i) => i.isPlatform);
  185 |   const local = issues.filter((i) => i.source === 'network');
  186 | 
  187 |   console.log(`\n${'─'.repeat(60)}`);
  188 |   console.log(`[${testInfo.project.name}] Issue Summary`);
  189 |   console.log(`${'─'.repeat(60)}`);
  190 |   console.log(`  Total issues captured : ${issues.length}`);
  191 |   console.log(`  Real game issues       : ${real.length}`);
  192 |   console.log(`  SDK/network noise      : ${sdk.length}`);
  193 |   console.log(`  Memory-related         : ${memory.length}`);
  194 |   console.log(`  Platform/touch/storage : ${platform.length}`);
  195 |   console.log(`  Missing local assets   : ${local.length}`);
  196 | 
  197 |   if (real.length > 0) {
  198 |     console.log('\n  ── Real Issues ──');
  199 |     real.forEach((i, idx) => {
  200 |       console.log(`  [${idx + 1}] [${i.type.toUpperCase()}] ${i.text}`);
  201 |       if (i.stack) {
  202 |         const firstLine = i.stack.split('\n')[1] ?? '';
  203 |         console.log(`        ${firstLine.trim()}`);
  204 |       }
  205 |     });
  206 |   }
  207 | 
  208 |   if (memory.length > 0) {
  209 |     console.log('\n  ── Memory Issues ──');
  210 |     memory.forEach((i) => console.log(`  • ${i.text}`));
  211 |   }
  212 | 
  213 |   if (platform.length > 0) {
  214 |     console.log('\n  ── Platform Issues ──');
  215 |     platform.forEach((i) => console.log(`  • ${i.text}`));
  216 |   }
  217 | 
  218 |   if (local.length > 0) {
  219 |     console.log('\n  ── Missing Local Assets ──');
  220 |     local.forEach((i) => console.log(`  • ${i.text}`));
  221 |   }
  222 | 
  223 |   console.log(`${'─'.repeat(60)}\n`);
  224 | }
  225 | 
  226 | // ── Tests ─────────────────────────────────────────────────────────────────────
  227 | 
  228 | test.describe('Boot & Initial Load', () => {
  229 |   test('page loads without crash', async ({ page }, testInfo) => {
  230 |     const issues = attachIssueCollector(page);
  231 | 
  232 |     await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  233 | 
  234 |     // Confirm React mounted (root element should have children)
  235 |     const rootChildren = await page.evaluate(
  236 |       () => document.getElementById('root')?.childElementCount ?? 0,
  237 |     );
  238 |     expect(rootChildren).toBeGreaterThan(0);
  239 | 
  240 |     // Wait for network idle (SDK calls, assets)
  241 |     await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {
  242 |       // timeout is OK — some requests may never settle (analytics polling)
  243 |     });
  244 | 
  245 |     // Allow React to finish rendering
  246 |     await page.waitForTimeout(2000);
  247 | 
  248 |     const mem = await sampleMemory(page);
  249 |     if (mem) {
  250 |       console.log(
  251 |         `\n[${testInfo.project.name}] Heap after load: ${mem.usedJSHeapSizeMB}MB / ${mem.totalJSHeapSizeMB}MB`,
  252 |       );
  253 |       // Fail if already using >200MB at idle — likely a boot leak
  254 |       expect(mem.usedJSHeapSizeMB).toBeLessThan(200);
  255 |     }
  256 | 
  257 |     // Check boot phase made it to 'rendered'
  258 |     const bootPhase = await page.evaluate(() => window.__bootPhase ?? 'unknown');
  259 |     console.log(`[${testInfo.project.name}] Boot phase: ${bootPhase}`);
> 260 |     expect(bootPhase).toBe('rendered');
      |                       ^ Error: expect(received).toBe(expected) // Object.is equality
  261 | 
  262 |     // Check for early boot errors
  263 |     const earlyErrors = await page.evaluate(() => window.__bootErrors ?? []);
  264 |     if (earlyErrors.length > 0) {
  265 |       console.log(`\n[${testInfo.project.name}] ⚠ Early boot errors:`);
  266 |       earlyErrors.forEach((e) =>
  267 |         console.log(`  [${e.phase}] ${e.msg} (${e.src}:${e.line})`),
  268 |       );
  269 |     }
  270 | 
  271 |     printIssuesSummary(testInfo, issues);
  272 | 
  273 |     // Only fail for non-SDK errors — SDK noise is expected outside RUN.game platform
  274 |     const realErrors = issues.filter((i) => i.type === 'error' && !i.isSDK);
  275 |     if (realErrors.length > 0) {
  276 |       throw new Error(
  277 |         `${realErrors.length} real error(s) on load:\n` +
  278 |           realErrors.map((e) => `  • ${e.text}`).join('\n'),
  279 |       );
  280 |     }
  281 |   });
  282 | });
  283 | 
  284 | test.describe('Orientation Handling', () => {
  285 |   test('landscape mode shows rotation warning', async ({ page, isMobile }) => {
  286 |     if (!isMobile) test.skip();
  287 | 
  288 |     // The playwright.config already sets landscape viewport for landscape projects —
  289 |     // this test only runs for those. For portrait projects we verify it's NOT shown.
  290 |     await page.goto(BASE_URL);
  291 |     await page.waitForTimeout(1000);
  292 | 
  293 |     const { width, height } = page.viewportSize() ?? { width: 0, height: 0 };
  294 |     const isLandscape = width > height;
  295 | 
  296 |     const warningVisible = await page.evaluate(() => {
  297 |       const el = document.querySelector('.landscape-warning');
  298 |       if (!el) return false;
  299 |       const style = window.getComputedStyle(el);
  300 |       return style.display !== 'none' && style.visibility !== 'hidden';
  301 |     });
  302 | 
  303 |     if (isLandscape) {
  304 |       expect(warningVisible).toBe(true);
  305 |     } else {
  306 |       expect(warningVisible).toBe(false);
  307 |     }
  308 |   });
  309 | });
  310 | 
  311 | test.describe('Title Screen Navigation', () => {
  312 |   test('title screen renders and play button is interactive', async ({ page }, testInfo) => {
  313 |     const issues = attachIssueCollector(page);
  314 | 
  315 |     await page.goto(BASE_URL);
  316 |     await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
  317 |     await page.waitForTimeout(2000);
  318 | 
  319 |     // Title screen image should be present or the container should have content
  320 |     const appContainer = page.locator('.app-container');
  321 |     await expect(appContainer).toBeVisible();
  322 | 
  323 |     // Attempt to click the Play hit zone (top: 66.3% in Game.tsx)
  324 |     const clicked = await clickHitZone(page, 66.3);
  325 |     if (clicked) {
  326 |       await page.waitForTimeout(1500);
  327 |       // Should now be on classSelect — look for "Choose Your Class" text
  328 |       const body = await page.textContent('body');
  329 |       const onClassSelect = body?.includes('Choose Your Class') ?? false;
  330 |       console.log(
  331 |         `[${testInfo.project.name}] Play → classSelect navigation: ${onClassSelect ? '✓' : '✗ (may need save data)'}`,
  332 |       );
  333 |     } else {
  334 |       console.log(
  335 |         `[${testInfo.project.name}] Play hit zone not found — title image may not have loaded`,
  336 |       );
  337 |     }
  338 | 
  339 |     printIssuesSummary(testInfo, issues);
  340 |   });
  341 | });
  342 | 
  343 | test.describe('Class Select & Game Start', () => {
  344 |   test('selects first available class and starts game', async ({ page }, testInfo) => {
  345 |     const issues = attachIssueCollector(page);
  346 | 
  347 |     await page.goto(BASE_URL);
  348 |     await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
  349 |     await page.waitForTimeout(2000);
  350 | 
  351 |     // Navigate to classSelect via Play hit zone
  352 |     await clickHitZone(page, 66.3);
  353 |     await page.waitForTimeout(1500);
  354 | 
  355 |     const bodyText = await page.textContent('body').catch(() => '');
  356 |     if (!bodyText?.includes('Choose Your Class')) {
  357 |       console.log(
  358 |         `[${testInfo.project.name}] Skipping — could not reach classSelect screen`,
  359 |       );
  360 |       printIssuesSummary(testInfo, issues);
```