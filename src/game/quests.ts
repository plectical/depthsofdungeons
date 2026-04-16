import type {
  QuestTemplateDef, QuestEchoData, RunQuestTracker,
} from './types';

// ══════════════════════════════════════════════════════════════
// QUEST TEMPLATES — 55 quests across 5 tiers covering every
// game feature: combat, classes, mercs, shops, NPCs, bosses,
// terrain, consumables, auto-play, traits, bestiary, zones,
// weapons, armor, ranged, ancestors.
// ══════════════════════════════════════════════════════════════

export const QUEST_TEMPLATES: QuestTemplateDef[] = [

  // ── TIER 1 — Beginner (3-5 Echoes, achievable in 1-2 runs) ──

  { id: 'q_kill_10',       name: 'Pest Control',       description: 'Kill 10 monsters',                icon: '/', color: '#ff5566', tier: 1, objective: { type: 'kill_total', target: 10 }, reward: 3, persistsAcrossRuns: true },
  { id: 'q_reach_f3',      name: 'Deeper Descent',     description: 'Reach floor 3',                   icon: '>', color: '#33ff66', tier: 1, objective: { type: 'reach_floor', target: 3 }, reward: 3, persistsAcrossRuns: false },
  { id: 'q_eat_5',         name: 'Well Fed',           description: 'Eat 5 food items',                icon: '%', color: '#e8c888', tier: 1, objective: { type: 'eat_food', target: 5 }, reward: 3, persistsAcrossRuns: true },
  { id: 'q_use_3_pot',     name: 'Potion Drinker',     description: 'Use 3 potions',                   icon: '!', color: '#ff3344', tier: 1, objective: { type: 'use_potions', target: 3 }, reward: 4, persistsAcrossRuns: true },
  { id: 'q_reach_lv3',     name: 'Growing Stronger',   description: 'Reach level 3 in a run',          icon: '^', color: '#ffcc33', tier: 1, objective: { type: 'reach_level', target: 3 }, reward: 5, persistsAcrossRuns: false },
  { id: 'q_collect_50g',   name: 'Gold Fever',         description: 'Collect 50 gold in one run',      icon: '$', color: '#ffd700', tier: 1, objective: { type: 'collect_gold_run', target: 50 }, reward: 4, persistsAcrossRuns: false },
  { id: 'q_talk_npc_1',    name: 'Friendly Chat',      description: 'Talk to an NPC',                  icon: '@', color: '#55ccff', tier: 1, objective: { type: 'talk_to_npc', target: 1 }, reward: 3, persistsAcrossRuns: true },
  { id: 'q_buy_1',         name: 'First Purchase',     description: 'Buy something from a shop',       icon: '$', color: '#ffaa33', tier: 1, objective: { type: 'buy_from_shop', target: 1 }, reward: 3, persistsAcrossRuns: true },
  { id: 'q_auto_50',       name: 'Hands Off',          description: 'Use auto-play for 50 turns',      icon: '>', color: '#44bbff', tier: 1, objective: { type: 'use_auto_turns', target: 50 }, reward: 4, persistsAcrossRuns: true },
  { id: 'q_eat_bread',     name: 'Daily Bread',        description: 'Eat 3 Bread',                     icon: '%', color: '#e8c888', tier: 1, objective: { type: 'eat_named_food', target: 3, qualifier: 'Bread' }, reward: 3, persistsAcrossRuns: true },

  { id: 'q_spend_sp_3',    name: 'Skill Student',      description: 'Spend 3 skill points',            icon: '^', color: '#ffcc33', tier: 1, objective: { type: 'spend_skill_points', target: 3 }, reward: 4, persistsAcrossRuns: true },

  // ── TIER 2 — Intermediate (8-12 Echoes, 3-5 runs) ──

  { id: 'q_kill_rats_20',  name: 'Rat Exterminator',   description: 'Kill 20 Rats',                    icon: 'r', color: '#886644', tier: 2, objective: { type: 'kill_monster_type', target: 20, qualifier: 'Rat' }, reward: 8, persistsAcrossRuns: true },
  { id: 'q_kill_skele_15', name: 'Bone Breaker',       description: 'Kill 15 Skeletons',               icon: 's', color: '#ccccdd', tier: 2, objective: { type: 'kill_monster_type', target: 15, qualifier: 'Skeleton' }, reward: 8, persistsAcrossRuns: true },
  { id: 'q_reach_f5',      name: 'Into the Depths',    description: 'Reach floor 5',                   icon: '>', color: '#33ff66', tier: 2, objective: { type: 'reach_floor', target: 5 }, reward: 10, persistsAcrossRuns: false },
  { id: 'q_defeat_boss',   name: 'Boss Slayer',        description: 'Defeat any boss',                 icon: 'B', color: '#ff4444', tier: 2, objective: { type: 'defeat_boss', target: 1 }, reward: 10, persistsAcrossRuns: false },
  { id: 'q_discover_10',   name: 'Curious Explorer',   description: 'Discover 10 bestiary entries',    icon: '?', color: '#55ccff', tier: 2, objective: { type: 'discover_bestiary', target: 10 }, reward: 8, persistsAcrossRuns: true },
  { id: 'q_hire_merc',     name: 'Hired Muscle',       description: 'Hire a mercenary',                icon: 'M', color: '#88aacc', tier: 2, objective: { type: 'hire_mercenary', target: 1 }, reward: 8, persistsAcrossRuns: true },
  { id: 'q_collect_150g',  name: 'Gold Rush',          description: 'Collect 150 gold in one run',     icon: '$', color: '#ffd700', tier: 2, objective: { type: 'collect_gold_run', target: 150 }, reward: 10, persistsAcrossRuns: false },
  { id: 'q_survive_100',   name: 'Endurance Trial',    description: 'Survive 100 turns in one run',    icon: '#', color: '#88aacc', tier: 2, objective: { type: 'survive_turns', target: 100 }, reward: 10, persistsAcrossRuns: false },
  { id: 'q_kill_war_20',   name: 'Warrior\'s Trial',   description: 'Kill 20 enemies as Warrior',      icon: 'W', color: '#ff6644', tier: 2, objective: { type: 'kill_with_class', target: 20, qualifier: 'warrior' }, reward: 10, persistsAcrossRuns: true },
  { id: 'q_kill_rog_20',   name: 'Rogue\'s Contract',  description: 'Kill 20 enemies as Rogue',        icon: 'R', color: '#ffcc33', tier: 2, objective: { type: 'kill_with_class', target: 20, qualifier: 'rogue' }, reward: 10, persistsAcrossRuns: true },
  { id: 'q_buy_5',         name: 'Loyal Customer',     description: 'Buy 5 items from shops',          icon: '$', color: '#ffaa33', tier: 2, objective: { type: 'buy_from_shop', target: 5 }, reward: 8, persistsAcrossRuns: true },
  { id: 'q_walk_lava_20',  name: 'Fire Walker',        description: 'Walk on lava 20 times',           icon: '~', color: '#ff5511', tier: 3, objective: { type: 'walk_terrain', target: 20, qualifier: 'lava' }, reward: 15, persistsAcrossRuns: true },
  { id: 'q_walk_ice_20',   name: 'Ice Treader',        description: 'Walk on ice 20 times',            icon: '~', color: '#88ddff', tier: 3, objective: { type: 'walk_terrain', target: 20, qualifier: 'ice' }, reward: 15, persistsAcrossRuns: true },
  { id: 'q_kill_bats_10',  name: 'Bat Bane',           description: 'Kill 10 Bats',                    icon: 'b', color: '#aaaacc', tier: 2, objective: { type: 'kill_monster_type', target: 10, qualifier: 'Bat' }, reward: 8, persistsAcrossRuns: true },
  { id: 'q_deal_100_dmg',  name: 'First Blood',        description: 'Deal 100 damage in one run',      icon: '/', color: '#ff5544', tier: 2, objective: { type: 'deal_damage_run', target: 100 }, reward: 8, persistsAcrossRuns: false },
  { id: 'q_use_scroll_3',  name: 'Scroll Scholar',     description: 'Use 3 scrolls',                   icon: '?', color: '#f5e8c8', tier: 2, objective: { type: 'use_scrolls', target: 3 }, reward: 8, persistsAcrossRuns: true },
  { id: 'q_talk_npc_3',    name: 'Social Butterfly',   description: 'Talk to 3 NPCs',                  icon: '@', color: '#55ccff', tier: 2, objective: { type: 'talk_to_npc', target: 3 }, reward: 10, persistsAcrossRuns: true },
  { id: 'q_ranged_20',     name: 'Sharpshooter',       description: 'Make 20 ranged attacks',          icon: '>', color: '#ff8844', tier: 2, objective: { type: 'use_ranged_attack', target: 20 }, reward: 10, persistsAcrossRuns: true },
  { id: 'q_use_hp_pot',    name: 'Medicine Man',       description: 'Use 5 Health Potions',            icon: '!', color: '#ff3344', tier: 2, objective: { type: 'use_named_potion', target: 5, qualifier: 'Health Potion' }, reward: 8, persistsAcrossRuns: true },
  { id: 'q_echo_3',        name: 'Echo Dabbler',       description: 'Unlock 3 echo upgrades',          icon: '~', color: '#55ccff', tier: 2, objective: { type: 'unlock_echo_nodes', target: 3 }, reward: 10, persistsAcrossRuns: true },
  { id: 'q_spend_sp_10',   name: 'Skill Spender',      description: 'Spend 10 skill points',           icon: '^', color: '#ffcc33', tier: 2, objective: { type: 'spend_skill_points', target: 10 }, reward: 10, persistsAcrossRuns: true },

  // ── TIER 3 — Advanced (15-25 Echoes, 5-10 runs) ──

  { id: 'q_kill_50',       name: 'Veteran Slayer',     description: 'Kill 50 monsters',                icon: '/', color: '#ff4444', tier: 3, objective: { type: 'kill_total', target: 50 }, reward: 15, persistsAcrossRuns: true },
  { id: 'q_reach_f8',      name: 'Deep Diver',         description: 'Reach floor 8',                   icon: '>', color: '#33cc66', tier: 3, objective: { type: 'reach_floor', target: 8 }, reward: 18, persistsAcrossRuns: false },
  { id: 'q_clear_nodmg',   name: 'Untouchable',        description: 'Clear a floor without damage',    icon: '!', color: '#ffd700', tier: 3, objective: { type: 'clear_floor_nodamage', target: 1 }, reward: 20, persistsAcrossRuns: false },
  { id: 'q_goblin_king',   name: 'Regicide',           description: 'Defeat the Goblin King',          icon: 'K', color: '#44dd44', tier: 3, objective: { type: 'defeat_named_boss', target: 1, qualifier: 'Goblin King' }, reward: 20, persistsAcrossRuns: false },
  { id: 'q_equip_rare',    name: 'Treasure Seeker',    description: 'Equip a Rare item',               icon: ')', color: '#4488ff', tier: 3, objective: { type: 'equip_rarity', target: 1, qualifier: 'rare' }, reward: 15, persistsAcrossRuns: false },
  { id: 'q_deal_500_dmg',  name: 'Damage Dealer',      description: 'Deal 500 damage in one run',      icon: '/', color: '#ff3333', tier: 3, objective: { type: 'deal_damage_run', target: 500 }, reward: 20, persistsAcrossRuns: false },
  { id: 'q_kill_mag_30',   name: 'Mage\'s Study',      description: 'Kill 30 enemies as Mage',         icon: 'M', color: '#aa55ff', tier: 3, objective: { type: 'kill_with_class', target: 30, qualifier: 'mage' }, reward: 18, persistsAcrossRuns: true },
  { id: 'q_kill_rng_30',   name: 'Ranger\'s Hunt',     description: 'Kill 30 enemies as Ranger',       icon: 'R', color: '#33cc66', tier: 3, objective: { type: 'kill_with_class', target: 30, qualifier: 'ranger' }, reward: 18, persistsAcrossRuns: true },
  { id: 'q_hire_3_merc',   name: 'Army Builder',       description: 'Hire 3 mercenaries',              icon: 'M', color: '#88aacc', tier: 3, objective: { type: 'hire_mercenary', target: 3 }, reward: 15, persistsAcrossRuns: true },
  { id: 'q_unlock_3_trait',name: 'Trait Collector',     description: 'Unlock 3 bloodline traits',       icon: '+', color: '#ff5566', tier: 3, objective: { type: 'unlock_traits', target: 3 }, reward: 15, persistsAcrossRuns: true },
  { id: 'q_ancestor_5',    name: 'Family Tree',        description: 'Have 5 ancestors',                icon: '@', color: '#cc8844', tier: 3, objective: { type: 'ancestor_count', target: 5 }, reward: 15, persistsAcrossRuns: true },
  { id: 'q_walk_poison_30',name: 'Poison Stepper',     description: 'Walk on poison 30 times',         icon: '~', color: '#44cc22', tier: 3, objective: { type: 'walk_terrain', target: 30, qualifier: 'poison' }, reward: 15, persistsAcrossRuns: true },
  { id: 'q_auto_300',      name: 'AFK Champion',       description: 'Use auto-play for 300 turns',     icon: '>', color: '#44bbff', tier: 3, objective: { type: 'use_auto_turns', target: 300 }, reward: 18, persistsAcrossRuns: true },
  { id: 'q_use_ability_10',name: 'Ability Master',     description: 'Use class abilities 10 times',    icon: '*', color: '#cc66ff', tier: 3, objective: { type: 'use_class_ability', target: 10, qualifier: 'any' }, reward: 18, persistsAcrossRuns: true },
  { id: 'q_eat_feast',     name: 'Gourmand',           description: 'Eat 3 Feasts',                    icon: '%', color: '#ffcc44', tier: 3, objective: { type: 'eat_named_food', target: 3, qualifier: 'Feast' }, reward: 15, persistsAcrossRuns: true },
  { id: 'q_echo_10',       name: 'Echo Adept',         description: 'Unlock 10 echo upgrades',         icon: '~', color: '#55ccff', tier: 3, objective: { type: 'unlock_echo_nodes', target: 10 }, reward: 18, persistsAcrossRuns: true },
  { id: 'q_spend_sp_30',   name: 'Skill Expert',       description: 'Spend 30 skill points',           icon: '^', color: '#ffcc33', tier: 3, objective: { type: 'spend_skill_points', target: 30 }, reward: 18, persistsAcrossRuns: true },
  { id: 'q_echo_vitality', name: 'Iron Constitution',  description: 'Unlock 5 Vitality upgrades',      icon: '+', color: '#ff4444', tier: 3, objective: { type: 'unlock_echo_path_node', target: 5, qualifier: 'Vitality' }, reward: 15, persistsAcrossRuns: true },
  { id: 'q_echo_might',    name: 'Path of Might',      description: 'Unlock 5 Might upgrades',         icon: '/', color: '#ff8833', tier: 3, objective: { type: 'unlock_echo_path_node', target: 5, qualifier: 'Might' }, reward: 15, persistsAcrossRuns: true },

  // ── TIER 4 — Expert (30-50 Echoes, many runs) ──

  { id: 'q_kill_100',      name: 'Centurion',          description: 'Kill 100 monsters',               icon: '/', color: '#ff2222', tier: 4, objective: { type: 'kill_total', target: 100 }, reward: 30, persistsAcrossRuns: true },
  { id: 'q_reach_f12',     name: 'Abyssal Explorer',   description: 'Reach floor 12',                  icon: '>', color: '#33ff66', tier: 4, objective: { type: 'reach_floor', target: 12 }, reward: 35, persistsAcrossRuns: false },
  { id: 'q_defeat_lich',   name: 'Lich Slayer',        description: 'Defeat the Lich Emperor',         icon: 'L', color: '#aaddff', tier: 4, objective: { type: 'defeat_named_boss', target: 1, qualifier: 'Lich Emperor' }, reward: 40, persistsAcrossRuns: false },
  { id: 'q_discover_50',   name: 'Monster Scholar',    description: 'Discover 50 bestiary entries',    icon: '?', color: '#55ccff', tier: 4, objective: { type: 'discover_bestiary', target: 50 }, reward: 35, persistsAcrossRuns: true },
  { id: 'q_collect_500g',  name: 'Treasure Hoard',     description: 'Collect 500 gold in one run',     icon: '$', color: '#ffd700', tier: 4, objective: { type: 'collect_gold_run', target: 500 }, reward: 40, persistsAcrossRuns: false },
  { id: 'q_equip_legend',  name: 'Legendary Find',     description: 'Equip a Legendary item',          icon: ')', color: '#ffd700', tier: 4, objective: { type: 'equip_rarity', target: 1, qualifier: 'legendary' }, reward: 40, persistsAcrossRuns: false },
  { id: 'q_kill_pal_50',   name: 'Paladin\'s Crusade', description: 'Kill 50 enemies as Paladin',      icon: 'P', color: '#ffdd44', tier: 4, objective: { type: 'kill_with_class', target: 50, qualifier: 'paladin' }, reward: 35, persistsAcrossRuns: true },
  { id: 'q_kill_nec_50',   name: 'Necro Harvest',      description: 'Kill 50 enemies as Necromancer',  icon: 'N', color: '#aa44dd', tier: 4, objective: { type: 'kill_with_class', target: 50, qualifier: 'necromancer' }, reward: 35, persistsAcrossRuns: true },
  { id: 'q_complete_frozen',name:'Frozen Conqueror',    description: 'Beat the Frozen Caverns final boss',icon:'*',color: '#88ddff', tier: 4, objective: { type: 'complete_zone', target: 1, qualifier: 'frozen_caverns' }, reward: 40, persistsAcrossRuns: false },
  { id: 'q_ancestor_15',   name: 'Dynasty',            description: 'Have 15 ancestors',               icon: '@', color: '#cc8844', tier: 4, objective: { type: 'ancestor_count', target: 15 }, reward: 30, persistsAcrossRuns: true },
  { id: 'q_unlock_10_trait',name:'Trait Master',        description: 'Unlock 10 bloodline traits',      icon: '+', color: '#ff5566', tier: 4, objective: { type: 'unlock_traits', target: 10 }, reward: 35, persistsAcrossRuns: true },
  { id: 'q_ranged_100',    name: 'Dead-Eye',           description: 'Make 100 ranged attacks',         icon: '>', color: '#ff8844', tier: 4, objective: { type: 'use_ranged_attack', target: 100 }, reward: 30, persistsAcrossRuns: true },
  { id: 'q_echo_30',       name: 'Echo Scholar',       description: 'Unlock 30 echo upgrades',         icon: '~', color: '#55ccff', tier: 4, objective: { type: 'unlock_echo_nodes', target: 30 }, reward: 35, persistsAcrossRuns: true },
  { id: 'q_spend_sp_75',   name: 'Skill Master',       description: 'Spend 75 skill points',           icon: '^', color: '#ffcc33', tier: 4, objective: { type: 'spend_skill_points', target: 75 }, reward: 35, persistsAcrossRuns: true },
  { id: 'q_echo_explore',  name: 'World Seeker',       description: 'Unlock 5 Exploration upgrades',   icon: '#', color: '#33ccff', tier: 4, objective: { type: 'unlock_echo_path_node', target: 5, qualifier: 'Exploration' }, reward: 30, persistsAcrossRuns: true },
  { id: 'q_echo_fortune',  name: 'Golden Path',        description: 'Unlock 5 Fortune upgrades',       icon: '$', color: '#ffd700', tier: 4, objective: { type: 'unlock_echo_path_node', target: 5, qualifier: 'Fortune' }, reward: 30, persistsAcrossRuns: true },
  { id: 'q_hell_gate',     name: 'Gate Crasher',       description: 'Defeat the Gatekeeper of Hell',   icon: '6', color: '#ff4422', tier: 4, objective: { type: 'defeat_named_boss', target: 1, qualifier: 'Gatekeeper of Hell' }, reward: 50, persistsAcrossRuns: false },

  // ── TIER 5 — Master (60-100 Echoes, endgame) ──

  { id: 'q_nameless',      name: 'Face the Nameless',  description: 'Defeat The Nameless One',         icon: '?', color: '#aa00ff', tier: 5, objective: { type: 'defeat_named_boss', target: 1, qualifier: 'The Nameless One' }, reward: 100, persistsAcrossRuns: false },
  { id: 'q_kill_250',      name: 'Legend of Slaughter', description: 'Kill 250 monsters',               icon: '/', color: '#ff0000', tier: 5, objective: { type: 'kill_total', target: 250 }, reward: 60, persistsAcrossRuns: true },
  { id: 'q_reach_f15',     name: 'Rock Bottom',        description: 'Reach floor 15',                  icon: '>', color: '#33ff66', tier: 5, objective: { type: 'reach_floor', target: 15 }, reward: 80, persistsAcrossRuns: false },
  { id: 'q_equip_mythic',  name: 'Mythic Wielder',     description: 'Equip a Mythic item',             icon: ')', color: '#ff55ff', tier: 5, objective: { type: 'equip_rarity', target: 1, qualifier: 'mythic' }, reward: 80, persistsAcrossRuns: false },
  { id: 'q_complete_shadow',name:'Shadow Conqueror',    description: 'Beat the Shadow Realm final boss',icon:'V',color: '#aa44ff', tier: 5, objective: { type: 'complete_zone', target: 1, qualifier: 'shadow_realm' }, reward: 80, persistsAcrossRuns: false },
  { id: 'q_auto_1000',     name: 'True AFK',           description: 'Use auto-play for 1000 turns',    icon: '>', color: '#44bbff', tier: 5, objective: { type: 'use_auto_turns', target: 1000 }, reward: 60, persistsAcrossRuns: true },
  { id: 'q_echo_60',       name: 'Echo Master',        description: 'Unlock 60 echo upgrades',         icon: '~', color: '#55ccff', tier: 5, objective: { type: 'unlock_echo_nodes', target: 60 }, reward: 80, persistsAcrossRuns: true },
  { id: 'q_spend_sp_150',  name: 'Grandmaster',        description: 'Spend 150 skill points',          icon: '^', color: '#ffcc33', tier: 5, objective: { type: 'spend_skill_points', target: 150 }, reward: 60, persistsAcrossRuns: true },
  { id: 'q_defeat_lucifer',name:'Devil Slayer',        description: 'Defeat Lucifer',                  icon: 'L', color: '#ff0000', tier: 5, objective: { type: 'defeat_named_boss', target: 1, qualifier: 'Lucifer' }, reward: 150, persistsAcrossRuns: false },
  { id: 'q_complete_hell', name: 'Hell Conquered',     description: 'Beat Hell\'s final boss',         icon: '6', color: '#ff2200', tier: 5, objective: { type: 'complete_zone', target: 1, qualifier: 'hell' }, reward: 120, persistsAcrossRuns: false },
  { id: 'q_kill_hb_50',    name: 'Hellfire Reaper',    description: 'Kill 50 enemies as Hellborn',     icon: '6', color: '#ff2200', tier: 5, objective: { type: 'kill_with_class', target: 50, qualifier: 'hellborn' }, reward: 80, persistsAcrossRuns: true },
];

