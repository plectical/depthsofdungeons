import type { MonsterDef, Item, ClassDef, PlayerClass, ChoosableAbility } from './types';

// ── Necropolis Unlock Categories ──

export type UnlockCategory = 'item' | 'enemy' | 'dungeon' | 'class' | 'weapon' | 'armor' | 'zone';

export interface NecropolisUnlock {
  id: string;
  name: string;
  description: string;
  category: UnlockCategory;
  deathsRequired: number;
  icon: string;
  color: string;
}

// ── Communal death state (synced via multiplayer room) ──

export interface NecropolisState {
  communalDeaths: number;
  unlockedIds: string[];
  /** Communal kill counts by monster name (shared across all players) */
  communalKills: Record<string, number>;
  lastUpdated: number;
}

export function createDefaultNecropolisState(): NecropolisState {
  return {
    communalDeaths: 0,
    unlockedIds: [],
    communalKills: {},
    lastUpdated: Date.now(),
  };
}

// ── All Necropolis Unlocks ──
// Players collectively die to unlock new content for everyone

export const NECROPOLIS_UNLOCKS: NecropolisUnlock[] = [
  // ─── WEAPONS (unlocked early to mid) ───
  {
    id: 'weapon_bone_club',
    name: 'Bone Club',
    description: 'Forged from the fallen. +3 attack.',
    category: 'weapon',
    deathsRequired: 5,
    icon: ')',
    color: '#e8d8b8',
  },
  {
    id: 'weapon_soul_reaper',
    name: 'Soul Reaper',
    description: 'Feeds on death energy. +9 attack.',
    category: 'weapon',
    deathsRequired: 50,
    icon: ')',
    color: '#cc44ff',
  },
  {
    id: 'weapon_death_scythe',
    name: "Death's Scythe",
    description: 'The ultimate reaping tool. +17 attack.',
    category: 'weapon',
    deathsRequired: 200,
    icon: ')',
    color: '#ff2222',
  },

  // ─── ARMOR (early to mid) ───
  {
    id: 'armor_bone_mail',
    name: 'Bone Mail',
    description: 'Woven from ancestral bones. +3 defense.',
    category: 'armor',
    deathsRequired: 10,
    icon: '[',
    color: '#d8c8a8',
  },
  {
    id: 'armor_spectral_shroud',
    name: 'Spectral Shroud',
    description: 'Ghosts protect you. +6 defense.',
    category: 'armor',
    deathsRequired: 75,
    icon: '[',
    color: '#aaaaff',
  },
  {
    id: 'armor_necro_plate',
    name: 'Necropolis Plate',
    description: 'Forged in mass sacrifice. +13 defense.',
    category: 'armor',
    deathsRequired: 250,
    icon: '[',
    color: '#8822cc',
  },

  // ─── ITEMS (consumables/accessories) ───
  {
    id: 'item_death_ward',
    name: 'Death Ward',
    description: 'A charm that restores 20 HP when used.',
    category: 'item',
    deathsRequired: 15,
    icon: '"',
    color: '#55ffaa',
  },
  {
    id: 'item_ghost_lantern',
    name: 'Ghost Lantern',
    description: 'See 4 tiles further in darkness.',
    category: 'item',
    deathsRequired: 40,
    icon: '"',
    color: '#88ddff',
  },
  {
    id: 'item_soul_gem',
    name: 'Soul Gem',
    description: '+4 to all stats when equipped.',
    category: 'item',
    deathsRequired: 150,
    icon: '=',
    color: '#ff66dd',
  },

  // ─── ENEMIES (new monsters added to the pool) ───
  {
    id: 'enemy_bone_walker',
    name: 'Bone Walker',
    description: 'Risen from communal graves. Appears on floor 2+.',
    category: 'enemy',
    deathsRequired: 20,
    icon: 'B',
    color: '#e8d8b8',
  },
  {
    id: 'enemy_shade',
    name: 'Shade',
    description: 'A shadow born of many deaths. Floor 4+.',
    category: 'enemy',
    deathsRequired: 60,
    icon: 'H',
    color: '#6644aa',
  },
  {
    id: 'enemy_death_knight',
    name: 'Death Knight',
    description: 'Champion of the Necropolis. Floor 8+.',
    category: 'enemy',
    deathsRequired: 175,
    icon: 'K',
    color: '#cc2255',
  },
  {
    id: 'enemy_lich',
    name: 'Lich',
    description: 'Master of undeath. Floor 11+.',
    category: 'enemy',
    deathsRequired: 350,
    icon: 'L',
    color: '#aa00ff',
  },

  // ─── DUNGEONS (modifiers that change floor generation) ───
  {
    id: 'dungeon_catacombs',
    name: 'The Catacombs',
    description: 'Narrow tunnels with more monsters. Appears as floor variant.',
    category: 'dungeon',
    deathsRequired: 30,
    icon: '#',
    color: '#aa8855',
  },
  {
    id: 'dungeon_ossuary',
    name: 'The Ossuary',
    description: 'Bone-filled halls with extra loot but tougher foes.',
    category: 'dungeon',
    deathsRequired: 100,
    icon: '#',
    color: '#ddbb88',
  },
  {
    id: 'dungeon_void_pit',
    name: 'The Void Pit',
    description: 'A dark abyss. Reduced visibility, powerful enemies.',
    category: 'dungeon',
    deathsRequired: 300,
    icon: '#',
    color: '#4422aa',
  },

  // ─── CLASSES ───
  {
    id: 'class_necromancer',
    name: 'Necromancer',
    description: 'Draws power from the dead. Gains HP on kills.',
    category: 'class',
    deathsRequired: 25,
    icon: '@',
    color: '#aa44dd',
  },
  {
    id: 'class_revenant',
    name: 'Revenant',
    description: 'Came back from death. Starts with low HP but immense attack.',
    category: 'class',
    deathsRequired: 125,
    icon: '@',
    color: '#ff4444',
  },

  // ─── ZONES (entirely new areas that appear after certain floors) ───
  {
    id: 'zone_graveyard',
    name: 'The Graveyard',
    description: 'An open graveyard zone appears every 5 floors. More food, more undead.',
    category: 'zone',
    deathsRequired: 45,
    icon: '+',
    color: '#55aa55',
  },
  {
    id: 'zone_necropolis_depths',
    name: 'Necropolis Depths',
    description: 'The deep Necropolis. Appears after floor 10. Extreme danger, extreme rewards.',
    category: 'zone',
    deathsRequired: 225,
    icon: '+',
    color: '#cc33ff',
  },
  {
    id: 'zone_throne_of_bones',
    name: 'Throne of Bones',
    description: 'The final zone. A boss arena unlocked by massive sacrifice.',
    category: 'zone',
    deathsRequired: 500,
    icon: '+',
    color: '#ff3333',
  },
];

