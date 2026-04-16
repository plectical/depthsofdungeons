import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { GameState, EquipSlot, Item, ItemRarity, ItemEffect, Stats } from './types';
import { useItem, equipItem, unequipItem, dropItem, sellItem, autoSellByRarity } from './engine';
import { safeEngineCall } from './errorReporting';
import { ELEMENT_INFO, inferElementFromEffect } from './elements';
import { RARITY_DEFS } from './constants';
import type { Element } from './types';
import { cloneState } from './utils';

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

const COMPARE_STATS: { label: string; key: keyof Stats }[] = [
  { label: 'ATK', key: 'attack' },
  { label: 'DEF', key: 'defense' },
  { label: 'HP', key: 'maxHp' },
  { label: 'SPD', key: 'speed' },
];

const WEAKNESS_LABELS: Record<Element, Element> = {
  fire: 'ice', ice: 'lightning', lightning: 'poison',
  poison: 'holy', holy: 'dark', dark: 'fire',
};
const RESISTED_BY: Record<Element, Element> = {
  fire: 'dark', ice: 'fire', lightning: 'ice',
  poison: 'lightning', holy: 'poison', dark: 'holy',
};

function ElementBadge({ item }: { item: Item }) {
  const element = item.element ?? inferElementFromEffect(item);
  if (!element) return null;
  const info = ELEMENT_INFO[element];
  const inferred = !item.element;
  return (
    <span style={{
      color: info.color,
      fontSize: 9,
      marginLeft: 5,
      padding: '1px 5px',
      border: `1px solid ${info.color}${inferred ? '55' : '99'}`,
      background: `${info.color}15`,
      fontFamily: 'monospace',
      letterSpacing: 0.5,
      whiteSpace: 'nowrap',
      opacity: inferred ? 0.7 : 1,
    }} title={`${info.name} element${inferred ? ' (from effect)' : ''}`}>
      {info.icon} {info.name}
    </span>
  );
}

function ElementDetail({ element }: { element: Element }) {
  const info = ELEMENT_INFO[element];
  const beats = WEAKNESS_LABELS[element];
  const beatsInfo = ELEMENT_INFO[beats];
  const weak = RESISTED_BY[element];
  const weakInfo = ELEMENT_INFO[weak];
  return (
    <div style={elementDetailStyle}>
      <span style={{ color: info.color }}>{info.icon} {info.name}</span>
      <span style={{ color: '#555', margin: '0 2px' }}>—</span>
      <span style={{ color: beatsInfo.color, fontSize: 9 }}>strong vs {beatsInfo.icon}{beatsInfo.name}</span>
      <span style={{ color: '#333', margin: '0 2px' }}>·</span>
      <span style={{ color: weakInfo.color, fontSize: 9 }}>weak to {weakInfo.icon}{weakInfo.name}</span>
    </div>
  );
}

function RarityBadge({ item }: { item: Item }) {
  if (!item.rarity || item.rarity === 'common') return null;
  const rDef = RARITY_DEFS[item.rarity];
  return (
    <span style={{
      color: rDef.color,
      fontSize: 9,
      marginLeft: 4,
      textShadow: `0 0 4px ${rDef.glowColor}44`,
      letterSpacing: 0.5,
    }}>
      [{rDef.label}]
    </span>
  );
}

/** Get the display color for an item — rarity color for non-common equipment, else original color */
function getItemDisplayColor(item: Item): string {
  if (item.rarity && item.rarity !== 'common') {
    return RARITY_DEFS[item.rarity].color;
  }
  return '#33ff66';
}

/** Get a subtle text shadow for rarity glow on item names */
function getItemTextShadow(item: Item): string | undefined {
  if (item.rarity && item.rarity !== 'common') {
    const rDef = RARITY_DEFS[item.rarity];
    return `0 0 6px ${rDef.glowColor}66`;
  }
  return undefined;
}

// Ordered list of all rarities for display
const ALL_RARITIES: ItemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

