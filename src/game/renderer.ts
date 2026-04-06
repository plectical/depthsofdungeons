import { Tile, type GameState } from './types';
import { getTile, getTerrainAt } from './dungeon';
import { getNPCDef } from './npcs';
import { MERCENARY_DEFS, TERRAIN_DEFS, RARITY_DEFS } from './constants';
import { getZoneDef, ZONE_TERRAIN_DEFS } from './zones';
import { linePoints } from './utils';
import { getTransformedEntityColor } from './perception';


// ── Richer tile characters (unicode for visual depth) ──
const TILE_CHARS: Record<Tile, string> = {
  [Tile.Wall]: '#',
  [Tile.Floor]: '·',
  [Tile.Corridor]: '·',
  [Tile.Door]: '▫',
  [Tile.StairsDown]: '▼',
  [Tile.StairsUp]: '▲',
  [Tile.Void]: ' ',
  [Tile.BossGate]: '▩',
};

// ── Vivid foreground colors ──
const TILE_COLORS: Record<Tile, string> = {
  [Tile.Wall]: '#7a7a9e',
  [Tile.Floor]: '#4a4a5e',
  [Tile.Corridor]: '#555570',
  [Tile.Door]: '#d4a733',
  [Tile.StairsDown]: '#3eff7e',
  [Tile.StairsUp]: '#3edcdc',
  [Tile.Void]: '#000000',
  [Tile.BossGate]: '#ff3333',
};

// ── Subtle background tints per tile ──
const TILE_BG: Record<Tile, string> = {
  [Tile.Wall]: '#14142a',
  [Tile.Floor]: '#0a0a16',
  [Tile.Corridor]: '#0c0c1a',
  [Tile.Door]: '#1a1408',
  [Tile.StairsDown]: '#061a0c',
  [Tile.StairsUp]: '#061a1a',
  [Tile.Void]: '#000000',
  [Tile.BossGate]: '#1a0808',
};

const EXPLORED_DIM = 0.3;

export interface RenderCell {
  char: string;
  color: string;
  bg: string;
  glow?: string; // optional glow color for special tiles/entities
  glowRadius?: number; // glow radius multiplier (default 1.0)
  glowAlpha?: number;  // glow center alpha (default 0.2)
  hpBar?: { pct: number; color: string }; // optional HP bar for monsters
  fontScale?: number; // scale factor for font size (1.0 = normal, >1 = bigger/bolder)
}

// Pre-compute merged terrain defs once (not per cell)
let _cachedTerrainDefs: typeof TERRAIN_DEFS | null = null;
let _terrainDefMap: Map<string, (typeof TERRAIN_DEFS)[number]> | null = null;
function getAllTerrainDefs() {
  if (!_cachedTerrainDefs) _cachedTerrainDefs = [...TERRAIN_DEFS, ...ZONE_TERRAIN_DEFS];
  return _cachedTerrainDefs;
}
function getTerrainDefMap() {
  if (!_terrainDefMap) {
    _terrainDefMap = new Map();
    for (const t of getAllTerrainDefs()) _terrainDefMap.set(t.type, t);
  }
  return _terrainDefMap;
}

