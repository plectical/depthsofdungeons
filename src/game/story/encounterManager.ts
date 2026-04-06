import type {
  GameState,
  GeneratedEncounter,
  HiddenElement,
  InteractableElement,
  SkillCheck,
  SkillCheckResult,
  SkillName,
  DungeonFloor,
  Pos,
} from '../types';
import { performSkillCheck, meetsSkillThreshold } from './characterSkills';
import { getRandomEncounter as getCacheRandomEncounter, getContentForFloor } from './contentCache';
import { getRandomFallbackEncounter, getAllFallbackEncounters } from './fallbackContent';
import { getContentCache } from './progressiveLoader';
import { isWalkableTile, getTile } from '../dungeon';
import { uid, randInt } from '../utils';

export function getRandomEncounter(state: GameState): GeneratedEncounter | null {
  if (!state.contentCache) {
    return getRandomFallbackEncounter(state.floorNumber) ?? null;
  }

  const encounter = getCacheRandomEncounter(state.contentCache, state.floorNumber);
  return encounter ?? getRandomFallbackEncounter(state.floorNumber) ?? null;
}

function findSpawnPosition(floor: DungeonFloor, occupied: Set<string>): Pos | null {
  for (let attempt = 0; attempt < 50; attempt++) {
    const room = floor.rooms[randInt(0, floor.rooms.length - 1)];
    if (!room) continue;
    const x = randInt(room.x + 1, room.x + room.w - 2);
    const y = randInt(room.y + 1, room.y + room.h - 2);
    const key = `${x},${y}`;
    if (isWalkableTile(getTile(floor, x, y)) && !occupied.has(key)) {
      occupied.add(key);
      return { x, y };
    }
  }
  return null;
}

export function spawnFloorEncounters(state: GameState, occupied: Set<string>): void {
  state.hiddenElements = [];
  state.interactables = [];
  
  const cache = getContentCache();
  const batch = getContentForFloor(cache, state.floorNumber);
  const encounters = batch?.encounters ?? getAllFallbackEncounters().filter(
    e => e.floorRange[0] <= state.floorNumber && e.floorRange[1] >= state.floorNumber
  );
  
  if (encounters.length === 0) return;
  
  // Spawn 1-2 encounters per floor based on floor depth
  const encounterCount = state.floorNumber <= 3 ? 1 : state.floorNumber <= 6 ? 2 : 3;
  const shuffled = [...encounters].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < Math.min(encounterCount, shuffled.length); i++) {
    const encounter = shuffled[i];
    if (!encounter) continue;
    
    const pos = findSpawnPosition(state.floor, occupied);
    if (!pos) continue;
    
    // Create an interactable from the encounter
    const interactable: InteractableElement = {
      id: uid(),
      pos,
      type: mapEncounterType(encounter.type),
      primarySkill: encounter.primarySkill,
      alternateSkill: encounter.alternateSkill,
      target: encounter.target,
      description: encounter.description,
      interacted: false,
      successEffect: encounter.successReward,
      partialEffect: encounter.partialReward,
      failureEffect: encounter.failurePenalty,
    };
    
    state.interactables.push(interactable);
    console.log('[Encounter] Spawned:', encounter.type, 'at', pos, 'skill:', encounter.primarySkill);
  }
  
  // Also spawn 0-1 hidden elements for awareness/perception checks
  if (Math.random() < 0.4 + state.floorNumber * 0.05) {
    const pos = findSpawnPosition(state.floor, occupied);
    if (pos) {
      const hiddenTypes: HiddenElement['type'][] = ['hidden_cache', 'secret_door', 'lore_inscription'];
      const hiddenSkills: SkillName[] = ['awareness', 'lore', 'survival'];
      const typeIndex = randInt(0, hiddenTypes.length - 1);
      
      const hidden: HiddenElement = {
        id: uid(),
        pos,
        type: hiddenTypes[typeIndex] ?? 'hidden_cache',
        skill: hiddenSkills[typeIndex] ?? 'awareness',
        threshold: 8 + Math.floor(state.floorNumber / 3),
        discovered: false,
        description: getHiddenDescription(hiddenTypes[typeIndex] ?? 'hidden_cache'),
        reward: { type: 'gold', value: 15 + state.floorNumber * 5 },
      };
      
      state.hiddenElements.push(hidden);
      console.log('[Hidden] Spawned:', hidden.type, 'at', pos);
    }
  }
}

