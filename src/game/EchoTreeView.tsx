import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { QuestEchoData, EchoTreeNode } from './types';
import { ECHO_TREE_PATHS, canUnlockEchoNode } from './echoTree';

interface EchoTreeViewProps {
  data: QuestEchoData;
  onUnlock: (nodeId: string) => void;
  onClose: () => void;
}

export function EchoTreeView({ data, onUnlock, onClose }: EchoTreeViewProps) {
  const [activePath, setActivePath] = useState(0);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const path = ECHO_TREE_PATHS[activePath]!;
  const tiers = [1, 2, 3, 4, 5] as const;

  const getNodeStatus = (nd: EchoTreeNode): 'unlocked' | 'available' | 'locked' => {
    if (data.unlockedEchoNodes.includes(nd.id)) return 'unlocked';
    const { canUnlock: ok } = canUnlockEchoNode(nd.id, data.unlockedEchoNodes, data.echoes);
    return ok ? 'available' : 'locked';
  };

  // Count unlocked per path
  const pathCounts = ECHO_TREE_PATHS.map(p =>
    p.nodes.filter(n => data.unlockedEchoNodes.includes(n.id)).length
  );

  const sel = selectedNode ? path.nodes.find(n => n.id === selectedNode) ?? null : null;
  const selStatus = sel ? getNodeStatus(sel) : null;
  const selCheck = sel ? canUnlockEchoNode(sel.id, data.unlockedEchoNodes, data.echoes) : null;

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <span style={titleStyle}>ECHO TREE</span>
          <span style={echoBalStyle}>~ {data.echoes}</span>
          <button style={closeBtnStyle} onClick={onClose}>[X]</button>
        </div>

        {/* Path tabs — scrollable row */}
        <div style={tabRowStyle}>
          {ECHO_TREE_PATHS.map((p, i) => {
            const active = activePath === i;
            return (
              <button
                key={p.name}
                style={{
                  ...tabStyle,
                  color: active ? p.color : '#555',
                  borderBottom: active ? `2px solid ${p.color}` : '2px solid transparent',
                  background: active ? '#0a1218' : 'transparent',
                }}
                onClick={() => { setActivePath(i); setSelectedNode(null); }}
              >
                <span style={{ fontSize: 14 }}>{p.icon}</span>
                <span style={{ fontSize: 9 }}>{pathCounts[i]}/{p.nodes.length}</span>
              </button>
            );
          })}
        </div>

        {/* Path description */}
        <div style={pathDescStyle}>
          <span style={{ color: path.color, fontWeight: 'bold', fontSize: 13 }}>
            {path.icon} {path.name}
          </span>
          <span style={{ color: '#777', fontSize: 10, marginLeft: 8 }}>
            {path.description}
          </span>
        </div>

        {/* Node list — full width rows, scrollable */}
        <div style={nodeListStyle}>
          {tiers.map(tier => {
            const tierNodes = path.nodes.filter(n => n.tier === tier);
            if (tierNodes.length === 0) return null;
            return (
              <div key={tier}>
                {/* Tier divider */}
                <div style={tierDividerStyle}>
                  <span style={{ color: '#333' }}>---</span>
                  <span style={{ color: '#555', fontSize: 10 }}>TIER {tier}</span>
                  <span style={{ color: '#333' }}>---</span>
                </div>
                {tierNodes.map(nd => {
                  const status = getNodeStatus(nd);
                  const isSelected = selectedNode === nd.id;
                  const nodeColor = status === 'unlocked' ? nd.color
                    : status === 'available' ? '#55ccff'
                    : '#444';
                  return (
                    <button
                      key={nd.id}
                      style={{
                        ...nodeRowStyle,
                        borderColor: isSelected ? '#55ccff'
                          : status === 'unlocked' ? nd.color + '66'
                          : status === 'available' ? '#1a4a5a'
                          : '#111',
                        background: isSelected ? '#0a1a2a'
                          : status === 'unlocked' ? '#060e14'
                          : '#000',
                      }}
                      onClick={() => setSelectedNode(isSelected ? null : nd.id)}
                    >
                      {/* Left: icon */}
                      <span style={{
                        fontSize: 18,
                        color: nodeColor,
                        width: 28,
                        textAlign: 'center',
                        textShadow: status === 'unlocked' ? `0 0 8px ${nd.color}66` : undefined,
                      }}>
                        {nd.icon}
                      </span>
                      {/* Middle: name + description */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12,
                          fontWeight: 'bold',
                          color: nodeColor,
                        }}>
                          {nd.name}
                        </div>
                        <div style={{
                          fontSize: 10,
                          color: status === 'unlocked' ? '#888' : '#555',
                        }}>
                          {nd.description}
                        </div>
                      </div>
                      {/* Right: cost or status */}
                      <div style={{
                        textAlign: 'right',
                        minWidth: 44,
                      }}>
                        {status === 'unlocked' ? (
                          <span style={{ fontSize: 10, color: '#55ccff', fontWeight: 'bold' }}>ACTIVE</span>
                        ) : (
                          <span style={{ fontSize: 11, color: status === 'available' ? '#55ccff' : '#444', fontWeight: 'bold' }}>
                            ~{nd.cost}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
                {/* Expanded detail for selected node */}
                {sel && tierNodes.some(n => n.id === sel.id) && (
                  <div style={detailStyle}>
                    {selStatus === 'unlocked' && (
                      <div style={{ fontSize: 12, color: '#55ccff', fontWeight: 'bold', textAlign: 'center', padding: '4px 0' }}>
                        [ ACTIVE ]
                      </div>
                    )}
                    {selStatus === 'available' && (
                      <button style={unlockBtnStyle} onClick={() => onUnlock(sel.id)}>
                        [ UNLOCK for ~{sel.cost} Echoes ]
                      </button>
                    )}
                    {selStatus === 'locked' && selCheck && (
                      <div style={{ fontSize: 11, color: '#ff6644', textAlign: 'center', padding: '4px 0' }}>
                        {selCheck.reason}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {/* Bottom padding */}
          <div style={{ height: 20 }} />
        </div>
      </div>
    </div>
  );
}

// ── Styles ──

const overlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(0,0,0,0.75)',
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'center',
  zIndex: 50,
  padding: 0,
};

const panelStyle: CSSProperties = {
  width: '100%',
  maxWidth: 420,
  height: '100%',
  background: '#000',
  borderLeft: '1px solid #1a4a5a',
  borderRight: '1px solid #1a4a5a',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  fontFamily: 'monospace',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 12px',
  borderBottom: '1px solid #1a4a5a',
  gap: 8,
};

const titleStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#55ccff',
  letterSpacing: 2,
  flex: 1,
  textShadow: '0 0 6px #55ccff33',
};

const echoBalStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 'bold',
  color: '#55ccff',
  textShadow: '0 0 8px #55ccff55',
};

const closeBtnStyle: CSSProperties = {
  background: 'none',
  border: '1px solid #333',
  color: '#888',
  fontFamily: 'monospace',
  fontSize: 13,
  padding: '4px 8px',
  cursor: 'pointer',
};

const tabRowStyle: CSSProperties = {
  display: 'flex',
  overflowX: 'auto',
  borderBottom: '1px solid #1a1a2a',
};

const tabStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  fontFamily: 'monospace',
  fontSize: 11,
  padding: '6px 4px',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
  flex: 1,
  minWidth: 0,
};

const pathDescStyle: CSSProperties = {
  padding: '6px 12px',
  borderBottom: '1px solid #0a1a2a',
  display: 'flex',
  alignItems: 'baseline',
  flexWrap: 'wrap',
  gap: 2,
};

const nodeListStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '0 8px',
  WebkitOverflowScrolling: 'touch',
};

const tierDividerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '8px 0 4px',
};

const nodeRowStyle: CSSProperties = {
  width: '100%',
  background: '#000',
  border: '1px solid #111',
  fontFamily: 'monospace',
  padding: '8px 10px',
  marginBottom: 4,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  textAlign: 'left',
};

const detailStyle: CSSProperties = {
  padding: '4px 10px 8px',
  background: '#060e14',
  marginBottom: 4,
  borderLeft: '2px solid #55ccff',
  marginLeft: 8,
};

const unlockBtnStyle: CSSProperties = {
  background: 'none',
  border: '1px solid #55ccff',
  color: '#55ccff',
  fontFamily: 'monospace',
  fontSize: 13,
  fontWeight: 'bold',
  padding: '8px 16px',
  cursor: 'pointer',
  width: '100%',
  textShadow: '0 0 6px #55ccff44',
};
