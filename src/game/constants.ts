import type { MonsterDef, Item, ClassDef, MercenaryDef, TerrainDef, ChoosableAbility, ItemRarity, PlayerClass } from './types';

// ── Map dimensions ──
export const MAP_WIDTH = 60;
export const MAP_HEIGHT = 40;

// ── Room generation ──
export const MIN_ROOM_SIZE = 4;
export const MAX_ROOM_SIZE = 10;
export const MAX_ROOMS = 12;

// ── Visibility ──
export const VIEW_RADIUS = 7;

// ── Player starting stats ──
export const PLAYER_BASE_STATS = {
  hp: 30,
  maxHp: 30,
  attack: 5,
  defense: 2,
  speed: 10,
};

// ── Hunger ──
export const HUNGER_MAX = 100;
export const HUNGER_PER_TURN = 0.4;
export const HUNGER_WARNING = 25;
export const STARVING_THRESHOLD = 0;
export const STARVING_DAMAGE = 1;

// ── HP Regen ──
export const REGEN_INTERVAL = 6;
export const REGEN_AMOUNT = 2;
export const REGEN_HUNGER_MIN = 40;

// ── XP per level (cumulative) ──
export const XP_PER_LEVEL = [0, 25, 75, 160, 300, 500, 800, 1200, 1800, 2600];

