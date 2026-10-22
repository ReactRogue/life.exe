import type { AccentId, ThemeMode } from '@/theme/palette';
import { ACHIEVEMENTS } from './achievements';
import { DEFAULT_CATEGORIES, DEFAULT_RULES, makeStarterQuests } from './constants';
import {
  addDaysToKey,
  daysBetweenKeys,
  isDateKey,
  isFutureKey,
  startOfWeekKey,
  todayKey,
} from './date';
import {
  activeDayKeys,
  achievementContext,
  categoryById,
  coinBalance,
  currentStreak,
  isCompletedOn,
  isQuestDoneForPeriod,
  isScheduledOn,
  profileLevel,
  questById,
  totalXp,
} from './selectors';
import type {
  AppState,
  Cadence,
  Category,
  Completion,
  CompletionOutcome,
  Difficulty,
  Purchase,
  Quest,
  Rules,
  Settings,
} from './types';
import { createId } from '@/lib/id';
import { awardForQuest, levelFromXp, sanitizeRules } from './xp';
import { cosmeticById, cosmeticStatus } from './cosmetics';

const SCHEMA_VERSION = 1;

export function createInitialState(now: Date = new Date()): AppState {
  const iso = now.toISOString();
  return {
    schemaVersion: SCHEMA_VERSION,
    onboarded: false,
    profile: {
      id: createId('user'),
      name: 'Operator',
      titleId: 'cadet',
      frameId: 'frame_standard',
      accentId: 'mint',
      sigil: 0,
      createdAt: iso,
    },
    settings: {
      preferences: { theme: 'dark', haptics: true, compactCards: false },
      rules: { ...DEFAULT_RULES, xpByDifficulty: { ...DEFAULT_RULES.xpByDifficulty }, coinsByDifficulty: { ...DEFAULT_RULES.coinsByDifficulty } },
    },
    categories: DEFAULT_CATEGORIES.map((category) => ({ ...category, createdAt: iso })),
    quests: [],
    completions: [],
    purchases: [],
    achievements: {},
    meta: {
      lastSeenDate: todayKey(now),
      createdAt: iso,
      updatedAt: iso,
      celebratedLevel: 1,
    },
  };
}

function touch(state: AppState, now: Date): AppState {
  return {
    ...state,
    meta: { ...state.meta, updatedAt: now.toISOString(), lastSeenDate: todayKey(now) },
  };
}

export interface OnboardingInput {
  name: string;
  accentId: AccentId;
  focusIds: string[];
  theme: ThemeMode;
  haptics: boolean;
  seed: boolean;
  sigil?: number;
  /** Optional level-curve calibration chosen during onboarding. */
  levelBase?: number;
  levelGrowth?: number;
}

export function completeOnboarding(state: AppState, input: OnboardingInput, now = new Date()): AppState {
  const iso = now.toISOString();
  const quests = input.seed ? makeStarterQuests(input.focusIds, iso) : [];
  const next: AppState = {
    ...state,
    onboarded: true,
    profile: {
      ...state.profile,
      name: input.name.trim().slice(0, 24) || 'Operator',
      accentId: input.accentId,
      sigil: input.sigil ?? state.profile.sigil,
    },
    settings: {
      preferences: { ...state.settings.preferences, theme: input.theme, haptics: input.haptics },
      rules: sanitizeRules(
        {
          ...state.settings.rules,
          levelBase: input.levelBase ?? state.settings.rules.levelBase,
          levelGrowth: input.levelGrowth ?? state.settings.rules.levelGrowth,
        },
        state.settings.rules,
      ),
    },
    quests,
    meta: { ...state.meta, createdAt: iso, updatedAt: iso, lastSeenDate: todayKey(now) },
  };
  return syncAchievements(next, now).state;
}

export function seedStarterQuests(state: AppState, focusIds: string[], now = new Date()): AppState {
  const templates = makeStarterQuests(focusIds.length ? focusIds : state.categories.map((c) => c.id), now.toISOString());
  const existingTitles = new Set(state.quests.filter((quest) => !quest.archivedAt).map((quest) => quest.title.toLowerCase()));
  const fresh = templates
    .filter((quest) => !existingTitles.has(quest.title.toLowerCase()))
    .map((quest) => ({ ...quest, id: createId('quest') }));
  if (!fresh.length) return state;
  return touch({ ...state, quests: [...state.quests, ...fresh] }, now);
}

