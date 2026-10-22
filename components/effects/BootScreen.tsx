import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText, HudLabel } from '@/components/ui/Text';
import { useReducedMotion } from '@/lib/motion';

export function BootScreen() {
  const { palette, isDark } = useTheme();
  const reduced = useReducedMotion();
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    rotation.value = withRepeat(withTiming(360, { duration: 9000, easing: Easing.linear }), -1);
    pulse.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [pulse, reduced, rotation]);

  const ringStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));
  const pulseStyle = useAnimatedStyle(() => ({ opacity: 0.35 + pulse.value * 0.4 }));

  return (
    <View
      className="flex-1 items-center justify-center px-8"
      style={{ backgroundColor: palette.bg }}
      accessibilityLabel="Life.exe is starting"
    >
      <View style={{ width: 168, height: 168, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[{ position: 'absolute' }, ringStyle]}>
          <Svg width={168} height={168} viewBox="0 0 168 168">
            <Circle
              cx={84}
              cy={84}
              r={78}
              stroke={palette.primaryBorder}
              strokeWidth={1}
              strokeDasharray="4 10"
              fill="none"
            />
            <Circle cx={84} cy={6} r={2.4} fill={palette.primary} />
          </Svg>
        </Animated.View>
        <Animated.View style={[pulseStyle]}>
          <Svg width={116} height={116} viewBox="0 0 116 116">
            <Path
              d="M58 8 100 32v52L58 108 16 84V32Z"
              stroke={palette.primary}
              strokeWidth={1.6}
              fill={isDark ? 'rgba(92,242,198,0.04)' : 'rgba(6,122,91,0.04)'}
            />
            <Path
              d="M58 32 78 43.5v23L58 78 38 66.5v-23Z"
              stroke={palette.primaryBorder}
              strokeWidth={1.2}
              fill="none"
            />
            <Circle cx={58} cy={55} r={4} fill={palette.primary} />
          </Svg>
        </Animated.View>
      </View>
      <AppText variant="display" className="mt-8 tracking-[0.24em]">
        LIFE.EXE
      </AppText>
      <HudLabel tone="accent" className="mt-2">
        PERSONAL OPERATING SYSTEM
      </HudLabel>
      <View className="mt-8 flex-row items-center gap-2">
        <ActivityIndicator size="small" color={palette.primary} />
        <HudLabel tone="faint">INITIALIZING CORE</HudLabel>
      </View>
      <AppText variant="micro" tone="faint" className="mt-2">
        Loading your local save…
      </AppText>
    </View>
  );
}