// ── Monster definitions ──
export const MONSTER_DEFS: MonsterDef[] = [
  // ══════════ FLOOR 1: Early game ══════════
  { name: 'Rat', char: 'r', color: '#c8875a', stats: { hp: 7, maxHp: 7, attack: 3, defense: 0, speed: 9 }, xpValue: 5, minFloor: 1, lootChance: 0.1,
    abilities: [{ type: 'callForHelp', monsterName: 'Rat', chance: 0.2, cooldown: 6 }], aggroRange: 10 },
  { name: 'Bat', char: 'b', color: '#b06840', element: 'dark', stats: { hp: 6, maxHp: 6, attack: 4, defense: 0, speed: 13 }, xpValue: 6, minFloor: 1, lootChance: 0.05,
    abilities: [{ type: 'dodge', chance: 0.25 }], aggroRange: 12 },
  { name: 'Cave Beetle', char: 'i', color: '#886633', stats: { hp: 8, maxHp: 8, attack: 3, defense: 3, speed: 5 }, xpValue: 5, minFloor: 1, lootChance: 0.08, aggroRange: 5 },
  { name: 'Sewer Slug', char: 's', color: '#77aa44', element: 'poison', stats: { hp: 10, maxHp: 10, attack: 2, defense: 1, speed: 2 }, xpValue: 4, minFloor: 1, lootChance: 0.1,
    abilities: [{ type: 'poisonAttack', damage: 1, turns: 3, chance: 0.25 }], aggroRange: 4 },
  { name: 'Tunnel Worm', char: 'w', color: '#cc8866', element: 'poison', stats: { hp: 9, maxHp: 9, attack: 4, defense: 0, speed: 7 }, xpValue: 6, minFloor: 1, lootChance: 0.08, aggroRange: 6 },

  // ══════════ FLOOR 2: Stepping up — harder than floor 1 but still learnable ══════════
  { name: 'Kobold', char: 'k', color: '#ff7b5e', element: 'fire', stats: { hp: 12, maxHp: 12, attack: 5, defense: 2, speed: 10 }, xpValue: 10, minFloor: 2, lootChance: 0.2,
    abilities: [{ type: 'callForHelp', monsterName: 'Kobold', chance: 0.2, cooldown: 6 }], attackRange: 3, projectileChar: '*', projectileColor: '#ff7b5e', aggroRange: 9 },
  { name: 'Dire Rat', char: 'R', color: '#aa7744', stats: { hp: 14, maxHp: 14, attack: 6, defense: 1, speed: 11 }, xpValue: 9, minFloor: 2, lootChance: 0.12,
    abilities: [{ type: 'bleedAttack', damage: 1, turns: 3, chance: 0.25 }], aggroRange: 9 },
  { name: 'Mold Slime', char: 'j', color: '#66bb33', element: 'poison', stats: { hp: 16, maxHp: 16, attack: 4, defense: 4, speed: 3 }, xpValue: 8, minFloor: 2, lootChance: 0.15,
    abilities: [{ type: 'selfHeal', amount: 3, hpThreshold: 0.5, cooldown: 4 }], aggroRange: 4 },
  { name: 'Hobgoblin', char: 'H', color: '#44cc44', stats: { hp: 15, maxHp: 15, attack: 6, defense: 3, speed: 8 }, xpValue: 11, minFloor: 2, lootChance: 0.2,
    abilities: [{ type: 'enrage', hpThreshold: 0.35, atkMultiplier: 1.4 }], aggroRange: 7 },
  { name: 'Cave Leech', char: 'l', color: '#cc4455', element: 'dark', stats: { hp: 10, maxHp: 10, attack: 5, defense: 1, speed: 9 }, xpValue: 7, minFloor: 2, lootChance: 0.1,
    abilities: [{ type: 'drainLife', percent: 25, chance: 0.25 }], aggroRange: 6 },

  // ══════════ FLOOR 3: First real challenge — boss floor ══════════
  { name: 'Giant Spider', char: 's', color: '#88aa44', element: 'poison', stats: { hp: 20, maxHp: 20, attack: 8, defense: 3, speed: 11 }, xpValue: 14, minFloor: 3, lootChance: 0.15,
    abilities: [{ type: 'poisonAttack', damage: 2, turns: 3, chance: 0.3 }], aggroRange: 9 },
  { name: 'Goblin', char: 'g', color: '#50ff50', element: 'poison', stats: { hp: 22, maxHp: 22, attack: 8, defense: 3, speed: 9 }, xpValue: 15, minFloor: 3, lootChance: 0.25,
    abilities: [{ type: 'enrage', hpThreshold: 0.3, atkMultiplier: 1.5 }], aggroRange: 7 },
  { name: 'Cave Scorpion', char: 'x', color: '#cc8833', element: 'poison', stats: { hp: 22, maxHp: 22, attack: 9, defense: 3, speed: 10 }, xpValue: 18, minFloor: 3, lootChance: 0.2,
    abilities: [{ type: 'poisonAttack', damage: 2, turns: 3, chance: 0.3 }], aggroRange: 7 },
  { name: 'Fungus Crawler', char: 'f', color: '#99cc55', element: 'poison', stats: { hp: 24, maxHp: 24, attack: 7, defense: 5, speed: 4 }, xpValue: 12, minFloor: 3, lootChance: 0.2,
    abilities: [{ type: 'poisonAttack', damage: 1, turns: 3, chance: 0.3 }, { type: 'selfHeal', amount: 4, hpThreshold: 0.4, cooldown: 4 }], aggroRange: 5 },
  { name: 'Tomb Scarab', char: 'c', color: '#ddaa33', element: 'dark', stats: { hp: 14, maxHp: 14, attack: 8, defense: 4, speed: 13 }, xpValue: 10, minFloor: 3, lootChance: 0.15,
    abilities: [{ type: 'dodge', chance: 0.3 }], aggroRange: 9 },
  { name: 'Goblin Shaman', char: 'G', color: '#33dd55', element: 'poison', stats: { hp: 18, maxHp: 18, attack: 9, defense: 3, speed: 9 }, xpValue: 16, minFloor: 3, lootChance: 0.3,
    abilities: [{ type: 'callForHelp', monsterName: 'Goblin', chance: 0.2, cooldown: 5 }], attackRange: 3, projectileChar: '•', projectileColor: '#33dd55', aggroRange: 9 },

  // ══════════ FLOOR 4: Mid-early ══════════
  { name: 'Skeleton', char: 'S', color: '#e8e8ff', element: 'dark', stats: { hp: 22, maxHp: 22, attack: 10, defense: 5, speed: 6 }, xpValue: 20, minFloor: 4, lootChance: 0.3,
    abilities: [{ type: 'bleedAttack', damage: 2, turns: 3, chance: 0.25 }], attackRange: 3, projectileChar: '•', projectileColor: '#e8e8ff', aggroRange: 8 },
  { name: 'Mimic', char: '?', color: '#ffdd44', element: 'dark', stats: { hp: 30, maxHp: 30, attack: 15, defense: 8, speed: 1 }, xpValue: 35, minFloor: 4, lootChance: 0.8,
    abilities: [{ type: 'chargeAttack', multiplier: 2.2, chance: 0.3 }, { type: 'stunAttack', chance: 0.2 }], aggroRange: 3 },
  { name: 'War Hound', char: 'h', color: '#bb6644', element: 'fire', stats: { hp: 24, maxHp: 24, attack: 12, defense: 3, speed: 14 }, xpValue: 28, minFloor: 4, lootChance: 0.2,
    abilities: [{ type: 'chargeAttack', multiplier: 1.6, chance: 0.35 }], aggroRange: 12 },
  { name: 'Ghoul', char: 'G', color: '#aabb88', element: 'dark', stats: { hp: 26, maxHp: 26, attack: 11, defense: 4, speed: 8 }, xpValue: 22, minFloor: 4, lootChance: 0.25,
    abilities: [{ type: 'stunAttack', chance: 0.2 }, { type: 'drainLife', percent: 20, chance: 0.25 }], aggroRange: 8 },
  { name: 'Harpy', char: 'Y', color: '#dd88aa', element: 'lightning', stats: { hp: 18, maxHp: 18, attack: 10, defense: 2, speed: 15 }, xpValue: 20, minFloor: 4, lootChance: 0.2,
    abilities: [{ type: 'dodge', chance: 0.35 }, { type: 'bleedAttack', damage: 2, turns: 3, chance: 0.25 }], attackRange: 3, projectileChar: '~', projectileColor: '#dd88aa', aggroRange: 12 },
  { name: 'Animated Armor', char: 'A', color: '#ccccdd', element: 'holy', stats: { hp: 34, maxHp: 34, attack: 9, defense: 11, speed: 3 }, xpValue: 24, minFloor: 4, lootChance: 0.3,
    abilities: [{ type: 'enrage', hpThreshold: 0.35, atkMultiplier: 1.5 }], aggroRange: 5 },
  { name: 'Carrion Worm', char: 'w', color: '#998866', element: 'poison', stats: { hp: 28, maxHp: 28, attack: 10, defense: 5, speed: 4 }, xpValue: 18, minFloor: 4, lootChance: 0.2,
    abilities: [{ type: 'poisonAttack', damage: 2, turns: 4, chance: 0.35 }], aggroRange: 5 },

  // ══════════ FLOOR 5: Mid game ══════════
  { name: 'Orc', char: 'o', color: '#7daa3e', element: 'fire', stats: { hp: 28, maxHp: 28, attack: 11, defense: 5, speed: 6 }, xpValue: 30, minFloor: 5, lootChance: 0.35,
    abilities: [{ type: 'chargeAttack', multiplier: 1.9, chance: 0.25 }, { type: 'enrage', hpThreshold: 0.3, atkMultiplier: 1.7 }], aggroRange: 7 },
  { name: 'Zombie', char: 'Z', color: '#a0cc44', element: 'dark', stats: { hp: 36, maxHp: 36, attack: 9, defense: 7, speed: 3 }, xpValue: 25, minFloor: 5, lootChance: 0.2,
    abilities: [{ type: 'selfHeal', amount: 6, hpThreshold: 0.55, cooldown: 3 }], aggroRange: 5 },
  { name: 'Dark Elf', char: 'e', color: '#9966cc', element: 'dark', stats: { hp: 24, maxHp: 24, attack: 13, defense: 4, speed: 11 }, xpValue: 30, minFloor: 5, lootChance: 0.35,
    abilities: [{ type: 'dodge', chance: 0.3 }, { type: 'bleedAttack', damage: 2, turns: 4, chance: 0.25 }], attackRange: 4, projectileChar: '→', projectileColor: '#9966cc', aggroRange: 11 },
  { name: 'Wyvern', char: 'W', color: '#ddaa44', element: 'lightning', stats: { hp: 30, maxHp: 30, attack: 14, defense: 5, speed: 12 }, xpValue: 32, minFloor: 5, lootChance: 0.3,
    abilities: [{ type: 'chargeAttack', multiplier: 1.7, chance: 0.25 }, { type: 'poisonAttack', damage: 2, turns: 3, chance: 0.25 }], attackRange: 4, projectileChar: '*', projectileColor: '#ddaa44', aggroRange: 12 },
  { name: 'Orc Brute', char: 'O', color: '#558833', element: 'fire', stats: { hp: 38, maxHp: 38, attack: 14, defense: 7, speed: 4 }, xpValue: 35, minFloor: 5, lootChance: 0.35,
    abilities: [{ type: 'chargeAttack', multiplier: 2.0, chance: 0.2 }, { type: 'stunAttack', chance: 0.15 }], aggroRange: 6 },
  { name: 'Imp', char: 'i', color: '#ff6644', element: 'fire', stats: { hp: 16, maxHp: 16, attack: 10, defense: 2, speed: 15 }, xpValue: 20, minFloor: 5, lootChance: 0.2,
    abilities: [{ type: 'dodge', chance: 0.35 }, { type: 'callForHelp', monsterName: 'Imp', chance: 0.2, cooldown: 6 }], attackRange: 3, projectileChar: '*', projectileColor: '#ff6644', aggroRange: 12 },
  { name: 'Gargoyle', char: 'G', color: '#999999', element: 'holy', stats: { hp: 42, maxHp: 42, attack: 11, defense: 12, speed: 2 }, xpValue: 28, minFloor: 5, lootChance: 0.3,
    abilities: [{ type: 'selfHeal', amount: 7, hpThreshold: 0.45, cooldown: 4 }], aggroRange: 5 },
  { name: 'Specter', char: 'S', color: '#bbbbdd', element: 'dark', stats: { hp: 20, maxHp: 20, attack: 12, defense: 2, speed: 13 }, xpValue: 26, minFloor: 5, lootChance: 0.25,
    abilities: [{ type: 'drainLife', percent: 25, chance: 0.3 }, { type: 'dodge', chance: 0.25 }], attackRange: 3, projectileChar: '~', projectileColor: '#bbbbdd', aggroRange: 12 },

  // ══════════ FLOOR 6: Mid-late ══════════
  { name: 'Basilisk', char: 'B', color: '#66cc44', element: 'poison', stats: { hp: 38, maxHp: 38, attack: 17, defense: 6, speed: 7 }, xpValue: 45, minFloor: 6, lootChance: 0.35,
    abilities: [{ type: 'stunAttack', chance: 0.3 }, { type: 'poisonAttack', damage: 3, turns: 3, chance: 0.25 }], aggroRange: 7 },
  { name: 'Bone Knight', char: 'K', color: '#ddddff', element: 'dark', stats: { hp: 35, maxHp: 35, attack: 14, defense: 10, speed: 6 }, xpValue: 40, minFloor: 6, lootChance: 0.35,
    abilities: [{ type: 'bleedAttack', damage: 3, turns: 4, chance: 0.3 }, { type: 'enrage', hpThreshold: 0.35, atkMultiplier: 1.5 }], aggroRange: 8 },
  { name: 'Plague Bearer', char: 'P', color: '#88cc22', element: 'poison', stats: { hp: 30, maxHp: 30, attack: 10, defense: 5, speed: 7 }, xpValue: 38, minFloor: 6, lootChance: 0.35,
    abilities: [{ type: 'poisonAttack', damage: 4, turns: 5, chance: 0.45 }], attackRange: 3, projectileChar: '•', projectileColor: '#88cc22', aggroRange: 8 },
  { name: 'Cockatrice', char: 'C', color: '#ddcc44', element: 'lightning', stats: { hp: 26, maxHp: 26, attack: 13, defense: 4, speed: 11 }, xpValue: 35, minFloor: 6, lootChance: 0.3,
    abilities: [{ type: 'stunAttack', chance: 0.35 }], aggroRange: 9 },
  { name: 'Ogre', char: 'O', color: '#88aa55', element: 'fire', stats: { hp: 48, maxHp: 48, attack: 16, defense: 6, speed: 3 }, xpValue: 42, minFloor: 6, lootChance: 0.35,
    abilities: [{ type: 'chargeAttack', multiplier: 2.0, chance: 0.25 }, { type: 'enrage', hpThreshold: 0.3, atkMultiplier: 1.6 }], aggroRange: 6 },
  { name: 'Banshee', char: 'B', color: '#ccbbff', element: 'dark', stats: { hp: 22, maxHp: 22, attack: 15, defense: 3, speed: 12 }, xpValue: 38, minFloor: 6, lootChance: 0.3,
    abilities: [{ type: 'stunAttack', chance: 0.25 }, { type: 'drainLife', percent: 20, chance: 0.25 }], attackRange: 4, projectileChar: '~', projectileColor: '#ccbbff', aggroRange: 11 },
  { name: 'Phase Spider', char: 'S', color: '#7799cc', element: 'poison', stats: { hp: 24, maxHp: 24, attack: 14, defense: 3, speed: 14 }, xpValue: 34, minFloor: 6, lootChance: 0.3,
    abilities: [{ type: 'dodge', chance: 0.4 }, { type: 'poisonAttack', damage: 3, turns: 3, chance: 0.3 }], aggroRange: 10 },
  { name: 'Flesh Golem', char: 'F', color: '#bb8877', element: 'dark', stats: { hp: 50, maxHp: 50, attack: 12, defense: 9, speed: 3 }, xpValue: 38, minFloor: 6, lootChance: 0.35,
    abilities: [{ type: 'selfHeal', amount: 8, hpThreshold: 0.5, cooldown: 3 }, { type: 'enrage', hpThreshold: 0.25, atkMultiplier: 1.7 }], aggroRange: 5 },

  // ══════════ FLOOR 7: Late ══════════
  { name: 'Wraith', char: 'W', color: '#c49eff', element: 'dark', stats: { hp: 24, maxHp: 24, attack: 13, defense: 4, speed: 10 }, xpValue: 40, minFloor: 7, lootChance: 0.4,
    abilities: [{ type: 'drainLife', percent: 25, chance: 0.3 }, { type: 'dodge', chance: 0.25 }], aggroRange: 11 },
  { name: 'Golem', char: 'O', color: '#aa8866', element: 'holy', stats: { hp: 65, maxHp: 65, attack: 13, defense: 14, speed: 2 }, xpValue: 55, minFloor: 7, lootChance: 0.4,
    abilities: [{ type: 'chargeAttack', multiplier: 2.0, chance: 0.2 }, { type: 'selfHeal', amount: 10, hpThreshold: 0.45, cooldown: 5 }], aggroRange: 5 },
  { name: 'Chimera', char: 'C', color: '#ff9944', element: 'ice', stats: { hp: 44, maxHp: 44, attack: 16, defense: 6, speed: 9 }, xpValue: 50, minFloor: 7, lootChance: 0.4,
    abilities: [{ type: 'poisonAttack', damage: 3, turns: 3, chance: 0.25 }, { type: 'chargeAttack', multiplier: 1.6, chance: 0.25 }, { type: 'freezeAttack', chance: 0.15, turns: 2 }], aggroRange: 9 },
  { name: 'Lich Acolyte', char: 'L', color: '#aa88dd', element: 'dark', stats: { hp: 28, maxHp: 28, attack: 17, defense: 4, speed: 9 }, xpValue: 48, minFloor: 7, lootChance: 0.4,
    abilities: [{ type: 'drainLife', percent: 25, chance: 0.35 }, { type: 'callForHelp', monsterName: 'Skeleton', chance: 0.2, cooldown: 5 }], attackRange: 5, projectileChar: '*', projectileColor: '#aa88dd', aggroRange: 10 },
  { name: 'Minotaur', char: 'M', color: '#bb5533', element: 'fire', stats: { hp: 52, maxHp: 52, attack: 17, defense: 7, speed: 6 }, xpValue: 55, minFloor: 7, lootChance: 0.4,
    abilities: [{ type: 'chargeAttack', multiplier: 2.2, chance: 0.3 }, { type: 'enrage', hpThreshold: 0.35, atkMultiplier: 1.6 }], aggroRange: 7 },
  { name: 'Naga', char: 'N', color: '#44bbaa', element: 'poison', stats: { hp: 35, maxHp: 35, attack: 15, defense: 5, speed: 11 }, xpValue: 45, minFloor: 7, lootChance: 0.35,
    abilities: [{ type: 'poisonAttack', damage: 3, turns: 4, chance: 0.35 }, { type: 'stunAttack', chance: 0.2 }], attackRange: 4, projectileChar: '•', projectileColor: '#44bbaa', aggroRange: 9 },
  { name: 'Shadow Hound', char: 'h', color: '#5533aa', element: 'dark', stats: { hp: 26, maxHp: 26, attack: 14, defense: 3, speed: 15 }, xpValue: 40, minFloor: 7, lootChance: 0.3,
    abilities: [{ type: 'chargeAttack', multiplier: 1.6, chance: 0.35 }, { type: 'dodge', chance: 0.25 }], aggroRange: 13 },
  { name: 'Stone Sentinel', char: 'S', color: '#aabb99', element: 'holy', stats: { hp: 70, maxHp: 70, attack: 12, defense: 16, speed: 1 }, xpValue: 48, minFloor: 7, lootChance: 0.4,
    abilities: [{ type: 'selfHeal', amount: 10, hpThreshold: 0.35, cooldown: 4 }], aggroRange: 4 },

  // ══════════ FLOOR 8: Late game ══════════
  { name: 'Troll', char: 'T', color: '#40c880', element: 'poison', stats: { hp: 52, maxHp: 52, attack: 15, defense: 8, speed: 5 }, xpValue: 60, minFloor: 8, lootChance: 0.45,
    abilities: [{ type: 'selfHeal', amount: 8, hpThreshold: 0.6, cooldown: 2 }, { type: 'enrage', hpThreshold: 0.3, atkMultiplier: 1.9 }], aggroRange: 6 },
  { name: 'Vampire', char: 'V', color: '#cc2244', element: 'dark', stats: { hp: 36, maxHp: 36, attack: 15, defense: 5, speed: 12 }, xpValue: 50, minFloor: 8, lootChance: 0.45,
    abilities: [{ type: 'drainLife', percent: 30, chance: 0.35 }, { type: 'dodge', chance: 0.2 }], aggroRange: 12 },
  { name: 'Manticore', char: 'M', color: '#dd7744', element: 'poison', stats: { hp: 44, maxHp: 44, attack: 17, defense: 6, speed: 11 }, xpValue: 55, minFloor: 8, lootChance: 0.4,
    abilities: [{ type: 'poisonAttack', damage: 3, turns: 4, chance: 0.35 }, { type: 'chargeAttack', multiplier: 1.8, chance: 0.25 }], attackRange: 4, projectileChar: '→', projectileColor: '#dd7744', aggroRange: 11 },
  { name: 'Hydra', char: 'H', color: '#44aa66', element: 'poison', stats: { hp: 70, maxHp: 70, attack: 15, defense: 8, speed: 5 }, xpValue: 65, minFloor: 8, lootChance: 0.45,
    abilities: [{ type: 'selfHeal', amount: 10, hpThreshold: 0.55, cooldown: 2 }, { type: 'poisonAttack', damage: 3, turns: 4, chance: 0.3 }], aggroRange: 6 },
  { name: 'Iron Golem', char: 'I', color: '#8899aa', element: 'lightning', stats: { hp: 75, maxHp: 75, attack: 14, defense: 18, speed: 2 }, xpValue: 60, minFloor: 8, lootChance: 0.45,
    abilities: [{ type: 'chargeAttack', multiplier: 2.2, chance: 0.15 }], aggroRange: 4 },
  { name: 'Werewolf', char: 'W', color: '#aa8855', element: 'dark', stats: { hp: 38, maxHp: 38, attack: 17, defense: 5, speed: 14 }, xpValue: 52, minFloor: 8, lootChance: 0.4,
    abilities: [{ type: 'chargeAttack', multiplier: 1.6, chance: 0.3 }, { type: 'enrage', hpThreshold: 0.35, atkMultiplier: 1.7 }, { type: 'bleedAttack', damage: 3, turns: 4, chance: 0.25 }], aggroRange: 13 },
  { name: 'Dread Spider', char: 'D', color: '#553388', element: 'poison', stats: { hp: 34, maxHp: 34, attack: 16, defense: 4, speed: 13 }, xpValue: 48, minFloor: 8, lootChance: 0.4,
    abilities: [{ type: 'poisonAttack', damage: 4, turns: 4, chance: 0.4 }, { type: 'dodge', chance: 0.25 }], aggroRange: 10 },
  { name: 'War Troll', char: 'T', color: '#338866', element: 'poison', stats: { hp: 60, maxHp: 60, attack: 17, defense: 10, speed: 4 }, xpValue: 62, minFloor: 8, lootChance: 0.45,
    abilities: [{ type: 'selfHeal', amount: 10, hpThreshold: 0.55, cooldown: 3 }, { type: 'chargeAttack', multiplier: 2.0, chance: 0.2 }], aggroRange: 6 },

  // ══════════ FLOOR 9: End game ══════════
  { name: 'Demon', char: 'D', color: '#ff3300', element: 'fire', stats: { hp: 58, maxHp: 58, attack: 20, defense: 9, speed: 9 }, xpValue: 75, minFloor: 9, lootChance: 0.5,
    abilities: [{ type: 'chargeAttack', multiplier: 2.0, chance: 0.25 }, { type: 'enrage', hpThreshold: 0.35, atkMultiplier: 1.8 }, { type: 'stunAttack', chance: 0.15 }], aggroRange: 10 },
  { name: 'Behemoth', char: 'B', color: '#886644', element: 'holy', stats: { hp: 90, maxHp: 90, attack: 20, defense: 12, speed: 3 }, xpValue: 80, minFloor: 9, lootChance: 0.5,
    abilities: [{ type: 'chargeAttack', multiplier: 2.2, chance: 0.25 }, { type: 'enrage', hpThreshold: 0.25, atkMultiplier: 2.0 }], aggroRange: 6 },
  { name: 'Mind Flayer', char: 'M', color: '#bb66dd', element: 'dark', stats: { hp: 38, maxHp: 38, attack: 19, defense: 5, speed: 10 }, xpValue: 70, minFloor: 9, lootChance: 0.5,
    abilities: [{ type: 'stunAttack', chance: 0.3 }, { type: 'drainLife', percent: 25, chance: 0.3 }], attackRange: 5, projectileChar: '~', projectileColor: '#bb66dd', aggroRange: 10 },
  { name: 'Blood Golem', char: 'B', color: '#cc3344', element: 'dark', stats: { hp: 58, maxHp: 58, attack: 16, defense: 10, speed: 4 }, xpValue: 65, minFloor: 9, lootChance: 0.45,
    abilities: [{ type: 'drainLife', percent: 30, chance: 0.35 }, { type: 'selfHeal', amount: 10, hpThreshold: 0.45, cooldown: 4 }], aggroRange: 5 },
  { name: 'Shadow Dragon', char: 'D', color: '#6644bb', element: 'dark', stats: { hp: 70, maxHp: 70, attack: 22, defense: 10, speed: 8 }, xpValue: 85, minFloor: 9, lootChance: 0.5,
    abilities: [{ type: 'freezeAttack', chance: 0.25, turns: 2 }, { type: 'chargeAttack', multiplier: 2.0, chance: 0.2 }], attackRange: 5, projectileChar: '*', projectileColor: '#6644bb', aggroRange: 12 },
  { name: 'Bone Colossus', char: 'C', color: '#eeeeff', element: 'dark', stats: { hp: 82, maxHp: 82, attack: 18, defense: 14, speed: 3 }, xpValue: 72, minFloor: 9, lootChance: 0.5,
    abilities: [{ type: 'callForHelp', monsterName: 'Skeleton', chance: 0.25, cooldown: 5 }, { type: 'enrage', hpThreshold: 0.3, atkMultiplier: 1.7 }], attackRange: 4, projectileChar: '•', projectileColor: '#eeeeff', aggroRange: 7 },

  // ══════════ FLOOR 10+: Endgame elite ══════════
  { name: 'Dragon', char: 'D', color: '#ff5522', element: 'fire', stats: { hp: 78, maxHp: 78, attack: 22, defense: 12, speed: 8 }, xpValue: 100, minFloor: 10, lootChance: 0.6,
    abilities: [{ type: 'chargeAttack', multiplier: 2.2, chance: 0.25 }, { type: 'freezeAttack', chance: 0.2, turns: 2 }, { type: 'enrage', hpThreshold: 0.25, atkMultiplier: 2.0 }], attackRange: 4, projectileChar: '*', projectileColor: '#ff5522', aggroRange: 12 },
  { name: 'Death Knight', char: 'N', color: '#4444aa', element: 'dark', stats: { hp: 65, maxHp: 65, attack: 19, defense: 11, speed: 7 }, xpValue: 80, minFloor: 10, lootChance: 0.5,
    abilities: [{ type: 'drainLife', percent: 25, chance: 0.35 }, { type: 'bleedAttack', damage: 4, turns: 4, chance: 0.3 }, { type: 'selfHeal', amount: 12, hpThreshold: 0.35, cooldown: 6 }], aggroRange: 9 },
  { name: 'Ancient Wyrm', char: 'W', color: '#ffaa33', element: 'fire', stats: { hp: 100, maxHp: 100, attack: 25, defense: 14, speed: 7 }, xpValue: 120, minFloor: 10, lootChance: 0.6,
    abilities: [{ type: 'chargeAttack', multiplier: 2.2, chance: 0.25 }, { type: 'enrage', hpThreshold: 0.25, atkMultiplier: 2.0 }, { type: 'stunAttack', chance: 0.15 }], attackRange: 5, projectileChar: '*', projectileColor: '#ffaa33', aggroRange: 12 },
  { name: 'Devourer', char: 'D', color: '#992244', element: 'dark', stats: { hp: 70, maxHp: 70, attack: 22, defense: 9, speed: 10 }, xpValue: 90, minFloor: 10, lootChance: 0.5,
    abilities: [{ type: 'drainLife', percent: 35, chance: 0.35 }, { type: 'bleedAttack', damage: 4, turns: 5, chance: 0.3 }], aggroRange: 10 },
  { name: 'Titan', char: 'T', color: '#ccaa66', element: 'holy', stats: { hp: 115, maxHp: 115, attack: 19, defense: 16, speed: 3 }, xpValue: 100, minFloor: 10, lootChance: 0.55,
    abilities: [{ type: 'chargeAttack', multiplier: 2.5, chance: 0.2 }, { type: 'selfHeal', amount: 15, hpThreshold: 0.35, cooldown: 5 }], aggroRange: 6 },
  { name: 'Void Walker', char: 'V', color: '#8855cc', element: 'dark', stats: { hp: 52, maxHp: 52, attack: 24, defense: 6, speed: 13 }, xpValue: 95, minFloor: 10, lootChance: 0.5,
    abilities: [{ type: 'dodge', chance: 0.3 }, { type: 'freezeAttack', chance: 0.25, turns: 2 }, { type: 'drainLife', percent: 20, chance: 0.25 }], attackRange: 5, projectileChar: '•', projectileColor: '#8855cc', aggroRange: 13 },
  { name: 'Arch Demon', char: 'A', color: '#ff2200', element: 'fire', stats: { hp: 82, maxHp: 82, attack: 26, defense: 11, speed: 9 }, xpValue: 110, minFloor: 10, lootChance: 0.55,
    abilities: [{ type: 'chargeAttack', multiplier: 2.0, chance: 0.25 }, { type: 'enrage', hpThreshold: 0.25, atkMultiplier: 2.0 }, { type: 'callForHelp', monsterName: 'Demon', chance: 0.15, cooldown: 6 }], attackRange: 5, projectileChar: '*', projectileColor: '#ff2200', aggroRange: 11 },

  // ══════════ Environmental attack monsters ══════════
  { name: 'Fire Elemental', char: 'F', color: '#ff6611', element: 'fire', stats: { hp: 28, maxHp: 28, attack: 11, defense: 4, speed: 8 }, xpValue: 40, minFloor: 5, lootChance: 0.35, terrainOnHit: { terrain: 'lava', radius: 2, chance: 0.5 },
    abilities: [{ type: 'enrage', hpThreshold: 0.25, atkMultiplier: 1.5 }], aggroRange: 9 },
  { name: 'Storm Wisp', char: 'w', color: '#44ddff', element: 'lightning', stats: { hp: 14, maxHp: 14, attack: 9, defense: 2, speed: 14 }, xpValue: 30, minFloor: 4, lootChance: 0.25, terrainOnHit: { terrain: 'water', radius: 2, chance: 0.45 },
    abilities: [{ type: 'stunAttack', chance: 0.2 }, { type: 'dodge', chance: 0.2 }], attackRange: 3, projectileChar: '~', projectileColor: '#44ddff', aggroRange: 12 },
  { name: 'Poison Spitter', char: 'p', color: '#33cc11', element: 'poison', stats: { hp: 18, maxHp: 18, attack: 7, defense: 3, speed: 7 }, xpValue: 25, minFloor: 3, lootChance: 0.3, terrainOnHit: { terrain: 'poison', radius: 2, chance: 0.5 },
    abilities: [{ type: 'poisonAttack', damage: 2, turns: 4, chance: 0.35 }], attackRange: 4, projectileChar: '•', projectileColor: '#33cc11', aggroRange: 8 },
  { name: 'Frost Wraith', char: 'f', color: '#aaeeff', element: 'ice', stats: { hp: 22, maxHp: 22, attack: 10, defense: 3, speed: 10 }, xpValue: 35, minFloor: 5, lootChance: 0.3, terrainOnHit: { terrain: 'ice', radius: 2, chance: 0.45 },
    abilities: [{ type: 'freezeAttack', chance: 0.25, turns: 2 }], attackRange: 4, projectileChar: '*', projectileColor: '#aaeeff', aggroRange: 10 },
  { name: 'Shadow Stalker', char: 'h', color: '#7744aa', element: 'dark', stats: { hp: 20, maxHp: 20, attack: 13, defense: 2, speed: 12 }, xpValue: 40, minFloor: 6, lootChance: 0.35, terrainOnHit: { terrain: 'shadow', radius: 2, chance: 0.4 },
    abilities: [{ type: 'dodge', chance: 0.3 }, { type: 'chargeAttack', multiplier: 1.8, chance: 0.15 }], aggroRange: 12 },
  { name: 'Mud Crawler', char: 'c', color: '#aa7733', element: 'poison', stats: { hp: 35, maxHp: 35, attack: 8, defense: 8, speed: 3 }, xpValue: 30, minFloor: 4, lootChance: 0.25, terrainOnHit: { terrain: 'mud', radius: 2, chance: 0.55 },
    abilities: [{ type: 'selfHeal', amount: 5, hpThreshold: 0.5, cooldown: 5 }], aggroRange: 4 },
  { name: 'Magma Serpent', char: 'S', color: '#ff7722', element: 'fire', stats: { hp: 32, maxHp: 32, attack: 12, defense: 5, speed: 7 }, xpValue: 42, minFloor: 7, lootChance: 0.35, terrainOnHit: { terrain: 'lava', radius: 2, chance: 0.4 },
    abilities: [{ type: 'chargeAttack', multiplier: 1.6, chance: 0.2 }], attackRange: 4, projectileChar: '*', projectileColor: '#ff7722', aggroRange: 9 },
  { name: 'Thunder Elemental', char: 'T', color: '#ffff55', element: 'lightning', stats: { hp: 25, maxHp: 25, attack: 14, defense: 3, speed: 13 }, xpValue: 45, minFloor: 7, lootChance: 0.35, terrainOnHit: { terrain: 'water', radius: 2, chance: 0.4 },
    abilities: [{ type: 'stunAttack', chance: 0.25 }], attackRange: 4, projectileChar: '~', projectileColor: '#ffff55', aggroRange: 11 },
  { name: 'Toxic Hulk', char: 'H', color: '#44bb22', element: 'poison', stats: { hp: 45, maxHp: 45, attack: 10, defense: 7, speed: 3 }, xpValue: 48, minFloor: 8, lootChance: 0.4, terrainOnHit: { terrain: 'poison', radius: 3, chance: 0.5 },
    abilities: [{ type: 'poisonAttack', damage: 3, turns: 5, chance: 0.3 }, { type: 'selfHeal', amount: 6, hpThreshold: 0.4, cooldown: 5 }], aggroRange: 5 },
];

