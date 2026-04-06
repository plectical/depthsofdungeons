// Mock browser globals before SDK loads
(globalThis as any).window = {
  innerWidth: 375, innerHeight: 812,
  navigator: { userAgent: 'montecarlo-sim' },
  location: { href: 'http://localhost', hostname: 'localhost', search: '', hash: '', pathname: '/' },
  addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => true,
  setTimeout: globalThis.setTimeout, setInterval: globalThis.setInterval,
  clearTimeout: globalThis.clearTimeout, clearInterval: globalThis.clearInterval,
  requestAnimationFrame: (cb: any) => globalThis.setTimeout(cb, 16),
  cancelAnimationFrame: globalThis.clearTimeout,
  performance: globalThis.performance, onerror: null, crypto: globalThis.crypto,
  matchMedia: () => ({ matches: false, addListener: () => {}, removeListener: () => {} }),
  screen: { width: 375, height: 812 }, devicePixelRatio: 2,
  self: undefined as any, fbq: () => {},
};
(globalThis as any).window.self = (globalThis as any).window;
(globalThis as any).window.window = (globalThis as any).window;
(globalThis as any).self = (globalThis as any).window;
(globalThis as any).document = {
  createElement: () => ({ style: {}, appendChild: () => {}, setAttribute: () => {}, addEventListener: () => {} }),
  head: { appendChild: () => {} }, body: { appendChild: () => {}, style: {} },
  getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
  addEventListener: () => {}, removeEventListener: () => {},
  visibilityState: 'visible', hidden: false, cookie: '', documentElement: { style: {} },
  createEvent: () => ({ initEvent: () => {} }),
};
(globalThis as any).localStorage = { _d: {} as any, getItem(k: string) { return this._d[k] ?? null; }, setItem(k: string, v: string) { this._d[k] = v; }, removeItem(k: string) { delete this._d[k]; }, clear() { this._d = {}; } };
(globalThis as any).sessionStorage = { _d: {} as any, getItem(k: string) { return this._d[k] ?? null; }, setItem(k: string, v: string) { this._d[k] = v; }, removeItem(k: string) { delete this._d[k]; }, clear() { this._d = {}; } };
(globalThis as any).XMLHttpRequest = class { open() {} send() {} setRequestHeader() {} addEventListener() {} };
(globalThis as any).Image = class { set src(_: string) {} addEventListener() {} };
(globalThis as any).MutationObserver = class { observe() {} disconnect() {} };
(globalThis as any).ResizeObserver = class { observe() {} disconnect() {} };
(globalThis as any).IntersectionObserver = class { observe() {} disconnect() {} };
(globalThis as any).requestAnimationFrame = (cb: any) => globalThis.setTimeout(cb, 16);
(globalThis as any).cancelAnimationFrame = globalThis.clearTimeout;
(globalThis as any).HTMLCanvasElement = class {};
(globalThis as any).HTMLElement = class {};
(globalThis as any).Blob = class { constructor(public parts: any[], public opts?: any) {} };
(globalThis as any).URL = { ...globalThis.URL, createObjectURL: () => 'blob://mock' };
(globalThis as any).Worker = class { onmessage: any; terminate() {} };
try { Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'montecarlo-sim', language: 'en' }, writable: true, configurable: true }); } catch {}

import { newGame, movePlayer, waitTurn, useItem, equipItem, unequipItem, dropItem, chooseAbility, rangedAttack, getPlayerRange, buyItem, isAtShop, extractCauseOfDeath, updateFOV, handleTapMove, hireMercenary, applyDialogueEffects } from '../src/game/engine';
import { autoplayStep } from '../src/game/autoplay';
import { createDefaultBloodline, mergeRunIntoBloodline, checkForNewTraits, generateAncestorName, computeBloodlineBonuses } from '../src/game/traits';
import type { GameState, PlayerClass, ZoneId, BloodlineData, AncestorRecord, RunHistoryEntry, BestiaryEntry } from '../src/game/types';

const NUM_RUNS = parseInt(process.argv[2] || '300', 10);
const MAX_TURNS = parseInt(process.argv[3] || '2000', 10);

