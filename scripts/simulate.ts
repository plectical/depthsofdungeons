/**
 * Monte Carlo Dungeon Crawler Simulation
 *
 * Runs thousands of games with AI players to collect balance data.
 * Uses the existing game engine directly — no mocking.
 *
 * Usage: npx tsx scripts/simulate.ts [runs] [--class warrior|rogue|mage|ranger|necromancer|revenant]
 */

// Browser shim must be loaded first via: npx tsx --import ./scripts/browser-shim.ts scripts/simulate.ts
import { newGame, movePlayer, useItem, equipItem, waitTurn, buyItem, hireMercenary, isAtShop, extractCauseOfDeath, chooseAbility, rangedAttack, getPlayerRange, applyDialogueEffects } from '../src/game/engine';
import { getTile, isWalkableTile } from '../src/game/dungeon';
import { getNPCDef, getNPCDialogue } from '../src/game/npcs';
import { findPath, manhattan } from '../src/game/utils';
import { HUNGER_WARNING } from '../src/game/constants';
import { Tile } from '../src/game/types';
import type { GameState, Pos, PlayerClass, BloodlineData, ZoneId } from '../src/game/types';

// ── Player Profiles ──
// derp:      Current AI — skips NPCs, basic shopping, first ability
// efficient: Smarter nav — buys food proactively, picks up items broadly, eats earlier
// best:      Optimal play — talks to NPCs, hires mercs, buys gear at shops, uses scrolls/potions smartly
type PlayerProfile = 'derp' | 'efficient' | 'best';

// ── Configuration ──
const DEFAULT_RUNS = 300;
const MAX_TURNS_PER_GAME = 2000; // Safety cap — larger maps need more turns to explore
const ALL_CLASSES: PlayerClass[] = ['warrior', 'rogue', 'mage', 'ranger', 'necromancer', 'revenant'];
const ALL_ZONES: ZoneId[] = ['stone_depths', 'frozen_caverns', 'fungal_marsh', 'infernal_pit', 'crystal_sanctum', 'shadow_realm'];

// ── Stats collection ──
interface RunResult {
  profile: PlayerProfile;
  playerClass: PlayerClass;
  zone: ZoneId;
  floorsReached: number;
  turns: number;
  kills: number;
  score: number;
  causeOfDeath: string;
  finalHp: number;
  finalMaxHp: number;
  finalLevel: number;
  bossesKilled: number;
  itemsUsed: number;
  goldSpent: number;
  stairsFound: boolean;
  finalHunger: number;
}

// ── AI step function (behavior varies by profile) ──

