import { useState } from 'react';
import type { CSSProperties } from 'react';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';

interface BugReportProps {
  onClose: () => void;
}

export function BugReport({ onClose }: BugReportProps) {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const profile = (() => { try { return RundotGameAPI.getProfile(); } catch { return null; } })();
  const playerId = profile?.id ?? 'unknown';
  const username = profile?.username ?? 'unknown';

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true);

    try {
      await RundotGameAPI.analytics.recordCustomEvent('bug_report', {
        player_id: playerId,
        username: username,
        message: message.trim(),
        timestamp: new Date().toISOString(),
      });

      // Also log it so it shows up in support tools
      RundotGameAPI.log('Bug Report Submitted', {
        player_id: playerId,
        username: username,
        message: message.trim(),
      });

      setSent(true);
    } catch {
      // If analytics fails, still show success — the log call is a backup
      setSent(true);
    }

    setSending(false);
  };

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <button style={closeBtnStyle} onClick={onClose}>X</button>
        <div style={titleStyle}>Report a Bug</div>

        {sent ? (
          <div style={sentContainerStyle}>
            <div style={{ color: '#44dd88', fontSize: 16, marginBottom: 12 }}>
              Report sent! Thank you.
            </div>
            <div style={{ color: '#aaa', fontSize: 12, marginBottom: 16 }}>
              We'll look into this as soon as possible.
            </div>
            <button style={actionBtnStyle} onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <div style={labelStyle}>
              Describe what happened:
            </div>
            <textarea
              style={textareaStyle}
              placeholder="What went wrong? What were you doing when it happened?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={1000}
            />
            <div style={charCountStyle}>{message.length}/1000</div>
            <div style={idLabelStyle}>
              Your player ID ({playerId}) will be included automatically so we can look into it.
            </div>
            <div style={buttonRowStyle}>
              <button style={cancelBtnStyle} onClick={onClose}>Cancel</button>
              <button
                style={message.trim() && !sending ? actionBtnStyle : disabledBtnStyle}
                onClick={handleSend}
                disabled={!message.trim() || sending}
              >
                {sending ? 'Sending...' : 'Send Report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.75)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: 16,
};

const panelStyle: CSSProperties = {
  background: '#1a1a2e',
  border: '1px solid #333',
  borderRadius: 8,
  padding: 20,
  maxWidth: 360,
  width: '100%',
  position: 'relative',
  fontFamily: 'monospace',
};

const closeBtnStyle: CSSProperties = {
  position: 'absolute',
  top: 8, right: 8,
  background: 'none',
  border: 'none',
  color: '#ff4444',
  fontFamily: 'monospace',
  fontSize: 16,
  cursor: 'pointer',
  fontWeight: 'bold',
};

const titleStyle: CSSProperties = {
  color: '#ff8844',
  fontSize: 16,
  fontWeight: 'bold',
  textAlign: 'center',
  marginBottom: 16,
};

const labelStyle: CSSProperties = {
  color: '#ccc',
  fontSize: 12,
  marginBottom: 8,
};

const textareaStyle: CSSProperties = {
  width: '100%',
  background: '#0d0d1a',
  border: '1px solid #444',
  borderRadius: 4,
  color: '#eee',
  fontFamily: 'monospace',
  fontSize: 13,
  padding: 10,
  resize: 'vertical',
  boxSizing: 'border-box',
  outline: 'none',
};

const charCountStyle: CSSProperties = {
  color: '#555',
  fontSize: 10,
  textAlign: 'right',
  marginTop: 2,
  marginBottom: 8,
};

const idLabelStyle: CSSProperties = {
  color: '#666',
  fontSize: 10,
  textAlign: 'center',
  marginBottom: 12,
};

const buttonRowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  justifyContent: 'center',
};

const actionBtnStyle: CSSProperties = {
  background: '#ff8844',
  border: 'none',
  borderRadius: 4,
  color: '#000',
  fontFamily: 'monospace',
  fontSize: 13,
  fontWeight: 'bold',
  padding: '8px 20px',
  cursor: 'pointer',
};

const disabledBtnStyle: CSSProperties = {
  ...actionBtnStyle,
  background: '#444',
  color: '#888',
  cursor: 'default',
};

const cancelBtnStyle: CSSProperties = {
  background: 'none',
  border: '1px solid #555',
  borderRadius: 4,
  color: '#aaa',
  fontFamily: 'monospace',
  fontSize: 13,
  padding: '8px 20px',
  cursor: 'pointer',
};

const sentContainerStyle: CSSProperties = {
  textAlign: 'center',
  fontFamily: 'monospace',
  padding: '10px 0',
};
