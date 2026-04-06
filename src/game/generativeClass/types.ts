/**
 * Generative Class System Types
 * Defines archetypes, generated classes, and all associated content
 */

import type { Stats } from '../types';

// ══════════════════════════════════════════════════════════════
// ARCHETYPES - The mechanical foundations for generated classes
// ══════════════════════════════════════════════════════════════

export type ArchetypeId = 
  | 'territory'   // Modify terrain, create traps/walls/zones
  | 'rhythm'      // Maintain tempo for buffs, miss = lose stacks
  | 'typing'      // Type words to cast spells
  | 'sacrifice'   // Consume HP/gear/enemies for power
  | 'companion'   // Control minions that fight for you
  | 'trickster'   // Convert enemies, manipulation
  | 'momentum'    // Movement = power, standing still = weak
  | 'combo'       // Chain specific actions for multipliers
  | 'transform'   // Shift between forms with different abilities
  | 'reflection'; // Take damage to deal it back

export interface ArchetypeDef {
  id: ArchetypeId;
  name: string;
  description: string;
  mechanicType: 'resource' | 'timing' | 'input' | 'positional' | 'state';
  
  // UI requirements
  requiresSpecialUI: boolean;
  uiComponent?: 'rhythm_bar' | 'typing_input' | 'companion_panel' | 'territory_overlay' | 'combo_tracker' | 'form_switcher';
  
  // Resource template
  resourceTemplate: {
    nameOptions: string[];  // AI picks one or generates similar
    maxRange: [number, number];  // Min/max for resource cap
    regenMethods: string[];  // How resource is gained
  };
  
  // Ability templates
  abilityTemplates: AbilityTemplate[];
  
  // Enemy counter-types
  counterEnemyTypes: string[];
  
  // Skill tree structure hints
  skillTreeHints: string[];
}

export interface AbilityTemplate {
  type: string;
  description: string;
  costRange: [number, number];
  effects: string[];
}

// ══════════════════════════════════════════════════════════════
// GENERATED CLASS - The full AI-generated class definition
// ══════════════════════════════════════════════════════════════

export interface GeneratedClass {
  // Identity
  id: string;
  name: string;
  title: string;  // "The Stoneshaper", "The Dirge Singer"
  archetype: ArchetypeId;
  
  // Visuals
  portraitUrl?: string;
  char: string;
  color: string;
  icon: string;  // Emoji or symbol
  
  // Lore
  description: string;
  backstory: string;
  
  // Base stats (similar to existing ClassDef)
  baseStats: Stats;
  levelBonusHp: number;
  levelBonusAtk: number;
  levelBonusDef: number;
  
  // Unique resource system
  resource: GeneratedResource;
  
  // Primary ability
  ability: GeneratedAbility;
  
  // Passive abilities
  passives: GeneratedPassive[];
  
  // Starting gear (generated for this class)
  startingGear: GeneratedGearDef[];
  
  // Skill tree (generated nodes)
  skillTree: GeneratedSkillTree;
  
  // Enemies tailored to this class
  enemies: GeneratedEnemyDef[];
  
  // Boss for this class
  boss: GeneratedBossDef;
  
  // Quests specific to this class
  quests: GeneratedQuestDef[];
  
  // Sharing/Community
  creatorId?: string;
  creatorName?: string;
  plays: number;
  rating: number;
  isPublic: boolean;
  createdAt: string;
  
  // Generation metadata
  isGenerated: true;
  generatedAt: string;
  seed?: string;
}

// ══════════════════════════════════════════════════════════════
// RESOURCE SYSTEM
// ══════════════════════════════════════════════════════════════

export interface GeneratedResource {
  name: string;        // "Fault Lines", "Resonance", "Hunger"
  icon: string;        // Emoji
  color: string;       // For UI display
  max: number;         // Maximum resource cap
  startingAmount: number;
  
  // How resource is gained
  regenMethod: ResourceRegenMethod;
  regenAmount: number;
  
  // How resource is lost (for rhythm/tempo types)
  decayMethod?: ResourceDecayMethod;
  decayAmount?: number;
  
