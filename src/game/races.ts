/**
 * Race System — 32 playable races across 6 categories.
 * Each race provides small stat tweaks and a racial passive.
 * Most races must be unlocked through gameplay progression.
 */

import type { BloodlineData } from './types';

export type RaceCategory = 'humanoid' | 'beastfolk' | 'undead' | 'demonic' | 'elemental' | 'aberration';

export interface RacePassive {
  name: string;
  description: string;
  effectKey: string;
}

export interface RaceStatMods {
  hp?: number;
  attack?: number;
  defense?: number;
  speed?: number;
}

export type RaceUnlockType =
  | 'free'
  | 'floor'            // Reach a floor depth
  | 'kills'            // Total kills across all runs
  | 'deaths'           // Die N times (bloodline generation)
  | 'boss_kills'       // Kill N bosses total
  | 'class_run'        // Complete a run as a specific class
  | 'race_run'         // Complete a run as a specific race
  | 'zone_clear'       // Clear a specific zone
  | 'bestiary'         // Discover N bestiary entries
  | 'gold_earned'      // Earn N gold total across runs
  | 'traits_unlocked'; // Unlock N bloodline traits

export interface RaceUnlockReq {
  type: RaceUnlockType;
  value: number;
  qualifier?: string; // class id, zone id, race id, etc.
  label: string;      // Human-readable requirement text
}

export interface RaceDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: RaceCategory;
  statMods: RaceStatMods;
  passive: RacePassive;
  thumbnailFile: string;
  unlock: RaceUnlockReq;
}

export const RACE_CATEGORIES: { id: RaceCategory; name: string; color: string }[] = [
  { id: 'humanoid', name: 'Humanoid', color: '#ffcc44' },
  { id: 'beastfolk', name: 'Beastfolk', color: '#44cc88' },
  { id: 'undead', name: 'Undead', color: '#aa44dd' },
  { id: 'demonic', name: 'Demonic', color: '#ff4444' },
  { id: 'elemental', name: 'Elemental', color: '#44aaff' },
  { id: 'aberration', name: 'Aberration', color: '#88ff44' },
];

