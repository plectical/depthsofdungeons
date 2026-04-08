import type {
  RunContentCache,
  BloodlineData,
  PlayerClass,
  FloorContentBatch,
} from '../types';
import {
  createEmptyCache,
  markBatchGenerating,
  updateBatchContent,
  markBatchReady,
  getCacheKeyForFloor,
  getFloorRangeForKey,
  isInitialContentReady,
} from './contentCache';
import {
  generateFloorBatch,
  isAIAvailable,
  generateCharacterPortrait,
  generateStoryBeat,
  generateMercenary,
  generateMercenaryPortrait,
  generateCharacterQuest,
  type FloorBatchResult,
} from './seriesAI';
import { getFallbackBatch } from './fallbackContent';

// Generation priority levels
type Priority = 'immediate' | 'background' | 'low';

// Generation wave configuration
interface GenerationWave {
  key: 'floors1to3' | 'floors4to6' | 'floors7to10' | 'floors11plus';
  priority: Priority;
  generateCharacter: boolean;
  encounterCount: number;
  itemCount: number;
}

const GENERATION_WAVES: GenerationWave[] = [
  {
    key: 'floors1to3',
    priority: 'immediate',
    generateCharacter: true,
    encounterCount: 1, // Reduced from 2 for faster startup
    itemCount: 1, // Reduced from 3 for faster startup
  },
  {
    key: 'floors4to6',
    priority: 'background',
    generateCharacter: false,
    encounterCount: 3,
    itemCount: 4,
  },
  {
    key: 'floors7to10',
    priority: 'low',
    generateCharacter: true,
    encounterCount: 4,
    itemCount: 5,
  },
  {
    key: 'floors11plus',
    priority: 'low',
    generateCharacter: true,
    encounterCount: 4,
    itemCount: 5,
  },
];

// Progress callback type
export type ProgressCallback = (progress: number, message: string) => void;

// Generation state
interface GenerationState {
  cache: RunContentCache;
  isGenerating: boolean;
  currentWave: number;
  errors: string[];
  useAI: boolean;
}

let generationState: GenerationState = {
  cache: createEmptyCache(),
  isGenerating: false,
  currentWave: 0,
  errors: [],
  useAI: true,
};

// Background generation promises
const backgroundPromises: Map<string, Promise<void>> = new Map();

// Get the current cache
export function getContentCache(): RunContentCache {
  return generationState.cache;
}

// Check if generation is in progress
export function isGenerating(): boolean {
  return generationState.isGenerating;
}