interface InventoryProps {
  state: GameState;
  onChange: (s: GameState) => void;
  onClose: () => void;
  /** Rarities currently enabled for auto-sell */
  autoSellRarities: ItemRarity[];
  /** Called when the user changes the auto-sell rarity settings */
  onAutoSellRaritiesChange: (rarities: ItemRarity[]) => void;
  /** Whether to auto-sell potions, food, and scrolls */
  autoSellConsumables: boolean;
  /** Called when the user toggles the consumables auto-sell setting */
  onAutoSellConsumablesChange: (value: boolean) => void;
}

export function Inventory({ state, onChange, onClose, autoSellRarities, onAutoSellRaritiesChange, autoSellConsumables, onAutoSellConsumablesChange }: InventoryProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [tab, setTab] = useState<'items' | 'equip' | 'autosell'>('items');
  const [autoSellFeedback, setAutoSellFeedback] = useState<string | null>(null);

  const handleUse = (idx: number) => {
    const next = cloneState(state);
    const used = safeEngineCall('useItem', () => useItem(next, idx));
    if (used) { setSelectedIdx(null); onChange(next); }
  };

  const handleEquip = (idx: number) => {
    const next = cloneState(state);
    const equipped = safeEngineCall('equipItem', () => equipItem(next, idx));
    if (equipped) { setSelectedIdx(null); onChange(next); }
  };

  const handleUnequip = (slot: EquipSlot) => {
    const next = cloneState(state);
    const unequipped = safeEngineCall('unequipItem', () => unequipItem(next, slot));
    if (unequipped) onChange(next);
  };

  const handleDrop = (idx: number) => {
    const next = cloneState(state);
    const dropped = safeEngineCall('dropItem', () => dropItem(next, idx));
    if (dropped) { setSelectedIdx(null); onChange(next); }
  };

  const handleSell = (idx: number) => {
    const next = cloneState(state);
    const sold = safeEngineCall('sellItem', () => sellItem(next, idx));
    if (sold) { setSelectedIdx(null); onChange(next); }
  };

  const handleAutoSell = () => {
    if (autoSellRarities.length === 0 && !autoSellConsumables) {
      setAutoSellFeedback('No options selected!');
      setTimeout(() => setAutoSellFeedback(null), 2000);
      return;
    }
    const next = cloneState(state);
    const gold = safeEngineCall('autoSellByRarity', () => autoSellByRarity(next, autoSellRarities, autoSellConsumables));
    if (gold && gold > 0) {
      setAutoSellFeedback(`Sold for ${gold} gold!`);
      onChange(next);
    } else {
      setAutoSellFeedback('Nothing to sell.');
    }
    setTimeout(() => setAutoSellFeedback(null), 2000);
  };

  const toggleRarity = (rarity: ItemRarity) => {
    if (autoSellRarities.includes(rarity)) {
      onAutoSellRaritiesChange(autoSellRarities.filter((r) => r !== rarity));
    } else {
      onAutoSellRaritiesChange([...autoSellRarities, rarity]);
    }
  };

  // Count how many items in inventory would be sold
  const autoSellCount = state.player.inventory.filter((item) => {
    const isConsumable = item.type === 'potion' || item.type === 'food' || item.type === 'scroll';
    return autoSellRarities.includes(item.rarity ?? 'common') || (autoSellConsumables && isConsumable);
  }).length;

  const { inventory, equipment } = state.player;

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <pre style={panelBorderStyle}>{'+=== INVENTORY =======================+'}</pre>
        <div style={headerStyle}>
          <div style={tabsStyle}>
            <button style={tab === 'items' ? tabActiveStyle : tabStyle} onClick={() => setTab('items')}>
              {'[ Items '}{inventory.length}/20{' ]'}
            </button>
            <button style={tab === 'equip' ? tabActiveStyle : tabStyle} onClick={() => setTab('equip')}>
              {'[ Equipped ]'}
            </button>
            <button style={tab === 'autosell' ? tabActiveStyle : tabStyle} onClick={() => setTab('autosell')}>
              {'[ Auto-Sell ]'}
            </button>
          </div>
          <button style={closeBtnStyle} onClick={onClose}>
            [X]
          </button>
        </div>

        {/* ── Persistent stat bar ── */}
        {(() => {
          const p = state.player;
          const s = p.stats;
          const cls = state.playerClass;
          const classColor = cls === 'warrior' ? '#ff8844' : cls === 'rogue' ? '#44ff88' : cls === 'mage' ? '#aa44ff' : cls === 'ranger' ? '#88ff44' : '#ffdd44';
          return (
            <div style={statBarStyle}>
              <span style={{ color: classColor, fontWeight: 'bold', marginRight: 6 }}>{cls?.toUpperCase() ?? 'LV'} {p.level}</span>
              <span style={statPillStyle}><span style={{ color: '#ff4444' }}>♥</span> {s.hp}/{s.maxHp}</span>
              <span style={statPillStyle}><span style={{ color: '#ff8844' }}>⚔</span> {s.attack}</span>
              <span style={statPillStyle}><span style={{ color: '#4488ff' }}>🛡</span> {s.defense}</span>
              <span style={statPillStyle}><span style={{ color: '#ffdd44' }}>$</span> {state.score}g</span>
              {s.speed > 0 && <span style={statPillStyle}><span style={{ color: '#44ffdd' }}>SPD</span> {s.speed}</span>}
            </div>
          );
        })()}

        {tab === 'items' && (
          <div style={listStyle}>
            {inventory.length === 0 && <div style={emptyStyle}>{'-- No items --'}</div>}
            {inventory.map((item, idx) => {
              const rowElement = item.element ?? inferElementFromEffect(item);
              const rowElColor = rowElement ? ELEMENT_INFO[rowElement].color : undefined;
              return (
              <div key={item.id} style={{
                ...itemRowStyle,
                ...(rowElColor ? { borderLeft: `2px solid ${rowElColor}88`, paddingLeft: 4 } : {}),
              }} onClick={() => setSelectedIdx(selectedIdx === idx ? null : idx)}>
                <span style={{ color: item.rarity && item.rarity !== 'common' ? RARITY_DEFS[item.rarity].color : item.color, marginRight: 6, fontFamily: 'monospace', textShadow: getItemTextShadow(item) }}>{item.char}</span>
                <span style={{ ...itemNameStyle, color: getItemDisplayColor(item), textShadow: getItemTextShadow(item) }}>{item.name}<RarityBadge item={item} /><ElementBadge item={item} />{item.range && item.range > 1 ? <span style={rangedBadgeStyle}>{'\u{1F3F9}'} {item.range}</span> : null}</span>
                {selectedIdx === idx && (
                  <>
                    {/* ── Stats & effects detail block ── */}
                    <div style={itemDetailStyle}>
                      {/* Element info */}
                      {(() => {
                        const el = item.element ?? inferElementFromEffect(item);
                        return el ? <ElementDetail element={el} /> : null;
                      })()}
                      {/* Ranged weapon indicator */}
                      {item.range && item.range > 1 && (
                        <div style={rangedLabelStyle}>{'\u{1F3F9}'} RANGED WEAPON — Attacks from {item.range} tiles away</div>
                      )}
                      {/* Class restriction indicator */}
                      {item.classRestriction && (
                        <div style={classRestrictionStyle}>{item.classRestriction.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')} only</div>
                      )}
                      {/* Description */}
                      {item.description && (
                        <div style={itemDescStyle}>{item.description}</div>
                      )}
                      {/* Stat chips for equippable items */}
                      {item.equipSlot && (() => {
                        const chips: { label: string; value: number }[] = [];
                        if (item.statBonus?.attack) chips.push({ label: 'ATK', value: item.statBonus.attack });
                        if (item.statBonus?.defense) chips.push({ label: 'DEF', value: item.statBonus.defense });
                        if (item.statBonus?.maxHp) chips.push({ label: 'HP', value: item.statBonus.maxHp });
                        if (item.statBonus?.speed) chips.push({ label: 'SPD', value: item.statBonus.speed });
                        if (item.range && item.range > 1) chips.push({ label: 'RNG', value: item.range });
                        return chips.length > 0 ? (
                          <div style={chipsRowStyle}>
                            {chips.map((c) => (
                              <span key={c.label} style={statChipStyle}>{c.label} +{c.value}</span>
                            ))}
                          </div>
                        ) : null;
                      })()}
                      {/* Skill bonus chips for narrative gear */}
                      {item.skillBonus && (() => {
                        const skillChips = Object.entries(item.skillBonus).filter(([, v]) => v);
                        return skillChips.length > 0 ? (
                          <div style={chipsRowStyle}>
                            {skillChips.map(([skill, value]) => (
                              <span key={skill} style={skillChipStyle}>
                                {skill.charAt(0).toUpperCase() + skill.slice(1)} +{value}
                              </span>
                            ))}
                          </div>
                        ) : null;
                      })()}
                      {/* On-hit / on-defend effects */}
                      {(item.onHitEffect || item.onDefendEffect) && (
                        <div style={chipsRowStyle}>
                          {item.onHitEffect && (
                            <span style={effectChipStyle}>⚔ {effectLabel(item.onHitEffect)}</span>
                          )}
                          {item.onDefendEffect && (
                            <span style={effectChipDefStyle}>🛡 {effectLabel(item.onDefendEffect)}</span>
                          )}
                        </div>
                      )}
                      {/* Comparison vs currently equipped */}
                      {item.equipSlot && (() => {
                        const current = equipment[item.equipSlot];
                        const diffs: { label: string; diff: number }[] = [];
                        for (const { label, key } of COMPARE_STATS) {
                          const newVal = item.statBonus?.[key] ?? 0;
                          const curVal = current?.statBonus?.[key] ?? 0;
                          if (newVal !== 0 || curVal !== 0) diffs.push({ label, diff: newVal - curVal });
                        }
                        return (
                          <div style={compareRowStyle}>
                            {current ? (
                              <>
                                <span style={compareLabelStyle}>vs {current.name}:</span>
                                {diffs.map((d) => (
                                  <span key={d.label} style={{ ...compareDiffStyle, color: d.diff > 0 ? '#44ff88' : d.diff < 0 ? '#ff4444' : '#555' }}>
                                    {d.label} {d.diff > 0 ? '+' : ''}{d.diff}
                                  </span>
                                ))}
                                {diffs.length === 0 && <span style={{ color: '#555', fontSize: 9 }}>same stats</span>}
                              </>
                            ) : (
                              <span style={{ color: '#2a5a2a', fontSize: 9 }}>Nothing equipped in this slot</span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    {/* ── Action buttons ── */}
                    <div style={actionsStyle}>
                      {(item.type === 'potion' || item.type === 'scroll' || item.type === 'food') && (
                        <button style={itemActionBtnStyle} onClick={(e) => { e.stopPropagation(); handleUse(idx); }}>
                          [Use]
                        </button>
                      )}
                      {item.equipSlot && (
                        <button style={itemActionBtnStyle} onClick={(e) => { e.stopPropagation(); handleEquip(idx); }}>
                          [Equip]
                        </button>
                      )}
                      <button
                        style={{ ...itemActionBtnStyle, color: '#ffd700', borderColor: '#3a2a0a' }}
                        onClick={(e) => { e.stopPropagation(); handleSell(idx); }}
                        title={`Sell for ${Math.max(1, Math.floor(item.value / 2))}g`}
                      >
                        [Sell {Math.max(1, Math.floor(item.value / 2))}g]
                      </button>
                      <button style={{ ...itemActionBtnStyle, color: '#ff3333', borderColor: '#4a0a0a' }} onClick={(e) => { e.stopPropagation(); handleDrop(idx); }}>
                        [Drop]
                      </button>
                    </div>
                  </>
                )}
              </div>
              );
            })}
          </div>
        )}

        {tab === 'equip' && (
          <div style={listStyle}>
            {(['weapon', 'offhand', 'armor', 'cloak', 'boots', 'ring', 'amulet', 'trinket', 'legacy'] as EquipSlot[]).map((slot) => {
              const item = equipment[slot];
              if (slot === 'legacy' && !item) return null;
              return (
                <div key={slot} style={itemRowStyle}>
                  <span style={slot === 'legacy' ? { ...slotLabelStyle, color: '#c49eff' } : slotLabelStyle}>{slot === 'legacy' ? 'Legacy:' : slot.charAt(0).toUpperCase() + slot.slice(1) + ':'}</span>
                  {item ? (
                    <>
                      <span style={{ color: item.rarity && item.rarity !== 'common' ? RARITY_DEFS[item.rarity].color : item.color, marginRight: 4, fontFamily: 'monospace', textShadow: getItemTextShadow(item) }}>{item.char}</span>
                      <span style={{ ...itemNameStyle, color: getItemDisplayColor(item), textShadow: getItemTextShadow(item) }}>{item.name}<RarityBadge item={item} /><ElementBadge item={item} /></span>
                      <span style={bonusStyle}>
                        {item.statBonus?.attack ? `+${item.statBonus.attack}atk ` : ''}
                        {item.statBonus?.defense ? `+${item.statBonus.defense}def ` : ''}
                        {item.statBonus?.maxHp ? `+${item.statBonus.maxHp}hp ` : ''}
                        {item.statBonus?.speed ? `+${item.statBonus.speed}spd ` : ''}
                        {item.range && item.range > 1 ? <span style={rangedBadgeStyle}>{'\u{1F3F9}'} {item.range}</span> : ''}
                      </span>
                      {item.skillBonus && (
                        <span style={skillBonusStyle}>
                          {Object.entries(item.skillBonus).filter(([, v]) => v).map(([k, v]) => `+${v} ${k.slice(0, 3).toUpperCase()}`).join(' ')}
                        </span>
                      )}
                      {slot !== 'legacy' && (
                        <button style={itemActionBtnStyle} onClick={() => handleUnequip(slot)}>
                          [Remove]
                        </button>
                      )}
                    </>
                  ) : (
                    <span style={emptySlotStyle}>{'-- empty --'}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'autosell' && (
          <div style={listStyle}>
            <div style={autoSellDescStyle}>
              {'Select what to auto-sell. All matched items sell for half price.'}
            </div>

            {/* Consumables toggle */}
            <button
              style={{
                ...rarityToggleBtnStyle,
                marginBottom: 10,
                borderColor: autoSellConsumables ? '#44bbff' : '#0a2a0a',
                color: autoSellConsumables ? '#44bbff' : '#2a4a2a',
                textShadow: autoSellConsumables ? '0 0 6px #44bbff66' : undefined,
                background: autoSellConsumables ? '#44bbff11' : 'transparent',
              }}
              onClick={() => onAutoSellConsumablesChange(!autoSellConsumables)}
            >
              <span style={{ fontSize: 13 }}>{autoSellConsumables ? '◉' : '○'}</span>
              <span style={{ flex: 1 }}>Potions, Food & Scrolls</span>
              {(() => {
                const n = inventory.filter((i) => i.type === 'potion' || i.type === 'food' || i.type === 'scroll').length;
                return n > 0 ? <span style={{ fontSize: 9, opacity: 0.7 }}>({n} in bag)</span> : null;
              })()}
            </button>

            <div style={{ color: '#1a5a2a', fontSize: 9, fontFamily: 'monospace', marginBottom: 8 }}>{'── By Rarity ──'}</div>

            <div style={rarityToggleListStyle}>
              {ALL_RARITIES.map((rarity) => {
                const rDef = RARITY_DEFS[rarity];
                const isOn = autoSellRarities.includes(rarity);
                const itemsOfRarity = inventory.filter((i) => (i.rarity ?? 'common') === rarity).length;
                return (
                  <button
                    key={rarity}
                    style={{
                      ...rarityToggleBtnStyle,
                      borderColor: isOn ? rDef.color : '#0a2a0a',
                      color: isOn ? rDef.color : '#2a4a2a',
                      textShadow: isOn ? `0 0 6px ${rDef.glowColor}66` : undefined,
                      background: isOn ? `${rDef.color}11` : 'transparent',
                    }}
                    onClick={() => toggleRarity(rarity)}
                  >
                    <span style={{ fontSize: 13 }}>{isOn ? '◉' : '○'}</span>
                    <span style={{ flex: 1 }}>{rDef.label}</span>
                    {itemsOfRarity > 0 && (
                      <span style={{ fontSize: 9, opacity: 0.7 }}>({itemsOfRarity} in bag)</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div style={autoSellFooterStyle}>
              {autoSellFeedback ? (
                <span style={{ color: '#ffd700', fontSize: 12, fontFamily: 'monospace' }}>{autoSellFeedback}</span>
              ) : (
                <span style={{ color: '#2a5a2a', fontSize: 11, fontFamily: 'monospace' }}>
                  {autoSellCount > 0 ? `${autoSellCount} item${autoSellCount !== 1 ? 's' : ''} will be sold` : 'No items match selection'}
                </span>
              )}
              <button
                style={autoSellCount > 0 ? autoSellBtnActiveStyle : autoSellBtnStyle}
                onClick={handleAutoSell}
              >
                [Sell Now]
              </button>
            </div>

            <div style={autoSellHintStyle}>
              {'* Settings are saved between sessions.\n* Equipped items are never auto-sold.\n* Each item sells for half its value.'}
            </div>
          </div>
        )}

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
  border: '1px solid #1a5a2a',
  borderRadius: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const panelBorderStyle: CSSProperties = {
  color: '#1a8a3a',
  fontSize: 11,
  margin: 0,
  padding: '4px 8px 0',
  fontFamily: 'monospace',
  textShadow: '0 0 4px #33ff6622',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '4px 8px',
  borderBottom: '1px solid #0a3a0a',
  gap: 4,
};

const tabsStyle: CSSProperties = {
  display: 'flex',
  gap: 4,
  flexWrap: 'wrap',
};

const tabStyle: CSSProperties = {
  padding: '4px 6px',
  fontSize: 10,
  background: 'transparent',
  color: '#0a5a1a',
  border: '1px solid #0a3a0a',
  borderRadius: 0,
  fontFamily: 'monospace',
  cursor: 'pointer',
  letterSpacing: 0.5,
};

const tabActiveStyle: CSSProperties = {
  ...tabStyle,
  color: '#33ff66',
  border: '1px solid #1a5a2a',
  textShadow: '0 0 4px #33ff6644',
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
  alignItems: 'center',
  flexWrap: 'wrap',
  padding: '5px 6px',
  borderBottom: '1px solid #0a1a0a',
  cursor: 'pointer',
  fontSize: 12,
  fontFamily: 'monospace',
  gap: 4,
};

const itemNameStyle: CSSProperties = {
  color: '#33ff66',
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const slotLabelStyle: CSSProperties = {
  color: '#1a8a3a',
  fontSize: 11,
  minWidth: 60,
  textTransform: 'capitalize',
};

const emptySlotStyle: CSSProperties = {
  color: '#0a3a0a',
  fontSize: 11,
};

const bonusStyle: CSSProperties = {
  color: '#66ffaa',
  fontSize: 10,
  marginLeft: 4,
};

const actionsStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  gap: 4,
  marginTop: 4,
  paddingTop: 4,
  borderTop: '1px solid #0a2a0a',
  flexWrap: 'wrap',
};

const itemActionBtnStyle: CSSProperties = {
  padding: '2px 8px',
  fontSize: 11,
  background: 'transparent',
  color: '#33ff66',
  border: '1px solid #1a5a2a',
  borderRadius: 0,
  fontFamily: 'monospace',
  cursor: 'pointer',
  letterSpacing: 1,
};

const emptyStyle: CSSProperties = {
  color: '#0a3a0a',
  textAlign: 'center',
  padding: 20,
  fontFamily: 'monospace',
  fontSize: 12,
};

// ── Auto-sell tab styles ──

const autoSellDescStyle: CSSProperties = {
  color: '#4a8a4a',
  fontSize: 10,
  fontFamily: 'monospace',
  marginBottom: 10,
  lineHeight: 1.5,
};

const rarityToggleListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  marginBottom: 12,
};

const rarityToggleBtnStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 10px',
  fontSize: 12,
  background: 'transparent',
  color: '#2a4a2a',
  border: '1px solid #0a2a0a',
  borderRadius: 0,
  fontFamily: 'monospace',
  cursor: 'pointer',
  letterSpacing: 1,
  textAlign: 'left',
  transition: 'background 0.1s, border-color 0.1s',
};

const autoSellFooterStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 0',
  borderTop: '1px solid #0a2a0a',
  gap: 8,
};

const autoSellBtnStyle: CSSProperties = {
  padding: '4px 12px',
  fontSize: 11,
  background: 'transparent',
  color: '#2a5a2a',
  border: '1px solid #0a3a0a',
  borderRadius: 0,
  fontFamily: 'monospace',
  cursor: 'not-allowed',
  letterSpacing: 1,
};

const autoSellBtnActiveStyle: CSSProperties = {
  ...autoSellBtnStyle,
  color: '#ffd700',
  border: '1px solid #8a6a1a',
  cursor: 'pointer',
  textShadow: '0 0 6px #ffd70066',
};

const autoSellHintStyle: CSSProperties = {
  color: '#2a4a2a',
  fontSize: 9,
  fontFamily: 'monospace',
  lineHeight: 1.6,
  whiteSpace: 'pre-line',
  marginTop: 8,
  paddingTop: 8,
  borderTop: '1px solid #0a1a0a',
};

// ── Item detail / stat styles ──

const itemDetailStyle: CSSProperties = {
  width: '100%',
  padding: '6px 0 4px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const itemDescStyle: CSSProperties = {
  color: '#4a8a5a',
  fontSize: 10,
  fontFamily: 'monospace',
  fontStyle: 'italic',
  lineHeight: 1.4,
};

const chipsRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 4,
};

const statChipStyle: CSSProperties = {
  background: '#001a08',
  border: '1px solid #1a5a2a',
  color: '#66ffaa',
  fontSize: 9,
  padding: '1px 5px',
  fontFamily: 'monospace',
  letterSpacing: 0.5,
};

const effectChipStyle: CSSProperties = {
  background: '#1a0800',
  border: '1px solid #5a2a0a',
  color: '#ffaa44',
  fontSize: 9,
  padding: '1px 5px',
  fontFamily: 'monospace',
  letterSpacing: 0.5,
};

const effectChipDefStyle: CSSProperties = {
  background: '#000d1a',
  border: '1px solid #0a2a5a',
  color: '#44aaff',
  fontSize: 9,
  padding: '1px 5px',
  fontFamily: 'monospace',
  letterSpacing: 0.5,
};

const compareRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 4,
  alignItems: 'center',
  paddingTop: 2,
  borderTop: '1px solid #0a1a0a',
};

const compareLabelStyle: CSSProperties = {
  color: '#2a5a3a',
  fontSize: 9,
  fontFamily: 'monospace',
};

const compareDiffStyle: CSSProperties = {
  fontSize: 9,
  fontFamily: 'monospace',
};

const statBarStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 6,
  padding: '4px 8px 6px',
  borderBottom: '1px solid #0a2a0a',
  background: '#050f05',
  fontFamily: 'monospace',
  fontSize: 10,
};

const statPillStyle: CSSProperties = {
  color: '#aaccaa',
  letterSpacing: 0.3,
};

const rangedBadgeStyle: CSSProperties = {
  color: '#88ccff',
  fontSize: 9,
  marginLeft: 4,
  background: '#001a2a',
  border: '1px solid #1a4a6a',
  padding: '0 4px',
  fontFamily: 'monospace',
  letterSpacing: 0.3,
};

const rangedLabelStyle: CSSProperties = {
  color: '#88ccff',
  fontSize: 10,
  fontFamily: 'monospace',
  fontWeight: 'bold',
  padding: '2px 6px',
  background: '#001a2a',
  border: '1px solid #1a4a6a',
  marginBottom: 2,
};

const classRestrictionStyle: CSSProperties = {
  color: '#ffaa44',
  fontSize: 9,
  fontFamily: 'monospace',
  fontStyle: 'italic',
};

const skillBonusStyle: CSSProperties = {
  color: '#88ccff',
  fontSize: 9,
  marginLeft: 4,
  fontFamily: 'monospace',
};

const skillChipStyle: CSSProperties = {
  background: '#0a0a1a',
  border: '1px solid #2a3a5a',
  color: '#88ccff',
  fontSize: 9,
  padding: '1px 5px',
  fontFamily: 'monospace',
  letterSpacing: 0.5,
};

const elementDetailStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 3,
  fontSize: 10,
  fontFamily: 'monospace',
  padding: '3px 6px',
  background: '#0a0a0a',
  border: '1px solid #1a1a2a',
  marginBottom: 2,
};
