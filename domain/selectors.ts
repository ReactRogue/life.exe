import type { AccentId } from '@/theme/palette';
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_MAP,
  achievementReward,
  type AchievementContext,
  type AchievementDef,
  type AchievementTier,
} from './achievements';
import { CADENCE_MAP, DEFAULT_CATEGORIES, DIFFICULTY_MAP, LEVEL_TITLES } from './constants';
import {
  addDaysToKey,
  compareDateKeys,
  daysBetweenKeys,
  formatDateKey,
  formatWeekday,
  isFutureKey,
  startOfWeekKey,
  todayKey as todayKeyFn,
  weekdayOfKey,
  weekDates,
} from './date';
import {
  ACCENT_ITEMS,
  FRAMES,
  TITLES,
  cosmeticStatus,
  frameById,
  ownedCosmetics,
  titleById,
  type CosmeticItem,
  type CosmeticSnapshot,
  type CosmeticStatus,
} from './cosmetics';
import type {
  AppState,
  Cadence,
  Category,
  Completion,
  Difficulty,
  LevelProgress,
  Quest,
} from './types';
import { levelFromXp, MAX_LEVEL } from './xp';

export const CORE_CATEGORY_IDS = DEFAULT_CATEGORIES.map((c) => c.id);

export function activeQuests(state: AppState): Quest[] {
  return state.quests.filter((quest) => !quest.archivedAt);
}

export function questById(state: AppState, id: string): Quest | undefined {
  return state.quests.find((quest) => quest.id === id);
}

export function categoryById(state: AppState, id: string): Category | undefined {
  return state.categories.find((category) => category.id === id);
}

export function categoryName(state: AppState, id: string): string {
  return categoryById(state, id)?.name ?? 'General';
}

export function isScheduledOn(quest: Quest, dateKey: string): boolean {
  if (quest.cadence === 'once') return true;
  if (quest.cadence === 'weekly') return true;
  if (!quest.daysOfWeek || quest.daysOfWeek.length === 0) return true;
  return quest.daysOfWeek.includes(weekdayOfKey(dateKey));
}

export function questCompletions(state: AppState, questId: string): Completion[] {
  return state.completions.filter((completion) => completion.questId === questId);
}

export function isCompletedOn(completions: Completion[], questId: string, dateKey: string): boolean {
  return completions.some((completion) => completion.questId === questId && completion.date === dateKey);
}

export function isQuestDoneForPeriod(
  quest: Quest,
  completions: Completion[],
  today: string,
  weekStart: 0 | 1,
): boolean {
  if (quest.cadence === 'daily') return isCompletedOn(completions, quest.id, today);
  if (quest.cadence === 'weekly') {
    const start = startOfWeekKey(today, weekStart);
    return completions.some(
      (completion) =>
        completion.questId === quest.id &&
        completion.date >= start &&
        completion.date <= today,
    );
  }
  return completions.some((completion) => completion.questId === quest.id);
}

export function lastCompletionForQuest(completions: Completion[], questId: string): Completion | undefined {
  return completions
    .filter((completion) => completion.questId === questId)
    .sort((a, b) => compareDateKeys(b.date, a.date))[0];
}

export function isQuestScheduledToday(quest: Quest, today: string): boolean {
  if (quest.cadence === 'once') return true;
  return isScheduledOn(quest, today);
}

export interface ProgressCount {
  done: number;
  total: number;
  ratio: number;
}

export function todayDirectives(state: AppState, today: string): Quest[] {
  const completions = state.completions;
  return activeQuests(state)
    .filter((quest) => quest.cadence === 'daily' && isScheduledOn(quest, today))
    .sort((a, b) => {
      const doneA = isCompletedOn(completions, a.id, today) ? 1 : 0;
      const doneB = isCompletedOn(completions, b.id, today) ? 1 : 0;
      if (doneA !== doneB) return doneA - doneB;
      return 0;
    });
}

