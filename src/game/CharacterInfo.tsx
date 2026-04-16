import { useState, type CSSProperties } from 'react';
import type { GameState, ChoosableAbility, Element, QuestEchoData, EquipSlot } from './types';
import { getClassDef, getPlayerEffectiveStats } from './engine';
import { getSkillNode } from './skillTree';
import { computeEchoBonuses } from './echoTree';
import { computeBloodlineBonuses } from './traits';
import { SHARED_ABILITIES } from './constants';
import { ELEMENT_INFO } from './elements';
import { useCdnImage } from './useCdnImage';
import { getGearForClass, getGearDisplayName, getGearDisplayColor, getCumulativeStats, getUnlockedAbilities, LEGACY_ABILITY_DESCRIPTIONS } from './legacyGear';

const WEAKNESS_CHAIN: { atk: Element; beats: Element }[] = [
  { atk: 'fire', beats: 'ice' },
  { atk: 'ice', beats: 'lightning' },
  { atk: 'lightning', beats: 'poison' },
  { atk: 'poison', beats: 'holy' },
  { atk: 'holy', beats: 'dark' },
  { atk: 'dark', beats: 'fire' },
];

interface CharacterInfoProps {
  state: GameState;
  questEchoData: QuestEchoData;
  onClose: () => void;
}

/** A single source of bonus for a stat */
interface StatSource {
  label: string;
  value: number;
  color: string;
}

