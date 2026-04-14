// ── Tile types ──
export enum Tile {
  Wall = '#',
  Floor = '.',
  Corridor = '+',
  Door = 'D',
  StairsDown = '>',
  StairsUp = '<',
  Void = ' ',
  BossGate = 'G',
}

// ── Zone system ──
export type ZoneId = 'stone_depths' | 'frozen_caverns' | 'fungal_marsh' | 'infernal_pit' | 'crystal_sanctum' | 'shadow_realm' | 'hell' | 'narrative_test';

export interface ZoneDef {
  id: ZoneId;
  name: string;
  description: string;
  color: string;
  icon: string;
  /** Boss names + class combos required to unlock. Empty = always available. */
  unlockRequirements: ZoneUnlockReq[];
  /** Terrain types that appear in this zone */
  terrainPool: TerrainType[];
  /** Floor range this zone spans */
  floorRange: { min: number; max: number };
  /** Wall/floor color overrides */
  palette: { wall: string; wallBg: string; floor: string; floorBg: string };
  /** Debug-only zone, hidden from normal zone selection */
  isDebugZone?: boolean;
}

export interface ZoneUnlockReq {
  bossName: string;
  withClass: PlayerClass;
}

// ── Elemental types ──
export type Element = 'fire' | 'ice' | 'poison' | 'lightning' | 'dark' | 'holy';

// ── Terrain types (environmental overlay on walkable tiles) ──
export type TerrainType = 'water' | 'lava' | 'poison' | 'ice' | 'tall_grass' | 'mud' | 'holy' | 'shadow'
  | 'frozen' | 'spore' | 'brimstone' | 'crystal' | 'void_rift' | 'mycelium'
  | 'hellfire' | 'soul_ash' | 'blood_pool';

export interface TerrainDef {
  type: TerrainType;
  name: string;
  color: string;       // foreground dot color
  bg: string;          // background tint
  glow?: string;       // optional glow
  minFloor: number;    // earliest floor this terrain can appear
}

// ── Terrain map — stores terrain overlays per-tile (sparse) ──
export type TerrainMap = Record<string, TerrainType>; // key = "x,y"

// ── Position ──
export interface Pos {
  x: number;
  y: number;
}

// ── Room for dungeon generation ──
export interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
  centerX: number;
  centerY: number;
  isBossArena?: boolean;
}

// ── Stats ──
export interface Stats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
}

// ── Item rarity ──
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

// ── Equipment slots ──
export type EquipSlot = 'weapon' | 'armor' | 'ring' | 'amulet' | 'offhand' | 'legacy';

// ── Item types ──
export type ItemType = 'weapon' | 'armor' | 'ring' | 'amulet' | 'offhand' | 'legacy' | 'potion' | 'scroll' | 'gold' | 'food';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  char: string;
  color: string;
  value: number;
  equipSlot?: EquipSlot;
  statBonus?: Partial<Stats>;
  /** Narrative skill bonuses (e.g., +2 Stealth, +1 Awareness) */
  skillBonus?: Partial<CharacterSkills>;
  description: string;
  element?: Element;
  onHitEffect?: ItemEffect;
  onDefendEffect?: ItemEffect;
  /** Attack range for ranged weapons (undefined or 1 = melee only) */
  range?: number;
  /** Item rarity — affects display color, glow, and stat scaling */
  rarity?: ItemRarity;
  /** If set, only these classes can equip this item */
  classRestriction?: PlayerClass[];
}

// ── Special item effects ──
export type ItemEffect =
  | { type: 'lifesteal'; percent: number }
  | { type: 'hungersteal'; amount: number }
  | { type: 'poison'; damage: number; turns: number }
  | { type: 'stun'; chance: number }
  | { type: 'thorns'; damage: number }
  | { type: 'fireball'; damage: number; chance: number }
  | { type: 'freeze'; chance: number; turns: number }
  | { type: 'bleed'; damage: number; turns: number }
  | { type: 'execute'; hpThreshold: number; chance: number };

// ── Monster innate abilities (non-boss) ──
export type MonsterAbility =
  | { type: 'poisonAttack'; damage: number; turns: number; chance: number }
  | { type: 'stunAttack'; chance: number }
  | { type: 'bleedAttack'; damage: number; turns: number; chance: number }
  | { type: 'freezeAttack'; chance: number; turns: number }
  | { type: 'chargeAttack'; multiplier: number; chance: number }
  | { type: 'selfHeal'; amount: number; hpThreshold: number; cooldown: number }
  | { type: 'enrage'; hpThreshold: number; atkMultiplier: number }
  | { type: 'dodge'; chance: number }
  | { type: 'callForHelp'; monsterName: string; chance: number; cooldown: number }
  | { type: 'drainLife'; percent: number; chance: number };

// ── Monster definitions ──
export interface MonsterDef {
  name: string;
  char: string;
  color: string;
  stats: Stats;
  xpValue: number;
  minFloor: number;
  lootChance: number;
  isBoss?: boolean;
  bossAbility?: BossAbility;
  guaranteedLoot?: string;
  element?: Element;
  /** When this monster attacks, it creates terrain around the target */
  terrainOnHit?: { terrain: TerrainType; radius: number; chance: number };
  /** Innate combat abilities for non-boss monsters */
  abilities?: MonsterAbility[];
  /** How many tiles away this monster can see and aggro the player (requires LOS). Default 8. */
  aggroRange?: number;
  /** Attack range for ranged monsters (undefined or 1 = melee only) */
  attackRange?: number;
  /** Projectile character for ranged attacks (e.g. '*', '~', '→') */
  projectileChar?: string;
  /** Projectile color */
  projectileColor?: string;
}

export type BossAbility =
  | { type: 'summon'; monsterName: string; count: number; cooldown: number }
  | { type: 'rage'; hpThreshold: number; atkMultiplier: number }
  | { type: 'heal'; amount: number; cooldown: number }
  | { type: 'aoe'; damage: number; radius: number; cooldown: number }
  | { type: 'teleport'; cooldown: number }
  | { type: 'terrain_attack'; terrain: TerrainType; radius: number; count: number; cooldown: number }
  | { type: 'multi'; abilities: BossAbility[] };

