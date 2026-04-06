import type { SkillTreeDef, SkillTreeNode, SkillNodeEffect, PlayerClass } from './types';

// ── Helper to build nodes concisely ──
function node(
  id: string, name: string, description: string, icon: string, color: string,
  tier: 1 | 2 | 3 | 4, pathIndex: number, cost: number,
  requires: string[], effect: SkillNodeEffect,
): SkillTreeNode {
  return { id, name, description, icon, color, tier, pathIndex, cost, requires, effect };
}

// ════════════════════════════════════════════════════════════════
//  WARRIOR SKILL TREE
//  Path 0: Berserker  — offense, rage, damage
//  Path 1: Guardian   — defense, survival, tanking
//  Path 2: Warlord    — weapon mastery, enemy-type bonuses
// ════════════════════════════════════════════════════════════════

const WARRIOR_TREE: SkillTreeDef = {
  classId: 'warrior',
  paths: [
    // ── Path 0: Berserker ──
    {
      name: 'Berserker',
      color: '#ff4422',
      icon: '🔥',
      description: 'Raw fury. More rage, more damage, more carnage.',
      nodes: [
        // Tier 1 (cost 1)
        node('war_b_rage_boost', 'Rage Fuel', '+15 rage per hit taken instead of default', '🔥', '#ff4422',
          1, 0, 1, [],
          { type: 'ability', abilityId: 'war_pain_engine' }),
        node('war_b_atk1', 'Savage Strength', '+2 attack', '⚔', '#ff6644',
          1, 0, 1, [],
          { type: 'stat', stat: 'attack', value: 2 }),
        // Tier 2 (cost 1, requires 1 from T1)
        node('war_b_bloodlust', 'Bloodlust', 'Killing an enemy refunds 10 rage', '🩸', '#ff2200',
          2, 0, 1, ['war_b_rage_boost', 'war_b_atk1'],
          { type: 'ability', abilityId: 'war_bloodlust' }),
        node('war_b_heavy_blow', 'Heavy Blow', '20% chance to stun enemies on hit', '💥', '#ff5544',
          2, 0, 1, ['war_b_rage_boost', 'war_b_atk1'],
          { type: 'ability', abilityId: 'war_heavy_blow' }),
        node('war_b_atk2', 'Battle Hardened', '+3 attack', '⚔', '#ff4400',
          2, 0, 1, ['war_b_rage_boost', 'war_b_atk1'],
          { type: 'stat', stat: 'attack', value: 3 }),
        // Tier 3 (cost 2, requires 2 from T2)
        node('war_b_cleave', 'Cleave', '15% chance to damage a second nearby enemy', '🪓', '#cc5533',
          3, 0, 2, ['war_b_bloodlust', 'war_b_heavy_blow', 'war_b_atk2'],
          { type: 'ability', abilityId: 'war_cleave' }),
        node('war_b_war_cry', 'War Cry', 'Stun adjacent enemies when you level up', '📢', '#ff8844',
          3, 0, 2, ['war_b_bloodlust', 'war_b_heavy_blow', 'war_b_atk2'],
          { type: 'ability', abilityId: 'war_war_cry' }),
        node('war_b_rage_dmg', 'Rampage', 'Rage Strike deals 3x attack instead of 2x', '💢', '#ff0000',
          3, 0, 2, ['war_b_bloodlust', 'war_b_heavy_blow', 'war_b_atk2'],
          { type: 'activeModifier', modifierId: 'rage_damage_boost' }),
        // Capstone (cost 2, requires all T3)
        node('war_b_capstone', 'Unstoppable Fury', 'Rage Strike hits ALL visible enemies and heals 5 HP per kill', '☠', '#ff0000',
          4, 0, 2, ['war_b_cleave', 'war_b_war_cry', 'war_b_rage_dmg'],
          { type: 'multi', effects: [
            { type: 'activeModifier', modifierId: 'rage_aoe_all' },
            { type: 'activeModifier', modifierId: 'rage_heal_on_kill' },
          ]}),
      ],
    },
    // ── Path 1: Guardian ──
    {
      name: 'Guardian',
      color: '#4488ff',
      icon: '🛡',
      description: 'Stand firm. Outlast everything the dungeon throws at you.',
      nodes: [
        // Tier 1
        node('war_g_hp1', 'Iron Constitution', '+8 max HP', '❤', '#ff4444',
          1, 1, 1, [],
          { type: 'stat', stat: 'maxHp', value: 8 }),
        node('war_g_def1', 'Thick Hide', '+2 defense', '🛡', '#4488ff',
          1, 1, 1, [],
          { type: 'stat', stat: 'defense', value: 2 }),
        // Tier 2
        node('war_g_shield_wall', 'Shield Wall', 'Passively block 30% of all incoming damage', '🛡', '#4488ff',
          2, 1, 1, ['war_g_hp1', 'war_g_def1'],
          { type: 'ability', abilityId: 'war_shield_wall' }),
        node('war_g_fortify', 'Fortify', 'Heal 2 HP every time you kill an enemy', '♥', '#ff4444',
          2, 1, 1, ['war_g_hp1', 'war_g_def1'],
          { type: 'ability', abilityId: 'war_fortify' }),
        node('war_g_counter', 'Counter Strike', '25% chance to hit back when attacked', '↩', '#ff6644',
          2, 1, 1, ['war_g_hp1', 'war_g_def1'],
          { type: 'ability', abilityId: 'war_counter_strike' }),
        // Tier 3
        node('war_g_last_stand', 'Last Stand', 'Survive a fatal hit once per floor with 1 HP', '⚔', '#ff3333',
          3, 1, 2, ['war_g_shield_wall', 'war_g_fortify', 'war_g_counter'],
          { type: 'ability', abilityId: 'war_last_stand' }),
        node('war_g_intimidate', 'Intimidate', 'Enemies near you deal 15% less damage', '😈', '#cc4422',
          3, 1, 2, ['war_g_shield_wall', 'war_g_fortify', 'war_g_counter'],
          { type: 'ability', abilityId: 'war_intimidate' }),
        node('war_g_def2', 'Ironclad', '+5 defense', '🛡', '#6699ff',
          3, 1, 2, ['war_g_shield_wall', 'war_g_fortify', 'war_g_counter'],
          { type: 'stat', stat: 'defense', value: 5 }),
        // Capstone
        node('war_g_capstone', 'Unbreakable', 'Take max 10 damage per hit. Heal 3 HP per turn.', '💎', '#44aaff',
          4, 1, 2, ['war_g_last_stand', 'war_g_intimidate', 'war_g_def2'],
          { type: 'multi', effects: [
            { type: 'activeModifier', modifierId: 'damage_cap_10' },
            { type: 'activeModifier', modifierId: 'regen_3_per_turn' },
          ]}),
      ],
    },
    // ── Path 2: Warlord ──
    {
      name: 'Warlord',
      color: '#ffaa33',
      icon: '⚔',
      description: 'Master weapons and learn to exploit enemy weaknesses.',
      nodes: [
        // Tier 1
        node('war_w_sword', 'Sword Mastery', '+25% damage with swords', '🗡', '#ccccdd',
          1, 2, 1, [],
          { type: 'weaponProf', weaponKeyword: 'Sword', damagePercent: 25 }),
        node('war_w_axe', 'Axe Mastery', '+25% damage with axes', '🪓', '#cc8844',
          1, 2, 1, [],
          { type: 'weaponProf', weaponKeyword: 'Axe', damagePercent: 25 }),
        // Tier 2
        node('war_w_boss_slayer', 'Giant Slayer', '+30% damage to bosses', '👹', '#ff6633',
          2, 2, 1, ['war_w_sword', 'war_w_axe'],
          { type: 'enemyBonus', enemyKeyword: '__boss__', damagePercent: 30 }),
        node('war_w_undead', 'Bane of the Dead', '+30% damage to undead', '💀', '#aaddff',
          2, 2, 1, ['war_w_sword', 'war_w_axe'],
          { type: 'enemyBonus', enemyKeyword: '__undead__', damagePercent: 30 }),
        node('war_w_beast', 'Beast Hunter', '+30% damage to beasts', '🐺', '#88cc44',
          2, 2, 1, ['war_w_sword', 'war_w_axe'],
          { type: 'enemyBonus', enemyKeyword: '__beast__', damagePercent: 30 }),
        // Tier 3
        node('war_w_atk3', 'Weapon Expert', '+4 attack', '⚔', '#ff8833',
          3, 2, 2, ['war_w_boss_slayer', 'war_w_undead', 'war_w_beast'],
          { type: 'stat', stat: 'attack', value: 4 }),
        node('war_w_tactical', 'Tactical Strike', '+40% damage to stunned or frozen enemies', '🎯', '#ff8844',
          3, 2, 2, ['war_w_boss_slayer', 'war_w_undead', 'war_w_beast'],
          { type: 'ability', abilityId: 'shared_sharp' }),
        node('war_w_all_weapon', 'Arms Master', '+15% damage with all weapons', '⚔', '#ffcc44',
          3, 2, 2, ['war_w_boss_slayer', 'war_w_undead', 'war_w_beast'],
          { type: 'weaponProf', weaponKeyword: '__all__', damagePercent: 15 }),
        // Capstone
        node('war_w_capstone', 'Conqueror', '+50% damage to all enemy types. +5 attack.', '👑', '#ffd700',
          4, 2, 2, ['war_w_atk3', 'war_w_tactical', 'war_w_all_weapon'],
          { type: 'multi', effects: [
            { type: 'stat', stat: 'attack', value: 5 },
            { type: 'enemyBonus', enemyKeyword: '__all__', damagePercent: 50 },
          ]}),
      ],
    },
  ],
};

