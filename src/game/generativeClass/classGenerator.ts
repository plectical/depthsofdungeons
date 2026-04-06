/**
 * Class Generator
 * Uses AI to generate complete class definitions based on archetypes
 */

import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import type {
  GeneratedClass,
  GeneratedResource,
  GeneratedAbility,
  GeneratedPassive,
  GeneratedGearDef,
  GeneratedSkillTree,
  GeneratedEnemyDef,
  GeneratedBossDef,
  GeneratedQuestDef,
  ArchetypeId,
  ClassGenerationState,
} from './types';
import { getArchetype, getRandomArchetype } from './archetypes';
import { compressImageUrl } from '../story/imageCompression';

const LLM_MODEL = 'gpt-5.4-mini';
const IMAGE_MODEL = 'gemini-3.1-flash-image-preview';
const PORTRAIT_STYLE_REFERENCE = 'https://i.imgur.com/blvhjo8.png';

let generationState: ClassGenerationState = {
  isGenerating: false,
  progress: 0,
  stage: 'idle',
  currentClass: null,
  error: null,
};

export function getGenerationState(): ClassGenerationState {
  return { ...generationState };
}

function updateState(partial: Partial<ClassGenerationState>) {
  generationState = { ...generationState, ...partial };
}

function parseJSON<T>(text: string): T | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    return null;
  } catch {
    return null;
  }
}

