import type { JournalEntry, ZoneId } from './types';
import { UI_COLORS } from './uiFrameStyles';

interface StoryJournalProps {
  entries: JournalEntry[];
  onClose: () => void;
}

const ZONE_NAMES: Record<ZoneId, string> = {
  stone_depths: 'Stone Depths',
  frozen_caverns: 'Frozen Caverns',
  fungal_marsh: 'Fungal Marsh',
  infernal_pit: 'Infernal Pit',
  crystal_sanctum: 'Crystal Sanctum',
  shadow_realm: 'Shadow Realm',
  hell: 'Hell',
  narrative_test: 'Narrative Depths',
};

const OUTCOME_COLORS: Record<string, string> = {
  peaceful: '#88ff88',
  befriended: '#44ff88',
  combat: '#ff8844',
  killed: '#ff4444',
  fled: '#ffcc44',
};

const OUTCOME_LABELS: Record<string, string> = {
  peaceful: 'Peaceful',
  befriended: 'Befriended',
  combat: 'Combat',
  killed: 'Defeated',
  fled: 'Fled',
};

export function StoryJournal({ entries, onClose }: StoryJournalProps) {
  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      zIndex: 9000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: 20,
      overflowY: 'auto',
    }}>
      <div style={{
        maxWidth: 600,
        width: '100%',
        background: UI_COLORS.bgDark,
        border: `2px solid ${UI_COLORS.primaryDark}`,
        borderRadius: 8,
        padding: 20,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          borderBottom: `1px solid ${UI_COLORS.primaryDark}`,
          paddingBottom: 10,
        }}>
          <h2 style={{ color: UI_COLORS.textBright, margin: 0, fontFamily: 'monospace' }}>
            Story Journal
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: `1px solid ${UI_COLORS.primaryDark}`,
              color: UI_COLORS.textBright,
              padding: '5px 15px',
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
          >
            Close
          </button>
        </div>
        
        {sortedEntries.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: UI_COLORS.textMuted,
            padding: 40,
            fontFamily: 'monospace',
          }}>
            No encounters recorded yet.<br/>
            Meet creatures in the dungeon to fill your journal.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            {sortedEntries.map(entry => (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  gap: 15,
                  padding: 15,
                  background: UI_COLORS.bgPanel,
                  border: `1px solid ${UI_COLORS.primaryDark}`,
                  borderRadius: 6,
                }}
              >
                {entry.portraitUrl && (
                  <img
                    src={entry.portraitUrl}
                    alt={entry.name}
                    style={{
                      width: 80,
                      height: 80,
                      objectFit: 'cover',
                      borderRadius: 4,
                      border: `1px solid ${UI_COLORS.primaryDark}`,
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 5,
                  }}>
                    <div>
                      <span style={{
                        color: UI_COLORS.textBright,
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        fontSize: 14,
                      }}>
                        {entry.name}
                      </span>
                      {entry.title && (
                        <span style={{
                          color: UI_COLORS.textMuted,
                          fontFamily: 'monospace',
                          fontSize: 12,
                          marginLeft: 8,
                        }}>
                          {entry.title}
                        </span>
                      )}
                    </div>
                    <span style={{
                      color: OUTCOME_COLORS[entry.outcome] || UI_COLORS.textMuted,
                      fontFamily: 'monospace',
                      fontSize: 11,
                      padding: '2px 8px',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: 3,
                    }}>
                      {OUTCOME_LABELS[entry.outcome] || entry.outcome}
                    </span>
                  </div>
                  
                  <div style={{
                    color: UI_COLORS.textMuted,
                    fontFamily: 'monospace',
                    fontSize: 11,
                    marginBottom: 5,
                  }}>
                    {ZONE_NAMES[entry.zone] || entry.zone} • Floor {entry.floor}
                  </div>
                  
                  <div style={{
                    color: UI_COLORS.textBright,
                    fontFamily: 'monospace',
                    fontSize: 12,
                    lineHeight: 1.4,
                  }}>
                    {entry.summary}
                  </div>
                  
                  {entry.rewards && entry.rewards.length > 0 && (
                    <div style={{
                      marginTop: 8,
                      color: '#ffd700',
                      fontFamily: 'monospace',
                      fontSize: 11,
                    }}>
                      Rewards: {entry.rewards.join(', ')}
                    </div>
                  )}
                  
                  {entry.gaveQuest && (
                    <div style={{
                      marginTop: 5,
                      color: '#44aaff',
                      fontFamily: 'monospace',
                      fontSize: 11,
                    }}>
                      Quest received
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
