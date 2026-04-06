// ══════════════════════════════════════════════════════════════
// ROOM EVENT SYSTEM
// Random narrative encounters when entering rooms
// ══════════════════════════════════════════════════════════════

import type {
  GameState,
  RoomEventDef,
  ActiveRoomEvent,
  RoomEventBuff,
  Room,
  Pos,
  DungeonFloor,
} from './types';

// ── Room Event Pool ──
// Each event has skill checks and multiple outcome tiers

export const ROOM_EVENT_POOL: RoomEventDef[] = [
  // ── TRAP CHAMBER ──
  {
    id: 'trap_pressure_plates',
    type: 'trap_chamber',
    name: 'Pressure Plate Trap',
    description: 'The floor tiles shift slightly under your feet. Ancient mechanisms click beneath the stone.',
    artPrompt: 'A dungeon room with pressure plate floor tiles glowing with danger, mechanical trap mechanisms visible in the walls, arrows ready to fire',
    primarySkill: 'athletics',
    alternateSkill: 'awareness',
    baseDifficulty: 8,
    minFloor: 1,
    criticalSuccess: {
      description: 'You dance across the plates with perfect precision, disabling the trap mechanism and finding a hidden cache!',
      effects: [
        { type: 'gold', value: 50, message: 'Found hidden gold!' },
        { type: 'item', target: 'random_uncommon', message: 'Discovered a hidden item!' }
      ]
    },
    success: {
      description: 'You carefully navigate the pressure plates, avoiding the trap entirely.',
      effects: []
    },
    partial: {
      description: 'A dart grazes your arm as you stumble through the trap.',
      effects: [
        { type: 'damage', value: 8, message: 'Dart trap damage!' }
      ]
    },
    failure: {
      description: 'The plates trigger a barrage of darts and spinning blades!',
      effects: [
        { type: 'damage', value: 20, message: 'Severe trap damage!' }
      ]
    },
    criticalFailure: {
      description: 'You trigger every trap in the room. Darts, blades, and falling rocks assault you!',
      effects: [
        { type: 'damage', value: 35, message: 'Catastrophic trap damage!' },
        { type: 'lose_item', message: 'An item was destroyed in the chaos!' }
      ]
    }
  },

  // ── ANCIENT ALTAR ──
  {
    id: 'altar_forgotten_god',
    type: 'ancient_altar',
    name: 'Altar of the Forgotten',
    description: 'A stone altar covered in ancient runes pulses with dormant power. Offerings of long-dead adventurers lie scattered around it.',
    artPrompt: 'An ancient stone altar with glowing runes, skeletal remains around it, ethereal green mist rising, ominous presence',
    primarySkill: 'lore',
    baseDifficulty: 9,
    minFloor: 2,
    criticalSuccess: {
      description: 'You recite the ancient prayers perfectly. The forgotten god bestows a permanent blessing upon you!',
      effects: [
        { type: 'skill_bonus', target: 'lore', value: 1, message: '+1 Lore permanently!' },
        { type: 'blessing', duration: 10, message: 'Divine blessing: +2 to all stats for 10 floors!' }
      ]
    },
    success: {
      description: 'The altar accepts your reverence and grants you a temporary boon.',
      effects: [
        { type: 'stat_buff', value: 2, duration: 5, target: 'attack', message: '+2 Attack for 5 floors!' }
      ]
    },
    partial: {
      description: 'The god stirs but does not respond. The altar falls silent.',
      effects: []
    },
    failure: {
      description: 'Your mispronounced prayer angers the forgotten deity. A curse befalls you!',
      effects: [
        { type: 'stat_debuff', value: 2, duration: 5, target: 'defense', message: '-2 Defense for 5 floors!' }
      ]
    },
    criticalFailure: {
      description: 'The god awakens in fury! Your flesh warps and twists as divine punishment!',
      effects: [
        { type: 'transformation', target: 'stone_curse', message: 'You feel your skin hardening to stone...' },
        { type: 'damage', value: 15, message: 'Divine wrath!' }
      ]
    }
  },

  // ── LURKING HORROR ──
  {
    id: 'lurking_shadow',
    type: 'lurking_horror',
    name: 'Something in the Shadows',
    description: 'The shadows in this room seem to move independently. Something is watching you.',
    artPrompt: 'Dark dungeon room with menacing shadows that have glowing eyes, creature lurking in darkness, tense atmosphere',
    primarySkill: 'stealth',
    alternateSkill: 'awareness',
    baseDifficulty: 8,
    minFloor: 1,
    criticalSuccess: {
      description: 'You spot the creature first and strike from the shadows! It dies before it can react.',
      effects: [
        { type: 'gold', value: 30, message: 'Looted the creature!' }
      ]
    },
    success: {
      description: 'You slip past the creature unnoticed, leaving it hunting shadows.',
      effects: []
    },
    partial: {
      description: 'The creature spots you but you manage to wound it before it can fully attack.',
      effects: [
        { type: 'spawn_enemy', target: 'wounded_shade', message: 'A wounded shade attacks!' }
      ]
    },
    failure: {
      description: 'The creature ambushes you from the darkness!',
      effects: [
        { type: 'spawn_enemy', target: 'shadow_stalker', message: 'Shadow Stalker attacks!' },
        { type: 'damage', value: 10, message: 'Ambush damage!' }
      ]
    },
    criticalFailure: {
      description: 'Multiple creatures emerge from every shadow! You are surrounded!',
      effects: [
        { type: 'spawn_elite', target: 'shadow_lord', message: 'Shadow Lord appears!' },
        { type: 'damage', value: 15, message: 'Severe ambush!' }
      ]
    }
  },

  // ── MERCHANT SPIRIT ──
  {
    id: 'ghost_merchant',
    type: 'merchant_spirit',
    name: 'The Spectral Merchant',
    description: 'A ghostly figure materializes, ancient coins floating around it. "Trade... trade with the dead..."',
    artPrompt: 'Ghostly merchant spirit with floating coins and ethereal wares, spectral shop in dungeon, mysterious trader',
    primarySkill: 'diplomacy',
    baseDifficulty: 7,
    minFloor: 2,
    criticalSuccess: {
      description: 'The spirit is impressed by your silver tongue. It offers you its finest wares at incredible prices!',
      effects: [
        { type: 'open_vendor', target: 'legendary_shop', message: 'Legendary items available!' },
        { type: 'gold', value: 100, message: 'The spirit gives you a gift!' }
      ]
    },
    success: {
      description: 'The merchant spirit agrees to trade with you.',
      effects: [
        { type: 'open_vendor', target: 'rare_shop', message: 'Rare items available!' }
      ]
    },
    partial: {
      description: 'The spirit is wary but offers limited wares.',
      effects: [
        { type: 'open_vendor', target: 'common_shop', message: 'Basic items available.' }
      ]
    },
    failure: {
      description: '"You insult me with your words!" The spirit vanishes, taking any potential deals with it.',
      effects: []
    },
    criticalFailure: {
      description: '"THIEF! LIAR!" The enraged spirit curses you and steals your gold!',
      effects: [
        { type: 'gold', value: -50, message: 'Gold stolen by the spirit!' },
        { type: 'curse', duration: 5, message: 'Merchant\'s Curse: -20% shop prices for 5 floors!' }
      ]
    }
  },

  // ── SECRET PASSAGE ──
  {
    id: 'hidden_door',
    type: 'secret_passage',
    name: 'Suspicious Wall',
    description: 'One section of the wall seems slightly different. The mortar is newer, the stones arranged oddly.',
    artPrompt: 'Dungeon wall with hidden door partially revealed, secret passage, ancient stonework with concealed entrance',
    primarySkill: 'awareness',
    alternateSkill: 'lore',
    baseDifficulty: 9,
    minFloor: 1,
    criticalSuccess: {
      description: 'You discover a hidden vault! Ancient treasures lie within!',
      effects: [
        { type: 'gold', value: 150, message: 'Treasure vault discovered!' },
        { type: 'item', target: 'random_rare', message: 'Found a rare item!' },
        { type: 'item', target: 'random_uncommon', message: 'Found another item!' }
      ]
    },
    success: {
      description: 'The wall slides open, revealing a hidden chamber with supplies.',
      effects: [
        { type: 'gold', value: 40, message: 'Found hidden gold!' },
        { type: 'heal', value: 20, message: 'Found healing supplies!' }
      ]
    },
    partial: {
      description: 'You find a small cache hidden in a loose brick.',
      effects: [
        { type: 'gold', value: 15, message: 'Found some gold!' }
      ]
    },
    failure: {
      description: 'It was just a wall after all. You wasted time searching.',
      effects: []
    },
    criticalFailure: {
      description: 'You trigger a hidden trap while searching! Poison gas fills the area!',
      effects: [
        { type: 'damage', value: 15, message: 'Poison trap!' },
        { type: 'stat_debuff', value: 3, duration: 3, target: 'speed', message: 'Poisoned: -3 Speed!' }
      ]
    }
  },

  // ── CURSED ARTIFACT ──
  {
    id: 'cursed_weapon',
    type: 'cursed_artifact',
    name: 'The Whispering Blade',
    description: 'A beautiful weapon rests on a pedestal, its surface covered in writhing shadow runes. It whispers promises of power.',
    artPrompt: 'Cursed weapon on pedestal with dark energy swirling, shadow runes glowing, tempting but dangerous artifact',
    primarySkill: 'lore',
    alternateSkill: 'awareness',
    baseDifficulty: 10,
    minFloor: 4,
    criticalSuccess: {
      description: 'You understand the curse perfectly and purify the weapon! Its true power is yours!',
      effects: [
        { type: 'item', target: 'legendary_weapon', message: 'Obtained purified legendary weapon!' }
      ]
    },
    success: {
      description: 'You safely claim the weapon, its curse held at bay by your knowledge.',
      effects: [
        { type: 'item', target: 'rare_weapon', message: 'Obtained rare weapon!' }
      ]
    },
    partial: {
      description: 'You take the weapon but feel its dark influence. It grants power at a cost.',
      effects: [
        { type: 'item', target: 'cursed_weapon', message: 'Obtained cursed weapon!' },
        { type: 'stat_debuff', value: 1, duration: 10, target: 'defense', message: 'Curse: -1 Defense' }
      ]
    },
    failure: {
      description: 'The weapon\'s curse lashes out! Dark energy sears your flesh!',
      effects: [
        { type: 'damage', value: 25, message: 'Cursed artifact damage!' },
        { type: 'curse', duration: 5, message: 'Minor curse afflicts you!' }
      ]
    },
    criticalFailure: {
      description: 'The weapon\'s darkness floods into you! Your very form begins to change!',
      effects: [
        { type: 'transformation', target: 'spectral_curse', message: 'You feel yourself becoming incorporeal...' },
        { type: 'damage', value: 30, message: 'Overwhelming dark energy!' }
      ]
    }
  },

  // ── MONSTER NEST ──
  {
    id: 'spider_nest',
    type: 'monster_nest',
    name: 'Webbed Chamber',
    description: 'Thick webs cover everything. Egg sacs hang from the ceiling, and something large moves in the shadows.',
    artPrompt: 'Spider nest in dungeon with webs everywhere, egg sacs, giant spider lurking, creepy atmosphere',
    primarySkill: 'survival',
    alternateSkill: 'stealth',
    baseDifficulty: 8,
    minFloor: 2,
    criticalSuccess: {
      description: 'You burn the nest while the spiders sleep! Treasure from past victims is yours!',
      effects: [
        { type: 'gold', value: 60, message: 'Looted the nest!' },
        { type: 'item', target: 'random_uncommon', message: 'Found victim\'s belongings!' }
      ]
    },
    success: {
      description: 'You carefully clear the nest without waking the inhabitants.',
      effects: [
        { type: 'gold', value: 20, message: 'Salvaged some valuables.' }
      ]
    },
    partial: {
      description: 'You disturb the nest. A single spider attacks!',
      effects: [
        { type: 'spawn_enemy', target: 'giant_spider', message: 'Giant Spider attacks!' }
      ]
    },
    failure: {
      description: 'The nest awakens! Spiders swarm from every direction!',
      effects: [
        { type: 'spawn_enemy', target: 'spider_swarm', message: 'Spider swarm attacks!' },
        { type: 'spawn_enemy', target: 'giant_spider', message: 'Giant Spider attacks!' }
      ]
    },
    criticalFailure: {
      description: 'The Spider Queen descends from above! You have desecrated her domain!',
      effects: [
        { type: 'spawn_elite', target: 'spider_queen', message: 'Spider Queen attacks!' },
        { type: 'damage', value: 10, message: 'Venomous bite!' }
      ]
    }
  },

  // ── RITUAL CIRCLE ──
  {
    id: 'transformation_circle',
    type: 'ritual_circle',
    name: 'Circle of Becoming',
    description: 'Arcane symbols glow on the floor, forming a circle of transformation. Power flows from an altar at its center.',
    artPrompt: 'Magical ritual circle with glowing runes, transformation altar, ethereal energy swirling, mystical atmosphere',
    primarySkill: 'lore',
    alternateSkill: 'diplomacy',
    baseDifficulty: 10,
    minFloor: 5,
    criticalSuccess: {
      description: 'You master the ritual completely! Choose your transformation wisely, with full control!',
      effects: [
        { type: 'transformation', target: 'ogre_curse', message: 'You embrace the ogre transformation!' },
        { type: 'stat_buff', value: 5, duration: 10, target: 'maxHp', message: 'Ritual blessing: +5 Max HP!' }
      ]
    },
    success: {
      description: 'You channel the ritual safely, gaining a temporary boost of power.',
      effects: [
        { type: 'stat_buff', value: 3, duration: 5, target: 'attack', message: 'Ritual power: +3 Attack!' },
        { type: 'stat_buff', value: 3, duration: 5, target: 'defense', message: 'Ritual power: +3 Defense!' }
      ]
    },
    partial: {
      description: 'The ritual partially succeeds. Some power, but unstable.',
      effects: [
        { type: 'stat_buff', value: 2, duration: 3, target: 'attack', message: 'Unstable power: +2 Attack!' }
      ]
    },
    failure: {
      description: 'The ritual backfires! Chaotic energy assaults your mind!',
      effects: [
        { type: 'damage', value: 20, message: 'Ritual backlash!' },
        { type: 'stat_debuff', value: 2, duration: 5, target: 'awareness', message: 'Confused: -2 Awareness!' }
      ]
    },
    criticalFailure: {
      description: 'The ritual goes catastrophically wrong! Your body twists into a monstrous form!',
      effects: [
        { type: 'transformation', target: 'ogre_curse', message: 'You transform into an Ogre! Cannot equip gear!' },
        { type: 'damage', value: 15, message: 'Painful transformation!' }
      ]
    }
  },

  // ── MYSTIC FOUNTAIN ──
  {
    id: 'glowing_fountain',
    type: 'mystic_fountain',
    name: 'Fountain of Mysteries',
    description: 'A stone fountain fills with glowing liquid. The water shifts between colors, each promising different effects.',
    artPrompt: 'Magical fountain with glowing multicolored water, mystical pool in dungeon, ethereal mist rising',
    primarySkill: 'lore',
    alternateSkill: 'survival',
    baseDifficulty: 7,
    minFloor: 1,
    criticalSuccess: {
      description: 'You identify the perfect moment to drink! The fountain grants a powerful blessing!',
      effects: [
        { type: 'heal', value: 50, message: 'Fully restored!' },
        { type: 'blessing', duration: 10, message: 'Fountain\'s Gift: Regenerate 2 HP per turn!' }
      ]
    },
    success: {
      description: 'The fountain\'s water heals your wounds and refreshes your spirit.',
      effects: [
        { type: 'heal', value: 30, message: 'Healing waters!' }
      ]
    },
    partial: {
      description: 'The water has a strange taste but seems to help somewhat.',
      effects: [
        { type: 'heal', value: 10, message: 'Minor healing.' }
      ]
    },
    failure: {
      description: 'The water turns bitter! It was poisoned!',
      effects: [
        { type: 'damage', value: 15, message: 'Poisoned water!' }
      ]
    },
    criticalFailure: {
      description: 'The fountain was a trap! Acidic liquid burns your throat and skin!',
      effects: [
        { type: 'damage', value: 30, message: 'Acid burns!' },
        { type: 'stat_debuff', value: 2, duration: 5, target: 'maxHp', message: 'Scarred: -2 Max HP!' }
      ]
    }
  },

  // ── TREASURE VAULT ──
  {
    id: 'sealed_vault',
    type: 'treasure_vault',
    name: 'The Sealed Vault',
    description: 'A massive stone door blocks a vault. The mechanism requires raw strength and endurance to operate.',
    artPrompt: 'Ancient treasure vault door with heavy mechanism, treasure visible through cracks, physical challenge',
    primarySkill: 'athletics',
    baseDifficulty: 9,
    minFloor: 3,
    criticalSuccess: {
      description: 'With a mighty heave, you tear the door from its hinges! The vault is yours!',
      effects: [
        { type: 'gold', value: 200, message: 'Massive treasure hoard!' },
        { type: 'item', target: 'random_rare', message: 'Found rare equipment!' },
        { type: 'skill_bonus', target: 'athletics', value: 1, message: '+1 Athletics permanently!' }
      ]
    },
    success: {
      description: 'The mechanism yields to your strength. The vault opens!',
      effects: [
        { type: 'gold', value: 80, message: 'Vault treasure!' },
        { type: 'item', target: 'random_uncommon', message: 'Found equipment!' }
      ]
    },
    partial: {
      description: 'You manage to crack the door open slightly. Some coins spill out.',
      effects: [
        { type: 'gold', value: 25, message: 'Partial vault access!' }
      ]
    },
    failure: {
      description: 'The mechanism is too heavy. You strain yourself trying.',
      effects: [
        { type: 'damage', value: 10, message: 'Strained yourself!' }
      ]
    },
    criticalFailure: {
      description: 'The mechanism snaps back! You are crushed against the wall!',
      effects: [
        { type: 'damage', value: 30, message: 'Crushed by mechanism!' },
        { type: 'stat_debuff', value: 3, duration: 3, target: 'athletics', message: 'Injured: -3 Athletics!' }
      ]
    }
  },

  // ── COLLAPSING FLOOR ──
  {
    id: 'unstable_floor',
    type: 'collapsing_floor',
    name: 'Crumbling Stone',
    description: 'Cracks spread across the floor as you enter. The room is unstable!',
    artPrompt: 'Dungeon room with cracking floor, debris falling, unstable ground, dangerous pit below',
    primarySkill: 'athletics',
    alternateSkill: 'awareness',
    baseDifficulty: 8,
    minFloor: 2,
    criticalSuccess: {
      description: 'You leap to safety and notice treasure in the rubble below!',
      effects: [
        { type: 'gold', value: 40, message: 'Found treasure in the rubble!' }
      ]
    },
    success: {
      description: 'You dash across before the floor collapses entirely.',
      effects: []
    },
    partial: {
      description: 'You stumble and scrape yourself but make it across.',
      effects: [
        { type: 'damage', value: 8, message: 'Minor fall damage!' }
      ]
    },
    failure: {
      description: 'You fall through the floor! Rocks batter you as you tumble!',
      effects: [
        { type: 'damage', value: 20, message: 'Fall damage!' },
        { type: 'teleport', message: 'Teleported to random location!' }
      ]
    },
    criticalFailure: {
      description: 'The entire room collapses! You are buried in debris!',
      effects: [
        { type: 'damage', value: 35, message: 'Severe fall damage!' },
        { type: 'teleport', message: 'Teleported to random location!' },
        { type: 'lose_item', message: 'Lost an item in the collapse!' }
      ]
    }
  },

  // ── WANDERING SOUL ──
  {
    id: 'lost_spirit',
    type: 'wandering_soul',
    name: 'The Lost Adventurer',
    description: 'A ghostly figure of a fallen adventurer appears. "Help me... find peace..."',
    artPrompt: 'Ghost of fallen adventurer with sad expression, spectral form, dungeon background, melancholic atmosphere',
    primarySkill: 'diplomacy',
    alternateSkill: 'lore',
    baseDifficulty: 7,
    minFloor: 1,
    criticalSuccess: {
      description: 'You help the spirit find peace. In gratitude, it bestows its knowledge and treasures upon you!',
      effects: [
        { type: 'skill_bonus', target: 'diplomacy', value: 1, message: '+1 Diplomacy permanently!' },
        { type: 'gold', value: 75, message: 'Spirit\'s treasure!' },
        { type: 'blessing', duration: 5, message: 'Spirit Guide: +2 Awareness for 5 floors!' }
      ]
    },
    success: {
      description: 'The spirit shares valuable information before fading away peacefully.',
      effects: [
        { type: 'gold', value: 30, message: 'Spirit\'s gift!' },
        { type: 'heal', value: 15, message: 'Spiritual blessing!' }
      ]
    },
    partial: {
      description: 'The spirit is confused but calms somewhat. It offers a small token.',
      effects: [
        { type: 'gold', value: 10, message: 'Small offering.' }
      ]
    },
    failure: {
      description: 'You fail to connect with the spirit. It wails in anguish and vanishes.',
      effects: []
    },
    criticalFailure: {
      description: 'Your words enrage the spirit! It attacks in a frenzy of despair!',
      effects: [
        { type: 'spawn_enemy', target: 'vengeful_spirit', message: 'Vengeful Spirit attacks!' },
        { type: 'damage', value: 10, message: 'Spiritual assault!' }
      ]
    }
  },

  // ══════════════════════════════════════════════════════════════
  // FACTION-THEMED EVENTS
  // These appear more often when the patron matches the faction
  // ══════════════════════════════════════════════════════════════

  // ── GOBLIN FACTION ──
  {
    id: 'goblin_cache',
    type: 'secret_passage',
    name: 'Goblin Stash',
    description: 'A hidden goblin cache! The markings suggest your patron\'s kin left supplies here.',
    artPrompt: 'Hidden goblin treasure stash with gold coins and crude weapons, goblin marks on walls',
    primarySkill: 'awareness',
    baseDifficulty: 6,
    minFloor: 1,
    factionId: 'goblin',
    criticalSuccess: {
      description: 'You find a secret compartment with the best loot! Your patron\'s influence is clear.',
      effects: [
        { type: 'gold', value: 80, message: 'Goblin treasure hoard!' },
        { type: 'item', target: 'random_uncommon', message: 'Found goblin-crafted gear!' }
      ]
    },
    success: {
      description: 'The goblins left supplies for their friends. You qualify.',
      effects: [
        { type: 'gold', value: 40, message: 'Found goblin gold!' }
      ]
    },
    partial: {
      description: 'Only scraps remain, but better than nothing.',
      effects: [
        { type: 'gold', value: 15, message: 'Found some coins.' }
      ]
    },
    failure: {
      description: 'The cache is empty. Someone got here first.',
      effects: []
    },
    criticalFailure: {
      description: 'A trap! The goblins don\'t like thieves!',
      effects: [
        { type: 'damage', value: 15, message: 'Goblin trap!' }
      ]
    }
  },

  // ── UNDEAD FACTION ──
  {
    id: 'spirit_blessing',
    type: 'ancient_altar',
    name: 'Whispering Bones',
    description: 'The bones of fallen adventurers whisper secrets. If you listen carefully...',
    artPrompt: 'Pile of ancient bones with ghostly wisps rising, whispering spirits in dungeon',
    primarySkill: 'lore',
    alternateSkill: 'diplomacy',
    baseDifficulty: 7,
    minFloor: 2,
    factionId: 'undead',
    criticalSuccess: {
      description: 'The spirits recognize a kindred soul. They share ancient knowledge and power!',
      effects: [
        { type: 'skill_bonus', target: 'lore', value: 1, message: '+1 Lore from spirit knowledge!' },
        { type: 'heal', value: 20, message: 'Spectral healing!' }
      ]
    },
    success: {
      description: 'The spirits share a glimpse of their memories. You feel wiser.',
      effects: [
        { type: 'stat_buff', value: 2, duration: 5, target: 'lore', message: '+2 Lore for 5 floors!' }
      ]
    },
    partial: {
      description: 'Faint whispers, mostly unintelligible. But you catch a warning.',
      effects: []
    },
    failure: {
      description: 'The spirits are silent. Or perhaps you cannot hear them yet.',
      effects: []
    },
    criticalFailure: {
      description: 'You disturbed their rest! Cold fury washes over you!',
      effects: [
        { type: 'damage', value: 20, message: 'Spectral wrath!' },
        { type: 'stat_debuff', value: 2, duration: 3, target: 'lore', message: 'Mind clouded!' }
      ]
    }
  },

  // ── DEMON FACTION ──
  {
    id: 'infernal_bargain',
    type: 'ritual_circle',
    name: 'Infernal Contract',
    description: 'Flames flicker in a summoning circle. A voice offers power... for a price.',
    artPrompt: 'Demonic summoning circle with flames and contract scroll, dark bargain atmosphere',
    primarySkill: 'diplomacy',
    alternateSkill: 'lore',
    baseDifficulty: 9,
    minFloor: 4,
    factionId: 'demon',
    criticalSuccess: {
      description: 'You negotiate masterfully! Power without strings attached!',
      effects: [
        { type: 'stat_buff', value: 5, duration: 10, target: 'attack', message: 'Infernal might: +5 Attack!' },
        { type: 'gold', value: 50, message: 'Demon gold!' }
      ]
    },
    success: {
      description: 'A fair deal is struck. Power flows into you.',
      effects: [
        { type: 'stat_buff', value: 3, duration: 5, target: 'attack', message: '+3 Attack for 5 floors!' }
      ]
    },
    partial: {
      description: 'The demon offers a lesser gift. Take it or leave it.',
      effects: [
        { type: 'stat_buff', value: 2, duration: 3, target: 'attack', message: 'Minor infernal boost!' }
      ]
    },
    failure: {
      description: 'The demon laughs and vanishes. No deal today.',
      effects: []
    },
    criticalFailure: {
      description: 'You signed something you shouldn\'t have! Burning pain courses through you!',
      effects: [
        { type: 'damage', value: 25, message: 'Contract burned into your soul!' },
        { type: 'curse', duration: 5, message: 'Demonic curse: -2 Defense!' }
      ]
    }
  },

  // ── BEAST FACTION ──
  {
    id: 'primal_den',
    type: 'monster_nest',
    name: 'Primal Den',
    description: 'The scent of wild beasts fills this chamber. Something watches from the shadows.',
    artPrompt: 'Beast den with glowing eyes in darkness, primal atmosphere, bones scattered around',
    primarySkill: 'survival',
    alternateSkill: 'stealth',
    baseDifficulty: 7,
    minFloor: 2,
    factionId: 'beast',
    criticalSuccess: {
      description: 'The alpha recognizes your connection to the wild. You are kin!',
      effects: [
        { type: 'skill_bonus', target: 'survival', value: 1, message: '+1 Survival from primal bond!' },
        { type: 'blessing', duration: 5, message: 'Pack blessing: +3 Speed!' }
      ]
    },
    success: {
      description: 'You move through the den safely. The beasts accept your presence.',
      effects: [
        { type: 'stat_buff', value: 2, duration: 5, target: 'speed', message: 'Primal agility!' }
      ]
    },
    partial: {
      description: 'The beasts let you pass, but barely. You feel their eyes on you.',
      effects: []
    },
    failure: {
      description: 'A warning growl. You retreat quickly.',
      effects: [
        { type: 'damage', value: 10, message: 'Claw swipe!' }
      ]
    },
    criticalFailure: {
      description: 'The pack attacks! You are prey!',
      effects: [
        { type: 'spawn_enemy', target: 'alpha_beast', message: 'Alpha Beast attacks!' },
        { type: 'damage', value: 15, message: 'Pack assault!' }
      ]
    }
  }
];

