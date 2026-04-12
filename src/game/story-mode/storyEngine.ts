/**
 * Story Mode engine adapter.
 * Wraps the existing roguelike engine to work with pre-baked chapter content,
 * checkpoint-based saves instead of permadeath, and persistent character progression.
 */

import type { GameState, PlayerClass } from '../types';
import type { ChapterDef, StoryFloorDef, CampaignSave, PrebakedMonsterSpawn } from './campaignTypes';
import { addMessage, updateFOV, attackEntity, processTurn, applyTerrainStepEffects, hasChosenAbility } from '../engine';
import { generateFloor, isWalkableTile, getTile, getTerrainAt } from '../dungeon';
import { createPlayer } from '../entities';
import { uid, resetIdCounter } from '../utils';
import { CLASS_DEFS } from '../constants';
import { getRaceDef } from '../races';
import { createEmptyRunStats, createDefaultBloodline } from '../traits';
import { HUNGER_MAX } from '../constants';
import { initializeCharacterSkills } from '../story';
import { registerStoryNpcs } from './storyNpcRegistry';

function getClassDef(id: PlayerClass) {
  return CLASS_DEFS.find(c => c.id === id) ?? CLASS_DEFS[0]!;
}

/**
 * Create a new GameState for a story mode floor using pre-baked content.
 * Unlike newGame(), this does not apply bloodline/echo bonuses and sources
 * content from the ChapterDef instead of random generation.
 */
