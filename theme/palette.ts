/**
 * Life.exe design tokens.
 *
 * The app renders both a dark "night console" and a light "daylight HUD".
 * Every text token is contrast-checked in domain/__tests__/contrast.test.ts.
 */

export type ThemeMode = 'dark' | 'light' | 'system';
export type ResolvedMode = 'dark' | 'light';
export type AccentId = 'mint' | 'ion' | 'violet' | 'ember';

export interface Accent {
  id: AccentId;
  label: string;
  blurb: string;
  /** Primary accent used on dark surfaces (bright, luminous). */
  bright: string;
  /** Dimmer sister tone for dark surfaces. */
  brightSoft: string;
  /** Primary accent used on light surfaces (deep, AA-safe). */
  deep: string;
  /** Text color placed on top of `bright`. */
  onBright: string;
  /** Text color placed on top of `deep`. */
  onDeep: string;
  gradient: readonly [string, string];
}

export const ACCENTS: Record<AccentId, Accent> = {
  mint: {
    id: 'mint',
    label: 'Bio',
    blurb: 'Bioluminescent mint',
    bright: '#5CF2C6',
    brightSoft: '#8CFFDF',
    deep: '#067A5B',
    onBright: '#04120E',
    onDeep: '#FFFFFF',
    gradient: ['#5CF2C6', '#7AA2FF'],
  },
  ion: {
    id: 'ion',
    label: 'Ion',
    blurb: 'Reactor blue',
    bright: '#7AA2FF',
    brightSoft: '#A9C1FF',
    deep: '#2B55C9',
    onBright: '#050D1F',
    onDeep: '#FFFFFF',
    gradient: ['#7AA2FF', '#C88CFF'],
  },
  violet: {
    id: 'violet',
    label: 'Nova',
    blurb: 'Nebula violet',
    bright: '#C88CFF',
    brightSoft: '#E0B8FF',
    deep: '#7E33C9',
    onBright: '#140A1E',
    onDeep: '#FFFFFF',
    gradient: ['#C88CFF', '#FF8FB8'],
  },
  ember: {
    id: 'ember',
    label: 'Ember',
    blurb: 'Solar flare',
    bright: '#FF9B6A',
    brightSoft: '#FFC29B',
    deep: '#A83E0F',
    onBright: '#1A0803',
    onDeep: '#FFFFFF',
    gradient: ['#FF9B6A', '#FFC46B'],
  },
};

export interface Palette {
  mode: ResolvedMode;
  bg: string;
  bgSoft: string;
  surface: string;
  surfaceAlt: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textFaint: string;
  primary: string;
  primaryText: string;
  primarySoft: string;
  primaryBorder: string;
  onPrimary: string;
  gradient: readonly [string, string];
  success: string;
  successText: string;
  warning: string;
  warningText: string;
  danger: string;
  dangerText: string;
  coin: string;
  coinSoft: string;
  grid: string;
  shadow: string;
  overlay: string;
  scrim: string;
  tabInactive: string;
  skeleton: string;
}

export const DARK_PALETTE: Omit<Palette, 'primary' | 'primaryText' | 'primarySoft' | 'primaryBorder' | 'onPrimary' | 'gradient'> = {
  mode: 'dark',
  bg: '#060A12',
  bgSoft: '#080E18',
  surface: '#0B1420',
  surfaceAlt: '#0F1A2A',
  surfaceMuted: '#0E1725',
  border: 'rgba(151,181,222,0.16)',
  borderStrong: 'rgba(151,181,222,0.30)',
  text: '#EAF2FF',
  textMuted: '#A7B8CE',
  textFaint: '#8296B0',
  success: '#5CF2C6',
  successText: '#5CF2C6',
  warning: '#FFC46B',
  warningText: '#FFC46B',
  danger: '#FF8B95',
  dangerText: '#FF8B95',
  coin: '#FFC46B',
  coinSoft: 'rgba(255,196,107,0.14)',
  grid: 'rgba(146,178,224,0.06)',
  shadow: '#000000',
  overlay: 'rgba(2,6,12,0.74)',
  scrim: 'rgba(2,6,12,0.55)',
  tabInactive: '#8DA1BA',
  skeleton: 'rgba(151,181,222,0.08)',
};

