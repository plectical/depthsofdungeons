import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { BloodlineData, PlayerClass } from './types';
import {
  ensureLegacyData, getGearForClass, getGearDef, getNextLevelDef,
  getUpgradeCost, tryUpgradeGear, getCumulativeStats, getUnlockedAbilities,
  LEGACY_GEAR_DEFS, LEGACY_ABILITY_DESCRIPTIONS, getGearDisplayName, getGearDisplayColor,
} from './legacyGear';
import type { LegacyGearDef, LegacyGearData } from './types';

interface Props {
  bloodline: BloodlineData;
  onSave: (bl: BloodlineData) => void;
  onClose: () => void;
}

const containerStyle: CSSProperties = {
  position: 'absolute', inset: 0,
  background: '#0a0a12',
  display: 'flex', flexDirection: 'column',
  fontFamily: 'monospace', color: '#e0e0e0',
  overflow: 'hidden',
};

const headerStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '10px 14px', borderBottom: '1px solid #333',
  background: '#111118',
};

const listStyle: CSSProperties = {
  flex: 1, overflow: 'auto', padding: '8px 10px',
  display: 'flex', flexDirection: 'column', gap: 8,
};

const cardStyle: CSSProperties = {
  background: '#14141e', border: '1px solid #333', borderRadius: 8,
  padding: '10px 12px', cursor: 'pointer',
};

const cardSelectedStyle: CSSProperties = {
  ...cardStyle, border: '1px solid #c49eff', background: '#1a1a2e',
};

const detailStyle: CSSProperties = {
  background: '#111118', border: '1px solid #444', borderRadius: 8,
  padding: '12px 14px', margin: '0 10px 10px',
};

const btnStyle: CSSProperties = {
  background: '#2a1a4a', color: '#c49eff', border: '1px solid #c49eff',
  borderRadius: 6, padding: '8px 16px', fontFamily: 'monospace', fontSize: 13,
  cursor: 'pointer', fontWeight: 'bold',
};

const btnDisabledStyle: CSSProperties = {
  ...btnStyle, background: '#1a1a1a', color: '#555', border: '1px solid #333', cursor: 'default',
};

