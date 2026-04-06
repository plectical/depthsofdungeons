import type {
  EchoTreeNode, EchoTreePath, EchoNodeCategory, EchoNodeEffect,
  QuestEchoData, Stats, Item, MonsterDef,
} from './types';

// ══════════════════════════════════════════════════════════════
// ECHO TREE — 80 permanent nodes across 7 paths
// Currency: "Echoes" (~) #55ccff
// ══════════════════════════════════════════════════════════════

function n(
  id: string, name: string, description: string, icon: string, color: string,
  category: EchoNodeCategory, tier: 1|2|3|4|5, cost: number,
  requires: string[], effect: EchoNodeEffect,
): EchoTreeNode {
  return { id, name, description, icon, color, category, tier, cost, requires, effect };
}

// ── PATH 1: VITALITY — HP, defense, regen, terrain resist ──

const VITALITY_PATH: EchoTreePath = {
  name: 'Vitality',
  color: '#ff4444',
  icon: '+',
  description: 'Toughen up. Take hits and keep walking.',
  category: 'vitality',
  nodes: [
    n('vit_hp_1',      'Sturdy',          '+3 max HP',                   '+', '#ff4444', 'vitality', 1, 5,  [], { type: 'stat', stat: 'maxHp', value: 3 }),
    n('vit_def_1',     'Tough Skin',      '+1 defense',                  '[', '#ff6644', 'vitality', 1, 5,  [], { type: 'stat', stat: 'defense', value: 1 }),
    n('vit_hp_2',      'Iron Body',       '+5 max HP',                   '+', '#ff3333', 'vitality', 2, 10, ['vit_hp_1', 'vit_def_1'], { type: 'stat', stat: 'maxHp', value: 5 }),
    n('vit_def_2',     'Hardened',        '+2 defense',                  '[', '#ff5533', 'vitality', 2, 10, ['vit_hp_1', 'vit_def_1'], { type: 'stat', stat: 'defense', value: 2 }),
    n('vit_terrain',   'Thick Boots',     '25% less terrain damage',     '~', '#cc8844', 'vitality', 2, 12, ['vit_hp_1', 'vit_def_1'], { type: 'terrainResist', percent: 25 }),
    n('vit_hp_3',      'Titanic Health',  '+8 max HP',                   '+', '#ff2222', 'vitality', 3, 20, ['vit_hp_2', 'vit_def_2', 'vit_terrain'], { type: 'stat', stat: 'maxHp', value: 8 }),
    n('vit_def_3',     'Fortress',        '+3 defense',                  '[', '#ff4422', 'vitality', 3, 20, ['vit_hp_2', 'vit_def_2', 'vit_terrain'], { type: 'stat', stat: 'defense', value: 3 }),
    n('vit_terrain_2', 'Iron Soles',      '50% less terrain damage',     '~', '#aa6633', 'vitality', 3, 22, ['vit_hp_2', 'vit_def_2', 'vit_terrain'], { type: 'terrainResist', percent: 50 }),
    n('vit_hp_4',      'Mountainous',     '+12 max HP',                  '+', '#ff1111', 'vitality', 4, 40, ['vit_hp_3', 'vit_def_3', 'vit_terrain_2'], { type: 'stat', stat: 'maxHp', value: 12 }),
    n('vit_def_4',     'Living Wall',     '+5 defense',                  '[', '#ff3311', 'vitality', 4, 40, ['vit_hp_3', 'vit_def_3', 'vit_terrain_2'], { type: 'stat', stat: 'defense', value: 5 }),
    n('vit_cap',       'Undying',         '+20 HP, +3 def',             '*', '#ff0000', 'vitality', 5, 80, ['vit_hp_4', 'vit_def_4'], { type: 'multi', effects: [
      { type: 'stat', stat: 'maxHp', value: 20 },
      { type: 'stat', stat: 'defense', value: 3 },
    ]}),
  ],
};

// ── PATH 2: MIGHT — Attack, new weapons, skill points ──

