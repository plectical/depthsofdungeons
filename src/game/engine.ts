import { Tile, type GameState, type Entity, type EquipSlot, type PlayerClass, type BloodlineData, type DialogueEffect, type BossAbility, type ZoneId, type TerrainType, type MonsterAbility, type ClassDef, type SkillName } from './types';
import { getTransformDef } from './story-mode/transformations';
import { getRaceDef } from './races';
import { generateFloor, isWalkableTile, getTile, getTerrainAt } from './dungeon';
import { createPlayer, spawnMonsters, spawnItems, randomItem, spawnShop, findItemTemplate, spawnBoss, spawnMercenaries } from './entities';
import { VIEW_RADIUS, XP_PER_LEVEL, MSG_COLOR, MONSTER_DEFS, CLASS_DEFS, HUNGER_MAX, HUNGER_PER_TURN, HUNGER_WARNING, STARVING_THRESHOLD, STARVING_DAMAGE, REGEN_INTERVAL, REGEN_HUNGER_MIN, BOSS_DEFS, MERCENARY_DEFS, RARITY_DEFS, POTION_TEMPLATES, FOOD_TEMPLATES, DEATH_KNIGHT_CLASS } from './constants';
import { uid, resetIdCounter, manhattan, findPath, linePoints, clamp, gpStart, gpEnd } from './utils';
import type { GeneratedClass } from './generativeClass';

/** Synchronous localStorage read for generated class (mirrors safeStorage backup prefix) */
function getStoredGeneratedClass(): GeneratedClass | null {
  try {
    const json = localStorage.getItem('dod_backup_activeGeneratedClass');
    if (!json) return null;
    return JSON.parse(json) as GeneratedClass;
  } catch {
    return null;
  }
}
import { computeBloodlineBonuses, createEmptyRunStats } from './traits';
import { spawnNPCs } from './npcs';
import { getNecropolisClasses, getNecropolisMonsters } from './necropolis';
import { getNecropolisState } from './necropolisService';
import { getZoneDef, getNextZone, ZONE_BOSSES, ZONE_BOSS_LOOT } from './zones';
import { getAttackElement, getDefenseElement, getElementalMultiplier, getElementalMessage, ELEMENT_INFO } from './elements';
import { getSkillNode, canUnlockNode, getEnemyTags } from './skillTree';
import { trackSkillUnlocked, trackRangedAttack, trackConsumableUsed, trackStoryTransformUsed } from './analytics';
import type { EchoBonuses } from './echoTree';
import { SHARD_DROP_CHANCE, BOSS_SHARD_MIN, BOSS_SHARD_MAX, ensureLegacyData, getGearForClass, getCumulativeStats, createLegacyItem, getUnlockedAbilities, LEGACY_ABILITY_DESCRIPTIONS } from './legacyGear';
import { initializeStoryState, initializeCharacterSkills, onFloorEnter, createEmptyCache, spawnFloorEncounters, getBoonBonus, updateBoonDurations, checkForHiddenElements, discoverHiddenElement } from './story';
import { getContentCache } from './story/progressiveLoader';
import { getMercenariesForFloor } from './story/contentCache';
import { progressAffliction, getRandomProgressMessage, getAfflictionStatModifiers, getTelepathicLink, getCurrentStage, getAfflictionDef, isItemBlocked } from './afflictions';
import { modifyFactionReputation, REPUTATION_CHANGES, getFactionDef, getFactionForCreature } from './factions';
import { getRoomAtPosition, checkForRoomEvent, tickRoomEventBuffs, getRoomEventStatModifiers } from './roomEvents';

function findZoneBossLoot(name: string): Omit<import('./types').Item, 'id'> | undefined {
  return ZONE_BOSS_LOOT.find(t => t.name === name);
}

// ─── Generated Class Narrative Beats ───

function buildGenClassIntroCharacter(gen: GeneratedClass): import('./types').StoryCharacter {
  return {
    id: `genclass_${gen.id}`,
    name: gen.name,
    title: gen.title,
    race: 'human',
    role: 'ally',
    traits: ['mysterious', 'determined'],
    motivation: gen.backstory,
    secret: '',
    appearanceDescription: gen.description,
    portraitUrl: gen.portraitUrl,
    char: gen.char,
    color: gen.color,
    introFloorRange: [1, 1],
    introDialogue: gen.backstory,
    relationshipTiers: [],
    recruitable: false,
    isGenerated: true,
  };
}

function buildGenClassIntroBeat(gen: GeneratedClass): import('./types').NarrativeBeat {
  const bossName = gen.boss?.name ?? 'an ancient evil';
  const bossTitle = gen.boss?.title ?? '';
  const charId = `genclass_${gen.id}`;
  const beatId = `genclass_intro_${gen.id}`;

  const nodes: Record<string, import('./types').StoryDialogueNode> = {
    root: {
      id: 'root',
      speaker: 'narrator',
      text: `${gen.icon} ${gen.name} — ${gen.title}`,
      nextNodeId: 'backstory',
    },
    backstory: {
      id: 'backstory',
      speaker: 'character',
      characterId: charId,
      text: gen.backstory,
      nextNodeId: 'quest',
    },
    quest: {
      id: 'quest',
      speaker: 'narrator',
      text: `Deep below, ${bossName}${bossTitle ? ` — ${bossTitle}` : ''} awaits. ${gen.boss?.challengeDescription ?? 'Only the worthy will survive.'}`,
      nextNodeId: 'resolve',
    },
    resolve: {
      id: 'resolve',
      speaker: 'character',
      characterId: charId,
      text: `With ${gen.resource.name} as my weapon and ${gen.ability.name} at my command, I descend into the darkness.`,
    },
  };

  return {
    id: beatId,
    characterId: charId,
    beatType: 'intro',
    trigger: { type: 'floor', floorRange: [1, 1] },
    dialogue: { rootNodeId: 'root', nodes },
    effects: [],
  };
}

function buildGenClassBossBeat(gen: GeneratedClass): import('./types').NarrativeBeat | null {
  if (!gen.boss) return null;
  const boss = gen.boss;
  const charId = `genclass_boss_${gen.id}`;
  const beatId = `genclass_boss_${gen.id}`;

  const nodes: Record<string, import('./types').StoryDialogueNode> = {
    root: {
      id: 'root',
      speaker: 'narrator',
      text: `The air grows heavy. A presence stirs in the darkness ahead...`,
      nextNodeId: 'reveal',
    },
    reveal: {
      id: 'reveal',
      speaker: 'character',
      characterId: charId,
      text: `I am ${boss.name}${boss.title ? `, ${boss.title}` : ''}. ${boss.description ?? 'You dare challenge me?'}`,
      nextNodeId: 'challenge',
    },
    challenge: {
      id: 'challenge',
      speaker: 'narrator',
      text: boss.challengeDescription ?? `${boss.name} prepares to fight. This is the ultimate test.`,
    },
  };

  return {
    id: beatId,
    characterId: charId,
    beatType: 'climax',
    trigger: { type: 'floor', floorRange: [8, 15] },
    dialogue: { rootNodeId: 'root', nodes },
    effects: [],
  };
}

function buildGenClassBossCharacter(gen: GeneratedClass): import('./types').StoryCharacter | null {
  if (!gen.boss) return null;
  return {
    id: `genclass_boss_${gen.id}`,
    name: gen.boss.name,
    title: gen.boss.title ?? '',
    race: 'demon',
    role: 'enemy',
    traits: ['powerful', 'ancient'],
    motivation: gen.boss.description ?? '',
    secret: '',
    appearanceDescription: gen.boss.description ?? '',
    char: gen.boss.char ?? 'B',
    color: gen.boss.color ?? '#ff4444',
    introFloorRange: [8, 15],
    introDialogue: gen.boss.challengeDescription ?? '',
    relationshipTiers: [],
    recruitable: false,
    isGenerated: true,
  };
}

function injectGenClassNarrativeContent(gen: GeneratedClass): void {
  const cache = getContentCache();
  if (!cache) return;

  const introChar = buildGenClassIntroCharacter(gen);
  const introBeat = buildGenClassIntroBeat(gen);

  const batch1 = cache.floors1to3;
  if (batch1) {
    batch1.characters.push(introChar);
    batch1.storyBeats.unshift(introBeat);
  }

  const bossChar = buildGenClassBossCharacter(gen);
  const bossBeat = buildGenClassBossBeat(gen);
  if (bossChar && bossBeat) {
    const batch3 = cache.floors7to10;
    if (batch3) {
      batch3.characters.push(bossChar);
      batch3.storyBeats.push(bossBeat);
    }
    const batch4 = cache.floors11plus;
    if (batch4) {
      batch4.characters.push(bossChar);
      batch4.storyBeats.push(bossBeat);
    }
  }
}

// ─── Ranged Attack Helpers ───

/** Check line-of-sight from `from` to `to`. Returns true if no walls block the path. */
function hasLOS(state: GameState, from: { x: number; y: number }, to: { x: number; y: number }): boolean {
  const points = linePoints(from.x, from.y, to.x, to.y);
  // Skip start and end points — only check intermediate tiles for walls
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i]!;
    const tile = getTile(state.floor, p.x, p.y);
    if (tile === Tile.Wall || tile === Tile.Void) return false;
  }
  return true;
}

/** Get the effective attack range for the player (based on equipped weapon). */
export function getPlayerRange(state: GameState): number {
  const weapon = state.player.equipment.weapon;
  if (weapon?.range && weapon.range > 1) return weapon.range;
  // Ranger passive: Keen Shot gives base range 3 even with melee weapons
  if (hasPassive(state, 'Keen Eye') && (!weapon?.range || weapon.range <= 1)) return 3;
  return 1;
}

/** Get the effective attack range for a monster. */
function getMonsterRange(monster: Entity): number {
  return monster.attackRange ?? 1;
}

/** Try a ranged attack from the player to a target monster. Returns true if attack happened. */
export function rangedAttack(state: GameState, targetX: number, targetY: number): boolean {
  const range = getPlayerRange(state);
  if (range <= 1) return false;

  const target = state.monsters.find(m => !m.isDead && m.pos.x === targetX && m.pos.y === targetY);
  if (!target) return false;

  const dist = manhattan(state.player.pos, target.pos);
  if (dist > range || dist <= 1) return false; // Too far or adjacent (use melee)

  // Must be visible and have clear line of sight
  if (!state.floor.visible[targetY]?.[targetX]) return false;
  if (!hasLOS(state, state.player.pos, target.pos)) return false;

  // Spawn projectile visual
  const weapon = state.player.equipment.weapon;
  if (!state.projectiles) state.projectiles = [];
  state.projectiles.push({
    from: { ...state.player.pos },
    to: { ...target.pos },
    char: weapon?.range ? '→' : '•',
    color: weapon?.color ?? '#ffcc44',
  });

  // Ranged attacks do slightly less damage (85%) to balance vs melee
  attackEntity(state, state.player, target);

  // Track ranged attack for quest progress
  state.runStats.rangedAttacks++;

  // Track ranged attack usage
  trackRangedAttack({
    playerClass: state.playerClass,
    floor: state.floorNumber,
    zone: state.zone,
    distance: dist,
    targetName: target.baseName ?? target.name,
  });

  processTurn(state);
  return true;
}

// ─── Terrain Placement ───

const TERRAIN_TYPE_MAP: Record<string, TerrainType> = {
  wall: 'crystal', bone: 'crystal', stone: 'crystal', barrier: 'crystal',
  spike: 'brimstone', fire: 'lava', lava: 'lava', hellfire: 'hellfire',
  ice: 'ice', frost: 'frozen', frozen: 'frozen',
  poison: 'poison', toxic: 'poison', acid: 'poison',
  water: 'water', mud: 'mud', swamp: 'mud',
  shadow: 'shadow', dark: 'shadow', void: 'void_rift',
  holy: 'holy', light: 'holy',
  spore: 'spore', fungus: 'mycelium',
  crystal: 'crystal', blood: 'blood_pool',
  pit: 'void_rift', trap: 'brimstone',
};

function resolveTerrainType(raw?: string): TerrainType {
  if (!raw) return 'crystal';
  const key = raw.toLowerCase().replace(/[_\s-]/g, '');
  for (const [k, v] of Object.entries(TERRAIN_TYPE_MAP)) {
    if (key.includes(k)) return v;
  }
  return 'crystal';
}

/** Place terrain tiles in a radius around a position on walkable floor tiles. */
function placeTerrain(state: GameState, cx: number, cy: number, terrain: TerrainType, radius: number, count: number) {
  const candidates: { x: number; y: number }[] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const x = cx + dx;
      const y = cy + dy;
      if (x < 0 || x >= state.floor.width || y < 0 || y >= state.floor.height) continue;
      const tile = getTile(state.floor, x, y);
      if (tile !== Tile.Floor && tile !== Tile.Corridor) continue;
      const key = `${x},${y}`;
      // Don't overwrite existing terrain
      if (state.floor.terrain[key]) continue;
      candidates.push({ x, y });
    }
  }
  // Shuffle and pick up to count tiles
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j]!, candidates[i]!];
  }
  const placed = Math.min(count, candidates.length);
  for (let i = 0; i < placed; i++) {
    const pos = candidates[i]!;
    state.floor.terrain[`${pos.x},${pos.y}`] = terrain;
  }
  return placed;
}

// ─── Game Init ───

// Cache for active generated class to avoid repeated parsing
let cachedGeneratedClassDef: ClassDef | null = null;
let cachedGeneratedClassId: string | null = null;

/** Convert a GeneratedClass to a ClassDef for use in the engine */
function generatedClassToClassDef(gen: GeneratedClass): ClassDef {
  return {
    id: 'generated',
    name: gen.name,
    char: gen.char,
    color: gen.color,
    description: gen.description,
    baseStats: gen.baseStats,
    levelBonusHp: gen.levelBonusHp,
    levelBonusAtk: gen.levelBonusAtk,
    levelBonusDef: gen.levelBonusDef,
    passives: gen.passives.map(p => ({
      name: p.name,
      description: p.description,
      unlockLevel: p.unlockLevel,
    })),
    abilityPool: [],
    requiresBestFloor: 0,
  };
}

export function getClassDef(cls: PlayerClass): ClassDef {
  // Handle generated class
  if (cls === 'generated') {
    const gen = getStoredGeneratedClass();
    if (gen) {
      // Use cache if same class
      if (cachedGeneratedClassId === gen.id && cachedGeneratedClassDef) {
        return cachedGeneratedClassDef;
      }
      cachedGeneratedClassDef = generatedClassToClassDef(gen);
      cachedGeneratedClassId = gen.id;
      return cachedGeneratedClassDef;
    }
    // Default fallback for generated class
    return CLASS_DEFS[0]!;
  }

  // Check base classes first, then special classes, then necropolis classes
  const base = CLASS_DEFS.find((c) => c.id === cls);
  if (base) return base;

  if (cls === 'death_knight') return DEATH_KNIGHT_CLASS;
  
  const necroClasses = getNecropolisClasses(getNecropolisState().communalDeaths, ['mas_class_3', 'mas_class_4']);
  const necroClass = necroClasses.find((c) => c.id === cls);
  if (necroClass) return necroClass;
  
  return CLASS_DEFS[0]!;
}

export function hasPassive(state: GameState, passiveName: string): boolean {
  const def = getClassDef(state.playerClass);
  return def.passives.some((p) => p.name === passiveName && state.player.level >= p.unlockLevel);
}

/** Check if the player has chosen a specific ability by ID. */
export function hasChosenAbility(state: GameState, abilityId: string): boolean {
  return state.player.chosenAbilities?.includes(abilityId) ?? false;
}

/** Apply the effects of a chosen ability to the player. */
export function chooseAbility(state: GameState, abilityId: string): boolean {
  const choice = state.pendingAbilityChoice;
  if (!choice) return false;

  const ability = choice.options.find(a => a.id === abilityId);
  if (!ability) return false;

  if (!state.player.chosenAbilities) state.player.chosenAbilities = [];
  state.player.chosenAbilities.push(abilityId);

  // Apply immediate stat effects (only for abilities that grant instant stats)
  switch (abilityId) {
    // Necromancer
    case 'nec_dark_pact':
      state.player.stats.attack += 4;
      state.player.stats.maxHp = Math.max(10, state.player.stats.maxHp - 5);
      state.player.stats.hp = Math.min(state.player.stats.hp, state.player.stats.maxHp);
      break;
    case 'nec_bone_armor':
      state.player.stats.defense += 3;
      break;
    // Revenant
    case 'rev_undead_vigor':
      state.player.stats.maxHp += 8;
      state.player.stats.hp += 8;
      break;
    case 'rev_relentless':
      state.player.stats.speed += 5;
      break;
    // Death Knight
    case 'dk_runic_shield':
      state.player.stats.defense += 5;
      break;
    case 'dk_bone_armor':
      state.player.stats.maxHp += 8;
      state.player.stats.hp += 8;
      state.player.stats.defense += 2;
      break;
  }
  // All other abilities are passive/triggered effects handled in combat/turn logic

  addMessage(state, `Ability learned: ${ability.name}!`, '#ffcc33');
  state.pendingAbilityChoice = null;
  return true;
}

/** Apply a +1 narrative skill pick from level-up. */
export function chooseNarrativeSkill(state: GameState, skill: SkillName): boolean {
  if (!state.pendingNarrativeSkillPick || !state.skills) return false;
  state.skills[skill] = Math.min(20, state.skills[skill] + 1);
  state.pendingNarrativeSkillPick = false;
  addMessage(state, `${skill.charAt(0).toUpperCase() + skill.slice(1)} improved to ${state.skills[skill]}!`, '#ffcc33');
  return true;
}

// ─── Skill Tree ───

/** Unlock a skill tree node, applying its effects. */
export function unlockSkillNode(state: GameState, nodeId: string): boolean {
  const { canUnlock } = canUnlockNode(nodeId, state.playerClass, state.unlockedNodes, state.skillPoints);
  if (!canUnlock) return false;

  const nd = getSkillNode(state.playerClass, nodeId);
  if (!nd) return false;

  state.skillPoints -= nd.cost;
  state.unlockedNodes.push(nodeId);

  applyNodeEffect(state, nd.effect);
  addMessage(state, `Skill unlocked: ${nd.name}!`, nd.color);

  // Track skill unlock — how many total SP this player has spent
  const totalSpent = state.unlockedNodes.reduce((sum, nId) => {
    const n = getSkillNode(state.playerClass, nId);
    return sum + (n?.cost ?? 0);
  }, 0);
  trackSkillUnlocked({
    nodeId,
    nodeName: nd.name,
    cost: nd.cost,
    skillPointsRemaining: state.skillPoints,
    totalSkillPointsSpent: totalSpent,
    playerClass: state.playerClass,
    floor: state.floorNumber,
    zone: state.zone,
    playerLevel: state.player.level,
  });

  return true;
}

function applyNodeEffect(state: GameState, effect: import('./types').SkillNodeEffect) {
  switch (effect.type) {
    case 'ability': {
      if (!state.player.chosenAbilities) state.player.chosenAbilities = [];
      if (!state.player.chosenAbilities.includes(effect.abilityId)) {
        state.player.chosenAbilities.push(effect.abilityId);
      }
      // Apply immediate stat effects for abilities that grant them
      switch (effect.abilityId) {
        case 'nec_dark_pact':
          state.player.stats.attack += 4;
          state.player.stats.maxHp = Math.max(10, state.player.stats.maxHp - 5);
          state.player.stats.hp = Math.min(state.player.stats.hp, state.player.stats.maxHp);
          break;
        case 'nec_bone_armor':
          state.player.stats.defense += 3;
          break;
        case 'rev_undead_vigor':
          state.player.stats.maxHp += 8;
          state.player.stats.hp += 8;
          break;
        case 'rev_relentless':
          state.player.stats.speed += 5;
          break;
      }
      break;
    }
    case 'stat': {
      const stats = state.player.stats;
      const s = effect.stat;
      if (s === 'hp') stats.hp += effect.value;
      else if (s === 'maxHp') { stats.maxHp += effect.value; stats.hp += effect.value; }
      else if (s === 'attack') stats.attack += effect.value;
      else if (s === 'defense') stats.defense += effect.value;
      else if (s === 'speed') stats.speed += effect.value;
      break;
    }
    case 'weaponProf':
    case 'enemyBonus':
    case 'activeModifier':
    case 'passive':
      // These are checked at combat time via hasNodeEffect()
      break;
    case 'multi':
      for (const e of effect.effects) applyNodeEffect(state, e);
      break;
  }
}

/** Check if the player has a specific active modifier from the skill tree. */
export function hasActiveModifier(state: GameState, modifierId: string): boolean {
  for (const nid of state.unlockedNodes) {
    const nd = getSkillNode(state.playerClass, nid);
    if (!nd) continue;
    if (effectContainsModifier(nd.effect, modifierId)) return true;
  }
  return false;
}

function effectContainsModifier(effect: import('./types').SkillNodeEffect, modifierId: string): boolean {
  if (effect.type === 'activeModifier' && effect.modifierId === modifierId) return true;
  if (effect.type === 'multi') return effect.effects.some(e => effectContainsModifier(e, modifierId));
  return false;
}

/** Get total weapon proficiency bonus % for the equipped weapon. */
export function getWeaponProfBonus(state: GameState): number {
  const weapon = state.player.equipment?.weapon;
  if (!weapon) return 0;
  const weaponName = weapon.name;
  let bonus = 0;
  for (const nid of state.unlockedNodes) {
    const nd = getSkillNode(state.playerClass, nid);
    if (!nd) continue;
    bonus += collectWeaponProf(nd.effect, weaponName);
  }
  return bonus;
}

function collectWeaponProf(effect: import('./types').SkillNodeEffect, weaponName: string): number {
  if (effect.type === 'weaponProf') {
    if (effect.weaponKeyword === '__all__' || weaponName.includes(effect.weaponKeyword)) {
      return effect.damagePercent;
    }
  }
  if (effect.type === 'multi') {
    return effect.effects.reduce((sum, e) => sum + collectWeaponProf(e, weaponName), 0);
  }
  return 0;
}

/** Get total enemy type bonus % for a specific monster. */
export function getEnemyTypeBonus(state: GameState, monsterName: string, isBoss?: boolean): number {
  const tags = getEnemyTags(monsterName, isBoss);
  let bonus = 0;
  for (const nid of state.unlockedNodes) {
    const nd = getSkillNode(state.playerClass, nid);
    if (!nd) continue;
    bonus += collectEnemyBonus(nd.effect, tags);
  }
  return bonus;
}

function collectEnemyBonus(effect: import('./types').SkillNodeEffect, tags: string[]): number {
  if (effect.type === 'enemyBonus') {
    if (tags.includes(effect.enemyKeyword)) return effect.damagePercent;
  }
  if (effect.type === 'multi') {
    return effect.effects.reduce((sum, e) => sum + collectEnemyBonus(e, tags), 0);
  }
  return 0;
}

// ═══════════════════════════════════════════════════
// LEGACY ABILITY SYSTEM — active combat mechanics
// ═══════════════════════════════════════════════════

/** Legacy ability runtime state tracked via GameState extensions. */
export interface LegacyAbilityState {
  /** Ability IDs unlocked for this run */
  _legacyAbilities?: string[];
  // ── Warrior ──
  _legacyBlockCD?: number;      // Holy Block cooldown (60 turns)
  _legacyWallTurns?: number;    // Divine Wall active turns remaining
  _legacyWallCD?: number;       // Divine Wall cooldown (90 turns)
  _legacyReflect?: boolean;     // Judgment reflect armed
  _legacyReflectCD?: number;    // Judgment cooldown (80 turns)
  // ── Rogue ──
  _legacyDodgeTurns?: number;   // Shadow Dodge active turns remaining
  _legacyDodgeCD?: number;      // Shadow Dodge cooldown (40 turns)
  _legacyCrit?: boolean;        // Fatal Strike armed
  _legacyCritCD?: number;       // Fatal Strike cooldown (50 turns)
  _legacyVanishTurns?: number;  // Vanish active turns remaining
  _legacyVanishCD?: number;     // Vanish cooldown (60 turns)
  // ── Mage ──
  _legacyBurstCD?: number;      // Arcane Burst cooldown (30 turns)
  _legacyBarrier?: number;      // Mana Barrier remaining absorb HP
  _legacyBarrierCD?: number;    // Mana Barrier cooldown (50 turns)
  _legacyNovaCD?: number;       // Supernova cooldown (60 turns)
  // ── Ranger ──
  _legacyPierce?: boolean;      // Piercing Shot armed
  _legacyPierceCD?: number;     // Piercing Shot cooldown (30 turns)
  _legacyMultiCD?: number;      // Multi-Shot cooldown (25 turns)
  _legacyRainCD?: number;       // Arrow Rain cooldown (40 turns)
  // ── Paladin ──
  _legacyHealCD?: number;       // Holy Mend cooldown (30 turns)
  _legacyAuraTurns?: number;    // Blessed Aura active turns remaining
  _legacyAuraCD?: number;       // Blessed Aura cooldown (40 turns)
  _legacyPalJudgeCD?: number;   // Divine Judgment cooldown (50 turns)
  // ── Hellborn ──
  _legacyDrainTurns?: number;   // Soul Siphon active turns remaining
  _legacyDrainCD?: number;      // Soul Siphon cooldown (40 turns)
  _legacyEruptionCD?: number;   // Hellfire Eruption cooldown (35 turns)
  _legacyCurseTurns?: number;   // Death Curse active turns remaining
  _legacyCurseCD?: number;      // Death Curse cooldown (50 turns)
}

/** Check if a legacy ability is available this run. */
export function hasLegacyAbility(state: GameState, abilityId: string): boolean {
  return (state as GameState & LegacyAbilityState)._legacyAbilities?.includes(abilityId) ?? false;
}

/** Get the full legacy ability state for HUD display. */
export function getLegacyAbilityState(state: GameState): LegacyAbilityState {
  return state as GameState & LegacyAbilityState;
}

/** Initialize legacy abilities on the game state at start of run. */
function initLegacyAbilities(state: GameState, abilities: string[]) {
  const ext = state as GameState & LegacyAbilityState;
  ext._legacyAbilities = abilities;

  // ── Auto-activate abilities at start of each run ──
  // Warrior
  if (abilities.includes('legacy_warrior_block')) ext._legacyBlockCD = 0;
  if (abilities.includes('legacy_warrior_wall')) ext._legacyWallCD = 0;
  if (abilities.includes('legacy_warrior_reflect')) { ext._legacyReflect = true; ext._legacyReflectCD = 0; }
  // Rogue
  if (abilities.includes('legacy_rogue_evade')) ext._legacyDodgeCD = 0;
  if (abilities.includes('legacy_rogue_crit')) { ext._legacyCrit = true; ext._legacyCritCD = 0; }
  if (abilities.includes('legacy_rogue_vanish')) ext._legacyVanishCD = 0;
  // Mage
  if (abilities.includes('legacy_mage_burst')) ext._legacyBurstCD = 0;
  if (abilities.includes('legacy_mage_shield')) { ext._legacyBarrier = 15; ext._legacyBarrierCD = 0; }
  if (abilities.includes('legacy_mage_nova')) ext._legacyNovaCD = 0;
  // Ranger
  if (abilities.includes('legacy_ranger_pierce')) { ext._legacyPierce = true; ext._legacyPierceCD = 0; }
  if (abilities.includes('legacy_ranger_multi')) ext._legacyMultiCD = 0;
  if (abilities.includes('legacy_ranger_rain')) ext._legacyRainCD = 0;
  // Paladin
  if (abilities.includes('legacy_paladin_heal')) ext._legacyHealCD = 0;
  if (abilities.includes('legacy_paladin_aura')) ext._legacyAuraCD = 0;
  if (abilities.includes('legacy_paladin_judgment')) ext._legacyPalJudgeCD = 0;
  // Hellborn
  if (abilities.includes('legacy_hellborn_drain')) ext._legacyDrainCD = 0;
  if (abilities.includes('legacy_hellborn_eruption')) ext._legacyEruptionCD = 0;
  if (abilities.includes('legacy_hellborn_curse')) ext._legacyCurseCD = 0;
}

