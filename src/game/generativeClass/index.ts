/**
 * Generative Class System - Public API
 */

// Types
export type {
  ArchetypeId,
  ArchetypeDef,
  GeneratedClass,
  GeneratedResource,
  GeneratedAbility,
  GeneratedPassive,
  GeneratedGearDef,
  GeneratedSkillTree,
  GeneratedSkillPath,
  GeneratedSkillNode,
  GeneratedEnemyDef,
  GeneratedBossDef,
  GeneratedQuestDef,
  ClassGenerationState,
  SavedClassData,
  CommunityClassEntry,
  ResourceRegenMethod,
  ResourceDecayMethod,
  AbilityEffectType,
  TerrainAbilityOption,
  CompanionDef,
} from './types';

// Archetypes
export {
  ARCHETYPES,
  getArchetype,
  getAllArchetypes,
  getRandomArchetype,
} from './archetypes';

// Generator
export {
  generateClass,
  getGenerationState,
  resetGeneration,
  exportClassAsJSON,
  importClassFromJSON,
} from './classGenerator';