const MIGHT_PATH: EchoTreePath = {
  name: 'Might',
  color: '#ff8833',
  icon: '/',
  description: 'Hit harder. Unlock deadly weapons.',
  category: 'might',
  nodes: [
    n('mgt_atk_1',    'Sharp Edge',      '+1 attack',                   '/', '#ff8833', 'might', 1, 5,  [], { type: 'stat', stat: 'attack', value: 1 }),
    n('mgt_atk_2',    'Strong Arm',      '+2 attack',                   '/', '#ff7722', 'might', 1, 5,  [], { type: 'stat', stat: 'attack', value: 2 }),
    n('mgt_atk_3',    'Lethal Force',    '+3 attack',                   '/', '#ff6611', 'might', 2, 10, ['mgt_atk_1', 'mgt_atk_2'], { type: 'stat', stat: 'attack', value: 3 }),
    n('mgt_weap_1',   'Flame Cleaver',   'Unlock Flame Cleaver drops',  ')', '#ff4400', 'might', 2, 12, ['mgt_atk_1', 'mgt_atk_2'], { type: 'unlockWeapon', weaponId: 'echo_flame_cleaver' }),
    n('mgt_sp_1',     'Battle Focus',    '+1 skill point per run',      '^', '#ffcc33', 'might', 2, 15, ['mgt_atk_1', 'mgt_atk_2'], { type: 'bonusSkillPoints', amount: 1 }),
    n('mgt_atk_4',    'Destroyer',       '+4 attack',                   '/', '#ff5500', 'might', 3, 20, ['mgt_atk_3', 'mgt_weap_1', 'mgt_sp_1'], { type: 'stat', stat: 'attack', value: 4 }),
    n('mgt_weap_2',   'Echo Blade',      'Unlock Echo Blade drops',     ')', '#55ccff', 'might', 3, 25, ['mgt_atk_3', 'mgt_weap_1', 'mgt_sp_1'], { type: 'unlockWeapon', weaponId: 'echo_blade' }),
    n('mgt_xp_1',     'Veteran',         '+10% XP from kills',          '^', '#ffaa33', 'might', 3, 22, ['mgt_atk_3', 'mgt_weap_1', 'mgt_sp_1'], { type: 'xpBonus', percent: 10 }),
    n('mgt_atk_5',    'Warlord',         '+6 attack',                   '/', '#ff4400', 'might', 4, 40, ['mgt_atk_4', 'mgt_weap_2', 'mgt_xp_1'], { type: 'stat', stat: 'attack', value: 6 }),
    n('mgt_weap_3',   'Runic Greatsword','Unlock Runic Greatsword',     ')', '#cc66ff', 'might', 4, 45, ['mgt_atk_4', 'mgt_weap_2', 'mgt_xp_1'], { type: 'unlockWeapon', weaponId: 'echo_runic_greatsword' }),
    n('mgt_cap',      'Unstoppable',     '+10 atk, +2 SP/run',         '*', '#ff6600', 'might', 5, 80, ['mgt_atk_5', 'mgt_weap_3'], { type: 'multi', effects: [
      { type: 'stat', stat: 'attack', value: 10 },
      { type: 'bonusSkillPoints', amount: 2 },
    ]}),
  ],
};

// ── PATH 3: AGILITY — Speed, hunger, starting items ──

const AGILITY_PATH: EchoTreePath = {
  name: 'Agility',
  color: '#33ff66',
  icon: '>',
  description: 'Move faster. Stay alive longer.',
  category: 'agility',
  nodes: [
    n('agi_spd_1',    'Quick Step',      '+1 speed',                    '>', '#33ff66', 'agility', 1, 5,  [], { type: 'stat', stat: 'speed', value: 1 }),
    n('agi_spd_2',    'Fleet Foot',      '+2 speed',                    '>', '#22ee55', 'agility', 1, 5,  [], { type: 'stat', stat: 'speed', value: 2 }),
    n('agi_spd_3',    'Lightning',       '+3 speed',                    '>', '#11dd44', 'agility', 2, 10, ['agi_spd_1', 'agi_spd_2'], { type: 'stat', stat: 'speed', value: 3 }),
    n('agi_hunger_1', 'Efficient',       '10% slower hunger drain',     '%', '#88cc44', 'agility', 2, 10, ['agi_spd_1', 'agi_spd_2'], { type: 'hungerSlowdown', percent: 10 }),
    n('agi_pot_1',    'Prepared',        'Start with Health Potion',    '!', '#ff3344', 'agility', 2, 12, ['agi_spd_1', 'agi_spd_2'], { type: 'startingItem', itemName: 'Health Potion' }),
    n('agi_spd_4',    'Wind Walker',     '+4 speed',                    '>', '#00cc33', 'agility', 3, 20, ['agi_spd_3', 'agi_hunger_1', 'agi_pot_1'], { type: 'stat', stat: 'speed', value: 4 }),
    n('agi_hunger_2', 'Survivalist',     '20% slower hunger drain',     '%', '#77bb33', 'agility', 3, 20, ['agi_spd_3', 'agi_hunger_1', 'agi_pot_1'], { type: 'hungerSlowdown', percent: 20 }),
    n('agi_food_1',   'Packed Lunch',    'Start with Meat',             '%', '#e07070', 'agility', 3, 18, ['agi_spd_3', 'agi_hunger_1', 'agi_pot_1'], { type: 'startingItem', itemName: 'Meat' }),
    n('agi_spd_5',    'Phantom',         '+6 speed',                    '>', '#00bb22', 'agility', 4, 40, ['agi_spd_4', 'agi_hunger_2', 'agi_food_1'], { type: 'stat', stat: 'speed', value: 6 }),
    n('agi_cap',      'Ghostly',         '+8 spd, 30% hunger slow',    '*', '#33ff66', 'agility', 5, 80, ['agi_spd_5'], { type: 'multi', effects: [
      { type: 'stat', stat: 'speed', value: 8 },
      { type: 'hungerSlowdown', percent: 30 },
    ]}),
  ],
};

