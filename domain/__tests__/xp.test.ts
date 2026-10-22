import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES } from '../constants';
import {
  MAX_LEVEL,
  awardForQuest,
  levelFromXp,
  sanitizeRules,
  streakMultiplier,
  totalXpForLevel,
  xpToAdvance,
} from '../xp';

describe('xp curve', () => {
  it('grows linearly from the configured base', () => {
    expect(xpToAdvance(1, DEFAULT_RULES)).toBe(120);
    expect(xpToAdvance(2, DEFAULT_RULES)).toBe(162);
    expect(xpToAdvance(3, DEFAULT_RULES)).toBe(204);
    expect(xpToAdvance(10, DEFAULT_RULES)).toBeGreaterThan(xpToAdvance(2, DEFAULT_RULES));
  });

  it('maps total xp onto levels at the exact threshold', () => {
    expect(totalXpForLevel(1, DEFAULT_RULES)).toBe(0);
    expect(totalXpForLevel(2, DEFAULT_RULES)).toBe(120);
    expect(levelFromXp(0, DEFAULT_RULES).level).toBe(1);
    expect(levelFromXp(119, DEFAULT_RULES).level).toBe(1);
    expect(levelFromXp(120, DEFAULT_RULES).level).toBe(2);
    expect(levelFromXp(120, DEFAULT_RULES).into).toBe(0);
  });

  it('clamps at the maximum level instead of overflowing', () => {
    const maxXp = totalXpForLevel(MAX_LEVEL, DEFAULT_RULES);
    const huge = levelFromXp(maxXp * 4, DEFAULT_RULES);
    expect(huge.level).toBe(MAX_LEVEL);
    expect(huge.progress).toBe(1);
    expect(totalXpForLevel(MAX_LEVEL + 50, DEFAULT_RULES)).toBe(maxXp);
  });

  it('caps streak multipliers', () => {
    expect(streakMultiplier(0, DEFAULT_RULES)).toBe(1);
    expect(streakMultiplier(4, DEFAULT_RULES)).toBe(1.2);
    expect(streakMultiplier(100, DEFAULT_RULES)).toBe(1 + DEFAULT_RULES.streakBonusCap);
  });

  it('rounds awards to whole numbers', () => {
    const award = awardForQuest({ difficulty: 'moderate', cadence: 'daily' }, DEFAULT_RULES, 3);
    expect(award.baseXp).toBe(20);
    expect(award.multiplier).toBe(1.15);
    expect(award.xp).toBe(23);
    expect(award.coins).toBe(4);
    expect(award.bonusXp).toBe(3);
  });

  it('repairs broken rules instead of trusting them', () => {
    const patched = sanitizeRules(
      { levelBase: -40, levelGrowth: 99, dailyGoalCount: 0, weekStart: 4 as 0 | 1 },
      DEFAULT_RULES,
    );
    expect(patched.levelBase).toBeGreaterThan(0);
    expect(patched.levelGrowth).toBeLessThan(1);
    expect(patched.dailyGoalCount).toBeGreaterThanOrEqual(1);
    expect([0, 1]).toContain(patched.weekStart);
  });
});
