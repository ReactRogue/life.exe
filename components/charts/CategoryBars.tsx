import React from 'react';
import { View } from 'react-native';
import { AppText, HudLabel } from '@/components/ui/Text';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatNumber } from '@/lib/format';

export interface CategoryBarItem {
  id: string;
  name: string;
  xp: number;
  level: number;
  color: string;
}

export function CategoryBars({ items, className }: { items: CategoryBarItem[]; className?: string }) {
  const max = Math.max(1, ...items.map((item) => item.xp));
  return (
    <View className={className}>
      {items.map((item) => (
        <View key={item.id} className="mb-4 last:mb-0">
          <View className="mb-1.5 flex-row items-center justify-between gap-2">
            <View className="flex-row items-center gap-2 flex-1">
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: item.color,
                }}
              />
              <AppText variant="caption" className="font-sans-medium flex-1" numberOfLines={1}>
                {item.name}
              </AppText>
              <HudLabel tone="faint">LVL {item.level}</HudLabel>
            </View>
            <AppText variant="micro" tone="muted">
              {formatNumber(item.xp)} XP
            </AppText>
          </View>
          <ProgressBar
            progress={item.xp / max}
            color={item.color}
            height={6}
            accessibilityLabel={`${item.name}: level ${item.level}, ${item.xp} XP`}
          />
        </View>
      ))}
    </View>
  );
}
