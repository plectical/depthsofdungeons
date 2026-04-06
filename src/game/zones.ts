import type { ZoneId, ZoneDef, MonsterDef, Item, TerrainDef } from './types';

// ══════════════════════════════════════════════════════════════
// ZONE DEFINITIONS
// Each zone has unique enemies, items, terrain, bosses, and a
// visual palette. Zones are unlocked by beating specific bosses
// with specific character classes.
// ══════════════════════════════════════════════════════════════

export const ZONE_DEFS: ZoneDef[] = [
  {
    id: 'stone_depths',
    name: 'Stone Depths',
    description: 'The original dungeon. Dark corridors and ancient halls.',
    color: '#33ff66',
    icon: '#',
    unlockRequirements: [], // Always available
    terrainPool: ['water', 'lava', 'poison', 'ice', 'tall_grass', 'mud', 'holy', 'shadow'],
    floorRange: { min: 1, max: 15 },
    palette: {
      wall: '#7a7a9e',
      wallBg: '#14142a',
      floor: '#4a4a5e',
      floorBg: '#0a0a16',
    },
  },
  {
    id: 'frozen_caverns',
    name: 'Frozen Caverns',
    description: 'Icy tunnels where breath freezes. Frost creatures lurk within.',
    color: '#88ddff',
    icon: '*',
    unlockRequirements: [
      { bossName: 'Goblin King', withClass: 'warrior' },
    ],
    terrainPool: ['ice', 'frozen', 'water', 'holy'],
    floorRange: { min: 1, max: 12 },
    palette: {
      wall: '#6688aa',
      wallBg: '#0a1828',
      floor: '#445566',
      floorBg: '#060e18',
    },
  },
  {
    id: 'fungal_marsh',
    name: 'Fungal Marsh',
    description: 'A swampy underground full of toxic spores and strange mushrooms.',
    color: '#44cc22',
    icon: '~',
    unlockRequirements: [
      { bossName: 'Stone Guardian', withClass: 'ranger' },
    ],
    terrainPool: ['poison', 'mud', 'spore', 'mycelium', 'tall_grass', 'water'],
    floorRange: { min: 1, max: 12 },
    palette: {
      wall: '#556644',
      wallBg: '#0a1808',
      floor: '#334422',
      floorBg: '#060e04',
    },
  },
  {
    id: 'infernal_pit',
    name: 'Infernal Pit',
    description: 'Rivers of lava and scorching heat. Demons call this home.',
    color: '#ff5522',
    icon: '!',
    unlockRequirements: [
      { bossName: 'Vampire Lord', withClass: 'mage' },
    ],
    terrainPool: ['lava', 'brimstone', 'shadow', 'holy'],
    floorRange: { min: 1, max: 12 },
    palette: {
      wall: '#8a4422',
      wallBg: '#1a0808',
      floor: '#664422',
      floorBg: '#120604',
    },
  },
  {
    id: 'crystal_sanctum',
    name: 'Crystal Sanctum',
    description: 'Shimmering halls of living crystal. Magic saturates every surface.',
    color: '#cc77ff',
    icon: '+',
    unlockRequirements: [
      { bossName: 'Abyssal Worm', withClass: 'rogue' },
    ],
    terrainPool: ['crystal', 'holy', 'ice', 'water', 'shadow'],
    floorRange: { min: 1, max: 12 },
    palette: {
      wall: '#8866aa',
      wallBg: '#140e22',
      floor: '#665588',
      floorBg: '#0a0816',
    },
  },
  {
    id: 'shadow_realm',
    name: 'Shadow Realm',
    description: 'A dimension of pure darkness. Only the strongest survive.',
    color: '#aa44ff',
    icon: 'V',
    unlockRequirements: [
      { bossName: 'Lich Emperor', withClass: 'necromancer' },
    ],
    terrainPool: ['shadow', 'void_rift', 'poison', 'holy'],
    floorRange: { min: 1, max: 15 },
    palette: {
      wall: '#443366',
      wallBg: '#0a0618',
      floor: '#332244',
      floorBg: '#06040e',
    },
  },
  {
    id: 'hell',
    name: 'Hell',
    description: 'The deepest pit of all. Eternal fire, tormented souls, and demons beyond reckoning.',
    color: '#ff2200',
    icon: '6',
    unlockRequirements: [
      { bossName: 'The Nameless One', withClass: 'paladin' },
    ],
    terrainPool: ['hellfire', 'soul_ash', 'blood_pool', 'lava', 'brimstone', 'shadow'],
    floorRange: { min: 1, max: 20 },
    palette: {
      wall: '#8a1a0a',
      wallBg: '#1a0400',
      floor: '#5a1a0a',
      floorBg: '#0e0200',
    },
  },
  // DEBUG-ONLY ZONE: Narrative testing with AI generation enabled
  {
    id: 'narrative_test',
    name: 'Narrative Depths',
    description: '[DEBUG] Test zone for AI-generated narrative content. Requires login.',
    color: '#ff44ff',
    icon: '?',
    unlockRequirements: [], // Unlocked via debug only
    terrainPool: ['water', 'lava', 'poison', 'shadow', 'holy'],
    floorRange: { min: 1, max: 10 },
    palette: {
      wall: '#664488',
      wallBg: '#140828',
      floor: '#443366',
      floorBg: '#0a0418',
    },
    isDebugZone: true, // Custom flag to identify debug zones
  },
];

// ══════════════════════════════════════════════════════════════
// ZONE-SPECIFIC TERRAIN DEFINITIONS
// New terrain types unique to certain zones
// ══════════════════════════════════════════════════════════════

export const ZONE_TERRAIN_DEFS: TerrainDef[] = [
  { type: 'frozen',    name: 'Permafrost',    color: '#aaeeff', bg: '#081828', glow: '#aaeeff', minFloor: 1 },
  { type: 'spore',     name: 'Spore Cloud',   color: '#88cc44', bg: '#0a1a04', glow: '#88cc44', minFloor: 1 },
  { type: 'brimstone', name: 'Brimstone',     color: '#ff8833', bg: '#2a1000', glow: '#ff8833', minFloor: 1 },
  { type: 'crystal',   name: 'Crystal Floor', color: '#cc88ff', bg: '#14082a', glow: '#cc88ff', minFloor: 1 },
  { type: 'void_rift', name: 'Void Rift',     color: '#7733cc', bg: '#08041a', glow: '#7733cc', minFloor: 1 },
  { type: 'mycelium',  name: 'Mycelium',      color: '#aa8844', bg: '#141004', glow: '#aa8844', minFloor: 1 },
  { type: 'hellfire',  name: 'Hellfire',      color: '#ff4400', bg: '#2a0800', glow: '#ff4400', minFloor: 1 },
  { type: 'soul_ash',  name: 'Soul Ash',      color: '#888888', bg: '#1a1a1a', glow: '#888888', minFloor: 1 },
  { type: 'blood_pool',name: 'Blood Pool',    color: '#cc0022', bg: '#1a0004', glow: '#cc0022', minFloor: 1 },
];

// ══════════════════════════════════════════════════════════════
// ZONE-SPECIFIC MONSTERS
// ══════════════════════════════════════════════════════════════

