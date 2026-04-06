# Depths of Dungeons — Mobile Web Attribution System Spec

## Overview

The attribution system has **three layers** that work together to track where players come from, how long they stay, and what they do:

1. **Facebook (Meta) Pixel** — Fires pixel events to Facebook so you can build ad audiences and measure campaign performance
2. **Durable Player Identity & Attribution** — Survives Safari/Firefox cookie clearing by storing a permanent player ID through the RUN.game SDK (not browser cookies)
3. **Game Analytics Funnel** — Tracks every step of the player journey from first open through death and replay

---

## Layer 1: Facebook (Meta) Pixel

### How it loads

The Meta Pixel script (`fbevents.js`) is injected in `index.html` as a blocking `<script>` tag in the `<head>`. This means it loads **before** any game code runs.

**File:** `index.html` (lines 11–21)

On page load, the pixel is initialized with the general pixel ID:

```
fbq('init', '1938108636803653')
```

This does NOT fire a `PageView` automatically — it just sets up the pixel.

### When pixels fire

| Trigger | Pixel ID | Method | What it means |
|---------|----------|--------|---------------|
| Player enters the dungeon (taps "Play") | `1938108636803653` | `fbq('track', 'PageView')` | Standard PageView on the general pixel — counts dungeon entries |
| Dungeon entry (immediate) | `1938108636803653` | `fbq('trackSingle', id, 'PageView')` | Same pixel, trackSingle variant — redundant safety |
| 30 seconds in dungeon | `836086159492144` | `fbq('init', id)` then `fbq('trackSingle', id, 'PageView')` | Player retained 30s |
| 1 minute in dungeon | `1454026359429653` | Same init+trackSingle pattern | Player retained 1min |
| 2 minutes in dungeon | `4327199907516237` | Same | Player retained 2min |
| 3 minutes in dungeon | `950565250690147` | Same | Player retained 3min |
| 5 minutes in dungeon | `1807456903196666` | Same | Player retained 5min |
| 7 minutes in dungeon | `1557138382039810` | Same | Player retained 7min |
| 10 minutes in dungeon | `1650984392689108` | Same | Player retained 10min |

**File:** `src/game/Game.tsx` (lines 713–851)

### How timed pixels work

When the player enters the dungeon, the code sets up JavaScript `setTimeout` timers for each threshold. Each timer:

1. Calls `fbq('init', pixelId)` to register a **new** pixel instance
2. Calls `fbq('trackSingle', pixelId, 'PageView')` to fire a PageView on just that pixel

This means each pixel ID in Meta Events Manager represents "players who stayed at least X seconds." The `trackSingle` call ensures the PageView only fires on that specific pixel, not on every initialized pixel.

### Timer cleanup

All timers are stored in `pixelTimersRef`. When a new game starts, any existing timers are cleared with `clearTimeout` before setting new ones. This prevents stacking from multiple game restarts.

### What you see in Meta Events Manager

Each of the 8 pixel IDs appears as a **separate pixel** in your Meta Events Manager. For each one you can see:
- Total PageView count (= number of players who hit that time threshold)
- Breakdown by device, browser, country, etc.
- You can create Custom Audiences from any pixel (e.g., "people who played 5+ minutes")
- You can set conversion optimization targets for ad campaigns against any pixel

### Drop-off analysis

To measure retention drop-off:
- General pixel PageViews = total dungeon entries
- 30s pixel PageViews / General pixel PageViews = 30s retention rate
- 1min / 30s = 30s-to-1min retention
- And so on up the chain

---

## Layer 2: Durable Player Identity & First-Touch Attribution

### The problem this solves

Safari ITP (Intelligent Tracking Prevention) and Firefox ETP (Enhanced Tracking Protection) delete browser-level identity (cookies, localStorage) within hours. This means a player who comes back the next day looks like a brand new user. Day-1 retention appears artificially low because returning players can't be identified.

### The solution

On the player's very first visit, the system generates a **durable ID** (UUID) and stores it in the RUN.game SDK's `appStorage`. This storage goes through the platform bridge — it's **not** in the browser cookie jar, so Safari/Firefox can't delete it. The ID persists across sessions even when the browser wipes cookies.

**File:** `src/game/attribution.ts`

### Storage keys

All attribution data is stored in SDK `appStorage` under these keys:

