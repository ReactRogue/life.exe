import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES } from '../constants';
import {
  addQuest,
  completeOnboarding,
  createInitialState,
  performCompletion,
  undoCompletion,
  updateSettings,
  archiveQuest,
  backfillableDates,
} from '../engine';
import { todayKey } from '../date';
import { activeQuests, totalXp, coinBalance, currentStreakOf } from '../selectors';

const NOW = new Date('2026-10-22T09:00:00');
const TODAY = todayKey(NOW);

function seeded() {
  const base = completeOnboarding(
    createInitialState(NOW),
    {
      name: 'Tester',
      accentId: 'mint',
      focusIds: ['fitness', 'learning'],
      theme: 'dark',
      haptics: false,
      seed: false,
      sigil: 2,
    },
    NOW,
  );
  const { state, quest } = addQuest(
    base,
    {
      title: 'Read ten pages',
      categoryId: 'learning',
      difficulty: 'moderate',
      cadence: 'daily',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    },
    NOW,
  );
  return { state, quest };
}

describe('engine completion flow', () => {
  it('starts with an unonboarded clean save', () => {
    const state = createInitialState(NOW);
    expect(state.onboarded).toBe(false);
    expect(state.quests).toHaveLength(0);
    expect(state.categories.length).toBeGreaterThanOrEqual(5);
    expect(state.settings.rules.levelBase).toBe(DEFAULT_RULES.levelBase);
  });

  it('awards xp and coins for a completion', () => {
    const { state, quest } = seeded();
    const result = performCompletion(state, quest.id, { now: NOW });
    expect(result).not.toBeNull();
    const outcome = result!.outcome;
    expect(outcome.completion.questId).toBe(quest.id);
    expect(outcome.completion.date).toBe(TODAY);
    expect(outcome.completion.source).toBe('habit');
    expect(outcome.completion.baseXp).toBe(20);
    expect(outcome.completion.multiplier).toBe(1.05);
    expect(outcome.completion.xp).toBe(21);
    expect(outcome.completion.coins).toBe(4);
    expect(totalXp(result!.state)).toBe(21);
    expect(coinBalance(result!.state)).toBeGreaterThanOrEqual(4);
  });

  it('refuses a duplicate daily completion', () => {
    const { state, quest } = seeded();
    const first = performCompletion(state, quest.id, { now: NOW })!;
    const second = performCompletion(first.state, quest.id, { now: NOW });
    expect(second).toBeNull();
  });

  it('allows one weekly completion per week', () => {
    const { state } = seeded();
    const weekly = addQuest(
      state,
      { title: 'Weekly review', categoryId: 'discipline', difficulty: 'hard', cadence: 'weekly' },
      NOW,
    );
    const first = performCompletion(weekly.state, weekly.quest.id, { now: NOW })!;
    expect(first.outcome.weeklyBonusXp).toBe(DEFAULT_RULES.weeklyBonusXp);
    expect(first.outcome.completion.xp).toBe(37 + DEFAULT_RULES.weeklyBonusXp);
    expect(first.outcome.completion.coins).toBe(7 + DEFAULT_RULES.weeklyBonusCoins);
    const second = performCompletion(first.state, weekly.quest.id, { now: NOW });
    expect(second).toBeNull();
  });

  it('swaps the completion off when undone', () => {
    const { state, quest } = seeded();
    const first = performCompletion(state, quest.id, { now: NOW })!;
    const undone = undoCompletion(first.state, first.outcome.completion.id, NOW);
    expect(undone.completions).toHaveLength(0);
    expect(totalXp(undone)).toBe(0);
    // The achievement unlocked by the completion is permanent, but no quest coins remain.
    expect(undone.purchases).toHaveLength(0);
    expect(undone.completions.reduce((sum, entry) => sum + entry.coins, 0)).toBe(0);
    expect(undone.achievements.first_signal).toBeTruthy();
  });

  it('awards the daily goal bonus exactly once', () => {
    let state = seeded().state;
    const ids: string[] = [];
    for (let index = 0; index < 3; index += 1) {
      const added = addQuest(
        state,
        { title: `Directive ${index}`, categoryId: 'fitness', difficulty: 'easy', cadence: 'daily' },
        NOW,
      );
      state = added.state;
      ids.push(added.quest.id);
    }
    for (const [index, id] of ids.entries()) {
      const result = performCompletion(state, id, { now: NOW });
      if (!result) throw new Error('expected completion');
      state = result.state;
      if (index < ids.length - 1) {
        expect(result.outcome.bonusCompletion).toBeUndefined();
        expect(result.outcome.dailyGoalHit).toBe(false);
      } else {
        expect(result.outcome.bonusCompletion?.xp).toBe(DEFAULT_RULES.dailyGoalBonusXp);
        expect(result.outcome.dailyGoalHit).toBe(true);
      }
    }
    const bonuses = state.completions.filter((entry) => entry.source === 'bonus');
    expect(bonuses).toHaveLength(1);
    const questXp = state.completions
      .filter((entry) => entry.source !== 'bonus')
      .reduce((sum, entry) => sum + entry.xp, 0);
    expect(totalXp(state)).toBe(questXp + DEFAULT_RULES.dailyGoalBonusXp);
  });

  it('lets a missed day be recovered inside the grace window', () => {
    const { state, quest } = seeded();
    const yesterday = '2026-10-21';
    const recovered = performCompletion(state, quest.id, { dateKey: yesterday, now: NOW })!;
    expect(recovered.outcome.completion.date).toBe(yesterday);
    expect(recovered.outcome.completion.note).toContain('Recovered');
    const tooOld = performCompletion(state, quest.id, { dateKey: '2026-10-19', now: NOW });
    expect(tooOld).toBeNull();
    expect(backfillableDates(state, quest.id, TODAY)).toEqual([yesterday]);
  });

  it('hides archived quests from the active board but keeps history', () => {
    const { state, quest } = seeded();
    const done = performCompletion(state, quest.id, { now: NOW })!;
    const archived = archiveQuest(done.state, quest.id, NOW);
    expect(activeQuests(archived)).toHaveLength(0);
    expect(archived.completions).toHaveLength(1);
    expect(totalXp(archived)).toBe(done.outcome.completion.xp);
  });

  it('recomputes streaks without shaming gaps', () => {
    const { state, quest } = seeded();
    const dayOne = performCompletion(state, quest.id, { now: new Date('2026-10-20T09:00:00') })!;
    const gap = performCompletion(dayOne.state, quest.id, { now: new Date('2026-10-22T09:00:00') })!;
    const streak = currentStreakOf(gap.state, TODAY);
    expect(streak.days).toBe(2);
    expect(streak.activeToday).toBe(true);
  });

  it('respects a rules change on the next completion', () => {
    const { state, quest } = seeded();
    const patched = updateSettings(
      state,
      {
        rules: {
          ...state.settings.rules,
          xpByDifficulty: { ...state.settings.rules.xpByDifficulty, moderate: 50 },
        },
      },
      NOW,
    );
    const result = performCompletion(patched, quest.id, { now: NOW })!;
    expect(result.outcome.completion.baseXp).toBe(50);
    expect(result.outcome.completion.xp).toBe(Math.round(50 * result.outcome.completion.multiplier));
  });
});
