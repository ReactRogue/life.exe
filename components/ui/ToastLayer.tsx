import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon, type IconName } from '@/components/icons/Icon';
import { AppText } from './Text';
import { withAlpha } from '@/theme/palette';

const TONE: Record<string, { icon: IconName; colorKey: 'primary' | 'coin' | 'danger' | 'success' }> = {
  success: { icon: 'check', colorKey: 'success' },
  info: { icon: 'info', colorKey: 'primary' },
  error: { icon: 'close', colorKey: 'danger' },
  xp: { icon: 'bolt', colorKey: 'primary' },
  coin: { icon: 'coin', colorKey: 'coin' },
};

export function ToastLayer() {
  const { toast, dismissToast } = useAppStore();
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();

  if (!toast) return null;
  const tone = TONE[toast.tone] ?? TONE.info;
  const color =
    tone.colorKey === 'coin'
      ? palette.coin
      : tone.colorKey === 'danger'
        ? palette.dangerText
        : tone.colorKey === 'success'
          ? palette.successText
          : palette.primaryText;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: insets.top + 8,
        left: 0,
        right: 0,
        zIndex: 80,
        alignItems: 'center',
        paddingHorizontal: 20,
      }}
    >
      <Animated.View
        key={toast.id}
        entering={FadeInDown.duration(220)}
        exiting={FadeOutUp.duration(180)}
        style={{ maxWidth: 560, width: '100%' }}
      >
        <Pressable
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          onPress={dismissToast}
          className="flex-row items-center gap-2.5 rounded-2xl border px-4 py-3"
          style={{
            backgroundColor: palette.mode === 'dark' ? '#101E30' : '#FFFFFF',
            borderColor: withAlpha(color, 0.35),
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }}
        >
          <View
            className="h-7 w-7 items-center justify-center rounded-full"
            style={{ backgroundColor: withAlpha(color, 0.15) }}
          >
            <Icon name={tone.icon} size={14} color={color} />
          </View>
          <AppText variant="caption" className="flex-1" style={{ color: palette.text }}>
            {toast.message}
          </AppText>
          <Icon name="close" size={14} color={palette.textFaint} />
        </Pressable>
      </Animated.View>
    </View>
  );
}