export function todayProgress(state: AppState, today: string): ProgressCount {
  const quests = todayDirectives(state, today);
  const done = quests.filter((quest) => isCompletedOn(state.completions, quest.id, today)).length;
  return { done, total: quests.length, ratio: quests.length ? done / quests.length : 0 };
}

export function weeklyQuests(state: AppState): Quest[] {
  return activeQuests(state).filter((quest) => quest.cadence === 'weekly');
}

export function weeklyProgress(state: AppState, today: string): ProgressCount {
  const quests = weeklyQuests(state);
  const done = quests.filter((quest) =>
    isQuestDoneForPeriod(quest, state.completions, today, state.settings.rules.weekStart),
  ).length;
  return { done, total: quests.length, ratio: quests.length ? done / quests.length : 0 };
}

export function onceQuests(state: AppState): Quest[] {
  return activeQuests(state).filter((quest) => quest.cadence === 'once');
}

export function dailyGoalProgress(state: AppState, today: string): ProgressCount & { bonusClaimed: boolean } {
  const goal = Math.max(1, state.settings.rules.dailyGoalCount);
  const done = state.completions.filter(
    (completion) => completion.date === today && completion.source !== 'bonus',
  ).length;
  const bonusClaimed = state.completions.some(
    (completion) => completion.date === today && completion.source === 'bonus',
  );
  return { done: Math.min(done, goal), total: goal, ratio: Math.min(1, done / goal), bonusClaimed };
}

export function activeDayKeys(completions: Completion[]): string[] {
  return Array.from(
    new Set(completions.filter((completion) => completion.source !== 'bonus').map((c) => c.date)),
  ).sort();
}

export interface StreakResult {
  days: number;
  graceUsed: number;
  activeToday: boolean;
}

export function currentStreak(completions: Completion[], today: string, graceDays: number): StreakResult {
  const active = new Set(activeDayKeys(completions));
  const activeToday = active.has(today);
  let cursor = activeToday ? today : addDaysToKey(today, -1);
  let days = 0;
  let pendingGap = 0;
  let graceUsed = 0;
  let guard = 0;
  while (guard < 4000) {
    guard += 1;
    if (active.has(cursor)) {
      if (days > 0) graceUsed += pendingGap;
      pendingGap = 0;
      days += 1;
      cursor = addDaysToKey(cursor, -1);
      continue;
    }
    pendingGap += 1;
    if (pendingGap > graceDays) break;
    cursor = addDaysToKey(cursor, -1);
  }
  return { days, graceUsed, activeToday };
}

export function longestStreak(completions: Completion[], graceDays: number): number {
  const days = activeDayKeys(completions);
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of days) {
    if (previous === null) {
      run = 1;
    } else {
      const gap = daysBetweenKeys(previous, day) - 1;
      run = gap <= graceDays ? run + 1 : 1;
    }
    best = Math.max(best, run);
    previous = day;
  }
  return best;
}

export function habitStreak(
  quest: Quest,
  completions: Completion[],
  today: string,
  graceDays: number,
): number {
  const done = new Set(completions.filter((c) => c.questId === quest.id).map((c) => c.date));
  const scheduledKeys: string[] = [];
  for (let i = 0; i < 365; i += 1) {
    const key = addDaysToKey(today, -i);
    if (isScheduledOn(quest, key)) scheduledKeys.push(key);
  }
  let started = false;
  let pending = 0;
  let streak = 0;
  for (const key of scheduledKeys) {
    const isToday = key === today;
    if (done.has(key)) {
      started = true;
      pending = 0;
      streak += 1;
      continue;
    }
    if (isToday) continue; // Today is still pending, never breaks a streak.
    if (!started) continue; // Gaps before the first active day do not break anything.
    pending += 1;
    if (pending > graceDays) break;
  }
  return streak;
}

export function totalXp(state: AppState): number {
  return state.completions.reduce((sum, completion) => sum + completion.xp, 0);
}

