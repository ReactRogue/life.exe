import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useAppStore } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { hueFor, withAlpha } from '@/theme/palette';
import { DEFAULT_CATEGORIES, LEVEL_PRESETS } from '@/domain/constants';
import { INITIAL_CATEGORIES_FALLBACK, countStarterQuests } from '@/domain/onboardingHelpers';
import { useReducedMotion } from '@/lib/motion';
import { haptics } from '@/lib/haptics';
import { AmbientBackground } from '@/components/ui/AmbientBackground';
import { AppText, HudLabel } from '@/components/ui/Text';
import { Button, IconButton } from '@/components/ui/Button';
import { TextField, SegmentedControl, OptionCard, SwitchRow } from '@/components/ui/Field';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/icons/Icon';
import { Card } from '@/components/ui/Card';
import { formatNumber } from '@/lib/format';

const STEPS = ['IDENTITY', 'DOMAINS', 'PROTOCOL'];

export default function OnboardingScreen() {
  const router = useRouter();
  const { state, finishOnboarding, skipOnboarding, setTheme } = useAppStore();
  const { palette, isDark, themeMode } = useTheme();
  const reduced = useReducedMotion();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [sigil, setSigil] = useState(0);
  const [focus, setFocus] = useState<string[]>(DEFAULT_CATEGORIES.map((category) => category.id));
  const [presetId, setPresetId] = useState<'casual' | 'standard' | 'intense'>('standard');
  const [seed, setSeed] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  const preset = LEVEL_PRESETS.find((entry) => entry.id === presetId) ?? LEVEL_PRESETS[1];
  const categories = state.categories.length ? state.categories : INITIAL_CATEGORIES_FALLBACK;
  const starterCount = useMemo(() => countStarterQuests(focus), [focus]);
  const previewName = name.trim() || 'Operator';

  const toggleFocus = (id: string) => {
    if (hapticsEnabled) haptics.tap(true);
    setFocus((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  };

  const reroll = () => {
    if (hapticsEnabled) haptics.tap(true);
    setSigil((current) => (current + 1) % 6);
  };

  const next = () => {
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    if (hapticsEnabled) haptics.success(true);
    finishOnboarding({
      name: previewName,
      accentId: 'mint',
      focusIds: focus,
      theme: themeMode,
      haptics: hapticsEnabled,
      seed: seed && focus.length > 0,
      sigil,
      levelBase: preset.levelBase,
      levelGrowth: preset.levelGrowth,
    });
    router.replace('/(tabs)');
  };

  const skip = () => {
    skipOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <View className="flex-1">
      <AmbientBackground />
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View className="w-full max-w-[620px] flex-1 self-center px-5">
            <View className="flex-row items-center justify-between pt-2">
              <View>
                <HudLabel tone="accent">SYS.SETUP / 01</HudLabel>
                <AppText variant="h2" className="mt-0.5 tracking-[0.08em]">
                  LIFE.EXE
                </AppText>
              </View>
              <Button label="Skip" variant="ghost" size="sm" onPress={skip} />
            </View>

            <View className="mt-5 flex-row gap-2" accessibilityLabel={`Step ${step + 1} of 3`}>
              {STEPS.map((label, index) => (
                <View key={label} className="flex-1">
                  <View
                    className="h-[3px] rounded-full"
                    style={{
                      backgroundColor:
                        index <= step ? palette.primary : withAlpha(palette.textFaint, 0.25),
                    }}
                  />
                  <AppText
                    variant="label"
                    className="mt-1.5"
                    style={{
                      color: index === step ? palette.primaryText : palette.textFaint,
                      fontSize: 9,
                    }}
                  >
                    {`0${index + 1} · ${label}`}
                  </AppText>
                </View>
              ))}
            </View>

            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingTop: 22, paddingBottom: 24 }}
            >
              <Animated.View
                key={`step-${step}`}
                entering={reduced ? undefined : FadeInRight.duration(260)}
              >
                {step === 0 ? (
                  <View>
                    <HudLabel tone="faint">BOOT SEQUENCE</HudLabel>
                    <AppText variant="display" className="mt-1">
                      Who is running{'\n'}this system?
                    </AppText>
                    <AppText variant="caption" tone="muted" className="mt-2 max-w-[360px]">
                      Pick a call sign and a sigil. You can change both later — nothing here is
                      permanent.
                    </AppText>

                    <View className="mt-7 items-center">
                      <View
                        className="items-center justify-center rounded-full"
                        style={{
                          width: 148,
                          height: 148,
                          backgroundColor: palette.primarySoft,
                        }}
                      >
                        <Avatar sigil={sigil} size={116} progress={0.72} />
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Change sigil"
                        onPress={reroll}
                        className="mt-3 flex-row items-center gap-1.5 rounded-full border px-3 py-1.5"
                        style={{ borderColor: palette.border, backgroundColor: palette.surfaceAlt }}
                      >
                        <Icon name="refresh" size={13} color={palette.primaryText} />
                        <HudLabel tone="accent">REROLL SIGIL {sigil + 1} / 6</HudLabel>
                      </Pressable>
                    </View>

                    <View className="mt-7">
                      <TextField
                        label="CALL SIGN"
                        value={name}
                        onChangeText={setName}
                        placeholder="Operator"
                        maxLength={24}
                        autoCapitalize="words"
                        showCount
                        icon="profile"
                        returnKeyType="done"
                      />
                      <AppText variant="micro" tone="faint" className="mt-2">
                        Your handle appears on the command deck and in every save file.
                      </AppText>
                    </View>

                    <Card variant="ghost" className="mt-6">
                      <View className="flex-row items-start gap-2.5">
                        <Icon name="info" size={16} color={palette.primaryText} />
                        <AppText variant="micro" tone="muted" className="flex-1">
                          Everything stays on this device. No account, no cloud, no notifications you
                          didn&apos;t ask for. Export a save any time from the rules screen.
                        </AppText>
                      </View>
                    </Card>
                  </View>
                ) : null}

                {step === 1 ? (
                  <View>
                    <HudLabel tone="faint">SKILL TREE</HudLabel>
                    <AppText variant="display" className="mt-1">
                      Choose your{'\n'}domains.
                    </AppText>
                    <AppText variant="caption" tone="muted" className="mt-2 max-w-[380px]">
                      These are the five skill trees you will level. Starter quests are pulled from
                      the ones you pick.
                    </AppText>

                    <View className="mt-6 gap-2.5">
                      {categories.map((category) => {
                        const selected = focus.includes(category.id);
                        const hue = hueFor(category.hue, palette.mode);
                        return (
                          <Pressable
                            key={category.id}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: selected }}
                            accessibilityLabel={`${category.name} skill tree`}
                            onPress={() => toggleFocus(category.id)}
                            className="flex-row items-center gap-3 rounded-2xl border p-3.5"
                            style={({ pressed }) => [
                              {
                                borderColor: selected ? withAlpha(hue, 0.5) : palette.border,
                                backgroundColor: selected
                                  ? withAlpha(hue, isDark ? 0.1 : 0.06)
                                  : isDark
                                    ? 'rgba(255,255,255,0.02)'
                                    : '#FFFFFF',
                              },
                              pressed ? { opacity: 0.8 } : null,
                            ]}
                          >
                            <View
                              className="h-11 w-11 items-center justify-center rounded-xl border"
                              style={{
                                backgroundColor: withAlpha(hue, 0.13),
                                borderColor: withAlpha(hue, 0.3),
                              }}
                            >
                              <Icon name={category.icon as never} size={20} color={hue} />
                            </View>
                            <View className="flex-1">
                              <AppText variant="bodyStrong">{category.name}</AppText>
                              <AppText variant="micro" tone="faint" numberOfLines={1}>
                                {category.blurb ?? 'A skill worth levelling'}
                              </AppText>
                            </View>
                            <View
                              className="h-6 w-6 items-center justify-center rounded-lg border"
                              style={{
                                borderColor: selected ? hue : palette.borderStrong,
                                backgroundColor: selected ? hue : 'transparent',
                              }}
                            >
                              {selected ? (
                                <Icon
                                  name="check"
                                  size={14}
                                  color={isDark ? '#04120E' : '#FFFFFF'}
                                  strokeWidth={3}
                                />
                              ) : null}
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                    <View className="mt-4 flex-row items-center gap-2">
                      <Icon name="info" size={14} color={palette.textFaint} />
                      <AppText variant="micro" tone="faint">
                        {focus.length
                          ? `${focus.length} domain${focus.length === 1 ? '' : 's'} selected · ${starterCount} starter quests`
                          : 'Select at least one domain to continue'}
                      </AppText>
                    </View>
                  </View>
                ) : null}

                {step === 2 ? (
                  <View>
                    <HudLabel tone="faint">CALIBRATION</HudLabel>
                    <AppText variant="display" className="mt-1">
                      Tune the{'\n'}reward engine.
                    </AppText>
                    <AppText variant="caption" tone="muted" className="mt-2 max-w-[380px]">
                      Nothing is locked in. The full rule set is editable later from Profile → System
                      rules.
                    </AppText>

                    <View className="mt-6">
                      <HudLabel tone="muted" className="mb-2">
                        APPEARANCE
                      </HudLabel>
                      <SegmentedControl
                        label="Appearance"
                        value={themeMode === 'system' ? 'system' : themeMode}
                        options={[
                          { value: 'dark', label: 'Night', icon: 'moon' },
                          { value: 'light', label: 'Day', icon: 'sun' },
                          { value: 'system', label: 'Auto', icon: 'refresh' },
                        ]}
                        onChange={(value) => setTheme(value)}
                      />
                    </View>

                    <View className="mt-6">
                      <HudLabel tone="muted" className="mb-2">
                        LEVEL CURVE
                      </HudLabel>
                      <View className="gap-2">
                        {LEVEL_PRESETS.map((option) => (
                          <OptionCard
                            key={option.id}
                            title={option.label}
                            description={`${option.blurb} · ${formatNumber(option.levelBase)} XP to level 2`}
                            selected={presetId === option.id}
                            onPress={() => setPresetId(option.id)}
                            leading={
                              <Icon
                                name={option.id === 'casual' ? 'wave' : option.id === 'standard' ? 'signal' : 'flame'}
                                size={18}
                                color={palette.primaryText}
                              />
                            }
                          />
                        ))}
                      </View>
                    </View>

                    <Card variant="surface" className="mt-6">
                      <View className="flex-row items-center justify-between gap-3">
                        <View className="flex-1">
                          <HudLabel tone="faint">LOADOUT SUMMARY</HudLabel>
                          <AppText variant="h3" className="mt-1">
                            {previewName}
                          </AppText>
                          <AppText variant="micro" tone="faint" className="mt-0.5">
                            {focus.length} domains · {seed ? starterCount : 0} starter quests
                          </AppText>
                        </View>
                        <Avatar sigil={sigil} size={58} showRing={false} />
                      </View>
                    </Card>

                    <View className="mt-5 gap-1">
                      <SwitchRow
                        label="Load starter protocol"
                        description="A handful of gentle starter quests, pre-tuned."
                        value={seed}
                        onValueChange={setSeed}
                      />
                      <View style={{ height: 1, backgroundColor: palette.border }} />
                      <SwitchRow
                        label="Haptic feedback"
                        description="A small pulse when quests land."
                        value={hapticsEnabled}
                        onValueChange={setHapticsEnabled}
                      />
                    </View>
                  </View>
                ) : null}
              </Animated.View>
            </ScrollView>

            <View className="flex-row gap-2.5 pb-2 pt-3">
              {step > 0 ? (
                <IconButton
                  icon="arrowLeft"
                  label="Previous step"
                  onPress={() => setStep(step - 1)}
                  size={52}
                  variant="secondary"
                />
              ) : null}
              <Button
                label={step === 2 ? 'INITIALIZE LIFE.EXE' : 'CONTINUE'}
                iconRight={step === 2 ? 'bolt' : 'chevronRight'}
                onPress={next}
                disabled={step === 1 && focus.length === 0}
                size="lg"
                className="flex-1"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