// ══════════════════════════════════════════════════════════════
// DEFAULT DATA
// ══════════════════════════════════════════════════════════════

export function createDefaultQuestEchoData(): QuestEchoData {
  return {
    version: 1,
    echoes: 0,
    totalEchoesEarned: 0,
    activeQuests: [],
    completedQuestIds: [],
    unlockedEchoNodes: [],
    counters: {
      totalKills: 0,
      monsterKills: {},
      classKills: {},
      totalBossKills: 0,
      bossesDefeated: [],
      totalGoldEarned: 0,
      totalFoodEaten: 0,
      namedFoodEaten: {},
      totalPotionsUsed: 0,
      namedPotionsUsed: {},
      totalScrollsUsed: 0,
      totalAbilitiesUsed: 0,
      classAbilitiesUsed: {},
      totalMercenariesHired: 0,
      totalShopPurchases: 0,
      totalNpcsTalkedTo: 0,
      totalBestiaryEntries: 0,
      totalTraitsUnlocked: 0,
      totalAncestors: 0,
      terrainSteps: {},
      totalAutoTurns: 0,
      totalRangedAttacks: 0,
      weaponTypeKills: {},
      zonesCompleted: [],
      highestFloor: 0,
      highestLevel: 0,
      highestGoldSingleRun: 0,
      highestDamageSingleRun: 0,
      highestTurnsSingleRun: 0,
      floorsNoDamage: 0,
      rarityEquipped: {},
      namedItemsEquipped: [],
      totalSkillPointsSpent: 0,
      totalEchoNodesUnlocked: 0,
      echoPathNodesUnlocked: {},
    },
  };
}

