import { useState, useCallback, useRef } from 'react';
import { UI_COLORS } from './uiFrameStyles';
import { ROOM_EVENT_POOL } from './roomEvents';

interface SeederProps {
  onClose: () => void;
}

interface GenerationTask {
  id: string;
  type: 'portrait' | 'room_art' | 'encounter';
  label: string;
  params: {
    race?: string;
    name?: string;
    prompt?: string;
    eventId?: string;
    eventName?: string;
    artPrompt?: string;
    description?: string;
  };
  status: 'pending' | 'generating' | 'done' | 'error';
  result?: string;
  error?: string;
}

const CREATURE_TYPES = [
  { race: 'goblin', variations: ['Goblin Scavenger', 'Goblin Shaman', 'Goblin Warrior', 'Goblin Thief', 'Goblin Elder'] },
  { race: 'skeleton', variations: ['Skeletal Warrior', 'Skeletal Archer', 'Skeletal Mage', 'Bone Knight', 'Ancient Skeleton'] },
  { race: 'zombie', variations: ['Shambling Corpse', 'Plague Zombie', 'Zombie Brute', 'Rotting Horror', 'Undead Soldier'] },
  { race: 'rat', variations: ['Giant Rat', 'Dire Rat', 'Plague Rat', 'Rat Swarm', 'Rat King'] },
  { race: 'spider', variations: ['Cave Spider', 'Poison Spider', 'Giant Spider', 'Web Spinner', 'Shadow Spider'] },
  { race: 'slime', variations: ['Green Slime', 'Acid Slime', 'Giant Ooze', 'Crystal Slime', 'Blood Slime'] },
  { race: 'bat', variations: ['Cave Bat', 'Vampire Bat', 'Giant Bat', 'Shadow Bat', 'Screech Bat'] },
  { race: 'orc', variations: ['Orc Warrior', 'Orc Berserker', 'Orc Shaman', 'Orc Chieftain', 'Orc Scout'] },
  { race: 'troll', variations: ['Cave Troll', 'Rock Troll', 'Moss Troll', 'Bridge Troll', 'Troll Berserker'] },
  { race: 'ghost', variations: ['Wandering Spirit', 'Vengeful Ghost', 'Phantom', 'Wraith', 'Specter'] },
  { race: 'demon', variations: ['Lesser Demon', 'Fire Imp', 'Shadow Fiend', 'Pit Demon', 'Demon Scout'] },
  { race: 'elemental', variations: ['Fire Elemental', 'Ice Elemental', 'Stone Elemental', 'Shadow Elemental', 'Lightning Elemental'] },
  { race: 'fungus', variations: ['Mushroom Man', 'Spore Walker', 'Fungal Horror', 'Myconid', 'Rot Blossom'] },
  { race: 'lizard', variations: ['Lizardman Warrior', 'Lizard Scout', 'Salamander', 'Basilisk Spawn', 'Swamp Lurker'] },
  { race: 'insect', variations: ['Giant Beetle', 'Cave Centipede', 'Carrion Crawler', 'Hive Drone', 'Mantis Hunter'] },
];

const PORTRAIT_PROMPTS: Record<string, string> = {
  goblin: 'Small green-skinned creature with pointed ears, yellow eyes, wearing ragged cloth',
  skeleton: 'Animated bones with hollow eye sockets, ancient armor fragments, glowing eyes',
  zombie: 'Rotting humanoid corpse with pale grey skin, torn clothing, dead eyes',
  rat: 'Oversized rodent with matted fur, red eyes, yellowed teeth',
  spider: 'Multi-legged arachnid with multiple eyes, fangs dripping venom',
  slime: 'Amorphous blob of translucent ooze with objects visible inside',
  bat: 'Large winged creature with leathery wings, fanged mouth, beady eyes',
  orc: 'Muscular green-skinned humanoid with tusks, tribal markings, fierce expression',
  troll: 'Massive hulking creature with long arms, warty skin, small eyes',
  ghost: 'Translucent spectral figure with hollow eyes, wispy form, ethereal glow',
  demon: 'Horned creature with red/black skin, glowing eyes, clawed hands',
  elemental: 'Creature made of pure element, swirling energy, no fixed form',
  fungus: 'Humanoid covered in mushrooms and fungal growths, spore clouds',
  lizard: 'Reptilian humanoid with scales, slitted eyes, long tail',
  insect: 'Chitinous creature with multiple legs, mandibles, compound eyes',
};

