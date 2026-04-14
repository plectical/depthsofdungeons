// ══════════════════════════════════════════════════════════════
// LORE & JOURNAL SYSTEM
// All narrative content for the dungeon, its inhabitants,
// bosses, zones, ancestors, and game features.
// Entries unlock progressively as the player plays.
// ══════════════════════════════════════════════════════════════

import type { BloodlineData } from './types';
import type { QuestEchoData } from './types';

// ── Lore entry categories ──
export type LoreCategory =
  | 'origins'      // The dungeon itself — what it is, why it exists
  | 'zones'        // Zone-specific lore
  | 'bosses'       // Boss backstories
  | 'creatures'    // Notable enemy groups
  | 'ancestors'    // The bloodline and ancestor system lore
  | 'artifacts'    // Legendary items and their history
  | 'factions';    // Groups within the dungeon ecosystem

export interface LoreEntry {
  id: string;
  category: LoreCategory;
  title: string;
  /** Short preview shown in the list */
  subtitle: string;
  /** Full lore text, shown when expanded. Supports \n for paragraphs. */
  text: string;
  /** Color theme for the entry header */
  color: string;
  /** ASCII icon */
  icon: string;
  /** Order within category (lower = earlier) */
  order: number;
  /** CDN path for the journal art banner image */
  artAsset?: string;
  /** Condition to unlock this entry. Returns true if unlocked. */
  unlock: (ctx: LoreContext) => boolean;
}

/** Context passed to unlock checks */
export interface LoreContext {
  bloodline: BloodlineData;
  questEchoData: QuestEchoData;
}

// ══════════════════════════════════════════════════════════════
// ORIGINS — The Dungeon Itself
// ══════════════════════════════════════════════════════════════

const ORIGINS_LORE: LoreEntry[] = [
  {
    id: 'origin_01',
    category: 'origins',
    title: 'The Endless Deep',
    subtitle: 'The dungeon has always been here.',
    artAsset: 'journal/lore-origin_01.png',
    text: `No one remembers who built the dungeon. No one remembers a time before it.\n\nThe eldest texts call it "The Endless Deep" — a wound in the earth that breathes. Its corridors shift between visits. Its rooms rearrange themselves like the thoughts of a dreaming god.\n\nScholars argue whether it was made or whether it grew. The dungeon does not care about the distinction. It simply is. It has been since before the first ancestor descended into the dark, and it will remain long after the last one falls.`,
    color: '#33ff66',
    icon: '#',
    order: 0,
    unlock: () => true, // Always available — first journal entry
  },
  {
    id: 'origin_02',
    category: 'origins',
    title: 'The First Descent',
    subtitle: 'Why your ancestors entered the dungeon.',
    artAsset: 'journal/lore-origin_02.png',
    text: `The first of your line was not a hero. They were desperate.\n\nA plague had taken the village. The healers were dead. The elders spoke of a remedy hidden in the deep — a fungus that grew only where sunlight had never reached.\n\nYour first ancestor descended alone, armed with nothing but a torch and a rusty blade. They found the fungus on the second floor. They also found something else: gold. Weapons. Power.\n\nThey returned to the village with the cure... and with a hunger for more. The bloodline had begun.`,
    color: '#c49eff',
    icon: '@',
    order: 1,
    unlock: (ctx) => ctx.bloodline.generation >= 1,
  },
  {
    id: 'origin_03',
    category: 'origins',
    title: 'The Living Walls',
    subtitle: 'The dungeon rearranges itself.',
    artAsset: 'journal/lore-origin_03.png',
    text: `Between expeditions, the corridors shift. Rooms that were east become west. Stairs that led down now lead sideways into chambers that shouldn't exist.\n\nSome believe the dungeon is alive — a vast organism that feeds on the adventurers who wander its halls. The monsters are its immune system. The treasure is its bait.\n\nOthers say it is a test, built by something ancient that wanted to see what mortals would do when pushed to their limits. The truth? The dungeon doesn't explain itself. It just keeps changing.`,
    color: '#33ff66',
    icon: '~',
    order: 2,
    unlock: (ctx) => ctx.bloodline.cumulative.totalFloors >= 10,
  },
  {
    id: 'origin_04',
    category: 'origins',
    title: 'The Ecosystem',
    subtitle: 'The dungeon sustains itself.',
    artAsset: 'journal/lore-origin_04.png',
    text: `The creatures in the dungeon are not invaders. They were born here.\n\nRats feed on the moss that grows in the wet corridors. Bats drink from underground rivers. Kobolds build crude camps near warm vents. Goblins wage war on the skeletons for territory.\n\nAnd at the center of it all, the bosses rule their domains like kings of a sunless kingdom. They did not choose to be here — they simply are, as much a part of the dungeon as the stone itself.\n\nWhen you kill them, the dungeon makes more. Always more.`,
    color: '#44dd77',
    icon: '&',
    order: 3,
    unlock: (ctx) => ctx.bloodline.cumulative.totalKills >= 50,
  },
  {
    id: 'origin_05',
    category: 'origins',
    title: 'The Hunger Below',
    subtitle: 'Something stirs in the deepest floors.',
    artAsset: 'journal/lore-origin_05.png',
    text: `Past the tenth floor, the air changes. It becomes heavier, warmer, tinged with sulfur.\n\nThe monsters here are not the same creatures that scurry through the upper corridors. They are ancient. Powerful. Some of them speak in languages that predate human memory.\n\nAncestors who returned from the deep spoke of a presence — not a monster, but a feeling. A vast intelligence watching from behind the walls. Measuring. Waiting.\n\nNone who reached the deepest floors ever went back a second time. Not because they couldn't. Because they chose not to.`,
    color: '#ff5566',
    icon: '!',
    order: 4,
    unlock: (ctx) => ctx.bloodline.cumulative.highestFloor >= 10,
  },
  {
    id: 'origin_06',
    category: 'origins',
    title: 'The Price of Return',
    subtitle: 'Death is not the end. But it costs something.',
    artAsset: 'journal/lore-origin_06.png',
    text: `Your bloodline has a gift — or a curse. Death in the dungeon does not mean oblivion. The next generation rises, carrying fragments of their ancestors' strength.\n\nBut something is lost each time. Memories fade. Skills become instincts without context. The fifth generation cannot remember why the first one entered the dungeon at all.\n\nAll that remains is the urge to descend. To fight. To push deeper. Whether this is heritage or compulsion, no ancestor has been able to say.`,
    color: '#c49eff',
    icon: '+',
    order: 5,
    unlock: (ctx) => ctx.bloodline.generation >= 5,
  },
];

