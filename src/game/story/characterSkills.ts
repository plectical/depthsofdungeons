import type {
  CharacterSkills,
  SkillName,
  SkillCheck,
  SkillCheckResult,
  SkillCheckOutcome,
  PlayerClass,
  BloodlineData,
  GameState,
} from '../types';

// Skill value to modifier mapping (similar to D&D ability scores)
// Skill 1-3:  -2 modifier
// Skill 4-6:  -1 modifier
// Skill 7-9:  +0 modifier
// Skill 10-12: +1 modifier
// Skill 13-15: +2 modifier
// Skill 16-18: +3 modifier
// Skill 19-20: +4 modifier
export function getSkillModifier(skillValue: number): number {
  if (skillValue <= 3) return -2;
  if (skillValue <= 6) return -1;
  if (skillValue <= 9) return 0;
  if (skillValue <= 12) return 1;
  if (skillValue <= 15) return 2;
  if (skillValue <= 18) return 3;
  return 4;
}

// Roll a single die (1 to sides)
function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

// Roll multiple dice and sum
function rollDice(count: number, sides: number): number {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += rollDie(sides);
  }
  return total;
}

// Roll 2d6 and return individual dice
export function roll2d6(): [number, number] {
  return [rollDie(6), rollDie(6)];
}

// Roll 3d6 for initial skill generation
export function roll3d6(): number {
  return rollDice(3, 6);
}

// Class skill bonuses - each class favors 2 skills
const CLASS_SKILL_BONUSES: Record<PlayerClass, Partial<CharacterSkills>> = {
  warrior:     { athletics: 3, survival: 2 },
  rogue:       { stealth: 3, awareness: 2 },
  mage:        { lore: 3, awareness: 2 },
  ranger:      { survival: 3, stealth: 2 },
  paladin:     { diplomacy: 3, lore: 2 },
  necromancer: { lore: 3, stealth: 2 },
  revenant:    { stealth: 2, awareness: 3 },
  hellborn:    { athletics: 2, survival: 2, lore: 1 },
};

// Compute skill bonuses from bloodline traits
function computeSkillBonusFromBloodline(bloodline: BloodlineData): Partial<CharacterSkills> {
  const bonus: Partial<CharacterSkills> = {};
  
  // Example trait-based bonuses (can be expanded)
  // High generation = more experience = slight awareness bonus
  if (bloodline.generation >= 10) {
    bonus.awareness = (bonus.awareness ?? 0) + 1;
  }
  if (bloodline.generation >= 25) {
    bonus.lore = (bonus.lore ?? 0) + 1;
  }
  
  // Many NPC interactions = diplomacy bonus
  if (bloodline.cumulative.totalNpcsTalkedTo >= 50) {
    bonus.diplomacy = (bonus.diplomacy ?? 0) + 1;
  }
  if (bloodline.cumulative.totalNpcsTalkedTo >= 100) {
    bonus.diplomacy = (bonus.diplomacy ?? 0) + 1;
  }
  
  // Many floors explored = survival bonus
  if (bloodline.cumulative.totalFloors >= 100) {
    bonus.survival = (bonus.survival ?? 0) + 1;
  }
  
  // Many kills = awareness bonus (battle-hardened)
  if (bloodline.cumulative.totalKills >= 500) {
    bonus.awareness = (bonus.awareness ?? 0) + 1;
  }
  
  // Story-based bonuses from storyData
  if (bloodline.storyData) {
    // Completing arcs grants skill bonuses
    const completedArcs = bloodline.storyData.completedArcIds.length;
    if (completedArcs >= 1) bonus.diplomacy = (bonus.diplomacy ?? 0) + 1;
    if (completedArcs >= 3) bonus.lore = (bonus.lore ?? 0) + 1;
    if (completedArcs >= 5) bonus.awareness = (bonus.awareness ?? 0) + 1;
  }
  
  return bonus;
}

// Clamp a value between min and max
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Roll initial character skills based on class and bloodline
export function rollCharacterSkills(
  playerClass: PlayerClass,
  bloodline: BloodlineData
): CharacterSkills {
  const classBonus = CLASS_SKILL_BONUSES[playerClass] ?? {};
  const bloodlineBonus = computeSkillBonusFromBloodline(bloodline);
  
  const skills: CharacterSkills = {
    stealth: clamp(
      roll3d6() + (classBonus.stealth ?? 0) + (bloodlineBonus.stealth ?? 0),
      1, 20
    ),
    diplomacy: clamp(
      roll3d6() + (classBonus.diplomacy ?? 0) + (bloodlineBonus.diplomacy ?? 0),
      1, 20
    ),
    athletics: clamp(
      roll3d6() + (classBonus.athletics ?? 0) + (bloodlineBonus.athletics ?? 0),
      1, 20
    ),
    awareness: clamp(
      roll3d6() + (classBonus.awareness ?? 0) + (bloodlineBonus.awareness ?? 0),
      1, 20
    ),
    lore: clamp(
      roll3d6() + (classBonus.lore ?? 0) + (bloodlineBonus.lore ?? 0),
      1, 20
    ),
    survival: clamp(
      roll3d6() + (classBonus.survival ?? 0) + (bloodlineBonus.survival ?? 0),
      1, 20
    ),
  };
  
  return skills;
}

// Get total skill bonus from equipped gear
export function getGearSkillBonus(state: GameState, skill: SkillName): number {
  let bonus = 0;
  
  const equipment = state.player.equipment;
  for (const slot of Object.keys(equipment) as Array<keyof typeof equipment>) {
    const item = equipment[slot];
    if (item?.skillBonus && item.skillBonus[skill]) {
      bonus += item.skillBonus[skill]!;
    }
  }
  
  return bonus;
}