export function newGame(playerClass: PlayerClass = 'warrior', bloodline?: BloodlineData, zone: ZoneId = 'stone_depths', echoBonuses?: EchoBonuses, playerRace?: string): GameState {
  gpStart('engine:newGame');
  resetIdCounter();
  const classDef = getClassDef(playerClass);
  const zoneDef = getZoneDef(zone);
  const floorNumber = 1;
  const floor = generateFloor(floorNumber, zone);
  const firstRoom = floor.rooms[0]!;
  const playerPos = { x: firstRoom.centerX, y: firstRoom.centerY };

  const occupied = new Set<string>();
  occupied.add(`${playerPos.x},${playerPos.y}`);
  // Reserve tiles immediately around the player so nothing spawns adjacent
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      occupied.add(`${playerPos.x + dx},${playerPos.y + dy}`);
    }
  }
  const lastRoom = floor.rooms[floor.rooms.length - 1]!;
  occupied.add(`${lastRoom.centerX},${lastRoom.centerY}`);

  const player = createPlayer(playerPos, classDef);
  player.chosenAbilities = [];

  // Apply bloodline bonuses
  let bonusGold = 0;
  let hungerBonus = 0;
  let xpMult = 1.0;
  if (bloodline) {
    const bonuses = computeBloodlineBonuses(bloodline);
    player.stats.maxHp += bonuses.statBonuses.maxHp ?? 0;
    player.stats.hp += bonuses.statBonuses.maxHp ?? 0;
    player.stats.attack += bonuses.statBonuses.attack ?? 0;
    player.stats.defense += bonuses.statBonuses.defense ?? 0;
    player.stats.speed += bonuses.statBonuses.speed ?? 0;
    bonusGold = bonuses.startingGold;
    hungerBonus = bonuses.hungerBonus;
    xpMult = bonuses.xpMultiplier;

    for (const itemName of bonuses.startingItems) {
      const template = findItemTemplate(itemName);
      if (template && player.inventory.length < 20) {
        player.inventory.push({ ...template, id: uid() });
      }
    }
  }

  // Apply Echo Tree bonuses (permanent meta-progression)
  let echoSkillPoints = 0;
  if (echoBonuses) {
    player.stats.maxHp += echoBonuses.statBonuses.maxHp ?? 0;
    player.stats.hp += echoBonuses.statBonuses.maxHp ?? 0;
    player.stats.attack += echoBonuses.statBonuses.attack ?? 0;
    player.stats.defense += echoBonuses.statBonuses.defense ?? 0;
    player.stats.speed += echoBonuses.statBonuses.speed ?? 0;
    bonusGold += echoBonuses.startingGold;
    hungerBonus += echoBonuses.hungerMaxBonus;
    xpMult *= (1 + echoBonuses.xpBonusPercent / 100);
    echoSkillPoints = echoBonuses.bonusSkillPoints;

    for (const itemName of echoBonuses.startingItems) {
      const template = findItemTemplate(itemName);
      if (template && player.inventory.length < 20) {
        player.inventory.push({ ...template, id: uid() });
      }
    }
  }

  // Apply Legacy Gear stat bonuses (persistent meta-progression)
  let legacyAbilitiesForRun: string[] = [];
  if (bloodline) {
    const legacyData = ensureLegacyData(bloodline);
    const gear = getGearForClass(legacyData, playerClass);
    if (gear.earned && gear.level > 0) {
      const legacyStats = getCumulativeStats(gear);
      player.stats.maxHp += legacyStats.maxHp ?? 0;
      player.stats.hp += legacyStats.maxHp ?? 0;
      player.stats.attack += legacyStats.attack ?? 0;
      player.stats.defense += legacyStats.defense ?? 0;
      player.stats.speed += legacyStats.speed ?? 0;
      // Add legacy gear as an equipped item so the player can see it
      const legacyItem = createLegacyItem(gear);
      if (legacyItem) player.equipment.legacy = legacyItem;
      // Collect unlocked legacy abilities for combat mechanics
      legacyAbilitiesForRun = getUnlockedAbilities(gear);
    }
  }

  // Apply race stat modifiers
  const raceDef = playerRace ? getRaceDef(playerRace) : undefined;
  if (raceDef) {
    player.stats.hp += raceDef.statMods.hp ?? 0;
    player.stats.maxHp += raceDef.statMods.hp ?? 0;
    player.stats.attack += raceDef.statMods.attack ?? 0;
    player.stats.defense += raceDef.statMods.defense ?? 0;
    player.stats.speed += raceDef.statMods.speed ?? 0;
  }

  const monsters = spawnMonsters(floor, floorNumber, occupied, zone, playerClass);
  const items = spawnItems(floor, floorNumber, occupied, zone);
  const shop = spawnShop(floor, floorNumber, occupied, zone, bloodline?.generation ?? 0);
  const npcs = bloodline ? spawnNPCs(floor, floorNumber, occupied, bloodline, playerClass, zone) : [];
  const mapMercenaries = spawnMercenaries(floor, floorNumber, occupied, zone);

  const bossesDefeatedThisRun: string[] = [];
  const boss = spawnBoss(floor, floorNumber, occupied, bossesDefeatedThisRun, zone, playerClass);
  const allMonsters = boss ? [...monsters, boss] : monsters;

  const state: GameState = {
    player,
    playerClass,
    playerRace,
    zone,
    monsters: allMonsters,
    items,
    floor,
    floorNumber,
    turn: 0,
    messages: [],
    gameOver: false,
    score: bonusGold,
    hunger: { current: HUNGER_MAX + hungerBonus, max: HUNGER_MAX + hungerBonus },
    shop,
    runStats: createEmptyRunStats(),
    npcs,
    pendingNPC: null,
    xpMultiplier: xpMult,
    _bloodlineRef: bloodline,
    mercenaries: [],
    mapMercenaries,
    pendingMercenary: null,
    bossesDefeatedThisRun,
    pendingAbilityChoice: null,
    skillPoints: echoSkillPoints,
    unlockedNodes: [],
    // Story system
    skills: initializeCharacterSkills(playerClass, bloodline),
    runStory: initializeStoryState(),
    contentCache: createEmptyCache(),
    hiddenElements: [],
    interactables: [],
    pendingStoryDialogue: null,
  };

  // Populate runPatron from content cache (for narrative zones)
  const contentCache = getContentCache();
  const patronChar = contentCache.floors1to3?.characters?.[0];
  if (patronChar) {
    state.runPatron = {
      characterId: patronChar.id,
      name: patronChar.name,
      factionId: getFactionForCreature(patronChar.race) ?? 'beast',
      race: patronChar.race,
      portraitUrl: patronChar.portraitUrl,
    };
    console.log('[Engine] Run patron set:', state.runPatron.name, 'faction:', state.runPatron.factionId);
  }

  // Class-specific starting gear — gives each class a unique early-game feel
  // All classes now get Bread to prevent floor-2 starvation deaths (6 deaths, avg 298s)
  // that were causing 62% of first-session players to never reach floor 2.
  const classGear: Record<string, { weapon?: string; weaponElement?: import('./types').Element; item?: string; item2?: string }> = {
    warrior: { weapon: 'Short Sword', weaponElement: 'fire', item: 'Health Potion', item2: 'Bread' },
    rogue: { weapon: 'Rusty Dagger', weaponElement: 'dark', item: 'Bread', item2: 'Health Potion' },
    mage: { weapon: 'Wooden Staff', weaponElement: 'lightning', item: 'Health Potion', item2: 'Bread' },
    ranger: { weapon: 'Short Bow', weaponElement: 'poison', item: 'Bread', item2: 'Health Potion' },
    paladin: { weapon: 'Short Sword', weaponElement: 'holy', item: 'Bread' },
    necromancer: { item: 'Health Potion', item2: 'Bread' },
    revenant: { item: 'Bread' },
    death_knight: { weapon: 'Short Sword', weaponElement: 'dark', item: 'Health Potion', item2: 'Bread' },
  };
  const gear = classGear[playerClass];
  if (gear) {
    if (gear.weapon) {
      const weaponTemplate = findItemTemplate(gear.weapon);
      if (weaponTemplate) {
        const weapon = { ...weaponTemplate, id: uid(), element: gear.weaponElement ?? weaponTemplate.element };
        state.player.equipment.weapon = weapon;
      }
    }
    if (gear.item && state.player.inventory.length < 20) {
      const itemTemplate = findItemTemplate(gear.item);
      if (itemTemplate) {
        state.player.inventory.push({ ...itemTemplate, id: uid() });
      }
    }
    if (gear.item2 && state.player.inventory.length < 20) {
      const itemTemplate = findItemTemplate(gear.item2);
      if (itemTemplate) {
        state.player.inventory.push({ ...itemTemplate, id: uid() });
      }
    }
  }

  // Death Knight gets a renamed starting weapon
  if (playerClass === 'death_knight' && state.player.equipment.weapon) {
    state.player.equipment.weapon.name = 'Runic Blade';
    state.player.equipment.weapon.color = '#aa55cc';
  }

  if (playerClass === 'generated') {
    const gen = getActiveGeneratedClass();
    if (gen?.startingGear) {
      for (const gearDef of gen.startingGear) {
        const item: import('./types').Item = {
          id: uid(),
          name: gearDef.name,
          type: gearDef.slot === 'weapon' ? 'weapon' : gearDef.slot === 'armor' ? 'armor' : 'ring',
          char: gearDef.slot === 'weapon' ? ')' : gearDef.slot === 'armor' ? '[' : '=',
          color: gearDef.color,
          value: 10,
          equipSlot: gearDef.slot === 'weapon' ? 'weapon' : gearDef.slot === 'armor' ? 'armor' : 'ring',
          statBonus: gearDef.statBonus,
          description: gearDef.description,
          rarity: gearDef.rarity ?? 'common',
        };
        if (gearDef.slot === 'weapon' && !state.player.equipment.weapon) {
          state.player.equipment.weapon = item;
          addMessage(state, `Starting gear: ${item.name}`, gen.color);
        } else if (gearDef.slot === 'armor' && !state.player.equipment.armor) {
          state.player.equipment.armor = item;
          if (item.statBonus?.maxHp) {
            state.player.stats.maxHp += item.statBonus.maxHp;
            state.player.stats.hp += item.statBonus.maxHp;
          }
          addMessage(state, `Starting gear: ${item.name}`, gen.color);
        } else if (state.player.inventory.length < 20) {
          state.player.inventory.push(item);
          addMessage(state, `Starting gear: ${item.name}`, gen.color);
        }
      }
    }
  }

  // Apply level-1 passives that grant immediate stats
  for (const passive of classDef.passives) {
    if (passive.unlockLevel === 1 && passive.name === 'Quick Feet') {
      state.player.stats.speed += 3;
    }
  }

  if (bloodline && bloodline.generation > 0) {
    const lastAncestor = bloodline.ancestors[bloodline.ancestors.length - 1];
    if (lastAncestor) {
      addMessage(state, `You carry the blood of ${lastAncestor.name} (Gen ${bloodline.generation}).`, '#c49eff');
    }
  }

  // Initialize legacy abilities for combat
  if (legacyAbilitiesForRun.length > 0) {
    initLegacyAbilities(state, legacyAbilitiesForRun);
    const abilityNames = legacyAbilitiesForRun
      .filter(a => !a.endsWith('_master'))
      .map(a => LEGACY_ABILITY_DESCRIPTIONS[a]?.name)
      .filter(Boolean);
    if (abilityNames.length > 0) {
      addMessage(state, `\u2B50 Legacy abilities active: ${abilityNames.join(', ')}`, '#e0b0ff');
    }
  }

  // Spawn narrative encounters (skill checks, hidden elements)
  if (!state._isStoryMode) {
    spawnFloorEncounters(state, occupied);
  }

  // Inject generated class narrative content into the story cache
  if (zone === 'narrative_test' && playerClass === 'generated') {
    const gen = getActiveGeneratedClass();
    if (gen) {
      injectGenClassNarrativeContent(gen);
      const introBeatId = `genclass_intro_${gen.id}`;
      state.pendingStoryDialogue = { beatId: introBeatId, nodeId: 'root' };
      console.log('[Engine] Set generated class intro dialogue:', introBeatId);
    }
  }

  // Check for story events when starting a new run
  // Only enable generative story content in the narrative_test debug zone
  try {
    const isNarrativeZone = zone === 'narrative_test';
    const isFirstRun = !bloodline || bloodline.generation === 0;
    if (isNarrativeZone && !isFirstRun && !state.pendingStoryDialogue) {
      const storyEvent = onFloorEnter(state);
      console.log('[Engine] newGame storyEvent:', storyEvent);
      if (storyEvent && storyEvent.type === 'dialogue' && storyEvent.beatId) {
        state.pendingStoryDialogue = {
          beatId: storyEvent.beatId,
          nodeId: storyEvent.nodeId ?? 'root',
        };
        console.log('[Engine] Set pendingStoryDialogue:', state.pendingStoryDialogue);
      }
    } else if (!isNarrativeZone) {
      console.log('[Engine] Story dialogue disabled for non-narrative zone:', zone);
    } else if (state.pendingStoryDialogue) {
      console.log('[Engine] Skipping story dialogue — generated class intro already set');
    } else {
      console.log('[Engine] Skipping story dialogue on first run (generation 0)');
    }
  } catch (e) {
    console.error('[Engine] Error in story event check:', e);
  }

  addMessage(state, `You enter ${zoneDef.name} as a ${classDef.name}!`, MSG_COLOR.system);
  addMessage(state, 'Tap to move. Find the stairs (>) to descend.', MSG_COLOR.system);
  updateFOV(state);
  gpEnd('engine:newGame');
  return state;
}

/** Apply Starter Pack gear upgrades: better weapons + starting armor for all classes. */
export function applyStarterPackGear(state: GameState): void {
  const p = state.player;
  const cls = state.playerClass;

  const starterArmor: Record<string, { name: string; defense: number; maxHp: number; color: string }> = {
    warrior:      { name: 'Knight\'s Mail',      defense: 4, maxHp: 8,  color: '#ff6644' },
    rogue:        { name: 'Shadow Leathers',     defense: 3, maxHp: 5,  color: '#44ff88' },
    mage:         { name: 'Arcane Robes',        defense: 2, maxHp: 6,  color: '#aa44ff' },
    ranger:       { name: 'Tracker\'s Hide',     defense: 3, maxHp: 6,  color: '#88ff44' },
    paladin:      { name: 'Blessed Chainmail',   defense: 4, maxHp: 8,  color: '#ffdd44' },
    necromancer:  { name: 'Bone-Threaded Robe',  defense: 2, maxHp: 6,  color: '#aa44dd' },
    revenant:     { name: 'Deathshroud',         defense: 3, maxHp: 5,  color: '#ff4444' },
    hellborn:     { name: 'Infernal Husk',       defense: 3, maxHp: 6,  color: '#ff2200' },
    impregnar:    { name: 'Chitinous Shell',     defense: 3, maxHp: 6,  color: '#88ff44' },
    death_knight: { name: 'Runic Plate',         defense: 4, maxHp: 8,  color: '#aa55cc' },
  };

  // Upgrade weapon: +2 attack over base
  if (p.equipment.weapon) {
    const bonus = p.equipment.weapon.statBonus ?? {};
    p.equipment.weapon.statBonus = { ...bonus, attack: (bonus.attack ?? 0) + 2 };
    p.equipment.weapon.name = 'Fine ' + p.equipment.weapon.name;
    p.equipment.weapon.rarity = 'uncommon';
  }

  // Equip starting armor if slot is empty
  const armorDef = starterArmor[cls];
  if (armorDef && !p.equipment.armor) {
    const armor: import('./types').Item = {
      id: uid(),
      name: armorDef.name,
      type: 'armor',
      char: '[',
      color: armorDef.color,
      value: 15,
      equipSlot: 'armor',
      statBonus: { defense: armorDef.defense, maxHp: armorDef.maxHp },
      description: 'Starter Pack armor',
      rarity: 'uncommon',
    };
    p.equipment.armor = armor;
    p.stats.maxHp += armorDef.maxHp;
    p.stats.hp += armorDef.maxHp;
  }
}

// ─── Messages ───

export function addMessage(state: GameState, text: string, color = MSG_COLOR.info) {
  state.messages.push({ text, color, turn: state.turn });
  if (state.messages.length > 100) state.messages.shift();
}

// ─── FOV ───

export function updateFOV(state: GameState) {
  gpStart('engine:fov');
  const { floor, player } = state;
  const { width, height } = floor;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const row = floor.visible[y];
      if (row) row[x] = false;
    }
  }

  let viewBonus = 0;
  if (hasPassive(state, 'Arcane Sight')) viewBonus += 3;
  if (hasPassive(state, 'Keen Eye')) viewBonus += 2;
  if (hasChosenAbility(state, 'pal_aura_of_light')) viewBonus += 2;
  const viewRadius = VIEW_RADIUS + viewBonus;

  for (let angle = 0; angle < 360; angle += 2) {
    const rad = (angle * Math.PI) / 180;
    const ex = Math.round(player.pos.x + Math.cos(rad) * viewRadius);
    const ey = Math.round(player.pos.y + Math.sin(rad) * viewRadius);

    const points = linePoints(player.pos.x, player.pos.y, ex, ey);
    for (const p of points) {
      if (p.x < 0 || p.x >= width || p.y < 0 || p.y >= height) break;
      const vRow = floor.visible[p.y];
      const eRow = floor.explored[p.y];
      if (vRow) vRow[p.x] = true;
      if (eRow) eRow[p.x] = true;
      const t = getTile(floor, p.x, p.y);
      if (t === Tile.Wall || t === Tile.Void) break;
    }
  }
  gpEnd('engine:fov');
}

// ─── Combat ───

function getEffectiveStats(entity: Entity) {
  let attack = entity.stats.attack;
  let defense = entity.stats.defense;
  let speed = entity.stats.speed;
  const maxHp = entity.stats.maxHp;
  let regenBonus = 0;

  for (const item of Object.values(entity.equipment)) {
    if (item?.statBonus) {
      attack += item.statBonus.attack ?? 0;
      defense += item.statBonus.defense ?? 0;
      speed += item.statBonus.speed ?? 0;
      regenBonus += item.statBonus.hp ?? 0;
    }
  }

  return { attack, defense, maxHp, speed, regenBonus };
}

// Get player stats with boon bonuses, affliction modifiers, and room event buffs applied
function getPlayerStatsWithBoons(state: GameState) {
  const base = getEffectiveStats(state.player);
  
  // Apply boon bonuses
  const defenseBoost = getBoonBonus(state, 'defense_boost');
  
  // Apply affliction stat modifiers
  const afflictionMods = getAfflictionStatModifiers(state);
  
  // Apply room event buff modifiers
  const roomEventMods = getRoomEventStatModifiers(state);
  
  return {
    attack: base.attack + (afflictionMods.attack ?? 0) + (roomEventMods.attack ?? 0),
    defense: base.defense + defenseBoost + (afflictionMods.defense ?? 0) + (roomEventMods.defense ?? 0),
    maxHp: base.maxHp + (afflictionMods.maxHp ?? 0) + (roomEventMods.maxHp ?? 0),
    speed: base.speed + (afflictionMods.speed ?? 0) + (roomEventMods.speed ?? 0),
    regenBonus: base.regenBonus,
  };
}

// Calculate damage multiplier from boons
function getBoonDamageMultiplier(state: GameState): number {
  const damageBoost = getBoonBonus(state, 'damage_boost');
  return 1 + (damageBoost / 100);
}

// Check for evasion from boons
function checkBoonEvasion(state: GameState): boolean {
  const evasion = getBoonBonus(state, 'evasion');
  if (evasion > 0 && Math.random() * 100 < evasion) {
    return true;
  }
  return false;
}

// Apply lifesteal from boons
function applyBoonLifesteal(state: GameState, damage: number): number {
  const lifesteal = getBoonBonus(state, 'lifesteal');
  if (lifesteal > 0) {
    const heal = Math.floor(damage * lifesteal / 100);
    if (heal > 0) {
      state.player.stats.hp = Math.min(state.player.stats.maxHp, state.player.stats.hp + heal);
      return heal;
    }
  }
  return 0;
}

// Apply thorns damage from boons
function applyBoonThorns(state: GameState, attacker: Entity): number {
  const thorns = getBoonBonus(state, 'thorns');
  if (thorns > 0 && !attacker.isPlayer) {
    attacker.stats.hp -= thorns;
    return thorns;
  }
  return 0;
}

export function getPlayerEffectiveStats(state: GameState) {
  return getPlayerStatsWithBoons(state);
}

