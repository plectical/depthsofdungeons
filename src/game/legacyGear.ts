import type { PlayerClass, LegacyGearDef, LegacyGearLevel, LegacySystemData, LegacyGearData, Stats, BloodlineData, Item } from './types';

// ══════════════════════════════════════════════════════════════
// LEGACY GEAR DEFINITIONS — one per class
// ══════════════════════════════════════════════════════════════

function buildLevels(
  names: [string, string, string, string, string],
  colors: [string, string, string, string, string],
  statProgressions: Partial<Stats>[],
  abilities: (string | undefined)[],
): LegacyGearLevel[] {
  // Shard costs per level: 5,5,8,8,12,12,15,15,20,20,25,25,30,30,35,35,40,40,50,50
  const costs = [5, 5, 8, 8, 12, 12, 15, 15, 20, 20, 25, 25, 30, 30, 35, 35, 40, 40, 50, 50];
  const levels: LegacyGearLevel[] = [];

  for (let i = 0; i < 20; i++) {
    // Name evolves at 1, 5, 10, 15, 20
    const nameIdx = i < 4 ? 0 : i < 9 ? 1 : i < 14 ? 2 : i < 19 ? 3 : 4;
    const colorIdx = nameIdx;

    levels.push({
      level: i + 1,
      shardCost: costs[i]!,
      statBonus: statProgressions[i] ?? {},
      abilityUnlock: abilities[i],
      name: names[nameIdx]!,
      color: colors[colorIdx]!,
    });
  }
  return levels;
}

// ── Warrior: Legacy Shield ──
const WARRIOR_LEGACY: LegacyGearDef = {
  classId: 'warrior',
  gearType: 'Shield',
  icon: '\u{1F6E1}',
  levels: buildLevels(
    ['Tarnished Buckler', 'Iron Bulwark', 'Radiant Aegis', 'Eternal Guardian', "Warrior's Oath"],
    ['#b0b0b0', '#d0d0e8', '#ffdd44', '#ff9d17', '#ff2a6d'],
    // Stat progression: defense + maxHp ramp
    [
      { defense: 1 }, { defense: 1 }, { defense: 1, maxHp: 2 }, { defense: 2, maxHp: 2 },
      { defense: 2, maxHp: 3 }, { defense: 2, maxHp: 3 }, { defense: 3, maxHp: 4 }, { defense: 3, maxHp: 4 },
      { defense: 3, maxHp: 5 }, { defense: 4, maxHp: 5 }, { defense: 4, maxHp: 6 }, { defense: 4, maxHp: 6 },
      { defense: 5, maxHp: 7 }, { defense: 5, maxHp: 7 }, { defense: 5, maxHp: 8 }, { defense: 6, maxHp: 8 },
      { defense: 6, maxHp: 9 }, { defense: 6, maxHp: 9 }, { defense: 7, maxHp: 10 }, { defense: 8, maxHp: 12 },
    ],
    [
      undefined, undefined, undefined, undefined,
      'legacy_warrior_block', // Lv5: Holy Block — absorb one hit, 60s cooldown
      undefined, undefined, undefined, undefined,
      'legacy_warrior_wall', // Lv10: Divine Wall — block all damage 3s
      undefined, undefined, undefined, undefined,
      'legacy_warrior_reflect', // Lv15: Judgment — reflect next hit for 2x
      undefined, undefined, undefined, undefined,
      'legacy_warrior_master', // Lv20: All abilities unlocked
    ],
  ),
};

