import type {
  GameState,
  PlayerClass,
  BloodlineData,
  StoryCharacter,
  NarrativeBeat,
  RunStoryState,
  StoryBeatTrigger,
  GeneratedEncounter,
  SkillCheckResult,
  SkillName,
  CharacterSkills,
  CharacterQuest,
  CharacterBoon,
  BoonEffectType,
} from '../types';
import { rollCharacterSkills } from './characterSkills';
import { getCharactersForFloor, getStoryBeatsForFloor, getRandomEncounter, getQuestForCharacter } from './contentCache';
import { getContentCache, checkFloorTrigger, isReadyToPlay } from './progressiveLoader';
import { FALLBACK_CHARACTERS } from './fallbackContent';
import { startGeneration } from './progressiveLoader';

export interface StoryTriggerContext {
  trigger: StoryBeatTrigger;
  floorNumber: number;
  characterMet?: string;
  combatTarget?: string;
  isLowHealth?: boolean;
  isBossFight?: boolean;
}

export interface PendingStoryEvent {
  type: 'dialogue' | 'encounter' | 'discovery';
  beatId?: string;
  characterId?: string;
  encounterId?: string;
  nodeId?: string;
}

export function initializeStoryState(): RunStoryState {
  return {
    activeArcId: null,
    currentAct: 0,
    seenBeatIds: [],
    pendingBeatIds: [],
    characterEncounters: {},
    runChoices: {},
    relationshipChanges: {},
  };
}

export function initializeCharacterSkills(
  playerClass: PlayerClass,
  bloodline: BloodlineData | undefined
): CharacterSkills {
  if (!bloodline) {
    return {
      stealth: 10,
      diplomacy: 10,
      athletics: 10,
      awareness: 10,
      lore: 10,
      survival: 10,
    };
  }
  return rollCharacterSkills(playerClass, bloodline);
}

type RelationshipTierName = 'hostile' | 'suspicious' | 'neutral' | 'friendly' | 'allied';

export function getRelationshipTier(value: number): RelationshipTierName {
  if (value >= 30) return 'allied';
  if (value >= 15) return 'friendly';
  if (value >= 0) return 'neutral';
  if (value >= -15) return 'suspicious';
  return 'hostile';
}

export function updateRelationship(
  state: GameState,
  characterId: string,
  change: number
): void {
  if (!state.runStory) return;

  const current = state.runStory.relationshipChanges[characterId] ?? 0;
  const newValue = Math.max(-50, Math.min(50, current + change));
  state.runStory.relationshipChanges[characterId] = newValue;
}

export function getCharacterRelationship(state: GameState, characterId: string): number {
  return state.runStory?.relationshipChanges[characterId] ?? 0;
}

export function hasTriggeredBeat(state: GameState, beatId: string): boolean {
  return state.runStory?.seenBeatIds.includes(beatId) ?? false;
}

export function markBeatTriggered(state: GameState, beatId: string): void {
  if (!state.runStory) return;
  if (!state.runStory.seenBeatIds.includes(beatId)) {
    state.runStory.seenBeatIds.push(beatId);
  }
}

export function checkStoryTriggers(state: GameState, context: StoryTriggerContext): PendingStoryEvent | null {
  if (!state.runStory) return null;

  const cache = getContentCache();
  if (!cache) return null;

  const beats = getStoryBeatsForFloor(cache, context.floorNumber);
  if (!beats || beats.length === 0) return null;

  for (const beat of beats) {
    if (hasTriggeredBeat(state, beat.id)) continue;

    if (matchesTrigger(beat, context)) {
      return {
        type: 'dialogue',
        beatId: beat.id,
        characterId: beat.characterId,
        nodeId: beat.dialogue?.rootNodeId,
      };
    }
  }

  return null;
}

