import React from 'react';
import { Pressable, View } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { withAlpha } from '@/theme/palette';
import { Icon, type IconName } from '@/components/icons/Icon';
import { AppText } from '@/components/ui/Text';

const TAB_META: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'DECK', icon: 'deck' },
  quests: { label: 'QUESTS', icon: 'quests' },
  stats: { label: 'STATS', icon: 'stats' },
  profile: { label: 'PROFILE', icon: 'profile' },
};

export function DockBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const { palette, isDark } = useTheme();
  const router = useRouter();

  const tabs = state.routes.filter((route) => TAB_META[route.name]);

  const renderTab = (route: (typeof tabs)[number]) => {
    const meta = TAB_META[route.name];
    const index = state.routes.findIndex((entry) => entry.key === route.key);
    const focused = state.index === index;
    const options = descriptors[route.key]?.options;
    const label =
      typeof options?.tabBarLabel === 'string'
        ? options.tabBarLabel
        : typeof options?.title === 'string'
          ? options.title
          : meta.label;

    const onPress = () => {
      const event = emitter.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigateToTab(route.key);
      }
    };

    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={`${meta.label} tab`}
        onPress={onPress}
        className="flex-1 items-center justify-center gap-1 rounded-2xl py-1.5"
        style={({ pressed }) => [
          focused ? { backgroundColor: palette.primarySoft } : null,
          pressed ? { opacity: 0.65 } : null,
        ]}
      >
        <Icon
          name={meta.icon}
          size={21}
          color={focused ? palette.primaryText : palette.tabInactive}
        />
        <AppText
          variant="label"
          style={{
            color: focused ? palette.primaryText : palette.tabInactive,
            fontSize: 9,
            letterSpacing: 1.1,
          }}
        >
          {label.toUpperCase()}
        </AppText>
      </Pressable>
    );
  };

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 40 }}
    >
      <View
        pointerEvents="box-none"
        style={{
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingBottom: Math.max(insets.bottom, 10),
        }}
      >
        <View
          className="w-full flex-row items-center rounded-[26px] border px-2 py-2"
          style={{
            maxWidth: 620,
            backgroundColor: isDark ? 'rgba(10,20,32,0.96)' : 'rgba(255,255,255,0.97)',
            borderColor: palette.borderStrong,
            shadowColor: '#000000',
            shadowOpacity: isDark ? 0.45 : 0.12,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 10 },
            elevation: 12,
          }}
        >
          {tabs.slice(0, 2).map(renderTab)}

          <View style={{ width: 64, alignItems: 'center' }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create a new quest"
              onPress={() => router.push('/quest/new')}
              className="items-center justify-center rounded-full"
              style={({ pressed }) => [
                {
                  width: 56,
                  height: 56,
                  marginTop: -22,
                  backgroundColor: palette.primary,
                  shadowColor: palette.primary,
                  shadowOpacity: isDark ? 0.55 : 0.35,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 10,
                  transform: [{ scale: pressed ? 0.93 : 1 }],
                },
              ]}
            >
              <Icon name="plus" size={25} color={palette.onPrimary} strokeWidth={2.2} />
            </Pressable>
          </View>

          {tabs.slice(2).map(renderTab)}
        </View>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -1,
            height: 2,
            width: 46,
            borderRadius: 1,
            backgroundColor: withAlpha(palette.primary, isDark ? 0.5 : 0.35),
          }}
        />
      </View>
    </View>
  );
}