// ── Rogue: Legacy Dagger ──
const ROGUE_LEGACY: LegacyGearDef = {
  classId: 'rogue',
  gearType: 'Dagger',
  icon: '\u{1F5E1}',
  levels: buildLevels(
    ['Chipped Stiletto', 'Shadow Fang', 'Phantom Edge', 'Void Reaver', "Rogue's Oath"],
    ['#b0b0b0', '#ffcc33', '#8844aa', '#ff9d17', '#ff2a6d'],
    [
      { attack: 1 }, { attack: 1, speed: 1 }, { attack: 2, speed: 1 }, { attack: 2, speed: 1 },
      { attack: 2, speed: 2 }, { attack: 3, speed: 2 }, { attack: 3, speed: 2 }, { attack: 3, speed: 2 },
      { attack: 4, speed: 3 }, { attack: 4, speed: 3 }, { attack: 4, speed: 3 }, { attack: 5, speed: 3 },
      { attack: 5, speed: 4 }, { attack: 5, speed: 4 }, { attack: 6, speed: 4 }, { attack: 6, speed: 4 },
      { attack: 6, speed: 5 }, { attack: 7, speed: 5 }, { attack: 7, speed: 5 }, { attack: 8, speed: 6 },
    ],
    [
      undefined, undefined, undefined, undefined,
      'legacy_rogue_evade', // Lv5: Shadow Dodge — 25% dodge for 5s
      undefined, undefined, undefined, undefined,
      'legacy_rogue_crit', // Lv10: Fatal Strike — next hit guaranteed crit
      undefined, undefined, undefined, undefined,
      'legacy_rogue_vanish', // Lv15: Vanish — become invisible for 3 turns
      undefined, undefined, undefined, undefined,
      'legacy_rogue_master',
    ],
  ),
};

// ── Mage: Legacy Orb ──
const MAGE_LEGACY: LegacyGearDef = {
  classId: 'mage',
  gearType: 'Orb',
  icon: '\u{1F52E}',
  levels: buildLevels(
    ['Clouded Crystal', 'Arcane Focus', 'Astral Prism', 'Cosmic Eye', "Mage's Oath"],
    ['#b0b0b0', '#8855ff', '#cc77ff', '#ff9d17', '#ff2a6d'],
    [
      { attack: 1 }, { attack: 1 }, { attack: 2 }, { attack: 2 },
      { attack: 3 }, { attack: 3 }, { attack: 3, maxHp: 3 }, { attack: 4, maxHp: 3 },
      { attack: 4, maxHp: 4 }, { attack: 5, maxHp: 4 }, { attack: 5, maxHp: 5 }, { attack: 5, maxHp: 5 },
      { attack: 6, maxHp: 5 }, { attack: 6, maxHp: 6 }, { attack: 7, maxHp: 6 }, { attack: 7, maxHp: 7 },
      { attack: 7, maxHp: 7 }, { attack: 8, maxHp: 8 }, { attack: 8, maxHp: 8 }, { attack: 10, maxHp: 10 },
    ],
    [
      undefined, undefined, undefined, undefined,
      'legacy_mage_burst', // Lv5: Arcane Burst — AoE 8 damage
      undefined, undefined, undefined, undefined,
      'legacy_mage_shield', // Lv10: Mana Barrier — absorb 15 damage
      undefined, undefined, undefined, undefined,
      'legacy_mage_nova', // Lv15: Supernova — huge AoE 20 damage
      undefined, undefined, undefined, undefined,
      'legacy_mage_master',
    ],
  ),
};

// ── Ranger: Legacy Bow ──
const RANGER_LEGACY: LegacyGearDef = {
  classId: 'ranger',
  gearType: 'Bow',
  icon: '\u{1F3F9}',
  levels: buildLevels(
    ['Worn Longbow', 'Windrunner Bow', 'Gale Piercer', 'Storm Herald', "Ranger's Oath"],
    ['#b0b0b0', '#33cc66', '#44ddaa', '#ff9d17', '#ff2a6d'],
    [
      { attack: 1 }, { attack: 1, speed: 1 }, { attack: 1, speed: 1 }, { attack: 2, speed: 1 },
      { attack: 2, speed: 2 }, { attack: 2, speed: 2 }, { attack: 3, speed: 2 }, { attack: 3, speed: 2 },
      { attack: 3, speed: 3 }, { attack: 4, speed: 3 }, { attack: 4, speed: 3 }, { attack: 4, speed: 3 },
      { attack: 5, speed: 4 }, { attack: 5, speed: 4 }, { attack: 5, speed: 4 }, { attack: 6, speed: 4 },
      { attack: 6, speed: 5 }, { attack: 6, speed: 5 }, { attack: 7, speed: 5 }, { attack: 8, speed: 6 },
    ],
    [
      undefined, undefined, undefined, undefined,
      'legacy_ranger_pierce', // Lv5: Piercing Shot — hit ignores 50% defense
      undefined, undefined, undefined, undefined,
      'legacy_ranger_multi', // Lv10: Multi-Shot — hit 2 enemies
      undefined, undefined, undefined, undefined,
      'legacy_ranger_rain', // Lv15: Arrow Rain — AoE ranged attack
      undefined, undefined, undefined, undefined,
      'legacy_ranger_master',
    ],
  ),
};