// ════════════════════════════════════════════════════════════════
//  ROGUE SKILL TREE
//  Path 0: Assassin   — critical hits, burst damage, execute
//  Path 1: Shadow     — evasion, stealth, survival
//  Path 2: Trickster  — poison, bleeds, debuffs
// ════════════════════════════════════════════════════════════════

const ROGUE_TREE: SkillTreeDef = {
  classId: 'rogue',
  paths: [
    // ── Path 0: Assassin ──
    {
      name: 'Assassin',
      color: '#ff2222',
      icon: '🗡',
      description: 'Strike once. Strike lethally. End fights before they start.',
      nodes: [
        // Tier 1
        node('rog_a_crit1', 'Keen Edge', '+10% critical hit chance', '🎯', '#ff2222',
          1, 0, 1, [],
          { type: 'ability', abilityId: 'rog_critical_hit' }),
        node('rog_a_atk1', 'Deadly Precision', '+2 attack', '⚔', '#ff4444',
          1, 0, 1, [],
          { type: 'stat', stat: 'attack', value: 2 }),
        // Tier 2
        node('rog_a_backstab', 'Ambush', '25% chance to deal double damage', '🔪', '#cc2244',
          2, 0, 1, ['rog_a_crit1', 'rog_a_atk1'],
          { type: 'ability', abilityId: 'rog_exploit' }),
        node('rog_a_atk2', 'Assassin Training', '+3 attack', '⚔', '#ff3333',
          2, 0, 1, ['rog_a_crit1', 'rog_a_atk1'],
          { type: 'stat', stat: 'attack', value: 3 }),
        node('rog_a_speed1', 'Quick Hands', '+3 speed', '⚡', '#ffcc33',
          2, 0, 1, ['rog_a_crit1', 'rog_a_atk1'],
          { type: 'stat', stat: 'speed', value: 3 }),
        // Tier 3
        node('rog_a_execute', 'Killing Blow', '15% chance to instantly kill enemies below 20% HP', '☠', '#cc0000',
          3, 0, 2, ['rog_a_backstab', 'rog_a_atk2', 'rog_a_speed1'],
          { type: 'activeModifier', modifierId: 'rogue_execute' }),
        node('rog_a_atk3', 'Lethality', '+5 attack', '⚔', '#ff0000',
          3, 0, 2, ['rog_a_backstab', 'rog_a_atk2', 'rog_a_speed1'],
          { type: 'stat', stat: 'attack', value: 5 }),
        node('rog_a_boss_slayer', 'Kingslayer', '+35% damage to bosses', '👑', '#ff6633',
          3, 0, 2, ['rog_a_backstab', 'rog_a_atk2', 'rog_a_speed1'],
          { type: 'enemyBonus', enemyKeyword: '__boss__', damagePercent: 35 }),
        // Capstone
        node('rog_a_capstone', 'Death\'s Embrace', 'Critical hits deal 4x damage and heal you for 8 HP', '💀', '#ff0000',
          4, 0, 2, ['rog_a_execute', 'rog_a_atk3', 'rog_a_boss_slayer'],
          { type: 'multi', effects: [
            { type: 'activeModifier', modifierId: 'rogue_crit_4x' },
            { type: 'activeModifier', modifierId: 'rogue_crit_heal' },
          ]}),
      ],
    },
    // ── Path 1: Shadow ──
    {
      name: 'Shadow',
      color: '#8866aa',
      icon: '🌑',
      description: 'Vanish into darkness. Avoid what you cannot defeat.',
      nodes: [
        // Tier 1
        node('rog_s_dodge1', 'Nimble', '+15% dodge chance', '💨', '#8866aa',
          1, 1, 1, [],
          { type: 'ability', abilityId: 'rog_dodge' }),
        node('rog_s_spd1', 'Fleet Foot', '+2 speed', '⚡', '#aabbcc',
          1, 1, 1, [],
          { type: 'stat', stat: 'speed', value: 2 }),
        // Tier 2
        node('rog_s_shadow_step', 'Shadow Step', 'No counter-attacks when retreating', '👣', '#7755aa',
          2, 1, 1, ['rog_s_dodge1', 'rog_s_spd1'],
          { type: 'ability', abilityId: 'rog_shadow_step' }),
        node('rog_s_vanish', 'Vanish', 'Below 20% HP, 30% chance enemies miss', '🌫', '#aabbcc',
          2, 1, 1, ['rog_s_dodge1', 'rog_s_spd1'],
          { type: 'ability', abilityId: 'rog_vanish' }),
        node('rog_s_hp1', 'Survivor', '+6 max HP', '❤', '#ff4444',
          2, 1, 1, ['rog_s_dodge1', 'rog_s_spd1'],
          { type: 'stat', stat: 'maxHp', value: 6 }),
        // Tier 3
        node('rog_s_steal', 'Pickpocket', 'Enemies drop extra gold when defeated', '💰', '#ffd700',
          3, 1, 2, ['rog_s_shadow_step', 'rog_s_vanish', 'rog_s_hp1'],
          { type: 'ability', abilityId: 'rog_steal' }),
        node('rog_s_def1', 'Evasive Mastery', '+3 defense', '🛡', '#8888cc',
          3, 1, 2, ['rog_s_shadow_step', 'rog_s_vanish', 'rog_s_hp1'],
          { type: 'stat', stat: 'defense', value: 3 }),
        node('rog_s_spd2', 'Phantom Speed', '+5 speed', '⚡', '#ccaaff',
          3, 1, 2, ['rog_s_shadow_step', 'rog_s_vanish', 'rog_s_hp1'],
          { type: 'stat', stat: 'speed', value: 5 }),
        // Capstone
        node('rog_s_capstone', 'Living Shadow', '40% dodge chance. Heal 3 HP each time you dodge.', '👤', '#aa77dd',
          4, 1, 2, ['rog_s_steal', 'rog_s_def1', 'rog_s_spd2'],
          { type: 'multi', effects: [
            { type: 'activeModifier', modifierId: 'rogue_super_dodge' },
            { type: 'activeModifier', modifierId: 'rogue_dodge_heal' },
          ]}),
      ],
    },
    // ── Path 2: Trickster ──
    {
      name: 'Trickster',
      color: '#55cc22',
      icon: '☠',
      description: 'Poison, bleed, debilitate. Enemies die before they know why.',
      nodes: [
        // Tier 1
        node('rog_t_poison', 'Poison Blade', '20% chance to poison enemies for 2 turns', '☠', '#55cc22',
          1, 2, 1, [],
          { type: 'ability', abilityId: 'rog_poison_blade' }),
        node('rog_t_bleed', 'Deep Wound', '25% chance to make enemies bleed for 3 turns', '🩸', '#ff4444',
          1, 2, 1, [],
          { type: 'ability', abilityId: 'rog_bleed' }),
        // Tier 2
        node('rog_t_exploit', 'Exploit Weakness', '+50% damage to poisoned or bleeding enemies', '🔪', '#cc3355',
          2, 2, 1, ['rog_t_poison', 'rog_t_bleed'],
          { type: 'ability', abilityId: 'rog_exploit' }),
        node('rog_t_dagger', 'Dagger Mastery', '+25% damage with daggers', '🗡', '#ccccdd',
          2, 2, 1, ['rog_t_poison', 'rog_t_bleed'],
          { type: 'weaponProf', weaponKeyword: 'Dagger', damagePercent: 25 }),
        node('rog_t_knives', 'Knife Mastery', '+25% damage with throwing knives', '🗡', '#aabbcc',
          2, 2, 1, ['rog_t_poison', 'rog_t_bleed'],
          { type: 'weaponProf', weaponKeyword: 'Kniv', damagePercent: 25 }),
        // Tier 3
        node('rog_t_undead', 'Grave Robber', '+30% damage to undead', '💀', '#aaddff',
          3, 2, 2, ['rog_t_exploit', 'rog_t_dagger', 'rog_t_knives'],
          { type: 'enemyBonus', enemyKeyword: '__undead__', damagePercent: 30 }),
        node('rog_t_all_weapon', 'Blade Expert', '+15% damage with all weapons', '⚔', '#ffcc44',
          3, 2, 2, ['rog_t_exploit', 'rog_t_dagger', 'rog_t_knives'],
          { type: 'weaponProf', weaponKeyword: '__all__', damagePercent: 15 }),
        node('rog_t_atk2', 'Cruel Edge', '+4 attack', '⚔', '#cc5544',
          3, 2, 2, ['rog_t_exploit', 'rog_t_dagger', 'rog_t_knives'],
          { type: 'stat', stat: 'attack', value: 4 }),
        // Capstone
        node('rog_t_capstone', 'Master Poisoner', 'All attacks poison and bleed. +50% damage to debuffed enemies.', '🐍', '#33cc22',
          4, 2, 2, ['rog_t_undead', 'rog_t_all_weapon', 'rog_t_atk2'],
          { type: 'multi', effects: [
            { type: 'activeModifier', modifierId: 'rogue_always_poison' },
            { type: 'activeModifier', modifierId: 'rogue_always_bleed' },
            { type: 'activeModifier', modifierId: 'rogue_debuff_bonus' },
          ]}),
      ],
    },
  ],
};

