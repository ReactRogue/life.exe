import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { TIER_META } from '@/domain/achievements';
import type { AchievementView } from '@/domain/selectors';
import { Icon, type IconName } from '@/components/icons/Icon';
import { AppText, HudLabel } from '@/components/ui/Text';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';

export function AchievementBadge({
  view,
  size = 48,
}: {
  view: AchievementView;
  size?: number;
}) {
  const { palette, isDark } = useTheme();
  const tier = TIER_META[view.def.tier];
  const color = view.unlocked ? tier.color : palette.textFaint;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 48 48" style={{ position: 'absolute' }}>
        <Path
          d="M24 3 41 12.5v23L24 45 7 35.5v-23Z"
          fill={view.unlocked ? tier.soft : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(10,21,38,0.03)'}
          stroke={view.unlocked ? color : palette.border}
          strokeWidth={1.4}
        />
        <Path
          d="M24 8 36 15v18L24 40 12 33V15Z"
          fill="none"
          stroke={view.unlocked ? `${color}55` : 'transparent'}
          strokeWidth={1}
        />
      </Svg>
      <Icon
        name={view.def.icon as IconName}
        size={Math.round(size * 0.38)}
        color={color}
        opacity={view.unlocked ? 1 : 0.55}
      />
    </View>
  );
}

export function AchievementTile({
  view,
  className,
}: {
  view: AchievementView;
  className?: string;
}) {
  const { palette } = useTheme();
  const tier = TIER_META[view.def.tier];
  return (
    <View
      className={cn('items-center rounded-2xl border p-3', className)}
      style={{
        borderColor: view.unlocked ? `${tier.color}55` : palette.border,
        backgroundColor: view.unlocked ? tier.soft : palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
        opacity: view.unlocked ? 1 : 0.92,
      }}
      accessibilityLabel={`${view.def.name}. ${view.unlocked ? 'Unlocked' : `Progress ${view.current} of ${view.target}`}. ${view.def.description}`}
    >
      <AchievementBadge view={view} size={44} />
      <AppText
        variant="micro"
        align="center"
        numberOfLines={2}
        className="mt-2 font-sans-medium min-h-[32px]"
        style={{ color: view.unlocked ? palette.text : palette.textMuted }}
      >
        {view.def.name}
      </AppText>
      {view.unlocked ? (
        <HudLabel tone="faint" className="mt-0.5" style={{ color: tier.color }}>
          {tier.label.toUpperCase()}
        </HudLabel>
      ) : (
        <View className="mt-1 w-full">
          <ProgressBar
            progress={view.ratio}
            height={3}
            color={tier.color}
            accessibilityLabel={`${view.def.name} progress`}
          />
          <AppText variant="micro" tone="faint" align="center" className="mt-1" style={{ fontSize: 9 }}>
            {view.progressLabel}
          </AppText>
        </View>
      )}
    </View>
  );
}

export function AchievementRow({ view }: { view: AchievementView }) {
  const { palette } = useTheme();
  const tier = TIER_META[view.def.tier];
  return (
    <View className="flex-row gap-3 border-b py-4" style={{ borderColor: palette.border }}>
      <AchievementBadge view={view} size={48} />
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <AppText variant="bodyStrong" className="flex-shrink-1" numberOfLines={1}>
            {view.def.name}
          </AppText>
          <HudLabel tone="faint" style={{ color: tier.color }}>
            {tier.label.toUpperCase()}
          </HudLabel>
        </View>
        <AppText variant="micro" tone="muted" className="mt-0.5">
          {view.def.description}
        </AppText>
        <View className="mt-2 flex-row items-center gap-2">
          <View className="flex-1">
            <ProgressBar
              progress={view.ratio}
              height={4}
              color={view.unlocked ? tier.color : palette.textFaint}
              accessibilityLabel={`${view.def.name} progress`}
            />
          </View>
          <AppText variant="micro" tone="faint">
            {view.unlocked ? 'COMPLETE' : view.progressLabel}
          </AppText>
        </View>
      </View>
      <View className="items-end justify-between">
        <View className="flex-row items-center gap-1">
          <Icon name="coin" size={10} color={palette.coin} />
          <AppText variant="micro" tone="coin">
            {formatNumber(view.def.rewardCoins)}
          </AppText>
        </View>
        {view.unlockedAt ? (
          <HudLabel tone="faint">{new Date(view.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}</HudLabel>
        ) : (
          <HudLabel tone="faint">{Math.round(view.ratio * 100)}%</HudLabel>
        )}
      </View>
    </View>
  );
}