function simStep(state: GameState, profile: PlayerProfile): boolean {
  if (state.gameOver) return false;

  // ── Mercenary handling ──
  if (state.pendingMercenary) {
    if (profile === 'best') {
      // Best player always hires mercs
      hireMercenary(state, state.pendingMercenary);
    }
    // Derp and Efficient skip mercs
    state.pendingMercenary = null;
    return true;
  }

  // ── NPC handling ──
  if (state.pendingNPC) {
    if (profile === 'best') {
      // Best player talks to NPCs — always picks the first (beneficial) option
      const npc = state.npcs.find(n => n.id === state.pendingNPC);
      if (npc) {
        const def = getNPCDef(npc.defId);
        if (def) {
          const bloodline = state._bloodlineRef ?? { generation: 0, ancestors: [], totalKills: 0, totalDeaths: 0, totalScore: 0, totalFloors: 0, traits: [], npcChoicesMade: {}, communityDeaths: 0 } as BloodlineData;
          const dialogue = getNPCDialogue(def, bloodline);
          if (dialogue.choices && dialogue.choices.length > 0) {
            const choice = dialogue.choices[0]!;
            applyDialogueEffects(state, choice.effects, bloodline);
            npc.talked = true;
          }
        }
      }
    }
    state.pendingNPC = null;
    return true;
  }

  // ── Ability choice — best picks smartly, others pick first ──
  if (state.pendingAbilityChoice) {
    const options = state.pendingAbilityChoice.options;
    if (options.length > 0) {
      if (profile === 'best') {
        // Prefer attack/damage abilities, then defense, then shared
        const priority = ['_dark_pact', '_arcane_power', '_swift_strike', '_critical', '_exploit',
          '_overcharge', '_shield_wall', '_bone_armor', '_fortify', '_undead_vigor',
          'shared_sharp', 'shared_quick', 'shared_tough', 'shared_armor'];
        const pick = options.find(o => priority.some(p => o.id.includes(p))) ?? options[0]!;
        chooseAbility(state, pick.id);
      } else {
        chooseAbility(state, options[0]!.id);
      }
    } else {
      state.pendingAbilityChoice = null;
    }
    return true;
  }

  // ── 1. Eat food if starving ──
  if (state.hunger.current <= 5) {
    const foodIdx = state.player.inventory.findIndex(i => i.type === 'food');
    if (foodIdx >= 0) { useItem(state, foodIdx); return true; }
  }

  // ── 2. Use health potion if very low HP ──
  const hpRatio = state.player.stats.hp / state.player.stats.maxHp;
  if (hpRatio <= 0.25) {
    const fullHealIdx = state.player.inventory.findIndex(i => i.type === 'potion' && i.name.includes('Full'));
    if (fullHealIdx >= 0) { useItem(state, fullHealIdx); return true; }
    const greaterIdx = state.player.inventory.findIndex(i => i.type === 'potion' && i.name.includes('Greater'));
    if (greaterIdx >= 0) { useItem(state, greaterIdx); return true; }
    const potionIdx = state.player.inventory.findIndex(i => i.type === 'potion' && i.name.includes('Health'));
    if (potionIdx >= 0) { useItem(state, potionIdx); return true; }
  }

  // ── 3. Eat food if hungry ──
  const eatThreshold = profile === 'derp' ? HUNGER_WARNING : 40;
  if (state.hunger.current <= eatThreshold) {
    const foodIdx = state.player.inventory.findIndex(i => i.type === 'food');
    if (foodIdx >= 0) { useItem(state, foodIdx); return true; }
  }

  // ── 4. Heal at moderate HP (efficient/best only) ──
  if (profile !== 'derp' && hpRatio <= 0.40) {
    const potionIdx = state.player.inventory.findIndex(i => i.type === 'potion' && i.name.includes('Health'));
    if (potionIdx >= 0) { useItem(state, potionIdx); return true; }
  }

  // ── 4b. Best player uses Strength Potions immediately (permanent +2 atk) ──
  if (profile === 'best') {
    const strPotIdx = state.player.inventory.findIndex(i => i.type === 'potion' && i.name.includes('Strength'));
    if (strPotIdx >= 0) { useItem(state, strPotIdx); return true; }
  }

  // ── 5. Auto-equip better gear ──
  if (tryAutoEquip(state)) return true;

  // ── 6. Use offensive scroll ──
  const nearbyMonsters = state.monsters.filter(m => !m.isDead && manhattan(state.player.pos, m.pos) <= 3);
  if (profile === 'best') {
    // Best player uses scrolls against bosses or 2+ enemies
    if (nearbyMonsters.length >= 2 || nearbyMonsters.some(m => m.isBoss)) {
      const scrollIdx = state.player.inventory.findIndex(i => i.type === 'scroll');
      if (scrollIdx >= 0) { useItem(state, scrollIdx); return true; }
    }
  } else if (nearbyMonsters.length >= 3 || nearbyMonsters.some(m => m.isBoss)) {
    const scrollIdx = state.player.inventory.findIndex(i => i.type === 'scroll');
    if (scrollIdx >= 0) { useItem(state, scrollIdx); return true; }
  }

  // ── 7. Shop ──
  if (isAtShop(state) && state.shop) {
    const foodInInventory = state.player.inventory.filter(i => i.type === 'food').length;
    for (let i = 0; i < state.shop.stock.length; i++) {
      const item = state.shop.stock[i];
      if (!item) continue;
      if (state.player.inventory.length >= 20) break;

      if (profile === 'best') {
        // Best player buys EVERYTHING useful: food, potions, weapons, armor, scrolls
        if (state.score >= item.price) {
          // Always buy food (cheap and vital)
          if (item.item.type === 'food') { buyItem(state, i); return true; }
          // Always buy potions
          if (item.item.type === 'potion') { buyItem(state, i); return true; }
          // Buy scrolls
          if (item.item.type === 'scroll') { buyItem(state, i); return true; }
          // Buy weapons/armor if better than current
          if (item.item.equipSlot) {
            const current = state.player.equipment[item.item.equipSlot];
            if (!current || sumBonus(item.item.statBonus) > sumBonus(current.statBonus)) {
              buyItem(state, i); return true;
            }
          }
        }
      } else if (profile === 'efficient') {
        // Efficient buys food and potions proactively
        if (item.item.type === 'potion' && item.item.name.includes('Health') && state.score >= item.price) {
          buyItem(state, i); return true;
        }
        if (item.item.type === 'food' && (foodInInventory < 2 || state.hunger.current < 80) && state.score >= item.price) {
          buyItem(state, i); return true;
        }
      } else {
        // Derp only buys if hungry
        if (item.item.type === 'potion' && item.item.name.includes('Health') && state.score >= item.price) {
          buyItem(state, i); return true;
        }
        if (item.item.type === 'food' && state.hunger.current < 60 && state.score >= item.price) {
          buyItem(state, i); return true;
        }
      }
    }
  }

  // 7b. Boss hunting: If a boss is alive (blocking a gate), go fight it
  if (isBossGateLocked(state)) {
    const boss = state.monsters.find(m => !m.isDead && m.isBoss);
    if (boss) {
      const distToBoss = manhattan(state.player.pos, boss.pos);
      if (distToBoss === 1) {
        movePlayer(state, boss.pos.x - state.player.pos.x, boss.pos.y - state.player.pos.y);
        return true;
      }
      const step = simPathTo(state, boss.pos);
      if (step) {
        movePlayer(state, step.x - state.player.pos.x, step.y - state.player.pos.y);
        return true;
      }
    }
  }

  // 7c. Best AI: Visit the shop before heading to stairs (buy supplies for the journey)
  // But DON'T oscillate — skip if stairs are already found and we're close to them,
  // or if nothing in the shop is affordable
  if (profile === 'best' && state.shop && state.shop.stock.length > 0 && !isAtShop(state)) {
    const foodCount = state.player.inventory.filter(i => i.type === 'food').length;
    const potionCount = state.player.inventory.filter(i => i.type === 'potion').length;
    // Check if we can actually afford something useful at the shop
    const canAffordSomething = state.shop.stock.some(s =>
      state.score >= s.price && (s.item.type === 'food' || s.item.type === 'potion' || s.item.type === 'scroll')
    );
    // Don't detour to shop if stairs are already found — just descend
    const stairsAlreadyFound = findStairs(state) !== null;
    if (!stairsAlreadyFound && canAffordSomething && (foodCount < 3 || potionCount < 1)) {
      const step = simPathTo(state, state.shop.pos);
      if (step) {
        movePlayer(state, step.x - state.player.pos.x, step.y - state.player.pos.y);
        return true;
      }
    }
  }

  // 8. PRIORITY: If stairs are found, head there (fight only monsters blocking the path)
  const stairs = findStairs(state);
  if (stairs) {
    // Only fight monsters that are adjacent (blocking us) or very close to stairs
    const adjacentMonster = state.monsters.find(m =>
      !m.isDead && manhattan(state.player.pos, m.pos) === 1
    );
    if (adjacentMonster) {
      // Fight the monster blocking our path
      const dx = adjacentMonster.pos.x - state.player.pos.x;
      const dy = adjacentMonster.pos.y - state.player.pos.y;
      movePlayer(state, dx, dy);
      return true;
    }

    // Beeline for stairs
    const step = simPathTo(state, stairs);
    if (step) {
      movePlayer(state, step.x - state.player.pos.x, step.y - state.player.pos.y);
      return true;
    }
  }

  // 8b. Best AI: If stairs not explored yet, head toward last room center directly
  // A skilled player learns stairs are always in the deepest room
  if (profile === 'best' && !stairs) {
    const rooms = state.floor.rooms;
    if (rooms.length > 0) {
      const lastRoom = rooms[rooms.length - 1]!;
      const target = { x: lastRoom.centerX, y: lastRoom.centerY };
      const distToTarget = manhattan(state.player.pos, target);
      if (distToTarget > 1) {
        const step = simPathTo(state, target);
        if (step) {
          movePlayer(state, step.x - state.player.pos.x, step.y - state.player.pos.y);
          return true;
        }
      }
    }
  }

  // 9a. Ranged attack — shoot visible monsters at range before closing in
  const playerRange = getPlayerRange(state);
  if (playerRange > 1) {
    const rangedTargets = state.monsters.filter(m => {
      if (m.isDead) return false;
      const dist = manhattan(state.player.pos, m.pos);
      return dist > 1 && dist <= playerRange && state.floor.visible[m.pos.y]?.[m.pos.x];
    });
    if (rangedTargets.length > 0) {
      // Shoot the weakest target
      rangedTargets.sort((a, b) => a.stats.hp - b.stats.hp);
      const t = rangedTargets[0]!;
      if (rangedAttack(state, t.pos.x, t.pos.y)) return true;
    }
  }

  // 9b. Fight adjacent monsters (they're in the way)
  const adjacentMonster = state.monsters.find(m =>
    !m.isDead && manhattan(state.player.pos, m.pos) === 1
  );
  if (adjacentMonster) {
    const dx = adjacentMonster.pos.x - state.player.pos.x;
    const dy = adjacentMonster.pos.y - state.player.pos.y;
    movePlayer(state, dx, dy);
    return true;
  }

  // 10a. Urgently seek food if hungry and none in inventory
  if (profile !== 'derp') {
    const hasFood = state.player.inventory.some(i => i.type === 'food');
    if (state.hunger.current < 60 && !hasFood && state.player.inventory.length < 20) {
      const foodItem = findNearbyFood(state, 20);
      if (foodItem) {
        const step = simPathTo(state, foodItem);
        if (step) {
          movePlayer(state, step.x - state.player.pos.x, step.y - state.player.pos.y);
          return true;
        }
      }
    }
  }

  // 10b. Pick up items — best picks up in wider range
  const pickupRange = profile === 'best' ? 15 : profile === 'efficient' ? 8 : 5;
  if (state.player.inventory.length < 20) {
    const pickup = findNearbyItem(state, pickupRange);
    if (pickup) {
      const step = simPathTo(state, pickup);
      if (step) {
        movePlayer(state, step.x - state.player.pos.x, step.y - state.player.pos.y);
        return true;
      }
    }
  }

  // 10c. Best AI: Hunt visible monsters for XP/gold/drops before exploring
  if (profile === 'best') {
    const nearestVisible = state.monsters
      .filter(m => !m.isDead && state.floor.visible[m.pos.y]?.[m.pos.x])
      .sort((a, b) => manhattan(state.player.pos, a.pos) - manhattan(state.player.pos, b.pos))[0];
    if (nearestVisible) {
      const dist = manhattan(state.player.pos, nearestVisible.pos);
      if (dist === 1) {
        movePlayer(state, nearestVisible.pos.x - state.player.pos.x, nearestVisible.pos.y - state.player.pos.y);
        return true;
      }
      const step = simPathTo(state, nearestVisible.pos);
      if (step) {
        movePlayer(state, step.x - state.player.pos.x, step.y - state.player.pos.y);
        return true;
      }
    }
  }

  // 11. Explore to find the stairs
  if (profile === 'best') {
    // Best AI: Use directional exploration — prefer explore targets that lead
    // toward the stairs room (last room in chain). This combines normal frontier
    // exploration with knowledge of where stairs are likely to be.
    const exploreTarget = findExploreTargetDirectional(state);
    if (exploreTarget) {
      const step = simPathTo(state, exploreTarget);
      if (step) {
        movePlayer(state, step.x - state.player.pos.x, step.y - state.player.pos.y);
        return true;
      }
    }
    // Fallback to room-chain if directional exploration fails
    const roomTarget = findNextRoomInChain(state);
    if (roomTarget) {
      const step = simPathTo(state, roomTarget);
      if (step) {
        movePlayer(state, step.x - state.player.pos.x, step.y - state.player.pos.y);
        return true;
      }
    }
  } else {
    // Derp/Efficient: generic frontier exploration
    const exploreTarget = findExploreTarget(state);
    if (exploreTarget) {
      const step = simPathTo(state, exploreTarget);
      if (step) {
        movePlayer(state, step.x - state.player.pos.x, step.y - state.player.pos.y);
        return true;
      }
    }
  }

  // 12. Last resort: walk toward any walkable adjacent tile we haven't visited recently
  const dirs = [[0,-1],[0,1],[-1,0],[1,0]] as const;
  const shuffled = [...dirs].sort(() => Math.random() - 0.5);
  for (const [dx, dy] of shuffled) {
    const nx = state.player.pos.x + dx;
    const ny = state.player.pos.y + dy;
    if (nx < 0 || nx >= state.floor.width || ny < 0 || ny >= state.floor.height) continue;
    const tile = getTile(state.floor, nx, ny);
    if (!isWalkableTile(tile)) continue;
    if (state.monsters.some(m => !m.isDead && m.pos.x === nx && m.pos.y === ny)) continue;
    movePlayer(state, dx, dy);
    return true;
  }

  // 13. Nothing to do — wait
  waitTurn(state);
  return true;
}