// ════════════════════════════════════════════════════════════════
//  MAGE SKILL TREE
//  Path 0: Elementalist — fire, ice, lightning burst damage
//  Path 1: Arcanist     — spell power, mana regen, spell strike
//  Path 2: Battlemage   — survivability, drain life, hybrid
// ════════════════════════════════════════════════════════════════

const MAGE_TREE: SkillTreeDef = {
  classId: 'mage',
  paths: [
    // ── Path 0: Elementalist ──
    {
      name: 'Elementalist',
      color: '#ff6622',
      icon: '🔥',
      description: 'Fire, ice, and lightning. Destroy everything in your path.',
      nodes: [
        // Tier 1
        node('mag_e_fireball', 'Fireball', '15% chance to deal 6 bonus fire damage', '🔥', '#ff6622',
          1, 0, 1, [],
          { type: 'ability', abilityId: 'mag_fireball' }),
        node('mag_e_frost', 'Frost Touch', '20% chance to freeze enemies for 1 turn', '❄', '#88ccff',
          1, 0, 1, [],
          { type: 'ability', abilityId: 'mag_frost_touch' }),
        // Tier 2
        node('mag_e_chain', 'Chain Lightning', '10% chance to zap a second enemy for 4 damage', '⚡', '#ffff44',
          2, 0, 1, ['mag_e_fireball', 'mag_e_frost'],
          { type: 'ability', abilityId: 'mag_chain_lightning' }),
        node('mag_e_atk1', 'Elemental Focus', '+3 attack', '✨', '#cc77ff',
          2, 0, 1, ['mag_e_fireball', 'mag_e_frost'],
          { type: 'stat', stat: 'attack', value: 3 }),
        node('mag_e_staff', 'Staff Mastery', '+25% damage with staves', '🪄', '#aa55ff',
          2, 0, 1, ['mag_e_fireball', 'mag_e_frost'],
          { type: 'weaponProf', weaponKeyword: 'Staff', damagePercent: 25 }),
        // Tier 3
        node('mag_e_atk2', 'Arcane Fury', '+5 attack', '⚔', '#ff4488',
          3, 0, 2, ['mag_e_chain', 'mag_e_atk1', 'mag_e_staff'],
          { type: 'stat', stat: 'attack', value: 5 }),
        node('mag_e_boss', 'Dragonslayer', '+35% damage to bosses', '🐉', '#ff6633',
          3, 0, 2, ['mag_e_chain', 'mag_e_atk1', 'mag_e_staff'],
          { type: 'enemyBonus', enemyKeyword: '__boss__', damagePercent: 35 }),
        node('mag_e_push', 'Telekinesis', '10% chance to push enemies back 2 tiles', '🧠', '#9977dd',
          3, 0, 2, ['mag_e_chain', 'mag_e_atk1', 'mag_e_staff'],
          { type: 'ability', abilityId: 'mag_telekinesis' }),
        // Capstone
        node('mag_e_capstone', 'Elemental Storm', 'All attacks trigger fire, ice, and lightning effects. +8 attack.', '🌪', '#ff4400',
          4, 0, 2, ['mag_e_atk2', 'mag_e_boss', 'mag_e_push'],
          { type: 'multi', effects: [
            { type: 'stat', stat: 'attack', value: 8 },
            { type: 'activeModifier', modifierId: 'mage_elemental_storm' },
          ]}),
      ],
    },
    // ── Path 1: Arcanist ──
    {
      name: 'Arcanist',
      color: '#aa55ff',
      icon: '✨',
      description: 'Pure spell power. Amplify your Spell Strike to devastating levels.',
      nodes: [
        // Tier 1
        node('mag_a_overcharge', 'Overcharge', 'Spell Strike deals +8 damage instead of +5', '💫', '#aa55ff',
          1, 1, 1, [],
          { type: 'ability', abilityId: 'mag_overcharge' }),
        node('mag_a_atk1', 'Arcane Might', '+2 attack', '⚔', '#cc77ff',
          1, 1, 1, [],
          { type: 'stat', stat: 'attack', value: 2 }),
        // Tier 2
        node('mag_a_regen', 'Mana Regeneration', 'Heal 1 HP every 5 turns', '🟣', '#88aaff',
          2, 1, 1, ['mag_a_overcharge', 'mag_a_atk1'],
          { type: 'ability', abilityId: 'mag_mana_regen' }),
        node('mag_a_terrain', 'Arcane Power', 'Heal 2 HP per turn on terrain tiles', '✨', '#cc77ff',
          2, 1, 1, ['mag_a_overcharge', 'mag_a_atk1'],
          { type: 'ability', abilityId: 'mag_arcane_power' }),
        node('mag_a_sharp', 'Opportunist', '+40% damage to stunned or frozen enemies', '🎯', '#ff8844',
          2, 1, 1, ['mag_a_overcharge', 'mag_a_atk1'],
          { type: 'ability', abilityId: 'shared_sharp' }),
        // Tier 3
        node('mag_a_atk2', 'Spell Mastery', '+4 attack', '⚔', '#bb66ff',
          3, 1, 2, ['mag_a_regen', 'mag_a_terrain', 'mag_a_sharp'],
          { type: 'stat', stat: 'attack', value: 4 }),
        node('mag_a_undead', 'Purify', '+30% damage to undead', '💀', '#aaddff',
          3, 1, 2, ['mag_a_regen', 'mag_a_terrain', 'mag_a_sharp'],
          { type: 'enemyBonus', enemyKeyword: '__undead__', damagePercent: 30 }),
        node('mag_a_all_weapon', 'Enchant Weapons', '+15% damage with all weapons', '⚔', '#ffcc44',
          3, 1, 2, ['mag_a_regen', 'mag_a_terrain', 'mag_a_sharp'],
          { type: 'weaponProf', weaponKeyword: '__all__', damagePercent: 15 }),
        // Capstone
        node('mag_a_capstone', 'Archmage', 'Spell Strike triggers every hit. +30% to all spell damage.', '🌟', '#cc00ff',
          4, 1, 2, ['mag_a_atk2', 'mag_a_undead', 'mag_a_all_weapon'],
          { type: 'multi', effects: [
            { type: 'activeModifier', modifierId: 'mage_always_spell_strike' },
            { type: 'activeModifier', modifierId: 'mage_spell_damage_boost' },
          ]}),
      ],
    },
    // ── Path 2: Battlemage ──
    {
      name: 'Battlemage',
      color: '#4488ff',
      icon: '🛡',
      description: 'Survive with magic. Shield yourself, drain life, endure.',
      nodes: [
        // Tier 1
        node('mag_b_drain', 'Drain Life', 'Heal 10% of damage dealt', '🧛', '#cc1144',
          1, 2, 1, [],
          { type: 'ability', abilityId: 'mag_drain_life' }),
        node('mag_b_hp1', 'Arcane Vitality', '+6 max HP', '❤', '#ff4444',
          1, 2, 1, [],
          { type: 'stat', stat: 'maxHp', value: 6 }),
        // Tier 2
        node('mag_b_def1', 'Mana Shield', '+3 defense', '🛡', '#4488ff',
          2, 2, 1, ['mag_b_drain', 'mag_b_hp1'],
          { type: 'stat', stat: 'defense', value: 3 }),
        node('mag_b_hp2', 'Fortified Mind', '+8 max HP', '❤', '#ff6666',
          2, 2, 1, ['mag_b_drain', 'mag_b_hp1'],
          { type: 'stat', stat: 'maxHp', value: 8 }),
        node('mag_b_spd1', 'Haste', '+3 speed', '⚡', '#88eeff',
          2, 2, 1, ['mag_b_drain', 'mag_b_hp1'],
          { type: 'stat', stat: 'speed', value: 3 }),
        // Tier 3
        node('mag_b_beast', 'Beast Ward', '+30% damage to beasts', '🐺', '#88cc44',
          3, 2, 2, ['mag_b_def1', 'mag_b_hp2', 'mag_b_spd1'],
          { type: 'enemyBonus', enemyKeyword: '__beast__', damagePercent: 30 }),
        node('mag_b_def2', 'Arcane Armor', '+5 defense', '🛡', '#6699ff',
          3, 2, 2, ['mag_b_def1', 'mag_b_hp2', 'mag_b_spd1'],
          { type: 'stat', stat: 'defense', value: 5 }),
        node('mag_b_atk3', 'War Mage', '+4 attack', '⚔', '#ff8833',
          3, 2, 2, ['mag_b_def1', 'mag_b_hp2', 'mag_b_spd1'],
          { type: 'stat', stat: 'attack', value: 4 }),
        // Capstone
        node('mag_b_capstone', 'Immortal Mage', 'Survive fatal hits with 1 HP once per floor. Heal 4 HP per turn.', '💎', '#44aaff',
          4, 2, 2, ['mag_b_beast', 'mag_b_def2', 'mag_b_atk3'],
          { type: 'multi', effects: [
            { type: 'activeModifier', modifierId: 'mage_last_stand' },
            { type: 'activeModifier', modifierId: 'mage_regen_4' },
          ]}),
      ],
    },
  ],
};