export const ZONE_MONSTERS: Record<ZoneId, MonsterDef[]> = {
  stone_depths: [], // Uses base monsters from constants.ts

  frozen_caverns: [
    { name: 'Ice Sprite', char: 'i', color: '#aaeeff', element: 'ice', stats: { hp: 6, maxHp: 6, attack: 3, defense: 1, speed: 12 }, xpValue: 7, minFloor: 1, lootChance: 0.1,
      abilities: [{ type: 'freezeAttack', chance: 0.2, turns: 1 }] },
    { name: 'Snow Fox', char: 'f', color: '#ccddee', stats: { hp: 5, maxHp: 5, attack: 3, defense: 0, speed: 14 }, xpValue: 6, minFloor: 1, lootChance: 0.08,
      abilities: [{ type: 'dodge', chance: 0.3 }] },
    { name: 'Frost Wolf', char: 'w', color: '#88ccee', stats: { hp: 12, maxHp: 12, attack: 6, defense: 2, speed: 10 }, xpValue: 15, minFloor: 2, lootChance: 0.2,
      abilities: [{ type: 'chargeAttack', multiplier: 1.5, chance: 0.25 }, { type: 'callForHelp', monsterName: 'Frost Wolf', chance: 0.15, cooldown: 8 }] },
    { name: 'Icicle Bat', char: 'b', color: '#99ccee', element: 'ice', stats: { hp: 7, maxHp: 7, attack: 4, defense: 0, speed: 13 }, xpValue: 8, minFloor: 2, lootChance: 0.1,
      abilities: [{ type: 'freezeAttack', chance: 0.15, turns: 1 }, { type: 'dodge', chance: 0.2 }] },
    { name: 'Yeti Cub', char: 'y', color: '#ddeeff', stats: { hp: 16, maxHp: 16, attack: 7, defense: 3, speed: 6 }, xpValue: 18, minFloor: 3, lootChance: 0.25,
      abilities: [{ type: 'callForHelp', monsterName: 'Yeti', chance: 0.15, cooldown: 8 }] },
    { name: 'Permafrost Beetle', char: 'c', color: '#6699bb', element: 'ice', stats: { hp: 14, maxHp: 14, attack: 5, defense: 6, speed: 4 }, xpValue: 14, minFloor: 3, lootChance: 0.2,
      abilities: [{ type: 'freezeAttack', chance: 0.2, turns: 1 }] },
    { name: 'Ice Golem', char: 'G', color: '#99ddff', element: 'ice', stats: { hp: 30, maxHp: 30, attack: 8, defense: 10, speed: 3 }, xpValue: 35, minFloor: 4, lootChance: 0.35,
      abilities: [{ type: 'freezeAttack', chance: 0.2, turns: 2 }, { type: 'selfHeal', amount: 5, hpThreshold: 0.4, cooldown: 5 }] },
    { name: 'Blizzard Wraith', char: 'W', color: '#bbddff', element: 'ice', stats: { hp: 22, maxHp: 22, attack: 12, defense: 3, speed: 13 }, xpValue: 40, minFloor: 5, lootChance: 0.35,
      abilities: [{ type: 'freezeAttack', chance: 0.3, turns: 2 }, { type: 'dodge', chance: 0.2 }] },
    { name: 'Yeti', char: 'Y', color: '#bbccdd', stats: { hp: 38, maxHp: 38, attack: 12, defense: 6, speed: 5 }, xpValue: 42, minFloor: 5, lootChance: 0.35,
      abilities: [{ type: 'chargeAttack', multiplier: 1.8, chance: 0.2 }, { type: 'enrage', hpThreshold: 0.3, atkMultiplier: 1.5 }] },
    { name: 'Glacial Basilisk', char: 'B', color: '#77bbdd', element: 'ice', stats: { hp: 35, maxHp: 35, attack: 10, defense: 6, speed: 7 }, xpValue: 45, minFloor: 6, lootChance: 0.35,
      abilities: [{ type: 'stunAttack', chance: 0.2 }, { type: 'freezeAttack', chance: 0.2, turns: 2 }] },
    { name: 'Frost Giant', char: 'F', color: '#6699cc', stats: { hp: 45, maxHp: 45, attack: 14, defense: 8, speed: 4 }, xpValue: 55, minFloor: 6, lootChance: 0.4,
      abilities: [{ type: 'chargeAttack', multiplier: 2.0, chance: 0.15 }, { type: 'stunAttack', chance: 0.15 }] },
    { name: 'Avalanche Worm', char: 'A', color: '#5599cc', stats: { hp: 40, maxHp: 40, attack: 11, defense: 7, speed: 4 }, xpValue: 48, minFloor: 7, lootChance: 0.4,
      abilities: [{ type: 'stunAttack', chance: 0.2 }, { type: 'chargeAttack', multiplier: 1.6, chance: 0.2 }] },
    { name: 'Frozen Revenant', char: 'R', color: '#5588bb', stats: { hp: 55, maxHp: 55, attack: 16, defense: 10, speed: 5 }, xpValue: 70, minFloor: 8, lootChance: 0.45,
      abilities: [{ type: 'enrage', hpThreshold: 0.25, atkMultiplier: 1.8 }, { type: 'selfHeal', amount: 8, hpThreshold: 0.3, cooldown: 6 }] },
    { name: 'Frost Titan', char: 'T', color: '#4477aa', element: 'ice', stats: { hp: 65, maxHp: 65, attack: 18, defense: 12, speed: 3 }, xpValue: 80, minFloor: 9, lootChance: 0.5,
      abilities: [{ type: 'freezeAttack', chance: 0.25, turns: 3 }, { type: 'chargeAttack', multiplier: 2.0, chance: 0.15 }, { type: 'enrage', hpThreshold: 0.2, atkMultiplier: 1.8 }] },
  ],

  fungal_marsh: [
    { name: 'Spore Rat', char: 'r', color: '#88aa44', element: 'poison', stats: { hp: 7, maxHp: 7, attack: 3, defense: 0, speed: 9 }, xpValue: 6, minFloor: 1, lootChance: 0.15,
      abilities: [{ type: 'poisonAttack', damage: 1, turns: 3, chance: 0.2 }] },
    { name: 'Marsh Frog', char: 'f', color: '#44aa33', stats: { hp: 5, maxHp: 5, attack: 2, defense: 1, speed: 10 }, xpValue: 5, minFloor: 1, lootChance: 0.1,
      abilities: [{ type: 'dodge', chance: 0.2 }] },
    { name: 'Mushroom Man', char: 'm', color: '#66cc44', element: 'poison', stats: { hp: 14, maxHp: 14, attack: 5, defense: 3, speed: 5 }, xpValue: 14, minFloor: 2, lootChance: 0.25,
      abilities: [{ type: 'poisonAttack', damage: 1, turns: 4, chance: 0.3 }, { type: 'selfHeal', amount: 3, hpThreshold: 0.5, cooldown: 4 }] },
    { name: 'Swamp Leech', char: 'l', color: '#556633', element: 'dark', stats: { hp: 8, maxHp: 8, attack: 4, defense: 0, speed: 7 }, xpValue: 8, minFloor: 2, lootChance: 0.15,
      abilities: [{ type: 'drainLife', percent: 30, chance: 0.3 }] },
    { name: 'Bog Toad', char: 't', color: '#557733', stats: { hp: 20, maxHp: 20, attack: 7, defense: 4, speed: 6 }, xpValue: 22, minFloor: 3, lootChance: 0.3,
      abilities: [{ type: 'stunAttack', chance: 0.15 }, { type: 'chargeAttack', multiplier: 1.5, chance: 0.2 }] },
    { name: 'Mold Crawler', char: 'c', color: '#77aa33', element: 'poison', stats: { hp: 12, maxHp: 12, attack: 5, defense: 4, speed: 3 }, xpValue: 12, minFloor: 3, lootChance: 0.2,
      abilities: [{ type: 'poisonAttack', damage: 1, turns: 5, chance: 0.35 }, { type: 'selfHeal', amount: 3, hpThreshold: 0.6, cooldown: 3 }] },
    { name: 'Vine Strangler', char: 'v', color: '#339922', stats: { hp: 18, maxHp: 18, attack: 9, defense: 2, speed: 8 }, xpValue: 25, minFloor: 4, lootChance: 0.3,
      abilities: [{ type: 'bleedAttack', damage: 2, turns: 3, chance: 0.3 }, { type: 'stunAttack', chance: 0.15 }] },
    { name: 'Toxic Toad', char: 'T', color: '#66aa22', element: 'poison', stats: { hp: 25, maxHp: 25, attack: 8, defense: 5, speed: 5 }, xpValue: 28, minFloor: 4, lootChance: 0.3,
      abilities: [{ type: 'poisonAttack', damage: 2, turns: 4, chance: 0.35 }] },
    { name: 'Spore Mother', char: 'S', color: '#aacc66', element: 'poison', stats: { hp: 40, maxHp: 40, attack: 6, defense: 5, speed: 3 }, xpValue: 45, minFloor: 5, lootChance: 0.4,
      abilities: [{ type: 'callForHelp', monsterName: 'Spore Rat', chance: 0.25, cooldown: 5 }, { type: 'poisonAttack', damage: 2, turns: 4, chance: 0.35 }] },
    { name: 'Rot Elemental', char: 'E', color: '#557711', element: 'poison', stats: { hp: 35, maxHp: 35, attack: 11, defense: 5, speed: 6 }, xpValue: 50, minFloor: 6, lootChance: 0.4,
      abilities: [{ type: 'poisonAttack', damage: 3, turns: 5, chance: 0.3 }, { type: 'drainLife', percent: 15, chance: 0.2 }] },
    { name: 'Fungal Hydra', char: 'H', color: '#88cc33', element: 'poison', stats: { hp: 45, maxHp: 45, attack: 10, defense: 6, speed: 4 }, xpValue: 52, minFloor: 6, lootChance: 0.4,
      abilities: [{ type: 'selfHeal', amount: 7, hpThreshold: 0.5, cooldown: 3 }, { type: 'poisonAttack', damage: 2, turns: 4, chance: 0.25 }] },
    { name: 'Plague Troll', char: 'P', color: '#448822', stats: { hp: 50, maxHp: 50, attack: 13, defense: 7, speed: 4 }, xpValue: 60, minFloor: 7, lootChance: 0.45,
      abilities: [{ type: 'selfHeal', amount: 8, hpThreshold: 0.5, cooldown: 4 }, { type: 'enrage', hpThreshold: 0.3, atkMultiplier: 1.6 }] },
    { name: 'Blight Lord', char: 'B', color: '#335511', element: 'poison', stats: { hp: 55, maxHp: 55, attack: 15, defense: 8, speed: 5 }, xpValue: 70, minFloor: 8, lootChance: 0.5,
      abilities: [{ type: 'poisonAttack', damage: 4, turns: 5, chance: 0.35 }, { type: 'callForHelp', monsterName: 'Mushroom Man', chance: 0.15, cooldown: 7 }, { type: 'selfHeal', amount: 10, hpThreshold: 0.3, cooldown: 6 }] },
  ],

  infernal_pit: [
    { name: 'Fire Imp', char: 'i', color: '#ff8844', element: 'fire', stats: { hp: 8, maxHp: 8, attack: 5, defense: 0, speed: 11 }, xpValue: 8, minFloor: 1, lootChance: 0.1,
      abilities: [{ type: 'dodge', chance: 0.2 }] },
    { name: 'Cinder Beetle', char: 'c', color: '#dd6633', stats: { hp: 6, maxHp: 6, attack: 3, defense: 3, speed: 6 }, xpValue: 6, minFloor: 1, lootChance: 0.1 },
    { name: 'Lava Hound', char: 'h', color: '#ff5522', element: 'fire', stats: { hp: 16, maxHp: 16, attack: 8, defense: 3, speed: 8 }, xpValue: 18, minFloor: 2, lootChance: 0.2,
      abilities: [{ type: 'chargeAttack', multiplier: 1.6, chance: 0.25 }, { type: 'enrage', hpThreshold: 0.3, atkMultiplier: 1.5 }] },
    { name: 'Flame Wisp', char: 'w', color: '#ffaa44', element: 'fire', stats: { hp: 10, maxHp: 10, attack: 7, defense: 0, speed: 14 }, xpValue: 12, minFloor: 2, lootChance: 0.15,
      abilities: [{ type: 'dodge', chance: 0.3 }] },
    { name: 'Infernal Soldier', char: 's', color: '#cc3311', stats: { hp: 25, maxHp: 25, attack: 10, defense: 5, speed: 7 }, xpValue: 30, minFloor: 3, lootChance: 0.3,
      abilities: [{ type: 'bleedAttack', damage: 2, turns: 3, chance: 0.25 }] },
    { name: 'Ember Snake', char: 'S', color: '#ff7744', stats: { hp: 14, maxHp: 14, attack: 8, defense: 1, speed: 12 }, xpValue: 16, minFloor: 3, lootChance: 0.2,
      abilities: [{ type: 'poisonAttack', damage: 1, turns: 3, chance: 0.25 }] },
    { name: 'Ash Phantom', char: 'A', color: '#aa5533', stats: { hp: 20, maxHp: 20, attack: 11, defense: 2, speed: 14 }, xpValue: 35, minFloor: 4, lootChance: 0.3,
      abilities: [{ type: 'dodge', chance: 0.3 }, { type: 'chargeAttack', multiplier: 1.5, chance: 0.2 }] },
    { name: 'Hellfire Drake', char: 'D', color: '#ff4400', element: 'fire', stats: { hp: 40, maxHp: 40, attack: 15, defense: 6, speed: 8 }, xpValue: 55, minFloor: 5, lootChance: 0.4,
      abilities: [{ type: 'chargeAttack', multiplier: 1.8, chance: 0.2 }, { type: 'enrage', hpThreshold: 0.2, atkMultiplier: 2.0 }] },
    { name: 'Magma Golem', char: 'G', color: '#ff6622', element: 'fire', stats: { hp: 55, maxHp: 55, attack: 12, defense: 14, speed: 2 }, xpValue: 60, minFloor: 6, lootChance: 0.4,
      abilities: [{ type: 'selfHeal', amount: 8, hpThreshold: 0.4, cooldown: 5 }, { type: 'chargeAttack', multiplier: 2.0, chance: 0.1 }] },
    { name: 'Infernal Knight', char: 'K', color: '#dd2211', stats: { hp: 35, maxHp: 35, attack: 14, defense: 8, speed: 6 }, xpValue: 52, minFloor: 6, lootChance: 0.4,
      abilities: [{ type: 'bleedAttack', damage: 2, turns: 4, chance: 0.25 }, { type: 'enrage', hpThreshold: 0.25, atkMultiplier: 1.5 }] },
    { name: 'Balrog', char: 'B', color: '#ff1100', element: 'fire', stats: { hp: 60, maxHp: 60, attack: 18, defense: 9, speed: 7 }, xpValue: 75, minFloor: 7, lootChance: 0.45,
      abilities: [{ type: 'chargeAttack', multiplier: 2.0, chance: 0.2 }, { type: 'enrage', hpThreshold: 0.2, atkMultiplier: 1.8 }] },
    { name: 'Pit Fiend', char: 'P', color: '#cc0000', element: 'fire', stats: { hp: 50, maxHp: 50, attack: 18, defense: 8, speed: 9 }, xpValue: 75, minFloor: 8, lootChance: 0.5,
      abilities: [{ type: 'drainLife', percent: 20, chance: 0.25 }, { type: 'stunAttack', chance: 0.15 }, { type: 'enrage', hpThreshold: 0.25, atkMultiplier: 1.7 }] },
    { name: 'Inferno Titan', char: 'T', color: '#ff3300', element: 'fire', stats: { hp: 70, maxHp: 70, attack: 20, defense: 11, speed: 4 }, xpValue: 85, minFloor: 9, lootChance: 0.5,
      abilities: [{ type: 'chargeAttack', multiplier: 2.0, chance: 0.15 }, { type: 'selfHeal', amount: 10, hpThreshold: 0.3, cooldown: 6 }, { type: 'enrage', hpThreshold: 0.2, atkMultiplier: 2.0 }] },
  ],

  crystal_sanctum: [
    { name: 'Crystal Mite', char: 'c', color: '#cc99ff', stats: { hp: 6, maxHp: 6, attack: 4, defense: 3, speed: 10 }, xpValue: 8, minFloor: 1, lootChance: 0.15,
      abilities: [{ type: 'dodge', chance: 0.15 }] },
    { name: 'Prism Bat', char: 'b', color: '#ee88ff', element: 'lightning', stats: { hp: 8, maxHp: 8, attack: 6, defense: 1, speed: 13 }, xpValue: 10, minFloor: 1, lootChance: 0.1,
      abilities: [{ type: 'dodge', chance: 0.25 }, { type: 'stunAttack', chance: 0.1 }] },
    { name: 'Shard Sprite', char: 's', color: '#dd99ee', stats: { hp: 5, maxHp: 5, attack: 5, defense: 2, speed: 14 }, xpValue: 7, minFloor: 1, lootChance: 0.1,
      abilities: [{ type: 'dodge', chance: 0.3 }] },
    { name: 'Crystal Spider', char: 'S', color: '#bb77dd', element: 'lightning', stats: { hp: 12, maxHp: 12, attack: 7, defense: 3, speed: 10 }, xpValue: 14, minFloor: 2, lootChance: 0.2,
      abilities: [{ type: 'stunAttack', chance: 0.15 }] },
    { name: 'Arcane Sentinel', char: 'A', color: '#aa66ee', element: 'lightning', stats: { hp: 28, maxHp: 28, attack: 10, defense: 8, speed: 5 }, xpValue: 35, minFloor: 3, lootChance: 0.3,
      abilities: [{ type: 'stunAttack', chance: 0.2 }, { type: 'selfHeal', amount: 5, hpThreshold: 0.4, cooldown: 5 }] },
    { name: 'Mana Wraith', char: 'M', color: '#9966dd', stats: { hp: 16, maxHp: 16, attack: 10, defense: 2, speed: 11 }, xpValue: 28, minFloor: 3, lootChance: 0.25,
      abilities: [{ type: 'drainLife', percent: 20, chance: 0.25 }, { type: 'dodge', chance: 0.2 }] },
    { name: 'Spell Weaver', char: 'W', color: '#9955cc', stats: { hp: 22, maxHp: 22, attack: 14, defense: 3, speed: 11 }, xpValue: 40, minFloor: 4, lootChance: 0.35,
      abilities: [{ type: 'dodge', chance: 0.2 }, { type: 'drainLife', percent: 15, chance: 0.2 }] },
    { name: 'Gem Elemental', char: 'E', color: '#dd88ff', stats: { hp: 35, maxHp: 35, attack: 12, defense: 10, speed: 4 }, xpValue: 45, minFloor: 5, lootChance: 0.4,
      abilities: [{ type: 'chargeAttack', multiplier: 1.8, chance: 0.15 }, { type: 'selfHeal', amount: 6, hpThreshold: 0.3, cooldown: 6 }] },
    { name: 'Living Crystal', char: 'L', color: '#ff99ee', element: 'lightning', stats: { hp: 60, maxHp: 60, attack: 10, defense: 15, speed: 2 }, xpValue: 55, minFloor: 6, lootChance: 0.4,
      abilities: [{ type: 'selfHeal', amount: 10, hpThreshold: 0.5, cooldown: 4 }, { type: 'stunAttack', chance: 0.15 }] },
    { name: 'Prismatic Golem', char: 'G', color: '#cc77ee', stats: { hp: 50, maxHp: 50, attack: 11, defense: 13, speed: 3 }, xpValue: 52, minFloor: 6, lootChance: 0.4,
      abilities: [{ type: 'freezeAttack', chance: 0.15, turns: 1 }, { type: 'selfHeal', amount: 7, hpThreshold: 0.4, cooldown: 5 }] },
    { name: 'Crystal Dragon', char: 'D', color: '#bb55ff', stats: { hp: 50, maxHp: 50, attack: 16, defense: 9, speed: 7 }, xpValue: 65, minFloor: 7, lootChance: 0.45,
      abilities: [{ type: 'freezeAttack', chance: 0.2, turns: 2 }, { type: 'chargeAttack', multiplier: 2.0, chance: 0.15 }, { type: 'enrage', hpThreshold: 0.2, atkMultiplier: 1.8 }] },
    { name: 'Arcane Colossus', char: 'C', color: '#aa44dd', element: 'lightning', stats: { hp: 65, maxHp: 65, attack: 15, defense: 12, speed: 3 }, xpValue: 72, minFloor: 8, lootChance: 0.5,
      abilities: [{ type: 'stunAttack', chance: 0.2 }, { type: 'selfHeal', amount: 10, hpThreshold: 0.3, cooldown: 5 }, { type: 'enrage', hpThreshold: 0.2, atkMultiplier: 1.7 }] },
  ],

  shadow_realm: [
    { name: 'Shadow Wisp', char: 'w', color: '#7744aa', stats: { hp: 8, maxHp: 8, attack: 6, defense: 0, speed: 14 }, xpValue: 10, minFloor: 1, lootChance: 0.1,
      abilities: [{ type: 'dodge', chance: 0.3 }] },
    { name: 'Dark Tendril', char: 't', color: '#5522aa', element: 'dark', stats: { hp: 6, maxHp: 6, attack: 4, defense: 1, speed: 10 }, xpValue: 7, minFloor: 1, lootChance: 0.1,
      abilities: [{ type: 'bleedAttack', damage: 1, turns: 2, chance: 0.2 }] },
    { name: 'Void Stalker', char: 's', color: '#5533aa', stats: { hp: 18, maxHp: 18, attack: 10, defense: 3, speed: 11 }, xpValue: 25, minFloor: 2, lootChance: 0.25,
      abilities: [{ type: 'chargeAttack', multiplier: 1.6, chance: 0.25 }, { type: 'dodge', chance: 0.2 }] },
    { name: 'Shade Wolf', char: 'W', color: '#6633bb', stats: { hp: 14, maxHp: 14, attack: 8, defense: 2, speed: 13 }, xpValue: 18, minFloor: 2, lootChance: 0.2,
      abilities: [{ type: 'chargeAttack', multiplier: 1.5, chance: 0.3 }, { type: 'callForHelp', monsterName: 'Shade Wolf', chance: 0.1, cooldown: 8 }] },
    { name: 'Gloom Spider', char: 'S', color: '#7733bb', stats: { hp: 16, maxHp: 16, attack: 9, defense: 2, speed: 11 }, xpValue: 22, minFloor: 3, lootChance: 0.25,
      abilities: [{ type: 'poisonAttack', damage: 2, turns: 3, chance: 0.25 }, { type: 'dodge', chance: 0.2 }] },
    { name: 'Nightmare', char: 'N', color: '#8844cc', element: 'dark', stats: { hp: 30, maxHp: 30, attack: 14, defense: 4, speed: 10 }, xpValue: 40, minFloor: 4, lootChance: 0.35,
      abilities: [{ type: 'stunAttack', chance: 0.2 }, { type: 'drainLife', percent: 15, chance: 0.2 }] },
    { name: 'Soul Devourer', char: 'D', color: '#9944ee', element: 'dark', stats: { hp: 35, maxHp: 35, attack: 16, defense: 5, speed: 12 }, xpValue: 55, minFloor: 5, lootChance: 0.4,
      abilities: [{ type: 'drainLife', percent: 25, chance: 0.3 }, { type: 'dodge', chance: 0.15 }] },
    { name: 'Abyssal Horror', char: 'H', color: '#6622bb', element: 'dark', stats: { hp: 45, maxHp: 45, attack: 18, defense: 6, speed: 7 }, xpValue: 60, minFloor: 6, lootChance: 0.45,
      abilities: [{ type: 'bleedAttack', damage: 3, turns: 4, chance: 0.25 }, { type: 'enrage', hpThreshold: 0.3, atkMultiplier: 1.7 }] },
    { name: 'Shadow Reaver', char: 'R', color: '#5511aa', element: 'dark', stats: { hp: 30, maxHp: 30, attack: 16, defense: 3, speed: 13 }, xpValue: 52, minFloor: 6, lootChance: 0.4,
      abilities: [{ type: 'bleedAttack', damage: 2, turns: 4, chance: 0.3 }, { type: 'dodge', chance: 0.25 }] },
    { name: 'Void Titan', char: 'T', color: '#4411aa', stats: { hp: 70, maxHp: 70, attack: 20, defense: 12, speed: 4 }, xpValue: 80, minFloor: 8, lootChance: 0.5,
      abilities: [{ type: 'chargeAttack', multiplier: 2.0, chance: 0.15 }, { type: 'selfHeal', amount: 12, hpThreshold: 0.3, cooldown: 6 }, { type: 'enrage', hpThreshold: 0.2, atkMultiplier: 2.0 }] },
    { name: 'Entropy Worm', char: 'E', color: '#7722dd', element: 'dark', stats: { hp: 55, maxHp: 55, attack: 22, defense: 8, speed: 5 }, xpValue: 70, minFloor: 9, lootChance: 0.5,
      abilities: [{ type: 'bleedAttack', damage: 4, turns: 5, chance: 0.3 }, { type: 'poisonAttack', damage: 3, turns: 4, chance: 0.25 }] },
    { name: 'Void Lord', char: 'V', color: '#3300aa', element: 'dark', stats: { hp: 60, maxHp: 60, attack: 22, defense: 10, speed: 8 }, xpValue: 90, minFloor: 9, lootChance: 0.5,
      abilities: [{ type: 'drainLife', percent: 25, chance: 0.3 }, { type: 'stunAttack', chance: 0.2 }, { type: 'enrage', hpThreshold: 0.2, atkMultiplier: 2.0 }] },
  ],

  hell: [
    // Floor 1-2: Lesser damned
    { name: 'Damned Soul', char: 's', color: '#aa4444', element: 'fire', stats: { hp: 15, maxHp: 15, attack: 8, defense: 2, speed: 10 }, xpValue: 15, minFloor: 1, lootChance: 0.1,
      abilities: [{ type: 'drainLife', percent: 15, chance: 0.2 }] },
    { name: 'Hellhound', char: 'h', color: '#ff4422', element: 'fire', stats: { hp: 20, maxHp: 20, attack: 12, defense: 3, speed: 14 }, xpValue: 22, minFloor: 1, lootChance: 0.15,
      abilities: [{ type: 'chargeAttack', multiplier: 1.8, chance: 0.3 }, { type: 'callForHelp', monsterName: 'Hellhound', chance: 0.15, cooldown: 6 }] },
    { name: 'Sin Eater', char: 'e', color: '#cc3333', element: 'dark', stats: { hp: 18, maxHp: 18, attack: 10, defense: 1, speed: 11 }, xpValue: 18, minFloor: 1, lootChance: 0.12,
      abilities: [{ type: 'drainLife', percent: 25, chance: 0.3 }, { type: 'dodge', chance: 0.2 }] },
    // Floor 2-3: Soldiers of Hell
    { name: 'Torment Fiend', char: 'f', color: '#dd2211', element: 'fire', stats: { hp: 30, maxHp: 30, attack: 14, defense: 5, speed: 9 }, xpValue: 35, minFloor: 2, lootChance: 0.2,
      abilities: [{ type: 'bleedAttack', damage: 3, turns: 4, chance: 0.3 }, { type: 'stunAttack', chance: 0.15 }] },
    { name: 'Bone Devil', char: 'd', color: '#ccaa88', stats: { hp: 35, maxHp: 35, attack: 15, defense: 7, speed: 8 }, xpValue: 40, minFloor: 2, lootChance: 0.25,
      abilities: [{ type: 'chargeAttack', multiplier: 1.6, chance: 0.2 }, { type: 'bleedAttack', damage: 2, turns: 3, chance: 0.25 }] },
    // Floor 3-5: Greater demons
    { name: 'Blood Wraith', char: 'W', color: '#cc0022', element: 'dark', stats: { hp: 40, maxHp: 40, attack: 18, defense: 4, speed: 13 }, xpValue: 55, minFloor: 3, lootChance: 0.3,
      abilities: [{ type: 'drainLife', percent: 30, chance: 0.35 }, { type: 'dodge', chance: 0.25 }] },
    { name: 'Chain Devil', char: 'C', color: '#996644', stats: { hp: 50, maxHp: 50, attack: 16, defense: 10, speed: 6 }, xpValue: 60, minFloor: 3, lootChance: 0.3,
      abilities: [{ type: 'stunAttack', chance: 0.25 }, { type: 'bleedAttack', damage: 3, turns: 5, chance: 0.3 }] },
    { name: 'Hellfire Elemental', char: 'E', color: '#ff5500', element: 'fire', stats: { hp: 45, maxHp: 45, attack: 20, defense: 6, speed: 10 }, xpValue: 65, minFloor: 4, lootChance: 0.35,
      abilities: [{ type: 'chargeAttack', multiplier: 2.0, chance: 0.2 }, { type: 'enrage', hpThreshold: 0.3, atkMultiplier: 1.8 }] },
    // Floor 5-8: Hell's elite
    { name: 'Pit Lord', char: 'P', color: '#cc0000', element: 'fire', stats: { hp: 70, maxHp: 70, attack: 24, defense: 12, speed: 7 }, xpValue: 85, minFloor: 5, lootChance: 0.4,
      abilities: [{ type: 'chargeAttack', multiplier: 2.0, chance: 0.2 }, { type: 'enrage', hpThreshold: 0.25, atkMultiplier: 2.0 }, { type: 'callForHelp', monsterName: 'Torment Fiend', chance: 0.1, cooldown: 8 }] },
    { name: 'Soul Reaper', char: 'R', color: '#aa0000', element: 'dark', stats: { hp: 55, maxHp: 55, attack: 26, defense: 6, speed: 14 }, xpValue: 90, minFloor: 6, lootChance: 0.4,
      abilities: [{ type: 'drainLife', percent: 30, chance: 0.3 }, { type: 'dodge', chance: 0.2 }, { type: 'bleedAttack', damage: 4, turns: 5, chance: 0.25 }] },
    { name: 'Brimstone Golem', char: 'G', color: '#ff6600', element: 'fire', stats: { hp: 90, maxHp: 90, attack: 20, defense: 18, speed: 2 }, xpValue: 95, minFloor: 7, lootChance: 0.45,
      abilities: [{ type: 'selfHeal', amount: 15, hpThreshold: 0.4, cooldown: 5 }, { type: 'chargeAttack', multiplier: 2.5, chance: 0.1 }] },
    // Floor 8-12: Archdemons
    { name: 'Archdemon', char: 'A', color: '#ff1100', element: 'fire', stats: { hp: 80, maxHp: 80, attack: 28, defense: 14, speed: 10 }, xpValue: 110, minFloor: 8, lootChance: 0.5,
      abilities: [{ type: 'chargeAttack', multiplier: 2.0, chance: 0.2 }, { type: 'enrage', hpThreshold: 0.2, atkMultiplier: 2.2 }, { type: 'drainLife', percent: 20, chance: 0.2 }] },
    { name: 'Wrath Incarnate', char: 'I', color: '#ff0000', stats: { hp: 100, maxHp: 100, attack: 32, defense: 10, speed: 12 }, xpValue: 130, minFloor: 10, lootChance: 0.5,
      abilities: [{ type: 'enrage', hpThreshold: 0.4, atkMultiplier: 2.5 }, { type: 'chargeAttack', multiplier: 2.5, chance: 0.25 }, { type: 'bleedAttack', damage: 5, turns: 5, chance: 0.3 }] },
    // Floor 12+: Hellspawn elite
    { name: 'Infernal Seraph', char: 'S', color: '#ff3300', element: 'fire', stats: { hp: 85, maxHp: 85, attack: 30, defense: 12, speed: 15 }, xpValue: 140, minFloor: 12, lootChance: 0.5,
      abilities: [{ type: 'dodge', chance: 0.3 }, { type: 'drainLife', percent: 25, chance: 0.3 }, { type: 'stunAttack', chance: 0.2 }] },
    { name: 'Hellfire Titan', char: 'T', color: '#ff2200', element: 'fire', stats: { hp: 120, maxHp: 120, attack: 35, defense: 18, speed: 5 }, xpValue: 160, minFloor: 14, lootChance: 0.5,
      abilities: [{ type: 'chargeAttack', multiplier: 2.5, chance: 0.2 }, { type: 'selfHeal', amount: 20, hpThreshold: 0.3, cooldown: 6 }, { type: 'enrage', hpThreshold: 0.15, atkMultiplier: 2.5 }] },
  ],
  narrative_test: [], // Debug zone - uses base monsters
};

