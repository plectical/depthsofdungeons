import type { NPCDef, MapNPC, DungeonFloor, BloodlineData, DialogueNode } from './types';
import type { GeneratedClass } from './generativeClass/types';
import { uid, randInt } from './utils';
import { isWalkableTile, getTile } from './dungeon';
import { getStoryNpcDef as _getStoryNpcDef } from './story-mode/storyNpcRegistry';

// Get stored generated class from localStorage
function getStoredGeneratedClass(): GeneratedClass | null {
  try {
    const stored = localStorage.getItem('activeGeneratedClass');
    if (stored) {
      return JSON.parse(stored) as GeneratedClass;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

// Pool of varied wisdom for the Hermit
const HERMIT_WISDOM = [
  { intro: 'I have wandered these depths for ages.', response: 'Patience outlasts fury. Guard yourself well.', stat: 'defense' as const },
  { intro: 'The walls whisper secrets to those who listen.', response: 'Strike swift, before doubt takes hold.', stat: 'attack' as const },
  { intro: 'In darkness, I found my purpose.', response: 'Speed is the truest shield against death.', stat: 'speed' as const },
  { intro: 'Time moves differently in the depths.', response: 'The body endures what the mind commands.', stat: 'defense' as const },
  { intro: 'Many have passed through here. Few returned.', response: 'A sharp blade speaks louder than words.', stat: 'attack' as const },
  { intro: 'The dungeon tests all who enter.', response: 'Move like water — flow around obstacles.', stat: 'speed' as const },
  { intro: 'I remember the surface... barely.', response: 'Strength fades, but wisdom remains.', stat: 'defense' as const },
  { intro: 'Even monsters fear what lurks below.', response: 'Strike first, or be struck down.', stat: 'attack' as const },
  { intro: 'The path forward is never straight.', response: 'The quick survive; the slow become bones.', stat: 'speed' as const },
  { intro: 'I have seen heroes and fools alike.', response: 'Know your limits, then exceed them.', stat: 'attack' as const },
];

export const NPC_DEFS: NPCDef[] = [
  {
    id: 'hermit',
    name: 'The Hermit',
    char: '☽',
    color: '#88aaff',
    minFloor: 2,
    spawnChance: 0.3,
    appearanceDescription: 'An ancient, weathered figure with a long white beard, wearing tattered robes. Eyes that glow softly blue with mystical knowledge. A crescent moon symbol on his forehead. Hunched posture, holding a gnarled wooden staff.',
    dialogue: (): DialogueNode => {
      const wisdom = HERMIT_WISDOM[Math.floor(Math.random() * HERMIT_WISDOM.length)]!;
      const statName = wisdom.stat === 'defense' ? 'Def' : wisdom.stat === 'attack' ? 'Atk' : 'Spd';
      return {
        text: `${wisdom.intro} Will you hear my wisdom, or press on?`,
        choices: [
          {
            label: '[ Listen ]',
            responseText: wisdom.response,
            effects: [
              { type: 'npcChoice', eventId: 'hermit', choiceId: 'listen' },
              { type: 'statBuff', stat: wisdom.stat, amount: 1 },
              { type: 'message', text: `The Hermit shares ancient wisdom. +1 ${statName} this run.`, color: '#88aaff' },
            ],
          },
          {
            label: '[ Ignore ]',
            responseText: 'Hmph. Youth is always in a hurry.',
            effects: [
              { type: 'npcChoice', eventId: 'hermit', choiceId: 'ignore' },
              { type: 'message', text: 'You brush past the Hermit.', color: '#8888aa' },
            ],
          },
        ],
      };
    },
  },
  {
    id: 'merchant',
    name: 'Wandering Merchant',
    char: '¤',
    color: '#ffd700',
    minFloor: 3,
    spawnChance: 0.25,
    appearanceDescription: 'A shifty-looking goblin merchant with golden eyes and a wide grin. Wears a heavy cloak covered in pockets and pouches. Carries a massive backpack overflowing with mysterious trinkets and potions. Gold coins jingling from a belt.',
    dialogue: {
      text: "Psst! I have wares not found in any shop. Care to trade?",
      choices: [
        {
          label: '[ Trade 10g ]',
          responseText: 'A fine deal! Here, take this.',
          effects: [
            { type: 'gold', amount: -10 },
            { type: 'item', itemName: 'Strength Potion' },
            { type: 'npcChoice', eventId: 'merchant', choiceId: 'trade' },
            { type: 'message', text: 'The Merchant hands you a Strength Potion.', color: '#ffd700' },
          ],
        },
        {
          label: '[ Decline ]',
          responseText: 'Your loss, adventurer.',
          effects: [
            { type: 'npcChoice', eventId: 'merchant', choiceId: 'decline' },
            { type: 'message', text: 'You decline the offer.', color: '#8888aa' },
          ],
        },
      ],
    },
  },
  {
    id: 'ancestor_ghost',
    name: 'Ghost of an Ancestor',
    char: '&',
    color: '#c49eff',
    minFloor: 5,
    spawnChance: 0.2,
    requiresGeneration: 1,
    appearanceDescription: 'A translucent purple spirit in ancient warrior armor. Ethereal and glowing, with hollow eyes that burn with spectral light. Faded features but a kind expression. Wisps of ectoplasm trail from their form.',
    dialogue: (bloodline: BloodlineData): DialogueNode => {
      const lastAncestor = bloodline.ancestors[bloodline.ancestors.length - 1];
      const name = lastAncestor?.name ?? 'a forgotten ancestor';
      return {
        text: `I am ${name}, your ancestor. I fell on these very floors. Take my blessing, descendant.`,
        choices: [
          {
            label: '[ Accept Blessing ]',
            responseText: 'May your blade strike true, descendant.',
            effects: [
              { type: 'statBuff', stat: 'attack', amount: 2 },
              { type: 'heal', amount: 10 },
              { type: 'npcChoice', eventId: 'ancestor_ghost', choiceId: 'bless' },
              { type: 'message', text: 'Your ancestor blesses you. +2 Atk, +10 HP.', color: '#c49eff' },
            ],
          },
          {
            label: '[ Pay Respects ]',
            responseText: 'I rest easier knowing my line continues.',
            effects: [
              { type: 'hunger', amount: 30 },
              { type: 'npcChoice', eventId: 'ancestor_ghost', choiceId: 'respect' },
              { type: 'message', text: 'A warm feeling fills you. +30 hunger.', color: '#c49eff' },
            ],
          },
        ],
      };
    },
  },
];

// Special intro NPC for generated class - created dynamically
function createGeneratedClassIntroNPC(gen: GeneratedClass): NPCDef {
  return {
    id: 'generated_class_intro',
    name: gen.name,
    char: gen.char || gen.icon || '★',
    color: gen.color || '#44ff88',
    minFloor: 1,
    spawnChance: 1.0, // Always spawn on floor 1
    dialogue: (): DialogueNode => {
      const abilityName = gen.ability?.name || 'my power';
      return {
        text: `I am ${gen.name}, ${gen.title}. ${gen.description.split('.')[0]}. My ${gen.resource.name} fuels ${abilityName}. Will you walk this path?`,
        choices: [
          {
            label: '[ Embrace the power ]',
            responseText: `The ${gen.resource.name} surges within you. You are ready.`,
            effects: [
              { type: 'npcChoice', eventId: 'generated_class_intro', choiceId: 'embrace' },
              { type: 'statBuff', stat: 'attack', amount: 1 },
              { type: 'message', text: `You embrace the path of the ${gen.name}. +1 Atk.`, color: gen.color || '#44ff88' },
            ],
          },
          {
            label: '[ Begin the journey ]',
            responseText: 'The depths await. Show them what you are.',
            effects: [
              { type: 'npcChoice', eventId: 'generated_class_intro', choiceId: 'journey' },
              { type: 'message', text: `You begin your journey as ${gen.name}.`, color: gen.color || '#44ff88' },
            ],
          },
        ],
      };
    },
  };
}

export function getNPCDef(defId: string): NPCDef | undefined {
  // Check for generated class intro
  if (defId === 'generated_class_intro') {
    const gen = getStoredGeneratedClass();
    if (gen) {
      return createGeneratedClassIntroNPC(gen);
    }
  }
  const standard = NPC_DEFS.find((n) => n.id === defId);
  if (standard) return standard;

  // Fallback: check story mode NPC registry
  const storyNpc = _getStoryNpcDef(defId);
  if (storyNpc) {
    return {
      id: storyNpc.id,
      name: storyNpc.name,
      char: storyNpc.char,
      color: storyNpc.color,
      minFloor: 0,
      spawnChance: 1,
      dialogue: storyNpc.dialogue,
      portraitUrl: undefined,
    };
  }
  return undefined;
}

export function getNPCDialogue(def: NPCDef, bloodline: BloodlineData): DialogueNode {
  if (typeof def.dialogue === 'function') {
    return def.dialogue(bloodline);
  }
  return def.dialogue;
}

export function spawnNPCs(
  floor: DungeonFloor,
  floorNumber: number,
  occupied: Set<string>,
  bloodline: BloodlineData,
  playerClass?: string,
  zone?: string,
): MapNPC[] {
  const npcs: MapNPC[] = [];
  const gen = getStoredGeneratedClass();

  // Special case: Floor 1 of narrative_test with generated class
  // Spawn ONLY the character intro NPC
  if (floorNumber === 1 && zone === 'narrative_test' && playerClass === 'generated' && gen) {
    const pos = findNPCSpawnPosition(floor, occupied);
    if (pos) {
      npcs.push({ id: uid(), pos, defId: 'generated_class_intro', talked: false });
      console.log('[NPC] Spawned generated class intro NPC:', gen.name);
    }
    return npcs; // Only the intro NPC, nothing else
  }

  for (const def of NPC_DEFS) {
    if (floorNumber < def.minFloor) continue;
    if (def.requiresGeneration && bloodline.generation < def.requiresGeneration) continue;
    if (Math.random() > def.spawnChance) continue;

    const pos = findNPCSpawnPosition(floor, occupied);
    if (pos) {
      npcs.push({ id: uid(), pos, defId: def.id, talked: false });
    }
  }

  // Cap at 1 NPC per floor to keep encounters special
  return npcs.slice(0, 1);
}

function findNPCSpawnPosition(floor: DungeonFloor, occupied: Set<string>): { x: number; y: number } | null {
  for (let attempt = 0; attempt < 50; attempt++) {
    const room = floor.rooms[randInt(0, floor.rooms.length - 1)];
    if (!room) continue;
    const x = randInt(room.x, room.x + room.w - 1);
    const y = randInt(room.y, room.y + room.h - 1);
    const key = `${x},${y}`;
    if (isWalkableTile(getTile(floor, x, y)) && !occupied.has(key)) {
      occupied.add(key);
      return { x, y };
    }
  }
  return null;
}