export function attackEntity(state: GameState, attacker: Entity, defender: Entity) {
  const legExt = state as GameState & LegacyAbilityState;

  // ── Legacy Gear defensive abilities ──
  if (defender.isPlayer) {
    // Warrior — Divine Wall: block all damage for 3 turns (check first — highest priority)
    if ((legExt._legacyWallTurns ?? 0) > 0) {
      addMessage(state, `\u{1F6E1}\uFE0F Divine Wall blocks ${attacker.name}'s attack!`, '#e0b0ff');
      return;
    }
    // Warrior — Judgment: reflect next hit back for 2x damage
    if (legExt._legacyReflect && hasLegacyAbility(state, 'legacy_warrior_reflect')) {
      legExt._legacyReflect = false;
      legExt._legacyReflectCD = 80;
      const reflectDmg = Math.max(1, Math.floor(getEffectiveStats(attacker).attack * 2));
      attacker.stats.hp -= reflectDmg;
      addMessage(state, `\u2694\uFE0F Judgment reflects ${reflectDmg} damage back at ${attacker.name}!`, '#e0b0ff');
      if (attacker.stats.hp <= 0) {
        attacker.isDead = true;
        addMessage(state, `${attacker.name} is slain by Judgment!`, '#e0b0ff');
        state.score += attacker.xp;
        state.runStats.kills++;
        const _rn = attacker.baseName ?? attacker.name; state.runStats.monsterKills[_rn] = (state.runStats.monsterKills[_rn] ?? 0) + 1;
        gainXP(state, attacker.xp);
      }
      return;
    }
    // Rogue — Vanish: enemies cannot target you for 3 turns
    if ((legExt._legacyVanishTurns ?? 0) > 0) {
      addMessage(state, `\u{1F47B} Vanish! ${attacker.name} can't find you!`, '#e0b0ff');
      return;
    }
    // Warrior — Holy Block: absorb one hit completely (60 turn cooldown)
    // Only triggers on hits that would deal 3+ damage to avoid wasting on weak attacks
    if (hasLegacyAbility(state, 'legacy_warrior_block') && (legExt._legacyBlockCD ?? 0) <= 0) {
      const previewDmg = Math.max(1, getEffectiveStats(attacker).attack - Math.floor(getEffectiveStats(defender).defense * 0.6));
      if (previewDmg >= 3) {
        legExt._legacyBlockCD = 60;
        addMessage(state, `\u{1F6E1}\uFE0F Holy Block absorbs ${attacker.name}'s attack!`, '#e0b0ff');
        return;
      }
    }
    // Impregnar — Nausea Aura: adjacent enemies 15% miss
    if (state.playerClass === 'impregnar' && hasPassive(state, 'Nausea Aura') && Math.random() < 0.15) {
      addMessage(state, `${attacker.name} retches and misses! *hurk*`, '#88ff44');
      return;
    }
    // Rogue — Shadow Dodge: 25% dodge chance while active
    if ((legExt._legacyDodgeTurns ?? 0) > 0 && Math.random() < 0.25) {
      addMessage(state, `\u{1F4A8} Shadow Dodge! You evade ${attacker.name}'s attack!`, '#e0b0ff');
      return;
    }
    // Mage — Mana Barrier: absorb next N damage taken
    if ((legExt._legacyBarrier ?? 0) > 0) {
      const aStats = getEffectiveStats(attacker);
      const dStats = getEffectiveStats(defender);
      const rawDmg = Math.max(1, aStats.attack - Math.floor(dStats.defense * 0.6));
      const absorbed = Math.min(rawDmg, legExt._legacyBarrier!);
      legExt._legacyBarrier! -= absorbed;
      if (legExt._legacyBarrier! <= 0) {
        legExt._legacyBarrier = 0;
        addMessage(state, `\u{1F52E} Mana Barrier shatters after absorbing ${absorbed} damage!`, '#e0b0ff');
      } else {
        addMessage(state, `\u{1F52E} Mana Barrier absorbs ${absorbed} damage! (${legExt._legacyBarrier} left)`, '#e0b0ff');
      }
      if (absorbed >= rawDmg) return; // fully absorbed
    }
  }

  // Monster dodge ability — non-boss monsters can dodge player attacks
  if (!defender.isPlayer && !defender.isBoss && defender.abilities) {
    const dodgeAbility = defender.abilities.find(a => a.type === 'dodge') as Extract<MonsterAbility, { type: 'dodge' }> | undefined;
    if (dodgeAbility && Math.random() < dodgeAbility.chance) {
      addMessage(state, `${defender.name} dodges your attack!`, MSG_COLOR.info);
      return;
    }
  }

  // Speed-based dodge — fast players have a natural dodge chance against slower enemies
  if (defender.isPlayer && !attacker.isPlayer) {
    const adrenalineBonus = hasChosenAbility(state, 'shared_quick') && defender.stats.hp / defender.stats.maxHp < 0.4 ? 5 : 0;
    const defSpeed = getEffectiveStats(defender).speed + adrenalineBonus;
    const atkSpeed = attacker.stats.speed;
    const speedAdv = defSpeed - atkSpeed;
    // Each point of speed advantage gives 1.5% dodge, capped at 25%
    if (speedAdv > 0) {
      const dodgeChance = Math.min(0.25, speedAdv * 0.015);
      if (Math.random() < dodgeChance) {
        addMessage(state, 'You deftly sidestep the attack!', MSG_COLOR.info);
        return;
      }
    }
    // Athletics skill — +1% dodge per point above 10
    if (state.skills) {
      const athBonus = state.skills.athletics - 10;
      if (athBonus > 0 && Math.random() < athBonus * 0.01) {
        addMessage(state, 'Athletic reflexes! You dodge the attack!', '#44ccff');
        return;
      }
    }
  }

  // Mana Shield — mage can negate incoming damage
  if (defender.isPlayer && hasPassive(state, 'Mana Shield') && Math.random() < 0.15) {
    addMessage(state, `Mana Shield absorbs ${attacker.name}'s attack!`, MSG_COLOR.system);
    return;
  }

  // Holy Aegis — paladin 20% chance to negate dark damage completely
  if (defender.isPlayer && hasPassive(state, 'Holy Aegis') && attacker.element === 'dark' && Math.random() < 0.2) {
    addMessage(state, `Holy Aegis deflects ${attacker.name}'s dark attack!`, '#ffd700');
    return;
  }

  // Divine Shield — paladin ability: 20% chance to fully negate any hit
  if (defender.isPlayer && hasChosenAbility(state, 'pal_divine_shield') && Math.random() < 0.2) {
    addMessage(state, `Divine Shield blocks ${attacker.name}'s attack!`, '#ffcc66');
    return;
  }

  // Boon evasion — character boons can grant dodge chance
  if (defender.isPlayer && checkBoonEvasion(state)) {
    addMessage(state, 'Boon of Evasion! You dodge the attack!', '#ffaa33');
    return;
  }

  const aStats = attacker.isPlayer ? getPlayerStatsWithBoons(state) : getEffectiveStats(attacker);
  const dStats = defender.isPlayer ? getPlayerStatsWithBoons(state) : getEffectiveStats(defender);

  // ── Legacy Ranger — Piercing Shot: next hit ignores 50% of enemy defense ──
  let defenseForCalc = dStats.defense;
  if (attacker.isPlayer && legExt._legacyPierce && hasLegacyAbility(state, 'legacy_ranger_pierce')) {
    legExt._legacyPierce = false;
    legExt._legacyPierceCD = 30;
    defenseForCalc = Math.floor(defenseForCalc * 0.5);
    addMessage(state, '\u{1F3AF} Piercing Shot tears through armor!', '#e0b0ff');
  }

  let baseDmg = Math.max(1, aStats.attack - Math.floor(defenseForCalc * 0.6));

  // ── Legacy Rogue — Fatal Strike: guaranteed critical (triple damage) ──
  if (attacker.isPlayer && legExt._legacyCrit && hasLegacyAbility(state, 'legacy_rogue_crit')) {
    legExt._legacyCrit = false;
    legExt._legacyCritCD = 50;
    baseDmg *= 3;
    addMessage(state, '\u{1F5E1}\uFE0F Fatal Strike! CRITICAL!', '#e0b0ff');
  }

  // Berserker — warrior deals +50% when below 30% HP
  if (attacker.isPlayer && hasPassive(state, 'Berserker') && attacker.stats.hp / attacker.stats.maxHp < 0.3) {
    baseDmg = Math.floor(baseDmg * 1.5);
    addMessage(state, 'Berserker rage!', '#ff6644');
  }

  // Deathless Fury — revenant deals +100% when below 20% HP
  if (attacker.isPlayer && hasPassive(state, 'Deathless Fury') && attacker.stats.hp / attacker.stats.maxHp < 0.2) {
    baseDmg *= 2;
    addMessage(state, 'Deathless Fury!', '#ff4444');
  }

  // Backstab — rogue 25% chance for double damage
  if (attacker.isPlayer && hasPassive(state, 'Backstab') && Math.random() < 0.25) {
    baseDmg *= 2;
    addMessage(state, 'Backstab!', '#ffcc33');
  }

  // Smite Evil — paladin deals +40% to dark-type enemies
  if (attacker.isPlayer && hasPassive(state, 'Smite Evil') && defender.element === 'dark') {
    baseDmg = Math.floor(baseDmg * 1.4);
    addMessage(state, 'Smite Evil!', '#ffd700');
  }

  // Spell Strike — mage 20% chance for +5 bonus magic damage (Overcharge upgrades to +8)
  // Archmage capstone: triggers every hit
  if (attacker.isPlayer && hasPassive(state, 'Spell Strike')) {
    const alwaysStrike = hasActiveModifier(state, 'mage_always_spell_strike');
    if (alwaysStrike || Math.random() < 0.2) {
      let spellDmg = hasChosenAbility(state, 'mag_overcharge') ? 8 : 5;
      if (hasActiveModifier(state, 'mage_spell_damage_boost')) spellDmg = Math.floor(spellDmg * 1.3);
      baseDmg += spellDmg;
      addMessage(state, alwaysStrike ? 'Archmage Spell Strike!' : (hasChosenAbility(state, 'mag_overcharge') ? 'Overcharged Spell Strike!' : 'Spell Strike!'), '#8855ff');
    }
  }

  // ── Chosen ability combat effects (attacker) ──
  if (attacker.isPlayer) {
    // Rogue — Critical Hit: 15% chance for triple damage (4x with capstone, heals 8 HP)
    if (hasChosenAbility(state, 'rog_critical_hit') && Math.random() < 0.15) {
      const critMult = hasActiveModifier(state, 'rogue_crit_4x') ? 4 : 3;
      baseDmg *= critMult;
      addMessage(state, hasActiveModifier(state, 'rogue_crit_4x') ? 'Death\'s Embrace — CRITICAL!' : 'Critical Hit!', '#ff2222');
      if (hasActiveModifier(state, 'rogue_crit_heal')) {
        const healAmt = Math.min(8, attacker.stats.maxHp - attacker.stats.hp);
        if (healAmt > 0) { attacker.stats.hp += healAmt; addMessage(state, `Crit heal! +${healAmt} HP`, '#44dd77'); }
      }
    }
    // Mage — Fireball: 15% chance for +6 fire damage
    if (hasChosenAbility(state, 'mag_fireball') && Math.random() < 0.15) {
      baseDmg += 6;
      addMessage(state, 'Fireball!', '#ff6622');
    }
    // Ranger — Mark Prey: +30% damage to the last monster that hit you
    if (hasChosenAbility(state, 'rng_mark_prey') && (state as GameState & { _lastAttackerId?: string })._lastAttackerId === defender.id) {
      baseDmg = Math.floor(baseDmg * 1.3);
      addMessage(state, 'Marked prey!', '#ff8844');
    }
    // Ranger — Hunter's Mark: double damage to marked target, consume a hit
    if (state.playerClass === 'ranger') {
      const markExt = state as GameState & { _markTargetId?: string; _markHits?: number; _markCooldown?: number };
      if ((markExt._markHits ?? 0) > 0 && markExt._markTargetId === defender.id) {
        baseDmg *= 2;
        markExt._markHits = (markExt._markHits ?? 0) - 1;
        addMessage(state, `Hunter's Mark! Double damage! (${markExt._markHits} hits left)`, '#ffaa00');
        if (markExt._markHits <= 0) {
          markExt._markTargetId = undefined;
          markExt._markCooldown = 5;
        }
      }
    }
    // Ranger — Hunter's Focus: +25% damage to bosses
    if (hasChosenAbility(state, 'rng_hunters_focus') && defender.isBoss) {
      baseDmg = Math.floor(baseDmg * 1.25);
      addMessage(state, "Hunter's Focus!", '#ff5544');
    }
    // Rogue — Exploit Weakness: +50% damage to poisoned or bleeding enemies
    if (hasChosenAbility(state, 'rog_exploit') && defender.statusEffects?.some(e => e.type === 'poison' || e.type === 'bleed')) {
      baseDmg = Math.floor(baseDmg * 1.5);
      addMessage(state, 'Exploit Weakness!', '#cc3355');
    }
    // Rogue Trickster capstone — extra +50% to any debuffed enemy
    if (hasActiveModifier(state, 'rogue_debuff_bonus') && defender.statusEffects?.some(e => e.type === 'poison' || e.type === 'bleed' || e.type === 'stun' || e.type === 'freeze')) {
      baseDmg = Math.floor(baseDmg * 1.5);
      addMessage(state, 'Master Poisoner!', '#33cc22');
    }
    // Ranger Marksman capstone — 20% chance for triple damage
    if (hasActiveModifier(state, 'ranger_triple_shot') && Math.random() < 0.2) {
      baseDmg *= 3;
      addMessage(state, 'Eagle Eye — triple damage!', '#ff6600');
    }
    // Revenant Berserker capstone — +200% damage below 20% HP, immune to stun/freeze
    if (hasActiveModifier(state, 'revenant_deathless_fury') && attacker.stats.hp / attacker.stats.maxHp <= 0.2) {
      baseDmg = Math.floor(baseDmg * 3);
      addMessage(state, 'DEATHLESS FURY!', '#ff0000');
    }
    // Revenant — Blood Rage: +2 attack for every 10% HP missing
    if (hasChosenAbility(state, 'rev_blood_rage')) {
      const missingPct = 1 - (attacker.stats.hp / attacker.stats.maxHp);
      const bonusAtk = Math.floor(missingPct * 10) * 2;
      if (bonusAtk > 0) {
        baseDmg += bonusAtk;
      }
    }
    // Revenant — Vengeful: double damage on the turn right after being hit
    if (hasChosenAbility(state, 'rev_vengeful') && (state as GameState & { _wasHitLastTurn?: boolean })._wasHitLastTurn) {
      baseDmg *= 2;
      addMessage(state, 'Vengeful strike!', '#ff3333');
    }
    // Paladin Righteous Fury — stacking +10% damage per kill for 5 turns
    const furyExt = state as GameState & { _furyStacks?: number; _furyTurnsLeft?: number };
    if (hasChosenAbility(state, 'pal_righteous_fury') && (furyExt._furyStacks ?? 0) > 0 && (furyExt._furyTurnsLeft ?? 0) > 0) {
      baseDmg = Math.floor(baseDmg * (1 + furyExt._furyStacks! * 0.1));
    }
    // Shared — Opportunist: +40% damage to stunned or frozen enemies
    if (hasChosenAbility(state, 'shared_sharp') && defender.statusEffects?.some(e => e.type === 'stun' || e.type === 'freeze')) {
      baseDmg = Math.floor(baseDmg * 1.4);
      addMessage(state, 'Opportunist!', '#ff8844');
    }
    // Paladin — Holy Smite: +50% damage to dark & undead enemies
    if (hasChosenAbility(state, 'pal_holy_smite') && defender.element === 'dark') {
      baseDmg = Math.floor(baseDmg * 1.5);
      addMessage(state, 'Holy Smite!', '#ffdd44');
    }
  }

  // ── Chosen ability defender effects ──
  if (defender.isPlayer) {
    // Rogue — Dodge: 15% chance to avoid all damage (40% with Living Shadow capstone + heal)
    if (hasChosenAbility(state, 'rog_dodge')) {
      const dodgeChance = hasActiveModifier(state, 'rogue_super_dodge') ? 0.4 : 0.15;
      if (Math.random() < dodgeChance) {
        addMessage(state, hasActiveModifier(state, 'rogue_super_dodge') ? 'Living Shadow!' : 'You dodge the attack!', '#ffcc33');
        if (hasActiveModifier(state, 'rogue_dodge_heal')) {
          const healAmt = Math.min(3, defender.stats.maxHp - defender.stats.hp);
          if (healAmt > 0) { defender.stats.hp += healAmt; addMessage(state, `Dodge heal! +${healAmt} HP`, '#44dd77'); }
        }
        return;
      }
    }
    // Rogue — Vanish: when below 20% HP, 30% chance enemies miss
    if (hasChosenAbility(state, 'rog_vanish') && defender.stats.hp / defender.stats.maxHp < 0.2 && Math.random() < 0.3) {
      addMessage(state, 'You vanish into shadow!', '#aabbcc');
      return;
    }
    // Warrior — Intimidate: enemies near you deal 15% less damage
    if (hasChosenAbility(state, 'war_intimidate')) {
      baseDmg = Math.floor(baseDmg * 0.85);
    }
    // Paladin — Martyrdom: when hit below 25% HP, deal 8 damage back to attacker
    if (hasChosenAbility(state, 'pal_martyrdom') && defender.stats.hp / defender.stats.maxHp < 0.25) {
      attacker.stats.hp -= 8;
      addMessage(state, `Martyrdom burns ${attacker.name} for 8 damage!`, '#ffd700');
      if (attacker.stats.hp <= 0) {
        attacker.isDead = true;
        addMessage(state, `${attacker.name} is slain by Martyrdom!`, '#ffd700');
        state.score += attacker.xp;
        state.runStats.kills++;
        const _akn = attacker.baseName ?? attacker.name; state.runStats.monsterKills[_akn] = (state.runStats.monsterKills[_akn] ?? 0) + 1;
        gainXP(state, attacker.xp);
      }
    }
  }

  // Monster charge attack — bonus damage on hit
  if (!attacker.isPlayer && attacker.abilities) {
    const charge = attacker.abilities.find(a => a.type === 'chargeAttack') as Extract<MonsterAbility, { type: 'chargeAttack' }> | undefined;
    if (charge && Math.random() < charge.chance) {
      baseDmg = Math.floor(baseDmg * charge.multiplier);
      addMessage(state, `${attacker.name} charges with a powerful attack!`, MSG_COLOR.bad);
    }
  }

  // Monster enrage — permanent attack boost at low HP (damage modifier)
  if (!attacker.isPlayer && attacker.abilities && !attacker.isMonsterEnraged) {
    const enrageAbility = attacker.abilities.find(a => a.type === 'enrage') as Extract<MonsterAbility, { type: 'enrage' }> | undefined;
    if (enrageAbility && attacker.stats.hp / attacker.stats.maxHp <= enrageAbility.hpThreshold) {
      attacker.isMonsterEnraged = true;
      attacker.stats.attack = Math.floor(attacker.stats.attack * enrageAbility.atkMultiplier);
      addMessage(state, `${attacker.name} becomes enraged!`, MSG_COLOR.boss);
      // Recalculate damage with the new attack stat
      const newAStats = getEffectiveStats(attacker);
      baseDmg = Math.max(1, newAStats.attack - Math.floor(dStats.defense * 0.6));
    }
  }

  const variance = Math.max(1, Math.floor(baseDmg * 0.3));
  let dmg = clamp(baseDmg + Math.floor(Math.random() * variance * 2) - variance, 1, 999);

  // ── Boon damage boost ──
  if (attacker.isPlayer) {
    const boonMult = getBoonDamageMultiplier(state);
    if (boonMult > 1) {
      dmg = Math.floor(dmg * boonMult);
    }
    
    // First strike bonus (extra damage on first attack each combat)
    const firstStrike = getBoonBonus(state, 'first_strike');
    const fsExt = state as GameState & { _firstStrikeUsed?: boolean };
    if (firstStrike > 0 && !fsExt._firstStrikeUsed) {
      dmg += firstStrike;
      fsExt._firstStrikeUsed = true;
      addMessage(state, `First Strike! +${firstStrike} damage!`, '#ffaa33');
    }
    // Stealth skill — +3% damage per point above 10 on first hit against each monster
    if (state.skills && (defender as Entity & { _stealthHit?: boolean })._stealthHit !== true) {
      const stealthBonus = state.skills.stealth - 10;
      if (stealthBonus > 0) {
        const mult = 1 + stealthBonus * 0.03;
        dmg = Math.floor(dmg * mult);
        addMessage(state, 'Sneak attack!', '#aabbcc');
      }
      (defender as Entity & { _stealthHit?: boolean })._stealthHit = true;
    }
  }

  // ── Skill tree weapon proficiency bonus ──
  if (attacker.isPlayer) {
    const wpBonus = getWeaponProfBonus(state);
    if (wpBonus > 0) {
      dmg = Math.max(1, Math.floor(dmg * (1 + wpBonus / 100)));
    }
    // ── Skill tree enemy type bonus ──
    if (!defender.isPlayer) {
      const etBonus = getEnemyTypeBonus(state, defender.baseName ?? defender.name, defender.isBoss);
      if (etBonus > 0) {
        dmg = Math.max(1, Math.floor(dmg * (1 + etBonus / 100)));
      }
    }
  }

  // ── Elemental damage modifier ──
  const atkElement = getAttackElement(attacker);
  const defElement = getDefenseElement(defender);
  const elementMult = getElementalMultiplier(atkElement, defElement);
  if (elementMult !== 1.0 && atkElement && defElement) {
    dmg = Math.max(1, Math.floor(dmg * elementMult));
    const msg = getElementalMessage(atkElement, defElement);
    if (msg) {
      const color = elementMult > 1 ? ELEMENT_INFO[atkElement].color : '#888888';
      addMessage(state, msg, color);
    }
  }

  // ── Zone element affinity ──
  if (attacker.isPlayer && atkElement) {
    const zoneDef = getZoneDef(state.zone);
    if (zoneDef.element) {
      const zoneWeakness = getElementalMultiplier(atkElement, zoneDef.element);
      if (zoneWeakness === 1.5) {
        dmg = Math.max(1, Math.floor(dmg * 1.1));
        addMessage(state, `Your ${ELEMENT_INFO[atkElement].name} thrives in ${zoneDef.name}!`, ELEMENT_INFO[atkElement].color);
      } else if (zoneWeakness === 0.75) {
        dmg = Math.max(1, Math.floor(dmg * 0.9));
        addMessage(state, `Your ${ELEMENT_INFO[atkElement].name} weakens in ${zoneDef.name}...`, '#888888');
      }
    }
  }

  // ── Terrain combat modifiers ──
  const defenderTerrain = getTerrainAt(state.floor, defender.pos.x, defender.pos.y);
  const attackerTerrain = getTerrainAt(state.floor, attacker.pos.x, attacker.pos.y);

  // Lava amplifies fire damage — attacker on lava gets +40% damage with fire weapons, +20% base
  if (attackerTerrain === 'lava') {
    const hasFireWeapon = attacker.equipment?.weapon?.onHitEffect?.type === 'fireball';
    if (hasFireWeapon) {
      dmg = Math.floor(dmg * 1.4);
      addMessage(state, 'Lava empowers your fire attack!', '#ff5511');
    } else {
      dmg = Math.floor(dmg * 1.2);
    }
  }

  // Poison amplifies toxic damage — attacker on poison gets +40% damage with poison weapons, +20% base
  if (attackerTerrain === 'poison') {
    const hasPoisonWeapon = attacker.equipment?.weapon?.onHitEffect?.type === 'poison';
    if (hasPoisonWeapon) {
      dmg = Math.floor(dmg * 1.4);
      addMessage(state, 'Toxic fumes amplify your poisonous strike!', '#44cc22');
    } else {
      dmg = Math.floor(dmg * 1.2);
    }
  }

  // Water amplifies electric/magic attacks — Spell Strike and Thunderbrand benefit
  if (defenderTerrain === 'water') {
    const weaponEffect = attacker.equipment?.weapon?.onHitEffect;
    if (weaponEffect && weaponEffect.type === 'stun') {
      // Electric weapon on water = 2x damage
      dmg = Math.floor(dmg * 2);
      addMessage(state, 'Electricity surges through the water!', '#ffff33');
    } else if (attacker.isPlayer && hasPassive(state, 'Spell Strike')) {
      dmg = Math.floor(dmg * 1.3);
    }
  }

  // Ice makes it hard to dodge — bonus damage
  if (defenderTerrain === 'ice') {
    dmg = Math.floor(dmg * 1.2);
  }

  // Tall grass gives defenders a dodge chance
  if (defenderTerrain === 'tall_grass' && !defender.isPlayer) {
    if (Math.random() < 0.25) {
      addMessage(state, `${defender.name} hides in the tall grass and dodges!`, '#55aa33');
      return;
    }
  }
  // Player also gets dodge bonus in tall grass
  if (defenderTerrain === 'tall_grass' && defender.isPlayer) {
    if (Math.random() < 0.2) {
      addMessage(state, 'You dodge behind the tall grass!', '#55aa33');
      return;
    }
  }

  // Shadow terrain — attacker in shadow gets +30% damage (stealth bonus)
  if (attackerTerrain === 'shadow') {
    dmg = Math.floor(dmg * 1.3);
  }

  // Holy ground — weakens undead-type attackers (Skeleton, Zombie, Wraith, Vampire, Lich)
  const undeadNames = ['Skeleton', 'Zombie', 'Wraith', 'Vampire', 'Vampire Lord', 'Lich Emperor'];
  if (attackerTerrain === 'holy' && undeadNames.includes(attacker.name)) {
    dmg = Math.floor(dmg * 0.5);
    addMessage(state, `${attacker.name} is weakened by holy ground!`, '#ffdd66');
  }

  // Mud slows — reduce defender's effective speed (makes them easier to hit)
  // Represented as a small damage bonus
  if (defenderTerrain === 'mud') {
    dmg = Math.floor(dmg * 1.1);
  }

  // Frozen terrain — defender takes +15% damage, slowed
  if (defenderTerrain === 'frozen') {
    dmg = Math.floor(dmg * 1.15);
  }

  // Crystal terrain — amplifies magic attacks (+25% for mage/magic weapons)
  if (attackerTerrain === 'crystal' || defenderTerrain === 'crystal') {
    const hasMagicWeapon = attacker.equipment?.weapon?.onHitEffect?.type === 'fireball';
    if (hasMagicWeapon || (attacker.isPlayer && hasPassive(state, 'Spell Strike'))) {
      dmg = Math.floor(dmg * 1.25);
    }
  }

  // Void rift — attacker on void rift deals +50% damage
  if (attackerTerrain === 'void_rift') {
    dmg = Math.floor(dmg * 1.5);
  }

  // Brimstone — attacker on brimstone gets +50% fire weapon damage, +25% base
  if (attackerTerrain === 'brimstone') {
    const hasFireWeapon = attacker.equipment?.weapon?.onHitEffect?.type === 'fireball';
    if (hasFireWeapon) {
      dmg = Math.floor(dmg * 1.5);
      addMessage(state, 'Brimstone fuels your fire attack!', '#ff8833');
    } else {
      dmg = Math.floor(dmg * 1.25);
    }
  }

  // Spore cloud — attacker on spore gets +35% poison weapon damage, +15% base
  if (attackerTerrain === 'spore') {
    const hasPoisonWeapon = attacker.equipment?.weapon?.onHitEffect?.type === 'poison';
    if (hasPoisonWeapon) {
      dmg = Math.floor(dmg * 1.35);
      addMessage(state, 'Spores amplify your toxic strike!', '#88cc44');
    } else {
      dmg = Math.floor(dmg * 1.15);
    }
  }

  // Shield Wall — warrior passively takes 30% less damage at all times
  if (defender.isPlayer && hasChosenAbility(state, 'war_shield_wall')) {
    dmg = Math.max(1, Math.floor(dmg * 0.7));
    addMessage(state, 'Shield Wall!', '#4488ff');
  }

  // Ranger — Trap Sense: take 25% less damage when on hazardous terrain
  if (defender.isPlayer && hasChosenAbility(state, 'rng_trap_sense') && defenderTerrain) {
    const hazardous = ['lava', 'poison', 'ice', 'mud', 'frozen', 'shadow', 'void_rift', 'brimstone', 'spore'];
    if (hazardous.includes(defenderTerrain)) {
      dmg = Math.max(1, Math.floor(dmg * 0.75));
      addMessage(state, 'Trap Sense!', '#33cc66');
    }
  }

  // Thick Skin — warrior takes 1 less damage
  if (defender.isPlayer && hasPassive(state, 'Thick Skin')) {
    dmg = Math.max(1, dmg - 1);
  }

  // Paladin Sacred Vow — if active, negate damage entirely
  if (defender.isPlayer && state.playerClass === 'paladin') {
    const vowActiveExt = state as GameState & { _vowActive?: boolean };
    if (vowActiveExt._vowActive) {
      vowActiveExt._vowActive = false;
      addMessage(state, 'Sacred Vow negates the damage!', '#ffd700');
      dmg = 0;
    }
  }

  // Guardian / Lich / Revenant capstone — cap incoming damage at 10
  if (defender.isPlayer && hasActiveModifier(state, 'damage_cap_10') && dmg > 10) {
    dmg = 10;
  }
  // Paladin Templar capstone — Avatar of Light: cap incoming damage at 8
  if (defender.isPlayer && hasActiveModifier(state, 'paladin_damage_cap_8') && dmg > 8) {
    dmg = 8;
  }

  defender.stats.hp -= dmg;

  // Telepathic link damage share — when player attacks faction creatures, player feels their pain
  if (attacker.isPlayer && !defender.isPlayer && dmg > 0 && defender.factionId) {
    const telepathicLink = getTelepathicLink(state);
    if (telepathicLink && telepathicLink.factionId === defender.factionId) {
      const sharedDamage = Math.floor(dmg * telepathicLink.damageShare);
      if (sharedDamage > 0) {
        state.player.stats.hp -= sharedDamage;
        addMessage(state, `You feel their pain... (-${sharedDamage} HP)`, '#ff88ff');
        
        // Check if this kills the player
        if (state.player.stats.hp <= 0) {
          state.player.isDead = true;
          addMessage(state, 'The telepathic feedback is too much! You die!', '#ff4444');
          state.gameOver = true;
          return;
        }
      }
    }
  }

  // Boon thorns — reflect damage when player is hit
  if (defender.isPlayer && dmg > 0) {
    const thornsReflect = applyBoonThorns(state, attacker);
    if (thornsReflect > 0) {
      addMessage(state, `Thorns reflects ${thornsReflect} damage!`, '#ffaa33');
      if (attacker.stats.hp <= 0) {
        attacker.isDead = true;
        addMessage(state, `${attacker.name} dies from thorns!`, MSG_COLOR.good);
        state.runStats.kills++;
      }
    }
  }

  // Track run stats
  if (attacker.isPlayer) {
    state.runStats.damageDealt += dmg;
    addMessage(state, `You hit ${defender.name} for ${dmg} damage!`, MSG_COLOR.good);
    
    // Boon lifesteal — heal from damage dealt
    const lifestealHeal = applyBoonLifesteal(state, dmg);
    if (lifestealHeal > 0) {
      addMessage(state, `Lifesteal +${lifestealHeal} HP!`, '#ffaa33');
    }

    // Death Knight — Death's Embrace: 10% lifesteal on melee attacks
    if (attacker.isPlayer && hasPassive(state, "Death's Embrace") && dmg > 0) {
      const dkHeal = Math.max(1, Math.floor(dmg * 0.1));
      const dkActual = Math.min(dkHeal, attacker.stats.maxHp - attacker.stats.hp);
      if (dkActual > 0) {
        attacker.stats.hp += dkActual;
        addMessage(state, `Death's Embrace +${dkActual} HP`, '#aa55cc');
      }
    }

    // ── Legacy Hellborn — Soul Siphon: lifesteal 20% of damage dealt ──
    if ((legExt._legacyDrainTurns ?? 0) > 0 && dmg > 0) {
      const healAmt = Math.max(1, Math.floor(dmg * 0.2));
      const actual = Math.min(healAmt, attacker.stats.maxHp - attacker.stats.hp);
      if (actual > 0) {
        attacker.stats.hp += actual;
        addMessage(state, `\u{1F9DB} Soul Siphon drains +${actual} HP!`, '#e0b0ff');
      }
    }

    // ── Legacy Ranger — Multi-Shot: hit a second nearby enemy ──
    if (hasLegacyAbility(state, 'legacy_ranger_multi') && (legExt._legacyMultiCD ?? 0) <= 0) {
      const secondTarget = state.monsters.find(m => !m.isDead && m.id !== defender.id && manhattan(m.pos, attacker.pos) <= 3);
      if (secondTarget) {
        legExt._legacyMultiCD = 25;
        const extraDmg = Math.max(1, Math.floor(dmg * 0.7));
        secondTarget.stats.hp -= extraDmg;
        addMessage(state, `\u{1F3F9} Multi-Shot hits ${secondTarget.name} for ${extraDmg}!`, '#e0b0ff');
        if (secondTarget.stats.hp <= 0) {
          secondTarget.isDead = true;
          addMessage(state, `${secondTarget.name} is slain by Multi-Shot!`, '#e0b0ff');
          state.score += secondTarget.xp;
          state.runStats.kills++;
          const _msn = secondTarget.baseName ?? secondTarget.name; state.runStats.monsterKills[_msn] = (state.runStats.monsterKills[_msn] ?? 0) + 1;
          gainXP(state, secondTarget.xp);
        }
      }
    }

    // ── Chosen ability on-hit effects ──
    if (defender.stats.hp > 0) {
      if (!defender.statusEffects) defender.statusEffects = [];

      // Warrior — Heavy Blow: 20% chance to stun
      if (hasChosenAbility(state, 'war_heavy_blow') && Math.random() < 0.2) {
        if (!defender.statusEffects.some(e => e.type === 'stun')) {
          defender.statusEffects.push({ type: 'stun', turnsRemaining: 1 });
          addMessage(state, 'Heavy Blow stuns the enemy!', '#ff5544');
        }
      }
      // Rogue — Poison Blade: 20% chance to poison
      if (hasChosenAbility(state, 'rog_poison_blade') && Math.random() < 0.2) {
        if (!defender.statusEffects.some(e => e.type === 'poison')) {
          defender.statusEffects.push({ type: 'poison', turnsRemaining: 2, damage: 2 });
          addMessage(state, 'Poison blade!', '#55cc22');
        }
      }
      // Rogue — Deep Wound: 25% chance to bleed
      if (hasChosenAbility(state, 'rog_bleed') && Math.random() < 0.25) {
        if (!defender.statusEffects.some(e => e.type === 'bleed')) {
          defender.statusEffects.push({ type: 'bleed', turnsRemaining: 3, damage: 2 });
          addMessage(state, 'Deep Wound!', '#ff4444');
        }
      }
      // Revenant — Death Strike: 10% chance to instantly kill non-bosses (20% with capstone)
      if (hasChosenAbility(state, 'rev_death_strike') && !defender.isBoss) {
        const execChance = hasActiveModifier(state, 'revenant_mega_execute') ? 0.2 : 0.1;
        if (Math.random() < execChance) {
          defender.stats.hp = 0;
          addMessage(state, `Death Strike! ${defender.name} is obliterated!`, '#cc0000');
        }
      }
      // Rogue Assassin — execute enemies below 20% HP
      if (hasActiveModifier(state, 'rogue_execute') && !defender.isBoss && defender.stats.hp > 0) {
        if (defender.stats.hp / defender.stats.maxHp <= 0.2 && Math.random() < 0.15) {
          defender.stats.hp = 0;
          addMessage(state, `Killing Blow! ${defender.name} executed!`, '#cc0000');
        }
      }
      // Rogue Trickster capstone — always poison and bleed
      if (hasActiveModifier(state, 'rogue_always_poison') && defender.stats.hp > 0) {
        if (!defender.statusEffects.some(e => e.type === 'poison')) {
          defender.statusEffects.push({ type: 'poison', turnsRemaining: 3, damage: 2 });
        }
      }
      if (hasActiveModifier(state, 'rogue_always_bleed') && defender.stats.hp > 0) {
        if (!defender.statusEffects.some(e => e.type === 'bleed')) {
          defender.statusEffects.push({ type: 'bleed', turnsRemaining: 3, damage: 2 });
        }
      }
      // Paladin Crusader capstone — holy damage on every hit
      if (hasActiveModifier(state, 'paladin_holy_damage') && defender.stats.hp > 0) {
        const holyDmg = Math.max(1, Math.floor(getEffectiveStats(attacker).attack * 0.2));
        defender.stats.hp -= holyDmg;
        addMessage(state, `Holy Flame! +${holyDmg} holy damage!`, '#ffdd44');
      }
      // Mage Elementalist capstone — all attacks trigger fire/ice/lightning
      if (hasActiveModifier(state, 'mage_elemental_storm') && defender.stats.hp > 0) {
        if (Math.random() < 0.3) {
          defender.stats.hp -= 6;
          addMessage(state, `Elemental Storm — fire! -6`, '#ff6622');
        }
        if (Math.random() < 0.25) {
          if (!defender.statusEffects.some(e => e.type === 'freeze')) {
            defender.statusEffects.push({ type: 'freeze', turnsRemaining: 1 });
            addMessage(state, `Elemental Storm — freeze!`, '#88ccff');
          }
        }
        if (Math.random() < 0.2) {
          if (!defender.statusEffects.some(e => e.type === 'stun')) {
            defender.statusEffects.push({ type: 'stun', turnsRemaining: 1 });
            addMessage(state, `Elemental Storm — shocked!`, '#ffff44');
          }
        }
      }
      // Mage — Frost Touch: 20% chance to freeze
      if (hasChosenAbility(state, 'mag_frost_touch') && Math.random() < 0.2) {
        if (!defender.statusEffects.some(e => e.type === 'freeze')) {
          defender.statusEffects.push({ type: 'freeze', turnsRemaining: 1 });
          addMessage(state, 'Frost Touch!', '#88ccff');
        }
      }
      // Mage — Drain Life: heal 10% of damage dealt
      if (hasChosenAbility(state, 'mag_drain_life')) {
        const healAmt = Math.max(1, Math.floor(dmg * 0.1));
        const actual = Math.min(healAmt, attacker.stats.maxHp - attacker.stats.hp);
        if (actual > 0) {
          attacker.stats.hp += actual;
          addMessage(state, `Drain Life! +${actual} HP`, '#cc1144');
        }
      }
      // Mage — Chain Lightning: 10% chance to zap a second enemy
      if (hasChosenAbility(state, 'mag_chain_lightning') && Math.random() < 0.1) {
        const nearby = state.monsters.find(m => !m.isDead && m.id !== defender.id && manhattan(m.pos, attacker.pos) <= 2);
        if (nearby) {
          nearby.stats.hp -= 4;
          addMessage(state, `Chain Lightning zaps ${nearby.name} for 4!`, '#ffff44');
          if (nearby.stats.hp <= 0) {
            nearby.isDead = true;
            addMessage(state, `${nearby.name} is destroyed!`, MSG_COLOR.good);
            state.score += nearby.xp;
            state.runStats.kills++;
            const _nbn = nearby.baseName ?? nearby.name; state.runStats.monsterKills[_nbn] = (state.runStats.monsterKills[_nbn] ?? 0) + 1;
            gainXP(state, nearby.xp);
          }
        }
      }
      // Mage — Telekinesis: 10% chance to push enemy back 2 tiles
      if (hasChosenAbility(state, 'mag_telekinesis') && Math.random() < 0.1) {
        const dx = defender.pos.x - attacker.pos.x;
        const dy = defender.pos.y - attacker.pos.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const ndx = Math.round(dx / len);
        const ndy = Math.round(dy / len);
        let pushed = 0;
        for (let step = 0; step < 2; step++) {
          const nx = defender.pos.x + ndx;
          const ny = defender.pos.y + ndy;
          if (nx < 0 || nx >= state.floor.width || ny < 0 || ny >= state.floor.height) break;
          if (!isWalkableTile(getTile(state.floor, nx, ny))) break;
          if (state.monsters.some(m => !m.isDead && m !== defender && m.pos.x === nx && m.pos.y === ny)) break;
          defender.pos.x = nx;
          defender.pos.y = ny;
          pushed++;
        }
        if (pushed > 0) {
          addMessage(state, `Telekinesis pushes ${defender.name} back ${pushed} ${pushed === 1 ? 'tile' : 'tiles'}!`, '#9977dd');
        }
      }
      // Warrior — Cleave: 15% chance to hit a second nearby enemy
      if (hasChosenAbility(state, 'war_cleave') && Math.random() < 0.15) {
        const nearby = state.monsters.find(m => !m.isDead && m.id !== defender.id && manhattan(m.pos, attacker.pos) <= 1);
        if (nearby) {
          const cleaveDmg = Math.max(1, Math.floor(dmg * 0.5));
          nearby.stats.hp -= cleaveDmg;
          addMessage(state, `Cleave hits ${nearby.name} for ${cleaveDmg}!`, '#cc5533');
          if (nearby.stats.hp <= 0) {
            nearby.isDead = true;
            addMessage(state, `${nearby.name} is defeated!`, MSG_COLOR.good);
            state.score += nearby.xp;
            state.runStats.kills++;
            const _nbn = nearby.baseName ?? nearby.name; state.runStats.monsterKills[_nbn] = (state.runStats.monsterKills[_nbn] ?? 0) + 1;
            gainXP(state, nearby.xp);
          }
        }
      }
    }

    // Paladin — Consecrate: 15% chance to create holy terrain on hit
    if (hasChosenAbility(state, 'pal_consecrate') && Math.random() < 0.15) {
      placeTerrain(state, defender.pos.x, defender.pos.y, 'holy', 1, 3);
      addMessage(state, 'Consecrate!', '#ffee66');
    }

    // Rogue — Pickpocket: extra gold on kill
    if (hasChosenAbility(state, 'rog_steal') && defender.stats.hp <= 0) {
      const bonusGold = Math.floor(5 + state.floorNumber * 2);
      state.score += bonusGold;
      state.runStats.goldEarned += bonusGold;
      addMessage(state, `Pickpocket! +${bonusGold} gold!`, '#ffd700');
    }
  } else {
    state.runStats.damageTaken += dmg;
    if (dmg > 0) {
      addMessage(state, `${attacker.name} hits you for ${dmg} damage!`, MSG_COLOR.bad);
    }

    // Track last attacker for Mark Prey ability
    (state as GameState & { _lastAttackerId?: string })._lastAttackerId = attacker.id;
    // Track hit for Vengeful ability
    (state as GameState & { _hitThisTurn?: boolean })._hitThisTurn = true;

    // Warrior — Rage: builds +15 per hit taken, caps at 100
    // Pain Engine talent doubles gain when below 40% HP
    if (defender.isPlayer && state.playerClass === 'warrior') {
      const rageExt = state as GameState & { _rage?: number };
      const prev = rageExt._rage ?? 0;
      const isLowHp = defender.stats.hp / defender.stats.maxHp <= 0.4;
      const painEngine = hasChosenAbility(state, 'war_pain_engine');
      const rageGain = (isLowHp && painEngine) ? 30 : 15;
      rageExt._rage = Math.min(100, prev + rageGain);
      if (prev < 30 && rageExt._rage >= 30) {
        addMessage(state, 'FULL RAGE!', '#ff0000');
      }
    }

    // Generated Class — on_damage_taken resource gain
    if (defender.isPlayer && state.playerClass === 'generated' && dmg > 0) {
      const gen = getActiveGeneratedClass();
      if (gen && gen.resource.regenMethod === 'on_damage_taken') {
        const genExt = state as GameState & { _genResource?: number };
        const prev = genExt._genResource ?? gen.resource.startingAmount;
        const gained = gen.resource.regenAmount;
        genExt._genResource = Math.min(gen.resource.max, prev + gained);
        addMessage(state, `+${gained} ${gen.resource.name}!`, gen.resource.color);
      }
    }

    // Warrior — Counter Strike: 25% chance to hit back
    if (defender.isPlayer && hasChosenAbility(state, 'war_counter_strike') && Math.random() < 0.25 && defender.stats.hp > 0) {
      const counterDmg = Math.max(1, Math.floor(getEffectiveStats(defender).attack * 0.5));
      attacker.stats.hp -= counterDmg;
      addMessage(state, `Counter Strike! You hit back for ${counterDmg}!`, '#ff6644');
      if (attacker.stats.hp <= 0) {
        attacker.isDead = true;
        addMessage(state, `${attacker.name} is defeated!`, MSG_COLOR.good);
        state.score += attacker.xp;
        state.runStats.kills++;
        const _akn = attacker.baseName ?? attacker.name; state.runStats.monsterKills[_akn] = (state.runStats.monsterKills[_akn] ?? 0) + 1;
        gainXP(state, attacker.xp);
      }
    }
  }

  // Gold Sense — 50% more gold from kills
  if (attacker.isPlayer && hasChosenAbility(state, 'shared_gold_find') && defender.stats.hp <= 0) {
    const bonusGold = Math.floor(3 + state.floorNumber);
    state.score += bonusGold;
    state.runStats.goldEarned += bonusGold;
  }

  // ── Player weapon onHitEffect processing ──
  if (attacker.isPlayer && defender.stats.hp > 0) {
    const weapon = attacker.equipment?.weapon;
    const effect = weapon?.onHitEffect;
    if (effect) {
      if (!defender.statusEffects) defender.statusEffects = [];
      switch (effect.type) {
        case 'lifesteal': {
          const heal = Math.max(1, Math.floor(dmg * effect.percent / 100));
          const actual = Math.min(heal, attacker.stats.maxHp - attacker.stats.hp);
          if (actual > 0) {
            attacker.stats.hp += actual;
            addMessage(state, `Life drain! +${actual} HP`, '#cc1144');
          }
          break;
        }
        case 'hungersteal': {
          const restored = Math.min(effect.amount, state.hunger.max - state.hunger.current);
          if (restored > 0) {
            state.hunger.current += restored;
            addMessage(state, `The Fang feeds you. +${restored} hunger`, '#c49eff');
          }
          break;
        }
        case 'poison': {
          if (!defender.statusEffects.some(e => e.type === 'poison')) {
            defender.statusEffects.push({ type: 'poison', turnsRemaining: effect.turns, damage: effect.damage });
            addMessage(state, `${defender.name} is poisoned!`, '#33cc22');
          }
          break;
        }
        case 'fireball': {
          if ('chance' in effect && Math.random() < effect.chance) {
            const bonusDmg = effect.damage;
            defender.stats.hp -= bonusDmg;
            addMessage(state, `Flames erupt for ${bonusDmg} bonus damage!`, '#ff6622');
          }
          break;
        }
        case 'freeze': {
          if ('chance' in effect && Math.random() < effect.chance) {
            if (!defender.statusEffects.some(e => e.type === 'freeze')) {
              defender.statusEffects.push({ type: 'freeze', turnsRemaining: effect.turns });
              addMessage(state, `${defender.name} is frozen!`, '#88ddff');
            }
          }
          break;
        }
        case 'stun': {
          if (Math.random() < effect.chance) {
            if (!defender.statusEffects.some(e => e.type === 'stun')) {
              defender.statusEffects.push({ type: 'stun', turnsRemaining: 1 });
              addMessage(state, `${defender.name} is stunned!`, '#ffff44');
            }
          }
          break;
        }
        case 'bleed': {
          if (!defender.statusEffects.some(e => e.type === 'bleed')) {
            defender.statusEffects.push({ type: 'bleed', turnsRemaining: effect.turns, damage: effect.damage });
            addMessage(state, `${defender.name} is bleeding!`, '#ff4444');
          }
          break;
        }
        case 'execute': {
          const hpPct = defender.stats.hp / defender.stats.maxHp;
          if (hpPct <= effect.hpThreshold && Math.random() < effect.chance && !defender.isBoss) {
            defender.stats.hp = 0;
            addMessage(state, `Executed ${defender.name}!`, '#aa2222');
          }
          break;
        }
      }
    }

    // Armor onDefendEffect (thorns, etc.) — defender's armor damages attacker
    const defArmor = defender.equipment?.armor;
    const defendEffect = defArmor?.onDefendEffect;
    if (defendEffect && defendEffect.type === 'thorns') {
      attacker.stats.hp -= defendEffect.damage;
      addMessage(state, `Thorns deal ${defendEffect.damage} damage back!`, '#44aa44');
    }

    // Generated Class — on_hit resource gain
    if (state.playerClass === 'generated') {
      const gen = getActiveGeneratedClass();
      if (gen && gen.resource.regenMethod === 'on_hit') {
        const genExt = state as GameState & { _genResource?: number };
        const prev = genExt._genResource ?? gen.resource.startingAmount;
        const gained = gen.resource.regenAmount;
        genExt._genResource = Math.min(gen.resource.max, prev + gained);
        addMessage(state, `+${gained} ${gen.resource.name}!`, gen.resource.color);
      }
    }
  }

  // ── Defender armor onDefendEffect when monster attacks player ──
  if (!attacker.isPlayer && defender.isPlayer && defender.stats.hp > 0) {
    const armor = defender.equipment?.armor;
    const defEffect = armor?.onDefendEffect;
    if (defEffect) {
      switch (defEffect.type) {
        case 'thorns': {
          attacker.stats.hp -= defEffect.damage;
          addMessage(state, `Thorns deal ${defEffect.damage} to ${attacker.name}!`, '#44aa44');
          break;
        }
        case 'freeze': {
          if ('chance' in defEffect && Math.random() < defEffect.chance) {
            if (!attacker.statusEffects) attacker.statusEffects = [];
            if (!attacker.statusEffects.some(e => e.type === 'freeze')) {
              attacker.statusEffects.push({ type: 'freeze', turnsRemaining: defEffect.turns });
              addMessage(state, `${attacker.name} is frozen by your armor!`, '#88ddff');
            }
          }
          break;
        }
        case 'fireball': {
          if ('chance' in defEffect && Math.random() < defEffect.chance) {
            attacker.stats.hp -= defEffect.damage;
            addMessage(state, `Your armor burns ${attacker.name} for ${defEffect.damage}!`, '#ff6622');
          }
          break;
        }
      }
    }
  }

  // Environmental attack — monster creates terrain around the defender on hit
  if (!attacker.isPlayer && attacker.terrainOnHit && Math.random() < attacker.terrainOnHit.chance) {
    const { terrain, radius } = attacker.terrainOnHit;
    const count = Math.floor(Math.random() * 3) + 2; // 2-4 tiles
    const placed = placeTerrain(state, defender.pos.x, defender.pos.y, terrain, radius, count);
    if (placed > 0) {
      const terrainNames: Record<string, string> = {
        lava: 'fire', water: 'electricity', poison: 'toxic pools',
        ice: 'frost', shadow: 'shadow', mud: 'mud',
        brimstone: 'brimstone', void_rift: 'void energy', spore: 'spores',
        crystal: 'crystals', frozen: 'permafrost', holy: 'holy light',
        tall_grass: 'vines', mycelium: 'fungus',
      };
      addMessage(state, `${attacker.name} spreads ${terrainNames[terrain] ?? terrain} around you!`, MSG_COLOR.bad);
    }
  }

  // Monster innate on-hit abilities — apply status effects to the defender
  if (!attacker.isPlayer && attacker.abilities && defender.stats.hp > 0) {
    if (!defender.statusEffects) defender.statusEffects = [];
    for (const ability of attacker.abilities) {
      switch (ability.type) {
        case 'poisonAttack':
          if (Math.random() < ability.chance && !defender.statusEffects.some(e => e.type === 'poison')) {
            defender.statusEffects.push({ type: 'poison', turnsRemaining: ability.turns, damage: ability.damage });
            addMessage(state, `${attacker.name} poisons you!`, '#33cc11');
          }
          break;
        case 'stunAttack':
          if (Math.random() < ability.chance && !defender.statusEffects.some(e => e.type === 'stun')) {
            defender.statusEffects.push({ type: 'stun', turnsRemaining: 1 });
            addMessage(state, `${attacker.name} stuns you!`, '#ffff44');
          }
          break;
        case 'bleedAttack':
          if (Math.random() < ability.chance && !defender.statusEffects.some(e => e.type === 'bleed')) {
            defender.statusEffects.push({ type: 'bleed', turnsRemaining: ability.turns, damage: ability.damage });
            addMessage(state, `${attacker.name} makes you bleed!`, '#ff4444');
          }
          break;
        case 'freezeAttack':
          if (Math.random() < ability.chance && !defender.statusEffects.some(e => e.type === 'freeze')) {
            defender.statusEffects.push({ type: 'freeze', turnsRemaining: ability.turns });
            addMessage(state, `${attacker.name} freezes you!`, '#88ccff');
          }
          break;
        case 'drainLife': {
          if (Math.random() < ability.chance) {
            const healAmt = Math.floor(dmg * ability.percent / 100);
            if (healAmt > 0) {
              attacker.stats.hp = Math.min(attacker.stats.maxHp, attacker.stats.hp + healAmt);
              addMessage(state, `${attacker.name} drains ${healAmt} HP from you!`, '#cc2244');
            }
          }
          break;
        }
        default:
          break;
      }
    }
  }

  // Paladin Divine Might — full heal once per floor when below 15% HP
  if (defender.isPlayer && defender.stats.hp > 0 && defender.stats.hp <= defender.stats.maxHp * 0.15
      && hasChosenAbility(state, 'pal_divine_might') && !(state as GameState & { _divineMightUsed?: boolean })._divineMightUsed) {
    defender.stats.hp = defender.stats.maxHp;
    (state as GameState & { _divineMightUsed?: boolean })._divineMightUsed = true;
    addMessage(state, 'Divine Might! Fully healed by holy power!', '#ffd700');
  }

  // Survival Instinct — ranger auto-heals once per floor when near death
  if (defender.isPlayer && defender.stats.hp > 0 && defender.stats.hp <= defender.stats.maxHp * 0.15
      && hasPassive(state, 'Survival Instinct') && !state.survivalUsedThisFloor) {
    const healAmt = Math.floor(defender.stats.maxHp * 0.5);
    defender.stats.hp = Math.min(defender.stats.maxHp, defender.stats.hp + healAmt);
    state.survivalUsedThisFloor = true;
    addMessage(state, `Survival Instinct! Healed ${healAmt} HP!`, '#33cc66');
  }

  // Undying Will — necromancer survives a fatal blow once per floor with 1 HP
  if (defender.isPlayer && defender.stats.hp <= 0 && hasPassive(state, 'Undying Will') && !state.undyingWillUsedThisFloor) {
    defender.stats.hp = 1;
    state.undyingWillUsedThisFloor = true;
    addMessage(state, 'Undying Will! You cling to life!', '#aa44dd');
  }

  // Beyond Death — revenant gets a free revive per floor
  if (defender.isPlayer && defender.stats.hp <= 0 && hasPassive(state, 'Beyond Death') && !state.beyondDeathUsedThisFloor) {
    defender.stats.hp = Math.floor(defender.stats.maxHp * 0.3);
    state.beyondDeathUsedThisFloor = true;
    addMessage(state, 'Beyond Death! You rise again!', '#ff4444');
  }

  // Last Stand — warrior chosen ability: survive fatal blow once per floor
  if (defender.isPlayer && defender.stats.hp <= 0 && hasChosenAbility(state, 'war_last_stand') && !(state as GameState & { _lastStandUsed?: boolean })._lastStandUsed) {
    defender.stats.hp = 1;
    (state as GameState & { _lastStandUsed?: boolean })._lastStandUsed = true;
    addMessage(state, 'Last Stand! You refuse to fall!', '#ff3333');
  }
  // Mage Battlemage capstone — survive fatal blow once per floor
  if (defender.isPlayer && defender.stats.hp <= 0 && hasActiveModifier(state, 'mage_last_stand') && !(state as GameState & { _mageLastStandUsed?: boolean })._mageLastStandUsed) {
    defender.stats.hp = 1;
    (state as GameState & { _mageLastStandUsed?: boolean })._mageLastStandUsed = true;
    addMessage(state, 'Immortal Mage! You cheat death!', '#44aaff');
  }
  // Necro Lich capstone — undying will via skill tree (uses same flag as passive)
  if (defender.isPlayer && defender.stats.hp <= 0 && hasActiveModifier(state, 'necro_undying_will') && !state.undyingWillUsedThisFloor) {
    defender.stats.hp = 1;
    state.undyingWillUsedThisFloor = true;
    addMessage(state, 'Lich\'s Will! You refuse to fall!', '#cc00ff');
  }
  // Revenant Deathwalker capstone — free revive per floor
  if (defender.isPlayer && defender.stats.hp <= 0 && hasActiveModifier(state, 'revenant_free_revive') && !state.beyondDeathUsedThisFloor) {
    defender.stats.hp = Math.floor(defender.stats.maxHp * 0.3);
    state.beyondDeathUsedThisFloor = true;
    addMessage(state, 'Beyond Death! You rise from the grave!', '#ff4444');
  }
  // Ranger Survivalist capstone — full heal once per floor when near death
  if (defender.isPlayer && defender.stats.hp <= 0 && hasActiveModifier(state, 'ranger_full_heal_once') && !(state as GameState & { _rangerFullHealUsed?: boolean })._rangerFullHealUsed) {
    defender.stats.hp = defender.stats.maxHp;
    (state as GameState & { _rangerFullHealUsed?: boolean })._rangerFullHealUsed = true;
    addMessage(state, 'One With Nature! Fully healed!', '#22aa44');
  }

  if (defender.stats.hp <= 0) {
    defender.isDead = true;
    if (defender.isPlayer) {
      addMessage(state, 'You have died!', MSG_COLOR.bad);
      state.gameOver = true;
    } else {
      addMessage(state, `${defender.name} is defeated!`, MSG_COLOR.good);
      state.score += defender.xp;
      state.runStats.kills++;
      const _dbn = defender.baseName ?? defender.name; state.runStats.monsterKills[_dbn] = (state.runStats.monsterKills[_dbn] ?? 0) + 1;
      gainXP(state, defender.xp);

      if (state.playerClass === 'impregnar') onImpregnatedDeath(state, defender);

      // Track faction reputation change on kill
      if (defender.factionId && state._bloodlineRef) {
        const repChange = modifyFactionReputation(
          state._bloodlineRef,
          defender.factionId,
          REPUTATION_CHANGES.KILL_CREATURE,
          'kill'
        );
        
        // Notify if tier changed
        if (repChange.oldTier && repChange.newTier && repChange.oldTier.id !== repChange.newTier.id) {
          const factionDef = getFactionDef(defender.factionId);
          if (factionDef) {
            addMessage(state, `${factionDef.name} now view you as: ${repChange.newTier.name}`, repChange.newTier.color);
          }
        }
      }

      // Boss kill — drop guaranteed loot and a key, open the boss gate
      if (defender.isBoss) {
        state.runStats.bossesKilled++;
        state.bossesDefeatedThisRun.push(defender.name);
        addMessage(state, `BOSS DEFEATED: ${defender.name}!`, MSG_COLOR.boss);

        // Drop guaranteed loot (check base bosses + zone bosses)
        const zoneBosses = ZONE_BOSSES[state.zone] ?? [];
        const allBossDefs = [...BOSS_DEFS, ...zoneBosses];
        const bossDef = allBossDefs.find(b => b.name === defender.name);
        if (bossDef?.guaranteedLoot) {
          const template = findItemTemplate(bossDef.guaranteedLoot) ?? findZoneBossLoot(bossDef.guaranteedLoot);
          if (template) {
            const lootItem = { ...template, id: uid(), rarity: 'legendary' as const, color: RARITY_DEFS.legendary.color };
            state.items.push({ id: uid(), pos: { ...defender.pos }, item: lootItem });
            addMessage(state, `${defender.name} dropped ${lootItem.name}!`, RARITY_DEFS.legendary.color);
          }
        }


      }

      // Paladin Righteous Fury — each kill adds a stacking damage buff for 5 turns
      if (attacker.isPlayer && hasChosenAbility(state, 'pal_righteous_fury')) {
        const ext = state as GameState & { _furyStacks?: number; _furyTurnsLeft?: number };
        ext._furyStacks = (ext._furyStacks ?? 0) + 1;
        ext._furyTurnsLeft = 5;
        addMessage(state, `Righteous Fury x${ext._furyStacks}!`, '#ff8833');
      }

      // Warrior Fortify — heal 2 HP on every kill
      if (attacker.isPlayer && hasChosenAbility(state, 'war_fortify')) {
        const fortifyHeal = Math.min(2, attacker.stats.maxHp - attacker.stats.hp);
        if (fortifyHeal > 0) {
          attacker.stats.hp += fortifyHeal;
          addMessage(state, `Fortify! +${fortifyHeal} HP`, '#ff4444');
        }
      }

      // Warrior Bloodlust — killing an enemy refunds 10 rage
      if (attacker.isPlayer && state.playerClass === 'warrior' && hasChosenAbility(state, 'war_bloodlust')) {
        const bloodlustExt = state as GameState & { _rage?: number };
        const prevRage = bloodlustExt._rage ?? 0;
        bloodlustExt._rage = Math.min(100, prevRage + 10);
        addMessage(state, `Bloodlust! +10 Rage`, '#ff2200');
      }

      // Paladin Sacred Vow — each kill adds 1 Vow stack (max 5)
      if (attacker.isPlayer && state.playerClass === 'paladin') {
        const vowExt = state as GameState & { _vowStacks?: number };
        const prev = vowExt._vowStacks ?? 0;
        if (prev < 5) {
          vowExt._vowStacks = prev + 1;
          addMessage(state, `Sacred Vow: ${vowExt._vowStacks}/5 stacks`, '#ffd700');
        }
      }

      // Generated Class — on_kill resource gain
      if (attacker.isPlayer && state.playerClass === 'generated') {
        const gen = getActiveGeneratedClass();
        if (gen && gen.resource.regenMethod === 'on_kill') {
          const genExt = state as GameState & { _genResource?: number };
          const prev = genExt._genResource ?? gen.resource.startingAmount;
          const gained = gen.resource.regenAmount;
          genExt._genResource = Math.min(gen.resource.max, prev + gained);
          addMessage(state, `+${gained} ${gen.resource.name}!`, gen.resource.color);
        }
      }

      // Ranger — Hunter's Mark transfer: if marked target dies, transfer remaining marks to nearest enemy
      if (attacker.isPlayer && state.playerClass === 'ranger') {
        const markExt = state as GameState & { _markTargetId?: string; _markHits?: number; _markCooldown?: number };
        if ((markExt._markHits ?? 0) > 0 && markExt._markTargetId === defender.id) {
          const nearbyAlive = state.monsters.filter(
            m => !m.isDead && m.id !== defender.id && state.floor.visible[m.pos.y]?.[m.pos.x] === true,
          );
          if (nearbyAlive.length > 0) {
            nearbyAlive.sort((a, b) => manhattan(attacker.pos, a.pos) - manhattan(attacker.pos, b.pos));
            const newTarget = nearbyAlive[0]!;
            markExt._markTargetId = newTarget.id;
            addMessage(state, `Hunter's Mark transfers to ${newTarget.name}! (${markExt._markHits} hits left)`, '#ffaa00');
          } else {
            markExt._markTargetId = undefined;
            markExt._markHits = 0;
            markExt._markCooldown = 5;
          }
        }
      }

      // Life Drain — necromancer heals 3 HP on every kill (Soul Harvest: 5, Grim Reaper capstone: 10)
      if (attacker.isPlayer && hasPassive(state, 'Life Drain')) {
        const baseHeal = hasActiveModifier(state, 'necro_mega_harvest') ? 10 : (hasChosenAbility(state, 'nec_soul_harvest') ? 5 : 3);
        const healAmt = Math.min(baseHeal, attacker.stats.maxHp - attacker.stats.hp);
        if (healAmt > 0) {
          attacker.stats.hp += healAmt;
          addMessage(state, `Life Drain! +${healAmt} HP`, '#aa44dd');
        }
      }

      // Death Knight — Soul Harvest: heal 5 HP on kill
      if (attacker.isPlayer && hasPassive(state, 'Soul Harvest')) {
        const harvestHeal = Math.min(5, attacker.stats.maxHp - attacker.stats.hp);
        if (harvestHeal > 0) {
          attacker.stats.hp += harvestHeal;
          addMessage(state, `Soul Harvest! +${harvestHeal} HP`, '#aa55cc');
        }
      }

      // Necromancer — Corpse Burst: kills deal 3 damage to nearby enemies (8 with capstone)
      if (attacker.isPlayer && hasChosenAbility(state, 'nec_corpse_burst')) {
        const burstDmg = hasActiveModifier(state, 'necro_mega_corpse_burst') ? 8 : 3;
        for (const m of state.monsters) {
          if (!m.isDead && m.id !== defender.id && manhattan(m.pos, defender.pos) <= 2) {
            m.stats.hp -= burstDmg;
            if (m.stats.hp <= 0) {
              m.isDead = true;
              addMessage(state, `Corpse Burst kills ${m.name}!`, '#aa44dd');
              state.score += m.xp;
              state.runStats.kills++;
              const _mbn = m.baseName ?? m.name; state.runStats.monsterKills[_mbn] = (state.runStats.monsterKills[_mbn] ?? 0) + 1;
              gainXP(state, m.xp);
            } else {
              addMessage(state, `Corpse Burst hits ${m.name} for ${burstDmg}!`, '#aa44dd');
            }
          }
        }
      }

      // Soul Siphon — revenant 10% chance to fully restore HP on kill
      if (attacker.isPlayer && hasPassive(state, 'Soul Siphon') && Math.random() < 0.1) {
        attacker.stats.hp = attacker.stats.maxHp;
        addMessage(state, 'Soul Siphon! Full HP restored!', '#ff4444');
      }

      // Regular monster loot
      if (!defender.isBoss) {
        const allDefs = [...MONSTER_DEFS, ...getNecropolisMonsters(getNecropolisState().communalDeaths)];
        const def = allDefs.find((m) => m.name === defender.name);
        const lootBonus = hasPassive(state, 'Scavenger') ? 0.2 : 0;
        if (def && Math.random() < def.lootChance + lootBonus) {
          const loot = randomItem(state.floorNumber, state.zone);
          state.items.push({ id: uid(), pos: { ...defender.pos }, item: loot });
          const lootColor = loot.rarity && loot.rarity !== 'common' ? RARITY_DEFS[loot.rarity].color : MSG_COLOR.loot;
          addMessage(state, `${defender.name} dropped ${loot.name}!`, lootColor);
        }
        // Scavenger Instinct — 25% chance to drop a bonus potion or food on kill
        if (attacker.isPlayer && hasChosenAbility(state, 'shared_armor') && Math.random() < 0.25) {
          const pool = [...POTION_TEMPLATES, ...FOOD_TEMPLATES];
          const bonus = pool[Math.floor(Math.random() * pool.length)];
          if (bonus) {
            const bonusItem = { ...bonus, id: uid() };
            state.items.push({ id: uid(), pos: { ...defender.pos }, item: bonusItem });
            addMessage(state, `Scavenger Instinct! Found ${bonusItem.name}!`, '#4488ff');
          }
        }
      }

      // Essence Shard drops — rare currency for Legacy Gear (roguelike only)
      if (attacker.isPlayer && !state._isStoryMode) {
        if (defender.isBoss) {
          const shards = BOSS_SHARD_MIN + Math.floor(Math.random() * (BOSS_SHARD_MAX - BOSS_SHARD_MIN + 1));
          state.runStats.essenceShardsEarned += shards;
          addMessage(state, `+${shards} Essence Shard${shards > 1 ? 's' : ''}!`, '#c49eff');
        } else if (Math.random() < SHARD_DROP_CHANCE) {
          state.runStats.essenceShardsEarned += 1;
          addMessage(state, '+1 Essence Shard!', '#c49eff');
        }
      }
    }
  }
}

