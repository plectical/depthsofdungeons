import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import type {
  StoryCharacter,
  GeneratedCharacter,
  GeneratedEncounter,
  GeneratedItem,
  SkillName,
  BloodlineData,
  PlayerClass,
  MercenaryDef,
  CharacterQuest,
  CharacterQuestType,
} from '../types';
import { fetchOrGenerateImageUrl, fetchOrGenerate, type PooledEnemyEncounter } from './contentPool';

// Available LLM models from Series SDK (as of 2026)
export type LLMModel = 'gpt-5' | 'gpt-5.4-mini' | 'claude-haiku-4-5' | 'claude-sonnet-4-6' | 'claude-opus-4-1' | 'deepseek/deepseek-chat';

// Image generation models
export type ImageModel = 'gemini-3.1-flash-image-preview' | 'gemini-3-pro-image-preview';

// Default model for content generation (use fast/cheap model for game content)
const DEFAULT_LLM_MODEL: LLMModel = 'gpt-5.4-mini';
const DEFAULT_IMAGE_MODEL: ImageModel = 'gemini-3.1-flash-image-preview';

// Generation options
export interface GenerationOptions {
  model?: LLMModel;
  temperature?: number;
  maxTokens?: number;
}

export interface ImageGenOptions {
  model?: ImageModel;
  aspectRatio?: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '16:9' | '9:16';
  removeBackground?: boolean;
  referenceImages?: string[];
}

// Style reference images from CDN (existing game art)
// NOTE: Reference images are disabled because the image generation API's backend
// cannot fetch from the game's CDN URLs (returns 404 from server-side).
// Portrait generation will rely on detailed prompts instead.

// Style reference for all character portraits - green/orange/black pixel art
const CHARACTER_PORTRAIT_STYLE = 'https://i.imgur.com/blvhjo8.png';

function getPortraitStyleReferences(): string[] {
  console.log('[AI] getPortraitStyleReferences returning:', [CHARACTER_PORTRAIT_STYLE]);
  return [CHARACTER_PORTRAIT_STYLE];
}

// Environment art references (exported for future encounter art generation)
export function getEnvironmentStyleReferences(): string[] {
  // Disabled: CDN URLs return 404 when fetched server-side by image gen API
  return [];
}

// System prompt for all dungeon content
const SYSTEM_PROMPT = `You are a creative writer for a dark fantasy roguelike dungeon crawler game called "Depths of Dungeon".

SETTING:
- An endless dungeon filled with goblins, undead, demons, and ancient evils
- Tone is dark but with moments of dark humor and morally gray choices
- Players are descendants of adventurers who keep dying and returning (bloodline mechanic)
- Each run is different; players descend deeper each time

STYLE:
- Concise, punchy dialogue (max 150 chars per line)
- Dark fantasy vocabulary (ancient, forsaken, cursed, etc.)
- Characters have clear motivations and secrets
- Skill checks use: Stealth, Diplomacy, Athletics, Awareness, Lore, Survival

OUTPUT: Always respond with valid JSON matching the requested schema. No markdown, no explanation, just JSON.`;

// Parse JSON safely from LLM response
function parseJSON<T>(content: string): T | null {
  try {
    // Strip markdown code blocks if present
    let cleaned = content.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    return JSON.parse(cleaned.trim());
  } catch (e) {
    console.error('Failed to parse LLM JSON response:', e, content);
    return null;
  }
}

// Generate text using Series AI
async function generateText(
  prompt: string,
  options: GenerationOptions = {}
): Promise<string | null> {
  try {
    // Pre-check authentication
    if (RundotGameAPI.accessGate.isAnonymous()) {
      console.warn('[AI] Cannot generate text - user not logged in');
      return null;
    }
    
    const modelToUse = options.model ?? DEFAULT_LLM_MODEL;
    console.log('[AI] Requesting LLM completion with model:', modelToUse);
    
    const result = await RundotGameAPI.ai.requestChatCompletionAsync({
      model: modelToUse,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      maxTokens: options.maxTokens ?? 2000,
      temperature: options.temperature ?? 0.8,
    });

    // The SDK returns { message: string } according to docs
    const content = (result as { message?: string }).message ?? 
                    result.choices?.[0]?.message?.content ?? 
                    null;
    console.log('[AI] LLM response received:', content ? `length=${content.length}` : 'null');
    console.log('[AI] Full result structure:', JSON.stringify(result).substring(0, 200));
    return content;
  } catch (e: unknown) {
    const errorName = (e as { name?: string })?.name;
    if (errorName === 'AccessDeniedError') {
      console.warn('[AI] Text generation blocked - login required');
    } else {
      console.error('[AI] Series AI text generation failed:', e);
    }
    return null;
  }
}

// Generate image using Series AI
async function generateImage(
  prompt: string,
  options: ImageGenOptions = {}
): Promise<string | null> {
  try {
    // Pre-check authentication
    const isAnon = RundotGameAPI.accessGate.isAnonymous();
    console.log('[AI] generateImage called, isAnonymous:', isAnon);
    
    if (isAnon) {
      console.warn('[AI] Cannot generate image - user not logged in');
      return null;
    }
    
    console.log('[AI] Requesting image generation with model:', options.model ?? DEFAULT_IMAGE_MODEL);
    console.log('[AI] Image prompt:', prompt.substring(0, 100) + '...');
    if (options.referenceImages?.length) {
      console.log('[AI] Using reference images:', options.referenceImages);
    }
    
    console.log('[AI] Calling RundotGameAPI.imageGen.generate...');
    const result = await RundotGameAPI.imageGen.generate({
      prompt,
      model: options.model ?? DEFAULT_IMAGE_MODEL,
      aspectRatio: options.aspectRatio ?? '1:1',
      removeBackground: options.removeBackground ?? false,
      referenceImages: options.referenceImages,
    });

    console.log('[AI] Image generated successfully:', result.imageUrl?.substring(0, 50) + '...');
    return result.imageUrl;
  } catch (e: unknown) {
    const errorName = (e as { name?: string })?.name;
    const errorMessage = (e as { message?: string })?.message;
    if (errorName === 'AccessDeniedError') {
      console.warn('[AI] Image generation blocked - login required');
    } else {
      console.error('[AI] Series AI image generation failed:', errorName, errorMessage, e);
    }
    return null;
  }
}

// Get available LLM models
export async function getAvailableModels(): Promise<string[]> {
  try {
    return await RundotGameAPI.ai.getAvailableCompletionModels();
  } catch (e) {
    console.error('Failed to get available models:', e);
    return [];
  }
}

// Generate a story character
export async function generateCharacter(context: {
  playerClass: PlayerClass;
  floorRange: [number, number];
  existingCharacterNames: string[];
  bloodlineGeneration: number;
}): Promise<GeneratedCharacter | null> {
  const prompt = `Generate a unique dungeon character for floors ${context.floorRange[0]}-${context.floorRange[1]}.

CONTEXT:
- Player class: ${context.playerClass}
- Bloodline generation: ${context.bloodlineGeneration}
- Avoid these existing names: ${context.existingCharacterNames.join(', ') || 'none'}

GENERATE a character with this JSON schema:
{
  "id": "unique_snake_case_id",
  "name": "Character Name",
  "title": "The Descriptive Title",
  "race": "goblin" | "human" | "undead" | "demon" | "elemental" | "beast",
  "role": "ally" | "enemy" | "neutral" | "wild_card",
  "traits": ["trait1", "trait2", "trait3"],
  "motivation": "What they want (1 sentence)",
  "secret": "Hidden truth about them (1 sentence)",
  "appearanceDescription": "Physical description for portrait generation (2-3 sentences)",
  "char": "Single ASCII character to represent on map",
  "color": "#hexcolor",
  "introFloorRange": [${context.floorRange[0]}, ${context.floorRange[1]}],
  "introDialogue": "Their first words when encountered",
  "relationshipTiers": [
    { "id": "hostile", "threshold": -50, "dialogue": "Hostile greeting", "unlocks": [] },
    { "id": "wary", "threshold": -20, "dialogue": "Wary greeting", "unlocks": [] },
    { "id": "neutral", "threshold": 0, "dialogue": "Neutral greeting", "unlocks": [] },
    { "id": "friendly", "threshold": 30, "dialogue": "Friendly greeting", "unlocks": ["beat_friendship"] },
    { "id": "allied", "threshold": 60, "dialogue": "Allied greeting", "unlocks": ["recruitment"] }
  ],
  "recruitable": true/false,
  "recruitmentCondition": "Condition to recruit (if recruitable)",
  "mercenaryStats": { "hp": N, "maxHp": N, "attack": N, "defense": N, "speed": N } (if recruitable)
}`;

  console.log('[AI] Generating character for floors', context.floorRange);
  const content = await generateText(prompt, { temperature: 0.9 });
  
  if (!content) {
    console.warn('[AI] generateCharacter: No content returned from LLM');
    return null;
  }
  
  console.log('[AI] Character response length:', content.length);

  const parsed = parseJSON<Omit<GeneratedCharacter, 'isGenerated' | 'generatedAt'>>(content);
  if (!parsed) {
    console.warn('[AI] generateCharacter: Failed to parse JSON:', content.substring(0, 200));
    return null;
  }

  console.log('[AI] ✓ Generated character:', parsed.name, '-', parsed.title);
  return {
    ...parsed,
    isGenerated: true,
    generatedAt: new Date().toISOString(),
  };
}

