export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'prism';

export interface AchievementContext {
  completions: number;
  totalXp: number;
  level: number;
  currentStreak: number;
  bestStreak: number;
  activeDays: number;
  habitCompletions: number;
  weeklyCompletions: number;
  maxDailyCompletions: number;
  perfectDays: number;
  categoryXp: { id: string; name: string; xp: number; level: number }[];
  minCoreSkillLevel: number;
  coreCategoriesTouched: number;
  earlyCompletions: number;
  nightCompletions: number;
  comebackGap: number;
  coinsEarned: number;
  ownedCosmetics: number;
  purchases: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  tier: AchievementTier;
  icon: string;
  rewardCoins: number;
  target: number;
  /** Current progress toward the target (clamped by UI). */
  progress: (ctx: AchievementContext) => number;
  secret?: boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_signal',
    name: 'First Signal',
    description: 'Complete your very first quest.',
    tier: 'bronze',
    icon: 'bolt',
    rewardCoins: 15,
    target: 1,
    progress: (c) => c.completions,
  },
  {
    id: 'momentum',
    name: 'Momentum',
    description: 'Log 10 quest completions.',
    tier: 'bronze',
    icon: 'wave',
    rewardCoins: 30,
    target: 10,
    progress: (c) => c.completions,
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: 'Log 100 quest completions.',
    tier: 'silver',
    icon: 'shield',
    rewardCoins: 100,
    target: 100,
    progress: (c) => c.completions,
  },
  {
    id: 'deep_orbit',
    name: 'Deep Orbit',
    description: 'Log 365 quest completions.',
    tier: 'prism',
    icon: 'orbit',
    rewardCoins: 300,
    target: 365,
    progress: (c) => c.completions,
  },
  {
    id: 'level_5',
    name: 'Awakening',
    description: 'Reach level 5.',
    tier: 'bronze',
    icon: 'star',
    rewardCoins: 40,
    target: 5,
    progress: (c) => c.level,
  },
  {
    id: 'level_15',
    name: 'Ascendant',
    description: 'Reach level 15.',
    tier: 'silver',
    icon: 'spark',
    rewardCoins: 120,
    target: 15,
    progress: (c) => c.level,
  },
  {
    id: 'level_30',
    name: 'Apex Protocol',
    description: 'Reach level 30.',
    tier: 'gold',
    icon: 'trophy',
    rewardCoins: 300,
    target: 30,
    progress: (c) => c.level,
  },
  {
    id: 'streak_3',
    name: 'Spark',
    description: 'Hold a 3-day streak.',
    tier: 'bronze',
    icon: 'flame',
    rewardCoins: 20,
    target: 3,
    progress: (c) => c.bestStreak,
  },
  {
    id: 'streak_7',
    name: 'Weeklocked',
    description: 'Hold a 7-day streak.',
    tier: 'silver',
    icon: 'flame',
    rewardCoins: 50,
    target: 7,
    progress: (c) => c.bestStreak,
  },
  {
    id: 'streak_14',
    name: 'Fortnight',
    description: 'Hold a 14-day streak.',
    tier: 'silver',
    icon: 'flame',
    rewardCoins: 100,
    target: 14,
    progress: (c) => c.bestStreak,
  },
  {
    id: 'streak_30',
    name: 'Monthlock',
    description: 'Hold a 30-day streak.',
    tier: 'gold',
    icon: 'flame',
    rewardCoins: 200,
    target: 30,
    progress: (c) => c.bestStreak,
  },
  {
    id: 'habit_10',
    name: 'Habit Forming',
    description: 'Check in a recurring habit 10 times.',
    tier: 'bronze',
    icon: 'refresh',
    rewardCoins: 30,
    target: 10,
    progress: (c) => c.habitCompletions,
  },
  {
    id: 'habit_50',
    name: 'Ritual',
    description: 'Check in a recurring habit 50 times.',
    tier: 'gold',
    icon: 'hex',
    rewardCoins: 90,
    target: 50,
    progress: (c) => c.habitCompletions,
  },
  {
    id: 'specialist',
    name: 'Specialist',
    description: 'Earn 500 XP in a single skill.',
    tier: 'silver',
    icon: 'target',
    rewardCoins: 60,
    target: 500,
    progress: (c) => Math.max(0, ...c.categoryXp.map((cat) => cat.xp)),
  },
  {
    id: 'polymath',
    name: 'Polymath',
    description: 'Raise every core skill to level 3.',
    tier: 'gold',
    icon: 'layers',
    rewardCoins: 150,
    target: 3,
    progress: (c) => c.minCoreSkillLevel,
  },
  {
    id: 'renaissance',
    name: 'Renaissance',
    description: 'Earn XP in all five core skills.',
    tier: 'silver',
    icon: 'palette',
    rewardCoins: 80,
    target: 5,
    progress: (c) => c.coreCategoriesTouched,
  },
  {
    id: 'dawn_5',
    name: 'Dawn Patrol',
    description: 'Complete 5 quests before 8am.',
    tier: 'silver',
    icon: 'sun',
    rewardCoins: 50,
    target: 5,
    progress: (c) => c.earlyCompletions,
  },
  {
    id: 'night_5',
    name: 'Night Shift',
    description: 'Complete 5 quests after 11pm.',
    tier: 'silver',
    icon: 'moon',
    rewardCoins: 50,
    target: 5,
    progress: (c) => c.nightCompletions,
  },
  {
    id: 'perfect_day',
    name: 'Full Clear',
    description: 'Complete 5 quests in a single day.',
    tier: 'silver',
    icon: 'check',
    rewardCoins: 60,
    target: 5,
    progress: (c) => c.maxDailyCompletions,
  },
  {
    id: 'perfect_week',
    name: 'Seven Summits',
    description: 'Hit your daily goal on 7 different days.',
    tier: 'gold',
    icon: 'calendar',
    rewardCoins: 120,
    target: 7,
    progress: (c) => c.perfectDays,
  },
  {
    id: 'weekly_5',
    name: 'Weekly Operator',
    description: 'Complete 5 weekly missions.',
    tier: 'silver',
    icon: 'quests',
    rewardCoins: 70,
    target: 5,
    progress: (c) => c.weeklyCompletions,
  },
  {
    id: 'comeback',
    name: 'Phoenix Protocol',
    description: 'Return after a 5+ day pause and complete a quest.',
    tier: 'silver',
    icon: 'refresh',
    rewardCoins: 60,
    target: 5,
    progress: (c) => c.comebackGap,
    secret: true,
  },
  {
    id: 'curator',
    name: 'Curator',
    description: 'Own 3 cosmetic upgrades.',
    tier: 'silver',
    icon: 'palette',
    rewardCoins: 70,
    target: 3,
    progress: (c) => c.ownedCosmetics,
  },
  {
    id: 'collector',
    name: 'Coin Collector',
    description: 'Earn 1,000 lifetime coins.',
    tier: 'gold',
    icon: 'coin',
    rewardCoins: 100,
    target: 1000,
    progress: (c) => c.coinsEarned,
  },
];

export const ACHIEVEMENT_MAP: Record<string, AchievementDef> = ACHIEVEMENTS.reduce(
  (acc, item) => ({ ...acc, [item.id]: item }),
  {} as Record<string, AchievementDef>,
);

export const TIER_META: Record<
  AchievementTier,
  { label: string; color: string; soft: string; rank: number }
> = {
  bronze: { label: 'Bronze', color: '#E0A66B', soft: 'rgba(224,166,107,0.14)', rank: 1 },
  silver: { label: 'Silver', color: '#B7C6DB', soft: 'rgba(183,198,219,0.14)', rank: 2 },
  gold: { label: 'Gold', color: '#FFC46B', soft: 'rgba(255,196,107,0.14)', rank: 3 },
  prism: { label: 'Prism', color: '#C88CFF', soft: 'rgba(200,140,255,0.16)', rank: 4 },
};

export function achievementReward(id: string): number {
  return ACHIEVEMENT_MAP[id]?.rewardCoins ?? 0;
}