export function newStoryFloor(
  chapter: ChapterDef,
  floorDef: StoryFloorDef,
  save: CampaignSave,
): GameState {
  resetIdCounter();

  const classDef = getClassDef(save.playerClass);
  const zone = floorDef.zone;
  const floorNumber = floorDef.floorIndex;
  const floor = generateFloor(floorNumber, zone);
  const firstRoom = floor.rooms[0]!;
  const playerPos = { x: firstRoom.centerX, y: firstRoom.centerY };

  const occupied = new Set<string>();
  occupied.add(`${playerPos.x},${playerPos.y}`);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      occupied.add(`${playerPos.x + dx},${playerPos.y + dy}`);
    }
  }

  const player = createPlayer(playerPos, classDef);
  player.chosenAbilities = [];
  player.level = save.playerLevel;

  // Apply race modifiers
  const raceDef = save.playerRace ? getRaceDef(save.playerRace) : undefined;
  if (raceDef) {
    player.stats.hp += raceDef.statMods.hp ?? 0;
    player.stats.maxHp += raceDef.statMods.hp ?? 0;
    player.stats.attack += raceDef.statMods.attack ?? 0;
    player.stats.defense += raceDef.statMods.defense ?? 0;
    player.stats.speed += raceDef.statMods.speed ?? 0;
  }

  // Restore persistent inventory/equipment from save
  try {
    const inv = JSON.parse(save.inventoryJson);
    if (Array.isArray(inv)) player.inventory = inv;
  } catch { /* fresh start */ }
  try {
    const eq = JSON.parse(save.equipmentJson);
    if (eq && typeof eq === 'object') player.equipment = eq;
  } catch { /* fresh start */ }

  // Spawn pre-baked monsters into available rooms
  const monsters = spawnPrebakedMonsters(floorDef.monsters, floor, occupied);

  // Spawn the chapter boss on the last floor
  const isLastFloor = floorDef.floorIndex === chapter.floors[chapter.floors.length - 1]?.floorIndex;
  if (isLastFloor && chapter.boss) {
    const lastRoom = floor.rooms[floor.rooms.length - 1]!;
    const bossPos = findOpenTile(lastRoom, floor, occupied);
    occupied.add(`${bossPos.x},${bossPos.y}`);
    monsters.push({
      id: uid(),
      pos: bossPos,
      name: chapter.boss.name,
      char: chapter.boss.char,
      color: chapter.boss.color,
      stats: { ...chapter.boss.stats },
      xp: 0,
      level: 1,
      inventory: [],
      equipment: {},
      isPlayer: false,
      isDead: false,
      isBoss: true,
      bossAbility: chapter.boss.bossAbility,
      element: chapter.boss.element,
      isHostile: true,
    });
  }

  // Spawn pre-baked items
  const items = spawnPrebakedItems(floorDef.items, floor, occupied);

  // Distribute story content evenly across rooms so players encounter it naturally.
  // Room 0 = player start, rooms 1..N-1 = content rooms, last room = stairs/boss
  const contentRooms = floor.rooms.slice(1, Math.max(2, floor.rooms.length - 1));
  let nextContentRoom = 0;
  const getNextRoom = () => contentRooms[nextContentRoom++ % contentRooms.length]!;

  // Spawn pre-baked NPCs in early rooms so they're found quickly
  const npcs = floorDef.npcs.map((npc) => {
    const room = getNextRoom();
    const pos = findOpenTile(room, floor, occupied);
    occupied.add(`${pos.x},${pos.y}`);
    return {
      id: uid(),
      pos,
      defId: npc.id,
      talked: false,
    };
  });

  // Place encounters as interactable elements (visible as ! on the map)
  const interactables: import('../types').InteractableElement[] = floorDef.encounters.map((enc) => {
    const room = getNextRoom();
    const pos = findOpenTile(room, floor, occupied);
    occupied.add(`${pos.x},${pos.y}`);
    return {
      id: enc.id,
      pos,
      type: (enc.type === 'skill_challenge' ? 'stuck_mechanism' :
             enc.type === 'negotiation' ? 'negotiation' :
             enc.type === 'trapped_room' ? 'locked_door' :
             enc.type === 'hidden_cache' ? 'ancient_puzzle' :
             'stuck_mechanism') as import('../types').InteractableElement['type'],
      primarySkill: enc.primarySkill,
      alternateSkill: enc.alternateSkill,
      target: enc.target,
      description: enc.description,
      interacted: false,
      successEffect: enc.successReward,
      failureEffect: enc.failurePenalty ? { type: enc.failurePenalty.type as 'damage', value: enc.failurePenalty.value } : undefined,
      successHint: enc.successDescription,
      failureHint: enc.failureDescription,
      artAsset: enc.artAsset,
    };
  });

  // Room events — also placed as interactables so they're visible and triggerable
  const roomEventInteractables: import('../types').InteractableElement[] = floorDef.roomEvents.map((evt) => {
    const room = getNextRoom();
    const pos = findOpenTile(room, floor, occupied);
    occupied.add(`${pos.x},${pos.y}`);

    const successEff = evt.criticalSuccess?.effects?.[0] || evt.success?.effects?.[0];
    const failEff = evt.failure?.effects?.[0] || evt.criticalFailure?.effects?.[0];
    return {
      id: evt.id,
      pos,
      type: 'ancient_puzzle' as import('../types').InteractableElement['type'],
      primarySkill: evt.primarySkill,
      alternateSkill: evt.alternateSkill,
      target: evt.baseDifficulty,
      description: evt.description,
      interacted: false,
      successEffect: successEff?.type === 'heal'
        ? { type: 'heal' as const, value: successEff.value ?? 10 }
        : { type: 'heal' as const, value: 10 },
      failureEffect: failEff?.type === 'damage'
        ? { type: 'damage' as const, value: failEff.value ?? 5 }
        : undefined,
      successHint: evt.success?.description || evt.criticalSuccess?.description,
      failureHint: evt.failure?.description || evt.criticalFailure?.description,
      artAsset: evt.artAsset,
    };
  });

  interactables.push(...roomEventInteractables);

  const state: GameState = {
    player,
    playerClass: save.playerClass,
    playerRace: save.playerRace,
    zone,
    monsters,
    items,
    floor,
    floorNumber,
    turn: 0,
    messages: [],
    gameOver: false,
    score: 0,
    hunger: { current: HUNGER_MAX, max: HUNGER_MAX },
    shop: null,
    runStats: createEmptyRunStats(),
    npcs,
    pendingNPC: null,
    xpMultiplier: 1.0,
    mercenaries: [],
    mapMercenaries: [],
    pendingMercenary: null,
    bossesDefeatedThisRun: [],
    skillPoints: save.skillPoints,
    unlockedNodes: [...save.unlockedNodes],
    interactables,
    hiddenElements: [],
  };

  // Add gold from save
  if (save.gold > 0) {
    const goldItem = {
      id: uid(),
      name: 'Gold',
      type: 'gold' as const,
      char: '$',
      color: '#ffd700',
      value: save.gold,
      description: '',
    };
    player.inventory.push(goldItem);
  }

  // Set empty bloodline so engine code that reads _bloodlineRef doesn't crash
  state._bloodlineRef = createDefaultBloodline();

  // Initialize character skills for skill check encounters (pass undefined bloodline for balanced defaults)
  state.skills = initializeCharacterSkills(save.playerClass, undefined);

  // Register story NPCs so the dialogue system can find them
  registerStoryNpcs(floorDef.npcs);

  addMessage(state, `Chapter: ${chapter.name} — Floor ${floorNumber}`, '#ffcc44');

  // Add ambient room messages to set the mood
  if (floorDef.roomMessages) {
    for (const msg of floorDef.roomMessages) {
      addMessage(state, msg, '#8866aa');
    }
  }

  state._isStoryMode = true;

  // Reveal tiles around the player
  updateFOV(state);

  return state;
}