// Generate a story beat (dialogue) for a character with boon rewards
export async function generateStoryBeat(character: {
  id: string;
  name: string;
  title?: string;
  race: string;
  role: string;
  traits: string[];
  motivation: string;
  secret: string;
  introDialogue: string;
}): Promise<import('../types').NarrativeBeat | null> {
  const prompt = `Generate a MULTI-STEP dialogue scene for this character in a dark fantasy dungeon.

CHARACTER:
- Name: ${character.name}
- Title: ${character.title || 'Unknown'}
- Race: ${character.race}
- Role: ${character.role} 
- Traits: ${character.traits.join(', ')}
- Motivation: ${character.motivation}
- Secret: ${character.secret}

Create a RICH, BRANCHING dialogue with multiple steps. The player should make meaningful choices that lead to different outcomes and rewards.

Generate JSON with this schema:
{
  "rootNodeId": "scene_1",
  "boonName": "<creative 2-3 word name for the boon>",
  "boonFlavor": "<character's blessing words, 1 sentence>",
  "boonIcon": "<single ASCII char>",
  "boonColor": "<hex color>",
  "nodes": {
    "scene_1": {
      "id": "scene_1",
      "speaker": "narrator",
      "text": "<dramatic scene-setting description, 2-3 sentences>",
      "nextNodeId": "character_greeting"
    },
    "character_greeting": {
      "id": "character_greeting",
      "speaker": "character",
      "characterId": "${character.id}",
      "text": "<character's first words, revealing personality, 1-2 sentences>",
      "choices": [
        {
          "id": "ask_help",
          "label": "Ask for their help",
          "responseText": "You ask if they can assist you.",
          "successNodeId": "help_response"
        },
        {
          "id": "offer_trade",
          "label": "[Diplomacy] Propose a trade",
          "responseText": "You offer to make a deal.",
          "skillCheck": { "skill": "diplomacy", "target": 9 },
          "successNodeId": "trade_success",
          "failureNodeId": "trade_fail",
          "boonType": "gold_find",
          "boonValue": 20
        },
        {
          "id": "demand",
          "label": "[Athletics] Intimidate them",
          "responseText": "You step forward menacingly.",
          "skillCheck": { "skill": "athletics", "target": 11 },
          "successNodeId": "intimidate_success",
          "failureNodeId": "intimidate_fail",
          "boonType": "damage_boost",
          "boonValue": 20
        },
        {
          "id": "inquire_secret",
          "label": "[Awareness] Notice something hidden",
          "responseText": "You notice something unusual about them.",
          "skillCheck": { "skill": "awareness", "target": 10 },
          "successNodeId": "secret_discovered",
          "failureNodeId": "secret_missed",
          "boonType": "evasion",
          "boonValue": 8
        }
      ]
    },
    "help_response": {
      "id": "help_response",
      "speaker": "character",
      "characterId": "${character.id}",
      "text": "<character considers helping, asks for something in return, 1-2 sentences>",
      "choices": [
        {
          "id": "agree_task",
          "label": "Agree to help them first",
          "successNodeId": "task_accepted",
          "boonType": "hp_regen",
          "boonValue": 8
        },
        {
          "id": "refuse_task",
          "label": "Refuse their condition",
          "successNodeId": "refuse_outcome"
        }
      ]
    },
    "task_accepted": {
      "id": "task_accepted",
      "speaker": "character",
      "characterId": "${character.id}",
      "text": "<character is pleased, explains their need, offers strong reward, 1-2 sentences>",
      "grantsBoon": true,
      "boonMultiplier": 1.3,
      "nextNodeId": "final_blessing"
    },
    "refuse_outcome": {
      "id": "refuse_outcome",
      "speaker": "character",
      "characterId": "${character.id}",
      "text": "<character is disappointed but understanding, offers lesser help, 1-2 sentences>",
      "grantsBoon": true,
      "boonMultiplier": 0.5,
      "boonType": "defense_boost",
      "boonValue": 2,
      "nextNodeId": "end"
    },
    "trade_success": {
      "id": "trade_success",
      "speaker": "character",
      "characterId": "${character.id}",
      "text": "<impressed by negotiation, agrees to favorable terms, 1-2 sentences>",
      "grantsBoon": true,
      "boonMultiplier": 1.5,
      "nextNodeId": "trade_complete"
    },
    "trade_fail": {
      "id": "trade_fail",
      "speaker": "character",
      "characterId": "${character.id}",
      "text": "<not impressed, offers unfavorable terms, 1-2 sentences>",
      "grantsBoon": true,
      "boonMultiplier": 0.5,
      "nextNodeId": "end"
    },
    "trade_complete": {
      "id": "trade_complete",
      "speaker": "narrator",
      "text": "<exchange happens, both parties satisfied, 1 sentence>",
      "nextNodeId": "final_blessing"
    },
    "intimidate_success": {
      "id": "intimidate_success",
      "speaker": "character",
      "characterId": "${character.id}",
      "text": "<character is genuinely frightened, offers everything they have, 1-2 sentences>",
      "grantsBoon": true,
      "boonMultiplier": 1.5,
      "nextNodeId": "intimidate_choice"
    },
    "intimidate_choice": {
      "id": "intimidate_choice",
      "speaker": "narrator",
      "text": "They cower before you. Show mercy or take everything?",
      "choices": [
        {
          "id": "show_mercy",
          "label": "Show mercy, take only what you need",
          "successNodeId": "mercy_ending",
          "boonType": "hp_regen",
          "boonValue": 5
        },
        {
          "id": "take_all",
          "label": "Take everything",
          "successNodeId": "ruthless_ending",
          "boonType": "lifesteal",
          "boonValue": 8
        }
      ]
    },
    "mercy_ending": {
      "id": "mercy_ending",
      "speaker": "character",
      "characterId": "${character.id}",
      "text": "<grateful for mercy, genuine thanks, unexpected bonus, 1-2 sentences>",
      "grantsBoon": true,
      "boonMultiplier": 1.2,
      "nextNodeId": "end"
    },
    "ruthless_ending": {
      "id": "ruthless_ending",
      "speaker": "narrator",
      "text": "<you take everything, they flee, darker outcome, 1 sentence>",
      "grantsBoon": true,
      "boonMultiplier": 1.3,
      "nextNodeId": "end"
    },
    "intimidate_fail": {
      "id": "intimidate_fail",
      "speaker": "character",
      "characterId": "${character.id}",
      "text": "<not impressed by threats, but respects the attempt, 1-2 sentences>",
      "grantsBoon": true,
      "boonMultiplier": 0.7,
      "nextNodeId": "end"
    },
    "secret_discovered": {
      "id": "secret_discovered",
      "speaker": "narrator",
      "text": "<you notice their hidden nature/item/truth, dramatic reveal, 2 sentences>",
      "nextNodeId": "secret_reaction"
    },
    "secret_reaction": {
      "id": "secret_reaction",
      "speaker": "character",
      "characterId": "${character.id}",
      "text": "<surprised you noticed, reveals more about themselves, 1-2 sentences>",
      "choices": [
        {
          "id": "keep_secret",
          "label": "Promise to keep their secret",
          "successNodeId": "secret_kept",
          "boonType": "stealth",
          "boonValue": 3
        },
        {
          "id": "use_knowledge",
          "label": "Use this knowledge as leverage",
          "successNodeId": "leverage_outcome",
          "boonType": "crit_chance",
          "boonValue": 10
        }
      ]
    },
    "secret_kept": {
      "id": "secret_kept",
      "speaker": "character",
      "characterId": "${character.id}",
      "text": "<deeply grateful, shares powerful secret in return, 1-2 sentences>",
      "grantsBoon": true,
      "boonMultiplier": 1.5,
      "nextNodeId": "final_blessing"
    },
    "leverage_outcome": {
      "id": "leverage_outcome",
      "speaker": "character",
      "characterId": "${character.id}",
      "text": "<begrudgingly complies, resentful but helpful, 1-2 sentences>",
      "grantsBoon": true,
      "boonMultiplier": 1.2,
      "nextNodeId": "end"
    },
    "secret_missed": {
      "id": "secret_missed",
      "speaker": "narrator",
      "text": "<nothing seems unusual, opportunity missed, 1 sentence>",
      "nextNodeId": "character_greeting"
    },
    "final_blessing": {
      "id": "final_blessing",
      "speaker": "character",
      "characterId": "${character.id}",
      "text": "<character bestows their blessing with meaningful words, 1-2 sentences>",
      "grantsBoon": true,
      "boonMultiplier": 1.0,
      "nextNodeId": "end"
    },
    "end": {
      "id": "end",
      "speaker": "narrator",
      "text": "<atmospheric closing, the character fades into the dungeon, 1 sentence>"
    }
  }
}

Valid boonType: damage_boost, defense_boost, hp_regen, gold_find, xp_boost, crit_chance, lifesteal, evasion, first_strike, thorns
Keep text under 150 chars. Create unique dialogue for ${character.name}'s personality.`;

  const content = await generateText(prompt, { temperature: 0.9 });
  if (!content) return null;

  const parsed = parseJSON<{
    rootNodeId: string;
    boonName: string;
    boonFlavor: string;
    boonIcon: string;
    boonColor: string;
    nodes: Record<string, unknown>;
  }>(content);
  if (!parsed) return null;

  // Store boon metadata for later use when dialogue completes
  const boonMeta = {
    name: parsed.boonName || `${character.name}'s Blessing`,
    flavorText: parsed.boonFlavor || `${character.name} grants you power.`,
    icon: parsed.boonIcon || '*',
    color: parsed.boonColor || '#ffaa33',
  };

  // Inject boon metadata into nodes that grant boons
  const nodes = parsed.nodes as Record<string, Record<string, unknown>>;
  for (const node of Object.values(nodes)) {
    if (node['grantsBoon']) {
      node['boonMeta'] = boonMeta;
    }
  }

  console.log('[AI] Generated story beat with boon:', boonMeta.name);

  return {
    id: `beat_${character.id}_intro`,
    characterId: character.id,
    beatType: 'intro',
    trigger: { type: 'floor', floorRange: [1, 3] },
    dialogue: {
      rootNodeId: parsed.rootNodeId,
      nodes: nodes as unknown as import('../types').StoryDialogueTree['nodes'],
    },
    effects: [],
  };
}