export const RACE_DEFS: RaceDef[] = [
  // ══════════════════════════════════════
  // HUMANOID
  // ══════════════════════════════════════
  {
    id: 'human', name: 'Human', icon: 'H', color: '#ffcc88',
    category: 'humanoid',
    description: 'Versatile and adaptable. No weaknesses, no extremes.',
    statMods: { hp: 2, attack: 1 },
    passive: { name: 'Adaptable', description: '+10% XP from all sources', effectKey: 'xp_boost_10' },
    thumbnailFile: 'human.png',
    unlock: { type: 'free', value: 0, label: 'Available from the start' },
  },
  {
    id: 'dwarf', name: 'Dwarf', icon: 'D', color: '#cc8844',
    category: 'humanoid',
    description: 'Short, sturdy, and impossibly tough. Born underground.',
    statMods: { hp: 4, defense: 1, speed: -1 },
    passive: { name: 'Stone Resilience', description: 'Take 1 less damage from all sources', effectKey: 'flat_dr_1' },
    thumbnailFile: 'dwarf.png',
    unlock: { type: 'free', value: 0, label: 'Available from the start' },
  },
  {
    id: 'elf', name: 'Elf', icon: 'E', color: '#88ccff',
    category: 'humanoid',
    description: 'Graceful and perceptive. Quick but fragile.',
    statMods: { speed: 3, attack: 1, hp: -3 },
    passive: { name: 'Keen Senses', description: '+2 vision range in darkness', effectKey: 'vision_bonus_2' },
    thumbnailFile: 'elf.png',
    unlock: { type: 'free', value: 0, label: 'Available from the start' },
  },
  {
    id: 'halfling', name: 'Halfling', icon: 'h', color: '#ffaa66',
    category: 'humanoid',
    description: 'Tiny and lucky. Enemies have trouble hitting them.',
    statMods: { speed: 2, hp: -2 },
    passive: { name: 'Lucky', description: '10% chance to completely dodge any attack', effectKey: 'dodge_10' },
    thumbnailFile: 'halfling.png',
    unlock: { type: 'deaths', value: 2, label: 'Die 2 times' },
  },
  {
    id: 'orc', name: 'Orc', icon: 'O', color: '#66aa44',
    category: 'humanoid',
    description: 'Massive and brutal. Hits hard, bleeds harder.',
    statMods: { attack: 3, hp: 2, defense: -1 },
    passive: { name: 'Blood Rage', description: '+2 attack when below 50% HP', effectKey: 'blood_rage' },
    thumbnailFile: 'orc.png',
    unlock: { type: 'kills', value: 50, label: 'Kill 50 enemies' },
  },
  {
    id: 'goblin', name: 'Goblin', icon: 'g', color: '#88cc22',
    category: 'humanoid',
    description: 'Sneaky, greedy, and surprisingly resourceful.',
    statMods: { speed: 2, hp: -3, attack: 1 },
    passive: { name: 'Scavenger', description: 'Enemies drop 25% more gold', effectKey: 'gold_boost_25' },
    thumbnailFile: 'goblin.png',
    unlock: { type: 'gold_earned', value: 500, label: 'Earn 500 gold total' },
  },

  // ══════════════════════════════════════
  // BEASTFOLK
  // ══════════════════════════════════════
  {
    id: 'ratfolk', name: 'Ratfolk', icon: 'r', color: '#aa8866',
    category: 'beastfolk',
    description: 'Quick and cunning. Thrives in the dark.',
    statMods: { speed: 3, defense: -1 },
    passive: { name: 'Tunnel Vision', description: '+1 vision range, find hidden rooms easier', effectKey: 'vision_bonus_1' },
    thumbnailFile: 'ratfolk.png',
    unlock: { type: 'floor', value: 3, label: 'Reach floor 3' },
  },
  {
    id: 'lizardfolk', name: 'Lizardfolk', icon: 'L', color: '#44aa66',
    category: 'beastfolk',
    description: 'Cold-blooded and armored with thick scales.',
    statMods: { defense: 2, hp: 2, speed: -1 },
    passive: { name: 'Regeneration', description: 'Heal 1 HP every 8 turns', effectKey: 'regen_8' },
    thumbnailFile: 'lizardfolk.png',
    unlock: { type: 'floor', value: 5, label: 'Reach floor 5' },
  },
  {
    id: 'wolfkin', name: 'Wolfkin', icon: 'W', color: '#8899aa',
    category: 'beastfolk',
    description: 'Fierce pack hunter with razor instincts.',
    statMods: { attack: 2, speed: 2, hp: -2 },
    passive: { name: 'Pack Hunter', description: '+3 damage when mercenary allies are nearby', effectKey: 'pack_bonus_3' },
    thumbnailFile: 'wolfkin.png',
    unlock: { type: 'kills', value: 100, label: 'Kill 100 enemies' },
  },
  {
    id: 'spiderkin', name: 'Spiderkin', icon: 'S', color: '#774488',
    category: 'beastfolk',
    description: 'Eight-limbed horror. Weaves webs of death.',
    statMods: { speed: 2, attack: 1, hp: -2 },
    passive: { name: 'Web Walker', description: '15% chance to slow enemies on hit for 2 turns', effectKey: 'slow_on_hit_15' },
    thumbnailFile: 'spiderkin.png',
    unlock: { type: 'bestiary', value: 15, label: 'Discover 15 bestiary entries' },
  },
  {
    id: 'bearkin', name: 'Bearkin', icon: 'B', color: '#886644',
    category: 'beastfolk',
    description: 'Enormous and powerful. Absorbs punishment like a mountain.',
    statMods: { hp: 6, defense: 1, speed: -3 },
    passive: { name: 'Thick Hide', description: '20% chance to halve incoming damage', effectKey: 'halve_dmg_20' },
    thumbnailFile: 'bearkin.png',
    unlock: { type: 'boss_kills', value: 3, label: 'Kill 3 bosses' },
  },
  {
    id: 'crowfolk', name: 'Crowfolk', icon: 'C', color: '#222244',
    category: 'beastfolk',
    description: 'Dark-feathered trickster. Collects shiny things.',
    statMods: { speed: 2, attack: 1, defense: -1 },
    passive: { name: 'Hoarder', description: 'Find 1 extra item per floor', effectKey: 'extra_item_1' },
    thumbnailFile: 'crowfolk.png',
    unlock: { type: 'gold_earned', value: 1000, label: 'Earn 1,000 gold total' },
  },

  // ══════════════════════════════════════
  // UNDEAD
  // ══════════════════════════════════════
  {
    id: 'skeleton', name: 'Skeleton', icon: 's', color: '#ddddaa',
    category: 'undead',
    description: 'Nothing but bones. Light, fast, immune to poison.',
    statMods: { speed: 2, hp: -4, defense: 1 },
    passive: { name: 'Boneless', description: 'Immune to poison and disease effects', effectKey: 'poison_immune' },
    thumbnailFile: 'skeleton.png',
    unlock: { type: 'deaths', value: 5, label: 'Die 5 times' },
  },
  {
    id: 'ghoul', name: 'Ghoul', icon: 'G', color: '#669966',
    category: 'undead',
    description: 'Hungers for flesh. Heals by devouring the dead.',
    statMods: { attack: 2, hp: -2 },
    passive: { name: 'Devour', description: 'Heal 4 HP on kill', effectKey: 'heal_on_kill_4' },
    thumbnailFile: 'ghoul.png',
    unlock: { type: 'kills', value: 200, label: 'Kill 200 enemies' },
  },
  {
    id: 'wraith', name: 'Wraith', icon: 'W', color: '#8888cc',
    category: 'undead',
    description: 'Ethereal and terrifying. Partially phases through attacks.',
    statMods: { speed: 3, hp: -4, attack: 1 },
    passive: { name: 'Phasing', description: '15% chance to phase through attacks (negate damage)', effectKey: 'phase_15' },
    thumbnailFile: 'wraith.png',
    unlock: { type: 'deaths', value: 10, label: 'Die 10 times' },
  },
  {
    id: 'lich', name: 'Lich', icon: 'L', color: '#cc88ff',
    category: 'undead',
    description: 'Ancient undead sorcerer. Power at the cost of fragility.',
    statMods: { attack: 4, hp: -6, defense: -1 },
    passive: { name: 'Phylactery', description: 'Survive a killing blow once per run with 1 HP', effectKey: 'death_save_once' },
    thumbnailFile: 'lich.png',
    unlock: { type: 'class_run', value: 1, qualifier: 'necromancer', label: 'Complete a run as Necromancer' },
  },
  {
    id: 'zombie', name: 'Zombie', icon: 'Z', color: '#668844',
    category: 'undead',
    description: 'Slow but relentless. Refuses to stay dead.',
    statMods: { hp: 6, defense: 1, speed: -3, attack: -1 },
    passive: { name: 'Undying', description: '25% chance to survive a killing blow with 1 HP (once per floor)', effectKey: 'undying_25' },
    thumbnailFile: 'zombie.png',
    unlock: { type: 'deaths', value: 3, label: 'Die 3 times' },
  },

  // ══════════════════════════════════════
  // DEMONIC
  // ══════════════════════════════════════
  {
    id: 'imp', name: 'Imp', icon: 'i', color: '#ff6644',
    category: 'demonic',
    description: 'Tiny demon. Chaotic and unpredictable.',
    statMods: { speed: 3, attack: 1, hp: -3 },
    passive: { name: 'Chaos Spark', description: '10% chance to deal double damage on any hit', effectKey: 'crit_10' },
    thumbnailFile: 'imp.png',
    unlock: { type: 'floor', value: 6, label: 'Reach floor 6' },
  },
  {
    id: 'tiefling', name: 'Tiefling', icon: 'T', color: '#cc4466',
    category: 'demonic',
    description: 'Half-demon heritage. Resistant to fire and darkness.',
    statMods: { attack: 1, speed: 1, hp: 1 },
    passive: { name: 'Infernal Heritage', description: 'Take 50% less fire damage', effectKey: 'fire_resist_50' },
    thumbnailFile: 'tiefling.png',
    unlock: { type: 'zone_clear', value: 1, qualifier: 'infernal_pit', label: 'Clear the Infernal Pit' },
  },
  {
    id: 'succubus', name: 'Succubus', icon: 'S', color: '#ff66aa',
    category: 'demonic',
    description: 'Seductive demon. Drains life from enemies.',
    statMods: { attack: 2, speed: 1, hp: -2 },
    passive: { name: 'Life Drain', description: 'Heal 2 HP on kill', effectKey: 'heal_on_kill_2' },
    thumbnailFile: 'succubus.png',
    unlock: { type: 'boss_kills', value: 5, label: 'Kill 5 bosses' },
  },
  {
    id: 'pit_fiend', name: 'Pit Fiend', icon: 'P', color: '#aa2200',
    category: 'demonic',
    description: 'Towering demon lord. Raw destructive power.',
    statMods: { attack: 3, hp: 3, speed: -3, defense: 1 },
    passive: { name: 'Hellfire Aura', description: 'Deal 1 damage to all adjacent enemies each turn', effectKey: 'aura_dmg_1' },
    thumbnailFile: 'pit_fiend.png',
    unlock: { type: 'class_run', value: 1, qualifier: 'hellborn', label: 'Complete a run as Hellborn' },
  },
  {
    id: 'shadow_demon', name: 'Shadow Demon', icon: 'D', color: '#443366',
    category: 'demonic',
    description: 'Born from darkness. Nearly invisible in shadows.',
    statMods: { speed: 3, attack: 2, hp: -4 },
    passive: { name: 'Shadow Meld', description: '+3 attack on first hit against unaware enemies', effectKey: 'ambush_3' },
    thumbnailFile: 'shadow_demon.png',
    unlock: { type: 'kills', value: 500, label: 'Kill 500 enemies' },
  },

  // ══════════════════════════════════════
  // ELEMENTAL
  // ══════════════════════════════════════
  {
    id: 'flameling', name: 'Flameling', icon: 'F', color: '#ff8822',
    category: 'elemental',
    description: 'Living fire. Burns everything it touches.',
    statMods: { attack: 3, hp: -3 },
    passive: { name: 'Burning Touch', description: '20% chance to ignite enemies for 3 damage over 3 turns', effectKey: 'ignite_20' },
    thumbnailFile: 'flameling.png',
    unlock: { type: 'floor', value: 4, label: 'Reach floor 4' },
  },
  {
    id: 'frostborn', name: 'Frostborn', icon: 'F', color: '#66ccff',
    category: 'elemental',
    description: 'Encased in ice. Slows everything nearby.',
    statMods: { defense: 2, hp: 2, speed: -2 },
    passive: { name: 'Frost Aura', description: 'Adjacent enemies have -2 speed', effectKey: 'slow_aura_2' },
    thumbnailFile: 'frostborn.png',
    unlock: { type: 'zone_clear', value: 1, qualifier: 'frozen_caverns', label: 'Clear the Frozen Caverns' },
  },
  {
    id: 'stoneheart', name: 'Stoneheart', icon: 'S', color: '#888866',
    category: 'elemental',
    description: 'Living rock. Nearly indestructible but glacially slow.',
    statMods: { defense: 3, hp: 4, speed: -4, attack: -1 },
    passive: { name: 'Earthen Shield', description: 'Negate the first hit on each floor completely', effectKey: 'first_hit_shield' },
    thumbnailFile: 'stoneheart.png',
    unlock: { type: 'class_run', value: 1, qualifier: 'warrior', label: 'Complete a run as Warrior' },
  },
  {
    id: 'stormkin', name: 'Stormkin', icon: 'Z', color: '#88aaff',
    category: 'elemental',
    description: 'Crackling with lightning. Blindingly fast.',
    statMods: { speed: 4, attack: 1, hp: -3, defense: -1 },
    passive: { name: 'Chain Lightning', description: '15% chance for attacks to arc to a second enemy for half damage', effectKey: 'chain_15' },
    thumbnailFile: 'stormkin.png',
    unlock: { type: 'class_run', value: 1, qualifier: 'mage', label: 'Complete a run as Mage' },
  },
  {
    id: 'voidtouched', name: 'Voidtouched', icon: 'V', color: '#6622aa',
    category: 'elemental',
    description: 'Touched by the void. Reality bends around them.',
    statMods: { attack: 2, speed: 1, hp: -2, defense: -1 },
    passive: { name: 'Void Rift', description: '10% chance on kill to teleport to a random empty tile', effectKey: 'teleport_on_kill_10' },
    thumbnailFile: 'voidtouched.png',
    unlock: { type: 'floor', value: 8, label: 'Reach floor 8' },
  },

  // ══════════════════════════════════════
  // ABERRATION
  // ══════════════════════════════════════
  {
    id: 'myconid', name: 'Myconid', icon: 'M', color: '#88aa44',
    category: 'aberration',
    description: 'Sentient mushroom. Spreads spores and heals naturally.',
    statMods: { hp: 3, defense: 1, speed: -2 },
    passive: { name: 'Spore Cloud', description: 'Heal 1 HP every 6 turns passively', effectKey: 'regen_6' },
    thumbnailFile: 'myconid.png',
    unlock: { type: 'zone_clear', value: 1, qualifier: 'fungal_marsh', label: 'Clear the Fungal Marsh' },
  },
  {
    id: 'slimefolk', name: 'Slimefolk', icon: 'S', color: '#44cc88',
    category: 'aberration',
    description: 'Amorphous blob. Absorbs damage but hits weakly.',
    statMods: { hp: 5, defense: 2, attack: -2, speed: -1 },
    passive: { name: 'Amorphous', description: 'Take 50% less damage from critical hits', effectKey: 'crit_resist_50' },
    thumbnailFile: 'slimefolk.png',
    unlock: { type: 'deaths', value: 8, label: 'Die 8 times' },
  },
  {
    id: 'eyeling', name: 'Eyeling', icon: 'e', color: '#ff88cc',
    category: 'aberration',
    description: 'Floating mass of eyes. Sees everything, hit by nothing.',
    statMods: { speed: 3, hp: -4 },
    passive: { name: 'All-Seeing', description: '+3 vision range, enemies cannot ambush you', effectKey: 'vision_bonus_3' },
    thumbnailFile: 'eyeling.png',
    unlock: { type: 'bestiary', value: 25, label: 'Discover 25 bestiary entries' },
  },
  {
    id: 'tentacled_one', name: 'Tentacled One', icon: 'T', color: '#448866',
    category: 'aberration',
    description: 'Writhing mass of tentacles. Grapples and crushes.',
    statMods: { attack: 2, defense: 1, speed: -1 },
    passive: { name: 'Grasping Tendrils', description: '20% chance to stun enemy for 1 turn on hit', effectKey: 'stun_on_hit_20' },
    thumbnailFile: 'tentacled_one.png',
    unlock: { type: 'boss_kills', value: 8, label: 'Kill 8 bosses' },
  },
  {
    id: 'parasite_host', name: 'Parasite Host', icon: 'P', color: '#66aa22',
    category: 'aberration',
    description: 'Body infested with symbiotic parasites. They fight for you.',
    statMods: { hp: 2, attack: 1, defense: -1 },
    passive: { name: 'Symbiosis', description: 'On taking damage, 20% chance to spawn a temporary ally', effectKey: 'spawn_on_hit_20' },
    thumbnailFile: 'parasite_host.png',
    unlock: { type: 'class_run', value: 1, qualifier: 'impregnar', label: 'Complete a run as Impregnar' },
  },
];

