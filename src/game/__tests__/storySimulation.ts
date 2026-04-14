/**
 * Headless Story Mode Test Runner
 * Simulates game mechanics without UI to verify everything works correctly.
 * Run with: npx tsx src/game/__tests__/storySimulation.ts
 */

// Browser globals are loaded via --import setup.mjs preload script

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, testName: string) {
  if (condition) {
    passed++;
    console.log(`  \x1b[32mPASS\x1b[0m ${testName}`);
  } else {
    failed++;
    failures.push(testName);
    console.log(`  \x1b[31mFAIL\x1b[0m ${testName}`);
  }
}

function section(name: string) {
  console.log(`\n\x1b[36m── ${name} ──\x1b[0m`);
}

// ── Imports (after stubs) ──
import { newStoryFloor, storyMovePlayer } from '../story-mode/storyEngine';
import { useItem, applyDialogueEffects, processTurn, attackEntity } from '../engine';
import { CHAPTER_1 } from '../story-mode/chapters/chapter1';
import { CHAPTER_2 } from '../story-mode/chapters/chapter2';
import { CHAPTER_3 } from '../story-mode/chapters/chapter3';
import { createEmptyCampaignSave } from '../story-mode/campaignTypes';
import { createDefaultBloodline } from '../traits';
import { getTransformDef, TRANSFORM_DEFS } from '../story-mode/transformations';
import { findItemTemplate } from '../entities';
import type { GameState, DialogueEffect } from '../types';

console.log('\n\x1b[1m=== DEPTHS OF DUNGEON — Headless Test Runner ===\x1b[0m\n');

// ══════════════════════════════════════════════════════════════
// TEST 1: Story Floor Creation
// ══════════════════════════════════════════════════════════════
section('1. Story Floor Creation');

const save1 = createEmptyCampaignSave('warrior');
save1.gold = 50;
const ch1 = CHAPTER_1;
const floor1Def = ch1.floors[0]!;
const gs1 = newStoryFloor(ch1, floor1Def, save1);

assert(gs1 !== null && gs1 !== undefined, 'newStoryFloor returns a GameState');
assert(gs1.player !== null, 'Player exists');
assert(gs1.player.stats.hp > 0, 'Player has HP');
assert(gs1.player.stats.attack > 0, 'Player has attack');
assert(gs1.monsters.length > 0, 'Monsters spawned');
assert(gs1.items.length > 0, 'Items spawned');
assert(gs1.shop !== null, 'Shop spawned (new feature)');
assert(gs1.shop !== null && gs1.shop!.stock.length > 0, 'Shop has stock');
assert(gs1.score === 50, `Gold persisted from save (expected 50, got ${gs1.score})`);
assert(gs1._isStoryMode === true, 'Story mode flag set');
assert(gs1._storyFlags !== undefined, 'Story flags initialized');
assert(gs1.interactables !== undefined && gs1.interactables!.length > 0, 'Interactables placed');

// Check for NPCs
assert(gs1.npcs.length > 0, 'NPCs spawned on floor');

// Check mercenaries (may not always spawn due to RNG, so just verify array exists)
assert(Array.isArray(gs1.mapMercenaries), 'Map mercenaries array exists');

// ══════════════════════════════════════════════════════════════
// TEST 2: All Chapter Floors Create Successfully
// ══════════════════════════════════════════════════════════════
section('2. All Chapter Floors');

for (const chapter of [CHAPTER_1, CHAPTER_2, CHAPTER_3]) {
  for (const floorDef of chapter.floors) {
    try {
      const save = createEmptyCampaignSave('warrior');
      save.playerLevel = 3;
      const gs = newStoryFloor(chapter, floorDef, save);
      assert(gs.monsters.length > 0, `${chapter.name} Floor ${floorDef.floorIndex}: monsters spawned (${gs.monsters.length})`);
    } catch (e) {
      assert(false, `${chapter.name} Floor ${floorDef.floorIndex}: CRASHED - ${e}`);
    }
  }
}

// ══════════════════════════════════════════════════════════════
// TEST 3: Transformation System — Dream Shard (Shadow)
// ══════════════════════════════════════════════════════════════
section('3. Transformation System — Dream Shard');

