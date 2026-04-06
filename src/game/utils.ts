import type { Pos, GameState, Entity, MapItem, LogMessage, MapNPC, MapMercenary, Item, StatusEffect } from './types';

/** Clone a 2D boolean array (visible/explored) — fast typed copy */
function cloneBool2D(src: boolean[][]): boolean[][] {
  const out: boolean[][] = new Array(src.length);
  for (let y = 0; y < src.length; y++) {
    const row = src[y];
    out[y] = row ? row.slice() : [];
  }
  return out;
}

/** Clone an item — shallow copy with deep copy of nested optional objects */
function cloneItem(item: Item): Item {
  const clone: Item = { ...item };
  if (item.statBonus) clone.statBonus = { ...item.statBonus };
  if (item.onHitEffect) clone.onHitEffect = { ...item.onHitEffect } as Item['onHitEffect'];
  if (item.onDefendEffect) clone.onDefendEffect = { ...item.onDefendEffect } as Item['onDefendEffect'];
  if (item.classRestriction) clone.classRestriction = [...item.classRestriction];
  return clone;
}

/** Clone a status effect — simple shallow copy */
function cloneStatusEffect(se: StatusEffect): StatusEffect {
  return { ...se };
}

/**
 * Deep clone an entity — optimized structured clone.
 * Much faster than JSON.parse/stringify and creates less garbage.
 */
function cloneEntity(e: Entity): Entity {
  const clone: Entity = {
    ...e,
    pos: { ...e.pos },
    stats: { ...e.stats },
    inventory: (e.inventory ?? []).map(cloneItem),
    equipment: {},
  };

  // Clone equipment slots
  for (const slot of Object.keys(e.equipment) as (keyof typeof e.equipment)[]) {
    const item = e.equipment[slot];
    if (item) clone.equipment[slot] = cloneItem(item);
  }

  // Clone optional arrays
  if (e.statusEffects) {
    clone.statusEffects = e.statusEffects.map(cloneStatusEffect);
  }
  if (e.abilities) {
    clone.abilities = e.abilities.map(a => ({ ...a }));
  }
  if (e.abilityCooldowns) {
    clone.abilityCooldowns = { ...e.abilityCooldowns };
  }
  if (e.terrainOnHit) {
    clone.terrainOnHit = { ...e.terrainOnHit };
  }
  if (e.bossAbility) {
    clone.bossAbility = { ...e.bossAbility };
  }

  return clone;
}

/**
 * Fast targeted clone for GameState.
 * Shares immutable data by reference (floor.tiles, floor.rooms, floor.terrain)
 * and only deep-copies the parts that change between turns.
 */
export function cloneState<T extends GameState>(state: T): T {
  const floor = state.floor;
  return {
    ...state,
    player: cloneEntity(state.player),
    monsters: (state.monsters ?? []).map(cloneEntity),
    mercenaries: (state.mercenaries ?? []).map(cloneEntity),
    items: (state.items ?? []).map(i => ({ ...i, pos: { ...i.pos }, item: { ...i.item } })) as MapItem[],
    messages: (state.messages ?? []).map(m => ({ ...m })) as LogMessage[],
    npcs: (state.npcs ?? []).map(n => ({ ...n, pos: { ...n.pos } })) as MapNPC[],
    mapMercenaries: (state.mapMercenaries ?? []).map(m => ({ ...m, pos: { ...m.pos } })) as MapMercenary[],
    hunger: { ...state.hunger },
    runStats: JSON.parse(JSON.stringify(state.runStats)),
    shop: state.shop ? { pos: { ...state.shop.pos }, stock: state.shop.stock?.map(s => ({ ...s, item: { ...s.item } })) ?? [] } : null,
    bossesDefeatedThisRun: Array.isArray(state.bossesDefeatedThisRun) ? [...state.bossesDefeatedThisRun] : [],
    unlockedNodes: Array.isArray(state.unlockedNodes) ? [...state.unlockedNodes] : [],
    projectiles: state.projectiles ? [...state.projectiles] : undefined,
    pendingAbilityChoice: state.pendingAbilityChoice ? JSON.parse(JSON.stringify(state.pendingAbilityChoice)) : state.pendingAbilityChoice,
    // Story system fields
    skills: state.skills ? { ...state.skills } : undefined,
    runStory: state.runStory ? JSON.parse(JSON.stringify(state.runStory)) : undefined,
    contentCache: state.contentCache, // Share by reference - managed separately
    hiddenElements: state.hiddenElements ? state.hiddenElements.map(e => ({ ...e, pos: { ...e.pos } })) : undefined,
    interactables: state.interactables ? state.interactables.map(e => ({ ...e, pos: { ...e.pos } })) : undefined,
    pendingStoryDialogue: state.pendingStoryDialogue ? { ...state.pendingStoryDialogue } : null,
    floor: {
      width: floor.width,
      height: floor.height,
      tiles: floor.tiles,       // immutable between floors — share by reference
      rooms: floor.rooms,       // immutable between floors — share by reference
      terrain: floor.terrain,   // immutable between floors — share by reference
      visible: cloneBool2D(floor.visible),
      explored: cloneBool2D(floor.explored),
    },
  } as T;
}

