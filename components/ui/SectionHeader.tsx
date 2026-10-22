import React from 'react';
import { View } from 'react-native';
import { cn } from '@/lib/cn';
import { HudLabel, AppText } from './Text';
import { LinkButton } from './Button';

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  actionLabel,
  onAction,
  className,
  actionIcon,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  actionIcon?: 'chevronRight' | 'arrowUpRight' | 'plus';
}) {
  return (
    <View className={cn('mb-3 flex-row items-end justify-between gap-3', className)}>
      <View className="flex-1">
        {eyebrow ? <HudLabel className="mb-1">{eyebrow}</HudLabel> : null}
        <AppText variant="h2" accessibilityRole="header">
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted" className="mt-0.5">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <LinkButton label={actionLabel} icon={actionIcon ?? 'chevronRight'} onPress={onAction} />
      ) : null}
    </View>
  );
}
