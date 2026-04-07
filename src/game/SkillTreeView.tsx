import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { GameState, SkillTreeNode } from './types';
import { getSkillTree, canUnlockNode } from './skillTree';
import { unlockSkillNode, getGeneratedClassInfo } from './engine';
import { cloneState } from './utils';

interface SkillTreeViewProps {
  state: GameState;
  onChange: (s: GameState) => void;
  onClose: () => void;
}

export function SkillTreeView({ state, onChange, onClose }: SkillTreeViewProps) {
  const [activePath, setActivePath] = useState(0);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const tree = getSkillTree(state.playerClass);
  
  // For generated classes, show their unique abilities instead
  if (!tree && state.playerClass === 'generated') {
    const genInfo = getGeneratedClassInfo(state);
    const genClass = (() => {
      try {
        const json = localStorage.getItem('dod_backup_activeGeneratedClass');
        return json ? JSON.parse(json) : null;
      } catch { return null; }
    })();
    
    if (genClass) {
      return (
        <div style={overlayStyle}>
          <div style={{ ...panelStyle, maxWidth: 360 }}>
            <div style={headerStyle}>
              <span style={{ ...titleStyle, color: genClass.color }}>{genClass.name} ABILITIES</span>
              <button style={closeBtnStyle} onClick={onClose}>[X]</button>
            </div>
            
            {/* Class Info */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #2a2a3a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 32, color: genClass.color, textShadow: `0 0 10px ${genClass.color}` }}>{genClass.char}</span>
                <div>
                  <div style={{ color: genClass.color, fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold' }}>{genClass.name}</div>
                  <div style={{ color: '#888', fontFamily: 'monospace', fontSize: 9 }}>{genClass.title}</div>
                </div>
              </div>
              <div style={{ color: '#aaa', fontFamily: 'monospace', fontSize: 9, lineHeight: 1.4 }}>
                {genClass.description}
              </div>
            </div>
            
            {/* Resource */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #2a2a3a', background: '#0a0a10' }}>
              <div style={{ color: genClass.resource.color, fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', marginBottom: 4 }}>
                {genClass.resource.icon} {genClass.resource.name}
              </div>
              <div style={{ color: '#888', fontFamily: 'monospace', fontSize: 9, lineHeight: 1.4 }}>
                {genClass.resource.description}
              </div>
              <div style={{ color: '#666', fontFamily: 'monospace', fontSize: 8, marginTop: 4 }}>
                Max: {genClass.resource.max} | Regen: {genClass.resource.regenMethod.replace('_', ' ')}
              </div>
            </div>
            
            {/* Primary Ability */}
            <div style={{ padding: '10px 16px', background: `${genClass.color}11` }}>
              <div style={{ color: genClass.color, fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', marginBottom: 4 }}>
                {genClass.ability.icon} {genClass.ability.name}
                <span style={{ color: '#888', fontWeight: 'normal', marginLeft: 8 }}>Cost: {genClass.ability.resourceCost}</span>
              </div>
              <div style={{ color: '#aaa', fontFamily: 'monospace', fontSize: 9, lineHeight: 1.4 }}>
                {genClass.ability.description}
              </div>
              {genInfo && (
                <div style={{ marginTop: 8, color: genInfo.resource >= genInfo.abilityCost ? '#44ff88' : '#ff4444', fontFamily: 'monospace', fontSize: 10 }}>
                  {genInfo.resourceIcon} {genInfo.resource}/{genInfo.maxResource}
                  {genInfo.abilityCooldown > 0 && <span style={{ marginLeft: 8 }}>CD: {genInfo.abilityCooldown}</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
  }
  
  if (!tree) {
    return (
      <div style={overlayStyle}>
        <div style={panelStyle}>
          <div style={headerStyle}>
            <span style={{ color: '#aaa', fontFamily: 'monospace', fontSize: 11 }}>
              No skill tree for this class yet.
            </span>
            <button style={closeBtnStyle} onClick={onClose}>[X]</button>
          </div>
        </div>
      </div>
    );
  }

  const path = tree.paths[activePath]!;
  const tiers = [1, 2, 3, 4] as const;

  const handleUnlock = (nodeId: string) => {
    const next = cloneState(state);
    const ok = unlockSkillNode(next, nodeId);
    if (ok) {
      onChange(next);
      setSelectedNode(null);
    }
  };

  const getNodeStatus = (nd: SkillTreeNode): 'unlocked' | 'available' | 'locked' => {
    if (state.unlockedNodes.includes(nd.id)) return 'unlocked';
    const { canUnlock: ok } = canUnlockNode(nd.id, state.playerClass, state.unlockedNodes, state.skillPoints);
    return ok ? 'available' : 'locked';
  };

  const sel = selectedNode
    ? path.nodes.find(n => n.id === selectedNode) ?? null
    : null;
  const selStatus = sel ? getNodeStatus(sel) : null;
  const selCanUnlock = sel
    ? canUnlockNode(sel.id, state.playerClass, state.unlockedNodes, state.skillPoints)
    : null;

  // Count unlocked nodes per path
  const pathCounts = tree.paths.map(p =>
    p.nodes.filter(n => state.unlockedNodes.includes(n.id)).length
  );

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <span style={titleStyle}>SKILL TREE</span>
          <span style={spStyle}>
            SP: {state.skillPoints}
          </span>
          <button style={closeBtnStyle} onClick={onClose}>[X]</button>
        </div>

        {/* Path tabs */}
        <div style={tabRowStyle}>
          {tree.paths.map((p, i) => {
            const active = activePath === i;
            return (
              <button
                key={i}
                style={{
                  ...tabBtnStyle,
                  color: active ? p.color : '#777',
                  borderColor: active ? p.color : '#333',
                  background: active ? '#0c0c18' : '#000',
                  textShadow: active ? `0 0 8px ${p.color}55` : 'none',
                }}
                onClick={() => { setActivePath(i); setSelectedNode(null); }}
              >
                {p.name}
                <span style={{ fontSize: 8, color: active ? '#aaa' : '#555' }}>
                  {' '}{pathCounts[i]}/{p.nodes.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Path description */}
        <div style={pathDescStyle}>{path.description}</div>

        {/* Tree area */}
        <div style={treeAreaStyle}>
          {tiers.map((tier, tIdx) => {
            const tierNodes = path.nodes.filter(n => n.tier === tier);
            const tierLabel = tier === 4 ? '== CAPSTONE ==' : `-- TIER ${tier} --`;
            return (
              <div key={tier}>
                {tIdx > 0 && (
                  <div style={connectorStyle}>|</div>
                )}
                <div style={tierLabelStyle}>{tierLabel}</div>
                <div style={nodeRowStyle}>
                  {tierNodes.map(nd => {
                    const status = getNodeStatus(nd);
                    const isSelected = selectedNode === nd.id;
                    const charIcon = status === 'unlocked' ? '◆'
                      : status === 'available' ? '◇'
                      : '·';
                    return (
                      <button
                        key={nd.id}
                        style={{
                          ...nodeStyle,
                          borderColor: status === 'unlocked' ? nd.color
                            : status === 'available' ? '#33ff66'
                            : '#444',
                          background: isSelected ? '#0a1a0a'
                            : status === 'unlocked' ? '#081008'
                            : '#050508',
                          boxShadow: status === 'unlocked'
                            ? `0 0 6px ${nd.color}33`
                            : isSelected ? '0 0 6px #33ff6622' : 'none',
                        }}
                        onClick={() => setSelectedNode(isSelected ? null : nd.id)}
                      >
                        {/* Node icon */}
                        <span style={{
                          fontSize: 16,
                          color: status === 'unlocked' ? nd.color
                            : status === 'available' ? '#33ff66'
                            : '#666',
                          textShadow: status === 'unlocked' ? `0 0 6px ${nd.color}66` : 'none',
                        }}>
                          {charIcon}
                        </span>

                        {/* Node name */}
                        <span style={{
                          fontSize: 9,
                          color: status === 'unlocked' ? nd.color
                            : status === 'available' ? '#ccccdd'
                            : '#666',
                          textAlign: 'center',
                          lineHeight: 1.2,
                          maxWidth: '100%',
                          overflow: 'hidden',
                        }}>
                          {nd.name}
                        </span>

                        {/* Cost */}
                        {status !== 'unlocked' && (
                          <span style={{
                            fontSize: 8,
                            color: status === 'available' ? '#33cc55' : '#444',
                            position: 'absolute',
                            bottom: 2,
                            right: 4,
                          }}>
                            {nd.cost}sp
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected node detail */}
        {sel && (
          <div style={detailStyle}>
            <div style={detailHeaderStyle}>
              <span style={{
                color: selStatus === 'unlocked' ? sel.color : '#ddd',
                fontWeight: 'bold',
                fontSize: 12,
              }}>
                {selStatus === 'unlocked' ? '◆' : '◇'} {sel.name}
              </span>
              <span style={{ color: '#888', fontSize: 10 }}>
                {sel.cost}sp
              </span>
            </div>
            <div style={detailDescStyle}>
              {sel.description}
            </div>
            {selStatus === 'unlocked' && (
              <div style={{ fontSize: 11, color: '#33ff66', fontWeight: 'bold' }}>
                [ ACTIVE ]
              </div>
            )}
            {selStatus === 'available' && (
              <button style={unlockBtnStyle} onClick={() => handleUnlock(sel.id)}>
                [ UNLOCK ]
              </button>
            )}
            {selStatus === 'locked' && selCanUnlock && (
              <div style={{ fontSize: 10, color: '#ff6644' }}>
                {selCanUnlock.reason}
              </div>
            )}
          </div>
        )}

        {/* Hint when nothing selected */}
        {!sel && (
          <div style={hintStyle}>
            Tap a node to inspect it
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ──

const overlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(0,0,0,0.95)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 50,
  padding: 8,
};

const panelStyle: CSSProperties = {
  width: '100%',
  maxWidth: 380,
  maxHeight: '100%',
  background: '#000',
  border: '1px solid #1a5a2a',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  fontFamily: 'monospace',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '8px 10px',
  borderBottom: '1px solid #1a5a2a',
  gap: 8,
};

const titleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 'bold',
  color: '#33ff66',
  letterSpacing: 2,
  flex: 1,
  textShadow: '0 0 6px #33ff6633',
};

const spStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 'bold',
  color: '#ffcc33',
  textShadow: '0 0 8px #ffcc3355',
};

const closeBtnStyle: CSSProperties = {
  padding: '4px 6px',
  fontSize: 12,
  fontWeight: 'bold',
  background: 'transparent',
  color: '#ff3333',
  border: '1px solid #4a0a0a',
  fontFamily: 'monospace',
  cursor: 'pointer',
};

const tabRowStyle: CSSProperties = {
  display: 'flex',
  gap: 2,
  padding: '6px 6px 0',
};

const tabBtnStyle: CSSProperties = {
  flex: 1,
  padding: '8px 4px',
  fontSize: 11,
  fontWeight: 'bold',
  fontFamily: 'monospace',
  background: '#000',
  border: '1px solid #333',
  borderBottom: 'none',
  cursor: 'pointer',
  textAlign: 'center',
  letterSpacing: 1,
};

const pathDescStyle: CSSProperties = {
  padding: '6px 10px',
  fontSize: 10,
  color: '#8a8aaa',
  fontStyle: 'italic',
  borderBottom: '1px solid #1a5a2a',
};

const treeAreaStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '10px 6px',
};

const connectorStyle: CSSProperties = {
  textAlign: 'center',
  color: '#33ff66',
  fontSize: 14,
  lineHeight: '12px',
  opacity: 0.3,
};

const tierLabelStyle: CSSProperties = {
  fontSize: 9,
  color: '#33ff66',
  letterSpacing: 2,
  textAlign: 'center',
  marginBottom: 6,
  marginTop: 4,
  opacity: 0.6,
};

const nodeRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: 6,
  flexWrap: 'wrap',
  marginBottom: 6,
};

const nodeStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
  width: 76,
  height: 56,
  border: '1px solid #444',
  borderRadius: 0,
  background: '#050508',
  cursor: 'pointer',
  padding: '4px 3px',
  fontFamily: 'monospace',
  touchAction: 'manipulation',
};

const detailStyle: CSSProperties = {
  padding: '10px 12px',
  borderTop: '1px solid #1a5a2a',
  background: '#060a06',
};

const detailHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 4,
};

const detailDescStyle: CSSProperties = {
  fontSize: 11,
  color: '#ccccdd',
  lineHeight: '16px',
  marginBottom: 8,
};

const unlockBtnStyle: CSSProperties = {
  padding: '8px 0',
  fontSize: 12,
  fontFamily: 'monospace',
  fontWeight: 'bold',
  background: '#0a1a0a',
  color: '#33ff66',
  border: '1px solid #33ff66',
  borderRadius: 0,
  cursor: 'pointer',
  touchAction: 'manipulation',
  width: '100%',
  letterSpacing: 2,
  textShadow: '0 0 6px #33ff6644',
};

const hintStyle: CSSProperties = {
  padding: '10px',
  borderTop: '1px solid #1a5a2a',
  fontSize: 10,
  color: '#666',
  textAlign: 'center',
};
