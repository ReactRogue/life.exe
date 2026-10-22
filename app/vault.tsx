import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { withAlpha } from '@/theme/palette';
import { coinBalance, cosmeticSnapshot, equippedTitle, equippedFrame, totalCoinsEarned, totalCoinsSpent } from '@/domain/selectors';
import {
  ACCENT_ITEMS,
  FRAMES,
  RARITY_META,
  TITLES,
  cosmeticStatus,
  requirementLabel,
  requirementProgress,
  type CosmeticItem,
} from '@/domain/cosmetics';
import { ACCENTS } from '@/theme/palette';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { AppText, HudLabel } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { SegmentedControl } from '@/components/ui/Field';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Icon } from '@/components/icons/Icon';
import { formatNumber } from '@/lib/format';

type VaultTab = 'title' | 'frame' | 'accent';

const TABS: { value: VaultTab; label: string }[] = [
  { value: 'title', label: 'Titles' },
  { value: 'frame', label: 'Frames' },
  { value: 'accent', label: 'Accents' },
];

export default function VaultScreen() {
  const router = useRouter();
  const { state, purchase, equip, notify } = useAppStore();
  const { palette, isDark } = useTheme();
  const [tab, setTab] = useState<VaultTab>('title');
  const [pendingBuy, setPendingBuy] = useState<CosmeticItem | null>(null);

  const snapshot = cosmeticSnapshot(state);
  const balance = coinBalance(state);
  const earned = totalCoinsEarned(state);
  const spent = totalCoinsSpent(state);
  const title = equippedTitle(state);
  const frame = equippedFrame(state);
  const accentLabel = ACCENTS[state.profile.accentId]?.label ?? 'Bio';

  const items = useMemo(() => {
    if (tab === 'title') return TITLES;
    if (tab === 'frame') return FRAMES;
    return ACCENT_ITEMS;
  }, [tab]);

  const ownedCount = items.filter((item) => cosmeticStatus(item, snapshot).owned).length;

  const equippedId =
    tab === 'title' ? state.profile.titleId : tab === 'frame' ? state.profile.frameId : ACCENT_ITEMS.find((item) => item.accentId === state.profile.accentId)?.id;

  const confirmPurchase = () => {
    if (!pendingBuy) return;
    const result = purchase(pendingBuy.id);
    if (result.ok) {
      equip(pendingBuy.id);
    }
    setPendingBuy(null);
  };

  return (
    <Screen>
      <View className="pt-1 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <HudLabel tone="accent">COSMETIC VAULT</HudLabel>
          <AppText variant="h1" className="mt-1">
            Loadout
          </AppText>
          <AppText variant="caption" tone="muted" className="mt-1">
            Spend the coins you earn. Nothing here changes your stats.
          </AppText>
        </View>
        <IconButton
          icon="close"
          label="Back to profile"
          variant="surface"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
        />
      </View>

      <Card className="mt-5" glow>
        <View className="flex-row items-center justify-between">
          <View>
            <HudLabel tone="faint">AVAILABLE COINS</HudLabel>
            <View className="mt-1 flex-row items-center gap-2">
              <Icon name="coin" size={22} color={palette.coin} />
              <AppText variant="numberLarge">{formatNumber(balance)}</AppText>
            </View>
            <AppText variant="micro" tone="faint" className="mt-1">
              {formatNumber(earned)} earned · {formatNumber(spent)} spent
            </AppText>
          </View>
          <View className="items-end gap-1">
            <Badge label="TITLES" tone="level" icon="star" compact />
            <HudLabel tone="faint">{TITLES.filter((item) => cosmeticStatus(item, snapshot).owned).length} OWNED</HudLabel>
            <Badge label="FRAMES" tone="success" icon="orbit" compact />
            <HudLabel tone="faint">{FRAMES.filter((item) => cosmeticStatus(item, snapshot).owned).length} OWNED</HudLabel>
          </View>
        </View>
      </Card>

      <View className="mt-4">
        <SegmentedControl
          label="Vault category"
          value={tab}
          options={TABS}
          onChange={(value) => setTab(value)}
        />
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <HudLabel tone="faint">{items.length} ITEMS · {ownedCount} OWNED</HudLabel>
        <HudLabel tone="faint">{tab === 'accent' ? 'CHANGES THE HUD' : 'PURELY COSMETIC'}</HudLabel>
      </View>

      <View className="mt-3 flex-row flex-wrap gap-2.5">
        {items.map((item) => {
          const status = cosmeticStatus(item, snapshot);
          const equipped = equippedId === item.id;
          const rarity = RARITY_META[item.rarity];
          const progress = requirementProgress(item, snapshot);
          const isPurchase = item.requirement.type === 'purchase';
          return (
            <View
              key={item.id}
              className="rounded-2xl border p-3.5"
              style={{
                width: '47.5%',
                flexGrow: 1,
                borderColor: equipped ? palette.primaryBorder : status.owned ? withAlpha(rarity.color, 0.35) : palette.border,
                backgroundColor: isDark ? '#0A141F' : '#FFFFFF',
              }}
            >
              <View className="h-[58px] items-center justify-center">
                <ItemPreview item={item} />
              </View>
              <View className="mt-2 flex-row items-start justify-between gap-1">
                <AppText variant="bodyStrong" numberOfLines={1} className="flex-1">
                  {item.name}
                </AppText>
                {equipped ? <Icon name="check" size={13} color={palette.primaryText} /> : null}
              </View>
              <AppText variant="micro" tone="faint" numberOfLines={2} className="mt-0.5 min-h-[32px]">
                {item.tagline}
              </AppText>

              <View className="mt-1.5 flex-row items-center gap-1">
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: rarity.color }} />
                <HudLabel tone="faint" style={{ color: rarity.color, fontSize: 9 }}>
                  {rarity.label.toUpperCase()}
                </HudLabel>
              </View>

              <View className="mt-2.5">
                {equipped ? (
                  <Button label="Equipped" variant="secondary" size="sm" disabled fullWidth icon="check" />
                ) : status.owned ? (
                  <Button label="Equip" size="sm" fullWidth variant="secondary" onPress={() => equip(item.id)} />
                ) : isPurchase ? (
                  <Button
                    label={status.purchasable ? `Buy · ${formatNumber((item.requirement as { cost: number }).cost)}` : 'Need more coins'}
                    size="sm"
                    fullWidth
                    variant="coin"
                    icon="coin"
                    disabled={!status.purchasable}
                    onPress={() => (status.purchasable ? setPendingBuy(item) : notify(`Earn ${status.missingCoins} more coins first.`, 'info'))}
                  />
                ) : (
                  <Button label="Locked" size="sm" fullWidth variant="ghost" icon="lock" disabled />
                )}
              </View>

              {!status.owned && !isPurchase ? (
                <View className="mt-2">
                  <AppText variant="micro" tone="faint" numberOfLines={2} style={{ fontSize: 9 }}>
                    {requirementLabel(item.requirement)}
                  </AppText>
                  {progress ? (
                    <ProgressBar progress={progress.current / progress.target} height={3} className="mt-1" />
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      <Card variant="ghost" className="mt-5">
        <View className="flex-row items-start gap-2.5">
          <Icon name="info" size={15} color={palette.primaryText} />
          <AppText variant="micro" tone="muted" className="flex-1">
            Coins come from quests, weekly bonuses, and achievement rewards. Achievements and level
            rewards unlock automatically — coin items are optional swagger.
          </AppText>
        </View>
      </Card>

      <Dialog
        visible={Boolean(pendingBuy)}
        onClose={() => setPendingBuy(null)}
        title={`Unlock ${pendingBuy?.name ?? ''}?`}
        description={
          pendingBuy && pendingBuy.requirement.type === 'purchase'
            ? `This costs ${formatNumber(pendingBuy.requirement.cost)} coins. You have ${formatNumber(balance)}.`
            : undefined
        }
        icon="coin"
        primaryAction={{
          label: 'Unlock and equip',
          icon: 'check',
          onPress: confirmPurchase,
        }}
        secondaryAction={{ label: 'Not now', onPress: () => setPendingBuy(null) }}
      >
        <View className="items-center py-2">
          {pendingBuy ? <ItemPreview item={pendingBuy} large /> : null}
          <View className="mt-3 flex-row items-center gap-3">
            <HudLabel tone="faint">BALANCE</HudLabel>
            <AppText variant="monoStrong">{formatNumber(balance)}</AppText>
            <Icon name="chevronRight" size={12} color={palette.textFaint} />
            <AppText variant="monoStrong" tone="accent">
              {formatNumber(balance - ((pendingBuy?.requirement as { cost?: number })?.cost ?? 0))}
            </AppText>
          </View>
        </View>
      </Dialog>
    </Screen>
  );
}

function ItemPreview({ item, large = false }: { item: CosmeticItem; large?: boolean }) {
  const { palette, isDark } = useTheme();
  if (item.kind === 'title') {
    return (
      <View
        className="items-center justify-center rounded-xl px-3 py-2"
        style={{ backgroundColor: withAlpha(palette.primary, 0.08), borderWidth: 1, borderColor: palette.primaryBorder }}
      >
        <AppText
          variant={large ? 'h2' : 'monoStrong'}
          style={{ color: palette.primaryText, letterSpacing: large ? 1.5 : 0.8 }}
          numberOfLines={1}
        >
          {item.uppercase}
        </AppText>
      </View>
    );
  }
  if (item.kind === 'frame') {
    return (
      <View className="items-center justify-center">
        <ProgressRing
          progress={1}
          size={large ? 84 : 54}
          strokeWidth={large ? 5 : 3.5}
          colors={item.colors}
          dashedTrack={item.style === 'dashed'}
        >
          <View
            style={{
              width: large ? 50 : 32,
              height: large ? 50 : 32,
              borderRadius: 30,
              backgroundColor: isDark ? '#0C1826' : '#F5F8FD',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="hex" size={large ? 22 : 15} color={item.colors[0]} />
          </View>
        </ProgressRing>
      </View>
    );
  }
  return (
    <View className="flex-row items-center gap-2">
      {[0, 1, 2].map((index) => (
        <View
          key={index}
          style={{
            width: large ? 32 : 22,
            height: large ? 32 : 22,
            borderRadius: large ? 10 : 7,
            backgroundColor: ACCENTS[item.accentId].gradient[index % 2],
            opacity: index === 1 ? 0.7 : 1,
          }}
        />
      ))}
    </View>
  );
}