// ── Entity on the map ──
export interface Entity {
  id: string;
  pos: Pos;
  name: string;
  char: string;
  color: string;
  stats: Stats;
  xp: number;
  level: number;
  inventory: Item[];
  equipment: Partial<Record<EquipSlot, Item>>;
  isPlayer: boolean;
  isDead: boolean;
  isBoss?: boolean;
  bossAbility?: BossAbility;
  bossAbilityCooldown?: number;
  isEnraged?: boolean;
  statusEffects?: StatusEffect[];
  isMercenary?: boolean;
  mercName?: string;
  element?: Element;
  /** Whether this creature has been befriended through dialogue */
  isBefriended?: boolean;
  /** Whether this creature is hostile (default true for monsters) */
  isHostile?: boolean;
  /** When this monster attacks, it creates terrain around the target */
  terrainOnHit?: { terrain: TerrainType; radius: number; chance: number };
  /** Innate combat abilities for non-boss monsters */
  abilities?: MonsterAbility[];
  /** Per-ability cooldown tracking */
  abilityCooldowns?: Record<string, number>;
  /** Whether this monster is enraged */
  isMonsterEnraged?: boolean;
  /** Base monster name (before variant prefix), used for bestiary grouping */
  baseName?: string;
  /** Full variant display name, e.g. "Crimson Rat" */
  variantName?: string;
  /** Abilities the player has chosen on level up */
  chosenAbilities?: string[];
  /** How many tiles away this monster can see and aggro the player (requires LOS). Default 8. */
  aggroRange?: number;
  /** Attack range for ranged monsters (undefined or 1 = melee only) */
  attackRange?: number;
  /** Projectile character for ranged attacks */
  projectileChar?: string;
  /** Projectile color */
  projectileColor?: string;
  /** Consecutive turns this entity hasn't moved (used for stuck detection in mercs) */
  stuckTurns?: number;
  /** Faction this creature belongs to (for reputation/transformation system) */
  factionId?: FactionId;
}

// ── Status effects ──
export interface StatusEffect {
  type: 'poison' | 'stun' | 'bleed' | 'freeze';
  turnsRemaining: number;
  damage?: number;
}

// ── Mercenary definitions ──
export interface MercenaryDef {
  id: string;
  name: string;
  title: string;
  char: string;
  color: string;
  hireCost: number;
  stats: Stats;
  minFloor: number;
  description: string;
  specialAbility: string;
  // AI-generated fields
  portraitUrl?: string;
  portraitAsset?: string;
  backstory?: string;
  personality?: string;
  isGenerated?: boolean;
}

// ── Item on the map ──
export interface MapItem {
  id: string;
  pos: Pos;
  item: Item;
}

// ── Dungeon floor data ──
export interface DungeonFloor {
  width: number;
  height: number;
  tiles: Tile[][];
  rooms: Room[];
  visible: boolean[][];
  explored: boolean[][];
  terrain: TerrainMap;
}

// ── Message log entry ──
export interface LogMessage {
  text: string;
  color: string;
  turn: number;
}

// ── Hunger state ──
export interface HungerState {
  current: number;
  max: number;
}

// ── Player classes ──
export type PlayerClass = 'warrior' | 'rogue' | 'mage' | 'ranger' | 'necromancer' | 'revenant' | 'paladin' | 'hellborn' | 'impregnar' | 'generated';

export interface PassiveAbility {
  name: string;
  description: string;
  unlockLevel: number;
}

/** An ability the player can choose on level up. */
export interface ChoosableAbility {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  /** Minimum player level to be offered this ability. */
  minLevel: number;
  /** The class this ability belongs to. 'any' means available to all classes. */
  classId: PlayerClass | 'any';
}

/** Pending ability choice presented to the player on level up. */
export interface AbilityChoice {
  options: ChoosableAbility[];
  level: number;
}

export interface ClassDef {
  id: PlayerClass;
  name: string;
  char: string;
  color: string;
  description: string;
  baseStats: Stats;
  levelBonusHp: number;
  levelBonusAtk: number;
  levelBonusDef: number;
  passives: PassiveAbility[];
  /** Pool of choosable abilities offered on level up. */
  abilityPool: ChoosableAbility[];
  requiresBestFloor: number;
}

// ── Shop ──
export interface ShopItem {
  item: Item;
  price: number;
}

export interface Shop {
  pos: Pos;
  stock: ShopItem[];
}

// ── Bloodline: persists across all runs ──

export interface RunStats {
  kills: number;
  damageDealt: number;
  damageTaken: number;
  potionsUsed: number;
  foodEaten: number;
  scrollsUsed: number;
  itemsFound: number;
  goldEarned: number;
  floorsCleared: number;
  npcsTalkedTo: number;
  monsterKills: Record<string, number>;
  bossesKilled: number;
  mercenariesHired: number;
  rangedAttacks: number;
  terrainSteps: Record<string, number>;
  /** Essence Shards earned this run (for Legacy Gear) */
  essenceShardsEarned: number;
  /** Named food items eaten (for quests like "Eat 3 Bread") */
  namedFoodEaten: Record<string, number>;
  /** Named potions used (for quests like "Use 5 Health Potions") */
  namedPotionsUsed: Record<string, number>;
  /** Class abilities used this run */
  abilitiesUsed: number;
  /** Rarity tiers equipped this run (for quests) */
  rarityEquipped: Record<string, boolean>;
  /** Named items equipped this run (for quests) */
  namedItemsEquipped: string[];
  /** Shop purchases this run */
  shopPurchases: number;
  /** Auto-play turns this run */
  autoTurns: number;
  /** Weapon type kills this run */
  weaponTypeKills: Record<string, number>;
  /** Zones completed this run */
  zonesCompleted: string[];
}

export interface AncestorRecord {
  name: string;
  class: PlayerClass;
  floorReached: number;
  level: number;
  score: number;
  killCount: number;
  causeOfDeath: string;
  turnsLived: number;
}

