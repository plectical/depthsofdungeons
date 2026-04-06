import type {
  StoryCharacter,
  GeneratedEncounter,
  GeneratedItem,
  NarrativeBeat,
  FloorContentBatch,
} from '../types';

// Pre-authored fallback characters
export const FALLBACK_CHARACTERS: StoryCharacter[] = [
  {
    id: 'gnash',
    name: 'Gnash',
    title: 'The Reluctant Chieftain',
    race: 'goblin',
    role: 'wild_card',
    traits: ['war-weary', 'honorable', 'secretive'],
    motivation: 'To protect his tribe from the deeper horrors',
    secret: 'He once aided a human adventurer who saved his daughter',
    appearanceDescription: 'A scarred goblin in tarnished bronze armor, one eye milky white from an old wound, carrying a notched blade',
    char: 'G',
    color: '#44ff44',
    introFloorRange: [3, 5],
    introDialogue: "Another surface-walker. You fight differently than the others. Why are you here?",
    relationshipTiers: [
      { id: 'hostile', threshold: -50, dialogue: "Leave, human. Before I change my mind.", unlocks: [] },
      { id: 'wary', threshold: -20, dialogue: "You again. What do you want?", unlocks: [] },
      { id: 'neutral', threshold: 0, dialogue: "You survive longer than most. Curious.", unlocks: [] },
      { id: 'friendly', threshold: 30, dialogue: "Perhaps you are different. We shall see.", unlocks: ['gnash_history'] },
      { id: 'allied', threshold: 60, dialogue: "You have earned the respect of Gnash.", unlocks: ['gnash_recruit'] },
    ],
    recruitable: true,
    recruitmentCondition: 'Reach Allied status and complete the Goblin Rebellion arc',
    mercenaryStats: { hp: 35, maxHp: 35, attack: 12, defense: 6, speed: 9 },
    isGenerated: false,
  },
  {
    id: 'elder_mira',
    name: 'Elder Mira',
    title: 'The Bound Spirit',
    race: 'undead',
    role: 'ally',
    traits: ['wise', 'melancholic', 'protective'],
    motivation: 'To guide worthy descendants deeper into the dungeon',
    secret: 'She was the first of your bloodline to die in this dungeon',
    appearanceDescription: 'A translucent specter of an elderly woman in faded robes, eyes glowing with soft blue light',
    char: 'M',
    color: '#88ccff',
    introFloorRange: [1, 3],
    introDialogue: "Another child of the bloodline... I have waited so long.",
    relationshipTiers: [
      { id: 'distant', threshold: -20, dialogue: "You remind me of... someone. It matters not.", unlocks: [] },
      { id: 'curious', threshold: 0, dialogue: "You carry the blood. I sense it.", unlocks: [] },
      { id: 'warm', threshold: 30, dialogue: "Yes... you have the family's stubbornness.", unlocks: ['mira_lore'] },
      { id: 'devoted', threshold: 60, dialogue: "I will tell you everything, child.", unlocks: ['mira_secrets'] },
    ],
    recruitable: false,
    isGenerated: false,
  },
  {
    id: 'shade_merchant',
    name: 'The Collector',
    title: 'Dealer in Memories',
    race: 'demon',
    role: 'neutral',
    traits: ['enigmatic', 'calculating', 'fair'],
    motivation: 'To collect memories and experiences from mortals',
    secret: 'He was once human, the first to make a pact with the dungeon',
    appearanceDescription: 'A tall figure in a shifting cloak of shadows, face hidden, hands pale and long-fingered',
    char: 'C',
    color: '#bb66dd',
    introFloorRange: [4, 6],
    introDialogue: "Ah, a new customer. I deal in memories. What would you trade?",
    relationshipTiers: [
      { id: 'stranger', threshold: 0, dialogue: "Welcome, traveler. Browse my wares.", unlocks: [] },
      { id: 'customer', threshold: 20, dialogue: "A returning customer. Delightful.", unlocks: ['collector_deals'] },
      { id: 'valued', threshold: 50, dialogue: "For you, my special collection.", unlocks: ['collector_secrets'] },
    ],
    recruitable: false,
    isGenerated: false,
  },
];

