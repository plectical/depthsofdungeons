import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { safeGetProfile } from './safeStorage';

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  metadata?: Record<string, unknown>;
}

interface LeaderboardProps {
  onClose: () => void;
}

export function Leaderboard({ onClose }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const podium = await RundotGameAPI.leaderboard.getPodiumScores({
          topCount: 10,
          contextAhead: 2,
          contextBehind: 2,
        });

        const seen = new Set<number>();
        const all: LeaderboardEntry[] = [];

        const addEntry = (e: { rank: number | null; username: string; score: number }) => {
          const r = e.rank ?? 0;
          if (seen.has(r)) return;
          seen.add(r);
          all.push({ rank: r, username: e.username ?? '???', score: e.score });
        };

        // Top entries from context
        if (podium.context?.topEntries) {
          for (const e of podium.context.topEntries) addEntry(e);
        }

        // Entries around the current player
        if (podium.context?.beforePlayer) {
          for (const e of podium.context.beforePlayer) addEntry(e);
        }
        if (podium.context?.playerEntry) {
          addEntry(podium.context.playerEntry);
        }
        if (podium.context?.afterPlayer) {
          for (const e of podium.context.afterPlayer) addEntry(e);
        }

        // Fallback: use entries from parent response
        if (all.length === 0 && podium.entries) {
          for (const e of podium.entries) addEntry(e);
        }

        all.sort((a, b) => a.rank - b.rank);
        setEntries(all);

        try {
          const rank = await RundotGameAPI.leaderboard.getMyRank();
          if (rank?.rank) setMyRank(rank.rank);
        } catch {
          // No rank yet
        }
      } catch {
        // Leaderboard unavailable
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const profile = safeGetProfile();
  const myUsername = profile?.username ?? '';

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <pre style={borderStyle}>{'+=== LEADERBOARD ========================+'}</pre>
        <div style={headerStyle}>
          <span style={titleStyle}>Top Adventurers</span>
          <button style={closeBtnStyle} onClick={onClose}>[X]</button>
        </div>

        <div style={listStyle}>
          {loading && <div style={emptyStyle}>Loading...</div>}
          {!loading && entries.length === 0 && (
            <div style={emptyStyle}>{'-- No scores yet --'}</div>
          )}
          {!loading && entries.map((e, i) => {
            const isMe = e.username === myUsername;
            const prevRank = i > 0 ? entries[i - 1]?.rank : undefined;
            const showGap = prevRank !== undefined && e.rank > prevRank + 1;

            return (
              <div key={e.rank}>
                {showGap && <div style={gapStyle}>{'  ···'}</div>}
                <div style={isMe ? rowMeStyle : rowStyle}>
                  <span style={rankStyle}>
                    {e.rank === 1 ? '#1' : e.rank === 2 ? '#2' : e.rank === 3 ? '#3' : `#${e.rank}`}
                  </span>
                  <span style={isMe ? nameMeStyle : nameStyle}>
                    {e.username}
                    {isMe ? ' (you)' : ''}
                  </span>
                  <span style={scoreStyle}>{e.score}</span>
                </div>
              </div>
            );
          })}
        </div>

        {myRank !== null && (
          <div style={myRankStyle}>Your rank: #{myRank}</div>
        )}

        <pre style={{ ...borderStyle, padding: '0 8px 4px' }}>{'+=== ====================================+'}</pre>
      </div>
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(0,0,0,0.75)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 50,
  padding: 12,
};

const panelStyle: CSSProperties = {
  width: '100%',
  maxWidth: 380,
  maxHeight: '85%',
  background: '#000',
  border: '1px solid #1a5a2a',
  borderRadius: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const borderStyle: CSSProperties = {
  color: '#1a8a3a',
  fontSize: 11,
  margin: 0,
  padding: '4px 8px 0',
  fontFamily: 'monospace',
  textShadow: '0 0 4px #33ff6622',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 10px',
  borderBottom: '1px solid #0a3a0a',
};

const titleStyle: CSSProperties = {
  color: '#33ff66',
  fontFamily: 'monospace',
  fontSize: 14,
  fontWeight: 'bold',
  letterSpacing: 2,
  textShadow: '0 0 6px #33ff6644',
};

const closeBtnStyle: CSSProperties = {
  padding: '4px 6px',
  fontSize: 12,
  fontWeight: 'bold',
  background: 'transparent',
  color: '#ff3333',
  border: '1px solid #4a0a0a',
  borderRadius: 0,
  fontFamily: 'monospace',
  cursor: 'pointer',
};

const listStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '6px 10px',
};

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '4px 0',
  borderBottom: '1px solid #0a1a0a',
  fontFamily: 'monospace',
  fontSize: 12,
  gap: 8,
};

const rowMeStyle: CSSProperties = {
  ...rowStyle,
  background: '#0a1a0a',
  borderBottom: '1px solid #1a5a2a',
  padding: '4px 4px',
};

const rankStyle: CSSProperties = {
  color: '#1a8a3a',
  minWidth: 32,
  textAlign: 'right',
  fontSize: 11,
};

const nameStyle: CSSProperties = {
  color: '#33ff66',
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const nameMeStyle: CSSProperties = {
  ...nameStyle,
  color: '#66ffaa',
  fontWeight: 'bold',
};

const scoreStyle: CSSProperties = {
  color: '#ccaa22',
  minWidth: 50,
  textAlign: 'right',
  fontWeight: 'bold',
};

const gapStyle: CSSProperties = {
  color: '#0a3a0a',
  fontFamily: 'monospace',
  fontSize: 11,
  padding: '2px 0',
};

const myRankStyle: CSSProperties = {
  color: '#66ffaa',
  fontFamily: 'monospace',
  fontSize: 12,
  textAlign: 'center',
  padding: '6px 0',
  borderTop: '1px solid #0a3a0a',
  textShadow: '0 0 4px #66ffaa33',
};

const emptyStyle: CSSProperties = {
  color: '#0a3a0a',
  textAlign: 'center',
  padding: 20,
  fontFamily: 'monospace',
  fontSize: 12,
};
