import React from 'react';
import { View } from 'react-native';
import { useAppStore } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { hueFor, withAlpha } from '@/theme/palette';
import { relativeTime } from '@/domain/date';
import type { ActivityEntry } from '@/domain/selectors';
import { AppText, HudLabel } from '@/components/ui/Text';
import { Icon, type IconName } from '@/components/icons/Icon';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/cn';

export function ActivityRow({
  entry,
  className,
}: {
  entry: ActivityEntry;
  className?: string;
}) {
  const { state } = useAppStore();
  const { palette } = useTheme();
  const category = state.categories.find((item) => item.id === entry.categoryId);
  const isBonus = entry.source === 'bonus';
  const hue = hueFor(category?.hue ?? 'discipline', palette.mode);
  const tint = isBonus ? palette.coin : hue;
  const icon = (isBonus ? 'spark' : (category?.icon ?? 'bolt')) as IconName;

  return (
    <View
      className={cn('flex-row items-center gap-3 py-2.5', className)}
      accessibilityLabel={`${entry.title}, ${entry.xp} XP${entry.coins ? `, ${entry.coins} coins` : ''}, ${relativeTime(entry.completedAt)}`}
    >
      <View
        className="h-9 w-9 items-center justify-center rounded-xl border"
        style={{ backgroundColor: withAlpha(tint.startsWith('#') ? tint : '#8DA1BA', 0.12), borderColor: withAlpha(tint.startsWith('#') ? tint : '#8DA1BA', 0.25) }}
      >
        <Icon name={icon} size={16} color={tint} />
      </View>
      <View className="flex-1">
        <AppText variant="bodyStrong" numberOfLines={1}>
          {entry.title}
        </AppText>
        <HudLabel tone="faint" numberOfLines={1} className="mt-0.5">
          {isBonus ? 'DAILY BONUS' : entry.categoryName.toUpperCase()} · {relativeTime(entry.completedAt).toUpperCase()}
        </HudLabel>
      </View>
      <View className="items-end">
        <AppText variant="monoStrong" tone={isBonus ? 'coin' : 'accent'}>
          +{formatNumber(entry.xp)}
        </AppText>
        {entry.coins > 0 ? (
          <View className="flex-row items-center gap-1">
            <Icon name="coin" size={10} color={palette.coin} />
            <AppText variant="micro" tone="faint">
              {entry.coins}
            </AppText>
          </View>
        ) : (
          <HudLabel tone="faint">{isBonus ? 'BONUS' : `x${entry.multiplier.toFixed(2)}`}</HudLabel>
        )}
      </View>
    </View>
  );
}