function matchesTrigger(beat: NarrativeBeat, context: StoryTriggerContext): boolean {
  if (beat.trigger.type !== context.trigger.type) return false;

  switch (beat.trigger.type) {
    case 'floor': {
      const fr = beat.trigger.floorRange;
      if (!fr) return context.floorNumber >= 1;
      return context.floorNumber >= fr[0] && context.floorNumber <= fr[1];
    }

    case 'boss_kill':
    case 'death':
    case 'low_hp':
    case 'shop_visit':
    case 'item_pickup':
    case 'encounter':
      return true;

    default:
      return false;
  }
}

export function checkForFloorEncounter(state: GameState): GeneratedEncounter | null {
  if (!state.contentCache) return null;

  const encounter = getRandomEncounter(state.contentCache, state.floorNumber);
  return encounter ?? null;
}

export function getAvailableCharacters(state: GameState): StoryCharacter[] {
  const cache = getContentCache();
  if (!cache) {
    return FALLBACK_CHARACTERS.map(c => c as StoryCharacter);
  }

  const generated = getCharactersForFloor(cache, state.floorNumber);
  if (generated.length > 0) return generated;

  return FALLBACK_CHARACTERS.map(c => c as StoryCharacter);
}

export function findCharacterById(state: GameState, characterId: string): StoryCharacter | null {
  const characters = getAvailableCharacters(state);
  return characters.find(c => c.id === characterId) ?? null;
}

export function canRecruitCharacter(state: GameState, characterId: string): boolean {
  const relationship = getCharacterRelationship(state, characterId);
  const tier = getRelationshipTier(relationship);
  return tier === 'allied';
}

export function tryRecruitCharacter(state: GameState, characterId: string): boolean {
  if (!canRecruitCharacter(state, characterId)) return false;

  const character = findCharacterById(state, characterId);
  if (!character || !character.recruitable) return false;

  const bloodline = state._bloodlineRef as BloodlineData | undefined;
  if (bloodline) {
    if (!bloodline.storyData) {
      bloodline.storyData = {
        completedArcIds: [],
        characterRelations: {},
        storyFlags: [],
        unlockedAllyIds: [],
        arcProgress: {},
        seenContentIds: [],
      };
    }

    if (!bloodline.storyData.unlockedAllyIds.includes(characterId)) {
      bloodline.storyData.unlockedAllyIds.push(characterId);
    }
  }

  return true;
}

export function handleDialogueComplete(
  state: GameState,
  beatId: string,
  result: {
    choicesMade: string[];
    relationshipChange: number;
    effects: Array<{ type: string; value: unknown }>;
    skillCheckResults: SkillCheckResult[];
  }
): void {
  markBeatTriggered(state, beatId);

  // Find the beat to get the character
  const beat = findBeatById(state, beatId);
  
  if (result.relationshipChange !== 0 && state.runStory && beat?.characterId) {
    updateRelationship(state, beat.characterId, result.relationshipChange);
  }
  
  // Activate character quest if this is an AI-generated character
  if (beat?.characterId) {
    const activatedQuest = activateCharacterQuest(state, beat.characterId);
    if (activatedQuest) {
      console.log('[Story] Activated quest from dialogue:', activatedQuest.name);
    }
  }

  for (const effect of result.effects) {
    applyDialogueEffect(state, effect);
  }

  const bloodline = state._bloodlineRef as BloodlineData | undefined;
  if (bloodline) {
    if (!bloodline.storyData) {
      bloodline.storyData = {
        completedArcIds: [],
        characterRelations: {},
        storyFlags: [],
        unlockedAllyIds: [],
        arcProgress: {},
        seenContentIds: [],
      };
    }

    if (!bloodline.storyData.seenContentIds.includes(beatId)) {
      bloodline.storyData.seenContentIds.push(beatId);
    }

    if (state.runStory) {
      bloodline.storyData.characterRelations = { ...state.runStory.relationshipChanges };
    }
  }
}

function findBeatById(state: GameState, beatId: string): NarrativeBeat | null {
  const cache = getContentCache();
  if (!cache) return null;

  const beats = getStoryBeatsForFloor(cache, state.floorNumber);
  return beats?.find(b => b.id === beatId) ?? null;
}