// ── Helper Functions ──

export function getRoomAtPosition(floor: DungeonFloor, pos: Pos): Room | null {
  return floor.rooms.find(r => 
    pos.x >= r.x && pos.x < r.x + r.w &&
    pos.y >= r.y && pos.y < r.y + r.h
  ) ?? null;
}

export function getRoomId(room: Room): string {
  return `room_${room.x}_${room.y}_${room.w}_${room.h}`;
}

export function hasVisitedRoom(state: GameState, roomId: string): boolean {
  return state.visitedRoomIds?.includes(roomId) ?? false;
}

export function markRoomVisited(state: GameState, roomId: string): void {
  if (!state.visitedRoomIds) {
    state.visitedRoomIds = [];
  }
  if (!state.visitedRoomIds.includes(roomId)) {
    state.visitedRoomIds.push(roomId);
  }
}

// ── Two-Tier Art Cache ──
// Tier 1: Local session cache (fast, per-session)
// Tier 2: Content pool via generateRoomEventArt (shared, cross-player)
// When art is needed: check local cache → if miss, fetch from pool/generate → cache locally

const roomEventArtCache: Map<string, string> = new Map();
let isGeneratingBackground = false;
let backgroundGenerationQueue: RoomEventDef[] = [];

export function getRoomEventArtFromCache(eventId: string): string | null {
  const cached = roomEventArtCache.get(eventId);
  if (cached) {
    console.log(`[RoomEvent] Art cache HIT for ${eventId} (local session cache)`);
  }
  return cached ?? null;
}