// ── Types ──
interface ErrorRecord { turn: number; floor: number; error: string; stack: string; context: string; category: string; }
interface RunResult {
  runId: number; playerClass: PlayerClass; zone: ZoneId;
  floorsReached: number; turnsPlayed: number; causeOfDeath: string; monstersKilled: number;
  errors: ErrorRecord[]; peakMemoryMB: number; durationMs: number;
  timedOut: boolean; infiniteLoop: boolean;
  saveRestorePassed: boolean; serializationPassed: boolean;
  stateSize: number;
}

const CLASSES: PlayerClass[] = ['warrior', 'rogue', 'mage', 'ranger', 'paladin', 'necromancer', 'revenant'];
const ZONES: ZoneId[] = ['stone_depths', 'frozen_caverns', 'fungal_marsh', 'infernal_pit', 'crystal_sanctum', 'shadow_realm'];

function getMemoryMB(): number { return process.memoryUsage().heapUsed / 1024 / 1024; }

// ══════════════════════════════════════════════════
// STRESS TEST: Save / Restore Cycle
// Simulates what happens when a player closes the app and reopens it
// ══════════════════════════════════════════════════
function stressTestSaveRestore(state: GameState, bloodline: BloodlineData, errors: ErrorRecord[]): GameState | null {
  try {
    const { _bloodlineRef, ...saveData } = state;
    const json = JSON.stringify(saveData);
    const restored = JSON.parse(json) as GameState;
    if (!restored.player || !restored.floor || !restored.playerClass) {
      errors.push({ turn: state.turn, floor: state.floorNumber, error: 'Save/restore validation failed: missing required fields', stack: '', context: `keys=${Object.keys(restored).join(',')}`, category: 'save_restore' });
      return null;
    }
    restored._bloodlineRef = bloodline;
    if (!restored.mercenaries) restored.mercenaries = [];
    if (!restored.mapMercenaries) restored.mapMercenaries = [];
    if (!restored.npcs) restored.npcs = [];
    if (!restored.bossesDefeatedThisRun) restored.bossesDefeatedThisRun = [];
    if (!restored.messages) restored.messages = [];
    if (!restored.player.chosenAbilities) restored.player.chosenAbilities = [];
    updateFOV(restored);
    const clone = structuredClone(restored);
    waitTurn(clone);
    return restored;
  } catch (err: any) {
    errors.push({ turn: state.turn, floor: state.floorNumber, error: `Save/restore crash: ${err.message ?? String(err)}`, stack: err.stack?.slice(0, 500) ?? '', context: `class=${state.playerClass} floor=${state.floorNumber}`, category: 'save_restore' });
    return null;
  }
}

// ══════════════════════════════════════════════════
// STRESS TEST: structuredClone (React state updates)
// ══════════════════════════════════════════════════
function stressTestStructuredClone(state: GameState, errors: ErrorRecord[]): boolean {
  try {
    const clone = structuredClone(state);
    if (!clone.player || clone.player.stats.hp === undefined) {
      errors.push({ turn: state.turn, floor: state.floorNumber, error: 'structuredClone produced invalid state', stack: '', context: '', category: 'clone' });
      return false;
    }
    return true;
  } catch (err: any) {
    errors.push({ turn: state.turn, floor: state.floorNumber, error: `structuredClone crash: ${err.message}`, stack: err.stack?.slice(0, 500) ?? '', context: `class=${state.playerClass} floor=${state.floorNumber} monsters=${state.monsters.length}`, category: 'clone' });
    return false;
  }
}

