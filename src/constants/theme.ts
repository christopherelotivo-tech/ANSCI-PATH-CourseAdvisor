import { Platform } from "react-native";

export const BrandTheme = {
  primaryGreen: "#196B45",
  welcomeButtonGreen: "#1B5F3A",
  accentLeafGreen: "#288A43",
  checkGreen: "#1FA750",
  headerMintStart: "#D9EEDD",
  headerMintEnd: "#F7FCF8",
  infoBannerBg: "#E4F5E8",
  activeTabPill: "#E3F2E8",
  welcomeCardSurface: "#E5ECE6",
  textPrimary: "#0F301B",
  textSecondary: "#5A6B60",
  textMuted: "#7A887F",
  surface: "#FFFFFF",
  surfaceSubtle: "#F8F9F8",
  borderSubtle: "#E2E8E4",
  medallionDashedBorder: "#949B94",
  crestPinGreen: "#28954A",
  crestPinYellow: "#E59E03",
  crestPinOrange: "#EE7C0E",
  crestPinRed: "#C2372C",
  stressBalanced: "#1FA750",
  stressModerate: "#F39828",
  stressModerateBg: "#FDF3E3",
  stressHigh: "#D93829",
  avatarCoral: "#DF7E58",
} as const;

export const Colors = {
  light: {
    text: BrandTheme.textPrimary,
    background: "#FFFFFF",
    backgroundElement: BrandTheme.surfaceSubtle,
    backgroundSelected: BrandTheme.activeTabPill,
    textSecondary: BrandTheme.textSecondary,
    primary: BrandTheme.primaryGreen,
    accent: BrandTheme.accentLeafGreen,
    border: BrandTheme.borderSubtle,
  },
  dark: {
    text: "#FFFFFF",
    background: "#0F1F15",
    backgroundElement: "#192E21",
    backgroundSelected: "#244230",
    textSecondary: "#A8B8AE",
    primary: "#28954A",
    accent: "#34A853",
    border: "#2B4233",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "sans-serif",
    serif: "serif",
    rounded: "sans-serif-medium",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
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
