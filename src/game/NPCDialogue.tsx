import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import type { GameState, BloodlineData, DialogueChoice } from './types';
import { getNPCDef, getNPCDialogue } from './npcs';
import { applyDialogueEffects } from './engine';
import { safeEngineCall } from './errorReporting';
import { cloneState } from './utils';
import { generateNPCPortrait } from './story/seriesAI';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';

interface NPCDialogueProps {
  state: GameState;
  bloodline: BloodlineData;
  onChange: (s: GameState) => void;
  onBloodlineChange: (b: BloodlineData) => void;
  onClose: () => void;
}

export function NPCDialogue({ state, bloodline, onChange, onBloodlineChange, onClose }: NPCDialogueProps) {
  const [response, setResponse] = useState<string | null>(null);
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);

  const npc = state.npcs.find((n) => n.id === state.pendingNPC);
  const def = npc ? getNPCDef(npc.defId) : null;

  // Load portrait: prefer CDN asset (story mode), then AI generation
  useEffect(() => {
    if (!def) return;

    if (def.portraitAsset) {
      RundotGameAPI.cdn.fetchAsset(def.portraitAsset)
        .then((blob) => {
          if (blob) setPortraitUrl(URL.createObjectURL(blob));
        })
        .catch(() => {});
      return;
    }

    if (!def.appearanceDescription) return;
    const cacheKey = `npc_portrait_${def.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setPortraitUrl(cached);
      return;
    }
    generateNPCPortrait(def.id, def.name, def.appearanceDescription)
      .then((url) => {
        if (url) {
          setPortraitUrl(url);
          localStorage.setItem(cacheKey, url);
        }
      })
      .catch(() => {});
  }, [def?.id, def?.name, def?.appearanceDescription, def?.portraitAsset]);

  if (!npc || !def) return null;

  const dialogue = getNPCDialogue(def, bloodline);

  const handleChoice = (choice: DialogueChoice) => {
    const next = cloneState(state);
    const bl = structuredClone(bloodline);

    // Check if merchant trade and player can't afford
    const goldCost = choice.effects.find((e) => e.type === 'gold');
    if (goldCost && goldCost.type === 'gold' && goldCost.amount < 0 && next.score < Math.abs(goldCost.amount)) {
      setResponse("You don't have enough gold!");
      return;
    }

    const result = safeEngineCall('applyDialogueEffects', () => { applyDialogueEffects(next, choice.effects, bl); return true; });
    if (result === null) return;

    // Mark NPC as talked
    const npcRef = next.npcs.find((n) => n.id === npc.id);
    if (npcRef) npcRef.talked = true;
    next.pendingNPC = null;

    setResponse(choice.responseText);
    onBloodlineChange(bl);

    setTimeout(() => {
      onChange(next);
      onClose();
    }, 1500);
  };

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        {/* NPC Portrait */}
        <div style={portraitContainerStyle}>
          {portraitUrl ? (
            <img 
              src={portraitUrl} 
              alt={def.name}
              style={{
                width: 120,
                height: 120,
                objectFit: 'cover',
                borderRadius: 8,
                border: `3px solid ${def.color}66`,
                boxShadow: `0 0 15px ${def.color}44`,
              }}
            />
          ) : (
            <div style={{ 
              ...portraitStyle, 
              color: def.color, 
              textShadow: `0 0 20px ${def.color}, 0 0 40px ${def.color}66`,
              borderColor: def.color + '66',
              boxShadow: `0 0 15px ${def.color}44, inset 0 0 20px rgba(0,0,0,0.8)`
            }}>
              {def.char}
            </div>
          )}
        </div>

        <div style={headerStyle}>
          <span style={{ ...titleStyle, color: def.color }}>{def.name}</span>
        </div>

        <div style={dialogueStyle}>
          <span style={quoteStyle}>"</span>
          {response ?? dialogue.text}
          <span style={quoteStyle}>"</span>
        </div>

        {!response && (
          <div style={choicesStyle}>
            {dialogue.choices.map((choice, i) => (
              <button
                key={i}
                style={choiceBtnStyle}
                onClick={() => handleChoice(choice)}
              >
                {choice.label}
              </button>
            ))}
          </div>
        )}

        {response && (
          <div style={{ color: '#1a6a2a', fontSize: 10, textAlign: 'center', padding: '8px 0', fontFamily: 'monospace' }}>
            ...
          </div>
        )}
      </div>
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(0,0,0,0.92)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 50,
  padding: 12,
};

const panelStyle: CSSProperties = {
  width: '100%',
  maxWidth: 340,
  background: '#000',
  border: '1px solid #3a3a5a',
  borderRadius: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 12px',
  borderBottom: '1px solid #2a2a4a',
};

const titleStyle: CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 14,
  fontWeight: 'bold',
};

const dialogueStyle: CSSProperties = {
  padding: '14px 16px',
  color: '#aaccaa',
  fontFamily: 'monospace',
  fontSize: 12,
  lineHeight: '18px',
};

const quoteStyle: CSSProperties = {
  color: '#3a6a3a',
  fontSize: 14,
};

const choicesStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  padding: '8px 16px 14px',
  justifyContent: 'center',
};

const choiceBtnStyle: CSSProperties = {
  padding: '8px 14px',
  fontSize: 12,
  fontFamily: 'monospace',
  fontWeight: 'bold',
  background: '#000',
  color: '#33ff66',
  border: '1px solid #1a5a2a',
  borderRadius: 0,
  cursor: 'pointer',
  letterSpacing: 1,
  minWidth: 100,
  touchAction: 'none',
};

const portraitContainerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  padding: '16px 0 8px',
  background: 'linear-gradient(180deg, #0a0a15 0%, #000 100%)',
};

const portraitStyle: CSSProperties = {
  width: 80,
  height: 80,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 48,
  background: 'radial-gradient(circle, #1a1a2a 0%, #0a0a15 70%, #000 100%)',
  border: '2px solid',
  borderRadius: 4,
};