export function createDefaultRunTracker(): RunQuestTracker {
  return {
    kills: 0,
    monsterKills: {},
    classKills: {},
    bossKills: 0,
    bossesDefeated: [],
    goldEarned: 0,
    damageDelt: 0,
    turnsSurvived: 0,
    foodEaten: 0,
    namedFoodEaten: {},
    potionsUsed: 0,
    namedPotionsUsed: {},
    scrollsUsed: 0,
    abilitiesUsed: 0,
    classAbilitiesUsed: {},
    mercenariesHired: 0,
    shopPurchases: 0,
    npcsTalkedTo: 0,
    highestFloor: 0,
    highestLevel: 0,
    floorsNoDamage: 0,
    traitsUnlocked: 0,
    terrainSteps: {},
    autoTurns: 0,
    rangedAttacks: 0,
    weaponTypeKills: {},
    zonesCompleted: [],
    rarityEquipped: {},
    namedItemsEquipped: [],
    skillPointsSpent: 0,
    echoNodesUnlocked: 0,
    echoPathNodesUnlocked: {},
  };
}

// ══════════════════════════════════════════════════════════════
// QUEST ASSIGNMENT
// ══════════════════════════════════════════════════════════════

/** Max tier available based on total echoes ever earned */
function maxQuestTier(totalEchoesEarned: number): number {
  if (totalEchoesEarned >= 300) return 5;
  if (totalEchoesEarned >= 100) return 4;
  if (totalEchoesEarned >= 20) return 3;
  return 2;
}

