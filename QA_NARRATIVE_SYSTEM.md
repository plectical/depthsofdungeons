# QA Test Plan: Generative Narrative System

## Overview
This document outlines the QA plan for testing the new generative narrative system in Depths of Dungeon, including character skills, story dialogues, encounters, and AI-generated content.

---

## 1. Unit Tests (Code-Level)

### 1.1 Character Skills System (`characterSkills.ts`)
| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| SK-01 | `rollCharacterSkills()` generates valid skill values | All 6 skills between 3-18 |
| SK-02 | `getSkillModifier()` returns correct modifiers | 3-6→-2, 7-9→-1, 10-12→0, 13-15→+1, 16-18→+2 |
| SK-03 | `performSkillCheck()` with target 10, modifier +2 | Success on roll 8+, partial on 6-7 |
| SK-04 | `getGearSkillBonus()` sums equipped item bonuses | Returns sum of all `skillBonus` fields |
| SK-05 | `meetsSkillThreshold()` correctly gates content | Returns true only if effective skill >= threshold |

### 1.2 Content Cache (`contentCache.ts`)
| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| CC-01 | `createEmptyCache()` initializes all batch keys | 4 batches: floors_1_3, floors_4_6, floors_7_9, floors_10_plus |
| CC-02 | `getCacheKeyForFloor(5)` returns correct key | Returns 'floors_4_6' |
| CC-03 | `updateBatchContent()` merges content correctly | Existing + new content merged |
| CC-04 | `getRandomEncounter()` returns floor-appropriate content | Encounter from correct floor range |

### 1.3 Validation (`validation.ts`)
| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| VL-01 | `validateCharacter()` rejects blocked content | Returns `{ valid: false }` for profanity |
| VL-02 | `validateEncounter()` checks reward balance | Rejects gold > 100 on floor 1 |
| VL-03 | `sanitizeText()` removes dangerous patterns | Strips script tags, excessive symbols |

### 1.4 Story Manager (`storyManager.ts`)
| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| SM-01 | `initializeStoryState()` creates valid state | Empty arrays, null arc, index 0 |
| SM-02 | `updateRelationship()` clamps to -50/+50 | Never exceeds bounds |
| SM-03 | `getRelationshipTier()` maps values correctly | 30+→allied, 15+→friendly, 0+→neutral |
| SM-04 | `checkStoryTriggers()` matches floor_enter | Returns beat on matching floor |

---

## 2. Integration Tests

### 2.1 Game Engine Integration
| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| EI-01 | `newGame()` initializes skills on state | `state.skills` has all 6 skill values |
| EI-02 | `newGame()` initializes story state | `state.runStory` is valid object |
| EI-03 | `descend()` checks for story triggers | `pendingStoryDialogue` set if beat exists |
| EI-04 | Content cache attached to game state | `state.contentCache` is initialized |

### 2.2 UI Integration
| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| UI-01 | Generation loading screen appears on game start | Portal renders with progress bar |
| UI-02 | Loading screen dismisses after generation | Screen hidden, game visible |
| UI-03 | Story dialogue opens when beat triggers | `StoryDialogue` component renders |
| UI-04 | Skill check modal shows dice animation | Dice faces cycle before settling |
| UI-05 | Dialogue choices respect skill requirements | Locked choices are grayed out |

---

## 3. Functional Tests (Browser)

### 3.1 New Game Flow
| Test ID | Steps | Expected Result |
|---------|-------|-----------------|
| NG-01 | 1. Launch game 2. Select Warrior 3. Select Stone Depths | Loading screen appears |
| NG-02 | Wait for loading to complete | Game screen renders with player |
| NG-03 | Check player stats in HUD | HP, ATK, DEF visible |
| NG-04 | Open character info (if available) | Skills section shows 6 skills |

### 3.2 Story Dialogue
| Test ID | Steps | Expected Result |
|---------|-------|-----------------|
| SD-01 | Trigger floor descent to floor with story beat | Dialogue modal appears |
| SD-02 | Read dialogue text | Character name, portrait char, dialogue visible |
| SD-03 | Select choice with skill check | Skill check modal appears |
| SD-04 | Complete skill check | Outcome displayed, dialogue continues |
| SD-05 | Complete dialogue | Modal closes, game resumes |