// ════════════════════════════════════════════════════════════════
//  RANGER SKILL TREE
//  Path 0: Marksman  — ranged damage, bow mastery, boss hunting
//  Path 1: Survivalist — terrain, healing, endurance
//  Path 2: Beastmaster — enemy-type bonuses, tracking, traps
// ════════════════════════════════════════════════════════════════

const RANGER_TREE: SkillTreeDef = {
  classId: 'ranger',
  paths: [
    // ── Path 0: Marksman ──
    {
      name: 'Marksman',
      color: '#ff8844',
      icon: '🏹',
      description: 'Deadly accuracy at range. Every arrow finds its mark.',
      nodes: [
        // Tier 1
        node('rng_m_bow', 'Bow Mastery', '+25% damage with bows', '🏹', '#ff8844',
          1, 0, 1, [],
          { type: 'weaponProf', weaponKeyword: 'Bow', damagePercent: 25 }),
        node('rng_m_atk1', 'Steady Aim', '+2 attack', '⚔', '#ff6644',
          1, 0, 1, [],
          { type: 'stat', stat: 'attack', value: 2 }),
        // Tier 2
        node('rng_m_mark', 'Mark Prey', '+30% damage to the last monster that hit you', '🎯', '#ff8844',
          2, 0, 1, ['rng_m_bow', 'rng_m_atk1'],
          { type: 'ability', abilityId: 'rng_mark_prey' }),
        node('rng_m_atk2', 'Piercing Shot', '+3 attack', '⚔', '#ff5544',
          2, 0, 1, ['rng_m_bow', 'rng_m_atk1'],
          { type: 'stat', stat: 'attack', value: 3 }),
        node('rng_m_crossbow', 'Crossbow Mastery', '+25% damage with crossbows', '🏹', '#aaaacc',
          2, 0, 1, ['rng_m_bow', 'rng_m_atk1'],
          { type: 'weaponProf', weaponKeyword: 'Crossbow', damagePercent: 25 }),
        // Tier 3
        node('rng_m_boss', 'Hunter\'s Focus', '+35% damage to bosses', '👁', '#ff5544',
          3, 0, 2, ['rng_m_mark', 'rng_m_atk2', 'rng_m_crossbow'],
          { type: 'enemyBonus', enemyKeyword: '__boss__', damagePercent: 35 }),
        node('rng_m_atk3', 'Deadly Accuracy', '+5 attack', '⚔', '#ff4422',
          3, 0, 2, ['rng_m_mark', 'rng_m_atk2', 'rng_m_crossbow'],
          { type: 'stat', stat: 'attack', value: 5 }),
        node('rng_m_all_weapon', 'Weapon Training', '+15% damage with all weapons', '⚔', '#ffcc44',
          3, 0, 2, ['rng_m_mark', 'rng_m_atk2', 'rng_m_crossbow'],
          { type: 'weaponProf', weaponKeyword: '__all__', damagePercent: 15 }),
        // Capstone
        node('rng_m_capstone', 'Eagle Eye', 'Every attack has 20% chance for triple damage. +6 attack.', '🦅', '#ff6600',
          4, 0, 2, ['rng_m_boss', 'rng_m_atk3', 'rng_m_all_weapon'],
          { type: 'multi', effects: [
            { type: 'stat', stat: 'attack', value: 6 },
            { type: 'activeModifier', modifierId: 'ranger_triple_shot' },
          ]}),
      ],
    },
    // ── Path 1: Survivalist ──
    {
      name: 'Survivalist',
      color: '#33cc66',
      icon: '🌿',
      description: 'The dungeon sustains you. Outlast through nature\'s gifts.',
      nodes: [
        // Tier 1
        node('rng_sv_nature', 'Nature Bond', 'Heal 2 HP on tall grass or mycelium', '🌿', '#55aa33',
          1, 1, 1, [],
          { type: 'ability', abilityId: 'rng_nature_bond' }),
        node('rng_sv_hp1', 'Endurance', '+6 max HP', '❤', '#ff4444',
          1, 1, 1, [],
          { type: 'stat', stat: 'maxHp', value: 6 }),
        // Tier 2
        node('rng_sv_second', 'Second Wind', 'Heal 3 HP per floor descent', '💨', '#66ddaa',
          2, 1, 1, ['rng_sv_nature', 'rng_sv_hp1'],
          { type: 'ability', abilityId: 'rng_second_wind' }),
        node('rng_sv_herb', 'Herbalist', 'Potions heal 50% more', '🌿', '#33cc55',
          2, 1, 1, ['rng_sv_nature', 'rng_sv_hp1'],
          { type: 'ability', abilityId: 'rng_herbalist' }),
        node('rng_sv_def1', 'Thick Skin', '+2 defense', '🛡', '#88aacc',
          2, 1, 1, ['rng_sv_nature', 'rng_sv_hp1'],
          { type: 'stat', stat: 'defense', value: 2 }),
        // Tier 3
        node('rng_sv_hp2', 'Iron Will', '+10 max HP', '❤', '#ff6666',
          3, 1, 2, ['rng_sv_second', 'rng_sv_herb', 'rng_sv_def1'],
          { type: 'stat', stat: 'maxHp', value: 10 }),
        node('rng_sv_def2', 'Hardened', '+4 defense', '🛡', '#6699ff',
          3, 1, 2, ['rng_sv_second', 'rng_sv_herb', 'rng_sv_def1'],
          { type: 'stat', stat: 'defense', value: 4 }),
        node('rng_sv_camo', 'Camouflage', '20% chance enemies lose track of you', '🌾', '#779944',
          3, 1, 2, ['rng_sv_second', 'rng_sv_herb', 'rng_sv_def1'],
          { type: 'ability', abilityId: 'rng_camouflage' }),
        // Capstone
        node('rng_sv_capstone', 'One With Nature', 'Auto-heal to full HP once per floor when near death. +15 max HP.', '🌳', '#22aa44',
          4, 1, 2, ['rng_sv_hp2', 'rng_sv_def2', 'rng_sv_camo'],
          { type: 'multi', effects: [
            { type: 'stat', stat: 'maxHp', value: 15 },
            { type: 'activeModifier', modifierId: 'ranger_full_heal_once' },
          ]}),
      ],
    },
    // ── Path 2: Beastmaster ──
    {
      name: 'Beastmaster',
      color: '#ddaa33',
      icon: '🐺',
      description: 'Know your enemy. Exploit their weaknesses ruthlessly.',
      nodes: [
        // Tier 1
        node('rng_bm_trap', 'Trap Sense', '25% less terrain damage', '🪤', '#ddaa33',
          1, 2, 1, [],
          { type: 'ability', abilityId: 'rng_trap_sense' }),
        node('rng_bm_first', 'First Strike', 'Always attack first entering an enemy tile', '🏃', '#44ddaa',
          1, 2, 1, [],
          { type: 'ability', abilityId: 'rng_swift_strike' }),
        // Tier 2
        node('rng_bm_beast', 'Beast Slayer', '+30% damage to beasts', '🐺', '#88cc44',
          2, 2, 1, ['rng_bm_trap', 'rng_bm_first'],
          { type: 'enemyBonus', enemyKeyword: '__beast__', damagePercent: 30 }),
        node('rng_bm_undead', 'Undead Hunter', '+30% damage to undead', '💀', '#aaddff',
          2, 2, 1, ['rng_bm_trap', 'rng_bm_first'],
          { type: 'enemyBonus', enemyKeyword: '__undead__', damagePercent: 30 }),
        node('rng_bm_spd1', 'Swift Tracker', '+3 speed', '⚡', '#88eeff',
          2, 2, 1, ['rng_bm_trap', 'rng_bm_first'],
          { type: 'stat', stat: 'speed', value: 3 }),
        // Tier 3
        node('rng_bm_atk2', 'Predator Instinct', '+4 attack', '⚔', '#ff8844',
          3, 2, 2, ['rng_bm_beast', 'rng_bm_undead', 'rng_bm_spd1'],
          { type: 'stat', stat: 'attack', value: 4 }),
        node('rng_bm_sharp', 'Exploit Weakness', '+40% to stunned/frozen enemies', '🎯', '#ff8844',
          3, 2, 2, ['rng_bm_beast', 'rng_bm_undead', 'rng_bm_spd1'],
          { type: 'ability', abilityId: 'shared_sharp' }),
        node('rng_bm_all_enemy', 'Know Thy Enemy', '+20% damage to all enemy types', '📖', '#ffcc44',
          3, 2, 2, ['rng_bm_beast', 'rng_bm_undead', 'rng_bm_spd1'],
          { type: 'enemyBonus', enemyKeyword: '__all__', damagePercent: 20 }),
        // Capstone
        node('rng_bm_capstone', 'Alpha Predator', '+50% damage to all enemy types. +5 attack.', '🦁', '#ffd700',
          4, 2, 2, ['rng_bm_atk2', 'rng_bm_sharp', 'rng_bm_all_enemy'],
          { type: 'multi', effects: [
            { type: 'stat', stat: 'attack', value: 5 },
            { type: 'enemyBonus', enemyKeyword: '__all__', damagePercent: 50 },
          ]}),
      ],
    },
  ],
};

