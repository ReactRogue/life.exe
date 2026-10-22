import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { withAlpha } from '@/theme/palette';
import { ACHIEVEMENT_MAP } from '@/domain/achievements';
import { TITLES } from '@/domain/cosmetics';
import { useReducedMotion } from '@/lib/motion';
import { AppText, HudLabel } from '@/components/ui/Text';
import { Icon } from '@/components/icons/Icon';
import { Badge } from '@/components/ui/Badge';
import { formatNumber } from '@/lib/format';

export function CelebrationOverlay() {
  const { celebration, dismissCelebration } = useAppStore();
  const { palette, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();

  const leveledUp = celebration ? celebration.levelAfter > celebration.levelBefore : false;
  const duration = leveledUp || (celebration?.unlockedAchievements.length ?? 0) > 0 ? 3600 : 2600;

  useEffect(() => {
    if (!celebration) return;
    const timer = setTimeout(dismissCelebration, duration);
    return () => clearTimeout(timer);
  }, [celebration, dismissCelebration, duration]);

  if (!celebration) return null;

  const newTitle = leveledUp
    ? TITLES.find((title) => title.requirement.type === 'level' && title.requirement.level === celebration.levelAfter)
    : undefined;
  const achievements = celebration.unlockedAchievements
    .map((id) => ACHIEVEMENT_MAP[id])
    .filter(Boolean)
    .slice(0, 2);

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, alignItems: 'center', justifyContent: 'center' }}
    >
      <Pressable
        className="absolute inset-0"
        accessibilityRole="button"
        accessibilityLabel="Dismiss celebration"
        onPress={dismissCelebration}
        style={{ backgroundColor: leveledUp ? palette.overlay : 'transparent' }}
      />
      <View pointerEvents="none" style={{ position: 'absolute', width: 280, height: 280 }}>
        {leveledUp && !reduced
          ? Array.from({ length: 14 }).map((_, index) => (
              <Particle key={index} index={index} color={index % 3 === 0 ? palette.gradient[1] : palette.primary} />
            ))
          : null}
      </View>
      <Animated.View
        entering={reduced ? FadeIn.duration(160) : ZoomIn.springify().damping(15).stiffness(160).mass(0.8)}
        exiting={FadeOut.duration(200)}
        style={{ alignItems: 'center', paddingHorizontal: 24, marginTop: insets.top * 0.4 }}
      >
        <View
          className="items-center rounded-3xl border px-6 py-5"
          style={{
            minWidth: 280,
            maxWidth: 360,
            backgroundColor: isDark ? 'rgba(9,18,30,0.97)' : 'rgba(255,255,255,0.98)',
            borderColor: palette.primaryBorder,
            shadowColor: palette.primary,
            shadowOpacity: isDark ? 0.35 : 0.18,
            shadowRadius: 30,
            shadowOffset: { width: 0, height: 12 },
            elevation: 16,
          }}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          <HudLabel tone="accent">
            {leveledUp ? 'SYSTEM UPGRADE' : celebration.dailyGoalHit ? 'DAILY GOAL SECURED' : 'SIGNAL LOGGED'}
          </HudLabel>

          <View className="mt-2 flex-row items-center gap-2">
            <Icon name={leveledUp ? 'trophy' : 'bolt'} size={leveledUp ? 26 : 22} color={palette.primaryText} filled />
            <AppText variant={leveledUp ? 'numberLarge' : 'number'} tone="accent">
              {leveledUp ? `LEVEL ${celebration.levelAfter}` : `+${formatNumber(celebration.xpAwarded)} XP`}
            </AppText>
          </View>

          {leveledUp ? (
            <AppText variant="caption" tone="muted" className="mt-1">
              {newTitle ? `New title unlocked: ${newTitle.name}` : 'A tougher version of you is online.'}
            </AppText>
          ) : null}

          <AppText variant="caption" tone="muted" align="center" className="mt-1.5" numberOfLines={2}>
            {celebration.quest.title}
          </AppText>

          {!leveledUp ? (
            <View className="mt-3 flex-row items-center gap-2">
              <Badge label={`${formatNumber(celebration.xpAwarded)} XP`} tone="xp" icon="bolt" compact />
              <Badge label={`+${celebration.coinsAwarded}`} tone="coin" icon="coin" compact />
              {celebration.streak > 1 ? (
                <Badge label={`${celebration.streak}D STREAK`} tone="streak" icon="flame" compact />
              ) : null}
            </View>
          ) : (
            <View className="mt-3 flex-row items-center gap-2">
              <Badge label={`${formatNumber(celebration.xpAwarded)} XP`} tone="xp" icon="bolt" compact />
              <Badge label={`+${celebration.coinsAwarded}`} tone="coin" icon="coin" compact />
            </View>
          )}

          {celebration.dailyGoalHit ? (
            <View
              className="mt-3 flex-row items-center gap-2 rounded-full border px-3 py-1.5"
              style={{ borderColor: withAlpha(palette.primary, 0.35), backgroundColor: palette.primarySoft }}
            >
              <Icon name="check" size={12} color={palette.primaryText} />
              <HudLabel tone="accent">DAILY GOAL BONUS +{celebration.bonusCompletion?.xp ?? 0} XP</HudLabel>
            </View>
          ) : null}

          {achievements.map((achievement) => (
            <View key={achievement.id} className="mt-2 flex-row items-center gap-2">
              <Icon name="trophy" size={12} color={palette.coin} />
              <AppText variant="micro" tone="coin">
                Achievement: {achievement.name}
              </AppText>
            </View>
          ))}
          {celebration.unlockedAchievements.length > 2 ? (
            <AppText variant="micro" tone="faint" className="mt-1">
              +{celebration.unlockedAchievements.length - 2} more achievements
            </AppText>
          ) : null}

          <View className="mt-3">
            <HudLabel tone="faint">TAP TO DISMISS</HudLabel>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function Particle({ index, color }: { index: number; color: string }) {
  const progress = useSharedValue(0);
  const angle = (index / 14) * Math.PI * 2 + 0.3;
  const distance = 78 + (index % 4) * 24;

  useEffect(() => {
    progress.value = withTiming(1, { duration: 900 + (index % 5) * 80, easing: Easing.out(Easing.cubic) });
  }, [index, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateX: Math.cos(angle) * distance * progress.value },
      { translateY: Math.sin(angle) * distance * progress.value },
      { scale: 1 - progress.value * 0.6 },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: index % 3 === 0 ? 6 : 4,
          height: index % 3 === 0 ? 6 : 4,
          borderRadius: 3,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}
