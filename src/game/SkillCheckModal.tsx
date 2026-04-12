import { useState, useCallback } from 'react';
import type { CSSProperties } from 'react';
import type { SkillCheckResult, SkillName } from './types';
import {
  formatSkillName,
  getOutcomeLabel,
  getModifierDisplay,
  getDifficultyLabel,
} from './story/characterSkills';
import {
  UI_COLORS,
  overlayStyle as baseOverlayStyle,
  modalWrapperStyle,
  primaryFrameStyle,
  secondaryFrameStyle,
  frameHeaderStyle,
  frameSubheaderStyle,
  frameDescStyle,
  statRowContainerStyle,
  statRowStyle,
  statLabelStyle,
  statValueStyle,
  diceAreaStyle,
  diceBoxStyle,
  diceValueStyle,
  promptStyle,
  resultContainerStyle,
  resultTotalStyle,
  resultOutcomeStyle,
  buttonContainerStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  criticalStarsStyle,
  criticalFailStyle,
  getOutcomeColorFromPalette,
  cornerSize,
} from './uiFrameStyles';

interface SkillCheckModalProps {
  skill: SkillName;
  skillValue: number;
  gearBonus: number;
  target: number;
  onComplete: (result: SkillCheckResult) => void;
  onCancel?: () => void;
  description?: string;
  imageUrl?: string | null;
  successHint?: string;
  failureHint?: string;
}

// successHint/failureHint kept in interface for callers but not displayed pre-roll

const DICE_FACES = ['[1]', '[2]', '[3]', '[4]', '[5]', '[6]'];
const ROLL_DURATION = 1200;
const FRAME_INTERVAL = 60;

// Corner decorations
const cornerBase: CSSProperties = {
  position: 'absolute',
  width: cornerSize,
  height: cornerSize,
  background: UI_COLORS.primary,
  boxShadow: `0 0 4px ${UI_COLORS.primaryGlow}`,
  zIndex: 5,
};

const cornerTL: CSSProperties = { ...cornerBase, top: -2, left: -2 };
const cornerTR: CSSProperties = { ...cornerBase, top: -2, right: -2 };
const cornerBL: CSSProperties = { ...cornerBase, bottom: -2, left: -2 };
const cornerBR: CSSProperties = { ...cornerBase, bottom: -2, right: -2 };

