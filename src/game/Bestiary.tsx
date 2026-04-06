import { useState, useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { BloodlineData, BestiaryEntry } from './types';
import { MONSTER_DEFS, BOSS_DEFS } from './constants';
import { ZONE_MONSTERS, ZONE_BOSSES } from './zones';
import { getAllVariantNames } from './variants';
import { FeatureTutorial, useFeatureTutorial, BESTIARY_TUTORIAL } from './FeatureTutorial';
import { BESTIARY_BOUNTIES, getBountyProgress, isBountyComplete, BOUNTY_TIER_COLORS } from './necropolis';

interface BestiaryProps {
  bloodline: BloodlineData;
  communalKills?: Record<string, number>;
  onClose: () => void;
}

type BestiaryTab = 'monsters' | 'bosses' | 'milestones';

// ── Personal Milestones — achievable in 1-3 runs ──
interface PersonalMilestone {
  id: string;
  title: string;
  description: string;
  check: (bestiary: Record<string, BestiaryEntry>, cumulative: BloodlineData['cumulative']) => { done: boolean; current: number; target: number };
  reward: string;
  color: string;
}

const PERSONAL_MILESTONES: PersonalMilestone[] = [
  {
    id: 'first_blood', title: 'First Blood', description: 'Kill any monster',
    check: (b) => { const kills = Object.values(b).reduce((s, e) => s + (e.killCount ?? 0), 0); return { done: kills >= 1, current: Math.min(kills, 1), target: 1 }; },
    reward: 'You did it! Every kill makes you stronger.', color: '#33ff66',
  },
  {
    id: 'rat_slayer', title: 'Rat Slayer', description: 'Kill 5 Rats',
    check: (b) => { const k = b['Rat']?.killCount ?? 0; return { done: k >= 5, current: Math.min(k, 5), target: 5 }; },
    reward: 'The vermin fear you.', color: '#c8875a',
  },
  {
    id: 'bug_stomper', title: 'Bug Stomper', description: 'Kill 3 Cave Beetles',
    check: (b) => { const k = b['Cave Beetle']?.killCount ?? 0; return { done: k >= 3, current: Math.min(k, 3), target: 3 }; },
    reward: 'Crunch.', color: '#886633',
  },
  {
    id: 'explorer', title: 'Explorer', description: 'Discover 5 different monsters',
    check: (b) => { const found = Object.values(b).filter(e => e.encountered).length; return { done: found >= 5, current: Math.min(found, 5), target: 5 }; },
    reward: 'You\'re learning what lurks in the dark.', color: '#44bbff',
  },
  {
    id: 'monster_hunter', title: 'Monster Hunter', description: 'Kill 20 monsters total',
    check: (b) => { const k = Object.values(b).reduce((s, e) => s + (e.killCount ?? 0), 0); return { done: k >= 20, current: Math.min(k, 20), target: 20 }; },
    reward: 'The dungeon knows your name.', color: '#ff6644',
  },
  {
    id: 'bat_bane', title: 'Bat Bane', description: 'Kill 5 Bats',
    check: (b) => { const k = b['Bat']?.killCount ?? 0; return { done: k >= 5, current: Math.min(k, 5), target: 5 }; },
    reward: 'No more screeching.', color: '#b06840',
  },
  {
    id: 'kobold_crusher', title: 'Kobold Crusher', description: 'Kill 5 Kobolds',
    check: (b) => { const k = b['Kobold']?.killCount ?? 0; return { done: k >= 5, current: Math.min(k, 5), target: 5 }; },
    reward: 'Their fire can\'t stop you.', color: '#ff7b5e',
  },
  {
    id: 'variant_finder', title: 'Variant Finder', description: 'Discover 10 different creatures',
    check: (b) => { const found = Object.values(b).filter(e => e.encountered).length; return { done: found >= 10, current: Math.min(found, 10), target: 10 }; },
    reward: 'The bestiary grows...', color: '#c49eff',
  },
  {
    id: 'slaughter_50', title: 'Bloodthirsty', description: 'Kill 50 monsters total',
    check: (b) => { const k = Object.values(b).reduce((s, e) => s + (e.killCount ?? 0), 0); return { done: k >= 50, current: Math.min(k, 50), target: 50 }; },
    reward: 'The dungeon bleeds.', color: '#ff3344',
  },
  {
    id: 'boss_slayer', title: 'Boss Slayer', description: 'Defeat any boss',
    check: (b) => { const k = Object.values(b).filter(e => e.isBoss && e.killCount > 0).length; return { done: k >= 1, current: Math.min(k, 1), target: 1 }; },
    reward: 'The mighty fall before you.', color: '#ffd700',
  },
];

/** Group structure: base monster -> all variant names */
interface MonsterGroup {
  baseName: string;
  char: string;
  baseColor: string;
  variantNames: string[]; // includes the base name
  isBoss?: boolean;
}

export function Bestiary({ bloodline, communalKills = {}, onClose }: BestiaryProps) {
  const [tab, setTab] = useState<BestiaryTab>('monsters');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [showTutorial, dismissTutorial] = useFeatureTutorial('tutorial_bestiary');

  const bestiary = bloodline.bestiary ?? {};

  // Build grouped monster data
  const { monsterGroups, bossGroups, totalVariants, totalFound } = useMemo(() => {
    const allDefs = [...MONSTER_DEFS, ...Object.values(ZONE_MONSTERS).flat()];
    const allBossDefs = [...BOSS_DEFS, ...Object.values(ZONE_BOSSES).flat()];

    // Dedupe by name
    const seenMonsters = new Set<string>();
    const seenBosses = new Set<string>();
    const mGroups: MonsterGroup[] = [];
    const bGroups: MonsterGroup[] = [];

    for (const def of allDefs) {
      if (seenMonsters.has(def.name)) continue;
      seenMonsters.add(def.name);
      const variantNames = getAllVariantNames(def.name);
      mGroups.push({
        baseName: def.name,
        char: def.char,
        baseColor: def.color,
        variantNames,
      });
    }

    for (const def of allBossDefs) {
      if (seenBosses.has(def.name)) continue;
      seenBosses.add(def.name);
      // Bosses don't get variants
      bGroups.push({
        baseName: def.name,
        char: def.char,
        baseColor: def.color,
        variantNames: [def.name],
        isBoss: true,
      });
    }

    let tv = 0;
    let tf = 0;
    for (const g of [...mGroups, ...bGroups]) {
      tv += g.variantNames.length;
      for (const vn of g.variantNames) {
        if (bestiary[vn]?.encountered) tf++;
      }
    }

    return { monsterGroups: mGroups, bossGroups: bGroups, totalVariants: tv, totalFound: tf };
  }, [bestiary]);

  const groups = tab === 'monsters' ? monsterGroups : bossGroups;

  const selGroup = selectedGroup ? groups.find(g => g.baseName === selectedGroup) : null;
  const selEntry = selectedVariant ? bestiary[selectedVariant] : null;

  // Find the base def for abilities display
  const allDefs = [...MONSTER_DEFS, ...BOSS_DEFS, ...Object.values(ZONE_MONSTERS).flat(), ...Object.values(ZONE_BOSSES).flat()];
  const selectedBaseDef = selectedGroup ? allDefs.find(d => d.name === selectedGroup) : null;

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <div style={headerStyle}>
          <span style={titleStyle}>~ BESTIARY ~</span>
          <span style={countStyle}>{totalFound}/{totalVariants}</span>
          <button style={closeBtnStyle} onClick={onClose}>[X]</button>
        </div>

        <div style={tabBarStyle}>
          <button
            style={tab === 'monsters' ? tabActiveStyle : tabStyle}
            onClick={() => { setTab('monsters'); setSelectedGroup(null); setSelectedVariant(null); }}
          >
            Monsters
          </button>
          <button
            style={tab === 'bosses' ? tabActiveStyle : tabStyle}
            onClick={() => { setTab('bosses'); setSelectedGroup(null); setSelectedVariant(null); }}
          >
            Bosses
          </button>
          <button
            style={tab === 'milestones' ? { ...tabActiveStyle, color: '#ffd700', borderBottomColor: '#ffd700' } : tabStyle}
            onClick={() => { setTab('milestones'); setSelectedGroup(null); setSelectedVariant(null); }}
          >
            Goals
          </button>
        </div>

        <div style={contentStyle}>
          {tab === 'milestones' ? (
            <MilestonesList bestiary={bestiary} cumulative={bloodline.cumulative} />
          ) : selectedVariant && selEntry?.encountered ? (
            // Show variant detail
            <VariantDetail
              entry={selEntry}
              baseDef={selectedBaseDef ?? undefined}
              onBack={() => setSelectedVariant(null)}
            />
          ) : selGroup ? (
            // Show group detail — all variants of one base monster
            <GroupDetail
              group={selGroup}
              bestiary={bestiary}
              communalKills={communalKills}
              baseDef={selectedBaseDef ?? undefined}
              onBack={() => { setSelectedGroup(null); setSelectedVariant(null); }}
              onSelectVariant={setSelectedVariant}
            />
          ) : (
            // Show grouped list
            <GroupList
              groups={groups}
              bestiary={bestiary}
              onSelect={(name) => { setSelectedGroup(name); setSelectedVariant(null); }}
            />
          )}
        </div>
      </div>
      {showTutorial && (
        <FeatureTutorial
          storageKey="tutorial_bestiary"
          pages={BESTIARY_TUTORIAL}
          accentColor="#ff6644"
          heading="~ BESTIARY ~"
          onDone={dismissTutorial}
        />
      )}
    </div>
  );
}

