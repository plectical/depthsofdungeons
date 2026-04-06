import type { 
  AlternativeBossEncounter, 
  AlternativeBossOutcome, 
  GameState,
  BloodlineData,
} from './types';
import { getFactionReputation, shouldShowAlternativeBoss } from './factions';

// ══════════════════════════════════════════════════════════════
// ALTERNATIVE BOSS ENCOUNTERS
// When player has high faction reputation, boss fights transform
// ══════════════════════════════════════════════════════════════

export const ALTERNATIVE_BOSS_ENCOUNTERS: AlternativeBossEncounter[] = [
  {
    bossName: 'Goblin King',
    requiredFaction: 'goblin',
    minReputation: 50,
    encounterType: 'election',
    title: 'The Goblin Election',
    description: 'The Goblin King recognizes your goblin blood. By ancient law, you may challenge for the throne.',
    dialogue: {
      rootNodeId: 'challenge',
      nodes: {
        challenge: {
          id: 'challenge',
          speaker: 'character',
          text: '"You... you smell of the horde. The blood runs in you now." The Goblin King studies you with ancient eyes. "By the Law of Ten Hearts, I must offer you challenge. Do you claim the throne?"',
          choices: [
            {
              id: 'claim_throne',
              label: '[Claim the Throne] "I challenge you, King."',
              responseText: 'You step forward.',
              effects: [],
              successNodeId: 'election_begins',
            },
            {
              id: 'refuse',
              label: '[Refuse] "I seek only passage."',
              responseText: 'You bow slightly.',
              effects: [],
              successNodeId: 'peaceful_passage',
            },
            {
              id: 'attack',
              label: '[Attack] Draw your weapon.',
              responseText: 'You ready yourself for battle.',
              effects: [],
              successNodeId: 'combat_start',
            },
          ],
        },
        election_begins: {
          id: 'election_begins',
          speaker: 'narrator',
          text: 'The chamber erupts in chittering. Goblins emerge from every shadow - dozens of them. They form a circle around you and the King. This is not a battle. It is a vote.',
          choices: [
            {
              id: 'continue',
              label: 'Face the judgement of the horde.',
              responseText: 'You stand tall.',
              effects: [],
              successNodeId: 'voting_round',
            },
          ],
        },
        voting_round: {
          id: 'voting_round',
          speaker: 'character',
          text: '"The horde will decide!" The King raises a clawed hand. "They remember every goblin you\'ve killed. Every one you spared. Every word spoken in our tongue. VOTE!"',
          choices: [
            {
              id: 'appeal_strength',
              label: '[Strength] "I am the strongest! Follow me to glory!"',
              responseText: 'You flex your power.',
              skillCheck: { skill: 'diplomacy', target: 12 },
              effects: [],
              successNodeId: 'appeal_success',
              failureNodeId: 'appeal_failure',
            },
            {
              id: 'appeal_cunning',
              label: '[Cunning] "I offer new schemes, new treasures!"',
              responseText: 'You appeal to their greed.',
              skillCheck: { skill: 'diplomacy', target: 10 },
              effects: [],
              successNodeId: 'appeal_success',
              failureNodeId: 'appeal_failure',
            },
            {
              id: 'appeal_kinship',
              label: '[Kinship] "I am one of you now. I feel what you feel."',
              responseText: 'You embrace your transformation.',
              effects: [],
              successNodeId: 'kinship_moment',
            },
          ],
        },
        appeal_success: {
          id: 'appeal_success',
          speaker: 'narrator',
          text: 'The goblins murmur among themselves. Many nod. Some cheer. The King\'s face darkens as the vote swings against him.',
          nextNodeId: 'final_vote',
        },
        appeal_failure: {
          id: 'appeal_failure',
          speaker: 'narrator',
          text: 'The goblins hiss in displeasure. Your words ring hollow. The King smirks - the vote remains with him.',
          nextNodeId: 'final_vote',
        },
        kinship_moment: {
          id: 'kinship_moment',
          speaker: 'narrator',
          text: 'You reach out with your transformed senses. You feel them - every goblin in the room. Their hunger. Their fear. Their desperate hope. And they feel you feeling them. The connection is undeniable.',
          nextNodeId: 'kinship_vote',
        },
        kinship_vote: {
          id: 'kinship_vote',
          speaker: 'character',
          text: 'The King staggers back. "Impossible... the telepathic bond... you\'ve already joined the horde-mind!" Goblins begin chanting your name. The vote is overwhelming.',
          nextNodeId: 'victory',
        },
        final_vote: {
          id: 'final_vote',
          speaker: 'narrator',
          text: 'The horde has voted. The count is close. Every goblin you killed weighs against you. Every one you spared speaks in your favor.',
          choices: [
            {
              id: 'accept_result',
              label: 'Accept the vote.',
              responseText: 'You wait for judgment.',
              effects: [],
              successNodeId: 'vote_result',
            },
          ],
        },
        vote_result: {
          id: 'vote_result',
          speaker: 'narrator',
          text: 'The Elder Goblin steps forward to announce the result...',
          nextNodeId: 'victory', // This would be determined by actual reputation
        },
        victory: {
          id: 'victory',
          speaker: 'character',
          text: '"NO!" The Goblin King screams as the horde turns against him. "I AM THE KING!" But the goblins swarm him, their loyalty now yours. By the Law of Ten Hearts, the loser must be consumed.',
          nextNodeId: 'consumption',
        },
        consumption: {
          id: 'consumption',
          speaker: 'narrator',
          text: 'The goblins hold the former King down. An ancient goblin shaman approaches with a obsidian blade. "The heart must be taken. The tenth chamber must be filled. You must consume your predecessor."',
          choices: [
            {
              id: 'consume_heart',
              label: '[Consume] Eat the heart. Complete the ritual.',
              responseText: 'You reach for the blade.',
              effects: [],
              successNodeId: 'become_king',
            },
            {
              id: 'refuse_ritual',
              label: '[Mercy] "No. I will rule differently."',
              responseText: 'You stay the blade.',
              effects: [],
              successNodeId: 'mercy_ending',
            },
          ],
        },
        become_king: {
          id: 'become_king',
          speaker: 'narrator',
          text: 'You consume the heart. Power floods through you - the memories of ten kings, stretching back to the founding of the dungeon. Your heart transforms, growing chambers to hold the power of your predecessors. You are the Goblin King now.',
        },
        mercy_ending: {
          id: 'mercy_ending',
          speaker: 'narrator',
          text: 'The goblins stare in confusion. No king has ever refused the ritual. But you are something new. A were-goblin king who remembers being human. Perhaps that\'s exactly what the horde needs. They bow anyway.',
        },
        peaceful_passage: {
          id: 'peaceful_passage',
          speaker: 'character',
          text: '"So be it. You walk between worlds, neither fully human nor goblin. The horde will not hinder you." He waves a clawed hand. "Take the key. Descend deeper. But remember - you are always welcome to return and claim what is yours."',
        },
        combat_start: {
          id: 'combat_start',
          speaker: 'narrator',
          text: 'The Goblin King\'s eyes flash with rage. "You DARE attack one who offered you kinship?! HORDE - DESTROY THIS TRAITOR!" Goblins pour from the shadows, and the King draws his blade.',
        },
      },
    },
    outcomes: [
      {
        id: 'become_king',
        name: 'Goblin King',
        description: 'You consumed the heart and became the Goblin King.',
        conditions: [
          { type: 'choice', value: 'consume_heart' },
        ],
        rewards: [
          { type: 'class_transform', value: 'goblin_king' },
          { type: 'item', value: 'Crown of the Goblin King' },
          { type: 'ability', value: 'command_horde' },
          { type: 'faction_control', value: 'goblin' },
        ],
        narrativeText: 'You are the Goblin King. All goblins in the dungeon now serve you. They will fight for you, die for you, and bring you treasures.',
      },
      {
        id: 'merciful_king',
        name: 'Merciful King',
        description: 'You became king without consuming the heart.',
        conditions: [
          { type: 'choice', value: 'refuse_ritual' },
        ],
        rewards: [
          { type: 'item', value: 'Crown of the Goblin King' },
          { type: 'reputation', value: 30 },
          { type: 'faction_control', value: 'goblin' },
        ],
        narrativeText: 'You rule the goblins, but you kept your humanity. They follow you out of respect rather than fear.',
      },
      {
        id: 'passage',
        name: 'Peaceful Passage',
        description: 'You refused the throne but gained safe passage.',
        conditions: [
          { type: 'choice', value: 'refuse' },
        ],
        rewards: [
          { type: 'item', value: 'Goblin King\'s Key' },
          { type: 'reputation', value: 10 },
        ],
        narrativeText: 'The goblins let you pass. You are not their king, but you are not their enemy either.',
      },
      {
        id: 'combat',
        name: 'Combat',
        description: 'You chose to fight the Goblin King.',
        conditions: [
          { type: 'choice', value: 'attack' },
        ],
        rewards: [],
        narrativeText: 'You chose violence. The goblins will remember this betrayal.',
      },
    ],
  },
];

