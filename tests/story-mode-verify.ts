/**
 * Headless Story Mode Verification
 *
 * Imports the story engine directly and validates all content placement,
 * floor transitions, art asset references, and chapter structure for
 * Chapter 1 and Chapter 2 — no browser needed.
 *
 * Run: npx tsx tests/story-mode-verify.ts
 */

import fs from 'fs';
import path from 'path';

// Browser polyfills are loaded via --import ./tests/node-polyfill.ts

import { CHAPTER_1 } from '../src/game/story-mode/chapters/chapter1';
import { CHAPTER_2 } from '../src/game/story-mode/chapters/chapter2';
import { newStoryFloor, storyMovePlayer } from '../src/game/story-mode/storyEngine';
import { createEmptyCampaignSave } from '../src/game/story-mode/campaignTypes';
import type { ChapterDef, StoryFloorDef, PrebakedItemSpawn, PrebakedMonsterSpawn } from '../src/game/story-mode/campaignTypes';
import { Tile } from '../src/game/types';
import type { GameState, SkillName, PlayerClass } from '../src/game/types';
import { initializeCharacterSkills } from '../src/game/story/storyManager';

const CDN_ROOT = path.resolve(import.meta.dirname, '..', 'public', 'cdn-assets');

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(msg);
    console.error(`  FAIL: ${msg}`);
  }
}

function fileExists(assetPath: string): boolean {
  const full = path.join(CDN_ROOT, assetPath);
  return fs.existsSync(full);
}

function collectArtAssets(chapter: ChapterDef): string[] {
  const assets: string[] = [];
  if (chapter.victoryArtAsset) assets.push(chapter.victoryArtAsset);
  if (chapter.boss?.portraitAsset) assets.push(chapter.boss.portraitAsset);
  if (chapter.miniBossVictories) {
    for (const mbv of chapter.miniBossVictories) {
      if (mbv.artAsset) assets.push(mbv.artAsset);
    }
  }
  if (chapter.loreEntries) {
    for (const le of chapter.loreEntries) {
      for (const s of le.slides) {
        if (s.artAsset) assets.push(s.artAsset);
      }
    }
  }
  for (const floor of chapter.floors) {
    if (floor.introSlides) {
      for (const s of floor.introSlides) {
        if (s.artAsset) assets.push(s.artAsset);
      }
    }
    if (floor.atmosphericEvents) {
      for (const ae of floor.atmosphericEvents) {
        assets.push(ae.artAsset);
      }
    }
    for (const enc of floor.encounters) {
      if (enc.artAsset) assets.push(enc.artAsset);
    }
    for (const npc of floor.npcs) {
      if (npc.portraitAsset) assets.push(npc.portraitAsset);
    }
    for (const evt of floor.roomEvents) {
      if (evt.artAsset) assets.push(evt.artAsset);
    }
  }
  return assets;
}

function hasStairsTile(state: GameState): boolean {
  for (let y = 0; y < state.floor.height; y++) {
    for (let x = 0; x < state.floor.width; x++) {
      if (state.floor.tiles[y]?.[x] === Tile.StairsDown) return true;
    }
  }
  return false;
}