// ══════════════════════════════════════════════════
// STRESS TEST: Death processing / Bloodline merge
// ══════════════════════════════════════════════════
function stressTestDeathProcessing(state: GameState, bloodline: BloodlineData, errors: ErrorRecord[]): BloodlineData | null {
  try {
    const bl = structuredClone(bloodline);
    mergeRunIntoBloodline(bl, state.runStats);
    bl.cumulative.classDeaths[state.playerClass] = (bl.cumulative.classDeaths[state.playerClass] ?? 0) + 1;
    bl.cumulative.highestFloor = Math.max(bl.cumulative.highestFloor, state.floorNumber);
    bl.cumulative.highestScore = Math.max(bl.cumulative.highestScore ?? 0, state.score);
    bl.cumulative.totalScore += state.score;
    bl.cumulative.totalTurns += state.turn;
    const ancestor: AncestorRecord = { name: generateAncestorName(), class: state.playerClass, floorReached: state.floorNumber, level: state.player.level, score: state.score, killCount: state.runStats.kills, causeOfDeath: extractCauseOfDeath(state), turnsLived: state.turn };
    bl.ancestors.push(ancestor);
    if (bl.ancestors.length > 5) bl.ancestors.shift();
    bl.generation++;
    if (state._bloodlineRef) Object.assign(bl.npcChoicesMade, state._bloodlineRef.npcChoicesMade);
    for (const bossName of state.bossesDefeatedThisRun) {
      const key = `${bossName}|${state.playerClass}`;
      if (!bl.bossKillLog.includes(key)) bl.bossKillLog.push(key);
    }
    const newTraits = checkForNewTraits(bl);
    for (const trait of newTraits) bl.unlockedTraits.push(trait.id);
    if (!bl.runHistory) bl.runHistory = [];
    bl.runHistory.push({ class: state.playerClass, zone: state.zone, floorReached: state.floorNumber, level: state.player.level, score: state.score, kills: state.runStats.kills, turns: state.turn, causeOfDeath: extractCauseOfDeath(state), bossesKilled: state.runStats.bossesKilled, timestamp: Date.now() });
    if (bl.runHistory.length > 20) bl.runHistory.shift();
    if (!bl.bestiary) bl.bestiary = {};
    for (const [monsterName, killCount] of Object.entries(state.runStats.monsterKills)) {
      if (!bl.bestiary[monsterName]) { const m = state.monsters.find(e => e.name === monsterName); bl.bestiary[monsterName] = { name: monsterName, encountered: true, killed: true, killCount: 0, color: m?.color, char: m?.char, baseName: m?.baseName ?? monsterName }; }
      const entry = bl.bestiary[monsterName]!; entry.encountered = true; if (killCount > 0) entry.killed = true; entry.killCount += killCount;
    }
    computeBloodlineBonuses(bl);
    const json = JSON.stringify(bl);
    const parsed = JSON.parse(json);
    if (!parsed.generation || !parsed.cumulative) {
      errors.push({ turn: state.turn, floor: state.floorNumber, error: 'Bloodline serialization produced invalid data', stack: '', context: '', category: 'bloodline' });
      return null;
    }
    return bl;
  } catch (err: any) {
    errors.push({ turn: state.turn, floor: state.floorNumber, error: `Death processing crash: ${err.message}`, stack: err.stack?.slice(0, 500) ?? '', context: `class=${state.playerClass} floor=${state.floorNumber} gen=${bloodline.generation}`, category: 'bloodline' });
    return null;
  }
}