// ── Helper: get unlocked content by current death count ──

export function getUnlockedIds(communalDeaths: number): string[] {
  return NECROPOLIS_UNLOCKS
    .filter((u) => communalDeaths >= u.deathsRequired)
    .map((u) => u.id);
}

export function getNextUnlocks(communalDeaths: number, count = 3): NecropolisUnlock[] {
  return NECROPOLIS_UNLOCKS
    .filter((u) => communalDeaths < u.deathsRequired)
    .sort((a, b) => a.deathsRequired - b.deathsRequired)
    .slice(0, count);
}

export function isUnlocked(id: string, communalDeaths: number): boolean {
  const unlock = NECROPOLIS_UNLOCKS.find((u) => u.id === id);
  return unlock ? communalDeaths >= unlock.deathsRequired : false;
}

// ── Necropolis Monster Definitions ──

export function getNecropolisMonsters(communalDeaths: number): MonsterDef[] {
  const monsters: MonsterDef[] = [];

  if (isUnlocked('enemy_bone_walker', communalDeaths)) {
    monsters.push({
      name: 'Bone Walker',
      char: 'B',
      color: '#e8d8b8',
      stats: { hp: 10, maxHp: 10, attack: 5, defense: 2, speed: 6 },
      xpValue: 12,
      minFloor: 2,
      lootChance: 0.25,
    });
  }

  if (isUnlocked('enemy_shade', communalDeaths)) {
    monsters.push({
      name: 'Shade',
      char: 'H',
      color: '#6644aa',
      stats: { hp: 14, maxHp: 14, attack: 8, defense: 2, speed: 11 },
      xpValue: 28,
      minFloor: 4,
      lootChance: 0.35,
    });
  }

  if (isUnlocked('enemy_death_knight', communalDeaths)) {
    monsters.push({
      name: 'Death Knight',
      char: 'K',
      color: '#cc2255',
      stats: { hp: 35, maxHp: 35, attack: 14, defense: 8, speed: 6 },
      xpValue: 55,
      minFloor: 8,
      lootChance: 0.5,
    });
  }

  if (isUnlocked('enemy_lich', communalDeaths)) {
    monsters.push({
      name: 'Lich',
      char: 'L',
      color: '#aa00ff',
      stats: { hp: 50, maxHp: 50, attack: 20, defense: 8, speed: 8 },
      xpValue: 90,
      minFloor: 11,
      lootChance: 0.55,
    });
  }

  return monsters;
}

