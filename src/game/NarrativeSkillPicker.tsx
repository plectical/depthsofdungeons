import type { CSSProperties } from 'react';
import type { GameState, SkillName } from './types';
import { getSkillModifier, getGearSkillBonus, getModifierDisplay, formatSkillName } from './story/characterSkills';
import { chooseNarrativeSkill } from './engine';
import { cloneState } from './utils';
import {
  UI_COLORS,
  overlayStyle as baseOverlayStyle,
  modalWrapperStyle,
  primaryFrameStyle,
  frameHeaderStyle,
  secondaryFrameStyle,
} from './uiFrameStyles';

const ALL_SKILLS: SkillName[] = ['stealth', 'diplomacy', 'athletics', 'awareness', 'lore', 'survival'];

const SKILL_ICONS: Record<SkillName, string> = {
  stealth: '\u{1F977}',
  diplomacy: '\u{1F91D}',
  athletics: '\u{1F3CB}',
  awareness: '\u{1F441}',
  lore: '\u{1F4D6}',
  survival: '\u{1F332}',
};

interface NarrativeSkillPickerProps {
  state: GameState;
  onChange: (s: GameState) => void;
}

export function NarrativeSkillPicker({ state, onChange }: NarrativeSkillPickerProps) {
  const skills = state.skills;
  if (!skills) return null;

  const handlePick = (skill: SkillName) => {
    const next = cloneState(state);
    if (chooseNarrativeSkill(next, skill)) {
      onChange(next);
    }
  };

  return (
    <div style={baseOverlayStyle}>
      <div style={{ ...modalWrapperStyle, maxWidth: 320 }}>
        <div style={primaryFrameStyle}>
          <div style={frameHeaderStyle}>LEVEL UP</div>
          <div style={subtitleStyle}>Choose a skill to improve</div>

          <div style={skillListStyle}>
            {ALL_SKILLS.map((skill) => {
              const base = skills[skill];
              const gear = getGearSkillBonus(state, skill);
              const effective = base + gear;
              const currentMod = getSkillModifier(effective);
              const nextMod = getSkillModifier(Math.min(20, base + 1) + gear);
              const modImproves = nextMod > currentMod;
              const atCap = base >= 20;

              return (
                <button
                  key={skill}
                  style={skillRowBtnStyle}
                  onClick={() => !atCap && handlePick(skill)}
                  disabled={atCap}
                >
                  <span style={skillIconStyle}>{SKILL_ICONS[skill]}</span>
                  <span style={skillNameColStyle}>{formatSkillName(skill)}</span>
                  <span style={skillValueColStyle}>
                    {base}{gear > 0 ? <span style={{ color: UI_COLORS.success, fontSize: 8 }}> +{gear}</span> : ''}
                  </span>
                  <span style={{
                    ...modColStyle,
                    color: modImproves ? UI_COLORS.gold : UI_COLORS.textMuted,
                  }}>
                    {atCap ? 'MAX' : `${getModifierDisplay(currentMod)}`}
                    {!atCap && modImproves && (
                      <span style={{ color: UI_COLORS.gold, fontSize: 8 }}> {'\u2192'} {getModifierDisplay(nextMod)}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div style={secondaryFrameStyle}>
          <div style={hintStyle}>
            Higher skills improve your modifier for narrative skill checks.
          </div>
        </div>
      </div>
    </div>
  );
}

const subtitleStyle: CSSProperties = {
  color: UI_COLORS.textHighlight,
  fontFamily: 'monospace',
  fontSize: 9,
  textAlign: 'center',
  marginBottom: 12,
  textTransform: 'uppercase',
  letterSpacing: 1,
};

const skillListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const skillRowBtnStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '7px 10px',
  background: UI_COLORS.bgDarker,
  border: 'none',
  boxShadow: `inset 0 0 0 1px ${UI_COLORS.borderOuter}`,
  cursor: 'pointer',
  fontFamily: 'monospace',
  fontSize: 11,
  color: UI_COLORS.textBright,
  textAlign: 'left',
  transition: 'box-shadow 0.1s',
};

const skillIconStyle: CSSProperties = {
  fontSize: 14,
  width: 20,
  textAlign: 'center',
  flexShrink: 0,
};

const skillNameColStyle: CSSProperties = {
  flex: 1,
  color: UI_COLORS.primary,
  fontWeight: 'bold',
  fontSize: 10,
};

const skillValueColStyle: CSSProperties = {
  width: 40,
  textAlign: 'right',
  color: UI_COLORS.textBright,
  fontSize: 11,
  fontWeight: 'bold',
};

const modColStyle: CSSProperties = {
  width: 60,
  textAlign: 'right',
  fontSize: 9,
};

const hintStyle: CSSProperties = {
  color: UI_COLORS.textMuted,
  fontFamily: 'monospace',
  fontSize: 9,
  textAlign: 'center',
  lineHeight: 1.5,
};