export function SkillCheckModal({
  skill,
  skillValue,
  gearBonus,
  target,
  onComplete,
  onCancel,
  description,
  imageUrl,
  successHint: _successHint,
  failureHint: _failureHint,
}: SkillCheckModalProps) {
  void _successHint; void _failureHint;
  const [phase, setPhase] = useState<'ready' | 'rolling' | 'result'>('ready');
  const [die1Display, setDie1Display] = useState(0);
  const [die2Display, setDie2Display] = useState(0);
  const [result, setResult] = useState<SkillCheckResult | null>(null);

  const totalModifier = getSkillModifier(skillValue + gearBonus);

  const performRoll = useCallback(() => {
    setPhase('rolling');

    let elapsed = 0;
    const interval = setInterval(() => {
      setDie1Display(Math.floor(Math.random() * 6));
      setDie2Display(Math.floor(Math.random() * 6));
      elapsed += FRAME_INTERVAL;

      if (elapsed >= ROLL_DURATION) {
        clearInterval(interval);

        const die1 = Math.floor(Math.random() * 6) + 1;
        const die2 = Math.floor(Math.random() * 6) + 1;
        const total = die1 + die2 + totalModifier;

        const outcome = determineOutcome(total, target);
        const rollResult: SkillCheckResult = {
          roll: [die1, die2],
          modifier: totalModifier,
          total,
          outcome,
          skill,
          target,
        };

        setDie1Display(die1 - 1);
        setDie2Display(die2 - 1);
        setResult(rollResult);
        setPhase('result');
      }
    }, FRAME_INTERVAL);

    return () => clearInterval(interval);
  }, [skill, target, totalModifier]);

  const handleConfirm = () => {
    if (result) {
      onComplete(result);
    }
  };

  return (
    <div style={{ ...baseOverlayStyle, zIndex: 80 }}>
      <div style={{ ...modalWrapperStyle, maxWidth: 280 }}>
        {/* Main frame */}
        <div style={primaryFrameStyle}>
          {/* Corner decorations */}
          <div style={cornerTL} />
          <div style={cornerTR} />
          <div style={cornerBL} />
          <div style={cornerBR} />

          {/* Header */}
          <div style={frameHeaderStyle}>SKILL CHECK</div>
          <div style={frameSubheaderStyle}>{formatSkillName(skill)}</div>

          {/* AI Generated Art */}
          {imageUrl && (
            <div style={{
              width: '100%',
              marginBottom: 8,
              borderRadius: 4,
              overflow: 'hidden',
              border: `1px solid ${UI_COLORS.primary}44`,
              boxShadow: `0 0 8px ${UI_COLORS.primaryGlow}33`,
            }}>
              <img
                src={imageUrl}
                alt={description || 'Skill check scene'}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  imageRendering: 'pixelated',
                }}
              />
            </div>
          )}

          {/* Description */}
          {description && <div style={frameDescStyle}>{description}</div>}

          {/* Stats panel */}
          <div style={statRowContainerStyle}>
            <div style={statRowStyle}>
              <span style={statLabelStyle}>Skill:</span>
              <span style={statValueStyle}>
                {skillValue}
                {gearBonus > 0 ? ` (+${gearBonus})` : ''}
              </span>
            </div>
            <div style={statRowStyle}>
              <span style={statLabelStyle}>Modifier:</span>
              <span style={statValueStyle}>{getModifierDisplay(totalModifier)}</span>
            </div>
            <div style={statRowStyle}>
              <span style={statLabelStyle}>Target:</span>
              <span style={statValueStyle}>
                {target}+ ({getDifficultyLabel(target)})
              </span>
            </div>
          </div>

          {/* Dice display */}
          <div style={diceAreaStyle}>
            <span style={diceBoxStyle}>
              <span
                style={{
                  ...diceValueStyle,
                  color: phase === 'rolling' ? UI_COLORS.primary : '#fff',
                }}
              >
                {DICE_FACES[die1Display]}
              </span>
            </span>
            <span style={diceBoxStyle}>
              <span
                style={{
                  ...diceValueStyle,
                  color: phase === 'rolling' ? UI_COLORS.primary : '#fff',
                }}
              >
                {DICE_FACES[die2Display]}
              </span>
            </span>
            {phase === 'result' && (
              <span style={modifierDisplayStyle}>{getModifierDisplay(totalModifier)}</span>
            )}
          </div>

          {/* Status text */}
          {phase === 'ready' && <div style={promptStyle}>Press ROLL to test your fate</div>}

          {phase === 'rolling' && <div style={rollingTextStyle}>Rolling...</div>}

          {phase === 'result' && result && (
            <div style={resultContainerStyle}>
              <div style={resultTotalStyle}>
                Total: {result.roll[0]} + {result.roll[1]} {getModifierDisplay(totalModifier)} ={' '}
                {result.total}
              </div>
              <div style={{ ...resultOutcomeStyle, color: getOutcomeColorFromPalette(result.outcome) }}>
                {getOutcomeLabel(result.outcome).toUpperCase()}
              </div>
              {result.outcome === 'critical' && <div style={criticalStarsStyle}>★ ★ ★</div>}
              {result.outcome === 'critical_fail' && <div style={criticalFailStyle}>✗ ✗ ✗</div>}
            </div>
          )}
        </div>

        {/* Buttons frame */}
        <div style={secondaryFrameStyle}>
          <div style={buttonContainerStyle}>
            {phase === 'ready' && (
              <>
                <button data-skill-check-roll="true" style={primaryButtonStyle} onClick={performRoll}>
                  [ ROLL ]
                </button>
                {onCancel && (
                  <button style={secondaryButtonStyle} onClick={onCancel}>
                    [ CANCEL ]
                  </button>
                )}
              </>
            )}
            {phase === 'result' && (
              <button data-skill-check-continue="true" style={primaryButtonStyle} onClick={handleConfirm}>
                [ CONTINUE ]
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getSkillModifier(skillValue: number): number {
  if (skillValue <= 3) return -2;
  if (skillValue <= 6) return -1;
  if (skillValue <= 9) return 0;
  if (skillValue <= 12) return 1;
  if (skillValue <= 15) return 2;
  if (skillValue <= 18) return 3;
  return 4;
}

function determineOutcome(total: number, target: number): SkillCheckResult['outcome'] {
  if (total <= 3) return 'critical_fail';
  if (total < target - 2) return 'fail';
  if (total < target) return 'partial';
  if (total >= 12) return 'critical';
  return 'success';
}

const modifierDisplayStyle: CSSProperties = {
  color: UI_COLORS.textHighlight,
  fontSize: 14,
  fontWeight: 'bold',
  fontFamily: 'monospace',
  marginLeft: 6,
};

const rollingTextStyle: CSSProperties = {
  color: UI_COLORS.primary,
  fontFamily: 'monospace',
  fontSize: 11,
  textAlign: 'center',
  padding: '4px 0',
  textShadow: `0 0 6px ${UI_COLORS.primaryGlow}`,
};
