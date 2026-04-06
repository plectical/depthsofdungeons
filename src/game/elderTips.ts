/**
 * The Elder's contextual tips — shown once each at the right moment.
 */

export interface ElderTip {
  key: string;
  message: string;
}

export const ELDER_WELCOME: ElderTip = {
  key: 'elder_welcome',
  message: "Another soul in the depths... I am The Elder. No one ever leaves. Move with the arrows. Walk into monsters to fight. Find the stairs > to go deeper.",
};

export const ELDER_HUNGER: ElderTip = {
  key: 'elder_hunger',
  message: "You're getting hungry. Eat food or you'll start losing health.",
};

export const ELDER_SHOP: ElderTip = {
  key: 'elder_shop',
  message: "A shopkeeper. Buy weapons, armor, and food with gold from kills.",
};

export const ELDER_MERCENARY: ElderTip = {
  key: 'elder_mercenary',
  message: "A mercenary. Hire them to fight alongside you.",
};

export const ELDER_NPC: ElderTip = {
  key: 'elder_npc',
  message: "Not everyone here is hostile. Hear them out.",
};

export const ELDER_BOSS: ElderTip = {
  key: 'elder_boss',
  message: "A boss lurks on this floor. They hit hard. Be ready.",
};

export const ELDER_STATUS: ElderTip = {
  key: 'elder_status',
  message: "You've been afflicted! It'll wear off in a few turns. Survive.",
};

export const ELDER_LEVELUP: ElderTip = {
  key: 'elder_levelup',
  message: "You leveled up! Pick an ability.",
};

export const ELDER_SKILL_TREE: ElderTip = {
  key: 'elder_skill_tree',
  message: "You've grown stronger. Each level earns a skill point. Open [ Skills ] and choose your path — Berserker, Guardian, or Warlord. Go deep for powerful rewards, or mix paths to survive. Choose wisely... you won't unlock everything in one life.",
};

export const ELDER_DEATH: ElderTip = {
  key: 'elder_death',
  message: "You've fallen... but look — you're already stronger. Every death adds permanent bonuses: more HP, extra starting gold, and bigger hunger reserves. Open Bloodline to see your growing power, and visit the Necropolis to spend your kills on permanent upgrades. The dungeon fears those who refuse to stay dead.",
};

export const ELDER_RAGE_INTRO: ElderTip = {
  key: 'elder_rage_intro',
  message: "Pain fuels your rage. Take a hit and the Rage bar fills. Once you hit 30 rage, the [ RAGE ] button lights up red — press it to unleash a cone strike that hits every enemy in front of you for double damage.",
};

export const ELDER_AUTO_MODE: ElderTip = {
  key: 'elder_auto_mode',
  message: "Full auto. I'll handle everything — moving, fighting, picking up loot, even the stairs down. Sit back, or press Stop whenever you want control.",
};

export const ELDER_EXPLORE_MODE: ElderTip = {
  key: 'elder_explore_mode',
  message: "Explore mode. I'll guide your steps through the dark — but the moment a monster comes into view, I'll step aside. The fight is yours.",
};

export const ELDER_TUTORIAL_COMPLETE: ElderTip = {
  key: 'elder_tutorial_complete',
  message: "You survived your first death. The Ancestor's Fang is yours now — a blade earned through blood. It will be waiting for you at the start of every run.",
};

export const ELDER_ROGUE_UNLOCK: ElderTip = {
  key: 'elder_rogue_unlock',
  message: "The Rogue awaits you — fast, deadly, and patient. Save this dungeon to your home screen and she steps out of the shadows. A warrior earns their weapon. A rogue earns their trust.",
};

export const ELDER_ROGUE_FIRST_SELECT: ElderTip = {
  key: 'elder_rogue_first_select',
  message: "Ah... the Rogue. Before you descend — have you truly saved this dungeon to your home screen? She slips away from those who forget her. Make sure she can find you again.",
};

export const ELDER_PALADIN_UNLOCK: ElderTip = {
  key: 'elder_paladin_unlock',
  message: "The Paladin... a holy knight. Bound by oath, not gold. She does not follow strangers — only those who have pledged themselves. Create a free account and she will answer your call.",
};

export const ELDER_PALADIN_FIRST_SELECT: ElderTip = {
  key: 'elder_paladin_first_select',
  message: "The Paladin walks with you now. Her light does not waver in the dark — but she watches to see if yours does.",
};

export const ELDER_LEGACY_SHARD: ElderTip = {
  key: 'elder_legacy_shard',
  message: "An Essence Shard... rare and precious. These fragments hold the memory of every battle your bloodline has fought. Collect enough and you can forge your Legacy Gear — a weapon unique to your class that grows stronger the more you invest. Find your Legacy in the class select screen. It can never be lost or sold. It is yours... forever.",
};

export const ELDER_SKILL_CHECK: ElderTip = {
  key: 'elder_skill_check',
  message: "A test of skill! See those yellow ! marks on the floor? Step on one to face a challenge. Roll 2d6 + your skill modifier to beat the target number. Success brings rewards — gold, healing, knowledge. Failure... has consequences. Check your Narrative Skills in the character sheet.",
};

export const ELDER_STORY_CHARACTER: ElderTip = {
  key: 'elder_story_character',
  message: "Someone new in the depths... Not every soul here is your enemy. Speak with them. Your choices and your skills shape these encounters. Befriend them over time, and some may even join you.",
};

/** All elder tip keys for batch-loading seen status. */
export const ALL_ELDER_KEYS = [
  ELDER_WELCOME.key,
  ELDER_HUNGER.key,
  ELDER_SHOP.key,
  ELDER_MERCENARY.key,
  ELDER_NPC.key,
  ELDER_BOSS.key,
  ELDER_STATUS.key,
  ELDER_LEVELUP.key,
  ELDER_DEATH.key,
  ELDER_AUTO_MODE.key,
  ELDER_EXPLORE_MODE.key,
  ELDER_RAGE_INTRO.key,
  ELDER_SKILL_TREE.key,
  ELDER_TUTORIAL_COMPLETE.key,
  ELDER_ROGUE_UNLOCK.key,
  ELDER_ROGUE_FIRST_SELECT.key,
  ELDER_PALADIN_UNLOCK.key,
  ELDER_PALADIN_FIRST_SELECT.key,
  ELDER_LEGACY_SHARD.key,
  ELDER_SKILL_CHECK.key,
  ELDER_STORY_CHARACTER.key,
];