async function generateText(prompt: string): Promise<string | null> {
  try {
    if (RundotGameAPI.accessGate.isAnonymous()) {
      console.warn('[ClassGen] User not logged in');
      return null;
    }
    
    const result = await RundotGameAPI.ai.requestChatCompletionAsync({
      model: LLM_MODEL,
      messages: [
        { role: 'system', content: 'You are a creative game designer generating roguelike class content. Always respond with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      maxTokens: 2000,
      temperature: 0.9,
    });
    
    return (result as { message?: string }).message ?? result.choices?.[0]?.message?.content ?? null;
  } catch (e) {
    console.error('[ClassGen] Text generation failed:', e);
    return null;
  }
}

async function generatePortrait(className: string, description: string): Promise<string | null> {
  try {
    if (RundotGameAPI.accessGate.isAnonymous()) return null;
    
    const prompt = `PIXEL ART portrait of a dark fantasy dungeon character: ${className}.
${description}

Style requirements:
- Retro pixel art style, 32x32 or 64x64 aesthetic
- Dark fantasy roguelike dungeon crawler aesthetic
- Limited color palette: dark greens, oranges, blacks, grays
- Character facing forward, shoulders up portrait
- Dramatic dungeon lighting
- NO TEXT, NO WORDS, NO LETTERS in the image
- Sharp pixelated edges, atmospheric`;

    const result = await RundotGameAPI.imageGen.generate({
      prompt,
      model: IMAGE_MODEL,
      aspectRatio: '1:1',
      removeBackground: false,
      referenceImages: [PORTRAIT_STYLE_REFERENCE],
    });
    
    if (result.imageUrl) {
      return compressImageUrl(result.imageUrl, 0.9, 512);
    }
    return null;
  } catch (e) {
    console.error('[ClassGen] Portrait generation failed:', e);
    return null;
  }
}

// ══════════════════════════════════════════════════════════════
// MAIN GENERATION FUNCTION
// ══════════════════════════════════════════════════════════════

export async function generateClass(
  archetypeId?: ArchetypeId,
  onProgress?: (progress: number, stage: string) => void
): Promise<GeneratedClass | null> {
  if (generationState.isGenerating) {
    console.warn('[ClassGen] Generation already in progress');
    return null;
  }
  
  updateState({ isGenerating: true, progress: 0, stage: 'archetype', error: null });
  
  try {
    // Step 1: Select archetype
    const archetype = archetypeId ? getArchetype(archetypeId) : getRandomArchetype();
    onProgress?.(5, `Rolling ${archetype.name} archetype...`);
    updateState({ progress: 5, stage: 'identity' });
    
    // Step 2: Generate class identity
    onProgress?.(10, 'Creating class identity...');
    const identity = await generateClassIdentity(archetype.id);
    if (!identity) throw new Error('Failed to generate class identity');
    updateState({ progress: 20, stage: 'abilities' });
    
    // Step 3: Generate resource and ability
    onProgress?.(25, `Designing ${identity.name}'s abilities...`);
    const { resource, ability } = await generateResourceAndAbility(archetype.id, identity);
    updateState({ progress: 35 });
    
    // Step 4: Generate passives
    onProgress?.(40, 'Creating passive abilities...');
    const passives = await generatePassives(archetype.id, identity, ability);
    updateState({ progress: 45, stage: 'gear' });
    
    // Step 5: Generate starting gear
    onProgress?.(50, 'Forging class gear...');
    const startingGear = await generateGear(archetype.id, identity, ability);
    updateState({ progress: 55 });
    
    // Step 6: Generate skill tree
    onProgress?.(60, 'Building skill tree...');
    const skillTree = await generateSkillTree(archetype.id, identity, ability);
    updateState({ progress: 70, stage: 'enemies' });
    
    // Step 7: Generate enemies
    onProgress?.(75, 'Creating challengers...');
    const enemies = await generateEnemies(archetype.id, identity);
    updateState({ progress: 80 });
    
    // Step 8: Generate boss
    onProgress?.(85, 'Summoning the nemesis...');
    const boss = await generateBoss(archetype.id, identity, ability);
    updateState({ progress: 90 });
    
    // Step 9: Generate quests
    const quests = generateQuests(archetype.id, identity, ability);
    updateState({ progress: 95, stage: 'portrait' });
    
    // Step 10: Generate portrait
    onProgress?.(95, `Painting ${identity.name}...`);
    const portraitUrl = await generatePortrait(identity.name, identity.appearanceDescription);
    
    // Assemble final class
    const generatedClass: GeneratedClass = {
      id: `gen_${archetype.id}_${Date.now()}`,
      name: identity.name,
      title: identity.title,
      archetype: archetype.id,
      portraitUrl: portraitUrl || undefined,
      char: identity.char,
      color: identity.color,
      icon: identity.icon,
      description: identity.description,
      backstory: identity.backstory,
      baseStats: identity.baseStats,
      levelBonusHp: identity.levelBonusHp,
      levelBonusAtk: identity.levelBonusAtk,
      levelBonusDef: identity.levelBonusDef,
      resource,
      ability,
      passives,
      startingGear,
      skillTree,
      enemies,
      boss,
      quests,
      plays: 0,
      rating: 0,
      isPublic: false,
      createdAt: new Date().toISOString(),
      isGenerated: true,
      generatedAt: new Date().toISOString(),
    };
    
    updateState({ 
      isGenerating: false, 
      progress: 100, 
      stage: 'complete',
      currentClass: generatedClass 
    });
    
    onProgress?.(100, 'Class ready!');
    return generatedClass;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ClassGen] Generation failed:', error);
    updateState({ 
      isGenerating: false, 
      error: errorMessage,
      stage: 'idle' 
    });
    return null;
  }
}

// ══════════════════════════════════════════════════════════════
// IDENTITY GENERATION
// ══════════════════════════════════════════════════════════════

interface ClassIdentity {
  name: string;
  title: string;
  char: string;
  color: string;
  icon: string;
  description: string;
  backstory: string;
  appearanceDescription: string;
  baseStats: { hp: number; maxHp: number; attack: number; defense: number; speed: number };
  levelBonusHp: number;
  levelBonusAtk: number;
  levelBonusDef: number;
}

async function generateClassIdentity(archetypeId: ArchetypeId): Promise<ClassIdentity | null> {
  const archetype = getArchetype(archetypeId);
  
  const prompt = `Generate a unique dark fantasy roguelike class based on this archetype:

ARCHETYPE: ${archetype.name}
MECHANIC: ${archetype.description}

Create a class with this JSON schema:
{
  "name": "Creative class name (1-2 words, like 'Stoneshaper', 'Dirge Singer', 'Void Glutton')",
  "title": "The [Dramatic Title]",
  "char": "Single ASCII character to represent on map",
  "color": "#hexcolor (dark/moody colors preferred)",
  "icon": "Single emoji that represents the class",
  "description": "One sentence describing playstyle",
  "backstory": "2-3 sentences of dark fantasy lore about this class",
  "appearanceDescription": "Physical description for portrait: clothing, features, atmosphere (2-3 sentences)",
  "baseStats": {
    "hp": 20-30,
    "maxHp": 20-30 (same as hp),
    "attack": 3-7,
    "defense": 0-4,
    "speed": 6-12
  },
  "levelBonusHp": 2-5,
  "levelBonusAtk": 1-2,
  "levelBonusDef": 0-1
}

Make the class feel UNIQUE and thematic to the ${archetype.name} mechanic.
Stats should reflect the playstyle (e.g., tanky for territory, fast for momentum).`;

  const response = await generateText(prompt);
  if (!response) return null;
  
  return parseJSON<ClassIdentity>(response);
}

// ══════════════════════════════════════════════════════════════
// RESOURCE & ABILITY GENERATION
// ══════════════════════════════════════════════════════════════

async function generateResourceAndAbility(
  archetypeId: ArchetypeId,
  identity: ClassIdentity
): Promise<{ resource: GeneratedResource; ability: GeneratedAbility }> {
  const archetype = getArchetype(archetypeId);
  
  const prompt = `Generate the resource system and primary ability for this class:

CLASS: ${identity.name} (${identity.title})
ARCHETYPE: ${archetype.name} - ${archetype.description}

RESOURCE OPTIONS from archetype: ${archetype.resourceTemplate.nameOptions.join(', ')}
REGEN METHODS available: ${archetype.resourceTemplate.regenMethods.join(', ')}

Generate JSON:
{
  "resource": {
    "name": "Creative resource name themed to ${identity.name}",
    "icon": "Single emoji",
    "color": "#hexcolor",
    "max": ${archetype.resourceTemplate.maxRange[0]}-${archetype.resourceTemplate.maxRange[1]},
    "startingAmount": 0-50% of max,
    "regenMethod": "one of: ${archetype.resourceTemplate.regenMethods.join(', ')}",
    "regenAmount": 1-3,
    "description": "How the player gains and uses this resource"
  },
  "ability": {
    "id": "snake_case_id",
    "name": "Ability Name",
    "description": "What the ability does (1-2 sentences)",
    "icon": "Single emoji",
    "resourceCost": appropriate cost,
    "effectType": "one of: damage, terrain_modify, summon_companion, buff_self, debuff_enemy, transform, reflect, consume, convert_enemy",
    "effect": {
      "type": "same as effectType",
      "value": number if applicable,
      "duration": turns if applicable,
      "radius": tiles if area effect
    }
  }
}

Make the ability feel powerful and unique to the ${archetype.name} playstyle!`;

  const response = await generateText(prompt);
  if (!response) {
    // Fallback
    return {
      resource: {
        name: 'Power',
        icon: '⚡',
        color: identity.color,
        max: 10,
        startingAmount: 5,
        regenMethod: 'on_kill',
        regenAmount: 2,
        description: 'Gained from defeating enemies',
      },
      ability: {
        id: 'primary_ability',
        name: 'Strike',
        description: 'A powerful attack',
        icon: '⚔️',
        resourceCost: 3,
        effectType: 'damage',
        effect: { type: 'damage', value: 10 },
      },
    };
  }
  
  const parsed = parseJSON<{ resource: GeneratedResource; ability: GeneratedAbility }>(response);
  return parsed || {
    resource: {
      name: 'Power',
      icon: '⚡',
      color: identity.color,
      max: 10,
      startingAmount: 5,
      regenMethod: 'on_kill',
      regenAmount: 2,
      description: 'Gained from defeating enemies',
    },
    ability: {
      id: 'primary_ability',
      name: 'Strike',
      description: 'A powerful attack',
      icon: '⚔️',
      resourceCost: 3,
      effectType: 'damage',
      effect: { type: 'damage', value: 10 },
    },
  };
}

// ══════════════════════════════════════════════════════════════
// PASSIVES GENERATION
// ══════════════════════════════════════════════════════════════

async function generatePassives(
  archetypeId: ArchetypeId,
  identity: ClassIdentity,
  ability: GeneratedAbility
): Promise<GeneratedPassive[]> {
  const archetype = getArchetype(archetypeId);
  
  const prompt = `Generate 3 passive abilities for this class:

CLASS: ${identity.name}
ABILITY: ${ability.name} - ${ability.description}
ARCHETYPE: ${archetype.name}

Generate JSON array of 3 passives:
[
  {
    "id": "snake_case",
    "name": "Passive Name",
    "description": "What it does",
    "icon": "emoji",
    "unlockLevel": 1,
    "effect": { "type": "stat_bonus", "stat": "attack/defense/hp/speed", "value": number }
  },
  {
    "id": "...",
    "name": "...",
    "description": "...",
    "icon": "...",
    "unlockLevel": 4,
    "effect": { ... }
  },
  {
    "id": "...",
    "name": "...",
    "description": "...",
    "icon": "...",
    "unlockLevel": 7,
    "effect": { ... }
  }
]

Passives should synergize with the ${archetype.name} playstyle and ${ability.name} ability.`;

  const response = await generateText(prompt);
  if (!response) {
    return [
      { id: 'passive_1', name: 'Resilience', description: '+10% HP', icon: '❤️', unlockLevel: 1, effect: { type: 'stat_bonus', stat: 'hp', value: 3 } },
      { id: 'passive_2', name: 'Strength', description: '+2 Attack', icon: '⚔️', unlockLevel: 4, effect: { type: 'stat_bonus', stat: 'attack', value: 2 } },
      { id: 'passive_3', name: 'Expertise', description: 'Ability costs -1', icon: '✨', unlockLevel: 7, effect: { type: 'resource_bonus', value: -1 } },
    ];
  }
  
  const parsed = parseJSON<GeneratedPassive[]>(response);
  return parsed || [
    { id: 'passive_1', name: 'Resilience', description: '+10% HP', icon: '❤️', unlockLevel: 1, effect: { type: 'stat_bonus', stat: 'hp', value: 3 } },
    { id: 'passive_2', name: 'Strength', description: '+2 Attack', icon: '⚔️', unlockLevel: 4, effect: { type: 'stat_bonus', stat: 'attack', value: 2 } },
    { id: 'passive_3', name: 'Expertise', description: 'Ability costs -1', icon: '✨', unlockLevel: 7, effect: { type: 'resource_bonus', value: -1 } },
  ];
}

// ══════════════════════════════════════════════════════════════
// GEAR GENERATION
// ══════════════════════════════════════════════════════════════

async function generateGear(
  archetypeId: ArchetypeId,
  identity: ClassIdentity,
  ability: GeneratedAbility
): Promise<GeneratedGearDef[]> {
  const archetype = getArchetype(archetypeId);
  
  const prompt = `Generate 2 starting gear items for this class:

CLASS: ${identity.name}
ABILITY: ${ability.name} - ${ability.description}
ARCHETYPE: ${archetype.name}

Generate JSON array of 2 items:
[
  {
    "id": "snake_case",
    "name": "Thematic Weapon/Armor Name",
    "description": "What it does",
    "slot": "weapon",
    "icon": "emoji",
    "color": "#hexcolor",
    "statBonus": { "attack": 2-4 },
    "synergyEffect": {
      "type": "ability_damage_boost",
      "value": 10-25,
      "description": "How it synergizes with ${ability.name}"
    },
    "rarity": "uncommon"
  },
  {
    "id": "...",
    "name": "Thematic Accessory Name",
    "description": "...",
    "slot": "accessory",
    "icon": "...",
    "color": "...",
    "statBonus": { "hp": 5-10 or "defense": 1-2 },
    "synergyEffect": { ... },
    "rarity": "common"
  }
]

Gear should feel thematic (flutes for musicians, gauntlets for territory, etc).`;

  const response = await generateText(prompt);
  if (!response) {
    return [
      { id: 'starter_weapon', name: 'Starter Blade', description: 'A basic weapon', slot: 'weapon', icon: '⚔️', color: identity.color, statBonus: { attack: 2 }, rarity: 'common' },
      { id: 'starter_accessory', name: 'Starter Charm', description: 'A basic accessory', slot: 'accessory', icon: '📿', color: identity.color, statBonus: { hp: 5 }, rarity: 'common' },
    ];
  }
  
  const parsed = parseJSON<GeneratedGearDef[]>(response);
  return parsed || [
    { id: 'starter_weapon', name: 'Starter Blade', description: 'A basic weapon', slot: 'weapon', icon: '⚔️', color: identity.color, statBonus: { attack: 2 }, rarity: 'common' },
    { id: 'starter_accessory', name: 'Starter Charm', description: 'A basic accessory', slot: 'accessory', icon: '📿', color: identity.color, statBonus: { hp: 5 }, rarity: 'common' },
  ];
}

// ══════════════════════════════════════════════════════════════
// SKILL TREE GENERATION
// ══════════════════════════════════════════════════════════════

async function generateSkillTree(
  archetypeId: ArchetypeId,
  identity: ClassIdentity,
  ability: GeneratedAbility
): Promise<GeneratedSkillTree> {
  const archetype = getArchetype(archetypeId);
  
  const prompt = `Generate a skill tree for this class:

CLASS: ${identity.name}
ABILITY: ${ability.name}
ARCHETYPE: ${archetype.name}
SKILL TREE HINTS: ${archetype.skillTreeHints.join(', ')}

Generate JSON with 2 paths, each with 5 nodes:
{
  "paths": [
    {
      "id": "offense",
      "name": "Offensive Path Name",
      "description": "Focus on damage",
      "color": "#ff6644",
      "nodes": [
        { "id": "off_1", "name": "Node Name", "description": "Effect", "icon": "emoji", "color": "#ff6644", "tier": 0, "position": 1, "echoCost": 3, "requires": [], "effect": { "type": "stat", "stat": "attack", "value": 2 } },
        { "id": "off_2", "name": "...", "description": "...", "icon": "...", "color": "...", "tier": 1, "position": 0, "echoCost": 5, "requires": ["off_1"], "effect": { ... } },
        { "id": "off_3", "name": "...", "description": "...", "icon": "...", "color": "...", "tier": 1, "position": 2, "echoCost": 5, "requires": ["off_1"], "effect": { ... } },
        { "id": "off_4", "name": "...", "description": "...", "icon": "...", "color": "...", "tier": 2, "position": 1, "echoCost": 8, "requires": ["off_2", "off_3"], "effect": { ... } },
        { "id": "off_5", "name": "ULTIMATE NAME", "description": "Powerful capstone", "icon": "...", "color": "...", "tier": 3, "position": 1, "echoCost": 15, "requires": ["off_4"], "effect": { "type": "unique", "description": "..." } }
      ]
    },
    {
      "id": "defense",
      "name": "Defensive/Utility Path Name",
      "description": "Focus on survival",
      "color": "#44aaff",
      "nodes": [ ... 5 nodes similar structure ... ]
    }
  ]
}

Make nodes thematic to ${identity.name} and ${archetype.name} mechanic!`;

  const response = await generateText(prompt);
  if (!response) {
    return { paths: [] };
  }
  
  const parsed = parseJSON<GeneratedSkillTree>(response);
  return parsed || { paths: [] };
}

// ══════════════════════════════════════════════════════════════
// ENEMY GENERATION
// ══════════════════════════════════════════════════════════════

async function generateEnemies(
  archetypeId: ArchetypeId,
  identity: ClassIdentity
): Promise<GeneratedEnemyDef[]> {
  const archetype = getArchetype(archetypeId);
  
  const prompt = `Generate 3 enemies designed to challenge this class:

CLASS: ${identity.name}
ARCHETYPE: ${archetype.name}
COUNTER TYPES: ${archetype.counterEnemyTypes.join(', ')}

Generate JSON array of 3 enemies:
[
  {
    "id": "snake_case",
    "name": "Enemy Name",
    "description": "Brief description",
    "char": "Single ASCII char",
    "color": "#hexcolor",
    "baseStats": { "hp": 10-20, "maxHp": same, "attack": 3-6, "defense": 0-2, "speed": 5-10 },
    "floorScaling": 1.1-1.3,
    "counterMechanic": "How this enemy counters the ${archetype.name} class",
    "abilities": [
      { "name": "Ability", "description": "What it does", "trigger": "on_hit/on_death/on_turn/low_hp", "effect": "..." }
    ],
    "xpValue": 10-25,
    "goldDrop": [5, 15],
    "minFloor": 1,
    "spawnWeight": 10
  },
  ... 2 more enemies ...
]

Make each enemy a unique challenge for ${identity.name}!`;

  const response = await generateText(prompt);
  if (!response) return [];
  
  const parsed = parseJSON<GeneratedEnemyDef[]>(response);
  return parsed || [];
}

// ══════════════════════════════════════════════════════════════
// BOSS GENERATION
// ══════════════════════════════════════════════════════════════

async function generateBoss(
  archetypeId: ArchetypeId,
  identity: ClassIdentity,
  ability: GeneratedAbility
): Promise<GeneratedBossDef> {
  const archetype = getArchetype(archetypeId);
  
  const prompt = `Generate a boss enemy that tests mastery of this class:

CLASS: ${identity.name}
ABILITY: ${ability.name}
ARCHETYPE: ${archetype.name}

Generate JSON:
{
  "id": "boss_snake_case",
  "name": "Boss Name",
  "title": "The [Dramatic Title]",
  "description": "Dark fantasy boss description",
  "char": "B",
  "color": "#hexcolor",
  "stats": { "hp": 100-150, "maxHp": same, "attack": 8-12, "defense": 3-5, "speed": 6-9 },
  "phases": [
    { "hpThreshold": 1.0, "name": "Phase 1 Name", "abilities": ["ability1", "ability2"], "description": "What happens in phase 1" },
    { "hpThreshold": 0.5, "name": "Phase 2 Name", "abilities": ["ability3", "enrage"], "description": "What changes at 50% HP" }
  ],
  "challengeDescription": "How this boss tests mastery of ${archetype.name}",
  "xpValue": 100
}

The boss should force players to USE their ${identity.name} abilities effectively!`;

  const response = await generateText(prompt);
  if (!response) {
    return {
      id: 'boss_default',
      name: 'The Guardian',
      title: 'The Dungeon\'s Heart',
      description: 'A powerful enemy',
      char: 'B',
      color: '#ff4444',
      stats: { hp: 100, maxHp: 100, attack: 10, defense: 3, speed: 7 },
      phases: [
        { hpThreshold: 1.0, name: 'Guardian', abilities: ['strike'], description: 'Normal combat' },
        { hpThreshold: 0.5, name: 'Enraged', abilities: ['frenzy'], description: 'Attacks faster' },
      ],
      challengeDescription: 'A test of strength',
      xpValue: 100,
    };
  }
  
  const parsed = parseJSON<GeneratedBossDef>(response);
  return parsed || {
    id: 'boss_default',
    name: 'The Guardian',
    title: 'The Dungeon\'s Heart',
    description: 'A powerful enemy',
    char: 'B',
    color: '#ff4444',
    stats: { hp: 100, maxHp: 100, attack: 10, defense: 3, speed: 7 },
    phases: [
      { hpThreshold: 1.0, name: 'Guardian', abilities: ['strike'], description: 'Normal combat' },
      { hpThreshold: 0.5, name: 'Enraged', abilities: ['frenzy'], description: 'Attacks faster' },
    ],
    challengeDescription: 'A test of strength',
    xpValue: 100,
  };
}

// ══════════════════════════════════════════════════════════════
// QUEST GENERATION (Simple template-based)
// ══════════════════════════════════════════════════════════════

function generateQuests(
  _archetypeId: ArchetypeId,
  identity: ClassIdentity,
  ability: GeneratedAbility
): GeneratedQuestDef[] {
  return [
    {
      id: `quest_${identity.name.toLowerCase()}_ability`,
      name: `Master of ${ability.name}`,
      description: `Use ${ability.name} 20 times in a single run`,
      objective: { type: 'use_ability' },
      target: 20,
      rewards: { echoes: 5 },
      tier: 1,
    },
    {
      id: `quest_${identity.name.toLowerCase()}_floor`,
      name: `${identity.name}'s Descent`,
      description: 'Reach floor 5 with this class',
      objective: { type: 'reach_floor' },
      target: 5,
      rewards: { echoes: 10 },
      tier: 2,
    },
    {
      id: `quest_${identity.name.toLowerCase()}_boss`,
      name: `${identity.title}'s Triumph`,
      description: 'Defeat the boss with this class',
      objective: { type: 'kill_boss' },
      target: 1,
      rewards: { echoes: 20 },
      tier: 3,
    },
  ];
}

// ══════════════════════════════════════════════════════════════
// EXPORT/IMPORT
// ══════════════════════════════════════════════════════════════

export function exportClassAsJSON(generatedClass: GeneratedClass): string {
  return JSON.stringify(generatedClass, null, 2);
}

export function importClassFromJSON(json: string): GeneratedClass | null {
  try {
    const parsed = JSON.parse(json);
    if (parsed.isGenerated && parsed.archetype && parsed.name) {
      return parsed as GeneratedClass;
    }
    return null;
  } catch {
    return null;
  }
}

export function resetGeneration(): void {
  generationState = {
    isGenerating: false,
    progress: 0,
    stage: 'idle',
    currentClass: null,
    error: null,
  };
}
