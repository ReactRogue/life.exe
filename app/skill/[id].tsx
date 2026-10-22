import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { hueFor, withAlpha } from '@/theme/palette';
import {
  activeQuests,
  categoryStats,
  daySeries,
  isQuestDoneForPeriod,
  skillLevelFor,
  totalXp,
  profileLevel,
} from '@/domain/selectors';
import { CADENCE_MAP, DIFFICULTY_MAP, titleForLevel } from '@/domain/constants';
import { MAX_LEVEL } from '@/domain/xp';
import { formatDateKey, relativeTime } from '@/domain/date';
import type { IconName } from '@/components/icons/Icon';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { AppText, HudLabel } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatTile } from '@/components/ui/StatTile';
import { AreaChart } from '@/components/charts/AreaChart';
import { WeeklyBars } from '@/components/charts/WeeklyBars';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Icon } from '@/components/icons/Icon';
import { formatNumber, percent } from '@/lib/format';

export default function SkillDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, today, toggleQuest } = useAppStore();
  const { palette, isDark } = useTheme();

  const category = state.categories.find((entry) => entry.id === id);

  if (!category) {
    return (
      <Screen scroll={false}>
        <View className="flex-1 items-center justify-center">
          <Icon name="info" size={32} color={palette.primaryText} />
          <AppText variant="h2" className="mt-4" align="center">
            Skill tree not found
          </AppText>
          <AppText variant="caption" tone="muted" align="center" className="mt-2">
            This category may have been removed. Linked quests keep their history.
          </AppText>
          <Button label="Back to profile" onPress={() => router.replace('/profile')} className="mt-5" />
        </View>
      </Screen>
    );
  }

  const hue = hueFor(category.hue, palette.mode);
  const stats = categoryStats(state).find((entry) => entry.category.id === category.id);
  const level = skillLevelFor(state, category.id);
  const globalLevel = profileLevel(state);
  const categoryQuests = [...activeQuests(state), ...state.quests.filter((quest) => quest.archivedAt && quest.categoryId === category.id)]
    .filter((quest) => quest.categoryId === category.id)
    .sort((a, b) => Number(Boolean(a.archivedAt)) - Number(Boolean(b.archivedAt)));
  const activeCategoryQuests = categoryQuests.filter((quest) => !quest.archivedAt);
  const series = useMemo(() => daySeries(state, 30, today), [state, today]);
  const skillSeries = useMemo(() => {
    return [...Array(30)].map((_, index) => {
      const date = series[index]?.date;
      const xp = state.completions
        .filter((completion) => completion.categoryId === category.id && completion.date === date)
        .reduce((sum, completion) => sum + completion.xp, 0);
      return { date: date ?? '', xp };
    });
  }, [series, state.completions, category.id]);

  const total = series.reduce((sum, point) => sum + point.xp, 0);
  const skillTotal = skillSeries.reduce((sum, point) => sum + point.xp, 0);
  const share = total > 0 ? skillTotal / total : 0;
  const activeDays = skillSeries.filter((point) => point.xp > 0).length;
  const bestDay = skillSeries.reduce((best, point) => (point.xp > best.xp ? point : best), skillSeries[0]);
  const lastCompletion = state.completions
    .filter((completion) => completion.categoryId === category.id)
    .slice()
    .sort((a, b) => (a.completedAt < b.completedAt ? -1 : 1))
    .pop();

  const weekStartKey = useMemo(() => {
    const start = new Date(`${today}T00:00:00`);
    const diff = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - diff);
    return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
  }, [today]);

  const weekBars = useMemo(() => {
    const days = [...Array(7)].map((_, index) => {
      const date = new Date(`${weekStartKey}T00:00:00`);
      date.setDate(date.getDate() + index);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const xp = state.completions
        .filter((completion) => completion.categoryId === category.id && completion.date === key)
        .reduce((sum, completion) => sum + completion.xp, 0);
      return { date: key, xp };
    });
    return days;
  }, [state.completions, category.id, weekStartKey]);

  const nextLevelXp = Math.max(0, level.nextLevelAt - level.totalXp);

  return (
    <Screen>
      <View className="pt-1 flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <HudLabel tone="accent">SKILL TREE</HudLabel>
          <AppText variant="h2" className="mt-1" numberOfLines={1}>
            {category.name}
          </AppText>
        </View>
        <View className="flex-row gap-2">
          <IconButton icon="plus" label="Add quest to this skill" variant="surface" onPress={() => router.push(`/quest/new?category=${category.id}`)} />
          <IconButton icon="close" label="Back" variant="surface" onPress={() => router.back()} />
        </View>
      </View>

      <Card hud className="mt-4">
        <View className="flex-row items-center gap-4">
          <ProgressRing progress={level.progress} size={92} strokeWidth={6.5} colors={[hue, withAlpha(hue, 0.4)]}>
            <View
              className="items-center justify-center rounded-full"
              style={{ width: 64, height: 64, backgroundColor: withAlpha(hue, 0.12) }}
            >
              <Icon name={(category.icon ?? 'target') as IconName} size={22} color={hue} />
              <AppText variant="monoStrong" style={{ color: hue }}>
                LV {level.level}
              </AppText>
            </View>
          </ProgressRing>
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Badge label={category.hue.toUpperCase()} compact color={hue} />
              {stats && stats.share > 0 ? <Badge label={`${percent(stats.share)} OF XP`} compact tone="neutral" /> : null}
            </View>
            <AppText variant="bodyStrong" className="mt-2">
              {titleForLevel(level.level)}
            </AppText>
            <AppText variant="micro" tone="faint" className="mt-0.5">
              {level.level >= MAX_LEVEL ? 'Skill maxed out' : `${formatNumber(nextLevelXp)} XP to level ${level.level + 1}`}
            </AppText>
            <View className="mt-2">
              <ProgressBar progress={level.progress} color={hue} height={5} accessibilityLabel={`${category.name} level progress`} />
            </View>
            <AppText variant="micro" tone="faint" className="mt-1.5">
              {formatNumber(level.totalXp)} total XP · {stats?.completions ?? 0} completions
            </AppText>
          </View>
        </View>

        <View className="mt-4 flex-row items-center gap-2 rounded-xl border px-3 py-2.5" style={{ borderColor: palette.border, backgroundColor: palette.surfaceAlt }}>
          <Icon name="flame" size={14} color={hue} />
          <AppText variant="micro" tone="muted" className="flex-1">
            {activeDays > 0
              ? `${percent(share)} of your last 30 days of XP came from this tree. Best session ${formatDateKey(bestDay.date, 'short')} (+${bestDay.xp} XP).`
              : 'This tree is still dormant. One quest is enough to light it up.'}
          </AppText>
        </View>
      </Card>

      <View className="mt-4 flex-row gap-2.5">
        <StatTile compact className="flex-1" label="LAST 30D" value={formatNumber(skillTotal)} hint="XP earned" icon="bolt" color={hue} />
        <StatTile compact className="flex-1" label="ACTIVE DAYS" value={`${activeDays}/30`} hint={activeDays ? `${percent(activeDays / 30)} rhythm` : 'no data'} icon="calendar" />
        <StatTile
          compact
          className="flex-1"
          label="GLOBAL LV"
          value={String(globalLevel.level)}
          hint={`${percent(level.totalXp / Math.max(1, totalXp(state)))} of total XP`}
          icon="layers"
        />
      </View>

      <Card className="mt-4">
        <View className="flex-row items-center justify-between">
          <HudLabel tone="muted">LAST 30 DAYS</HudLabel>
          <HudLabel tone="faint" style={{ color: hue }}>
            {formatNumber(skillTotal)} XP
          </HudLabel>
        </View>
        <View className="mt-3">
          <AreaChart
            points={skillSeries.map((point) => ({ date: point.date, value: point.xp }))}
            color={hue}
            height={148}
            accessibilityLabel={`${category.name} XP over the last 30 days`}
          />
        </View>
      </Card>

      <Card className="mt-3">
        <View className="flex-row items-center justify-between">
          <HudLabel tone="muted">THIS WEEK</HudLabel>
          <HudLabel tone="faint">BY DAY</HudLabel>
        </View>
        <View className="mt-2">
          <WeeklyBars
            data={weekBars.map((point) => ({
              date: point.date,
              value: point.xp,
              count: state.completions.filter((c) => c.categoryId === category.id && c.date === point.date).length,
              isToday: point.date === today,
            }))}
            height={112}
          />
        </View>
      </Card>

      <View className="mt-6">
        <View className="mb-2 flex-row items-center justify-between">
          <HudLabel tone="muted">QUESTS IN THIS TREE</HudLabel>
          <HudLabel tone="faint">{activeCategoryQuests.length} ACTIVE</HudLabel>
        </View>
        {activeCategoryQuests.length ? (
          <Card padded={false} className="overflow-hidden">
            {activeCategoryQuests.map((quest) => {
              const done = isQuestDoneForPeriod(quest, state.completions, today, state.settings.rules.weekStart);
              const difficulty = DIFFICULTY_MAP[quest.difficulty];
              return (
                <View
                  key={quest.id}
                  className="flex-row items-center gap-3 px-4 py-3.5"
                  style={{ borderBottomWidth: 1, borderBottomColor: palette.border }}
                >
                  <View
                    className="h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: withAlpha(hue, done ? 0.22 : 0.1), borderWidth: 1, borderColor: withAlpha(hue, done ? 0.5 : 0.2) }}
                  >
                    <Icon name={done ? 'check' : 'target'} size={14} color={hue} />
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${quest.title}`}
                    onPress={() => router.push(`/quest/${quest.id}`)}
                    className="flex-1"
                    style={({ pressed }) => (pressed ? { opacity: 0.75 } : null)}
                  >
                    <AppText variant="bodyStrong" numberOfLines={1}>
                      {quest.title}
                    </AppText>
                    <HudLabel tone="faint" className="mt-0.5">
                      {CADENCE_MAP[quest.cadence].label.toUpperCase()} · {difficulty.label.toUpperCase()} · +
                      {state.settings.rules.xpByDifficulty[quest.difficulty]} XP
                    </HudLabel>
                  </Pressable>
                  {done ? (
                    <Badge label="DONE" tone="success" compact />
                  ) : (
                    <IconButton
                      icon="check"
                      label={`Complete ${quest.title}`}
                      size={32}
                      variant="secondary"
                      color={palette.textMuted}
                      onPress={() => toggleQuest(quest.id)}
                    />
                  )}
                </View>
              );
            })}
          </Card>
        ) : (
          <Card variant="ghost" className="items-center py-6">
            <Icon name={category.icon as IconName} size={22} color={palette.textFaint} />
            <AppText variant="bodyStrong" className="mt-2">
              No active quests here
            </AppText>
            <AppText variant="micro" tone="faint" className="mt-1 text-center">
              Add a small directive to start growing this tree.
            </AppText>
            <Button
              label="Add quest"
              icon="plus"
              size="sm"
              variant="secondary"
              className="mt-3"
              onPress={() => router.push(`/quest/new?category=${category.id}`)}
            />
          </Card>
        )}
      </View>

      <View className="mt-6">
        <HudLabel tone="muted" className="mb-2">
          RECENT SIGNALS
        </HudLabel>
        <Card padded={false} className="overflow-hidden px-4">
          {state.completions
            .filter((completion) => completion.categoryId === category.id)
            .slice()
            .sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1))
            .slice(0, 5)
            .map((completion) => (
              <View
                key={completion.id}
                className="flex-row items-center justify-between py-3"
                style={{ borderBottomWidth: 1, borderBottomColor: palette.border }}
              >
                <View className="flex-1">
                  <AppText variant="micro" tone="muted" numberOfLines={1}>
                    {completion.questTitle}
                  </AppText>
                  <HudLabel tone="faint" className="mt-0.5">
                    {formatDateKey(completion.date, 'short').toUpperCase()} · {relativeTime(completion.completedAt).toUpperCase()}
                  </HudLabel>
                </View>
                <AppText variant="monoStrong" style={{ color: hue }}>
                  +{formatNumber(completion.xp)} XP
                </AppText>
              </View>
            ))}
          {!state.completions.some((completion) => completion.categoryId === category.id) ? (
            <View className="items-center py-5">
              <AppText variant="micro" tone="faint">
                No signals logged yet.
              </AppText>
            </View>
          ) : null}
        </Card>
        {lastCompletion ? (
          <View className="mt-2 flex-row items-center gap-1.5">
            <Icon name="clock" size={11} color={palette.textFaint} />
            <AppText variant="micro" tone="faint">
              Last activity {relativeTime(lastCompletion.completedAt)}
            </AppText>
          </View>
        ) : null}
      </View>

      <View className="mt-5 flex-row gap-2">
        <Button label="All skills" icon="layers" variant="secondary" size="sm" className="flex-1" onPress={() => router.back()} />
        <Button label="Activity log" icon="clock" variant="ghost" size="sm" className="flex-1" onPress={() => router.push('/log')} />
      </View>
    </Screen>
  );
}
