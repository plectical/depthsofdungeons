import type { Entity, Item, MapItem, MonsterDef, Pos, DungeonFloor, ClassDef, Shop, ShopItem, MapMercenary, ZoneId, ItemRarity, MercenaryDef } from './types';
import type { GeneratedClass, GeneratedEnemyDef } from './generativeClass';
import { getContentCache } from './story/progressiveLoader';
import { getMercenariesForFloor } from './story/contentCache';
import { getFactionForCreature } from './factions';
import {
  MONSTER_DEFS,
  WEAPON_TEMPLATES,
  ARMOR_TEMPLATES,
  RING_TEMPLATES,
  AMULET_TEMPLATES,
  SHIELD_TEMPLATES,
  OFFHAND_DAGGER_TEMPLATES,
  FOCUS_TEMPLATES,
  QUIVER_TEMPLATES,
  POTION_TEMPLATES,
  SCROLL_TEMPLATES,
  FOOD_TEMPLATES,
  PLAYER_BASE_STATS,
  BOSS_DEFS,
  BOSS_LOOT_TEMPLATES,
  ANCESTORS_FANG,
  MERCENARY_DEFS,
  RARITY_DEFS,
  RARITY_ORDER,
  RANGER_WEAPON_TEMPLATES,
} from './constants';
import { uid, randInt, pick } from './utils';
import { pickVariant } from './variants';
import { isWalkableTile, getTile } from './dungeon';
import {
  getNecropolisMonsters,
  getNecropolisWeapons,
  getNecropolisArmor,
  getNecropolisItems,
  getUnlockedBountyItems,
} from './necropolis';
import { getNecropolisState } from './necropolisService';
import { ZONE_MONSTERS, ZONE_BOSSES, ZONE_WEAPONS, ZONE_ARMOR, ZONE_POTIONS, ZONE_FOOD, ZONE_BOSS_LOOT, ZONE_RINGS, ZONE_AMULETS, ZONE_OFFHANDS, ZONE_SCROLLS } from './zones';
import { getEchoWeapons, getEchoEnemies, ECHO_BOSS_LOOT } from './echoTree';

// ── Echo Tree integration — module-level cache of unlocked nodes ──
let _echoUnlockedNodes: string[] = [];
export function setEchoUnlockedNodes(nodes: string[]): void { _echoUnlockedNodes = nodes; }

export function createPlayer(pos: Pos, classDef?: ClassDef): Entity {
  const stats = classDef ? { ...classDef.baseStats } : { ...PLAYER_BASE_STATS };
  return {
    id: uid(),
    pos: { ...pos },
    name: 'You',
    char: '@',
    color: classDef?.color ?? '#ffffff',
    stats,
    xp: 0,
    level: 1,
    inventory: [],
    equipment: {},
    isPlayer: true,
    isDead: false,
  };
}

