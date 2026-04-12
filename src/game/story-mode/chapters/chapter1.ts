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
      introSlides: [
        {
          title: 'The Sellsword',
          text: 'You are a sellsword. Blades and blood are your trade. The guild halls know your name — not for glory, but for results. You take the jobs no one else will. The ones that smell like death before you even saddle your horse.',
          artAsset: 'story/story-sellsword.png',
        },
        {
          title: 'Grimhollow',
          text: 'For thirty years, the Grimhollow Mining Company pulled wealth from the mountain. Green-veined shadowstone — rare, valuable, and seemingly endless. The town grew fat on it. Miners bought houses. The Foreman, Aldric Voss, bought himself a manor.',
          artAsset: 'story/story-grimhollow-prosperous.png',
        },
        {
          title: 'The Greed',
          text: 'When the shallow veins ran dry, Voss ordered them to dig deeper. The miners protested — the old tunnels felt wrong. Workers went missing. Two in the first month. Five the next. Voss called them deserters, docked their families\' pay, and sent the next shift down. The ore kept coming. The money was too good to stop.',
          artAsset: 'story/story-foreman.png',
        },
        {
          title: 'The Silence',
          text: 'Three weeks ago the ore shipments stopped entirely. Then the messengers stopped returning. The guild sent three adventurers to investigate — none reported back. Now they\'re offering 500 gold, triple the usual rate. The mine entrance looms ahead, and the silence from within is deafening.',
          artAsset: 'story/story-descent.png',
        },
      ],
      roomMessages: [
        'The walls are scratched with tally marks... someone was counting days.',
        'A pickaxe lies abandoned mid-swing, embedded in the rock face.',
        'Empty lunch pails are stacked neatly by the wall. No one came back for them.',
        'A faded sign reads: "SHAFT 7 — DEEP SECTION — AUTHORIZED ONLY"',
        'You find a payroll notice: "All miners — overtime is mandatory until quota is met. — Foreman Voss"',
        'Chalk on the wall reads: "COBB IF YOU SEE THIS GO HOME. DONT GO DEEPER."',
        'A framed "Employee of the Month" photo hangs crooked. The glass is cracked.',
        'Mining helmets hang in a row on hooks. Eight hooks. Five helmets missing.',
      ],
      encounters: [
        {
          id: 'ch1_f1_hidden_cache',
          type: 'hidden_cache',
          artAsset: 'story/story-hidden-cache.png',
          description: 'A section of the mine wall looks recently disturbed. Loose stones are piled unnaturally.',
          primarySkill: 'awareness',
          target: 7,
          successDescription: 'You spot a hidden alcove behind the stones — a miner\'s emergency stash, untouched for decades.',
          successReward: { type: 'item', value: 'Health Potion' },
          failureDescription: 'You poke at the stones but find nothing. Probably just a collapsed section.',
        },
        {
          id: 'ch1_f1_dead_miner',
          type: 'hidden_cache',
          artAsset: 'story/story-dead-miner.png',
          description: 'A miner lies collapsed against broken support beams, his face twisted in terror. His mining helmet has rolled away, and a leather satchel still hangs from his belt. Whatever killed him, he saw it coming.',
          primarySkill: 'survival',
          target: 6,
          successDescription: 'You search the satchel and find rations and a crumpled note: "They come from below. Don\'t go past Shaft 7."',
          successReward: { type: 'item', value: 'Bread' },
          failureDescription: 'The satchel is stuck under him. You can\'t free it without disturbing the body further.',
        },
        {
          id: 'ch1_f1_foreman_office',
          type: 'skill_challenge',
          artAsset: 'story/story-foreman-office.png',
          description: 'The Foreman\'s office. A heavy oak desk dominates the room. Papers are scattered everywhere. On the wall behind, "MISSING" posters for seven miners. A ledger lies open — the last entry reads: "Nov: 0 tons. All operations suspended. Going down personally to assess."',
          primarySkill: 'lore',
          alternateSkill: 'awareness',
          target: 6,
          successDescription: 'You read through Voss\'s private notes. He knew about the disappearances for months. He was falsifying safety reports to keep the mine open. One note reads: "If we stop now, the investors pull out. I\'ll lose everything." You find a key to the supply lockbox.',
          successReward: { type: 'item', value: 'Health Potion' },
          failureDescription: 'The papers are water-damaged and hard to read. You can make out numbers declining month over month, but the details are lost.',
        },
      ],
      npcs: [
        {
          id: 'ch1_old_miner',
          name: 'Gristle',
          char: 'G',
          color: '#cc9966',
          portraitAsset: 'story/story-gristle-portrait.png',
          dialogue: {
            text: '"Another sellsword. How much they payin\' you? Five hundred? Hah. They offered me fifty to go back down. Fifty. I worked that mine for twenty-two years under Foreman Voss.\n\nI was there when we broke through into the old tunnels. The ones that were already there before we started digging. Voss didn\'t care — the shadowstone in those walls was worth ten times the surface veins. He just kept sending men down."',
            choices: [
              {
                label: 'What happened to the miners?',
                responseText: '"They disappeared. One by one at first, then whole shifts. Voss told the families they\'d deserted. But I found Cobb\'s helmet in Shaft 7. Just the helmet. No blood, no body. Just... the helmet, sitting upright in the middle of the tunnel like someone placed it there as a joke.\n\nBig Harmon — strongest man in the crew — he went down to find his brother. Came back different. Wouldn\'t speak. Just stared at walls and muttered about \'the breathing.\' Week later he went back down with his pickaxe. Never came back up. But we could hear him. At night. Dragging that pickaxe through the tunnels."',
                effects: [
                  { type: 'message', text: 'Gristle\'s eye glazes over with old fear.', color: '#8888cc' },
                ],
              },
              {
                label: 'What about Foreman Voss?',
                responseText: '"Voss? That greedy bastard. Even after we lost a dozen men he kept the mine open. \'The shareholders expect results,\' he\'d say, counting his gold rings while men died. His office is still on the first level — might find his ledger there. Every worker who went missing is recorded as \'contract terminated.\' Not \'missing.\' Not \'dead.\' Terminated.\n\nHe went down himself on the last day. Said he\'d prove it was safe. Took four guards with him. We heard screaming for twenty minutes. Then nothing. Here — take this lantern. You\'ll need it more than I will."',
                effects: [
                  { type: 'item', itemName: 'Torch' },
                  { type: 'message', text: 'Gristle hands you his old mining lantern.', color: '#ffcc44' },
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
          artAsset: 'story/story-unstable-ceiling.png',
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
        {
          id: 'ch1_f1_miners_shrine',
          type: 'ancient_altar',
          name: 'Miner\'s Shrine',
          artAsset: 'story/story-miners-shrine.png',
          description: 'A small wooden shrine built by the miners. Candle stubs, a carved pickaxe icon, and faded prayers pinned to the wood. Someone still believed help would come.',
          primarySkill: 'diplomacy',
          alternateSkill: 'lore',
          baseDifficulty: 5,
          criticalSuccess: {
            description: 'You kneel and offer a genuine prayer. Warmth flows through you — the miners\' spirits are grateful.',
            effects: [{ type: 'heal', value: 10, message: 'The spirits of the miners bless you.' }],
          },
          success: {
            description: 'You pay your respects. A sense of calm settles over you.',
            effects: [{ type: 'heal', value: 5, message: 'You feel at peace.' }],
          },
          partial: {
            description: 'You stand in silence for a moment. Nothing happens, but it felt right.',
            effects: [],
          },
          failure: {
            description: 'You accidentally knock a candle stub off the shrine. The air grows cold.',
            effects: [],
          },
          criticalFailure: {
            description: 'You disturb the shrine carelessly. A wave of sorrow washes over you.',
            effects: [{ type: 'damage', value: 3, message: 'Grief overwhelms you.' }],
          },
        },
      ],
      monsters: [
        { name: 'Cave Rat', char: 'r', color: '#aa8866', stats: { hp: 8, maxHp: 8, attack: 2, defense: 0, speed: 12 }, xpValue: 3, lootChance: 0.2, count: 4 },
        { name: 'Giant Spider', char: 'S', color: '#774488', stats: { hp: 12, maxHp: 12, attack: 3, defense: 1, speed: 10 }, xpValue: 5, lootChance: 0.3, count: 2 },
      ],
      items: [
        { name: 'Miner\'s Pickaxe', type: 'weapon', char: '/', color: '#aa8866', value: 8, description: 'A sturdy mining pickaxe. Not a sword, but it\'ll do.', statBonus: { attack: 1 }, equipSlot: 'weapon', count: 1 },
        { name: 'Hardtack Biscuit', type: 'food', char: '%', color: '#cc9944', value: 5, description: 'Standard miner\'s ration. Hard as stone but keeps you going.', count: 3 },
        { name: 'Shadowstone Shard', type: 'potion', char: '!', color: '#44cc88', value: 12, description: 'A sliver of raw shadowstone. Heals 12 HP when crushed.', count: 2 },
        { name: 'Miner\'s Hard Hat', type: 'armor', char: '[', color: '#ccaa44', value: 10, description: 'Reinforced mining helmet. Not pretty, but it\'ll stop a rock.', statBonus: { defense: 1 }, equipSlot: 'armor', count: 1 },
      ],
    },

    // ── FLOOR 2: The Butcher's Lair ──
    {
      floorIndex: 2,
      zone: 'stone_depths',
      hasCheckpoint: true,
      introSlides: [
        {
          title: 'Shaft 7',
          text: 'A broken sign reads "SHAFT 7 — CLOSED BY ORDER OF FOREMAN VOSS." The boards nailed across the entrance have been smashed through from inside. Drag marks in the dirt, wide as a man. The air is thick with the smell of iron and rot.',
          artAsset: 'story/story-shaft7-entrance.png',
        },
        {
          title: 'The Butcher',
          text: 'Big Harmon went down to find his missing brother. Whatever he found broke something inside him. He came back up once, silent, staring at nothing. Then he went back down with his pickaxe and never returned. Gristle says you can still hear him at night — dragging that pickaxe through the tunnels. Scrape. Scrape. Scrape. The miners called him the Butcher even before he died. He earned the name after.',
          artAsset: 'story/story-butcher.png',
        },
      ],
      roomMessages: [
        'Fresh blood spatters the floor. This happened recently.',
        'A heavy scraping sound echoes from the darkness — metal on stone.',
        'You find a mangled corpse. Three claw marks across the chest.',
        'The smell here is indescribable. Something died and kept moving.',
        'Chains hang from the ceiling, swaying gently. There is no wind.',
        'Scratches on the wall spell out: "HE WONT LET ME DIE"',
        'You hear heavy footsteps somewhere above you. Thud. Thud. Thud.',
      ],
      encounters: [
        {
          id: 'ch1_f2_blood_trail',
          type: 'skill_challenge',
          artAsset: 'story/story-blood-trail.png',
          description: 'A trail of blood leads deeper into the tunnel. It\'s fresh — still wet. Following it might lead to survivors... or to whatever made the trail.',
          primarySkill: 'survival',
          alternateSkill: 'awareness',
          target: 7,
          successDescription: 'You follow the trail carefully and find a dead adventurer\'s pack, untouched. Their loss is your gain.',
          successReward: { type: 'item', value: 'Health Potion' },
          failureDescription: 'You lose the trail in the darkness. The blood seems to be everywhere down here.',
        },
        {
          id: 'ch1_f2_barricade',
          type: 'skill_challenge',
          artAsset: 'story/story-barricade.png',
          description: 'Someone built a barricade from mine carts and timbers. It\'s been smashed through from one side — the wrong side. You can still see claw marks in the wood.',
          primarySkill: 'athletics',
          alternateSkill: 'survival',
          target: 8,
          successDescription: 'You squeeze through a gap in the barricade and find supplies cached behind it.',
          successReward: { type: 'gold', value: 20 },
          failureDescription: 'The barricade shifts as you climb it. Splinters gouge your hands.',
          failurePenalty: { type: 'damage', value: 3 },
        },
        {
          id: 'ch1_f2_strange_markings',
          type: 'hidden_cache',
          artAsset: 'story/story-strange-markings.png',
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
          id: 'ch1_survivor_tomm',
          name: 'Tomm',
          char: 'T',
          color: '#aacc88',
          portraitAsset: 'story/story-survivor.png',
          dialogue: {
            text: '"Please — please don\'t make noise. He hears everything. I\'ve been hiding here for... I don\'t know how long. Days? Weeks? He walks past this spot every few hours. Dragging that pickaxe. I can hear it scraping on the stone even in my sleep.\n\nYou have to kill him. It\'s the only way any of us get out of here. But you\'ll need potions. Lots of them. He\'s... he\'s not human anymore. Not really."',
            choices: [
              {
                label: 'Take his healing supplies',
                responseText: '"Take them. Take everything. If you can kill that thing, I\'ll crawl out of here on my hands if I have to. There\'s more potions scattered in the rooms he doesn\'t patrol — he avoids the light for some reason. Look for rooms with lanterns still burning."',
                effects: [
                  { type: 'item', itemName: 'Health Potion' },
                  { type: 'item', itemName: 'Health Potion' },
                  { type: 'message', text: 'Tomm gives you his last healing potions.', color: '#44ff44' },
                ],
              },
              {
                label: 'Ask about the Butcher\'s weakness',
                responseText: '"Fire. He flinches from fire. And he\'s slow — strong as a cave bear but slow. If you can stay out of his reach and keep hitting him... maybe. I saw another adventurer try. She got three good hits in before he caught her. She didn\'t get a fourth."',
                effects: [
                  { type: 'message', text: 'You learn the Butcher is weak to fire and slow to turn.', color: '#ff8844' },
                ],
              },
            ],
          },
          setsFlag: { key: 'met_tomm', value: 'true' },
        },
        {
          id: 'ch1_foreman_body',
          name: 'Foreman Voss',
          char: 'V',
          color: '#ccaa44',
          portraitAsset: 'story/story-foreman.png',
          dialogue: {
            text: 'A body in expensive clothes lies crumpled against the wall. Gold rings on swollen fingers. A name plate on his vest: "A. VOSS — FOREMAN." His face is frozen in an expression of absolute terror.\n\nIn his hands, a final letter, never sent:\n\n"To the Board of Directors — I take full responsibility. The deep veins were never worth the cost. I ignored the warnings. I ignored the missing men. I ignored the sounds. God help me, I ignored everything for the money. Whatever is down here, we woke it. And it is angry. And it remembers every man we sent to die in its home."\n\nThe ink trails off into a scrawl.',
            choices: [
              {
                label: 'Take his gold rings',
                responseText: 'You pull the rings from his cold fingers. They\'re worth a small fortune. Voss won\'t be needing them.',
                effects: [
                  { type: 'gold', amount: 30 },
                  { type: 'message', text: 'You pocket Voss\'s gold rings. Blood money.', color: '#ffcc44' },
                ],
              },
              {
                label: 'Leave him as he is',
                responseText: 'You leave the Foreman where he fell. He chose this grave when he chose profit over lives. At least his letter tells the truth — in the end, he knew exactly what he\'d done.',
                effects: [
                  { type: 'message', text: 'Even in death, greed has a face.', color: '#8888cc' },
                ],
              },
            ],
          },
        },
      ],
      roomEvents: [
        {
          id: 'ch1_f2_hanging_chains',
          type: 'trap_chamber',
          name: 'Hanging Chains',
          artAsset: 'story/story-butcher-lair.png',
          description: 'Heavy chains dangle from the ceiling in thick curtains. Something is strung up in the center — you can\'t see what. Moving through without making noise will be difficult.',
          primarySkill: 'stealth',
          alternateSkill: 'athletics',
          baseDifficulty: 8,
          criticalSuccess: {
            description: 'You slip through the chains like a ghost. On the other side, you find a cache the Butcher was hoarding.',
            effects: [{ type: 'heal', value: 10, message: 'You find a healing potion and drink it.' }],
          },
          success: {
            description: 'You navigate the chains carefully. A few clinks, but nothing comes.',
            effects: [],
          },
          partial: {
            description: 'A chain catches your arm and swings loudly. You hear something stir in the distance.',
            effects: [{ type: 'damage', value: 2, message: 'The chain cuts your arm.' }],
          },
          failure: {
            description: 'You crash into the chains, sending them clanging. Heavy footsteps begin approaching...',
            effects: [{ type: 'damage', value: 5, message: 'Something heard you!' }],
          },
          criticalFailure: {
            description: 'The chains tangle around you. By the time you free yourself, you realize you\'re not alone in the room.',
            effects: [{ type: 'damage', value: 8, message: 'The Butcher nearly found you!' }],
          },
        },
        {
          id: 'ch1_f2_ominous_sounds',
          type: 'trap_chamber',
          name: 'The Scraping',
          artAsset: 'story/story-butcher.png',
          description: 'The rhythmic scraping of metal on stone echoes from ahead. SCREEEEE... SCREEEEE... It\'s getting closer. You need to decide: hide or press forward.',
          primarySkill: 'stealth',
          alternateSkill: 'awareness',
          baseDifficulty: 7,
          criticalSuccess: {
            description: 'You find a perfect hiding spot and watch the Butcher lumber past. You spot a potion on his belt that falls loose.',
            effects: [{ type: 'heal', value: 15, message: 'You snag a potion as he passes!' }],
          },
          success: {
            description: 'You press against the wall in darkness. The massive shape passes without seeing you.',
            effects: [],
          },
          partial: {
            description: 'You hide, but not well enough. The shape pauses, sniffs the air... then moves on.',
            effects: [{ type: 'damage', value: 2, message: 'Your heart nearly stops.' }],
          },
          failure: {
            description: 'You stumble while hiding. Glowing eyes turn toward you in the dark.',
            effects: [{ type: 'damage', value: 6, message: 'The Butcher\'s fist clips you as you flee!' }],
          },
          criticalFailure: {
            description: 'There\'s nowhere to hide. The Butcher charges.',
            effects: [{ type: 'damage', value: 12, message: 'A devastating blow!' }],
          },
        },
      ],
      monsters: [
        { name: 'The Butcher', char: 'B', color: '#cc2222', stats: { hp: 30, maxHp: 30, attack: 7, defense: 3, speed: 4 }, xpValue: 30, lootChance: 0.8, count: 1 },
        { name: 'Tunnel Crawler', char: 'c', color: '#669966', stats: { hp: 14, maxHp: 14, attack: 4, defense: 1, speed: 8 }, xpValue: 6, lootChance: 0.25, count: 2 },
        { name: 'Drowned Skeleton', char: 's', color: '#ddddaa', stats: { hp: 10, maxHp: 10, attack: 3, defense: 2, speed: 6 }, xpValue: 5, lootChance: 0.3, count: 2 },
      ],
      items: [
        { name: 'Harmon\'s Cleaver', type: 'weapon', char: '/', color: '#cc4444', value: 20, rarity: 'uncommon', description: 'A blood-stained meat cleaver. Was it always this sharp, or did Harmon sharpen it down here?', statBonus: { attack: 3 }, equipSlot: 'weapon', onHitEffect: { type: 'bleed', damage: 2, turns: 3 }, count: 1 },
        { name: 'Burning Lantern', type: 'offhand', char: '(', color: '#ffaa22', value: 15, rarity: 'uncommon', description: 'Gristle\'s old mining lantern, still burning. The Butcher flinches from its light.', statBonus: { defense: 1, speed: 1 }, equipSlot: 'offhand', count: 1 },
        { name: 'Miner\'s Moonshine', type: 'potion', char: '!', color: '#aaddff', value: 10, description: 'Homemade rotgut from Shaft 7\'s break room. Burns going down. Heals 10 HP.', count: 3 },
        { name: 'Shadowstone Shard', type: 'potion', char: '!', color: '#44cc88', value: 12, description: 'A sliver of raw shadowstone. Heals 12 HP when crushed.', count: 3 },
        { name: 'Pit Jerky', type: 'food', char: '%', color: '#aa6633', value: 8, description: 'Smoked mystery meat from the miners\' cache. Don\'t ask what it is.', count: 3 },
        { name: 'Voss\'s Signet Ring', type: 'ring', char: '=', color: '#ffd700', value: 25, rarity: 'uncommon', description: 'The Foreman\'s gold signet ring. Engraved: "GRIMHOLLOW MINING CO." Still warm.', statBonus: { defense: 1, attack: 1 }, equipSlot: 'ring', count: 1 },
      ],
    },

    // ── FLOOR 3: The Deepfolk Ruins ──
    {
      floorIndex: 3,
      zone: 'stone_depths',
      hasCheckpoint: true,
      introSlides: [
        {
          title: 'The Deepfolk Ruins',
          text: 'The rough mine tunnels give way to carved stone — impossibly smooth walls covered in geometric patterns that shift in your peripheral vision. These ruins are older than the mountain itself. The Deepfolk built downward, always downward, toward something they worshipped. Or feared.',
          artAsset: 'story/deepfolk-ruins.png',
        },
      ],
      roomMessages: [
        'The geometric carvings on the walls seem to move when you\'re not looking directly at them.',
        'A subsonic hum vibrates through the floor. Your teeth ache.',
        'Faint blue light pulses from cracks in the walls — bioluminescent fungi, or something else?',
        'The corridors here don\'t follow normal geometry. Some rooms feel larger inside than out.',
        'You find a Deepfolk mural: tall, thin figures descending into a spiral of light.',
        'The temperature drops suddenly. Your breath mists in the alien air.',
      ],
      encounters: [
        {
          id: 'ch1_f3_ancient_puzzle',
          type: 'negotiation',
          artAsset: 'story/glyph-door.png',
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
          artAsset: 'story/dart-trap.png',
          description: 'The floor tiles ahead are pressure-sensitive — you can see faint seams between them. A dart trap, most likely.',
          primarySkill: 'stealth',
          alternateSkill: 'athletics',
          target: 8,
          successDescription: 'You navigate the pressure plates with careful, precise steps. Not a single dart fires.',
          successReward: { type: 'heal', value: 0 },
          failureDescription: 'A tile clicks beneath your foot. Darts whistle from the walls.',
          failurePenalty: { type: 'damage', value: 8 },
        },
        {
          id: 'ch1_f3_crystal_formation',
          type: 'hidden_cache',
          artAsset: 'story/story-crystal-formation.png',
          description: 'A cluster of pale crystals grows from a crack in the floor. They pulse with inner light — warm to the touch. The Deepfolk clearly valued these.',
          primarySkill: 'lore',
          target: 7,
          successDescription: 'You carefully extract a crystal without shattering it. It radiates gentle warmth and light.',
          successReward: { type: 'item', value: 'Torch' },
          failureDescription: 'The crystal cracks when you touch it, releasing a brief flash of cold light.',
        },
      ],
      npcs: [
        {
          id: 'ch1_wounded_explorer',
          name: 'Sera',
          char: 'S',
          color: '#88ccff',
          portraitAsset: 'story/sera.png',
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
        {
          id: 'ch1_deepfolk_ghost',
          name: 'The Whisperer',
          char: '?',
          color: '#66ccaa',
          portraitAsset: 'story/story-deepfolk-ghost.png',
          dialogue: {
            text: 'A translucent figure materializes from the wall itself — tall, impossibly thin, its features smooth and alien. When it speaks, the words form directly in your mind:\n\n"Surface-walker. You tread the halls of the Descended. We built downward to escape the light. We found something better. Something that sleeps. Do you seek the Sleeper? Or do you seek escape? There is no answer that changes what comes next."',
            choices: [
              {
                label: 'Ask how to defeat the Sleeper',
                responseText: '"Defeat? You misunderstand. The Sleeper does not fight. It dreams. And in its dreams, all things are unmade. But if you insist on waking it... the crystals are its eyes. Shatter the crystals and the dream ends. For everyone. Choose wisely what you would wake from."',
                effects: [
                  { type: 'statBuff', stat: 'attack', amount: 2 },
                  { type: 'message', text: 'Ancient knowledge empowers you. +2 Attack.', color: '#66ccaa' },
                ],
              },
              {
                label: 'Ask what the Deepfolk were',
                responseText: '"We were you. Before. We dug too deep, as you say. But what we found was not evil — it was truth. The world above is the dream. Down here, beneath the stone, is where things are real. We chose to stay. We chose to descend. And we became... this. Neither alive nor dead. Just... deep."',
                effects: [
                  { type: 'message', text: 'The ghost fades. You feel profoundly unsettled.', color: '#8866aa' },
                ],
              },
            ],
          },
          setsFlag: { key: 'met_whisperer', value: 'true' },
        },
      ],
      roomEvents: [
        {
          id: 'ch1_f3_ancient_altar',
          type: 'ancient_altar',
          name: 'Deepfolk Shrine',
          artAsset: 'story/story-deepfolk-altar.png',
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
        {
          id: 'ch1_f3_gravity_well',
          type: 'trap_chamber',
          name: 'Gravity Anomaly',
          artAsset: 'story/story-gravity-anomaly.png',
          description: 'The floor here shimmers. Loose pebbles drift upward before falling sideways. The Deepfolk built something here that bent the rules of the world itself.',
          primarySkill: 'awareness',
          alternateSkill: 'athletics',
          baseDifficulty: 8,
          criticalSuccess: {
            description: 'You navigate the anomaly perfectly, riding the gravity shifts to reach a floating cache of Deepfolk treasures.',
            effects: [{ type: 'heal', value: 15, message: 'You find ancient healing salve in the floating cache.' }],
          },
          success: {
            description: 'You move through carefully, keeping your footing despite the disorientation.',
            effects: [],
          },
          partial: {
            description: 'The gravity shifts catch you off guard. You stumble but recover.',
            effects: [{ type: 'damage', value: 3, message: 'Gravity slams you sideways!' }],
          },
          failure: {
            description: 'You\'re thrown against the ceiling, then dropped.',
            effects: [{ type: 'damage', value: 7, message: 'The anomaly tosses you around!' }],
          },
          criticalFailure: {
            description: 'The gravity well pins you to the ceiling. By the time it releases, you\'re badly battered.',
            effects: [{ type: 'damage', value: 12, message: 'Gravity crushes you!' }],
          },
        },
      ],
      monsters: [
        { name: 'Stone Sentinel', char: 'S', color: '#888866', stats: { hp: 20, maxHp: 20, attack: 5, defense: 3, speed: 5 }, xpValue: 10, lootChance: 0.4, count: 2 },
        { name: 'Shadow Wisp', char: 'w', color: '#8888cc', stats: { hp: 8, maxHp: 8, attack: 6, defense: 0, speed: 14 }, xpValue: 8, lootChance: 0.2, count: 3 },
        { name: 'Deepfolk Remnant', char: 'D', color: '#6622aa', stats: { hp: 16, maxHp: 16, attack: 5, defense: 2, speed: 9 }, xpValue: 9, lootChance: 0.35, count: 2 },
      ],
      items: [
        { name: 'Deepfolk Boneblade', type: 'weapon', char: '/', color: '#6622aa', value: 35, rarity: 'uncommon', description: 'A sword carved from a single massive bone. Deepfolk runes pulse along the edge.', statBonus: { attack: 4 }, equipSlot: 'weapon', onHitEffect: { type: 'poison', damage: 2, turns: 2 }, count: 1 },
        { name: 'Stoneheart Amulet', type: 'amulet', char: '"', color: '#66ccaa', value: 30, rarity: 'uncommon', description: 'A Deepfolk amulet that hums with subsonic energy. You feel tougher wearing it.', statBonus: { defense: 2, maxHp: 10 }, equipSlot: 'amulet', count: 1 },
        { name: 'Crystallized Essence', type: 'potion', char: '!', color: '#cc88ff', value: 20, description: 'Liquefied Deepfolk crystal. Heals 20 HP and makes your skin tingle.', count: 2 },
        { name: 'Glowcap Mushroom', type: 'food', char: '%', color: '#44ddaa', value: 10, description: 'Bioluminescent fungus from the ruins. Surprisingly tasty. Nutritious.', count: 3 },
        { name: 'Sera\'s Map Fragment', type: 'offhand', char: '(', color: '#88ccff', value: 15, description: 'A piece of Sera\'s tunnel map. The shortcuts marked give you an edge.', statBonus: { speed: 2 }, equipSlot: 'offhand', count: 1 },
      ],
    },

    // ── FLOOR 4: The Sleeper's Chamber (Boss Floor) ──
    {
      floorIndex: 4,
      zone: 'stone_depths',
      hasCheckpoint: true,
      introSlides: [
        {
          title: 'The Heart of the Mountain',
          text: 'The Deepfolk ruins open into a vast natural cavern — so large your torchlight cannot reach the ceiling. In the center, suspended in a web of crystallized stone, something massive shifts. The subsonic hum is deafening now. You can feel it in your bones, in your teeth, behind your eyes.',
          artAsset: 'story/sleeper-chamber.png',
        },
        {
          title: 'The Sleeper Wakes',
          text: 'This is what the miners disturbed. This is what Gristle ran from. This is what the Deepfolk worshipped — and imprisoned. Thirty years of silence, and now it stirs again. Crystals crack. The web of stone begins to shatter. Eyes open across the thing\'s surface — dozens of them, all turning toward you.',
          artAsset: 'story/story-sleeper-awakens.png',
        },
      ],
      roomMessages: [
        'The crystal formations pulse with purple light — like a heartbeat.',
        'Tendrils of dark energy seep from cracks in the floor.',
        'The hum is so loud now it drowns out your own thoughts.',
        'The Sleeper\'s eyes track you across the chamber.',
      ],
      encounters: [],
      npcs: [],
      roomEvents: [],
      monsters: [
        { name: 'Sleeper Tendril', char: 't', color: '#6622aa', stats: { hp: 12, maxHp: 12, attack: 4, defense: 1, speed: 11 }, xpValue: 7, lootChance: 0.1, count: 4 },
      ],
      items: [
        { name: 'Crystallized Essence', type: 'potion', char: '!', color: '#cc88ff', value: 20, description: 'Liquefied Deepfolk crystal. Heals 20 HP and makes your skin tingle.', count: 3 },
        { name: 'Deepstone Shield', type: 'offhand', char: '(', color: '#888866', value: 25, rarity: 'uncommon', description: 'A shield carved from the ruins\' walls. Impossibly light for stone.', statBonus: { defense: 3 }, equipSlot: 'offhand', count: 1 },
        { name: 'Glowcap Mushroom', type: 'food', char: '%', color: '#44ddaa', value: 10, description: 'Bioluminescent fungus from the ruins. Surprisingly tasty.', count: 3 },
        { name: 'Last Adventurer\'s Sword', type: 'weapon', char: '/', color: '#dddddd', value: 40, rarity: 'rare', description: 'A fine blade dropped by the last sellsword who came here. They didn\'t make it. Maybe you will.', statBonus: { attack: 5 }, equipSlot: 'weapon', count: 1 },
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
    portraitAsset: 'story/sleeper-boss.png',
    introDialogue: 'The crystalline web shatters. The Sleeper unfolds — a mass of pale flesh and too many limbs, eyes opening across its surface like wounds. Each eye fixes on you. A voice that is not a voice reverberates through the stone itself:\n\n"WHO DISTURBS THE DREAMING?"',
    defeatDialogue: 'The Sleeper shudders, its countless eyes dimming one by one. The subsonic hum fades to silence. As the ancient horror collapses, the crystal formations around the chamber begin to glow — centuries of stored energy releasing all at once. The ruins tremble.\n\nYou need to get out. Now.\n\nBut as you turn to flee, you notice something in the rubble where the Sleeper fell: a passage. Leading further down. The Deepfolk built deeper than anyone knew.\n\nThis is not the bottom. This is only the beginning.',
  },
  rewards: [
    { type: 'gold', value: 100, description: '100 gold from the Sleeper\'s hoard' },
    { type: 'skill_points', value: 3, description: '3 skill points' },
    { type: 'unlock_chapter', value: 'ch2_deeper_still', description: 'Chapter 2: Deeper Still' },
  ],
};