// ════════════════════════════════════════════════════════════════
//  PALADIN SKILL TREE
//  Path 0: Crusader   — holy damage, smite, anti-dark
//  Path 1: Templar    — defense, divine shield, healing
//  Path 2: Inquisitor — enemy-type bonuses, righteous fury
// ════════════════════════════════════════════════════════════════

const PALADIN_TREE: SkillTreeDef = {
  classId: 'paladin',
  paths: [
    // ── Path 0: Crusader ──
    {
      name: 'Crusader',
      color: '#ffdd44',
      icon: '☀',
      description: 'Burn the wicked. Holy power annihilates dark enemies.',
      nodes: [
        // Tier 1
        node('pal_c_smite', 'Holy Smite', '+50% damage to dark & undead', '☀', '#ffdd44',
          1, 0, 1, [],
          { type: 'ability', abilityId: 'pal_holy_smite' }),
        node('pal_c_atk1', 'Righteous Strike', '+2 attack', '⚔', '#ffcc33',
          1, 0, 1, [],
          { type: 'stat', stat: 'attack', value: 2 }),
        // Tier 2
        node('pal_c_consecrate', 'Consecrate', '15% chance to create holy terrain on hit', '✨', '#ffee66',
          2, 0, 1, ['pal_c_smite', 'pal_c_atk1'],
          { type: 'ability', abilityId: 'pal_consecrate' }),
        node('pal_c_fury', 'Righteous Fury', 'Each kill boosts damage 10% for 5 turns (stacks)', '💥', '#ff8833',
          2, 0, 1, ['pal_c_smite', 'pal_c_atk1'],
          { type: 'ability', abilityId: 'pal_righteous_fury' }),
        node('pal_c_atk2', 'Zealot', '+3 attack', '⚔', '#ffaa33',
          2, 0, 1, ['pal_c_smite', 'pal_c_atk1'],
          { type: 'stat', stat: 'attack', value: 3 }),
        // Tier 3
        node('pal_c_undead', 'Scourge of Undead', '+35% damage to undead', '💀', '#aaddff',
          3, 0, 2, ['pal_c_consecrate', 'pal_c_fury', 'pal_c_atk2'],
          { type: 'enemyBonus', enemyKeyword: '__undead__', damagePercent: 35 }),
        node('pal_c_atk3', 'Champion of Light', '+5 attack', '⚔', '#ffd700',
          3, 0, 2, ['pal_c_consecrate', 'pal_c_fury', 'pal_c_atk2'],
          { type: 'stat', stat: 'attack', value: 5 }),
        node('pal_c_martyrdom', 'Martyrdom', 'Below 25% HP, deal 8 damage to attacker', '✝', '#ff4444',
          3, 0, 2, ['pal_c_consecrate', 'pal_c_fury', 'pal_c_atk2'],
          { type: 'ability', abilityId: 'pal_martyrdom' }),
        // Capstone
        node('pal_c_capstone', 'Wrath of God', 'All attacks deal bonus holy damage. +50% to dark enemies. +6 attack.', '⚡', '#fff44d',
          4, 0, 2, ['pal_c_undead', 'pal_c_atk3', 'pal_c_martyrdom'],
          { type: 'multi', effects: [
            { type: 'stat', stat: 'attack', value: 6 },
            { type: 'activeModifier', modifierId: 'paladin_holy_damage' },
            { type: 'enemyBonus', enemyKeyword: '__undead__', damagePercent: 50 },
          ]}),
      ],
    },
    // ── Path 1: Templar ──
    {
      name: 'Templar',
      color: '#66aaff',
      icon: '🛡',
      description: 'An immovable wall of faith. Nothing gets through.',
      nodes: [
        // Tier 1
        node('pal_t_shield', 'Divine Shield', '20% chance to fully negate a hit', '🛡', '#ffcc66',
          1, 1, 1, [],
          { type: 'ability', abilityId: 'pal_divine_shield' }),
        node('pal_t_def1', 'Holy Armor', '+2 defense', '🛡', '#66aaff',
          1, 1, 1, [],
          { type: 'stat', stat: 'defense', value: 2 }),
        // Tier 2
        node('pal_t_heal', 'Lay on Hands', 'Heal 5 HP per floor descent', '🤚', '#66ff88',
          2, 1, 1, ['pal_t_shield', 'pal_t_def1'],
          { type: 'ability', abilityId: 'pal_lay_on_hands' }),
        node('pal_t_hp1', 'Holy Fortitude', '+8 max HP', '❤', '#ff4444',
          2, 1, 1, ['pal_t_shield', 'pal_t_def1'],
          { type: 'stat', stat: 'maxHp', value: 8 }),
        node('pal_t_aura', 'Aura of Light', 'See 2 tiles further in darkness', '🌟', '#ffee88',
          2, 1, 1, ['pal_t_shield', 'pal_t_def1'],
          { type: 'ability', abilityId: 'pal_aura_of_light' }),
        // Tier 3
        node('pal_t_hp2', 'Blessed Constitution', '+12 max HP', '❤', '#ff6666',
          3, 1, 2, ['pal_t_heal', 'pal_t_hp1', 'pal_t_aura'],
          { type: 'stat', stat: 'maxHp', value: 12 }),
        node('pal_t_def2', 'Divine Bulwark', '+5 defense', '🛡', '#6699ff',
          3, 1, 2, ['pal_t_heal', 'pal_t_hp1', 'pal_t_aura'],
          { type: 'stat', stat: 'defense', value: 5 }),
        node('pal_t_divine_might', 'Divine Might', 'Fully heal once per floor below 15% HP', '👑', '#ffd700',
          3, 1, 2, ['pal_t_heal', 'pal_t_hp1', 'pal_t_aura'],
          { type: 'ability', abilityId: 'pal_divine_might' }),
        // Capstone
        node('pal_t_capstone', 'Avatar of Light', 'Max 8 damage per hit. Heal 3 HP per turn. +15 max HP.', '💎', '#44aaff',
          4, 1, 2, ['pal_t_hp2', 'pal_t_def2', 'pal_t_divine_might'],
          { type: 'multi', effects: [
            { type: 'stat', stat: 'maxHp', value: 15 },
            { type: 'activeModifier', modifierId: 'paladin_damage_cap_8' },
            { type: 'activeModifier', modifierId: 'regen_3_per_turn' },
          ]}),
      ],
    },
    // ── Path 2: Inquisitor ──
    {
      name: 'Inquisitor',
      color: '#ff8833',
      icon: '⚔',
      description: 'Hunt evil relentlessly. No enemy escapes judgment.',
      nodes: [
        // Tier 1
        node('pal_i_sword', 'Sword of Justice', '+25% damage with swords', '🗡', '#ccccdd',
          1, 2, 1, [],
          { type: 'weaponProf', weaponKeyword: 'Sword', damagePercent: 25 }),
        node('pal_i_spd1', 'Swift Justice', '+2 speed', '⚡', '#88eeff',
          1, 2, 1, [],
          { type: 'stat', stat: 'speed', value: 2 }),
        // Tier 2
        node('pal_i_boss', 'Demon Hunter', '+30% damage to bosses', '👹', '#ff6633',
          2, 2, 1, ['pal_i_sword', 'pal_i_spd1'],
          { type: 'enemyBonus', enemyKeyword: '__boss__', damagePercent: 30 }),
        node('pal_i_beast', 'Holy Warden', '+30% damage to beasts', '🐺', '#88cc44',
          2, 2, 1, ['pal_i_sword', 'pal_i_spd1'],
          { type: 'enemyBonus', enemyKeyword: '__beast__', damagePercent: 30 }),
        node('pal_i_atk1', 'Inquisitor Training', '+3 attack', '⚔', '#ff8833',
          2, 2, 1, ['pal_i_sword', 'pal_i_spd1'],
          { type: 'stat', stat: 'attack', value: 3 }),
        // Tier 3
        node('pal_i_all_weapon', 'Blessed Arms', '+15% damage with all weapons', '⚔', '#ffcc44',
          3, 2, 2, ['pal_i_boss', 'pal_i_beast', 'pal_i_atk1'],
          { type: 'weaponProf', weaponKeyword: '__all__', damagePercent: 15 }),
        node('pal_i_sharp', 'Judgment', '+40% damage to stunned or frozen enemies', '🎯', '#ff8844',
          3, 2, 2, ['pal_i_boss', 'pal_i_beast', 'pal_i_atk1'],
          { type: 'ability', abilityId: 'shared_sharp' }),
        node('pal_i_atk2', 'Holy Executioner', '+4 attack', '⚔', '#ff6633',
          3, 2, 2, ['pal_i_boss', 'pal_i_beast', 'pal_i_atk1'],
          { type: 'stat', stat: 'attack', value: 4 }),
        // Capstone
        node('pal_i_capstone', 'Grand Inquisitor', '+50% damage to all enemy types. +5 attack.', '⚖', '#ffd700',
          4, 2, 2, ['pal_i_all_weapon', 'pal_i_sharp', 'pal_i_atk2'],
          { type: 'multi', effects: [
            { type: 'stat', stat: 'attack', value: 5 },
            { type: 'enemyBonus', enemyKeyword: '__all__', damagePercent: 50 },
          ]}),
      ],
    },
  ],
};

