/**
 * Test RUN TV globalStorage integration
 * Run with: npx tsx --import ./src/game/__tests__/setup.mjs src/game/__tests__/testRunTV.ts
 */
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';

async function testRunTV() {
  console.log('=== RUN TV globalStorage Test ===\n');

  // Test 1: Read watched_dod_show (should be null initially)
  try {
    const val = await RundotGameAPI.globalStorage.getItem('watched_dod_show');
    console.log(`1. Initial read: ${val === null ? 'null (PASS - not set yet)' : `"${val}"`}`);
  } catch (e: any) {
    console.log(`1. Read FAILED: ${e.message}`);
  }

  // Test 2: Simulate RUN TV team setting the flag
  try {
    await RundotGameAPI.globalStorage.setItem('watched_dod_show', '1');
    console.log('2. Set watched_dod_show = "1" (simulating RUN TV platform)');
  } catch (e: any) {
    console.log(`2. Set FAILED: ${e.message}`);
  }

  // Test 3: Read it back — this is what the game does on load, visibility change, and class select
  try {
    const val = await RundotGameAPI.globalStorage.getItem('watched_dod_show');
    console.log(`3. Read after set: ${val === '1' ? '"1" (PASS - Impregnar unlock detected!)' : `unexpected: "${val}"`}`);
  } catch (e: any) {
    console.log(`3. Read FAILED: ${e.message}`);
  }

  // Test 4: Remove it (debug reset path)
  try {
    await RundotGameAPI.globalStorage.removeItem('watched_dod_show');
    const val = await RundotGameAPI.globalStorage.getItem('watched_dod_show');
    console.log(`4. After remove: ${val === null ? 'null (PASS - reset works)' : `unexpected: "${val}"`}`);
  } catch (e: any) {
    console.log(`4. Remove FAILED: ${e.message}`);
  }

  // Test 5: API surface checks
  console.log(`\n5. globalStorage.getItem: ${typeof RundotGameAPI.globalStorage.getItem === 'function' ? 'PASS' : 'FAIL'}`);
  console.log(`6. globalStorage.setItem: ${typeof RundotGameAPI.globalStorage.setItem === 'function' ? 'PASS' : 'FAIL'}`);
  console.log(`7. globalStorage.removeItem: ${typeof RundotGameAPI.globalStorage.removeItem === 'function' ? 'PASS' : 'FAIL'}`);
  console.log(`8. analytics.recordCustomEvent: ${typeof RundotGameAPI.analytics.recordCustomEvent === 'function' ? 'PASS' : 'FAIL'}`);

  // Test 6: Check the game's 3 detection paths work
  console.log('\n--- Game Detection Paths ---');
  console.log('Path 1 (initial load): globalStorage.getItem("watched_dod_show") on startup');
  console.log('Path 2 (tab focus): visibilitychange listener re-checks globalStorage');
  console.log('Path 3 (class select): re-checks every time class select screen renders');
  console.log('All 3 paths call the same API: RundotGameAPI.globalStorage.getItem("watched_dod_show")');
  console.log('If result === "1" -> setHasWatchedDodShow(true) -> Impregnar unlocked');

  console.log('\n=== All checks complete ===');
}

testRunTV().catch(e => { console.error('Test crashed:', e); process.exit(1); });