// Generate a single wave
async function generateWave(
  wave: GenerationWave,
  playerClass: PlayerClass,
  bloodline: BloodlineData,
  onProgress?: ProgressCallback
): Promise<FloorContentBatch> {
  const floorRange = getFloorRangeForKey(wave.key);
  
  // Mark as generating
  generationState.cache = markBatchGenerating(generationState.cache, wave.key);
  
  // Load fallback content - but skip characters if AI is enabled (to avoid Elder Mira duplicates)
  onProgress?.(25, `Loading story content for floors ${floorRange[0]}-${floorRange[1]}...`);
  const fallback = getFallbackBatch(floorRange);
  
  console.log('[Story] Loading fallback content for', wave.key, 'storyBeats:', fallback.storyBeats);
  // When AI is enabled, only load storyBeats/encounters/items from fallback, NOT characters
  // This prevents Elder Mira and other fallback characters from appearing in AI mode
  generationState.cache = updateBatchContent(generationState.cache, wave.key, {
    characters: generationState.useAI ? [] : fallback.characters, // Skip fallback chars when AI enabled
    encounters: fallback.encounters,
    items: fallback.items,
    storyBeats: fallback.storyBeats,
  });
  
  // Try AI generation to enhance/replace characters, encounters, items (not storyBeats)
  if (generationState.useAI) {
    try {
      onProgress?.(50, `Generating content for floors ${floorRange[0]}-${floorRange[1]}...`);
      
      const result: FloorBatchResult = await generateFloorBatch({
        floorRange,
        playerClass,
        bloodline,
        generateCharacter: wave.generateCharacter,
        encounterCount: wave.encounterCount,
        itemCount: wave.itemCount,
      });
      
      // Track errors
      if (result.errors.length > 0) {
        console.error('[Story] ★★★ Generation had errors:', result.errors);
        generationState.errors.push(...result.errors);
      }
      
      // Only update cache with AI content if we got meaningful results
      const hasAIContent = result.character || result.encounters.length > 0 || result.items.length > 0;
      if (hasAIContent) {
        console.log('[Story] AI generated content:', { 
          character: result.character?.name, 
          encounters: result.encounters.length, 
          items: result.items.length 
        });
        
        // For the FIRST wave, REPLACE fallback with AI content for a fully generative experience
        // AI character becomes the main character, not merged with fallbacks
        if (wave.key === 'floors1to3' && result.character) {
          console.log('[Story] ★ FIRST WAVE: Replacing fallback with AI character:', result.character.name);
          console.log('[Story] Character details:', JSON.stringify({
            id: result.character.id,
            name: result.character.name,
            introDialogue: result.character.introDialogue?.substring(0, 50),
          }));
          
          // Generate a story beat for the AI character
          onProgress?.(60, `Creating dialogue for ${result.character.name}...`);
          let storyBeat: import('../types').NarrativeBeat | null = null;
          
          try {
            console.log('[Story] Calling generateStoryBeat...');
            storyBeat = await generateStoryBeat(result.character);
            console.log('[Story] generateStoryBeat returned:', storyBeat ? 'VALID BEAT' : 'NULL');
            if (storyBeat) {
              console.log('[Story] ✓ AI story beat generated:', storyBeat.id);
            }
          } catch (beatErr) {
            console.error('[Story] ✗ Story beat generation threw error:', beatErr);
          }
          
          // If AI story beat failed, create a simple fallback beat for the AI character
          if (!storyBeat) {
            console.log('[Story] Creating manual fallback story beat for:', result.character.name);
            storyBeat = {
              id: `beat_${result.character.id}_intro`,
              characterId: result.character.id,
              beatType: 'intro',
              trigger: { type: 'floor', floorRange: [1, 3] },
              dialogue: {
                rootNodeId: 'intro',
                nodes: {
                  intro: {
                    id: 'intro',
                    speaker: 'character',
                    characterId: result.character.id,
                    text: result.character.introDialogue || `${result.character.name} regards you with interest.`,
                    choices: [
                      { id: 'greet', label: 'Greet them', responseText: 'You nod in greeting.', effects: [], successNodeId: 'response' },
                      { id: 'cautious', label: 'Stay cautious', responseText: 'You keep your distance.', effects: [], relationshipChange: -5, successNodeId: 'response' },
                    ],
                  },
                  response: {
                    id: 'response',
                    speaker: 'narrator',
                    text: `${result.character.name} acknowledges you before fading back into the shadows.`,
                  },
                },
              },
              effects: [],
            };
          }
          
          // ALWAYS use the AI character, never fall back to Elder Mira
          // Update cache IMMEDIATELY with character + story beat (before portrait)
          console.log('[Story] ★★★ Updating cache IMMEDIATELY with:', {
            character: result.character.name,
            beatId: storyBeat.id,
            beatCharacterId: storyBeat.characterId,
          });
          generationState.cache = updateBatchContent(generationState.cache, wave.key, {
            characters: [result.character],
            storyBeats: [storyBeat],
            encounters: result.encounters.length > 0 ? result.encounters : undefined,
            items: result.items.length > 0 ? result.items : undefined,
          });
          // Verify cache was updated
          const updatedBatch = generationState.cache[wave.key];
          console.log('[Story] ✓✓✓ Cache VERIFIED (game can start now):', {
            characters: updatedBatch?.characters?.map(c => c.name),
            storyBeats: updatedBatch?.storyBeats?.map(b => ({ id: b.id, charId: b.characterId })),
          });
          
          // ══════════════════════════════════════════════════════════
          // PARALLEL GENERATION: Portrait + Quest run simultaneously
          // ══════════════════════════════════════════════════════════
          onProgress?.(85, `Generating portrait and quest...`);
          const characterRef = result.character; // Capture for parallel tasks
          
          const parallelTasks = await Promise.allSettled([
            // Task 1: Generate portrait
            (async () => {
              console.log('[Story] [PARALLEL] Starting portrait generation...');
              const portraitUrl = await generateCharacterPortrait(characterRef);
              if (portraitUrl) {
                characterRef.portraitUrl = portraitUrl;
                generationState.cache = updateBatchContent(generationState.cache, wave.key, {
                  characters: [characterRef],
                });
                console.log('[Story] [PARALLEL] ✓ Portrait complete');
              }
              return portraitUrl;
            })(),
            
            // Task 2: Generate quest
            (async () => {
              console.log('[Story] [PARALLEL] Starting quest generation...');
              const charQuest = await generateCharacterQuest({
                id: characterRef.id,
                name: characterRef.name,
                title: characterRef.title,
                role: characterRef.role,
                motivation: characterRef.motivation,
                portraitUrl: characterRef.portraitUrl,
              });
              if (charQuest) {
                generationState.cache = updateBatchContent(generationState.cache, wave.key, {
                  characterQuests: [charQuest],
                });
                console.log('[Story] [PARALLEL] ✓ Quest complete:', charQuest.name);
              }
              return charQuest;
            })(),
          ]);
          
          // Log results
          const [portraitResult, questResult] = parallelTasks;
          console.log('[Story] Parallel generation complete:', {
            portrait: portraitResult.status === 'fulfilled' ? '✓' : '✗',
            quest: questResult.status === 'fulfilled' ? '✓' : '✗',
          });
        } else if (wave.key !== 'floors1to3') {
          // For later waves, merge AI characters with existing
          const currentBatch = generationState.cache[wave.key];
          const existingCharacters = currentBatch?.characters ?? [];
          const mergedCharacters = result.character 
            ? [...existingCharacters, result.character] 
            : undefined;
          
          generationState.cache = updateBatchContent(generationState.cache, wave.key, {
            characters: mergedCharacters,
            encounters: result.encounters.length > 0 ? result.encounters : undefined,
            items: result.items.length > 0 ? result.items : undefined,
          });
        }
      } else {
        console.warn('[Story] ★★★ AI returned NO content - USING FALLBACK (Elder Mira)');
        console.warn('[Story] Result details:', {
          character: result.character,
          encounters: result.encounters.length,
          items: result.items.length,
          errors: result.errors
        });
      }
      
      // Generate portraits for ALL characters that don't have them
      onProgress?.(75, `Generating character portraits...`);
      const batchForPortraits = generationState.cache[wave.key];
      console.log('[Story] Characters needing portraits:', batchForPortraits?.characters?.map(c => c.name));
      
      if (batchForPortraits?.characters && batchForPortraits.characters.length > 0) {
        const updatedCharacters = [...batchForPortraits.characters];
        let hasUpdates = false;
        
        for (let i = 0; i < updatedCharacters.length; i++) {
          const char = updatedCharacters[i]!;
          if (!char.portraitUrl && char.appearanceDescription) {
            try {
              onProgress?.(75 + (i * 5), `Generating portrait for ${char.name}...`);
              console.log('[Story] Generating portrait for character:', char.name, '- appearance:', char.appearanceDescription.substring(0, 50));
              const portrait = await generateCharacterPortrait(char);
              if (portrait) {
                updatedCharacters[i] = { ...char, portraitUrl: portrait };
                hasUpdates = true;
                console.log('[Story] ✓ Portrait COMPLETE for:', char.name);
              } else {
                console.warn('[Story] ✗ Portrait returned null for:', char.name);
              }
            } catch (portraitErr) {
              console.warn('[Story] ✗ Portrait generation failed for', char.name, ':', portraitErr);
            }
          } else if (char.portraitUrl) {
            console.log('[Story] Character already has portrait:', char.name);
          }
        }
        
        // Update cache with characters that have portraits
        if (hasUpdates) {
          generationState.cache = updateBatchContent(generationState.cache, wave.key, {
            characters: updatedCharacters,
          });
          console.log('[Story] ✓ Cache updated with', updatedCharacters.filter(c => c.portraitUrl).length, 'portraits');
        }
      }
      
      // Generate 1 mercenary (reduced from 2 for faster startup)
      // Portrait generation happens in background after game starts
      onProgress?.(92, `Generating mercenary...`);
      try {
        console.log('[Story] Generating mercenary...');
        const merc = await generateMercenary({
          floorNumber: floorRange[0],
          existingMercNames: [],
          playerClass,
        });
        
        if (merc) {
          // Add to cache immediately (portrait will be added in background)
          generationState.cache = updateBatchContent(generationState.cache, wave.key, {
            mercenaries: [merc],
          });
          console.log('[Story] ✓ Mercenary cached:', merc.name);
          
          // Generate portrait in background (non-blocking)
          generateMercenaryPortrait(merc).then(portrait => {
            if (portrait) {
              merc.portraitUrl = portrait;
              generationState.cache = updateBatchContent(generationState.cache, wave.key, {
                mercenaries: [merc],
              });
              console.log('[Story] ✓ Mercenary portrait added:', merc.name);
            }
          }).catch(() => {});
        }
      } catch (mercErr) {
        console.warn('[Story] Mercenary generation failed:', mercErr);
      }
      
      onProgress?.(95, `Content ready!`);
    } catch (e) {
      console.warn(`AI generation failed for ${wave.key}, using fallback:`, e);
      generationState.errors.push(`AI generation failed: ${e}`);
    }
  }
  
  // Mark as ready
  generationState.cache = markBatchReady(generationState.cache, wave.key);
  console.log('[Story] Cache after loading:', generationState.cache);
  
  return generationState.cache[wave.key]!;
}