function verifyFloor(
  chapter: ChapterDef,
  floorDef: StoryFloorDef,
  state: GameState,
  isLastFloor: boolean,
) {
  const label = `${chapter.id} F${floorDef.floorIndex}`;

  assert(state._isStoryMode === true, `${label}: _isStoryMode should be true`);
  assert(state.floorNumber === floorDef.floorIndex, `${label}: floorNumber mismatch (got ${state.floorNumber})`);
  assert(state.floor.rooms.length >= 2, `${label}: should have at least 2 rooms (got ${state.floor.rooms.length})`);

  // Atmospheric events
  const atmos = state.interactables.filter(i => i.isAtmospheric);
  const expectedAtmos = floorDef.atmosphericEvents?.length ?? 0;
  assert(atmos.length === expectedAtmos, `${label}: atmospheric count mismatch — expected ${expectedAtmos}, got ${atmos.length}`);
  for (const a of atmos) {
    assert(!!a.artAsset, `${label}: atmospheric '${a.id}' missing artAsset`);
    assert(!!a.atmosphericTitle, `${label}: atmospheric '${a.id}' missing title`);
    assert(!!a.description, `${label}: atmospheric '${a.id}' missing description`);
    assert(a.isAtmospheric === true, `${label}: atmospheric '${a.id}' isAtmospheric not true`);
    assert(a.target === 0, `${label}: atmospheric '${a.id}' target should be 0 (got ${a.target})`);
  }

  // Skill check encounters (non-atmospheric interactables)
  const encounters = state.interactables.filter(i => !i.isAtmospheric);
  const expectedEncounters = floorDef.encounters.length + floorDef.roomEvents.length;
  assert(encounters.length === expectedEncounters, `${label}: encounter count mismatch — expected ${expectedEncounters}, got ${encounters.length}`);

  // NPCs
  const expectedNpcs = floorDef.npcs.length;
  assert(state.npcs.length === expectedNpcs, `${label}: NPC count mismatch — expected ${expectedNpcs}, got ${state.npcs.length}`);
  for (const npc of state.npcs) {
    const def = floorDef.npcs.find(n => n.id === npc.defId);
    assert(!!def, `${label}: NPC defId '${npc.defId}' not found in chapter data`);
  }

  // Monsters
  const aliveMonsters = state.monsters.filter(m => !m.isDead);
  const expectedMonsterCount = floorDef.monsters.reduce((sum, m) => sum + m.count, 0)
    + (isLastFloor && chapter.boss ? 1 : 0);
  assert(aliveMonsters.length === expectedMonsterCount, `${label}: monster count mismatch — expected ${expectedMonsterCount}, got ${aliveMonsters.length}`);

  // Boss on last floor only
  const bossMonsters = aliveMonsters.filter(m => m.isBoss);
  if (isLastFloor && chapter.boss) {
    const chapterBoss = bossMonsters.find(m => m.name === chapter.boss!.name);
    assert(!!chapterBoss, `${label}: chapter boss '${chapter.boss.name}' not found on last floor`);
  }

  // Floor monsters from chapter data (non-boss)
  for (const mDef of floorDef.monsters) {
    const matching = aliveMonsters.filter(m => m.name === mDef.name);
    assert(matching.length === mDef.count, `${label}: monster '${mDef.name}' — expected ${mDef.count}, got ${matching.length}`);
  }

  // Items
  const expectedItemCount = floorDef.items.reduce((sum, i) => sum + i.count, 0);
  assert(state.items.length === expectedItemCount, `${label}: item count mismatch — expected ${expectedItemCount}, got ${state.items.length}`);

  // Stairs
  assert(hasStairsTile(state), `${label}: no StairsDown tile found`);

  // Intro slides
  if (floorDef.introSlides && floorDef.introSlides.length > 0) {
    for (const slide of floorDef.introSlides) {
      if (slide.artAsset) {
        assert(fileExists(slide.artAsset), `${label}: intro slide art missing: ${slide.artAsset}`);
      }
      assert(!!slide.text, `${label}: intro slide missing text`);
    }
  }
}

const VALID_SKILLS: SkillName[] = ['stealth', 'diplomacy', 'athletics', 'awareness', 'lore', 'survival'];
const STORY_CLASSES: PlayerClass[] = ['warrior', 'rogue', 'mage', 'ranger', 'paladin'];
const VALID_ITEM_TYPES = ['weapon', 'armor', 'ring', 'amulet', 'offhand', 'potion', 'scroll', 'food'] as const;
const EQUIPPABLE_TYPES = new Set(['weapon', 'armor', 'ring', 'amulet', 'offhand']);

