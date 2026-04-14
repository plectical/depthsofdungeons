import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { getVariantContext } from './abTesting';

/**
 * Game analytics — funnel tracking + custom events with platform context.
 * All events include platform (ios/android/web), client (app/mobile_web/desktop_web),
 * game_mode for D1 retention tracking by mode, and A/B test variant assignments.
 */

// ── Game Mode Tracking ──
// Tracks which mode the player is using for D1 retention segmentation

export type GameMode = 
  | 'classic'           // Standard dungeon crawl with built-in classes
  | 'narrative'         // AI Narrative Dungeon with built-in classes
  | 'generated_class'   // Playing with AI-generated class (classic zones)
  | 'narrative_generated'; // AI Narrative Dungeon with AI-generated class

let _gameMode: GameMode = 'classic';

/** Set the current game mode for analytics tracking */
export function setGameMode(mode: GameMode): void {
  _gameMode = mode;
  console.log('[Analytics] Game mode set:', mode);
}

/** Get current game mode */
export function getGameMode(): GameMode {
  return _gameMode;
}

/** Derive game mode from zone and class */
export function deriveGameMode(zone: string, playerClass: string): GameMode {
  const isNarrative = zone === 'narrative_test';
  const isGenerated = playerClass === 'generated';
  
  if (isNarrative && isGenerated) return 'narrative_generated';
  if (isNarrative) return 'narrative';
  if (isGenerated) return 'generated_class';
  return 'classic';
}

// ── Platform context (cached once at startup) ──

interface PlatformContext {
  platform: string;   // 'ios' | 'android' | 'web'
  client: string;     // 'app' | 'mobile_web' | 'desktop_web'
}

let _ctx: PlatformContext | null = null;
let _ctxResolved = false; // true once we've got a real (non-unknown) context

function getPlatformContext(): PlatformContext {
  // If we already have a resolved context, return it
  if (_ctx && _ctxResolved) return _ctx;
  try {
    const env = RundotGameAPI.system.getEnvironment();
    const isMobile = RundotGameAPI.system.isMobile();
    const isWeb = RundotGameAPI.system.isWeb();

    const platform = env.platform ?? (isMobile ? 'unknown_mobile' : 'web');

    let client: string;
    if (isWeb) {
      client = isMobile ? 'mobile_web' : 'desktop_web';
    } else {
      client = 'app';
    }

    _ctx = { platform, client };
    _ctxResolved = true;
  } catch {
    // SDK not ready yet — use fallback but allow retry on next call
    if (!_ctx) {
      _ctx = { platform: 'unknown', client: 'unknown' };
    }
  }
  return _ctx;
}

// ── Helpers ──

/** Race a promise against a 5s timeout — analytics should never block gameplay. */
function withAnalyticsTimeout<T>(promise: Promise<T>): Promise<T | void> {
  return Promise.race([
    promise,
    new Promise<void>((resolve) => setTimeout(resolve, 5000)),
  ]).catch(() => {}); // swallow errors — analytics are best-effort
}

function trackEvent(name: string, params?: Record<string, unknown>) {
  try {
    const ctx = getPlatformContext();
    const abCtx = getVariantContext();
    withAnalyticsTimeout(
      RundotGameAPI.analytics.recordCustomEvent(name, { 
        ...ctx,
        ...abCtx,
        game_mode: _gameMode,
        ...params 
      })
    );
  } catch {
    // SDK not ready — event is lost, but gameplay continues
  }
}

function trackFunnel(step: number, name: string) {
  try {
    const ctx = getPlatformContext();
    const abCtx = getVariantContext();
    withAnalyticsTimeout(
      RundotGameAPI.analytics.trackFunnelStep(step, name, 'game_funnel', 1)
    );
    withAnalyticsTimeout(
      RundotGameAPI.analytics.recordCustomEvent(`funnel_${name}`, { 
        ...ctx,
        ...abCtx,
        game_mode: _gameMode,
        funnel_step: step 
      })
    );
  } catch {
    // SDK not ready — event is lost, but gameplay continues
  }
}

