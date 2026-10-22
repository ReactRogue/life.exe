import React, { useState } from 'react';
import {
  Pressable,
  Switch,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { cn } from '@/lib/cn';
import { useTheme } from '@/theme/ThemeProvider';
import { withAlpha } from '@/theme/palette';
import { Icon, type IconName } from '@/components/icons/Icon';
import { AppText, HudLabel } from './Text';
import { IconButton } from './Button';
import { formatNumber } from '@/lib/format';

export function FieldLabel({
  children,
  hint,
  className,
}: {
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <View className={cn('mb-2 flex-row items-center justify-between gap-2', className)}>
      <HudLabel tone="muted">{children}</HudLabel>
      {hint ? (
        <AppText variant="micro" tone="faint">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

export interface TextFieldProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  multiline?: boolean;
  showCount?: boolean;
  containerClassName?: string;
  icon?: IconName;
}

export function TextField({
  label,
  hint,
  error,
  multiline,
  showCount,
  containerClassName,
  icon,
  maxLength,
  value,
  className,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const { palette, isDark } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error
    ? palette.danger
    : focused
      ? palette.primaryBorder
      : palette.border;

  return (
    <View className="w-full">
      {label ? <FieldLabel hint={hint}>{label}</FieldLabel> : null}
      <View
        className={cn(
          'flex-row items-center gap-2 rounded-2xl border px-4',
          multiline ? 'items-start py-3' : 'min-h-[52px]',
          containerClassName,
        )}
        style={{
          backgroundColor: isDark ? '#0C1826' : '#FFFFFF',
          borderColor,
        }}
      >
        {icon ? <Icon name={icon} size={18} color={focused ? palette.primaryText : palette.textFaint} /> : null}
        <TextInput
          accessibilityLabel={label ?? rest.placeholder}
          value={value}
          maxLength={maxLength}
          multiline={multiline}
          placeholderTextColor={palette.textFaint}
          selectionColor={palette.primary}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          className={cn('flex-1 font-sans text-[15px]', multiline && 'min-h-[92px]', className)}
          style={[
            { paddingVertical: 0, color: palette.text },
            multiline ? { textAlignVertical: 'top' } : null,
          ]}
          {...rest}
        />
        {maxLength && showCount ? (
          <AppText variant="micro" tone="faint">
            {`${(value ?? '').length}/${maxLength}`}
          </AppText>
        ) : null}
      </View>
      {error ? (
        <AppText variant="micro" tone="danger" className="mt-1.5" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  label,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  label?: string;
}) {
  const { palette, isDark } = useTheme();
  return (
    <View
      className={cn('flex-row rounded-2xl border p-1', className)}
      style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#EDF3FA', borderColor: palette.border }}
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5"
            style={({ pressed }) => [
              {
                backgroundColor: selected ? (isDark ? '#15243A' : '#FFFFFF') : 'transparent',
                borderColor: selected ? palette.primaryBorder : 'transparent',
              },
              pressed ? { opacity: 0.7 } : null,
            ]}
          >
            {option.icon ? (
              <Icon name={option.icon} size={14} color={selected ? palette.primaryText : palette.textMuted} />
            ) : null}
            <AppText
              variant="caption"
              style={{ color: selected ? palette.primaryText : palette.textMuted }}
              className="font-sans-medium"
              numberOfLines={1}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit,
  hint,
  formatter,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  hint?: string;
  formatter?: (value: number) => string;
}) {
  const { palette } = useTheme();
  const clamp = (next: number) => Math.max(min, Math.min(max, Math.round(next * 100) / 100));
  return (
    <View className="flex-row items-center justify-between gap-3 py-2.5">
      <View className="flex-1">
        <AppText variant="bodyStrong">{label}</AppText>
        {hint ? (
          <AppText variant="micro" tone="faint" className="mt-0.5">
            {hint}
          </AppText>
        ) : null}
      </View>
      <View className="flex-row items-center gap-2">
        <IconButton
          icon="minus"
          label={`Decrease ${label}`}
          size={34}
          variant="surface"
          onPress={() => onChange(clamp(value - step))}
          disabled={value <= min}
        />
        <View
          className="min-w-[74px] items-center rounded-xl border px-2 py-2"
          style={{ borderColor: palette.border, backgroundColor: palette.surfaceAlt }}
          accessibilityLabel={`${label}: ${value}${unit ? ` ${unit}` : ''}`}
        >
          <AppText variant="monoStrong">
            {formatter ? formatter(value) : `${formatNumber(value)}${unit ? ` ${unit}` : ''}`}
          </AppText>
        </View>
        <IconButton
          icon="plus"
          label={`Increase ${label}`}
          size={34}
          variant="surface"
          onPress={() => onChange(clamp(value + step))}
          disabled={value >= max}
        />
      </View>
    </View>
  );
}

export function OptionCard({
  title,
  description,
  selected,
  onPress,
  leading,
  trailing,
  className,
}: {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
}) {
  const { palette, isDark } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}${description ? `. ${description}` : ''}`}
      onPress={onPress}
      className={cn('flex-row items-center gap-3 rounded-2xl border p-3.5', className)}
      style={({ pressed }) => [
        {
          borderColor: selected ? palette.primaryBorder : palette.border,
          backgroundColor: selected ? palette.primarySoft : isDark ? 'rgba(255,255,255,0.025)' : '#FFFFFF',
        },
        pressed ? { opacity: 0.8 } : null,
      ]}
    >
      {leading}
      <View className="flex-1">
        <AppText variant="bodyStrong" numberOfLines={1}>
          {title}
        </AppText>
        {description ? (
          <AppText variant="micro" tone="muted" className="mt-0.5" numberOfLines={2}>
            {description}
          </AppText>
        ) : null}
      </View>
      {trailing}
      <View
        className="h-5 w-5 items-center justify-center rounded-full border"
        style={{
          borderColor: selected ? palette.primaryText : palette.borderStrong,
          backgroundColor: selected ? palette.primary : 'transparent',
        }}
      >
        {selected ? <Icon name="check" size={12} color={palette.onPrimary} strokeWidth={2.6} /> : null}
      </View>
    </Pressable>
  );
}

export function SwitchRow({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  const { palette } = useTheme();
  return (
    <View className="flex-row items-center justify-between gap-4 py-2.5">
      <View className="flex-1">
        <AppText variant="bodyStrong">{label}</AppText>
        {description ? (
          <AppText variant="micro" tone="faint" className="mt-0.5">
            {description}
          </AppText>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        accessibilityRole="switch"
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: palette.mode === 'dark' ? '#26364C' : '#C3D0E2', true: withAlpha(palette.primary, 0.55) }}
        thumbColor={value ? palette.primary : palette.mode === 'dark' ? '#8DA1BA' : '#FFFFFF'}
        ios_backgroundColor={palette.mode === 'dark' ? '#26364C' : '#C3D0E2'}
      />
    </View>
  );
}

export function WeekdayPicker({
  value,
  onChange,
  label = 'Scheduled days',
}: {
  value: number[];
  onChange: (days: number[]) => void;
  label?: string;
}) {
  const { palette } = useTheme();
  const days = [
    { index: 1, label: 'M' },
    { index: 2, label: 'T' },
    { index: 3, label: 'W' },
    { index: 4, label: 'T' },
    { index: 5, label: 'F' },
    { index: 6, label: 'S' },
    { index: 0, label: 'S' },
  ];
  const allDays = days.map((day) => day.index);
  const isEveryDay = value.length === 0 || value.length === 7;
  const toggle = (index: number) => {
    if (isEveryDay) {
      onChange(allDays.filter((day) => day !== index));
      return;
    }
    const exists = value.includes(index);
    if (exists && value.length === 1) return;
    const next = exists ? value.filter((day) => day !== index) : [...value, index].sort();
    onChange(next);
  };
  return (
    <View>
      <View className="mb-2 flex-row items-center justify-between gap-2">
        <HudLabel tone="muted">{label}</HudLabel>
        {isEveryDay ? (
          <HudLabel tone="faint">EVERY DAY</HudLabel>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Schedule every day"
            onPress={() => onChange([])}
            hitSlop={8}
            className="flex-row items-center gap-1"
          >
            <AppText variant="micro" tone="accent">
              Every day
            </AppText>
          </Pressable>
        )}
      </View>
      <View className="flex-row justify-between gap-1.5">
        {days.map((day) => {
          const selected = isEveryDay || value.includes(day.index);
          return (
            <Pressable
              key={`${day.label}-${day.index}`}
              accessibilityRole="checkbox"
              accessibilityLabel={`Day ${day.label}`}
              accessibilityState={{ checked: selected }}
              onPress={() => toggle(day.index)}
              className="h-10 flex-1 items-center justify-center rounded-xl border"
              style={{
                borderColor: selected ? palette.primaryBorder : palette.border,
                backgroundColor: selected ? palette.primarySoft : 'transparent',
              }}
            >
              <AppText variant="monoStrong" tone={selected ? 'accent' : 'faint'}>
                {day.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function SwatchPicker({
  value,
  onChange,
  colors,
}: {
  value: string;
  onChange: (color: string) => void;
  colors: { dark: string; light: string }[];
}) {
  const { palette, isDark } = useTheme();
  return (
    <View className="flex-row flex-wrap gap-2.5">
      {colors.map((pair, index) => {
        const color = isDark ? pair.dark : pair.light;
        const selected = value === color;
        return (
          <Pressable
            key={`${pair.dark}-${index}`}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`Color option ${index + 1}`}
            onPress={() => onChange(color)}
            className="h-9 w-9 items-center justify-center rounded-full border"
            style={{ backgroundColor: color, borderColor: selected ? palette.text : 'transparent' }}
          >
            {selected ? <Icon name="check" size={16} color={isDark ? '#04120E' : '#FFFFFF'} strokeWidth={2.6} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
