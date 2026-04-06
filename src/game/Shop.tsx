import type { CSSProperties } from 'react';
import type { GameState, Item, EquipSlot, ItemEffect, Stats } from './types';
import { buyItem } from './engine';
import { safeEngineCall } from './errorReporting';
import { RARITY_DEFS } from './constants';
import { cloneState } from './utils';
import { trackShopPurchase } from './analytics';

interface ShopProps {
  state: GameState;
  onChange: (s: GameState) => void;
  onClose: () => void;
}

/** Format an item effect into a short readable label. */
function effectLabel(effect: ItemEffect): string {
  switch (effect.type) {
    case 'lifesteal': return `${effect.percent}% lifesteal`;
    case 'hungersteal': return `+${effect.amount} hunger/hit`;
    case 'poison': return `Poison ${effect.damage}x${effect.turns}t`;
    case 'stun': return `${Math.round(effect.chance * 100)}% stun`;
    case 'thorns': return `Thorns ${effect.damage}`;
    case 'fireball': return `${Math.round(effect.chance * 100)}% fire ${effect.damage}`;
    case 'freeze': return `${Math.round(effect.chance * 100)}% freeze ${effect.turns}t`;
    case 'bleed': return `Bleed ${effect.damage}x${effect.turns}t`;
    case 'execute': return `${Math.round(effect.chance * 100)}% execute <${Math.round(effect.hpThreshold * 100)}%`;
  }
}

/** Build stat chips for an equippable item. */
function statChips(item: Item): { label: string; value: number }[] {
  const chips: { label: string; value: number }[] = [];
  if (item.statBonus?.attack) chips.push({ label: 'ATK', value: item.statBonus.attack });
  if (item.statBonus?.defense) chips.push({ label: 'DEF', value: item.statBonus.defense });
  if (item.statBonus?.maxHp) chips.push({ label: 'HP', value: item.statBonus.maxHp });
  if (item.statBonus?.speed) chips.push({ label: 'SPD', value: item.statBonus.speed });
  if (item.range && item.range > 1) chips.push({ label: 'RNG', value: item.range });
  return chips;
}

const COMPARE_STATS: { label: string; key: keyof Stats }[] = [
  { label: 'ATK', key: 'attack' },
  { label: 'DEF', key: 'defense' },
  { label: 'HP', key: 'maxHp' },
  { label: 'SPD', key: 'speed' },
];

/** Compare a shop item stat to the currently equipped item in the same slot. Returns diff per stat. */
function compareToEquipped(
  shopItem: Item,
  equipped: Partial<Record<EquipSlot, Item>>,
): { label: string; diff: number }[] {
  if (!shopItem.equipSlot) return [];
  const current = equipped[shopItem.equipSlot];
  const diffs: { label: string; diff: number }[] = [];

  for (const { label, key } of COMPARE_STATS) {
    const shopVal = shopItem.statBonus?.[key] ?? 0;
    const curVal = current?.statBonus?.[key] ?? 0;
    const diff = shopVal - curVal;
    if (shopVal !== 0 || curVal !== 0) {
      diffs.push({ label, diff });
    }
  }
  return diffs;
}

