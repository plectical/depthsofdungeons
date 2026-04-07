import RundotGameAPI from '@series-inc/rundot-game-sdk/api';

const FRESH_GENERATION_PERCENT = 60;
const POOL_ENABLED = true;

// Track if pool is full to avoid repeated 429 errors
let _poolFull = false;
let _lastSaveAttempt = 0;
const SAVE_COOLDOWN_MS = 5000; // 5 seconds between save attempts

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
  
  // Skip if pool is known to be full
  if (_poolFull) {
    console.log('[ContentPool] Skipping save - pool is full');
    return null;
  }
  
  // Rate limit save attempts
  const now = Date.now();
  if (now - _lastSaveAttempt < SAVE_COOLDOWN_MS) {
    console.log('[ContentPool] Skipping save - rate limited');
    return null;
  }
  _lastSaveAttempt = now;

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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check for pool full error
    if (errorMessage.includes('Maximum entries') || errorMessage.includes('100')) {
      console.warn('[ContentPool] Pool is full (100 entries max) - switching to read-only mode');
      _poolFull = true;
    } else if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
      console.warn('[ContentPool] Rate limited - will retry later');
    } else {
      console.warn('[ContentPool] Failed to save to pool:', error);
    }
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
  console.log(`[ContentPool] fetchOrGenerate called for ${contentType}, poolEnabled:`, isPoolEnabled(), 'poolFull:', _poolFull);
  
  if (!isPoolEnabled()) {
    console.log(`[ContentPool] Pool disabled, calling generateFn directly for ${contentType}`);
    try {
      const result = await generateFn();
      console.log(`[ContentPool] Direct generation result for ${contentType}:`, result ? 'success' : 'null');
      return result;
    } catch (err) {
      console.error(`[ContentPool] Direct generation error for ${contentType}:`, err);
      return null;
    }
  }

  // If pool is full, try to fetch from pool first before generating
  if (_poolFull) {
    console.log(`[ContentPool] Pool is full - trying pool first for ${contentType}`);
    const pooled = await fetchFromPool<T>(contentType, tags);
    if (pooled) {
      console.log(`[ContentPool] Found in pool for ${contentType}:`, pooled.entryId);
      recordPoolUse(pooled.entryId).catch(() => {});
      return pooled.data;
    }
    // Pool full but no match - generate fresh without saving
    console.log(`[ContentPool] Pool full, no match - generating without saving for ${contentType}`);
    try {
      return await generateFn();
    } catch (err) {
      console.error(`[ContentPool] Generation error for ${contentType}:`, err);
      return null;
    }
  }

  const shouldGenerateFresh = Math.random() * 100 < FRESH_GENERATION_PERCENT;
  
  if (shouldGenerateFresh) {
    console.log(`[ContentPool] Rolling fresh generation for ${contentType} (${FRESH_GENERATION_PERCENT}% chance)`);
    try {
      const fresh = await generateFn();
      console.log(`[ContentPool] Fresh generation result for ${contentType}:`, fresh ? 'success' : 'null');
      if (fresh) {
        saveToPool(contentType, tags, fresh, title).catch(() => {});
      }
      return fresh;
    } catch (err) {
      console.error(`[ContentPool] Fresh generation error for ${contentType}:`, err);
      return null;
    }
  }

  console.log(`[ContentPool] Trying pool first for ${contentType}`);
  const pooled = await fetchFromPool<T>(contentType, tags);
  if (pooled) {
    console.log(`[ContentPool] Found in pool for ${contentType}:`, pooled.entryId);
    recordPoolUse(pooled.entryId).catch(() => {});
    return pooled.data;
  }

  console.log(`[ContentPool] Pool empty for ${contentType}, generating fresh`);
  try {
    const fresh = await generateFn();
    console.log(`[ContentPool] Fallback generation result for ${contentType}:`, fresh ? 'success' : 'null');
    if (fresh) {
      saveToPool(contentType, tags, fresh, title).catch(() => {});
    }
    return fresh;
  } catch (err) {
    console.error(`[ContentPool] Fallback generation error for ${contentType}:`, err);
    return null;
  }
}

export async function fetchOrGenerateImageUrl(
  contentType: string,
  tags: Record<string, string>,
  generateFn: () => Promise<string | null>,
  additionalData?: Partial<PooledPortrait>
): Promise<string | null> {
  console.log(`[ContentPool] fetchOrGenerateImageUrl called for ${contentType}`, tags);
  
  const result = await fetchOrGenerate<PooledPortrait>(
    contentType,
    tags,
    async () => {
      console.log(`[ContentPool] Calling generation function for ${contentType}`);
      const imageUrl = await generateFn();
      console.log(`[ContentPool] Generation function returned:`, imageUrl ? 'URL' : 'null');
      if (!imageUrl) return null;
      return { imageUrl, ...additionalData } as PooledPortrait;
    }
  );
  
  console.log(`[ContentPool] fetchOrGenerateImageUrl result for ${contentType}:`, result?.imageUrl ? 'has URL' : 'null');
  return result?.imageUrl || null;
}

export function getPoolStats(): { enabled: boolean; freshPercent: number } {
  return {
    enabled: isPoolEnabled(),
    freshPercent: FRESH_GENERATION_PERCENT,
  };
}