// ══════════════════════════════════════════════════
// STRESS TEST: Direct engine functions with edge cases
// ══════════════════════════════════════════════════
function stressTestEdgeCases(state: GameState, errors: ErrorRecord[]) {
  // Test inventory operations at limits
  try {
    const clone = structuredClone(state);
    while (clone.player.inventory.length < 20) {
      clone.player.inventory.push({ id: `test_${clone.player.inventory.length}`, name: 'Test Item', type: 'potion', char: '!', color: '#fff', value: 1, description: 'test' });
    }
    for (let i = clone.player.inventory.length - 1; i >= 0; i--) {
      try { useItem(clone, i); } catch (err: any) {
        errors.push({ turn: state.turn, floor: state.floorNumber, error: `useItem crash idx ${i}: ${err.message}`, stack: err.stack?.slice(0, 300) ?? '', context: `inv=${clone.player.inventory.length}`, category: 'inventory' });
      }
    }
  } catch (err: any) {
    errors.push({ turn: state.turn, floor: state.floorNumber, error: `Inventory stress: ${err.message}`, stack: err.stack?.slice(0, 300) ?? '', context: '', category: 'inventory' });
  }

  // Test equip/unequip cycling
  try {
    const clone = structuredClone(state);
    for (let i = 0; i < clone.player.inventory.length; i++) {
      if (clone.player.inventory[i]?.equipSlot) {
        equipItem(clone, i);
        const slot = clone.player.inventory[i]?.equipSlot;
        if (slot && clone.player.equipment[slot]) unequipItem(clone, slot);
      }
    }
  } catch (err: any) {
    errors.push({ turn: state.turn, floor: state.floorNumber, error: `Equip cycle: ${err.message}`, stack: err.stack?.slice(0, 300) ?? '', context: '', category: 'equipment' });
  }

  // Test movement in all 8 directions + tap move to edge positions
  try {
    const clone = structuredClone(state);
    for (const [dx, dy] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
      const c = structuredClone(clone); movePlayer(c, dx!, dy!);
    }
    for (const [x, y] of [[0,0],[clone.floor.width-1,0],[0,clone.floor.height-1],[clone.floor.width-1,clone.floor.height-1],[-1,-1],[9999,9999]]) {
      const c = structuredClone(clone); handleTapMove(c, x!, y!);
    }
  } catch (err: any) {
    errors.push({ turn: state.turn, floor: state.floorNumber, error: `Movement edge: ${err.message}`, stack: err.stack?.slice(0, 300) ?? '', context: '', category: 'movement' });
  }

  // Test ranged attack on invalid targets
  try {
    const c = structuredClone(state);
    rangedAttack(c, -1, -1); rangedAttack(c, 999, 999); rangedAttack(c, c.player.pos.x, c.player.pos.y);
  } catch (err: any) {
    errors.push({ turn: state.turn, floor: state.floorNumber, error: `Ranged edge: ${err.message}`, stack: err.stack?.slice(0, 300) ?? '', context: '', category: 'combat' });
  }

  // Test shop with invalid indices
  try {
    const c = structuredClone(state);
    buyItem(c, -1); buyItem(c, 9999);
    if (c.shop) { c.score = 999999; for (let i = 0; i < 30; i++) buyItem(c, 0); }
  } catch (err: any) {
    errors.push({ turn: state.turn, floor: state.floorNumber, error: `Shop edge: ${err.message}`, stack: err.stack?.slice(0, 300) ?? '', context: '', category: 'shop' });
  }

  // Test chooseAbility / hireMercenary with invalid IDs
  try { const c = structuredClone(state); chooseAbility(c, 'nonexistent'); chooseAbility(c, ''); } catch (err: any) {
    errors.push({ turn: state.turn, floor: state.floorNumber, error: `Ability edge: ${err.message}`, stack: err.stack?.slice(0, 300) ?? '', context: '', category: 'ability' });
  }
  try { const c = structuredClone(state); hireMercenary(c, 'nonexistent'); hireMercenary(c, ''); } catch (err: any) {
    errors.push({ turn: state.turn, floor: state.floorNumber, error: `Merc edge: ${err.message}`, stack: err.stack?.slice(0, 300) ?? '', context: '', category: 'mercenary' });
  }

  // Test drop at various indices
  try {
    const c = structuredClone(state);
    dropItem(c, -1); dropItem(c, 9999);
    for (let i = c.player.inventory.length - 1; i >= 0; i--) dropItem(c, i);
    dropItem(c, 0);
  } catch (err: any) {
    errors.push({ turn: state.turn, floor: state.floorNumber, error: `Drop edge: ${err.message}`, stack: err.stack?.slice(0, 300) ?? '', context: '', category: 'inventory' });
  }

  // Test NPC dialogue with edge effects
  try {
    const c = structuredClone(state);
    const bl = structuredClone(state._bloodlineRef ?? createDefaultBloodline());
    applyDialogueEffects(c, [], bl);
    applyDialogueEffects(c, [{ type: 'heal', amount: 999 }], bl);
    applyDialogueEffects(c, [{ type: 'gold', amount: -999 }], bl);
    applyDialogueEffects(c, [{ type: 'hunger', amount: 999 }], bl);
    applyDialogueEffects(c, [{ type: 'statBuff', stat: 'attack', amount: 100 }], bl);
  } catch (err: any) {
    errors.push({ turn: state.turn, floor: state.floorNumber, error: `NPC edge: ${err.message}`, stack: err.stack?.slice(0, 300) ?? '', context: '', category: 'npc' });
  }

  // Test corrupted state (simulates bad saves from old versions or storage glitches)
  const corruptionTests = [
    { name: 'monsters=undefined', corrupt: (s: any) => { s.monsters = undefined; } },
    { name: 'floor.tiles=undefined', corrupt: (s: any) => { s.floor.tiles = undefined; } },
    { name: 'player.stats=undefined', corrupt: (s: any) => { s.player.stats = undefined; } },
    { name: 'hunger=undefined', corrupt: (s: any) => { s.hunger = undefined; } },
    { name: 'player.inventory=null', corrupt: (s: any) => { s.player.inventory = null; } },
    { name: 'messages=undefined', corrupt: (s: any) => { s.messages = undefined; } },
    { name: 'mercenaries=undefined', corrupt: (s: any) => { s.mercenaries = undefined; } },
    { name: 'floor.visible=undefined', corrupt: (s: any) => { s.floor.visible = undefined; } },
    { name: 'player.equipment=undefined', corrupt: (s: any) => { s.player.equipment = undefined; } },
    { name: 'runStats=undefined', corrupt: (s: any) => { s.runStats = undefined; } },
  ];
  for (const test of corruptionTests) {
    try {
      const c = structuredClone(state);
      test.corrupt(c);
      try { waitTurn(c); } catch {}
      try { movePlayer(c, 1, 0); } catch {}
    } catch (err: any) {
      errors.push({ turn: state.turn, floor: state.floorNumber, error: `Corrupted state (${test.name}): ${err.message}`, stack: err.stack?.slice(0, 300) ?? '', context: 'Bad save could crash the game here', category: 'corruption' });
    }
  }
}

