import type { BloodlineData, RunStats, TraitDef, TraitEffect, Stats } from './types';
import { pick } from './utils';

// ── Name generation for ancestors ──

const FIRST_NAMES = [
  'Aran', 'Kira', 'Goran', 'Liara', 'Theron', 'Mira', 'Dren', 'Syla',
  'Vex', 'Nyx', 'Brom', 'Ela', 'Torr', 'Zara', 'Finn', 'Lysa',
  'Kael', 'Rhea', 'Joss', 'Thia',
];

const TITLES = [
  'the Bold', 'the Swift', 'the Brave', 'the Wise', 'the Fierce',
  'the Quiet', 'the Lost', 'the Hungry', 'the Lucky', 'the Grim',
  'the Fallen', 'the Cursed', 'the Stubborn',
];

export function generateAncestorName(): string {
  return `${pick(FIRST_NAMES)} ${pick(TITLES)}`;
}

// ── Empty data constructors ──

export function createEmptyRunStats(): RunStats {
  return {
    kills: 0,
    damageDealt: 0,
    damageTaken: 0,
    potionsUsed: 0,
    foodEaten: 0,
    scrollsUsed: 0,
    itemsFound: 0,
    goldEarned: 0,
    floorsCleared: 0,
    npcsTalkedTo: 0,
    monsterKills: {},
    bossesKilled: 0,
    mercenariesHired: 0,
    rangedAttacks: 0,
    terrainSteps: {},
    essenceShardsEarned: 0,
    namedFoodEaten: {},
    namedPotionsUsed: {},
    abilitiesUsed: 0,
  };
}

export function createDefaultBloodline(): BloodlineData {
  return {
    version: 1,
    generation: 0,
    ancestors: [],
    cumulative: {
      totalDeaths: 0,
      totalKills: 0,
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      totalFloors: 0,
      totalScore: 0,
      totalTurns: 0,
      totalPotionsUsed: 0,
      totalFoodEaten: 0,
      totalScrollsUsed: 0,
      totalItemsFound: 0,
      totalGoldEarned: 0,
      totalNpcsTalkedTo: 0,
      totalMonsterKills: {},
      classDeaths: { warrior: 0, rogue: 0, mage: 0, ranger: 0, necromancer: 0, revenant: 0, paladin: 0, hellborn: 0, generated: 0 },
      highestFloor: 0,
      highestScore: 0,
    },
    unlockedTraits: [],
    npcChoicesMade: {},
    bossKillLog: [],
  };
}

// ── Traits ──

