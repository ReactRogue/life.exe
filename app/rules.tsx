import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useAppStore } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { DEFAULT_RULES, DIFFICULTIES, LEVEL_PRESETS } from '@/domain/constants';
import { awardForQuest, totalXpForLevel } from '@/domain/xp';
import { currentStreakOf, profileLevel } from '@/domain/selectors';
import type { Difficulty, Rules } from '@/domain/types';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { AppText, HudLabel } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { SegmentedControl, Stepper, SwitchRow, TextField, OptionCard } from '@/components/ui/Field';
import { Icon } from '@/components/icons/Icon';
import { formatNumber } from '@/lib/format';

export default function RulesScreen() {
  const router = useRouter();
  const { state, updateRules, updatePreferences, exportSave, importSave, notify } = useAppStore();
  const { palette, themeMode, setThemeMode } = useTheme();
  const rules = state.settings.rules;
  const streak = currentStreakOf(state, state.meta.lastSeenDate);
  const level = profileLevel(state);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [dataMode, setDataMode] = useState<'export' | 'import' | null>(null);
  const [exportText, setExportText] = useState('');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | undefined>();

  const setRule = <K extends keyof Rules>(key: K, value: Rules[K]) => {
    updateRules({ ...rules, [key]: value });
  };
  const setDifficultyXp = (difficulty: Difficulty, value: number) => {
    updateRules({ ...rules, xpByDifficulty: { ...rules.xpByDifficulty, [difficulty]: value } });
  };
  const setDifficultyCoins = (difficulty: Difficulty, value: number) => {
    updateRules({ ...rules, coinsByDifficulty: { ...rules.coinsByDifficulty, [difficulty]: value } });
  };

  const sampleStreak = Math.max(1, streak.days + (streak.activeToday ? 0 : 1));
  const sample = awardForQuest({ difficulty: 'moderate', cadence: 'daily' }, rules, sampleStreak);
  const presetId = LEVEL_PRESETS.find(
    (preset) => preset.levelBase === rules.levelBase && preset.levelGrowth === rules.levelGrowth,
  )?.id;
  const levelTen = totalXpForLevel(10, rules);

  const openExport = () => {
    setExportText(exportSave());
    setDataMode('export');
  };

  const openImport = () => {
    setImportText('');
    setImportError(undefined);
    setDataMode('import');
  };

  const copyExport = async () => {
    try {
      await Clipboard.setStringAsync(exportText);
      notify('Save JSON copied to clipboard.', 'success');
    } catch {
      notify('Clipboard is unavailable. Long-press the text to copy.', 'error');
    }
  };

  const applyImport = () => {
    const result = importSave(importText);
    if (result.ok) {
      setDataMode(null);
      setImportText('');
    } else {
      setImportError(result.error ?? 'Could not read that save.');
    }
  };

  return (
    <Screen>
      <View className="pt-1 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <HudLabel tone="accent">SYSTEM RULES · V1</HudLabel>
          <AppText variant="h1" className="mt-1">
            Reward engine
          </AppText>
          <AppText variant="caption" tone="muted" className="mt-1">
            Tune XP, coins, streaks, and the level curve. Changes apply to future completions.
          </AppText>
        </View>
        <IconButton
          icon="close"
          label="Back"
          variant="surface"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
        />
      </View>

      <View className="mt-4 flex-row items-center gap-2">
        <Badge label="AUTO-SAVED" tone="success" icon="save" />
        <Badge label="LOCAL FIRST" tone="level" icon="signal" />
      </View>

      <Card variant="accent" className="mt-4">
        <View className="flex-row items-center justify-between">
          <HudLabel tone="accent">LIVE PREVIEW</HudLabel>
          <Badge label={`${sampleStreak}D STREAK`} tone="streak" icon="flame" compact />
        </View>
        <AppText variant="bodyStrong" className="mt-2">
          A Standard daily quest
        </AppText>
        <View className="mt-2 flex-row items-end gap-4">
          <View>
            <HudLabel tone="faint">REWARD</HudLabel>
            <View className="mt-1 flex-row items-center gap-1.5">
              <Icon name="bolt" size={17} color={palette.primaryText} filled />
              <AppText variant="number" tone="accent">
                +{formatNumber(sample.xp)}
              </AppText>
              <Icon name="coin" size={15} color={palette.coin} />
              <AppText variant="monoStrong" tone="coin">
                {sample.coins}
              </AppText>
            </View>
          </View>
          <View>
            <HudLabel tone="faint">STREAK BONUS</HudLabel>
            <AppText variant="monoStrong" className="mt-1">
              {sample.multiplier > 1 ? `x${sample.multiplier.toFixed(2)}` : 'x1.00'} · +{sample.xp - sample.baseXp} XP
            </AppText>
          </View>
        </View>
        <AppText variant="micro" tone="muted" className="mt-2">
          Daily goal bonus: +{rules.dailyGoalBonusXp} XP · Weekly missions add +{rules.weeklyBonusXp} XP and{' '}
          {rules.weeklyBonusCoins} coins.
        </AppText>
      </Card>

      <View className="mt-6">
        <SectionLabel label="REWARD MATRIX" hint="BASE XP / COINS" />
        <Card className="mt-2">
          {DIFFICULTIES.map((difficulty, index) => (
            <View
              key={difficulty.id}
              className="py-3"
              style={index > 0 ? { borderTopWidth: 1, borderTopColor: palette.border } : null}
            >
              <View className="flex-row items-center justify-between gap-2">
                <View className="flex-row items-center gap-2">
                  <AppText variant="bodyStrong">{difficulty.label}</AppText>
                  <HudLabel tone="faint">{difficulty.code}</HudLabel>
                </View>
                <AppText variant="micro" tone="faint">
                  {difficulty.blurb}
                </AppText>
              </View>
              <View className="mt-2 flex-row gap-2">
                <RuleNumber
                  label="BASE XP"
                  value={rules.xpByDifficulty[difficulty.id]}
                  onChange={(value) => setDifficultyXp(difficulty.id, value)}
                  min={1}
                  max={500}
                  step={5}
                />
                <RuleNumber
                  label="COINS"
                  value={rules.coinsByDifficulty[difficulty.id]}
                  onChange={(value) => setDifficultyCoins(difficulty.id, value)}
                  min={0}
                  max={100}
                  step={1}
                />
              </View>
            </View>
          ))}
        </Card>
      </View>

      <View className="mt-6">
        <SectionLabel label="STREAK ENGINE" hint="MOMENTUM PAYS" />
        <Card className="mt-2">
          <Stepper
            label="Bonus per streak day"
            hint="Added per day of current streak"
            value={Math.round(rules.streakBonusPerDay * 100)}
            onChange={(value) => setRule('streakBonusPerDay', value / 100)}
            min={0}
            max={25}
            step={1}
            unit="%"
          />
          <Divider />
          <Stepper
            label="Bonus cap"
            hint="The most a streak can multiply rewards"
            value={Math.round(rules.streakBonusCap * 100)}
            onChange={(value) => setRule('streakBonusCap', value / 100)}
            min={0}
            max={200}
            step={5}
            unit="%"
          />
          <Divider />
          <Stepper
            label="Grace days"
            hint="Missed days that don’t break a streak"
            value={rules.graceDays}
            onChange={(value) => setRule('graceDays', value)}
            min={0}
            max={3}
            step={1}
            unit="d"
          />
          <AppText variant="micro" tone="faint" className="mt-1">
            A grace day is a shield, not a penalty. With {rules.graceDays}, a streak can bridge a
            short pause and still count.
          </AppText>
        </Card>
      </View>

      <View className="mt-6">
        <SectionLabel label="GOALS & BONUSES" hint="EXTRA SIGNALS" />
        <Card className="mt-2">
          <Stepper
            label="Daily goal"
            hint="Quests needed to secure the daily bonus"
            value={rules.dailyGoalCount}
            onChange={(value) => setRule('dailyGoalCount', value)}
            min={1}
            max={12}
            step={1}
          />
          <Divider />
          <Stepper
            label="Daily goal bonus"
            hint="Awarded once per day"
            value={rules.dailyGoalBonusXp}
            onChange={(value) => setRule('dailyGoalBonusXp', value)}
            min={0}
            max={200}
            step={5}
            unit="XP"
          />
          <Divider />
          <Stepper
            label="Weekly mission XP"
            hint="Added to the weekly quest reward"
            value={rules.weeklyBonusXp}
            onChange={(value) => setRule('weeklyBonusXp', value)}
            min={0}
            max={300}
            step={5}
            unit="XP"
          />
          <Divider />
          <Stepper
            label="Weekly mission coins"
            hint="Added to the weekly quest reward"
            value={rules.weeklyBonusCoins}
            onChange={(value) => setRule('weeklyBonusCoins', value)}
            min={0}
            max={60}
            step={1}
          />
          <Divider />
          <HudLabel tone="muted" className="mb-2">
            WEEK STARTS ON
          </HudLabel>
          <SegmentedControl
            label="Week start"
            value={rules.weekStart === 0 ? 'sun' : 'mon'}
            options={[
              { value: 'mon', label: 'Monday' },
              { value: 'sun', label: 'Sunday' },
            ]}
            onChange={(value) => setRule('weekStart', value === 'sun' ? 0 : 1)}
          />
        </Card>
      </View>

      <View className="mt-6">
        <SectionLabel label="LEVEL CURVE" hint={`LVL ${level.level} · ${formatNumber(totalXpForLevel(level.level + 1, rules) - level.totalXp)} XP TO NEXT`} />
        <Card className="mt-2">
          <View className="gap-2">
            {LEVEL_PRESETS.map((preset) => (
              <OptionCard
                key={preset.id}
                title={preset.label}
                description={`${preset.blurb} · level 10 at ${formatNumber(totalXpForLevel(10, { ...rules, levelBase: preset.levelBase, levelGrowth: preset.levelGrowth }))} XP`}
                selected={presetId === preset.id}
                onPress={() => updateRules({ ...rules, levelBase: preset.levelBase, levelGrowth: preset.levelGrowth })}
                leading={<Icon name="signal" size={16} color={palette.primaryText} />}
              />
            ))}
          </View>
          <View className="mt-3">
            <Stepper
              label="Base XP to level 2"
              hint="How heavy the first step feels"
              value={rules.levelBase}
              onChange={(value) => setRule('levelBase', value)}
              min={50}
              max={400}
              step={10}
              unit="XP"
            />
            <Divider />
            <Stepper
              label="Curve growth"
              hint="Extra XP required per level"
              value={rules.levelGrowth}
              onChange={(value) => setRule('levelGrowth', value)}
              min={0.1}
              max={0.9}
              step={0.05}
              formatter={(value) => `x${value.toFixed(2)}`}
            />
            <AppText variant="micro" tone="faint" className="mt-1">
              At these values, level 10 needs {formatNumber(levelTen)} total XP. The character and
              every skill tree share this curve.
            </AppText>
          </View>
        </Card>
      </View>

      <View className="mt-6">
        <SectionLabel label="INTERFACE" hint="LOCAL PREFERENCES" />
        <Card className="mt-2">
          <SegmentedControl
            label="Theme"
            value={themeMode}
            options={[
              { value: 'dark', label: 'Night', icon: 'moon' },
              { value: 'light', label: 'Day', icon: 'sun' },
              { value: 'system', label: 'Auto', icon: 'refresh' },
            ]}
            onChange={(value) => setThemeMode(value)}
          />
          <View className="mt-2">
            <SwitchRow
              label="Haptic feedback"
              description="Light pulses for completions and celebrations."
              value={state.settings.preferences.haptics}
              onValueChange={(value) => updatePreferences({ haptics: value })}
            />
          </View>
        </Card>
      </View>

      <View className="mt-6">
        <SectionLabel label="DATA & SYNC" hint="PORTABLE BY DESIGN" />
        <Card className="mt-2">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Icon name="upload" size={14} color={palette.textMuted} />
                <AppText variant="bodyStrong">Cloud sync</AppText>
                <Badge label="NOT CONNECTED" tone="neutral" compact />
              </View>
              <AppText variant="micro" tone="faint" className="mt-1">
                Progress is stored locally in a versioned snapshot. The sync adapter is prepared for
                a future backend — no account is required today.
              </AppText>
            </View>
          </View>
          <View className="mt-4 flex-row gap-2">
            <Button label="Export save" variant="secondary" icon="download" size="sm" className="flex-1" onPress={openExport} />
            <Button label="Import save" variant="secondary" icon="upload" size="sm" className="flex-1" onPress={openImport} />
          </View>
          <View className="mt-3 flex-row items-center gap-2">
            <Icon name="info" size={12} color={palette.textFaint} />
            <AppText variant="micro" tone="faint">
              Snapshots are schema v{state.schemaVersion} · {state.quests.length} quests ·{' '}
              {state.completions.length} logs.
            </AppText>
          </View>
        </Card>
      </View>

      <View className="mt-5 flex-row gap-2">
        <Button
          label="Restore factory rules"
          variant="ghost"
          icon="refresh"
          size="sm"
          onPress={() => setRestoreOpen(true)}
          className="flex-1"
        />
      </View>

      <Dialog
        visible={Boolean(dataMode)}
        onClose={() => setDataMode(null)}
        title={dataMode === 'export' ? 'Export save' : 'Import save'}
        description={
          dataMode === 'export'
            ? 'A portable snapshot of every quest, log, and unlock. Copy it somewhere safe.'
            : 'Paste a Life.exe save. Valid data is merged into this device.'
        }
        icon={dataMode === 'export' ? 'download' : 'upload'}
        primaryAction={
          dataMode === 'export'
            ? { label: 'Copy JSON', icon: 'copy', onPress: copyExport }
            : { label: 'Import', icon: 'check', onPress: applyImport }
        }
        secondaryAction={{ label: 'Close', onPress: () => setDataMode(null) }}
      >
        {dataMode === 'export' ? (
          <TextField
            label="SAVE JSON"
            value={exportText}
            editable={false}
            multiline
            className="min-h-[150px] text-[11px]"
            containerClassName="max-h-[220px]"
            selectTextOnFocus
          />
        ) : (
          <TextField
            label="PASTE SAVE JSON"
            value={importText}
            onChangeText={(text) => {
              setImportText(text);
              setImportError(undefined);
            }}
            placeholder='{"app":"life.exe",...}'
            multiline
            error={importError}
            className="min-h-[130px] text-[11px]"
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}
      </Dialog>

      <Dialog
        visible={restoreOpen}
        onClose={() => setRestoreOpen(false)}
        title="Restore factory rules?"
        description="XP values, streak bonuses, grace days, and the level curve return to the defaults. Past completions keep the rewards they were given."
        icon="refresh"
        primaryAction={{
          label: 'Restore defaults',
          icon: 'refresh',
          onPress: () => {
            updateRules(DEFAULT_RULES);
            setRestoreOpen(false);
          },
        }}
        secondaryAction={{ label: 'Cancel', onPress: () => setRestoreOpen(false) }}
      />
    </Screen>
  );
}

function SectionLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <HudLabel tone="muted">{label}</HudLabel>
      {hint ? <HudLabel tone="faint">{hint}</HudLabel> : null}
    </View>
  );
}

function Divider() {
  const { palette } = useTheme();
  return <View style={{ height: 1, backgroundColor: palette.border, marginVertical: 2 }} />;
}

function RuleNumber({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  const { palette } = useTheme();
  const clamp = (next: number) => Math.min(max, Math.max(min, Math.round(next)));
  return (
    <View className="flex-1">
      <HudLabel tone="faint" style={{ fontSize: 9 }}>
        {label}
      </HudLabel>
      <View
        className="mt-1 flex-row items-center justify-between rounded-lg border px-1"
        style={{ borderColor: palette.border, backgroundColor: palette.surfaceAlt, height: 34 }}
      >
        <IconButton
          icon="minus"
          label={`Decrease ${label}`}
          size={26}
          variant="ghost"
          color={palette.textMuted}
          onPress={() => onChange(clamp(value - step))}
          disabled={value <= min}
        />
        <AppText variant="monoStrong" style={{ fontSize: 12 }} numberOfLines={1}>
          {value}
        </AppText>
        <IconButton
          icon="plus"
          label={`Increase ${label}`}
          size={26}
          variant="ghost"
          color={palette.textMuted}
          onPress={() => onChange(clamp(value + step))}
          disabled={value >= max}
        />
      </View>
    </View>
  );
}
