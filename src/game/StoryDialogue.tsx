import { useState, useCallback, useEffect } from 'react';
import type { CSSProperties } from 'react';
import type {
  GameState,
  StoryCharacter,
  StoryDialogueTree,
  StoryDialogueChoice,
  SkillCheckResult,
  SkillName,
  BoonEffectType,
} from './types';
import { SkillCheckModal } from './SkillCheckModal';
import {
  meetsSkillThreshold,
  getEffectiveSkill,
  getGearSkillBonus,
  getModifierDisplay,
  formatSkillName,
} from './story/characterSkills';
import { createBoonFromDialogue } from './story';
import { generateSkillCheckArt } from './story/seriesAI';
import {
  UI_COLORS,
  overlayStyle as baseOverlayStyle,
  modalWrapperStyle,
  primaryFrameStyle,
  secondaryFrameStyle,
  closeBtnStyle,
  characterNameStyle,
  characterTitleStyle,
  narratorTextStyle,
  characterTextStyle,
  playerTextStyle,
  choiceButtonStyle,
  choiceIndexStyle,
  choiceSkillTagStyle,
  choiceLabelStyle,
  primaryButtonStyle,
  relationshipStyle,
  dividerStyle,
  cornerSize,
} from './uiFrameStyles';

interface StoryDialogueProps {
  state: GameState;
  character: StoryCharacter;
  dialogue: StoryDialogueTree;
  onComplete: (effects: DialogueResult) => void;
  onClose?: () => void;
}

export interface DialogueResult {
  choicesMade: string[];
  choiceLabels: string[];
  relationshipChange: number;
  effects: Array<{ type: string; value: unknown }>;
  skillCheckResults: SkillCheckResult[];
  peacefulEnd: boolean;
  combatStart: boolean;
  enragedCombat: boolean;
}

