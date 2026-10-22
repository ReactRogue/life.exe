import type { AwardBreakdown, Difficulty, LevelProgress, Quest, Rules } from './types';

export const MAX_LEVEL = 99;

const levelCache = new Map<string, number[]>();

function levelThresholds(rules: Rules): number[] {
  const key = `${rules.levelBase}:${rules.levelGrowth}`;
  const cached = levelCache.get(key);
  if (cached) return cached;
  const thresholds: number[] = [0];
  let total = 0;
  for (let level = 1; level < MAX_LEVEL + 1; level += 1) {
    total += Math.round(rules.levelBase * (1 + (level - 1) * rules.levelGrowth));
    thresholds.push(total);
  }
  levelCache.set(key, thresholds);
  return thresholds;
}

/** XP needed to advance from `level` to `level + 1`. */
export function xpToAdvance(level: number, rules: Rules): number {
  return Math.round(rules.levelBase * (1 + (level - 1) * rules.levelGrowth));
}

/** Total lifetime XP required to sit at `level` (level 1 = 0). */
export function totalXpForLevel(level: number, rules: Rules): number {
  const thresholds = levelThresholds(rules);
  const clamped = Math.min(Math.max(1, Math.floor(level)), MAX_LEVEL);
  return thresholds[clamped - 1] ?? 0;
}

export function levelFromXp(totalXp: number, rules: Rules): LevelProgress {
  const safeXp = Math.max(0, Math.floor(totalXp));
  const thresholds = levelThresholds(rules);
  let level = 1;
  while (level < MAX_LEVEL && safeXp >= thresholds[level]) level += 1;
  const floor = thresholds[level - 1] ?? 0;
  const next = thresholds[level] ?? floor + xpToAdvance(level, rules);
  const span = Math.max(1, next - floor);
  const into = Math.max(0, safeXp - floor);
  return {
    level,
    into,
    span,
    progress: level >= MAX_LEVEL ? 1 : Math.min(1, into / span),
    nextLevelAt: next,
    totalXp: safeXp,
  };
}

export function levelTitleForNext(level: number, rules: Rules): number {
  return totalXpForLevel(level + 1, rules);
}

export function streakMultiplier(streakDays: number, rules: Rules): number {
  const raw = 1 + Math.max(0, streakDays) * rules.streakBonusPerDay;
  return Math.round(Math.min(1 + rules.streakBonusCap, raw) * 100) / 100;
}

export function baseAward(difficulty: Difficulty, rules: Rules): number {
  return Math.max(0, Math.round(rules.xpByDifficulty[difficulty]));
}

export function awardForQuest(
  quest: Pick<Quest, 'difficulty' | 'cadence'>,
  rules: Rules,
  streakDays: number,
): AwardBreakdown {
  const baseXp = baseAward(quest.difficulty, rules);
  const multiplier = streakMultiplier(streakDays, rules);
  const xp = Math.round(baseXp * multiplier);
  const coins = Math.max(0, Math.round(rules.coinsByDifficulty[quest.difficulty] ?? 0));
  return { baseXp, multiplier, xp, coins, streak: streakDays, bonusXp: xp - baseXp };
}

export function rulesSignature(rules: Rules): string {
  return [
    rules.xpByDifficulty.trivial,
    rules.xpByDifficulty.easy,
    rules.xpByDifficulty.moderate,
    rules.xpByDifficulty.hard,
    rules.xpByDifficulty.epic,
    rules.coinsByDifficulty.trivial,
    rules.coinsByDifficulty.easy,
    rules.coinsByDifficulty.moderate,
    rules.coinsByDifficulty.hard,
    rules.coinsByDifficulty.epic,
    rules.streakBonusPerDay,
    rules.streakBonusCap,
    rules.dailyGoalCount,
    rules.dailyGoalBonusXp,
    rules.weeklyBonusXp,
    rules.weeklyBonusCoins,
    rules.graceDays,
    rules.levelBase,
    rules.levelGrowth,
  ].join(':');
}

export function sanitizeRules(input: Partial<Rules> | undefined, fallback: Rules): Rules {
  if (!input) return fallback;
  const num = (value: unknown, defaultValue: number, min: number, max: number) => {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed)) return defaultValue;
    return Math.min(max, Math.max(min, parsed));
  };
  const xp = input.xpByDifficulty ?? fallback.xpByDifficulty;
  const coins = input.coinsByDifficulty ?? fallback.coinsByDifficulty;
  return {
    ...fallback,
    xpByDifficulty: {
      trivial: num(xp.trivial, fallback.xpByDifficulty.trivial, 1, 500),
      easy: num(xp.easy, fallback.xpByDifficulty.easy, 1, 500),
      moderate: num(xp.moderate, fallback.xpByDifficulty.moderate, 1, 500),
      hard: num(xp.hard, fallback.xpByDifficulty.hard, 1, 500),
      epic: num(xp.epic, fallback.xpByDifficulty.epic, 1, 500),
    },
    coinsByDifficulty: {
      trivial: num(coins.trivial, fallback.coinsByDifficulty.trivial, 0, 100),
      easy: num(coins.easy, fallback.coinsByDifficulty.easy, 0, 100),
      moderate: num(coins.moderate, fallback.coinsByDifficulty.moderate, 0, 100),
      hard: num(coins.hard, fallback.coinsByDifficulty.hard, 0, 100),
      epic: num(coins.epic, fallback.coinsByDifficulty.epic, 0, 100),
    },
    streakBonusPerDay: num(input.streakBonusPerDay, fallback.streakBonusPerDay, 0, 0.25),
    streakBonusCap: num(input.streakBonusCap, fallback.streakBonusCap, 0, 2),
    dailyGoalCount: Math.round(num(input.dailyGoalCount, fallback.dailyGoalCount, 1, 12)),
    dailyGoalBonusXp: Math.round(num(input.dailyGoalBonusXp, fallback.dailyGoalBonusXp, 0, 200)),
    weeklyBonusXp: Math.round(num(input.weeklyBonusXp, fallback.weeklyBonusXp, 0, 300)),
    weeklyBonusCoins: Math.round(num(input.weeklyBonusCoins, fallback.weeklyBonusCoins, 0, 60)),
    graceDays: Math.round(num(input.graceDays, fallback.graceDays, 0, 3)),
    weekStart: input.weekStart === 0 ? 0 : 1,
    levelBase: Math.round(num(input.levelBase, fallback.levelBase, 50, 400)),
    levelGrowth: Math.round(num(input.levelGrowth, fallback.levelGrowth, 0.1, 0.9) * 100) / 100,
  };
}
