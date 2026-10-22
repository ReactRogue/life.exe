import type { AccentId, ThemeMode } from '@/theme/palette';
import { ACCENTS } from '@/theme/palette';
import { ACCENT_ITEMS, FRAMES, TITLES } from './cosmetics';
import { createInitialState } from './engine';
import { DEFAULT_CATEGORIES, DEFAULT_RULES } from './constants';
import { isDateKey, todayKey } from './date';
import type {
  AppState,
  Cadence,
  Category,
  Completion,
  Difficulty,
  Purchase,
  Quest,
  Settings,
} from './types';
import { sanitizeRules } from './xp';

export const SAVE_APP_ID = 'life.exe';
export const SAVE_VERSION = 1;

export interface SerializedSave {
  app: typeof SAVE_APP_ID;
  schemaVersion: number;
  exportedAt: string;
  state: AppState;
}

export function serializeState(state: AppState): string {
  const payload: SerializedSave = {
    app: SAVE_APP_ID,
    schemaVersion: state.schemaVersion ?? SAVE_VERSION,
    exportedAt: new Date().toISOString(),
    state,
  };
  return JSON.stringify(payload, null, 2);
}

type Unknown = Record<string, unknown>;

const isObject = (value: unknown): value is Unknown =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const DIFFICULTIES: Difficulty[] = ['trivial', 'easy', 'moderate', 'hard', 'epic'];
const CADENCES: Cadence[] = ['daily', 'weekly', 'once'];
const THEMES: ThemeMode[] = ['dark', 'light', 'system'];

function sanitizeQuest(raw: unknown, categories: Category[]): Quest | null {
  if (!isObject(raw)) return null;
  const id = asString(raw.id);
  const title = asString(raw.title).trim();
  if (!id || !title) return null;
  const categoryId = categories.some((category) => category.id === raw.categoryId)
    ? asString(raw.categoryId)
    : categories[0].id;
  const difficulty = DIFFICULTIES.includes(raw.difficulty as Difficulty)
    ? (raw.difficulty as Difficulty)
    : 'moderate';
  const cadence = CADENCES.includes(raw.cadence as Cadence) ? (raw.cadence as Cadence) : 'daily';
  const days = Array.isArray(raw.daysOfWeek)
    ? raw.daysOfWeek
        .filter((day): day is number => typeof day === 'number' && day >= 0 && day <= 6)
        .slice(0, 7)
    : undefined;
  const createdAt = asString(raw.createdAt, new Date().toISOString());
  return {
    id,
    title: title.slice(0, 90),
    notes: typeof raw.notes === 'string' ? raw.notes.slice(0, 280) : undefined,
    categoryId,
    difficulty,
    cadence,
    daysOfWeek: days?.length ? days : undefined,
    targetPerWeek:
      typeof raw.targetPerWeek === 'number' && raw.targetPerWeek > 0 ? raw.targetPerWeek : undefined,
    createdAt,
    updatedAt: asString(raw.updatedAt, createdAt),
    archivedAt: typeof raw.archivedAt === 'string' ? raw.archivedAt : null,
    source: raw.source === 'starter' || raw.source === 'recovery' || raw.source === 'system' ? raw.source : 'user',
  };
}

function sanitizeCompletion(raw: unknown): Completion | null {
  if (!isObject(raw)) return null;
  const id = asString(raw.id);
  const questId = asString(raw.questId);
  const date = asString(raw.date);
  if (!id || !questId || !isDateKey(date)) return null;
  const difficulty = DIFFICULTIES.includes(raw.difficulty as Difficulty)
    ? (raw.difficulty as Difficulty)
    : 'moderate';
  const source = raw.source === 'bonus' ? 'bonus' : raw.source === 'habit' ? 'habit' : 'quest';
  return {
    id,
    questId,
    questTitle: asString(raw.questTitle, 'Quest'),
    categoryId: asString(raw.categoryId, 'discipline'),
    difficulty,
    cadence: CADENCES.includes(raw.cadence as Cadence) ? (raw.cadence as Cadence) : undefined,
    date,
    completedAt: asString(raw.completedAt, `${date}T12:00:00.000Z`),
    xp: Math.max(0, asNumber(raw.xp)),
    coins: Math.max(0, asNumber(raw.coins)),
    baseXp: Math.max(0, asNumber(raw.baseXp, asNumber(raw.xp))),
    multiplier: Math.max(0, asNumber(raw.multiplier, 1)),
    streak: Math.max(0, asNumber(raw.streak)),
    source,
    note: typeof raw.note === 'string' ? raw.note : undefined,
  };
}