export function LegacyGearView({ bloodline, onSave, onClose }: Props) {
  const [selectedClass, setSelectedClass] = useState<PlayerClass | null>(null);
  const [showTutorial, setShowTutorial] = useState(() => {
    try { return !localStorage.getItem('dod_legacy_gear_tutorial_seen'); } catch { return true; }
  });

  const legacyData = ensureLegacyData(bloodline);

  const handleUpgrade = (classId: PlayerClass) => {
    const bl = structuredClone(bloodline);
    const ld = ensureLegacyData(bl);
    const success = tryUpgradeGear(ld, classId);
    if (success) {
      onSave(bl);
    }
  };

  const selectedDef = selectedClass ? getGearDef(selectedClass) : null;
  const selectedGear = selectedClass ? getGearForClass(legacyData, selectedClass) : null;

  return (
    <div style={containerStyle}>
      {showTutorial && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(0,0,0,0.92)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            maxWidth: 320, background: '#0e0e1a', border: '1px solid #c49eff66',
            boxShadow: '0 0 30px #c49eff22', padding: '24px 20px', fontFamily: 'monospace',
            textAlign: 'center',
          }}>
            <div style={{ color: '#c49eff', fontSize: 18, fontWeight: 'bold', letterSpacing: 2, marginBottom: 12 }}>
              {'\u{2726}'} LEGACY GEAR {'\u{2726}'}
            </div>
            <div style={{ color: '#aaa', fontSize: 12, lineHeight: '1.6', marginBottom: 16 }}>
              Every class has a unique <b style={{ color: '#c49eff' }}>Legacy weapon</b> that grows stronger the more you invest.
            </div>
            <div style={{ color: '#888', fontSize: 11, lineHeight: '1.5', marginBottom: 16, textAlign: 'left' }}>
              <div style={{ marginBottom: 6 }}><span style={{ color: '#c49eff' }}>{'\u{2726}'}</span> <b style={{ color: '#ccc' }}>Earn shards</b> by reaching deeper floors</div>
              <div style={{ marginBottom: 6 }}><span style={{ color: '#c49eff' }}>{'\u{2726}'}</span> <b style={{ color: '#ccc' }}>Spend shards</b> to level up your gear</div>
              <div style={{ marginBottom: 6 }}><span style={{ color: '#c49eff' }}>{'\u{2726}'}</span> <b style={{ color: '#ccc' }}>Gear auto-equips</b> at the start of every run</div>
              <div><span style={{ color: '#c49eff' }}>{'\u{2726}'}</span> <b style={{ color: '#ccc' }}>Unlock abilities</b> at milestone levels</div>
            </div>
            <div style={{ color: '#666', fontSize: 10, marginBottom: 16, fontStyle: 'italic' }}>
              Your Legacy Gear can never be lost or sold. It is yours forever.
            </div>
            <button
              style={{
                background: '#2a1a4a', color: '#c49eff', border: '1px solid #c49eff',
                borderRadius: 4, padding: '10px 24px', fontFamily: 'monospace', fontSize: 13,
                fontWeight: 'bold', cursor: 'pointer', letterSpacing: 1,
              }}
              onClick={() => {
                setShowTutorial(false);
                try { localStorage.setItem('dod_legacy_gear_tutorial_seen', '1'); } catch { /* ok */ }
              }}
            >
              {'[ Got it ]'}
            </button>
          </div>
        </div>
      )}
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 'bold', color: '#c49eff' }}>Legacy Gear</span>
          <span style={{ fontSize: 11, color: '#8888aa' }}>
            Shards: <span style={{ color: '#c49eff', fontWeight: 'bold' }}>{legacyData.essenceShards}</span>
          </span>
        </div>
        <button
          style={{ background: 'none', border: '1px solid #555', borderRadius: 4, color: '#aaa', padding: '4px 10px', fontFamily: 'monospace', cursor: 'pointer' }}
          onClick={onClose}
        >
          Back
        </button>
      </div>

      {/* Gear list */}
      <div style={listStyle}>
        {LEGACY_GEAR_DEFS.map(def => {
          const gear = getGearForClass(legacyData, def.classId);
          const isSelected = selectedClass === def.classId;
          const stats = getCumulativeStats(gear);
          const displayName = getGearDisplayName(gear);
          const displayColor = getGearDisplayColor(gear);

          return (
            <div key={def.classId}>
              <div
                style={isSelected ? cardSelectedStyle : cardStyle}
                onClick={() => setSelectedClass(isSelected ? null : def.classId)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{def.icon}</span>
                    <div>
                      <div style={{ color: displayColor, fontWeight: 'bold', fontSize: 13 }}>
                        {displayName}
                      </div>
                      <div style={{ color: '#888', fontSize: 10 }}>
                        {def.classId.charAt(0).toUpperCase() + def.classId.slice(1)}'s Legacy {def.gearType}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {gear.earned ? (
                      <div style={{ color: gear.level >= 20 ? '#ff2a6d' : '#c49eff', fontSize: 12, fontWeight: 'bold' }}>
                        Lv {gear.level}{gear.level >= 20 ? ' MAX' : ''}/20
                      </div>
                    ) : (
                      <div style={{ color: '#555', fontSize: 11 }}>Not earned</div>
                    )}
                  </div>
                </div>

                {/* Quick stat summary */}
                {gear.earned && gear.level > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 10 }}>
                    {stats.attack ? <span style={{ color: '#ff6644' }}>+{stats.attack} ATK</span> : null}
                    {stats.defense ? <span style={{ color: '#4488ff' }}>+{stats.defense} DEF</span> : null}
                    {stats.maxHp ? <span style={{ color: '#44dd77' }}>+{stats.maxHp} HP</span> : null}
                    {stats.speed ? <span style={{ color: '#88eeff' }}>+{stats.speed} SPD</span> : null}
                  </div>
                )}
              </div>

              {/* Expanded detail panel */}
              {isSelected && selectedDef && selectedGear && (
                <GearDetail
                  def={selectedDef}
                  gear={selectedGear}
                  shards={legacyData.essenceShards}
                  onUpgrade={() => handleUpgrade(def.classId)}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer info */}
      <div style={{ padding: '8px 14px', borderTop: '1px solid #333', fontSize: 10, color: '#666', textAlign: 'center' }}>
        Earn Essence Shards by defeating enemies. Shards are shared across all classes.
      </div>
    </div>
  );
}

