import type { AccentId, ThemeMode } from '@/theme/palette';

export type ID = string;

export type Difficulty = 'trivial' | 'easy' | 'moderate' | 'hard' | 'epic';
export type Cadence = 'daily' | 'weekly' | 'once';

export interface Category {
  id: ID;
  name: string;
  /** Key used to pick a hue from the palette (or a custom hue key). */
  hue: string;
  icon: string;
  blurb?: string;
  createdAt: string;
  custom?: boolean;
}

export interface Quest {
  id: ID;
  title: string;
  notes?: string;
  categoryId: ID;
  difficulty: Difficulty;
  cadence: Cadence;
  /** For daily cadence quests: weekdays the quest is scheduled (0 = Sunday). Empty/undefined = every day. */
  daysOfWeek?: number[];
  targetPerWeek?: number;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
  source?: 'starter' | 'user' | 'recovery' | 'system';
}

export type CompletionSource = 'quest' | 'habit' | 'bonus';

export interface Completion {
  id: ID;
  questId: ID;
  questTitle: string;
  categoryId: ID;
  difficulty: Difficulty;
  /** Local calendar day the completion is credited to (YYYY-MM-DD). */
  date: string;
  completedAt: string;
  xp: number;
  coins: number;
  baseXp: number;
  multiplier: number;
  streak: number;
  source: CompletionSource;
  /** Snapshot of the quest cadence so history survives quest edits. */
  cadence?: Cadence;
  note?: string;
}

export interface Purchase {
  id: ID;
  itemId: string;
  cost: number;
  at: string;
}

export interface Rules {
  xpByDifficulty: Record<Difficulty, number>;
  coinsByDifficulty: Record<Difficulty, number>;
  streakBonusPerDay: number;
  streakBonusCap: number;
  dailyGoalCount: number;
  dailyGoalBonusXp: number;
  weeklyBonusXp: number;
  weeklyBonusCoins: number;
  graceDays: number;
  weekStart: 0 | 1;
  levelBase: number;
  levelGrowth: number;
}

export interface Preferences {
  theme: ThemeMode;
  haptics: boolean;
  compactCards: boolean;
}

export interface Settings {
  preferences: Preferences;
  rules: Rules;
}

export interface Profile {
  id: ID;
  name: string;
  titleId: string;
  frameId: string;
  accentId: AccentId;
  sigil: number;
  createdAt: string;
}

export interface AchievementState {
  /** id -> ISO date unlocked */
  [id: string]: string;
}

export interface Meta {
  lastSeenDate: string;
  createdAt: string;
  updatedAt: string;
  /** Highest level the user has already been celebrated for. */
  celebratedLevel: number;
}

export interface AppState {
  schemaVersion: number;
  onboarded: boolean;
  profile: Profile;
  settings: Settings;
  categories: Category[];
  quests: Quest[];
  completions: Completion[];
  purchases: Purchase[];
  achievements: AchievementState;
  meta: Meta;
}

export interface LevelProgress {
  level: number;
  into: number;
  span: number;
  progress: number;
  nextLevelAt: number;
  totalXp: number;
}

export interface AwardBreakdown {
  baseXp: number;
  multiplier: number;
  xp: number;
  coins: number;
  streak: number;
  bonusXp: number;
}

export interface CompletionOutcome {
  quest: Quest;
  completion: Completion;
  bonusCompletion?: Completion;
  xpAwarded: number;
  coinsAwarded: number;
  streak: number;
  levelBefore: number;
  levelAfter: number;
  dailyGoalHit: boolean;
  weeklyBonusXp: number;
  weeklyBonusCoins: number;
  unlockedAchievements: string[];
}
