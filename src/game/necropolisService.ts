import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import type { NecropolisState } from './necropolis';
import { createDefaultNecropolisState, getUnlockedIds } from './necropolis';
import { safeSetItem, safeGetItem } from './safeStorage';

const NECROPOLIS_GAME_TYPE = 'necropolis';
const NECROPOLIS_ROOM_NAME = 'The Necropolis';
const LOCAL_CACHE_KEY = 'necropolis_state';

// We use a single shared multiplayer room for all players.
// Deaths and kills are written directly with updateRoomDataAsync so no server
// GameRoom validation is required.

// Baseline seed from analytics (queried April 16 2026):
// 2,680 deaths across 739 players, ~37 kills/run avg ≈ 99,160 total kills.
// Per-monster breakdown estimated from spawn tables × floor survival rates.
// Floor survival: F1 100%, F2 80%, F3 55%, F4 35%, F5 20%, F6 12%, F7 7%, F8 4%, F9 2%, F10+ 1%
const SEED_DEATHS = 2680;
const SEED_KILLS: Record<string, number> = {
  // Floor 1 (≈30% of all kills — every run encounters these)
  'Rat': 6200, 'Bat': 5800, 'Cave Beetle': 5600, 'Sewer Slug': 5400, 'Tunnel Worm': 5500,
  // Floor 2 (≈24%)
  'Kobold': 4800, 'Dire Rat': 4700, 'Mold Slime': 4400, 'Hobgoblin': 4600, 'Cave Leech': 4300,
  // Floor 3 (≈17%)
  'Giant Spider': 2700, 'Goblin': 2900, 'Cave Scorpion': 2600, 'Fungus Crawler': 2500,
  'Tomb Scarab': 2400, 'Goblin Shaman': 2600,
  // Floor 4 (≈11%)
  'Skeleton': 1600, 'Mimic': 800, 'War Hound': 1500, 'Ghoul': 1400,
  'Harpy': 1300, 'Animated Armor': 1200, 'Carrion Worm': 1100, 'Storm Wisp': 900,
  // Floor 5 (≈7%)
  'Orc': 1000, 'Zombie': 900, 'Dark Elf': 850, 'Wyvern': 800, 'Orc Brute': 750,
  'Imp': 700, 'Gargoyle': 650, 'Specter': 600, 'Fire Elemental': 550,
  // Floor 6 (≈4%)
  'Basilisk': 400, 'Bone Knight': 380, 'Plague Bearer': 360, 'Cockatrice': 340,
  'Ogre': 350, 'Banshee': 320, 'Phase Spider': 300, 'Flesh Golem': 280,
  // Floor 7 (≈2.5%)
  'Wraith': 220, 'Golem': 200, 'Chimera': 190, 'Lich Acolyte': 180,
  'Minotaur': 175, 'Naga': 170, 'Shadow Hound': 165, 'Stone Sentinel': 160,
  // Floor 8+ (≈1.5%)
  'Troll': 120, 'Vampire': 110, 'Manticore': 100, 'Hydra': 90, 'Werewolf': 85,
  'Demon': 60, 'Dragon': 30, 'Death Knight': 25, 'Shadow Dragon': 20,
};

let roomMutex: Promise<void> = Promise.resolve();

let currentRoom: any = null;
let unsubscribeFn: (() => void) | null = null;
let cachedState: NecropolisState = createDefaultNecropolisState();
let connectionPromise: Promise<NecropolisState> | null = null;
let stateListeners: Array<(state: NecropolisState) => void> = [];
// Local floors from player's own bloodline — ensures we never show 0 if the player has data
let localDeathFloor = SEED_DEATHS;
let localKillsFloor: Record<string, number> = { ...SEED_KILLS };

function notifyListeners() {
  for (const listener of stateListeners) {
    listener(cachedState);
  }
}

export function onNecropolisStateChange(listener: (state: NecropolisState) => void): () => void {
  stateListeners.push(listener);
  return () => {
    stateListeners = stateListeners.filter((l) => l !== listener);
  };
}

export function getNecropolisState(): NecropolisState {
  return cachedState;
}

/** Merge two kill records, taking the max for each monster */
function mergeKillsWithFloor(remote: Record<string, number>, local: Record<string, number>): Record<string, number> {
  const merged = { ...remote };
  for (const [name, count] of Object.entries(local)) {
    merged[name] = Math.max(merged[name] ?? 0, count);
  }
  return merged;
}

/** Set a minimum death count from the player's own bloodline data.
 *  This ensures the necropolis never shows 0 when the player has local deaths. */
