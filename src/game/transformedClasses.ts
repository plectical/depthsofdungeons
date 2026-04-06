import type { TransformedClassDef, PlayerClass, AfflictionAbility, PerceptionChange, GameState } from './types';
import { CLASS_DEFS } from './constants';
import { getAfflictionDef, isFullyTransformed } from './afflictions';

// ══════════════════════════════════════════════════════════════
// TRANSFORMED CLASS SYSTEM
// When fully transformed, player's class mutates
// ══════════════════════════════════════════════════════════════

// Affliction-specific abilities
const AFFLICTION_ABILITIES: Record<string, AfflictionAbility[]> = {
  were_goblin: [
    {
      id: 'goblin_tongue',
      name: 'Goblin Tongue',
      description: 'Speak the goblin language. Goblins understand you.',
      icon: '💬',
      color: '#44ff44',
      cooldown: 0,
      effect: 'speak_faction',
      factionId: 'goblin',
    },
    {
      id: 'goblin_cunning',
      name: 'Goblin Cunning',
      description: 'Sense nearby goblins and their intentions.',
      icon: '👁',
      color: '#88ff88',
      cooldown: 5,
      effect: 'sense_faction',
      factionId: 'goblin',
    },
    {
      id: 'pack_tactics',
      name: 'Pack Tactics',
      description: 'Deal +50% damage when a goblin ally is nearby.',
      icon: '⚔',
      color: '#44ff44',
      cooldown: 0,
      effect: 'command_faction',
      factionId: 'goblin',
    },
    {
      id: 'treasure_sense',
      name: 'Treasure Sense',
      description: 'Automatically detect treasure and gold on each floor.',
      icon: '💰',
      color: '#ffcc44',
      cooldown: 0,
      effect: 'sense_faction',
      factionId: 'goblin',
    },
  ],
  vampiric: [
    {
      id: 'drain_life',
      name: 'Drain Life',
      description: 'Heal for 50% of damage dealt to living creatures.',
      icon: '🩸',
      color: '#aa44ff',
      cooldown: 0,
      effect: 'faction_form',
      factionId: 'undead',
    },
    {
      id: 'night_vision',
      name: 'Night Vision',
      description: 'See perfectly in darkness.',
      icon: '🌙',
      color: '#aa88ff',
      cooldown: 0,
      effect: 'sense_faction',
      factionId: 'undead',
    },
    {
      id: 'mist_form',
      name: 'Mist Form',
      description: 'Become intangible, avoiding the next attack.',
      icon: '🌫',
      color: '#8866cc',
      cooldown: 10,
      effect: 'faction_form',
      factionId: 'undead',
    },
    {
      id: 'command_undead',
      name: 'Command Undead',
      description: 'Undead creatures may join you temporarily.',
      icon: '💀',
      color: '#aa44ff',
      cooldown: 15,
      effect: 'command_faction',
      factionId: 'undead',
    },
  ],
  demonic_pact: [
    {
      id: 'hellfire_touch',
      name: 'Hellfire Touch',
      description: 'Your attacks burn with hellfire, dealing bonus fire damage.',
      icon: '🔥',
      color: '#ff4444',
      cooldown: 0,
      effect: 'faction_form',
      factionId: 'demon',
    },
    {
      id: 'demon_wings',
      name: 'Demon Wings',
      description: 'Leap over obstacles and enemies.',
      icon: '🦇',
      color: '#ff6644',
      cooldown: 8,
      effect: 'faction_form',
      factionId: 'demon',
    },
    {
      id: 'fear_aura',
      name: 'Fear Aura',
      description: 'Weak enemies may flee from your presence.',
      icon: '😨',
      color: '#ff2222',
      cooldown: 0,
      effect: 'command_faction',
      factionId: 'demon',
    },
    {
      id: 'infernal_command',
      name: 'Infernal Command',
      description: 'Demons bow to your will.',
      icon: '👹',
      color: '#ff4444',
      cooldown: 12,
      effect: 'command_faction',
      factionId: 'demon',
    },
    {
      id: 'soul_harvest',
      name: 'Soul Harvest',
      description: 'Killing enemies restores health.',
      icon: '👻',
      color: '#ff8888',
      cooldown: 0,
      effect: 'faction_form',
      factionId: 'demon',
    },
  ],
  lycanthropy: [
    {
      id: 'keen_senses',
      name: 'Keen Senses',
      description: 'Detect all creatures on the floor.',
      icon: '👃',
      color: '#cc8844',
      cooldown: 0,
      effect: 'sense_faction',
      factionId: 'beast',
    },
    {
      id: 'pack_howl',
      name: 'Pack Howl',
      description: 'Stun nearby enemies briefly.',
      icon: '🐺',
      color: '#aa7744',
      cooldown: 8,
      effect: 'command_faction',
      factionId: 'beast',
    },
    {
      id: 'savage_leap',
      name: 'Savage Leap',
      description: 'Leap at an enemy and deal double damage.',
      icon: '🐾',
      color: '#cc8844',
      cooldown: 6,
      effect: 'faction_form',
      factionId: 'beast',
    },
    {
      id: 'primal_fury',
      name: 'Primal Fury',
      description: 'Enter a frenzy, attacking twice per turn.',
      icon: '💢',
      color: '#ff6644',
      cooldown: 12,
      effect: 'faction_form',
      factionId: 'beast',
    },
  ],
};

