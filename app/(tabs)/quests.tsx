import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { hueFor } from '@/theme/palette';
import {
  activeQuests,
  currentStreakOf,
  dailyGoalProgress,
  isScheduledOn,
  weeklyMissionSummary,
  weeklyProgress,
} from '@/domain/selectors';
import { CADENCE_MAP } from '@/domain/constants';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { AppText, HudLabel } from '@/components/ui/Text';
import { Button, IconButton, LinkButton } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/Field';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { QuestCard } from '@/components/quests/QuestCard';
import { HabitCard } from '@/components/quests/HabitCard';
import { Icon } from '@/components/icons/Icon';
import { formatNumber } from '@/lib/format';
import type { Quest } from '@/domain/types';

type Segment = 'today' | 'week' | 'all' | 'habits';

const SEGMENTS: { value: Segment; label: string; icon: 'calendar' | 'stats' | 'layers' | 'refresh' }[] = [
  { value: 'today', label: 'Today', icon: 'calendar' },
  { value: 'week', label: 'Week', icon: 'stats' },
  { value: 'all', label: 'All', icon: 'layers' },
  { value: 'habits', label: 'Habits', icon: 'refresh' },
];

export default function QuestsScreen() {
  const router = useRouter();
  const { state, today, seedStarter, restoreQuest } = useAppStore();
  const { palette, isDark } = useTheme();
  const [segment, setSegment] = useState<Segment>('today');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const quests = activeQuests(state);
  const archived = state.quests
    .filter((quest) => quest.archivedAt)
    .sort((a, b) => (a.archivedAt ?? '') < (b.archivedAt ?? '') ? 1 : -1);
  const filtered = quests.filter(
    (quest) => categoryFilter === 'all' || quest.categoryId === categoryFilter,
  );
  const dailies = filtered.filter((quest) => quest.cadence === 'daily');
  const todaysDailies = dailies.filter((quest) => isScheduledOn(quest, today));
  const weeklies = filtered.filter((quest) => quest.cadence === 'weekly');
  const once = filtered.filter((quest) => quest.cadence === 'once');
  const weeklyMissions = weeklyMissionSummary(state, today);
  const goal = dailyGoalProgress(state, today);
  const weekly = weeklyProgress(state, today);
  const streak = currentStreakOf(state, today);

  const open = (quest: Quest) => router.push(`/quest/${quest.id}`);

  const counts = useMemo(
    () => ({
      today: todaysDailies.length + weeklies.filter((quest) => !weeklyMissions.find((m) => m.quest.id === quest.id)?.done).length,
      week: weeklies.length,
      all: quests.length,
      habits: dailies.length,
    }),
    [dailies.length, quests.length, todaysDailies.length, weeklies, weeklyMissions],
  );

  return (
    <Screen>
      <View className="pt-2 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <HudLabel tone="accent">MISSION BOARD</HudLabel>
          <AppText variant="h1" className="mt-1">
            Quests
          </AppText>
          <AppText variant="caption" tone="muted" className="mt-1">
            {quests.length} active · {archived.length} archived · {streak.days} day streak
          </AppText>
        </View>
        <IconButton
          icon="plus"
          label="Create a quest"
          variant="primary"
          onPress={() => router.push('/quest/new')}
          className="mt-1"
        />
      </View>

      <View className="mt-5">
        <SegmentedControl
          label="Quest view"
          value={segment}
          options={SEGMENTS}
          onChange={(value) => setSegment(value)}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-3 -mx-5"
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      >
        <Chip
          label="All skills"
          selected={categoryFilter === 'all'}
          onPress={() => setCategoryFilter('all')}
        />
        {state.categories.map((category) => (
          <Chip
            key={category.id}
            label={category.name}
            color={hueFor(category.hue, palette.mode)}
            selected={categoryFilter === category.id}
            onPress={() => setCategoryFilter(category.id)}
          />
        ))}
      </ScrollView>

      {segment === 'today' ? (
        <View className="mt-5">
          <Card className="mb-4">
            <View className="flex-row items-center justify-between">
              <HudLabel tone="faint">DAILY GOAL</HudLabel>
              <AppText variant="micro" tone={goal.bonusClaimed ? 'success' : 'faint'}>
                {goal.bonusClaimed ? 'BONUS CLAIMED' : `${goal.done} / ${goal.total}`}
              </AppText>
            </View>
            <ProgressBar
              progress={goal.ratio}
              gradient={palette.gradient}
              height={6}
              className="mt-2"
              accessibilityLabel={`Daily goal: ${goal.done} of ${goal.total}`}
            />
            <View className="mt-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <Icon name="flame" size={13} color={palette.mode === 'dark' ? '#FFB27A' : '#A8401B'} filled />
                <AppText variant="micro" tone="muted">
                  {streak.days} day streak
                </AppText>
              </View>
              <AppText variant="micro" tone="faint">
                {goal.total - goal.done > 0
                  ? `${goal.total - goal.done} more for +${state.settings.rules.dailyGoalBonusXp} XP`
                  : 'Daily goal secured'}
              </AppText>
            </View>
          </Card>

          {todaysDailies.length ? (
            <View>
              <GroupLabel label="TODAY’S DIRECTIVES" count={todaysDailies.length} />
              {todaysDailies.map((quest) => (
                <QuestCard key={quest.id} quest={quest} onOpen={() => open(quest)} />
              ))}
            </View>
          ) : null}

          {weeklies.length ? (
            <View className="mt-4">
              <GroupLabel label="WEEKLY MISSIONS" count={weeklies.length} />
              {weeklies.map((quest) => (
                <QuestCard key={quest.id} quest={quest} onOpen={() => open(quest)} />
              ))}
            </View>
          ) : null}

          {once.length ? (
            <View className="mt-4">
              <GroupLabel label="ONE-OFF MISSIONS" count={once.length} />
              {once.map((quest) => (
                <QuestCard key={quest.id} quest={quest} onOpen={() => open(quest)} />
              ))}
            </View>
          ) : null}

          {!quests.length ? (
            <EmptyState
              eyebrow="NO SIGNAL"
              title="The board is empty"
              description="Load a starter protocol or write your first quest. Two minutes is enough to begin."
              actionLabel="Load starter protocol"
              onAction={seedStarter}
              secondaryLabel="New quest"
              onSecondary={() => router.push('/quest/new')}
            />
          ) : !todaysDailies.length && !weeklies.length && !once.length && categoryFilter !== 'all' ? (
            <EmptyState
              compact
              icon="filter"
              eyebrow="FILTERED"
              title="Nothing in this skill yet"
              description="Add a quest to this skill, or switch filters to see the rest of your board."
              actionLabel="Add quest"
              onAction={() => router.push('/quest/new')}
            />
          ) : null}
        </View>
      ) : null}

      {segment === 'week' ? (
        <View className="mt-5">
          <Card className="mb-4">
            <View className="flex-row items-center justify-between">
              <View>
                <HudLabel tone="faint">WEEKLY OPS PROGRESS</HudLabel>
                <AppText variant="number" className="mt-1">
                  {weekly.done}
                  <AppText variant="caption" tone="faint">
                    {' '}/ {weekly.total}
                  </AppText>
                </AppText>
              </View>
              <View className="items-end">
                <HudLabel tone="faint">BONUS REWARD</HudLabel>
                <AppText variant="monoStrong" tone="coin" className="mt-1">
                  +{formatNumber(state.settings.rules.weeklyBonusXp)} XP · {state.settings.rules.weeklyBonusCoins} COINS
                </AppText>
              </View>
            </View>
            <ProgressBar progress={weekly.ratio} gradient={palette.gradient} height={6} className="mt-3" />
          </Card>

          {weeklies.length ? (
            <View>
              {weeklies.map((quest) => (
                <QuestCard key={quest.id} quest={quest} onOpen={() => open(quest)} />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="calendar"
              eyebrow="NO WEEKLY OPS"
              title="Give the week a spine"
              description="One weekly mission with a bigger reward gives the week a clear win."
              actionLabel="Add weekly mission"
              onAction={() => router.push('/quest/new?cadence=weekly')}
            />
          )}

          <NewCadenceNote />
        </View>
      ) : null}

      {segment === 'all' ? (
        <View className="mt-5">
          {quests.length ? (
            <>
              {dailies.length ? (
                <View>
                  <GroupLabel label="DAILY RITUALS" count={dailies.length} />
                  {dailies.map((quest) => (
                    <QuestCard key={quest.id} quest={quest} onOpen={() => open(quest)} />
                  ))}
                </View>
              ) : null}
              {weeklies.length ? (
                <View className="mt-4">
                  <GroupLabel label="WEEKLY OPS" count={weeklies.length} />
                  {weeklies.map((quest) => (
                    <QuestCard key={quest.id} quest={quest} onOpen={() => open(quest)} />
                  ))}
                </View>
              ) : null}
              {once.length ? (
                <View className="mt-4">
                  <GroupLabel label="ONE-OFF MISSIONS" count={once.length} />
                  {once.map((quest) => (
                    <QuestCard key={quest.id} quest={quest} onOpen={() => open(quest)} />
                  ))}
                </View>
              ) : null}
            </>
          ) : (
            <EmptyState
              eyebrow="EMPTY BOARD"
              title="No quests yet"
              description="Start with a starter protocol, then tune it. A quest can be tiny — micro counts."
              actionLabel="Load starter protocol"
              onAction={seedStarter}
              secondaryLabel="Write my own"
              onSecondary={() => router.push('/quest/new')}
            />
          )}

          {archived.length ? (
            <View className="mt-7">
              <SectionHeader
                eyebrow="ARCHIVE"
                title="Retired quests"
                subtitle="History is preserved even when a quest is archived."
              />
              <Card padded={false} className="overflow-hidden">
                {archived.map((quest, index) => (
                  <View
                    key={quest.id}
                    className="flex-row items-center gap-3 px-4 py-3"
                    style={index > 0 ? { borderTopWidth: 1, borderTopColor: palette.border } : null}
                  >
                    <Icon name="archive" size={16} color={palette.textFaint} />
                    <View className="flex-1">
                      <AppText variant="body" tone="muted" numberOfLines={1}>
                        {quest.title}
                      </AppText>
                      <HudLabel tone="faint">{CADENCE_MAP[quest.cadence].label.toUpperCase()}</HudLabel>
                    </View>
                    <LinkButton label="Restore" icon="refresh" onPress={() => restoreQuest(quest.id)} />
                  </View>
                ))}
              </Card>
            </View>
          ) : null}
        </View>
      ) : null}

      {segment === 'habits' ? (
        <View className="mt-5">
          <View
            className="mb-4 flex-row items-start gap-2.5 rounded-2xl border p-3.5"
            style={{ borderColor: palette.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF' }}
          >
            <Icon name="refresh" size={16} color={palette.primaryText} />
            <AppText variant="micro" tone="muted" className="flex-1">
              Habits are daily quests with a seven-day rhythm. Missed a day? A grace shield keeps the
              streak alive, and you can backfill yesterday from its strip.
            </AppText>
          </View>

          {dailies.length ? (
            dailies.map((quest) => (
              <HabitCard key={quest.id} quest={quest} onOpen={() => open(quest)} />
            ))
          ) : (
            <EmptyState
              icon="refresh"
              eyebrow="NO HABITS"
              title="Build one small ritual"
              description="A habit is a daily quest you repeat. Start small enough that a bad day can still clear it."
              actionLabel="Create a habit"
              onAction={() => router.push('/quest/new?cadence=daily')}
            />
          )}
        </View>
      ) : null}

      {segment === 'today' ? null : (
        <View className="mt-6 flex-row items-center justify-center gap-1.5">
          <Icon name="signal" size={12} color={palette.textFaint} />
          <HudLabel tone="faint">{counts[segment]} IN THIS VIEW</HudLabel>
        </View>
      )}
    </Screen>
  );
}

function GroupLabel({ label, count }: { label: string; count: number }) {
  const { palette } = useTheme();
  return (
    <View className="mb-2 flex-row items-center justify-between">
      <HudLabel tone="muted">{label}</HudLabel>
      <View className="flex-1 ml-3 h-px" style={{ backgroundColor: palette.border }} />
      <HudLabel tone="faint" className="ml-3">
        {count.toString().padStart(2, '0')}
      </HudLabel>
    </View>
  );
}

function NewCadenceNote() {
  const router = useRouter();
  const { palette } = useTheme();
  return (
    <View className="mt-4 flex-row items-center justify-between rounded-2xl border px-4 py-3" style={{ borderColor: palette.border }}>
      <AppText variant="micro" tone="muted" className="flex-1">
        Need a one-off mission instead?
      </AppText>
      <Button
        label="One-off"
        variant="ghost"
        size="sm"
        iconRight="arrowUpRight"
        onPress={() => router.push('/quest/new?cadence=once')}
        style={{ marginRight: -8 }}
      />
    </View>
  );
}
