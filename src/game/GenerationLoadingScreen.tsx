import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';

interface GenerationLoadingScreenProps {
  progress: number;
  message: string;
  onReady?: () => void;
}

export function GenerationLoadingScreen({ progress, message, onReady }: GenerationLoadingScreenProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 6 ? '' : prev + '.'));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100 && onReady) {
      const timeout = setTimeout(onReady, 500);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [progress, onReady]);

  const clampedProgress = Math.max(0, Math.min(100, progress));
  const barWidth = 20;
  const filled = Math.floor((clampedProgress / 100) * barWidth);
  const empty = barWidth - filled;

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        {/* Header */}
        <div style={headerStyle}>ENTERING THE DEPTHS</div>
        
        {/* Divider */}
        <div style={dividerStyle}>{'- - - - - - - - - - - -'}</div>

        {/* Message */}
        <div style={messageStyle}>
          {message}{dots}
        </div>

        {/* Progress bar */}
        <div style={progressContainerStyle}>
          <span style={progressBracketStyle}>[</span>
          <span style={progressFilledStyle}>{'#'.repeat(filled)}</span>
          <span style={progressEmptyStyle}>{'-'.repeat(empty)}</span>
          <span style={progressBracketStyle}>]</span>
        </div>

        {/* Percentage */}
        <div style={percentStyle}>{Math.round(clampedProgress)}%</div>

        {/* Tip */}
        <div style={tipStyle}>Your story awaits...</div>
      </div>
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.95)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
  padding: 20,
};

const panelStyle: CSSProperties = {
  width: '100%',
  maxWidth: 300,
  background: '#0a0a0a',
  border: '2px solid #44aa66',
  borderRadius: 4,
  padding: '20px 24px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 12,
  boxShadow: '0 0 20px #44aa6633, inset 0 0 30px #00000088',
};

const headerStyle: CSSProperties = {
  color: '#44ff88',
  fontFamily: 'monospace',
  fontSize: 14,
  fontWeight: 'bold',
  letterSpacing: 2,
  textShadow: '0 0 10px #44ff8866',
  textAlign: 'center',
};

const dividerStyle: CSSProperties = {
  color: '#2a5a3a',
  fontFamily: 'monospace',
  fontSize: 10,
  letterSpacing: 1,
};

const messageStyle: CSSProperties = {
  color: '#88ccaa',
  fontFamily: 'monospace',
  fontSize: 11,
  textAlign: 'center',
  minHeight: 16,
};

const progressContainerStyle: CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 14,
  display: 'flex',
  alignItems: 'center',
};

const progressBracketStyle: CSSProperties = {
  color: '#44aa66',
};

const progressFilledStyle: CSSProperties = {
  color: '#44ff88',
  textShadow: '0 0 6px #44ff8844',
};

const progressEmptyStyle: CSSProperties = {
  color: '#1a3a2a',
};

const percentStyle: CSSProperties = {
  color: '#44aa66',
  fontFamily: 'monospace',
  fontSize: 12,
  fontWeight: 'bold',
};

const tipStyle: CSSProperties = {
  color: '#336644',
  fontFamily: 'monospace',
  fontSize: 10,
  fontStyle: 'italic',
  marginTop: 4,
};