// Character archetypes for trapped souls in the dungeon
const SOUL_ARCHETYPES = [
  'lost_soul', // Once human, trapped here so long they've forgotten why
  'corrupted', // Embraced the dungeon's nature, preys on others to survive
  'desperate', // Will do anything to escape, even betray you
  'broken', // Given up hope, just wants to feel something
  'scheming', // Pretends friendship but plans to use you
  'genuine', // Rare - actually wants to help, may sacrifice for you
  'vengeful', // Hates all who enter, blames adventurers for their fate
  'merchant', // Found purpose in trading, neutral but opportunistic
];

// Enemy encounter return type
type EnemyEncounterResult = {
  portraitPrompt: string;
  characterName: string;
  characterTitle: string;
  dialogue: import('../types').StoryDialogueTree;
  rewards: Record<string, { gold?: number; item?: string; boonType?: string; boonValue?: number }>;
  quest?: {
    name: string;
    description: string;
    objective: string;
    targetType?: string;
    targetCount: number;
    goldReward: number;
    echoReward: number;
  };
};

// Internal enemy encounter generation (without pool)
async function _generateEnemyEncounterDirect(enemy: {
  name: string;
  race: string;
  description: string;
  isBoss: boolean;
  element?: string;
}): Promise<EnemyEncounterResult | null> {
  const archetype = SOUL_ARCHETYPES[Math.floor(Math.random() * SOUL_ARCHETYPES.length)];
  
  const prompt = `Generate a DEEP, MEANINGFUL enemy encounter for a dark fantasy dungeon game.

SETTING CONTEXT:
Everyone in this dungeon is TRAPPED. They cannot leave. They have been here for years, decades, centuries.
Some have lost their humanity and become predators. Some desperately cling to hope. Some have given up entirely.
Some will betray you. Some might genuinely help. ALL have a story.

ENEMY TYPE: ${enemy.name}
RACE: ${enemy.race}  
DESCRIPTION: ${enemy.description}
IS BOSS: ${enemy.isBoss}
ELEMENT: ${enemy.element || 'none'}

CRITICAL: Generate a UNIQUE NAME and TITLE for this creature. NOT just "${enemy.name}" but a real name like:
- "Grulk the Hollow" (goblin)
- "Sister Meridia" (ghost)
- "The Weeping One" (zombie)
- "Skrix, Keeper of Keys" (skeleton)

CHARACTER ARCHETYPE: ${archetype}
Use this to inform their personality, but make them UNIQUE. Give them:
- A UNIQUE NAME (required!) and TITLE
- A BACKSTORY: How did they end up here? What have they lost?
- A MOTIVATION: What do they want? Why might they help OR betray you?
- EMOTIONAL DEPTH: They should feel like a real person trapped in hell

QUEST SYSTEM:
If the player chooses the RIGHT dialogue path (diplomacy, compassion, or clever observation), 
the creature may reveal a SECRET QUEST. This quest should:
- Relate to their backstory (find their lost item, avenge them, deliver a message)
- Have a clear objective (kill X enemies, find an item, reach floor X)
- Offer meaningful rewards

POSSIBLE OUTCOMES (include several):
- They genuinely help you (rare, meaningful)
- They ask for something (food, gold, an item, information)
- They reveal a SECRET QUEST if you're kind/clever
- They offer a deal that might be a trap
- They share their story and let you pass
- They try to steal from YOU
- They backstab you after seeming friendly
- They attack out of hatred/fear/hunger
- They beg for death
- They warn you about something ahead
- They ask you to carry a message (if you ever escape)
- They teach you a secret technique
- They offer to trade items
- They challenge you to a game of wits
- They mistake you for someone from their past
- They offer to join you temporarily

OFFENSIVE OPTIONS (IMPORTANT - include at least 2-3 of these):
Players should be able to INSULT, MOCK, or OFFEND the creature. When offended, the creature becomes ENRAGED:
- "enraged_combat" node: They attack with fury, dealing +50% damage in the fight
- Mark with "enragedCombat": true so the game knows to buff them

OFFENSIVE CHOICE EXAMPLES:
- "You're pathetic. No wonder you're trapped here."
- "Your kind disgusts me"
- "[Mock] Imitate their speech/mannerisms cruelly"
- "I'll put you out of your misery like the beast you are"
- "[Insult] Comment on their appearance"
- "You're not worth my time, worm"
- "[Laugh] Mock their tragic story"
- "Your suffering amuses me"
- "I've killed hundreds like you"
- "[Spit] Show contempt"

When offended, they should say something that shows their RAGE before attacking:
- "You dare mock me?! I'LL TEAR YOU APART!"
- "I showed you my soul and you LAUGHED? DIE!"
- "That insult will be your last words!"

The enraged_combat node MUST have: "enragedCombat": true, "combatStart": true

TRANSFORMATION/AFFLICTION OPTIONS (for goblins, undead, demons, beasts):
If the creature is a GOBLIN, UNDEAD, DEMON, or BEAST, include at least ONE path that could lead to:
- Getting BITTEN during combat or a trap ("bitten" choice)
- Accepting a BLOOD PACT or dark gift ("accept_transformation" or "blood_pact" choice)
- Drinking something they offer ("drink_blood" or "accept_gift" choice)
- Being CURSED as punishment or blessing ("curse" or "infected" choice)
These lead to TRANSFORMATION - the player slowly becomes like them! Use choice IDs like "bitten", "accept_transformation", "blood_pact", "drink_blood", "accept_gift", "curse", or "infected" so the game can detect them.

Example for a goblin:
- "Let me join your tribe" -> they bite you as initiation -> "bitten" choice
- They offer strange mushroom brew -> accept_gift choice
- Goblin curses you in their language -> curse choice

Generate JSON with this structure:
{
  "portraitPrompt": "<portrait description - haunted eyes, specific features, 2 sentences>",
  "characterName": "<their UNIQUE NAME - like 'Grulk' or 'Sister Meridia' or 'The Weeping One'>",
  "characterTitle": "<their title - like 'the Hollow', 'Keeper of Keys', 'Last of the Watchers'>",
  "backstory": "<2-3 sentences about who they were and how they got trapped>",
  "rootNodeId": "encounter",
  "nodes": {
    "encounter": {
      "id": "encounter",
      "speaker": "narrator", 
      "text": "<atmospheric description - what do you see? What's their body language? 2-3 sentences>",
      "choices": [
        {
          "id": "approach",
          "label": "[Approach] Move closer carefully",
          "responseText": "You step forward slowly.",
          "successNodeId": "first_contact"
        },
        {
          "id": "call_out",
          "label": "[Call Out] Speak to them",
          "responseText": "You call out to get their attention.",
          "successNodeId": "they_respond"
        },
        {
          "id": "observe_first",
          "label": "[Observe] Watch from shadows",
          "responseText": "You hang back and observe.",
          "skillCheck": { "skill": "awareness", "target": 10 },
          "successNodeId": "notice_detail",
          "failureNodeId": "they_notice_you"
        },
        {
          "id": "insult",
          "label": "[Insult] <context-appropriate cruel mockery>",
          "responseText": "You hurl an insult.",
          "successNodeId": "enraged_reaction"
        },
        {
          "id": "attack_immediately",
          "label": "[Attack] Strike first",
          "responseText": "You attack without warning.",
          "successNodeId": "combat_start"
        }
      ]
    },
    "enraged_reaction": {
      "id": "enraged_reaction",
      "speaker": "character",
      "text": "<they react with FURY to your insult - their face twists with rage, voice breaks with anger, 2 sentences showing they're ENRAGED>",
      "nextNodeId": "enraged_combat"
    },
    "enraged_combat": {
      "id": "enraged_combat",
      "speaker": "narrator",
      "text": "They attack with murderous rage! <dramatic combat initiation, 1 sentence>",
      "enragedCombat": true,
      "combatStart": true
    },
    "first_contact": {
      "id": "first_contact",
      "speaker": "character",
      "text": "<their first words - revealing personality, maybe asking who you are, 2 sentences>",
      "choices": [
        {
          "id": "be_friendly",
          "label": "I mean no harm",
          "responseText": "You show your empty hands.",
          "successNodeId": "conversation_friendly"
        },
        {
          "id": "be_cautious", 
          "label": "What do you want?",
          "responseText": "You keep your guard up.",
          "successNodeId": "they_explain"
        },
        {
          "id": "share_food",
          "label": "[Offer] Share some of your rations",
          "responseText": "You offer food.",
          "successNodeId": "grateful_for_food"
        },
        {
          "id": "ask_lore",
          "label": "[Lore] Ask about this place's history",
          "responseText": "You inquire about the dungeon.",
          "skillCheck": { "skill": "lore", "target": 10 },
          "successNodeId": "share_knowledge",
          "failureNodeId": "refuse_knowledge"
        },
        {
          "id": "mock_appearance",
          "label": "[Mock] <cruel comment about their appearance or state>",
          "responseText": "You sneer at them.",
          "successNodeId": "enraged_reaction"
        },
        {
          "id": "threaten",
          "label": "Stand aside or die",
          "responseText": "You brandish your weapon.",
          "skillCheck": { "skill": "diplomacy", "target": 12 },
          "successNodeId": "they_cower",
          "failureNodeId": "they_attack"
        }
      ]
    },
    "grateful_for_food": {
      "id": "grateful_for_food",
      "speaker": "character",
      "text": "<they react to your kindness with surprise - food is precious here. Shows vulnerability. 2-3 sentences>",
      "reward": "food_gift",
      "nextNodeId": "conversation_friendly"
    },
    "share_knowledge": {
      "id": "share_knowledge",
      "speaker": "character",
      "text": "<they share ancient knowledge about this place - secrets, dangers, or history. 3-4 sentences>",
      "reward": "lore_bonus",
      "peacefulEnd": true
    },
    "refuse_knowledge": {
      "id": "refuse_knowledge",
      "speaker": "character",
      "text": "<they don't trust you enough to share knowledge. 1-2 sentences>",
      "nextNodeId": "they_explain"
    },
    "they_respond": {
      "id": "they_respond",
      "speaker": "character",
      "text": "<their response to being called - suspicion? Hope? Fear? 2 sentences>",
      "nextNodeId": "first_contact"
    },
    "notice_detail": {
      "id": "notice_detail",
      "speaker": "narrator",
      "text": "<you notice something important - a weapon hidden? They're injured? Crying? Hoarding food? 2 sentences>",
      "choices": [
        {
          "id": "use_knowledge",
          "label": "Use what you learned",
          "responseText": "You approach with this knowledge.",
          "successNodeId": "informed_approach"
        },
        {
          "id": "sneak_past",
          "label": "[Stealth] Try to sneak past entirely",
          "responseText": "You attempt to bypass them.",
          "skillCheck": { "skill": "stealth", "target": 14 },
          "successNodeId": "sneak_success",
          "failureNodeId": "they_notice_you"
        }
      ]
    },
    "they_notice_you": {
      "id": "they_notice_you",
      "speaker": "character",
      "text": "<they spot you - their reaction based on archetype, 1-2 sentences>",
      "nextNodeId": "first_contact"
    },
    "conversation_friendly": {
      "id": "conversation_friendly",
      "speaker": "character",
      "text": "<they open up slightly - share a fragment of their story, maybe make a request, 3-4 sentences>",
      "choices": [
        {
          "id": "hear_story",
          "label": "Tell me more about yourself",
          "responseText": "You listen.",
          "successNodeId": "full_backstory"
        },
        {
          "id": "help_them",
          "label": "<offer help based on their need>",
          "responseText": "You offer assistance.",
          "successNodeId": "help_outcome"
        },
        {
          "id": "trade_items",
          "label": "[Trade] Offer to exchange items",
          "responseText": "You suggest a trade.",
          "successNodeId": "trade_discussion"
        },
        {
          "id": "ask_allies",
          "label": "Do you know anyone else down here?",
          "responseText": "You ask about others.",
          "successNodeId": "reveal_allies"
        },
        {
          "id": "mock_story",
          "label": "[Cruel] Your sob story bores me",
          "responseText": "You laugh at their pain.",
          "successNodeId": "enraged_reaction"
        },
        {
          "id": "refuse",
          "label": "I can't help you",
          "responseText": "You shake your head.",
          "successNodeId": "refuse_outcome"
        }
      ]
    },
    "trade_discussion": {
      "id": "trade_discussion",
      "speaker": "character",
      "text": "<they consider trading - what do they have? What do they want? 2 sentences>",
      "choices": [
        {
          "id": "accept_trade",
          "label": "That seems fair",
          "responseText": "You agree to trade.",
          "successNodeId": "trade_complete"
        },
        {
          "id": "haggle",
          "label": "[Diplomacy] Negotiate better terms",
          "responseText": "You try to negotiate.",
          "skillCheck": { "skill": "diplomacy", "target": 11 },
          "successNodeId": "better_trade",
          "failureNodeId": "trade_refused"
        }
      ]
    },
    "trade_complete": {
      "id": "trade_complete",
      "speaker": "narrator",
      "text": "The exchange is made. Both parties got something they needed.",
      "reward": "trade_reward",
      "peacefulEnd": true
    },
    "better_trade": {
      "id": "better_trade",
      "speaker": "character",
      "text": "<impressed by your negotiation, they offer more. 1-2 sentences>",
      "reward": "negotiation_reward",
      "peacefulEnd": true
    },
    "trade_refused": {
      "id": "trade_refused",
      "speaker": "character",
      "text": "<offended by the haggling, they withdraw their offer. 1 sentence>",
      "nextNodeId": "refuse_outcome"
    },
    "reveal_allies": {
      "id": "reveal_allies",
      "speaker": "character",
      "text": "<they mention others - allies, enemies, or neutral parties deeper in the dungeon. 2-3 sentences>",
      "reward": "information_reward",
      "peacefulEnd": true
    },
    "they_explain": {
      "id": "they_explain",
      "speaker": "character",
      "text": "<they explain what they want - could be genuine or a setup, 2-3 sentences>",
      "choices": [
        {
          "id": "agree",
          "label": "Alright, I'll help",
          "responseText": "You agree.",
          "successNodeId": "deal_outcome"
        },
        {
          "id": "negotiate",
          "label": "What's in it for me?",
          "responseText": "You negotiate.",
          "successNodeId": "negotiation"
        },
        {
          "id": "decline",
          "label": "Not interested",
          "responseText": "You decline.",
          "successNodeId": "decline_outcome"
        }
      ]
    },
    "full_backstory": {
      "id": "full_backstory",
      "speaker": "character",
      "text": "<their full story - tragic, horrifying, or surprisingly hopeful - this should HIT HARD, 4-5 sentences>",
      "reward": "heard_story",
      "nextNodeId": "after_story"
    },
    "after_story": {
      "id": "after_story",
      "speaker": "narrator",
      "text": "<the moment after - silence, a tear, a bitter laugh? 1 sentence>",
      "choices": [
        {
          "id": "comfort",
          "label": "I'm sorry for what you've been through",
          "responseText": "You offer sympathy.",
          "successNodeId": "grateful_end"
        },
        {
          "id": "promise",
          "label": "If I escape, I'll tell your story",
          "responseText": "You make a promise.",
          "successNodeId": "hopeful_end"
        },
        {
          "id": "cold",
          "label": "We all have our tragedies",
          "responseText": "You remain distant.",
          "successNodeId": "cold_end"
        }
      ]
    },
    "help_outcome": {
      "id": "help_outcome",
      "speaker": "narrator",
      "text": "<outcome of helping - maybe they're grateful, maybe it was a trap, maybe bittersweet, 2 sentences>",
      "reward": "help_reward",
      "peacefulEnd": true
    },
    "deal_outcome": {
      "id": "deal_outcome",
      "speaker": "narrator",
      "text": "<outcome of the deal - based on archetype, could be betrayal or genuine aid, 2-3 sentences>",
      "reward": "deal_reward"
    },
    "negotiation": {
      "id": "negotiation",
      "speaker": "character",
      "text": "<their counteroffer - what can they give you? 1-2 sentences>",
      "choices": [
        {
          "id": "accept_deal",
          "label": "Deal",
          "responseText": "You shake on it.",
          "successNodeId": "negotiation_success"
        },
        {
          "id": "walk_away",
          "label": "Forget it",
          "responseText": "You turn to leave.",
          "successNodeId": "walk_away_outcome"
        }
      ]
    },
    "they_cower": {
      "id": "they_cower",
      "speaker": "character",
      "text": "<they back down, defeated - shows their broken spirit, 1-2 sentences>",
      "reward": "intimidate_success",
      "peacefulEnd": true
    },
    "they_attack": {
      "id": "they_attack",
      "speaker": "character",
      "text": "<they attack out of fear/anger - last words before combat, 1 sentence>",
      "combatStart": true
    },
    "combat_start": {
      "id": "combat_start",
      "speaker": "narrator",
      "text": "Combat begins.",
      "combatStart": true
    },
    "grateful_end": {
      "id": "grateful_end",
      "speaker": "character",
      "text": "<genuine gratitude - rare human connection in this hellscape, 2 sentences>",
      "reward": "compassion_reward",
      "peacefulEnd": true
    },
    "hopeful_end": {
      "id": "hopeful_end",
      "speaker": "character",
      "text": "<a moment of hope - maybe the first in years, 2 sentences>",
      "reward": "promise_reward",
      "peacefulEnd": true
    },
    "cold_end": {
      "id": "cold_end",
      "speaker": "narrator",
      "text": "<they accept this, retreat into themselves, let you pass, 1 sentence>",
      "peacefulEnd": true
    },
    "refuse_outcome": {
      "id": "refuse_outcome",
      "speaker": "character",
      "text": "<their reaction to refusal - based on archetype: acceptance, anger, desperation, 1-2 sentences>",
      "choices": [
        {
          "id": "leave_anyway",
          "label": "I'm leaving now",
          "successNodeId": "tense_departure"
        },
        {
          "id": "reconsider",
          "label": "Wait... maybe I can help after all",
          "successNodeId": "help_outcome"
        }
      ]
    },
    "tense_departure": {
      "id": "tense_departure",
      "speaker": "narrator",
      "text": "<you leave, but feel their eyes on your back - will they attack? Let you go? 1-2 sentences>",
      "peacefulEnd": true
    },
    "sneak_success": {
      "id": "sneak_success",
      "speaker": "narrator",
      "text": "You slip past unnoticed. Behind you, they continue their solitary existence.",
      "peacefulEnd": true
    },
    "informed_approach": {
      "id": "informed_approach",
      "speaker": "narrator",
      "text": "<your knowledge changes the interaction - leverage or compassion, 1 sentence>",
      "nextNodeId": "first_contact"
    },
    "decline_outcome": {
      "id": "decline_outcome",
      "speaker": "character",
      "text": "<their reaction - could be anything from understanding to violent, 1-2 sentences>",
      "peacefulEnd": true
    },
    "negotiation_success": {
      "id": "negotiation_success",
      "speaker": "narrator",
      "text": "<the deal is struck - both sides get something, 1-2 sentences>",
      "reward": "negotiation_reward",
      "peacefulEnd": true
    },
    "walk_away_outcome": {
      "id": "walk_away_outcome",
      "speaker": "narrator",
      "text": "<you leave - their reaction as you go, 1 sentence>",
      "peacefulEnd": true
    },
    "quest_reveal": {
      "id": "quest_reveal",
      "speaker": "character",
      "text": "<they reveal a secret quest - something from their past that haunts them. They need YOU to do something for them. 3-4 sentences. Make it personal and tied to their backstory.>",
      "choices": [
        {
          "id": "accept_quest",
          "label": "I'll do it",
          "responseText": "You accept their burden.",
          "successNodeId": "quest_accepted"
        },
        {
          "id": "refuse_quest",
          "label": "I can't promise that",
          "responseText": "You shake your head.",
          "successNodeId": "quest_refused"
        }
      ]
    },
    "quest_accepted": {
      "id": "quest_accepted",
      "speaker": "character",
      "text": "<their gratitude - a glimmer of hope, maybe the first in years. This is IMPORTANT to them. 2 sentences>",
      "reward": "quest_accepted",
      "peacefulEnd": true,
      "grantsQuest": true
    },
    "quest_refused": {
      "id": "quest_refused",
      "speaker": "character",
      "text": "<their disappointment - understanding but saddened. They let you go. 1-2 sentences>",
      "peacefulEnd": true
    }
  },
  "rewards": {
    "heard_story": { "boonType": "xp_boost", "boonValue": 15 },
    "help_reward": { "gold": 30, "boonType": "hp_regen", "boonValue": 3 },
    "deal_reward": { "gold": 50 },
    "intimidate_success": { "gold": 25 },
    "compassion_reward": { "boonType": "defense_boost", "boonValue": 2 },
    "promise_reward": { "boonType": "damage_boost", "boonValue": 10 },
    "negotiation_reward": { "gold": 40, "item": "mysterious_trinket" },
    "quest_accepted": { "boonType": "damage_boost", "boonValue": 5 }
  },
  "quest": {
    "name": "<quest name - evocative, related to their story>",
    "description": "<what they want you to do and WHY it matters to them, 2 sentences>",
    "objective": "kill_enemies|find_item|reach_floor|survive_floors",
    "targetType": "<enemy type or item name or floor number>",
    "targetCount": 5,
    "goldReward": 100,
    "echoReward": 25
  }
}

IMPORTANT: Make this encounter MEMORABLE. The player should FEEL something. 
- If archetype is 'corrupted' or 'scheming', include a BETRAYAL outcome.
- If archetype is 'genuine', make their help MEANINGFUL but perhaps costly.
- If archetype is 'broken', make the player confront existential despair.
- Include at least ONE moment that reveals the horror of being trapped forever.
- Include a QUEST node that unlocks through compassionate/clever dialogue paths.
- The quest should relate to their backstory (avenge them, find lost items, carry a message).`;

  const content = await generateText(prompt, { temperature: 0.9 });
  if (!content) return null;

  const parsed = parseJSON<{
    portraitPrompt: string;
    characterName: string;
    characterTitle: string;
    rootNodeId: string;
    nodes: Record<string, unknown>;
    rewards: Record<string, { gold?: number; item?: string; boonType?: string; boonValue?: number }>;
    quest?: {
      name: string;
      description: string;
      objective: string;
      targetType?: string;
      targetCount: number;
      goldReward: number;
      echoReward: number;
    };
  }>(content);
  
  if (!parsed) return null;

  console.log('[AI] Generated enemy encounter for:', enemy.name, '- Named:', parsed.characterName, parsed.characterTitle);

  return {
    portraitPrompt: parsed.portraitPrompt,
    characterName: parsed.characterName || enemy.name,
    characterTitle: parsed.characterTitle || '',
    dialogue: {
      rootNodeId: parsed.rootNodeId,
      nodes: parsed.nodes as unknown as import('../types').StoryDialogueTree['nodes'],
    },
    rewards: parsed.rewards,
    quest: parsed.quest,
  };
}

