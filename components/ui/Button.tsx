import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { cn } from '@/lib/cn';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon, type IconName } from '@/components/icons/Icon';
import { AppText } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'coin';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label?: string;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  toneColor?: string;
}

const SIZES: Record<Size, { container: string; text: 'caption' | 'body' | 'bodyStrong'; icon: number }> = {
  sm: { container: 'min-h-[40px] px-3.5 py-2 rounded-xl gap-1.5', text: 'caption', icon: 16 },
  md: { container: 'min-h-[48px] px-5 py-3 rounded-2xl gap-2', text: 'bodyStrong', icon: 18 },
  lg: { container: 'min-h-[56px] px-6 py-3.5 rounded-2xl gap-2.5', text: 'bodyStrong', icon: 20 },
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  fullWidth = false,
  className,
  style,
  disabled,
  children,
  toneColor,
  ...rest
}: ButtonProps) {
  const { palette, isDark } = useTheme();
  const s = SIZES[size];
  const isDisabled = disabled || loading;

  const colors =
    variant === 'primary'
      ? { bg: toneColor ?? palette.primary, border: 'transparent', text: toneColor ? '#FFFFFF' : palette.onPrimary }
      : variant === 'danger'
        ? { bg: isDark ? 'rgba(255,107,122,0.14)' : '#A81F30', border: isDark ? 'rgba(255,139,149,0.4)' : '#A81F30', text: isDark ? palette.dangerText : '#FFFFFF' }
        : variant === 'coin'
          ? { bg: isDark ? palette.coinSoft : 'rgba(138,86,6,0.08)', border: isDark ? 'rgba(255,196,107,0.35)' : 'rgba(138,86,6,0.3)', text: palette.coin }
          : variant === 'ghost'
            ? { bg: 'transparent', border: 'transparent', text: palette.textMuted }
            : { bg: isDark ? 'rgba(255,255,255,0.055)' : '#FFFFFF', border: palette.border, text: palette.text };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(isDisabled), busy: loading }}
      accessibilityLabel={rest.accessibilityLabel ?? label}
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center border',
        s.container,
        fullWidth && 'w-full',
        isDisabled && 'opacity-45',
        className,
      )}
      style={({ pressed }) => [
        { backgroundColor: colors.bg, borderColor: colors.border },
        pressed && !isDisabled ? { opacity: 0.82 } : null,
        style,
      ]}
      {...rest}
    >
      {loading ? <ActivityIndicator size="small" color={colors.text} /> : null}
      {!loading && icon ? <Icon name={icon} size={s.icon} color={colors.text} /> : null}
      {children ?? (
        <AppText variant={s.text} style={{ color: colors.text }} numberOfLines={1}>
          {label}
        </AppText>
      )}
      {!loading && iconRight ? <Icon name={iconRight} size={s.icon} color={colors.text} /> : null}
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  size = 44,
  variant = 'secondary',
  color,
  className,
  disabled,
}: {
  icon: IconName;
  label: string;
  onPress?: () => void;
  size?: number;
  variant?: 'secondary' | 'ghost' | 'primary' | 'surface';
  color?: string;
  className?: string;
  disabled?: boolean;
}) {
  const { palette, isDark } = useTheme();
  const bg =
    variant === 'primary'
      ? palette.primary
      : variant === 'secondary'
        ? isDark
          ? 'rgba(255,255,255,0.06)'
          : '#FFFFFF'
        : variant === 'surface'
          ? isDark
            ? '#0E1A2B'
            : '#F5F8FD'
          : 'transparent';
  const tint = color ?? (variant === 'primary' ? palette.onPrimary : palette.text);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      className={cn('items-center justify-center rounded-full border', disabled && 'opacity-40', className)}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          backgroundColor: bg,
          borderColor: variant === 'ghost' ? 'transparent' : palette.border,
        },
        pressed ? { opacity: 0.75 } : null,
      ]}
    >
      <Icon name={icon} size={Math.round(size * 0.46)} color={tint} />
    </Pressable>
  );
}

export function LinkButton({
  label,
  icon = 'chevronRight',
  onPress,
  color,
  className,
}: {
  label: string;
  icon?: IconName;
  onPress?: () => void;
  color?: string;
  className?: string;
}) {
  const { palette } = useTheme();
  const tint = color ?? palette.primaryText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      className={cn('flex-row items-center gap-1 py-1', className)}
      style={({ pressed }) => (pressed ? { opacity: 0.65 } : null)}
    >
      <AppText variant="caption" style={{ color: tint }} className="font-sans-medium">
        {label}
      </AppText>
      {icon ? <Icon name={icon} size={14} color={tint} /> : null}
    </Pressable>
  );
}

export function FloatingActionButton({
  onPress,
  label = 'New quest',
}: {
  onPress: () => void;
  label?: string;
}) {
  const { palette, isDark } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="absolute bottom-28 right-5 h-14 w-14 items-center justify-center rounded-full"
      style={({ pressed }) => [
        {
          backgroundColor: palette.primary,
          shadowColor: palette.primary,
          shadowOpacity: isDark ? 0.5 : 0.35,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
      ]}
    >
      <Icon name="plus" size={24} color={palette.onPrimary} />
    </Pressable>
  );
}

export function IconRow({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View className={cn('flex-row items-center gap-2', className)} style={style}>
      {children}
    </View>
  );
}