// ─── XP & Leveling ───

function gainXP(state: GameState, amount: number) {
  // Quick Learner ability — +25% XP
  const xpBonus = hasChosenAbility(state, 'shared_xp_boost') ? 1.25 : 1.0;
  // Boon XP boost
  const boonXpBoost = getBoonBonus(state, 'xp_boost');
  const boonXpMult = 1 + (boonXpBoost / 100);
  const effectiveAmount = Math.floor(amount * (state.xpMultiplier ?? 1.0) * xpBonus * boonXpMult);
  state.player.xp += effectiveAmount;
  addMessage(state, `+${effectiveAmount} XP`, MSG_COLOR.xp);

  const nextLevelIdx = state.player.level;
  const threshold = XP_PER_LEVEL[nextLevelIdx];
  if (threshold !== undefined && state.player.xp >= threshold) {
    const classDef = getClassDef(state.playerClass);
    state.player.level++;
    state.player.stats.maxHp += classDef.levelBonusHp;
    // Restore 60% of max HP on level-up (meaningful reward without a full combat reset)
    state.player.stats.hp = Math.min(state.player.stats.maxHp, state.player.stats.hp + Math.floor(state.player.stats.maxHp * 0.6));
    state.player.stats.attack += classDef.levelBonusAtk;
    state.player.stats.defense += classDef.levelBonusDef;

    addMessage(state, `Level up! You are now level ${state.player.level}! HP restored!`, MSG_COLOR.xp);

    // War Cry — stun adjacent enemies on level up
    if (hasChosenAbility(state, 'war_war_cry')) {
      let stunned = 0;
      for (const m of state.monsters) {
        if (!m.isDead && manhattan(m.pos, state.player.pos) <= 1) {
          if (!m.statusEffects) m.statusEffects = [];
          if (!m.statusEffects.some(e => e.type === 'stun')) {
            m.statusEffects.push({ type: 'stun', turnsRemaining: 2 });
            stunned++;
          }
        }
      }
      if (stunned > 0) {
        addMessage(state, `War Cry! ${stunned} nearby ${stunned === 1 ? 'enemy' : 'enemies'} stunned!`, '#ff8844');
      }
    }

    // Check for newly unlocked passives
    for (const passive of classDef.passives) {
      if (passive.unlockLevel === state.player.level) {
        addMessage(state, `New passive unlocked: ${passive.name} - ${passive.description}`, MSG_COLOR.system);

        // Quick Feet — permanent speed boost on unlock
        if (passive.name === 'Quick Feet') {
          state.player.stats.speed += 3;
        }
      }
    }

    // Grant a skill point on level up
    state.skillPoints += 1;
    addMessage(state, 'Skill point earned! Open the skill tree to spend it.', '#ffcc33');

    // Narrative skill pick on level up
    if (state.skills) {
      state.pendingNarrativeSkillPick = true;
    }
  }
}

// ─── Item Use ───

export function useItem(state: GameState, itemIndex: number): boolean {
  const item = state.player.inventory[itemIndex];
  if (!item) return false;

  // Block consumable use while in dino form (can't hold bottles with claws)
  if (state.dinoTransformTurns && state.dinoTransformTurns > 0 && !state.dinoPermanent &&
      (item.type === 'potion' || item.type === 'scroll' || item.type === 'food')) {
    if (item.name !== 'Dino Serum') {
      addMessage(state, 'Your claws can\'t hold that! Wait for the transformation to wear off.', MSG_COLOR.bad);
      return false;
    }
  }
  if (state.dinoPermanent && (item.type === 'potion' || item.type === 'scroll' || item.type === 'food') && item.name !== 'Dino Serum') {
    addMessage(state, 'Your permanent dino form can\'t use consumables.', MSG_COLOR.bad);
    return false;
  }
  // Block consumable use for general transforms that restrict it
  if (state._activeTransformId && (item.type === 'potion' || item.type === 'scroll' || item.type === 'food')) {
    const _tConsumables: Record<string, string> = { 'Wall Essence': 'flesh_wall', 'Dream Shard': 'shadow' };
    const isTransformItem = !!_tConsumables[item.name];
    if (!isTransformItem) {
      const tDef = getTransformDef(state._activeTransformId);
      if (tDef && !tDef.canUseConsumables) {
        addMessage(state, `Your ${tDef.name.toLowerCase()} can't use that!`, MSG_COLOR.bad);
        return false;
      }
    }
  }

  if (item.name === 'Dino Serum') {
    if (state.dinoPermanent) {
      addMessage(state, 'You are already permanently transformed.', MSG_COLOR.info);
      return false;
    }
    state.player.inventory.splice(itemIndex, 1);
    const alreadyTransformed = (state.dinoTransformTurns ?? 0) > 0;
    const totalUses = (state._campaignDinoUses ?? 0) + 1;
    state._campaignDinoUses = totalUses;

    if (totalUses >= 6) {
      state.dinoPermanent = true;
      state.dinoTransformTurns = 0;
      state.player.stats.attack += 8;
      state.player.stats.defense += 4;
      state.player.stats.speed = Math.max(1, state.player.stats.speed - 3);
      state.player.stats.maxHp += 20;
      state.player.stats.hp += 20;
      state.player.char = 'D';
      addMessage(state, 'The serum floods your veins. Your body twists, bones crack and reform. There is no going back.', '#ff4444');
      addMessage(state, 'PERMANENT TRANSFORMATION — You are forever changed.', '#ff2222');
    } else {
      const duration = totalUses >= 4 ? 12 : 8;
      if (alreadyTransformed) {
        state.dinoTransformTurns = (state.dinoTransformTurns ?? 0) + duration;
        addMessage(state, `Extended dino form! ${state.dinoTransformTurns} turns remaining.`, '#44ff88');
      } else {
        state.dinoTransformTurns = duration;
        state.player.stats.attack += 8;
        state.player.stats.defense += 4;
        state.player.stats.speed = Math.max(1, state.player.stats.speed - 3);
        state.player.stats.maxHp += 20;
        state.player.stats.hp += 20;
        state.player.char = 'D';
        addMessage(state, `Dino transformation! +8 ATK, +4 DEF, +20 HP for ${duration} turns.`, '#44ff88');
      }
      if (totalUses >= 4) {
        addMessage(state, 'WARNING: The serum is taking hold. Your body resists returning to normal...', '#ffaa00');
      }
    }
    return true;
  }

  // General transformation consumables (Wall Essence, Dream Shard)
  const _transformConsumables: Record<string, string> = { 'Wall Essence': 'flesh_wall', 'Dream Shard': 'shadow' };
  const _transformId = _transformConsumables[item.name];
  if (_transformId) {
    const tDef = getTransformDef(_transformId);
    if (!tDef) { return false; }
    if (state._transformPermanent && state._activeTransformId === _transformId) {
      addMessage(state, 'You are already permanently transformed.', MSG_COLOR.info);
      return false;
    }
    if (state._transformPermanent || state.dinoPermanent) {
      addMessage(state, 'Your body is already permanently altered. It cannot change further.', MSG_COLOR.bad);
      return false;
    }
    state.player.inventory.splice(itemIndex, 1);
    if (!state._transformUses) state._transformUses = {};
    const totalUses = (state._transformUses[_transformId] ?? 0) + 1;
    state._transformUses[_transformId] = totalUses;

    if (totalUses >= tDef.permanentThreshold) {
      state._transformPermanent = true;
      state._activeTransformId = _transformId;
      state._transformTurns = 0;
      state.player.stats.attack += tDef.statMods.attack ?? 0;
      state.player.stats.defense += tDef.statMods.defense ?? 0;
      state.player.stats.speed = Math.max(1, state.player.stats.speed + (tDef.statMods.speed ?? 0));
      state.player.stats.maxHp += tDef.statMods.maxHp ?? 0;
      state.player.stats.hp += tDef.statMods.hp ?? 0;
      state.player.char = tDef.char;
      addMessage(state, tDef.permanentMessage, '#ff4444');
      addMessage(state, `PERMANENT ${tDef.name.toUpperCase()} — You are forever changed.`, '#ff2222');
      trackStoryTransformUsed({ transformId: _transformId, totalUses, isPermanent: true, chapter: '', floor: state.floorNumber });
    } else {
      const alreadyInForm = (state._transformTurns ?? 0) > 0 && state._activeTransformId === _transformId;
      const duration = (tDef.extendedThreshold && totalUses >= tDef.extendedThreshold)
        ? (tDef.extendedDuration ?? tDef.turnDuration) : tDef.turnDuration;
      if (alreadyInForm) {
        state._transformTurns = (state._transformTurns ?? 0) + duration;
        addMessage(state, `Extended ${tDef.name}! ${state._transformTurns} turns remaining.`, tDef.color);
      } else {
        state._activeTransformId = _transformId;
        state._transformTurns = duration;
        state.player.stats.attack += tDef.statMods.attack ?? 0;
        state.player.stats.defense += tDef.statMods.defense ?? 0;
        state.player.stats.speed = Math.max(1, state.player.stats.speed + (tDef.statMods.speed ?? 0));
        state.player.stats.maxHp += tDef.statMods.maxHp ?? 0;
        state.player.stats.hp += tDef.statMods.hp ?? 0;
        state.player.char = tDef.char;
        const atkMod = tDef.statMods.attack ?? 0;
        const defMod = tDef.statMods.defense ?? 0;
        addMessage(state, `${tDef.name}! +${atkMod} ATK, +${defMod} DEF for ${duration} turns.`, tDef.color);
      }
      if (tDef.extendedThreshold && totalUses >= tDef.extendedThreshold) {
        addMessage(state, tDef.warningMessage, '#ffaa00');
      }
    }
    return true;
  }

  if (item.type === 'potion') {
    state.runStats.potionsUsed++;
    if (!state.runStats.namedPotionsUsed) state.runStats.namedPotionsUsed = {};
    state.runStats.namedPotionsUsed[item.name] = (state.runStats.namedPotionsUsed[item.name] ?? 0) + 1;
    const hpBefore = state.player.stats.hp;
    let healAmt = 0;
    if (item.name === 'Health Potion') healAmt = 15;
    else if (item.name === 'Greater Health Potion') healAmt = 30;
    else if (item.name === 'Strength Potion') {
      state.player.stats.attack += 2;
      addMessage(state, 'You feel stronger!', MSG_COLOR.good);
      trackConsumableUsed({
        itemName: item.name, itemType: 'potion', playerClass: state.playerClass,
        floor: state.floorNumber, zone: state.zone,
        hpBefore, hpAfter: state.player.stats.hp, maxHp: state.player.stats.maxHp,
        hungerBefore: state.hunger.current, hungerAfter: state.hunger.current, hungerMax: state.hunger.max,
      });
      state.player.inventory.splice(itemIndex, 1);
      return true;
    }
    // Fallback: use item value as heal amount for custom/story potions
    if (healAmt === 0 && item.value > 0) {
      healAmt = item.value;
    }
    if (healAmt > 0) {
      // Herbalist — potions heal 50% more
      if (hasChosenAbility(state, 'rng_herbalist')) {
        healAmt = Math.floor(healAmt * 1.5);
      }
      const eStats = getEffectiveStats(state.player);
      const healed = Math.min(healAmt, eStats.maxHp - state.player.stats.hp);
      state.player.stats.hp += healed;
      addMessage(state, `Healed ${healed} HP!`, MSG_COLOR.good);
    }
    trackConsumableUsed({
      itemName: item.name, itemType: 'potion', playerClass: state.playerClass,
      floor: state.floorNumber, zone: state.zone,
      hpBefore, hpAfter: state.player.stats.hp, maxHp: state.player.stats.maxHp,
      hungerBefore: state.hunger.current, hungerAfter: state.hunger.current, hungerMax: state.hunger.max,
    });
    state.player.inventory.splice(itemIndex, 1);
    return true;
  }

  if (item.type === 'food') {
    // Check affliction food restrictions
    if (isItemBlocked(state, item.name, 'food')) {
      const stage = getCurrentStage(state);
      if (stage) {
        const restriction = stage.restrictions?.find(r => r.type === 'food');
        addMessage(state, restriction?.description ?? 'Your changed body rejects this food.', '#aa44aa');
      }
      return false;
    }
    
    state.runStats.foodEaten++;
    if (!state.runStats.namedFoodEaten) state.runStats.namedFoodEaten = {};
    state.runStats.namedFoodEaten[item.name] = (state.runStats.namedFoodEaten[item.name] ?? 0) + 1;
    const hpBefore = state.player.stats.hp;
    const hungerBefore = state.hunger.current;
    const foragerBonus = hasPassive(state, 'Forager') ? 1.5 : 1;
    const hungerRestore = Math.floor(item.value * foragerBonus);
    const restored = Math.min(hungerRestore, state.hunger.max - state.hunger.current);
    state.hunger.current += restored;

    // Food also heals a small amount of HP
    let healAmt = Math.floor(hungerRestore * 0.2);
    // Iron Stomach — food heals 5 extra HP
    if (hasChosenAbility(state, 'shared_tough')) {
      healAmt += 5;
    }
    const eStats = getEffectiveStats(state.player);
    const healed = Math.min(healAmt, eStats.maxHp - state.player.stats.hp);
    state.player.stats.hp += healed;

    if (healed > 0) {
      addMessage(state, `Ate ${item.name}. +${Math.round(restored)} fullness, +${healed} HP.`, MSG_COLOR.good);
    } else {
      addMessage(state, `Ate ${item.name}. +${Math.round(restored)} fullness.`, MSG_COLOR.good);
    }
    trackConsumableUsed({
      itemName: item.name, itemType: 'food', playerClass: state.playerClass,
      floor: state.floorNumber, zone: state.zone,
      hpBefore, hpAfter: state.player.stats.hp, maxHp: state.player.stats.maxHp,
      hungerBefore, hungerAfter: state.hunger.current, hungerMax: state.hunger.max,
    });
    state.player.inventory.splice(itemIndex, 1);
    return true;
  }

  if (item.type === 'scroll') {
    state.runStats.scrollsUsed++;
    // Count scrolls as abilities used for quest tracking
    state.runStats.abilitiesUsed++;
    if (item.name === 'Scroll of Mapping') {
      for (let y = 0; y < state.floor.height; y++) {
        for (let x = 0; x < state.floor.width; x++) {
          if (getTile(state.floor, x, y) !== Tile.Void) {
            const row = state.floor.explored[y];
            if (row) row[x] = true;
          }
        }
      }
      addMessage(state, 'The dungeon map is revealed!', MSG_COLOR.system);
    } else if (item.name === 'Scroll of Teleport') {
      const room = state.floor.rooms[Math.floor(Math.random() * state.floor.rooms.length)];
      if (room) {
        state.player.pos = { x: room.centerX, y: room.centerY };
        addMessage(state, 'You teleport to a new location!', MSG_COLOR.system);
        updateFOV(state);
      }
    } else if (item.name === 'Scroll of Greater Enchant') {
      const weapon = state.player.equipment.weapon;
      if (weapon) {
        if (!weapon.statBonus) weapon.statBonus = {};
        weapon.statBonus.attack = (weapon.statBonus.attack ?? 0) + 4;
        addMessage(state, `${weapon.name} glows brightly! +4 attack!`, '#ffaa00');
      } else {
        addMessage(state, 'You need a weapon equipped to use this scroll.', MSG_COLOR.bad);
        return false;
      }
    } else if (item.name === 'Scroll of Summon') {
      // Summon a temporary ally that fights alongside the player
      const spot = findAdjacentSpot(state, state.player.pos);
      if (spot) {
        const floorScale = Math.max(1, state.floorNumber);
        const summon: Entity = {
          id: uid(),
          pos: spot,
          name: 'Spirit Guardian',
          mercName: 'Spirit Guardian',
          char: 'G',
          color: '#cc44ff',
          stats: {
            hp: 15 + floorScale * 5,
            maxHp: 15 + floorScale * 5,
            attack: 5 + floorScale * 2,
            defense: 2 + floorScale,
            speed: 10,
          },
          xp: 0,
          level: floorScale,
          inventory: [],
          equipment: {},
          isPlayer: false,
          isDead: false,
        };
        state.mercenaries.push(summon);
        addMessage(state, 'A Spirit Guardian materializes to fight alongside you!', '#cc44ff');
      } else {
        addMessage(state, 'No room to summon an ally here!', MSG_COLOR.bad);
        return false;
      }
    } else if (item.name === 'Scroll of Invulnerability') {
      // Fully restore HP and grant a massive temporary defense boost
      state.player.stats.hp = state.player.stats.maxHp;
      state.player.stats.defense += 20;
      addMessage(state, 'A golden shield surrounds you! Full HP and +20 defense!', '#ffffff');
    }
    state.player.inventory.splice(itemIndex, 1);
    return true;
  }

  return false;
}