// Generate an enemy encounter with deep backstory and meaningful choices (uses shared content pool)
export async function generateEnemyEncounter(enemy: {
  name: string;
  race: string;
  description: string;
  isBoss: boolean;
  element?: string;
}): Promise<EnemyEncounterResult | null> {
  const result = await fetchOrGenerate<PooledEnemyEncounter>(
    'enemy_encounter',
    {
      enemy_type: enemy.name || 'unknown',
      race: enemy.race || 'creature',
      is_boss: String(enemy.isBoss)
    },
    async () => {
      const encounter = await _generateEnemyEncounterDirect(enemy);
      if (!encounter) return null;
      return {
        characterName: encounter.characterName,
        characterTitle: encounter.characterTitle,
        dialogue: encounter.dialogue,
        portraitPrompt: encounter.portraitPrompt,
        rewards: encounter.rewards,
        quest: encounter.quest
      };
    }
  );
  
  if (!result) return null;
  
  return {
    portraitPrompt: result.portraitPrompt || '',
    characterName: result.characterName,
    characterTitle: result.characterTitle,
    dialogue: result.dialogue as import('../types').StoryDialogueTree,
    rewards: result.rewards as Record<string, { gold?: number; item?: string; boonType?: string; boonValue?: number }>,
    quest: result.quest as EnemyEncounterResult['quest']
  };
}