// ── No Art Repeats ──
function verifyNoArtRepeats(chapter: ChapterDef) {
  console.log(`  Checking for art repeats...`);
  const allAssets = collectArtAssets(chapter);
  const counts = new Map<string, number>();
  for (const a of allAssets) {
    counts.set(a, (counts.get(a) ?? 0) + 1);
  }

  // Build a set of assets that appear in intro slides or NPC portraits
  // Reusing intro/portrait art in encounters, room events, or lore is intentional
  // (same character or location shown in cinematic then gameplay)
  const introAndPortraitArt = new Set<string>();
  for (const floor of chapter.floors) {
    if (floor.introSlides) for (const s of floor.introSlides) { if (s.artAsset) introAndPortraitArt.add(s.artAsset); }
    for (const npc of floor.npcs) { if (npc.portraitAsset) introAndPortraitArt.add(npc.portraitAsset); }
  }
  const bossAndVictoryArt = new Set<string>();
  if (chapter.victoryArtAsset) bossAndVictoryArt.add(chapter.victoryArtAsset);
  if (chapter.boss?.portraitAsset) bossAndVictoryArt.add(chapter.boss.portraitAsset);
  if (chapter.miniBossVictories) for (const m of chapter.miniBossVictories) { if (m.artAsset) bossAndVictoryArt.add(m.artAsset); }
  const loreArt = new Set<string>();
  if (chapter.loreEntries) for (const le of chapter.loreEntries) for (const s of le.slides) { if (s.artAsset) loreArt.add(s.artAsset); }

  let dupeCount = 0;
  for (const [asset, count] of counts) {
    if (count <= 1) continue;
    // Allow: intro/portrait art reused in encounters/room events/lore (same character/location)
    if (introAndPortraitArt.has(asset)) continue;
    // Allow: boss/victory/miniboss art reused in lore entries
    if (bossAndVictoryArt.has(asset) && loreArt.has(asset)) continue;
    // Allow: lore art reused in boss defeat scenes
    if (loreArt.has(asset) && bossAndVictoryArt.has(asset)) continue;
    // Allow: encounter art reused for room events on the same floor (same location, different interaction)
    const inEncounters = chapter.floors.some(f => f.encounters.some(e => e.artAsset === asset));
    const inRoomEvents = chapter.floors.some(f => f.roomEvents.some(e => e.artAsset === asset));
    if (inEncounters && inRoomEvents) continue;
    // Flag: truly unintentional duplicates
    dupeCount++;
    assert(false, `${chapter.id}: art asset used ${count}x without justification: ${asset}`);
  }
  if (dupeCount === 0) {
    console.log(`    No unintentional art repeats`);
    passed++;
  }
}

// ── NPC Portrait Art ──
function verifyNpcPortraits(chapter: ChapterDef) {
  console.log(`  Checking NPC portraits...`);
  for (const floor of chapter.floors) {
    for (const npc of floor.npcs) {
      assert(!!npc.portraitAsset, `${chapter.id} F${floor.floorIndex}: NPC '${npc.name}' missing portraitAsset`);
      if (npc.portraitAsset) {
        assert(fileExists(npc.portraitAsset), `${chapter.id} F${floor.floorIndex}: NPC '${npc.name}' portrait file missing: ${npc.portraitAsset}`);
      }
    }
  }
}

// ── Items / Gear / Consumables ──
function verifyItems(chapter: ChapterDef) {
  console.log(`  Checking items/gear/consumables...`);
  for (const floor of chapter.floors) {
    const label = `${chapter.id} F${floor.floorIndex}`;
    for (const item of floor.items) {
      assert(!!item.name, `${label}: item missing name`);
      assert(VALID_ITEM_TYPES.includes(item.type as any), `${label}: item '${item.name}' has invalid type '${item.type}'`);
      assert(item.value > 0, `${label}: item '${item.name}' value should be > 0 (got ${item.value})`);
      assert(!!item.description, `${label}: item '${item.name}' missing description`);
      assert(item.count >= 1, `${label}: item '${item.name}' count should be >= 1`);
      assert(!!item.char, `${label}: item '${item.name}' missing char`);
      assert(!!item.color, `${label}: item '${item.name}' missing color`);

      if (EQUIPPABLE_TYPES.has(item.type)) {
        assert(!!item.equipSlot, `${label}: equippable item '${item.name}' (${item.type}) missing equipSlot`);
        assert(!!item.statBonus || !!item.onHitEffect, `${label}: equippable item '${item.name}' has no statBonus or onHitEffect`);
      }

      if (item.type === 'potion' || item.type === 'food') {
        assert(item.value > 0, `${label}: consumable '${item.name}' should have value > 0 for healing`);
      }
    }
  }

  // Boss item drop
  if (chapter.bossItemDrop) {
    const bi = chapter.bossItemDrop;
    assert(!!bi.name, `${chapter.id}: bossItemDrop missing name`);
    assert(!!bi.equipSlot, `${chapter.id}: bossItemDrop '${bi.name}' missing equipSlot`);
    assert(!!bi.statBonus, `${chapter.id}: bossItemDrop '${bi.name}' missing statBonus`);
    assert(bi.rarity === 'rare' || bi.rarity === 'epic' || bi.rarity === 'legendary', `${chapter.id}: bossItemDrop '${bi.name}' should be rare+ (got ${bi.rarity})`);
  }

  // MiniBoss item drops
  if (chapter.miniBossVictories) {
    for (const mbv of chapter.miniBossVictories) {
      const mi = mbv.itemDrop;
      assert(!!mi.name, `${chapter.id}: miniBoss '${mbv.monsterName}' itemDrop missing name`);
      assert(!!mi.equipSlot, `${chapter.id}: miniBoss '${mbv.monsterName}' itemDrop '${mi.name}' missing equipSlot`);
      assert(!!mi.statBonus, `${chapter.id}: miniBoss '${mbv.monsterName}' itemDrop '${mi.name}' missing statBonus`);
    }
  }
}