// ── Game Funnel Steps ──
// 1: game_opened       — Player opens the game (title screen loads)
// 2: class_selected    — Player picks a class
// 3: zone_selected     — Player picks a zone and starts a run
// 4: reached_floor_3   — Player survives past floor 2
// 5: reached_floor_5   — Player reaches floor 5
// 6: player_death      — Player dies (completed a full run)
// 7: started_second_run — Player starts another run after dying

export async function trackGameOpened() {
  await trackFunnel(1, 'game_opened');
}

export async function trackPlayerIdentity() {
  try {
    const profile = RundotGameAPI.getProfile();
    const isSignedIn = profile && !profile.isAnonymous;
    await trackEvent('player_identity', {
      is_signed_in: !!isSignedIn,
      has_username: !!profile?.username,
    });
  } catch {
    await trackEvent('player_identity', {
      is_signed_in: false,
      has_username: false,
    });
  }
}

let _classSelectedForSession = false;

export async function trackClassSelected(playerClass: string) {
  // Only fire the funnel step once per session — players often tap multiple
  // classes before committing, which inflates the funnel count above game_opened.
  if (!_classSelectedForSession) {
    _classSelectedForSession = true;
    await trackFunnel(2, 'class_selected');
  }
  await trackEvent('class_selected', { player_class: playerClass });
}

export async function trackZoneSelected(zone: string, playerClass: string) {
  await trackFunnel(3, 'zone_selected');
  await trackEvent('zone_selected', { zone, player_class: playerClass });
}

/** Track game mode session start - key event for D1 retention by mode */
export async function trackGameModeStart(zone: string, playerClass: string) {
  const mode = deriveGameMode(zone, playerClass);
  setGameMode(mode);
  await trackEvent('game_mode_start', { 
    mode,
    zone,
    player_class: playerClass,
    is_narrative: zone === 'narrative_test',
    is_generated_class: playerClass === 'generated',
  });
}

export async function trackFloorReached(floor: number, playerClass: string, zone: string) {
  if (floor === 3) {
    await trackFunnel(4, 'reached_floor_3');
  }
  if (floor === 5) {
    await trackFunnel(5, 'reached_floor_5');
  }
  await trackEvent('floor_reached', { floor, player_class: playerClass, zone });
}

export async function trackPlayerDeath(params: {
  playerClass: string;
  zone: string;
  floor: number;
  level: number;
  score: number;
  kills: number;
  causeOfDeath: string;
  generation: number;
  duration: number;
  autoModeActive: boolean;
  hp: number;
  maxHp: number;
  equippedWeapon: string;
  equippedArmor: string;
  equippedOffhand: string;
  equippedRing: string;
  equippedAmulet: string;
  killingBlowDamage: number;
  skillPointsSpent?: number;
  skillPointsUnspent?: number;
  potionsUsed?: number;
  foodEaten?: number;
  scrollsUsed?: number;
}) {
  await trackFunnel(6, 'player_death');
  await trackEvent('player_death', {
    ...params,
    hp_percent: params.maxHp > 0 ? Math.round((params.hp / params.maxHp) * 100) : 0,
  });
}

export async function trackSecondRun(generation: number) {
  if (generation === 1) {
    // Only fire this funnel step on the player's very first replay
    await trackFunnel(7, 'started_second_run');
  }
  await trackEvent('run_started', { generation });
}

// ── Custom Events (non-funnel) ──

// ── Economy tracking ──

export async function trackShopPurchase(params: {
  itemName: string;
  itemType: string;
  cost: number;
  playerGoldBefore: number;
  playerGoldAfter: number;
  zone: string;
  floor: number;
  playerClass: string;
}) {
  await trackEvent('shop_purchase', {
    item: params.itemName,
    item_type: params.itemType,
    cost: params.cost,
    gold_before: params.playerGoldBefore,
    gold_after: params.playerGoldAfter,
    zone: params.zone,
    floor: params.floor,
    player_class: params.playerClass,
  });
}