// ══════════════════════════════════════════════════════════════
// ZONES — Lore for each dungeon zone
// ══════════════════════════════════════════════════════════════

const ZONE_LORE: LoreEntry[] = [
  {
    id: 'zone_stone_depths',
    category: 'zones',
    title: 'The Stone Depths',
    subtitle: 'Where every bloodline begins.',
    artAsset: 'journal/lore-zone_stone_depths.png',
    text: `The Stone Depths are the oldest part of the dungeon — and the most familiar.\n\nGenerations of adventurers have carved their marks into these walls. Crude maps scratched into stone. Names of the fallen. Warnings about what lies below.\n\nThe rats here have learned to avoid traps. The bats roost in patterns that funnel intruders into goblin ambushes. Even the weakest creatures in the Stone Depths have survived countless purges. They endure because the dungeon needs them.\n\nThis is where your ancestors took their first steps. Where they learned that the dark is not empty — it is full.`,
    color: '#33ff66',
    icon: '#',
    order: 0,
    unlock: () => true,
  },
  {
    id: 'zone_frozen_caverns',
    category: 'zones',
    title: 'The Frozen Caverns',
    subtitle: 'Where heat goes to die.',
    artAsset: 'journal/lore-zone_frozen_caverns.png',
    text: `Beneath the Stone Depths, the temperature drops. Not gradually — suddenly, as if crossing an invisible border into a different world.\n\nThe Frozen Caverns are not naturally cold. Something keeps them frozen. An ancient engine of ice, perhaps, or the breath of something vast sleeping in the glacier.\n\nThe Frost Queen rules here, and her subjects are as cold as she is. Ice Sprites drift through the corridors like frozen fireflies. Yetis guard the deeper passages. And somewhere in the deepest chamber, the temperature approaches a point where even thought freezes.\n\nAncestors who survived the Caverns reported that they could see their memories crystallizing in the air. Lost thoughts, visible for just a moment, then shattered by the cold.`,
    color: '#88ddff',
    icon: '*',
    order: 1,
    unlock: (ctx) => ctx.bloodline.bossKillLog.some(e => e.startsWith('Goblin King|')),
  },
  {
    id: 'zone_fungal_marsh',
    category: 'zones',
    title: 'The Fungal Marsh',
    subtitle: 'It grows. It thinks. It remembers.',
    artAsset: 'journal/lore-zone_fungal_marsh.png',
    text: `The Fungal Marsh is not a place — it is a being.\n\nThe entire zone is connected by the Mycelium — a vast underground network of fungal threads that links every mushroom, every spore, every creature in the marsh. The Spore Lord was the first to tap into this network. The Mycelium Mind is the network.\n\nCreatures born in the marsh share thoughts. They coordinate without sound. A Spore Rat on one end of the zone knows what a Mushroom Man on the other end sees.\n\nSome ancestors reported hearing whispers in the marsh — not words, but impressions. Feelings of hunger, curiosity, and something that might have been loneliness. The Mycelium remembers every adventurer who has ever walked its halls. It does not forget.`,
    color: '#44cc22',
    icon: '~',
    order: 2,
    unlock: (ctx) => ctx.bloodline.bossKillLog.some(e => e.startsWith('Stone Guardian|')),
  },
  {
    id: 'zone_infernal_pit',
    category: 'zones',
    title: 'The Infernal Pit',
    subtitle: 'Rivers of fire. Soldiers of ash.',
    artAsset: 'journal/lore-zone_infernal_pit.png',
    text: `The Infernal Pit was not always infernal.\n\nAncient texts describe it as a forge — a place where the dungeon itself was shaped and refined. The lava rivers are not natural; they flow in channels carved by hands that no longer exist.\n\nThe demons here are not visitors from another realm. They are the dungeon's children, born from the same fire that forged the corridors above. The Infernal Captain leads them not out of ambition but duty — he was made to guard the forge.\n\nThe Demon King sits at the heart of it all, on a throne of cooled obsidian. He does not rule by choice. He rules because the fire demands a king, and he was the first to survive its judgment.`,
    color: '#ff5522',
    icon: '!',
    order: 3,
    unlock: (ctx) => ctx.bloodline.bossKillLog.some(e => e.startsWith('Vampire Lord|')),
  },
  {
    id: 'zone_crystal_sanctum',
    category: 'zones',
    title: 'The Crystal Sanctum',
    subtitle: 'Magic given form.',
    artAsset: 'journal/lore-zone_crystal_sanctum.png',
    text: `The Crystal Sanctum is what happens when raw magic has nowhere to go.\n\nFor millennia, magical energy has seeped through the dungeon's stone, pooling in the deepest caverns. Over time, it crystallized — not just physically, but conceptually. The crystals here are not rocks. They are solidified spells, frozen intentions, petrified thoughts.\n\nThe creatures of the Sanctum are magic made flesh. Crystal Mites are accidental sparks given legs. The Archmage Prism was once a real mage who sought power here and found more than he could contain.\n\nThe Crystal Colossus is the oldest thing in the Sanctum — a spell so powerful it grew a body. It does not know what spell it was supposed to be. It only knows it must protect itself.`,
    color: '#cc77ff',
    icon: '+',
    order: 4,
    unlock: (ctx) => ctx.bloodline.bossKillLog.some(e => e.startsWith('Abyssal Worm|')),
  },
  {
    id: 'zone_shadow_realm',
    category: 'zones',
    title: 'The Shadow Realm',
    subtitle: 'Where reality wears thin.',
    artAsset: 'journal/lore-zone_shadow_realm.png',
    text: `The Shadow Realm is not underground. It is not anywhere.\n\nStep through its threshold and you leave the physical dungeon behind. The corridors here are made of compressed darkness — not an absence of light, but a substance. You can feel it pressing against your skin, trying to seep into your thoughts.\n\nThe Nameless One rules here, though "rules" implies authority. The Nameless One simply is the Shadow Realm. It was the first shadow cast by the dungeon's creation, given awareness by an eternity of solitude.\n\nIt has no name because names require someone to speak them, and nothing in the Shadow Realm speaks. It communicates through fear, through the creeping certainty that you have always been here, that the world above was the dream, and this is what's real.`,
    color: '#aa44ff',
    icon: 'V',
    order: 5,
    unlock: (ctx) => ctx.bloodline.bossKillLog.some(e => e.startsWith('Lich Emperor|')),
  },
  {
    id: 'zone_hell',
    category: 'zones',
    title: 'Hell',
    subtitle: 'The bottom. The beginning. The end.',
    artAsset: 'journal/lore-zone_hell.png',
    text: `Hell is not a punishment. Hell is what was here before the dungeon.\n\nWhen the first stone was laid, it was laid on top of something that was already burning. The dungeon grew upward from Hell like a tree from its roots. Every creature, every corridor, every trap — all of it draws its energy from the fire below.\n\nLucifer was not always a devil. He was the dungeon's first creation — its guardian, its caretaker, its heart. But the fire changed him. Millennia of burning, of watching adventurers descend and die, of regenerating the same corridors over and over... it drove him beyond madness into something else entirely.\n\nHe waits at the bottom. Not to stop you. To see if you are strong enough to understand what the dungeon really is.`,
    color: '#ff2200',
    icon: '6',
    order: 6,
    unlock: (ctx) => ctx.bloodline.bossKillLog.some(e => e.startsWith('The Nameless One|')),
  },
];

