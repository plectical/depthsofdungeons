/**
 * Full Game QA Test Runner
 * Tests both roguelike and story mode mechanics headlessly.
 * Run with: npx tsx --import ./src/game/__tests__/setup.mjs src/game/__tests__/fullQA.ts
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

// ── Imports ──
import { newStoryFloor, storyMovePlayer } from '../story-mode/storyEngine';
import { useItem, applyDialogueEffects, processTurn, attackEntity, buyItem, isAtShop } from '../engine';
import { CHAPTER_1 } from '../story-mode/chapters/chapter1';
import { CHAPTER_2 } from '../story-mode/chapters/chapter2';
import { CHAPTER_3 } from '../story-mode/chapters/chapter3';
import { createEmptyCampaignSave } from '../story-mode/campaignTypes';
import type { CampaignSave } from '../story-mode/campaignTypes';
import { createDefaultBloodline } from '../traits';
import { getTransformDef, TRANSFORM_DEFS } from '../story-mode/transformations';
import { findItemTemplate } from '../entities';
import { CLASS_DEFS } from '../constants';
import type { GameState, DialogueEffect } from '../types';

console.log('\n\x1b[1m=== DEPTHS OF DUNGEON — Full QA Test Suite ===\x1b[0m');

// ══════════════════════════════════════════════════════════════
// SECTION A: ROGUELIKE ENGINE TESTS
// ══════════════════════════════════════════════════════════════

section('A1. Class Definitions');
for (const cls of CLASS_DEFS) {
  assert(cls.baseStats.hp > 0, `${cls.name}: has HP (${cls.baseStats.hp})`);
  assert(cls.baseStats.attack > 0, `${cls.name}: has attack (${cls.baseStats.attack})`);
  assert(cls.baseStats.speed > 0, `${cls.name}: has speed (${cls.baseStats.speed})`);
  assert(cls.levelBonusHp > 0, `${cls.name}: gains HP per level (${cls.levelBonusHp})`);
  assert(cls.abilityPool.length > 0, `${cls.name}: has abilities (${cls.abilityPool.length})`);
}

section('A2. Item Templates');
const criticalItems = [
  'Health Potion', 'Greater Health Potion', 'Bread', 'Meat',
  'Short Sword', 'Rusty Dagger', 'Wooden Staff',
  'Dream Shard', 'Wall Essence', 'Dino Serum',
  'Iron Shield', 'Leather Armor',
];
for (const name of criticalItems) {
  const t = findItemTemplate(name);
  assert(t !== undefined, `Item template: ${name}`);
}

section('A3. Combat Math');
const saveCombat = createEmptyCampaignSave('warrior');
const gsCombat = newStoryFloor(CHAPTER_1, CHAPTER_1.floors[0]!, saveCombat);
const player = gsCombat.player;
const enemy = gsCombat.monsters.find(m => !m.isDead)!;

// Player attacks enemy
const enemyHpBefore = enemy.stats.hp;
attackEntity(gsCombat, player, enemy);
assert(enemy.stats.hp < enemyHpBefore || enemy.isDead, 'Player attack deals damage');

// Damage formula: max(1, atk - def) 
const expectedMinDmg = Math.max(1, player.stats.attack - enemy.stats.defense);
const actualDmg = enemyHpBefore - enemy.stats.hp;
assert(actualDmg >= expectedMinDmg, `Damage >= min expected (${actualDmg} >= ${expectedMinDmg})`);

section('A4. Leveling System');
const saveLvl = createEmptyCampaignSave('warrior');
saveLvl.playerLevel = 5;
const gsLvl = newStoryFloor(CHAPTER_1, CHAPTER_1.floors[0]!, saveLvl);
const classDef = CLASS_DEFS.find(c => c.id === 'warrior')!;
const expectedHp = classDef.baseStats.hp + classDef.levelBonusHp * 4; // 4 levels gained
assert(gsLvl.player.stats.maxHp === expectedHp, `Level 5 warrior HP: ${gsLvl.player.stats.maxHp} === ${expectedHp}`);
assert(gsLvl.player.level === 5, `Player level set to 5`);

section('A5. Turn Processing');
const saveTurn = createEmptyCampaignSave('warrior');
const gsTurn = newStoryFloor(CHAPTER_1, CHAPTER_1.floors[0]!, saveTurn);
const turnBefore = gsTurn.turn;
processTurn(gsTurn);
assert(gsTurn.turn === turnBefore + 1, 'Turn counter increments');

// ══════════════════════════════════════════════════════════════
// SECTION B: STORY MODE FLOOR CREATION
// ══════════════════════════════════════════════════════════════

section('B1. All Floors Create Successfully');
for (const chapter of [CHAPTER_1, CHAPTER_2, CHAPTER_3]) {
  for (const floorDef of chapter.floors) {
    try {
      const s = createEmptyCampaignSave('warrior');
      s.playerLevel = 3;
      const gs = newStoryFloor(chapter, floorDef, s);
      assert(gs.monsters.length > 0, `${chapter.name} F${floorDef.floorIndex}: ${gs.monsters.length} monsters`);
      assert(gs.items.length > 0, `${chapter.name} F${floorDef.floorIndex}: ${gs.items.length} items`);
      assert(gs.shop !== null, `${chapter.name} F${floorDef.floorIndex}: shop spawned`);
      assert(gs.interactables!.length > 0, `${chapter.name} F${floorDef.floorIndex}: ${gs.interactables!.length} interactables`);
    } catch (e) {
      assert(false, `${chapter.name} F${floorDef.floorIndex}: CRASHED - ${e}`);
    }
  }
}

section('B2. Boss Spawning');
for (const chapter of [CHAPTER_1, CHAPTER_2, CHAPTER_3]) {
  const lastFloor = chapter.floors[chapter.floors.length - 1]!;
  const s = createEmptyCampaignSave('warrior');
  const gs = newStoryFloor(chapter, lastFloor, s);
  const boss = gs.monsters.find(m => m.isBoss && m.name === chapter.boss.name);
  assert(boss !== undefined, `${chapter.name}: boss "${chapter.boss.name}" spawned on last floor`);
  if (boss) {
    assert(boss.stats.hp === chapter.boss.stats.hp, `${chapter.boss.name}: HP matches def (${boss.stats.hp})`);
    assert(boss.stats.attack === chapter.boss.stats.attack, `${chapter.boss.name}: ATK matches def (${boss.stats.attack})`);
    assert(boss.xp === chapter.boss.xpValue, `${chapter.boss.name}: XP matches def (${boss.xp})`);
  }
}

// ══════════════════════════════════════════════════════════════
// SECTION C: SHOP SYSTEM
// ══════════════════════════════════════════════════════════════

section('C1. Shop Integration');
const saveShop = createEmptyCampaignSave('warrior');
saveShop.gold = 100;
const gsShop = newStoryFloor(CHAPTER_1, CHAPTER_1.floors[0]!, saveShop);
assert(gsShop.shop !== null, 'Shop exists on floor');
assert(gsShop.score === 100, `Player gold from save (${gsShop.score})`);

if (gsShop.shop && gsShop.shop.stock.length > 0) {
  const cheapest = gsShop.shop.stock.reduce((a, b) => a.price < b.price ? a : b);
  const canAfford = gsShop.score >= cheapest.price;
  assert(canAfford, `Can afford cheapest item (${cheapest.price}g, have ${gsShop.score}g)`);
  
  if (canAfford) {
    const goldBefore = gsShop.score;
    // Move player to shop position to enable buying
    gsShop.player.pos = { ...gsShop.shop.pos };
    assert(isAtShop(gsShop), 'isAtShop returns true when on shop tile');
    const bought = buyItem(gsShop, 0);
    assert(bought, 'buyItem succeeds');
    assert(gsShop.score < goldBefore, `Gold decreased after purchase (${goldBefore} -> ${gsShop.score})`);
  }
}

// ══════════════════════════════════════════════════════════════
// SECTION D: TRANSFORMATION SYSTEM
// ══════════════════════════════════════════════════════════════

section('D1. All Transform Types');
for (const [id, def] of Object.entries(TRANSFORM_DEFS)) {
  const s = createEmptyCampaignSave('warrior');
  const gs = newStoryFloor(CHAPTER_1, CHAPTER_1.floors[0]!, s);
  
  // Add consumable
  const template = findItemTemplate(def.consumableName);
  assert(template !== undefined, `${id}: consumable "${def.consumableName}" exists`);
  if (!template) continue;
  
  gs.player.inventory.push({ ...template, id: `test_${id}` } as any);
  const statsBefore = { ...gs.player.stats };
  const idx = gs.player.inventory.findIndex(i => i.name === def.consumableName);
  const used = useItem(gs, idx);
  assert(used, `${id}: consumable used successfully`);
  
  if (id === 'dino') {
    assert((gs.dinoTransformTurns ?? 0) > 0 || gs.dinoPermanent === true, `${id}: dino transform active`);
  } else {
    assert(gs._activeTransformId === id, `${id}: transform active (got ${gs._activeTransformId})`);
    assert((gs._transformTurns ?? 0) > 0, `${id}: has turn duration`);
  }
}

section('D2. Permanent Transform Threshold');
for (const [id, def] of Object.entries(TRANSFORM_DEFS)) {
  if (id === 'dino') continue; // Dino uses separate system
  const s = createEmptyCampaignSave('warrior');
  const gs = newStoryFloor(CHAPTER_1, CHAPTER_1.floors[0]!, s);
  const template = findItemTemplate(def.consumableName)!;
  
  for (let i = 0; i < def.permanentThreshold + 1; i++) {
    gs.player.inventory.push({ ...template, id: `perm_${id}_${i}` } as any);
  }
  
  for (let i = 0; i < def.permanentThreshold; i++) {
    const idx = gs.player.inventory.findIndex(it => it.name === def.consumableName);
    if (idx >= 0) useItem(gs, idx);
  }
  
  assert(gs._transformPermanent === true, `${id}: permanent after ${def.permanentThreshold} uses`);
  assert(gs.player.char === def.char, `${id}: char is ${def.char} when permanent`);
}

section('D3. Transform Tick-Down');
const sTick = createEmptyCampaignSave('warrior');
const gsTick = newStoryFloor(CHAPTER_1, CHAPTER_1.floors[0]!, sTick);
const shardTemplate = findItemTemplate('Dream Shard')!;
gsTick.player.inventory.push({ ...shardTemplate, id: 'tick_ds' } as any);
gsTick.monsters = []; // No monsters interfering
useItem(gsTick, gsTick.player.inventory.findIndex(i => i.name === 'Dream Shard'));
const turnsAfterUse = gsTick._transformTurns!;

for (let i = 0; i < turnsAfterUse; i++) {
  processTurn(gsTick);
}
assert(gsTick._activeTransformId === null || gsTick._activeTransformId === undefined, 'Shadow form expires after turns elapse');
assert(gsTick.player.char === '@', 'Player char returns to @ after transform expires');

// ══════════════════════════════════════════════════════════════
// SECTION E: FLAG SYSTEM
// ══════════════════════════════════════════════════════════════

section('E1. setFlag Dialogue Effect');
const sFlag = createEmptyCampaignSave('warrior');
const gsFlag = newStoryFloor(CHAPTER_1, CHAPTER_1.floors[0]!, sFlag);
const bl = createDefaultBloodline();
applyDialogueEffects(gsFlag, [
  { type: 'setFlag', key: 'test_key', value: 'test_val' },
], bl);
assert(gsFlag._storyFlags?.['test_key'] === 'test_val', 'setFlag writes to _storyFlags');

section('E2. requiresFlag NPC Gating');
// Without flag
const sNoFlag = createEmptyCampaignSave('warrior');
sNoFlag.storyFlags = {};
const gsNoF = newStoryFloor(CHAPTER_1, CHAPTER_1.floors[2]!, sNoFlag);
const tommNoFlag = gsNoF.npcs.some(n => n.defId === 'ch1_tomm_returns');
assert(!tommNoFlag, 'Tomm NOT spawned without met_tomm flag');

// With flag
const sWithFlag = createEmptyCampaignSave('warrior');
sWithFlag.storyFlags = { met_tomm: 'true' };
const gsWithF = newStoryFloor(CHAPTER_1, CHAPTER_1.floors[2]!, sWithFlag);
const tommWithFlag = gsWithF.npcs.some(n => n.defId === 'ch1_tomm_returns');
assert(tommWithFlag, 'Tomm spawned WITH met_tomm flag');

section('E3. requiresFlag Atmospheric Event Gating');
// Anders betrayal should only appear with saved_anders flag
const sNoAnders = createEmptyCampaignSave('warrior');
sNoAnders.storyFlags = {};
const gsNoAnders = newStoryFloor(CHAPTER_2, CHAPTER_2.floors[2]!, sNoAnders);
const betrayalNoFlag = gsNoAnders.interactables?.some(i => i.id === 'ch2_f7_atmo_anders_betrayal');
assert(!betrayalNoFlag, 'Anders betrayal NOT shown without saved_anders flag');

const sWithAnders = createEmptyCampaignSave('warrior');
sWithAnders.storyFlags = { saved_anders: 'true' };
const gsWithAnders = newStoryFloor(CHAPTER_2, CHAPTER_2.floors[2]!, sWithAnders);
const betrayalWithFlag = gsWithAnders.interactables?.some(i => i.id === 'ch2_f7_atmo_anders_betrayal');
assert(!!betrayalWithFlag, 'Anders betrayal shown WITH saved_anders flag');

// ══════════════════════════════════════════════════════════════
// SECTION F: HUNGER SYSTEM
// ══════════════════════════════════════════════════════════════

section('F1. Story Mode Hunger');
const sHunger = createEmptyCampaignSave('warrior');
const gsH = newStoryFloor(CHAPTER_1, CHAPTER_1.floors[2]!, sHunger);
gsH._isStoryMode = true;
gsH.monsters = [];
const hungerBefore = gsH.hunger.current;

for (let i = 0; i < 300; i++) processTurn(gsH);

assert(gsH.hunger.current < hungerBefore, `Hunger drains in story mode (${hungerBefore} -> ${gsH.hunger.current})`);
assert(!gsH.gameOver, 'No starvation death in story mode');

gsH.hunger.current = 0;
for (let i = 0; i < 30; i++) processTurn(gsH);
assert(!gsH.gameOver, 'Zero hunger does not kill in story mode');
assert(gsH.player.stats.hp > 0, 'HP stays positive at zero hunger in story mode');

section('F2. Roguelike Hunger (should kill)');
const sRogue = createEmptyCampaignSave('warrior');
const gsR = newStoryFloor(CHAPTER_1, CHAPTER_1.floors[2]!, sRogue);
gsR._isStoryMode = false;
gsR.monsters = [];
gsR.hunger.current = 0;

let diedFromHunger = false;
for (let i = 0; i < 100; i++) {
  processTurn(gsR);
  if (gsR.gameOver) { diedFromHunger = true; break; }
}
assert(diedFromHunger, 'Roguelike mode: starvation kills the player');

// ══════════════════════════════════════════════════════════════
// SECTION G: DIFFICULTY BALANCE
// ══════════════════════════════════════════════════════════════

section('G1. Monster Stat Progression');
const ch1F1 = CHAPTER_1.floors[0]!.monsters;
const ch1F4 = CHAPTER_1.floors[3]!.monsters;
const ch2F8 = CHAPTER_2.floors[3]!.monsters;
const ch3F13 = CHAPTER_3.floors[4]!.monsters;

const avgAtk = (m: typeof ch1F1) => m.reduce((s, x) => s + x.stats.attack, 0) / m.length;
const avgHp = (m: typeof ch1F1) => m.reduce((s, x) => s + x.stats.hp, 0) / m.length;

assert(avgAtk(ch1F4) > avgAtk(ch1F1), `Ch1 F4 avg ATK > F1 (${avgAtk(ch1F4).toFixed(1)} > ${avgAtk(ch1F1).toFixed(1)})`);
assert(avgAtk(ch2F8) > avgAtk(ch1F4), `Ch2 F8 avg ATK > Ch1 F4 (${avgAtk(ch2F8).toFixed(1)} > ${avgAtk(ch1F4).toFixed(1)})`);
assert(avgAtk(ch3F13) > avgAtk(ch2F8), `Ch3 F13 avg ATK > Ch2 F8 (${avgAtk(ch3F13).toFixed(1)} > ${avgAtk(ch2F8).toFixed(1)})`);

assert(avgHp(ch3F13) > avgHp(ch1F1), `Ch3 F13 avg HP > Ch1 F1 (${avgHp(ch3F13).toFixed(1)} > ${avgHp(ch1F1).toFixed(1)})`);

section('G2. Boss Escalation');
const bosses = [CHAPTER_1.boss, CHAPTER_2.boss, CHAPTER_3.boss];
for (let i = 1; i < bosses.length; i++) {
  assert(bosses[i]!.stats.hp > bosses[i-1]!.stats.hp, `Boss ${i+1} HP > Boss ${i} (${bosses[i]!.stats.hp} > ${bosses[i-1]!.stats.hp})`);
  assert(bosses[i]!.stats.attack > bosses[i-1]!.stats.attack, `Boss ${i+1} ATK > Boss ${i} (${bosses[i]!.stats.attack} > ${bosses[i-1]!.stats.attack})`);
}

// ══════════════════════════════════════════════════════════════
// SECTION H: GOLD PERSISTENCE
// ══════════════════════════════════════════════════════════════

section('H1. Gold Flow');
const sGold = createEmptyCampaignSave('warrior');
sGold.gold = 150;
const gsGold = newStoryFloor(CHAPTER_1, CHAPTER_1.floors[0]!, sGold);
assert(gsGold.score === 150, `score = save.gold (${gsGold.score})`);

gsGold.score += 25; // Simulate earning gold
assert(gsGold.score === 175, `Gold after earning (${gsGold.score})`);

// ══════════════════════════════════════════════════════════════
// SECTION I: CHAPTER CONTENT INTEGRITY
// ══════════════════════════════════════════════════════════════

section('I1. Chapter Structure');
for (const chapter of [CHAPTER_1, CHAPTER_2, CHAPTER_3]) {
  assert(chapter.floors.length >= 4, `${chapter.name}: has ${chapter.floors.length} floors (min 4)`);
  assert(chapter.boss !== undefined, `${chapter.name}: has a boss`);
  assert(chapter.boss.stats.hp > 50, `${chapter.name}: boss HP > 50 (${chapter.boss.stats.hp})`);
  assert(chapter.rewards.length > 0, `${chapter.name}: has rewards`);
  
  // Check all floors have monsters
  for (const f of chapter.floors) {
    assert(f.monsters.length > 0, `${chapter.name} F${f.floorIndex}: has monsters`);
    assert(f.items.length > 0, `${chapter.name} F${f.floorIndex}: has items`);
  }
  
  // Check mini-boss victories defined
  if (chapter.miniBossVictories) {
    for (const mbv of chapter.miniBossVictories) {
      assert(mbv.monsterName.length > 0, `${chapter.name}: miniBoss "${mbv.monsterName}" has name`);
      assert(mbv.artAsset.length > 0, `${chapter.name}: miniBoss "${mbv.monsterName}" has art`);
      assert(mbv.itemDrop !== undefined, `${chapter.name}: miniBoss "${mbv.monsterName}" has item drop`);
    }
  }
}

section('I2. No Duplicate Art Assets');
for (const chapter of [CHAPTER_1, CHAPTER_2, CHAPTER_3]) {
  const artPaths = new Map<string, string[]>();
  
  for (const f of chapter.floors) {
    for (const enc of f.encounters) {
      if (enc.artAsset) {
        const list = artPaths.get(enc.artAsset) ?? [];
        list.push(`F${f.floorIndex} enc:${enc.id}`);
        artPaths.set(enc.artAsset, list);
      }
    }
    for (const evt of f.roomEvents) {
      if (evt.artAsset) {
        const list = artPaths.get(evt.artAsset) ?? [];
        list.push(`F${f.floorIndex} evt:${evt.id}`);
        artPaths.set(evt.artAsset, list);
      }
    }
    for (const atmo of (f.atmosphericEvents ?? [])) {
      const list = artPaths.get(atmo.artAsset) ?? [];
      list.push(`F${f.floorIndex} atmo:${atmo.id}`);
      artPaths.set(atmo.artAsset, list);
    }
  }
  
  for (const [path, usages] of artPaths) {
    assert(usages.length <= 1, `${chapter.name}: "${path}" used ${usages.length}x: ${usages.join(', ')}`);
  }
}

// ══════════════════════════════════════════════════════════════
// SECTION J: XP AND MONSTER VALUES
// ══════════════════════════════════════════════════════════════

section('J1. All Monsters Have XP');
for (const chapter of [CHAPTER_1, CHAPTER_2, CHAPTER_3]) {
  for (const f of chapter.floors) {
    for (const m of f.monsters) {
      assert(m.xpValue > 0, `${chapter.name} F${f.floorIndex}: ${m.name} xpValue=${m.xpValue}`);
    }
  }
  assert(chapter.boss.xpValue > 0, `${chapter.name}: boss xpValue=${chapter.boss.xpValue}`);
}

// ══════════════════════════════════════════════════════════════
// RESULTS
// ══════════════════════════════════════════════════════════════
console.log('\n\x1b[1m=== RESULTS ===\x1b[0m');
console.log(`  \x1b[32mPassed: ${passed}\x1b[0m`);
console.log(`  \x1b[31mFailed: ${failed}\x1b[0m`);

if (failures.length > 0) {
  console.log('\n\x1b[31mFailures:\x1b[0m');
  for (const f of failures) console.log(`  - ${f}`);
}

console.log('');
process.exit(failed > 0 ? 1 : 0);