// ════════════════════════════════════════════════════════════════
//  NECROMANCER SKILL TREE
//  Path 0: Death Mage  — dark damage, corpse burst, wither
//  Path 1: Lich        — survivability, bone armor, undying
//  Path 2: Soul Reaper — life drain, soul harvest, enemy bonuses
// ════════════════════════════════════════════════════════════════

const NECROMANCER_TREE: SkillTreeDef = {
  classId: 'necromancer',
  paths: [
    // ── Path 0: Death Mage ──
    {
      name: 'Death Mage',
      color: '#aa44dd',
      icon: '💀',
      description: 'Command death itself. Wither, curse, and destroy.',
      nodes: [
        // Tier 1
        node('nec_d_corpse', 'Corpse Burst', 'Kills deal 3 damage to nearby enemies', '💀', '#aa44dd',
          1, 0, 1, [],
          { type: 'ability', abilityId: 'nec_corpse_burst' }),
        node('nec_d_atk1', 'Dark Power', '+2 attack', '⚔', '#cc66ff',
          1, 0, 1, [],
          { type: 'stat', stat: 'attack', value: 2 }),
        // Tier 2
        node('nec_d_wither', 'Wither', 'Nearby enemies lose 1 defense permanently per turn', '🍂', '#886633',
          2, 0, 1, ['nec_d_corpse', 'nec_d_atk1'],
          { type: 'ability', abilityId: 'nec_wither' }),
        node('nec_d_fear', 'Fear Aura', '10% chance enemies skip their turn', '😱', '#7744aa',
          2, 0, 1, ['nec_d_corpse', 'nec_d_atk1'],
          { type: 'ability', abilityId: 'nec_fear' }),
        node('nec_d_atk2', 'Death\'s Touch', '+3 attack', '⚔', '#bb55ee',
          2, 0, 1, ['nec_d_corpse', 'nec_d_atk1'],
          { type: 'stat', stat: 'attack', value: 3 }),
        // Tier 3
        node('nec_d_staff', 'Staff of Decay', '+25% damage with staves', '🪄', '#aa55ff',
          3, 0, 2, ['nec_d_wither', 'nec_d_fear', 'nec_d_atk2'],
          { type: 'weaponProf', weaponKeyword: 'Staff', damagePercent: 25 }),
        node('nec_d_atk3', 'Necrotic Power', '+5 attack', '⚔', '#cc00ff',
          3, 0, 2, ['nec_d_wither', 'nec_d_fear', 'nec_d_atk2'],
          { type: 'stat', stat: 'attack', value: 5 }),
        node('nec_d_boss', 'Doom Bringer', '+35% damage to bosses', '👹', '#ff6633',
          3, 0, 2, ['nec_d_wither', 'nec_d_fear', 'nec_d_atk2'],
          { type: 'enemyBonus', enemyKeyword: '__boss__', damagePercent: 35 }),
        // Capstone
        node('nec_d_capstone', 'Lord of Death', 'Kills explode for 8 damage. Fear chance doubled. +6 attack.', '☠', '#cc00ff',
          4, 0, 2, ['nec_d_staff', 'nec_d_atk3', 'nec_d_boss'],
          { type: 'multi', effects: [
            { type: 'stat', stat: 'attack', value: 6 },
            { type: 'activeModifier', modifierId: 'necro_mega_corpse_burst' },
            { type: 'activeModifier', modifierId: 'necro_double_fear' },
          ]}),
      ],
    },
    // ── Path 1: Lich ──
    {
      name: 'Lich',
      color: '#ddddff',
      icon: '🦴',
      description: 'Become undeath incarnate. Endure beyond mortal limits.',
      nodes: [
        // Tier 1
        node('nec_l_bone', 'Bone Armor', '+3 defense permanently', '🦴', '#ddddff',
          1, 1, 1, [],
          { type: 'ability', abilityId: 'nec_bone_armor' }),
        node('nec_l_hp1', 'Dark Vitality', '+6 max HP', '❤', '#cc44dd',
          1, 1, 1, [],
          { type: 'stat', stat: 'maxHp', value: 6 }),
        // Tier 2
        node('nec_l_pact', 'Dark Pact', '+4 attack, -5 max HP', '🌑', '#8833cc',
          2, 1, 1, ['nec_l_bone', 'nec_l_hp1'],
          { type: 'ability', abilityId: 'nec_dark_pact' }),
        node('nec_l_def1', 'Spectral Ward', '+3 defense', '🛡', '#aabbdd',
          2, 1, 1, ['nec_l_bone', 'nec_l_hp1'],
          { type: 'stat', stat: 'defense', value: 3 }),
        node('nec_l_hp2', 'Undead Fortitude', '+8 max HP', '❤', '#ff6666',
          2, 1, 1, ['nec_l_bone', 'nec_l_hp1'],
          { type: 'stat', stat: 'maxHp', value: 8 }),
        // Tier 3
        node('nec_l_undying', 'Undying Will', 'Survive fatal hit once per floor with 1 HP', '⚔', '#ff3333',
          3, 1, 2, ['nec_l_pact', 'nec_l_def1', 'nec_l_hp2'],
          { type: 'activeModifier', modifierId: 'necro_undying_will' }),
        node('nec_l_def2', 'Lich\'s Carapace', '+5 defense', '🛡', '#6699ff',
          3, 1, 2, ['nec_l_pact', 'nec_l_def1', 'nec_l_hp2'],
          { type: 'stat', stat: 'defense', value: 5 }),
        node('nec_l_spd1', 'Ghostly Haste', '+4 speed', '⚡', '#ccaaff',
          3, 1, 2, ['nec_l_pact', 'nec_l_def1', 'nec_l_hp2'],
          { type: 'stat', stat: 'speed', value: 4 }),
        // Capstone
        node('nec_l_capstone', 'Lich Ascendant', 'Max 10 damage per hit. Heal 3 HP per turn. +10 max HP.', '💎', '#cc00ff',
          4, 1, 2, ['nec_l_undying', 'nec_l_def2', 'nec_l_spd1'],
          { type: 'multi', effects: [
            { type: 'stat', stat: 'maxHp', value: 10 },
            { type: 'activeModifier', modifierId: 'damage_cap_10' },
            { type: 'activeModifier', modifierId: 'regen_3_per_turn' },
          ]}),
      ],
    },
    // ── Path 2: Soul Reaper ──
    {
      name: 'Soul Reaper',
      color: '#cc66ff',
      icon: '👻',
      description: 'Harvest souls. Every kill makes you stronger.',
      nodes: [
        // Tier 1
        node('nec_r_harvest', 'Soul Harvest', 'Heal 5 HP per kill instead of 3', '👻', '#cc66ff',
          1, 2, 1, [],
          { type: 'ability', abilityId: 'nec_soul_harvest' }),
        node('nec_r_drain', 'Life Siphon', 'Heal 10% of damage dealt', '🧛', '#cc1144',
          1, 2, 1, [],
          { type: 'ability', abilityId: 'mag_drain_life' }),
        // Tier 2
        node('nec_r_undead', 'Command Undead', '+30% damage to undead', '💀', '#aaddff',
          2, 2, 1, ['nec_r_harvest', 'nec_r_drain'],
          { type: 'enemyBonus', enemyKeyword: '__undead__', damagePercent: 30 }),
        node('nec_r_beast', 'Dark Hunt', '+30% damage to beasts', '🐺', '#88cc44',
          2, 2, 1, ['nec_r_harvest', 'nec_r_drain'],
          { type: 'enemyBonus', enemyKeyword: '__beast__', damagePercent: 30 }),
        node('nec_r_atk1', 'Soul Power', '+3 attack', '⚔', '#cc77ff',
          2, 2, 1, ['nec_r_harvest', 'nec_r_drain'],
          { type: 'stat', stat: 'attack', value: 3 }),
        // Tier 3
        node('nec_r_all_weapon', 'Cursed Arms', '+15% damage with all weapons', '⚔', '#ffcc44',
          3, 2, 2, ['nec_r_undead', 'nec_r_beast', 'nec_r_atk1'],
          { type: 'weaponProf', weaponKeyword: '__all__', damagePercent: 15 }),
        node('nec_r_atk2', 'Reaper\'s Might', '+4 attack', '⚔', '#aa44dd',
          3, 2, 2, ['nec_r_undead', 'nec_r_beast', 'nec_r_atk1'],
          { type: 'stat', stat: 'attack', value: 4 }),
        node('nec_r_all_enemy', 'Death\'s Gaze', '+20% damage to all enemy types', '👁', '#7744aa',
          3, 2, 2, ['nec_r_undead', 'nec_r_beast', 'nec_r_atk1'],
          { type: 'enemyBonus', enemyKeyword: '__all__', damagePercent: 20 }),
        // Capstone
        node('nec_r_capstone', 'Grim Reaper', 'Kills heal 10 HP. +50% damage to all enemy types. +5 attack.', '💀', '#ff00ff',
          4, 2, 2, ['nec_r_all_weapon', 'nec_r_atk2', 'nec_r_all_enemy'],
          { type: 'multi', effects: [
            { type: 'stat', stat: 'attack', value: 5 },
            { type: 'activeModifier', modifierId: 'necro_mega_harvest' },
            { type: 'enemyBonus', enemyKeyword: '__all__', damagePercent: 50 },
          ]}),
      ],
    },
  ],
};

