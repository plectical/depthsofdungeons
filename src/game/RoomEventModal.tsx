// ══════════════════════════════════════════════════════════════
// ROOM EVENT MODAL
// Displays room events with large pixel art and skill checks
// ══════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import type { CSSProperties } from 'react';
import type { GameState, ActiveRoomEvent, RoomEventOutcome, SkillCheckResult } from './types';
import { SkillCheckModal } from './SkillCheckModal';
import {
  formatSkillName,
  getGearSkillBonus,
} from './story/characterSkills';
import {
  UI_COLORS,
  overlayStyle as baseOverlayStyle,
  modalWrapperStyle,
  primaryFrameStyle,
  secondaryFrameStyle,
  closeBtnStyle,
  characterNameStyle,
  narratorTextStyle,
  primaryButtonStyle,
  dividerStyle,
  cornerSize,
} from './uiFrameStyles';

interface RoomEventModalProps {
  state: GameState;
  roomEvent: ActiveRoomEvent;
  onComplete: (outcome: RoomEventOutcome, skillResult: SkillCheckResult) => void;
  onClose?: () => void;
}

type Phase = 'intro' | 'skill_check' | 'outcome';

export function RoomEventModal({
  state,
  roomEvent,
  onComplete,
  onClose,
}: RoomEventModalProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [outcome, setOutcome] = useState<RoomEventOutcome | null>(null);
  const [skillResult, setSkillResult] = useState<SkillCheckResult | null>(null);

  const event = roomEvent.event;

  const handleBeginCheck = useCallback(() => {
    setPhase('skill_check');
  }, []);

  const handleSkillCheckComplete = useCallback((result: SkillCheckResult) => {
    setSkillResult(result);

    // Determine outcome based on skill check result
    let eventOutcome: RoomEventOutcome;
    switch (result.outcome) {
      case 'critical':
        eventOutcome = event.criticalSuccess;
        break;
      case 'success':
        eventOutcome = event.success;
        break;
      case 'partial':
        eventOutcome = event.partial;
        break;
      case 'fail':
        eventOutcome = event.failure;
        break;
      case 'critical_fail':
        eventOutcome = event.criticalFailure;
        break;
      default:
        eventOutcome = event.failure;
    }

    setOutcome(eventOutcome);
    setPhase('outcome');
  }, [event]);

  const handleContinue = useCallback(() => {
    if (outcome && skillResult) {
      onComplete(outcome, skillResult);
    }
    onClose?.();
  }, [outcome, skillResult, onComplete, onClose]);

  const handleClose = useCallback(() => {
    // Default to failure outcome if closed early
    const defaultOutcome = event.failure;
    const defaultResult: SkillCheckResult = {
      skill: event.primarySkill,
      roll: [1, 1],
      modifier: 0,
      total: 2,
      target: event.baseDifficulty,
      outcome: 'fail',
    };
    onComplete(defaultOutcome, defaultResult);
    onClose?.();
  }, [event, onComplete, onClose]);

  // Skill check phase
  if (phase === 'skill_check') {
    const skill = event.primarySkill;
    const skillValue = state.skills?.[skill] ?? 10;
    const gearBonus = getGearSkillBonus(state, skill);

    return (
      <SkillCheckModal
        skill={skill}
        skillValue={skillValue}
        gearBonus={gearBonus}
        target={event.baseDifficulty}
        description={event.name}
        onComplete={handleSkillCheckComplete}
      />
    );
  }

  // Outcome color based on result
  const getOutcomeColor = () => {
    if (!skillResult) return UI_COLORS.primary;
    switch (skillResult.outcome) {
      case 'critical': return '#ffdd00';
      case 'success': return '#44ff44';
      case 'partial': return '#ffcc44';
      case 'fail': return '#ff6644';
      case 'critical_fail': return '#ff2222';
      default: return UI_COLORS.primary;
    }
  };

  const getOutcomeLabel = () => {
    if (!skillResult) return '';
    switch (skillResult.outcome) {
      case 'critical': return '★ CRITICAL SUCCESS ★';
      case 'success': return 'SUCCESS';
      case 'partial': return 'PARTIAL SUCCESS';
      case 'fail': return 'FAILURE';
      case 'critical_fail': return '✗ CRITICAL FAILURE ✗';
      default: return '';
    }
  };

  return (
    <div style={{ ...baseOverlayStyle, zIndex: 70 }}>
      <div style={{ ...modalWrapperStyle, maxWidth: 380 }}>
        {/* Main event frame */}
        <div style={primaryFrameStyle}>
          {/* Corner decorations */}
          <div style={cornerTL} />
          <div style={cornerTR} />
          <div style={cornerBL} />
          <div style={cornerBR} />

          {/* Close button */}
          {onClose && phase === 'intro' && (
            <button style={closeBtnStyle} onClick={handleClose}>
              [X]
            </button>
          )}

          {/* Large pixel art display */}
          <div style={largeArtContainerStyle}>
            {roomEvent.artUrl ? (
              <img 
                src={roomEvent.artUrl} 
                alt={event.name}
                style={largeArtImageStyle}
              />
            ) : (
              <div style={largeArtFallbackStyle}>
                <span style={{ fontSize: 48, color: UI_COLORS.primary }}>?</span>
                <span style={{ fontSize: 12, color: UI_COLORS.textMuted, marginTop: 8 }}>
                  Generating art...
                </span>
              </div>
            )}
          </div>

          {/* Event name */}
          <div style={eventNameContainerStyle}>
            <div style={{ ...characterNameStyle, color: UI_COLORS.primary, fontSize: 18 }}>
              {event.name}
            </div>
            <div style={{ fontSize: 11, color: UI_COLORS.textMuted, marginTop: 2 }}>
              {formatSkillName(event.primarySkill)} Check (DC {event.baseDifficulty})
            </div>
          </div>

          <div style={dividerStyle} />

          {/* Event description or outcome */}
          <div style={descriptionContainerStyle}>
            {phase === 'intro' && (
              <div style={narratorTextStyle}>{event.description}</div>
            )}
            {phase === 'outcome' && outcome && (
              <>
                <div style={{ 
                  textAlign: 'center', 
                  color: getOutcomeColor(),
                  fontSize: 14,
                  fontWeight: 'bold',
                  marginBottom: 8,
                }}>
                  {getOutcomeLabel()}
                </div>
                <div style={narratorTextStyle}>{outcome.description}</div>
                {outcome.effects.length > 0 && (
                  <div style={effectsListStyle}>
                    {outcome.effects.map((effect, i) => (
                      <div key={i} style={{
                        color: effect.type === 'damage' || effect.type === 'lose_item' || 
                               effect.type === 'transformation' || effect.type === 'curse' ||
                               effect.type === 'stat_debuff' || effect.type === 'spawn_elite'
                          ? '#ff6644' 
                          : '#44ff44',
                        fontSize: 11,
                        marginTop: 4,
                      }}>
                        • {effect.message || `${effect.type}: ${effect.value ?? effect.target ?? ''}`}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div style={secondaryFrameStyle}>
          {phase === 'intro' && (
            <div style={buttonContainerStyle}>
              <button style={primaryButtonStyle} onClick={handleBeginCheck}>
                [ ATTEMPT {formatSkillName(event.primarySkill).toUpperCase()} CHECK ]
              </button>
            </div>
          )}
          {phase === 'outcome' && (
            <div style={buttonContainerStyle}>
              <button style={primaryButtonStyle} onClick={handleContinue}>
                [ CONTINUE ]
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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

// Local styles
const largeArtContainerStyle: CSSProperties = {
  width: '100%',
  aspectRatio: '1 / 1',
  maxHeight: 280,
  marginBottom: 8,
  borderRadius: 6,
  overflow: 'hidden',
  border: `2px solid ${UI_COLORS.borderMid}`,
  boxShadow: `0 0 12px ${UI_COLORS.primaryGlow}`,
  background: '#0a0a0a',
};

const largeArtImageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
};

const largeArtFallbackStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#111',
};

const eventNameContainerStyle: CSSProperties = {
  textAlign: 'center',
  marginBottom: 8,
};

const descriptionContainerStyle: CSSProperties = {
  minHeight: 80,
  padding: '8px 0',
};

const effectsListStyle: CSSProperties = {
  marginTop: 12,
  padding: '8px',
  background: 'rgba(0, 0, 0, 0.3)',
  borderRadius: 4,
  border: `1px solid ${UI_COLORS.borderMid}`,
};

const buttonContainerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
};