/** Pick a random quest from the pool that's eligible and not already active/completed */
function pickQuest(data: QuestEchoData): QuestTemplateDef | null {
  const maxTier = maxQuestTier(data.totalEchoesEarned);
  const activeIds = new Set(data.activeQuests.map(q => q.templateId));
  const completedIds = new Set(data.completedQuestIds);

  const eligible = QUEST_TEMPLATES.filter(q =>
    q.tier <= maxTier &&
    !activeIds.has(q.id) &&
    !completedIds.has(q.id)
  );

  if (eligible.length === 0) {
    // All quests completed — allow re-rolling from completed pool (exclude active)
    const reroll = QUEST_TEMPLATES.filter(q =>
      q.tier <= maxTier && !activeIds.has(q.id)
    );
    if (reroll.length === 0) return null;
    return reroll[Math.floor(Math.random() * reroll.length)]!;
  }

  // Weighted toward lower tiers for variety
  const weighted: QuestTemplateDef[] = [];
  for (const q of eligible) {
    const weight = Math.max(1, 6 - q.tier); // T1=5, T2=4, T3=3, T4=2, T5=1
    for (let i = 0; i < weight; i++) weighted.push(q);
  }
  return weighted[Math.floor(Math.random() * weighted.length)]!;
}

/** Fill empty quest slots up to 5 */
export function fillQuestSlots(data: QuestEchoData): void {
  while (data.activeQuests.length < 5) {
    const tmpl = pickQuest(data);
    if (!tmpl) break;
    data.activeQuests.push({
      templateId: tmpl.id,
      progress: 0,
      completed: false,
    });
  }
}

