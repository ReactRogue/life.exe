import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { withAlpha } from '@/theme/palette';
import {
  activeQuests,
  coinBalance,
  currentStreakOf,
  dailyGoalProgress,
  daySeries,
  equippedFrame,
  equippedTitle,
  nextTitleMilestone,
  profileLevel,
  recoveryStatus,
  todayDirectives,
  todayProgress,
  weeklyMissionSummary,
  weeklyProgress,
  weeklyStreakDays,
} from '@/domain/selectors';
import { formatDateKey, greetingForHour } from '@/domain/date';
import { DIFFICULTY_MAP } from '@/domain/constants';
import { formatNumber } from '@/lib/format';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { AppText, HudLabel } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { IconButton, LinkButton } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/icons/Icon';
import { QuestCard } from '@/components/quests/QuestCard';
import { AreaChart } from '@/components/charts/AreaChart';

export default function DeckScreen() {
  const router = useRouter();
  const { state, today, toggleQuest, seedStarter } = useAppStore();
  const { palette, isDark, setThemeMode } = useTheme();
  const rules = state.settings.rules;
  const level = profileLevel(state);
  const coins = coinBalance(state);
  const streak = currentStreakOf(state, today);
  const progress = todayProgress(state, today);
  const goal = dailyGoalProgress(state, today);
  const weekly = weeklyProgress(state, today);
  const missions = weeklyMissionSummary(state, today);
  const directives = todayDirectives(state, today);
  const series = daySeries(state, 7, today);
  const week = weeklyStreakDays(state, today);
  const recovery = recoveryStatus(state, today);
  const frame = equippedFrame(state);
  const title = equippedTitle(state);
  const active = activeQuests(state);
  const nextMilestone = nextTitleMilestone(level.level);
  const todayXp = series[series.length - 1]?.xp ?? 0;
  const todayDate = formatDateKey(today, 'long');
  const greeting = greetingForHour(new Date().getHours());

  return (
    <Screen>
      <View className="pt-2 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <HudLabel tone="accent">COMMAND DECK · {formatDateKey(today, 'short').toUpperCase()}</HudLabel>
          <AppText variant="h1" className="mt-1">
            {greeting}, {state.profile.name.split(' ')[0]}.
          </AppText>
          <AppText variant="caption" tone="muted" className="mt-1">
            {todayDate} · {progress.done}/{progress.total || 0} directives cleared
          </AppText>
        </View>
        <View className="flex-row items-center gap-2 pt-1">
          <IconButton
            icon={isDark ? 'moon' : 'sun'}
            label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
            variant="surface"
            onPress={() => setThemeMode(isDark ? 'light' : 'dark')}
          />
          <IconButton
            icon="settings"
            label="System rules"
            variant="surface"
            onPress={() => router.push('/rules')}
          />
        </View>
      </View>

      <Card hud glow padded={false} className="mt-5 overflow-hidden">
        <LinearGradient
          colors={[withAlpha(palette.gradient[0], isDark ? 0.14 : 0.09), 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.9, y: 0.7 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View className="p-5">
          <View className="flex-row items-center justify-between">
            <HudLabel tone="faint">OPERATOR PROFILE</HudLabel>
            <Badge label={`LEVEL ${level.level}`} tone="xp" icon="bolt" />
          </View>

          <View className="mt-4 flex-row items-center gap-4">
            <Avatar sigil={state.profile.sigil} frame={frame} size={86} progress={level.progress} />
            <View className="flex-1">
              <AppText variant="h2" numberOfLines={1}>
                {state.profile.name}
              </AppText>
              <View className="mt-1 flex-row items-center gap-1.5">
                <Icon name="star" size={11} color={palette.primaryText} />
                <HudLabel tone="accent">{title.uppercase}</HudLabel>
              </View>
              <View className="mt-2 flex-row flex-wrap items-center gap-1.5">
                <Badge label={`${streak.days}D STREAK`} tone="streak" icon="flame" compact />
                <Badge label={formatNumber(coins)} tone="coin" icon="coin" compact />
              </View>
            </View>
          </View>

          <View className="mt-5">
            <View className="mb-1.5 flex-row items-center justify-between">
              <HudLabel tone="muted">
                LEVEL {level.level} {level.level < 99 ? `→ ${level.level + 1}` : 'MAX'}
              </HudLabel>
              <AppText variant="micro" tone="faint">
                {formatNumber(level.into)} / {formatNumber(level.span)} XP
              </AppText>
            </View>
            <ProgressBar
              progress={level.progress}
              gradient={palette.gradient}
              height={9}
              accessibilityLabel={`Level ${level.level} progress: ${Math.round(level.progress * 100)} percent`}
            />
            <View className="mt-1.5 flex-row items-center justify-between">
              <AppText variant="micro" tone="faint">
                {formatNumber(level.totalXp)} lifetime XP
              </AppText>
              <AppText variant="micro" tone="faint">
                {nextMilestone
                  ? `Next title “${nextMilestone.label}” at LVL ${nextMilestone.level}`
                  : 'Maximum rank achieved'}
              </AppText>
            </View>
          </View>

          <View className="mt-5 flex-row items-stretch rounded-2xl border" style={{ borderColor: palette.border }}>
            <MiniStat label="TODAY" value={`+${formatNumber(todayXp)}`} sub="XP" accent />
            <View style={{ width: 1, backgroundColor: palette.border }} />
            <MiniStat label="DAILY GOAL" value={`${goal.done}/${goal.total}`} sub={goal.bonusClaimed ? 'bonus claimed' : 'to bonus'} />
            <View style={{ width: 1, backgroundColor: palette.border }} />
            <MiniStat label="WEEKLY" value={`${weekly.done}/${weekly.total}`} sub="missions" />
          </View>
        </View>
      </Card>

      {recovery.shouldShow ? (
        <Card variant="accent" className="mt-4 flex-row items-start gap-3">
          <View
            className="h-10 w-10 items-center justify-center rounded-xl border"
            style={{ borderColor: palette.primaryBorder, backgroundColor: palette.primarySoft }}
          >
            <Icon name="refresh" size={18} color={palette.primaryText} />
          </View>
          <View className="flex-1">
            <HudLabel tone="accent">RESUME PROTOCOL</HudLabel>
            <AppText variant="bodyStrong" className="mt-1">
              {recovery.idleDays <= 1 ? 'Welcome back.' : 'No streaks were shamed in the making of this app.'}
            </AppText>
            <AppText variant="micro" tone="muted" className="mt-1">
              {recovery.message}
            </AppText>
            <View className="mt-2.5 flex-row items-center gap-2">
              <LinkButton
                label="Pick a restart quest"
                onPress={() => router.push('/quest/new?preset=recovery')}
              />
              <HudLabel tone="faint">
                {recovery.idleDays > 0 ? `${recovery.idleDays} DAYS IDLE` : 'FRESH START'}
              </HudLabel>
            </View>
          </View>
        </Card>
      ) : null}

      <View className="mt-7">
        <SectionHeader
          eyebrow="TODAY'S DIRECTIVES"
          title="What matters now"
          subtitle={
            progress.total
              ? `${progress.done} of ${progress.total} cleared · ${goal.total - goal.done > 0 ? `${goal.total - goal.done} to daily bonus` : 'daily bonus secured'}`
              : 'No daily quests scheduled for today'
          }
          actionLabel={active.length ? 'View all' : undefined}
          onAction={() => router.push('/quests')}
        />

        {directives.length ? (
          <View>
            {directives.slice(0, 5).map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                compact
                onOpen={() => router.push(`/quest/${quest.id}`)}
              />
            ))}
            {directives.length > 5 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="View all daily quests"
                onPress={() => router.push('/quests')}
                className="mt-1 self-start"
              >
                <HudLabel tone="accent">+{directives.length - 5} MORE DIRECTIVES →</HudLabel>
              </Pressable>
            ) : null}
            {progress.done === progress.total && progress.total > 0 ? (
              <View
                className="mt-1 flex-row items-center gap-2 rounded-xl border px-3 py-2.5"
                style={{ borderColor: palette.primaryBorder, backgroundColor: palette.primarySoft }}
              >
                <Icon name="spark" size={14} color={palette.primaryText} filled />
                <AppText variant="micro" style={{ color: palette.primaryText }}>
                  All directives cleared. Systems nominal.
                </AppText>
              </View>
            ) : null}
          </View>
        ) : active.length ? (
          <Card variant="ghost" className="items-center py-6">
            <HudLabel tone="faint">REST CYCLE</HudLabel>
            <AppText variant="bodyStrong" className="mt-1">
              Nothing scheduled today
            </AppText>
            <AppText variant="micro" tone="muted" className="mt-1 text-center">
              Your dailies have a custom schedule. Enjoy the quiet — or add something small.
            </AppText>
            <LinkButton
              label="Add a quest"
              icon="plus"
              onPress={() => router.push('/quest/new')}
              className="mt-2"
            />
          </Card>
        ) : (
          <EmptyState
            icon="orbit"
            eyebrow="EMPTY DECK"
            title="Your board is quiet"
            description="Load the starter protocol for a gentle first week, or design your own directives."
            actionLabel="Load starter protocol"
            onAction={seedStarter}
            secondaryLabel="Create a quest"
            onSecondary={() => router.push('/quest/new')}
          />
        )}
      </View>

      <View className="mt-7">
        <SectionHeader
          eyebrow="WEEKLY OPS"
          title="This week’s missions"
          subtitle={`${weekly.done} of ${weekly.total} complete${weekly.total ? '' : ' · add a weekly mission'}`}
          actionLabel="Board"
          onAction={() => router.push('/quests')}
        />
        {missions.length ? (
          <Card padded={false} className="overflow-hidden">
            {missions.map((mission, index) => {
              const difficulty = DIFFICULTY_MAP[mission.quest.difficulty];
              const xp = rules.xpByDifficulty[mission.quest.difficulty] + rules.weeklyBonusXp;
              return (
                <Pressable
                  key={mission.quest.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${mission.quest.title}. ${mission.done ? 'Completed this week' : 'Incomplete'}`}
                  onPress={() => toggleQuest(mission.quest.id)}
                  accessibilityHint={mission.done ? 'Marks the mission incomplete' : 'Completes the mission'}
                  className="flex-row items-center gap-3 px-4 py-3.5"
                  style={({ pressed }) => [
                    index > 0 ? { borderTopWidth: 1, borderTopColor: palette.border } : null,
                    pressed ? { opacity: 0.75 } : null,
                  ]}
                >
                  <View
                    className="h-6 w-6 items-center justify-center rounded-lg border"
                    style={{
                      borderColor: mission.done ? palette.primary : palette.borderStrong,
                      backgroundColor: mission.done ? palette.primary : 'transparent',
                    }}
                  >
                    {mission.done ? (
                      <Icon name="check" size={13} color={palette.onPrimary} strokeWidth={3} />
                    ) : null}
                  </View>
                  <View className="flex-1">
                    <AppText
                      variant="bodyStrong"
                      numberOfLines={1}
                      style={{ color: mission.done ? palette.textMuted : palette.text }}
                    >
                      {mission.quest.title}
                    </AppText>
                    <HudLabel tone="faint" className="mt-0.5">
                      {difficulty.label.toUpperCase()} · +{formatNumber(xp)} XP
                      {mission.done ? ' · LOGGED' : ''}
                    </HudLabel>
                  </View>
                  <Icon name={mission.done ? 'check' : 'chevronRight'} size={15} color={mission.done ? palette.primaryText : palette.textFaint} />
                </Pressable>
              );
            })}
          </Card>
        ) : (
          <EmptyState
            compact
            icon="calendar"
            eyebrow="NO WEEKLY OPS"
            title="A week needs one big win"
            description="Weekly missions carry bonus XP and a longer horizon."
            actionLabel="Add weekly mission"
            onAction={() => router.push('/quest/new?cadence=weekly')}
          />
        )}
      </View>

      <View className="mt-7">
        <SectionHeader eyebrow="SIGNAL READOUT" title="Momentum" actionLabel="Stats" onAction={() => router.push('/stats')} />
        <Card>
          <View className="flex-row gap-4">
            <View className="flex-1">
              <HudLabel tone="faint">CURRENT STREAK</HudLabel>
              <View className="mt-1 flex-row items-baseline gap-1.5">
                <AppText variant="numberLarge" tone="accent">
                  {streak.days}
                </AppText>
                <AppText variant="caption" tone="muted">
                  days
                </AppText>
              </View>
              <View className="mt-2 flex-row items-center gap-1">
                {week.map((day) => (
                  <View
                    key={day.date}
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 3,
                      backgroundColor:
                        day.count > 0
                          ? palette.primary
                          : day.date === today
                            ? palette.primaryBorder
                            : palette.skeleton,
                    }}
                  />
                ))}
              </View>
              <AppText variant="micro" tone="faint" className="mt-2">
                {streak.graceUsed > 0
                  ? `${streak.graceUsed} grace day${streak.graceUsed === 1 ? '' : 's'} used · still running`
                  : rules.graceDays > 0
                    ? `${rules.graceDays} grace day shield ready`
                    : 'No shield configured'}
              </AppText>
            </View>
            <View style={{ width: 1, backgroundColor: palette.border }} />
            <View className="flex-1">
              <HudLabel tone="faint">7-DAY OUTPUT</HudLabel>
              <View className="mt-1 flex-row items-baseline gap-1.5">
                <AppText variant="numberLarge" tone="accent">
                  {formatNumber(series.reduce((sum, day) => sum + day.xp, 0))}
                </AppText>
                <AppText variant="caption" tone="muted">
                  XP
                </AppText>
              </View>
              <View className="mt-1">
                <AreaChart
                  points={series.map((day) => ({ date: day.date, value: day.xp }))}
                  height={58}
                  showAxis={false}
                />
              </View>
            </View>
          </View>
        </Card>
      </View>

      <View className="mt-6 flex-row items-center justify-center gap-1.5">
        <Icon name="hex" size={11} color={palette.textFaint} />
        <HudLabel tone="faint">
          {isDark ? 'NIGHT CONSOLE' : 'DAYLIGHT HUD'} · SAVE {state.meta.updatedAt.slice(0, 10).replace(/-/g, '.')}
        </HudLabel>
      </View>
    </Screen>
  );
}

function MiniStat({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <View className="flex-1 px-3 py-2.5">
      <HudLabel tone="faint" numberOfLines={1}>
        {label}
      </HudLabel>
      <AppText variant="number" tone={accent ? 'accent' : 'default'} className="mt-0.5" numberOfLines={1}>
        {value}
      </AppText>
      <AppText variant="micro" tone="faint" numberOfLines={1} style={{ color: palette.textFaint }}>
        {sub}
      </AppText>
    </View>
  );
}
