import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';

export type IconName =
  | 'deck'
  | 'quests'
  | 'stats'
  | 'profile'
  | 'plus'
  | 'minus'
  | 'check'
  | 'close'
  | 'chevronRight'
  | 'chevronLeft'
  | 'chevronDown'
  | 'edit'
  | 'trash'
  | 'more'
  | 'archive'
  | 'arrowLeft'
  | 'arrowUpRight'
  | 'settings'
  | 'download'
  | 'upload'
  | 'refresh'
  | 'search'
  | 'filter'
  | 'copy'
  | 'flame'
  | 'coin'
  | 'bolt'
  | 'spark'
  | 'trophy'
  | 'calendar'
  | 'clock'
  | 'target'
  | 'shield'
  | 'wave'
  | 'orbit'
  | 'layers'
  | 'signal'
  | 'hex'
  | 'lock'
  | 'moon'
  | 'sun'
  | 'heart'
  | 'book'
  | 'palette'
  | 'users'
  | 'compass'
  | 'flask'
  | 'star'
  | 'pulse'
  | 'grid'
  | 'info'
  | 'save';

type Primitive =
  | { tag: 'path'; d: string; fill?: boolean }
  | { tag: 'circle'; cx: number; cy: number; r: number; fill?: boolean }
  | { tag: 'rect'; x: number; y: number; w: number; h: number; rx?: number; fill?: boolean }
  | { tag: 'line'; x1: number; y1: number; x2: number; y2: number };