// ══════════════════════════════════════════════════════════════
// ZONE-SPECIFIC BOSSES
// ══════════════════════════════════════════════════════════════

export const ZONE_BOSSES: Record<ZoneId, MonsterDef[]> = {
  stone_depths: [], // Uses base bosses from constants.ts

  frozen_caverns: [
    {
      name: 'Frost Queen', char: 'Q', color: '#aaeeff', element: 'ice',
      stats: { hp: 70, maxHp: 70, attack: 12, defense: 8, speed: 9 },
      xpValue: 120, minFloor: 3, lootChance: 1.0, isBoss: true,
      bossAbility: { type: 'aoe', damage: 10, radius: 2, cooldown: 4 },
      guaranteedLoot: 'Frostbite Crown',
    },
    {
      name: 'Glacier Titan', char: 'T', color: '#5599cc',
      stats: { hp: 140, maxHp: 140, attack: 18, defense: 14, speed: 3 },
      xpValue: 220, minFloor: 7, lootChance: 1.0, isBoss: true,
      bossAbility: { type: 'multi', abilities: [
        { type: 'rage', hpThreshold: 0.3, atkMultiplier: 1.8 },
        { type: 'aoe', damage: 14, radius: 3, cooldown: 5 },
      ]},
      guaranteedLoot: 'Glacier Heart',
    },
    {
      name: 'Absolute Zero', char: 'Z', color: '#ddeeff',
      stats: { hp: 200, maxHp: 200, attack: 24, defense: 12, speed: 7 },
      xpValue: 400, minFloor: 10, lootChance: 1.0, isBoss: true,
      bossAbility: { type: 'multi', abilities: [
        { type: 'aoe', damage: 18, radius: 3, cooldown: 4 },
        { type: 'teleport', cooldown: 3 },
        { type: 'heal', amount: 20, cooldown: 6 },
      ]},
      guaranteedLoot: 'Shard of Absolute Zero',
    },
  ],

  fungal_marsh: [
    {
      name: 'Spore Lord', char: 'S', color: '#88cc44', element: 'poison',
      stats: { hp: 65, maxHp: 65, attack: 10, defense: 6, speed: 6 },
      xpValue: 110, minFloor: 3, lootChance: 1.0, isBoss: true,
      bossAbility: { type: 'summon', monsterName: 'Mushroom Man', count: 3, cooldown: 4 },
      guaranteedLoot: 'Spore Crown',
    },
    {
      name: 'Bog Hydra', char: 'H', color: '#448822',
      stats: { hp: 120, maxHp: 120, attack: 16, defense: 8, speed: 5 },
      xpValue: 200, minFloor: 7, lootChance: 1.0, isBoss: true,
      bossAbility: { type: 'multi', abilities: [
        { type: 'heal', amount: 20, cooldown: 5 },
        { type: 'aoe', damage: 10, radius: 2, cooldown: 4 },
      ]},
      guaranteedLoot: 'Hydra Fang',
    },
    {
      name: 'Mycelium Mind', char: 'M', color: '#aacc66',
      stats: { hp: 180, maxHp: 180, attack: 20, defense: 10, speed: 6 },
      xpValue: 380, minFloor: 10, lootChance: 1.0, isBoss: true,
      bossAbility: { type: 'multi', abilities: [
        { type: 'summon', monsterName: 'Vine Strangler', count: 2, cooldown: 4 },
        { type: 'heal', amount: 25, cooldown: 6 },
        { type: 'teleport', cooldown: 5 },
      ]},
      guaranteedLoot: 'Mind Spore Amulet',
    },
  ],

  infernal_pit: [
    {
      name: 'Infernal Captain', char: 'C', color: '#ff6622', element: 'fire',
      stats: { hp: 80, maxHp: 80, attack: 14, defense: 7, speed: 8 },
      xpValue: 130, minFloor: 3, lootChance: 1.0, isBoss: true,
      bossAbility: { type: 'multi', abilities: [
        { type: 'rage', hpThreshold: 0.4, atkMultiplier: 1.6 },
        { type: 'summon', monsterName: 'Fire Imp', count: 2, cooldown: 5 },
      ]},
      guaranteedLoot: 'Infernal Blade',
    },
    {
      name: 'Magma Wyrm', char: 'W', color: '#ff4400',
      stats: { hp: 130, maxHp: 130, attack: 20, defense: 10, speed: 6 },
      xpValue: 240, minFloor: 7, lootChance: 1.0, isBoss: true,
      bossAbility: { type: 'multi', abilities: [
        { type: 'aoe', damage: 15, radius: 3, cooldown: 4 },
        { type: 'rage', hpThreshold: 0.25, atkMultiplier: 2.0 },
      ]},
      guaranteedLoot: 'Wyrm Scale Shield',
    },
    {
      name: 'Demon King', char: 'K', color: '#ff0000',
      stats: { hp: 220, maxHp: 220, attack: 28, defense: 14, speed: 8 },
      xpValue: 500, minFloor: 10, lootChance: 1.0, isBoss: true,
      bossAbility: { type: 'multi', abilities: [
        { type: 'summon', monsterName: 'Infernal Soldier', count: 2, cooldown: 5 },
        { type: 'aoe', damage: 20, radius: 3, cooldown: 4 },
        { type: 'teleport', cooldown: 3 },
      ]},
      guaranteedLoot: 'Demon Crown',
    },
  ],

  crystal_sanctum: [
    {
      name: 'Crystal Guardian', char: 'G', color: '#cc88ff', element: 'lightning',
      stats: { hp: 75, maxHp: 75, attack: 11, defense: 12, speed: 5 },
      xpValue: 125, minFloor: 3, lootChance: 1.0, isBoss: true,
      bossAbility: { type: 'aoe', damage: 10, radius: 2, cooldown: 4 },
      guaranteedLoot: 'Prismatic Shield',
    },
    {
      name: 'Archmage Prism', char: 'A', color: '#aa55ee',
      stats: { hp: 100, maxHp: 100, attack: 20, defense: 6, speed: 10 },
      xpValue: 230, minFloor: 7, lootChance: 1.0, isBoss: true,
      bossAbility: { type: 'multi', abilities: [
        { type: 'teleport', cooldown: 3 },
        { type: 'aoe', damage: 14, radius: 3, cooldown: 4 },
        { type: 'heal', amount: 15, cooldown: 6 },
      ]},
      guaranteedLoot: 'Archmage Staff',
    },
    {
      name: 'Crystal Colossus', char: 'C', color: '#ff66ee',
      stats: { hp: 250, maxHp: 250, attack: 22, defense: 16, speed: 4 },
      xpValue: 450, minFloor: 10, lootChance: 1.0, isBoss: true,
      bossAbility: { type: 'multi', abilities: [
        { type: 'rage', hpThreshold: 0.3, atkMultiplier: 1.8 },
        { type: 'aoe', damage: 16, radius: 3, cooldown: 5 },
        { type: 'heal', amount: 30, cooldown: 8 },
      ]},
      guaranteedLoot: 'Heart of the Colossus',
    },
  ],

  shadow_realm: [
    {
      name: 'Shadow Warden', char: 'W', color: '#7744aa', element: 'dark',
      stats: { hp: 85, maxHp: 85, attack: 14, defense: 6, speed: 11 },
      xpValue: 140, minFloor: 3, lootChance: 1.0, isBoss: true,
      bossAbility: { type: 'multi', abilities: [
        { type: 'teleport', cooldown: 2 },
        { type: 'summon', monsterName: 'Shadow Wisp', count: 3, cooldown: 4 },
      ]},
      guaranteedLoot: 'Warden Cloak',
    },
    {
      name: 'Void Empress', char: 'E', color: '#9944ee',
      stats: { hp: 150, maxHp: 150, attack: 22, defense: 8, speed: 10 },
      xpValue: 280, minFloor: 7, lootChance: 1.0, isBoss: true,
      bossAbility: { type: 'multi', abilities: [
        { type: 'aoe', damage: 16, radius: 3, cooldown: 4 },
        { type: 'heal', amount: 20, cooldown: 5 },
        { type: 'teleport', cooldown: 3 },
      ]},
      guaranteedLoot: 'Void Empress Crown',
    },
    {
      name: 'The Nameless One', char: '?', color: '#aa00ff',
      stats: { hp: 300, maxHp: 300, attack: 30, defense: 15, speed: 9 },
      xpValue: 700, minFloor: 12, lootChance: 1.0, isBoss: true,
      bossAbility: { type: 'multi', abilities: [
        { type: 'summon', monsterName: 'Nightmare', count: 2, cooldown: 4 },
        { type: 'aoe', damage: 22, radius: 3, cooldown: 4 },
        { type: 'teleport', cooldown: 2 },
        { type: 'rage', hpThreshold: 0.2, atkMultiplier: 2.5 },
      ]},
      guaranteedLoot: 'Nameless Crown',
    },
  ],

  hell: [
    {
      name: 'Gatekeeper of Hell', char: 'G', color: '#ff4422', element: 'fire',
      stats: { hp: 180, maxHp: 180, attack: 22, defense: 14, speed: 8 },
      xpValue: 300, minFloor: 5, lootChance: 1.0, isBoss: true,
      bossAbility: { type: 'multi', abilities: [
        { type: 'summon', monsterName: 'Hellhound', count: 3, cooldown: 4 },
        { type: 'aoe', damage: 20, radius: 3, cooldown: 4 },
        { type: 'rage', hpThreshold: 0.3, atkMultiplier: 2.0 },
      ]},
      guaranteedLoot: 'Gatekeeper\'s Key',
    },
    {
      name: 'Asmodeus', char: 'A', color: '#cc0000', element: 'dark',
      stats: { hp: 280, maxHp: 280, attack: 30, defense: 16, speed: 10 },
      xpValue: 500, minFloor: 10, lootChance: 1.0, isBoss: true,
      bossAbility: { type: 'multi', abilities: [
        { type: 'teleport', cooldown: 2 },
        { type: 'aoe', damage: 25, radius: 3, cooldown: 3 },
        { type: 'heal', amount: 30, cooldown: 5 },
        { type: 'rage', hpThreshold: 0.25, atkMultiplier: 2.2 },
      ]},
      guaranteedLoot: 'Crown of Sin',
    },
    {
      name: 'Mephistopheles', char: 'M', color: '#ff1100',
      stats: { hp: 400, maxHp: 400, attack: 38, defense: 20, speed: 12 },
      xpValue: 800, minFloor: 15, lootChance: 1.0, isBoss: true,
      bossAbility: { type: 'multi', abilities: [
        { type: 'summon', monsterName: 'Archdemon', count: 2, cooldown: 4 },
        { type: 'aoe', damage: 30, radius: 3, cooldown: 3 },
        { type: 'teleport', cooldown: 2 },
        { type: 'heal', amount: 40, cooldown: 6 },
        { type: 'rage', hpThreshold: 0.2, atkMultiplier: 2.5 },
      ]},
      guaranteedLoot: 'Soul Harvester',
    },
    {
      name: 'Lucifer', char: 'L', color: '#ff0000', element: 'fire',
      stats: { hp: 666, maxHp: 666, attack: 50, defense: 25, speed: 15 },
      xpValue: 1500, minFloor: 18, lootChance: 1.0, isBoss: true,
      bossAbility: { type: 'multi', abilities: [
        { type: 'summon', monsterName: 'Infernal Seraph', count: 2, cooldown: 3 },
        { type: 'aoe', damage: 40, radius: 4, cooldown: 3 },
        { type: 'teleport', cooldown: 1 },
        { type: 'heal', amount: 60, cooldown: 5 },
        { type: 'rage', hpThreshold: 0.15, atkMultiplier: 3.0 },
      ]},
      guaranteedLoot: 'Lucifer\'s Halo',
    },
  ],
  narrative_test: [], // Debug zone - uses base bosses
};

