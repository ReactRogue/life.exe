import type { AppState } from './types';
import { mergeStates } from './serialize';

/**
 * Sync boundary for a future cloud backend.
 *
 * The app is strictly local-first: all mutations go through the pure engine in
 * `domain/engine.ts`, then are persisted by `store/persistence.ts`. A remote
 * provider only needs to implement this interface and call `mergeStates` to
 * reconcile snapshots — no screen or domain logic has to change.
 */
export interface SyncSnapshot {
  state: AppState;
  deviceId: string;
  revision: number;
  updatedAt: string;
}

export interface SyncProvider {
  readonly id: string;
  readonly label: string;
  readonly available: boolean;
  pull(): Promise<SyncSnapshot | null>;
  push(snapshot: Omit<SyncSnapshot, 'revision'>): Promise<{ revision: number }>;
  subscribe?(onRemoteChange: (snapshot: SyncSnapshot) => void): () => void;
}

export interface SyncResult {
  state: AppState;
  direction: 'pulled' | 'pushed' | 'merged' | 'noop';
  message: string;
}

/** Placeholder provider so settings can advertise "local only" honestly. */
export const localOnlyProvider: SyncProvider = {
  id: 'local',
  label: 'This device',
  available: true,
  async pull() {
    return null;
  },
  async push() {
    return { revision: 0 };
  },
};

export async function syncWithProvider(
  provider: SyncProvider,
  local: AppState,
  deviceId: string,
): Promise<SyncResult> {
  if (!provider.available) {
    return { state: local, direction: 'noop', message: 'Sync is not available yet.' };
  }
  const remote = await provider.pull();
  if (!remote) {
    await provider.push({
      state: local,
      deviceId,
      updatedAt: new Date().toISOString(),
    });
    return { state: local, direction: 'pushed', message: 'Local snapshot queued for sync.' };
  }
  const merged = mergeStates(local, remote.state);
  await provider.push({ state: merged, deviceId, updatedAt: new Date().toISOString() });
  return { state: merged, direction: 'merged', message: 'Local and cloud progress merged.' };
}
