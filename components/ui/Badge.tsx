import React from 'react';
import { View } from 'react-native';
import { cn } from '@/lib/cn';
import { useTheme } from '@/theme/ThemeProvider';
import { withAlpha } from '@/theme/palette';
import { Icon, type IconName } from '@/components/icons/Icon';
import { AppText } from './Text';

export type BadgeTone = 'xp' | 'coin' | 'streak' | 'level' | 'neutral' | 'success' | 'danger' | 'frame';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: IconName;
  color?: string;
  className?: string;
  compact?: boolean;
  accessibilityLabel?: string;
}

export function Badge({
  label,
  tone = 'neutral',
  icon,
  color,
  className,
  compact = false,
  accessibilityLabel,
  accessible = false,
}: BadgeProps & { accessible?: boolean }) {
  const { palette, isDark } = useTheme();
  const toneColor =
    color ??
    (tone === 'xp'
      ? palette.primaryText
      : tone === 'coin'
        ? palette.coin
        : tone === 'streak'
          ? isDark
            ? '#FFB27A'
            : '#A8401B'
          : tone === 'level'
            ? isDark
              ? '#A9C1FF'
              : '#2B55C9'
            : tone === 'success'
              ? palette.successText
              : tone === 'danger'
                ? palette.dangerText
                : tone === 'frame'
                  ? palette.text
                  : palette.textMuted);

  const soft = withAlpha(toneColor.startsWith('#') ? toneColor : '#8DA1BA', 0.12);

  return (
    <View
      accessibilityLabel={accessibilityLabel ?? (accessible ? label : undefined)}
      className={cn('flex-row items-center gap-1 rounded-full border', compact ? 'px-2 py-[3px]' : 'px-2.5 py-1', className)}
      style={{ backgroundColor: soft, borderColor: withAlpha('#8DA1BA', 0.16) }}
    >
      {icon ? <Icon name={icon} size={compact ? 11 : 13} color={toneColor} /> : null}
      <AppText
        variant="label"
        style={{ color: toneColor }}
        className={cn(compact ? 'text-[9px]' : 'text-[10px]')}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </View>
  );
}

export function LevelBadge({ level, className }: { level: number; className?: string }) {
  const { palette, isDark } = useTheme();
  return (
    <View
      className={cn('flex-row items-baseline gap-1 rounded-full border px-2.5 py-1', className)}
      style={{
        backgroundColor: isDark ? withAlpha(palette.primary, 0.12) : withAlpha(palette.primary, 0.1),
        borderColor: withAlpha(palette.primary, 0.35),
      }}
    >
      <AppText variant="label" tone="accent">
        LVL
      </AppText>
      <AppText variant="monoStrong" tone="accent">
        {level}
      </AppText>
    </View>
  );
}
