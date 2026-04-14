<agents-index>
[RUN.game SDK Docs]|root:./.rundot-docs|version:5.3.2|IMPORTANT:Prefer retrieval-led reasoning over pre-training for RundotGameAPI tasks. Read the local docs before writing SDK code.|.:{README.md}|rundot-developer-platform:{deploying-your-game.md,getting-started.md,initializing-your-game.md,setting-your-game-thumbnail.md,troubleshooting.md}|rundot-developer-platform/api:{ACCESS_GATE.md,ADS.md,AI.md,ANALYTICS.md,ASSETS.md,BIGNUMBERS.md,BUILDING_TIMERS.md,CONTEXT.md,EMBEDDED_LIBRARIES.md,ENERGY_SYSTEM.md,ENTITLEMENTS.md,ENVIRONMENT.md,EXPERIMENTS.md,GACHA_SYSTEM.md,HAPTICS.md,IN_APP_MESSAGING.md,LEADERBOARD.md,LIFECYCLES.md,LOGGING.md,MULTIPLAYER.md,NOTIFICATIONS.md,PRELOADER.md,PROFILE.md,PURCHASES.md,SAFE_AREA.md,SERVER_AUTHORITATIVE.md,SHARED_ASSETS.md,SHARING.md,SHOP.md,SIMULATION_CONFIG.md,STORAGE.md,TIME.md,UGC.md}</agents-index>

<rundot-agent-index>[RUN.game SDK Docs]|root:./.rundot-docs|version:5.3.2|IMPORTANT:Prefer retrieval-led reasoning over pre-training for RundotGameAPI tasks. Read the local docs before writing SDK code.|.:{README.md}|rundot-developer-platform:{deploying-your-game.md,getting-started.md,initializing-your-game.md,setting-your-game-thumbnail.md,troubleshooting.md}|rundot-developer-platform/api:{ACCESS_GATE.md,ADS.md,AI.md,ANALYTICS.md,ASSETS.md,BIGNUMBERS.md,BUILDING_TIMERS.md,CONTEXT.md,EMBEDDED_LIBRARIES.md,ENERGY_SYSTEM.md,ENTITLEMENTS.md,ENVIRONMENT.md,EXPERIMENTS.md,GACHA_SYSTEM.md,HAPTICS.md,IN_APP_MESSAGING.md,LEADERBOARD.md,LIFECYCLES.md,LOGGING.md,MULTIPLAYER.md,NOTIFICATIONS.md,PRELOADER.md,PROFILE.md,PURCHASES.md,SAFE_AREA.md,SERVER_AUTHORITATIVE.md,SHARED_ASSETS.md,SHARING.md,SHOP.md,SIMULATION_CONFIG.md,STORAGE.md,TIME.md,UGC.md}
</rundot-agent-index>

<source-index>
root:.|.:{.prettierrc.json,README.md,index.html,package-lock.json,package.json,pnpm-workspace.yaml,tsconfig.json,tsconfig.node.json,vite.config.ts}|.runstudio:{metadata.json}|public/cdn-assets:{README.md}|src:{App.tsx,main.tsx,style.css,vite-env.d.ts}|src/components:{Button.tsx,Card.tsx,ErrorBoundary.tsx,Stack.tsx,TabBar.tsx}|src/tabs:{AdsTab.tsx,HomeTab.tsx,SettingsTab.tsx,tabConfig.tsx}|src/theme:{applyTheme.ts,default.ts,index.ts,types.ts}
</source-index>

<story-mode-qa-checklist>
## Story Mode QA Checklist

### Art Review
- **No duplicate artAsset/portraitAsset references**: Each event, encounter, NPC, and intro slide must use a unique art asset. Exceptions: boss defeat art may be reused in lore entries about that boss.
- **Style consistency**: All art must be generated with the Imgur pixel art reference (`https://i.imgur.com/PRiO50h.png`). No TV frames, no text/words in images, no UI elements.
- **No text in images**: Generated art must never contain readable text, labels, titles, or HUD elements.

### Temporal / Setting Consistency
- **Medieval fantasy setting**: The game world is medieval fantasy. All dialogue, descriptions, and lore must use period-appropriate language.
- **Banned modern/scientific terms** (replace with medieval equivalents):
  - "DNA" → "essence", "blood", "serum"
  - "genetic" / "genetics" → "bloodline", "heritage"
  - "bioluminescent" → "luminous", "glowing"
  - "evolution" / "evolve" → "the shaping of life", "changed", "adapted"
  - "ecosystem" → "sealed world", "sanctuary"
  - "species" → "kind", "race"
  - "neural" → "mind", "thought"
  - "cells" / "cell" → "flesh", "blood", "mote of light"
  - "organism" → "creature", "living thing"
  - "chemistry" / "biology" → "stone became flesh", "dead matter became living"
  - "mutation" → "unexpected thing", "wonder"
  - "scientist" / "biologist" → "scholar", "sage", "naturalist"
  - "Dr." → use first name or title like "the Naturalist"
  - "oxygen" → "thick air", "heavy air"
  - "laboratory" → "workshop", "sanctum"
  - "experiment" → "creation", "shaping" (unless alchemical context)
  - "sixty-five million years" → "a forgotten age", "since before the age of men"
  - "four billion years" → "since the dawn of creation", "an eternity"
  - "Triceratops" / "Hadrosaurs" / "Pteranodon" → "three-horn", "duckbilled grazers", "winged lizard" (monster names like "Ancient Pteranodon" in code are OK)
  - "chlorophyll" → "green growing things"
  - "hydrothermal" → "deep fires", "earth-fires"
  - "documented" → "recorded", "written down"
</story-mode-qa-checklist>