// ══════════════════════════════════════════════════════════════
// QUEST PROGRESS CHECKING
// ══════════════════════════════════════════════════════════════

/** Get the quest template for an active quest */
export function getQuestTemplate(templateId: string): QuestTemplateDef | undefined {
  return QUEST_TEMPLATES.find(q => q.id === templateId);
}

/**
 * Check and update all active quests against current counters + run tracker.
 *
 * For persistent quests (persistsAcrossRuns: true), progress is the *sum* of
 * the saved persistent counters AND the current run tracker — because the
 * persistent counters only get merged on death. Without this, live progress
 * during a run would stay at the old value and appear stuck.
 *
 * For high-water-mark counters (highest floor, highest gold in single run, etc.)
 * we take Math.max instead of adding.
 *
 * For single-run quests (persistsAcrossRuns: false), we only use the runTracker.
 */
export function updateQuestProgress(
  data: QuestEchoData,
  runTracker: RunQuestTracker | null,
  bestiaryCount: number,
  ancestorCount: number,
  traitCount: number,
): void {
  const c = data.counters;
  const r = runTracker;

  for (const quest of data.activeQuests) {
    if (quest.completed) continue;
    const tmpl = getQuestTemplate(quest.templateId);
    if (!tmpl) continue;

    // If there's no active run tracker and this is a single-run quest,
    // keep existing progress (don't reset to 0 after death).
    if (!r && !tmpl.persistsAcrossRuns) continue;

    const obj = tmpl.objective;
    let progress = 0;

    switch (obj.type) {
      case 'kill_total':
        progress = tmpl.persistsAcrossRuns ? c.totalKills + (r?.kills ?? 0) : (r?.kills ?? 0);
        break;
      case 'kill_monster_type':
        progress = tmpl.persistsAcrossRuns
          ? (c.monsterKills[obj.qualifier!] ?? 0) + (r?.monsterKills[obj.qualifier!] ?? 0)
          : (r?.monsterKills[obj.qualifier!] ?? 0);
        break;
      case 'kill_with_class':
        progress = tmpl.persistsAcrossRuns
          ? (c.classKills[obj.qualifier!] ?? 0) + (r?.classKills[obj.qualifier!] ?? 0)
          : (r?.classKills[obj.qualifier!] ?? 0);
        break;
      case 'reach_floor':
        // High-water mark — take the max, not sum
        progress = tmpl.persistsAcrossRuns
          ? Math.max(c.highestFloor, r?.highestFloor ?? 0)
          : (r?.highestFloor ?? 0);
        break;
      case 'reach_level':
        progress = tmpl.persistsAcrossRuns
          ? Math.max(c.highestLevel, r?.highestLevel ?? 0)
          : (r?.highestLevel ?? 0);
        break;
      case 'clear_floor_nodamage':
        progress = tmpl.persistsAcrossRuns
          ? c.floorsNoDamage + (r?.floorsNoDamage ?? 0)
          : (r?.floorsNoDamage ?? 0);
        break;
      case 'collect_gold_run':
        // Single-run high-water mark — compare persistent best vs current run
        progress = tmpl.persistsAcrossRuns
          ? Math.max(c.highestGoldSingleRun, r?.goldEarned ?? 0)
          : (r?.goldEarned ?? 0);
        break;
      case 'deal_damage_run':
        progress = tmpl.persistsAcrossRuns
          ? Math.max(c.highestDamageSingleRun, r?.damageDelt ?? 0)
          : (r?.damageDelt ?? 0);
        break;
      case 'survive_turns':
        progress = tmpl.persistsAcrossRuns
          ? Math.max(c.highestTurnsSingleRun, r?.turnsSurvived ?? 0)
          : (r?.turnsSurvived ?? 0);
        break;
      case 'defeat_boss':
        progress = tmpl.persistsAcrossRuns
          ? c.totalBossKills + (r?.bossKills ?? 0)
          : (r?.bossKills ?? 0);
        break;
      case 'defeat_named_boss': {
        const hasBoss = c.bossesDefeated.includes(obj.qualifier!)
          || (r?.bossesDefeated.includes(obj.qualifier!) ?? false);
        progress = hasBoss ? 1 : 0;
        break;
      }
      case 'complete_zone': {
        const hasZone = c.zonesCompleted.includes(obj.qualifier!)
          || (r?.zonesCompleted.includes(obj.qualifier!) ?? false);
        progress = hasZone ? 1 : 0;
        break;
      }
      case 'discover_bestiary':
        progress = bestiaryCount;
        break;
      case 'eat_food':
        progress = tmpl.persistsAcrossRuns
          ? c.totalFoodEaten + (r?.foodEaten ?? 0)
          : (r?.foodEaten ?? 0);
        break;
      case 'eat_named_food':
        progress = tmpl.persistsAcrossRuns
          ? (c.namedFoodEaten[obj.qualifier!] ?? 0) + (r?.namedFoodEaten[obj.qualifier!] ?? 0)
          : (r?.namedFoodEaten[obj.qualifier!] ?? 0);
        break;
      case 'use_potions':
        progress = tmpl.persistsAcrossRuns
          ? c.totalPotionsUsed + (r?.potionsUsed ?? 0)
          : (r?.potionsUsed ?? 0);
        break;
      case 'use_named_potion':
        progress = tmpl.persistsAcrossRuns
          ? (c.namedPotionsUsed[obj.qualifier!] ?? 0) + (r?.namedPotionsUsed[obj.qualifier!] ?? 0)
          : (r?.namedPotionsUsed[obj.qualifier!] ?? 0);
        break;
      case 'use_scrolls':
        progress = tmpl.persistsAcrossRuns
          ? c.totalScrollsUsed + (r?.scrollsUsed ?? 0)
          : (r?.scrollsUsed ?? 0);
        break;
      case 'use_ability':
        progress = tmpl.persistsAcrossRuns
          ? c.totalAbilitiesUsed + (r?.abilitiesUsed ?? 0)
          : (r?.abilitiesUsed ?? 0);
        break;
      case 'use_class_ability':
        if (obj.qualifier === 'any') {
          progress = tmpl.persistsAcrossRuns
            ? c.totalAbilitiesUsed + (r?.abilitiesUsed ?? 0)
            : (r?.abilitiesUsed ?? 0);
        } else {
          progress = tmpl.persistsAcrossRuns
            ? (c.classAbilitiesUsed[obj.qualifier!] ?? 0) + (r?.classAbilitiesUsed[obj.qualifier!] ?? 0)
            : (r?.classAbilitiesUsed[obj.qualifier!] ?? 0);
        }
        break;
      case 'hire_mercenary':
        progress = tmpl.persistsAcrossRuns
          ? c.totalMercenariesHired + (r?.mercenariesHired ?? 0)
          : (r?.mercenariesHired ?? 0);
        break;
      case 'buy_from_shop':
        progress = tmpl.persistsAcrossRuns
          ? c.totalShopPurchases + (r?.shopPurchases ?? 0)
          : (r?.shopPurchases ?? 0);
        break;
      case 'talk_to_npc':
        progress = tmpl.persistsAcrossRuns
          ? c.totalNpcsTalkedTo + (r?.npcsTalkedTo ?? 0)
          : (r?.npcsTalkedTo ?? 0);
        break;
      case 'equip_rarity':
        progress = (c.rarityEquipped?.[obj.qualifier!] || r?.rarityEquipped?.[obj.qualifier!]) ? 1 : 0;
        break;
      case 'equip_named_item':
        progress = ((c.namedItemsEquipped ?? []).includes(obj.qualifier!)
          || ((r?.namedItemsEquipped ?? []).includes(obj.qualifier!))) ? 1 : 0;
        break;
      case 'unlock_traits':
        progress = traitCount;
        break;
      case 'ancestor_count':
        progress = ancestorCount;
        break;
      case 'walk_terrain':
        progress = tmpl.persistsAcrossRuns
          ? (c.terrainSteps[obj.qualifier!] ?? 0) + (r?.terrainSteps[obj.qualifier!] ?? 0)
          : (r?.terrainSteps[obj.qualifier!] ?? 0);
        break;
      case 'use_auto_turns':
        progress = tmpl.persistsAcrossRuns
          ? c.totalAutoTurns + (r?.autoTurns ?? 0)
          : (r?.autoTurns ?? 0);
        break;
      case 'use_ranged_attack':
        progress = tmpl.persistsAcrossRuns
          ? c.totalRangedAttacks + (r?.rangedAttacks ?? 0)
          : (r?.rangedAttacks ?? 0);
        break;
      case 'kill_with_weapon_type':
        progress = tmpl.persistsAcrossRuns
          ? (c.weaponTypeKills[obj.qualifier!] ?? 0) + (r?.weaponTypeKills[obj.qualifier!] ?? 0)
          : (r?.weaponTypeKills[obj.qualifier!] ?? 0);
        break;
      case 'spend_skill_points':
        progress = tmpl.persistsAcrossRuns
          ? (c.totalSkillPointsSpent ?? 0) + (r?.skillPointsSpent ?? 0)
          : (r?.skillPointsSpent ?? 0);
        break;
      case 'unlock_echo_nodes':
        // Echo nodes are cumulative (not per-run), so take max
        progress = Math.max(c.totalEchoNodesUnlocked ?? 0, r?.echoNodesUnlocked ?? 0);
        break;
      case 'unlock_echo_path_node': {
        const pathNodes = c.echoPathNodesUnlocked ?? {};
        const runPathNodes = r?.echoPathNodesUnlocked ?? {};
        progress = Math.max(pathNodes[obj.qualifier!] ?? 0, runPathNodes[obj.qualifier!] ?? 0);
        break;
      }
    }

    quest.progress = progress;
    if (progress >= obj.target) {
      quest.completed = true;
    }
  }
}

