import type { ChapterDef } from '../campaignTypes';

/**
 * Chapter 3: The Lost World
 * Beneath the ruins of the Architect's city lies something older — a primordial cavern
 * where time flows differently and ancient creatures hunt in glowing jungles.
 * The Deepfolk called it The Garden. Something ancient waits at its heart.
 *
 * 5 floors (9-13) + boss. Mirrors Chapter 1/2 structure exactly.
 */
export const CHAPTER_3: ChapterDef = {
  id: 'ch3_the_lost_world',
  name: 'The Lost World',
  description: 'Beneath the ruins of the Architect\'s city lies something older — a primordial cavern where time flows differently and ancient creatures hunt in glowing jungles. The Deepfolk called it The Garden. Something ancient waits at its heart.',
  color: '#44cc44',
  icon: '🦖',
  requiredChapters: ['ch2_deeper_still'],
  floors: [
    // ── FLOOR 9: The Overgrowth ──
    {
      floorIndex: 9,
      zone: 'fungal_marsh',
      hasCheckpoint: false,
      introSlides: [
        {
          title: 'The Garden Gate',
          text: 'Beyond the Architect\'s shattered throne, the passage descends through layers of dead stone — and then, without warning, erupts into green. Roots thick as pillars burst through the rock. Vines drip with glowing sap. The air is hot, humid, and heavy with the smell of growing things. You\'ve entered a cavern so vast it has its own weather — clouds of spores drift through shafts of blue-green light from luminescent fungi the size of houses.',
          artAsset: 'story/story-ch3-garden-gate.png',
        },
        {
          title: 'The Luminous Jungle',
          text: 'The Deepfolk called this place The Garden. A sealed world, leagues below the surface, sustained by deep earth-fires and a web of fungal networks older than any civilisation. Everything here glows — the plants, the water, the insects that drift like living lanterns through the canopy. The air tastes of copper and green growing things. Life down here didn\'t stop when the sun disappeared. It adapted. It changed. It became something else entirely.',
          artAsset: 'story/story-ch3-bioluminescent-jungle.png',
        },
        {
          title: 'The First Sighting',
          text: 'A shape moves through the ferns ahead — low to the ground, fast, scaled. Your hand goes to your weapon. The creature pauses, raises its head above the undergrowth, and regards you with an amber eye older than the race of men. A great lizard. Massive. Built for hunting. It flicks a forked tongue, decides you\'re not food — not yet — and vanishes into the glowing jungle.\n\nDinosaurs. The Deepfolk\'s Garden preserved what the surface forgot.',
          artAsset: 'story/story-ch3-first-sighting.png',
        },
      ],
      roomMessages: [
        'Glowing spores drift through the air like slow-motion fireflies.',
        'Something large pushes through the undergrowth nearby. The ferns sway and settle.',
        'A vine recoils when you touch it — the plants here are semi-aware.',
        'Claw marks in the bark of a fungal tree. Four parallel grooves, deep as your finger.',
        'The ground vibrates with distant footsteps. Something very heavy is walking.',
        'You find shed scales the size of dinner plates. Iridescent green.',
        'A nest of eggs lies abandoned in a hollow. Each egg is warm to the touch.',
        'The air hums with insect song — alien, rhythmic, almost musical.',
      ],
      atmosphericEvents: [
        {
          id: 'ch3_f9_atmo_giant_ferns',
          title: 'The Fern Cathedral',
          text: 'You step into a clearing dominated by ferns the size of oak trees. Their fronds arch overhead, forming a living cathedral of green and blue light. Water drips from the tips in slow, heavy drops that glow where they land. The floor is carpeted in soft moss that springs back underfoot. It\'s beautiful — impossibly beautiful for a place that has never seen sunlight. The Deepfolk didn\'t just preserve life down here. They curated it. This is a garden in the truest sense, tended for millennia by hands that are now dust.',
          artAsset: 'story/story-ch3-atmo-fern-cathedral.png',
        },
        {
          id: 'ch3_f9_atmo_spore_clouds',
          title: 'The Glowing Spores',
          text: 'A massive fungal structure — thirty feet tall, shaped like an inverted umbrella — releases a cloud of luminescent spores. They fill the cavern air like golden snow, drifting on thermal currents from the vents below. Each spore glows with its own soft light, and where they settle, new growth begins immediately — tiny ferns uncoiling, moss spreading, roots reaching. You\'re watching creation on fast-forward. Life in The Garden doesn\'t wait. It rushes.',
          artAsset: 'story/story-ch3-atmo-spore-clouds.png',
        },
      ],
      encounters: [
        {
          id: 'ch3_f9_hidden_nest',
          type: 'hidden_cache',
          artAsset: 'story/story-ch3-hidden-nest.png',
          description: 'A cluster of leathery eggs sits in a depression lined with warm moss. The shells are translucent — you can see shapes curling inside. Something is watching from the treeline.',
          primarySkill: 'awareness',
          target: 8,
          successDescription: 'You spot the mother lurking in the ferns and back away slowly. She relaxes. In her abandoned hunting cache nearby, you find preserved meat and a strange serum.',
          successReward: { type: 'item', value: 'Dino Serum' },
          failureDescription: 'You step too close. A guttural hiss from the undergrowth sends you scrambling.',
        },
        {
          id: 'ch3_f9_vine_bridge',
          type: 'skill_challenge',
          artAsset: 'story/story-ch3-vine-bridge.png',
          description: 'A chasm splits the cavern floor — twenty feet across, darkness below. Thick vines span the gap, woven into a rough bridge by something with deliberate intelligence. The vines creak under your weight.',
          primarySkill: 'athletics',
          alternateSkill: 'awareness',
          target: 7,
          successDescription: 'You distribute your weight carefully and cross without incident. On the other side, a cache of supplies left by a previous explorer.',
          successReward: { type: 'item', value: 'Moss Potion' },
          failureDescription: 'A vine snaps. You lurch sideways, catching yourself but scraping your hands raw.',
          failurePenalty: { type: 'damage', value: 4 },
        },
      ],
      npcs: [
        {
          id: 'ch3_dr_maren',
          name: 'Elara the Naturalist',
          char: 'M',
          color: '#88cc88',
          portraitAsset: 'story/story-ch3-dr-maren.png',
          dialogue: {
            text: '"Don\'t — don\'t run. I\'m human. I\'m real. My name is Elara. I\'m a naturalist from the Academy of Letters — or I was, before I found this place. I\'ve been down here for... three weeks? Four? Time moves strangely in The Garden.\n\nI came through a different entrance — a collapsed section near the eastern ridge. I wasn\'t expecting great lizards. Nobody was. But here they are. Preserved in a sealed cavern since before recorded history, kept alive by some ancient magic.\n\nAnd the serums — you\'ve seen the serums? The Deepfolk were experimenting. Alchemical transmutation. The serums can change your very flesh. Make you stronger. Faster. But take too many and... well, I\'ve seen what happens."',
            choices: [
              {
                label: 'What happens if you take too many serums?',
                responseText: '"The serums reshape your body with old magic. One or two doses give you sharper reflexes, denser bones, keener senses. But six doses? Seven? Your body starts... changing. Scales. Claws. Your pupils go vertical. Your teeth sharpen.\n\nThe Deepfolk used the serums to create guardians — hybrid soldiers that could survive down here. But the transformation cannot be undone. After a certain point, you stop being human and start being something else entirely.\n\nI\'ve written everything down in my journal. Here — take my field notes. They\'ll help you identify which plants are safe. And please, be careful with those serums."',
                effects: [
                  { type: 'statBuff', stat: 'speed', amount: 2 },
                  { type: 'message', text: 'Elara\'s field notes reveal safe paths. +2 Speed.', color: '#88cc88' },
                ],
              },
              {
                label: 'What\'s deeper in The Garden?',
                responseText: '"Something old. Older than the great lizards. Older than the Deepfolk. The cavern gets stranger the deeper you go — the creatures get bigger, the plants grow more savage, and the air grows thick with spores.\n\nAt the very bottom, there\'s a chamber the Deepfolk called The Primordial Heart. Their carvings describe it as \'the place where life began.\' I haven\'t been brave enough to venture there myself. The raptors patrol the hunting grounds in packs, and beyond that... I\'ve heard roaring. Deep, resonant, ancient.\n\nWhatever made that sound has been alive for a very long time. Here — take these supplies. You\'ll need them more than I will."',
                effects: [
                  { type: 'item', itemName: 'Jungle Berries' },
                  { type: 'item', itemName: 'Moss Potion' },
                  { type: 'message', text: 'Elara shares her supplies and warns of the Progenitor.', color: '#88cc88' },
                ],
              },
            ],
          },
          setsFlag: { key: 'met_dr_maren', value: 'true' },
        },
      ],
      roomEvents: [
        {
          id: 'ch3_f9_spore_trap',
          type: 'trap_chamber',
          name: 'Spore Trap',
          artAsset: 'story/story-ch3-spore-trap.png',
          description: 'The ground ahead is carpeted with bulbous fungi — each one swollen with pressurized spores. One wrong step and the whole corridor erupts in a choking cloud of toxic gas.',
          primarySkill: 'survival',
          alternateSkill: 'awareness',
          baseDifficulty: 7,
          criticalSuccess: {
            description: 'You identify the trigger fungi and navigate through without disturbing a single spore. In the cleared path, you find a cache of preserved berries.',
            effects: [{ type: 'heal', value: 12, message: 'You find medicinal berries among the fungi.' }],
          },
          success: {
            description: 'You move carefully, stepping only on bare stone. The fungi remain dormant.',
            effects: [],
          },
          partial: {
            description: 'A spore pod bursts under your heel. You hold your breath but inhale a wisp of toxin.',
            effects: [{ type: 'damage', value: 3, message: 'Toxic spores sting your lungs!' }],
          },
          failure: {
            description: 'You trigger a chain reaction. Pods erupt in sequence, filling the corridor with choking green gas.',
            effects: [{ type: 'damage', value: 7, message: 'The spore cloud overwhelms you!' }],
          },
          criticalFailure: {
            description: 'The entire corridor detonates. You\'re engulfed in a cloud so thick you can\'t see your hands. When it clears, you\'re on your knees, coughing blood.',
            effects: [{ type: 'damage', value: 12, message: 'Catastrophic spore inhalation!' }],
          },
        },
      ],
      monsters: [
        { name: 'Jungle Gecko', char: 'g', color: '#66cc66', stats: { hp: 28, maxHp: 28, attack: 10, defense: 4, speed: 13 }, xpValue: 10, lootChance: 0.2, count: 5 },
        { name: 'Fern Stalker', char: 'f', color: '#448844', stats: { hp: 35, maxHp: 35, attack: 12, defense: 5, speed: 10 }, xpValue: 12, lootChance: 0.3, count: 4 },
      ],
      items: [
        { name: 'Jungle Berries', type: 'food', char: '%', color: '#cc44cc', value: 8, description: 'Plump glowing berries that grow in clusters on the cavern floor. They taste like blackberries crossed with lightning.', count: 4 },
        { name: 'Moss Potion', type: 'potion', char: '!', color: '#44cc88', value: 12, description: 'A potion brewed from The Garden\'s regenerative moss. Heals 12 HP. Glows faintly green.', count: 2 },
        { name: 'Vine Whip', type: 'weapon', char: '/', color: '#44aa44', value: 20, description: 'A length of semi-living vine, braided and hardened. It snaps with surprising force.', statBonus: { attack: 3 }, equipSlot: 'weapon', count: 1 },
      ],
    },

    // ── FLOOR 10: The Hunting Grounds ──
    {
      floorIndex: 10,
      zone: 'fungal_marsh',
      hasCheckpoint: true,
      introSlides: [
        {
          title: 'The Hunting Grounds',
          text: 'The jungle thins into an open cavern — a vast savannah of luminous grass stretching toward distant walls lost in haze. Herds of massive creatures graze in the blue-green light, their silhouettes ancient beyond reckoning. Three-horned giants. Duckbilled grazers. Things that have no business existing. The air smells of warm earth and animal musk. Somewhere in the grass, something is watching the herds. Waiting.',
          artAsset: 'story/story-ch3-hunting-grounds.png',
        },
        {
          title: 'Pack Hunters',
          text: 'You find tracks in the soft earth — three-toed, clawed, spaced in the cadence of a runner. Not one set. Six. They fan out in a formation you recognize from military tactics: flanking positions. These aren\'t mindless predators. They hunt in coordinated packs, communicating with clicks and hisses that echo across the grassland. You\'re not the apex predator here. Not even close.',
          artAsset: 'story/story-ch3-pack-hunters.png',
        },
      ],
      roomMessages: [
        'The grass sways in patterns that don\'t match the wind. Something is moving through it.',
        'A distant bellow echoes across the cavern. A territorial call.',
        'You find a half-eaten carcass. The bones are cracked for marrow. Recent.',
        'Raptor clicks echo from multiple directions. You\'re being tracked.',
        'A watering hole ahead reflects the luminous ceiling like a mirror of stars.',
        'Stampede tracks cross the path — something drove the herd through here in panic.',
        'The grass here is flattened in a circle. A nest. Recently vacated.',
      ],
      atmosphericEvents: [
        {
          id: 'ch3_f10_atmo_stampede_tracks',
          title: 'The Stampede Path',
          text: 'A swathe of destruction cuts across the grassland — crushed plants, churned earth, deep footprints overlapping in chaos. Something triggered a stampede. Hundreds of animals, judging by the tracks, running in blind terror. The earth is still warm from their passing. At the edge of the path, you find what spooked them: raptor tracks. Just three sets. Three hunters sent an entire herd into panic.\n\nThese creatures have been perfecting their craft since before the age of men. Every hunt is a masterpiece.',
          artAsset: 'story/story-ch3-atmo-stampede.png',
        },
        {
          id: 'ch3_f10_atmo_watering_hole',
          title: 'The Gathering',
          text: 'A natural spring feeds a pool of crystal-clear water, ringed by luminous reeds. Creatures of every size gather here — an uneasy truce enforced by thirst. A massive three-horn drinks alongside creatures no bigger than dogs. A winged lizard perches on a rock, folding its leathery wings. For a moment, you see The Garden as the Deepfolk intended: a perfect sanctuary, balanced, enduring, beautiful.\n\nThen a raptor\'s head rises from the reeds on the far side. Amber eyes lock onto the smallest creature at the pool. The truce has a time limit.',
          artAsset: 'story/story-ch3-atmo-watering-hole.png',
        },
      ],
      encounters: [
        {
          id: 'ch3_f10_raptor_ambush',
          type: 'skill_challenge',
          artAsset: 'story/story-ch3-raptor-ambush.png',
          description: 'The clicking stops. The grass goes still. Every instinct screams danger. A raptor ambush — you walked right into their kill zone.',
          primarySkill: 'stealth',
          alternateSkill: 'awareness',
          target: 9,
          successDescription: 'You freeze. Control your breathing. The pack sweeps past, focused on larger prey. In their wake, you find a dropped kill — valuable serum vials from a Deepfolk cache they scattered.',
          successReward: { type: 'item', value: 'Dino Serum' },
          failureDescription: 'A raptor lunges from the grass. You dodge, but its claws rake your arm.',
          failurePenalty: { type: 'damage', value: 6 },
        },
        {
          id: 'ch3_f10_trike_standoff',
          type: 'negotiation',
          artAsset: 'story/story-ch3-trike-standoff.png',
          description: 'A three-horn blocks the path — twelve feet at the shoulder, its great horns gleaming, frill flared in warning. It\'s protecting a juvenile behind it. You need to pass without triggering a charge.',
          primarySkill: 'diplomacy',
          alternateSkill: 'survival',
          target: 8,
          successDescription: 'You move slowly, hands open, making no sudden movements. The trike watches you pass, then lowers its frill. The juvenile peers at you with curious eyes. On the ground near their nest, you find scattered coins from a previous explorer.',
          successReward: { type: 'gold', value: 30 },
          failureDescription: 'The trike lowers its head and charges. You dive sideways, barely avoiding three tons of angry herbivore.',
          failurePenalty: { type: 'damage', value: 5 },
        },
      ],
      roomEvents: [
        {
          id: 'ch3_f10_quicksand_pit',
          type: 'trap_chamber',
          name: 'Quicksand Pit',
          artAsset: 'story/story-ch3-quicksand.png',
          description: 'The ground turns soft without warning. Your feet sink. Quicksand — hidden beneath a layer of moss. The more you struggle, the faster you sink.',
          primarySkill: 'athletics',
          alternateSkill: 'survival',
          baseDifficulty: 8,
          criticalSuccess: {
            description: 'You spread your weight instantly, rolling sideways onto solid ground. In the process, you spot a Deepfolk supply cache half-buried at the pit\'s edge.',
            effects: [{ type: 'heal', value: 15, message: 'You find preserved rations in the cache!' }],
          },
          success: {
            description: 'You stop struggling and slowly pull yourself free using a nearby root.',
            effects: [],
          },
          partial: {
            description: 'You sink to your waist before grabbing a vine. The extraction is painful.',
            effects: [{ type: 'damage', value: 4, message: 'The quicksand bruises your legs!' }],
          },
          failure: {
            description: 'You sink to your chest. Panic sets in before you finally wrench yourself free, exhausted.',
            effects: [{ type: 'damage', value: 8, message: 'Nearly swallowed by quicksand!' }],
          },
          criticalFailure: {
            description: 'You sink to your neck. The sand fills your mouth. Something grabs your ankle from below. You barely survive.',
            effects: [{ type: 'damage', value: 14, message: 'The quicksand nearly claims you!' }],
          },
        },
      ],
      monsters: [
        { name: 'Veloci-hunter', char: 'v', color: '#cc6622', stats: { hp: 38, maxHp: 38, attack: 14, defense: 6, speed: 14 }, xpValue: 14, lootChance: 0.3, count: 4 },
        { name: 'Armored Trike', char: 't', color: '#888866', stats: { hp: 50, maxHp: 50, attack: 12, defense: 10, speed: 4 }, xpValue: 16, lootChance: 0.35, count: 2 },
        { name: 'Spitting Diloph', char: 'd', color: '#aa44aa', stats: { hp: 30, maxHp: 30, attack: 15, defense: 4, speed: 11 }, xpValue: 13, lootChance: 0.25, count: 3 },
      ],
      items: [
        { name: 'Dino Serum', type: 'potion', char: '!', color: '#44ff88', value: 25, description: 'A Deepfolk alchemical serum brewed from ancient lizard blood. Reshapes the body with primordial essence. Side effects may include scales, claws, and a craving for raw meat.', count: 2 },
        { name: 'Prehistoric Jerky', type: 'food', char: '%', color: '#aa6633', value: 10, description: 'Smoked meat from a beast that has not walked the surface in living memory. Surprisingly good.', count: 2 },
        { name: 'Raptor Claw', type: 'weapon', char: '/', color: '#cc4422', value: 30, rarity: 'uncommon', description: 'A wickedly curved claw, sharpened and mounted on a handle. The edge never dulls.', statBonus: { attack: 4 }, equipSlot: 'weapon', onHitEffect: { type: 'bleed', damage: 3, turns: 2 }, count: 1 },
      ],
      npcs: [],
    },

    // ── FLOOR 11: The Nesting Cavern (Mini-Boss: Alpha Raptor) ──
    {
      floorIndex: 11,
      zone: 'fungal_marsh',
      hasCheckpoint: false,
      introSlides: [
        {
          title: 'The Nesting Cavern',
          text: 'The hunting grounds narrow into a series of interconnected chambers — warm, humid, thick with the smell of musk and eggshell. Every surface is covered in nests: shallow depressions lined with moss and shed scales, each containing clutches of leathery eggs. Some are cracked and empty. Some are rocking gently. This is where the raptors breed. The heart of the pack.',
          artAsset: 'story/story-ch3-nesting-cavern.png',
        },
        {
          title: 'The Alpha\'s Domain',
          text: 'A deep rumble vibrates through the stone. Not a roar — a warning. The nesting cavern belongs to the Alpha Raptor. Bigger than the others. Smarter. Covered in scars from a lifetime of dominance fights. The pack defers to it absolutely. The eggs are its legacy. And you\'ve just walked into its nursery.\n\nAmber eyes watch you from the shadows. The clicking starts.',
          artAsset: 'story/story-ch3-alpha-domain.png',
        },
      ],
      roomMessages: [
        'Eggshells crunch underfoot. The sound echoes dangerously.',
        'A juvenile raptor hisses at you from a nest, then retreats behind its mother.',
        'The air is thick with pheromones. Your eyes water.',
        'Claw marks score the walls — territorial markers, refreshed daily.',
        'A nest contains three perfect eggs, each warm as a hearthstone.',
        'The clicking is constant now. The pack knows you\'re here.',
      ],
      atmosphericEvents: [
        {
          id: 'ch3_f11_atmo_broken_eggs',
          title: 'The Failed Clutch',
          text: 'A nest sits apart from the others — abandoned, cold. The eggs inside are cracked, but not from hatching. Something crushed them. The shells are stained dark. Around the nest, claw marks gouge the stone in patterns that suggest pacing. Circling. Grief, if a reptile can grieve.\n\nA single intact egg remains, pushed to the center of the nest. Cold. Dead. But the mother hasn\'t left. You can see her shape in the shadows — motionless, guarding nothing, unable to stop.',
          artAsset: 'story/story-ch3-atmo-broken-eggs.png',
        },
        {
          id: 'ch3_f11_atmo_mothers_lament',
          title: 'The Mother\'s Call',
          text: 'A sound fills the nesting cavern — not a roar, not a hiss, but something between a croon and a moan. Low, resonant, heartbreaking. A raptor mother calls to her eggs, her head swaying over the nest in slow arcs. The eggs are fine — healthy, rocking, ready to hatch. But the mother calls as though they\'re already lost.\n\nElara\'s notes mention this: "They know. Some instinct, some ancient memory in their blood. They know they\'re the last of their kind. They know the surface forgot them. They call to eggs that will hatch into a world with no sky."',
          artAsset: 'story/story-ch3-atmo-mothers-lament.png',
        },
      ],
      encounters: [
        {
          id: 'ch3_f11_egg_heist',
          type: 'hidden_cache',
          artAsset: 'story/story-ch3-egg-heist.png',
          description: 'A Deepfolk storage alcove sits behind an active nest. Inside, you can see the glint of preserved supplies. But the nest\'s guardian is alert — three hundred pounds of maternal aggression.',
          primarySkill: 'stealth',
          target: 9,
          successDescription: 'You move with glacial patience, timing each step to the guardian\'s head movements. Your hand closes on a cache of serums and salves without disturbing a single egg.',
          successReward: { type: 'item', value: 'Dino Serum' },
          failureDescription: 'The guardian spots you. A shriek brings two more raptors. You retreat empty-handed.',
        },
        {
          id: 'ch3_f11_nest_defense',
          type: 'skill_challenge',
          artAsset: 'story/story-ch3-nest-defense.png',
          description: 'A collapsing fungal tree threatens to crush a nest of eggs. The mother is frantic, unable to move them in time. If you help, you might earn the pack\'s tolerance.',
          primarySkill: 'survival',
          alternateSkill: 'athletics',
          target: 8,
          successDescription: 'You brace the falling trunk long enough for the mother to relocate her clutch. She regards you with something that might be gratitude. A juvenile drops a glowing stone at your feet — an offering.',
          successReward: { type: 'heal', value: 20 },
          failureDescription: 'The trunk is too heavy. It crashes down, scattering eggs. The mother\'s shriek of rage follows you for a long time.',
          failurePenalty: { type: 'damage', value: 5 },
        },
      ],
      npcs: [
        {
          id: 'ch3_cobb_echo',
          name: 'Cobb\'s Echo',
          char: 'C',
          color: '#8888cc',
          portraitAsset: 'story/story-ch3-cobb-echo.png',
          dialogue: {
            text: 'A translucent figure flickers into view — small, young, with rough miner\'s hands. You\'ve seen this face before. In the walls of the Architect\'s city. In the Butcher\'s locket.\n\n"Still here. Still watching. The wall freed my body but not my ghost. I drift down, always down. And I found this place — The Garden.\n\nSomething lives at the bottom. Something that was here before the Deepfolk, before the dinosaurs, before the stone itself. The Deepfolk called it the Progenitor. They worshipped it as the source of all life.\n\nIt\'s not a god. It\'s worse. It\'s a maker. And it\'s been making things in the dark for a very long time."',
            choices: [
              {
                label: 'What is the Progenitor?',
                responseText: '"The first living thing. Not the first on the surface — the first, period. Born in the deep fires at the bottom of this cavern before anything else existed. It didn\'t grow from something lesser. It shaped all lesser things. Every creature in The Garden — the raptors, the trikes, the things with too many teeth — they\'re all its children. Its creations.\n\nThe Deepfolk found it and tried to understand it. That was their last mistake. You cannot fathom something that has been alive since before the world had a name. It understands you.\n\nBe ready. It knows you\'re coming. It\'s known since you entered The Garden."',
                effects: [
                  { type: 'statBuff', stat: 'attack', amount: 2 },
                  { type: 'message', text: 'Cobb\'s warning steels your resolve. +2 Attack.', color: '#8888cc' },
                ],
              },
              {
                label: 'Is there any way to stop it?',
                responseText: '"The Progenitor is ancient flesh — the oldest living thing that has ever existed, but still flesh. Still bone. Still killable.\n\nIt regenerates. Fast. But its mind — if you can call it that — is centralized. The thing in the center of the chamber that pulses. That\'s where it thinks. Hit that and it stops rebuilding.\n\nThe serums the Deepfolk brewed? They came from the Progenitor. Its blood. Its essence. If you\'ve taken enough of them, it might recognize you. Might hesitate. Might not.\n\nGood luck, sellsword. You\'re going to need it."',
                effects: [
                  { type: 'message', text: 'Cobb fades, leaving the scent of mine dust and regret.', color: '#8866aa' },
                ],
              },
            ],
          },
          setsFlag: { key: 'met_cobb_echo', value: 'true' },
        },
      ],
      roomEvents: [
        {
          id: 'ch3_f11_collapsing_nest',
          type: 'trap_chamber',
          name: 'Collapsing Nest Chamber',
          artAsset: 'story/story-ch3-collapsing-nest.png',
          description: 'The ceiling of the nesting cavern groans. Stalactites crack and fall. The vibration from the Alpha\'s movements has destabilized the chamber — it\'s coming down.',
          primarySkill: 'athletics',
          alternateSkill: 'awareness',
          baseDifficulty: 8,
          criticalSuccess: {
            description: 'You read the collapse pattern and sprint through the one stable corridor. On the other side, a Deepfolk emergency cache, perfectly preserved.',
            effects: [{ type: 'heal', value: 15, message: 'You find ancient healing salves in the cache!' }],
          },
          success: {
            description: 'You dodge the falling stone and scramble through before the ceiling seals behind you.',
            effects: [],
          },
          partial: {
            description: 'A stalactite clips your shoulder. You stagger but keep moving.',
            effects: [{ type: 'damage', value: 4, message: 'Falling stone strikes you!' }],
          },
          failure: {
            description: 'The collapse catches you in its center. Rocks pummel you from every direction.',
            effects: [{ type: 'damage', value: 9, message: 'The ceiling caves in!' }],
          },
          criticalFailure: {
            description: 'You\'re buried under rubble. It takes agonizing minutes to dig yourself free, bleeding and broken.',
            effects: [{ type: 'damage', value: 15, message: 'Catastrophic cave-in!' }],
          },
        },
      ],
      monsters: [
        { name: 'Alpha Raptor', char: 'R', color: '#ff4422', stats: { hp: 120, maxHp: 120, attack: 18, defense: 9, speed: 12 }, xpValue: 50, lootChance: 0.9, count: 1, isBoss: true, defeatMessage: 'The Alpha Raptor staggers, its scarred body finally giving out. It crashes to the stone with a sound like thunder, amber eyes dimming. The pack freezes. For a long, breathless moment, every raptor in the cavern stares at you. Then, one by one, they lower their heads and retreat into the shadows. The pack has a new memory now — the shape of the thing that killed their leader. They won\'t forget.' },
        { name: 'Nest Guardian', char: 'n', color: '#cc8844', stats: { hp: 40, maxHp: 40, attack: 14, defense: 7, speed: 8 }, xpValue: 14, lootChance: 0.3, count: 3 },
        { name: 'Egg Tender', char: 'e', color: '#88aa66', stats: { hp: 22, maxHp: 22, attack: 11, defense: 3, speed: 15 }, xpValue: 9, lootChance: 0.15, count: 5 },
      ],
      items: [
        { name: 'Dino Serum', type: 'potion', char: '!', color: '#44ff88', value: 25, description: 'A Deepfolk alchemical serum brewed from ancient lizard blood. Reshapes the body with primordial essence. Handle with caution.', count: 3 },
        { name: 'Amber Salve', type: 'potion', char: '!', color: '#ffaa44', value: 15, description: 'A healing paste made from fossilized tree resin. Seals wounds instantly and smells like ancient forests.', count: 2 },
        { name: 'Raptor Egg', type: 'food', char: '%', color: '#ccaa66', value: 12, description: 'A leathery raptor egg, still warm. Rich and filling.', count: 2 },
        { name: 'Raptor Scale Armor', type: 'armor', char: '[', color: '#cc6622', value: 35, rarity: 'uncommon', description: 'Armor fashioned from shed raptor scales. Lightweight, flexible, and tougher than steel.', statBonus: { defense: 4, maxHp: 8 }, equipSlot: 'armor', count: 1 },
      ],
    },

    // ── FLOOR 12: The Bone Cathedral ──
    {
      floorIndex: 12,
      zone: 'fungal_marsh',
      hasCheckpoint: true,
      introSlides: [
        {
          title: 'The Bone Cathedral',
          text: 'Below the nesting caverns, the living jungle gives way to something primordial. Bones. Billions of bones. The fossilized remains of creatures that lived and died in The Garden over uncounted ages, compressed into architecture by time and pressure. Ribcages the size of houses arch overhead. Skulls with eye sockets large enough to crawl through line the walls. The Deepfolk carved this place — used the bones as building material, shaped them into halls and chambers of terrible beauty.',
          artAsset: 'story/story-ch3-bone-cathedral.png',
        },
        {
          title: 'The Weight of Ages',
          text: 'Every step here is a step on the dead. The floor is compacted bone — layers upon layers, epoch stacked on epoch. You can see the strata in the walls: the oldest bones at the bottom, twisted and compressed into marble-like smoothness, and the newest near the top, still recognizable as the creatures they came from. This is a cemetery and a cathedral and a history book, written in calcium and measured in aeons.',
          artAsset: 'story/story-ch3-bone-strata.png',
        },
      ],
      roomMessages: [
        'A massive jawbone forms the doorway to the next chamber. You walk between teeth the size of swords.',
        'The bone floor is smooth as marble from millennia of erosion.',
        'Deepfolk carvings cover a fossilized femur the size of a pillar. Prayers for the dead.',
        'Something rattles deeper in the cathedral. Bones shifting. Settling. Or moving.',
        'A fossil river of crystallized marrow runs through the floor, glowing amber.',
        'The skull of something impossibly large watches you pass. Its eye sockets glow faintly green.',
      ],
      atmosphericEvents: [
        {
          id: 'ch3_f12_atmo_singing_bones',
          title: 'The Singing Bones',
          text: 'Wind from the thermal vents passes through hollow bones embedded in the walls — and the cathedral sings. A deep, resonant chord that vibrates through your chest and makes your vision blur. The Deepfolk designed this. They shaped the bones to create specific frequencies, turning the dead into an instrument. The song is mournful, ancient, beautiful. A requiem for every creature that ever lived and died in The Garden.\n\nYou stand still and listen. For a moment, the ages between then and now feel like nothing at all.',
          artAsset: 'story/story-ch3-atmo-singing-bones.png',
        },
        {
          id: 'ch3_f12_atmo_fossil_river',
          title: 'The Amber River',
          text: 'A river of liquid amber flows through a channel carved in the bone floor — fossilized tree resin, liquefied by geothermal heat, carrying the preserved remains of ancient insects and plant matter. Tiny creatures are visible in the flow: wings, legs, antennae, frozen in death but moving with the current. The Deepfolk used this river as a timeline — they could read the insects like pages in a book, each layer telling the story of a different era. Aeons of history, flowing past your feet.',
          artAsset: 'story/story-ch3-atmo-fossil-river.png',
        },
      ],
      encounters: [
        {
          id: 'ch3_f12_bone_bridge',
          type: 'skill_challenge',
          artAsset: 'story/story-ch3-bone-bridge.png',
          description: 'A bridge made from a single massive spine stretches across a chasm. The vertebrae are smooth, treacherous. Far below, the amber river flows — beautiful but fatally hot.',
          primarySkill: 'athletics',
          alternateSkill: 'awareness',
          target: 9,
          successDescription: 'You balance across the spine with practiced precision. On the far side, a Deepfolk offering niche contains preserved supplies and gold.',
          successReward: { type: 'gold', value: 35 },
          failureDescription: 'Your foot slips. You catch yourself on a vertebral process, tearing your palms.',
          failurePenalty: { type: 'damage', value: 5 },
        },
        {
          id: 'ch3_f12_ancient_cache',
          type: 'hidden_cache',
          artAsset: 'story/story-ch3-ancient-cache.png',
          description: 'A sealed Deepfolk vault, built into the eye socket of a titanic skull. The lock is made of interlocking bone discs — a living combination lock.',
          primarySkill: 'lore',
          alternateSkill: 'awareness',
          target: 9,
          successDescription: 'You decipher the bone-disc sequence. The vault opens, revealing Deepfolk weapons and preserved serums — untouched for millennia.',
          successReward: { type: 'item', value: 'Dino Serum' },
          failureDescription: 'The bone discs resist your attempts. The vault remains sealed, its secrets locked in fossilized bone.',
        },
      ],
      roomEvents: [
        {
          id: 'ch3_f12_fossil_collapse',
          type: 'trap_chamber',
          name: 'Fossil Collapse',
          artAsset: 'story/story-ch3-fossil-collapse.png',
          description: 'The bone architecture groans ominously. A massive ribcage-arch above you begins to crack — ages of structural integrity failing at once.',
          primarySkill: 'awareness',
          alternateSkill: 'athletics',
          baseDifficulty: 9,
          criticalSuccess: {
            description: 'You spot the stress fractures before they propagate and find the one safe corridor. The collapse thunders behind you, revealing a hidden Deepfolk chamber.',
            effects: [{ type: 'heal', value: 15, message: 'You find a pristine Deepfolk healing station!' }],
          },
          success: {
            description: 'You read the cracks and move just in time. Bone fragments rain down where you were standing.',
            effects: [],
          },
          partial: {
            description: 'A bone shard the size of your arm clips your leg as you dodge.',
            effects: [{ type: 'damage', value: 5, message: 'Fossil shrapnel cuts you!' }],
          },
          failure: {
            description: 'The ribcage collapses on top of you. Ancient bones hammer your body.',
            effects: [{ type: 'damage', value: 10, message: 'Buried under ancient bones!' }],
          },
          criticalFailure: {
            description: 'The entire section of cathedral comes down. You\'re entombed in the fossil record. Digging out costs you dearly.',
            effects: [{ type: 'damage', value: 16, message: 'Catastrophic fossil collapse!' }],
          },
        },
      ],
      monsters: [
        { name: 'Fossil Titan', char: 'T', color: '#aa8844', stats: { hp: 60, maxHp: 60, attack: 15, defense: 10, speed: 3 }, xpValue: 18, lootChance: 0.4, count: 2 },
        { name: 'Bone Reaver', char: 'b', color: '#ccaa66', stats: { hp: 45, maxHp: 45, attack: 16, defense: 6, speed: 9 }, xpValue: 16, lootChance: 0.3, count: 3 },
        { name: 'Primordial Raptor', char: 'r', color: '#44cc44', stats: { hp: 35, maxHp: 35, attack: 14, defense: 5, speed: 14 }, xpValue: 15, lootChance: 0.25, count: 4 },
      ],
      items: [
        { name: 'Dino Serum', type: 'potion', char: '!', color: '#44ff88', value: 25, description: 'A Deepfolk alchemical serum brewed from ancient lizard blood. Reshapes the body with primordial essence.', count: 2 },
        { name: 'Bone Marrow Tonic', type: 'potion', char: '!', color: '#ffcc88', value: 18, description: 'A restorative brewed from fossilized marrow. Heals 18 HP and strengthens your bones temporarily.', count: 2 },
        { name: 'Dried Fungus', type: 'food', char: '%', color: '#aa8844', value: 10, description: 'Sun-dried cave fungus preserved by the Deepfolk. Chewy but sustaining.', count: 3 },
        { name: 'Fossil Greatsword', type: 'weapon', char: '/', color: '#ccaa44', value: 50, rarity: 'rare', description: 'A massive blade carved from a single fossilized tooth. Time itself forged this weapon — impossibly sharp, impossibly durable.', statBonus: { attack: 6 }, equipSlot: 'weapon', count: 1 },
      ],
      npcs: [],
    },

    // ── FLOOR 13: The Primordial Heart (Boss Floor) ──
    {
      floorIndex: 13,
      zone: 'fungal_marsh',
      hasCheckpoint: true,
      introSlides: [
        {
          title: 'The Primordial Heart',
          text: 'The Bone Cathedral descends into living rock — and then into something that is neither rock nor bone. The walls here pulse with luminous veins. The floor is warm, soft, alive. The air is thick and heavy as water. You\'re walking through flesh. Through the body of something vast. The Primordial Heart isn\'t a chamber. It\'s a beating thing. You\'re inside the oldest living creature in the world.',
          artAsset: 'story/story-ch3-primordial-heart.png',
        },
        {
          title: 'The Progenitor Revealed',
          text: 'It fills the cavern. A mass of flesh and bone and membrane that defies naming — part beast, part plant, part fungus, part something that has no word. Tendrils of tissue connect it to every wall, every surface, every living thing in The Garden. It breathes, and the cavern breathes with it. It pulses, and the glow flares in rhythm.\n\nEyes open across its surface. Not raptor eyes. Not human eyes. Something older. Something that watched the first spark of life kindle and decided to keep it burning.',
          artAsset: 'story/story-ch3-progenitor-revealed.png',
        },
        {
          title: 'The Final Confrontation',
          text: 'A voice fills your mind — not words, but impressions. Images. The feeling of warm volcanic water. The taste of sulfur. The first spark of thought in a world of dead stone. The Progenitor doesn\'t speak. It remembers. And it shares those memories whether you want them or not.\n\nYou understand now. This creature didn\'t just survive the great dyings. It caused them. When its children grew too complex, too independent, too far from its design — it reset. Started over. In a forgotten age, it erased the surface and began again.\n\nThe Garden is its workshop. And you are standing in the middle of its next creation.',
          artAsset: 'story/story-ch3-final-confrontation.png',
        },
      ],
      roomMessages: [
        'The floor pulses beneath you. A heartbeat. Slow. Ancient. Inevitable.',
        'Luminous veins in the walls flare in response to your movement.',
        'The air is so thick and warm it makes you dizzy. Every breath is a rush.',
        'You can feel the Progenitor\'s awareness pressing against your mind. It knows you\'re here.',
      ],
      atmosphericEvents: [
        {
          id: 'ch3_f13_atmo_heart_chamber',
          title: 'The Beating Heart',
          text: 'At the center of the chamber, something massive contracts and expands in a rhythm older than the mountain. The Progenitor\'s heart — if such a simple word can describe an organ the size of a house, networked into every living thing within a mile radius. Each beat sends a pulse of warmth through the floor, the walls, the air itself. Your own heartbeat synchronizes involuntarily. For a terrifying moment, you are part of The Garden. Part of the network. Part of the Progenitor.\n\nYou wrench your mind free. But for that one heartbeat, you felt it — the weight of an eternity of consciousness. The loneliness of being the first.',
          artAsset: 'story/story-ch3-atmo-heart-chamber.png',
        },
        {
          id: 'ch3_f13_atmo_creation_mural',
          title: 'The Mural of Creation',
          text: 'The walls of the chamber are alive — and they\'re showing you something. Luminous flesh rearranges itself into images, like a living fresco. You see the history of The Garden: the Progenitor in its infancy, a mote of light in a warm pool. Then growth — explosive, relentless, creative. Fins become legs. Scales become feathers. Simple becomes complex. Each image flows into the next, aeons compressed into moments.\n\nThe mural ends with an image of you. Standing here. Now. The Progenitor has been expecting you. It has been expecting you since the dawn of creation.',
          artAsset: 'story/story-ch3-atmo-creation-mural.png',
        },
      ],
      encounters: [
        {
          id: 'ch3_f13_power_crystal',
          type: 'hidden_cache',
          artAsset: 'story/story-ch3-power-crystal.png',
          description: 'A massive crystal formation grows from the Progenitor\'s flesh — a living node, pulsing with concentrated primordial power. The Deepfolk left inscriptions here, recording their failed attempts to commune with the ancient being.',
          primarySkill: 'lore',
          alternateSkill: 'awareness',
          target: 10,
          successDescription: 'You read the Deepfolk inscriptions and understand the Progenitor\'s ancient rhythms. The knowledge reveals a weakness — and a cache of the Deepfolk\'s most potent serums.',
          successReward: { type: 'item', value: 'Primordial Elixir' },
          failureDescription: 'The inscriptions are too alien, too old. The knowledge encoded here predates language itself.',
        },
      ],
      npcs: [
        {
          id: 'ch3_last_deepfolk',
          name: 'The Last Deepfolk',
          char: '?',
          color: '#44cc88',
          portraitAsset: 'story/story-ch3-last-deepfolk.png',
          dialogue: {
            text: 'A spectral figure materializes from the organic wall — but this one is different from the ghosts you\'ve seen before. More substantial. More real. Its form is tall, graceful, unmistakably Deepfolk — but ancient, even by their standards. Its three eyes burn with green light.\n\n"I am the last. Not a memory. Not an echo. The last living Deepfolk. The Progenitor sustains me as it sustains all things in The Garden. I have been here since before the Architect was built. Before the Sleeper was imprisoned. I have been here since the beginning.\n\nAnd I have watched the Progenitor for ten thousand years. I know what it is. I know what it wants."',
            choices: [
              {
                label: 'What does the Progenitor want?',
                responseText: '"It wants to create. That is all it has ever wanted. It is the first living thing — born in the deep fires beneath the world before anything else drew breath. Every form of life descends from it. Every creature is its creation, its child, its art.\n\nBut it is also a gardener. And gardeners prune. When a creation grows beyond its design — becomes too independent, too dangerous — the Progenitor resets. The great dyings that your surface sages puzzle over? The Progenitor. Every one.\n\nIt is preparing another reset. It can feel the surface — feel how far its children have strayed. Humanity was never in the design. You are a weed in its garden.\n\nKill it. Before it kills everything above."\n\nThe Last Deepfolk\'s eyes flare.\n\n"Take my strength. All of it. I have lived too long."',
                effects: [
                  { type: 'statBuff', stat: 'attack', amount: 3 },
                  { type: 'statBuff', stat: 'defense', amount: 2 },
                  { type: 'message', text: 'The Last Deepfolk sacrifices its remaining life force. +3 Attack, +2 Defense!', color: '#44cc88' },
                ],
              },
              {
                label: 'Can it be reasoned with?',
                responseText: '"Reasoned with? You cannot reason with the ocean. You cannot negotiate with time. The Progenitor does not think as you think. It does not feel as you feel. It creates because creating is what it is.\n\nThe Deepfolk tried communion for a thousand years. We learned its patterns, its rhythms. We even learned to use its essence — the serums are brewed from its blood. But we never changed its will. It has one purpose. One drive. Create. Observe. Reset.\n\nYour only chance is to destroy its pulsing heart — the living mass at its core. Sever that, and the body dies. The Garden dies. Everything connected to it dies.\n\nIncluding me. And I am ready."',
                effects: [
                  { type: 'heal', amount: 25 },
                  { type: 'message', text: 'The Last Deepfolk shares its healing energy. Full restoration.', color: '#44cc88' },
                ],
              },
            ],
          },
          setsFlag: { key: 'met_last_deepfolk', value: 'true' },
        },
      ],
      roomEvents: [
        {
          id: 'ch3_f13_primordial_surge',
          type: 'trap_chamber',
          name: 'Primordial Surge',
          artAsset: 'story/story-ch3-primordial-surge.png',
          description: 'The Progenitor pulses — and a wave of primordial force surges through the chamber. The air crackles with ancient power. Your blood screams in response, every fibre of your body resonating with the oldest force in existence.',
          primarySkill: 'survival',
          alternateSkill: 'awareness',
          baseDifficulty: 10,
          criticalSuccess: {
            description: 'You ground yourself against the surge, channeling the primordial energy through your body without letting it overwhelm you. For a moment, you feel what the Progenitor feels — and you are stronger for it.',
            effects: [{ type: 'stat_buff', value: 2, target: 'attack', duration: 99, message: 'Primordial energy empowers you! +2 Attack!' }],
          },
          success: {
            description: 'You brace against the wave and endure. The energy passes through you, leaving you shaken but intact.',
            effects: [],
          },
          partial: {
            description: 'The surge overwhelms your defenses. Your skin tingles. Your vision goes green. When it passes, you feel wrong.',
            effects: [{ type: 'damage', value: 5, message: 'Primordial energy burns through you!' }],
          },
          failure: {
            description: 'The wave hits you like a wall. Every nerve fires at once. You scream — a sound that\'s more animal than human.',
            effects: [{ type: 'damage', value: 10, message: 'The Progenitor\'s power overwhelms you!' }],
          },
          criticalFailure: {
            description: 'The surge rewrites something inside you. For a horrible moment, you forget your own name. When it passes, blood runs from your eyes and your hands are shaking.',
            effects: [{ type: 'damage', value: 16, message: 'Catastrophic primordial overload!' }],
          },
        },
      ],
      monsters: [
        { name: 'Primordial Raptor', char: 'r', color: '#44cc44', stats: { hp: 35, maxHp: 35, attack: 14, defense: 5, speed: 14 }, xpValue: 15, lootChance: 0.25, count: 5 },
        { name: 'Ancient Pteranodon', char: 'P', color: '#8888cc', stats: { hp: 32, maxHp: 32, attack: 17, defense: 4, speed: 16 }, xpValue: 16, lootChance: 0.2, count: 3 },
        { name: 'Progenitor Guard', char: 'G', color: '#22aa44', stats: { hp: 55, maxHp: 55, attack: 16, defense: 9, speed: 6 }, xpValue: 18, lootChance: 0.35, count: 3 },
        { name: 'Living Fossil', char: 'L', color: '#aacc44', stats: { hp: 40, maxHp: 40, attack: 13, defense: 7, speed: 8 }, xpValue: 14, lootChance: 0.3, count: 3 },
      ],
      items: [
        { name: 'Dino Serum', type: 'potion', char: '!', color: '#44ff88', value: 25, description: 'A Deepfolk alchemical serum brewed from the Progenitor\'s own blood. The final dose. Choose wisely.', count: 3 },
        { name: 'Primordial Elixir', type: 'potion', char: '!', color: '#22ff88', value: 22, description: 'Distilled essence of the Progenitor\'s life force. Heals 22 HP and briefly hastens the mending of wounds.', count: 2 },
        { name: 'Progenitor\'s Fang', type: 'weapon', char: '/', color: '#22ff44', value: 60, rarity: 'rare', description: 'A tooth shed by the Progenitor itself — aeons of primordial power compressed into a blade. It cuts through flesh and stone alike.', statBonus: { attack: 7 }, equipSlot: 'weapon', count: 1 },
      ],
    },
  ],
  boss: {
    name: 'The Progenitor',
    title: 'Ancient Architect of Flesh',
    char: 'Ω',
    color: '#22ff44',
    stats: { hp: 250, maxHp: 250, attack: 20, defense: 10, speed: 5 },
    xpValue: 120,
    bossAbility: {
      type: 'multi',
      abilities: [
        { type: 'summon', monsterName: 'Primordial Raptor', count: 2, cooldown: 5 },
        { type: 'aoe', damage: 10, radius: 2, cooldown: 4 },
      ],
    },
    element: 'dark',
    portraitAsset: 'story/story-ch3-progenitor.png',
    introDialogue: 'The Progenitor unfolds. There is no other word for it — a mass of tissue the size of a cathedral rearranges itself into something that can face you. Eyes open across its surface. Mouths form and dissolve. Limbs extend from places limbs have no right to be.\n\nIt does not roar. It does not threaten. It simply regards you with the patient curiosity of something that has been alive since the dawn of creation and has never once been surprised.\n\nThen it speaks. Not in words — in feelings. In memories. In the bone-deep certainty of something that made life itself:\n\n"I AM THE FIRST. THE SHAPER. THE GARDENER. I GREW THE WORLD FROM A MOTE OF LIGHT IN A WARM POOL. EVERY LIVING THING IS MY CHILD. EVERY GREAT DYING IS MY PRUNING.\n\nYOU ARE AN UNEXPECTED THING. COMPLEX. RESOURCEFUL. VIOLENT. I DID NOT MAKE YOU. BUT I RECOGNISE MY HAND IN YOUR BONES.\n\nYOU HAVE COME TO PRUNE THE GARDENER. HOW DELIGHTFULLY FITTING."',
    defeatDialogue: 'The Progenitor shudders. Its massive form contracts, collapses, begins to dissolve. Luminous fluid pours from a thousand wounds. The eyes dim — one by one, slowly, each one closing like a chapter ending.\n\nThe voice fills your mind one last time — weaker now, fading, but still patient. Still curious.\n\n"FASCINATING. IN ALL THE AGES OF THE WORLD... NO CHILD HAS EVER STRUCK DOWN ITS MAKER. YOU ARE... A NEW THING. A WONDER I DID NOT FORESEE.\n\nTHE GARDEN WILL DIE WITHOUT ME. THE CREATURES WILL FADE. THE PLANTS WILL WITHER. BUT LIFE CONTINUES. IT ALWAYS CONTINUES. I SHAPED IT THAT WAY.\n\nYOU ARE MY HEIR NOW. EVERY DROP OF BLOOD IN YOUR BODY CARRIES MY LEGACY. MY ESSENCE. MY PURPOSE.\n\nCREATE. OBSERVE. ENDURE. THAT IS THE ONLY LAW THAT MATTERS."\n\nThe Progenitor goes still. The Garden\'s heartbeat stops. In the silence, you hear something you haven\'t heard in days: your own breathing. Steady. Human. Yours.\n\nBut beneath the Progenitor\'s remains, a passage opens. Leading further down.\n\nOf course. There is always something deeper.',
  },
  rewards: [
    { type: 'gold', value: 200, description: '200 gold from the Progenitor\'s hoard' },
    { type: 'skill_points', value: 5, description: '5 skill points' },
    { type: 'unlock_chapter', value: 'ch4_the_abyss', description: 'Chapter 4: The Abyss' },
  ],
  victoryArtAsset: 'story/story-ch3-progenitor-defeat.png',
  bossItemDrop: {
    name: 'Progenitor\'s Heart', type: 'amulet', char: '"', color: '#22ff44',
    value: 85, rarity: 'rare',
    description: 'The crystallized heart of the first living thing. It pulses with primordial energy — the power of creation itself compressed into a gem that fits in your palm. +5 Atk, +5 Def, +25 Max HP.',
    statBonus: { attack: 5, defense: 5, maxHp: 25 },
    equipSlot: 'amulet', count: 1,
  },
  miniBossVictories: [
    {
      monsterName: 'Alpha Raptor',
      artAsset: 'story/story-ch3-alpha-raptor-defeat.png',
      narrative: 'The Alpha Raptor crashes to the stone, its scarred body finally still. For ages untold, its bloodline ruled The Garden — apex predators in a sealed world, perfecting the art of the hunt across countless generations. And now the last alpha lies dead at your feet.\n\nThe pack watches from the shadows. They don\'t attack. They don\'t flee. They wait. Learning. Remembering. In a thousand generations, their descendants will still tell the story of the strange two-legged thing that killed their king.\n\nIn the Alpha\'s nest, half-buried under shed scales, you find a fossilized tooth — not the Alpha\'s. Something older. Something the Alpha kept as a trophy from its own kills. A tooth from the Progenitor itself, crystallized by time into something harder than diamond.',
      loreUnlock: 'lore_alpha_raptor',
      itemDrop: {
        name: 'Raptor\'s Tooth Ring', type: 'ring', char: '=', color: '#ff4422',
        value: 45, rarity: 'rare',
        description: 'A ring carved from a fossilized raptor tooth, set in Deepfolk crystal. It hums with predatory instinct — ages of primal cunning bound to your finger. +3 Atk, +2 Def, +10 Max HP.',
        statBonus: { attack: 3, defense: 2, maxHp: 10 },
        equipSlot: 'ring', count: 1,
      },
    },
  ],
  loreEntries: [
    {
      id: 'lore_alpha_raptor',
      title: 'The Pack That Ruled',
      slides: [
        {
          title: 'The First Pack',
          text: 'When the Progenitor created the raptors, it made them in its own image — not physically, but in spirit. They were shaped to be adaptable, intelligent, social. The first pack formed in the early millennia of The Garden\'s existence, a family unit of six individuals who learned to hunt together. Within a hundred generations, they had developed communication, strategy, and something that looked very much like culture.\n\nThe Deepfolk were fascinated. They observed the packs for centuries, recording their customs, their mating rituals, their mourning practices. The raptors mourned their dead. They taught their young. They told stories — not in words, but in clicks and gestures and shared hunts that were performed the same way every time, passed from generation to generation.',
          artAsset: 'story/story-ch3-lore-first-pack.png',
        },
        {
          title: 'The Alpha Tradition',
          text: 'Leadership in the pack was not inherited — it was earned. Every generation produced an Alpha through a ritual the Deepfolk called "The Proving." Young raptors would compete in a series of hunts, each more dangerous than the last, until one emerged dominant. The Alpha wasn\'t the strongest or the fastest — it was the smartest. The one who could read the hunt, predict the prey, coordinate the pack.\n\nThe Alpha you killed was the latest in an unbroken line stretching back through the ages. Each Alpha carried the scars of its Proving and the memory of every hunt it had ever led. In raptor culture, an Alpha was not a ruler. It was a teacher. A keeper of knowledge. A living library of survival.',
          artAsset: 'story/story-ch3-lore-alpha-tradition.png',
        },
        {
          title: 'The Last Alpha',
          text: 'The Alpha Raptor you defeated was old — ancient by raptor standards. Its body bore the scars of a hundred hunts and a dozen challenges. It had led the pack through lean times and plenty, through cave-ins and floods and the slow decline of The Garden\'s world as the Deepfolk faded.\n\nWhen you entered the nesting cavern, it didn\'t attack immediately. It watched. It studied you. It recognized you as something new — a predator it had never encountered, using tools and strategies outside its experience. For the first time in its long life, the Alpha faced a hunt it couldn\'t predict.\n\nIt fought anyway. Because that is what Alphas do. They fight for the pack. Even when they know they\'ll lose.\n\nThe pack will choose a new Alpha. The hunts will continue. The clicks and hisses will tell the story of the two-legged predator that came from above. And the Garden will remember.',
          artAsset: 'story/story-ch3-alpha-raptor-defeat.png',
        },
      ],
    },
    {
      id: 'lore_progenitor',
      title: 'The First Life',
      slides: [
        {
          title: 'The Warm Pool',
          text: 'Before the first age of the world, in a warm pool deep beneath the earth, dead stone became living flesh. A spark kindled in the darkness — not fire, not light, but something else. Something that moved. Something that hungered. Something that chose to continue. That spark was the Progenitor — not as you saw it, vast and terrible, but as a mote of warmth smaller than a grain of sand.\n\nIt grew. It shaped. It brought forth other forms of life — not through design, but through endless shaping and reshaping across aeons beyond counting. Countless attempts. Countless failures. Each failure taught it something new. Each success became a new branch on the great tree of living things.\n\nThe Progenitor was not wise, not at first. It was patient. It had time. It had all the time in the world.',
          artAsset: 'story/story-ch3-lore-warm-pool.png',
        },
        {
          title: 'The Gardener Awakens',
          text: 'Intelligence came slowly — over countless ages. As the Progenitor\'s children grew more complex, so did their creator. It developed awareness. Then curiosity. Then intention. It began to guide the shaping of life rather than simply allowing it. It created The Garden — a sealed sanctuary deep beneath the earth, protected from the surface catastrophes it had once caused accidentally.\n\nThe great lizards were its masterwork. Aeons of refinement produced creatures of extraordinary beauty and efficiency. The Progenitor loved them, in its alien way. When the surface cataclysm struck — one the Progenitor did not cause, for once — it sealed The Garden and preserved its favorites.\n\nThe Deepfolk found The Garden ten thousand years ago. They thought they had discovered a natural wonder. They had discovered a god\'s workshop.',
          artAsset: 'story/story-ch3-lore-gardener.png',
        },
        {
          title: 'The End of the Garden',
          text: 'The Progenitor is dead. Its heart has stopped. The ancient light that sustained The Garden since before the age of men is fading. The plants will wither. The creatures will starve. The sealed world that preserved the great lizards will collapse.\n\nBut life does not end when its creator dies. The raptors still hunt. The ferns still grow. The wild persists without a gardener — messier, crueler, more beautiful for its chaos.\n\nAnd in the blood of every creature in The Garden — in the blood of every beast that walks the earth — the Progenitor\'s essence endures. The spark of life. The oldest magic ever wrought, still burning, still kindling, in every living thing.\n\nThe Progenitor is dead. Long live the Progenitor.',
          artAsset: 'story/story-ch3-progenitor-defeat.png',
        },
      ],
    },
  ],
};