// Style reference for enemy portraits - green/orange/black pixel art
const PORTRAIT_STYLE_REFERENCE = 'https://i.imgur.com/blvhjo8.png';

// Internal enemy portrait generation (without pool)
async function _generateEnemyPortraitDirect(
  portraitPrompt: string,
  enemyRace: string,
  characterName: string
): Promise<string | null> {
  const pixelArtPrompt = `PIXEL ART portrait in retro dungeon crawler style.

Subject: A ${enemyRace} creature
${portraitPrompt}

CRITICAL: NO TEXT, NO WORDS, NO LETTERS, NO NAMES in the image. Pure visual art only.

STYLE REQUIREMENTS:
1. STRICT COLOR PALETTE - ONLY USE:
   - GREEN (#00ff00, #44ff44, #22aa22, #115511) - main color for most elements
   - ORANGE/AMBER (#ffcc44, #ff8800, #cc6600) - for accents, eyes, highlights
   - BLACK (#000000, #111111) - background only

2. PIXEL ART STYLE:
   - Visible chunky pixels like 8-bit or 16-bit retro games
   - Sharp pixelated edges, NO smooth gradients
   - NO anti-aliasing, NO photorealistic rendering
   - Portrait format, head and shoulders

3. AESTHETIC:
   - Dark fantasy dungeon crawler aesthetic
   - CRT monitor / retro computer game look
   - Match the style of classic roguelike games
   - Black background with glowing green/orange pixels

4. NO OTHER COLORS:
   - No red, no blue, no purple, no brown, no pink
   - No realistic skin tones or full color rendering
   - Everything must be rendered in green and orange on black

5. NO TEXT OR WRITING:
   - Do NOT include any text, labels, names, or letters
   - Pure visual portrait only`;

  console.log('[AI] Generating pixel art portrait for:', characterName);
  return generateImage(pixelArtPrompt, {
    aspectRatio: '1:1',
    removeBackground: false,
    referenceImages: [PORTRAIT_STYLE_REFERENCE],
  });
}

