import { Tile, type GameState, type Pos } from './types';
import { getTile, isWalkableTile } from './dungeon';
import { movePlayer, useItem, equipItem, waitTurn, chooseAbility, rangedAttack, getPlayerRange, buyItem, isAtShop, rageStrike, getWarriorRage, shadowStep, getRogueShadowCooldown, arcaneBlast, getMageBlastCooldown, huntersMark, getRangerMark } from './engine';
import { findPath, manhattan, cloneState, gpStart, gpEnd } from './utils';
import { trackShopPurchase, trackAbilityUsed } from './analytics';
// Hunger thresholds are hardcoded below (40 for eating, 80 for shop buying)

// Track consecutive turns without meaningful progress to detect stalls
let _stuckTurns = 0;
let _lastPos = { x: -1, y: -1 };

// Committed navigation target — prevents rapid target-switching that causes oscillation
let _currentTarget: Pos | null = null;
let _currentTargetType: 'item' | 'explore' | 'stairs' | null = null;
// Explore tiles we've already visited or found unreachable, so we don't revisit them
let _visitedExploreTargets: Set<string> = new Set();
// Track last floor number so we clear state on floor change
let _lastFloorNumber = -1;

// ── Anti-oscillation: ring buffer of recent positions ──
const POSITION_HISTORY_SIZE = 8;
let _positionHistory: string[] = [];
let _oscillationBreakDir: { dx: number; dy: number } | null = null;

function posKey(p: Pos): string {
  return `${p.x},${p.y}`;
}

/**
 * Run one auto-play step. Returns the new state if an action was taken, or null if nothing to do.
 */
