import type { CSSProperties } from 'react';

/**
 * Shared pixel-art UI frame styles for narrative system
 * Designed to match the dungeon crawler aesthetic
 */

// Color palette - consistent dungeon theme
export const UI_COLORS = {
  // Primary dungeon green
  primary: '#44ff66',
  primaryDark: '#44aa66',
  primaryGlow: '#44ff6644',
  
  // Background layers
  bgDark: '#0a0a0a',
  bgDarker: '#050505',
  bgPanel: '#111111',
  
  // Text colors
  textBright: '#aaddaa',
  textMuted: '#668866',
  textHighlight: '#88ccaa',
  
  // Accent colors
  gold: '#ffd700',
  warning: '#ffcc33',
  danger: '#ff5566',
  success: '#44dd77',
  info: '#88ccff',
  
  // Border colors for layered pixel effect
  borderOuter: '#224422',
  borderMid: '#44aa66',
  borderInner: '#66cc88',
  borderHighlight: '#88ffaa',
};

// Pixel-perfect border using multiple box-shadows
const pixelBorderShadow = `
  inset 0 0 0 1px ${UI_COLORS.borderHighlight},
  inset 0 0 0 2px ${UI_COLORS.borderMid},
  0 0 0 1px ${UI_COLORS.borderOuter},
  0 0 0 2px ${UI_COLORS.bgDarker},
  0 0 12px ${UI_COLORS.primaryGlow}
`;

const pixelBorderShadowSecondary = `
  inset 0 0 0 1px ${UI_COLORS.borderMid},
  0 0 0 1px ${UI_COLORS.borderOuter},
  0 0 8px ${UI_COLORS.primaryGlow}
`;

// Overlay that covers the game
export const overlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(0,0,0,0.88)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 80,
  padding: 16,
};

// Main wrapper for modal content
export const modalWrapperStyle: CSSProperties = {
  width: '100%',
  maxWidth: 300,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

// Primary frame with full pixel border treatment
export const primaryFrameStyle: CSSProperties = {
  position: 'relative',
  background: `linear-gradient(180deg, ${UI_COLORS.bgDark} 0%, ${UI_COLORS.bgDarker} 100%)`,
  border: 'none',
  borderRadius: 0,
  boxShadow: pixelBorderShadow,
  padding: '20px 16px',
};

// Secondary frame (for buttons/choices) with simpler border
export const secondaryFrameStyle: CSSProperties = {
  background: UI_COLORS.bgDark,
  border: 'none',
  borderRadius: 0,
  boxShadow: pixelBorderShadowSecondary,
  padding: '12px 16px',
};

// Corner decorations rendered as pseudo-elements via wrapper component
export const cornerSize = 6;
export const cornerStyle: CSSProperties = {
  position: 'absolute',
  width: cornerSize,
  height: cornerSize,
  background: UI_COLORS.primary,
  boxShadow: `0 0 4px ${UI_COLORS.primaryGlow}`,
};

// Header styling
export const frameHeaderStyle: CSSProperties = {
  color: UI_COLORS.primary,
  fontFamily: '"Press Start 2P", "Courier New", monospace',
  fontSize: 11,
  fontWeight: 'bold',
  textAlign: 'center',
  letterSpacing: 1,
  textShadow: `0 0 8px ${UI_COLORS.primaryGlow}, 0 2px 0 ${UI_COLORS.borderOuter}`,
  marginBottom: 4,
  textTransform: 'uppercase',
};

// Subheader styling
export const frameSubheaderStyle: CSSProperties = {
  color: UI_COLORS.textHighlight,
  fontFamily: 'monospace',
  fontSize: 9,
  textAlign: 'center',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: 1,
};

// Description text
export const frameDescStyle: CSSProperties = {
  color: UI_COLORS.textBright,
  fontFamily: 'monospace',
  fontSize: 10,
  textAlign: 'center',
  lineHeight: 1.4,
  marginBottom: 10,
  padding: '0 4px',
};

// Stat row container
export const statRowContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  marginBottom: 12,
  padding: '8px 10px',
  background: UI_COLORS.bgDarker,
  boxShadow: `inset 0 0 0 1px ${UI_COLORS.borderOuter}`,
};

