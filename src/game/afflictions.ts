import type { 
  AfflictionDef, 
  AfflictionStage, 
  AfflictionTrigger,
  FactionId,
  GameState,
  Stats,
} from './types';

// ══════════════════════════════════════════════════════════════
// AFFLICTION DEFINITIONS
// ══════════════════════════════════════════════════════════════

export const AFFLICTION_DEFS: AfflictionDef[] = [
  {
    id: 'were_goblin',
    factionId: 'goblin',
    name: 'Were-Goblin Curse',
    description: 'The goblin blood courses through your veins, transforming you from within.',
    icon: 'G',
    color: '#44ff44',
    triggerConditions: ['bite', 'dialogue', 'reputation'],
    telepathicLink: {
      factionId: 'goblin',
      damageShare: 0.15,
    },
    transformedClassSuffix: 'Goblin',
    stages: [
      {
        id: 'bitten',
        name: 'Goblin Bite',
        description: 'A goblin wound festers with strange, green-tinged magic.',
        floorsToProgress: 2,
        canCure: true,
        cureItem: 'Purification Salve',
        statModifiers: { speed: 1 },
        progressMessages: [
          'Your wound itches unbearably.',
          'You hear whispers in a language you almost understand.',
          'Your skin feels tight, wrong.',
          'Green veins pulse beneath your skin.',
          'Your teeth ache.',
        ],
        stageEnterMessage: 'The goblin bite burns with unnatural warmth. Something is wrong.',
      },
      {
        id: 'infected',
        name: 'Goblin Blood',
        description: 'The infection spreads. Your senses sharpen, but human comforts fade.',
        floorsToProgress: 3,
        canCure: true,
        cureItem: 'Holy Water',
        statModifiers: { speed: 2, attack: 1, maxHp: -5 },
        restrictions: [
          { 
            type: 'food', 
            blocked: ['bread', 'fruit', 'cheese', 'cooked'], 
            description: 'Human food tastes like ash in your mouth.' 
          },
        ],
        perceptionChanges: [
          { type: 'description_replace', original: 'filthy', replacement: 'cozy', intensity: 0.5 },
          { type: 'description_replace', original: 'fetid', replacement: 'familiar', intensity: 0.5 },
          { type: 'beauty_in_darkness', intensity: 0.3 },
        ],
        progressMessages: [
          'Your teeth feel sharper against your tongue.',
          'The dungeon smells... homey?',
          'You catch yourself cackling at nothing.',
          'Raw meat smells delicious.',
          'You feel an urge to hoard shiny things.',
          'Your ears twitch at sounds humans cannot hear.',
        ],
        stageEnterMessage: 'The infection deepens. Your reflection looks... different. Greener.',
      },
      {
        id: 'changing',
        name: 'The Change',
        description: 'There is no going back. You are becoming something new.',
        floorsToProgress: 3,
        canCure: false,
        statModifiers: { speed: 3, attack: 2, defense: -1, maxHp: -10 },
        abilities: ['goblin_tongue'],
        restrictions: [
          { 
            type: 'food', 
            blocked: ['bread', 'fruit', 'cheese', 'cooked', 'vegetable'], 
            description: 'Only raw meat and fungus sustain you now.' 
          },
          { 
            type: 'equipment', 
            blocked: ['plate', 'heavy', 'blessed', 'holy'], 
            description: 'Your body rejects human-forged steel and holy items.' 
          },
        ],
        perceptionChanges: [
          { type: 'color_shift', original: '#ff4444', replacement: '#44ff44', intensity: 0.7 },
          { type: 'description_replace', original: 'monster', replacement: 'kin', intensity: 0.6 },
          { type: 'description_replace', original: 'enemy', replacement: 'other', intensity: 0.6 },
          { type: 'see_hidden', intensity: 0.5 },
          { type: 'beauty_in_darkness', intensity: 0.6 },
        ],
        progressMessages: [
          'Your fingers have grown long and clawed.',
          'You understand goblin speech perfectly now.',
          'Human words feel clumsy on your new tongue.',
          'You dream of warrens and treasure hoards.',
          'The darkness feels like home.',
          'You hunger for something humans would not eat.',
          'Your spine curves into a permanent hunch.',
          'Goblins no longer attack on sight. They nod.',
        ],
        stageEnterMessage: 'Pain wracks your body as bones shift and reform. There is no cure now. Only transformation.',
      },
      {
        id: 'transformed',
        name: 'Were-Goblin',
        description: 'You have become one of them. Neither human nor goblin, but something new.',
        floorsToProgress: -1,
        canCure: false,
        statModifiers: { speed: 5, attack: 3, defense: -2, maxHp: -15 },
        abilities: ['goblin_tongue', 'goblin_cunning', 'pack_tactics', 'treasure_sense'],
        restrictions: [
          { 
            type: 'food', 
            blocked: ['bread', 'fruit', 'cheese', 'cooked', 'vegetable', 'potion_holy'], 
            description: 'You can only eat raw meat, fungus, and goblin delicacies.' 
          },
          { 
            type: 'equipment', 
            blocked: ['plate', 'heavy', 'blessed', 'holy', 'silver'], 
            description: 'Holy and silver items burn your flesh.' 
          },
        ],
        perceptionChanges: [
          { type: 'color_shift', original: '#ff4444', replacement: '#44ff44', intensity: 1.0 },
          { type: 'description_replace', original: 'filthy', replacement: 'beautiful', intensity: 1.0 },
          { type: 'description_replace', original: 'monster', replacement: 'brother', intensity: 1.0 },
          { type: 'description_replace', original: 'dungeon', replacement: 'home', intensity: 0.8 },
          { type: 'see_hidden', intensity: 1.0 },
          { type: 'beauty_in_darkness', intensity: 1.0 },
        ],
        progressMessages: [
          'You are complete.',
          'The goblins bow as you pass.',
          'You feel every goblin in the dungeon. Their joy. Their pain.',
          'The Goblin King senses a challenger.',
          'Human adventurers scream and flee at your approach.',
          'You remember being human. It feels like a dream.',
        ],
        stageEnterMessage: 'The transformation is complete. You are Were-Goblin. The horde welcomes you.',
      },
    ],
  },
  {
    id: 'vampiric',
    factionId: 'undead',
    name: 'Vampiric Curse',
    description: 'Death has touched you, but not claimed you. You exist in the space between.',
    icon: 'V',
    color: '#aa44ff',
    triggerConditions: ['bite', 'dialogue', 'reputation'],
    telepathicLink: {
      factionId: 'undead',
      damageShare: 0.1,
    },
    transformedClassSuffix: 'Vampire',
    stages: [
      {
        id: 'drained',
        name: 'Blood Drained',
        description: 'An undead creature drained your life force. The wound refuses to heal.',
        floorsToProgress: 2,
        canCure: true,
        cureItem: 'Blessed Bandage',
        statModifiers: { maxHp: -10, speed: 1 },
        progressMessages: [
          'The wound pulses with cold.',
          'You feel tired, so tired.',
          'Sunlight makes your eyes ache.',
          'Blood smells... interesting.',
        ],
        stageEnterMessage: 'Cold spreads from the wound. Your heart beats slower.',
      },
      {
        id: 'turning',
        name: 'The Turning',
        description: 'Your heart slows. Your skin pales. The hunger begins.',
        floorsToProgress: 3,
        canCure: true,
        cureItem: 'Holy Water',
        statModifiers: { maxHp: -5, attack: 2, speed: 2 },
        restrictions: [
          { type: 'food', blocked: ['cooked', 'fruit', 'bread'], description: 'Only raw meat sates the hunger.' },
        ],
        perceptionChanges: [
          { type: 'see_hidden', intensity: 0.3 },
          { type: 'description_replace', original: 'corpse', replacement: 'vessel', intensity: 0.4 },
        ],
        progressMessages: [
          'Your reflection fades in mirrors.',
          'The hunger gnaws at you.',
          'Undead creatures pause before attacking you.',
          'Your canine teeth lengthen.',
        ],
        stageEnterMessage: 'Your heart beats once per minute now. The hunger is constant.',
      },
      {
        id: 'risen',
        name: 'Risen',
        description: 'Your heart has stopped, but you do not die. You have risen.',
        floorsToProgress: 3,
        canCure: false,
        statModifiers: { maxHp: -10, attack: 4, speed: 3, defense: 1 },
        abilities: ['drain_life', 'night_vision'],
        restrictions: [
          { type: 'food', blocked: ['cooked', 'fruit', 'bread', 'vegetable', 'potion'], description: 'Only blood sustains you.' },
          { type: 'equipment', blocked: ['blessed', 'holy', 'silver'], description: 'Holy items burn.' },
        ],
        perceptionChanges: [
          { type: 'color_shift', original: '#ffcc44', replacement: '#aa44ff', intensity: 0.7 },
          { type: 'see_hidden', intensity: 0.7 },
        ],
        progressMessages: [
          'Your heartbeat has stopped entirely.',
          'The dead speak to you in whispers.',
          'Living blood calls to you.',
          'You remember dying. It was peaceful.',
        ],
        stageEnterMessage: 'Your heart stops. Silence. Then you rise, changed.',
      },
      {
        id: 'vampire',
        name: 'Vampire',
        description: 'You are undead. Immortal. Eternally hungry.',
        floorsToProgress: -1,
        canCure: false,
        statModifiers: { maxHp: -15, attack: 5, speed: 4, defense: 2 },
        abilities: ['drain_life', 'night_vision', 'mist_form', 'command_undead'],
        restrictions: [
          { type: 'food', blocked: ['cooked', 'fruit', 'bread', 'vegetable', 'potion', 'water'], description: 'Only blood.' },
          { type: 'equipment', blocked: ['blessed', 'holy', 'silver', 'garlic'], description: 'These burn your undead flesh.' },
        ],
        perceptionChanges: [
          { type: 'color_shift', original: '#ffcc44', replacement: '#aa44ff', intensity: 1.0 },
          { type: 'description_replace', original: 'corpse', replacement: 'sleeping', intensity: 1.0 },
          { type: 'description_replace', original: 'undead', replacement: 'kindred', intensity: 1.0 },
          { type: 'see_hidden', intensity: 1.0 },
        ],
        progressMessages: [
          'Eternity stretches before you.',
          'The living flee from your presence.',
          'Other vampires sense your presence.',
          'You are ancient, though you were born yesterday.',
        ],
        stageEnterMessage: 'You are Vampire. The night is yours. Forever.',
      },
    ],
  },
  {
    id: 'demonic_pact',
    factionId: 'demon',
    name: 'Demonic Pact',
    description: 'You have made a bargain with the infernal. Power flows into you, and something else flows out.',
    icon: 'D',
    color: '#ff4444',
    triggerConditions: ['dialogue', 'item', 'reputation'],
    telepathicLink: {
      factionId: 'demon',
      damageShare: 0.05,
    },
    transformedClassSuffix: 'Hellspawn',
    stages: [
      {
        id: 'bargained',
        name: 'The Bargain',
        description: 'You accepted a demon\'s offer. The contract burns in your soul.',
        floorsToProgress: 2,
        canCure: true,
        cureItem: 'Absolution Scroll',
        statModifiers: { attack: 2 },
        progressMessages: [
          'Hellfire flickers at your fingertips.',
          'Demons smile when they see you.',
          'Your shadow moves independently.',
          'You hear screaming when you close your eyes.',
        ],
        stageEnterMessage: 'The contract is signed. Your soul is... collateral.',
      },
      {
        id: 'corrupted',
        name: 'Corruption Spreads',
        description: 'The demonic influence grows. Your humanity recedes.',
        floorsToProgress: 3,
        canCure: true,
        cureItem: 'Holy Relic',
        statModifiers: { attack: 3, defense: -1, maxHp: 5 },
        abilities: ['hellfire_touch'],
        restrictions: [
          { type: 'equipment', blocked: ['blessed', 'holy', 'sacred'], description: 'Holy items reject you.' },
        ],
        perceptionChanges: [
          { type: 'color_shift', original: '#44ff44', replacement: '#ff4444', intensity: 0.5 },
        ],
        progressMessages: [
          'Your blood runs hot, literally.',
          'Holy symbols make you flinch.',
          'Demons bow slightly in greeting.',
          'Your eyes glow red in the dark.',
        ],
        stageEnterMessage: 'The corruption spreads through your veins like liquid fire.',
      },
      {
        id: 'consumed',
        name: 'Soul Consumed',
        description: 'Your soul belongs to Hell now. But so does their power.',
        floorsToProgress: 3,
        canCure: false,
        statModifiers: { attack: 5, defense: -2, maxHp: 10, speed: 1 },
        abilities: ['hellfire_touch', 'demon_wings', 'fear_aura'],
        restrictions: [
          { type: 'equipment', blocked: ['blessed', 'holy', 'sacred', 'pure'], description: 'Purity burns.' },
          { type: 'terrain', blocked: ['holy_ground', 'sanctuary'], description: 'Sacred ground harms you.' },
        ],
        perceptionChanges: [
          { type: 'color_shift', original: '#44ff44', replacement: '#ff4444', intensity: 0.8 },
          { type: 'description_replace', original: 'demon', replacement: 'ally', intensity: 0.7 },
          { type: 'beauty_in_darkness', intensity: 0.5 },
        ],
        progressMessages: [
          'Horns push through your skull.',
          'Your skin darkens to crimson.',
          'You laugh at pain.',
          'Hell feels like... home.',
        ],
        stageEnterMessage: 'Your soul is forfeit. But the power... the power is intoxicating.',
      },
      {
        id: 'hellspawn',
        name: 'Hellspawn',
        description: 'You are more demon than mortal now. Hell\'s champion walks the dungeon.',
        floorsToProgress: -1,
        canCure: false,
        statModifiers: { attack: 7, defense: -3, maxHp: 20, speed: 2 },
        abilities: ['hellfire_touch', 'demon_wings', 'fear_aura', 'infernal_command', 'soul_harvest'],
        restrictions: [
          { type: 'equipment', blocked: ['blessed', 'holy', 'sacred', 'pure', 'divine'], description: 'Divine items burn.' },
          { type: 'terrain', blocked: ['holy_ground', 'sanctuary', 'temple'], description: 'Sacred places wound you.' },
        ],
        perceptionChanges: [
          { type: 'color_shift', original: '#44ff44', replacement: '#ff4444', intensity: 1.0 },
          { type: 'color_shift', original: '#4488ff', replacement: '#ff8844', intensity: 1.0 },
          { type: 'description_replace', original: 'demon', replacement: 'brother', intensity: 1.0 },
          { type: 'description_replace', original: 'hell', replacement: 'home', intensity: 1.0 },
          { type: 'beauty_in_darkness', intensity: 1.0 },
        ],
        progressMessages: [
          'You are Hell\'s champion.',
          'Demons kneel before you.',
          'The Archfiend takes notice.',
          'Reality warps around you.',
        ],
        stageEnterMessage: 'You are Hellspawn. Even demons fear you now.',
      },
    ],
  },
  {
    id: 'lycanthropy',
    factionId: 'beast',
    name: 'Lycanthropy',
    description: 'The beast within awakens. Primal instincts override civilized thought.',
    icon: 'W',
    color: '#cc8844',
    triggerConditions: ['bite', 'dialogue', 'reputation'],
    telepathicLink: {
      factionId: 'beast',
      damageShare: 0.2,
    },
    transformedClassSuffix: 'Werebeast',
    stages: [
      {
        id: 'bitten',
        name: 'Beast Bite',
        description: 'A wild creature bit deep. The wound throbs with primal energy.',
        floorsToProgress: 2,
        canCure: true,
        cureItem: 'Wolfsbane Tincture',
        statModifiers: { attack: 1, speed: 1 },
        progressMessages: [
          'Your senses sharpen.',
          'You smell fear on the air.',
          'The moon calls to you.',
          'Raw meat looks appetizing.',
        ],
        stageEnterMessage: 'The bite pulses with wild energy. Something stirs within.',
      },
      {
        id: 'feral',
        name: 'Feral Urges',
        description: 'The beast inside grows stronger. Civilization fades.',
        floorsToProgress: 3,
        canCure: true,
        cureItem: 'Silver Elixir',
        statModifiers: { attack: 2, speed: 2, defense: -1 },
        restrictions: [
          { type: 'food', blocked: ['cooked', 'bread'], description: 'Only raw meat satisfies.' },
        ],
        perceptionChanges: [
          { type: 'see_hidden', intensity: 0.4 },
          { type: 'description_replace', original: 'beast', replacement: 'kin', intensity: 0.4 },
        ],
        progressMessages: [
          'Your nails grow thick and sharp.',
          'You growl without meaning to.',
          'Animals no longer flee from you.',
          'The pack mind whispers.',
        ],
        stageEnterMessage: 'The beast grows stronger. You struggle to remember why you wore clothes.',
      },
      {
        id: 'changing',
        name: 'The Change',
        description: 'Bones crack and reform. Fur sprouts. The beast emerges.',
        floorsToProgress: 3,
        canCure: false,
        statModifiers: { attack: 4, speed: 3, defense: -2, maxHp: 5 },
        abilities: ['keen_senses', 'pack_howl'],
        restrictions: [
          { type: 'food', blocked: ['cooked', 'bread', 'fruit', 'vegetable'], description: 'Meat. Only meat.' },
          { type: 'equipment', blocked: ['silver', 'refined'], description: 'Silver burns. Refined items feel wrong.' },
        ],
        perceptionChanges: [
          { type: 'see_hidden', intensity: 0.7 },
          { type: 'description_replace', original: 'beast', replacement: 'pack', intensity: 0.7 },
          { type: 'description_replace', original: 'monster', replacement: 'prey', intensity: 0.5 },
        ],
        progressMessages: [
          'Your jaw extends into a muzzle.',
          'Fur covers your body.',
          'You run on all fours without thinking.',
          'The pack accepts you.',
        ],
        stageEnterMessage: 'Agony as your body transforms. When it ends, you are no longer human.',
      },
      {
        id: 'werebeast',
        name: 'Werebeast',
        description: 'You are alpha. The pack follows. Prey runs.',
        floorsToProgress: -1,
        canCure: false,
        statModifiers: { attack: 6, speed: 5, defense: -3, maxHp: 10 },
        abilities: ['keen_senses', 'pack_howl', 'savage_leap', 'primal_fury'],
        restrictions: [
          { type: 'food', blocked: ['cooked', 'bread', 'fruit', 'vegetable', 'potion'], description: 'Blood and meat.' },
          { type: 'equipment', blocked: ['silver', 'refined', 'elegant'], description: 'Only natural materials.' },
        ],
        perceptionChanges: [
          { type: 'see_hidden', intensity: 1.0 },
          { type: 'description_replace', original: 'beast', replacement: 'brother', intensity: 1.0 },
          { type: 'description_replace', original: 'monster', replacement: 'prey', intensity: 1.0 },
          { type: 'description_replace', original: 'human', replacement: 'weakness', intensity: 0.8 },
        ],
        progressMessages: [
          'You are the alpha.',
          'The pack moves as one.',
          'Prey screams. You enjoy the sound.',
          'The wild is your home now.',
        ],
        stageEnterMessage: 'The transformation is complete. You are Werebeast. Hunt.',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // ROOM EVENT TRANSFORMATIONS
  // These afflictions are triggered by room events, not faction bites
  // ══════════════════════════════════════════════════════════════
  
  {
    id: 'ogre_curse',
    factionId: 'beast', // Uses beast faction as a stand-in
    name: 'Ogre Curse',
    description: 'Ancient magic warps your body into a monstrous ogre form. Powerful, but unable to use most equipment.',
    icon: 'O',
    color: '#88aa44',
    triggerConditions: ['room_event'],
    transformedClassSuffix: 'Ogre',
    stages: [
      {
        id: 'cursed',
        name: 'Ogre\'s Touch',
        description: 'Your muscles swell and skin thickens. Equipment feels tight.',
        floorsToProgress: 2,
        canCure: true,
        cureItem: 'Purification Salve',
        statModifiers: { attack: 2, maxHp: 15, speed: -1 },
        progressMessages: [
          'Your clothes tear at the seams.',
          'Your hands feel clumsy, oversized.',
          'Simple thoughts come more easily than complex ones.',
          'You feel... hungry. So hungry.',
        ],
        stageEnterMessage: 'Bones crack and reform. You are growing... larger.',
      },
      {
        id: 'transforming',
        name: 'Ogre\'s Bulk',
        description: 'Your body is massive now. Armor no longer fits. Weapons feel like toys.',
        floorsToProgress: 3,
        canCure: false,
        statModifiers: { attack: 5, maxHp: 30, defense: 3, speed: -2 },
        restrictions: [
          { 
            type: 'equipment', 
            blocked: ['weapon', 'armor', 'shield', 'ring', 'amulet', 'helmet'], 
            description: 'Your massive body cannot use equipment.' 
          },
        ],
        abilities: ['ogre_slam'],
        progressMessages: [
          'You tower over everything.',
          'Doorways require ducking. Sometimes breaking.',
          'Speech is hard. Actions are easy.',
          'Enemies look so... crushable.',
        ],
        stageEnterMessage: 'The transformation accelerates. Equipment falls away as your body swells.',
      },
      {
        id: 'ogre',
        name: 'Ogre',
        description: 'You are ogre. You crush. You smash. Equipment is for small things.',
        floorsToProgress: -1,
        canCure: false,
        statModifiers: { attack: 8, maxHp: 50, defense: 5, speed: -3 },
        abilities: ['ogre_slam', 'crushing_blow', 'thick_skin', 'intimidating_presence'],
        restrictions: [
          { 
            type: 'equipment', 
            blocked: ['weapon', 'armor', 'shield', 'ring', 'amulet', 'helmet', 'boots', 'gloves'], 
            description: 'You cannot equip anything. Your fists are weapon enough.' 
          },
        ],
        progressMessages: [
          'SMASH!',
          'Small things run from ogre.',
          'Ogre is strong. Ogre is best.',
          'Why use weapon when have FISTS?',
        ],
        stageEnterMessage: 'The transformation is complete. You are OGRE. SMASH!',
      },
    ],
  },
  
  {
    id: 'stone_curse',
    factionId: 'elemental', // Uses elemental faction
    name: 'Stone Curse',
    description: 'Your flesh turns to living stone. Nearly indestructible, but slow and heavy.',
    icon: 'S',
    color: '#888888',
    triggerConditions: ['room_event'],
    transformedClassSuffix: 'Stone',
    stages: [
      {
        id: 'hardening',
        name: 'Hardening Flesh',
        description: 'Your skin takes on a grey, rocky texture. Movement becomes stiff.',
        floorsToProgress: 2,
        canCure: true,
        cureItem: 'Holy Water',
        statModifiers: { defense: 3, speed: -1, maxHp: 5 },
        progressMessages: [
          'Your joints creak like grinding stone.',
          'Cuts no longer bleed. The wound just... closes.',
          'Your footsteps echo heavily.',
          'Colors seem muted. Grey is beautiful.',
        ],
        stageEnterMessage: 'Your skin feels rough, solid. Like stone.',
      },
      {
        id: 'petrifying',
        name: 'Living Stone',
        description: 'More stone than flesh now. Impervious to poison, but sluggish.',
        floorsToProgress: 3,
        canCure: false,
        statModifiers: { defense: 6, speed: -2, maxHp: 15, attack: -1 },
        abilities: ['stone_skin'],
        perceptionChanges: [
          { type: 'description_replace', original: 'cold', replacement: 'comfortable', intensity: 0.6 },
          { type: 'description_replace', original: 'stone', replacement: 'kin', intensity: 0.5 },
        ],
        progressMessages: [
          'Poison cannot touch you anymore.',
          'Fire feels like a gentle warmth.',
          'You no longer need to breathe. Interesting.',
          'Time passes... differently. Faster? Slower?',
        ],
        stageEnterMessage: 'Your transformation deepens. Heart beats stone against stone.',
      },
      {
        id: 'statue',
        name: 'Living Statue',
        description: 'You are living stone. Immune to poison, resistant to all. But so very slow.',
        floorsToProgress: -1,
        canCure: false,
        statModifiers: { defense: 10, speed: -4, maxHp: 30, attack: -2 },
        abilities: ['stone_skin', 'immovable', 'earthquake_stomp', 'poison_immunity'],
        restrictions: [
          { 
            type: 'equipment', 
            blocked: ['boots', 'gloves', 'ring'], 
            description: 'Your stone fingers cannot grip small items.' 
          },
        ],
        perceptionChanges: [
          { type: 'color_shift', original: '#ffcc44', replacement: '#888888', intensity: 0.8 },
          { type: 'description_replace', original: 'alive', replacement: 'ephemeral', intensity: 0.7 },
          { type: 'description_replace', original: 'stone', replacement: 'brother', intensity: 1.0 },
        ],
        progressMessages: [
          'You are eternal.',
          'Flesh creatures scurry around you like ants.',
          'The dungeon whispers its secrets to stone.',
          'Centuries could pass. You would endure.',
        ],
        stageEnterMessage: 'The transformation is complete. You are Living Statue. Eternal. Immovable.',
      },
    ],
  },
  
  {
    id: 'spectral_curse',
    factionId: 'undead', // Uses undead faction
    name: 'Spectral Curse',
    description: 'Your form becomes ethereal, existing between worlds. Can pass through walls, but vulnerable to holy damage.',
    icon: 'G',
    color: '#aaddff',
    triggerConditions: ['room_event'],
    transformedClassSuffix: 'Specter',
    stages: [
      {
        id: 'fading',
        name: 'Fading Form',
        description: 'Your form flickers. Sometimes you can see through your own hands.',
        floorsToProgress: 2,
        canCure: true,
        cureItem: 'Blessed Bandage',
        statModifiers: { speed: 2, defense: -1, maxHp: -5 },
        progressMessages: [
          'Light passes through you sometimes.',
          'You feel lighter, less... present.',
          'The material world seems less solid.',
          'Whispers from the spirit world reach you.',
        ],
        stageEnterMessage: 'Your reflection wavers. You are becoming less real.',
      },
      {
        id: 'ethereal',
        name: 'Ethereal Form',
        description: 'Half in this world, half in the next. Walls are merely suggestions.',
        floorsToProgress: 3,
        canCure: false,
        statModifiers: { speed: 4, defense: -2, maxHp: -10, attack: 2 },
        abilities: ['phase_shift'],
        perceptionChanges: [
          { type: 'see_hidden', intensity: 0.7 },
          { type: 'description_replace', original: 'ghost', replacement: 'kindred', intensity: 0.6 },
          { type: 'description_replace', original: 'wall', replacement: 'mist', intensity: 0.5 },
        ],
        progressMessages: [
          'You passed through a wall. On purpose.',
          'Holy symbols burn to look upon.',
          'The living seem so... heavy. Anchored.',
          'Spirits whisper secrets only you can hear.',
        ],
        stageEnterMessage: 'Your body becomes translucent. The spirit world beckons.',
      },
      {
        id: 'specter',
        name: 'Specter',
        description: 'You exist between worlds. Walls cannot stop you. But holy light... burns.',
        floorsToProgress: -1,
        canCure: false,
        statModifiers: { speed: 6, defense: -3, maxHp: -15, attack: 4 },
        abilities: ['phase_shift', 'spirit_touch', 'terrifying_visage', 'incorporeal'],
        restrictions: [
          { 
            type: 'equipment', 
            blocked: ['holy', 'blessed', 'silver', 'heavy'], 
            description: 'Holy items burn. Heavy items pass through you.' 
          },
        ],
        perceptionChanges: [
          { type: 'see_hidden', intensity: 1.0 },
          { type: 'color_shift', original: '#ffcc44', replacement: '#aaddff', intensity: 0.9 },
          { type: 'description_replace', original: 'solid', replacement: 'illusion', intensity: 0.8 },
          { type: 'description_replace', original: 'living', replacement: 'temporary', intensity: 0.7 },
        ],
        progressMessages: [
          'You are between. Neither here nor there.',
          'The living cannot see you unless you wish it.',
          'Holy light is agony. Avoid the priests.',
          'You remember life. It was a cage.',
        ],
        stageEnterMessage: 'The transformation is complete. You are Specter. Between worlds. Free.',
      },
    ],
  },
];

// ══════════════════════════════════════════════════════════════
// AFFLICTION UTILITY FUNCTIONS
// ══════════════════════════════════════════════════════════════

export function getAfflictionDef(afflictionId: string): AfflictionDef | undefined {
  return AFFLICTION_DEFS.find(a => a.id === afflictionId);
}

export function getAfflictionForFaction(factionId: FactionId): AfflictionDef | undefined {
  return AFFLICTION_DEFS.find(a => a.factionId === factionId);
}

export function getAfflictionStage(afflictionId: string, stageIndex: number): AfflictionStage | undefined {
  const affliction = getAfflictionDef(afflictionId);
  if (!affliction) return undefined;
  return affliction.stages[stageIndex];
}

export function getCurrentStage(state: GameState): AfflictionStage | undefined {
  if (!state.activeAffliction) return undefined;
  return getAfflictionStage(state.activeAffliction.afflictionId, state.activeAffliction.currentStage);
}

export function getAfflictionStatModifiers(state: GameState): Partial<Stats> {
  const stage = getCurrentStage(state);
  return stage?.statModifiers ?? {};
}

export function canCureAffliction(state: GameState): boolean {
  const stage = getCurrentStage(state);
  return stage?.canCure ?? false;
}

export function getCureItem(state: GameState): string | undefined {
  const stage = getCurrentStage(state);
  return stage?.cureItem;
}

export function startAffliction(
  state: GameState, 
  afflictionId: string, 
  trigger: AfflictionTrigger
): boolean {
  const affliction = getAfflictionDef(afflictionId);
  if (!affliction) return false;
  
  // Check if trigger is valid for this affliction
  if (!affliction.triggerConditions.includes(trigger)) return false;
  
  // Don't start if already afflicted
  if (state.activeAffliction && !state.activeAffliction.cured) return false;
  
  state.activeAffliction = {
    afflictionId,
    currentStage: 0,
    floorsInStage: 0,
    totalFloors: 0,
    cured: false,
    triggeredBy: trigger,
  };
  
  return true;
}

export function progressAffliction(state: GameState): {
  stageChanged: boolean;
  newStage?: AfflictionStage;
  oldStage?: AfflictionStage;
  fullyTransformed: boolean;
} {
  if (!state.activeAffliction || state.activeAffliction.cured) {
    return { stageChanged: false, fullyTransformed: false };
  }
  
  const affliction = getAfflictionDef(state.activeAffliction.afflictionId);
  if (!affliction) {
    return { stageChanged: false, fullyTransformed: false };
  }
  
  const currentStage = affliction.stages[state.activeAffliction.currentStage];
  if (!currentStage) {
    return { stageChanged: false, fullyTransformed: false };
  }
  
  // Increment counters
  state.activeAffliction.floorsInStage++;
  state.activeAffliction.totalFloors++;
  
  // Check if we should progress to next stage
  const floorsNeeded = currentStage.floorsToProgress;
  
  // -1 means permanent/final stage
  if (floorsNeeded === -1) {
    return { stageChanged: false, fullyTransformed: true };
  }
  
  if (state.activeAffliction.floorsInStage >= floorsNeeded) {
    const nextStageIndex = state.activeAffliction.currentStage + 1;
    
    // Check if there's a next stage
    if (nextStageIndex < affliction.stages.length) {
      const oldStage = currentStage;
      const newStage = affliction.stages[nextStageIndex];
      
      state.activeAffliction.currentStage = nextStageIndex;
      state.activeAffliction.floorsInStage = 0;
      
      const isFinalStage = newStage?.floorsToProgress === -1;
      
      return {
        stageChanged: true,
        oldStage,
        newStage,
        fullyTransformed: isFinalStage,
      };
    }
  }
  
  return { stageChanged: false, fullyTransformed: false };
}

export function cureAffliction(state: GameState): boolean {
  if (!state.activeAffliction) return false;
  
  const stage = getCurrentStage(state);
  if (!stage?.canCure) return false;
  
  state.activeAffliction.cured = true;
  return true;
}

export function getRandomProgressMessage(state: GameState): string | undefined {
  const stage = getCurrentStage(state);
  if (!stage || stage.progressMessages.length === 0) return undefined;
  
  const messages = stage.progressMessages;
  return messages[Math.floor(Math.random() * messages.length)];
}

export function getAfflictionAbilities(state: GameState): string[] {
  const stage = getCurrentStage(state);
  return stage?.abilities ?? [];
}

export function getAfflictionRestrictions(state: GameState): { 
  food: string[]; 
  equipment: string[]; 
  terrain: string[]; 
  action: string[];
} {
  const stage = getCurrentStage(state);
  const result = { food: [] as string[], equipment: [] as string[], terrain: [] as string[], action: [] as string[] };
  
  if (!stage?.restrictions) return result;
  
  for (const restriction of stage.restrictions) {
    result[restriction.type].push(...restriction.blocked);
  }
  
  return result;
}

export function isItemBlocked(state: GameState, itemName: string, itemType: 'food' | 'equipment'): boolean {
  const restrictions = getAfflictionRestrictions(state);
  const blocked = itemType === 'food' ? restrictions.food : restrictions.equipment;
  
  const nameLower = itemName.toLowerCase();
  return blocked.some(keyword => nameLower.includes(keyword.toLowerCase()));
}

export function getPerceptionChanges(state: GameState): import('./types').PerceptionChange[] {
  const stage = getCurrentStage(state);
  return stage?.perceptionChanges ?? [];
}

export function getTelepathicLink(state: GameState): { factionId: FactionId; damageShare: number } | undefined {
  if (!state.activeAffliction) return undefined;
  
  const affliction = getAfflictionDef(state.activeAffliction.afflictionId);
  if (!affliction?.telepathicLink) return undefined;
  
  // Telepathic link only active after stage 2 (changing/transformed)
  if (state.activeAffliction.currentStage < 2) return undefined;
  
  return affliction.telepathicLink;
}

export function isFullyTransformed(state: GameState): boolean {
  if (!state.activeAffliction) return false;
  
  const affliction = getAfflictionDef(state.activeAffliction.afflictionId);
  if (!affliction) return false;
  
  const stage = affliction.stages[state.activeAffliction.currentStage];
  return stage?.floorsToProgress === -1;
}

export function getTransformedClassName(baseClassName: string, afflictionId: string): string {
  const affliction = getAfflictionDef(afflictionId);
  if (!affliction?.transformedClassSuffix) return baseClassName;
  
  return `${affliction.transformedClassSuffix}-${baseClassName}`;
}