export function cacheRoomEventArt(eventId: string, artUrl: string): void {
  roomEventArtCache.set(eventId, artUrl);
  console.log(`[RoomEvent] Cached art for ${eventId}, total cached: ${roomEventArtCache.size} (session cache + pool synced)`);
}

export function getPoolCacheStats(): { localCacheSize: number; eventIds: string[] } {
  return {
    localCacheSize: roomEventArtCache.size,
    eventIds: Array.from(roomEventArtCache.keys())
  };
}

export function getEligibleEventsForFloor(floorNumber: number): RoomEventDef[] {
  return ROOM_EVENT_POOL.filter(event => {
    if (event.minFloor > floorNumber) return false;
    if (event.maxFloor && event.maxFloor < floorNumber) return false;
    return true;
  });
}

export function getUncachedEvents(events: RoomEventDef[]): RoomEventDef[] {
  return events.filter(event => !roomEventArtCache.has(event.id));
}

export function startBackgroundArtGeneration(
  floorNumber: number,
  generateArt: (eventName: string, artPrompt: string) => Promise<string | null>
): void {
  // Get events that don't have cached art yet
  const eligibleEvents = getEligibleEventsForFloor(floorNumber);
  const uncachedEvents = getUncachedEvents(eligibleEvents);
  
  if (uncachedEvents.length === 0) {
    console.log('[RoomEvent] All eligible events have cached art');
    return;
  }
  
  // Pick 2-3 random events to pre-generate
  const eventsToGenerate = uncachedEvents
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  
  backgroundGenerationQueue.push(...eventsToGenerate);
  
  if (!isGeneratingBackground) {
    processBackgroundQueue(generateArt);
  }
}

