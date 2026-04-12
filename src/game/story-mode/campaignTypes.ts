import type {
  PlayerClass, ZoneId, Stats, ItemRarity, Element,
  BossAbility, DialogueNode, SkillName,
  RoomEventType, RoomEventOutcome,
} from '../types';

// ══════════════════════════════════════════════════════════════
// CAMPAIGN SAVE — persisted across sessions
// ══════════════════════════════════════════════════════════════

export interface CampaignSave {
  version: number;
  currentChapter: string;
  currentFloor: number;
  /** Serialized GameState snapshot taken at last checkpoint */
  checkpointState: string | null;
  playerClass: PlayerClass;
  playerRace?: string;
  playerLevel: number;
  completedChapters: string[];
  /** Tracks story choices the player made (key = choiceId, value = optionId) */
  storyFlags: Record<string, string>;
  npcRelationships: Record<string, number>;
  /** Gold carried between chapters */
  gold: number;
  /** Persistent inventory serialized as JSON */
  inventoryJson: string;
  /** Persistent equipment serialized as JSON */
  equipmentJson: string;
  /** Skill tree nodes unlocked */
  unlockedNodes: string[];
  skillPoints: number;
  /** Total play time in seconds */
  totalPlayTime: number;
}

export const CAMPAIGN_SAVE_VERSION = 1;

export function createEmptyCampaignSave(playerClass: PlayerClass, playerRace?: string): CampaignSave {
  return {
    version: CAMPAIGN_SAVE_VERSION,
    currentChapter: 'ch1_the_descent',
    currentFloor: 1,
    checkpointState: null,
    playerClass,
    playerRace,
    playerLevel: 1,
    completedChapters: [],
    storyFlags: {},
    npcRelationships: {},
    gold: 0,
    inventoryJson: '[]',
    equipmentJson: '{}',
    unlockedNodes: [],
    skillPoints: 0,
    totalPlayTime: 0,
  };
}

// ══════════════════════════════════════════════════════════════
// CHAPTER DEFINITIONS — static, baked into the build
// ══════════════════════════════════════════════════════════════

export interface ChapterDef {
  id: string;
  name: string;
  description: string;
  /** Thematic color for the chapter (used in UI) */
  color: string;
  icon: string;
  floors: StoryFloorDef[];
  boss: StoryBossDef;
  /** Chapter IDs that must be completed first */
  requiredChapters: string[];
  rewards: ChapterReward[];
}

export interface NarrativeSlide {
  text: string;
  /** CDN asset path for scene art */
  artAsset?: string;
  /** Optional title shown above the text */
  title?: string;
}

export interface StoryFloorDef {
  floorIndex: number;
  zone: ZoneId;
  encounters: PrebakedEncounter[];
  npcs: PrebakedNPC[];
  roomEvents: PrebakedRoomEvent[];
  monsters: PrebakedMonsterSpawn[];
  items: PrebakedItemSpawn[];
  /** Whether a checkpoint save is created when entering this floor */
  hasCheckpoint: boolean;
  /** Narrative slides shown when entering this floor (replaces single narrativeIntro) */
  introSlides?: NarrativeSlide[];
  /** Ambient messages that appear in the message log as the player explores */
  roomMessages?: string[];
}

// ── Pre-baked content types ──

export interface PrebakedEncounter {
  id: string;
  type: 'skill_challenge' | 'hidden_cache' | 'trapped_room' | 'negotiation' | 'chase';
  description: string;
  primarySkill: SkillName;
  alternateSkill?: SkillName;
  target: number;
  successDescription: string;
  successReward: { type: 'item' | 'gold' | 'heal'; value: string | number };
  failureDescription: string;
  failurePenalty?: { type: 'damage' | 'hunger'; value: number };
  /** CDN asset path for encounter scene art */
  artAsset?: string;
}

export interface PrebakedNPC {
  id: string;
  name: string;
  char: string;
  color: string;
  dialogue: DialogueNode;
  /** CDN asset path for NPC portrait (e.g. 'story/gristle.png') */
  portraitAsset?: string;
  /** Story flag set when the player talks to this NPC */
  setsFlag?: { key: string; value: string };
  /** Only show this NPC if this flag is set */
  requiresFlag?: { key: string; value: string };
}

export interface PrebakedRoomEvent {
  id: string;
  type: RoomEventType;
  name: string;
  description: string;
  primarySkill: SkillName;
  alternateSkill?: SkillName;
  baseDifficulty: number;
  criticalSuccess: RoomEventOutcome;
  success: RoomEventOutcome;
  partial: RoomEventOutcome;
  failure: RoomEventOutcome;
  criticalFailure: RoomEventOutcome;
  /** CDN asset path for room event scene art */
  artAsset?: string;
}

export interface PrebakedMonsterSpawn {
  name: string;
  char: string;
  color: string;
  stats: Stats;
  xpValue: number;
  lootChance: number;
  isBoss?: boolean;
  bossAbility?: BossAbility;
  element?: Element;
  /** How many of this monster to spawn */
  count: number;
  /** Message shown in the log when this monster is killed (mini-boss flavor) */
  defeatMessage?: string;
}

export interface PrebakedItemSpawn {
  name: string;
  type: 'weapon' | 'armor' | 'ring' | 'amulet' | 'offhand' | 'potion' | 'scroll' | 'food';
  char: string;
  color: string;
  value: number;
  rarity?: ItemRarity;
  description: string;
  statBonus?: Partial<Stats>;
  equipSlot?: 'weapon' | 'armor' | 'ring' | 'amulet' | 'offhand';
  onHitEffect?: import('../types').ItemEffect;
  /** How many to place on this floor */
  count: number;
}

export interface StoryBossDef {
  name: string;
  title: string;
  char: string;
  color: string;
  stats: Stats;
  xpValue: number;
  bossAbility: BossAbility;
  element?: Element;
  /** Dialogue shown before the boss fight */
  introDialogue: string;
  /** Dialogue shown after defeating the boss */
  defeatDialogue: string;
  /** CDN asset path for boss portrait */
  portraitAsset?: string;
}

export interface ChapterReward {
  type: 'item' | 'gold' | 'skill_points' | 'unlock_chapter';
  value: string | number;
  description: string;
}