const ICONS: Record<IconName, Primitive[]> = {
  deck: [
    { tag: 'path', d: 'M12 3.2 20 7.7v8.6L12 20.8 4 16.3V7.7Z' },
    { tag: 'circle', cx: 12, cy: 12, r: 2.4 },
    { tag: 'path', d: 'M12 3.4v6.2M20 7.7l-5.6 3.1M4 7.7l5.6 3.1M12 14.4v6.2' },
  ],
  quests: [
    { tag: 'circle', cx: 12, cy: 12, r: 6.2 },
    { tag: 'path', d: 'M12 2.6v3.4M12 18v3.4M2.6 12H6M18 12h3.4' },
    { tag: 'circle', cx: 12, cy: 12, r: 1.5, fill: true },
  ],
  stats: [
    { tag: 'rect', x: 3.6, y: 13.2, w: 3.4, h: 7, rx: 1.2, fill: true },
    { tag: 'rect', x: 10.3, y: 8.8, w: 3.4, h: 11.4, rx: 1.2, fill: true },
    { tag: 'rect', x: 17, y: 4.4, w: 3.4, h: 15.8, rx: 1.2, fill: true },
    { tag: 'line', x1: 2.6, y1: 21, x2: 21.4, y2: 21 },
  ],
  profile: [
    { tag: 'circle', cx: 12, cy: 8.2, r: 3.5 },
    { tag: 'path', d: 'M4.6 20.6c0-4 3.3-6.3 7.4-6.3s7.4 2.3 7.4 6.3' },
  ],
  plus: [
    { tag: 'line', x1: 12, y1: 5, x2: 12, y2: 19 },
    { tag: 'line', x1: 5, y1: 12, x2: 19, y2: 12 },
  ],
  minus: [{ tag: 'line', x1: 5, y1: 12, x2: 19, y2: 12 }],
  check: [{ tag: 'path', d: 'm5 12.6 4.2 4.2L19 6.8' }],
  close: [
    { tag: 'line', x1: 6, y1: 6, x2: 18, y2: 18 },
    { tag: 'line', x1: 18, y1: 6, x2: 6, y2: 18 },
  ],
  chevronRight: [{ tag: 'path', d: 'm9.2 5.2 6.8 6.8-6.8 6.8' }],
  chevronLeft: [{ tag: 'path', d: 'm14.8 5.2-6.8 6.8 6.8 6.8' }],
  chevronDown: [{ tag: 'path', d: 'm5.2 9.2 6.8 6.8 6.8-6.8' }],
  edit: [
    { tag: 'path', d: 'M15.4 4.6a2.2 2.2 0 0 1 3.1 3.1L7.7 18.5l-4.1 1.1 1.1-4.1Z' },
    { tag: 'line', x1: 13.8, y1: 6.2, x2: 17.8, y2: 10.2 },
  ],
  trash: [
    { tag: 'path', d: 'M4.4 7h15.2' },
    { tag: 'path', d: 'M9.4 7V4.8h5.2V7' },
    { tag: 'path', d: 'M6.6 7 7.7 20.2h8.6L17.4 7' },
    { tag: 'line', x1: 10.3, y1: 10.6, x2: 10.3, y2: 16.8 },
    { tag: 'line', x1: 13.7, y1: 10.6, x2: 13.7, y2: 16.8 },
  ],
  more: [
    { tag: 'circle', cx: 12, cy: 5.4, r: 1.5, fill: true },
    { tag: 'circle', cx: 12, cy: 12, r: 1.5, fill: true },
    { tag: 'circle', cx: 12, cy: 18.6, r: 1.5, fill: true },
  ],
  archive: [
    { tag: 'rect', x: 3.4, y: 4.4, w: 17.2, h: 4.2, rx: 1.4 },
    { tag: 'path', d: 'M5.4 8.6V20h13.2V8.6' },
    { tag: 'line', x1: 9.8, y1: 12.8, x2: 14.2, y2: 12.8 },
  ],
  arrowLeft: [
    { tag: 'line', x1: 19, y1: 12, x2: 5, y2: 12 },
    { tag: 'path', d: 'm11 6-6 6 6 6' },
  ],
  arrowUpRight: [
    { tag: 'line', x1: 6, y1: 18, x2: 18, y2: 6 },
    { tag: 'path', d: 'M9 6h9v9' },
  ],
  settings: [
    { tag: 'line', x1: 3.4, y1: 7, x2: 20.6, y2: 7 },
    { tag: 'line', x1: 3.4, y1: 12, x2: 20.6, y2: 12 },
    { tag: 'line', x1: 3.4, y1: 17, x2: 20.6, y2: 17 },
    { tag: 'circle', cx: 8.6, cy: 7, r: 2.2 },
    { tag: 'circle', cx: 15.4, cy: 12, r: 2.2 },
    { tag: 'circle', cx: 9.8, cy: 17, r: 2.2 },
  ],
  download: [
    { tag: 'line', x1: 12, y1: 3.4, x2: 12, y2: 14.6 },
    { tag: 'path', d: 'm7.4 10.2 4.6 4.6 4.6-4.6' },
    { tag: 'path', d: 'M4.6 19.6h14.8' },
  ],
  upload: [
    { tag: 'line', x1: 12, y1: 20.4, x2: 12, y2: 9.2 },
    { tag: 'path', d: 'm7.4 13.6 4.6-4.6 4.6 4.6' },
    { tag: 'path', d: 'M4.6 4.4h14.8' },
  ],
  refresh: [
    { tag: 'path', d: 'M20.2 12a8.2 8.2 0 1 1-2.4-5.8' },
    { tag: 'path', d: 'M20.4 4.2v5h-5' },
  ],
  search: [
    { tag: 'circle', cx: 10.6, cy: 10.6, r: 6.2 },
    { tag: 'line', x1: 15.2, y1: 15.2, x2: 20.2, y2: 20.2 },
  ],
  filter: [
    { tag: 'line', x1: 3.8, y1: 6, x2: 20.2, y2: 6 },
    { tag: 'line', x1: 6.8, y1: 12, x2: 17.2, y2: 12 },
    { tag: 'line', x1: 10, y1: 18, x2: 14, y2: 18 },
  ],
  copy: [
    { tag: 'rect', x: 8.8, y: 8.8, w: 11.4, h: 11.4, rx: 2.2 },
    { tag: 'path', d: 'M15.2 8.8V5.8A2 2 0 0 0 13.2 3.8H5.8a2 2 0 0 0-2 2v7.4a2 2 0 0 0 2 2h3' },
  ],
  flame: [
    {
      tag: 'path',
      d: 'M12 2.8c2.9 3.4 5 5.9 5 9.2a5 5 0 1 1-10 0c0-1.7.8-3 1.8-4.2.1 1.8 1 2.9 2 3.2 1-2.2.5-5.2 1.2-8.2Z',
      fill: true,
    },
  ],
  coin: [
    { tag: 'circle', cx: 12, cy: 12, r: 8.4 },
    { tag: 'path', d: 'M12 7.4 16.6 12 12 16.6 7.4 12Z' },
  ],
  bolt: [{ tag: 'path', d: 'M13.2 2.6 4.8 13.5h5.5L10.8 21.4 19.2 10.5h-5.6Z', fill: true }],
  spark: [
    { tag: 'path', d: 'M12 2.8l2.3 6.9 6.9 2.3-6.9 2.3L12 21.2l-2.3-6.9L2.8 12l6.9-2.3Z', fill: true },
  ],
  trophy: [
    { tag: 'path', d: 'M8.2 4.2h7.6v4.4a3.8 3.8 0 0 1-7.6 0Z' },
    { tag: 'path', d: 'M8.2 5.8H4.8v1.6a3.4 3.4 0 0 0 3.4 3.4' },
    { tag: 'path', d: 'M15.8 5.8h3.4v1.6a3.4 3.4 0 0 1-3.4 3.4' },
    { tag: 'path', d: 'M12 12.4V17M9.4 17h5.2v3.4H9.4Z' },
  ],
  calendar: [
    { tag: 'rect', x: 3.4, y: 5, w: 17.2, h: 15.6, rx: 2.4 },
    { tag: 'line', x1: 3.4, y1: 10, x2: 20.6, y2: 10 },
    { tag: 'line', x1: 8, y1: 3.2, x2: 8, y2: 7 },
    { tag: 'line', x1: 16, y1: 3.2, x2: 16, y2: 7 },
    { tag: 'circle', cx: 8, cy: 14.2, r: 1.2, fill: true },
    { tag: 'circle', cx: 12, cy: 14.2, r: 1.2, fill: true },
    { tag: 'circle', cx: 16, cy: 14.2, r: 1.2, fill: true },
  ],
  clock: [
    { tag: 'circle', cx: 12, cy: 12, r: 8.4 },
    { tag: 'path', d: 'M12 7.2V12l3.2 2' },
  ],
  target: [
    { tag: 'circle', cx: 12, cy: 12, r: 8.4 },
    { tag: 'circle', cx: 12, cy: 12, r: 4.6 },
    { tag: 'circle', cx: 12, cy: 12, r: 1.4, fill: true },
  ],
  shield: [
    { tag: 'path', d: 'M12 2.8 19.4 5.8v5.4c0 4.6-3 8-7.4 10-4.4-2-7.4-5.4-7.4-10V5.8Z' },
    { tag: 'path', d: 'm8.8 11.8 2.2 2.2 4.2-4.4' },
  ],
  wave: [{ tag: 'path', d: 'M3 13.4c2.2 0 2.2-5 4.5-5s2.3 8 4.5 8 2.3-6 4.5-6 2.3 3 4.5 3' }],
  orbit: [
    { tag: 'path', d: 'M3.2 14.8C1.6 12.2 6.4 7.4 14 5.2c3.9-1.1 6.6-.6 6.8 1.4.3 2.6-5.3 6.4-10.8 8.1-3.6 1.1-5.9 1.2-6.8.1Z' },
    { tag: 'circle', cx: 12, cy: 12, r: 2.4, fill: true },
    { tag: 'circle', cx: 18.6, cy: 7.4, r: 1.1, fill: true },
  ],
  layers: [
    { tag: 'path', d: 'M12 3 21 8l-9 5-9-5Z' },
    { tag: 'path', d: 'm3.4 12.2 8.6 4.8 8.6-4.8' },
    { tag: 'path', d: 'm3.4 16.2 8.6 4.8 8.6-4.8' },
  ],
  signal: [
    { tag: 'path', d: 'M4 20v-3.6M9.3 20v-7.6M14.6 20V8M19.9 20V4.4' },
  ],
  hex: [{ tag: 'path', d: 'M12 2.8 20 7.4v9.2L12 21.2 4 16.6V7.4Z' }],
  lock: [
    { tag: 'rect', x: 4.8, y: 10, w: 14.4, h: 10.2, rx: 2.2 },
    { tag: 'path', d: 'M8.4 10V7.6a3.6 3.6 0 0 1 7.2 0V10' },
    { tag: 'circle', cx: 12, cy: 15.1, r: 1.2, fill: true },
  ],
  moon: [{ tag: 'path', d: 'M20.2 14.2A8.4 8.4 0 0 1 9.8 3.8a8.4 8.4 0 1 0 10.4 10.4Z' }],
  sun: [
    { tag: 'circle', cx: 12, cy: 12, r: 4.2 },
    { tag: 'path', d: 'M12 2.4v2.2M12 19.4v2.2M2.4 12h2.2M19.4 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6' },
  ],
  heart: [
    {
      tag: 'path',
      d: 'M12 20.3S3.8 15.4 3.8 9.4a4.4 4.4 0 0 1 8.2-2.2 4.4 4.4 0 0 1 8.2 2.2c0 6-8.2 10.9-8.2 10.9Z',
    },
  ],
  book: [
    { tag: 'path', d: 'M4 4.6h6a2.6 2.6 0 0 1 2 2.2v13.2a2.4 2.4 0 0 0-2-1.8H4Z' },
    { tag: 'path', d: 'M20 4.6h-6a2.6 2.6 0 0 0-2 2.2v13.2a2.4 2.4 0 0 1 2-1.8h6Z' },
  ],
  palette: [
    { tag: 'path', d: 'M12 3.2a8.8 8.8 0 0 0 0 17.6c1.3 0 2-1 2-2.2 0-1.4 1-2.1 2.4-2.1h1.2a3.2 3.2 0 0 0 3.2-3.4A8.8 8.8 0 0 0 12 3.2Z' },
    { tag: 'circle', cx: 8, cy: 9, r: 1.2, fill: true },
    { tag: 'circle', cx: 12.4, cy: 7, r: 1.2, fill: true },
    { tag: 'circle', cx: 16.2, cy: 9.6, r: 1.2, fill: true },
  ],
  users: [
    { tag: 'circle', cx: 9, cy: 8.4, r: 3.1 },
    { tag: 'path', d: 'M2.8 20a6.2 6.2 0 0 1 12.4 0' },
    { tag: 'path', d: 'M15.4 5.6a3 3 0 0 1 0 5.6' },
    { tag: 'path', d: 'M17.4 14.2A6.2 6.2 0 0 1 21.2 20' },
  ],
  compass: [
    { tag: 'circle', cx: 12, cy: 12, r: 8.4 },
    { tag: 'path', d: 'm15.4 8.6-2 4.6-4.8 2.2 2-4.6Z' },
  ],
  flask: [
    { tag: 'path', d: 'M9.2 3.4h5.6M10 3.4v5.2L4.9 17.4A2.4 2.4 0 0 0 7 21h10a2.4 2.4 0 0 0 2.1-3.6L14 8.6V3.4' },
    { tag: 'line', x1: 7.4, y1: 15, x2: 16.6, y2: 15 },
  ],
  star: [
    { tag: 'path', d: 'M12 3.2l2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.6l6.1-.8Z' },
  ],
  pulse: [{ tag: 'path', d: 'M2.8 12.4h3.6L8.2 6.8l3.6 10.4 2.2-6.2 1.3 1.4h5.9' }],
  grid: [
    { tag: 'rect', x: 3.6, y: 3.6, w: 7.2, h: 7.2, rx: 2 },
    { tag: 'rect', x: 13.2, y: 3.6, w: 7.2, h: 7.2, rx: 2 },
    { tag: 'rect', x: 3.6, y: 13.2, w: 7.2, h: 7.2, rx: 2 },
    { tag: 'rect', x: 13.2, y: 13.2, w: 7.2, h: 7.2, rx: 2 },
  ],
  info: [
    { tag: 'circle', cx: 12, cy: 12, r: 8.4 },
    { tag: 'line', x1: 12, y1: 11, x2: 12, y2: 16.6 },
    { tag: 'circle', cx: 12, cy: 7.6, r: 1, fill: true },
  ],
  save: [
    { tag: 'path', d: 'M5.4 3.8h11l3.2 3.2v13.2H5.4Z' },
    { tag: 'path', d: 'M8.4 3.8v5.4h6.4V3.8M8.4 20.2v-6.4h7.2v6.4' },
  ],
};