// ══════════════════════════════════════════════════════════════
// BOSSES — Backstories for each boss
// ══════════════════════════════════════════════════════════════

const BOSS_LORE: LoreEntry[] = [
  // Stone Depths bosses
  {
    id: 'boss_goblin_king',
    category: 'bosses',
    title: 'The Goblin King',
    subtitle: 'The first true threat.',
    artAsset: 'journal/lore-boss_goblin_king.png',
    text: `The Goblin King was not born a king. He was the runt of his litter — smallest, weakest, most likely to be eaten.\n\nBut he was clever. While his brothers fought over scraps, he watched. He learned the patrol routes of the skeletons. He memorized which corridors the adventurers favored. And when the old goblin chief challenged him, he didn't fight. He led the chief into a skeleton patrol and watched the bones do his work for him.\n\nNow he sits on a throne of scavenged weapons, wearing a crown he took from a dead adventurer. His goblins fear him. They should — he didn't survive by being kind.\n\nHe summons his subjects to fight for him. Not out of cowardice, but strategy. Why risk yourself when you have an army?`,
    color: '#44ff44',
    icon: 'K',
    order: 0,
    unlock: (ctx) => (ctx.bloodline.bestiary?.['Goblin King']?.encountered ?? false),
  },
  {
    id: 'boss_stone_guardian',
    category: 'bosses',
    title: 'The Stone Guardian',
    subtitle: 'It was built to protect something. It forgot what.',
    artAsset: 'journal/lore-boss_stone_guardian.png',
    text: `The Stone Guardian predates every other creature in the dungeon. It was here before the goblins, before the rats, before the first ancestor descended.\n\nIts purpose was clear once: guard the passage between the upper and lower dungeon. But the thing it guarded was moved — or consumed — long ago. The Guardian remains, executing its directive with mechanical precision.\n\nIt does not think. It does not feel. It detects intruders and it attacks. Its stone body regenerates between encounters, drawing material from the dungeon walls themselves.\n\nSome ancestors tried to reason with it. Some tried to sneak past it. All of them ended up fighting it. The Guardian does not negotiate. It was not built for negotiation.`,
    color: '#bbaa88',
    icon: 'G',
    order: 1,
    unlock: (ctx) => (ctx.bloodline.bestiary?.['Stone Guardian']?.encountered ?? false),
  },
  {
    id: 'boss_vampire_lord',
    category: 'bosses',
    title: 'The Vampire Lord',
    subtitle: 'He chose immortality. He regrets it.',
    artAsset: 'journal/lore-boss_vampire_lord.png',
    text: `The Vampire Lord was once a scholar who entered the dungeon seeking ancient knowledge. He found it — in the form of a cursed tome on the seventh floor.\n\nThe tome offered eternal life in exchange for eternal hunger. He accepted. That was eight hundred years ago.\n\nNow he rules the middle floors, sustained by the blood of adventurers who wander too deep. He is intelligent, articulate, and utterly ruthless. Not because he wants to be — because the hunger demands it.\n\nHe can still quote passages from the books he loved as a mortal. Sometimes, between battles, he mutters fragments of poetry in a language no one alive remembers. Then the hunger returns, and the poetry stops.`,
    color: '#ff1133',
    icon: 'V',
    order: 2,
    unlock: (ctx) => (ctx.bloodline.bestiary?.['Vampire Lord']?.encountered ?? false),
  },
  {
    id: 'boss_abyssal_worm',
    category: 'bosses',
    title: 'The Abyssal Worm',
    subtitle: 'It was here before the stone.',
    artAsset: 'journal/lore-boss_abyssal_worm.png',
    text: `The Abyssal Worm does not belong to the dungeon. The dungeon was built around it.\n\nWhen the first corridors were carved, the builders discovered something already living in the rock — a creature so vast that its body stretched through multiple floors. They built around it, hoping it would not wake.\n\nIt woke.\n\nThe Worm does not see in the way surface creatures do. It feels vibrations through the stone. Every footstep, every sword strike, every heartbeat — it feels all of it. When enough vibrations accumulate, it rises.\n\nKilling the Worm is temporary. Its body extends far deeper than anyone has ever dug. What the adventurers fight is merely its head.`,
    color: '#6633aa',
    icon: 'W',
    order: 3,
    unlock: (ctx) => (ctx.bloodline.bestiary?.['Abyssal Worm']?.encountered ?? false),
  },
  {
    id: 'boss_lich_emperor',
    category: 'bosses',
    title: 'The Lich Emperor',
    subtitle: 'He conquered death. Then death conquered everything else.',
    artAsset: 'journal/lore-boss_lich_emperor.png',
    text: `The Lich Emperor was the most powerful mage to ever enter the dungeon. He did not come for treasure or glory — he came to solve the problem of death.\n\nHe succeeded.\n\nBut immortality without purpose is just a longer prison sentence. The Emperor has been dead-alive for three thousand years, maintaining his existence through increasingly complex rituals that require the souls of the fallen.\n\nHis skeleton army is not an army at all — it is a recycling system. Every adventurer who dies on his floors becomes another soldier, another source of energy, another brick in his immortal prison.\n\nHe sits on his throne, crowned and terrible, and if you look closely at his empty eye sockets, you might see something that looks almost like relief when a worthy challenger finally arrives.`,
    color: '#cc00ff',
    icon: 'L',
    order: 4,
    unlock: (ctx) => (ctx.bloodline.bestiary?.['Lich Emperor']?.encountered ?? false),
  },
  // Zone bosses
  {
    id: 'boss_frost_queen',
    category: 'bosses',
    title: 'The Frost Queen',
    subtitle: 'She froze her own heart to stop the pain.',
    artAsset: 'journal/lore-boss_frost_queen.png',
    text: `The Frost Queen was a healer once. She entered the Frozen Caverns seeking a rare ice lily that could cure any disease.\n\nShe found the lily. She also found that the caverns would not let her leave. The cold seeped into her, slowly, over months. Her tears froze on her cheeks. Her breath became frost. Her heart, the last warm thing about her, froze on a winter solstice she could no longer feel.\n\nNow she rules the ice with a precision that would terrify a surgeon. Every snowflake in her domain is placed intentionally. Every frost pattern serves a purpose. She is not cruel — she simply cannot feel enough to be kind anymore.`,
    color: '#aaeeff',
    icon: 'Q',
    order: 5,
    unlock: (ctx) => (ctx.bloodline.bestiary?.['Frost Queen']?.encountered ?? false),
  },
  {
    id: 'boss_spore_lord',
    category: 'bosses',
    title: 'The Spore Lord',
    subtitle: 'The first voice of the Mycelium.',
    artAsset: 'journal/lore-boss_spore_lord.png',
    text: `The Spore Lord was not always a creature. It was a mushroom.\n\nBut mushrooms in the Fungal Marsh are not like surface mushrooms. They think — slowly, collectively, through the Mycelium network. Over centuries, one particular cluster of fungi grew complex enough to want something: to move.\n\nIt grew legs. Then arms. Then something like a face. The Spore Lord is the Mycelium's avatar — its attempt to interact with the walking world. It speaks in bursts of spores that carry chemical messages. It fights by calling the entire marsh to its defense.\n\nIt does not hate adventurers. It is simply curious about them. Unfortunately, its curiosity involves taking them apart to see how they work.`,
    color: '#88cc44',
    icon: 'S',
    order: 6,
    unlock: (ctx) => (ctx.bloodline.bestiary?.['Spore Lord']?.encountered ?? false),
  },
  {
    id: 'boss_demon_king',
    category: 'bosses',
    title: 'The Demon King',
    subtitle: 'Born in fire. Bound by duty.',
    artAsset: 'journal/lore-boss_demon_king.png',
    text: `The Demon King did not choose his crown. The fire chose it for him.\n\nWhen the Infernal Pit needed a ruler — something to organize the chaos of flame and ash — it reached into its hottest furnace and pulled out the first being strong enough to survive. That was the Demon King.\n\nHe is not evil in the way mortals understand evil. He is fire given will. He burns because that is what fire does. He conquers because that is what kings do. He does not understand mercy because fire does not understand mercy.\n\nBut he understands respect. The strongest challengers who reach his throne room are given a moment — just one — to prepare themselves. It is the only kindness fire knows how to give.`,
    color: '#ff0000',
    icon: 'K',
    order: 7,
    unlock: (ctx) => (ctx.bloodline.bestiary?.['Demon King']?.encountered ?? false),
  },
  {
    id: 'boss_nameless_one',
    category: 'bosses',
    title: 'The Nameless One',
    subtitle: 'The first shadow. The last fear.',
    artAsset: 'journal/lore-boss_nameless_one.png',
    text: `When the dungeon was created, light was cast for the first time into the deep places of the earth. And where there is light, there must be shadow.\n\nThe Nameless One is that first shadow — the original darkness displaced by the dungeon's creation. It has been here longer than anything else, longer than the Stone Guardian, longer than the Abyssal Worm, longer than the fire beneath Hell.\n\nIt does not have a name because it predates language. It does not have a form because it predates shape. What you see when you fight it is your own fear given substance — the Nameless One uses your mind to build itself a body.\n\nEvery ancestor who has faced it saw something different. The only common thread: absolute, primal terror.`,
    color: '#aa00ff',
    icon: '?',
    order: 8,
    unlock: (ctx) => (ctx.bloodline.bestiary?.['The Nameless One']?.encountered ?? false),
  },
  {
    id: 'boss_lucifer',
    category: 'bosses',
    title: 'Lucifer',
    subtitle: 'The light that fell. The fire that rose.',
    artAsset: 'journal/lore-boss_lucifer.png',
    text: `Lucifer was the dungeon's masterpiece.\n\nCreated to be its guardian, its heart, its connection to whatever made the dungeon in the first place. He was light incarnate — the brightest thing in the darkest place.\n\nBut light in darkness attracts attention. Every creature in the dungeon was drawn to him. Every adventurer sought him out. Every death in his domain added another ember to his fire. Over millennia, the light became heat. The warmth became burning. The burning became rage.\n\nNow he sits at the bottom of everything, 666 hit points of fury incarnate, and he asks every challenger the same question — not with words, but with fire:\n\n"Is this all you are?"`,
    color: '#ff0000',
    icon: 'L',
    order: 9,
    unlock: (ctx) => (ctx.bloodline.bestiary?.['Lucifer']?.encountered ?? false),
  },
];