export async function trackMercenaryHired(params: {
  mercenaryName: string;
  cost: number;
  playerGoldBefore: number;
  playerGoldAfter: number;
  zone: string;
  floor: number;
  playerClass: string;
  activeMercenaries: number;
}) {
  await trackEvent('mercenary_hired', {
    mercenary_name: params.mercenaryName,
    cost: params.cost,
    gold_before: params.playerGoldBefore,
    gold_after: params.playerGoldAfter,
    zone: params.zone,
    floor: params.floor,
    player_class: params.playerClass,
    active_mercenaries: params.activeMercenaries,
  });
}

export async function trackItemEquipped(params: {
  itemName: string;
  itemType: string;
  slot: string;
  zone: string;
  floor: number;
}) {
  await trackEvent('item_equipped', params);
}

export async function trackItemSold(params: {
  itemName: string;
  itemType: string;
  goldGained: number;
  zone: string;
  floor: number;
}) {
  await trackEvent('item_sold', params);
}

// ── Monetization funnel ──

export async function trackOfferShown(offerType: string) {
  await trackEvent('offer_shown', { offer_type: offerType });
}

export async function trackOfferClicked(offerType: string) {
  await trackEvent('offer_clicked', { offer_type: offerType });
}

export async function trackOfferDismissed(offerType: string) {
  await trackEvent('offer_dismissed', { offer_type: offerType });
}

export async function trackPremiumPurchased(params: {
  cost: number;
  playerGold: number;
  floor: number;
  zone: string;
  playerClass: string;
  generation: number;
}) {
  await trackEvent('premium_purchased', params);
}

// ── Auto-play tracking ──

export async function trackAutoModeToggled(params: {
  enabled: boolean;
  mode: string;
  floor: number;
  zone: string;
  playerClass: string;
  playerHpPercent: number;
}) {
  await trackEvent('auto_mode_toggled', {
    enabled: params.enabled,
    mode: params.mode,
    floor: params.floor,
    zone: params.zone,
    player_class: params.playerClass,
    player_hp_percent: params.playerHpPercent,
  });
}

// ── Meta features ──

export async function trackNecropolisOpened() {
  await trackEvent('necropolis_opened');
}

export async function trackBestiaryOpened() {
  await trackEvent('bestiary_opened');
}

export async function trackBloodlineOpened() {
  await trackEvent('bloodline_opened');
}

// ── Skill point tracking ──

export async function trackSkillUnlocked(params: {
  nodeId: string;
  nodeName: string;
  cost: number;
  skillPointsRemaining: number;
  totalSkillPointsSpent: number;
  playerClass: string;
  floor: number;
  zone: string;
  playerLevel: number;
}) {
  await trackEvent('skill_unlocked', {
    node_id: params.nodeId,
    node_name: params.nodeName,
    cost: params.cost,
    sp_remaining: params.skillPointsRemaining,
    total_sp_spent: params.totalSkillPointsSpent,
    player_class: params.playerClass,
    floor: params.floor,
    zone: params.zone,
    player_level: params.playerLevel,
  });
}

// ── Class ability tracking ──

export async function trackAbilityUsed(params: {
  ability: string;
  playerClass: string;
  floor: number;
  zone: string;
  hpPercent: number;
  success: boolean;
  source: string; // 'manual' | 'autoplay'
}) {
  await trackEvent('ability_used', {
    ability: params.ability,
    player_class: params.playerClass,
    floor: params.floor,
    zone: params.zone,
    hp_percent: params.hpPercent,
    success: params.success,
    source: params.source,
  });
}

// ── Ranged attack tracking ──

export async function trackRangedAttack(params: {
  playerClass: string;
  floor: number;
  zone: string;
  distance: number;
  targetName: string;
}) {
  await trackEvent('ranged_attack', {
    player_class: params.playerClass,
    floor: params.floor,
    zone: params.zone,
    distance: params.distance,
    target_name: params.targetName,
  });
}

