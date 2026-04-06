/**
 * Generative Class Select Screen
 * Allows players to roll a new AI-generated class or browse saved/community classes
 */

import React, { useState, useCallback } from 'react';
import type { GeneratedClass, ArchetypeId } from './generativeClass';
import { 
  generateClass, 
  resetGeneration,
  getAllArchetypes,
  ARCHETYPES,
} from './generativeClass';

interface Props {
  onSelectClass: (generatedClass: GeneratedClass) => void;
  onBack: () => void;
  savedClasses?: GeneratedClass[];
}

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px',
  overflowY: 'auto',
  fontFamily: '"Press Start 2P", monospace',
};

const titleStyle: React.CSSProperties = {
  fontSize: '18px',
  color: '#ffaa33',
  textShadow: '0 0 10px #ff6600',
  marginBottom: '10px',
  textAlign: 'center',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '10px',
  color: '#888',
  marginBottom: '30px',
  textAlign: 'center',
};

const sectionStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '600px',
  marginBottom: '30px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#44ff88',
  marginBottom: '15px',
  borderBottom: '1px solid #333',
  paddingBottom: '5px',
};

const archetypeGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
  gap: '10px',
};

const archetypeButtonStyle: React.CSSProperties = {
  background: '#1a1a2e',
  border: '2px solid #333',
  borderRadius: '8px',
  padding: '12px',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'all 0.2s',
};

const archetypeButtonHoverStyle: React.CSSProperties = {
  ...archetypeButtonStyle,
  borderColor: '#44ff88',
  boxShadow: '0 0 10px rgba(68, 255, 136, 0.3)',
};

const randomButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #ff6644 0%, #ff9944 100%)',
  border: 'none',
  borderRadius: '8px',
  padding: '20px 40px',
  cursor: 'pointer',
  fontSize: '14px',
  color: '#fff',
  fontFamily: '"Press Start 2P", monospace',
  boxShadow: '0 4px 15px rgba(255, 102, 68, 0.4)',
  transition: 'all 0.2s',
  marginBottom: '20px',
};

const classCardStyle: React.CSSProperties = {
  background: '#1a1a2e',
  border: '2px solid #44ff88',
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '20px',
  maxWidth: '500px',
  width: '100%',
};

const portraitStyle: React.CSSProperties = {
  width: '150px',
  height: '150px',
  border: '3px solid #44ff88',
  borderRadius: '8px',
  objectFit: 'cover',
  marginRight: '20px',
  background: '#0a0a0f',
};

const progressBarContainerStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '400px',
  height: '20px',
  background: '#1a1a2e',
  borderRadius: '10px',
  border: '2px solid #333',
  overflow: 'hidden',
  marginBottom: '10px',
};

const progressBarFillStyle = (progress: number): React.CSSProperties => ({
  width: `${progress}%`,
  height: '100%',
  background: 'linear-gradient(90deg, #44ff88 0%, #88ffaa 100%)',
  transition: 'width 0.3s ease',
});

const backButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: '20px',
  left: '20px',
  background: 'transparent',
  border: '2px solid #666',
  borderRadius: '5px',
  padding: '8px 15px',
  cursor: 'pointer',
  fontSize: '10px',
  color: '#888',
  fontFamily: '"Press Start 2P", monospace',
};

const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '15px',
  marginTop: '20px',
  flexWrap: 'wrap',
  justifyContent: 'center',
};

const actionButtonStyle: React.CSSProperties = {
  background: '#44ff88',
  border: 'none',
  borderRadius: '5px',
  padding: '12px 25px',
  cursor: 'pointer',
  fontSize: '10px',
  color: '#0a0a0f',
  fontFamily: '"Press Start 2P", monospace',
};

const secondaryButtonStyle: React.CSSProperties = {
  ...actionButtonStyle,
  background: 'transparent',
  border: '2px solid #44ff88',
  color: '#44ff88',
};