// ── Paladin: Legacy Shield ──
const PALADIN_LEGACY: LegacyGearDef = {
  classId: 'paladin',
  gearType: 'Aegis',
  icon: '\u{2694}',
  levels: buildLevels(
    ['Dull Crest', 'Blessed Ward', 'Radiant Aegis', 'Divine Bastion', "Paladin's Oath"],
    ['#b0b0b0', '#ffd700', '#ffee66', '#ff9d17', '#ff2a6d'],
    [
      { defense: 1 }, { defense: 1 }, { defense: 1, maxHp: 2 }, { defense: 2, maxHp: 2 },
      { defense: 2, maxHp: 3 }, { defense: 2, maxHp: 4 }, { defense: 3, maxHp: 4 }, { defense: 3, maxHp: 5 },
      { defense: 3, maxHp: 5 }, { defense: 4, maxHp: 6 }, { defense: 4, maxHp: 6 }, { defense: 4, maxHp: 7 },
      { defense: 5, maxHp: 7 }, { defense: 5, maxHp: 8 }, { defense: 5, maxHp: 8 }, { defense: 6, maxHp: 9 },
      { defense: 6, maxHp: 9 }, { defense: 6, maxHp: 10 }, { defense: 7, maxHp: 10 }, { defense: 8, maxHp: 12 },
    ],
    [
      undefined, undefined, undefined, undefined,
      'legacy_paladin_heal', // Lv5: Holy Mend — heal 10 HP
      undefined, undefined, undefined, undefined,
      'legacy_paladin_aura', // Lv10: Blessed Aura — regen 3 HP/turn for 5 turns
      undefined, undefined, undefined, undefined,
      'legacy_paladin_judgment', // Lv15: Divine Judgment — smite all nearby enemies
      undefined, undefined, undefined, undefined,
      'legacy_paladin_master',
    ],
  ),
};

// ── Hellborn: Legacy Chain ──
const HELLBORN_LEGACY: LegacyGearDef = {
  classId: 'hellborn',
  gearType: 'Chain',
  icon: '\u{1F525}',
  levels: buildLevels(
    ['Rusted Shackle', 'Infernal Link', 'Hellfire Chain', 'Doom Tether', "Hellborn's Oath"],
    ['#b0b0b0', '#ff4400', '#ff2200', '#ff9d17', '#ff2a6d'],
    [
      { attack: 1 }, { attack: 2 }, { attack: 2 }, { attack: 3 },
      { attack: 3, maxHp: 2 }, { attack: 4, maxHp: 2 }, { attack: 4, maxHp: 3 }, { attack: 5, maxHp: 3 },
      { attack: 5, maxHp: 4 }, { attack: 6, maxHp: 4 }, { attack: 6, maxHp: 5 }, { attack: 7, maxHp: 5 },
      { attack: 7, maxHp: 6 }, { attack: 8, maxHp: 6 }, { attack: 8, maxHp: 7 }, { attack: 9, maxHp: 7 },
      { attack: 9, maxHp: 8 }, { attack: 10, maxHp: 8 }, { attack: 10, maxHp: 9 }, { attack: 12, maxHp: 10 },
    ],
    [
      undefined, undefined, undefined, undefined,
      'legacy_hellborn_drain', // Lv5: Soul Siphon — lifesteal 20% for 5 turns
      undefined, undefined, undefined, undefined,
      'legacy_hellborn_eruption', // Lv10: Hellfire Eruption — AoE fire damage
      undefined, undefined, undefined, undefined,
      'legacy_hellborn_curse', // Lv15: Death Curse — weaken all enemies
      undefined, undefined, undefined, undefined,
      'legacy_hellborn_master',
    ],
  ),
};