  // Description for player
  description: string;
}

export type ResourceRegenMethod = 
  | 'on_kill'           // Gain on enemy kill
  | 'on_move'           // Gain when moving
  | 'on_hit'            // Gain when hitting enemy
  | 'on_damage_taken'   // Gain when taking damage
  | 'per_turn'          // Passive regen each turn
  | 'on_terrain'        // Gain when on specific terrain
  | 'on_combo'          // Gain from combo chains
  | 'on_rhythm_beat'    // Gain from maintaining rhythm
  | 'on_correct_input'; // Gain from typing correctly

export type ResourceDecayMethod =
  | 'per_turn'          // Lose each turn
  | 'on_miss_beat'      // Lose all on rhythm miss
  | 'on_idle'           // Lose when not moving
  | 'on_damage_taken';  // Lose when hit

// ══════════════════════════════════════════════════════════════
// ABILITY SYSTEM
// ══════════════════════════════════════════════════════════════

export interface GeneratedAbility {
  id: string;
  name: string;
  description: string;
  icon: string;
  
  // Cost
  resourceCost: number;
  cooldown?: number;  // Turns before can use again
  
  // Effect type
  effectType: AbilityEffectType;
  effect: AbilityEffect;
  
  // For territory abilities
  terrainOptions?: TerrainAbilityOption[];
  
  // For companion abilities
  companionDef?: CompanionDef;
  
  // For typing abilities
  wordPool?: string[];
  
  // For rhythm abilities
  tempoRequirement?: number;  // BPM
}

export type AbilityEffectType = 
  | 'damage'
  | 'terrain_modify'
  | 'summon_companion'
  | 'buff_self'
  | 'debuff_enemy'
  | 'transform'
  | 'reflect'
  | 'consume'
  | 'convert_enemy';

export interface AbilityEffect {
  type: AbilityEffectType;
  value?: number;
  duration?: number;
  radius?: number;
  target?: 'self' | 'enemy' | 'tile' | 'area';
}

export interface TerrainAbilityOption {
  id: string;
  name: string;
  terrainType: string;  // 'wall' | 'spike' | 'lava' | 'pit' | 'ice' | etc.
  cost: number;
  description: string;
  effect: {
    damage?: number;
    slowPercent?: number;
    blockMovement?: boolean;
    duration?: number;
  };
}

export interface CompanionDef {
  name: string;
  char: string;
  color: string;
  stats: Stats;
  behavior: 'aggressive' | 'defensive' | 'support';
  abilities?: string[];
  duration?: number;  // Turns before despawn, undefined = permanent
}

// ══════════════════════════════════════════════════════════════
// PASSIVES
// ══════════════════════════════════════════════════════════════

export interface GeneratedPassive {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockLevel: number;
  effect: PassiveEffect;
}

export interface PassiveEffect {
  type: 'stat_bonus' | 'resource_bonus' | 'ability_enhance' | 'on_trigger';
  stat?: keyof Stats;
  value?: number;
  trigger?: string;
  triggerEffect?: string;
}

// ══════════════════════════════════════════════════════════════
// GEAR
// ══════════════════════════════════════════════════════════════

export interface GeneratedGearDef {
  id: string;
  name: string;
  description: string;
  slot: 'weapon' | 'armor' | 'accessory';
  icon: string;
  color: string;
  
  // Stats
  statBonus: Partial<Stats>;
  
  // Synergy with class ability
  synergyEffect?: {
    type: 'resource_cost_reduction' | 'ability_damage_boost' | 'resource_regen' | 'special';
    value: number;
    description: string;
  };
  
  // Rarity affects drop chance
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

// ══════════════════════════════════════════════════════════════
// SKILL TREE
// ══════════════════════════════════════════════════════════════

export interface GeneratedSkillTree {
  paths: GeneratedSkillPath[];
}

export interface GeneratedSkillPath {
  id: string;
  name: string;
  description: string;
  color: string;
  nodes: GeneratedSkillNode[];
}

export interface GeneratedSkillNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  
  // Position in tree
  tier: number;  // 0-4
  position: number;  // 0-2 (left, center, right)
  
