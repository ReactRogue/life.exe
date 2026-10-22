import React from 'react';
import {
  ScrollView,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { cn } from '@/lib/cn';
import { AmbientBackground } from './AmbientBackground';

export interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  background?: boolean;
  edges?: Edge[];
  className?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollProps?: Omit<ScrollViewProps, 'contentContainerStyle' | 'children'>;
  maxWidth?: number;
  bottomInset?: boolean;
}

export function Screen({
  children,
  scroll = true,
  padded = true,
  background = true,
  edges = ['top'],
  className,
  contentContainerStyle,
  scrollProps,
  maxWidth = 620,
  bottomInset = true,
}: ScreenProps) {
  const inner = (
    <View
      className={cn('w-full self-center', padded && 'px-5', className)}
      style={{ maxWidth }}
    >
      {children}
    </View>
  );

  return (
    <View className="flex-1">
      {background ? <AmbientBackground /> : null}
      <SafeAreaView className="flex-1" edges={edges}>
        {scroll ? (
          <ScrollView
            className="flex-1"
            contentContainerStyle={[
              { paddingBottom: bottomInset ? 150 : 32, flexGrow: 1 },
              contentContainerStyle,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            {...scrollProps}
          >
            {inner}
          </ScrollView>
        ) : (
          <View className="flex-1">{inner}</View>
        )}
      </SafeAreaView>
    </View>
  );
}

export function Section({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View className={cn('mt-7', className)} style={style}>
      {children}
    </View>
  );
}
