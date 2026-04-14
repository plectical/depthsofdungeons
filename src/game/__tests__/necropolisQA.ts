/**
 * Necropolis System QA Test Runner
 * Tests unlock thresholds, bounty system, weapon/armor/item gating, class unlocks.
 * Run with: npx tsx --import ./src/game/__tests__/setup.mjs src/game/__tests__/necropolisQA.ts
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
  NECROPOLIS_UNLOCKS,
  BESTIARY_BOUNTIES,
  getUnlockedIds,
  getNextUnlocks,
  isUnlocked,
  getNecropolisMonsters,
  getNecropolisWeapons,
  getNecropolisArmor,
  getNecropolisItems,
  getNecropolisClasses,
  isBountyComplete,
  getBountyProgress,
  getUnlockedBountyItems,
  createDefaultNecropolisState,
} from '../necropolis';

console.log('\n\x1b[1m=== DEPTHS OF DUNGEON — Necropolis QA Suite ===\x1b[0m');

// ══════════════════════════════════════════════════════════════
// A: UNLOCK TABLE INTEGRITY
// ══════════════════════════════════════════════════════════════

section('A1. Unlock Table Structure');
assert(NECROPOLIS_UNLOCKS.length > 0, `Unlock table has entries (${NECROPOLIS_UNLOCKS.length})`);

for (const unlock of NECROPOLIS_UNLOCKS) {
  assert(unlock.id.length > 0, `Unlock "${unlock.id}" has id`);
  assert(unlock.name.length > 0, `Unlock "${unlock.id}" has name`);
  assert(unlock.category.length > 0, `Unlock "${unlock.id}" has category (${unlock.category})`);
  assert(unlock.deathsRequired > 0, `Unlock "${unlock.id}" threshold > 0 (${unlock.deathsRequired})`);
}

const unlockCategories = new Set(NECROPOLIS_UNLOCKS.map(u => u.category));
assert(unlockCategories.has('weapon'), 'Has weapon unlocks');
assert(unlockCategories.has('armor'), 'Has armor unlocks');
assert(unlockCategories.has('item'), 'Has item unlocks');
assert(unlockCategories.has('class'), 'Has class unlocks');

// ══════════════════════════════════════════════════════════════
// B: UNLOCK PROGRESSION
// ══════════════════════════════════════════════════════════════

section('B1. Zero Deaths');
const ids0 = getUnlockedIds(0);
assert(ids0.length === 0, `No unlocks at 0 deaths (got ${ids0.length})`);

section('B2. Progressive Unlocks');
const ids5 = getUnlockedIds(5);
assert(ids5.length > 0, `Some unlocks at 5 deaths (${ids5.length})`);

const ids50 = getUnlockedIds(50);
assert(ids50.length > ids5.length, `More unlocks at 50 deaths (${ids50.length} > ${ids5.length})`);

const ids200 = getUnlockedIds(200);
assert(ids200.length > ids50.length, `More unlocks at 200 deaths (${ids200.length} > ${ids50.length})`);

const idsMax = getUnlockedIds(10000);
assert(idsMax.length === NECROPOLIS_UNLOCKS.length, `All unlocked at 10000 deaths (${idsMax.length} === ${NECROPOLIS_UNLOCKS.length})`);

section('B3. isUnlocked');
const firstUnlock = NECROPOLIS_UNLOCKS[0]!;
assert(!isUnlocked(firstUnlock.id, firstUnlock.deathsRequired - 1), `"${firstUnlock.id}" NOT unlocked below threshold`);
assert(isUnlocked(firstUnlock.id, firstUnlock.deathsRequired), `"${firstUnlock.id}" unlocked at threshold (${firstUnlock.deathsRequired})`);
assert(isUnlocked(firstUnlock.id, firstUnlock.deathsRequired + 100), `"${firstUnlock.id}" still unlocked above threshold`);

section('B4. getNextUnlocks');
const next0 = getNextUnlocks(0);
assert(next0.length > 0, `Next unlocks from 0 deaths (${next0.length})`);

const nextAll = getNextUnlocks(10000);
assert(nextAll.length === 0, `No next unlocks when all unlocked (${nextAll.length})`);

// ══════════════════════════════════════════════════════════════
// C: NECROPOLIS GEAR
// ══════════════════════════════════════════════════════════════

section('C1. Weapons');
const weapons0 = getNecropolisWeapons(0);
assert(weapons0.length === 0, `No weapons at 0 deaths`);

const weapons100 = getNecropolisWeapons(100);
assert(weapons100.length > 0, `Weapons unlocked at 100 deaths (${weapons100.length})`);

for (const w of weapons100) {
  assert(w.name.length > 0, `Weapon "${w.name}" has name`);
  assert(w.type === 'weapon', `${w.name}: type is weapon`);
  assert((w.statBonus?.attack ?? 0) > 0, `${w.name}: has attack bonus`);
}

section('C2. Armor');
const armor0 = getNecropolisArmor(0);
assert(armor0.length === 0, `No armor at 0 deaths`);

const armor100 = getNecropolisArmor(100);
assert(armor100.length > 0, `Armor unlocked at 100 deaths (${armor100.length})`);

for (const a of armor100) {
  assert(a.name.length > 0, `Armor "${a.name}" has name`);
  assert((a.statBonus?.defense ?? 0) > 0, `${a.name}: has defense bonus`);
}

section('C3. Items');
const items0 = getNecropolisItems(0);
assert(items0.length === 0, `No items at 0 deaths`);

const items100 = getNecropolisItems(100);
assert(items100.length > 0, `Items unlocked at 100 deaths (${items100.length})`);

// ══════════════════════════════════════════════════════════════
// D: NECROPOLIS CLASSES
// ══════════════════════════════════════════════════════════════

section('D1. Class Unlocks');
const classes0 = getNecropolisClasses(0);
assert(classes0.length === 0, `No classes at 0 deaths`);

const classes25 = getNecropolisClasses(25);
const hasNecro = classes25.some(c => c.id === 'necromancer');
assert(hasNecro, `Necromancer unlocked at 25 deaths`);

const classes125 = getNecropolisClasses(125);
const hasRevenant = classes125.some(c => c.id === 'revenant');
assert(hasRevenant, `Revenant unlocked at 125 deaths`);

// Echo node alternative unlock
const classesEcho = getNecropolisClasses(0, ['mas_class_3']);
const necroViaEcho = classesEcho.some(c => c.id === 'necromancer');
assert(necroViaEcho, `Necromancer unlocked via echo node mas_class_3`);

// ══════════════════════════════════════════════════════════════
// E: NECROPOLIS MONSTERS
// ══════════════════════════════════════════════════════════════

section('E1. Monster Unlocks');
const monsters0 = getNecropolisMonsters(0);
assert(monsters0.length === 0, `No necro monsters at 0 deaths`);

const monsters100 = getNecropolisMonsters(100);
assert(monsters100.length > 0, `Necro monsters at 100 deaths (${monsters100.length})`);

for (const m of monsters100) {
  assert(m.name.length > 0, `Monster "${m.name}" has name`);
  assert(m.stats.hp > 0, `${m.name}: HP > 0 (${m.stats.hp})`);
  assert(m.stats.attack > 0, `${m.name}: ATK > 0`);
  assert(m.xpValue > 0, `${m.name}: XP > 0`);
}

// ══════════════════════════════════════════════════════════════
// F: BOUNTY SYSTEM
// ══════════════════════════════════════════════════════════════

section('F1. Bounty Table');
assert(BESTIARY_BOUNTIES.length > 0, `Bounty table has entries (${BESTIARY_BOUNTIES.length})`);

for (const b of BESTIARY_BOUNTIES) {
  assert(b.monsterName.length > 0, `Bounty "${b.id}": monster "${b.monsterName}"`);
  assert(b.killsRequired > 0, `${b.id}: kills required > 0 (${b.killsRequired})`);
  assert(b.rewardItem !== undefined, `${b.id}: has reward item`);
  assert(b.rewardItem.name.length > 0, `${b.id}: reward name "${b.rewardItem.name}"`);
  assert(b.tier.length > 0, `${b.id}: has tier "${b.tier}"`);
}

section('F2. Bounty Progress');
const testKills: Record<string, number> = {};
const firstBounty = BESTIARY_BOUNTIES[0]!;
testKills[firstBounty.monsterName] = 0;

const progress0 = getBountyProgress(firstBounty, testKills);
assert(progress0 === 0, `Bounty progress at 0 kills`);

testKills[firstBounty.monsterName] = firstBounty.killsRequired;
assert(isBountyComplete(firstBounty, testKills), `Bounty complete at threshold`);

testKills[firstBounty.monsterName] = firstBounty.killsRequired - 1;
assert(!isBountyComplete(firstBounty, testKills), `Bounty NOT complete below threshold`);

section('F3. Bounty Rewards');
const noKills: Record<string, number> = {};
const rewards0 = getUnlockedBountyItems(noKills);
assert(rewards0.length === 0, `No rewards with no kills`);

// Complete all bounties
const allKills: Record<string, number> = {};
for (const b of BESTIARY_BOUNTIES) {
  allKills[b.monsterName] = Math.max(allKills[b.monsterName] ?? 0, b.killsRequired);
}
allKills['_TOTAL_'] = Object.values(allKills).reduce((s, v) => s + v, 0);

const allRewards = getUnlockedBountyItems(allKills);
assert(allRewards.length > 0, `Rewards unlocked with all bounties complete (${allRewards.length})`);

for (const r of allRewards) {
  assert(r.name.length > 0, `Bounty reward "${r.name}" has name`);
}

// ══════════════════════════════════════════════════════════════
// G: DEFAULT STATE
// ══════════════════════════════════════════════════════════════

section('G1. Default State');
const defaultState = createDefaultNecropolisState();
assert(defaultState.communalDeaths === 0, 'Default deaths = 0');
assert(Object.keys(defaultState.communalKills).length === 0, 'Default kills empty');

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
