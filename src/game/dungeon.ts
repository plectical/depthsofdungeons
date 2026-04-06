import { Tile, type DungeonFloor, type Room, type TerrainMap, type TerrainType, type ZoneId } from './types';
import { MAP_WIDTH, MAP_HEIGHT, MIN_ROOM_SIZE, MAX_ROOM_SIZE, MAX_ROOMS } from './constants';
import { randInt, pick } from './utils';
import { getZoneTerrainDefs } from './zones';

function roomsOverlap(a: Room, b: Room): boolean {
  return a.x - 1 < b.x + b.w + 1 && a.x + a.w + 1 > b.x - 1 && a.y - 1 < b.y + b.h + 1 && a.y + a.h + 1 > b.y - 1;
}

function tileAt(tiles: Tile[][], y: number, x: number): Tile {
  return tiles[y]?.[x] ?? Tile.Void;
}

function setTile(tiles: Tile[][], y: number, x: number, val: Tile): void {
  const row = tiles[y];
  if (row) row[x] = val;
}

function hCorridor(tiles: Tile[][], x1: number, x2: number, y: number) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  for (let x = minX; x <= maxX; x++) {
    const t = tileAt(tiles, y, x);
    if (t === Tile.Void || t === Tile.Wall) {
      setTile(tiles, y, x, Tile.Corridor);
    }
  }
}

function vCorridor(tiles: Tile[][], y1: number, y2: number, x: number) {
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  for (let y = minY; y <= maxY; y++) {
    const t = tileAt(tiles, y, x);
    if (t === Tile.Void || t === Tile.Wall) {
      setTile(tiles, y, x, Tile.Corridor);
    }
  }
}

export function generateFloor(floorNumber: number, zone: ZoneId = 'stone_depths'): DungeonFloor {
  // Early floors are smaller and tighter so players find stairs faster
  // Floors scale up to full size by floor 6
  const sizeScale = Math.min(1, 0.55 + floorNumber * 0.075);
  const width = Math.round(MAP_WIDTH * sizeScale);
  const height = Math.round(MAP_HEIGHT * sizeScale);

  const tiles: Tile[][] = [];
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      tiles[y]![x] = Tile.Void;
    }
  }

  const rooms: Room[] = [];
  const maxAttempts = 200;
  const targetRooms = Math.min(MAX_ROOMS, 6 + floorNumber);

  for (let attempt = 0; attempt < maxAttempts && rooms.length < targetRooms; attempt++) {
    // Rooms scale with floor — early floors have smaller rooms for tighter layouts
    const maxRoom = Math.min(MAX_ROOM_SIZE, MIN_ROOM_SIZE + floorNumber);
    const w = randInt(MIN_ROOM_SIZE, maxRoom);
    const h = randInt(MIN_ROOM_SIZE, maxRoom);
    const x = randInt(1, width - w - 2);
    const y = randInt(1, height - h - 2);

    const room: Room = { x, y, w, h, centerX: Math.floor(x + w / 2), centerY: Math.floor(y + h / 2) };
    if (rooms.some((r) => roomsOverlap(r, room))) continue;

    rooms.push(room);

    for (let ry = y - 1; ry <= y + h; ry++) {
      for (let rx = x - 1; rx <= x + w; rx++) {
        if (ry < 0 || ry >= height || rx < 0 || rx >= width) continue;
        if (ry === y - 1 || ry === y + h || rx === x - 1 || rx === x + w) {
          if (tileAt(tiles, ry, rx) === Tile.Void) setTile(tiles, ry, rx, Tile.Wall);
        } else {
          setTile(tiles, ry, rx, Tile.Floor);
        }
      }
    }
  }

  for (let i = 1; i < rooms.length; i++) {
    const prev = rooms[i - 1]!;
    const curr = rooms[i]!;
    if (Math.random() < 0.5) {
      hCorridor(tiles, prev.centerX, curr.centerX, prev.centerY);
      vCorridor(tiles, prev.centerY, curr.centerY, curr.centerX);
    } else {
      vCorridor(tiles, prev.centerY, curr.centerY, prev.centerX);
      hCorridor(tiles, prev.centerX, curr.centerX, curr.centerY);
    }
  }

  // Doors at room-corridor boundaries
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (tileAt(tiles, y, x) !== Tile.Corridor) continue;
      const hFloor = tileAt(tiles, y, x - 1) === Tile.Floor || tileAt(tiles, y, x + 1) === Tile.Floor;
      const vFloor = tileAt(tiles, y - 1, x) === Tile.Floor || tileAt(tiles, y + 1, x) === Tile.Floor;
      const hWall = tileAt(tiles, y, x - 1) === Tile.Wall || tileAt(tiles, y, x + 1) === Tile.Wall;
      const vWall = tileAt(tiles, y - 1, x) === Tile.Wall || tileAt(tiles, y + 1, x) === Tile.Wall;
      if ((hFloor && vWall) || (vFloor && hWall)) {
        // Fewer doors on early floors — doors slow exploration
        const doorChance = floorNumber <= 2 ? 0.2 : 0.4;
        if (Math.random() < doorChance) setTile(tiles, y, x, Tile.Door);
      }
    }
  }

  // Boss arena every 3 floors starting at floor 3 (no locked gates — boss room is open)
  if (floorNumber >= 3 && floorNumber % 3 === 0 && rooms.length >= 3) {
    for (let i = rooms.length - 2; i >= 1; i--) {
      const room = rooms[i]!;
      room.isBossArena = true;
      break;
    }
  }

  // Stairs down
  if (rooms.length > 0) {
    const stairsRoom = rooms[rooms.length - 1]!;
    setTile(tiles, stairsRoom.centerY, stairsRoom.centerX, Tile.StairsDown);
  }

  const visible: boolean[][] = [];
  const explored: boolean[][] = [];
  for (let y = 0; y < height; y++) {
    visible[y] = new Array<boolean>(width).fill(false);
    explored[y] = new Array<boolean>(width).fill(false);
  }

  // Fill walls around corridors
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t = tileAt(tiles, y, x);
      if (t === Tile.Corridor || t === Tile.Door || t === Tile.BossGate) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width && tileAt(tiles, ny, nx) === Tile.Void) {
              setTile(tiles, ny, nx, Tile.Wall);
            }
          }
        }
      }
    }
  }

  const terrain = generateTerrain(tiles, rooms, floorNumber, width, height, zone);

  return { width, height, tiles, rooms, visible, explored, terrain };
}

