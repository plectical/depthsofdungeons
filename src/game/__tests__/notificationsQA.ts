/**
 * Notifications QA Test Runner
 * Tests that notification functions exist, are callable, and don't throw.
 * Run with: npx tsx --import ./src/game/__tests__/setup.mjs src/game/__tests__/notificationsQA.ts
 */

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, testName: string) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(testName);
    console.log(`  \x1b[31mFAIL\x1b[0m ${testName}`);
  }
}

function section(name: string) {
  console.log(`\n\x1b[36m── ${name} ──\x1b[0m`);
}

import {
  scheduleReengagement,
  cancelReengagement,
  scheduleQuestComplete,
  cancelQuestComplete,
  scheduleBloodlineDeath,
  cancelBloodlineDeath,
  cancelAllGameNotifications,
} from '../notifications';

console.log('\n\x1b[1m=== DEPTHS OF DUNGEON — Notifications QA Suite ===\x1b[0m');

section('A1. Module Exports Exist');
assert(typeof scheduleReengagement === 'function', 'scheduleReengagement is a function');
assert(typeof cancelReengagement === 'function', 'cancelReengagement is a function');
assert(typeof scheduleQuestComplete === 'function', 'scheduleQuestComplete is a function');
assert(typeof cancelQuestComplete === 'function', 'cancelQuestComplete is a function');
assert(typeof scheduleBloodlineDeath === 'function', 'scheduleBloodlineDeath is a function');
assert(typeof cancelBloodlineDeath === 'function', 'cancelBloodlineDeath is a function');
assert(typeof cancelAllGameNotifications === 'function', 'cancelAllGameNotifications is a function');

section('A2. Functions Don\'t Throw (Mock SDK)');

async function testNoThrow() {
  try {
    await scheduleReengagement();
    assert(true, 'scheduleReengagement does not throw');
  } catch (e: any) {
    assert(false, `scheduleReengagement threw: ${e.message}`);
  }

  try {
    await cancelReengagement();
    assert(true, 'cancelReengagement does not throw');
  } catch (e: any) {
    assert(false, `cancelReengagement threw: ${e.message}`);
  }

  try {
    await scheduleQuestComplete('test_quest_1', 3600);
    assert(true, 'scheduleQuestComplete does not throw');
  } catch (e: any) {
    assert(false, `scheduleQuestComplete threw: ${e.message}`);
  }

  try {
    await cancelQuestComplete('test_quest_1');
    assert(true, 'cancelQuestComplete does not throw');
  } catch (e: any) {
    assert(false, `cancelQuestComplete threw: ${e.message}`);
  }

  try {
    await scheduleBloodlineDeath(7);
    assert(true, 'scheduleBloodlineDeath does not throw');
  } catch (e: any) {
    assert(false, `scheduleBloodlineDeath threw: ${e.message}`);
  }

  try {
    await cancelBloodlineDeath();
    assert(true, 'cancelBloodlineDeath does not throw');
  } catch (e: any) {
    assert(false, `cancelBloodlineDeath threw: ${e.message}`);
  }

  try {
    await cancelAllGameNotifications();
    assert(true, 'cancelAllGameNotifications does not throw');
  } catch (e: any) {
    assert(false, `cancelAllGameNotifications threw: ${e.message}`);
  }

  console.log('\n\x1b[1m════════════════════════════════════════\x1b[0m');
  console.log(`  \x1b[32mPassed: ${passed}\x1b[0m`);
  if (failed > 0) {
    console.log(`  \x1b[31mFailed: ${failed}\x1b[0m`);
    console.log('\n  Failures:');
    for (const f of failures) {
      console.log(`    \x1b[31m✗\x1b[0m ${f}`);
    }
  }
  console.log('\x1b[1m════════════════════════════════════════\x1b[0m\n');

  process.exit(failed > 0 ? 1 : 0);
}

testNoThrow();