export function renderView(state: GameState, viewW: number, viewH: number): RenderCell[][] {
  const { player, monsters, items, floor, mercenaries, mapMercenaries } = state;
  const { visible, explored, width, height } = floor;

  const camX = Math.max(0, Math.min(player.pos.x - Math.floor(viewW / 2), width - viewW));
  const camY = Math.max(0, Math.min(player.pos.y - Math.floor(viewH / 2), height - viewH));

  // Build spatial lookup maps to avoid per-cell .find() scans
  const posKey = (x: number, y: number) => (y << 16) | x;
  const npcMap = new Map<number, typeof state.npcs extends (infer T)[] | undefined ? T : never>();
  if (state.npcs) for (const n of state.npcs) { if (!n.talked) npcMap.set(posKey(n.pos.x, n.pos.y), n); }
  const itemMap = new Map<number, (typeof items)[number]>();
  for (const i of items) itemMap.set(posKey(i.pos.x, i.pos.y), i);
  const mapMercMap = new Map<number, NonNullable<typeof mapMercenaries>[number]>();
  if (mapMercenaries) for (const m of mapMercenaries) { if (!m.hired) mapMercMap.set(posKey(m.pos.x, m.pos.y), m); }
  const monsterMap = new Map<number, (typeof monsters)[number]>();
  for (const m of monsters) { if (!m.isDead) monsterMap.set(posKey(m.pos.x, m.pos.y), m); }
  const mercMap = new Map<number, NonNullable<typeof mercenaries>[number]>();
  if (mercenaries) for (const m of mercenaries) { if (!m.isDead) mercMap.set(posKey(m.pos.x, m.pos.y), m); }
  // Interactable elements (skill-gated encounters)
  const interactableMap = new Map<number, NonNullable<typeof state.interactables>[number]>();
  if (state.interactables) for (const i of state.interactables) { if (!i.interacted) interactableMap.set(posKey(i.pos.x, i.pos.y), i); }
  // Hidden elements (discovered ones show as interactables)
  const hiddenMap = new Map<number, NonNullable<typeof state.hiddenElements>[number]>();
  if (state.hiddenElements) for (const h of state.hiddenElements) { if (h.discovered && !h.reward) hiddenMap.set(posKey(h.pos.x, h.pos.y), h); }

  const zoneDef = getZoneDef(state.zone);
  const grid: RenderCell[][] = [];

  for (let vy = 0; vy < viewH; vy++) {
    const row: RenderCell[] = [];
    grid[vy] = row;
    for (let vx = 0; vx < viewW; vx++) {
      const mx = camX + vx;
      const my = camY + vy;

      if (mx < 0 || mx >= width || my < 0 || my >= height) {
        row[vx] = { char: ' ', color: '#000', bg: '#000' };
        continue;
      }

      const tile = getTile(floor, mx, my);
      const isVisible = visible[my]?.[mx] ?? false;
      const isExplored = explored[my]?.[mx] ?? false;

      if (!isVisible && !isExplored) {
        row[vx] = { char: ' ', color: '#000', bg: '#000' };
        continue;
      }

      let char = TILE_CHARS[tile];
      let color = TILE_COLORS[tile];
      let bg = TILE_BG[tile];
      let glow: string | undefined;
      let glowRadius: number | undefined;
      let glowAlpha: number | undefined;
      let hpBar: { pct: number; color: string } | undefined;
      let fontScale: number | undefined;

      // Apply zone palette to walls and floors
      if (tile === Tile.Wall) {
        color = zoneDef.palette.wall;
        bg = zoneDef.palette.wallBg;
      } else if (tile === Tile.Floor || tile === Tile.Corridor) {
        color = zoneDef.palette.floor;
        bg = zoneDef.palette.floorBg;
      }

      // Terrain overlay — recolor walkable tiles that have terrain
      const terrainType = getTerrainAt(floor, mx, my);
      if (terrainType && (tile === Tile.Floor || tile === Tile.Corridor)) {
        const tDef = getTerrainDefMap().get( terrainType);
        if (tDef) {
          color = tDef.color;
          bg = tDef.bg;
          if (tDef.glow) glow = tDef.glow;
          // Terrain-specific characters for extra visual distinction
          if (terrainType === 'water') char = '~';
          else if (terrainType === 'lava') char = '~';
          else if (terrainType === 'poison') char = '~';
          else if (terrainType === 'tall_grass') char = '"';
          else if (terrainType === 'ice') char = '·';
          else if (terrainType === 'mud') char = '·';
          else if (terrainType === 'holy') char = '✦';
          else if (terrainType === 'shadow') char = '·';
          else if (terrainType === 'frozen') char = '❄';
          else if (terrainType === 'spore') char = '○';
          else if (terrainType === 'brimstone') char = '▪';
          else if (terrainType === 'crystal') char = '◇';
          else if (terrainType === 'void_rift') char = '∞';
          else if (terrainType === 'mycelium') char = '≈';
        }
      }

      // Walls adopt the color of adjacent terrain tiles
      if (tile === Tile.Wall) {
        const adjTerrain = getAdjacentTerrain(floor, mx, my);
        if (adjTerrain) {
          const tDef = getTerrainDefMap().get( adjTerrain);
          if (tDef) {
            // Blend wall color with terrain — walls get a tinted version
            color = blendColor(zoneDef.palette.wall, tDef.color, 0.5);
            bg = blendColor(zoneDef.palette.wallBg, tDef.bg, 0.6);
          }
        }
      }


      // Boss gate glows red
      if (tile === Tile.BossGate) {
        glow = '#ff3333';
      }

      if (isVisible) {
        // Shop keeper — gold, bright and unmistakable
        if (state.shop && mx === state.shop.pos.x && my === state.shop.pos.y) {
          char = '$';
          color = '#ffd700';
          glow = '#ffd700';
          glowRadius = 1.5;
          glowAlpha = 0.25;
        }

        // NPCs — cyan/blue family, clearly friendly
        const npc = npcMap.get(posKey(mx, my));
        if (npc) {
          const npcDef = getNPCDef(npc.defId);
          if (npcDef) {
            char = npcDef.char;
            color = '#66ddff';  // consistent cyan for all NPCs
            glow = '#66ddff';
            glowRadius = 1.4;
            glowAlpha = 0.22;
          }
        }

        // Map mercenaries (unhired) — blue allies
        const mapMerc = mapMercMap.get(posKey(mx, my));
        if (mapMerc) {
          const mercDef = MERCENARY_DEFS.find(d => d.id === mapMerc.defId);
          if (mercDef) {
            char = mercDef.char;
            color = '#88ccff';
            glow = '#88ccff';
            glowRadius = 1.3;
            glowAlpha = 0.2;
          }
        }

        // Interactable elements (skill-based encounters) — yellow/gold for narrative
        const interactable = interactableMap.get(posKey(mx, my));
        if (interactable) {
          char = '!';
          color = '#ffcc33';
          glow = '#ffcc33';
          glowRadius = 1.5;
          glowAlpha = 0.25;
        }

        // Items on the ground
        const item = itemMap.get(posKey(mx, my));
        if (item) {
          char = item.item.char;
          const rarity = item.item.rarity;
          if (rarity && rarity !== 'common') {
            const rDef = RARITY_DEFS[rarity];
            color = rDef.color;
            glow = rDef.glowColor;
            glowRadius = rDef.glowRadius;
            glowAlpha = rDef.glowAlpha;
          } else {
            // Common items: brighten slightly so they pop against terrain
            color = brightenColor(item.item.color, 1.3);
            glow = '#ffffcc';
            glowAlpha = 0.12;
          }
        }

        // Monsters — visual language: enemies are red-shifted, hotter = harder
        // But affliction perception can change how creatures appear
        const monster = monsterMap.get(posKey(mx, my));
        if (monster) {
          char = monster.char;
          const hpPct = monster.stats.hp / monster.stats.maxHp;

          // Apply affliction-based perception changes to monster color
          const perceivedColor = getTransformedEntityColor(state, monster.color, monster.name);
          const isPerceptionAltered = perceivedColor !== monster.color;

          if (monster.isBoss) {
            // Bosses: bright magenta/crimson, no glow — unless perception changes
            color = isPerceptionAltered ? perceivedColor : '#ff2266';
          } else if (isPerceptionAltered) {
            // Affliction changes how we see this creature (e.g., goblins look friendly)
            color = perceivedColor;
          } else {
            // Regular enemies: shift toward red based on floor difficulty
            // Floor 1 = dull (#cc6655), Floor 5 = mid (#ee5533), Floor 9+ = hot (#ff3311)
            const t = Math.min(1, (state.floorNumber - 1) / 8); // 0 at floor 1, 1 at floor 9
            const r = Math.round(204 + t * 51);  // 204 -> 255
            const g = Math.round(102 - t * 85);  // 102 -> 17
            const b = Math.round(85 - t * 68);   // 85 -> 17
            color = shiftTowardEnemy(monster.color, r, g, b, 0.55);
          }

          // Threat-based font scaling — tougher enemies appear larger
          // Compare monster power (attack + maxHp) vs player power
          const monsterPower = monster.stats.attack + monster.stats.maxHp;
          const playerPower = player.stats.attack + player.stats.maxHp;
          const threatRatio = monsterPower / Math.max(1, playerPower);
          // Bosses always max scale; regular enemies scale from 1.0 to 1.35
          if (monster.isBoss) {
            fontScale = 1.35;
            glow = '#ff2266';
            glowAlpha = 0.15;
          } else if (threatRatio > 1.5) {
            fontScale = 1.25;
          } else if (threatRatio > 1.0) {
            fontScale = 1.1;
          }

          // HP bar — show for all visible monsters
          const barColor = hpPct > 0.6 ? '#33cc44' : hpPct > 0.3 ? '#ccaa22' : '#cc2222';
          hpBar = { pct: hpPct, color: barColor };
          // Status effect visuals (override color when active)
          if (monster.statusEffects?.some(e => e.type === 'freeze')) {
            color = '#88ccff';
          } else if (monster.statusEffects?.some(e => e.type === 'poison')) {
            color = '#33cc22';
          } else if (monster.statusEffects?.some(e => e.type === 'stun')) {
            color = '#ffff88';
          }
        }

        // Mercenaries (hired, in party) — blue-family glow, clearly allied
        const merc = mercMap.get(posKey(mx, my));
        if (merc) {
          char = merc.char;
          color = merc.color;
          glow = '#44aaff';
          glowRadius = 1.4;
          glowAlpha = 0.22;
          // HP bar for mercenaries (blue-tinted when healthy)
          const mercHpPct = merc.stats.hp / merc.stats.maxHp;
          const mercBarColor = mercHpPct > 0.6 ? '#44aaff' : mercHpPct > 0.3 ? '#ccaa22' : '#cc2222';
          hpBar = { pct: mercHpPct, color: mercBarColor };
        }

        // Stairs get a pulsing glow
        if (tile === Tile.StairsDown) {
          glow = '#3eff7e';
        } else if (tile === Tile.StairsUp) {
          glow = '#3edcdc';
        }

        // Player — class-colored symbol with a matching glow
        if (mx === player.pos.x && my === player.pos.y) {
          char = player.char;
          color = player.color;
          glow = player.color;
        }
      } else {
        // Explored but not visible — dim everything
        color = dimColor(color, EXPLORED_DIM);
        bg = dimColor(bg, EXPLORED_DIM);
      }

      row[vx] = { char, color, bg, glow, glowRadius, glowAlpha, hpBar, fontScale };
    }
  }

  // Render projectiles as overlay along their path
  if (state.projectiles && state.projectiles.length > 0) {
    for (const proj of state.projectiles) {
      const points = linePoints(proj.from.x, proj.from.y, proj.to.x, proj.to.y);
      // Skip the first point (attacker) — show projectile along path and at target
      for (let i = 1; i < points.length; i++) {
        const p = points[i]!;
        const vx = p.x - camX;
        const vy = p.y - camY;
        if (vx >= 0 && vx < viewW && vy >= 0 && vy < viewH) {
          const cell = grid[vy]?.[vx];
          if (cell) {
            cell.char = proj.char;
            cell.color = proj.color;
            cell.glow = proj.color;
          }
        }
      }
    }
  }

  return grid;
}