// Start generation when player enters the dungeon
export async function startGeneration(
  playerClass: PlayerClass,
  bloodline: BloodlineData,
  onProgress?: ProgressCallback
): Promise<boolean> {
  if (generationState.isGenerating) {
    console.warn('Generation already in progress');
    return false;
  }
  
  let aiAvailable = false;
  try {
    // User should already be logged in from Game.tsx login prompt
    // Just check if AI is available
    console.log('[Story] Checking AI availability...');
    aiAvailable = await isAIAvailable();
    
    // Retry AI check once if it failed
    if (!aiAvailable) {
      console.log('[Story] AI not available on first check, retrying in 500ms...');
      await new Promise(resolve => setTimeout(resolve, 500));
      aiAvailable = await isAIAvailable();
    }
    
    console.log('[Story] AI available:', aiAvailable);
  } catch (aiCheckError) {
    console.warn('[Story] AI availability check threw error:', aiCheckError);
    aiAvailable = false;
  }
  
  generationState = {
    cache: createEmptyCache(),
    isGenerating: true,
    currentWave: 0,
    errors: [],
    useAI: aiAvailable,
  };
  
  if (!generationState.useAI) {
    console.log('AI not available, will use fallback content');
  } else {
    console.log('AI available! Will generate unique content');
  }
  
  try {
    // WAVE 1: Immediate - floors 1-3 (blocks until ready)
    const wave1 = GENERATION_WAVES[0];
    if (!wave1) {
      console.warn('No generation waves defined, using fallback');
      const fallback = getFallbackBatch([1, 3]);
      generationState.cache = updateBatchContent(generationState.cache, 'floors1to3', fallback);
      generationState.cache = markBatchReady(generationState.cache, 'floors1to3');
      onProgress?.(100, 'Ready!');
      return true;
    }
    onProgress?.(10, 'Generating your unique story...');
    
    try {
      await generateWave(wave1, playerClass, bloodline, onProgress);
      generationState.currentWave = 1;
    } catch (waveError) {
      console.error('Wave generation threw error:', waveError);
      // Load fallback content if wave generation fails
      const fallback = getFallbackBatch([1, 3]);
      generationState.cache = updateBatchContent(generationState.cache, 'floors1to3', fallback);
      generationState.cache = markBatchReady(generationState.cache, 'floors1to3');
    }
    
    onProgress?.(100, 'Ready!');
    
    // WAVE 2-4: Background generation (fire and forget)
    try {
      startBackgroundGeneration(playerClass, bloodline);
    } catch (bgError) {
      console.warn('Background generation failed to start:', bgError);
    }
    
    return true;
  } catch (e) {
    console.error('Initial generation failed:', e);
    generationState.errors.push(`Initial generation failed: ${e}`);
    
    // Still try to use fallback
    try {
      const fallback = getFallbackBatch([1, 3]);
      generationState.cache = updateBatchContent(generationState.cache, 'floors1to3', fallback);
      generationState.cache = markBatchReady(generationState.cache, 'floors1to3');
    } catch (fallbackError) {
      console.error('Even fallback failed:', fallbackError);
    }
    
    return true; // Still return true so game can start with fallback
  } finally {
    generationState.isGenerating = false;
  }
}

