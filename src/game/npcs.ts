import type { NPCDef, MapNPC, DungeonFloor, BloodlineData, DialogueNode } from './types';
import { uid, randInt } from './utils';
import { isWalkableTile, getTile } from './dungeon';

export const NPC_DEFS: NPCDef[] = [
  {
    id: 'hermit',
    name: 'The Hermit',
    char: '☽',
    color: '#88aaff',
    minFloor: 2,
    spawnChance: 0.3,
    dialogue: {
      text: 'I have wandered these depths for ages. Will you hear my wisdom, or press on?',
      choices: [
        {
          label: '[ Listen ]',
          responseText: 'Remember: patience outlasts fury. Take this knowledge.',
          effects: [
            { type: 'npcChoice', eventId: 'hermit', choiceId: 'listen' },
            { type: 'statBuff', stat: 'defense', amount: 1 },
            { type: 'message', text: 'The Hermit shares ancient wisdom. +1 Def this run.', color: '#88aaff' },
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
    },
  },
  {
    id: 'merchant',
    name: 'Wandering Merchant',
    char: '¤',
    color: '#ffd700',
    minFloor: 3,
    spawnChance: 0.25,
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

export function getNPCDef(defId: string): NPCDef | undefined {
  return NPC_DEFS.find((n) => n.id === defId);
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
): MapNPC[] {
  const npcs: MapNPC[] = [];

  for (const def of NPC_DEFS) {
    if (floorNumber < def.minFloor) continue;
    if (def.requiresGeneration && bloodline.generation < def.requiresGeneration) continue;
    if (Math.random() > def.spawnChance) continue;

    // Find a walkable position
    let pos = null;
    for (let attempt = 0; attempt < 50; attempt++) {
      const room = floor.rooms[randInt(0, floor.rooms.length - 1)];
      if (!room) continue;
      const x = randInt(room.x, room.x + room.w - 1);
      const y = randInt(room.y, room.y + room.h - 1);
      const key = `${x},${y}`;
      if (isWalkableTile(getTile(floor, x, y)) && !occupied.has(key)) {
        occupied.add(key);
        pos = { x, y };
        break;
      }
    }

    if (pos) {
      npcs.push({ id: uid(), pos, defId: def.id, talked: false });
    }
  }

  // Cap at 1 NPC per floor to keep encounters special
  return npcs.slice(0, 1);
}