// ── Consumable tracking (potions / food) ──

export async function trackConsumableUsed(params: {
  itemName: string;
  itemType: string; // 'potion' | 'food'
  playerClass: string;
  floor: number;
  zone: string;
  hpBefore: number;
  hpAfter: number;
  maxHp: number;
  hungerBefore: number;
  hungerAfter: number;
  hungerMax: number;
}) {
  await trackEvent('consumable_used', {
    item_name: params.itemName,
    item_type: params.itemType,
    player_class: params.playerClass,
    floor: params.floor,
    zone: params.zone,
    hp_before: params.hpBefore,
    hp_after: params.hpAfter,
    max_hp: params.maxHp,
    hp_percent_before: params.maxHp > 0 ? Math.round((params.hpBefore / params.maxHp) * 100) : 0,
    hunger_before: params.hungerBefore,
    hunger_after: params.hungerAfter,
    hunger_max: params.hungerMax,
  });
}

// ── Bloodline / meta-screen tracking from death screen ──

export async function trackDeathScreenAction(params: {
  action: string; // 'bloodline_opened' | 'bestiary_opened' | 'history_opened' | 'necropolis_opened' | 'leaderboard_opened'
  generation: number;
  isFirstDeath: boolean;
  isSecondDeath: boolean;
}) {
  await trackEvent('death_screen_action', {
    action: params.action,
    generation: params.generation,
    is_first_death: params.isFirstDeath,
    is_second_death: params.isSecondDeath,
  });
}

// ── Session tracking ──
// Tracks when players leave mid-game so we can see where they drop off

let _sessionScreen: string = 'title';
let _sessionClass: string = '';
let _sessionZone: string = '';
let _sessionFloor: number = 0;
let _sessionStartTime: number = Date.now();
let _lifecycleSetup = false;
let _sessionEchoes: number = 0;
let _sessionEchoesEarned: number = 0;
let _sessionEchoNodesUnlocked: number = 0;
let _sessionSkillPointsSpent: number = 0;
let _sessionSkillPointsUnspent: number = 0;
let _sessionGeneration: number = 0;
let _sessionActiveQuests: number = 0;
let _sessionCompletedQuests: number = 0;

export function updateSessionContext(screen: string, playerClass?: string, zone?: string, floor?: number) {
  _sessionScreen = screen;
  if (playerClass) _sessionClass = playerClass;
  if (zone) _sessionZone = zone;
  if (floor != null) _sessionFloor = floor;
}

export function updateSessionMetaContext(params: {
  echoes?: number;
  totalEchoesEarned?: number;
  echoNodesUnlocked?: number;
  skillPointsSpent?: number;
  skillPointsUnspent?: number;
  generation?: number;
  activeQuests?: number;
  completedQuests?: number;
}) {
  if (params.echoes != null) _sessionEchoes = params.echoes;
  if (params.totalEchoesEarned != null) _sessionEchoesEarned = params.totalEchoesEarned;
  if (params.echoNodesUnlocked != null) _sessionEchoNodesUnlocked = params.echoNodesUnlocked;
  if (params.skillPointsSpent != null) _sessionSkillPointsSpent = params.skillPointsSpent;
  if (params.skillPointsUnspent != null) _sessionSkillPointsUnspent = params.skillPointsUnspent;
  if (params.generation != null) _sessionGeneration = params.generation;
  if (params.activeQuests != null) _sessionActiveQuests = params.activeQuests;
  if (params.completedQuests != null) _sessionCompletedQuests = params.completedQuests;
}

// Track whether we've already sent a session-end for this "hidden" period.
// Resets when the player comes back, so the next departure is also captured.
let _pendingSessionEnd = false;

