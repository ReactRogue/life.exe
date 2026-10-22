import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon, type IconName } from '@/components/icons/Icon';
import { AppText, HudLabel } from './Text';
import { Button } from './Button';
import { cn } from '@/lib/cn';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: IconName;
  eyebrow?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon = 'orbit',
  eyebrow = 'NO SIGNAL',
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  compact = false,
  className,
}: EmptyStateProps) {
  const { palette } = useTheme();
  return (
    <View
      className={cn(
        'items-center rounded-3xl border px-5',
        compact ? 'py-6' : 'py-8',
        className,
      )}
      style={{ borderColor: palette.border, borderStyle: 'dashed', backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.55)' }}
    >
      <View className="mb-4 items-center justify-center" style={{ width: 76, height: 76 }}>
        <View
          className="absolute inset-0 rounded-full border"
          style={{ borderColor: palette.primaryBorder, borderStyle: 'dashed' }}
        />
        <View
          className="h-12 w-12 items-center justify-center rounded-2xl border"
          style={{ backgroundColor: palette.primarySoft, borderColor: palette.primaryBorder }}
        >
          <Icon name={icon} size={22} color={palette.primaryText} />
        </View>
      </View>
      <HudLabel>{eyebrow}</HudLabel>
      <AppText variant="h2" align="center" className="mt-1.5">
        {title}
      </AppText>
      <AppText variant="caption" tone="muted" align="center" className="mt-1.5 max-w-[300px]">
        {description}
      </AppText>
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          icon="plus"
          size="sm"
          onPress={onAction}
          className="mt-4"
        />
      ) : null}
      {secondaryLabel && onSecondary ? (
        <Button
          label={secondaryLabel}
          variant="ghost"
          size="sm"
          onPress={onSecondary}
          className="mt-1"
        />
      ) : null}
    </View>
  );
}