export function GenerativeClassSelect({ onSelectClass, onBack, savedClasses = [] }: Props) {
  const [mode, setMode] = useState<'menu' | 'generating' | 'preview' | 'browse'>('menu');
  const [selectedArchetype, setSelectedArchetype] = useState<ArchetypeId | null>(null);
  const [generatedClass, setGeneratedClass] = useState<GeneratedClass | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [hoveredArchetype, setHoveredArchetype] = useState<ArchetypeId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const archetypes = getAllArchetypes();

  const handleGenerateRandom = useCallback(async () => {
    setMode('generating');
    setError(null);
    resetGeneration();
    
    const result = await generateClass(undefined, (p, text) => {
      setProgress(p);
      setProgressText(text);
    });
    
    if (result) {
      setGeneratedClass(result);
      setMode('preview');
    } else {
      setError('Generation failed. Please try again.');
      setMode('menu');
    }
  }, []);

  const handleGenerateArchetype = useCallback(async (archetypeId: ArchetypeId) => {
    setSelectedArchetype(archetypeId);
    setMode('generating');
    setError(null);
    resetGeneration();
    
    const result = await generateClass(archetypeId, (p, text) => {
      setProgress(p);
      setProgressText(text);
    });
    
    if (result) {
      setGeneratedClass(result);
      setMode('preview');
    } else {
      setError('Generation failed. Please try again.');
      setMode('menu');
    }
  }, []);

  const handleReroll = useCallback(() => {
    if (selectedArchetype) {
      handleGenerateArchetype(selectedArchetype);
    } else {
      handleGenerateRandom();
    }
  }, [selectedArchetype, handleGenerateArchetype, handleGenerateRandom]);

  const handleSelectClass = useCallback(() => {
    if (generatedClass) {
      onSelectClass(generatedClass);
    }
  }, [generatedClass, onSelectClass]);

  const handleBackToMenu = useCallback(() => {
    setMode('menu');
    setGeneratedClass(null);
    setSelectedArchetype(null);
    setError(null);
    resetGeneration();
  }, []);

  return (
    <div style={containerStyle}>
      <button style={backButtonStyle} onClick={onBack}>
        ← BACK
      </button>

      <h1 style={titleStyle}>⚔️ GENERATIVE CLASS</h1>
      <p style={subtitleStyle}>Roll a unique AI-generated class for your run</p>

      {error && (
        <div style={{ color: '#ff4444', fontSize: '10px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {mode === 'menu' && (
        <>
          {/* Random Roll Button */}
          <button 
            style={randomButtonStyle}
            onClick={handleGenerateRandom}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 102, 68, 0.6)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 102, 68, 0.4)';
            }}
          >
            🎲 ROLL RANDOM CLASS
          </button>

          {/* Archetype Selection */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>OR CHOOSE AN ARCHETYPE</h2>
            <div style={archetypeGridStyle}>
              {archetypes.map((archetype) => (
                <button
                  key={archetype.id}
                  style={hoveredArchetype === archetype.id ? archetypeButtonHoverStyle : archetypeButtonStyle}
                  onClick={() => handleGenerateArchetype(archetype.id)}
                  onMouseEnter={() => setHoveredArchetype(archetype.id)}
                  onMouseLeave={() => setHoveredArchetype(null)}
                >
                  <div style={{ fontSize: '11px', color: '#fff', marginBottom: '5px' }}>
                    {archetype.name}
                  </div>
                  <div style={{ fontSize: '8px', color: '#888', lineHeight: '1.4' }}>
                    {archetype.description.substring(0, 60)}...
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Saved Classes */}
          {savedClasses.length > 0 && (
            <div style={sectionStyle}>
              <h2 style={sectionTitleStyle}>YOUR SAVED CLASSES</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {savedClasses.slice(0, 6).map((saved) => (
                  <button
                    key={saved.id}
                    style={{
                      ...archetypeButtonStyle,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                    onClick={() => {
                      setGeneratedClass(saved);
                      setMode('preview');
                    }}
                  >
                    {saved.portraitUrl ? (
                      <img 
                        src={saved.portraitUrl} 
                        alt={saved.name}
                        style={{ width: '40px', height: '40px', borderRadius: '4px' }}
                      />
                    ) : (
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        background: saved.color,
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        color: '#fff',
                      }}>
                        {saved.char}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '10px', color: '#fff' }}>{saved.name}</div>
                      <div style={{ fontSize: '8px', color: '#888' }}>{ARCHETYPES[saved.archetype].name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {mode === 'generating' && (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <div style={{ fontSize: '40px', marginBottom: '20px', animation: 'pulse 1s infinite' }}>
            ⚙️
          </div>
          <div style={progressBarContainerStyle}>
            <div style={progressBarFillStyle(progress)} />
          </div>
          <div style={{ fontSize: '10px', color: '#44ff88', marginBottom: '10px' }}>
            {progress}%
          </div>
          <div style={{ fontSize: '10px', color: '#888' }}>
            {progressText}
          </div>
        </div>
      )}

      {mode === 'preview' && generatedClass && (
        <div style={classCardStyle}>
          <div style={{ display: 'flex', marginBottom: '20px' }}>
            {generatedClass.portraitUrl ? (
              <img 
                src={generatedClass.portraitUrl} 
                alt={generatedClass.name}
                style={portraitStyle}
              />
            ) : (
              <div style={{
                ...portraitStyle,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '60px',
                color: generatedClass.color,
              }}>
                {generatedClass.char}
              </div>
            )}
            <div>
              <h2 style={{ 
                fontSize: '16px', 
                color: generatedClass.color, 
                margin: '0 0 5px 0',
                textShadow: `0 0 10px ${generatedClass.color}`,
              }}>
                {generatedClass.icon} {generatedClass.name}
              </h2>
              <div style={{ fontSize: '10px', color: '#888', marginBottom: '10px' }}>
                {generatedClass.title}
              </div>
              <div style={{ 
                fontSize: '9px', 
                color: '#666', 
                background: '#0a0a0f',
                padding: '5px 10px',
                borderRadius: '4px',
                marginBottom: '10px',
              }}>
                {ARCHETYPES[generatedClass.archetype].name} Archetype
              </div>
              <div style={{ fontSize: '9px', color: '#aaa', lineHeight: '1.5' }}>
                {generatedClass.description}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(5, 1fr)', 
            gap: '10px',
            marginBottom: '20px',
            padding: '10px',
            background: '#0a0a0f',
            borderRadius: '5px',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: '#888' }}>HP</div>
              <div style={{ fontSize: '12px', color: '#ff6666' }}>{generatedClass.baseStats.hp}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: '#888' }}>ATK</div>
              <div style={{ fontSize: '12px', color: '#ff9944' }}>{generatedClass.baseStats.attack}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: '#888' }}>DEF</div>
              <div style={{ fontSize: '12px', color: '#4488ff' }}>{generatedClass.baseStats.defense}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: '#888' }}>SPD</div>
              <div style={{ fontSize: '12px', color: '#44ff88' }}>{generatedClass.baseStats.speed}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: '#888' }}>{generatedClass.resource.icon}</div>
              <div style={{ fontSize: '12px', color: generatedClass.resource.color }}>{generatedClass.resource.max}</div>
            </div>
          </div>

          {/* Resource */}
          <div style={{ 
            padding: '10px',
            background: '#0a0a0f',
            borderRadius: '5px',
            marginBottom: '15px',
          }}>
            <div style={{ fontSize: '10px', color: generatedClass.resource.color, marginBottom: '5px' }}>
              {generatedClass.resource.icon} {generatedClass.resource.name}
            </div>
            <div style={{ fontSize: '8px', color: '#888' }}>
              {generatedClass.resource.description}
            </div>
          </div>

          {/* Ability */}
          <div style={{ 
            padding: '10px',
            background: '#0a0a0f',
            borderRadius: '5px',
            border: `1px solid ${generatedClass.color}`,
            marginBottom: '15px',
          }}>
            <div style={{ fontSize: '10px', color: '#fff', marginBottom: '5px' }}>
              {generatedClass.ability.icon} {generatedClass.ability.name}
              <span style={{ color: '#888', marginLeft: '10px' }}>
                Cost: {generatedClass.ability.resourceCost}
              </span>
            </div>
            <div style={{ fontSize: '8px', color: '#aaa' }}>
              {generatedClass.ability.description}
            </div>
          </div>

          {/* Backstory */}
          <div style={{ 
            fontSize: '8px', 
            color: '#666', 
            fontStyle: 'italic',
            lineHeight: '1.6',
            marginBottom: '15px',
          }}>
            "{generatedClass.backstory}"
          </div>

          {/* Action Buttons */}
          <div style={buttonRowStyle}>
            <button style={actionButtonStyle} onClick={handleSelectClass}>
              ⚔️ START RUN
            </button>
            <button style={secondaryButtonStyle} onClick={handleReroll}>
              🎲 REROLL
            </button>
            <button 
              style={{ ...secondaryButtonStyle, borderColor: '#888', color: '#888' }} 
              onClick={handleBackToMenu}
            >
              ← BACK
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