// ══════════════════════════════════════════════════════════════
// ZONE-SPECIFIC WEAPONS
// ══════════════════════════════════════════════════════════════

export const ZONE_WEAPONS: Record<ZoneId, Omit<Item, 'id'>[]> = {
  stone_depths: [], // Uses base weapons

  frozen_caverns: [
    { name: 'Ice Shard Dagger', type: 'weapon', char: ')', color: '#aaeeff', value: 12, equipSlot: 'weapon', element: 'ice', statBonus: { attack: 3, speed: 1 }, description: 'Cold to the touch', onHitEffect: { type: 'freeze', chance: 0.15, turns: 2 } },
    { name: 'Frostbite Axe', type: 'weapon', char: ')', color: '#88bbdd', value: 35, equipSlot: 'weapon', element: 'ice', statBonus: { attack: 7 }, description: 'Leaves frostbite wounds', onHitEffect: { type: 'freeze', chance: 0.2, turns: 2 } },
    { name: 'Glacial Greatsword', type: 'weapon', char: ')', color: '#99ddff', value: 65, equipSlot: 'weapon', element: 'ice', statBonus: { attack: 12 }, description: 'Carved from glacier ice', onHitEffect: { type: 'freeze', chance: 0.25, turns: 3 } },
    { name: 'Avalanche Hammer', type: 'weapon', char: ')', color: '#6699cc', value: 85, equipSlot: 'weapon', statBonus: { attack: 14, defense: 2 }, description: 'Hits like an avalanche', onHitEffect: { type: 'stun', chance: 0.2 } },
  ],

  fungal_marsh: [
    { name: 'Thorn Whip', type: 'weapon', char: ')', color: '#66aa33', value: 10, equipSlot: 'weapon', element: 'poison', statBonus: { attack: 3 }, description: 'Covered in thorns', onHitEffect: { type: 'poison', damage: 2, turns: 3 } },
    { name: 'Fungal Blade', type: 'weapon', char: ')', color: '#88cc44', value: 30, equipSlot: 'weapon', element: 'poison', statBonus: { attack: 6 }, description: 'Grows spores on contact', onHitEffect: { type: 'poison', damage: 3, turns: 4 } },
    { name: 'Rot Staff', type: 'weapon', char: ')', color: '#557711', value: 55, equipSlot: 'weapon', statBonus: { attack: 9, speed: 1 }, description: 'Causes rapid decay', onHitEffect: { type: 'bleed', damage: 3, turns: 4 } },
    { name: 'Plague Bearer', type: 'weapon', char: ')', color: '#448822', value: 80, equipSlot: 'weapon', element: 'poison', statBonus: { attack: 13 }, description: 'Spreads disease', onHitEffect: { type: 'poison', damage: 4, turns: 5 } },
  ],

  infernal_pit: [
    { name: 'Ember Knife', type: 'weapon', char: ')', color: '#ff8844', value: 14, equipSlot: 'weapon', element: 'fire', statBonus: { attack: 4 }, description: 'Always warm', onHitEffect: { type: 'fireball', damage: 4, chance: 0.2 } },
    { name: 'Hellfire Sword', type: 'weapon', char: ')', color: '#ff4400', value: 40, equipSlot: 'weapon', element: 'fire', statBonus: { attack: 9 }, description: 'Burns with hellfire', onHitEffect: { type: 'fireball', damage: 7, chance: 0.25 } },
    { name: 'Lava Maul', type: 'weapon', char: ')', color: '#ff5522', value: 60, equipSlot: 'weapon', element: 'fire', statBonus: { attack: 11, defense: 1 }, description: 'Drips molten rock', onHitEffect: { type: 'fireball', damage: 8, chance: 0.3 } },
    { name: 'Inferno Blade', type: 'weapon', char: ')', color: '#ff2200', value: 95, equipSlot: 'weapon', element: 'fire', statBonus: { attack: 16, speed: 2 }, description: 'Pure concentrated fire', onHitEffect: { type: 'fireball', damage: 10, chance: 0.35 } },
  ],

  crystal_sanctum: [
    { name: 'Crystal Wand', type: 'weapon', char: ')', color: '#cc88ff', value: 15, equipSlot: 'weapon', statBonus: { attack: 4, speed: 2 }, description: 'Channels arcane power' },
    { name: 'Prismatic Blade', type: 'weapon', char: ')', color: '#ee88ff', value: 45, equipSlot: 'weapon', element: 'lightning', statBonus: { attack: 8, speed: 1 }, description: 'Shifts color as it strikes', onHitEffect: { type: 'stun', chance: 0.15 } },
    { name: 'Arcane Scepter', type: 'weapon', char: ')', color: '#aa55ee', value: 70, equipSlot: 'weapon', statBonus: { attack: 11, speed: 3 }, description: 'Hums with raw magic', onHitEffect: { type: 'fireball', damage: 6, chance: 0.3 } },
    { name: 'Crystalline Edge', type: 'weapon', char: ')', color: '#ff99ee', value: 100, equipSlot: 'weapon', statBonus: { attack: 15, defense: 2 }, description: 'Impossibly sharp crystal', onHitEffect: { type: 'execute', hpThreshold: 0.25, chance: 0.2 } },
  ],

  shadow_realm: [
    { name: 'Shadow Dagger', type: 'weapon', char: ')', color: '#7744aa', value: 15, equipSlot: 'weapon', statBonus: { attack: 5, speed: 3 }, description: 'Made of solidified shadow' },
    { name: 'Void Blade', type: 'weapon', char: ')', color: '#5533aa', value: 50, equipSlot: 'weapon', element: 'dark', statBonus: { attack: 10, speed: 2 }, description: 'Cuts through reality', onHitEffect: { type: 'bleed', damage: 3, turns: 4 } },
    { name: 'Nightmare Scythe', type: 'weapon', char: ')', color: '#8844cc', value: 75, equipSlot: 'weapon', element: 'dark', statBonus: { attack: 14 }, description: 'Harvests nightmares', onHitEffect: { type: 'lifesteal', percent: 20 } },
    { name: 'Entropy Edge', type: 'weapon', char: ')', color: '#aa00ff', value: 110, equipSlot: 'weapon', statBonus: { attack: 18, speed: 3 }, description: 'Unmakes what it touches', onHitEffect: { type: 'execute', hpThreshold: 0.3, chance: 0.25 } },
  ],

  hell: [
    { name: 'Sinner\'s Brand', type: 'weapon', char: ')', color: '#cc3322', value: 30, equipSlot: 'weapon', element: 'fire', statBonus: { attack: 8, speed: 2 }, description: 'Burns with the guilt of the damned', onHitEffect: { type: 'fireball', damage: 6, chance: 0.25 } },
    { name: 'Flaying Whip', type: 'weapon', char: ')', color: '#aa2222', value: 60, equipSlot: 'weapon', element: 'dark', statBonus: { attack: 14, speed: 3 }, description: 'Each strike tears at the soul', onHitEffect: { type: 'bleed', damage: 4, turns: 5 } },
    { name: 'Hellforged Greatsword', type: 'weapon', char: ')', color: '#ff2200', value: 100, equipSlot: 'weapon', element: 'fire', statBonus: { attack: 20, defense: 2 }, description: 'Forged in the heart of Hell', onHitEffect: { type: 'fireball', damage: 12, chance: 0.35 } },
    { name: 'Damnation Blade', type: 'weapon', char: ')', color: '#ff0000', value: 150, equipSlot: 'weapon', element: 'fire', statBonus: { attack: 25, speed: 4 }, description: 'The condemned scream when it strikes', onHitEffect: { type: 'execute', hpThreshold: 0.35, chance: 0.3 } },
  ],
  narrative_test: [], // Debug zone - uses base weapons
};