function randomWalkable(floor: DungeonFloor, occupied: Set<string>): Pos | null {
  for (let attempt = 0; attempt < 100; attempt++) {
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

/**
 * Return a random walkable position inside a specific room.
 * The position must not already be in the occupied set.
 */
function randomWalkableInRoom(
  floor: DungeonFloor,
  room: { x: number; y: number; w: number; h: number },
  occupied: Set<string>,
): Pos | null {
  for (let attempt = 0; attempt < 80; attempt++) {
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

/** Get all available monster definitions (base + necropolis + zone + echo). */
function getAllMonsterDefs(zone: ZoneId = 'stone_depths'): MonsterDef[] {
  const necroDeaths = getNecropolisState().communalDeaths;
  const echoEnemies = getEchoEnemies(_echoUnlockedNodes).filter(e => !e.isBoss);
  const zoneMonsters = ZONE_MONSTERS[zone] ?? [];
  if (zone === 'stone_depths') {
    return [...MONSTER_DEFS, ...getNecropolisMonsters(necroDeaths), ...echoEnemies];
  }
  // Non-stone_depths zones use their own monsters
  return zoneMonsters.length > 0 ? [...zoneMonsters, ...echoEnemies] : [...MONSTER_DEFS, ...getNecropolisMonsters(necroDeaths), ...echoEnemies];
}

/** Get all available weapon templates (base + necropolis + zone + bounty rewards + ranger-exclusive + echo). */
function getAllWeapons(zone: ZoneId = 'stone_depths'): Omit<Item, 'id'>[] {
  const necroState = getNecropolisState();
  const necroDeaths = necroState.communalDeaths;
  const bountyWeapons = getUnlockedBountyItems(necroState.communalKills).filter(i => i.type === 'weapon');
  const echoWeapons = getEchoWeapons(_echoUnlockedNodes);
  const zoneWeapons = ZONE_WEAPONS[zone] ?? [];
  if (zone === 'stone_depths') {
    return [...WEAPON_TEMPLATES, ...RANGER_WEAPON_TEMPLATES, ...getNecropolisWeapons(necroDeaths), ...bountyWeapons, ...echoWeapons];
  }
  return [...zoneWeapons, ...WEAPON_TEMPLATES, ...RANGER_WEAPON_TEMPLATES, ...getNecropolisWeapons(necroDeaths), ...bountyWeapons, ...echoWeapons];
}

/** Get all available armor templates (base + necropolis + zone + bounty rewards). */
function getAllArmor(zone: ZoneId = 'stone_depths'): Omit<Item, 'id'>[] {
  const necroState = getNecropolisState();
  const necroDeaths = necroState.communalDeaths;
  const bountyArmor = getUnlockedBountyItems(necroState.communalKills).filter(i => i.type === 'armor');
  const zoneArmor = ZONE_ARMOR[zone] ?? [];
  if (zone === 'stone_depths') {
    return [...ARMOR_TEMPLATES, ...getNecropolisArmor(necroDeaths), ...bountyArmor];
  }
  return [...zoneArmor, ...ARMOR_TEMPLATES, ...getNecropolisArmor(necroDeaths), ...bountyArmor];
}

/** Get all necropolis + bounty items available as loot. */
function getExtraItems(): Omit<Item, 'id'>[] {
  const necroState = getNecropolisState();
  const necroDeaths = necroState.communalDeaths;
  const bountyAccessories = getUnlockedBountyItems(necroState.communalKills).filter(i => i.type === 'ring' || i.type === 'amulet');
  return [...getNecropolisItems(necroDeaths), ...bountyAccessories];
}

/** Get zone-specific potions. */
function getZonePotions(zone: ZoneId): Omit<Item, 'id'>[] {
  return ZONE_POTIONS[zone] ?? [];
}

/** Get zone-specific food. */
function getZoneFood(zone: ZoneId): Omit<Item, 'id'>[] {
  return ZONE_FOOD[zone] ?? [];
}

/**
 * Roll a rarity tier for an item based on current floor.
 * Deeper floors shift the distribution toward rarer drops.
 */
function rollRarity(floorNumber: number): ItemRarity {
  // Build weighted pool — only include rarities whose minFloor is met
  const eligible = RARITY_ORDER.filter(r => RARITY_DEFS[r].minFloor <= floorNumber);
  // Deeper floors give a stronger luck bonus — by floor 8+ most drops are uncommon+
  const luckBonus = Math.min(floorNumber * 0.8, 10);
  let totalWeight = 0;
  const weights: number[] = [];
  for (const r of eligible) {
    const def = RARITY_DEFS[r];
    // Increase rare weights slightly based on floor depth
    const adjustedWeight = r === 'common' ? Math.max(def.dropWeight - luckBonus * 3, 15) : def.dropWeight + (luckBonus * (RARITY_ORDER.indexOf(r) * 0.3));
    weights.push(adjustedWeight);
    totalWeight += adjustedWeight;
  }
  let roll = Math.random() * totalWeight;
  for (let i = 0; i < eligible.length; i++) {
    roll -= weights[i]!;
    if (roll <= 0) return eligible[i]!;
  }
  return 'common';
}

/**
 * Apply rarity to an item — scales stat bonuses and overrides the display color.
 * Gold, food, potions, and scrolls stay common (no rarity visual).
 */
function applyRarity(item: Item, floorNumber: number): Item {
  // Only equipment items (weapon, armor, ring, amulet, offhand) get rarity
  const rarityTypes = new Set(['weapon', 'armor', 'ring', 'amulet', 'offhand']);
  if (!rarityTypes.has(item.type)) {
    item.rarity = 'common';
    return item;
  }

  const rarity = rollRarity(floorNumber);
  item.rarity = rarity;

  if (rarity === 'common') return item;

  const def = RARITY_DEFS[rarity];

  // Scale stat bonuses
  if (item.statBonus) {
    const scaled = { ...item.statBonus };
    for (const key of Object.keys(scaled) as (keyof typeof scaled)[]) {
      if (scaled[key] !== undefined) {
        scaled[key] = Math.round(scaled[key]! * def.statScale);
      }
    }
    item.statBonus = scaled;
  }

  // Override item color to rarity color so it's immediately visible
  item.color = def.color;

  // Prefix the item name with rarity for non-common
  const prefixes: Record<ItemRarity, string> = {
    common: '',
    uncommon: 'Fine',
    rare: 'Superior',
    epic: 'Exquisite',
    legendary: 'Legendary',
    mythic: 'Mythic',
  };
  if (prefixes[rarity]) {
    item.name = `${prefixes[rarity]} ${item.name}`;
  }

  // Scale item value
  item.value = Math.round(item.value * def.statScale);

  return item;
}

function getGeneratedClassEnemyDefs(): MonsterDef[] {
  try {
    const json = localStorage.getItem('dod_backup_activeGeneratedClass');
    if (!json) return [];
    const gen: GeneratedClass = JSON.parse(json);
    if (!gen?.enemies?.length) return [];
    return gen.enemies.map((e: GeneratedEnemyDef): MonsterDef => ({
      name: e.name,
      char: e.char,
      color: e.color,
      stats: { ...e.baseStats },
      xpValue: e.xpValue,
      minFloor: e.minFloor,
      lootChance: 0.2,
    }));
  } catch { return []; }
}

export function spawnMonsters(floor: DungeonFloor, floorNumber: number, occupied: Set<string>, zone: ZoneId = 'stone_depths', playerClass?: string): Entity[] {
  const allDefs = getAllMonsterDefs(zone);
  const genEnemies = (playerClass === 'generated') ? getGeneratedClassEnemyDefs() : [];
  const combined = [...allDefs, ...genEnemies];
  const eligible = combined.filter((m) => m.minFloor <= floorNumber);
  if (eligible.length === 0) return [];

  // Monster density: gentler on early floors, ramps up later
  const minCount = floorNumber <= 1 ? 4 : floorNumber <= 2 ? 5 : floorNumber <= 3 ? 6 : floorNumber >= 8 ? 12 : 8;
  const lateFloorExtra = floorNumber > 4 ? Math.floor((floorNumber - 4) * 1.5) : 0;
  const count = randInt(minCount, 5 + Math.floor(floorNumber * 1.8) + lateFloorExtra);
  const monsters: Entity[] = [];

  for (let i = 0; i < count; i++) {
    const def: MonsterDef = pick(eligible);
    const pos = randomWalkable(floor, occupied);
    if (!pos) break;

    // Steady scaling — gentle early, ramps harder from floor 4+
    const floorsAboveMin = Math.max(0, floorNumber - def.minFloor);
    const earlyPush = 0; // removed: base stats already define the difficulty curve
    const midPush = floorNumber >= 4 ? 0.15 : 0;   // slight boost at floor 4+
    const lateGameBonus = floorNumber >= 6 ? (floorNumber - 5) * 0.25 : 0; // ramps from floor 6
    const scale = 1 + earlyPush + midPush + floorsAboveMin * 0.2 + lateGameBonus;

    // Try to apply a color variant
    const variant = pickVariant(def.name, def.color, def.isBoss);

    // Stat multipliers from variant (slight tweaks)
    const vm = variant?.statMod ?? {};
    const hpMod = vm.hp ?? 1;
    const atkMod = vm.attack ?? 1;
    const defMod = vm.defense ?? 1;
    const spdMod = vm.speed ?? 1;

    const entity: Entity = {
      id: uid(),
      pos,
      name: variant ? variant.variantName : def.name,
      char: def.char,
      color: variant ? variant.color : def.color,
      stats: {
        hp: Math.round(def.stats.hp * scale * hpMod),
        maxHp: Math.round(def.stats.maxHp * scale * hpMod),
        attack: Math.round(def.stats.attack * scale * atkMod),
        defense: Math.round(def.stats.defense * scale * defMod),
        speed: Math.round(def.stats.speed * spdMod),
      },
      xp: def.xpValue,
      level: floorNumber,
      inventory: [],
      equipment: {},
      isPlayer: false,
      isDead: false,
      baseName: def.name,
      variantName: variant ? variant.variantName : undefined,
    };
    if (def.terrainOnHit) entity.terrainOnHit = def.terrainOnHit;
    if (def.abilities) entity.abilities = def.abilities;
    if (def.element) entity.element = def.element;
    if (def.attackRange) entity.attackRange = def.attackRange;
    if (def.projectileChar) entity.projectileChar = def.projectileChar;
    if (def.projectileColor) entity.projectileColor = def.projectileColor;
    if (def.aggroRange) entity.aggroRange = def.aggroRange;
    
    // Assign faction based on creature name
    const factionId = getFactionForCreature(entity.name);
    if (factionId) entity.factionId = factionId;
    
    monsters.push(entity);
  }

  return monsters;
}

export function randomItem(floorNumber: number, zone: ZoneId = 'stone_depths'): Item {
  const roll = Math.random();
  let template: Omit<Item, 'id'> | undefined;

  const allWeapons = getAllWeapons(zone);
  const allArmor = getAllArmor(zone);
  const extraItems = getExtraItems();
  const zonePotions = getZonePotions(zone);
  const zoneFood = getZoneFood(zone);

  const zoneOffhands = ZONE_OFFHANDS[zone] ?? [];
  const allOffhands = [...SHIELD_TEMPLATES, ...OFFHAND_DAGGER_TEMPLATES, ...FOCUS_TEMPLATES, ...QUIVER_TEMPLATES, ...zoneOffhands];
  const zoneRings = ZONE_RINGS[zone] ?? [];
  const zoneAmulets = ZONE_AMULETS[zone] ?? [];
  const zoneScrolls = ZONE_SCROLLS[zone] ?? [];

  if (roll < 0.13) {
    const maxIdx = Math.min(allWeapons.length - 1, Math.floor(floorNumber / 2));
    template = allWeapons[randInt(0, maxIdx)];
  } else if (roll < 0.24) {
    const maxIdx = Math.min(allArmor.length - 1, Math.floor(floorNumber / 3));
    template = allArmor[randInt(0, maxIdx)];
  } else if (roll < 0.31) {
    const maxIdx = Math.min(allOffhands.length - 1, Math.floor(floorNumber / 2));
    template = allOffhands[randInt(0, maxIdx)];
  } else if (roll < 0.37) {
    const ringPool = [...RING_TEMPLATES, ...zoneRings];
    template = pick(ringPool);
  } else if (roll < 0.42) {
    const pool = [...AMULET_TEMPLATES, ...zoneAmulets, ...extraItems.filter((i) => i.type === 'amulet' || i.type === 'ring')];
    template = pick(pool.length > 0 ? pool : AMULET_TEMPLATES);
  } else if (roll < 0.52) {
    const pool = [...POTION_TEMPLATES, ...zonePotions, ...extraItems.filter((i) => i.type === 'potion')];
    template = pick(pool);
  } else if (roll < 0.62) {
    const scrollPool = [...SCROLL_TEMPLATES, ...zoneScrolls];
    template = pick(scrollPool);
  } else if (roll < 0.85) {
    const foodPool = [...FOOD_TEMPLATES, ...zoneFood];
    template = pick(foodPool);
  }

  if (!template) {
    template = {
      name: 'Gold',
      type: 'gold',
      char: '*',
      color: '#ffd700',
      value: randInt(5, 15 + floorNumber * 5),
      description: 'Shiny coins',
    };
  }

  const item: Item = { ...template, id: uid() };
  return applyRarity(item, floorNumber);
}

export function spawnItems(floor: DungeonFloor, floorNumber: number, occupied: Set<string>, zone: ZoneId = 'stone_depths'): MapItem[] {
  // Scarcer drops — fewer items but quality improves with depth
  const baseItems = floorNumber <= 2 ? 4 : 2;
  const count = randInt(baseItems, 4 + Math.floor(floorNumber * 0.3));
  const items: MapItem[] = [];

  // Guarantee 2 food items per floor so players don't starve from bad luck
  const zoneFood = ZONE_FOOD[zone] ?? [];
  const foodPool = [...FOOD_TEMPLATES, ...zoneFood];
  for (let f = 0; f < 2; f++) {
    const guaranteedFood = pick(foodPool);
    const foodPos = randomWalkable(floor, occupied);
    if (foodPos) {
      items.push({ id: uid(), pos: foodPos, item: { ...guaranteedFood, id: uid() } });
      occupied.add(`${foodPos.x},${foodPos.y}`);
    }
  }

  // Guarantee a health potion on the first 3 floors to help new players survive
  if (floorNumber <= 3) {
    const hpPotion = POTION_TEMPLATES.find(p => p.name === 'Health Potion')!;
    const potionPos = randomWalkable(floor, occupied);
    if (potionPos) {
      items.push({ id: uid(), pos: potionPos, item: { ...hpPotion, id: uid() } });
      occupied.add(`${potionPos.x},${potionPos.y}`);
    }
  }

  for (let i = 0; i < count; i++) {
    const pos = randomWalkable(floor, occupied);
    if (!pos) break;
    items.push({
      id: uid(),
      pos,
      item: randomItem(floorNumber, zone),
    });
  }

  return items;
}

/**
 * Attempt to spawn a boss in a boss arena room on this floor.
 *
 * Picks an eligible boss whose `minFloor` is <= floorNumber and whose name
 * is not in `defeatedBosses`. The boss is placed inside the room tagged
 * `isBossArena`. Returns `null` when no arena exists or no eligible boss
 * is available.
 */
function getGeneratedClassBoss(floorNumber: number): Entity | null {
  try {
    const json = localStorage.getItem('dod_backup_activeGeneratedClass');
    if (!json) return null;
    const gen: GeneratedClass = JSON.parse(json);
    if (!gen?.boss) return null;
    const b = gen.boss;
    const scale = 1 + Math.max(0, floorNumber - 5) * 0.1;
    return {
      id: uid(),
      pos: { x: 0, y: 0 },
      name: b.name,
      char: b.char ?? 'B',
      color: b.color ?? '#ff4444',
      stats: {
        hp: Math.round(b.stats.hp * scale),
        maxHp: Math.round(b.stats.maxHp * scale),
        attack: Math.round(b.stats.attack * scale),
        defense: Math.round(b.stats.defense * scale),
        speed: b.stats.speed,
      },
      xp: b.xpValue,
      level: floorNumber,
      inventory: [],
      equipment: {},
      isPlayer: false,
      isDead: false,
      isBoss: true,
      bossAbilityCooldown: 0,
      baseName: b.name,
    };
  } catch { return null; }
}

export function spawnBoss(
  floor: DungeonFloor,
  floorNumber: number,
  occupied: Set<string>,
  defeatedBosses: string[],
  zone: ZoneId = 'stone_depths',
  playerClass?: string,
): Entity | null {
  // Find the boss arena room
  const arena = floor.rooms.find((r) => r.isBossArena);
  if (!arena) return null;

  const defeated = new Set(defeatedBosses);

  // For generated classes, spawn their custom boss on floors 5+
  if (playerClass === 'generated' && floorNumber >= 5) {
    const genBoss = getGeneratedClassBoss(floorNumber);
    if (genBoss && !defeated.has(genBoss.name)) {
      const pos = randomWalkableInRoom(floor, arena, occupied);
      if (pos) {
        genBoss.pos = pos;
        const factionId = getFactionForCreature(genBoss.name);
        if (factionId) genBoss.factionId = factionId;
        return genBoss;
      }
    }
  }

  // Use zone-specific bosses, or base bosses for stone_depths
  const zoneBosses = ZONE_BOSSES[zone] ?? [];
  const bossDefs = zone === 'stone_depths' ? BOSS_DEFS : (zoneBosses.length > 0 ? zoneBosses : BOSS_DEFS);

  // Filter eligible bosses
  const eligible = bossDefs.filter(
    (b) => b.minFloor <= floorNumber && !defeated.has(b.name),
  );
  if (eligible.length === 0) return null;

  const def = pick(eligible);
  const pos = randomWalkableInRoom(floor, arena, occupied);
  if (!pos) return null;

  // Boss scaling — accelerates on deeper floors
  const bossFloorsAboveMin = Math.max(0, floorNumber - def.minFloor);
  const bossLateBonus = floorNumber > 8 ? (floorNumber - 8) * 0.1 : 0;
  const scale = 1 + bossFloorsAboveMin * 0.08 + bossLateBonus;

  const boss: Entity = {
    id: uid(),
    pos,
    name: def.name,
    char: def.char,
    color: def.color,
    stats: {
      hp: Math.round(def.stats.hp * scale),
      maxHp: Math.round(def.stats.maxHp * scale),
      attack: Math.round(def.stats.attack * scale),
      defense: Math.round(def.stats.defense * scale),
      speed: def.stats.speed,
    },
    xp: def.xpValue,
    level: floorNumber,
    inventory: [],
    equipment: {},
    isPlayer: false,
    isDead: false,
    isBoss: true,
    bossAbility: def.bossAbility,
    bossAbilityCooldown: 0,
  };
  
  // Assign faction based on boss name
  const factionId = getFactionForCreature(boss.name);
  if (factionId) boss.factionId = factionId;
  
  return boss;
}

/**
 * Spawn 0-1 mercenaries on the floor.
 *
 * Each eligible mercenary (minFloor <= floorNumber) has roughly a 40% chance
 * of appearing. At most one mercenary spawns per floor.
 */
export function spawnMercenaries(
  floor: DungeonFloor,
  floorNumber: number,
  occupied: Set<string>,
  zone?: ZoneId,
): MapMercenary[] {
  // Check for AI-generated mercenaries first (narrative_test zone)
  let mercPool: MercenaryDef[] = [];
  
  if (zone === 'narrative_test') {
    const cache = getContentCache();
    const generatedMercs = getMercenariesForFloor(cache, floorNumber);
    if (generatedMercs.length > 0) {
      console.log('[Entities] Using AI-generated mercenaries:', generatedMercs.map(m => m.name));
      mercPool = generatedMercs;
    }
  }
  
  // Fall back to default mercenaries
  if (mercPool.length === 0) {
    mercPool = MERCENARY_DEFS.filter((m) => m.minFloor <= floorNumber);
  }
  
  if (mercPool.length === 0) return [];

  // ~40% chance to spawn a mercenary on this floor (higher in narrative zone)
  const spawnChance = zone === 'narrative_test' ? 0.7 : 0.4;
  if (Math.random() > spawnChance) return [];

  const def = pick(mercPool);
  const pos = randomWalkable(floor, occupied);
  if (!pos) return [];

  return [
    {
      id: uid(),
      pos,
      defId: def.id,
      hired: false,
    },
  ];
}

/** Pick a random item from the top portion of a sorted-by-power array, scaled to floor depth.
 *  Returns an item near the player's expected tier with a bit of variance. */
function pickScaled<T>(pool: T[], floorNumber: number, divisor: number): T {
  if (pool.length === 0) return pool[0]!;
  const idealIdx = Math.min(pool.length - 1, Math.floor(floorNumber / divisor));
  // Allow picking from a small window around the ideal tier for variety
  const lo = Math.max(0, idealIdx - 1);
  const hi = Math.min(pool.length - 1, idealIdx + 1);
  return pool[randInt(lo, hi)]!;
}

/**
 * Compute a generation-based scaling multiplier for shop items.
 * Each generation adds +15% compounding (1.15^gen), capped at 5x.
 * This makes the shop sell noticeably stronger and pricier gear as the player
 * progresses through bloodline generations.
 */
function genScaleMultiplier(generation: number): number {
  if (generation <= 0) return 1;
  return Math.min(Math.pow(1.15, generation), 5);
}

/**
 * Apply generation scaling to a shop item — boosts stat bonuses and value.
 */
function applyGenerationScaling(item: Item, generation: number): Item {
  const mult = genScaleMultiplier(generation);
  if (mult <= 1) return item;

  // Scale stat bonuses
  if (item.statBonus) {
    const scaled = { ...item.statBonus };
    for (const key of Object.keys(scaled) as (keyof typeof scaled)[]) {
      if (scaled[key] !== undefined) {
        scaled[key] = Math.round(scaled[key]! * mult);
      }
    }
    item.statBonus = scaled;
  }

  // Scale value (affects sell price and shop price)
  item.value = Math.round(item.value * mult);

  // Scale on-hit effect damage if present
  if (item.onHitEffect && 'damage' in item.onHitEffect && typeof (item.onHitEffect as any).damage === 'number') {
    (item.onHitEffect as any).damage = Math.round((item.onHitEffect as any).damage * mult);
  }

  // Scale maxHp bonus if present in statBonus
  // (already handled above via statBonus loop)

  return item;
}

function generateShopStock(floorNumber: number, zone: ZoneId = 'stone_depths', generation: number = 0): ShopItem[] {
  const stock: ShopItem[] = [];
  const zoneFood = getZoneFood(zone);
  const foodPool = [...FOOD_TEMPLATES, ...zoneFood];
  const gMult = genScaleMultiplier(generation);

  // Always sell food — food is affordable! (0.8x multiplier instead of 1.5x)
  const food1 = pick(foodPool);
  const food2 = pick(foodPool);
  stock.push({ item: { ...food1, id: uid() }, price: Math.floor(food1.value * 0.8 * gMult) });
  stock.push({ item: { ...food2, id: uid() }, price: Math.floor(food2.value * 0.8 * gMult) });

  // Always sell a health potion
  stock.push({ item: { ...POTION_TEMPLATES[0]!, id: uid() }, price: Math.floor(15 * gMult) });

  // Deeper floors get better potions
  if (floorNumber >= 3) {
    stock.push({ item: { ...POTION_TEMPLATES[1]!, id: uid() }, price: Math.floor(35 * gMult) });
  }
  // Full heal potion available on very deep floors
  if (floorNumber >= 8) {
    stock.push({ item: { ...POTION_TEMPLATES[6]!, id: uid() }, price: Math.floor(80 * gMult) });
  }

  // Sell a scroll — deeper floors get access to better scrolls
  const scrollIdx = Math.min(SCROLL_TEMPLATES.length - 1, Math.floor(floorNumber / 3));
  const scrollPool = SCROLL_TEMPLATES.slice(0, scrollIdx + 1);
  stock.push({ item: { ...pick(scrollPool), id: uid() }, price: Math.floor((25 + floorNumber * 3) * gMult) });

  // Sell a weapon scaled to floor (includes necropolis + zone weapons)
  const allWeapons = getAllWeapons(zone);
  const weapon = pickScaled(allWeapons, floorNumber, 2);
  const weaponItem = applyGenerationScaling(applyRarity({ ...weapon, id: uid() }, floorNumber), generation);
  stock.push({ item: weaponItem, price: Math.floor(weaponItem.value * 2) });

  // On deeper floors, offer a second weapon option for more choice
  if (floorNumber >= 5) {
    const weapon2 = pickScaled(allWeapons, floorNumber, 1.5);
    const weapon2Item = applyGenerationScaling(applyRarity({ ...weapon2, id: uid() }, floorNumber), generation);
    stock.push({ item: weapon2Item, price: Math.floor(weapon2Item.value * 2.2) });
  }

  // Sell armor scaled to floor (includes necropolis + zone armor)
  const allArmor = getAllArmor(zone);
  const armor = pickScaled(allArmor, floorNumber, 3);
  const armorItem = applyGenerationScaling(applyRarity({ ...armor, id: uid() }, floorNumber), generation);
  stock.push({ item: armorItem, price: Math.floor(armorItem.value * 2) });

  // On deeper floors, offer a second armor option
  if (floorNumber >= 6) {
    const armor2 = pickScaled(allArmor, floorNumber, 2);
    const armor2Item = applyGenerationScaling(applyRarity({ ...armor2, id: uid() }, floorNumber), generation);
    stock.push({ item: armor2Item, price: Math.floor(armor2Item.value * 2.2) });
  }

  // Chance for a ring on deeper floors
  if (floorNumber >= 4) {
    const ring = pickScaled(RING_TEMPLATES, floorNumber, 3);
    const ringItem = applyGenerationScaling(applyRarity({ ...ring, id: uid() }, floorNumber), generation);
    stock.push({ item: ringItem, price: Math.floor(ringItem.value * 2.5) });
  }

  // Amulets available on deeper floors
  if (floorNumber >= 7) {
    const amulet = pickScaled(AMULET_TEMPLATES, floorNumber - 7, 2);
    const amuletItem = applyGenerationScaling(applyRarity({ ...amulet, id: uid() }, floorNumber), generation);
    stock.push({ item: amuletItem, price: Math.floor(amuletItem.value * 2.5) });
  }

  // Necropolis items in shops on deeper floors
  const extraItems = getExtraItems();
  if (extraItems.length > 0 && floorNumber >= 3) {
    const necroItem = pick(extraItems);
    const necroItemWithRarity = applyGenerationScaling(applyRarity({ ...necroItem, id: uid() }, floorNumber), generation);
    stock.push({ item: necroItemWithRarity, price: Math.floor(necroItemWithRarity.value * 2) });
  }

  return stock;
}

export function spawnShop(floor: DungeonFloor, floorNumber: number, occupied: Set<string>, zone: ZoneId = 'stone_depths', generation: number = 0): Shop | null {
  const pos = randomWalkable(floor, occupied);
  if (!pos) return null;
  return { pos, stock: generateShopStock(floorNumber, zone, generation) };
}

/** Search all item template arrays for a template by name. */
export function findItemTemplate(name: string): Omit<Item, 'id'> | undefined {
  const necroState = getNecropolisState();
  const necroDeaths = necroState.communalDeaths;
  const allTemplates = [
    ...WEAPON_TEMPLATES,
    ...RANGER_WEAPON_TEMPLATES,
    ...ARMOR_TEMPLATES,
    ...RING_TEMPLATES,
    ...AMULET_TEMPLATES,
    ...POTION_TEMPLATES,
    ...SCROLL_TEMPLATES,
    ...FOOD_TEMPLATES,
    ...BOSS_LOOT_TEMPLATES,
    ANCESTORS_FANG,
    ...ZONE_BOSS_LOOT,
    ...getNecropolisWeapons(necroDeaths),
    ...getNecropolisArmor(necroDeaths),
    ...getNecropolisItems(necroDeaths),
    ...getUnlockedBountyItems(necroState.communalKills),
    ...getEchoWeapons(_echoUnlockedNodes),
    ...ECHO_BOSS_LOOT,
  ];
  return allTemplates.find((t) => t.name === name);
}