// ── Helper functions (adapted from autoplay.ts) ──

function isVisible(state: GameState, pos: Pos): boolean {
  return state.floor.visible[pos.y]?.[pos.x] === true;
}

/** Check if any boss gate on this floor is still locked (boss alive) */
function isBossGateLocked(state: GameState): boolean {
  const arena = state.floor.rooms.find(r => r.isBossArena);
  if (!arena) return false;
  return state.monsters.some(m => !m.isDead && m.isBoss);
}

function simPathTo(state: GameState, target: Pos): Pos | null {
  const dist = manhattan(state.player.pos, target);

  // For very close targets, use simple greedy step (much faster than A*)
  if (dist <= 2) {
    return greedyStep(state, target);
  }

  const bossGateLocked = isBossGateLocked(state);

  // Use A* with generous step limit — maps are up to 60x40, corridors wind far
  // Treat monsters as walkable — the AI will fight them when adjacent.
  // Without this, a single monster in a corridor blocks the entire path.
  // Treat locked BossGates as walls — the AI can't pass through them.
  const isWalk = (x: number, y: number) => {
    if (x < 0 || x >= state.floor.width || y < 0 || y >= state.floor.height) return false;
    if (state.npcs?.some(n => !n.talked && n.pos.x === x && n.pos.y === y)) return false;
    const tile = getTile(state.floor, x, y);
    if (tile === Tile.BossGate && bossGateLocked) return false;
    return isWalkableTile(tile);
  };
  return findPath(state.player.pos, target, isWalk, 200);
}