export const TRAIT_DEFS: TraitDef[] = [
  // Death traits — unlock fast, reward pushing and dying
  {
    id: 'first_fall',
    name: 'First Fall',
    description: 'Die once. +3 max HP, +1 defense.',
    icon: '+',
    color: '#ff5566',
    category: 'death',
    condition: (b) => b.cumulative.totalDeaths >= 1,
    effect: { type: 'multi', effects: [
      { type: 'statBonus', stat: 'maxHp', value: 3 },
      { type: 'statBonus', stat: 'defense', value: 1 },
    ]},
  },
  {
    id: 'stubborn',
    name: 'Stubborn',
    description: 'Die 3 times. +1 defense, +2 HP.',
    icon: '!',
    color: '#ff7744',
    category: 'death',
    condition: (b) => b.cumulative.totalDeaths >= 3,
    effect: { type: 'multi', effects: [
      { type: 'statBonus', stat: 'defense', value: 1 },
      { type: 'statBonus', stat: 'maxHp', value: 2 },
    ]},
  },
  {
    id: 'undying_will',
    name: 'Undying Will',
    description: 'Die 6 times. +5 max HP, +1 attack.',
    icon: '*',
    color: '#ff3333',
    category: 'death',
    condition: (b) => b.cumulative.totalDeaths >= 6,
    effect: { type: 'multi', effects: [
      { type: 'statBonus', stat: 'maxHp', value: 5 },
      { type: 'statBonus', stat: 'attack', value: 1 },
    ]},
  },
  {
    id: 'death_defier',
    name: 'Death Defier',
    description: 'Die 10 times. Start with Health Potion + Short Sword.',
    icon: '%',
    color: '#ff2222',
    category: 'death',
    condition: (b) => b.cumulative.totalDeaths >= 10,
    effect: { type: 'multi', effects: [
      { type: 'startingItem', itemName: 'Health Potion' },
      { type: 'startingItem', itemName: 'Short Sword' },
    ]},
  },

  // Combat traits — lower thresholds, bigger rewards
  {
    id: 'blooded',
    name: 'Blooded',
    description: 'Kill 5 monsters total. +1 attack.',
    icon: '/',
    color: '#ff6644',
    category: 'combat',
    condition: (b) => b.cumulative.totalKills >= 5,
    effect: { type: 'statBonus', stat: 'attack', value: 1 },
  },
  {
    id: 'slayer',
    name: 'Slayer',
    description: 'Kill 25 monsters total. +2 attack, +3 HP.',
    icon: 'X',
    color: '#ff4422',
    category: 'combat',
    condition: (b) => b.cumulative.totalKills >= 25,
    effect: { type: 'multi', effects: [
      { type: 'statBonus', stat: 'attack', value: 2 },
      { type: 'statBonus', stat: 'maxHp', value: 3 },
    ]},
  },
  {
    id: 'dragonbane',
    name: 'Dragonbane',
    description: 'Slay a Dragon. +2 attack, +2 defense.',
    icon: 'D',
    color: '#ff5522',
    category: 'combat',
    condition: (b) => (b.cumulative.totalMonsterKills['Dragon'] ?? 0) >= 1,
    effect: { type: 'multi', effects: [
      { type: 'statBonus', stat: 'attack', value: 2 },
      { type: 'statBonus', stat: 'defense', value: 2 },
    ]},
  },
  {
    id: 'thick_hide',
    name: 'Thick Hide',
    description: 'Take 150 damage across all runs. +2 defense, +3 HP.',
    icon: '[',
    color: '#88aacc',
    category: 'combat',
    condition: (b) => b.cumulative.totalDamageTaken >= 150,
    effect: { type: 'multi', effects: [
      { type: 'statBonus', stat: 'defense', value: 2 },
      { type: 'statBonus', stat: 'maxHp', value: 3 },
    ]},
  },

  // Exploration traits
  {
    id: 'deep_diver',
    name: 'Deep Diver',
    description: 'Clear 8 floors total across all runs. +2 speed, +3 HP.',
    icon: '>',
    color: '#3eff7e',
    category: 'exploration',
    condition: (b) => b.cumulative.totalFloors >= 8,
    effect: { type: 'multi', effects: [
      { type: 'statBonus', stat: 'speed', value: 2 },
      { type: 'statBonus', stat: 'maxHp', value: 3 },
    ]},
  },
  {
    id: 'abyss_walker',
    name: 'Abyss Walker',
    description: 'Reach floor 5 in a single run. +5 HP, +1 def, +1 atk.',
    icon: 'V',
    color: '#22ddaa',
    category: 'exploration',
    condition: (b) => b.cumulative.highestFloor >= 5,
    effect: { type: 'multi', effects: [
      { type: 'statBonus', stat: 'maxHp', value: 5 },
      { type: 'statBonus', stat: 'defense', value: 1 },
      { type: 'statBonus', stat: 'attack', value: 1 },
    ]},
  },
  {
    id: 'hoarder',
    name: 'Hoarder',
    description: 'Find 30 items across all runs. Start with 40 gold.',
    icon: '$',
    color: '#ffd700',
    category: 'exploration',
    condition: (b) => b.cumulative.totalItemsFound >= 30,
    effect: { type: 'startingGold', amount: 40 },
  },
  {
    id: 'well_fed',
    name: 'Well Fed',
    description: 'Eat 10 food items across all runs. +30 max hunger.',
    icon: '%',
    color: '#e8c888',
    category: 'exploration',
    condition: (b) => b.cumulative.totalFoodEaten >= 10,
    effect: { type: 'hungerBonus', value: 30 },
  },

  // Class legacy traits — die just twice to unlock
  {
    id: 'warriors_legacy',
    name: "Warrior's Legacy",
    description: 'Die as Warrior 2 times. +3 max HP for all.',
    icon: '@',
    color: '#ff6644',
    category: 'class',
    condition: (b) => (b.cumulative.classDeaths.warrior ?? 0) >= 2,
    effect: { type: 'statBonus', stat: 'maxHp', value: 3 },
  },
  {
    id: 'rogues_legacy',
    name: "Rogue's Legacy",
    description: 'Die as Rogue 2 times. +2 speed for all.',
    icon: '@',
    color: '#ffcc33',
    category: 'class',
    condition: (b) => (b.cumulative.classDeaths.rogue ?? 0) >= 2,
    effect: { type: 'statBonus', stat: 'speed', value: 2 },
  },
  {
    id: 'mages_legacy',
    name: "Mage's Legacy",
    description: 'Die as Mage 2 times. +1 attack for all.',
    icon: '@',
    color: '#8855ff',
    category: 'class',
    condition: (b) => (b.cumulative.classDeaths.mage ?? 0) >= 2,
    effect: { type: 'statBonus', stat: 'attack', value: 1 },
  },
  {
    id: 'rangers_legacy',
    name: "Ranger's Legacy",
    description: 'Die as Ranger 2 times. +15 max hunger for all.',
    icon: '@',
    color: '#33cc66',
    category: 'class',
    condition: (b) => (b.cumulative.classDeaths.ranger ?? 0) >= 2,
    effect: { type: 'hungerBonus', value: 15 },
  },
  {
    id: 'paladins_legacy',
    name: "Paladin's Legacy",
    description: 'Die as Paladin 2 times. +2 defense, +2 HP for all.',
    icon: '@',
    color: '#ffd700',
    category: 'class',
    condition: (b) => (b.cumulative.classDeaths.paladin ?? 0) >= 2,
    effect: { type: 'multi', effects: [
      { type: 'statBonus', stat: 'defense', value: 2 },
      { type: 'statBonus', stat: 'maxHp', value: 2 },
    ]},
  },
  {
    id: 'necromancers_legacy',
    name: "Necromancer's Legacy",
    description: 'Die as Necromancer 2 times. +2 attack, start with Antidote.',
    icon: '@',
    color: '#aa44dd',
    category: 'class',
    condition: (b) => (b.cumulative.classDeaths.necromancer ?? 0) >= 2,
    effect: { type: 'multi', effects: [
      { type: 'statBonus', stat: 'attack', value: 2 },
      { type: 'startingItem', itemName: 'Antidote' },
    ]},
  },
  {
    id: 'revenants_legacy',
    name: "Revenant's Legacy",
    description: 'Die as Revenant 2 times. +1 attack, +2 speed for all.',
    icon: '@',
    color: '#ff4444',
    category: 'class',
    condition: (b) => (b.cumulative.classDeaths.revenant ?? 0) >= 2,
    effect: { type: 'multi', effects: [
      { type: 'statBonus', stat: 'attack', value: 1 },
      { type: 'statBonus', stat: 'speed', value: 2 },
    ]},
  },

  // NPC dialogue traits
  {
    id: 'hermits_wisdom',
    name: "Hermit's Wisdom",
    description: 'Listen to the Hermit. +15% XP.',
    icon: '?',
    color: '#88aaff',
    category: 'npc',
    condition: (b) => b.npcChoicesMade['hermit'] === 'listen',
    effect: { type: 'xpMultiplier', value: 1.15 },
  },
  {
    id: 'merchants_favor',
    name: "Merchant's Favor",
    description: 'Trade with the Wandering Merchant. Start with Bread + Meat + 25g.',
    icon: '$',
    color: '#ffd700',
    category: 'npc',
    condition: (b) => b.npcChoicesMade['merchant'] === 'trade',
    effect: { type: 'multi', effects: [
      { type: 'startingItem', itemName: 'Bread' },
      { type: 'startingItem', itemName: 'Meat' },
      { type: 'startingGold', amount: 25 },
    ]},
  },
  {
    id: 'ancestors_blessing',
    name: "Ancestor's Blessing",
    description: 'Accept your ancestor\'s blessing. +5 HP, +1 attack, +1 defense.',
    icon: '&',
    color: '#c49eff',
    category: 'npc',
    condition: (b) => b.npcChoicesMade['ancestor_ghost'] === 'bless',
    effect: { type: 'multi', effects: [
      { type: 'statBonus', stat: 'maxHp', value: 5 },
      { type: 'statBonus', stat: 'attack', value: 1 },
      { type: 'statBonus', stat: 'defense', value: 1 },
    ]},
  },
  {
    id: 'ancestors_peace',
    name: "Ancestor's Peace",
    description: 'Pay respects to your ancestor. +20 max hunger, +10% XP.',
    icon: '&',
    color: '#c49eff',
    category: 'npc',
    condition: (b) => b.npcChoicesMade['ancestor_ghost'] === 'respect',
    effect: { type: 'multi', effects: [
      { type: 'hungerBonus', value: 20 },
      { type: 'xpMultiplier', value: 1.10 },
    ]},
  },

  // Combat milestones — deeper progression
  {
    id: 'veteran',
    name: 'Veteran',
    description: 'Kill 50 monsters total. +2 attack, +2 defense.',
    icon: 'V',
    color: '#dd5533',
    category: 'combat',
    condition: (b) => b.cumulative.totalKills >= 50,
    effect: { type: 'multi', effects: [
      { type: 'statBonus', stat: 'attack', value: 2 },
      { type: 'statBonus', stat: 'defense', value: 2 },
    ]},
  },
  {
    id: 'warlord',
    name: 'Warlord',
    description: 'Kill 100 monsters total. +2 attack, +5 HP.',
    icon: 'W',
    color: '#cc2222',
    category: 'combat',
    condition: (b) => b.cumulative.totalKills >= 100,
    effect: { type: 'multi', effects: [
      { type: 'statBonus', stat: 'attack', value: 2 },
      { type: 'statBonus', stat: 'maxHp', value: 5 },
    ]},
  },
  {
    id: 'boss_slayer',
    name: 'Boss Slayer',
    description: 'Kill 3 bosses across all runs. Start with Strength Potion.',
    icon: 'B',
    color: '#ff8800',
    category: 'combat',
    condition: (b) => (b.bossKillLog?.length ?? 0) >= 3,
    effect: { type: 'startingItem', itemName: 'Strength Potion' },
  },
  {
    id: 'damage_dealer',
    name: 'Damage Dealer',
    description: 'Deal 500 damage across all runs. +2 attack.',
    icon: '!',
    color: '#ff4466',
    category: 'combat',
    condition: (b) => b.cumulative.totalDamageDealt >= 500,
    effect: { type: 'statBonus', stat: 'attack', value: 2 },
  },

  // Exploration milestones — deeper progression
  {
    id: 'alchemist',
    name: 'Alchemist',
    description: 'Use 15 potions across all runs. Start with Greater Health Potion.',
    icon: '!',
    color: '#ff77bb',
    category: 'exploration',
    condition: (b) => b.cumulative.totalPotionsUsed >= 15,
    effect: { type: 'startingItem', itemName: 'Greater Health Potion' },
  },
  {
    id: 'scroll_scholar',
    name: 'Scroll Scholar',
    description: 'Use 10 scrolls across all runs. +2 speed.',
    icon: '?',
    color: '#f5e8c8',
    category: 'exploration',
    condition: (b) => b.cumulative.totalScrollsUsed >= 10,
    effect: { type: 'statBonus', stat: 'speed', value: 2 },
  },
  {
    id: 'gold_rush',
    name: 'Gold Rush',
    description: 'Earn 500 gold across all runs. Start with 60 gold.',
    icon: '$',
    color: '#ffdd00',
    category: 'exploration',
    condition: (b) => b.cumulative.totalGoldEarned >= 500,
    effect: { type: 'startingGold', amount: 60 },
  },
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Talk to 10 NPCs across all runs. +3 HP, +10 hunger.',
    icon: 'N',
    color: '#88ddff',
    category: 'exploration',
    condition: (b) => b.cumulative.totalNpcsTalkedTo >= 10,
    effect: { type: 'multi', effects: [
      { type: 'statBonus', stat: 'maxHp', value: 3 },
      { type: 'hungerBonus', value: 10 },
    ]},
  },

  // Legacy (multi-generation) — expanded tiers
  {
    id: 'bloodline_awakened',
    name: 'Bloodline Awakened',
    description: '5 generations. +2 HP, +1 attack, +1 defense, +1 speed.',
    icon: '~',
    color: '#c49eff',
    category: 'legacy',
    condition: (b) => b.generation >= 5,
    effect: { type: 'multi', effects: [
      { type: 'statBonus', stat: 'maxHp', value: 2 },
      { type: 'statBonus', stat: 'attack', value: 1 },
      { type: 'statBonus', stat: 'defense', value: 1 },
      { type: 'statBonus', stat: 'speed', value: 1 },
    ]},
  },
  {
    id: 'dynasty',
    name: 'Dynasty',
    description: '12 generations + 100 kills. +5 all stats, start with Long Sword.',
    icon: '^',
    color: '#ffdd44',
    category: 'legacy',
    condition: (b) => b.generation >= 12 && b.cumulative.totalKills >= 100,
    effect: { type: 'multi', effects: [
      { type: 'statBonus', stat: 'maxHp', value: 5 },
      { type: 'statBonus', stat: 'attack', value: 5 },
      { type: 'statBonus', stat: 'defense', value: 5 },
      { type: 'statBonus', stat: 'speed', value: 5 },
      { type: 'startingItem', itemName: 'Long Sword' },
    ]},
  },
  {
    id: 'eternal_line',
    name: 'Eternal Line',
    description: '20 generations. +8 all stats, +20% XP.',
    icon: '\u{2726}',
    color: '#ff88ff',
    category: 'legacy',
    condition: (b) => b.generation >= 20,
    effect: { type: 'multi', effects: [
      { type: 'statBonus', stat: 'maxHp', value: 8 },
      { type: 'statBonus', stat: 'attack', value: 8 },
      { type: 'statBonus', stat: 'defense', value: 8 },
      { type: 'statBonus', stat: 'speed', value: 8 },
      { type: 'xpMultiplier', value: 1.20 },
    ]},
  },
  {
    id: 'legend',
    name: 'Legend',
    description: '30 generations + floor 10. +10 all stats, start with War Axe + Plate Armor.',
    icon: '\u{2605}',
    color: '#ffaa00',
    category: 'legacy',
    condition: (b) => b.generation >= 30 && b.cumulative.highestFloor >= 10,
    effect: { type: 'multi', effects: [
      { type: 'statBonus', stat: 'maxHp', value: 10 },
      { type: 'statBonus', stat: 'attack', value: 10 },
      { type: 'statBonus', stat: 'defense', value: 10 },
      { type: 'statBonus', stat: 'speed', value: 10 },
      { type: 'startingItem', itemName: 'War Axe' },
      { type: 'startingItem', itemName: 'Plate Armor' },
    ]},
  },

  // Bestiary milestone traits (includes all variant forms)
  {
    id: 'bestiary_novice',
    name: 'Creature Spotter',
    description: 'Discover 25 monsters or variants. +1 attack.',
    icon: '\u{1F4D6}',
    color: '#44cc88',
    category: 'exploration',
    condition: (b) => Object.keys(b.bestiary ?? {}).length >= 25,
    effect: { type: 'statBonus', stat: 'attack', value: 1 },
  },
  {
    id: 'bestiary_hunter',
    name: 'Monster Hunter',
    description: 'Discover 75 monsters or variants. +2 defense.',
    icon: '\u{1F5E1}',
    color: '#44aacc',
    category: 'exploration',
    condition: (b) => Object.keys(b.bestiary ?? {}).length >= 75,
    effect: { type: 'statBonus', stat: 'defense', value: 2 },
  },
  {
    id: 'bestiary_scholar',
    name: 'Bestiary Scholar',
    description: 'Discover 200 monsters or variants. +3 HP, +1 attack.',
    icon: '\u{1F4DA}',
    color: '#88aaff',
    category: 'exploration',
    condition: (b) => Object.keys(b.bestiary ?? {}).length >= 200,
    effect: { type: 'multi', effects: [
      { type: 'statBonus', stat: 'maxHp', value: 3 },
      { type: 'statBonus', stat: 'attack', value: 1 },
    ]},
  },
  {
    id: 'bestiary_expert',
    name: 'Monster Expert',
    description: 'Discover 500 monsters or variants. +15 starting gold.',
    icon: '\u{1F3C6}',
    color: '#ffaa44',
    category: 'exploration',
    condition: (b) => Object.keys(b.bestiary ?? {}).length >= 500,
    effect: { type: 'startingGold', amount: 15 },
  },
  {
    id: 'bestiary_master',
    name: 'Bestiary Master',
    description: 'Discover 1000 monsters or variants. +3 all stats.',
    icon: '\u{2B50}',
    color: '#ffdd44',
    category: 'exploration',
    condition: (b) => Object.keys(b.bestiary ?? {}).length >= 1000,
    effect: { type: 'multi', effects: [
      { type: 'statBonus', stat: 'maxHp', value: 3 },
      { type: 'statBonus', stat: 'attack', value: 3 },
      { type: 'statBonus', stat: 'defense', value: 3 },
      { type: 'statBonus', stat: 'speed', value: 3 },
    ]},
  },
  {
    id: 'bestiary_legend',
    name: 'Living Encyclopedia',
    description: 'Discover every monster and variant. +5 all stats, +25 gold.',
    icon: '\u{1F451}',
    color: '#ff66ff',
    category: 'legacy',
    condition: (b) => Object.keys(b.bestiary ?? {}).length >= 2000,
    effect: { type: 'multi', effects: [
      { type: 'statBonus', stat: 'maxHp', value: 5 },
      { type: 'statBonus', stat: 'attack', value: 5 },
      { type: 'statBonus', stat: 'defense', value: 5 },
      { type: 'statBonus', stat: 'speed', value: 5 },
      { type: 'startingGold', amount: 25 },
    ]},
  },

  // ── Hell conquest traits ──
  {
    id: 'hell_touched',
    name: 'Hell Touched',
    description: 'Reach floor 5 in Hell. +3 attack, +3 defense.',
    icon: '6',
    color: '#ff4422',
    category: 'combat',
    condition: (b) => (b.bossKillLog ?? []).some(e => e.startsWith('Gatekeeper of Hell|')),
    effect: { type: 'multi', effects: [
      { type: 'statBonus', stat: 'attack', value: 3 },
      { type: 'statBonus', stat: 'defense', value: 3 },
    ]},
  },
  {
    id: 'hellborn_legacy',
    name: "Hellborn's Legacy",
    description: 'Die as Hellborn 2 times. +3 attack, +2 speed for all.',
    icon: '@',
    color: '#ff2200',
    category: 'class',
    condition: (b) => (b.cumulative.classDeaths.hellborn ?? 0) >= 2,
    effect: { type: 'multi', effects: [
      { type: 'statBonus', stat: 'attack', value: 3 },
      { type: 'statBonus', stat: 'speed', value: 2 },
    ]},
  },
  {
    id: 'demon_slayer',
    name: 'Demon Slayer',
    description: 'Defeat Asmodeus. +5 attack, +5 HP.',
    icon: 'A',
    color: '#cc0000',
    category: 'combat',
    condition: (b) => (b.bossKillLog ?? []).some(e => e.startsWith('Asmodeus|')),
    effect: { type: 'multi', effects: [
      { type: 'statBonus', stat: 'attack', value: 5 },
      { type: 'statBonus', stat: 'maxHp', value: 5 },
    ]},
  },
  {
    id: 'hell_conqueror',
    name: 'Hell Conqueror',
    description: 'Defeat Lucifer. +10 all stats, start with Hellfire Fruit.',
    icon: '\u{1F451}',
    color: '#ff0000',
    category: 'legacy',
    condition: (b) => (b.bossKillLog ?? []).some(e => e.startsWith('Lucifer|')),
    effect: { type: 'multi', effects: [
      { type: 'statBonus', stat: 'maxHp', value: 10 },
      { type: 'statBonus', stat: 'attack', value: 10 },
      { type: 'statBonus', stat: 'defense', value: 10 },
      { type: 'statBonus', stat: 'speed', value: 10 },
      { type: 'startingItem', itemName: 'Hellfire Fruit' },
    ]},
  },

  // Second-life reward — every new player gets the Ancestor's Fang from their second run onward
  {
    id: 'initiate',
    name: 'Initiate',
    description: 'Survive your first death. Start every run with the Ancestor\'s Fang.',
    icon: ')',
    color: '#c49eff',
    category: 'legacy',
    condition: (b) => b.generation >= 1,
    effect: { type: 'startingItem', itemName: "Ancestor's Fang" },
  },
];

