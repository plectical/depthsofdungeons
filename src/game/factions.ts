import type { FactionId, FactionDef, FactionReputation, FactionTier, FactionTierName, BloodlineData } from './types';

// ══════════════════════════════════════════════════════════════
// FACTION DEFINITIONS
// ══════════════════════════════════════════════════════════════

export const FACTION_DEFS: FactionDef[] = [
  {
    id: 'goblin',
    name: 'Goblin Horde',
    description: 'The cunning, desperate creatures who scrabble through the depths. They were not always monsters.',
    color: '#44ff44',
    icon: 'g',
    creatureKeywords: ['goblin', 'hobgoblin', 'bugbear'],
    afflictionId: 'were_goblin',
    bossName: 'Goblin King',
    tiers: [
      {
        id: 'despised',
        minRep: -100,
        maxRep: -50,
        name: 'Despised',
        color: '#ff2222',
        effects: [
          { type: 'damage_taken', value: 1.5, description: 'Goblins deal 50% more damage to you' },
          { type: 'dialogue_chance', value: 0, description: 'Goblins attack on sight' },
        ],
      },
      {
        id: 'hostile',
        minRep: -50,
        maxRep: -10,
        name: 'Hostile',
        color: '#ff6644',
        effects: [
          { type: 'damage_taken', value: 1.0, description: 'Normal combat' },
          { type: 'dialogue_chance', value: 0.1, description: '10% chance of dialogue' },
        ],
      },
      {
        id: 'neutral',
        minRep: -10,
        maxRep: 10,
        name: 'Neutral',
        color: '#888888',
        effects: [
          { type: 'dialogue_chance', value: 0.5, description: '50% chance of dialogue before combat' },
        ],
      },
      {
        id: 'friendly',
        minRep: 10,
        maxRep: 50,
        name: 'Friendly',
        color: '#88cc44',
        effects: [
          { type: 'dialogue_chance', value: 0.8, description: '80% chance of dialogue' },
          { type: 'help_chance', value: 0.2, description: 'Goblins may share secrets or help' },
        ],
      },
      {
        id: 'honored',
        minRep: 50,
        maxRep: 80,
        name: 'Honored',
        color: '#44ff88',
        effects: [
          { type: 'dialogue_chance', value: 1.0, description: 'Goblins always talk first' },
          { type: 'help_chance', value: 0.5, description: 'Goblins often help you' },
          { type: 'telepathy', value: 1, description: 'You hear goblin whispers in your mind' },
          { type: 'boss_alternative', value: 1, description: 'Goblin King fight becomes an election' },
        ],
      },
      {
        id: 'exalted',
        minRep: 80,
        maxRep: 100,
        name: 'Exalted',
        color: '#44ffcc',
        effects: [
          { type: 'damage_dealt', value: 0, description: 'Goblins will not attack you' },
          { type: 'transformation_available', value: 1, description: 'Were-Goblin transformation available' },
          { type: 'boss_alternative', value: 1, description: 'You can challenge for the throne' },
        ],
      },
    ],
  },
  {
    id: 'undead',
    name: 'The Unliving',
    description: 'Souls trapped between death and rest. Some remember who they were. Most have forgotten.',
    color: '#aa88ff',
    icon: 'z',
    creatureKeywords: ['skeleton', 'zombie', 'ghost', 'wraith', 'shade', 'specter', 'lich', 'vampire'],
    afflictionId: 'vampiric',
    bossName: 'Lich Lord',
    tiers: [
      {
        id: 'despised',
        minRep: -100,
        maxRep: -50,
        name: 'Living Prey',
        color: '#ff2222',
        effects: [
          { type: 'damage_taken', value: 1.3, description: 'Undead hunger for your life force' },
        ],
      },
      {
        id: 'hostile',
        minRep: -50,
        maxRep: -10,
        name: 'Warmblood',
        color: '#ff6644',
        effects: [
          { type: 'dialogue_chance', value: 0.05, description: 'Rare chance an undead remembers speech' },
        ],
      },
      {
        id: 'neutral',
        minRep: -10,
        maxRep: 10,
        name: 'Neither Living Nor Dead',
        color: '#888888',
        effects: [
          { type: 'dialogue_chance', value: 0.3, description: 'Some undead pause before attacking' },
        ],
      },
      {
        id: 'friendly',
        minRep: 10,
        maxRep: 50,
        name: 'Death-Touched',
        color: '#8866cc',
        effects: [
          { type: 'dialogue_chance', value: 0.6, description: 'Undead sense the death upon you' },
          { type: 'help_chance', value: 0.15, description: 'Some undead share forgotten knowledge' },
        ],
      },
      {
        id: 'honored',
        minRep: 50,
        maxRep: 80,
        name: 'Deathwalker',
        color: '#aa44ff',
        effects: [
          { type: 'dialogue_chance', value: 0.9, description: 'Undead recognize you as kin' },
          { type: 'telepathy', value: 1, description: 'You hear the whispers of the dead' },
        ],
      },
      {
        id: 'exalted',
        minRep: 80,
        maxRep: 100,
        name: 'Lord of Bones',
        color: '#cc44ff',
        effects: [
          { type: 'damage_dealt', value: 0, description: 'Undead bow before you' },
          { type: 'transformation_available', value: 1, description: 'Vampiric transformation available' },
        ],
      },
    ],
  },
  {
    id: 'demon',
    name: 'The Infernal',
    description: 'Beings of pure malice and fire. They offer power at terrible cost.',
    color: '#ff4444',
    icon: 'd',
    creatureKeywords: ['demon', 'imp', 'hellspawn', 'fiend', 'devil', 'succubus', 'incubus'],
    afflictionId: 'demonic_pact',
    bossName: 'Archfiend',
    tiers: [
      {
        id: 'despised',
        minRep: -100,
        maxRep: -50,
        name: 'Pure Soul',
        color: '#4488ff',
        effects: [
          { type: 'damage_taken', value: 0.8, description: 'Your purity repels demonic attacks' },
        ],
      },
      {
        id: 'hostile',
        minRep: -50,
        maxRep: -10,
        name: 'Uncorrupted',
        color: '#6688cc',
        effects: [
          { type: 'dialogue_chance', value: 0.2, description: 'Demons offer dark bargains' },
        ],
      },
      {
        id: 'neutral',
        minRep: -10,
        maxRep: 10,
        name: 'Tempted',
        color: '#888888',
        effects: [
          { type: 'dialogue_chance', value: 0.5, description: 'Demons sense your wavering soul' },
        ],
      },
      {
        id: 'friendly',
        minRep: 10,
        maxRep: 50,
        name: 'Tainted',
        color: '#cc6644',
        effects: [
          { type: 'dialogue_chance', value: 0.7, description: 'Your corruption attracts demons' },
          { type: 'help_chance', value: 0.25, description: 'Demons offer power for a price' },
        ],
      },
      {
        id: 'honored',
        minRep: 50,
        maxRep: 80,
        name: 'Hell-Touched',
        color: '#ff6644',
        effects: [
          { type: 'damage_dealt', value: 1.2, description: 'Hellfire burns in your veins' },
          { type: 'telepathy', value: 1, description: 'You hear the screams of the damned' },
        ],
      },
      {
        id: 'exalted',
        minRep: 80,
        maxRep: 100,
        name: 'Demonkin',
        color: '#ff2222',
        effects: [
          { type: 'transformation_available', value: 1, description: 'Demonic pact transformation available' },
          { type: 'damage_dealt', value: 1.5, description: 'Hellfire courses through you' },
        ],
      },
    ],
  },
  {
    id: 'beast',
    name: 'The Wild',
    description: 'Creatures of instinct and savagery. They know no morality, only survival.',
    color: '#cc8844',
    icon: 'b',
    creatureKeywords: ['rat', 'bat', 'spider', 'wolf', 'bear', 'snake', 'scorpion', 'boar', 'hound'],
    afflictionId: 'lycanthropy',
    bossName: 'Alpha Beast',
    tiers: [
      {
        id: 'despised',
        minRep: -100,
        maxRep: -50,
        name: 'Prey',
        color: '#ff4444',
        effects: [
          { type: 'damage_taken', value: 1.4, description: 'Beasts smell your fear' },
        ],
      },
      {
        id: 'hostile',
        minRep: -50,
        maxRep: -10,
        name: 'Intruder',
        color: '#ff8844',
        effects: [
          { type: 'dialogue_chance', value: 0, description: 'Beasts do not speak' },
        ],
      },
      {
        id: 'neutral',
        minRep: -10,
        maxRep: 10,
        name: 'Unknown Scent',
        color: '#888888',
        effects: [
          { type: 'dialogue_chance', value: 0.1, description: 'Some beasts hesitate' },
        ],
      },
      {
        id: 'friendly',
        minRep: 10,
        maxRep: 50,
        name: 'Pack-Adjacent',
        color: '#aa8844',
        effects: [
          { type: 'dialogue_chance', value: 0.3, description: 'Beasts sense kinship' },
          { type: 'help_chance', value: 0.1, description: 'Some beasts may follow' },
        ],
      },
      {
        id: 'honored',
        minRep: 50,
        maxRep: 80,
        name: 'Pack Member',
        color: '#88aa44',
        effects: [
          { type: 'damage_dealt', value: 0.5, description: 'Beasts only defend themselves' },
          { type: 'telepathy', value: 1, description: 'You sense the pack mind' },
        ],
      },
      {
        id: 'exalted',
        minRep: 80,
        maxRep: 100,
        name: 'Alpha',
        color: '#44cc44',
        effects: [
          { type: 'transformation_available', value: 1, description: 'Lycanthropy transformation available' },
          { type: 'damage_dealt', value: 0, description: 'Beasts obey your presence' },
        ],
      },
    ],
  },
  {
    id: 'elemental',
    name: 'The Primordial',
    description: 'Manifestations of raw elemental power. They exist beyond mortal understanding.',
    color: '#44ccff',
    icon: 'e',
    creatureKeywords: ['elemental', 'golem', 'wisp', 'sprite', 'djinn', 'salamander'],
    afflictionId: 'elemental_infusion',
    bossName: 'Elemental Lord',
    tiers: [
      {
        id: 'despised',
        minRep: -100,
        maxRep: -50,
        name: 'Flesh Thing',
        color: '#888888',
        effects: [
          { type: 'damage_taken', value: 1.2, description: 'Elementals despise your mortal form' },
        ],
      },
      {
        id: 'hostile',
        minRep: -50,
        maxRep: -10,
        name: 'Impure',
        color: '#aaaaaa',
        effects: [],
      },
      {
        id: 'neutral',
        minRep: -10,
        maxRep: 10,
        name: 'Mundane',
        color: '#888888',
        effects: [
          { type: 'dialogue_chance', value: 0.2, description: 'Elementals may acknowledge you' },
        ],
      },
      {
        id: 'friendly',
        minRep: 10,
        maxRep: 50,
        name: 'Resonant',
        color: '#44aacc',
        effects: [
          { type: 'dialogue_chance', value: 0.5, description: 'Elementals sense your attunement' },
        ],
      },
      {
        id: 'honored',
        minRep: 50,
        maxRep: 80,
        name: 'Conduit',
        color: '#44ccff',
        effects: [
          { type: 'damage_dealt', value: 1.3, description: 'Elemental power flows through you' },
          { type: 'telepathy', value: 1, description: 'You hear the song of elements' },
        ],
      },
      {
        id: 'exalted',
        minRep: 80,
        maxRep: 100,
        name: 'Avatar',
        color: '#88ffff',
        effects: [
          { type: 'transformation_available', value: 1, description: 'Elemental infusion available' },
        ],
      },
    ],
  },
];

