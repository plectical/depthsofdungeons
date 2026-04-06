import type { CSSProperties } from 'react';
import type { QuestEchoData, CharacterQuest } from './types';
import { getQuestTemplate } from './quests';

interface QuestLogProps {
  data: QuestEchoData;
  characterQuests?: CharacterQuest[];
  onClaim: (index: number) => void;
  onClaimCharacterQuest?: (questId: string) => void;
  onClose: () => void;
  onOpenEchoTree: () => void;
}

export function QuestLog({ data, characterQuests, onClaim, onClaimCharacterQuest, onClose, onOpenEchoTree }: QuestLogProps) {
  const activeCharQuests = characterQuests?.filter(q => !q.isClaimed) ?? [];
  
  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <span style={titleStyle}>QUESTS</span>
          <span style={echoStyle}>~ {data.echoes}</span>
          <button style={closeBtnStyle} onClick={onClose}>[X]</button>
        </div>

        {/* Quest list */}
        <div style={questListStyle}>
          {/* Character Quests Section */}
          {activeCharQuests.length > 0 && (
            <>
              <div style={sectionHeaderStyle}>ALLY REQUESTS</div>
              {activeCharQuests.map((quest) => {
                const pct = Math.min(100, Math.floor((quest.progress / quest.target) * 100));
                const done = quest.isComplete;
                
                return (
                  <div key={quest.id} style={{
                    ...questCardStyle,
                    borderColor: done ? '#ffaa33' : '#3a2a1a',
                    background: done ? '#181208' : '#0e0804',
                  }}>
                    {/* Row 1: portrait + name + reward */}
                    <div style={questHeaderRow}>
                      {quest.characterPortraitUrl ? (
                        <img
                          src={quest.characterPortraitUrl}
                          alt={quest.characterName}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 4,
                            objectFit: 'cover',
                            border: '1px solid #ffaa33',
                            marginRight: 8,
                          }}
                        />
                      ) : (
                        <span style={{
                          color: '#ffaa33',
                          fontSize: 18,
                          marginRight: 8,
                          width: 36,
                          textAlign: 'center',
                        }}>@</span>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          color: done ? '#ffaa33' : '#ddd',
                          fontSize: 13,
                          fontWeight: 'bold',
                        }}>
                          {quest.name}
                        </div>
                        <div style={{ color: '#888', fontSize: 10 }}>
                          from {quest.characterName}
                        </div>
                        <div style={{ color: '#666', fontSize: 11, fontStyle: 'italic', marginTop: 2 }}>
                          "{quest.flavorText}"
                        </div>
                      </div>
                      <div style={{
                        textAlign: 'right',
                        minWidth: 50,
                      }}>
                        {quest.rewards.gold && (
                          <div style={{ color: '#ffd700', fontSize: 11 }}>
                            ${quest.rewards.gold}
                          </div>
                        )}
                        {quest.rewards.echoReward && (
                          <div style={{ color: '#55ccff', fontSize: 11 }}>
                            ~{quest.rewards.echoReward}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ padding: '6px 0 2px' }}>
                      <div style={progressBarBg}>
                        <div style={{
                          height: '100%',
                          borderRadius: 3,
                          width: `${pct}%`,
                          background: done ? '#ffaa33' : '#5a3a1a',
                          transition: 'width 0.3s',
                        }} />
                      </div>
                      <div style={progressTextRow}>
                        <span style={{
                          color: done ? '#ffaa33' : '#888',
                          fontSize: 11,
                        }}>
                          {Math.min(quest.progress, quest.target)}/{quest.target}
                        </span>
                        {done && onClaimCharacterQuest && (
                          <button style={charClaimBtnStyle} onClick={() => onClaimCharacterQuest(quest.id)}>
                            [ CLAIM ]
                          </button>
                        )}
                        {!done && (
                          <span style={{ color: '#555', fontSize: 10 }}>
                            {pct}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
          
          {/* Standard Quests Section */}
          {activeCharQuests.length > 0 && data.activeQuests.length > 0 && (
            <div style={sectionHeaderStyle}>BOUNTIES</div>
          )}
          
          {data.activeQuests.length === 0 && activeCharQuests.length === 0 && (
            <div style={{ color: '#666', fontSize: 13, textAlign: 'center', padding: 30 }}>
              No active quests yet. Play to unlock quests!
            </div>
          )}
          {data.activeQuests.map((quest, i) => {
            const tmpl = getQuestTemplate(quest.templateId);
            if (!tmpl) return null;
            const pct = Math.min(100, Math.floor((quest.progress / tmpl.objective.target) * 100));
            const done = quest.completed;

            return (
              <div key={quest.templateId} style={{
                ...questCardStyle,
                borderColor: done ? '#55ccff' : '#1a3a4a',
                background: done ? '#061418' : '#060e14',
              }}>
                {/* Row 1: icon + name + reward */}
                <div style={questHeaderRow}>
                  <span style={{
                    color: tmpl.color,
                    fontSize: 18,
                    marginRight: 8,
                    width: 24,
                    textAlign: 'center',
                  }}>
                    {tmpl.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      color: done ? '#55ccff' : '#ddd',
                      fontSize: 13,
                      fontWeight: 'bold',
                    }}>
                      {tmpl.name}
                    </div>
                    <div style={{ color: '#777', fontSize: 11 }}>
                      {tmpl.description}
                    </div>
                  </div>
                  <div style={{
                    textAlign: 'right',
                    minWidth: 40,
                  }}>
                    <div style={{ color: '#55ccff', fontSize: 13, fontWeight: 'bold' }}>
                      ~{tmpl.reward}
                    </div>
                    <div style={{ color: '#444', fontSize: 9 }}>
                      {tmpl.persistsAcrossRuns ? 'cross-run' : 'this run'}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ padding: '6px 0 2px' }}>
                  <div style={progressBarBg}>
                    <div style={{
                      height: '100%',
                      borderRadius: 3,
                      width: `${pct}%`,
                      background: done ? '#55ccff' : '#1a5a2a',
                      transition: 'width 0.3s',
                    }} />
                  </div>
                  <div style={progressTextRow}>
                    <span style={{
                      color: done ? '#55ccff' : '#888',
                      fontSize: 11,
                    }}>
                      {Math.min(quest.progress, tmpl.objective.target)}/{tmpl.objective.target}
                    </span>
                    {done && (
                      <button style={claimBtnStyle} onClick={() => onClaim(i)}>
                        [ CLAIM ~{tmpl.reward} ]
                      </button>
                    )}
                    {!done && (
                      <span style={{ color: '#555', fontSize: 10 }}>
                        {pct}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom bar */}
        <div style={bottomBarStyle}>
          <button style={echoTreeBtnStyle} onClick={onOpenEchoTree}>
            [ ECHO TREE ]
          </button>
          <span style={{ color: '#555', fontSize: 10 }}>
            Total earned: ~{data.totalEchoesEarned}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Styles ──

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.98)',
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'center',
  zIndex: 50,
  padding: 0,
};

const panelStyle: CSSProperties = {
  width: '100%',
  maxWidth: 420,
  height: '100%',
  background: '#000',
  borderLeft: '1px solid #1a4a5a',
  borderRight: '1px solid #1a4a5a',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  fontFamily: 'monospace',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 12px',
  borderBottom: '1px solid #1a4a5a',
  gap: 8,
};

const titleStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#55ccff',
  letterSpacing: 2,
  flex: 1,
  textShadow: '0 0 6px #55ccff33',
};

const echoStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 'bold',
  color: '#55ccff',
  textShadow: '0 0 8px #55ccff55',
};

const closeBtnStyle: CSSProperties = {
  background: 'none',
  border: '1px solid #333',
  color: '#888',
  fontFamily: 'monospace',
  fontSize: 13,
  padding: '4px 8px',
  cursor: 'pointer',
};

const questListStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '8px 10px',
  WebkitOverflowScrolling: 'touch',
};

const questCardStyle: CSSProperties = {
  border: '1px solid #1a3a4a',
  padding: '10px 12px',
  marginBottom: 8,
  background: '#060e14',
};

const questHeaderRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const progressBarBg: CSSProperties = {
  width: '100%',
  height: 6,
  background: '#111',
  borderRadius: 3,
  overflow: 'hidden',
};

const progressTextRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 4,
};

const claimBtnStyle: CSSProperties = {
  background: 'none',
  border: '1px solid #55ccff',
  color: '#55ccff',
  fontFamily: 'monospace',
  fontSize: 12,
  fontWeight: 'bold',
  padding: '4px 12px',
  cursor: 'pointer',
  textShadow: '0 0 6px #55ccff55',
};

const bottomBarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 12px',
  borderTop: '1px solid #1a4a5a',
};

const echoTreeBtnStyle: CSSProperties = {
  background: 'none',
  border: '1px solid #55ccff',
  color: '#55ccff',
  fontFamily: 'monospace',
  fontSize: 13,
  fontWeight: 'bold',
  padding: '6px 14px',
  cursor: 'pointer',
  textShadow: '0 0 6px #55ccff44',
};

const sectionHeaderStyle: CSSProperties = {
  color: '#888',
  fontSize: 11,
  fontWeight: 'bold',
  letterSpacing: 2,
  padding: '12px 8px 6px',
  borderBottom: '1px solid #222',
  marginBottom: 8,
};

const charClaimBtnStyle: CSSProperties = {
  background: 'none',
  border: '1px solid #ffaa33',
  color: '#ffaa33',
  fontFamily: 'monospace',
  fontSize: 12,
  fontWeight: 'bold',
  padding: '4px 12px',
  cursor: 'pointer',
  textShadow: '0 0 6px #ffaa3355',
};
