import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../stores/settingsStore';
import type { FontScale, ThemeMode } from './themeTypes';

export type { FontScale, ThemeMode };

export interface ThemeColors {
  bg: string;
  bgElevated: string;
  surface: string;
  surfaceMuted: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  borderStrong: string;
  primary: string;
  primarySoft: string;
  primaryGradient: readonly [string, string];
  heroGradient: readonly [string, string, string];
  accent: string;
  accentSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  error: string;
  errorSoft: string;
  highlightBg: string;
  highlightBorder: string;
  shadow: string;
  scrim: string;
}

const lightColors: ThemeColors = {
  bg: '#fafafa',
  bgElevated: '#ffffff',
  surface: '#ffffff',
  surfaceMuted: '#f4f4f5',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#94a3b8',
  border: '#e5e7eb',
  borderStrong: '#d1d5db',
  primary: '#6366f1',
  primarySoft: '#eef2ff',
  primaryGradient: ['#818cf8', '#6366f1'] as const,
  heroGradient: ['#fb7185', '#a855f7', '#6366f1'] as const,
  accent: '#ec4899',
  accentSoft: '#fce7f3',
  success: '#10b981',
  successSoft: '#d1fae5',
  warning: '#f59e0b',
  warningSoft: '#fef3c7',
  error: '#ef4444',
  errorSoft: '#fee2e2',
  highlightBg: '#fef9c3',
  highlightBorder: '#facc15',
  shadow: '#0b1220',
  scrim: 'rgba(15, 23, 42, 0.5)',
};

const darkColors: ThemeColors = {
  bg: '#09090b',
  bgElevated: '#18181b',
  surface: '#1c1c1f',
  surfaceMuted: '#27272a',
  textPrimary: '#fafafa',
  textSecondary: '#a1a1aa',
  textTertiary: '#71717a',
  border: '#27272a',
  borderStrong: '#3f3f46',
  primary: '#a78bfa',
  primarySoft: '#312e81',
  primaryGradient: ['#a78bfa', '#7c3aed'] as const,
  heroGradient: ['#f472b6', '#a855f7', '#6366f1'] as const,
  accent: '#f472b6',
  accentSoft: '#831843',
  success: '#34d399',
  successSoft: '#064e3b',
  warning: '#fbbf24',
  warningSoft: '#78350f',
  error: '#f87171',
  errorSoft: '#7f1d1d',
  highlightBg: '#713f12',
  highlightBorder: '#facc15',
  shadow: '#000000',
  scrim: 'rgba(0, 0, 0, 0.6)',
};

export const FONT_SCALE_VALUES: Record<FontScale, number> = {
  xxsmall: 0.72,
  xsmall: 0.82,
  small: 0.92,
  medium: 1.0,
  large: 1.1,
  xlarge: 1.22,
  xxlarge: 1.36,
  xxxlarge: 1.52,
};

export const FONT_SCALE_LABELS: Record<FontScale, string> = {
  xxsmall: '초소',
  xsmall: '특소',
  small: '작게',
  medium: '보통',
  large: '크게',
  xlarge: '특대',
  xxlarge: '초대',
  xxxlarge: '최대',
};

export const FONT_SCALE_ORDER: FontScale[] = [
  'xxsmall',
  'xsmall',
  'small',
  'medium',
  'large',
  'xlarge',
  'xxlarge',
  'xxxlarge',
];

export interface Theme {
  isDark: boolean;
  colors: ThemeColors;
  fontScale: number;
  fontScaleKey: FontScale;
  themeMode: ThemeMode;
  spacing: (n: number) => number;
  fs: (n: number) => number;
  radius: { xs: number; sm: number; md: number; lg: number; xl: number; full: number };
  shadows: {
    sm: object;
    md: object;
    lg: object;
  };
  fonts: {
    body: string;
    bodyMedium: string;
    bodyBold: string;
    bodyBlack: string;
    jp: string;
    jpBold: string;
    num: string;
    numBold: string;
    numBlack: string;
  };
}

export const FONTS = {
  body: 'NotoSansKR_400Regular',
  bodyMedium: 'NotoSansKR_500Medium',
  bodyBold: 'NotoSansKR_700Bold',
  bodyBlack: 'NotoSansKR_900Black',
  jp: 'NotoSansJP_500Medium',
  jpBold: 'NotoSansJP_700Bold',
  num: 'Inter_500Medium',
  numBold: 'Inter_700Bold',
  numBlack: 'Inter_900Black',
} as const;

function buildShadows(color: string, isDark: boolean) {
  const opacityFactor = isDark ? 1.6 : 1;
  return {
    sm: {
      shadowColor: color,
      shadowOpacity: 0.04 * opacityFactor,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    md: {
      shadowColor: color,
      shadowOpacity: 0.06 * opacityFactor,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    lg: {
      shadowColor: color,
      shadowOpacity: 0.10 * opacityFactor,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
  };
}

export function useTheme(): Theme {
  const systemScheme = useColorScheme();
  const themeMode = useSettingsStore((s) => s.themeMode);
  const fontScaleKey = useSettingsStore((s) => s.fontScale);

  const resolved: 'light' | 'dark' =
    themeMode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themeMode;
  const isDark = resolved === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const fontScale = FONT_SCALE_VALUES[fontScaleKey];

  return {
    isDark,
    colors,
    fontScale,
    fontScaleKey,
    themeMode,
    spacing: (n: number) => n * 4,
    fs: (n: number) => Math.round(n * fontScale),
    radius: { xs: 6, sm: 10, md: 14, lg: 20, xl: 28, full: 999 },
    shadows: buildShadows(colors.shadow, isDark),
    fonts: FONTS,
  };
}