// Pre-authored fallback encounters
const FALLBACK_ENCOUNTERS: GeneratedEncounter[] = [
  {
    id: 'enc_crumbling_wall',
    generatedAt: 'fallback',
    type: 'hidden_cache',
    floorRange: [1, 3],
    description: 'A section of wall looks unstable, with scratch marks around a loose stone.',
    primarySkill: 'awareness',
    alternateSkill: 'athletics',
    target: 8,
    successDescription: 'You find a hidden cache behind the stone!',
    successReward: { type: 'item', value: 'Health Potion' },
    partialDescription: 'The stone crumbles, revealing a small space with minor treasures.',
    partialReward: { type: 'gold', value: 15 },
    failureDescription: 'The wall collapses, showering you with debris.',
    failurePenalty: { type: 'damage', value: 5 },
  },
  {
    id: 'enc_locked_chest',
    generatedAt: 'fallback',
    type: 'skill_challenge',
    floorRange: [1, 3],
    description: 'An ornate chest sits in the corner, its lock intricate and clearly trapped.',
    primarySkill: 'stealth',
    alternateSkill: 'awareness',
    target: 9,
    successDescription: 'The lock clicks open! Inside lies valuable equipment.',
    successReward: { type: 'item', value: 'Ring of Protection' },
    partialDescription: 'You open it, but trigger a minor trap.',
    partialReward: { type: 'gold', value: 20 },
    failureDescription: 'The trap triggers! Poison gas fills the area.',
    failurePenalty: { type: 'damage', value: 8 },
  },
  {
    id: 'enc_goblin_scout',
    generatedAt: 'fallback',
    type: 'negotiation',
    floorRange: [2, 4],
    description: 'A lone goblin scout spots you. It looks nervous, hand on its blade.',
    primarySkill: 'diplomacy',
    alternateSkill: 'stealth',
    target: 8,
    successDescription: 'The goblin agrees to let you pass and shares information about the floor.',
    successReward: { type: 'info', value: 'floor_layout' },
    partialDescription: 'The goblin flees, but drops something in its haste.',
    partialReward: { type: 'gold', value: 10 },
    failureDescription: 'The goblin attacks in panic!',
    failurePenalty: { type: 'trap', value: 1 },
  },
  {
    id: 'enc_ancient_inscription',
    generatedAt: 'fallback',
    type: 'skill_challenge',
    floorRange: [3, 5],
    description: 'Ancient runes glow faintly on the wall, pulsing with forgotten power.',
    primarySkill: 'lore',
    target: 10,
    successDescription: 'You decipher the runes, gaining ancient knowledge!',
    successReward: { type: 'info', value: 'boss_weakness' },
    partialDescription: 'You understand fragments, learning something useful.',
    partialReward: { type: 'heal', value: 10 },
    failureDescription: 'The runes flash angrily, sapping your energy.',
    failurePenalty: { type: 'hunger', value: 20 },
  },
  {
    id: 'enc_collapsing_tunnel',
    generatedAt: 'fallback',
    type: 'chase',
    floorRange: [4, 6],
    description: 'The tunnel ahead shakes violently. Rocks begin to fall!',
    primarySkill: 'athletics',
    alternateSkill: 'awareness',
    target: 9,
    successDescription: 'You sprint through, finding a shortcut to the stairs!',
    successReward: { type: 'info', value: 'shortcut' },
    partialDescription: 'You make it through, but exhausted.',
    partialReward: { type: 'heal', value: 5 },
    failureDescription: 'Rocks strike you as you barely escape.',
    failurePenalty: { type: 'damage', value: 12 },
  },
  {
    id: 'enc_hidden_camp',
    generatedAt: 'fallback',
    type: 'hidden_cache',
    floorRange: [5, 7],
    description: 'You notice signs of a campsite, cleverly hidden in an alcove.',
    primarySkill: 'survival',
    target: 8,
    successDescription: 'An abandoned adventurer\'s camp! Food and supplies remain.',
    successReward: { type: 'heal', value: 20 },
    partialDescription: 'Some supplies remain, though most were taken.',
    partialReward: { type: 'item', value: 'Bread' },
    failureDescription: 'The camp is trapped! A spike pit opens beneath you.',
    failurePenalty: { type: 'damage', value: 10 },
  },
];