export function setLocalDeathFloor(totalDeaths: number): void {
  localDeathFloor = totalDeaths;
  // If current cached state is below the floor, bump it up
  if (cachedState.communalDeaths < localDeathFloor) {
    cachedState = {
      ...cachedState,
      communalDeaths: localDeathFloor,
      unlockedIds: getUnlockedIds(localDeathFloor),
      lastUpdated: Date.now(),
    };
    notifyListeners();
  }
}

/** Set minimum kill counts from the player's own bloodline bestiary data.
 *  This ensures the bestiary never shows 0 kills when the player has local kills. */
export function setLocalKillsFloor(kills: Record<string, number>): void {
  localKillsFloor = kills;
  const merged = mergeKillsWithFloor(cachedState.communalKills, localKillsFloor);
  // Only update if something changed
  const changed = Object.keys(merged).some(k => merged[k] !== cachedState.communalKills[k]);
  if (changed) {
    cachedState = {
      ...cachedState,
      communalKills: merged,
      lastUpdated: Date.now(),
    };
    notifyListeners();
  }
}

/** Load cached state from local storage, ensuring we never go below the local floors */
async function loadLocalCache(): Promise<NecropolisState> {
  const raw = await safeGetItem(LOCAL_CACHE_KEY);
  if (raw) {
    try {
      const state = JSON.parse(raw) as NecropolisState;
      if (state.communalDeaths < localDeathFloor) {
        state.communalDeaths = localDeathFloor;
        state.unlockedIds = getUnlockedIds(localDeathFloor);
      }
      state.communalKills = mergeKillsWithFloor(state.communalKills, localKillsFloor);
      return state;
    } catch { /* corrupt cache */ }
  }
  const deaths = localDeathFloor;
  return {
    communalDeaths: deaths,
    unlockedIds: getUnlockedIds(deaths),
    communalKills: { ...localKillsFloor },
    lastUpdated: Date.now(),
  };
}

/** Save state to local storage for offline access */
async function saveLocalCache(state: NecropolisState) {
  safeSetItem(LOCAL_CACHE_KEY, JSON.stringify(state));
}

/** Parse room data into NecropolisState — checks multiple data paths for compatibility */
function parseRoomData(roomData: any): NecropolisState {
  const gs =
    roomData?.necropolisState ??
    roomData?.customMetadata?.necropolisState ??
    roomData?.customMetadata?.rules?.gameState?.gameSpecificState ??
    {};
  const communalDeaths = Math.max(gs.communalDeaths ?? 0, localDeathFloor);
  const communalKills = mergeKillsWithFloor(gs.communalKills ?? {}, localKillsFloor);
  return {
    communalDeaths,
    unlockedIds: getUnlockedIds(communalDeaths),
    communalKills,
    lastUpdated: Date.now(),
  };
}

/** Connect to or create the Necropolis room — safe to call multiple times, only connects once */
export function connectToNecropolis(): Promise<NecropolisState> {
  if (connectionPromise) return connectionPromise;
  connectionPromise = doConnectToNecropolis();
  return connectionPromise;
}

async function doConnectToNecropolis(): Promise<NecropolisState> {
  // Load local cache first for instant display
  cachedState = await loadLocalCache();
  notifyListeners();

  // Rooms API requires authentication — skip for anonymous users
  try {
    const profile = RundotGameAPI.getProfile();
    if (profile.isAnonymous) {
      return cachedState;
    }
  } catch {
    // If we can't determine auth status, skip rooms to be safe
    return cachedState;
  }

  try {
    // Join any available room or create one (singleton-style: all players share one room)
    const result = await RundotGameAPI.rooms.joinOrCreateRoomAsync({
      matchCriteria: { gameType: NECROPOLIS_GAME_TYPE, hasSpace: true },
      createOptions: {
        maxPlayers: 1000,
        gameType: NECROPOLIS_GAME_TYPE,
        name: NECROPOLIS_ROOM_NAME,
        isPrivate: false,
      },
    });
    currentRoom = result.room;

    // Get initial room data
    const roomData = await RundotGameAPI.rooms.getRoomDataAsync(currentRoom);
    const remoteState = parseRoomData(roomData);
    // Merge remote with local — never go backward
    cachedState = {
      communalDeaths: Math.max(remoteState.communalDeaths, cachedState.communalDeaths),
      unlockedIds: getUnlockedIds(Math.max(remoteState.communalDeaths, cachedState.communalDeaths)),
      communalKills: mergeKillsWithFloor(remoteState.communalKills, cachedState.communalKills),
      lastUpdated: Date.now(),
    };
    await saveLocalCache(cachedState);
    notifyListeners();

    // Subscribe to real-time updates from other players
    const unsub = await RundotGameAPI.rooms.subscribeAsync(currentRoom, {
      onData(event: any) {
        const incoming = parseRoomData(event.roomData);
        cachedState = {
          communalDeaths: Math.max(incoming.communalDeaths, cachedState.communalDeaths),
          unlockedIds: getUnlockedIds(Math.max(incoming.communalDeaths, cachedState.communalDeaths)),
          communalKills: mergeKillsWithFloor(incoming.communalKills, cachedState.communalKills),
          lastUpdated: Date.now(),
        };
        saveLocalCache(cachedState);
        notifyListeners();
      },
    });

    unsubscribeFn = unsub;

    return cachedState;
  } catch {
    // If multiplayer fails, use local-only mode
    return cachedState;
  }
}

