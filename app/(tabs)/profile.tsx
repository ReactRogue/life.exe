import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { hueFor, withAlpha } from '@/theme/palette';
import {
  achievementViews,
  categoryStats,
  coinBalance,
  currentStreakOf,
  equippedFrame,
  equippedTitle,
  profileLevel,
} from '@/domain/selectors';
import { ACHIEVEMENTS } from '@/domain/achievements';
import { ACCENTS, type ThemeMode } from '@/theme/palette';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { AppText, HudLabel } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { TextField, SegmentedControl, SwitchRow } from '@/components/ui/Field';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatTile } from '@/components/ui/StatTile';
import { AchievementTile } from '@/components/profile/AchievementBadge';
import { Icon, type IconName } from '@/components/icons/Icon';
import { formatNumber, percent } from '@/lib/format';

export default function ProfileScreen() {
  const router = useRouter();
  const { state, today, updateProfile, updatePreferences, resetEverything } = useAppStore();
  const { palette, isDark, themeMode, setThemeMode, accent } = useTheme();
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [draftName, setDraftName] = useState(state.profile.name);
  const [draftSigil, setDraftSigil] = useState(state.profile.sigil);

  const level = profileLevel(state);
  const title = equippedTitle(state);
  const frame = equippedFrame(state);
  const coins = coinBalance(state);
  const streak = currentStreakOf(state, today);
  const categories = categoryStats(state);
  const views = achievementViews(state, today);
  const unlocked = views.filter((view) => view.unlocked);
  const locked = views.filter((view) => !view.unlocked).sort((a, b) => b.ratio - a.ratio);
  const preview = [...unlocked, ...locked].slice(0, 3);
  const nextAchievement = locked[0];
  const totalCompletions = state.completions.filter((entry) => entry.source !== 'bonus').length;
  const memberSince = useMemo(() => {
    const date = new Date(state.profile.createdAt);
    return Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
  }, [state.profile.createdAt]);

  const openEdit = () => {
    setDraftName(state.profile.name);
    setDraftSigil(state.profile.sigil);
    setEditOpen(true);
  };

  return (
    <Screen>
      <View className="pt-2 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <HudLabel tone="accent">OPERATOR DOSSIER</HudLabel>
          <AppText variant="h1" className="mt-1">
            Character
          </AppText>
          <AppText variant="caption" tone="muted" className="mt-1">
            Operator since {memberSince} · {percent(level.progress)} to LVL {level.level + 1}
          </AppText>
        </View>
        <View className="flex-row gap-2 pt-1">
          <IconButton icon="edit" label="Edit identity" variant="surface" onPress={openEdit} />
          <IconButton icon="settings" label="System rules" variant="surface" onPress={() => router.push('/rules')} />
        </View>
      </View>

      <Card hud glow padded={false} className="mt-5 overflow-hidden">
        <LinearGradient
          colors={[withAlpha(palette.gradient[0], isDark ? 0.16 : 0.08), 'transparent']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View className="p-5">
          <View className="flex-row items-center gap-4">
            <Avatar
              sigil={state.profile.sigil}
              frame={frame}
              size={100}
              progress={level.progress}
            />
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <AppText variant="h1" numberOfLines={1} className="flex-shrink-1">
                  {state.profile.name}
                </AppText>
                <Badge label={`LVL ${level.level}`} tone="xp" compact />
              </View>
              <View className="mt-1 flex-row items-center gap-1.5">
                <Icon name="star" size={12} color={palette.primaryText} />
                <HudLabel tone="accent">{title.uppercase}</HudLabel>
              </View>
              <AppText variant="micro" tone="faint" className="mt-1">
                {title.tagline}
              </AppText>
              <View className="mt-2 flex-row flex-wrap gap-1.5">
                <Badge label={`${streak.days}D STREAK`} tone="streak" icon="flame" compact />
                <Badge label={`${formatNumber(coins)} COINS`} tone="coin" icon="coin" compact />
                <Badge label={accent.label.toUpperCase()} tone="level" icon="palette" compact />
              </View>
            </View>
          </View>

          <View className="mt-5">
            <View className="mb-1.5 flex-row items-center justify-between">
              <HudLabel tone="muted">
                LEVEL {level.level} → {level.level + 1}
              </HudLabel>
              <AppText variant="micro" tone="faint">
                {formatNumber(level.nextLevelAt - level.totalXp)} XP to next
              </AppText>
            </View>
            <ProgressBar progress={level.progress} gradient={palette.gradient} height={8} />
            <View className="mt-1.5 flex-row items-center justify-between">
              <AppText variant="micro" tone="faint">
                {formatNumber(level.totalXp)} lifetime XP
              </AppText>
              <AppText variant="micro" tone="faint">
                {formatNumber(level.into)} / {formatNumber(level.span)} this level
              </AppText>
            </View>
          </View>

          <View className="mt-5 flex-row gap-2.5">
            <StatTile compact className="flex-1" label="LOGS" value={formatNumber(totalCompletions)} hint="quests completed" icon="check" />
            <StatTile compact className="flex-1" label="MEDALS" value={`${unlocked.length}/${ACHIEVEMENTS.length}`} hint={`${locked.length} to chase`} icon="trophy" />
            <StatTile compact className="flex-1" label="SKILLS" value={`${categories.length}`} hint="active trees" icon="layers" />
          </View>
        </View>
      </Card>

      <View className="mt-7">
        <SectionHeader
          eyebrow="SKILL TREES"
          title="Disciplines"
          subtitle="Every completion feeds one tree. Levels are independent."
          actionLabel="New quest"
          onAction={() => router.push('/quest/new')}
          actionIcon="plus"
        />
        <View>
          {categories.map((stat, index) => {
            const hue = hueFor(stat.category.hue, palette.mode);
            const last = index === categories.length - 1;
            return (
              <Pressable
                key={stat.category.id}
                accessibilityRole="button"
                accessibilityLabel={`${stat.category.name}, level ${stat.level.level}, ${stat.xp} XP`}
                onPress={() => router.push(`/skill/${stat.category.id}`)}
                className="flex-row gap-3"
                style={({ pressed }) => (pressed ? { opacity: 0.8 } : null)}
              >
                <View className="w-10 items-center">
                  <View
                    className="h-10 w-10 items-center justify-center rounded-xl border"
                    style={{ backgroundColor: withAlpha(hue, 0.14), borderColor: withAlpha(hue, 0.34) }}
                  >
                    <Icon name={(stat.category.icon ?? 'target') as IconName} size={18} color={hue} />
                  </View>
                  {!last ? (
                    <View className="my-1 w-px flex-1" style={{ backgroundColor: palette.border }} />
                  ) : null}
                </View>
                <View className="mb-3 flex-1">
                  <View className="rounded-2xl border p-3.5" style={{ borderColor: palette.border, backgroundColor: isDark ? '#0A141F' : '#FFFFFF' }}>
                    <View className="flex-row items-center justify-between gap-2">
                      <AppText variant="bodyStrong">{stat.category.name}</AppText>
                      <View className="flex-row items-center gap-2">
                        <HudLabel tone="faint">LVL {stat.level.level}</HudLabel>
                        <Icon name="chevronRight" size={14} color={palette.textFaint} />
                      </View>
                    </View>
                    <View className="mt-2">
                      <ProgressBar progress={stat.level.progress} color={hue} height={5} />
                    </View>
                    <View className="mt-1.5 flex-row items-center justify-between">
                      <AppText variant="micro" tone="faint">
                        {formatNumber(stat.xp)} XP · {stat.completions} logs
                      </AppText>
                      <AppText variant="micro" tone="faint">
                        {formatNumber(stat.level.nextLevelAt - stat.xp)} to next
                      </AppText>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="mt-5">
        <SectionHeader
          eyebrow="ACHIEVEMENTS"
          title={`${unlocked.length} of ${ACHIEVEMENTS.length} unlocked`}
          actionLabel="All"
          onAction={() => router.push('/achievements')}
        />
        <Card>
          <View className="flex-row items-center gap-4">
            <ProgressRing progress={unlocked.length / ACHIEVEMENTS.length} size={64} strokeWidth={5}>
              <Icon name="trophy" size={22} color={palette.primaryText} />
            </ProgressRing>
            <View className="flex-1">
              <HudLabel tone="faint">NEXT UNLOCK</HudLabel>
              <AppText variant="bodyStrong" className="mt-0.5" numberOfLines={1}>
                {nextAchievement ? nextAchievement.def.name : 'All achievements complete'}
              </AppText>
              {nextAchievement ? (
                <>
                  <ProgressBar progress={nextAchievement.ratio} height={4} className="mt-2" />
                  <View className="mt-1 flex-row items-center justify-between">
                    <AppText variant="micro" tone="faint" numberOfLines={1} className="flex-1 pr-2">
                      {nextAchievement.def.description}
                    </AppText>
                    <HudLabel tone="faint" style={{ color: palette.coin }}>
                      +{nextAchievement.def.rewardCoins}
                    </HudLabel>
                  </View>
                </>
              ) : (
                <AppText variant="micro" tone="faint" className="mt-1">
                  Every medal earned. Show-off mode unlocked.
                </AppText>
              )}
            </View>
          </View>
          <View className="mt-4 flex-row gap-2">
            {preview.map((view) => (
              <AchievementTile key={view.def.id} view={view} className="flex-1" />
            ))}
          </View>
        </Card>
      </View>

      <View className="mt-7">
        <SectionHeader
          eyebrow="COSMETIC VAULT"
          title="Loadout"
          subtitle={`${formatNumber(coins)} coins available`}
          actionLabel="Open vault"
          onAction={() => router.push('/vault')}
        />
        <Card padded={false} className="overflow-hidden">
          <EquipRow
            icon="star"
            label="ACTIVE TITLE"
            value={title.name}
            accent={palette.primaryText}
            onPress={() => router.push('/vault')}
          />
          <EquipRow
            icon="orbit"
            label="AVATAR FRAME"
            value={frame.name}
            accent={frame.colors[0]}
            onPress={() => router.push('/vault')}
            colors={frame.colors}
          />
          <EquipRow
            icon="palette"
            label="ACCENT"
            value={ACCENTS[state.profile.accentId]?.label ?? 'Bio'}
            accent={palette.primaryText}
            onPress={() => router.push('/vault')}
          />
        </Card>
      </View>

      <View className="mt-7">
        <SectionHeader eyebrow="INTERFACE" title="Appearance & feel" />
        <Card>
          <HudLabel tone="faint" className="mb-2">
            THEME
          </HudLabel>
          <SegmentedControl
            label="Theme"
            value={themeMode}
            options={[
              { value: 'dark', label: 'Night', icon: 'moon' },
              { value: 'light', label: 'Day', icon: 'sun' },
              { value: 'system', label: 'Auto', icon: 'refresh' },
            ]}
            onChange={(value) => setThemeMode(value as ThemeMode)}
          />
          <View className="mt-2">
            <SwitchRow
              label="Haptic feedback"
              description="A small pulse when a quest lands or a level unlocks."
              value={state.settings.preferences.haptics}
              onValueChange={(value) => updatePreferences({ haptics: value })}
            />
          </View>
        </Card>
      </View>

      <View className="mt-7">
        <SectionHeader eyebrow="SYSTEM" title="Control room" />
        <Card padded={false} className="overflow-hidden">
          <SystemRow icon="settings" label="Reward rules" hint="XP curve, streaks, grace shields" onPress={() => router.push('/rules')} />
          <SystemRow icon="trophy" label="Achievements" hint={`${unlocked.length} unlocked · ${ACHIEVEMENTS.length} total`} onPress={() => router.push('/achievements')} />
          <SystemRow icon="clock" label="Activity log" hint="Every XP event, timestamped" onPress={() => router.push('/log')} />
          <SystemRow icon="flask" label="Data & cloud" hint="Local-first · export or import a save" onPress={() => router.push('/rules')} />
          <SystemRow icon="trash" label="Reset all data" hint="Wipes this device only" onPress={() => setResetOpen(true)} danger />
        </Card>
      </View>

      <View className="mt-6 items-center gap-1">
        <HudLabel tone="faint">LIFE.EXE v1.0.0 · SCHEMA {state.schemaVersion}</HudLabel>
        <HudLabel tone="faint">MADE ON THIS DEVICE · NO ACCOUNT REQUIRED</HudLabel>
      </View>

      <Dialog
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit identity"
        description="Your call sign and sigil appear across the console."
        icon="profile"
        primaryAction={{
          label: 'Save changes',
          icon: 'save',
          onPress: () => {
            updateProfile({ name: draftName, sigil: draftSigil });
            setEditOpen(false);
          },
        }}
        secondaryAction={{ label: 'Cancel', onPress: () => setEditOpen(false) }}
      >
        <TextField
          label="CALL SIGN"
          value={draftName}
          onChangeText={setDraftName}
          maxLength={24}
          placeholder="Operator"
          autoCapitalize="words"
        />
        <View className="mt-4">
          <HudLabel tone="muted" className="mb-2">
            SIGIL
          </HudLabel>
          <View className="flex-row flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, index) => {
              const selected = draftSigil === index;
              return (
                <Pressable
                  key={index}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Sigil ${index + 1}`}
                  onPress={() => setDraftSigil(index)}
                  className="items-center justify-center rounded-2xl border p-1.5"
                  style={{
                    borderColor: selected ? palette.primary : palette.border,
                    backgroundColor: selected ? palette.primarySoft : 'transparent',
                  }}
                >
                  <Avatar sigil={index} size={52} showRing={false} />
                </Pressable>
              );
            })}
          </View>
        </View>
      </Dialog>

      <Dialog
        visible={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset everything?"
        description="This wipes quests, XP, achievements, cosmetics, and settings on this device. There is no undo — export a save first if you might return."
        icon="trash"
        primaryAction={{
          label: 'Reset data',
          variant: 'danger',
          icon: 'trash',
          onPress: () => {
            resetEverything();
            setResetOpen(false);
            router.replace('/onboarding');
          },
        }}
        secondaryAction={{ label: 'Keep my data', onPress: () => setResetOpen(false) }}
      />
    </Screen>
  );
}

function EquipRow({
  icon,
  label,
  value,
  accent,
  onPress,
  colors,
}: {
  icon: IconName;
  label: string;
  value: string;
  accent: string;
  onPress: () => void;
  colors?: [string, string];
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}. Open vault`}
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-3.5"
      style={({ pressed }) => [
        { borderBottomWidth: 1, borderBottomColor: palette.border },
        pressed ? { opacity: 0.75 } : null,
      ]}
    >
      <View
        className="h-8 w-8 items-center justify-center rounded-lg border"
        style={{
          borderColor: colors ? `${colors[0]}66` : palette.border,
          backgroundColor: colors ? `${colors[0]}22` : palette.surfaceAlt,
        }}
      >
        <Icon name={icon} size={15} color={accent} />
      </View>
      <View className="flex-1">
        <HudLabel tone="faint">{label}</HudLabel>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {value}
        </AppText>
      </View>
      <Icon name="chevronRight" size={15} color={palette.textFaint} />
    </Pressable>
  );
}

function SystemRow({
  icon,
  label,
  hint,
  onPress,
  danger = false,
}: {
  icon: IconName;
  label: string;
  hint: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${hint}`}
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-3.5"
      style={({ pressed }) => [
        { borderBottomWidth: 1, borderBottomColor: palette.border },
        pressed ? { opacity: 0.7 } : null,
      ]}
    >
      <View
        className="h-9 w-9 items-center justify-center rounded-xl border"
        style={{
          borderColor: danger ? palette.danger : palette.border,
          backgroundColor: danger ? withAlpha(palette.danger, 0.08) : palette.surfaceAlt,
        }}
      >
        <Icon name={icon} size={16} color={danger ? palette.dangerText : palette.textMuted} />
      </View>
      <View className="flex-1">
        <AppText variant="bodyStrong" style={danger ? { color: palette.dangerText } : undefined}>
          {label}
        </AppText>
        <AppText variant="micro" tone="faint">
          {hint}
        </AppText>
      </View>
      <Icon name="chevronRight" size={15} color={palette.textFaint} />
    </Pressable>
  );
}