// Generate a pixel art portrait from an enemy portrait prompt (uses shared content pool)
export async function generateEnemyPortraitFromPrompt(
  portraitPrompt: string,
  enemyRace: string,
  characterName: string
): Promise<string | null> {
  return fetchOrGenerateImageUrl(
    'portrait_enemy',
    { 
      race: enemyRace || 'creature',
      name: characterName || 'enemy'
    },
    () => _generateEnemyPortraitDirect(portraitPrompt, enemyRace, characterName),
    {
      enemyId: characterName,
      portraitPrompt: portraitPrompt
    }
  );
}

// Preload an image and return a promise that resolves when loaded
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

// Internal room event art generation (without pool)
async function _generateRoomEventArtDirect(
  eventName: string,
  artPrompt: string
): Promise<string | null> {
  const pixelArtPrompt = `PIXEL ART scene in retro dungeon crawler style.

Scene: ${artPrompt}

CRITICAL: NO TEXT, NO WORDS, NO LETTERS, NO NAMES in the image. Pure visual art only.

STYLE REQUIREMENTS:
1. STRICT COLOR PALETTE - ONLY USE:
   - GREEN (#00ff00, #44ff44, #22aa22, #115511) - main color for most elements
   - ORANGE/AMBER (#ffcc44, #ff8800, #cc6600) - for accents, danger, highlights
   - BLACK (#000000, #111111) - background and shadows

2. PIXEL ART STYLE:
   - Visible chunky pixels like 8-bit or 16-bit retro games
   - Sharp pixelated edges, NO smooth gradients
   - NO anti-aliasing, NO photorealistic rendering
   - Scene composition showing the event/encounter

3. AESTHETIC:
   - Dark fantasy dungeon crawler aesthetic
   - CRT monitor / retro computer game look
   - Match the style of classic roguelike games
   - Atmospheric dungeon scene with glowing elements

4. NO OTHER COLORS:
   - No red, no blue, no purple, no brown, no pink
   - No realistic colors or full color rendering
   - Everything must be rendered in green and orange on black

5. COMPOSITION:
   - Square format, centered subject
   - Clear focal point showing the event
   - Dark atmospheric background
   - NO text, labels, or writing of any kind`;

  console.log('[AI] Generating pixel art for room event:', eventName);
  console.log('[AI] Room event prompt length:', pixelArtPrompt.length);
  
  try {
    const result = await generateImage(pixelArtPrompt, {
      aspectRatio: '1:1',
      removeBackground: false,
      referenceImages: [PORTRAIT_STYLE_REFERENCE],
    });
    console.log('[AI] Room event image generation result:', result ? 'success' : 'null');
    return result;
  } catch (err) {
    console.error('[AI] Room event image generation error:', err);
    return null;
  }
}

// Generate pixel art for room events (uses shared content pool)
export async function generateRoomEventArt(
  eventName: string,
  artPrompt: string
): Promise<string | null> {
  console.log('[RoomEvent] generateRoomEventArt called:', { eventName, artPrompt: artPrompt?.substring(0, 50) });
  
  if (!artPrompt) {
    console.warn('[RoomEvent] No artPrompt provided for:', eventName);
    artPrompt = `A dungeon scene depicting: ${eventName}`;
  }
  
  const result = await fetchOrGenerateImageUrl(
    'room_event_art',
    { 
      event: eventName || 'unknown_event'
    },
    () => _generateRoomEventArtDirect(eventName, artPrompt),
    {
      appearancePrompt: artPrompt
    }
  );
  
  console.log('[RoomEvent] generateRoomEventArt result:', result ? 'has URL' : 'null');
  return result;
}

// Generate a quest from a character
export async function generateCharacterQuest(character: {
  id: string;
  name: string;
  title?: string;
  role: string;
  motivation: string;
  portraitUrl?: string;
}): Promise<CharacterQuest | null> {
  const prompt = `Generate a quest that this character would give to a dungeon adventurer.

CHARACTER:
- Name: ${character.name}
- Title: ${character.title || 'Unknown'}
- Role: ${character.role}
- Motivation: ${character.motivation}

QUEST TYPES (pick ONE that fits the character):
- kill_enemies: "Kill X enemies" (X = 5-15)
- reach_floor: "Reach floor X" (X = 3-8)
- collect_gold: "Collect X gold" (X = 50-200)
- pass_skill_checks: "Pass X skill checks" (X = 2-5)
- survive_floors: "Survive X floors" (X = 3-5)

Generate JSON with this schema:
{
  "questType": "kill_enemies" | "reach_floor" | "collect_gold" | "pass_skill_checks" | "survive_floors",
  "target": <number based on quest type>,
  "name": "<short quest name, 2-4 words, character-themed>",
  "description": "<1 sentence objective description>",
  "flavorText": "<character's personal message, in their voice, 1-2 sentences>",
  "goldReward": <50-150 based on difficulty>,
  "echoReward": <3-8 based on difficulty>,
  "unlockRecruitment": <true if completing this would make them recruitable, based on role>
}`;

  const content = await generateText(prompt, { temperature: 0.8 });
  if (!content) {
    console.warn('[AI] generateCharacterQuest: No content returned');
    return null;
  }

  const parsed = parseJSON<{
    questType: CharacterQuestType;
    target: number;
    name: string;
    description: string;
    flavorText: string;
    goldReward?: number;
    echoReward?: number;
    unlockRecruitment?: boolean;
  }>(content);

  if (!parsed) {
    console.warn('[AI] generateCharacterQuest: Failed to parse JSON');
    return null;
  }

  console.log('[AI] ✓ Generated quest for', character.name, ':', parsed.name);

  return {
    id: `quest_${character.id}_${Date.now()}`,
    characterId: character.id,
    characterName: character.name,
    characterPortraitUrl: character.portraitUrl,
    name: parsed.name,
    description: parsed.description,
    flavorText: parsed.flavorText,
    questType: parsed.questType,
    target: parsed.target,
    progress: 0,
    isComplete: false,
    isClaimed: false,
    rewards: {
      relationshipBonus: 20,
      gold: parsed.goldReward,
      echoReward: parsed.echoReward,
      unlockRecruitment: parsed.unlockRecruitment,
    },
    isGenerated: true,
    generatedAt: new Date().toISOString(),
  };
}