const FILLABLE = new Set<IconName>(['flame', 'bolt', 'spark', 'star']);

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  filled?: boolean;
  strokeWidth?: number;
  opacity?: number;
}

export function Icon({ name, size = 22, color, filled = false, strokeWidth = 1.7, opacity }: IconProps) {
  const { palette } = useTheme();
  const tint = color ?? palette.text;
  const primitives = ICONS[name] ?? ICONS.hex;
  const useFill = filled && FILLABLE.has(name);

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      opacity={opacity}
     
      aria-hidden
    >
      {primitives.map((primitive, index) => {
        const key = `${name}-${index}`;
        const isFilled = useFill || ('fill' in primitive && primitive.fill);
        const fill = isFilled ? tint : 'none';
        const stroke = useFill ? 'none' : tint;
        if (primitive.tag === 'path') {
          return (
            <Path
              key={key}
              d={primitive.d}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        }
        if (primitive.tag === 'circle') {
          return (
            <Circle
              key={key}
              cx={primitive.cx}
              cy={primitive.cy}
              r={primitive.r}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          );
        }
        if (primitive.tag === 'rect') {
          return (
            <Rect
              key={key}
              x={primitive.x}
              y={primitive.y}
              width={primitive.w}
              height={primitive.h}
              rx={primitive.rx ?? 0}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          );
        }
        return (
          <Line
            key={key}
            x1={primitive.x1}
            y1={primitive.y1}
            x2={primitive.x2}
            y2={primitive.y2}
            stroke={tint}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        );
      })}
    </Svg>
  );
}

export default Icon;
