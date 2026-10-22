import React from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';
import { cn } from '@/lib/cn';
import { useTheme } from '@/theme/ThemeProvider';

export interface CardProps extends ViewProps {
  variant?: 'surface' | 'raised' | 'accent' | 'ghost' | 'danger';
  padded?: boolean;
  hud?: boolean;
  glow?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Card({
  variant = 'surface',
  padded = true,
  hud = false,
  glow = false,
  className,
  children,
  style,
  ...rest
}: CardProps) {
  const { palette, isDark } = useTheme();

  const variantStyle: ViewStyle =
    variant === 'accent'
      ? { backgroundColor: palette.primarySoft, borderColor: palette.primaryBorder }
      : variant === 'danger'
        ? { backgroundColor: isDark ? 'rgba(255,107,122,0.08)' : 'rgba(168,31,48,0.05)', borderColor: isDark ? 'rgba(255,139,149,0.32)' : 'rgba(168,31,48,0.25)' }
        : variant === 'ghost'
          ? { backgroundColor: 'transparent', borderColor: palette.border }
          : variant === 'raised'
            ? { backgroundColor: isDark ? '#0E1A2B' : '#FFFFFF', borderColor: palette.borderStrong }
            : { backgroundColor: isDark ? '#0A141F' : '#FFFFFF', borderColor: palette.border };

  const shadowStyle: ViewStyle = glow
    ? {
        shadowColor: palette.primary,
        shadowOpacity: isDark ? 0.24 : 0.16,
        shadowRadius: 26,
        shadowOffset: { width: 0, height: 10 },
        elevation: isDark ? 0 : 6,
      }
    : {
        shadowColor: palette.shadow,
        shadowOpacity: isDark ? 0.32 : 0.05,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: isDark ? 0 : 2,
      };

  return (
    <View
      {...rest}
      className={cn('rounded-3xl border', padded && 'p-5', className)}
      style={[variantStyle, shadowStyle, style]}
    >
      {children}
      {hud ? <HudCorners color={palette.primaryBorder} /> : null}
    </View>
  );
}

function HudCorners({ color }: { color: string }) {
  return (
    <View pointerEvents="none" className="absolute inset-0">
      <View className="absolute" style={{ top: 10, left: 10 }}>
        <View style={{ width: 12, height: 1, backgroundColor: color }} />
        <View style={{ width: 1, height: 12, backgroundColor: color }} />
      </View>
      <View className="absolute items-end" style={{ top: 10, right: 10 }}>
        <View style={{ width: 12, height: 1, backgroundColor: color }} />
        <View style={{ width: 1, height: 12, backgroundColor: color, alignSelf: 'flex-end' }} />
      </View>
      <View className="absolute" style={{ bottom: 10, left: 10 }}>
        <View style={{ width: 1, height: 12, backgroundColor: color }} />
        <View style={{ width: 12, height: 1, backgroundColor: color }} />
      </View>
      <View className="absolute items-end" style={{ bottom: 10, right: 10 }}>
        <View style={{ width: 1, height: 12, backgroundColor: color, alignSelf: 'flex-end' }} />
        <View style={{ width: 12, height: 1, backgroundColor: color }} />
      </View>
    </View>
  );
}

export function Divider({ className }: { className?: string }) {
  const { palette } = useTheme();
  return <View className={cn('h-px w-full my-4', className)} style={{ backgroundColor: palette.border }} />;
}

export function Dot({ color, size = 6 }: { color: string; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />;
}