// ── PATH 4: FORTUNE — Gold, loot, shop discount ──

const FORTUNE_PATH: EchoTreePath = {
  name: 'Fortune',
  color: '#ffd700',
  icon: '$',
  description: 'More gold. Better loot. Cheaper shops.',
  category: 'fortune',
  nodes: [
    n('for_gold_1',   'Lucky Find',      '+10 starting gold',           '$', '#ffd700', 'fortune', 1, 5,  [], { type: 'startingGold', amount: 10 }),
    n('for_food_1',   'Provisions',      'Start with Bread',            '%', '#e8c888', 'fortune', 1, 5,  [], { type: 'startingItem', itemName: 'Bread' }),
    n('for_gold_2',   'Treasure Sense',  '+25 starting gold',           '$', '#ffcc00', 'fortune', 2, 10, ['for_gold_1', 'for_food_1'], { type: 'startingGold', amount: 25 }),
    n('for_loot_1',   'Eagle Eye',       '+10% rare loot chance',       ')', '#88aaff', 'fortune', 2, 12, ['for_gold_1', 'for_food_1'], { type: 'lootRarityBoost', percent: 10 }),
    n('for_shop_1',   'Haggler',         '5% shop discount',            '$', '#ffaa33', 'fortune', 2, 10, ['for_gold_1', 'for_food_1'], { type: 'shopDiscount', percent: 5 }),
    n('for_gold_3',   'Midas Touch',     '+50 starting gold',           '$', '#ffbb00', 'fortune', 3, 20, ['for_gold_2', 'for_loot_1', 'for_shop_1'], { type: 'startingGold', amount: 50 }),
    n('for_loot_2',   'Fortune\'s Favor','+20% rare loot chance',       ')', '#6688ff', 'fortune', 3, 22, ['for_gold_2', 'for_loot_1', 'for_shop_1'], { type: 'lootRarityBoost', percent: 20 }),
    n('for_shop_2',   'Merchant Guild',  '10% shop discount',           '$', '#ff9922', 'fortune', 3, 20, ['for_gold_2', 'for_loot_1', 'for_shop_1'], { type: 'shopDiscount', percent: 10 }),
    n('for_loot_3',   'Treasure Hunter', '+30% rare loot chance',       ')', '#4466ff', 'fortune', 4, 40, ['for_gold_3', 'for_loot_2', 'for_shop_2'], { type: 'lootRarityBoost', percent: 30 }),
    n('for_cap',      'Golden Age',      '+100 gold, 40% loot, 15% off','*', '#ffd700', 'fortune', 5, 80, ['for_loot_3'], { type: 'multi', effects: [
      { type: 'startingGold', amount: 100 },
      { type: 'lootRarityBoost', percent: 40 },
      { type: 'shopDiscount', percent: 15 },
    ]}),
  ],
};

// ── PATH 5: MASTERY — XP, skill points, class unlocks ──

