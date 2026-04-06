import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import type { FactionId } from './types';

// ══════════════════════════════════════════════════════════════
// BATCH PORTRAIT GENERATOR
// Generates portraits for enemy types using the Series SDK
// Run this in-game via a debug panel to pre-generate portraits
// ══════════════════════════════════════════════════════════════

interface EnemyPortraitConfig {
  name: string;
  factionId?: FactionId;
  prompt: string;
  variations: number;
}

// Enemy types to generate portraits for
const ENEMY_PORTRAIT_CONFIGS: EnemyPortraitConfig[] = [
  // Goblins
  {
    name: 'Goblin',
    factionId: 'goblin',
    prompt: 'A cunning goblin creature with green skin, pointed ears, and sharp teeth. Wearing ragged armor. Dark fantasy dungeon setting. Atmospheric lighting. Portrait style.',
    variations: 3,
  },
  {
    name: 'Goblin Warrior',
    factionId: 'goblin',
    prompt: 'A battle-scarred goblin warrior with green skin, tribal war paint, and a menacing expression. Holding a crude weapon. Dark fantasy portrait.',
    variations: 2,
  },
  {
    name: 'Goblin Shaman',
    factionId: 'goblin',
    prompt: 'An ancient goblin shaman with glowing eyes, mystical tattoos, and bone decorations. Emanating green magical energy. Dark fantasy portrait.',
    variations: 2,
  },
  {
    name: 'Goblin King',
    factionId: 'goblin',
    prompt: 'A massive, regal goblin king sitting on a throne of bones. Wearing a crown of ten hearts. Ancient, powerful, cunning. Dark fantasy portrait.',
    variations: 2,
  },
  
  // Undead
  {
    name: 'Skeleton',
    factionId: 'undead',
    prompt: 'A skeletal warrior with glowing purple eye sockets, wearing rusted armor. Holding a sword. Dark dungeon atmosphere. Portrait style.',
    variations: 3,
  },
  {
    name: 'Zombie',
    factionId: 'undead',
    prompt: 'A decaying zombie with rotting flesh and hollow eyes. Reaching forward with grasping hands. Dark horror atmosphere. Portrait.',
    variations: 2,
  },
  {
    name: 'Ghost',
    factionId: 'undead',
    prompt: 'A translucent ghostly figure with a sorrowful expression. Ethereal, glowing with pale blue light. Dark fantasy portrait.',
    variations: 2,
  },
  {
    name: 'Wraith',
    factionId: 'undead',
    prompt: 'A terrifying wraith with a hooded, shadowy form and burning red eyes. Dark tendrils of energy. Horror fantasy portrait.',
    variations: 2,
  },
  {
    name: 'Vampire',
    factionId: 'undead',
    prompt: 'An elegant vampire lord with pale skin, red eyes, and blood-stained lips. Noble but monstrous. Gothic fantasy portrait.',
    variations: 2,
  },
  
  // Demons
  {
    name: 'Imp',
    factionId: 'demon',
    prompt: 'A small red imp demon with bat wings, horns, and a mischievous grin. Fire emanating from its hands. Hellish atmosphere. Portrait.',
    variations: 2,
  },
  {
    name: 'Demon',
    factionId: 'demon',
    prompt: 'A powerful demon with red skin, massive horns, and flames for eyes. Muscular and terrifying. Hellfire background. Dark fantasy portrait.',
    variations: 3,
  },
  {
    name: 'Hellspawn',
    factionId: 'demon',
    prompt: 'A nightmarish hellspawn creature covered in flames and shadow. Multiple eyes. Reality warping around it. Horror fantasy portrait.',
    variations: 2,
  },
  
  // Beasts
  {
    name: 'Giant Rat',
    factionId: 'beast',
    prompt: 'A massive dungeon rat with glowing red eyes and matted fur. Sharp teeth bared. Dark dungeon setting. Portrait.',
    variations: 2,
  },
  {
    name: 'Giant Spider',
    factionId: 'beast',
    prompt: 'A terrifying giant spider with multiple eyes and dripping fangs. Web-covered background. Horror fantasy portrait.',
    variations: 2,
  },
  {
    name: 'Wolf',
    factionId: 'beast',
    prompt: 'A savage dungeon wolf with glowing eyes and bared fangs. Battle-scarred. Dark forest background. Portrait.',
    variations: 2,
  },
  {
    name: 'Werebeast',
    factionId: 'beast',
    prompt: 'A half-human half-beast lycanthrope mid-transformation. Fur, claws, fangs. Full moon in background. Dark fantasy portrait.',
    variations: 2,
  },
  
  // Elementals
  {
    name: 'Fire Elemental',
    factionId: 'elemental',
    prompt: 'A living being of pure flame with a vaguely humanoid form. Intense heat and light. Fantasy portrait.',
    variations: 2,
  },
  {
    name: 'Stone Golem',
    factionId: 'elemental',
    prompt: 'A massive stone golem with glowing runes carved into its body. Ancient and powerful. Dark dungeon. Portrait.',
    variations: 2,
  },
];

// Art style reference for consistency
const ART_STYLE_SUFFIX = ' Dark fantasy art style, painterly, moody lighting, game portrait.';

