import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { TutorialPage } from './FeatureTutorial';
import { useCdnImage } from './useCdnImage';
import { safeSetItem } from './safeStorage';

interface Props {
  storageKey: string;
  pages: TutorialPage[];
  onDone: () => void;
}

/**
 * Necropolis tutorial guide — same layout as the Elder dialogue bar
 * (portrait on left, speech on right, tap to continue) but with the
 * reaper character and red accent colours.
 */
export function NecropolisGuide({ storageKey, pages, onDone }: Props) {
  const [page, setPage] = useState(0);
  const portraitUrl = useCdnImage('necropolis-guide.jpg');
  const tip = pages[page]!;
  const isLast = page === pages.length - 1;

  const advance = () => {
    if (isLast) {
      safeSetItem(storageKey, '1');
      onDone();
    } else {
      setPage(page + 1);
    }
  };

  return (
    <div style={overlayStyle} onClick={advance}>
      <div style={barStyle}>
        {/* Portrait */}
        <div style={portraitContainerStyle}>
          {portraitUrl && <img src={portraitUrl} alt="The Keeper" style={portraitStyle} />}
        </div>
        {/* Speech bubble */}
        <div style={speechStyle}>
          <div style={nameStyle}>The Keeper</div>
          <div style={tipTitleStyle}>{tip.title}</div>
          <div style={messageStyle}>{tip.text}</div>
          <div style={footerStyle}>
            <span style={pageIndicatorStyle}>{page + 1}/{pages.length}</span>
            <span style={continueStyle}>
              {isLast ? '[ Tap to close ]' : '[ Tap to continue ]'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Styles (mirror Elder/Bloodline layout, red accent) ──

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  zIndex: 200,
  padding: '0 8px 60px 8px',
  cursor: 'pointer',
};

const barStyle: CSSProperties = {
  width: '100%',
  maxWidth: 380,
  height: 140,
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'stretch',
  background: '#0a0a14',
  border: '1px solid #6a1a1a',
  overflow: 'hidden',
};

const portraitContainerStyle: CSSProperties = {
  width: 110,
  minWidth: 110,
  background: '#000',
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'center',
  borderRight: '1px solid #6a1a1a',
  padding: 0,
  overflow: 'hidden',
};

const portraitStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const speechStyle: CSSProperties = {
  flex: 1,
  padding: '10px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  minHeight: 68,
};

const nameStyle: CSSProperties = {
  color: '#ff4444',
  fontFamily: 'monospace',
  fontSize: 11,
  fontWeight: 'bold',
  textShadow: '0 0 6px #ff444433',
};

const tipTitleStyle: CSSProperties = {
  color: '#ffd0d0',
  fontFamily: 'monospace',
  fontSize: 12,
  fontWeight: 'bold',
};

const messageStyle: CSSProperties = {
  color: '#aaaacc',
  fontFamily: 'monospace',
  fontSize: 11,
  lineHeight: '16px',
  flex: 1,
};

const footerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const pageIndicatorStyle: CSSProperties = {
  color: '#8a4a4a',
  fontFamily: 'monospace',
  fontSize: 9,
  opacity: 0.7,
};

const continueStyle: CSSProperties = {
  color: '#6a1a1a',
  fontFamily: 'monospace',
  fontSize: 9,
  textAlign: 'right',
  opacity: 0.7,
};
