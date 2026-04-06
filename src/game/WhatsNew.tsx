import type { CSSProperties } from 'react';

/**
 * Build version — bump this string every time you deploy a new build.
 * When the player opens the game and their stored "lastSeenVersion" differs
 * from this value, the What's New screen auto-appears.
 */
export const BUILD_VERSION = '1.58.8';

/** A single update entry shown in the changelog. */
export interface UpdateEntry {
  version: string;
  date: string;
  title: string;
  notes: string[];
}

/**
 * Release notes — newest first.
 * Each deploy, add a new entry at the TOP of this array.
 */
export const UPDATE_LOG: UpdateEntry[] = [
  {
    version: '1.57.7',
    date: 'Mar 24 2026',
    title: 'New Quests & Tracking',
    notes: [
      '14 new quests added! Earn echoes by spending skill points and unlocking echo upgrades.',
      'New quests span all tiers — from beginner "Skill Student" to master "Echo Master".',
      'Path-specific echo quests: push deep into Vitality, Might, Exploration, or Fortune.',
      'Fixed a bug where ranged classes got stuck trying to equip shields in auto-play.',
      'Improved behind-the-scenes tracking so we can keep making the game better.',
    ],
  },
  {
    version: '1.29.16',
    date: 'Mar 23 2026',
    title: 'Update Screen & Visual Polish',
    notes: [
      'Added this "What\'s New" screen so you can see what changed each update.',
      'Mercenaries now have unique symbols instead of looking like enemies.',
      'NPCs got new icons so they look friendly instead of threatening.',
      'Hired allies now glow blue so you can tell them apart from monsters.',
    ],
  },
  {
    version: '1.29.15',
    date: 'Mar 22 2026',
    title: 'Quest Fixes',
    notes: [
      'Autoplay now correctly tracks quest progress (kills, gold, auto-turns).',
      'Gold Rush and other single-run quests no longer reset to 0 when you die.',
      '"Hands Off" and "AFK Champion" quests now count autoplay turns.',
    ],
  },
  {
    version: '1.29.14',
    date: 'Mar 21 2026',
    title: 'Echo Tree & Quests Launch',
    notes: [
      'Echo Tree — a permanent upgrade tree you unlock by spending Echoes.',
      'Quests — complete challenges during runs to earn Echo currency.',
      'New classes, zones, weapons, and enemies unlockable through the Echo Tree.',
    ],
  },
];

interface WhatsNewProps {
  onClose: () => void;
}

export function WhatsNew({ onClose }: WhatsNewProps) {
  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <span style={titleStyle}>~ WHAT'S NEW ~</span>
          <button style={closeBtnStyle} onClick={onClose}>[X]</button>
        </div>

        {/* Scrollable content */}
        <div style={scrollStyle}>
          {UPDATE_LOG.map((entry, i) => (
            <div key={entry.version} style={i === 0 ? latestEntryStyle : entryStyle}>
              <div style={entryHeaderStyle}>
                <span style={versionStyle}>v{entry.version}</span>
                <span style={dateStyle}>{entry.date}</span>
              </div>
              <div style={entryTitleStyle}>{entry.title}</div>
              <ul style={notesListStyle}>
                {entry.notes.map((note, j) => (
                  <li key={j} style={noteStyle}>{note}</li>
                ))}
              </ul>
              {i < UPDATE_LOG.length - 1 && <div style={dividerStyle} />}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <button style={gotItBtnStyle} onClick={onClose}>
            {'Got it!'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Styles ──

const overlayStyle: CSSProperties = {
  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 12,
};

const panelStyle: CSSProperties = {
  width: '100%', maxWidth: 340, maxHeight: '85vh', background: '#000',
  border: '1px solid #1a4a5a', display: 'flex', flexDirection: 'column', overflow: 'hidden',
};

const headerStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', padding: '8px 10px',
  borderBottom: '1px solid #0a2a3a', gap: 8,
};

const titleStyle: CSSProperties = {
  color: '#55ccff', fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold',
  flex: 1, textShadow: '0 0 8px #55ccff33',
};

const closeBtnStyle: CSSProperties = {
  padding: '4px 6px', fontSize: 12, fontWeight: 'bold', background: 'transparent',
  color: '#ff3333', border: '1px solid #4a0a0a', fontFamily: 'monospace', cursor: 'pointer',
};

const scrollStyle: CSSProperties = {
  flex: 1, overflowY: 'auto', padding: '10px 12px',
  WebkitOverflowScrolling: 'touch',
};

const latestEntryStyle: CSSProperties = {
  marginBottom: 6,
};

const entryStyle: CSSProperties = {
  marginBottom: 6, opacity: 0.7,
};

const entryHeaderStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2,
};

const versionStyle: CSSProperties = {
  color: '#55ccff', fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold',
};

const dateStyle: CSSProperties = {
  color: '#446688', fontFamily: 'monospace', fontSize: 10,
};

const entryTitleStyle: CSSProperties = {
  color: '#ccddee', fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold', marginBottom: 4,
};

const notesListStyle: CSSProperties = {
  margin: 0, paddingLeft: 16,
};

const noteStyle: CSSProperties = {
  color: '#8899aa', fontFamily: 'monospace', fontSize: 11, lineHeight: '17px', marginBottom: 2,
};

const dividerStyle: CSSProperties = {
  borderBottom: '1px solid #0a2a3a', margin: '8px 0',
};

const footerStyle: CSSProperties = {
  display: 'flex', justifyContent: 'center', padding: '8px 10px',
  borderTop: '1px solid #0a2a3a',
};

const gotItBtnStyle: CSSProperties = {
  padding: '8px 24px', fontSize: 12, fontFamily: 'monospace', fontWeight: 'bold',
  background: 'transparent', color: '#55ccff', border: '1px solid #55ccff',
  cursor: 'pointer', textShadow: '0 0 4px #55ccff44', boxShadow: '0 0 6px #55ccff22',
};