function trackSessionEnd(trigger: string) {
  if (_pendingSessionEnd) return;
  _pendingSessionEnd = true;

  const duration = Math.round((Date.now() - _sessionStartTime) / 1000);
  trackEvent('session_end', {
    screen: _sessionScreen,
    player_class: _sessionClass,
    zone: _sessionZone,
    floor: _sessionFloor,
    duration_seconds: duration,
    trigger, // 'sleep' | 'quit' | 'visibilitychange' | 'pagehide' | 'beforeunload' | 'freeze'
    echoes_unspent: _sessionEchoes,
    total_echoes_earned: _sessionEchoesEarned,
    echo_nodes_unlocked: _sessionEchoNodesUnlocked,
    skill_points_spent: _sessionSkillPointsSpent,
    skill_points_unspent: _sessionSkillPointsUnspent,
    generation: _sessionGeneration,
    active_quests: _sessionActiveQuests,
    completed_quests: _sessionCompletedQuests,
  });
}

export function setupSessionTracking() {
  if (_lifecycleSetup) return;
  _lifecycleSetup = true;
  _sessionStartTime = Date.now();

  // SDK lifecycle hooks (may not fire on Android kill)
  try {
    RundotGameAPI.lifecycles.onSleep(() => { trackSessionEnd('sleep'); });
    RundotGameAPI.lifecycles.onQuit(() => { trackSessionEnd('quit'); });
    // Reset flag when player returns so the next departure is tracked too
    RundotGameAPI.lifecycles.onResume(() => { _pendingSessionEnd = false; });
    RundotGameAPI.lifecycles.onAwake(() => { _pendingSessionEnd = false; });
  } catch {
    // Lifecycle API not available — rely on browser events below
  }

  // Browser-level fallbacks — much more reliable on Android where the
  // process can be killed without onSleep/onQuit ever firing.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      trackSessionEnd('visibilitychange');
    } else {
      // Player came back — reset so we capture the next departure
      _pendingSessionEnd = false;
    }
  });
  window.addEventListener('pagehide', () => { trackSessionEnd('pagehide'); });
  window.addEventListener('beforeunload', () => { trackSessionEnd('beforeunload'); });
  window.addEventListener('freeze', () => { trackSessionEnd('freeze'); });
}

// ── Quest & Echo Tree tracking ──

export async function trackQuestCompleted(params: {
  questId: string;
  questName: string;
  questTier: number;
  reward: number;
  totalEchoesEarned: number;
  totalQuestsCompleted: number;
  playerClass?: string;
  floor?: number;
  zone?: string;
}) {
  await trackEvent('quest_completed', {
    quest_id: params.questId,
    quest_name: params.questName,
    quest_tier: params.questTier,
    reward: params.reward,
    total_echoes_earned: params.totalEchoesEarned,
    total_quests_completed: params.totalQuestsCompleted,
    player_class: params.playerClass ?? '',
    floor: params.floor ?? 0,
    zone: params.zone ?? '',
  });
}

export async function trackQuestClaimed(params: {
  questId: string;
  questName: string;
  questTier: number;
  echoesEarned: number;
  totalEchoes: number;
  totalEchoesEarned: number;
  activeQuestsCount: number;
}) {
  await trackEvent('quest_claimed', {
    quest_id: params.questId,
    quest_name: params.questName,
    quest_tier: params.questTier,
    echoes_earned: params.echoesEarned,
    total_echoes: params.totalEchoes,
    total_echoes_earned: params.totalEchoesEarned,
    active_quests_count: params.activeQuestsCount,
  });
}

export async function trackQuestAssigned(params: {
  questId: string;
  questName: string;
  questTier: number;
  slotIndex: number;
  totalEchoesEarned: number;
}) {
  await trackEvent('quest_assigned', {
    quest_id: params.questId,
    quest_name: params.questName,
    quest_tier: params.questTier,
    slot_index: params.slotIndex,
    total_echoes_earned: params.totalEchoesEarned,
  });
}

