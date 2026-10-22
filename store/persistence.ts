import AsyncStorage from '@react-native-async-storage/async-storage';
import { createInitialState } from '@/domain/engine';
import { parseSave, serializeState } from '@/domain/serialize';
import type { AppState } from '@/domain/types';

export const STATE_KEY = 'life.exe/state/v1';
export const BACKUP_KEY = 'life.exe/state/v1/backup';

export interface LoadedState {
  state: AppState;
  source: 'storage' | 'fresh' | 'recovered';
  error?: string;
}

export async function loadPersistedState(): Promise<LoadedState> {
  const fallback = createInitialState();
  try {
    const raw = await AsyncStorage.getItem(STATE_KEY);
    if (!raw) return { state: fallback, source: 'fresh' };
    const parsed = parseSave(raw, fallback);
    if (parsed.ok && parsed.state) return { state: parsed.state, source: 'storage' };
    // Attempt a backup before giving up.
    const backup = await AsyncStorage.getItem(BACKUP_KEY);
    if (backup) {
      const recovered = parseSave(backup, fallback);
      if (recovered.ok && recovered.state) {
        return { state: recovered.state, source: 'recovered', error: parsed.error };
      }
    }
    return { state: fallback, source: 'fresh', error: parsed.error };
  } catch (error) {
    return {
      state: fallback,
      source: 'fresh',
      error: error instanceof Error ? error.message : 'Storage unavailable',
    };
  }
}

export async function saveState(state: AppState): Promise<void> {
  const raw = serializeState(state);
  try {
    const previous = await AsyncStorage.getItem(STATE_KEY);
    if (previous) await AsyncStorage.setItem(BACKUP_KEY, previous);
    await AsyncStorage.setItem(STATE_KEY, raw);
  } catch (error) {
    console.warn('[life.exe] failed to persist state', error);
  }
}

export async function clearPersistedState(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([STATE_KEY, BACKUP_KEY]);
  } catch (error) {
    console.warn('[life.exe] failed to clear state', error);
  }
}