function startBackgroundGeneration(
  playerClass: PlayerClass,
  bloodline: BloodlineData
): void {
  for (let i = 1; i < GENERATION_WAVES.length; i++) {
    const wave = GENERATION_WAVES[i];
    if (!wave) continue;
    
    const waveIndex = i;
    const waveRef = wave;
    
    const promise = new Promise<void>((resolve) => {
      setTimeout(async () => {
        try {
          await generateWave(waveRef, playerClass, bloodline);
          generationState.currentWave = waveIndex + 1;
        } catch (e) {
          console.warn(`Background generation failed for ${waveRef.key}:`, e);
          const floorRange = getFloorRangeForKey(waveRef.key);
          const fallback = getFallbackBatch(floorRange);
          generationState.cache = updateBatchContent(generationState.cache, waveRef.key, fallback);
          generationState.cache = markBatchReady(generationState.cache, waveRef.key);
        }
        resolve();
      }, waveIndex * 500);
    });
    
    backgroundPromises.set(waveRef.key, promise);
  }
}

// Wait for content to be ready for a specific floor
export async function waitForFloorContent(floorNumber: number): Promise<FloorContentBatch | null> {
  const key = getCacheKeyForFloor(floorNumber);
  
  // Already ready?
  if (generationState.cache[key]?.isReady) {
    return generationState.cache[key];
  }
  
  // Wait for background generation
  const promise = backgroundPromises.get(key);
  if (promise) {
    await promise;
    return generationState.cache[key];
  }
  
  // Not queued yet, return null (will use fallback)
  return null;
}

export function checkFloorTrigger(floorNumber: number): void {
  if (floorNumber >= 8 && !generationState.cache.floors11plus?.isReady) {
    const wave = GENERATION_WAVES[3];
    if (wave && !backgroundPromises.has(wave.key)) {
      console.log('Triggering late-game content generation');
    }
  }
}

// Get generation errors
export function getGenerationErrors(): string[] {
  return [...generationState.errors];
}

// Clear generation errors
export function clearGenerationErrors(): void {
  generationState.errors = [];
}

// Reset generation state (for new run)
export function resetGeneration(): void {
  generationState = {
    cache: createEmptyCache(),
    isGenerating: false,
    currentWave: 0,
    errors: [],
    useAI: true,
  };
  backgroundPromises.clear();
}

// Get current generation wave
export function getCurrentWave(): number {
  return generationState.currentWave;
}

// Check if initial content is ready
export function isReadyToPlay(): boolean {
  return isInitialContentReady(generationState.cache);
}
