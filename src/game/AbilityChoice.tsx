import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import type { GameState, AbilityChoice as AbilityChoiceType } from './types';
import { chooseAbility } from './engine';
import { safeEngineCall } from './errorReporting';
import { ElderGuide, hasElderTipBeenSeen, markElderTipSeen } from './ElderGuide';
import { ELDER_LEVELUP } from './elderTips';
import { cloneState } from './utils';

interface AbilityChoiceProps {
  state: GameState;
  choice: AbilityChoiceType;
  onChange: (next: GameState) => void;
}

/** Map emoji icons to ASCII chars for the roguelike aesthetic */
function asciiIcon(icon: string): string {
  const map: Record<string, string> = {
    '\u{1F6E1}': '[', // shield
    '\u{1F4E3}': '!', // megaphone
    '\u{1F4A5}': '*', // explosion
    '\u{2694}': '/', // swords
    '\u{21A9}': '<', // counter
    '\u{1F608}': '~', // intimidate
    '\u{2665}': '+', // heart
    '\u{1FA93}': ')', // axe
    '\u{1F4A8}': '>', // dash
    '\u{2620}': '%', // skull
    '\u{1F463}': '.', // footprints
    '\u{1F3AF}': 'x', // target
    '\u{1F4B0}': '$', // money
    '\u{1FA78}': '=', // blood
    '\u{1F32B}': '?', // fog
    '\u{1F52A}': '/', // knife
    '\u{1F525}': '*', // fire
    '\u{2744}': '#', // snowflake
    '\u{2728}': '*', // sparkle
    '\u{1F9DB}': '&', // vampire
    '\u{26A1}': '!', // lightning
    '\u{1F9E0}': '@', // brain
    '\u{1F4AB}': '*', // dizzy
    '\u{1F7E3}': 'o', // purple circle
    '\u{1F3F9}': '}', // bow
    '\u{1F33F}': '%', // herb
    '\u{1F3C3}': '>', // runner
    '\u{1F441}': 'o', // eye
    '\u{1F33E}': '"', // sheaf
    '\u{2600}': '*', // sun
    '\u{1F91A}': '+', // hand
    '\u{1F31F}': '*', // star
    '\u{271D}': '+', // cross
    '\u{1F451}': '^', // crown
  };
  return map[icon] ?? icon.charAt(0);
}

export function AbilityChoice({ state, choice, onChange }: AbilityChoiceProps) {
  const [showElderTip, setShowElderTip] = useState(false);

  useEffect(() => {
    hasElderTipBeenSeen(ELDER_LEVELUP.key).then((seen) => {
      if (!seen) {
        setShowElderTip(true);
        markElderTipSeen(ELDER_LEVELUP.key);
      }
    });
  }, []);

  const handlePick = (abilityId: string) => {
    const next = cloneState(state);
    const result = safeEngineCall('chooseAbility', () => { chooseAbility(next, abilityId); return true; });
    if (result === null) return;
    onChange(next);
  };

  const w = 36; // inner char width

  return (
    <div style={overlayStyle}>
      {showElderTip && (
        <ElderGuide message={ELDER_LEVELUP.message} onDone={() => setShowElderTip(false)} />
      )}
      <div style={panelStyle}>
        {/* Top border */}
        <pre style={borderLine}>{`+${'='.repeat(w)}+`}</pre>

        {/* Header */}
        <pre style={headerLine}>{centerText(`LEVEL ${choice.level}!`, w)}</pre>
        <pre style={subLine}>{centerText('Choose a new ability', w)}</pre>
        <pre style={borderLine}>{`+${'─'.repeat(w)}+`}</pre>

        {/* Ability options */}
        <div style={optionsContainerStyle}>
          {choice.options.map((ability) => (
            <button
              key={ability.id}
              style={optionBtnStyle}
              onClick={() => handlePick(ability.id)}
            >
              <pre style={optionBorderTop}>{`┌${'─'.repeat(w - 2)}┐`}</pre>
              <pre style={optionLine}>
                <span style={{ color: ability.color }}>{` ${asciiIcon(ability.icon)} `}</span>
                <span style={{ color: ability.color, fontWeight: 'bold', textShadow: `0 0 4px ${ability.color}44` }}>
                  {ability.name}
                </span>
              </pre>
              <pre style={optionDescLine}>
                <span style={{ color: '#667766' }}>{`   `}</span>
                <span style={{ color: '#88aa88' }}>{ability.description}</span>
              </pre>
              <pre style={optionBorderBottom}>{`└${'─'.repeat(w - 2)}┘`}</pre>
            </button>
          ))}
        </div>

        {/* Bottom border */}
        <pre style={borderLine}>{`+${'='.repeat(w)}+`}</pre>
      </div>
    </div>
  );
}

function centerText(text: string, width: number): string {
  const pad = Math.max(0, Math.floor((width - text.length) / 2));
  const rightPad = Math.max(0, width - pad - text.length);
  return `|${' '.repeat(pad)}${text}${' '.repeat(rightPad)}|`;
}

const overlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(0,0,0,0.95)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 60,
  padding: 12,
};

const panelStyle: CSSProperties = {
  width: '100%',
  maxWidth: 340,
  background: '#000',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const borderLine: CSSProperties = {
  color: '#ffcc33',
  fontFamily: 'monospace',
  fontSize: 12,
  margin: 0,
  padding: '0 4px',
  lineHeight: '16px',
  textShadow: '0 0 4px #ffcc3322',
};

const headerLine: CSSProperties = {
  color: '#ffcc33',
  fontFamily: 'monospace',
  fontSize: 14,
  fontWeight: 'bold',
  margin: 0,
  padding: '4px 4px 0',
  lineHeight: '18px',
  letterSpacing: 2,
  textShadow: '0 0 8px #ffcc3333',
};

const subLine: CSSProperties = {
  color: '#886622',
  fontFamily: 'monospace',
  fontSize: 11,
  margin: 0,
  padding: '2px 4px 4px',
  lineHeight: '14px',
};

const optionsContainerStyle: CSSProperties = {
  padding: '4px 4px',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const optionBtnStyle: CSSProperties = {
  padding: 0,
  background: 'transparent',
  border: 'none',
  fontFamily: 'monospace',
  cursor: 'pointer',
  textAlign: 'left',
  display: 'block',
};

const optionBorderTop: CSSProperties = {
  color: '#3a3a1a',
  fontFamily: 'monospace',
  fontSize: 11,
  margin: 0,
  padding: '0 8px',
  lineHeight: '14px',
};

const optionLine: CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 12,
  margin: 0,
  padding: '0 8px',
  lineHeight: '16px',
};

const optionDescLine: CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 10,
  margin: 0,
  padding: '0 8px',
  lineHeight: '14px',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
};

const optionBorderBottom: CSSProperties = {
  color: '#3a3a1a',
  fontFamily: 'monospace',
  fontSize: 11,
  margin: 0,
  padding: '0 8px',
  lineHeight: '14px',
};
