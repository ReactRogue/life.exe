import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { withAlpha } from '@/theme/palette';
import type { FrameItem } from '@/domain/cosmetics';
import { ProgressRing } from './ProgressRing';

function Sigil({ variant, color, accent, size }: { variant: number; color: string; accent: string; size: number }) {
  const common = {
    stroke: color,
    strokeWidth: 1.8,
    fill: 'none' as const,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  const index = ((variant % 6) + 6) % 6;
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {index === 0 ? (
        <>
          <Path d="M24 7 39 15.5v17L24 41 9 32.5v-17Z" {...common} />
          <Circle cx={24} cy={24} r={3.2} fill={accent} />
          <Line x1={24} y1={7.6} x2={24} y2={15} stroke={color} strokeWidth={1.4} />
          <Line x1={24} y1={33} x2={24} y2={40.4} stroke={color} strokeWidth={1.4} />
        </>
      ) : null}
      {index === 1 ? (
        <>
          <Path d="M8 19c4-9 28-13 32-3 3 8-20 15-27 10-5-3-2-9 5-11 8-3 17 0 17 0" {...common} />
          <Circle cx={24} cy={24} r={3} fill={accent} />
          <Circle cx={39} cy={15} r={1.8} fill={color} />
        </>
      ) : null}
      {index === 2 ? (
        <>
          <Rect x={11} y={9} width={6} height={30} rx={3} {...common} />
          <Rect x={21} y={15} width={6} height={24} rx={3} {...common} />
          <Rect x={31} y={4} width={6} height={24} rx={3} {...common} />
          <Circle cx={34} cy={36} r={2.4} fill={accent} />
        </>
      ) : null}
      {index === 3 ? (
        <>
          <Path d="M6 26h7l3.5-10 6 18 4-12 3 2h12" {...common} />
          <Circle cx={39} cy={34} r={2.4} fill={accent} />
          <Circle cx={9} cy={12} r={1.8} fill={color} />
        </>
      ) : null}
      {index === 4 ? (
        <>
          <Path d="M24 7 40 37H8Z" {...common} />
          <Path d="M24 19 31.5 33h-15Z" stroke={color} strokeWidth={1.4} fill={withAlpha(accent, 0.2)} />
          <Circle cx={24} cy={29} r={2.4} fill={accent} />
        </>
      ) : null}
      {index === 5 ? (
        <>
          <Circle cx={24} cy={24} r={13} {...common} />
          <Line x1={24} y1={5} x2={24} y2={11} stroke={color} strokeWidth={1.6} />
          <Line x1={24} y1={37} x2={24} y2={43} stroke={color} strokeWidth={1.6} />
          <Line x1={5} y1={24} x2={11} y2={24} stroke={color} strokeWidth={1.6} />
          <Line x1={37} y1={24} x2={43} y2={24} stroke={color} strokeWidth={1.6} />
          <Circle cx={24} cy={24} r={4.4} fill={accent} />
        </>
      ) : null}
    </Svg>
  );
}

export interface AvatarProps {
  sigil?: number;
  frame?: FrameItem;
  size?: number;
  progress?: number;
  showRing?: boolean;
  className?: string;
}

export function Avatar({ sigil = 0, frame, size = 76, progress, showRing = true }: AvatarProps) {
  const { palette, isDark } = useTheme();
  const colors = frame?.colors ?? [palette.gradient[0], palette.gradient[1]];
  const stroke = Math.max(2, Math.round(size * 0.035));
  const inner = size - stroke * 4 - 6;
  const ringProgress = progress ?? 1;

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      {showRing ? (
        <View style={{ position: 'absolute' }}>
          <ProgressRing
            progress={ringProgress}
            size={size}
            strokeWidth={stroke}
            colors={colors}
            dashedTrack={frame?.style === 'dashed'}
            accessibilityLabel="Level progress"
          />
        </View>
      ) : null}
      <View
        style={{
          width: inner,
          height: inner,
          borderRadius: inner / 2,
          backgroundColor: isDark ? '#0A1522' : '#FFFFFF',
          borderWidth: 1,
          borderColor: withAlpha(colors[0], 0.35),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Sigil variant={sigil} size={inner * 0.64} color={isDark ? '#DCECFF' : '#0A1526'} accent={colors[0]} />
        {frame?.style === 'orbit' ? (
          <View
            style={{
              position: 'absolute',
              width: Math.max(4, size * 0.06),
              height: Math.max(4, size * 0.06),
              borderRadius: size,
              backgroundColor: colors[1],
              top: -2,
              right: inner * 0.18,
            }}
          />
        ) : null}
      </View>
    </View>
  );
}