async function processBackgroundQueue(
  generateArt: (eventName: string, artPrompt: string) => Promise<string | null>
): Promise<void> {
  if (backgroundGenerationQueue.length === 0) {
    isGeneratingBackground = false;
    return;
  }
  
  isGeneratingBackground = true;
  
  while (backgroundGenerationQueue.length > 0) {
    const event = backgroundGenerationQueue.shift()!;
    
    // Skip if already cached (might have been generated on-demand)
    if (roomEventArtCache.has(event.id)) {
      continue;
    }
    
    console.log(`[RoomEvent] Background generating art for: ${event.name}`);
    
    try {
      const artUrl = await generateArt(event.name, event.artPrompt);
      if (artUrl) {
        roomEventArtCache.set(event.id, artUrl);
        console.log(`[RoomEvent] Background art ready for: ${event.name}`);
      }
    } catch (err) {
      console.warn(`[RoomEvent] Background art generation failed for ${event.name}:`, err);
    }
    
    // Small delay between generations to not overwhelm the API
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  isGeneratingBackground = false;
}

// ── Event Selection ──

export function shouldTriggerRoomEvent(state: GameState): boolean {
  // Base 25% chance, +2% per point of Awareness above 10
  const awareness = state.skills?.awareness ?? 10;
  const awarenessBonus = Math.max(0, (awareness - 10) * 2);
  const chance = 25 + awarenessBonus;
  
  const roll = Math.random() * 100;
  console.log(`[RoomEvent] Roll: ${roll.toFixed(1)} vs ${chance}% chance`);
  return roll < chance;
}

export function selectRoomEvent(state: GameState): RoomEventDef | null {
  const floorNumber = state.floorNumber;
  const patronFaction = state.runPatron?.factionId;
  
  // Filter events by floor requirements
  const eligibleEvents = ROOM_EVENT_POOL.filter(event => {
    if (event.minFloor > floorNumber) return false;
    if (event.maxFloor && event.maxFloor < floorNumber) return false;
    return true;
  });
  
  if (eligibleEvents.length === 0) {
    console.warn('[RoomEvent] No eligible events for floor', floorNumber);
    return null;
  }
  
  // Weight events - patron faction events get 3x weight
  const weightedEvents: { event: RoomEventDef; weight: number }[] = eligibleEvents.map(event => ({
    event,
    weight: event.factionId === patronFaction ? 3 : 1
  }));
  
  const totalWeight = weightedEvents.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;
  
  for (const { event, weight } of weightedEvents) {
    roll -= weight;
    if (roll <= 0) {
      if (event.factionId === patronFaction) {
        console.log('[RoomEvent] Selected patron-themed event:', event.name);
      }
      return event;
    }
  }
  
  // Fallback (shouldn't happen)
  return eligibleEvents[0] ?? null;
}

export function checkForRoomEvent(state: GameState, room: Room): ActiveRoomEvent | null {
  const roomId = getRoomId(room);
  
  // Already visited this room
  if (hasVisitedRoom(state, roomId)) {
    return null;
  }
  
  // Mark as visited regardless of event trigger
  markRoomVisited(state, roomId);
  
  // Roll for event
  if (!shouldTriggerRoomEvent(state)) {
    console.log('[RoomEvent] No event triggered for room', roomId);
    return null;
  }
  
  // Select an event
  const event = selectRoomEvent(state);
  if (!event) {
    return null;
  }
  
  console.log('[RoomEvent] Event triggered:', event.name, 'in room', roomId);
  
  return {
    eventId: event.id,
    event,
    roomId,
    resolved: false
  };
}

// ── Buff Management ──

export function addRoomEventBuff(
  state: GameState, 
  name: string, 
  description: string,
  statModifiers: Partial<typeof state.player.stats>,
  duration: number,
  isDebuff: boolean
): void {
  if (!state.roomEventBuffs) {
    state.roomEventBuffs = [];
  }
  
  const buff: RoomEventBuff = {
    id: `buff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    statModifiers,
    floorsRemaining: duration,
    isDebuff
  };
  
  state.roomEventBuffs.push(buff);
  console.log('[RoomEvent] Added buff:', buff.name, 'for', duration, 'floors');
}

export function tickRoomEventBuffs(state: GameState): void {
  if (!state.roomEventBuffs || state.roomEventBuffs.length === 0) return;
  
  // Decrement duration and remove expired buffs
  state.roomEventBuffs = state.roomEventBuffs.filter(buff => {
    buff.floorsRemaining--;
    if (buff.floorsRemaining <= 0) {
      console.log('[RoomEvent] Buff expired:', buff.name);
      state.messages.push({
        text: `${buff.isDebuff ? 'Curse' : 'Blessing'} "${buff.name}" has worn off.`,
        color: buff.isDebuff ? '#44ff44' : '#ffcc44',
        turn: state.turn
      });
      return false;
    }
    return true;
  });
}

export function getRoomEventStatModifiers(state: GameState): Partial<typeof state.player.stats> {
  if (!state.roomEventBuffs || state.roomEventBuffs.length === 0) {
    return {};
  }
  
  const combined: Partial<typeof state.player.stats> = {};
  
  for (const buff of state.roomEventBuffs) {
    for (const [stat, value] of Object.entries(buff.statModifiers)) {
      const key = stat as keyof typeof combined;
      combined[key] = (combined[key] ?? 0) + (value ?? 0);
    }
  }
  
  return combined;
}
