import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { achievementGroupCounts, achievementViews } from '@/domain/selectors';
import { ACHIEVEMENTS, TIER_META, type AchievementTier } from '@/domain/achievements';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { AppText, HudLabel } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { AchievementRow } from '@/components/profile/AchievementBadge';
import { Icon } from '@/components/icons/Icon';
import { formatNumber, percent } from '@/lib/format';

type Filter = 'all' | 'unlocked' | 'progress';

const TIERS: AchievementTier[] = ['bronze', 'silver', 'gold', 'prism'];

export default function AchievementsScreen() {
  const router = useRouter();
  const { state, today } = useAppStore();
  const { palette } = useTheme();
  const [filter, setFilter] = useState<Filter>('all');

  const views = achievementViews(state, today);
  const unlocked = views.filter((view) => view.unlocked);
  const inProgress = views.filter((view) => !view.unlocked).sort((a, b) => b.ratio - a.ratio);
  const groups = achievementGroupCounts(views);
  const earnedCoins = unlocked.reduce((sum, view) => sum + view.def.rewardCoins, 0);
  const visible = filter === 'unlocked' ? unlocked : filter === 'progress' ? inProgress : views;

  return (
    <Screen>
      <View className="pt-1 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <HudLabel tone="accent">ACHIEVEMENT ARCHIVE</HudLabel>
          <AppText variant="h1" className="mt-1">
            Trophies
          </AppText>
          <AppText variant="caption" tone="muted" className="mt-1">
            {unlocked.length} of {ACHIEVEMENTS.length} unlocked · {formatNumber(earnedCoins)} coins awarded
          </AppText>
        </View>
        <IconButton
          icon="close"
          label="Back to profile"
          variant="surface"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
        />
      </View>

      <Card className="mt-5">
        <View className="flex-row items-center gap-4">
          <ProgressRing progress={unlocked.length / ACHIEVEMENTS.length} size={84} strokeWidth={6}>
            <View className="items-center">
              <AppText variant="monoStrong" tone="accent">
                {percent(unlocked.length / ACHIEVEMENTS.length)}
              </AppText>
              <HudLabel tone="faint">DONE</HudLabel>
            </View>
          </ProgressRing>
          <View className="flex-1 gap-1.5">
            {TIERS.map((tier) => {
              const meta = TIER_META[tier];
              const group = groups[tier];
              return (
                <View key={tier} className="flex-row items-center gap-2">
                  <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: meta.color }} />
                  <HudLabel tone="faint" className="w-14" style={{ color: meta.color }}>
                    {meta.label.toUpperCase()}
                  </HudLabel>
                  <View className="flex-1">
                    <View style={{ height: 3, borderRadius: 2, backgroundColor: palette.skeleton }}>
                      <View
                        style={{
                          width: `${(group.unlocked / Math.max(1, group.total)) * 100}%`,
                          height: 3,
                          borderRadius: 2,
                          backgroundColor: meta.color,
                        }}
                      />
                    </View>
                  </View>
                  <AppText variant="micro" tone="faint">
                    {group.unlocked}/{group.total}
                  </AppText>
                </View>
              );
            })}
          </View>
        </View>
        <View className="mt-4 flex-row items-center gap-2 rounded-xl border px-3 py-2.5" style={{ borderColor: palette.border, backgroundColor: palette.surfaceAlt }}>
          <Icon name="coin" size={14} color={palette.coin} />
          <AppText variant="micro" tone="muted" className="flex-1">
            Achievements pay coins automatically and stay unlocked forever.
          </AppText>
        </View>
      </Card>

      <View className="mt-4">
        <SegmentedControl
          label="Achievement filter"
          value={filter}
          options={[
            { value: 'all', label: 'All' },
            { value: 'unlocked', label: 'Unlocked' },
            { value: 'progress', label: 'In progress' },
          ]}
          onChange={setFilter}
        />
      </View>

      {visible.length === 0 ? (
        <View className="mt-6">
          <EmptyState
            icon="trophy"
            eyebrow="NOTHING HERE YET"
            title={filter === 'unlocked' ? 'No medals yet' : 'Everything unlocked'}
            description={
              filter === 'unlocked'
                ? 'Your first achievement is one completion away. Start with something micro.'
                : 'You have collected every trophy. Time to design a harder life.'
            }
            actionLabel="Open mission board"
            onAction={() => router.push('/quests')}
          />
        </View>
      ) : filter !== 'all' ? (
        <Card padded={false} className="mt-4 overflow-hidden px-4">
          {visible.map((view) => (
            <AchievementRow key={view.def.id} view={view} />
          ))}
        </Card>
      ) : (
        <View className="mt-6">
          {TIERS.map((tier) => {
            const tierViews = visible.filter((view) => view.def.tier === tier);
            if (!tierViews.length) return null;
            const meta = TIER_META[tier];
            return (
              <View key={tier} className="mb-6">
                <View className="mb-2 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: meta.color }} />
                    <HudLabel tone="muted" style={{ color: meta.color }}>
                      {meta.label.toUpperCase()} TIER
                    </HudLabel>
                  </View>
                  <Badge
                    label={`${groups[tier].unlocked}/${groups[tier].total}`}
                    color={meta.color}
                    compact
                  />
                </View>
                <Card padded={false} className="overflow-hidden px-4">
                  {tierViews.map((view) => (
                    <AchievementRow key={view.def.id} view={view} />
                  ))}
                </Card>
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