function sanitizeSettings(raw: unknown, fallback: Settings): Settings {
  if (!isObject(raw)) return fallback;
  const prefs = isObject(raw.preferences) ? raw.preferences : {};
  const theme = THEMES.includes(prefs.theme as ThemeMode) ? (prefs.theme as ThemeMode) : fallback.preferences.theme;
  return {
    preferences: {
      theme,
      haptics: typeof prefs.haptics === 'boolean' ? prefs.haptics : fallback.preferences.haptics,
      compactCards:
        typeof prefs.compactCards === 'boolean' ? prefs.compactCards : fallback.preferences.compactCards,
    },
    rules: sanitizeRules(isObject(raw.rules) ? (raw.rules as Partial<Settings['rules']>) : undefined, fallback.rules),
  };
}

export function sanitizeImportedState(raw: unknown, fallback: AppState): AppState | null {
  if (!isObject(raw)) return null;
  const categoriesRaw = Array.isArray(raw.categories) ? raw.categories : [];
  const categories: Category[] = categoriesRaw
    .filter(isObject)
    .map((category) => ({
      id: asString(category.id),
      name: asString(category.name, 'Skill').slice(0, 22),
      hue: asString(category.hue, 'discipline'),
      icon: asString(category.icon, 'shield'),
      blurb: typeof category.blurb === 'string' ? category.blurb : undefined,
      createdAt: asString(category.createdAt, fallback.profile.createdAt),
      custom: category.custom === true,
    }))
    .filter((category) => category.id && category.name);
  const categoriesSafe = categories.length
    ? categories
    : DEFAULT_CATEGORIES.map((category) => ({ ...category, createdAt: fallback.profile.createdAt }));

  const quests = (Array.isArray(raw.quests) ? raw.quests : [])
    .map((quest) => sanitizeQuest(quest, categoriesSafe))
    .filter((quest): quest is Quest => Boolean(quest));
  const completions = (Array.isArray(raw.completions) ? raw.completions : [])
    .map(sanitizeCompletion)
    .filter((completion): completion is Completion => Boolean(completion));
  const purchases: Purchase[] = (Array.isArray(raw.purchases) ? raw.purchases : [])
    .filter(isObject)
    .map((purchase) => ({
      id: asString(purchase.id),
      itemId: asString(purchase.itemId),
      cost: Math.max(0, asNumber(purchase.cost)),
      at: asString(purchase.at, new Date().toISOString()),
    }))
    .filter((purchase) => purchase.id && purchase.itemId);

  const profileRaw = isObject(raw.profile) ? raw.profile : {};
  const accentId: AccentId = ACCENTS[profileRaw.accentId as AccentId]
    ? (profileRaw.accentId as AccentId)
    : fallback.profile.accentId;
  const titleId = TITLES.some((title) => title.id === profileRaw.titleId)
    ? asString(profileRaw.titleId, fallback.profile.titleId)
    : fallback.profile.titleId;
  const frameId = FRAMES.some((frame) => frame.id === profileRaw.frameId)
    ? asString(profileRaw.frameId, fallback.profile.frameId)
    : fallback.profile.frameId;
  const sigil = Math.min(5, Math.max(0, Math.round(asNumber(profileRaw.sigil, 0))));

  const achievementsRaw = isObject(raw.achievements) ? raw.achievements : {};
  const achievements: Record<string, string> = {};
  for (const [id, at] of Object.entries(achievementsRaw)) {
    if (typeof at === 'string' && at.length > 0) achievements[id] = at;
  }

  const metaRaw = isObject(raw.meta) ? raw.meta : {};
  const now = new Date().toISOString();

  const state: AppState = {
    schemaVersion: SAVE_VERSION,
    onboarded: raw.onboarded === true,
    profile: {
      id: asString(profileRaw.id, fallback.profile.id),
      name: asString(profileRaw.name, 'Operator').slice(0, 24),
      titleId,
      frameId,
      accentId,
      sigil,
      createdAt: asString(profileRaw.createdAt, now),
    },
    settings: sanitizeSettings(raw.settings, fallback.settings),
    categories: categoriesSafe,
    quests,
    completions,
    purchases,
    achievements,
    meta: {
      lastSeenDate: isDateKey(metaRaw.lastSeenDate) ? asString(metaRaw.lastSeenDate) : todayKey(),
      createdAt: asString(metaRaw.createdAt, now),
      updatedAt: asString(metaRaw.updatedAt, now),
      celebratedLevel: Math.max(1, Math.round(asNumber(metaRaw.celebratedLevel, 1))),
    },
  };
  return state;
}

