import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { withAlpha } from '@/theme/palette';
import { formatDateKey } from '@/domain/date';
import type { HeatmapCell, HeatmapData } from '@/domain/selectors';
import { AppText, HudLabel } from '@/components/ui/Text';
import { formatNumber } from '@/lib/format';

const GAP = 3;
const LABEL_WIDTH = 22;

export function Heatmap({ data }: { data: HeatmapData }) {
  const { palette } = useTheme();
  const [width, setWidth] = useState(320);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = data.columns.flat().find((cell) => cell.isToday);
    return today?.date ?? data.columns[data.columns.length - 1]?.[6]?.date ?? '';
  });

  const weeks = data.columns.length;
  const cell = useMemo(() => {
    const available = width - LABEL_WIDTH - GAP * (weeks + 1);
    return Math.max(11, Math.min(22, Math.floor(available / weeks)));
  }, [width, weeks]);

  const selected =
    data.columns.flat().find((entry) => entry.date === selectedDate) ??
    data.columns.flat().find((entry) => entry.isToday) ??
    null;

  const weekdayLabels = useMemo(() => ['M', 'T', 'W', 'T', 'F', 'S', 'S'], []);

  const levelColor = (level: number) => {
    if (level <= 0) return palette.skeleton;
    const alpha = [0, 0.24, 0.42, 0.68, 1][level] ?? 1;
    return withAlpha(palette.primary, alpha);
  };

  return (
    <View>
      <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        <View style={{ height: 16, marginLeft: LABEL_WIDTH }}>
          {data.months.map((month) => (
            <View
              key={`${month.label}-${month.column}`}
              style={{ position: 'absolute', left: month.column * (cell + GAP) }}
            >
              <HudLabel tone="faint">{month.label.toUpperCase()}</HudLabel>
            </View>
          ))}
        </View>

        <View className="flex-row" style={{ gap: GAP }}>
          <View style={{ width: LABEL_WIDTH, gap: GAP }}>
            {weekdayLabels.map((label, index) => (
              <View key={`${label}-${index}`} style={{ height: cell, justifyContent: 'center' }}>
                <AppText variant="micro" tone="faint" style={{ fontSize: 9 }}>
                  {label}
                </AppText>
              </View>
            ))}
          </View>
          {data.columns.map((column, columnIndex) => (
            <View key={column[0]?.date ?? columnIndex} style={{ gap: GAP }}>
              {column.map((entry) => (
                <DayCell
                  key={entry.date}
                  cell={entry}
                  size={cell}
                  color={levelColor(entry.level)}
                  selected={entry.date === selectedDate}
                  onPress={() => setSelectedDate(entry.date)}
                />
              ))}
            </View>
          ))}
        </View>

        <View className="mt-3 flex-row items-center justify-between">
          <HudLabel tone="faint">
            {data.activeDays} ACTIVE DAYS · {formatNumber(data.totalXp)} XP
          </HudLabel>
          <View className="flex-row items-center gap-1">
            <HudLabel tone="faint">QUIET</HudLabel>
            {[0, 1, 2, 3, 4].map((level) => (
              <View
                key={level}
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 2,
                  backgroundColor: levelColor(level),
                }}
              />
            ))}
            <HudLabel tone="faint">LOUD</HudLabel>
          </View>
        </View>
      </View>

      {selected ? (
        <View
          className="mt-4 flex-row items-center justify-between gap-3 rounded-2xl border px-3.5 py-3"
          style={{ borderColor: palette.border, backgroundColor: palette.surfaceAlt }}
        >
          <View className="flex-1">
            <AppText variant="caption" className="font-sans-medium">
              {formatDateKey(selected.date, 'long')}
            </AppText>
            <AppText variant="micro" tone="faint" className="mt-0.5">
              {selected.isFuture
                ? 'Scheduled for later'
                : selected.level === 0
                  ? 'Quiet day — a grace day keeps momentum safe'
                  : `${selected.count} ${selected.count === 1 ? 'quest' : 'quests'} logged`}
            </AppText>
          </View>
          <View className="items-end">
            <AppText variant="monoStrong" tone="accent">
              +{formatNumber(selected.xp)} XP
            </AppText>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function DayCell({
  cell,
  size,
  color,
  selected,
  onPress,
}: {
  cell: HeatmapCell;
  size: number;
  color: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  if (cell.isFuture) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: Math.max(3, size * 0.24),
          borderWidth: 1,
          borderColor: palette.border,
          borderStyle: 'dashed',
          opacity: 0.5,
        }}
      />
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${formatDateKey(cell.date, 'long')}: ${cell.xp} XP, ${cell.count} completions`}
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(3, size * 0.24),
        backgroundColor: color,
        borderWidth: cell.isToday || selected ? 1.5 : 0,
        borderColor: selected ? palette.text : palette.primaryText,
      }}
    />
  );
}
