import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState as RNAppState, Platform } from 'react-native';
import { createId } from '@/lib/id';
import { haptics as hapticFeedback } from '@/lib/haptics';
import {
  addCategory,
  addQuest,
  archiveQuest as archiveQuestEngine,
  completeOnboarding,
  createInitialState,
  deleteQuest as deleteQuestEngine,
  equipCosmetic,
  importState as importStateEngine,
  performCompletion,
  performPurchase,
  removeCategory,
  restoreQuest as restoreQuestEngine,
  seedStarterQuests,
  undoCompletion as undoCompletionEngine,
  updateCategory as updateCategoryEngine,
  updateProfile as updateProfileEngine,
  updateQuest as updateQuestEngine,
  updateSettings,
  type OnboardingInput,
  type PurchaseResult,
  type QuestInput,
} from '@/domain/engine';
import { parseSave, serializeState, type ParseResult } from '@/domain/serialize';
import {
  coinBalance,
  isQuestDoneForPeriod,
  questById,
} from '@/domain/selectors';
import {
  startOfWeekKey,
} from '@/domain/date';
import type {
  AppState,
  Category,
  Completion,
  CompletionOutcome,
  Preferences,
  Profile,
  Quest,
  Rules,
  Settings,
} from '@/domain/types';
import { clearPersistedState, loadPersistedState, saveState } from './persistence';
import { useToday } from './useToday';
import type { ThemeMode } from '@/theme/palette';

export type ToastTone = 'success' | 'info' | 'error' | 'xp' | 'coin';

export interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
}

interface CategoryInput {
  name: string;
  hue: string;
  icon: string;
  blurb?: string;
}

