import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { BloodlineData, TraitEffect } from './types';
import { TRAIT_DEFS, getTraitProgress, computeBloodlineBonuses } from './traits';
import { useFeatureTutorial, BLOODLINE_TUTORIAL } from './FeatureTutorial';
import { BloodlineGuide } from './BloodlineGuide';
import { useCdnImage } from './useCdnImage';

interface BloodlineViewProps {
  bloodline: BloodlineData;
  onClose: () => void;
}

type Tab = 'traits' | 'ancestors';

function describeEffect(effect: TraitEffect): string {
  switch (effect.type) {
    case 'statBonus': {
      const labels: Record<string, string> = { maxHp: 'HP', hp: 'HP', attack: 'Atk', defense: 'Def', speed: 'Spd' };
      return `+${effect.value} ${labels[effect.stat] ?? effect.stat}`;
    }
    case 'startingItem': return `Start with ${effect.itemName}`;
    case 'startingGold': return `+${effect.amount} starting gold`;
    case 'hungerBonus': return `+${effect.value} max hunger`;
    case 'xpMultiplier': return `+${Math.round((effect.value - 1) * 100)}% XP`;
    case 'multi': return effect.effects.map(describeEffect).join(', ');
  }
}

export function BloodlineView({ bloodline, onClose }: BloodlineViewProps) {
  const [tab, setTab] = useState<Tab>('traits');
  const [showTutorial, dismissTutorial] = useFeatureTutorial('tutorial_bloodline_v3');

  const bonuses = computeBloodlineBonuses(bloodline);
  const hasBonuses = Object.values(bonuses.statBonuses).some((v) => v && v > 0) ||
    bonuses.startingGold > 0 || bonuses.hungerBonus > 0 || bonuses.startingItems.length > 0 ||
    bonuses.xpMultiplier > 1;

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <div style={headerStyle}>
          <span style={titleStyle}>~ BLOODLINE ~</span>
          <span style={genStyle}>Gen {bloodline.generation}</span>
          <button style={closeBtnStyle} onClick={onClose}>[X]</button>
        </div>

        {hasBonuses && (
          <div style={bonusSummaryStyle}>
            Active:
            {bonuses.statBonuses.maxHp ? ` +${bonuses.statBonuses.maxHp} HP` : ''}
            {bonuses.statBonuses.attack ? ` +${bonuses.statBonuses.attack} Atk` : ''}
            {bonuses.statBonuses.defense ? ` +${bonuses.statBonuses.defense} Def` : ''}
            {bonuses.statBonuses.speed ? ` +${bonuses.statBonuses.speed} Spd` : ''}
            {bonuses.hungerBonus ? ` +${bonuses.hungerBonus} Hunger` : ''}
            {bonuses.startingGold ? ` +${bonuses.startingGold}g` : ''}
            {bonuses.xpMultiplier > 1 ? ` +${Math.round((bonuses.xpMultiplier - 1) * 100)}% XP` : ''}
          </div>
        )}

        <div style={tabBarStyle}>
          <button
            style={tab === 'traits' ? tabActiveStyle : tabStyle}
            onClick={() => setTab('traits')}
          >
            Traits ({bloodline.unlockedTraits.length}/{TRAIT_DEFS.length})
          </button>
          <button
            style={tab === 'ancestors' ? tabActiveStyle : tabStyle}
            onClick={() => setTab('ancestors')}
          >
            Ancestors ({bloodline.ancestors.length})
          </button>
        </div>

        <div style={contentStyle}>
          {tab === 'traits' && <TraitList bloodline={bloodline} />}
          {tab === 'ancestors' && <AncestorList bloodline={bloodline} />}
        </div>
      </div>
      {showTutorial && (
        <BloodlineGuide
          storageKey="tutorial_bloodline_v3"
          pages={BLOODLINE_TUTORIAL}
          onDone={dismissTutorial}
        />
      )}
    </div>
  );
}