// ══════════════════════════════════════════════════════════════
// ZONE-SPECIFIC ARMOR
// ══════════════════════════════════════════════════════════════

export const ZONE_ARMOR: Record<ZoneId, Omit<Item, 'id'>[]> = {
  stone_depths: [],

  frozen_caverns: [
    { name: 'Fur Cloak', type: 'armor', char: '[', color: '#ccaa88', value: 12, equipSlot: 'armor', statBonus: { defense: 3, speed: 1 }, description: 'Keeps the cold out' },
    { name: 'Ice Plate', type: 'armor', char: '[', color: '#88ccee', value: 40, equipSlot: 'armor', statBonus: { defense: 7 }, description: 'Frozen solid armor', onDefendEffect: { type: 'freeze', chance: 0.15, turns: 1 } },
    { name: 'Glacial Aegis', type: 'armor', char: '[', color: '#aaeeff', value: 75, equipSlot: 'armor', statBonus: { defense: 11, maxHp: 10 }, description: 'Ancient glacier plate', onDefendEffect: { type: 'freeze', chance: 0.2, turns: 2 } },
  ],

  fungal_marsh: [
    { name: 'Bark Armor', type: 'armor', char: '[', color: '#886644', value: 10, equipSlot: 'armor', statBonus: { defense: 2, maxHp: 5 }, description: 'Grown from living bark' },
    { name: 'Spore Shield', type: 'armor', char: '[', color: '#88cc44', value: 35, equipSlot: 'armor', statBonus: { defense: 5 }, description: 'Releases spores when hit', onDefendEffect: { type: 'poison', damage: 2, turns: 3 } },
    { name: 'Mycelium Plate', type: 'armor', char: '[', color: '#66aa33', value: 70, equipSlot: 'armor', statBonus: { defense: 10, maxHp: 8 }, description: 'Regenerates itself', onDefendEffect: { type: 'thorns', damage: 4 } },
  ],

  infernal_pit: [
    { name: 'Scorched Hide', type: 'armor', char: '[', color: '#aa5533', value: 14, equipSlot: 'armor', statBonus: { defense: 3 }, description: 'Fire-resistant leather' },
    { name: 'Magma Mail', type: 'armor', char: '[', color: '#ff5522', value: 45, equipSlot: 'armor', statBonus: { defense: 7, attack: 1 }, description: 'Radiates heat', onDefendEffect: { type: 'fireball', damage: 5, chance: 0.2 } },
    { name: 'Demon Plate', type: 'armor', char: '[', color: '#cc0000', value: 80, equipSlot: 'armor', statBonus: { defense: 12, maxHp: 10 }, description: 'Forged in hellfire', onDefendEffect: { type: 'fireball', damage: 7, chance: 0.25 } },
  ],

  crystal_sanctum: [
    { name: 'Crystal Robe', type: 'armor', char: '[', color: '#cc88ff', value: 15, equipSlot: 'armor', statBonus: { defense: 2, speed: 2 }, description: 'Woven with crystal threads' },
    { name: 'Prismatic Armor', type: 'armor', char: '[', color: '#ee88ff', value: 50, equipSlot: 'armor', statBonus: { defense: 8, speed: 1 }, description: 'Shifts colors defensively' },
    { name: 'Arcane Bulwark', type: 'armor', char: '[', color: '#aa55ee', value: 85, equipSlot: 'armor', statBonus: { defense: 13, maxHp: 12 }, description: 'Pure magical protection', onDefendEffect: { type: 'thorns', damage: 5 } },
  ],

  shadow_realm: [
    { name: 'Shadow Wrap', type: 'armor', char: '[', color: '#554477', value: 14, equipSlot: 'armor', statBonus: { defense: 2, speed: 3 }, description: 'Hard to see, hard to hit' },
    { name: 'Void Armor', type: 'armor', char: '[', color: '#5533aa', value: 55, equipSlot: 'armor', statBonus: { defense: 8, speed: 2 }, description: 'Absorbs incoming blows' },
    { name: 'Entropy Shell', type: 'armor', char: '[', color: '#aa00ff', value: 90, equipSlot: 'armor', statBonus: { defense: 14, maxHp: 15 }, description: 'Reality bends around you', onDefendEffect: { type: 'thorns', damage: 6 } },
  ],

  hell: [
    { name: 'Soulbound Hide', type: 'armor', char: '[', color: '#aa3322', value: 25, equipSlot: 'armor', statBonus: { defense: 5, maxHp: 5 }, description: 'Stitched from damned souls' },
    { name: 'Infernal Plate', type: 'armor', char: '[', color: '#cc1100', value: 70, equipSlot: 'armor', statBonus: { defense: 12, maxHp: 10 }, description: 'Burns anything that strikes it', onDefendEffect: { type: 'fireball', damage: 8, chance: 0.25 } },
    { name: 'Armor of the Abyss', type: 'armor', char: '[', color: '#ff0000', value: 130, equipSlot: 'armor', statBonus: { defense: 18, maxHp: 20 }, description: 'Forged by Lucifer himself', onDefendEffect: { type: 'thorns', damage: 10 } },
  ],
  narrative_test: [], // Debug zone - uses base armor
};