const MASTERY_PATH: EchoTreePath = {
  name: 'Mastery',
  color: '#aa55ff',
  icon: '^',
  description: 'Level faster. Unlock new classes.',
  category: 'mastery',
  nodes: [
    n('mas_xp_1',     'Quick Learner',   '+5% XP',                     '^', '#aa55ff', 'mastery', 1, 5,  [], { type: 'xpBonus', percent: 5 }),
    n('mas_sp_1',     'Prodigy',         '+1 skill point per run',     '^', '#cc77ff', 'mastery', 1, 8,  [], { type: 'bonusSkillPoints', amount: 1 }),
    n('mas_xp_2',     'Studied',         '+10% XP',                    '^', '#9944ee', 'mastery', 2, 12, ['mas_xp_1', 'mas_sp_1'], { type: 'xpBonus', percent: 10 }),
    n('mas_class_1',  'Holy Order',      'Unlock Paladin',             'P', '#ffdd44', 'mastery', 2, 15, ['mas_xp_1', 'mas_sp_1'], { type: 'unlockClass', classId: 'paladin' }),
    n('mas_class_2',  'Nature\'s Call',  'Unlock Ranger',              'R', '#33cc66', 'mastery', 2, 15, ['mas_xp_1', 'mas_sp_1'], { type: 'unlockClass', classId: 'ranger' }),
    n('mas_xp_3',     'Enlightened',     '+15% XP',                    '^', '#8833dd', 'mastery', 3, 25, ['mas_xp_2', 'mas_class_1', 'mas_class_2'], { type: 'xpBonus', percent: 15 }),
    n('mas_class_3',  'Dark Arts',       'Unlock Necromancer',         'N', '#aa44dd', 'mastery', 3, 30, ['mas_xp_2', 'mas_class_1', 'mas_class_2'], { type: 'unlockClass', classId: 'necromancer' }),
    n('mas_class_4',  'Deathless',       'Unlock Revenant',            'V', '#ff4444', 'mastery', 3, 30, ['mas_xp_2', 'mas_class_1', 'mas_class_2'], { type: 'unlockClass', classId: 'revenant' }),
    n('mas_sp_2',     'Grandmaster',     '+2 skill points per run',    '^', '#bb66ff', 'mastery', 4, 50, ['mas_xp_3', 'mas_class_3', 'mas_class_4'], { type: 'bonusSkillPoints', amount: 2 }),
    n('mas_xp_4',     'Sage',            '+25% XP',                    '^', '#7722cc', 'mastery', 4, 50, ['mas_xp_3', 'mas_class_3', 'mas_class_4'], { type: 'xpBonus', percent: 25 }),
    n('mas_class_5',  'Hellforged',      'Unlock Hellborn',            '6', '#ff2200', 'mastery', 4, 75, ['mas_sp_2', 'mas_xp_4'], { type: 'unlockClass', classId: 'hellborn' }),
    n('mas_cap',      'Transcendent',    '+3 SP, +30% XP',             '*', '#aa55ff', 'mastery', 5, 100, ['mas_sp_2', 'mas_xp_4'], { type: 'multi', effects: [
      { type: 'bonusSkillPoints', amount: 3 },
      { type: 'xpBonus', percent: 30 },
    ]}),
  ],
};

// ── PATH 6: EXPLORATION — Zones, floors, hunger ──

const EXPLORATION_PATH: EchoTreePath = {
  name: 'Exploration',
  color: '#33ccff',
  icon: '#',
  description: 'Open new zones. Go deeper.',
  category: 'exploration',
  nodes: [
    n('exp_hunger_1', 'Iron Stomach',    '+15 max hunger',              '%', '#33ccff', 'exploration', 1, 5,  [], { type: 'hungerMax', amount: 15 }),
    n('exp_food_1',   'Forager',         'Start with Meat',             '%', '#e07070', 'exploration', 1, 5,  [], { type: 'startingItem', itemName: 'Meat' }),
    n('exp_hunger_2', 'Big Belly',       '+30 max hunger',              '%', '#22bbee', 'exploration', 2, 10, ['exp_hunger_1', 'exp_food_1'], { type: 'hungerMax', amount: 30 }),
    n('exp_zone_1',   'Frozen Gate',     'Unlock Frozen Caverns',       '*', '#88ddff', 'exploration', 2, 15, ['exp_hunger_1', 'exp_food_1'], { type: 'unlockZone', zoneId: 'frozen_caverns' }),
    n('exp_zone_2',   'Marsh Gate',      'Unlock Fungal Marsh',         '~', '#44cc22', 'exploration', 2, 15, ['exp_hunger_1', 'exp_food_1'], { type: 'unlockZone', zoneId: 'fungal_marsh' }),
    n('exp_floor_1',  'Deep Tunnels',    '+3 max floors in all zones',  '>', '#1199dd', 'exploration', 3, 25, ['exp_hunger_2', 'exp_zone_1', 'exp_zone_2'], { type: 'maxFloorExtend', floors: 3 }),
    n('exp_zone_3',   'Infernal Gate',   'Unlock Infernal Pit',         '!', '#ff5522', 'exploration', 3, 25, ['exp_hunger_2', 'exp_zone_1', 'exp_zone_2'], { type: 'unlockZone', zoneId: 'infernal_pit' }),
    n('exp_zone_4',   'Crystal Gate',    'Unlock Crystal Sanctum',      '+', '#cc77ff', 'exploration', 3, 25, ['exp_hunger_2', 'exp_zone_1', 'exp_zone_2'], { type: 'unlockZone', zoneId: 'crystal_sanctum' }),
    n('exp_zone_5',   'Shadow Gate',     'Unlock Shadow Realm',         'V', '#aa44ff', 'exploration', 4, 50, ['exp_floor_1', 'exp_zone_3', 'exp_zone_4'], { type: 'unlockZone', zoneId: 'shadow_realm' }),
    n('exp_floor_2',  'Endless Depths',  '+5 more max floors',          '>', '#0088cc', 'exploration', 4, 50, ['exp_floor_1', 'exp_zone_3', 'exp_zone_4'], { type: 'maxFloorExtend', floors: 5 }),
    n('exp_zone_hell','Hell Gate',       'Unlock Hell',                 '6', '#ff2200', 'exploration', 4, 75, ['exp_zone_5', 'exp_floor_2'], { type: 'unlockZone', zoneId: 'hell' }),
    n('exp_cap',      'World Walker',    'All zones, +5 all stats',     '*', '#33ccff', 'exploration', 5, 100, ['exp_zone_5', 'exp_floor_2'], { type: 'multi', effects: [
      { type: 'stat', stat: 'maxHp', value: 5 },
      { type: 'stat', stat: 'attack', value: 5 },
      { type: 'stat', stat: 'defense', value: 5 },
      { type: 'stat', stat: 'speed', value: 5 },
    ]}),
  ],
};

