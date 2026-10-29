/**
 * CourseAdvisor / AnSciPath Design System & Theme Tokens
 *
 * Color values are sampled directly from the 15 official UI prototype screens
 * in `docs/CourseAdvisor_UI_Design.pdf` (`docs/ui-screenshots/`).
 */

import { Platform } from 'react-native';

export const BrandTheme = {
  /** Primary deep forest green used on CTA buttons, active tabs, and hero cards */
  primaryGreen: '#196B45',
  /** Darker button green sampled from Welcome Get Started button */
  welcomeButtonGreen: '#1B5F3A',
  /** Bright leaf green used in "AnSci" wordmark, checkmarks, and slider tracks */
  accentLeafGreen: '#288A43',
  /** Checkmark badge green */
  checkGreen: '#1FA750',
  /** Soft mint tint at the top of onboarding screens */
  headerMintStart: '#D9EEDD',
  headerMintEnd: '#F7FCF8',
  /** Soft green info banner background */
  infoBannerBg: '#E4F5E8',
  /** Active tab pill background */
  activeTabPill: '#E3F2E8',
  /** Welcome bottom card surface */
  welcomeCardSurface: '#E5ECE6',
  /** Deep forest title text ("Path", headings) */
  textPrimary: '#0F301B',
  /** Muted slate-green secondary text */
  textSecondary: '#5A6B60',
  /** Subtle caption / placeholder text */
  textMuted: '#7A887F',
  /** Card & input surfaces */
  surface: '#FFFFFF',
  surfaceSubtle: '#F8F9F8',
  borderSubtle: '#E2E8E4',
  /** Dashed ring color on Welcome medallion */
  medallionDashedBorder: '#949B94',
  /** Crest pinhead colors on Welcome medallion (left to right) */
  crestPinGreen: '#28954A',
  crestPinYellow: '#E59E03',
  crestPinOrange: '#EE7C0E',
  crestPinRed: '#C2372C',
  /** Workload stress semantic colors */
  stressBalanced: '#1FA750',
  stressModerate: '#F39828',
  stressModerateBg: '#FDF3E3',
  stressHigh: '#D93829',
  /** Student initials avatar badge */
  avatarCoral: '#DF7E58',
} as const;

export const Colors = {
  light: {
    text: BrandTheme.textPrimary,
    background: '#FFFFFF',
    backgroundElement: BrandTheme.surfaceSubtle,
    backgroundSelected: BrandTheme.activeTabPill,
    textSecondary: BrandTheme.textSecondary,
    primary: BrandTheme.primaryGreen,
    accent: BrandTheme.accentLeafGreen,
    border: BrandTheme.borderSubtle,
  },
  dark: {
    text: '#FFFFFF',
    background: '#0F1F15',
    backgroundElement: '#192E21',
    backgroundSelected: '#244230',
    textSecondary: '#A8B8AE',
    primary: '#28954A',
    accent: '#34A853',
    border: '#2B4233',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'sans-serif',
    serif: 'serif',
    rounded: 'sans-serif-medium',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