// ── Necromancer: Legacy Skull ──
const NECROMANCER_LEGACY: LegacyGearDef = {
  classId: 'necromancer',
  gearType: 'Skull',
  icon: '\u{1F480}',
  levels: buildLevels(
    ['Cracked Skull', 'Whispering Skull', 'Deathspeaker', 'Lich Crown', "Necromancer's Dominion"],
    ['#b0b0b0', '#aa44dd', '#cc55ee', '#ff9d17', '#ff2a6d'],
    [
      { attack: 1 }, { attack: 1, maxHp: 2 }, { attack: 2, maxHp: 2 }, { attack: 2, maxHp: 3 },
      { attack: 3, maxHp: 3 }, { attack: 3, maxHp: 4 }, { attack: 3, maxHp: 5 }, { attack: 4, maxHp: 5 },
      { attack: 4, maxHp: 6 }, { attack: 5, maxHp: 6 }, { attack: 5, maxHp: 7 }, { attack: 5, maxHp: 8 },
      { attack: 6, maxHp: 8 }, { attack: 6, maxHp: 9 }, { attack: 7, maxHp: 9 }, { attack: 7, maxHp: 10 },
      { attack: 7, maxHp: 10 }, { attack: 8, maxHp: 11 }, { attack: 8, maxHp: 12 }, { attack: 10, maxHp: 14 },
    ],
    [
      undefined, undefined, undefined, undefined,
      'legacy_necro_raise',
      undefined, undefined, undefined, undefined,
      'legacy_necro_plague',
      undefined, undefined, undefined, undefined,
      'legacy_necro_army',
      undefined, undefined, undefined, undefined,
      'legacy_necro_master',
    ],
  ),
};

// ── Revenant: Legacy Fang ──
const REVENANT_LEGACY: LegacyGearDef = {
  classId: 'revenant',
  gearType: 'Fang',
  icon: '\u{1F9B7}',
  levels: buildLevels(
    ['Chipped Fang', 'Blood Fang', 'Deathripper', 'Doom Fang', "Revenant's Fury"],
    ['#b0b0b0', '#ff4444', '#ff2222', '#ff9d17', '#ff2a6d'],
    [
      { attack: 2 }, { attack: 3 }, { attack: 3 }, { attack: 4 },
      { attack: 4, speed: 1 }, { attack: 5, speed: 1 }, { attack: 5, speed: 2 }, { attack: 6, speed: 2 },
      { attack: 6, speed: 2 }, { attack: 7, speed: 3 }, { attack: 7, speed: 3 }, { attack: 8, speed: 3 },
      { attack: 8, speed: 4 }, { attack: 9, speed: 4 }, { attack: 9, speed: 4 }, { attack: 10, speed: 5 },
      { attack: 10, speed: 5 }, { attack: 11, speed: 5 }, { attack: 11, speed: 6 }, { attack: 14, speed: 7 },
    ],
    [
      undefined, undefined, undefined, undefined,
      'legacy_revenant_frenzy',
      undefined, undefined, undefined, undefined,
      'legacy_revenant_defy',
      undefined, undefined, undefined, undefined,
      'legacy_revenant_massacre',
      undefined, undefined, undefined, undefined,
      'legacy_revenant_master',
    ],
  ),
};

