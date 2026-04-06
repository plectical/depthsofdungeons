import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useFeatureTutorial, NECROPOLIS_TUTORIAL } from './FeatureTutorial';
import { NecropolisGuide } from './NecropolisGuide';
import {
  NECROPOLIS_UNLOCKS,
  CATEGORY_INFO,
  getNextUnlocks,
  BESTIARY_BOUNTIES,
  BOUNTY_TIER_COLORS,
  isBountyComplete,
  getBountyProgress,
  type UnlockCategory,
  type NecropolisState,
} from './necropolis';
import { connectToNecropolis, onNecropolisStateChange, getNecropolisState } from './necropolisService';

interface Props {
  onClose: () => void;
}

const ALL_CATEGORIES: UnlockCategory[] = ['weapon', 'armor', 'item', 'enemy', 'class', 'dungeon', 'zone'];

export function NecropolisView({ onClose }: Props) {
  const [necropolisState, setNecropolisState] = useState<NecropolisState>(getNecropolisState());
  const [activeCategory, setActiveCategory] = useState<UnlockCategory | 'all'>('all');
  const [connecting, setConnecting] = useState(true);
  const [mainTab, setMainTab] = useState<'unlocks' | 'bestiary'>('unlocks');
  const [showTutorial, dismissTutorial] = useFeatureTutorial('tutorial_necropolis_v2');

  useEffect(() => {
    let mounted = true;

    connectToNecropolis().then((state) => {
      if (mounted) {
        setNecropolisState(state);
        setConnecting(false);
      }
    }).catch(() => {
      if (mounted) setConnecting(false);
    });

    const unsub = onNecropolisStateChange((state) => {
      if (mounted) setNecropolisState(state);
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const communalDeaths = necropolisState.communalDeaths;
  const totalUnlocks = NECROPOLIS_UNLOCKS.length;
  const unlockedCount = NECROPOLIS_UNLOCKS.filter((u) => communalDeaths >= u.deathsRequired).length;

  const filteredUnlocks = activeCategory === 'all'
    ? [...NECROPOLIS_UNLOCKS].sort((a, b) => a.deathsRequired - b.deathsRequired)
    : NECROPOLIS_UNLOCKS
        .filter((u) => u.category === activeCategory)
        .sort((a, b) => a.deathsRequired - b.deathsRequired);

  const nextUnlocks = getNextUnlocks(communalDeaths, 2);

  return (
    <div style={overlayStyle}>
      <div style={containerStyle}>
        {/* Header with close button */}
        <div style={headerStyle}>
          <button style={closeBtnStyle} onClick={onClose}>X</button>
        </div>

        {/* ASCII Necropolis Art */}
        <pre style={asciiArtStyle}>{`\
           .                .        .
     .  ___|___        ___|___  .
        | ___ |   .    | ___ |      .
   .    ||   ||  _|_   ||   ||
        ||___|| |   |  ||___||   .
   _    |_____|_|   |__|_____|  _
  |=|   |  ___  |   |  ___  | |=|
  |=|   | |   | |   | |   | | |=|
  |=|  _| |   | |___| |   | |_|=|
 _|=|_| | |___| |   | |___| | |=|_
| _____ | |   | |   | |   | | ____|
||     || |   | |   | |   | ||    |
||  +  ||_|   |_| + |_|   |_||  + |
||  |  |___________^_________|  |  |
||__|__|_______/  |  \\_________|__|_|
|____________/ ~  |  ~ \\____________|
  ~   ~      ~ ~~ | ~~  ~    ~   ~
 ~ ~ ~  ~  ~  ~ ~ | ~  ~ ~ ~  ~ ~
~  ~  ~ ~ ~ ~~ ~~ | ~ ~~ ~  ~ ~ ~~
~~~~~~~~~~~~/ THE  |NECROPOLIS \\~~~~`}</pre>

        {/* Death Counter */}
        <div style={deathCounterStyle}>
          <div style={deathNumberStyle}>{communalDeaths}</div>
          <div style={deathLabelStyle}>
            {connecting ? 'Connecting...' : 'Total Deaths by All Players'}
          </div>
          <div style={progressTextStyle}>
            {unlockedCount}/{totalUnlocks} Unlocked
          </div>
          {/* Progress bar */}
          <div style={progressBarBgStyle}>
            <div
              style={{
                ...progressBarFillStyle,
                width: `${(unlockedCount / totalUnlocks) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Next unlocks teaser */}
        {nextUnlocks.length > 0 && (
          <div style={nextUnlockBoxStyle}>
            <div style={nextUnlockTitleStyle}>NEXT UNLOCKS:</div>
            {nextUnlocks.map((u) => (
              <div key={u.id} style={nextUnlockItemStyle}>
                <span style={{ color: u.color }}>{u.icon}</span>{' '}
                <span style={{ color: '#888' }}>{u.name}</span>{' '}
                <span style={{ color: '#ff6644', fontSize: 10 }}>
                  ({u.deathsRequired - communalDeaths} more deaths)
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Main tab switch: Unlocks vs Bestiary */}
        <div style={{ display: 'flex', gap: 0, padding: '8px 12px 0', justifyContent: 'center' }}>
          <button
            style={mainTab === 'unlocks' ? mainTabActiveStyle : mainTabStyle}
            onClick={() => setMainTab('unlocks')}
          >
            UNLOCKS
          </button>
          <button
            style={mainTab === 'bestiary' ? { ...mainTabActiveStyle, color: '#ff6644', borderColor: '#ff6644' } : mainTabStyle}
            onClick={() => setMainTab('bestiary')}
          >
            BESTIARY
          </button>
        </div>

        {mainTab === 'unlocks' && (
          <>
            {/* Category tabs */}
            <div style={tabRowStyle}>
              <button
                style={activeCategory === 'all' ? tabActiveStyle : tabStyle}
                onClick={() => setActiveCategory('all')}
              >
                All
              </button>
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  style={activeCategory === cat
                    ? { ...tabActiveStyle, color: CATEGORY_INFO[cat].color, borderColor: CATEGORY_INFO[cat].color }
                    : tabStyle}
                  onClick={() => setActiveCategory(cat)}
                >
                  {CATEGORY_INFO[cat].label}
                </button>
              ))}
            </div>

            {/* Unlock list */}
            <div style={unlockListStyle}>
              {filteredUnlocks.map((unlock) => {
                const unlocked = communalDeaths >= unlock.deathsRequired;
                const progress = Math.min(1, communalDeaths / unlock.deathsRequired);
                const catInfo = CATEGORY_INFO[unlock.category];

                return (
                  <div key={unlock.id} style={unlocked ? unlockCardStyle : unlockCardLockedStyle}>
                    <div style={unlockHeaderRowStyle}>
                      <span style={{
                        color: unlocked ? unlock.color : '#444',
                        fontSize: 16,
                        fontWeight: 'bold',
                      }}>
                        {unlock.icon}
                      </span>
                      <div style={{ flex: 1, marginLeft: 8 }}>
                        <div style={{
                          color: unlocked ? unlock.color : '#666',
                          fontSize: 12,
                          fontWeight: 'bold',
                          fontFamily: 'monospace',
                        }}>
                          {unlocked ? unlock.name : '???'}
                        </div>
                        <div style={{
                          color: unlocked ? catInfo.color : '#444',
                          fontSize: 9,
                          fontFamily: 'monospace',
                          textTransform: 'uppercase',
                        }}>
                          {catInfo.label}
                        </div>
                      </div>
                      <div style={{
                        color: unlocked ? '#33ff66' : '#666',
                        fontSize: 10,
                        fontFamily: 'monospace',
                        textAlign: 'right',
                      }}>
                        {unlocked ? 'UNLOCKED' : `${unlock.deathsRequired} deaths`}
                      </div>
                    </div>

                    <div style={{
                      color: unlocked ? '#8a8a8a' : '#444',
                      fontSize: 10,
                      fontFamily: 'monospace',
                      marginTop: 4,
                    }}>
                      {unlocked ? unlock.description : 'Not yet unlocked...'}
                    </div>

                    {!unlocked && (
                      <div style={miniProgressBgStyle}>
                        <div
                          style={{
                            ...miniProgressFillStyle,
                            width: `${progress * 100}%`,
                            background: unlock.color,
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {mainTab === 'bestiary' && (
          <>
            {/* Bestiary header */}
            <div style={{ padding: '8px 12px 4px', textAlign: 'center' }}>
              <div style={{ color: '#ff6644', fontFamily: 'monospace', fontSize: 11, letterSpacing: 2 }}>
                COMMUNITY KILL BOUNTIES
              </div>
              <div style={{ color: '#666', fontFamily: 'monospace', fontSize: 9, marginTop: 2 }}>
                All players contribute kills. Rewards appear in loot and shops.
              </div>
              <div style={{ color: '#ff6644', fontFamily: 'monospace', fontSize: 18, fontWeight: 'bold', marginTop: 4 }}>
                {formatNumber(Object.values(necropolisState.communalKills).reduce((s, v) => s + v, 0))}
              </div>
              <div style={{ color: '#884433', fontFamily: 'monospace', fontSize: 9 }}>Total Community Kills</div>
            </div>

            {/* Bounty list */}
            <div style={unlockListStyle}>
              {BESTIARY_BOUNTIES.map((bounty) => {
                const kills = necropolisState.communalKills;
                const complete = isBountyComplete(bounty, kills);
                const current = getBountyProgress(bounty, kills);
                const pct = Math.min(1, current / bounty.killsRequired);
                const tierColor = BOUNTY_TIER_COLORS[bounty.tier];

                return (
                  <div key={bounty.id} style={complete ? { ...unlockCardStyle, borderColor: tierColor } : unlockCardLockedStyle}>
                    {/* Tier badge + monster name */}
                    <div style={unlockHeaderRowStyle}>
                      <span style={{
                        color: tierColor,
                        fontSize: 9,
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                        border: `1px solid ${tierColor}`,
                        padding: '1px 4px',
                        textTransform: 'uppercase',
                        opacity: complete ? 1 : 0.6,
                      }}>
                        {bounty.tier}
                      </span>
                      <div style={{ flex: 1, marginLeft: 8 }}>
                        <div style={{
                          color: complete ? '#fff' : '#888',
                          fontSize: 12,
                          fontWeight: 'bold',
                          fontFamily: 'monospace',
                        }}>
                          {bounty.monsterName === '_TOTAL_' ? 'ALL MONSTERS' : `Kill ${bounty.monsterName}s`}
                        </div>
                      </div>
                      <div style={{
                        fontFamily: 'monospace',
                        fontSize: 10,
                        textAlign: 'right',
                        color: complete ? '#33ff66' : tierColor,
                        fontWeight: 'bold',
                      }}>
                        {complete ? 'COMPLETE!' : `${formatNumber(current)} / ${formatNumber(bounty.killsRequired)}`}
                      </div>
                    </div>

                    {/* Flavor text */}
                    <div style={{
                      color: complete ? '#aaa' : '#666',
                      fontSize: 10,
                      fontFamily: 'monospace',
                      fontStyle: 'italic',
                      marginTop: 4,
                    }}>
                      {bounty.flavorText}
                    </div>

                    {/* Reward */}
                    <div style={{
                      color: complete ? tierColor : '#555',
                      fontSize: 10,
                      fontFamily: 'monospace',
                      marginTop: 4,
                    }}>
                      {complete ? `\u{1F381} ${bounty.rewardDescription}` : `\u{1F512} ${bounty.rewardDescription}`}
                    </div>

                    {/* Progress bar */}
                    {!complete && (
                      <div style={miniProgressBgStyle}>
                        <div
                          style={{
                            ...miniProgressFillStyle,
                            width: `${pct * 100}%`,
                            background: tierColor,
                          }}
                        />
                      </div>
                    )}

                    {/* Percentage */}
                    {!complete && (
                      <div style={{ color: '#555', fontFamily: 'monospace', fontSize: 9, textAlign: 'right', marginTop: 2 }}>
                        {(pct * 100).toFixed(2)}%
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      {showTutorial && (
        <NecropolisGuide
          storageKey="tutorial_necropolis_v2"
          pages={NECROPOLIS_TUTORIAL}
          onDone={dismissTutorial}
        />
      )}
    </div>
  );
}

/** Format big numbers: 1000 -> 1K, 1000000 -> 1M */
function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ── Styles ──

const mainTabStyle: CSSProperties = {
  background: 'none',
  border: '1px solid #2a2a2a',
  borderBottom: 'none',
  color: '#666',
  fontFamily: 'monospace',
  fontSize: 11,
  fontWeight: 'bold',
  padding: '6px 16px',
  cursor: 'pointer',
  letterSpacing: 2,
};

const mainTabActiveStyle: CSSProperties = {
  ...mainTabStyle,
  color: '#cc44ff',
  borderColor: '#cc44ff',
  background: '#0a0514',
};

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.92)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  zIndex: 100,
  overflowY: 'auto',
  overflowX: 'hidden',
};

const containerStyle: CSSProperties = {
  width: '100%',
  maxWidth: 400,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const headerStyle: CSSProperties = {
  position: 'relative',
  textAlign: 'right',
  padding: '8px 12px 0',
};

const asciiArtStyle: CSSProperties = {
  color: '#8844cc',
  fontFamily: 'monospace',
  fontSize: 7.5,
  lineHeight: '9px',
  textAlign: 'center',
  padding: '4px 4px 0',
  margin: 0,
  whiteSpace: 'pre',
  overflow: 'hidden',
  textShadow: '0 0 8px #cc44ff33',
  background: 'linear-gradient(180deg, #0a0514 0%, transparent 100%)',
};

const closeBtnStyle: CSSProperties = {
  position: 'absolute',
  top: 12,
  right: 12,
  background: 'none',
  border: '1px solid #4a2a6a',
  color: '#cc44ff',
  fontFamily: 'monospace',
  fontSize: 14,
  fontWeight: 'bold',
  padding: '4px 8px',
  cursor: 'pointer',
};

const deathCounterStyle: CSSProperties = {
  textAlign: 'center',
  padding: '12px 16px 8px',
};

const deathNumberStyle: CSSProperties = {
  color: '#ff4444',
  fontFamily: 'monospace',
  fontSize: 36,
  fontWeight: 'bold',
  textShadow: '0 0 20px #ff444444',
};

const deathLabelStyle: CSSProperties = {
  color: '#8a6666',
  fontFamily: 'monospace',
  fontSize: 10,
  marginTop: 2,
};

const progressTextStyle: CSSProperties = {
  color: '#cc44ff',
  fontFamily: 'monospace',
  fontSize: 11,
  marginTop: 6,
};

const progressBarBgStyle: CSSProperties = {
  width: '80%',
  maxWidth: 250,
  height: 6,
  background: '#1a0a2a',
  borderRadius: 3,
  margin: '6px auto 0',
  overflow: 'hidden',
};

const progressBarFillStyle: CSSProperties = {
  height: '100%',
  background: 'linear-gradient(90deg, #cc44ff, #ff4444)',
  borderRadius: 3,
  transition: 'width 0.5s ease',
};

const nextUnlockBoxStyle: CSSProperties = {
  margin: '0 16px',
  padding: '8px 10px',
  border: '1px solid #2a1a3a',
  background: '#0a0514',
};

const nextUnlockTitleStyle: CSSProperties = {
  color: '#8a6aaa',
  fontFamily: 'monospace',
  fontSize: 9,
  letterSpacing: 2,
  marginBottom: 4,
};

const nextUnlockItemStyle: CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 11,
  marginTop: 2,
};

const tabRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 4,
  padding: '8px 12px 4px',
  justifyContent: 'center',
};

const tabStyle: CSSProperties = {
  background: 'none',
  border: '1px solid #2a2a2a',
  color: '#666',
  fontFamily: 'monospace',
  fontSize: 9,
  padding: '4px 6px',
  cursor: 'pointer',
};

const tabActiveStyle: CSSProperties = {
  ...tabStyle,
  color: '#cc44ff',
  borderColor: '#cc44ff',
  background: '#1a0a2a',
};

const unlockListStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '8px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const unlockCardStyle: CSSProperties = {
  border: '1px solid #3a2a4a',
  padding: '8px 10px',
  background: '#0a0514',
};

const unlockCardLockedStyle: CSSProperties = {
  border: '1px solid #1a1a1a',
  padding: '8px 10px',
  background: '#050505',
  opacity: 0.8,
};

const unlockHeaderRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

const miniProgressBgStyle: CSSProperties = {
  width: '100%',
  height: 3,
  background: '#1a1a1a',
  borderRadius: 2,
  marginTop: 6,
  overflow: 'hidden',
};

const miniProgressFillStyle: CSSProperties = {
  height: '100%',
  borderRadius: 2,
  transition: 'width 0.3s ease',
  opacity: 0.6,
};