// ══════════════════════════════════════════════════════════════
// FACTION UTILITY FUNCTIONS
// ══════════════════════════════════════════════════════════════

export function getFactionDef(factionId: FactionId): FactionDef | undefined {
  return FACTION_DEFS.find(f => f.id === factionId);
}

export function getFactionForCreature(creatureName: string): FactionId | undefined {
  const nameLower = creatureName.toLowerCase();
  for (const faction of FACTION_DEFS) {
    for (const keyword of faction.creatureKeywords) {
      if (nameLower.includes(keyword)) {
        return faction.id;
      }
    }
  }
  return undefined;
}

export function getDefaultFactionReputation(factionId: FactionId): FactionReputation {
  return {
    factionId,
    reputation: 0,
    encountered: 0,
    killed: 0,
    befriended: 0,
    transformations: 0,
  };
}

export function ensureFactionReputations(bloodline: BloodlineData): FactionReputation[] {
  if (!bloodline.factionReputations) {
    bloodline.factionReputations = FACTION_DEFS.map(f => getDefaultFactionReputation(f.id));
  }
  // Ensure all factions exist (in case new ones were added)
  for (const faction of FACTION_DEFS) {
    if (!bloodline.factionReputations.find(r => r.factionId === faction.id)) {
      bloodline.factionReputations.push(getDefaultFactionReputation(faction.id));
    }
  }
  return bloodline.factionReputations;
}