### 3.3 Encounter System
| Test ID | Steps | Expected Result |
|---------|-------|-----------------|
| EN-01 | Move near encounter position | Discovery message (if Awareness high enough) |
| EN-02 | Interact with discovered encounter | Skill options presented |
| EN-03 | Pass skill check on encounter | Rewards applied (gold, HP, etc.) |
| EN-04 | Fail skill check on encounter | Penalties applied (damage, gold loss) |

### 3.4 Fallback Content
| Test ID | Steps | Expected Result |
|---------|-------|-----------------|
| FB-01 | Start game with AI disabled/offline | Game starts with fallback content |
| FB-02 | Check characters available | Gnash, Elder Mira, The Collector present |
| FB-03 | Check encounters on floor | Fallback encounters spawn |
| FB-04 | Check items on floor | Fallback items available |

---

## 4. Performance Tests

| Test ID | Description | Target |
|---------|-------------|--------|
| PF-01 | Generation loading time (first wave) | < 8 seconds |
| PF-02 | Background generation doesn't block gameplay | No frame drops during play |
| PF-03 | Memory usage with content cache | < 10MB additional |
| PF-04 | Dialogue modal render time | < 100ms |

---

## 5. Edge Cases

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| EC-01 | Player dies during story dialogue | Dialogue closes, death screen appears |
| EC-02 | Generation timeout (8s) reached | Game starts with fallback content |
| EC-03 | All dialogue choices locked by skill | At least one "fallback" choice available |
| EC-04 | Relationship at max (+50) | Further increases clamped |
| EC-05 | Rapid floor descent | Background generation keeps up |

---

## 6. Regression Tests

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| RG-01 | Existing NPC dialogues still work | NPCDialogue functions unchanged |
| RG-02 | Mercenary hire still works | MercenaryHire functions unchanged |
| RG-03 | Shop functionality unchanged | Shop purchases work correctly |
| RG-04 | Auto-play mode still works | AI plays game without errors |
| RG-05 | Bloodline save/load works | Story data persists across sessions |

---

## Test Execution Checklist

- [x] All unit tests pass
- [x] Integration tests pass
- [x] Browser functional tests pass (partial - see notes)
- [ ] Performance targets met
- [x] Edge cases handled gracefully
- [x] No regressions in existing features (after fix)
- [ ] Mobile web tested
- [ ] Multiple browsers tested (Chrome, Safari, Firefox)

---

## Test Execution Results (2026-04-03)

### Issues Found and Fixed:

1. **Missing Export (FIXED)**
   - `FALLBACK_CHARACTERS` was not exported from `fallbackContent.ts`
   - Fixed by adding `export` keyword

2. **cloneState Missing Story Fields (FIXED)**
   - `utils.ts` `cloneState()` didn't handle new story fields
   - Caused "Cannot read properties of undefined (reading 'map')" error
   - Fixed by adding cloning for: `skills`, `runStory`, `contentCache`, `hiddenElements`, `interactables`, `pendingStoryDialogue`

3. **Series AI Requires Deployment**
   - Expected: AI generation requires API key only available in deployed environment
   - Fallback content works correctly when AI unavailable
   - Console shows: "An API key is required for a chat completion request when developing locally"

4. **Story Beats Need Floor Triggers (FIXED)**
   - Added fallback story beats for Elder Mira (Floor 2) and Gnash (Floor 4)
   - Includes dialogue trees with skill checks

---

## Test Execution Results (2026-04-08)

### New Features Added:

1. **A/B Testing System**
   - Users randomly assigned to `classic` or `narrative` variant (50/50)
   - Persisted in localStorage, tagged in all analytics events
   - Debug controls to force variants

2. **Generated Class Intro NPC**
   - On Floor 1 of narrative mode with generated class
   - Shows character name, symbol, lore, ability
   - Only one intro NPC (no duplicates)

3. **Auto-Export Content Pool**
   - When pool reaches 100 entries, auto-exports to IndexedDB
   - Local cache used first, no more 429/limit errors
   - Fully automatic, no manual intervention