// Stat row
export const statRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontFamily: 'monospace',
  fontSize: 10,
};

export const statLabelStyle: CSSProperties = {
  color: UI_COLORS.textMuted,
};

export const statValueStyle: CSSProperties = {
  color: UI_COLORS.textBright,
  fontWeight: 'bold',
};

// Dice display area
export const diceAreaStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
  padding: '10px 0',
  margin: '8px 0',
  background: UI_COLORS.bgDarker,
  boxShadow: `inset 0 0 0 1px ${UI_COLORS.borderOuter}`,
};

// Individual dice box
export const diceBoxStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  background: UI_COLORS.bgPanel,
  boxShadow: `
    inset 0 0 0 1px ${UI_COLORS.borderMid},
    0 0 0 1px ${UI_COLORS.borderOuter},
    0 0 6px ${UI_COLORS.primaryGlow}
  `,
};

export const diceValueStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 'bold',
  fontFamily: 'monospace',
  color: '#ffffff',
  textShadow: `0 0 6px ${UI_COLORS.primaryGlow}`,
};

// Prompt/instruction text
export const promptStyle: CSSProperties = {
  color: UI_COLORS.textMuted,
  fontFamily: 'monospace',
  fontSize: 9,
  textAlign: 'center',
  fontStyle: 'italic',
  padding: '4px 0',
};

// Rolling animation text
export const rollingStyle: CSSProperties = {
  color: UI_COLORS.primary,
  fontFamily: 'monospace',
  fontSize: 10,
  textAlign: 'center',
  padding: '4px 0',
  textShadow: `0 0 6px ${UI_COLORS.primaryGlow}`,
  animation: 'pulse 0.5s ease-in-out infinite',
};

// Result container
export const resultContainerStyle: CSSProperties = {
  textAlign: 'center',
  padding: '6px 0',
};

export const resultTotalStyle: CSSProperties = {
  color: UI_COLORS.textBright,
  fontFamily: 'monospace',
  fontSize: 10,
  marginBottom: 4,
};

export const resultOutcomeStyle: CSSProperties = {
  fontFamily: '"Press Start 2P", "Courier New", monospace',
  fontSize: 12,
  fontWeight: 'bold',
  letterSpacing: 1,
  textShadow: '0 0 8px currentColor, 0 2px 0 rgba(0,0,0,0.5)',
};

// Button styles
export const buttonContainerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: 16,
};

export const primaryButtonStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: UI_COLORS.primary,
  fontFamily: 'monospace',
  fontSize: 13,
  fontWeight: 'bold',
  cursor: 'pointer',
  padding: '6px 16px',
  textShadow: `0 0 10px ${UI_COLORS.primaryGlow}`,
  transition: 'transform 0.1s, text-shadow 0.1s',
};

export const secondaryButtonStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: UI_COLORS.textMuted,
  fontFamily: 'monospace',
  fontSize: 10,
  cursor: 'pointer',
  padding: '4px 8px',
};

// Close button
export const closeBtnStyle: CSSProperties = {
  position: 'absolute',
  top: 6,
  right: 8,
  background: UI_COLORS.bgPanel,
  border: 'none',
  boxShadow: `inset 0 0 0 1px ${UI_COLORS.borderMid}, 0 0 4px ${UI_COLORS.primaryGlow}`,
  color: UI_COLORS.primary,
  fontFamily: 'monospace',
  fontSize: 10,
  fontWeight: 'bold',
  cursor: 'pointer',
  padding: '3px 8px',
  textShadow: `0 0 4px ${UI_COLORS.primaryGlow}`,
  zIndex: 10,
};