// ── PATH 7: ARCANE — Starting items, new enemies, new weapons ──

const ARCANE_PATH: EchoTreePath = {
  name: 'Arcane',
  color: '#cc66ff',
  icon: '?',
  description: 'Unlock new enemies and powerful relics.',
  category: 'arcane',
  nodes: [
    n('arc_pot_1',    'Brew Master',     'Start with Greater HP Potion', '!', '#ff77bb', 'arcane', 1, 8,  [], { type: 'startingItem', itemName: 'Greater Health Potion' }),
    n('arc_scr_1',    'Scroll Keeper',   'Start with Scroll of Fire',   '?', '#ff5500', 'arcane', 1, 8,  [], { type: 'startingItem', itemName: 'Scroll of Fireball' }),
    n('arc_enemy_1',  'Crystal Golem',   'Unlock Crystal Golem enemy',  'G', '#cc88ff', 'arcane', 2, 15, ['arc_pot_1', 'arc_scr_1'], { type: 'unlockEnemy', enemyId: 'echo_crystal_golem' }),
    n('arc_enemy_2',  'Void Wyrm',       'Unlock Void Wyrm enemy',      'W', '#7722dd', 'arcane', 2, 15, ['arc_pot_1', 'arc_scr_1'], { type: 'unlockEnemy', enemyId: 'echo_void_wyrm' }),
    n('arc_weap_1',   'Echo Hammer',     'Unlock Echo Hammer drops',    ')', '#55ccff', 'arcane', 2, 18, ['arc_pot_1', 'arc_scr_1'], { type: 'unlockWeapon', weaponId: 'echo_hammer' }),
    n('arc_weap_2',   'Void Fang',       'Unlock Void Fang drops',      ')', '#7744aa', 'arcane', 3, 25, ['arc_enemy_1', 'arc_enemy_2', 'arc_weap_1'], { type: 'unlockWeapon', weaponId: 'echo_void_fang' }),
    n('arc_enemy_3',  'Shadow Stalker',  'Unlock Shadow Stalker enemy', 'S', '#5533aa', 'arcane', 3, 25, ['arc_enemy_1', 'arc_enemy_2', 'arc_weap_1'], { type: 'unlockEnemy', enemyId: 'echo_shadow_stalker' }),
    n('arc_weap_3',   'Spectral Staff',  'Unlock Spectral Staff drops', ')', '#88ddff', 'arcane', 3, 28, ['arc_enemy_1', 'arc_enemy_2', 'arc_weap_1'], { type: 'unlockWeapon', weaponId: 'echo_spectral_staff' }),
    n('arc_enemy_4',  'Ancient Dragon',  'Unlock Ancient Dragon boss',  'D', '#ff6600', 'arcane', 4, 60, ['arc_weap_2', 'arc_enemy_3', 'arc_weap_3'], { type: 'unlockEnemy', enemyId: 'echo_ancient_dragon' }),
    n('arc_weap_4',   'Worldbreaker',    'Unlock Worldbreaker weapon',  ')', '#ff4400', 'arcane', 4, 60, ['arc_weap_2', 'arc_enemy_3', 'arc_weap_3'], { type: 'unlockWeapon', weaponId: 'echo_worldbreaker' }),
    n('arc_cap',      'Echo Master',     '+5 all stats, Unlock all',    '*', '#cc66ff', 'arcane', 5, 120, ['arc_enemy_4', 'arc_weap_4'], { type: 'multi', effects: [
      { type: 'stat', stat: 'maxHp', value: 5 },
      { type: 'stat', stat: 'attack', value: 5 },
      { type: 'stat', stat: 'defense', value: 5 },
      { type: 'stat', stat: 'speed', value: 5 },
    ]}),
  ],
};

