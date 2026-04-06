import type { CSSProperties } from 'react';
import type { BloodlineData } from './types';

interface RunHistoryProps {
  bloodline: BloodlineData;
  onClose: () => void;
}

export function RunHistory({ bloodline, onClose }: RunHistoryProps) {
  const runs = bloodline.runHistory ?? [];
  const c = bloodline.cumulative;

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <div style={headerStyle}>
          <span style={titleStyle}>~ RUN HISTORY ~</span>
          <span style={countStyle}>{runs.length} runs</span>
          <button style={closeBtnStyle} onClick={onClose}>[X]</button>
        </div>

        {/* Lifetime stats summary */}
        <div style={summaryStyle}>
          <div style={summaryRowStyle}>
            <span>Best Floor</span><span style={{ color: '#33ff66' }}>{c.highestFloor}</span>
          </div>
          <div style={summaryRowStyle}>
            <span>Best Score</span><span style={{ color: '#ffd700' }}>{c.highestScore}</span>
          </div>
          <div style={summaryRowStyle}>
            <span>Total Deaths</span><span>{c.totalDeaths}</span>
          </div>
          <div style={summaryRowStyle}>
            <span>Total Kills</span><span>{c.totalKills}</span>
          </div>
          <div style={summaryRowStyle}>
            <span>Total Floors</span><span>{c.totalFloors}</span>
          </div>
        </div>

        <div style={contentStyle}>
          {runs.length === 0 ? (
            <div style={emptyStyle}>No runs yet. Your history will appear here after your first death.</div>
          ) : (
            [...runs].reverse().map((run, i) => {
              const classLabel = run.class.charAt(0).toUpperCase() + run.class.slice(1);
              const zoneLabel = run.zone?.replace(/_/g, ' ') ?? 'stone depths';
              return (
                <div key={i} style={runRowStyle}>
                  <div style={runHeaderStyle}>
                    <span style={runClassStyle}>
                      #{runs.length - i} {classLabel}
                    </span>
                    <span style={runZoneStyle}>{zoneLabel}</span>
                  </div>
                  <div style={runStatsStyle}>
                    <span>Floor {run.floorReached}</span>
                    <span>Lv{run.level}</span>
                    <span style={{ color: '#ffd700' }}>{run.score}g</span>
                    <span>{run.kills} kills</span>
                  </div>
                  <div style={runDeathStyle}>
                    {run.causeOfDeath} | {run.turns} turns
                    {run.bossesKilled > 0 && <span style={{ color: '#ff3333' }}> | {run.bossesKilled} boss{run.bossesKilled > 1 ? 'es' : ''}</span>}
                  </div>
                </div>
              );
            })
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
  width: '100%', maxWidth: 380, maxHeight: '90%', background: '#000',
  border: '1px solid #1a5a2a', display: 'flex', flexDirection: 'column', overflow: 'hidden',
};
const headerStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', padding: '8px 10px', borderBottom: '1px solid #0a3a0a', gap: 8,
};
const titleStyle: CSSProperties = {
  color: '#33ff66', fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold', flex: 1, textShadow: '0 0 8px #33ff6633',
};
const countStyle: CSSProperties = {
  color: '#1a8a3a', fontFamily: 'monospace', fontSize: 11, opacity: 0.7,
};
const closeBtnStyle: CSSProperties = {
  padding: '4px 6px', fontSize: 12, fontWeight: 'bold', background: 'transparent',
  color: '#ff3333', border: '1px solid #4a0a0a', fontFamily: 'monospace', cursor: 'pointer',
};
const summaryStyle: CSSProperties = {
  padding: '8px 10px', borderBottom: '1px solid #0a3a0a', background: '#040a04',
};
const summaryRowStyle: CSSProperties = {
  display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace',
  fontSize: 10, color: '#8a8aaa', lineHeight: '16px',
};
const contentStyle: CSSProperties = { flex: 1, overflowY: 'auto', padding: 4 };
const emptyStyle: CSSProperties = {
  color: '#1a3a1a', textAlign: 'center', padding: 20, fontFamily: 'monospace', fontSize: 11,
};
const runRowStyle: CSSProperties = {
  padding: '8px 6px', borderBottom: '1px solid #0a1a0a', fontFamily: 'monospace',
};
const runHeaderStyle: CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
};
const runClassStyle: CSSProperties = {
  color: '#33ff66', fontSize: 12, fontWeight: 'bold',
};
const runZoneStyle: CSSProperties = {
  color: '#8a7aaa', fontSize: 9, textTransform: 'capitalize',
};
const runStatsStyle: CSSProperties = {
  display: 'flex', gap: 10, color: '#aaaacc', fontSize: 10, marginTop: 2,
};
const runDeathStyle: CSSProperties = {
  color: '#5a4a6a', fontSize: 9, marginTop: 2,
};