// ── Necropolis Weapon Templates ──

export function getNecropolisWeapons(communalDeaths: number): Omit<Item, 'id'>[] {
  const weapons: Omit<Item, 'id'>[] = [];

  if (isUnlocked('weapon_bone_club', communalDeaths)) {
    weapons.push({
      name: 'Bone Club',
      type: 'weapon',
      char: ')',
      color: '#e8d8b8',
      value: 8,
      equipSlot: 'weapon',
      statBonus: { attack: 3 },
      description: 'Forged from the fallen',
    });
  }

  if (isUnlocked('weapon_soul_reaper', communalDeaths)) {
    weapons.push({
      name: 'Soul Reaper',
      type: 'weapon',
      char: ')',
      color: '#cc44ff',
      value: 45,
      equipSlot: 'weapon',
      statBonus: { attack: 9 },
      description: 'Feeds on death energy',
    });
  }

  if (isUnlocked('weapon_death_scythe', communalDeaths)) {
    weapons.push({
      name: "Death's Scythe",
      type: 'weapon',
      char: ')',
      color: '#ff2222',
      value: 95,
      equipSlot: 'weapon',
      statBonus: { attack: 17 },
      description: 'The ultimate reaping tool',
    });
  }

  return weapons;
}

// ── Necropolis Armor Templates ──

export function getNecropolisArmor(communalDeaths: number): Omit<Item, 'id'>[] {
  const armor: Omit<Item, 'id'>[] = [];

  if (isUnlocked('armor_bone_mail', communalDeaths)) {
    armor.push({
      name: 'Bone Mail',
      type: 'armor',
      char: '[',
      color: '#d8c8a8',
      value: 12,
      equipSlot: 'armor',
      statBonus: { defense: 3 },
      description: 'Woven from ancestral bones',
    });
  }

  if (isUnlocked('armor_spectral_shroud', communalDeaths)) {
    armor.push({
      name: 'Spectral Shroud',
      type: 'armor',
      char: '[',
      color: '#aaaaff',
      value: 35,
      equipSlot: 'armor',
      statBonus: { defense: 6 },
      description: 'Ghosts protect you',
    });
  }

  if (isUnlocked('armor_necro_plate', communalDeaths)) {
    armor.push({
      name: 'Necropolis Plate',
      type: 'armor',
      char: '[',
      color: '#8822cc',
      value: 75,
      equipSlot: 'armor',
      statBonus: { defense: 13 },
      description: 'Forged in mass sacrifice',
    });
  }

  return armor;
}

// ── Necropolis Item Templates (consumables / accessories) ──

export function getNecropolisItems(communalDeaths: number): Omit<Item, 'id'>[] {
  const items: Omit<Item, 'id'>[] = [];

  if (isUnlocked('item_death_ward', communalDeaths)) {
    items.push({
      name: 'Death Ward',
      type: 'potion',
      char: '"',
      color: '#55ffaa',
      value: 20,
      description: 'Restores 20 HP',
    });
  }

  if (isUnlocked('item_ghost_lantern', communalDeaths)) {
    items.push({
      name: 'Ghost Lantern',
      type: 'amulet',
      char: '"',
      color: '#88ddff',
      value: 40,
      equipSlot: 'amulet',
      statBonus: { speed: 2 },
      description: 'See further in darkness',
    });
  }

  if (isUnlocked('item_soul_gem', communalDeaths)) {
    items.push({
      name: 'Soul Gem',
      type: 'ring',
      char: '=',
      color: '#ff66dd',
      value: 50,
      equipSlot: 'ring',
      statBonus: { attack: 4, defense: 4, speed: 4 },
      description: '+4 to all stats',
    });
  }

  return items;
}

// ── Necropolis Class Definitions ──