/** Compute where each stat point comes from */
function computeStatBreakdown(state: GameState, questEchoData: QuestEchoData) {
  const { player, playerClass } = state;
  const classDef = getClassDef(playerClass);
  if (!classDef) return null;

  // 1. Class base
  const base = classDef.baseStats;

  // 2. Level-ups: (level - 1) * bonus per level
  const levelsGained = player.level - 1;
  const levelHp = levelsGained * classDef.levelBonusHp;
  const levelAtk = levelsGained * classDef.levelBonusAtk;
  const levelDef = levelsGained * classDef.levelBonusDef;

  // 3. Bloodline
  let bloodHp = 0, bloodAtk = 0, bloodDef = 0, bloodSpd = 0;
  if (state._bloodlineRef) {
    const bl = computeBloodlineBonuses(state._bloodlineRef);
    bloodHp = bl.statBonuses.maxHp ?? 0;
    bloodAtk = bl.statBonuses.attack ?? 0;
    bloodDef = bl.statBonuses.defense ?? 0;
    bloodSpd = bl.statBonuses.speed ?? 0;
  }

  // 4. Echo Tree
  const echo = computeEchoBonuses(questEchoData);
  const echoHp = echo.statBonuses.maxHp ?? 0;
  const echoAtk = echo.statBonuses.attack ?? 0;
  const echoDef = echo.statBonuses.defense ?? 0;
  const echoSpd = echo.statBonuses.speed ?? 0;

  // 5. Skill Tree — sum stat effects from unlocked nodes
  let skillHp = 0, skillAtk = 0, skillDef = 0, skillSpd = 0;
  for (const nid of state.unlockedNodes) {
    const nd = getSkillNode(playerClass, nid);
    if (!nd) continue;
    collectSkillStats(nd.effect);
  }
  function collectSkillStats(eff: import('./types').SkillNodeEffect) {
    if (eff.type === 'stat') {
      if (eff.stat === 'maxHp') skillHp += eff.value;
      else if (eff.stat === 'attack') skillAtk += eff.value;
      else if (eff.stat === 'defense') skillDef += eff.value;
      else if (eff.stat === 'speed') skillSpd += eff.value;
    } else if (eff.type === 'ability') {
      // Some abilities grant immediate stats
      switch (eff.abilityId) {
        case 'nec_dark_pact': skillAtk += 4; skillHp -= 5; break;
        case 'nec_bone_armor': skillDef += 3; break;
        case 'rev_undead_vigor': skillHp += 8; break;
        case 'rev_relentless': skillSpd += 5; break;
      }
    } else if (eff.type === 'multi') {
      for (const e of eff.effects) collectSkillStats(e);
    }
  }

  // 6. Gear
  let gearHp = 0, gearAtk = 0, gearDef = 0, gearSpd = 0, gearRegen = 0;
  for (const item of Object.values(player.equipment)) {
    if (item?.statBonus) {
      gearHp += item.statBonus.maxHp ?? 0;
      gearAtk += item.statBonus.attack ?? 0;
      gearDef += item.statBonus.defense ?? 0;
      gearSpd += item.statBonus.speed ?? 0;
      gearRegen += item.statBonus.hp ?? 0;
    }
  }

  // Build per-stat source lists (only include non-zero sources)
  function sources(entries: [string, number, string][]): StatSource[] {
    return entries.filter(([, v]) => v !== 0).map(([label, value, color]) => ({ label, value, color }));
  }

  return {
    hp: {
      total: player.stats.maxHp + gearHp,
      current: player.stats.hp,
      sources: sources([
        ['Class Base', base.maxHp, '#aa6666'],
        ['Leveling', levelHp, '#ff4444'],
        ['Bloodline', bloodHp, '#ff8844'],
        ['Echo Tree', echoHp, '#55ccff'],
        ['Skills', skillHp, '#aa55ff'],
        ['Gear', gearHp, '#33cc55'],
      ]),
    },
    attack: {
      total: player.stats.attack + gearAtk,
      sources: sources([
        ['Class Base', base.attack, '#aa7744'],
        ['Leveling', levelAtk, '#ff8844'],
        ['Bloodline', bloodAtk, '#ff8844'],
        ['Echo Tree', echoAtk, '#55ccff'],
        ['Skills', skillAtk, '#aa55ff'],
        ['Gear', gearAtk, '#33cc55'],
      ]),
    },
    defense: {
      total: player.stats.defense + gearDef,
      sources: sources([
        ['Class Base', base.defense, '#6688aa'],
        ['Leveling', levelDef, '#4488ff'],
        ['Bloodline', bloodDef, '#ff8844'],
        ['Echo Tree', echoDef, '#55ccff'],
        ['Skills', skillDef, '#aa55ff'],
        ['Gear', gearDef, '#33cc55'],
      ]),
    },
    speed: {
      total: player.stats.speed + gearSpd,
      sources: sources([
        ['Class Base', base.speed, '#44aa88'],
        ['Bloodline', bloodSpd, '#ff8844'],
        ['Echo Tree', echoSpd, '#55ccff'],
        ['Skills', skillSpd, '#aa55ff'],
        ['Gear', gearSpd, '#33cc55'],
      ]),
    },
    regen: gearRegen,
    // Non-stat echo bonuses for the bonus section
    echoBonuses: echo,
  };
}