export interface BloodlineData {
  version: number;
  generation: number;
  ancestors: AncestorRecord[];
  cumulative: {
    totalDeaths: number;
    totalKills: number;
    totalDamageDealt: number;
    totalDamageTaken: number;
    totalFloors: number;
    totalScore: number;
    totalTurns: number;
    totalPotionsUsed: number;
    totalFoodEaten: number;
    totalScrollsUsed: number;
    totalItemsFound: number;
    totalGoldEarned: number;
    totalNpcsTalkedTo: number;
    totalMonsterKills: Record<string, number>;
    classDeaths: Record<PlayerClass, number>;
    highestFloor: number;
    highestScore: number;
  };
  unlockedTraits: string[];
  npcChoicesMade: Record<string, string>;
  /** Tracks which bosses were killed with which classes for zone unlocks. Key = "bossName|classId" */
  bossKillLog: string[];
  /** Run history — stores last 20 completed runs */
  runHistory?: RunHistoryEntry[];
  /** Bestiary — tracks which monsters have been encountered */
  bestiary?: Record<string, BestiaryEntry>;
  /** Tutorial progress — tracks which onboarding steps have been completed (first run only) */
  tutorialSteps?: TutorialStepId[];
  /** Whether the tutorial bar has been permanently dismissed */
  tutorialComplete?: boolean;
  /** Journal — IDs of lore entries the player has seen (read/dismissed the popup) */
  journalSeenIds?: string[];
  /** Legacy Gear system — persists across runs */
  legacyData?: LegacySystemData;
  /** Story system — persists character relationships and arc progress across runs */
  storyData?: BloodlineStoryData;
  /** Faction reputation system — persists creature faction relationships across runs */
  factionReputations?: FactionReputation[];
  /** Story journal — records all encountered stories/characters with images */
  storyJournal?: JournalEntry[];
  /** Race IDs that the player has permanently unlocked */
  unlockedRaces?: string[];
}

/** A journal entry recording an encountered character/story */
export interface JournalEntry {
  id: string;
  /** Character/creature name */
  name: string;
  /** Character title if any */
  title?: string;
  /** Portrait URL */
  portraitUrl?: string;
  /** Brief summary of the encounter */
  summary: string;
  /** How the encounter ended */
  outcome: 'peaceful' | 'combat' | 'fled' | 'befriended' | 'killed';
  /** Floor where encountered */
  floor: number;
  /** Zone where encountered */
  zone: ZoneId;
  /** Timestamp */
  timestamp: number;
  /** Any rewards gained */
  rewards?: string[];
  /** Whether they gave a quest */
  gaveQuest?: boolean;
}

export type TutorialStepId =
  | 'moved'
  | 'picked_up_item'
  | 'killed_enemy'
  | 'used_item'
  | 'tried_auto'
  | 'reached_floor_2'
  | 'died';

export interface RunHistoryEntry {
  class: PlayerClass;
  zone: ZoneId;
  floorReached: number;
  level: number;
  score: number;
  kills: number;
  turns: number;
  causeOfDeath: string;
  bossesKilled: number;
  timestamp: number;
}

export interface BestiaryEntry {
  name: string;
  encountered: boolean;
  killed: boolean;
  killCount: number;
  /** Snapshot of the base stats at time of first encounter */
  stats?: Stats;
  isBoss?: boolean;
  /** The display color of this monster/variant */
  color?: string;
  /** The character used to render this monster */
  char?: string;
  /** The base monster name (for variant grouping) */
  baseName?: string;
}

// ── Trait system ──

export type TraitEffect =
  | { type: 'statBonus'; stat: keyof Stats; value: number }
  | { type: 'startingItem'; itemName: string }
  | { type: 'startingGold'; amount: number }
  | { type: 'hungerBonus'; value: number }
  | { type: 'xpMultiplier'; value: number }
  | { type: 'multi'; effects: TraitEffect[] };

export interface TraitDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'death' | 'combat' | 'exploration' | 'class' | 'npc' | 'legacy';
  condition: (b: BloodlineData) => boolean;
  effect: TraitEffect;
}

// ── NPC encounters ──

export type DialogueEffect =
  | { type: 'heal'; amount: number }
  | { type: 'gold'; amount: number }
  | { type: 'item'; itemName: string }
  | { type: 'statBuff'; stat: keyof Stats; amount: number }
  | { type: 'hunger'; amount: number }
  | { type: 'npcChoice'; eventId: string; choiceId: string }
  | { type: 'message'; text: string; color: string }
  | { type: 'boon'; boon: CharacterBoon }
  | { type: 'setFlag'; key: string; value: string };

export interface DialogueChoice {
  label: string;
  responseText: string;
  effects: DialogueEffect[];
  /** Only show this choice if the given story flag is set */
  requiresFlag?: { key: string; value: string };
}

export interface DialogueNode {
  text: string;
  choices: DialogueChoice[];
}

export interface NPCDef {
  id: string;
  name: string;
  char: string;
  color: string;
  minFloor: number;
  spawnChance: number;
  requiresGeneration?: number;
  dialogue: DialogueNode | ((bloodline: BloodlineData) => DialogueNode);
  portraitUrl?: string; // AI-generated or static portrait
  portraitAsset?: string; // CDN asset path for pre-baked portrait (story mode)
  appearanceDescription?: string; // For AI portrait generation
}

export interface MapNPC {
  id: string;
  pos: Pos;
  defId: string;
  talked: boolean;
}

// ── Mercenary on the map ──
export interface MapMercenary {
  id: string;
  pos: Pos;
  defId: string;
  hired: boolean;
}