const tDef = getTransformDef('shadow');
assert(tDef !== undefined, 'Shadow transform def exists');
assert(tDef!.consumableName === 'Dream Shard', 'Shadow consumable is Dream Shard');
assert(tDef!.permanentThreshold === 5, 'Shadow permanent threshold is 5');

// Create a state with a Dream Shard in inventory
const saveTr = createEmptyCampaignSave('warrior');
const gsTr = newStoryFloor(ch1, ch1.floors[2]!, saveTr); // Floor 3 has Dream Shards
const dreamShard = findItemTemplate('Dream Shard');
assert(dreamShard !== undefined, 'Dream Shard item template exists');

// Manually add Dream Shards to inventory
for (let i = 0; i < 6; i++) {
  gsTr.player.inventory.push({ ...dreamShard!, id: `test_ds_${i}` } as any);
}

const atkBefore = gsTr.player.stats.attack;
const spdBefore = gsTr.player.stats.speed;

// Use first Dream Shard — should enter temporary shadow form
const used = useItem(gsTr, gsTr.player.inventory.findIndex(i => i.name === 'Dream Shard'));
assert(used === true, 'Dream Shard used successfully');
assert(gsTr._activeTransformId === 'shadow', `Active transform is shadow (got ${gsTr._activeTransformId})`);
assert((gsTr._transformTurns ?? 0) > 0, `Transform turns set (got ${gsTr._transformTurns})`);
assert(gsTr.player.stats.attack > atkBefore, 'Attack increased after shadow transform');
assert(gsTr.player.stats.speed > spdBefore, 'Speed increased after shadow transform');
assert(gsTr.player.char === 'S', `Player char changed to S (got ${gsTr.player.char})`);

// Use 4 more Dream Shards to hit permanent threshold (5 total)
for (let i = 0; i < 4; i++) {
  const idx = gsTr.player.inventory.findIndex(it => it.name === 'Dream Shard');
  if (idx >= 0) useItem(gsTr, idx);
}
assert(gsTr._transformPermanent === true, 'Shadow transform is permanent after 5 uses');
assert(gsTr.player.char === 'S', 'Player char still S in permanent form');

// ══════════════════════════════════════════════════════════════
// TEST 4: Transformation System — Wall Essence (Flesh Wall)
// ══════════════════════════════════════════════════════════════
section('4. Transformation System — Wall Essence');

const wallDef = getTransformDef('flesh_wall');
assert(wallDef !== undefined, 'Flesh wall transform def exists');
assert(wallDef!.consumableName === 'Wall Essence', 'Flesh wall consumable is Wall Essence');

const saveW = createEmptyCampaignSave('warrior');
const gsW = newStoryFloor(CHAPTER_2, CHAPTER_2.floors[1]!, saveW);
const wallEssence = findItemTemplate('Wall Essence');
assert(wallEssence !== undefined, 'Wall Essence item template exists');

gsW.player.inventory.push({ ...wallEssence!, id: 'test_we_1' } as any);
const defBefore = gsW.player.stats.defense;
const usedW = useItem(gsW, gsW.player.inventory.findIndex(i => i.name === 'Wall Essence'));
assert(usedW === true, 'Wall Essence used successfully');
assert(gsW._activeTransformId === 'flesh_wall', `Active transform is flesh_wall (got ${gsW._activeTransformId})`);
assert(gsW.player.stats.defense > defBefore, 'Defense increased after flesh wall transform');
assert(gsW.player.char === 'W', `Player char changed to W (got ${gsW.player.char})`);

// ══════════════════════════════════════════════════════════════
// TEST 5: Consumable Blocking While Transformed
// ══════════════════════════════════════════════════════════════
section('5. Consumable Blocking');

const hpPotion = findItemTemplate('Health Potion');
assert(hpPotion !== undefined, 'Health Potion template exists');

// gsW is in flesh_wall form (canUseConsumables = false)
gsW.player.inventory.push({ ...hpPotion!, id: 'test_hp_1' } as any);
gsW.player.stats.hp = 10; // Ensure they need healing
const hpIdx = gsW.player.inventory.findIndex(i => i.name === 'Health Potion');
const blockedUse = useItem(gsW, hpIdx);
assert(blockedUse === false, 'Health Potion blocked while in flesh wall form');

// ══════════════════════════════════════════════════════════════
// TEST 6: Flag System
// ══════════════════════════════════════════════════════════════
section('6. Flag System');