export function equipItem(state: GameState, itemIndex: number): boolean {
  const item = state.player.inventory[itemIndex];
  if (!item || !item.equipSlot) return false;

  // Enforce class restriction (e.g. offhand items are class-specific)
  if (item.classRestriction && !item.classRestriction.includes(state.playerClass)) {
    const classes = item.classRestriction.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(', ');
    addMessage(state, `Only ${classes} can equip this.`, MSG_COLOR.bad);
    return false;
  }

  // Enforce affliction equipment restrictions
  if (isItemBlocked(state, item.name, 'equipment')) {
    const stage = getCurrentStage(state);
    if (stage) {
      const restriction = stage.restrictions?.find(r => r.type === 'equipment');
      addMessage(state, restriction?.description ?? 'Your transformation rejects this item.', '#aa44aa');
    }
    return false;
  }

  const slot = item.equipSlot;
  const current = state.player.equipment[slot];

  if (current) {
    state.player.inventory.push(current);
    addMessage(state, `Unequipped ${current.name}`, MSG_COLOR.info);
  }

  state.player.equipment[slot] = item;
  state.player.inventory.splice(itemIndex, 1);

  if (item.statBonus?.maxHp) {
    state.player.stats.maxHp += item.statBonus.maxHp;
    state.player.stats.hp += item.statBonus.maxHp;
  }

  if (item.rarity && item.rarity !== 'common') {
    if (!state.runStats.rarityEquipped) state.runStats.rarityEquipped = {};
    state.runStats.rarityEquipped[item.rarity] = true;
  }
  if (item.name) {
    if (!state.runStats.namedItemsEquipped) state.runStats.namedItemsEquipped = [];
    if (!state.runStats.namedItemsEquipped.includes(item.name)) {
      state.runStats.namedItemsEquipped.push(item.name);
    }
  }

  addMessage(state, `Equipped ${item.name}`, MSG_COLOR.good);
  return true;
}

export function unequipItem(state: GameState, slot: EquipSlot): boolean {
  const item = state.player.equipment[slot];
  if (!item) return false;

  if (state.player.inventory.length >= 20) {
    addMessage(state, 'Inventory full!', MSG_COLOR.bad);
    return false;
  }

  if (item.statBonus?.maxHp) {
    state.player.stats.maxHp -= item.statBonus.maxHp;
    state.player.stats.hp = Math.min(state.player.stats.hp, state.player.stats.maxHp);
  }

  delete state.player.equipment[slot];
  state.player.inventory.push(item);
  addMessage(state, `Unequipped ${item.name}`, MSG_COLOR.info);
  return true;
}

export function dropItem(state: GameState, itemIndex: number): boolean {
  const item = state.player.inventory[itemIndex];
  if (!item) return false;

  state.items.push({
    id: uid(),
    pos: { ...state.player.pos },
    item,
  });
  state.player.inventory.splice(itemIndex, 1);
  addMessage(state, `Dropped ${item.name}`, MSG_COLOR.info);
  return true;
}

/** Sell an item from the player's inventory for half its value in gold. */
export function sellItem(state: GameState, itemIndex: number): boolean {
  const item = state.player.inventory[itemIndex];
  if (!item) return false;

  const sellPrice = Math.max(1, Math.floor(item.value / 2));
  state.player.inventory.splice(itemIndex, 1);
  state.score += sellPrice;
  state.runStats.goldEarned += sellPrice;
  addMessage(state, `Sold ${item.name} for ${sellPrice} gold.`, MSG_COLOR.loot);
  return true;
}

/** Sell all inventory items matching the given rarities and/or consumables. Returns total gold earned. */
export function autoSellByRarity(state: GameState, rarities: string[], includeConsumables = false): number {
  if (rarities.length === 0 && !includeConsumables) return 0;
  let totalGold = 0;
  // Iterate backwards so splice indices stay valid
  for (let i = state.player.inventory.length - 1; i >= 0; i--) {
    const item = state.player.inventory[i]!;
    const rarity = item.rarity ?? 'common';
    const isConsumable = item.type === 'potion' || item.type === 'food' || item.type === 'scroll';
    if (rarities.includes(rarity) || (includeConsumables && isConsumable)) {
      const sellPrice = Math.max(1, Math.floor(item.value / 2));
      state.player.inventory.splice(i, 1);
      state.score += sellPrice;
      state.runStats.goldEarned += sellPrice;
      totalGold += sellPrice;
    }
  }
  if (totalGold > 0) {
    addMessage(state, `Auto-sold items for ${totalGold} gold.`, MSG_COLOR.loot);
  }
  return totalGold;
}

// ─── Terrain Step Effects ───

export function applyTerrainStepEffects(state: GameState, entity: Entity) {
  const terrain = getTerrainAt(state.floor, entity.pos.x, entity.pos.y);
  if (!terrain) return;

  switch (terrain) {
    case 'lava': {
      if (entity.isPlayer) {
        addMessage(state, '[Lava] Heat radiates through you. Fire attacks deal +40% damage here!', '#ff5511');
      }
      break;
    }
    case 'poison': {
      if (entity.isPlayer) {
        addMessage(state, '[Poison] Toxic fumes empower your strikes. Poison damage +40% here!', '#44cc22');
      }
      break;
    }
    case 'ice': {
      if (entity.isPlayer) {
        if (Math.random() < 0.15) {
          addMessage(state, '[Ice] You slip on the frozen ground!', '#88ddff');
        } else {
          addMessage(state, '[Ice] The ground is slick with frost. Enemies here take extra damage.', '#88ddff');
        }
      }
      break;
    }
    case 'holy': {
      if (entity.isPlayer) {
        const heal = Math.min(2, entity.stats.maxHp - entity.stats.hp);
        if (heal > 0) {
          entity.stats.hp += heal;
          addMessage(state, `[Holy Ground] Warm light soothes you. +${heal} HP. Undead beware.`, '#ffdd66');
        } else {
          addMessage(state, '[Holy Ground] Sacred energy fills this place. Undead are weakened here.', '#ffdd66');
        }
      }
      break;
    }
    case 'water': {
      if (entity.isPlayer) {
        addMessage(state, '[Water] You wade through shallow water. Electric attacks are amplified here.', '#3388cc');
      }
      break;
    }
    case 'mud': {
      if (entity.isPlayer) {
        addMessage(state, '[Mud] Thick mud slows your movement. Enemies here are easier to hit.', '#8a6633');
      }
      break;
    }
    case 'tall_grass': {
      if (entity.isPlayer) {
        addMessage(state, '[Tall Grass] Dense foliage provides cover. Dodge chance increased for all.', '#55aa33');
      }
      break;
    }
    case 'shadow': {
      if (entity.isPlayer) {
        addMessage(state, '[Shadow] Darkness surrounds you. Attacks from here deal +30% damage.', '#554477');
      }
      break;
    }
    case 'frozen': {
      if (entity.isPlayer) {
        if (Math.random() < 0.2) {
          addMessage(state, '[Permafrost] The ground is frozen solid. You slip!', '#aaeeff');
        } else {
          addMessage(state, '[Permafrost] Bitter cold seeps from below. Enemies are slowed here.', '#aaeeff');
        }
      }
      break;
    }
    case 'spore': {
      if (entity.isPlayer) {
        addMessage(state, '[Spore Cloud] Toxic spores cling to your weapon. Nature/poison damage +35% here!', '#88cc44');
      }
      break;
    }
    case 'brimstone': {
      if (entity.isPlayer) {
        addMessage(state, '[Brimstone] Sulfurous energy surges through you. Fire damage +50% here!', '#ff8833');
      }
      break;
    }
    case 'crystal': {
      if (entity.isPlayer) {
        addMessage(state, '[Crystal Floor] Arcane energy hums beneath you. Magic attacks +25% here!', '#cc88ff');
      }
      break;
    }
    case 'void_rift': {
      if (entity.isPlayer) {
        addMessage(state, '[Void Rift] Reality warps around you. All attacks deal +50% damage here!', '#7733cc');
      }
      break;
    }
    case 'mycelium': {
      if (entity.isPlayer) {
        // Small heal from mycelium network
        const heal = Math.min(1, entity.stats.maxHp - entity.stats.hp);
        if (heal > 0) {
          entity.stats.hp += heal;
          addMessage(state, `[Mycelium] The fungal network nourishes you. +${heal} HP.`, '#aa8844');
        } else {
          addMessage(state, '[Mycelium] A living fungal carpet connects the ground.', '#aa8844');
        }
      }
      break;
    }
    case 'hellfire': {
      if (entity.isPlayer) {
        const dmg = 3;
        entity.stats.hp -= dmg;
        addMessage(state, `[Hellfire] Eternal flames sear your flesh! -${dmg} HP. Fire attacks +60% here!`, '#ff4400');
        if (entity.stats.hp <= 0) {
          addMessage(state, 'The hellfire consumed you...', '#ff0000');
          state.gameOver = true;
        }
      }
      break;
    }
    case 'soul_ash': {
      if (entity.isPlayer) {
        addMessage(state, '[Soul Ash] The ashes of the damned crunch underfoot. Attacks drain life here.', '#888888');
      }
      break;
    }
    case 'blood_pool': {
      if (entity.isPlayer) {
        const dmg = 2;
        entity.stats.hp -= dmg;
        addMessage(state, `[Blood Pool] The cursed blood burns! -${dmg} HP. All damage +40% here.`, '#cc0022');
        if (entity.stats.hp <= 0) {
          addMessage(state, 'The blood consumed you...', '#cc0022');
          state.gameOver = true;
        }
      }
      break;
    }
  }
}

// ─── Movement & Turns ───

export function movePlayer(state: GameState, dx: number, dy: number): boolean {
  if (state.gameOver) return false;

  // Stun/freeze — player cannot move, but turn still passes
  if (state.player.statusEffects?.some(e => e.type === 'stun' || e.type === 'freeze')) {
    processTurn(state);
    return true;
  }

  const nx = state.player.pos.x + dx;
  const ny = state.player.pos.y + dy;

  if (nx < 0 || nx >= state.floor.width || ny < 0 || ny >= state.floor.height) return false;

  const tile = getTile(state.floor, nx, ny);


  // Check for map mercenary at target
  const mapMerc = state.mapMercenaries?.find((m) => !m.hired && m.pos.x === nx && m.pos.y === ny);
  if (mapMerc) {
    state.pendingMercenary = mapMerc.id;
    addMessage(state, 'A mercenary offers their services...', MSG_COLOR.merc);
    return true;
  }

  // Check for NPC at target
  const npc = state.npcs.find((n) => !n.talked && n.pos.x === nx && n.pos.y === ny);
  if (npc) {
    state.pendingNPC = npc.id;
    addMessage(state, 'You encounter someone...', MSG_COLOR.system);
    return true;
  }

  const monster = state.monsters.find((m) => !m.isDead && m.pos.x === nx && m.pos.y === ny);
  if (monster) {
    // Don't attack befriended creatures - just pass by
    if (monster.isBefriended || monster.isHostile === false) {
      addMessage(state, `${monster.name} nods as you pass.`, '#88ff88');
      // Swap positions with the befriended creature
      const oldPos = { ...state.player.pos };
      state.player.pos.x = nx;
      state.player.pos.y = ny;
      monster.pos.x = oldPos.x;
      monster.pos.y = oldPos.y;
      processTurn(state);
      return true;
    }
    
    // Ranger — First Strike: stun the monster for 1 turn so it can't retaliate
    if (hasChosenAbility(state, 'rng_swift_strike')) {
      if (!monster.statusEffects) monster.statusEffects = [];
      if (!monster.statusEffects.some(e => e.type === 'stun')) {
        monster.statusEffects.push({ type: 'stun', turnsRemaining: 1 });
      }
    }
    attackEntity(state, state.player, monster);
    processTurn(state);
    return true;
  }

  if (!isWalkableTile(tile)) return false;

  // ── Attack of opportunity — adjacent enemies get a free hit when you retreat ──
  // Shadow Step negates opportunity attacks entirely
  if (!hasChosenAbility(state, 'rog_shadow_step')) {
    const px = state.player.pos.x;
    const py = state.player.pos.y;
    for (const m of state.monsters) {
      if (m.isDead) continue;
      const oldDist = Math.max(Math.abs(m.pos.x - px), Math.abs(m.pos.y - py));
      if (oldDist !== 1) continue;
      const newDist = Math.max(Math.abs(m.pos.x - nx), Math.abs(m.pos.y - ny));
      if (newDist <= oldDist) continue;
      if (m.statusEffects?.some(e => e.type === 'stun' || e.type === 'freeze')) continue;
      addMessage(state, `${m.name} strikes as you retreat!`, MSG_COLOR.bad);
      attackEntity(state, m, state.player);
      if (state.gameOver) return true;
    }
  }

  state.player.pos.x = nx;
  state.player.pos.y = ny;

  // Generated Class — on_move resource gain
  if (state.playerClass === 'generated') {
    const gen = getActiveGeneratedClass();
    if (gen && gen.resource.regenMethod === 'on_move') {
      const genExt = state as GameState & { _genResource?: number };
      const prev = genExt._genResource ?? gen.resource.startingAmount;
      const gained = gen.resource.regenAmount;
      genExt._genResource = Math.min(gen.resource.max, prev + gained);
      // Only show message if significant gain
      if (gained >= 5) {
        addMessage(state, `+${gained} ${gen.resource.name}!`, gen.resource.color);
      }
    }
  }

  // ── Terrain step effects ──
  applyTerrainStepEffects(state, state.player);

  // Track terrain steps for quest progress
  const _terrain = getTerrainAt(state.floor, nx, ny);
  if (_terrain) {
    state.runStats.terrainSteps[_terrain] = (state.runStats.terrainSteps[_terrain] ?? 0) + 1;
  }

  // ── Room Event Check ──
  if (!state._isStoryMode) {
    const currentRoom = getRoomAtPosition(state.floor, { x: nx, y: ny });
    if (currentRoom) {
      const roomEvent = checkForRoomEvent(state, currentRoom);
      if (roomEvent) {
        state.pendingRoomEvent = roomEvent;
        addMessage(state, `Something unusual in this chamber...`, MSG_COLOR.system);
        return true;
      }
    }
  }

  // ── Awareness-based discovery ──
  if (state.skills) {
    const awarenessBonus = state.skills.awareness - 10;
    if (awarenessBonus > 0 && Math.random() < awarenessBonus * 0.008) {
      const discoverySpots = [
        { x: nx + 1, y: ny }, { x: nx - 1, y: ny },
        { x: nx, y: ny + 1 }, { x: nx, y: ny - 1 },
      ].filter(p => {
        if (p.x < 0 || p.x >= state.floor.width || p.y < 0 || p.y >= state.floor.height) return false;
        const t = getTile(state.floor, p.x, p.y);
        return isWalkableTile(t) && !state.items.some(i => i.pos.x === p.x && i.pos.y === p.y);
      });
      if (discoverySpots.length > 0) {
        const spot = discoverySpots[Math.floor(Math.random() * discoverySpots.length)]!;
        const loot = randomItem(state.floorNumber, state.zone);
        state.items.push({ id: uid(), pos: spot, item: loot });
        const lootColor = loot.rarity && loot.rarity !== 'common' ? RARITY_DEFS[loot.rarity].color : MSG_COLOR.loot;
        addMessage(state, `Your keen awareness reveals a hidden ${loot.name}!`, lootColor);
      }
    }
  }

  // ── Hidden element discovery (skill-gated secrets) ──
  const hiddenFind = checkForHiddenElements(state);
  if (hiddenFind) {
    const result = discoverHiddenElement(state, hiddenFind.id);
    if (result) {
      addMessage(state, hiddenFind.description, '#ffdd00');
      if (result.reward) {
        if (result.reward.type === 'gold' && typeof result.reward.value === 'number') {
          state.score += result.reward.value;
          state.runStats.goldEarned += result.reward.value;
          addMessage(state, `Found ${result.reward.value} hidden gold!`, '#ffd700');
        } else {
          const loot = randomItem(state.floorNumber, state.zone);
          state.items.push({ id: uid(), pos: { x: nx, y: ny }, item: loot });
          addMessage(state, `Discovered ${loot.name}!`, MSG_COLOR.loot);
        }
      }
    }
  }

  const itemsHere = state.items.filter((i) => i.pos.x === nx && i.pos.y === ny);
  for (const mi of itemsHere) {
    if (mi.item.type === 'shrine') {
      const shrineElement = mi.item.element;
      const weaponElement = getAttackElement(state.player);
      if (shrineElement && weaponElement === shrineElement) {
        const elInfo = ELEMENT_INFO[shrineElement];
        const statOptions = ['attack', 'defense', 'speed', 'maxHp'] as const;
        const bonusStat = statOptions[Math.floor(Math.random() * statOptions.length)] ?? 'attack';
        const bonusAmount = bonusStat === 'maxHp' ? 5 : 2;
        state.player.stats[bonusStat] += bonusAmount;
        if (bonusStat === 'maxHp') state.player.stats.hp += bonusAmount;
        addMessage(state, `${elInfo.icon} The ${elInfo.name} Shrine resonates with your weapon! +${bonusAmount} ${bonusStat}!`, elInfo.color);
        state.items = state.items.filter((i) => i.id !== mi.id);
      } else if (shrineElement) {
        const elInfo = ELEMENT_INFO[shrineElement];
        addMessage(state, `${elInfo.icon} A ${elInfo.name} Shrine. It requires a ${elInfo.name.toLowerCase()} weapon to activate.`, '#888888');
      }
      continue;
    }
    if (mi.item.type === 'gold') {
      const goldValue = state.premiumActive ? mi.item.value * 2 : mi.item.value;
      state.score += goldValue;
      state.runStats.goldEarned += goldValue;
      addMessage(state, `Picked up ${goldValue} gold!${state.premiumActive ? ' ⭐' : ''}`, MSG_COLOR.loot);
    } else {
      if (state.player.inventory.length < 20) {
        state.player.inventory.push(mi.item);
        state.runStats.itemsFound++;
        const pickupColor = mi.item.rarity && mi.item.rarity !== 'common' ? RARITY_DEFS[mi.item.rarity].color : MSG_COLOR.loot;
        addMessage(state, `Picked up ${mi.item.name}`, pickupColor);
      } else {
        addMessage(state, `Inventory full! Can't pick up ${mi.item.name}`, MSG_COLOR.bad);
        continue;
      }
    }
    state.items = state.items.filter((i) => i.id !== mi.id);
  }

  // Check if player is on shop tile
  if (state.shop && nx === state.shop.pos.x && ny === state.shop.pos.y && state.shop.stock.length > 0) {
    addMessage(state, 'A shopkeeper! Browse their wares.', MSG_COLOR.system);
  }

  if (tile === Tile.StairsDown) {
    descend(state);
    return true;
  }

  processTurn(state);
  return true;
}

export function handleTapMove(state: GameState, targetX: number, targetY: number): boolean {
  if (state.gameOver) return false;

  const px = state.player.pos.x;
  const py = state.player.pos.y;

  if (targetX === px && targetY === py) return false;

  const range = getPlayerRange(state);

  // Check for ranged attack — if tapping on a visible monster at range
  if (range > 1) {
    const target = state.monsters.find(m => !m.isDead && m.pos.x === targetX && m.pos.y === targetY);
    if (target) {
      const dist = manhattan(state.player.pos, target.pos);
      if (dist > 1 && dist <= range && state.floor.visible[targetY]?.[targetX] && hasLOS(state, state.player.pos, target.pos)) {
        return rangedAttack(state, targetX, targetY);
      }
      // Monster is visible but out of range — step closer, and if we enter range, fire
      if (dist > range && state.floor.visible[targetY]?.[targetX]) {
        const isWalkableForPath = (x: number, y: number) => {
          if (x < 0 || x >= state.floor.width || y < 0 || y >= state.floor.height) return false;
          if (state.monsters.some((m) => !m.isDead && m.pos.x === x && m.pos.y === y)) return false;
          return isWalkableTile(getTile(state.floor, x, y));
        };
        // Pathfind to adjacent tile, then check if next step puts us in range
        const adj = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
        let bestAdj: { x: number; y: number } | null = null;
        let bestDist = Infinity;
        for (const d of adj) {
          const nx = targetX + d.x;
          const ny = targetY + d.y;
          if (!isWalkableForPath(nx, ny) && !(nx === px && ny === py)) continue;
          const d2 = manhattan({ x: px, y: py }, { x: nx, y: ny });
          if (d2 < bestDist) { bestDist = d2; bestAdj = { x: nx, y: ny }; }
        }
        const pathTarget = bestAdj ?? { x: targetX, y: targetY };
        const nextStep = findPath(state.player.pos, pathTarget, isWalkableForPath);
        if (nextStep) {
          // Simulate standing at nextStep and check if we'd be in range
          const newDist = manhattan(nextStep, target.pos);
          if (newDist > 1 && newDist <= range && hasLOS(state, nextStep, target.pos)) {
            // Move there, then the next tap will fire
            return movePlayer(state, nextStep.x - px, nextStep.y - py);
          }
          return movePlayer(state, nextStep.x - px, nextStep.y - py);
        }
      }
    }

    // Tapping an empty tile — if there's a visible monster already in range, fire at nearest one
    const inRangeMonsters = state.monsters.filter(m =>
      !m.isDead &&
      state.floor.visible[m.pos.y]?.[m.pos.x] &&
      manhattan(state.player.pos, m.pos) > 1 &&
      manhattan(state.player.pos, m.pos) <= range &&
      hasLOS(state, state.player.pos, m.pos)
    );
    if (inRangeMonsters.length > 0) {
      inRangeMonsters.sort((a, b) => manhattan(state.player.pos, a.pos) - manhattan(state.player.pos, b.pos));
      return rangedAttack(state, inRangeMonsters[0]!.pos.x, inRangeMonsters[0]!.pos.y);
    }
  }

  const dx = targetX - px;
  const dy = targetY - py;
  if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
    return movePlayer(state, dx, dy);
  }

  const isWalkable = (x: number, y: number) => {
    if (x < 0 || x >= state.floor.width || y < 0 || y >= state.floor.height) return false;
    if (state.monsters.some((m) => !m.isDead && m.pos.x === x && m.pos.y === y)) return false;
    return isWalkableTile(getTile(state.floor, x, y));
  };

  // If tapping on a monster (melee), pathfind to an adjacent tile so we
  // can then step into it and attack instead of blocking on the monster's tile.
  const tapTarget = state.monsters.find((m) => !m.isDead && m.pos.x === targetX && m.pos.y === targetY);
  if (tapTarget) {
    const adj = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
    let best: { x: number; y: number } | null = null;
    let bestDist = Infinity;
    for (const d of adj) {
      const nx = targetX + d.x;
      const ny = targetY + d.y;
      if (!isWalkable(nx, ny) && !(nx === px && ny === py)) continue;
      const dist = manhattan({ x: px, y: py }, { x: nx, y: ny });
      if (dist < bestDist) { bestDist = dist; best = { x: nx, y: ny }; }
    }
    if (best) {
      if (best.x === px && best.y === py) {
        // Already adjacent — attack directly
        return movePlayer(state, targetX - px, targetY - py);
      }
      const nextStep = findPath(state.player.pos, best, isWalkable);
      if (nextStep) return movePlayer(state, nextStep.x - px, nextStep.y - py);
    }
    // Fallback: try stepping directly toward the monster
    return movePlayer(state, targetX - px, targetY - py);
  }

  const next = findPath(state.player.pos, { x: targetX, y: targetY }, isWalkable);
  if (next) {
    return movePlayer(state, next.x - px, next.y - py);
  }

  return false;
}

// ─── Monster AI ───

function processBossAbility(state: GameState, boss: Entity, ability: BossAbility): boolean {
  switch (ability.type) {
    case 'summon': {
      const allDefs = [...MONSTER_DEFS, ...getNecropolisMonsters(getNecropolisState().communalDeaths)];
      const summonDef = allDefs.find(m => m.name === ability.monsterName);
      if (!summonDef) return false;
      let summoned = 0;
      for (let i = 0; i < ability.count; i++) {
        // Spawn near the boss
        for (let attempt = 0; attempt < 20; attempt++) {
          const sx = boss.pos.x + Math.floor(Math.random() * 5) - 2;
          const sy = boss.pos.y + Math.floor(Math.random() * 5) - 2;
          if (sx < 0 || sx >= state.floor.width || sy < 0 || sy >= state.floor.height) continue;
          if (!isWalkableTile(getTile(state.floor, sx, sy))) continue;
          if (state.monsters.some(m => !m.isDead && m.pos.x === sx && m.pos.y === sy)) continue;
          if (sx === state.player.pos.x && sy === state.player.pos.y) continue;
          state.monsters.push({
            id: uid(), pos: { x: sx, y: sy }, name: summonDef.name,
            char: summonDef.char, color: summonDef.color,
            stats: { ...summonDef.stats }, xp: summonDef.xpValue,
            level: state.floorNumber, inventory: [], equipment: {},
            isPlayer: false, isDead: false,
          });
          summoned++;
          break;
        }
      }
      if (summoned > 0) {
        addMessage(state, `${boss.name} summons ${summoned} ${ability.monsterName}${summoned > 1 ? 's' : ''}!`, MSG_COLOR.boss);
      }
      return summoned > 0;
    }
    case 'rage': {
      const hpPct = boss.stats.hp / boss.stats.maxHp;
      if (hpPct <= ability.hpThreshold && !boss.isEnraged) {
        boss.isEnraged = true;
        boss.stats.attack = Math.floor(boss.stats.attack * ability.atkMultiplier);
        addMessage(state, `${boss.name} enters a rage! Attack power surges!`, MSG_COLOR.boss);
        return true;
      }
      return false;
    }
    case 'heal': {
      if (boss.stats.hp < boss.stats.maxHp) {
        const healed = Math.min(ability.amount, boss.stats.maxHp - boss.stats.hp);
        boss.stats.hp += healed;
        addMessage(state, `${boss.name} heals for ${healed} HP!`, MSG_COLOR.boss);
        return true;
      }
      return false;
    }
    case 'aoe': {
      const dist = manhattan(boss.pos, state.player.pos);
      if (dist <= ability.radius) {
        state.player.stats.hp -= ability.damage;
        addMessage(state, `${boss.name}'s area attack hits you for ${ability.damage} damage!`, MSG_COLOR.boss);
        state.runStats.damageTaken += ability.damage;
        if (state.player.stats.hp <= 0) {
          state.player.isDead = true;
          state.player.stats.hp = 0;
          addMessage(state, 'You have been slain!', MSG_COLOR.bad);
          state.gameOver = true;
        }
        // Also damage mercenaries in range
        for (const merc of state.mercenaries) {
          if (!merc.isDead && manhattan(boss.pos, merc.pos) <= ability.radius) {
            merc.stats.hp -= ability.damage;
            if (merc.stats.hp <= 0) {
              merc.isDead = true;
              addMessage(state, `${merc.mercName ?? merc.name} is slain by the blast!`, MSG_COLOR.bad);
            }
          }
        }
        return true;
      }
      return false;
    }
    case 'teleport': {
      // Teleport near the player
      for (let attempt = 0; attempt < 30; attempt++) {
        const tx = state.player.pos.x + Math.floor(Math.random() * 5) - 2;
        const ty = state.player.pos.y + Math.floor(Math.random() * 5) - 2;
        if (tx < 0 || tx >= state.floor.width || ty < 0 || ty >= state.floor.height) continue;
        if (!isWalkableTile(getTile(state.floor, tx, ty))) continue;
        if (state.monsters.some(m => m !== boss && !m.isDead && m.pos.x === tx && m.pos.y === ty)) continue;
        if (tx === state.player.pos.x && ty === state.player.pos.y) continue;
        boss.pos.x = tx;
        boss.pos.y = ty;
        addMessage(state, `${boss.name} teleports nearby!`, MSG_COLOR.boss);
        return true;
      }
      return false;
    }
    case 'terrain_attack': {
      const dist = manhattan(boss.pos, state.player.pos);
      if (dist <= ability.radius + 2) {
        const placed = placeTerrain(state, state.player.pos.x, state.player.pos.y, ability.terrain, ability.radius, ability.count);
        if (placed > 0) {
          const terrainNames: Record<string, string> = {
            lava: 'fire', water: 'electricity', poison: 'toxic pools',
            ice: 'frost', shadow: 'darkness', mud: 'mud',
            brimstone: 'brimstone', void_rift: 'void rifts', spore: 'spores',
            crystal: 'crystals', frozen: 'permafrost', holy: 'holy light',
            tall_grass: 'vines', mycelium: 'fungus',
          };
          addMessage(state, `${boss.name} engulfs the area in ${terrainNames[ability.terrain] ?? ability.terrain}!`, MSG_COLOR.boss);
          return true;
        }
      }
      return false;
    }
    case 'multi': {
      let used = false;
      for (const sub of ability.abilities) {
        if (processBossAbility(state, boss, sub)) {
          used = true;
          break; // Only use one ability per turn
        }
      }
      return used;
    }
  }
}

