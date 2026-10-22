import '../global.css';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  ChakraPetch_500Medium,
  ChakraPetch_600SemiBold,
  ChakraPetch_700Bold,
} from '@expo-google-fonts/chakra-petch';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { AppStoreProvider, useAppStore } from '@/store/AppStore';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { BootScreen } from '@/components/effects/BootScreen';
import { CelebrationOverlay } from '@/components/effects/CelebrationOverlay';
import { ToastLayer } from '@/components/ui/ToastLayer';

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch(() => undefined);
}

function RootNavigator() {
  const { hydrated } = useAppStore();
  const { palette } = useTheme();
  const [fontsLoaded, fontError] = useFonts({
    ChakraPetch_500Medium,
    ChakraPetch_600SemiBold,
    ChakraPetch_700Bold,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  const ready = hydrated && (fontsLoaded || Boolean(fontError));

  useEffect(() => {
    if (!ready) return;
    if (Platform.OS !== 'web') {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [ready]);

  if (!ready) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BootScreen />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.bg },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen
          name="quest/new"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="quest/[id]"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="skill/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="rules" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="achievements" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="vault" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="log" options={{ animation: 'slide_from_right' }} />
      </Stack>
      <CelebrationOverlay />
      <ToastLayer />
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppStoreProvider>
        <ThemeProvider>
          <RootNavigator />
        </ThemeProvider>
      </AppStoreProvider>
    </SafeAreaProvider>
  );
}
