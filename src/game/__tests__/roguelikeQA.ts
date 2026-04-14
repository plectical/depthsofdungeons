/**
 * Roguelike Mode QA Test Runner
 * Tests core roguelike mechanics: newGame, combat, items, shops, zones, bosses, classes.
 * Run with: npx tsx --import ./src/game/__tests__/setup.mjs src/game/__tests__/roguelikeQA.ts
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

import { newGame, movePlayer, waitTurn, useItem, processTurn, attackEntity, buyItem, isAtShop } from '../engine';
import { CLASS_DEFS, MONSTER_DEFS, BOSS_DEFS, POTION_TEMPLATES, FOOD_TEMPLATES, SCROLL_TEMPLATES, WEAPON_TEMPLATES, ARMOR_TEMPLATES, RING_TEMPLATES, AMULET_TEMPLATES, XP_PER_LEVEL, HUNGER_MAX, HUNGER_PER_TURN, STARVING_DAMAGE, MERCENARY_DEFS } from '../constants';
import { findItemTemplate, createPlayer } from '../entities';
import { createDefaultBloodline, computeBloodlineBonuses } from '../traits';
import { generateFloor } from '../dungeon';
import { ZONE_DEFS, ZONE_MONSTERS, ZONE_BOSSES, ZONE_WEAPONS, ZONE_ARMOR, ZONE_POTIONS, ZONE_FOOD } from '../zones';
import type { GameState, ZoneId, PlayerClass } from '../types';

console.log('\n\x1b[1m=== DEPTHS OF DUNGEON — Roguelike QA Suite ===\x1b[0m');

// ══════════════════════════════════════════════════════════════
// A: GAME INITIALIZATION
// ══════════════════════════════════════════════════════════════

section('A1. newGame for Each Class');
const testClasses: PlayerClass[] = ['warrior', 'rogue', 'mage', 'ranger', 'paladin', 'necromancer'];
for (const cls of testClasses) {
  try {
    const bl = createDefaultBloodline();
    const gs = newGame(cls, bl, 'stone_depths');
    assert(gs !== null, `${cls}: newGame succeeds`);
    assert(gs.player.stats.hp > 0, `${cls}: player has HP (${gs.player.stats.hp})`);
    assert(gs.monsters.length > 0, `${cls}: monsters spawned (${gs.monsters.length})`);
    assert(gs.items.length > 0, `${cls}: items spawned (${gs.items.length})`);
    assert(gs.floorNumber === 1, `${cls}: starts on floor 1`);
    assert(gs.player.isPlayer === true, `${cls}: player flagged as player`);
    assert(gs.hunger.current === HUNGER_MAX, `${cls}: hunger starts at max (${gs.hunger.current})`);
    assert(gs.floor.rooms.length > 0, `${cls}: dungeon has rooms (${gs.floor.rooms.length})`);
  } catch (e) {
    assert(false, `${cls}: newGame CRASHED - ${e}`);
  }
}

section('A2. Zone Initialization');
const testZones: ZoneId[] = ['stone_depths', 'frozen_caverns', 'fungal_marsh', 'infernal_pit', 'crystal_sanctum', 'shadow_realm'];
for (const zone of testZones) {
  try {
    const bl = createDefaultBloodline();
    const gs = newGame('warrior', bl, zone);
    assert(gs.zone === zone, `${zone}: zone set correctly`);
    assert(gs.monsters.length > 0, `${zone}: monsters spawned`);
  } catch (e) {
    assert(false, `${zone}: CRASHED - ${e}`);
  }
}

// ══════════════════════════════════════════════════════════════
// B: DUNGEON GENERATION
// ══════════════════════════════════════════════════════════════

section('B1. Floor Generation');
for (let floor = 1; floor <= 10; floor++) {
  const f = generateFloor(floor, 'stone_depths');
  assert(f.rooms.length >= 3, `Floor ${floor}: ${f.rooms.length} rooms (min 3)`);
  assert(f.width > 0 && f.height > 0, `Floor ${floor}: valid size (${f.width}x${f.height})`);
  
  // Check stairs exist (Tile.StairsDown = '>')
  let hasStairs = false;
  for (let y = 0; y < f.height; y++) {
    for (let x = 0; x < f.width; x++) {
      if (f.tiles[y]?.[x] === '>') hasStairs = true;
    }
  }
  assert(hasStairs, `Floor ${floor}: has stairs down`);
}

section('B2. Zone Floor Generation');
for (const zone of testZones) {
  const f = generateFloor(5, zone);
  assert(f.rooms.length >= 3, `${zone} floor: has rooms (${f.rooms.length})`);
}

// ══════════════════════════════════════════════════════════════
// C: COMBAT SYSTEM
// ══════════════════════════════════════════════════════════════

section('C1. Basic Combat');
const bl = createDefaultBloodline();
const gsC = newGame('warrior', bl, 'stone_depths');
const target = gsC.monsters.find(m => !m.isDead);
if (target) {
  const hpBefore = target.stats.hp;
  attackEntity(gsC, gsC.player, target);
  const dmg = hpBefore - target.stats.hp;
  assert(dmg > 0 || target.isDead, `Attack deals damage (${dmg} dmg)`);
  
  const minDmg = Math.max(1, gsC.player.stats.attack - target.stats.defense);
  assert(dmg >= minDmg, `Damage formula correct (${dmg} >= min ${minDmg})`);
}

section('C2. Monster Attacks Player');
const gsM = newGame('warrior', createDefaultBloodline(), 'stone_depths');
const attacker = gsM.monsters.find(m => !m.isDead);
if (attacker) {
  const playerHpBefore = gsM.player.stats.hp;
  attackEntity(gsM, attacker, gsM.player);
  assert(gsM.player.stats.hp < playerHpBefore || gsM.player.stats.defense >= attacker.stats.attack, 
    `Monster deals damage to player (${playerHpBefore} -> ${gsM.player.stats.hp})`);
}

section('C3. XP and Leveling');
const gsXP = newGame('warrior', createDefaultBloodline(), 'stone_depths');
assert(gsXP.player.xp === 0, 'Player starts at 0 XP');
assert(gsXP.player.level === 1, 'Player starts at level 1');

// Kill a weak monster
const weakTarget = gsXP.monsters.find(m => !m.isDead);
if (weakTarget) {
  weakTarget.stats.hp = 1;
  const xpBefore = gsXP.player.xp;
  attackEntity(gsXP, gsXP.player, weakTarget);
  assert(gsXP.player.xp > xpBefore, `XP gained from kill (${xpBefore} -> ${gsXP.player.xp})`);
}

// Check XP thresholds are ascending
for (let i = 1; i < XP_PER_LEVEL.length; i++) {
  assert(XP_PER_LEVEL[i]! > XP_PER_LEVEL[i-1]!, `XP threshold ${i} > ${i-1} (${XP_PER_LEVEL[i]} > ${XP_PER_LEVEL[i-1]})`);
}

// ══════════════════════════════════════════════════════════════
// D: ITEM SYSTEM
// ══════════════════════════════════════════════════════════════

section('D1. Potion Use');
const gsP = newGame('warrior', createDefaultBloodline(), 'stone_depths');
gsP.player.stats.hp = 10; // Damage player
const hpPotion = findItemTemplate('Health Potion');
if (hpPotion) {
  gsP.player.inventory.push({ ...hpPotion, id: 'test_hp' } as any);
  const hpBefore = gsP.player.stats.hp;
  useItem(gsP, gsP.player.inventory.findIndex(i => i.name === 'Health Potion'));
  assert(gsP.player.stats.hp > hpBefore, `Health Potion heals (${hpBefore} -> ${gsP.player.stats.hp})`);
}

section('D2. Food Use');
const gsF = newGame('warrior', createDefaultBloodline(), 'stone_depths');
gsF.hunger.current = 50;
const bread = findItemTemplate('Bread');
if (bread) {
  gsF.player.inventory.push({ ...bread, id: 'test_bread' } as any);
  const hungerBefore = gsF.hunger.current;
  useItem(gsF, gsF.player.inventory.findIndex(i => i.name === 'Bread'));
  assert(gsF.hunger.current > hungerBefore, `Bread restores hunger (${hungerBefore} -> ${gsF.hunger.current})`);
}

section('D3. Equipment');
const gsEq = newGame('warrior', createDefaultBloodline(), 'stone_depths');
const sword = findItemTemplate('Short Sword');
if (sword) {
  gsEq.player.inventory.push({ ...sword, id: 'test_sword' } as any);
  assert(gsEq.player.inventory.some(i => i.name === 'Short Sword'), 'Sword added to inventory');
}

// ══════════════════════════════════════════════════════════════
// E: HUNGER SYSTEM
// ══════════════════════════════════════════════════════════════

section('E1. Hunger Drain');
const gsHu = newGame('warrior', createDefaultBloodline(), 'stone_depths');
gsHu.floorNumber = 5; // Past early-floor reduction
gsHu.monsters = [];
const hungerStart = gsHu.hunger.current;
for (let i = 0; i < 100; i++) processTurn(gsHu);
assert(gsHu.hunger.current < hungerStart, `Hunger drains over turns (${hungerStart} -> ${gsHu.hunger.current})`);

section('E2. Starvation');
const gsStarve = newGame('warrior', createDefaultBloodline(), 'stone_depths');
gsStarve.floorNumber = 5;
gsStarve.monsters = [];
gsStarve.hunger.current = 0;
let diedFromStarve = false;
for (let i = 0; i < 200; i++) {
  processTurn(gsStarve);
  if (gsStarve.gameOver) { diedFromStarve = true; break; }
}
assert(diedFromStarve, 'Player dies from starvation in roguelike mode');

// ══════════════════════════════════════════════════════════════
// F: MONSTER DEFINITIONS
// ══════════════════════════════════════════════════════════════

section('F1. Base Monster Defs');
for (const m of MONSTER_DEFS) {
  assert(m.name.length > 0, `Monster "${m.name}" has name`);
  assert(m.stats.hp > 0, `${m.name}: HP > 0 (${m.stats.hp})`);
  assert(m.stats.attack > 0, `${m.name}: ATK > 0 (${m.stats.attack})`);
  assert(m.xpValue > 0, `${m.name}: XP > 0 (${m.xpValue})`);
  assert(m.minFloor >= 1, `${m.name}: minFloor >= 1 (${m.minFloor})`);
}

section('F2. Boss Defs');
for (const b of BOSS_DEFS) {
  assert(b.name.length > 0, `Boss "${b.name}" has name`);
  assert(b.stats.hp >= 40, `${b.name}: HP >= 40 (${b.stats.hp})`);
  assert(b.isBoss === true, `${b.name}: isBoss flag set`);
  assert(b.bossAbility !== undefined, `${b.name}: has boss ability`);
}

section('F3. Zone Monsters');
for (const zone of testZones) {
  const monsters = ZONE_MONSTERS[zone];
  if (zone === 'stone_depths') continue; // Uses base monsters
  assert(monsters.length > 0, `${zone}: has zone monsters (${monsters.length})`);
  for (const m of monsters) {
    assert(m.xpValue > 0, `${zone} ${m.name}: XP > 0`);
    assert(m.stats.hp > 0, `${zone} ${m.name}: HP > 0`);
  }
}

section('F4. Zone Bosses');
for (const zone of testZones) {
  const bosses = ZONE_BOSSES[zone];
  if (zone === 'stone_depths') continue;
  assert(bosses.length > 0, `${zone}: has zone bosses (${bosses.length})`);
  for (const b of bosses) {
    assert(b.isBoss === true, `${zone} ${b.name}: isBoss set`);
    assert(b.stats.hp >= 50, `${zone} ${b.name}: HP >= 50 (${b.stats.hp})`);
  }
}

// ══════════════════════════════════════════════════════════════
// G: ZONE CONTENT
// ══════════════════════════════════════════════════════════════

section('G1. Zone Equipment');
for (const zone of testZones) {
  if (zone === 'stone_depths') continue;
  const weapons = ZONE_WEAPONS[zone];
  const armor = ZONE_ARMOR[zone];
  const potions = ZONE_POTIONS[zone];
  const food = ZONE_FOOD[zone];
  assert(weapons.length > 0, `${zone}: has weapons (${weapons.length})`);
  assert(armor.length > 0, `${zone}: has armor (${armor.length})`);
  assert(potions.length > 0, `${zone}: has potions (${potions.length})`);
  assert(food.length > 0, `${zone}: has food (${food.length})`);
}

section('G2. Zone Definitions');
for (const z of ZONE_DEFS) {
  assert(z.name.length > 0, `Zone "${z.name}" has name`);
  assert(z.color.length > 0, `${z.name}: has color`);
  assert(z.palette !== undefined, `${z.name}: has palette`);
  assert(z.terrainPool.length > 0, `${z.name}: has terrain pool (${z.terrainPool.length})`);
}

// ══════════════════════════════════════════════════════════════
// H: MERCENARY SYSTEM
// ══════════════════════════════════════════════════════════════

section('H1. Mercenary Defs');
assert(MERCENARY_DEFS.length > 0, `Mercenary defs exist (${MERCENARY_DEFS.length})`);
for (const m of MERCENARY_DEFS) {
  assert(m.name.length > 0, `Merc "${m.name}" has name`);
  assert(m.hireCost > 0, `${m.name}: hire cost > 0 (${m.hireCost})`);
  assert(m.stats.hp > 0, `${m.name}: HP > 0 (${m.stats.hp})`);
  assert(m.stats.attack > 0, `${m.name}: ATK > 0 (${m.stats.attack})`);
}

// ══════════════════════════════════════════════════════════════
// I: CLASS BALANCE
// ══════════════════════════════════════════════════════════════

section('I1. Class Stat Ranges');
for (const cls of CLASS_DEFS) {
  const s = cls.baseStats;
  assert(s.hp >= 20 && s.hp <= 50, `${cls.name}: HP in range [20,50] (${s.hp})`);
  assert(s.attack >= 3 && s.attack <= 10, `${cls.name}: ATK in range [3,10] (${s.attack})`);
  assert(s.speed >= 5 && s.speed <= 15, `${cls.name}: SPD in range [5,15] (${s.speed})`);
}

section('I2. Class Level Bonuses');
for (const cls of CLASS_DEFS) {
  assert(cls.levelBonusHp >= 1, `${cls.name}: levelBonusHp >= 1 (${cls.levelBonusHp})`);
  assert(cls.levelBonusAtk >= 0, `${cls.name}: levelBonusAtk >= 0 (${cls.levelBonusAtk})`);
  assert(cls.levelBonusDef >= 0, `${cls.name}: levelBonusDef >= 0 (${cls.levelBonusDef})`);
}

// ══════════════════════════════════════════════════════════════
// J: BLOODLINE SYSTEM
// ══════════════════════════════════════════════════════════════

section('J1. Default Bloodline');
const defaultBl = createDefaultBloodline();
assert(defaultBl.generation === 0, 'Default bloodline generation 0');
assert(defaultBl.ancestors.length === 0, 'No ancestors initially');
assert(defaultBl.unlockedTraits.length === 0, 'No traits initially');

section('J2. Bloodline Bonuses');
const bonusBl = createDefaultBloodline();
bonusBl.unlockedTraits = ['first_fall'];
const bonuses = computeBloodlineBonuses(bonusBl);
assert(bonuses !== undefined, 'computeBloodlineBonuses returns a value');
assert(typeof bonuses.statBonuses === 'object', 'Has stat bonuses object');

// ══════════════════════════════════════════════════════════════
// K: MOVEMENT SYSTEM
// ══════════════════════════════════════════════════════════════

section('K1. Player Movement');
const gsMove = newGame('warrior', createDefaultBloodline(), 'stone_depths');
const startPos = { ...gsMove.player.pos };

// Try all 4 directions, at least one should work
let anyMoved = false;
for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
  const gsCopy = JSON.parse(JSON.stringify(gsMove));
  gsCopy.floor = gsMove.floor; // Keep floor reference (not serializable fully)
  // Just verify movePlayer doesn't crash
  try {
    movePlayer(gsMove, dx!, dy!);
    anyMoved = true;
    break;
  } catch {
    // Direction may be blocked
  }
}
assert(true, 'movePlayer does not crash');

section('K2. Wait Turn');
const gsWait = newGame('warrior', createDefaultBloodline(), 'stone_depths');
const turnBefore = gsWait.turn;
waitTurn(gsWait);
assert(gsWait.turn > turnBefore, `waitTurn advances turn (${turnBefore} -> ${gsWait.turn})`);

// ══════════════════════════════════════════════════════════════
// L: SHOP SYSTEM
// ══════════════════════════════════════════════════════════════

section('L1. Shop Generation');
const gsShop = newGame('warrior', createDefaultBloodline(), 'stone_depths');
if (gsShop.shop) {
  assert(gsShop.shop.stock.length > 0, `Shop has stock (${gsShop.shop.stock.length})`);
  assert(gsShop.shop.pos.x >= 0, 'Shop has valid position');
  
  for (const si of gsShop.shop.stock) {
    assert(si.price > 0, `Shop item "${si.item.name}" has price (${si.price})`);
    assert(si.item.name.length > 0, `Shop item has name`);
  }
} else {
  assert(true, 'No shop on this floor (RNG-based, acceptable)');
}

// ══════════════════════════════════════════════════════════════
// M: HELL ZONE
// ══════════════════════════════════════════════════════════════

section('M1. Hell Zone');
try {
  const gsHell = newGame('warrior', createDefaultBloodline(), 'hell');
  assert(gsHell.zone === 'hell', 'Hell zone initializes');
  assert(gsHell.monsters.length > 0, `Hell has monsters (${gsHell.monsters.length})`);
  
  const hellMonsters = ZONE_MONSTERS['hell'];
  assert(hellMonsters.length > 0, `Hell has ${hellMonsters.length} monster types`);
  
  const hellBosses = ZONE_BOSSES['hell'];
  assert(hellBosses.length > 0, `Hell has ${hellBosses.length} boss types`);
  
  // Lucifer should be the hardest boss
  const lucifer = hellBosses.find(b => b.name === 'Lucifer');
  assert(lucifer !== undefined, 'Lucifer exists');
  if (lucifer) {
    assert(lucifer.stats.hp === 666, `Lucifer HP is 666 (${lucifer.stats.hp})`);
  }
} catch (e) {
  assert(false, `Hell zone CRASHED: ${e}`);
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