// ── Boss definitions ──
export const BOSS_DEFS: MonsterDef[] = [
  { name: 'Goblin King', char: 'K', color: '#44ff44', element: 'poison', stats: { hp: 60, maxHp: 60, attack: 10, defense: 5, speed: 7 }, xpValue: 100, minFloor: 3, lootChance: 1.0, isBoss: true, bossAbility: { type: 'summon', monsterName: 'Goblin', count: 2, cooldown: 5 }, guaranteedLoot: 'Crown of the Goblin King' },
  { name: 'Stone Guardian', char: 'G', color: '#bbaa88', element: 'holy', stats: { hp: 130, maxHp: 130, attack: 15, defense: 16, speed: 3 }, xpValue: 180, minFloor: 5, lootChance: 1.0, isBoss: true, bossAbility: { type: 'aoe', damage: 10, radius: 2, cooldown: 3 }, guaranteedLoot: 'Guardian Core' },
  { name: 'Vampire Lord', char: 'V', color: '#ff1133', element: 'dark', stats: { hp: 105, maxHp: 105, attack: 22, defense: 8, speed: 13 }, xpValue: 250, minFloor: 7, lootChance: 1.0, isBoss: true, bossAbility: { type: 'multi', abilities: [{ type: 'heal', amount: 20, cooldown: 5 }, { type: 'teleport', cooldown: 3 }] }, guaranteedLoot: 'Crimson Fang' },
  { name: 'Abyssal Worm', char: 'W', color: '#6633aa', element: 'dark', stats: { hp: 190, maxHp: 190, attack: 28, defense: 12, speed: 6 }, xpValue: 400, minFloor: 9, lootChance: 1.0, isBoss: true, bossAbility: { type: 'multi', abilities: [{ type: 'rage', hpThreshold: 0.35, atkMultiplier: 2.0 }, { type: 'aoe', damage: 15, radius: 3, cooldown: 4 }] }, guaranteedLoot: 'Abyssal Eye' },
  { name: 'Lich Emperor', char: 'L', color: '#cc00ff', element: 'dark', stats: { hp: 250, maxHp: 250, attack: 34, defense: 14, speed: 9 }, xpValue: 600, minFloor: 12, lootChance: 1.0, isBoss: true, bossAbility: { type: 'multi', abilities: [{ type: 'summon', monsterName: 'Skeleton', count: 3, cooldown: 5 }, { type: 'heal', amount: 30, cooldown: 7 }, { type: 'teleport', cooldown: 4 }] }, guaranteedLoot: 'Crown of the Lich' },
];

