import { useState, useCallback, useEffect, useRef } from 'react';
import { initProfiler } from './profiler';
import { createPortal } from 'react-dom';
import { cloneState, gpStart, gpEnd, gpTime } from './utils';
import type { CSSProperties } from 'react';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { getVariant, trackExposure, forceVariant, getNarrativeExperimentInfo } from './abTesting';
import type { GameState, PlayerClass, BloodlineData, AncestorRecord, TraitDef, ZoneId, TutorialStepId } from './types';
import { TutorialBar, TUTORIAL_STEPS } from './TutorialBar';
import { newGame, waitTurn, movePlayer, isAtShop, extractCauseOfDeath, extractKillingBlowDamage, updateFOV, rageStrike, getWarriorRage, sacredVow, getPaladinVow, isPaladinVowActive, shadowStep, getRogueShadowCooldown, arcaneBlast, getMageBlastCooldown, huntersMark, getRangerMark, summonSkeleton, getNecroSkeletons, addMessage, useGeneratedAbility, getGeneratedClassInfo } from './engine';
import { CLASS_DEFS, getHellbornClass } from './constants';
import { createDefaultBloodline, mergeRunIntoBloodline, checkForNewTraits, generateAncestorName, computeBloodlineBonuses } from './traits';
import { GameView } from './GameView';
import { HUD } from './HUD';
import { MessageLog } from './MessageLog';
import { Inventory } from './Inventory';
import { DPad } from './DPad';
import { Shop } from './Shop';
import { NPCDialogue } from './NPCDialogue';
import { BloodlineView } from './BloodlineView';
import { MercenaryHire } from './MercenaryHire';
import { autoplayStep } from './autoplay';
import { Leaderboard } from './Leaderboard';
import { NecropolisView } from './NecropolisView';
import { Bestiary } from './Bestiary';
import { useCdnImage } from './useCdnImage';
import { useMusic } from './useMusic';
import { RunHistory } from './RunHistory';
import { Tips } from './Tips';
import { BugReport } from './BugReport';
import { CharacterInfo } from './CharacterInfo';
import { FeatureTutorial, RANGED_CLASS_TUTORIAL } from './FeatureTutorial';
import { AbilityChoice } from './AbilityChoice';
import { SkillTreeView } from './SkillTreeView';
import { getNecropolisClasses } from './necropolis';
import { reportDeath, reportKills, getNecropolisState, connectToNecropolis, setLocalDeathFloor, setLocalKillsFloor } from './necropolisService';
import { ZONE_DEFS, isZoneUnlocked } from './zones';
import type { QuestEchoData, RunQuestTracker } from './types';
import { createDefaultQuestEchoData, fillQuestSlots, updateQuestProgress, mergeRunIntoCounters, claimQuest, patchQuestEchoData, getQuestTemplate } from './quests';
import { computeEchoBonuses, canUnlockEchoNode, getEchoNode, getEchoNodePathName, getEchoNodeCount } from './echoTree';
import { setEchoUnlockedNodes } from './entities';
import { QuestLog } from './QuestLog';
import { EchoTreeView } from './EchoTreeView';
import { Journal } from './Journal';
import { StoryJournal } from './StoryJournal';
import { ContentSeeder } from './ContentSeeder';
import { ensureLegacyData, addEssenceShards, getGearForClass, LEGACY_GEAR_DEFS } from './legacyGear';
import { LegacyGearView } from './LegacyGearView';
import { getNewLoreIds, ALL_LORE } from './lore';
import { GenerationLoadingScreen } from './GenerationLoadingScreen';
import { StoryDialogue, type DialogueResult } from './StoryDialogue';
import { GenerativeClassSelect } from './GenerativeClassSelect';
import type { GeneratedClass } from './generativeClass';
import { SkillCheckModal } from './SkillCheckModal';
import {
  prepareRunContent,
  findCharacterById,
  handleDialogueComplete,
  getStoryBeatsForFloor,
  getContentCache,
  updateCharacterQuestProgress,
  claimCharacterQuestReward,
  generateEnemyEncounter,
  generateEnemyPortraitFromPrompt,
  generateRoomEventArt,
  generateSkillCheckArt,
  preloadImage,
  getEnemyEncounter,
  grantBoon,
} from './story';
import { RoomEventModal } from './RoomEventModal';
import { addRoomEventBuff, getRoomEventArtFromCache, cacheRoomEventArt, startBackgroundArtGeneration } from './roomEvents';
import type { StoryCharacter, StoryDialogueTree, NarrativeBeat, InteractableElement, SkillCheckResult, CharacterBoon, BoonEffectType } from './types';
import type { LoreContext } from './lore';
import { buildRunTracker } from './engine';
import type { RunHistoryEntry, BestiaryEntry } from './types';
import {
  trackGameOpened, trackClassSelected, trackZoneSelected,
  trackFloorReached, trackPlayerDeath, trackSecondRun,
  trackPremiumPurchased, trackNecropolisOpened, trackBestiaryOpened,
  trackBloodlineOpened, setupSessionTracking, updateSessionContext, updateSessionMetaContext,
  trackAutoModeToggled, trackOfferShown, trackOfferClicked, trackOfferDismissed,
  trackAbilityUsed, trackDeathScreenAction,
  trackQuestClaimed, trackEchoNodeUnlocked, trackQuestLogOpened,
  trackEchoTreeOpened, trackQuestRunSummary, trackQuestCompleted,
  trackPlayerIdentity, trackGameModeStart,
} from './analytics';
import { updateErrorContext, reportError, safeEngineCall } from './errorReporting';
import { safeSetItem, safeGetItem, safeGetProfile } from './safeStorage';
import { trackAttribution } from './attribution';
import { startAffliction, getAfflictionForFaction } from './afflictions';
import { getFactionForCreature, modifyFactionReputation, REPUTATION_CHANGES, canTransformIntoFaction, FACTION_DEFS } from './factions';
import type { FactionId } from './types';
import { ElderGuide, markElderTipSeen } from './ElderGuide';
import { WhatsNew, BUILD_VERSION } from './WhatsNew';
import {
  ELDER_WELCOME, ELDER_HUNGER, ELDER_SHOP, ELDER_MERCENARY,
  ELDER_NPC, ELDER_BOSS, ELDER_STATUS, ELDER_DEATH, ELDER_AUTO_MODE, ELDER_EXPLORE_MODE, ELDER_RAGE_INTRO, ELDER_SKILL_TREE,
  ELDER_TUTORIAL_COMPLETE, ELDER_ROGUE_UNLOCK, ELDER_ROGUE_FIRST_SELECT,
  ELDER_PALADIN_UNLOCK, ELDER_PALADIN_FIRST_SELECT,
  ELDER_LEGACY_SHARD, ELDER_SKILL_CHECK, ELDER_STORY_CHARACTER,
  ALL_ELDER_KEYS,
} from './elderTips';
import type { ElderTip } from './elderTips';

// Fallback portraits for enemy encounters based on enemy type keywords
const ENEMY_PORTRAIT_FALLBACKS: Record<string, string> = {
  goblin: '/cdn-assets/portraits/goblin.jpg',
  skeleton: '/cdn-assets/portraits/skeleton.jpg',
  zombie: '/cdn-assets/portraits/undead.jpg',
  undead: '/cdn-assets/portraits/undead.jpg',
  ghost: '/cdn-assets/portraits/ghost.jpg',
  spider: '/cdn-assets/portraits/spider.jpg',
  rat: '/cdn-assets/portraits/rat.jpg',
  bat: '/cdn-assets/portraits/bat.jpg',
  demon: '/cdn-assets/portraits/demon.jpg',
  imp: '/cdn-assets/portraits/demon.jpg',
  slug: '/cdn-assets/portraits/slug.jpg',
  slime: '/cdn-assets/portraits/slime.jpg',
  orc: '/cdn-assets/portraits/orc.jpg',
  wolf: '/cdn-assets/portraits/wolf.jpg',
  shade: '/cdn-assets/portraits/shade.jpg',
  wraith: '/cdn-assets/portraits/wraith.jpg',
  default: '/cdn-assets/portraits/unknown.jpg',
};

function getFallbackEnemyPortrait(enemyName: string): string | undefined {
  const nameLower = enemyName.toLowerCase();
  for (const [keyword, url] of Object.entries(ENEMY_PORTRAIT_FALLBACKS)) {
    if (keyword !== 'default' && nameLower.includes(keyword)) {
      return url;
    }
  }
  return ENEMY_PORTRAIT_FALLBACKS['default'];
}

type Screen = 'title' | 'classSelect' | 'zoneSelect' | 'game' | 'gameover' | 'generativeClassSelect';

interface StatGain {
  label: string;
  before: number;
  after: number;
}

interface DeathInfo {
  ancestor: AncestorRecord;
  newTraits: TraitDef[];
  generation: number;
  statGains: StatGain[];
  goldGain: number;
  hungerGain: number;
  isFirstDeath: boolean;
  isSecondDeath: boolean;
}

function buildDeathParams(gs: GameState, duration: number, generation: number, isAutoPlay: boolean) {
  const eq = gs.player.equipment;
  return {
    playerClass: gs.playerClass, zone: gs.zone,
    floor: gs.floorNumber, level: gs.player.level,
    score: gs.score, kills: gs.runStats.kills,
    causeOfDeath: extractCauseOfDeath(gs),
    generation, duration,
    autoModeActive: isAutoPlay,
    hp: gs.player.stats.hp,
    maxHp: gs.player.stats.maxHp,
    equippedWeapon: eq.weapon?.name ?? 'none',
    equippedArmor: eq.armor?.name ?? 'none',
    equippedOffhand: eq.offhand?.name ?? 'none',
    equippedRing: eq.ring?.name ?? 'none',
    equippedAmulet: eq.amulet?.name ?? 'none',
    killingBlowDamage: extractKillingBlowDamage(gs),
    // Skill & consumable stats
    skillPointsSpent: gs.unlockedNodes.length,
    skillPointsUnspent: gs.skillPoints,
    potionsUsed: gs.runStats.potionsUsed,
    foodEaten: gs.runStats.foodEaten,
    scrollsUsed: gs.runStats.scrollsUsed,
  };
}