// ══════════════════════════════════════════════════════════════
// CREATURES — Lore about notable monster groups
// ══════════════════════════════════════════════════════════════

const CREATURE_LORE: LoreEntry[] = [
  {
    id: 'creature_rats',
    category: 'creatures',
    title: 'The Rats of the Deep',
    subtitle: 'They were here first.',
    artAsset: 'journal/lore-creature_rats.png',
    text: `The rats were the dungeon's first inhabitants. Not placed here — they found their way in through cracks in the foundation, drawn by the warmth that rises from below.\n\nOver generations, they adapted. Dungeon rats are larger, smarter, and more aggressive than their surface cousins. They hunt in packs, communicating through a series of squeaks that functions as a crude language.\n\nSome ancestors reported seeing rats use tools — crude levers made from bone fragments, trip wires fashioned from sinew. Whether this is intelligence or mimicry is debated. The rats do not care about the distinction. They just want to eat.`,
    color: '#c8875a',
    icon: 'r',
    order: 0,
    unlock: (ctx) => (ctx.bloodline.bestiary?.['Rat']?.killCount ?? 0) >= 10,
  },
  {
    id: 'creature_skeletons',
    category: 'creatures',
    title: 'The Bone Legion',
    subtitle: 'The dead do not rest here.',
    artAsset: 'journal/lore-creature_skeletons.png',
    text: `Every skeleton in the dungeon was once a person.\n\nAdventurers, mostly. Some were soldiers from forgotten armies. A few were the dungeon's original builders, still carrying out instructions from masters who died millennia ago.\n\nThe reanimation process strips away personality, memory, and will. What remains is bone and purpose. The Lich Emperor claims to control them all, but the truth is more complex — the dungeon itself reanimates the dead. The Lich merely directs traffic.\n\nIf you look closely at a skeleton's gear, you can sometimes identify whose bones they wear. A family crest on a shield. A name carved into a sword hilt. Reminders that these were people once.`,
    color: '#e8e8ff',
    icon: 'S',
    order: 1,
    unlock: (ctx) => (ctx.bloodline.bestiary?.['Skeleton']?.killCount ?? 0) >= 5,
  },
  {
    id: 'creature_goblins',
    category: 'creatures',
    title: 'The Goblin Tribes',
    subtitle: 'Cunning, cruel, and surprisingly organized.',
    artAsset: 'journal/lore-creature_goblins.png',
    text: `Goblins are the dungeon's middle class.\n\nToo smart to be mindless vermin. Too weak to be apex predators. They survive through social structure, crude technology, and a willingness to cheat at everything.\n\nGoblin society revolves around the King, but beneath the monarchy is a complex web of shamans, scouts, trapmakers, and diplomats (who mostly negotiate with their fists). Goblin shamans are particularly dangerous — they've learned a form of magic that involves screaming very loudly while throwing things.\n\nGoblins are one of the few dungeon creatures that maintain oral histories. Their stories are wildly inaccurate but enthusiastically told.`,
    color: '#50ff50',
    icon: 'g',
    order: 2,
    unlock: (ctx) => (ctx.bloodline.bestiary?.['Goblin']?.killCount ?? 0) >= 5,
  },
  {
    id: 'creature_elementals',
    category: 'creatures',
    title: 'The Elemental Courts',
    subtitle: 'Nature given form. Nature given fury.',
    artAsset: 'journal/lore-creature_elementals.png',
    text: `Elementals are the dungeon's weather.\n\nWhere the dungeon's natural forces concentrate — heat vents, water tables, storm chambers — the energy sometimes coalesces into something that can think and move. Fire Elementals near the Infernal Pit. Frost Wraiths in the Frozen Caverns. Storm Wisps wherever lightning finds a path.\n\nThey are not truly alive. They are patterns — self-sustaining loops of energy that happen to look like creatures. Destroying one merely disperses the energy temporarily. It will reform, eventually, because the conditions that created it still exist.\n\nSome scholars classify them as the dungeon's dreams — half-formed thoughts given temporary bodies by the forces flowing through the stone.`,
    color: '#ff6611',
    icon: 'F',
    order: 3,
    unlock: (ctx) => {
      const b = ctx.bloodline.bestiary ?? {};
      const elementalKills = (b['Fire Elemental']?.killCount ?? 0) + (b['Frost Wraith']?.killCount ?? 0) + (b['Storm Wisp']?.killCount ?? 0);
      return elementalKills >= 5;
    },
  },
  {
    id: 'creature_undead',
    category: 'creatures',
    title: 'The Restless Dead',
    subtitle: 'They remember what they lost.',
    artAsset: 'journal/lore-creature_undead.png',
    text: `Not all undead serve the Lich Emperor.\n\nWraiths, specters, and ghosts are something different — they are the emotional residue of violent deaths. When an adventurer dies in fear, that fear lingers. When they die in rage, the rage echoes through the corridors for centuries.\n\nThe stronger the emotion, the stronger the ghost. The Vampire Lord's victims are particularly restless — they died knowing exactly what was happening to them, and their helpless fury manifests as some of the most aggressive undead in the dungeon.\n\nWraiths drain life not out of malice but out of an instinctive attempt to feel alive again. It never works. But they keep trying.`,
    color: '#c49eff',
    icon: 'W',
    order: 4,
    unlock: (ctx) => {
      const b = ctx.bloodline.bestiary ?? {};
      const undeadKills = (b['Wraith']?.killCount ?? 0) + (b['Specter']?.killCount ?? 0) + (b['Ghoul']?.killCount ?? 0);
      return undeadKills >= 5;
    },
  },
  {
    id: 'creature_demons',
    category: 'creatures',
    title: 'The Children of Fire',
    subtitle: 'They burn because they must.',
    artAsset: 'journal/lore-creature_demons.png',
    text: `Demons are not evil. They are fire.\n\nThis distinction matters. Evil requires choice. Demons do not choose to burn — they were born burning. The smallest imps are sparks that refused to go out. The largest pit lords are infernos that grew legs.\n\nDemon hierarchy is based entirely on heat. The hotter you burn, the higher you rank. Lucifer sits at the top because nothing in the dungeon burns hotter than he does.\n\nInterestingly, demons can be reasoned with — if you can survive the conversation. Some ancestors reported brief truces with demons, exchanging kills for passage. But demons forget bargains quickly. Fire does not remember its promises.`,
    color: '#ff3300',
    icon: 'D',
    order: 5,
    unlock: (ctx) => {
      const b = ctx.bloodline.bestiary ?? {};
      return (b['Demon']?.killCount ?? 0) >= 3 || (b['Archdemon']?.killCount ?? 0) >= 1;
    },
  },
];