/** List of base monsters with variant progress */
function GroupList({ groups, bestiary, onSelect }: {
  groups: MonsterGroup[];
  bestiary: Record<string, BestiaryEntry>;
  onSelect: (baseName: string) => void;
}) {
  return (
    <>
      {groups.map(group => {
        const foundCount = group.variantNames.filter(vn => bestiary[vn]?.encountered).length;
        const anyFound = foundCount > 0;
        // Get the base entry or any found variant entry for char display
        const baseEntry = bestiary[group.baseName];
        return (
          <button
            key={group.baseName}
            style={anyFound ? monsterRowFoundStyle : monsterRowStyle}
            onClick={() => { if (anyFound) onSelect(group.baseName); }}
          >
            {/* Monster character in its base color */}
            <span style={{
              color: anyFound ? (baseEntry?.color ?? group.baseColor) : '#1a3a1a',
              fontSize: 14, fontWeight: 'bold', fontFamily: 'monospace',
              minWidth: 18, textAlign: 'center',
              textShadow: anyFound ? `0 0 4px ${group.baseColor}44` : 'none',
            }}>
              {anyFound ? group.char : '?'}
            </span>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ color: anyFound ? '#33ff66' : '#2a2a3a', fontSize: 11 }}>
                {anyFound ? group.baseName : '???'}
              </span>
              {anyFound && group.variantNames.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {/* Mini variant dots showing found colors */}
                  <div style={{ display: 'flex', gap: 1 }}>
                    {group.variantNames.slice(0, 12).map(vn => {
                      const entry = bestiary[vn];
                      return (
                        <span key={vn} style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: entry?.encountered ? (entry.color ?? group.baseColor) : '#1a1a2a',
                          display: 'inline-block',
                        }} />
                      );
                    })}
                    {group.variantNames.length > 12 && (
                      <span style={{ color: '#555', fontSize: 8 }}>+{group.variantNames.length - 12}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <span style={{ color: anyFound ? '#8a7aaa' : '#1a1a2a', fontSize: 10, fontFamily: 'monospace' }}>
              {anyFound ? `${foundCount}/${group.variantNames.length}` : ''}
            </span>
          </button>
        );
      })}
    </>
  );
}

