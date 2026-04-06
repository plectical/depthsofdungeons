import type {
  GameState,
  BloodlineData,
  Entity,
} from '../types';
import { getRelationshipTier, findCharacterById } from './storyManager';

export interface StoryAllyAbility {
  name: string;
  description: string;
  cooldown: number;
  currentCooldown: number;
  effect: (state: GameState, ally: Entity) => void;
}

export interface StoryAllyDefinition {
  characterId: string;
  baseStats: {
    hp: number;
    maxHp: number;
    attack: number;
    speed: number;
  };
  abilities: StoryAllyAbility[];
  passiveBonus: {
    type: 'attack' | 'speed' | 'skill' | 'special';
    value: number | string;
  };
}

export function isAllyUnlocked(bloodline: BloodlineData, characterId: string): boolean {
  return bloodline.storyData?.unlockedAllyIds.includes(characterId) ?? false;
}

export function getUnlockedAllies(bloodline: BloodlineData): string[] {
  return bloodline.storyData?.unlockedAllyIds ?? [];
}

export const STORY_ALLY_DEFINITIONS: Record<string, StoryAllyDefinition> = {
  gnash: {
    characterId: 'gnash',
    baseStats: { hp: 40, maxHp: 40, attack: 8, speed: 6 },
    abilities: [
      {
        name: 'Rallying Cry',
        description: 'Boosts all allies attack by 2 for 3 turns',
        cooldown: 5,
        currentCooldown: 0,
        effect: () => {},
      },
    ],
    passiveBonus: { type: 'attack', value: 1 },
  },
  mira: {
    characterId: 'mira',
    baseStats: { hp: 25, maxHp: 25, attack: 5, speed: 10 },
    abilities: [
      {
        name: 'Ancient Wisdom',
        description: 'Reveals hidden elements on the floor',
        cooldown: 8,
        currentCooldown: 0,
        effect: () => {},
      },
    ],
    passiveBonus: { type: 'skill', value: 'lore' },
  },
  vex: {
    characterId: 'vex',
    baseStats: { hp: 30, maxHp: 30, attack: 6, speed: 9 },
    abilities: [
      {
        name: 'Shadow Strike',
        description: 'Deals 15 damage from stealth, gains temporary invisibility',
        cooldown: 6,
        currentCooldown: 0,
        effect: () => {},
      },
    ],
    passiveBonus: { type: 'skill', value: 'stealth' },
  },
};

export function createAllyEntity(_characterId: string): Entity | null {
  return null;
}

export function canRecruitCharacterAsAlly(state: GameState, characterId: string): boolean {
  const relationship = state.runStory?.relationshipChanges[characterId] ?? 0;
  const tier = getRelationshipTier(relationship);

  if (tier !== 'allied') return false;

  const character = findCharacterById(state, characterId);
  return character?.recruitable ?? false;
}

export function recruitCharacterToBloodline(
  state: GameState,
  characterId: string,
  bloodline: BloodlineData
): boolean {
  if (!canRecruitCharacterAsAlly(state, characterId)) return false;

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
    return true;
  }

  return false;
}

export function isEntityStoryAlly(entity: Entity): boolean {
  if (!entity.isMercenary) return false;
  const idMatch = entity.id.match(/^ally_(.+)_\d+$/);
  return idMatch !== null;
}

function getCharacterIdFromAlly(entity: Entity): string | null {
  const match = entity.id.match(/^ally_(.+)_\d+$/);
  return match?.[1] ?? null;
}

export function getAllyPassiveBonus(entity: Entity): StoryAllyDefinition['passiveBonus'] | null {
  if (!isEntityStoryAlly(entity)) return null;

  const characterId = getCharacterIdFromAlly(entity);
  if (!characterId) return null;

  const definition = STORY_ALLY_DEFINITIONS[characterId];
  return definition?.passiveBonus ?? null;
}

export function applyAllyPassives(_state: GameState): void {
  // Stub - will be implemented when Entity type alignment is complete
}

export function processAllyAbilities(_state: GameState): void {
  // Stub - will be implemented when Entity type alignment is complete
}

export function triggerAllyAbility(
  _state: GameState,
  _entity: Entity,
  _abilityIndex: number
): boolean {
  return false;
}