// ══════════════════════════════════════════════════════════════
// ANCESTORS — Lore about the bloodline system
// ══════════════════════════════════════════════════════════════

const ANCESTOR_LORE: LoreEntry[] = [
  {
    id: 'ancestor_01',
    category: 'ancestors',
    title: 'The Bloodline',
    subtitle: 'Each death makes the next stronger.',
    artAsset: 'journal/lore-ancestor_01.png',
    text: `Your family has been descending into the dungeon for generations.\n\nEach ancestor who falls passes something to the next — not just their weapons or their gold, but something deeper. A resilience. An instinct. The dungeon recognizes your blood, and it responds.\n\nTraits develop over generations. A warrior ancestor passes down toughness. A rogue ancestor passes down reflexes. The longer the bloodline endures, the more powerful its inheritors become.\n\nThis is not magic. Or if it is, it is a kind of magic that the dungeon itself teaches. The bloodline grows because the dungeon needs worthy challengers. Without them, it stagnates.`,
    color: '#c49eff',
    icon: '@',
    order: 0,
    unlock: (ctx) => ctx.bloodline.generation >= 2,
  },
  {
    id: 'ancestor_02',
    category: 'ancestors',
    title: 'The Weight of Names',
    subtitle: 'Your ancestors watch from the dark.',
    artAsset: 'journal/lore-ancestor_02.png',
    text: `Every ancestor's name is remembered. Not by you — by the dungeon.\n\nThe walls have absorbed so much blood, so many last breaths, so many whispered prayers, that they carry an imprint of everyone who has ever died here. In the quietest corridors, if you listen carefully, you can sometimes hear them — fragments of battle cries, curses, death rattles.\n\nThe Ghost of an Ancestor is not a mere hallucination. It is the dungeon giving form to the memories it has absorbed. Your predecessors cannot truly help you — but they can remind you why you fight.\n\nSome bloodlines grow so long that the dungeon can barely contain all the ghosts. These are the families the dungeon respects. These are the families it fears.`,
    color: '#c49eff',
    icon: '+',
    order: 1,
    unlock: (ctx) => ctx.bloodline.generation >= 5,
  },
  {
    id: 'ancestor_03',
    category: 'ancestors',
    title: 'Inherited Instincts',
    subtitle: 'Your body knows things your mind does not.',
    artAsset: 'journal/lore-ancestor_03.png',
    text: `Have you ever dodged an attack you didn't see? Swung a sword at exactly the right angle? Found a secret passage that no map showed?\n\nThat is the bloodline speaking.\n\nGenerations of dungeon survival have encoded patterns into your very muscles. Your great-grandmother fought a hundred Kobolds — now you instinctively know their attack patterns. Your great-uncle was poisoned by every mushroom in the marsh — now your stomach resists toxins it has never encountered.\n\nThe traits you carry are not gifts. They are scars, worn down into smooth efficiencies. Every bonus you inherit was paid for in someone else's blood.`,
    color: '#c49eff',
    icon: '=',
    order: 2,
    unlock: (ctx) => ctx.bloodline.unlockedTraits.length >= 3,
  },
  {
    id: 'ancestor_04',
    category: 'ancestors',
    title: 'The Dungeon Remembers',
    subtitle: 'Your bloodline has earned the dungeon\'s attention.',
    artAsset: 'journal/lore-ancestor_04.png',
    text: `After enough generations, the dungeon takes notice.\n\nNot intellectually — the dungeon does not think the way mortals do. But it adapts. It responds. It begins generating challenges specifically tuned to your bloodline's strengths and weaknesses.\n\nThis is why each run feels different despite the same floors. The dungeon is learning from you as much as you are learning from it. It places loot where your bloodline's instincts will find it. It spawns monsters that exploit the gaps in your inherited skills.\n\nThe relationship between your family and the dungeon is not predator and prey. It is something stranger — a conversation, conducted in violence, that has been going on for generations.`,
    color: '#55ccff',
    icon: '#',
    order: 3,
    unlock: (ctx) => ctx.bloodline.generation >= 10,
  },
];