function mapEncounterType(type: string): InteractableElement['type'] {
  switch (type) {
    case 'hidden_cache': return 'ancient_puzzle';
    case 'skill_challenge': return 'stuck_mechanism';
    case 'negotiation': return 'negotiation';
    case 'chase': return 'chase';
    default: return 'stuck_mechanism';
  }
}

function getHiddenDescription(type: HiddenElement['type']): string {
  switch (type) {
    case 'hidden_cache': return 'You notice loose stones that might conceal something...';
    case 'secret_door': return 'The wall here seems slightly different from the rest...';
    case 'lore_inscription': return 'Faint markings glow with ancient power...';
    case 'trap': return 'Something feels wrong about this area...';
    case 'ambush': return 'Shadows seem to move at the edge of your vision...';
    case 'shortcut': return 'A hidden passage leads deeper...';
    default: return 'Something catches your eye...';
  }
}

export function checkForHiddenElements(state: GameState): HiddenElement | null {
  if (!state.hiddenElements || !state.skills) return null;

  const px = state.player.pos.x;
  const py = state.player.pos.y;

  for (const hidden of state.hiddenElements) {
    if (hidden.discovered) continue;

    const dx = Math.abs(hidden.pos.x - px);
    const dy = Math.abs(hidden.pos.y - py);
    if (dx <= 2 && dy <= 2) {
      if (meetsSkillThreshold(state, hidden.skill, hidden.threshold)) {
        return hidden;
      }
    }
  }

  return null;
}

export function discoverHiddenElement(
  state: GameState,
  elementId: string
): { discovered: HiddenElement; reward?: { type: string; value: string | number } } | null {
  if (!state.hiddenElements) return null;

  const element = state.hiddenElements.find(e => e.id === elementId);
  if (!element || element.discovered) return null;

  element.discovered = true;

  return {
    discovered: element,
    reward: element.reward,
  };
}

export function interactWithElement(
  state: GameState,
  elementId: string
): { result: SkillCheckResult; narrative: string } | null {
  if (!state.interactables || !state.skills) return null;

  const element = state.interactables.find(e => e.id === elementId);
  if (!element || element.interacted) return null;

  const check: SkillCheck = {
    skill: element.primarySkill,
    target: element.target,
  };

  const result = performSkillCheck(state, check);
  element.interacted = true;

  let narrative = '';

  switch (result.outcome) {
    case 'critical':
    case 'success':
      narrative = 'You succeeded!';
      applyReward(state, element.successEffect);
      break;

    case 'partial':
      narrative = 'You partially succeeded.';
      if (element.partialEffect) {
        applyReward(state, element.partialEffect);
      }
      break;

    case 'fail':
    case 'critical_fail':
      narrative = 'You failed.';
      if (element.failureEffect) {
        applyPenalty(state, element.failureEffect);
      }
      break;
  }

  return { result, narrative };
}

function applyReward(
  state: GameState,
  reward: { type: string; value: string | number; characterId?: string }
): void {
  switch (reward.type) {
    case 'gold':
      state.score += typeof reward.value === 'number' ? reward.value : 0;
      break;
    case 'heal':
      state.player.stats.hp = Math.min(
        state.player.stats.maxHp,
        state.player.stats.hp + (typeof reward.value === 'number' ? reward.value : 10)
      );
      break;
  }
}

function applyPenalty(
  state: GameState,
  penalty: { type: string; value: number; characterId?: string }
): void {
  switch (penalty.type) {
    case 'damage':
      state.player.stats.hp = Math.max(0, state.player.stats.hp - penalty.value);
      break;
  }
}

export function getNearbyInteractables(state: GameState): InteractableElement[] {
  if (!state.interactables) return [];

  const px = state.player.pos.x;
  const py = state.player.pos.y;

  return state.interactables.filter(e => {
    if (e.interacted) return false;
    const dx = Math.abs(e.pos.x - px);
    const dy = Math.abs(e.pos.y - py);
    return dx <= 1 && dy <= 1;
  });
}