// ════════════════════════════════════════════════════════════════
//  REVENANT SKILL TREE
//  Path 0: Berserker    — blood rage, low-HP power, raw damage
//  Path 1: Deathwalker  — survival, revives, regen
//  Path 2: Executioner  — instant kills, enemy bonuses, speed
// ════════════════════════════════════════════════════════════════

const REVENANT_TREE: SkillTreeDef = {
  classId: 'revenant',
  paths: [
    // ── Path 0: Berserker ──
    {
      name: 'Berserker',
      color: '#ff4444',
      icon: '🩸',
      description: 'Pain is power. The lower your health, the harder you hit.',
      nodes: [
        // Tier 1
        node('rev_b_blood', 'Blood Rage', '+2 attack for every 10% HP missing', '🩸', '#ff4444',
          1, 0, 1, [],
          { type: 'ability', abilityId: 'rev_blood_rage' }),
        node('rev_b_atk1', 'Undying Strength', '+2 attack', '⚔', '#ff6644',
          1, 0, 1, [],
          { type: 'stat', stat: 'attack', value: 2 }),
        // Tier 2
        node('rev_b_vengeful', 'Vengeful', 'Double damage for 1 turn after being hit', '💢', '#ff3333',
          2, 0, 1, ['rev_b_blood', 'rev_b_atk1'],
          { type: 'ability', abilityId: 'rev_vengeful' }),
        node('rev_b_atk2', 'Wrath', '+3 attack', '⚔', '#ff2222',
          2, 0, 1, ['rev_b_blood', 'rev_b_atk1'],
          { type: 'stat', stat: 'attack', value: 3 }),
        node('rev_b_spd1', 'Fury Speed', '+3 speed', '⚡', '#ff8844',
          2, 0, 1, ['rev_b_blood', 'rev_b_atk1'],
          { type: 'stat', stat: 'speed', value: 3 }),
        // Tier 3
        node('rev_b_atk3', 'Unrelenting Force', '+5 attack', '⚔', '#ff0000',
          3, 0, 2, ['rev_b_vengeful', 'rev_b_atk2', 'rev_b_spd1'],
          { type: 'stat', stat: 'attack', value: 5 }),
        node('rev_b_boss', 'Champion Slayer', '+35% damage to bosses', '👹', '#ff6633',
          3, 0, 2, ['rev_b_vengeful', 'rev_b_atk2', 'rev_b_spd1'],
          { type: 'enemyBonus', enemyKeyword: '__boss__', damagePercent: 35 }),
        node('rev_b_all_weapon', 'Blood-Forged Arms', '+15% damage with all weapons', '⚔', '#ff8844',
          3, 0, 2, ['rev_b_vengeful', 'rev_b_atk2', 'rev_b_spd1'],
          { type: 'weaponProf', weaponKeyword: '__all__', damagePercent: 15 }),
        // Capstone
        node('rev_b_capstone', 'Deathless Berserker', 'Below 20% HP: +200% damage, immune to stun/freeze. +8 attack.', '💀', '#ff0000',
          4, 0, 2, ['rev_b_atk3', 'rev_b_boss', 'rev_b_all_weapon'],
          { type: 'multi', effects: [
            { type: 'stat', stat: 'attack', value: 8 },
            { type: 'activeModifier', modifierId: 'revenant_deathless_fury' },
          ]}),
      ],
    },
    // ── Path 1: Deathwalker ──
    {
      name: 'Deathwalker',
      color: '#ff8888',
      icon: '💀',
      description: 'Walk the line between life and death. Survive the impossible.',
      nodes: [
        // Tier 1
        node('rev_dw_vigor', 'Undead Vigor', '+8 max HP permanently', '❤', '#ff6666',
          1, 1, 1, [],
          { type: 'ability', abilityId: 'rev_undead_vigor' }),
        node('rev_dw_def1', 'Death\'s Embrace', '+2 defense', '🛡', '#cc4444',
          1, 1, 1, [],
          { type: 'stat', stat: 'defense', value: 2 }),
        // Tier 2
        node('rev_dw_life_tap', 'Life Tap', 'Heal 2 HP per turn while below 30% HP', '🧡', '#ff8888',
          2, 1, 1, ['rev_dw_vigor', 'rev_dw_def1'],
          { type: 'ability', abilityId: 'rev_life_tap' }),
        node('rev_dw_hp1', 'Grave Strength', '+8 max HP', '❤', '#ff4444',
          2, 1, 1, ['rev_dw_vigor', 'rev_dw_def1'],
          { type: 'stat', stat: 'maxHp', value: 8 }),
        node('rev_dw_def2', 'Phantom Guard', '+3 defense', '🛡', '#aa6666',
          2, 1, 1, ['rev_dw_vigor', 'rev_dw_def1'],
          { type: 'stat', stat: 'defense', value: 3 }),
        // Tier 3
        node('rev_dw_hp2', 'Undying Constitution', '+10 max HP', '❤', '#ff6666',
          3, 1, 2, ['rev_dw_life_tap', 'rev_dw_hp1', 'rev_dw_def2'],
          { type: 'stat', stat: 'maxHp', value: 10 }),
        node('rev_dw_def3', 'Death\'s Armor', '+5 defense', '🛡', '#6699ff',
          3, 1, 2, ['rev_dw_life_tap', 'rev_dw_hp1', 'rev_dw_def2'],
          { type: 'stat', stat: 'defense', value: 5 }),
        node('rev_dw_spd1', 'Ghost Walk', '+4 speed', '⚡', '#ccaaff',
          3, 1, 2, ['rev_dw_life_tap', 'rev_dw_hp1', 'rev_dw_def2'],
          { type: 'stat', stat: 'speed', value: 4 }),
        // Capstone
        node('rev_dw_capstone', 'Beyond Death', 'Free revive each floor. Max 10 damage per hit. +15 max HP.', '💎', '#ff4444',
          4, 1, 2, ['rev_dw_hp2', 'rev_dw_def3', 'rev_dw_spd1'],
          { type: 'multi', effects: [
            { type: 'stat', stat: 'maxHp', value: 15 },
            { type: 'activeModifier', modifierId: 'revenant_free_revive' },
            { type: 'activeModifier', modifierId: 'damage_cap_10' },
          ]}),
      ],
    },
    // ── Path 2: Executioner ──
    {
      name: 'Executioner',
      color: '#cc0000',
      icon: '☠',
      description: 'Judge, jury, and executioner. End fights instantly.',
      nodes: [
        // Tier 1
        node('rev_x_death_strike', 'Death Strike', '10% chance to instantly kill non-boss enemies', '☠', '#cc0000',
          1, 2, 1, [],
          { type: 'ability', abilityId: 'rev_death_strike' }),
        node('rev_x_relentless', 'Relentless', '+5 speed permanently', '🏃', '#ff9944',
          1, 2, 1, [],
          { type: 'ability', abilityId: 'rev_relentless' }),
        // Tier 2
        node('rev_x_undead', 'Grave Sovereign', '+30% damage to undead', '💀', '#aaddff',
          2, 2, 1, ['rev_x_death_strike', 'rev_x_relentless'],
          { type: 'enemyBonus', enemyKeyword: '__undead__', damagePercent: 30 }),
        node('rev_x_beast', 'Predator', '+30% damage to beasts', '🐺', '#88cc44',
          2, 2, 1, ['rev_x_death_strike', 'rev_x_relentless'],
          { type: 'enemyBonus', enemyKeyword: '__beast__', damagePercent: 30 }),
        node('rev_x_atk1', 'Executioner Training', '+3 attack', '⚔', '#cc2244',
          2, 2, 1, ['rev_x_death_strike', 'rev_x_relentless'],
          { type: 'stat', stat: 'attack', value: 3 }),
        // Tier 3
        node('rev_x_all_weapon', 'Death\'s Arsenal', '+15% damage with all weapons', '⚔', '#ffcc44',
          3, 2, 2, ['rev_x_undead', 'rev_x_beast', 'rev_x_atk1'],
          { type: 'weaponProf', weaponKeyword: '__all__', damagePercent: 15 }),
        node('rev_x_sharp', 'Exploit Weakness', '+40% damage to stunned/frozen enemies', '🎯', '#ff8844',
          3, 2, 2, ['rev_x_undead', 'rev_x_beast', 'rev_x_atk1'],
          { type: 'ability', abilityId: 'shared_sharp' }),
        node('rev_x_atk2', 'Merciless', '+4 attack', '⚔', '#cc0000',
          3, 2, 2, ['rev_x_undead', 'rev_x_beast', 'rev_x_atk1'],
          { type: 'stat', stat: 'attack', value: 4 }),
        // Capstone
        node('rev_x_capstone', 'Soul Eater', '20% instant kill chance. +50% to all enemies. +5 attack.', '💀', '#ff0000',
          4, 2, 2, ['rev_x_all_weapon', 'rev_x_sharp', 'rev_x_atk2'],
          { type: 'multi', effects: [
            { type: 'stat', stat: 'attack', value: 5 },
            { type: 'activeModifier', modifierId: 'revenant_mega_execute' },
            { type: 'enemyBonus', enemyKeyword: '__all__', damagePercent: 50 },
          ]}),
      ],
    },
  ],
};

