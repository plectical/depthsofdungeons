/**
 * Elemental Weakness System
 *
 * 6 elements in a circular weakness chain:
 *   Fire → Ice → Lightning → Poison → Holy → Dark → Fire
 *
 * Attacking with an element that beats the defender's element = 1.5x damage
 * Attacking with an element that loses to the defender's element = 0.75x damage
 * No element or same element = 1.0x (normal)
 */

import type { Element, Entity, Item } from './types';

/** What element does this element beat? */
const WEAKNESS_CHART: Record<Element, Element> = {
  fire: 'ice',
  ice: 'lightning',
  lightning: 'poison',
  poison: 'holy',
  holy: 'dark',
  dark: 'fire',
};

/** What element is this element weak to? (reverse of weakness chart) */
const RESISTS_CHART: Record<Element, Element> = {
  fire: 'dark',
  ice: 'fire',
  lightning: 'ice',
  poison: 'lightning',
  holy: 'poison',
  dark: 'holy',
};

/** Display info for each element */
export const ELEMENT_INFO: Record<Element, { name: string; color: string; icon: string }> = {
  fire:      { name: 'Fire',      color: '#ff6622', icon: '\u{1F525}' },
  ice:       { name: 'Ice',       color: '#88ddff', icon: '\u2744' },
  poison:    { name: 'Poison',    color: '#33cc22', icon: '\u2620' },
  lightning: { name: 'Lightning', color: '#ffff44', icon: '\u26A1' },
  dark:      { name: 'Dark',      color: '#aa55cc', icon: '\u{1F311}' },
  holy:      { name: 'Holy',      color: '#ffdd88', icon: '\u2726' },
};

/**
 * Get the elemental damage multiplier.
 * @param attackElement The attacker's element (from weapon or monster)
 * @param defendElement The defender's element (from monster)
 * @returns multiplier (1.5 = super effective, 0.75 = resisted, 1.0 = neutral)
 */
export function getElementalMultiplier(attackElement?: Element, defendElement?: Element): number {
  if (!attackElement || !defendElement) return 1.0;
  if (attackElement === defendElement) return 1.0;
  if (WEAKNESS_CHART[attackElement] === defendElement) return 1.5;
  if (RESISTS_CHART[attackElement] === defendElement) return 0.75;
  return 1.0;
}

/**
 * Get the attack element for an entity.
 * For the player: comes from equipped weapon's element.
 * For monsters: comes from their innate element.
 */
export function getAttackElement(entity: Entity): Element | undefined {
  if (entity.isPlayer) {
    return entity.equipment?.weapon?.element;
  }
  return entity.element;
}

/**
 * Get the defense element for an entity.
 * For the player: no innate element (they're human).
 * For monsters: comes from their innate element.
 */
export function getDefenseElement(entity: Entity): Element | undefined {
  if (entity.isPlayer) return undefined;
  return entity.element;
}

/** Get a short description of the elemental interaction */
export function getElementalMessage(attackEl: Element, defendEl: Element): string | null {
  if (WEAKNESS_CHART[attackEl] === defendEl) {
    return `${ELEMENT_INFO[attackEl].name} is super effective against ${ELEMENT_INFO[defendEl].name}!`;
  }
  if (RESISTS_CHART[attackEl] === defendEl) {
    return `${ELEMENT_INFO[defendEl].name} resists ${ELEMENT_INFO[attackEl].name}...`;
  }
  return null;
}

/**
 * Infer element from an item's onHitEffect type.
 * Used as a fallback if the item doesn't have an explicit element.
 */
export function inferElementFromEffect(item: Item): Element | undefined {
  if (item.element) return item.element;
  const effect = item.onHitEffect;
  if (!effect) return undefined;
  switch (effect.type) {
    case 'fireball': return 'fire';
    case 'freeze': return 'ice';
    case 'poison': return 'poison';
    case 'stun': return 'lightning';
    case 'lifesteal': return 'dark';
    case 'bleed': return 'dark';
    default: return undefined;
  }
}
