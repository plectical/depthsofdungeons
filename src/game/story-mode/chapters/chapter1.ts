import type { ChapterDef } from '../campaignTypes';

/**
 * Chapter 1: The Descent
 * A short introductory chapter (4 floors + boss) set in the Stone Depths.
 * Introduces core RPG mechanics: NPCs, skill checks, room events, and a boss fight.
 */
export const CHAPTER_1: ChapterDef = {
  id: 'ch1_the_descent',
  name: 'The Descent',
  description: 'Rumors speak of an ancient evil stirring beneath the mountain. You are sent to investigate the abandoned mines — but nothing could prepare you for what waits below.',
  color: '#cc8844',
  icon: '⛏',
  requiredChapters: [],
  floors: [
    // ── FLOOR 1: The Abandoned Mine ──
    {
      floorIndex: 1,
      zone: 'stone_depths',
      hasCheckpoint: true,
      narrativeIntro: 'The mine entrance looms before you — a gaping maw of darkness cut into the mountainside. Rusted cart tracks disappear into the gloom. The air smells of damp stone and something else... something old.',
      encounters: [
        {
          id: 'ch1_f1_hidden_cache',
          type: 'hidden_cache',
          description: 'A section of the mine wall looks recently disturbed. Loose stones are piled unnaturally.',
          primarySkill: 'awareness',
          target: 7,
          successDescription: 'You spot a hidden alcove behind the stones — a miner\'s emergency stash, untouched for decades.',
          successReward: { type: 'item', value: 'Health Potion' },
          failureDescription: 'You poke at the stones but find nothing. Probably just a collapsed section.',
        },
      ],
      npcs: [
        {
          id: 'ch1_old_miner',
          name: 'Gristle',
          char: 'G',
          color: '#cc9966',
          dialogue: {
            text: '"You\'re heading down there? Hah. I was the last one to come back up alive, thirty years ago. The tunnels... they\'ve changed. They breathe now. Here — take this. You\'ll need light more than courage where you\'re going."',
            choices: [
              {
                label: 'Accept the lantern',
                responseText: '"Smart. Follow the old cart tracks on the first two levels. After that... the tracks end where the miners stopped digging. And whatever killed them started."',
                effects: [
                  { type: 'item', itemName: 'Torch' },
                  { type: 'message', text: 'Gristle hands you a battered lantern.', color: '#ffcc44' },
                ],
              },
              {
                label: 'Ask what killed the miners',
                responseText: '"We never saw it clearly. Just... shadows that moved wrong. Sounds from below that no pick or drill ever made. Foreman said it was gas. Foreman was a liar. Foreman was also the first to die."',
                effects: [
                  { type: 'message', text: 'A chill runs down your spine.', color: '#8888cc' },
                ],
              },
            ],
          },
          setsFlag: { key: 'met_gristle', value: 'true' },
        },
      ],
      roomEvents: [
        {
          id: 'ch1_f1_collapsed_tunnel',
          type: 'trap_chamber',
          name: 'Unstable Ceiling',
          description: 'Cracks spider-web across the ceiling above. Pebbles rain down with each step.',
          primarySkill: 'athletics',
          alternateSkill: 'awareness',
          baseDifficulty: 7,
          criticalSuccess: {
            description: 'You sprint through the danger zone with perfect timing, spotting a hidden passage in the process.',
            effects: [{ type: 'reveal_secret', message: 'You discover a shortcut!' }],
          },
          success: {
            description: 'You move carefully through the unstable section without incident.',
            effects: [],
          },
          partial: {
            description: 'A chunk of stone clips your shoulder as you rush through.',
            effects: [{ type: 'damage', value: 3, message: 'Rocks strike you!' }],
          },
          failure: {
            description: 'The ceiling partially collapses! You\'re battered by falling stone.',
            effects: [{ type: 'damage', value: 6, message: 'The ceiling caves in on you!' }],
          },
          criticalFailure: {
            description: 'A massive section of ceiling comes down. You barely survive, buried waist-deep in rubble.',
            effects: [{ type: 'damage', value: 10, message: 'Catastrophic cave-in!' }],
          },
        },
      ],
      monsters: [
        { name: 'Cave Rat', char: 'r', color: '#aa8866', stats: { hp: 8, maxHp: 8, attack: 2, defense: 0, speed: 12 }, xpValue: 3, lootChance: 0.2, count: 4 },
        { name: 'Giant Spider', char: 'S', color: '#774488', stats: { hp: 12, maxHp: 12, attack: 3, defense: 1, speed: 10 }, xpValue: 5, lootChance: 0.3, count: 2 },
      ],
      items: [
        { name: 'Bread', type: 'food', char: '%', color: '#cc9944', value: 5, description: 'A stale but edible loaf.', count: 2 },
        { name: 'Health Potion', type: 'potion', char: '!', color: '#ff4444', value: 15, description: 'Restores 15 HP.', count: 1 },
      ],
    },

    // ── FLOOR 2: The Flooded Tunnels ──
    {
      floorIndex: 2,
      zone: 'stone_depths',
      hasCheckpoint: true,
      narrativeIntro: 'The tunnels slope downward into standing water. Your boots splash through ankle-deep pools that reflect your torchlight like black mirrors. Something moves beneath the surface.',
      encounters: [
        {
          id: 'ch1_f2_submerged_chest',
          type: 'skill_challenge',
          description: 'A wooden chest sits half-submerged in murky water. The lock is rusted but might still hold.',
          primarySkill: 'survival',
          alternateSkill: 'athletics',
          target: 8,
          successDescription: 'You pry the chest open carefully, avoiding the corroded trap mechanism inside.',
          successReward: { type: 'gold', value: 25 },
          failureDescription: 'The chest crumbles apart in the water. Whatever was inside is long gone.',
          failurePenalty: { type: 'damage', value: 2 },
        },
        {
          id: 'ch1_f2_strange_markings',
          type: 'hidden_cache',
          description: 'Strange symbols are scratched into the tunnel wall — not miner\'s marks. Something older.',
          primarySkill: 'lore',
          target: 8,
          successDescription: 'You recognize the script — ancient Deepfolk warnings. "Do not wake the sleeper." Behind the marked stone, you find an offering cache.',
          successReward: { type: 'item', value: 'Scroll of Light' },
          failureDescription: 'The symbols are illegible to you. Probably superstitious nonsense.',
        },
      ],
      npcs: [
        {
          id: 'ch1_wounded_explorer',
          name: 'Sera',
          char: 'S',
          color: '#88ccff',
          dialogue: {
            text: '"Thank the gods — another person. I came down here looking for the old Deepfolk ruins. Found them. Also found what guards them. My leg is broken... I can\'t go further. But I mapped the tunnels. Take my notes — they\'ll show you safe paths through the next level."',
            choices: [
              {
                label: 'Take her notes and offer food',
                responseText: '"You\'re kind. Most adventurers would have just taken the notes. The creature that got me — it was tall, thin, and moved like smoke. It didn\'t attack. It just... watched. Then the floor gave out beneath me. Be careful."',
                effects: [
                  { type: 'statBuff', stat: 'speed', amount: 2 },
                  { type: 'message', text: 'Sera\'s map notes reveal shortcuts ahead. +2 Speed for this chapter.', color: '#44ccff' },
                ],
              },
              {
                label: 'Ask about the Deepfolk ruins',
                responseText: '"They were here long before humans. Built downward, always downward. The architecture gets stranger the deeper you go — rooms that shouldn\'t fit, corridors that curve in directions that hurt to look at. Whatever the Deepfolk were... they weren\'t like us."',
                effects: [
                  { type: 'message', text: 'You gain valuable knowledge about what lies ahead.', color: '#cc88ff' },
                ],
              },
            ],
          },
          setsFlag: { key: 'met_sera', value: 'true' },
        },
      ],
      roomEvents: [],
      monsters: [
        { name: 'Tunnel Crawler', char: 'c', color: '#669966', stats: { hp: 14, maxHp: 14, attack: 4, defense: 1, speed: 8 }, xpValue: 6, lootChance: 0.25, count: 3 },
        { name: 'Drowned Skeleton', char: 's', color: '#ddddaa', stats: { hp: 10, maxHp: 10, attack: 3, defense: 2, speed: 6 }, xpValue: 5, lootChance: 0.3, count: 3 },
      ],
      items: [
        { name: 'Rusty Sword', type: 'weapon', char: '/', color: '#aa8866', value: 12, description: 'Corroded but functional.', statBonus: { attack: 2 }, count: 1 },
        { name: 'Bread', type: 'food', char: '%', color: '#cc9944', value: 5, description: 'A stale but edible loaf.', count: 1 },
        { name: 'Health Potion', type: 'potion', char: '!', color: '#ff4444', value: 15, description: 'Restores 15 HP.', count: 2 },
      ],
    },

    // ── FLOOR 3: The Deepfolk Ruins ──
    {
      floorIndex: 3,
      zone: 'stone_depths',
      hasCheckpoint: true,
      narrativeIntro: 'The rough mine tunnels give way to carved stone — impossibly smooth walls covered in geometric patterns that seem to shift in your peripheral vision. You\'ve found the Deepfolk ruins. The air hums with a low, subsonic vibration you feel in your teeth.',
      encounters: [
        {
          id: 'ch1_f3_ancient_puzzle',
          type: 'negotiation',
          description: 'A stone door blocks the path, covered in rotating glyph discs. The mechanism is clearly a lock — but the symbols are alien.',
          primarySkill: 'lore',
          alternateSkill: 'awareness',
          target: 9,
          successDescription: 'You work the glyphs methodically. With a deep grinding sound, the door slides open, revealing a hidden treasure chamber.',
          successReward: { type: 'item', value: 'Iron Shield' },
          failureDescription: 'The glyphs resist your attempts. You\'ll have to find another way around.',
        },
        {
          id: 'ch1_f3_trapped_corridor',
          type: 'trapped_room',
          description: 'The floor tiles ahead are pressure-sensitive — you can see faint seams between them. A dart trap, most likely.',
          primarySkill: 'stealth',
          alternateSkill: 'athletics',
          target: 8,
          successDescription: 'You navigate the pressure plates with careful, precise steps. Not a single dart fires.',
          successReward: { type: 'heal', value: 0 },
          failureDescription: 'A tile clicks beneath your foot. Darts whistle from the walls.',
          failurePenalty: { type: 'damage', value: 8 },
        },
      ],
      npcs: [],
      roomEvents: [
        {
          id: 'ch1_f3_ancient_altar',
          type: 'ancient_altar',
          name: 'Deepfolk Shrine',
          description: 'A stone altar carved with spiraling patterns radiates faint warmth. Offering bowls sit empty before a faceless idol.',
          primarySkill: 'lore',
          alternateSkill: 'diplomacy',
          baseDifficulty: 9,
          criticalSuccess: {
            description: 'You perform the correct ritual gesture. The idol\'s eyes glow — ancient power flows through you.',
            effects: [
              { type: 'stat_buff', value: 3, target: 'attack', duration: 99, message: 'The Deepfolk bless your weapon. +3 Attack!' },
            ],
          },
          success: {
            description: 'The altar acknowledges your respect. A warm light heals your wounds.',
            effects: [{ type: 'heal', value: 20, message: 'The shrine heals you.' }],
          },
          partial: {
            description: 'The altar pulses briefly but nothing happens. You feel watched.',
            effects: [],
          },
          failure: {
            description: 'You touch the altar incorrectly. A shock of cold energy jolts through you.',
            effects: [{ type: 'damage', value: 5, message: 'The shrine punishes your ignorance.' }],
          },
          criticalFailure: {
            description: 'The idol\'s empty face twists into a snarl. Dark energy blasts you backward.',
            effects: [{ type: 'damage', value: 12, message: 'The Deepfolk curse strikes you!' }],
          },
        },
      ],
      monsters: [
        { name: 'Stone Sentinel', char: 'S', color: '#888866', stats: { hp: 20, maxHp: 20, attack: 5, defense: 3, speed: 5 }, xpValue: 10, lootChance: 0.4, count: 2 },
        { name: 'Shadow Wisp', char: 'w', color: '#8888cc', stats: { hp: 8, maxHp: 8, attack: 6, defense: 0, speed: 14 }, xpValue: 8, lootChance: 0.2, count: 3 },
        { name: 'Deepfolk Remnant', char: 'D', color: '#6622aa', stats: { hp: 16, maxHp: 16, attack: 5, defense: 2, speed: 9 }, xpValue: 9, lootChance: 0.35, count: 2 },
      ],
      items: [
        { name: 'Ancient Ring', type: 'ring', char: '=', color: '#ffd700', value: 30, rarity: 'uncommon', description: 'A ring carved from a single piece of stone. It pulses with faint warmth.', statBonus: { defense: 2, attack: 1 }, count: 1 },
        { name: 'Health Potion', type: 'potion', char: '!', color: '#ff4444', value: 15, description: 'Restores 15 HP.', count: 2 },
        { name: 'Dried Meat', type: 'food', char: '%', color: '#aa6633', value: 8, description: 'Tough but nourishing.', count: 2 },
      ],
    },

    // ── FLOOR 4: The Sleeper's Chamber (Boss Floor) ──
    {
      floorIndex: 4,
      zone: 'stone_depths',
      hasCheckpoint: true,
      narrativeIntro: 'The ruins open into a vast natural cavern. In the center, suspended in a web of crystallized stone, something massive and ancient shifts in its millennia-long sleep. The subsonic hum is deafening now — you can feel it in your bones. This is what the miners disturbed. This is what Gristle ran from. The Sleeper is waking.',
      encounters: [],
      npcs: [],
      roomEvents: [],
      monsters: [
        { name: 'Sleeper Tendril', char: 't', color: '#6622aa', stats: { hp: 12, maxHp: 12, attack: 4, defense: 1, speed: 11 }, xpValue: 7, lootChance: 0.1, count: 4 },
      ],
      items: [
        { name: 'Health Potion', type: 'potion', char: '!', color: '#ff4444', value: 15, description: 'Restores 15 HP.', count: 3 },
        { name: 'Bread', type: 'food', char: '%', color: '#cc9944', value: 5, description: 'A stale but edible loaf.', count: 2 },
      ],
    },
  ],
  boss: {
    name: 'The Sleeper',
    title: 'Ancient Deepfolk Horror',
    char: 'S',
    color: '#aa44ff',
    stats: { hp: 80, maxHp: 80, attack: 8, defense: 4, speed: 7 },
    xpValue: 50,
    bossAbility: {
      type: 'multi',
      abilities: [
        { type: 'summon', monsterName: 'Sleeper Tendril', count: 2, cooldown: 4 },
        { type: 'aoe', damage: 6, radius: 2, cooldown: 3 },
      ],
    },
    element: 'dark',
    introDialogue: 'The crystalline web shatters. The Sleeper unfolds — a mass of pale flesh and too many limbs, eyes opening across its surface like wounds. Each eye fixes on you. A voice that is not a voice reverberates through the stone itself:\n\n"WHO DISTURBS THE DREAMING?"',
    defeatDialogue: 'The Sleeper shudders, its countless eyes dimming one by one. The subsonic hum fades to silence. As the ancient horror collapses, the crystal formations around the chamber begin to glow — centuries of stored energy releasing all at once. The ruins tremble.\n\nYou need to get out. Now.\n\nBut as you turn to flee, you notice something in the rubble where the Sleeper fell: a passage. Leading further down. The Deepfolk built deeper than anyone knew.\n\nThis is not the bottom. This is only the beginning.',
  },
  rewards: [
    { type: 'gold', value: 100, description: '100 gold from the Sleeper\'s hoard' },
    { type: 'skill_points', value: 3, description: '3 skill points' },
    { type: 'unlock_chapter', value: 'ch2_deeper_still', description: 'Chapter 2: Deeper Still' },
  ],
};