// ── Registry — maps classId to tree def ──
const SKILL_TREES: Partial<Record<PlayerClass, SkillTreeDef>> = {
  warrior: WARRIOR_TREE,
  rogue: ROGUE_TREE,
  mage: MAGE_TREE,
  ranger: RANGER_TREE,
  paladin: PALADIN_TREE,
  necromancer: NECROMANCER_TREE,
  revenant: REVENANT_TREE,
};

export function getSkillTree(classId: PlayerClass): SkillTreeDef | null {
  return SKILL_TREES[classId] ?? null;
}

export function getSkillNode(classId: PlayerClass, nodeId: string): SkillTreeNode | null {
  const tree = getSkillTree(classId);
  if (!tree) return null;
  for (const path of tree.paths) {
    const n = path.nodes.find(nd => nd.id === nodeId);
    if (n) return n;
  }
  return null;
}

/** Check if a node can be unlocked given current state. */
export function canUnlockNode(
  nodeId: string,
  classId: PlayerClass,
  unlockedNodes: string[],
  skillPoints: number,
): { canUnlock: boolean; reason?: string } {
  const nd = getSkillNode(classId, nodeId);
  if (!nd) return { canUnlock: false, reason: 'Node not found' };
  if (unlockedNodes.includes(nodeId)) return { canUnlock: false, reason: 'Already unlocked' };
  if (skillPoints < nd.cost) return { canUnlock: false, reason: `Need ${nd.cost} skill point${nd.cost > 1 ? 's' : ''}` };

  // Check prerequisites: for T2 need any 1 from T1, for T3 need any 2 from T2, capstone needs all T3
  if (nd.requires.length > 0) {
    const tree = getSkillTree(classId);
    if (!tree) return { canUnlock: false, reason: 'No tree' };
    const path = tree.paths[nd.pathIndex];
    if (!path) return { canUnlock: false, reason: 'No path' };

    const prevTier = nd.tier - 1;
    const prevTierNodes = path.nodes.filter(n => n.tier === prevTier);
    const unlockedPrevCount = prevTierNodes.filter(n => unlockedNodes.includes(n.id)).length;

    let required: number;
    if (nd.tier === 2) required = 1;
    else if (nd.tier === 3) required = 2;
    else if (nd.tier === 4) required = prevTierNodes.length; // all T3 for capstone
    else required = 0;

    if (unlockedPrevCount < required) {
      return { canUnlock: false, reason: `Unlock ${required} tier ${prevTier} node${required > 1 ? 's' : ''} first` };
    }
  }

  return { canUnlock: true };
}

// ── Tag helpers for enemy type bonuses ──

const UNDEAD_NAMES = ['Skeleton', 'Zombie', 'Wraith', 'Vampire', 'Vampire Lord', 'Lich Emperor', 'Ghost', 'Ghoul', 'Bone Knight'];
const BEAST_NAMES = ['Rat', 'Giant Rat', 'Bat', 'Wolf', 'Spider', 'Giant Spider', 'Scorpion', 'Snake', 'Bear'];

export function getEnemyTags(monsterName: string, isBoss?: boolean): string[] {
  const tags: string[] = [];
  const baseName = monsterName.replace(/^(Crimson|Frostborn|Venomous|Shadow|Gilded|Spectral|Molten|Thorned|Ancient|Cursed|Blazing|Ironhide)\s+/, '');
  if (UNDEAD_NAMES.some(u => baseName.includes(u))) tags.push('__undead__');
  if (BEAST_NAMES.some(b => baseName.includes(b))) tags.push('__beast__');
  if (isBoss) tags.push('__boss__');
  tags.push('__all__');
  return tags;
}