// ── Terrain generation ──

function generateTerrain(
  tiles: Tile[][],
  rooms: Room[],
  floorNumber: number,
  width: number,
  height: number,
  zone: ZoneId = 'stone_depths',
): TerrainMap {
  const terrain: TerrainMap = {};
  // Use zone-specific terrain pool
  const zoneTerrainDefs = getZoneTerrainDefs(zone);
  const eligible = zoneTerrainDefs.filter((t) => t.minFloor <= floorNumber);
  if (eligible.length === 0) return terrain;

  // Most rooms get terrain — skip room 0 (player spawn) and boss arenas
  const candidateRooms = rooms.filter((r, i) => i > 0 && !r.isBossArena);

  // 60-80% of eligible rooms get terrain, with multiple patches possible per room
  const roomsToFill = Math.max(1, Math.floor(candidateRooms.length * (0.6 + Math.random() * 0.2)));
  const shuffled = [...candidateRooms].sort(() => Math.random() - 0.5).slice(0, roomsToFill);

  for (const room of shuffled) {
    // Each room gets 1-2 terrain types
    const typesInRoom = Math.random() < 0.25 ? 2 : 1;

    for (let t = 0; t < typesInRoom; t++) {
      const def = pick(eligible);

      // Cover 40-90% of the room's floor area (much bigger patches)
      const maxFill = Math.floor(room.w * room.h * (0.4 + Math.random() * 0.5));
      const clusterSize = Math.max(4, maxFill);
      const startX = randInt(room.x, room.x + room.w - 1);
      const startY = randInt(room.y, room.y + room.h - 1);

      // Flood-fill-style spread from the starting point
      const open: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
      const placed = new Set<string>();
      let count = 0;

      while (open.length > 0 && count < clusterSize) {
        const idx = randInt(0, open.length - 1);
        const pos = open[idx]!;
        open.splice(idx, 1);

        const key = `${pos.x},${pos.y}`;
        if (placed.has(key)) continue;
        if (terrain[key]) continue; // Don't overwrite other terrain
        if (pos.x < room.x || pos.x >= room.x + room.w) continue;
        if (pos.y < room.y || pos.y >= room.y + room.h) continue;

        const tile = tiles[pos.y]?.[pos.x];
        if (tile !== Tile.Floor) continue;

        terrain[key] = def.type;
        placed.add(key);
        count++;

        // Expand to neighbors
        for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]] as const) {
          const nk = `${pos.x + dx},${pos.y + dy}`;
          if (!placed.has(nk)) {
            open.push({ x: pos.x + dx, y: pos.y + dy });
          }
        }
      }
    }
  }

  // Corridors also get terrain — 12% chance per corridor tile (much more common)
  // Use the first 4 terrain types from the zone pool that are eligible
  const corridorTerrains: TerrainType[] = eligible
    .slice(0, 4)
    .map(e => e.type);
  if (corridorTerrains.length > 0) {
    // Pick a dominant corridor terrain for consistency
    const dominantCorrTerrain = pick(corridorTerrains);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (tiles[y]?.[x] === Tile.Corridor && !terrain[`${x},${y}`] && Math.random() < 0.12) {
          // 70% dominant, 30% random
          terrain[`${x},${y}`] = Math.random() < 0.7 ? dominantCorrTerrain : pick(corridorTerrains);
        }
      }
    }
  }

  return terrain;
}

export function getTerrainAt(floor: DungeonFloor, x: number, y: number): TerrainType | undefined {
  return floor.terrain[`${x},${y}`];
}

export function isWalkableTile(tile: Tile): boolean {
  return tile === Tile.Floor || tile === Tile.Corridor || tile === Tile.Door
    || tile === Tile.StairsDown || tile === Tile.StairsUp || tile === Tile.BossGate;
}

export function getTile(floor: { tiles: Tile[][]; width: number; height: number }, x: number, y: number): Tile {
  if (x < 0 || x >= floor.width || y < 0 || y >= floor.height) return Tile.Void;
  return floor.tiles[y]?.[x] ?? Tile.Void;
}