/** Write the current state directly to the room using updateRoomDataAsync */
async function pushStateToRoom(state: NecropolisState): Promise<void> {
  if (!currentRoom) return;
  try {
    await RundotGameAPI.rooms.updateRoomDataAsync(currentRoom, {
      necropolisState: {
        communalDeaths: state.communalDeaths,
        communalKills: state.communalKills,
        lastUpdated: state.lastUpdated,
      },
    });
  } catch {
    // Best effort — local cache is already updated
  }
}

/** Report a player death to the Necropolis */
export function reportDeath(): Promise<void> {
  const job = roomMutex.then(() => reportDeathInner());
  roomMutex = job.catch(() => {});
  return job;
}

async function reportDeathInner(): Promise<void> {
  cachedState = {
    ...cachedState,
    communalDeaths: cachedState.communalDeaths + 1,
    unlockedIds: getUnlockedIds(cachedState.communalDeaths + 1),
    lastUpdated: Date.now(),
  };
  await saveLocalCache(cachedState);
  notifyListeners();

  if (!currentRoom) {
    try { await connectToNecropolis(); } catch { /* best effort */ }
  }
  if (!currentRoom) return;

  try {
    const roomData = await RundotGameAPI.rooms.getRoomDataAsync(currentRoom);
    const serverState = parseRoomData(roomData);
    const newDeaths = Math.max(serverState.communalDeaths + 1, cachedState.communalDeaths);
    const newKills = mergeKillsWithFloor(serverState.communalKills, cachedState.communalKills);

    cachedState = {
      communalDeaths: newDeaths,
      unlockedIds: getUnlockedIds(newDeaths),
      communalKills: newKills,
      lastUpdated: Date.now(),
    };
    await saveLocalCache(cachedState);
    notifyListeners();
    await pushStateToRoom(cachedState);
  } catch {
    // Best effort - local state already updated
  }
}

/** Report monster kills from a run to the Necropolis communal bestiary */
export function reportKills(monsterKills: Record<string, number>): Promise<void> {
  const job = roomMutex.then(() => reportKillsInner(monsterKills));
  roomMutex = job.catch(() => {});
  return job;
}

async function reportKillsInner(monsterKills: Record<string, number>): Promise<void> {
  const merged = { ...cachedState.communalKills };
  for (const [name, count] of Object.entries(monsterKills)) {
    merged[name] = (merged[name] ?? 0) + count;
  }

  cachedState = {
    ...cachedState,
    communalKills: merged,
    lastUpdated: Date.now(),
  };
  await saveLocalCache(cachedState);
  notifyListeners();

  if (!currentRoom) {
    try { await connectToNecropolis(); } catch { /* best effort */ }
  }
  if (!currentRoom) return;

  try {
    const roomData = await RundotGameAPI.rooms.getRoomDataAsync(currentRoom);
    const serverState = parseRoomData(roomData);

    const updatedKills = { ...serverState.communalKills };
    for (const [name, count] of Object.entries(monsterKills)) {
      updatedKills[name] = (updatedKills[name] ?? 0) + count;
    }

    cachedState = {
      ...cachedState,
      communalDeaths: Math.max(serverState.communalDeaths, cachedState.communalDeaths),
      unlockedIds: getUnlockedIds(Math.max(serverState.communalDeaths, cachedState.communalDeaths)),
      communalKills: mergeKillsWithFloor(updatedKills, localKillsFloor),
      lastUpdated: Date.now(),
    };
    await saveLocalCache(cachedState);
    notifyListeners();
    await pushStateToRoom(cachedState);
  } catch {
    // Best effort
  }
}

/** Disconnect from the Necropolis room */
export async function disconnectFromNecropolis(): Promise<void> {
  if (unsubscribeFn) {
    unsubscribeFn();
    unsubscribeFn = null;
  }
  if (currentRoom) {
    try {
      await RundotGameAPI.rooms.leaveRoomAsync(currentRoom);
    } catch { /* best effort */ }
    currentRoom = null;
  }
}