// ── Full game state ──
export interface GameState {
  player: Entity;
  playerClass: PlayerClass;
  playerRace?: string;
  zone: ZoneId;
  monsters: Entity[];
  items: MapItem[];
  floor: DungeonFloor;
  floorNumber: number;
  turn: number;
  messages: LogMessage[];
  gameOver: boolean;
  score: number;
  hunger: HungerState;
  survivalUsedThisFloor?: boolean;
  undyingWillUsedThisFloor?: boolean;
  beyondDeathUsedThisFloor?: boolean;
  shop: Shop | null;
  runStats: RunStats;
  npcs: MapNPC[];
  pendingNPC: string | null;
  xpMultiplier: number;
  _bloodlineRef?: BloodlineData;
  _isStoryMode?: boolean;
  /** Story mode flags set during this run (synced to CampaignSave.storyFlags) */
  _storyFlags?: Record<string, string>;
  /** Dino Serum: turns remaining in dinosaur form (0 = human) */
  dinoTransformTurns?: number;
  /** Dino Serum: permanent transformation (took too many serums) */
  dinoPermanent?: boolean;
  /** General transform system: active transform ID */
  _activeTransformId?: string | null;
  /** General transform system: turns remaining (0 = not active or permanent) */
  _transformTurns?: number;
  /** General transform system: permanent flag */
  _transformPermanent?: boolean;
  /** General transform system: uses per transform type in this run */
  _transformUses?: Record<string, number>;
  /** Tracks cumulative serum uses within the current run (synced to CampaignSave.dinoSerumUses) */
  _campaignDinoUses?: number;
  mercenaries: Entity[];
  mapMercenaries: MapMercenary[];
  pendingMercenary: string | null;
  bossesDefeatedThisRun: string[];
  premiumActive?: boolean;
  /** Pending ability choice — shown to player when they level up. */
  pendingAbilityChoice?: AbilityChoice | null;
  /** Active projectile animations (cleared after rendering) */
  projectiles?: Projectile[];
  /** Available skill points to spend in the skill tree */
  skillPoints: number;
  /** IDs of unlocked skill tree nodes */
  unlockedNodes: string[];
  /** Narrative skills (Stealth, Diplomacy, etc.) — rolled at run start */
  skills?: CharacterSkills;
  /** Runtime story state for the current run */
  runStory?: RunStoryState;
  /** Generated content cache for progressive floor generation */
  contentCache?: RunContentCache;
  /** Hidden skill-gated elements on the current floor */
  hiddenElements?: HiddenElement[];
  /** Interactable skill-gated elements on the current floor */
  interactables?: InteractableElement[];
  /** Pending story dialogue to show */
  pendingStoryDialogue?: { beatId: string; nodeId: string } | null;
  /** Active character quests (from AI NPCs) */
  activeCharacterQuests?: CharacterQuest[];
  /** Active boons granted by AI characters */
  activeCharacterBoons?: CharacterBoon[];
  /** Pending enemy encounter dialogue (shows before combat) */
  pendingEnemyEncounter?: PendingEnemyEncounter | null;
  /** Enemy IDs that have already been interacted with (skips dialogue on re-encounter) */
  encounteredEnemyIds?: string[];
  /** Active affliction/transformation state (per-run, resets on death) */
  activeAffliction?: ActiveAffliction | null;
  /** Transformed class if player has fully transformed */
  transformedClass?: TransformedClassDef | null;
  /** Room IDs the player has visited this run (for room event tracking) */
  visitedRoomIds?: string[];
  /** Pending room event to show */
  pendingRoomEvent?: ActiveRoomEvent | null;
  /** Active buffs/debuffs from room events */
  roomEventBuffs?: RoomEventBuff[];
  /** The patron NPC for this run (generated in narrative zone) */
  runPatron?: {
    characterId: string;
    name: string;
    factionId: FactionId;
    race: string;
    portraitUrl?: string;
  };
}

// ── Enemy encounter dialogue (attack/communicate/steal/observe) ──
export interface EnemyEncounterData {
  enemyId: string;
  enemyName: string;
  characterName: string;
  characterTitle: string;
  portraitUrl?: string;
  portraitPrompt?: string;
  dialogue: StoryDialogueTree;
  rewards: Record<string, EnemyEncounterReward>;
  quest?: EnemyQuest;
  usedForInstance?: string; // Tracks which enemy instance used this pre-generated encounter
}

export interface EnemyQuest {
  name: string;
  description: string;
  objective: 'kill_enemies' | 'find_item' | 'reach_floor' | 'survive_floors';
  targetType?: string;
  targetCount: number;
  goldReward: number;
  echoReward: number;
}

export interface EnemyEncounterReward {
  gold?: number;
  item?: string;
  boonType?: BoonEffectType;
  boonValue?: number;
}

export interface PendingEnemyEncounter {
  enemyId: string;
  enemyName: string;
  encounter: EnemyEncounterData;
  /** Combat advantage bonus from observe/tactical choices */
  advantageBonus?: number;
}

// ══════════════════════════════════════════════════════════════
// CHARACTER BOONS (temporary abilities from AI NPCs)
// ══════════════════════════════════════════════════════════════

export type BoonEffectType =
  | 'damage_boost'      // +X% damage
  | 'defense_boost'     // +X defense
  | 'hp_regen'          // Heal X HP per floor
  | 'gold_find'         // +X% gold drops
  | 'xp_boost'          // +X% XP gain
  | 'skill_bonus'       // +X to a specific skill
  | 'crit_chance'       // +X% critical hit chance
  | 'lifesteal'         // Heal X% of damage dealt
  | 'thorns'            // Reflect X damage when hit
  | 'evasion'           // X% chance to dodge attacks
  | 'first_strike'      // Deal X bonus damage on first hit each combat
  | 'treasure_sense'    // Reveal hidden items on floor
  | 'monster_fear'      // X% chance enemies flee
  | 'revival'           // Survive death once with X HP
  | 'ability_unlock';   // Unlock a special ability

export interface BoonEffect {
  type: BoonEffectType;
  value: number;
  qualifier?: string;  // For skill_bonus (skill name), ability_unlock (ability id)
}

export interface CharacterBoon {
  id: string;
  characterId: string;
  characterName: string;
  name: string;           // "Shadow's Blessing", "Warrior's Favor"
  description: string;    // What the boon does
  flavorText: string;     // Character's words when granting it
  icon: string;           // ASCII icon
  color: string;
  effects: BoonEffect[];
  duration: 'run' | 'floors';  // Lasts entire run or X floors
  floorsRemaining?: number;    // If duration is 'floors'
  grantedAt: number;           // Floor number when granted
  isActive: boolean;
}

/** A projectile flying across the map (purely visual + triggers attack on arrival) */
export interface Projectile {
  from: Pos;
  to: Pos;
  char: string;
  color: string;
}

// ── Skill Tree ──

export type SkillNodeEffect =
  | { type: 'ability'; abilityId: string }
  | { type: 'stat'; stat: keyof Stats; value: number }
  | { type: 'weaponProf'; weaponKeyword: string; damagePercent: number }
  | { type: 'enemyBonus'; enemyKeyword: string; damagePercent: number }
  | { type: 'activeModifier'; modifierId: string }
  | { type: 'passive'; passiveId: string }
  | { type: 'multi'; effects: SkillNodeEffect[] };

export interface SkillTreeNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  tier: 1 | 2 | 3 | 4;
  pathIndex: number;
  cost: number;
  requires: string[];
  effect: SkillNodeEffect;
}

export interface SkillTreePath {
  name: string;
  color: string;
  icon: string;
  description: string;
  nodes: SkillTreeNode[];
}

export interface SkillTreeDef {
  classId: PlayerClass;
  paths: SkillTreePath[];
}

// ══════════════════════════════════════════════════════════════
// NARRATIVE SKILL SYSTEM (2d6 skill checks)
// ══════════════════════════════════════════════════════════════

