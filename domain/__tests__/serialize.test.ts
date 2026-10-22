import { describe, expect, it } from 'vitest';
import { addQuest, createInitialState, performCompletion } from '../engine';
import { SAVE_APP_ID, parseSave, serializeState } from '../serialize';

const NOW = new Date('2026-10-22T10:00:00');

function populated() {
  const base = createInitialState(NOW);
  const { state, quest } = addQuest(
    base,
    { title: 'Stretch', categoryId: 'fitness', difficulty: 'easy', cadence: 'daily' },
    NOW,
  );
  return performCompletion(state, quest.id, { now: NOW })!.state;
}

describe('save format', () => {
  it('round-trips a populated state', () => {
    const state = populated();
    const parsed = parseSave(serializeState(state));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok || !parsed.state) return;
    expect(parsed.state.quests).toHaveLength(1);
    expect(parsed.state.completions).toHaveLength(1);
    expect(parsed.state.completions[0].questTitle).toBe('Stretch');
    expect(parsed.state.profile.name).toBe(state.profile.name);
  });

  it('embeds an app marker and schema version', () => {
    const payload = JSON.parse(serializeState(createInitialState(NOW)));
    expect(payload.app).toBe(SAVE_APP_ID);
    expect(payload.schemaVersion).toBe(1);
    expect(typeof payload.exportedAt).toBe('string');
  });

  it('rejects junk, foreign saves, and broken structure', () => {
    expect(parseSave('not json').ok).toBe(false);
    expect(parseSave('[]').ok).toBe(false);
    expect(parseSave(JSON.stringify({ app: 'other.app', state: {} })).ok).toBe(false);
    expect(parseSave(JSON.stringify({ app: SAVE_APP_ID, state: 'nope' })).ok).toBe(false);
  });

  it('normalises missing fields against the fallback', () => {
    const minimal = JSON.stringify({
      app: SAVE_APP_ID,
      schemaVersion: 1,
      state: { profile: { name: 'Nova' }, quests: [], completions: [] },
    });
    const parsed = parseSave(minimal);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok || !parsed.state) return;
    expect(parsed.state.profile.name).toBe('Nova');
    expect(parsed.state.categories.length).toBeGreaterThanOrEqual(5);
    expect(parsed.state.settings.rules.dailyGoalCount).toBeGreaterThan(0);
  });

  it('drops malformed completions instead of crashing', () => {
    const raw = JSON.parse(serializeState(populated()));
    raw.state.completions.push({ id: 'broken' });
    raw.state.completions.push({
      id: 'valid',
      questId: 'q',
      questTitle: 'X',
      categoryId: 'fitness',
      difficulty: 'easy',
      cadence: 'daily',
      date: '2026-10-22',
      completedAt: '2026-10-22T10:00:00.000Z',
      xp: 10,
      coins: 1,
      baseXp: 10,
      multiplier: 1,
      streak: 1,
      source: 'quest',
    });
    const parsed = parseSave(JSON.stringify(raw));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok || !parsed.state) return;
    expect(parsed.state.completions.every((entry) => typeof entry.questTitle === 'string')).toBe(true);
    expect(parsed.state.completions.length).toBeLessThanOrEqual(2);
  });
});