// ══════════════════════════════════════════════════
// Main game simulation
// ══════════════════════════════════════════════════
function runSingleGame(runId: number): RunResult {
  const playerClass = CLASSES[runId % CLASSES.length]!;
  const zone = ZONES[Math.floor(runId / CLASSES.length) % ZONES.length]!;
  const bloodline: BloodlineData = createDefaultBloodline();

  const progression = runId % 5;
  if (progression === 1) { bloodline.generation = 3; bloodline.cumulative.totalDeaths = 10; bloodline.cumulative.totalKills = 50; bloodline.cumulative.highestFloor = 5; }
  else if (progression === 2) { bloodline.generation = 8; bloodline.cumulative.totalDeaths = 30; bloodline.cumulative.totalKills = 200; bloodline.cumulative.highestFloor = 10; }
  else if (progression === 3) { bloodline.generation = 25; bloodline.cumulative.totalDeaths = 100; bloodline.cumulative.totalKills = 1000; bloodline.cumulative.totalDamageDealt = 10000; bloodline.cumulative.totalFloors = 200; bloodline.cumulative.totalScore = 5000; bloodline.cumulative.highestFloor = 12; bloodline.cumulative.classDeaths = { warrior: 15, rogue: 12, mage: 10, ranger: 8, paladin: 5, necromancer: 3, revenant: 2 }; }
  else if (progression === 4) { bloodline.generation = 50; bloodline.cumulative.totalDeaths = 500; bloodline.cumulative.totalKills = 5000; bloodline.cumulative.totalDamageDealt = 50000; bloodline.cumulative.totalFloors = 800; bloodline.cumulative.highestFloor = 15; bloodline.cumulative.highestScore = 10000; bloodline.cumulative.classDeaths = { warrior: 60, rogue: 50, mage: 40, ranger: 35, paladin: 30, necromancer: 20, revenant: 15 }; bloodline.bossKillLog = ['Goblin King|warrior', 'Stone Guardian|rogue', 'Vampire Lord|mage']; }

  const errors: ErrorRecord[] = [];
  let peakMemory = getMemoryMB();
  let timedOut = false, infiniteLoop = false, saveRestorePassed = true, serializationPassed = true, stateSize = 0;
  const startTime = performance.now();
  let state: GameState;

  try { state = newGame(playerClass, bloodline, zone); }
  catch (err: any) {
    errors.push({ turn: 0, floor: 1, error: err.message ?? String(err), stack: err.stack?.slice(0, 500) ?? '', context: `newGame class=${playerClass} zone=${zone}`, category: 'init' });
    return { runId, playerClass, zone, floorsReached: 0, turnsPlayed: 0, causeOfDeath: 'Crash on init', monstersKilled: 0, errors, peakMemoryMB: peakMemory, durationMs: performance.now() - startTime, timedOut: false, infiniteLoop: false, saveRestorePassed: false, serializationPassed: false, stateSize: 0 };
  }

  let turnCount = 0, stuckCounter = 0;

  while (!state.gameOver && turnCount < MAX_TURNS) {
    turnCount++;
    try {
      const next = autoplayStep(state);
      if (next) { state = next; stuckCounter = 0; }
      else {
        stuckCounter++;
        if (stuckCounter > 30) { infiniteLoop = true; errors.push({ turn: turnCount, floor: state.floorNumber, error: 'Autoplay stuck 30+ times', stack: '', context: `pos=${state.player.pos.x},${state.player.pos.y} hp=${state.player.stats.hp} pendingNPC=${state.pendingNPC} pendingMerc=${state.pendingMercenary} pendingAbility=${!!state.pendingAbilityChoice}`, category: 'autoplay' }); break; }
        try { const c = structuredClone(state); waitTurn(c); state = c; } catch {}
      }
    } catch (err: any) {
      errors.push({ turn: turnCount, floor: state.floorNumber, error: err.message ?? String(err), stack: err.stack?.slice(0, 500) ?? '', context: `class=${playerClass} floor=${state.floorNumber} hp=${state.player.stats.hp}/${state.player.stats.maxHp} monsters=${state.monsters.filter(m => !m.isDead).length}`, category: 'engine' });
      try { const c = structuredClone(state); waitTurn(c); state = c; } catch { break; }
    }

    // ── Stress tests at key moments ──
    if (turnCount % 50 === 0) { if (!stressTestStructuredClone(state, errors)) serializationPassed = false; }
    if (turnCount % 100 === 0) { const r = stressTestSaveRestore(state, bloodline, errors); if (!r) saveRestorePassed = false; else state = r; }
    if (state.floorNumber > 1 && turnCount % 200 === 0) stressTestEdgeCases(state, errors);
    if (turnCount % 200 === 0) { peakMemory = Math.max(peakMemory, getMemoryMB()); try { const { _bloodlineRef, ...s } = state; stateSize = Math.max(stateSize, JSON.stringify(s).length); } catch {} }
    if (state.monsters.filter(m => !m.isDead).length > 50) errors.push({ turn: turnCount, floor: state.floorNumber, error: `Excessive monsters: ${state.monsters.filter(m => !m.isDead).length}`, stack: '', context: '', category: 'performance' });
  }

  if (turnCount >= MAX_TURNS && !state.gameOver) timedOut = true;
  if (state.gameOver) { const bl = stressTestDeathProcessing(state, bloodline, errors); if (!bl) saveRestorePassed = false; }
  stressTestEdgeCases(state, errors);
  const fr = stressTestSaveRestore(state, bloodline, errors); if (!fr) saveRestorePassed = false;
  peakMemory = Math.max(peakMemory, getMemoryMB());

  return { runId, playerClass, zone, floorsReached: state.floorNumber, turnsPlayed: turnCount, causeOfDeath: state.gameOver ? extractCauseOfDeath(state) : (timedOut ? 'Timed out' : 'Unknown'), monstersKilled: state.runStats.kills, errors, peakMemoryMB: peakMemory, durationMs: performance.now() - startTime, timedOut, infiniteLoop, saveRestorePassed, serializationPassed, stateSize };
}