export function syncAchievements(state: AppState, now = new Date()): { state: AppState; newly: string[] } {
  const ctx = achievementContext(state, todayKey(now));
  const newly = ACHIEVEMENTS.filter(
    (achievement) =>
      !state.achievements[achievement.id] && achievement.progress(ctx) >= achievement.target,
  ).map((achievement) => achievement.id);
  if (!newly.length) return { state, newly: [] };
  const iso = now.toISOString();
  const achievements = { ...state.achievements };
  for (const id of newly) achievements[id] = iso;
  return { state: { ...state, achievements }, newly };
}

export interface QuestInput {
  title: string;
  notes?: string;
  categoryId: string;
  difficulty: Difficulty;
  cadence: Cadence;
  daysOfWeek?: number[];
  targetPerWeek?: number;
}

export function addQuest(state: AppState, input: QuestInput, now = new Date()): { state: AppState; quest: Quest } {
  const iso = now.toISOString();
  const quest: Quest = {
    id: createId('quest'),
    title: input.title.trim().slice(0, 90),
    notes: input.notes?.trim().slice(0, 280) || undefined,
    categoryId: input.categoryId,
    difficulty: input.difficulty,
    cadence: input.cadence,
    daysOfWeek: input.daysOfWeek?.length ? [...new Set(input.daysOfWeek)].sort() : undefined,
    targetPerWeek: input.targetPerWeek,
    createdAt: iso,
    updatedAt: iso,
    archivedAt: null,
    source: 'user',
  };
  return { state: touch({ ...state, quests: [...state.quests, quest] }, now), quest };
}

export function updateQuest(
  state: AppState,
  questId: string,
  input: QuestInput,
  now = new Date(),
): AppState {
  const quests = state.quests.map((quest) =>
    quest.id === questId
      ? {
          ...quest,
          title: input.title.trim().slice(0, 90),
          notes: input.notes?.trim().slice(0, 280) || undefined,
          categoryId: input.categoryId,
          difficulty: input.difficulty,
          cadence: input.cadence,
          daysOfWeek: input.daysOfWeek?.length ? [...new Set(input.daysOfWeek)].sort() : undefined,
          targetPerWeek: input.targetPerWeek,
          updatedAt: now.toISOString(),
        }
      : quest,
  );
  return touch({ ...state, quests }, now);
}

export function archiveQuest(state: AppState, questId: string, now = new Date()): AppState {
  const quests = state.quests.map((quest) =>
    quest.id === questId
      ? { ...quest, archivedAt: now.toISOString(), updatedAt: now.toISOString() }
      : quest,
  );
  return touch({ ...state, quests }, now);
}

export function restoreQuest(state: AppState, questId: string, now = new Date()): AppState {
  const quests = state.quests.map((quest) =>
    quest.id === questId
      ? { ...quest, archivedAt: null, updatedAt: now.toISOString() }
      : quest,
  );
  return touch({ ...state, quests }, now);
}

export function deleteQuest(state: AppState, questId: string, now = new Date()): AppState {
  return touch({ ...state, quests: state.quests.filter((quest) => quest.id !== questId) }, now);
}

export function addCategory(
  state: AppState,
  input: { name: string; hue: string; icon: string; blurb?: string },
  now = new Date(),
): { state: AppState; category: Category } {
  const category: Category = {
    id: createId('skill'),
    name: input.name.trim().slice(0, 22) || 'New Skill',
    hue: input.hue,
    icon: input.icon,
    blurb: input.blurb?.trim().slice(0, 80),
    custom: true,
    createdAt: now.toISOString(),
  };
  return { state: touch({ ...state, categories: [...state.categories, category] }, now), category };
}

export function updateCategory(
  state: AppState,
  categoryId: string,
  input: Partial<Pick<Category, 'name' | 'hue' | 'icon' | 'blurb'>>,
  now = new Date(),
): AppState {
  const categories = state.categories.map((category) =>
    category.id === categoryId
      ? {
          ...category,
          name: input.name?.trim().slice(0, 22) || category.name,
          hue: input.hue ?? category.hue,
          icon: input.icon ?? category.icon,
          blurb: input.blurb ?? category.blurb,
        }
      : category,
  );
  return touch({ ...state, categories }, now);
}

export function removeCategory(state: AppState, categoryId: string, now = new Date()): AppState {
  const inUse = state.quests.some((quest) => !quest.archivedAt && quest.categoryId === categoryId);
  if (inUse || state.categories.length <= 1) return state;
  const categories = state.categories.filter((category) => category.id !== categoryId);
  return touch({ ...state, categories }, now);
}

export function updateSettings(state: AppState, patch: Partial<Settings>, now = new Date()): AppState {
  const next: Settings = {
    preferences: { ...state.settings.preferences, ...patch.preferences },
    rules: patch.rules ? sanitizeRules(patch.rules, state.settings.rules) : state.settings.rules,
  };
  return touch({ ...state, settings: next }, now);
}

