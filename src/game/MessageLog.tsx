import { useRef, useEffect, useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { LogMessage, GameState } from './types';
import { applyDescriptionReplacement } from './perception';

interface MessageLogProps {
  messages: LogMessage[];
  state?: GameState | null;
}

export function MessageLog({ messages, state }: MessageLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const recent = messages.slice(-6);
  
  // Apply perception changes if player has active affliction
  const transformedMessages = useMemo(() => {
    if (!state?.activeAffliction || state.activeAffliction.cured) {
      return recent;
    }
    return recent.map(m => ({
      ...m,
      text: applyDescriptionReplacement(state, m.text)
    }));
  }, [recent, state]);

  return (
    <div ref={scrollRef} style={logStyle}>
      {transformedMessages.map((m, i) => (
        <div key={i} style={{ color: m.color, fontSize: 14, fontFamily: 'monospace', lineHeight: '18px' }}>
          <span style={{ color: '#0a3a0a' }}>{'> '}</span>{m.text}
        </div>
      ))}
    </div>
  );
}

const logStyle: CSSProperties = {
  width: '100%',
  maxHeight: 112,
  overflowY: 'auto',
  padding: '4px 8px',
  background: '#000',
  borderTop: '1px solid #1a5a2a',
};