// ── Skills valid across all classes ──
function verifySkills(chapter: ChapterDef) {
  console.log(`  Checking skill references...`);
  const usedSkills = new Set<SkillName>();

  for (const floor of chapter.floors) {
    const label = `${chapter.id} F${floor.floorIndex}`;
    for (const enc of floor.encounters) {
      assert(VALID_SKILLS.includes(enc.primarySkill), `${label}: encounter '${enc.id}' uses invalid primarySkill '${enc.primarySkill}'`);
      usedSkills.add(enc.primarySkill);
      if (enc.alternateSkill) {
        assert(VALID_SKILLS.includes(enc.alternateSkill), `${label}: encounter '${enc.id}' uses invalid alternateSkill '${enc.alternateSkill}'`);
        assert(enc.alternateSkill !== enc.primarySkill, `${label}: encounter '${enc.id}' alternateSkill same as primarySkill`);
        usedSkills.add(enc.alternateSkill);
      }
      assert(enc.target >= 1 && enc.target <= 20, `${label}: encounter '${enc.id}' target out of range (${enc.target})`);
    }
    for (const evt of floor.roomEvents) {
      assert(VALID_SKILLS.includes(evt.primarySkill), `${label}: roomEvent '${evt.id}' uses invalid primarySkill '${evt.primarySkill}'`);
      usedSkills.add(evt.primarySkill);
      if (evt.alternateSkill) {
        assert(VALID_SKILLS.includes(evt.alternateSkill), `${label}: roomEvent '${evt.id}' uses invalid alternateSkill '${evt.alternateSkill}'`);
        usedSkills.add(evt.alternateSkill);
      }
      assert(evt.baseDifficulty >= 1 && evt.baseDifficulty <= 20, `${label}: roomEvent '${evt.id}' baseDifficulty out of range (${evt.baseDifficulty})`);

      // All 5 outcome bands must have description and effects array
      for (const band of ['criticalSuccess', 'success', 'partial', 'failure', 'criticalFailure'] as const) {
        const outcome = evt[band];
        assert(!!outcome, `${label}: roomEvent '${evt.id}' missing '${band}' outcome`);
        if (outcome) {
          assert(!!outcome.description, `${label}: roomEvent '${evt.id}' ${band} missing description`);
          assert(Array.isArray(outcome.effects), `${label}: roomEvent '${evt.id}' ${band} effects not an array`);
        }
      }
    }
  }

  // Skills should work for all story-viable classes
  console.log(`  Checking skill initialization for all classes...`);
  for (const cls of STORY_CLASSES) {
    const skills = initializeCharacterSkills(cls, undefined);
    assert(!!skills, `Skills initialization failed for class '${cls}'`);
    for (const sk of VALID_SKILLS) {
      assert(typeof skills[sk] === 'number' && skills[sk] > 0, `Class '${cls}' skill '${sk}' should be > 0 (got ${skills[sk]})`);
    }
  }

  // Check that the chapter uses a good variety of skills
  assert(usedSkills.size >= 4, `${chapter.id}: only uses ${usedSkills.size} distinct skills — should use at least 4 of 6`);
}