// ── Item templates ──
export const WEAPON_TEMPLATES: Omit<Item, 'id'>[] = [
  { name: 'Rusty Dagger', type: 'weapon', char: ')', color: '#d4975a', value: 5, equipSlot: 'weapon', statBonus: { attack: 2 }, description: 'A worn dagger' },
  { name: 'Short Sword', type: 'weapon', char: ')', color: '#d0d0e8', value: 15, equipSlot: 'weapon', statBonus: { attack: 3 }, description: 'A short blade' },
  { name: 'Long Sword', type: 'weapon', char: ')', color: '#ffe44d', value: 30, equipSlot: 'weapon', statBonus: { attack: 5 }, description: 'A fine sword' },
  { name: 'War Axe', type: 'weapon', char: ')', color: '#e83838', value: 50, equipSlot: 'weapon', statBonus: { attack: 8 }, description: 'A heavy axe' },
  { name: 'Magic Blade', type: 'weapon', char: ')', color: '#44ffff', value: 80, equipSlot: 'weapon', statBonus: { attack: 12 }, description: 'Glows faintly' },
  // New weapons with effects
  { name: 'Poisoned Stiletto', type: 'weapon', char: ')', color: '#55cc22', value: 20, equipSlot: 'weapon', element: 'poison', statBonus: { attack: 3, speed: 2 }, description: 'Coated in venom', onHitEffect: { type: 'poison', damage: 2, turns: 3 } },
  { name: 'Flaming Mace', type: 'weapon', char: ')', color: '#ff8833', value: 45, equipSlot: 'weapon', element: 'fire', statBonus: { attack: 6 }, description: 'Burns on impact', onHitEffect: { type: 'fireball', damage: 5, chance: 0.25 } },
  { name: 'Frost Hammer', type: 'weapon', char: ')', color: '#88ccff', value: 55, equipSlot: 'weapon', element: 'ice', statBonus: { attack: 7, defense: 1 }, description: 'Chills to the bone', onHitEffect: { type: 'freeze', chance: 0.2, turns: 2 } },
  { name: 'Vampire Fang Blade', type: 'weapon', char: ')', color: '#cc1144', value: 65, equipSlot: 'weapon', element: 'dark', statBonus: { attack: 9 }, description: 'Drains life on hit', onHitEffect: { type: 'lifesteal', percent: 15 } },
  { name: 'Executioner Greataxe', type: 'weapon', char: ')', color: '#aa2222', value: 75, equipSlot: 'weapon', statBonus: { attack: 11 }, description: 'Cleaves the weak', onHitEffect: { type: 'execute', hpThreshold: 0.2, chance: 0.3 } },
  { name: 'Thunderbrand', type: 'weapon', char: ')', color: '#ffff33', value: 90, equipSlot: 'weapon', element: 'lightning', statBonus: { attack: 13, speed: 2 }, description: 'Crackles with lightning', onHitEffect: { type: 'stun', chance: 0.15 } },
  { name: 'Abyssal Cleaver', type: 'weapon', char: ')', color: '#8844cc', value: 110, equipSlot: 'weapon', element: 'dark', statBonus: { attack: 16 }, description: 'Forged in the abyss', onHitEffect: { type: 'bleed', damage: 3, turns: 4 } },
  // Ranged weapons
  { name: 'Short Bow', type: 'weapon', char: '}', color: '#c8a050', value: 12, equipSlot: 'weapon', statBonus: { attack: 2 }, description: 'Attack from 3 tiles away', range: 3 },
  { name: 'Long Bow', type: 'weapon', char: '}', color: '#d4b060', value: 35, equipSlot: 'weapon', statBonus: { attack: 5 }, description: 'Attack from 5 tiles away', range: 5 },
  { name: 'Crossbow', type: 'weapon', char: '}', color: '#aaaacc', value: 55, equipSlot: 'weapon', statBonus: { attack: 8 }, description: 'Powerful ranged weapon (4 range)', range: 4 },
  { name: 'Throwing Knives', type: 'weapon', char: '}', color: '#ccccdd', value: 18, equipSlot: 'weapon', statBonus: { attack: 2, speed: 3 }, description: 'Fast and deadly at range', range: 3 },
  { name: 'Wooden Staff', type: 'weapon', char: '/', color: '#aa8855', value: 8, equipSlot: 'weapon', statBonus: { attack: 2 }, description: 'A simple staff that channels magic at range', range: 3 },
  { name: 'Fire Staff', type: 'weapon', char: '/', color: '#ff6622', value: 45, equipSlot: 'weapon', element: 'fire', statBonus: { attack: 4 }, description: 'Shoots fireballs from afar', range: 4, onHitEffect: { type: 'fireball', damage: 5, chance: 0.3 } },
  { name: 'Ice Staff', type: 'weapon', char: '/', color: '#66bbff', value: 45, equipSlot: 'weapon', element: 'ice', statBonus: { attack: 4 }, description: 'Freezes enemies at range', range: 4, onHitEffect: { type: 'freeze', chance: 0.25, turns: 2 } },
  { name: 'Elven Bow', type: 'weapon', char: '}', color: '#55dd77', value: 70, equipSlot: 'weapon', statBonus: { attack: 9, speed: 2 }, description: 'Elegant and deadly (6 range)', range: 6 },
  { name: 'Thunder Staff', type: 'weapon', char: '/', color: '#ffee33', value: 85, equipSlot: 'weapon', element: 'lightning', statBonus: { attack: 10 }, description: 'Lightning strikes from afar', range: 5, onHitEffect: { type: 'stun', chance: 0.15 } },
  { name: 'Shadow Bow', type: 'weapon', char: '}', color: '#8844aa', value: 100, equipSlot: 'weapon', element: 'dark', statBonus: { attack: 12 }, description: 'Arrows from the void', range: 5, onHitEffect: { type: 'bleed', damage: 2, turns: 3 } },
];

