import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon, type IconName } from '@/components/icons/Icon';
import { AppText, HudLabel } from './Text';
import { cn } from '@/lib/cn';

export interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  icon?: IconName;
  color?: string;
  onPress?: () => void;
  className?: string;
  compact?: boolean;
}

export function StatTile({ label, value, hint, icon, color, onPress, className, compact = false }: StatTileProps) {
  const { palette, isDark } = useTheme();
  const tint = color ?? palette.primaryText;

  const body = (
    <>
      <View className="flex-row items-center gap-1.5">
        {icon ? <Icon name={icon} size={13} color={tint} /> : null}
        <HudLabel tone="faint" className="flex-1" numberOfLines={1}>
          {label}
        </HudLabel>
      </View>
      <AppText variant={compact ? 'number' : 'numberLarge'} className="mt-2" numberOfLines={1}>
        {value}
      </AppText>
      {hint ? (
        <AppText variant="micro" tone="faint" className="mt-0.5" numberOfLines={1}>
          {hint}
        </AppText>
      ) : null}
    </>
  );

  const classes = cn(
    'rounded-2xl border',
    compact ? 'p-3' : 'p-4',
    className,
  );
  const style = {
    borderColor: palette.border,
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
  };

  if (!onPress) {
    return (
      <View className={classes} style={style}>
        {body}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      onPress={onPress}
      className={classes}
      style={({ pressed }) => [style, pressed ? { opacity: 0.75 } : null]}
    >
      {body}
    </Pressable>
  );
}
