// Story System - Public API
// Re-exports all public functions and types from story modules

// Character Skills System
export {
  rollCharacterSkills,
  performSkillCheck,
  getSkillModifier,
  getEffectiveSkill,
  getTotalSkillModifier,
  meetsSkillThreshold,
  getSkillTierLabel,
  getOutcomeLabel,
  getOutcomeColor,
  getModifierDisplay,
  getAllSkillsWithModifiers,
  formatSkillName,
  calculateSuccessProbability,
  getDifficultyLabel,
  getGearSkillBonus,
} from './characterSkills';

// Content Cache
export {
  createEmptyCache,
  getCacheKeyForFloor,
  getFloorRangeForKey,
  isContentReadyForFloor,
  getContentForFloor,
  updateBatchContent,
  markBatchReady,
  getRandomEncounter,
  getRandomItem,
  getCharactersForFloor,
  getStoryBeatsForFloor,
  getPendingCacheKeys,
  getGenerationProgress,
  isInitialContentReady,
  logCacheState,
  getEnemyEncounter,
  addEnemyEncounter,
} from './contentCache';

// Progressive Loader
export {
  startGeneration,
  getContentCache,
  waitForFloorContent,
  checkFloorTrigger,
  getGenerationErrors,
  clearGenerationErrors,
  resetGeneration,
  getCurrentWave,
  isReadyToPlay,
} from './progressiveLoader';

// Fallback Content
export {
  FALLBACK_CHARACTERS,
  getFallbackBatch,
  getFallbackCharacter,
  getAllFallbackCharacters,
  getFallbackEncounter,
  getAllFallbackEncounters,
  getFallbackItem,
  getAllFallbackItems,
  getRandomFallbackEncounter,
  getRandomFallbackItem,
} from './fallbackContent';

// Validation
export {
  validateCharacter,
  validateEncounter,
  validateItem,
  validateBeat,
  validateBatch,
  sanitizeText,
  type ValidationResult,
  type BatchValidationResult,
} from './validation';

// Story Manager
export {
  initializeStoryState,
  initializeCharacterSkills,
  getRelationshipTier,
  updateRelationship,
  getCharacterRelationship,
  hasTriggeredBeat,
  markBeatTriggered,
  checkStoryTriggers,
  checkForFloorEncounter,
  getAvailableCharacters,
  findCharacterById,
  canRecruitCharacter,
  tryRecruitCharacter,
  handleDialogueComplete,
  getStoryProgress,
  prepareRunContent,
  isContentReady,
  onFloorEnter,
  onCombatStart,
  onLowHealth,
  activateCharacterQuest,
  updateCharacterQuestProgress,
  getActiveCharacterQuests,
  claimCharacterQuestReward,
  grantBoon,
  createBoonFromDialogue,
  getActiveBoons,
  getBoonBonus,
  updateBoonDurations,
  type StoryTriggerContext,
  type PendingStoryEvent,
} from './storyManager';

// Encounter Manager
export {
  getRandomEncounter as getFloorRandomEncounter,
  spawnFloorEncounters,
  checkForHiddenElements,
  discoverHiddenElement,
  interactWithElement,
  getNearbyInteractables,
} from './encounterManager';

// Ally Recruitment
export {
  isAllyUnlocked,
  getUnlockedAllies,
  STORY_ALLY_DEFINITIONS,
  createAllyEntity,
  canRecruitCharacterAsAlly,
  recruitCharacterToBloodline,
  isEntityStoryAlly,
  getAllyPassiveBonus,
  applyAllyPassives,
  processAllyAbilities,
  triggerAllyAbility,
  type StoryAllyAbility,
  type StoryAllyDefinition,
} from './allyRecruitment';

// Series AI wrapper
export {
  generateCharacter,
  generateEncounter,
  generateItem,
  generateCharacterPortrait,
  generateItemArt,
  generateEncounterArt,
  generateEncounterSceneArt,
  generateFloorBatch,
  generateEnemyEncounter,
  generateEnemyPortraitFromPrompt,
  generateRoomEventArt,
  preloadImage,
  isAIAvailable,
  getAvailableModels,
  type EncounterSceneType,
  type LLMModel,
  type ImageModel,
  type FloorBatchResult,
  type FloorBatchRequest,
  type GenerationOptions,
  type ImageGenOptions,
} from './seriesAI';