export function totalCoinsEarned(state: AppState): number {
  const fromQuests = state.completions.reduce((sum, completion) => sum + completion.coins, 0);
  const fromAchievements = Object.keys(state.achievements).reduce(
    (sum, id) => sum + achievementReward(id),
    0,
  );
  return fromQuests + fromAchievements;
}

export function totalCoinsSpent(state: AppState): number {
  return state.purchases.reduce((sum, purchase) => sum + purchase.cost, 0);
}

export function coinBalance(state: AppState): number {
  return Math.max(0, totalCoinsEarned(state) - totalCoinsSpent(state));
}

export function profileLevel(state: AppState): LevelProgress {
  return levelFromXp(totalXp(state), state.settings.rules);
}

export function currentStreakOf(state: AppState, today: string): StreakResult {
  return currentStreak(state.completions, today, state.settings.rules.graceDays);
}

export function longestStreakOf(state: AppState): number {
  return longestStreak(state.completions, state.settings.rules.graceDays);
}

export interface DaySeriesPoint {
  date: string;
  xp: number;
  coins: number;
  count: number;
  isToday: boolean;
}

export function daySeries(state: AppState, dayCount: number, today: string): DaySeriesPoint[] {
  const start = addDaysToKey(today, -(dayCount - 1));
  const map = new Map<string, { xp: number; coins: number; count: number }>();
  for (const completion of state.completions) {
    if (completion.date < start || completion.date > today) continue;
    const entry = map.get(completion.date) ?? { xp: 0, coins: 0, count: 0 };
    entry.xp += completion.xp;
    entry.coins += completion.coins;
    if (completion.source !== 'bonus') entry.count += 1;
    map.set(completion.date, entry);
  }
  return Array.from({ length: dayCount }, (_, index) => {
    const date = addDaysToKey(start, index);
    const entry = map.get(date) ?? { xp: 0, coins: 0, count: 0 };
    return { date, ...entry, isToday: date === today };
  });
}

export interface RangeSummary {
  days: number;
  series: DaySeriesPoint[];
  totalXp: number;
  totalCoins: number;
  completions: number;
  activeDays: number;
  consistency: number;
  averageXp: number;
  bestDay: DaySeriesPoint | null;
  bestDayCount: number;
}

export function rangeSummary(state: AppState, days: number, today: string): RangeSummary {
  const series = daySeries(state, days, today);
  const total = series.reduce(
    (acc, point) => {
      acc.xp += point.xp;
      acc.coins += point.coins;
      acc.completions += point.count;
      acc.activeDays += point.count > 0 ? 1 : 0;
      if (point.xp > (acc.best?.xp ?? 0)) acc.best = point;
      return acc;
    },
    { xp: 0, coins: 0, completions: 0, activeDays: 0, best: null as DaySeriesPoint | null },
  );
  return {
    days,
    series,
    totalXp: total.xp,
    totalCoins: total.coins,
    completions: total.completions,
    activeDays: total.activeDays,
    consistency: days > 0 ? total.activeDays / days : 0,
    averageXp: days > 0 ? Math.round(total.xp / days) : 0,
    bestDay: total.best,
    bestDayCount: total.best?.count ?? 0,
  };
}

export interface CategoryStat {
  category: Category;
  xp: number;
  completions: number;
  lastCompletedAt?: string;
  level: LevelProgress;
  share: number;
  hueKey: string;
}

export function categoryStats(state: AppState): CategoryStat[] {
  const total = totalXp(state) || 1;
  return state.categories.map((category) => {
    const completions = state.completions.filter((completion) => completion.categoryId === category.id);
    const xp = completions.reduce((sum, completion) => sum + completion.xp, 0);
    const last = completions[completions.length - 1];
    return {
      category,
      xp,
      completions: completions.length,
      lastCompletedAt: last?.completedAt,
      level: levelFromXp(xp, state.settings.rules),
      share: xp / total,
      hueKey: category.hue,
    };
  });
}