const NECROMANCER_ABILITIES: ChoosableAbility[] = [
  { id: 'nec_corpse_burst', name: 'Corpse Burst', description: 'Kills deal 3 damage to nearby enemies', icon: '\u{1F480}', color: '#aa44dd', minLevel: 2, classId: 'necromancer' },
  { id: 'nec_dark_pact', name: 'Dark Pact', description: '+4 attack permanently, -5 max HP', icon: '\u{1F31A}', color: '#8833cc', minLevel: 3, classId: 'necromancer' },
  { id: 'nec_soul_harvest', name: 'Soul Harvest', description: '+2 HP healed per kill instead of 3', icon: '\u{1F47B}', color: '#cc66ff', minLevel: 4, classId: 'necromancer' },
  { id: 'nec_bone_armor', name: 'Bone Armor', description: '+3 defense permanently', icon: '\u{1F9B4}', color: '#ddddff', minLevel: 3, classId: 'necromancer' },
  { id: 'nec_fear', name: 'Fear Aura', description: '10% chance enemies skip their turn', icon: '\u{1F631}', color: '#7744aa', minLevel: 5, classId: 'necromancer' },
  { id: 'nec_wither', name: 'Wither', description: 'Enemies near you lose 1 defense permanently', icon: '\u{1F342}', color: '#886633', minLevel: 5, classId: 'necromancer' },
];

const REVENANT_ABILITIES: ChoosableAbility[] = [
  { id: 'rev_blood_rage', name: 'Blood Rage', description: '+2 attack for every 10% HP missing', icon: '\u{1FA78}', color: '#ff4444', minLevel: 2, classId: 'revenant' },
  { id: 'rev_undead_vigor', name: 'Undead Vigor', description: '+8 max HP permanently', icon: '\u{2665}', color: '#ff6666', minLevel: 2, classId: 'revenant' },
  { id: 'rev_death_strike', name: 'Death Strike', description: '10% chance to instantly kill non-boss enemies', icon: '\u{2620}', color: '#cc0000', minLevel: 4, classId: 'revenant' },
  { id: 'rev_vengeful', name: 'Vengeful', description: 'Deal double damage for 1 turn after being hit', icon: '\u{1F4A2}', color: '#ff3333', minLevel: 3, classId: 'revenant' },
  { id: 'rev_life_tap', name: 'Life Tap', description: 'Heal 2 HP per turn while below 30% HP', icon: '\u{1F9E1}', color: '#ff8888', minLevel: 5, classId: 'revenant' },
  { id: 'rev_relentless', name: 'Relentless', description: '+5 speed permanently', icon: '\u{1F3C3}', color: '#ff9944', minLevel: 3, classId: 'revenant' },
];

/** Get unlocked Necropolis classes. Checks both communal deaths AND echo tree unlocks. */
export function getNecropolisClasses(communalDeaths: number, echoUnlockedNodes?: string[]): ClassDef[] {
  const classes: ClassDef[] = [];

  // Necromancer: unlocked via communal deaths OR echo tree node 'mas_class_3' (Dark Arts)
  const necroUnlocked = isUnlocked('class_necromancer', communalDeaths) ||
    (echoUnlockedNodes && echoUnlockedNodes.includes('mas_class_3'));
  if (necroUnlocked) {
    classes.push({
      id: 'necromancer' as PlayerClass,
      name: 'Necromancer',
      char: '@',
      color: '#aa44dd',
      description: 'Draws power from the dead. Gains HP on kills.',
      baseStats: { hp: 22, maxHp: 22, attack: 7, defense: 1, speed: 9 },
      levelBonusHp: 4,
      levelBonusAtk: 2,
      levelBonusDef: 1,
      requiresBestFloor: 0,
      passives: [
        { name: 'Life Drain', description: 'Heal 3 HP on every kill', unlockLevel: 1 },
        { name: 'Death Aura', description: 'Nearby enemies take 1 damage per turn', unlockLevel: 3 },
        { name: 'Undying Will', description: 'Survive a fatal blow once per floor with 1 HP', unlockLevel: 6 },
      ],
      abilityPool: NECROMANCER_ABILITIES,
    });
  }

  // Revenant: unlocked via communal deaths OR echo tree node 'mas_class_4' (Deathless)
  const revUnlocked = isUnlocked('class_revenant', communalDeaths) ||
    (echoUnlockedNodes && echoUnlockedNodes.includes('mas_class_4'));
  if (revUnlocked) {
    classes.push({
      id: 'revenant' as PlayerClass,
      name: 'Revenant',
      char: '@',
      color: '#ff4444',
      description: 'Came back from death. Low HP, immense power.',
      baseStats: { hp: 15, maxHp: 15, attack: 12, defense: 2, speed: 10 },
      levelBonusHp: 2,
      levelBonusAtk: 3,
      levelBonusDef: 1,
      requiresBestFloor: 0,
      passives: [
        { name: 'Deathless Fury', description: '+100% damage when below 20% HP', unlockLevel: 1 },
        { name: 'Soul Siphon', description: '10% chance to fully restore HP on kill', unlockLevel: 3 },
        { name: 'Beyond Death', description: 'Start each floor with a free revive', unlockLevel: 6 },
      ],
      abilityPool: REVENANT_ABILITIES,
    });
  }

  return classes;
}