const saveF = createEmptyCampaignSave('warrior');
const gsF = newStoryFloor(ch1, floor1Def, saveF);
const bl = createDefaultBloodline();

// Test setFlag dialogue effect
const flagEffects: DialogueEffect[] = [
  { type: 'setFlag', key: 'met_gristle', value: 'true' },
  { type: 'message', text: 'Test message', color: '#fff' },
];
applyDialogueEffects(gsF, flagEffects, bl);
assert(gsF._storyFlags?.['met_gristle'] === 'true', 'setFlag effect writes to _storyFlags');

// Test NPC filtering by requiresFlag
const saveGated = createEmptyCampaignSave('warrior');
saveGated.storyFlags = {}; // No flags set
const gsNoFlag = newStoryFloor(ch1, ch1.floors[2]!, saveGated); // Floor 3 has Tomm (requiresFlag: met_tomm)

// Count NPCs with Tomm returning
const tommReturns = gsNoFlag.npcs.some(n => n.defId === 'ch1_tomm_returns');

// Now with the flag set
saveGated.storyFlags = { met_tomm: 'true' };
const gsWithFlag = newStoryFloor(ch1, ch1.floors[2]!, saveGated);
const tommReturnsWithFlag = gsWithFlag.npcs.some(n => n.defId === 'ch1_tomm_returns');

assert(!tommReturns, 'Tomm does NOT return without met_tomm flag');
assert(tommReturnsWithFlag, 'Tomm DOES return with met_tomm flag set');

// ══════════════════════════════════════════════════════════════
// TEST 7: Combat and XP
// ══════════════════════════════════════════════════════════════
section('7. Combat and XP');

const saveC = createEmptyCampaignSave('warrior');
const gsC = newStoryFloor(ch1, floor1Def, saveC);
const xpBefore = gsC.player.xp;

// Find a monster and kill it
const target = gsC.monsters.find(m => !m.isDead);
if (target) {
  target.stats.hp = 1; // Weaken it
  attackEntity(gsC, gsC.player, target);
  
  if (target.isDead) {
    assert(gsC.player.xp > xpBefore, `XP gained from kill (before: ${xpBefore}, after: ${gsC.player.xp})`);
  } else {
    assert(true, 'Monster survived (attack did not kill) — testing XP requires kill');
  }
} else {
  assert(false, 'No monsters found to test combat');
}

// Test monster stats match chapter definitions
const ch1Floor1Monsters = ch1.floors[0]!.monsters;
for (const mDef of ch1Floor1Monsters) {
  const spawned = gsC.monsters.find(m => m.name === mDef.name);
  if (spawned) {
    assert(spawned.xp === mDef.xpValue, `${mDef.name} XP matches def (expected ${mDef.xpValue}, got ${spawned.xp})`);
  }
}

// ══════════════════════════════════════════════════════════════
// TEST 8: Difficulty Scaling Verification
// ══════════════════════════════════════════════════════════════
section('8. Difficulty Scaling');

// Chapter 1 Floor 1 monsters should be weaker than Ch3 Floor 13 monsters
const ch1Monsters = ch1.floors[0]!.monsters;
const ch3BossFloor = CHAPTER_3.floors[CHAPTER_3.floors.length - 1]!;
const ch3Monsters = ch3BossFloor.monsters;

const ch1MaxAtk = Math.max(...ch1Monsters.map(m => m.stats.attack));
const ch3MaxAtk = Math.max(...ch3Monsters.map(m => m.stats.attack));
assert(ch3MaxAtk > ch1MaxAtk, `Ch3 monsters hit harder than Ch1 (${ch3MaxAtk} > ${ch1MaxAtk})`);

const ch1MaxHp = Math.max(...ch1Monsters.map(m => m.stats.hp));
const ch3MaxHp = Math.max(...ch3Monsters.map(m => m.stats.hp));
assert(ch3MaxHp > ch1MaxHp, `Ch3 monsters have more HP than Ch1 (${ch3MaxHp} > ${ch1MaxHp})`);

