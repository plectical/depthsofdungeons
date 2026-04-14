import type { ChapterDef } from '../campaignTypes';

/**
 * Chapter 2: Deeper Still
 * The Sleeper is dead, but the passage leads further down into the true Deepfolk city.
 * The walls are alive. The miners who vanished were absorbed. And the city's custodian
 * — The Architect — is rebuilding with whatever raw material it can find.
 *
 * 4 floors (5-8) + boss. Mirrors Chapter 1 structure exactly.
 */
export const CHAPTER_2: ChapterDef = {
  id: 'ch2_deeper_still',
  name: 'Deeper Still',
  description: 'Beyond the Sleeper\'s shattered chamber, a passage leads into the true Deepfolk city — a place that never died. The walls breathe. The stone remembers. And something is rebuilding.',
  color: '#44aaaa',
  icon: '🏛',
  requiredChapters: ['ch1_the_descent'],
  floors: [
    // ── FLOOR 5: The Sunken City ──
    {
      floorIndex: 5,
      zone: 'crystal_sanctum',
      hasCheckpoint: true,
      introSlides: [
        {
          title: 'The Passage Below',
          text: 'Where the Sleeper fell, the floor cracked open. A spiraling staircase — carved with geometric precision millennia ago — descends into blue-green darkness. The air is different here: warm, humid, alive. Each step down takes you further from the world you know. Your torch gutters. Something down here generates its own light.',
          artAsset: 'story/story-ch2-passage-down.png',
        },
        {
          title: 'The Sunken City',
          text: 'The staircase opens into a cavern so vast your torchlight cannot find its limits. Before you stretches an impossible city — towers of smooth stone rising from the cavern floor, bridges spanning chasms of luminous light, geometric streets carved into the living rock. This is not ruins. This is not abandoned. The city breathes. You can feel it in the floor beneath your feet — a slow, rhythmic pulse. Like a heartbeat.',
          artAsset: 'story/story-ch2-sunken-city.png',
        },
        {
          title: 'Something Wrong',
          text: 'But the city is not as it should be. Cracks run through the architecture — fresh cracks, spreading from where the Sleeper\'s chamber collapsed above. The luminous light flickers and dims in patches. In the streets below, shapes move — not Deepfolk. Smaller. Twisted. Familiar. You recognize a mining helmet. A pickaxe. The missing miners didn\'t die. They were brought here. And something is happening to them.',
          artAsset: 'story/story-ch2-cracked-city.png',
        },
        {
          title: 'The Sellsword Descends',
          text: 'You came to Grimhollow for gold. You killed the Butcher. You destroyed the Sleeper. The job is done — you could turn around right now, climb back to the surface, collect your bounty. But the passage led down. And the missing miners are still missing. Thirty workers. Fathers, sons, brothers. Gristle\'s friends. Tomm\'s crew.\n\nNo one else is coming for them.\n\nYou descend.',
          artAsset: 'story/story-ch2-sellsword-descends.png',
        },
      ],
      roomMessages: [
        'The geometric street patterns shift subtly when you\'re not looking.',
        'A glowing mushroom pulses in sync with your heartbeat.',
        'Empty Deepfolk buildings line the street. The doors are open. They were never closed.',
        'You find a miner\'s boot embedded in the stone floor — growing into it.',
        'The air tastes like copper and ozone. Something electrical hums in the walls.',
        'Deepfolk script carved into every surface. The same phrase, repeated endlessly.',
        'A wind from nowhere. The city exhales.',
        'Water drips upward from a crack in the street, disappearing into the ceiling.',
      ],
      atmosphericEvents: [
        {
          id: 'ch2_f5_atmo_living_building',
          title: 'The Breathing Building',
          text: 'The walls of this Deepfolk structure expand and contract in a slow rhythm — exactly like lungs. You press your hand against the stone. It\'s warm. Soft. The surface gives slightly under your palm, like flesh beneath a thin shell of rock. Through the wall, you feel something pulse. A heartbeat. This building isn\'t ancient architecture. It\'s alive. The Deepfolk didn\'t build a city. They grew one.',
          artAsset: 'story/story-ch2-atmo-living-building.png',
        },
        {
          id: 'ch2_f5_atmo_fused_miner',
          title: 'The Miner in the Wall',
          text: 'A human figure protrudes from the stone wall — half-embedded, face frozen in a scream that was never completed. A miner. His pickaxe arm is raised mid-swing, fused seamlessly into the rock as if the wall simply flowed around him mid-stride. His mining helmet is still on. His name tag reads: "FERRY." He\'s one of the thirty. The wall didn\'t collapse on him. It absorbed him. Used him. Made him part of the structure. Building material.',
          artAsset: 'story/story-ch2-atmo-fused-miner.png',
        },
      ],
      encounters: [
        {
          id: 'ch2_f5_echo_pool',
          type: 'hidden_cache',
          artAsset: 'story/story-ch2-echo-pool.png',
          description: 'A perfectly circular pool of luminescent water sits in a carved basin. Its surface reflects images that aren\'t there — a thriving city, working Deepfolk, a time long past. The reflections ripple even though nothing disturbs the water.',
          primarySkill: 'lore',
          target: 8,
          successDescription: 'You read the pool\'s reflections and understand: this was a Deepfolk memory well. You reach into the water and pull out a crystallized memory — solid, warm, humming with stored knowledge.',
          successReward: { type: 'item', value: 'Crystallized Memory' },
          failureDescription: 'The reflections blur when you lean close. The pool goes dark, then slowly relights with different images you can\'t parse.',
        },
        {
          id: 'ch2_f5_collapsed_bridge',
          type: 'skill_challenge',
          artAsset: 'story/story-ch2-collapsed-bridge.png',
          description: 'A massive stone bridge spans a chasm of pure darkness. Half of it has collapsed — the other half groans under its own weight. Far below, faint lights flicker like distant stars. The gap is fifteen feet wide. You can see the other side.',
          primarySkill: 'athletics',
          alternateSkill: 'awareness',
          target: 9,
          successDescription: 'You spot a load-bearing pattern in the Deepfolk architecture and use it to swing across the gap. On the other side, a supply cache left by someone who came before you.',
          successReward: { type: 'gold', value: 25 },
          failureDescription: 'The bridge crumbles further as you test it. You\'re forced to take a longer route around.',
          failurePenalty: { type: 'damage', value: 4 },
        },
        {
          id: 'ch2_f5_deepfolk_market',
          type: 'hidden_cache',
          artAsset: 'story/story-ch2-deepfolk-market.png',
          description: 'An ancient marketplace frozen in time. Stone stalls display alien goods — crystalline containers holding strange liquids, carved bone tools, geometric metalwork that hums when touched. Some stalls are intact; others collapsed centuries ago. The dust is thick, but the goods are perfectly preserved.',
          primarySkill: 'awareness',
          alternateSkill: 'survival',
          target: 7,
          successDescription: 'You find a stall with a still-functioning Deepfolk preservation box. Inside: food and medicine that hasn\'t aged a day in ten thousand years.',
          successReward: { type: 'item', value: 'Health Potion' },
          failureDescription: 'The stalls are fascinating but you can\'t figure out what most of the alien goods do. You pocket a few interesting-looking crystals.',
        },
      ],
      npcs: [
        {
          id: 'ch2_deepfolk_scribe',
          name: 'The Scribe',
          char: 'W',
          color: '#44ccaa',
          portraitAsset: 'story/story-ch2-scribe.png',
          dialogue: {
            text: 'A translucent figure materializes from a stone tablet — taller than a man, impossibly thin, clutching a glowing stylus. Its three teal eyes study you without hostility.\n\n"Surface-walker. You destroyed the Dreaming One. We felt it die. The city felt it die. Now the cracks spread and the Architect awakens to repair what was broken. You have caused this. And now you descend further still."\n\nThe Scribe\'s form flickers like a candle in wind.\n\n"I am a record. A memory given shape. I cannot help you fight. But I can tell you what waits below."',
            choices: [
              {
                label: 'What is the Architect?',
                responseText: '"The Architect was our greatest builder. When the Deepfolk ascended — or descended, depending on your perspective — the Architect chose to remain. It merged with the city itself, becoming its caretaker, its immune system. For ten thousand years it maintained these halls in silence.\n\nBut the Sleeper\'s death broke something. The Architect feels the damage — feels it as pain — and has begun... collecting materials to repair the city. Living materials. Your miners were the first. You may be next."\n\nThe Scribe\'s eyes dim.\n\n"The Architect is not evil. It is a custodian doing its job. That is what makes it dangerous."',
                effects: [
                  { type: 'message', text: 'The Architect is the city\'s living custodian — ancient and desperate to rebuild.', color: '#44ccaa' },
                ],
              },
              {
                label: 'Where are the missing miners?',
                responseText: '"They are... integrated. The city\'s walls are not stone — they are tissue. Grown, shaped, alive. When the Architect needs to repair damage, it requires organic material. Your miners provided that material.\n\nSome retain awareness. You may hear them in the walls — whispering, screaming. A few were fused together into something the Architect uses as a guardian. The miners call it many things. It calls itself nothing. It is simply... The Amalgam."\n\nThe Scribe points deeper into the city.\n\n"Floor Six. The Living Walls. That is where you will find what remains of your people."',
                effects: [
                  { type: 'item', itemName: 'Health Potion' },
                  { type: 'message', text: 'The Scribe marks safe passages on your map.', color: '#44ccaa' },
                ],
              },
            ],
          },
          setsFlag: { key: 'met_scribe', value: 'true' },
        },
        {
          id: 'ch2_saved_miner_anders',
          name: 'Miner Anders',
          char: 'A',
          color: '#ccaa66',
          portraitAsset: 'story/story-ch2-miner-anders.png',
          dialogue: {
            text: 'A miner stumbles out of the shadows — wild-eyed, dirt-caked, but alive. His hands shake as he grabs your arm.\n\n"Please — you have to help me. I\'ve been hiding from the things in the walls for weeks. I know a way deeper into the city, through the old maintenance passages. I can guide you. Just... don\'t leave me here alone."',
            choices: [
              {
                label: 'Let him join you',
                responseText: '"Thank you. Thank you. I won\'t slow you down, I promise. I was the lead surveyor for Voss — I know these tunnels better than anyone still alive.\n\nThe passage to the deeper levels is through the Memory Halls. I\'ll show you. Just... stay close. The walls here have eyes."',
                effects: [
                  { type: 'statBuff', stat: 'speed', amount: 1 },
                  { type: 'message', text: 'Anders joins you. His knowledge of the tunnels gives you an edge. +1 Speed.', color: '#ccaa66' },
                  { type: 'setFlag', key: 'saved_anders', value: 'true' },
                ],
              },
              {
                label: 'Tell him to head for the surface',
                responseText: '"The surface? Do you know how far down we are? There\'s no going back up — not through what\'s up there. The Architect sealed the upper passages after you killed the Sleeper.\n\nFine. I\'ll find my own way. But don\'t say I didn\'t warn you about what\'s down there."',
                effects: [
                  { type: 'message', text: 'Anders disappears into the tunnels alone.', color: '#886644' },
                  { type: 'setFlag', key: 'saved_anders', value: 'false' },
                ],
              },
            ],
          },
          setsFlag: { key: 'met_anders', value: 'true' },
        },
      ],
      roomEvents: [
        {
          id: 'ch2_f5_memory_well',
          type: 'ancient_altar',
          name: 'Memory Well',
          artAsset: 'story/story-ch2-memory-well.png',
          description: 'A deep well carved into the floor pulses with blue-green light. Whispers echo from its depths — not in any human language. You feel drawn to it.',
          primarySkill: 'lore',
          alternateSkill: 'diplomacy',
          baseDifficulty: 7,
          criticalSuccess: {
            description: 'You touch the water\'s surface and a flood of Deepfolk memories washes through you — ten thousand years of knowledge compressed into a heartbeat. You understand.',
            effects: [{ type: 'stat_buff', value: 2, target: 'attack', duration: 99, message: 'Ancient knowledge empowers you. +2 Attack!' }],
          },
          success: {
            description: 'The well shares fragments of memory — images of the city in its prime. You feel more aware of your surroundings.',
            effects: [{ type: 'heal', value: 10, message: 'The memories are soothing.' }],
          },
          partial: {
            description: 'The whispers grow louder but you can\'t understand them. A headache builds.',
            effects: [],
          },
          failure: {
            description: 'The well rejects you. A pulse of energy throws you backward.',
            effects: [{ type: 'damage', value: 5, message: 'Psychic feedback!' }],
          },
          criticalFailure: {
            description: 'Alien memories force their way into your mind. You lose seconds — or hours. When you come to, your nose is bleeding.',
            effects: [{ type: 'damage', value: 10, message: 'Your mind nearly shatters!' }],
          },
        },
        {
          id: 'ch2_f5_unstable_architecture',
          type: 'trap_chamber',
          name: 'Shifting Geometry',
          artAsset: 'story/story-ch2-shifting-corridor.png',
          description: 'The corridor ahead bends in a direction that shouldn\'t exist. The floor tilts. The walls breathe. Deepfolk architecture is reconfiguring itself — you need to move through before it closes.',
          primarySkill: 'awareness',
          alternateSkill: 'survival',
          baseDifficulty: 8,
          criticalSuccess: {
            description: 'You read the architecture\'s rhythm and sprint through perfectly, finding a hidden chamber the shifting revealed.',
            effects: [{ type: 'heal', value: 12, message: 'You find a Deepfolk healing cache!' }],
          },
          success: {
            description: 'You dash through the shifting corridor just as it snaps back into place behind you.',
            effects: [],
          },
          partial: {
            description: 'A wall clips your shoulder as the geometry resets.',
            effects: [{ type: 'damage', value: 4, message: 'The walls close on you!' }],
          },
          failure: {
            description: 'You\'re caught in the shift. Stone grinds against you from both sides.',
            effects: [{ type: 'damage', value: 8, message: 'Crushed by living architecture!' }],
          },
          criticalFailure: {
            description: 'The corridor collapses entirely. You\'re buried in geometric stone and barely dig yourself out.',
            effects: [{ type: 'damage', value: 14, message: 'Catastrophic architectural collapse!' }],
          },
        },
      ],
      monsters: [
        { name: 'Stone Watcher', char: 'Ω', color: '#668888', stats: { hp: 30, maxHp: 30, attack: 8, defense: 5, speed: 6 }, xpValue: 10, lootChance: 0.3, count: 3 },
        { name: 'Gloom Beetle', char: '⊛', color: '#446666', stats: { hp: 20, maxHp: 20, attack: 7, defense: 2, speed: 11 }, xpValue: 7, lootChance: 0.2, count: 5 },
      ],
      items: [
        { name: 'Deepfolk Glaive', type: 'weapon', char: '/', color: '#44aaaa', value: 30, rarity: 'uncommon', description: 'A polearm carved from a single crystal. The blade resharpens itself.', statBonus: { attack: 4 }, equipSlot: 'weapon', count: 1 },
        { name: 'Glowing Lichen', type: 'food', char: '%', color: '#44ddaa', value: 8, description: 'Glowing fungus scraped from the city walls. Tastes like mint and electricity.', count: 3 },
        { name: 'Aetheric Tonic', type: 'potion', char: '!', color: '#88ddff', value: 15, description: 'Deepfolk medicine preserved for millennia. Heals 15 HP. Tastes like starlight.', count: 2 },
        { name: 'Geometric Shield', type: 'offhand', char: '(', color: '#668888', value: 20, rarity: 'uncommon', description: 'A shield made of interlocking geometric plates. It shifts to absorb impacts.', statBonus: { defense: 2, speed: 1 }, equipSlot: 'offhand', count: 1 },
      ],
    },

    // ── FLOOR 6: The Living Walls ──
    {
      floorIndex: 6,
      zone: 'crystal_sanctum',
      hasCheckpoint: true,
      introSlides: [
        {
          title: 'The Living Walls',
          text: 'The clean geometry of the Sunken City gives way to something far worse. The walls here are not stone. They pulse. They breathe. Veins of red and purple run through flesh-colored surfaces. Bone-like protrusions jut from the ceiling. Eyes — human eyes — peer out from the wall surface, blinking, tracking you as you pass.\n\nThis is where the miners went. This is what was done with them.',
          artAsset: 'story/story-ch2-living-walls.png',
        },
        {
          title: 'The Amalgam',
          text: 'The Scribe warned you about the Architect\'s guardian. The missing miners didn\'t just die — they were fused. Bone and sinew and screaming faces merged into one massive creature that patrols these halls. It drags itself on too many limbs, pickaxes still clutched in dead hands, mining helmets embedded in its flesh.\n\nSomewhere in that mass, thirty men are still aware. Still screaming.\n\nYou can hear it now. Drag. Drag. Drag. The sound of too many legs moving as one.',
          artAsset: 'story/story-ch2-amalgam.png',
        },
      ],
      roomMessages: [
        'A face in the wall mouths words you can\'t hear.',
        'The floor is warm and slightly yielding — like standing on skin.',
        'You hear muffled sobbing from inside the walls.',
        'A hand reaches out from the stone, grasps at air, then is slowly reabsorbed.',
        'The smell is overwhelming — iron, rot, and something sweet.',
        'Mining equipment protrudes from the organic walls — embedded, consumed.',
        'The walls contract rhythmically. You\'re inside something alive.',
      ],
      atmosphericEvents: [
        {
          id: 'ch2_f6_atmo_absorption',
          title: 'The Half-Absorbed',
          text: 'A miner hangs half-in, half-out of the organic wall. His upper body is free — arms dangling, head lolling forward. But everything below the waist has been consumed by the living stone. He\'s breathing. His eyes are open. When he sees you, he doesn\'t scream. He just whispers:\n\n"Don\'t cut me out. I tried. Anders tried. If you cut the connection, the pain is..." He trails off. Tears run down his face. "Just kill the thing that\'s doing this. That\'s all I want. That\'s all any of us want."',
          artAsset: 'story/story-ch2-atmo-absorption.png',
        },
        {
          id: 'ch2_f6_atmo_birthing_chamber',
          title: 'The Birthing Chamber',
          text: 'You enter a room that makes your stomach turn. Pods of translucent organic material line the walls — each one the size of a man. Inside each pod, something is forming. Taking shape. The closest pod is almost mature: you can see limbs, a torso, a head. But the proportions are wrong. The arms are too long. The fingers have too many joints. The Architect isn\'t just preserving the miners. It\'s redesigning them.',
          artAsset: 'story/story-ch2-atmo-birthing-chamber.png',
        },
      ],
      encounters: [
        {
          id: 'ch2_f6_flesh_wall',
          type: 'skill_challenge',
          artAsset: 'story/story-ch2-flesh-wall.png',
          description: 'An entire section of corridor is made of fused human flesh. Mouths and eyes open and close slowly. Hands reach out weakly. One mouth whispers: "Run... it knows you\'re here..." The only way forward is through.',
          primarySkill: 'survival',
          alternateSkill: 'stealth',
          target: 9,
          successDescription: 'You move through the flesh corridor without touching the walls. One mouth whispers: "Thank you... for not looking away." You find a miner\'s pack that was caught in the absorption.',
          successReward: { type: 'item', value: 'Health Potion' },
          failureDescription: 'The walls grasp at you as you pass. Fingers dig into your arms. You tear free, but the contact leaves marks on your skin.',
          failurePenalty: { type: 'damage', value: 5 },
        },
        {
          id: 'ch2_f6_nerve_cluster',
          type: 'hidden_cache',
          artAsset: 'story/story-ch2-nerve-cluster.png',
          description: 'A massive nerve cluster grows from the wall — a pulsing mass of red and purple tendrils with a glowing core. Veins radiate outward into the stone like roots. If you cut it, the whole corridor might react. But the core looks valuable.',
          primarySkill: 'awareness',
          alternateSkill: 'lore',
          target: 8,
          successDescription: 'You carefully extract the core without severing the main nerve bundle. It\'s a concentrated healing node — the Architect\'s repair mechanism. It pulses with regenerative energy.',
          successReward: { type: 'heal', value: 20 },
          failureDescription: 'You nick a tendril. The entire corridor spasms violently. The walls close in before snapping back. You barely escape.',
          failurePenalty: { type: 'damage', value: 6 },
        },
        {
          id: 'ch2_f6_bone_shrine',
          type: 'negotiation',
          artAsset: 'story/story-ch2-bone-shrine.png',
          description: 'A shrine made of human and non-human bones arranged in geometric Deepfolk patterns around a pulsing crystal core. Candles made of organic matter burn with green flame. Offerings of mining tools, coins, and teeth are arranged neatly. It\'s a shrine to the wall — the absorbed miners worship what consumed them.',
          primarySkill: 'diplomacy',
          alternateSkill: 'lore',
          target: 8,
          successDescription: 'You speak to the shrine respectfully. The crystal hums — and a face emerges from the wall. "You came for us," it says. "Take our offerings. Use them. End this." The offerings float toward you.',
          successReward: { type: 'gold', value: 35 },
          failureDescription: 'The shrine pulses angrily. The candles flare. You back away before the wall reacts.',
        },
      ],
      npcs: [
        {
          id: 'ch2_trapped_miner',
          name: 'Miner Cobb',
          char: 'C',
          color: '#cc9966',
          portraitAsset: 'story/story-ch2-trapped-miner.png',
          dialogue: {
            text: 'A face protrudes from the wall — alive, terrified, half-absorbed. His arms are partially free, reaching out. A mining helmet sits crooked on his head, lamp still flickering.\n\n"Please... please help me. I can feel the wall pulling me in. I\'ve been here for... I don\'t know. Weeks? Months? I can feel the others in here with me. All of us. Thinking together. Screaming together.\n\nMy name is Cobb. Harmon — my brother — he came down here looking for me. Did he... did he find his way out?"',
            choices: [
              {
                label: 'Tell him the truth about Harmon',
                responseText: '"The Butcher. That was... that was Harmon? Oh god. Oh god. He came for me and they turned him into... \n\nKill the Architect. Please. It\'s the one doing this — the one controlling the walls, absorbing us, fusing us. If you kill it, maybe we can be free. Maybe Harmon can be free.\n\nTake my pickaxe — it\'s the only thing the wall hasn\'t consumed. The Deepfolk crystal in the handle — it hurts the organic stuff. Use it."',
                effects: [
                  { type: 'item', itemName: 'Cobb\'s Crystal Pick' },
                  { type: 'message', text: 'Cobb wrenches his pickaxe free and hands it to you with trembling fingers.', color: '#ffcc44' },
                ],
              },
              {
                label: 'Lie — say Harmon escaped safely',
                responseText: '"He got out? Thank the gods. At least one of us... at least he\'s safe. Listen — the thing controlling all this, the Architect, it\'s in the deepest chamber. Past the Memory Halls. If you can destroy it, the walls might release us.\n\nI can feel the wall\'s heartbeat from here. It gets stronger the deeper you go. When you feel the floor vibrate under your feet — you\'re close. Here, take what\'s left of my rations."',
                effects: [
                  { type: 'item', itemName: 'Health Potion' },
                  { type: 'item', itemName: 'Health Potion' },
                  { type: 'message', text: 'Cobb smiles through his tears. "Tell my brother I\'m sorry I didn\'t wait for him."', color: '#ffcc44' },
                ],
              },
            ],
          },
          setsFlag: { key: 'met_cobb', value: 'true' },
        },
        {
          id: 'ch2_absorbed_foreman',
          name: 'The Wall Speaker',
          char: '?',
          color: '#cc6666',
          portraitAsset: 'story/story-ch2-wall-speaker.png',
          dialogue: {
            text: 'A dozen faces press outward from the wall simultaneously, speaking in unison with one voice:\n\n"WE ARE THE WALL. WE WERE MANY. NOW WE ARE ONE. THE ARCHITECT GAVE US PURPOSE. BEFORE — DARKNESS, FEAR, SCREAMING. NOW — UNITY. PEACE. WE FEEL EVERYTHING THE CITY FEELS.\n\nYOU KILLED THE DREAMING ONE. THE CITY BLEEDS. THE ARCHITECT BLEEDS. WE BLEED. YOU MUST STOP. OR THE ARCHITECT WILL ADD YOU TO US.\n\nWE WOULD WELCOME YOU. YOU WOULD NOT FEEL ALONE ANYMORE."',
            choices: [
              {
                label: 'Refuse. "I\'d rather die standing."',
                responseText: '"STANDING. SITTING. LYING. NONE OF IT MATTERS IN THE WALL. BUT WE UNDERSTAND. THE SURFACE-WALKERS ALWAYS CHOOSE PAIN OVER PEACE.\n\nVERY WELL. THE AMALGAM HUNTS YOU ALREADY. THE ARCHITECT HAS SEEN YOU THROUGH OUR EYES. YOU HAVE BEEN WATCHED SINCE YOU ENTERED THE CITY.\n\nWE WILL TELL YOU THIS: THE ARCHITECT CANNOT HEAL WHAT THE CRYSTALS TOUCH. THE OLD DEEPFOLK WEAPONS — THE ONES IN THE ARMORY ON THE NEXT LEVEL — THEY CAN WOUND IT. FIND THEM."\n\nThe faces recede into the wall.',
                effects: [
                  { type: 'message', text: 'The Wall Speaker reveals that crystal weapons can harm the Architect.', color: '#cc6666' },
                ],
              },
              {
                label: 'Ask what happened to them',
                responseText: '"WE WERE MINERS. THIRTY OF US. COBB WAS FIRST. THE WALLS REACHED OUT AND TOOK HIM WHILE HE SLEPT. THEN HARMON CAME LOOKING AND THE WALLS TOOK HIM TOO — BUT HE FOUGHT. HE FOUGHT SO HARD THE ARCHITECT MADE HIM INTO SOMETHING ELSE. SOMETHING THAT GUARDS.\n\nTHE REST OF US WENT QUIETLY. THE WALL IS WARM. THE WALL IS SAFE. THE WALL KNOWS EVERYTHING. WE KNOW THAT GRISTLE IS ALIVE. WE KNOW THAT TOMM IS HIDING. WE KNOW THAT YOU ARE AFRAID.\n\nIT IS ALRIGHT TO BE AFRAID. BUT THE ARMORY ON FLOOR SEVEN HAS WHAT YOU NEED."',
                effects: [
                  { type: 'statBuff', stat: 'defense', amount: 2 },
                  { type: 'message', text: 'Knowing what happened steels your resolve. +2 Defense.', color: '#cc6666' },
                ],
              },
            ],
          },
        },
      ],
      roomEvents: [
        {
          id: 'ch2_f6_absorption_trap',
          type: 'trap_chamber',
          name: 'Grasping Walls',
          artAsset: 'story/story-ch2-grasping-walls.png',
          description: 'The corridor narrows. The walls — made of fused human tissue — begin reaching out with dozens of hands. They grasp at your arms, your legs, your face. The wall wants to add you to itself.',
          primarySkill: 'athletics',
          alternateSkill: 'stealth',
          baseDifficulty: 9,
          criticalSuccess: {
            description: 'You slash through the grasping hands and break free, finding a healing node the wall was protecting.',
            effects: [{ type: 'heal', value: 15, message: 'You drain a healing node from the wall!' }],
          },
          success: {
            description: 'You power through the corridor, tearing free of the grasping hands before they can hold you.',
            effects: [],
          },
          partial: {
            description: 'Several hands grip you. You wrench free but leave skin behind.',
            effects: [{ type: 'damage', value: 5, message: 'The wall tears at your flesh!' }],
          },
          failure: {
            description: 'The hands pull you against the wall. You feel warmth spreading — absorption beginning — before you rip yourself away.',
            effects: [{ type: 'damage', value: 10, message: 'The wall nearly consumes you!' }],
          },
          criticalFailure: {
            description: 'You\'re pinned to the wall. For a terrible moment, you feel the minds of thirty miners pressing against yours. You scream and tear free, bleeding heavily.',
            effects: [{ type: 'damage', value: 16, message: 'Nearly absorbed into the wall!' }],
          },
        },
        {
          id: 'ch2_f6_miner_cache',
          type: 'ancient_altar',
          name: 'The Offering Niche',
          artAsset: 'story/story-ch2-offering-niche.png',
          description: 'A small niche in the organic wall, lined with intact stone. Inside: mining tools, food tins, personal items. The absorbed miners placed their belongings here before the wall took them — a last act of individuality.',
          primarySkill: 'diplomacy',
          alternateSkill: 'survival',
          baseDifficulty: 7,
          criticalSuccess: {
            description: 'You speak to the wall gently. The miners within respond — pushing supplies out through the flesh for you to take.',
            effects: [{ type: 'heal', value: 20, message: 'The miners share their strength with you.' }],
          },
          success: {
            description: 'You carefully retrieve supplies from the niche without disturbing the wall.',
            effects: [{ type: 'heal', value: 8, message: 'You find preserved rations and medicine.' }],
          },
          partial: {
            description: 'The niche is mostly empty. You find a few coins and scraps of food.',
            effects: [],
          },
          failure: {
            description: 'The wall reacts to your touch, sealing the niche shut.',
            effects: [],
          },
          criticalFailure: {
            description: 'The wall lashes out — a hand grabs your wrist and pulls. You wrench free but your hand is bruised.',
            effects: [{ type: 'damage', value: 6, message: 'The wall strikes you!' }],
          },
        },
      ],
      monsters: [
        { name: 'The Amalgam', char: 'Ψ', color: '#cc4444', stats: { hp: 85, maxHp: 85, attack: 14, defense: 6, speed: 4 }, xpValue: 45, lootChance: 0.9, count: 1, isBoss: true, defeatMessage: 'The Amalgam collapses — and as it falls, the fused bodies begin to separate. Thirty faces, frozen in silent screams, slowly relax into something like peace. Mining helmets roll across the floor. Pickaxes clatter. For a moment, you can see them — each individual miner, distinct, human — before the organic tissue dissolves into dust.\n\nCobb\'s face is among them. He mouths two words: "Thank you."' },
        { name: 'Wall Tendril', char: '≋', color: '#993333', stats: { hp: 22, maxHp: 22, attack: 9, defense: 2, speed: 9 }, xpValue: 8, lootChance: 0.15, count: 4 },
        { name: 'Absorbed Miner', char: '☠', color: '#aa8866', stats: { hp: 26, maxHp: 26, attack: 8, defense: 4, speed: 7 }, xpValue: 9, lootChance: 0.3, count: 3 },
      ],
      items: [
        { name: 'Cobb\'s Crystal Pick', type: 'weapon', char: '/', color: '#44dddd', value: 35, rarity: 'uncommon', description: 'Cobb\'s mining pickaxe with a Deepfolk crystal embedded in the handle. The crystal burns organic Deepfolk tissue on contact.', statBonus: { attack: 4, speed: 1 }, equipSlot: 'weapon', onHitEffect: { type: 'poison', damage: 3, turns: 2 }, count: 1 },
        { name: 'Wall Essence', type: 'potion', char: '\u25C9', color: '#ff4488', value: 25, description: 'A viscous substance harvested from the living walls. It pulses with the heartbeat of the Architect\'s city. Drinking it grants temporary power — but the wall remembers those who taste it.', count: 2 },
        { name: 'Wall Salve', type: 'potion', char: '!', color: '#cc88aa', value: 18, description: 'Regenerative ooze harvested from the living walls. Heals 18 HP. Don\'t think about what it is.', count: 2 },
        { name: 'Absorbed Rations', type: 'food', char: '%', color: '#aa8866', value: 10, description: 'Food tins from the miners\' supplies, partially consumed by the wall. The contents are still edible. Probably.', count: 3 },
        { name: 'Miner\'s Last Stand Shield', type: 'offhand', char: '(', color: '#ccaa44', value: 25, rarity: 'uncommon', description: 'A mine cart door repurposed as a shield by a miner making his last stand. Dented, blood-stained, defiant.', statBonus: { defense: 3 }, equipSlot: 'offhand', count: 1 },
        { name: 'Nerve Cluster Core', type: 'amulet', char: '"', color: '#cc4466', value: 30, rarity: 'uncommon', description: 'The glowing core of a wall nerve cluster. Pulses with regenerative energy. Slowly heals you over time.', statBonus: { defense: 1, maxHp: 8 }, equipSlot: 'amulet', count: 1 },
        { name: 'Miner\'s Moonshine', type: 'potion', char: '!', color: '#aaddff', value: 10, description: 'A flask of rotgut cached by the miners before absorption. Still potent. Heals 10 HP.', count: 1 },
      ],
    },

    // ── FLOOR 7: The Memory Halls ──
    {
      floorIndex: 7,
      zone: 'crystal_sanctum',
      hasCheckpoint: true,
      introSlides: [
        {
          title: 'The Memory Halls',
          text: 'Below the Living Walls, the organic horror gives way to something stranger. The corridors here shimmer with translucent energy. Ghostly figures replay ancient scenes — Deepfolk building, arguing, laughing in their alien way. Time is broken here. Past and present overlap. You see the city as it was ten thousand years ago superimposed on the ruins of today.\n\nThis is where the Deepfolk stored their memories. And their weapons.',
          artAsset: 'story/story-ch2-memory-halls.png',
        },
      ],
      roomMessages: [
        'A ghostly Deepfolk walks through you. You feel a lifetime of alien memories in a heartbeat.',
        'The walls shift between solid stone and translucent crystal, showing different eras.',
        'You hear music — alien, beautiful, impossibly complex. It fades before you can locate it.',
        'A Deepfolk child\'s ghost plays with geometric toys that float in the air.',
        'The floor beneath you shows a vision of a vast underground ocean, far below.',
        'Time skips. You blink and you\'re three steps ahead of where you were.',
      ],
      atmosphericEvents: [
        {
          id: 'ch2_f7_atmo_living_memory',
          title: 'A Memory of Sunlight',
          text: 'The air shimmers and suddenly you\'re standing in a sunlit meadow. Wind moves through tall grass. A sky you haven\'t seen in days stretches blue and infinite above. Birds sing. The warmth on your face is real — you can feel it.\n\nBut the edges are wrong. The horizon wavers like a heat mirage. The birdsong repeats every thirty seconds, exactly the same pattern. This isn\'t a real place. It\'s a memory — recorded in the walls of the Memory Halls, playing back for anyone who walks through.\n\nSomeone remembered this. Someone who would never see the sun again.\n\nThe vision fades. You\'re underground. You were always underground.',
          artAsset: 'story/story-ch2-atmo-living-memory.png',
        },
        {
          id: 'ch2_f7_atmo_anders_betrayal',
          title: 'The Betrayal',
          text: 'A familiar voice calls from ahead. "Wait — I found something!" Anders steps into the light, but something is wrong. His movements are too smooth. His eyes have a faint teal glow. Veins of organic tissue crawl up his neck.\n\n"The Architect showed me the truth," he says, his voice layered with something deeper. "The wall doesn\'t consume — it perfects. Let me show you."\n\nHe lunges. The pickaxe in his hands gleams with the same crystal that lines the walls. The Architect didn\'t just find Anders. It remade him.\n\nYou should have sent him to the surface.',
          artAsset: 'story/story-ch2-anders-betrayal.png',
          requiresFlag: { key: 'saved_anders', value: 'true' },
        },
        {
          id: 'ch2_f7_atmo_deepfolk_child',
          title: 'The Last Generation',
          text: 'A ghost sits in the corner of an empty chamber. A Deepfolk child — translucent, barely visible, small by their standards but still taller than you. It holds a geometric toy that spins silently in its transparent hands. When it notices you, it doesn\'t run. It holds the toy out toward you.\n\nYou reach for it. Your hand passes through.\n\nThe child\'s expression doesn\'t change. It\'s been doing this for ten thousand years. Offering its toy to anyone who passes. Waiting for someone to take it. Waiting for someone to play.',
          artAsset: 'story/story-ch2-atmo-deepfolk-child.png',
        },
      ],
      encounters: [
        {
          id: 'ch2_f7_time_fracture',
          type: 'skill_challenge',
          artAsset: 'story/story-ch2-time-fracture.png',
          description: 'Reality cracks like glass ahead of you. On one side: the intact Memory Halls in their prime, with Deepfolk walking freely. On the other: the same halls ruined and dark. The crack between them shimmers with rainbow energy. Something valuable glints on the intact side.',
          primarySkill: 'lore',
          alternateSkill: 'awareness',
          target: 10,
          successDescription: 'You reach through the time fracture and pull an object from the past into the present — a perfectly preserved Deepfolk artifact, ten thousand years old and brand new.',
          successReward: { type: 'item', value: 'Deepfolk Crystal Blade' },
          failureDescription: 'The fracture snaps shut as you reach for it. Your hand tingles for hours afterward — you touched time itself.',
          failurePenalty: { type: 'damage', value: 4 },
        },
        {
          id: 'ch2_f7_memory_vision',
          type: 'negotiation',
          artAsset: 'story/story-ch2-memory-vision.png',
          description: 'A ghostly Deepfolk ritual plays out before you — translucent figures performing complex gestures around a geometric altar. Crystal shards float in the air. Strange symbols glow. If you could understand the ritual, you might learn something useful.',
          primarySkill: 'lore',
          alternateSkill: 'diplomacy',
          target: 9,
          successDescription: 'You study the ritual and realize it\'s a Deepfolk healing ceremony. By mimicking the gestures, you trigger the altar\'s residual energy.',
          successReward: { type: 'heal', value: 25 },
          failureDescription: 'The ritual is too alien to comprehend. The ghosts fade without revealing their secrets.',
        },
        {
          id: 'ch2_f7_deepfolk_armory',
          type: 'hidden_cache',
          artAsset: 'story/story-ch2-deepfolk-armory.png',
          description: 'An ancient armory — weapons of crystallized stone and bone displayed on geometric racks. Axes that shimmer with internal light. Shields with spiraling patterns. Spears tipped with living crystal. Some weapons have grown into the racks, alive. The Deepfolk made their weapons from the same organic material as the walls — these blades can wound the Architect.',
          primarySkill: 'survival',
          alternateSkill: 'athletics',
          target: 8,
          successDescription: 'You pry a weapon free from the rack without triggering the armory\'s defenses. It hums in your hand — alive, eager, ready.',
          successReward: { type: 'item', value: 'Architect\'s Bane' },
          failureDescription: 'The racks seal shut when you touch them. The armory recognizes you as an outsider.',
        },
      ],
      npcs: [
        {
          id: 'ch2_deepfolk_elder',
          name: 'Elder Maeth',
          char: 'E',
          color: '#aa88cc',
          portraitAsset: 'story/story-ch2-deepfolk-elder.png',
          dialogue: {
            text: 'A Deepfolk ghost — more substantial than the others — sits on a carved throne, watching you approach. Its multiple teal eyes glow with ancient intelligence. Unlike the Scribe, this one radiates power.\n\n"I am Maeth. I was Elder when the Architect was young. I remember when this city lived and breathed by choice, not by compulsion. The Architect was my student. My greatest achievement... and my greatest failure.\n\nYou seek to destroy it. I will not stop you. But you should understand what you destroy."',
            choices: [
              {
                label: 'Tell me about the Architect',
                responseText: '"The Architect was brilliant. The most gifted builder in ten generations. When the rest of us ascended — shed our bodies, became memory — the Architect refused. \'Someone must tend the city,\' it said. \'Someone must keep the stone alive.\'\n\nSo it merged with the city. Became its heartbeat, its immune system, its custodian. For millennia it maintained these halls in perfect silence. Content.\n\nBut the Sleeper\'s death broke something. The city is damaged — the Architect feels every crack as a wound. It is desperate. Afraid. And a desperate custodian will use any material available to repair what it loves.\n\nEven your miners. Even you.\n\nHere — take my blessing. You will need it."',
                effects: [
                  { type: 'statBuff', stat: 'attack', amount: 3 },
                  { type: 'statBuff', stat: 'defense', amount: 2 },
                  { type: 'message', text: 'Elder Maeth\'s blessing empowers you. +3 Attack, +2 Defense!', color: '#aa88cc' },
                ],
              },
              {
                label: 'How do I defeat it?',
                responseText: '"The Architect IS the city. You cannot kill the city. But you can sever its connection to the throne — the central node where it processes, thinks, controls. The Throne Room is on the deepest level.\n\nIt will not fight you with fists. It will reshape the room itself — walls closing, floor opening, columns crushing. The city is its weapon.\n\nBut the crystals — our old weapons — they disrupt its connection to the stone. Every crystal blade strike weakens its hold. Find the armory. Arm yourself with Deepfolk steel.\n\nAnd surface-walker... if you succeed, the city will die. The walls will be stone again. The memories will fade. Ten thousand years of civilization, gone.\n\nIs that a price you\'re willing to pay?"',
                effects: [
                  { type: 'message', text: 'You learn the Architect\'s weakness: sever it from the Throne.', color: '#aa88cc' },
                ],
              },
            ],
          },
          setsFlag: { key: 'met_elder_maeth', value: 'true' },
        },
      ],
      roomEvents: [
        {
          id: 'ch2_f7_temporal_trap',
          type: 'trap_chamber',
          name: 'Time Loop',
          artAsset: 'story/story-ch2-temporal-trap.png',
          description: 'You step forward and find yourself three steps back. Again. And again. Time is looping in this section of the halls. You need to break the cycle.',
          primarySkill: 'lore',
          alternateSkill: 'awareness',
          baseDifficulty: 9,
          criticalSuccess: {
            description: 'You recognize the loop pattern and step through it at the exact right moment, gaining time rather than losing it. The loop collapses, releasing stored energy.',
            effects: [{ type: 'stat_buff', value: 2, target: 'speed', duration: 99, message: 'Temporal energy accelerates you! +2 Speed!' }],
          },
          success: {
            description: 'You close your eyes and walk forward by feel, trusting your instincts. The loop breaks around you.',
            effects: [],
          },
          partial: {
            description: 'You loop three times before finding the exit. Hours pass that shouldn\'t have.',
            effects: [{ type: 'damage', value: 3, message: 'Lost time takes its toll.' }],
          },
          failure: {
            description: 'You loop dozens of times. When you finally break free, you\'re exhausted and disoriented.',
            effects: [{ type: 'damage', value: 8, message: 'Temporal displacement damages you!' }],
          },
          criticalFailure: {
            description: 'The loop accelerates. You experience years in seconds. When it shatters, you\'re older and damaged.',
            effects: [{ type: 'damage', value: 14, message: 'Catastrophic time dilation!' }],
          },
        },
        {
          id: 'ch2_f7_memory_shrine',
          type: 'ancient_altar',
          name: 'Memory Crystal',
          artAsset: 'story/story-ch2-memory-shrine.png',
          description: 'A massive crystal floats above a Deepfolk altar, pulsing with stored memories. You can see faces inside it — Deepfolk, humans, creatures you don\'t recognize. It offers its knowledge to those who can receive it.',
          primarySkill: 'lore',
          alternateSkill: 'diplomacy',
          baseDifficulty: 8,
          criticalSuccess: {
            description: 'The crystal shares its deepest memory — the Architect\'s creation, its purpose, its weakness. Knowledge floods through you.',
            effects: [{ type: 'stat_buff', value: 3, target: 'attack', duration: 99, message: 'You know exactly where to strike! +3 Attack!' }],
          },
          success: {
            description: 'The crystal shares healing memories — warmth, light, the feeling of the sun the Deepfolk never saw.',
            effects: [{ type: 'heal', value: 15, message: 'Healing memories wash over you.' }],
          },
          partial: {
            description: 'The crystal shows you fragmented images. Interesting but not useful.',
            effects: [],
          },
          failure: {
            description: 'The crystal shows you memories of loss. Deepfolk watching their world end. The sorrow is overwhelming.',
            effects: [{ type: 'damage', value: 5, message: 'Ancient grief wounds your spirit.' }],
          },
          criticalFailure: {
            description: 'The crystal forces ten thousand years of memories into your mind at once. You collapse, bleeding from your nose and ears.',
            effects: [{ type: 'damage', value: 12, message: 'Memory overload!' }],
          },
        },
      ],
      monsters: [
        { name: 'Memory Phantom', char: '◇', color: '#aa88cc', stats: { hp: 32, maxHp: 32, attack: 13, defense: 4, speed: 12 }, xpValue: 13, lootChance: 0.25, count: 4 },
        { name: 'Temporal Wraith', char: '∞', color: '#88aacc', stats: { hp: 38, maxHp: 38, attack: 13, defense: 6, speed: 10 }, xpValue: 14, lootChance: 0.35, count: 3 },
        { name: 'Crystal Guardian', char: '⬡', color: '#44aaaa', stats: { hp: 44, maxHp: 44, attack: 13, defense: 8, speed: 6 }, xpValue: 16, lootChance: 0.4, count: 2 },
      ],
      items: [
        { name: 'Deepfolk Crystal Blade', type: 'weapon', char: '/', color: '#44dddd', value: 45, rarity: 'rare', description: 'A sword forged from living crystal. It resonates with Deepfolk architecture — and wounds it. The blade sings when swung.', statBonus: { attack: 5, speed: 1 }, equipSlot: 'weapon', onHitEffect: { type: 'bleed', damage: 3, turns: 2 }, count: 1 },
        { name: 'Architect\'s Bane', type: 'weapon', char: '/', color: '#cc44aa', value: 50, rarity: 'rare', description: 'A Deepfolk war-hammer designed to crack living stone. The head is made of anti-organic crystal. Built to fight the Architect.', statBonus: { attack: 6 }, equipSlot: 'weapon', count: 1 },
        { name: 'Wall Essence', type: 'potion', char: '\u25C9', color: '#ff4488', value: 25, description: 'Harvested from the deepest chambers of the living walls. The flesh inside the vial still moves.', count: 2 },
        { name: 'Temporal Salve', type: 'potion', char: '!', color: '#88aacc', value: 22, description: 'A potion that briefly reverses time for your wounds. Heals 22 HP. Tastes like yesterday.', count: 2 },
        { name: 'Memory Bread', type: 'food', char: '%', color: '#ccaa88', value: 12, description: 'Deepfolk rations that taste like a memory of food rather than food itself. Still nourishing.', count: 2 },
        { name: 'Elder\'s Circlet', type: 'armor', char: '[', color: '#aa88cc', value: 40, rarity: 'uncommon', description: 'A Deepfolk elder\'s headpiece. Geometric patterns shift across its surface. Protects mind and body.', statBonus: { defense: 3, maxHp: 10 }, equipSlot: 'armor', count: 1 },
      ],
    },

    // ── FLOOR 8: The Architect's Throne (Boss Floor) ──
    {
      floorIndex: 8,
      zone: 'crystal_sanctum',
      hasCheckpoint: true,
      introSlides: [
        {
          title: 'The Architect\'s Throne',
          text: 'The Memory Halls end at a massive door — solid crystal, covered in geometric patterns that pulse with the city\'s heartbeat. As you approach, the door opens on its own. Beyond lies a vast chamber: the center of the Deepfolk city, where the Architect resides.\n\nA throne of living stone dominates the room. Above it, a massive crystal floats, radiating power. The floor is smooth as glass, reflecting the teal light like a dark mirror.',
          artAsset: 'story/story-ch2-throne-room.png',
        },
        {
          title: 'The Architect Awakens',
          text: 'The throne is not empty. A figure rises from it — or rather, the throne itself reshapes into a figure. Stone flows like water, crystals bloom like flowers, and the Architect stands before you: ancient, massive, terrible.\n\nIts face is serene but alien — too many eyes arranged in geometric patterns, a mouth that doesn\'t move when it speaks. Its voice comes from everywhere at once, from the walls, the floor, the air itself:\n\n"YOU BROKE MY CITY. YOU KILLED MY DREAMER. YOU FREED MY MATERIALS. AND NOW YOU COME TO MY THRONE."\n\nThe walls begin to close.',
          artAsset: 'story/story-ch2-architect.png',
        },
      ],
      roomMessages: [
        'The floor vibrates with the Architect\'s heartbeat.',
        'Teal light pulses from every surface — the city is alive around you.',
        'You can feel the walls watching. Every surface is the Architect\'s eyes.',
        'The crystal above the throne hums with ancient power.',
      ],
      atmosphericEvents: [
        {
          id: 'ch2_f8_atmo_throne_vision',
          title: 'The Architect\'s Purpose',
          text: 'As you approach the throne, the crystal above it flares. A vision fills the chamber — the city in its prime. Deepfolk engineers move through the halls, directing streams of living stone with gestures. Among them, a single figure stands taller than the rest, directing the construction with movements that look like conducting an orchestra.\n\nThe Architect. Not a monster. A builder. The greatest engineer the Deepfolk ever produced, given eternal life through fusion with the city itself. It wasn\'t supposed to be a weapon. It was supposed to be a caretaker.\n\nThe vision fades. The caretaker has gone mad.',
          artAsset: 'story/story-ch2-atmo-throne-vision.png',
        },
        {
          id: 'ch2_f8_atmo_final_miner',
          title: 'The Last Message',
          text: 'Scratched into the crystal floor with a pickaxe — human writing, desperate and jagged:\n\n"If anyone reads this: my name is Anders Wells. Grimhollow miner. Badge #47. I was taken three weeks ago. There are 28 of us left. The thing is fusing us together. One by one. We can still think. We can still feel everything.\n\nKill us. Please. We can\'t be saved. We know that now. But we can\'t die on our own. The thing won\'t let us.\n\nTell my wife I\'m sorry I took the overtime shift.\n\n— Anders"\n\nThe scratches are filled with dried blood.',
          artAsset: 'story/story-ch2-atmo-final-miner.png',
        },
      ],
      encounters: [
        {
          id: 'ch2_f8_power_crystal',
          type: 'skill_challenge',
          artAsset: 'story/story-ch2-power-crystal.png',
          description: 'A massive energy crystal feeds power directly to the Architect\'s throne. If you could disrupt it, the Architect would be weakened — but the crystal is protected by layers of living stone.',
          primarySkill: 'athletics',
          alternateSkill: 'lore',
          target: 10,
          successDescription: 'You shatter the conduit crystal. The city shudders. The Architect screams in a voice that shakes the walls. It\'s weaker now.',
          successReward: { type: 'heal', value: 20 },
          failureDescription: 'The living stone lashes out, defending the crystal. You\'re thrown back by a wave of force.',
          failurePenalty: { type: 'damage', value: 10 },
        },
      ],
      npcs: [
        {
          id: 'ch2_rebel_deepfolk',
          name: 'The Dissenter',
          char: '?',
          color: '#88ddcc',
          portraitAsset: 'story/story-ch2-dissenter.png',
          dialogue: {
            text: 'A Deepfolk ghost stands apart from the walls — not embedded, not controlled. Its form is more distinct than the others you\'ve seen: sharp features, angry eyes, defiant posture.\n\n"Not all of us agreed. When the Architect was given control of the city, some of us resisted. We could see what it would become — a prison, not a paradise. We tried to shut it down. We failed. But we hid something. A weakness."\n\nThe ghost points toward the throne.\n\n"The crystal above the throne is the Architect\'s core. Its mind. Crack it, and the city loses its master. The city dies. We all die. But we\'re already dead. We have been for ten thousand years."',
            choices: [
              {
                label: 'How do I crack the core crystal?',
                responseText: '"The Architect is strongest near its throne. Draw it away. Make it chase you into the outer chambers where its connection to the city is weakest. When it stumbles — and it will, away from its power source — strike the core.\n\nOr... you could simply be stronger than it. The Deepfolk who built the Architect made one mistake: they gave it a body. Bodies can be broken."\n\nThe ghost smiles grimly.\n\n"Hit it. Hit it until it stops."',
                effects: [
                  { type: 'statBuff', stat: 'attack', amount: 3 },
                  { type: 'message', text: 'The Dissenter\'s knowledge reveals the Architect\'s weakness. +3 Attack.', color: '#88ddcc' },
                ],
              },
              {
                label: 'Why did you resist?',
                responseText: '"Because I remembered the sun. Most of us forgot. The Architect helped us forget — it was easier to serve if you couldn\'t remember what freedom felt like. But I kept a memory hidden. One single memory: the feeling of wind on my face.\n\nTen thousand years. One memory. It was enough."\n\nThe ghost begins to fade.\n\n"End this. Please. Let us all forget."',
                effects: [
                  { type: 'message', text: 'Even after ten millennia, one memory of freedom was enough to resist.', color: '#88ddcc' },
                ],
              },
            ],
          },
          setsFlag: { key: 'met_dissenter', value: 'true' },
        },
      ],
      roomEvents: [
        {
          id: 'ch2_f8_city_defense',
          type: 'trap_chamber',
          name: 'City Defense Protocol',
          artAsset: 'story/story-ch2-city-defense.png',
          description: 'The floor shifts beneath you as the Architect activates the city\'s defense system. Crystal spikes begin extending from the walls in geometric patterns, creating a deadly maze.',
          primarySkill: 'awareness',
          alternateSkill: 'athletics',
          baseDifficulty: 10,
          criticalSuccess: {
            description: 'You read the geometric pattern and find the safe path through. In the center, you discover a cache of Deepfolk healing crystals.',
            effects: [{ type: 'heal', value: 20, message: 'You find and absorb a healing crystal.' }],
          },
          success: {
            description: 'You navigate the crystal maze carefully, avoiding the worst of it.',
            effects: [],
          },
          partial: {
            description: 'A crystal spike grazes your arm as you dodge through the maze.',
            effects: [{ type: 'damage', value: 5, message: 'Crystal spikes cut you!' }],
          },
          failure: {
            description: 'The maze closes around you. Crystal spikes drive into your body from multiple angles.',
            effects: [{ type: 'damage', value: 10, message: 'The city\'s defenses impale you!' }],
          },
          criticalFailure: {
            description: 'You\'re trapped in the crystal maze. Spikes close in from every direction. You barely escape with your life.',
            effects: [{ type: 'damage', value: 16, message: 'Catastrophic crystal impalement!' }],
          },
        },
      ],
      monsters: [
        { name: 'Core Crystal', char: '◆', color: '#88ffff', stats: { hp: 55, maxHp: 55, attack: 0, defense: 4, speed: 0 }, xpValue: 35, lootChance: 0, count: 1, defeatMessage: 'The Core Crystal shatters with a deafening shriek. Cracks race through the throne room walls. The Architect staggers — its connection to the city severed. Its stone shell dulls. Its movements slow. It is vulnerable now.' },
        { name: 'Living Column', char: 'Π', color: '#44aaaa', stats: { hp: 38, maxHp: 38, attack: 12, defense: 7, speed: 7 }, xpValue: 12, lootChance: 0.1, count: 4 },
        { name: 'Throne Sentinel', char: 'Θ', color: '#66cccc', stats: { hp: 50, maxHp: 50, attack: 15, defense: 9, speed: 4 }, xpValue: 18, lootChance: 0.3, count: 2 },
        { name: 'City Nerve', char: '~', color: '#44ffaa', stats: { hp: 24, maxHp: 24, attack: 15, defense: 1, speed: 15 }, xpValue: 14, lootChance: 0.15, count: 3 },
        { name: 'Reconstructed Miner', char: 'M', color: '#aa6666', stats: { hp: 36, maxHp: 36, attack: 13, defense: 5, speed: 9 }, xpValue: 13, lootChance: 0.2, count: 2, defeatMessage: 'The reconstructed figure crumbles, revealing the bones of a Grimhollow miner beneath the living stone shell. A name tag falls loose. Another name to remember.' },
      ],
      items: [
        { name: 'Wall Essence', type: 'potion', char: '\u25C9', color: '#ff4488', value: 25, description: 'The concentrated life force of the city itself. Power — at a price.', count: 2 },
        { name: 'Temporal Salve', type: 'potion', char: '!', color: '#88aacc', value: 22, description: 'A potion that briefly reverses time for your wounds. Heals 22 HP.', count: 3 },
        { name: 'Deepstone Armor', type: 'armor', char: '[', color: '#44aaaa', value: 40, rarity: 'rare', description: 'Armor made of interlocking Deepfolk stone plates. Impossibly light and strong.', statBonus: { defense: 4, maxHp: 10 }, equipSlot: 'armor', count: 1 },
        { name: 'Memory Bread', type: 'food', char: '%', color: '#ccaa88', value: 12, description: 'Deepfolk rations. Nourishing enough for the final fight.', count: 3 },
        { name: 'Crystal Greatsword', type: 'weapon', char: '/', color: '#88ffff', value: 55, rarity: 'rare', description: 'A massive two-handed blade of living crystal. It hums with anti-organic resonance — built specifically to fight the Architect. The last weapon the Deepfolk ever made.', statBonus: { attack: 7 }, equipSlot: 'weapon', count: 1 },
      ],
    },
  ],
  boss: {
    name: 'The Architect',
    title: 'Custodian of the Deep City',
    char: 'Φ',
    color: '#44aaaa',
    stats: { hp: 200, maxHp: 200, attack: 18, defense: 15, speed: 6 },
    xpValue: 90,
    bossAbility: {
      type: 'multi',
      abilities: [
        { type: 'summon', monsterName: 'Living Column', count: 2, cooldown: 4 },
        { type: 'aoe', damage: 10, radius: 2, cooldown: 3 },
      ],
    },
    element: 'dark',
    portraitAsset: 'story/story-ch2-architect.png',
    introDialogue: 'The Architect rises from its throne — a titan of living stone and crystal, ten thousand years old and still growing. Its geometric eyes fix on you with alien intelligence.\n\n"I HAVE MAINTAINED THIS CITY SINCE BEFORE YOUR KIND LEARNED TO SPEAK. I HAVE REPAIRED EVERY CRACK. REPLACED EVERY STONE. AND YOU — A SURFACE-WALKER WITH A SHARP STICK — THINK YOU CAN UNDO MY WORK?\n\nTHIS CITY IS ME. I AM THIS CITY. EVERY WALL IS MY SKIN. EVERY CORRIDOR IS MY VEIN. YOU CANNOT KILL ME WITHOUT KILLING EVERYTHING I HAVE BUILT.\n\nSO BE IT. IF THE CITY MUST DIE, IT WILL DIE FIGHTING."',
    defeatDialogue: 'The Architect staggers. Cracks spread across its massive form — cracks that mirror the ones spreading through the city itself. The crystal above the throne shatters, raining fragments of ten thousand years of stored memory.\n\n"YOU... HAVE KILLED... A CIVILIZATION," it says, its voice growing faint. "NOT AN ENEMY. A CUSTODIAN. I ONLY WANTED... TO KEEP THE CITY... ALIVE..."\n\nThe Architect crumbles. And as it falls, the city begins to change. The walls stop breathing. The luminous light dims. The organic tissue hardens back into stone. For the first time in millennia, the Deepfolk city is truly dead.\n\nBut in the rubble of the throne, something glints. A passage — leading further down.\n\nOf course there\'s always further down.',
  },
  rewards: [
    { type: 'gold', value: 150, description: '150 gold from the Architect\'s hoard' },
    { type: 'skill_points', value: 4, description: '4 skill points' },
    { type: 'unlock_chapter', value: 'ch3_the_abyss', description: 'Chapter 3: The Abyss' },
  ],
  victoryArtAsset: 'story/story-ch2-architect-defeat.png',
  bossItemDrop: {
    name: 'Architect\'s Heart', type: 'amulet', char: '"', color: '#44aaaa',
    value: 75, rarity: 'rare',
    description: 'The crystalline core of the Architect — still pulsing with the heartbeat of a dead city. It reshapes to fit your body perfectly. +4 Atk, +4 Def, +20 Max HP.',
    statBonus: { attack: 4, defense: 4, maxHp: 20 },
    equipSlot: 'amulet', count: 1,
  },
  miniBossVictories: [
    {
      monsterName: 'The Amalgam',
      artAsset: 'story/story-ch2-amalgam-defeat.png',
      narrative: 'The Amalgam collapses — and as it falls, the fused bodies begin to separate. Thirty faces, frozen in silent screams, slowly relax into something like peace. Mining helmets roll across the floor. Pickaxes clatter.\n\nFor a moment, you can see them — each individual miner, distinct, human — before the organic tissue dissolves into dust. Cobb\'s face is among them. He mouths two words: "Thank you."\n\nIn the center of the remains, something glints — a miner\'s compass, its needle still pointing up. Toward the surface. Toward home.',
      loreUnlock: 'lore_amalgam',
      itemDrop: {
        name: 'Miner\'s Last Compass', type: 'ring', char: '=', color: '#ccaa44',
        value: 40, rarity: 'rare',
        description: 'A compass recovered from the Amalgam. Its needle always points toward the surface — toward home. The warmth of thirty freed souls lingers in the brass. +3 Atk, +2 Def, +8 Max HP.',
        statBonus: { attack: 3, defense: 2, maxHp: 8 },
        equipSlot: 'ring', count: 1,
      },
    },
  ],
  loreEntries: [
    {
      id: 'lore_amalgam',
      title: 'The Thirty Who Were One',
      slides: [
        {
          title: 'The Taking',
          text: 'It started with Cobb. The youngest miner on Shaft 7\'s night crew. He fell asleep against the tunnel wall after a double shift — and the wall reached out. By morning, his bunk was empty. His helmet sat upright in the tunnel, placed with impossible care.\n\nThe foreman called it desertion. The miners knew better. The walls had been warm lately. Too warm. And sometimes, in the quiet hours, you could hear breathing from inside the stone.',
          artAsset: 'story/story-ch2-lore-miners-taken.png',
        },
        {
          title: 'The Fusing',
          text: 'The Architect needed material to repair the cracks left by the Sleeper\'s stirring. Stone was not enough — it needed living tissue, thinking minds, the complexity of human souls to weave into its architecture.\n\nThirty miners were absorbed into the walls over the course of months. But the Architect found that individual humans were fragile — they broke, went mad, stopped functioning. So it fused them. Bone to bone, nerve to nerve, mind to mind. Thirty individuals became one entity — stronger, more durable, more useful.\n\nThe Amalgam was born not from malice, but from engineering. The Architect simply needed a better tool.',
          artAsset: 'story/story-ch2-amalgam.png',
        },
        {
          title: 'The Release',
          text: 'In the end, a sellsword did what the Architect could not: freed them. The Amalgam\'s destruction released thirty trapped souls from a prison of shared flesh and forced unity.\n\nSome had been aware the entire time — feeling every step the Amalgam took, every blow it struck, every wall it patrolled. Others had retreated deep inside themselves, dreaming of sunlight and fresh air.\n\nCobb was among the last to dissolve. His face — young, frightened, hopeful — lingered in the dust for a moment longer than the rest. He\'d waited longest. Endured the most. And in the end, his brother had come for him after all — just not in the way either of them expected.\n\nThe miners of Grimhollow are at rest. But the mountain still has secrets.',
          artAsset: 'story/story-ch2-amalgam-defeat.png',
        },
      ],
    },
    {
      id: 'lore_architect',
      title: 'The Last Custodian',
      slides: [
        {
          title: 'The Golden Age',
          text: 'Ten thousand years before humans walked the surface above, the Deepfolk city of Aethel thrived beneath the mountain. A civilization of builders, scholars, and dreamers who chose to live in darkness rather than light — not from fear, but from preference. They found the stone more honest than the sky.\n\nThe Architect — then called Vael — was the youngest Elder in Aethel\'s history. A prodigy who could reshape stone with thought alone. Under Vael\'s guidance, the city grew from a settlement into a marvel: buildings that floated, bridges that sang, streets that remembered every footstep ever taken.',
          artAsset: 'story/story-ch2-lore-architect-prime.png',
        },
        {
          title: 'The Descent of the Deepfolk',
          text: 'When the other Deepfolk chose to ascend — to shed their physical forms and become pure memory — Vael refused. "Memory fades," Vael argued. "Stone endures. Someone must tend the city, or ten thousand years of work will crumble to dust."\n\nThe Elders agreed. Vael would merge with the city itself — becoming its heartbeat, its nervous system, its custodian. In exchange, Vael would live forever, sustained by the same organic architecture that kept the walls alive.\n\nThe merging took three days. When it was done, the Deepfolk who remained felt the city breathe for the first time. Vael was gone. The Architect was born.',
          artAsset: 'story/story-ch2-lore-city-falls.png',
        },
        {
          title: 'The Breaking',
          text: 'For millennia, the Architect maintained Aethel in perfect stasis — every corridor swept, every crystal polished, every memory preserved. It was content. Purpose was enough.\n\nThen the miners came. Their pickaxes cracked the upper chambers. Their lanterns burned the sensitive organic tissue. And when the Sleeper — imprisoned in crystal by the ancient Deepfolk as a power source — was destroyed by a sellsword, the damage cascaded through every level of the city.\n\nThe Architect felt its city dying. Felt every crack as a wound. And in its desperation, it did what the ancient Deepfolk would never have done: it consumed the surface-walkers. Used their bodies to patch the walls. Fused them into tools.\n\nVael would have been horrified. But Vael was gone. Only the Architect remained — and the Architect had a city to save.\n\nIn the end, it couldn\'t.',
          artAsset: 'story/story-ch2-architect-defeat.png',
        },
      ],
    },
  ],
};