export async function trackEchoNodeUnlocked(params: {
  nodeId: string;
  nodeName: string;
  path: string;
  tier: number;
  cost: number;
  echoesRemaining: number;
  totalNodesUnlocked: number;
}) {
  await trackEvent('echo_node_unlocked', {
    node_id: params.nodeId,
    node_name: params.nodeName,
    path: params.path,
    tier: params.tier,
    cost: params.cost,
    echoes_remaining: params.echoesRemaining,
    total_nodes_unlocked: params.totalNodesUnlocked,
  });
}

export async function trackQuestLogOpened(params: {
  screen: string;
  activeQuests: number;
  completedQuests: number;
  totalEchoes: number;
}) {
  await trackEvent('quest_log_opened', {
    screen: params.screen,
    active_quests: params.activeQuests,
    completed_quests: params.completedQuests,
    total_echoes: params.totalEchoes,
  });
}

export async function trackEchoTreeOpened(params: {
  screen: string;
  totalEchoes: number;
  nodesUnlocked: number;
  totalNodes: number;
}) {
  await trackEvent('echo_tree_opened', {
    screen: params.screen,
    total_echoes: params.totalEchoes,
    nodes_unlocked: params.nodesUnlocked,
    total_nodes: params.totalNodes,
  });
}

export async function trackQuestRunSummary(params: {
  questsCompletedThisRun: number;
  echoesEarnedThisRun: number;
  totalEchoes: number;
  totalEchoesEarned: number;
  totalQuestsCompleted: number;
  playerClass: string;
  zone: string;
  floor: number;
  generation: number;
}) {
  await trackEvent('quest_run_summary', {
    quests_completed_this_run: params.questsCompletedThisRun,
    echoes_earned_this_run: params.echoesEarnedThisRun,
    total_echoes: params.totalEchoes,
    total_echoes_earned: params.totalEchoesEarned,
    total_quests_completed: params.totalQuestsCompleted,
    player_class: params.playerClass,
    zone: params.zone,
    floor: params.floor,
    generation: params.generation,
  });
}

// ── Story Mode Analytics ──

export async function trackStoryModeStart(params: { chapter: string; playerClass: string; isNewCampaign: boolean }) {
  await trackEvent('story_mode_start', params);
}

export async function trackStoryChapterComplete(params: { chapter: string; playerClass: string; playerLevel: number; goldEarned: number }) {
  await trackEvent('story_chapter_complete', params);
}

export async function trackStoryFloorReached(params: { chapter: string; floor: number; playerClass: string; playerLevel: number }) {
  await trackEvent('story_floor_reached', params);
}

export async function trackStoryNpcMet(params: { npcId: string; npcName: string; chapter: string; floor: number; choiceMade?: string }) {
  await trackEvent('story_npc_met', params);
}

export async function trackStoryFlagSet(params: { key: string; value: string; chapter: string; floor: number }) {
  await trackEvent('story_flag_set', params);
}

export async function trackStoryTransformUsed(params: { transformId: string; totalUses: number; isPermanent: boolean; chapter: string; floor: number }) {
  await trackEvent('story_transform_used', params);
}

export async function trackStoryShopPurchase(params: { itemName: string; cost: number; chapter: string; floor: number }) {
  await trackEvent('story_shop_purchase', params);
}

export async function trackStoryMercHired(params: { mercName: string; cost: number; chapter: string; floor: number }) {
  await trackEvent('story_merc_hired', params);
}

export async function trackStoryBossKill(params: { bossName: string; chapter: string; floor: number; playerLevel: number; playerClass: string }) {
  await trackEvent('story_boss_kill', params);
}

export async function trackStoryDeath(params: { chapter: string; floor: number; playerLevel: number; playerClass: string; causeOfDeath: string }) {
  await trackEvent('story_death', params);
}

export async function trackStorySkillCheck(params: { encounterId: string; skill: string; outcome: string; chapter: string; floor: number }) {
  await trackEvent('story_skill_check', params);
}

export async function trackStoryJournalOpened() {
  await trackEvent('story_journal_opened', {});
}

export async function trackStoryLoreViewed(params: { loreId: string; chapter: string }) {
  await trackEvent('story_lore_viewed', params);
}
