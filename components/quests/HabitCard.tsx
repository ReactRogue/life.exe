import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useAppStore } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { hueFor, withAlpha } from '@/theme/palette';
import { habitStreak, isScheduledOn } from '@/domain/selectors';
import { weekDates, todayKey as todayKeyFn } from '@/domain/date';
import { DIFFICULTY_MAP } from '@/domain/constants';
import { AppText, HudLabel } from '@/components/ui/Text';
import { Icon } from '@/components/icons/Icon';
import { cn } from '@/lib/cn';
import type { Quest } from '@/domain/types';

export function HabitCard({ quest, onOpen }: { quest: Quest; onOpen?: () => void }) {
  const { state, today, completeQuest, undoCompletion } = useAppStore();
  const { palette, isDark } = useTheme();
  const category = state.categories.find((entry) => entry.id === quest.categoryId);
  const hue = hueFor(category?.hue ?? 'discipline', palette.mode);
  const rules = state.settings.rules;
  const days = weekDates(today, rules.weekStart);
  const streak = habitStreak(quest, state.completions, today, rules.graceDays);
  const completions = state.completions.filter((completion) => completion.questId === quest.id);
  const doneDates = new Set(completions.map((completion) => completion.date));
  const difficulty = DIFFICULTY_MAP[quest.difficulty];

  const todayCompletion = completions.find((completion) => completion.date === today);

  const handleDay = (date: string) => {
    const existing = completions.find((completion) => completion.date === date);
    if (existing) {
      undoCompletion(existing.id);
      return;
    }
    completeQuest(quest.id, date);
  };

  return (
    <View
      className="mb-3 overflow-hidden rounded-2xl border p-3.5"
      style={{
        borderColor: palette.border,
        backgroundColor: isDark ? '#0A141F' : '#FFFFFF',
      }}
    >
      <View className="flex-row items-center gap-2.5">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open habit ${quest.title}`}
          onPress={onOpen}
          className="flex-1 flex-row items-center gap-2.5"
        >
          <View
            className="h-9 w-9 items-center justify-center rounded-xl border"
            style={{ backgroundColor: withAlpha(hue, 0.12), borderColor: withAlpha(hue, 0.28) }}
          >
            <Icon name={category?.icon === 'shield' ? 'shield' : 'refresh'} size={16} color={hue} />
          </View>
          <View className="flex-1">
            <AppText variant="bodyStrong" numberOfLines={1}>
              {quest.title}
            </AppText>
            <View className="flex-row items-center gap-2">
              <HudLabel tone="faint">{difficulty.label.toUpperCase()}</HudLabel>
              {streak > 0 ? (
                <View className="flex-row items-center gap-0.5">
                  <Icon name="flame" size={10} color={isDark ? '#FFB27A' : '#A8401B'} filled />
                  <HudLabel tone="faint">{streak}D STREAK</HudLabel>
                </View>
              ) : null}
            </View>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: Boolean(todayCompletion) }}
          accessibilityLabel={todayCompletion ? `Mark ${quest.title} undone for today` : `Log ${quest.title} for today`}
          onPress={() => (todayCompletion ? undoCompletion(todayCompletion.id) : completeQuest(quest.id))}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-xl border"
          style={{
            backgroundColor: todayCompletion ? hue : withAlpha(hue, 0.08),
            borderColor: withAlpha(hue, todayCompletion ? 0.9 : 0.35),
          }}
        >
          <Icon
            name={todayCompletion ? 'check' : 'plus'}
            size={18}
            color={todayCompletion ? (isDark ? '#04120E' : '#FFFFFF') : hue}
            strokeWidth={2.4}
          />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-3"
        contentContainerStyle={{ gap: 4 }}
      >
        {days.map((date) => {
          const done = doneDates.has(date);
          const scheduled = isScheduledOn(quest, date);
          const future = date > today;
          const distance = Math.round(
            (new Date(`${today}T12:00:00`).getTime() - new Date(`${date}T12:00:00`).getTime()) / 86_400_000,
          );
          const canBackfill = !done && date < today && distance <= rules.graceDays && scheduled;
          const disabled = future || !scheduled || (date < today && !canBackfill);
          const isToday = date === today;
          return (
            <Pressable
              key={date}
              disabled={disabled}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: done, disabled }}
              accessibilityLabel={`${date === today ? 'Today' : date}: ${done ? 'logged' : disabled ? 'not available' : 'log habit'}`}
              onPress={() => handleDay(date)}
              className={cn('items-center gap-1 rounded-xl px-2 py-1.5', disabled && 'opacity-40')}
              style={({ pressed }) => [
                isToday ? { backgroundColor: palette.primarySoft } : null,
                pressed ? { opacity: 0.65 } : null,
              ]}
            >
              <AppText
                variant="micro"
                style={{
                  color: done ? hue : isToday ? palette.primaryText : palette.textFaint,
                  fontSize: 10,
                }}
              >
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(`${date}T12:00:00`).getDay()]}
              </AppText>
              <View
                className="h-6 w-6 items-center justify-center rounded-full border"
                style={{
                  borderColor: done ? hue : withAlpha(palette.textFaint, 0.35),
                  backgroundColor: done ? hue : 'transparent',
                  borderStyle: scheduled ? 'solid' : 'dashed',
                }}
              >
                {done ? (
                  <Icon name="check" size={12} color={isDark ? '#04120E' : '#FFFFFF'} strokeWidth={3} />
                ) : (
                  <AppText variant="micro" style={{ color: palette.textFaint, fontSize: 9 }}>
                    {new Date(`${date}T12:00:00`).getDate()}
                  </AppText>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
      {!todayCompletion && isScheduledOn(quest, todayKeyFn()) ? (
        <AppText variant="micro" tone="faint" className="mt-1.5">
          Tap + to check in. Tap a past day within the grace window to backfill.
        </AppText>
      ) : null}
    </View>
  );
}