function applyDialogueEffect(
  state: GameState,
  effect: { type: string; value: unknown }
): void {
  const value = effect.value as Record<string, unknown>;

  switch (effect.type) {
    case 'heal': {
      const amount = (value as { amount?: number }).amount ?? 10;
      state.player.stats.hp = Math.min(
        state.player.stats.maxHp,
        state.player.stats.hp + amount
      );
      break;
    }

    case 'gold': {
      const amount = (value as { amount?: number }).amount ?? 10;
      state.score += amount;
      break;
    }

    case 'item': {
      break;
    }

    case 'skill_bonus': {
      if (!state.skills) break;
      const skill = (value as { skill?: SkillName }).skill;
      const bonus = (value as { bonus?: number }).bonus ?? 1;
      if (skill && state.skills[skill] !== undefined) {
        state.skills[skill] = Math.min(20, state.skills[skill] + bonus);
      }
      break;
    }

    case 'boon': {
      const boon = (value as unknown as CharacterBoon) ?? (effect as unknown as { boon: CharacterBoon }).boon;
      if (boon && boon.id) {
        grantBoon(state, boon);
      }
      break;
    }
  }
}

// ══════════════════════════════════════════════════════════════
// BOON SYSTEM
// ══════════════════════════════════════════════════════════════

/** Grant a boon to the player */
export function grantBoon(state: GameState, boon: CharacterBoon): void {
  if (!state.activeCharacterBoons) {
    state.activeCharacterBoons = [];
  }
  
  // Don't duplicate boons from same character
  if (state.activeCharacterBoons.some(b => b.characterId === boon.characterId)) {
    console.log('[Boon] Already have boon from:', boon.characterName);
    return;
  }
  
  boon.isActive = true;
  boon.grantedAt = state.floorNumber;
  state.activeCharacterBoons.push(boon);
  
  console.log('[Boon] ✓ Granted:', boon.name, 'from', boon.characterName);
  
  // Add a message about receiving the boon
  state.messages.push({
    text: `${boon.characterName} grants you ${boon.name}!`,
    color: boon.color,
    turn: state.turn,
  });
}

/** Create a boon from dialogue node data */
export function createBoonFromDialogue(
  characterId: string,
  characterName: string,
  boonMeta: {
    name: string;
    flavorText: string;
    icon: string;
    color: string;
  },
  effectType: BoonEffectType,
  effectValue: number,
  multiplier: number = 1.0
): CharacterBoon {
  const finalValue = Math.round(effectValue * multiplier);
  
  // Generate description based on effect type
  const descriptions: Record<BoonEffectType, (v: number) => string> = {
    damage_boost: (v) => `+${v}% damage to all attacks`,
    defense_boost: (v) => `+${v} defense against all damage`,
    hp_regen: (v) => `Heal ${v} HP when descending to a new floor`,
    gold_find: (v) => `+${v}% gold from all sources`,
    xp_boost: (v) => `+${v}% experience gain`,
    crit_chance: (v) => `+${v}% critical hit chance`,
    lifesteal: (v) => `Heal ${v}% of damage dealt`,
    evasion: (v) => `${v}% chance to dodge attacks`,
    first_strike: (v) => `+${v} damage on first attack each combat`,
    thorns: (v) => `Reflect ${v} damage when hit`,
    treasure_sense: (v) => `Reveal ${v} hidden items per floor`,
    monster_fear: (v) => `${v}% chance enemies flee`,
    revival: (v) => `Survive death once with ${v} HP`,
    ability_unlock: () => `Unlocks a special ability`,
    skill_bonus: (v) => `+${v} to skill checks`,
  };
  
  return {
    id: `boon_${characterId}_${Date.now()}`,
    characterId,
    characterName,
    name: boonMeta.name,
    description: descriptions[effectType]?.(finalValue) ?? `${effectType}: ${finalValue}`,
    flavorText: boonMeta.flavorText,
    icon: boonMeta.icon,
    color: boonMeta.color,
    effects: [{
      type: effectType,
      value: finalValue,
    }],
    duration: 'run',
    grantedAt: 0,
    isActive: true,
  };
}