function GearDetail({ gear, shards, onUpgrade }: { def: LegacyGearDef; gear: LegacyGearData; shards: number; onUpgrade: () => void }) {
  const nextLevel = getNextLevelDef(gear);
  const cost = getUpgradeCost(gear);
  const canAfford = shards >= cost && cost > 0;
  const abilities = getUnlockedAbilities(gear);
  const stats = getCumulativeStats(gear);

  return (
    <div style={detailStyle}>
      {!gear.earned ? (
        <div style={{ color: '#888', fontSize: 12, textAlign: 'center', padding: 10 }}>
          Play as this class and earn Essence Shards to unlock their Legacy Gear.
        </div>
      ) : (
        <>
          {/* Current stats */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>Current Bonuses (Lv {gear.level}):</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12 }}>
              {stats.attack ? <span style={{ color: '#ff6644' }}>+{stats.attack} ATK</span> : null}
              {stats.defense ? <span style={{ color: '#4488ff' }}>+{stats.defense} DEF</span> : null}
              {stats.maxHp ? <span style={{ color: '#44dd77' }}>+{stats.maxHp} HP</span> : null}
              {stats.speed ? <span style={{ color: '#88eeff' }}>+{stats.speed} SPD</span> : null}
              {Object.keys(stats).length === 0 && <span style={{ color: '#555' }}>None yet</span>}
            </div>
          </div>

          {/* Unlocked abilities */}
          {abilities.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>Abilities:</div>
              {abilities.map(aId => {
                const aDef = LEGACY_ABILITY_DESCRIPTIONS[aId];
                return aDef ? (
                  <div key={aId} style={{ fontSize: 11, color: '#c49eff', marginBottom: 2 }}>
                    {aDef.name}: <span style={{ color: '#aaa' }}>{aDef.description}</span>
                  </div>
                ) : null;
              })}
            </div>
          )}

          {/* Level progression bar */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#888', marginBottom: 2 }}>
              <span>Level Progress</span>
              <span>{gear.level}/20</span>
            </div>
            <div style={{ height: 6, background: '#222', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3,
                width: `${(gear.level / 20) * 100}%`,
                background: gear.level >= 20 ? 'linear-gradient(90deg, #ff2a6d, #ff9d17)' : 'linear-gradient(90deg, #8855ff, #c49eff)',
              }} />
            </div>
          </div>

          {/* Next level preview */}
          {nextLevel && (
            <div style={{ background: '#0f0f18', borderRadius: 6, padding: '8px 10px', marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>
                Next Level ({gear.level + 1}):
              </div>
              <div style={{ fontSize: 11, color: nextLevel.color }}>
                {nextLevel.name}
              </div>
              <div style={{ display: 'flex', gap: 8, fontSize: 10, marginTop: 2 }}>
                {nextLevel.statBonus.attack ? <span style={{ color: '#ff6644' }}>+{nextLevel.statBonus.attack} ATK</span> : null}
                {nextLevel.statBonus.defense ? <span style={{ color: '#4488ff' }}>+{nextLevel.statBonus.defense} DEF</span> : null}
                {nextLevel.statBonus.maxHp ? <span style={{ color: '#44dd77' }}>+{nextLevel.statBonus.maxHp} HP</span> : null}
                {nextLevel.statBonus.speed ? <span style={{ color: '#88eeff' }}>+{nextLevel.statBonus.speed} SPD</span> : null}
              </div>
              {nextLevel.abilityUnlock && LEGACY_ABILITY_DESCRIPTIONS[nextLevel.abilityUnlock] && (
                <div style={{ fontSize: 10, color: '#ffcc33', marginTop: 4 }}>
                  Unlocks: {LEGACY_ABILITY_DESCRIPTIONS[nextLevel.abilityUnlock]!.name}
                </div>
              )}
            </div>
          )}

          {/* Upgrade button */}
          {gear.level < 20 ? (
            <button
              style={canAfford ? btnStyle : btnDisabledStyle}
              onClick={canAfford ? onUpgrade : undefined}
            >
              Upgrade ({cost} Shards)
            </button>
          ) : (
            <div style={{ textAlign: 'center', color: '#ff2a6d', fontSize: 13, fontWeight: 'bold' }}>
              MAXED OUT
            </div>
          )}
        </>
      )}
    </div>
  );
}
