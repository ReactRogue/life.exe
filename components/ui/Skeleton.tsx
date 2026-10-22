import React, { useEffect } from 'react';
import { View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { useReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/cn';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Quiet loading placeholder. Data loads from disk in milliseconds, so this is
 * only used for the first paint on slow devices and never for decorative shimmer.
 */
export function Skeleton({ width = '100%', height = 14, radius = 8, className, style }: SkeletonProps) {
  const { palette } = useTheme();
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      pulse.value = 0.55;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse, reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.4, 0.85]),
  }));

  return (
    <Animated.View
     
      className={cn('overflow-hidden', className)}
      style={[
        { width, height, borderRadius: radius, backgroundColor: palette.skeleton },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  const { palette } = useTheme();
  return (
    <View
      className="rounded-2xl border p-4"
      style={{ borderColor: palette.border, backgroundColor: palette.surface }}
    >
      <View className="flex-row items-center justify-between">
        <Skeleton width="42%" height={12} />
        <Skeleton width={38} height={12} />
      </View>
      <View className="mt-3">
        <Skeleton width="70%" height={18} radius={6} />
      </View>
      <View className="mt-3 gap-2">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            width={index === lines - 1 ? '55%' : '100%'}
            height={10}
            radius={5}
          />
        ))}
      </View>
    </View>
  );
}

export function SkeletonRow() {
  const { palette } = useTheme();
  return (
    <View
      className="flex-row items-center gap-3 py-3"
      style={{ borderBottomWidth: 1, borderBottomColor: palette.border }}
    >
      <Skeleton width={34} height={34} radius={12} />
      <View className="flex-1 gap-2">
        <Skeleton width="58%" height={12} />
        <Skeleton width="34%" height={9} />
      </View>
      <Skeleton width={42} height={12} />
    </View>
  );
}