// ── Category labels and colors ──

export const CATEGORY_INFO: Record<UnlockCategory, { label: string; color: string }> = {
  item: { label: 'Items', color: '#55ffaa' },
  enemy: { label: 'Enemies', color: '#ff6644' },
  dungeon: { label: 'Dungeons', color: '#aa8855' },
  class: { label: 'Classes', color: '#aa44dd' },
  weapon: { label: 'Weapons', color: '#ffe44d' },
  armor: { label: 'Armor', color: '#88aaff' },
  zone: { label: 'Zones', color: '#55cc55' },
};

// ══════════════════════════════════════════════════════════════════
// ── BESTIARY BOUNTIES — Community Kill Challenges ──
// Insane kill targets. Shared across all players. Big rewards.
// ══════════════════════════════════════════════════════════════════

export interface BestiaryBounty {
  id: string;
  /** Monster name to kill (must match MONSTER_DEFS name exactly). '_TOTAL_' = all kills combined. */
  monsterName: string;
  /** Number of kills needed across ALL players */
  killsRequired: number;
  /** Flavor text shown before unlocking */
  flavorText: string;
  /** Reward description shown on completion */
  rewardDescription: string;
  /** Reward item */
  rewardItem: Omit<Item, 'id'>;
  /** Display tier (color coding) */
  tier: 'bronze' | 'silver' | 'gold' | 'mythic';
}

export const BOUNTY_TIER_COLORS: Record<string, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  mythic: '#ff44ff',
};