export interface CharacterSkills {
  stealth: number;      // Sneak past encounters, pickpocket, eavesdrop (1-20)
  diplomacy: number;    // Negotiate, persuade, de-escalate, barter (1-20)
  athletics: number;    // Physical challenges, chase sequences, endurance (1-20)
  awareness: number;    // Notice hidden things, detect lies, spot ambushes (1-20)
  lore: number;         // Knowledge of dungeon history, monsters, magic (1-20)
  survival: number;     // Track creatures, find food, resist harsh conditions (1-20)
}

export type SkillName = keyof CharacterSkills;

export type SkillCheckOutcome = 'critical_fail' | 'fail' | 'partial' | 'success' | 'critical';

export interface SkillCheck {
  skill: SkillName;
  target: number;               // Need to roll this or higher (typically 7-12)
  criticalTarget?: number;      // Roll this for exceptional success (default 12)
}

export interface SkillCheckResult {
  roll: [number, number];       // The two d6 dice
  modifier: number;             // From skill + gear
  total: number;                // roll[0] + roll[1] + modifier
  outcome: SkillCheckOutcome;
  skill: SkillName;
  target: number;
}

// ══════════════════════════════════════════════════════════════
// STORY / NARRATIVE SYSTEM
// ══════════════════════════════════════════════════════════════

export interface StoryCharacter {
  id: string;
  name: string;
  title: string;
  race: 'goblin' | 'human' | 'undead' | 'demon' | 'elemental' | 'beast';
  role: 'ally' | 'enemy' | 'neutral' | 'wild_card';
  traits: string[];
  motivation: string;
  secret: string;
  appearanceDescription: string;
  portraitUrl?: string;
  char: string;
  color: string;
  introFloorRange: [number, number];
  introDialogue: string;
  relationshipTiers: RelationshipTier[];
  recruitable: boolean;
  recruitmentCondition?: string;
  mercenaryStats?: Partial<Stats>;
  isGenerated?: boolean;
  generatedAt?: string;
}

export interface RelationshipTier {
  id: string;
  threshold: number;
  dialogue: string;
  unlocks?: string[];
}

export type StoryBeatType = 'intro' | 'development' | 'climax' | 'resolution' | 'epilogue';

export interface StoryBeatTrigger {
  type: 'floor' | 'boss_kill' | 'item_pickup' | 'low_hp' | 'shop_visit' | 'death' | 'encounter';
  floorRange?: [number, number];
  bossId?: string;
  probability?: number;
  requiredFlags?: string[];
  excludedFlags?: string[];
}

export interface StoryDialogueChoice {
  id: string;
  label: string;
  responseText: string;
  effects: DialogueEffect[];
  requiresSkill?: { skill: SkillName; minimum: number };
  skillCheck?: SkillCheck;
  successNodeId?: string;
  partialNodeId?: string;
  failureNodeId?: string;
  partialText?: string;
  partialEffects?: DialogueEffect[];
  failureText?: string;
  failureEffects?: DialogueEffect[];
  criticalFailText?: string;
  criticalFailEffects?: DialogueEffect[];
  relationshipChange?: number;
}

export interface StoryDialogueNode {
  id: string;
  speaker: 'character' | 'player' | 'narrator';
  text: string;
  characterId?: string;
  choices?: StoryDialogueChoice[];
  nextNodeId?: string;
}

export interface StoryDialogueTree {
  rootNodeId: string;
  nodes: Record<string, StoryDialogueNode>;
}

export interface NarrativeBeat {
  id: string;
  characterId: string;
  beatType: StoryBeatType;
  trigger: StoryBeatTrigger;
  dialogue: StoryDialogueTree;
  effects: DialogueEffect[];
}

export interface StoryArc {
  id: string;
  name: string;
  primaryCharacterId: string;
  supportingCharacterIds: string[];
  acts: StoryAct[];
  minRunsToComplete: number;
  maxRunsToComplete: number;
  completionRewards: ArcReward[];
  isGenerated?: boolean;
  generatedAt?: string;
}

export interface StoryAct {
  id: string;
  actNumber: 1 | 2 | 3;
  floorRange: [number, number];
  requiredBeatIds: string[];
  optionalBeatIds: string[];
  climaxBeatId: string;
}

export interface ArcReward {
  type: 'trait' | 'item' | 'gold' | 'ally' | 'stat';
  value: string | number;
}

export interface RunStoryState {
  activeArcId: string | null;
  currentAct: number;
  seenBeatIds: string[];
  pendingBeatIds: string[];
  characterEncounters: Record<string, number>;
  runChoices: Record<string, string>;
  relationshipChanges: Record<string, number>;
}

export interface BloodlineStoryData {
  completedArcIds: string[];
  characterRelations: Record<string, number>;
  storyFlags: string[];
  unlockedAllyIds: string[];
  arcProgress: Record<string, { act: number; beatsSeen: string[] }>;
  seenContentIds: string[];
}

// Generated content types (from AI)
export interface GeneratedCharacter extends StoryCharacter {
  isGenerated: true;
  generatedAt: string;
}

export interface GeneratedEncounter {
  id: string;
  generatedAt: string;
  type: 'skill_challenge' | 'hidden_cache' | 'trapped_room' | 'negotiation' | 'chase';
  floorRange: [number, number];
  description: string;
  primarySkill: SkillName;
  alternateSkill?: SkillName;
  target: number;
  successDescription: string;
  successReward: EncounterReward;
  partialDescription?: string;
  partialReward?: EncounterReward;
  failureDescription: string;
  failurePenalty?: EncounterPenalty;
}

export interface EncounterReward {
  type: 'item' | 'gold' | 'heal' | 'info' | 'relationship';
  value: string | number;
  characterId?: string;
}

export interface EncounterPenalty {
  type: 'damage' | 'hunger' | 'relationship' | 'trap';
  value: number;
  characterId?: string;
}

export interface GeneratedItem {
  id: string;
  generatedAt: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description: string;
  flavorText: string;
  statBonus?: Partial<Stats>;
  skillBonus?: Partial<CharacterSkills>;
  specialAbility?: string;
  artDescription: string;
  artUrl?: string;
}

export interface HiddenElement {
  id: string;
  pos: Pos;
  type: 'secret_door' | 'hidden_cache' | 'trap' | 'ambush' | 'shortcut' | 'lore_inscription';
  skill: SkillName;
  threshold: number;
  discovered: boolean;
  description: string;
  reward?: EncounterReward;
}

