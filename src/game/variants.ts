/**
 * Monster Variant System
 *
 * Each base monster can spawn as one of ~20 color variants.
 * Variants have a prefix name (e.g. "Crimson Rat") and a shifted color.
 * Each variant is a separate bestiary entry for collection purposes.
 */

import { randInt } from './utils';

// ── Variant prefixes with their color-shift hue/saturation ──
// Each variant defines a prefix name and a target color hue + saturation
// The final color blends the base monster color toward the variant tint.

export interface VariantDef {
  prefix: string;
  /** Hex color tint to blend toward */
  tint: string;
  /** How far to shift the base color toward the tint (0-1) */
  blend: number;
  /** Optional stat multiplier tweaks (slight) */
  statMod?: { hp?: number; attack?: number; defense?: number; speed?: number };
}

// 20 variant types — each one will produce a visually distinct color
export const VARIANT_DEFS: VariantDef[] = [
  // --- Reds / Warm ---
  { prefix: 'Crimson',    tint: '#ee2233', blend: 0.55, statMod: { attack: 1.08 } },
  { prefix: 'Scarlet',    tint: '#ff3344', blend: 0.45, statMod: { attack: 1.05, speed: 1.05 } },
  { prefix: 'Ember',      tint: '#ff6622', blend: 0.50, statMod: { attack: 1.06 } },
  { prefix: 'Infernal',   tint: '#cc2200', blend: 0.60, statMod: { attack: 1.10, defense: 0.95 } },

  // --- Blues / Cold ---
  { prefix: 'Frost',      tint: '#55aaff', blend: 0.50, statMod: { speed: 0.90, defense: 1.08 } },
  { prefix: 'Azure',      tint: '#3388ee', blend: 0.45, statMod: { defense: 1.05 } },
  { prefix: 'Glacial',    tint: '#88ddff', blend: 0.55, statMod: { defense: 1.10, speed: 0.85 } },

  // --- Greens / Nature ---
  { prefix: 'Toxic',      tint: '#33cc22', blend: 0.50, statMod: { attack: 1.05 } },
  { prefix: 'Verdant',    tint: '#44dd44', blend: 0.45, statMod: { hp: 1.08 } },
  { prefix: 'Fungal',     tint: '#88bb33', blend: 0.50, statMod: { hp: 1.06, speed: 0.95 } },

  // --- Purples / Dark ---
  { prefix: 'Shadow',     tint: '#6633aa', blend: 0.55, statMod: { speed: 1.10, hp: 0.95 } },
  { prefix: 'Void',       tint: '#8844cc', blend: 0.50, statMod: { attack: 1.08, defense: 0.95 } },
  { prefix: 'Cursed',     tint: '#aa33cc', blend: 0.45, statMod: { attack: 1.06 } },

  // --- Pale / Ghost ---
  { prefix: 'Pale',       tint: '#ddddee', blend: 0.50, statMod: { speed: 1.08, defense: 0.95 } },
  { prefix: 'Spectral',   tint: '#ccccff', blend: 0.55, statMod: { speed: 1.10, hp: 0.90 } },
  { prefix: 'Ghostly',    tint: '#bbbbdd', blend: 0.45, statMod: { speed: 1.05 } },

  // --- Gold / Special ---
  { prefix: 'Golden',     tint: '#ffcc22', blend: 0.55, statMod: { hp: 1.10, defense: 1.05 } },
  { prefix: 'Ancient',    tint: '#ccaa44', blend: 0.45, statMod: { hp: 1.12, attack: 1.05 } },

  // --- Dark / Gritty ---
  { prefix: 'Ashen',      tint: '#777788', blend: 0.50, statMod: { defense: 1.08 } },
  { prefix: 'Dire',       tint: '#993322', blend: 0.50, statMod: { attack: 1.10, hp: 1.05 } },
];

/** Parse a hex color into [r, g, b] */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

/** Convert [r, g, b] to hex */
function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + [r, g, b].map(v => clamp(v).toString(16).padStart(2, '0')).join('');
}

/** Blend two colors: base -> tint by amount (0 = all base, 1 = all tint) */
function blendColors(baseHex: string, tintHex: string, amount: number): string {
  const [r1, g1, b1] = hexToRgb(baseHex);
  const [r2, g2, b2] = hexToRgb(tintHex);
  return rgbToHex(
    r1 + (r2 - r1) * amount,
    g1 + (g2 - g1) * amount,
    b1 + (b2 - b1) * amount,
  );
}

/**
 * Pick a random variant for a monster.
 * Returns null for ~25% of spawns (they stay as the base version).
 * Bosses never get variants.
 */
export function pickVariant(baseName: string, baseColor: string, isBoss?: boolean): {
  variantName: string;
  color: string;
  statMod: { hp?: number; attack?: number; defense?: number; speed?: number };
} | null {
  // Bosses are always their base version
  if (isBoss) return null;

  // ~25% chance to be the base (unmodified) version
  if (Math.random() < 0.25) return null;

  // Pick a random variant
  const variant = VARIANT_DEFS[randInt(0, VARIANT_DEFS.length - 1)];
  if (!variant) return null;

  // Don't apply variants whose prefix is already in the monster name
  // (e.g. don't make "Frost Frost Wraith")
  if (baseName.toLowerCase().includes(variant.prefix.toLowerCase())) {
    return null;
  }

  // Also skip if the monster name starts with a word that clashes
  // (e.g. "Dire Rat" + "Dire" prefix)
  const firstWord = baseName.split(' ')[0];
  if (firstWord && firstWord.toLowerCase() === variant.prefix.toLowerCase()) {
    return null;
  }

  const color = blendColors(baseColor, variant.tint, variant.blend);
  const variantName = `${variant.prefix} ${baseName}`;

  return {
    variantName,
    color,
    statMod: variant.statMod ?? {},
  };
}

/**
 * Get all possible variant names for a given base monster name.
 * Used by the bestiary to know how many total entries exist.
 */
export function getAllVariantNames(baseName: string): string[] {
  const names: string[] = [baseName]; // Base version is always an entry
  for (const v of VARIANT_DEFS) {
    // Skip variants whose prefix clashes with the name
    if (baseName.toLowerCase().includes(v.prefix.toLowerCase())) continue;
    const firstWord = baseName.split(' ')[0] ?? '';
    if (firstWord.toLowerCase() === v.prefix.toLowerCase()) continue;
    names.push(`${v.prefix} ${baseName}`);
  }
  return names;
}