export interface GeneratedPortrait {
  enemyName: string;
  factionId?: FactionId;
  imageUrl: string;
  prompt: string;
  generatedAt: number;
}

export interface BatchGenerationProgress {
  total: number;
  completed: number;
  current: string;
  results: GeneratedPortrait[];
  errors: string[];
}

// Generate a single portrait
export async function generateEnemyPortrait(config: EnemyPortraitConfig): Promise<GeneratedPortrait | null> {
  try {
    const fullPrompt = config.prompt + ART_STYLE_SUFFIX;
    
    console.log(`[BatchPortrait] Generating portrait for: ${config.name}`);
    
    const result = await RundotGameAPI.imageGen.generate({
      prompt: fullPrompt,
      model: 'gemini-3.1-flash-image-preview',
      aspectRatio: '1:1',
    });
    
    if (result && result.imageUrl) {
      return {
        enemyName: config.name,
        factionId: config.factionId,
        imageUrl: result.imageUrl,
        prompt: fullPrompt,
        generatedAt: Date.now(),
      };
    }
    
    return null;
  } catch (error) {
    console.error(`[BatchPortrait] Error generating ${config.name}:`, error);
    return null;
  }
}

// Generate all portraits (call from debug panel)
export async function generateAllPortraits(
  onProgress?: (progress: BatchGenerationProgress) => void
): Promise<BatchGenerationProgress> {
  const progress: BatchGenerationProgress = {
    total: ENEMY_PORTRAIT_CONFIGS.reduce((sum, c) => sum + c.variations, 0),
    completed: 0,
    current: '',
    results: [],
    errors: [],
  };
  
  for (const config of ENEMY_PORTRAIT_CONFIGS) {
    for (let i = 0; i < config.variations; i++) {
      progress.current = `${config.name} (${i + 1}/${config.variations})`;
      onProgress?.(progress);
      
      const result = await generateEnemyPortrait(config);
      
      if (result) {
        progress.results.push(result);
      } else {
        progress.errors.push(`Failed to generate ${config.name}`);
      }
      
      progress.completed++;
      onProgress?.(progress);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return progress;
}

// Generate portraits for a specific faction only
export async function generateFactionPortraits(
  factionId: FactionId,
  onProgress?: (progress: BatchGenerationProgress) => void
): Promise<BatchGenerationProgress> {
  const factionConfigs = ENEMY_PORTRAIT_CONFIGS.filter(c => c.factionId === factionId);
  
  const progress: BatchGenerationProgress = {
    total: factionConfigs.reduce((sum, c) => sum + c.variations, 0),
    completed: 0,
    current: '',
    results: [],
    errors: [],
  };
  
  for (const config of factionConfigs) {
    for (let i = 0; i < config.variations; i++) {
      progress.current = `${config.name} (${i + 1}/${config.variations})`;
      onProgress?.(progress);
      
      const result = await generateEnemyPortrait(config);
      
      if (result) {
        progress.results.push(result);
      } else {
        progress.errors.push(`Failed to generate ${config.name}`);
      }
      
      progress.completed++;
      onProgress?.(progress);
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return progress;
}

// Save generated portraits to local storage for reuse
export function savePortraitsToStorage(portraits: GeneratedPortrait[]): void {
  const existing = loadPortraitsFromStorage();
  const merged = [...existing, ...portraits];
  
  // Deduplicate by enemy name, keeping latest
  const unique = new Map<string, GeneratedPortrait>();
  for (const portrait of merged) {
    unique.set(portrait.enemyName, portrait);
  }
  
  try {
    localStorage.setItem('enemyPortraits', JSON.stringify(Array.from(unique.values())));
  } catch (e) {
    console.error('[BatchPortrait] Failed to save portraits:', e);
  }
}

// Load previously generated portraits
export function loadPortraitsFromStorage(): GeneratedPortrait[] {
  try {
    const data = localStorage.getItem('enemyPortraits');
    if (data) {
      return JSON.parse(data) as GeneratedPortrait[];
    }
  } catch (e) {
    console.error('[BatchPortrait] Failed to load portraits:', e);
  }
  return [];
}

// Get portrait URL for an enemy name
export function getEnemyPortraitUrl(enemyName: string): string | undefined {
  const portraits = loadPortraitsFromStorage();
  const portrait = portraits.find(p => 
    p.enemyName.toLowerCase() === enemyName.toLowerCase() ||
    enemyName.toLowerCase().includes(p.enemyName.toLowerCase())
  );
  return portrait?.imageUrl;
}

// Get faction-specific portrait
export function getFactionPortraitUrl(factionId: FactionId): string | undefined {
  const portraits = loadPortraitsFromStorage();
  const factionPortrait = portraits.find(p => p.factionId === factionId);
  return factionPortrait?.imageUrl;
}

// Debug: log all available portrait configs
export function logPortraitConfigs(): void {
  console.log('[BatchPortrait] Available enemy portrait configs:');
  for (const config of ENEMY_PORTRAIT_CONFIGS) {
    console.log(`  - ${config.name} (${config.factionId ?? 'no faction'}): ${config.variations} variations`);
  }
  console.log(`Total portraits to generate: ${ENEMY_PORTRAIT_CONFIGS.reduce((sum, c) => sum + c.variations, 0)}`);
}