export function ContentSeeder({ onClose }: SeederProps) {
  const [tasks, setTasks] = useState<GenerationTask[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const abortRef = useRef(false);
  
  const generateTasks = useCallback(() => {
    const newTasks: GenerationTask[] = [];
    
    // Generate portrait tasks for all creature variations
    for (const creature of CREATURE_TYPES) {
      for (const variation of creature.variations) {
        newTasks.push({
          id: `portrait_${creature.race}_${variation.replace(/\s+/g, '_').toLowerCase()}`,
          type: 'portrait',
          label: `Portrait: ${variation}`,
          params: {
            race: creature.race,
            name: variation,
            prompt: PORTRAIT_PROMPTS[creature.race] || 'mysterious dungeon creature',
          },
          status: 'pending',
        });
      }
    }
    
    // Generate room event art tasks
    for (const event of ROOM_EVENT_POOL) {
      newTasks.push({
        id: `room_art_${event.id}`,
        type: 'room_art',
        label: `Room Art: ${event.name}`,
        params: {
          eventId: event.id,
          eventName: event.name,
          artPrompt: event.artPrompt,
        },
        status: 'pending',
      });
    }
    
    // Generate encounter dialogue tasks (subset of creatures)
    const encounterCreatures = CREATURE_TYPES.slice(0, 8); // First 8 types
    for (const creature of encounterCreatures) {
      for (const variation of creature.variations.slice(0, 2)) { // 2 per type
        newTasks.push({
          id: `encounter_${creature.race}_${variation.replace(/\s+/g, '_').toLowerCase()}`,
          type: 'encounter',
          label: `Encounter: ${variation}`,
          params: {
            race: creature.race,
            name: variation,
            description: PORTRAIT_PROMPTS[creature.race] || 'A dungeon creature',
          },
          status: 'pending',
        });
      }
    }
    
    setTasks(newTasks);
    setCurrentTaskIndex(0);
  }, []);
  
  const runSeeder = useCallback(async () => {
    if (tasks.length === 0) {
      generateTasks();
      return;
    }
    
    setIsRunning(true);
    abortRef.current = false;
    
    const { generateEnemyPortraitFromPrompt, generateRoomEventArt, generateEnemyEncounter } = await import('./story/seriesAI');
    
    for (let i = currentTaskIndex; i < tasks.length; i++) {
      if (abortRef.current) break;
      
      const task = tasks[i];
      if (!task || task.status === 'done') continue;
      
      setCurrentTaskIndex(i);
      const genStatus: 'generating' = 'generating';
      setTasks(prev => prev.map((t, idx) => 
        idx === i ? { ...t, status: genStatus } : t
      ));
      
      try {
        let result: string | null = null;
        
        if (task.type === 'portrait') {
          // Generate portrait and save to pool
          result = await generateEnemyPortraitFromPrompt(
            task.params.name || 'Unknown',
            task.params.race || 'creature',
            task.params.prompt || 'A dungeon creature'
          );
          
          if (result) {
            console.log(`[Seeder] Portrait generated for ${task.params.name}`);
          }
        } else if (task.type === 'room_art') {
          // Generate room art
          result = await generateRoomEventArt(
            task.params.eventName || 'Unknown Event',
            task.params.artPrompt || 'A dungeon scene'
          );
          
          if (result) {
            console.log(`[Seeder] Room art generated for ${task.params.eventName}`);
          }
        } else if (task.type === 'encounter') {
          // Generate encounter data
          const encounterData = await generateEnemyEncounter({
            name: task.params.name || 'Unknown',
            race: task.params.race || 'creature',
            description: task.params.description || 'A dungeon creature',
            isBoss: false,
          });
          
          if (encounterData) {
            result = encounterData.characterName || 'generated';
            console.log(`[Seeder] Encounter generated for ${task.params.name}`);
          }
        }
        
        const newStatus: 'done' | 'error' = result ? 'done' : 'error';
        setTasks(prev => prev.map((t, idx) => 
          idx === i ? { ...t, status: newStatus, result: result || undefined, error: result ? undefined : 'No result' } : t
        ));
        
        // Rate limiting - wait between generations
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (err) {
        console.error(`[Seeder] Error generating ${task.label}:`, err);
        const errStatus: 'error' = 'error';
        setTasks(prev => prev.map((t, idx) => 
          idx === i ? { ...t, status: errStatus, error: String(err) } : t
        ));
        
        // Longer wait on error
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    setIsRunning(false);
  }, [tasks, currentTaskIndex, generateTasks]);
  
  const stopSeeder = useCallback(() => {
    abortRef.current = true;
    setIsRunning(false);
  }, []);
  
  const resetSeeder = useCallback(() => {
    setTasks([]);
    setCurrentTaskIndex(0);
    setIsRunning(false);
    abortRef.current = false;
  }, []);
  
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const errorCount = tasks.filter(t => t.status === 'error').length;
  
  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <div style={headerStyle}>
          <span style={titleStyle}>Content Seeder</span>
          <button style={closeBtnStyle} onClick={onClose}>X</button>
        </div>
        
        <div style={contentStyle}>
          <div style={descStyle}>
            Generate AI content (portraits, room art, encounters) and save to the shared pool for all players.
          </div>
          
          <div style={statsStyle}>
            <div>Tasks: {tasks.length}</div>
            <div style={{ color: UI_COLORS.success }}>Done: {doneCount}</div>
            <div style={{ color: UI_COLORS.warning }}>Pending: {pendingCount}</div>
            <div style={{ color: UI_COLORS.danger }}>Errors: {errorCount}</div>
          </div>
          
          {tasks.length === 0 ? (
            <div style={{ marginTop: 16 }}>
              <button style={actionBtnStyle} onClick={generateTasks}>
                Prepare Tasks ({CREATURE_TYPES.reduce((sum, c) => sum + c.variations.length, 0)} portraits + {ROOM_EVENT_POOL.length} room arts)
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                {!isRunning ? (
                  <button style={actionBtnStyle} onClick={runSeeder}>
                    {currentTaskIndex > 0 ? 'Resume' : 'Start'} Generation
                  </button>
                ) : (
                  <button style={{ ...actionBtnStyle, background: UI_COLORS.danger }} onClick={stopSeeder}>
                    Stop
                  </button>
                )}
                <button style={secondaryBtnStyle} onClick={resetSeeder}>
                  Reset
                </button>
              </div>
              
              {isRunning && (
                <div style={progressStyle}>
                  <div style={{ 
                    width: `${(doneCount / tasks.length) * 100}%`,
                    height: '100%',
                    background: UI_COLORS.primary,
                    transition: 'width 0.3s',
                  }} />
                </div>
              )}
              
              <div style={taskListStyle}>
                {tasks.slice(Math.max(0, currentTaskIndex - 2), currentTaskIndex + 10).map((task) => (
                  <div key={task.id} style={{
                    ...taskRowStyle,
                    background: task.status === 'generating' ? '#1a3a1a' : 
                               task.status === 'done' ? '#0a2a0a' :
                               task.status === 'error' ? '#3a1a1a' : '#0a0a0a',
                  }}>
                    <span style={{ 
                      color: task.status === 'generating' ? UI_COLORS.warning :
                             task.status === 'done' ? UI_COLORS.success :
                             task.status === 'error' ? UI_COLORS.danger : UI_COLORS.textMuted,
                      marginRight: 8,
                      fontSize: 10,
                    }}>
                      {task.status === 'generating' ? '⟳' :
                       task.status === 'done' ? '✓' :
                       task.status === 'error' ? '✗' : '○'}
                    </span>
                    <span style={{ flex: 1, fontSize: 10 }}>{task.label}</span>
                    {task.status === 'generating' && (
                      <span style={{ color: UI_COLORS.warning, fontSize: 9 }}>generating...</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          
          <div style={infoStyle}>
            <strong>How it works:</strong><br/>
            1. Click "Prepare Tasks" to create the generation queue<br/>
            2. Click "Start Generation" to begin<br/>
            3. Each item is generated and saved to the shared pool<br/>
            4. Other players will receive this content instead of waiting<br/>
            <br/>
            <strong>Note:</strong> This uses AI credits. Run during off-peak times.
          </div>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.95)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: 20,
};

const panelStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 500,
  maxHeight: '90vh',
  background: '#0a0a0a',
  border: `2px solid ${UI_COLORS.primary}`,
  borderRadius: 8,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderBottom: `1px solid ${UI_COLORS.primaryDark}`,
};

const titleStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 16,
  fontWeight: 'bold',
  color: UI_COLORS.primary,
};

const closeBtnStyle: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: 12,
  fontWeight: 'bold',
  background: 'transparent',
  color: UI_COLORS.danger,
  border: `1px solid ${UI_COLORS.danger}`,
  fontFamily: 'monospace',
  cursor: 'pointer',
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: 16,
};

const descStyle: React.CSSProperties = {
  color: UI_COLORS.textMuted,
  fontFamily: 'monospace',
  fontSize: 11,
  marginBottom: 16,
  lineHeight: 1.5,
};

const statsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  fontFamily: 'monospace',
  fontSize: 12,
  color: UI_COLORS.textBright,
  padding: '8px 12px',
  background: '#111',
  borderRadius: 4,
};

const actionBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  background: UI_COLORS.primaryDark,
  border: `1px solid ${UI_COLORS.primary}`,
  color: UI_COLORS.textBright,
  fontFamily: 'monospace',
  fontSize: 12,
  cursor: 'pointer',
  borderRadius: 4,
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  background: 'transparent',
  border: `1px solid ${UI_COLORS.textMuted}`,
  color: UI_COLORS.textMuted,
  fontFamily: 'monospace',
  fontSize: 12,
  cursor: 'pointer',
  borderRadius: 4,
};

const progressStyle: React.CSSProperties = {
  marginTop: 12,
  height: 6,
  background: '#222',
  borderRadius: 3,
  overflow: 'hidden',
};

const taskListStyle: React.CSSProperties = {
  marginTop: 12,
  maxHeight: 200,
  overflowY: 'auto',
  border: `1px solid ${UI_COLORS.primaryDark}`,
  borderRadius: 4,
};

const taskRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '6px 10px',
  fontFamily: 'monospace',
  color: UI_COLORS.textBright,
  borderBottom: '1px solid #1a1a1a',
};

const infoStyle: React.CSSProperties = {
  marginTop: 20,
  padding: 12,
  background: '#0a0a1a',
  border: '1px solid #1a1a3a',
  borderRadius: 4,
  fontFamily: 'monospace',
  fontSize: 10,
  color: UI_COLORS.textMuted,
  lineHeight: 1.6,
};