// ── Impregnar: Legacy Ovipositor ──
const IMPREGNAR_LEGACY: LegacyGearDef = {
  classId: 'impregnar' as import('./types').PlayerClass,
  gearType: 'Ovipositor',
  icon: '\u{1F41B}',
  levels: buildLevels(
    ['Larval Spike', 'Brood Tendril', 'Hive Stinger', 'Queen\'s Barb', "Impregnar's Swarm"],
    ['#b0b0b0', '#88ff44', '#66cc33', '#ff9d17', '#ff2a6d'],
    [
      { attack: 1, maxHp: 1 }, { attack: 1, maxHp: 2 }, { attack: 2, maxHp: 2 }, { attack: 2, maxHp: 3 },
      { attack: 2, maxHp: 4 }, { attack: 3, maxHp: 4 }, { attack: 3, maxHp: 5 }, { attack: 3, maxHp: 6 },
      { attack: 4, maxHp: 6 }, { attack: 4, maxHp: 7 }, { attack: 4, maxHp: 8 }, { attack: 5, maxHp: 8 },
      { attack: 5, maxHp: 9 }, { attack: 5, maxHp: 10 }, { attack: 6, maxHp: 10 }, { attack: 6, maxHp: 11 },
      { attack: 6, maxHp: 12 }, { attack: 7, maxHp: 12 }, { attack: 7, maxHp: 13 }, { attack: 9, maxHp: 15 },
    ],
    [
      undefined, undefined, undefined, undefined,
      'legacy_impregnar_spawn',
      undefined, undefined, undefined, undefined,
      'legacy_impregnar_toxin',
      undefined, undefined, undefined, undefined,
      'legacy_impregnar_swarm',
      undefined, undefined, undefined, undefined,
      'legacy_impregnar_master',
    ],
  ),
};

const DEATH_KNIGHT_LEGACY: LegacyGearDef = {
  classId: 'death_knight' as import('./types').PlayerClass,
  gearType: 'Runeblade',
  icon: '\u{1F480}',
  levels: buildLevels(
    ['Cracked Runeblade', 'Dark Runeblade', 'Deathforged Blade', 'Soulreaver', "Death Knight's Bane"],
    ['#b0b0b0', '#8844aa', '#aa55cc', '#cc77ee', '#ff2a6d'],
    [
      { attack: 1, defense: 1 }, { attack: 2, defense: 1 }, { attack: 2, defense: 2 }, { attack: 3, defense: 2 },
      { attack: 3, defense: 2, maxHp: 3 }, { attack: 4, defense: 3, maxHp: 3 }, { attack: 4, defense: 3, maxHp: 4 }, { attack: 5, defense: 3, maxHp: 4 },
      { attack: 5, defense: 4, maxHp: 5 }, { attack: 6, defense: 4, maxHp: 5 }, { attack: 6, defense: 4, maxHp: 6 }, { attack: 7, defense: 5, maxHp: 6 },
      { attack: 7, defense: 5, maxHp: 7 }, { attack: 8, defense: 5, maxHp: 7 }, { attack: 8, defense: 6, maxHp: 8 }, { attack: 9, defense: 6, maxHp: 8 },
      { attack: 9, defense: 6, maxHp: 9 }, { attack: 10, defense: 7, maxHp: 9 }, { attack: 10, defense: 7, maxHp: 10 }, { attack: 12, defense: 8, maxHp: 12 },
    ],
    [
      undefined, undefined, undefined, undefined,
      'legacy_dk_drain',
      undefined, undefined, undefined, undefined,
      'legacy_dk_aura',
      undefined, undefined, undefined, undefined,
      'legacy_dk_army',
      undefined, undefined, undefined, undefined,
      'legacy_dk_master',
    ],
  ),
};

// All legacy gear definitions
export const LEGACY_GEAR_DEFS: LegacyGearDef[] = [
  WARRIOR_LEGACY,
  ROGUE_LEGACY,
  MAGE_LEGACY,
  RANGER_LEGACY,
  PALADIN_LEGACY,
  NECROMANCER_LEGACY,
  REVENANT_LEGACY,
  HELLBORN_LEGACY,
  IMPREGNAR_LEGACY,
  DEATH_KNIGHT_LEGACY,
];

// ══════════════════════════════════════════════════════════════
// LEGACY SYSTEM HELPERS
// ══════════════════════════════════════════════════════════════

/** Create default empty legacy data */
export function createDefaultLegacyData(): LegacySystemData {
  return {
    version: 1,
    essenceShards: 0,
    totalShardsEarned: 0,
    gear: [],
  };
}

/** Get legacy gear data for a class (creates if not exists) */
export function getGearForClass(data: LegacySystemData, classId: PlayerClass): LegacyGearData {
  let gear = data.gear.find(g => g.classId === classId);
  if (!gear) {
    gear = { classId, level: 0, shardsInvested: 0, earned: false };
    data.gear.push(gear);
  }
  return gear;
}