export function getFactionReputation(bloodline: BloodlineData, factionId: FactionId): FactionReputation {
  const reps = ensureFactionReputations(bloodline);
  return reps.find(r => r.factionId === factionId) ?? getDefaultFactionReputation(factionId);
}

export function getFactionTier(reputation: number, factionId: FactionId): FactionTier | undefined {
  const faction = getFactionDef(factionId);
  if (!faction) return undefined;
  
  for (const tier of faction.tiers) {
    if (reputation >= tier.minRep && reputation <= tier.maxRep) {
      return tier;
    }
  }
  return faction.tiers[0]; // Default to first (worst) tier
}

export function getFactionTierByName(factionId: FactionId, tierName: FactionTierName): FactionTier | undefined {
  const faction = getFactionDef(factionId);
  if (!faction) return undefined;
  return faction.tiers.find(t => t.id === tierName);
}

export function modifyFactionReputation(
  bloodline: BloodlineData,
  factionId: FactionId,
  delta: number,
  reason: 'kill' | 'befriend' | 'transform' | 'dialogue' | 'item'
): { newRep: number; oldTier: FactionTier | undefined; newTier: FactionTier | undefined } {
  const reps = ensureFactionReputations(bloodline);
  const rep = reps.find(r => r.factionId === factionId);
  if (!rep) {
    return { newRep: 0, oldTier: undefined, newTier: undefined };
  }
  
  const oldTier = getFactionTier(rep.reputation, factionId);
  
  // Update reputation (clamped to -100 to 100)
  rep.reputation = Math.max(-100, Math.min(100, rep.reputation + delta));
  
  // Update counters
  if (reason === 'kill') {
    rep.killed++;
    rep.encountered++;
  } else if (reason === 'befriend') {
    rep.befriended++;
    rep.encountered++;
  } else if (reason === 'transform') {
    rep.transformations++;
  } else if (reason === 'dialogue') {
    rep.encountered++;
  }
  
  const newTier = getFactionTier(rep.reputation, factionId);
  
  return { newRep: rep.reputation, oldTier, newTier };
}