export interface InteractableElement {
  id: string;
  pos: Pos;
  type: 'locked_door' | 'stuck_mechanism' | 'ancient_puzzle' | 'negotiation' | 'chase';
  primarySkill: SkillName;
  alternateSkill?: SkillName;
  target: number;
  description: string;
  interacted: boolean;
  successEffect: EncounterReward;
  partialEffect?: EncounterReward;
  failureEffect?: EncounterPenalty;
  successHint?: string;
  failureHint?: string;
  /** CDN asset path for pre-baked art (story mode) */
  artAsset?: string;
  /** If true, this is an atmospheric popup (no skill check, just image + text) */
  isAtmospheric?: boolean;
  /** Title for atmospheric popup */
  atmosphericTitle?: string;
}

// Floor content cache for progressive generation
export interface FloorContentBatch {
  floorRange: [number, number];
  characters: StoryCharacter[];
  encounters: GeneratedEncounter[];
  items: GeneratedItem[];
  storyBeats: NarrativeBeat[];
  hiddenElements: HiddenElement[];
  interactables: InteractableElement[];
  mercenaries: MercenaryDef[];
  characterQuests: CharacterQuest[];  // Quests given by AI characters
  enemyEncounters: EnemyEncounterData[];  // Pre-generated enemy encounter dialogues
  isReady: boolean;
  isGenerated: boolean;
}

export interface RunContentCache {
  floors1to3: FloorContentBatch | null;
  floors4to6: FloorContentBatch | null;
  floors7to10: FloorContentBatch | null;
  floors11plus: FloorContentBatch | null;
}

// ══════════════════════════════════════════════════════════════
// QUEST SYSTEM + ECHO TREE (permanent meta-progression)
// ══════════════════════════════════════════════════════════════

// ── Quest objective types ──

export type QuestObjectiveType =
  | 'kill_total'
  | 'kill_monster_type'
  | 'kill_with_class'
  | 'reach_floor'
  | 'reach_level'
  | 'clear_floor_nodamage'
  | 'collect_gold_run'
  | 'deal_damage_run'
  | 'survive_turns'
  | 'defeat_boss'
  | 'defeat_named_boss'
  | 'complete_zone'
  | 'discover_bestiary'
  | 'eat_food'
  | 'eat_named_food'
  | 'use_potions'
  | 'use_named_potion'
  | 'use_scrolls'
  | 'use_ability'
  | 'use_class_ability'
  | 'hire_mercenary'
  | 'buy_from_shop'
  | 'talk_to_npc'
  | 'equip_rarity'
  | 'equip_named_item'
  | 'unlock_traits'
  | 'ancestor_count'
  | 'walk_terrain'
  | 'use_auto_turns'
  | 'use_ranged_attack'
  | 'kill_with_weapon_type'
  | 'spend_skill_points'
  | 'unlock_echo_nodes'
  | 'unlock_echo_path_node';

export interface QuestObjective {
  type: QuestObjectiveType;
  target: number;
  /** Qualifier: monster name, boss name, class ID, zone ID, terrain type, item name, etc. */
  qualifier?: string;
}

export interface QuestTemplateDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  tier: 1 | 2 | 3 | 4 | 5;
  objective: QuestObjective;
  /** Echoes reward */
  reward: number;
  /** Whether progress persists across runs (true) or resets each run (false) */
  persistsAcrossRuns: boolean;
}

// ══════════════════════════════════════════════════════════════
// CHARACTER-SPECIFIC QUESTS (from AI-generated NPCs)
// ══════════════════════════════════════════════════════════════

export type CharacterQuestType =
  | 'kill_enemies'      // Kill X enemies for the character
  | 'reach_floor'       // Reach floor X
  | 'collect_gold'      // Collect X gold
  | 'pass_skill_checks' // Pass X skill checks
  | 'find_item'         // Find a specific item type
  | 'survive_floors';   // Survive X floors without dying

export interface CharacterQuest {
  id: string;
  characterId: string;
  characterName: string;
  characterPortraitUrl?: string;
  name: string;
  description: string;
  flavorText: string;        // Character's personal message about the quest
  questType: CharacterQuestType;
  target: number;
  progress: number;
  isComplete: boolean;
  isClaimed: boolean;
  rewards: {
    relationshipBonus: number;  // Boost to character relationship
    gold?: number;
    echoReward?: number;
    unlockRecruitment?: boolean; // Can recruit character as mercenary
  };
  isGenerated: boolean;
  generatedAt: string;
}

export interface ActiveQuest {
  templateId: string;
  progress: number;
  completed: boolean;
}

// ── Echo Tree (permanent talent tree) ──

export type EchoNodeCategory =
  | 'vitality'
  | 'might'
  | 'agility'
  | 'fortune'
  | 'mastery'
  | 'exploration'
  | 'arcane';

export type EchoNodeEffect =
  | { type: 'stat'; stat: keyof Stats; value: number }
  | { type: 'startingGold'; amount: number }
  | { type: 'startingItem'; itemName: string }
  | { type: 'unlockClass'; classId: PlayerClass }
  | { type: 'unlockZone'; zoneId: ZoneId }
  | { type: 'unlockWeapon'; weaponId: string }
  | { type: 'unlockEnemy'; enemyId: string }
  | { type: 'bonusSkillPoints'; amount: number }
  | { type: 'lootRarityBoost'; percent: number }
  | { type: 'shopDiscount'; percent: number }
  | { type: 'hungerSlowdown'; percent: number }
  | { type: 'terrainResist'; percent: number }
  | { type: 'maxFloorExtend'; floors: number }
  | { type: 'xpBonus'; percent: number }
  | { type: 'hungerMax'; amount: number }
  | { type: 'multi'; effects: EchoNodeEffect[] };

export interface EchoTreeNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: EchoNodeCategory;
  tier: 1 | 2 | 3 | 4 | 5;
  cost: number;
  requires: string[];
  effect: EchoNodeEffect;
}

export interface EchoTreePath {
  name: string;
  color: string;
  icon: string;
  description: string;
  category: EchoNodeCategory;
  nodes: EchoTreeNode[];
}

// ── Persistent quest + echo data ──