interface AppStoreValue {
  state: AppState;
  hydrated: boolean;
  today: string;
  toast: Toast | null;
  celebration: CompletionOutcome | null;
  notify: (message: string, tone?: ToastTone) => void;
  dismissToast: () => void;
  dismissCelebration: () => void;
  completeQuest: (questId: string, dateKey?: string) => boolean;
  undoCompletion: (completionId: string) => void;
  toggleQuest: (questId: string) => void;
  createQuest: (input: QuestInput) => Quest | null;
  editQuest: (questId: string, input: QuestInput) => void;
  archiveQuest: (questId: string) => void;
  restoreQuest: (questId: string) => void;
  deleteQuest: (questId: string) => void;
  createCategory: (input: CategoryInput) => Category | null;
  editCategory: (categoryId: string, input: Partial<CategoryInput>) => void;
  deleteCategory: (categoryId: string) => void;
  updatePreferences: (patch: Partial<Preferences>) => void;
  updateRules: (rules: Rules) => void;
  updateProfile: (patch: Partial<Pick<Profile, 'name' | 'sigil' | 'titleId' | 'frameId' | 'accentId'>>) => void;
  purchase: (itemId: string) => PurchaseResult;
  equip: (itemId: string) => boolean;
  finishOnboarding: (input: OnboardingInput) => void;
  skipOnboarding: () => void;
  seedStarter: () => number;
  exportSave: () => string;
  importSave: (text: string) => ParseResult;
  resetEverything: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => createInitialState());
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [celebration, setCelebration] = useState<CompletionOutcome | null>(null);
  const stateRef = useRef(state);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const today = useToday();

  stateRef.current = state;

  const commit = useCallback((next: AppState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  useEffect(() => {
    let alive = true;
    loadPersistedState()
      .then((loaded) => {
        if (!alive) return;
        stateRef.current = loaded.state;
        setState(loaded.state);
        setHydrated(true);
      })
      .catch(() => {
        if (alive) setHydrated(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      void saveState(state);
    }, 280);
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [state, hydrated]);

  useEffect(() => {
    const subscription = RNAppState.addEventListener('change', (status) => {
      if (status !== 'active' && hydrated) {
        void saveState(stateRef.current);
      }
    });
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const flush = () => {
        void saveState(stateRef.current);
      };
      window.addEventListener('beforeunload', flush);
      return () => {
        subscription.remove();
        window.removeEventListener('beforeunload', flush);
      };
    }
    return () => subscription.remove();
  }, [hydrated]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const notify = useCallback((message: string, tone: ToastTone = 'info') => {
    setToast({ id: createId('toast'), message, tone });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);
  const dismissCelebration = useCallback(() => setCelebration(null), []);

  const completeQuest = useCallback(
    (questId: string, dateKey?: string) => {
      const result = performCompletion(stateRef.current, questId, { dateKey });
      if (!result) {
        notify('That quest is already logged for this cycle.', 'info');
        return false;
      }
      commit(result.state);
      setCelebration(result.outcome);
      const enabled = stateRef.current.settings.preferences.haptics;
      if (result.outcome.levelAfter > result.outcome.levelBefore) hapticFeedback.levelUp(enabled);
      else hapticFeedback.success(enabled);
      return true;
    },
    [commit, notify],
  );

  const undoCompletion = useCallback(
    (completionId: string) => {
      const completion = stateRef.current.completions.find((entry) => entry.id === completionId);
      commit(undoCompletionEngine(stateRef.current, completionId));
      hapticFeedback.warn(stateRef.current.settings.preferences.haptics);
      notify(completion ? `Removed “${completion.questTitle}”.` : 'Entry removed.', 'info');
    },
    [commit, notify],
  );

  const findPeriodCompletion = useCallback(
    (quest: Quest): Completion | undefined => {
      const current = stateRef.current;
      if (quest.cadence === 'weekly') {
        const weekStart = startOfWeekKey(today, current.settings.rules.weekStart);
        return current.completions.find(
          (completion) =>
            completion.questId === quest.id &&
            completion.date >= weekStart &&
            completion.date <= today,
        );
      }
      if (quest.cadence === 'daily') {
        return current.completions.find(
          (completion) => completion.questId === quest.id && completion.date === today,
        );
      }
      return current.completions.find((completion) => completion.questId === quest.id);
    },
    [today],
  );

  const toggleQuest = useCallback(
    (questId: string) => {
      const current = stateRef.current;
      const quest = questById(current, questId);
      if (!quest) return;
      const existing = findPeriodCompletion(quest);
      if (existing) {
        undoCompletion(existing.id);
        return;
      }
      completeQuest(questId);
    },
    [completeQuest, findPeriodCompletion, undoCompletion],
  );

  const createQuest = useCallback(
    (input: QuestInput) => {
      if (!input.title.trim()) {
        notify('Give the quest a name first.', 'error');
        return null;
      }
      const result = addQuest(stateRef.current, input);
      commit(result.state);
      hapticFeedback.tap(stateRef.current.settings.preferences.haptics);
      notify('Quest added to the board.', 'success');
      return result.quest;
    },
    [commit, notify],
  );

  const editQuest = useCallback(
    (questId: string, input: QuestInput) => {
      commit(updateQuestEngine(stateRef.current, questId, input));
      notify('Quest updated.', 'success');
    },
    [commit, notify],
  );

  const archiveQuest = useCallback(
    (questId: string) => {
      commit(archiveQuestEngine(stateRef.current, questId));
      notify('Quest archived.', 'info');
    },
    [commit, notify],
  );

  const restoreQuest = useCallback(
    (questId: string) => {
      commit(restoreQuestEngine(stateRef.current, questId));
      notify('Quest restored.', 'success');
    },
    [commit, notify],
  );

  const deleteQuest = useCallback(
    (questId: string) => {
      commit(deleteQuestEngine(stateRef.current, questId));
      notify('Quest deleted. Its history is preserved.', 'info');
    },
    [commit, notify],
  );

  const createCategory = useCallback(
    (input: CategoryInput) => {
      if (!input.name.trim()) {
        notify('Name the skill first.', 'error');
        return null;
      }
      const result = addCategory(stateRef.current, input);
      commit(result.state);
      notify('New skill added.', 'success');
      return result.category;
    },
    [commit, notify],
  );

  const editCategory = useCallback(
    (categoryId: string, input: Partial<CategoryInput>) => {
      commit(updateCategoryEngine(stateRef.current, categoryId, input));
    },
    [commit],
  );

  const deleteCategory = useCallback(
    (categoryId: string) => {
      const next = removeCategory(stateRef.current, categoryId);
      if (next === stateRef.current) {
        notify('This skill still has active quests.', 'error');
        return;
      }
      commit(next);
      notify('Skill removed.', 'info');
    },
    [commit, notify],
  );

  const updatePreferences = useCallback(
    (patch: Partial<Preferences>) => {
      commit(updateSettings(stateRef.current, { preferences: { ...stateRef.current.settings.preferences, ...patch } }));
    },
    [commit],
  );

  const updateRules = useCallback(
    (rules: Rules) => {
      commit(updateSettings(stateRef.current, { rules }));
    },
    [commit],
  );

  const updateProfile = useCallback(
    (patch: Partial<Pick<Profile, 'name' | 'sigil' | 'titleId' | 'frameId' | 'accentId'>>) => {
      commit(updateProfileEngine(stateRef.current, patch));
    },
    [commit],
  );

  const purchase = useCallback(
    (itemId: string) => {
      const result = performPurchase(stateRef.current, itemId);
      if (result.ok) {
        commit(result.state);
        hapticFeedback.success(stateRef.current.settings.preferences.haptics);
        notify('Cosmetic unlocked.', 'coin');
        if (result.unlockedAchievements?.length) {
          notify('Achievement unlocked — check your profile.', 'success');
        }
      } else {
        const balance = coinBalance(stateRef.current);
        hapticFeedback.warn(stateRef.current.settings.preferences.haptics);
        if (result.reason === 'insufficient_coins') {
          notify(`Not enough coins yet. Balance: ${balance}.`, 'error');
        } else if (result.reason === 'already_owned') {
          notify('You already own this one.', 'info');
        } else {
          notify('This item cannot be purchased.', 'error');
        }
      }
      return result;
    },
    [commit, notify],
  );

  const equip = useCallback(
    (itemId: string) => {
      const result = equipCosmetic(stateRef.current, itemId);
      if (!result.ok) {
        notify('Unlock this item before equipping it.', 'error');
        return false;
      }
      commit(result.state);
      hapticFeedback.tap(stateRef.current.settings.preferences.haptics);
      notify('Loadout updated.', 'success');
      return true;
    },
    [commit, notify],
  );

  const finishOnboarding = useCallback(
    (input: OnboardingInput) => {
      commit(completeOnboarding(stateRef.current, input));
      hapticFeedback.success(true);
    },
    [commit],
  );

  const skipOnboarding = useCallback(() => {
    commit(
      completeOnboarding(stateRef.current, {
        name: 'Operator',
        accentId: 'mint',
        focusIds: [],
        theme: 'dark',
        haptics: true,
        seed: false,
      }),
    );
  }, [commit]);

  const seedStarter = useCallback(() => {
    const before = stateRef.current.quests.length;
    const next = seedStarterQuests(
      stateRef.current,
      stateRef.current.categories.map((category) => category.id),
    );
    commit(next);
    const added = next.quests.length - before;
    notify(added ? `Starter protocol loaded: ${added} quests.` : 'Starter quests are already on the board.', added ? 'success' : 'info');
    return added;
  }, [commit, notify]);

  const exportSave = useCallback(() => serializeState(stateRef.current), []);

  const importSave = useCallback(
    (text: string) => {
      const parsed = parseSave(text, stateRef.current);
      if (parsed.ok && parsed.state) {
        commit(importStateEngine(stateRef.current, parsed.state));
        notify('Save imported. Systems restored.', 'success');
      } else {
        notify(parsed.error ?? 'Could not import this save.', 'error');
      }
      return parsed;
    },
    [commit, notify],
  );

  const resetEverything = useCallback(() => {
    void clearPersistedState();
    commit(createInitialState());
    notify('All local data cleared.', 'info');
  }, [commit, notify]);

  const setTheme = useCallback(
    (theme: ThemeMode) => updatePreferences({ theme }),
    [updatePreferences],
  );

  const value = useMemo<AppStoreValue>(
    () => ({
      state,
      hydrated,
      today,
      toast,
      celebration,
      notify,
      dismissToast,
      dismissCelebration,
      completeQuest,
      undoCompletion,
      toggleQuest,
      createQuest,
      editQuest,
      archiveQuest,
      restoreQuest,
      deleteQuest,
      createCategory,
      editCategory,
      deleteCategory,
      updatePreferences,
      updateRules,
      updateProfile,
      purchase,
      equip,
      finishOnboarding,
      skipOnboarding,
      seedStarter,
      exportSave,
      importSave,
      resetEverything,
      setTheme,
    }),
    [
      state,
      hydrated,
      today,
      toast,
      celebration,
      notify,
      dismissToast,
      dismissCelebration,
      completeQuest,
      undoCompletion,
      toggleQuest,
      createQuest,
      editQuest,
      archiveQuest,
      restoreQuest,
      deleteQuest,
      createCategory,
      editCategory,
      deleteCategory,
      updatePreferences,
      updateRules,
      updateProfile,
      purchase,
      equip,
      finishOnboarding,
      skipOnboarding,
      seedStarter,
      exportSave,
      importSave,
      resetEverything,
      setTheme,
    ],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStoreValue {
  const store = useContext(AppStoreContext);
  if (!store) throw new Error('useAppStore must be used inside AppStoreProvider');
  return store;
}

export function useQuest(questId: string | undefined): Quest | undefined {
  const { state } = useAppStore();
  return questId ? questById(state, questId) : undefined;
}

export { isQuestDoneForPeriod };
export type { Settings };