// ══════════════════════════════════════════════════════════════
// CLAIM QUEST REWARD
// ══════════════════════════════════════════════════════════════

/** Claim a completed quest's reward, remove it, and assign a new one. Returns echoes earned (0 if not claimable). */
export function claimQuest(data: QuestEchoData, questIndex: number): number {
  const quest = data.activeQuests[questIndex];
  if (!quest || !quest.completed) return 0;

  const tmpl = getQuestTemplate(quest.templateId);
  if (!tmpl) return 0;

  data.echoes += tmpl.reward;
  data.totalEchoesEarned += tmpl.reward;

  if (!data.completedQuestIds.includes(quest.templateId)) {
    data.completedQuestIds.push(quest.templateId);
  }

  // Remove the completed quest
  data.activeQuests.splice(questIndex, 1);

  // Assign a new one
  fillQuestSlots(data);

  return tmpl.reward;
}

// ══════════════════════════════════════════════════════════════
// MERGE RUN TRACKER INTO PERSISTENT COUNTERS
// ══════════════════════════════════════════════════════════════

export function mergeRunIntoCounters(data: QuestEchoData, run: RunQuestTracker): void {
  const c = data.counters;

  c.totalKills += run.kills;
  c.totalBossKills += run.bossKills;
  c.totalGoldEarned += run.goldEarned;
  c.totalFoodEaten += run.foodEaten;
  c.totalPotionsUsed += run.potionsUsed;
  c.totalScrollsUsed += run.scrollsUsed;
  c.totalAbilitiesUsed += run.abilitiesUsed;
  c.totalMercenariesHired += run.mercenariesHired;
  c.totalShopPurchases += run.shopPurchases;
  c.totalNpcsTalkedTo += run.npcsTalkedTo;
  c.totalAutoTurns += run.autoTurns;
  c.totalRangedAttacks += run.rangedAttacks;
  c.floorsNoDamage += run.floorsNoDamage;
  c.totalSkillPointsSpent += run.skillPointsSpent;
  // Echo nodes are cumulative — take the max (they don't reset between runs)
  c.totalEchoNodesUnlocked = Math.max(c.totalEchoNodesUnlocked ?? 0, run.echoNodesUnlocked);
  // Merge echo path nodes
  if (!c.echoPathNodesUnlocked) c.echoPathNodesUnlocked = {};
  for (const [path, count] of Object.entries(run.echoPathNodesUnlocked)) {
    c.echoPathNodesUnlocked[path] = Math.max(c.echoPathNodesUnlocked[path] ?? 0, count);
  }

  // Merge monster kills
  for (const [name, count] of Object.entries(run.monsterKills)) {
    c.monsterKills[name] = (c.monsterKills[name] ?? 0) + count;
  }
  // Merge class kills
  for (const [cls, count] of Object.entries(run.classKills)) {
    c.classKills[cls] = (c.classKills[cls] ?? 0) + count;
  }
  // Merge class abilities
  for (const [cls, count] of Object.entries(run.classAbilitiesUsed)) {
    c.classAbilitiesUsed[cls] = (c.classAbilitiesUsed[cls] ?? 0) + count;
  }
  // Merge named food
  if (!c.namedFoodEaten) c.namedFoodEaten = {};
  for (const [name, count] of Object.entries(run.namedFoodEaten ?? {})) {
    c.namedFoodEaten[name] = (c.namedFoodEaten[name] ?? 0) + count;
  }
  // Merge named potions
  if (!c.namedPotionsUsed) c.namedPotionsUsed = {};
  for (const [name, count] of Object.entries(run.namedPotionsUsed ?? {})) {
    c.namedPotionsUsed[name] = (c.namedPotionsUsed[name] ?? 0) + count;
  }
  // Merge terrain steps
  if (!c.terrainSteps) c.terrainSteps = {};
  for (const [type, count] of Object.entries(run.terrainSteps ?? {})) {
    c.terrainSteps[type] = (c.terrainSteps[type] ?? 0) + count;
  }
  // Merge weapon type kills
  if (!c.weaponTypeKills) c.weaponTypeKills = {};
  for (const [type, count] of Object.entries(run.weaponTypeKills ?? {})) {
    c.weaponTypeKills[type] = (c.weaponTypeKills[type] ?? 0) + count;
  }
  // Merge bosses defeated
  if (!c.bossesDefeated) c.bossesDefeated = [];
  for (const boss of (run.bossesDefeated ?? [])) {
    if (!c.bossesDefeated.includes(boss)) c.bossesDefeated.push(boss);
  }
  // Merge zones completed
  if (!c.zonesCompleted) c.zonesCompleted = [];
  for (const zone of (run.zonesCompleted ?? [])) {
    if (!c.zonesCompleted.includes(zone)) c.zonesCompleted.push(zone);
  }
  // Merge rarity equipped
  if (!c.rarityEquipped) c.rarityEquipped = {};
  for (const [rarity, equipped] of Object.entries(run.rarityEquipped ?? {})) {
    if (equipped) c.rarityEquipped[rarity] = true;
  }
  // Merge named items equipped
  if (!c.namedItemsEquipped) c.namedItemsEquipped = [];
  for (const name of (run.namedItemsEquipped ?? [])) {
    if (!c.namedItemsEquipped.includes(name)) c.namedItemsEquipped.push(name);
  }

  // Update highwater marks
  c.highestFloor = Math.max(c.highestFloor, run.highestFloor);
  c.highestLevel = Math.max(c.highestLevel, run.highestLevel);
  c.highestGoldSingleRun = Math.max(c.highestGoldSingleRun, run.goldEarned);
  c.highestDamageSingleRun = Math.max(c.highestDamageSingleRun, run.damageDelt);
  c.highestTurnsSingleRun = Math.max(c.highestTurnsSingleRun, run.turnsSurvived);
}

/** Patch missing fields when loading older data */
export function patchQuestEchoData(data: QuestEchoData): QuestEchoData {
  const def = createDefaultQuestEchoData();
  data.counters = { ...def.counters, ...data.counters };
  if (!data.activeQuests) data.activeQuests = [];
  if (!data.completedQuestIds) data.completedQuestIds = [];
  if (!data.unlockedEchoNodes) data.unlockedEchoNodes = [];
  // Backfill echo node counter from existing unlocked nodes list
  if (!data.counters.totalEchoNodesUnlocked && data.unlockedEchoNodes.length > 0) {
    data.counters.totalEchoNodesUnlocked = data.unlockedEchoNodes.length;
  }
  return data;
}