// ── All paths ──

export const ECHO_TREE_PATHS: EchoTreePath[] = [
  VITALITY_PATH,
  MIGHT_PATH,
  AGILITY_PATH,
  FORTUNE_PATH,
  MASTERY_PATH,
  EXPLORATION_PATH,
  ARCANE_PATH,
];

// ══════════════════════════════════════════════════════════════
// ECHO-GATED CONTENT — weapons and enemies unlocked via tree
// ══════════════════════════════════════════════════════════════

export const ECHO_WEAPONS: Record<string, Omit<Item, 'id'>> = {
  echo_flame_cleaver: {
    name: 'Flame Cleaver', type: 'weapon', char: ')', color: '#ff6622', value: 45,
    equipSlot: 'weapon', element: 'fire', statBonus: { attack: 8 },
    description: 'Forged in echo-fire', onHitEffect: { type: 'fireball', damage: 6, chance: 0.25 },
  },
  echo_blade: {
    name: 'Echo Blade', type: 'weapon', char: ')', color: '#55ccff', value: 60,
    equipSlot: 'weapon', statBonus: { attack: 10, speed: 2 },
    description: 'Hums with echo energy', onHitEffect: { type: 'stun', chance: 0.15 },
  },
  echo_runic_greatsword: {
    name: 'Runic Greatsword', type: 'weapon', char: ')', color: '#cc66ff', value: 85,
    equipSlot: 'weapon', statBonus: { attack: 14, defense: 2 },
    description: 'Ancient runes glow along the blade', onHitEffect: { type: 'fireball', damage: 8, chance: 0.2 },
  },
  echo_hammer: {
    name: 'Echo Hammer', type: 'weapon', char: ')', color: '#55ccff', value: 50,
    equipSlot: 'weapon', statBonus: { attack: 9, defense: 1 },
    description: 'Reverberates on impact', onHitEffect: { type: 'stun', chance: 0.2 },
  },
  echo_void_fang: {
    name: 'Void Fang', type: 'weapon', char: ')', color: '#7744aa', value: 55,
    equipSlot: 'weapon', element: 'dark', statBonus: { attack: 8, speed: 3 },
    description: 'Drips with void essence', onHitEffect: { type: 'lifesteal', percent: 15 },
  },
  echo_spectral_staff: {
    name: 'Spectral Staff', type: 'weapon', char: ')', color: '#88ddff', value: 65,
    equipSlot: 'weapon', statBonus: { attack: 11, speed: 1 }, range: 3,
    description: 'Fires spectral bolts', onHitEffect: { type: 'freeze', chance: 0.2, turns: 2 },
  },
  echo_worldbreaker: {
    name: 'Worldbreaker', type: 'weapon', char: ')', color: '#ff4400', value: 120,
    equipSlot: 'weapon', statBonus: { attack: 18, defense: 3 },
    description: 'Shatters reality itself', onHitEffect: { type: 'execute', hpThreshold: 0.25, chance: 0.2 },
  },
};

