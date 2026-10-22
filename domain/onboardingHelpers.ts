import { DEFAULT_CATEGORIES, STARTER_TEMPLATES } from './constants';

export const INITIAL_CATEGORIES_FALLBACK = DEFAULT_CATEGORIES;

/** Unique starter quests that would be seeded for the selected domains. */
export function countStarterQuests(focusIds: string[]): number {
  const chosen = focusIds.length ? focusIds : DEFAULT_CATEGORIES.map((category) => category.id);
  const titles = new Set<string>();
  for (const id of chosen) {
    for (const template of STARTER_TEMPLATES[id] ?? []) titles.add(template.title);
  }
  return Math.min(8, titles.size);
}