// ══════════════════════════════════════════════════════════════
// ARTIFACTS — Lore about legendary items
// ══════════════════════════════════════════════════════════════

const ARTIFACT_LORE: LoreEntry[] = [
  {
    id: 'artifact_ancestors_fang',
    category: 'artifacts',
    title: "The Ancestor's Fang",
    subtitle: 'A blade that hungers as you do.',
    artAsset: 'journal/lore-artifact_ancestors_fang.png',
    text: `The Ancestor's Fang is not forged — it is grown.\n\nWhen a bloodline reaches a certain maturity, the dungeon produces this weapon as a kind of acknowledgment. Each Fang is unique, attuned to the specific family that earned it. It feeds on the kills of its wielder, converting violence into sustenance.\n\nThe blade appears to be ordinary steel, but look closer: fine veins of purple crystal run through the metal, pulsing faintly with each kill. These crystals are the dungeon's own nervous system, woven into the weapon.\n\nThe Fang is the dungeon's handshake — a gesture of mutual respect between hunter and hunting ground.`,
    color: '#c49eff',
    icon: ')',
    order: 0,
    unlock: (ctx) => ctx.bloodline.cumulative.totalKills >= 25,
  },
  {
    id: 'artifact_crown_lich',
    category: 'artifacts',
    title: 'The Crown of the Lich',
    subtitle: 'It whispers to whoever wears it.',
    artAsset: 'journal/lore-artifact_crown_lich.png',
    text: `The Crown of the Lich is not a crown. It is a cage.\n\nThe Lich Emperor created it three thousand years ago as a vessel for the souls he needed to maintain his immortality. Each jewel in the crown contains a compressed consciousness — a mage, a warrior, a scholar — trapped in a gem the size of a thumbnail.\n\nWhen you wear the Crown, you can hear them. Not clearly — just murmurs, fragments of advice, warnings, and pleas. They want to be free. They also want you to win. If the Lich dies permanently, the souls trapped in the Crown might finally find peace.\n\nBut the Crown also grants power. Terrible, addictive power. Every ancestor who has worn it has struggled to take it off.`,
    color: '#cc00ff',
    icon: '"',
    order: 1,
    unlock: (ctx) => (ctx.bloodline.bestiary?.['Lich Emperor']?.killed ?? false),
  },
  {
    id: 'artifact_lucifers_halo',
    category: 'artifacts',
    title: "Lucifer's Halo",
    subtitle: 'The fallen angel\'s crown.',
    artAsset: 'journal/lore-artifact_lucifers_halo.png',
    text: `Before Lucifer fell, he wore a halo of pure light — the last remnant of whatever force created the dungeon.\n\nWhen the fire consumed him, the halo did not burn. It could not burn. It was made of something older than fire, older than stone, older than the dungeon itself.\n\nInstead, the halo inverted. Light became dark heat. Radiance became radiation. What was once a symbol of guardianship became the most powerful weapon in the dungeon.\n\nThe numbers tell the story: 666 value. Attack and defense and speed and health, all boosted to levels that defy mortal limits. To wear it is to carry a piece of the dungeon's heart on your head.\n\nThe cost? Look at what it did to Lucifer. Then decide if you still want to put it on.`,
    color: '#ff0000',
    icon: '"',
    order: 2,
    unlock: (ctx) => (ctx.bloodline.bestiary?.['Lucifer']?.killed ?? false),
  },
];