export function updateProfile(
  state: AppState,
  patch: Partial<Pick<AppState['profile'], 'name' | 'sigil' | 'titleId' | 'frameId' | 'accentId'>>,
  now = new Date(),
): AppState {
  return touch({
    ...state,
    profile: {
      ...state.profile,
      ...patch,
      name: patch.name !== undefined ? patch.name.trim().slice(0, 24) || state.profile.name : state.profile.name,
    },
  }, now);
}

export interface CompleteQuestResult {
  state: AppState;
  outcome: CompletionOutcome;
}

interface CompleteOptions {
  dateKey?: string;
  now?: Date;
}

export function performCompletion(
  state: AppState,
  questId: string,
  options: CompleteOptions = {},
): CompleteQuestResult | null {
  const now = options.now ?? new Date();
  const today = todayKey(now);
  const date = options.dateKey ?? today;
  const quest = questById(state, questId);
  if (!quest || quest.archivedAt) return null;
  if (!isDateKey(date) || isFutureKey(date, today)) return null;

  const rules = state.settings.rules;
  const isBackfill = date !== today;
  if (isBackfill) {
    if (quest.cadence !== 'daily') return null;
    const distance = daysBetweenKeys(date, today);
    if (distance > rules.graceDays) return null;
    if (!isScheduledOn(quest, date)) return null;
  }
  if (isQuestDoneForPeriod(quest, state.completions, date, rules.weekStart)) return null;

  // Streak through the target date, including this completion.
  const provisional: Completion = {
    id: 'provisional',
    questId: quest.id,
    questTitle: quest.title,
    categoryId: quest.categoryId,
    difficulty: quest.difficulty,
    cadence: quest.cadence,
    date,
    completedAt: now.toISOString(),
    xp: 0,
    coins: 0,
    baseXp: 0,
    multiplier: 1,
    streak: 0,
    source: 'quest',
  };
  const streak = currentStreak([...state.completions, provisional], date, rules.graceDays);
  const award = awardForQuest(quest, rules, streak.days);
  const cadence = quest.cadence;
  const weeklyBonusXp = cadence === 'weekly' ? rules.weeklyBonusXp : 0;
  const weeklyBonusCoins = cadence === 'weekly' ? rules.weeklyBonusCoins : 0;

  const completion: Completion = {
    ...provisional,
    id: createId('log'),
    source: cadence === 'daily' ? 'habit' : 'quest',
    xp: award.xp + weeklyBonusXp,
    coins: award.coins + weeklyBonusCoins,
    baseXp: award.baseXp,
    multiplier: award.multiplier,
    streak: streak.days,
    note: isBackfill ? 'Recovered with a grace day' : weeklyBonusXp > 0 ? 'Weekly mission bonus applied' : undefined,
  };

  const nextCompletions = [...state.completions, completion];
  const levelBefore = profileLevel(state).level;
  let bonusCompletion: Completion | undefined;
  const goal = Math.max(1, rules.dailyGoalCount);
  const dayQuestCount = nextCompletions.filter(
    (entry) => entry.date === date && entry.source !== 'bonus',
  ).length;
  const alreadyBonus = nextCompletions.some(
    (entry) => entry.date === date && entry.source === 'bonus',
  );
  if (dayQuestCount >= goal && !alreadyBonus && rules.dailyGoalBonusXp > 0) {
    bonusCompletion = {
      id: createId('log'),
      questId: `daily-goal:${date}`,
      questTitle: 'Daily goal secured',
      categoryId: quest.categoryId,
      difficulty: 'trivial',
      cadence: 'once',
      date,
      completedAt: now.toISOString(),
      xp: rules.dailyGoalBonusXp,
      coins: 0,
      baseXp: rules.dailyGoalBonusXp,
      multiplier: 1,
      streak: streak.days,
      source: 'bonus',
      note: `${goal} directives cleared in one day`,
    };
  }

  let nextState = touch(
    {
      ...state,
      completions: bonusCompletion ? [...nextCompletions, bonusCompletion] : nextCompletions,
    },
    now,
  );
  const synced = syncAchievements(nextState, now);
  nextState = synced.state;

  const levelAfter = levelFromXp(totalXp(nextState), rules).level;
  nextState = {
    ...nextState,
    meta: { ...nextState.meta, celebratedLevel: Math.max(nextState.meta.celebratedLevel, levelAfter) },
  };

  return {
    state: nextState,
    outcome: {
      quest,
      completion,
      bonusCompletion,
      xpAwarded: completion.xp + (bonusCompletion?.xp ?? 0),
      coinsAwarded: completion.coins + (bonusCompletion?.coins ?? 0),
      streak: streak.days,
      levelBefore,
      levelAfter,
      dailyGoalHit: Boolean(bonusCompletion),
      weeklyBonusXp,
      weeklyBonusCoins,
      unlockedAchievements: synced.newly,
    },
  };
}

