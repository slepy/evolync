import { config } from "@tamagui/config/v3";
import { createTamagui, createTokens } from "tamagui";

// ============================================================================
// Chinese-Inspired Color Palette
// ============================================================================

const customTokens = createTokens({
  ...config.tokens,
  color: {
    ...config.tokens.color,
    // Imperial Red (主红 - Zhǔ hóng)
    imperialRed: "#DC2626",
    imperialRedLight: "#EF4444",
    imperialRedLighter: "#fed1d1",
    imperialRedDark: "#B91C1C",

    // Gold (金 - Jīn)
    chineseGold: "#F59E0B",
    chineseGoldLight: "#FBBF24",
    chineseGoldLighter: "#fbefd2",
    chineseGoldDark: "#D97706",

    darkBlue: "#1E40AF",
    darkBlueLight: "#3B82F6",
    darkBlueLighter: "#dbeafe",
    darkBlueDark: "#1E3A8A",

    // Deep Indigo (靛蓝 - Diàn lán)
    deepIndigo: "#1E293B",
    deepIndigoLight: "#334155",
    deepIndigoLighter: "#797a7b",
    deepIndigoDark: "#0F172A",

    // Jade Green (翡翠 - Fěi cuì)
    jadeGreen: "#059669",
    jadeGreenLight: "#10B981",
    jadeGreenLighter: "#d6f1e8",
    jadeGreenDark: "#047857",

    // Pearl White (珍珠白 - Zhēn zhū bái)
    pearlWhite: "#F8FAFC",
    pearlWhiteLight: "#FFFFFF",

    // Ink Black (墨黑 - Mò hēi)
    inkBlack: "#0F172A",
    inkBlackLight: "#1E293B",

    // Soft Gray (灰 - Huī)
    softGray: "#94A3B8",
    softGrayLight: "#CBD5E1",
    softGrayLighter: "#E2E8F0",
    softGrayDark: "#64748B",

    // Cyan (青 - Qīng)
    chineseCyan: "#0891B2",
    chineseCyanLight: "#22D3EE",
    chineseCyanLighter: "#cffafe",
    chineseCyanDark: "#0E7490",

    // Coral (珊瑚 - Shānhú)
    chineseCoral: "#F43F5E",
    chineseCoralLight: "#FB7185",
    chineseCoralLighter: "#ffe4e6",
    chineseCoralDark: "#E11D48",
  },
});

// ============================================================================
// Semantic theme keys — screens use these instead of static palette tokens so
// colors flip with the theme. Light values equal the palette token each key
// replaces (light mode stays pixel-identical); see .ai/specs/2026-10-02-dark-mode.md.
// ============================================================================

const lightSemantic = {
  surface: "#FFFFFF",
  surfaceTranslucent: "rgba(255, 255, 255, 0.7)",
  textPrimary: "#0F172A",
  textBody: "#1E293B",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  fillMuted: "#94A3B8",
  borderStrong: "#CBD5E1",
  fillStrong: "#CBD5E1",
  borderSubtle: "#E2E8F0",
  fillSubtle: "#E2E8F0",
  successSurface: "#d6f1e8",
  successText: "#047857",
  dangerSurface: "#fed1d1",
  dangerText: "#B91C1C",
  warningSurface: "#fbefd2",
  warningText: "#D97706",
  infoSurface: "#cffafe",
  infoText: "#0E7490",
  primarySurface: "#dbeafe",
  roseSurface: "#ffe4e6",
};

const darkSemantic: typeof lightSemantic = {
  surface: "#1E293B",
  surfaceTranslucent: "rgba(30, 41, 59, 0.7)",
  textPrimary: "#F8FAFC",
  textBody: "#E2E8F0",
  textSecondary: "#CBD5E1",
  textMuted: "#94A3B8",
  fillMuted: "#475569",
  borderStrong: "#475569",
  fillStrong: "#334155",
  borderSubtle: "#334155",
  fillSubtle: "#1E293B",
  successSurface: "#064E3B",
  successText: "#6EE7B7",
  dangerSurface: "#450A0A",
  dangerText: "#FCA5A5",
  warningSurface: "#451A03",
  warningText: "#FCD34D",
  infoSurface: "#164E63",
  infoText: "#67E8F9",
  primarySurface: "#1E3A8A",
  roseSurface: "#4C0519",
};

/** Raw values for non-Tamagui consumers (navigation theme, root views). */
export const themeColors = {
  light: { background: "#F8FAFC", ...lightSemantic },
  dark: { background: "#0F172A", ...darkSemantic },
};

type BaseThemes = typeof config.themes;
type SemanticThemes = {
  [K in keyof BaseThemes]: BaseThemes[K] & typeof lightSemantic;
};

// Every light*/dark* theme (including component sub-themes such as
// light_Button) gets the keys, so lookups resolve inside nested themes too.
function withSemanticKeys(themes: BaseThemes): SemanticThemes {
  const result = {} as Record<string, unknown>;
  for (const [name, theme] of Object.entries(themes)) {
    const semantic = name.startsWith("dark") ? darkSemantic : lightSemantic;
    result[name] = { ...semantic, ...theme };
  }
  return result as SemanticThemes;
}

const themes = withSemanticKeys(config.themes);

const tamaguiConfig = createTamagui({
  ...config,
  tokens: customTokens,
  themes: {
    ...themes,
    light: {
      ...themes.light,
      background: "#F8FAFC",
      backgroundHover: "#F1F5F9",
      backgroundPress: "#E2E8F0",
      backgroundFocus: "#E2E8F0",
      color: "#0F172A",
      colorHover: "#1E293B",
      colorPress: "#334155",
      colorFocus: "#334155",
      borderColor: "#E2E8F0",
      borderColorHover: "#CBD5E1",
      borderColorPress: "#94A3B8",
      borderColorFocus: "#94A3B8",
    },
    dark: {
      ...themes.dark,
      background: "#0F172A",
      backgroundHover: "#1E293B",
      backgroundPress: "#334155",
      backgroundFocus: "#334155",
      color: "#F8FAFC",
      colorHover: "#E2E8F0",
      colorPress: "#CBD5E1",
      colorFocus: "#CBD5E1",
      borderColor: "#334155",
      borderColorHover: "#475569",
      borderColorPress: "#64748B",
      borderColorFocus: "#64748B",
    },
  },
  defaultTheme: "light",
});

export type AppConfig = typeof tamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig;