/** Fast greedy single-step toward a target */
function greedyStep(state: GameState, target: Pos): Pos | null {
  const px = state.player.pos.x;
  const py = state.player.pos.y;
  const bossLocked = isBossGateLocked(state);
  const dirs = [[0,-1],[0,1],[-1,0],[1,0]] as const;
  let bestDir: Pos | null = null;
  let bestDist = Infinity;
  for (const [dx, dy] of dirs) {
    const nx = px + dx;
    const ny = py + dy;
    if (nx < 0 || nx >= state.floor.width || ny < 0 || ny >= state.floor.height) continue;
    const tile = getTile(state.floor, nx, ny);
    if (tile === Tile.BossGate && bossLocked) continue;
    if (!isWalkableTile(tile)) continue;
    // Allow stepping toward monsters (we'll fight them)
    const d = manhattan({ x: nx, y: ny }, target);
    if (d < bestDist) { bestDist = d; bestDir = { x: nx, y: ny }; }
  }
  return bestDir;
}

/**
 * Best AI room-chain navigation.
 * Rooms are generated in a linear chain (room[0]→room[1]→...→room[last]).
 * Stairs are always in the last room. The Best AI navigates through the chain
 * by finding which room it's currently in (or nearest to), then heading to the
 * next room in the chain toward the stairs.
 */
function findNextRoomInChain(state: GameState): Pos | null {
  const rooms = state.floor.rooms;
  if (rooms.length === 0) return null;

  const pp = state.player.pos;

  // Find which room the player is currently in (or closest to)
  let currentRoomIdx = -1;
  let closestRoomIdx = 0;
  let closestDist = Infinity;

  for (let i = 0; i < rooms.length; i++) {
    const r = rooms[i]!;
    // Check if player is inside this room
    if (pp.x >= r.x && pp.x < r.x + r.w && pp.y >= r.y && pp.y < r.y + r.h) {
      currentRoomIdx = i;
      break;
    }
    // Track closest room center
    const dist = manhattan(pp, { x: r.centerX, y: r.centerY });
    if (dist < closestDist) {
      closestDist = dist;
      closestRoomIdx = i;
    }
  }

  // If not inside any room (in a corridor), use closest room
  if (currentRoomIdx === -1) currentRoomIdx = closestRoomIdx;

  // Target the next room toward the end of the chain (where stairs are)
  // Skip rooms we've already passed through (explored centers)
  for (let i = currentRoomIdx + 1; i < rooms.length; i++) {
    const target = rooms[i]!;
    return { x: target.centerX, y: target.centerY };
  }

  // If we're in or past the last room, target the stairs directly
  const lastRoom = rooms[rooms.length - 1]!;
  return { x: lastRoom.centerX, y: lastRoom.centerY };
}

/**
 * Best AI directional exploration.
 * Uses the same frontier/room exploration as normal, but scores targets based on
 * their proximity to the stairs room (last room in chain). This means the AI still
 * explores properly (collecting items, fighting monsters it encounters) but heads
 * generally toward where the stairs are, rather than exploring the closest frontier first.
 */
function findExploreTargetDirectional(state: GameState): Pos | null {
  const rooms = state.floor.rooms;
  const stairsRoom = rooms.length > 0 ? rooms[rooms.length - 1]! : null;
  const stairsCenter = stairsRoom ? { x: stairsRoom.centerX, y: stairsRoom.centerY } : null;

  // Collect ALL frontier candidates (explored walkable tiles with unexplored neighbors)
  const frontiers: { pos: Pos; dist: number; stairsDist: number }[] = [];

  for (let y = 0; y < state.floor.height; y++) {
    for (let x = 0; x < state.floor.width; x++) {
      if (!state.floor.explored[y]?.[x]) continue;
      const tile = getTile(state.floor, x, y);
      if (!isWalkableTile(tile)) continue;
      const hasUnexploredNeighbor = [[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dy]) => {
        const nx = x + dx!;
        const ny = y + dy!;
        if (nx < 0 || nx >= state.floor.width || ny < 0 || ny >= state.floor.height) return false;
        if (state.floor.explored[ny]?.[nx]) return false;
        const nt = getTile(state.floor, nx, ny);
        return nt !== Tile.Void;
      });
      if (!hasUnexploredNeighbor) continue;

      const pos = { x, y };
      const dist = manhattan(state.player.pos, pos);
      const stairsDist = stairsCenter ? manhattan(pos, stairsCenter) : 0;
      frontiers.push({ pos, dist, stairsDist });
    }
  }

  if (frontiers.length > 0) {
    // Score: prefer frontiers that are both close to us AND close to stairs room
    // Combined score: distance from player + 0.5 * distance from stairs
    // (The 0.5 weight means stairs proximity matters but we won't walk far for it)
    frontiers.sort((a, b) => {
      const scoreA = a.dist + 0.5 * a.stairsDist;
      const scoreB = b.dist + 0.5 * b.stairsDist;
      return scoreA - scoreB;
    });
    return frontiers[0]!.pos;
  }

  // Strategy 2: Navigate to nearest unexplored room center, prefer rooms closer to stairs
  let bestRoom: Pos | null = null;
  let bestScore = Infinity;

  for (const room of rooms) {
    const cx = room.centerX;
    const cy = room.centerY;
    if (state.floor.explored[cy]?.[cx]) continue;
    const dist = manhattan(state.player.pos, { x: cx, y: cy });
    const stairsDist = stairsCenter ? manhattan({ x: cx, y: cy }, stairsCenter) : 0;
    const score = dist + 0.5 * stairsDist;
    if (score < bestScore) {
      bestScore = score;
      bestRoom = { x: cx, y: cy };
    }
  }

  if (bestRoom) return bestRoom;

  // Strategy 3: Any unexplored walkable tile
  let bestAny: Pos | null = null;
  let bestAnyDist = Infinity;
  for (let y = 0; y < state.floor.height; y++) {
    for (let x = 0; x < state.floor.width; x++) {
      if (state.floor.explored[y]?.[x]) continue;
      const tile = getTile(state.floor, x, y);
      if (!isWalkableTile(tile)) continue;
      const dist = manhattan(state.player.pos, { x, y });
      if (dist < bestAnyDist) { bestAnyDist = dist; bestAny = { x, y }; }
    }
  }

  return bestAny;
}