export interface ParseResult {
  ok: boolean;
  state?: AppState;
  error?: string;
  exportedAt?: string;
}

export function parseSave(text: string, fallback = createInitialState()): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'This file is not valid JSON. Check the paste and try again.' };
  }
  if (!isObject(parsed)) return { ok: false, error: 'Save data must be a JSON object.' };

  let rawState: unknown = parsed;
  let exportedAt: string | undefined;
  if (isObject(parsed.state)) {
    if (parsed.app && parsed.app !== SAVE_APP_ID) {
      return { ok: false, error: 'This save was created by a different app.' };
    }
    rawState = parsed.state;
    exportedAt = typeof parsed.exportedAt === 'string' ? parsed.exportedAt : undefined;
  } else if ('state' in parsed || parsed.app === SAVE_APP_ID) {
    return { ok: false, error: 'The save is missing its state payload.' };
  }
  const state = sanitizeImportedState(rawState, fallback);
  if (!state) return { ok: false, error: 'The save structure could not be understood.' };
  if (!state.profile.name) return { ok: false, error: 'The save is missing profile information.' };
  return { ok: true, state, exportedAt };
}

/**
 * Last-write-wins merge used when cloud sync arrives. Local-first today, but the
 * shape is already here so the provider can be swapped in without domain changes.
 */
export function mergeStates(local: AppState, remote: AppState): AppState {
  const localUpdated = new Date(local.meta.updatedAt).getTime();
  const remoteUpdated = new Date(remote.meta.updatedAt).getTime();
  const latest = remoteUpdated > localUpdated ? remote : local;

  const mergeById = <T extends { id: string; updatedAt?: string }>(a: T[], b: T[]): T[] => {
    const map = new Map<string, T>();
    for (const item of a) map.set(item.id, item);
    for (const item of b) {
      const existing = map.get(item.id);
      if (!existing) {
        map.set(item.id, item);
        continue;
      }
      const existingAt = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
      const itemAt = item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
      if (itemAt > existingAt) map.set(item.id, item);
    }
    return Array.from(map.values());
  };

  const mergeImmutable = <T extends { id: string }>(a: T[], b: T[]): T[] => {
    const map = new Map<string, T>();
    for (const item of a) map.set(item.id, item);
    for (const item of b) if (!map.has(item.id)) map.set(item.id, item);
    return Array.from(map.values());
  };

  const achievements = { ...local.achievements };
  for (const [id, at] of Object.entries(remote.achievements)) {
    if (!achievements[id] || at < achievements[id]) achievements[id] = at;
  }

  return {
    ...latest,
    profile: latest.profile,
    settings: latest.settings,
    categories: mergeById(local.categories, remote.categories),
    quests: mergeById(local.quests, remote.quests),
    completions: mergeImmutable(local.completions, remote.completions),
    purchases: mergeImmutable(local.purchases, remote.purchases),
    achievements,
    meta: {
      ...latest.meta,
      createdAt:
        new Date(local.meta.createdAt).getTime() < new Date(remote.meta.createdAt).getTime()
          ? local.meta.createdAt
          : remote.meta.createdAt,
      updatedAt: latest.meta.updatedAt,
    },
  };
}

export function defaultRulesForExport() {
  return sanitizeRules(DEFAULT_RULES, DEFAULT_RULES);
}