export function viewToMap(state: GameState, viewW: number, viewH: number, vx: number, vy: number): { x: number; y: number } {
  const { player } = state;
  const { width, height } = state.floor;

  const camX = Math.max(0, Math.min(player.pos.x - Math.floor(viewW / 2), width - viewW));
  const camY = Math.max(0, Math.min(player.pos.y - Math.floor(viewH / 2), height - viewH));

  return { x: camX + vx, y: camY + vy };
}

function dimColor(hex: string, factor: number): string {
  if (hex.startsWith('rgb')) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.floor(r * factor)},${Math.floor(g * factor)},${Math.floor(b * factor)})`;
}

// Reusable counts object to avoid allocations in getAdjacentTerrain
const _terrainCounts: Record<string, number> = {};
const _terrainKeys: string[] = [];

function getAdjacentTerrain(floor: GameState['floor'], x: number, y: number): string | undefined {
  for (let i = 0; i < _terrainKeys.length; i++) {
    const key = _terrainKeys[i];
    if (key) _terrainCounts[key] = 0;
  }
  _terrainKeys.length = 0;

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const t = getTerrainAt(floor, x + dx, y + dy);
      if (t) {
        if (_terrainCounts[t] === undefined || _terrainCounts[t] === 0) {
          _terrainKeys.push(t);
        }
        _terrainCounts[t] = (_terrainCounts[t] ?? 0) + 1;
      }
    }
  }

  let best: string | undefined;
  let bestCount = 0;
  for (let i = 0; i < _terrainKeys.length; i++) {
    const type = _terrainKeys[i];
    if (!type) continue;
    const count = _terrainCounts[type] ?? 0;
    if (count > bestCount) {
      bestCount = count;
      best = type;
    }
  }
  return best;
}

function parseHex(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

/** Brighten a hex color by a multiplier (>1 = brighter) */
function brightenColor(hex: string, factor: number): string {
  if (hex.startsWith('rgb')) return hex;
  const [r, g, b] = parseHex(hex);
  return `rgb(${Math.min(255, Math.round(r * factor))},${Math.min(255, Math.round(g * factor))},${Math.min(255, Math.round(b * factor))})`;
}

/** Shift a monster's base color toward the enemy red channel to maintain visual category */
function shiftTowardEnemy(baseHex: string, targetR: number, targetG: number, targetB: number, amount: number): string {
  const [r1, g1, b1] = parseHex(baseHex);
  const r = Math.floor(r1 + (targetR - r1) * amount);
  const g = Math.floor(g1 + (targetG - g1) * amount);
  const b = Math.floor(b1 + (targetB - b1) * amount);
  return `rgb(${Math.max(0, Math.min(255, r))},${Math.max(0, Math.min(255, g))},${Math.max(0, Math.min(255, b))})`;
}

function blendColor(hexA: string, hexB: string, t: number): string {
  const [r1, g1, b1] = parseHex(hexA);
  const [r2, g2, b2] = parseHex(hexB);
  const r = Math.floor(r1 + (r2 - r1) * t);
  const g = Math.floor(g1 + (g2 - g1) * t);
  const b = Math.floor(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