function findExploreTarget(state: GameState): Pos | null {
  // Strategy 1: Find explored walkable tiles that have unexplored neighbors
  // (original approach — works for visible frontiers)
  let bestFrontier: Pos | null = null;
  let bestFrontierDist = Infinity;

  for (let y = 0; y < state.floor.height; y++) {
    for (let x = 0; x < state.floor.width; x++) {
      if (!state.floor.explored[y]?.[x]) continue;
      const tile = getTile(state.floor, x, y);
      if (!isWalkableTile(tile)) continue;
      const hasUnexploredNeighbor = [[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dy]) => {
        const nx = x + dx!;
        const ny = y + dy!;
        if (nx < 0 || nx >= state.floor.width || ny < 0 || ny >= state.floor.height) return false;
        if (state.floor.explored[ny]?.[nx]) return false;
        const nt = getTile(state.floor, nx, ny);
        // Check for walkable or wall — walls beyond explored edges may hide corridors
        return nt !== Tile.Void;
      });
      if (!hasUnexploredNeighbor) continue;

      const dist = manhattan(state.player.pos, { x, y });
      if (dist < bestFrontierDist) { bestFrontierDist = dist; bestFrontier = { x, y }; }
    }
  }

  if (bestFrontier) return bestFrontier;

  // Strategy 2: Navigate to nearest unexplored room center
  // The dungeon generator connects rooms with corridors, so room centers are reachable.
  // This handles the case where frontier detection fails (e.g., corridors behind walls).
  let bestRoom: Pos | null = null;
  let bestRoomDist = Infinity;

  for (const room of state.floor.rooms) {
    const cx = room.centerX;
    const cy = room.centerY;
    // Skip rooms whose centers we've already explored
    if (state.floor.explored[cy]?.[cx]) continue;
    const dist = manhattan(state.player.pos, { x: cx, y: cy });
    if (dist < bestRoomDist) {
      bestRoomDist = dist;
      bestRoom = { x: cx, y: cy };
    }
  }

  if (bestRoom) return bestRoom;

  // Strategy 3: Find ANY unexplored walkable tile (brute force fallback)
  let bestAny: Pos | null = null;
  let bestAnyDist = Infinity;

  for (let y = 0; y < state.floor.height; y++) {
    for (let x = 0; x < state.floor.width; x++) {
      if (state.floor.explored[y]?.[x]) continue;
      const tile = getTile(state.floor, x, y);
      if (!isWalkableTile(tile)) continue;
      const dist = manhattan(state.player.pos, { x, y });
      if (dist < bestAnyDist) { bestAnyDist = dist; bestAny = { x, y }; }
    }
  }

  return bestAny;
}

function findNearbyItem(state: GameState, maxRange = 20): Pos | null {
  let bestPos: Pos | null = null;
  let bestDist = Infinity;
  for (const mi of state.items) {
    if (!state.floor.explored[mi.pos.y]?.[mi.pos.x]) continue;
    const dist = manhattan(state.player.pos, mi.pos);
    if (dist < bestDist && dist <= maxRange) { bestDist = dist; bestPos = mi.pos; }
  }
  return bestPos;
}

function findNearbyFood(state: GameState, maxRange = 20): Pos | null {
  let bestPos: Pos | null = null;
  let bestDist = Infinity;
  for (const mi of state.items) {
    if (mi.item.type !== 'food') continue;
    if (!state.floor.explored[mi.pos.y]?.[mi.pos.x]) continue;
    const dist = manhattan(state.player.pos, mi.pos);
    if (dist < bestDist && dist <= maxRange) { bestDist = dist; bestPos = mi.pos; }
  }
  return bestPos;
}

// Cache stairs position per floor to avoid rescanning 2400 tiles every turn
let cachedStairsFloor = -1;
let cachedStairsPos: Pos | null = null;

function findStairs(state: GameState): Pos | null {
  // Only rescan if floor changed or stairs not found yet
  if (state.floorNumber !== cachedStairsFloor || !cachedStairsPos) {
    cachedStairsPos = null;
    cachedStairsFloor = state.floorNumber;
    for (let y = 0; y < state.floor.height; y++) {
      for (let x = 0; x < state.floor.width; x++) {
        if (getTile(state.floor, x, y) === Tile.StairsDown) {
          cachedStairsPos = { x, y };
          break;
        }
      }
      if (cachedStairsPos) break;
    }
  }
  // Only return if explored
  if (cachedStairsPos && state.floor.explored[cachedStairsPos.y]?.[cachedStairsPos.x]) {
    return cachedStairsPos;
  }
  return null;
}

