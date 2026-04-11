/**
 * Story Mode engine adapter.
 * Wraps the existing roguelike engine to work with pre-baked chapter content,
 * checkpoint-based saves instead of permadeath, and persistent character progression.
 */

import type { GameState, PlayerClass } from '../types';
import type { ChapterDef, StoryFloorDef, CampaignSave, PrebakedMonsterSpawn } from './campaignTypes';
import { addMessage, updateFOV } from '../engine';
import { generateFloor } from '../dungeon';
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

  // Spawn pre-baked NPCs as MapNPCs
  const npcs = floorDef.npcs.map((npc, i) => {
    const room = floor.rooms[Math.min(i + 1, floor.rooms.length - 1)]!;
    const pos = findOpenTile(room, floor, occupied);
    occupied.add(`${pos.x},${pos.y}`);
    return {
      id: uid(),
      pos,
      defId: npc.id,
      talked: false,
    };
  });

  // Convert pre-baked encounters into interactable elements on the map
  const interactables: import('../types').InteractableElement[] = floorDef.encounters.map((enc, i) => {
    const room = floor.rooms[Math.min(i + 2, floor.rooms.length - 1)]!;
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
    };
  });

  // Convert pre-baked room events into hidden elements the player can discover
  const hiddenElements: import('../types').HiddenElement[] = floorDef.roomEvents.map((evt, i) => {
    const room = floor.rooms[Math.min(i + 1, floor.rooms.length - 1)]!;
    const pos = findOpenTile(room, floor, occupied);
    occupied.add(`${pos.x},${pos.y}`);
    return {
      id: evt.id,
      pos,
      type: 'lore_inscription' as const,
      skill: evt.primarySkill,
      threshold: evt.baseDifficulty,
      discovered: false,
      description: evt.description,
      reward: { type: 'heal' as const, value: 0 },
    };
  });

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
    hiddenElements,
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

  // Show narrative intro if defined
  if (floorDef.narrativeIntro) {
    addMessage(state, floorDef.narrativeIntro, '#c49eff');
  }

  addMessage(state, `Chapter: ${chapter.name} — Floor ${floorNumber}`, '#ffcc44');

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
        },
      });
    }
  }
  return items;
}

import { Tile } from '../types';

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