// Pre-authored fallback items with skill bonuses
const FALLBACK_ITEMS: GeneratedItem[] = [
  {
    id: 'item_shadow_cloak',
    generatedAt: 'fallback',
    name: 'Cloak of Shadows',
    type: 'armor',
    rarity: 'rare',
    description: 'A cloak that bends light around the wearer.',
    flavorText: 'Woven from the darkness between stars.',
    statBonus: { defense: 2 },
    skillBonus: { stealth: 3 },
    artDescription: 'A flowing black cloak that seems to absorb light.',
  },
  {
    id: 'item_diplomat_signet',
    generatedAt: 'fallback',
    name: "Diplomat's Signet",
    type: 'ring',
    rarity: 'uncommon',
    description: 'A ring that commands respect.',
    flavorText: 'Once worn by a legendary peacemaker.',
    skillBonus: { diplomacy: 2 },
    artDescription: 'A golden ring with an emblem of two clasped hands.',
  },
  {
    id: 'item_scholar_spectacles',
    generatedAt: 'fallback',
    name: "Scholar's Spectacles",
    type: 'amulet',
    rarity: 'rare',
    description: 'Enchanted lenses that reveal hidden truths.',
    flavorText: 'The world is clearer than you knew.',
    skillBonus: { lore: 2, awareness: 1 },
    artDescription: 'Brass-framed spectacles with faintly glowing lenses.',
  },
  {
    id: 'item_ranger_boots',
    generatedAt: 'fallback',
    name: "Ranger's Boots",
    type: 'armor',
    rarity: 'uncommon',
    description: 'Boots that leave no tracks.',
    flavorText: 'Walk the wild paths unseen.',
    statBonus: { speed: 1 },
    skillBonus: { survival: 2, athletics: 1 },
    artDescription: 'Worn leather boots with leaf patterns.',
  },
  {
    id: 'item_silver_tongue',
    generatedAt: 'fallback',
    name: 'Silver Tongue Amulet',
    type: 'amulet',
    rarity: 'rare',
    description: 'Words flow like honey when wearing this.',
    flavorText: 'Every lie becomes a truth.',
    skillBonus: { diplomacy: 3 },
    artDescription: 'A silver pendant shaped like a tongue.',
  },
  {
    id: 'item_hunters_goggles',
    generatedAt: 'fallback',
    name: "Hunter's Goggles",
    type: 'amulet',
    rarity: 'uncommon',
    description: 'Nothing escapes your notice.',
    flavorText: 'The prey cannot hide.',
    skillBonus: { awareness: 2 },
    artDescription: 'Leather goggles with red-tinted lenses.',
  },
  {
    id: 'item_ancient_tome',
    generatedAt: 'fallback',
    name: 'Tome of Forgotten Lore',
    type: 'offhand',
    rarity: 'rare',
    description: 'A book filled with ancient secrets.',
    flavorText: 'Knowledge is the ultimate weapon.',
    statBonus: { attack: 1 },
    skillBonus: { lore: 3 },
    artDescription: 'A leather-bound tome with glowing runes on the cover.',
  },
  {
    id: 'item_gladiator_belt',
    generatedAt: 'fallback',
    name: "Gladiator's Belt",
    type: 'armor',
    rarity: 'uncommon',
    description: 'A belt that enhances physical prowess.',
    flavorText: 'Victory through strength.',
    skillBonus: { athletics: 2 },
    artDescription: 'A wide leather belt with bronze studs.',
  },
];

const FALLBACK_STORY_BEATS: NarrativeBeat[] = [
  {
    id: 'beat_elder_mira_intro',
    characterId: 'elder_mira',
    beatType: 'intro',
    trigger: { type: 'floor', floorRange: [1, 1] },
    dialogue: {
      rootNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro',
          speaker: 'narrator',
          text: 'As you descend deeper, a translucent figure materializes before you. Her eyes glow with soft blue light.',
          choices: [
            { id: 'greet', label: 'Who are you?', responseText: 'You approach cautiously.', effects: [], successNodeId: 'response1' },
            { id: 'cautious', label: 'Stay back, spirit!', responseText: 'You raise your weapon.', effects: [], relationshipChange: -5, successNodeId: 'response2' },
          ],
        },
        response1: {
          id: 'response1',
          speaker: 'character',
          characterId: 'elder_mira',
          text: 'I am Elder Mira, bound to this dungeon. I sense the blood of our family in you. You carry the lineage.',
          nextNodeId: 'end',
        },
        response2: {
          id: 'response2',
          speaker: 'character',
          characterId: 'elder_mira',
          text: 'Fear not, descendant. I mean no harm. I have waited long for one who carries the blood.',
          nextNodeId: 'end',
        },
        end: {
          id: 'end',
          speaker: 'narrator',
          text: 'The spirit fades, but you feel her presence lingering nearby.',
        },
      },
    },
    effects: [],
  },
  {
    id: 'beat_gnash_first_meeting',
    characterId: 'gnash',
    beatType: 'intro',
    trigger: { type: 'floor', floorRange: [4, 6] },
    dialogue: {
      rootNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro',
          speaker: 'narrator',
          text: 'A goblin in tarnished bronze armor steps from the shadows. One eye is milky white from an old wound.',
          choices: [
            { 
              id: 'diplomacy', 
              label: '[Diplomacy] I mean no harm to your kind.', 
              responseText: 'You speak calmly.',
              effects: [],
              skillCheck: { skill: 'diplomacy', target: 10 },
              successNodeId: 'diplo_success',
              failureNodeId: 'diplo_fail',
            },
            { id: 'threaten', label: 'Out of my way, goblin.', responseText: 'You glare menacingly.', effects: [], relationshipChange: -10, successNodeId: 'threaten_response' },
            { id: 'curious', label: 'You seem different from the others.', responseText: 'You observe him carefully.', effects: [], relationshipChange: 5, successNodeId: 'curious_response' },
          ],
        },
        diplo_success: {
          id: 'diplo_success',
          speaker: 'character',
          characterId: 'gnash',
          text: 'Hmm. You speak with wisdom for a surface-dweller. I am Gnash. Remember that name.',
          nextNodeId: 'end',
        },
        diplo_fail: {
          id: 'diplo_fail',
          speaker: 'character',
          characterId: 'gnash',
          text: 'Pretty words. But words are wind. Prove yourself with actions.',
          nextNodeId: 'end',
        },
        threaten_response: {
          id: 'threaten_response',
          speaker: 'character',
          characterId: 'gnash',
          text: 'Fool. I have killed a hundred like you. But today... I choose not to. Go.',
          nextNodeId: 'end',
        },
        curious_response: {
          id: 'curious_response',
          speaker: 'character',
          characterId: 'gnash',
          text: 'Different? I am Gnash, chieftain of the lower tunnels. The others fear me. As should you.',
          nextNodeId: 'end',
        },
        end: {
          id: 'end',
          speaker: 'narrator',
          text: 'Gnash melts back into the shadows, but you sense this is not the last you will see of him.',
        },
      },
    },
    effects: [],
  },
];