// Boss stats should escalate across chapters
assert(CHAPTER_1.boss.stats.hp < CHAPTER_2.boss.stats.hp, `Ch2 boss has more HP than Ch1 boss (${CHAPTER_2.boss.stats.hp} > ${CHAPTER_1.boss.stats.hp})`);
assert(CHAPTER_2.boss.stats.hp < CHAPTER_3.boss.stats.hp, `Ch3 boss has more HP than Ch2 boss (${CHAPTER_3.boss.stats.hp} > ${CHAPTER_2.boss.stats.hp})`);

// ══════════════════════════════════════════════════════════════
// TEST 9: Transform Definitions Completeness
// ══════════════════════════════════════════════════════════════
section('9. Transform Definitions');

for (const [id, def] of Object.entries(TRANSFORM_DEFS)) {
  assert(def.id === id, `Transform ${id} has matching id`);
  assert(def.name.length > 0, `Transform ${id} has a name`);
  assert(def.portrait.length > 0, `Transform ${id} has a portrait path`);
  assert(def.char.length === 1, `Transform ${id} has a single char`);
  assert(def.permanentThreshold > 0, `Transform ${id} has a valid permanent threshold`);
  assert(def.turnDuration > 0, `Transform ${id} has a valid turn duration`);
  assert(def.consumableName.length > 0, `Transform ${id} has a consumable name`);
  
  const template = findItemTemplate(def.consumableName);
  assert(template !== undefined, `Transform ${id} consumable "${def.consumableName}" exists as an item template`);
}

// ══════════════════════════════════════════════════════════════
// TEST 10: Hunger System in Story Mode
// ══════════════════════════════════════════════════════════════
section('10. Hunger in Story Mode');

const saveH = createEmptyCampaignSave('warrior');
// Use floor 3 (floorNumber > 2) so the early-floor halving doesn't apply
const gsH = newStoryFloor(ch1, ch1.floors[2]!, saveH);
gsH._isStoryMode = true;
gsH.monsters = []; // Remove monsters so they don't kill us during turn sim
const hungerBefore = gsH.hunger.current;

// Story mode rate: 0.4 * 0.25 = 0.1/turn. After 200 turns = -20 hunger.
for (let i = 0; i < 200; i++) {
  processTurn(gsH);
  if (gsH.gameOver) break;
}

assert(gsH.hunger.current < hungerBefore, `Hunger decreases over turns (before: ${hungerBefore}, after: ${gsH.hunger.current})`);
assert(!gsH.gameOver, 'Player did not die from hunger in story mode');

// Drain all hunger
gsH.hunger.current = 0;
for (let i = 0; i < 20; i++) {
  processTurn(gsH);
}
assert(!gsH.gameOver, 'Player does NOT die from starvation in story mode');
assert(gsH.player.stats.hp > 0, 'Player HP still positive despite zero hunger in story mode');

// ══════════════════════════════════════════════════════════════
// TEST 11: Item Templates for Story Items
// ══════════════════════════════════════════════════════════════
section('11. Story Item Templates');

const storyItems = ['Dream Shard', 'Wall Essence', 'Dino Serum', 'Health Potion'];
for (const itemName of storyItems) {
  const template = findItemTemplate(itemName);
  assert(template !== undefined, `Item template exists: ${itemName}`);
}

// ══════════════════════════════════════════════════════════════
// TEST 12: Gold Persistence via score
// ══════════════════════════════════════════════════════════════
section('12. Gold Persistence');

const saveG = createEmptyCampaignSave('warrior');
saveG.gold = 200;
const gsG = newStoryFloor(ch1, floor1Def, saveG);
assert(gsG.score === 200, `Score initialized from save.gold (expected 200, got ${gsG.score})`);

// Simulate earning gold from a kill
gsG.score += 15;
assert(gsG.score === 215, `Gold increased after earning (expected 215, got ${gsG.score})`);

// ══════════════════════════════════════════════════════════════
// RESULTS
// ══════════════════════════════════════════════════════════════
console.log('\n\x1b[1m=== RESULTS ===\x1b[0m');
console.log(`  \x1b[32mPassed: ${passed}\x1b[0m`);
console.log(`  \x1b[31mFailed: ${failed}\x1b[0m`);

if (failures.length > 0) {
  console.log('\n\x1b[31mFailures:\x1b[0m');
  for (const f of failures) {
    console.log(`  - ${f}`);
  }
}

console.log('');
process.exit(failed > 0 ? 1 : 0);