// ── Ranger-exclusive ranged weapons ──
// These can only be equipped by Rangers — powerful bows that reward the ranged playstyle.
export const RANGER_WEAPON_TEMPLATES: Omit<Item, 'id'>[] = [
  { name: 'Hunting Bow', type: 'weapon', char: '}', color: '#88aa44', value: 22, equipSlot: 'weapon', statBonus: { attack: 3, speed: 1 }, description: 'A ranger\'s trusted hunting bow', range: 4, classRestriction: ['ranger'] },
  { name: 'Viper Bow', type: 'weapon', char: '}', color: '#55cc22', value: 40, equipSlot: 'weapon', element: 'poison', statBonus: { attack: 5 }, description: 'Coated arrows that poison on hit', range: 4, classRestriction: ['ranger'], onHitEffect: { type: 'poison', damage: 2, turns: 3 } },
  { name: 'Gale Bow', type: 'weapon', char: '}', color: '#44ddcc', value: 55, equipSlot: 'weapon', statBonus: { attack: 6, speed: 3 }, description: 'Shoots arrows as fast as the wind', range: 5, classRestriction: ['ranger'] },
  { name: 'Flame Bow', type: 'weapon', char: '}', color: '#ff7722', value: 60, equipSlot: 'weapon', element: 'fire', statBonus: { attack: 7 }, description: 'Sets arrows ablaze on release', range: 5, classRestriction: ['ranger'], onHitEffect: { type: 'fireball', damage: 4, chance: 0.25 } },
  { name: 'Frost Bow', type: 'weapon', char: '}', color: '#88ddff', value: 65, equipSlot: 'weapon', element: 'ice', statBonus: { attack: 7, defense: 1 }, description: 'Arrows that freeze on impact', range: 5, classRestriction: ['ranger'], onHitEffect: { type: 'freeze', chance: 0.2, turns: 2 } },
  { name: 'Warden\'s Longbow', type: 'weapon', char: '}', color: '#33cc66', value: 80, equipSlot: 'weapon', statBonus: { attack: 10, speed: 2 }, description: 'The weapon of a forest guardian', range: 6, classRestriction: ['ranger'] },
  { name: 'Deathmark Bow', type: 'weapon', char: '}', color: '#cc2244', value: 95, equipSlot: 'weapon', element: 'dark', statBonus: { attack: 11 }, description: 'Marked targets bleed out quickly', range: 5, classRestriction: ['ranger'], onHitEffect: { type: 'bleed', damage: 3, turns: 4 } },
  { name: 'Stormcaller Bow', type: 'weapon', char: '}', color: '#ffee33', value: 110, equipSlot: 'weapon', element: 'lightning', statBonus: { attack: 14, speed: 2 }, description: 'Each arrow carries a thunderclap', range: 6, classRestriction: ['ranger'], onHitEffect: { type: 'stun', chance: 0.15 } },
];

// Unique tutorial reward — granted once to all classes on completing the onboarding
export const ANCESTORS_FANG: Omit<Item, 'id'> = {
  name: "Ancestor's Fang",
  type: 'weapon',
  char: ')',
  color: '#c49eff',
  value: 60,
  equipSlot: 'weapon',
  rarity: 'mythic',
  statBonus: { attack: 6 },
  description: 'A blade passed down through the bloodline. Each kill sates your hunger.',
  onHitEffect: { type: 'hungersteal', amount: 4 },
};

// Boss drop weapons (found via boss guaranteed loot, not random drops)
export const BOSS_LOOT_TEMPLATES: Omit<Item, 'id'>[] = [
  { name: 'Crown of the Goblin King', type: 'armor', char: '[', color: '#44ff44', value: 40, equipSlot: 'armor', statBonus: { defense: 5, attack: 2 }, description: 'Inspires fear in goblins' },
  { name: 'Guardian Core', type: 'armor', char: '[', color: '#bbaa88', value: 85, equipSlot: 'armor', statBonus: { defense: 12, maxHp: 15 }, description: 'A living stone shield' },
  { name: 'Crimson Fang', type: 'weapon', char: ')', color: '#ff1133', value: 100, equipSlot: 'weapon', statBonus: { attack: 16, speed: 3 }, description: 'Taken from the Vampire Lord', onHitEffect: { type: 'lifesteal', percent: 20 } },
  { name: 'Abyssal Eye', type: 'amulet', char: '"', color: '#6633aa', value: 150, equipSlot: 'amulet', statBonus: { attack: 6, defense: 6, speed: 3 }, description: 'Sees into the void' },
  { name: 'Crown of the Lich', type: 'amulet', char: '"', color: '#cc00ff', value: 200, equipSlot: 'amulet', statBonus: { attack: 8, defense: 4, maxHp: 20 }, description: 'Absolute dark power' },
];

export const ARMOR_TEMPLATES: Omit<Item, 'id'>[] = [
  { name: 'Leather Armor', type: 'armor', char: '[', color: '#b86b30', value: 10, equipSlot: 'armor', statBonus: { defense: 2 }, description: 'Basic protection' },
  { name: 'Chain Mail', type: 'armor', char: '[', color: '#b8b8d0', value: 25, equipSlot: 'armor', statBonus: { defense: 4 }, description: 'Linked rings of metal' },
  { name: 'Plate Armor', type: 'armor', char: '[', color: '#dcdcf0', value: 50, equipSlot: 'armor', statBonus: { defense: 6 }, description: 'Heavy but sturdy' },
  { name: 'Dragon Scale', type: 'armor', char: '[', color: '#ff6830', value: 90, equipSlot: 'armor', statBonus: { defense: 9 }, description: 'Forged from scales' },
  // New armor with effects
  { name: 'Thorn Mail', type: 'armor', char: '[', color: '#44aa44', value: 35, equipSlot: 'armor', statBonus: { defense: 4 }, description: 'Hurts attackers', onDefendEffect: { type: 'thorns', damage: 3 } },
  { name: 'Frost Plate', type: 'armor', char: '[', color: '#aaddff', value: 60, equipSlot: 'armor', element: 'ice', statBonus: { defense: 7 }, description: 'Freezes attackers', onDefendEffect: { type: 'freeze', chance: 0.15, turns: 1 } },
  { name: 'Infernal Aegis', type: 'armor', char: '[', color: '#ff4400', value: 80, equipSlot: 'armor', element: 'fire', statBonus: { defense: 9, maxHp: 10 }, description: 'Burns with hellfire', onDefendEffect: { type: 'fireball', damage: 4, chance: 0.2 } },
  { name: 'Abyssal Shell', type: 'armor', char: '[', color: '#6633aa', value: 120, equipSlot: 'armor', element: 'dark', statBonus: { defense: 12 }, description: 'Near impervious', onDefendEffect: { type: 'thorns', damage: 5 } },
];

export const RING_TEMPLATES: Omit<Item, 'id'>[] = [
  { name: 'Ring of Strength', type: 'ring', char: '=', color: '#ff8866', value: 20, equipSlot: 'ring', statBonus: { attack: 3 }, description: 'Boosts power' },
  { name: 'Ring of Protection', type: 'ring', char: '=', color: '#66aadd', value: 20, equipSlot: 'ring', statBonus: { defense: 3 }, description: 'Boosts defense' },
  { name: 'Ring of Vitality', type: 'ring', char: '=', color: '#55ee88', value: 20, equipSlot: 'ring', statBonus: { maxHp: 10 }, description: 'Boosts health' },
  { name: 'Ring of Haste', type: 'ring', char: '=', color: '#88eeff', value: 25, equipSlot: 'ring', statBonus: { speed: 3 }, description: 'Move faster' },
  { name: 'Ring of Thorns', type: 'ring', char: '=', color: '#44cc44', value: 30, equipSlot: 'ring', statBonus: { defense: 1 }, description: 'Return 2 damage to attackers', onDefendEffect: { type: 'thorns', damage: 2 } },
  { name: 'Ring of Bloodlust', type: 'ring', char: '=', color: '#cc2244', value: 35, equipSlot: 'ring', element: 'dark', statBonus: { attack: 2 }, description: 'Heal on every hit', onHitEffect: { type: 'lifesteal', percent: 10 } },
  { name: 'Ring of the Glacier', type: 'ring', char: '=', color: '#aaccff', value: 40, equipSlot: 'ring', element: 'ice', statBonus: { defense: 2, speed: 1 }, description: 'Chance to freeze attackers', onDefendEffect: { type: 'freeze', chance: 0.1, turns: 1 } },
];

export const AMULET_TEMPLATES: Omit<Item, 'id'>[] = [
  { name: 'Amulet of Regen', type: 'amulet', char: '"', color: '#66ffaa', value: 30, equipSlot: 'amulet', statBonus: { hp: 1 }, description: 'Heals over time' },
  { name: 'Amulet of Might', type: 'amulet', char: '"', color: '#ff6644', value: 30, equipSlot: 'amulet', statBonus: { attack: 2, defense: 2 }, description: 'Power and protection' },
  { name: 'Amulet of Venom', type: 'amulet', char: '"', color: '#55cc22', value: 35, equipSlot: 'amulet', element: 'poison', statBonus: { attack: 1 }, description: 'Poisons on hit', onHitEffect: { type: 'poison', damage: 2, turns: 3 } },
  { name: 'Amulet of the Inferno', type: 'amulet', char: '"', color: '#ff6600', value: 45, equipSlot: 'amulet', element: 'fire', statBonus: { attack: 3 }, description: 'Chance to fireball', onHitEffect: { type: 'fireball', damage: 6, chance: 0.15 } },
];

// ── Offhand items (class-specific) ──
// Warriors: Shields — bonus defense, chance to block hits
// Rogues: Off-hand Daggers — bonus attack + speed
// Mages: Arcane Foci — bonus attack (scales spell damage) + on-hit effects
// Other classes may also pick these up but can only equip their own type

export const SHIELD_TEMPLATES: Omit<Item, 'id'>[] = [
  { name: 'Wooden Shield', type: 'offhand', char: '(', color: '#b86b30', value: 12, equipSlot: 'offhand', statBonus: { defense: 3 }, description: 'A basic wooden shield. Blocks some hits.', classRestriction: ['warrior', 'paladin'] },
  { name: 'Iron Shield', type: 'offhand', char: '(', color: '#b8b8d0', value: 28, equipSlot: 'offhand', statBonus: { defense: 5 }, description: 'Solid iron. Reliable protection.', classRestriction: ['warrior', 'paladin'] },
  { name: 'Tower Shield', type: 'offhand', char: '(', color: '#dcdcf0', value: 50, equipSlot: 'offhand', statBonus: { defense: 8 }, description: 'Massive and heavy. Near-impenetrable.', classRestriction: ['warrior', 'paladin'] },
  { name: 'Dragon Buckler', type: 'offhand', char: '(', color: '#ff6830', value: 80, equipSlot: 'offhand', statBonus: { defense: 6, maxHp: 8 }, description: 'Forged from dragon bone. Tough and vital.', classRestriction: ['warrior', 'paladin'] },
  { name: 'Void Shield', type: 'offhand', char: '(', color: '#8844cc', value: 110, equipSlot: 'offhand', element: 'dark', statBonus: { defense: 10, attack: 2 }, description: 'Absorbs dark energy. Enhances power.', classRestriction: ['warrior', 'paladin'], onDefendEffect: { type: 'thorns', damage: 4 } },
];

export const OFFHAND_DAGGER_TEMPLATES: Omit<Item, 'id'>[] = [
  { name: 'Shiv', type: 'offhand', char: '(', color: '#d4975a', value: 10, equipSlot: 'offhand', statBonus: { attack: 2, speed: 1 }, description: 'A small blade in the off hand. Faster strikes.', classRestriction: ['rogue', 'revenant'] },
  { name: 'Parrying Dagger', type: 'offhand', char: '(', color: '#d0d0e8', value: 22, equipSlot: 'offhand', statBonus: { attack: 3, defense: 1, speed: 1 }, description: 'Quick stabs and deflections.', classRestriction: ['rogue', 'revenant'] },
  { name: 'Venomfang Shiv', type: 'offhand', char: '(', color: '#55cc22', value: 40, equipSlot: 'offhand', element: 'poison', statBonus: { attack: 3, speed: 2 }, description: 'Drips with venom. Every cut counts.', classRestriction: ['rogue', 'revenant'], onHitEffect: { type: 'poison', damage: 2, turns: 3 } },
  { name: 'Shadow Blade', type: 'offhand', char: '(', color: '#8844aa', value: 65, equipSlot: 'offhand', element: 'dark', statBonus: { attack: 5, speed: 2 }, description: 'Strikes from the dark. Hard to parry.', classRestriction: ['rogue', 'revenant'], onHitEffect: { type: 'bleed', damage: 2, turns: 3 } },
];

