import type {
  RunContentCache,
  FloorContentBatch,
  StoryCharacter,
  GeneratedEncounter,
  GeneratedItem,
  NarrativeBeat,
  HiddenElement,
  InteractableElement,
  MercenaryDef,
  CharacterQuest,
  EnemyEncounterData,
} from '../types';

// Create an empty floor content batch
function createEmptyBatch(floorRange: [number, number]): FloorContentBatch {
  return {
    floorRange,
    characters: [],
    encounters: [],
    items: [],
    storyBeats: [],
    hiddenElements: [],
    interactables: [],
    mercenaries: [],
    characterQuests: [],
    enemyEncounters: [],
    isReady: false,
    isGenerated: false,
  };
}

// Create an empty run content cache
export function createEmptyCache(): RunContentCache {
  return {
    floors1to3: null,
    floors4to6: null,
    floors7to10: null,
    floors11plus: null,
  };
}

// Get cache key for a floor number
type CacheKey = 'floors1to3' | 'floors4to6' | 'floors7to10' | 'floors11plus';

export function getCacheKeyForFloor(floorNumber: number): CacheKey {
  if (floorNumber <= 3) return 'floors1to3';
  if (floorNumber <= 6) return 'floors4to6';
  if (floorNumber <= 10) return 'floors7to10';
  return 'floors11plus';
}

// Get floor range for a cache key
export function getFloorRangeForKey(key: CacheKey): [number, number] {
  switch (key) {
    case 'floors1to3': return [1, 3];
    case 'floors4to6': return [4, 6];
    case 'floors7to10': return [7, 10];
    case 'floors11plus': return [11, 15];
  }
}

// Check if content is ready for a floor
export function isContentReadyForFloor(cache: RunContentCache, floorNumber: number): boolean {
  const key = getCacheKeyForFloor(floorNumber);
  return cache[key]?.isReady ?? false;
}

// Get content batch for a floor
export function getContentForFloor(cache: RunContentCache, floorNumber: number): FloorContentBatch | null {
  const key = getCacheKeyForFloor(floorNumber);
  return cache[key];
}

// Initialize a batch in the cache
export function initializeBatch(cache: RunContentCache, key: CacheKey): RunContentCache {
  const floorRange = getFloorRangeForKey(key);
  return {
    ...cache,
    [key]: createEmptyBatch(floorRange),
  };
}

// Mark a batch as generating
export function markBatchGenerating(cache: RunContentCache, key: CacheKey): RunContentCache {
  const batch = cache[key];
  if (!batch) return initializeBatch(cache, key);
  
  return {
    ...cache,
    [key]: {
      ...batch,
      isGenerated: false,
      isReady: false,
    },
  };
}

// Update a batch with generated content
export function updateBatchContent(
  cache: RunContentCache,
  key: CacheKey,
  content: Partial<{
    characters: StoryCharacter[];
    encounters: GeneratedEncounter[];
    items: GeneratedItem[];
    storyBeats: NarrativeBeat[];
    hiddenElements: HiddenElement[];
    interactables: InteractableElement[];
    mercenaries: MercenaryDef[];
    characterQuests: CharacterQuest[];
    enemyEncounters: EnemyEncounterData[];
  }>
): RunContentCache {
  const batch = cache[key] ?? createEmptyBatch(getFloorRangeForKey(key));
  
  return {
    ...cache,
    [key]: {
      ...batch,
      characters: content.characters ?? batch.characters,
      encounters: content.encounters ?? batch.encounters,
      items: content.items ?? batch.items,
      storyBeats: content.storyBeats ?? batch.storyBeats,
      hiddenElements: content.hiddenElements ?? batch.hiddenElements,
      interactables: content.interactables ?? batch.interactables,
      mercenaries: content.mercenaries ?? batch.mercenaries,
      characterQuests: content.characterQuests ?? batch.characterQuests,
      enemyEncounters: content.enemyEncounters ?? batch.enemyEncounters,
    },
  };
}

// Mark a batch as ready
export function markBatchReady(cache: RunContentCache, key: CacheKey): RunContentCache {
  const batch = cache[key];
  if (!batch) return cache;
  
  return {
    ...cache,
    [key]: {
      ...batch,
      isGenerated: true,
      isReady: true,
    },
  };
}

// Get a random encounter for a floor
export function getRandomEncounter(
  cache: RunContentCache,
  floorNumber: number
): GeneratedEncounter | null {
  const batch = getContentForFloor(cache, floorNumber);
  if (!batch || batch.encounters.length === 0) return null;
  
  const index = Math.floor(Math.random() * batch.encounters.length);
  return batch.encounters[index] ?? null;
}

