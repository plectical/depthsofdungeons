import RundotGameAPI from '@series-inc/rundot-game-sdk/api';

const FRESH_GENERATION_PERCENT = 60;
const POOL_ENABLED = true;

// Track if pool is full to avoid repeated 429 errors
let _poolFull = false;
let _lastSaveAttempt = 0;
const SAVE_COOLDOWN_MS = 5000; // 5 seconds between save attempts

// Content types we manage
const CONTENT_TYPES = [
  'portrait_character',
  'portrait_enemy', 
  'portrait_mercenary',
  'room_event_art',
  'skillcheck_art',
];

// ============================================
// LOCAL CACHE (IndexedDB) - Auto-saves pool content
// ============================================

interface CachedEntry {
  id: string;
  contentType: string;
  tags: Record<string, string>;
  data: unknown;
  cachedAt: number;
}

const DB_NAME = 'ContentPoolCache';
const DB_VERSION = 1;
const STORE_NAME = 'entries';

let _db: IDBDatabase | null = null;
let _dbInitPromise: Promise<IDBDatabase | null> | null = null;
let _localCacheLoaded = false;
let _localCache: CachedEntry[] = [];

async function initDB(): Promise<IDBDatabase | null> {
  if (_db) return _db;
  if (_dbInitPromise) return _dbInitPromise;
  
  _dbInitPromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => {
        console.warn('[ContentPool] IndexedDB not available, using memory cache');
        resolve(null);
      };
      
      request.onsuccess = () => {
        _db = request.result;
        console.log('[ContentPool] IndexedDB cache initialized');
        resolve(_db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('contentType', 'contentType', { unique: false });
        }
      };
    } catch {
      console.warn('[ContentPool] IndexedDB error, using memory cache');
      resolve(null);
    }
  });
  
  return _dbInitPromise;
}

async function loadLocalCache(): Promise<void> {
  if (_localCacheLoaded) return;
  _localCacheLoaded = true;
  
  const db = await initDB();
  if (!db) return;
  
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => {
        _localCache = request.result || [];
        console.log(`[ContentPool] Loaded ${_localCache.length} entries from local cache`);
        resolve();
      };
      
      request.onerror = () => {
        console.warn('[ContentPool] Failed to load local cache');
        resolve();
      };
    } catch {
      resolve();
    }
  });
}

