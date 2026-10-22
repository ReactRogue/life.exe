import React from 'react';
import { Pressable, View } from 'react-native';
import { cn } from '@/lib/cn';
import { useTheme } from '@/theme/ThemeProvider';
import { withAlpha } from '@/theme/palette';
import { Icon, type IconName } from '@/components/icons/Icon';
import { AppText } from './Text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  color?: string;
  className?: string;
  size?: 'sm' | 'md';
  accessibilityLabel?: string;
}

export function Chip({
  label,
  selected = false,
  onPress,
  icon,
  color,
  className,
  size = 'md',
  accessibilityLabel,
}: ChipProps) {
  const { palette } = useTheme();
  const accent = color ?? palette.primary;
  const bg = selected ? withAlpha(accent, 0.14) : palette.surfaceAlt;
  const border = selected ? withAlpha(accent, 0.4) : palette.border;
  const tint = selected ? accent : palette.textMuted;

  const content = (
    <>
      {icon ? <Icon name={icon} size={size === 'sm' ? 13 : 15} color={tint} /> : null}
      {color && !icon ? (
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tint }} />
      ) : null}
      <AppText
        variant={size === 'sm' ? 'micro' : 'caption'}
        style={{ color: tint }}
        className={cn('font-sans-medium', size === 'sm' && 'text-[11px]')}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </>
  );

  const classes = cn(
    'flex-row items-center gap-1.5 rounded-full border',
    size === 'sm' ? 'px-2.5 py-1' : 'px-3 py-1.5 min-h-[34px]',
    className,
  );

  if (!onPress) {
    return (
      <View className={classes} style={{ backgroundColor: bg, borderColor: border }}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={4}
      className={classes}
      style={({ pressed }) => [
        { backgroundColor: bg, borderColor: border },
        pressed ? { opacity: 0.72 } : null,
      ]}
    >
      {content}
    </Pressable>
  );
}