/**
 * Handle death in story mode — returns the checkpoint state instead of processing bloodline.
 * Returns null if no checkpoint exists (shouldn't happen in normal flow).
 */
export function loadCheckpoint(save: CampaignSave): GameState | null {
  if (!save.checkpointState) return null;
  try {
    return JSON.parse(save.checkpointState) as GameState;
  } catch {
    return null;
  }
}

// ── Internal helpers ──

function spawnPrebakedMonsters(
  defs: PrebakedMonsterSpawn[],
  floor: GameState['floor'],
  occupied: Set<string>,
): GameState['monsters'] {
  const monsters: GameState['monsters'] = [];
  for (const def of defs) {
    for (let i = 0; i < def.count; i++) {
      const roomIdx = Math.min(monsters.length + 1, floor.rooms.length - 1);
      const room = floor.rooms[roomIdx]!;
      const pos = findOpenTile(room, floor, occupied);
      occupied.add(`${pos.x},${pos.y}`);
      monsters.push({
        id: uid(),
        pos,
        name: def.name,
        char: def.char,
        color: def.color,
        stats: { ...def.stats },
        xp: 0,
        level: 1,
        inventory: [],
        equipment: {},
        isPlayer: false,
        isDead: false,
        isBoss: def.isBoss,
        bossAbility: def.bossAbility,
        element: def.element,
        isHostile: true,
      });
    }
  }
  return monsters;
}

function spawnPrebakedItems(
  defs: import('./campaignTypes').PrebakedItemSpawn[],
  floor: GameState['floor'],
  occupied: Set<string>,
): GameState['items'] {
  const items: GameState['items'] = [];
  for (const def of defs) {
    for (let i = 0; i < def.count; i++) {
      const roomIdx = Math.min(items.length, floor.rooms.length - 1);
      const room = floor.rooms[roomIdx]!;
      const pos = findOpenTile(room, floor, occupied);
      occupied.add(`${pos.x},${pos.y}`);
      items.push({
        id: uid(),
        pos,
        item: {
          id: uid(),
          name: def.name,
          type: def.type,
          char: def.char,
          color: def.color,
          value: def.value,
          rarity: def.rarity,
          description: def.description,
          statBonus: def.statBonus,
          equipSlot: def.equipSlot,
          onHitEffect: def.onHitEffect,
        },
      });
    }
  }
  return items;
}

import { Tile, type Entity } from '../types';
import { MSG_COLOR, RARITY_DEFS } from '../constants';