// Check if an alternative boss encounter should trigger
export function getAlternativeBossEncounter(
  bossName: string,
  bloodline: BloodlineData
): AlternativeBossEncounter | undefined {
  const encounter = ALTERNATIVE_BOSS_ENCOUNTERS.find(e => e.bossName === bossName);
  if (!encounter) return undefined;
  
  const rep = getFactionReputation(bloodline, encounter.requiredFaction);
  if (rep.reputation < encounter.minReputation) return undefined;
  
  if (!shouldShowAlternativeBoss(bloodline, encounter.requiredFaction)) return undefined;
  
  return encounter;
}

// Process the outcome of an alternative boss encounter
export function processAlternativeBossOutcome(
  _state: GameState,
  encounter: AlternativeBossEncounter,
  choicesMade: string[]
): AlternativeBossOutcome | undefined {
  // Find matching outcome based on choices
  for (const outcome of encounter.outcomes) {
    const allConditionsMet = outcome.conditions.every(condition => {
      if (condition.type === 'choice') {
        return choicesMade.includes(condition.value as string);
      }
      return false;
    });
    
    if (allConditionsMet) {
      return outcome;
    }
  }
  
  return undefined;
}

// Apply rewards from an alternative boss outcome
export function applyAlternativeBossRewards(
  _state: GameState,
  outcome: AlternativeBossOutcome
): void {
  for (const reward of outcome.rewards) {
    switch (reward.type) {
      case 'class_transform':
        // This would set a special transformed class
        console.log(`[AltBoss] Class transform to: ${reward.value}`);
        break;
      case 'item':
        // This would give the player an item
        console.log(`[AltBoss] Grant item: ${reward.value}`);
        break;
      case 'ability':
        // This would unlock a special ability
        console.log(`[AltBoss] Unlock ability: ${reward.value}`);
        break;
      case 'faction_control':
        // This would set the player as faction leader
        console.log(`[AltBoss] Faction control: ${reward.value}`);
        break;
      case 'reputation':
        // This would modify faction reputation
        console.log(`[AltBoss] Reputation change: ${reward.value}`);
        break;
    }
  }
}

// Get list of all alternative boss names
export function getAlternativeBossNames(): string[] {
  return ALTERNATIVE_BOSS_ENCOUNTERS.map(e => e.bossName);
}

// Check if a boss has an alternative encounter available
export function hasAlternativeEncounter(bossName: string): boolean {
  return ALTERNATIVE_BOSS_ENCOUNTERS.some(e => e.bossName === bossName);
}