/** Get the definition for a class's legacy gear */
export function getGearDef(classId: PlayerClass): LegacyGearDef | undefined {
  return LEGACY_GEAR_DEFS.find(d => d.classId === classId);
}

/** Get cost to level up a legacy gear piece (0 = max level) */
export function getUpgradeCost(gear: LegacyGearData): number {
  const def = getGearDef(gear.classId);
  if (!def || gear.level >= 20) return 0;
  return def.levels[gear.level]?.shardCost ?? 0;
}

/** Get the current level definition for a gear piece */
export function getCurrentLevelDef(gear: LegacyGearData): LegacyGearLevel | undefined {
  if (gear.level === 0) return undefined;
  const def = getGearDef(gear.classId);
  return def?.levels[gear.level - 1];
}

/** Get the NEXT level definition for a gear piece */
export function getNextLevelDef(gear: LegacyGearData): LegacyGearLevel | undefined {
  const def = getGearDef(gear.classId);
  if (!def || gear.level >= 20) return undefined;
  return def.levels[gear.level];
}

/** Get cumulative stats for a gear piece at its current level */
export function getCumulativeStats(gear: LegacyGearData): Partial<Stats> {
  if (gear.level === 0) return {};
  const def = getGearDef(gear.classId);
  if (!def) return {};
  // The stat at the current level IS the cumulative stat (not additive per-level)
  return def.levels[gear.level - 1]?.statBonus ?? {};
}

/** Get all abilities unlocked for a gear piece at its current level */
export function getUnlockedAbilities(gear: LegacyGearData): string[] {
  const def = getGearDef(gear.classId);
  if (!def || gear.level === 0) return [];
  const abilities: string[] = [];
  for (let i = 0; i < gear.level; i++) {
    const lvl = def.levels[i];
    if (lvl?.abilityUnlock) abilities.push(lvl.abilityUnlock);
  }
  return abilities;
}

/** Try to level up a legacy gear piece. Returns true if successful. */
export function tryUpgradeGear(data: LegacySystemData, classId: PlayerClass): boolean {
  const gear = getGearForClass(data, classId);
  if (!gear.earned) return false;
  const cost = getUpgradeCost(gear);
  if (cost <= 0 || data.essenceShards < cost) return false;
  data.essenceShards -= cost;
  gear.shardsInvested += cost;
  gear.level++;
  return true;
}

/** Award essence shards to the player */
export function addEssenceShards(data: LegacySystemData, amount: number): void {
  data.essenceShards += amount;
  data.totalShardsEarned += amount;
}

/** Ensure legacy data exists on bloodline, creating defaults if needed */
export function ensureLegacyData(bloodline: BloodlineData): LegacySystemData {
  if (!bloodline.legacyData) {
    bloodline.legacyData = createDefaultLegacyData();
  }
  return bloodline.legacyData;
}

/** Get the display name of a legacy gear piece at its current level */
export function getGearDisplayName(gear: LegacyGearData): string {
  const lvlDef = getCurrentLevelDef(gear);
  if (!lvlDef) {
    const def = getGearDef(gear.classId);
    return def ? `${def.gearType} (Locked)` : 'Unknown';
  }
  return lvlDef.name;
}

/** Get the display color of a legacy gear piece at its current level */
export function getGearDisplayColor(gear: LegacyGearData): string {
  return getCurrentLevelDef(gear)?.color ?? '#888888';
}

/** Shard drop chance for regular enemies (~1.5%) */
export const SHARD_DROP_CHANCE = 0.015;
/** Shard drop chance for boss kills (guaranteed 1-3) */
export const BOSS_SHARD_MIN = 1;
export const BOSS_SHARD_MAX = 3;
/** Bonus shards every 5th floor */
export const MILESTONE_FLOOR_INTERVAL = 5;
export const MILESTONE_SHARD_AMOUNT = 2;

/** Get total shards needed to max a gear piece from level 0 */
export function getTotalShardsToMax(): number {
  // Sum of all costs: 5+5+8+8+12+12+15+15+20+20+25+25+30+30+35+35+40+40+50+50 = 480
  return 480;
}