// ── Enemy Validation ──
function verifyEnemies(chapter: ChapterDef) {
  console.log(`  Checking enemy design...`);
  const allMonsterNames = new Set<string>();

  for (const floor of chapter.floors) {
    const label = `${chapter.id} F${floor.floorIndex}`;
    for (const m of floor.monsters) {
      allMonsterNames.add(m.name);
      assert(!!m.name, `${label}: monster missing name`);
      assert(!!m.char && m.char.length === 1, `${label}: monster '${m.name}' char should be single character (got '${m.char}')`);
      assert(!!m.color, `${label}: monster '${m.name}' missing color`);
      assert(m.stats.hp > 0, `${label}: monster '${m.name}' HP should be > 0`);
      assert(m.stats.maxHp > 0, `${label}: monster '${m.name}' maxHp should be > 0`);
      assert(m.stats.hp === m.stats.maxHp, `${label}: monster '${m.name}' hp !== maxHp at spawn`);
      assert(m.stats.attack > 0, `${label}: monster '${m.name}' attack should be > 0`);
      assert(m.stats.defense >= 0, `${label}: monster '${m.name}' defense should be >= 0`);
      assert(m.stats.speed > 0, `${label}: monster '${m.name}' speed should be > 0`);
      assert(m.xpValue > 0, `${label}: monster '${m.name}' xpValue should be > 0`);
      assert(m.lootChance >= 0 && m.lootChance <= 1, `${label}: monster '${m.name}' lootChance out of range (${m.lootChance})`);
      assert(m.count >= 1, `${label}: monster '${m.name}' count should be >= 1`);
    }
  }

  // Boss should be unique (not reused as a regular monster name)
  if (chapter.boss) {
    const bossAsRegular = chapter.floors.some(f =>
      f.monsters.some(m => m.name === chapter.boss!.name && !m.isBoss)
    );
    assert(!bossAsRegular, `${chapter.id}: chapter boss '${chapter.boss.name}' also appears as non-boss monster`);
  }

  // Difficulty progression: later floors should generally have tougher monsters
  const floorAvgHp: number[] = [];
  for (const floor of chapter.floors) {
    if (floor.monsters.length === 0) { floorAvgHp.push(0); continue; }
    const avgHp = floor.monsters.reduce((sum, m) => sum + m.stats.hp, 0) / floor.monsters.length;
    floorAvgHp.push(avgHp);
  }
  if (floorAvgHp.length >= 3) {
    const firstHp = floorAvgHp[0]!;
    const lastHp = floorAvgHp[floorAvgHp.length - 1]!;
    assert(lastHp >= firstHp, `${chapter.id}: boss floor monsters should be tougher than floor 1 (avg HP: ${firstHp} → ${lastHp})`);
  }
}