| Key | What it stores |
|-----|---------------|
| `attr_durable_id` | The permanent player UUID (generated once, never changes) |
| `attr_first_seen` | ISO timestamp of the player's very first visit |
| `attr_first_platform` | Platform on first visit (e.g., `ios`, `android`, `web`) |
| `attr_first_client` | Client type on first visit (`mobile_web`, `desktop_web`, `app`) |
| `attr_first_campaign` | The campaign that brought them originally (from UTM params) |
| `attr_session_count` | Incrementing counter of total sessions |

### What happens on every game launch

The `trackAttribution()` function runs on every game launch (`Game.tsx`, line 403). Here's the flow:

```
1. Load all 6 storage keys in parallel
2. Is this the first session? (no durable_id exists)
   ├── YES → Generate new UUID
   │         Store durable_id, first_seen, first_platform, first_client, first_campaign
   │         Fire "first_touch_attribution" event
   └── NO  → Load existing data
3. Increment session_count
4. Has the player migrated platforms? (e.g., mobile_web → app)
   └── YES → Fire "platform_migration" event
5. Fire "session_attribution" event (every session, always)
```

### URL parameters captured

When a player clicks a Facebook or Google ad and lands on the game, the URL contains tracking parameters. The system captures:

| Parameter | Source | Purpose |
|-----------|--------|---------|
| `fbclid` | Facebook Ads | Unique click ID — ties this player to the exact ad click in Facebook |
| `gclid` | Google Ads | Unique click ID — ties this player to the exact ad click in Google |
| `utm_source` | Any ad platform | Which platform (facebook, google, tiktok, etc.) |
| `utm_medium` | Any ad platform | Which medium (cpc, cpm, social, etc.) |
| `utm_campaign` | Any ad platform | Campaign name |
| `utm_content` | Any ad platform | Ad variant / creative ID |
| `utm_term` | Any ad platform | Search keyword (Google Ads) |
| `campaign` | RUN.game sharing | Internal campaign identifier |
| `ref` | RUN.game sharing | Referral source |
| `referredBy` | RUN.game sharing | Who shared the link |

If `fbclid` is present but `utm_source` is missing, the system auto-fills `utm_source = 'facebook'` and `ref = 'facebook'`. Same logic for `gclid` → `google`.

The system also checks `RundotGameAPI.context.shareParams` for any SDK-level share parameters. **SDK params override URL params** when both exist.

### Analytics events fired

#### `first_touch_attribution` (first visit only)

Fired once in the player's lifetime — on their very first session. Contains:

- `durable_id` — The permanent player UUID
- `profile_id` — The RUN.game profile ID
- `is_anonymous` — Whether the player is signed in
- `first_seen` — Timestamp
- All campaign params (fbclid, gclid, UTMs, ref, referredBy)
- All device info (platform, browser, screen size, pixel ratio, orientation, language, mobile/tablet flags)

#### `platform_migration` (when player switches client types)

Fired when a returning player's client type differs from their first visit (e.g., they first played on `mobile_web` and now they're in the `app`). Contains:

- `durable_id` + `profile_id`
- `from_platform` / `from_client` — Original platform/client
- `to_platform` / `to_client` — Current platform/client
- `first_seen` — When they originally started
- `original_campaign` — What campaign brought them originally
- `session_count` — How many sessions total

#### `session_attribution` (every session)

Fired on **every** game launch. This is the workhorse event for stitching identities. Contains:

- `durable_id` + `profile_id` + `is_anonymous`
- `is_first_session` — Boolean
- `session_count` — Total sessions
- First-touch info: `first_seen`, `first_platform`, `first_client`, `first_campaign`
- Current session info: `current_platform`, `current_client`
- All current campaign params (if they came through a link this time)
- Device details: `device_type`, `screen_width`, `screen_height`, `pixel_ratio`, `orientation`, `browser`, `language`, `is_mobile_browser`, `is_tablet`

### Device info collected

The system calls two SDK methods to build a device snapshot:

- `RundotGameAPI.system.getEnvironment()` → platform, platformVersion, browser, userAgent, isMobile, isTablet, language
- `RundotGameAPI.system.getDevice()` → deviceType, screenSize (width/height), pixelRatio, orientation
- `RundotGameAPI.system.isMobile()` + `isWeb()` → determines client type (`app`, `mobile_web`, `desktop_web`)

### Storage safety

All storage reads/writes go through `safeStorage.ts` which provides:

