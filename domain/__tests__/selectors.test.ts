import { describe, expect, it } from 'vitest';
import { addQuest, completeOnboarding, createInitialState, performCompletion } from '../engine';
import {
  achievementViews,
  activityEntries,
  categoryStats,
  groupActivity,
  heatmapData,
  profileLevel,
  rangeSummary,
  todayDirectives,
  totalXp,
} from '../selectors';
import type { AppState, Quest } from '../types';

const NOW = new Date('2026-10-22T10:00:00');
const TODAY = '2026-10-22';

function build(): { state: AppState; quest: Quest } {
  const base = completeOnboarding(
    createInitialState(NOW),
    {
      name: 'Tester',
      accentId: 'mint',
      focusIds: ['fitness'],
      theme: 'dark',
      haptics: false,
      seed: false,
    },
    NOW,
  );
  return addQuest(
    base,
    { title: 'Move', categoryId: 'fitness', difficulty: 'moderate', cadence: 'daily' },
    NOW,
  );
}

function withCompletions(): { state: AppState; quest: Quest } {
  const { state, quest } = build();
  let current = state;
  for (const day of ['2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20']) {
    const result = performCompletion(current, quest.id, {
      dateKey: day,
      now: new Date(`${day}T10:00:00`),
    });
    if (result) current = result.state;
  }
  const result = performCompletion(current, quest.id, { now: NOW });
  if (result) current = result.state;
  return { state: current, quest };
}

describe('selectors', () => {
  it('lists scheduled directives for today', () => {
    const { state, quest } = build();
    expect(todayDirectives(state, TODAY).map((entry) => entry.id)).toEqual([quest.id]);
  });

  it('summarises a range from the activity log', () => {
    const { state } = withCompletions();
    const summary = rangeSummary(state, 30, TODAY);
    expect(summary.totalXp).toBe(totalXp(state));
    expect(summary.completions).toBe(state.completions.length);
    expect(summary.series).toHaveLength(30);
    expect(summary.activeDays).toBe(5);
    expect(summary.averageXp).toBeGreaterThan(0);
  });

  it('builds a heatmap that matches activity', () => {
    const { state } = withCompletions();
    const map = heatmapData(state, TODAY, 13);
    expect(map.totalXp).toBe(totalXp(state));
    expect(map.activeDays).toBe(5);
    const cells = map.columns.flat();
    expect(cells.some((cell) => cell.date === TODAY && cell.xp > 0)).toBe(true);
  });

  it('derives levels and shares per skill', () => {
    const { state } = withCompletions();
    const fitness = categoryStats(state).find((stat) => stat.category.id === 'fitness');
    expect(fitness?.completions).toBe(5);
    expect(fitness?.xp).toBe(totalXp(state));
    expect(fitness?.share).toBeCloseTo(1);
    expect(profileLevel(state).totalXp).toBe(totalXp(state));
    expect(profileLevel(state).level).toBeGreaterThanOrEqual(1);
  });

  it('orders activity newest first and groups by day', () => {
    const { state } = withCompletions();
    const entries = activityEntries(state);
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0].date).toBe(TODAY);
    const groups = groupActivity(entries, TODAY);
    expect(groups[0].label).toBe('Today');
    expect(groups.reduce((sum, group) => sum + group.entries.length, 0)).toBe(entries.length);
  });

  it('exposes achievement progress clamped to target', () => {
    const { state } = withCompletions();
    const views = achievementViews(state, TODAY);
    const first = views.find((view) => view.def.id === 'first_signal');
    expect(first?.unlocked).toBe(true);
    for (const view of views) {
      expect(view.current).toBeLessThanOrEqual(view.target);
      expect(view.ratio).toBeGreaterThanOrEqual(0);
      expect(view.ratio).toBeLessThanOrEqual(1);
    }
  });

  it('never reports a negative level', () => {
    const level = profileLevel(createInitialState(NOW));
    expect(level.level).toBe(1);
    expect(level.progress).toBe(0);
  });
});