export function CharacterInfo({ state, questEchoData, onClose }: CharacterInfoProps) {
  const { player, playerClass } = state;
  const classDef = getClassDef(playerClass);
  const eStats = getPlayerEffectiveStats(state);

  if (!classDef) return null;

  const breakdown = computeStatBreakdown(state, questEchoData);

  // Figure out which passives are unlocked vs locked
  const passives = classDef.passives.map(p => ({
    ...p,
    unlocked: player.level >= p.unlockLevel,
  }));

  // Equipment summary
  const slots: { label: string; slot: EquipSlot }[] = [
    { label: 'Weapon', slot: 'weapon' },
    { label: 'Offhand', slot: 'offhand' },
    { label: 'Armor', slot: 'armor' },
    { label: 'Cloak', slot: 'cloak' },
    { label: 'Boots', slot: 'boots' },
    { label: 'Ring', slot: 'ring' },
    { label: 'Amulet', slot: 'amulet' },
    { label: 'Trinket', slot: 'trinket' },
  ];

  // Collect non-stat echo bonuses that are active
  const echoBonusList: { label: string; value: string; color: string }[] = [];
  if (breakdown) {
    const eb = breakdown.echoBonuses;
    if (eb.xpBonusPercent > 0) echoBonusList.push({ label: 'XP Bonus', value: `+${eb.xpBonusPercent}%`, color: '#ffcc33' });
    if (eb.lootRarityBoostPercent > 0) echoBonusList.push({ label: 'Rare Loot', value: `+${eb.lootRarityBoostPercent}%`, color: '#88aaff' });
    if (eb.shopDiscountPercent > 0) echoBonusList.push({ label: 'Shop Discount', value: `${eb.shopDiscountPercent}%`, color: '#ffaa33' });
    if (eb.hungerSlowdownPercent > 0) echoBonusList.push({ label: 'Hunger Slowdown', value: `${eb.hungerSlowdownPercent}%`, color: '#88cc44' });
    if (eb.terrainResistPercent > 0) echoBonusList.push({ label: 'Terrain Resist', value: `${eb.terrainResistPercent}%`, color: '#cc8844' });
    if (eb.maxFloorExtend > 0) echoBonusList.push({ label: 'Extra Floors', value: `+${eb.maxFloorExtend}`, color: '#33ccff' });
    if (eb.bonusSkillPoints > 0) echoBonusList.push({ label: 'Bonus Skill Pts', value: `+${eb.bonusSkillPoints}/run`, color: '#cc77ff' });
    if (eb.startingGold > 0) echoBonusList.push({ label: 'Starting Gold', value: `+${eb.startingGold}`, color: '#ffd700' });
    if (eb.hungerMaxBonus > 0) echoBonusList.push({ label: 'Max Hunger', value: `+${eb.hungerMaxBonus}`, color: '#33ccff' });
  }

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
    death_knight: useCdnImage('death-knight-portrait.png'),
  };

  const classBorders: Record<string, string> = {
    warrior: '#ff6644', mage: '#8855ff', paladin: '#ffd700',
    rogue: '#ffcc33', ranger: '#33cc66', hellborn: '#ff2200',
  };

  const hpPct = eStats.maxHp > 0 ? player.stats.hp / eStats.maxHp : 1;
  const normalSrc = portraits[playerClass] ?? null;
  const damagedSrc = portraits[`${playerClass}-damaged`] ?? null;
  const showPortrait = !!normalSrc;

  let charPortraitSrc = normalSrc;
  let charPortraitBorder = classBorders[playerClass] ?? '#ff6644';
  if (damagedSrc && hpPct <= 0.5) {
    charPortraitSrc = damagedSrc;
    charPortraitBorder = '#ff3333';
  }

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        {/* Header with close button */}
        <div style={headerStyle}>
          <span style={{ ...titleStyle, color: classDef.color }}>
            {!showPortrait && <span style={{ marginRight: 6 }}>@</span>}
            {classDef.name}
          </span>
          <span style={levelStyle}>Level {player.level}</span>
          <button style={closeBtnStyle} onClick={onClose}>[X]</button>
        </div>

        <div style={contentStyle}>
          {/* Portrait + Stats hero section */}
          {showPortrait ? (
            <div style={heroSectionStyle}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={descStyle}>{classDef.description}</div>
                <div style={{ fontSize: 9, color: '#555', fontFamily: 'monospace' }}>
                  Tap a stat to see where it comes from
                </div>
                <div style={statsGridStyle}>
                  {breakdown && (
                    <>
                      <StatRowExpand label="HP" value={`${player.stats.hp} / ${eStats.maxHp}`} color="#ff4444" sources={breakdown.hp.sources} />
                      <StatRowExpand label="Attack" value={`${eStats.attack}`} color="#ff8844" sources={breakdown.attack.sources} />
                      <StatRowExpand label="Defense" value={`${eStats.defense}`} color="#4488ff" sources={breakdown.defense.sources} />
                      <StatRowExpand label="Speed" value={`${eStats.speed}`} color="#44ffcc" sources={breakdown.speed.sources} />
                      {breakdown.regen > 0 && (
                        <StatRowExpand label="Regen" value={`+${breakdown.regen}/turn`} color="#66ffaa" sources={[{ label: 'Gear', value: breakdown.regen, color: '#33cc55' }]} />
                      )}
                    </>
                  )}
                </div>
              </div>
              <div style={charInfoPortraitContainerStyle}>
                <img src={charPortraitSrc!} alt="" style={{ ...charInfoPortraitStyle, borderColor: charPortraitBorder, boxShadow: `0 0 12px ${charPortraitBorder}33, inset 0 0 6px #00000088` }} />
              </div>
            </div>
          ) : (
            <>
              <div style={descStyle}>{classDef.description}</div>
              <div style={sectionTitleStyle}>STATS</div>
              <div style={{ fontSize: 9, color: '#555', marginBottom: 4, fontFamily: 'monospace' }}>
                Tap a stat to see where it comes from
              </div>
              <div style={statsGridStyle}>
                {breakdown && (
                  <>
                    <StatRowExpand label="HP" value={`${player.stats.hp} / ${eStats.maxHp}`} color="#ff4444" sources={breakdown.hp.sources} />
                    <StatRowExpand label="Attack" value={`${eStats.attack}`} color="#ff8844" sources={breakdown.attack.sources} />
                    <StatRowExpand label="Defense" value={`${eStats.defense}`} color="#4488ff" sources={breakdown.defense.sources} />
                    <StatRowExpand label="Speed" value={`${eStats.speed}`} color="#44ffcc" sources={breakdown.speed.sources} />
                    {breakdown.regen > 0 && (
                      <StatRowExpand label="Regen" value={`+${breakdown.regen}/turn`} color="#66ffaa" sources={[{ label: 'Gear', value: breakdown.regen, color: '#33cc55' }]} />
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {/* Echo Tree active bonuses (non-stat) */}
          {echoBonusList.length > 0 && (
            <>
              <div style={sectionTitleStyle}>ECHO TREE BONUSES</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, fontFamily: 'monospace' }}>
                {echoBonusList.map((b, i) => (
                  <div key={i} style={echoBonusChipStyle}>
                    <span style={{ color: b.color, fontSize: 10 }}>{b.value}</span>
                    <span style={{ color: '#888', fontSize: 9 }}> {b.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Level-up bonuses */}
          <div style={sectionTitleStyle}>PER LEVEL</div>
          <div style={perLevelStyle}>
            <span style={{ color: '#ff4444' }}>+{classDef.levelBonusHp} HP</span>
            <span style={{ color: '#ff8844' }}>+{classDef.levelBonusAtk} ATK</span>
            <span style={{ color: '#4488ff' }}>+{classDef.levelBonusDef} DEF</span>
          </div>

          {/* Class Passives */}
          <div style={sectionTitleStyle}>CLASS PASSIVES</div>
          {passives.map((p, i) => (
            <div key={i} style={p.unlocked ? abilityUnlockedStyle : abilityLockedStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: p.unlocked ? '#33ff66' : '#555' }}>
                  {p.unlocked ? p.name : '???'}
                </span>
                <span style={{ fontSize: 9, color: p.unlocked ? '#1a8a3a' : '#444' }}>
                  {p.unlocked ? 'ACTIVE' : `Unlocks at Lv ${p.unlockLevel}`}
                </span>
              </div>
              <div style={{ fontSize: 10, color: p.unlocked ? '#99ccaa' : '#444', marginTop: 2 }}>
                {p.unlocked ? p.description : 'Reach the required level to unlock'}
              </div>
            </div>
          ))}

          {/* Chosen Abilities */}
          {player.chosenAbilities && player.chosenAbilities.length > 0 && (
            <>
              <div style={sectionTitleStyle}>CHOSEN ABILITIES</div>
              {player.chosenAbilities.map((abilityId) => {
                const allAbilities: ChoosableAbility[] = [...(classDef.abilityPool ?? []), ...SHARED_ABILITIES];
                const ability = allAbilities.find(a => a.id === abilityId);
                if (!ability) return null;
                return (
                  <div key={abilityId} style={chosenAbilityStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14 }}>{ability.icon}</span>
                      <span style={{ fontWeight: 'bold', color: ability.color, fontSize: 11 }}>
                        {ability.name}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: '#99ccaa', marginTop: 2, marginLeft: 22 }}>
                      {ability.description}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Equipment */}
          <div style={sectionTitleStyle}>EQUIPMENT</div>
          {slots.map(({ label, slot }) => {
            const item = player.equipment[slot];
            return (
              <div key={slot} style={equipRowStyle}>
                <span style={{ color: '#555', fontSize: 10, minWidth: 50 }}>{label}:</span>
                {item ? (
                  <span style={{ color: item.color, fontSize: 11 }}>
                    {item.name}
                    {item.element && (
                      <span style={{ color: ELEMENT_INFO[item.element].color, fontSize: 10, marginLeft: 4 }}>
                        {ELEMENT_INFO[item.element].icon}
                      </span>
                    )}
                    {item.statBonus && (
                      <span style={{ color: '#888', fontSize: 9, marginLeft: 4 }}>
                        ({Object.entries(item.statBonus).filter(([,v]) => v).map(([k, v]) => {
                          const labels: Record<string, string> = { attack: 'ATK', defense: 'DEF', speed: 'SPD', maxHp: 'HP', hp: 'RGN' };
                          return `+${v} ${labels[k] ?? k}`;
                        }).join(', ')})
                      </span>
                    )}
                    {item.skillBonus && (
                      <span style={{ color: '#88ccff', fontSize: 9, marginLeft: 4 }}>
                        ({Object.entries(item.skillBonus).filter(([,v]) => v).map(([k, v]) =>
                          `+${v} ${k.charAt(0).toUpperCase() + k.slice(1, 3)}`
                        ).join(', ')})
                      </span>
                    )}
                    {item.onHitEffect && (
                      <span style={{ color: '#c49eff', fontSize: 9, marginLeft: 4 }}>
                        [{item.onHitEffect.type}]
                      </span>
                    )}
                  </span>
                ) : (
                  <span style={{ color: '#333', fontSize: 10 }}>- empty -</span>
                )}
              </div>
            );
          })}

          {/* Legacy Gear */}
          {(() => {
            const bl = state._bloodlineRef;
            if (!bl) return null;
            const legacyData = bl.legacyData;
            if (!legacyData) return null;
            const gear = getGearForClass(legacyData, playerClass);
            if (!gear.earned || gear.level === 0) return null;
            const displayName = getGearDisplayName(gear);
            const displayColor = getGearDisplayColor(gear);
            const stats = getCumulativeStats(gear);
            const abilities = getUnlockedAbilities(gear);
            const asciiIconMap: Record<string, string> = { warrior: '[+]', rogue: '[/]', mage: '[*]', ranger: '[>]', paladin: '[#]', hellborn: '[~]', necromancer: '[!]', revenant: '[?]' };
            const gearTypeMap: Record<string, string> = { warrior: 'Shield', rogue: 'Dagger', mage: 'Orb', ranger: 'Bow', paladin: 'Aegis', hellborn: 'Chain', necromancer: 'Staff', revenant: 'Scythe' };
            const gearTypeName = gearTypeMap[playerClass] ?? 'Gear';
            const asciiIcon = asciiIconMap[playerClass] ?? '[*]';

            // Build ASCII level bar: ████░░░░░░ 5/20
            const maxLvl = 20;
            const filled = Math.max(0, Math.min(10, Math.round((gear.level / maxLvl) * 10)));
            const empty = 10 - filled;
            const lvlBar = '\u2588'.repeat(filled) + '\u2591'.repeat(empty);

            return (
              <>
                <div style={sectionTitleStyle}>LEGACY GEAR</div>
                <div style={legacyGearBoxStyle}>
                  {/* Gear name header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: displayColor, fontWeight: 'bold', fontSize: 11 }}>
                      <span style={{ color: '#c49eff' }}>{asciiIcon}</span> {displayName}
                    </span>
                    <span style={{ color: '#c49eff', fontSize: 9 }}>
                      {gearTypeName}
                    </span>
                  </div>

                  {/* ASCII level bar */}
                  <div style={{ marginTop: 4, fontSize: 10 }}>
                    <span style={{ color: '#555' }}>Lv </span>
                    <span style={{ color: gear.level >= 20 ? '#ff2a6d' : '#c49eff' }}>{lvlBar}</span>
                    <span style={{ color: '#888', marginLeft: 4 }}>{gear.level}/{maxLvl}</span>
                  </div>

                  {/* Stat bonuses as inline tags */}
                  {(stats.maxHp || stats.attack || stats.defense || stats.speed) ? (
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap', fontSize: 10 }}>
                      {stats.maxHp ? <span style={{ color: '#ff4444' }}>[+{stats.maxHp} HP]</span> : null}
                      {stats.attack ? <span style={{ color: '#ff8844' }}>[+{stats.attack} ATK]</span> : null}
                      {stats.defense ? <span style={{ color: '#4488ff' }}>[+{stats.defense} DEF]</span> : null}
                      {stats.speed ? <span style={{ color: '#44ffcc' }}>[+{stats.speed} SPD]</span> : null}
                    </div>
                  ) : null}

                  {/* Unlocked abilities */}
                  {abilities.length > 0 && (
                    <div style={{ marginTop: 6, borderTop: '1px solid #1a0a2a', paddingTop: 4 }}>
                      <div style={{ color: '#6a4a8a', fontSize: 9, letterSpacing: 2 }}>-- ABILITIES --</div>
                      {abilities.map(abilityId => {
                        const desc = LEGACY_ABILITY_DESCRIPTIONS[abilityId];
                        if (!desc) return null;
                        return (
                          <div key={abilityId} style={legacyAbilityRowStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ color: '#c49eff', fontSize: 10 }}>*</span>
                              <span style={{ color: '#e0b0ff', fontSize: 10, fontWeight: 'bold' }}>
                                {desc.name}
                              </span>
                            </div>
                            <div style={{ color: '#666', fontSize: 9, marginLeft: 12, fontStyle: 'italic' }}>
                              {desc.description}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            );
          })()}

          {/* Narrative Skills */}
          {state.skills && (
            <>
              <div style={sectionTitleStyle}>NARRATIVE SKILLS</div>
              <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#666', marginBottom: 6 }}>
                Used for skill checks (2d6 + modifier). Look for yellow ! markers.
              </div>
              <div style={skillsGridStyle}>
                <SkillDisplay name="Stealth" value={state.skills.stealth} icon="[/]" />
                <SkillDisplay name="Diplomacy" value={state.skills.diplomacy} icon="[~]" />
                <SkillDisplay name="Athletics" value={state.skills.athletics} icon="[+]" />
                <SkillDisplay name="Awareness" value={state.skills.awareness} icon="[o]" />
                <SkillDisplay name="Lore" value={state.skills.lore} icon="[?]" />
                <SkillDisplay name="Survival" value={state.skills.survival} icon="[#]" />
              </div>
            </>
          )}

          {/* Active Boons */}
          {state.activeCharacterBoons && state.activeCharacterBoons.length > 0 && (
            <>
              <div style={sectionTitleStyle}>ACTIVE BOONS</div>
              <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#666', marginBottom: 6 }}>
                Temporary buffs from creature encounters.
              </div>
              {state.activeCharacterBoons.filter(b => b.isActive).map(boon => (
                <div key={boon.id} style={{
                  padding: '6px 8px',
                  marginBottom: 4,
                  background: '#0a0808',
                  border: `1px solid ${boon.color || '#3a3a1a'}`,
                  fontFamily: 'monospace',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: boon.color || '#ffcc33', fontSize: 11, fontWeight: 'bold' }}>
                      {boon.icon} {boon.name}
                    </span>
                    {boon.duration === 'floors' && boon.floorsRemaining && (
                      <span style={{ color: '#666', fontSize: 9 }}>
                        {boon.floorsRemaining} floors
                      </span>
                    )}
                    {boon.duration === 'run' && (
                      <span style={{ color: '#44ff88', fontSize: 9 }}>
                        Entire run
                      </span>
                    )}
                  </div>
                  <div style={{ color: '#aaa', fontSize: 10, marginTop: 3 }}>
                    {boon.description}
                  </div>
                  {boon.flavorText && (
                    <div style={{ color: '#666', fontSize: 9, fontStyle: 'italic', marginTop: 2 }}>
                      "{boon.flavorText}"
                    </div>
                  )}
                  <div style={{ color: '#888', fontSize: 9, marginTop: 2 }}>
                    From: {boon.characterName}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Mercenaries */}
          {state.mercenaries.filter(m => !m.isDead).length > 0 && (
            <>
              <div style={sectionTitleStyle}>PARTY</div>
              {state.mercenaries.filter(m => !m.isDead).map(merc => (
                <div key={merc.id} style={equipRowStyle}>
                  <span style={{ color: '#88ccff', fontSize: 11 }}>
                    {merc.mercName ?? merc.name}
                  </span>
                  <span style={{ color: '#555', fontSize: 9, marginLeft: 6 }}>
                    HP:{merc.stats.hp}/{merc.stats.maxHp} ATK:{merc.stats.attack} DEF:{merc.stats.defense}
                  </span>
                </div>
              ))}
            </>
          )}

          {/* Element Weakness Chart */}
          <div style={sectionTitleStyle}>ELEMENTS</div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#888', marginBottom: 4 }}>
            Matching element = 1.5x damage! Monsters glow their element color.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {WEAKNESS_CHAIN.map(({ atk, beats }) => (
              <div key={atk} style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'monospace', fontSize: 10 }}>
                <span style={{ color: ELEMENT_INFO[atk].color, minWidth: 70 }}>
                  {ELEMENT_INFO[atk].icon} {ELEMENT_INFO[atk].name}
                </span>
                <span style={{ color: '#555' }}>beats</span>
                <span style={{ color: ELEMENT_INFO[beats].color }}>
                  {ELEMENT_INFO[beats].icon} {ELEMENT_INFO[beats].name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Display a narrative skill with modifier */
function SkillDisplay({ name, value, icon }: { name: string; value: number; icon: string }) {
  const modifier = getSkillModifier(value);
  const modStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
  const modColor = modifier >= 2 ? '#44dd77' : modifier >= 0 ? '#ffcc33' : '#cc6644';
  
  return (
    <div style={skillRowStyle}>
      <span style={{ color: '#ffcc33', fontSize: 10, fontFamily: 'monospace' }}>{icon}</span>
      <span style={{ color: '#aaa', fontSize: 10, flex: 1 }}>{name}</span>
      <span style={{ color: '#ddd', fontSize: 11, fontWeight: 'bold', minWidth: 20, textAlign: 'right' }}>{value}</span>
      <span style={{ color: modColor, fontSize: 10, minWidth: 24, textAlign: 'right' }}>({modStr})</span>
    </div>
  );
}

function getSkillModifier(skillValue: number): number {
  if (skillValue <= 3) return -2;
  if (skillValue <= 6) return -1;
  if (skillValue <= 9) return 0;
  if (skillValue <= 12) return 1;
  if (skillValue <= 15) return 2;
  if (skillValue <= 18) return 3;
  return 4;
}

/** Stat row with tap-to-expand breakdown */
function StatRowExpand({ label, value, color, sources }: {
  label: string; value: string; color: string; sources: StatSource[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginBottom: 2 }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '3px 0' }}
        onClick={() => setOpen(!open)}
      >
        <span style={{ color, fontSize: 10, minWidth: 50 }}>{label}</span>
        <span style={{ color: '#ddd', fontSize: 12, fontWeight: 'bold' }}>{value}</span>
        <span style={{ color: '#444', fontSize: 9, marginLeft: 'auto' }}>
          {open ? '▾' : '▸'}
        </span>
      </div>
      {open && sources.length > 0 && (
        <div style={breakdownContainerStyle}>
          {sources.map((s, i) => (
            <div key={i} style={breakdownRowStyle}>
              <span style={{ color: '#666', fontSize: 9 }}>{s.label}</span>
              <span style={{ color: s.color, fontSize: 9, fontWeight: 'bold' }}>
                {s.value > 0 ? '+' : ''}{s.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Styles
const overlayStyle: CSSProperties = {
  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.95)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 12,
};
const panelStyle: CSSProperties = {
  width: '100%', maxWidth: 380, maxHeight: '90%', background: '#000',
  border: '1px solid #1a5a2a', display: 'flex', flexDirection: 'column', overflow: 'hidden',
};
const headerStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', padding: '8px 10px', borderBottom: '1px solid #0a3a0a', gap: 8,
};
const titleStyle: CSSProperties = {
  fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold', flex: 1,
};
const levelStyle: CSSProperties = {
  color: '#33ff66', fontFamily: 'monospace', fontSize: 11, opacity: 0.7,
};
const closeBtnStyle: CSSProperties = {
  padding: '4px 6px', fontSize: 12, fontWeight: 'bold', background: 'transparent',
  color: '#ff3333', border: '1px solid #4a0a0a', fontFamily: 'monospace', cursor: 'pointer',
};
const contentStyle: CSSProperties = {
  flex: 1, overflowY: 'auto', padding: '8px 10px',
};
const descStyle: CSSProperties = {
  color: '#8a8aaa', fontFamily: 'monospace', fontSize: 10, marginBottom: 10,
  fontStyle: 'italic',
};
const sectionTitleStyle: CSSProperties = {
  color: '#1a8a3a', fontFamily: 'monospace', fontSize: 10, fontWeight: 'bold',
  borderBottom: '1px solid #0a3a0a', paddingBottom: 2, marginTop: 10, marginBottom: 6,
  letterSpacing: 2,
};
const statsGridStyle: CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 0, fontFamily: 'monospace',
};
const perLevelStyle: CSSProperties = {
  display: 'flex', gap: 12, fontFamily: 'monospace', fontSize: 10,
};
const abilityUnlockedStyle: CSSProperties = {
  padding: '6px 8px', marginBottom: 4, background: '#040a04',
  border: '1px solid #1a5a2a', fontFamily: 'monospace', fontSize: 11,
};
const abilityLockedStyle: CSSProperties = {
  padding: '6px 8px', marginBottom: 4, background: '#050505',
  border: '1px solid #111', fontFamily: 'monospace', fontSize: 11,
};
const chosenAbilityStyle: CSSProperties = {
  padding: '6px 8px', marginBottom: 4, background: '#0a0800',
  border: '1px solid #3a3a1a', fontFamily: 'monospace', fontSize: 11,
};
const equipRowStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 4, padding: '3px 0',
  fontFamily: 'monospace', borderBottom: '1px solid #0a0a0a',
};
const breakdownContainerStyle: CSSProperties = {
  marginLeft: 12, padding: '4px 8px', borderLeft: '2px solid #1a3a1a',
  background: '#050805', marginBottom: 4,
};
const breakdownRowStyle: CSSProperties = {
  display: 'flex', justifyContent: 'space-between', padding: '1px 0',
  fontFamily: 'monospace',
};
const echoBonusChipStyle: CSSProperties = {
  padding: '3px 6px', background: '#080810', border: '1px solid #1a2a3a',
  fontFamily: 'monospace',
};
const skillsGridStyle: CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontFamily: 'monospace',
};
const skillRowStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px',
  background: '#080808', border: '1px solid #2a2a1a',
};
const legacyGearBoxStyle: CSSProperties = {
  padding: '6px 8px', marginBottom: 4, background: '#08040e',
  border: '1px solid #3a1a5a', fontFamily: 'monospace',
};
const legacyAbilityRowStyle: CSSProperties = {
  padding: '2px 0', marginBottom: 2,
};
const heroSectionStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'flex-start',
  marginBottom: 6,
};
const charInfoPortraitContainerStyle: CSSProperties = {
  flexShrink: 0,
  position: 'relative',
};
const charInfoPortraitStyle: CSSProperties = {
  width: 96,
  height: 96,
  borderRadius: 6,
  border: '2px solid #ff6644',
  boxShadow: '0 0 12px #ff664433, inset 0 0 6px #00000088',
  objectFit: 'cover',
  imageRendering: 'pixelated',
  display: 'block',
};
