/**
 * Story NPC Registry — stores pre-baked NPC definitions so the dialogue
 * system can look them up by defId, just like regular NPC_DEFS.
 */

import type { PrebakedNPC } from './campaignTypes';

const _registry = new Map<string, PrebakedNPC>();

/** Register all NPCs for the current story floor. Clears previous entries. */
export function registerStoryNpcs(npcs: PrebakedNPC[]): void {
  _registry.clear();
  for (const npc of npcs) {
    _registry.set(npc.id, npc);
  }
}

/** Look up a story NPC by its defId. Returns undefined if not found. */
export function getStoryNpcDef(defId: string): PrebakedNPC | undefined {
  return _registry.get(defId);
}

/** Check if there are any story NPCs registered (i.e. we're in story mode). */
export function hasStoryNpcs(): boolean {
  return _registry.size > 0;
}

/** Clear the registry (call when exiting story mode). */
export function clearStoryNpcs(): void {
  _registry.clear();
}
