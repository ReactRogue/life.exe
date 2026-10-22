import React, { useEffect, useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { useReducedMotion } from '@/lib/motion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  colors?: readonly [string, string];
  trackColor?: string;
  children?: React.ReactNode;
  accessibilityLabel?: string;
  dashedTrack?: boolean;
  cap?: 'round' | 'butt';
}

export function ProgressRing({
  progress,
  size = 96,
  strokeWidth = 8,
  colors,
  trackColor,
  children,
  accessibilityLabel,
  dashedTrack = false,
  cap = 'round',
}: ProgressRingProps) {
  const { palette } = useTheme();
  const reduced = useReducedMotion();
  const gradientId = `ring-${useId().replace(/[:]/g, '')}`;
  const clamped = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animated = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      animated.value = clamped;
      return;
    }
    animated.value = withTiming(clamped, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [animated, clamped, reduced]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animated.value),
  }));

  const from = colors?.[0] ?? palette.gradient[0];
  const to = colors?.[1] ?? palette.gradient[1];

  return (
    <View
      style={{ width: size, height: size }}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={from} />
            <Stop offset="100%" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor ?? (palette.mode === 'dark' ? 'rgba(255,255,255,0.09)' : 'rgba(10,21,38,0.08)')}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={dashedTrack ? `${strokeWidth * 1.6} ${strokeWidth * 1.6}` : undefined}
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap={cap}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          animatedProps={animatedProps}
        />
      </Svg>
      {children ? (
        <View className="absolute inset-0 items-center justify-center">{children}</View>
      ) : null}
    </View>
  );
}
