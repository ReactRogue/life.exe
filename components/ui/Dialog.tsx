import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon, type IconName } from '@/components/icons/Icon';
import { AppText } from './Text';
import { Button, IconButton } from './Button';
import { cn } from '@/lib/cn';

export interface DialogAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: IconName;
}

export interface DialogProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: IconName;
  children?: React.ReactNode;
  primaryAction?: DialogAction;
  secondaryAction?: DialogAction;
  dismissible?: boolean;
  className?: string;
}

export function Dialog({
  visible,
  onClose,
  title,
  description,
  icon,
  children,
  primaryAction,
  secondaryAction,
  dismissible = true,
  className,
}: DialogProps) {
  const { palette } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => (dismissible ? onClose() : undefined)}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 items-center justify-center px-5">
          <Pressable
            className="absolute inset-0"
            onPress={dismissible ? onClose : undefined}
            accessibilityRole="button"
            accessibilityLabel="Close dialog"
            style={{ backgroundColor: palette.overlay }}
          />
          <View
            className={cn('w-full max-w-[440px] rounded-3xl border p-5', className)}
            style={{
              backgroundColor: palette.mode === 'dark' ? '#0C1624' : '#FFFFFF',
              borderColor: palette.borderStrong,
              shadowColor: '#000000',
              shadowOpacity: 0.35,
              shadowRadius: 30,
              shadowOffset: { width: 0, height: 16 },
              elevation: 12,
            }}
            accessibilityViewIsModal
            accessibilityLabel={title}
          >
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-row items-center gap-3 flex-1">
                {icon ? (
                  <View
                    className="h-11 w-11 items-center justify-center rounded-2xl border"
                    style={{ backgroundColor: palette.primarySoft, borderColor: palette.primaryBorder }}
                  >
                    <Icon name={icon} size={20} color={palette.primaryText} />
                  </View>
                ) : null}
                <View className="flex-1">
                  <AppText variant="h2" accessibilityRole="header">
                    {title}
                  </AppText>
                  {description ? (
                    <AppText variant="caption" tone="muted" className="mt-1">
                      {description}
                    </AppText>
                  ) : null}
                </View>
              </View>
              {dismissible ? (
                <IconButton icon="close" label="Close dialog" variant="ghost" size={36} onPress={onClose} />
              ) : null}
            </View>

            {children ? <View className="mt-4">{children}</View> : null}

            {primaryAction || secondaryAction ? (
              <View className="mt-5 flex-row gap-2.5">
                {secondaryAction ? (
                  <Button
                    label={secondaryAction.label}
                    variant={secondaryAction.variant ?? 'secondary'}
                    icon={secondaryAction.icon}
                    onPress={secondaryAction.onPress}
                    className="flex-1"
                  />
                ) : null}
                {primaryAction ? (
                  <Button
                    label={primaryAction.label}
                    variant={primaryAction.variant ?? 'primary'}
                    icon={primaryAction.icon}
                    onPress={primaryAction.onPress}
                    className="flex-1"
                  />
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