/** Create an Item object representing a legacy gear piece for the equipment slot. */
export function createLegacyItem(gear: LegacyGearData): Item | null {
  if (!gear.earned || gear.level === 0) return null;
  const def = getGearDef(gear.classId);
  if (!def) return null;
  const displayName = getGearDisplayName(gear);
  const displayColor = getGearDisplayColor(gear);
  const stats = getCumulativeStats(gear);
  return {
    id: `legacy_${gear.classId}`,
    name: displayName,
    type: 'legacy',
    char: def.icon,
    color: displayColor,
    value: 0,
    equipSlot: 'legacy',
    statBonus: {
      attack: stats.attack ?? 0,
      defense: stats.defense ?? 0,
      maxHp: stats.maxHp ?? 0,
      speed: stats.speed ?? 0,
    },
    description: `${def.classId.charAt(0).toUpperCase() + def.classId.slice(1)}'s Legacy ${def.gearType} (Lv ${gear.level})`,
    rarity: gear.level >= 15 ? 'legendary' : gear.level >= 10 ? 'epic' : gear.level >= 5 ? 'rare' : 'uncommon',
  };
}

/** Legacy ability descriptions for the UI */
export const LEGACY_ABILITY_DESCRIPTIONS: Record<string, { name: string; description: string }> = {
  // Warrior
  legacy_warrior_block: { name: 'Holy Block', description: 'Absorb one hit completely (60 turn cooldown)' },
  legacy_warrior_wall: { name: 'Divine Wall', description: 'Block all damage for 3 turns (90 turn cooldown)' },
  legacy_warrior_reflect: { name: 'Judgment', description: 'Reflect next hit back for 2x damage' },
  legacy_warrior_master: { name: 'Warrior Mastery', description: 'All legacy abilities active at once' },
  // Rogue
  legacy_rogue_evade: { name: 'Shadow Dodge', description: '25% dodge chance for 5 turns' },
  legacy_rogue_crit: { name: 'Fatal Strike', description: 'Next hit is a guaranteed critical (triple damage)' },
  legacy_rogue_vanish: { name: 'Vanish', description: 'Enemies cannot target you for 3 turns' },
  legacy_rogue_master: { name: 'Rogue Mastery', description: 'All legacy abilities active at once' },
  // Mage
  legacy_mage_burst: { name: 'Arcane Burst', description: 'Deal 8 damage to all nearby enemies' },
  legacy_mage_shield: { name: 'Mana Barrier', description: 'Absorb next 15 damage taken' },
  legacy_mage_nova: { name: 'Supernova', description: 'Deal 20 damage to all enemies on screen' },
  legacy_mage_master: { name: 'Mage Mastery', description: 'All legacy abilities active at once' },
  // Ranger
  legacy_ranger_pierce: { name: 'Piercing Shot', description: 'Next hit ignores 50% of enemy defense' },
  legacy_ranger_multi: { name: 'Multi-Shot', description: 'Hit 2 enemies with one attack' },
  legacy_ranger_rain: { name: 'Arrow Rain', description: 'Deal 5 damage to all visible enemies' },
  legacy_ranger_master: { name: 'Ranger Mastery', description: 'All legacy abilities active at once' },
  // Paladin
  legacy_paladin_heal: { name: 'Holy Mend', description: 'Heal 10 HP instantly' },
  legacy_paladin_aura: { name: 'Blessed Aura', description: 'Regenerate 3 HP per turn for 5 turns' },
  legacy_paladin_judgment: { name: 'Divine Judgment', description: 'Deal 12 holy damage to all nearby enemies' },
  legacy_paladin_master: { name: 'Paladin Mastery', description: 'All legacy abilities active at once' },
  // Hellborn
  legacy_hellborn_drain: { name: 'Soul Siphon', description: 'Lifesteal 20% of damage dealt for 5 turns' },
  legacy_hellborn_eruption: { name: 'Hellfire Eruption', description: 'Deal 15 fire damage to all nearby enemies' },
  legacy_hellborn_curse: { name: 'Death Curse', description: 'All enemies take 2 damage per turn for 5 turns' },
  legacy_hellborn_master: { name: 'Hellborn Mastery', description: 'All legacy abilities active at once' },
};