function tryAutoEquip(state: GameState): boolean {
  const player = state.player;
  for (let i = 0; i < player.inventory.length; i++) {
    const item = player.inventory[i];
    if (!item || !item.equipSlot) continue;
    const current = player.equipment[item.equipSlot];
    if (!current) { equipItem(state, i); return true; }
    const currentTotal = sumBonus(current.statBonus);
    const newTotal = sumBonus(item.statBonus);
    if (newTotal > currentTotal) { equipItem(state, i); return true; }
  }
  return false;
}

function sumBonus(bonus: Partial<Record<string, number>> | undefined): number {
  if (!bonus) return 0;
  let total = 0;
  for (const v of Object.values(bonus)) { if (typeof v === 'number') total += v; }
  return total;
}

// ── Single game simulation ──

function simulateGame(playerClass: PlayerClass, zone: ZoneId, profile: PlayerProfile = 'efficient', bloodline?: BloodlineData): RunResult {
  cachedStairsFloor = -1;
  cachedStairsPos = null;
  const state = newGame(playerClass, bloodline, zone);
  let itemsUsed = 0;
  const startScore = state.score;
  let positionStaleCounter = 0;
  let lastPosKey = `${state.player.pos.x},${state.player.pos.y}`;
  // Track unique positions visited on this floor to detect true stalling
  let floorPositions = new Set<string>();
  floorPositions.add(lastPosKey);
  let lastFloor = state.floorNumber;

  while (!state.gameOver && state.turn < MAX_TURNS_PER_GAME) {
    const prevInvLen = state.player.inventory.length;
    simStep(state, profile);
    if (state.player.inventory.length < prevInvLen) itemsUsed++;

    // Floor changed — reset tracking
    if (state.floorNumber !== lastFloor) {
      lastFloor = state.floorNumber;
      floorPositions = new Set<string>();
      positionStaleCounter = 0;
    }

    // Track position — AI is stuck if it keeps revisiting same positions
    const posKey = `${state.player.pos.x},${state.player.pos.y}`;
    if (posKey === lastPosKey) {
      positionStaleCounter++;
      if (positionStaleCounter > 100) break; // Truly stuck in place
    } else {
      positionStaleCounter = 0;
      lastPosKey = posKey;
    }
    floorPositions.add(posKey);
  }

  // Check if stairs were ever found on the final floor
  const stairsFound = !!findStairs(state);

  return {
    profile,
    playerClass,
    zone,
    floorsReached: state.floorNumber,
    turns: state.turn,
    kills: state.runStats.kills,
    score: state.score,
    causeOfDeath: state.gameOver ? extractCauseOfDeath(state) : (positionStaleCounter > 100 ? 'stuck (AI lost)' : 'timeout'),
    finalHp: state.player.stats.hp,
    finalMaxHp: state.player.stats.maxHp,
    finalLevel: state.player.level,
    bossesKilled: state.runStats.bossesKilled,
    itemsUsed,
    goldSpent: Math.max(0, startScore - state.score + state.runStats.kills * 5), // rough estimate
    stairsFound,
    finalHunger: state.hunger.current,
  };
}

// ── Statistics helpers ──

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.floor((p / 100) * (sorted.length - 1));
  return sorted[idx]!;
}