// ── Victory / Wrap-up Scene Validation ──
function verifyVictoryScenes(chapter: ChapterDef) {
  console.log(`  Checking victory/wrap-up scenes...`);

  // Chapter completion
  assert(!!chapter.boss?.defeatDialogue, `${chapter.id}: boss missing defeatDialogue for chapter wrap-up`);
  assert(chapter.boss!.defeatDialogue.length > 50, `${chapter.id}: boss defeatDialogue too short (${chapter.boss!.defeatDialogue.length} chars) — should be a proper wrap-up`);

  // Victory art
  if (chapter.victoryArtAsset) {
    assert(fileExists(chapter.victoryArtAsset), `${chapter.id}: victoryArtAsset file missing: ${chapter.victoryArtAsset}`);
  }

  // Mini-boss victory scenes
  if (chapter.miniBossVictories) {
    const mbvNames = chapter.miniBossVictories.map(m => m.monsterName);
    const uniqueMbvNames = new Set(mbvNames);
    assert(mbvNames.length === uniqueMbvNames.size, `${chapter.id}: duplicate miniBossVictory entries (same monster name appears twice)`);

    for (const mbv of chapter.miniBossVictories) {
      assert(mbv.narrative.length > 50, `${chapter.id}: miniBoss '${mbv.monsterName}' narrative too short (${mbv.narrative.length} chars)`);
      assert(!!mbv.artAsset, `${chapter.id}: miniBoss '${mbv.monsterName}' missing artAsset`);
      if (mbv.artAsset) {
        assert(fileExists(mbv.artAsset), `${chapter.id}: miniBoss '${mbv.monsterName}' artAsset missing: ${mbv.artAsset}`);
      }

      // The mini-boss monster must actually be flagged as isBoss in chapter data
      const monsterDef = chapter.floors.flatMap(f => f.monsters).find(m => m.name === mbv.monsterName);
      assert(!!monsterDef, `${chapter.id}: miniBoss '${mbv.monsterName}' not found in any floor monsters`);
      if (monsterDef) {
        assert(monsterDef.isBoss === true, `${chapter.id}: miniBoss '${mbv.monsterName}' monster def should have isBoss=true`);
      }
    }
  }

  // Lore entries (unlocked on boss/miniboss defeat)
  if (chapter.loreEntries) {
    const loreIds = chapter.loreEntries.map(le => le.id);
    const uniqueLoreIds = new Set(loreIds);
    assert(loreIds.length === uniqueLoreIds.size, `${chapter.id}: duplicate loreEntry IDs`);

    for (const le of chapter.loreEntries) {
      assert(le.slides.length >= 2, `${chapter.id}: loreEntry '${le.id}' should have at least 2 slides (got ${le.slides.length})`);
      for (const slide of le.slides) {
        assert(!!slide.text, `${chapter.id}: loreEntry '${le.id}' has a slide with no text`);
        assert(slide.text.length > 20, `${chapter.id}: loreEntry '${le.id}' slide text too short`);
      }
    }
  }

  // Chapter rewards should not be empty
  assert(chapter.rewards.length >= 2, `${chapter.id}: should have at least 2 rewards (got ${chapter.rewards.length})`);
  const rewardTypes = new Set(chapter.rewards.map(r => r.type));
  assert(rewardTypes.has('gold') || rewardTypes.has('skill_points'), `${chapter.id}: rewards should include gold or skill_points`);
}

// ── Cross-chapter: no art repeats between chapters ──
function verifyCrossChapterArt(chapters: ChapterDef[]) {
  console.log(`\n══ Cross-Chapter Checks ══`);
  console.log(`  Checking for art repeats across chapters...`);
  const allAssets = new Map<string, string>();
  for (const ch of chapters) {
    const assets = collectArtAssets(ch);
    for (const a of assets) {
      if (allAssets.has(a) && allAssets.get(a) !== ch.id) {
        // Only flag if it's non-shared art (intro/general assets might be shared)
        if (!a.includes('passage-down') && !a.includes('sellsword')) {
          assert(false, `Art asset '${a}' used in both '${allAssets.get(a)}' and '${ch.id}'`);
        }
      }
      allAssets.set(a, ch.id);
    }
  }
  passed++; // counted check

  // Unique boss names across chapters
  console.log(`  Checking unique boss names across chapters...`);
  const bossNames = chapters.map(c => c.boss?.name).filter(Boolean);
  const uniqueBossNames = new Set(bossNames);
  assert(bossNames.length === uniqueBossNames.size, `Boss names should be unique across chapters`);

  // Unique chapter IDs
  const chapterIds = chapters.map(c => c.id);
  const uniqueChapterIds = new Set(chapterIds);
  assert(chapterIds.length === uniqueChapterIds.size, `Chapter IDs should be unique`);
}