// ══════════════════════════════════════════════════
const results: RunResult[] = [];
const globalStart = performance.now();
console.log(`\n=== DEPTHS OF DUNGEON — FULL STRESS TEST ===`);
console.log(`${NUM_RUNS} games × ${MAX_TURNS} max turns`);
console.log(`Testing: Engine + Save/Restore + Serialization + Edge Cases + Death Processing\n`);

for (let i = 0; i < NUM_RUNS; i++) {
  if (i > 0 && i % 25 === 0) { console.log(`  [${Math.round((i / NUM_RUNS) * 100)}%] ${i}/${NUM_RUNS} runs (${((performance.now() - globalStart) / 1000).toFixed(1)}s)`); }
  results.push(runSingleGame(i));
}

const totalTime = ((performance.now() - globalStart) / 1000).toFixed(1);
let crashes = 0, timeouts = 0, loops = 0, peakMem = 0, maxFloor = 0, saveRestoreFails = 0, serializationFails = 0;
const errByCategory: Record<string, number> = {}, errByType: Record<string, number> = {};
const floorDist: Record<number, number> = {}, deathCause: Record<string, number> = {};
const classPerf: Record<string, { runs: number; totalFloor: number; totalTurns: number; crashes: number }> = {};
const zonePerf: Record<string, { runs: number; totalFloor: number; crashes: number }> = {};
const durations: number[] = [];
for (const cls of CLASSES) classPerf[cls] = { runs: 0, totalFloor: 0, totalTurns: 0, crashes: 0 };
for (const z of ZONES) zonePerf[z] = { runs: 0, totalFloor: 0, crashes: 0 };

