# Story Content Creation Guide — Depths of Dungeon

> **Purpose:** This is the single source of truth for AI agents (and humans) creating or
> modifying story mode content. Read this document **before planning** and **verify against it
> before deploying**. Every lesson below was learned from a real production mistake.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [File Map](#2-file-map)
3. [Type Reference (Required vs Optional Fields)](#3-type-reference)
4. [Content Creation Checklist — The Golden Path](#4-content-creation-checklist)
5. [Art Asset Pipeline](#5-art-asset-pipeline)
6. [Engine Placement — How Content Reaches the Map](#6-engine-placement)
7. [UI Rendering — How Content Reaches the Player](#7-ui-rendering)
8. [Lessons Learned — Mistakes We Made](#8-lessons-learned)
9. [Pre-Deploy Verification Checklist](#9-pre-deploy-verification-checklist)
10. [Content Writing Style Guide](#10-content-writing-style-guide)

---

## 1. Architecture Overview

Story mode uses **static, pre-baked chapter definitions** (TypeScript objects) that the
`storyEngine.ts` adapter converts into standard `GameState` objects the roguelike engine can
render. There is **no AI generation at runtime** for story mode — all content is defined at
build time.

```
ChapterDef (chapter1.ts)        Defines floors, encounters, NPCs, monsters, items, art refs
       │
       ▼
newStoryFloor() (storyEngine.ts) Generates dungeon layout, places content as entities
       │
       ▼
GameState                        Standard game state with _isStoryMode = true
       │
       ▼
Game.tsx (storyHandleChange)     React handler routes events to correct UI screens
       │
       ▼
Player sees slides, skill checks, dialogues, atmospheric popups, combat, boss fights
```

### Key Principle

The chapter `.ts` file is the **single source of truth** for all content on a floor. If it's
not defined there, it doesn't exist in the game. Every `artAsset` path referenced in the
chapter file **must** have a corresponding `.png` file in `public/cdn-assets/story/`.

---

## 2. File Map

| File | Purpose |
|------|---------|
| `src/game/story-mode/campaignTypes.ts` | All TypeScript interfaces for story content |
| `src/game/story-mode/campaignSave.ts` | Save/load/delete campaign state |
| `src/game/story-mode/storyEngine.ts` | Floor generation, content placement, movement |
| `src/game/story-mode/storyNpcRegistry.ts` | Per-floor NPC lookup registry |
| `src/game/story-mode/StoryHub.tsx` | Campaign selection UI |
| `src/game/story-mode/chapters/index.ts` | Chapter registry (`ALL_CHAPTERS`, `getChapter`) |
| `src/game/story-mode/chapters/chapter1.ts` | Chapter 1 content definition |
| `src/game/story-mode/chapters/chapter2.ts` | Chapter 2 content definition |
| `src/game/Game.tsx` | Story event handler (`storyHandleChange`) |
| `src/game/types.ts` | `InteractableElement` (shared with roguelike) |
| `src/game/useCdnImage.ts` | CDN asset loader hook (retry + fallback) |
| `public/cdn-assets/story/` | All story art assets (PNG files) |

---

## 3. Type Reference

### ChapterDef

```typescript
interface ChapterDef {
  id: string;                          // REQUIRED — e.g. 'ch1_the_descent'
  name: string;                        // REQUIRED — display name
  description: string;                 // REQUIRED — chapter summary
  color: string;                       // REQUIRED — hex color for UI
  icon: string;                        // REQUIRED — emoji icon
  floors: StoryFloorDef[];             // REQUIRED — at least 1 floor
  boss: StoryBossDef;                  // REQUIRED — chapter boss
  requiredChapters: string[];          // REQUIRED — can be empty []
  rewards: ChapterReward[];            // REQUIRED — shown on completion
  victoryArtAsset?: string;            // OPTIONAL — art for completion screen
  bossItemDrop?: PrebakedItemSpawn;    // OPTIONAL — special boss loot
  miniBossVictories?: MiniBossVictory[];  // OPTIONAL — mini-boss defeat events
  loreEntries?: LoreEntry[];           // OPTIONAL — unlockable lore
}
```

### StoryFloorDef

```typescript
interface StoryFloorDef {
  floorIndex: number;                  // REQUIRED — must be unique within chapter
  zone: ZoneId;                        // REQUIRED — determines tileset/aesthetics
  encounters: PrebakedEncounter[];     // REQUIRED — can be empty []
  npcs: PrebakedNPC[];                 // REQUIRED — can be empty []
  roomEvents: PrebakedRoomEvent[];     // REQUIRED — can be empty []
  monsters: PrebakedMonsterSpawn[];    // REQUIRED — can be empty []
  items: PrebakedItemSpawn[];          // REQUIRED — can be empty []
  hasCheckpoint: boolean;              // REQUIRED — save on entry?
  introSlides?: NarrativeSlide[];      // OPTIONAL — shown on floor entry
  roomMessages?: string[];             // OPTIONAL — ambient log messages
  atmosphericEvents?: AtmosphericEvent[];  // OPTIONAL — image+text popups
}
```

### AtmosphericEvent

```typescript
interface AtmosphericEvent {
  id: string;       // REQUIRED — unique ID, e.g. 'ch1_f1_atmo_abandoned_cart'
  title: string;    // REQUIRED — popup title
  text: string;     // REQUIRED — narrative text
  artAsset: string; // REQUIRED — CDN path, e.g. 'story/story-ch1-atmo-abandoned-cart.png'
}
```

**CRITICAL:** Unlike other content types, `artAsset` is **required** on AtmosphericEvent.
Every atmospheric event MUST have art. That's the whole point — they're image-driven mood
setters.

### PrebakedEncounter (Skill Checks)

```typescript
interface PrebakedEncounter {
  id: string;                        // REQUIRED — unique
  type: 'skill_challenge' | 'hidden_cache' | 'trapped_room' | 'negotiation' | 'chase';
  description: string;               // REQUIRED — what the player sees
  primarySkill: SkillName;           // REQUIRED — stealth/diplomacy/athletics/awareness/lore/survival
  alternateSkill?: SkillName;        // OPTIONAL — secondary skill option
  target: number;                    // REQUIRED — difficulty (7 = easy, 10 = hard, 12+ = very hard)
  successDescription: string;        // REQUIRED — text on success
  successReward: { type: 'item' | 'gold' | 'heal'; value: string | number };
  failureDescription: string;        // REQUIRED — text on failure
  failurePenalty?: { type: 'damage' | 'hunger'; value: number };
  artAsset?: string;                 // OPTIONAL but STRONGLY recommended
}
```

### PrebakedNPC

```typescript
interface PrebakedNPC {
  id: string;             // REQUIRED
  name: string;           // REQUIRED
  char: string;           // REQUIRED — single character for map display
  color: string;          // REQUIRED — hex color
  dialogue: DialogueNode; // REQUIRED — conversation tree
  portraitAsset?: string;  // OPTIONAL but recommended for key NPCs
  setsFlag?: { key: string; value: string };    // OPTIONAL
  requiresFlag?: { key: string; value: string }; // OPTIONAL — NOTE: not fully wired in engine
}
```

**DialogueNode structure:**
```typescript
interface DialogueNode {
  text: string;
  choices?: {
    label: string;
    responseText: string;
    effects?: Array<
      | { type: 'heal'; value: number; message?: string }
      | { type: 'damage'; value: number; message?: string }
      | { type: 'statBuff'; stat: string; amount: number }
      | { type: 'gold'; value: number }
      | { type: 'message'; text: string; color?: string }
    >;
  }[];
}
```

### PrebakedRoomEvent

```typescript
interface PrebakedRoomEvent {
  id: string;                        // REQUIRED
  type: RoomEventType;               // REQUIRED — 'ancient_altar' | 'trap_chamber' | ...
  name: string;                      // REQUIRED
  description: string;               // REQUIRED
  primarySkill: SkillName;           // REQUIRED
  alternateSkill?: SkillName;        // OPTIONAL
  baseDifficulty: number;            // REQUIRED
  criticalSuccess: RoomEventOutcome; // REQUIRED — all 5 outcome bands
  success: RoomEventOutcome;         // REQUIRED
  partial: RoomEventOutcome;         // REQUIRED
  failure: RoomEventOutcome;         // REQUIRED
  criticalFailure: RoomEventOutcome; // REQUIRED
  artAsset?: string;                 // OPTIONAL but recommended
}
```

**RoomEventOutcome structure:**
```typescript
interface RoomEventOutcome {
  description: string;
  effects: Array<{
    type: 'heal' | 'damage' | 'gold' | 'message' | ...;
    value?: number;
    message?: string;
  }>;
}
```

**WARNING:** The engine simplifies room event outcomes — only the first `heal` effect from
success and the first `damage` effect from failure are mapped onto the interactable. The full
5-band outcome table is defined in the chapter file but is NOT fully executed via the skill
check modal. Write all 5 bands for future-proofing, but know that currently only a simplified
heal/damage pair is applied.

### PrebakedMonsterSpawn

```typescript
interface PrebakedMonsterSpawn {
  name: string;           // REQUIRED
  char: string;           // REQUIRED — single character
  color: string;          // REQUIRED — hex
  stats: Stats;           // REQUIRED — { hp, maxHp, attack, defense, speed }
  xpValue: number;        // REQUIRED
  lootChance: number;     // REQUIRED — 0.0 to 1.0
  count: number;          // REQUIRED — how many to spawn
  isBoss?: boolean;       // OPTIONAL — for mini-bosses
  bossAbility?: BossAbility; // OPTIONAL — needed if isBoss
  element?: Element;      // OPTIONAL
  defeatMessage?: string; // OPTIONAL — log flavor on kill
}
```

### PrebakedItemSpawn

```typescript
interface PrebakedItemSpawn {
  name: string;           // REQUIRED
  type: 'weapon' | 'armor' | 'ring' | 'amulet' | 'offhand' | 'potion' | 'scroll' | 'food';
  char: string;           // REQUIRED
  color: string;          // REQUIRED
  value: number;          // REQUIRED — gold value
  description: string;    // REQUIRED
  count: number;          // REQUIRED — how many to place
  rarity?: ItemRarity;    // OPTIONAL — 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  statBonus?: Partial<Stats>; // OPTIONAL — for equippable items
  equipSlot?: string;     // OPTIONAL — needed for equippable items
  onHitEffect?: ItemEffect; // OPTIONAL
}
```

### StoryBossDef

```typescript
interface StoryBossDef {
  name: string;           // REQUIRED — must match miniBossVictories.monsterName if applicable
  title: string;          // REQUIRED
  char: string;           // REQUIRED
  color: string;          // REQUIRED
  stats: Stats;           // REQUIRED — { hp, maxHp, attack, defense, speed }
  xpValue: number;        // REQUIRED
  bossAbility: BossAbility; // REQUIRED
  introDialogue: string;  // REQUIRED — shown before fight
  defeatDialogue: string; // REQUIRED — shown on chapter completion
  element?: Element;      // OPTIONAL
  portraitAsset?: string;  // OPTIONAL but recommended
}
```

### MiniBossVictory

```typescript
interface MiniBossVictory {
  monsterName: string;          // REQUIRED — MUST match a PrebakedMonsterSpawn.name exactly
  artAsset: string;             // REQUIRED — CDN path
  narrative: string;            // REQUIRED — shown on defeat screen
  loreUnlock?: string;          // OPTIONAL — sets storyFlags['lore_${value}'] = 'unlocked'
  itemDrop: PrebakedItemSpawn;  // REQUIRED — special loot
}
```

### LoreEntry

```typescript
interface LoreEntry {
  id: string;                   // REQUIRED — must match loreUnlock value if tied to mini-boss
  title: string;                // REQUIRED
  slides: NarrativeSlide[];     // REQUIRED — array of { text, title?, artAsset? }
}
```

### ChapterReward

```typescript
interface ChapterReward {
  type: 'item' | 'gold' | 'skill_points' | 'unlock_chapter';
  value: string | number;       // REQUIRED
  description: string;          // REQUIRED — shown on completion screen
}
```

---

## 4. Content Creation Checklist — The Golden Path

Follow this order when creating a new chapter or floor:

### Phase 1: Planning

- [ ] Define the chapter narrative arc (theme, boss, key characters)
- [ ] Plan floor count (4 floors recommended for MVP)
- [ ] For each floor, plan: zone, intro slides, encounters, NPCs, room events,
      atmospheric events, monsters, items
- [ ] Plan the boss fight (stats, abilities, intro/defeat dialogue)
- [ ] Plan mini-boss victories if applicable
- [ ] Plan lore entries (linked to boss/mini-boss defeats)
- [ ] **VERIFY:** Every `artAsset` path you plan to reference has a naming convention
      matching `story/story-ch{N}-{descriptor}.png`
- [ ] **VERIFY:** Read this document's type reference to ensure all required fields are planned

### Phase 2: Art Generation

- [ ] List ALL art assets needed (intro slides, encounters, NPCs, atmospheric events,
      boss portrait, victory art, mini-boss victory art, lore slides)
- [ ] Generate art using `https://i.imgur.com/PRiO50h.png` as the `reference_image_paths`
      for consistent pixel art style
- [ ] Save generated images to `public/cdn-assets/story/` with correct filenames
- [ ] **VERIFY:** Every filename matches the `artAsset` string in the chapter definition
      (these are CDN-relative paths like `story/story-ch1-atmo-canary-cage.png`)

### Phase 3: Content Definition

- [ ] Create or update the chapter TypeScript file (`chapters/chapterN.ts`)
- [ ] Register the chapter in `chapters/index.ts` (`ALL_CHAPTERS` array)
- [ ] For each floor, populate all required arrays (even if empty `[]`)
- [ ] Set `hasCheckpoint: true` on first floor and boss floor at minimum
- [ ] **VERIFY:** All `artAsset` paths start with `story/` prefix
- [ ] **VERIFY:** No duplicate `id` values across encounters, NPCs, atmospheric events,
      room events within the chapter
- [ ] **VERIFY:** Boss `name` matches `miniBossVictories[].monsterName` if there are
      mini-boss events
- [ ] **VERIFY:** `loreEntries[].id` matches `miniBossVictories[].loreUnlock` values

### Phase 4: Pre-Deploy Verification

- [ ] Run `tsc --noEmit` — zero type errors
- [ ] Verify all art files exist: every `artAsset` string in the chapter file must have
      a corresponding file in `public/cdn-assets/story/`
- [ ] Cross-reference: count artAsset references in chapter file vs actual files
- [ ] Test locally: can you start a new campaign and reach each floor?
- [ ] Test: do intro slides show with art?
- [ ] Test: do atmospheric events trigger and show images?
- [ ] Test: do skill checks display correctly?
- [ ] Test: does the boss fight trigger and show intro dialogue?
- [ ] Test: does chapter completion screen appear after boss defeat?
- [ ] Test: does death reload from checkpoint correctly?

---

## 5. Art Asset Pipeline

### Naming Convention

```
story/story-{chapter}-{descriptor}.png
```

Examples:
- `story/story-ch1-atmo-abandoned-cart.png` — Ch1 atmospheric event
- `story/story-ch2-architect.png` — Ch2 boss portrait
- `story/story-ch2-amalgam-defeat.png` — Ch2 mini-boss victory art
- `story/story-ch2-lore-miners-taken.png` — Ch2 lore slide art
- `story/story-sellsword.png` — shared story art (no chapter prefix)

### Style Reference

**ALWAYS** use `https://i.imgur.com/PRiO50h.png` as `reference_image_paths` when generating
art with the GenerateImage tool. This is the pixel art style reference that matches the
game's established aesthetic.

**NEVER** use local file paths as `reference_image_paths` — they don't work reliably across
environments and the generated art may not match the game's style.

### Art Generation Prompt Template

```
Dark, gritty 16-bit pixel art scene of [SUBJECT DESCRIPTION].
[SPECIFIC DETAILS about composition, characters, environment].
Heavy pixel dithering, bold neon outlines, extremely detailed gritty textures.
[COLOR PALETTE — e.g. "dark palette with teal and purple highlights"].
Widescreen landscape 16:9 retro dungeon crawler pixel art.
```

### File Storage

- Generated images go to `public/cdn-assets/story/`
- The CDN path in code is relative: `'story/story-ch1-atmo-canary-cage.png'`
- The file on disk is at: `public/cdn-assets/story/story-ch1-atmo-canary-cage.png`
- **The `story/` prefix in the artAsset string corresponds to the `story/` subdirectory
  inside `public/cdn-assets/`**

### Common Mistakes

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| `artAsset: 'story-ch1-foo.png'` (missing `story/` prefix) | Image not found at runtime | Always prefix with `story/` |
| File named `story-ch1-foo.png` but ref says `story/story-ch1-bar.png` | 404 at runtime | Filenames must exactly match |
| Using local file paths as GenerateImage references | Style mismatch | Use imgur URL |
| Generating art without any reference images | Inconsistent style | Always pass imgur ref |
| Forgetting to copy generated images to cdn-assets | Missing art in game | Always copy after generating |
| Creating `-v2` files but not updating refs | Old art shown | Update all refs or replace the file |

---

## 6. Engine Placement — How Content Reaches the Map

`newStoryFloor()` in `storyEngine.ts` handles all placement:

### Room Allocation

```
Room 0 (first room)     → Player spawn point — NO content placed here
Rooms 1..N-2            → Content rooms (NPCs, encounters, room events, atmospheric events)
Room N-1 (last room)    → Stairs + Boss (on last floor only)
```

Content is distributed round-robin across content rooms using `getNextRoom()`.

### Placement Order

1. **Monsters** → scattered across rooms (separate allocator, not round-robin)
2. **Items** → scattered across rooms
3. **NPCs** → placed first in round-robin order (so players find them early)
4. **Encounters** → placed next as `InteractableElement` objects
5. **Room Events** → placed as `InteractableElement` objects
6. **Atmospheric Events** → placed last as `InteractableElement` with `isAtmospheric: true`

### Type Mapping (Encounter → InteractableElement)

| PrebakedEncounter.type | InteractableElement.type |
|----------------------|------------------------|
| `skill_challenge` | `stuck_mechanism` |
| `negotiation` | `negotiation` |
| `trapped_room` | `locked_door` |
| `hidden_cache` | `ancient_puzzle` |
| `chase` | `stuck_mechanism` |

Room events always map to `ancient_puzzle`.
Atmospheric events map to `ancient_puzzle` with `target: 0` and `isAtmospheric: true`.

### Content Room Capacity

If you have more content items than rooms, they'll wrap around (round-robin). This means
multiple encounters/NPCs can end up in the same room. This is fine gameplay-wise but consider
that too many items in one room can feel cluttered.

**Recommendation:** Per floor, aim for:
- 1-2 encounters
- 0-1 NPCs (not every floor needs one)
- 1-2 room events
- 2-3 atmospheric events
- 3-6 monster types with varying counts
- 3-5 item types

---

## 7. UI Rendering — How Content Reaches the Player

### storyHandleChange flow in Game.tsx

```
Player moves/waits
       │
       ▼
storyMovePlayer() / storyWaitTurn() returns StoryMoveResult
       │
       ▼
storyHandleChange(nextState, moveResult)
       │
       ├─ floorChanged? → save checkpoint + show introSlides
       ├─ gameOver? → reload checkpoint after 1.5s delay
       ├─ standing on interactable?
       │    ├─ isAtmospheric? → setStorySlides (image + text popup)
       │    └─ else → setShowSkillCheck (skill check modal)
       ├─ chapterEndReached? → show chapter completion if boss defeated
       ├─ killedNames includes mini-boss? → show MiniBossVictory screen
       └─ killedNames includes chapter boss? → show ChapterComplete screen
```

### Art Loading

- **Intro slides / atmospheric events:** `RundotGameAPI.cdn.fetchAsset(artAsset)` → blob URL
- **Skill check art:** Same CDN fetch, or `generateSkillCheckArt()` fallback in roguelike
- **NPC portraits:** `portraitAsset` loaded via CDN in `NPCDialogue.tsx`
- **Victory art:** CDN fetch when `storyChapterComplete` state is set
- **Mini-boss art:** CDN fetch when `storyMiniBossVictory` state is set
- **Lore slides:** CDN fetch when lore viewer opens

**Fallback:** `useCdnImage` retries 3x with exponential backoff, then falls back to
`'/' + assetPath` (public folder). This means `public/cdn-assets/story/foo.png` is
accessible as `/cdn-assets/story/foo.png` in dev mode.

---

## 8. Lessons Learned — Mistakes We Made

### L1: Art style inconsistency

**What happened:** Generated 24 images without using the imgur reference URL. The art looked
"very off" from the rest of the game art — different style, colors, and feel.

**Root cause:** The GenerateImage tool was called with no `reference_image_paths` or with
local file paths that didn't properly convey the style.

**Fix:** ALWAYS use `https://i.imgur.com/PRiO50h.png` as `reference_image_paths`. This
single URL captures the game's pixel art DNA.

**Prevention:** This is in the [Art Asset Pipeline](#5-art-asset-pipeline) section and the
[Pre-Deploy Checklist](#9-pre-deploy-verification-checklist).

---

### L2: Chapter end left player wandering

**What happened:** After reaching the end of a chapter (all floors cleared, boss beaten),
the player was left wandering with just a log message "You have reached the end of this
chapter" and no completion screen.

**Root cause:** `storyDescend` would increment `floorNumber` beyond defined chapter floors,
leading to an invalid state. No chapter completion UI was triggered.

**Fix:** `storyMovePlayer` now returns `chapterEndReached: true` in `StoryMoveResult` when
the player tries to descend past the last defined floor. `storyHandleChange` detects this
and triggers `setStoryChapterComplete`.

**Prevention:** Always test the full play-through including the chapter end transition.

---

### L3: Missing art assets at runtime

**What happened:** Art assets were referenced in chapter definitions but the actual PNG files
were never copied to `public/cdn-assets/story/`.

**Root cause:** Images were generated to a temp directory but the copy step was interrupted
or forgotten.

**Fix:** Added copy step verification to the deployment checklist.

**Prevention:** After generating art, ALWAYS verify files exist at the expected CDN path.
Cross-reference the chapter file's `artAsset` values against the actual filesystem.

---

### L4: Boss floors too empty

**What happened:** The Sleeper floor (Ch1 Floor 4) had nothing except the boss. No unique
enemies, no discoveries, no atmospheric events. Felt barren and anticlimactic.

**Root cause:** Boss floors were treated as "just the boss fight" without considering the
exploration leading up to it.

**Fix:** Added unique thematic monsters, encounters, NPCs, room events, and atmospheric
events to boss floors. Boss floors should be the most content-rich floors.

**Prevention:** Boss floors need MORE content than regular floors, not less. Plan for:
- 3+ unique monster types
- 1-2 encounters
- 1 thematic NPC
- 1 room event
- 2-3 atmospheric events
- Unique items

---

### L5: Vite HMR cascade failures from missing exports

**What happened:** Renaming or removing exports (`FALLBACK_ENCOUNTERS`,
`getAvailableStoryAllies`, `checkEncounterDiscovery`) broke the entire Vite module graph,
cascading failures across every screen.

**Root cause:** Partial refactors — changing one file's exports without updating every
importer. ESM named imports fail hard.

**Fix:** Always grep the codebase for any symbol you're renaming/removing before doing so.

**Prevention:** After any refactor, run `tsc --noEmit` immediately before testing.

---

### L6: Room event outcomes oversimplified

**What happened:** Chapter files define 5 outcome bands (criticalSuccess through
criticalFailure) for room events, but the engine only extracts a single heal and single
damage value from them.

**Root cause:** `storyEngine.ts` maps room events to `InteractableElement` which only
supports `successEffect` and `failureEffect` (not 5 bands).

**Impact:** The rich outcome text in the chapter file is partially wasted. The descriptions
are used as hints but only the simplified heal/damage effects are applied.

**Mitigation:** Still write all 5 bands (future-proofing). The success/failure hints DO
show the descriptions. Just know the actual mechanical effects are simplified.

---

### L7: `setsFlag` / `requiresFlag` on NPCs not fully wired

**What happened:** NPC definitions include `setsFlag` and `requiresFlag` properties, but
the dialogue completion code doesn't write to `CampaignSave.storyFlags`, and the spawn
code doesn't filter by `requiresFlag`.

**Impact:** Conditional NPC appearances based on player choices don't work yet.

**Mitigation:** Define the flags anyway (future-proofing), but don't rely on them for
critical story progression.

---

### L8: Firebase App Check noise in hosted testing

**What happened:** Production/hosted builds generate ~200+ Firebase App Check errors in
console, making it hard to see actual game errors.

**Impact:** Difficult to debug story mode issues in hosted environment.

**Mitigation:** Test story mode locally (localhost:5174) where mock SDK is cleaner.
Use `[Story]`, `[Engine]` log prefixes to filter.

---

### L9: Duplicate/dead art assets

**What happened:** Assets folder accumulated both clean names (`story-ch1-foo.png`) and
auto-generated names (`c__Users_mikeg_...png`), plus `-v2` iterations where refs weren't
updated.

**Root cause:** No cleanup step, no verification that refs match files.

**Prevention:** After generating art, delete old versions. Never leave `-v2` files — either
rename to replace the original or update all refs.

---

### L10: Atmospheric events require ALL fields

**What happened:** Atmospheric events created without `artAsset` — which defeats their
purpose as image-driven mood setters.

**Root cause:** The interface was initially designed with `artAsset` optional, then changed
to required, but habits persisted.

**Prevention:** `AtmosphericEvent.artAsset` is REQUIRED. No atmospheric event without art.
If you don't have art ready, don't add the atmospheric event yet.

---

## 9. Pre-Deploy Verification Checklist

Run through this EVERY TIME before considering content complete:

### TypeScript Compilation

```bash
npx tsc --noEmit
```

- [ ] Zero errors

### Art Asset Cross-Reference

For every chapter file being deployed:

- [ ] Extract all `artAsset` and `portraitAsset` values from the chapter file
- [ ] Verify each file exists in `public/cdn-assets/story/`
- [ ] Verify filenames match EXACTLY (case-sensitive)
- [ ] Count: `artAsset references in code` ≤ `files in cdn-assets/story/`

### Content Completeness

For each floor in the chapter:

- [ ] `floorIndex` is unique within the chapter
- [ ] `zone` is a valid ZoneId
- [ ] `hasCheckpoint` is set (true on first floor and boss floor minimum)
- [ ] All arrays present (encounters, npcs, roomEvents, monsters, items — even if empty)
- [ ] At least 2 `atmosphericEvents` per floor
- [ ] Boss floor has extra content (not just the boss)

### Chapter-Level

- [ ] Chapter registered in `chapters/index.ts`
- [ ] `boss.name` matches any relevant `miniBossVictories[].monsterName`
- [ ] `loreEntries[].id` matches `miniBossVictories[].loreUnlock` values
- [ ] `victoryArtAsset` file exists
- [ ] All `rewards` have valid types and values
- [ ] `requiredChapters` references valid chapter IDs (or is empty)

### Functional Testing

- [ ] New campaign starts successfully
- [ ] Intro slides display with art on floor 1
- [ ] Atmospheric events trigger when walked over (image + text appear)
- [ ] Skill checks display with correct skills and difficulty
- [ ] NPCs are interactable and show dialogue
- [ ] Monsters spawn and are killable
- [ ] Items are pickable
- [ ] Death reloads checkpoint (not permadeath)
- [ ] Floor transitions show intro slides for new floor
- [ ] Boss fight triggers with intro dialogue
- [ ] Boss defeat shows chapter completion screen with rewards
- [ ] Mini-boss defeat shows victory screen with loot (if applicable)
- [ ] Lore entries viewable from Story Hub (if applicable)

---

## 10. Content Writing Style Guide

### Tone

- **Dark fantasy** with moments of dark humor and moral grayness
- **Concise and punchy** — max 150 chars per dialogue line
- **Show, don't tell** — describe what the player sees/hears/feels
- **Environmental storytelling** — objects and scenes tell the story, not exposition dumps

### Atmospheric Event Text

Atmospheric events should be **evocative and sensory**. They set mood, not advance plot.
They should make the player feel something about the space they're in.

Good:
> "A brass birdcage hangs from a ceiling hook, its door swinging open. Inside, a small pile
> of yellow feathers and nothing else. The silence where birdsong should be feels like a
> wound."

Bad:
> "You see an empty birdcage. Miners used these to detect gas."

### Encounter Descriptions

Describe the **scene**, not the mechanic. The player should feel like they're making a
decision, not rolling dice.

Good:
> "A section of the mine wall looks recently disturbed. Loose stones are piled unnaturally."

Bad:
> "Make an Awareness check (DC 7) to find hidden treasure."

### Boss Dialogue

Boss intro and defeat dialogues should be **dramatic and memorable**. Use the boss's voice.
Show their motivation. The defeat dialogue should feel earned.

### Room Messages

Short, atmospheric one-liners for the message log. Each should paint a tiny picture:

> "Chalk on the wall reads: 'COBB IF YOU SEE THIS GO HOME. DONT GO DEEPER.'"

### Naming IDs

Use consistent, descriptive ID formats:

```
ch{N}_f{M}_{type}_{descriptor}

Examples:
ch1_f1_atmo_abandoned_cart
ch1_f1_hidden_cache
ch2_f6_flesh_wall
ch2_rebel_deepfolk
```

---

## Appendix: Valid Zone IDs

These determine the tileset and visual theme of a floor:

- `stone_depths` — standard mine/dungeon
- `crystal_sanctum` — crystal-heavy areas
- `fungal_grotto` — organic/fungal
- `obsidian_halls` — dark stone
- `bone_pit` — skeletal/undead themed
- `flooded_depths` — water-heavy
- `infernal_rift` — fire/lava themed

---

## Appendix: Valid Skill Names

Used in encounters and room events:

- `stealth`
- `diplomacy`
- `athletics`
- `awareness`
- `lore`
- `survival`

---

## Appendix: Art Assets Needed Per Chapter (Template)

For a standard 4-floor chapter with boss:

| Category | Count | Naming Pattern |
|----------|-------|----------------|
| Intro slides (floor 1) | 3-5 | `story-ch{N}-{scene}.png` |
| Intro slides (floors 2-4) | 2-3 each | `story-ch{N}-{scene}.png` |
| Atmospheric events | 2-3 per floor = 8-12 total | `story-ch{N}-atmo-{descriptor}.png` |
| Encounter art | 2-3 per floor = 8-12 total | `story-ch{N}-{descriptor}.png` |
| NPC portraits | 1-2 per chapter | `story-ch{N}-{npc-name}.png` |
| Room event art | 1-2 per floor = 4-8 total | `story-ch{N}-{descriptor}.png` |
| Boss portrait | 1 | `story-ch{N}-{boss-name}.png` |
| Victory art | 1 | `story-ch{N}-{boss-name}-defeat.png` |
| Mini-boss victory art | 1 per mini-boss | `story-ch{N}-{name}-defeat.png` |
| Lore slide art | 2-3 per entry | `story-ch{N}-lore-{descriptor}.png` |
| **TOTAL** | **~30-50 images per chapter** | — |

---

*Last updated: April 2026. If you find a mistake or a new lesson, add it to Section 8.*