export function StoryDialogue({
  state,
  character,
  dialogue,
  onComplete,
  onClose,
}: StoryDialogueProps) {
  const [currentNodeId, setCurrentNodeId] = useState(dialogue.rootNodeId);
  const [choicesMade, setChoicesMade] = useState<string[]>([]);
  const [choiceLabels, setChoiceLabels] = useState<string[]>([]);
  const [relationshipChange, setRelationshipChange] = useState(0);
  const [effects, setEffects] = useState<Array<{ type: string; value: unknown }>>([]);
  const [skillCheckResults, setSkillCheckResults] = useState<SkillCheckResult[]>([]);
  const [pendingSkillCheck, setPendingSkillCheck] = useState<{
    choice: StoryDialogueChoice;
    skill: SkillName;
    target: number;
  } | null>(null);
  const [skillCheckArtUrl, setSkillCheckArtUrl] = useState<string | null>(null);
  const [lastChoice, setLastChoice] = useState<StoryDialogueChoice | null>(null);
  const [boonGranted, setBoonGranted] = useState(false);
  const [peacefulEnd, setPeacefulEnd] = useState(false);
  const [combatStart, setCombatStart] = useState(false);
  const [enragedCombat, setEnragedCombat] = useState(false);

  const currentNode = dialogue.nodes[currentNodeId];
  
  // Check for special node properties when we reach a new node
  useEffect(() => {
    if (!currentNode) return;
    
    // Access dynamic properties from AI-generated nodes
    const nodeData = currentNode as unknown as Record<string, unknown>;
    
    // Track peaceful end
    if (nodeData['peacefulEnd'] === true) {
      setPeacefulEnd(true);
      console.log('[Dialogue] Peaceful end reached');
    }
    
    // Track combat start
    if (nodeData['combatStart'] === true) {
      setCombatStart(true);
      console.log('[Dialogue] Combat start triggered');
    }
    
    // Track enraged combat (enemy is buffed when offended)
    if (nodeData['enragedCombat'] === true) {
      setEnragedCombat(true);
      setCombatStart(true);
      console.log('[Dialogue] Enraged combat triggered - enemy will be buffed!');
    }
    
    // Check for boon granting when we reach a node with grantsBoon: true
    if (!boonGranted && nodeData['grantsBoon'] && lastChoice) {
      const boonMeta = nodeData['boonMeta'] as {
        name: string;
        flavorText: string;
        icon: string;
        color: string;
      } | undefined;
      
      const choiceData = lastChoice as unknown as Record<string, unknown>;
      const boonType = choiceData['boonType'] as BoonEffectType | undefined;
      const boonValue = choiceData['boonValue'] as number | undefined;
      const boonMultiplier = (nodeData['boonMultiplier'] as number) ?? 1.0;
      
      if (boonMeta && boonType && boonValue) {
        const boon = createBoonFromDialogue(
          character.id,
          character.name,
          boonMeta,
          boonType,
          boonValue,
          boonMultiplier
        );
        
        // Add the boon to effects so it gets applied on dialogue complete
        setEffects(prev => [...prev, { type: 'boon', value: boon } as { type: string; value: unknown }]);
        setBoonGranted(true);
        console.log('[Dialogue] Boon will be granted:', boon.name);
      }
    }
  }, [currentNodeId, currentNode, lastChoice, boonGranted, character]);

  // Generate art when skill check starts
  useEffect(() => {
    if (!pendingSkillCheck) {
      setSkillCheckArtUrl(null);
      return;
    }
    
    const { choice, skill } = pendingSkillCheck;
    const description = choice.label || `${skill} check`;
    
    // Generate art in background
    generateSkillCheckArt(description, skill)
      .then(url => {
        if (url) {
          console.log('[SkillCheck] Generated art:', url);
          setSkillCheckArtUrl(url);
        }
      })
      .catch(err => {
        console.warn('[SkillCheck] Art generation failed:', err);
      });
  }, [pendingSkillCheck]);

  const handleChoice = useCallback((choice: StoryDialogueChoice) => {
    setChoicesMade(prev => [...prev, choice.id]);
    setChoiceLabels(prev => [...prev, choice.label]);
    setLastChoice(choice);

    if (choice.relationshipChange) {
      setRelationshipChange(prev => prev + choice.relationshipChange!);
    }

    if (choice.skillCheck) {
      setPendingSkillCheck({
        choice,
        skill: choice.skillCheck.skill,
        target: choice.skillCheck.target,
      });
      return;
    }

    if (choice.successNodeId) {
      setCurrentNodeId(choice.successNodeId);
    }
  }, []);

  const handleSkillCheckComplete = useCallback(
    (result: SkillCheckResult) => {
      if (!pendingSkillCheck) return;

      const { choice } = pendingSkillCheck;
      setSkillCheckResults(prev => [...prev, result]);
      setPendingSkillCheck(null);
      setLastChoice(choice);

      let nextNodeId: string | undefined;
      let additionalEffects: Array<{ type: string; value: unknown }> = [];

      switch (result.outcome) {
        case 'critical':
        case 'success':
          nextNodeId = choice.successNodeId;
          if (choice.effects) {
            additionalEffects = choice.effects.map(e => ({ type: e.type, value: e }));
          }
          break;
        case 'partial':
          nextNodeId = choice.partialNodeId ?? choice.successNodeId;
          if (choice.partialEffects) {
            additionalEffects = choice.partialEffects.map(e => ({ type: e.type, value: e }));
          }
          break;
        case 'fail':
        case 'critical_fail':
          nextNodeId = choice.failureNodeId ?? choice.successNodeId;
          if (choice.failureEffects) {
            additionalEffects = choice.failureEffects.map(e => ({ type: e.type, value: e }));
          }
          break;
      }

      if (additionalEffects.length > 0) {
        setEffects(prev => [...prev, ...additionalEffects]);
      }

      if (nextNodeId) {
        setCurrentNodeId(nextNodeId);
      }
    },
    [pendingSkillCheck]
  );

  const handleContinue = useCallback(() => {
    if (currentNode?.nextNodeId) {
      setCurrentNodeId(currentNode.nextNodeId);
    } else {
      onComplete({
        choicesMade,
        choiceLabels,
        relationshipChange,
        effects,
        skillCheckResults,
        peacefulEnd,
        combatStart,
        enragedCombat,
      });
    }
  }, [currentNode, choicesMade, choiceLabels, relationshipChange, effects, skillCheckResults, peacefulEnd, combatStart, enragedCombat, onComplete]);

  const handleClose = useCallback(() => {
    onComplete({
      choicesMade,
      choiceLabels,
      relationshipChange,
      effects,
      skillCheckResults,
      peacefulEnd,
      combatStart,
      enragedCombat,
    });
    onClose?.();
  }, [choicesMade, choiceLabels, relationshipChange, effects, skillCheckResults, peacefulEnd, combatStart, enragedCombat, onComplete, onClose]);

  if (!currentNode) {
    return null;
  }

  if (pendingSkillCheck) {
    const { skill, target } = pendingSkillCheck;
    const skillValue = state.skills?.[skill] ?? 10;
    const gearBonus = getGearSkillBonus(state, skill);

    return (
      <SkillCheckModal
        skill={skill}
        skillValue={skillValue}
        gearBonus={gearBonus}
        target={target}
        description={pendingSkillCheck.choice.label}
        imageUrl={skillCheckArtUrl}
        onComplete={handleSkillCheckComplete}
      />
    );
  }

  // Check for scene image in current node
  const nodeData = currentNode as unknown as Record<string, unknown>;
  const sceneImage = nodeData['sceneImage'] as string | undefined;

  return (
    <div style={{ ...baseOverlayStyle, zIndex: 70 }}>
      <div style={{ ...modalWrapperStyle, maxWidth: 420, width: '95%' }}>
        {/* Main dialogue frame */}
        <div style={primaryFrameStyle}>
          {/* Corner decorations */}
          <div style={cornerTL} />
          <div style={cornerTR} />
          <div style={cornerBL} />
          <div style={cornerBR} />

          {/* Close button */}
          {onClose && (
            <button style={closeBtnStyle} onClick={handleClose}>
              [X]
            </button>
          )}

          {/* Scene image if present */}
          {sceneImage && (
            <img 
              src={sceneImage}
              alt="Scene"
              style={{
                width: '100%',
                height: 140,
                objectFit: 'cover',
                borderRadius: 4,
                marginBottom: 12,
                border: `2px solid ${UI_COLORS.borderMid}`,
              }}
            />
          )}

          {/* Large full-width portrait */}
          <div style={largePortraitContainerStyle}>
            {character.portraitUrl ? (
              <img 
                src={character.portraitUrl} 
                alt={character.name}
                style={largePortraitImageStyle}
              />
            ) : (
              <div style={largePortraitFallbackStyle}>
                <span style={{ color: character.color, fontSize: 72 }}>{character.char}</span>
              </div>
            )}
          </div>

          {/* Character name and title below portrait */}
          <div style={characterInfoBelowStyle}>
            <div style={{ ...characterNameStyle, color: character.color, fontSize: 18, marginBottom: 2 }}>{character.name}</div>
            <div style={{ ...characterTitleStyle, fontSize: 12, opacity: 0.8 }}>{character.title}</div>
          </div>

          <div style={dividerStyle} />

          {/* Dialogue text */}
          <div style={dialogueContainerStyle}>
            {currentNode.speaker === 'narrator' && (
              <div style={narratorTextStyle}>{currentNode.text}</div>
            )}
            {currentNode.speaker === 'character' && (
              <div style={characterTextStyle}>
                <span style={{ color: character.color }}>"</span>
                {currentNode.text}
                <span style={{ color: character.color }}>"</span>
              </div>
            )}
            {currentNode.speaker === 'player' && (
              <div style={playerTextStyle}>{currentNode.text}</div>
            )}
          </div>

          {/* Relationship indicator */}
          {relationshipChange !== 0 && (
            <div style={relationshipStyle}>
              <span style={{ color: relationshipChange > 0 ? UI_COLORS.success : UI_COLORS.danger }}>
                {relationshipChange > 0 ? `+${relationshipChange}` : relationshipChange} Relationship
              </span>
            </div>
          )}
        </div>

        {/* Choices frame */}
        <div style={secondaryFrameStyle}>
          {currentNode.choices && currentNode.choices.length > 0 ? (
            <div style={choicesContainerStyle}>
              {currentNode.choices.map((choice, index) => (
                <ChoiceButton
                  key={choice.id}
                  choice={choice}
                  index={index}
                  state={state}
                  onSelect={handleChoice}
                />
              ))}
            </div>
          ) : (
            <div style={continueContainerStyle}>
              <button data-dialogue-continue="true" style={primaryButtonStyle} onClick={handleContinue}>
                {currentNode.nextNodeId ? '[ CONTINUE ]' : '[ END ]'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ChoiceButtonProps {
  choice: StoryDialogueChoice;
  index: number;
  state: GameState;
  onSelect: (choice: StoryDialogueChoice) => void;
}

function ChoiceButton({ choice, index, state, onSelect }: ChoiceButtonProps) {
  let skillStatus: 'available' | 'check' | 'locked' = 'available';
  let skillDisplay = '';

  if (choice.requiresSkill) {
    const { skill, minimum } = choice.requiresSkill;
    const hasSkill = meetsSkillThreshold(state, skill, minimum);
    if (!hasSkill) {
      skillStatus = 'locked';
      skillDisplay = `[${formatSkillName(skill)} ${minimum}+ ✗]`;
    } else {
      skillDisplay = `[${formatSkillName(skill)} ✓]`;
    }
  } else if (choice.skillCheck) {
    const { skill } = choice.skillCheck;
    const effectiveSkill = getEffectiveSkill(state, skill);
    const modifier = getSkillModifier(effectiveSkill);
    skillStatus = 'check';
    skillDisplay = `[${formatSkillName(skill)} ${getModifierDisplay(modifier)}]`;
  }

  const isLocked = skillStatus === 'locked';

  const skillTagColor =
    skillStatus === 'locked'
      ? UI_COLORS.danger
      : skillStatus === 'check'
        ? UI_COLORS.warning
        : UI_COLORS.success;

  return (
    <button
      data-dialogue-choice={choice.id}
      style={{
        ...choiceButtonStyle,
        opacity: isLocked ? 0.4 : 1,
        cursor: isLocked ? 'not-allowed' : 'pointer',
      }}
      onClick={() => !isLocked && onSelect(choice)}
      disabled={isLocked}
    >
      <span style={choiceIndexStyle}>{`${index + 1}.`}</span>
      {skillDisplay && (
        <span style={{ ...choiceSkillTagStyle, color: skillTagColor }}>{skillDisplay + ' '}</span>
      )}
      <span style={choiceLabelStyle}>{choice.label}</span>
    </button>
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
const largePortraitContainerStyle: CSSProperties = {
  width: '100%',
  height: 300,
  minHeight: 280,
  marginBottom: 12,
  borderRadius: 8,
  overflow: 'hidden',
  border: `4px solid ${UI_COLORS.borderMid}`,
  boxShadow: `0 0 20px ${UI_COLORS.primaryGlow}`,
  background: '#0a0a0a',
};

const largePortraitImageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
};

const largePortraitFallbackStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#111',
};

const characterInfoBelowStyle: CSSProperties = {
  textAlign: 'center',
  marginBottom: 8,
};

const dialogueContainerStyle: CSSProperties = {
  minHeight: 50,
  padding: '8px 0',
};

const choicesContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const continueContainerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
};