function avg(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// ── Main simulation runner ──

function runSimulation(totalRuns: number, classFilter?: PlayerClass, profileFilter?: PlayerProfile) {
  const classes = classFilter ? [classFilter] : ALL_CLASSES;
  const profiles: PlayerProfile[] = profileFilter ? [profileFilter] : ['derp', 'efficient', 'best'];
  const results: RunResult[] = [];

  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║     MONTE CARLO DUNGEON CRAWLER SIMULATION      ║');
  console.log('║         with Player Profiles (3 tiers)          ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log();

  const runsPerCombo = Math.max(10, Math.ceil(totalRuns / (classes.length * profiles.length)));
  const startTime = Date.now();

  for (const prof of profiles) {
    console.log(`  ── Profile: ${prof.toUpperCase()} ──`);
    for (const cls of classes) {
      process.stdout.write(`    ${cls}...`);
      const classStart = Date.now();

      for (let i = 0; i < runsPerCombo; i++) {
        const zone = ALL_ZONES[i % ALL_ZONES.length]!;
        const result = simulateGame(cls, zone, prof);
        results.push(result);
      }

      const elapsed = ((Date.now() - classStart) / 1000).toFixed(1);
      console.log(` done (${elapsed}s)`);
    }
    console.log();
  }

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  Total: ${results.length} games in ${totalElapsed}s\n`);

  // ══════════════════════════════════════════════════
  //                PROFILE COMPARISON
  // ══════════════════════════════════════════════════
  console.log('═══════════════════════════════════════════════════');
  console.log('              PROFILE COMPARISON');
  console.log('═══════════════════════════════════════════════════');

  for (const prof of profiles) {
    const pr = results.filter(r => r.profile === prof);
    if (pr.length === 0) continue;
    const pFloors = pr.map(r => r.floorsReached);
    const pKills = pr.map(r => r.kills);
    const pScores = pr.map(r => r.score);
    const pLevels = pr.map(r => r.finalLevel);
    const pBosses = pr.map(r => r.bossesKilled);
    const starvPct = (pr.filter(r => r.causeOfDeath.toLowerCase().includes('starv')).length / pr.length * 100).toFixed(0);
    const combatPct = (pr.filter(r => r.causeOfDeath.toLowerCase().includes('slain')).length / pr.length * 100).toFixed(0);
    const stuckPct = (pr.filter(r => r.causeOfDeath === 'stuck (AI lost)' || r.causeOfDeath === 'timeout').length / pr.length * 100).toFixed(0);

    const label = prof === 'derp' ? 'DERP (casual player)' : prof === 'efficient' ? 'EFFICIENT (good player)' : 'BEST (optimal player)';
    console.log(`\n  ┌─── ${label} (${pr.length} runs) ───┐`);
    console.log(`  │ Floor: avg=${avg(pFloors).toFixed(1)}  med=${median(pFloors)}  p10=${percentile(pFloors, 10)}  p90=${percentile(pFloors, 90)}  max=${Math.max(...pFloors)}`);
    console.log(`  │ Kills: avg=${avg(pKills).toFixed(1)}  Score: avg=${avg(pScores).toFixed(0)}  Level: avg=${avg(pLevels).toFixed(1)}`);
    console.log(`  │ Bosses killed: avg=${avg(pBosses).toFixed(1)}`);
    console.log(`  │ Deaths: ${combatPct}% combat, ${starvPct}% starvation, ${stuckPct}% AI-stuck/timeout`);

    // Per-class within this profile
    for (const cls of classes) {
      const cr = pr.filter(r => r.playerClass === cls);
      if (cr.length === 0) continue;
      const cf = cr.map(r => r.floorsReached);
      console.log(`  │   ${cls.padEnd(13)} avg=${avg(cf).toFixed(1)} med=${median(cf)} max=${Math.max(...cf)}`);
    }
    console.log(`  └──────────────────────────────────┘`);
  }

  // ══════════════════════════════════════════════════
  //              PER-CLASS (all profiles)
  // ══════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════');
  console.log('          PER-CLASS BREAKDOWN (all profiles)');
  console.log('═══════════════════════════════════════════════════');

  for (const cls of classes) {
    const classResults = results.filter(r => r.playerClass === cls);
    if (classResults.length === 0) continue;
    const cFloors = classResults.map(r => r.floorsReached);
    const cKills = classResults.map(r => r.kills);
    const cBosses = classResults.map(r => r.bossesKilled);
    const cDeaths: Record<string, number> = {};
    for (const r of classResults) cDeaths[r.causeOfDeath] = (cDeaths[r.causeOfDeath] ?? 0) + 1;
    const topDeaths = Object.entries(cDeaths).sort((a, b) => b[1] - a[1]).slice(0, 3);

    console.log(`\n  ${cls.toUpperCase()} (${classResults.length} runs): avg floor=${avg(cFloors).toFixed(1)} med=${median(cFloors)} kills=${avg(cKills).toFixed(1)} bosses=${avg(cBosses).toFixed(1)}`);
    console.log(`    Deaths: ${topDeaths.map(([c, n]) => `${c}(${n})`).join(', ')}`);
  }

  // ══════════════════════════════════════════════════
  //                PER-ZONE
  // ══════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════');
  console.log('                 PER-ZONE BREAKDOWN');
  console.log('═══════════════════════════════════════════════════');

  for (const zone of ALL_ZONES) {
    const zoneResults = results.filter(r => r.zone === zone);
    if (zoneResults.length === 0) continue;
    const zFloors = zoneResults.map(r => r.floorsReached);
    console.log(`  ${zone}: avg floor=${avg(zFloors).toFixed(1)} med=${median(zFloors)} (${zoneResults.length} runs)`);
  }

  // ══════════════════════════════════════════════════
  //              BALANCE ASSESSMENT
  // ══════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════');
  console.log('              BALANCE ASSESSMENT');
  console.log('═══════════════════════════════════════════════════');

  // Use the "efficient" profile as the balance baseline (represents average player)
  const efficientResults = results.filter(r => r.profile === 'efficient');
  const baseResults = efficientResults.length > 0 ? efficientResults : results;
  const floors = baseResults.map(r => r.floorsReached);
  const medianFloor = median(floors);
  const p10Floor = percentile(floors, 10);
  const p90Floor = percentile(floors, 90);
  const starvationPct = baseResults.filter(r => r.causeOfDeath.toLowerCase().includes('starv')).length / baseResults.length * 100;
  const combatPct = baseResults.filter(r => r.causeOfDeath.toLowerCase().includes('slain')).length / baseResults.length * 100;
  const deathCauses: Record<string, number> = {};
  for (const r of baseResults) deathCauses[r.causeOfDeath] = (deathCauses[r.causeOfDeath] ?? 0) + 1;
  const timeoutPct = (deathCauses['timeout'] ?? 0) / baseResults.length * 100;

  console.log('\n  DIFFICULTY TARGETS vs ACTUAL:');
  console.log(`    Median floor reached:      ${medianFloor}    (target: 4-6 = challenging but fair)`);
  console.log(`    p10 floor (worst runs):     ${p10Floor}    (target: 2-3 = bad luck still gets somewhere)`);
  console.log(`    p90 floor (best runs):      ${p90Floor}    (target: 8-12 = skilled play rewarded)`);
  console.log(`    Starvation deaths:          ${starvationPct.toFixed(1)}%  (target: 5-15% = hunger matters but isn't main killer)`);
  console.log(`    Combat deaths:              ${combatPct.toFixed(1)}%  (target: 70-85% = combat is the main challenge)`);

  // Assess each metric
  const issues: string[] = [];
  const goods: string[] = [];

  if (medianFloor <= 2) issues.push('TOO HARD: Most runs die on floor 1-2. Early monsters may be too strong or too many.');
  else if (medianFloor <= 3) issues.push('SLIGHTLY HARD: Median floor 3 — early game could use a small HP or food buff.');
  else if (medianFloor >= 8) issues.push('TOO EASY: Players consistently reach floor 8+. Consider scaling monster stats faster.');
  else goods.push(`Median floor ${medianFloor} is in a good range.`);

  if (p10Floor <= 1) issues.push('FLOOR 1 DEATHS TOO COMMON: Some players die immediately. Floor 1 might need fewer or weaker monsters.');
  else goods.push(`Even unlucky runs reach floor ${p10Floor} — floor 1 is survivable.`);

  if (p90Floor <= 5) issues.push('SKILL CEILING TOO LOW: Best runs only reach floor 5. Better gear or more items needed on later floors.');
  else if (p90Floor >= 15) issues.push('TOP RUNS GO TOO FAR: p90 at floor 15+ means scaling is too flat after mid-game.');
  else goods.push(`Top 10% reaching floor ${p90Floor} shows good skill ceiling.`);

  if (starvationPct > 30) issues.push('TOO MUCH STARVATION: Over 30% die to hunger. Need more food drops or slower hunger drain.');
  else if (starvationPct < 3) issues.push('HUNGER TOO EASY: Less than 3% starvation — hunger mechanic is irrelevant. Consider faster drain or less food.');
  else goods.push(`Starvation at ${starvationPct.toFixed(1)}% is a meaningful pressure without being dominant.`);

  if (combatPct < 50) issues.push('NOT ENOUGH COMBAT DEATHS: Under 50% die to monsters. Consider buffing monster damage or frequency.');
  else if (combatPct > 95) issues.push('ALMOST ALL COMBAT DEATHS: Non-combat systems (hunger, terrain) feel irrelevant.');
  else goods.push(`Combat deaths at ${combatPct.toFixed(1)}% — combat is the main challenge.`);

  // Class balance (based on efficient profile)
  const classAvgFloors: Record<string, number> = {};
  for (const cls of classes) {
    const cf = baseResults.filter(r => r.playerClass === cls).map(r => r.floorsReached);
    if (cf.length > 0) classAvgFloors[cls] = avg(cf);
  }
  const classFloorValues = Object.values(classAvgFloors);
  if (classFloorValues.length > 1) {
    const maxClassFloor = Math.max(...classFloorValues);
    const minClassFloor = Math.min(...classFloorValues);
    if (maxClassFloor - minClassFloor > 2) {
      const best = Object.entries(classAvgFloors).sort((a, b) => b[1] - a[1])[0]!;
      const worst = Object.entries(classAvgFloors).sort((a, b) => a[1] - b[1])[0]!;
      issues.push(`CLASS IMBALANCE: ${best[0]} averages floor ${best[1].toFixed(1)} vs ${worst[0]} at ${worst[1].toFixed(1)} (gap > 2 floors).`);
    } else {
      goods.push(`Classes are reasonably balanced (spread < 2 floors).`);
    }
  }

  if (goods.length > 0) {
    console.log('\n  GOOD:');
    for (const g of goods) console.log(`    ✓ ${g}`);
  }
  if (issues.length > 0) {
    console.log('\n  ISSUES:');
    for (const iss of issues) console.log(`    ✗ ${iss}`);
  }
  if (issues.length === 0) {
    console.log('\n  ★ No major balance issues detected!');
  }

  // ── AI Pathfinding Diagnostic ──
  console.log('\n═══════════════════════════════════════════════════');
  console.log('            AI NAVIGATION DIAGNOSTIC');
  console.log('═══════════════════════════════════════════════════');

  const allResults = results;
  const timeoutRuns = allResults.filter(r => r.causeOfDeath === 'timeout' || r.causeOfDeath === 'stuck (AI lost)');
  const stuckRuns = allResults.filter(r => r.causeOfDeath === 'stuck (AI lost)');
  const trueTimeouts = allResults.filter(r => r.causeOfDeath === 'timeout');
  const stairsNeverFound = timeoutRuns.filter(r => !r.stairsFound);
  const stairsFoundButStuck = timeoutRuns.filter(r => r.stairsFound);
  const starvedInTimeout = timeoutRuns.filter(r => r.finalHunger <= 0);
  const aliveInTimeout = timeoutRuns.filter(r => r.finalHp > 0 && r.finalHunger > 0);

  console.log(`\n  Of ${timeoutRuns.length} non-combat/non-starvation deaths:`);
  console.log(`    ${stuckRuns.length} stuck (AI wandered 500+ turns on same floor)`);
  console.log(`    ${trueTimeouts.length} hit turn limit (${MAX_TURNS_PER_GAME} turns)`);
  console.log(`    ${stairsNeverFound.length} never found the stairs`);
  console.log(`    ${stairsFoundButStuck.length} found stairs but couldn't reach them`);
  console.log(`    ${starvedInTimeout.length} were starving (hunger=0) when they timed out`);
  console.log(`    ${aliveInTimeout.length} were healthy but just lost`);

  // Real death rate (excluding AI navigation failures)
  const realDeaths = allResults.filter(r => r.causeOfDeath !== 'timeout' && r.causeOfDeath !== 'stuck (AI lost)');
  if (realDeaths.length > 0) {
    const realFloors = realDeaths.map(r => r.floorsReached);
    console.log(`\n  REAL DEATHS ONLY (${realDeaths.length} games, excluding AI-stuck):`);
    console.log(`    Avg floor: ${avg(realFloors).toFixed(1)}  Median: ${median(realFloors)}  Max: ${Math.max(...realFloors)}`);
    const realStarv = realDeaths.filter(r => r.causeOfDeath.toLowerCase().includes('starv')).length;
    const realCombat = realDeaths.filter(r => r.causeOfDeath.toLowerCase().includes('slain')).length;
    console.log(`    Starvation: ${realStarv} (${(realStarv/realDeaths.length*100).toFixed(0)}%)  Combat: ${realCombat} (${(realCombat/realDeaths.length*100).toFixed(0)}%)`);
  }

  console.log('\n═══════════════════════════════════════════════════\n');

  return { results, issues, goods };
}

// ── CLI entry point ──
const args = process.argv.slice(2);
let runs = DEFAULT_RUNS;
let classFilter: PlayerClass | undefined;
let profileFilter: PlayerProfile | undefined;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--class' && args[i + 1]) {
    classFilter = args[i + 1] as PlayerClass;
    i++;
  } else if (args[i] === '--profile' && args[i + 1]) {
    profileFilter = args[i + 1] as PlayerProfile;
    i++;
  } else if (!isNaN(Number(args[i]))) {
    runs = Number(args[i]);
  }
}

runSimulation(runs, classFilter, profileFilter);
