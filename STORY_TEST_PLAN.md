# Story Mode Test Plan

> **Purpose:** Definitive checklist for verifying story mode content before deploy.
> Run the automated suite first, then use the manual checklist for anything
> the headless tests cannot cover (UI rendering, animation, audio).
>
> **Automated tests:** `npx tsx --import ./tests/node-polyfill.ts tests/story-mode-verify.ts`

---

## 1. Automated Test Coverage (headless, no browser)

These run in ~4 seconds and validate 1,395+ assertions across both chapters.

### 1.1 Floor Generation

| # | Check | Automated |
|---|-------|-----------|
| 1 | Each floor generates without throwing | Yes |
| 2 | `_isStoryMode` flag is `true` on every floor | Yes |
| 3 | `floorNumber` matches the `StoryFloorDef.floorIndex` | Yes |
| 4 | At least 2 rooms per floor | Yes |
| 5 | Stairs (`>` tile) exist on every floor | Yes |

### 1.2 Atmospheric Events

| # | Check | Automated |
|---|-------|-----------|
| 6 | Count matches chapter data (`atmosphericEvents.length`) | Yes |
| 7 | Each has `isAtmospheric: true` | Yes |
| 8 | Each has `artAsset`, `atmosphericTitle`, `description` | Yes |
| 9 | `target` is 0 (no skill check) | Yes |
| 10 | Art file exists on disk | Yes |
| 11 | Notes if placed in spawn room (won't trigger on room entry) | Yes (warning) |

### 1.3 Skill Check Encounters

| # | Check | Automated |
|---|-------|-----------|
| 12 | Count matches chapter data (encounters + room events) | Yes |
| 13 | `primarySkill` is a valid SkillName | Yes |
| 14 | `alternateSkill` is valid and differs from primary | Yes |
| 15 | `target` / `baseDifficulty` is in range 1-20 | Yes |
| 16 | Room events have all 5 outcome bands (criticalSuccess through criticalFailure) | Yes |
| 17 | Each outcome band has `description` and `effects` array | Yes |
| 18 | Chapter uses at least 4 of 6 skill types for variety | Yes |

### 1.4 Skills Across All Classes

| # | Check | Automated |
|---|-------|-----------|
| 19 | `initializeCharacterSkills` works for warrior, rogue, mage, ranger, paladin | Yes |
| 20 | All 6 skills are > 0 for every class | Yes |

### 1.5 NPCs

| # | Check | Automated |
|---|-------|-----------|
| 21 | NPC count matches chapter data | Yes |
| 22 | Every NPC `defId` maps to a chapter definition | Yes |
| 23 | Every NPC has `portraitAsset` defined | Yes |
| 24 | Portrait file exists on disk | Yes |

### 1.6 Items / Gear / Consumables

| # | Check | Automated |
|---|-------|-----------|
| 25 | Item count on floor matches chapter data | Yes |
| 26 | Each item has name, description, char, color, value > 0, count >= 1 | Yes |
| 27 | Item `type` is one of: weapon, armor, ring, amulet, offhand, potion, scroll, food | Yes |
| 28 | Equippable items (weapon/armor/ring/amulet/offhand) have `equipSlot` | Yes |
| 29 | Equippable items have `statBonus` or `onHitEffect` | Yes |
| 30 | Consumables (potion/food) have value > 0 | Yes |
| 31 | Boss item drop exists, has equipSlot, statBonus, rarity rare+ | Yes |
| 32 | Mini-boss item drops have name, equipSlot, statBonus | Yes |

### 1.7 Enemies

| # | Check | Automated |
|---|-------|-----------|
| 33 | Monster count matches chapter data (per species) | Yes |
| 34 | Each monster has: name, single-char display, color, HP > 0, HP = maxHP, ATK > 0, SPD > 0, DEF >= 0 | Yes |
| 35 | xpValue > 0, lootChance 0-1, count >= 1 | Yes |
| 36 | Chapter boss spawns ONLY on the last floor | Yes |
| 37 | Chapter boss name is not reused as a non-boss monster | Yes |
| 38 | Difficulty progression: boss floor monsters are tougher than floor 1 (avg HP) | Yes |

### 1.8 Boss / Chapter Boss

| # | Check | Automated |
|---|-------|-----------|
| 39 | Boss has name, introDialogue, defeatDialogue, HP > 0, bossAbility | Yes |
| 40 | Boss monster found on last floor with correct name | Yes |
| 41 | Boss names are unique across chapters | Yes |

### 1.9 Art Assets

| # | Check | Automated |
|---|-------|-----------|
| 42 | All art files referenced in chapter data exist in `public/cdn-assets/` | Yes |
| 43 | No unintentional art repeats within a chapter | Yes |
| 44 | Allowed reuse patterns: intro/portrait in encounters, encounter/roomEvent same floor, boss/lore cross-ref | Yes |
| 45 | No art repeats across chapters (except shared assets like sellsword) | Yes |

### 1.10 Victory / Wrap-up Scenes

| # | Check | Automated |
|---|-------|-----------|
| 46 | Boss `defeatDialogue` exists and is > 50 chars (proper wrap-up) | Yes |
| 47 | `victoryArtAsset` file exists on disk | Yes |
| 48 | Mini-boss victory entries are unique (no duplicate monster names) | Yes |
| 49 | Mini-boss narrative > 50 chars | Yes |
| 50 | Mini-boss art file exists | Yes |
| 51 | Mini-boss monster def has `isBoss: true` | Yes |
| 52 | Mini-boss `monsterName` matches a monster in the chapter data | Yes |
| 53 | Lore entry IDs are unique | Yes |
| 54 | Each lore entry has >= 2 slides with meaningful text (> 20 chars) | Yes |
| 55 | `loreUnlock` values from mini-boss victories match lore entry IDs | Yes |
| 56 | Chapter rewards >= 2, include gold or skill_points | Yes |

### 1.11 Floor Transitions

| # | Check | Automated |
|---|-------|-----------|
| 57 | Stepping on stairs triggers `floorChanged: true` | Yes |
| 58 | Floor number advances to the next floor's index | Yes |
| 59 | Descending past the last floor returns `chapterEndReached: true` | Yes |

### 1.12 Intro Slides

| # | Check | Automated |
|---|-------|-----------|
| 60 | Each intro slide has text | Yes |
| 61 | Intro slide art files exist on disk | Yes |

### 1.13 Chapter Structure

| # | Check | Automated |
|---|-------|-----------|
| 62 | Chapter has id, name, description, color, icon | Yes |
| 63 | At least 2 floors per chapter | Yes |
| 64 | Boss defined | Yes |
| 65 | Rewards defined | Yes |
| 66 | Chapter IDs are unique | Yes |
| 67 | No duplicate interactable IDs within a floor | Yes |

---

## 2. Manual Test Checklist (browser required)

These tests require visual verification and cannot be automated headlessly.
Access story mode via `http://localhost:3333/?debug` (click `[ Story Mode ]` in debug panel).

Dev console helpers (run in F12 console after entering game):
- `__storyGodMode()` — invincible (999 HP, 50 ATK/DEF)
- `__storyKillAll()` — kill all monsters on current floor
- `__storyRevealMap()` — reveal full map
- `__storyState()` — dump floor state (atmospheric events, encounters, NPCs, monsters)

### 2.1 Intro Slides (per floor)

| # | Check |
|---|-------|
| M1 | Slides appear on floor entry |
| M2 | Images load and render (not blank) |
| M3 | Text is readable and not truncated |
| M4 | Tapping advances to next slide without flickering back |
| M5 | Dot indicators update correctly |
| M6 | Last slide dismisses to game |

### 2.2 Atmospheric Events

| # | Check |
|---|-------|
| M7 | Popup appears automatically when entering a room (no need to walk on exact tile) |
| M8 | Popup shows image and narrative text |
| M9 | Tapping dismisses the popup |
| M10 | Each atmospheric event only fires once per room visit |
| M11 | Atmospheric events don't show `!` on the map (invisible markers) |
| M12 | At least 2 popups per floor |

### 2.3 Skill Checks

| # | Check |
|---|-------|
| M13 | Walking onto `!` marker opens skill check dialog |
| M14 | Dialog shows description, skill name, and roll button |
| M15 | Art image loads in the dialog (if defined) |
| M16 | Rolling produces success/failure with appropriate text and effects |
| M17 | `!` marker disappears after interaction |

### 2.4 NPCs

| # | Check |
|---|-------|
| M18 | Walking next to NPC triggers dialogue |
| M19 | Portrait image loads |
| M20 | Dialogue choices appear and are clickable |
| M21 | Choice effects apply (stat buffs, messages, healing) |

### 2.5 Combat

| # | Check |
|---|-------|
| M22 | Walking into monsters initiates combat |
| M23 | Damage numbers appear in message log |
| M24 | VFX flash on hit/hurt |
| M25 | Monster death removes them from map |
| M26 | XP gained on kill |

### 2.6 Items

| # | Check |
|---|-------|
| M27 | Walking onto items picks them up |
| M28 | Inventory shows picked up items |
| M29 | Equippable items can be equipped and show stat changes |
| M30 | Consumables (potions/food) can be used and heal HP/restore hunger |

### 2.7 Floor Transitions

| # | Check |
|---|-------|
| M31 | Walking onto stairs (`>`) transitions to next floor |
| M32 | New floor's intro slides appear |
| M33 | Player stats/inventory/equipment carry over |
| M34 | Checkpoint save is created on floors with `hasCheckpoint: true` |

### 2.8 Death / Checkpoint

| # | Check |
|---|-------|
| M35 | Dying shows "You have fallen..." message |
| M36 | After 1.5s, checkpoint reloads with full state |
| M37 | Player is back at the checkpoint floor, not at floor 1 |

### 2.9 Mini-Boss Victory (The Butcher, Floor 2)

| # | Check |
|---|-------|
| M38 | Killing The Butcher triggers a full-screen victory popup |
| M39 | Victory popup shows art, narrative text, and item drop |
| M40 | Item is added to inventory |
| M41 | Lore is unlocked (viewable from Story Hub) |
| M42 | Victory popup does NOT re-appear if you reload the floor |

### 2.10 Chapter Boss Defeat (The Sleeper, Floor 4 / The Architect, Floor 8)

| # | Check |
|---|-------|
| M43 | Killing chapter boss triggers chapter completion screen |
| M44 | Completion screen shows boss defeat dialogue, rewards list, victory art |
| M45 | Rewards (gold, skill points) are applied |
| M46 | Lore entries are unlocked |
| M47 | Clicking "Continue" returns to Story Hub |
| M48 | Completed chapter is marked in Story Hub |
| M49 | Completion screen does NOT appear again on reload |

### 2.11 Chapter End (Stairs on Boss Floor)

| # | Check |
|---|-------|
| M50 | If boss is alive, stepping on stairs shows "cannot leave" message |
| M51 | If boss is dead, stepping on stairs triggers chapter completion |

### 2.12 Story Hub

| # | Check |
|---|-------|
| M52 | New Campaign button works |
| M53 | Continue button loads checkpoint correctly |
| M54 | Completed chapters shown with checkmark |
| M55 | Lore entries viewable with art |
| M56 | Delete save works |

### 2.13 Title Screen

| # | Check |
|---|-------|
| M57 | No "Story Mode" button visible on the main title screen |
| M58 | Story Mode accessible only via debug menu or `?debug` URL |

---

## 3. Art Style Verification

| # | Check |
|---|-------|
| A1 | All generated art matches the pixel art style (use `https://i.imgur.com/PRiO50h.png` as reference) |
| A2 | Images are widescreen 16:9 landscape |
| A3 | Dark palette with neon highlights (teal, purple, amber) |
| A4 | Heavy pixel dithering, bold outlines |
| A5 | No photorealistic or cartoon elements |

---

## 4. Running the Tests

### Automated (headless)
```bash
npx tsx --import ./tests/node-polyfill.ts tests/story-mode-verify.ts
```
Expected: `1395 passed, 0 failed`

### Manual (browser)
```
http://localhost:3333/?debug
```
Click `[ Story Mode ]` in the debug panel. Use `__storyGodMode()` and `__storyRevealMap()` in the console for faster testing.

---

## 5. When to Run

- **Before every deploy** — run the automated suite
- **After adding a new chapter** — run automated + manual for the new chapter
- **After changing storyEngine.ts** — run full automated suite
- **After generating new art** — run automated (checks file existence + no repeats)
- **After modifying Game.tsx story handlers** — full manual checklist

---

*Last updated: April 2026*
