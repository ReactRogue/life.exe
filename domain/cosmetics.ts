import type { AccentId } from '@/theme/palette';
import { ACHIEVEMENT_MAP } from './achievements';

export type CosmeticRarity = 'standard' | 'rare' | 'epic' | 'mythic';

export type CosmeticRequirement =
  | { type: 'default' }
  | { type: 'level'; level: number }
  | { type: 'achievement'; achievementId: string }
  | { type: 'purchase'; cost: number };

export interface CosmeticBase {
  id: string;
  name: string;
  tagline: string;
  rarity: CosmeticRarity;
  requirement: CosmeticRequirement;
}

export interface TitleItem extends CosmeticBase {
  kind: 'title';
  uppercase: string;
}

export interface FrameItem extends CosmeticBase {
  kind: 'frame';
  colors: [string, string];
  style: 'solid' | 'gradient' | 'orbit' | 'dashed';
}

export interface AccentItem extends CosmeticBase {
  kind: 'accent';
  accentId: AccentId;
}

export type CosmeticItem = TitleItem | FrameItem | AccentItem;

export interface CosmeticSnapshot {
  level: number;
  achievements: Set<string>;
  purchases: Set<string>;
  coins: number;
}

export const RARITY_META: Record<CosmeticRarity, { label: string; color: string }> = {
  standard: { label: 'Standard', color: '#8DA1BA' },
  rare: { label: 'Rare', color: '#7AA2FF' },
  epic: { label: 'Epic', color: '#C88CFF' },
  mythic: { label: 'Mythic', color: '#FFC46B' },
};

export const TITLES: TitleItem[] = [
  {
    id: 'cadet',
    kind: 'title',
    name: 'Cadet',
    uppercase: 'CADET',
    tagline: 'Every system starts somewhere.',
    rarity: 'standard',
    requirement: { type: 'default' },
  },
  {
    id: 'operator',
    kind: 'title',
    name: 'Operator',
    uppercase: 'OPERATOR',
    tagline: 'The basics are handled.',
    rarity: 'standard',
    requirement: { type: 'level', level: 3 },
  },
  {
    id: 'pathfinder',
    kind: 'title',
    name: 'Pathfinder',
    uppercase: 'PATHFINDER',
    tagline: 'You pick the route.',
    rarity: 'rare',
    requirement: { type: 'level', level: 7 },
  },
  {
    id: 'vanguard',
    kind: 'title',
    name: 'Vanguard',
    uppercase: 'VANGUARD',
    tagline: 'First in, still standing.',
    rarity: 'rare',
    requirement: { type: 'level', level: 12 },
  },
  {
    id: 'architect',
    kind: 'title',
    name: 'Architect',
    uppercase: 'ARCHITECT',
    tagline: 'Designing a life, not just logging one.',
    rarity: 'epic',
    requirement: { type: 'level', level: 18 },
  },
  {
    id: 'overseer',
    kind: 'title',
    name: 'Overseer',
    uppercase: 'OVERSEER',
    tagline: 'The map is familiar now.',
    rarity: 'epic',
    requirement: { type: 'level', level: 25 },
  },
  {
    id: 'ascendant',
    kind: 'title',
    name: 'Ascendant',
    uppercase: 'ASCENDANT',
    tagline: 'Gravity filed a complaint.',
    rarity: 'mythic',
    requirement: { type: 'level', level: 35 },
  },
  {
    id: 'singularity',
    kind: 'title',
    name: 'Singularity',
    uppercase: 'SINGULARITY',
    tagline: 'Past the edge of the tutorial.',
    rarity: 'mythic',
    requirement: { type: 'level', level: 50 },
  },
  {
    id: 'streakkeeper',
    kind: 'title',
    name: 'Streakkeeper',
    uppercase: 'STREAKKEEPER',
    tagline: 'Seven days and still humming.',
    rarity: 'rare',
    requirement: { type: 'achievement', achievementId: 'streak_7' },
  },
  {
    id: 'phoenix',
    kind: 'title',
    name: 'Phoenix',
    uppercase: 'PHOENIX',
    tagline: 'Returned. Rested. Restarted.',
    rarity: 'epic',
    requirement: { type: 'achievement', achievementId: 'comeback' },
  },
  {
    id: 'polymath',
    kind: 'title',
    name: 'Polymath',
    uppercase: 'POLYMATH',
    tagline: 'Strong across the whole stack.',
    rarity: 'epic',
    requirement: { type: 'achievement', achievementId: 'polymath' },
  },
  {
    id: 'nightwatch',
    kind: 'title',
    name: 'Nightwatch',
    uppercase: 'NIGHTWATCH',
    tagline: 'The quiet hours are yours.',
    rarity: 'rare',
    requirement: { type: 'achievement', achievementId: 'night_5' },
  },
  {
    id: 'curator',
    kind: 'title',
    name: 'Curator',
    uppercase: 'CURATOR',
    tagline: 'Collector of good signals.',
    rarity: 'epic',
    requirement: { type: 'achievement', achievementId: 'curator' },
  },
];