// Get fallback content for a floor range
export function getFallbackBatch(floorRange: [number, number]): Partial<FloorContentBatch> {
  const [minFloor, maxFloor] = floorRange;
  
  // Filter content that applies to this floor range
  const characters = FALLBACK_CHARACTERS.filter(c => 
    c.introFloorRange[0] <= maxFloor && c.introFloorRange[1] >= minFloor
  );
  
  const encounters = FALLBACK_ENCOUNTERS.filter(e =>
    e.floorRange[0] <= maxFloor && e.floorRange[1] >= minFloor
  );
  
  // Select a subset of items based on floor depth
  const itemStartIndex = Math.floor((minFloor - 1) / 3) * 2;
  const items = FALLBACK_ITEMS.slice(itemStartIndex, itemStartIndex + 3);
  
  // Filter story beats for this floor range
  const storyBeats = FALLBACK_STORY_BEATS.filter(b => {
    const fr = b.trigger.floorRange;
    return fr && fr[0] <= maxFloor && fr[1] >= minFloor;
  });
  
  return {
    characters,
    encounters,
    items,
    storyBeats,
  };
}

// Get a specific fallback character by ID
export function getFallbackCharacter(id: string): StoryCharacter | null {
  return FALLBACK_CHARACTERS.find(c => c.id === id) ?? null;
}

// Get all fallback characters
export function getAllFallbackCharacters(): StoryCharacter[] {
  return [...FALLBACK_CHARACTERS];
}

// Get fallback encounter by ID
export function getFallbackEncounter(id: string): GeneratedEncounter | null {
  return FALLBACK_ENCOUNTERS.find(e => e.id === id) ?? null;
}

// Get all fallback encounters
export function getAllFallbackEncounters(): GeneratedEncounter[] {
  return [...FALLBACK_ENCOUNTERS];
}

// Get fallback item by ID  
export function getFallbackItem(id: string): GeneratedItem | null {
  return FALLBACK_ITEMS.find(i => i.id === id) ?? null;
}

// Get all fallback items
export function getAllFallbackItems(): GeneratedItem[] {
  return [...FALLBACK_ITEMS];
}

export function getRandomFallbackEncounter(floorNumber: number): GeneratedEncounter | null {
  const applicable = FALLBACK_ENCOUNTERS.filter(e =>
    e.floorRange[0] <= floorNumber && e.floorRange[1] >= floorNumber
  );
  
  if (applicable.length === 0) return null;
  return applicable[Math.floor(Math.random() * applicable.length)] ?? null;
}

export function getRandomFallbackItem(_floorNumber: number): GeneratedItem | null {
  if (FALLBACK_ITEMS.length === 0) return null;
  const index = Math.floor(Math.random() * FALLBACK_ITEMS.length);
  return FALLBACK_ITEMS[index] ?? null;
}
