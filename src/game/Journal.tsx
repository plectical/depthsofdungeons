import { useState, type CSSProperties } from 'react';
import type { BloodlineData, QuestEchoData } from './types';
import { getUnlockedLore, type LoreEntry, type LoreCategory, type LoreContext } from './lore';

interface JournalProps {
  bloodline: BloodlineData;
  questEchoData: QuestEchoData;
  seenIds: string[];
  onMarkSeen: (ids: string[]) => void;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<LoreCategory, string> = {
  origins: 'Origins',
  zones: 'Zones',
  bosses: 'Bosses',
  creatures: 'Creatures',
  ancestors: 'Bloodline',
  artifacts: 'Artifacts',
  factions: 'Factions',
};

const CATEGORY_ORDER: LoreCategory[] = [
  'origins',
  'zones',
  'bosses',
  'creatures',
  'ancestors',
  'artifacts',
  'factions',
];

export function Journal({ bloodline, questEchoData, seenIds, onMarkSeen, onClose }: JournalProps) {
  const [selectedEntry, setSelectedEntry] = useState<LoreEntry | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<LoreCategory | null>('origins');
  
  const ctx: LoreContext = { bloodline, questEchoData };
  const unlockedLore = getUnlockedLore(ctx);
  
  const entriesByCategory = CATEGORY_ORDER.reduce((acc, cat) => {
    acc[cat] = unlockedLore.filter(e => e.category === cat).sort((a, b) => a.order - b.order);
    return acc;
  }, {} as Record<LoreCategory, LoreEntry[]>);
  
  const handleSelectEntry = (entry: LoreEntry) => {
    setSelectedEntry(entry);
    if (!seenIds.includes(entry.id)) {
      onMarkSeen([...seenIds, entry.id]);
    }
  };
  
  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <div style={headerStyle}>
          <span style={titleStyle}>Journal</span>
          <button style={closeBtnStyle} onClick={onClose}>X</button>
        </div>
        
        <div style={contentStyle}>
          {selectedEntry ? (
            <div style={entryDetailStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18, color: selectedEntry.color }}>{selectedEntry.icon}</span>
                <span style={{ color: selectedEntry.color, fontWeight: 'bold', fontSize: 14 }}>{selectedEntry.title}</span>
              </div>
              <div style={{ color: '#888', fontSize: 10, marginBottom: 12, fontStyle: 'italic' }}>
                {selectedEntry.subtitle}
              </div>
              <div style={{ color: '#aaa', fontSize: 11, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {selectedEntry.text}
              </div>
              <button 
                style={{ ...backBtnStyle, marginTop: 16 }} 
                onClick={() => setSelectedEntry(null)}
              >
                Back
              </button>
            </div>
          ) : (
            <div style={listStyle}>
              {CATEGORY_ORDER.map(cat => {
                const entries = entriesByCategory[cat];
                if (entries.length === 0) return null;
                const isExpanded = expandedCategory === cat;
                
                return (
                  <div key={cat} style={{ marginBottom: 8 }}>
                    <div 
                      style={categoryHeaderStyle} 
                      onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                    >
                      <span>{isExpanded ? '▾' : '▸'} {CATEGORY_LABELS[cat]}</span>
                      <span style={{ color: '#555', fontSize: 10 }}>{entries.length}</span>
                    </div>
                    {isExpanded && entries.map(entry => {
                      const isNew = !seenIds.includes(entry.id);
                      return (
                        <div 
                          key={entry.id}
                          style={entryRowStyle}
                          onClick={() => handleSelectEntry(entry)}
                        >
                          <span style={{ color: entry.color, marginRight: 8 }}>{entry.icon}</span>
                          <span style={{ flex: 1, color: isNew ? '#fff' : '#888' }}>{entry.title}</span>
                          {isNew && <span style={newBadgeStyle}>NEW</span>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
  zIndex: 50,
  padding: 12,
};

const panelStyle: CSSProperties = {
  width: '100%',
  maxWidth: 400,
  maxHeight: '90%',
  background: '#000',
  border: '1px solid #1a5a2a',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 12px',
  borderBottom: '1px solid #0a3a0a',
};

const titleStyle: CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 14,
  fontWeight: 'bold',
  color: '#33ff66',
};

const closeBtnStyle: CSSProperties = {
  padding: '4px 8px',
  fontSize: 12,
  fontWeight: 'bold',
  background: 'transparent',
  color: '#ff3333',
  border: '1px solid #4a0a0a',
  fontFamily: 'monospace',
  cursor: 'pointer',
};

const contentStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: 12,
};

const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const categoryHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 8px',
  background: '#0a0a0a',
  border: '1px solid #1a3a1a',
  cursor: 'pointer',
  fontFamily: 'monospace',
  fontSize: 11,
  color: '#33ff66',
  marginBottom: 4,
};

const entryRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '6px 8px',
  marginLeft: 12,
  borderLeft: '2px solid #1a3a1a',
  cursor: 'pointer',
  fontFamily: 'monospace',
  fontSize: 10,
  marginBottom: 2,
};

const entryDetailStyle: CSSProperties = {
  fontFamily: 'monospace',
};

const backBtnStyle: CSSProperties = {
  padding: '6px 12px',
  background: 'transparent',
  border: '1px solid #1a5a2a',
  color: '#33ff66',
  fontFamily: 'monospace',
  fontSize: 11,
  cursor: 'pointer',
};

const newBadgeStyle: CSSProperties = {
  background: '#ff3333',
  color: '#fff',
  padding: '1px 4px',
  fontSize: 8,
  fontWeight: 'bold',
  borderRadius: 2,
};