function findOpenTile(
  room: { x: number; y: number; w: number; h: number },
  floor: GameState['floor'],
  occupied: Set<string>,
): { x: number; y: number } {
  for (let attempt = 0; attempt < 100; attempt++) {
    const x = room.x + 1 + Math.floor(Math.random() * Math.max(1, room.w - 2));
    const y = room.y + 1 + Math.floor(Math.random() * Math.max(1, room.h - 2));
    const key = `${x},${y}`;
    if (occupied.has(key)) continue;
    if (x >= 0 && x < floor.width && y >= 0 && y < floor.height) {
      const tile = floor.tiles[y]?.[x];
      if (tile === Tile.Floor || tile === Tile.Corridor) {
        return { x, y };
      }
    }
  }
  return { x: room.x + 1, y: room.y + 1 };
}

// ════════════════════════════════════════════════════════════════
// Story Mode Game Loop — independent of roguelike engine
// ════════════════════════════════════════════════════════════════

export interface StoryMoveResult {
  moved: boolean;
  floorChanged: boolean;
  /** Names of monsters killed this move (captured before dead-filter) */
  killedNames?: string[];
}

/**
 * Story mode movement. Mirrors movePlayer from the roguelike engine but calls
 * storyDescend() on stairs instead of the roguelike descend().
 */
export function storyMovePlayer(
  state: GameState,
  dx: number,
  dy: number,
  chapter: ChapterDef,
  save: CampaignSave,
): StoryMoveResult {
  const noMove: StoryMoveResult = { moved: false, floorChanged: false };
  if (state.gameOver) return noMove;

  if (state.player.statusEffects?.some(e => e.type === 'stun' || e.type === 'freeze')) {
    const killedBefore = state.monsters.filter(m => m.isDead).map(m => m.name);
    processTurn(state);
    return { moved: true, floorChanged: false, killedNames: killedBefore.length > 0 ? killedBefore : undefined };
  }

  const nx = state.player.pos.x + dx;
  const ny = state.player.pos.y + dy;

  if (nx < 0 || nx >= state.floor.width || ny < 0 || ny >= state.floor.height) return noMove;

  const tile = getTile(state.floor, nx, ny);

  // Mercenary
  const mapMerc = state.mapMercenaries?.find(m => !m.hired && m.pos.x === nx && m.pos.y === ny);
  if (mapMerc) {
    state.pendingMercenary = mapMerc.id;
    addMessage(state, 'A mercenary offers their services...', MSG_COLOR.merc);
    return { moved: true, floorChanged: false };
  }

  // NPC
  const npc = state.npcs.find(n => !n.talked && n.pos.x === nx && n.pos.y === ny);
  if (npc) {
    state.pendingNPC = npc.id;
    addMessage(state, 'You encounter someone...', MSG_COLOR.system);
    return { moved: true, floorChanged: false };
  }

  // Monster
  const monster = state.monsters.find(m => !m.isDead && m.pos.x === nx && m.pos.y === ny);
  if (monster) {
    if (monster.isBefriended || monster.isHostile === false) {
      const oldPos = { ...state.player.pos };
      state.player.pos.x = nx;
      state.player.pos.y = ny;
      monster.pos.x = oldPos.x;
      monster.pos.y = oldPos.y;
      processTurn(state);
      return { moved: true, floorChanged: false };
    }
    if (hasChosenAbility(state, 'rng_swift_strike')) {
      if (!monster.statusEffects) monster.statusEffects = [];
      if (!monster.statusEffects.some(e => e.type === 'stun')) {
        monster.statusEffects.push({ type: 'stun', turnsRemaining: 1 });
      }
    }
    attackEntity(state, state.player, monster as Entity);
    const killedBefore = state.monsters.filter(m => m.isDead).map(m => m.name);
    processTurn(state);
    return { moved: true, floorChanged: false, killedNames: killedBefore };
  }

  if (!isWalkableTile(tile)) return noMove;

  // Attack of opportunity
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
      attackEntity(state, m as Entity, state.player);
      if (state.gameOver) return { moved: true, floorChanged: false };
    }
  }

  state.player.pos.x = nx;
  state.player.pos.y = ny;

  // Terrain effects
  applyTerrainStepEffects(state, state.player);
  const _terrain = getTerrainAt(state.floor, nx, ny);
  if (_terrain) {
    state.runStats.terrainSteps[_terrain] = (state.runStats.terrainSteps[_terrain] ?? 0) + 1;
  }

  // Item pickup
  const itemsHere = state.items.filter(i => i.pos.x === nx && i.pos.y === ny);
  for (const mi of itemsHere) {
    if (mi.item.type === 'gold') {
      state.score += mi.item.value;
      state.runStats.goldEarned += mi.item.value;
      addMessage(state, `Picked up ${mi.item.value} gold!`, MSG_COLOR.loot);
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
    state.items = state.items.filter(i => i.id !== mi.id);
  }

  // Shop
  if (state.shop && nx === state.shop.pos.x && ny === state.shop.pos.y && state.shop.stock.length > 0) {
    addMessage(state, 'A shopkeeper! Browse their wares.', MSG_COLOR.system);
  }

  // Stairs — story mode descent
  if (tile === Tile.StairsDown) {
    storyDescend(state, chapter, save);
    return { moved: true, floorChanged: true };
  }

  const killedBefore = state.monsters.filter(m => m.isDead).map(m => m.name);
  processTurn(state);
  return { moved: true, floorChanged: false, killedNames: killedBefore.length > 0 ? killedBefore : undefined };
}