export function categoryStatFor(state: AppState, categoryId: string): CategoryStat | undefined {
  return categoryStats(state).find((stat) => stat.category.id === categoryId);
}

export function skillLevelFor(state: AppState, categoryId: string): LevelProgress {
  const xp = state.completions
    .filter((completion) => completion.categoryId === categoryId)
    .reduce((sum, completion) => sum + completion.xp, 0);
  return levelFromXp(xp, state.settings.rules);
}

export function weeklyStreakDays(state: AppState, today: string): { date: string; count: number; xp: number }[] {
  const keys = weekDates(today, state.settings.rules.weekStart);
  return keys.map((date) => {
    const entries = state.completions.filter(
      (completion) => completion.date === date && completion.source !== 'bonus',
    );
    return {
      date,
      count: entries.length,
      xp: state.completions
        .filter((completion) => completion.date === date)
        .reduce((sum, completion) => sum + completion.xp, 0),
    };
  });
}

export interface HeatmapCell {
  date: string;
  xp: number;
  count: number;
  level: number;
  isToday: boolean;
  isFuture: boolean;
  inRange: boolean;
}

export interface HeatmapData {
  columns: HeatmapCell[][];
  months: { label: string; column: number }[];
  maxXp: number;
  maxCount: number;
  activeDays: number;
  totalXp: number;
}

export function heatmapData(state: AppState, today: string, weeks = 13): HeatmapData {
  const weekStart = state.settings.rules.weekStart;
  const currentWeekStart = startOfWeekKey(today, weekStart);
  const firstWeekStart = addDaysToKey(currentWeekStart, -(weeks - 1) * 7);
  const completionsByDate = new Map<string, { xp: number; count: number }>();
  for (const completion of state.completions) {
    const entry = completionsByDate.get(completion.date) ?? { xp: 0, count: 0 };
    entry.xp += completion.xp;
    if (completion.source !== 'bonus') entry.count += 1;
    completionsByDate.set(completion.date, entry);
  }
  let maxXp = 0;
  let maxCount = 0;
  let total = 0;
  let activeDays = 0;
  const columns: HeatmapCell[][] = [];
  const months: { label: string; column: number }[] = [];
  let lastMonth = -1;

  for (let col = 0; col < weeks; col += 1) {
    const columnFirst = addDaysToKey(firstWeekStart, col * 7);
    const columnDate = new Date(`${columnFirst}T12:00:00`);
    if (columnDate.getMonth() !== lastMonth) {
      lastMonth = columnDate.getMonth();
      months.push({
        label: columnDate.toLocaleDateString('en-US', { month: 'short' }),
        column: col,
      });
    }
    const cells: HeatmapCell[] = [];
    for (let row = 0; row < 7; row += 1) {
      const date = addDaysToKey(columnFirst, row);
      const entry = completionsByDate.get(date);
      const isFuture = isFutureKey(date, today);
      const inRange = date <= today;
      const xp = entry?.xp ?? 0;
      const count = entry?.count ?? 0;
      if (inRange) {
        maxXp = Math.max(maxXp, xp);
        maxCount = Math.max(maxCount, count);
        total += xp;
        if (count > 0) activeDays += 1;
      }
      cells.push({ date, xp, count, level: 0, isToday: date === today, isFuture, inRange });
    }
    columns.push(cells);
  }

  const levelFor = (xp: number) => {
    if (xp <= 0) return 0;
    if (maxXp <= 0) return 1;
    return Math.max(1, Math.min(4, Math.ceil((xp / maxXp) * 4)));
  };
  for (const column of columns) for (const cell of column) cell.level = levelFor(cell.xp);

  return { columns, months, maxXp, maxCount, activeDays, totalXp: total };
}

export interface ActivityEntry {
  id: string;
  questId: string;
  title: string;
  categoryId: string;
  categoryName: string;
  difficulty: Difficulty;
  difficultyLabel: string;
  date: string;
  completedAt: string;
  xp: number;
  coins: number;
  source: Completion['source'];
  multiplier: number;
  streak: number;
}

