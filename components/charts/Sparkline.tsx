import React from 'react';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useId } from 'react';
import { useTheme } from '@/theme/ThemeProvider';
import { withAlpha } from '@/theme/palette';

export function Sparkline({
  data,
  width = 120,
  height = 40,
  color,
  fill = true,
  accessibilityLabel,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
  accessibilityLabel?: string;
}) {
  const { palette } = useTheme();
  const id = `spark-${useId().replace(/[:]/g, '')}`;
  const tint = color ?? palette.primary;
  const values = data.length ? data : [0];
  const max = Math.max(1, ...values);
  const stepX = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((value, index) => {
    const x = values.length > 1 ? index * stepX : width / 2;
    const y = height - 3 - (value / max) * (height - 8);
    return [x, y] as const;
  });
  const linePath = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${width} ${height} L0 ${height} Z`;

  return (
    <Svg
      width={width}
      height={height}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? 'Activity trend'}
    >
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={tint} stopOpacity={0.35} />
          <Stop offset="100%" stopColor={tint} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      {fill ? <Path d={areaPath} fill={`url(#${id})`} /> : null}
      <Path d={linePath} stroke={tint} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d={`M${points[points.length - 1][0] - 2.2} ${points[points.length - 1][1]} a2.2 2.2 0 1 0 4.4 0 a2.2 2.2 0 1 0 -4.4 0`}
        fill={tint}
      />
    </Svg>
  );
}

export function MicroBars({
  data,
  width = 120,
  height = 40,
  color,
  accessibilityLabel,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  accessibilityLabel?: string;
}) {
  const { palette } = useTheme();
  const tint = color ?? palette.primary;
  const values = data.length ? data : [0];
  const max = Math.max(1, ...values);
  const gap = 3;
  const barWidth = Math.max(2, (width - gap * (values.length - 1)) / values.length);
  return (
    <Svg
      width={width}
      height={height}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? 'Daily activity bars'}
    >
      {values.map((value, index) => {
        const barHeight = Math.max(2, (value / max) * (height - 2));
        return (
          <Path
            key={index}
            d={`M${index * (barWidth + gap)} ${height - barHeight} h${barWidth} v${barHeight} h-${barWidth} Z`}
            fill={withAlpha(tint, value > 0 ? 0.85 : 0.18)}
          />
        );
      })}
    </Svg>
  );
}
