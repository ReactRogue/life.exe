import type { Cadence, Category, Difficulty, Quest, Rules } from './types';

export const DEFAULT_RULES: Rules = {
  xpByDifficulty: { trivial: 5, easy: 10, moderate: 20, hard: 35, epic: 60 },
  coinsByDifficulty: { trivial: 1, easy: 2, moderate: 4, hard: 7, epic: 12 },
  streakBonusPerDay: 0.05,
  streakBonusCap: 0.5,
  dailyGoalCount: 3,
  dailyGoalBonusXp: 15,
  weeklyBonusXp: 30,
  weeklyBonusCoins: 6,
  graceDays: 1,
  weekStart: 1,
  levelBase: 120,
  levelGrowth: 0.35,
};

export interface DifficultyMeta {
  id: Difficulty;
  label: string;
  code: string;
  blurb: string;
  bars: number;
}

export const DIFFICULTIES: DifficultyMeta[] = [
  { id: 'trivial', label: 'Micro', code: 'D1', blurb: 'Two minutes or less', bars: 1 },
  { id: 'easy', label: 'Light', code: 'D2', blurb: 'A small nudge', bars: 2 },
  { id: 'moderate', label: 'Standard', code: 'D3', blurb: 'Real focus required', bars: 3 },
  { id: 'hard', label: 'Heavy', code: 'D4', blurb: 'Deep effort', bars: 4 },
  { id: 'epic', label: 'Legendary', code: 'D5', blurb: 'The boss-level task', bars: 5 },
];

export const DIFFICULTY_MAP: Record<Difficulty, DifficultyMeta> = DIFFICULTIES.reduce(
  (acc, item) => ({ ...acc, [item.id]: item }),
  {} as Record<Difficulty, DifficultyMeta>,
);

export interface CadenceMeta {
  id: Cadence;
  label: string;
  code: string;
  blurb: string;
  icon: string;
}

export const CADENCES: CadenceMeta[] = [
  { id: 'daily', label: 'Daily', code: 'HABIT', blurb: 'Available every scheduled day', icon: 'refresh' },
  { id: 'weekly', label: 'Weekly', code: 'WEEKLY', blurb: 'One clear win each week', icon: 'calendar' },
  { id: 'once', label: 'One-off', code: 'ONCE', blurb: 'A single mission, then archived', icon: 'target' },
];

export const CADENCE_MAP: Record<Cadence, CadenceMeta> = CADENCES.reduce(
  (acc, item) => ({ ...acc, [item.id]: item }),
  {} as Record<Cadence, CadenceMeta>,
);

export const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const LEVEL_TITLES: { level: number; label: string }[] = [
  { level: 1, label: 'Boot Sequence' },
  { level: 3, label: 'Signal Found' },
  { level: 5, label: 'Systems Nominal' },
  { level: 8, label: 'Momentum Locked' },
  { level: 12, label: 'Vector Aligned' },
  { level: 18, label: 'High Operator' },
  { level: 25, label: 'Ascendant' },
  { level: 35, label: 'Singularity' },
];

export function titleForLevel(level: number): string {
  let label = LEVEL_TITLES[0].label;
  for (const row of LEVEL_TITLES) if (level >= row.level) label = row.label;
  return label;
}

export const LEVEL_PRESETS = [
  {
    id: 'casual' as const,
    label: 'Chill',
    blurb: 'Faster early levels, softer curve',
    levelBase: 90,
    levelGrowth: 0.28,
  },
  {
    id: 'standard' as const,
    label: 'Balanced',
    blurb: 'The calibrated default',
    levelBase: 120,
    levelGrowth: 0.35,
  },
  {
    id: 'intense' as const,
    label: 'Hardcore',
    blurb: 'Prestige takes longer',
    levelBase: 150,
    levelGrowth: 0.45,
  },
];

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'discipline',
    name: 'Discipline',
    hue: 'discipline',
    icon: 'shield',
    blurb: 'Consistency, focus, follow-through',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'fitness',
    name: 'Fitness',
    hue: 'fitness',
    icon: 'pulse',
    blurb: 'Movement, strength, recovery',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'learning',
    name: 'Learning',
    hue: 'learning',
    icon: 'book',
    blurb: 'Study, reading, new skills',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'creativity',
    name: 'Creativity',
    hue: 'creativity',
    icon: 'spark',
    blurb: 'Making, writing, playing',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'relationships',
    name: 'Relationships',
    hue: 'relationships',
    icon: 'users',
    blurb: 'People, presence, care',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export const CATEGORY_ICON_OPTIONS = [
  'shield',
  'pulse',
  'book',
  'spark',
  'users',
  'target',
  'compass',
  'coin',
  'heart',
  'moon',
  'flask',
  'layers',
  'hex',
  'star',
];

