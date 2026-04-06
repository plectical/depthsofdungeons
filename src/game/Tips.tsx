import { useState } from 'react';
import type { CSSProperties } from 'react';

interface TipsProps {
  onClose: () => void;
}

const TIPS = [
  {
    title: 'Movement',
    text: 'Tap the directional pad or use WASD / arrow keys to move. Walk into enemies to attack them.',
  },
  {
    title: 'The Goal',
    text: 'Find the stairs (>) on each floor to go deeper. The further you get, the higher your score. You only get one life!',
  },
  {
    title: 'Hunger',
    text: 'Your hunger bar drops over time. If it hits zero, you start losing health. Eat food (%) you find on the ground to stay alive.',
  },
  {
    title: 'Equipment',
    text: 'Pick up weapons ()), armor ([), rings (=), and amulets (") to get stronger. Open your Bag to equip them.',
  },
  {
    title: 'The Shop',
    text: 'You\'ll find a shopkeeper ($) on most floors. Walk onto them to browse their items. Kill monsters to earn gold.',
  },
  {
    title: 'Status Effects',
    text: 'Enemies can poison, bleed, stun, or freeze you. Poison and bleed deal damage each turn. Stun and freeze stop you from moving. Look for Antidote potions!',
  },
  {
    title: 'Monster Abilities',
    text: 'Each monster fights differently. Trolls heal themselves, Vampires drain your health, Rats call for backup, and some enemies go berserk when low on health.',
  },
  {
    title: 'Bosses',
    text: 'Powerful bosses appear on certain floors. They have special attacks like summoning minions or area damage. Defeating them drops rare loot.',
  },
  {
    title: 'Mercenaries',
    text: 'Hire companions (M) you find in the dungeon. They fight alongside you and each has a special ability.',
  },
  {
    title: 'Bloodline',
    text: 'When you die, your hero becomes an ancestor. Over time your bloodline grows stronger with bonus stats and traits that carry to future runs.',
  },
  {
    title: 'Terrain',
    text: 'Watch where you stand! Lava boosts fire damage, water amplifies electricity, tall grass lets you dodge, and holy ground weakens undead.',
  },
];

export function Tips({ onClose }: TipsProps) {
  const [page, setPage] = useState(0);
  const tip = TIPS[page]!;
  const isLast = page === TIPS.length - 1;

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <div style={headerStyle}>
          <span style={titleStyle}>~ HOW TO PLAY ~</span>
          <span style={pageStyle}>{page + 1}/{TIPS.length}</span>
          <button style={closeBtnStyle} onClick={onClose}>[X]</button>
        </div>

        <div style={contentStyle}>
          <div style={tipTitleStyle}>{tip.title}</div>
          <div style={tipTextStyle}>{tip.text}</div>
        </div>

        <div style={navStyle}>
          <button
            style={page > 0 ? navBtnStyle : navBtnDisabledStyle}
            onClick={() => { if (page > 0) setPage(page - 1); }}
            disabled={page === 0}
          >
            {'< Prev'}
          </button>
          <div style={dotsStyle}>
            {TIPS.map((_, i) => (
              <span
                key={i}
                style={{ color: i === page ? '#33ff66' : '#1a3a1a', fontSize: 8, cursor: 'pointer' }}
                onClick={() => setPage(i)}
              >
                {'\u25CF'}
              </span>
            ))}
          </div>
          {isLast ? (
            <button style={gotItBtnStyle} onClick={onClose}>
              {'Got it!'}
            </button>
          ) : (
            <button style={navBtnStyle} onClick={() => setPage(page + 1)}>
              {'Next >'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Styles
const overlayStyle: CSSProperties = {
  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 12,
};
const panelStyle: CSSProperties = {
  width: '100%', maxWidth: 340, background: '#000',
  border: '1px solid #1a5a2a', display: 'flex', flexDirection: 'column', overflow: 'hidden',
};
const headerStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', padding: '8px 10px', borderBottom: '1px solid #0a3a0a', gap: 8,
};
const titleStyle: CSSProperties = {
  color: '#33ff66', fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold', flex: 1, textShadow: '0 0 8px #33ff6633',
};
const pageStyle: CSSProperties = {
  color: '#1a8a3a', fontFamily: 'monospace', fontSize: 11, opacity: 0.7,
};
const closeBtnStyle: CSSProperties = {
  padding: '4px 6px', fontSize: 12, fontWeight: 'bold', background: 'transparent',
  color: '#ff3333', border: '1px solid #4a0a0a', fontFamily: 'monospace', cursor: 'pointer',
};
const contentStyle: CSSProperties = {
  padding: '16px 14px', minHeight: 100,
};
const tipTitleStyle: CSSProperties = {
  color: '#33ff66', fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold',
  textShadow: '0 0 8px #33ff6633', marginBottom: 10,
};
const tipTextStyle: CSSProperties = {
  color: '#aaaacc', fontFamily: 'monospace', fontSize: 12, lineHeight: '18px',
};
const navStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '8px 10px', borderTop: '1px solid #0a3a0a', gap: 8,
};
const dotsStyle: CSSProperties = {
  display: 'flex', gap: 4, alignItems: 'center',
};
const navBtnStyle: CSSProperties = {
  padding: '6px 12px', fontSize: 11, fontFamily: 'monospace', fontWeight: 'bold',
  background: 'transparent', color: '#33ff66', border: '1px solid #1a5a2a', cursor: 'pointer', minWidth: 60,
};
const navBtnDisabledStyle: CSSProperties = {
  ...navBtnStyle, color: '#1a3a1a', border: '1px solid #0a1a0a', cursor: 'default',
};
const gotItBtnStyle: CSSProperties = {
  ...navBtnStyle, color: '#33ff66', border: '1px solid #33ff66',
  textShadow: '0 0 4px #33ff6644', boxShadow: '0 0 6px #33ff6622',
};