// ══════════════════════════════════════════════════════════════
// ZONE-SPECIFIC BOSS LOOT (guaranteed drops)
// ══════════════════════════════════════════════════════════════

export const ZONE_BOSS_LOOT: Omit<Item, 'id'>[] = [
  // Frozen Caverns
  { name: 'Frostbite Crown', type: 'armor', char: '[', color: '#aaeeff', value: 50, equipSlot: 'armor', statBonus: { defense: 6, speed: 2 }, description: 'Crown of the Frost Queen', onDefendEffect: { type: 'freeze', chance: 0.2, turns: 2 } },
  { name: 'Glacier Heart', type: 'amulet', char: '"', color: '#5599cc', value: 100, equipSlot: 'amulet', statBonus: { defense: 5, maxHp: 15 }, description: 'Beats with icy power' },
  { name: 'Shard of Absolute Zero', type: 'weapon', char: ')', color: '#ddeeff', value: 180, equipSlot: 'weapon', statBonus: { attack: 20, speed: 4 }, description: 'Coldest thing in existence', onHitEffect: { type: 'freeze', chance: 0.35, turns: 3 } },

  // Fungal Marsh
  { name: 'Spore Crown', type: 'armor', char: '[', color: '#88cc44', value: 45, equipSlot: 'armor', statBonus: { defense: 5, maxHp: 8 }, description: 'Living fungal crown' },
  { name: 'Hydra Fang', type: 'weapon', char: ')', color: '#448822', value: 95, equipSlot: 'weapon', statBonus: { attack: 14 }, description: 'Regrows after each swing', onHitEffect: { type: 'poison', damage: 4, turns: 5 } },
  { name: 'Mind Spore Amulet', type: 'amulet', char: '"', color: '#aacc66', value: 160, equipSlot: 'amulet', statBonus: { attack: 6, defense: 6, maxHp: 10 }, description: 'The Mycelium Mind speaks through it' },

  // Infernal Pit
  { name: 'Infernal Blade', type: 'weapon', char: ')', color: '#ff6622', value: 55, equipSlot: 'weapon', statBonus: { attack: 10, speed: 1 }, description: 'Burns with demonic fire', onHitEffect: { type: 'fireball', damage: 8, chance: 0.3 } },
  { name: 'Wyrm Scale Shield', type: 'armor', char: '[', color: '#ff4400', value: 105, equipSlot: 'armor', statBonus: { defense: 12, maxHp: 12 }, description: 'Scales of the Magma Wyrm', onDefendEffect: { type: 'fireball', damage: 6, chance: 0.25 } },
  { name: 'Demon Crown', type: 'amulet', char: '"', color: '#ff0000', value: 200, equipSlot: 'amulet', statBonus: { attack: 8, defense: 4, speed: 3, maxHp: 15 }, description: 'Absolute power of the Demon King' },

  // Crystal Sanctum
  { name: 'Prismatic Shield', type: 'armor', char: '[', color: '#cc88ff', value: 50, equipSlot: 'armor', statBonus: { defense: 8, speed: 1 }, description: 'Reflects magical attacks' },
  { name: 'Archmage Staff', type: 'weapon', char: ')', color: '#aa55ee', value: 110, equipSlot: 'weapon', statBonus: { attack: 16, speed: 3 }, description: 'Raw arcane energy', onHitEffect: { type: 'fireball', damage: 10, chance: 0.3 } },
  { name: 'Heart of the Colossus', type: 'amulet', char: '"', color: '#ff66ee', value: 190, equipSlot: 'amulet', statBonus: { attack: 5, defense: 8, maxHp: 20 }, description: 'Pulses with crystalline energy' },

  // Shadow Realm
  { name: 'Warden Cloak', type: 'armor', char: '[', color: '#7744aa', value: 55, equipSlot: 'armor', statBonus: { defense: 5, speed: 4 }, description: 'Blends into shadow' },
  { name: 'Void Empress Crown', type: 'amulet', char: '"', color: '#9944ee', value: 130, equipSlot: 'amulet', statBonus: { attack: 7, defense: 5, speed: 2 }, description: 'Command the void' },
  { name: 'Nameless Crown', type: 'amulet', char: '"', color: '#aa00ff', value: 250, equipSlot: 'amulet', statBonus: { attack: 10, defense: 8, speed: 4, maxHp: 25 }, description: 'The most powerful artifact in existence' },

  // Hell
  { name: 'Gatekeeper\'s Key', type: 'amulet', char: '"', color: '#ff4422', value: 120, equipSlot: 'amulet', statBonus: { attack: 6, defense: 6, speed: 3, maxHp: 10 }, description: 'Opens any gate — even death\'s' },
  { name: 'Crown of Sin', type: 'amulet', char: '"', color: '#cc0000', value: 200, equipSlot: 'amulet', statBonus: { attack: 10, defense: 5, speed: 4 }, description: 'Seven sins grant seven powers' },
  { name: 'Soul Harvester', type: 'weapon', char: ')', color: '#ff1100', value: 280, equipSlot: 'weapon', statBonus: { attack: 28, speed: 5 }, description: 'Reaps souls from the living', onHitEffect: { type: 'lifesteal', percent: 25 } },
  { name: 'Lucifer\'s Halo', type: 'amulet', char: '"', color: '#ff0000', value: 666, equipSlot: 'amulet', statBonus: { attack: 15, defense: 15, speed: 8, maxHp: 40 }, description: 'The fallen angel\'s crown. Ultimate power at the cost of everything.' },
];