/** Detail view for a base monster showing all its variant colors */
function GroupDetail({ group, bestiary, communalKills, baseDef, onBack, onSelectVariant }: {
  group: MonsterGroup;
  bestiary: Record<string, BestiaryEntry>;
  communalKills: Record<string, number>;
  baseDef?: { name: string; stats: { hp: number; maxHp: number; attack: number; defense: number; speed: number }; xpValue: number; isBoss?: boolean; abilities?: unknown[] };
  onBack: () => void;
  onSelectVariant: (name: string) => void;
}) {
  const foundCount = group.variantNames.filter(vn => bestiary[vn]?.encountered).length;
  const totalKills = group.variantNames.reduce((sum, vn) => sum + (bestiary[vn]?.killCount ?? 0), 0);

  // Find bounties for this monster
  const bounties = BESTIARY_BOUNTIES.filter(b => b.monsterName === group.baseName);
  const communalCount = communalKills[group.baseName] ?? 0;

  return (
    <div style={{ padding: 4 }}>
      <button style={backBtnStyle} onClick={onBack}>{'< Back'}</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{
          color: group.baseColor, fontSize: 24, fontWeight: 'bold', fontFamily: 'monospace',
          textShadow: `0 0 8px ${group.baseColor}44`,
        }}>
          {group.char}
        </span>
        <div>
          <div style={detailNameStyle}>{group.isBoss ? '\u2605 ' : ''}{group.baseName}</div>
          <div style={{ color: '#8a7aaa', fontFamily: 'monospace', fontSize: 10 }}>
            {foundCount}/{group.variantNames.length} variants found &middot; {totalKills.toLocaleString()} your kills
          </div>
          {communalCount > 0 && (
            <div style={{ color: '#ffaa33', fontFamily: 'monospace', fontSize: 10 }}>
              {communalCount.toLocaleString()} community kills
            </div>
          )}
        </div>
      </div>

      {/* Community bounties for this monster */}
      {bounties.length > 0 && (
        <div style={{ marginBottom: 10, borderTop: '1px solid #0a3a0a', paddingTop: 8 }}>
          <div style={{ color: '#ffaa33', fontSize: 10, fontWeight: 'bold', marginBottom: 4, fontFamily: 'monospace' }}>
            COMMUNITY BOUNTIES
          </div>
          {bounties.map(bounty => {
            const progress = getBountyProgress(bounty, communalKills);
            const done = isBountyComplete(bounty, communalKills);
            const pct = Math.min(100, (progress / bounty.killsRequired) * 100);
            const tierColor = BOUNTY_TIER_COLORS[bounty.tier] ?? '#ffffff';
            return (
              <div key={bounty.id} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ color: done ? tierColor : '#888', fontFamily: 'monospace', fontSize: 10 }}>
                    {done ? '✓ ' : ''}{bounty.killsRequired.toLocaleString()} kills — {bounty.rewardDescription}
                  </span>
                </div>
                <div style={{ background: '#0a0a0a', height: 4, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: done ? tierColor : '#443300', borderRadius: 2, transition: 'width 0.3s' }} />
                </div>
                <div style={{ color: '#555', fontFamily: 'monospace', fontSize: 9, marginTop: 1 }}>
                  {progress.toLocaleString()} / {bounty.killsRequired.toLocaleString()} ({pct.toFixed(1)}%)
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* Base stats */}
      {baseDef && (
        <div style={statBlockStyle}>
          <div style={detailStatStyle}><span style={{ color: '#ff4444' }}>HP</span> {baseDef.stats.maxHp}</div>
          <div style={detailStatStyle}><span style={{ color: '#ff8844' }}>ATK</span> {baseDef.stats.attack}</div>
          <div style={detailStatStyle}><span style={{ color: '#4488ff' }}>DEF</span> {baseDef.stats.defense}</div>
          <div style={detailStatStyle}><span style={{ color: '#44ffcc' }}>SPD</span> {baseDef.stats.speed}</div>
          <div style={detailStatStyle}><span style={{ color: '#cc77ff' }}>XP</span> {baseDef.xpValue}</div>
        </div>
      )}

      {/* Abilities */}
      {baseDef?.abilities && (baseDef.abilities as { type: string }[]).length > 0 && (
        <div style={abilitySectionStyle}>
          <div style={{ color: '#c49eff', fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>Abilities:</div>
          {(baseDef.abilities as { type: string }[]).map((a, i) => (
            <div key={i} style={abilityTagStyle}>
              {ABILITY_LABELS[a.type] ?? a.type}
            </div>
          ))}
        </div>
      )}

      {/* Variant grid */}
      <div style={{ marginTop: 8, borderTop: '1px solid #0a3a0a', paddingTop: 8 }}>
        <div style={{ color: '#33ff66', fontSize: 10, fontWeight: 'bold', marginBottom: 6, fontFamily: 'monospace' }}>
          VARIANTS ({foundCount}/{group.variantNames.length})
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {group.variantNames.map(vn => {
            const entry = bestiary[vn];
            const found = entry?.encountered;
            return (
              <button
                key={vn}
                style={{
                  width: 32, height: 32, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  background: found ? '#080808' : '#050505',
                  border: `1px solid ${found ? (entry?.color ?? group.baseColor) + '55' : '#111'}`,
                  cursor: found ? 'pointer' : 'default',
                  padding: 0,
                }}
                onClick={() => { if (found) onSelectVariant(vn); }}
                title={found ? vn : '???'}
              >
                <span style={{
                  color: found ? (entry?.color ?? group.baseColor) : '#111',
                  fontSize: 14, fontWeight: 'bold', fontFamily: 'monospace',
                  lineHeight: 1,
                  textShadow: found ? `0 0 4px ${entry?.color ?? group.baseColor}33` : 'none',
                }}>
                  {group.char}
                </span>
                {found && (
                  <span style={{
                    fontSize: 5, color: '#555', fontFamily: 'monospace', lineHeight: 1,
                    overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 30, textOverflow: 'ellipsis',
                  }}>
                    {vn === group.baseName ? 'base' : vn.split(' ')[0]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Detail view for a specific variant */
function VariantDetail({ entry, baseDef, onBack }: {
  entry: BestiaryEntry;
  baseDef?: { name: string; stats: { hp: number; maxHp: number; attack: number; defense: number; speed: number }; xpValue: number; isBoss?: boolean; abilities?: unknown[] };
  onBack: () => void;
}) {
  const stats = entry.stats;

  return (
    <div style={{ padding: 4 }}>
      <button style={backBtnStyle} onClick={onBack}>{'< Back'}</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{
          color: entry.color ?? '#33ff66', fontSize: 24, fontWeight: 'bold', fontFamily: 'monospace',
          textShadow: `0 0 8px ${entry.color ?? '#33ff66'}44`,
        }}>
          {entry.char ?? '?'}
        </span>
        <div style={detailNameStyle}>{entry.isBoss ? '\u2605 ' : ''}{entry.name}</div>
      </div>

      {stats && (
        <div style={statBlockStyle}>
          <div style={detailStatStyle}><span style={{ color: '#ff4444' }}>HP</span> {stats.maxHp}</div>
          <div style={detailStatStyle}><span style={{ color: '#ff8844' }}>ATK</span> {stats.attack}</div>
          <div style={detailStatStyle}><span style={{ color: '#4488ff' }}>DEF</span> {stats.defense}</div>
          <div style={detailStatStyle}><span style={{ color: '#44ffcc' }}>SPD</span> {stats.speed}</div>
          {baseDef?.xpValue && <div style={detailStatStyle}><span style={{ color: '#cc77ff' }}>XP</span> {baseDef.xpValue}</div>}
        </div>
      )}

      <div style={killCountStyle}>
        Defeated: {entry.killCount} time{entry.killCount !== 1 ? 's' : ''}
      </div>

      {baseDef?.abilities && (baseDef.abilities as { type: string }[]).length > 0 && (
        <div style={abilitySectionStyle}>
          <div style={{ color: '#c49eff', fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>Abilities:</div>
          {(baseDef.abilities as { type: string }[]).map((a, i) => (
            <div key={i} style={abilityTagStyle}>
              {ABILITY_LABELS[a.type] ?? a.type}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Personal milestones — achievable goals for individual players */
function MilestonesList({ bestiary, cumulative }: {
  bestiary: Record<string, BestiaryEntry>;
  cumulative: BloodlineData['cumulative'];
}) {
  const completed = PERSONAL_MILESTONES.filter(m => m.check(bestiary, cumulative).done).length;

  return (
    <div style={{ padding: 4 }}>
      <div style={{ color: '#ffd700', fontSize: 11, fontFamily: 'monospace', marginBottom: 8, textAlign: 'center' }}>
        {completed}/{PERSONAL_MILESTONES.length} completed
      </div>
      {PERSONAL_MILESTONES.map(milestone => {
        const { done, current, target } = milestone.check(bestiary, cumulative);
        const pct = Math.min(100, (current / target) * 100);
        return (
          <div key={milestone.id} style={{
            padding: '8px 10px', marginBottom: 6,
            background: done ? '#0a1a0a' : '#050505',
            border: `1px solid ${done ? milestone.color + '55' : '#111'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <span style={{
                color: done ? milestone.color : '#888',
                fontSize: 12, fontWeight: 'bold', fontFamily: 'monospace',
              }}>
                {done ? '\u2713 ' : ''}{milestone.title}
              </span>
              <span style={{
                color: done ? '#33ff66' : '#555',
                fontSize: 10, fontFamily: 'monospace',
              }}>
                {current}/{target}
              </span>
            </div>
            <div style={{ color: done ? '#88aa88' : '#555', fontSize: 10, fontFamily: 'monospace', marginBottom: 4 }}>
              {milestone.description}
            </div>
            {!done && (
              <div style={{ background: '#0a0a0a', height: 3, borderRadius: 2, overflow: 'hidden', marginBottom: 2 }}>
                <div style={{ width: `${pct}%`, height: '100%', background: milestone.color + '88', borderRadius: 2 }} />
              </div>
            )}
            {done && (
              <div style={{ color: milestone.color, fontSize: 10, fontFamily: 'monospace', fontStyle: 'italic' }}>
                {milestone.reward}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Ability display labels
const ABILITY_LABELS: Record<string, string> = {
  poisonAttack: 'Poison Attack',
  stunAttack: 'Stun Attack',
  bleedAttack: 'Bleed Attack',
  freezeAttack: 'Freeze Attack',
  chargeAttack: 'Charge Attack',
  selfHeal: 'Self Heal',
  enrage: 'Enrage',
  dodge: 'Dodge',
  callForHelp: 'Call for Help',
  drainLife: 'Drain Life',
};

// Styles
const overlayStyle: CSSProperties = {
  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 12,
};
const panelStyle: CSSProperties = {
  width: '100%', maxWidth: 380, maxHeight: '90%', background: '#000',
  border: '1px solid #1a5a2a', display: 'flex', flexDirection: 'column', overflow: 'hidden',
};
const headerStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', padding: '8px 10px', borderBottom: '1px solid #0a3a0a', gap: 8,
};
const titleStyle: CSSProperties = {
  color: '#33ff66', fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold', flex: 1, textShadow: '0 0 8px #33ff6633',
};
const countStyle: CSSProperties = {
  color: '#1a8a3a', fontFamily: 'monospace', fontSize: 11, opacity: 0.7,
};
const closeBtnStyle: CSSProperties = {
  padding: '4px 6px', fontSize: 12, fontWeight: 'bold', background: 'transparent',
  color: '#ff3333', border: '1px solid #4a0a0a', fontFamily: 'monospace', cursor: 'pointer',
};
const tabBarStyle: CSSProperties = { display: 'flex', borderBottom: '1px solid #0a3a0a' };
const tabStyle: CSSProperties = {
  flex: 1, padding: '6px 0', fontSize: 11, fontFamily: 'monospace', background: 'transparent',
  color: '#1a5a2a', border: 'none', cursor: 'pointer', textAlign: 'center',
};
const tabActiveStyle: CSSProperties = { ...tabStyle, color: '#33ff66', borderBottom: '2px solid #33ff66' };
const contentStyle: CSSProperties = { flex: 1, overflowY: 'auto', padding: 4 };
const monsterRowStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 6px', width: '100%',
  fontFamily: 'monospace', background: 'transparent', border: 'none',
  borderBottom: '1px solid #0a1a0a', cursor: 'default', textAlign: 'left',
};
const monsterRowFoundStyle: CSSProperties = {
  ...monsterRowStyle, cursor: 'pointer', background: '#040a04',
};
const backBtnStyle: CSSProperties = {
  padding: '4px 8px', fontSize: 11, fontFamily: 'monospace', background: 'transparent',
  color: '#33ff66', border: '1px solid #1a5a2a', cursor: 'pointer', marginBottom: 8,
};
const detailNameStyle: CSSProperties = {
  color: '#33ff66', fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold',
  textShadow: '0 0 8px #33ff6633',
};
const statBlockStyle: CSSProperties = {
  display: 'flex', gap: 12, flexWrap: 'wrap', padding: '8px 0', borderTop: '1px solid #0a3a0a',
  borderBottom: '1px solid #0a3a0a', marginBottom: 8,
};
const detailStatStyle: CSSProperties = {
  fontFamily: 'monospace', fontSize: 11, color: '#aaaacc',
};
const killCountStyle: CSSProperties = {
  color: '#8a7aaa', fontFamily: 'monospace', fontSize: 11, marginBottom: 8,
};
const abilitySectionStyle: CSSProperties = {
  padding: '8px 0', borderTop: '1px solid #0a3a0a',
};
const abilityTagStyle: CSSProperties = {
  display: 'inline-block', padding: '2px 6px', margin: '2px 4px 2px 0',
  background: '#0a0a1a', border: '1px solid #2a1a4a', color: '#c49eff',
  fontFamily: 'monospace', fontSize: 10,
};