  // Cost
  echoCost: number;
  
  // Prerequisites
  requires: string[];  // Node IDs
  
  // Effect
  effect: SkillNodeEffect;
}

export interface SkillNodeEffect {
  type: 'stat' | 'resource' | 'ability' | 'passive' | 'unique';
  stat?: keyof Stats;
  value?: number;
  abilityId?: string;
  description?: string;
}

// ══════════════════════════════════════════════════════════════
// ENEMIES
// ══════════════════════════════════════════════════════════════

export interface GeneratedEnemyDef {
  id: string;
  name: string;
  description: string;
  char: string;
  color: string;
  
  // Stats scale with floor
  baseStats: Stats;
  floorScaling: number;  // Multiplier per floor
  
  // How they counter the class
  counterMechanic: string;  // Description of how they counter
  
  // Special abilities
  abilities: EnemyAbility[];
  
  // Loot
  xpValue: number;
  goldDrop: [number, number];
  
  // Spawn conditions
  minFloor: number;
  maxFloor?: number;
  spawnWeight: number;
}

export interface EnemyAbility {
  name: string;
  description: string;
  trigger: 'on_hit' | 'on_death' | 'on_turn' | 'low_hp';
  effect: string;
}

// ══════════════════════════════════════════════════════════════
// BOSS
// ══════════════════════════════════════════════════════════════

export interface GeneratedBossDef {
  id: string;
  name: string;
  title: string;  // "The Earthquake", "The Discordant Maestro"
  description: string;
  char: string;
  color: string;
  
  // Stats
  stats: Stats;
  
  // Boss mechanics
  phases: BossPhase[];
  
  // How they test mastery of the class
  challengeDescription: string;
  
  // Rewards
  xpValue: number;
  guaranteedDrop?: GeneratedGearDef;
}

export interface BossPhase {
  hpThreshold: number;  // 1.0, 0.66, 0.33
  name: string;
  abilities: string[];
  description: string;
}

// ══════════════════════════════════════════════════════════════
// QUESTS
// ══════════════════════════════════════════════════════════════

export interface GeneratedQuestDef {
  id: string;
  name: string;
  description: string;
  
  // Objective
  objective: QuestObjective;
  target: number;
  
  // Rewards
  rewards: {
    echoes?: number;
    gold?: number;
    unlocks?: string[];
  };
  
  // Difficulty tier
  tier: 1 | 2 | 3;
}

export interface QuestObjective {
  type: 
    | 'use_ability'      // Use class ability X times
    | 'kill_with_ability'  // Kill enemies using ability
    | 'maintain_resource'  // Keep resource above X for Y turns
    | 'reach_floor'
    | 'kill_boss'
    | 'collect_gold'
    | 'survive_floors'
    | 'no_damage_floor';  // Complete floor without taking damage
  
  // For archetype-specific objectives
  archetypeSpecific?: {
    territory?: { tilesCreated?: number; enemiesTrapped?: number; };
    rhythm?: { perfectBeats?: number; maxCombo?: number; };
    typing?: { wordsTyped?: number; accuracy?: number; };
    companion?: { companionKills?: number; companionsActive?: number; };
  };
}

// ══════════════════════════════════════════════════════════════
// GENERATION STATE
// ══════════════════════════════════════════════════════════════

export interface ClassGenerationState {
  isGenerating: boolean;
  progress: number;
  stage: 'idle' | 'archetype' | 'identity' | 'abilities' | 'gear' | 'enemies' | 'portrait' | 'complete';
  currentClass: GeneratedClass | null;
  error: string | null;
}

// ══════════════════════════════════════════════════════════════
// SAVED/SHARED CLASSES
// ══════════════════════════════════════════════════════════════

export interface SavedClassData {
  class: GeneratedClass;
  savedAt: string;
  timesPlayed: number;
  bestFloor: number;
  bestScore: number;
}

export interface CommunityClassEntry {
  class: GeneratedClass;
  entryId: string;
  plays: number;
  rating: number;
  likeCount: number;
  isLikedByMe: boolean;
}
