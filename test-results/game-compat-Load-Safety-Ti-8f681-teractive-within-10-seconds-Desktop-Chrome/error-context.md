# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: game-compat.spec.js >> Load Safety Timeout (54 reported events) >> game becomes interactive within 10 seconds
- Location: tests\game-compat.spec.js:795:3

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
  715 | 
  716 |     printIssuesSummary(testInfo, issues);
  717 |   });
  718 | 
  719 |   test('game handles offline (no network) gracefully', async ({ page }, testInfo) => {
  720 |     const issues = attachIssueCollector(page);
  721 | 
  722 |     await page.goto(BASE_URL);
  723 |     await page.waitForLoadState('domcontentloaded');
  724 |     await page.waitForTimeout(1000);
  725 | 
  726 |     // Go offline after initial load
  727 |     await page.context().setOffline(true);
  728 |     await page.waitForTimeout(3000);
  729 | 
  730 |     // Interact — should not crash without network
  731 |     await clickHitZone(page, 66.3);
  732 |     await page.waitForTimeout(1500);
  733 | 
  734 |     const bootPhase = await page.evaluate(() => window.__bootPhase ?? 'unknown');
  735 |     expect(bootPhase).toBe('rendered');
  736 | 
  737 |     await page.context().setOffline(false);
  738 | 
  739 |     printIssuesSummary(testInfo, issues);
  740 | 
  741 |     // Hard errors (not SDK network failures) should not occur
  742 |     const hardErrors = issues.filter(
  743 |       (i) => i.type === 'error' && !i.isSDK && i.source !== 'network' && i.source !== 'network-external',
  744 |     );
  745 |     if (hardErrors.length > 0) {
  746 |       throw new Error(
  747 |         `${hardErrors.length} non-network error(s) while offline:\n` +
  748 |           hardErrors.map((e) => `  • ${e.text}`).join('\n'),
  749 |       );
  750 |     }
  751 |   });
  752 | });
  753 | 
  754 | test.describe('Passive Event & Touch Compatibility', () => {
  755 |   test('no passive event listener violations', async ({ page }, testInfo) => {
  756 |     const violations = [];
  757 | 
  758 |     // Chrome reports "Unable to preventDefault inside passive event listener" as a warning
  759 |     page.on('console', (msg) => {
  760 |       if (msg.type() === 'warning' && /passive/i.test(msg.text())) {
  761 |         violations.push(msg.text());
  762 |       }
  763 |     });
  764 | 
  765 |     await page.goto(BASE_URL);
  766 |     await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
  767 |     await page.waitForTimeout(1000);
  768 | 
  769 |     // Simulate touch scroll to trigger passive listener check
  770 |     const { width, height } = page.viewportSize() ?? { width: 390, height: 844 };
  771 |     await page.touchscreen.tap(width / 2, height / 2).catch(() => {});
  772 |     await page.waitForTimeout(500);
  773 | 
  774 |     if (violations.length > 0) {
  775 |       console.log(`\n[${testInfo.project.name}] Passive event violations:`);
  776 |       violations.forEach((v) => console.log(`  • ${v}`));
  777 |       // Annotate but don't fail — this is a performance warning, not a crash
  778 |       testInfo.annotations.push({
  779 |         type: 'warning',
  780 |         description: `${violations.length} passive event listener violation(s)`,
  781 |       });
  782 |     } else {
  783 |       console.log(`[${testInfo.project.name}] ✓ No passive event violations`);
  784 |     }
  785 |   });
  786 | });
  787 | 
  788 | // ─────────────────────────────────────────────────────────────────────────────
  789 | // Tests derived from real-world crash reports and bug submissions
  790 | // Source: "Errors & Bugs by Event Type" (3,216 crash_reports, 54 load timeouts)
  791 | //         "Bug Reports" (Apr 2026) — consumable quests, freeze, save loss, crashes
  792 | // ─────────────────────────────────────────────────────────────────────────────
  793 | 
  794 | test.describe('Load Safety Timeout (54 reported events)', () => {
  795 |   test('game becomes interactive within 10 seconds', async ({ page }, testInfo) => {
  796 |     const issues = attachIssueCollector(page);
  797 |     const start = Date.now();
  798 | 
  799 |     await page.goto(BASE_URL);
  800 | 
  801 |     // Wait for the root to contain actual game UI — not just the bare div
  802 |     await page.waitForFunction(
  803 |       () => {
  804 |         const root = document.getElementById('root');
  805 |         return root && root.children.length > 0 && root.textContent?.trim().length > 0;
  806 |       },
  807 |       { timeout: 10_000 },
  808 |     );
  809 | 
  810 |     const loadMs = Date.now() - start;
  811 |     console.log(`[${testInfo.project.name}] Interactive in ${loadMs}ms`);
  812 | 
  813 |     // The game has a built-in load_safety_timeout — replicate the same check
  814 |     const bootPhase = await page.evaluate(() => window.__bootPhase ?? 'unknown');
> 815 |     expect(bootPhase).toBe('rendered');
      |                       ^ Error: expect(received).toBe(expected) // Object.is equality
  816 | 
  817 |     // Flag slow loads (>5s is risky on low-end Android)
  818 |     if (loadMs > 5000) {
  819 |       testInfo.annotations.push({
  820 |         type: 'warning',
  821 |         description: `Slow load: ${loadMs}ms — users on low-end devices may hit the safety timeout`,
  822 |       });
  823 |       console.warn(`⚠ [${testInfo.project.name}] Load took ${loadMs}ms`);
  824 |     }
  825 | 
  826 |     printIssuesSummary(testInfo, issues);
  827 |     expect(loadMs).toBeLessThan(10_000);
  828 |   });
  829 | 
  830 |   test('no boot errors captured in window.__bootErrors', async ({ page }, testInfo) => {
  831 |     // Mirrors the 14 boot_error events in production analytics
  832 |     await page.goto(BASE_URL);
  833 |     await page.waitForLoadState('domcontentloaded');
  834 |     await page.waitForTimeout(2000);
  835 | 
  836 |     const bootErrors = await page.evaluate(() => window.__bootErrors ?? []);
  837 |     if (bootErrors.length > 0) {
  838 |       console.log(`\n[${testInfo.project.name}] Boot errors (${bootErrors.length}):`);
  839 |       bootErrors.forEach((e) =>
  840 |         console.log(`  [${e.phase}] ${e.msg}  @ ${e.src}:${e.line}:${e.col}`),
  841 |       );
  842 |     }
  843 |     expect(bootErrors.length).toBe(0);
  844 |   });
  845 | });
  846 | 
  847 | test.describe('Save Data Persistence (reported: progress reset after update)', () => {
  848 |   test('save data survives a page reload', async ({ page }, testInfo) => {
  849 |     const issues = attachIssueCollector(page);
  850 | 
  851 |     await page.goto(BASE_URL);
  852 |     await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
  853 |     await page.waitForTimeout(2000);
  854 | 
  855 |     // Navigate into a game to create save state
  856 |     await clickHitZone(page, 66.3);
  857 |     await page.waitForTimeout(1500);
  858 | 
  859 |     const body1 = await page.textContent('body').catch(() => '');
  860 |     if (!body1?.includes('Choose Your Class')) {
  861 |       console.log(`[${testInfo.project.name}] Skipping — could not reach classSelect`);
  862 |       return;
  863 |     }
  864 | 
  865 |     const firstClass = page.locator('button').filter({ hasNotText: /♪|debug/i }).first();
  866 |     if ((await firstClass.count()) > 0) await firstClass.click();
  867 |     await page.waitForTimeout(1000);
  868 | 
  869 |     // Step through race/zone if present
  870 |     for (const keyword of ['Race', 'Zone', 'Dungeon']) {
  871 |       const t = await page.textContent('body').catch(() => '');
  872 |       if (t?.includes(keyword)) {
  873 |         const btn = page.locator('button').first();
  874 |         if ((await btn.count()) > 0) await btn.click();
  875 |         await page.waitForTimeout(1000);
  876 |       }
  877 |     }
  878 | 
  879 |     // Take a few turns so there is meaningful state to save
  880 |     for (let i = 0; i < 5; i++) {
  881 |       await page.keyboard.press('ArrowDown').catch(() => {});
  882 |       await page.waitForTimeout(200);
  883 |     }
  884 |     await page.waitForTimeout(1000);
  885 | 
  886 |     // Snapshot localStorage keys before reload
  887 |     const keysBefore = await page.evaluate(() => Object.keys(localStorage));
  888 |     const hasAutoSave = keysBefore.some((k) => k.includes('autosave') || k.includes('bloodline'));
  889 |     console.log(
  890 |       `[${testInfo.project.name}] localStorage keys before reload: ${keysBefore.join(', ') || '(none)'}`,
  891 |     );
  892 | 
  893 |     if (!hasAutoSave) {
  894 |       console.log(`[${testInfo.project.name}] ⚠ No autosave key found — game may not be persisting to localStorage`);
  895 |       testInfo.annotations.push({
  896 |         type: 'warning',
  897 |         description: 'No autosave or bloodline key in localStorage after playing — save may rely on SDK appStorage only',
  898 |       });
  899 |     }
  900 | 
  901 |     // Reload and verify game still has data (not wiped)
  902 |     await page.reload();
  903 |     await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
  904 |     await page.waitForTimeout(2000);
  905 | 
  906 |     const keysAfter = await page.evaluate(() => Object.keys(localStorage));
  907 |     console.log(
  908 |       `[${testInfo.project.name}] localStorage keys after reload: ${keysAfter.join(', ') || '(none)'}`,
  909 |     );
  910 | 
  911 |     // Keys present before should still be present after
  912 |     for (const key of keysBefore) {
  913 |       if (!keysAfter.includes(key)) {
  914 |         testInfo.annotations.push({
  915 |           type: 'warning',
```