export const FRAMES: FrameItem[] = [
  {
    id: 'frame_standard',
    kind: 'frame',
    name: 'Standard Issue',
    tagline: 'Clean lines. No fuss.',
    rarity: 'standard',
    requirement: { type: 'default' },
    colors: ['#5CF2C6', '#7AA2FF'],
    style: 'solid',
  },
  {
    id: 'frame_circuit',
    kind: 'frame',
    name: 'Circuit',
    tagline: 'A ring for the regularly consistent.',
    rarity: 'rare',
    requirement: { type: 'level', level: 5 },
    colors: ['#5CF2C6', '#7AA2FF'],
    style: 'gradient',
  },
  {
    id: 'frame_aurora',
    kind: 'frame',
    name: 'Aurora',
    tagline: 'Northern lights, pocket-sized.',
    rarity: 'epic',
    requirement: { type: 'level', level: 15 },
    colors: ['#C88CFF', '#7AA2FF'],
    style: 'orbit',
  },
  {
    id: 'frame_eclipse',
    kind: 'frame',
    name: 'Eclipse',
    tagline: 'For the thirty-day shadow.',
    rarity: 'mythic',
    requirement: { type: 'achievement', achievementId: 'streak_30' },
    colors: ['#FFC46B', '#FF8FB8'],
    style: 'dashed',
  },
  {
    id: 'frame_solar',
    kind: 'frame',
    name: 'Solar Flare',
    tagline: 'Spend some shine.',
    rarity: 'rare',
    requirement: { type: 'purchase', cost: 600 },
    colors: ['#FFC46B', '#FF9B6A'],
    style: 'gradient',
  },
  {
    id: 'frame_void',
    kind: 'frame',
    name: 'Voidwalker',
    tagline: 'The expensive kind of quiet.',
    rarity: 'mythic',
    requirement: { type: 'purchase', cost: 1400 },
    colors: ['#C88CFF', '#FF8FB8'],
    style: 'orbit',
  },
];

export const ACCENT_ITEMS: AccentItem[] = [
  {
    id: 'accent_mint',
    kind: 'accent',
    name: 'Bio Mint',
    tagline: 'Default bioluminescence.',
    rarity: 'standard',
    requirement: { type: 'default' },
    accentId: 'mint',
  },
  {
    id: 'accent_ion',
    kind: 'accent',
    name: 'Ion Blue',
    tagline: 'Cool reactor glow.',
    rarity: 'rare',
    requirement: { type: 'purchase', cost: 420 },
    accentId: 'ion',
  },
  {
    id: 'accent_violet',
    kind: 'accent',
    name: 'Nova Violet',
    tagline: 'Nebula energy, unlocked by level.',
    rarity: 'epic',
    requirement: { type: 'level', level: 8 },
    accentId: 'violet',
  },
  {
    id: 'accent_ember',
    kind: 'accent',
    name: 'Ember',
    tagline: 'A little solar flare.',
    rarity: 'epic',
    requirement: { type: 'purchase', cost: 700 },
    accentId: 'ember',
  },
];

export const COSMETICS: CosmeticItem[] = [...TITLES, ...FRAMES, ...ACCENT_ITEMS];

export function cosmeticById(id: string): CosmeticItem | undefined {
  return COSMETICS.find((item) => item.id === id);
}

export function titleById(id: string): TitleItem {
  return TITLES.find((title) => title.id === id) ?? TITLES[0];
}

export function frameById(id: string): FrameItem {
  return FRAMES.find((frame) => frame.id === id) ?? FRAMES[0];
}

export function accentItemByAccent(accentId: AccentId): AccentItem {
  return ACCENT_ITEMS.find((item) => item.accentId === accentId) ?? ACCENT_ITEMS[0];
}

export function requirementLabel(requirement: CosmeticRequirement): string {
  switch (requirement.type) {
    case 'default':
      return 'Unlocked from the start';
    case 'level':
      return `Reach level ${requirement.level}`;
    case 'achievement':
      return `Achievement: ${ACHIEVEMENT_MAP[requirement.achievementId]?.name ?? 'Hidden'}`;
    case 'purchase':
      return `${requirement.cost} coins`;
  }
}

export interface CosmeticStatus {
  unlocked: boolean;
  owned: boolean;
  purchasable: boolean;
  missingCoins: number;
}

export function cosmeticStatus(item: CosmeticItem, snapshot: CosmeticSnapshot): CosmeticStatus {
  const req = item.requirement;
  if (req.type === 'default') return { unlocked: true, owned: true, purchasable: false, missingCoins: 0 };
  if (req.type === 'level') {
    const unlocked = snapshot.level >= req.level;
    return { unlocked, owned: unlocked, purchasable: false, missingCoins: 0 };
  }
  if (req.type === 'achievement') {
    const unlocked = snapshot.achievements.has(req.achievementId);
    return { unlocked, owned: unlocked, purchasable: false, missingCoins: 0 };
  }
  const owned = snapshot.purchases.has(item.id);
  return {
    unlocked: owned,
    owned,
    purchasable: snapshot.coins >= req.cost,
    missingCoins: Math.max(0, req.cost - snapshot.coins),
  };
}

export function requirementProgress(
  item: CosmeticItem,
  snapshot: CosmeticSnapshot,
): { current: number; target: number } | null {
  const req = item.requirement;
  if (req.type === 'level') return { current: Math.min(snapshot.level, req.level), target: req.level };
  if (req.type === 'purchase') return { current: Math.min(snapshot.coins, req.cost), target: req.cost };
  return null;
}

export interface OwnedCosmetics {
  titles: TitleItem[];
  frames: FrameItem[];
  accents: AccentItem[];
  ownedCount: number;
}

export function ownedCosmetics(snapshot: CosmeticSnapshot): OwnedCosmetics {
  const titles = TITLES.filter((item) => cosmeticStatus(item, snapshot).owned);
  const frames = FRAMES.filter((item) => cosmeticStatus(item, snapshot).owned);
  const accents = ACCENT_ITEMS.filter((item) => cosmeticStatus(item, snapshot).owned);
  const paid = [...titles, ...frames, ...accents].filter(
    (item) => cosmeticStatus(item, snapshot).owned && item.requirement.type !== 'default',
  );
  return { titles, frames, accents, ownedCount: paid.length };
}
