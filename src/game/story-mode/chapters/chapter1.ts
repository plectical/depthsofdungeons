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
      atmosphericEvents: [
        {
          id: 'ch1_f1_atmo_abandoned_cart',
          title: 'The Last Shipment',
          text: 'An overturned mine cart blocks part of the tunnel. Ore spills across the floor like frozen black blood. The cart\'s manifest is still pinned to its side: "SHAFT 7 — FINAL LOAD — PRIORITY RUSH." Someone scrawled beneath it in charcoal: "This is the last one. We\'re not going back." The wheels are still locked. Whoever tipped this cart did it on purpose.',
          artAsset: 'story/story-ch1-atmo-abandoned-cart.png',
        },
        {
          id: 'ch1_f1_atmo_canary_cage',
          title: 'The Canary',
          text: 'A brass birdcage hangs from a ceiling hook, its door swinging open. Inside, a small pile of yellow feathers and nothing else. Miners used canaries to detect poisonous gas — when the bird stopped singing, you ran. But this cage is deep in the mine, far past where canaries are useful. Someone brought this bird down here for company. The silence where birdsong should be feels like a wound.',
          artAsset: 'story/story-ch1-atmo-canary-cage.png',
        },
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
        { name: 'Cave Rat', char: '\u03C8', color: '#aa8866', stats: { hp: 14, maxHp: 14, attack: 5, defense: 1, speed: 12 }, xpValue: 4, lootChance: 0.2, count: 5 },
        { name: 'Giant Spider', char: '\u2620', color: '#774488', stats: { hp: 22, maxHp: 22, attack: 6, defense: 3, speed: 10 }, xpValue: 7, lootChance: 0.3, count: 3 },
      ],
      items: [
        { name: 'Miner\'s Pickaxe', type: 'weapon', char: '/', color: '#aa8866', value: 8, description: 'A sturdy mining pickaxe. Not a sword, but it\'ll do.', statBonus: { attack: 1 }, equipSlot: 'weapon', count: 1 },
        { name: 'Hardtack Biscuit', type: 'food', char: '%', color: '#cc9944', value: 5, description: 'Standard miner\'s ration. Hard as stone but keeps you going.', count: 3 },
        { name: 'Shadowstone Shard', type: 'potion', char: '!', color: '#44cc88', value: 12, description: 'A sliver of raw shadowstone. Heals 12 HP when crushed.', count: 1 },
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
      atmosphericEvents: [
        {
          id: 'ch1_f2_atmo_trophy_wall',
          title: 'The Trophy Wall',
          text: 'The Butcher has been busy. Mining helmets hang in a row on the wall — not on hooks, driven into the stone with pickaxe strikes. Fifteen of them. Each one has a name scratched into it in shaking letters. You recognize some from the missing persons list: COBB. ANDERS. FERRY. WELLS. The names stop halfway through. The remaining helmets have no names — just tally marks. As if counting had become easier than remembering.',
          artAsset: 'story/story-ch1-atmo-trophy-wall.png',
        },
        {
          id: 'ch1_f2_atmo_brothers_photo',
          title: 'The Locket on the Ground',
          text: 'Something glints on the floor. A small gold locket, open, lying face-down in dried blood. You turn it over. Inside: a photograph of two men — one enormous, one small, both grinning. Brothers. The inscription reads "H & C — Together always." The chain is snapped clean. This didn\'t fall off. It was torn away. By the man in the photo. By what he became.',
          artAsset: 'story/story-ch1-atmo-brothers-photo.png',
        },
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
                  { type: 'setFlag', key: 'tomm_choice', value: 'took_supplies' },
                ],
              },
              {
                label: 'Ask about the Butcher\'s weakness',
                responseText: '"Fire. He flinches from fire. And he\'s slow — strong as a cave bear but slow. If you can stay out of his reach and keep hitting him... maybe. I saw another adventurer try. She got three good hits in before he caught her. She didn\'t get a fourth."',
                effects: [
                  { type: 'message', text: 'You learn the Butcher is weak to fire and slow to turn.', color: '#ff8844' },
                  { type: 'setFlag', key: 'tomm_choice', value: 'asked_intel' },
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
          artAsset: 'story/story-ch1-the-scraping.png',
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
        { name: 'The Butcher', char: '\u2694', color: '#cc2222', stats: { hp: 55, maxHp: 55, attack: 12, defense: 5, speed: 5 }, xpValue: 35, lootChance: 0.8, count: 1, isBoss: true, defeatMessage: 'The Butcher — what was once Big Harmon — collapses with a sound like crumbling stone. The pickaxe clatters from his grip. For a moment, his eyes clear. "...brother?" he whispers. Then he is still. Whatever dark force animated him releases its hold. The scraping sound that haunted Shaft 7 falls silent at last.' },
        { name: 'Tunnel Crawler', char: '\u2237', color: '#669966', stats: { hp: 22, maxHp: 22, attack: 7, defense: 2, speed: 8 }, xpValue: 8, lootChance: 0.25, count: 3 },
        { name: 'Drowned Skeleton', char: '\u2623', color: '#ddddaa', stats: { hp: 20, maxHp: 20, attack: 6, defense: 4, speed: 6 }, xpValue: 7, lootChance: 0.3, count: 3 },
      ],
      items: [
        { name: 'Harmon\'s Cleaver', type: 'weapon', char: '/', color: '#cc4444', value: 20, rarity: 'uncommon', description: 'A blood-stained meat cleaver. Was it always this sharp, or did Harmon sharpen it down here?', statBonus: { attack: 3 }, equipSlot: 'weapon', onHitEffect: { type: 'bleed', damage: 2, turns: 3 }, count: 1 },
        { name: 'Burning Lantern', type: 'offhand', char: '(', color: '#ffaa22', value: 15, rarity: 'uncommon', description: 'Gristle\'s old mining lantern, still burning. The Butcher flinches from its light.', statBonus: { defense: 1, speed: 1 }, equipSlot: 'offhand', count: 1 },
        { name: 'Miner\'s Moonshine', type: 'potion', char: '!', color: '#aaddff', value: 10, description: 'Homemade rotgut from Shaft 7\'s break room. Burns going down. Heals 10 HP.', count: 2 },
        { name: 'Shadowstone Shard', type: 'potion', char: '!', color: '#44cc88', value: 12, description: 'A sliver of raw shadowstone. Heals 12 HP when crushed.', count: 2 },
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
        'Faint blue light pulses from cracks in the walls — glowing fungi, or something else?',
        'The corridors here don\'t follow normal geometry. Some rooms feel larger inside than out.',
        'You find a Deepfolk mural: tall, thin figures descending into a spiral of light.',
        'The temperature drops suddenly. Your breath mists in the alien air.',
      ],
      atmosphericEvents: [
        {
          id: 'ch1_f3_atmo_mural',
          title: 'The Descent Mural',
          text: 'An entire wall is covered in a single continuous carving — a mural that tells a story in spiraling geometric patterns. At the top: tall, graceful figures standing beneath an open sky. In the middle: the same figures descending into the earth, their bodies elongating, their features smoothing. At the bottom: shapes that are no longer recognizable as people, wrapped around something vast and luminous. The carving is so detailed you can see expressions on the early figures. They look eager. Happy. They wanted this.',
          artAsset: 'story/story-ch1-atmo-deepfolk-mural.png',
        },
        {
          id: 'ch1_f3_atmo_impossible_room',
          title: 'The Room That Shouldn\'t Be',
          text: 'You step through a doorway and stop. The room beyond is enormous — a cathedral-sized space with pillars rising into darkness far above. But the doorway you entered through is set into the wall of a corridor barely ten feet wide. The room cannot fit. The geometry is wrong. When you look back through the doorway, you see the narrow corridor continuing normally. When you look forward, the impossible space stretches on. The Deepfolk didn\'t just build underground. They built outside the rules.',
          artAsset: 'story/story-ch1-atmo-impossible-room.png',
        },
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
          id: 'ch1_tomm_returns',
          name: 'Tomm',
          char: 'T',
          color: '#aacc88',
          portraitAsset: 'story/story-survivor.png',
          requiresFlag: { key: 'met_tomm', value: 'true' },
          dialogue: {
            text: '"You\'re alive! I heard the fighting stop and I... I followed you down. Couldn\'t just sit there hiding anymore. Not after what you did.\n\nI found some supplies cached in the upper tunnels. And I brought something else — my old prospecting tools. They\'re not much, but the crystal in the handles reacts to Deepfolk stonework. Might help you down here."',
            choices: [
              {
                label: 'Accept his help',
                responseText: '"Here — take everything. The picks, the rations, all of it. I\'m going to try to make it back to the surface and get help. Real help. If you can keep going down and find the others... I\'ll make sure the way back stays open for you.\n\nBe careful. The deeper you go, the less things make sense."',
                effects: [
                  { type: 'item', itemName: 'Health Potion' },
                  { type: 'statBuff', stat: 'defense', amount: 1 },
                  { type: 'message', text: 'Tomm gives you supplies and promises to keep the exit clear. +1 Defense.', color: '#44ff44' },
                  { type: 'setFlag', key: 'tomm_helped', value: 'true' },
                ],
              },
              {
                label: 'Tell him to stay hidden',
                responseText: '"You\'re right. I\'m no fighter. But I can wait. I\'ll stay in the upper tunnels — if you need to retreat, I\'ll have bandages ready. Just... come back. Someone has to come back."',
                effects: [
                  { type: 'message', text: 'Tomm will wait at the entrance as a safety net.', color: '#aacc88' },
                ],
              },
            ],
          },
          setsFlag: { key: 'tomm_returned', value: 'true' },
        },
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
        { name: 'Stone Sentinel', char: '\u2666', color: '#888866', stats: { hp: 32, maxHp: 32, attack: 8, defense: 5, speed: 5 }, xpValue: 12, lootChance: 0.4, count: 2 },
        { name: 'Shadow Wisp', char: '\u2734', color: '#8888cc', stats: { hp: 14, maxHp: 14, attack: 9, defense: 0, speed: 14 }, xpValue: 10, lootChance: 0.2, count: 4 },
        { name: 'Deepfolk Remnant', char: '\u2625', color: '#6622aa', stats: { hp: 26, maxHp: 26, attack: 8, defense: 3, speed: 9 }, xpValue: 11, lootChance: 0.35, count: 3 },
      ],
      items: [
        { name: 'Deepfolk Boneblade', type: 'weapon', char: '/', color: '#6622aa', value: 35, rarity: 'uncommon', description: 'A sword carved from a single massive bone. Deepfolk runes pulse along the edge.', statBonus: { attack: 4 }, equipSlot: 'weapon', onHitEffect: { type: 'poison', damage: 2, turns: 2 }, count: 1 },
        { name: 'Stoneheart Amulet', type: 'amulet', char: '"', color: '#66ccaa', value: 30, rarity: 'uncommon', description: 'A Deepfolk amulet that hums with subsonic energy. You feel tougher wearing it.', statBonus: { defense: 2, maxHp: 10 }, equipSlot: 'amulet', count: 1 },
        { name: 'Dream Shard', type: 'potion', char: '\u25C8', color: '#aa55ff', value: 25, description: 'A sliver of crystallized dream, shed by the Sleeper in its fitful rest. It hums against your skin. Consuming it grants shadow-like speed and stealth — but thins the boundary between you and the dream.', count: 2 },
        { name: 'Crystallized Essence', type: 'potion', char: '!', color: '#cc88ff', value: 20, description: 'Liquefied Deepfolk crystal. Heals 20 HP and makes your skin tingle.', count: 1 },
        { name: 'Glowcap Mushroom', type: 'food', char: '%', color: '#44ddaa', value: 10, description: 'Glowing fungus from the ruins. Surprisingly tasty. Nutritious.', count: 2 },
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
      atmosphericEvents: [
        {
          id: 'ch1_f4_atmo_crystal_web',
          title: 'The Crystal Web',
          text: 'Massive crystalline strands stretch across the cavern ceiling like the web of some impossible spider. Each strand pulses with dim purple light — a slow, rhythmic glow that matches the subsonic hum vibrating through the stone. Where the strands intersect, they form nodes of concentrated energy that cast strange shadows on the walls below. You realize with growing unease that the web isn\'t anchored to the ceiling. It\'s growing from something in the center of the chamber. Something alive.',
          artAsset: 'story/story-ch1-atmo-crystal-web.png',
        },
        {
          id: 'ch1_f4_atmo_dreaming_miner',
          title: 'The Dreamer',
          text: 'A miner sits against the cavern wall, eyes open, breathing slowly. He\'s alive — but when you wave your hand in front of his face, he doesn\'t react. His pupils are dilated to black discs. His lips move soundlessly, repeating the same words over and over. You lean close to listen:\n\n"It shows me home. It shows me sunlight. It shows me my daughter\'s face. Please don\'t wake me up. Please. It\'s so beautiful here."\n\nYou step back. His expression is peaceful. Almost happy. Whatever the Sleeper dreams, it shares.',
          artAsset: 'story/story-ch1-atmo-dreaming-miner.png',
        },
        {
          id: 'ch1_f4_atmo_eye_cluster',
          title: 'The Eyes in the Wall',
          text: 'The cavern wall blinks. Not all at once — a slow ripple of movement, dozens of eyes opening and closing in sequence across the rough stone surface. They\'re embedded in the rock itself, seamlessly fused with the stone as if they\'d grown there. Each eye is different — some are human, some are animal, some are something else entirely. They all track you as you move. When you stop, they stop. When you breathe, they blink in rhythm with your breath. The Sleeper doesn\'t just watch. It mirrors.',
          artAsset: 'story/story-ch1-atmo-eye-cluster.png',
        },
      ],
      encounters: [
        {
          id: 'ch1_f4_crystal_conduit',
          type: 'skill_challenge',
          artAsset: 'story/story-ch1-crystal-conduit.png',
          description: 'A massive crystal formation bridges two sections of the cavern, pulsing with the Sleeper\'s energy. Breaking it might weaken the creature — or release something worse.',
          primarySkill: 'athletics',
          alternateSkill: 'lore',
          target: 9,
          successDescription: 'You strike the crystal at its resonance point. It shatters cleanly, and the subsonic hum dims noticeably. The Sleeper stirs, weakened.',
          successReward: { type: 'heal', value: 15 },
          failureDescription: 'The crystal absorbs your blow and redirects the energy back at you in a painful pulse.',
          failurePenalty: { type: 'damage', value: 8 },
        },
        {
          id: 'ch1_f4_sleeper_cache',
          type: 'hidden_cache',
          artAsset: 'story/story-ch1-sleeper-cache.png',
          description: 'Among the crystallized remains, you spot something metallic — a previous adventurer\'s pack, half-consumed by crystal growth. Their last stand was here.',
          primarySkill: 'awareness',
          target: 8,
          successDescription: 'You pry the pack free. Inside: potions and a blade that still gleams despite decades of entombment.',
          successReward: { type: 'item', value: 'Health Potion' },
          failureDescription: 'The crystal growth has fused the pack shut. You can\'t get it open without shattering the contents.',
        },
      ],
      npcs: [
        {
          id: 'ch1_cobb_ghost',
          name: 'Cobb\'s Shade',
          char: 'C',
          color: '#8888cc',
          portraitAsset: 'story/story-ch1-cobb-shade.png',
          dialogue: {
            text: 'A translucent figure flickers into view — small, young, with the rough hands of a miner. His expression is caught between terror and resignation.\n\n"You... you can see me? No one sees me anymore. Not even the thing. I\'m Cobb. I was a miner. Harmon\'s brother. I came down here and... it took me. The Sleeper. It took my body first, then my name, then my face. All I have left is this. This echo."\n\nHe looks toward the center of the chamber with hollow eyes.\n\n"You have to end it. Not for me — I\'m already gone. For Harmon. He came down here looking for me and it broke him. Kill that thing and maybe my brother can finally rest."',
            choices: [
              {
                label: 'I\'ll end this. For both of you.',
                responseText: '"Thank you. I... I tried to fight it. We all did, at first. But it gets inside your dreams and shows you beautiful things. Makes you want to stay. Don\'t listen to the dreams. Don\'t look at the eyes. Just hit it until it stops. The crystals around it — they\'re its nervous system. Shatter those first and it\'ll feel every blow."\n\nCobb\'s form flickers.\n\n"Tell Gristle... tell him I didn\'t desert. Tell him I stayed because I couldn\'t leave."',
                effects: [
                  { type: 'statBuff', stat: 'attack', amount: 3 },
                  { type: 'message', text: 'Cobb\'s desperate hope empowers you. +3 Attack.', color: '#8888cc' },
                ],
              },
              {
                label: 'What happened to the other miners?',
                responseText: '"Absorbed. All of them. The Sleeper takes what it needs — bodies, minds, memories. We\'re all in there, in the dream. Thirty miners. Three adventurers before you. And Harmon... poor Harmon. He fought the hardest. Fought so hard the thing couldn\'t take his mind completely. So it just... used his body. Made him patrol the tunnels. Guard the entrance. The Butcher isn\'t evil. He\'s a prison."\n\nCobb fades slightly.\n\n"We\'re all still in there. If you kill it... maybe we finally get to sleep for real."',
                effects: [
                  { type: 'message', text: 'The weight of thirty lost souls settles on your shoulders.', color: '#8866aa' },
                ],
              },
            ],
          },
          setsFlag: { key: 'met_cobb', value: 'true' },
        },
      ],
      roomEvents: [
        {
          id: 'ch1_f4_dream_pulse',
          type: 'trap_chamber',
          name: 'The Sleeper\'s Dream',
          artAsset: 'story/story-ch1-dream-pulse.png',
          description: 'A wave of purple energy pulses from the Sleeper. Your vision blurs. For a moment you see sunlight, grass, a face you love — then it\'s gone. The dream is a weapon.',
          primarySkill: 'awareness',
          alternateSkill: 'survival',
          baseDifficulty: 9,
          criticalSuccess: {
            description: 'You steel your mind against the vision. The dream shatters around you, and you catch a glimpse of the Sleeper\'s true form — smaller than expected, more afraid than angry.',
            effects: [{ type: 'heal', value: 10, message: 'Clarity empowers you.' }],
          },
          success: {
            description: 'You shake off the dream before it takes hold. Your hands are trembling, but your mind is your own.',
            effects: [],
          },
          partial: {
            description: 'The dream lingers for too long. You lose a few seconds standing still, vulnerable.',
            effects: [{ type: 'damage', value: 4, message: 'The dream\'s afterimage stings.' }],
          },
          failure: {
            description: 'The dream pulls you in. You see home, safety, warmth — then you\'re ripped back to reality with a psychic scream.',
            effects: [{ type: 'damage', value: 8, message: 'Psychic backlash!' }],
          },
          criticalFailure: {
            description: 'The dream consumes you. For what feels like hours, you live another life. When you wake, blood runs from your nose and your head is splitting.',
            effects: [{ type: 'damage', value: 14, message: 'Your mind nearly shattered!' }],
          },
        },
      ],
      monsters: [
        { name: 'Sleeper Tendril', char: '\u223F', color: '#6622aa', stats: { hp: 20, maxHp: 20, attack: 7, defense: 2, speed: 11 }, xpValue: 9, lootChance: 0.1, count: 5 },
        { name: 'Crystal Guardian', char: '\u2756', color: '#cc88ff', stats: { hp: 34, maxHp: 34, attack: 9, defense: 6, speed: 5 }, xpValue: 14, lootChance: 0.3, count: 2 },
        { name: 'Nightmare Shade', char: '\u2302', color: '#440066', stats: { hp: 16, maxHp: 16, attack: 10, defense: 0, speed: 13 }, xpValue: 12, lootChance: 0.2, count: 3 },
        { name: 'Absorbed Miner', char: '\u2640', color: '#aa6688', stats: { hp: 24, maxHp: 24, attack: 8, defense: 3, speed: 8 }, xpValue: 10, lootChance: 0.25, count: 2, defeatMessage: 'The twisted miner collapses, and for a moment their face returns to normal — confused, frightened, human. Then they are still.' },
      ],
      items: [
        { name: 'Dream Shard', type: 'potion', char: '\u25C8', color: '#aa55ff', value: 25, description: 'The Sleeper\'s dreams made solid. The crystal whispers of impossible places. Power and peril in equal measure.', count: 3 },
        { name: 'Crystallized Essence', type: 'potion', char: '!', color: '#cc88ff', value: 20, description: 'Liquefied Deepfolk crystal. Heals 20 HP and makes your skin tingle.', count: 2 },
        { name: 'Deepstone Shield', type: 'offhand', char: '(', color: '#888866', value: 25, rarity: 'uncommon', description: 'A shield carved from the ruins\' walls. Impossibly light for stone.', statBonus: { defense: 3 }, equipSlot: 'offhand', count: 1 },
        { name: 'Glowcap Mushroom', type: 'food', char: '%', color: '#44ddaa', value: 10, description: 'Glowing fungus from the ruins. Surprisingly tasty.', count: 2 },
        { name: 'Last Adventurer\'s Sword', type: 'weapon', char: '/', color: '#dddddd', value: 40, rarity: 'rare', description: 'A fine blade dropped by the last sellsword who came here. They didn\'t make it. Maybe you will.', statBonus: { attack: 5 }, equipSlot: 'weapon', count: 1 },
      ],
    },
  ],
  boss: {
    name: 'The Sleeper',
    title: 'Ancient Deepfolk Horror',
    char: '\u2641',
    color: '#aa44ff',
    stats: { hp: 130, maxHp: 130, attack: 13, defense: 6, speed: 7 },
    xpValue: 60,
    bossAbility: {
      type: 'multi',
      abilities: [
        { type: 'summon', monsterName: 'Sleeper Tendril', count: 2, cooldown: 4 },
        { type: 'aoe', damage: 8, radius: 2, cooldown: 3 },
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
  victoryArtAsset: 'story/story-sleeper-defeat.png',
  bossItemDrop: {
    name: 'Sleeper\'s Eye', type: 'amulet', char: '"', color: '#aa44ff',
    value: 50, rarity: 'rare',
    description: 'A crystallized eye torn from the Sleeper\'s corpse. It still watches. It still dreams. +3 Atk, +3 Def, +15 Max HP.',
    statBonus: { attack: 3, defense: 3, maxHp: 15 },
    equipSlot: 'amulet', count: 1,
  },
  miniBossVictories: [
    {
      monsterName: 'The Butcher',
      artAsset: 'story/story-butcher-defeat.png',
      narrative: 'The Butcher — what was once Big Harmon — collapses with a sound like crumbling stone. The pickaxe clatters from his grip. For a moment, his eyes clear. "...brother?" he whispers. Then he is still.\n\nWhatever dark force animated him releases its hold. The scraping sound that haunted Shaft 7 falls silent at last.\n\nIn his clenched fist, you find a small gold locket. Inside: a portrait of two brothers, smiling. One massive, one small. The engraving reads: "H & C — Brothers of the Deep."',
      loreUnlock: 'lore_harmon',
      itemDrop: {
        name: 'Harmon\'s Locket', type: 'ring', char: '=', color: '#ffd700',
        value: 30, rarity: 'rare',
        description: 'A gold locket containing a portrait of two brothers. It hums with residual warmth — as if grateful to be held by human hands again. +2 Atk, +2 Def, +5 Max HP.',
        statBonus: { attack: 2, defense: 2, maxHp: 5 },
        equipSlot: 'ring', count: 1,
      },
    },
  ],
  loreEntries: [
    {
      id: 'lore_harmon',
      title: 'The Ballad of Big Harmon',
      slides: [
        {
          title: 'Brothers of the Deep',
          text: 'Harmon and Cobb were inseparable. Harmon — the eldest — stood nearly seven feet tall, broad as a mine cart, with hands that could crack stone. Cobb was small, clever, quick with a joke. They worked Shaft 7 together for twelve years. Harmon hauled the ore; Cobb spotted the veins. The other miners said they were the best team in Grimhollow.',
          artAsset: 'story/story-harmon-brothers.png',
        },
        {
          title: 'The Disappearance',
          text: 'When Cobb vanished, Harmon refused to believe he\'d deserted. He searched the tunnels for three days without sleeping. On the fourth day, he found Cobb\'s helmet — sitting upright in the center of Shaft 7, placed with deliberate care. No blood. No body. Just the helmet.\n\nHarmon brought it home. He didn\'t speak for a week. Then he packed his pickaxe and went back down. "I\'ll bring him home," he told Gristle. "Or I won\'t come back at all."',
          artAsset: 'story/story-harmon-descent.png',
        },
        {
          title: 'The Butcher',
          text: 'Harmon came back once. He sat in the canteen and stared at the wall for six hours. When asked what he\'d found, he said one word: "Breathing." Then he went back down.\n\nThe miners heard him after that. At night, in the quiet hours between shifts — the slow, rhythmic scrape of a pickaxe on stone. Scrape. Scrape. Scrape. Getting closer, then retreating. Never stopping.\n\nThey called him the Butcher. But in his locket, two brothers still smiled.',
          artAsset: 'story/story-butcher-defeat.png',
        },
      ],
    },
    {
      id: 'lore_deepfolk',
      title: 'The Descent of the Deepfolk',
      slides: [
        {
          title: 'The Builders Below',
          text: 'Long before humans broke ground on Grimhollow Mountain, another civilization built downward. The Deepfolk — tall, thin, with smooth features that defied human anatomy — carved their cities into the living rock with tools that left no marks. Their architecture bent space: rooms larger inside than out, corridors that curved in impossible directions.\n\nThey did not build for shelter. They built toward something. Deeper and deeper, following a sound only they could hear.',
          artAsset: 'story/story-deepfolk-builders.png',
        },
        {
          title: 'The Dreaming God',
          text: 'At the deepest point of their descent, the Deepfolk found it: a vast crystalline formation pulsing with energy older than the mountain itself. Inside the crystal, something slept. Something that dreamed.\n\nThe Deepfolk built a cathedral around it. They worshipped it. They fed it their memories, their fears, their sense of self — until the distinction between worshipper and worshipped dissolved. They became the Sleeper\'s dream, and the Sleeper became their god.\n\nThey were never seen on the surface again.',
          artAsset: 'story/story-deepfolk-worship.png',
        },
        {
          title: 'The Awakening',
          text: 'For millennia, the Sleeper dreamed in peace. Then the miners came. Their pickaxes cracked the crystal. Their lanterns pierced the dark. The Sleeper stirred — and in its stirring, the old protections failed.\n\nThe Deepfolk remnants — neither alive nor dead, sustained only by the dream — began to walk again. The miners who went too deep were claimed. Some were changed. Some simply disappeared.\n\nNow the Sleeper is gone, shattered by a sellsword\'s blade. But the passage leads deeper still. And in the silence left behind, something else has begun to stir.',
          artAsset: 'story/story-sleeper-defeat.png',
        },
      ],
    },
  ],
};