/** Get all active boons */
export function getActiveBoons(state: GameState): CharacterBoon[] {
  return state.activeCharacterBoons?.filter(b => b.isActive) ?? [];
}

/** Calculate total boon bonus for an effect type */
export function getBoonBonus(state: GameState, effectType: BoonEffectType): number {
  const boons = getActiveBoons(state);
  let total = 0;
  
  for (const boon of boons) {
    for (const effect of boon.effects) {
      if (effect.type === effectType) {
        total += effect.value;
      }
    }
  }
  
  return total;
}

/** Update boon durations at floor change */
export function updateBoonDurations(state: GameState): void {
  if (!state.activeCharacterBoons) return;
  
  for (const boon of state.activeCharacterBoons) {
    if (boon.duration === 'floors' && boon.floorsRemaining !== undefined) {
      boon.floorsRemaining--;
      if (boon.floorsRemaining <= 0) {
        boon.isActive = false;
        state.messages.push({
          text: `${boon.name} has faded.`,
          color: '#888',
          turn: state.turn,
        });
      }
    }
  }
}

export function getStoryProgress(state: GameState): {
  arcsCompleted: number;
  charactersRecruited: number;
  totalBeats: number;
  beatsTriggered: number;
} {
  const bloodline = state._bloodlineRef as BloodlineData | undefined;
  const storyData = bloodline?.storyData;

  return {
    arcsCompleted: storyData?.completedArcIds.length ?? 0,
    charactersRecruited: storyData?.unlockedAllyIds.length ?? 0,
    totalBeats: 0,
    beatsTriggered: state.runStory?.seenBeatIds.length ?? 0,
  };
}

export async function prepareRunContent(
  playerClass: PlayerClass,
  bloodline: BloodlineData,
  onProgress?: (progress: number, message: string) => void
): Promise<boolean> {
  return startGeneration(playerClass, bloodline, onProgress);
}

export function isContentReady(): boolean {
  return isReadyToPlay();
}

export function onFloorEnter(state: GameState): PendingStoryEvent | null {
  checkFloorTrigger(state.floorNumber);

  const cache = getContentCache();
  const beats = getStoryBeatsForFloor(cache, state.floorNumber);
  console.log('[Story] onFloorEnter floor:', state.floorNumber, 'cache:', cache, 'beats:', beats);

  const result = checkStoryTriggers(state, {
    trigger: { type: 'floor', floorRange: [state.floorNumber, state.floorNumber] },
    floorNumber: state.floorNumber,
  });
  console.log('[Story] checkStoryTriggers result:', result);
  return result;
}

export function onCombatStart(
  state: GameState,
  targetName: string,
  isBoss: boolean
): PendingStoryEvent | null {
  return checkStoryTriggers(state, {
    trigger: { type: 'boss_kill' },
    floorNumber: state.floorNumber,
    combatTarget: targetName,
    isBossFight: isBoss,
  });
}

export function onLowHealth(state: GameState): PendingStoryEvent | null {
  const healthPercent = state.player.stats.hp / state.player.stats.maxHp;
  if (healthPercent > 0.25) return null;

  return checkStoryTriggers(state, {
    trigger: { type: 'low_hp' },
    floorNumber: state.floorNumber,
    isLowHealth: true,
  });
}

// ══════════════════════════════════════════════════════════════
// CHARACTER QUEST SYSTEM
// ══════════════════════════════════════════════════════════════