for (const r of results) {
  if (r.errors.length > 0) crashes++; if (r.timedOut) timeouts++; if (r.infiniteLoop) loops++;
  if (!r.saveRestorePassed) saveRestoreFails++; if (!r.serializationPassed) serializationFails++;
  peakMem = Math.max(peakMem, r.peakMemoryMB); maxFloor = Math.max(maxFloor, r.floorsReached); durations.push(r.durationMs);
  floorDist[r.floorsReached] = (floorDist[r.floorsReached] ?? 0) + 1; deathCause[r.causeOfDeath] = (deathCause[r.causeOfDeath] ?? 0) + 1;
  const cp = classPerf[r.playerClass]!; cp.runs++; cp.totalFloor += r.floorsReached; cp.totalTurns += r.turnsPlayed; if (r.errors.length > 0) cp.crashes++;
  const zp = zonePerf[r.zone]!; zp.runs++; zp.totalFloor += r.floorsReached; if (r.errors.length > 0) zp.crashes++;
  for (const err of r.errors) { errByCategory[err.category] = (errByCategory[err.category] ?? 0) + 1; errByType[err.error.slice(0, 80)] = (errByType[err.error.slice(0, 80)] ?? 0) + 1; }
}

const avgTurns = Math.round(results.reduce((s, r) => s + r.turnsPlayed, 0) / NUM_RUNS);
const avgFloor = (results.reduce((s, r) => s + r.floorsReached, 0) / NUM_RUNS).toFixed(1);
durations.sort((a, b) => b - a);
const maxStateKB = Math.round(Math.max(...results.map(r => r.stateSize)) / 1024);

console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('              FULL STRESS TEST REPORT                 ');
console.log('═══════════════════════════════════════════════════════');
console.log('');
console.log(`Total runs:         ${NUM_RUNS}`);
console.log(`Total time:         ${totalTime}s`);
console.log(`Avg time per run:   ${(parseFloat(totalTime) / NUM_RUNS * 1000).toFixed(0)}ms`);
console.log('');
console.log('── CRASHES & ERRORS ──');
console.log(`Runs with errors:   ${crashes}/${NUM_RUNS} (${(crashes/NUM_RUNS*100).toFixed(1)}%)`);
console.log(`Timeouts:           ${timeouts}`);
console.log(`Infinite loops:     ${loops}`);
console.log(`Save/restore fails: ${saveRestoreFails}`);
console.log(`Serialization fails:${serializationFails}`);
console.log('');