// Perception overrides for transformed classes
const TRANSFORMED_PERCEPTION: Record<string, PerceptionChange[]> = {
  were_goblin: [
    { type: 'color_shift', original: '#ff4444', replacement: '#44ff44', intensity: 1.0 },
    { type: 'description_replace', original: 'filthy', replacement: 'beautiful', intensity: 1.0 },
    { type: 'description_replace', original: 'monster', replacement: 'brother', intensity: 1.0 },
    { type: 'description_replace', original: 'goblin', replacement: 'kin', intensity: 1.0 },
    { type: 'beauty_in_darkness', intensity: 1.0 },
    { type: 'see_hidden', intensity: 1.0 },
  ],
  vampiric: [
    { type: 'color_shift', original: '#ffcc44', replacement: '#aa44ff', intensity: 1.0 },
    { type: 'description_replace', original: 'corpse', replacement: 'sleeping', intensity: 1.0 },
    { type: 'description_replace', original: 'undead', replacement: 'kindred', intensity: 1.0 },
    { type: 'description_replace', original: 'death', replacement: 'rest', intensity: 0.8 },
    { type: 'see_hidden', intensity: 1.0 },
  ],
  demonic_pact: [
    { type: 'color_shift', original: '#44ff44', replacement: '#ff4444', intensity: 1.0 },
    { type: 'color_shift', original: '#4488ff', replacement: '#ff8844', intensity: 1.0 },
    { type: 'description_replace', original: 'demon', replacement: 'brother', intensity: 1.0 },
    { type: 'description_replace', original: 'hell', replacement: 'home', intensity: 1.0 },
    { type: 'beauty_in_darkness', intensity: 1.0 },
  ],
  lycanthropy: [
    { type: 'description_replace', original: 'beast', replacement: 'brother', intensity: 1.0 },
    { type: 'description_replace', original: 'monster', replacement: 'prey', intensity: 1.0 },
    { type: 'description_replace', original: 'human', replacement: 'weakness', intensity: 0.8 },
    { type: 'see_hidden', intensity: 1.0 },
  ],
};

// Generate transformed class definition
export function getTransformedClassDef(
  baseClassId: PlayerClass,
  afflictionId: string
): TransformedClassDef | undefined {
  const baseClass = CLASS_DEFS.find(c => c.id === baseClassId);
  const affliction = getAfflictionDef(afflictionId);
  
  if (!baseClass || !affliction) return undefined;
  
  const abilities = AFFLICTION_ABILITIES[afflictionId] ?? [];
  const perceptionOverrides = TRANSFORMED_PERCEPTION[afflictionId] ?? [];
  
  // Get final stage stat modifiers
  const finalStage = affliction.stages[affliction.stages.length - 1];
  const bonusStats = finalStage?.statModifiers ?? {};
  
  return {
    id: `${afflictionId}_${baseClassId}`,
    baseClassId,
    afflictionId,
    name: `${affliction.transformedClassSuffix}-${baseClass.name}`,
    char: baseClass.char,
    color: affliction.color,
    description: `A ${baseClass.name} transformed by the ${affliction.name}.`,
    bonusStats,
    abilities,
    passives: [
      {
        name: affliction.name,
        description: affliction.description,
      },
      ...(baseClass.passives.map(p => ({ name: p.name, description: p.description }))),
    ],
    perceptionOverrides,
    telepathicLink: affliction.telepathicLink,
  };
}

// Check if player should have a transformed class
export function shouldHaveTransformedClass(state: GameState): boolean {
  return isFullyTransformed(state);
}

// Get the player's current transformed class (if any)
export function getPlayerTransformedClass(state: GameState): TransformedClassDef | undefined {
  if (!state.activeAffliction || state.activeAffliction.cured) return undefined;
  if (!isFullyTransformed(state)) return undefined;
  
  return getTransformedClassDef(state.playerClass, state.activeAffliction.afflictionId);
}

// Get the display name for the player's class (accounting for transformation)
export function getPlayerClassName(state: GameState): string {
  const transformed = getPlayerTransformedClass(state);
  if (transformed) return transformed.name;
  
  const baseClass = CLASS_DEFS.find(c => c.id === state.playerClass);
  return baseClass?.name ?? state.playerClass;
}

// Get the color for the player's class (accounting for transformation)
export function getPlayerClassColor(state: GameState): string {
  const transformed = getPlayerTransformedClass(state);
  if (transformed) return transformed.color;
  
  const baseClass = CLASS_DEFS.find(c => c.id === state.playerClass);
  return baseClass?.color ?? '#ffffff';
}