function processMonsterTurn(state: GameState, monster: Entity) {
  if (monster.isDead) return;

  // Impregnated monster effects (puke, DOT)
  if (state.playerClass === 'impregnar') {
    processImpregnatedMonster(state, monster);
    if (monster.isDead) {
      onImpregnatedDeath(state, monster);
      return;
    }
  }

  // Befriended creatures don't attack
  if (monster.isBefriended || monster.isHostile === false) return;

  const dist = manhattan(monster.pos, state.player.pos);
  const aggroRange = monster.aggroRange ?? 8;
  if (dist > aggroRange) return;
  // LOS check — monsters can't detect the player through walls
  if (!hasLOS(state, monster.pos, state.player.pos)) return;
  // Monsters only act if the player could see them (within FOV)
  if (!(state.floor.visible[monster.pos.y]?.[monster.pos.x])) return;

  // Boss special abilities
  if (monster.isBoss && monster.bossAbility && dist <= 6) {
    // Decrement cooldown
    if (monster.bossAbilityCooldown && monster.bossAbilityCooldown > 0) {
      monster.bossAbilityCooldown--;
    } else {
      // Try to use ability
      const used = processBossAbility(state, monster, monster.bossAbility);
      if (used) {
        // Set cooldown based on ability type
        const cd = monster.bossAbility.type === 'multi' ? 3 :
          ('cooldown' in monster.bossAbility ? (monster.bossAbility as { cooldown: number }).cooldown : 4);
        monster.bossAbilityCooldown = cd;
        if (state.gameOver) return;
        // Boss still gets to move/attack after some abilities
        if (monster.bossAbility.type === 'rage') {
          // Rage doesn't consume the turn
        } else {
          return; // Ability used, turn spent
        }
      }
    }
  }

  // Monster innate passive abilities — self-heal and call-for-help
  if (monster.abilities && !monster.isBoss) {
    if (!monster.abilityCooldowns) monster.abilityCooldowns = {};

    // Decrement ability cooldowns
    for (const key of Object.keys(monster.abilityCooldowns)) {
      if (monster.abilityCooldowns[key]! > 0) monster.abilityCooldowns[key]!--;
    }

    for (const ability of monster.abilities) {
      if (ability.type === 'selfHeal') {
        const cdKey = 'selfHeal';
        if (monster.stats.hp / monster.stats.maxHp <= ability.hpThreshold
            && (monster.abilityCooldowns[cdKey] ?? 0) <= 0) {
          monster.stats.hp = Math.min(monster.stats.maxHp, monster.stats.hp + ability.amount);
          monster.abilityCooldowns[cdKey] = ability.cooldown;
          addMessage(state, `${monster.name} heals itself!`, MSG_COLOR.bad);
        }
      }
      if (ability.type === 'callForHelp' && dist <= 6) {
        const cdKey = 'callForHelp';
        // Cap alive monsters at 20 to prevent infinite swarm chains
        const aliveCount = state.monsters.filter(m => !m.isDead).length;
        if (aliveCount < 20 && Math.random() < ability.chance && (monster.abilityCooldowns[cdKey] ?? 0) <= 0) {
          // Spawn a helper monster near this monster
          const allDefs = [...MONSTER_DEFS];
          const helperDef = allDefs.find(m => m.name === ability.monsterName);
          if (helperDef) {
            // Find a walkable spot near the calling monster
            const offsets = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,1],[-1,1],[1,-1]];
            for (const [dx, dy] of offsets) {
              const nx = monster.pos.x + dx!;
              const ny = monster.pos.y + dy!;
              if (nx >= 0 && nx < state.floor.width && ny >= 0 && ny < state.floor.height
                  && isWalkableTile(getTile(state.floor, nx, ny))
                  && !state.monsters.some(m => !m.isDead && m.pos.x === nx && m.pos.y === ny)
                  && !(state.player.pos.x === nx && state.player.pos.y === ny)) {
                const scale = 1 + (state.floorNumber - helperDef.minFloor) * 0.20;
                const helper: Entity = {
                  id: uid(),
                  pos: { x: nx, y: ny },
                  name: helperDef.name,
                  char: helperDef.char,
                  color: helperDef.color,
                  stats: {
                    hp: Math.round(helperDef.stats.hp * scale),
                    maxHp: Math.round(helperDef.stats.maxHp * scale),
                    attack: Math.round(helperDef.stats.attack * scale),
                    defense: Math.round(helperDef.stats.defense * scale),
                    speed: helperDef.stats.speed,
                  },
                  xp: helperDef.xpValue,
                  level: state.floorNumber,
                  inventory: [],
                  equipment: {},
                  isPlayer: false,
                  isDead: false,
                };
                if (helperDef.terrainOnHit) helper.terrainOnHit = helperDef.terrainOnHit;
                // Give abilities but strip callForHelp to prevent infinite swarm chains
                if (helperDef.abilities) {
                  helper.abilities = helperDef.abilities.filter(a => a.type !== 'callForHelp');
                  if (helper.abilities.length === 0) helper.abilities = undefined;
                }
                state.monsters.push(helper);
                addMessage(state, `${monster.name} calls for help! A ${helperDef.name} appears!`, MSG_COLOR.bad);
                monster.abilityCooldowns[cdKey] = ability.cooldown;
                break;
              }
            }
          }
        }
      }
    }
  }

  // Melee attack if adjacent
  if (dist === 1) {
    attackEntity(state, monster, state.player);
    return;
  }

  // Ranged attack — if monster has range and player is within range + LOS
  const monRange = getMonsterRange(monster);
  if (monRange > 1 && dist <= monRange && hasLOS(state, monster.pos, state.player.pos)) {
    // Spawn projectile visual
    if (!state.projectiles) state.projectiles = [];
    state.projectiles.push({
      from: { ...monster.pos },
      to: { ...state.player.pos },
      char: monster.projectileChar ?? '•',
      color: monster.projectileColor ?? monster.color,
    });
    attackEntity(state, monster, state.player);
    return;
  }

  // Move toward the player
  const isWalkable = (x: number, y: number) => {
    if (x < 0 || x >= state.floor.width || y < 0 || y >= state.floor.height) return false;
    if (x === state.player.pos.x && y === state.player.pos.y) return true;
    if (state.monsters.some((m) => m !== monster && !m.isDead && m.pos.x === x && m.pos.y === y)) return false;
    return isWalkableTile(getTile(state.floor, x, y));
  };

  // Ranged monsters with LOS already attacked above. If in range but no LOS, fall through to move toward player to find a shot.

  const next = findPath(monster.pos, state.player.pos, isWalkable, 15);
  if (next) {
    if (next.x === state.player.pos.x && next.y === state.player.pos.y) {
      attackEntity(state, monster, state.player);
    } else {
      monster.pos.x = next.x;
      monster.pos.y = next.y;

      // Terrain effects on monsters — holy ground still hurts undead
      const mTerrain = getTerrainAt(state.floor, monster.pos.x, monster.pos.y);
      if (mTerrain === 'holy') {
        // Undead take damage on holy ground
        const undeadNames = ['Skeleton', 'Zombie', 'Wraith', 'Vampire', 'Vampire Lord', 'Lich Emperor'];
        if (undeadNames.includes(monster.name)) {
          monster.stats.hp -= 3;
          if (monster.stats.hp <= 0) {
            monster.isDead = true;
            addMessage(state, `${monster.name} is destroyed by holy ground!`, '#ffdd66');
            state.score += monster.xp;
            state.runStats.kills++;
            gainXP(state, monster.xp);
          }
        }
      }
    }
  }
}

// ─── Turn processing ───

export function processTurn(state: GameState) {
  gpStart('engine:processTurn');
  state.turn++;

  // Dino transformation tick-down
  if (state.dinoTransformTurns && state.dinoTransformTurns > 0 && !state.dinoPermanent) {
    state.dinoTransformTurns--;
    if (state.dinoTransformTurns <= 0) {
      state.dinoTransformTurns = 0;
      state.player.stats.attack -= 8;
      state.player.stats.defense -= 4;
      state.player.stats.speed += 3;
      state.player.stats.maxHp -= 20;
      state.player.stats.hp = Math.min(state.player.stats.hp, state.player.stats.maxHp);
      state.player.char = '@';
      addMessage(state, 'The transformation fades. You return to human form.', '#cc8844');
    } else if (state.dinoTransformTurns <= 3) {
      addMessage(state, `Dino form fading... ${state.dinoTransformTurns} turns left.`, '#ffaa44');
    }
  }

  // General transformation tick-down
  if (state._transformTurns && state._transformTurns > 0 && !state._transformPermanent && state._activeTransformId) {
    state._transformTurns--;
    if (state._transformTurns <= 0) {
      const tDef = getTransformDef(state._activeTransformId);
      if (tDef) {
        state.player.stats.attack -= tDef.statMods.attack ?? 0;
        state.player.stats.defense -= tDef.statMods.defense ?? 0;
        state.player.stats.speed -= tDef.statMods.speed ?? 0;
        state.player.stats.maxHp -= tDef.statMods.maxHp ?? 0;
        state.player.stats.hp = Math.min(state.player.stats.hp, state.player.stats.maxHp);
      }
      state.player.char = '@';
      state._activeTransformId = null;
      state._transformTurns = 0;
      addMessage(state, 'The transformation fades. You return to human form.', '#cc8844');
    } else if (state._transformTurns <= 3) {
      addMessage(state, `Transformation fading... ${state._transformTurns} turns left.`, '#ffaa44');
    }
  }

  const pStats = getEffectiveStats(state.player);

  // ── Process player status effects ──
  if (state.player.statusEffects && state.player.statusEffects.length > 0) {
    for (const effect of state.player.statusEffects) {
      switch (effect.type) {
        case 'poison':
          if (effect.damage) {
            state.player.stats.hp -= effect.damage;
            addMessage(state, `Poison deals ${effect.damage} damage!`, '#33cc11');
          }
          break;
        case 'bleed':
          if (effect.damage) {
            state.player.stats.hp -= effect.damage;
            addMessage(state, `Bleeding deals ${effect.damage} damage!`, '#ff4444');
          }
          break;
        case 'stun':
          addMessage(state, 'You are stunned and cannot act!', '#ffff44');
          break;
        case 'freeze':
          addMessage(state, 'You are frozen!', '#88ccff');
          break;
      }
      effect.turnsRemaining--;
    }
    // Remove expired effects
    state.player.statusEffects = state.player.statusEffects.filter(e => e.turnsRemaining > 0);

    // Check for death from status effects
    if (state.player.stats.hp <= 0) {
      state.player.isDead = true;
      addMessage(state, 'You have died!', MSG_COLOR.bad);
      state.gameOver = true;
      return;
    }
  }

  // Affliction progress messages (random chance each turn)
  if (state.activeAffliction && !state.activeAffliction.cured) {
    // Small chance (2%) to show a progress message each turn
    if (Math.random() < 0.02) {
      const msg = getRandomProgressMessage(state);
      if (msg) {
        addMessage(state, msg, '#aa44aa');
      }
    }
  }

  // Necromancer — Wither: enemies within 2 tiles lose 1 defense permanently each turn
  if (hasChosenAbility(state, 'nec_wither')) {
    for (const m of state.monsters) {
      if (!m.isDead && manhattan(m.pos, state.player.pos) <= 2 && m.stats.defense > 0) {
        m.stats.defense = Math.max(0, m.stats.defense - 1);
      }
    }
  }

  // Death Aura — necromancer deals 1 damage to nearby enemies each turn
  if (hasPassive(state, 'Death Aura')) {
    for (const m of state.monsters) {
      if (!m.isDead && manhattan(m.pos, state.player.pos) <= 2) {
        m.stats.hp -= 1;
        if (m.stats.hp <= 0) {
          m.isDead = true;
          addMessage(state, `Death Aura kills ${m.name}!`, '#aa44dd');
          state.score += m.xp;
          state.runStats.kills++;
          const _mbn = m.baseName ?? m.name; state.runStats.monsterKills[_mbn] = (state.runStats.monsterKills[_mbn] ?? 0) + 1;
          gainXP(state, m.xp);
        }
      }
    }
    state.monsters = state.monsters.filter((m) => !m.isDead);
  }

  // ── Terrain per-turn effects on player ──
  const playerTerrain = getTerrainAt(state.floor, state.player.pos.x, state.player.pos.y);
  // Lava and poison are now damage buffs, not damage sources — no per-turn damage
  if (playerTerrain === 'holy') {
    const heal = Math.min(1, state.player.stats.maxHp - state.player.stats.hp);
    if (heal > 0) {
      state.player.stats.hp += heal;
    }
  }
  // Brimstone, void_rift, and spore are damage amplifiers — no per-turn damage
  if (playerTerrain === 'mycelium') {
    const heal = Math.min(1, state.player.stats.maxHp - state.player.stats.hp);
    if (heal > 0) {
      state.player.stats.hp += heal;
    }
  }

  // Mage — Arcane Power: heal 2 HP per turn when standing on any terrain tile
  if (hasChosenAbility(state, 'mag_arcane_power') && playerTerrain) {
    const heal = Math.min(2, state.player.stats.maxHp - state.player.stats.hp);
    if (heal > 0) {
      state.player.stats.hp += heal;
      addMessage(state, `Arcane Power draws energy from the terrain! +${heal} HP`, '#cc77ff');
    }
  }

  // Ranger — Nature Bond: heal 2 HP on tall grass or mycelium
  if (hasChosenAbility(state, 'rng_nature_bond') && (playerTerrain === 'tall_grass' || playerTerrain === 'mycelium')) {
    const heal = Math.min(2, state.player.stats.maxHp - state.player.stats.hp);
    if (heal > 0) {
      state.player.stats.hp += heal;
    }
  }

  // Mage — Mana Regeneration: heal 1 HP every 5 turns
  if (hasChosenAbility(state, 'mag_mana_regen') && state.turn % 5 === 0) {
    const heal = Math.min(1, state.player.stats.maxHp - state.player.stats.hp);
    if (heal > 0) {
      state.player.stats.hp += heal;
    }
  }

  // Paladin — Divine Light: heal 3 HP every 6 turns (buffed from 2)
  if (hasPassive(state, 'Divine Light') && state.turn % 6 === 0) {
    const heal = Math.min(3, state.player.stats.maxHp - state.player.stats.hp);
    if (heal > 0) {
      state.player.stats.hp += heal;
    }
  }

  // Revenant — Life Tap: heal 2 HP per turn while below 30% HP
  if (hasChosenAbility(state, 'rev_life_tap') && state.player.stats.hp / state.player.stats.maxHp < 0.3) {
    const heal = Math.min(2, state.player.stats.maxHp - state.player.stats.hp);
    if (heal > 0) {
      state.player.stats.hp += heal;
    }
  }

  // Tick down Righteous Fury stacks
  const furyTickExt = state as GameState & { _furyStacks?: number; _furyTurnsLeft?: number };
  if ((furyTickExt._furyTurnsLeft ?? 0) > 0) {
    furyTickExt._furyTurnsLeft!--;
    if (furyTickExt._furyTurnsLeft! <= 0) {
      furyTickExt._furyStacks = 0;
    }
  }

  // Death Knight — Unholy Resilience: regen 1 HP per turn when below 50% HP
  if (hasPassive(state, 'Unholy Resilience') && state.player.stats.hp < state.player.stats.maxHp * 0.5) {
    const dkRegen = Math.min(1, state.player.stats.maxHp - state.player.stats.hp);
    if (dkRegen > 0) {
      state.player.stats.hp += dkRegen;
    }
  }

  // Warrior — Rage decay: -5 per turn when out of combat (not hit this turn)
  if (state.playerClass === 'warrior') {
    const rageDecayExt = state as GameState & { _rage?: number; _hitThisTurn?: boolean };
    if ((rageDecayExt._rage ?? 0) > 0 && !rageDecayExt._hitThisTurn) {
      rageDecayExt._rage = Math.max(0, (rageDecayExt._rage ?? 0) - 5);
    }
  }

  // Rogue — Shadow Step cooldown tick
  if (state.playerClass === 'rogue') {
    const shadowExt = state as GameState & { _shadowCooldown?: number };
    if ((shadowExt._shadowCooldown ?? 0) > 0) {
      shadowExt._shadowCooldown!--;
    }
  }

  // Mage — Arcane Blast cooldown tick
  if (state.playerClass === 'mage') {
    const blastExt = state as GameState & { _blastCooldown?: number };
    if ((blastExt._blastCooldown ?? 0) > 0) {
      blastExt._blastCooldown!--;
    }
  }

  // Ranger — Hunter's Mark cooldown tick
  if (state.playerClass === 'ranger') {
    const markExt = state as GameState & { _markCooldown?: number };
    if ((markExt._markCooldown ?? 0) > 0) {
      markExt._markCooldown!--;
    }
  }

  // Necromancer — Skeleton Summon cooldown tick
  if (state.playerClass === 'necromancer') {
    const skeleExt = state as GameState & { _skeletonCooldown?: number };
    if ((skeleExt._skeletonCooldown ?? 0) > 0) {
      skeleExt._skeletonCooldown!--;
    }
  }

  // Impregnar — Impregnate cooldown tick
  if (state.playerClass === 'impregnar') {
    const impExt = state as GameState & { _impregCooldown?: number };
    if ((impExt._impregCooldown ?? 0) > 0) {
      impExt._impregCooldown!--;
    }
  }

  if (state.playerClass === 'death_knight') {
    const dkExt = state as GameState & { _dkCoilCooldown?: number };
    if ((dkExt._dkCoilCooldown ?? 0) > 0) {
      dkExt._dkCoilCooldown!--;
    }
  }

  // Generated Class — Resource regen and cooldown tick
  if (state.playerClass === 'generated') {
    const gen = getActiveGeneratedClass();
    if (gen) {
      const genExt = state as GameState & { _genResource?: number; _genAbilityCooldown?: number };
      
      // Cooldown tick
      if ((genExt._genAbilityCooldown ?? 0) > 0) {
        genExt._genAbilityCooldown!--;
      }
      
      // Resource regeneration based on regen method
      const currentResource = genExt._genResource ?? gen.resource.startingAmount;
      if (currentResource < gen.resource.max) {
        switch (gen.resource.regenMethod) {
          case 'per_turn':
            genExt._genResource = Math.min(gen.resource.max, currentResource + gen.resource.regenAmount);
            break;
          case 'on_kill':
            // Handled in killEnemy callback
            break;
          // Other regen methods handled elsewhere
        }
      }
      
      // Resource decay
      if (gen.resource.decayMethod === 'per_turn' && gen.resource.decayAmount) {
        genExt._genResource = Math.max(0, (genExt._genResource ?? currentResource) - gen.resource.decayAmount);
      }
    }
  }

  // ── Legacy Ability cooldown ticks + auto-trigger abilities ──
  const legTurn = state as GameState & LegacyAbilityState;
  if (legTurn._legacyAbilities && legTurn._legacyAbilities.length > 0) {
    // Cooldown ticks
    if ((legTurn._legacyBlockCD ?? 0) > 0) legTurn._legacyBlockCD!--;
    if ((legTurn._legacyWallCD ?? 0) > 0) legTurn._legacyWallCD!--;
    if ((legTurn._legacyReflectCD ?? 0) > 0) {
      legTurn._legacyReflectCD!--;
      if (legTurn._legacyReflectCD! <= 0) legTurn._legacyReflect = true;
    }
    if ((legTurn._legacyDodgeCD ?? 0) > 0) legTurn._legacyDodgeCD!--;
    if ((legTurn._legacyCritCD ?? 0) > 0) {
      legTurn._legacyCritCD!--;
      if (legTurn._legacyCritCD! <= 0) legTurn._legacyCrit = true;
    }
    if ((legTurn._legacyVanishCD ?? 0) > 0) legTurn._legacyVanishCD!--;
    if ((legTurn._legacyBurstCD ?? 0) > 0) legTurn._legacyBurstCD!--;
    if ((legTurn._legacyBarrierCD ?? 0) > 0) {
      legTurn._legacyBarrierCD!--;
      if (legTurn._legacyBarrierCD! <= 0 && (legTurn._legacyBarrier ?? 0) <= 0 && hasLegacyAbility(state, 'legacy_mage_shield')) {
        legTurn._legacyBarrier = 15;
        addMessage(state, '\u{1F52E} Mana Barrier reforms!', '#e0b0ff');
      }
    }
    if ((legTurn._legacyNovaCD ?? 0) > 0) legTurn._legacyNovaCD!--;
    if ((legTurn._legacyPierceCD ?? 0) > 0) {
      legTurn._legacyPierceCD!--;
      if (legTurn._legacyPierceCD! <= 0) legTurn._legacyPierce = true;
    }
    if ((legTurn._legacyMultiCD ?? 0) > 0) legTurn._legacyMultiCD!--;
    if ((legTurn._legacyRainCD ?? 0) > 0) legTurn._legacyRainCD!--;
    if ((legTurn._legacyHealCD ?? 0) > 0) legTurn._legacyHealCD!--;
    if ((legTurn._legacyAuraCD ?? 0) > 0) legTurn._legacyAuraCD!--;
    if ((legTurn._legacyPalJudgeCD ?? 0) > 0) legTurn._legacyPalJudgeCD!--;
    if ((legTurn._legacyDrainCD ?? 0) > 0) legTurn._legacyDrainCD!--;
    if ((legTurn._legacyEruptionCD ?? 0) > 0) legTurn._legacyEruptionCD!--;
    if ((legTurn._legacyCurseCD ?? 0) > 0) legTurn._legacyCurseCD!--;

    // Tick down active duration abilities
    if ((legTurn._legacyWallTurns ?? 0) > 0) legTurn._legacyWallTurns!--;
    if ((legTurn._legacyDodgeTurns ?? 0) > 0) legTurn._legacyDodgeTurns!--;
    if ((legTurn._legacyVanishTurns ?? 0) > 0) legTurn._legacyVanishTurns!--;
    if ((legTurn._legacyDrainTurns ?? 0) > 0) legTurn._legacyDrainTurns!--;
    if ((legTurn._legacyCurseTurns ?? 0) > 0) legTurn._legacyCurseTurns!--;

    // Paladin — Blessed Aura: regen 3 HP per turn while active
    if ((legTurn._legacyAuraTurns ?? 0) > 0) {
      const heal = Math.min(3, state.player.stats.maxHp - state.player.stats.hp);
      if (heal > 0) {
        state.player.stats.hp += heal;
        addMessage(state, `\u2728 Blessed Aura restores ${heal} HP!`, '#e0b0ff');
      }
      legTurn._legacyAuraTurns!--;
    }

    // Hellborn — Death Curse: all nearby enemies take 2 damage per turn
    if ((legTurn._legacyCurseTurns ?? 0) > 0) {
      for (const m of state.monsters) {
        if (!m.isDead && manhattan(m.pos, state.player.pos) <= 5) {
          m.stats.hp -= 2;
          if (m.stats.hp <= 0) {
            m.isDead = true;
            addMessage(state, `\u{1F480} Death Curse kills ${m.name}!`, '#e0b0ff');
            state.score += m.xp;
            state.runStats.kills++;
            const _dcn = m.baseName ?? m.name; state.runStats.monsterKills[_dcn] = (state.runStats.monsterKills[_dcn] ?? 0) + 1;
            gainXP(state, m.xp);
          }
        }
      }
      state.monsters = state.monsters.filter(m => !m.isDead);
    }

    // ── Auto-trigger abilities when enemies are nearby ──
    const nearbyEnemies = state.monsters.filter(m => !m.isDead && manhattan(m.pos, state.player.pos) <= 3);

    // Warrior — Divine Wall: auto-activate when surrounded by 2+ enemies
    if (hasLegacyAbility(state, 'legacy_warrior_wall') && (legTurn._legacyWallCD ?? 0) <= 0 && (legTurn._legacyWallTurns ?? 0) <= 0 && nearbyEnemies.length >= 2) {
      legTurn._legacyWallTurns = 3;
      legTurn._legacyWallCD = 90;
      addMessage(state, '\u{1F6E1}\uFE0F Divine Wall activates! Blocking all attacks!', '#e0b0ff');
    }

    // Rogue — Shadow Dodge: auto-activate when an enemy is adjacent
    if (hasLegacyAbility(state, 'legacy_rogue_evade') && (legTurn._legacyDodgeCD ?? 0) <= 0 && (legTurn._legacyDodgeTurns ?? 0) <= 0) {
      const adjacent = state.monsters.some(m => !m.isDead && manhattan(m.pos, state.player.pos) <= 1);
      if (adjacent) {
        legTurn._legacyDodgeTurns = 5;
        legTurn._legacyDodgeCD = 40;
        addMessage(state, '\u{1F4A8} Shadow Dodge activates!', '#e0b0ff');
      }
    }

    // Rogue — Vanish: auto-activate when below 25% HP and enemy nearby
    if (hasLegacyAbility(state, 'legacy_rogue_vanish') && (legTurn._legacyVanishCD ?? 0) <= 0 && (legTurn._legacyVanishTurns ?? 0) <= 0 && nearbyEnemies.length > 0 && state.player.stats.hp / state.player.stats.maxHp < 0.25) {
      legTurn._legacyVanishTurns = 3;
      legTurn._legacyVanishCD = 60;
      addMessage(state, '\u{1F47B} You vanish from sight!', '#e0b0ff');
    }

    // Mage — Arcane Burst: AoE 8 damage when 2+ enemies within 2 tiles
    if (hasLegacyAbility(state, 'legacy_mage_burst') && (legTurn._legacyBurstCD ?? 0) <= 0) {
      const closeEnemies = state.monsters.filter(m => !m.isDead && manhattan(m.pos, state.player.pos) <= 2);
      if (closeEnemies.length >= 2) {
        legTurn._legacyBurstCD = 30;
        for (const m of closeEnemies) {
          m.stats.hp -= 8;
          if (m.stats.hp <= 0) {
            m.isDead = true;
            addMessage(state, `\u{1F4A5} Arcane Burst kills ${m.name}!`, '#e0b0ff');
            state.score += m.xp;
            state.runStats.kills++;
            const _abn = m.baseName ?? m.name; state.runStats.monsterKills[_abn] = (state.runStats.monsterKills[_abn] ?? 0) + 1;
            gainXP(state, m.xp);
          }
        }
        addMessage(state, `\u{1F4A5} Arcane Burst hits ${closeEnemies.length} enemies for 8 damage!`, '#e0b0ff');
        state.monsters = state.monsters.filter(m => !m.isDead);
      }
    }

    // Mage — Supernova: AoE 20 damage to all visible enemies when 3+ nearby
    if (hasLegacyAbility(state, 'legacy_mage_nova') && (legTurn._legacyNovaCD ?? 0) <= 0) {
      const visibleEnemies = state.monsters.filter(m => !m.isDead && state.floor.visible[m.pos.y]?.[m.pos.x]);
      if (visibleEnemies.length >= 3) {
        legTurn._legacyNovaCD = 60;
        for (const m of visibleEnemies) {
          m.stats.hp -= 20;
          if (m.stats.hp <= 0) {
            m.isDead = true;
            state.score += m.xp;
            state.runStats.kills++;
            const _svn = m.baseName ?? m.name; state.runStats.monsterKills[_svn] = (state.runStats.monsterKills[_svn] ?? 0) + 1;
            gainXP(state, m.xp);
          }
        }
        addMessage(state, `\u2604\uFE0F Supernova obliterates ${visibleEnemies.length} enemies for 20 damage!`, '#e0b0ff');
        state.monsters = state.monsters.filter(m => !m.isDead);
      }
    }

    // Ranger — Arrow Rain: AoE 5 damage to all visible enemies
    if (hasLegacyAbility(state, 'legacy_ranger_rain') && (legTurn._legacyRainCD ?? 0) <= 0 && nearbyEnemies.length >= 2) {
      const visibleEnemies = state.monsters.filter(m => !m.isDead && state.floor.visible[m.pos.y]?.[m.pos.x]);
      if (visibleEnemies.length >= 2) {
        legTurn._legacyRainCD = 40;
        for (const m of visibleEnemies) {
          m.stats.hp -= 5;
          if (m.stats.hp <= 0) {
            m.isDead = true;
            state.score += m.xp;
            state.runStats.kills++;
            const _arn = m.baseName ?? m.name; state.runStats.monsterKills[_arn] = (state.runStats.monsterKills[_arn] ?? 0) + 1;
            gainXP(state, m.xp);
          }
        }
        addMessage(state, `\u{1F3F9} Arrow Rain pelts ${visibleEnemies.length} enemies for 5 damage!`, '#e0b0ff');
        state.monsters = state.monsters.filter(m => !m.isDead);
      }
    }

    // Paladin — Holy Mend: auto-heal 10 HP when below 40% HP
    if (hasLegacyAbility(state, 'legacy_paladin_heal') && (legTurn._legacyHealCD ?? 0) <= 0 && state.player.stats.hp / state.player.stats.maxHp < 0.4) {
      legTurn._legacyHealCD = 30;
      const heal = Math.min(10, state.player.stats.maxHp - state.player.stats.hp);
      if (heal > 0) {
        state.player.stats.hp += heal;
        addMessage(state, `\u2728 Holy Mend restores ${heal} HP!`, '#e0b0ff');
      }
    }

    // Paladin — Blessed Aura: auto-activate when below 60% HP
    if (hasLegacyAbility(state, 'legacy_paladin_aura') && (legTurn._legacyAuraCD ?? 0) <= 0 && (legTurn._legacyAuraTurns ?? 0) <= 0 && state.player.stats.hp / state.player.stats.maxHp < 0.6) {
      legTurn._legacyAuraTurns = 5;
      legTurn._legacyAuraCD = 40;
      addMessage(state, '\u2728 Blessed Aura surrounds you!', '#e0b0ff');
    }

    // Paladin — Divine Judgment: AoE 12 holy damage to all nearby enemies
    if (hasLegacyAbility(state, 'legacy_paladin_judgment') && (legTurn._legacyPalJudgeCD ?? 0) <= 0 && nearbyEnemies.length >= 2) {
      legTurn._legacyPalJudgeCD = 50;
      for (const m of nearbyEnemies) {
        m.stats.hp -= 12;
        if (m.stats.hp <= 0) {
          m.isDead = true;
          state.score += m.xp;
          state.runStats.kills++;
          const _djn = m.baseName ?? m.name; state.runStats.monsterKills[_djn] = (state.runStats.monsterKills[_djn] ?? 0) + 1;
          gainXP(state, m.xp);
        }
      }
      addMessage(state, `\u2694\uFE0F Divine Judgment smites ${nearbyEnemies.length} enemies for 12 holy damage!`, '#e0b0ff');
      state.monsters = state.monsters.filter(m => !m.isDead);
    }

    // Hellborn — Soul Siphon: auto-activate when in combat and below 50% HP
    if (hasLegacyAbility(state, 'legacy_hellborn_drain') && (legTurn._legacyDrainCD ?? 0) <= 0 && (legTurn._legacyDrainTurns ?? 0) <= 0 && nearbyEnemies.length > 0 && state.player.stats.hp / state.player.stats.maxHp < 0.5) {
      legTurn._legacyDrainTurns = 5;
      legTurn._legacyDrainCD = 40;
      addMessage(state, '\u{1F9DB} Soul Siphon activates! Draining life force...', '#e0b0ff');
    }

    // Hellborn — Hellfire Eruption: AoE 15 fire damage when 2+ enemies within 2 tiles
    if (hasLegacyAbility(state, 'legacy_hellborn_eruption') && (legTurn._legacyEruptionCD ?? 0) <= 0) {
      const closeEnemies = state.monsters.filter(m => !m.isDead && manhattan(m.pos, state.player.pos) <= 2);
      if (closeEnemies.length >= 2) {
        legTurn._legacyEruptionCD = 35;
        for (const m of closeEnemies) {
          m.stats.hp -= 15;
          if (m.stats.hp <= 0) {
            m.isDead = true;
            state.score += m.xp;
            state.runStats.kills++;
            const _hen = m.baseName ?? m.name; state.runStats.monsterKills[_hen] = (state.runStats.monsterKills[_hen] ?? 0) + 1;
            gainXP(state, m.xp);
          }
        }
        addMessage(state, `\u{1F525} Hellfire Eruption scorches ${closeEnemies.length} enemies for 15 damage!`, '#e0b0ff');
        state.monsters = state.monsters.filter(m => !m.isDead);
      }
    }

    // Hellborn — Death Curse: auto-activate when 3+ enemies nearby
    if (hasLegacyAbility(state, 'legacy_hellborn_curse') && (legTurn._legacyCurseCD ?? 0) <= 0 && (legTurn._legacyCurseTurns ?? 0) <= 0 && nearbyEnemies.length >= 3) {
      legTurn._legacyCurseTurns = 5;
      legTurn._legacyCurseCD = 50;
      addMessage(state, '\u{1F480} Death Curse! All nearby enemies are cursed!', '#e0b0ff');
    }
  }

  // Reset vengeful tracking (it lasts for 1 turn after being hit)
  const stateExt = state as GameState & { _wasHitLastTurn?: boolean; _hitThisTurn?: boolean };
  stateExt._wasHitLastTurn = stateExt._hitThisTurn ?? false;
  stateExt._hitThisTurn = false;

  // Hunger drain — reduced on early floors so first-timers don't starve while learning
  let hungerRate = HUNGER_PER_TURN;
  if (state._isStoryMode) hungerRate *= 0.25;
  if (state.floorNumber <= 2) hungerRate *= 0.5;
  if (state.premiumActive) hungerRate *= 0.5;
  if (hasPassive(state, 'Iron Will')) hungerRate *= 0.7;
  // Survival skill — reduce hunger drain by 2% per point above 10
  if (state.skills) {
    const survBonus = state.skills.survival - 10;
    if (survBonus > 0) hungerRate *= Math.max(0.7, 1 - survBonus * 0.02);
  }
  state.hunger.current = Math.round(Math.max(0, state.hunger.current - hungerRate) * 10) / 10;

  if (state.hunger.current <= STARVING_THRESHOLD) {
    if (state._isStoryMode) {
      if (state.turn % 15 === 0) addMessage(state, 'You are famished. Find food to regain strength.', '#e8a844');
    } else {
      state.player.stats.hp -= STARVING_DAMAGE;
      addMessage(state, 'You are starving!', MSG_COLOR.bad);
      if (state.player.stats.hp <= 0) {
        state.player.isDead = true;
        addMessage(state, 'You starved to death!', MSG_COLOR.bad);
        state.gameOver = true;
        return;
      }
    }
  } else if (state.hunger.current <= HUNGER_WARNING && state.turn % 10 === 0) {
    addMessage(state, 'You are getting hungry...', '#e8a844');
  }

  // HP regen only from Amulet of Regen (equipment bonus)
  if (pStats.regenBonus > 0 && state.hunger.current >= REGEN_HUNGER_MIN) {
    const regenRate = Math.max(1, REGEN_INTERVAL - pStats.regenBonus * 2);
    if (state.turn % regenRate === 0 && state.player.stats.hp < pStats.maxHp) {
      state.player.stats.hp = Math.min(pStats.maxHp, state.player.stats.hp + pStats.regenBonus);
    }
  }

  // Guardian capstone — Unbreakable: heal 3 HP per turn
  if (hasActiveModifier(state, 'regen_3_per_turn') && state.player.stats.hp < pStats.maxHp) {
    const heal = Math.min(3, pStats.maxHp - state.player.stats.hp);
    state.player.stats.hp += heal;
  }
  // Mage Battlemage capstone — heal 4 HP per turn
  if (hasActiveModifier(state, 'mage_regen_4') && state.player.stats.hp < pStats.maxHp) {
    const heal = Math.min(4, pStats.maxHp - state.player.stats.hp);
    state.player.stats.hp += heal;
  }
  // Revenant Deathwalker capstone — stun/freeze immunity when below 20% HP
  if (hasActiveModifier(state, 'revenant_deathless_fury') && state.player.stats.hp / pStats.maxHp <= 0.2) {
    if (state.player.statusEffects) {
      state.player.statusEffects = state.player.statusEffects.filter(e => e.type !== 'stun' && e.type !== 'freeze');
    }
  }

  // Mercenary turns — they fight nearby monsters and follow the player
  for (const merc of state.mercenaries) {
    if (merc.isDead) continue;
    processMercenaryTurn(state, merc);
  }
  state.mercenaries = state.mercenaries.filter(m => !m.isDead);

  // Mercenary special: Sera heals the player each turn
  for (const merc of state.mercenaries) {
    if (merc.isDead) continue;
    const mercDef = MERCENARY_DEFS.find(d => d.name === merc.name);
    if (mercDef?.id === 'merc_healer' && state.player.stats.hp < pStats.maxHp) {
      const heal = Math.min(2, pStats.maxHp - state.player.stats.hp);
      if (heal > 0) {
        state.player.stats.hp += heal;
        addMessage(state, `${merc.name} heals you for ${heal} HP!`, '#55ff88');
      }
    }
  }

  // Monster turns
  for (const m of state.monsters) {
    if (m.isDead) continue;

    // Necromancer — Fear Aura: 10% chance nearby enemies skip their turn (20% with capstone)
    const fearChance = hasActiveModifier(state, 'necro_double_fear') ? 0.2 : 0.1;
    if (hasChosenAbility(state, 'nec_fear') && !m.isBoss && manhattan(m.pos, state.player.pos) <= 3 && Math.random() < fearChance) {
      addMessage(state, `${m.name} is paralyzed with fear!`, '#7744aa');
      continue;
    }

    // Ranger — Camouflage: 20% chance enemies lose track
    if (hasChosenAbility(state, 'rng_camouflage') && !m.isBoss && Math.random() < 0.2) {
      continue; // Monster doesn't act
    }

    // Taunt: if Garrak is alive, monsters prefer attacking him
    const garrak = state.mercenaries.find(mc => !mc.isDead && mc.name === 'Garrak');
    if (garrak && !m.isBoss && manhattan(m.pos, garrak.pos) <= 1 && Math.random() < 0.6) {
      attackEntity(state, m, garrak);
      if (garrak.stats.hp <= 0) {
        garrak.isDead = true;
        addMessage(state, `${garrak.mercName ?? garrak.name} has fallen!`, MSG_COLOR.bad);
      }
    } else {
      processMonsterTurn(state, m);
    }
    if (state.gameOver) { gpEnd('engine:processTurn'); return; }
  }

  state.monsters = state.monsters.filter((m) => !m.isDead);
  updateFOV(state);
  gpEnd('engine:processTurn');
}

