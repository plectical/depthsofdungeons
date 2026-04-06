import type { CSSProperties } from 'react';
import { useCallback, useRef } from 'react';

interface DPadProps {
  onMove: (dx: number, dy: number) => void;
}

/** [dx, dy, label, gridColumn, gridRow] */
const DIRS: Array<[number, number, string, number, number]> = [
  [0, -1, '^', 2, 1],
  [-1, 0, '<', 1, 2],
  [1, 0, '>', 3, 2],
  [0, 1, 'v', 2, 3],
];

export function DPad({ onMove }: DPadProps) {
  const repeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRepeat = useCallback(() => {
    if (repeatRef.current !== null) {
      clearInterval(repeatRef.current);
      repeatRef.current = null;
    }
  }, []);

  const startPress = useCallback(
    (dx: number, dy: number) => {
      onMove(dx, dy);
      stopRepeat();
      repeatRef.current = setInterval(() => onMove(dx, dy), 150);
    },
    [onMove, stopRepeat],
  );

  return (
    <div style={padContainerStyle}>
      <div style={gridStyle}>
        {DIRS.map(([dx, dy, label, col, row]) => (
          <button
            key={label}
            style={{ ...dirBtnStyle, gridColumn: col, gridRow: row }}
            onTouchStart={(e) => {
              e.preventDefault();
              startPress(dx, dy);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              stopRepeat();
            }}
            onTouchCancel={stopRepeat}
            onMouseDown={() => startPress(dx, dy)}
            onMouseUp={stopRepeat}
            onMouseLeave={stopRepeat}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

const padContainerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '4px 0',
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 50px)',
  gridTemplateRows: 'repeat(3, 50px)',
  gap: 3,
};

const dirBtnStyle: CSSProperties = {
  width: 50,
  height: 50,
  fontSize: 24,
  fontFamily: 'monospace',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#000',
  color: '#33ff66',
  border: '1px solid #1a5a2a',
  borderRadius: 0,
  cursor: 'pointer',
  touchAction: 'none',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  padding: 0,
  textShadow: '0 0 6px #33ff6644',
};