export function getRaceDef(id: string): RaceDef | undefined {
  return RACE_DEFS.find(r => r.id === id);
}

export function getRandomRace(bl?: BloodlineData): RaceDef {
  const pool = bl ? RACE_DEFS.filter(r => isRaceUnlocked(r, bl)) : RACE_DEFS;
  if (pool.length === 0) return RACE_DEFS[0]!;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

export function getRacesByCategory(category: RaceCategory): RaceDef[] {
  return RACE_DEFS.filter(r => r.category === category);
}

/** Check if a race's unlock requirement is met given current bloodline data. */
export function isRaceUnlocked(race: RaceDef, bl: BloodlineData): boolean {
  const req = race.unlock;
  switch (req.type) {
    case 'free':
      return true;
    case 'floor':
      return bl.cumulative.highestFloor >= req.value;
    case 'kills':
      return bl.cumulative.totalKills >= req.value;
    case 'deaths':
      return bl.cumulative.totalDeaths >= req.value;
    case 'boss_kills':
      return bl.bossKillLog.length >= req.value;
    case 'class_run':
      return req.qualifier
        ? (bl.cumulative.classDeaths[req.qualifier as keyof typeof bl.cumulative.classDeaths] ?? 0) >= req.value
        : false;
    case 'race_run':
      return (bl.unlockedRaces ?? []).includes(req.qualifier ?? '');
    case 'zone_clear':
      return req.qualifier
        ? bl.runHistory?.some(r => r.zone === req.qualifier && r.bossesKilled > 0) ?? false
        : false;
    case 'bestiary':
      return Object.keys(bl.bestiary ?? {}).length >= req.value;
    case 'gold_earned':
      return bl.cumulative.totalGoldEarned >= req.value;
    case 'traits_unlocked':
      return bl.unlockedTraits.length >= req.value;
    default:
      return false;
  }
}

/** Get number of unlocked races for a given bloodline. */
export function getUnlockedRaceCount(bl: BloodlineData): number {
  return RACE_DEFS.filter(r => isRaceUnlocked(r, bl)).length;
}

/** Check which races were newly unlocked after a run and return their defs. */
export function checkNewlyUnlockedRaces(bl: BloodlineData, previouslyUnlocked: string[]): RaceDef[] {
  return RACE_DEFS.filter(r =>
    !previouslyUnlocked.includes(r.id) && isRaceUnlocked(r, bl)
  );
}