// ══════════════════════════════════════════════════════════════
// ZONE-SPECIFIC CONSUMABLES & FOOD
// ══════════════════════════════════════════════════════════════

export const ZONE_POTIONS: Record<ZoneId, Omit<Item, 'id'>[]> = {
  stone_depths: [],

  frozen_caverns: [
    { name: 'Frost Tonic', type: 'potion', char: '!', color: '#88ccee', value: 15, description: '+3 defense for 15 turns' },
    { name: 'Blizzard Elixir', type: 'potion', char: '!', color: '#aaeeff', value: 30, description: 'Freezes all nearby enemies for 2 turns' },
  ],

  fungal_marsh: [
    { name: 'Antifungal Brew', type: 'potion', char: '!', color: '#88cc44', value: 12, description: 'Cures poison and grants immunity for 10 turns' },
    { name: 'Spore Bomb', type: 'potion', char: '!', color: '#66aa33', value: 25, description: 'Poisons all nearby enemies' },
  ],

  infernal_pit: [
    { name: 'Lava Resist Potion', type: 'potion', char: '!', color: '#ff8844', value: 18, description: 'Take no lava damage for 20 turns' },
    { name: 'Hellfire Flask', type: 'potion', char: '!', color: '#ff4400', value: 30, description: 'Deals 25 fire damage to all nearby enemies' },
  ],

  crystal_sanctum: [
    { name: 'Mana Crystal', type: 'potion', char: '!', color: '#cc88ff', value: 20, description: '+4 attack for 15 turns' },
    { name: 'Prism Elixir', type: 'potion', char: '!', color: '#ee88ff', value: 35, description: 'Restores 25 HP and +2 all stats for 10 turns' },
  ],

  shadow_realm: [
    { name: 'Void Essence', type: 'potion', char: '!', color: '#7744aa', value: 22, description: '+5 speed for 15 turns' },
    { name: 'Shadow Draught', type: 'potion', char: '!', color: '#5533aa', value: 35, description: '+6 attack for 12 turns' },
  ],

  hell: [
    { name: 'Brimstone Elixir', type: 'potion', char: '!', color: '#ff4422', value: 35, description: '+8 attack for 15 turns' },
    { name: 'Hellblood Vial', type: 'potion', char: '!', color: '#cc0022', value: 50, description: 'Restores 50 HP and grants lifesteal for 10 turns' },
  ],
  narrative_test: [], // Debug zone - uses base potions
};