// Get a random item for a floor
export function getRandomItem(
  cache: RunContentCache,
  floorNumber: number
): GeneratedItem | null {
  const batch = getContentForFloor(cache, floorNumber);
  if (!batch || batch.items.length === 0) return null;
  
  const index = Math.floor(Math.random() * batch.items.length);
  return batch.items[index] ?? null;
}

// Get characters for a floor
export function getCharactersForFloor(
  cache: RunContentCache,
  floorNumber: number
): StoryCharacter[] {
  const batch = getContentForFloor(cache, floorNumber);
  return batch?.characters ?? [];
}

// Get story beats for a floor
export function getStoryBeatsForFloor(
  cache: RunContentCache,
  floorNumber: number
): NarrativeBeat[] {
  const batch = getContentForFloor(cache, floorNumber);
  return batch?.storyBeats ?? [];
}

// Get mercenaries for a floor
export function getMercenariesForFloor(
  cache: RunContentCache,
  floorNumber: number
): MercenaryDef[] {
  const batch = getContentForFloor(cache, floorNumber);
  return batch?.mercenaries ?? [];
}

// Get character quests for a floor
export function getCharacterQuestsForFloor(
  cache: RunContentCache,
  floorNumber: number
): CharacterQuest[] {
  const batch = getContentForFloor(cache, floorNumber);
  return batch?.characterQuests ?? [];
}

// Get a specific character's quest
export function getQuestForCharacter(
  cache: RunContentCache,
  characterId: string
): CharacterQuest | null {
  const keys: CacheKey[] = ['floors1to3', 'floors4to6', 'floors7to10', 'floors11plus'];
  for (const key of keys) {
    const batch = cache[key];
    if (batch?.characterQuests) {
      const quest = batch.characterQuests.find(q => q.characterId === characterId);
      if (quest) return quest;
    }
  }
  return null;
}

// Get enemy encounter data by enemy ID
export function getEnemyEncounter(
  cache: RunContentCache,
  enemyId: string
): EnemyEncounterData | null {
  const keys: CacheKey[] = ['floors1to3', 'floors4to6', 'floors7to10', 'floors11plus'];
  for (const key of keys) {
    const batch = cache[key];
    if (batch?.enemyEncounters) {
      const encounter = batch.enemyEncounters.find(e => e.enemyId === enemyId);
      if (encounter) return encounter;
    }
  }
  return null;
}

// Add enemy encounter to cache
export function addEnemyEncounter(
  cache: RunContentCache,
  floorNumber: number,
  encounter: EnemyEncounterData
): RunContentCache {
  const key = getCacheKeyForFloor(floorNumber);
  const batch = cache[key] ?? createEmptyBatch(getFloorRangeForKey(key));
  
  return {
    ...cache,
    [key]: {
      ...batch,
      enemyEncounters: [...batch.enemyEncounters, encounter],
    },
  };
}

// Get all cache keys that need generation
export function getPendingCacheKeys(cache: RunContentCache): CacheKey[] {
  const keys: CacheKey[] = ['floors1to3', 'floors4to6', 'floors7to10', 'floors11plus'];
  return keys.filter(key => !cache[key]?.isGenerated);
}

// Get generation progress (0-100)
export function getGenerationProgress(cache: RunContentCache): number {
  const keys: CacheKey[] = ['floors1to3', 'floors4to6', 'floors7to10', 'floors11plus'];
  const readyCount = keys.filter(key => cache[key]?.isReady).length;
  return Math.round((readyCount / keys.length) * 100);
}

// Check if initial content is ready (floors 1-3)
export function isInitialContentReady(cache: RunContentCache): boolean {
  return cache.floors1to3?.isReady ?? false;
}

// Debug: log cache state
export function logCacheState(cache: RunContentCache): void {
  console.log('Content Cache State:');
  const keys: CacheKey[] = ['floors1to3', 'floors4to6', 'floors7to10', 'floors11plus'];
  for (const key of keys) {
    const batch = cache[key];
    if (batch) {
      console.log(`  ${key}: ${batch.isReady ? '✓' : '○'} | chars: ${batch.characters.length}, enc: ${batch.encounters.length}, items: ${batch.items.length}`);
    } else {
      console.log(`  ${key}: [not initialized]`);
    }
  }
}