export const FOCUS_TEMPLATES: Omit<Item, 'id'>[] = [
  { name: 'Apprentice Orb', type: 'offhand', char: '(', color: '#8855ff', value: 15, equipSlot: 'offhand', statBonus: { attack: 2 }, description: 'A glass orb. Focuses magical energy.', classRestriction: ['mage', 'necromancer'] },
  { name: 'Void Crystal', type: 'offhand', char: '(', color: '#aa44dd', value: 35, equipSlot: 'offhand', element: 'dark', statBonus: { attack: 4 }, description: 'Channels dark magic into every blow.', classRestriction: ['mage', 'necromancer'], onHitEffect: { type: 'stun', chance: 0.1 } },
  { name: 'Ember Focus', type: 'offhand', char: '(', color: '#ff6622', value: 45, equipSlot: 'offhand', element: 'fire', statBonus: { attack: 4 }, description: 'Burning with arcane flame.', classRestriction: ['mage', 'necromancer'], onHitEffect: { type: 'fireball', damage: 5, chance: 0.25 } },
  { name: 'Glacial Lens', type: 'offhand', char: '(', color: '#66bbff', value: 55, equipSlot: 'offhand', element: 'ice', statBonus: { attack: 3, speed: 1 }, description: 'Freezes the air around each strike.', classRestriction: ['mage', 'necromancer'], onHitEffect: { type: 'freeze', chance: 0.2, turns: 2 } },
  { name: 'Lich Shard', type: 'offhand', char: '(', color: '#cc00ff', value: 90, equipSlot: 'offhand', element: 'dark', statBonus: { attack: 7 }, description: 'A fragment of the Lich Emperor\'s crown. Pure power.', classRestriction: ['mage', 'necromancer'], onHitEffect: { type: 'lifesteal', percent: 12 } },
];

// Ranger offhand: Quivers — boost ranged attack and range
export const QUIVER_TEMPLATES: Omit<Item, 'id'>[] = [
  { name: 'Light Quiver', type: 'offhand', char: '(', color: '#c8a050', value: 14, equipSlot: 'offhand', statBonus: { attack: 2, speed: 1 }, description: 'Light arrows. Draw faster.', classRestriction: ['ranger'] },
  { name: 'Heavy Quiver', type: 'offhand', char: '(', color: '#a08040', value: 30, equipSlot: 'offhand', statBonus: { attack: 4 }, description: 'Heavier bolts. Hit harder.', classRestriction: ['ranger'] },
  { name: 'Poison Quiver', type: 'offhand', char: '(', color: '#55cc22', value: 50, equipSlot: 'offhand', element: 'poison', statBonus: { attack: 3, speed: 1 }, description: 'Tipped with venom.', classRestriction: ['ranger'], onHitEffect: { type: 'poison', damage: 2, turns: 3 } },
  { name: 'Shadow Quiver', type: 'offhand', char: '(', color: '#8844aa', value: 70, equipSlot: 'offhand', element: 'dark', statBonus: { attack: 5, speed: 2 }, description: 'Arrows that leave wounds.', classRestriction: ['ranger'], onHitEffect: { type: 'bleed', damage: 2, turns: 3 } },
];

export const POTION_TEMPLATES: Omit<Item, 'id'>[] = [
  { name: 'Health Potion', type: 'potion', char: '!', color: '#ff3344', value: 10, description: 'Restores 15 HP' },
  { name: 'Greater Health Potion', type: 'potion', char: '!', color: '#ff77bb', value: 25, description: 'Restores 30 HP' },
  { name: 'Strength Potion', type: 'potion', char: '!', color: '#ffbb33', value: 20, description: '+2 attack for 20 turns' },
  { name: 'Iron Skin Potion', type: 'potion', char: '!', color: '#aabbcc', value: 20, description: '+3 defense for 20 turns' },
  { name: 'Speed Elixir', type: 'potion', char: '!', color: '#88eeff', value: 20, description: '+4 speed for 15 turns' },
  { name: 'Potion of Rage', type: 'potion', char: '!', color: '#ff2200', value: 30, description: '+5 attack for 10 turns' },
  { name: 'Full Heal Potion', type: 'potion', char: '!', color: '#ff55ff', value: 50, description: 'Fully restores HP' },
  { name: 'Antidote', type: 'potion', char: '!', color: '#33cc66', value: 10, description: 'Cures poison and bleed' },
];

export const SCROLL_TEMPLATES: Omit<Item, 'id'>[] = [
  { name: 'Scroll of Mapping', type: 'scroll', char: '?', color: '#f5e8c8', value: 15, description: 'Reveals the floor' },
  { name: 'Scroll of Teleport', type: 'scroll', char: '?', color: '#e088e8', value: 20, description: 'Teleport randomly' },
  { name: 'Scroll of Fireball', type: 'scroll', char: '?', color: '#ff5500', value: 25, description: 'Deals 20 fire damage to nearby enemies' },
  { name: 'Scroll of Ice Storm', type: 'scroll', char: '?', color: '#88ccff', value: 25, description: 'Freezes all nearby enemies for 3 turns' },
  { name: 'Scroll of Summon', type: 'scroll', char: '?', color: '#cc44ff', value: 35, description: 'Summons a temporary ally' },
  { name: 'Scroll of Enchant', type: 'scroll', char: '?', color: '#ffdd44', value: 40, description: 'Permanently adds +2 attack to your weapon' },
];

export const FOOD_TEMPLATES: Omit<Item, 'id'>[] = [
  { name: 'Bread', type: 'food', char: '%', color: '#e8c888', value: 30, description: 'Fills you up a bit' },
  { name: 'Meat', type: 'food', char: '%', color: '#e07070', value: 45, description: 'A hearty meal' },
  { name: 'Fruit', type: 'food', char: '%', color: '#66dd66', value: 25, description: 'A fresh snack' },
  { name: 'Feast', type: 'food', char: '%', color: '#ffcc44', value: 70, description: 'A full belly!' },
  { name: 'Mushroom Stew', type: 'food', char: '%', color: '#bb8855', value: 40, description: 'Warm and filling' },
  { name: 'Dragon Jerky', type: 'food', char: '%', color: '#dd5533', value: 55, description: 'Spicy but delicious' },
];

// ── Mercenary definitions ──
export const MERCENARY_DEFS: MercenaryDef[] = [
  { id: 'merc_shield_bearer', name: 'Garrak', title: 'Shield Bearer', char: '♦', color: '#88ccff', hireCost: 30, stats: { hp: 25, maxHp: 25, attack: 4, defense: 8, speed: 5 }, minFloor: 2, description: 'A sturdy defender who draws enemy attacks.', specialAbility: 'Taunt: enemies prefer attacking Garrak' },
  { id: 'merc_blade_dancer', name: 'Lyra', title: 'Blade Dancer', char: '♣', color: '#88ccff', hireCost: 50, stats: { hp: 18, maxHp: 18, attack: 10, defense: 2, speed: 13 }, minFloor: 4, description: 'A fast fighter who strikes twice.', specialAbility: 'Double Strike: attacks twice per turn' },
  { id: 'merc_healer', name: 'Sera', title: 'War Priestess', char: '♥', color: '#88ffaa', hireCost: 60, stats: { hp: 20, maxHp: 20, attack: 5, defense: 3, speed: 7 }, minFloor: 3, description: 'Heals you each turn.', specialAbility: 'Blessing: heals you 2 HP per turn' },
  { id: 'merc_berserker', name: 'Krug', title: 'Berserker', char: '♠', color: '#ff8855', hireCost: 70, stats: { hp: 30, maxHp: 30, attack: 14, defense: 1, speed: 8 }, minFloor: 5, description: 'Hits incredibly hard but takes extra damage.', specialAbility: 'Frenzy: deals double damage when below 50% HP' },
  { id: 'merc_assassin', name: 'Shade', title: 'Shadow Assassin', char: '◆', color: '#bb88dd', hireCost: 80, stats: { hp: 15, maxHp: 15, attack: 12, defense: 2, speed: 15 }, minFloor: 6, description: 'Strikes from shadows with lethal precision.', specialAbility: 'Assassinate: 15% chance to instantly kill non-boss enemies' },
  { id: 'merc_golem', name: 'Atlas', title: 'War Golem', char: '■', color: '#ccbb88', hireCost: 100, stats: { hp: 60, maxHp: 60, attack: 8, defense: 12, speed: 3 }, minFloor: 8, description: 'An ancient construct. Nearly indestructible.', specialAbility: 'Stone Skin: takes half damage from all sources' },
];

// ── Terrain definitions ──
export const TERRAIN_DEFS: TerrainDef[] = [
  { type: 'water',      name: 'Water',      color: '#3388cc', bg: '#081828', glow: '#3388cc', minFloor: 1 },
  { type: 'lava',       name: 'Lava',       color: '#ff5511', bg: '#2a0800', glow: '#ff5511', minFloor: 4 },
  { type: 'poison',     name: 'Poison',     color: '#44cc22', bg: '#0a1a04', glow: '#44cc22', minFloor: 3 },
  { type: 'ice',        name: 'Ice',        color: '#88ddff', bg: '#0a1a2a', glow: '#88ddff', minFloor: 2 },
  { type: 'tall_grass', name: 'Tall Grass', color: '#55aa33', bg: '#0a1a08',                  minFloor: 1 },
  { type: 'mud',        name: 'Mud',        color: '#8a6633', bg: '#1a1008',                  minFloor: 2 },
  { type: 'holy',       name: 'Holy Ground', color: '#ffdd66', bg: '#1a1808', glow: '#ffdd66', minFloor: 5 },
  { type: 'shadow',     name: 'Shadow',     color: '#554477', bg: '#0a0816', glow: '#554477', minFloor: 4 },
];

// ── Colors for messages ──
export const MSG_COLOR = {
  info: '#8888aa',
  good: '#44dd77',
  bad: '#ff5566',
  loot: '#ffe44d',
  xp: '#cc77ff',
  system: '#7799ff',
  boss: '#ff3333',
  merc: '#88ccff',
};

// ── Item rarity system ──
// Colors chosen to be unique from all other game colors (terrain, elements, UI, monsters).
// Glow radius multiplier increases with rarity so rare items visually stand out on the map.
export interface RarityDef {
  id: ItemRarity;
  label: string;
  color: string;        // unique display color for item name
  glowColor: string;    // glow halo color on the map
  glowRadius: number;   // multiplier for glow radius (1.0 = normal)
  glowAlpha: number;    // center opacity of glow (higher = brighter)
  statScale: number;    // multiplier applied to stat bonuses
  dropWeight: number;   // relative weight in drop table (higher = more common)
  minFloor: number;     // earliest floor this rarity can appear
}