// ── Helpers ──

export function getUnlockedTraits(bloodline: BloodlineData): TraitDef[] {
  return TRAIT_DEFS.filter((t) => bloodline.unlockedTraits.includes(t.id));
}

export function checkForNewTraits(bloodline: BloodlineData): TraitDef[] {
  return TRAIT_DEFS.filter(
    (t) => !bloodline.unlockedTraits.includes(t.id) && t.condition(bloodline),
  );
}

export interface BloodlineBonuses {
  statBonuses: Partial<Stats>;
  startingItems: string[];
  startingGold: number;
  hungerBonus: number;
  xpMultiplier: number;
}

function applyEffect(result: BloodlineBonuses, effect: TraitEffect) {
  switch (effect.type) {
    case 'statBonus':
      result.statBonuses[effect.stat] =
        (result.statBonuses[effect.stat] ?? 0) + effect.value;
      break;
    case 'startingItem':
      result.startingItems.push(effect.itemName);
      break;
    case 'startingGold':
      result.startingGold += effect.amount;
      break;
    case 'hungerBonus':
      result.hungerBonus += effect.value;
      break;
    case 'xpMultiplier':
      result.xpMultiplier *= effect.value;
      break;
    case 'multi':
      for (const e of effect.effects) applyEffect(result, e);
      break;
  }
}