export const BESTIARY_BOUNTIES: BestiaryBounty[] = [
  // ─── BRONZE TIER (Thousands) ───
  {
    id: 'bounty_rat', monsterName: 'Rat', killsRequired: 10_000,
    flavorText: 'The vermin multiply endlessly. Exterminate them.',
    rewardDescription: "Rat King's Tail — +2 speed, +1 attack",
    tier: 'bronze',
    rewardItem: { name: "Rat King's Tail", type: 'ring', char: '=', color: '#c8875a', value: 30, equipSlot: 'ring', statBonus: { speed: 2, attack: 1 }, description: 'Taken from a mountain of rats' },
  },
  {
    id: 'bounty_bat', monsterName: 'Bat', killsRequired: 8_000,
    flavorText: 'Their screeching echoes through every cave. Silence them.',
    rewardDescription: 'Echolocation Amulet — +3 speed',
    tier: 'bronze',
    rewardItem: { name: 'Echolocation Amulet', type: 'amulet', char: '"', color: '#b06840', value: 35, equipSlot: 'amulet', statBonus: { speed: 3 }, description: 'Hear what you cannot see' },
  },
  {
    id: 'bounty_kobold', monsterName: 'Kobold', killsRequired: 15_000,
    flavorText: 'They never stop coming. Neither do we.',
    rewardDescription: 'Kobold War Torch — +4 attack, fire damage',
    tier: 'bronze',
    rewardItem: { name: 'Kobold War Torch', type: 'weapon', char: ')', color: '#ff7b5e', value: 20, equipSlot: 'weapon', element: 'fire', statBonus: { attack: 4 }, description: 'Stolen from 15,000 kobolds', onHitEffect: { type: 'fireball', damage: 3, chance: 0.2 } },
  },
  {
    id: 'bounty_skeleton', monsterName: 'Skeleton', killsRequired: 20_000,
    flavorText: 'Bones upon bones upon bones. Make a throne.',
    rewardDescription: 'Bone Throne Shield — +5 defense',
    tier: 'bronze',
    rewardItem: { name: 'Bone Throne Shield', type: 'armor', char: '[', color: '#e8e8ff', value: 40, equipSlot: 'armor', element: 'dark', statBonus: { defense: 5 }, description: 'Built from 20,000 skeletons' },
  },
  {
    id: 'bounty_goblin', monsterName: 'Goblin', killsRequired: 25_000,
    flavorText: 'The goblin horde stretches to the horizon. Thin it.',
    rewardDescription: "Goblin's Bane — +6 attack, lightning",
    tier: 'bronze',
    rewardItem: { name: "Goblin's Bane", type: 'weapon', char: ')', color: '#50ff50', value: 35, equipSlot: 'weapon', element: 'lightning', statBonus: { attack: 6 }, description: 'Forged in goblin blood' },
  },

  // ─── SILVER TIER (Tens of Thousands) ───
  {
    id: 'bounty_spider', monsterName: 'Giant Spider', killsRequired: 50_000,
    flavorText: 'Fifty thousand webs. Fifty thousand nightmares.',
    rewardDescription: 'Spidersilk Cloak — +7 defense, +3 speed',
    tier: 'silver',
    rewardItem: { name: 'Spidersilk Cloak', type: 'armor', char: '[', color: '#88aa44', value: 55, equipSlot: 'armor', statBonus: { defense: 7, speed: 3 }, description: 'Woven from 50,000 spiders' },
  },
  {
    id: 'bounty_zombie', monsterName: 'Zombie', killsRequired: 40_000,
    flavorText: 'They keep rising. Keep killing.',
    rewardDescription: "Plague Doctor's Mask — +4 defense, +5 HP",
    tier: 'silver',
    rewardItem: { name: "Plague Doctor's Mask", type: 'amulet', char: '"', color: '#a0cc44', value: 50, equipSlot: 'amulet', statBonus: { defense: 4, maxHp: 5 }, description: 'Survived 40,000 zombies' },
  },
  {
    id: 'bounty_orc', monsterName: 'Orc', killsRequired: 60_000,
    flavorText: 'The Orc warband is infinite. Prove them wrong.',
    rewardDescription: 'Orcish Warbreaker — +10 attack, stun',
    tier: 'silver',
    rewardItem: { name: 'Orcish Warbreaker', type: 'weapon', char: ')', color: '#7daa3e', value: 60, equipSlot: 'weapon', element: 'fire', statBonus: { attack: 10 }, description: 'The orcs remember', onHitEffect: { type: 'stun', chance: 0.15 } },
  },
  {
    id: 'bounty_wraith', monsterName: 'Wraith', killsRequired: 35_000,
    flavorText: 'The whispers of 35,000 souls. Silence them all.',
    rewardDescription: "Wraith's Embrace — +8 defense, freezes attackers",
    tier: 'silver',
    rewardItem: { name: "Wraith's Embrace", type: 'armor', char: '[', color: '#c49eff', value: 65, equipSlot: 'armor', element: 'dark', statBonus: { defense: 8 }, description: 'Stitched from spectral cloth', onDefendEffect: { type: 'freeze', chance: 0.12, turns: 1 } },
  },

  // ─── GOLD TIER (Hundred Thousands) ───
  {
    id: 'bounty_demon', monsterName: 'Demon', killsRequired: 100_000,
    flavorText: 'One hundred thousand demons. Hell is running out.',
    rewardDescription: 'Demonbane — +14 attack, fire, burns on hit',
    tier: 'gold',
    rewardItem: { name: 'Demonbane', type: 'weapon', char: ')', color: '#ff3300', value: 80, equipSlot: 'weapon', element: 'fire', statBonus: { attack: 14 }, description: 'Hell itself fears this blade', onHitEffect: { type: 'fireball', damage: 8, chance: 0.3 } },
  },
  {
    id: 'bounty_vampire', monsterName: 'Vampire', killsRequired: 75_000,
    flavorText: 'Drain them before they drain you. All 75,000.',
    rewardDescription: 'Blood Chalice — +5 attack, massive lifesteal',
    tier: 'gold',
    rewardItem: { name: 'Blood Chalice', type: 'ring', char: '=', color: '#cc2244', value: 70, equipSlot: 'ring', element: 'dark', statBonus: { attack: 5 }, description: 'Filled with vampire blood', onHitEffect: { type: 'lifesteal', percent: 25 } },
  },
  {
    id: 'bounty_dragon', monsterName: 'Dragon', killsRequired: 150_000,
    flavorText: 'The ultimate hunt. One hundred fifty thousand dragons.',
    rewardDescription: 'Dragonscale Fortress — +16 def, +15 HP',
    tier: 'gold',
    rewardItem: { name: 'Dragonscale Fortress', type: 'armor', char: '[', color: '#ff5522', value: 100, equipSlot: 'armor', element: 'fire', statBonus: { defense: 16, maxHp: 15 }, description: 'Scales of 150,000 dragons', onDefendEffect: { type: 'fireball', damage: 6, chance: 0.25 } },
  },
  {
    id: 'bounty_troll', monsterName: 'Troll', killsRequired: 80_000,
    flavorText: 'They regenerate. Kill them 80,000 times to be sure.',
    rewardDescription: 'Troll Heart — +10 HP, regen',
    tier: 'gold',
    rewardItem: { name: 'Troll Heart', type: 'amulet', char: '"', color: '#40c880', value: 75, equipSlot: 'amulet', statBonus: { maxHp: 10, hp: 3 }, description: 'Still beating after 80,000 trolls' },
  },

  // ─── MYTHIC TIER (Millions) ───
  {
    id: 'bounty_million_rats', monsterName: 'Rat', killsRequired: 1_000_000,
    flavorText: 'ONE MILLION RATS. The prophecy spoke of this day.',
    rewardDescription: "Rat God's Fang — +20 atk, +5 spd, execute",
    tier: 'mythic',
    rewardItem: { name: "Rat God's Fang", type: 'weapon', char: ')', color: '#ffcc00', value: 200, equipSlot: 'weapon', statBonus: { attack: 20, speed: 5 }, description: 'A million rats died for this', onHitEffect: { type: 'execute', hpThreshold: 0.15, chance: 0.5 } },
  },
  {
    id: 'bounty_lich_emperor', monsterName: 'Lich Emperor', killsRequired: 500_000,
    flavorText: 'Half a million liches. Death itself bows to you.',
    rewardDescription: 'Crown of Infinite Death — +20 def, +20 HP',
    tier: 'mythic',
    rewardItem: { name: 'Crown of Infinite Death', type: 'armor', char: '[', color: '#cc00ff', value: 250, equipSlot: 'armor', element: 'dark', statBonus: { defense: 20, maxHp: 20, attack: 5, speed: 5 }, description: 'The crown of 500,000 liches' },
  },
  {
    id: 'bounty_total', monsterName: '_TOTAL_', killsRequired: 10_000_000,
    flavorText: 'TEN MILLION TOTAL KILLS. Every monster. Every player. Combined.',
    rewardDescription: 'Extinction Blade — +25 atk, instant kill',
    tier: 'mythic',
    rewardItem: { name: 'Extinction Blade', type: 'weapon', char: ')', color: '#ff44ff', value: 999, equipSlot: 'weapon', element: 'dark', statBonus: { attack: 25, speed: 5 }, description: 'Ten million monsters died for this', onHitEffect: { type: 'execute', hpThreshold: 0.2, chance: 0.5 } },
  },
];

/** Check if a bounty is complete given communal kill counts. */
export function isBountyComplete(bounty: BestiaryBounty, communalKills: Record<string, number>): boolean {
  if (bounty.monsterName === '_TOTAL_') {
    const total = Object.values(communalKills).reduce((s, v) => s + v, 0);
    return total >= bounty.killsRequired;
  }
  return (communalKills[bounty.monsterName] ?? 0) >= bounty.killsRequired;
}

/** Get kill progress for a bounty. */
export function getBountyProgress(bounty: BestiaryBounty, communalKills: Record<string, number>): number {
  if (bounty.monsterName === '_TOTAL_') {
    return Object.values(communalKills).reduce((s, v) => s + v, 0);
  }
  return communalKills[bounty.monsterName] ?? 0;
}

/** Get all bounty reward items that are currently unlocked. */
export function getUnlockedBountyItems(communalKills: Record<string, number>): Omit<Item, 'id'>[] {
  const items: Omit<Item, 'id'>[] = [];
  for (const bounty of BESTIARY_BOUNTIES) {
    if (isBountyComplete(bounty, communalKills)) {
      items.push(bounty.rewardItem);
    }
  }
  return items;
}