function processMercenaryTurn(state: GameState, merc: Entity) {
  // Safety: if merc is stacked on the player, move them off immediately
  if (merc.pos.x === state.player.pos.x && merc.pos.y === state.player.pos.y) {
    const escape = findAdjacentSpot(state, state.player.pos);
    if (escape) {
      merc.pos.x = escape.x;
      merc.pos.y = escape.y;
    }
  }

  // Find nearest alive monster
  let nearestMonster: Entity | null = null;
  let nearestDist = Infinity;
  for (const m of state.monsters) {
    if (m.isDead) continue;
    const d = manhattan(merc.pos, m.pos);
    if (d < nearestDist) {
      nearestDist = d;
      nearestMonster = m;
    }
  }

  // Attack if adjacent
  if (nearestMonster && nearestDist === 1) {
    const mercDef = MERCENARY_DEFS.find(d => d.name === merc.name);

    // Blade Dancer — double strike
    if (mercDef?.id === 'merc_blade_dancer') {
      mercAttack(state, merc, nearestMonster);
      if (!nearestMonster.isDead) {
        mercAttack(state, merc, nearestMonster);
      }
      return;
    }

    // Berserker — double damage when below 50% HP
    let dmgMult = 1;
    if (mercDef?.id === 'merc_berserker' && merc.stats.hp < merc.stats.maxHp * 0.5) {
      dmgMult = 2;
    }

    // Assassin — 15% instant kill on non-bosses
    if (mercDef?.id === 'merc_assassin' && !nearestMonster.isBoss && Math.random() < 0.15) {
      nearestMonster.isDead = true;
      nearestMonster.stats.hp = 0;
      addMessage(state, `${merc.name} assassinates ${nearestMonster.name}!`, MSG_COLOR.merc);
      state.score += nearestMonster.xp;
      state.runStats.kills++;
      const _nmbn = nearestMonster.baseName ?? nearestMonster.name; state.runStats.monsterKills[_nmbn] = (state.runStats.monsterKills[_nmbn] ?? 0) + 1;
      gainXP(state, nearestMonster.xp);
      return;
    }

    mercAttack(state, merc, nearestMonster, dmgMult);
    return;
  }

  // Move toward nearest monster if close, otherwise follow the player
  const target = (nearestMonster && nearestDist <= 6) ? nearestMonster.pos : state.player.pos;
  const distToPlayer = manhattan(merc.pos, state.player.pos);

  // Only stop moving if right next to the player (1 tile) AND no monsters nearby to chase
  if (target === state.player.pos && distToPlayer === 1) return;

  // If too far from the player (got lost), teleport near the player
  if (distToPlayer > 15) {
    const spot = findAdjacentSpot(state, state.player.pos);
    if (spot) {
      merc.pos.x = spot.x;
      merc.pos.y = spot.y;
    }
    return;
  }

  const mercIsWalkable = (x: number, y: number) => {
    if (x < 0 || x >= state.floor.width || y < 0 || y >= state.floor.height) return false;
    // Treat monster tiles as walkable for pathfinding (so path goes through them) but we block actual movement later
    if (state.monsters.some(m => !m.isDead && m.pos.x === x && m.pos.y === y)) return true;
    if (x === state.player.pos.x && y === state.player.pos.y) return false;
    // Don't walk onto other mercenaries
    if (state.mercenaries.some(m => !m.isDead && m !== merc && m.pos.x === x && m.pos.y === y)) return false;
    return isWalkableTile(getTile(state.floor, x, y));
  };

  const prevX = merc.pos.x;
  const prevY = merc.pos.y;

  const nextStep = findPath(merc.pos, target, mercIsWalkable, 20);
  let moved = false;
  if (nextStep && !(nextStep.x === state.player.pos.x && nextStep.y === state.player.pos.y)) {
    // Don't actually step onto monsters or other mercs
    if (!state.monsters.some(m => !m.isDead && m.pos.x === nextStep.x && m.pos.y === nextStep.y) &&
        !state.mercenaries.some(m => !m.isDead && m !== merc && m.pos.x === nextStep.x && m.pos.y === nextStep.y)) {
      merc.pos.x = nextStep.x;
      merc.pos.y = nextStep.y;
      moved = merc.pos.x !== prevX || merc.pos.y !== prevY;
    }
  }

  // Stuck detection: if the merc hasn't moved for 2+ turns, teleport them near the player
  if (!moved) {
    merc.stuckTurns = (merc.stuckTurns ?? 0) + 1;
    if (merc.stuckTurns >= 2) {
      const spot = findAdjacentSpot(state, state.player.pos);
      if (spot) {
        merc.pos.x = spot.x;
        merc.pos.y = spot.y;
      }
      merc.stuckTurns = 0;
    }
  } else {
    merc.stuckTurns = 0;
  }
}

function mercAttack(state: GameState, merc: Entity, target: Entity, dmgMult = 1) {
  const baseDmg = Math.max(1, merc.stats.attack - Math.floor(target.stats.defense * 0.5));
  const variance = Math.max(1, Math.floor(baseDmg * 0.2));
  const dmg = clamp((baseDmg + Math.floor(Math.random() * variance * 2) - variance) * dmgMult, 1, 999);

  target.stats.hp -= dmg;
  addMessage(state, `${merc.name} hits ${target.name} for ${dmg}!`, MSG_COLOR.merc);
  state.runStats.damageDealt += dmg;

  if (target.stats.hp <= 0) {
    target.isDead = true;
    addMessage(state, `${merc.name} defeats ${target.name}!`, MSG_COLOR.merc);
    state.score += target.xp;
    state.runStats.kills++;
    const _tbn = target.baseName ?? target.name; state.runStats.monsterKills[_tbn] = (state.runStats.monsterKills[_tbn] ?? 0) + 1;
    gainXP(state, target.xp);
  }
}

// ─── Descend to next floor ───

function descend(state: GameState) {
  gpStart('engine:descend');
  state.floorNumber++;
  state.runStats.floorsCleared++;

  // Story mode autoplay: skip roguelike generation. The floor stays as-is
  // and storyHandleChange will rebuild it on the next manual action.
  if (state._isStoryMode) {
    addMessage(state, `Descending to floor ${state.floorNumber}...`, MSG_COLOR.system);
    gpEnd('engine:descend');
    return;
  }

  // Milestone Essence Shard bonus — every 5th floor
  if (state.floorNumber % 5 === 0) {
    state.runStats.essenceShardsEarned += 2;
    addMessage(state, `+2 Essence Shards (Floor ${state.floorNumber} milestone)!`, '#c49eff');
  }

  // Boon HP regen on floor descent
  const hpRegen = getBoonBonus(state, 'hp_regen');
  if (hpRegen > 0) {
    const healAmt = Math.min(hpRegen, state.player.stats.maxHp - state.player.stats.hp);
    if (healAmt > 0) {
      state.player.stats.hp += healAmt;
      addMessage(state, `Boon heals +${healAmt} HP!`, '#ffaa33');
    }
  }
  
  // Update boon durations (for floor-limited boons)
  updateBoonDurations(state);
  
  // Update room event buff durations
  tickRoomEventBuffs(state);
  
  // Process affliction progression
  if (state.activeAffliction && !state.activeAffliction.cured) {
    const progressResult = progressAffliction(state);
    
    if (progressResult.stageChanged && progressResult.newStage) {
      addMessage(state, progressResult.newStage.stageEnterMessage, '#aa44aa');
      
      if (progressResult.fullyTransformed) {
        const affliction = getAfflictionDef(state.activeAffliction.afflictionId);
        if (affliction) {
          addMessage(state, `TRANSFORMATION COMPLETE: You are now ${affliction.name}!`, '#ff44ff');
        }
      }
    } else {
      // Random progress message
      if (Math.random() < 0.4) {
        const msg = getRandomProgressMessage(state);
        if (msg) {
          addMessage(state, msg, '#aa44aa');
        }
      }
    }
  }
  
  // Reset first strike for new floor
  const fsExt = state as GameState & { _firstStrikeUsed?: boolean };
  fsExt._firstStrikeUsed = false;

  state.survivalUsedThisFloor = false;
  state.undyingWillUsedThisFloor = false;
  state.beyondDeathUsedThisFloor = false;
  // Reset Last Stand, Divine Might, and capstone survival abilities per floor
  (state as GameState & { _lastStandUsed?: boolean })._lastStandUsed = false;
  (state as GameState & { _divineMightUsed?: boolean })._divineMightUsed = false;
  (state as GameState & { _mageLastStandUsed?: boolean })._mageLastStandUsed = false;
  (state as GameState & { _rangerFullHealUsed?: boolean })._rangerFullHealUsed = false;
  addMessage(state, `Descending to floor ${state.floorNumber}...`, MSG_COLOR.system);

  // Second Wind — heal 3 HP on floor descent
  if (hasChosenAbility(state, 'rng_second_wind')) {
    const heal = Math.min(3, state.player.stats.maxHp - state.player.stats.hp);
    if (heal > 0) {
      state.player.stats.hp += heal;
      addMessage(state, `Second Wind! +${heal} HP`, '#66ddaa');
    }
  }

  // Paladin — Lay on Hands: heal 5 HP on floor descent
  if (hasChosenAbility(state, 'pal_lay_on_hands')) {
    const heal = Math.min(5, state.player.stats.maxHp - state.player.stats.hp);
    if (heal > 0) {
      state.player.stats.hp += heal;
      addMessage(state, `Lay on Hands! +${heal} HP`, '#ffd700');
    }
  }

  // ── Sequential zone progression: advance zone after boss kill ──
  if (!state._isStoryMode) {
    const prevFloorBossKills = state.bossesDefeatedThisRun;
    if (prevFloorBossKills.length > 0) {
      const nextZone = getNextZone(state.zone);
      if (nextZone) {
        const prevZoneDef = getZoneDef(state.zone);
        state.zone = nextZone;
        const newZoneDef = getZoneDef(nextZone);
        addMessage(state, `You leave ${prevZoneDef.name} behind and descend into ${newZoneDef.name}...`, newZoneDef.color);
      }
    }
  }

  const floor = generateFloor(state.floorNumber, state.zone);
  state.floor = floor;

  const firstRoom = floor.rooms[0]!;
  state.player.pos = { x: firstRoom.centerX, y: firstRoom.centerY };

  const row = floor.tiles[firstRoom.centerY];
  if (row) row[firstRoom.centerX] = Tile.StairsUp;

  const occupied = new Set<string>();
  occupied.add(`${state.player.pos.x},${state.player.pos.y}`);
  // Reserve tiles immediately around the player so nothing spawns adjacent
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      occupied.add(`${state.player.pos.x + dx},${state.player.pos.y + dy}`);
    }
  }
  const lastRoom = floor.rooms[floor.rooms.length - 1]!;
  occupied.add(`${lastRoom.centerX},${lastRoom.centerY}`);

  const monsters = spawnMonsters(floor, state.floorNumber, occupied, state.zone, state.playerClass);
  const boss = spawnBoss(floor, state.floorNumber, occupied, state.bossesDefeatedThisRun, state.zone, state.playerClass);
  state.monsters = boss ? [...monsters, boss] : monsters;
  state.items = spawnItems(floor, state.floorNumber, occupied, state.zone);
  state.shop = spawnShop(floor, state.floorNumber, occupied, state.zone, state._bloodlineRef?.generation ?? 0);
  state.mapMercenaries = spawnMercenaries(floor, state.floorNumber, occupied, state.zone);
  if (state._bloodlineRef) {
    state.npcs = spawnNPCs(floor, state.floorNumber, occupied, state._bloodlineRef, state.playerClass, state.zone);
  } else {
    state.npcs = [];
  }

  if (!state._isStoryMode) {
    spawnFloorEncounters(state, occupied);
  }

  // Mercenaries carry over but reposition adjacent to the player (not on top)
  for (const merc of state.mercenaries) {
    if (!merc.isDead) {
      const spot = findAdjacentSpot(state, state.player.pos);
      if (spot) {
        merc.pos = spot;
      } else {
        // Fallback: at least put them 1 tile away
        merc.pos = { x: state.player.pos.x + 1, y: state.player.pos.y };
      }
    }
  }

  if (boss) {
    addMessage(state, `A powerful presence lurks on this floor...`, MSG_COLOR.boss);
  }

  if (boss && state.playerClass === 'generated' && state.zone === 'narrative_test') {
    const gen = getActiveGeneratedClass();
    if (gen?.boss && boss.name === gen.boss.name) {
      const bossBeatId = `genclass_boss_${gen.id}`;
      state.pendingStoryDialogue = { beatId: bossBeatId, nodeId: 'root' };
    }
  }

  // Check for story events when entering a new floor (only in narrative_test zone)
  if (state.zone === 'narrative_test' && !state.pendingStoryDialogue) {
    const storyEvent = onFloorEnter(state);
    if (storyEvent && storyEvent.type === 'dialogue' && storyEvent.beatId) {
      state.pendingStoryDialogue = {
        beatId: storyEvent.beatId,
        nodeId: storyEvent.nodeId ?? 'root',
      };
    }
  }

  state.score += state.floorNumber * 10;
  updateFOV(state);
  gpEnd('engine:descend');
}

// ─── Shop ───

export function isAtShop(state: GameState): boolean {
  if (!state.shop) return false;
  return state.player.pos.x === state.shop.pos.x && state.player.pos.y === state.shop.pos.y;
}

export function buyItem(state: GameState, stockIndex: number): boolean {
  if (!state.shop) return false;
  const shopItem = state.shop.stock[stockIndex];
  if (!shopItem) return false;

  if (state.score < shopItem.price) {
    addMessage(state, "You can't afford that!", MSG_COLOR.bad);
    return false;
  }


  if (state.player.inventory.length >= 20) {
    addMessage(state, 'Inventory full!', MSG_COLOR.bad);
    return false;
  }

  state.score -= shopItem.price;
  state.player.inventory.push({ ...shopItem.item, id: uid() });
  state.shop.stock.splice(stockIndex, 1);
  state.runStats.shopPurchases = (state.runStats.shopPurchases ?? 0) + 1;
  addMessage(state, `Bought ${shopItem.item.name} for ${shopItem.price} gold.`, MSG_COLOR.loot);
  return true;
}

// ─── NPC Dialogue Effects ───

export function applyDialogueEffects(
  state: GameState,
  effects: DialogueEffect[],
  bloodline: BloodlineData,
): void {
  for (const effect of effects) {
    switch (effect.type) {
      case 'heal': {
        const eStats = getEffectiveStats(state.player);
        const healed = Math.min(effect.amount, eStats.maxHp - state.player.stats.hp);
        state.player.stats.hp += healed;
        break;
      }
      case 'gold':
        state.score = Math.max(0, state.score + effect.amount);
        break;
      case 'item': {
        const template = findItemTemplate(effect.itemName);
        if (template && state.player.inventory.length < 20) {
          state.player.inventory.push({ ...template, id: uid() });
        }
        break;
      }
      case 'statBuff':
        state.player.stats[effect.stat] += effect.amount;
        break;
      case 'hunger':
        state.hunger.current = Math.min(state.hunger.max, state.hunger.current + effect.amount);
        break;
      case 'npcChoice':
        bloodline.npcChoicesMade[effect.eventId] = effect.choiceId;
        break;
      case 'message':
        addMessage(state, effect.text, effect.color);
        break;
      case 'setFlag':
        if (!state._storyFlags) state._storyFlags = {};
        state._storyFlags[effect.key] = effect.value;
        break;
    }
  }
  state.runStats.npcsTalkedTo++;
}

// ─── Cause of Death ───

export function forfeitRun(state: GameState): void {
  state.player.stats.hp = 0;
  state.player.isDead = true;
  state.gameOver = true;
  addMessage(state, 'You gave up and collapsed in the dungeon...', MSG_COLOR.bad);
}

export function extractCauseOfDeath(state: GameState): string {
  const msgs = state.messages;
  for (let i = msgs.length - 1; i >= 0; i--) {
    const text = msgs[i]!.text;
    if (text.includes('starved')) return 'Starved to death';
    if (text.includes('gave up')) return 'Gave up';
    const hitMatch = text.match(/^(.+) hits you/);
    if (hitMatch) return `Slain by ${hitMatch[1]}`;
  }
  return 'Unknown causes';
}

/** Extract the damage of the killing blow from the last message log. */
export function extractKillingBlowDamage(state: GameState): number {
  const msgs = state.messages;
  for (let i = msgs.length - 1; i >= 0; i--) {
    const text = msgs[i]!.text;
    if (text.includes('starved')) return 1; // starvation damage
    const dmgMatch = text.match(/hits you for (\d+)/);
    if (dmgMatch) return parseInt(dmgMatch[1]!, 10);
  }
  return 0;
}

// ─── Wait action (skip turn) ───

export function waitTurn(state: GameState): boolean {
  if (state.gameOver) return false;
  (state as GameState & { _isWaiting?: boolean })._isWaiting = true;
  addMessage(state, 'You wait...', MSG_COLOR.info);
  processTurn(state);
  (state as GameState & { _isWaiting?: boolean })._isWaiting = false;
  return true;
}

// ─── Warrior Rage Strike ───

/** Returns current rage (0-100) for the warrior. */
export function getWarriorRage(state: GameState): number {
  return (state as GameState & { _rage?: number })._rage ?? 0;
}

/**
 * Warrior Rage Strike — costs 100 rage.
 * Finds the highest-HP visible monster (the most powerful threat),
 * then deals 2x attack damage to all monsters in a 3-tile cone
 * in that direction.
 */
export function rageStrike(state: GameState): boolean {
  if (state.gameOver) return false;
  if (state.playerClass !== 'warrior') return false;

  const rageExt = state as GameState & { _rage?: number };
  if ((rageExt._rage ?? 0) < 30) return false;

  const { player } = state;
  const visibleMonsters = state.monsters.filter(
    (m) => !m.isDead && state.floor.visible[m.pos.y]?.[m.pos.x] === true,
  );
  if (visibleMonsters.length === 0) {
    addMessage(state, 'No enemies in sight!', MSG_COLOR.info);
    return false;
  }

  // Target = highest HP visible monster (most dangerous)
  visibleMonsters.sort((a, b) => b.stats.hp - a.stats.hp);
  const primary = visibleMonsters[0]!;

  // Direction vector toward the primary target
  const dx = primary.pos.x - player.pos.x;
  const dy = primary.pos.y - player.pos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const nx = dist > 0 ? dx / dist : 0;
  const ny = dist > 0 ? dy / dist : 0;

  // Skill tree modifiers for rage strike
  const rageAoeAll = hasActiveModifier(state, 'rage_aoe_all');
  const rageDmgBoost = hasActiveModifier(state, 'rage_damage_boost');
  const rageHealOnKill = hasActiveModifier(state, 'rage_heal_on_kill');

  // AoE: hit all visible monsters within range
  const strikeRange = 4;
  const rageMult = rageDmgBoost ? 3 : 2;
  const baseDmg = Math.floor(getEffectiveStats(player).attack * rageMult);
  let hitCount = 0;

  // Spawn a visual projectile toward the primary target
  if (!state.projectiles) state.projectiles = [];
  state.projectiles.push({
    from: { ...player.pos },
    to: { ...primary.pos },
    char: '✦',
    color: '#ff2200',
  });

  for (const monster of state.monsters) {
    if (monster.isDead) continue;
    if (!state.floor.visible[monster.pos.y]?.[monster.pos.x]) continue;

    const mdx = monster.pos.x - player.pos.x;
    const mdy = monster.pos.y - player.pos.y;
    const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
    if (mdist > strikeRange) continue;

    // Cone check — skip if capstone "hit all" isn't unlocked
    if (!rageAoeAll) {
      const dot = mdist > 0 ? (mdx / mdist) * nx + (mdy / mdist) * ny : 1;
      if (dot < 0.5) continue;
    }

    const dmg = Math.max(1, baseDmg - Math.floor(getEffectiveStats(monster).defense * 0.6));
    monster.stats.hp -= dmg;
    hitCount++;
    addMessage(state, `Rage Strike hits ${monster.name} for ${dmg}!`, '#ff2200');

    if (monster.stats.hp <= 0) {
      monster.isDead = true;
      addMessage(state, `${monster.name} is destroyed!`, MSG_COLOR.good);
      state.score += monster.xp;
      state.runStats.kills++;
      const _bn = monster.baseName ?? monster.name;
      state.runStats.monsterKills[_bn] = (state.runStats.monsterKills[_bn] ?? 0) + 1;
      gainXP(state, monster.xp);
      // Capstone heal on kill
      if (rageHealOnKill) {
        const heal = Math.min(5, player.stats.maxHp - player.stats.hp);
        if (heal > 0) {
          player.stats.hp += heal;
          addMessage(state, `Fury heals you for ${heal} HP!`, '#ff6644');
        }
      }
    }
  }

  if (hitCount === 0) {
    addMessage(state, 'Rage Strike — but nothing in range!', MSG_COLOR.info);
  }

  // Consume all rage
  rageExt._rage = 0;
  state.runStats.damageDealt += baseDmg * hitCount;

  processTurn(state);
  return true;
}

// ─── Paladin Sacred Vow ───

/** Returns current Vow stacks (0-5) for the paladin. */
export function getPaladinVow(state: GameState): number {
  return (state as GameState & { _vowStacks?: number })._vowStacks ?? 0;
}

/** Returns true if Vow immunity is currently active. */
export function isPaladinVowActive(state: GameState): boolean {
  return (state as GameState & { _vowActive?: boolean })._vowActive ?? false;
}

/**
 * Paladin Sacred Vow — consumes 1+ Vow stack to activate immunity.
 * The next incoming hit is completely absorbed and immunity deactivates.
 */
export function sacredVow(state: GameState): boolean {
  if (state.gameOver) return false;
  if (state.playerClass !== 'paladin') return false;

  const vowExt = state as GameState & { _vowStacks?: number; _vowActive?: boolean };
  if ((vowExt._vowStacks ?? 0) < 2) return false;

  if (vowExt._vowActive) {
    addMessage(state, 'Sacred Vow is already active!', MSG_COLOR.info);
    return false;
  }

  vowExt._vowStacks = Math.max(0, (vowExt._vowStacks ?? 0) - 2);
  vowExt._vowActive = true;
  addMessage(state, `Sacred Vow activated! Next hit negated. (${vowExt._vowStacks} stacks left)`, '#ffd700');

  processTurn(state);
  return true;
}

// ─── Rogue Shadow Step ───

/** Returns Shadow Step cooldown (0 = ready). */
export function getRogueShadowCooldown(state: GameState): number {
  return (state as GameState & { _shadowCooldown?: number })._shadowCooldown ?? 0;
}

/**
 * Rogue Shadow Step — teleport behind the nearest visible enemy and backstab for 3x damage.
 * 3-turn cooldown. If the backstab kills the target, cooldown resets.
 */
export function shadowStep(state: GameState): boolean {
  if (state.gameOver) return false;
  if (state.playerClass !== 'rogue') return false;

  const ext = state as GameState & { _shadowCooldown?: number };
  if ((ext._shadowCooldown ?? 0) > 0) return false;

  const { player } = state;
  const visibleMonsters = state.monsters.filter(
    (m) => !m.isDead && state.floor.visible[m.pos.y]?.[m.pos.x] === true,
  );
  if (visibleMonsters.length === 0) {
    addMessage(state, 'No enemies in sight!', MSG_COLOR.info);
    return false;
  }

  // Target = nearest visible monster
  visibleMonsters.sort((a, b) => manhattan(player.pos, a.pos) - manhattan(player.pos, b.pos));
  const target = visibleMonsters[0]!;

  // Find a tile behind the target (opposite side from player)
  const dx = target.pos.x - player.pos.x;
  const dy = target.pos.y - player.pos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const ndx = dist > 0 ? Math.round(dx / dist) : 0;
  const ndy = dist > 0 ? Math.round(dy / dist) : 0;

  // Try behind target, then adjacent tiles
  const candidates = [
    { x: target.pos.x + ndx, y: target.pos.y + ndy }, // behind
    { x: target.pos.x + ndy, y: target.pos.y - ndx }, // side 1
    { x: target.pos.x - ndy, y: target.pos.y + ndx }, // side 2
    { x: target.pos.x - ndx, y: target.pos.y - ndy }, // in front (last resort)
  ];

  let landingPos: { x: number; y: number } | null = null;
  for (const c of candidates) {
    if (c.x < 0 || c.x >= state.floor.width || c.y < 0 || c.y >= state.floor.height) continue;
    if (!isWalkableTile(getTile(state.floor, c.x, c.y))) continue;
    if (state.monsters.some(m => !m.isDead && m.pos.x === c.x && m.pos.y === c.y)) continue;
    if (state.mercenaries.some(m => !m.isDead && m.pos.x === c.x && m.pos.y === c.y)) continue;
    landingPos = c;
    break;
  }

  if (!landingPos) {
    addMessage(state, 'No space to shadow step!', MSG_COLOR.info);
    return false;
  }

  // Spawn projectile visual (player to target)
  if (!state.projectiles) state.projectiles = [];
  state.projectiles.push({
    from: { ...player.pos },
    to: { ...landingPos },
    char: '~',
    color: '#aa55ff',
  });

  // Teleport
  player.pos.x = landingPos.x;
  player.pos.y = landingPos.y;

  // Backstab — 2.5x damage (nerfed from 3x)
  const pStats = getEffectiveStats(player);
  const backstabDmg = Math.max(1, Math.floor(pStats.attack * 2.5) - Math.floor(getEffectiveStats(target).defense * 0.5));
  target.stats.hp -= backstabDmg;
  state.runStats.damageDealt += backstabDmg;
  addMessage(state, `Shadow Step! Backstab ${target.name} for ${backstabDmg}!`, '#aa55ff');

  let killed = false;
  if (target.stats.hp <= 0) {
    target.isDead = true;
    killed = true;
    addMessage(state, `${target.name} didn't see it coming!`, MSG_COLOR.good);
    state.score += target.xp;
    state.runStats.kills++;
    const _bn = target.baseName ?? target.name;
    state.runStats.monsterKills[_bn] = (state.runStats.monsterKills[_bn] ?? 0) + 1;
    gainXP(state, target.xp);
  }

  // Cooldown: 4 turns base, reduced to 1 on kill (nerfed from 3/0)
  ext._shadowCooldown = killed ? 1 : 4;

  processTurn(state);
  return true;
}

// ─── Mage Arcane Blast ───

/** Returns Arcane Blast cooldown (0 = ready). */
export function getMageBlastCooldown(state: GameState): number {
  return (state as GameState & { _blastCooldown?: number })._blastCooldown ?? 0;
}

/**
 * Mage Arcane Blast — hit all visible enemies within 4 tiles for magic damage.
 * Costs 10% of max HP. 3-turn cooldown.
 */
