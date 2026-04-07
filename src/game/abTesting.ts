import RundotGameAPI from '@series-inc/rundot-game-sdk/api';

/**
 * A/B Testing System
 * 
 * Assigns users to experiment variants and tracks them through analytics.
 * Variants are persistent per user (stored in localStorage + tagged in events).
 */

// ══════════════════════════════════════════════════════════
// EXPERIMENT DEFINITIONS
// ══════════════════════════════════════════════════════════

export interface ExperimentDef {
  id: string;
  name: string;
  variants: VariantDef[];
  // Percentage of users to include in experiment (0-100)
  // Users not in experiment get 'control' and see default behavior
  rolloutPercent: number;
  // If true, experiment is active
  enabled: boolean;
}

export interface VariantDef {
  id: string;
  name: string;
  weight: number; // Relative weight for assignment (e.g., 50/50 = equal weights)
}

export interface UserVariant {
  experimentId: string;
  variantId: string;
  assignedAt: number;
}

// ══════════════════════════════════════════════════════════
// ACTIVE EXPERIMENTS
// ══════════════════════════════════════════════════════════

export const EXPERIMENTS: ExperimentDef[] = [
  {
    id: 'narrative_vs_classic',
    name: 'AI Narrative Mode vs Classic Mode',
    variants: [
      { id: 'classic', name: 'Classic Mode (Control)', weight: 50 },
      { id: 'narrative', name: 'AI Narrative Mode', weight: 50 },
    ],
    rolloutPercent: 100, // 100% of users are in this experiment
    enabled: true,
  },
];

// ══════════════════════════════════════════════════════════
// VARIANT ASSIGNMENT
// ══════════════════════════════════════════════════════════

const STORAGE_KEY = 'ab_test_variants';
let _variants: Record<string, UserVariant> = {};
let _loaded = false;

function loadVariants(): void {
  if (_loaded) return;
  _loaded = true;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      _variants = JSON.parse(stored);
    }
  } catch {
    _variants = {};
  }
}

function saveVariants(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_variants));
  } catch {
    // Storage unavailable
  }
}

/** Get a deterministic hash for user assignment */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/** Get user ID for deterministic assignment */
function getUserId(): string {
  // Use a persistent random ID stored in localStorage
  // This ensures the same user always gets the same variant
  let anonId = localStorage.getItem('ab_anon_id');
  if (!anonId) {
    anonId = `ab_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem('ab_anon_id', anonId);
  }
  return anonId;
}

/** Assign user to a variant for an experiment */
function assignVariant(experiment: ExperimentDef): string {
  const userId = getUserId();
  const hash = hashString(`${userId}_${experiment.id}`);
  
  // Check if user is in rollout
  const rolloutHash = hash % 100;
  if (rolloutHash >= experiment.rolloutPercent) {
    return 'control'; // Not in experiment
  }
  
  // Assign to variant based on weights
  const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);
  const variantHash = hash % totalWeight;
  
  let cumulative = 0;
  for (const variant of experiment.variants) {
    cumulative += variant.weight;
    if (variantHash < cumulative) {
      return variant.id;
    }
  }
  
  // Fallback to first variant
  return experiment.variants[0]?.id || 'control';
}

/** Get user's variant for an experiment (assigns if not already assigned) */
export function getVariant(experimentId: string): string {
  loadVariants();
  
  // Check if already assigned
  if (_variants[experimentId]) {
    return _variants[experimentId].variantId;
  }
  
  // Find experiment
  const experiment = EXPERIMENTS.find(e => e.id === experimentId);
  if (!experiment || !experiment.enabled) {
    return 'control';
  }
  
  // Assign variant
  const variantId = assignVariant(experiment);
  _variants[experimentId] = {
    experimentId,
    variantId,
    assignedAt: Date.now(),
  };
  saveVariants();
  
  console.log(`[ABTest] Assigned ${experimentId}: ${variantId}`);
  return variantId;
}

/** Get all user's variant assignments */
export function getAllVariants(): Record<string, string> {
  loadVariants();
  
  const result: Record<string, string> = {};
  for (const exp of EXPERIMENTS) {
    if (exp.enabled) {
      result[exp.id] = getVariant(exp.id);
    }
  }
  return result;
}

/** Force a specific variant (for testing/debug) */
export function forceVariant(experimentId: string, variantId: string): void {
  loadVariants();
  _variants[experimentId] = {
    experimentId,
    variantId,
    assignedAt: Date.now(),
  };
  saveVariants();
  console.log(`[ABTest] Forced ${experimentId}: ${variantId}`);
}

/** Clear all variant assignments (for testing) */
export function clearVariants(): void {
  _variants = {};
  _loaded = false;
  localStorage.removeItem(STORAGE_KEY);
  console.log('[ABTest] Cleared all variants');
}

// ══════════════════════════════════════════════════════════
// ANALYTICS INTEGRATION
// ══════════════════════════════════════════════════════════

/** Get variant data to include in analytics events */
export function getVariantContext(): Record<string, string> {
  const variants = getAllVariants();
  const context: Record<string, string> = {};
  
  for (const [expId, variantId] of Object.entries(variants)) {
    // Use snake_case for analytics keys
    context[`ab_${expId}`] = variantId;
  }
  
  return context;
}

/** Track experiment exposure (call when user sees the variant) */
export async function trackExposure(experimentId: string): Promise<void> {
  const variantId = getVariant(experimentId);
  
  try {
    await RundotGameAPI.analytics.recordCustomEvent('ab_exposure', {
      experiment_id: experimentId,
      variant_id: variantId,
      ...getVariantContext(),
    });
    console.log(`[ABTest] Tracked exposure: ${experimentId} -> ${variantId}`);
  } catch {
    // Analytics unavailable
  }
}

// ══════════════════════════════════════════════════════════
// NARRATIVE VS CLASSIC HELPERS
// ══════════════════════════════════════════════════════════

/** Check if user should see narrative mode as default */
export function shouldShowNarrativeMode(): boolean {
  const variant = getVariant('narrative_vs_classic');
  return variant === 'narrative';
}

/** Check if user is in classic mode variant */
export function shouldShowClassicMode(): boolean {
  const variant = getVariant('narrative_vs_classic');
  return variant === 'classic' || variant === 'control';
}

/** Get the default zone for this user's variant */
export function getDefaultZone(): 'stone_depths' | 'narrative_test' {
  return shouldShowNarrativeMode() ? 'narrative_test' : 'stone_depths';
}

/** Get the experiment variant for display */
export function getNarrativeExperimentInfo(): { variant: string; isNarrative: boolean } {
  const variant = getVariant('narrative_vs_classic');
  return {
    variant,
    isNarrative: variant === 'narrative',
  };
}