/** Activate a character's quest when the player meets them */
export function activateCharacterQuest(state: GameState, characterId: string): CharacterQuest | null {
  const cache = getContentCache();
  const quest = getQuestForCharacter(cache, characterId);
  
  if (!quest) {
    console.log('[Story] No quest found for character:', characterId);
    return null;
  }
  
  // Check if already active
  if (state.activeCharacterQuests?.some(q => q.id === quest.id)) {
    console.log('[Story] Quest already active:', quest.name);
    return null;
  }
  
  // Add to active quests
  if (!state.activeCharacterQuests) {
    state.activeCharacterQuests = [];
  }
  state.activeCharacterQuests.push({ ...quest, progress: 0 });
  
  console.log('[Story] ✓ Activated character quest:', quest.name, 'from', quest.characterName);
  return quest;
}

/** Update progress on character quests based on game events */
export function updateCharacterQuestProgress(
  state: GameState,
  event: {
    type: 'kill' | 'floor_reached' | 'gold_collected' | 'skill_check_passed' | 'floor_survived';
    value?: number;
  }
): void {
  if (!state.activeCharacterQuests || state.activeCharacterQuests.length === 0) return;
  
  for (const quest of state.activeCharacterQuests) {
    if (quest.isComplete) continue;
    
    let increment = 0;
    
    switch (quest.questType) {
      case 'kill_enemies':
        if (event.type === 'kill') increment = 1;
        break;
      case 'reach_floor':
        if (event.type === 'floor_reached' && event.value) {
          quest.progress = Math.max(quest.progress, event.value);
        }
        break;
      case 'collect_gold':
        if (event.type === 'gold_collected' && event.value) {
          increment = event.value;
        }
        break;
      case 'pass_skill_checks':
        if (event.type === 'skill_check_passed') increment = 1;
        break;
      case 'survive_floors':
        if (event.type === 'floor_survived') increment = 1;
        break;
    }
    
    if (increment > 0) {
      quest.progress += increment;
    }
    
    if (quest.progress >= quest.target && !quest.isComplete) {
      quest.isComplete = true;
      console.log('[Story] ✓ Character quest completed:', quest.name);
    }
  }
}

/** Get all active character quests */
export function getActiveCharacterQuests(state: GameState): CharacterQuest[] {
  return state.activeCharacterQuests ?? [];
}

/** Claim rewards from a completed character quest */
export function claimCharacterQuestReward(
  state: GameState,
  questId: string
): { gold: number; echoes: number; skillBonus?: { skill: string; value: number }; message: string } | null {
  if (!state.activeCharacterQuests) return null;
  
  const questIndex = state.activeCharacterQuests.findIndex(q => q.id === questId);
  if (questIndex === -1) return null;
  
  const quest = state.activeCharacterQuests[questIndex]!;
  if (!quest.isComplete || quest.isClaimed) return null;
  
  // Mark as claimed
  quest.isClaimed = true;
  
  // Apply rewards
  const goldReward = quest.rewards.gold ?? 0;
  const echoReward = quest.rewards.echoReward ?? 0;
  
  // Grant skill bonus based on quest type
  let skillBonus: { skill: string; value: number } | undefined;
  if (state.skills && quest.questType === 'pass_skill_checks') {
    // Grant +1 to a random narrative skill for skill-based quests
    const skills: (keyof typeof state.skills)[] = ['stealth', 'diplomacy', 'athletics', 'awareness', 'lore', 'survival'];
    const randomSkill = skills[Math.floor(Math.random() * skills.length)]!;
    state.skills[randomSkill] += 1;
    skillBonus = { skill: randomSkill, value: 1 };
    console.log(`[Quest] Granted +1 ${randomSkill} for completing skill quest`);
  }
  
  // Update relationship via run story relationship changes
  if (state.runStory && quest.characterId) {
    const currentRel = state.runStory.relationshipChanges[quest.characterId] ?? 0;
    state.runStory.relationshipChanges[quest.characterId] = currentRel + quest.rewards.relationshipBonus;
  }
  
  const skillMessage = skillBonus ? ` (+1 ${skillBonus.skill})` : '';
  
  return {
    gold: goldReward,
    echoes: echoReward,
    skillBonus,
    message: `Quest complete! ${quest.characterName} thanks you.${skillMessage}`,
  };
}

export { rollCharacterSkills } from './characterSkills';
