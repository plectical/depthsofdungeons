import type { CSSProperties } from 'react';
import type { GameState } from './types';
import { XP_PER_LEVEL, HUNGER_WARNING } from './constants';
import { getPlayerEffectiveStats, getClassDef, getPlayerRange, getWarriorRage, getPaladinVow, isPaladinVowActive, getRogueShadowCooldown, getMageBlastCooldown, getRangerMark, getNecroSkeletons, getLegacyAbilityState, hasLegacyAbility, getGeneratedClassInfo } from './engine';
import { getZoneDef } from './zones';
import { useCdnImage } from './useCdnImage';
import { getRaceDef } from './races';
import { LEGACY_ABILITY_DESCRIPTIONS } from './legacyGear';
import { getTransformDef } from './story-mode/transformations';
import { ELEMENT_INFO } from './elements';

interface HUDProps {
  state: GameState;
  generation?: number;
  isPremium?: boolean;
  echoes?: number;
  isStoryMode?: boolean;
}

function CompactBar({ current, max, color, width = 8 }: { current: number; max: number; color: string; width?: number }) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
  const filled = Math.round(ratio * width);
  const empty = width - filled;
  return (
    <span style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: 0 }}>
      <span style={{ color: '#0a3a0a' }}>[</span>
      <span style={{ color }}>{'\u2588'.repeat(filled)}</span>
      <span style={{ color: '#0a1a0a' }}>{'\u2591'.repeat(empty)}</span>
      <span style={{ color: '#0a3a0a' }}>]</span>
    </span>
  );
}