// Get effective skill value (base + gear bonuses)
export function getEffectiveSkill(state: GameState, skill: SkillName): number {
  const baseSkill = state.skills?.[skill] ?? 10; // Default to 10 if not set
  const gearBonus = getGearSkillBonus(state, skill);
  return clamp(baseSkill + gearBonus, 1, 24); // Allow gear to push slightly above 20
}

// Get total modifier for a skill (from skill value + gear)
export function getTotalSkillModifier(state: GameState, skill: SkillName): number {
  const effectiveSkill = getEffectiveSkill(state, skill);
  return getSkillModifier(effectiveSkill);
}

// Determine outcome from roll total
function determineOutcome(total: number, target: number, criticalTarget: number): SkillCheckOutcome {
  if (total <= 3) return 'critical_fail';  // Snake eyes or near
  if (total < target - 2) return 'fail';   // More than 2 below target
  if (total < target) return 'partial';    // Within 2 of target
  if (total >= criticalTarget) return 'critical';
  return 'success';
}

// Perform a 2d6 skill check
export function performSkillCheck(
  state: GameState,
  check: SkillCheck
): SkillCheckResult {
  const [die1, die2] = roll2d6();
  const modifier = getTotalSkillModifier(state, check.skill);
  const total = die1 + die2 + modifier;
  const criticalTarget = check.criticalTarget ?? 12;
  
  return {
    roll: [die1, die2],
    modifier,
    total,
    outcome: determineOutcome(total, check.target, criticalTarget),
    skill: check.skill,
    target: check.target,
  };
}

// Check if player meets a skill threshold (for unlocking options)
export function meetsSkillThreshold(
  state: GameState,
  skill: SkillName,
  minimum: number
): boolean {
  return getEffectiveSkill(state, skill) >= minimum;
}

// Get skill tier label based on value
export function getSkillTierLabel(skillValue: number): string {
  if (skillValue <= 5) return 'Novice';
  if (skillValue <= 10) return 'Competent';
  if (skillValue <= 15) return 'Expert';
  return 'Master';
}

// Get outcome label for display
export function getOutcomeLabel(outcome: SkillCheckOutcome): string {
  switch (outcome) {
    case 'critical_fail': return 'Critical Fail';
    case 'fail': return 'Failure';
    case 'partial': return 'Partial Success';
    case 'success': return 'Success';
    case 'critical': return 'Critical Success';
  }
}

// Get outcome color for display
export function getOutcomeColor(outcome: SkillCheckOutcome): string {
  switch (outcome) {
    case 'critical_fail': return '#ff2222';
    case 'fail': return '#ff5566';
    case 'partial': return '#ffcc33';
    case 'success': return '#44dd77';
    case 'critical': return '#ffd700';
  }
}

// Get modifier display string (e.g., "+2" or "-1")
export function getModifierDisplay(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

// Get all skills with their effective values and modifiers
export function getAllSkillsWithModifiers(state: GameState): Array<{
  skill: SkillName;
  baseValue: number;
  gearBonus: number;
  effectiveValue: number;
  modifier: number;
  tier: string;
}> {
  const skillNames: SkillName[] = ['stealth', 'diplomacy', 'athletics', 'awareness', 'lore', 'survival'];
  
  return skillNames.map(skill => {
    const baseValue = state.skills?.[skill] ?? 10;
    const gearBonus = getGearSkillBonus(state, skill);
    const effectiveValue = getEffectiveSkill(state, skill);
    const modifier = getSkillModifier(effectiveValue);
    
    return {
      skill,
      baseValue,
      gearBonus,
      effectiveValue,
      modifier,
      tier: getSkillTierLabel(effectiveValue),
    };
  });
}

// Format skill name for display
export function formatSkillName(skill: SkillName): string {
  return skill.charAt(0).toUpperCase() + skill.slice(1);
}

// Calculate success probability for a skill check (for UI display)
export function calculateSuccessProbability(
  state: GameState,
  check: SkillCheck
): { success: number; partial: number; fail: number; criticalFail: number; critical: number } {
  const modifier = getTotalSkillModifier(state, check.skill);
  const criticalTarget = check.criticalTarget ?? 12;
  
  let success = 0;
  let partial = 0;
  let fail = 0;
  let criticalFail = 0;
  let critical = 0;
  
  // Calculate probability for each possible 2d6 roll (2-12)
  for (let d1 = 1; d1 <= 6; d1++) {
    for (let d2 = 1; d2 <= 6; d2++) {
      const total = d1 + d2 + modifier;
      const outcome = determineOutcome(total, check.target, criticalTarget);
      
      switch (outcome) {
        case 'critical_fail': criticalFail++; break;
        case 'fail': fail++; break;
        case 'partial': partial++; break;
        case 'success': success++; break;
        case 'critical': critical++; break;
      }
    }
  }
  
  const total = 36; // 6 * 6 possible outcomes
  return {
    success: Math.round((success / total) * 100),
    partial: Math.round((partial / total) * 100),
    fail: Math.round((fail / total) * 100),
    criticalFail: Math.round((criticalFail / total) * 100),
    critical: Math.round((critical / total) * 100),
  };
}

// Get difficulty label for a target number
export function getDifficultyLabel(target: number): string {
  if (target <= 5) return 'Trivial';
  if (target <= 7) return 'Easy';
  if (target <= 9) return 'Moderate';
  if (target <= 11) return 'Hard';
  if (target <= 13) return 'Very Hard';
  return 'Extreme';
}