export function computeBloodlineBonuses(bloodline: BloodlineData): BloodlineBonuses {
  const result: BloodlineBonuses = {
    statBonuses: {},
    startingItems: [],
    startingGold: 0,
    hungerBonus: 0,
    xpMultiplier: 1.0,
  };

  // ── Per-generation passive bonus ──
  // Every death (generation) gives permanent stat growth.
  // This is the core "push/die = progress" loop.
  const gen = bloodline.generation;
  if (gen > 0) {
    // First death bonus: big enough that the player genuinely feels
    // stronger on their second run. This is the hook for the death loop.
    if (gen >= 1) {
      result.statBonuses.maxHp = (result.statBonuses.maxHp ?? 0) + 5;
      result.statBonuses.attack = (result.statBonuses.attack ?? 0) + 2;
      result.statBonuses.defense = (result.statBonuses.defense ?? 0) + 1;
      result.statBonuses.speed = (result.statBonuses.speed ?? 0) + 1;
    }
    // HP: +1 per 5 generations (gen 5 = +1 HP, gen 10 = +2 HP, gen 20 = +4 HP)
    result.statBonuses.maxHp = (result.statBonuses.maxHp ?? 0) + Math.floor(gen / 5);
    // Attack: +1 per 15 generations
    result.statBonuses.attack = (result.statBonuses.attack ?? 0) + Math.floor(gen / 15);
    // Defense: +1 per 20 generations
    result.statBonuses.defense = (result.statBonuses.defense ?? 0) + Math.floor(gen / 20);
    // Speed: +1 per 20 generations
    result.statBonuses.speed = (result.statBonuses.speed ?? 0) + Math.floor(gen / 20);
    // Starting gold: +5 per generation
    result.startingGold += gen * 5;
    // Hunger: +3 per generation
    result.hungerBonus += gen * 3;
  }

  // ── Bonus based on deepest floor reached ──
  // Rewards players who push deeper even if they die
  const bestFloor = bloodline.cumulative.highestFloor;
  if (bestFloor >= 3) {
    result.statBonuses.maxHp = (result.statBonuses.maxHp ?? 0) + Math.floor(bestFloor * 1.0);
    result.statBonuses.attack = (result.statBonuses.attack ?? 0) + Math.floor(bestFloor / 4);
  }

  // ── Trait bonuses (on top of passive growth) ──
  for (const traitId of bloodline.unlockedTraits) {
    const def = TRAIT_DEFS.find((t) => t.id === traitId);
    if (!def) continue;
    applyEffect(result, def.effect);
  }

  return result;
}