- **Timeout protection**: Reads timeout after 10s, writes after 8s (prevents hanging)
- **Write deduplication**: If multiple writes for the same key fire simultaneously (e.g., visibilitychange + pagehide + beforeunload all trigger at once), only the first one executes
- **Error isolation**: Failures are reported to analytics but never crash the game
- **Timeout logging**: Storage timeouts are logged as `storage_warning` events (not crashes) to avoid inflating crash numbers

**File:** `src/game/safeStorage.ts`

---

## Layer 3: Game Analytics Funnel

### Platform context

Every analytics event automatically includes:

- `platform` — `ios`, `android`, or `web`
- `client` — `app`, `mobile_web`, or `desktop_web`

This is cached once at startup via `getPlatformContext()` and attached to every event.

**File:** `src/game/analytics.ts`

### Funnel steps

The core player journey is tracked as a numbered funnel using `RundotGameAPI.analytics.trackFunnelStep()`:

| Step | Event name | When it fires |
|------|-----------|---------------|
| 1 | `game_opened` | Title screen loads |
| 2 | `class_selected` | Player picks a class (fires once per session even if they tap multiple classes) |
| 3 | `zone_selected` | Player picks a zone and starts a run |
| 4 | `reached_floor_3` | Player survives past floor 2 |
| 5 | `reached_floor_5` | Player reaches floor 5 |
| 6 | `player_death` | Player dies (completed a full run) |
| 7 | `started_second_run` | Player starts another run after dying (only on generation 1 — first replay) |

Each funnel step fires **two** things:
1. `trackFunnelStep(step, name, 'game_funnel', 1)` — The SDK's built-in funnel tracker
2. `recordCustomEvent('funnel_{name}', { platform, client, funnel_step })` — A custom event duplicate for flexible querying

### Custom game events

Beyond the funnel, these events track specific player actions:

| Event | What it captures |
|-------|-----------------|
| `player_identity` | Whether player is signed in, has username |
| `class_selected` | Which class was picked |
| `zone_selected` | Which zone + class |
| `floor_reached` | Floor number + class + zone (every floor) |
| `player_death` | Full death report: class, zone, floor, level, score, kills, cause of death, generation, duration, equipment, HP, auto-mode status, skill points, consumables used |
| `run_started` | Generation number (which run number this is) |
| `shop_purchase` | Item bought, cost, gold before/after, location |
| `mercenary_hired` | Merc name, cost, gold, location, active merc count |
| `item_equipped` | Item name/type/slot, location |
| `item_sold` | Item name/type, gold gained, location |
| `offer_shown/clicked/dismissed` | Monetization offer funnel |
| `premium_purchased` | Cost, player gold, location, generation |
| `auto_mode_toggled` | Enabled/disabled, mode, location, HP percent |
| `necropolis_opened` | Meta-feature access |
| `bestiary_opened` | Meta-feature access |
| `bloodline_opened` | Meta-feature access |
| `skill_unlocked` | Node ID/name, cost, SP remaining/spent, class, location |
| `ability_used` | Ability name, class, location, HP%, success, manual vs auto |
| `ranged_attack` | Class, location, distance, target |
| `consumable_used` | Item name/type, HP before/after/max, hunger before/after/max |
| `death_screen_action` | Which button was tapped on death screen, generation, is first/second death |
| `quest_completed` | Quest ID/name/tier, reward, totals |
| `quest_claimed` | Quest details + echoes earned |
| `quest_assigned` | Quest details + slot index |
| `echo_node_unlocked` | Node ID/name/path/tier, cost, remaining, total unlocked |
| `quest_log_opened` | Current screen, active/completed quests, total echoes |
| `echo_tree_opened` | Current screen, echoes, nodes unlocked/total |
| `quest_run_summary` | End-of-run quest/echo totals |

### Session tracking

Tracks when and where players leave the game. Fires `session_end` with:

- `screen` — What screen they were on (title, dungeon, death, etc.)
- `player_class`, `zone`, `floor` — Where they were in the game
- `duration_seconds` — How long the session lasted
- `trigger` — What caused the session to end: `sleep`, `quit`, `visibilitychange`, `pagehide`, `beforeunload`, or `freeze`
- Meta-progression state: echoes, echo nodes, skill points, generation, quests

Session end is detected through **two** mechanisms for reliability:
1. **SDK lifecycle hooks**: `onSleep()`, `onQuit()` — reliable on iOS
2. **Browser events**: `visibilitychange`, `pagehide`, `beforeunload`, `freeze` — reliable on Android where the process can be killed without SDK hooks firing

A `_pendingSessionEnd` flag ensures only one session-end fires per departure. It resets when the player returns (`onResume`, `onAwake`, visibility becomes visible again).