export function activityEntries(state: AppState, limit = 250): ActivityEntry[] {
  return [...state.completions]
    .sort((a, b) => (a.completedAt < b.completedAt ? 1 : a.completedAt > b.completedAt ? -1 : 0))
    .slice(0, limit)
    .map((completion) => ({
      id: completion.id,
      questId: completion.questId,
      title: completion.questTitle,
      categoryId: completion.categoryId,
      categoryName: categoryName(state, completion.categoryId),
      difficulty: completion.difficulty,
      difficultyLabel: DIFFICULTY_MAP[completion.difficulty]?.label ?? completion.difficulty,
      date: completion.date,
      completedAt: completion.completedAt,
      xp: completion.xp,
      coins: completion.coins,
      source: completion.source,
      multiplier: completion.multiplier,
      streak: completion.streak,
    }));
}

export interface ActivityGroup {
  date: string;
  label: string;
  xp: number;
  entries: ActivityEntry[];
}

export function groupActivity(entries: ActivityEntry[], today: string): ActivityGroup[] {
  const groups = new Map<string, ActivityEntry[]>();
  for (const entry of entries) {
    const list = groups.get(entry.date) ?? [];
    list.push(entry);
    groups.set(entry.date, list);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => compareDateKeys(b, a))
    .map(([date, list]) => ({
      date,
      label: date === today ? 'Today' : formatDateKey(date, 'long'),
      xp: list.reduce((sum, entry) => sum + entry.xp, 0),
      entries: list,
    }));
}

export interface QuestStats {
  totalCompletions: number;
  lastCompletedAt?: string;
  lastDate?: string;
  doneToday: boolean;
  doneThisWeek: boolean;
  streak: number;
  last30: number;
}

export function questStats(state: AppState, quest: Quest, today: string): QuestStats {
  const completions = questCompletions(state, quest.id);
  const last = completions.slice().sort((a, b) => compareDateKeys(b.date, a.date))[0];
  const weekStart = startOfWeekKey(today, state.settings.rules.weekStart);
  return {
    totalCompletions: completions.length,
    lastCompletedAt: last?.completedAt,
    lastDate: last?.date,
    doneToday: isCompletedOn(completions, quest.id, today),
    doneThisWeek: completions.some((c) => c.date >= weekStart && c.date <= today),
    streak:
      quest.cadence === 'daily'
        ? habitStreak(quest, state.completions, today, state.settings.rules.graceDays)
        : 0,
    last30: completions.filter((c) => c.date >= addDaysToKey(today, -29)).length,
  };
}

export function weeklyMissionSummary(
  state: AppState,
  today: string,
): { quest: Quest; done: boolean; completion?: Completion }[] {
  const weekStart = startOfWeekKey(today, state.settings.rules.weekStart);
  return weeklyQuests(state).map((quest) => {
    const completion = state.completions.find(
      (c) => c.questId === quest.id && c.date >= weekStart && c.date <= today,
    );
    return { quest, done: Boolean(completion), completion };
  });
}

