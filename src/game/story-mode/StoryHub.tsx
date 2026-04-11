import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { CampaignSave } from './campaignTypes';
import { ALL_CHAPTERS } from './chapters';
import type { PlayerClass } from '../types';
import { CLASS_DEFS } from '../constants';

interface StoryHubProps {
  save: CampaignSave | null;
  onNewCampaign: (playerClass: PlayerClass, playerRace?: string) => void;
  onContinue: (chapterId: string) => void;
  onSelectChapter: (chapterId: string) => void;
  onBack: () => void;
  onDeleteSave: () => void;
}

export function StoryHub({ save, onNewCampaign, onContinue, onSelectChapter, onBack, onDeleteSave }: StoryHubProps) {
  const [showNewGame, setShowNewGame] = useState(false);
  const [selectedClass, setSelectedClass] = useState<PlayerClass>('warrior');

  const completedChapters = save?.completedChapters ?? [];
  const classDef = CLASS_DEFS.find(c => c.id === save?.playerClass);

  if (showNewGame) {
    return (
      <div style={containerStyle}>
        <div style={titleStyle}>New Campaign</div>
        <div style={{ color: '#88aa88', fontFamily: 'monospace', fontSize: 11, marginBottom: 12 }}>
          Choose your class for the story campaign
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 320, width: '100%' }}>
          {CLASS_DEFS.filter(c => c.id !== 'generated').map(cls => (
            <button
              key={cls.id}
              style={{
                ...classButtonStyle,
                border: selectedClass === cls.id ? `2px solid ${cls.color}` : '1px solid #333',
                background: selectedClass === cls.id ? `${cls.color}11` : 'rgba(0,0,0,0.6)',
              }}
              onClick={() => setSelectedClass(cls.id)}
            >
              <span style={{ color: cls.color, fontWeight: 'bold', fontSize: 13 }}>{cls.name}</span>
              <span style={{ color: '#668866', fontSize: 9, marginLeft: 8 }}>{cls.description}</span>
            </button>
          ))}
        </div>

        <button
          style={primaryButtonStyle}
          onClick={() => onNewCampaign(selectedClass)}
        >
          {'[ Begin Campaign ]'}
        </button>

        <button style={backButtonStyle} onClick={() => setShowNewGame(false)}>
          {'[ Back ]'}
        </button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>Story Mode</div>
      <div style={{ color: '#556655', fontFamily: 'monospace', fontSize: 10, marginBottom: 8 }}>
        A persistent RPG campaign through the depths
      </div>

      {save ? (
        <>
          {/* Active campaign info */}
          <div style={saveCardStyle}>
            <div style={{ color: classDef?.color ?? '#33ff66', fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold' }}>
              {classDef?.name ?? save.playerClass} — Lv.{save.playerLevel}
            </div>
            <div style={{ color: '#88aa88', fontFamily: 'monospace', fontSize: 10, marginTop: 2 }}>
              Chapter: {ALL_CHAPTERS.find(c => c.id === save.currentChapter)?.name ?? save.currentChapter}
            </div>
            <div style={{ color: '#556655', fontFamily: 'monospace', fontSize: 9, marginTop: 2 }}>
              Floor {save.currentFloor} | {completedChapters.length}/{ALL_CHAPTERS.length} chapters complete
            </div>
          </div>

          <button style={primaryButtonStyle} onClick={() => onContinue(save.currentChapter)}>
            {'[ Continue ]'}
          </button>
        </>
      ) : (
        <div style={{ color: '#556655', fontFamily: 'monospace', fontSize: 11, marginBottom: 8 }}>
          No active campaign
        </div>
      )}

      {/* Chapter list */}
      <div style={{ color: '#aaaa44', fontFamily: 'monospace', fontSize: 11, marginTop: 12, marginBottom: 6 }}>
        CHAPTERS
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 320, width: '100%' }}>
        {ALL_CHAPTERS.map(ch => {
          const completed = completedChapters.includes(ch.id);
          const unlocked = ch.requiredChapters.every(req => completedChapters.includes(req));
          const isCurrent = save?.currentChapter === ch.id;
          return (
            <button
              key={ch.id}
              style={{
                ...chapterCardStyle,
                border: isCurrent ? `1px solid ${ch.color}` : completed ? '1px solid #336633' : unlocked ? '1px solid #333' : '1px solid #222',
                opacity: unlocked ? 1 : 0.4,
              }}
              onClick={() => unlocked && !isCurrent && onSelectChapter(ch.id)}
              disabled={!unlocked || isCurrent}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 16 }}>{completed ? '✓' : unlocked ? ch.icon : '🔒'}</span>
                <div>
                  <div style={{ color: completed ? '#44ff44' : unlocked ? ch.color : '#666', fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold' }}>
                    {ch.name}
                  </div>
                  <div style={{ color: '#668866', fontFamily: 'monospace', fontSize: 9 }}>
                    {completed ? 'Completed' : unlocked ? ch.description.slice(0, 60) + '...' : 'Locked'}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button style={secondaryButtonStyle} onClick={() => setShowNewGame(true)}>
          {save ? '[ New Campaign ]' : '[ Start Campaign ]'}
        </button>
        {save && (
          <button
            style={{ ...secondaryButtonStyle, color: '#ff4444', borderColor: '#ff444444' }}
            onClick={() => {
              onDeleteSave();
            }}
          >
            {'[ Delete Save ]'}
          </button>
        )}
      </div>

      <button style={backButtonStyle} onClick={onBack}>
        {'[ Back to Title ]'}
      </button>
    </div>
  );
}

// ── Styles ──

const containerStyle: CSSProperties = {
  width: '100%', height: '100%',
  background: '#0a0a0a',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  justifyContent: 'flex-start',
  padding: 20, paddingTop: 30,
  overflowY: 'auto',
  fontFamily: 'monospace',
};

const titleStyle: CSSProperties = {
  color: '#cc8844',
  fontFamily: 'monospace',
  fontSize: 22,
  fontWeight: 'bold',
  letterSpacing: 3,
  textShadow: '0 0 12px #cc884444',
  marginBottom: 4,
};

const saveCardStyle: CSSProperties = {
  background: 'rgba(0,0,0,0.6)',
  border: '1px solid #33ff6633',
  padding: '10px 16px',
  maxWidth: 320,
  width: '100%',
  marginBottom: 8,
};

const primaryButtonStyle: CSSProperties = {
  background: 'rgba(0,0,0,0.8)',
  border: '1px solid #33ff6688',
  color: '#33ff66',
  fontFamily: 'monospace',
  fontSize: 14,
  fontWeight: 'bold',
  padding: '10px 24px',
  cursor: 'pointer',
  letterSpacing: 2,
  marginTop: 8,
};

const secondaryButtonStyle: CSSProperties = {
  background: 'transparent',
  border: '1px solid #44444488',
  color: '#88aa88',
  fontFamily: 'monospace',
  fontSize: 11,
  padding: '6px 14px',
  cursor: 'pointer',
};

const backButtonStyle: CSSProperties = {
  background: 'transparent',
  border: '1px solid #333',
  color: '#666',
  fontFamily: 'monospace',
  fontSize: 11,
  padding: '6px 16px',
  cursor: 'pointer',
  marginTop: 16,
};

const classButtonStyle: CSSProperties = {
  background: 'rgba(0,0,0,0.6)',
  padding: '8px 12px',
  cursor: 'pointer',
  textAlign: 'left',
  fontFamily: 'monospace',
  display: 'flex',
  alignItems: 'center',
};

const chapterCardStyle: CSSProperties = {
  background: 'rgba(0,0,0,0.5)',
  padding: '8px 10px',
  cursor: 'pointer',
  textAlign: 'left',
};