export function Shop({ state, onChange, onClose }: ShopProps) {
  const shop = state.shop;
  if (!shop) return null;

  const handleBuy = (idx: number) => {
    const shopItem = shop.stock[idx];
    const goldBefore = state.score;
    const next = cloneState(state);
    const bought = safeEngineCall('buyItem', () => buyItem(next, idx));
    if (bought) {
      if (shopItem) {
        trackShopPurchase({
          itemName: shopItem.item.name,
          itemType: shopItem.item.type,
          cost: shopItem.price,
          playerGoldBefore: goldBefore,
          playerGoldAfter: next.score,
          zone: state.zone,
          floor: state.floorNumber,
          playerClass: state.playerClass,
        });
      }
      onChange(next);
    }
  };

  const { equipment } = state.player;

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <pre style={panelBorderStyle}>{'+=== SHOP ============================+'}</pre>
        <div style={headerStyle}>
          <span style={titleStyle}>$ Shopkeeper</span>
          <span style={goldStyle}>Gold: {state.score}</span>
          <button style={closeBtnStyle} onClick={onClose}>[X]</button>
        </div>

        <div style={listStyle}>
          {shop.stock.length === 0 && (
            <div style={emptyStyle}>{'-- Sold out! --'}</div>
          )}
          {shop.stock.map((si, idx) => {
            const canAfford = state.score >= si.price;
            const bagFull = state.player.inventory.length >= 20;
            const isEquippable = !!si.item.equipSlot;
            const chips = statChips(si.item);
            const diffs = compareToEquipped(si.item, equipment);
            const hasEffect = si.item.onHitEffect || si.item.onDefendEffect;
            const currentEquipped = si.item.equipSlot ? equipment[si.item.equipSlot] : undefined;

            return (
              <div key={si.item.id} style={itemRowStyle}>
                {/* Top row: icon, name, price, buy */}
                <div style={topRowStyle}>
                  <span style={{
                    color: si.item.rarity && si.item.rarity !== 'common' ? RARITY_DEFS[si.item.rarity].color : si.item.color,
                    marginRight: 6, fontFamily: 'monospace', fontSize: 14,
                    textShadow: si.item.rarity && si.item.rarity !== 'common' ? `0 0 6px ${RARITY_DEFS[si.item.rarity].glowColor}66` : undefined,
                  }}>
                    {si.item.char}
                  </span>
                  <div style={itemInfoStyle}>
                    <span style={{
                      ...itemNameStyle,
                      color: si.item.rarity && si.item.rarity !== 'common' ? RARITY_DEFS[si.item.rarity].color : '#33ff66',
                      textShadow: si.item.rarity && si.item.rarity !== 'common' ? `0 0 6px ${RARITY_DEFS[si.item.rarity].glowColor}66` : undefined,
                    }}>
                      {si.item.name}
                      {si.item.rarity && si.item.rarity !== 'common' && (
                        <span style={{ color: RARITY_DEFS[si.item.rarity].color, fontSize: 9, marginLeft: 4 }}>
                          [{RARITY_DEFS[si.item.rarity].label}]
                        </span>
                      )}
                    </span>
                    <span style={itemDescStyle}>{si.item.description}</span>
                  </div>
                  <span style={{ ...priceStyle, color: canAfford ? '#ffd700' : '#663300' }}>
                    {si.price}g
                  </span>
                  <button
                    style={canAfford && !bagFull ? buyBtnStyle : buyBtnDisabledStyle}
                    onClick={() => handleBuy(idx)}
                    disabled={!canAfford || bagFull}
                  >
                    [Buy]
                  </button>
                </div>

                {/* Stat chips for equippable items */}
                {isEquippable && chips.length > 0 && (
                  <div style={statsRowStyle}>
                    {chips.map((c) => (
                      <span key={c.label} style={statChipStyle}>
                        {c.label} +{c.value}
                      </span>
                    ))}
                    {hasEffect && si.item.onHitEffect && (
                      <span style={effectChipStyle}>
                        {effectLabel(si.item.onHitEffect)}
                      </span>
                    )}
                    {hasEffect && si.item.onDefendEffect && (
                      <span style={effectChipDefStyle}>
                        {effectLabel(si.item.onDefendEffect)}
                      </span>
                    )}
                  </div>
                )}

                {/* Comparison row: vs currently equipped */}
                {isEquippable && (
                  <div style={compareRowStyle}>
                    {currentEquipped ? (
                      <>
                        <span style={compareLabel}>vs {currentEquipped.name}:</span>
                        {diffs.map((d) => (
                          <span
                            key={d.label}
                            style={{
                              ...compareDiffStyle,
                              color: d.diff > 0 ? '#44ff88' : d.diff < 0 ? '#ff4444' : '#555',
                            }}
                          >
                            {d.label} {d.diff > 0 ? '+' : ''}{d.diff}
                          </span>
                        ))}
                        {diffs.length === 0 && <span style={{ color: '#555', fontSize: 9 }}>same stats</span>}
                      </>
                    ) : (
                      <span style={noEquipLabel}>No {si.item.equipSlot} equipped</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <pre style={{ ...panelBorderStyle, padding: '0 8px 4px' }}>{'+=== ================================-+'}</pre>
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
  maxWidth: 380,
  maxHeight: '80%',
  background: '#000',
  border: '1px solid #8a6a1a',
  borderRadius: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const panelBorderStyle: CSSProperties = {
  color: '#8a6a1a',
  fontSize: 11,
  margin: 0,
  padding: '4px 8px 0',
  fontFamily: 'monospace',
  textShadow: '0 0 4px #ffd70022',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '6px 8px',
  borderBottom: '1px solid #3a2a0a',
  gap: 8,
};

const titleStyle: CSSProperties = {
  color: '#ffd700',
  fontFamily: 'monospace',
  fontSize: 13,
  fontWeight: 'bold',
  flex: 1,
  textShadow: '0 0 6px #ffd70044',
};

const goldStyle: CSSProperties = {
  color: '#ffd700',
  fontFamily: 'monospace',
  fontSize: 12,
  fontWeight: 'bold',
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
  letterSpacing: 1,
};

const listStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: 8,
};

const itemRowStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '6px 4px',
  borderBottom: '1px solid #1a1408',
  fontSize: 12,
  fontFamily: 'monospace',
  gap: 3,
};

const topRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

const itemInfoStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
};

const itemNameStyle: CSSProperties = {
  color: '#33ff66',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 12,
};

const itemDescStyle: CSSProperties = {
  color: '#1a6a2a',
  fontSize: 9,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const priceStyle: CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 12,
  fontWeight: 'bold',
  minWidth: 36,
  textAlign: 'right',
};

const buyBtnStyle: CSSProperties = {
  padding: '2px 8px',
  fontSize: 11,
  background: 'transparent',
  color: '#ffd700',
  border: '1px solid #8a6a1a',
  borderRadius: 0,
  fontFamily: 'monospace',
  cursor: 'pointer',
  letterSpacing: 1,
};

const buyBtnDisabledStyle: CSSProperties = {
  ...buyBtnStyle,
  color: '#3a2a0a',
  border: '1px solid #1a1408',
  cursor: 'not-allowed',
};

const emptyStyle: CSSProperties = {
  color: '#3a2a0a',
  textAlign: 'center',
  padding: 20,
  fontFamily: 'monospace',
  fontSize: 12,
};

// ── Stat / comparison row styles ──

const statsRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 4,
  marginTop: 2,
  paddingLeft: 20,
};

const statChipStyle: CSSProperties = {
  fontSize: 9,
  color: '#aaddff',
  background: '#0a1a2a',
  padding: '1px 5px',
  borderRadius: 2,
  border: '1px solid #1a3a5a',
};

const effectChipStyle: CSSProperties = {
  fontSize: 9,
  color: '#ffaa44',
  background: '#1a1008',
  padding: '1px 5px',
  borderRadius: 2,
  border: '1px solid #3a2a0a',
};

const effectChipDefStyle: CSSProperties = {
  fontSize: 9,
  color: '#66bbff',
  background: '#081828',
  padding: '1px 5px',
  borderRadius: 2,
  border: '1px solid #1a3a5a',
};

const compareRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 5,
  paddingLeft: 20,
};

const compareLabel: CSSProperties = {
  fontSize: 9,
  color: '#6a6a4a',
};

const compareDiffStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 'bold',
};

const noEquipLabel: CSSProperties = {
  fontSize: 9,
  color: '#4a6a2a',
  fontStyle: 'italic',
};