if (Object.keys(errByCategory).length > 0) {
  console.log('Errors by category:');
  for (const [cat, count] of Object.entries(errByCategory).sort((a, b) => b[1] - a[1])) console.log(`  [${count}x] ${cat}`);
  console.log('');
}
if (Object.keys(errByType).length > 0) {
  console.log('Error breakdown (top 20):');
  for (const [type, count] of Object.entries(errByType).sort((a, b) => b[1] - a[1]).slice(0, 20)) console.log(`  [${count}x] ${type}`);
  console.log('');
}

const allErrors = results.flatMap(r => r.errors.map(e => ({ ...e, cls: r.playerClass, zone: r.zone })));
const uniqueErrors = new Map<string, (typeof allErrors)[0]>();
for (const err of allErrors) { const key = `${err.category}:${err.error.slice(0, 60)}`; if (!uniqueErrors.has(key)) uniqueErrors.set(key, err); }
if (uniqueErrors.size > 0) {
  console.log(`Unique error samples (${uniqueErrors.size} distinct):`);
  let c = 0;
  for (const [, err] of uniqueErrors) {
    if (c++ >= 15) break;
    console.log(`  [${err.category.toUpperCase()}] ${err.cls} | ${err.zone} | floor ${err.floor} | turn ${err.turn}`);
    console.log(`    Error: ${err.error}`);
    if (err.context) console.log(`    Context: ${err.context}`);
    if (err.stack) console.log(`    Stack: ${err.stack.split('\n')[0]}`);
    console.log('');
  }
}

console.log('── PERFORMANCE ──');
console.log(`Peak memory:        ${peakMem.toFixed(1)} MB`);
console.log(`Max state size:     ${maxStateKB} KB`);
console.log(`Slowest run:        ${(durations[0] ?? 0).toFixed(0)}ms`);
console.log(`P95 run duration:   ${(durations[Math.floor(NUM_RUNS * 0.05)] ?? 0).toFixed(0)}ms`);
console.log(`Avg run duration:   ${(durations.reduce((a, b) => a + b, 0) / NUM_RUNS).toFixed(0)}ms`);
console.log('');
console.log('── GAME BALANCE ──');
console.log(`Avg floor reached:  ${avgFloor}`);
console.log(`Max floor reached:  ${maxFloor}`);
console.log(`Avg turns/game:     ${avgTurns}`);
console.log('');
console.log('Floor distribution:');
for (const [floor, count] of Object.entries(floorDist).sort((a, b) => parseInt(a[0]) - parseInt(b[0]))) { console.log(`  Floor ${floor.padStart(2)}: ${String(count).padStart(4)} (${(+count/NUM_RUNS*100).toFixed(1)}%) ${'#'.repeat(Math.ceil(+count / NUM_RUNS * 50))}`); }
console.log('');
console.log('Class performance:');
for (const [cls, d] of Object.entries(classPerf).sort((a, b) => (b[1].totalFloor/b[1].runs||0) - (a[1].totalFloor/a[1].runs||0))) { if (d.runs === 0) continue; console.log(`  ${cls.padEnd(12)} | runs: ${String(d.runs).padStart(3)} | avg floor: ${(d.totalFloor/d.runs).toFixed(1).padStart(4)} | avg turns: ${Math.round(d.totalTurns/d.runs).toString().padStart(4)} | crashes: ${d.crashes}`); }
console.log('');
console.log('Zone performance:');
for (const [z, d] of Object.entries(zonePerf).sort((a, b) => (b[1].totalFloor/b[1].runs||0) - (a[1].totalFloor/a[1].runs||0))) { if (d.runs === 0) continue; console.log(`  ${z.padEnd(18)} | runs: ${String(d.runs).padStart(3)} | avg floor: ${(d.totalFloor/d.runs).toFixed(1).padStart(4)} | crashes: ${d.crashes}`); }
console.log('');
console.log('Top death causes:');
for (const [cause, count] of Object.entries(deathCause).sort((a, b) => b[1] - a[1]).slice(0, 15)) console.log(`  [${String(count).padStart(4)}x] ${cause}`);
console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('                      DONE                            ');
console.log('═══════════════════════════════════════════════════════');