// Generate a unique mercenary for hire
export async function generateMercenary(context: {
  floorNumber: number;
  existingMercNames: string[];
  playerClass: PlayerClass;
}): Promise<MercenaryDef | null> {
  const prompt = `Generate a unique mercenary for hire in a dark fantasy dungeon.

CONTEXT:
- Floor: ${context.floorNumber}
- Player class: ${context.playerClass}
- Avoid these existing names: ${context.existingMercNames.join(', ') || 'none'}

SPECIAL ABILITIES (pick one or create similar):
- Taunt: enemies prefer attacking this mercenary
- Double Strike: attacks twice per turn
- Blessing: heals player 2 HP per turn
- Frenzy: deals double damage when below 50% HP
- Assassinate: 15% chance to instantly kill non-boss enemies
- Stone Skin: takes half damage from all sources
- Lifesteal: heals for 25% of damage dealt
- Shield Wall: reduces all incoming damage by 3

Generate a mercenary with this JSON schema:
{
  "id": "merc_unique_snake_case",
  "name": "Character Name",
  "title": "The Descriptive Title",
  "char": "Single ASCII character (♦♣♥♠◆■●○)",
  "color": "#hexcolor",
  "hireCost": 40-100 (based on power),
  "stats": {
    "hp": 15-60,
    "maxHp": (same as hp),
    "attack": 4-14,
    "defense": 1-12,
    "speed": 3-15
  },
  "minFloor": ${Math.max(1, context.floorNumber - 2)},
  "description": "One sentence about who they are",
  "specialAbility": "Ability Name: brief description of effect",
  "backstory": "2-3 sentences about their history",
  "personality": "2-3 personality traits"
}

Make stats balanced - high attack means low defense, high HP means low speed, etc.`;

  const content = await generateText(prompt, { temperature: 0.9 });
  if (!content) return null;

  const parsed = parseJSON<Omit<MercenaryDef, 'isGenerated'>>(content);
  if (!parsed) return null;

  return {
    ...parsed,
    isGenerated: true,
  };
}

// Internal mercenary portrait generation (without pool)
async function _generateMercenaryPortraitDirect(merc: MercenaryDef): Promise<string | null> {
  const styleRefs = getPortraitStyleReferences();
  
  const prompt = `PIXEL ART mercenary portrait for a retro dungeon crawler game.
STRICT COLOR PALETTE: Only use GREEN (#00ff00, #44ff44, #228822), ORANGE (#ff8800, #ffaa44, #cc6600), and BLACK (#000000, #111111, #222222).
NO other colors allowed - this is critical.

CRITICAL: NO TEXT, NO WORDS, NO LETTERS, NO NAMES in the image. Pure visual art only.

Character: A mercenary warrior
${merc.description}
Personality: ${merc.personality || 'Battle-hardened veteran'}

STYLE REQUIREMENTS:
- Blocky pixel art aesthetic like classic 16-bit RPGs
- CRT monitor glow effect
- Dark dungeon atmosphere with torch lighting
- Bold outlines, no anti-aliasing
- Low resolution chunky pixels visible
- Armored warrior ready for battle
- NO text, labels, or writing of any kind`;

  console.log('[AI] Using', styleRefs.length, 'reference images for mercenary portrait');
  
  return generateImage(prompt, {
    aspectRatio: '1:1',
    removeBackground: false,
    referenceImages: styleRefs,
  });
}

// Generate portrait for a mercenary (uses shared content pool)
export async function generateMercenaryPortrait(merc: MercenaryDef): Promise<string | null> {
  return fetchOrGenerateImageUrl(
    'portrait_mercenary',
    { 
      name: merc.name || 'unknown',
      title: merc.title || 'mercenary'
    },
    () => _generateMercenaryPortraitDirect(merc),
    {
      name: merc.name,
      class: merc.title,
      appearancePrompt: merc.description
    }
  );
}

// Generate a skill encounter
export async function generateEncounter(context: {
  floorRange: [number, number];
  preferredSkill?: SkillName;
  existingEncounterTypes: string[];
}): Promise<GeneratedEncounter | null> {
  const skillList = context.preferredSkill
    ? `Prefer ${context.preferredSkill}, but any skill works`
    : 'Any of: Stealth, Diplomacy, Athletics, Awareness, Lore, Survival';

  const prompt = `Generate a skill challenge encounter for floors ${context.floorRange[0]}-${context.floorRange[1]}.

SKILL TO USE: ${skillList}
AVOID THESE TYPES: ${context.existingEncounterTypes.join(', ') || 'none'}

GENERATE an encounter with this JSON schema:
{
  "id": "unique_snake_case_id",
  "type": "skill_challenge" | "hidden_cache" | "trapped_room" | "negotiation" | "chase",
  "floorRange": [${context.floorRange[0]}, ${context.floorRange[1]}],
  "description": "What the player sees (2 sentences)",
  "primarySkill": "stealth" | "diplomacy" | "athletics" | "awareness" | "lore" | "survival",
  "alternateSkill": "optional alternate skill",
  "target": 7-12 (difficulty number),
  "successDescription": "What happens on success",
  "successReward": { "type": "item" | "gold" | "heal" | "info", "value": "item_name or number" },
  "partialDescription": "What happens on partial success (7-9)",
  "partialReward": { "type": "...", "value": "..." },
  "failureDescription": "What happens on failure",
  "failurePenalty": { "type": "damage" | "hunger" | "trap", "value": number }
}`;

  const content = await generateText(prompt, { temperature: 0.8 });
  if (!content) return null;

  const parsed = parseJSON<Omit<GeneratedEncounter, 'generatedAt'>>(content);
  if (!parsed) return null;

  return {
    ...parsed,
    generatedAt: new Date().toISOString(),
  };
}

// Generate a unique item
export async function generateItem(context: {
  floorRange: [number, number];
  preferredType?: 'weapon' | 'armor' | 'ring' | 'amulet';
  preferredSkillBonus?: SkillName;
}): Promise<GeneratedItem | null> {
  const typeHint = context.preferredType
    ? `Type: ${context.preferredType}`
    : 'Any equipment type';
  const skillHint = context.preferredSkillBonus
    ? `Should boost ${context.preferredSkillBonus}`
    : 'Any skill bonus';

  const prompt = `Generate a unique magical item for floors ${context.floorRange[0]}-${context.floorRange[1]}.

${typeHint}
${skillHint}

GENERATE an item with this JSON schema:
{
  "id": "unique_snake_case_id",
  "name": "Item Name",
  "type": "weapon" | "armor" | "ring" | "amulet" | "offhand",
  "rarity": "uncommon" | "rare" | "epic" | "legendary",
  "description": "What it does (1 sentence)",
  "flavorText": "Lore text (1 sentence)",
  "statBonus": { "attack": N, "defense": N, "hp": N, "maxHp": N, "speed": N },
  "skillBonus": { "stealth": N, "diplomacy": N, "athletics": N, "awareness": N, "lore": N, "survival": N },
  "specialAbility": "Optional special effect",
  "artDescription": "Visual description for art generation (1-2 sentences)"
}

Note: statBonus and skillBonus should only include non-zero values. Keep bonuses reasonable (+1 to +4 for skills).`;

  const content = await generateText(prompt, { temperature: 0.8 });
  if (!content) return null;

  const parsed = parseJSON<Omit<GeneratedItem, 'generatedAt' | 'artUrl'>>(content);
  if (!parsed) return null;

  return {
    ...parsed,
    generatedAt: new Date().toISOString(),
    artUrl: undefined,
  };
}

// Internal character portrait generation (without pool)
async function _generateCharacterPortraitDirect(character: StoryCharacter): Promise<string | null> {
  const styleRefs = getPortraitStyleReferences();
  
  const prompt = `PIXEL ART character portrait for a retro dungeon crawler game.
STRICT COLOR PALETTE: Only use GREEN (#00ff00, #44ff44, #228822), ORANGE (#ff8800, #ffaa44, #cc6600), and BLACK (#000000, #111111, #222222).
NO other colors allowed - this is critical.

CRITICAL: NO TEXT, NO WORDS, NO LETTERS, NO NAMES in the image. Pure visual art only.

Character: A ${character.race} creature.
${character.appearanceDescription}
Expression: ${character.role === 'ally' ? 'Approachable, friendly' : character.role === 'enemy' ? 'Menacing, hostile' : 'Mysterious, enigmatic'}.

STYLE REQUIREMENTS:
- Blocky pixel art aesthetic like classic 16-bit RPGs
- CRT monitor glow effect
- Dark dungeon atmosphere
- Bold outlines, no anti-aliasing
- Low resolution chunky pixels visible
- NO text, labels, or writing of any kind`;

  console.log('[AI] Using', styleRefs.length, 'reference images for portrait style');
  
  return generateImage(prompt, {
    aspectRatio: '1:1',
    removeBackground: false,
    referenceImages: styleRefs,
  });
}

// Generate a character portrait with style references (uses shared content pool)
export async function generateCharacterPortrait(character: StoryCharacter): Promise<string | null> {
  return fetchOrGenerateImageUrl(
    'portrait_character',
    { 
      faction: (character as any).faction || 'unknown',
      race: character.race || 'humanoid',
      role: character.role || 'neutral'
    },
    () => _generateCharacterPortraitDirect(character),
    { 
      factionId: (character as any).faction,
      creatureType: character.race,
      appearancePrompt: character.appearanceDescription
    }
  );
}

// Generate item art
export async function generateItemArt(item: GeneratedItem): Promise<string | null> {
  const prompt = `Fantasy item icon: ${item.name}.
${item.artDescription}
${item.rarity} quality, glowing magical effects, dark fantasy style.
Transparent background, centered, detailed pixel art style.`;

  return generateImage(prompt, {
    aspectRatio: '1:1',
    removeBackground: true,
  });
}

