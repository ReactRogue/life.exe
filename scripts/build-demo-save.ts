/**
 * Builds a realistic demo save for screenshots and manual QA.
 *
 *   node scripts/build-demo-save.mjs   (after esbuild bundling)
 *   npx esbuild scripts/build-demo-save.ts --bundle --platform=node --format=esm \
 *     --outfile=/tmp/build-demo-save.mjs && node /tmp/build-demo-save.mjs
 */
import { writeFileSync } from 'node:fs';
import {
  addQuest,
  completeOnboarding,
  createInitialState,
  performCompletion,
  performPurchase,
  equipCosmetic,
} from '../domain/engine';
import { serializeState } from '../domain/serialize';
import { DEFAULT_CATEGORIES } from '../domain/constants';
import type { Cadence, Difficulty } from '../domain/types';

const NOW = new Date('2026-10-22T19:20:00');

let state = createInitialState(NOW);
state = completeOnboarding(
  state,
  {
    name: 'Rhea Vega',
    accentId: 'mint',
    focusIds: DEFAULT_CATEGORIES.map((category) => category.id),
    theme: 'dark',
    haptics: true,
    seed: true,
    sigil: 3,
    levelBase: 120,
    levelGrowth: 0.35,
  },
  NOW,
);

// A couple of custom quests on top of the starter protocol.
const extras: { title: string; notes?: string; categoryId: string; difficulty: Difficulty; cadence: Cadence; daysOfWeek?: number[] }[] = [
  {
    title: 'Deep work block · 90 min',
    notes: 'One tab. One problem. Headphones on.',
    categoryId: 'discipline',
    difficulty: 'hard',
    cadence: 'daily',
    daysOfWeek: [1, 2, 3, 4, 5],
  },
  {
    title: 'Sketch something bad',
    notes: 'Quality is not the assignment.',
    categoryId: 'creativity',
    difficulty: 'easy',
    cadence: 'daily',
    daysOfWeek: [1, 3, 5],
  },
  {
    title: 'Run 5k',
    notes: 'Slow counts. Walk breaks count.',
    categoryId: 'fitness',
    difficulty: 'hard',
    cadence: 'weekly',
  },
  {
    title: 'Call family',
    categoryId: 'relationships',
    difficulty: 'easy',
    cadence: 'weekly',
  },
  {
    title: 'Refactor the portfolio site',
    notes: 'A one-off mission, not a habit.',
    categoryId: 'creativity',
    difficulty: 'epic',
    cadence: 'once',
  },
];

for (const extra of extras) {
  state = addQuest(state, extra, NOW).state;
}

// Simulate 78 days of use, with believable inconsistency.
function hash(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const DAY = 86_400_000;
const activeQuests = () => state.quests.filter((quest) => !quest.archivedAt);

for (let offset = 78; offset >= 0; offset -= 1) {
  const date = new Date(NOW.getTime() - offset * DAY);
  const weekday = date.getDay();
  // Some weeks are lighter than others.
  const weekEnergy = 0.55 + hash(Math.floor(offset / 7) + 3) * 0.45;
  for (const quest of activeQuests()) {
    if (quest.daysOfWeek && quest.daysOfWeek.length && !quest.daysOfWeek.includes(weekday)) continue;
    const difficultyWeight =
      quest.difficulty === 'trivial' ? 0.94 : quest.difficulty === 'easy' ? 0.86 : quest.difficulty === 'moderate' ? 0.72 : quest.difficulty === 'hard' ? 0.55 : 0.4;
    const chance = difficultyWeight * weekEnergy * (0.35 + hash(offset * 7 + quest.id.length * 3) * 0.75);
    if (hash(offset * 31 + quest.title.length) > chance) continue;
    const hour = 7 + Math.floor(hash(offset + quest.title.length * 5) * 13);
    const stamp = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 12 + Math.floor(hash(offset) * 40));
    const result = performCompletion(state, quest.id, { now: stamp });
    if (result) state = result.state;
  }
}

// A quiet stretch, then a fresh restart this morning.
const quiet = state.completions.filter((entry) => entry.date <= '2026-10-19');
state = { ...state, completions: quiet };

const restart = [
  { title: 'Plan tomorrow in three lines', at: new Date('2026-10-22T07:10:00') },
  { title: 'Move for 20 minutes', at: new Date('2026-10-22T07:42:00') },
  { title: 'Read 10 pages', at: new Date('2026-10-22T08:05:00') },
];
for (const entry of restart) {
  const quest = state.quests.find((item) => item.title === entry.title && !item.archivedAt);
  if (!quest) continue;
  const result = performCompletion(state, quest.id, { now: entry.at });
  if (result) state = result.state;
}

// Spend some coins so the vault is not empty but not exhausted either.
for (const itemId of ['accent_ion', 'frame_aurora']) {
  const result = performPurchase(state, itemId, NOW);
  if (result.ok) state = result.state;
}
const pathfinder = state.quests.length >= 0;
if (pathfinder) state = equipCosmetic(state, 'pathfinder', NOW).state;
state = equipCosmetic(state, 'frame_circuit', NOW).state;
state = equipCosmetic(state, 'accent_ion', NOW).state;

// Archive one quest so the archive UI has content.
const archived = state.quests.find((quest) => quest.title === 'Refactor the portfolio site');
if (archived) {
  state = {
    ...state,
    quests: state.quests.map((quest) =>
      quest.id === archived.id ? { ...quest, archivedAt: '2026-10-14T18:20:00.000Z' } : quest,
    ),
  };
}

writeFileSync('/tmp/demo-save.json', serializeState(state));
console.log('quests', state.quests.length, 'completions', state.completions.length, 'achievements', Object.keys(state.achievements).length);
console.log('xp', state.completions.reduce((sum, entry) => sum + entry.xp, 0));