export function achievementContext(state: AppState, today: string): AchievementContext {
  const level = profileLevel(state);
  const streak = currentStreakOf(state, today);
  const best = longestStreakOf(state);
  const active = activeDayKeys(state.completions);
  const perDay = new Map<string, number>();
  let habitCompletions = 0;
  let weeklyCompletions = 0;
  let early = 0;
  let night = 0;
  for (const completion of state.completions) {
    if (completion.source !== 'bonus') {
      perDay.set(completion.date, (perDay.get(completion.date) ?? 0) + 1);
    }
    const cadence: Cadence | undefined =
      completion.cadence ?? questById(state, completion.questId)?.cadence;
    if (cadence === 'daily') habitCompletions += 1;
    if (cadence === 'weekly') weeklyCompletions += 1;
    if (completion.source !== 'bonus') {
      const hour = new Date(completion.completedAt).getHours();
      if (hour < 8) early += 1;
      if (hour >= 23) night += 1;
    }
  }
  const goal = state.settings.rules.dailyGoalCount;
  let perfectDays = 0;
  for (const count of perDay.values()) if (count >= goal) perfectDays += 1;
  let maxDaily = 0;
  for (const count of perDay.values()) maxDaily = Math.max(maxDaily, count);

  const categories = categoryStats(state);
  const coreStats = categories.filter((stat) => CORE_CATEGORY_IDS.includes(stat.category.id));
  const minCoreSkillLevel = coreStats.length
    ? Math.min(...coreStats.map((stat) => stat.level.level))
    : 1;
  const coreTouched = coreStats.filter((stat) => stat.xp > 0).length;

  let comebackGap = 0;
  for (let i = 1; i < active.length; i += 1) {
    const gap = daysBetweenKeys(active[i - 1], active[i]) - 1;
    comebackGap = Math.max(comebackGap, gap);
  }

  const snapshot = cosmeticSnapshot(state);
  const owned = ownedCosmetics(snapshot);

  return {
    completions: state.completions.filter((c) => c.source !== 'bonus').length,
    totalXp: level.totalXp,
    level: level.level,
    currentStreak: streak.days,
    bestStreak: best,
    activeDays: active.length,
    habitCompletions,
    weeklyCompletions,
    maxDailyCompletions: maxDaily,
    perfectDays,
    categoryXp: categories.map((stat) => ({
      id: stat.category.id,
      name: stat.category.name,
      xp: stat.xp,
      level: stat.level.level,
    })),
    minCoreSkillLevel,
    coreCategoriesTouched: coreTouched,
    earlyCompletions: early,
    nightCompletions: night,
    comebackGap,
    coinsEarned: totalCoinsEarned(state),
    ownedCosmetics: owned.ownedCount,
    purchases: state.purchases.length,
  };
}

export interface AchievementView {
  def: AchievementDef;
  current: number;
  target: number;
  ratio: number;
  unlocked: boolean;
  unlockedAt?: string;
  progressLabel: string;
}

export function achievementViews(state: AppState, today: string): AchievementView[] {
  const ctx = achievementContext(state, today);
  return ACHIEVEMENTS.map((def) => {
    const raw = Math.max(0, def.progress(ctx));
    const current = Math.min(def.target, Math.round(raw));
    const unlocked = Boolean(state.achievements[def.id]) || raw >= def.target;
    return {
      def,
      current,
      target: def.target,
      ratio: Math.min(1, raw / Math.max(1, def.target)),
      unlocked,
      unlockedAt: state.achievements[def.id],
      progressLabel:
        def.id === 'specialist'
          ? `${current} / ${def.target} XP`
          : def.id === 'collector'
            ? `${current} / ${def.target} coins`
            : `${current} / ${def.target}`,
    };
  });
}

export function achievementGroupCounts(views: AchievementView[]): Record<AchievementTier, { total: number; unlocked: number }> {
  const result: Record<AchievementTier, { total: number; unlocked: number }> = {
    bronze: { total: 0, unlocked: 0 },
    silver: { total: 0, unlocked: 0 },
    gold: { total: 0, unlocked: 0 },
    prism: { total: 0, unlocked: 0 },
  };
  for (const view of views) {
    result[view.def.tier].total += 1;
    if (view.unlocked) result[view.def.tier].unlocked += 1;
  }
  return result;
}

export function newestAchievements(state: AppState, limit = 3): { id: string; at: string; name: string; icon: string }[] {
  return Object.entries(state.achievements)
    .sort(([, a], [, b]) => (a < b ? 1 : -1))
    .slice(0, limit)
    .map(([id, at]) => ({
      id,
      at,
      name: ACHIEVEMENT_MAP[id]?.name ?? id,
      icon: ACHIEVEMENT_MAP[id]?.icon ?? 'trophy',
    }));
}