async function saveToLocalCache(entry: CachedEntry): Promise<void> {
  // Always save to memory cache
  const existingIdx = _localCache.findIndex(e => e.id === entry.id);
  if (existingIdx >= 0) {
    _localCache[existingIdx] = entry;
  } else {
    _localCache.push(entry);
  }
  
  // Try to persist to IndexedDB
  const db = await initDB();
  if (!db) return;
  
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

function findInLocalCache<T>(contentType: string, tags: Record<string, string>): T | null {
  const typeEntries = _localCache.filter(e => e.contentType === contentType);
  if (typeEntries.length === 0) return null;
  
  // Find entries that match tags (flexible matching)
  const matches = typeEntries.filter(entry => {
    return Object.entries(tags).every(([k, v]) => {
      const entryTag = entry.tags[k];
      return entryTag === v || !entryTag; // Match if same or tag not present
    });
  });
  
  if (matches.length === 0) return null;
  
  const selected = matches[Math.floor(Math.random() * matches.length)];
  if (!selected) return null;
  
  console.log('[ContentPool] Found in local cache:', selected.id);
  return selected.data as T;
}

// ============================================
// AUTO-EXPORT: When pool is full, download everything to local cache
// ============================================

let _autoExportInProgress = false;
let _autoExportComplete = false;

async function autoExportPoolToCache(): Promise<void> {
  if (_autoExportInProgress || _autoExportComplete) return;
  _autoExportInProgress = true;
  
  console.log('[ContentPool] AUTO-EXPORT: Pool is full, downloading all entries to local cache...');
  
  try {
    let totalCached = 0;
    
    for (const contentType of CONTENT_TYPES) {
      try {
        const response = await (RundotGameAPI as any).ugc.browse({
          contentType,
          sortBy: 'mostUsed',
          limit: 100,
        });
        
        if (response?.entries?.length) {
          for (const entry of response.entries) {
            const cachedEntry: CachedEntry = {
              id: entry.id,
              contentType,
              tags: parseTags(entry.tags || []),
              data: entry.data,
              cachedAt: Date.now(),
            };
            await saveToLocalCache(cachedEntry);
            totalCached++;
          }
        }
        
        // Small delay between content types to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.warn(`[ContentPool] Failed to export ${contentType}:`, err);
      }
    }
    
    _autoExportComplete = true;
    console.log(`[ContentPool] AUTO-EXPORT COMPLETE: ${totalCached} entries cached locally`);
    console.log('[ContentPool] Future requests will use local cache - no more API errors!');
  } catch (err) {
    console.error('[ContentPool] Auto-export failed:', err);
  } finally {
    _autoExportInProgress = false;
  }
}

function parseTags(tagArray: string[]): Record<string, string> {
  const tags: Record<string, string> = {};
  for (const tag of tagArray) {
    const [key, value] = tag.split(':');
    if (key && value) {
      tags[key] = value;
    }
  }
  return tags;
}

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
      console.warn('[ContentPool] Pool is full (100 entries max) - auto-exporting to local cache...');
      _poolFull = true;
      // Trigger auto-export in background
      autoExportPoolToCache().catch(() => {});
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
  
  // Always load local cache first
  await loadLocalCache();
  
  // Check local cache first (auto-exported content)
  const cachedResult = findInLocalCache<T>(contentType, tags);
  if (cachedResult) {
    console.log(`[ContentPool] Using locally cached content for ${contentType}`);
    return cachedResult;
  }
  
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

  // If pool is full, trigger auto-export in background and use local cache
  if (_poolFull) {
    // Start auto-export in background (downloads all pool content to local cache)
    autoExportPoolToCache().catch(() => {});
    
    console.log(`[ContentPool] Pool is full - trying pool first for ${contentType}`);
    const pooled = await fetchFromPool<T>(contentType, tags);
    if (pooled) {
      console.log(`[ContentPool] Found in pool for ${contentType}:`, pooled.entryId);
      // Cache this entry locally for future use
      saveToLocalCache({
        id: pooled.entryId,
        contentType,
        tags,
        data: pooled.data,
        cachedAt: Date.now(),
      });
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

export function getPoolStats(): { 
  enabled: boolean; 
  freshPercent: number; 
  poolFull: boolean; 
  localCacheCount: number;
  autoExportComplete: boolean;
} {
  return {
    enabled: isPoolEnabled(),
    freshPercent: FRESH_GENERATION_PERCENT,
    poolFull: _poolFull,
    localCacheCount: _localCache.length,
    autoExportComplete: _autoExportComplete,
  };
}

// Content types to export
const EXPORT_CONTENT_TYPES = [
  'portrait_character',
  'portrait_enemy', 
  'portrait_mercenary',
  'room_event_art',
  'skillcheck_art',
];

// Export all UGC entries for baking into static assets
export async function exportPoolEntries(): Promise<{
  entries: Record<string, unknown[]>;
  totalCount: number;
  error?: string;
}> {
  if (!isPoolEnabled()) {
    return { entries: {}, totalCount: 0, error: 'Pool not enabled' };
  }

  const allEntries: Record<string, unknown[]> = {};
  let totalCount = 0;

  for (const contentType of EXPORT_CONTENT_TYPES) {
    try {
      console.log(`[ContentPool] Exporting ${contentType}...`);
      
      const response = await (RundotGameAPI as any).ugc.browse({
        contentType,
        sortBy: 'mostUsed',
        limit: 100, // Get all entries
      });

      if (response?.entries?.length) {
        allEntries[contentType] = response.entries.map((e: { id: string; data: unknown; tags?: string[] }) => ({
          id: e.id,
          data: e.data,
          tags: e.tags || [],
        }));
        totalCount += response.entries.length;
        console.log(`[ContentPool] Found ${response.entries.length} entries for ${contentType}`);
      } else {
        allEntries[contentType] = [];
      }
    } catch (err) {
      console.error(`[ContentPool] Failed to export ${contentType}:`, err);
      allEntries[contentType] = [];
    }
  }

  console.log(`[ContentPool] Export complete: ${totalCount} total entries`);
  return { entries: allEntries, totalCount };
}

// Delete an entry from UGC pool (to free up space after baking)
export async function deletePoolEntry(entryId: string): Promise<boolean> {
  if (!isPoolEnabled()) return false;

  try {
    await (RundotGameAPI as any).ugc.delete(entryId);
    console.log(`[ContentPool] Deleted entry: ${entryId}`);
    return true;
  } catch (err) {
    console.error(`[ContentPool] Failed to delete entry ${entryId}:`, err);
    return false;
  }
}

// Clear all entries from UGC pool (use after baking to static assets)
export async function clearPool(): Promise<{ deleted: number; failed: number }> {
  const exportData = await exportPoolEntries();
  let deleted = 0;
  let failed = 0;

  for (const entries of Object.values(exportData.entries)) {
    for (const entry of entries as { id: string }[]) {
      const success = await deletePoolEntry(entry.id);
      if (success) deleted++;
      else failed++;
      
      // Rate limit deletions
      await new Promise(r => setTimeout(r, 200));
    }
  }

  // Reset pool full flag after clearing
  if (deleted > 0) {
    _poolFull = false;
  }

  console.log(`[ContentPool] Cleared pool: ${deleted} deleted, ${failed} failed`);
  return { deleted, failed };
}