export const ECHO_ENEMIES: Record<string, MonsterDef> = {
  echo_crystal_golem: {
    name: 'Crystal Golem', char: 'G', color: '#cc88ff',
    stats: { hp: 45, maxHp: 45, attack: 10, defense: 12, speed: 3 },
    xpValue: 50, minFloor: 4, lootChance: 0.4,
    abilities: [
      { type: 'selfHeal', amount: 6, hpThreshold: 0.4, cooldown: 5 },
      { type: 'stunAttack', chance: 0.15 },
    ],
  },
  echo_void_wyrm: {
    name: 'Void Wyrm', char: 'W', color: '#7722dd', element: 'dark',
    stats: { hp: 35, maxHp: 35, attack: 14, defense: 4, speed: 10 },
    xpValue: 45, minFloor: 5, lootChance: 0.35,
    abilities: [
      { type: 'drainLife', percent: 20, chance: 0.25 },
      { type: 'chargeAttack', multiplier: 1.6, chance: 0.2 },
    ],
  },
  echo_shadow_stalker: {
    name: 'Shadow Stalker', char: 'S', color: '#5533aa',
    stats: { hp: 25, maxHp: 25, attack: 16, defense: 2, speed: 14 },
    xpValue: 40, minFloor: 5, lootChance: 0.3,
    abilities: [
      { type: 'dodge', chance: 0.3 },
      { type: 'bleedAttack', damage: 3, turns: 3, chance: 0.3 },
    ],
  },
  echo_ancient_dragon: {
    name: 'Ancient Dragon', char: 'D', color: '#ff6600',
    stats: { hp: 200, maxHp: 200, attack: 25, defense: 14, speed: 7 },
    xpValue: 500, minFloor: 8, lootChance: 1.0, isBoss: true,
    bossAbility: { type: 'multi', abilities: [
      { type: 'aoe', damage: 18, radius: 3, cooldown: 4 },
      { type: 'rage', hpThreshold: 0.25, atkMultiplier: 2.0 },
      { type: 'heal', amount: 20, cooldown: 6 },
    ]},
    guaranteedLoot: 'Dragon Crown',
  },
};

// Dragon Crown — boss loot for Ancient Dragon
export const ECHO_BOSS_LOOT: Omit<Item, 'id'>[] = [
  {
    name: 'Dragon Crown', type: 'amulet', char: '"', color: '#ff6600', value: 200,
    equipSlot: 'amulet', statBonus: { attack: 8, defense: 6, speed: 3, maxHp: 15 },
    description: 'Crown of the Ancient Dragon',
  },
];

// ══════════════════════════════════════════════════════════════
// UNLOCK LOGIC
// ══════════════════════════════════════════════════════════════

/** Get a specific echo node by ID */
export function getEchoNode(nodeId: string): EchoTreeNode | null {
  for (const path of ECHO_TREE_PATHS) {
    const nd = path.nodes.find(n => n.id === nodeId);
    if (nd) return nd;
  }
  return null;
}

/** Get the path name for a given node ID */
export function getEchoNodePathName(nodeId: string): string {
  for (const path of ECHO_TREE_PATHS) {
    if (path.nodes.some(n => n.id === nodeId)) return path.name;
  }
  return '';
}

/** Get total number of echo tree nodes */
export function getEchoNodeCount(): number {
  return ECHO_TREE_PATHS.reduce((sum, p) => sum + p.nodes.length, 0);
}

/** Check if an echo node can be unlocked */
export function canUnlockEchoNode(
  nodeId: string,
  unlockedNodes: string[],
  echoes: number,
): { canUnlock: boolean; reason?: string } {
  const nd = getEchoNode(nodeId);
  if (!nd) return { canUnlock: false, reason: 'Node not found' };
  if (unlockedNodes.includes(nodeId)) return { canUnlock: false, reason: 'Already unlocked' };
  if (echoes < nd.cost) return { canUnlock: false, reason: `Need ${nd.cost} Echoes` };

  // Find which path this node belongs to
  let path: EchoTreePath | null = null;
  for (const p of ECHO_TREE_PATHS) {
    if (p.nodes.some(n => n.id === nodeId)) { path = p; break; }
  }
  if (!path) return { canUnlock: false, reason: 'No path' };

  // Prerequisite: need N nodes from previous tier in same path
  if (nd.tier > 1) {
    const prevTier = nd.tier - 1;
    const prevTierNodes = path.nodes.filter(n => n.tier === prevTier);
    const unlockedPrevCount = prevTierNodes.filter(n => unlockedNodes.includes(n.id)).length;

    let required: number;
    if (nd.tier === 2) required = 1;
    else if (nd.tier === 3) required = 2;
    else if (nd.tier === 4) required = Math.min(2, prevTierNodes.length);
    else required = prevTierNodes.length; // capstone needs all T4

    if (unlockedPrevCount < required) {
      return { canUnlock: false, reason: `Unlock ${required} tier ${prevTier} node${required > 1 ? 's' : ''} first` };
    }
  }

  return { canUnlock: true };
}

// ══════════════════════════════════════════════════════════════
// COMPUTE ECHO BONUSES — applied at game start
// ══════════════════════════════════════════════════════════════

export interface EchoBonuses {
  statBonuses: Partial<Stats>;
  startingItems: string[];
  startingGold: number;
  bonusSkillPoints: number;
  xpBonusPercent: number;
  lootRarityBoostPercent: number;
  shopDiscountPercent: number;
  hungerSlowdownPercent: number;
  terrainResistPercent: number;
  maxFloorExtend: number;
  hungerMaxBonus: number;
  unlockedClasses: string[];
  unlockedZones: string[];
  unlockedWeapons: string[];
  unlockedEnemies: string[];
}

