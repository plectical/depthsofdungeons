/**
 * Archetype Definitions
 * These are the mechanical foundations that AI-generated classes are built upon
 */

import type { ArchetypeDef, ArchetypeId } from './types';

export const ARCHETYPES: Record<ArchetypeId, ArchetypeDef> = {
  territory: {
    id: 'territory',
    name: 'Territory',
    description: 'Modify the battlefield. Create walls, traps, and hazard zones to control enemy movement and deal damage.',
    mechanicType: 'positional',
    requiresSpecialUI: true,
    uiComponent: 'territory_overlay',
    resourceTemplate: {
      nameOptions: ['Fault Lines', 'Terra', 'Stone Essence', 'Geomancy', 'Earth Power', 'Ley Energy'],
      maxRange: [10, 20],
      regenMethods: ['on_move', 'on_kill', 'per_turn'],
    },
    abilityTemplates: [
      { type: 'create_wall', description: 'Create impassable terrain', costRange: [2, 4], effects: ['block', 'cover'] },
      { type: 'create_trap', description: 'Create damaging terrain', costRange: [3, 5], effects: ['damage', 'slow'] },
      { type: 'create_zone', description: 'Create area effect', costRange: [4, 6], effects: ['dot', 'debuff'] },
      { type: 'destroy_terrain', description: 'Remove terrain for burst damage', costRange: [5, 8], effects: ['aoe_damage'] },
    ],
    counterEnemyTypes: ['burrower', 'phase_enemy', 'terrain_eater', 'flyer', 'teleporter'],
    skillTreeHints: ['wider_area', 'terrain_damage', 'terrain_heal', 'terrain_duration', 'seismic_sense'],
  },

  rhythm: {
    id: 'rhythm',
    name: 'Rhythm',
    description: 'Maintain tempo to build power. Miss a beat and lose your stacks. Perfect timing rewards devastating abilities.',
    mechanicType: 'timing',
    requiresSpecialUI: true,
    uiComponent: 'rhythm_bar',
    resourceTemplate: {
      nameOptions: ['Resonance', 'Tempo', 'Harmony', 'Beat', 'Cadence', 'Rhythm'],
      maxRange: [8, 16],
      regenMethods: ['on_rhythm_beat'],
    },
    abilityTemplates: [
      { type: 'tempo_attack', description: 'Attack that scales with combo', costRange: [0, 0], effects: ['damage_scaling'] },
      { type: 'crescendo', description: 'Spend all stacks for burst', costRange: [8, 16], effects: ['massive_damage'] },
      { type: 'harmony_shield', description: 'Defense at high tempo', costRange: [4, 6], effects: ['shield', 'reflect'] },
      { type: 'song_of_power', description: 'Buff that requires tempo', costRange: [6, 10], effects: ['buff_all_stats'] },
    ],
    counterEnemyTypes: ['silence_enemy', 'cacophony', 'stun_attacker', 'interrupt', 'tempo_disruptor'],
    skillTreeHints: ['tempo_forgiveness', 'faster_tempo', 'combo_damage', 'rhythm_heal', 'perfect_bonus'],
  },

  typing: {
    id: 'typing',
    name: 'Typing',
    description: 'Cast spells by typing words. Speed and accuracy determine power. Master the arcane language of magic.',
    mechanicType: 'input',
    requiresSpecialUI: true,
    uiComponent: 'typing_input',
    resourceTemplate: {
      nameOptions: ['Lexicon', 'Words', 'Ink', 'Script', 'Runes', 'Syllables'],
      maxRange: [100, 200],
      regenMethods: ['on_correct_input', 'per_turn'],
    },
    abilityTemplates: [
      { type: 'quick_word', description: 'Short word, quick cast', costRange: [10, 20], effects: ['fast_damage'] },
      { type: 'power_word', description: 'Long word, big damage', costRange: [30, 50], effects: ['heavy_damage'] },
      { type: 'healing_verse', description: 'Type phrase to heal', costRange: [20, 30], effects: ['heal'] },
      { type: 'word_of_binding', description: 'Type to stun enemy', costRange: [25, 40], effects: ['stun', 'root'] },
    ],
    counterEnemyTypes: ['scrambler', 'word_stealer', 'mute', 'speed_attacker', 'distraction'],
    skillTreeHints: ['autocorrect', 'shorter_words', 'typing_speed', 'crit_on_perfect', 'word_chain'],
  },

  sacrifice: {
    id: 'sacrifice',
    name: 'Sacrifice',
    description: 'Consume your resources for power. Eat gear, spend HP, devour enemies. The more you give, the stronger you become.',
    mechanicType: 'resource',
    requiresSpecialUI: false,
    resourceTemplate: {
      nameOptions: ['Hunger', 'Consumption', 'Void', 'Appetite', 'Essence', 'Absorption'],
      maxRange: [50, 100],
      regenMethods: ['on_kill', 'on_damage_taken'],
    },
    abilityTemplates: [
      { type: 'consume_gear', description: 'Destroy item for stats', costRange: [0, 0], effects: ['permanent_buff'] },
      { type: 'blood_price', description: 'Spend HP for damage', costRange: [0, 0], effects: ['hp_to_damage'] },
      { type: 'devour', description: 'Eat low HP enemy', costRange: [20, 30], effects: ['execute', 'heal', 'buff'] },
      { type: 'offering', description: 'Sacrifice gold for power', costRange: [0, 0], effects: ['gold_to_buff'] },
    ],
    counterEnemyTypes: ['inedible', 'poison_body', 'regenerator', 'empty_enemy', 'reflection'],
    skillTreeHints: ['efficient_consume', 'hp_to_power', 'gear_synergy', 'overkill_heal', 'permanent_growth'],
  },

  companion: {
    id: 'companion',
    name: 'Companion',
    description: 'Never fight alone. Summon minions, control beasts, raise the dead. Your army fights while you command.',
    mechanicType: 'state',
    requiresSpecialUI: true,
    uiComponent: 'companion_panel',
    resourceTemplate: {
      nameOptions: ['Soul Shards', 'Command', 'Pack Bond', 'Necromancy', 'Summoning', 'Control'],
      maxRange: [6, 12],
      regenMethods: ['on_kill', 'per_turn', 'on_damage_taken'],
    },
    abilityTemplates: [
      { type: 'summon', description: 'Create a minion', costRange: [3, 5], effects: ['spawn_ally'] },
      { type: 'command_attack', description: 'All minions attack', costRange: [2, 3], effects: ['minion_burst'] },
      { type: 'sacrifice_minion', description: 'Destroy minion for effect', costRange: [0, 0], effects: ['minion_boom'] },
      { type: 'raise_dead', description: 'Turn corpse into ally', costRange: [4, 6], effects: ['resurrect'] },
    ],
    counterEnemyTypes: ['aoe_attacker', 'minion_controller', 'fear_aura', 'single_target_burst', 'companion_killer'],
    skillTreeHints: ['more_minions', 'stronger_minions', 'minion_heal', 'corpse_explosion', 'eternal_servants'],
  },

  trickster: {
    id: 'trickster',
    name: 'Trickster',
    description: 'Why fight when you can manipulate? Turn enemies against each other. Charm, confuse, and deceive your way to victory.',
    mechanicType: 'state',
    requiresSpecialUI: false,
    resourceTemplate: {
      nameOptions: ['Influence', 'Charm', 'Deception', 'Guile', 'Manipulation', 'Cunning'],
      maxRange: [10, 20],
      regenMethods: ['on_kill', 'per_turn', 'on_hit'],
    },
    abilityTemplates: [
      { type: 'charm', description: 'Convert enemy to ally', costRange: [8, 12], effects: ['convert'] },
      { type: 'confuse', description: 'Enemy attacks randomly', costRange: [4, 6], effects: ['confuse'] },
      { type: 'mirror_image', description: 'Create decoy', costRange: [5, 8], effects: ['decoy', 'dodge'] },
      { type: 'backstab_setup', description: 'Charmed ally deals bonus', costRange: [3, 5], effects: ['ally_buff'] },
    ],
    counterEnemyTypes: ['mindless', 'immune_to_charm', 'true_sight', 'solo_boss', 'swarm'],
    skillTreeHints: ['charm_duration', 'mass_confuse', 'permanent_convert', 'charmed_damage', 'illusion_master'],
  },

  momentum: {
    id: 'momentum',
    name: 'Momentum',
    description: 'Keep moving or die. Every step builds power. Standing still is weakness. Dance through the dungeon like a storm.',
    mechanicType: 'positional',
    requiresSpecialUI: false,
    resourceTemplate: {
      nameOptions: ['Momentum', 'Velocity', 'Wind', 'Flow', 'Rush', 'Speed'],
      maxRange: [10, 20],
      regenMethods: ['on_move'],
    },
    abilityTemplates: [
      { type: 'dash_attack', description: 'Move and attack in one', costRange: [3, 5], effects: ['dash', 'damage'] },
      { type: 'whirlwind', description: 'Spin attack all adjacent', costRange: [6, 10], effects: ['aoe'] },
      { type: 'afterimage', description: 'Leave damaging trail', costRange: [4, 6], effects: ['trail_damage'] },
      { type: 'blitz', description: 'Multiple rapid strikes', costRange: [8, 12], effects: ['multi_hit'] },
    ],
    counterEnemyTypes: ['root_attacker', 'slow_field', 'corner_trapper', 'web_spinner', 'grappler'],
    skillTreeHints: ['momentum_decay_slow', 'movement_speed', 'dash_damage', 'never_stop', 'velocity_defense'],
  },

  combo: {
    id: 'combo',
    name: 'Combo',
    description: 'Chain specific actions for multiplying power. Build your combo, vary your attacks, unleash devastating finishers.',
    mechanicType: 'state',
    requiresSpecialUI: true,
    uiComponent: 'combo_tracker',
    resourceTemplate: {
      nameOptions: ['Combo', 'Chain', 'Flow', 'Sequence', 'Style', 'Finesse'],
      maxRange: [20, 30],
      regenMethods: ['on_combo'],
    },
    abilityTemplates: [
      { type: 'opener', description: 'Start a combo', costRange: [0, 0], effects: ['combo_start'] },
      { type: 'chain_hit', description: 'Continue combo', costRange: [0, 0], effects: ['combo_continue'] },
      { type: 'finisher', description: 'End combo for burst', costRange: [10, 20], effects: ['combo_end', 'massive_damage'] },
      { type: 'reset', description: 'Start fresh with bonus', costRange: [5, 10], effects: ['combo_reset', 'buff'] },
    ],
    counterEnemyTypes: ['combo_breaker', 'interrupt', 'dodge_master', 'counter_attacker', 'phase_enemy'],
    skillTreeHints: ['longer_combo', 'combo_damage', 'combo_forgiveness', 'finisher_power', 'infinite_chain'],
  },

  transform: {
    id: 'transform',
    name: 'Transform',
    description: 'Shift between forms, each with unique abilities. Master multiple playstyles in one class.',
    mechanicType: 'state',
    requiresSpecialUI: true,
    uiComponent: 'form_switcher',
    resourceTemplate: {
      nameOptions: ['Shift', 'Essence', 'Form', 'Aspect', 'Morph', 'Shape'],
      maxRange: [100, 100],
      regenMethods: ['per_turn'],
    },
    abilityTemplates: [
      { type: 'shift_form', description: 'Change to alternate form', costRange: [20, 30], effects: ['transform'] },
      { type: 'form_1_ability', description: 'Base form ability', costRange: [10, 15], effects: ['form_specific'] },
      { type: 'form_2_ability', description: 'Alt form ability', costRange: [10, 15], effects: ['form_specific'] },
      { type: 'hybrid_burst', description: 'Use both forms at once', costRange: [50, 75], effects: ['dual_form'] },
    ],
    counterEnemyTypes: ['form_locker', 'adaptation', 'mirror_enemy', 'anti_magic', 'suppress'],
    skillTreeHints: ['faster_shift', 'form_power', 'hybrid_duration', 'passive_in_both', 'ultimate_form'],
  },

  reflection: {
    id: 'reflection',
    name: 'Reflection',
    description: 'Turn pain into power. The more damage you take, the harder you hit back. A martyr who weaponizes suffering.',
    mechanicType: 'resource',
    requiresSpecialUI: false,
    resourceTemplate: {
      nameOptions: ['Vengeance', 'Pain', 'Wrath', 'Retribution', 'Thorns', 'Karma'],
      maxRange: [50, 100],
      regenMethods: ['on_damage_taken'],
    },
    abilityTemplates: [
      { type: 'reflect', description: 'Return damage taken', costRange: [0, 0], effects: ['reflect_damage'] },
      { type: 'martyrdom', description: 'Take hit, deal double', costRange: [10, 20], effects: ['absorb', 'counter'] },
      { type: 'pain_release', description: 'Spend HP for aoe', costRange: [20, 30], effects: ['hp_cost', 'aoe'] },
      { type: 'undying', description: 'Survive lethal, counter', costRange: [50, 75], effects: ['survive_death', 'massive_counter'] },
    ],
    counterEnemyTypes: ['healer', 'ranged', 'dot_attacker', 'execute', 'life_drain'],
    skillTreeHints: ['reflect_percent', 'damage_reduction', 'pain_to_heal', 'thorns_aura', 'immortal_counter'],
  },
};

export function getArchetype(id: ArchetypeId): ArchetypeDef {
  return ARCHETYPES[id];
}

export function getAllArchetypes(): ArchetypeDef[] {
  return Object.values(ARCHETYPES);
}

export function getRandomArchetype(): ArchetypeDef {
  const archetypes = getAllArchetypes();
  return archetypes[Math.floor(Math.random() * archetypes.length)]!;
}