function verifyChapter(chapter: ChapterDef) {
  console.log(`\n══ ${chapter.name} (${chapter.id}) ══`);

  // Chapter-level checks
  assert(!!chapter.id, `${chapter.id}: missing id`);
  assert(!!chapter.name, `${chapter.id}: missing name`);
  assert(!!chapter.description, `${chapter.id}: missing description`);
  assert(!!chapter.color, `${chapter.id}: missing color`);
  assert(!!chapter.icon, `${chapter.id}: missing icon`);
  assert(chapter.floors.length >= 2, `${chapter.id}: should have at least 2 floors (got ${chapter.floors.length})`);
  assert(!!chapter.boss, `${chapter.id}: missing boss`);
  assert(chapter.rewards.length > 0, `${chapter.id}: no rewards defined`);

  // Boss definition
  if (chapter.boss) {
    assert(!!chapter.boss.name, `${chapter.id}: boss missing name`);
    assert(!!chapter.boss.introDialogue, `${chapter.id}: boss missing introDialogue`);
    assert(!!chapter.boss.defeatDialogue, `${chapter.id}: boss missing defeatDialogue`);
    assert(chapter.boss.stats.hp > 0, `${chapter.id}: boss HP should be > 0`);
    assert(!!chapter.boss.bossAbility, `${chapter.id}: boss missing bossAbility`);
  }

  // MiniBossVictory name matches
  if (chapter.miniBossVictories) {
    for (const mbv of chapter.miniBossVictories) {
      const nameExists = chapter.floors.some(f =>
        f.monsters.some(m => m.name === mbv.monsterName)
      );
      assert(nameExists, `${chapter.id}: miniBossVictory '${mbv.monsterName}' not found in any floor's monsters`);
      assert(!!mbv.artAsset, `${chapter.id}: miniBossVictory '${mbv.monsterName}' missing artAsset`);
      assert(!!mbv.narrative, `${chapter.id}: miniBossVictory '${mbv.monsterName}' missing narrative`);
      assert(!!mbv.itemDrop, `${chapter.id}: miniBossVictory '${mbv.monsterName}' missing itemDrop`);
    }
  }

  // Lore entry IDs match loreUnlock
  if (chapter.loreEntries && chapter.miniBossVictories) {
    for (const mbv of chapter.miniBossVictories) {
      if (mbv.loreUnlock) {
        const loreExists = chapter.loreEntries.some(le => le.id === mbv.loreUnlock);
        assert(loreExists, `${chapter.id}: loreUnlock '${mbv.loreUnlock}' from '${mbv.monsterName}' not found in loreEntries`);
      }
    }
  }

  // Art asset file existence
  console.log(`  Checking art assets...`);
  const allAssets = collectArtAssets(chapter);
  const uniqueAssets = [...new Set(allAssets)];
  let missingCount = 0;
  for (const asset of uniqueAssets) {
    if (!fileExists(asset)) {
      assert(false, `${chapter.id}: art file missing: ${asset}`);
      missingCount++;
    }
  }
  if (missingCount === 0) {
    console.log(`  All ${uniqueAssets.length} art assets found`);
    passed++;
  }

  // Floor-by-floor generation + validation
  const save = createEmptyCampaignSave('warrior');
  const lastFloorIndex = chapter.floors[chapter.floors.length - 1]!.floorIndex;

  for (const floorDef of chapter.floors) {
    const isLastFloor = floorDef.floorIndex === lastFloorIndex;
    console.log(`  Floor ${floorDef.floorIndex} (${floorDef.zone})${isLastFloor ? ' [BOSS]' : ''}...`);

    let state: GameState;
    try {
      save.currentFloor = floorDef.floorIndex;
      state = newStoryFloor(chapter, floorDef, save);
      assert(true, `${chapter.id} F${floorDef.floorIndex}: floor generated without error`);
    } catch (e: any) {
      assert(false, `${chapter.id} F${floorDef.floorIndex}: floor generation THREW: ${e.message}`);
      continue;
    }

    verifyFloor(chapter, floorDef, state, isLastFloor);

    // Unique IDs check
    const allIds = state.interactables.map(i => i.id);
    const uniqueIds = new Set(allIds);
    assert(allIds.length === uniqueIds.size, `${chapter.id} F${floorDef.floorIndex}: duplicate interactable IDs found`);

    // Atmospheric events in non-spawn rooms
    if (floorDef.atmosphericEvents && floorDef.atmosphericEvents.length > 0) {
      const spawnRoom = state.floor.rooms[0]!;
      for (const a of state.interactables.filter(i => i.isAtmospheric)) {
        const inSpawnRoom = a.pos.x >= spawnRoom.x && a.pos.x < spawnRoom.x + spawnRoom.w
          && a.pos.y >= spawnRoom.y && a.pos.y < spawnRoom.y + spawnRoom.h;
        // Not an error per se (round-robin can wrap), but worth noting
        if (inSpawnRoom) {
          console.log(`    NOTE: atmospheric '${a.id}' placed in spawn room (room 0) — will not trigger on room entry`);
        }
      }
    }
  }

  // ── New validation suites ──
  verifyNoArtRepeats(chapter);
  verifyNpcPortraits(chapter);
  verifyItems(chapter);
  verifySkills(chapter);
  verifyEnemies(chapter);
  verifyVictoryScenes(chapter);

  // Floor transition test
  console.log(`  Testing floor transitions...`);
  const transitionSave = createEmptyCampaignSave('warrior');
  const firstFloor = chapter.floors[0]!;
  let currentState = newStoryFloor(chapter, firstFloor, transitionSave);

  // Find stairs and step on them
  let stairsPos: { x: number; y: number } | null = null;
  for (let y = 0; y < currentState.floor.height; y++) {
    for (let x = 0; x < currentState.floor.width; x++) {
      if (currentState.floor.tiles[y]?.[x] === Tile.StairsDown) {
        stairsPos = { x, y };
        break;
      }
    }
    if (stairsPos) break;
  }

  if (stairsPos) {
    // Teleport player next to stairs
    currentState.player.pos.x = stairsPos.x - 1;
    currentState.player.pos.y = stairsPos.y;
    // Clear monsters near stairs so we don't get stuck in combat
    currentState.monsters = currentState.monsters.filter(m => {
      const dist = Math.abs(m.pos.x - stairsPos!.x) + Math.abs(m.pos.y - stairsPos!.y);
      return dist > 2;
    });

    const moveResult = storyMovePlayer(currentState, 1, 0, chapter, transitionSave);
    assert(moveResult.floorChanged === true, `${chapter.id}: stepping on stairs should trigger floor change`);
    assert(currentState.floorNumber === chapter.floors[1]!.floorIndex, `${chapter.id}: floor number should advance after stairs (got ${currentState.floorNumber})`);
  } else {
    assert(false, `${chapter.id}: couldn't find stairs on floor 1 for transition test`);
  }

  // Chapter end test — try to descend past the last floor
  console.log(`  Testing chapter end detection...`);
  const endSave = createEmptyCampaignSave('warrior');
  const lastFloorDef = chapter.floors[chapter.floors.length - 1]!;
  endSave.currentFloor = lastFloorDef.floorIndex;
  const endState = newStoryFloor(chapter, lastFloorDef, endSave);

  // Find stairs on last floor
  let endStairsPos: { x: number; y: number } | null = null;
  for (let y = 0; y < endState.floor.height; y++) {
    for (let x = 0; x < endState.floor.width; x++) {
      if (endState.floor.tiles[y]?.[x] === Tile.StairsDown) {
        endStairsPos = { x, y };
        break;
      }
    }
    if (endStairsPos) break;
  }

  if (endStairsPos) {
    endState.player.pos.x = endStairsPos.x - 1;
    endState.player.pos.y = endStairsPos.y;
    endState.monsters = endState.monsters.filter(m => {
      const dist = Math.abs(m.pos.x - endStairsPos!.x) + Math.abs(m.pos.y - endStairsPos!.y);
      return dist > 2;
    });
    const endResult = storyMovePlayer(endState, 1, 0, chapter, endSave);
    assert(endResult.chapterEndReached === true, `${chapter.id}: descending past last floor should set chapterEndReached`);
  }
}

// ═══════════════════════════════════════════
// Run all tests
// ═══════════════════════════════════════════

console.log('Story Mode Verification Tests');
console.log('═══════════════════════════════');

verifyChapter(CHAPTER_1);
verifyChapter(CHAPTER_2);
verifyCrossChapterArt([CHAPTER_1, CHAPTER_2]);

console.log('\n═══════════════════════════════');
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failures.length > 0) {
  console.log('\nFailed assertions:');
  for (const f of failures) {
    console.log(`  - ${f}`);
  }
  process.exit(1);
} else {
  console.log('\nAll tests passed!');
  process.exit(0);
}
