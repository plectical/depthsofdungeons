import { useState, useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { BloodlineData } from './types';
import type { QuestEchoData } from './types';
import type { LoreEntry, LoreCategory, LoreContext } from './lore';
import { ALL_LORE, getUnlockedLore, getLoreByCategory, CATEGORY_META } from './lore';

interface JournalProps {
  bloodline: BloodlineData;
  questEchoData: QuestEchoData;
  seenIds: string[];
  onMarkSeen: (ids: string[]) => void;
  onClose: () => void;
}

const CATEGORY_ORDER: LoreCategory[] = ['origins', 'zones', 'bosses', 'creatures', 'ancestors', 'artifacts', 'factions'];

export function Journal({ bloodline, questEchoData, seenIds, onMarkSeen, onClose }: JournalProps) {
  const [selectedCategory, setSelectedCategory] = useState<LoreCategory>('origins');
  const [selectedEntry, setSelectedEntry] = useState<LoreEntry | null>(null);

  const ctx: LoreContext = useMemo(() => ({ bloodline, questEchoData }), [bloodline, questEchoData]);

  const unlockedEntries = useMemo(() => getUnlockedLore(ctx), [ctx]);
  const byCategory = useMemo(() => getLoreByCategory(unlockedEntries), [unlockedEntries]);

  const totalUnlocked = unlockedEntries.length;
  const totalEntries = ALL_LORE.length;

  // Count new (unseen) entries
  const unseenSet = useMemo(() => {
    const s = new Set<string>();
    for (const e of unlockedEntries) {
      if (!seenIds.includes(e.id)) s.add(e.id);
    }
    return s;
  }, [unlockedEntries, seenIds]);

  const handleSelectEntry = (entry: LoreEntry) => {
    setSelectedEntry(entry);
    // Mark as seen if not already
    if (!seenIds.includes(entry.id)) {
      onMarkSeen([...seenIds, entry.id]);
    }
  };

  // ── Entry detail view ──
  if (selectedEntry) {
    return (
      <div style={overlayStyle}>
        <div style={containerStyle}>
          <div style={headerStyle}>
            <button style={backBtnStyle} onClick={() => setSelectedEntry(null)}>{'< Back'}</button>
            <span style={{ color: selectedEntry.color, fontWeight: 'bold', fontSize: 16 }}>
              {selectedEntry.icon} {selectedEntry.title}
            </span>
          </div>
          <div style={entryDetailStyle}>
            <div style={{ color: '#8888aa', fontSize: 12, marginBottom: 8, fontStyle: 'italic' }}>
              {selectedEntry.subtitle}
            </div>
            {selectedEntry.text.split('\n').map((paragraph, i) => (
              <p key={i} style={paragraphStyle}>
                {paragraph}
              </p>
            ))}
          </div>
          <div style={footerStyle}>
            <span style={{ color: '#444466', fontSize: 11 }}>
              {CATEGORY_META[selectedEntry.category].name}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── Category list view ──
  const categoryEntries = byCategory[selectedCategory] ?? [];

  return (
    <div style={overlayStyle}>
      <div style={containerStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <button style={closeBtnStyle} onClick={onClose}>{'[ X ]'}</button>
          <span style={{ color: '#33ff66', fontWeight: 'bold', fontSize: 16 }}>
            {'Journal'}
          </span>
          <span style={{ color: '#555577', fontSize: 12 }}>
            {totalUnlocked}/{totalEntries}
          </span>
        </div>

        {/* Category tabs */}
        <div style={tabRowStyle}>
          {CATEGORY_ORDER.map(cat => {
            const meta = CATEGORY_META[cat];
            const count = byCategory[cat]?.length ?? 0;
            const newCount = byCategory[cat]?.filter(e => unseenSet.has(e.id)).length ?? 0;
            const isActive = cat === selectedCategory;
            return (
              <button
                key={cat}
                style={{
                  ...tabBtnStyle,
                  color: isActive ? meta.color : '#555577',
                  borderBottom: isActive ? `2px solid ${meta.color}` : '2px solid transparent',
                  opacity: count === 0 ? 0.3 : 1,
                }}
                onClick={() => count > 0 && setSelectedCategory(cat)}
              >
                <span>{meta.icon}</span>
                {newCount > 0 && <span style={newBadgeStyle}>{newCount}</span>}
              </button>
            );
          })}
        </div>

        {/* Category name */}
        <div style={{ padding: '4px 12px', color: CATEGORY_META[selectedCategory].color, fontSize: 13, fontWeight: 'bold' }}>
          {CATEGORY_META[selectedCategory].name}
        </div>

        {/* Entry list */}
        <div style={entryListStyle}>
          {categoryEntries.length === 0 && (
            <div style={{ color: '#444466', padding: 16, textAlign: 'center', fontSize: 13 }}>
              No entries unlocked yet. Keep exploring!
            </div>
          )}
          {categoryEntries.map(entry => {
            const isNew = unseenSet.has(entry.id);
            return (
              <button
                key={entry.id}
                style={entryRowStyle}
                onClick={() => handleSelectEntry(entry)}
              >
                <span style={{ color: entry.color, fontSize: 16, width: 20, textAlign: 'center' }}>
                  {entry.icon}
                </span>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ color: isNew ? '#ffffff' : '#aaaacc', fontSize: 13, fontWeight: isNew ? 'bold' : 'normal' }}>
                    {entry.title}
                    {isNew && <span style={{ ...newLabelStyle, color: '#55ccff' }}> NEW</span>}
                  </div>
                  <div style={{ color: '#555577', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.subtitle}
                  </div>
                </div>
                <span style={{ color: '#333355', fontSize: 14 }}>{'>'}</span>
              </button>
            );
          })}

          {/* Locked entries hint */}
          {(() => {
            const lockedInCat = ALL_LORE.filter(e => e.category === selectedCategory && !unlockedEntries.includes(e)).length;
            if (lockedInCat === 0) return null;
            return (
              <div style={{ color: '#333355', padding: '8px 12px', fontSize: 11, textAlign: 'center', fontStyle: 'italic' }}>
                {lockedInCat} more {lockedInCat === 1 ? 'entry' : 'entries'} to discover...
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════

const overlayStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'rgba(0,0,0,0.75)',
  zIndex: 1000,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontFamily: 'monospace',
};

const containerStyle: CSSProperties = {
  width: '100%',
  maxWidth: 420,
  height: '100%',
  maxHeight: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  background: '#0a0a16',
  border: '1px solid #1a5a2a',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  borderBottom: '1px solid #1a3a1a',
  flexShrink: 0,
};

const closeBtnStyle: CSSProperties = {
  background: 'none',
  border: '1px solid #333355',
  color: '#ff5566',
  fontFamily: 'monospace',
  fontSize: 12,
  padding: '2px 8px',
  cursor: 'pointer',
};

const backBtnStyle: CSSProperties = {
  background: 'none',
  border: '1px solid #333355',
  color: '#44bbff',
  fontFamily: 'monospace',
  fontSize: 12,
  padding: '2px 8px',
  cursor: 'pointer',
};

const tabRowStyle: CSSProperties = {
  display: 'flex',
  gap: 0,
  borderBottom: '1px solid #1a2a1a',
  overflowX: 'auto',
  flexShrink: 0,
};

const tabBtnStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  fontFamily: 'monospace',
  fontSize: 16,
  padding: '6px 10px',
  cursor: 'pointer',
  position: 'relative',
  whiteSpace: 'nowrap',
  display: 'flex',
  alignItems: 'center',
  gap: 2,
};

const newBadgeStyle: CSSProperties = {
  fontSize: 9,
  color: '#55ccff',
  fontWeight: 'bold',
  position: 'absolute',
  top: 2,
  right: 2,
};

const entryListStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
};

const entryRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '8px 12px',
  background: 'none',
  border: 'none',
  borderBottom: '1px solid #111122',
  fontFamily: 'monospace',
  cursor: 'pointer',
  textAlign: 'left',
};

const newLabelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 'bold',
};

const entryDetailStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '8px 16px',
};

const paragraphStyle: CSSProperties = {
  color: '#aaaacc',
  fontSize: 13,
  lineHeight: '1.6',
  margin: '0 0 12px 0',
};

const footerStyle: CSSProperties = {
  padding: '6px 12px',
  borderTop: '1px solid #1a2a1a',
  textAlign: 'center',
  flexShrink: 0,
};