export function HUD({ state, generation, isPremium, echoes, isStoryMode }: HUDProps) {
  const { player, playerClass, floorNumber, score, hunger } = state;
  const classDef = getClassDef(playerClass);
  const eStats = getPlayerEffectiveStats(state);
  const eAtk = eStats.attack;
  const eDef = eStats.defense;
  const eMaxHp = eStats.maxHp;
  const eSpd = eStats.speed;
  const eRegen = eStats.regenBonus;

  const hpPct = Math.max(0, player.stats.hp / eMaxHp);
  const hpColor = hpPct > 0.6 ? '#33ff66' : hpPct > 0.3 ? '#ccaa22' : '#ff3333';

  const rage = playerClass === 'warrior' ? getWarriorRage(state) : 0;
  const rageColor = rage >= 30 ? '#ff0000' : rage > 0 ? '#ff4400' : '#882200';

  const vowStacks = playerClass === 'paladin' ? getPaladinVow(state) : 0;
  const vowActive = playerClass === 'paladin' ? isPaladinVowActive(state) : false;
  const vowColor = vowActive ? '#ffffff' : vowStacks >= 1 ? '#ffd700' : '#886600';

  const hungerPct = Math.max(0, hunger.current / hunger.max);
  const hungerColor = hungerPct > 0.5 ? '#33cc55' : hungerPct > HUNGER_WARNING / hunger.max ? '#ccaa22' : '#ff3333';

  const nextXp = player.level < XP_PER_LEVEL.length ? (XP_PER_LEVEL[player.level] ?? 9999) : 9999;

  const raceThumbUrl = useCdnImage(state.playerRace ? `races/${state.playerRace}.png` : '');
  const isDinoForm = !!(state.dinoTransformTurns && state.dinoTransformTurns > 0) || !!state.dinoPermanent;
  const isGeneralTransform = !!(state._activeTransformId && ((state._transformTurns ?? 0) > 0 || state._transformPermanent));
  const activeTransformDef = isGeneralTransform && state._activeTransformId ? getTransformDef(state._activeTransformId) : undefined;
  const dinoTransformDef = isDinoForm ? getTransformDef('dino') : undefined;
  const transformDef = activeTransformDef ?? dinoTransformDef;
  const transformPortraitPath = transformDef?.portrait ?? '';
  const transformColor = transformDef?.color ?? '#44ff88';
  const storyPortraitUrl = useCdnImage(isStoryMode ? 'story/story-sellsword.png' : '');
  const transformPortraitUrl = useCdnImage(transformDef ? transformPortraitPath : '');

  const generatedClassThumb = useCdnImage('generated-class-thumb.png');
  const portraits: Record<string, string | null> = {
    warrior: useCdnImage('warrior-portrait.jpg'),
    'warrior-damaged': useCdnImage('warrior-damaged.jpg'),
    mage: useCdnImage('mage-portrait.jpg'),
    'mage-damaged': useCdnImage('mage-damaged.jpg'),
    paladin: useCdnImage('paladin-portrait.jpg'),
    'paladin-damaged': useCdnImage('paladin-damaged.jpg'),
    rogue: useCdnImage('rogue-portrait.jpg'),
    'rogue-damaged': useCdnImage('rogue-damaged.jpg'),
    ranger: useCdnImage('ranger-portrait.jpg'),
    'ranger-damaged': useCdnImage('ranger-damaged.jpg'),
    hellborn: useCdnImage('hellborn-portrait.jpg'),
    'hellborn-damaged': useCdnImage('hellborn-damaged.jpg'),
    necromancer: useCdnImage('necromancer-thumb.png'),
    revenant: useCdnImage('necromancer-thumb.png'),
    death_knight: useCdnImage('death-knight-portrait.png'),
    generated: generatedClassThumb,
  };

  const classBorders: Record<string, string> = {
    warrior: '#ff6644', mage: '#8855ff', paladin: '#ffd700',
    rogue: '#ffcc33', ranger: '#33cc66', hellborn: '#ff2200',
    death_knight: '#aa55cc',
    necromancer: '#aa44dd', revenant: '#ff4444', generated: '#44ff88',
  };

  // For generated classes, get portrait from the generated class data
  const genClass = playerClass === 'generated' ? (() => {
    try {
      const json = localStorage.getItem('dod_backup_activeGeneratedClass');
      return json ? JSON.parse(json) : null;
    } catch { return null; }
  })() : null;

  const classPortraitSrc = playerClass === 'generated' 
    ? (genClass?.portraitUrl ?? generatedClassThumb)
    : (portraits[playerClass] ?? null);
  const normalSrc = (state.playerRace && raceThumbUrl) ? raceThumbUrl : classPortraitSrc;
  const damagedSrc = portraits[`${playerClass}-damaged`] ?? null;
  const hasDamaged = !!damagedSrc;
  const showPortrait = !!normalSrc || (playerClass === 'generated' && genClass);

  const isTransformed = !!(transformDef && transformPortraitUrl);
  let portraitSrc = isTransformed
    ? transformPortraitUrl
    : isStoryMode && storyPortraitUrl ? storyPortraitUrl : normalSrc;
  const raceDef = state.playerRace ? getRaceDef(state.playerRace) : undefined;
  let portraitBorder = isTransformed
    ? transformColor
    : isStoryMode
      ? '#cc8844'
      : (state.playerRace && raceDef)
        ? raceDef.color
        : playerClass === 'generated' 
          ? (genClass?.color ?? '#44ff88')
          : (classBorders[playerClass] ?? '#ff6644');
  if (hasDamaged && hpPct <= 0.5 && !isStoryMode) {
    portraitSrc = damagedSrc;
    portraitBorder = '#ff3333';
  }

  return (
    <div style={hudStyle}>
      {/* Top section: portrait + core stats side by side */}
      <div style={hudTopRowStyle}>
        {showPortrait && portraitSrc && (
          <div style={portraitContainerStyle}>
            <img src={portraitSrc} alt="" style={{ ...hudPortraitStyle, borderColor: portraitBorder, boxShadow: `0 0 8px ${portraitBorder}44, inset 0 0 4px #00000088` }} />
            {isPremium && <span style={premiumBadgeOverlayStyle}>&#x2B50;</span>}
          </div>
        )}
        {/* Generated class character portrait (no image URL) */}
        {showPortrait && !portraitSrc && playerClass === 'generated' && genClass && (
          <div style={portraitContainerStyle}>
            <div style={{ 
              ...hudPortraitStyle, 
              borderColor: portraitBorder, 
              boxShadow: `0 0 8px ${portraitBorder}44, inset 0 0 4px #00000088`,
              background: `radial-gradient(circle, ${genClass.color}33 0%, #0a0a0f 70%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              color: genClass.color,
              textShadow: `0 0 10px ${genClass.color}`,
            }}>
              {genClass.char}
            </div>
            {isPremium && <span style={premiumBadgeOverlayStyle}>&#x2B50;</span>}
          </div>
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
          {/* Row 1: Name / Level / HP */}
          <div style={rowStyle}>
            {!showPortrait && (
              <span style={{ color: classDef?.color ?? '#33ff66', fontWeight: 'bold', fontSize: 16, textShadow: `0 0 4px ${classDef?.color ?? '#33ff66'}44` }}>@</span>
            )}
            {!showPortrait && isPremium && <span style={premiumBadgeStyle}>&#x2B50;</span>}
            <span style={{ ...labelStyle, color: classDef?.color ?? '#33ff66' }}>{classDef?.name ?? '??'}</span>
            <span style={{ ...labelStyle, color: '#33ff66' }}>Lv{player.level}</span>
            <span style={{ ...labelStyle, color: hpColor }}>HP</span>
            <CompactBar current={player.stats.hp} max={eMaxHp} color={hpColor} width={showPortrait ? 7 : 10} />
            <span style={{ ...compactStatStyle, color: hpColor }}>
              {player.stats.hp}/{eMaxHp}
            </span>
          </div>
          {/* Row 2: Class-specific resource */}
          {playerClass === 'warrior' && (
            <div style={rowStyle}>
              <span style={{ ...compactLabelStyle, color: rageColor }}>Rage</span>
              <CompactBar current={rage} max={100} color={rageColor} width={showPortrait ? 7 : 10} />
              <span style={{ ...compactStatStyle, color: rageColor }}>{rage}/100</span>
              {rage >= 30 && (
                <span style={{ ...compactStatStyle, color: '#ff0000', fontWeight: 'bold', textShadow: '0 0 6px #ff000088' }}>
                  {'⚔ READY'}
                </span>
              )}
            </div>
          )}
          {playerClass === 'paladin' && (
            <div style={rowStyle}>
              <span style={{ ...compactLabelStyle, color: vowColor }}>Vow</span>
              <CompactBar current={vowStacks} max={5} color={vowColor} width={showPortrait ? 7 : 10} />
              <span style={{ ...compactStatStyle, color: vowColor }}>{vowStacks}/5</span>
              {vowActive && (
                <span style={{ ...compactStatStyle, color: '#ffffff', fontWeight: 'bold', textShadow: '0 0 6px #ffd70088' }}>
                  {'✦ SHIELDED'}
                </span>
              )}
              {!vowActive && vowStacks >= 1 && (
                <span style={{ ...compactStatStyle, color: '#ffd700', fontWeight: 'bold' }}>
                  {'✦ READY'}
                </span>
              )}
            </div>
          )}
          {playerClass === 'rogue' && (() => {
            const cd = getRogueShadowCooldown(state);
            const shadowColor = cd === 0 ? '#aa55ff' : '#553388';
            return (
              <div style={rowStyle}>
                <span style={{ ...compactLabelStyle, color: shadowColor }}>Shadow</span>
                <span style={{ ...compactStatStyle, color: shadowColor }}>{cd === 0 ? '' : `CD:${cd}`}</span>
                {cd === 0 && (
                  <span style={{ ...compactStatStyle, color: '#aa55ff', fontWeight: 'bold', textShadow: '0 0 6px #aa55ff88' }}>
                    {'👣 READY'}
                  </span>
                )}
              </div>
            );
          })()}
          {playerClass === 'mage' && (() => {
            const cd = getMageBlastCooldown(state);
            const blastColor = cd === 0 ? '#8855ff' : '#443388';
            return (
              <div style={rowStyle}>
                <span style={{ ...compactLabelStyle, color: blastColor }}>Blast</span>
                <span style={{ ...compactStatStyle, color: blastColor }}>{cd === 0 ? '' : `CD:${cd}`}</span>
                {cd === 0 && (
                  <span style={{ ...compactStatStyle, color: '#8855ff', fontWeight: 'bold', textShadow: '0 0 6px #8855ff88' }}>
                    {'✦ READY'}
                  </span>
                )}
              </div>
            );
          })()}
          {playerClass === 'ranger' && (() => {
            const mark = getRangerMark(state);
            const markColor = mark.hitsLeft > 0 ? '#ffaa00' : mark.cooldown === 0 ? '#ffaa00' : '#886600';
            return (
              <div style={rowStyle}>
                <span style={{ ...compactLabelStyle, color: markColor }}>Mark</span>
                {mark.hitsLeft > 0 && (
                  <span style={{ ...compactStatStyle, color: '#ffaa00', fontWeight: 'bold', textShadow: '0 0 6px #ffaa0088' }}>
                    {'◎ ACTIVE'} x{mark.hitsLeft}
                  </span>
                )}
                {mark.hitsLeft === 0 && mark.cooldown > 0 && (
                  <span style={{ ...compactStatStyle, color: '#886600' }}>CD:{mark.cooldown}</span>
                )}
                {mark.hitsLeft === 0 && mark.cooldown === 0 && (
                  <span style={{ ...compactStatStyle, color: '#ffaa00', fontWeight: 'bold', textShadow: '0 0 6px #ffaa0088' }}>
                    {'◎ READY'}
                  </span>
                )}
              </div>
            );
          })()}
          {playerClass === 'necromancer' && (() => {
            const skele = getNecroSkeletons(state);
            const skeleColor = skele.cooldown === 0 && skele.count < skele.max ? '#aa44dd' : '#663388';
            return (
              <div style={rowStyle}>
                <span style={{ ...compactLabelStyle, color: skeleColor }}>Minions</span>
                <span style={{ ...compactStatStyle, color: skele.count > 0 ? '#aa44dd' : '#663388' }}>
                  {skele.count}/{skele.max}
                </span>
                {skele.cooldown > 0 && (
                  <span style={{ ...compactStatStyle, color: '#663388' }}>CD:{skele.cooldown}</span>
                )}
                {skele.cooldown === 0 && skele.count < skele.max && (
                  <span style={{ ...compactStatStyle, color: '#aa44dd', fontWeight: 'bold', textShadow: '0 0 6px #aa44dd88' }}>
                    {'💀 READY'}
                  </span>
                )}
              </div>
            );
          })()}
          {playerClass === 'generated' && (() => {
            const genInfo = getGeneratedClassInfo(state);
            if (!genInfo) return null;
            const isReady = genInfo.abilityCooldown === 0 && genInfo.resource >= genInfo.abilityCost;
            const resourceColor = isReady ? genInfo.resourceColor : '#666688';
            return (
              <div style={rowStyle}>
                <span style={{ ...compactLabelStyle, color: resourceColor }}>
                  {genInfo.resourceIcon} {genInfo.resourceName}
                </span>
                <CompactBar current={genInfo.resource} max={genInfo.maxResource} color={resourceColor} width={showPortrait ? 7 : 10} />
                <span style={{ ...compactStatStyle, color: resourceColor }}>
                  {genInfo.resource}/{genInfo.maxResource}
                </span>
                {genInfo.abilityCooldown > 0 && (
                  <span style={{ ...compactStatStyle, color: '#666688' }}>CD:{genInfo.abilityCooldown}</span>
                )}
                {isReady && (
                  <span style={{ ...compactStatStyle, color: genInfo.resourceColor, fontWeight: 'bold', textShadow: `0 0 6px ${genInfo.resourceColor}88` }}>
                    {genInfo.abilityIcon} READY
                  </span>
                )}
              </div>
            );
          })()}
          {/* Row 3: Food */}
          <div style={rowStyle}>
            <span style={{ ...compactLabelStyle, color: hungerColor }}>Food</span>
            <CompactBar current={hunger.current} max={hunger.max} color={hungerColor} width={showPortrait ? 10 : 14} />
            <span style={{ ...compactStatStyle, color: hungerColor }}>
              {Math.floor(hunger.current)}/{hunger.max}
            </span>
          </div>
          {/* Row 3b: XP */}
          <div style={rowStyle}>
            <span style={{ ...compactLabelStyle, color: '#22aa44' }}>XP</span>
            <CompactBar current={player.xp} max={nextXp} color={'#22aa44'} width={showPortrait ? 10 : 14} />
            <span style={{ ...compactStatStyle, color: '#22aa44' }}>
              {player.xp}/{nextXp}
            </span>
          </div>
          {/* Row 4: Combat stats / Gold */}
          <div style={rowStyle}>
            <span style={{ ...compactStatStyle, color: '#33ff66' }}>Atk:{eAtk}</span>
            <span style={{ ...compactStatStyle, color: '#33ff66' }}>Def:{eDef}</span>
            <span style={{ ...compactStatStyle, color: '#33ff66' }}>Spd:{eSpd}</span>
            {getPlayerRange(state) > 1 && <span style={{ ...compactStatStyle, color: '#88ccff' }}>Rng:{getPlayerRange(state)}</span>}
            {eRegen > 0 && <span style={{ ...compactStatStyle, color: '#66ffaa' }}>Rgn:+{eRegen}</span>}
            <span style={{ color: '#0a3a0a' }}>|</span>
            <span style={{ ...compactStatStyle, color: '#ccaa22' }}>Gold:{score}</span>
            {echoes != null && echoes > 0 && <span style={{ ...compactStatStyle, color: '#55ccff' }}>~{echoes}</span>}
            {state.skillPoints > 0 && (
              <span style={{ ...compactStatStyle, color: '#ffcc33', fontWeight: 'bold', textShadow: '0 0 6px #ffcc3344' }}>SP:{state.skillPoints}</span>
            )}
            <span style={{ ...compactStatStyle, color: '#33ff66' }}>F:{floorNumber}</span>
            {(() => {
              const zd = getZoneDef(state.zone);
              const elInfo = zd.element ? ELEMENT_INFO[zd.element] : undefined;
              return <>
                <span style={{ ...compactStatStyle, color: zd.color, opacity: 0.8 }}>{zd.name.split(' ')[0]}</span>
                {elInfo && <span style={{ ...compactStatStyle, color: elInfo.color, opacity: 0.7 }} title={`Zone element: ${elInfo.name}`}>{elInfo.icon}</span>}
              </>;
            })()}
            {state.mercenaries && state.mercenaries.filter(m => !m.isDead).length > 0 && (
              <span style={{ ...compactStatStyle, color: '#88ccff' }}>Party:{state.mercenaries.filter(m => !m.isDead).length}</span>
            )}
            {generation != null && generation > 0 && (
              <span style={{ ...compactStatStyle, color: '#c49eff', opacity: 0.7 }}>G:{generation}</span>
            )}
          </div>
        </div>
      </div>
      {/* Transformation indicator */}
      {transformDef && (
        <div style={{ ...rowStyle, borderTop: `1px solid ${transformColor}33`, paddingTop: 2, marginTop: 1 }}>
          <span style={{ ...compactStatStyle, color: (state._transformPermanent || state.dinoPermanent) ? '#ff4444' : transformColor, fontWeight: 'bold', textShadow: `0 0 6px ${(state._transformPermanent || state.dinoPermanent) ? '#ff444488' : transformColor + '88'}` }}>
            {(state._transformPermanent || state.dinoPermanent)
              ? `PERMANENT ${transformDef.name.toUpperCase()}`
              : `${transformDef.name.toUpperCase()} (${isDinoForm ? state.dinoTransformTurns : state._transformTurns} turns)`}
          </span>
        </div>
      )}
      {/* Status effects row */}
      {player.statusEffects && player.statusEffects.length > 0 && (
        <div style={rowStyle}>
          {player.statusEffects.map((e, i) => {
            const effectColors: Record<string, string> = { poison: '#33cc11', bleed: '#ff4444', stun: '#ffff44', freeze: '#88ccff' };
            const effectIcons: Record<string, string> = { poison: '\u2620', bleed: '\u2764', stun: '\u26A1', freeze: '\u2744' };
            return (
              <span key={i} style={{ ...compactStatStyle, color: effectColors[e.type] ?? '#fff' }}>
                {effectIcons[e.type] ?? '?'}{e.type}({e.turnsRemaining})
              </span>
            );
          })}
        </div>
      )}
      {/* Legacy ability indicators */}
      {(() => {
        const leg = getLegacyAbilityState(state);
        if (!leg._legacyAbilities || leg._legacyAbilities.length === 0) return null;
        const indicators: { id: string; name: string; active: boolean; cd: number; turnsLeft?: number }[] = [];
        // Warrior
        if (hasLegacyAbility(state, 'legacy_warrior_block')) {
          const cd = leg._legacyBlockCD ?? 0;
          indicators.push({ id: 'legacy_warrior_block', name: 'Block', active: cd <= 0, cd });
        }
        if (hasLegacyAbility(state, 'legacy_warrior_wall')) {
          const t = leg._legacyWallTurns ?? 0;
          const cd = leg._legacyWallCD ?? 0;
          indicators.push({ id: 'legacy_warrior_wall', name: 'Wall', active: t > 0, cd: t > 0 ? 0 : cd, turnsLeft: t > 0 ? t : undefined });
        }
        if (hasLegacyAbility(state, 'legacy_warrior_reflect')) {
          const armed = leg._legacyReflect ?? false;
          const cd = leg._legacyReflectCD ?? 0;
          indicators.push({ id: 'legacy_warrior_reflect', name: 'Reflect', active: armed, cd: armed ? 0 : cd });
        }
        // Rogue
        if (hasLegacyAbility(state, 'legacy_rogue_evade')) {
          const t = leg._legacyDodgeTurns ?? 0;
          const cd = leg._legacyDodgeCD ?? 0;
          indicators.push({ id: 'legacy_rogue_evade', name: 'Dodge', active: t > 0, cd: t > 0 ? 0 : cd, turnsLeft: t > 0 ? t : undefined });
        }
        if (hasLegacyAbility(state, 'legacy_rogue_crit')) {
          const armed = leg._legacyCrit ?? false;
          const cd = leg._legacyCritCD ?? 0;
          indicators.push({ id: 'legacy_rogue_crit', name: 'Fatal', active: armed, cd: armed ? 0 : cd });
        }
        if (hasLegacyAbility(state, 'legacy_rogue_vanish')) {
          const t = leg._legacyVanishTurns ?? 0;
          const cd = leg._legacyVanishCD ?? 0;
          indicators.push({ id: 'legacy_rogue_vanish', name: 'Vanish', active: t > 0, cd: t > 0 ? 0 : cd, turnsLeft: t > 0 ? t : undefined });
        }
        // Mage
        if (hasLegacyAbility(state, 'legacy_mage_burst')) {
          const cd = leg._legacyBurstCD ?? 0;
          indicators.push({ id: 'legacy_mage_burst', name: 'Burst', active: cd <= 0, cd });
        }
        if (hasLegacyAbility(state, 'legacy_mage_shield')) {
          const barrier = leg._legacyBarrier ?? 0;
          const cd = leg._legacyBarrierCD ?? 0;
          indicators.push({ id: 'legacy_mage_shield', name: `Barrier${barrier > 0 ? ':' + barrier : ''}`, active: barrier > 0, cd: barrier > 0 ? 0 : cd });
        }
        if (hasLegacyAbility(state, 'legacy_mage_nova')) {
          const cd = leg._legacyNovaCD ?? 0;
          indicators.push({ id: 'legacy_mage_nova', name: 'Nova', active: cd <= 0, cd });
        }
        // Ranger
        if (hasLegacyAbility(state, 'legacy_ranger_pierce')) {
          const armed = leg._legacyPierce ?? false;
          const cd = leg._legacyPierceCD ?? 0;
          indicators.push({ id: 'legacy_ranger_pierce', name: 'Pierce', active: armed, cd: armed ? 0 : cd });
        }
        if (hasLegacyAbility(state, 'legacy_ranger_multi')) {
          const cd = leg._legacyMultiCD ?? 0;
          indicators.push({ id: 'legacy_ranger_multi', name: 'Multi', active: cd <= 0, cd });
        }
        if (hasLegacyAbility(state, 'legacy_ranger_rain')) {
          const cd = leg._legacyRainCD ?? 0;
          indicators.push({ id: 'legacy_ranger_rain', name: 'Rain', active: cd <= 0, cd });
        }
        // Paladin
        if (hasLegacyAbility(state, 'legacy_paladin_heal')) {
          const cd = leg._legacyHealCD ?? 0;
          indicators.push({ id: 'legacy_paladin_heal', name: 'Mend', active: cd <= 0, cd });
        }
        if (hasLegacyAbility(state, 'legacy_paladin_aura')) {
          const t = leg._legacyAuraTurns ?? 0;
          const cd = leg._legacyAuraCD ?? 0;
          indicators.push({ id: 'legacy_paladin_aura', name: 'Aura', active: t > 0, cd: t > 0 ? 0 : cd, turnsLeft: t > 0 ? t : undefined });
        }
        if (hasLegacyAbility(state, 'legacy_paladin_judgment')) {
          const cd = leg._legacyPalJudgeCD ?? 0;
          indicators.push({ id: 'legacy_paladin_judgment', name: 'Smite', active: cd <= 0, cd });
        }
        // Hellborn
        if (hasLegacyAbility(state, 'legacy_hellborn_drain')) {
          const t = leg._legacyDrainTurns ?? 0;
          const cd = leg._legacyDrainCD ?? 0;
          indicators.push({ id: 'legacy_hellborn_drain', name: 'Siphon', active: t > 0, cd: t > 0 ? 0 : cd, turnsLeft: t > 0 ? t : undefined });
        }
        if (hasLegacyAbility(state, 'legacy_hellborn_eruption')) {
          const cd = leg._legacyEruptionCD ?? 0;
          indicators.push({ id: 'legacy_hellborn_eruption', name: 'Erupt', active: cd <= 0, cd });
        }
        if (hasLegacyAbility(state, 'legacy_hellborn_curse')) {
          const t = leg._legacyCurseTurns ?? 0;
          const cd = leg._legacyCurseCD ?? 0;
          indicators.push({ id: 'legacy_hellborn_curse', name: 'Curse', active: t > 0, cd: t > 0 ? 0 : cd, turnsLeft: t > 0 ? t : undefined });
        }
        if (indicators.length === 0) return null;
        return (
          <div style={{ ...rowStyle, borderTop: '1px solid #c49eff33', paddingTop: 2, marginTop: 1 }}>
            <span style={{ ...compactLabelStyle, color: '#c49eff', fontSize: 9 }}>Legacy</span>
            {indicators.map((ind) => (
              <span
                key={ind.id}
                style={{
                  fontSize: 9,
                  fontFamily: 'monospace',
                  color: ind.active ? '#c49eff' : '#665588',
                  textShadow: ind.active ? '0 0 4px #c49eff66' : 'none',
                  whiteSpace: 'nowrap',
                }}
                title={LEGACY_ABILITY_DESCRIPTIONS[ind.id]?.description}
              >
                {ind.active ? '\u2B50' : '\u25CB'}
                {ind.name}
                {ind.turnsLeft != null && `(${ind.turnsLeft})`}
                {!ind.active && ind.cd > 0 && `[${ind.cd}]`}
              </span>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

const hudStyle: CSSProperties = {
  width: '100%',
  padding: '4px 8px',
  background: '#000',
  borderBottom: '1px solid #1a5a2a',
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  fontFamily: 'monospace',
  fontSize: 14,
  userSelect: 'none',
};

const hudTopRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
};

const portraitContainerStyle: CSSProperties = {
  position: 'relative',
  flexShrink: 0,
};

const hudPortraitStyle: CSSProperties = {
  width: 96,
  height: 96,
  borderRadius: 4,
  border: '2px solid #ff6644',
  boxShadow: '0 0 8px #ff664444, inset 0 0 4px #00000088',
  objectFit: 'cover',
  imageRendering: 'pixelated',
  display: 'block',
};

const premiumBadgeOverlayStyle: CSSProperties = {
  position: 'absolute',
  top: -4,
  right: -4,
  fontSize: 12,
  filter: 'drop-shadow(0 0 3px #ffd700)',
};

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  flexWrap: 'wrap',
};

const labelStyle: CSSProperties = {
  color: '#1a8a3a',
  fontSize: 14,
  minWidth: 24,
};

const compactLabelStyle: CSSProperties = {
  color: '#1a8a3a',
  fontSize: 11,
  minWidth: 24,
};

const compactStatStyle: CSSProperties = {
  fontSize: 11,
  whiteSpace: 'nowrap',
};

const premiumBadgeStyle: CSSProperties = {
  fontSize: 10,
  lineHeight: 1,
  filter: 'drop-shadow(0 0 3px #ffd700)',
};
