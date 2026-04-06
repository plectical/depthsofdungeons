import type { CSSProperties } from 'react';
import { useCdnImage } from './useCdnImage';
import { safeSetItem, safeGetItem } from './safeStorage';

interface Props {
  message: string;
  onDone: () => void;
}

/**
 * The Elder — a horizontal dialogue bar with portrait on the left, speech text on the right.
 * Matches the composition: [portrait | message text] with a "Continue" tap area.
 */
export function ElderGuide({ message, onDone }: Props) {
  const guideUrl = useCdnImage('guide.jpg');
  const dismiss = () => {
    onDone();
  };

  return (
    <div style={overlayStyle} onClick={dismiss}>
      <div style={barStyle}>
        {/* Portrait */}
        <div style={portraitContainerStyle}>
          {guideUrl && <img src={guideUrl} alt="The Elder" style={portraitStyle} />}
        </div>
        {/* Speech bubble */}
        <div style={speechStyle}>
          <div style={nameStyle}>The Elder</div>
          <div style={messageStyle}>{message}</div>
          <div style={continueStyle}>{'[ Tap to continue ]'}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Mark an elder tip as seen in storage.
 */
export function markElderTipSeen(key: string) {
  safeSetItem(key, '1');
}

/**
 * Check if an elder tip has been seen. Returns a promise.
 */
export async function hasElderTipBeenSeen(key: string): Promise<boolean> {
  const val = await safeGetItem(key);
  return !!val;
}

// ── Styles ──

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  zIndex: 200,
  padding: '0 8px 24px 8px',
  cursor: 'pointer',
};

const barStyle: CSSProperties = {
  width: '100%',
  maxWidth: 380,
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'stretch',
  background: '#0a0a14',
  border: '1px solid #1a5a2a',
  overflow: 'hidden',
};

const portraitContainerStyle: CSSProperties = {
  width: 110,
  minWidth: 110,
  background: '#000',
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'center',
  borderRight: '1px solid #1a5a2a',
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
  color: '#33ff66',
  fontFamily: 'monospace',
  fontSize: 11,
  fontWeight: 'bold',
  textShadow: '0 0 6px #33ff6633',
};

const messageStyle: CSSProperties = {
  color: '#aaaacc',
  fontFamily: 'monospace',
  fontSize: 11,
  lineHeight: '16px',
  flex: 1,
};

const continueStyle: CSSProperties = {
  color: '#1a5a2a',
  fontFamily: 'monospace',
  fontSize: 9,
  textAlign: 'right',
  opacity: 0.7,
};
