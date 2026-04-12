import type { CSSProperties } from 'react';
import type { GameState, MercenaryDef } from './types';
import { MERCENARY_DEFS } from './constants';
import { hireMercenary } from './engine';
import { safeEngineCall } from './errorReporting';
import { trackMercenaryHired } from './analytics';
import { cloneState } from './utils';
import { getContentCache } from './story/progressiveLoader';
import { getMercenariesForFloor } from './story/contentCache';
import { useCdnImage } from './useCdnImage';

function findMercDef(state: GameState): MercenaryDef | undefined {
  const mercId = state.pendingMercenary;
  if (!mercId) return undefined;
  const mapMerc = state.mapMercenaries.find(m => m.id === mercId);
  if (!mapMerc) return undefined;
  let def = MERCENARY_DEFS.find(d => d.id === mapMerc.defId);
  if (!def) {
    const cache = getContentCache();
    const generatedMercs = getMercenariesForFloor(cache, state.floorNumber);
    def = generatedMercs.find(d => d.id === mapMerc.defId);
  }
  return def;
}

interface Props {
  state: GameState;
  onChange: (s: GameState) => void;
  onClose: () => void;
}

export function MercenaryHire({ state, onChange, onClose }: Props) {
  const def = findMercDef(state);
  const portraitUrl = useCdnImage(def?.portraitAsset || '');

  if (!def || !state.pendingMercenary) return null;

  const mercId = state.pendingMercenary!;
  const canAfford = state.score >= def.hireCost;
  const partyFull = state.mercenaries.filter(m => !m.isDead).length >= 2;

  const handleHire = () => {
    if (!canAfford || partyFull) return;
    const goldBefore = state.score;
    const next = cloneState(state);
    const hired = safeEngineCall('hireMercenary', () => hireMercenary(next, mercId));
    if (hired) {
      next.pendingMercenary = null;
      onChange(next);
      trackMercenaryHired({
        mercenaryName: def.name,
        cost: def.hireCost,
        playerGoldBefore: goldBefore,
        playerGoldAfter: next.score,
        zone: state.zone,
        floor: state.floorNumber,
        playerClass: state.playerClass,
        activeMercenaries: next.mercenaries.filter(m => !m.isDead).length,
      });
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <div style={headerStyle}>
          {(portraitUrl || def.portraitUrl) ? (
            <img 
              src={portraitUrl || def.portraitUrl} 
              alt={def.name}
              style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 4, border: `2px solid ${def.color}`, boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}
            />
          ) : (
            <span style={{ color: def.color, fontSize: 24, fontWeight: 'bold' }}>{def.char}</span>
          )}
          <div style={{ marginLeft: 10 }}>
            <span style={{ color: def.color, fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold' }}>
              {def.name}
            </span>
            <div style={{ color: '#88ccff', fontFamily: 'monospace', fontSize: 10 }}>
              {def.title}
            </div>
          </div>
        </div>

        <div style={bodyStyle}>
          <div style={descStyle}>{def.description}</div>
          {def.backstory && (
            <div style={{ ...descStyle, fontStyle: 'italic', color: '#778899' }}>{def.backstory}</div>
          )}
          <div style={abilityStyle}>{def.specialAbility}</div>

          <div style={statsRowStyle}>
            <span style={statStyle}>HP:{def.stats.hp}</span>
            <span style={statStyle}>Atk:{def.stats.attack}</span>
            <span style={statStyle}>Def:{def.stats.defense}</span>
            <span style={statStyle}>Spd:{def.stats.speed}</span>
          </div>

          <div style={costStyle}>
            Hire cost: <span style={{ color: '#ffd700' }}>{def.hireCost} gold</span>
            {!canAfford && <span style={{ color: '#ff3333', marginLeft: 8 }}>(not enough gold)</span>}
            {partyFull && <span style={{ color: '#ff3333', marginLeft: 8 }}>(party full - max 2)</span>}
          </div>
        </div>

        <div style={btnRowStyle}>
          <button
            style={canAfford && !partyFull ? hireBtnStyle : hireBtnDisabledStyle}
            onClick={handleHire}
            disabled={!canAfford || partyFull}
          >
            [ Hire ]
          </button>
          <button style={closeBtnStyle} onClick={onClose}>
            [ Leave ]
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.92)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 12,
};

const panelStyle: CSSProperties = {
  width: '100%', maxWidth: 340, background: '#000', border: '1px solid #2a4a6a',
  display: 'flex', flexDirection: 'column', overflow: 'hidden',
};

const headerStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', padding: '10px 12px',
  borderBottom: '1px solid #1a3a5a',
};

const bodyStyle: CSSProperties = {
  padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8,
};

const descStyle: CSSProperties = {
  color: '#aabbcc', fontFamily: 'monospace', fontSize: 11,
};

const abilityStyle: CSSProperties = {
  color: '#88ccff', fontFamily: 'monospace', fontSize: 10, fontStyle: 'italic',
  padding: '4px 8px', border: '1px solid #1a3a5a', background: '#050a14',
};

const statsRowStyle: CSSProperties = {
  display: 'flex', gap: 10,
};

const statStyle: CSSProperties = {
  color: '#33ff66', fontFamily: 'monospace', fontSize: 11,
};

const costStyle: CSSProperties = {
  color: '#aaa', fontFamily: 'monospace', fontSize: 11,
};

const btnRowStyle: CSSProperties = {
  display: 'flex', gap: 8, padding: '8px 12px', borderTop: '1px solid #1a3a5a',
  justifyContent: 'center',
};

const hireBtnStyle: CSSProperties = {
  padding: '6px 16px', fontSize: 12, fontFamily: 'monospace', fontWeight: 'bold',
  background: '#000', color: '#88ccff', border: '1px solid #2a4a6a', cursor: 'pointer',
};

const hireBtnDisabledStyle: CSSProperties = {
  ...hireBtnStyle, color: '#444', borderColor: '#222', cursor: 'default',
};

const closeBtnStyle: CSSProperties = {
  padding: '6px 16px', fontSize: 12, fontFamily: 'monospace',
  background: '#000', color: '#888', border: '1px solid #333', cursor: 'pointer',
};
