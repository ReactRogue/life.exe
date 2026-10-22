import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '@/lib/cn';
import { useTheme } from '@/theme/ThemeProvider';
import { useReducedMotion } from '@/lib/motion';

export interface ProgressBarProps {
  progress: number;
  height?: number;
  color?: string;
  gradient?: readonly [string, string];
  trackColor?: string;
  className?: string;
  accessibilityLabel?: string;
  animate?: boolean;
}

export function ProgressBar({
  progress,
  height = 8,
  color,
  gradient,
  trackColor,
  className,
  accessibilityLabel,
  animate = true,
}: ProgressBarProps) {
  const { palette } = useTheme();
  const reduced = useReducedMotion();
  const [trackWidth, setTrackWidth] = useState(0);
  const clamped = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const animated = useSharedValue(0);

  useEffect(() => {
    if (!animate || reduced) {
      animated.value = clamped;
      return;
    }
    animated.value = withTiming(clamped, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [animated, clamped, animate, reduced]);

  const fillStyle = useAnimatedStyle(() => ({
    width: trackWidth * animated.value,
  }));

  return (
    <View
      className={cn('w-full overflow-hidden', className)}
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: trackColor ?? (palette.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(10,21,38,0.08)'),
      }}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Animated.View style={[{ height: '100%', borderRadius: height / 2, overflow: 'hidden' }, fillStyle]}>
        {gradient ? (
          <LinearGradient
            colors={[gradient[0], gradient[1]]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1 }}
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: color ?? palette.primary }} />
        )}
      </Animated.View>
    </View>
  );
}

export function SegmentBar({
  segments,
  height = 8,
  className,
}: {
  segments: { value: number; color: string }[];
  height?: number;
  className?: string;
}) {
  const { palette } = useTheme();
  const total = Math.max(0.0001, segments.reduce((sum, segment) => sum + segment.value, 0));
  return (
    <View
      className={cn('w-full flex-row overflow-hidden rounded-full', className)}
      style={{ height, backgroundColor: palette.skeleton }}
    >
      {segments.map((segment, index) => (
        <View
          key={`${segment.color}-${index}`}
          style={{
            width: `${(segment.value / total) * 100}%`,
            backgroundColor: segment.color,
            height: '100%',
          }}
        />
      ))}
    </View>
  );
}