export function undoCompletion(state: AppState, completionId: string, now = new Date()): AppState {
  const completion = state.completions.find((entry) => entry.id === completionId);
  if (!completion) return state;
  let completions = state.completions.filter((entry) => entry.id !== completionId);
  if (completion.source !== 'bonus') {
    const remaining = completions.filter(
      (entry) => entry.date === completion.date && entry.source !== 'bonus',
    ).length;
    if (remaining < state.settings.rules.dailyGoalCount) {
      completions = completions.filter(
        (entry) => !(entry.date === completion.date && entry.source === 'bonus'),
      );
    }
  }
  return touch({ ...state, completions }, now);
}

export interface PurchaseResult {
  state: AppState;
  ok: boolean;
  reason?: 'unknown' | 'not_purchasable' | 'already_owned' | 'insufficient_coins';
  unlockedAchievements?: string[];
}

export function performPurchase(state: AppState, itemId: string, now = new Date()): PurchaseResult {
  const item = cosmeticById(itemId);
  if (!item) return { state, ok: false, reason: 'unknown' };
  if (item.requirement.type !== 'purchase') return { state, ok: false, reason: 'not_purchasable' };
  if (state.purchases.some((purchase) => purchase.itemId === itemId)) {
    return { state, ok: false, reason: 'already_owned' };
  }
  const balance = coinBalance(state);
  if (balance < item.requirement.cost) return { state, ok: false, reason: 'insufficient_coins' };
  const purchase: Purchase = {
    id: createId('buy'),
    itemId,
    cost: item.requirement.cost,
    at: now.toISOString(),
  };
  const next = touch({ ...state, purchases: [...state.purchases, purchase] }, now);
  const synced = syncAchievements(next, now);
  return { state: synced.state, ok: true, unlockedAchievements: synced.newly };
}

export interface EquipResult {
  state: AppState;
  ok: boolean;
  reason?: 'unknown' | 'locked';
}

export function equipCosmetic(state: AppState, itemId: string, now = new Date()): EquipResult {
  const item = cosmeticById(itemId);
  if (!item) return { state, ok: false, reason: 'unknown' };
  const status = cosmeticStatus(item, {
    level: profileLevel(state).level,
    achievements: new Set(Object.keys(state.achievements)),
    purchases: new Set(state.purchases.map((purchase) => purchase.itemId)),
    coins: coinBalance(state),
  });
  if (!status.owned) return { state, ok: false, reason: 'locked' };
  if (item.kind === 'title') return { state: updateProfile(state, { titleId: item.id }, now), ok: true };
  if (item.kind === 'frame') return { state: updateProfile(state, { frameId: item.id }, now), ok: true };
  return { state: updateProfile(state, { accentId: item.accentId }, now), ok: true };
}

export function importState(state: AppState, imported: AppState, now = new Date()): AppState {
  return touch(
    {
      ...imported,
      settings: {
        ...imported.settings,
        preferences: { ...imported.settings.preferences, ...state.settings.preferences },
      },
    },
    now,
  );
}

export function rulesWithPreset(rules: Rules, preset: { levelBase: number; levelGrowth: number }): Rules {
  return sanitizeRules({ ...rules, ...preset }, rules);
}

export function focusCategoryIds(state: AppState): string[] {
  return state.categories.map((category) => category.id);
}

export function categoryExists(state: AppState, categoryId: string): boolean {
  return Boolean(categoryById(state, categoryId));
}

export function backfillableDates(state: AppState, questId: string, today = todayKey()): string[] {
  const quest = questById(state, questId);
  if (!quest || quest.cadence !== 'daily') return [];
  const rules = state.settings.rules;
  return Array.from({ length: rules.graceDays }, (_, index) => addDaysToKey(today, -(index + 1)))
    .filter((date) => isScheduledOn(quest, date))
    .filter((date) => !isCompletedOn(state.completions, questId, date));
}

export function weekStartFor(today: string, rules: Rules): string {
  return startOfWeekKey(today, rules.weekStart);
}

export function streakDays(state: AppState, today = todayKey()): number {
  return currentStreak(state.completions, today, state.settings.rules.graceDays).days;
}

export function activeDates(state: AppState): string[] {
  return activeDayKeys(state.completions);
}