export const RARITY_DEFS: Record<ItemRarity, RarityDef> = {
  common:    { id: 'common',    label: 'Common',    color: '#b0b0b0', glowColor: '#b0b0b0', glowRadius: 1.0, glowAlpha: 0.10, statScale: 1.0,  dropWeight: 50, minFloor: 1 },
  uncommon:  { id: 'uncommon',  label: 'Uncommon',  color: '#1eff72', glowColor: '#1eff72', glowRadius: 1.2, glowAlpha: 0.18, statScale: 1.15, dropWeight: 28, minFloor: 1 },
  rare:      { id: 'rare',      label: 'Rare',      color: '#2196ff', glowColor: '#2196ff', glowRadius: 1.5, glowAlpha: 0.25, statScale: 1.3,  dropWeight: 14, minFloor: 2 },
  epic:      { id: 'epic',      label: 'Epic',      color: '#c23cff', glowColor: '#c23cff', glowRadius: 1.8, glowAlpha: 0.35, statScale: 1.5,  dropWeight: 6,  minFloor: 4 },
  legendary: { id: 'legendary', label: 'Legendary', color: '#ff9d17', glowColor: '#ff9d17', glowRadius: 2.2, glowAlpha: 0.45, statScale: 1.8,  dropWeight: 1.5, minFloor: 6 },
  mythic:    { id: 'mythic',    label: 'Mythic',    color: '#ff2a6d', glowColor: '#ff2a6d', glowRadius: 2.8, glowAlpha: 0.55, statScale: 2.2,  dropWeight: 0.5, minFloor: 9 },
};

// Ordered from common to mythic for iteration
export const RARITY_ORDER: ItemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

// ── Ability pools (choosable on level up) ──

export const WARRIOR_ABILITIES: ChoosableAbility[] = [
  { id: 'war_shield_wall', name: 'Shield Wall', description: 'Passively block 30% of all incoming damage', icon: '\u{1F6E1}', color: '#4488ff', minLevel: 2, classId: 'warrior' },
  { id: 'war_war_cry', name: 'War Cry', description: 'Stun adjacent enemies when you level up', icon: '\u{1F4E3}', color: '#ff8844', minLevel: 2, classId: 'warrior' },
  { id: 'war_heavy_blow', name: 'Heavy Blow', description: '20% chance to stun enemies on hit', icon: '\u{1F4A5}', color: '#ff5544', minLevel: 3, classId: 'warrior' },
  { id: 'war_last_stand', name: 'Last Stand', description: 'Survive a fatal hit once per floor with 1 HP', icon: '\u{2694}', color: '#ff3333', minLevel: 4, classId: 'warrior' },
  { id: 'war_counter_strike', name: 'Counter Strike', description: '25% chance to hit back when attacked', icon: '\u{21A9}', color: '#ff6644', minLevel: 4, classId: 'warrior' },
  { id: 'war_intimidate', name: 'Intimidate', description: 'Enemies near you deal 15% less damage', icon: '\u{1F608}', color: '#cc4422', minLevel: 5, classId: 'warrior' },
  { id: 'war_fortify', name: 'Fortify', description: 'Heal 2 HP every time you kill an enemy', icon: '\u{2665}', color: '#ff4444', minLevel: 3, classId: 'warrior' },
  { id: 'war_cleave', name: 'Cleave', description: '15% chance to deal damage to a second nearby enemy', icon: '\u{1FA93}', color: '#cc5533', minLevel: 5, classId: 'warrior' },
  { id: 'war_bloodlust', name: 'Bloodlust', description: 'Killing an enemy refunds 10 rage', icon: '\u{1F525}', color: '#ff2200', minLevel: 3, classId: 'warrior' },
  { id: 'war_pain_engine', name: 'Pain Engine', description: 'Taking damage below 40% HP generates double rage', icon: '\u{1F9E8}', color: '#cc0044', minLevel: 4, classId: 'warrior' },
];

export const ROGUE_ABILITIES: ChoosableAbility[] = [
  { id: 'rog_dodge', name: 'Dodge', description: '15% chance to completely avoid attacks', icon: '\u{1F4A8}', color: '#ffcc33', minLevel: 2, classId: 'rogue' },
  { id: 'rog_poison_blade', name: 'Poison Blade', description: '20% chance to poison enemies for 2 turns', icon: '\u{2620}', color: '#55cc22', minLevel: 2, classId: 'rogue' },
  { id: 'rog_shadow_step', name: 'Shadow Step', description: 'No opportunity attacks when retreating from enemies', icon: '\u{1F463}', color: '#8866aa', minLevel: 3, classId: 'rogue' },
  { id: 'rog_critical_hit', name: 'Critical Hit', description: '15% chance to deal triple damage', icon: '\u{1F3AF}', color: '#ff2222', minLevel: 4, classId: 'rogue' },
  { id: 'rog_steal', name: 'Pickpocket', description: 'Enemies drop extra gold when defeated', icon: '\u{1F4B0}', color: '#ffd700', minLevel: 3, classId: 'rogue' },
  { id: 'rog_bleed', name: 'Deep Wound', description: '25% chance to make enemies bleed for 3 turns', icon: '\u{1FA78}', color: '#ff4444', minLevel: 4, classId: 'rogue' },
  { id: 'rog_vanish', name: 'Vanish', description: 'When below 20% HP, 30% chance enemies miss you', icon: '\u{1F32B}', color: '#aabbcc', minLevel: 5, classId: 'rogue' },
  { id: 'rog_exploit', name: 'Exploit Weakness', description: '+50% damage to poisoned or bleeding enemies', icon: '\u{1F52A}', color: '#cc3355', minLevel: 5, classId: 'rogue' },
];

export const MAGE_ABILITIES: ChoosableAbility[] = [
  { id: 'mag_fireball', name: 'Fireball', description: '15% chance to deal 6 bonus fire damage', icon: '\u{1F525}', color: '#ff6622', minLevel: 2, classId: 'mage' },
  { id: 'mag_frost_touch', name: 'Frost Touch', description: '20% chance to freeze enemies for 1 turn', icon: '\u{2744}', color: '#88ccff', minLevel: 2, classId: 'mage' },
  { id: 'mag_arcane_power', name: 'Arcane Power', description: 'Draw energy from terrain: heal 2 HP per turn on any terrain tile', icon: '\u{2728}', color: '#cc77ff', minLevel: 3, classId: 'mage' },
  { id: 'mag_drain_life', name: 'Drain Life', description: 'Heal 10% of damage dealt', icon: '\u{1F9DB}', color: '#cc1144', minLevel: 4, classId: 'mage' },
  { id: 'mag_chain_lightning', name: 'Chain Lightning', description: '10% chance to zap a second enemy for 4 damage', icon: '\u{26A1}', color: '#ffff44', minLevel: 4, classId: 'mage' },
  { id: 'mag_telekinesis', name: 'Telekinesis', description: 'Push enemies back 2 tiles on hit (10% chance)', icon: '\u{1F9E0}', color: '#9977dd', minLevel: 3, classId: 'mage' },
  { id: 'mag_overcharge', name: 'Overcharge', description: 'Spell Strike deals +8 damage instead of +5', icon: '\u{1F4AB}', color: '#aa55ff', minLevel: 5, classId: 'mage' },
  { id: 'mag_mana_regen', name: 'Mana Regeneration', description: 'Heal 1 HP every 5 turns', icon: '\u{1F7E3}', color: '#88aaff', minLevel: 5, classId: 'mage' },
];

export const RANGER_ABILITIES: ChoosableAbility[] = [
  { id: 'rng_trap_sense', name: 'Trap Sense', description: 'Take 25% less damage from terrain effects', icon: '\u{1F3F9}', color: '#33cc66', minLevel: 2, classId: 'ranger' },
  { id: 'rng_nature_bond', name: 'Nature Bond', description: 'Heal 2 HP when stepping on tall grass or mycelium', icon: '\u{1F33F}', color: '#55aa33', minLevel: 2, classId: 'ranger' },
  { id: 'rng_swift_strike', name: 'First Strike', description: 'Always attack first when entering a tile with an enemy', icon: '\u{1F3C3}', color: '#44ddaa', minLevel: 3, classId: 'ranger' },
  { id: 'rng_mark_prey', name: 'Mark Prey', description: 'Deal +30% damage to the last monster that hit you', icon: '\u{1F3AF}', color: '#ff8844', minLevel: 4, classId: 'ranger' },
  { id: 'rng_second_wind', name: 'Second Wind', description: 'Heal 3 HP per floor descent', icon: '\u{1F4A8}', color: '#66ddaa', minLevel: 3, classId: 'ranger' },
  { id: 'rng_camouflage', name: 'Camouflage', description: '20% chance enemies lose track of you each turn', icon: '\u{1F33E}', color: '#779944', minLevel: 4, classId: 'ranger' },
  { id: 'rng_hunters_focus', name: "Hunter's Focus", description: 'Deal +25% damage to bosses', icon: '\u{1F441}', color: '#ff5544', minLevel: 5, classId: 'ranger' },
  { id: 'rng_herbalist', name: 'Herbalist', description: 'Potions heal 50% more', icon: '\u{1F33F}', color: '#33cc55', minLevel: 5, classId: 'ranger' },
];

export const PALADIN_ABILITIES: ChoosableAbility[] = [
  { id: 'pal_holy_smite', name: 'Holy Smite', description: '+50% damage to dark & undead enemies', icon: '\u{2600}', color: '#ffdd44', minLevel: 2, classId: 'paladin' },
  { id: 'pal_divine_shield', name: 'Divine Shield', description: '20% chance to fully negate a hit', icon: '\u{1F6E1}', color: '#ffcc66', minLevel: 2, classId: 'paladin' },
  { id: 'pal_lay_on_hands', name: 'Lay on Hands', description: 'Heal 5 HP per floor descent', icon: '\u{1F91A}', color: '#66ff88', minLevel: 3, classId: 'paladin' },
  { id: 'pal_consecrate', name: 'Consecrate', description: '15% chance to create holy terrain on hit', icon: '\u{2728}', color: '#ffee66', minLevel: 3, classId: 'paladin' },
  { id: 'pal_righteous_fury', name: 'Righteous Fury', description: 'Each kill increases damage by 10% for 5 turns (stacks)', icon: '\u{1F4A5}', color: '#ff8833', minLevel: 4, classId: 'paladin' },
  { id: 'pal_aura_of_light', name: 'Aura of Light', description: 'See 2 tiles further in darkness', icon: '\u{1F31F}', color: '#ffee88', minLevel: 4, classId: 'paladin' },
  { id: 'pal_martyrdom', name: 'Martyrdom', description: 'When hit below 25% HP, deal 8 damage to attacker', icon: '\u{271D}', color: '#ff4444', minLevel: 5, classId: 'paladin' },
  { id: 'pal_divine_might', name: 'Divine Might', description: 'Fully heal once per floor when you drop below 15% HP', icon: '\u{1F451}', color: '#ffd700', minLevel: 5, classId: 'paladin' },
];

