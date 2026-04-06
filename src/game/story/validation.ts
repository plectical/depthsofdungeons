import type {
  StoryCharacter,
  GeneratedEncounter,
  GeneratedItem,
  NarrativeBeat,
  SkillName,
} from '../types';

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Blocked words/phrases for safety
const BLOCKED_PATTERNS = [
  /\b(slur|explicit|nsfw)\b/i,
  /\b(real.?world.?violence)\b/i,
  /\b(self.?harm)\b/i,
];

// Check for blocked content
function containsBlockedContent(text: string): boolean {
  return BLOCKED_PATTERNS.some(pattern => pattern.test(text));
}

// Validate a story character
export function validateCharacter(character: StoryCharacter): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!character.id || character.id.length < 2) {
    errors.push('Character ID is missing or too short');
  }
  if (!character.name || character.name.length < 2) {
    errors.push('Character name is missing or too short');
  }
  if (!character.title) {
    warnings.push('Character title is missing');
  }

  // Safety checks
  const textToCheck = [
    character.name,
    character.title,
    character.motivation,
    character.secret,
    character.introDialogue,
  ].filter(Boolean).join(' ');

  if (containsBlockedContent(textToCheck)) {
    errors.push('Character contains blocked content');
  }

  // Quality checks
  if (character.introDialogue && character.introDialogue.length > 200) {
    warnings.push('Intro dialogue is too long (max 200 chars)');
  }

  // Valid race
  const validRaces = ['goblin', 'human', 'undead', 'demon', 'elemental', 'beast'];
  if (!validRaces.includes(character.race)) {
    errors.push(`Invalid race: ${character.race}`);
  }

  // Valid role
  const validRoles = ['ally', 'enemy', 'neutral', 'wild_card'];
  if (!validRoles.includes(character.role)) {
    errors.push(`Invalid role: ${character.role}`);
  }

  // Floor range makes sense
  if (character.introFloorRange[0] > character.introFloorRange[1]) {
    errors.push('Invalid floor range: min > max');
  }
  if (character.introFloorRange[0] < 1 || character.introFloorRange[1] > 20) {
    warnings.push('Floor range outside typical bounds (1-20)');
  }

  // Relationship tiers exist and are ordered
  if (!character.relationshipTiers || character.relationshipTiers.length === 0) {
    warnings.push('No relationship tiers defined');
  } else {
    let lastThreshold = -Infinity;
    for (const tier of character.relationshipTiers) {
      if (tier.threshold < lastThreshold) {
        errors.push('Relationship tiers not in ascending order');
        break;
      }
      lastThreshold = tier.threshold;
    }
  }

  // Mercenary stats if recruitable
  if (character.recruitable && !character.mercenaryStats) {
    warnings.push('Recruitable character has no mercenary stats');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// Validate an encounter
export function validateEncounter(encounter: GeneratedEncounter): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!encounter.id || encounter.id.length < 2) {
    errors.push('Encounter ID is missing or too short');
  }
  if (!encounter.description) {
    errors.push('Encounter description is missing');
  }

  // Safety checks
  const textToCheck = [
    encounter.description,
    encounter.successDescription,
    encounter.partialDescription,
    encounter.failureDescription,
  ].filter(Boolean).join(' ');

  if (containsBlockedContent(textToCheck)) {
    errors.push('Encounter contains blocked content');
  }

  // Quality checks
  if (encounter.description && encounter.description.length > 300) {
    warnings.push('Description is too long');
  }

  // Valid type
  const validTypes = ['skill_challenge', 'hidden_cache', 'trapped_room', 'negotiation', 'chase'];
  if (!validTypes.includes(encounter.type)) {
    errors.push(`Invalid encounter type: ${encounter.type}`);
  }

  // Valid skills
  const validSkills: SkillName[] = ['stealth', 'diplomacy', 'athletics', 'awareness', 'lore', 'survival'];
  if (!validSkills.includes(encounter.primarySkill)) {
    errors.push(`Invalid primary skill: ${encounter.primarySkill}`);
  }
  if (encounter.alternateSkill && !validSkills.includes(encounter.alternateSkill)) {
    errors.push(`Invalid alternate skill: ${encounter.alternateSkill}`);
  }

  // Balance checks
  if (encounter.target < 4 || encounter.target > 14) {
    warnings.push(`Target ${encounter.target} outside reasonable range (4-14)`);
  }

  // Floor range
  if (encounter.floorRange[0] > encounter.floorRange[1]) {
    errors.push('Invalid floor range');
  }

  // Rewards/penalties exist
  if (!encounter.successReward) {
    warnings.push('No success reward defined');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// Validate an item
export function validateItem(item: GeneratedItem): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!item.id || item.id.length < 2) {
    errors.push('Item ID is missing or too short');
  }
  if (!item.name || item.name.length < 2) {
    errors.push('Item name is missing or too short');
  }
  if (!item.description) {
    errors.push('Item description is missing');
  }

  // Safety checks
  const textToCheck = [item.name, item.description, item.flavorText].filter(Boolean).join(' ');
  if (containsBlockedContent(textToCheck)) {
    errors.push('Item contains blocked content');
  }

  // Valid type
  const validTypes = ['weapon', 'armor', 'ring', 'amulet', 'offhand', 'potion', 'scroll', 'food'];
  if (!validTypes.includes(item.type)) {
    errors.push(`Invalid item type: ${item.type}`);
  }

  // Valid rarity
  const validRarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
  if (!validRarities.includes(item.rarity)) {
    errors.push(`Invalid rarity: ${item.rarity}`);
  }

  // Balance checks for skill bonuses
  if (item.skillBonus) {
    for (const [skill, value] of Object.entries(item.skillBonus)) {
      if (typeof value === 'number') {
        if (value < -2 || value > 5) {
          warnings.push(`Skill bonus ${skill}: ${value} may be unbalanced`);
        }
      }
    }
  }

  // Balance checks for stat bonuses
  if (item.statBonus) {
    const totalStatBonus = Object.values(item.statBonus).reduce((sum, val) => 
      sum + (typeof val === 'number' ? Math.abs(val) : 0), 0
    );
    
    const expectedMax: Record<string, number> = {
      common: 5,
      uncommon: 10,
      rare: 15,
      epic: 22,
      legendary: 30,
      mythic: 40,
    };
    
    if (totalStatBonus > (expectedMax[item.rarity] ?? 20)) {
      warnings.push(`Total stat bonus ${totalStatBonus} seems high for ${item.rarity}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// Validate a narrative beat
export function validateBeat(beat: NarrativeBeat): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!beat.id) {
    errors.push('Beat ID is missing');
  }
  if (!beat.characterId) {
    errors.push('Character ID is missing');
  }

  // Validate dialogue tree
  if (beat.dialogue) {
    if (!beat.dialogue.rootNodeId) {
      errors.push('Dialogue tree has no root node');
    }
    if (!beat.dialogue.nodes || Object.keys(beat.dialogue.nodes).length === 0) {
      errors.push('Dialogue tree has no nodes');
    }

    // Check for blocked content in dialogue
    for (const node of Object.values(beat.dialogue.nodes)) {
      if (node.text && containsBlockedContent(node.text)) {
        errors.push('Dialogue contains blocked content');
        break;
      }
    }

    // Check dialogue length
    for (const node of Object.values(beat.dialogue.nodes)) {
      if (node.text && node.text.length > 200) {
        warnings.push('Dialogue node text exceeds 200 chars');
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// Batch validate all content
export interface BatchValidationResult {
  characters: { item: StoryCharacter; result: ValidationResult }[];
  encounters: { item: GeneratedEncounter; result: ValidationResult }[];
  items: { item: GeneratedItem; result: ValidationResult }[];
  totalErrors: number;
  totalWarnings: number;
  allValid: boolean;
}

export function validateBatch(
  characters: StoryCharacter[],
  encounters: GeneratedEncounter[],
  items: GeneratedItem[]
): BatchValidationResult {
  const characterResults = characters.map(c => ({ item: c, result: validateCharacter(c) }));
  const encounterResults = encounters.map(e => ({ item: e, result: validateEncounter(e) }));
  const itemResults = items.map(i => ({ item: i, result: validateItem(i) }));

  const allResults = [...characterResults, ...encounterResults, ...itemResults];
  
  const totalErrors = allResults.reduce((sum, r) => sum + r.result.errors.length, 0);
  const totalWarnings = allResults.reduce((sum, r) => sum + r.result.warnings.length, 0);

  return {
    characters: characterResults,
    encounters: encounterResults,
    items: itemResults,
    totalErrors,
    totalWarnings,
    allValid: totalErrors === 0,
  };
}

// Sanitize text (remove potential issues)
export function sanitizeText(text: string, maxLength: number = 200): string {
  let sanitized = text.trim();
  
  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength - 3) + '...';
  }
  
  return sanitized;
}
