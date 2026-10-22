import React, { useId, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { formatNumber } from '@/lib/format';
import { formatDateKey } from '@/domain/date';

export interface AreaPoint {
  date: string;
  value: number;
}

function niceMax(value: number): number {
  if (value <= 10) return 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export function AreaChart({
  points,
  height = 176,
  color,
  accessibilityLabel,
  showAxis = true,
}: {
  points: AreaPoint[];
  height?: number;
  color?: string;
  accessibilityLabel?: string;
  showAxis?: boolean;
}) {
  const { palette } = useTheme();
  const [width, setWidth] = useState(0);
  const id = `area-${useId().replace(/[:]/g, '')}`;
  const tint = color ?? palette.primary;
  const padding = { top: 14, right: 8, bottom: showAxis ? 24 : 6, left: showAxis ? 34 : 4 };
  const plotWidth = Math.max(1, width - padding.left - padding.right);
  const plotHeight = Math.max(1, height - padding.top - padding.bottom);
  const data = points.length ? points : [{ date: '', value: 0 }];
  const max = niceMax(Math.max(...data.map((point) => point.value), 1));
  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : plotWidth;
  const coords = data.map((point, index) => ({
    x: padding.left + (data.length > 1 ? index * stepX : plotWidth / 2),
    y: padding.top + plotHeight - (Math.min(point.value, max) / max) * plotHeight,
    point,
  }));

  const linePath = coords
    .map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L${(padding.left + plotWidth).toFixed(1)} ${(padding.top + plotHeight).toFixed(1)} L${padding.left} ${(padding.top + plotHeight).toFixed(1)} Z`;
  const gridLines = [0, 0.5, 1];
  const labelIndexes = data.length <= 1 ? [0] : [0, Math.floor((data.length - 1) / 2), data.length - 1];
  const total = data.reduce((sum, point) => sum + point.value, 0);
  const peak = data.reduce((best, point) => (point.value > best.value ? point : best), data[0]);

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      accessibilityRole="image"
      accessibilityLabel={
        accessibilityLabel ??
        `XP chart. ${formatNumber(total)} XP total, peak ${formatNumber(peak.value)} XP.`
      }
    >
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={tint} stopOpacity={0.3} />
              <Stop offset="70%" stopColor={tint} stopOpacity={0.06} />
              <Stop offset="100%" stopColor={tint} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {gridLines.map((fraction) => {
            const y = padding.top + plotHeight * fraction;
            return (
              <G key={fraction}>
                <Line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + plotWidth}
                  y2={y}
                  stroke={palette.border}
                  strokeWidth={1}
                  strokeDasharray="3 5"
                />
                {showAxis ? (
                  <SvgText
                    x={padding.left - 7}
                    y={y + 3.5}
                    fill={palette.textFaint}
                    fontSize={9}
                    textAnchor="end"
                    fontFamily="ChakraPetch_500Medium"
                  >
                    {formatNumber(Math.round(max * (1 - fraction)))}
                  </SvgText>
                ) : null}
              </G>
            );
          })}
          <Path d={areaPath} fill={`url(#${id})`} />
          <Path d={linePath} stroke={tint} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {coords.map(({ x, y, point }, index) =>
            point.value > 0 ? (
              <Circle
                key={`${point.date}-${index}`}
                cx={x}
                cy={y}
                r={index === coords.length - 1 ? 3.4 : 2.2}
                fill={palette.mode === 'dark' ? '#08111D' : '#FFFFFF'}
                stroke={tint}
                strokeWidth={index === coords.length - 1 ? 2.2 : 1.4}
              />
            ) : null,
          )}
          {showAxis
            ? labelIndexes.map((index) => {
                const entry = coords[index];
                if (!entry) return null;
                const label = entry.point.date ? formatDateKey(entry.point.date, 'short') : '';
                return (
                  <SvgText
                    key={`label-${index}`}
                    x={entry.x}
                    y={height - 6}
                    fill={palette.textFaint}
                    fontSize={9}
                    textAnchor={index === 0 ? 'start' : index === data.length - 1 ? 'end' : 'middle'}
                    fontFamily="ChakraPetch_500Medium"
                  >
                    {label}
                  </SvgText>
                );
              })
            : null}
        </Svg>
      ) : (
        <View style={{ height }} />
      )}
    </View>
  );
}
