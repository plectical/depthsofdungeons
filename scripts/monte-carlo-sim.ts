/**
 * Monte Carlo Simulation for Game Balance Analysis
 * 
 * Run with: npx tsx --import ./scripts/browser-mocks.mjs scripts/monte-carlo-sim.ts
 * 
 * This script runs headless game simulations using the autoplay AI
 * and collects statistics for balance analysis.
 */

import { newGame, processTurn, waitTurn, movePlayer, useItem, equipItem, rangedAttack, getPlayerRange, buyItem, isAtShop, rageStrike, getWarriorRage, shadowStep, getRogueShadowCooldown, arcaneBlast, getMageBlastCooldown, huntersMark, getRangerMark, chooseAbility } from '../src/game/engine';
import { getTile, isWalkableTile } from '../src/game/dungeon';
import { findPath, manhattan, cloneState } from '../src/game/utils';
import { Tile, type GameState, type Pos, type PlayerClass } from '../src/game/types';
import { CLASS_DEFS, MONSTER_DEFS } from '../src/game/constants';
import { createDefaultBloodline } from '../src/game/traits';

// ══════════════════════════════════════════════════════════════════════════════
// Configuration
// ══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  runsPerClass: 100,       // Number of simulations per class
  maxTurnsPerRun: 5000,    // Prevent infinite loops
  classes: ['warrior', 'mage', 'rogue', 'ranger', 'paladin'] as PlayerClass[],
  zones: ['stone_depths'] as const,
  verbose: false,          // Log each run's result
};

// ══════════════════════════════════════════════════════════════════════════════
// Statistics Collection
// ══════════════════════════════════════════════════════════════════════════════

interface RunResult {
  class: PlayerClass;
  floorReached: number;
  turns: number;
  kills: number;
  goldEarned: number;
  itemsFound: number;
  potionsUsed: number;
  foodEaten: number;
  causeOfDeath: string;
  finalHp: number;
  finalMaxHp: number;
  finalLevel: number;
  bossesKilled: string[];
  foodOnGround: number;       // Food left on ground when died
  foodInInventory: number;    // Food in inventory when died
  finalHunger: number;        // Hunger when died
}

interface ClassStats {
  runs: number;
  avgFloor: number;
  maxFloor: number;
  minFloor: number;
  medianFloor: number;
  avgTurns: number;
  avgKills: number;
  avgGold: number;
  avgLevel: number;
  survivalByFloor: Record<number, number>;
  deathCauses: Record<string, number>;
  bossKillRate: Record<string, number>;
  floors: number[];
}

// ══════════════════════════════════════════════════════════════════════════════
// Headless Autoplay (adapted from autoplay.ts for headless use)
// ══════════════════════════════════════════════════════════════════════════════

const PICKUP_TYPES = new Set(['food', 'potion', 'scroll', 'gold', 'weapon', 'armor', 'ring', 'amulet', 'offhand']);

function posKey(p: Pos): string {
  return `${p.x},${p.y}`;
}

function isVisible(state: GameState, pos: Pos): boolean {
  const row = state.floor.visible[pos.y];
  return row ? row[pos.x] === true : false;
}

function pathTo(state: GameState, target: Pos): Pos | null {
  const isWalkable = (x: number, y: number) => {
    if (x < 0 || x >= state.floor.width || y < 0 || y >= state.floor.height) return false;
    if (state.monsters.some((m) => !m.isDead && m.pos.x === x && m.pos.y === y)) {
      return x === target.x && y === target.y;
    }
    if (state.npcs?.some((n) => !n.talked && n.pos.x === x && n.pos.y === y)) return false;
    if (state.mapMercenaries?.some((m) => !m.hired && m.pos.x === x && m.pos.y === y)) return false;
    const tile = getTile(state.floor, x, y);
    return isWalkableTile(tile);
  };
  return findPath(state.player.pos, target, isWalkable, 60);
}

function sumBonus(bonus: Partial<Record<string, number>> | undefined): number {
  if (!bonus) return 0;
  let total = 0;
  for (const v of Object.values(bonus)) {
    if (typeof v === 'number') total += v;
  }
  return total;
}

function tryAutoEquip(state: GameState): boolean {
  const player = state.player;
  for (let i = 0; i < player.inventory.length; i++) {
    const item = player.inventory[i];
    if (!item || !item.equipSlot) continue;
    if (item.classRestriction && !item.classRestriction.includes(state.playerClass)) continue;
    const current = player.equipment[item.equipSlot];
    if (!current) {
      if (equipItem(state, i)) return true;
      continue;
    }
    const currentTotal = sumBonus(current.statBonus);
    const newTotal = sumBonus(item.statBonus);
    if (newTotal > currentTotal) {
      if (equipItem(state, i)) return true;
    }
  }
  return false;
}

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

