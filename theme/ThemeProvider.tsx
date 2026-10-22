import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { Platform, useColorScheme as useSystemColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { useAppStore } from '@/store/AppStore';
import {
  ACCENTS,
  buildPalette,
  type Accent,
  type AccentId,
  type Palette,
  type ResolvedMode,
  type ThemeMode,
} from './palette';

interface ThemeContextValue {
  mode: ResolvedMode;
  themeMode: ThemeMode;
  accent: Accent;
  accentId: AccentId;
  palette: Palette;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { state, setTheme } = useAppStore();
  const themeMode = state.settings.preferences.theme;
  const accentId = state.profile.accentId;
  const systemScheme = useSystemColorScheme();
  const { setColorScheme } = useNativeWindColorScheme();

  const mode: ResolvedMode = themeMode === 'system' ? (systemScheme ?? 'dark') : themeMode;

  useEffect(() => {
    try {
      setColorScheme(themeMode);
    } catch {
      // Older bundles with darkMode: media can throw; the palette still drives colors.
    }
  }, [themeMode, setColorScheme]);

  const palette = useMemo(() => buildPalette(mode, accentId), [mode, accentId]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (typeof document !== 'undefined') {
        document.body.style.backgroundColor = palette.bg;
        document.documentElement.style.colorScheme = mode;
      }
      return;
    }
    void SystemUI.setBackgroundColorAsync(palette.bg).catch(() => undefined);
  }, [palette.bg, mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      themeMode,
      accent: ACCENTS[accentId] ?? ACCENTS.mint,
      accentId,
      palette,
      isDark: mode === 'dark',
      setThemeMode: setTheme,
    }),
    [mode, themeMode, accentId, palette, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
