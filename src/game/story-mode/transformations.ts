/**
 * General transformation system for story mode.
 * Supports multiple transformation types (dino, flesh wall, shadow, etc.)
 * with shared infrastructure for temporary/permanent forms, stat mods,
 * restrictions, and portrait overrides.
 */

export interface TransformDef {
  id: string;
  name: string;
  /** CDN path for portrait when transformed */
  portrait: string;
  /** ASCII char override when transformed */
  char: string;
  /** HUD border color when transformed */
  color: string;
  /** Stat deltas applied when entering the form */
  statMods: {
    attack?: number;
    defense?: number;
    maxHp?: number;
    hp?: number;
    speed?: number;
  };
  /** Whether the player can use consumables while transformed */
  canUseConsumables: boolean;
  /** Duration in turns for temporary form (0 = permanent only) */
  turnDuration: number;
  /** Extended duration after threshold uses */
  extendedDuration?: number;
  /** Number of uses at which the extended duration kicks in */
  extendedThreshold?: number;
  /** Number of total uses before transformation becomes permanent */
  permanentThreshold: number;
  /** Name of the consumable item that triggers this transformation */
  consumableName: string;
  /** Warning message shown when approaching permanent threshold */
  warningMessage: string;
  /** Message shown when transformation becomes permanent */
  permanentMessage: string;
}

export const TRANSFORM_DEFS: Record<string, TransformDef> = {
  dino: {
    id: 'dino',
    name: 'Dino Form',
    portrait: 'story/story-ch3-dino-warrior.png',
    char: 'D',
    color: '#44ff88',
    statMods: { attack: 8, defense: 4, maxHp: 20, hp: 20, speed: -3 },
    canUseConsumables: false,
    turnDuration: 8,
    extendedDuration: 12,
    extendedThreshold: 4,
    permanentThreshold: 6,
    consumableName: 'Dino Serum',
    warningMessage: 'WARNING: The serum is taking hold. Your body resists returning to normal...',
    permanentMessage: 'The transformation is PERMANENT. You are no longer fully human.',
  },
  flesh_wall: {
    id: 'flesh_wall',
    name: 'Amalgam Form',
    portrait: 'story/story-ch2-flesh-wall-form.png',
    char: 'W',
    color: '#cc4466',
    statMods: { attack: 4, defense: 8, maxHp: 30, hp: 30, speed: -5 },
    canUseConsumables: false,
    turnDuration: 10,
    extendedDuration: 15,
    extendedThreshold: 4,
    permanentThreshold: 6,
    consumableName: 'Wall Essence',
    warningMessage: 'WARNING: The wall whispers inside you. Your flesh crawls and shifts...',
    permanentMessage: 'The wall has claimed you. You are part of it now — and it is part of you.',
  },
  shadow: {
    id: 'shadow',
    name: 'Shadow Form',
    portrait: 'story/story-ch1-shadow-form.png',
    char: 'S',
    color: '#8844cc',
    statMods: { attack: 3, defense: -2, maxHp: -10, speed: 6 },
    canUseConsumables: true,
    turnDuration: 6,
    extendedDuration: 10,
    extendedThreshold: 3,
    permanentThreshold: 5,
    consumableName: 'Dream Shard',
    warningMessage: 'WARNING: The Sleeper\'s dreams bleed into yours. Reality feels thin...',
    permanentMessage: 'You have become shadow. The boundary between dream and flesh is gone.',
  },
};

export function getTransformDef(id: string): TransformDef | undefined {
  return TRANSFORM_DEFS[id];
}