function findExploreTarget(state: GameState, visited: Set<string>): Pos | null {
  const { floor, player } = state;
  let bestPos: Pos | null = null;
  let bestDist = Infinity;

  for (let y = 0; y < floor.height; y++) {
    for (let x = 0; x < floor.width; x++) {
      if (floor.explored[y]?.[x]) continue;
      const tile = getTile(floor, x, y);
      if (tile === Tile.Void || tile === Tile.Wall) continue;
      if (visited.has(posKey({ x, y }))) continue;
      const hasExploredNeighbor = [
        [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1],
      ].some(([nx, ny]) => floor.explored[ny!]?.[nx!] === true);
      if (!hasExploredNeighbor) continue;
      const dist = manhattan(player.pos, { x, y });
      if (dist < bestDist) {
        bestDist = dist;
        bestPos = { x, y };
      }
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

function headlessAutoplayStep(state: GameState, visited: Set<string>): GameState | null {
  if (state.gameOver) return null;

  const next = cloneState(state);

  // Auto-choose ability
  if (next.pendingAbilityChoice && next.pendingAbilityChoice.options.length > 0) {
    chooseAbility(next, next.pendingAbilityChoice.options[0]!.id);
    return next;
  }

  // Eat food if hungry (raised threshold for safety)
  if (next.hunger.current <= 50) {
    const foodIdx = next.player.inventory.findIndex((i) => i.type === 'food');
    if (foodIdx >= 0) {
      useItem(next, foodIdx);
      return next;
    }
  }

  // CRITICAL: If very hungry and no food in inventory, prioritize finding food NOW
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

  // Use health potion if low HP
  const hpRatio = next.player.stats.hp / next.player.stats.maxHp;
  if (hpRatio <= 0.35) {
    const potionIdx = next.player.inventory.findIndex((i) => i.type === 'potion' && i.name.includes('Health'));
    if (potionIdx >= 0) {
      useItem(next, potionIdx);
      return next;
    }
  }

  // Shop purchases - buy food more aggressively
  if (isAtShop(next) && next.shop) {
    const foodCount = next.player.inventory.filter(i => i.type === 'food').length;
    for (let i = 0; i < next.shop.stock.length; i++) {
      const slot = next.shop.stock[i];
      if (!slot) continue;
      if (next.player.inventory.length >= 20) break;
      // Buy food more aggressively: if we have fewer than 3 or hunger below 90
      if (slot.item.type === 'food' && (foodCount < 3 || next.hunger.current < 90) && next.score >= slot.price) {
        buyItem(next, i);
        return next;
      }
      if (slot.item.type === 'potion' && slot.item.name.includes('Health') && next.score >= slot.price) {
        buyItem(next, i);
        return next;
      }
    }
  }

  // Auto-equip
  if (tryAutoEquip(next)) return next;

  // Combat
  const visibleMonsters = next.monsters.filter((m) => !m.isDead && isVisible(next, m.pos));
  if (visibleMonsters.length > 0) {
    // Class abilities
    if (next.playerClass === 'warrior' && getWarriorRage(next) >= 30) {
      if (rageStrike(next)) return next;
    }
    if (next.playerClass === 'rogue' && getRogueShadowCooldown(next) === 0) {
      if (shadowStep(next)) return next;
    }
    if (next.playerClass === 'mage' && getMageBlastCooldown(next) === 0 && visibleMonsters.length >= 2) {
      if (arcaneBlast(next)) return next;
    }
    if (next.playerClass === 'ranger') {
      const mark = getRangerMark(next);
      if (mark.hitsLeft === 0 && mark.cooldown === 0) {
        if (huntersMark(next)) return next;
      }
    }

    visibleMonsters.sort((a, b) => a.stats.hp - b.stats.hp);
    const target = visibleMonsters[0]!;

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

  // Pick up items - prioritize food when hungry
  if (next.player.inventory.length < 20) {
    const shouldPrioritizeFood = next.hunger.current < 70 && !next.player.inventory.some(i => i.type === 'food');
    const itemTarget = findNearbyItem(next, shouldPrioritizeFood);
    if (itemTarget) {
      const step = pathTo(next, itemTarget);
      if (step) {
        const dx = step.x - next.player.pos.x;
        const dy = step.y - next.player.pos.y;
        if (movePlayer(next, dx, dy)) return next;
      }
    }
  }

  // Explore
  const exploreTarget = findExploreTarget(next, visited);
  if (exploreTarget) {
    const step = pathTo(next, exploreTarget);
    if (step) {
      const dx = step.x - next.player.pos.x;
      const dy = step.y - next.player.pos.y;
      if (movePlayer(next, dx, dy)) {
        visited.add(posKey(next.player.pos));
        return next;
      }
    } else {
      visited.add(posKey(exploreTarget));
    }
  }

  // Go to stairs
  const stairsPos = findStairs(next);
  if (stairsPos) {
    const step = pathTo(next, stairsPos);
    if (step) {
      const dx = step.x - next.player.pos.x;
      const dy = step.y - next.player.pos.y;
      if (movePlayer(next, dx, dy)) return next;
    }
  }

  // Random move
  const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
  for (let i = dirs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dirs[i], dirs[j]] = [dirs[j]!, dirs[i]!];
  }
  for (const { dx, dy } of dirs) {
    if (movePlayer(next, dx, dy)) return next;
  }

  waitTurn(next);
  return next;
}

// ══════════════════════════════════════════════════════════════════════════════
// Simulation Runner
// ══════════════════════════════════════════════════════════════════════════════

function extractCauseOfDeath(state: GameState): string {
  const lastMessages = state.messages.slice(-5);
  for (const msg of lastMessages.reverse()) {
    if (msg.text.includes('killed by')) {
      const match = msg.text.match(/killed by (.+?)(?:\.|!|$)/i);
      if (match) return match[1];
    }
    if (msg.text.includes('starved')) return 'Starvation';
    if (msg.text.includes('died')) return 'Unknown';
  }
  return 'Unknown';
}

function runSimulation(playerClass: PlayerClass): RunResult {
  const bloodline = createDefaultBloodline();
  let state = newGame(playerClass, bloodline, 'stone_depths');
  
  const visited = new Set<string>();
  let turns = 0;
  let lastFloor = 1;
  const bossesKilled: string[] = [];

  while (!state.gameOver && turns < CONFIG.maxTurnsPerRun) {
    // Clear visited on floor change
    if (state.floorNumber !== lastFloor) {
      visited.clear();
      lastFloor = state.floorNumber;
    }

    const result = headlessAutoplayStep(state, visited);
    if (result) {
      state = result;
      
      // Track boss kills
      for (const monster of state.monsters) {
        if (monster.isDead && monster.isBoss && !bossesKilled.includes(monster.name)) {
          bossesKilled.push(monster.name);
        }
      }
    }
    turns++;
  }

  // Count food left on ground and in inventory
  const foodOnGround = state.items.filter(i => i.item.type === 'food').length;
  const foodInInventory = state.player.inventory.filter(i => i.type === 'food').length;

  return {
    class: playerClass,
    floorReached: state.floorNumber,
    turns,
    kills: state.runStats.kills,
    goldEarned: state.runStats.goldCollected,
    itemsFound: state.runStats.itemsFound,
    potionsUsed: state.runStats.potionsUsed,
    foodEaten: state.runStats.foodEaten,
    causeOfDeath: state.gameOver ? extractCauseOfDeath(state) : 'Timeout',
    finalHp: state.player.stats.hp,
    finalMaxHp: state.player.stats.maxHp,
    finalLevel: state.player.level,
    bossesKilled,
    foodOnGround,
    foodInInventory,
    finalHunger: state.hunger.current,
  };
}

function calculateStats(results: RunResult[]): ClassStats {
  const floors = results.map(r => r.floorReached).sort((a, b) => a - b);
  const survivalByFloor: Record<number, number> = {};
  const deathCauses: Record<string, number> = {};
  const bossKillRate: Record<string, number> = {};

  for (const r of results) {
    for (let f = 1; f <= r.floorReached; f++) {
      survivalByFloor[f] = (survivalByFloor[f] || 0) + 1;
    }
    deathCauses[r.causeOfDeath] = (deathCauses[r.causeOfDeath] || 0) + 1;
    for (const boss of r.bossesKilled) {
      bossKillRate[boss] = (bossKillRate[boss] || 0) + 1;
    }
  }

  // Convert to percentages
  for (const f of Object.keys(survivalByFloor)) {
    survivalByFloor[Number(f)] = Math.round((survivalByFloor[Number(f)] / results.length) * 100);
  }
  for (const boss of Object.keys(bossKillRate)) {
    bossKillRate[boss] = Math.round((bossKillRate[boss] / results.length) * 100);
  }

  return {
    runs: results.length,
    avgFloor: Math.round(floors.reduce((a, b) => a + b, 0) / floors.length * 10) / 10,
    maxFloor: Math.max(...floors),
    minFloor: Math.min(...floors),
    medianFloor: floors[Math.floor(floors.length / 2)],
    avgTurns: Math.round(results.reduce((a, r) => a + r.turns, 0) / results.length),
    avgKills: Math.round(results.reduce((a, r) => a + r.kills, 0) / results.length * 10) / 10,
    avgGold: Math.round(results.reduce((a, r) => a + r.goldEarned, 0) / results.length),
    avgLevel: Math.round(results.reduce((a, r) => a + r.finalLevel, 0) / results.length * 10) / 10,
    survivalByFloor,
    deathCauses,
    bossKillRate,
    floors,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Main Execution
// ══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  DEPTHS OF DUNGEON - MONTE CARLO BALANCE SIMULATION');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`  Runs per class: ${CONFIG.runsPerClass}`);
  console.log(`  Classes: ${CONFIG.classes.join(', ')}`);
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const allStats: Record<string, ClassStats> = {};
  const allResults: Record<string, RunResult[]> = {};

  for (const playerClass of CONFIG.classes) {
    console.log(`\n▶ Running ${CONFIG.runsPerClass} simulations for ${playerClass.toUpperCase()}...`);
    const results: RunResult[] = [];
    
    for (let i = 0; i < CONFIG.runsPerClass; i++) {
      const result = runSimulation(playerClass);
      results.push(result);
      
      if (CONFIG.verbose) {
        console.log(`  Run ${i + 1}: Floor ${result.floorReached}, Level ${result.finalLevel}, ${result.kills} kills, died to ${result.causeOfDeath}`);
      } else if ((i + 1) % 25 === 0) {
        process.stdout.write(`  Progress: ${i + 1}/${CONFIG.runsPerClass}\r`);
      }
    }
    
    allStats[playerClass] = calculateStats(results);
    allResults[playerClass] = results;
    console.log(`  ✓ Completed ${playerClass}`);
  }

  // Print Results
  console.log('\n\n═══════════════════════════════════════════════════════════════════');
  console.log('  RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  console.log('┌──────────┬────────┬────────┬────────┬────────┬────────┬────────┐');
  console.log('│ Class    │ Avg Fl │ Med Fl │ Max Fl │ Avg Lv │ Avg Kl │ Avg Gd │');
  console.log('├──────────┼────────┼────────┼────────┼────────┼────────┼────────┤');
  
  for (const cls of CONFIG.classes) {
    const s = allStats[cls];
    console.log(`│ ${cls.padEnd(8)} │ ${String(s.avgFloor).padStart(6)} │ ${String(s.medianFloor).padStart(6)} │ ${String(s.maxFloor).padStart(6)} │ ${String(s.avgLevel).padStart(6)} │ ${String(s.avgKills).padStart(6)} │ ${String(s.avgGold).padStart(6)} │`);
  }
  console.log('└──────────┴────────┴────────┴────────┴────────┴────────┴────────┘');

  // Survival Rates
  console.log('\n\n═══════════════════════════════════════════════════════════════════');
  console.log('  SURVIVAL RATES BY FLOOR (%)');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const maxFloorSeen = Math.max(...Object.values(allStats).map(s => s.maxFloor));
  const floorCheckpoints = [1, 3, 5, 7, 10, 12, 15];
  
  console.log('┌──────────┬' + floorCheckpoints.map(f => `────────┬`).join('').slice(0, -1) + '┐');
  console.log('│ Class    │' + floorCheckpoints.map(f => ` Fl ${String(f).padStart(2)}  │`).join(''));
  console.log('├──────────┼' + floorCheckpoints.map(f => `────────┼`).join('').slice(0, -1) + '┤');
  
  for (const cls of CONFIG.classes) {
    const s = allStats[cls];
    const rates = floorCheckpoints.map(f => {
      const rate = s.survivalByFloor[f] || 0;
      return `${String(rate).padStart(5)}%  `;
    });
    console.log(`│ ${cls.padEnd(8)} │${rates.join('│')}│`);
  }
  console.log('└──────────┴' + floorCheckpoints.map(f => `────────┴`).join('').slice(0, -1) + '┘');

  // Death Causes
  console.log('\n\n═══════════════════════════════════════════════════════════════════');
  console.log('  TOP DEATH CAUSES BY CLASS');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  for (const cls of CONFIG.classes) {
    const s = allStats[cls];
    const sorted = Object.entries(s.deathCauses)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    console.log(`${cls.toUpperCase()}:`);
    for (const [cause, count] of sorted) {
      const pct = Math.round((count / s.runs) * 100);
      console.log(`  ${cause.padEnd(20)} ${String(count).padStart(3)} (${pct}%)`);
    }
    console.log();
  }

  // Boss Kill Rates
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('  BOSS KILL RATES (%)');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const allBosses = new Set<string>();
  for (const s of Object.values(allStats)) {
    for (const boss of Object.keys(s.bossKillRate)) {
      allBosses.add(boss);
    }
  }

  for (const boss of Array.from(allBosses).sort()) {
    console.log(`${boss}:`);
    for (const cls of CONFIG.classes) {
      const rate = allStats[cls].bossKillRate[boss] || 0;
      const bar = '█'.repeat(Math.round(rate / 5)) + '░'.repeat(20 - Math.round(rate / 5));
      console.log(`  ${cls.padEnd(10)} ${bar} ${rate}%`);
    }
    console.log();
  }

  // Balance Analysis
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('  BALANCE ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const avgFloors = CONFIG.classes.map(c => ({ class: c, avg: allStats[c].avgFloor }));
  avgFloors.sort((a, b) => b.avg - a.avg);
  
  const strongest = avgFloors[0];
  const weakest = avgFloors[avgFloors.length - 1];
  const spread = strongest.avg - weakest.avg;

  console.log(`Strongest class: ${strongest.class.toUpperCase()} (avg floor ${strongest.avg})`);
  console.log(`Weakest class:   ${weakest.class.toUpperCase()} (avg floor ${weakest.avg})`);
  console.log(`Power spread:    ${spread.toFixed(1)} floors\n`);

  if (spread > 3) {
    console.log('⚠️  BALANCE ISSUE: Significant power gap between classes.');
    console.log(`   Consider buffing ${weakest.class} or nerfing ${strongest.class}.`);
  } else if (spread > 2) {
    console.log('⚡ MODERATE IMBALANCE: Some classes outperform others.');
  } else {
    console.log('✅ GOOD BALANCE: Classes are relatively balanced.');
  }

  // Check for starvation deaths
  for (const cls of CONFIG.classes) {
    const s = allStats[cls];
    const starvation = s.deathCauses['Starvation'] || 0;
    const starvationRate = Math.round((starvation / s.runs) * 100);
    if (starvationRate > 20) {
      console.log(`\n⚠️  ${cls.toUpperCase()} has ${starvationRate}% starvation deaths - food economy may need adjustment.`);
    }
  }

  // Detailed starvation analysis
  console.log('\n\n═══════════════════════════════════════════════════════════════════');
  console.log('  STARVATION DEATH ANALYSIS (AI vs Game Balance)');
  console.log('═══════════════════════════════════════════════════════════════════\n');
  
  for (const cls of CONFIG.classes) {
    const results = allResults[cls];
    const starvationDeaths = results.filter(r => r.causeOfDeath === 'Starvation');
    if (starvationDeaths.length === 0) continue;
    
    const avgFoodOnGround = starvationDeaths.reduce((a, r) => a + r.foodOnGround, 0) / starvationDeaths.length;
    const avgFoodInInventory = starvationDeaths.reduce((a, r) => a + r.foodInInventory, 0) / starvationDeaths.length;
    const avgFoodEaten = starvationDeaths.reduce((a, r) => a + r.foodEaten, 0) / starvationDeaths.length;
    const avgHunger = starvationDeaths.reduce((a, r) => a + r.finalHunger, 0) / starvationDeaths.length;
    
    console.log(`${cls.toUpperCase()} (${starvationDeaths.length} starvation deaths):`);
    console.log(`  Avg food LEFT on ground:    ${avgFoodOnGround.toFixed(1)}`);
    console.log(`  Avg food LEFT in inventory: ${avgFoodInInventory.toFixed(1)}`);
    console.log(`  Avg food eaten before death: ${avgFoodEaten.toFixed(1)}`);
    console.log(`  Avg hunger at death:        ${avgHunger.toFixed(1)}`);
    
    if (avgFoodOnGround > 1 || avgFoodInInventory > 0) {
      console.log(`  → AI ISSUE: Food was available but not used!`);
    } else {
      console.log(`  → BALANCE ISSUE: Not enough food spawned.`);
    }
    console.log();
  }

  // Check floor 3 survival (first boss)
  const floor3Issues: string[] = [];
  for (const cls of CONFIG.classes) {
    const rate = allStats[cls].survivalByFloor[3] || 0;
    if (rate < 50) {
      floor3Issues.push(`${cls} (${rate}%)`);
    }
  }
  if (floor3Issues.length > 0) {
    console.log(`\n⚠️  Low Floor 3 (first boss) survival: ${floor3Issues.join(', ')}`);
    console.log('   Consider easing early game difficulty or first boss.');
  }

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('  SIMULATION COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