// Environment/encounter scene types
export type EncounterSceneType = 
  | 'secret_door'
  | 'hidden_cache'
  | 'locked_chest'
  | 'ancient_inscription'
  | 'collapsed_tunnel'
  | 'goblin_encounter'
  | 'camp_discovery'
  | 'trap_triggered'
  | 'ritual_site'
  | 'mysterious_shrine';

// Generate environment/encounter art
export async function generateEncounterArt(
  sceneType: EncounterSceneType,
  description?: string,
  floorNumber?: number
): Promise<string | null> {
  // const envRefs = getEnvironmentStyleReferences();
  
  const depthHint = floorNumber 
    ? floorNumber <= 3 ? 'Upper dungeon levels. Stone brick walls, iron torches with flickering flames, moss and cobwebs, ancient but sturdy'
    : floorNumber <= 6 ? 'Middle depths. Crumbling ancient ruins, darker atmosphere, strange fungi, forgotten civilization remnants'
    : floorNumber <= 10 ? 'Deep caverns. Natural rock formations, bioluminescent crystals, ominous shadows, eldritch whispers'
    : 'The Abyss. Otherworldly architecture, demonic influence, reality bending, hellfire and darkness'
    : 'Dark dungeon environment';

  const scenePrompts: Record<EncounterSceneType, string> = {
    secret_door: 'A hidden stone door revealed in the dungeon wall. Ancient dwarven mechanism visible with interlocking gears. Dust falling from cracks as it opens. Mysterious dark passage beyond with faint glow',
    hidden_cache: 'A concealed treasure cache discovered behind loose dungeon stones. Glint of gold coins, ancient scrolls, and magical items inside. Cobwebs and dust disturbed. Excited moment of discovery',
    locked_chest: 'An ornate treasure chest sitting in dungeon alcove. Intricate iron lock with magical runes glowing faintly blue. Visible trapped mechanism. Tempting but dangerous',
    ancient_inscription: 'Glowing ancient runes carved deep into dungeon wall. Magical energy pulsing outward in waves. Arcane symbols telling a story. Eldritch green and purple light illuminating the scene',
    collapsed_tunnel: 'A partially collapsed dungeon tunnel ahead. Rocks still falling, dust clouds in torchlight. Narrow dangerous passage through the rubble. Sense of urgency and peril',
    goblin_encounter: 'A nervous goblin scout emerging from dungeon shadows. Large glowing yellow eyes, crude rusty weapon, tattered armor. Cautious stance, could be friend or foe',
    camp_discovery: 'An abandoned adventurer camp discovered in a dungeon alcove. Old bedroll, long-extinguished campfire, scattered supplies and journals. Ominous bones nearby hint at their fate',
    trap_triggered: 'A dungeon trap activating with deadly intent. Poison darts shooting from walls or spikes emerging from floor. Ancient mechanism clicking. Glowing magical trigger. Moment of danger',
    ritual_site: 'A dark ritual circle inscribed on dungeon floor. Black candles, strange demonic symbols, ominous swirling energy. Abandoned sacrificial altar. Something terrible happened here',
    mysterious_shrine: 'An ancient shrine discovered in dungeon alcove. Glowing crystalline idol on pedestal. Old offerings scattered around. Mysterious divine or demonic presence felt. Sacred or profane',
  };

  const basePrompt = scenePrompts[sceneType] || 'Dark dungeon scene';
  const customDesc = description ? `\nAdditional context: ${description}` : '';

  const prompt = `${basePrompt}${customDesc}

Environment: ${depthHint}

CRITICAL STYLE INSTRUCTIONS:
- Dark fantasy roguelike dungeon crawler aesthetic
- Painterly digital art with rich saturated colors
- Dramatic cinematic lighting with strong shadows
- Atmospheric fog and particle effects
- Detailed textures on stone, metal, and magical effects
- Wide establishing shot composition
- Moody, mysterious, dangerous atmosphere
- NO cartoonish elements, maintain serious dark fantasy tone`;

  return generateImage(prompt, {
    aspectRatio: '16:9',
    removeBackground: false,
    // Skip reference images for now
    // referenceImages: envRefs.length > 0 ? envRefs : undefined,
  });
}

// Generate encounter art based on encounter data
export async function generateEncounterSceneArt(
  encounter: GeneratedEncounter,
  floorNumber: number
): Promise<string | null> {
  // Map encounter type to scene type
  const typeMap: Record<string, EncounterSceneType> = {
    'hidden_cache': 'hidden_cache',
    'skill_challenge': 'locked_chest',
    'negotiation': 'goblin_encounter',
    'chase': 'collapsed_tunnel',
    'trapped_room': 'trap_triggered',
  };
  
  const sceneType = typeMap[encounter.type] || 'hidden_cache';
  return generateEncounterArt(sceneType, encounter.description, floorNumber);
}

// Batch generate content for a floor range
export interface FloorBatchRequest {
  floorRange: [number, number];
  playerClass: PlayerClass;
  bloodline: BloodlineData;
  generateCharacter: boolean;
  encounterCount: number;
  itemCount: number;
}

export interface FloorBatchResult {
  character: GeneratedCharacter | null;
  encounters: GeneratedEncounter[];
  items: GeneratedItem[];
  errors: string[];
}

export async function generateFloorBatch(request: FloorBatchRequest): Promise<FloorBatchResult> {
  const result: FloorBatchResult = {
    character: null,
    encounters: [],
    items: [],
    errors: [],
  };

  const existingCharacterNames: string[] = [];

  // Generate character if requested
  if (request.generateCharacter) {
    try {
      result.character = await generateCharacter({
        playerClass: request.playerClass,
        floorRange: request.floorRange,
        existingCharacterNames,
        bloodlineGeneration: request.bloodline.generation,
      });
      if (result.character) {
        existingCharacterNames.push(result.character.name);
        // Portrait generation moved to progressiveLoader to prioritize story beat
        console.log('[AI] ✓ Character ready (portrait will be generated after story beat)');
      }
    } catch (e) {
      result.errors.push(`Character generation failed: ${e}`);
    }
  }

  // Generate encounters
  const existingEncounterTypes: string[] = [];
  const skills: SkillName[] = ['stealth', 'diplomacy', 'athletics', 'awareness', 'lore', 'survival'];

  for (let i = 0; i < request.encounterCount; i++) {
    try {
      const encounter = await generateEncounter({
        floorRange: request.floorRange,
        preferredSkill: skills[i % skills.length],
        existingEncounterTypes,
      });
      if (encounter) {
        result.encounters.push(encounter);
        existingEncounterTypes.push(encounter.type);
      }
    } catch (e) {
      result.errors.push(`Encounter ${i + 1} generation failed: ${e}`);
    }
  }

  // Generate items
  const itemTypes: Array<'weapon' | 'armor' | 'ring' | 'amulet'> = ['weapon', 'armor', 'ring', 'amulet'];

  for (let i = 0; i < request.itemCount; i++) {
    try {
      const item = await generateItem({
        floorRange: request.floorRange,
        preferredType: itemTypes[i % itemTypes.length],
        preferredSkillBonus: skills[i % skills.length],
      });
      if (item) {
        result.items.push(item);
      }
    } catch (e) {
      result.errors.push(`Item ${i + 1} generation failed: ${e}`);
    }
  }

  return result;
}

// Check if AI services are available (requires user to be logged in)
export async function isAIAvailable(): Promise<boolean> {
  try {
    // Check if user is anonymous first
    const isAnon = RundotGameAPI.accessGate.isAnonymous();
    console.log('[AI] isAnonymous check:', isAnon);
    
    if (isAnon) {
      console.log('[AI] User is anonymous - AI features require login');
      return false;
    }
    
    console.log('[AI] User is logged in, checking available models...');
    const models = await getAvailableModels();
    console.log('[AI] Available models:', models);
    
    if (models.length === 0) {
      console.warn('[AI] No models available from SDK');
      return false;
    }
    
    console.log('[AI] ✓ AI is available with', models.length, 'models');
    return true;
  } catch (e) {
    console.warn('[AI] Failed to check AI availability:', e);
    return false;
  }
}

// Prompt user to login for AI features
export async function promptLoginForAI(): Promise<boolean> {
  try {
    if (!RundotGameAPI.accessGate.isAnonymous()) {
      return true; // Already logged in
    }
    
    console.log('[AI] Prompting user to login for AI features...');
    const result = await RundotGameAPI.accessGate.promptLogin();
    
    if (result.success) {
      console.log('[AI] User logged in successfully:', result.profile?.username);
      return true;
    } else {
      console.log('[AI] User cancelled login');
      return false;
    }
  } catch (e) {
    console.error('[AI] Login prompt failed:', e);
    return false;
  }
}

// Check if user is logged in
export function isUserLoggedIn(): boolean {
  return !RundotGameAPI.accessGate.isAnonymous();
}