export const ZONE_FOOD: Record<ZoneId, Omit<Item, 'id'>[]> = {
  stone_depths: [],

  frozen_caverns: [
    { name: 'Frozen Fish', type: 'food', char: '%', color: '#88ccee', value: 30, description: 'Cold but nutritious' },
    { name: 'Ice Berry', type: 'food', char: '%', color: '#aaeeff', value: 20, description: 'Refreshingly cold' },
    { name: 'Snow Hare', type: 'food', char: '%', color: '#ccddee', value: 45, description: 'A filling meal from the tundra' },
  ],

  fungal_marsh: [
    { name: 'Edible Mushroom', type: 'food', char: '%', color: '#88cc44', value: 25, description: 'Safe to eat... probably' },
    { name: 'Swamp Root', type: 'food', char: '%', color: '#557733', value: 20, description: 'Tough but filling' },
    { name: 'Marsh Frog Legs', type: 'food', char: '%', color: '#66aa33', value: 35, description: 'A marsh delicacy' },
  ],

  infernal_pit: [
    { name: 'Fire Pepper', type: 'food', char: '%', color: '#ff6644', value: 20, description: 'Burns going down' },
    { name: 'Charred Meat', type: 'food', char: '%', color: '#aa5533', value: 35, description: 'Well done... very well done' },
    { name: 'Magma Fruit', type: 'food', char: '%', color: '#ff8844', value: 45, description: 'Warm and surprisingly sweet' },
  ],

  crystal_sanctum: [
    { name: 'Crystal Fruit', type: 'food', char: '%', color: '#cc88ff', value: 30, description: 'Grows from crystal trees' },
    { name: 'Arcane Bread', type: 'food', char: '%', color: '#aa88cc', value: 25, description: 'Infused with magic' },
    { name: 'Prism Berry', type: 'food', char: '%', color: '#ee88ff', value: 40, description: 'Tastes like a rainbow' },
  ],

  shadow_realm: [
    { name: 'Shadow Fruit', type: 'food', char: '%', color: '#554477', value: 25, description: 'Absorbs light around it' },
    { name: 'Void Jerky', type: 'food', char: '%', color: '#443366', value: 35, description: 'Sustaining despite its appearance' },
    { name: 'Nightmare Feast', type: 'food', char: '%', color: '#7744aa', value: 55, description: 'A full meal from the void' },
  ],

  hell: [
    { name: 'Charred Soul', type: 'food', char: '%', color: '#aa3322', value: 30, description: 'Tastes like regret' },
    { name: 'Hellfire Fruit', type: 'food', char: '%', color: '#ff4422', value: 40, description: 'Burns but nourishes' },
    { name: 'Demonic Feast', type: 'food', char: '%', color: '#cc0000', value: 65, description: 'A banquet fit for a demon lord' },
  ],
  narrative_test: [], // Debug zone - uses base food
};

// ══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════

export function getZoneDef(zoneId: ZoneId): ZoneDef {
  return ZONE_DEFS.find(z => z.id === zoneId) ?? ZONE_DEFS[0]!;
}

/** Check if a zone is unlocked given the player's boss kill log + optional echo-unlocked zones */
export function isZoneUnlocked(zoneId: ZoneId, bossKillLog: string[], echoUnlockedZones?: string[]): boolean {
  const zone = getZoneDef(zoneId);
  if (zone.unlockRequirements.length === 0) return true;
  // Echo Tree can unlock zones as an alternative path
  if (echoUnlockedZones && echoUnlockedZones.includes(zoneId)) return true;
  return zone.unlockRequirements.every(req =>
    bossKillLog.includes(`${req.bossName}|${req.withClass}`)
  );
}

/** Get all zones that are currently unlocked */
export function getUnlockedZones(bossKillLog: string[], echoUnlockedZones?: string[]): ZoneDef[] {
  return ZONE_DEFS.filter(z => isZoneUnlocked(z.id, bossKillLog, echoUnlockedZones));
}

/** Get all zones that are locked, with their requirements */
export function getLockedZones(bossKillLog: string[], echoUnlockedZones?: string[]): ZoneDef[] {
  return ZONE_DEFS.filter(z => !isZoneUnlocked(z.id, bossKillLog, echoUnlockedZones));
}

/** Get the terrain defs available for a zone (base + zone-specific) */
export function getZoneTerrainDefs(zoneId: ZoneId): TerrainDef[] {
  const zone = getZoneDef(zoneId);
  const baseDefs: TerrainDef[] = [
    { type: 'water',      name: 'Water',      color: '#3388cc', bg: '#081828', glow: '#3388cc', minFloor: 1 },
    { type: 'lava',       name: 'Lava',       color: '#ff5511', bg: '#2a0800', glow: '#ff5511', minFloor: 1 },
    { type: 'poison',     name: 'Poison',     color: '#44cc22', bg: '#0a1a04', glow: '#44cc22', minFloor: 1 },
    { type: 'ice',        name: 'Ice',        color: '#88ddff', bg: '#0a1a2a', glow: '#88ddff', minFloor: 1 },
    { type: 'tall_grass', name: 'Tall Grass', color: '#55aa33', bg: '#0a1a08',                  minFloor: 1 },
    { type: 'mud',        name: 'Mud',        color: '#8a6633', bg: '#1a1008',                  minFloor: 1 },
    { type: 'holy',       name: 'Holy Ground', color: '#ffdd66', bg: '#1a1808', glow: '#ffdd66', minFloor: 1 },
    { type: 'shadow',     name: 'Shadow',     color: '#554477', bg: '#0a0816', glow: '#554477', minFloor: 1 },
    ...ZONE_TERRAIN_DEFS,
  ];
  // Filter to only terrain types in this zone's pool
  return baseDefs.filter(t => zone.terrainPool.includes(t.type));
}