/** Get progress info for a trait (numerator/denominator for display). */
export function getTraitProgress(
  trait: TraitDef,
  bloodline: BloodlineData,
): { current: number; target: number } | null {
  const c = bloodline.cumulative;
  switch (trait.id) {
    case 'first_fall': return { current: c.totalDeaths, target: 1 };
    case 'stubborn': return { current: c.totalDeaths, target: 3 };
    case 'undying_will': return { current: c.totalDeaths, target: 6 };
    case 'death_defier': return { current: c.totalDeaths, target: 10 };
    case 'blooded': return { current: c.totalKills, target: 5 };
    case 'slayer': return { current: c.totalKills, target: 25 };
    case 'dragonbane': return { current: c.totalMonsterKills['Dragon'] ?? 0, target: 1 };
    case 'thick_hide': return { current: c.totalDamageTaken, target: 150 };
    case 'deep_diver': return { current: c.totalFloors, target: 8 };
    case 'abyss_walker': return { current: c.highestFloor, target: 5 };
    case 'hoarder': return { current: c.totalItemsFound, target: 30 };
    case 'well_fed': return { current: c.totalFoodEaten, target: 10 };
    case 'warriors_legacy': return { current: c.classDeaths.warrior ?? 0, target: 2 };
    case 'rogues_legacy': return { current: c.classDeaths.rogue ?? 0, target: 2 };
    case 'mages_legacy': return { current: c.classDeaths.mage ?? 0, target: 2 };
    case 'rangers_legacy': return { current: c.classDeaths.ranger ?? 0, target: 2 };
    case 'paladins_legacy': return { current: c.classDeaths.paladin ?? 0, target: 2 };
    case 'necromancers_legacy': return { current: c.classDeaths.necromancer ?? 0, target: 2 };
    case 'revenants_legacy': return { current: c.classDeaths.revenant ?? 0, target: 2 };
    case 'veteran': return { current: c.totalKills, target: 50 };
    case 'warlord': return { current: c.totalKills, target: 100 };
    case 'boss_slayer': return { current: bloodline.bossKillLog?.length ?? 0, target: 3 };
    case 'damage_dealer': return { current: c.totalDamageDealt, target: 500 };
    case 'alchemist': return { current: c.totalPotionsUsed, target: 15 };
    case 'scroll_scholar': return { current: c.totalScrollsUsed, target: 10 };
    case 'gold_rush': return { current: c.totalGoldEarned, target: 500 };
    case 'social_butterfly': return { current: c.totalNpcsTalkedTo, target: 10 };
    case 'bloodline_awakened': return { current: bloodline.generation, target: 5 };
    case 'dynasty': return { current: bloodline.generation, target: 12 };
    case 'eternal_line': return { current: bloodline.generation, target: 20 };
    case 'legend': return { current: bloodline.generation, target: 30 };
    case 'bestiary_novice': return { current: Object.keys(bloodline.bestiary ?? {}).length, target: 25 };
    case 'bestiary_hunter': return { current: Object.keys(bloodline.bestiary ?? {}).length, target: 75 };
    case 'bestiary_scholar': return { current: Object.keys(bloodline.bestiary ?? {}).length, target: 200 };
    case 'bestiary_expert': return { current: Object.keys(bloodline.bestiary ?? {}).length, target: 500 };
    case 'bestiary_master': return { current: Object.keys(bloodline.bestiary ?? {}).length, target: 1000 };
    case 'bestiary_legend': return { current: Object.keys(bloodline.bestiary ?? {}).length, target: 2000 };
    case 'hellborn_legacy': return { current: c.classDeaths.hellborn ?? 0, target: 2 };
    case 'hell_touched': return { current: (bloodline.bossKillLog ?? []).some(e => e.startsWith('Gatekeeper of Hell|')) ? 1 : 0, target: 1 };
    case 'demon_slayer': return { current: (bloodline.bossKillLog ?? []).some(e => e.startsWith('Asmodeus|')) ? 1 : 0, target: 1 };
    case 'hell_conqueror': return { current: (bloodline.bossKillLog ?? []).some(e => e.startsWith('Lucifer|')) ? 1 : 0, target: 1 };
    default: return null;
  }
}

/** Merge run stats into cumulative bloodline data. */
export function mergeRunIntoBloodline(
  bloodline: BloodlineData,
  runStats: RunStats,
): void {
  const c = bloodline.cumulative;
  c.totalDeaths++;
  c.totalKills += runStats.kills;
  c.totalDamageDealt += runStats.damageDealt;
  c.totalDamageTaken += runStats.damageTaken;
  c.totalFloors += runStats.floorsCleared;
  c.totalTurns += 1; // counted per run
  c.totalPotionsUsed += runStats.potionsUsed;
  c.totalFoodEaten += runStats.foodEaten;
  c.totalScrollsUsed += runStats.scrollsUsed;
  c.totalItemsFound += runStats.itemsFound;
  c.totalGoldEarned += runStats.goldEarned;
  c.totalNpcsTalkedTo += runStats.npcsTalkedTo;

  for (const [name, count] of Object.entries(runStats.monsterKills)) {
    c.totalMonsterKills[name] = (c.totalMonsterKills[name] ?? 0) + count;
  }
}