The session context is updated throughout gameplay via `updateSessionContext()` and `updateSessionMetaContext()` so the session-end event always has current data.

---

## Layer 4: Error & Crash Reporting

### Boot crash detection

A small inline script in `index.html` (runs before any modules load) captures:
- `__bootTimestamp` — When the HTML was parsed
- `__bootPhase` — Current phase (html_parsed → module_loaded → error_handlers_installed → creating_root → rendering → rendered)
- `__bootErrors` — Array of up to 10 errors that happen before React loads
- `__bootDevice` — Device fingerprint for crash correlation

Once React loads, `main.tsx` fires:
- `boot_telemetry` event — Boot duration + early error count + device info
- `boot_error` events — Individual early errors with phase, message, source, line/col

**Files:** `index.html` (lines 25–72), `src/main.tsx` (lines 51–95)

### Runtime error reporting

`errorReporting.ts` provides:

- **`reportError(source, error, extra)`** — Central reporting function
  - Sends to SDK structured logging (`RundotGameAPI.error()`)
  - Sends to analytics as `crash_report` event with full context (screen, class, zone, floor, generation, player ID, device info)
  - Deduplicates: same source+message combo only reported once (up to 50 unique errors)
  - 5-second timeout on analytics call to prevent cascading hangs

- **`installGlobalErrorHandlers()`** — Installs window.onerror + unhandledrejection handlers
  - Filters out SDK-internal noise (`H5_DEBUG`, `H5_LOG_ANALYTICS_EVENT` timeouts)
  - Installed in `main.tsx` before anything else runs

- **`safeEngineCall(fnName, fn)`** — Wraps game logic in try/catch, reports errors, returns null so the game can recover

- **`updateErrorContext(partial)`** — Called throughout gameplay to keep error context current

**File:** `src/game/errorReporting.ts`

---

## Data Flow Summary

```
Player clicks Facebook ad
    ↓
URL contains: ?fbclid=abc123&utm_source=facebook&utm_campaign=spring_sale
    ↓
index.html loads → Meta Pixel initialized (pixel 1938108636803653)
    ↓
Boot crash detection starts capturing errors
    ↓
React app loads → boot_telemetry event fires
    ↓
Game.tsx initializes:
    ├── trackAttribution() → first_touch_attribution (if new) + session_attribution (always)
    ├── trackGameOpened() → funnel step 1
    ├── trackPlayerIdentity() → player_identity event
    └── setupSessionTracking() → hooks for session_end
    ↓
Player selects class → funnel step 2 + class_selected event
    ↓
Player selects zone → funnel step 3 + zone_selected event
    ↓
Player enters dungeon:
    ├── fbq PageView on general pixel
    ├── Timed pixel timers start (30s, 1min, 2min, 3min, 5min, 7min, 10min)
    └── floor_reached events fire as they progress
    ↓
Player plays for 5 minutes:
    ├── 30s pixel fires
    ├── 1min pixel fires
    ├── 2min pixel fires
    ├── 3min pixel fires
    └── 5min pixel fires
    ↓
Player dies → funnel step 6 + player_death event (full run summary)
    ↓
Player starts another run → funnel step 7 + run_started event
    ↓
Player leaves (closes tab / switches app):
    └── session_end event fires with final state
```

---

## Facebook Pixel IDs Reference

| Pixel ID | Purpose |
|----------|---------|
| `1938108636803653` | General pixel — page load init + dungeon entry PageView |
| `836086159492144` | 30-second retention |
| `1454026359429653` | 1-minute retention |
| `4327199907516237` | 2-minute retention |
| `950565250690147` | 3-minute retention |
| `1807456903196666` | 5-minute retention |
| `1557138382039810` | 7-minute retention |
| `1650984392689108` | 10-minute retention |

---

## Key Files

| File | Purpose |
|------|---------|
| `index.html` | Meta Pixel script injection + boot crash detection |
| `src/main.tsx` | Boot telemetry + global error handlers |
| `src/game/attribution.ts` | Durable player ID + first-touch/session attribution |
| `src/game/analytics.ts` | Game funnel + 30+ custom event trackers + session tracking |
| `src/game/Game.tsx` | Orchestrates all tracking — calls attribution, analytics, and fires timed pixels |
| `src/game/safeStorage.ts` | Timeout-protected SDK storage wrappers |
| `src/game/errorReporting.ts` | Crash reporting + global error handlers |