export function hasFactionEffect(
  bloodline: BloodlineData,
  factionId: FactionId,
  effectType: 'damage_taken' | 'damage_dealt' | 'dialogue_chance' | 'help_chance' | 
              'transformation_available' | 'boss_alternative' | 'telepathy'
): number {
  const rep = getFactionReputation(bloodline, factionId);
  const tier = getFactionTier(rep.reputation, factionId);
  if (!tier) return 0;
  
  const effect = tier.effects.find(e => e.type === effectType);
  return effect?.value ?? 0;
}

export function canTransformIntoFaction(bloodline: BloodlineData, factionId: FactionId): boolean {
  return hasFactionEffect(bloodline, factionId, 'transformation_available') > 0;
}

export function shouldShowAlternativeBoss(bloodline: BloodlineData, factionId: FactionId): boolean {
  return hasFactionEffect(bloodline, factionId, 'boss_alternative') > 0;
}

export function getDialogueChance(bloodline: BloodlineData, factionId: FactionId): number {
  const rep = getFactionReputation(bloodline, factionId);
  const tier = getFactionTier(rep.reputation, factionId);
  if (!tier) return 0;
  
  const effect = tier.effects.find(e => e.type === 'dialogue_chance');
  return effect?.value ?? 0;
}

export function getDamageTakenMultiplier(bloodline: BloodlineData, factionId: FactionId): number {
  const rep = getFactionReputation(bloodline, factionId);
  const tier = getFactionTier(rep.reputation, factionId);
  if (!tier) return 1;
  
  const effect = tier.effects.find(e => e.type === 'damage_taken');
  return effect?.value ?? 1;
}

export function getDamageDealtMultiplier(bloodline: BloodlineData, factionId: FactionId): number {
  const rep = getFactionReputation(bloodline, factionId);
  const tier = getFactionTier(rep.reputation, factionId);
  if (!tier) return 1;
  
  const effect = tier.effects.find(e => e.type === 'damage_dealt');
  // If value is 0, creatures won't attack (peace)
  // If value > 1, bonus damage
  // If value < 1, reduced damage
  return effect?.value ?? 1;
}

// Reputation change constants
export const REPUTATION_CHANGES = {
  KILL_CREATURE: -5,          // Killing a faction creature
  KILL_CREATURE_BRUTAL: -10,  // Overkill or cruel kill
  PEACEFUL_RESOLUTION: 5,     // Talking instead of fighting
  HELP_CREATURE: 10,          // Helping a creature with a request
  BETRAY_CREATURE: -15,       // Betraying after befriending
  ACCEPT_TRANSFORMATION: 20,  // Accepting faction transformation
  REFUSE_TRANSFORMATION: -5,  // Refusing transformation offer
  COMPLETE_FACTION_QUEST: 15, // Completing a quest for the faction
  DEFEAT_FACTION_BOSS: -20,   // Killing the faction boss (normal fight)
  SPARE_FACTION_BOSS: 30,     // Sparing or allying with boss
};