export const SHARED_ABILITIES: ChoosableAbility[] = [
  { id: 'shared_tough', name: 'Iron Stomach', description: 'Food heals 5 HP on top of hunger restore', icon: '\u{2665}', color: '#ff4444', minLevel: 2, classId: 'any' },
  { id: 'shared_sharp', name: 'Opportunist', description: 'Deal +40% damage to stunned or frozen enemies', icon: '\u{2694}', color: '#ff8844', minLevel: 3, classId: 'any' },
  { id: 'shared_armor', name: 'Scavenger Instinct', description: 'Potions and food appear more often on the ground', icon: '\u{1F6E1}', color: '#4488ff', minLevel: 3, classId: 'any' },
  { id: 'shared_quick', name: 'Adrenaline Rush', description: 'When below 40% HP, +5 speed', icon: '\u{26A1}', color: '#44ffcc', minLevel: 2, classId: 'any' },
  { id: 'shared_gold_find', name: 'Gold Sense', description: 'Enemies drop 50% more gold', icon: '\u{1F4B0}', color: '#ffd700', minLevel: 4, classId: 'any' },
  { id: 'shared_xp_boost', name: 'Quick Learner', description: '+25% XP from kills', icon: '\u{1F4DA}', color: '#cc77ff', minLevel: 4, classId: 'any' },
];

// ── Impregnar class ──

export const IMPREGNAR_ABILITIES: ChoosableAbility[] = [
  { id: 'imp_twin_brood', name: 'Twin Brood', description: 'Impregnated enemies spawn 2 broodlings instead of 1', icon: '🥚', color: '#88ff44', minLevel: 2, classId: 'impregnar' },
  { id: 'imp_toxic_birth', name: 'Toxic Birth', description: 'Broodlings explode on death, dealing 8 poison damage to adjacent enemies', icon: '☠️', color: '#44cc00', minLevel: 2, classId: 'impregnar' },
  { id: 'imp_gestating_fury', name: 'Gestating Fury', description: 'Impregnated enemies take 2 damage per turn and move 50% slower', icon: '🤢', color: '#99ee33', minLevel: 3, classId: 'impregnar' },
  { id: 'imp_bile_spray', name: 'Bile Spray', description: 'Broodlings spray bile on spawn, slowing nearby enemies for 3 turns', icon: '🤮', color: '#77dd00', minLevel: 3, classId: 'impregnar' },
  { id: 'imp_parasitic_link', name: 'Parasitic Link', description: 'Heal 3 HP whenever an impregnated enemy takes damage', icon: '🔗', color: '#66cc22', minLevel: 4, classId: 'impregnar' },
  { id: 'imp_chain_gestation', name: 'Chain Gestation', description: 'When a broodling kills an enemy, that enemy also spawns a broodling', icon: '🧬', color: '#55bb11', minLevel: 5, classId: 'impregnar' },
  { id: 'imp_hive_mind', name: 'Hive Mind', description: 'Broodlings gain +2 attack per other living broodling on the floor', icon: '🧠', color: '#44aa00', minLevel: 5, classId: 'impregnar' },
  { id: 'imp_mother_of_all', name: 'Mother of All', description: 'Boss enemies spawn 3 broodlings and puke for 4 turns straight', icon: '👑', color: '#33ff00', minLevel: 6, classId: 'impregnar' },
];

export const IMPREGNAR_CLASS: ClassDef = {
  id: 'impregnar' as PlayerClass,
  name: 'Impregnar',
  char: '@',
  color: '#88ff44',
  description: 'Infests enemies with parasitic spawn. They puke, they burst, they birth your army.',
  baseStats: { hp: 22, maxHp: 22, attack: 3, defense: 2, speed: 11 },
  levelBonusHp: 3,
  levelBonusAtk: 1,
  levelBonusDef: 1,
  requiresBestFloor: 0,
  passives: [
    { name: 'Brood Mother', description: 'Broodlings fight for you and scale with your level', unlockLevel: 1 },
    { name: 'Nausea Aura', description: 'Enemies adjacent to you have 15% chance to miss (they\'re too busy retching)', unlockLevel: 4 },
    { name: 'Infestation', description: 'Impregnate has no cooldown but costs 5 HP per use', unlockLevel: 7 },
  ],
  abilityPool: IMPREGNAR_ABILITIES,
};

// ── Class definitions ──
// Base stats are intentionally weak — bloodline bonuses are how players get strong.
export const CLASS_DEFS: ClassDef[] = [
  {
    id: 'warrior', name: 'Warrior', char: '@', color: '#ff6644',
    description: 'High HP and defense. Built to take hits.',
    baseStats: { hp: 30, maxHp: 30, attack: 4, defense: 3, speed: 7 },
    levelBonusHp: 5, levelBonusAtk: 1, levelBonusDef: 1, requiresBestFloor: 0,
    passives: [
      { name: 'Thick Skin', description: 'Take 1 less damage from all hits', unlockLevel: 1 },
      { name: 'Berserker', description: 'Deal +50% damage when below 30% HP', unlockLevel: 4 },
      { name: 'Iron Will', description: 'Hunger drains 30% slower', unlockLevel: 7 },
    ],
    abilityPool: WARRIOR_ABILITIES,
  },
  {
    id: 'rogue', name: 'Rogue', char: '@', color: '#ffcc33',
    description: 'Fast and deadly. Strikes hard, dodges often.',
    baseStats: { hp: 24, maxHp: 24, attack: 5, defense: 1, speed: 13 },
    levelBonusHp: 3, levelBonusAtk: 1, levelBonusDef: 1, requiresBestFloor: 0,
    passives: [
      { name: 'Quick Feet', description: '+3 speed permanently', unlockLevel: 1 },
      { name: 'Backstab', description: '25% chance to deal double damage', unlockLevel: 4 },
      { name: 'Scavenger', description: 'Monsters drop loot more often', unlockLevel: 7 },
    ],
    abilityPool: ROGUE_ABILITIES,
  },
  {
    id: 'mage', name: 'Mage', char: '@', color: '#8855ff',
    description: 'Fragile but powerful. Magic fuels every blow.',
    baseStats: { hp: 22, maxHp: 22, attack: 6, defense: 0, speed: 8 },
    levelBonusHp: 2, levelBonusAtk: 2, levelBonusDef: 0, requiresBestFloor: 7,
    passives: [
      { name: 'Arcane Sight', description: 'See 3 tiles further in the dark', unlockLevel: 1 },
      { name: 'Spell Strike', description: '20% chance to deal +5 bonus magic damage', unlockLevel: 4 },
      { name: 'Mana Shield', description: '15% chance to completely negate damage', unlockLevel: 7 },
    ],
    abilityPool: MAGE_ABILITIES,
  },
  {
    id: 'ranger', name: 'Ranger', char: '@', color: '#33cc66',
    description: 'Balanced survivor. Eats less, sees more.',
    baseStats: { hp: 26, maxHp: 26, attack: 5, defense: 2, speed: 10 }, // Buffed HP 24→26, Attack 4→5
    levelBonusHp: 4, levelBonusAtk: 1, levelBonusDef: 1, requiresBestFloor: 5,
    passives: [
      { name: 'Forager', description: 'Food restores 50% more hunger', unlockLevel: 1 },
      { name: 'Keen Eye', description: 'See monsters from further away', unlockLevel: 4 },
      { name: 'Survival Instinct', description: 'Auto-heal 50% HP once per floor when near death', unlockLevel: 7 },
    ],
    abilityPool: RANGER_ABILITIES,
  },
  {
    id: 'paladin', name: 'Paladin', char: '@', color: '#ffd700',
    description: 'Holy knight. Heals self, punishes darkness.',
    baseStats: { hp: 28, maxHp: 28, attack: 5, defense: 3, speed: 8 }, // Buffed Attack 4→5, Speed 6→8
    levelBonusHp: 5, levelBonusAtk: 1, levelBonusDef: 1, requiresBestFloor: 0,
    passives: [
      { name: 'Divine Light', description: 'Heal 3 HP every 6 turns', unlockLevel: 1 }, // Buffed heal 2→3
      { name: 'Smite Evil', description: '+40% damage to dark-type enemies', unlockLevel: 3 },
      { name: 'Holy Aegis', description: '20% chance to negate dark damage completely', unlockLevel: 6 },
    ],
    abilityPool: PALADIN_ABILITIES,
  },
  IMPREGNAR_CLASS,
];

// ── Hellborn class (unlocked by defeating Lucifer in Hell) ──

export const HELLBORN_ABILITIES: ChoosableAbility[] = [
  { id: 'hb_infernal_rage', name: 'Infernal Rage', description: '+3 attack for every 10% HP missing', icon: '\u{1F525}', color: '#ff2200', minLevel: 2, classId: 'hellborn' },
  { id: 'hb_soul_burn', name: 'Soul Burn', description: 'Kills deal 5 fire damage to nearby enemies', icon: '\u{1F480}', color: '#ff4400', minLevel: 2, classId: 'hellborn' },
  { id: 'hb_demon_skin', name: 'Demon Skin', description: '+4 defense permanently, take 50% less fire damage', icon: '\u{1F9B4}', color: '#cc1100', minLevel: 3, classId: 'hellborn' },
  { id: 'hb_hellfire_touch', name: 'Hellfire Touch', description: '25% chance to deal 10 bonus fire damage on hit', icon: '\u{2604}', color: '#ff3300', minLevel: 3, classId: 'hellborn' },
  { id: 'hb_blood_pact', name: 'Blood Pact', description: 'Heal 20% of damage dealt but take 1 damage per turn', icon: '\u{1FA78}', color: '#cc0022', minLevel: 4, classId: 'hellborn' },
  { id: 'hb_damnation', name: 'Damnation', description: '15% chance to instantly kill non-boss enemies below 50% HP', icon: '\u{2620}', color: '#ff0000', minLevel: 5, classId: 'hellborn' },
  { id: 'hb_immortal_flame', name: 'Immortal Flame', description: 'Revive with 30% HP once per floor when killed', icon: '\u{1F31F}', color: '#ff6600', minLevel: 5, classId: 'hellborn' },
  { id: 'hb_apocalypse', name: 'Apocalypse', description: 'Every 20 kills, deal 20 damage to all enemies on the floor', icon: '\u{1F4A5}', color: '#ff1100', minLevel: 6, classId: 'hellborn' },
];

export const HELLBORN_CLASS: ClassDef = {
  id: 'hellborn' as PlayerClass,
  name: 'Hellborn',
  char: '@',
  color: '#ff2200',
  description: 'Forged in Hell. Burns everything. Feeds on destruction.',
  baseStats: { hp: 20, maxHp: 20, attack: 14, defense: 4, speed: 12 },
  levelBonusHp: 3,
  levelBonusAtk: 3,
  levelBonusDef: 1,
  requiresBestFloor: 0,
  passives: [
    { name: 'Hellfire Blood', description: 'Immune to fire terrain. Lava heals 2 HP per turn instead of hurting', unlockLevel: 1 },
    { name: 'Soul Drinker', description: 'Heal 5 HP on every kill', unlockLevel: 3 },
    { name: 'Infernal Rebirth', description: 'On death, explode for 15 damage to all nearby enemies and revive with 10% HP (once per run)', unlockLevel: 7 },
  ],
  abilityPool: HELLBORN_ABILITIES,
};

/** Check if Hellborn class is unlocked (defeating Lucifer OR echo tree Hellforged node) */
export function isHellbornUnlocked(bossKillLog: string[], echoUnlockedNodes?: string[]): boolean {
  if (bossKillLog.some(entry => entry.startsWith('Lucifer|'))) return true;
  if (echoUnlockedNodes && echoUnlockedNodes.includes('mas_class_5')) return true;
  return false;
}

/** Get Hellborn class def if unlocked */
export function getHellbornClass(bossKillLog: string[], echoUnlockedNodes?: string[]): ClassDef[] {
  return isHellbornUnlocked(bossKillLog, echoUnlockedNodes) ? [HELLBORN_CLASS] : [];
}