// ══════════════════════════════════════════════════════════════
// FACTIONS — Groups and powers within the dungeon
// ══════════════════════════════════════════════════════════════

const FACTION_LORE: LoreEntry[] = [
  {
    id: 'faction_hermit',
    category: 'factions',
    title: 'The Hermit',
    subtitle: 'He chose to stay.',
    artAsset: 'journal/lore-faction_hermit.png',
    text: `The Hermit was an adventurer once. One of the early bloodlines. But unlike the others, he did not die in the dungeon — he settled.\n\nNo one knows exactly when or why. The earliest ancestor records mention him as already old, already strange, already offering cryptic advice to anyone who would listen.\n\nHe survives by the dungeon's grace. The monsters leave him alone. The traps do not trigger for him. He eats the same food that grows on the dungeon walls, and he drinks from underground streams that would poison anyone else.\n\nHe helps adventurers because he remembers what it was like to be one. But there is something in his eyes — a knowledge he will not share — that suggests he knows more about the dungeon than he lets on.`,
    color: '#88ccff',
    icon: '?',
    order: 0,
    unlock: (ctx) => ctx.bloodline.cumulative.totalNpcsTalkedTo >= 3,
  },
  {
    id: 'faction_merchant',
    category: 'factions',
    title: 'The Wandering Merchants',
    subtitle: 'Profit finds a way.',
    artAsset: 'journal/lore-faction_merchant.png',
    text: `How do they get down here? How do they survive? Why do they stay?\n\nThe Wandering Merchants are one of the dungeon's great mysteries. They appear in safe rooms, always stocked with exactly the items you need, always willing to trade.\n\nSome scholars theorize they are not human at all — that they are projections of the dungeon itself, offering resources to keep adventurers alive long enough to reach the deeper floors. Others believe they are members of an ancient trade guild that discovered how to navigate the dungeon's shifting corridors.\n\nThe merchants themselves will not answer questions about their origins. They will, however, give you a very good deal on a slightly used Long Sword.`,
    color: '#ffe44d',
    icon: '$',
    order: 1,
    unlock: (ctx) => ctx.bloodline.cumulative.totalGoldEarned >= 200,
  },
  {
    id: 'faction_mercenaries',
    category: 'factions',
    title: 'The Free Company',
    subtitle: 'Swords for hire in the deep.',
    artAsset: 'journal/lore-faction_mercenaries.png',
    text: `Garrak, Lyra, Sera, Krug, Shade, Atlas — the mercenaries of the dungeon are a strange breed.\n\nThey are not bloodline descendants. They are not dungeon-born creatures. They are... something else. Independent agents who exist in the space between the dungeon's systems, fighting for gold and something harder to define.\n\nEach has a story. Garrak the Shield Bearer once served a king who no longer exists. Lyra the Blade Dancer seeks a weapon she lost on the twelfth floor. Sera the War Priestess prays to a god whose name is written on the dungeon walls. Krug the Berserker does not remember his past. Shade the Assassin does not want to.\n\nAnd Atlas? Atlas was here before any of them. He might have been here before the dungeon itself.`,
    color: '#88ccff',
    icon: '♦',
    order: 2,
    unlock: (ctx) => (ctx.questEchoData.counters.totalMercenariesHired ?? 0) >= 1,
  },
];