export function computeEchoBonuses(data: QuestEchoData): EchoBonuses {
  const result: EchoBonuses = {
    statBonuses: {},
    startingItems: [],
    startingGold: 0,
    bonusSkillPoints: 0,
    xpBonusPercent: 0,
    lootRarityBoostPercent: 0,
    shopDiscountPercent: 0,
    hungerSlowdownPercent: 0,
    terrainResistPercent: 0,
    maxFloorExtend: 0,
    hungerMaxBonus: 0,
    unlockedClasses: [],
    unlockedZones: [],
    unlockedWeapons: [],
    unlockedEnemies: [],
  };

  for (const nodeId of data.unlockedEchoNodes) {
    const nd = getEchoNode(nodeId);
    if (!nd) continue;
    applyEchoEffect(result, nd.effect);
  }

  return result;
}

function applyEchoEffect(r: EchoBonuses, effect: EchoNodeEffect): void {
  switch (effect.type) {
    case 'stat':
      r.statBonuses[effect.stat] = (r.statBonuses[effect.stat] ?? 0) + effect.value;
      break;
    case 'startingGold':
      r.startingGold += effect.amount;
      break;
    case 'startingItem':
      r.startingItems.push(effect.itemName);
      break;
    case 'unlockClass':
      if (!r.unlockedClasses.includes(effect.classId)) r.unlockedClasses.push(effect.classId);
      break;
    case 'unlockZone':
      if (!r.unlockedZones.includes(effect.zoneId)) r.unlockedZones.push(effect.zoneId);
      break;
    case 'unlockWeapon':
      if (!r.unlockedWeapons.includes(effect.weaponId)) r.unlockedWeapons.push(effect.weaponId);
      break;
    case 'unlockEnemy':
      if (!r.unlockedEnemies.includes(effect.enemyId)) r.unlockedEnemies.push(effect.enemyId);
      break;
    case 'bonusSkillPoints':
      r.bonusSkillPoints += effect.amount;
      break;
    case 'xpBonus':
      r.xpBonusPercent += effect.percent;
      break;
    case 'lootRarityBoost':
      r.lootRarityBoostPercent += effect.percent;
      break;
    case 'shopDiscount':
      r.shopDiscountPercent += effect.percent;
      break;
    case 'hungerSlowdown':
      r.hungerSlowdownPercent += effect.percent;
      break;
    case 'terrainResist':
      r.terrainResistPercent += effect.percent;
      break;
    case 'maxFloorExtend':
      r.maxFloorExtend += effect.floors;
      break;
    case 'hungerMax':
      r.hungerMaxBonus += effect.amount;
      break;
    case 'multi':
      for (const e of effect.effects) applyEchoEffect(r, e);
      break;
  }
}

/** Get unlocked weapon templates for the loot pool */
export function getEchoWeapons(unlockedNodes: string[]): Omit<Item, 'id'>[] {
  const weapons: Omit<Item, 'id'>[] = [];
  for (const nodeId of unlockedNodes) {
    const nd = getEchoNode(nodeId);
    if (!nd) continue;
    collectWeaponsFromEffect(nd.effect, weapons);
  }
  return weapons;
}

function collectWeaponsFromEffect(effect: EchoNodeEffect, out: Omit<Item, 'id'>[]): void {
  if (effect.type === 'unlockWeapon') {
    const w = ECHO_WEAPONS[effect.weaponId];
    if (w) out.push(w);
  } else if (effect.type === 'multi') {
    for (const e of effect.effects) collectWeaponsFromEffect(e, out);
  }
}

/** Get unlocked enemy definitions for the spawn pool */
export function getEchoEnemies(unlockedNodes: string[]): MonsterDef[] {
  const enemies: MonsterDef[] = [];
  for (const nodeId of unlockedNodes) {
    const nd = getEchoNode(nodeId);
    if (!nd) continue;
    collectEnemiesFromEffect(nd.effect, enemies);
  }
  return enemies;
}

function collectEnemiesFromEffect(effect: EchoNodeEffect, out: MonsterDef[]): void {
  if (effect.type === 'unlockEnemy') {
    const e = ECHO_ENEMIES[effect.enemyId];
    if (e) out.push(e);
  } else if (effect.type === 'multi') {
    for (const ef of effect.effects) collectEnemiesFromEffect(ef, out);
  }
}