// Portrait box for character - much larger for AI-generated portraits
export const portraitBoxStyle: CSSProperties = {
  width: 120,
  height: 120,
  background: UI_COLORS.bgPanel,
  boxShadow: `
    inset 0 0 0 3px ${UI_COLORS.borderMid},
    0 0 0 3px ${UI_COLORS.borderOuter},
    0 0 20px rgba(0, 255, 136, 0.3)
  `,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  borderRadius: 6,
};

// Full-width scene image for dialogue scenes
export const sceneImageStyle: CSSProperties = {
  width: '100%',
  height: 140,
  background: UI_COLORS.bgPanel,
  boxShadow: `
    inset 0 0 0 2px ${UI_COLORS.borderMid},
    0 0 0 2px ${UI_COLORS.borderOuter}
  `,
  borderRadius: 4,
  objectFit: 'cover',
  marginBottom: 12,
};

// Character name
export const characterNameStyle: CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 13,
  fontWeight: 'bold',
  lineHeight: '16px',
  textShadow: '0 0 6px currentColor',
};

// Character title
export const characterTitleStyle: CSSProperties = {
  color: UI_COLORS.textMuted,
  fontFamily: 'monospace',
  fontSize: 8,
  fontStyle: 'italic',
  lineHeight: '12px',
};

// Dialogue text styles
export const narratorTextStyle: CSSProperties = {
  color: UI_COLORS.textHighlight,
  fontFamily: 'monospace',
  fontSize: 10,
  fontStyle: 'italic',
  lineHeight: 1.5,
};

export const characterTextStyle: CSSProperties = {
  color: UI_COLORS.textBright,
  fontFamily: 'monospace',
  fontSize: 11,
  lineHeight: 1.5,
};

export const playerTextStyle: CSSProperties = {
  color: UI_COLORS.info,
  fontFamily: 'monospace',
  fontSize: 10,
  lineHeight: 1.5,
};

// Choice button
export const choiceButtonStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: '6px 0',
  cursor: 'pointer',
  textAlign: 'left',
  display: 'flex',
  alignItems: 'flex-start',
  width: '100%',
  transition: 'background 0.1s',
};

export const choiceIndexStyle: CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 11,
  margin: 0,
  lineHeight: '16px',
  flexShrink: 0,
  color: UI_COLORS.primary,
  width: 20,
};

export const choiceSkillTagStyle: CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 8,
  margin: 0,
  lineHeight: '16px',
  flexShrink: 0,
  marginRight: 6,
};

export const choiceLabelStyle: CSSProperties = {
  color: UI_COLORS.textBright,
  fontFamily: 'monospace',
  fontSize: 10,
  margin: 0,
  lineHeight: '16px',
  flex: 1,
};

// Critical success/failure decorations
export const criticalStarsStyle: CSSProperties = {
  color: UI_COLORS.gold,
  fontFamily: 'monospace',
  fontSize: 11,
  marginTop: 4,
  textShadow: `0 0 8px ${UI_COLORS.gold}88`,
  letterSpacing: 4,
};

export const criticalFailStyle: CSSProperties = {
  color: UI_COLORS.danger,
  fontFamily: 'monospace',
  fontSize: 11,
  marginTop: 4,
  textShadow: `0 0 8px ${UI_COLORS.danger}88`,
  letterSpacing: 4,
};

// Relationship change indicator
export const relationshipStyle: CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 10,
  marginTop: 10,
  textAlign: 'center',
  textShadow: '0 0 6px currentColor',
};

// Divider line
export const dividerStyle: CSSProperties = {
  height: 1,
  background: `linear-gradient(90deg, transparent, ${UI_COLORS.borderMid}, transparent)`,
  margin: '10px 0',
};

// Helper function to get outcome color
export function getOutcomeColorFromPalette(outcome: string): string {
  switch (outcome) {
    case 'critical':
      return UI_COLORS.gold;
    case 'success':
      return UI_COLORS.success;
    case 'partial':
      return UI_COLORS.warning;
    case 'fail':
      return '#cc8855';
    case 'critical_fail':
      return UI_COLORS.danger;
    default:
      return UI_COLORS.textBright;
  }
}
