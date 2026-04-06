import type { CSSProperties } from 'react';
import type { TutorialStepId } from './types';

export interface TutorialStep {
  id: TutorialStepId;
  label: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  { id: 'moved',          label: 'Move'     },
  { id: 'picked_up_item', label: 'Pick up'  },
  { id: 'killed_enemy',   label: 'Kill'     },
  { id: 'used_item',      label: 'Use item' },
  { id: 'tried_auto',     label: 'Auto'     },
  { id: 'reached_floor_2',label: 'Floor 2'  },
  { id: 'died',           label: 'Die'      },
];

interface TutorialBarProps {
  completedSteps: TutorialStepId[];
}

export function TutorialBar({ completedSteps }: TutorialBarProps) {
  const total = TUTORIAL_STEPS.length;
  const done = completedSteps.length;
  const pct = Math.round((done / total) * 100);

  const containerStyle: CSSProperties = {
    width: '100%',
    background: '#0a0a0a',
    borderBottom: '1px solid #2a1a4a',
    padding: '3px 8px',
    fontFamily: 'monospace',
    userSelect: 'none',
  };

  const rowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  };

  const labelStyle: CSSProperties = {
    fontSize: 10,
    color: '#9966cc',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };

  const trackStyle: CSSProperties = {
    flex: 1,
    height: 6,
    background: '#1a1a2a',
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  };

  const fillStyle: CSSProperties = {
    height: '100%',
    width: `${pct}%`,
    background: 'linear-gradient(90deg, #6633aa, #c49eff)',
    borderRadius: 3,
    transition: 'width 0.4s ease',
  };

  const pctStyle: CSSProperties = {
    fontSize: 10,
    color: '#9966cc',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    minWidth: 28,
    textAlign: 'right',
  };

  const stepsRowStyle: CSSProperties = {
    display: 'flex',
    gap: 4,
  };

  return (
    <div style={containerStyle}>
      <div style={rowStyle}>
        <span style={labelStyle}>Journey</span>
        <div style={trackStyle}>
          <div style={fillStyle} />
        </div>
        <span style={pctStyle}>{pct}%</span>
      </div>
      <div style={stepsRowStyle}>
        {TUTORIAL_STEPS.map((step) => {
          const isComplete = completedSteps.includes(step.id);
          const stepStyle: CSSProperties = {
            fontSize: 9,
            padding: '1px 5px',
            borderRadius: 3,
            background: isComplete ? '#3a1a5a' : '#1e1e2e',
            color: isComplete ? '#c49eff' : '#aaaacc',
            border: `1px solid ${isComplete ? '#6633aa' : '#3a3a5a'}`,
            transition: 'all 0.3s ease',
            whiteSpace: 'nowrap',
          };
          return (
            <span key={step.id} style={stepStyle}>
              {isComplete ? '✓ ' : ''}{step.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
