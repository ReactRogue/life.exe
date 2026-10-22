import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { hueFor } from '@/theme/palette';
import {
  activeQuests,
  activityEntries,
  categoryStats,
  currentStreakOf,
  heatmapData,
  longestStreakOf,
  rangeSummary,
  todayProgress,
  weeklyStreakDays,
} from '@/domain/selectors';
import { formatDateKey } from '@/domain/date';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { AppText, HudLabel } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Button, LinkButton } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatTile } from '@/components/ui/StatTile';
import { Heatmap } from '@/components/charts/Heatmap';
import { AreaChart } from '@/components/charts/AreaChart';
import { WeeklyBars } from '@/components/charts/WeeklyBars';
import { CategoryBars } from '@/components/charts/CategoryBars';
import { ActivityRow } from '@/components/profile/ActivityRow';
import { Icon } from '@/components/icons/Icon';
import { formatNumber, percent } from '@/lib/format';

type Range = '7' | '30' | '90';

export default function StatsScreen() {
  const router = useRouter();
  const { state, today, seedStarter } = useAppStore();
  const { palette, isDark } = useTheme();
  const [range, setRange] = useState<Range>('7');
  const [selectedDay, setSelectedDay] = useState<string>(today);

  const days = Number(range);
  const summary = rangeSummary(state, days, today);
  const streak = currentStreakOf(state, today);
  const best = longestStreakOf(state);
  const categories = categoryStats(state);
  const heat = heatmapData(state, today, 13);
  const week = weeklyStreakDays(state, today);
  const entries = activityEntries(state, 80).slice(0, 6);
  const progress = todayProgress(state, today);
  const totalCompletions = state.completions.filter((entry) => entry.source !== 'bonus').length;
  const selected = week.find((day) => day.date === selectedDay) ?? week[week.length - 1];

  return (
    <Screen>
      <View className="pt-2 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <HudLabel tone="accent">TELEMETRY</HudLabel>
          <AppText variant="h1" className="mt-1">
            Progress
          </AppText>
          <AppText variant="caption" tone="muted" className="mt-1">
            {formatNumber(totalCompletions)} logs · {formatNumber(heat.totalXp)} XP in 90 days
          </AppText>
        </View>
        <Badge label="LOCAL DATA" tone="level" icon="signal" className="mt-1" />
      </View>

      <View className="mt-5">
        <SegmentedControl
          label="Time range"
          value={range}
          options={[
            { value: '7', label: '7 days' },
            { value: '30', label: '30 days' },
            { value: '90', label: '90 days' },
          ]}
          onChange={(value) => setRange(value)}
        />
      </View>

      {totalCompletions === 0 ? (
        <View className="mt-6">
          <EmptyState
            icon="signal"
            eyebrow="NO TELEMETRY"
            title="The instruments are ready"
            description="Complete a quest and this page fills itself: XP curves, skill levels, a streak calendar, and a full activity log."
            actionLabel={activeQuests(state).length ? 'Open mission board' : 'Load starter protocol'}
            onAction={() => (activeQuests(state).length ? router.push('/quests') : seedStarter())}
            secondaryLabel={activeQuests(state).length ? undefined : 'Create a quest'}
            onSecondary={() => router.push('/quest/new')}
          />
          <Card className="mt-4">
            <HudLabel tone="faint">INSTRUMENT CHECK</HudLabel>
            <View className="mt-3 gap-3">
              {[
                { icon: 'stats' as const, label: 'XP output curves', hint: 'Daily and weekly output' },
                { icon: 'grid' as const, label: 'Streak calendar', hint: 'A 13-week heat map' },
                { icon: 'clock' as const, label: 'Activity log', hint: 'Every completed quest, timed' },
              ].map((item) => (
                <View key={item.label} className="flex-row items-center gap-3">
                  <View
                    className="h-9 w-9 items-center justify-center rounded-xl border"
                    style={{ borderColor: palette.border, backgroundColor: palette.surfaceAlt }}
                  >
                    <Icon name={item.icon} size={16} color={palette.textMuted} />
                  </View>
                  <View className="flex-1">
                    <AppText variant="bodyStrong">{item.label}</AppText>
                    <AppText variant="micro" tone="faint">
                      {item.hint}
                    </AppText>
                  </View>
                  <HudLabel tone="faint">OFFLINE</HudLabel>
                </View>
              ))}
            </View>
          </Card>
        </View>
      ) : (
        <>
          <View className="mt-4 gap-2.5">
            <View className="flex-row gap-2.5">
              <StatTile
                className="flex-1"
                label={`XP · ${range}D`}
                value={formatNumber(summary.totalXp)}
                hint={`${formatNumber(summary.averageXp)} avg / day`}
                icon="bolt"
              />
              <StatTile
                className="flex-1"
                label="ACTIVE DAYS"
                value={`${summary.activeDays}/${days}`}
                hint={percent(summary.consistency)}
                icon="calendar"
              />
            </View>
            <View className="flex-row gap-2.5">
              <StatTile
                className="flex-1"
                label="CURRENT STREAK"
                value={`${streak.days}d`}
                hint={`${streak.graceUsed} grace used`}
                icon="flame"
                color={isDark ? '#FFB27A' : '#A8401B'}
              />
              <StatTile
                className="flex-1"
                label="BEST STREAK"
                value={`${best}d`}
                hint={summary.bestDay ? `Peak ${formatNumber(summary.bestDay.xp)} XP` : 'No peak yet'}
                icon="trophy"
                color={palette.coin}
              />
            </View>
          </View>

          <Card className="mt-4">
            <View className="flex-row items-start justify-between">
              <View>
                <HudLabel tone="faint">XP OUTPUT · LAST {days} DAYS</HudLabel>
                <View className="mt-1 flex-row items-baseline gap-1.5">
                  <AppText variant="number">{formatNumber(summary.totalXp)}</AppText>
                  <AppText variant="caption" tone="faint">
                    XP
                  </AppText>
                </View>
              </View>
              <Badge label={`${summary.completions} QUESTS`} tone="xp" compact />
            </View>
            <View className="mt-3">
              <AreaChart
                points={summary.series.map((point) => ({ date: point.date, value: point.xp }))}
                height={172}
              />
            </View>
            <View className="mt-2 flex-row items-center justify-between">
              <HudLabel tone="faint">AVG {formatNumber(summary.averageXp)} XP / DAY</HudLabel>
              <HudLabel tone="faint">
                BEST {summary.bestDay ? `${formatDateKey(summary.bestDay.date, 'short').toUpperCase()} · ${formatNumber(summary.bestDay.xp)} XP` : '—'}
              </HudLabel>
            </View>
          </Card>

          <View className="mt-6">
            <SectionHeader eyebrow="WEEK VIEW" title="Rhythm check" subtitle="Tap a bar to inspect the day." />
            <Card>
              <View className="flex-row items-center justify-between">
                <View>
                  <HudLabel tone="faint">THIS WEEK</HudLabel>
                  <AppText variant="number" className="mt-1">
                    {formatNumber(week.reduce((sum, day) => sum + day.xp, 0))}
                    <AppText variant="caption" tone="faint">
                      {' '}XP
                    </AppText>
                  </AppText>
                </View>
                <Badge
                  label={`${week.filter((day) => day.count > 0).length} ACTIVE DAYS`}
                  tone="success"
                  compact
                />
              </View>
              <View className="mt-4">
                <WeeklyBars
                  data={week.map((day) => ({
                    date: day.date,
                    value: day.xp,
                    count: day.count,
                    isToday: day.date === today,
                  }))}
                  selectedDate={selected?.date}
                  onSelect={(date) => setSelectedDay(date)}
                />
              </View>
              {selected ? (
                <View
                  className="mt-3 flex-row items-center justify-between rounded-xl border px-3 py-2.5"
                  style={{ borderColor: palette.border, backgroundColor: palette.surfaceAlt }}
                >
                  <View>
                    <AppText variant="caption" className="font-sans-medium">
                      {formatDateKey(selected.date, 'long')}
                    </AppText>
                    <AppText variant="micro" tone="faint">
                      {selected.count} {selected.count === 1 ? 'quest' : 'quests'} · {formatNumber(selected.xp)} XP
                    </AppText>
                  </View>
                  <HudLabel tone={selected.date === today ? 'accent' : 'faint'}>
                    {selected.date === today ? 'TODAY' : 'LOGGED'}
                  </HudLabel>
                </View>
              ) : null}
            </Card>
          </View>

          <View className="mt-6">
            <SectionHeader
              eyebrow="SKILL MATRIX"
              title="Where the XP lands"
              subtitle="Lifetime XP per skill tree."
              actionLabel="Character"
              onAction={() => router.push('/profile')}
            />
            <Card>
              <CategoryBars
                items={categories.map((stat) => ({
                  id: stat.category.id,
                  name: stat.category.name,
                  xp: stat.xp,
                  level: stat.level.level,
                  color: hueFor(stat.category.hue, palette.mode),
                }))}
              />
              <View className="mt-4 flex-row items-center gap-2">
                <Icon name="info" size={13} color={palette.textFaint} />
                <AppText variant="micro" tone="faint">
                  Skill levels use the same curve as your character. Each tree levels independently.
                </AppText>
              </View>
            </Card>
          </View>

          <View className="mt-6">
            <SectionHeader
              eyebrow="STREAK CALENDAR"
              title="Momentum map"
              subtitle={`${heat.activeDays} active days · ${formatNumber(heat.totalXp)} XP logged`}
            />
            <Card>
              <Heatmap data={heat} />
              <View className="mt-4 flex-row items-start gap-2">
                <Icon name="shield" size={13} color={palette.primaryText} />
                <AppText variant="micro" tone="faint" className="flex-1">
                  Quiet squares are not failures. With {state.settings.rules.graceDays} grace day
                  {state.settings.rules.graceDays === 1 ? '' : 's'}, a missed day stays inside the
                  streak instead of resetting it. Editable in system rules.
                </AppText>
              </View>
            </Card>
          </View>

          <View className="mt-6">
            <SectionHeader
              eyebrow="ACTIVITY LOG"
              title="Recent XP events"
              actionLabel="Full log"
              onAction={() => router.push('/log')}
            />
            <Card padded={false} className="overflow-hidden">
              {entries.map((entry, index) => (
                <View
                  key={entry.id}
                  className="px-4"
                  style={index > 0 ? { borderTopWidth: 1, borderTopColor: palette.border } : null}
                >
                  <ActivityRow entry={entry} />
                </View>
              ))}
              {entries.length === 0 ? (
                <View className="items-center py-6">
                  <AppText variant="caption" tone="faint">
                    No XP events in this range.
                  </AppText>
                </View>
              ) : null}
            </Card>
          </View>

          <View className="mt-6 flex-row items-center justify-center gap-1.5">
            <Icon name="info" size={11} color={palette.textFaint} />
            <HudLabel tone="faint">
              {progress.done}/{progress.total} DIRECTIVES TODAY · AUTO-SAVED
            </HudLabel>
          </View>
        </>
      )}
    </Screen>
  );
}