export function cosmeticSnapshot(state: AppState): CosmeticSnapshot {
  return {
    level: profileLevel(state).level,
    achievements: new Set(Object.keys(state.achievements)),
    purchases: new Set(state.purchases.map((purchase) => purchase.itemId)),
    coins: coinBalance(state),
  };
}

export interface CosmeticView {
  item: CosmeticItem;
  status: CosmeticStatus;
}

export function cosmeticViews(state: AppState): CosmeticView[] {
  const snapshot = cosmeticSnapshot(state);
  return ([...TITLES, ...FRAMES, ...ACCENT_ITEMS] as CosmeticItem[]).map((item) => ({
    item,
    status: cosmeticStatus(item, snapshot),
  }));
}

export function equippedTitle(state: AppState) {
  return titleById(state.profile.titleId);
}

export function equippedFrame(state: AppState) {
  return frameById(state.profile.frameId);
}

export function accentOf(state: AppState): AccentId {
  return state.profile.accentId;
}

export function nextTitleMilestone(level: number): { level: number; label: string } | null {
  return LEVEL_TITLES.find((row) => row.level > level) ?? null;
}

export function milestoneLevelsUp(level: number): number {
  const next = LEVEL_TITLES.find((row) => row.level > level);
  return next ? next.level - level : 0;
}

export interface RecoveryStatus {
  shouldShow: boolean;
  idleDays: number;
  lastActiveDate?: string;
  message: string;
  graceDays: number;
}

export function recoveryStatus(state: AppState, today: string): RecoveryStatus {
  const active = activeDayKeys(state.completions);
  const last = active[active.length - 1];
  const graceDays = state.settings.rules.graceDays;
  if (!last) {
    const created = state.profile.createdAt.slice(0, 10);
    const idle = Math.max(0, daysBetweenKeys(created, today));
    return {
      shouldShow: state.onboarded && activeQuests(state).length > 0 && idle >= 2,
      idleDays: idle,
      message: 'Your system is warmed up and waiting. Pick one small directive to begin.',
      graceDays,
    };
  }
  const idleDays = Math.max(0, daysBetweenKeys(last, today));
  const message =
    idleDays <= 1
      ? 'One small quest is enough to keep the lights on.'
      : graceDays > 0
        ? `Momentum is shielded for ${graceDays} day${graceDays === 1 ? '' : 's'}. No lost progress — pick a light quest and restart the engine.`
        : 'No penalties here. Pick a light quest and restart the engine when you are ready.';
  return {
    shouldShow: idleDays >= 2 && activeQuests(state).length > 0,
    idleDays,
    lastActiveDate: last,
    message,
    graceDays,
  };
}

export function todayLabel(today = todayKeyFn()): string {
  return `${formatWeekday(today, 'narrow')} ${formatDateKey(today, 'short')}`;
}

export function weeklyActiveCount(state: AppState, today: string): number {
  const start = startOfWeekKey(today, state.settings.rules.weekStart);
  return activeDayKeys(state.completions).filter((key) => key >= start && key <= today).length;
}

export function allCategoryXp(state: AppState): Record<string, number> {
  return state.completions.reduce<Record<string, number>>((acc, completion) => {
    acc[completion.categoryId] = (acc[completion.categoryId] ?? 0) + completion.xp;
    return acc;
  }, {});
}

export function nextLevelPreview(state: AppState): { remaining: number; percentToMax: boolean } {
  const level = profileLevel(state);
  return {
    remaining: Math.max(0, level.nextLevelAt - level.totalXp),
    percentToMax: level.level >= MAX_LEVEL,
  };
}

export function coinCostLabel(cost: number): string {
  return `${cost}`;
}

export function questCadenceLabel(cadence: Cadence): string {
  return CADENCE_MAP[cadence]?.label ?? cadence;
}

export function daysSinceLastActivity(state: AppState, today: string): number | null {
  const active = activeDayKeys(state.completions);
  if (!active.length) return null;
  return Math.max(0, daysBetweenKeys(active[active.length - 1], today));
}
