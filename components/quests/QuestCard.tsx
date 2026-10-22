import React from 'react';
import { Pressable, View } from 'react-native';
import { useAppStore } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { hueFor, withAlpha } from '@/theme/palette';
import {
  currentStreakOf,
  habitStreak,
  isQuestDoneForPeriod,
} from '@/domain/selectors';
import { CADENCE_MAP, DIFFICULTY_MAP } from '@/domain/constants';
import { awardForQuest } from '@/domain/xp';
import { AppText, HudLabel } from '@/components/ui/Text';
import { Icon } from '@/components/icons/Icon';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';
import type { Quest } from '@/domain/types';

export interface QuestCardProps {
  quest: Quest;
  compact?: boolean;
  onOpen?: () => void;
}

export function QuestCard({ quest, compact = false, onOpen }: QuestCardProps) {
  const { state, today, toggleQuest } = useAppStore();
  const { palette, isDark } = useTheme();
  const rules = state.settings.rules;
  const category = state.categories.find((entry) => entry.id === quest.categoryId);
  const hue = hueFor(category?.hue ?? 'discipline', palette.mode);
  const done = isQuestDoneForPeriod(quest, state.completions, today, rules.weekStart);
  const streak = currentStreakOf(state, today);
  const award = awardForQuest(
    quest,
    rules,
    streak.days + (streak.activeToday ? 0 : 1),
  );
  const weeklyXp = quest.cadence === 'weekly' ? rules.weeklyBonusXp : 0;
  const weeklyCoins = quest.cadence === 'weekly' ? rules.weeklyBonusCoins : 0;
  const habitDays = quest.cadence === 'daily' ? habitStreak(quest, state.completions, today, rules.graceDays) : 0;
  const difficulty = DIFFICULTY_MAP[quest.difficulty];
  const cadence = CADENCE_MAP[quest.cadence];

  return (
    <View
      className={cn(
        'mb-2.5 flex-row items-center gap-3 overflow-hidden rounded-2xl border px-3.5',
        compact ? 'py-3' : 'py-3.5',
      )}
      style={{
        backgroundColor: done
          ? withAlpha(hue, isDark ? 0.1 : 0.06)
          : isDark
            ? '#0A141F'
            : '#FFFFFF',
        borderColor: done ? withAlpha(hue, 0.35) : palette.border,
      }}
    >
      <View
        className="absolute bottom-2.5 left-0 top-2.5 w-[3px] rounded-full"
        style={{ backgroundColor: withAlpha(hue, done ? 1 : 0.55) }}
      />
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={done ? `Mark ${quest.title} as not done` : `Complete ${quest.title}`}
        onPress={() => toggleQuest(quest.id)}
        hitSlop={10}
        className="items-center justify-center"
        style={{ width: 34, height: 38 }}
      >
        <View
          className="items-center justify-center rounded-xl border"
          style={{
            width: 28,
            height: 28,
            borderRadius: 9,
            borderColor: done ? hue : withAlpha(hue, 0.5),
            backgroundColor: done ? hue : 'transparent',
          }}
        >
          {done ? (
            <Icon
              name="check"
              size={15}
              color={palette.mode === 'dark' ? '#04120E' : '#FFFFFF'}
              strokeWidth={3}
            />
          ) : (
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: withAlpha(hue, 0.65) }} />
          )}
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${quest.title}. ${difficulty.label} ${cadence.label.toLowerCase()} quest. ${done ? 'Completed' : 'Not completed'}.`}
        accessibilityHint="Opens quest details"
        onPress={onOpen}
        className="flex-1 flex-row items-center gap-3"
        style={({ pressed }) => (pressed ? { opacity: 0.82 } : null)}
      >
      <View className="flex-1">
        <AppText
          variant="bodyStrong"
          numberOfLines={2}
          style={{ color: done ? palette.textMuted : palette.text }}
        >
          {quest.title}
        </AppText>
        <View className="mt-1 flex-row flex-wrap items-center gap-x-2 gap-y-1">
          {category ? (
            <View className="flex-row items-center gap-1">
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: hue }} />
              <HudLabel tone="faint">{category.name.toUpperCase()}</HudLabel>
            </View>
          ) : null}
          <HudLabel tone={done ? 'faint' : 'muted'}>{difficulty.label.toUpperCase()}</HudLabel>
          {!compact ? (
            <HudLabel tone="faint">{cadence.code}</HudLabel>
          ) : null}
          {habitDays > 1 ? (
            <View className="flex-row items-center gap-0.5">
              <Icon name="flame" size={11} color={palette.mode === 'dark' ? '#FFB27A' : '#A8401B'} filled />
              <HudLabel tone="faint">{habitDays}D</HudLabel>
            </View>
          ) : null}
        </View>
      </View>

      <View className="items-end gap-0.5">
        <View className="flex-row items-center gap-1">
          <Icon name="bolt" size={12} color={palette.primaryText} filled />
          <AppText variant="monoStrong" tone={done ? 'faint' : 'accent'}>
            {done ? 'DONE' : `+${formatNumber(award.xp + weeklyXp)}`}
          </AppText>
        </View>
        <View className="flex-row items-center gap-1">
          <Icon name="coin" size={11} color={palette.coin} />
          <AppText variant="micro" tone="faint">
            {award.coins + weeklyCoins}
          </AppText>
        </View>
      </View>
      </Pressable>
    </View>
  );
}
