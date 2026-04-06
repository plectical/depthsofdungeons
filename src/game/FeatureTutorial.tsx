import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { safeSetItem, safeGetItem } from './safeStorage';

export interface TutorialPage {
  title: string;
  text: string;
}

interface Props {
  storageKey: string;
  pages: TutorialPage[];
  accentColor: string;
  heading: string;
  onDone: () => void;
}

/**
 * A paginated tutorial overlay that appears the first time a feature is opened.
 * Once dismissed, it saves a flag to appStorage so it never shows again.
 */
export function FeatureTutorial({ storageKey, pages, accentColor, heading, onDone }: Props) {
  const [page, setPage] = useState(0);
  const tip = pages[page]!;
  const isLast = page === pages.length - 1;

  const dismiss = () => {
    safeSetItem(storageKey, '1');
    onDone();
  };

  return (
    <div style={overlayStyle}>
      <div style={{ ...panelStyle, borderColor: accentColor + '66' }}>
        <div style={{ ...headerStyle, borderBottomColor: accentColor + '33' }}>
          <span style={{ ...titleStyle, color: accentColor }}>{heading}</span>
          <span style={pageStyle}>{page + 1}/{pages.length}</span>
          <button style={closeBtnStyle} onClick={dismiss}>[X]</button>
        </div>

        <div style={contentStyle}>
          <div style={{ ...tipTitleStyle, color: accentColor }}>{tip.title}</div>
          <div style={tipTextStyle}>{tip.text}</div>
        </div>

        <div style={{ ...navStyle, borderTopColor: accentColor + '33' }}>
          <button
            style={page > 0 ? { ...navBtnStyle, color: accentColor, borderColor: accentColor + '66' } : navBtnDisabledStyle}
            onClick={() => { if (page > 0) setPage(page - 1); }}
            disabled={page === 0}
          >
            {'< Prev'}
          </button>
          <div style={dotsStyle}>
            {pages.map((_, i) => (
              <span
                key={i}
                style={{ color: i === page ? accentColor : accentColor + '33', fontSize: 8, cursor: 'pointer' }}
                onClick={() => setPage(i)}
              >
                {'\u25CF'}
              </span>
            ))}
          </div>
          {isLast ? (
            <button
              style={{ ...gotItBtnStyle, color: accentColor, borderColor: accentColor }}
              onClick={dismiss}
            >
              {'Got it!'}
            </button>
          ) : (
            <button
              style={{ ...navBtnStyle, color: accentColor, borderColor: accentColor + '66' }}
              onClick={() => setPage(page + 1)}
            >
              {'Next >'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook that checks appStorage and returns whether the tutorial should show.
 */
export function useFeatureTutorial(storageKey: string): [boolean, () => void] {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let mounted = true;
    safeGetItem(storageKey).then((val) => {
      if (mounted && !val) setShow(true);
    });
    return () => { mounted = false; };
  }, [storageKey]);

  const dismiss = () => setShow(false);
  return [show, dismiss];
}

// ── Tutorial Content ──

export const NECROPOLIS_TUTORIAL: TutorialPage[] = [
  {
    title: 'Welcome to the Necropolis',
    text: 'The Necropolis is a community-driven feature. Every time ANY player dies in the game, it counts toward a shared death total across all players.',
  },
  {
    title: 'Communal Unlocks',
    text: 'As the community death count rises, new content unlocks for everyone — weapons, armor, items, enemies, classes, dungeon types, and even new zones.',
  },
  {
    title: 'Bestiary Bounties',
    text: 'The Bestiary tab tracks community-wide kill challenges. All players\' kills combine toward massive bounty targets. Complete a bounty and its reward item appears in the game for everyone!',
  },
  {
    title: 'Every Death Matters',
    text: 'Even a short run where you die on floor 1 still counts. Your death helps unlock new content for the entire community. Die well!',
  },
];

export const BLOODLINE_TUTORIAL: TutorialPage[] = [
  {
    title: 'Your Bloodline',
    text: 'Every time you die, your hero becomes an ancestor. Your bloodline remembers them and grows stronger with each generation.',
  },
  {
    title: 'Traits',
    text: 'As you play, you unlock traits — permanent bonuses that carry over to all future runs. Traits give stat boosts, starting items, extra gold, and more.',
  },
  {
    title: 'How to Unlock Traits',
    text: 'Each trait has a challenge to complete: die a certain number of times, kill enough monsters, reach deep floors, or discover rare things. Check the progress bar on each trait to see how close you are.',
  },
  {
    title: 'Ancestors',
    text: 'Your last 5 ancestors are remembered. The Ancestors tab shows their class, how far they got, how they died, and their kill count.',
  },
];

export const BESTIARY_TUTORIAL: TutorialPage[] = [
  {
    title: 'The Bestiary',
    text: 'The Bestiary is your personal monster encyclopedia. Every creature you encounter in the dungeon gets recorded here.',
  },
  {
    title: 'Encounter & Kill',
    text: 'Monsters are marked as "encountered" the first time you see them, and "killed" once you defeat one. Your total kill count for each monster is tracked.',
  },
  {
    title: 'Discover Them All',
    text: 'Different zones, floor depths, and Necropolis unlocks introduce new monsters. Keep exploring to fill out your Bestiary!',
  },
];

export const RANGED_CLASS_TUTORIAL: TutorialPage[] = [
  {
    title: 'Ranged Combat',
    text: 'Your class uses ranged weapons! Instead of walking next to enemies to fight, you can attack from a distance. Just tap on any enemy you can see within your weapon\'s range.',
  },
  {
    title: 'Weapon Range',
    text: 'Each ranged weapon has a range number (shown as a bow icon in your inventory). For example, a range of 4 means you can hit enemies up to 4 tiles away. Enemies right next to you will be hit with a melee attack instead.',
  },
  {
    title: 'Positioning Matters',
    text: 'Keep your distance! Ranged classes are usually more fragile up close. Try to pick off enemies before they reach you. Use corridors and doorways to funnel enemies so you can shoot them as they approach.',
  },
  {
    title: 'Ranged Weapon Drops',
    text: 'Look for bow items (shown with the } symbol) and staves (shown with /) as you explore. Ranged weapons are marked with a bow icon and their range in your inventory. Some powerful bows are exclusive to the Ranger class!',
  },
];

// ── Styles ──

const overlayStyle: CSSProperties = {
  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.96)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 12,
};
const panelStyle: CSSProperties = {
  width: '100%', maxWidth: 340, background: '#000',
  border: '1px solid', display: 'flex', flexDirection: 'column', overflow: 'hidden',
};
const headerStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', padding: '8px 10px', borderBottom: '1px solid', gap: 8,
};
const titleStyle: CSSProperties = {
  fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold', flex: 1,
};
const pageStyle: CSSProperties = {
  color: '#888', fontFamily: 'monospace', fontSize: 11, opacity: 0.7,
};
const closeBtnStyle: CSSProperties = {
  padding: '4px 6px', fontSize: 12, fontWeight: 'bold', background: 'transparent',
  color: '#ff3333', border: '1px solid #4a0a0a', fontFamily: 'monospace', cursor: 'pointer',
};
const contentStyle: CSSProperties = {
  padding: '16px 14px', minHeight: 110,
};
const tipTitleStyle: CSSProperties = {
  fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold', marginBottom: 10,
};
const tipTextStyle: CSSProperties = {
  color: '#aaaacc', fontFamily: 'monospace', fontSize: 12, lineHeight: '18px',
};
const navStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '8px 10px', borderTop: '1px solid', gap: 8,
};
const dotsStyle: CSSProperties = {
  display: 'flex', gap: 4, alignItems: 'center',
};
const navBtnStyle: CSSProperties = {
  padding: '6px 12px', fontSize: 11, fontFamily: 'monospace', fontWeight: 'bold',
  background: 'transparent', border: '1px solid', cursor: 'pointer', minWidth: 60,
};
const navBtnDisabledStyle: CSSProperties = {
  ...navBtnStyle, color: '#333', borderColor: '#1a1a1a', cursor: 'default',
};
const gotItBtnStyle: CSSProperties = {
  ...navBtnStyle, fontWeight: 'bold',
};