export function arcaneBlast(state: GameState): boolean {
  if (state.gameOver) return false;
  if (state.playerClass !== 'mage') return false;

  const ext = state as GameState & { _blastCooldown?: number };
  if ((ext._blastCooldown ?? 0) > 0) return false;

  const { player } = state;
  const blastRange = 4;
  const hpCost = Math.max(1, Math.floor(player.stats.maxHp * 0.1));

  if (player.stats.hp <= hpCost) {
    addMessage(state, 'Not enough HP to cast Arcane Blast!', MSG_COLOR.info);
    return false;
  }

  const targets = state.monsters.filter(
    (m) => !m.isDead &&
    state.floor.visible[m.pos.y]?.[m.pos.x] === true &&
    manhattan(player.pos, m.pos) <= blastRange,
  );

  if (targets.length === 0) {
    addMessage(state, 'No enemies in range!', MSG_COLOR.info);
    return false;
  }

  // Pay HP cost
  player.stats.hp -= hpCost;
  addMessage(state, `Arcane Blast! (-${hpCost} HP)`, '#8855ff');

  // Spawn projectiles to all targets
  if (!state.projectiles) state.projectiles = [];

  const pStats = getEffectiveStats(player);
  const baseDmg = Math.floor(pStats.attack * 2);

  for (const target of targets) {
    state.projectiles.push({
      from: { ...player.pos },
      to: { ...target.pos },
      char: '✦',
      color: '#8855ff',
    });

    const dmg = Math.max(1, baseDmg - Math.floor(getEffectiveStats(target).defense * 0.4));
    target.stats.hp -= dmg;
    state.runStats.damageDealt += dmg;
    addMessage(state, `Arcane energy hits ${target.name} for ${dmg}!`, '#bb77ff');

    if (target.stats.hp <= 0) {
      target.isDead = true;
      addMessage(state, `${target.name} is obliterated!`, MSG_COLOR.good);
      state.score += target.xp;
      state.runStats.kills++;
      const _bn = target.baseName ?? target.name;
      state.runStats.monsterKills[_bn] = (state.runStats.monsterKills[_bn] ?? 0) + 1;
      gainXP(state, target.xp);
    }
  }

  ext._blastCooldown = 3;
  processTurn(state);
  return true;
}

// ─── Ranger Hunter's Mark ───

/** Returns current Hunter's Mark info: target name, remaining hits, and cooldown. */
export function getRangerMark(state: GameState): { targetId: string | null; hitsLeft: number; cooldown: number } {
  const ext = state as GameState & { _markTargetId?: string; _markHits?: number; _markCooldown?: number };
  return {
    targetId: ext._markTargetId ?? null,
    hitsLeft: ext._markHits ?? 0,
    cooldown: ext._markCooldown ?? 0,
  };
}

/**
 * Ranger Hunter's Mark — mark the nearest visible enemy.
 * Next 3 attacks against that target deal double damage.
 * If target dies early, remaining marks transfer to nearest enemy.
 * 5-turn cooldown after all marks are consumed.
 */
export function huntersMark(state: GameState): boolean {
  if (state.gameOver) return false;
  if (state.playerClass !== 'ranger') return false;

  const ext = state as GameState & { _markTargetId?: string; _markHits?: number; _markCooldown?: number };
  if ((ext._markCooldown ?? 0) > 0) return false;
  if ((ext._markHits ?? 0) > 0) return false; // Already active

  const { player } = state;
  const visibleMonsters = state.monsters.filter(
    (m) => !m.isDead && state.floor.visible[m.pos.y]?.[m.pos.x] === true,
  );

  if (visibleMonsters.length === 0) {
    addMessage(state, 'No enemies in sight!', MSG_COLOR.info);
    return false;
  }

  // Target = nearest visible monster
  visibleMonsters.sort((a, b) => manhattan(player.pos, a.pos) - manhattan(player.pos, b.pos));
  const target = visibleMonsters[0]!;

  ext._markTargetId = target.id;
  ext._markHits = 3;

  // Visual
  if (!state.projectiles) state.projectiles = [];
  state.projectiles.push({
    from: { ...player.pos },
    to: { ...target.pos },
    char: '◎',
    color: '#ffaa00',
  });

  addMessage(state, `Hunter's Mark on ${target.name}! Next 3 attacks deal double damage.`, '#ffaa00');

  processTurn(state);
  return true;
}

// ─── Necromancer Skeleton Summon ───

/** Returns current skeleton summon info: active count, max allowed, and cooldown. */
export function getNecroSkeletons(state: GameState): { count: number; max: number; cooldown: number } {
  const ext = state as GameState & { _skeletonCooldown?: number };
  // Count active skeleton minions
  const count = state.mercenaries.filter(m => !m.isDead && m.name === 'Skeleton Minion').length;
  return {
    count,
    max: 2, // Max 2 skeletons at a time
    cooldown: ext._skeletonCooldown ?? 0,
  };
}

/**
 * Necromancer Summon Skeleton — summons a skeleton minion to fight alongside you.
 * Max 2 skeletons at once. 5-turn cooldown after summoning.
 * Skeletons gain power based on player level.
 */
export function summonSkeleton(state: GameState): boolean {
  if (state.gameOver) return false;
  if (state.playerClass !== 'necromancer') return false;

  const ext = state as GameState & { _skeletonCooldown?: number };
  if ((ext._skeletonCooldown ?? 0) > 0) {
    addMessage(state, `Summon on cooldown! (${ext._skeletonCooldown} turns)`, MSG_COLOR.info);
    return false;
  }

  const skeletonInfo = getNecroSkeletons(state);
  if (skeletonInfo.count >= skeletonInfo.max) {
    addMessage(state, 'Maximum skeletons summoned! (2/2)', MSG_COLOR.info);
    return false;
  }

  // Find spawn location near player
  const spawnPos = findAdjacentSpot(state, state.player.pos);
  if (!spawnPos) {
    addMessage(state, 'No space to summon skeleton!', MSG_COLOR.bad);
    return false;
  }

  // Skeleton stats scale with player level
  const level = state.player.level;
  const baseHp = 8 + level * 3;
  const baseAtk = 3 + Math.floor(level * 0.8);
  const baseDef = 1 + Math.floor(level * 0.3);

  // Create skeleton as a mercenary (uses existing mercenary AI)
  const skeleton = {
    id: uid(),
    name: 'Skeleton Minion',
    char: 's',
    color: '#ddccaa',
    pos: { ...spawnPos },
    stats: { hp: baseHp, maxHp: baseHp, attack: baseAtk, defense: baseDef, speed: 8 },
    xp: 0,
    level: 1,
    isPlayer: false,
    isDead: false,
    isBoss: false,
    equipment: {},
    inventory: [],
    baseName: 'Skeleton Minion',
  };

  state.mercenaries.push(skeleton);

  // Set cooldown
  ext._skeletonCooldown = 5;

  // Visual effect
  if (!state.projectiles) state.projectiles = [];
  state.projectiles.push({
    from: { ...state.player.pos },
    to: { ...spawnPos },
    char: '💀',
    color: '#aa44dd',
  });

  addMessage(state, `Raised a Skeleton Minion! (${skeletonInfo.count + 1}/${skeletonInfo.max})`, '#aa44dd');

  processTurn(state);
  return true;
}

// ─── Impregnar Ability ───

const PUKE_CHARS: string[] = ['~', '≈', '*', '·', '•', ',', '`', '\''];
const PUKE_COLORS: string[] = ['#88ff44', '#66cc00', '#aaff66', '#44cc00', '#99ee33'];
function randPukeChar(): string { return PUKE_CHARS[Math.floor(Math.random() * PUKE_CHARS.length)] ?? '~'; }
function randPukeColor(): string { return PUKE_COLORS[Math.floor(Math.random() * PUKE_COLORS.length)] ?? '#88ff44'; }

export function getImpregnarInfo(state: GameState): { cooldown: number; broodCount: number; impregnatedCount: number } {
  const ext = state as GameState & { _impregCooldown?: number };
  const broodCount = state.mercenaries.filter(m => !m.isDead && m.name === 'Broodling').length;
  const impregnatedCount = state.monsters.filter(m => !m.isDead && (m as Entity & { _impregnated?: boolean })._impregnated).length;
  return { cooldown: ext._impregCooldown ?? 0, broodCount, impregnatedCount };
}

/**
 * Impregnate — target an adjacent enemy. They become impregnated:
 * - They puke ASCII particles every turn
 * - On death, they spawn broodling(s) that fight for you
 */
export function impregnate(state: GameState): boolean {
  if (state.gameOver) return false;
  if (state.playerClass !== 'impregnar') return false;

  const ext = state as GameState & { _impregCooldown?: number };
  const classDef = getClassDef(state.playerClass);
  const hasNoCooldown = classDef.passives.some(p => p.name === 'Infestation' && state.player.level >= p.unlockLevel);

  if (!hasNoCooldown && (ext._impregCooldown ?? 0) > 0) {
    addMessage(state, `Impregnate on cooldown! (${ext._impregCooldown} turns)`, MSG_COLOR.info);
    return false;
  }

  if (hasNoCooldown) {
    if (state.player.stats.hp <= 5) {
      addMessage(state, 'Not enough HP to impregnate! (costs 5 HP)', MSG_COLOR.bad);
      return false;
    }
    state.player.stats.hp -= 5;
    addMessage(state, 'You sacrifice 5 HP to the brood...', '#88ff44');
  }

  // Find closest adjacent enemy
  const adj = state.monsters.filter(m => {
    if (m.isDead) return false;
    if ((m as Entity & { _impregnated?: boolean })._impregnated) return false;
    const dx = Math.abs(m.pos.x - state.player.pos.x);
    const dy = Math.abs(m.pos.y - state.player.pos.y);
    return dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0);
  });

  const target = adj[0];
  if (!target) {
    addMessage(state, 'No adjacent enemy to impregnate!', MSG_COLOR.bad);
    return false;
  }
  (target as Entity & { _impregnated?: boolean })._impregnated = true;
  (target as Entity & { _pukeTimer?: number })._pukeTimer = 0;

  if (!hasNoCooldown) ext._impregCooldown = 6;

  // Puke projectiles burst from the target
  if (!state.projectiles) state.projectiles = [];
  for (let i = 0; i < 4; i++) {
    const angle = (Math.PI * 2 * i) / 4;
    state.projectiles.push({
      from: { ...target.pos },
      to: {
        x: target.pos.x + Math.round(Math.cos(angle)),
        y: target.pos.y + Math.round(Math.sin(angle)),
      },
      char: randPukeChar(),
      color: randPukeColor(),
    });
  }

  addMessage(state, `You impregnate ${target.name}! It starts retching violently!`, '#88ff44');
  addMessage(state, `${target.name}: *BLURRRGH* 🤮`, '#66cc00');

  processTurn(state);
  return true;
}

/** Called during monster turn processing — handles puke effects and DOT for impregnated monsters */
export function processImpregnatedMonster(state: GameState, monster: Entity): void {
  const m = monster as Entity & { _impregnated?: boolean; _pukeTimer?: number };
  if (!m._impregnated) return;

  m._pukeTimer = (m._pukeTimer ?? 0) + 1;

  const hasGestating = state.player.chosenAbilities?.includes('imp_gestating_fury');
  if (hasGestating) {
    monster.stats.hp -= 2;
    if (monster.stats.hp <= 0) {
      monster.isDead = true;
    }
  }

  // Puke every 2 turns with ASCII bile
  if (m._pukeTimer % 2 === 0) {
    if (!state.projectiles) state.projectiles = [];
    const pukeDir = Math.floor(Math.random() * 8);
    const dirs = [
      { x: 0, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 0 }, { x: 1, y: 1 },
      { x: 0, y: 1 }, { x: -1, y: 1 }, { x: -1, y: 0 }, { x: -1, y: -1 },
    ];
    const d = dirs[pukeDir] ?? { x: 0, y: -1 };
    for (let i = 1; i <= 2; i++) {
      state.projectiles.push({
        from: { ...monster.pos },
        to: { x: monster.pos.x + d.x * i, y: monster.pos.y + d.y * i },
        char: randPukeChar(),
        color: randPukeColor(),
      });
    }
    if (state.floor.visible[monster.pos.y]?.[monster.pos.x]) {
      addMessage(state, `${monster.name}: *huurrrk* ${randPukeChar()}${randPukeChar()}${randPukeChar()}`, '#66cc00');
    }
  }
}

/** Called when an impregnated monster dies — spawns broodlings */
export function onImpregnatedDeath(state: GameState, monster: Entity): void {
  const m = monster as Entity & { _impregnated?: boolean };
  if (!m._impregnated) return;

  const hasTwinBrood = state.player.chosenAbilities?.includes('imp_twin_brood');
  const hasMotherOfAll = state.player.chosenAbilities?.includes('imp_mother_of_all') && monster.isBoss;
  const spawnCount = hasMotherOfAll ? 3 : hasTwinBrood ? 2 : 1;

  const level = state.player.level;
  const hasHiveMind = state.player.chosenAbilities?.includes('imp_hive_mind');
  const existingBroodlings = state.mercenaries.filter(m2 => !m2.isDead && m2.name === 'Broodling').length;
  const hiveMindBonus = hasHiveMind ? existingBroodlings * 2 : 0;

  // Massive puke explosion on death
  if (!state.projectiles) state.projectiles = [];
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8;
    for (let dist = 1; dist <= 3; dist++) {
      state.projectiles.push({
        from: { ...monster.pos },
        to: {
          x: monster.pos.x + Math.round(Math.cos(angle) * dist),
          y: monster.pos.y + Math.round(Math.sin(angle) * dist),
        },
        char: randPukeChar(),
        color: randPukeColor(),
      });
    }
  }

  addMessage(state, `${monster.name} BURSTS open! 🤮🤮🤮 *SPLATTCH*`, '#88ff44');

  let spawned = 0;
  for (let i = 0; i < spawnCount; i++) {
    const spot = findAdjacentSpot(state, monster.pos);
    if (!spot) break;

    const broodling: Entity = {
      id: uid(),
      name: 'Broodling',
      char: 'b',
      color: '#88ff44',
      pos: { ...spot },
      stats: {
        hp: 6 + level * 2,
        maxHp: 6 + level * 2,
        attack: 3 + Math.floor(level * 0.7) + hiveMindBonus,
        defense: 1 + Math.floor(level * 0.2),
        speed: 12,
      },
      xp: 0,
      level: 1,
      isPlayer: false,
      isDead: false,
      isBoss: false,
      equipment: {},
      inventory: [],
      baseName: 'Broodling',
    };

    state.mercenaries.push(broodling);
    spawned++;

    state.projectiles.push({
      from: { ...monster.pos },
      to: { ...spot },
      char: '🥚',
      color: '#88ff44',
    });
  }

  if (spawned > 0) {
    addMessage(state, `${spawned} Broodling${spawned > 1 ? 's' : ''} crawl${spawned === 1 ? 's' : ''} from the remains!`, '#88ff44');
  }

  // Bile spray from Toxic Birth ability
  const hasToxicBirth = state.player.chosenAbilities?.includes('imp_toxic_birth');
  if (hasToxicBirth) {
    const nearbyEnemies = state.monsters.filter(e =>
      !e.isDead && manhattan(e.pos, monster.pos) <= 1 && e.id !== monster.id
    );
    for (const enemy of nearbyEnemies) {
      enemy.stats.hp -= 8;
      if (enemy.stats.hp <= 0) enemy.isDead = true;
      addMessage(state, `Toxic bile hits ${enemy.name} for 8 damage!`, '#44cc00');
    }
  }

  // Parasitic Link heal
  const hasParasiticLink = state.player.chosenAbilities?.includes('imp_parasitic_link');
  if (hasParasiticLink) {
    const heal = Math.min(3 * spawnCount, state.player.stats.maxHp - state.player.stats.hp);
    if (heal > 0) {
      state.player.stats.hp += heal;
      addMessage(state, `Parasitic link heals you for ${heal} HP!`, '#66cc22');
    }
  }
}

// ─── Death Knight Ability: Death Coil ───

export function getDeathKnightInfo(state: GameState): { cooldown: number } {
  const ext = state as GameState & { _dkCoilCooldown?: number };
  return { cooldown: ext._dkCoilCooldown ?? 0 };
}

export function deathCoil(state: GameState): boolean {
  if (state.gameOver) return false;
  if (state.playerClass !== 'death_knight') return false;
  const ext = state as GameState & { _dkCoilCooldown?: number };
  if ((ext._dkCoilCooldown ?? 0) > 0) return false;

  const healAmt = Math.min(15, state.player.stats.maxHp - state.player.stats.hp);
  if (healAmt > 0) {
    state.player.stats.hp += healAmt;
  }
  addMessage(state, `Death Coil! Restored ${healAmt} HP!`, '#aa55cc');
  ext._dkCoilCooldown = 8;
  return true;
}

// ─── Generated Class Ability ───

/** Get the active generated class data (if any). */
export function getActiveGeneratedClass(): GeneratedClass | null {
  return getStoredGeneratedClass();
}

/** Returns current resource and ability info for generated class. */
export function getGeneratedClassInfo(state: GameState): { 
  resource: number; 
  maxResource: number; 
  resourceName: string;
  resourceIcon: string;
  resourceColor: string;
  abilityName: string;
  abilityCost: number;
  abilityCooldown: number;
  abilityIcon: string;
} | null {
  if (state.playerClass !== 'generated') return null;
  
  const gen = getActiveGeneratedClass();
  if (!gen) return null;
  
  const ext = state as GameState & { _genResource?: number; _genAbilityCooldown?: number };
  return {
    resource: ext._genResource ?? gen.resource.startingAmount,
    maxResource: gen.resource.max,
    resourceName: gen.resource.name,
    resourceIcon: gen.resource.icon,
    resourceColor: gen.resource.color,
    abilityName: gen.ability.name,
    abilityCost: gen.ability.resourceCost,
    abilityCooldown: ext._genAbilityCooldown ?? 0,
    abilityIcon: gen.ability.icon,
  };
}

/**
 * Use the generated class's primary ability.
 * Effects depend on the generated class's ability definition.
 */
export function useGeneratedAbility(state: GameState): boolean {
  if (state.gameOver) return false;
  if (state.playerClass !== 'generated') return false;
  
  const gen = getActiveGeneratedClass();
  if (!gen) return false;
  
  const ext = state as GameState & { _genResource?: number; _genAbilityCooldown?: number };
  const currentResource = ext._genResource ?? gen.resource.startingAmount;
  
  // Check cooldown
  if ((ext._genAbilityCooldown ?? 0) > 0) {
    addMessage(state, `${gen.ability.name} on cooldown! (${ext._genAbilityCooldown} turns)`, MSG_COLOR.info);
    return false;
  }
  
  // Check resource cost
  if (currentResource < gen.ability.resourceCost) {
    addMessage(state, `Not enough ${gen.resource.name}! (${currentResource}/${gen.ability.resourceCost})`, MSG_COLOR.info);
    return false;
  }
  
  // Consume resource
  ext._genResource = currentResource - gen.ability.resourceCost;
  
  // Apply ability effect based on type
  const ability = gen.ability;
  const { player } = state;
  
  switch (ability.effectType) {
    case 'damage': {
      // Find nearest visible enemy and deal damage
      const visibleMonsters = state.monsters.filter(
        m => !m.isDead && state.floor.visible[m.pos.y]?.[m.pos.x] === true
      );
      if (visibleMonsters.length === 0) {
        addMessage(state, 'No enemies in sight!', MSG_COLOR.info);
        ext._genResource = currentResource; // Refund
        return false;
      }
      const closest = visibleMonsters.sort((a, b) => 
        manhattan(player.pos, a.pos) - manhattan(player.pos, b.pos)
      )[0]!;
      const dmg = ability.effect.value ?? (player.stats.attack * 2);
      closest.stats.hp -= dmg;
      addMessage(state, `${ability.icon} ${ability.name} hits ${closest.name} for ${dmg} damage!`, gen.color);
      if (closest.stats.hp <= 0) {
        closest.isDead = true;
        gainXP(state, closest.xp);
        addMessage(state, `${closest.name} is destroyed!`, MSG_COLOR.good);
      }
      break;
    }
    
    case 'buff_self': {
      // Apply temporary buff to player
      const buffValue = ability.effect.value ?? 5;
      const duration = ability.effect.duration ?? 5;
      player.stats.attack += Math.floor(buffValue / 2);
      player.stats.defense += Math.floor(buffValue / 2);
      addMessage(state, `${ability.icon} ${ability.name}: +${Math.floor(buffValue/2)} ATK/DEF for ${duration} turns!`, gen.color);
      break;
    }
    
    case 'summon_companion': {
      const spawnPos = findAdjacentSpot(state, player.pos);
      if (!spawnPos) {
        addMessage(state, 'No room to summon companion!', MSG_COLOR.info);
        ext._genResource = currentResource;
        return false;
      }
      const companionDef = ability.companionDef;
      const companionStats = companionDef?.stats ?? {
        hp: 10 + player.level * 2,
        maxHp: 10 + player.level * 2,
        attack: 3 + player.level,
        defense: 1 + Math.floor(player.level * 0.5),
        speed: 10,
      };
      const companion: Entity = {
        id: uid(),
        name: companionDef?.name ?? 'Summoned Companion',
        char: companionDef?.char ?? 'c',
        color: companionDef?.color ?? gen.color,
        pos: { ...spawnPos },
        stats: { ...companionStats },
        xp: 0,
        level: 1,
        isPlayer: false,
        isDead: false,
        isBoss: false,
        equipment: {},
        inventory: [],
        baseName: companionDef?.name ?? 'Summoned Companion',
      };
      state.mercenaries.push(companion);
      addMessage(state, `${ability.icon} Summoned ${companion.name}!`, gen.color);
      break;
    }

    case 'terrain_modify': {
      const radius = ability.effect.radius ?? 2;
      const count = ability.effect.value ?? 4;
      const terrainOpt = ability.terrainOptions?.[0];
      const terrainType = resolveTerrainType(terrainOpt?.terrainType);
      const placed = placeTerrain(state, player.pos.x, player.pos.y, terrainType, radius, count);
      if (placed > 0) {
        addMessage(state, `${ability.icon} ${ability.name}: ${placed} tiles of ${terrainType} created!`, gen.color);
        if (terrainOpt?.effect?.damage) {
          const nearby = state.monsters.filter(
            m => !m.isDead && manhattan(player.pos, m.pos) <= radius
          );
          for (const m of nearby) {
            const tKey = `${m.pos.x},${m.pos.y}`;
            if (state.floor.terrain[tKey]) {
              m.stats.hp -= terrainOpt.effect.damage;
              addMessage(state, `${m.name} takes ${terrainOpt.effect.damage} terrain damage!`, gen.color);
              if (m.stats.hp <= 0) { m.isDead = true; gainXP(state, m.xp); }
            }
          }
        }
      } else {
        addMessage(state, `${ability.icon} ${ability.name} activated!`, gen.color);
      }
      break;
    }

    case 'debuff_enemy': {
      const visibleMonsters = state.monsters.filter(
        m => !m.isDead && state.floor.visible[m.pos.y]?.[m.pos.x] === true
      );
      if (visibleMonsters.length === 0) {
        addMessage(state, 'No enemies in sight!', MSG_COLOR.info);
        ext._genResource = currentResource;
        return false;
      }
      const closest = visibleMonsters.sort((a, b) =>
        manhattan(player.pos, a.pos) - manhattan(player.pos, b.pos)
      )[0]!;
      const debuffVal = ability.effect.value ?? 3;
      closest.stats.attack = Math.max(0, closest.stats.attack - debuffVal);
      closest.stats.defense = Math.max(0, closest.stats.defense - debuffVal);
      addMessage(state, `${ability.icon} ${ability.name} weakens ${closest.name}! (-${debuffVal} ATK/DEF)`, gen.color);
      break;
    }

    case 'reflect': {
      const reflectVal = ability.effect.value ?? 5;
      player.stats.defense += reflectVal;
      addMessage(state, `${ability.icon} ${ability.name}: Reflecting damage! +${reflectVal} DEF`, gen.color);
      break;
    }

    case 'consume': {
      const visibleMonsters = state.monsters.filter(
        m => !m.isDead && state.floor.visible[m.pos.y]?.[m.pos.x] === true
      );
      if (visibleMonsters.length === 0) {
        addMessage(state, 'No enemies in sight!', MSG_COLOR.info);
        ext._genResource = currentResource;
        return false;
      }
      const target = visibleMonsters.sort((a, b) =>
        manhattan(player.pos, a.pos) - manhattan(player.pos, b.pos)
      )[0]!;
      const consumeDmg = ability.effect.value ?? (player.stats.attack * 2);
      target.stats.hp -= consumeDmg;
      const healAmt = Math.min(Math.floor(consumeDmg / 2), player.stats.maxHp - player.stats.hp);
      if (healAmt > 0) player.stats.hp += healAmt;
      addMessage(state, `${ability.icon} ${ability.name} drains ${target.name} for ${consumeDmg}!${healAmt > 0 ? ` +${healAmt} HP` : ''}`, gen.color);
      if (target.stats.hp <= 0) { target.isDead = true; gainXP(state, target.xp); }
      break;
    }

    case 'transform': {
      const transformAtk = ability.effect.value ?? 5;
      const transformDur = ability.effect.duration ?? 5;
      player.stats.attack += transformAtk;
      player.stats.maxHp += transformAtk;
      player.stats.hp += transformAtk;
      addMessage(state, `${ability.icon} ${ability.name}: Transformed! +${transformAtk} ATK, +${transformAtk} HP for ${transformDur} turns!`, gen.color);
      break;
    }

    case 'convert_enemy': {
      const visibleMonsters = state.monsters.filter(
        m => !m.isDead && !m.isBoss && state.floor.visible[m.pos.y]?.[m.pos.x] === true
      );
      if (visibleMonsters.length === 0) {
        addMessage(state, 'No convertible enemies in sight!', MSG_COLOR.info);
        ext._genResource = currentResource;
        return false;
      }
      const weakest = visibleMonsters.sort((a, b) => a.stats.hp - b.stats.hp)[0]!;
      weakest.isDead = true;
      const ally: Entity = {
        id: uid(),
        name: `Converted ${weakest.name}`,
        char: weakest.char,
        color: gen.color,
        pos: { ...weakest.pos },
        stats: { ...weakest.stats, hp: weakest.stats.maxHp },
        xp: 0, level: 1, isPlayer: false, isDead: false, isBoss: false,
        equipment: {}, inventory: [],
        baseName: `Converted ${weakest.baseName ?? weakest.name}`,
      };
      state.mercenaries.push(ally);
      addMessage(state, `${ability.icon} ${ability.name}: ${weakest.name} joins your side!`, gen.color);
      break;
    }
    
    default: {
      const visibleMonsters = state.monsters.filter(
        m => !m.isDead && state.floor.visible[m.pos.y]?.[m.pos.x] === true
      );
      if (visibleMonsters.length > 0) {
        const closest = visibleMonsters.sort((a, b) => 
          manhattan(player.pos, a.pos) - manhattan(player.pos, b.pos)
        )[0]!;
        const dmg = player.stats.attack * 2;
        closest.stats.hp -= dmg;
        addMessage(state, `${ability.icon} ${ability.name} hits ${closest.name} for ${dmg}!`, gen.color);
        if (closest.stats.hp <= 0) {
          closest.isDead = true;
          gainXP(state, closest.xp);
        }
      } else {
        addMessage(state, `${ability.icon} ${ability.name} activated!`, gen.color);
      }
      break;
    }
  }
  
  // Set cooldown
  ext._genAbilityCooldown = ability.cooldown ?? 3;
  
  // Track ability usage
  state.runStats.abilitiesUsed = (state.runStats.abilitiesUsed ?? 0) + 1;
  
  // Visual effect
  if (!state.projectiles) state.projectiles = [];
  state.projectiles.push({
    from: { ...player.pos },
    to: { ...player.pos },
    char: ability.icon,
    color: gen.color,
  });
  
  processTurn(state);
  return true;
}

// ─── Mercenary System ───

/** Find a walkable tile adjacent to `center` that isn't occupied by the player, a monster, or another merc. */
function findAdjacentSpot(state: GameState, center: { x: number; y: number }): { x: number; y: number } | null {
  const dirs = [
    { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 },
    { x: 1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }, { x: -1, y: -1 },
  ];
  for (const d of dirs) {
    const nx = center.x + d.x;
    const ny = center.y + d.y;
    if (nx < 0 || nx >= state.floor.width || ny < 0 || ny >= state.floor.height) continue;
    if (!isWalkableTile(getTile(state.floor, nx, ny))) continue;
    if (nx === state.player.pos.x && ny === state.player.pos.y) continue;
    if (state.monsters.some(m => !m.isDead && m.pos.x === nx && m.pos.y === ny)) continue;
    if (state.mercenaries.some(m => !m.isDead && m.pos.x === nx && m.pos.y === ny)) continue;
    return { x: nx, y: ny };
  }
  return null;
}

export function hireMercenary(state: GameState, mapMercId: string): boolean {
  const mapMerc = state.mapMercenaries.find(m => m.id === mapMercId);
  if (!mapMerc || mapMerc.hired) return false;

  // Look in both default and generated mercenaries
  let def = MERCENARY_DEFS.find(d => d.id === mapMerc.defId);
  if (!def) {
    const cache = getContentCache();
    const generatedMercs = getMercenariesForFloor(cache, state.floorNumber);
    def = generatedMercs.find(d => d.id === mapMerc.defId);
  }
  if (!def) return false;

  if (state.score < def.hireCost) {
    addMessage(state, "You can't afford to hire them!", MSG_COLOR.bad);
    return false;
  }

  const activeCount = state.mercenaries.filter(m => !m.isDead).length;
  if (activeCount >= 2) {
    addMessage(state, 'Your party is full! (max 2 mercenaries)', MSG_COLOR.bad);
    return false;
  }

  state.score -= def.hireCost;
  mapMerc.hired = true;
  state.runStats.mercenariesHired++;

  // Place the mercenary next to the player, not on top
  const spawnPos = findAdjacentSpot(state, state.player.pos) ?? { ...mapMerc.pos };

  const mercEntity: Entity = {
    id: uid(),
    pos: spawnPos,
    name: def.name,
    char: def.char,
    color: def.color,
    stats: { ...def.stats },
    xp: 0,
    level: state.floorNumber,
    inventory: [],
    equipment: {},
    isPlayer: false,
    isDead: false,
    isMercenary: true,
    mercName: `${def.name} the ${def.title}`,
  };

  state.mercenaries.push(mercEntity);
  addMessage(state, `${def.name} the ${def.title} joins your party!`, MSG_COLOR.merc);
  return true;
}

// ═══════════════════════════════════════════════════════════
// QUEST TRACKER — Build a RunQuestTracker from existing state
// ═══════════════════════════════════════════════════════════

import type { RunQuestTracker } from './types';

/**
 * Build a RunQuestTracker from the existing runStats + game state.
 * The `extra` param carries counters that aren't in runStats
 * (terrain steps, auto turns, ranged attacks, class ability uses,
 *  weapon type kills, rarity/item tracking) — these are managed
 * externally by Game.tsx.
 */
export function buildRunTracker(
  state: GameState,
  extra: Partial<RunQuestTracker>,
): RunQuestTracker {
  const rs = state.runStats;
  return {
    kills: rs.kills,
    monsterKills: { ...rs.monsterKills },
    classKills: extra.classKills ?? {},
    bossKills: rs.bossesKilled,
    bossesDefeated: [...state.bossesDefeatedThisRun],
    goldEarned: rs.goldEarned,
    damageDelt: rs.damageDealt,
    turnsSurvived: state.turn,
    foodEaten: rs.foodEaten,
    namedFoodEaten: { ...rs.namedFoodEaten },  // Use RunStats directly
    potionsUsed: rs.potionsUsed,
    namedPotionsUsed: { ...rs.namedPotionsUsed },  // Use RunStats directly
    scrollsUsed: rs.scrollsUsed,
    abilitiesUsed: rs.abilitiesUsed ?? 0,  // Use RunStats directly
    classAbilitiesUsed: extra.classAbilitiesUsed ?? {},
    mercenariesHired: rs.mercenariesHired,
    shopPurchases: (rs.shopPurchases ?? 0) + (extra.shopPurchases ?? 0),
    npcsTalkedTo: rs.npcsTalkedTo,
    highestFloor: state.floorNumber,
    highestLevel: state.player.level,
    floorsNoDamage: extra.floorsNoDamage ?? 0,
    traitsUnlocked: extra.traitsUnlocked ?? 0,
    terrainSteps: { ...(rs.terrainSteps ?? {}), ...(extra.terrainSteps ?? {}) },
    autoTurns: extra.autoTurns ?? 0,
    rangedAttacks: (rs.rangedAttacks ?? 0) + (extra.rangedAttacks ?? 0),
    weaponTypeKills: extra.weaponTypeKills ?? {},
    zonesCompleted: extra.zonesCompleted ?? [],
    rarityEquipped: { ...(rs.rarityEquipped ?? {}), ...(extra.rarityEquipped ?? {}) },
    namedItemsEquipped: [...(rs.namedItemsEquipped ?? []), ...(extra.namedItemsEquipped ?? [])],
    skillPointsSpent: extra.skillPointsSpent ?? state.unlockedNodes.length,
    echoNodesUnlocked: extra.echoNodesUnlocked ?? 0,
    echoPathNodesUnlocked: extra.echoPathNodesUnlocked ?? {},
  };
}