export function Game() {
  const titleBgUrl = useCdnImage('title-bg.jpg');
  const elderGuideUrl = useCdnImage('guide.jpg');
  const premiumBannerUrl = useCdnImage('premium-banner.jpg');
  const moreMenuBgUrl = useCdnImage('more-menu-bg.jpg');
  const moreContentBgUrl = useCdnImage('more-content-bg.jpg');
  const classSelectBgUrl = useCdnImage('class-select-bg.jpg');
  const classPortraits: Record<string, string | null> = {
    warrior: useCdnImage('warrior-portrait.jpg'),
    'warrior-damaged': useCdnImage('warrior-damaged.jpg'),
    mage: useCdnImage('mage-portrait.jpg'),
    'mage-damaged': useCdnImage('mage-damaged.jpg'),
    paladin: useCdnImage('paladin-portrait.jpg'),
    'paladin-damaged': useCdnImage('paladin-damaged.jpg'),
    rogue: useCdnImage('rogue-portrait.jpg'),
    'rogue-damaged': useCdnImage('rogue-damaged.jpg'),
    ranger: useCdnImage('ranger-portrait.jpg'),
    'ranger-damaged': useCdnImage('ranger-damaged.jpg'),
    hellborn: useCdnImage('hellborn-portrait.jpg'),
    'hellborn-damaged': useCdnImage('hellborn-damaged.jpg'),
    necromancer: useCdnImage('necromancer-thumb.png'),
    'necromancer-fullscreen': useCdnImage('necromancer-fullscreen.png'),
    revenant: useCdnImage('necromancer-thumb.png'),
  };
  const classBorderColors: Record<string, string> = {
    warrior: '#ff6644', mage: '#8855ff', paladin: '#ffd700',
    rogue: '#ffcc33', ranger: '#33cc66', hellborn: '#ff2200',
    necromancer: '#aa44dd', revenant: '#ff4444',
  };
  const { muted, toggleMute, onUserInteraction } = useMusic('soundtrack.mp3');
  const [screen, setScreen] = useState<Screen>('title');
  const [state, setState] = useState<GameState | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const [autoSellRarities, setAutoSellRarities] = useState<import('./types').ItemRarity[]>([]);
  const [autoSellConsumables, setAutoSellConsumables] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showNPCDialogue, setShowNPCDialogue] = useState(false);
  const [showMercHire, setShowMercHire] = useState(false);
  const [showBloodline, setShowBloodline] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  // 'full' = auto-play everything including combat; 'explore' = pause when enemies are visible
  const [autoPlayMode, setAutoPlayMode] = useState<'full' | 'explore'>('full');
  // Seeder mode: trigger all enemy encounters and auto-select choices to generate content
  const [autoPlaySeederMode, setAutoPlaySeederMode] = useState(false);
  // Track if we're waiting for an encounter to complete in seeder mode
  const seederEncounterPendingRef = useRef(false);
  // Allow auto-play to continue when tab is in background
  const [runInBackground, setRunInBackground] = useState(false);
  const runInBackgroundRef = useRef(runInBackground);
  useEffect(() => { runInBackgroundRef.current = runInBackground; }, [runInBackground]);
  // Tracks tab visibility — toggled so the auto-play effect re-runs and restarts the worker
  const [tabVisible, setTabVisible] = useState(true);
  // Tutorial bar — only shown on the very first run (generation === 0, tutorialComplete !== true)
  const [tutorialSteps, setTutorialSteps] = useState<TutorialStepId[]>([]);
  const prevRunStatsRef = useRef<{ kills: number; itemsFound: number; potionsUsed: number; foodEaten: number; scrollsUsed: number } | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showNecropolis, setShowNecropolis] = useState(false);
  const [showBestiary, setShowBestiary] = useState(false);
  const [showRunHistory, setShowRunHistory] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);
  const [showContentSeeder, setShowContentSeeder] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showCharInfo, setShowCharInfo] = useState(false);
  const [showSkillTree, setShowSkillTree] = useState(false);
  const [showLegacyGear, setShowLegacyGear] = useState(false);
  const [bestFloor, setBestFloor] = useState(1);
  const [bloodline, setBloodline] = useState<BloodlineData>(createDefaultBloodline());
  const [deathInfo, setDeathInfo] = useState<DeathInfo | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isFirstTimeBuyer, setIsFirstTimeBuyer] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasAutoSave, setHasAutoSave] = useState(false);
  const [necropolisUnlocked, setNecropolisUnlocked] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  // DEBUG: secret debug mode — tap subtitle 5 times to toggle
  const [debugMode, setDebugMode] = useState(false);
  const debugTapRef = useRef<number[]>([]);
  const necroTapRef = useRef<number[]>([]);
  const [selectedClass, setSelectedClass] = useState<PlayerClass>('warrior');
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [unlockInfoClass, setUnlockInfoClass] = useState<string | null>(null);
  const [showClassDetail, setShowClassDetail] = useState<PlayerClass | null>(null);
  const [, setActiveGeneratedClass] = useState<GeneratedClass | null>(null);
  const [savedGeneratedClasses, setSavedGeneratedClasses] = useState<GeneratedClass[]>([]);
  const startTimeRef = useRef(0);
  const scoreTokenRef = useRef<string | null>(null);
  const lastScoreSubmitRef = useRef(0);
  const pixelTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const workerRef = useRef<Worker | null>(null);
  // Elder guide tips
  const [activeElderTip, setActiveElderTip] = useState<ElderTip | null>(null);
  const elderSeenRef = useRef<Set<string>>(new Set());
  const [showAddToHome, setShowAddToHome] = useState(false);
  const [showAddToHomeConfirm, setShowAddToHomeConfirm] = useState(false);
  const [showPaladinUnlock, setShowPaladinUnlock] = useState(false);
  const [showPaladinUnlockConfirm, setShowPaladinUnlockConfirm] = useState(false);
  const bloodlineRef = useRef<BloodlineData>(createDefaultBloodline());
  const stateRef = useRef<GameState | null>(null);
  const screenRef = useRef<Screen>('title');
  // Ranged class tutorial — shown once when first starting a game with a ranged class
  const [showRangedTutorial, setShowRangedTutorial] = useState(false);
  // Combat VFX — screen shake + color flash
  const [combatEffect, setCombatEffect] = useState<'hit' | 'hurt' | null>(null);
  const prevMsgCountRef = useRef(0);
  // Quest + Echo Tree system
  const [questEchoData, setQuestEchoData] = useState<QuestEchoData>(createDefaultQuestEchoData());
  const questEchoRef = useRef<QuestEchoData>(createDefaultQuestEchoData());
  const [showQuestLog, setShowQuestLog] = useState(false);
  const [showEchoTree, setShowEchoTree] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showStoryJournal, setShowStoryJournal] = useState(false);
  const [pendingLorePopup, setPendingLorePopup] = useState<string | null>(null);
  // Extra quest tracking counters (not in runStats)
  const questExtraRef = useRef<Partial<RunQuestTracker>>({});
  // First-session auto-start: skip title/class/zone for brand-new players
  const autoStartRef = useRef(false);
  // Story system state
  const [showGenerationLoading, setShowGenerationLoading] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('Preparing your story...');
  const [showStoryDialogue, setShowStoryDialogue] = useState(false);
  const [storyCharacter, setStoryCharacter] = useState<StoryCharacter | null>(null);
  const [storyDialogueTree, setStoryDialogueTree] = useState<StoryDialogueTree | null>(null);
  const [pendingBeatId, setPendingBeatId] = useState<string | null>(null);
  // Encounter/skill check state
  const [pendingEncounter, setPendingEncounter] = useState<InteractableElement | null>(null);
  const [showSkillCheck, setShowSkillCheck] = useState(false);
  const [skillCheckArtUrl, setSkillCheckArtUrl] = useState<string | null>(null);
  // Enemy encounter dialogue state (attack/communicate/steal/observe choices)
  const [showEnemyEncounter, setShowEnemyEncounter] = useState(false);
  const [enemyEncounterData, setEnemyEncounterData] = useState<import('./types').EnemyEncounterData | null>(null);
  const [pendingEnemyId, setPendingEnemyId] = useState<string | null>(null);
  const [isGeneratingEnemyEncounter, setIsGeneratingEnemyEncounter] = useState(false);
  const [encounterGenStage, setEncounterGenStage] = useState<'dialogue' | 'portrait' | 'loading'>('dialogue');
  
  // Room event state
  const [showRoomEvent, setShowRoomEvent] = useState(false);
  const [isGeneratingRoomEventArt, setIsGeneratingRoomEventArt] = useState(false);
  
  // Reputation-based transformation offer
  const [pendingReputationTransform, setPendingReputationTransform] = useState<FactionId | null>(null);
  const [offeredTransformFactions, setOfferedTransformFactions] = useState<Set<FactionId>>(new Set());

  // Keep refs in sync
  useEffect(() => {
    bloodlineRef.current = bloodline;
  }, [bloodline]);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  
  // Track character quest progress when game state changes
  const prevKillsRef = useRef(0);
  const prevFloorRef = useRef(1);
  const prevGoldRef = useRef(0);
  useEffect(() => {
    if (!state) return;
    
    // Track kills
    if (state.runStats.kills > prevKillsRef.current) {
      const newKills = state.runStats.kills - prevKillsRef.current;
      for (let i = 0; i < newKills; i++) {
        updateCharacterQuestProgress(state, { type: 'kill' });
      }
      prevKillsRef.current = state.runStats.kills;
    }
    
    // Track floors
    if (state.floorNumber > prevFloorRef.current) {
      updateCharacterQuestProgress(state, { type: 'floor_reached', value: state.floorNumber });
      updateCharacterQuestProgress(state, { type: 'floor_survived' });
      prevFloorRef.current = state.floorNumber;
    }
    
    // Track gold collected (gold is tracked as score in this game)
    if (state.score > prevGoldRef.current) {
      const goldCollected = state.score - prevGoldRef.current;
      updateCharacterQuestProgress(state, { type: 'gold_collected', value: goldCollected });
      prevGoldRef.current = state.score;
    }
  }, [state?.runStats.kills, state?.floorNumber, state?.score]);
  
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);
  useEffect(() => {
    questEchoRef.current = questEchoData;
    // Keep session-end analytics up to date with quest/echo state
    updateSessionMetaContext({
      echoes: questEchoData.echoes,
      totalEchoesEarned: questEchoData.totalEchoesEarned,
      echoNodesUnlocked: questEchoData.unlockedEchoNodes.length,
      activeQuests: questEchoData.activeQuests.length,
      completedQuests: questEchoData.completedQuestIds.length,
    });
  }, [questEchoData]);

  // Update session tracking + error context when screen changes
  useEffect(() => {
    updateSessionContext(screen, selectedClass);
    updateErrorContext({ screen, playerClass: selectedClass });
  }, [screen, selectedClass]);

  // Fire tutorial-complete elder tip once when returning to title after finishing the journey
  useEffect(() => {
    if (isLoaded && screen === 'title' && bloodline.tutorialComplete && bloodline.generation === 0) {
      tryShowElderTip(ELDER_TUTORIAL_COMPLETE);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, screen]);

  // Generate skill check art when skill check modal opens
  useEffect(() => {
    if (!showSkillCheck || !pendingEncounter) {
      return;
    }
    
    const description = pendingEncounter.description || 'skill check';
    const skill = pendingEncounter.primarySkill || 'awareness';
    
    generateSkillCheckArt(description, skill)
      .then(url => {
        if (url) {
          console.log('[SkillCheck] Generated art:', url);
          setSkillCheckArtUrl(url);
        }
      })
      .catch(err => {
        console.warn('[SkillCheck] Art generation failed:', err);
      });
  }, [showSkillCheck, pendingEncounter]);

  // Load best floor + bloodline on mount, and connect to necropolis
  useEffect(() => {
    const loadStart = performance.now();
    const phase = (name: string) => { (window as any).__bootPhase = name; };
    phase('game_component_mounted');

    // Safety net: if loadData hasn't finished in 20s, dismiss preloader anyway
    // so the platform doesn't hit its own 15s timeout and kill us.
    // Increased from 12s to 20s to reduce premature dismissals on slow mobile networks
    // (8 occurrences affecting 6 users were hitting this too early).
    const safetyTimer = setTimeout(() => {
      RundotGameAPI.preloader.hideLoadScreen().catch(() => {});
      // Report that we hit the safety timeout — this is a degraded load
      try {
        RundotGameAPI.analytics.recordCustomEvent('load_safety_timeout', {
          elapsed_ms: Math.round(performance.now() - loadStart),
          phase: (window as any).__bootPhase || 'unknown',
          device_ua: (navigator.userAgent || '').slice(0, 200),
          device_mem: (navigator as any).deviceMemory ?? -1,
          device_conn: ((navigator as any).connection || {}).effectiveType || '',
        }).catch(() => {});
      } catch { /* analytics failed */ }
    }, 20000);

    async function loadData() {
      // Phase timings — lets us see exactly which step is slow
      const timings: Record<string, number> = {};
      const mark = (name: string) => { timings[name] = Math.round(performance.now() - loadStart); phase(name); };

      // Show the platform preloader so it knows we're actively loading
      // (prevents the 15s "Load timeout" that was killing iPhone sessions)
      try { await RundotGameAPI.preloader.showLoadScreen(); } catch { /* already showing */ }
      mark('preloader_shown');

      // Load critical data in parallel to reduce total load time and prevent
      // sequential timeout cascades (was causing 188 permission errors on load)
      const [bestFloorRaw, bloodlineRaw, autosaveRaw, necropolisRaw, premiumRaw, rogueRaw, autoSellRaw, consumablesRaw, questRaw, lastSeenRaw] = await Promise.all([
        safeGetItem('bestFloor'),
        safeGetItem('bloodline'),
        safeGetItem('autosave'),
        safeGetItem('necropolisUnlocked'),
        safeGetItem('premiumUnlocked'),
        safeGetItem('addToHomeShown'),
        safeGetItem('autoSellRarities'),
        safeGetItem('autoSellConsumables'),
        safeGetItem('questEchoData'),
        safeGetItem('lastSeenVersion'),
      ]);
      mark('storage_loaded');

      // Apply loaded values
      if (bestFloorRaw) setBestFloor(parseInt(bestFloorRaw, 10) || 1);

      if (bloodlineRaw) {
        try {
          const bl = JSON.parse(bloodlineRaw) as BloodlineData;
          if (!bl.bossKillLog) bl.bossKillLog = [];
          if (!Array.isArray(bl.unlockedTraits)) bl.unlockedTraits = [];
          setBloodline(bl);
          bloodlineRef.current = bl;
          if (bl.tutorialSteps) setTutorialSteps(bl.tutorialSteps);
        } catch (e) { reportError('load_bloodline_parse', e); }
      }
      mark('bloodline_applied');

      // Check for auto-save
      if (autosaveRaw) {
        setHasAutoSave(true);
      } else {
        // Check legacy backup slot only if primary is empty
        const backup = await safeGetItem('autosave_backup');
        if (backup) setHasAutoSave(true);
      }

      if (necropolisRaw === '1') setNecropolisUnlocked(true);
      if (rogueRaw === '1') setAddToHomeUnlocked(true);

      // Verify premium status — if save says premium, confirm the player actually made a purchase
      try {
        const hasPurchased = await RundotGameAPI.iap.hasUserMadePurchase();
        if (premiumRaw === '1') {
          if (hasPurchased) {
            setIsPremium(true);
          } else {
            // False positive — premium was saved but no purchase was ever made
            safeSetItem('premiumUnlocked', '');
          }
        }
        if (!hasPurchased) setIsFirstTimeBuyer(true);
      } catch {
        // If we can't verify, trust the saved value
        if (premiumRaw === '1') setIsPremium(true);
      }

      // Check registration status safely
      const profile = safeGetProfile();
      if (profile && !profile.isAnonymous) setIsRegistered(true);
      if (profile?.id) updateErrorContext({ playerId: profile.id });

      // Set local floors from bloodline so necropolis never shows 0
      setLocalDeathFloor(bloodlineRef.current.cumulative.totalDeaths);
      const localKills: Record<string, number> = {};
      const bestiary = bloodlineRef.current.bestiary;
      if (bestiary) {
        for (const entry of Object.values(bestiary)) {
          if (entry.killCount > 0) {
            localKills[entry.name] = entry.killCount;
          }
        }
      }
      setLocalKillsFloor(localKills);
      connectToNecropolis().catch(() => {});
      mark('necropolis_connected');

      // Load elder tip seen status — optimized to prevent extreme load times.
      // First try localStorage (instant), then batch SDK calls with a 5s overall timeout.
      // This prevents the 751-second load times seen in crash reports.
      for (const key of ALL_ELDER_KEYS) {
        try {
          const cached = localStorage.getItem('dod_backup_' + key);
          if (cached) elderSeenRef.current.add(key);
        } catch { /* localStorage unavailable */ }
      }
      // Only fetch from SDK if we need to (most users will have localStorage data)
      if (elderSeenRef.current.size < ALL_ELDER_KEYS.length) {
        try {
          const elderBatch = Promise.all(ALL_ELDER_KEYS.map(key => safeGetItem(key)));
          const elderTimeout = new Promise<null[]>(resolve => setTimeout(() => resolve([]), 5000));
          const elderResults = await Promise.race([elderBatch, elderTimeout]) as (string | null)[];
          ALL_ELDER_KEYS.forEach((key, i) => {
            if (elderResults[i]) elderSeenRef.current.add(key);
          });
        } catch { /* elder tips are non-critical — continue loading */ }
      }
      mark('elder_tips_loaded');

      // Apply preference data
      if (autoSellRaw) {
        try { setAutoSellRarities(JSON.parse(autoSellRaw)); } catch { /* bad data */ }
      }
      if (consumablesRaw === '1') setAutoSellConsumables(true);

      // Load quest + echo data
      if (questRaw) {
        try {
          let qe = JSON.parse(questRaw) as QuestEchoData;
          qe = patchQuestEchoData(qe);
          fillQuestSlots(qe);
          setQuestEchoData(qe);
          questEchoRef.current = qe;
          setEchoUnlockedNodes(qe.unlockedEchoNodes);
        } catch { /* first time */ }
      } else {
        const qe = createDefaultQuestEchoData();
        fillQuestSlots(qe);
        setQuestEchoData(qe);
        questEchoRef.current = qe;
      }
      mark('quest_data_loaded');

      // Detect first-time player: no bloodline saved + no autosave = never played
      const isFirstSession = !bloodlineRaw && !autosaveRaw;

      // Check version for What's New (skip for first-timers — they're going straight to game)
      if (!isFirstSession && lastSeenRaw !== BUILD_VERSION) {
        setShowWhatsNew(true);
      }
      if (lastSeenRaw !== BUILD_VERSION) {
        safeSetItem('lastSeenVersion', BUILD_VERSION);
      }

      // First-session auto-start: skip title/class/zone and drop into gameplay
      if (isFirstSession) {
        autoStartRef.current = true;
        setSelectedClass('warrior');
      }

      // Analytics: game opened + player identity + attribution
      trackGameOpened();
      trackPlayerIdentity();
      trackAttribution();
      setupSessionTracking();
      setIsLoaded(true);
      mark('game_ready');

      // Preloader is now dismissed in a separate effect that waits for
      // both data AND the title background image to be ready (see below).
      clearTimeout(safetyTimer);

      // Fire detailed load telemetry with phase-level timings
      const totalDuration = Math.round(performance.now() - loadStart);
      const bootTime = (window as any).__bootTimestamp;
      try {
        RundotGameAPI.analytics.recordCustomEvent('game_load_timing', {
          total_ms: totalDuration,
          boot_to_mount_ms: bootTime ? Math.round(performance.now() + performance.timeOrigin - bootTime) : -1,
          preloader_ms: timings['preloader_shown'] ?? -1,
          storage_ms: timings['storage_loaded'] ?? -1,
          bloodline_ms: timings['bloodline_applied'] ?? -1,
          necropolis_ms: timings['necropolis_connected'] ?? -1,
          elder_ms: timings['elder_tips_loaded'] ?? -1,
          quest_ms: timings['quest_data_loaded'] ?? -1,
          ready_ms: timings['game_ready'] ?? -1,
          had_autosave: !!autosaveRaw,
          storage_items_loaded: [bestFloorRaw, bloodlineRaw, autosaveRaw, necropolisRaw, premiumRaw, rogueRaw, autoSellRaw, consumablesRaw, questRaw, lastSeenRaw].filter(Boolean).length,
          device_ua: (navigator.userAgent || '').slice(0, 200),
          device_mem: (navigator as any).deviceMemory ?? -1,
          device_conn: ((navigator as any).connection || {}).effectiveType || '',
          early_errors: ((window as any).__bootErrors ?? []).length,
          auto_started: isFirstSession,
        }).catch(() => {});
      } catch { /* analytics failed */ }
    }
    loadData().catch((err) => {
      // loadData itself crashed — report it so we know
      reportError('loadData_crash', err);
      clearTimeout(safetyTimer);
      RundotGameAPI.preloader.hideLoadScreen().catch(() => {});
    });
    return () => { clearTimeout(safetyTimer); };
  }, []);

  // Dismiss preloader once data AND title image are both ready
  useEffect(() => {
    if (isLoaded && titleBgUrl) {
      RundotGameAPI.preloader.hideLoadScreen().catch(() => {});
    }
  }, [isLoaded, titleBgUrl]);

  // Elder guide: try to show a tip (skips if already seen or another tip is active)
  const tryShowElderTip = useCallback((tip: ElderTip) => {
    if (elderSeenRef.current.has(tip.key)) return;
    elderSeenRef.current.add(tip.key);
    markElderTipSeen(tip.key);
    setActiveElderTip(tip);
  }, []);

  const dismissElderTip = useCallback(() => {
    setActiveElderTip((current) => {
      if (current?.key === ELDER_ROGUE_UNLOCK.key) {
        setShowAddToHome(true);
      }
      if (current?.key === ELDER_PALADIN_UNLOCK.key) {
        setShowPaladinUnlock(true);
      }
      return null;
    });
  }, []);

  const saveBloodline = useCallback((bl: BloodlineData) => {
    setBloodline(bl);
    bloodlineRef.current = bl;
    safeSetItem('bloodline', JSON.stringify(bl));
  }, []);

  const saveQuestEcho = useCallback((qe: QuestEchoData) => {
    setQuestEchoData(qe);
    questEchoRef.current = qe;
    safeSetItem('questEchoData', JSON.stringify(qe));
  }, []);

  /** Check for newly unlocked lore entries and show a popup for the first one */
  const checkForNewLore = useCallback((bl: BloodlineData, qe: QuestEchoData) => {
    const ctx: LoreContext = { bloodline: bl, questEchoData: qe };
    const seen = bl.journalSeenIds ?? [];
    const newIds = getNewLoreIds(ctx, seen);
    if (newIds.length > 0) {
      // Show popup for the first new entry
      const entry = ALL_LORE.find(e => e.id === newIds[0]);
      if (entry) {
        setPendingLorePopup(entry.id);
      }
    }
  }, []);

  /** Handle journal seen IDs update — save to bloodline */
  const handleJournalMarkSeen = useCallback((newSeenIds: string[]) => {
    const bl = { ...bloodlineRef.current, journalSeenIds: newSeenIds };
    saveBloodline(bl);
  }, [saveBloodline]);

  // Save the full game state so it can be restored.
  const saveGameState = useCallback(() => {
    const s = stateRef.current;
    if (!s || s.gameOver || screenRef.current !== 'game') return;
    gpStart('save');
    try {
      const { _bloodlineRef, ...saveData } = s;
      // Trim dead monsters and old projectiles to keep saves small
      (saveData as any).monsters = s.monsters.filter(m => !m.isDead);
      (saveData as any).projectiles = [];
      // Cap messages to last 50 for save size
      if (saveData.messages && saveData.messages.length > 50) {
        (saveData as any).messages = saveData.messages.slice(-50);
      }
      // Compress floor data to reduce save size:
      // - Strip visible[][] (recalculated on load via updateFOV)
      // - Compress explored[][] to a flat bitstring ("0010110...")
      // - Compress tiles[][] to flat strings per row ("#..#.>")
      const floor = saveData.floor;
      const compressedFloor: any = {
        width: floor.width,
        height: floor.height,
        rooms: floor.rooms,
        terrain: floor.terrain,
        _tilesCompressed: floor.tiles.map((row: any[]) => row.join('')),
        _exploredCompressed: floor.explored.map((row: boolean[]) =>
          row.map(v => v ? '1' : '0').join('')
        ),
      };
      (saveData as any).floor = compressedFloor;

      // Strip fields from monsters that can be derived from templates
      (saveData as any).monsters = (saveData as any).monsters.map((m: any) => {
        const slim = { ...m };
        // These optional fields default to undefined/empty and take up space
        if (!slim.statusEffects?.length) delete slim.statusEffects;
        if (!slim.abilityCooldowns || Object.keys(slim.abilityCooldowns).length === 0) delete slim.abilityCooldowns;
        if (!slim.inventory?.length) delete slim.inventory;
        if (!slim.stuckTurns) delete slim.stuckTurns;
        return slim;
      });

      const json = JSON.stringify(saveData);
      safeSetItem('autosave', json); // timeout-protected + deduplicated
      gpEnd('save');
    } catch (e) { gpEnd('save'); reportError('autosave_serialize', e); }
  }, []);

  // Debounced save — batches actions into a single write every 12 seconds
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedSave = useCallback(() => {
    if (saveTimerRef.current) return; // timer already running — just wait for it
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      saveGameState();
    }, 12000);
  }, [saveGameState]);

  // Immediate save — for critical moments (floor descent, tab hiding, app background)
  const immediateSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    saveGameState();
  }, [saveGameState]);

  // Try to parse and validate a save from raw JSON — returns null if invalid
  const tryParseSave = useCallback((raw: string | null): GameState | null => {
    if (!raw) return null;
    try {
      const saved = JSON.parse(raw) as GameState;
      // Validate minimum required fields
      if (!saved.player || !saved.floor || !saved.playerClass) return null;
      if (!saved.player.pos || typeof saved.player.pos.x !== 'number') return null;
      if (!saved.floor.width || !saved.floor.height) return null;
      // Decompress floor data if saved in compressed format
      const fl = saved.floor as any;
      if (fl._tilesCompressed && !fl.tiles) {
        fl.tiles = fl._tilesCompressed.map((row: string) => row.split(''));
        delete fl._tilesCompressed;
      }
      if (fl._exploredCompressed && !fl.explored) {
        fl.explored = fl._exploredCompressed.map((row: string) =>
          row.split('').map((c: string) => c === '1')
        );
        delete fl._exploredCompressed;
      }
      // Ensure visible exists (will be recalculated by updateFOV below)
      if (!fl.visible) {
        fl.visible = Array.from({ length: fl.height }, () => new Array(fl.width).fill(false));
      }
      if (!saved.floor.tiles) return null;
      if (typeof saved.floorNumber !== 'number' || typeof saved.turn !== 'number') return null;
      // Re-attach and patch
      saved._bloodlineRef = bloodlineRef.current;
      saved.premiumActive = isPremium;
      if (!saved.mercenaries) saved.mercenaries = [];
      if (!saved.mapMercenaries) saved.mapMercenaries = [];
      if (!saved.npcs) saved.npcs = [];
      if (!saved.bossesDefeatedThisRun) saved.bossesDefeatedThisRun = [];
      if (!saved.messages) saved.messages = [];
      if (!saved.player.chosenAbilities) saved.player.chosenAbilities = [];
      if (!Array.isArray(saved.unlockedNodes)) saved.unlockedNodes = [];
      if (typeof saved.skillPoints !== 'number') saved.skillPoints = 0;
      if (!saved.player.inventory) saved.player.inventory = [];
      if (!saved.player.equipment) saved.player.equipment = {};
      if (!saved.player.stats || typeof saved.player.stats.hp !== 'number') return null;
      if (!saved.monsters) saved.monsters = [];
      // Migrate old slug entities that still use '~' from before the fix
      for (const m of saved.monsters) {
        if (m.char === '~' && m.name.toLowerCase().includes('slug')) {
          m.char = 's';
        }
      }
      if (!saved.items) saved.items = [];
      if (!saved.runStats) return null;
      // Patch missing runStats fields for older saves
      if (typeof saved.runStats.rangedAttacks !== 'number') saved.runStats.rangedAttacks = 0;
      if (!saved.runStats.terrainSteps) saved.runStats.terrainSteps = {};
      if (!saved.hunger || typeof saved.hunger.current !== 'number') return null;
      // Recalculate FOV since visible array may be stale
      updateFOV(saved);
      return saved;
    } catch {
      return null;
    }
  }, [isPremium]);

  // Restore a saved game from storage — tries primary slot, then legacy backup
  const restoreGameState = useCallback(async (): Promise<boolean> => {
    let saved: GameState | null = null;
    const raw = await safeGetItem('autosave');
    saved = tryParseSave(raw);

    // Fallback: check legacy backup slot for players who saved before this update
    if (!saved) {
      const backup = await safeGetItem('autosave_backup');
      saved = tryParseSave(backup);
      if (saved) {
        safeSetItem('autosave_backup', ''); // Migrate: clear old backup
      }
    }

    if (!saved) return false;

    setState(saved);
    setScreen('game');
    setSelectedClass(saved.playerClass);
    startTimeRef.current = Date.now();
    lastSavedFloorRef.current = saved.floorNumber;
    // Pre-create leaderboard token for the restored run
    scoreTokenRef.current = null;
    RundotGameAPI.leaderboard.createScoreToken()
      .then(t => { if (t?.token) scoreTokenRef.current = t.token; })
      .catch(() => {});
    return true;
  }, [tryParseSave]);

  // Save on pause, sleep, and quit lifecycle events + browser visibility events
  useEffect(() => {
    // SDK lifecycle hooks
    try {
      RundotGameAPI.lifecycles.onPause(() => { immediateSave(); });
      RundotGameAPI.lifecycles.onSleep(() => { immediateSave(); });
      RundotGameAPI.lifecycles.onQuit(() => { immediateSave(); });
    } catch (e) { reportError('lifecycle_save_setup', e); }

    // Browser-level hooks — these fire even when SDK hooks miss
    // visibilitychange: fires when user switches tabs or locks phone screen
    const handleVisibilityChange = () => {
      if (document.hidden) {
        immediateSave();
        // Only pause auto-play when NOT running in background mode
        // When runInBackground is true, keep the worker running
        if (!runInBackgroundRef.current && workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
        setTabVisible(false);
      } else {
        // Signal the auto-play effect to restart the worker
        setTabVisible(true);
      }
    };
    // pagehide: fires on mobile when app goes to background, tab closes, or navigate away
    const handlePageHide = () => { immediateSave(); };
    // beforeunload: last-chance save when page is being closed/refreshed
    const handleBeforeUnload = () => { immediateSave(); };
    // freeze: Page Lifecycle API — fires when browser freezes a background tab
    const handleFreeze = () => { immediateSave(); };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('freeze', handleFreeze);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('freeze', handleFreeze);
    };
  }, [immediateSave]);

  const isLoadedRef = useRef(false);
  useEffect(() => { isLoadedRef.current = isLoaded; }, [isLoaded]);

  const startGame = useCallback(async () => {
    // Fire Facebook pixel when player enters the dungeon
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
    // Wait for initial data load to complete so class unlock state is accurate
    if (!isLoadedRef.current) {
      await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          if (isLoadedRef.current) { clearInterval(interval); resolve(); }
        }, 50);
      });
    }
    // Try to restore a saved game first
    if (hasAutoSave) {
      const restored = await restoreGameState();
      if (restored) return;
    }
    setScreen('classSelect');
  }, [hasAutoSave, restoreGameState]);

  // DEBUG: tap subtitle 5 times within 3 seconds to toggle debug mode
  const handleDebugTap = useCallback(() => {
    const now = Date.now();
    debugTapRef.current.push(now);
    // Only keep taps within last 3 seconds
    debugTapRef.current = debugTapRef.current.filter(t => now - t < 3000);
    if (debugTapRef.current.length >= 5) {
      debugTapRef.current = [];
      setDebugMode(prev => {
        if (!prev) setHasAutoSave(false); // entering debug mode — skip auto-load
        return !prev;
      });
    }
  }, []);

  const handleNecroTap = useCallback(() => {
    const now = Date.now();
    necroTapRef.current.push(now);
    necroTapRef.current = necroTapRef.current.filter(t => now - t < 3000);
    if (necroTapRef.current.length >= 5) {
      necroTapRef.current = [];
      setNecropolisUnlocked(true);
      safeSetItem('necropolisUnlocked', '1');
    }
  }, []);

  const PREMIUM_COST = 100;
  const PREMIUM_STARTER_COST = 50;
  const [purchaseStatus, setPurchaseStatus] = useState('');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [pressedZone, setPressedZone] = useState<string | null>(null);


  const [addToHomeUnlocked, setAddToHomeUnlocked] = useState(false);
  const handlePremiumPurchase = useCallback(async () => {
    const cost = isFirstTimeBuyer ? PREMIUM_STARTER_COST : PREMIUM_COST;
    setPurchaseStatus('Loading...');
    try {
      // Check balance first
      const balance = await RundotGameAPI.iap.getHardCurrencyBalance();
      if (balance < cost) {
        setPurchaseStatus('Not enough bucks! Opening store...');
        await RundotGameAPI.iap.openStore();
        setTimeout(() => setPurchaseStatus(''), 3000);
        return;
      }
      const result = await RundotGameAPI.iap.spendCurrency('premium_no_ads', cost) as any;
      if (result?.success === true) {
        setIsPremium(true);
        setIsFirstTimeBuyer(false);
        setShowPremiumModal(false);
        safeSetItem('premiumUnlocked', '1');
        trackPremiumPurchased({
          cost,
          playerGold: state?.score ?? 0,
          floor: state?.floorNumber ?? 0,
          zone: state?.zone ?? 'title',
          playerClass: state?.playerClass ?? 'none',
          generation: bloodlineRef.current.generation,
        });
        setPurchaseStatus('');
      } else {
        setPurchaseStatus('Purchase did not complete.');
        setTimeout(() => setPurchaseStatus(''), 3000);
      }
    } catch (e: any) {
      setPurchaseStatus(e?.message || 'Something went wrong.');
      setTimeout(() => setPurchaseStatus(''), 4000);
    }
  }, [isFirstTimeBuyer]);

  const selectClassAndPickZone = useCallback((cls: PlayerClass) => {
    // For special classes with detail portraits, show the detail screen first
    const classesWithDetailScreen = ['necromancer', 'revenant'];
    if (classesWithDetailScreen.includes(cls)) {
      setSelectedClass(cls);
      setShowClassDetail(cls);
      trackClassSelected(cls);
      return;
    }
    setSelectedClass(cls);
    setScreen('zoneSelect');
    trackClassSelected(cls);
  }, []);

  const beginGame = useCallback(async (zone: ZoneId, overrideClass?: PlayerClass) => {
    // Use override class if provided (for generated classes where state hasn't updated yet)
    const playerClass = overrideClass ?? selectedClass;
    
    // Track game mode for D1 retention analytics
    trackGameModeStart(zone, playerClass);
    
    // Only run AI content generation in the narrative_test debug zone
    const isNarrativeZone = zone === 'narrative_test';
    
    if (isNarrativeZone) {
      // Show loading screen
      setShowGenerationLoading(true);
      setGenerationProgress(5);
      
      // Check if user is logged in
      const isAnon = RundotGameAPI.accessGate.isAnonymous();
      console.log('[Narrative] Starting AI zone, isAnonymous:', isAnon);
      
      if (isAnon) {
        setGenerationMessage('AI generation requires login...');
        
        try {
          const loginResult = await RundotGameAPI.accessGate.promptLogin();
          console.log('[Narrative] Login result:', loginResult);
          
          if (!loginResult.success) {
            setGenerationMessage('Login cancelled. AI content requires authentication.');
            await new Promise(r => setTimeout(r, 2000));
            setShowGenerationLoading(false);
            return;
          }
        } catch (loginErr) {
          console.error('[Narrative] Login prompt failed:', loginErr);
          setGenerationMessage('Login failed. Please try again.');
          await new Promise(r => setTimeout(r, 2000));
          setShowGenerationLoading(false);
          return;
        }
      }
      
      // User is logged in, proceed with AI content generation
      console.log('[Narrative] User logged in, starting content generation...');
      setGenerationProgress(10);
      setGenerationMessage('Preparing your story...');

      // Start content generation and wait for it before creating the game
      const generationPromise = prepareRunContent(
        playerClass,
        bloodlineRef.current,
        (progress, message) => {
          setGenerationProgress(progress);
          setGenerationMessage(message);
        }
      );

      // Wait for initial content to be ready (or timeout after 45s for AI - needs time for LLM + image gen)
      const timeoutPromise = new Promise<boolean>(resolve => setTimeout(() => resolve(false), 45000));
      const result = await Promise.race([generationPromise, timeoutPromise]);
      console.log('[Narrative] Generation completed, result:', result);
    }

    // Now create the game (content is ready so story triggers will work)
    const echoBonuses = computeEchoBonuses(questEchoRef.current);
    setEchoUnlockedNodes(questEchoRef.current.unlockedEchoNodes);
    console.log('[Game] Creating game with class:', playerClass, 'zone:', zone);
    const gs = safeEngineCall('newGame', () => newGame(playerClass, bloodlineRef.current, zone, echoBonuses));
    if (!gs) {
      if (isNarrativeZone) setShowGenerationLoading(false);
      return; // engine error creating game — stay on screen
    }
    gs.premiumActive = isPremium;
    // Reset quest extra tracking for this run
    questExtraRef.current = {};

    // Hide loading screen and start game
    setShowGenerationLoading(false);
    setState(gs);
    setScreen('game');
    setShowInventory(false);
    trackZoneSelected(zone, playerClass);
    updateSessionContext('game', playerClass, zone, 1);
    updateSessionMetaContext({ skillPointsSpent: 0, skillPointsUnspent: gs.skillPoints, generation: bloodlineRef.current.generation });
    updateErrorContext({ zone, floor: 1, generation: bloodlineRef.current.generation, playerClass: selectedClass });
    trackSecondRun(bloodlineRef.current.generation);
    setShowShop(false);
    setShowNPCDialogue(false);
    setShowMercHire(false);
    setAutoPlay(false);
    prevRunStatsRef.current = null;
    startTimeRef.current = Date.now();
    lastSavedFloorRef.current = 0;
    // Pre-create leaderboard score token for this run
    scoreTokenRef.current = null;
    RundotGameAPI.leaderboard.createScoreToken()
      .then(t => { if (t?.token) scoreTokenRef.current = t.token; })
      .catch(() => {}); // best-effort — submitScore will skip if no token
    // Fire Meta pixel PageViews at timed intervals from game start
    pixelTimersRef.current.forEach(clearTimeout);
    const fbq = (window as any).fbq;
    try { fbq?.('trackSingle', '1938108636803653', 'PageView'); } catch (_) {} // enter dungeon
    const pixelEvents: [number, string][] = [
      [30000,  '836086159492144'],  // 30s
      [60000,  '1454026359429653'], // 1min
      [120000, '4327199907516237'], // 2min
      [180000, '950565250690147'],  // 3min
      [300000, '1807456903196666'], // 5min
      [420000, '1557138382039810'], // 7min
      [600000, '1650984392689108'], // 10min
    ];
    pixelTimersRef.current = pixelEvents.map(([delay, id]) =>
      setTimeout(() => { try { fbq?.('init', id); fbq?.('trackSingle', id, 'PageView'); } catch (_) {} }, delay)
    );
    // Clear any previous auto-save (both slots)
    RundotGameAPI.appStorage.removeItem('autosave').catch(() => {});
    RundotGameAPI.appStorage.removeItem('autosave_backup').catch(() => {});
    // Elder: welcome tip on first ever run
    if (bloodlineRef.current.generation === 0) {
      tryShowElderTip(ELDER_WELCOME);
    }
    // Ranged class tutorial — show once on first game with ranger or mage
    if (selectedClass === 'ranger' || selectedClass === 'mage') {
      safeGetItem('tutorial_ranged_class').then((val) => {
        if (!val) setShowRangedTutorial(true);
      });
    }
  }, [isPremium, selectedClass, tryShowElderTip]);

  // First-session auto-start: once data is loaded and autoStartRef is set,
  // drop the player directly into gameplay based on A/B test variant.
  useEffect(() => {
    if (!isLoaded || !autoStartRef.current) return;
    autoStartRef.current = false;
    
    // Determine zone based on A/B test variant
    const abInfo = getNarrativeExperimentInfo();
    const startZone = abInfo.isNarrative ? 'narrative_test' : 'stone_depths';
    
    // Track A/B test exposure
    trackExposure('narrative_vs_classic');
    
    // Fire analytics so we can track first-session auto-starts
    try {
      RundotGameAPI.analytics.recordCustomEvent('first_session_autostart', {
        class: 'warrior',
        zone: startZone,
        ab_variant: abInfo.variant,
        ...(() => { try { const e = RundotGameAPI.system.getEnvironment(); return { platform: e.platform ?? 'unknown' }; } catch { return {}; } })(),
      }).catch(() => {});
    } catch { /* analytics unavailable */ }
    beginGame(startZone as ZoneId);
  }, [isLoaded, beginGame]);

  const processDeathBloodline = useCallback((finalState: GameState) => {
    // Complete the 'died' tutorial step synchronously before cloning the bloodline
    // (completeTutorialStep uses async React state, so we must mutate the ref directly here)
    if (!bloodlineRef.current.tutorialComplete) {
      const STEP_ID = 'died' as TutorialStepId;
      // Merge both the ref and the React state to get the most complete picture
      const refSteps = bloodlineRef.current.tutorialSteps ?? [];
      const merged = Array.from(new Set([...tutorialSteps, ...refSteps]));
      const next = merged.includes(STEP_ID) ? merged : [...merged, STEP_ID];
      bloodlineRef.current.tutorialSteps = next;
      setTutorialSteps(next);
      const allDone = TUTORIAL_STEPS.every((s) => next.includes(s.id));
      if (allDone) {
        bloodlineRef.current.tutorialComplete = true;
      }
    }

    const bl = structuredClone(bloodlineRef.current);

    // Merge run stats
    mergeRunIntoBloodline(bl, finalState.runStats);
    bl.cumulative.classDeaths[finalState.playerClass] =
      (bl.cumulative.classDeaths[finalState.playerClass] ?? 0) + 1;
    bl.cumulative.highestFloor = Math.max(bl.cumulative.highestFloor, finalState.floorNumber);
    bl.cumulative.highestScore = Math.max(bl.cumulative.highestScore, finalState.score);
    bl.cumulative.totalScore += finalState.score;
    bl.cumulative.totalTurns += finalState.turn;

    // Create ancestor
    const ancestor: AncestorRecord = {
      name: generateAncestorName(),
      class: finalState.playerClass,
      floorReached: finalState.floorNumber,
      level: finalState.player.level,
      score: finalState.score,
      killCount: finalState.runStats.kills,
      causeOfDeath: extractCauseOfDeath(finalState),
      turnsLived: finalState.turn,
    };

    bl.ancestors.push(ancestor);
    if (bl.ancestors.length > 5) bl.ancestors.shift();
    bl.generation++;

    // Merge NPC choices from the game state bloodline ref (they're written during dialogue)
    if (finalState._bloodlineRef) {
      Object.assign(bl.npcChoicesMade, finalState._bloodlineRef.npcChoicesMade);
    }

    // Record boss kills with class for zone unlocks
    for (const bossName of finalState.bossesDefeatedThisRun) {
      const key = `${bossName}|${finalState.playerClass}`;
      if (!bl.bossKillLog.includes(key)) {
        bl.bossKillLog.push(key);
      }
    }

    // Check for new traits
    const newTraits = checkForNewTraits(bl);
    for (const trait of newTraits) {
      bl.unlockedTraits.push(trait.id);
    }

    // Save run history (keep last 20)
    if (!bl.runHistory) bl.runHistory = [];
    const runEntry: RunHistoryEntry = {
      class: finalState.playerClass,
      zone: finalState.zone,
      floorReached: finalState.floorNumber,
      level: finalState.player.level,
      score: finalState.score,
      kills: finalState.runStats.kills,
      turns: finalState.turn,
      causeOfDeath: extractCauseOfDeath(finalState),
      bossesKilled: finalState.runStats.bossesKilled,
      timestamp: Date.now(),
    };
    bl.runHistory.push(runEntry);
    if (bl.runHistory.length > 20) bl.runHistory.shift();

    // Update bestiary from this run's kill data
    if (!bl.bestiary) bl.bestiary = {};
    for (const [monsterName, killCount] of Object.entries(finalState.runStats.monsterKills)) {
      if (!bl.bestiary[monsterName]) {
        // Find the monster in the current state to grab its visual info
        const m = finalState.monsters.find(e => e.name === monsterName);
        bl.bestiary[monsterName] = {
          name: monsterName,
          encountered: true,
          killed: true,
          killCount: 0,
          color: m?.color,
          char: m?.char,
          baseName: m?.baseName ?? monsterName,
        };
      }
      const entry = bl.bestiary[monsterName]!;
      entry.encountered = true;
      if (killCount > 0) entry.killed = true;
      entry.killCount += killCount;
    }

    // Compute before/after stat bonuses to show the player what they gained
    const bonusesBefore = computeBloodlineBonuses(bloodlineRef.current);
    const bonusesAfter = computeBloodlineBonuses(bl);
    const statGains: StatGain[] = [];
    const bHP = bonusesBefore.statBonuses.maxHp ?? 0;
    const aHP = bonusesAfter.statBonuses.maxHp ?? 0;
    if (aHP > bHP) statGains.push({ label: 'HP', before: bHP, after: aHP });
    const bATK = bonusesBefore.statBonuses.attack ?? 0;
    const aATK = bonusesAfter.statBonuses.attack ?? 0;
    if (aATK > bATK) statGains.push({ label: 'ATK', before: bATK, after: aATK });
    const bDEF = bonusesBefore.statBonuses.defense ?? 0;
    const aDEF = bonusesAfter.statBonuses.defense ?? 0;
    if (aDEF > bDEF) statGains.push({ label: 'DEF', before: bDEF, after: aDEF });
    const bSPD = bonusesBefore.statBonuses.speed ?? 0;
    const aSPD = bonusesAfter.statBonuses.speed ?? 0;
    if (aSPD > bSPD) statGains.push({ label: 'SPD', before: bSPD, after: aSPD });

    const goldGain = bonusesAfter.startingGold - bonusesBefore.startingGold;
    const hungerGain = bonusesAfter.hungerBonus - bonusesBefore.hungerBonus;
    const isFirstDeath = bloodlineRef.current.generation === 0;

    // Merge Essence Shards earned this run into Legacy data
    if (finalState.runStats.essenceShardsEarned > 0) {
      const legacyData = ensureLegacyData(bl);
      addEssenceShards(legacyData, finalState.runStats.essenceShardsEarned);
      // Auto-earn the legacy gear for the class you played if not already earned
      const gear = getGearForClass(legacyData, finalState.playerClass);
      if (!gear.earned) {
        gear.earned = true;
        gear.level = 1;
      }
    }

    const isSecondDeath = bloodlineRef.current.generation === 1;
    setDeathInfo({ ancestor, newTraits, generation: bl.generation, statGains, goldGain, hungerGain, isFirstDeath, isSecondDeath });
    saveBloodline(bl);

    // Clear auto-save on death (both slots + localStorage backup)
    setHasAutoSave(false);
    RundotGameAPI.appStorage.removeItem('autosave').catch(() => {});
    RundotGameAPI.appStorage.removeItem('autosave_backup').catch(() => {});
    try { localStorage.removeItem('dod_backup_autosave'); } catch { /* ok */ }
    try { localStorage.removeItem('dod_backup_autosave_backup'); } catch { /* ok */ }

    // Report death and kills to the Necropolis for communal unlocks + bestiary bounties
    reportDeath().catch(() => {});
    if (finalState.runStats.monsterKills && Object.keys(finalState.runStats.monsterKills).length > 0) {
      reportKills(finalState.runStats.monsterKills).catch(() => {});
    }

    // Merge quest progress and save
    const qe = structuredClone(questEchoRef.current);
    const echoesBeforeRun = qe.totalEchoesEarned;
    const questsBeforeRun = qe.completedQuestIds.length;
    const extra = questExtraRef.current;
    // Ensure class kills are populated (handleChange already sets this to rs.kills)
    extra.classKills = extra.classKills ?? {};
    if (!extra.classKills[finalState.playerClass]) {
      extra.classKills[finalState.playerClass] = finalState.runStats.kills;
    }
    const runTracker = buildRunTracker(finalState, extra);
    mergeRunIntoCounters(qe, runTracker);
    // Update bestiary and ancestor counts
    qe.counters.totalBestiaryEntries = Object.keys(bl.bestiary ?? {}).length;
    qe.counters.totalAncestors = bl.ancestors.length;
    qe.counters.totalTraitsUnlocked = bl.unlockedTraits.length;
    // Pass null for runTracker because counters now include the merged run data.
    // Passing the runTracker again would double-count persistent quest progress.
    updateQuestProgress(qe, null, qe.counters.totalBestiaryEntries, qe.counters.totalAncestors, qe.counters.totalTraitsUnlocked);
    fillQuestSlots(qe);
    saveQuestEcho(qe);

    // Track quest run summary analytics
    trackQuestRunSummary({
      questsCompletedThisRun: qe.completedQuestIds.length - questsBeforeRun,
      echoesEarnedThisRun: qe.totalEchoesEarned - echoesBeforeRun,
      totalEchoes: qe.echoes,
      totalEchoesEarned: qe.totalEchoesEarned,
      totalQuestsCompleted: qe.completedQuestIds.length,
      playerClass: finalState.playerClass,
      zone: finalState.zone,
      floor: finalState.floorNumber,
      generation: bl.generation,
    });

    // Check for new lore entries unlocked by this run
    checkForNewLore(bl, qe);
  }, [saveBloodline, saveQuestEcho, setTutorialSteps, tutorialSteps, checkForNewLore]);

  // Tutorial step completion helper
  const completeTutorialStep = useCallback((stepId: TutorialStepId) => {
    setTutorialSteps((prev) => {
      if (prev.includes(stepId)) return prev;
      const next = [...prev, stepId];
      const bl = bloodlineRef.current;
      bl.tutorialSteps = next;
      // Check if all steps done → mark complete, unlock trait
      const allDone = TUTORIAL_STEPS.every((s) => next.includes(s.id));
      if (allDone && !bl.tutorialComplete) {
        bl.tutorialComplete = true;
        const newTraits = checkForNewTraits(bl);
        for (const t of newTraits) bl.unlockedTraits.push(t.id);
      }
      saveBloodline(bl);
      return next;
    });
  }, [saveBloodline]);

  // Auto-save: track last saved floor to avoid duplicate saves
  const lastSavedFloorRef = useRef(0);

  const handleChange = useCallback((next: GameState) => {
    // Combat VFX — detect new combat messages
    const newMsgs = next.messages.slice(prevMsgCountRef.current);
    prevMsgCountRef.current = next.messages.length;
    if (newMsgs.length > 0) {
      const hasHurt = newMsgs.some(m => m.color === '#ff5566' || m.color === '#ff3333'); // bad / boss
      const hasHit = newMsgs.some(m => m.color === '#44dd77' && /hit|damage|strike|smite|burn/i.test(m.text));
      if (hasHurt) {
        setCombatEffect(null);
        requestAnimationFrame(() => setCombatEffect('hurt'));
      } else if (hasHit) {
        setCombatEffect(null);
        requestAnimationFrame(() => setCombatEffect('hit'));
      }
    }

    // Track best floor reached during gameplay
    if (next.floorNumber > bestFloor) {
      setBestFloor(next.floorNumber);
      safeSetItem('bestFloor', String(next.floorNumber));
      trackFloorReached(next.floorNumber, next.playerClass, next.zone);
      updateSessionContext('game', next.playerClass, next.zone, next.floorNumber);
      updateSessionMetaContext({ skillPointsSpent: next.unlockedNodes.length, skillPointsUnspent: next.skillPoints });
      updateErrorContext({ floor: next.floorNumber });
    }

    // Unlock necropolis when warrior reaches level 5
    if (!necropolisUnlocked && next.playerClass === 'warrior' && next.player.level >= 5) {
      setNecropolisUnlocked(true);
      safeSetItem('necropolisUnlocked', '1');
    }

    // Auto-save: debounced on every action, immediate on floor descent
    if (!next.gameOver) {
      const floorChanged = next.floorNumber > lastSavedFloorRef.current;
      if (floorChanged) {
        lastSavedFloorRef.current = next.floorNumber;
        immediateSave(); // Floor descent — save immediately, don't risk losing it
      } else {
        debouncedSave(); // Every other action — debounced so we don't spam storage
      }
    }

    // Track bestiary encounters — any monster visible in the current state
    const bl = bloodlineRef.current;
    if (!bl.bestiary) bl.bestiary = {};
    let bestiaryUpdated = false;
    for (const m of next.monsters) {
      if (!m.isDead && !bl.bestiary[m.name]) {
        const entry: BestiaryEntry = {
          name: m.name,
          encountered: true,
          killed: false,
          killCount: 0,
          stats: { ...m.stats, hp: m.stats.maxHp },
          isBoss: m.isBoss,
          color: m.color,
          char: m.char,
          baseName: m.baseName ?? m.name,
        };
        bl.bestiary[m.name] = entry;
        bestiaryUpdated = true;
      }
    }
    if (bestiaryUpdated) {
      saveBloodline(bl);
    }

    // ── Live quest progress update ──
    {
      // Clone so React sees a genuinely new object (not the same mutated ref)
      const qe = structuredClone(questEchoRef.current);
      const extra = questExtraRef.current;
      const rs = next.runStats;
      const prev = prevRunStatsRef.current;

      // Track class kills
      extra.classKills = extra.classKills ?? {};
      extra.classKills[next.playerClass] = rs.kills;

      // Track shop purchases — detect new gold spent (score decreased without kill)
      // We use a dedicated counter since runStats doesn't have shop purchases
      if (!extra.shopPurchases) extra.shopPurchases = 0;

      // Track NPC talks from runStats
      extra.npcsTalkedTo = rs.npcsTalkedTo;

      // Track skill points spent this run
      extra.skillPointsSpent = next.unlockedNodes.length;

      // Track named food/potions — detect new consumable uses via runStats delta
      if (prev) {
        // Detect new food eaten
        if (rs.foodEaten > (prev.foodEaten ?? 0)) {
          if (!extra.namedFoodEaten) extra.namedFoodEaten = {};
        }
        // Detect new potions used
        if (rs.potionsUsed > (prev.potionsUsed ?? 0)) {
          if (!extra.namedPotionsUsed) extra.namedPotionsUsed = {};
        }
      }

      // Track mercenaries hired from runStats
      extra.mercenariesHired = rs.mercenariesHired;

      const runTracker = buildRunTracker(next, extra);
      const bestiaryCount = Object.keys(bl.bestiary ?? {}).length;
      const ancestorCount = bl.ancestors.length;
      const traitCount = bl.unlockedTraits.length;

      // Snapshot which quests are already completed before update
      const prevCompleted = new Set(qe.activeQuests.filter(q => q.completed).map(q => q.templateId));
      updateQuestProgress(qe, runTracker, bestiaryCount, ancestorCount, traitCount);

      // Fire analytics for any quests that just completed
      for (const quest of qe.activeQuests) {
        if (quest.completed && !prevCompleted.has(quest.templateId)) {
          const tmpl = getQuestTemplate(quest.templateId);
          if (tmpl) {
            trackQuestCompleted({
              questId: tmpl.id,
              questName: tmpl.name,
              questTier: tmpl.tier,
              reward: tmpl.reward,
              totalEchoesEarned: qe.totalEchoesEarned,
              totalQuestsCompleted: qe.completedQuestIds.length,
              playerClass: next.playerClass,
              floor: next.floorNumber,
              zone: next.zone,
            });
          }
        }
      }

      // Update both ref and state with the new clone
      questEchoRef.current = qe;
      setQuestEchoData(qe);
    }

    // ── Tutorial step detection (first run only) ──
    if (bloodlineRef.current.generation === 0 && !bloodlineRef.current.tutorialComplete) {
      const prev = prevRunStatsRef.current;
      const rs = next.runStats;

      // Moved — turn count increased and position changed
      if (next.turn > 0) completeTutorialStep('moved');
      // Picked up item
      if (prev && rs.itemsFound > prev.itemsFound) completeTutorialStep('picked_up_item');
      // Killed an enemy
      if (prev && rs.kills > prev.kills) completeTutorialStep('killed_enemy');
      // Used an item (potion, food, or scroll)
      if (prev && (rs.potionsUsed > prev.potionsUsed || rs.foodEaten > prev.foodEaten || rs.scrollsUsed > prev.scrollsUsed)) {
        completeTutorialStep('used_item');
      }
      // Reached floor 2
      if (next.floorNumber >= 2) completeTutorialStep('reached_floor_2');

      prevRunStatsRef.current = {
        kills: rs.kills,
        itemsFound: rs.itemsFound,
        potionsUsed: rs.potionsUsed,
        foodEaten: rs.foodEaten,
        scrollsUsed: rs.scrollsUsed,
      };
    }

    if (next.gameOver) {
      setState(next);
      processDeathBloodline(next);
      setTimeout(() => {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        trackPlayerDeath(buildDeathParams(next, duration, bloodlineRef.current.generation, autoPlay));
        submitScore(next.score, duration);
        setScreen('gameover');
        // Elder: death tip on first death
        if (bloodlineRef.current.generation <= 1) {
          tryShowElderTip(ELDER_DEATH);
        }
      }, 800);
      return;
    }
    // Auto-open shop when stepping on shopkeeper
    if (isAtShop(next) && next.shop && next.shop.stock.length > 0) {
      setShowShop(true);
    }
    // Auto-open NPC dialogue
    if (next.pendingNPC) {
      setShowNPCDialogue(true);
    }
    // Auto-open mercenary hire
    if (next.pendingMercenary) {
      setShowMercHire(true);
    }
    // Check for interactable encounter at player position
    if (next.interactables && next.interactables.length > 0) {
      const px = next.player.pos.x;
      const py = next.player.pos.y;
      const encounter = next.interactables.find(i => !i.interacted && i.pos.x === px && i.pos.y === py);
      if (encounter) {
        setPendingEncounter(encounter);
        setShowSkillCheck(true);
        setSkillCheckArtUrl(null); // Reset art, will generate in effect
        // First skill check - show tutorial
        if (!autoPlay) tryShowElderTip(ELDER_SKILL_CHECK);
      }
    }
    setState(next);

    // Elder contextual tips — skip during autoplay
    if (!autoPlay && !activeElderTip) {
      // Hunger warning
      if (next.hunger.current <= next.hunger.max * 0.25 && next.hunger.current > 0) {
        tryShowElderTip(ELDER_HUNGER);
      }
      // Shop encounter
      else if (isAtShop(next) && next.shop && next.shop.stock.length > 0) {
        tryShowElderTip(ELDER_SHOP);
      }
      // Mercenary encounter
      else if (next.pendingMercenary) {
        tryShowElderTip(ELDER_MERCENARY);
      }
      // NPC encounter
      else if (next.pendingNPC) {
        tryShowElderTip(ELDER_NPC);
      }
      // Boss on this floor
      else if (next.monsters.some(m => m.isBoss && !m.isDead)) {
        tryShowElderTip(ELDER_BOSS);
      }
      // Status effect
      else if (next.player.statusEffects && next.player.statusEffects.length > 0) {
        tryShowElderTip(ELDER_STATUS);
      }
      // Warrior rage intro — first time they take a hit
      else if (next.playerClass === 'warrior' && ((next as typeof next & { _rage?: number })._rage ?? 0) > 0) {
        tryShowElderTip(ELDER_RAGE_INTRO);
      }
      // Legacy Gear — first ever Essence Shard earned
      else if (next.runStats.essenceShardsEarned > 0) {
        tryShowElderTip(ELDER_LEGACY_SHARD);
      }
    }

    // Clear projectiles after a brief moment so they show for one frame
    if (next.projectiles && next.projectiles.length > 0) {
      setTimeout(() => {
        setState(prev => {
          if (!prev || !prev.projectiles?.length) return prev;
          return { ...prev, projectiles: [] };
        });
      }, 250);
    }
  }, [bestFloor, processDeathBloodline, isPremium, necropolisUnlocked, autoPlay, activeElderTip, tryShowElderTip]);

  // ── Quest + Echo Tree handlers ──
  const handleClaimQuest = useCallback((index: number) => {
    const qe = structuredClone(questEchoRef.current);
    const quest = qe.activeQuests[index];
    const tmpl = quest ? getQuestTemplate(quest.templateId) : undefined;
    const earned = claimQuest(qe, index);
    if (earned > 0) {
      saveQuestEcho(qe);
      if (tmpl) {
        trackQuestClaimed({
          questId: tmpl.id,
          questName: tmpl.name,
          questTier: tmpl.tier,
          echoesEarned: earned,
          totalEchoes: qe.echoes,
          totalEchoesEarned: qe.totalEchoesEarned,
          activeQuestsCount: qe.activeQuests.length,
        });
      }
    }
  }, [saveQuestEcho]);
  
  // Handle claiming character quest rewards
  const handleClaimCharacterQuest = useCallback((questId: string) => {
    if (!state) return;
    const result = claimCharacterQuestReward(state, questId);
    if (result) {
      // Apply gold reward (gold is tracked as score in this game)
      const next = cloneState(state);
      if (result.gold > 0) {
        next.score += result.gold;
        addMessage(next, `+${result.gold} gold from quest!`, '#ffcc44');
      }
      // Show skill bonus message
      if (result.skillBonus) {
        addMessage(next, `+${result.skillBonus.value} ${result.skillBonus.skill} from patron quest!`, '#88ffcc');
      }
      // Apply echo reward to quest data
      if (result.echoes > 0) {
        const qe = structuredClone(questEchoRef.current);
        qe.echoes += result.echoes;
        qe.totalEchoesEarned += result.echoes;
        saveQuestEcho(qe);
        addMessage(next, `+${result.echoes} echoes earned!`, '#cc88ff');
      }
      // Force state update to reflect changes
      setState(next);
      console.log('[Quest] Character quest claimed:', result.message);
    }
  }, [state, saveQuestEcho]);

  const handleUnlockEchoNode = useCallback((nodeId: string) => {
    const qe = structuredClone(questEchoRef.current);
    const { canUnlock } = canUnlockEchoNode(nodeId, qe.unlockedEchoNodes, qe.echoes);
    if (!canUnlock) return;
    const nd = getEchoNode(nodeId);
    if (!nd) return;
    qe.echoes -= nd.cost;
    qe.unlockedEchoNodes.push(nodeId);
    setEchoUnlockedNodes(qe.unlockedEchoNodes);

    // Update echo node counters on questExtraRef for quest tracking
    const extra = questExtraRef.current;
    extra.echoNodesUnlocked = qe.unlockedEchoNodes.length;
    if (!extra.echoPathNodesUnlocked) extra.echoPathNodesUnlocked = {};
    const pathName = getEchoNodePathName(nd.id);
    // Count nodes in this path from the full unlocked list
    extra.echoPathNodesUnlocked[pathName] = qe.unlockedEchoNodes.filter(
      nid => getEchoNodePathName(nid) === pathName
    ).length;

    // Also update persistent counters directly (echo nodes happen outside runs)
    qe.counters.totalEchoNodesUnlocked = qe.unlockedEchoNodes.length;
    if (!qe.counters.echoPathNodesUnlocked) qe.counters.echoPathNodesUnlocked = {};
    qe.counters.echoPathNodesUnlocked[pathName] = extra.echoPathNodesUnlocked[pathName];

    // Check quest progress after unlocking
    const bl = bloodlineRef.current;
    const bestiaryCount = Object.keys(bl.bestiary ?? {}).length;
    const ancestorCount = bl.ancestors.length;
    const traitCount = bl.unlockedTraits.length;
    const prevCompleted = new Set(qe.activeQuests.filter(q => q.completed).map(q => q.templateId));
    updateQuestProgress(qe, null, bestiaryCount, ancestorCount, traitCount);
    for (const quest of qe.activeQuests) {
      if (quest.completed && !prevCompleted.has(quest.templateId)) {
        const tmpl = getQuestTemplate(quest.templateId);
        if (tmpl) {
          trackQuestCompleted({
            questId: tmpl.id, questName: tmpl.name, questTier: tmpl.tier,
            reward: tmpl.reward, totalEchoesEarned: qe.totalEchoesEarned,
            totalQuestsCompleted: qe.completedQuestIds.length,
          });
        }
      }
    }

    saveQuestEcho(qe);
    trackEchoNodeUnlocked({
      nodeId: nd.id,
      nodeName: nd.name,
      path: pathName,
      tier: nd.tier,
      cost: nd.cost,
      echoesRemaining: qe.echoes,
      totalNodesUnlocked: qe.unlockedEchoNodes.length,
    });
  }, [saveQuestEcho]);

  // ── Story Dialogue Handlers ──
  const handleStoryDialogueComplete = useCallback((result: DialogueResult) => {
    if (!state || !pendingBeatId) return;
    handleDialogueComplete(state, pendingBeatId, result);
    setShowStoryDialogue(false);
    setStoryCharacter(null);
    setStoryDialogueTree(null);
    setPendingBeatId(null);
    setState({ ...state, pendingStoryDialogue: null });
  }, [state, pendingBeatId]);

  // ── Enemy Encounter Dialogue Handlers ──
  const handleEnemyEncounterComplete = useCallback((result: DialogueResult) => {
    if (!state || !pendingEnemyId || !enemyEncounterData) return;
    
    const next = cloneState(state);
    
    // Mark this enemy as encountered so we skip dialogue next time
    if (!next.encounteredEnemyIds) next.encounteredEnemyIds = [];
    next.encounteredEnemyIds.push(pendingEnemyId);
    
    // Check for special outcomes in the dialogue result
    // Use the explicit peacefulEnd/combatStart flags from the dialogue
    let shouldStartCombat = result.combatStart || false;
    let isPeaceful = result.peacefulEnd || false;
    let combatAdvantage = 0;
    const isEnragedCombat = result.enragedCombat || false;
    
    // Process effects from the dialogue
    for (const effect of result.effects) {
      if (effect.type === 'gold' && typeof effect.value === 'number') {
        next.score += effect.value;
        addMessage(next, `Gained ${effect.value} gold!`, '#ffd700');
      } else if (effect.type === 'boon' && effect.value) {
        const boonData = effect.value as unknown as CharacterBoon;
        grantBoon(next, boonData);
        addMessage(next, `Gained boon: ${boonData.name}!`, '#44ff88');
      }
    }
    
    // Check the last choice made for special outcomes (fallback for older dialogue)
    const lastChoice = result.choicesMade[result.choicesMade.length - 1];
    if (lastChoice) {
      // Peaceful endings skip combat (fallback check)
      if (!isPeaceful && (lastChoice.includes('peaceful') || lastChoice.includes('escape') || lastChoice.includes('flee') || lastChoice.includes('talk_reward') || lastChoice.includes('peaceful_end') || lastChoice.includes('extort'))) {
        isPeaceful = true;
      }
      // Combat start (fallback check)
      if (!shouldStartCombat && (lastChoice.includes('attack') || lastChoice.includes('fight') || lastChoice.includes('combat'))) {
        shouldStartCombat = true;
      }
      // Advantage bonuses
      if (lastChoice.includes('exploit') || lastChoice.includes('observe_success')) {
        combatAdvantage = 15;
      } else if (lastChoice.includes('fight_anyway')) {
        combatAdvantage = 10;
      }
    }
    
    // Peaceful resolution means no combat
    if (isPeaceful) {
      shouldStartCombat = false;
    }
    
    // Apply rewards from the encounter
    if (enemyEncounterData.rewards) {
      for (const [rewardKey, reward] of Object.entries(enemyEncounterData.rewards)) {
        // Check if this reward was earned (based on choices made)
        const wasEarned = result.choicesMade.some(c => c.includes(rewardKey.split('_')[0] ?? ''));
        if (wasEarned) {
          if (reward.gold) {
            next.score += reward.gold;
            addMessage(next, `Gained ${reward.gold} gold!`, '#ffd700');
          }
          if (reward.boonType && reward.boonValue) {
            const boon: CharacterBoon = {
              id: `enemy_boon_${Date.now()}`,
              characterId: pendingEnemyId,
              characterName: enemyEncounterData.enemyName,
              name: `${enemyEncounterData.enemyName}'s Gift`,
              description: `+${reward.boonValue} ${reward.boonType.replace('_', ' ')}`,
              flavorText: `Gained from encounter`,
              icon: '★',
              color: '#44ff88',
              effects: [{ type: reward.boonType as BoonEffectType, value: reward.boonValue }],
              duration: 'floors',
              floorsRemaining: 3,
              grantedAt: state?.floorNumber ?? 1,
              isActive: true,
            };
            grantBoon(next, boon);
            addMessage(next, `Gained boon: ${boon.name}!`, '#44ff88');
          }
        }
      }
    }
    
    // Store advantage for combat
    if (combatAdvantage > 0) {
      (next as GameState & { _enemyCombatAdvantage?: number })._enemyCombatAdvantage = combatAdvantage;
    }
    
    // Check for affliction triggers based on dialogue choices and enemy type
    if (enemyEncounterData) {
      const factionId = getFactionForCreature(enemyEncounterData.enemyName);
      
      if (factionId) {
        // Check for bite/infection choices that trigger afflictions (check both IDs and labels)
        const biteKeywords = ['bitten', 'bite', 'infected', 'curse', 'transform', 'accept_transformation', 'blood_pact', 'drink_blood', 'accept_gift', 'accept', 'embrace', 'let it', 'allow'];
        const wasBittenById = result.choicesMade.some(choice => 
          biteKeywords.some(keyword => choice.toLowerCase().includes(keyword))
        );
        const wasBittenByLabel = result.choiceLabels?.some(label => 
          biteKeywords.some(keyword => label.toLowerCase().includes(keyword))
        ) ?? false;
        const wasBitten = wasBittenById || wasBittenByLabel;
        
        if (wasBitten) {
          const affliction = getAfflictionForFaction(factionId);
          if (affliction && !next.activeAffliction) {
            if (startAffliction(next, affliction.id, 'bite')) {
              addMessage(next, `You feel something change inside you...`, '#ff44ff');
              addMessage(next, affliction.stages[0]?.stageEnterMessage ?? 'A strange sensation washes over you.', '#aa44aa');
            }
          }
        }
        
        // Track faction reputation based on outcome
        if (next._bloodlineRef) {
          if (shouldStartCombat) {
            // Fighting reduces reputation slightly (they gave you a chance)
            modifyFactionReputation(next._bloodlineRef, factionId, -2, 'dialogue');
          } else {
            // Peaceful resolution increases reputation
            modifyFactionReputation(next._bloodlineRef, factionId, REPUTATION_CHANGES.PEACEFUL_RESOLUTION, 'befriend');
            addMessage(next, `Your reputation with the ${factionId} faction improved.`, '#88ff88');
          }
        }
      }
    }
    
    // If we should start combat, find the enemy and attack
    if (shouldStartCombat) {
      const enemy = next.monsters.find(m => m.id === pendingEnemyId);
      if (enemy && !enemy.isDead) {
        // Check if enemy is enraged (offended) - buff them significantly!
        if (isEnragedCombat) {
          // ENRAGED: +50% damage, +25% HP, +5 defense
          const hpBoost = Math.floor(enemy.stats.maxHp * 0.25);
          enemy.stats.maxHp += hpBoost;
          enemy.stats.hp += hpBoost;
          enemy.stats.attack = Math.floor(enemy.stats.attack * 1.5);
          enemy.stats.defense += 5;
          // Change color to indicate rage
          enemy.color = '#ff2222';
          addMessage(next, `${enemy.name} is ENRAGED! They attack with fury!`, '#ff2222');
          addMessage(next, `Their rage makes them stronger and deadlier!`, '#ff4444');
        } else {
          addMessage(next, `Combat begins with ${enemy.name}!`, '#ff6644');
        }
      }
    } else if (isPeaceful) {
      // Peaceful resolution - mark enemy as befriended (NOT dead!)
      const enemy = next.monsters.find(m => m.id === pendingEnemyId);
      if (enemy) {
        // Mark enemy as befriended - they become non-hostile and stay in the dungeon
        (enemy as any).isBefriended = true;
        (enemy as any).isHostile = false;
        addMessage(next, `${enemy.name} regards you with newfound respect.`, '#88ff88');
        // Give partial XP for peaceful resolution
        const xpGain = Math.floor(enemy.xp * 0.5);
        if (xpGain > 0) {
          next.score += xpGain;
          addMessage(next, `Gained ${xpGain} XP for diplomacy.`, '#aaffaa');
        }
      }
    }
    
    // Record journal entry for this encounter
    if (next._bloodlineRef && enemyEncounterData) {
      const journalEntry: import('./types').JournalEntry = {
        id: `journal_${pendingEnemyId}_${Date.now()}`,
        name: enemyEncounterData.characterName || enemyEncounterData.enemyName,
        title: enemyEncounterData.characterTitle,
        portraitUrl: enemyEncounterData.portraitUrl,
        summary: isPeaceful 
          ? `You resolved your encounter with ${enemyEncounterData.characterName || enemyEncounterData.enemyName} peacefully.`
          : isEnragedCombat
          ? `You offended ${enemyEncounterData.characterName || enemyEncounterData.enemyName}, triggering their fury!`
          : shouldStartCombat
          ? `You entered combat with ${enemyEncounterData.characterName || enemyEncounterData.enemyName}.`
          : `You encountered ${enemyEncounterData.characterName || enemyEncounterData.enemyName}.`,
        outcome: isPeaceful ? 'befriended' : shouldStartCombat ? 'combat' : 'peaceful',
        floor: next.floorNumber,
        zone: next.zone,
        timestamp: Date.now(),
        rewards: result.effects
          .filter(e => e.type === 'gold' || e.type === 'boon')
          .map(e => e.type === 'gold' ? `${e.value} gold` : `Boon: ${(e.value as any)?.name || 'Unknown'}`),
        gaveQuest: !!enemyEncounterData.quest,
      };
      
      if (!next._bloodlineRef.storyJournal) {
        next._bloodlineRef.storyJournal = [];
      }
      next._bloodlineRef.storyJournal.push(journalEntry);
      console.log('[Journal] Added entry:', journalEntry.name, 'portraitUrl:', journalEntry.portraitUrl?.substring(0, 50));
      
      // Persist the bloodline with the new journal entry
      saveBloodline(next._bloodlineRef);
    }
    
    setShowEnemyEncounter(false);
    setEnemyEncounterData(null);
    setPendingEnemyId(null);
    setState(next);
  }, [state, pendingEnemyId, enemyEncounterData, saveBloodline]);

  // Check if we should show enemy encounter dialogue before combat
  // ONLY runs in the narrative_test debug zone
  const checkEnemyEncounter = useCallback(async (enemyId: string, enemyName: string, enemy: import('./types').Entity): Promise<boolean> => {
    console.log('[EnemyEncounter] Checking encounter for:', enemyName, 'id:', enemyId);
    
    if (!state) {
      console.log('[EnemyEncounter] No state, skipping');
      return false;
    }
    
    // Only show AI enemy encounters in the narrative_test debug zone
    if (state.zone !== 'narrative_test') {
      console.log('[EnemyEncounter] Not in narrative_test zone, skipping AI encounters');
      return false;
    }
    
    // Skip if already encountered this enemy
    if (state.encounteredEnemyIds?.includes(enemyId)) {
      console.log('[EnemyEncounter] Already encountered, skipping');
      return false;
    }
    
    // Skip for bosses (always fight)
    if (enemy.isBoss) {
      console.log('[EnemyEncounter] Is boss, skipping');
      return false;
    }
    
    // Check if we have a cached encounter for this enemy
    const cache = getContentCache();
    let encounter = getEnemyEncounter(cache, enemyId);
    console.log('[EnemyEncounter] Cached encounter:', encounter ? 'found' : 'not found');
    
    if (!encounter) {
      // Generate encounter dialogue on-the-fly
      console.log('[EnemyEncounter] Generating encounter...');
      setIsGeneratingEnemyEncounter(true);
      setEncounterGenStage('dialogue');
      try {
        const generated = await generateEnemyEncounter({
          name: enemyName,
          race: enemy.name.toLowerCase().includes('goblin') ? 'goblin' :
                enemy.name.toLowerCase().includes('skeleton') || enemy.name.toLowerCase().includes('zombie') ? 'undead' :
                enemy.name.toLowerCase().includes('demon') || enemy.name.toLowerCase().includes('imp') ? 'demon' :
                enemy.name.toLowerCase().includes('rat') || enemy.name.toLowerCase().includes('bat') || enemy.name.toLowerCase().includes('spider') ? 'beast' :
                'human',
          description: `A ${enemyName} in the dungeon`,
          isBoss: enemy.isBoss ?? false,
          element: enemy.element,
        });
        
        console.log('[EnemyEncounter] Generation result:', generated ? 'success' : 'null');
        
        if (generated) {
          // Determine enemy race for portrait generation
          const enemyRace = enemy.name.toLowerCase().includes('goblin') ? 'goblin' :
                enemy.name.toLowerCase().includes('skeleton') || enemy.name.toLowerCase().includes('zombie') ? 'undead' :
                enemy.name.toLowerCase().includes('demon') || enemy.name.toLowerCase().includes('imp') ? 'demon' :
                enemy.name.toLowerCase().includes('rat') || enemy.name.toLowerCase().includes('bat') || enemy.name.toLowerCase().includes('spider') ? 'beast' :
                'creature';
          
          // Generate pixel art portrait from prompt
          let portraitUrl: string | undefined;
          if (generated.portraitPrompt) {
            console.log('[EnemyEncounter] Generating pixel art portrait...');
            setEncounterGenStage('portrait');
            try {
              portraitUrl = await generateEnemyPortraitFromPrompt(
                generated.portraitPrompt,
                enemyRace,
                generated.characterName || enemyName
              ) ?? undefined;
              
              // Preload the image so it's ready when dialogue shows
              if (portraitUrl) {
                console.log('[EnemyEncounter] Preloading portrait image...');
                setEncounterGenStage('loading');
                await preloadImage(portraitUrl);
                console.log('[EnemyEncounter] Portrait fully loaded!');
              }
            } catch (portraitErr) {
              console.warn('[EnemyEncounter] Portrait generation failed:', portraitErr);
            }
          }
          
          encounter = {
            enemyId,
            enemyName,
            characterName: generated.characterName || enemyName,
            characterTitle: generated.characterTitle || '',
            portraitPrompt: generated.portraitPrompt,
            portraitUrl,
            dialogue: generated.dialogue,
            rewards: generated.rewards as Record<string, import('./types').EnemyEncounterReward>,
            quest: generated.quest ? {
              name: generated.quest.name,
              description: generated.quest.description,
              objective: (generated.quest.objective as 'kill_enemies' | 'find_item' | 'reach_floor' | 'survive_floors') || 'kill_enemies',
              targetType: generated.quest.targetType,
              targetCount: generated.quest.targetCount,
              goldReward: generated.quest.goldReward,
              echoReward: generated.quest.echoReward,
            } : undefined,
          };
        }
      } catch (err) {
        console.warn('[EnemyEncounter] Generation failed:', err);
      }
      
      // If AI generation failed, use fallback encounter
      if (!encounter) {
        console.log('[EnemyEncounter] Using fallback encounter');
        // Generate a random name for fallback
        const fallbackNames = ['The Hollow One', 'Wandering Soul', 'Lost Shade', 'Broken Spirit', 'Trapped Wretch'];
        const fallbackName = fallbackNames[Math.floor(Math.random() * fallbackNames.length)] ?? 'Unknown';
        encounter = {
          enemyId,
          enemyName,
          characterName: fallbackName,
          characterTitle: `once ${enemyName}`,
          dialogue: {
            rootNodeId: 'encounter',
            nodes: {
              encounter: {
                id: 'encounter',
                speaker: 'narrator',
                text: `You come face to face with ${enemyName}. They regard you with wary eyes - another soul trapped in this endless dungeon.`,
                choices: [
                  {
                    id: 'attack',
                    label: '[Attack] Strike first',
                    responseText: 'You ready your weapon.',
                    effects: [],
                    successNodeId: 'combat',
                  },
                  {
                    id: 'talk',
                    label: '[Talk] Wait...',
                    responseText: 'You hold up your hand.',
                    effects: [],
                    successNodeId: 'talk_result',
                  },
                  {
                    id: 'observe',
                    label: '[Observe] Study them',
                    responseText: 'You watch carefully.',
                    effects: [],
                    successNodeId: 'observe_result',
                  },
                ],
              },
              combat: {
                id: 'combat',
                speaker: 'narrator',
                text: 'Combat begins.',
              },
              talk_result: {
                id: 'talk_result',
                speaker: 'character',
                text: `The ${enemyName} pauses, uncertain. For a moment, you see something almost human in their eyes - then it fades, replaced by the hollow hunger of the dungeon.`,
                choices: [
                  {
                    id: 'fight',
                    label: 'There is no peace here',
                    responseText: 'You attack.',
                    effects: [],
                    successNodeId: 'combat',
                  },
                  {
                    id: 'leave',
                    label: 'Back away slowly',
                    responseText: 'You retreat.',
                    effects: [],
                    successNodeId: 'peaceful',
                  },
                ],
              },
              observe_result: {
                id: 'observe_result',
                speaker: 'narrator',
                text: `You notice the ${enemyName} is injured, desperate. How long have they been trapped here?`,
                choices: [
                  {
                    id: 'mercy',
                    label: 'Show mercy',
                    responseText: 'You lower your weapon.',
                    effects: [],
                    successNodeId: 'peaceful',
                  },
                  {
                    id: 'exploit',
                    label: 'Exploit their weakness',
                    responseText: 'You strike at their wound.',
                    effects: [],
                    successNodeId: 'combat',
                  },
                ],
              },
              peaceful: {
                id: 'peaceful',
                speaker: 'narrator',
                text: `The ${enemyName} watches you go, neither attacking nor following. Perhaps not all encounters must end in blood.`,
              },
            },
          },
          rewards: {},
        };
      }
      
      setIsGeneratingEnemyEncounter(false);
    }
    
    if (encounter) {
      console.log('[EnemyEncounter] Showing encounter dialogue');
      setEnemyEncounterData(encounter);
      setPendingEnemyId(enemyId);
      setShowEnemyEncounter(true);
      return true;
    }
    
    console.log('[EnemyEncounter] No encounter to show');
    return false;
  }, [state]);

  // ── Room Event Handlers ──
  // Start background art generation when floor changes
  const prevFloorForArtRef = useRef(0);
  useEffect(() => {
    if (!state || state.zone !== 'narrative_test') return;
    if (state.floorNumber === prevFloorForArtRef.current) return;
    
    prevFloorForArtRef.current = state.floorNumber;
    console.log('[RoomEvent] Starting background art generation for floor', state.floorNumber);
    
    // Start pre-generating art for potential events on this floor
    startBackgroundArtGeneration(state.floorNumber, generateRoomEventArt);
  }, [state?.floorNumber, state?.zone]);

  // Check for pending room event and use cached or generate art
  useEffect(() => {
    if (!state?.pendingRoomEvent || showRoomEvent || isGeneratingRoomEventArt) return;
    if (state.pendingRoomEvent.resolved) return;
    
    const prepareArt = async () => {
      const event = state.pendingRoomEvent!.event;
      
      // Check cache first
      const cachedArt = getRoomEventArtFromCache(event.id);
      if (cachedArt) {
        console.log('[RoomEvent] Using cached art for:', event.name);
        const next = cloneState(state);
        if (next.pendingRoomEvent) {
          next.pendingRoomEvent.artUrl = cachedArt;
        }
        setState(next);
        setShowRoomEvent(true);
        return;
      }
      
      // No cached art, generate on-demand
      setIsGeneratingRoomEventArt(true);
      try {
        console.log('[RoomEvent] Generating art on-demand for:', event.name, 'prompt:', event.artPrompt?.substring(0, 50));
        
        const artUrl = await generateRoomEventArt(event.name, event.artPrompt);
        
        if (artUrl) {
          console.log('[RoomEvent] Art generated successfully:', artUrl.substring(0, 50));
          try {
            await preloadImage(artUrl);
            console.log('[RoomEvent] Art preloaded');
          } catch (preloadErr) {
            console.warn('[RoomEvent] Art preload failed but continuing:', preloadErr);
          }
          
          // Cache it for future use
          cacheRoomEventArt(event.id, artUrl);
          
          // Update the event with the art URL
          const next = cloneState(state);
          if (next.pendingRoomEvent) {
            next.pendingRoomEvent.artUrl = artUrl;
          }
          setState(next);
        } else {
          console.warn('[RoomEvent] Art generation returned null for:', event.name);
        }
        
        setShowRoomEvent(true);
      } catch (err) {
        console.error('[RoomEvent] Art generation failed with error:', err);
        // Show the event anyway without art
        setShowRoomEvent(true);
      } finally {
        setIsGeneratingRoomEventArt(false);
      }
    };
    
    prepareArt();
  }, [state?.pendingRoomEvent, showRoomEvent, isGeneratingRoomEventArt]);

  // Handle room event completion
  const handleRoomEventComplete = useCallback((
    outcome: import('./types').RoomEventOutcome,
    _skillResult: SkillCheckResult
  ) => {
    if (!state?.pendingRoomEvent) return;
    
    const next = cloneState(state);
    const event = next.pendingRoomEvent!.event;
    
    console.log('[RoomEvent] Event completed:', event.name, 'Outcome:', outcome.description);
    
    // Apply effects
    for (const effect of outcome.effects) {
      switch (effect.type) {
        case 'damage':
          if (effect.value) {
            next.player.stats.hp = Math.max(1, next.player.stats.hp - effect.value);
            addMessage(next, effect.message || `Took ${effect.value} damage!`, '#ff6644');
          }
          break;
          
        case 'heal':
          if (effect.value) {
            const healAmt = Math.min(effect.value, next.player.stats.maxHp - next.player.stats.hp);
            next.player.stats.hp += healAmt;
            addMessage(next, effect.message || `Healed ${healAmt} HP!`, '#44ff44');
          }
          break;
          
        case 'gold':
          if (effect.value) {
            if (effect.value > 0) {
              next.score += effect.value;
              next.runStats.goldEarned += effect.value;
              addMessage(next, effect.message || `Found ${effect.value} gold!`, '#ffd700');
            } else {
              next.score = Math.max(0, next.score + effect.value);
              addMessage(next, effect.message || `Lost ${Math.abs(effect.value)} gold!`, '#ff6644');
            }
          }
          break;
          
        case 'stat_buff':
        case 'stat_debuff':
          if (effect.value && effect.duration && effect.target) {
            const statKey = effect.target as keyof typeof next.player.stats;
            const modifiers: Partial<typeof next.player.stats> = {};
            modifiers[statKey] = effect.type === 'stat_buff' ? effect.value : -effect.value;
            
            addRoomEventBuff(
              next,
              effect.type === 'stat_buff' ? 'Blessing' : 'Curse',
              effect.message || `${effect.target} ${effect.type === 'stat_buff' ? '+' : ''}${effect.type === 'stat_buff' ? effect.value : -effect.value}`,
              modifiers,
              effect.duration,
              effect.type === 'stat_debuff'
            );
            addMessage(next, effect.message || `${effect.target} modified for ${effect.duration} floors!`, effect.type === 'stat_buff' ? '#44ff44' : '#ff6644');
          }
          break;
          
        case 'skill_bonus':
          if (effect.value && effect.target && next.skills) {
            const skillKey = effect.target as keyof typeof next.skills;
            if (skillKey in next.skills) {
              next.skills[skillKey] += effect.value;
              addMessage(next, effect.message || `+${effect.value} ${effect.target} permanently!`, '#ffdd00');
            }
          }
          break;
          
        case 'spawn_enemy':
        case 'spawn_elite':
          addMessage(next, effect.message || 'An enemy appears!', '#ff6644');
          // Note: Actual spawning would need to be handled by the engine
          break;
          
        case 'transformation':
          addMessage(next, effect.message || 'You feel your body changing...', '#aa44aa');
          // Start the affliction if target matches an affliction ID
          if (effect.target) {
            const afflictionId = effect.target.replace('_curse', '_curse'); // Normalize
            startAffliction(next, afflictionId, 'room_event');
          }
          break;
          
        default:
          if (effect.message) {
            addMessage(next, effect.message, '#aaddaa');
          }
      }
    }
    
    // Mark event as resolved and clear pending
    next.pendingRoomEvent = null;
    
    setShowRoomEvent(false);
    setState(next);
  }, [state]);

  // ── Reputation-based Transformation Offer ──
  // Check if any faction reputation is high enough to offer transformation
  useEffect(() => {
    if (!state || !bloodline || state.activeAffliction || pendingReputationTransform) return;
    
    for (const faction of FACTION_DEFS) {
      if (offeredTransformFactions.has(faction.id)) continue;
      
      if (canTransformIntoFaction(bloodline, faction.id)) {
        const affliction = getAfflictionForFaction(faction.id);
        if (affliction) {
          console.log('[Transform] Reputation high enough for', faction.id, 'transformation');
          setPendingReputationTransform(faction.id);
          break;
        }
      }
    }
  }, [state, bloodline, state?.activeAffliction, pendingReputationTransform, offeredTransformFactions]);

  // Handle accepting/declining reputation-based transformation
  const handleReputationTransformAccept = useCallback(() => {
    if (!state || !pendingReputationTransform) return;
    
    const next = cloneState(state);
    const affliction = getAfflictionForFaction(pendingReputationTransform);
    
    if (affliction && startAffliction(next, affliction.id, 'reputation')) {
      addMessage(next, `You embrace the ${pendingReputationTransform} curse...`, '#ff44ff');
      addMessage(next, affliction.stages[0]?.stageEnterMessage ?? 'A strange sensation washes over you.', '#aa44aa');
    }
    
    setOfferedTransformFactions(prev => new Set([...prev, pendingReputationTransform]));
    setPendingReputationTransform(null);
    setState(next);
  }, [state, pendingReputationTransform]);

  const handleReputationTransformDecline = useCallback(() => {
    if (!pendingReputationTransform) return;
    setOfferedTransformFactions(prev => new Set([...prev, pendingReputationTransform]));
    setPendingReputationTransform(null);
  }, [pendingReputationTransform]);

  // ── Skill Check/Encounter Handlers ──
  const handleSkillCheckComplete = useCallback((result: SkillCheckResult) => {
    if (!state || !pendingEncounter) return;
    
    const next = cloneState(state);
    
    // Mark encounter as interacted
    const enc = next.interactables?.find(i => i.id === pendingEncounter.id);
    if (enc) enc.interacted = true;
    
    // Apply results based on outcome
    const outcomeMessages: { [key: string]: string } = {
      critical: '★ Critical success!',
      success: 'Success!',
      partial: 'Partial success...',
      fail: 'Failed.',
      critical_fail: '✗ Critical failure!',
    };
    
    const outcomeColors: { [key: string]: string } = {
      critical: '#ffd700',
      success: '#44dd77',
      partial: '#ffcc33',
      fail: '#cc6644',
      critical_fail: '#ff2222',
    };
    
    // Add message about the outcome
    next.messages.push({
      text: `${outcomeMessages[result.outcome] || 'Complete.'} (${result.total} vs ${result.target})`,
      color: outcomeColors[result.outcome] || '#aaa',
      turn: next.turn,
    });
    
    // Apply effects based on outcome
    if (result.outcome === 'critical' || result.outcome === 'success') {
      const effect = pendingEncounter.successEffect;
      if (effect) {
        switch (effect.type) {
          case 'gold':
            next.score += typeof effect.value === 'number' ? effect.value : 0;
            next.messages.push({ text: `+${effect.value} gold!`, color: '#ffd700', turn: next.turn });
            break;
          case 'heal':
            const healAmt = typeof effect.value === 'number' ? effect.value : 10;
            next.player.stats.hp = Math.min(next.player.stats.maxHp, next.player.stats.hp + healAmt);
            next.messages.push({ text: `+${healAmt} HP!`, color: '#44dd77', turn: next.turn });
            break;
          case 'item':
            next.messages.push({ text: `Found: ${effect.value}!`, color: '#88ccff', turn: next.turn });
            break;
          case 'info':
            next.messages.push({ text: `Gained knowledge: ${effect.value}`, color: '#cc88ff', turn: next.turn });
            break;
        }
      }
    } else if (result.outcome === 'partial' && pendingEncounter.partialEffect) {
      const effect = pendingEncounter.partialEffect;
      if (effect.type === 'gold') {
        next.score += typeof effect.value === 'number' ? effect.value : 0;
        next.messages.push({ text: `+${effect.value} gold`, color: '#ffcc33', turn: next.turn });
      } else if (effect.type === 'heal') {
        const healAmt = typeof effect.value === 'number' ? effect.value : 5;
        next.player.stats.hp = Math.min(next.player.stats.maxHp, next.player.stats.hp + healAmt);
        next.messages.push({ text: `+${healAmt} HP`, color: '#88cc88', turn: next.turn });
      }
    } else if ((result.outcome === 'fail' || result.outcome === 'critical_fail') && pendingEncounter.failureEffect) {
      const penalty = pendingEncounter.failureEffect;
      if (penalty.type === 'damage') {
        const dmg = result.outcome === 'critical_fail' ? penalty.value * 2 : penalty.value;
        next.player.stats.hp = Math.max(0, next.player.stats.hp - dmg);
        next.messages.push({ text: `-${dmg} HP!`, color: '#ff4444', turn: next.turn });
      } else if (penalty.type === 'hunger') {
        next.hunger.current = Math.max(0, next.hunger.current - penalty.value);
        next.messages.push({ text: `Hunger -${penalty.value}`, color: '#cc6644', turn: next.turn });
      }
    }
    
    // Track skill check for character quests
    if (result.outcome === 'critical' || result.outcome === 'success') {
      updateCharacterQuestProgress(next, { type: 'skill_check_passed' });
    }
    
    setShowSkillCheck(false);
    setPendingEncounter(null);
    setState(next);
  }, [state, pendingEncounter]);

  // Check for pending story dialogues when state changes
  useEffect(() => {
    if (!state?.pendingStoryDialogue || showStoryDialogue) return;

    const { beatId } = state.pendingStoryDialogue;
    const cache = getContentCache();
    if (!cache) return;

    const beats = getStoryBeatsForFloor(cache, state.floorNumber);
    const beat = beats?.find((b: NarrativeBeat) => b.id === beatId);
    if (!beat || !beat.dialogue) return;

    const character = findCharacterById(state, beat.characterId ?? '');
    if (!character) return;

    setStoryCharacter(character);
    setStoryDialogueTree(beat.dialogue);
    setPendingBeatId(beatId);
    setShowStoryDialogue(true);
    // First story character - show tutorial
    tryShowElderTip(ELDER_STORY_CHARACTER);
  }, [state?.pendingStoryDialogue, state?.floorNumber, showStoryDialogue, tryShowElderTip]);

  const openQuestLog = useCallback((fromScreen: string) => {
    setShowQuestLog(true);
    const qe = questEchoRef.current;
    trackQuestLogOpened({
      screen: fromScreen,
      activeQuests: qe.activeQuests.length,
      completedQuests: qe.activeQuests.filter(q => q.completed).length,
      totalEchoes: qe.echoes,
    });
  }, []);

  const openEchoTree = useCallback((fromScreen: string) => {
    setShowEchoTree(true);
    const qe = questEchoRef.current;
    trackEchoTreeOpened({
      screen: fromScreen,
      totalEchoes: qe.echoes,
      nodesUnlocked: qe.unlockedEchoNodes.length,
      totalNodes: getEchoNodeCount(),
    });
  }, []);

  const handleWait = useCallback(() => {
    if (!state || state.gameOver) return;
    gpStart('wait:clone');
    const next = cloneState(state);
    gpEnd('wait:clone');
    gpStart('wait:turn');
    const result = safeEngineCall('waitTurn', () => { waitTurn(next); return true; });
    gpEnd('wait:turn');
    if (result === null) return;
    gpStart('wait:handleChange');
    handleChange(next);
    gpEnd('wait:handleChange');
  }, [state, handleChange]);

  const handleRageStrike = useCallback(() => {
    if (!state || state.gameOver) return;
    const next = gpTime('rage:clone', () => cloneState(state));
    gpStart('rage:strike');
    const result = safeEngineCall('rageStrike', () => rageStrike(next));
    gpEnd('rage:strike');
    trackAbilityUsed({
      ability: 'rage_strike', playerClass: state.playerClass,
      floor: state.floorNumber, zone: state.zone,
      hpPercent: state.player.stats.maxHp > 0 ? Math.round((state.player.stats.hp / state.player.stats.maxHp) * 100) : 0,
      success: !!result, source: 'manual',
    });
    if (result) handleChange(next);
  }, [state, handleChange]);

  const handleSacredVow = useCallback(() => {
    if (!state || state.gameOver) return;
    const next = gpTime('vow:clone', () => cloneState(state));
    gpStart('vow:cast');
    const result = safeEngineCall('sacredVow', () => sacredVow(next));
    gpEnd('vow:cast');
    trackAbilityUsed({
      ability: 'sacred_vow', playerClass: state.playerClass,
      floor: state.floorNumber, zone: state.zone,
      hpPercent: state.player.stats.maxHp > 0 ? Math.round((state.player.stats.hp / state.player.stats.maxHp) * 100) : 0,
      success: !!result, source: 'manual',
    });
    if (result) handleChange(next);
  }, [state, handleChange]);

  const handleShadowStep = useCallback(() => {
    if (!state || state.gameOver) return;
    const next = gpTime('shadow:clone', () => cloneState(state));
    gpStart('shadow:step');
    const result = safeEngineCall('shadowStep', () => shadowStep(next));
    gpEnd('shadow:step');
    trackAbilityUsed({
      ability: 'shadow_step', playerClass: state.playerClass,
      floor: state.floorNumber, zone: state.zone,
      hpPercent: state.player.stats.maxHp > 0 ? Math.round((state.player.stats.hp / state.player.stats.maxHp) * 100) : 0,
      success: !!result, source: 'manual',
    });
    if (result) handleChange(next);
  }, [state, handleChange]);

  const handleArcaneBlast = useCallback(() => {
    if (!state || state.gameOver) return;
    const next = gpTime('blast:clone', () => cloneState(state));
    gpStart('blast:cast');
    const result = safeEngineCall('arcaneBlast', () => arcaneBlast(next));
    gpEnd('blast:cast');
    trackAbilityUsed({
      ability: 'arcane_blast', playerClass: state.playerClass,
      floor: state.floorNumber, zone: state.zone,
      hpPercent: state.player.stats.maxHp > 0 ? Math.round((state.player.stats.hp / state.player.stats.maxHp) * 100) : 0,
      success: !!result, source: 'manual',
    });
    if (result) handleChange(next);
  }, [state, handleChange]);

  const handleHuntersMark = useCallback(() => {
    if (!state || state.gameOver) return;
    const next = gpTime('mark:clone', () => cloneState(state));
    gpStart('mark:cast');
    const result = safeEngineCall('huntersMark', () => huntersMark(next));
    gpEnd('mark:cast');
    trackAbilityUsed({
      ability: 'hunters_mark', playerClass: state.playerClass,
      floor: state.floorNumber, zone: state.zone,
      hpPercent: state.player.stats.maxHp > 0 ? Math.round((state.player.stats.hp / state.player.stats.maxHp) * 100) : 0,
      success: !!result, source: 'manual',
    });
    if (result) handleChange(next);
  }, [state, handleChange]);

  // Store pending movement for after enemy encounter dialogue
  const pendingMoveRef = useRef<{ dx: number; dy: number } | null>(null);
  
  const handleDPad = useCallback(
    (dx: number, dy: number) => {
      if (!state || state.gameOver) return;
      
      // Check for enemy at target position before moving
      const targetX = state.player.pos.x + dx;
      const targetY = state.player.pos.y + dy;
      const targetEnemy = state.monsters.find(m => 
        !m.isDead && m.pos.x === targetX && m.pos.y === targetY
      );
      
      // Debug: log every move attempt
      if (targetEnemy) {
        console.log('[DPad] Moving toward enemy:', targetEnemy.name, 'at floor', state.floorNumber);
      }
      
      // If there's an enemy and we haven't encountered them, show dialogue
      // Works on ALL zones - ALL creatures get dialogue options
      if (targetEnemy && !state.encounteredEnemyIds?.includes(targetEnemy.id)) {
        console.log('[DPad] Enemy encounter check:', targetEnemy.name);
        
        // Store the pending move and trigger async encounter generation
        pendingMoveRef.current = { dx, dy };
        console.log('[DPad] Triggering encounter generation...');
        
        // Fire and forget - the async function will set state when ready
        (async () => {
          try {
            const showed = await checkEnemyEncounter(targetEnemy.id, targetEnemy.name, targetEnemy);
            console.log('[DPad] Encounter check result:', showed);
            if (!showed) {
              // Generation failed, proceed with normal attack
              pendingMoveRef.current = null;
              const next = cloneState(state);
              const moved = safeEngineCall('movePlayer', () => movePlayer(next, dx, dy));
              if (moved) handleChange(next);
            }
          } catch (err) {
            console.error('[DPad] Encounter check error:', err);
            // On error, proceed with normal attack
            pendingMoveRef.current = null;
            const next = cloneState(state);
            const moved = safeEngineCall('movePlayer', () => movePlayer(next, dx, dy));
            if (moved) handleChange(next);
          }
        })();
        return; // Don't move yet, wait for dialogue
      }
      
      gpStart('dpad:clone');
      const next = cloneState(state);
      gpEnd('dpad:clone');
      gpStart('dpad:move');
      const moved = safeEngineCall('movePlayer', () => movePlayer(next, dx, dy));
      gpEnd('dpad:move');
      if (moved === null) return;
      if (moved) {
        gpStart('dpad:handleChange');
        handleChange(next);
        gpEnd('dpad:handleChange');
      }
    },
    [state, handleChange, checkEnemyEncounter],
  );

  useEffect(() => {
    if (screen !== 'game' || !state) return;
    const handleKey = (e: KeyboardEvent) => {
      let dx = 0;
      let dy = 0;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          dy = -1;
          break;
        case 'ArrowDown':
        case 's':
          dy = 1;
          break;
        case 'ArrowLeft':
        case 'a':
          dx = -1;
          break;
        case 'ArrowRight':
        case 'd':
          dx = 1;
          break;
        case 'i':
          setShowInventory((v) => !v);
          return;
        case '.':
          handleWait();
          return;
        default:
          return;
      }
      if (dx !== 0 || dy !== 0) {
        // Check for enemy at target position - show dialogue before combat
        const targetX = state.player.pos.x + dx;
        const targetY = state.player.pos.y + dy;
        const targetEnemy = state.monsters.find(m => 
          !m.isDead && m.pos.x === targetX && m.pos.y === targetY
        );
        
        if (targetEnemy && !state.encounteredEnemyIds?.includes(targetEnemy.id)) {
          console.log('[Keyboard] Enemy at target, triggering encounter:', targetEnemy.name);
          (async () => {
            try {
              const showed = await checkEnemyEncounter(targetEnemy.id, targetEnemy.name, targetEnemy);
              if (!showed) {
                const next = cloneState(state);
                const moved = safeEngineCall('movePlayer_keyboard', () => movePlayer(next, dx, dy));
                if (moved) handleChange(next);
              }
            } catch (err) {
              console.error('[Keyboard] Encounter check error:', err);
              const next = cloneState(state);
              const moved = safeEngineCall('movePlayer_keyboard', () => movePlayer(next, dx, dy));
              if (moved) handleChange(next);
            }
          })();
          return;
        }
        
        const next = cloneState(state);
        const moved = safeEngineCall('movePlayer_keyboard', () => movePlayer(next, dx, dy));
        if (moved === null) return; // engine error — skip
        if (moved) handleChange(next);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [screen, state, handleChange, handleWait, checkEnemyEncounter]);

  // Secret key combo for content seeder (Ctrl+Shift+G)
  useEffect(() => {
    const handleSeederKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'G') {
        e.preventDefault();
        setShowContentSeeder(v => !v);
      }
    };
    window.addEventListener('keydown', handleSeederKey);
    return () => window.removeEventListener('keydown', handleSeederKey);
  }, []);

  // Auto-play loop — uses a Web Worker timer for consistent tick rate
  useEffect(() => {
    // Skip tabVisible check when runInBackground is enabled
    const shouldPauseForTab = !runInBackground && !tabVisible;
    if (!autoPlay || shouldPauseForTab || screen !== 'game' || !state || state.gameOver) {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      if (state?.gameOver) setAutoPlay(false);
      return;
    }

    const blob = new Blob(
      [`setInterval(()=>postMessage('tick'),200)`],
      { type: 'application/javascript' },
    );
    const worker = new Worker(URL.createObjectURL(blob));
    workerRef.current = worker;

    worker.onmessage = () => {
      setState((prev) => {
        if (!prev || prev.gameOver) {
          setAutoPlay(false);
          return prev;
        }
        // Auto-dismiss mercenary hire dialog so it doesn't block autoplay
        if (prev.pendingMercenary) {
          const dismissed = cloneState(prev);
          dismissed.pendingMercenary = null;
          setShowMercHire(false);
          return dismissed;
        }
        // Auto-dismiss story dialogue during autoplay
        if (prev.pendingStoryDialogue) {
          const dismissed = cloneState(prev);
          // Mark beat as triggered so it doesn't re-show
          if (pendingBeatId) {
            handleDialogueComplete(dismissed, pendingBeatId, {
              choicesMade: [],
              relationshipChange: 0,
              effects: [],
              skillCheckResults: [],
            });
          }
          dismissed.pendingStoryDialogue = null;
          setShowStoryDialogue(false);
          setStoryCharacter(null);
          setStoryDialogueTree(null);
          setPendingBeatId(null);
          return dismissed;
        }
        // Auto-dismiss skill check modals during autoplay
        if (pendingEncounter) {
          const dismissed = cloneState(prev);
          const enc = dismissed.interactables?.find(i => i.id === pendingEncounter.id);
          if (enc) enc.interacted = true;
          setShowSkillCheck(false);
          setPendingEncounter(null);
          return dismissed;
        }
        // Auto-dismiss room events during autoplay (resolve with failure outcome to continue)
        if (prev.pendingRoomEvent && !prev.pendingRoomEvent.resolved) {
          const dismissed = cloneState(prev);
          dismissed.pendingRoomEvent = null;
          setShowRoomEvent(false);
          return dismissed;
        }
        // Explore mode: pause auto-play when any enemy is visible so the player can fight manually
        if (autoPlayMode === 'explore') {
          const hasVisibleEnemy = prev.monsters.some(
            (m) => !m.isDead && prev.floor.visible[m.pos.y]?.[m.pos.x] === true,
          );
          if (hasVisibleEnemy) {
            setAutoPlay(false);
            return prev;
          }
        }
        const next = safeEngineCall('autoplayStep', () => autoplayStep(prev));
        if (next) {
          // Track autoplay turn + quest progress (mirrors handleChange logic)
          {
            const extra = questExtraRef.current;
            extra.autoTurns = (extra.autoTurns ?? 0) + 1;
            extra.classKills = extra.classKills ?? {};
            extra.classKills[next.playerClass] = next.runStats.kills;
            extra.mercenariesHired = next.runStats.mercenariesHired;
            extra.npcsTalkedTo = next.runStats.npcsTalkedTo;
            extra.skillPointsSpent = next.unlockedNodes.length;
            const qe = structuredClone(questEchoRef.current);
            const runTracker = buildRunTracker(next, extra);
            const bl = bloodlineRef.current;
            const bestiaryCount = Object.keys(bl.bestiary ?? {}).length;
            const ancestorCount = bl.ancestors.length;
            const traitCount = bl.unlockedTraits.length;
            const prevCompleted = new Set(qe.activeQuests.filter(q => q.completed).map(q => q.templateId));
            updateQuestProgress(qe, runTracker, bestiaryCount, ancestorCount, traitCount);
            for (const quest of qe.activeQuests) {
              if (quest.completed && !prevCompleted.has(quest.templateId)) {
                const tmpl = getQuestTemplate(quest.templateId);
                if (tmpl) {
                  trackQuestCompleted({
                    questId: tmpl.id, questName: tmpl.name, questTier: tmpl.tier,
                    reward: tmpl.reward, totalEchoesEarned: qe.totalEchoesEarned,
                    totalQuestsCompleted: qe.completedQuestIds.length,
                    playerClass: next.playerClass, floor: next.floorNumber, zone: next.zone,
                  });
                }
              }
            }
            questEchoRef.current = qe;
            setQuestEchoData(qe);
          }
          // Track bestiary encounters during autoplay
          {
            const bl = bloodlineRef.current;
            if (!bl.bestiary) bl.bestiary = {};
            for (const m of next.monsters) {
              if (!m.isDead && !bl.bestiary[m.name]) {
                bl.bestiary[m.name] = {
                  name: m.name, encountered: true, killed: false, killCount: 0,
                  stats: { ...m.stats, hp: m.stats.maxHp },
                  isBoss: m.isBoss, color: m.color, char: m.char,
                  baseName: m.baseName ?? m.name,
                };
              }
            }
          }
          if (next.gameOver) {
            processDeathBloodline(next);
            setTimeout(() => {
              const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
              trackPlayerDeath(buildDeathParams(next, duration, bloodlineRef.current.generation, true));
              submitScore(next.score, duration);
              setScreen('gameover');
              setAutoPlay(false);
            }, 800);
          }
          // Clear projectiles after a brief moment (same as handleChange)
          if (next.projectiles && next.projectiles.length > 0) {
            setTimeout(() => {
              setState(prev => {
                if (!prev || !prev.projectiles?.length) return prev;
                return { ...prev, projectiles: [] };
              });
            }, 250);
          }
          return next;
        }
        return prev;
      });
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [autoPlay, autoPlayMode, tabVisible, runInBackground, screen, state?.gameOver, processDeathBloodline, isPremium, pendingEncounter]);

  // Seeder mode: auto-trigger enemy encounters before autoplay attacks
  useEffect(() => {
    if (!autoPlay || !autoPlaySeederMode || !state || state.gameOver) return;
    if (showEnemyEncounter || seederEncounterPendingRef.current) return; // Already showing encounter
    // Wait for patron/story dialogue to complete first
    if (state.pendingStoryDialogue || showStoryDialogue) return;
    // Wait for room events to complete
    if (state.pendingRoomEvent || showRoomEvent) return;
    
    // Find visible enemies that haven't been encountered yet
    const unencounteredEnemy = state.monsters.find(m => 
      !m.isDead && 
      state.floor.visible[m.pos.y]?.[m.pos.x] &&
      !state.encounteredEnemyIds?.includes(m.id)
    );
    
    if (unencounteredEnemy) {
      console.log('[Seeder] Found unencountered enemy, triggering dialogue:', unencounteredEnemy.name);
      seederEncounterPendingRef.current = true;
      checkEnemyEncounter(unencounteredEnemy.id, unencounteredEnemy.name, unencounteredEnemy)
        .then(() => {
          seederEncounterPendingRef.current = false;
        })
        .catch(() => {
          seederEncounterPendingRef.current = false;
        });
    }
  }, [autoPlay, autoPlaySeederMode, state, showEnemyEncounter, showStoryDialogue, showRoomEvent, checkEnemyEncounter]);

  // Seeder mode: auto-progress through enemy dialogue by simulating clicks
  // Uses interval to keep checking for buttons as dialogue progresses through nodes
  useEffect(() => {
    if (!autoPlaySeederMode || !showEnemyEncounter || !enemyEncounterData) return;
    
    // Keep checking for buttons to click every 1.5 seconds
    const interval = setInterval(() => {
      // Find dialogue choice buttons
      const dialogueButtons = document.querySelectorAll('[data-dialogue-choice]');
      if (dialogueButtons.length > 0) {
        // Prefer peaceful/diplomatic options if available
        const peaceButton = Array.from(dialogueButtons).find(btn => 
          btn.textContent?.toLowerCase().includes('peace') ||
          btn.textContent?.toLowerCase().includes('talk') ||
          btn.textContent?.toLowerCase().includes('leave') ||
          btn.textContent?.toLowerCase().includes('diplomat')
        );
        const targetButton = peaceButton || dialogueButtons[Math.floor(Math.random() * dialogueButtons.length)];
        console.log('[Seeder] Auto-clicking dialogue choice:', (targetButton as HTMLElement)?.textContent?.trim());
        (targetButton as HTMLElement)?.click();
        return;
      }
      
      // Look for continue button
      const continueBtn = document.querySelector('[data-dialogue-continue]');
      if (continueBtn) {
        console.log('[Seeder] Auto-clicking continue button');
        (continueBtn as HTMLElement)?.click();
        return;
      }
    }, 1500); // Check every 1.5 seconds
    
    return () => clearInterval(interval);
  }, [autoPlaySeederMode, showEnemyEncounter, enemyEncounterData]);

  // Seeder mode: auto-progress through story/patron dialogue
  useEffect(() => {
    if (!autoPlaySeederMode || !showStoryDialogue) return;
    
    // Keep checking for buttons to click every 1.5 seconds
    const interval = setInterval(() => {
      // Find dialogue choice buttons
      const dialogueButtons = document.querySelectorAll('[data-dialogue-choice]');
      if (dialogueButtons.length > 0) {
        // Pick a random choice for story dialogues
        const targetButton = dialogueButtons[Math.floor(Math.random() * dialogueButtons.length)];
        console.log('[Seeder] Auto-clicking story dialogue choice');
        (targetButton as HTMLElement)?.click();
        return;
      }
      
      // Look for continue button
      const continueBtn = document.querySelector('[data-dialogue-continue]');
      if (continueBtn) {
        console.log('[Seeder] Auto-clicking story dialogue continue button');
        (continueBtn as HTMLElement)?.click();
        return;
      }
    }, 1500);
    
    return () => clearInterval(interval);
  }, [autoPlaySeederMode, showStoryDialogue]);

  // Auto-play: auto-complete room events by clicking available buttons
  // Uses interval to keep checking as the room event progresses through phases
  useEffect(() => {
    if (!autoPlay || !showRoomEvent || !state?.pendingRoomEvent) return;
    
    // Keep checking for buttons every 500ms
    const interval = setInterval(() => {
      // Priority: skill check roll button (during skill check phase)
      const rollBtn = document.querySelector('[data-skill-check-roll]');
      if (rollBtn) {
        console.log('[AutoPlay] Auto-clicking skill check roll button');
        (rollBtn as HTMLElement)?.click();
        return;
      }
      // Priority: skill check continue button (after roll)
      const skillContinueBtn = document.querySelector('[data-skill-check-continue]');
      if (skillContinueBtn) {
        console.log('[AutoPlay] Auto-clicking skill check continue button');
        (skillContinueBtn as HTMLElement)?.click();
        return;
      }
      // Look for the attempt skill check button (intro phase)
      const attemptBtn = document.querySelector('[data-room-event-attempt]');
      if (attemptBtn) {
        console.log('[AutoPlay] Auto-clicking room event attempt button');
        (attemptBtn as HTMLElement)?.click();
        return;
      }
      // Look for continue button (outcome phase)
      const continueBtn = document.querySelector('[data-room-event-continue]');
      if (continueBtn) {
        console.log('[AutoPlay] Auto-clicking room event continue button');
        (continueBtn as HTMLElement)?.click();
        return;
      }
    }, 500); // Check every 500ms
    
    return () => clearInterval(interval);
  }, [autoPlay, showRoomEvent, state?.pendingRoomEvent]);

  async function submitScore(score: number, duration: number) {
    // Guard: don't submit invalid scores
    if (!score || score <= 0 || !Number.isFinite(score)) return;
    if (!duration || duration <= 0 || !Number.isFinite(duration)) return;
    // Respect the platform's 60-second rate limit
    const now = Date.now();
    if (now - lastScoreSubmitRef.current < 61000) return;
    const roundedScore = Math.round(score);
    const roundedDuration = Math.round(duration);
    // Try with the pre-created token first (token mode)
    const token = scoreTokenRef.current;
    scoreTokenRef.current = null; // consume the token — one use only
    if (token) {
      try {
        await RundotGameAPI.leaderboard.submitScore({
          token,
          score: roundedScore,
          duration: roundedDuration,
        });
        lastScoreSubmitRef.current = now;
        return;
      } catch {
        // Token may have expired (1h limit) or been rejected — fall through to retry
      }
    }
    // Fallback 1: Try to create a fresh token and submit (fixes "Score token required" errors)
    try {
      const freshToken = await RundotGameAPI.leaderboard.createScoreToken();
      if (freshToken?.token) {
        await RundotGameAPI.leaderboard.submitScore({
          token: freshToken.token,
          score: roundedScore,
          duration: roundedDuration,
        });
        lastScoreSubmitRef.current = now;
        return;
      }
    } catch {
      // Fresh token creation failed — try one more fallback
    }
    // Fallback 2: submit without token (simple mode may still work on some server configs)
    try {
      await RundotGameAPI.leaderboard.submitScore({
        score: roundedScore,
        duration: roundedDuration,
      });
      lastScoreSubmitRef.current = now;
    } catch (e) {
      reportError('leaderboard_submit', e);
    }
  }

  // ── Bloodline bonus summary for class select ──
  const bonuses = computeBloodlineBonuses(bloodline);
  const bonusParts: string[] = [];
  if (bonuses.statBonuses.maxHp) bonusParts.push(`+${bonuses.statBonuses.maxHp} HP`);
  if (bonuses.statBonuses.attack) bonusParts.push(`+${bonuses.statBonuses.attack} Atk`);
  if (bonuses.statBonuses.defense) bonusParts.push(`+${bonuses.statBonuses.defense} Def`);
  if (bonuses.statBonuses.speed) bonusParts.push(`+${bonuses.statBonuses.speed} Spd`);
  if (bonuses.hungerBonus) bonusParts.push(`+${bonuses.hungerBonus} Hunger`);
  if (bonuses.startingGold) bonusParts.push(`+${bonuses.startingGold}g`);
  if (bonuses.startingItems.length) bonusParts.push(`+${bonuses.startingItems.length} items`);

  // ── Global Elder overlay — rendered via portal so it appears above ALL screens ──
  const elderPortal = activeElderTip
    ? createPortal(
        <ElderGuide message={activeElderTip.message} onDone={dismissElderTip} />,
        document.body,
      )
    : null;

  // ── Story generation loading screen ──
  const generationLoadingPortal = showGenerationLoading
    ? createPortal(
        <GenerationLoadingScreen
          progress={generationProgress}
          message={generationMessage}
          onReady={() => setShowGenerationLoading(false)}
        />,
        document.body,
      )
    : null;

  // ── Ranged class tutorial overlay ──
  const rangedTutorialPortal = showRangedTutorial
    ? createPortal(
        <FeatureTutorial
          storageKey="tutorial_ranged_class"
          pages={RANGED_CLASS_TUTORIAL}
          accentColor="#88ccff"
          heading="Ranged Combat Guide"
          onDone={() => setShowRangedTutorial(false)}
        />,
        document.body,
      )
    : null;

  // ── Paladin unlock modals — portal so they work on any screen ──
  const paladinUnlockPortal = showPaladinUnlock
    ? createPortal(
        showPaladinUnlockConfirm
          ? (
            <PaladinUnlockConfirmModal
              guideUrl={elderGuideUrl}
              onConfirm={async () => {
                setShowPaladinUnlock(false);
                setShowPaladinUnlockConfirm(false);
                if (debugMode) {
                  setIsRegistered(true);
                  return;
                }
                try {
                  const gate = (RundotGameAPI as any).accessGate;
                  if (gate?.promptLogin) {
                    const result = await gate.promptLogin();
                    if (result.success) {
                      setIsRegistered(true);
                    }
                  }
                } catch { /* cancelled */ }
              }}
              onBack={() => setShowPaladinUnlockConfirm(false)}
            />
          )
          : (
            <PaladinUnlockModal
              guideUrl={elderGuideUrl}
              onLetsDoIt={() => setShowPaladinUnlockConfirm(true)}
              onLater={() => setShowPaladinUnlock(false)}
            />
          ),
        document.body,
      )
    : null;

  // ── Add-to-Home modals — portal so they work on any screen ──
  const addToHomePortal = showAddToHome
    ? createPortal(
        showAddToHomeConfirm
          ? (
            <AddToHomeConfirmModal
              guideUrl={elderGuideUrl}
              onConfirm={() => {
                setShowAddToHome(false);
                setShowAddToHomeConfirm(false);
                setAddToHomeUnlocked(true);
                safeSetItem('addToHomeShown', '1');
                RundotGameAPI.notifications.scheduleAsync(
                  'Your dungeon awaits!',
                  'Your bloodline grows stronger with each run. Come back and descend deeper.',
                  24 * 60 * 60,
                  'return_reminder',
                ).catch(() => {});
              }}
              onBack={() => setShowAddToHomeConfirm(false)}
            />
          )
          : (
            <AddToHomeModal
              guideUrl={elderGuideUrl}
              onLetsDoIt={() => setShowAddToHomeConfirm(true)}
              onLater={() => setShowAddToHome(false)}
            />
          ),
        document.body,
      )
    : null;

  // ── SCREENS ──

  if (screen === 'title') {
    /* ── Invisible hit-zone style helper (positioned over the baked-in image buttons) ── */
    const hitZone = (id: string, top: number, left: number, bottom: number, right: number): CSSProperties => ({
      position: 'absolute',
      top: `${top}%`,
      left: `${left}%`,
      width: `${right - left}%`,
      height: `${bottom - top}%`,
      cursor: 'pointer',
      background: pressedZone === id ? 'rgba(255,255,255,0.25)' : 'transparent',
      border: 'none',
      padding: 0,
      zIndex: 2,
      borderRadius: 6,
      transition: 'background 0.05s',
    });
    const pressHandlers = (id: string) => ({
      onTouchStart: () => setPressedZone(id),
      onTouchEnd: () => setPressedZone(null),
      onTouchCancel: () => setPressedZone(null),
      onMouseDown: () => setPressedZone(id),
      onMouseUp: () => setPressedZone(null),
      onMouseLeave: () => setPressedZone(null),
    });

    return (
      <div style={titleScreenStyle} onClick={onUserInteraction}>
        <button style={musicToggleStyle} onClick={(e) => { e.stopPropagation(); toggleMute(); }}>
          {muted ? '♪ OFF' : '♪ ON'}
        </button>
        {/* Image container — the image drives the layout, scroll if taller than screen */}
        <div style={{ position: 'relative', width: '100%' }}>
          {titleBgUrl && <img
            src={titleBgUrl}
            alt=""
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />}

          {/* Hidden debug tap target */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '15%', height: '5%', zIndex: 3 }} onClick={handleDebugTap} />
          {debugMode && (
            <div style={{ position: 'absolute', top: '5%', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
              <div style={{ color: '#ff4444', fontFamily: 'monospace', fontSize: 9 }}>[DEBUG]</div>
              <button
                style={{ background: '#331111', border: '1px solid #ff4444', color: '#ff4444', fontFamily: 'monospace', fontSize: 10, padding: '4px 8px', cursor: 'pointer', marginTop: 2 }}
                onClick={() => {
                  // Full reset - same as RESET ALL
                  const fresh = createDefaultBloodline();
                  saveBloodline(fresh);
                  bloodlineRef.current = fresh;
                  RundotGameAPI.appStorage.removeItem('autosave').catch(() => {});
                  RundotGameAPI.appStorage.removeItem('autosave_backup').catch(() => {});
                  RundotGameAPI.appStorage.removeItem('runHistory').catch(() => {});
                  RundotGameAPI.appStorage.removeItem('addToHomeShown').catch(() => {});
                  RundotGameAPI.appStorage.removeItem('bestFloor').catch(() => {});
                  RundotGameAPI.appStorage.removeItem('questEchoData').catch(() => {});
                  setHasAutoSave(false);
                  setBestFloor(1);
                  setTutorialSteps([]);
                  setQuestEchoData(createDefaultQuestEchoData());
                  questEchoRef.current = createDefaultQuestEchoData();
                  for (const key of ALL_ELDER_KEYS) {
                    RundotGameAPI.appStorage.removeItem(key).catch(() => {});
                  }
                  elderSeenRef.current.clear();
                  setAddToHomeUnlocked(false);
                  setShowAddToHome(false);
                  setShowAddToHomeConfirm(false);
                  setIsRegistered(false);
                  setShowPaladinUnlock(false);
                  setShowPaladinUnlockConfirm(false);
                  setNecropolisUnlocked(false);
                  // Now trigger first-time auto-start flow
                  setDebugMode(false);
                  autoStartRef.current = true;
                  setSelectedClass('warrior');
                  setIsLoaded(false);
                  setTimeout(() => setIsLoaded(true), 100);
                }}
              >
                [ Test First-Time Flow ]
              </button>
              <button
                style={{ background: '#1a0400', border: '1px solid #ff2200', color: '#ff2200', fontFamily: 'monospace', fontSize: 10, padding: '4px 8px', cursor: 'pointer' }}
                onClick={() => {
                  const bl = bloodlineRef.current;
                  const needed = ['The Nameless One|paladin'];
                  for (const entry of needed) {
                    if (!bl.bossKillLog.includes(entry)) bl.bossKillLog.push(entry);
                  }
                  const qe = questEchoRef.current;
                  if (!qe.unlockedEchoNodes.includes('exp_zone_hell')) {
                    qe.unlockedEchoNodes.push('exp_zone_hell');
                  }
                  setBloodline({ ...bl });
                  alert('Hell unlocked! Tap Enter the Dungeon to play.');
                }}
              >
                [ Unlock Hell ]
              </button>
              <button
                style={{ background: '#140828', border: '1px solid #ff44ff', color: '#ff44ff', fontFamily: 'monospace', fontSize: 10, padding: '4px 8px', cursor: 'pointer' }}
                onClick={() => {
                  setDebugMode(false);
                  setSelectedClass('warrior');
                  beginGame('narrative_test');
                }}
              >
                [ Narrative Depths (AI Test) ]
              </button>
              <button
                style={{ background: '#002244', border: '1px solid #44aaff', color: '#44aaff', fontFamily: 'monospace', fontSize: 10, padding: '4px 8px', cursor: 'pointer' }}
                onClick={() => {
                  setDebugMode(false);
                  setScreen('generativeClassSelect');
                }}
              >
                [ Gen Class (AI) ]
              </button>
              <a
                href="project.tar.gz"
                download="project.tar.gz"
                style={{ background: '#0a1a33', border: '1px solid #4488ff', color: '#4488ff', fontFamily: 'monospace', fontSize: 10, padding: '4px 8px', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}
              >
                [ Download Project ]
              </a>
            </div>
          )}

          {/* ── Floating info banners over image ── */}
          {bloodline.generation > 0 && (
            <div style={{ position: 'absolute', top: hasAutoSave ? '62%' : '60%', left: '50%', transform: 'translateX(-50%)', color: '#c49eff', fontFamily: 'monospace', fontSize: 11, opacity: 0.85, textShadow: '0 1px 4px #000', whiteSpace: 'nowrap', zIndex: 3 }}>
              Generation {bloodline.generation} | {bloodline.unlockedTraits.length} traits unlocked
            </div>
          )}
          {hasAutoSave && (
            <div style={{ position: 'absolute', top: '58%', left: '50%', transform: 'translateX(-50%)', color: '#ffd700', fontFamily: 'monospace', fontSize: 11, textAlign: 'center', textShadow: '0 1px 4px #000, 0 0 8px #000', whiteSpace: 'nowrap', zIndex: 3, background: 'rgba(0,0,0,0.6)', padding: '2px 10px', borderRadius: 4 }}>
              You have a saved game that will continue.
            </div>
          )}
          {isPremium && (
            <div style={{ position: 'absolute', top: '84.7%', left: '36.5%', width: '30.2%', height: '6.8%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, pointerEvents: 'none' }}>
              <div style={{ color: '#ffd700', fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', textShadow: '0 1px 6px #000', opacity: 0.8 }}>&#x2B50; Premium Active</div>
            </div>
          )}
          {purchaseStatus && (
            <div style={{ position: 'absolute', top: '93%', left: '50%', transform: 'translateX(-50%)', color: '#ff6', fontFamily: 'monospace', fontSize: 11, textAlign: 'center', textShadow: '0 1px 4px #000', zIndex: 3 }}>
              {purchaseStatus}
            </div>
          )}

          {/* ── Invisible hit zones mapped to baked-in image buttons ── */}
          <div style={hitZone('play', 66.3, 30.5, 73.2, 69.9)} {...pressHandlers('play')} onClick={(e) => { e.stopPropagation(); setShowPremiumModal(false); startGame(); }} />
          <div
            style={hitZone('necro', 75.4, 11.2, 82.3, 48.7)}
            {...pressHandlers('necro')}
            onClick={(e) => {
              e.stopPropagation();
              if (necropolisUnlocked) { setShowNecropolis(true); trackNecropolisOpened(); }
              else handleNecroTap();
            }}
          />
          <div style={hitZone('quests', 75.4, 52.3, 82.3, 88.5)} {...pressHandlers('quests')} onClick={(e) => { e.stopPropagation(); openQuestLog('title'); }} />
          {questEchoData.activeQuests.some(q => q.completed) && (
            <div style={{ position: 'absolute', top: '74.5%', right: '11%', background: '#ff3333', color: '#fff', fontFamily: 'monospace', fontSize: 10, fontWeight: 'bold', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4, pointerEvents: 'none', textShadow: '0 1px 2px #000' }}>
              {questEchoData.activeQuests.filter(q => q.completed).length}
            </div>
          )}
          <div style={hitZone('blood', 84.7, 1.7, 91.5, 35.3)} {...pressHandlers('blood')} onClick={(e) => { e.stopPropagation(); setShowBloodline(true); trackBloodlineOpened(); }} />
          <div style={hitZone('gold', 84.7, 36.5, 91.5, 66.7)} {...pressHandlers('gold')} onClick={(e) => { e.stopPropagation(); setShowPremiumModal(true); trackOfferShown('premium'); }} />
          <div style={hitZone('more', 84.7, 68.4, 91.5, 98.3)} {...pressHandlers('more')} onClick={(e) => { e.stopPropagation(); setShowMoreMenu(true); }} />

          {/* Version number */}
          <div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', color: '#444', fontFamily: 'monospace', fontSize: 10, zIndex: 3 }}>v{BUILD_VERSION}</div>
        </div>
        {/* ── More Menu Overlay ── */}
        {showMoreMenu && (
          <div style={moreMenuOverlayStyle} onClick={() => setShowMoreMenu(false)}>
            <div style={{ width: '92%', maxWidth: 420, maxHeight: '90vh', overflow: 'hidden', borderRadius: 6 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '3072 / 5504' }}>
              {moreMenuBgUrl && <img src={moreMenuBgUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', objectFit: 'cover', borderRadius: 6 }} />}
              {/* Hit zones over the baked-in menu image */}
              {(() => {
                const mz = (id: string, t: number, l: number, b: number, r: number): CSSProperties => ({
                  position: 'absolute', top: `${t}%`, left: `${l}%`, width: `${r - l}%`, height: `${b - t}%`,
                  cursor: 'pointer', background: pressedZone === id ? 'rgba(255,255,255,0.25)' : 'transparent',
                  border: 'none', padding: 0, zIndex: 2, borderRadius: 4, transition: 'background 0.05s',
                });
                const mp = (id: string) => ({
                  onTouchStart: () => setPressedZone(id),
                  onTouchEnd: () => setPressedZone(null),
                  onTouchCancel: () => setPressedZone(null),
                  onMouseDown: () => setPressedZone(id),
                  onMouseUp: () => setPressedZone(null),
                  onMouseLeave: () => setPressedZone(null),
                });
                return (<>
                  <div style={mz('m-leader', 23.4, 4.5, 33.4, 32.7)} {...mp('m-leader')} onClick={() => { setShowMoreMenu(false); setShowLeaderboard(true); }} />
                  <div style={mz('m-echo', 23.4, 35.8, 33.5, 63.9)} {...mp('m-echo')} onClick={() => { setShowMoreMenu(false); openEchoTree('title'); }} />
                  <div style={mz('m-best', 23.4, 66.9, 33.4, 95.3)} {...mp('m-best')} onClick={() => { setShowMoreMenu(false); setShowBestiary(true); trackBestiaryOpened(); }} />
                  <div style={mz('m-journal', 36.9, 4.5, 47.0, 32.7)} {...mp('m-journal')} onClick={() => { setShowMoreMenu(false); setShowJournal(true); }} />
                  <div style={mz('m-hist', 36.9, 35.8, 47.1, 63.8)} {...mp('m-hist')} onClick={() => { setShowMoreMenu(false); setShowRunHistory(true); }} />
                  <div style={mz('m-how', 36.9, 67.0, 46.9, 95.3)} {...mp('m-how')} onClick={() => { setShowMoreMenu(false); setShowTips(true); }} />
                  <div style={mz('m-new', 50.6, 4.5, 60.5, 32.5)} {...mp('m-new')} onClick={() => { setShowMoreMenu(false); setShowWhatsNew(true); }} />
                  <div style={mz('m-disc', 50.6, 35.8, 60.6, 64.0)} {...mp('m-disc')} onClick={() => { setShowMoreMenu(false); window.open('https://discord.gg/A9ayUtVv2Q', '_blank'); }} />
                  <div style={mz('m-bug', 50.6, 67.0, 60.6, 95.3)} {...mp('m-bug')} onClick={() => { setShowMoreMenu(false); setShowBugReport(true); }} />
                  <div style={mz('m-close', 73.5, 28.8, 81.4, 72.2)} {...mp('m-close')} onClick={() => setShowMoreMenu(false)} />
                </>);
              })()}
              {/* Journal notification badge */}
              {getNewLoreIds({ bloodline, questEchoData }, bloodline.journalSeenIds ?? []).length > 0 && (
                <div style={{ position: 'absolute', top: '36%', left: '27%', background: '#ff3333', color: '#fff', fontFamily: 'monospace', fontSize: 10, fontWeight: 'bold', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4, pointerEvents: 'none', textShadow: '0 1px 2px #000' }}>
                  {getNewLoreIds({ bloodline, questEchoData }, bloodline.journalSeenIds ?? []).length}
                </div>
              )}
              {/* Player ID */}
              <div style={{ position: 'absolute', bottom: '20%', left: '50%', transform: 'translateX(-50%)', color: '#555', fontFamily: 'monospace', fontSize: 9, textAlign: 'center', userSelect: 'text', WebkitUserSelect: 'text', zIndex: 3, textShadow: '0 1px 3px #000' }}>
                ID: {(() => { try { return RundotGameAPI.getProfile()?.id ?? '...'; } catch { return '...'; } })()}
              </div>
              </div>
            </div>
          </div>
        )}
        {showBloodline && <BloodlineView bloodline={bloodline} onClose={() => setShowBloodline(false)} />}
        {showNecropolis && <NecropolisView onClose={() => setShowNecropolis(false)} />}
        {showQuestLog && <QuestLog data={questEchoData} characterQuests={state?.activeCharacterQuests} onClaim={handleClaimQuest} onClaimCharacterQuest={handleClaimCharacterQuest} onClose={() => setShowQuestLog(false)} onOpenEchoTree={() => { setShowQuestLog(false); openEchoTree('title_quest_log'); }} />}
        {/* More menu sub-screens with dungeon background */}
        {(showLeaderboard || showBestiary || showRunHistory || showTips || showBugReport || showWhatsNew || showEchoTree || showJournal) && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 49, overflow: 'hidden' }}>
            {moreContentBgUrl && <img src={moreContentBgUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' as const }} />}
            {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
            {showBestiary && <Bestiary bloodline={bloodline} communalKills={getNecropolisState().communalKills} onClose={() => setShowBestiary(false)} />}
            {showRunHistory && <RunHistory bloodline={bloodline} onClose={() => setShowRunHistory(false)} />}
            {showTips && <Tips onClose={() => setShowTips(false)} />}
            {showBugReport && <BugReport onClose={() => setShowBugReport(false)} />}
            {showWhatsNew && <WhatsNew onClose={() => setShowWhatsNew(false)} />}
            {showEchoTree && <EchoTreeView data={questEchoData} onUnlock={handleUnlockEchoNode} onClose={() => setShowEchoTree(false)} />}
            {showJournal && <Journal bloodline={bloodline} questEchoData={questEchoData} seenIds={bloodline.journalSeenIds ?? []} onMarkSeen={handleJournalMarkSeen} onClose={() => setShowJournal(false)} />}
          </div>
        )}
        {elderPortal}
        {generationLoadingPortal}
        {showPremiumModal && !isPremium && (
          <div style={premiumModalOverlayStyle} onClick={() => { setShowPremiumModal(false); trackOfferDismissed('premium'); }}>
            <div style={premiumModalBoxStyle} onClick={e => e.stopPropagation()}>
              {premiumBannerUrl && (
                <img src={premiumBannerUrl} alt="Premium God" style={{ width: '100%', borderRadius: 4, marginBottom: 12, imageRendering: 'pixelated' as const }} />
              )}
              {!premiumBannerUrl && (
                <>
                  <div style={{ color: '#ffd700', fontSize: 18, fontWeight: 'bold', marginBottom: 10, letterSpacing: 2 }}>PREMIUM GOD</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                    <div style={premiumPerkRowStyle}>
                      <span style={{ color: '#ffd700' }}>✦</span>
                      <span><b style={{ color: '#fff' }}>2X Gold</b> — become wealthy beyond belief!</span>
                    </div>
                    <div style={premiumPerkRowStyle}>
                      <span style={{ color: '#ffd700' }}>✦</span>
                      <span><b style={{ color: '#fff' }}>50% Less Hunger</b> — thrive, don't just survive!</span>
                    </div>
                    <div style={premiumPerkRowStyle}>
                      <span style={{ color: '#ffd700' }}>✦</span>
                      <span><b style={{ color: '#fff' }}>One-time purchase</b> — forever yours, no subscription!</span>
                    </div>
                  </div>
                </>
              )}
              {isFirstTimeBuyer && (
                <div style={{ color: '#44ff88', fontSize: 11, fontFamily: 'monospace', textAlign: 'center', marginBottom: 8, letterSpacing: 1 }}>
                  STARTER DEAL — 50% OFF!
                </div>
              )}
              {purchaseStatus ? (
                <div style={{ color: '#ff6', fontFamily: 'monospace', fontSize: 11, textAlign: 'center', marginBottom: 10 }}>{purchaseStatus}</div>
              ) : null}
              <button
                style={premiumModalBuyBtnStyle}
                onClick={() => { trackOfferClicked('premium'); handlePremiumPurchase(); }}
              >
                {isFirstTimeBuyer
                  ? <><span style={{ textDecoration: 'line-through', color: '#886622', marginRight: 6 }}>100</span>50 Bucks</>
                  : '[ 100 Bucks ]'}
              </button>
              <button style={premiumModalCancelStyle} onClick={() => { setShowPremiumModal(false); trackOfferDismissed('premium'); }}>
                Not now
              </button>
            </div>
          </div>
        )}
        {pendingLorePopup && (() => {
          const entry = ALL_LORE.find(e => e.id === pendingLorePopup);
          if (!entry) return null;
          return (
            <div style={lorePopupOverlay}>
              <div style={lorePopupContainer}>
                <div style={{ color: '#55ccff', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Journal Updated</div>
                <div style={{ color: entry.color, fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>{entry.icon} {entry.title}</div>
                <div style={{ color: '#8888aa', fontSize: 12, fontStyle: 'italic', marginBottom: 8 }}>{entry.subtitle}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={lorePopupBtnStyle} onClick={() => {
                    setPendingLorePopup(null);
                    handleJournalMarkSeen([...(bloodline.journalSeenIds ?? []), entry.id]);
                    setShowJournal(true);
                  }}>{'[ Read ]'}</button>
                  <button style={{ ...lorePopupBtnStyle, color: '#555577' }} onClick={() => {
                    setPendingLorePopup(null);
                    handleJournalMarkSeen([...(bloodline.journalSeenIds ?? []), entry.id]);
                  }}>{'[ Later ]'}</button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  if (screen === 'classSelect') {
    // Image-based class select: the background has characters already drawn in the arches.
    // These are invisible tap zones positioned over each arch window.
    // Coordinates based on 1080x1920 design spec converted to percentages.
    const imageSlots: { classId: string; left: number; top: number; width: number; height: number }[] = [
      { classId: 'warrior',  left: 7,   top: 28,  width: 25, height: 19 }, // Top-Left
      { classId: 'rogue',    left: 37,  top: 28,  width: 25, height: 19 }, // Top-Middle
      { classId: 'mage',     left: 67,  top: 28,  width: 25, height: 19 }, // Top-Right
      { classId: 'ranger',   left: 7,   top: 56,  width: 25, height: 19 }, // Bottom-Left
      { classId: 'paladin',  left: 37,  top: 56,  width: 25, height: 19 }, // Bottom-Middle
      { classId: 'hellborn', left: 67,  top: 56,  width: 25, height: 19 }, // Bottom-Right
    ];
    // "BACK" text position in the image (bottom center)
    const backBtnSlot = { left: 33, top: 92, width: 34, height: 6 };
    const allClasses = [...CLASS_DEFS, ...getNecropolisClasses(getNecropolisState().communalDeaths, questEchoRef.current.unlockedEchoNodes), ...getHellbornClass(bloodline.bossKillLog ?? [], questEchoRef.current.unlockedEchoNodes)];

    return (
      <>
      <div style={{
        ...fullScreenStyle,
        overflowY: classSelectBgUrl ? 'hidden' : 'auto',
        justifyContent: 'flex-start',
        paddingTop: classSelectBgUrl ? 0 : 20,
        padding: classSelectBgUrl ? 0 : 20,
        gap: classSelectBgUrl ? 0 : 16,
      }}>
        {classSelectBgUrl ? (
          <>
          {/* Image-based class select — single container with bg image, keeps 9:16 ratio */}
          {/* Container fills viewport, centers a 9:16 box with the image as background */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000',
          }}>
            {/* Inner box: constrained to 9:16 aspect ratio, never exceeds parent */}
            <div style={{
              position: 'relative',
              /* Height fills the parent; width is derived from aspect ratio */
              height: '100%',
              aspectRatio: '9 / 16',
              maxWidth: '100%',
              backgroundImage: `url(${classSelectBgUrl})`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated' as const,
            }}>
              {/* Tap zones over each class arch */}
              {imageSlots.map((slot) => {
                const cls = allClasses.find(c => c.id === slot.classId);
                const floorLocked = cls ? bestFloor < cls.requiresBestFloor : true;
                const registrationLocked = cls?.id === 'paladin' && !isRegistered;
                const rogueLocked = cls?.id === 'rogue' && !addToHomeUnlocked;
                const locked = !cls || floorLocked || registrationLocked || rogueLocked;

                // Build unlock reason text for the info popup
                let unlockHint = '';
                if (!cls && slot.classId === 'hellborn') {
                  unlockHint = 'Defeat bosses with different classes to unlock the Hellborne.';
                } else if (!cls) {
                  unlockHint = 'This hero has not been discovered yet.';
                } else if (registrationLocked) {
                  unlockHint = 'Create a free account to unlock the Paladin.';
                } else if (rogueLocked) {
                  unlockHint = 'Save the game to your home screen to unlock the Rogue.';
                } else if (floorLocked) {
                  unlockHint = `Reach floor ${cls.requiresBestFloor} to unlock the ${cls.name}.`;
                }

                return (
                  <div
                    key={slot.classId}
                    style={{
                      position: 'absolute',
                      left: `${slot.left}%`,
                      top: `${slot.top}%`,
                      width: `${slot.width}%`,
                      height: `${slot.height}%`,
                      zIndex: 1,
                    }}
                  >
                    {/* Main tap area */}
                    <button
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: 0,
                        padding: 0,
                        cursor: locked && !registrationLocked && !rogueLocked ? 'not-allowed' : 'pointer',
                        overflow: 'visible',
                      }}
                      onClick={async () => {
                        if (!cls) return;
                        if (registrationLocked) { setActiveElderTip(ELDER_PALADIN_UNLOCK); return; }
                        if (rogueLocked) { setActiveElderTip(ELDER_ROGUE_UNLOCK); return; }
                        if (!locked) {
                          if (cls.id === 'rogue') tryShowElderTip(ELDER_ROGUE_FIRST_SELECT);
                          if (cls.id === 'paladin') tryShowElderTip(ELDER_PALADIN_FIRST_SELECT);
                          selectClassAndPickZone(cls.id);
                        }
                      }}
                      disabled={!cls || (rogueLocked ? false : floorLocked)}
                    />
                    {/* Dark overlay for locked classes */}
                    {locked && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          background: 'rgba(0, 0, 0, 0.65)',
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                    {/* Small info button for locked classes — tucked into top-right of arch */}
                    {locked && (cls || slot.classId === 'hellborn') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setUnlockInfoClass(unlockInfoClass === slot.classId ? null : slot.classId);
                        }}
                        style={{
                          position: 'absolute',
                          top: '4%',
                          right: '4%',
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          background: '#1a1a2e',
                          border: '1.5px solid #ffd700',
                          color: '#ffd700',
                          fontFamily: 'serif',
                          fontWeight: 'bold',
                          fontSize: 9,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          zIndex: 3,
                          padding: 0,
                          lineHeight: 1,
                        }}
                      >
                        i
                      </button>
                    )}
                    {/* Unlock info popup */}
                    {unlockInfoClass === slot.classId && locked && (cls || slot.classId === 'hellborn') && (
                      <div
                        onClick={() => setUnlockInfoClass(null)}
                        style={{
                          position: 'absolute',
                          top: '-60%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: '#1a1a2e',
                          border: '2px solid #ffd700',
                          borderRadius: 8,
                          padding: '8px 12px',
                          color: '#ffd700',
                          fontSize: 'clamp(9px, 1.5vw, 13px)',
                          fontFamily: "'Press Start 2P', monospace",
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          zIndex: 10,
                          boxShadow: '0 0 12px rgba(255, 215, 0, 0.3)',
                          cursor: 'pointer',
                        }}
                      >
                        {unlockHint}
                        <div style={{
                          position: 'absolute',
                          bottom: -8,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '8px solid transparent',
                          borderRight: '8px solid transparent',
                          borderTop: '8px solid #ffd700',
                        }} />
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Legacy Gear button — centered below Paladin */}
              <button
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '78%',
                  transform: 'translateX(-50%)',
                  padding: 0,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  zIndex: 3,
                  width: '28%',
                  imageRendering: 'pixelated' as const,
                }}
                onClick={() => setShowLegacyGear(true)}
              >
                <img
                  src={`${import.meta.env.BASE_URL}legacy-gear-btn.png`}
                  alt="Legacy Gear"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    imageRendering: 'pixelated',
                  }}
                />
              </button>
              {/* Debug panel overlay for image-based class select */}
              {debugMode && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  background: 'rgba(68, 0, 0, 0.92)', borderBottom: '1px solid #ff4444',
                  padding: '6px 8px', fontFamily: 'monospace', fontSize: 9,
                  display: 'flex', flexDirection: 'column', gap: 4, color: '#ff6666',
                  zIndex: 20,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 'bold', fontSize: 10 }}>DEBUG</span>
                    <span style={{ color: '#886666', fontSize: 8 }}>Gen:{bloodline.generation} Best:F{bloodline.cumulative.highestFloor}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    <span style={{ color: '#c49eff', fontSize: 9, fontWeight: 'bold' }}>Legacy:</span>
                    <span style={{ color: '#886666', fontSize: 8 }}>Shards: {ensureLegacyData(bloodline).essenceShards}</span>
                    <button
                      style={{ background: '#1a0044', color: '#c49eff', border: '1px solid #c49eff44', borderRadius: 3, padding: '1px 5px', fontFamily: 'monospace', fontSize: 8, cursor: 'pointer' }}
                      onClick={() => { const bl = structuredClone(bloodline); const ld = ensureLegacyData(bl); addEssenceShards(ld, 50); const g = getGearForClass(ld, selectedClass); if (!g.earned) { g.earned = true; if (g.level === 0) g.level = 1; } saveBloodline(bl); setBloodline(bl); }}
                    >+50</button>
                    <button
                      style={{ background: '#1a0044', color: '#c49eff', border: '1px solid #c49eff44', borderRadius: 3, padding: '1px 5px', fontFamily: 'monospace', fontSize: 8, cursor: 'pointer' }}
                      onClick={() => { const bl = structuredClone(bloodline); const ld = ensureLegacyData(bl); addEssenceShards(ld, 500); const g = getGearForClass(ld, selectedClass); if (!g.earned) { g.earned = true; if (g.level === 0) g.level = 1; } saveBloodline(bl); setBloodline(bl); }}
                    >+500</button>
                    <button
                      style={{ background: '#1a0044', color: '#ffcc33', border: '1px solid #ffcc3344', borderRadius: 3, padding: '1px 5px', fontFamily: 'monospace', fontSize: 8, cursor: 'pointer' }}
                      onClick={() => { const bl = structuredClone(bloodline); const ld = ensureLegacyData(bl); for (const d of LEGACY_GEAR_DEFS) { const g = getGearForClass(ld, d.classId); g.earned = true; if (g.level === 0) g.level = 1; } saveBloodline(bl); setBloodline(bl); }}
                    >Earn All</button>
                    <button
                      style={{ background: '#1a0044', color: '#ff2a6d', border: '1px solid #ff2a6d44', borderRadius: 3, padding: '1px 5px', fontFamily: 'monospace', fontSize: 8, cursor: 'pointer' }}
                      onClick={() => { const bl = structuredClone(bloodline); const ld = ensureLegacyData(bl); for (const d of LEGACY_GEAR_DEFS) { const g = getGearForClass(ld, d.classId); g.earned = true; g.level = 20; } saveBloodline(bl); setBloodline(bl); }}
                    >Max All</button>
                    <button
                      style={{ background: '#440022', color: '#ff4488', border: '1px solid #ff448844', borderRadius: 3, padding: '1px 5px', fontFamily: 'monospace', fontSize: 8, cursor: 'pointer' }}
                      onClick={() => { const bl = structuredClone(bloodline); bl.legacyData = undefined; saveBloodline(bl); setBloodline(bl); }}
                    >Reset</button>
                    <button
                      style={{ background: '#002244', color: '#44ccff', border: '1px solid #44ccff44', borderRadius: 3, padding: '1px 5px', fontFamily: 'monospace', fontSize: 8, cursor: 'pointer' }}
                      onClick={() => { setActiveElderTip(ELDER_LEGACY_SHARD); }}
                    >Elder Tip</button>
                    <button
                      style={{ background: '#220044', color: '#aa44dd', border: '1px solid #aa44dd44', borderRadius: 3, padding: '1px 5px', fontFamily: 'monospace', fontSize: 8, cursor: 'pointer' }}
                      onClick={() => {
                        const qe = structuredClone(questEchoRef.current);
                        if (!qe.unlockedEchoNodes.includes('mas_class_3')) qe.unlockedEchoNodes.push('mas_class_3');
                        if (!qe.unlockedEchoNodes.includes('mas_class_4')) qe.unlockedEchoNodes.push('mas_class_4');
                        questEchoRef.current = qe;
                        setQuestEchoData(qe);
                        safeSetItem('questEchoData', JSON.stringify(qe));
                        selectClassAndPickZone('necromancer');
                      }}
                    >Play Necro</button>
                    <button
                      style={{ background: '#440022', color: '#ff4444', border: '1px solid #ff444444', borderRadius: 3, padding: '1px 5px', fontFamily: 'monospace', fontSize: 8, cursor: 'pointer' }}
                      onClick={() => {
                        const qe = structuredClone(questEchoRef.current);
                        if (!qe.unlockedEchoNodes.includes('mas_class_3')) qe.unlockedEchoNodes.push('mas_class_3');
                        if (!qe.unlockedEchoNodes.includes('mas_class_4')) qe.unlockedEchoNodes.push('mas_class_4');
                        questEchoRef.current = qe;
                        setQuestEchoData(qe);
                        safeSetItem('questEchoData', JSON.stringify(qe));
                        selectClassAndPickZone('revenant');
                      }}
                    >Play Rev</button>
                    <button
                      style={{ background: '#002244', color: '#44aaff', border: '1px solid #44aaff44', borderRadius: 3, padding: '1px 5px', fontFamily: 'monospace', fontSize: 8, cursor: 'pointer' }}
                      onClick={() => setScreen('generativeClassSelect')}
                    >Gen Class</button>
                  </div>
                </div>
              )}
              {/* Invisible "Back" tap zone over the BACK text in the image */}
              <button
                style={{
                  position: 'absolute',
                  left: `${backBtnSlot.left}%`,
                  top: `${backBtnSlot.top}%`,
                  width: `${backBtnSlot.width}%`,
                  height: `${backBtnSlot.height}%`,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  zIndex: 2,
                }}
                onClick={() => { setScreen('title'); setActiveElderTip(null); setUnlockInfoClass(null); }}
              />
              {/* Small Necromancer button - only shown when unlocked */}
              {(() => {
                const necroUnlocked = getNecropolisClasses(getNecropolisState().communalDeaths, questEchoRef.current.unlockedEchoNodes).some(c => c.id === 'necromancer');
                if (!necroUnlocked) return null;
                return (
                  <button
                    style={{
                      position: 'absolute',
                      right: '3%',
                      bottom: '3%',
                      width: 'clamp(40px, 10%, 56px)',
                      height: 'clamp(40px, 10%, 56px)',
                      background: 'rgba(10, 0, 20, 0.85)',
                      border: '2px solid #aa44dd',
                      borderRadius: 8,
                      padding: 3,
                      cursor: 'pointer',
                      zIndex: 3,
                      boxShadow: '0 0 12px #aa44dd66, inset 0 0 8px #aa44dd33',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onClick={() => {
                      setSelectedClass('necromancer');
                      setShowClassDetail('necromancer');
                    }}
                    title="Play as Necromancer"
                  >
                    {classPortraits['necromancer'] ? (
                      <img
                        src={classPortraits['necromancer']!}
                        alt="Necromancer"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: 4,
                          imageRendering: 'pixelated',
                        }}
                      />
                    ) : (
                      <span style={{ color: '#aa44dd', fontSize: 18 }}>💀</span>
                    )}
                  </button>
                );
              })()}
            </div>
          </div>
          </>
        ) : (
          <>
        <div style={{ ...titleTextStyle, fontSize: 20 }}>Choose Your Class</div>
        {/* DEBUG PANEL — remove before shipping */}
        {debugMode && (
          <div style={{
            background: '#440000', border: '1px solid #ff4444', borderRadius: 6,
            padding: '6px 10px', marginBottom: 6, fontFamily: 'monospace', fontSize: 10,
            display: 'flex', flexDirection: 'column', gap: 6, color: '#ff6666',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 'bold' }}>DEBUG</span>
              <button
                style={{
                  background: isRegistered ? '#004400' : '#440000',
                  color: isRegistered ? '#44ff44' : '#ff4444',
                  border: '1px solid', borderRadius: 4, padding: '2px 6px',
                  fontFamily: 'monospace', fontSize: 9, cursor: 'pointer',
                }}
                onClick={() => setIsRegistered(prev => !prev)}
              >
                Reg: {isRegistered ? 'Y' : 'N'}
              </button>
              <button
                style={{
                  background: '#440022', color: '#ff4488',
                  border: '1px solid #ff4488', borderRadius: 4, padding: '2px 6px',
                  fontFamily: 'monospace', fontSize: 9, cursor: 'pointer',
                }}
                onClick={() => {
                  const fresh = createDefaultBloodline();
                  saveBloodline(fresh);
                  bloodlineRef.current = fresh;
                  RundotGameAPI.appStorage.removeItem('autosave').catch(() => {});
                  RundotGameAPI.appStorage.removeItem('autosave_backup').catch(() => {});
                  RundotGameAPI.appStorage.removeItem('runHistory').catch(() => {});
                  RundotGameAPI.appStorage.removeItem('addToHomeShown').catch(() => {});
                  RundotGameAPI.appStorage.removeItem('bestFloor').catch(() => {});
                  RundotGameAPI.appStorage.removeItem('questEchoData').catch(() => {});
                  setHasAutoSave(false);
                  setBestFloor(1);
                  setTutorialSteps([]);
                  setQuestEchoData(createDefaultQuestEchoData());
                  questEchoRef.current = createDefaultQuestEchoData();
                  // Clear elder tip flags so tutorials replay
                  for (const key of ALL_ELDER_KEYS) {
                    RundotGameAPI.appStorage.removeItem(key).catch(() => {});
                  }
                  elderSeenRef.current.clear();
                  setAddToHomeUnlocked(false);
                  setShowAddToHome(false);
                  setShowAddToHomeConfirm(false);
                  setIsRegistered(false);
                  setShowPaladinUnlock(false);
                  setShowPaladinUnlockConfirm(false);
                  setNecropolisUnlocked(false);
                  // Close debug menu after reset
                  setDebugMode(false);
                  alert('All data reset! You can now start fresh.');
                }}
              >
                RESET ALL
              </button>
              <button
                style={{
                  background: '#333', color: '#ffcc00',
                  border: '1px solid #ffcc00', borderRadius: 4, padding: '2px 6px',
                  fontFamily: 'monospace', fontSize: 9, cursor: 'pointer',
                }}
                onClick={() => setDebugMode(false)}
              >
                Close
              </button>
              <button
                style={{
                  background: (window as any).__GP_ACTIVE__ ? '#003300' : '#1a0044',
                  color: (window as any).__GP_ACTIVE__ ? '#44ff44' : '#a78bfa',
                  border: `1px solid ${(window as any).__GP_ACTIVE__ ? '#44ff44' : '#7c3aed'}`,
                  borderRadius: 4, padding: '2px 6px',
                  fontFamily: 'monospace', fontSize: 9, cursor: 'pointer',
                }}
                onClick={() => {
                  initProfiler();
                  setTimeout(() => setDebugMode(true), 50);
                }}
              >
                {(window as any).__GP_ACTIVE__ ? 'Profiler ON' : 'Profiler OFF'}
              </button>
              <button
                style={{
                  background: questEchoRef.current.unlockedEchoNodes.includes('mas_class_3') ? '#003300' : '#220044',
                  color: questEchoRef.current.unlockedEchoNodes.includes('mas_class_3') ? '#44ff44' : '#aa44dd',
                  border: '1px solid #aa44dd44', borderRadius: 4, padding: '2px 6px',
                  fontFamily: 'monospace', fontSize: 9, cursor: 'pointer',
                }}
                onClick={() => {
                  const qe = structuredClone(questEchoRef.current);
                  if (!qe.unlockedEchoNodes.includes('mas_class_3')) {
                    qe.unlockedEchoNodes.push('mas_class_3');
                  }
                  if (!qe.unlockedEchoNodes.includes('mas_class_4')) {
                    qe.unlockedEchoNodes.push('mas_class_4');
                  }
                  questEchoRef.current = qe;
                  setQuestEchoData(qe);
                  safeSetItem('questEchoData', JSON.stringify(qe));
                }}
              >
                Unlock Necro/Rev
              </button>
              <button
                style={{
                  background: '#002244', color: '#44aaff',
                  border: '1px solid #44aaff', borderRadius: 4, padding: '2px 6px',
                  fontFamily: 'monospace', fontSize: 9, cursor: 'pointer',
                }}
                onClick={() => setScreen('generativeClassSelect')}
              >
                Gen Class
              </button>
            </div>
            {/* A/B Test Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', borderTop: '1px solid #442222', paddingTop: 4, marginTop: 2 }}>
              <span style={{ color: '#ffaa00', fontSize: 9, fontWeight: 'bold' }}>A/B:</span>
              <span style={{ color: '#886666', fontSize: 8 }}>
                {getNarrativeExperimentInfo().variant}
              </span>
              <button
                style={{
                  background: getVariant('narrative_vs_classic') === 'classic' ? '#003300' : '#1a1a1a',
                  color: '#44ff88',
                  border: '1px solid #44ff8844', borderRadius: 3, padding: '1px 5px',
                  fontFamily: 'monospace', fontSize: 9, cursor: 'pointer',
                }}
                onClick={() => {
                  forceVariant('narrative_vs_classic', 'classic');
                  alert('Forced to Classic variant. Refresh to see change.');
                }}
              >
                Classic
              </button>
              <button
                style={{
                  background: getVariant('narrative_vs_classic') === 'narrative' ? '#003300' : '#1a1a1a',
                  color: '#44aaff',
                  border: '1px solid #44aaff44', borderRadius: 3, padding: '1px 5px',
                  fontFamily: 'monospace', fontSize: 9, cursor: 'pointer',
                }}
                onClick={() => {
                  forceVariant('narrative_vs_classic', 'narrative');
                  alert('Forced to Narrative variant. Refresh to see change.');
                }}
              >
                Narrative
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              <span style={{ color: '#ff8866', fontSize: 9 }}>Play as:</span>
              {[...CLASS_DEFS, ...getNecropolisClasses(getNecropolisState().communalDeaths, questEchoRef.current.unlockedEchoNodes), ...getHellbornClass(bloodline.bossKillLog ?? [], questEchoRef.current.unlockedEchoNodes)].map(cls => (
                <button
                  key={cls.id}
                  style={{
                    background: '#1a1a1a', color: cls.color,
                    border: `1px solid ${cls.color}44`, borderRadius: 3, padding: '1px 5px',
                    fontFamily: 'monospace', fontSize: 9, cursor: 'pointer',
                  }}
                  onClick={() => selectClassAndPickZone(cls.id)}
                >
                  {cls.name}
                </button>
              ))}
            </div>
            <div style={{ color: '#886666', fontSize: 8 }}>
              Gen: {bloodline.generation} | Deaths: {bloodline.cumulative.totalDeaths} | Best: F{bloodline.cumulative.highestFloor} | Kills: {bloodline.cumulative.totalKills} | Traits: {bloodline.unlockedTraits.length}
            </div>
            {/* Legacy Gear debug controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', borderTop: '1px solid #442222', paddingTop: 4, marginTop: 4 }}>
              <span style={{ color: '#c49eff', fontSize: 9, fontWeight: 'bold' }}>Legacy:</span>
              <span style={{ color: '#886666', fontSize: 8 }}>Shards: {ensureLegacyData(bloodline).essenceShards}</span>
              <button
                style={{
                  background: '#1a0044', color: '#c49eff',
                  border: '1px solid #c49eff44', borderRadius: 3, padding: '1px 5px',
                  fontFamily: 'monospace', fontSize: 9, cursor: 'pointer',
                }}
                onClick={() => {
                  const bl = structuredClone(bloodline);
                  const ld = ensureLegacyData(bl);
                  addEssenceShards(ld, 50);
                  const g = getGearForClass(ld, selectedClass);
                  if (!g.earned) { g.earned = true; if (g.level === 0) g.level = 1; }
                  saveBloodline(bl);
                  setBloodline(bl);
                }}
              >
                +50 Shards
              </button>
              <button
                style={{
                  background: '#1a0044', color: '#c49eff',
                  border: '1px solid #c49eff44', borderRadius: 3, padding: '1px 5px',
                  fontFamily: 'monospace', fontSize: 9, cursor: 'pointer',
                }}
                onClick={() => {
                  const bl = structuredClone(bloodline);
                  const ld = ensureLegacyData(bl);
                  addEssenceShards(ld, 500);
                  const g = getGearForClass(ld, selectedClass);
                  if (!g.earned) { g.earned = true; if (g.level === 0) g.level = 1; }
                  saveBloodline(bl);
                  setBloodline(bl);
                }}
              >
                +500 Shards
              </button>
              <button
                style={{
                  background: '#1a0044', color: '#ffcc33',
                  border: '1px solid #ffcc3344', borderRadius: 3, padding: '1px 5px',
                  fontFamily: 'monospace', fontSize: 9, cursor: 'pointer',
                }}
                onClick={() => {
                  const bl = structuredClone(bloodline);
                  const ld = ensureLegacyData(bl);
                  for (const def of LEGACY_GEAR_DEFS) {
                    const gear = getGearForClass(ld, def.classId);
                    gear.earned = true;
                    if (gear.level === 0) gear.level = 1;
                  }
                  saveBloodline(bl);
                  setBloodline(bl);
                }}
              >
                Earn All
              </button>
              <button
                style={{
                  background: '#1a0044', color: '#ff2a6d',
                  border: '1px solid #ff2a6d44', borderRadius: 3, padding: '1px 5px',
                  fontFamily: 'monospace', fontSize: 9, cursor: 'pointer',
                }}
                onClick={() => {
                  const bl = structuredClone(bloodline);
                  const ld = ensureLegacyData(bl);
                  for (const def of LEGACY_GEAR_DEFS) {
                    const gear = getGearForClass(ld, def.classId);
                    gear.earned = true;
                    gear.level = 20;
                  }
                  saveBloodline(bl);
                  setBloodline(bl);
                }}
              >
                Max All
              </button>
              <button
                style={{
                  background: '#440022', color: '#ff4488',
                  border: '1px solid #ff448844', borderRadius: 3, padding: '1px 5px',
                  fontFamily: 'monospace', fontSize: 9, cursor: 'pointer',
                }}
                onClick={() => {
                  const bl = structuredClone(bloodline);
                  bl.legacyData = undefined;
                  saveBloodline(bl);
                  setBloodline(bl);
                }}
              >
                Reset Legacy
              </button>
              <button
                style={{
                  background: '#002244', color: '#44ccff',
                  border: '1px solid #44ccff44', borderRadius: 3, padding: '1px 5px',
                  fontFamily: 'monospace', fontSize: 9, cursor: 'pointer',
                }}
                onClick={() => { setActiveElderTip(ELDER_LEGACY_SHARD); }}
              >
                Elder Tip
              </button>
            </div>
          </div>
        )}
        <div style={{ color: '#1a8a3a', fontFamily: 'monospace', fontSize: 11, marginBottom: 2, textShadow: '0 1px 4px #000, 0 0 8px #000' }}>
          Deepest floor reached: {bestFloor}
        </div>
        {bloodline.generation > 0 && (
          <div style={{ color: '#c49eff', fontFamily: 'monospace', fontSize: 10, marginBottom: 4 }}>
            Gen {bloodline.generation} | Traits: {bloodline.unlockedTraits.length}/20
            {bonusParts.length > 0 && <> | {bonusParts.join(' ')}</>}
          </div>
        )}
        <div style={classGridStyle}>
          {allClasses.map((cls) => {
            const floorLocked = bestFloor < cls.requiresBestFloor;
            const registrationLocked = cls.id === 'paladin' && !isRegistered;
            const rogueLocked = cls.id === 'rogue' && !addToHomeUnlocked;
            const locked = floorLocked || registrationLocked || rogueLocked;
            return (
              <button
                key={cls.id}
                style={locked ? (registrationLocked ? classCardRegLockedStyle : rogueLocked ? classCardRogueLockedStyle : classCardLockedStyle) : classCardStyle}
                onClick={async () => {
                  if (registrationLocked) {
                    // Show Elder dialogue first, then the account-creation modal
                    setActiveElderTip(ELDER_PALADIN_UNLOCK);
                    return;
                  }
                  if (rogueLocked) { setActiveElderTip(ELDER_ROGUE_UNLOCK); return; }
                  if (!locked) {
                    if (cls.id === 'rogue') tryShowElderTip(ELDER_ROGUE_FIRST_SELECT);
                    if (cls.id === 'paladin') tryShowElderTip(ELDER_PALADIN_FIRST_SELECT);
                    selectClassAndPickZone(cls.id);
                  }
                }}
                disabled={rogueLocked ? false : floorLocked}
              >
                {registrationLocked ? (
                  <>
                    <div style={{ color: cls.color, fontSize: 20, fontWeight: 'bold', opacity: 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      {classPortraits[cls.id] ? (
                        <img src={classPortraits[cls.id]!} alt="" style={{ width: 40, height: 40, borderRadius: 4, border: `2px solid ${classBorderColors[cls.id] ?? '#33ff66'}66`, boxShadow: `0 0 6px ${classBorderColors[cls.id] ?? '#33ff66'}22`, objectFit: 'cover', imageRendering: 'pixelated' as const, opacity: 0.6 }} />
                      ) : (
                        <span>{cls.char}</span>
                      )}
                      {cls.name}
                    </div>
                    <div style={{ color: '#1a8a3a', fontSize: 10, marginTop: 4 }}>{cls.description}</div>
                    <div style={{ color: '#33ff66', fontSize: 10, marginTop: 6, opacity: 0.5 }}>
                      HP:{cls.baseStats.hp} Atk:{cls.baseStats.attack} Def:{cls.baseStats.defense} Spd:{cls.baseStats.speed}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      {cls.passives.map((p) => (
                        <div key={p.name} style={{ color: p.unlockLevel <= 1 ? '#ffd700' : '#6a5a1a', fontSize: 9, lineHeight: '13px' }}>
                          Lv{p.unlockLevel}: {p.name}
                        </div>
                      ))}
                    </div>
                    <div style={{ color: '#ffd700', fontSize: 11, marginTop: 8, fontWeight: 'bold', textShadow: '0 0 6px #ffd70044' }}>
                      Create account to unlock
                    </div>
                    <div style={{ color: '#664400', fontSize: 9, marginTop: 4, fontStyle: 'italic' }}>
                      Tap to learn how
                    </div>
                  </>
                ) : rogueLocked ? (
                  <>
                    <div style={{ color: '#ffcc33', fontSize: 20, fontWeight: 'bold', opacity: 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      {classPortraits[cls.id] ? (
                        <img src={classPortraits[cls.id]!} alt="" style={{ width: 40, height: 40, borderRadius: 4, border: `2px solid ${classBorderColors[cls.id] ?? '#33ff66'}44`, boxShadow: `0 0 6px ${classBorderColors[cls.id] ?? '#33ff66'}22`, objectFit: 'cover', imageRendering: 'pixelated' as const, opacity: 0.6 }} />
                      ) : (
                        <span>🗡</span>
                      )}
                      {cls.name}
                    </div>
                    <div style={{ color: '#997722', fontSize: 10, marginTop: 4, fontStyle: 'italic' }}>"Fast, deadly, and patient."</div>
                    <div style={{ color: '#33ff66', fontSize: 10, marginTop: 6, opacity: 0.4 }}>
                      HP:?? Atk:?? Def:?? Spd:??
                    </div>
                    <div style={{ color: '#ffcc33', fontSize: 10, marginTop: 6, fontWeight: 'bold', lineHeight: 1.5 }}>
                      Save to home screen to unlock
                    </div>
                    <div style={{ color: '#664400', fontSize: 9, marginTop: 4, fontStyle: 'italic' }}>
                      Tap to learn how
                    </div>
                  </>
                ) : floorLocked ? (
                  <>
                    <div style={{ color: cls.color, fontSize: 20, fontWeight: 'bold', opacity: 0.4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      {classPortraits[cls.id] ? (
                        <img src={classPortraits[cls.id]!} alt="" style={{ width: 40, height: 40, borderRadius: 4, border: `2px solid ${classBorderColors[cls.id] ?? '#33ff66'}33`, boxShadow: `0 0 6px ${classBorderColors[cls.id] ?? '#33ff66'}22`, objectFit: 'cover', imageRendering: 'pixelated' as const, opacity: 0.4 }} />
                      ) : (
                        <span>[x]</span>
                      )}
                      {cls.name}
                    </div>
                    <div style={{ color: '#1a5a2a', fontSize: 10, marginTop: 4 }}>{cls.description}</div>
                    <div style={{ color: '#33ff66', fontSize: 10, marginTop: 6, opacity: 0.5 }}>
                      HP:?? Atk:?? Def:?? Spd:??
                    </div>
                    <div style={{ color: '#ffd700', fontSize: 10, marginTop: 6, fontWeight: 'bold' }}>
                      Reach floor {cls.requiresBestFloor} to unlock
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ color: cls.color, fontSize: 20, fontWeight: 'bold', textShadow: `0 0 8px ${cls.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      {classPortraits[cls.id] ? (
                        <img src={classPortraits[cls.id]!} alt="" style={{ width: 40, height: 40, borderRadius: 4, border: `2px solid ${classBorderColors[cls.id] ?? '#33ff66'}`, boxShadow: `0 0 8px ${classBorderColors[cls.id] ?? '#33ff66'}44`, objectFit: 'cover', imageRendering: 'pixelated' as const }} />
                      ) : (
                        <span>{cls.char}</span>
                      )}
                      {cls.name}
                    </div>
                    <div style={{ color: '#1a8a3a', fontSize: 10, marginTop: 4 }}>{cls.description}</div>
                    <div style={{ color: '#33ff66', fontSize: 10, marginTop: 6 }}>
                      HP:{cls.baseStats.hp} Atk:{cls.baseStats.attack} Def:{cls.baseStats.defense} Spd:{cls.baseStats.speed}
                    </div>
                    {/* Compact view — passive names only */}
                    <div style={{ marginTop: 4 }}>
                      {cls.passives.map((p) => (
                        <div key={p.name} style={{ color: p.unlockLevel <= 1 ? '#33ff66' : '#0a5a1a', fontSize: 9, lineHeight: '13px' }}>
                          Lv{p.unlockLevel}: {p.name}
                        </div>
                      ))}
                    </div>
                    {/* More Info / Less Info toggle */}
                    <div
                      style={{ color: '#4488cc', fontSize: 9, marginTop: 6, textAlign: 'center', cursor: 'pointer', opacity: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const isExpanding = expandedClass !== cls.id;
                        setExpandedClass(isExpanding ? cls.id : null);
                        if (isExpanding) {
                          // Scroll the card into view after it expands
                          setTimeout(() => {
                            const el = (e.target as HTMLElement).closest('button');
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }, 50);
                        }
                      }}
                    >
                      {expandedClass === cls.id ? '[ Less Info ▲ ]' : '[ More Info ▼ ]'}
                    </div>
                    {/* Expanded view */}
                    {expandedClass === cls.id && (
                      <>
                        {/* Starting gear */}
                        <div style={{ marginTop: 6, borderTop: '1px solid #0a3a0a', paddingTop: 4 }}>
                          <div style={{ color: '#aa8833', fontSize: 8, marginBottom: 2 }}>STARTS WITH:</div>
                          <div style={{ color: '#aaaacc', fontSize: 8, lineHeight: '12px' }}>
                            {cls.id === 'warrior' && '⚔ Short Sword + ❤ Health Potion'}
                            {cls.id === 'rogue' && '🗡 Rusty Dagger + 🍞 Bread'}
                            {cls.id === 'mage' && '❤ Health Potion (no weapon — magic is your weapon)'}
                            {cls.id === 'ranger' && '🍞 Bread (Forager makes food extra powerful)'}
                            {cls.id === 'paladin' && '⚔ Short Sword'}
                            {cls.id === 'necromancer' && '❤ Health Potion'}
                            {cls.id === 'revenant' && '🍞 Bread'}
                          </div>
                        </div>
                        {/* Playstyle tips */}
                        <div style={{ marginTop: 4, borderTop: '1px solid #0a3a0a', paddingTop: 4 }}>
                          <div style={{ color: '#aa8833', fontSize: 8, marginBottom: 2 }}>HOW TO PLAY:</div>
                          <div style={{ color: '#8888aa', fontSize: 8, lineHeight: '12px' }}>
                            {cls.id === 'warrior' && 'Tank hits with Thick Skin (-1 dmg). Go Berserker at low HP for +50% damage. Shield Wall passively blocks 30% of all damage.'}
                            {cls.id === 'rogue' && 'Your high speed lets you dodge attacks naturally. Backstab for double damage. Use Shadow Step to escape without getting hit.'}
                            {cls.id === 'mage' && 'Arcane Sight gives you extra vision from the start. Spell Strike adds bonus magic damage on 20% of hits. Mana Shield can save your life.'}
                            {cls.id === 'ranger' && 'Keen Eye gives you RANGED ATTACKS (3 tiles) — tap enemies from a distance! Forager makes food heal more. Survival Instinct auto-heals near death.'}
                            {cls.id === 'paladin' && 'Divine Light heals you every 6 turns passively. Smite Evil crushes dark enemies. Holy Aegis negates dark damage. Great vs undead zones.'}
                            {cls.id === 'necromancer' && 'Life Drain heals on every kill. Death Aura damages nearby enemies each turn. Undying Will saves you from a killing blow. Wither melts enemy armor.'}
                            {cls.id === 'revenant' && 'Glass cannon — huge attack, low HP. Deathless Fury gives +100% damage below 20% HP. Soul Siphon can fully heal on kills. Beyond Death revives you once per floor.'}
                          </div>
                        </div>
                        {/* Passives with descriptions */}
                        <div style={{ marginTop: 4, borderTop: '1px solid #0a3a0a', paddingTop: 4 }}>
                          <div style={{ color: '#aa8833', fontSize: 8, marginBottom: 2 }}>PASSIVES:</div>
                          {cls.passives.map((p) => (
                            <div key={p.name} style={{ color: p.unlockLevel <= 1 ? '#33ff66' : '#0a5a1a', fontSize: 9, lineHeight: '13px' }}>
                              Lv{p.unlockLevel}: {p.name} — <span style={{ color: '#6a6a8a', fontSize: 8 }}>{p.description}</span>
                            </div>
                          ))}
                        </div>
                        {/* Level-up abilities */}
                        {cls.abilityPool && cls.abilityPool.length > 0 && (
                          <div style={{ marginTop: 4, borderTop: '1px solid #0a3a0a', paddingTop: 4 }}>
                            <div style={{ color: '#aa8833', fontSize: 8, marginBottom: 2 }}>LEVEL-UP PICKS:</div>
                            {cls.abilityPool.map((a) => (
                              <div key={a.id} style={{ color: a.color, fontSize: 8, lineHeight: '12px', opacity: 0.8 }}>
                                {a.icon} {a.name} — <span style={{ color: '#555', fontSize: 8 }}>{a.description}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Play button inside expanded view */}
                        <div
                          style={{
                            marginTop: 8, padding: '6px 0', textAlign: 'center',
                            background: `${cls.color}22`, border: `1px solid ${cls.color}66`,
                            color: cls.color, fontSize: 12, fontFamily: 'monospace', fontWeight: 'bold',
                            cursor: 'pointer',
                          }}
                          onClick={(e) => { e.stopPropagation(); selectClassAndPickZone(cls.id); }}
                        >
                          {'[ Play as ' + cls.name + ' ]'}
                        </div>
                      </>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
        <button
          style={{ ...secondaryBtnStyle, color: '#c49eff', borderColor: '#c49eff44', marginBottom: 4 }}
          onClick={() => setShowLegacyGear(true)}
        >
          {'[ Legacy Gear ]'}
        </button>
        <button style={secondaryBtnStyle} onClick={() => { setScreen('title'); setActiveElderTip(null); }}>
          {'[ Back ]'}
        </button>
          </>
        )}
      </div>
      {elderPortal}
      {generationLoadingPortal}
      {addToHomePortal}
      {paladinUnlockPortal}
      {showLegacyGear && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#0a0a12' }}>
          <LegacyGearView
            bloodline={bloodline}
            onSave={(bl) => {
              saveBloodline(bl);
              setBloodline({ ...bl });
            }}
            onClose={() => setShowLegacyGear(false)}
          />
        </div>,
        document.body,
      )}
      {/* Class Detail Screen - FULLSCREEN stained glass portrait */}
      {showClassDetail && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: '#000',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Image fills screen, maintaining aspect ratio */}
          {(classPortraits[`${showClassDetail}-fullscreen`] || classPortraits[showClassDetail]) && (
            <img
              src={classPortraits[`${showClassDetail}-fullscreen`] ?? classPortraits[showClassDetail]!}
              alt={showClassDetail}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: '100%',
                objectFit: 'contain',
                imageRendering: 'pixelated',
              }}
            />
          )}
          
          {/* Invisible tap zone for BACK (bottom 8% of screen) */}
          <button
            style={{
              position: 'absolute',
              bottom: 0,
              left: '25%',
              width: '50%',
              height: '8%',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={() => setShowClassDetail(null)}
          />
          
          {/* Tap anywhere else to START (covers rest of screen) */}
          <button
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '92%',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={() => {
              setShowClassDetail(null);
              setScreen('zoneSelect');
            }}
          />
        </div>,
        document.body,
      )}
      </>
    );
  }

  if (screen === 'generativeClassSelect') {
    return (
      <GenerativeClassSelect
        savedClasses={savedGeneratedClasses}
        onSelectClass={(genClass) => {
          setActiveGeneratedClass(genClass);
          setSelectedClass('generated');
          // Save to local storage for engine access
          safeSetItem('activeGeneratedClass', JSON.stringify(genClass));
          // Add to saved classes if not already there
          if (!savedGeneratedClasses.find(c => c.id === genClass.id)) {
            const updated = [genClass, ...savedGeneratedClasses].slice(0, 10);
            setSavedGeneratedClasses(updated);
            safeSetItem('savedGeneratedClasses', JSON.stringify(updated));
          }
          // Generated classes go directly to narrative_test zone
          // Pass 'generated' explicitly since React state update is async
          beginGame('narrative_test', 'generated');
        }}
        onBack={() => setScreen('classSelect')}
      />
    );
  }

  if (screen === 'zoneSelect') {
    const bossLog = bloodline.bossKillLog ?? [];
    return (
      <div style={{ ...fullScreenStyle, overflowY: 'auto', justifyContent: 'flex-start', paddingTop: 20 }}>
        <div style={{ ...titleTextStyle, fontSize: 20 }}>Choose Your Zone</div>
        <div style={{ color: '#1a8a3a', fontFamily: 'monospace', fontSize: 11, marginBottom: 4 }}>
          Defeat bosses with specific characters to unlock new zones
        </div>
        <div style={classGridStyle}>
          {ZONE_DEFS.filter((z) => !z.isDebugZone).map((zone) => {
            const unlocked = isZoneUnlocked(zone.id, bossLog);
            return (
              <button
                key={zone.id}
                style={unlocked ? { ...classCardStyle, borderColor: zone.color + '66' } : classCardLockedStyle}
                onClick={() => { if (unlocked) beginGame(zone.id); }}
                disabled={!unlocked}
              >
                {unlocked ? (
                  <>
                    <div style={{ color: zone.color, fontSize: 18, fontWeight: 'bold', textShadow: `0 0 8px ${zone.color}44` }}>
                      {zone.icon} {zone.name}
                    </div>
                    <div style={{ color: '#1a8a3a', fontSize: 10, marginTop: 4, lineHeight: '14px' }}>
                      {zone.description}
                    </div>
                    <div style={{ color: zone.color, fontSize: 9, marginTop: 6, opacity: 0.7 }}>
                      Floors {zone.floorRange.min}-{zone.floorRange.max}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ color: zone.color, fontSize: 18, fontWeight: 'bold', opacity: 0.4 }}>
                      [x] {zone.name}
                    </div>
                    <div style={{ color: '#1a5a2a', fontSize: 10, marginTop: 4, lineHeight: '14px' }}>
                      {zone.description}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      {zone.unlockRequirements.map((req, i) => {
                        const done = bossLog.includes(`${req.bossName}|${req.withClass}`);
                        return (
                          <div key={i} style={{ color: done ? '#33ff66' : '#ffd700', fontSize: 9, lineHeight: '13px' }}>
                            {done ? '✓' : '○'} Beat {req.bossName} as {req.withClass.charAt(0).toUpperCase() + req.withClass.slice(1)}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
        <button style={secondaryBtnStyle} onClick={() => setScreen('classSelect')}>
          {'[ Back ]'}
        </button>
      </div>
    );
  }

  if (screen === 'gameover' && state) {
    return (
      <div style={{ ...fullScreenStyle, overflowY: 'auto', justifyContent: 'flex-start', paddingTop: 30 }}>
        <div style={asciiBoxStyle}>
          <pre style={asciiFrameStyle}>{'+-====== GAME OVER ======-+'}</pre>
          {(() => {
            const dmg = classPortraits[`${state.playerClass}-damaged`];
            const norm = classPortraits[state.playerClass];
            const src = dmg || norm;
            const border = dmg ? '#ff3333' : (classBorderColors[state.playerClass] ?? '#ff6644');
            return src ? (
              <img src={src} alt="" style={{ width: 96, height: 96, borderRadius: 6, border: `2px solid ${border}`, boxShadow: `0 0 12px ${border}33`, objectFit: 'cover', imageRendering: 'pixelated' as const, margin: '8px auto 6px', display: 'block' }} />
            ) : null;
          })()}
          <div style={gameOverTitleStyle}>YOU HAVE PERISHED</div>
          <div style={scoreLineStyle}>{'Floor Reached .. '}{state.floorNumber}</div>
          <div style={scoreLineStyle}>{'Level .......... '}{state.player.level}</div>
          <div style={scoreLineStyle}>{'Turns Survived . '}{state.turn}</div>
          <div style={scoreLineStyle}>{'Kills .......... '}{state.runStats.kills}</div>
          <div style={{ ...scoreLineStyle, color: '#ffd700' }}>{'Score .......... '}{state.score}</div>
          {state.runStats.essenceShardsEarned > 0 && (
            <div style={{ ...scoreLineStyle, color: '#c49eff' }}>{'Essence Shards . '}{state.runStats.essenceShardsEarned}</div>
          )}
          <pre style={asciiFrameStyle}>{'+-========================-+'}</pre>
        </div>

        {/* First death: Try Again at top */}
        {deathInfo?.isFirstDeath && (
          <button style={{ ...playBtnStyle, marginBottom: 12 }} onClick={startGame}>
            {'[ Try Again ]'}
          </button>
        )}

        {/* ═══ POST-DEATH PROGRESSION — different message per death ═══ */}
        {deathInfo && (
          <div style={{
            width: '90%', maxWidth: 360, margin: '0 auto 12px',
            padding: '12px 14px',
            border: `1px solid ${deathInfo.isFirstDeath ? '#33ff6666' : deathInfo.isSecondDeath ? '#ff664444' : '#33ff6633'}`,
            background: 'linear-gradient(180deg, #0a1a0a 0%, #0a0a16 100%)',
            fontFamily: 'monospace',
            textAlign: 'center',
          }}>

            {/* ═══ FIRST DEATH: "Death is not the end" tutorial ═══ */}
            {deathInfo.isFirstDeath && (
              <>
                <div style={{ color: '#33ff66', fontSize: 16, fontWeight: 'bold', marginBottom: 8, textShadow: '0 0 10px #33ff6666' }}>
                  DEATH IS NOT THE END
                </div>
                <div style={{ color: '#aaccaa', fontSize: 11, lineHeight: 1.7, marginBottom: 12 }}>
                  Every death makes your next run stronger. Your ancestor's sacrifice left you these permanent bonuses:
                </div>

                {/* Big stat gain cards */}
                <div style={{
                  display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6,
                  marginBottom: 12, padding: '10px 0',
                  border: '1px solid #33ff6633', background: '#0a1a0a',
                }}>
                  {deathInfo.statGains.map((g) => (
                    <div key={g.label} style={{
                      background: '#1a2a1a', border: '1px solid #33ff6644', padding: '6px 10px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 55,
                    }}>
                      <div style={{ color: '#88cc88', fontSize: 9 }}>{g.label}</div>
                      <div style={{ color: '#33ff66', fontSize: 18, fontWeight: 'bold', textShadow: '0 0 6px #33ff6644' }}>+{g.after - g.before}</div>
                    </div>
                  ))}
                  {deathInfo.goldGain > 0 && (
                    <div style={{
                      background: '#2a2a1a', border: '1px solid #ffd70044', padding: '6px 10px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 55,
                    }}>
                      <div style={{ color: '#ccaa66', fontSize: 9 }}>GOLD</div>
                      <div style={{ color: '#ffd700', fontSize: 18, fontWeight: 'bold', textShadow: '0 0 6px #ffd70044' }}>+{deathInfo.goldGain}</div>
                    </div>
                  )}
                  {deathInfo.hungerGain > 0 && (
                    <div style={{
                      background: '#1a2a1a', border: '1px solid #33ff6644', padding: '6px 10px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 55,
                    }}>
                      <div style={{ color: '#88cc88', fontSize: 9 }}>HUNGER</div>
                      <div style={{ color: '#33ff66', fontSize: 18, fontWeight: 'bold', textShadow: '0 0 6px #33ff6644' }}>+{deathInfo.hungerGain}</div>
                    </div>
                  )}
                </div>

                <div style={{ color: '#aaccaa', fontSize: 11, lineHeight: 1.6, marginBottom: 8 }}>
                  These bonuses are <span style={{ color: '#33ff66', fontWeight: 'bold' }}>permanent</span>. You'll start every future run stronger. The more you play, the more powerful your bloodline becomes.
                </div>

                <div style={{ color: '#8a7aaa', fontSize: 10, marginBottom: 10 }}>
                  Ancestor "{deathInfo.ancestor.name}" remembered.
                </div>

                <div style={{
                  padding: '8px 10px', margin: '0 0 6px',
                  border: '1px solid #c49eff55', background: '#0a0a1a',
                  fontSize: 10, color: '#bbaadd', lineHeight: 1.6,
                }}>
                  Tap <span style={{ color: '#c49eff', fontWeight: 'bold' }}>Bloodline</span> below to see your growing power. Each death adds more.
                </div>
              </>
            )}

            {/* ═══ SECOND DEATH: Point to Bestiary ═══ */}
            {deathInfo.isSecondDeath && (
              <>
                <div style={{ color: '#33ff66', fontSize: 14, fontWeight: 'bold', marginBottom: 6, textShadow: '0 0 8px #33ff6644' }}>
                  YOUR LEGACY GROWS
                </div>

                {/* Stat gains */}
                {(deathInfo.statGains.length > 0 || deathInfo.goldGain > 0) && (
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 5,
                    marginBottom: 10, padding: '6px 0',
                    borderTop: '1px solid #33ff6622', borderBottom: '1px solid #33ff6622',
                  }}>
                    {deathInfo.statGains.map((g) => (
                      <div key={g.label} style={{
                        background: '#1a2a1a', border: '1px solid #33ff6633', padding: '4px 8px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 48,
                      }}>
                        <div style={{ color: '#88cc88', fontSize: 9 }}>{g.label}</div>
                        <div style={{ color: '#33ff66', fontSize: 14, fontWeight: 'bold' }}>+{g.after - g.before}</div>
                      </div>
                    ))}
                    {deathInfo.goldGain > 0 && (
                      <div style={{
                        background: '#2a2a1a', border: '1px solid #ffd70033', padding: '4px 8px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 48,
                      }}>
                        <div style={{ color: '#ccaa66', fontSize: 9 }}>GOLD</div>
                        <div style={{ color: '#ffd700', fontSize: 14, fontWeight: 'bold' }}>+{deathInfo.goldGain}</div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ color: '#8a7aaa', fontSize: 10, marginBottom: 10 }}>
                  Generation {deathInfo.generation} — "{deathInfo.ancestor.name}" remembered.
                </div>

                {/* Bestiary callout */}
                <div style={{
                  padding: '10px 12px', margin: '0 0 6px',
                  border: '1px solid #ff664444', background: '#1a0a0a',
                  fontSize: 11, lineHeight: 1.6,
                }}>
                  <div style={{ color: '#ff6644', fontWeight: 'bold', marginBottom: 4, fontSize: 12 }}>
                    BESTIARY UNLOCKED
                  </div>
                  <div style={{ color: '#ccaa99' }}>
                    You've already encountered monsters — tap <span style={{ color: '#ff6644', fontWeight: 'bold' }}>Bestiary</span> below to see them. Track every creature you find and earn rewards for killing them!
                  </div>
                </div>
              </>
            )}

            {/* ═══ THIRD+ DEATHS: Standard progression display ═══ */}
            {!deathInfo.isFirstDeath && !deathInfo.isSecondDeath && (
              <>
                <div style={{ color: '#33ff66', fontSize: 13, fontWeight: 'bold', marginBottom: 8, textShadow: '0 0 8px #33ff6644' }}>
                  YOUR LEGACY GROWS
                </div>

                {(deathInfo.statGains.length > 0 || deathInfo.goldGain > 0 || deathInfo.hungerGain > 0) && (
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 5,
                    marginBottom: 10, padding: '6px 0',
                    borderTop: '1px solid #33ff6622', borderBottom: '1px solid #33ff6622',
                  }}>
                    {deathInfo.statGains.map((g) => (
                      <div key={g.label} style={{
                        background: '#1a2a1a', border: '1px solid #33ff6633', padding: '4px 8px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 48,
                      }}>
                        <div style={{ color: '#88cc88', fontSize: 9 }}>{g.label}</div>
                        <div style={{ color: '#33ff66', fontSize: 14, fontWeight: 'bold' }}>+{g.after - g.before}</div>
                      </div>
                    ))}
                    {deathInfo.goldGain > 0 && (
                      <div style={{
                        background: '#2a2a1a', border: '1px solid #ffd70033', padding: '4px 8px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 48,
                      }}>
                        <div style={{ color: '#ccaa66', fontSize: 9 }}>GOLD</div>
                        <div style={{ color: '#ffd700', fontSize: 14, fontWeight: 'bold' }}>+{deathInfo.goldGain}</div>
                      </div>
                    )}
                    {deathInfo.hungerGain > 0 && (
                      <div style={{
                        background: '#1a2a1a', border: '1px solid #33ff6633', padding: '4px 8px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 48,
                      }}>
                        <div style={{ color: '#88cc88', fontSize: 9 }}>HUNGER</div>
                        <div style={{ color: '#33ff66', fontSize: 14, fontWeight: 'bold' }}>+{deathInfo.hungerGain}</div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ color: '#8a7aaa', fontSize: 10, marginBottom: 4 }}>
                  Generation {deathInfo.generation} — "{deathInfo.ancestor.name}" remembered.
                </div>
              </>
            )}

            {/* New traits (all deaths) */}
            {deathInfo.newTraits.length > 0 && (
              <div style={{ marginTop: 8, borderTop: '1px solid #33ff6622', paddingTop: 8 }}>
                <div style={{ color: '#33ff66', fontSize: 11, fontWeight: 'bold', marginBottom: 4 }}>
                  NEW TRAITS UNLOCKED:
                </div>
                {deathInfo.newTraits.map((t) => (
                  <div key={t.id} style={{ marginTop: 4 }}>
                    <span style={{ color: t.color, fontSize: 11, fontWeight: 'bold' }}>
                      [{t.icon}] {t.name}
                    </span>
                    <span style={{ color: '#557755', fontSize: 9, marginLeft: 6 }}>
                      {t.description}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {deathInfo.newTraits.some((t) => t.id === 'initiate') && (
              <div style={{
                marginTop: 10, padding: '8px 10px',
                border: '1px solid #c49eff', background: '#1a0a2a',
              }}>
                <div style={{ color: '#c49eff', fontSize: 12, fontWeight: 'bold', marginBottom: 4, textShadow: '0 0 8px #c49eff66' }}>
                  JOURNEY COMPLETE
                </div>
                <div style={{ color: '#ffd700', fontSize: 11, fontWeight: 'bold', marginBottom: 2 }}>
                  REWARD: Ancestor's Fang
                </div>
                <div style={{ color: '#9966cc', fontSize: 10 }}>
                  A blade earned through blood. Yours at the start of every future run.
                </div>
              </div>
            )}

            <div style={{ color: '#6a5a8a', fontSize: 9, marginTop: 6 }}>
              Traits: {bloodline.unlockedTraits.length}/20
            </div>
          </div>
        )}

        {/* Try Again button - shown here for non-first deaths (first death shows at top) */}
        {!deathInfo?.isFirstDeath && (
          <button style={playBtnStyle} onClick={startGame}>
            {'[ Try Again ]'}
          </button>
        )}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {necropolisUnlocked && (
            <button style={necropolisBtnStyle} onClick={() => {
              setShowNecropolis(true);
              trackDeathScreenAction({ action: 'necropolis_opened', generation: bloodline.generation, isFirstDeath: !!deathInfo?.isFirstDeath, isSecondDeath: !!deathInfo?.isSecondDeath });
            }}>
              {'[ Necropolis ]'}
            </button>
          )}
          <button style={secondaryBtnStyle} onClick={() => {
            setShowLeaderboard(true);
            trackDeathScreenAction({ action: 'leaderboard_opened', generation: bloodline.generation, isFirstDeath: !!deathInfo?.isFirstDeath, isSecondDeath: !!deathInfo?.isSecondDeath });
          }}>
            {'[ Leaderboard ]'}
          </button>
          <button
            style={deathInfo?.isFirstDeath ? {
              ...bloodlineBtnStyle,
              borderColor: '#c49eff',
              boxShadow: '0 0 12px #c49eff44',
              animation: 'none',
            } : bloodlineBtnStyle}
            onClick={() => {
              setShowBloodline(true);
              trackDeathScreenAction({ action: 'bloodline_opened', generation: bloodline.generation, isFirstDeath: !!deathInfo?.isFirstDeath, isSecondDeath: !!deathInfo?.isSecondDeath });
            }}
          >
            {deathInfo?.isFirstDeath ? '[ Bloodline >> ]' : '[ Bloodline ]'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            style={deathInfo?.isSecondDeath ? {
              ...secondaryBtnStyle,
              color: '#ff6644',
              borderColor: '#ff6644',
              boxShadow: '0 0 12px #ff664444',
            } : secondaryBtnStyle}
            onClick={() => {
              setShowBestiary(true);
              trackDeathScreenAction({ action: 'bestiary_opened', generation: bloodline.generation, isFirstDeath: !!deathInfo?.isFirstDeath, isSecondDeath: !!deathInfo?.isSecondDeath });
            }}
          >
            {deathInfo?.isSecondDeath ? '[ Bestiary >> ]' : '[ Bestiary ]'}
          </button>
          <button style={secondaryBtnStyle} onClick={() => {
            setShowRunHistory(true);
            trackDeathScreenAction({ action: 'history_opened', generation: bloodline.generation, isFirstDeath: !!deathInfo?.isFirstDeath, isSecondDeath: !!deathInfo?.isSecondDeath });
          }}>
            {'[ History ]'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button style={{ ...secondaryBtnStyle, color: '#55ccff', borderColor: '#55ccff', textShadow: '0 0 6px #55ccff44' }} onClick={() => openEchoTree('death')}>
            {'[ Echo Tree ]'}
          </button>
          <button style={{ ...secondaryBtnStyle, color: '#55ccff', borderColor: '#1a4a5a' }} onClick={() => openQuestLog('death')}>
            {'[ Quests ]'}
          </button>
          <button style={secondaryBtnStyle} onClick={() => setShowJournal(true)}>
            {(() => {
              const newCount = getNewLoreIds({ bloodline, questEchoData }, bloodline.journalSeenIds ?? []).length;
              return newCount > 0 ? `[ Journal ${newCount} ]` : '[ Journal ]';
            })()}
          </button>
        </div>
        <button style={discordBtnStyle} onClick={() => window.open('https://discord.gg/A9ayUtVv2Q', '_blank')}>
          {'[ Discord Community ]'}
        </button>
        {showBloodline && <BloodlineView bloodline={bloodline} onClose={() => setShowBloodline(false)} />}
        {showNecropolis && <NecropolisView onClose={() => setShowNecropolis(false)} />}
        {showQuestLog && <QuestLog data={questEchoData} characterQuests={state?.activeCharacterQuests} onClaim={handleClaimQuest} onClaimCharacterQuest={handleClaimCharacterQuest} onClose={() => setShowQuestLog(false)} onOpenEchoTree={() => { setShowQuestLog(false); openEchoTree('death_quest_log'); }} />}
        {(showLeaderboard || showBestiary || showRunHistory || showEchoTree || showJournal) && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 49, overflow: 'hidden' }}>
            {moreContentBgUrl && <img src={moreContentBgUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' as const }} />}
            {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
            {showBestiary && <Bestiary bloodline={bloodline} communalKills={getNecropolisState().communalKills} onClose={() => setShowBestiary(false)} />}
            {showRunHistory && <RunHistory bloodline={bloodline} onClose={() => setShowRunHistory(false)} />}
            {showEchoTree && <EchoTreeView data={questEchoData} onUnlock={handleUnlockEchoNode} onClose={() => setShowEchoTree(false)} />}
            {showJournal && <Journal bloodline={bloodline} questEchoData={questEchoData} seenIds={bloodline.journalSeenIds ?? []} onMarkSeen={handleJournalMarkSeen} onClose={() => setShowJournal(false)} />}
          </div>
        )}
        {elderPortal}
        {generationLoadingPortal}
        {addToHomePortal}
        {paladinUnlockPortal}
      </div>
    );
  }

  if (!state) return null;

  return (
    <div
      style={{
        ...gameContainerStyle,
        ...(combatEffect === 'hurt' ? { animation: 'combatShake 200ms ease-out, hurtFlash 200ms ease-out' } :
            combatEffect === 'hit'  ? { animation: 'hitFlash 150ms ease-out' } : {}),
      }}
      onAnimationEnd={() => setCombatEffect(null)}
    >
      <HUD state={state} generation={bloodline.generation} isPremium={isPremium} echoes={questEchoData.echoes} />
      {bloodline.generation === 0 && !bloodline.tutorialComplete && (
        <TutorialBar completedSteps={tutorialSteps} />
      )}
      <div style={topOverlayRowStyle}>
        {!isPremium && (
          <button style={premiumOverlayBtnStyle} onClick={() => { setShowPremiumModal(true); trackOfferShown('premium'); }} title="Remove ads + slower hunger — $1.99">
            {'⭐ 2x Gold'}
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button style={musicToggleBtnStyle} onClick={toggleMute}>
          {muted ? '♪' : '♫'}
        </button>
      </div>
      <button style={discordOverlayBtnStyle} onClick={() => window.open('https://discord.gg/A9ayUtVv2Q', '_blank')}>
        {'Discord'}
      </button>
      <GameView 
        state={state} 
        onChange={handleChange} 
        onEnemyEncounter={async (enemyId, enemyName, enemy, _targetX, _targetY) => {
          console.log('[Game] onEnemyEncounter called:', enemyName);
          
          // Skip if already encountered
          if (state?.encounteredEnemyIds?.includes(enemyId)) {
            console.log('[Game] Already encountered, skipping');
            return false;
          }
          
          // Skip bosses
          if (enemy.isBoss) {
            console.log('[Game] Boss, skipping');
            return false;
          }
          
          // All creatures get dialogue options in narrative zones
          // Even "mindless" creatures can have interesting encounters
          
          // Trigger encounter
          const showed = await checkEnemyEncounter(enemyId, enemyName, enemy);
          console.log('[Game] checkEnemyEncounter result:', showed);
          return showed;
        }}
      />
      <MessageLog messages={state.messages} state={state} />
      <div style={bottomBarStyle}>
        <div style={sideButtonsStyle}>
          {state.playerClass === 'warrior' && (() => {
            const rage = getWarriorRage(state);
            const ready = rage >= 30;
            return (
              <button
                style={{
                  ...actionBtnStyle,
                  color: ready ? '#ff2200' : '#555555',
                  borderColor: ready ? '#ff2200' : '#444444',
                  textShadow: ready ? '0 0 8px #ff220088' : undefined,
                  cursor: ready ? 'pointer' : 'not-allowed',
                }}
                onClick={handleRageStrike}
                disabled={!ready}
                title={ready ? 'Rage Strike! AoE attack toward the strongest enemy' : `Rage: ${rage}/100`}
              >
                {'[ RAGE ]'}
              </button>
            );
          })()}
          {state.playerClass === 'paladin' && (() => {
            const vow = getPaladinVow(state);
            const active = isPaladinVowActive(state);
            const ready = vow >= 2 && !active;
            const color = active ? '#ffffff' : ready ? '#ffd700' : '#555555';
            const borderColor = active ? '#ffffff' : ready ? '#ffd700' : '#444444';
            return (
              <button
                style={{
                  ...actionBtnStyle,
                  color,
                  borderColor,
                  textShadow: ready || active ? `0 0 8px ${color}88` : undefined,
                  cursor: ready ? 'pointer' : 'not-allowed',
                }}
                onClick={handleSacredVow}
                disabled={!ready}
                title={active ? 'Sacred Vow active — next hit negated!' : ready ? `Sacred Vow: negate next hit (costs 2 stacks, ${vow} available)` : `Kill enemies to build Vow stacks (need 2, have ${vow})`}
              >
                {'[ VOW ]'}
              </button>
            );
          })()}
          {state.playerClass === 'rogue' && (() => {
            const cd = getRogueShadowCooldown(state);
            const ready = cd === 0;
            return (
              <button
                style={{
                  ...actionBtnStyle,
                  color: ready ? '#aa55ff' : '#555555',
                  borderColor: ready ? '#aa55ff' : '#444444',
                  textShadow: ready ? '0 0 8px #aa55ff88' : undefined,
                  cursor: ready ? 'pointer' : 'not-allowed',
                }}
                onClick={handleShadowStep}
                disabled={!ready}
                title={ready ? 'Shadow Step! Teleport behind nearest enemy for 3x damage' : `Shadow Step on cooldown (${cd} turns)`}
              >
                {ready ? '[ SHADOW ]' : `[ SHADOW ${cd} ]`}
              </button>
            );
          })()}
          {state.playerClass === 'mage' && (() => {
            const cd = getMageBlastCooldown(state);
            const hpCost = Math.max(1, Math.floor(state.player.stats.maxHp * 0.1));
            const ready = cd === 0 && state.player.stats.hp > hpCost;
            return (
              <button
                style={{
                  ...actionBtnStyle,
                  color: ready ? '#8855ff' : '#555555',
                  borderColor: ready ? '#8855ff' : '#444444',
                  textShadow: ready ? '0 0 8px #8855ff88' : undefined,
                  cursor: ready ? 'pointer' : 'not-allowed',
                }}
                onClick={handleArcaneBlast}
                disabled={!ready}
                title={cd > 0 ? `Arcane Blast on cooldown (${cd} turns)` : ready ? `Arcane Blast! Hit all nearby enemies (costs ${hpCost} HP)` : 'Not enough HP to cast Arcane Blast'}
              >
                {cd > 0 ? `[ BLAST ${cd} ]` : '[ BLAST ]'}
              </button>
            );
          })()}
          {state.playerClass === 'ranger' && (() => {
            const mark = getRangerMark(state);
            const active = mark.hitsLeft > 0;
            const ready = !active && mark.cooldown === 0;
            return (
              <button
                style={{
                  ...actionBtnStyle,
                  color: active ? '#ffaa00' : ready ? '#ffaa00' : '#555555',
                  borderColor: active ? '#ffaa00' : ready ? '#ffaa00' : '#444444',
                  textShadow: active || ready ? '0 0 8px #ffaa0088' : undefined,
                  cursor: ready ? 'pointer' : 'not-allowed',
                }}
                onClick={handleHuntersMark}
                disabled={!ready}
                title={active ? `Hunter's Mark active! ${mark.hitsLeft} double-damage hits left` : ready ? "Hunter's Mark! Mark nearest enemy for 3 double-damage hits" : `Hunter's Mark on cooldown (${mark.cooldown} turns)`}
              >
                {active ? `[ MARK ${mark.hitsLeft} ]` : mark.cooldown > 0 ? `[ MARK ${mark.cooldown} ]` : '[ MARK ]'}
              </button>
            );
          })()}
          {state.playerClass === 'necromancer' && (() => {
            const skele = getNecroSkeletons(state);
            const ready = skele.cooldown === 0 && skele.count < skele.max;
            return (
              <button
                style={{
                  ...actionBtnStyle,
                  color: ready ? '#aa44dd' : '#555555',
                  borderColor: ready ? '#aa44dd' : '#444444',
                  textShadow: ready ? '0 0 8px #aa44dd88' : undefined,
                  cursor: ready ? 'pointer' : 'not-allowed',
                }}
                onClick={() => {
                  if (!state || state.gameOver) return;
                  const next = { ...state };
                  const ok = summonSkeleton(next);
                  trackAbilityUsed({ ability: 'summon_skeleton', playerClass: next.playerClass, floor: next.floorNumber, zone: next.zone, hpPercent: next.player.stats.hp / next.player.stats.maxHp, success: ok, source: 'manual' });
                  if (ok) handleChange(next);
                }}
                disabled={!ready}
                title={ready ? `Summon Skeleton! Raise a skeleton minion to fight for you (${skele.count}/${skele.max})` : skele.count >= skele.max ? `Max skeletons summoned (${skele.count}/${skele.max})` : `Summon on cooldown (${skele.cooldown} turns)`}
              >
                {skele.cooldown > 0 ? `[ 💀 ${skele.cooldown} ]` : `[ 💀 ${skele.count}/${skele.max} ]`}
              </button>
            );
          })()}
          {/* Generated Class Ability Button */}
          {state.playerClass === 'generated' && (() => {
            const genInfo = getGeneratedClassInfo(state);
            if (!genInfo) return null;
            const ready = genInfo.abilityCooldown === 0 && genInfo.resource >= genInfo.abilityCost;
            return (
              <button
                style={{
                  ...actionBtnStyle,
                  color: ready ? genInfo.resourceColor : '#555',
                  borderColor: ready ? `${genInfo.resourceColor}44` : undefined,
                  cursor: ready ? 'pointer' : 'not-allowed',
                }}
                onClick={() => {
                  if (!state || state.gameOver) return;
                  const next = { ...state };
                  const ok = useGeneratedAbility(next);
                  trackAbilityUsed({ ability: 'generated_ability', playerClass: next.playerClass, floor: next.floorNumber, zone: next.zone, hpPercent: next.player.stats.hp / next.player.stats.maxHp, success: ok, source: 'manual' });
                  if (ok) handleChange(next);
                }}
                disabled={!ready}
                title={ready ? `${genInfo.abilityName}: Use your class ability (Cost: ${genInfo.abilityCost} ${genInfo.resourceName})` : genInfo.abilityCooldown > 0 ? `${genInfo.abilityName} on cooldown (${genInfo.abilityCooldown} turns)` : `Not enough ${genInfo.resourceName} (${genInfo.resource}/${genInfo.abilityCost})`}
              >
                {genInfo.abilityCooldown > 0 ? `[ ${genInfo.abilityIcon} ${genInfo.abilityCooldown} ]` : `[ ${genInfo.abilityIcon} ${genInfo.resource}/${genInfo.abilityCost} ]`}
              </button>
            );
          })()}
        </div>
        <DPad onMove={handleDPad} />
        <div style={sideButtonsStyle}>
          <button style={actionBtnStyle} onClick={() => setShowCharInfo(true)}>
            {'[ Me ]'}
          </button>
          <button
            style={{
              ...actionBtnStyle,
              color: questEchoData.activeQuests.some(q => q.completed) ? '#55ccff' : '#33ff66',
              borderColor: questEchoData.activeQuests.some(q => q.completed) ? '#55ccff' : undefined,
              textShadow: questEchoData.activeQuests.some(q => q.completed) ? '0 0 6px #55ccff44' : undefined,
            }}
            onClick={() => openQuestLog('game')}
          >
            {questEchoData.activeQuests.some(q => q.completed)
              ? `[ Quests ${questEchoData.activeQuests.filter(q => q.completed).length} ]`
              : '[ Quests ]'}
          </button>
          <button
            style={{
              ...actionBtnStyle,
              color: state.skillPoints > 0 ? '#ffcc33' : '#33ff66',
              borderColor: state.skillPoints > 0 ? '#ffcc33' : undefined,
              textShadow: state.skillPoints > 0 ? '0 0 6px #ffcc3344' : undefined,
            }}
            onClick={() => { tryShowElderTip(ELDER_SKILL_TREE); setShowSkillTree(true); }}
          >
            {state.skillPoints > 0 ? `[ Skills ${state.skillPoints} ]` : '[ Skills ]'}
          </button>
          <button style={actionBtnStyle} onClick={() => setShowInventory(true)}>
            {'[ Bag ]'}
          </button>
          {/* Stories button - only show in narrative_test zone or if there are existing stories */}
          {(state.zone === 'narrative_test' || (bloodline.storyJournal?.length ?? 0) > 0) && (
            <button 
              style={{
                ...actionBtnStyle,
                color: (bloodline.storyJournal?.length ?? 0) > 0 ? '#aa88ff' : '#33ff66',
              }}
              onClick={() => setShowStoryJournal(true)}
            >
              {(bloodline.storyJournal?.length ?? 0) > 0 ? `[ Stories ${bloodline.storyJournal?.length} ]` : '[ Stories ]'}
            </button>
          )}
          {isAtShop(state) && state.shop && state.shop.stock.length > 0 && (
            <button style={shopBtnStyle} onClick={() => setShowShop(true)}>
              {'[ Shop ]'}
            </button>
          )}
          <button style={actionBtnStyle} onClick={handleWait}>
            {'[ Wait ]'}
          </button>
          <div style={{ display: 'flex', gap: 2 }}>
            <button
              style={autoPlay ? autoBtnActiveStyle : actionBtnStyle}
              onClick={() => {
                setAutoPlay((v) => {
                  const toggling = !v;
                  if (toggling) {
                    completeTutorialStep('tried_auto');
                    if (autoPlayMode === 'full') tryShowElderTip(ELDER_AUTO_MODE);
                  }
                  if (state) {
                    trackAutoModeToggled({
                      enabled: toggling,
                      mode: autoPlayMode,
                      floor: state.floorNumber,
                      zone: state.zone,
                      playerClass: state.playerClass,
                      playerHpPercent: state.player.stats.maxHp > 0 ? Math.round((state.player.stats.hp / state.player.stats.maxHp) * 100) : 0,
                    });
                  }
                  return toggling;
                });
              }}
            >
              {autoPlay ? '[ Stop ]' : (autoPlayMode === 'full' ? '[ Auto ]' : '[ Explore ]')}
            </button>
            <button
              style={{
                ...actionBtnStyle,
                fontSize: 9,
                padding: '2px 5px',
                color: autoPlayMode === 'explore' ? '#44bbff' : '#8888aa',
                borderColor: autoPlayMode === 'explore' ? '#44bbff' : undefined,
              }}
              title={autoPlayMode === 'full' ? 'Full auto: fights everything' : 'Explore only: pauses when enemies appear'}
              onClick={() => setAutoPlayMode((m) => {
                const next = m === 'full' ? 'explore' : 'full';
                if (next === 'explore') tryShowElderTip(ELDER_EXPLORE_MODE);
                return next;
              })}
            >
              {autoPlayMode === 'full' ? 'FULL' : 'EXP'}
            </button>
            {/* Debug-only buttons */}
            {debugMode && (
              <>
                <button
                  style={{
                    ...actionBtnStyle,
                    fontSize: 9,
                    padding: '2px 5px',
                    color: autoPlaySeederMode ? '#ff8844' : '#8888aa',
                    borderColor: autoPlaySeederMode ? '#ff8844' : undefined,
                    background: autoPlaySeederMode ? '#332200' : undefined,
                  }}
                  title={autoPlaySeederMode ? 'Seeder ON: Triggers all enemy dialogues to generate content' : 'Seeder OFF: Normal autoplay'}
                  onClick={() => setAutoPlaySeederMode(v => !v)}
                >
                  {autoPlaySeederMode ? 'SEED' : 'seed'}
                </button>
                <button
                  style={{
                    ...actionBtnStyle,
                    fontSize: 9,
                    padding: '2px 5px',
                    color: runInBackground ? '#44ff88' : '#8888aa',
                    borderColor: runInBackground ? '#44ff88' : undefined,
                    background: runInBackground ? '#003322' : undefined,
                  }}
                  title={runInBackground ? 'Background ON: Game continues when tabbed away' : 'Background OFF: Game pauses when tabbed away'}
                  onClick={() => setRunInBackground(v => !v)}
                >
                  {runInBackground ? 'BG' : 'bg'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {showCharInfo && <CharacterInfo state={state} questEchoData={questEchoData} onClose={() => setShowCharInfo(false)} />}
      {showSkillTree && <SkillTreeView state={state} onChange={handleChange} onClose={() => setShowSkillTree(false)} />}
      {showQuestLog && <QuestLog data={questEchoData} characterQuests={state?.activeCharacterQuests} onClaim={handleClaimQuest} onClaimCharacterQuest={handleClaimCharacterQuest} onClose={() => setShowQuestLog(false)} onOpenEchoTree={() => { setShowQuestLog(false); openEchoTree('game_quest_log'); }} />}
      {showEchoTree && <EchoTreeView data={questEchoData} onUnlock={handleUnlockEchoNode} onClose={() => setShowEchoTree(false)} />}
      {showJournal && <Journal bloodline={bloodline} questEchoData={questEchoData} seenIds={bloodline.journalSeenIds ?? []} onMarkSeen={handleJournalMarkSeen} onClose={() => setShowJournal(false)} />}
      {showStoryJournal && <StoryJournal entries={bloodline.storyJournal ?? []} onClose={() => setShowStoryJournal(false)} />}
      {showContentSeeder && <ContentSeeder onClose={() => setShowContentSeeder(false)} />}
      {showInventory && <Inventory
        state={state}
        onChange={handleChange}
        onClose={() => setShowInventory(false)}
        autoSellRarities={autoSellRarities}
        onAutoSellRaritiesChange={(rarities) => {
          setAutoSellRarities(rarities);
          safeSetItem('autoSellRarities', JSON.stringify(rarities));
        }}
        autoSellConsumables={autoSellConsumables}
        onAutoSellConsumablesChange={(value) => {
          setAutoSellConsumables(value);
          safeSetItem('autoSellConsumables', value ? '1' : '0');
        }}
      />}
      {showShop && <Shop state={state} onChange={(next) => {
        questExtraRef.current.shopPurchases = (questExtraRef.current.shopPurchases ?? 0) + 1;
        handleChange(next);
      }} onClose={() => setShowShop(false)} />}
      {showNPCDialogue && state.pendingNPC && (
        <NPCDialogue
          state={state}
          bloodline={bloodline}
          onChange={(next) => {
            setShowNPCDialogue(false);
            handleChange(next);
          }}
          onBloodlineChange={saveBloodline}
          onClose={() => {
            setShowNPCDialogue(false);
            setState((prev) => {
              if (!prev) return prev;
              const next = cloneState(prev);
              next.pendingNPC = null;
              return next;
            });
          }}
        />
      )}
      {showStoryDialogue && storyCharacter && storyDialogueTree && (
        <StoryDialogue
          state={state}
          character={storyCharacter}
          dialogue={storyDialogueTree}
          onComplete={handleStoryDialogueComplete}
          onClose={() => {
            // Mark beat as triggered even on close to prevent re-showing
            if (state && pendingBeatId) {
              handleDialogueComplete(state, pendingBeatId, {
                choicesMade: [],
                relationshipChange: 0,
                effects: [],
                skillCheckResults: [],
              });
            }
            setShowStoryDialogue(false);
            setStoryCharacter(null);
            setStoryDialogueTree(null);
            setPendingBeatId(null);
            setState(prev => prev ? { ...prev, pendingStoryDialogue: null } : prev);
          }}
        />
      )}
      {showEnemyEncounter && enemyEncounterData && (
        <StoryDialogue
          state={state}
          character={{
            id: enemyEncounterData.enemyId,
            name: enemyEncounterData.characterName || enemyEncounterData.enemyName,
            title: enemyEncounterData.characterTitle || 'Encounter',
            race: 'beast',
            role: 'enemy',
            traits: [],
            motivation: 'Hostile',
            secret: '',
            appearanceDescription: '',
            char: '?',
            color: '#ff4444',
            introFloorRange: [1, 15],
            introDialogue: '',
            relationshipTiers: [],
            recruitable: false,
            portraitUrl: enemyEncounterData.portraitUrl || getFallbackEnemyPortrait(enemyEncounterData.enemyName),
          }}
          dialogue={enemyEncounterData.dialogue}
          onComplete={handleEnemyEncounterComplete}
          onClose={() => {
            // Close without action = attack by default
            setShowEnemyEncounter(false);
            setEnemyEncounterData(null);
            setPendingEnemyId(null);
          }}
        />
      )}
      {isGeneratingEnemyEncounter && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{ color: '#ffcc44', fontSize: 14, textAlign: 'center' }}>
            {encounterGenStage === 'dialogue' && (
              <>
                <div style={{ marginBottom: 8, fontSize: 16 }}>Assessing the situation...</div>
                <div style={{ fontSize: 10, color: '#888' }}>Generating encounter dialogue</div>
              </>
            )}
            {encounterGenStage === 'portrait' && (
              <>
                <div style={{ marginBottom: 8, fontSize: 16 }}>Drawing the creature...</div>
                <div style={{ fontSize: 10, color: '#888' }}>Generating pixel art portrait</div>
              </>
            )}
            {encounterGenStage === 'loading' && (
              <>
                <div style={{ marginBottom: 8, fontSize: 16 }}>Almost ready...</div>
                <div style={{ fontSize: 10, color: '#888' }}>Loading portrait</div>
              </>
            )}
            <div style={{ marginTop: 16 }}>
              <div style={{
                width: 120,
                height: 4,
                background: '#333',
                borderRadius: 2,
                overflow: 'hidden',
                margin: '0 auto',
              }}>
                <div style={{
                  width: encounterGenStage === 'dialogue' ? '33%' : encounterGenStage === 'portrait' ? '66%' : '90%',
                  height: '100%',
                  background: '#ffcc44',
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          </div>
        </div>
      )}
      {showSkillCheck && pendingEncounter && state?.skills && (
        <SkillCheckModal
          skill={pendingEncounter.primarySkill}
          skillValue={state.skills[pendingEncounter.primarySkill] ?? 10}
          gearBonus={0}
          target={pendingEncounter.target}
          description={pendingEncounter.description}
          imageUrl={skillCheckArtUrl}
          onComplete={handleSkillCheckComplete}
          onCancel={() => {
            setShowSkillCheck(false);
            setPendingEncounter(null);
            setSkillCheckArtUrl(null);
          }}
        />
      )}
      {/* Room Event Modal */}
      {showRoomEvent && state?.pendingRoomEvent && (
        <RoomEventModal
          state={state}
          roomEvent={state.pendingRoomEvent}
          onComplete={handleRoomEventComplete}
          onClose={() => {
            // Mark as resolved without completing skill check
            const next = cloneState(state);
            next.pendingRoomEvent = null;
            setShowRoomEvent(false);
            setState(next);
          }}
        />
      )}
      {/* Room Event Art Generation Loading */}
      {isGeneratingRoomEventArt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{ color: '#ffcc44', fontSize: 14, textAlign: 'center' }}>
            <div style={{ marginBottom: 8, fontSize: 16 }}>Something stirs in this chamber...</div>
            <div style={{ fontSize: 10, color: '#888' }}>Generating room event</div>
            <div style={{ marginTop: 16 }}>
              <div style={{
                width: 120,
                height: 4,
                background: '#333',
                borderRadius: 2,
                overflow: 'hidden',
                margin: '0 auto',
              }}>
                <div style={{
                  width: '60%',
                  height: '100%',
                  background: '#ffcc44',
                  animation: 'pulse 1s infinite',
                }} />
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Reputation-based Transformation Offer */}
      {pendingReputationTransform && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{
            background: '#111',
            border: '2px solid #aa44aa',
            borderRadius: 8,
            padding: 24,
            maxWidth: 320,
            textAlign: 'center',
          }}>
            <div style={{ color: '#aa44aa', fontSize: 18, marginBottom: 12 }}>
              Transformation Offered
            </div>
            <div style={{ color: '#aaddaa', fontSize: 12, marginBottom: 16, lineHeight: 1.5 }}>
              Your deep connection with the {pendingReputationTransform} faction has opened a path to transformation.
              Will you embrace their curse and become one of them?
            </div>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 16 }}>
              Warning: Transformation is permanent and may restrict equipment use.
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={handleReputationTransformAccept}
                style={{
                  background: '#aa44aa',
                  border: 'none',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                }}
              >
                Embrace the Curse
              </button>
              <button
                onClick={handleReputationTransformDecline}
                style={{
                  background: '#333',
                  border: '1px solid #666',
                  color: '#aaa',
                  padding: '8px 16px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                }}
              >
                Resist
              </button>
            </div>
          </div>
        </div>
      )}
      {showMercHire && state.pendingMercenary && (
        <MercenaryHire
          state={state}
          onChange={(next) => {
            setShowMercHire(false);
            handleChange(next);
          }}
          onClose={() => {
            setShowMercHire(false);
            setState((prev) => {
              if (!prev) return prev;
              const next = cloneState(prev);
              next.pendingMercenary = null;
              return next;
            });
          }}
        />
      )}
      {state.pendingAbilityChoice && (
        <AbilityChoice
          state={state}
          choice={state.pendingAbilityChoice}
          onChange={(next) => {
            handleChange(next);
          }}
        />
      )}
      {elderPortal}
      {generationLoadingPortal}
      {rangedTutorialPortal}
      {showPremiumModal && !isPremium && (
        <div style={premiumModalOverlayStyle} onClick={() => { setShowPremiumModal(false); trackOfferDismissed('premium'); }}>
          <div style={premiumModalBoxStyle} onClick={e => e.stopPropagation()}>
            {premiumBannerUrl && (
              <img src={premiumBannerUrl} alt="Premium God" style={{ width: '100%', borderRadius: 4, marginBottom: 12, imageRendering: 'pixelated' as const }} />
            )}
            {!premiumBannerUrl && (
              <>
                <div style={{ color: '#ffd700', fontSize: 18, fontWeight: 'bold', marginBottom: 10, letterSpacing: 2 }}>PREMIUM GOD</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                  <div style={premiumPerkRowStyle}>
                    <span style={{ color: '#ffd700' }}>✦</span>
                    <span><b style={{ color: '#fff' }}>2X Gold</b> — become wealthy beyond belief!</span>
                  </div>
                  <div style={premiumPerkRowStyle}>
                    <span style={{ color: '#ffd700' }}>✦</span>
                    <span><b style={{ color: '#fff' }}>50% Less Hunger</b> — thrive, don't just survive!</span>
                  </div>
                  <div style={premiumPerkRowStyle}>
                    <span style={{ color: '#ffd700' }}>✦</span>
                    <span><b style={{ color: '#fff' }}>One-time purchase</b> — forever yours, no subscription!</span>
                  </div>
                </div>
              </>
            )}
            {isFirstTimeBuyer && (
              <div style={{ color: '#44ff88', fontSize: 11, fontFamily: 'monospace', textAlign: 'center', marginBottom: 8, letterSpacing: 1 }}>
                STARTER DEAL — 50% OFF!
              </div>
            )}
            {purchaseStatus ? (
              <div style={{ color: '#ff6', fontFamily: 'monospace', fontSize: 11, textAlign: 'center', marginBottom: 10 }}>{purchaseStatus}</div>
            ) : null}
            <button
              style={premiumModalBuyBtnStyle}
              onClick={() => { trackOfferClicked('premium'); handlePremiumPurchase(); }}
            >
              {isFirstTimeBuyer
                ? <><span style={{ textDecoration: 'line-through', color: '#886622', marginRight: 6 }}>100</span>50 Bucks</>
                : '[ 100 Bucks ]'}
            </button>
            <button style={premiumModalCancelStyle} onClick={() => { setShowPremiumModal(false); trackOfferDismissed('premium'); }}>
              Not now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const musicToggleStyle: CSSProperties = {
  position: 'absolute',
  top: 10,
  right: 10,
  zIndex: 20,
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid #555',
  borderRadius: 6,
  color: '#aaa',
  fontFamily: 'monospace',
  fontSize: 12,
  padding: '6px 10px',
  cursor: 'pointer',
};

const premiumModalOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.82)',
  zIndex: 200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const premiumModalBoxStyle: CSSProperties = {
  background: '#0a0a0a',
  border: '1px solid #8a6a1a',
  boxShadow: '0 0 24px #ffd70033',
  padding: '24px 22px 18px',
  maxWidth: 300,
  width: '88%',
  fontFamily: 'monospace',
  color: '#aaa',
  fontSize: 12,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
};

const premiumPerkRowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'flex-start',
  textAlign: 'left',
  fontSize: 12,
  color: '#aaa',
};

const premiumModalBuyBtnStyle: CSSProperties = {
  width: '100%',
  padding: '10px 0',
  background: '#1a1200',
  border: '1px solid #ffd700',
  color: '#ffd700',
  fontFamily: 'monospace',
  fontSize: 13,
  fontWeight: 'bold',
  letterSpacing: 1,
  cursor: 'pointer',
  textShadow: '0 0 8px #ffd70066',
  marginBottom: 8,
};

const premiumModalCancelStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#555',
  fontFamily: 'monospace',
  fontSize: 11,
  cursor: 'pointer',
  padding: '4px 0',
};

const topOverlayRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '2px 6px',
  background: '#000',
  gap: 4,
};

const premiumOverlayBtnStyle: CSSProperties = {
  background: 'rgba(0,0,0,0.85)',
  border: '1px solid #8a6a1a',
  borderRadius: 3,
  color: '#ffd700',
  fontFamily: 'monospace',
  fontSize: 10,
  fontWeight: 'bold',
  padding: '2px 6px',
  cursor: 'pointer',
  textShadow: '0 0 6px #ffd70055',
  letterSpacing: 0.5,
  whiteSpace: 'nowrap',
};

const musicToggleBtnStyle: CSSProperties = {
  background: 'rgba(0,0,0,0.6)',
  border: '1px solid #444',
  borderRadius: 4,
  color: '#888',
  fontFamily: 'monospace',
  fontSize: 14,
  padding: '2px 6px',
  cursor: 'pointer',
};

const titleScreenStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
  overflowY: 'auto',
  overflowX: 'hidden',
  background: '#000',
};

/* titleBgImageStyle removed — image now uses absolute positioning inside aspect-ratio container */

/* titleOverlayStyle removed — buttons are now baked into the background image */

const titleTextStyle: CSSProperties = {
  color: '#33ff66',
  fontFamily: 'monospace',
  fontSize: 28,
  fontWeight: 'bold',
  letterSpacing: 6,
  textShadow: '0 0 20px #33ff6666, 0 2px 4px #000',
};

const fullScreenStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  background: '#000',
  padding: 20,
  gap: 16,
  overflowY: 'auto',
};


const playBtnStyle: CSSProperties = {
  padding: '14px 24px',
  fontSize: 16,
  fontFamily: 'monospace',
  fontWeight: 'bold',
  background: '#000',
  color: '#33ff66',
  border: '1px solid #33ff66',
  borderRadius: 0,
  cursor: 'pointer',
  marginTop: 8,
  letterSpacing: 2,
  textShadow: '0 0 8px #33ff6644',
  boxShadow: '0 0 10px #33ff6622',
  minHeight: 44,
};

const secondaryBtnStyle: CSSProperties = {
  padding: '12px 16px',
  fontSize: 13,
  fontFamily: 'monospace',
  fontWeight: 'bold',
  background: '#000',
  color: '#1a8a3a',
  border: '1px solid #1a5a2a',
  borderRadius: 0,
  cursor: 'pointer',
  letterSpacing: 2,
  textShadow: '0 0 4px #33ff6633',
  minHeight: 44,
};

const bloodlineBtnStyle: CSSProperties = {
  padding: '12px 16px',
  fontSize: 13,
  fontFamily: 'monospace',
  fontWeight: 'bold',
  background: '#000',
  color: '#c49eff',
  border: '1px solid #4a3a6a',
  borderRadius: 0,
  cursor: 'pointer',
  letterSpacing: 2,
  textShadow: '0 0 4px #c49eff33',
  minHeight: 44,
};

const necropolisBtnStyle: CSSProperties = {
  padding: '14px 24px',
  fontSize: 14,
  fontFamily: 'monospace',
  fontWeight: 'bold',
  background: '#000',
  color: '#cc44ff',
  border: '1px solid #6a2a8a',
  borderRadius: 0,
  cursor: 'pointer',
  letterSpacing: 2,
  textShadow: '0 0 6px #cc44ff44',
  boxShadow: '0 0 8px #cc44ff22',
  minHeight: 44,
};


const asciiBoxStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
  padding: '8px 20px',
  fontFamily: 'monospace',
};

const asciiFrameStyle: CSSProperties = {
  color: '#1a8a3a',
  fontSize: 13,
  margin: 0,
  fontFamily: 'monospace',
  textShadow: '0 0 6px #33ff6622',
};

const gameOverTitleStyle: CSSProperties = {
  color: '#ff3333',
  fontFamily: 'monospace',
  fontSize: 18,
  fontWeight: 'bold',
  letterSpacing: 4,
  marginBottom: 8,
  textShadow: '0 0 12px #ff333344',
};

const scoreLineStyle: CSSProperties = {
  color: '#33ff66',
  fontFamily: 'monospace',
  fontSize: 13,
  letterSpacing: 1,
};

// ── Add-to-Home Elder Modals ──

function AddToHomeModal({ guideUrl, onLetsDoIt, onLater }: { guideUrl: string | null; onLetsDoIt: () => void; onLater: () => void }) {
  return (
    <div style={athOverlayStyle}>
      <div style={athBoxStyle}>
        <pre style={athAsciiStyle}>{'+-==[ THE ELDER ]==-+'}</pre>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
          {guideUrl && (
            <div style={{ border: '1px solid #1a5a2a', flexShrink: 0, width: 72, height: 72, overflow: 'hidden' }}>
              <img src={guideUrl} alt="The Elder" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.3) brightness(0.9)' }} />
            </div>
          )}
          <div style={{ color: '#aaaacc', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.7, fontStyle: 'italic' }}>
            {"\"The Rogue awaits you — fast, deadly, and patient. Save this dungeon to your home screen and she steps out of the shadows. A warrior earns their weapon. A rogue earns their trust.\""}
          </div>
        </div>
        <pre style={{ ...athAsciiStyle, color: '#ffcc33', marginBottom: 14 }}>{'| @ Unlock the Rogue class |'}</pre>
        <div style={athStepStyle}>
          <div style={{ color: '#ffd700', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold', marginBottom: 4 }}>[ iPhone / Safari ]</div>
          <div style={{ color: '#ccc', fontSize: 10, fontFamily: 'monospace', lineHeight: 1.8 }}>
            {'1. Tap '}<b style={{ color: '#fff' }}>Share (□↑)</b>{' at the bottom'}<br />
            {'2. Tap '}<b style={{ color: '#fff' }}>...</b>{' in the bottom right'}<br />
            {'3. Tap '}<b style={{ color: '#fff' }}>"Add to Home Screen"</b><br />
            {'4. Tap '}<b style={{ color: '#fff' }}>"Add"</b>
          </div>
        </div>
        <div style={{ ...athStepStyle, marginTop: 8 }}>
          <div style={{ color: '#33aaff', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold', marginBottom: 4 }}>[ Android / Chrome ]</div>
          <div style={{ color: '#ccc', fontSize: 10, fontFamily: 'monospace', lineHeight: 1.8 }}>
            {'1. Tap the '}<b style={{ color: '#fff' }}>Share button</b>{' (upper right)'}<br />
            {'2. Tap '}<b style={{ color: '#fff' }}>"Add to Home Screen"</b><br />
            {'3. Tap '}<b style={{ color: '#fff' }}>"Add"</b>
          </div>
        </div>
        <pre style={{ ...athAsciiStyle, marginTop: 12 }}>{'+-===================-+'}</pre>
        <button style={athPrimaryBtnStyle} onClick={onLetsDoIt}>{"[ Let's do it! ]"}</button>
        <button style={athSecondaryBtnStyle} onClick={onLater}>{'[ Maybe later ]'}</button>
      </div>
    </div>
  );
}

function AddToHomeConfirmModal({ guideUrl, onConfirm, onBack }: { guideUrl: string | null; onConfirm: () => void; onBack: () => void }) {
  return (
    <div style={athOverlayStyle}>
      <div style={athBoxStyle}>
        <pre style={athAsciiStyle}>{'+-==[ THE ELDER ]==-+'}</pre>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
          {guideUrl && (
            <div style={{ border: '1px solid #1a5a2a', flexShrink: 0, width: 72, height: 72, overflow: 'hidden' }}>
              <img src={guideUrl} alt="The Elder" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.3) brightness(0.9)' }} />
            </div>
          )}
          <div style={{ color: '#aaaacc', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.7, fontStyle: 'italic' }}>
            {"\"Before she steps forward... are you certain? Have you truly saved this dungeon to your home screen? She does not come twice for those who forget.\""}
          </div>
        </div>
        <pre style={{ ...athAsciiStyle, color: '#ffcc33', marginBottom: 14 }}>{'| Did you save it? |'}</pre>
        <button style={athPrimaryBtnStyle} onClick={onConfirm}>{'[ Yes — Unlock the Rogue ]'}</button>
        <button style={athSecondaryBtnStyle} onClick={onBack}>{'[ Not yet — go back ]'}</button>
      </div>
    </div>
  );
}

// ── Paladin Account-Creation Unlock Modals ──

function PaladinUnlockModal({ guideUrl, onLetsDoIt, onLater }: { guideUrl: string | null; onLetsDoIt: () => void; onLater: () => void }) {
  return (
    <div style={athOverlayStyle}>
      <div style={palUnlockBoxStyle}>
        <pre style={palAsciiStyle}>{'+-==[ THE ELDER ]==-+'}</pre>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
          {guideUrl && (
            <div style={{ border: '1px solid #8a6a1a', flexShrink: 0, width: 72, height: 72, overflow: 'hidden' }}>
              <img src={guideUrl} alt="The Elder" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.5) brightness(0.9)' }} />
            </div>
          )}
          <div style={{ color: '#ccccaa', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.7, fontStyle: 'italic' }}>
            {"\"The Paladin... a holy knight. Bound by oath, not gold. She does not follow strangers — only those who have pledged themselves. Create a free account and she will answer your call.\""}
          </div>
        </div>
        <pre style={{ ...palAsciiStyle, color: '#ffd700', marginBottom: 14 }}>{'| ✦ Unlock the Paladin class |'}</pre>
        <div style={palStepStyle}>
          <div style={{ color: '#ffd700', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold', marginBottom: 6 }}>[ How to unlock ]</div>
          <div style={{ color: '#ccc', fontSize: 10, fontFamily: 'monospace', lineHeight: 1.8 }}>
            {'1. Head to '}<b style={{ color: '#fff' }}>{'omw.run'}</b>{' and tap '}<b style={{ color: '#fff' }}>{'Sign Up'}</b><br />
            {'2. Create your free account with your '}<b style={{ color: '#fff' }}>email</b><br />
            {'3. Come back and the Paladin will be waiting'}
          </div>
        </div>
        <pre style={{ ...palAsciiStyle, marginTop: 12 }}>{'+-===================-+'}</pre>
        <button style={palPrimaryBtnStyle} onClick={onLetsDoIt}>{"[ Create My Account ]"}</button>
        <button style={athSecondaryBtnStyle} onClick={onLater}>{'[ Maybe later ]'}</button>
      </div>
    </div>
  );
}

function PaladinUnlockConfirmModal({ guideUrl, onConfirm, onBack }: { guideUrl: string | null; onConfirm: () => void; onBack: () => void }) {
  return (
    <div style={athOverlayStyle}>
      <div style={palUnlockBoxStyle}>
        <pre style={palAsciiStyle}>{'+-==[ THE ELDER ]==-+'}</pre>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
          {guideUrl && (
            <div style={{ border: '1px solid #8a6a1a', flexShrink: 0, width: 72, height: 72, overflow: 'hidden' }}>
              <img src={guideUrl} alt="The Elder" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.5) brightness(0.9)' }} />
            </div>
          )}
          <div style={{ color: '#ccccaa', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.7, fontStyle: 'italic' }}>
            {"\"You are ready to pledge your name. The Paladin asks only one thing — that you mean it. When the account is created, return here and she will stand at your side.\""}
          </div>
        </div>
        <pre style={{ ...palAsciiStyle, color: '#ffd700', marginBottom: 14 }}>{'| Have you created your account? |'}</pre>
        <button style={palPrimaryBtnStyle} onClick={onConfirm}>{'[ Yes — Unlock the Paladin ]'}</button>
        <button style={athSecondaryBtnStyle} onClick={onBack}>{'[ Not yet — go back ]'}</button>
      </div>
    </div>
  );
}

const palUnlockBoxStyle: CSSProperties = {
  background: '#060604',
  border: '1px solid #8a6a1a',
  boxShadow: '0 0 30px #ffd70011',
  padding: '18px 16px 14px',
  maxWidth: 320,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
};

const palAsciiStyle: CSSProperties = {
  color: '#5a4a0a',
  fontFamily: 'monospace',
  fontSize: 10,
  margin: '0 0 12px 0',
  padding: 0,
  textAlign: 'center',
  letterSpacing: 1,
};

const palStepStyle: CSSProperties = {
  background: '#0a0a06',
  border: '1px solid #3a2a0a',
  padding: '8px 10px',
};

const palPrimaryBtnStyle: CSSProperties = {
  width: '100%',
  marginTop: 12,
  padding: '10px 0',
  background: '#1a1200',
  border: '1px solid #ffd700',
  color: '#ffd700',
  fontFamily: 'monospace',
  fontSize: 13,
  fontWeight: 'bold',
  cursor: 'pointer',
  letterSpacing: 1,
  textShadow: '0 0 8px #ffd70044',
};

const athOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.92)',
  zIndex: 300,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
};

const athBoxStyle: CSSProperties = {
  background: '#060606',
  border: '1px solid #1a5a2a',
  boxShadow: '0 0 30px #33ff6611',
  padding: '18px 16px 14px',
  maxWidth: 320,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
};

const athAsciiStyle: CSSProperties = {
  color: '#1a5a2a',
  fontFamily: 'monospace',
  fontSize: 10,
  margin: '0 0 12px 0',
  padding: 0,
  textAlign: 'center',
  letterSpacing: 1,
};

const athStepStyle: CSSProperties = {
  background: '#0a0a0a',
  border: '1px solid #1a3a1a',
  padding: '8px 10px',
};

const athPrimaryBtnStyle: CSSProperties = {
  width: '100%',
  marginTop: 12,
  padding: '10px 0',
  background: '#001a00',
  border: '1px solid #33ff66',
  color: '#33ff66',
  fontFamily: 'monospace',
  fontSize: 13,
  fontWeight: 'bold',
  cursor: 'pointer',
  letterSpacing: 1,
  textShadow: '0 0 8px #33ff6644',
};

const athSecondaryBtnStyle: CSSProperties = {
  width: '100%',
  marginTop: 6,
  padding: '6px 0',
  background: 'none',
  border: 'none',
  color: '#444',
  fontFamily: 'monospace',
  fontSize: 11,
  cursor: 'pointer',
};

const gameContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  background: '#000',
  position: 'relative',
  overflow: 'hidden',
};

const bottomBarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  padding: '3px 4px 6px',
  background: '#000',
  borderTop: '1px solid #1a5a2a',
  width: '100%',
  boxSizing: 'border-box',
  overflow: 'hidden',
};

const sideButtonsStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  flexShrink: 1,
  minWidth: 0,
};

const actionBtnStyle: CSSProperties = {
  padding: '5px 6px',
  fontSize: 10,
  fontFamily: 'monospace',
  fontWeight: 'bold',
  background: '#000',
  color: '#33ff66',
  border: '1px solid #1a5a2a',
  borderRadius: 0,
  cursor: 'pointer',
  touchAction: 'none',
  letterSpacing: 0.5,
  textShadow: '0 0 4px #33ff6633',
  whiteSpace: 'nowrap',
};

const autoBtnActiveStyle: CSSProperties = {
  ...actionBtnStyle,
  color: '#66ffaa',
  border: '1px solid #33ff66',
  boxShadow: '0 0 8px #33ff6633',
  textShadow: '0 0 6px #66ffaa44',
};

const shopBtnStyle: CSSProperties = {
  ...actionBtnStyle,
  color: '#ffd700',
  border: '1px solid #8a6a1a',
  textShadow: '0 0 4px #ffd70044',
};

const classGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 8,
  padding: '0 12px',
  maxWidth: 360,
  width: '100%',
};

const classCardStyle: CSSProperties = {
  background: 'rgba(0, 0, 0, 0.75)',
  border: '1px solid #1a5a2a',
  borderRadius: 0,
  padding: '10px 10px',
  cursor: 'pointer',
  textAlign: 'left',
  fontFamily: 'monospace',
  display: 'flex',
  flexDirection: 'column',
};

const classCardLockedStyle: CSSProperties = {
  ...classCardStyle,
  opacity: 0.7,
  cursor: 'not-allowed',
  border: '1px solid #0a2a0a',
  background: 'rgba(6, 6, 6, 0.75)',
};

const classCardRogueLockedStyle: CSSProperties = {
  ...classCardStyle,
  cursor: 'pointer',
  border: '1px solid #665500',
  background: 'rgba(10, 8, 0, 0.75)',
  boxShadow: '0 0 8px #ffcc3311',
};

const classCardRegLockedStyle: CSSProperties = {
  ...classCardStyle,
  cursor: 'pointer',
  border: '1px solid #8a6a1a',
  background: 'rgba(10, 8, 0, 0.75)',
  boxShadow: '0 0 8px #ffd70011',
};

/* premiumBtnStyle removed — baked into background image */

const discordBtnStyle: CSSProperties = {
  padding: '6px 14px',
  fontSize: 11,
  fontFamily: 'monospace',
  background: 'rgba(88,101,242,0.15)',
  color: '#7289da',
  border: '1px solid #7289da55',
  borderRadius: 4,
  cursor: 'pointer',
  marginTop: 6,
};

/* moreMenuBtnStyle removed — baked into background image */

const moreMenuOverlayStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.85)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
};

/* moreMenuPanelStyle, moreMenuGridStyle, moreMenuItemStyle removed — baked into menu background image */

const discordOverlayBtnStyle: CSSProperties = {
  position: 'absolute',
  bottom: 4,
  left: 4,
  zIndex: 20,
  background: 'rgba(0,0,0,0.6)',
  border: '1px solid #7289da55',
  borderRadius: 4,
  color: '#7289da',
  fontFamily: 'monospace',
  fontSize: 9,
  cursor: 'pointer',
  padding: '3px 6px',
  whiteSpace: 'nowrap',
};


const lorePopupOverlay: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'rgba(0,0,0,0.85)',
  zIndex: 2000,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontFamily: 'monospace',
};

const lorePopupContainer: CSSProperties = {
  background: '#0a0a16',
  border: '1px solid #1a5a2a',
  padding: '16px 20px',
  maxWidth: 340,
  textAlign: 'center',
};

const lorePopupBtnStyle: CSSProperties = {
  background: 'none',
  border: '1px solid #1a5a2a',
  color: '#55ccff',
  fontFamily: 'monospace',
  fontSize: 13,
  fontWeight: 'bold',
  padding: '8px 16px',
  cursor: 'pointer',
  letterSpacing: 2,
  minHeight: 36,
};