export const LIGHT_PALETTE: Omit<Palette, 'primary' | 'primaryText' | 'primarySoft' | 'primaryBorder' | 'onPrimary' | 'gradient'> = {
  mode: 'light',
  bg: '#F2F6FB',
  bgSoft: '#EAF1F9',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F8FD',
  surfaceMuted: '#EDF3FA',
  border: 'rgba(16,42,74,0.13)',
  borderStrong: 'rgba(16,42,74,0.24)',
  text: '#0A1526',
  textMuted: '#526178',
  textFaint: '#68788F',
  success: '#067A5B',
  successText: '#045E46',
  warning: '#8A5606',
  warningText: '#7A4A03',
  danger: '#A81F30',
  dangerText: '#961A2A',
  coin: '#8A5606',
  coinSoft: 'rgba(138,86,6,0.10)',
  grid: 'rgba(23,49,84,0.05)',
  shadow: '#102A4A',
  overlay: 'rgba(9,20,34,0.45)',
  scrim: 'rgba(9,20,34,0.30)',
  tabInactive: '#5C6C82',
  skeleton: 'rgba(16,42,74,0.06)',
};

export function buildPalette(mode: ResolvedMode, accent: AccentId): Palette {
  const base = mode === 'dark' ? DARK_PALETTE : LIGHT_PALETTE;
  const tone = ACCENTS[accent] ?? ACCENTS.mint;
  const primary = mode === 'dark' ? tone.bright : tone.deep;
  const onPrimary = mode === 'dark' ? tone.onBright : tone.onDeep;
  return {
    ...base,
    primary,
    primaryText: primary,
    primarySoft: mode === 'dark' ? withAlpha(tone.bright, 0.14) : withAlpha(tone.deep, 0.1),
    primaryBorder: mode === 'dark' ? withAlpha(tone.bright, 0.34) : withAlpha(tone.deep, 0.3),
    onPrimary,
    gradient: tone.gradient,
  };
}

/** Category / skill hue pair — bright for dark mode, deep for light mode. */
export interface HuePair {
  dark: string;
  light: string;
}

export const SKILL_HUES: Record<string, HuePair> = {
  fitness: { dark: '#FF9B7A', light: '#A8401B' },
  learning: { dark: '#8AB0FF', light: '#2B55C9' },
  creativity: { dark: '#D3A0FF', light: '#7A2EBF' },
  relationships: { dark: '#FFA0C2', light: '#A8285A' },
  discipline: { dark: '#5CF2C6', light: '#067A5B' },
  finance: { dark: '#FFD07A', light: '#7A4A03' },
  craft: { dark: '#8FE6C8', light: '#0A6B58' },
  mind: { dark: '#A7C4FF', light: '#304C9E' },
  body: { dark: '#FFB59E', light: '#A3401F' },
  social: { dark: '#FFC0D8', light: '#A02A55' },
};

export const SWATCHES: HuePair[] = Object.values(SKILL_HUES);

export function hueFor(key: string, mode: ResolvedMode): string {
  const pair = SKILL_HUES[key] ?? SKILL_HUES.discipline;
  return mode === 'dark' ? pair.dark : pair.light;
}

export function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const value = parseInt(full, 16);
  if (Number.isNaN(value)) return hex;
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function mix(hexA: string, hexB: string, weight: number): string {
  const parse = (hex: string) => {
    const full = hex.replace('#', '');
    const value = parseInt(full.length === 3 ? full.split('').map((c) => c + c).join('') : full, 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  };
  const a = parse(hexA);
  const b = parse(hexB);
  const channel = (i: number) => Math.round(a[i] * (1 - weight) + b[i] * weight);
  return `#${[channel(0), channel(1), channel(2)].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

/** WCAG relative luminance. */
export function luminance(hex: string): number {
  const full = hex.replace('#', '');
  const value = parseInt(full.length === 3 ? full.split('').map((c) => c + c).join('') : full, 16);
  const channel = (n: number) => {
    const c = n / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel((value >> 16) & 255) + 0.7152 * channel((value >> 8) & 255) + 0.0722 * channel(value & 255);
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}