// ── Performance timing — zero-cost when profiler is not active ──
/* eslint-disable @typescript-eslint/no-explicit-any */
const _gp = () => (window as any).__GP__;

/** Start timing an action. Call gpEnd with the same name to record it. */
export function gpStart(action: string): void {
  _gp()?.timeStart(action);
}

/** End timing an action started with gpStart. */
export function gpEnd(action: string): void {
  _gp()?.timeEnd(action);
}

/** Time a synchronous function. Returns whatever the function returns. */
export function gpTime<T>(action: string, fn: () => T): T {
  const gp = _gp();
  if (!gp) return fn();
  return gp.time(action, fn);
}
/* eslint-enable @typescript-eslint/no-explicit-any */

let _idCounter = 0;

export function uid(): string {
  return `e${++_idCounter}_${((Math.random() * 0xffff) | 0).toString(16)}`;
}

export function resetIdCounter(): void {
  _idCounter = 0;
}

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

export function manhattan(a: Pos, b: Pos): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function chebyshev(a: Pos, b: Pos): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function findPath(
  start: Pos,
  goal: Pos,
  isWalkable: (x: number, y: number) => boolean,
  maxSteps = 30,
): Pos | null {
  const key = (x: number, y: number) => `${x},${y}`;
  const open: { pos: Pos; g: number; f: number }[] = [{ pos: start, g: 0, f: chebyshev(start, goal) }];
  const cameFrom = new Map<string, Pos>();
  const gScore = new Map<string, number>();
  gScore.set(key(start.x, start.y), 0);

  const dirs = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ];

  let iterations = 0;
  while (open.length > 0 && iterations < maxSteps * 10) {
    iterations++;
    open.sort((a, b) => a.f - b.f);
    const current = open.shift()!;

    if (current.pos.x === goal.x && current.pos.y === goal.y) {
      let step = current.pos;
      let k = key(step.x, step.y);
      while (cameFrom.has(k)) {
        const prev = cameFrom.get(k)!;
        if (prev.x === start.x && prev.y === start.y) return step;
        step = prev;
        k = key(step.x, step.y);
      }
      return step;
    }

    for (const d of dirs) {
      const nx = current.pos.x + d.x;
      const ny = current.pos.y + d.y;
      if (!isWalkable(nx, ny)) continue;
      const tentG = current.g + 1;
      const nk = key(nx, ny);
      const existing = gScore.get(nk);
      if (existing === undefined || tentG < existing) {
        gScore.set(nk, tentG);
        cameFrom.set(nk, current.pos);
        open.push({ pos: { x: nx, y: ny }, g: tentG, f: tentG + chebyshev({ x: nx, y: ny }, goal) });
      }
    }
  }
  return null;
}

export function linePoints(x0: number, y0: number, x1: number, y1: number): Pos[] {
  const points: Pos[] = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let cx = x0;
  let cy = y0;

  while (true) {
    points.push({ x: cx, y: cy });
    if (cx === x1 && cy === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      cx += sx;
    }
    if (e2 < dx) {
      err += dx;
      cy += sy;
    }
  }
  return points;
}