/**
 * Story mode floor descent. Replaces the entire floor with the next story floor,
 * carrying over player state. No roguelike content is ever generated.
 */
function storyDescend(state: GameState, chapter: ChapterDef, save: CampaignSave): void {
  state.floorNumber++;
  state.runStats.floorsCleared++;

  const floorDef = chapter.floors.find(f => f.floorIndex === state.floorNumber);
  if (!floorDef) {
    addMessage(state, 'You have reached the end of this chapter.', '#ffcc44');
    return;
  }

  // Save player state before rebuilding
  const playerSnapshot = {
    stats: { ...state.player.stats },
    level: state.player.level,
    xp: state.player.xp,
    inventory: [...state.player.inventory],
    equipment: { ...state.player.equipment },
    statusEffects: state.player.statusEffects ? [...state.player.statusEffects] : [],
  };
  const savedScore = state.score;
  const savedRunStats = { ...state.runStats };
  const savedBosses = [...state.bossesDefeatedThisRun];
  const savedMercs = state.mercenaries.map(m => ({ ...m }));
  const savedSkills = state.skills ? { ...state.skills } : undefined;
  const savedSkillPoints = state.skillPoints;
  const savedNodes = [...state.unlockedNodes];

  // Update campaign save
  save.currentFloor = state.floorNumber;
  save.playerLevel = playerSnapshot.level;
  save.skillPoints = savedSkillPoints;
  save.unlockedNodes = savedNodes;

  // Build the new floor
  const newState = newStoryFloor(chapter, floorDef, save);

  // Carry over player state
  newState.player.stats = playerSnapshot.stats;
  newState.player.level = playerSnapshot.level;
  newState.player.xp = playerSnapshot.xp;
  newState.player.inventory = playerSnapshot.inventory;
  newState.player.equipment = playerSnapshot.equipment;
  newState.player.statusEffects = playerSnapshot.statusEffects;
  newState.score = savedScore;
  newState.runStats = savedRunStats;
  newState.bossesDefeatedThisRun = savedBosses;
  newState.mercenaries = savedMercs;
  if (savedSkills) newState.skills = savedSkills;
  newState.skillPoints = savedSkillPoints;
  newState.unlockedNodes = savedNodes;

  // Copy the new state back onto the existing state object (in-place mutation)
  Object.assign(state, newState);
}

/**
 * Story mode wait turn. Player waits, monsters act.
 */
export function storyWaitTurn(state: GameState): string[] {
  if (state.gameOver) return [];
  addMessage(state, 'You wait...', MSG_COLOR.info);
  const killedBefore = state.monsters.filter(m => m.isDead).map(m => m.name);
  processTurn(state);
  return killedBefore;
}