export interface RunQuestTracker {
  kills: number;
  monsterKills: Record<string, number>;
  classKills: Record<string, number>;
  bossKills: number;
  bossesDefeated: string[];
  goldEarned: number;
  damageDelt: number;
  turnsSurvived: number;
  foodEaten: number;
  namedFoodEaten: Record<string, number>;
  potionsUsed: number;
  namedPotionsUsed: Record<string, number>;
  scrollsUsed: number;
  abilitiesUsed: number;
  classAbilitiesUsed: Record<string, number>;
  mercenariesHired: number;
  shopPurchases: number;
  npcsTalkedTo: number;
  highestFloor: number;
  highestLevel: number;
  floorsNoDamage: number;
  traitsUnlocked: number;
  terrainSteps: Record<string, number>;
  autoTurns: number;
  rangedAttacks: number;
  weaponTypeKills: Record<string, number>;
  zonesCompleted: string[];
  rarityEquipped: Record<string, boolean>;
  namedItemsEquipped: string[];
  skillPointsSpent: number;
  echoNodesUnlocked: number;
  echoPathNodesUnlocked: Record<string, number>;
}

export interface QuestEchoData {
  version: number;
  echoes: number;
  totalEchoesEarned: number;
  activeQuests: ActiveQuest[];
  completedQuestIds: string[];
  unlockedEchoNodes: string[];
  /** Persistent cross-run counters */
  counters: {
    totalKills: number;
    monsterKills: Record<string, number>;
    classKills: Record<string, number>;
    totalBossKills: number;
    bossesDefeated: string[];
    totalGoldEarned: number;
    totalFoodEaten: number;
    namedFoodEaten: Record<string, number>;
    totalPotionsUsed: number;
    namedPotionsUsed: Record<string, number>;
    totalScrollsUsed: number;
    totalAbilitiesUsed: number;
    classAbilitiesUsed: Record<string, number>;
    totalMercenariesHired: number;
    totalShopPurchases: number;
    totalNpcsTalkedTo: number;
    totalBestiaryEntries: number;
    totalTraitsUnlocked: number;
    totalAncestors: number;
    terrainSteps: Record<string, number>;
    totalAutoTurns: number;
    totalRangedAttacks: number;
    weaponTypeKills: Record<string, number>;
    zonesCompleted: string[];
    highestFloor: number;
    highestLevel: number;
    highestGoldSingleRun: number;
    highestDamageSingleRun: number;
    highestTurnsSingleRun: number;
    floorsNoDamage: number;
    rarityEquipped: Record<string, boolean>;
    namedItemsEquipped: string[];
    totalSkillPointsSpent: number;
    totalEchoNodesUnlocked: number;
    echoPathNodesUnlocked: Record<string, number>;
  };
}

// ══════════════════════════════════════════════════════════════
// LEGACY GEAR SYSTEM
// ══════════════════════════════════════════════════════════════

/** Per-class Legacy Gear data persisted across runs */
export interface LegacyGearData {
  classId: PlayerClass;
  level: number;          // 1-20
  shardsInvested: number; // total shards spent on this gear
  earned: boolean;        // whether the player has earned this gear
}

/** Persistent Legacy system data (saved alongside bloodline) */
export interface LegacySystemData {
  version: number;
  essenceShards: number;          // current shard balance (shared currency)
  totalShardsEarned: number;      // lifetime shards earned
  gear: LegacyGearData[];         // per-class gear entries
}

/** A single level threshold for a legacy gear piece */
export interface LegacyGearLevel {
  level: number;
  shardCost: number;
  statBonus: Partial<Stats>;
  abilityUnlock?: string;  // ability ID unlocked at this level
  name: string;            // gear name at this level
  color: string;           // display color at this level
}

/** Full definition of a class's legacy gear */
export interface LegacyGearDef {
  classId: PlayerClass;
  gearType: string;       // e.g. 'Shield', 'Dagger', 'Orb', 'Bow', 'Chain'
  icon: string;
  levels: LegacyGearLevel[];
}

// ══════════════════════════════════════════════════════════════
// FACTION SYSTEM (meta-persistent reputation with creature types)
// ══════════════════════════════════════════════════════════════

export type FactionId = 'goblin' | 'undead' | 'demon' | 'beast' | 'elemental';

export interface FactionReputation {
  factionId: FactionId;
  reputation: number;      // -100 (hated) to +100 (revered)
  encountered: number;     // total creatures met
  killed: number;          // total killed
  befriended: number;      // peaceful resolutions
  transformations: number; // times fully transformed into this faction
}

export type FactionTierName = 'despised' | 'hostile' | 'neutral' | 'friendly' | 'honored' | 'exalted';

export interface FactionTierEffect {
  type: 'damage_taken' | 'damage_dealt' | 'dialogue_chance' | 'help_chance' | 
        'transformation_available' | 'boss_alternative' | 'telepathy';
  value: number;
  description: string;
}

export interface FactionTier {
  id: FactionTierName;
  minRep: number;
  maxRep: number;
  name: string;
  color: string;
  effects: FactionTierEffect[];
}

export interface FactionDef {
  id: FactionId;
  name: string;
  description: string;
  color: string;
  icon: string;
  creatureKeywords: string[];  // Keywords to match creature names
  tiers: FactionTier[];
  afflictionId?: string;       // Transformation affliction for this faction
  bossName?: string;           // Boss associated with this faction
}

// ══════════════════════════════════════════════════════════════
// AFFLICTION SYSTEM (per-run transformations)
// ══════════════════════════════════════════════════════════════

export type AfflictionTrigger = 'bite' | 'dialogue' | 'item' | 'boss_defeat' | 'reputation' | 'room_event';

export interface AfflictionRestriction {
  type: 'food' | 'equipment' | 'terrain' | 'action';
  blocked: string[];           // Item/terrain/action names that are blocked
  description: string;         // Flavor text for why it's blocked
}

export interface PerceptionChange {
  type: 'color_shift' | 'description_replace' | 'beauty_in_darkness' | 'see_hidden';
  original?: string;           // For replacements: original text/color
  replacement?: string;        // For replacements: new text/color
  intensity: number;           // 0-1, affects probability/strength
}

export interface AfflictionAbility {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  cooldown: number;
  effect: 'speak_faction' | 'sense_faction' | 'command_faction' | 'faction_form';
  factionId: FactionId;
}

export interface AfflictionStage {
  id: string;                  // 'bitten', 'infected', 'changing', 'transformed'
  name: string;
  description: string;
  floorsToProgress: number;    // Floors until next stage (-1 = permanent/final)
  canCure: boolean;
  cureItem?: string;           // Item that can cure at this stage
  
  // Stat effects
  statModifiers: Partial<Stats>;
  
  // Abilities unlocked at this stage
  abilities?: string[];
  
  // Restrictions
  restrictions?: AfflictionRestriction[];
  