export function autoplayStep(state: GameState): GameState | null {
  if (state.gameOver) return null;

  gpStart('autoplay:clone');
  const next = cloneState(state);
  gpEnd('autoplay:clone');

  // Clear navigation state on floor change
  if (next.floorNumber !== _lastFloorNumber) {
    _lastFloorNumber = next.floorNumber;
    _currentTarget = null;
    _currentTargetType = null;
    _visitedExploreTargets = new Set();
    _stuckTurns = 0;
    _lastPos = { x: -1, y: -1 };
    _positionHistory = [];
    _oscillationBreakDir = null;
  }

  // ── Detect oscillation (visiting same 2-3 tiles repeatedly) ──
  const curKey = posKey(next.player.pos);
  _positionHistory.push(curKey);
  if (_positionHistory.length > POSITION_HISTORY_SIZE) _positionHistory.shift();

  if (_positionHistory.length >= 6) {
    // Count how many unique positions in recent history
    const unique = new Set(_positionHistory);
    if (unique.size <= 2) {
      // Oscillating between 2 tiles — break out
      _currentTarget = null;
      _currentTargetType = null;
      _visitedExploreTargets = new Set();
      _oscillationBreakDir = pickRandomUnvisitedDir(next);
      _positionHistory = [];
    } else if (unique.size <= 3 && _positionHistory.length >= POSITION_HISTORY_SIZE) {
      // 3-tile loop — also break out
      _currentTarget = null;
      _currentTargetType = null;
      _oscillationBreakDir = pickRandomUnvisitedDir(next);
      _positionHistory = [];
    }
  }

  // If we have an oscillation break direction, try to move that way for a few steps
  if (_oscillationBreakDir) {
    const moved = movePlayer(next, _oscillationBreakDir.dx, _oscillationBreakDir.dy);
    if (moved) {
      _lastPos = { x: next.player.pos.x, y: next.player.pos.y };
      _stuckTurns = 0;
      // Clear the break direction after successfully moving
      _oscillationBreakDir = null;
      return next;
    }
    // Can't go that way — clear and fall through to normal logic
    _oscillationBreakDir = null;
  }

  // 0. Auto-choose ability if pending (pick the first option)
  if (next.pendingAbilityChoice && next.pendingAbilityChoice.options.length > 0) {
    chooseAbility(next, next.pendingAbilityChoice.options[0]!.id);
    return next;
  }

  // 1. Survival: eat food if hunger getting low (raised threshold for safety)
  if (next.hunger.current <= 50) {
    const foodIdx = next.player.inventory.findIndex((i) => i.type === 'food');
    if (foodIdx >= 0) {
      useItem(next, foodIdx);
      return next;
    }
  }

  // 1b. CRITICAL: If very hungry and no food in inventory, prioritize finding food NOW
  const isHungry = next.hunger.current <= 60;
  const hasFoodInInventory = next.player.inventory.some(i => i.type === 'food');
  const needsFood = isHungry && !hasFoodInInventory;

  if (needsFood) {
    // First check if there's food on the ground we can get to
    const foodTarget = findNearbyFood(next);
    if (foodTarget) {
      const step = pathTo(next, foodTarget);
      if (step) {
        const dx = step.x - next.player.pos.x;
        const dy = step.y - next.player.pos.y;
        if (movePlayer(next, dx, dy)) {
          return next;
        }
      }
    }
  }

  // 2. Survival: use health potion if low HP
  const hpRatio = next.player.stats.hp / next.player.stats.maxHp;
  if (hpRatio <= 0.35) {
    const potionIdx = next.player.inventory.findIndex((i) => i.type === 'potion' && i.name.includes('Health'));
    if (potionIdx >= 0) {
      useItem(next, potionIdx);
      return next;
    }
  }

  // 2b. Shop: buy food and potions when at a shop
  if (isAtShop(next) && next.shop) {
    const foodInInventory = next.player.inventory.filter(i => i.type === 'food').length;
    for (let i = 0; i < next.shop.stock.length; i++) {
      const slot = next.shop.stock[i];
      if (!slot) continue;
      if (next.player.inventory.length >= 20) break;
      // Buy food more aggressively: if we have fewer than 3 or hunger below 90
      if (slot.item.type === 'food' && (foodInInventory < 3 || next.hunger.current < 90) && next.score >= slot.price) {
        const goldBefore = next.score;
        buyItem(next, i);
        trackShopPurchase({ itemName: slot.item.name, itemType: slot.item.type, cost: slot.price, playerGoldBefore: goldBefore, playerGoldAfter: next.score, zone: next.zone, floor: next.floorNumber, playerClass: next.playerClass });
        return next;
      }
      // Buy health potions
      if (slot.item.type === 'potion' && slot.item.name.includes('Health') && next.score >= slot.price) {
        const goldBefore = next.score;
        buyItem(next, i);
        trackShopPurchase({ itemName: slot.item.name, itemType: slot.item.type, cost: slot.price, playerGoldBefore: goldBefore, playerGoldAfter: next.score, zone: next.zone, floor: next.floorNumber, playerClass: next.playerClass });
        return next;
      }
    }
  }

  // 3. Auto-equip better gear
  if (tryAutoEquip(next)) return next;

  // 4. Fight visible monsters — cancel any non-combat navigation target while fighting
  const visibleMonsters = next.monsters.filter(
    (m) => !m.isDead && isVisible(next, m.pos),
  );

  if (visibleMonsters.length > 0) {
    // Cancel non-monster navigation so we don't oscillate back to items mid-fight
    if (_currentTargetType !== null) {
      _currentTarget = null;
      _currentTargetType = null;
    }

    const _hpPct = next.player.stats.maxHp > 0 ? Math.round((next.player.stats.hp / next.player.stats.maxHp) * 100) : 0;

    // Warrior: fire Rage Strike when ready (>= 30 rage) before normal combat
    if (next.playerClass === 'warrior' && getWarriorRage(next) >= 30) {
      const ok = rageStrike(next);
      trackAbilityUsed({ ability: 'rage_strike', playerClass: next.playerClass, floor: next.floorNumber, zone: next.zone, hpPercent: _hpPct, success: ok, source: 'autoplay' });
      if (ok) return next;
    }

    // Rogue: use Shadow Step when off cooldown
    if (next.playerClass === 'rogue' && getRogueShadowCooldown(next) === 0) {
      const ok = shadowStep(next);
      trackAbilityUsed({ ability: 'shadow_step', playerClass: next.playerClass, floor: next.floorNumber, zone: next.zone, hpPercent: _hpPct, success: ok, source: 'autoplay' });
      if (ok) return next;
    }

    // Mage: use Arcane Blast when off cooldown and multiple enemies visible
    if (next.playerClass === 'mage' && getMageBlastCooldown(next) === 0 && visibleMonsters.length >= 2) {
      const ok = arcaneBlast(next);
      trackAbilityUsed({ ability: 'arcane_blast', playerClass: next.playerClass, floor: next.floorNumber, zone: next.zone, hpPercent: _hpPct, success: ok, source: 'autoplay' });
      if (ok) return next;
    }

    // Ranger: use Hunter's Mark if available and not already active
    if (next.playerClass === 'ranger') {
      const mark = getRangerMark(next);
      if (mark.hitsLeft === 0 && mark.cooldown === 0) {
        const ok = huntersMark(next);
        trackAbilityUsed({ ability: 'hunters_mark', playerClass: next.playerClass, floor: next.floorNumber, zone: next.zone, hpPercent: _hpPct, success: ok, source: 'autoplay' });
        if (ok) return next;
      }
    }

    // Pick weakest visible monster to focus
    visibleMonsters.sort((a, b) => a.stats.hp - b.stats.hp);
    const target = visibleMonsters[0]!;

    // Try ranged attack first
    const range = getPlayerRange(next);
    if (range > 1) {
      const dist = manhattan(next.player.pos, target.pos);
      if (dist > 1 && dist <= range) {
        if (rangedAttack(next, target.pos.x, target.pos.y)) return next;
      }
    }

    const step = pathTo(next, target.pos);
    if (step) {
      const dx = step.x - next.player.pos.x;
      const dy = step.y - next.player.pos.y;
      if (movePlayer(next, dx, dy)) return next;
    }
  }

  // 5. Pick up nearby items on the ground (inventory not full)
  if (next.player.inventory.length < 20) {
    // Validate committed item target still exists and is still worth going to
    if (_currentTargetType === 'item' && _currentTarget) {
      const stillThere = next.items.some(
        (mi) => mi.pos.x === _currentTarget!.x && mi.pos.y === _currentTarget!.y && PICKUP_TYPES.has(mi.item.type),
      );
      if (!stillThere) {
        _currentTarget = null;
        _currentTargetType = null;
      }
    }

    // Pick a new item target if we don't have one
    // Prioritize food when hungry (hunger below 70)
    const shouldPrioritizeFood = next.hunger.current < 70 && !next.player.inventory.some(i => i.type === 'food');
    if (_currentTargetType !== 'item') {
      const pickupTarget = findNearbyItem(next, shouldPrioritizeFood);
      if (pickupTarget) {
        // Only commit if there's actually a path
        const testStep = pathTo(next, pickupTarget);
        if (testStep) {
          _currentTarget = pickupTarget;
          _currentTargetType = 'item';
        }
      }
    }

    if (_currentTargetType === 'item' && _currentTarget) {
      const step = pathTo(next, _currentTarget);
      if (step) {
        const dx = step.x - next.player.pos.x;
        const dy = step.y - next.player.pos.y;
        if (movePlayer(next, dx, dy)) {
          updateStuckTracking(next);
          return next;
        }
      } else {
        // Path no longer exists — drop this target
        _currentTarget = null;
        _currentTargetType = null;
      }
    }
  }

  // 6. Explore unexplored tiles
  // Mark the current target as visited once we reach it
  if (_currentTargetType === 'explore' && _currentTarget) {
    const atTarget =
      next.player.pos.x === _currentTarget.x && next.player.pos.y === _currentTarget.y;
    const explored = next.floor.explored[_currentTarget.y]?.[_currentTarget.x];
    if (atTarget || explored) {
      _visitedExploreTargets.add(posKey(_currentTarget));
      _currentTarget = null;
      _currentTargetType = null;
    } else {
      // Check the path still exists
      const step = pathTo(next, _currentTarget);
      if (!step) {
        _visitedExploreTargets.add(posKey(_currentTarget));
        _currentTarget = null;
        _currentTargetType = null;
      }
    }
  }

  if (_currentTargetType !== 'explore' && _currentTargetType !== 'stairs') {
    const exploreTarget = findExploreTarget(next, _visitedExploreTargets);
    if (exploreTarget) {
      const testStep = pathTo(next, exploreTarget);
      if (testStep) {
        _currentTarget = exploreTarget;
        _currentTargetType = 'explore';
      } else {
        // Can't reach — mark as dead-end
        _visitedExploreTargets.add(posKey(exploreTarget));
      }
    }
  }

  if (_currentTargetType === 'explore' && _currentTarget) {
    const step = pathTo(next, _currentTarget);
    if (step) {
      const dx = step.x - next.player.pos.x;
      const dy = step.y - next.player.pos.y;
      if (movePlayer(next, dx, dy)) {
        updateStuckTracking(next);
        return next;
      }
    } else {
      _visitedExploreTargets.add(posKey(_currentTarget));
      _currentTarget = null;
      _currentTargetType = null;
    }
  }

  // 7. Head to stairs down when exploration is done
  if (_currentTargetType !== 'stairs') {
    const stairsPos = findStairs(next);
    if (stairsPos) {
      const testStep = pathTo(next, stairsPos);
      if (testStep) {
        _currentTarget = stairsPos;
        _currentTargetType = 'stairs';
      }
    }
  }

  if (_currentTargetType === 'stairs' && _currentTarget) {
    const step = pathTo(next, _currentTarget);
    if (step) {
      const dx = step.x - next.player.pos.x;
      const dy = step.y - next.player.pos.y;
      if (movePlayer(next, dx, dy)) {
        updateStuckTracking(next);
        return next;
      }
    } else {
      _currentTarget = null;
      _currentTargetType = null;
    }
  }

  // 8. Truly nothing to do — try a random walkable direction to break out of dead ends
  const pos = next.player.pos;
  if (pos.x === _lastPos.x && pos.y === _lastPos.y) {
    _stuckTurns++;
  } else {
    _stuckTurns = 0;
    _lastPos = { x: pos.x, y: pos.y };
  }

  // Clear visited set after being stuck for a while — maybe we need to revisit
  if (_stuckTurns > 4) {
    _visitedExploreTargets = new Set();
    _currentTarget = null;
    _currentTargetType = null;
    _stuckTurns = 0;
  }

  const dirs = [
    { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
    { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
  ];
  // Shuffle dirs
  for (let i = dirs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dirs[i], dirs[j]] = [dirs[j]!, dirs[i]!];
  }
  for (const { dx, dy } of dirs) {
    if (movePlayer(next, dx, dy)) {
      _stuckTurns = 0;
      _lastPos = { x: next.player.pos.x, y: next.player.pos.y };
      return next;
    }
  }

  // Truly stuck (all directions blocked) — wait as last resort
  waitTurn(next);
  return next;
}

function updateStuckTracking(next: GameState) {
  const pos = next.player.pos;
  if (pos.x !== _lastPos.x || pos.y !== _lastPos.y) {
    _stuckTurns = 0;
    _lastPos = { x: pos.x, y: pos.y };
  }
}

function isVisible(state: GameState, pos: Pos): boolean {
  const row = state.floor.visible[pos.y];
  return row ? row[pos.x] === true : false;
}

function pathTo(state: GameState, target: Pos): Pos | null {
  const isWalkable = (x: number, y: number) => {
    if (x < 0 || x >= state.floor.width || y < 0 || y >= state.floor.height) return false;
    // Allow walking into monsters (to attack them)
    if (state.monsters.some((m) => !m.isDead && m.pos.x === x && m.pos.y === y)) {
      return x === target.x && y === target.y;
    }
    // Avoid NPC tiles (don't trigger dialogue during autoplay)
    if (state.npcs?.some((n) => !n.talked && n.pos.x === x && n.pos.y === y)) {
      return false;
    }
    // Avoid unhired map mercenary tiles (don't trigger hire dialogue during autoplay)
    if (state.mapMercenaries?.some((m) => !m.hired && m.pos.x === x && m.pos.y === y)) {
      return false;
    }
    const tile = getTile(state.floor, x, y);
    return isWalkableTile(tile);
  };
  return findPath(state.player.pos, target, isWalkable, 60);
}

function findExploreTarget(state: GameState, visited: Set<string>): Pos | null {
  const { floor, player } = state;
  let bestPos: Pos | null = null;
  let bestDist = Infinity;

  // Look for unexplored tiles adjacent to explored walkable tiles
  for (let y = 0; y < floor.height; y++) {
    for (let x = 0; x < floor.width; x++) {
      const explored = floor.explored[y]?.[x];
      if (explored) continue; // Skip already-explored

      const tile = getTile(floor, x, y);
      if (tile === Tile.Void || tile === Tile.Wall) continue;

      // Skip tiles we've already tried to reach
      if (visited.has(posKey({ x, y }))) continue;

      // Check if any neighbor is explored (so we can actually reach it)
      const hasExploredNeighbor = [
        [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1],
      ].some(([nx, ny]) => {
        if (nx === undefined || ny === undefined) return false;
        return floor.explored[ny]?.[nx] === true;
      });

      if (!hasExploredNeighbor) continue;

      const dist = manhattan(player.pos, { x, y });
      if (dist < bestDist) {
        bestDist = dist;
        bestPos = { x, y };
      }
    }
  }

  // If no edge tiles found, look for any explored walkable tile near an unexplored area
  if (!bestPos) {
    for (let y = 0; y < floor.height; y++) {
      for (let x = 0; x < floor.width; x++) {
        if (!floor.explored[y]?.[x]) continue;
        const tile = getTile(floor, x, y);
        if (!isWalkableTile(tile)) continue;

        if (visited.has(posKey({ x, y }))) continue;

        const hasUnexploredNeighbor = [
          [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1],
        ].some(([nx, ny]) => {
          if (nx === undefined || ny === undefined) return false;
          if (nx < 0 || nx >= floor.width || ny < 0 || ny >= floor.height) return false;
          const t = getTile(floor, nx, ny);
          if (t === Tile.Void || t === Tile.Wall) return false;
          return floor.explored[ny]?.[nx] !== true;
        });

        if (!hasUnexploredNeighbor) continue;

        const dist = manhattan(player.pos, { x, y });
        if (dist < bestDist) {
          bestDist = dist;
          bestPos = { x, y };
        }
      }
    }
  }

  return bestPos;
}

const PICKUP_TYPES = new Set(['food', 'potion', 'scroll', 'gold', 'weapon', 'armor', 'ring', 'amulet', 'offhand']);

/** Find the nearest food item specifically — used when hungry */
function findNearbyFood(state: GameState): Pos | null {
  const { items, player } = state;
  let bestPos: Pos | null = null;
  let bestDist = Infinity;

  for (const mi of items) {
    if (mi.item.type !== 'food') continue;
    if (!state.floor.explored[mi.pos.y]?.[mi.pos.x]) continue;

    const dist = manhattan(player.pos, mi.pos);
    if (dist < bestDist && dist <= 30) { // Extended range for food
      bestDist = dist;
      bestPos = mi.pos;
    }
  }

  return bestPos;
}

function findNearbyItem(state: GameState, prioritizeFood: boolean = false): Pos | null {
  const { items, player } = state;
  let bestPos: Pos | null = null;
  let bestDist = Infinity;
  let bestIsFood = false;

  for (const mi of items) {
    if (!PICKUP_TYPES.has(mi.item.type)) continue;
    if (!state.floor.explored[mi.pos.y]?.[mi.pos.x]) continue;

    const dist = manhattan(player.pos, mi.pos);
    const isFood = mi.item.type === 'food';
    
    // When prioritizing food, prefer food items even if slightly farther
    if (prioritizeFood && isFood && !bestIsFood && dist <= 25) {
      bestDist = dist;
      bestPos = mi.pos;
      bestIsFood = true;
    } else if (dist < bestDist && dist <= 20) {
      // Only replace food with non-food if it's much closer
      if (bestIsFood && !isFood && dist > bestDist - 5) continue;
      bestDist = dist;
      bestPos = mi.pos;
      bestIsFood = isFood;
    }
  }

  return bestPos;
}


function findStairs(state: GameState): Pos | null {
  const { floor } = state;
  for (let y = 0; y < floor.height; y++) {
    for (let x = 0; x < floor.width; x++) {
      if (getTile(floor, x, y) === Tile.StairsDown && floor.explored[y]?.[x]) {
        return { x, y };
      }
    }
  }
  return null;
}

function tryAutoEquip(state: GameState): boolean {
  const player = state.player;

  for (let i = 0; i < player.inventory.length; i++) {
    const item = player.inventory[i];
    if (!item || !item.equipSlot) continue;

    // Skip items this class can't equip (e.g. shields for ranged classes)
    if (item.classRestriction && !item.classRestriction.includes(state.playerClass)) continue;

    const current = player.equipment[item.equipSlot];
    if (!current) {
      // Empty slot — equip it
      if (equipItem(state, i)) return true;
      continue;
    }

    // Compare stat bonuses — equip if total bonus is higher
    const currentTotal = sumBonus(current.statBonus);
    const newTotal = sumBonus(item.statBonus);
    if (newTotal > currentTotal) {
      if (equipItem(state, i)) return true;
      continue;
    }
  }
  return false;
}

function sumBonus(bonus: Partial<Record<string, number>> | undefined): number {
  if (!bonus) return 0;
  let total = 0;
  for (const v of Object.values(bonus)) {
    if (typeof v === 'number') total += v;
  }
  return total;
}

/** Pick a random walkable direction that leads to a tile NOT in recent position history */
function pickRandomUnvisitedDir(state: GameState): { dx: number; dy: number } | null {
  const dirs = [
    { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
    { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
  ];
  // Shuffle
  for (let i = dirs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dirs[i], dirs[j]] = [dirs[j]!, dirs[i]!];
  }
  const recentSet = new Set(_positionHistory);
  const pos = state.player.pos;

  // Prefer directions leading to tiles NOT in recent history
  for (const d of dirs) {
    const nx = pos.x + d.dx;
    const ny = pos.y + d.dy;
    if (nx < 0 || nx >= state.floor.width || ny < 0 || ny >= state.floor.height) continue;
    const tile = getTile(state.floor, nx, ny);
    if (!isWalkableTile(tile)) continue;
    // Skip tiles occupied by non-dead monsters (unless we're fighting)
    if (state.monsters.some(m => !m.isDead && m.pos.x === nx && m.pos.y === ny)) continue;
    if (!recentSet.has(posKey({ x: nx, y: ny }))) {
      return d;
    }
  }
  // Fallback: any walkable direction
  for (const d of dirs) {
    const nx = pos.x + d.dx;
    const ny = pos.y + d.dy;
    if (nx < 0 || nx >= state.floor.width || ny < 0 || ny >= state.floor.height) continue;
    const tile = getTile(state.floor, nx, ny);
    if (isWalkableTile(tile)) return d;
  }
  return null;
}