function AncestorList({ bloodline }: { bloodline: BloodlineData }) {
  const ancestorPortraits: Record<string, string | null> = {
    warrior: useCdnImage('warrior-portrait.jpg'),
    mage: useCdnImage('mage-portrait.jpg'),
    paladin: useCdnImage('paladin-portrait.jpg'),
    rogue: useCdnImage('rogue-portrait.jpg'),
    ranger: useCdnImage('ranger-portrait.jpg'),
    hellborn: useCdnImage('hellborn-portrait.jpg'),
  };
  const classBorders: Record<string, string> = {
    warrior: '#ff6644', mage: '#8855ff', paladin: '#ffd700',
    rogue: '#ffcc33', ranger: '#33cc66', hellborn: '#ff2200',
  };
  if (bloodline.ancestors.length === 0) {
    return (
      <div style={emptyStyle}>
        No ancestors yet. Your first death will begin the bloodline.
      </div>
    );
  }

  return (
    <>
      {[...bloodline.ancestors].reverse().map((a, i) => (
        <div key={i} style={{ ...ancestorRowStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
          {ancestorPortraits[a.class] && (
            <img src={ancestorPortraits[a.class]!} alt="" style={{ width: 36, height: 36, borderRadius: 4, border: `2px solid ${classBorders[a.class] ?? '#33ff66'}66`, boxShadow: `0 0 6px ${classBorders[a.class] ?? '#33ff66'}22`, objectFit: 'cover', imageRendering: 'pixelated' as const, flexShrink: 0 }} />
          )}
          <div style={{ flex: 1 }}>
            <div style={ancestorNameStyle}>
              <span style={{ color: '#c49eff' }}>#{bloodline.generation - i}</span>{' '}
              {a.name}
            </div>
            <div style={ancestorDetailStyle}>
              {a.class.charAt(0).toUpperCase() + a.class.slice(1)} | Floor {a.floorReached} | Lv{a.level}
            </div>
            <div style={ancestorDeathStyle}>
              {a.causeOfDeath} | {a.killCount} kills | {a.score} gold
            </div>
          </div>
        </div>
      ))}

      <div style={statsStyle}>
        <div style={statLineStyle}>Total Deaths: {bloodline.cumulative.totalDeaths}</div>
        <div style={statLineStyle}>Total Kills: {bloodline.cumulative.totalKills}</div>
        <div style={statLineStyle}>Total Damage Dealt: {bloodline.cumulative.totalDamageDealt}</div>
        <div style={statLineStyle}>Total Damage Taken: {bloodline.cumulative.totalDamageTaken}</div>
        <div style={statLineStyle}>Total Floors Cleared: {bloodline.cumulative.totalFloors}</div>
        <div style={statLineStyle}>Total Items Found: {bloodline.cumulative.totalItemsFound}</div>
        <div style={statLineStyle}>Total Food Eaten: {bloodline.cumulative.totalFoodEaten}</div>
        <div style={statLineStyle}>Best Floor: {bloodline.cumulative.highestFloor}</div>
        <div style={statLineStyle}>Best Score: {bloodline.cumulative.highestScore}</div>
      </div>
    </>
  );
}

function TraitList({ bloodline }: { bloodline: BloodlineData }) {
  const categories = ['death', 'combat', 'exploration', 'class', 'npc', 'legacy'] as const;
  const categoryLabels: Record<string, string> = {
    death: 'Death',
    combat: 'Combat',
    exploration: 'Exploration',
    class: 'Class Legacy',
    npc: 'NPC Encounters',
    legacy: 'Dynasty',
  };

  return (
    <>
      {categories.map((cat) => {
        const traits = TRAIT_DEFS.filter((t) => t.category === cat);
        if (traits.length === 0) return null;
        return (
          <div key={cat}>
            <div style={catHeaderStyle}>{categoryLabels[cat]}</div>
            {traits.map((trait) => {
              const unlocked = bloodline.unlockedTraits.includes(trait.id);
              const progress = getTraitProgress(trait, bloodline);
              const effectText = describeEffect(trait.effect);
              return (
                <div key={trait.id} style={unlocked ? traitRowUnlockedStyle : traitRowStyle}>
                  <span style={{
                    color: unlocked ? trait.color : '#7a7a8a',
                    fontWeight: 'bold',
                    fontSize: unlocked ? 16 : 10,
                    minWidth: 22,
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    textShadow: unlocked ? `0 0 6px ${trait.color}44` : 'none',
                  }}>
                    {unlocked ? trait.icon : '[x]'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      <span style={{
                        color: unlocked ? '#33ff66' : '#aaaacc',
                        fontSize: 11,
                        fontWeight: 'bold',
                      }}>
                        {trait.name}
                      </span>
                      {unlocked && (
                        <span style={{ color: '#33ff66', fontSize: 8, fontFamily: 'monospace' }}>
                          UNLOCKED
                        </span>
                      )}
                    </div>
                    <div style={{
                      color: unlocked ? '#1a8a3a' : '#8888aa',
                      fontSize: 9,
                      marginTop: 1,
                    }}>
                      {trait.description}
                    </div>
                    <div style={{
                      color: unlocked ? '#c49eff' : '#6a6a8a',
                      fontSize: 9,
                      marginTop: 2,
                      fontWeight: 'bold',
                    }}>
                      Effect: {effectText}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 40 }}>
                    {progress && (
                      <div style={{
                        color: unlocked ? '#33ff66' : '#8a7aaa',
                        fontSize: 10,
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                      }}>
                        {Math.min(progress.current, progress.target)}/{progress.target}
                      </div>
                    )}
                    {!progress && unlocked && (
                      <span style={{ color: '#33ff66', fontSize: 10, fontFamily: 'monospace' }}>
                        [OK]
                      </span>
                    )}
                    {!progress && !unlocked && (
                      <span style={{ color: '#8a7aaa', fontSize: 10, fontFamily: 'monospace' }}>
                        ???
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.95)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 50,
  padding: 12,
};

const panelStyle: CSSProperties = {
  width: '100%',
  maxWidth: 380,
  maxHeight: '90%',
  background: '#000',
  border: '1px solid #4a3a6a',
  borderRadius: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '8px 10px',
  borderBottom: '1px solid #2a1a4a',
  gap: 8,
};

const titleStyle: CSSProperties = {
  color: '#c49eff',
  fontFamily: 'monospace',
  fontSize: 14,
  fontWeight: 'bold',
  flex: 1,
  textShadow: '0 0 8px #c49eff33',
};

const genStyle: CSSProperties = {
  color: '#c49eff',
  fontFamily: 'monospace',
  fontSize: 11,
  opacity: 0.7,
};

const closeBtnStyle: CSSProperties = {
  padding: '4px 6px',
  fontSize: 12,
  fontWeight: 'bold',
  background: 'transparent',
  color: '#ff3333',
  border: '1px solid #4a0a0a',
  borderRadius: 0,
  fontFamily: 'monospace',
  cursor: 'pointer',
};

const bonusSummaryStyle: CSSProperties = {
  padding: '6px 10px',
  fontFamily: 'monospace',
  fontSize: 10,
  color: '#c49eff',
  borderBottom: '1px solid #2a1a4a',
  background: '#0a0814',
};

const tabBarStyle: CSSProperties = {
  display: 'flex',
  borderBottom: '1px solid #2a1a4a',
};

const tabStyle: CSSProperties = {
  flex: 1,
  padding: '6px 0',
  fontSize: 11,
  fontFamily: 'monospace',
  background: 'transparent',
  color: '#4a3a6a',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'center',
};

const tabActiveStyle: CSSProperties = {
  ...tabStyle,
  color: '#c49eff',
  borderBottom: '2px solid #c49eff',
};

const contentStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: 8,
};

const emptyStyle: CSSProperties = {
  color: '#3a2a5a',
  textAlign: 'center',
  padding: 20,
  fontFamily: 'monospace',
  fontSize: 11,
};

const ancestorRowStyle: CSSProperties = {
  padding: '8px 6px',
  borderBottom: '1px solid #1a0a2a',
  fontFamily: 'monospace',
};

const ancestorNameStyle: CSSProperties = {
  color: '#c49eff',
  fontSize: 12,
  fontWeight: 'bold',
};

const ancestorDetailStyle: CSSProperties = {
  color: '#8a7aaa',
  fontSize: 10,
  marginTop: 2,
};

const ancestorDeathStyle: CSSProperties = {
  color: '#5a4a6a',
  fontSize: 9,
  marginTop: 2,
};

const statsStyle: CSSProperties = {
  padding: '10px 6px',
  borderTop: '1px solid #2a1a4a',
  marginTop: 8,
};

const statLineStyle: CSSProperties = {
  color: '#6a5a8a',
  fontFamily: 'monospace',
  fontSize: 10,
  lineHeight: '16px',
};

const catHeaderStyle: CSSProperties = {
  color: '#8a7aaa',
  fontFamily: 'monospace',
  fontSize: 10,
  fontWeight: 'bold',
  padding: '10px 4px 4px',
  borderBottom: '1px solid #2a1a3a',
  letterSpacing: 2,
  textTransform: 'uppercase',
};

const traitRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 4px',
  borderBottom: '1px solid #0a0a1a',
  fontFamily: 'monospace',
};

const traitRowUnlockedStyle: CSSProperties = {
  ...traitRowStyle,
  background: '#060a14',
  borderBottom: '1px solid #1a1a3a',
};

