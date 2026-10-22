import React from 'react';
import { Text, type TextProps, type TextStyle, type StyleProp } from 'react-native';
import { cn } from '@/lib/cn';
import { useTheme } from '@/theme/ThemeProvider';

export type TextVariant =
  | 'display'
  | 'hero'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'label'
  | 'micro'
  | 'mono'
  | 'monoStrong'
  | 'number'
  | 'numberLarge';

export type TextTone =
  | 'default'
  | 'muted'
  | 'faint'
  | 'accent'
  | 'danger'
  | 'coin'
  | 'inverse'
  | 'success';

const VARIANTS: Record<TextVariant, string> = {
  display: 'font-display text-[30px] leading-[36px] tracking-[0.01em]',
  hero: 'font-display-bold text-[40px] leading-[44px] tracking-[0.01em]',
  h1: 'font-display text-[24px] leading-[30px] tracking-[0.02em]',
  h2: 'font-display text-[19px] leading-[26px] tracking-[0.02em]',
  h3: 'font-sans-semibold text-[16px] leading-[22px]',
  body: 'font-sans text-[15px] leading-[22px]',
  bodyStrong: 'font-sans-medium text-[15px] leading-[22px]',
  caption: 'font-sans text-[13px] leading-[19px]',
  label: 'font-mono text-[10px] uppercase tracking-hud',
  micro: 'font-sans text-[11px] leading-[16px]',
  mono: 'font-mono text-[13px] leading-[18px] tracking-[0.06em]',
  monoStrong: 'font-display text-[14px] leading-[18px] tracking-[0.08em]',
  number: 'font-display text-[24px] leading-[28px] tracking-[0.01em]',
  numberLarge: 'font-display-bold text-[36px] leading-[40px] tracking-[0.01em]',
};

/**
 * Tones resolve against the active palette instead of `dark:` utilities so
 * every string keeps its contrast ratio under both themes and every accent.
 */
function toneColor(tone: TextTone, palette: ReturnType<typeof useTheme>['palette']): string {
  switch (tone) {
    case 'muted':
      return palette.textMuted;
    case 'faint':
      return palette.textFaint;
    case 'accent':
      return palette.primaryText;
    case 'danger':
      return palette.dangerText;
    case 'coin':
      return palette.coin;
    case 'success':
      return palette.successText;
    case 'inverse':
      return palette.onPrimary;
    default:
      return palette.text;
  }
}

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  align?: 'left' | 'center' | 'right';
  uppercase?: boolean;
}

export function AppText({
  variant = 'body',
  tone = 'default',
  align,
  uppercase,
  className,
  style,
  children,
  ...rest
}: AppTextProps) {
  const { palette } = useTheme();
  const numeric =
    variant === 'number' ||
    variant === 'numberLarge' ||
    variant === 'mono' ||
    variant === 'monoStrong' ||
    variant === 'label';

  return (
    <Text
      className={cn(
        VARIANTS[variant],
        uppercase && 'uppercase',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className,
      )}
      style={[
        { color: toneColor(tone, palette) },
        numeric ? { fontVariant: ['tabular-nums'] } : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

export function HudLabel({
  children,
  className,
  tone = 'faint',
  numberOfLines,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: TextTone;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <AppText variant="label" tone={tone} className={className} numberOfLines={numberOfLines} style={style}>
      {children}
    </AppText>
  );
}