  // Perception changes
  perceptionChanges?: PerceptionChange[];
  
  // Narrative messages shown during this stage
  progressMessages: string[];
  stageEnterMessage: string;
}

export interface AfflictionDef {
  id: string;                  // 'were_goblin', 'vampiric', 'demonic_pact', 'lycanthropy'
  factionId: FactionId;
  name: string;
  description: string;
  icon: string;
  color: string;
  triggerConditions: AfflictionTrigger[];
  stages: AfflictionStage[];
  transformedClassSuffix?: string;  // e.g., 'Goblin' -> 'Goblin-Warrior'
  telepathicLink?: {
    factionId: FactionId;
    damageShare: number;       // 0.1 = take 10% of damage dealt to faction creatures
  };
}

export interface ActiveAffliction {
  afflictionId: string;
  currentStage: number;        // Index into stages array
  floorsInStage: number;       // Floors spent in current stage
  totalFloors: number;         // Total floors with this affliction
  cured: boolean;              // If cured, affliction is inactive but tracked
  triggeredBy: AfflictionTrigger;
}

// ══════════════════════════════════════════════════════════════
// TRANSFORMED CLASS SYSTEM
// ══════════════════════════════════════════════════════════════

export interface TransformedClassDef {
  id: string;                  // 'goblin_warrior', 'vampire_mage', etc.
  baseClassId: PlayerClass;    // Original class that was mutated
  afflictionId: string;        // Which affliction caused this
  name: string;                // 'Goblin-Warrior', 'Vampire Mage'
  char: string;
  color: string;
  description: string;
  
  // Stats are base class stats + affliction modifiers
  bonusStats: Partial<Stats>;
  
  // Unique abilities for transformed class
  abilities: AfflictionAbility[];
  
  // Passive effects
  passives: {
    name: string;
    description: string;
  }[];
  
  // Perception overrides (always active while transformed)
  perceptionOverrides: PerceptionChange[];
  
  // Telepathic link with faction
  telepathicLink?: {
    factionId: FactionId;
    damageShare: number;
  };
}

// ══════════════════════════════════════════════════════════════
// ALTERNATIVE BOSS ENCOUNTERS
// ══════════════════════════════════════════════════════════════

export type AlternativeBossType = 'election' | 'ritual' | 'trial' | 'bargain' | 'coronation';

export interface AlternativeBossOutcome {
  id: string;
  name: string;
  description: string;
  conditions: {
    type: 'choice' | 'reputation' | 'votes' | 'item';
    value: string | number;
  }[];
  rewards: {
    type: 'class_transform' | 'item' | 'ability' | 'faction_control' | 'reputation';
    value: string | number;
  }[];
  narrativeText: string;
}

export interface AlternativeBossEncounter {
  bossName: string;
  requiredFaction: FactionId;
  minReputation: number;
  encounterType: AlternativeBossType;
  title: string;               // "The Goblin Election", "The Dark Ritual"
  description: string;
  dialogue: StoryDialogueTree;
  outcomes: AlternativeBossOutcome[];
}

// ══════════════════════════════════════════════════════════════
// ROOM EVENT SYSTEM
// Random narrative encounters when entering rooms
// ══════════════════════════════════════════════════════════════

export type RoomEventType = 
  | 'trap_chamber'      // Athletics/Awareness - avoid traps, find loot
  | 'ancient_altar'     // Lore - blessings or curses
  | 'lurking_horror'    // Stealth - ambush or be ambushed
  | 'merchant_spirit'   // Diplomacy - special vendor
  | 'secret_passage'    // Awareness - hidden areas
  | 'cursed_artifact'   // Lore - powerful item or transformation
  | 'monster_nest'      // Survival - clear nest or spawn swarm
  | 'ritual_circle'     // Lore/Diplomacy - voluntary transformation
  | 'treasure_vault'    // Athletics - physical challenge for loot
  | 'wandering_soul'    // Diplomacy - quest or boon
  | 'collapsing_floor'  // Athletics - escape or fall
  | 'mystic_fountain';  // Lore - buff or debuff

export type RoomEventEffectType = 
  | 'damage'            // Take HP damage
  | 'heal'              // Restore HP
  | 'gold'              // Gain/lose gold
  | 'item'              // Gain item
  | 'lose_item'         // Lose random item
  | 'spawn_enemy'       // Spawn monster(s)
  | 'spawn_elite'       // Spawn elite/hard monster
  | 'stat_buff'         // Temporary stat boost
  | 'stat_debuff'       // Temporary stat reduction
  | 'transformation'    // Apply transformation affliction
  | 'curse'             // Apply curse (negative status)
  | 'blessing'          // Apply blessing (positive status)
  | 'reveal_secret'     // Reveal hidden passage/room
  | 'open_vendor'       // Open special merchant
  | 'skill_bonus'       // Permanent skill increase
  | 'teleport';         // Move to random location

export interface RoomEventEffect {
  type: RoomEventEffectType;
  value?: number;                   // Amount (damage, gold, etc.)
  target?: string;                  // Item name, enemy type, skill name, etc.
  duration?: number;                // Floors for temporary effects
  message?: string;                 // Custom message to display
}

export interface RoomEventOutcome {
  description: string;              // Narrative text
  effects: RoomEventEffect[];
}

export interface RoomEventDef {
  id: string;
  type: RoomEventType;
  name: string;
  description: string;              // What the player sees
  artPrompt: string;                // For AI image generation
  artAsset?: string;                // CDN asset path for pre-baked art (story mode)
  primarySkill: SkillName;
  alternateSkill?: SkillName;
  baseDifficulty: number;           // Target for skill check (7-15)
  minFloor: number;                 // Earliest floor this can appear
  maxFloor?: number;                // Latest floor (undefined = any)
  factionId?: FactionId;            // Faction this event is themed for
  
  // Outcomes based on skill check result
  criticalSuccess: RoomEventOutcome;
  success: RoomEventOutcome;
  partial: RoomEventOutcome;
  failure: RoomEventOutcome;
  criticalFailure: RoomEventOutcome;
}

export interface ActiveRoomEvent {
  eventId: string;
  event: RoomEventDef;
  roomId: string;
  artUrl?: string;                  // Generated pixel art
  resolved: boolean;
}

export interface RoomEventBuff {
  id: string;
  name: string;
  description: string;
  statModifiers: Partial<Stats>;
  floorsRemaining: number;
  isDebuff: boolean;
}
