import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { hueFor, withAlpha } from '@/theme/palette';
import {
  activeQuests,
  activityEntries,
  currentStreakOf,
  isQuestDoneForPeriod,
  questStats,
} from '@/domain/selectors';
import { CADENCE_MAP, DIFFICULTY_MAP, WEEKDAY_NAMES } from '@/domain/constants';
import { awardForQuest } from '@/domain/xp';
import { backfillableDates } from '@/domain/engine';
import { formatDateKey, relativeDayLabel } from '@/domain/date';
import type { IconName } from '@/components/icons/Icon';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { AppText, HudLabel } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton, LinkButton } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { StatTile } from '@/components/ui/StatTile';
import { ActivityRow } from '@/components/profile/ActivityRow';
import { Icon } from '@/components/icons/Icon';
import { formatNumber } from '@/lib/format';

export default function QuestDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, today, toggleQuest, completeQuest, archiveQuest, restoreQuest, deleteQuest } = useAppStore();
  const { palette, isDark } = useTheme();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const quest = state.quests.find((entry) => entry.id === id);
  if (!quest) {
    return (
      <Screen scroll={false}>
        <View className="flex-1 items-center justify-center">
          <Icon name="info" size={32} color={palette.primaryText} />
          <AppText variant="h2" className="mt-4" align="center">
            Quest not found
          </AppText>
          <AppText variant="caption" tone="muted" align="center" className="mt-2">
            It may have been deleted. Your XP history is safe.
          </AppText>
          <Button label="Go back" onPress={() => router.back()} className="mt-5" />
        </View>
      </Screen>
    );
  }

  const category = state.categories.find((entry) => entry.id === quest.categoryId);
  const hue = hueFor(category?.hue ?? 'discipline', palette.mode);
  const difficulty = DIFFICULTY_MAP[quest.difficulty];
  const cadence = CADENCE_MAP[quest.cadence];
  const stats = questStats(state, quest, today);
  const streak = currentStreakOf(state, today);
  const award = awardForQuest(quest, state.settings.rules, Math.max(1, streak.days + (streak.activeToday ? 0 : 1)));
  const weeklyXp = quest.cadence === 'weekly' ? state.settings.rules.weeklyBonusXp : 0;
  const weeklyCoins = quest.cadence === 'weekly' ? state.settings.rules.weeklyBonusCoins : 0;
  const doneNow = isQuestDoneForPeriod(quest, state.completions, today, state.settings.rules.weekStart);
  const backfills = quest.archivedAt ? [] : backfillableDates(state, quest.id, today);
  const recent = activityEntries(state, 500).filter((entry) => entry.questId === quest.id).slice(0, 6);
  const scheduleText =
    quest.cadence === 'daily'
      ? !quest.daysOfWeek || quest.daysOfWeek.length === 0 || quest.daysOfWeek.length === 7
        ? 'Every day'
        : quest.daysOfWeek
            .slice()
            .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
            .map((day) => WEEKDAY_NAMES[day].slice(0, 3))
            .join(' · ')
      : quest.cadence === 'weekly'
        ? 'Once per week'
        : 'One-off mission';

  const completeLabel = doneNow
    ? quest.cadence === 'weekly'
      ? 'Undo this week’s log'
      : quest.cadence === 'once'
        ? 'Undo completion'
        : 'Undo today’s log'
    : `Complete quest · +${formatNumber(award.xp + weeklyXp)} XP`;

  return (
    <Screen>
      <View className="pt-1 flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <HudLabel tone="accent">{CADENCE_MAP[quest.cadence].label.toUpperCase()} MISSION</HudLabel>
          <AppText variant="h2" className="mt-1" numberOfLines={2}>
            Mission file
          </AppText>
        </View>
        <View className="flex-row gap-2">
          <IconButton
            icon="edit"
            label="Edit quest"
            variant="surface"
            onPress={() => router.push(`/quest/new?id=${quest.id}`)}
          />
          <IconButton
            icon="close"
            label="Close quest"
            variant="surface"
            onPress={() => router.back()}
          />
        </View>
      </View>

      <Card hud className="mt-5">
        <View className="flex-row items-center gap-2">
          <View
            className="flex-row items-center gap-1.5 rounded-full border px-2.5 py-1"
            style={{ borderColor: withAlpha(hue, 0.35), backgroundColor: withAlpha(hue, 0.12) }}
          >
            <Icon name={(category?.icon ?? 'target') as IconName} size={12} color={hue} />
            <HudLabel style={{ color: hue }}>{category?.name.toUpperCase() ?? 'GENERAL'}</HudLabel>
          </View>
          <Badge label={difficulty.label.toUpperCase()} tone="level" compact />
          <Badge label={cadence.label.toUpperCase()} tone="neutral" compact />
          {quest.archivedAt ? <Badge label="ARCHIVED" tone="danger" compact /> : null}
        </View>

        <AppText variant="h1" className="mt-3">
          {quest.title}
        </AppText>
        {quest.notes ? (
          <AppText variant="body" tone="muted" className="mt-2">
            {quest.notes}
          </AppText>
        ) : null}

        <View className="mt-4 flex-row items-center justify-between rounded-2xl border px-3.5 py-3" style={{ borderColor: palette.border, backgroundColor: palette.surfaceAlt }}>
          <View>
            <HudLabel tone="faint">POTENTIAL REWARD</HudLabel>
            <View className="mt-1 flex-row items-center gap-3">
              <View className="flex-row items-center gap-1">
                <Icon name="bolt" size={15} color={palette.primaryText} filled />
                <AppText variant="monoStrong" tone="accent">
                  +{formatNumber(award.xp + weeklyXp)}
                </AppText>
              </View>
              <View className="flex-row items-center gap-1">
                <Icon name="coin" size={13} color={palette.coin} />
                <AppText variant="monoStrong" tone="coin">
                  +{award.coins + weeklyCoins}
                </AppText>
              </View>
              <AppText variant="micro" tone="faint">
                x{award.multiplier.toFixed(2)}
              </AppText>
            </View>
          </View>
          <View className="items-end">
            <HudLabel tone="faint">SCHEDULE</HudLabel>
            <AppText variant="micro" tone="muted" className="mt-1">
              {scheduleText}
            </AppText>
          </View>
        </View>

        {quest.archivedAt ? (
          <View className="mt-4 flex-row items-center justify-between rounded-xl border px-3 py-2.5" style={{ borderColor: palette.border }}>
            <AppText variant="micro" tone="muted">
              Archived {relativeDayLabel(quest.archivedAt.slice(0, 10), today)} · history preserved.
            </AppText>
            <LinkButton label="Restore" icon="refresh" onPress={() => restoreQuest(quest.id)} />
          </View>
        ) : (
          <Button
            label={completeLabel}
            icon={doneNow ? 'refresh' : 'check'}
            variant={doneNow ? 'secondary' : 'primary'}
            size="lg"
            className="mt-4"
            onPress={() => toggleQuest(quest.id)}
          />
        )}

        {backfills.length && !doneNow ? (
          <View className="mt-3 flex-row flex-wrap gap-2">
            {backfills.map((date) => (
              <Button
                key={date}
                label={`Recover ${formatDateKey(date, 'short')}`}
                variant="ghost"
                size="sm"
                icon="calendar"
                onPress={() => completeQuest(quest.id, date)}
              />
            ))}
            <AppText variant="micro" tone="faint" className="w-full">
              Grace window recovery. Backfills award normal XP — missed days are not punished.
            </AppText>
          </View>
        ) : null}
      </Card>

      <View className="mt-4 flex-row gap-2.5">
        <StatTile
          compact
          className="flex-1"
          label="LOGS"
          value={formatNumber(stats.totalCompletions)}
          hint={stats.lastDate ? `last ${relativeDayLabel(stats.lastDate, today).toLowerCase()}` : 'not started'}
          icon="check"
        />
        <StatTile
          compact
          className="flex-1"
          label="STREAK"
          value={`${stats.streak}d`}
          hint="days in a row"
          icon="flame"
          color={isDark ? '#FFB27A' : '#A8401B'}
        />
        <StatTile
          compact
          className="flex-1"
          label="30 DAYS"
          value={formatNumber(stats.last30)}
          hint="completions"
          icon="calendar"
        />
      </View>

      {quest.cadence === 'weekly' ? (
        <Card className="mt-4 flex-row items-center gap-2.5">
          <Icon name="spark" size={15} color={palette.primaryText} filled />
          <AppText variant="micro" tone="muted" className="flex-1">
            Weekly missions can be completed any day this week and carry an extra +
            {state.settings.rules.weeklyBonusXp} XP and {state.settings.rules.weeklyBonusCoins} coins.
          </AppText>
        </Card>
      ) : null}

      <View className="mt-6">
        <View className="mb-2 flex-row items-center justify-between">
          <HudLabel tone="muted">RECENT HISTORY</HudLabel>
          <HudLabel tone="faint">{stats.totalCompletions} TOTAL</HudLabel>
        </View>
        {recent.length ? (
          <Card padded={false} className="overflow-hidden px-4">
            {recent.map((entry) => (
              <View key={entry.id} style={{ borderBottomWidth: 1, borderBottomColor: palette.border }}>
                <View className="flex-row items-center justify-between pt-3">
                  <HudLabel tone="faint">{formatDateKey(entry.date, 'long').toUpperCase()}</HudLabel>
                  <HudLabel tone="faint">{entry.source === 'bonus' ? 'BONUS' : `STREAK ${entry.streak}D`}</HudLabel>
                </View>
                <ActivityRow entry={entry} />
              </View>
            ))}
          </Card>
        ) : (
          <Card variant="ghost" className="items-center py-6">
            <Icon name="clock" size={22} color={palette.textFaint} />
            <AppText variant="bodyStrong" className="mt-2">
              No completions yet
            </AppText>
            <AppText variant="micro" tone="faint" className="mt-1 text-center">
              Finish it once and the first log appears here with its exact reward.
            </AppText>
          </Card>
        )}
      </View>

      <View className="mt-6">
        <HudLabel tone="muted" className="mb-2">
          QUEST MANAGEMENT
        </HudLabel>
        <Card padded={false} className="overflow-hidden">
          <ManageRow
            icon="edit"
            label="Edit quest"
            hint="Change title, skill, cadence, or rewards preview"
            onPress={() => router.push(`/quest/new?id=${quest.id}`)}
          />
          {quest.archivedAt ? (
            <ManageRow icon="refresh" label="Restore quest" hint="Bring it back to the mission board" onPress={() => restoreQuest(quest.id)} />
          ) : (
            <ManageRow
              icon="archive"
              label="Archive quest"
              hint="Keeps all history, removes it from active lists"
              onPress={() => {
                archiveQuest(quest.id);
                router.back();
              }}
            />
          )}
          <ManageRow
            icon="trash"
            label="Delete quest"
            hint="Permanent — XP history is preserved"
            onPress={() => setDeleteOpen(true)}
            danger
          />
        </Card>
      </View>

      <View className="mt-5 flex-row items-center justify-center gap-2">
        <HudLabel tone="faint">CREATED {formatDateKey(quest.createdAt.slice(0, 10), 'short').toUpperCase()}</HudLabel>
        <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: palette.textFaint }} />
        <HudLabel tone="faint">{activeQuests(state).length} ACTIVE QUESTS</HudLabel>
      </View>

      <Dialog
        visible={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this quest?"
        description="The quest disappears from the board, but the XP you already earned and its history stay in your log. This cannot be undone."
        icon="trash"
        primaryAction={{
          label: 'Delete quest',
          variant: 'danger',
          icon: 'trash',
          onPress: () => {
            deleteQuest(quest.id);
            setDeleteOpen(false);
            router.back();
          },
        }}
        secondaryAction={{ label: 'Keep it', onPress: () => setDeleteOpen(false) }}
      />
    </Screen>
  );
}

function ManageRow({
  icon,
  label,
  hint,
  onPress,
  danger = false,
}: {
  icon: IconName;
  label: string;
  hint: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <Button
      variant="ghost"
      onPress={onPress}
      accessibilityLabel={`${label}. ${hint}`}
      className="justify-start rounded-none border-0 px-4 py-3.5"
      style={{ borderBottomWidth: 1, borderBottomColor: palette.border }}
    >
      <View
        className="h-9 w-9 items-center justify-center rounded-xl border"
        style={{
          borderColor: danger ? palette.danger : palette.border,
          backgroundColor: danger ? withAlpha(palette.danger, 0.08) : palette.surfaceAlt,
        }}
      >
        <Icon name={icon} size={16} color={danger ? palette.dangerText : palette.textMuted} />
      </View>
      <View className="flex-1 items-start">
        <AppText variant="bodyStrong" style={danger ? { color: palette.dangerText } : undefined}>
          {label}
        </AppText>
        <AppText variant="micro" tone="faint">
          {hint}
        </AppText>
      </View>
      <Icon name="chevronRight" size={15} color={palette.textFaint} />
    </Button>
  );
}
