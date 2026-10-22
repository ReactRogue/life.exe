import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { activityEntries, groupActivity, rangeSummary } from '@/domain/selectors';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { AppText, HudLabel } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActivityRow } from '@/components/profile/ActivityRow';
import { formatNumber } from '@/lib/format';

type Filter = 'all' | 'quests' | 'bonus';

export default function ActivityLogScreen() {
  const router = useRouter();
  const { state, today } = useAppStore();
  const { palette } = useTheme();
  const [filter, setFilter] = useState<Filter>('all');

  const allEntries = useMemo(() => activityEntries(state, 300), [state]);
  const entries = allEntries.filter((entry) =>
    filter === 'all' ? true : filter === 'bonus' ? entry.source === 'bonus' : entry.source !== 'bonus',
  );
  const groups = groupActivity(entries, today);
  const summary = rangeSummary(state, 30, today);
  const totalXp = entries.reduce((sum, entry) => sum + entry.xp, 0);

  return (
    <Screen>
      <View className="pt-1 flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <HudLabel tone="accent">XP ACTIVITY LOG</HudLabel>
          <AppText variant="h1" className="mt-1">
            Every signal
          </AppText>
          <AppText variant="caption" tone="muted" className="mt-1">
            {entries.length} {entries.length === 1 ? 'event' : 'events'} · {formatNumber(totalXp)} XP recorded
          </AppText>
        </View>
        <IconButton
          icon="close"
          label="Back to profile"
          variant="surface"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/stats'))}
        />
      </View>

      <View className="mt-5 flex-row gap-2">
        <Badge label={`30D ${formatNumber(summary.totalXp)} XP`} tone="xp" icon="bolt" />
        <Badge label={`${summary.activeDays} ACTIVE DAYS`} tone="success" icon="signal" />
      </View>

      <View className="mt-4">
        <SegmentedControl
          label="Log filter"
          value={filter}
          options={[
            { value: 'all', label: 'All' },
            { value: 'quests', label: 'Quests' },
            { value: 'bonus', label: 'Bonuses' },
          ]}
          onChange={setFilter}
        />
      </View>

      {groups.length ? (
        <View className="mt-5">
          {groups.map((group) => (
            <View key={group.date} className="mb-6">
              <View className="mb-2 flex-row items-center justify-between">
                <View>
                  <HudLabel tone="muted">{group.label.toUpperCase()}</HudLabel>
                </View>
                <View className="flex-row items-center gap-2">
                  <AppText variant="micro" tone="faint">
                    {group.entries.length} {group.entries.length === 1 ? 'event' : 'events'}
                  </AppText>
                  <Badge label={`+${formatNumber(group.xp)} XP`} tone="xp" compact />
                </View>
              </View>
              <Card padded={false} className="overflow-hidden px-4">
                {group.entries.map((entry, index) => (
                  <View
                    key={entry.id}
                    style={index > 0 ? { borderTopWidth: 1, borderTopColor: palette.border } : null}
                  >
                    <ActivityRow entry={entry} />
                  </View>
                ))}
              </Card>
            </View>
          ))}
        </View>
      ) : (
        <View className="mt-6">
          <EmptyState
            icon="clock"
            eyebrow={filter === 'all' ? 'NO SIGNALS' : 'NO MATCHES'}
            title={filter === 'all' ? 'The log is empty' : 'Nothing in this filter'}
            description={
              filter === 'all'
                ? 'Complete a quest and it lands here with the exact XP, coins, and streak multiplier applied.'
                : 'Try a different filter — your log has other event types.'
            }
            actionLabel={filter === 'all' ? 'Open mission board' : 'Show all events'}
            onAction={() => (filter === 'all' ? router.push('/quests') : setFilter('all'))}
          />
        </View>
      )}
    </Screen>
  );
}
