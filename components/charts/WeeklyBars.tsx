import React from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useId } from 'react';
import { useTheme } from '@/theme/ThemeProvider';
import { formatWeekday } from '@/domain/date';
import { AppText } from '@/components/ui/Text';
import { withAlpha } from '@/theme/palette';

export interface WeeklyBarDatum {
  date: string;
  value: number;
  count: number;
  isToday: boolean;
}

export function WeeklyBars({
  data,
  height = 120,
  onSelect,
  selectedDate,
}: {
  data: WeeklyBarDatum[];
  height?: number;
  onSelect?: (date: string) => void;
  selectedDate?: string;
}) {
  const { palette, isDark } = useTheme();
  const id = `bars-${useId().replace(/[:]/g, '')}`;
  const max = Math.max(1, ...data.map((datum) => datum.value));
  const barWidth = 22;
  const chartHeight = height - 26;

  return (
    <View className="flex-row items-end justify-between gap-1">
      {data.map((datum) => {
        const ratio = Math.max(0, Math.min(1, datum.value / max));
        const barHeight = Math.max(14, ratio * chartHeight);
        const active = datum.date === selectedDate || (!selectedDate && datum.isToday);
        return (
          <Pressable
            key={datum.date}
            accessibilityRole="button"
            accessibilityLabel={`${formatWeekday(datum.date, 'short')}: ${datum.value} XP, ${datum.count} completions`}
            accessibilityState={{ selected: active }}
            onPress={() => onSelect?.(datum.date)}
            className="flex-1 items-center gap-2"
            style={({ pressed }) => (pressed ? { opacity: 0.7 } : null)}
          >
            <View style={{ height: chartHeight, justifyContent: 'flex-end' }}>
              <Svg width={barWidth} height={barHeight}>
                <Defs>
                  <LinearGradient id={`${id}-${datum.date}`} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={palette.gradient[0]} stopOpacity={active ? 1 : 0.8} />
                    <Stop offset="100%" stopColor={palette.gradient[1]} stopOpacity={active ? 0.9 : 0.55} />
                  </LinearGradient>
                </Defs>
                <Path
                  d={`M0 6 a6 6 0 0 1 6 -6 h${barWidth - 12} a6 6 0 0 1 6 6 v${barHeight - 6} h-${barWidth} Z`}
                  fill={
                    datum.value > 0
                      ? `url(#${id}-${datum.date})`
                      : isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(10,21,38,0.06)'
                  }
                />
              </Svg>
            </View>
            <View className="items-center">
              <AppText variant="micro" style={{ color: active ? palette.primaryText : palette.textFaint }}>
                {formatWeekday(datum.date, 'narrow')}
              </AppText>
              {datum.isToday ? (
                <View
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: withAlpha(palette.primary, 0.9),
                    marginTop: 3,
                  }}
                />
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
