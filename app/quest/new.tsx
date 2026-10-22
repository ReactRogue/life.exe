import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { hueFor, withAlpha } from '@/theme/palette';
import { CADENCES, DIFFICULTIES } from '@/domain/constants';
import { awardForQuest } from '@/domain/xp';
import { currentStreakOf, questById } from '@/domain/selectors';
import type { Cadence, Difficulty } from '@/domain/types';
import { AmbientBackground } from '@/components/ui/AmbientBackground';
import { AppText, HudLabel } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  FieldLabel,
  OptionCard,
  SegmentedControl,
  TextField,
  WeekdayPicker,
} from '@/components/ui/Field';
import { Chip } from '@/components/ui/Chip';
import { Icon, type IconName } from '@/components/icons/Icon';
import { formatNumber } from '@/lib/format';

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function QuestFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; cadence?: string; category?: string; preset?: string }>();
  const { state, today, createQuest, editQuest } = useAppStore();
  const { palette } = useTheme();

  const existing = params.id ? questById(state, params.id) : undefined;
  const isEdit = Boolean(existing);
  const presetCadence = CADENCES.some((entry) => entry.id === params.cadence)
    ? (params.cadence as Cadence)
    : existing?.cadence ?? 'daily';
  const presetCategory = state.categories.some((category) => category.id === params.category)
    ? (params.category as string)
    : existing?.categoryId ?? state.categories[0]?.id ?? 'discipline';
  const isRecovery = params.preset === 'recovery' && !isEdit;

  const [title, setTitle] = useState(existing?.title ?? (isRecovery ? '10-minute reset' : ''));
  const [notes, setNotes] = useState(
    existing?.notes ??
      (isRecovery
        ? 'A gentle restart. Any movement counts — no catching up required.'
        : ''),
  );
  const [categoryId, setCategoryId] = useState(presetCategory);
  const [difficulty, setDifficulty] = useState<Difficulty>(existing?.difficulty ?? (isRecovery ? 'trivial' : 'moderate'));
  const [cadence, setCadence] = useState<Cadence>(isRecovery ? 'once' : presetCadence);
  const [days, setDays] = useState<number[]>(
    existing?.daysOfWeek?.length ? existing.daysOfWeek : ALL_DAYS,
  );
  const [error, setError] = useState<string | undefined>();

  const category = state.categories.find((entry) => entry.id === categoryId);
  const streak = currentStreakOf(state, today);
  const award = awardForQuest(
    { difficulty, cadence },
    state.settings.rules,
    Math.max(1, streak.days + (streak.activeToday ? 0 : 1)),
  );
  const weeklyXp = cadence === 'weekly' ? state.settings.rules.weeklyBonusXp : 0;
  const weeklyCoins = cadence === 'weekly' ? state.settings.rules.weeklyBonusCoins : 0;
  const totalXp = award.xp + weeklyXp;
  const totalCoins = award.coins + weeklyCoins;
  const hue = hueFor(category?.hue ?? 'discipline', palette.mode);

  const cadenceDescription = useMemo(() => {
    if (cadence === 'daily') return 'A recurring directive. Schedule specific weekdays, or run it every day.';
    if (cadence === 'weekly') return 'One meaningful win per week, with an extra XP and coin bonus.';
    return 'A single mission. Once complete, it can be archived or deleted without losing its history.';
  }, [cadence]);

  const save = () => {
    if (!title.trim()) {
      setError('Give the quest a name.');
      return;
    }
    if (!state.categories.some((entry) => entry.id === categoryId)) {
      setError('Pick a skill for this quest.');
      return;
    }
    const input = {
      title,
      notes,
      categoryId,
      difficulty,
      cadence,
      daysOfWeek: cadence === 'daily' ? days : undefined,
    };
    if (isEdit && existing) {
      editQuest(existing.id, input);
    } else {
      const created = createQuest(input);
      if (!created) return;
    }
    router.back();
  };

  if (params.id && !existing) {
    return (
      <View className="flex-1">
        <AmbientBackground />
        <SafeAreaView className="flex-1 items-center justify-center px-6">
          <Icon name="info" size={32} color={palette.primaryText} />
          <AppText variant="h2" className="mt-4" align="center">
            Quest not found
          </AppText>
          <AppText variant="caption" tone="muted" align="center" className="mt-2">
            It may have been deleted from another screen.
          </AppText>
          <Button label="Close" onPress={() => router.back()} className="mt-5" />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <AmbientBackground />
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View className="w-full max-w-[620px] flex-1 self-center px-5">
            <View className="flex-row items-center justify-between pt-2">
              <View>
                <HudLabel tone="accent">{isEdit ? 'EDIT MISSION' : 'NEW MISSION'}</HudLabel>
                <AppText variant="h2" className="mt-0.5">
                  {isEdit ? 'Tune the quest' : 'Design a quest'}
                </AppText>
              </View>
              <IconButton
                icon="close"
                label="Close without saving"
                variant="surface"
                onPress={() => router.back()}
              />
            </View>

            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingTop: 18, paddingBottom: 24 }}
            >
              <TextField
                label="QUEST TITLE"
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  if (error) setError(undefined);
                }}
                placeholder="e.g. Read 10 pages"
                maxLength={90}
                showCount
                error={error}
                autoFocus={!isEdit}
                returnKeyType="next"
              />

              <View className="mt-4">
                <TextField
                  label="NOTES · OPTIONAL"
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="A reminder for future you"
                  multiline
                  maxLength={280}
                  showCount
                />
              </View>

              <View className="mt-5">
                <FieldLabel hint={category?.name}>SKILL TREE</FieldLabel>
                <View className="flex-row flex-wrap gap-2">
                  {state.categories.map((entry) => (
                    <Chip
                      key={entry.id}
                      label={entry.name}
                      icon={entry.icon as IconName}
                      color={hueFor(entry.hue, palette.mode)}
                      selected={entry.id === categoryId}
                      onPress={() => setCategoryId(entry.id)}
                    />
                  ))}
                </View>
              </View>

              <View className="mt-5">
                <FieldLabel hint={cadenceDescription}>TYPE</FieldLabel>
                <SegmentedControl
                  label="Quest cadence"
                  value={cadence}
                  options={CADENCES.map((entry) => ({
                    value: entry.id,
                    label: entry.label,
                    icon: entry.icon as IconName,
                  }))}
                  onChange={(value) => setCadence(value)}
                />
              </View>

              {cadence === 'daily' ? (
                <View className="mt-4">
                  <WeekdayPicker value={days} onChange={setDays} />
                </View>
              ) : null}

              <View className="mt-5">
                <FieldLabel hint={`${DIFFICULTIES.find((entry) => entry.id === difficulty)?.label}`}>
                  DIFFICULTY
                </FieldLabel>
                <View className="gap-2">
                  {DIFFICULTIES.map((entry) => (
                    <OptionCard
                      key={entry.id}
                      title={`${entry.label} · ${entry.blurb}`}
                      description={`${entry.bars} / 5 intensity`}
                      selected={difficulty === entry.id}
                      onPress={() => setDifficulty(entry.id)}
                      leading={
                        <View className="flex-row items-end gap-0.5" style={{ height: 18 }}>
                          {Array.from({ length: 5 }).map((_, index) => (
                            <View
                              key={index}
                              style={{
                                width: 3,
                                height: 5 + index * 3,
                                borderRadius: 2,
                                backgroundColor:
                                  index < entry.bars ? hue : withAlpha(palette.textFaint, 0.25),
                              }}
                            />
                          ))}
                        </View>
                      }
                      trailing={
                        <AppText variant="mono" tone="faint" style={{ fontSize: 11 }}>
                          +{state.settings.rules.xpByDifficulty[entry.id]}
                        </AppText>
                      }
                    />
                  ))}
                </View>
              </View>

              <Card variant="accent" className="mt-5">
                <View className="flex-row items-center justify-between">
                  <HudLabel tone="accent">REWARD PREVIEW</HudLabel>
                  <Badge label={`${Math.max(1, streak.days + (streak.activeToday ? 0 : 1))}D STREAK`} tone="streak" icon="flame" compact />
                </View>
                <View className="mt-3 flex-row items-end gap-5">
                  <View>
                    <HudLabel tone="faint">XP</HudLabel>
                    <View className="mt-1 flex-row items-center gap-1.5">
                      <Icon name="bolt" size={18} color={palette.primaryText} filled />
                      <AppText variant="number" tone="accent">
                        +{formatNumber(totalXp)}
                      </AppText>
                    </View>
                  </View>
                  <View>
                    <HudLabel tone="faint">COINS</HudLabel>
                    <View className="mt-1 flex-row items-center gap-1.5">
                      <Icon name="coin" size={16} color={palette.coin} />
                      <AppText variant="number" tone="coin">
                        +{totalCoins}
                      </AppText>
                    </View>
                  </View>
                  <View className="flex-1 items-end">
                    <HudLabel tone="faint">MULTIPLIER</HudLabel>
                    <AppText variant="monoStrong" className="mt-1">
                      x{award.multiplier.toFixed(2)}
                    </AppText>
                  </View>
                </View>
                <AppText variant="micro" tone="muted" className="mt-2">
                  {cadence === 'weekly'
                    ? `Includes the weekly bonus (+${weeklyXp} XP, +${weeklyCoins} coins).`
                    : cadence === 'daily'
                      ? `Daily goals add +${state.settings.rules.dailyGoalBonusXp} XP once you clear ${state.settings.rules.dailyGoalCount} quests in a day.`
                      : 'One-off missions use the same streak multiplier as everything else.'}
                </AppText>
              </Card>

              {isEdit ? (
                <View className="mt-3 flex-row items-center gap-2">
                  <Icon name="info" size={12} color={palette.textFaint} />
                  <AppText variant="micro" tone="faint">
                    Editing never rewrites past rewards. History stays attached to this quest.
                  </AppText>
                </View>
              ) : null}
            </ScrollView>

            <View className="flex-row gap-2.5 pb-2 pt-3">
              <Button label="Cancel" variant="secondary" size="lg" onPress={() => router.back()} className="flex-1" />
              <Button
                label={isEdit ? 'Save changes' : 'Add quest'}
                icon="check"
                size="lg"
                onPress={save}
                className="flex-[1.4]"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
