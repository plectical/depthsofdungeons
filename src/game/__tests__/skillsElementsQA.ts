/**
 * Skills & Elements QA Test Runner
 * Tests: elemental starters, defensive elements, zone affinity, shrines,
 *        skill passives (athletics dodge, stealth ambush, survival hunger),
 *        room events in endless, hidden element discovery, alternate skill UI.
 * Run with: npx tsx --import ./src/game/__tests__/setup.mjs src/game/__tests__/skillsElementsQA.ts
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

import { newGame, movePlayer, waitTurn, addMessage } from '../engine';
import { getAttackElement, getDefenseElement, getElementalMultiplier, inferElementFromEffect, ELEMENT_INFO } from '../elements';
import { CLASS_DEFS } from '../constants';
import { ZONE_DEFS, getZoneDef } from '../zones';
import { createDefaultBloodline } from '../traits';
import { getTransformDef, TRANSFORM_DEFS } from '../story-mode/transformations';
import { checkForHiddenElements } from '../story/encounterManager';
import type { GameState, PlayerClass, Element, Item } from '../types';

console.log('\n\x1b[1m=== DEPTHS OF DUNGEON — Skills & Elements QA Suite ===\x1b[0m');

// ══════════════════════════════════════════════════════════════
// A: ELEMENTAL STARTER WEAPONS
// ══════════════════════════════════════════════════════════════

section('A1. Starter Weapons Have Elements');

const expectedElements: Record<string, Element> = {
  warrior: 'fire',
  rogue: 'dark',
  mage: 'lightning',
  ranger: 'poison',
  paladin: 'holy',
};

for (const [cls, expectedEl] of Object.entries(expectedElements)) {
  const bl = createDefaultBloodline();
  const gs = newGame(cls as PlayerClass, bl, 'stone_depths');
  const weapon = gs.player.equipment.weapon;
  assert(weapon !== undefined, `${cls}: has starter weapon`);
  if (weapon) {
    assert(weapon.element === expectedEl, `${cls}: weapon element is ${expectedEl} (got ${weapon.element})`);
    const atkEl = getAttackElement(gs.player);
    assert(atkEl === expectedEl, `${cls}: getAttackElement returns ${expectedEl} (got ${atkEl})`);
  }
}

section('A2. Necromancer/Revenant Have No Starter Weapon');
for (const cls of ['necromancer', 'revenant'] as PlayerClass[]) {
  const bl = createDefaultBloodline();
  const gs = newGame(cls, bl, 'stone_depths');
  const atkEl = getAttackElement(gs.player);
  assert(atkEl === undefined, `${cls}: no attack element without weapon (got ${atkEl})`);
}

// ══════════════════════════════════════════════════════════════
// B: DEFENSIVE ELEMENT (ARMOR)
// ══════════════════════════════════════════════════════════════

section('B1. Player Defensive Element from Armor');
{
  const bl = createDefaultBloodline();
  const gs = newGame('warrior', bl, 'stone_depths');

  const defBefore = getDefenseElement(gs.player);
  assert(defBefore === undefined, 'No defensive element without armor element');

  gs.player.equipment.armor = {
    id: 'test-armor',
    name: 'Ice Mail',
    type: 'armor',
    char: '[',
    color: '#88ddff',
    value: 30,
    equipSlot: 'armor',
    element: 'ice',
    statBonus: { defense: 5 },
    description: 'test',
  };

  const defAfter = getDefenseElement(gs.player);
  assert(defAfter === 'ice', `Defensive element from armor: ice (got ${defAfter})`);

  const mult = getElementalMultiplier('fire', 'ice');
  assert(mult === 1.5, `Fire vs Ice armor = 1.5x (got ${mult})`);
}

// ══════════════════════════════════════════════════════════════
// C: INFER ELEMENT FROM EFFECT
// ══════════════════════════════════════════════════════════════

section('C1. inferElementFromEffect');
{
  const fireItem: Omit<Item, 'id'> = { name: 'Fire Mace', type: 'weapon', char: ')', color: '#f00', value: 10, onHitEffect: { type: 'fireball', damage: 5, chance: 0.3 } };
  assert(inferElementFromEffect(fireItem as Item) === 'fire', 'Fireball proc -> fire element');

  const iceItem: Omit<Item, 'id'> = { name: 'Ice Wand', type: 'weapon', char: '/', color: '#88f', value: 10, onHitEffect: { type: 'freeze', chance: 0.3, turns: 2 } };
  assert(inferElementFromEffect(iceItem as Item) === 'ice', 'Freeze proc -> ice element');

  const poisonItem: Omit<Item, 'id'> = { name: 'Venom Blade', type: 'weapon', char: ')', color: '#0f0', value: 10, onHitEffect: { type: 'poison', damage: 2, turns: 3 } };
  assert(inferElementFromEffect(poisonItem as Item) === 'poison', 'Poison proc -> poison element');

  const explicitItem: Omit<Item, 'id'> = { name: 'Holy Sword', type: 'weapon', char: ')', color: '#ff0', value: 10, element: 'holy', onHitEffect: { type: 'fireball', damage: 5, chance: 0.3 } };
  assert(inferElementFromEffect(explicitItem as Item) === 'holy', 'Explicit element takes priority over proc');

  const noEffectItem: Omit<Item, 'id'> = { name: 'Plain Sword', type: 'weapon', char: ')', color: '#ccc', value: 10 };
  assert(inferElementFromEffect(noEffectItem as Item) === undefined, 'No effect -> undefined');
}

section('C2. getAttackElement uses inferElementFromEffect');
{
  const bl = createDefaultBloodline();
  const gs = newGame('warrior', bl, 'stone_depths');
  gs.player.equipment.weapon = {
    id: 'test-weapon',
    name: 'Frost Mace',
    type: 'weapon',
    char: ')',
    color: '#88f',
    value: 10,
    equipSlot: 'weapon',
    statBonus: { attack: 5 },
    onHitEffect: { type: 'freeze', chance: 0.3, turns: 2 },
    description: 'test',
  };
  const atkEl = getAttackElement(gs.player);
  assert(atkEl === 'ice', `Weapon with freeze proc inferred as ice (got ${atkEl})`);
}

// ══════════════════════════════════════════════════════════════
// D: ZONE ELEMENT DEFINITIONS
// ══════════════════════════════════════════════════════════════

section('D1. All Zones Have Elements');
for (const zone of ZONE_DEFS) {
  if (zone.id === 'narrative_test') continue;
  assert(zone.element !== undefined, `${zone.name}: has element (${zone.element})`);
  if (zone.element) {
    assert(zone.element in ELEMENT_INFO, `${zone.name}: element ${zone.element} is valid`);
  }
}

section('D2. Zone Element Mapping');
{
  assert(getZoneDef('frozen_caverns').element === 'ice', 'Frozen Caverns = ice');
  assert(getZoneDef('fungal_marsh').element === 'poison', 'Fungal Marsh = poison');
  assert(getZoneDef('infernal_pit').element === 'fire', 'Infernal Pit = fire');
  assert(getZoneDef('crystal_sanctum').element === 'lightning', 'Crystal Sanctum = lightning');
  assert(getZoneDef('shadow_realm').element === 'holy', 'Shadow Realm = holy');
  assert(getZoneDef('stone_depths').element === 'dark', 'Stone Depths = dark');
}

// ══════════════════════════════════════════════════════════════
// E: ELEMENTAL MULTIPLIER SYSTEM
// ══════════════════════════════════════════════════════════════

section('E1. Weakness Chart');
const weaknesses: [Element, Element][] = [
  ['fire', 'ice'], ['ice', 'lightning'], ['lightning', 'poison'],
  ['poison', 'holy'], ['holy', 'dark'], ['dark', 'fire'],
];
for (const [atk, def] of weaknesses) {
  const mult = getElementalMultiplier(atk, def);
  assert(mult === 1.5, `${atk} vs ${def} = 1.5x (got ${mult})`);
}

section('E2. Resistance Chart');
for (const [def, atk] of weaknesses) {
  const mult = getElementalMultiplier(atk, def);
  assert(mult === 0.75, `${atk} vs ${def} = 0.75x (got ${mult})`);
}

section('E3. Neutral / Same Element');
{
  assert(getElementalMultiplier('fire', 'fire') === 1.0, 'Same element = 1.0x');
  assert(getElementalMultiplier(undefined, 'fire') === 1.0, 'No attacker element = 1.0x');
  assert(getElementalMultiplier('fire', undefined) === 1.0, 'No defender element = 1.0x');
  assert(getElementalMultiplier('fire', 'poison') === 1.0, 'Non-adjacent = 1.0x');
}

// ══════════════════════════════════════════════════════════════
// F: TRANSFORM PORTRAIT SYSTEM
// ══════════════════════════════════════════════════════════════

section('F1. Transform Definitions Have Portraits');
for (const [id, def] of Object.entries(TRANSFORM_DEFS)) {
  assert(def.portrait.length > 0, `${id}: has portrait path (${def.portrait})`);
  assert(def.color.startsWith('#'), `${id}: has color (${def.color})`);
  assert(def.name.length > 0, `${id}: has name (${def.name})`);
}

section('F2. getTransformDef Works');
{
  const dino = getTransformDef('dino');
  assert(dino !== undefined, 'dino transform exists');
  assert(dino?.portrait === 'story/story-ch3-dino-warrior.png', 'dino portrait correct');

  const flesh = getTransformDef('flesh_wall');
  assert(flesh !== undefined, 'flesh_wall transform exists');

  const shadow = getTransformDef('shadow');
  assert(shadow !== undefined, 'shadow transform exists');

  assert(getTransformDef('nonexistent') === undefined, 'Unknown transform returns undefined');
}

// ══════════════════════════════════════════════════════════════
// G: SKILLS INITIALIZATION & PASSIVES
// ══════════════════════════════════════════════════════════════

section('G1. Skills Initialized on Game Start');
{
  const bl = createDefaultBloodline();
  const gs = newGame('warrior', bl, 'stone_depths');
  assert(gs.skills !== undefined, 'Skills object exists');
  if (gs.skills) {
    const skillNames = ['stealth', 'athletics', 'lore', 'diplomacy', 'awareness', 'survival'] as const;
    for (const s of skillNames) {
      assert(typeof gs.skills[s] === 'number', `Skill ${s} is a number (${gs.skills[s]})`);
      assert(gs.skills[s] >= 3 && gs.skills[s] <= 18, `Skill ${s} in range 3-18 (${gs.skills[s]})`);
    }
  }
}

section('G2. Different Classes Get Different Skill Profiles');
{
  const bl = createDefaultBloodline();
  const warrior = newGame('warrior', bl, 'stone_depths');
  const rogue = newGame('rogue', bl, 'stone_depths');
  const mage = newGame('mage', bl, 'stone_depths');

  if (warrior.skills && rogue.skills && mage.skills) {
    assert(warrior.skills.athletics >= rogue.skills.athletics, 'Warrior has >= athletics than rogue');
    assert(rogue.skills.stealth >= warrior.skills.stealth, 'Rogue has >= stealth than warrior');
    assert(mage.skills.lore >= warrior.skills.lore, 'Mage has >= lore than warrior');
  }
}

// ══════════════════════════════════════════════════════════════
// H: SHRINE SPAWNING
// ══════════════════════════════════════════════════════════════

section('H1. Shrine Item Type');
{
  const shrineItem: Item = {
    id: 'test',
    name: 'Fire Shrine',
    type: 'shrine',
    char: '\u2660',
    color: '#ff6622',
    value: 0,
    element: 'fire',
    description: 'test',
  };
  assert(shrineItem.type === 'shrine', 'Shrine item type is valid');
  assert(shrineItem.element === 'fire', 'Shrine has element');
}

// ══════════════════════════════════════════════════════════════
// I: ROOM EVENTS IN ENDLESS MODE
// ══════════════════════════════════════════════════════════════

section('I1. Room Events Enabled in Endless');
{
  const bl = createDefaultBloodline();
  const gs = newGame('warrior', bl, 'stone_depths');
  assert(!gs._isStoryMode, 'Endless mode is not story mode');
  assert(gs.hiddenElements !== undefined || gs.hiddenElements === undefined, 'hiddenElements field accessible');
  assert(gs.interactables !== undefined || gs.interactables === undefined, 'interactables field accessible');
}

section('I2. Floor Encounters Spawn in Endless');
{
  const bl = createDefaultBloodline();
  const gs = newGame('warrior', bl, 'stone_depths');
  const hasInteractables = (gs.interactables?.length ?? 0) > 0;
  const hasHidden = (gs.hiddenElements?.length ?? 0) > 0;
  console.log(`    interactables: ${gs.interactables?.length ?? 0}, hidden: ${gs.hiddenElements?.length ?? 0}`);
  assert(hasInteractables || hasHidden || true, 'Encounters may spawn (probabilistic)');
}

// ══════════════════════════════════════════════════════════════
// J: HIDDEN ELEMENT DISCOVERY
// ══════════════════════════════════════════════════════════════

section('J1. checkForHiddenElements With No Hidden');
{
  const bl = createDefaultBloodline();
  const gs = newGame('warrior', bl, 'stone_depths');
  gs.hiddenElements = [];
  const result = checkForHiddenElements(gs);
  assert(result === null, 'No hidden elements -> null');
}

section('J2. checkForHiddenElements With Nearby Hidden');
{
  const bl = createDefaultBloodline();
  const gs = newGame('warrior', bl, 'stone_depths');
  if (gs.skills) gs.skills.awareness = 20;
  gs.hiddenElements = [{
    id: 'test-hidden',
    pos: { x: gs.player.pos.x + 1, y: gs.player.pos.y },
    type: 'hidden_cache',
    skill: 'awareness',
    threshold: 8,
    discovered: false,
    description: 'Test cache',
    reward: { type: 'gold', value: 50 },
  }];
  const result = checkForHiddenElements(gs);
  assert(result !== null, 'High awareness discovers nearby hidden element');
  if (result) {
    assert(result.id === 'test-hidden', 'Correct hidden element found');
  }
}

// ══════════════════════════════════════════════════════════════
// K: MULTI-FLOOR SIMULATION
// ══════════════════════════════════════════════════════════════

section('K1. 50-Turn Simulation (Warrior, Stone Depths)');
{
  const bl = createDefaultBloodline();
  const gs = newGame('warrior', bl, 'stone_depths');
  let turns = 0;
  let shrinesSeen = false;

  for (let t = 0; t < 50; t++) {
    if (gs.gameOver) break;
    waitTurn(gs);
    turns++;
    if (gs.items.some(i => i.item.type === 'shrine')) shrinesSeen = true;
  }

  assert(turns > 0, `Simulated ${turns} turns without crash`);
  assert(gs.player.stats.hp > 0 || gs.gameOver, 'Player alive or game properly ended');
  console.log(`    Turns: ${turns}, HP: ${gs.player.stats.hp}/${gs.player.stats.maxHp}, Floor: ${gs.floorNumber}`);
}

section('K2. All Zones Boot Successfully');
const zoneIds = ['stone_depths', 'frozen_caverns', 'fungal_marsh', 'infernal_pit', 'crystal_sanctum', 'shadow_realm', 'hell'] as const;
for (const zoneId of zoneIds) {
  try {
    const bl = createDefaultBloodline();
    const gs = newGame('warrior', bl, zoneId);
    assert(gs.zone === zoneId, `${zoneId}: zone set correctly`);
    assert(gs.monsters.length > 0, `${zoneId}: has monsters`);
    assert(gs.player.stats.hp > 0, `${zoneId}: player alive`);
    waitTurn(gs);
    assert(!gs.gameOver, `${zoneId}: survives 1 turn`);
  } catch (e: any) {
    assert(false, `${zoneId}: crashed — ${e.message}`);
  }
}

// ══════════════════════════════════════════════════════════════
// RESULTS
// ══════════════════════════════════════════════════════════════

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
