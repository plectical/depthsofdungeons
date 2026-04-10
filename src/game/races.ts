/**
 * Race System — 32 playable races across 6 categories.
 * Each race provides small stat tweaks and a racial passive.
 */

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
  },
  {
    id: 'dwarf', name: 'Dwarf', icon: 'D', color: '#cc8844',
    category: 'humanoid',
    description: 'Short, sturdy, and impossibly tough. Born underground.',
    statMods: { hp: 4, defense: 1, speed: -1 },
    passive: { name: 'Stone Resilience', description: 'Take 1 less damage from all sources', effectKey: 'flat_dr_1' },
    thumbnailFile: 'dwarf.png',
  },
  {
    id: 'elf', name: 'Elf', icon: 'E', color: '#88ccff',
    category: 'humanoid',
    description: 'Graceful and perceptive. Quick but fragile.',
    statMods: { speed: 3, attack: 1, hp: -3 },
    passive: { name: 'Keen Senses', description: '+2 vision range in darkness', effectKey: 'vision_bonus_2' },
    thumbnailFile: 'elf.png',
  },
  {
    id: 'halfling', name: 'Halfling', icon: 'h', color: '#ffaa66',
    category: 'humanoid',
    description: 'Tiny and lucky. Enemies have trouble hitting them.',
    statMods: { speed: 2, hp: -2 },
    passive: { name: 'Lucky', description: '10% chance to completely dodge any attack', effectKey: 'dodge_10' },
    thumbnailFile: 'halfling.png',
  },
  {
    id: 'orc', name: 'Orc', icon: 'O', color: '#66aa44',
    category: 'humanoid',
    description: 'Massive and brutal. Hits hard, bleeds harder.',
    statMods: { attack: 3, hp: 2, defense: -1 },
    passive: { name: 'Blood Rage', description: '+2 attack when below 50% HP', effectKey: 'blood_rage' },
    thumbnailFile: 'orc.png',
  },
  {
    id: 'goblin', name: 'Goblin', icon: 'g', color: '#88cc22',
    category: 'humanoid',
    description: 'Sneaky, greedy, and surprisingly resourceful.',
    statMods: { speed: 2, hp: -3, attack: 1 },
    passive: { name: 'Scavenger', description: 'Enemies drop 25% more gold', effectKey: 'gold_boost_25' },
    thumbnailFile: 'goblin.png',
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
  },
  {
    id: 'lizardfolk', name: 'Lizardfolk', icon: 'L', color: '#44aa66',
    category: 'beastfolk',
    description: 'Cold-blooded and armored with thick scales.',
    statMods: { defense: 2, hp: 2, speed: -1 },
    passive: { name: 'Regeneration', description: 'Heal 1 HP every 8 turns', effectKey: 'regen_8' },
    thumbnailFile: 'lizardfolk.png',
  },
  {
    id: 'wolfkin', name: 'Wolfkin', icon: 'W', color: '#8899aa',
    category: 'beastfolk',
    description: 'Fierce pack hunter with razor instincts.',
    statMods: { attack: 2, speed: 2, hp: -2 },
    passive: { name: 'Pack Hunter', description: '+3 damage when mercenary allies are nearby', effectKey: 'pack_bonus_3' },
    thumbnailFile: 'wolfkin.png',
  },
  {
    id: 'spiderkin', name: 'Spiderkin', icon: 'S', color: '#774488',
    category: 'beastfolk',
    description: 'Eight-limbed horror. Weaves webs of death.',
    statMods: { speed: 2, attack: 1, hp: -2 },
    passive: { name: 'Web Walker', description: '15% chance to slow enemies on hit for 2 turns', effectKey: 'slow_on_hit_15' },
    thumbnailFile: 'spiderkin.png',
  },
  {
    id: 'bearkin', name: 'Bearkin', icon: 'B', color: '#886644',
    category: 'beastfolk',
    description: 'Enormous and powerful. Absorbs punishment like a mountain.',
    statMods: { hp: 6, defense: 1, speed: -3 },
    passive: { name: 'Thick Hide', description: '20% chance to halve incoming damage', effectKey: 'halve_dmg_20' },
    thumbnailFile: 'bearkin.png',
  },
  {
    id: 'crowfolk', name: 'Crowfolk', icon: 'C', color: '#222244',
    category: 'beastfolk',
    description: 'Dark-feathered trickster. Collects shiny things.',
    statMods: { speed: 2, attack: 1, defense: -1 },
    passive: { name: 'Hoarder', description: 'Find 1 extra item per floor', effectKey: 'extra_item_1' },
    thumbnailFile: 'crowfolk.png',
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
  },
  {
    id: 'ghoul', name: 'Ghoul', icon: 'G', color: '#669966',
    category: 'undead',
    description: 'Hungers for flesh. Heals by devouring the dead.',
    statMods: { attack: 2, hp: -2 },
    passive: { name: 'Devour', description: 'Heal 4 HP on kill', effectKey: 'heal_on_kill_4' },
    thumbnailFile: 'ghoul.png',
  },
  {
    id: 'wraith', name: 'Wraith', icon: 'W', color: '#8888cc',
    category: 'undead',
    description: 'Ethereal and terrifying. Partially phases through attacks.',
    statMods: { speed: 3, hp: -4, attack: 1 },
    passive: { name: 'Phasing', description: '15% chance to phase through attacks (negate damage)', effectKey: 'phase_15' },
    thumbnailFile: 'wraith.png',
  },
  {
    id: 'lich', name: 'Lich', icon: 'L', color: '#cc88ff',
    category: 'undead',
    description: 'Ancient undead sorcerer. Power at the cost of fragility.',
    statMods: { attack: 4, hp: -6, defense: -1 },
    passive: { name: 'Phylactery', description: 'Survive a killing blow once per run with 1 HP', effectKey: 'death_save_once' },
    thumbnailFile: 'lich.png',
  },
  {
    id: 'zombie', name: 'Zombie', icon: 'Z', color: '#668844',
    category: 'undead',
    description: 'Slow but relentless. Refuses to stay dead.',
    statMods: { hp: 6, defense: 1, speed: -3, attack: -1 },
    passive: { name: 'Undying', description: '25% chance to survive a killing blow with 1 HP (once per floor)', effectKey: 'undying_25' },
    thumbnailFile: 'zombie.png',
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
  },
  {
    id: 'tiefling', name: 'Tiefling', icon: 'T', color: '#cc4466',
    category: 'demonic',
    description: 'Half-demon heritage. Resistant to fire and darkness.',
    statMods: { attack: 1, speed: 1, hp: 1 },
    passive: { name: 'Infernal Heritage', description: 'Take 50% less fire damage', effectKey: 'fire_resist_50' },
    thumbnailFile: 'tiefling.png',
  },
  {
    id: 'succubus', name: 'Succubus', icon: 'S', color: '#ff66aa',
    category: 'demonic',
    description: 'Seductive demon. Drains life from enemies.',
    statMods: { attack: 2, speed: 1, hp: -2 },
    passive: { name: 'Life Drain', description: 'Heal 2 HP on kill', effectKey: 'heal_on_kill_2' },
    thumbnailFile: 'succubus.png',
  },
  {
    id: 'pit_fiend', name: 'Pit Fiend', icon: 'P', color: '#aa2200',
    category: 'demonic',
    description: 'Towering demon lord. Raw destructive power.',
    statMods: { attack: 3, hp: 3, speed: -3, defense: 1 },
    passive: { name: 'Hellfire Aura', description: 'Deal 1 damage to all adjacent enemies each turn', effectKey: 'aura_dmg_1' },
    thumbnailFile: 'pit_fiend.png',
  },
  {
    id: 'shadow_demon', name: 'Shadow Demon', icon: 'D', color: '#443366',
    category: 'demonic',
    description: 'Born from darkness. Nearly invisible in shadows.',
    statMods: { speed: 3, attack: 2, hp: -4 },
    passive: { name: 'Shadow Meld', description: '+3 attack on first hit against unaware enemies', effectKey: 'ambush_3' },
    thumbnailFile: 'shadow_demon.png',
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
  },
  {
    id: 'frostborn', name: 'Frostborn', icon: 'F', color: '#66ccff',
    category: 'elemental',
    description: 'Encased in ice. Slows everything nearby.',
    statMods: { defense: 2, hp: 2, speed: -2 },
    passive: { name: 'Frost Aura', description: 'Adjacent enemies have -2 speed', effectKey: 'slow_aura_2' },
    thumbnailFile: 'frostborn.png',
  },
  {
    id: 'stoneheart', name: 'Stoneheart', icon: 'S', color: '#888866',
    category: 'elemental',
    description: 'Living rock. Nearly indestructible but glacially slow.',
    statMods: { defense: 3, hp: 4, speed: -4, attack: -1 },
    passive: { name: 'Earthen Shield', description: 'Negate the first hit on each floor completely', effectKey: 'first_hit_shield' },
    thumbnailFile: 'stoneheart.png',
  },
  {
    id: 'stormkin', name: 'Stormkin', icon: 'Z', color: '#88aaff',
    category: 'elemental',
    description: 'Crackling with lightning. Blindingly fast.',
    statMods: { speed: 4, attack: 1, hp: -3, defense: -1 },
    passive: { name: 'Chain Lightning', description: '15% chance for attacks to arc to a second enemy for half damage', effectKey: 'chain_15' },
    thumbnailFile: 'stormkin.png',
  },
  {
    id: 'voidtouched', name: 'Voidtouched', icon: 'V', color: '#6622aa',
    category: 'elemental',
    description: 'Touched by the void. Reality bends around them.',
    statMods: { attack: 2, speed: 1, hp: -2, defense: -1 },
    passive: { name: 'Void Rift', description: '10% chance on kill to teleport to a random empty tile', effectKey: 'teleport_on_kill_10' },
    thumbnailFile: 'voidtouched.png',
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
  },
  {
    id: 'slimefolk', name: 'Slimefolk', icon: 'S', color: '#44cc88',
    category: 'aberration',
    description: 'Amorphous blob. Absorbs damage but hits weakly.',
    statMods: { hp: 5, defense: 2, attack: -2, speed: -1 },
    passive: { name: 'Amorphous', description: 'Take 50% less damage from critical hits', effectKey: 'crit_resist_50' },
    thumbnailFile: 'slimefolk.png',
  },
  {
    id: 'eyeling', name: 'Eyeling', icon: 'e', color: '#ff88cc',
    category: 'aberration',
    description: 'Floating mass of eyes. Sees everything, hit by nothing.',
    statMods: { speed: 3, hp: -4 },
    passive: { name: 'All-Seeing', description: '+3 vision range, enemies cannot ambush you', effectKey: 'vision_bonus_3' },
    thumbnailFile: 'eyeling.png',
  },
  {
    id: 'tentacled_one', name: 'Tentacled One', icon: 'T', color: '#448866',
    category: 'aberration',
    description: 'Writhing mass of tentacles. Grapples and crushes.',
    statMods: { attack: 2, defense: 1, speed: -1 },
    passive: { name: 'Grasping Tendrils', description: '20% chance to stun enemy for 1 turn on hit', effectKey: 'stun_on_hit_20' },
    thumbnailFile: 'tentacled_one.png',
  },
  {
    id: 'parasite_host', name: 'Parasite Host', icon: 'P', color: '#66aa22',
    category: 'aberration',
    description: 'Body infested with symbiotic parasites. They fight for you.',
    statMods: { hp: 2, attack: 1, defense: -1 },
    passive: { name: 'Symbiosis', description: 'On taking damage, 20% chance to spawn a temporary ally', effectKey: 'spawn_on_hit_20' },
    thumbnailFile: 'parasite_host.png',
  },
];

export function getRaceDef(id: string): RaceDef | undefined {
  return RACE_DEFS.find(r => r.id === id);
}

export function getRandomRace(): RaceDef {
  return RACE_DEFS[Math.floor(Math.random() * RACE_DEFS.length)]!;
}

export function getRacesByCategory(category: RaceCategory): RaceDef[] {
  return RACE_DEFS.filter(r => r.category === category);
}