// ══════════════════════════════════════════════════════════════
// COMBINED LORE DATABASE
// ══════════════════════════════════════════════════════════════

export const ALL_LORE: LoreEntry[] = [
  ...ORIGINS_LORE,
  ...ZONE_LORE,
  ...BOSS_LORE,
  ...CREATURE_LORE,
  ...ANCESTOR_LORE,
  ...ARTIFACT_LORE,
  ...FACTION_LORE,
];

/** Get all lore entries that are currently unlocked */
export function getUnlockedLore(ctx: LoreContext): LoreEntry[] {
  return ALL_LORE.filter(entry => entry.unlock(ctx));
}

/** Get newly unlocked lore IDs (entries unlocked now but not previously seen) */
export function getNewLoreIds(ctx: LoreContext, seenIds: string[]): string[] {
  return ALL_LORE
    .filter(entry => entry.unlock(ctx) && !seenIds.includes(entry.id))
    .map(e => e.id);
}

/** Get lore entries grouped by category */
export function getLoreByCategory(entries: LoreEntry[]): Record<LoreCategory, LoreEntry[]> {
  const result: Record<LoreCategory, LoreEntry[]> = {
    origins: [],
    zones: [],
    bosses: [],
    creatures: [],
    ancestors: [],
    artifacts: [],
    factions: [],
  };
  for (const e of entries) {
    result[e.category].push(e);
  }
  // Sort by order within each category
  for (const cat of Object.keys(result) as LoreCategory[]) {
    result[cat].sort((a, b) => a.order - b.order);
  }
  return result;
}

/** Category display metadata */
export const CATEGORY_META: Record<LoreCategory, { name: string; icon: string; color: string }> = {
  origins: { name: 'The Endless Deep', icon: '#', color: '#33ff66' },
  zones: { name: 'Zones', icon: '>', color: '#44bbff' },
  bosses: { name: 'Bosses', icon: 'K', color: '#ff4444' },
  creatures: { name: 'Creatures', icon: '&', color: '#ccaa22' },
  ancestors: { name: 'The Bloodline', icon: '@', color: '#c49eff' },
  artifacts: { name: 'Artifacts', icon: ')', color: '#ff9d17' },
  factions: { name: 'Factions', icon: '?', color: '#88ccff' },
};