4. **Parallel Generation**
   - Character + encounters + items generate simultaneously
   - Portrait + quest generate in background (non-blocking)
   - Reduced upfront generation (0 encounters/items on floor 1)

5. **Game Mode Analytics**
   - `game_mode` field on all events: classic, narrative, generated_class, narrative_generated
   - `game_mode_start` event for D1 retention tracking

6. **AI Model Configuration**
   - Text: Claude Haiku (fast)
   - Images: Nano Banana Pro (1K resolution)

### Tests Passed (2026-04-08):

| Test | Result | Notes |
|------|--------|-------|
| Game loads without errors | PASS | After fixes |
| Character skills initialized | PASS | Skills on GameState |
| Story state initialized | PASS | runStory on GameState |
| Content cache initialized | PASS | contentCache on GameState |
| Fallback content loads | PASS | When AI unavailable |
| Auto-play functions | PASS | After cloneState fix |
| Combat mechanics work | PASS | Tested on Floors 1-3 |
| Floor descent works | PASS | Tested Floor 1→2→3 |
| Generated class resource regen | PASS | on_kill, on_hit, on_move, on_damage_taken |
| Generated class intro NPC | PASS | Shows on Floor 1 narrative |
| A/B test variant assignment | PASS | Persisted in localStorage |
| Content pool auto-export | PASS | Triggers on pool full |
| Parallel generation | PASS | Portrait/quest in background |

### Tests Pending:

| Test | Status | Notes |
|------|--------|-------|
| D1 retention by A/B variant | PENDING | Requires time to collect data |
| Generated class abilities | PARTIAL | Needs more testing |
| Full narrative run | PENDING | End-to-end with AI content |

---

## 7. New Test Cases (2026-04-08)

### 7.1 A/B Testing
| Test ID | Steps | Expected Result |
|---------|-------|-----------------|
| AB-01 | Fresh user loads game | Assigned to classic or narrative variant |
| AB-02 | Check localStorage for `ab_test_variants` | Contains `narrative_vs_classic` assignment |
| AB-03 | All analytics events | Include `ab_narrative_vs_classic` field |
| AB-04 | Debug menu: force variant | Variant changes after refresh |

### 7.2 Generated Class
| Test ID | Steps | Expected Result |
|---------|-------|-----------------|
| GC-01 | Debug menu: Gen Class | Opens generative class select screen |
| GC-02 | Roll new class | AI generates class with unique abilities |
| GC-03 | Select and play | Game starts with generated class |
| GC-04 | Floor 1 intro NPC | Shows generated character as NPC |
| GC-05 | Use generated ability | Resource consumed, effect applied |
| GC-06 | Share class | Copies base64 code to clipboard |
| GC-07 | Import class | Loads shared class successfully |

### 7.3 Content Pool
| Test ID | Steps | Expected Result |
|---------|-------|-----------------|
| CP-01 | Generate portrait | Portrait URL returned or cached |
| CP-02 | Pool full (100 entries) | Auto-export triggers to IndexedDB |
| CP-03 | After auto-export | Content served from local cache |
| CP-04 | getPoolStats() | Shows localCacheCount, poolFull status |

### 7.4 Performance
| Test ID | Description | Target |
|---------|-------------|--------|
| PF-05 | Game start time (narrative mode) | < 5 seconds to playable |
| PF-06 | Floor 1 uses fallback content | Instant (no AI delay) |
| PF-07 | Portrait generates in background | No blocking after game starts |

---

## Known Limitations

1. AI generation requires Series SDK backend to be available
2. Content pool capped at 100 entries (platform limit)
3. Browser automation blocked by RUN.game App Integrity check
4. Generated class abilities may need balance tuning

---

## Test Environment

- **Browser**: Chrome 120+, Safari 17+, Firefox 120+
- **Device**: Desktop and mobile viewport
- **Network**: Online (for AI) and offline (for fallback testing)
- **Build**: Development build with source maps
- **URL**: https://omw.run/u/TnwiXCIVrrnLXVcED65D/development
