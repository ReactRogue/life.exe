import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { withAlpha } from '@/theme/palette';

const GRID_STEP = 44;

export function AmbientBackground() {
  const { palette, isDark } = useTheme();
  const { width, height } = useWindowDimensions();

  const lines = useMemo(() => {
    const vertical = Math.min(30, Math.ceil(width / GRID_STEP));
    const horizontal = Math.min(48, Math.ceil((height + 200) / GRID_STEP));
    return {
      vertical: Array.from({ length: vertical }),
      horizontal: Array.from({ length: horizontal }),
    };
  }, [width, height]);

  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden" style={{ backgroundColor: palette.bg }}>
      <LinearGradient
        colors={[withAlpha(palette.gradient[0], isDark ? 0.1 : 0.07), 'transparent', 'transparent']}
        start={{ x: 0.9, y: 0 }}
        end={{ x: 0.3, y: 0.55 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <LinearGradient
        colors={['transparent', withAlpha(palette.gradient[1], isDark ? 0.07 : 0.05), 'transparent']}
        start={{ x: 0.1, y: 0.55 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <View className="absolute inset-0">
        {lines.vertical.map((_, index) => (
          <View
            key={`v-${index}`}
            className="absolute top-0 bottom-0 w-px"
            style={{ left: index * GRID_STEP, backgroundColor: palette.grid }}
          />
        ))}
        {lines.horizontal.map((_, index) => (
          <View
            key={`h-${index}`}
            className="absolute left-0 right-0 h-px"
            style={{ top: index * GRID_STEP, backgroundColor: palette.grid }}
          />
        ))}
      </View>

      <View
        className="absolute rounded-full"
        style={{
          width: 380,
          height: 380,
          top: -160,
          right: -120,
          opacity: isDark ? 0.5 : 0.35,
        }}
      >
        <LinearGradient
          colors={[withAlpha(palette.gradient[0], 0.3), withAlpha(palette.gradient[0], 0)]}
          start={{ x: 0.2, y: 0.2 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, borderRadius: 380 }}
        />
      </View>

      <View
        className="absolute rounded-full"
        style={{
          width: 320,
          height: 320,
          bottom: -120,
          left: -100,
          opacity: isDark ? 0.32 : 0.22,
        }}
      >
        <LinearGradient
          colors={[withAlpha(palette.gradient[1], 0.24), 'transparent']}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, borderRadius: 320 }}
        />
      </View>

      <View
        className="absolute left-0 right-0 top-0 h-px"
        style={{ backgroundColor: palette.primaryBorder }}
      />
    </View>
  );
}
