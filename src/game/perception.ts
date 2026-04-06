import type { GameState } from './types';
import { getPerceptionChanges, isFullyTransformed } from './afflictions';

// ══════════════════════════════════════════════════════════════
// PERCEPTION SYSTEM
// Modifies how the player perceives the dungeon based on afflictions
// ══════════════════════════════════════════════════════════════

export interface PerceptionState {
  colorShifts: Map<string, string>;
  descriptionReplacements: Map<string, string>;
  beautyInDarkness: number;
  seeHidden: number;
}

export function getPerceptionState(state: GameState): PerceptionState {
  const result: PerceptionState = {
    colorShifts: new Map(),
    descriptionReplacements: new Map(),
    beautyInDarkness: 0,
    seeHidden: 0,
  };
  
  const changes = getPerceptionChanges(state);
  
  for (const change of changes) {
    switch (change.type) {
      case 'color_shift':
        if (change.original && change.replacement) {
          result.colorShifts.set(change.original.toLowerCase(), change.replacement);
        }
        break;
      case 'description_replace':
        if (change.original && change.replacement) {
          result.descriptionReplacements.set(change.original.toLowerCase(), change.replacement);
        }
        break;
      case 'beauty_in_darkness':
        result.beautyInDarkness = Math.max(result.beautyInDarkness, change.intensity);
        break;
      case 'see_hidden':
        result.seeHidden = Math.max(result.seeHidden, change.intensity);
        break;
    }
  }
  
  return result;
}

export function applyColorShift(state: GameState, originalColor: string): string {
  const perception = getPerceptionState(state);
  const shifted = perception.colorShifts.get(originalColor.toLowerCase());
  
  if (shifted) {
    // Blend based on transformation progress
    return shifted;
  }
  
  return originalColor;
}

export function applyDescriptionReplacement(state: GameState, text: string): string {
  const perception = getPerceptionState(state);
  let result = text;
  
  for (const [original, replacement] of perception.descriptionReplacements) {
    // Case-insensitive replacement
    const regex = new RegExp(original, 'gi');
    result = result.replace(regex, (match) => {
      // Preserve case of first letter
      if (match[0] === match[0]?.toUpperCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }
      return replacement;
    });
  }
  
  return result;
}

export function shouldSeeHidden(state: GameState): boolean {
  const perception = getPerceptionState(state);
  return perception.seeHidden > 0 && Math.random() < perception.seeHidden;
}

export function getBeautyLevel(state: GameState): number {
  const perception = getPerceptionState(state);
  return perception.beautyInDarkness;
}

// Beauty in darkness flavor text for dungeon elements
const BEAUTY_DESCRIPTIONS: Record<string, string[]> = {
  wall: [
    'The stone glistens with an inner warmth.',
    'Ancient patterns emerge from the walls.',
    'The rock pulses with the heartbeat of the dungeon.',
  ],
  floor: [
    'The ground feels welcoming beneath your feet.',
    'Familiar paths wind through comfortable shadows.',
    'Home stretches out before you.',
  ],
  darkness: [
    'The darkness embraces you like a friend.',
    'Shadows dance with welcoming warmth.',
    'The void feels... peaceful.',
  ],
  corpse: [
    'The fallen rest in eternal peace.',
    'A vessel, empty but beautiful.',
    'They have returned to the dungeon.',
  ],
  blood: [
    'Life essence pools in beautiful patterns.',
    'The red gleams like precious rubies.',
    'Warmth lingers here.',
  ],
};

export function getBeautyDescription(state: GameState, element: string): string | undefined {
  const beautyLevel = getBeautyLevel(state);
  if (beautyLevel <= 0) return undefined;
  
  // Higher beauty level = higher chance of seeing beauty
  if (Math.random() > beautyLevel) return undefined;
  
  const descriptions = BEAUTY_DESCRIPTIONS[element.toLowerCase()];
  if (!descriptions || descriptions.length === 0) return undefined;
  
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

// Transformation-specific color palettes
export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  danger: string;
  friendly: string;
}

const DEFAULT_PALETTE: ColorPalette = {
  primary: '#ffffff',
  secondary: '#888888',
  accent: '#ffcc44',
  danger: '#ff4444',
  friendly: '#44ff44',
};

const GOBLIN_PALETTE: ColorPalette = {
  primary: '#44ff44',
  secondary: '#228822',
  accent: '#ffcc44',
  danger: '#ff8844',
  friendly: '#88ff88',
};

const VAMPIRE_PALETTE: ColorPalette = {
  primary: '#aa44ff',
  secondary: '#662288',
  accent: '#ff4444',
  danger: '#ffcc44',
  friendly: '#cc88ff',
};

const DEMON_PALETTE: ColorPalette = {
  primary: '#ff4444',
  secondary: '#882222',
  accent: '#ff8844',
  danger: '#44ff44',
  friendly: '#ff8888',
};

const BEAST_PALETTE: ColorPalette = {
  primary: '#cc8844',
  secondary: '#664422',
  accent: '#88aa44',
  danger: '#ff4444',
  friendly: '#aacc88',
};

export function getColorPalette(state: GameState): ColorPalette {
  if (!state.activeAffliction || state.activeAffliction.cured) {
    return DEFAULT_PALETTE;
  }
  
  // Only apply full palette when fully transformed
  if (!isFullyTransformed(state)) {
    return DEFAULT_PALETTE;
  }
  
  switch (state.activeAffliction.afflictionId) {
    case 'were_goblin':
      return GOBLIN_PALETTE;
    case 'vampiric':
      return VAMPIRE_PALETTE;
    case 'demonic_pact':
      return DEMON_PALETTE;
    case 'lycanthropy':
      return BEAST_PALETTE;
    default:
      return DEFAULT_PALETTE;
  }
}

export function getTransformedEntityColor(state: GameState, originalColor: string, entityName: string): string {
  // If player is transformed, change how they see certain creatures
  if (!state.activeAffliction || state.activeAffliction.cured) {
    return originalColor;
  }
  
  const nameLower = entityName.toLowerCase();
  const afflictionId = state.activeAffliction.afflictionId;
  
  // Make faction creatures appear friendlier
  if (afflictionId === 'were_goblin' && nameLower.includes('goblin')) {
    return '#88ff88'; // Friendly green
  }
  if (afflictionId === 'vampiric' && (nameLower.includes('skeleton') || nameLower.includes('zombie') || nameLower.includes('ghost'))) {
    return '#cc88ff'; // Friendly purple
  }
  if (afflictionId === 'demonic_pact' && (nameLower.includes('demon') || nameLower.includes('imp'))) {
    return '#ff8888'; // Friendly red
  }
  if (afflictionId === 'lycanthropy' && (nameLower.includes('wolf') || nameLower.includes('rat') || nameLower.includes('bat'))) {
    return '#aacc88'; // Friendly brown-green
  }
  
  return applyColorShift(state, originalColor);
}
