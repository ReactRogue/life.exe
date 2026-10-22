import React from 'react';
import { Tabs } from 'expo-router/js-tabs';
import { DockBar } from '@/components/nav/DockBar';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: 'transparent' },
      }}
      tabBar={(props) => <DockBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Deck' }} />
      <Tabs.Screen name="quests" options={{ title: 'Quests' }} />
      <Tabs.Screen name="stats" options={{ title: 'Stats' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