export interface StarterTemplate {
  title: string;
  notes?: string;
  categoryId: string;
  difficulty: Difficulty;
  cadence: Cadence;
  daysOfWeek?: number[];
}

export const STARTER_TEMPLATES: Record<string, StarterTemplate[]> = {
  discipline: [
    {
      title: 'Plan tomorrow in three lines',
      notes: 'One priority, one errand, one thing to look forward to.',
      categoryId: 'discipline',
      difficulty: 'easy',
      cadence: 'daily',
    },
    {
      title: 'Phone-free first 30 minutes',
      notes: 'Start the day on your own terms.',
      categoryId: 'discipline',
      difficulty: 'moderate',
      cadence: 'daily',
      daysOfWeek: [1, 2, 3, 4, 5],
    },
    {
      title: 'Weekly 15-minute review',
      notes: 'What worked, what to drop, what is next.',
      categoryId: 'discipline',
      difficulty: 'moderate',
      cadence: 'weekly',
    },
  ],
  fitness: [
    {
      title: 'Move for 20 minutes',
      notes: 'Walk, lift, stretch, dance — movement counts.',
      categoryId: 'fitness',
      difficulty: 'moderate',
      cadence: 'daily',
    },
    {
      title: 'Drink a glass of water',
      categoryId: 'fitness',
      difficulty: 'trivial',
      cadence: 'daily',
    },
  ],
  learning: [
    {
      title: 'Read 10 pages',
      notes: 'Paper, screen, audio — pages are pages.',
      categoryId: 'learning',
      difficulty: 'easy',
      cadence: 'daily',
    },
    {
      title: 'Ship one lesson',
      notes: 'One focused lesson or chapter of a course.',
      categoryId: 'learning',
      difficulty: 'hard',
      cadence: 'weekly',
    },
  ],
  creativity: [
    {
      title: 'Create for 15 minutes',
      notes: 'No outcome required. Just make something.',
      categoryId: 'creativity',
      difficulty: 'moderate',
      cadence: 'daily',
    },
  ],
  relationships: [
    {
      title: 'Reach out to someone',
      notes: 'A message, a call, a shared coffee.',
      categoryId: 'relationships',
      difficulty: 'easy',
      cadence: 'daily',
    },
    {
      title: 'Plan a real hangout',
      categoryId: 'relationships',
      difficulty: 'moderate',
      cadence: 'weekly',
    },
  ],
};

export const CATEGORY_BLUES: Record<string, string> = {
  productivity: 'discipline',
  focus: 'discipline',
  health: 'fitness',
  body: 'fitness',
  study: 'learning',
  mind: 'learning',
  art: 'creativity',
  social: 'relationships',
  finance: 'finance',
};

export function makeStarterQuests(focusIds: string[], now: string): Quest[] {
  const chosen = focusIds.length ? focusIds : DEFAULT_CATEGORIES.map((c) => c.id);
  const templates = chosen.flatMap((id) => STARTER_TEMPLATES[id] ?? []);
  const unique = templates.filter(
    (template, index, arr) => arr.findIndex((t) => t.title === template.title) === index,
  );
  const capped = unique.slice(0, 8);
  return capped.map((template, index) => ({
    id: `starter-${index}-${template.categoryId}`,
    title: template.title,
    notes: template.notes,
    categoryId: template.categoryId,
    difficulty: template.difficulty,
    cadence: template.cadence,
    daysOfWeek: template.daysOfWeek,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
    source: 'starter',
  }));
}

export const RULES_LIMITS = {
  xp: { min: 1, max: 500 },
  coins: { min: 0, max: 100 },
  bonusPerDay: { min: 0, max: 0.25 },
  bonusCap: { min: 0, max: 2 },
  dailyGoal: { min: 1, max: 12 },
  graceDays: { min: 0, max: 3 },
  levelBase: { min: 50, max: 400 },
  levelGrowth: { min: 0.1, max: 0.9 },
  weeklyBonusXp: { min: 0, max: 300 },
  weeklyBonusCoins: { min: 0, max: 60 },
  dailyGoalBonusXp: { min: 0, max: 200 },
};
