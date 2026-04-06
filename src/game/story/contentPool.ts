import RundotGameAPI from '@series-inc/rundot-game-sdk/api';

const FRESH_GENERATION_PERCENT = 25;
const POOL_ENABLED = true;

export interface PooledPortrait {
  imageUrl: string;
  factionId?: string;
  creatureType?: string;
  appearancePrompt?: string;
  enemyId?: string;
  portraitPrompt?: string;
  name?: string;
  class?: string;
}

export interface PooledRoomEventArt {
  imageUrl: string;
  eventId: string;
  artPrompt?: string;
}

export interface PooledEnemyEncounter {
  characterName: string;
  characterTitle: string;
  dialogue: unknown;
  portraitPrompt?: string;
  rewards?: unknown;
  quest?: unknown;
}

type PooledContent = PooledPortrait | PooledRoomEventArt | PooledEnemyEncounter;

interface UgcEntry<T> {
  id: string;
  data: T;
  useCount?: number;
  likeCount?: number;
  isLikedByMe?: boolean;
}

interface UgcBrowseResponse<T> {
  entries: UgcEntry<T>[];
  nextCursor?: string;
}

function isPoolEnabled(): boolean {
  if (!POOL_ENABLED) return false;
  try {
    return !RundotGameAPI.accessGate.isAnonymous();
  } catch {
    return false;
  }
}

export async function fetchFromPool<T extends PooledContent>(
  contentType: string,
  tags: Record<string, string>
): Promise<{ data: T; entryId: string } | null> {
  if (!isPoolEnabled()) return null;

  try {
    const tagArray = Object.entries(tags).map(([k, v]) => `${k}:${v}`);
    
    const response = await (RundotGameAPI as any).ugc.browse({
      contentType,
      sortBy: 'mostUsed',
      limit: 10,
      tags: tagArray,
    }) as UgcBrowseResponse<T>;

    if (!response?.entries?.length) {
      console.log(`[ContentPool] No entries found for ${contentType} with tags:`, tags);
      return null;
    }

    const randomIndex = Math.floor(Math.random() * Math.min(response.entries.length, 5));
    const entry = response.entries[randomIndex];
    
    if (!entry) {
      console.log(`[ContentPool] Entry at index ${randomIndex} is undefined`);
      return null;
    }
    
    console.log(`[ContentPool] Found ${response.entries.length} entries for ${contentType}, using entry ${entry.id}`);
    
    return { data: entry.data as T, entryId: entry.id };
  } catch (error) {
    console.warn('[ContentPool] Failed to fetch from pool:', error);
    return null;
  }
}

export async function saveToPool<T extends PooledContent>(
  contentType: string,
  tags: Record<string, string>,
  data: T,
  title?: string
): Promise<string | null> {
  if (!isPoolEnabled()) return null;

  try {
    const tagArray = Object.entries(tags).map(([k, v]) => `${k}:${v}`);
    
    const entry = await (RundotGameAPI as any).ugc.create({
      contentType,
      data,
      isPublic: true,
      title: title || `${contentType}_${Date.now()}`,
      tags: tagArray,
    });

    console.log(`[ContentPool] Saved to pool: ${contentType} -> ${entry.id}`);
    return entry.id;
  } catch (error) {
    console.warn('[ContentPool] Failed to save to pool:', error);
    return null;
  }
}

export async function recordPoolUse(entryId: string): Promise<void> {
  if (!isPoolEnabled()) return;

  try {
    await (RundotGameAPI as any).ugc.recordUse(entryId);
    console.log(`[ContentPool] Recorded use for entry ${entryId}`);
  } catch (error) {
    console.warn('[ContentPool] Failed to record use:', error);
  }
}

export async function fetchOrGenerate<T extends PooledContent>(
  contentType: string,
  tags: Record<string, string>,
  generateFn: () => Promise<T | null>,
  title?: string
): Promise<T | null> {
  if (!isPoolEnabled()) {
    return generateFn();
  }

  const shouldGenerateFresh = Math.random() * 100 < FRESH_GENERATION_PERCENT;
  
  if (shouldGenerateFresh) {
    console.log(`[ContentPool] Rolling fresh generation for ${contentType} (${FRESH_GENERATION_PERCENT}% chance)`);
    const fresh = await generateFn();
    if (fresh) {
      saveToPool(contentType, tags, fresh, title).catch(() => {});
    }
    return fresh;
  }

  const pooled = await fetchFromPool<T>(contentType, tags);
  if (pooled) {
    recordPoolUse(pooled.entryId).catch(() => {});
    return pooled.data;
  }

  console.log(`[ContentPool] Pool empty for ${contentType}, generating fresh`);
  const fresh = await generateFn();
  if (fresh) {
    saveToPool(contentType, tags, fresh, title).catch(() => {});
  }
  return fresh;
}

export async function fetchOrGenerateImageUrl(
  contentType: string,
  tags: Record<string, string>,
  generateFn: () => Promise<string | null>,
  additionalData?: Partial<PooledPortrait>
): Promise<string | null> {
  const result = await fetchOrGenerate<PooledPortrait>(
    contentType,
    tags,
    async () => {
      const imageUrl = await generateFn();
      if (!imageUrl) return null;
      return { imageUrl, ...additionalData } as PooledPortrait;
    }
  );
  return result?.imageUrl || null;
}

export function getPoolStats(): { enabled: boolean; freshPercent: number } {
  return {
    enabled: isPoolEnabled(),
    freshPercent: FRESH_GENERATION_PERCENT,
  };
}
