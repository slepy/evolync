import { config } from "@tamagui/config/v3";
import { createFont, createTamagui, createTokens } from "tamagui";
import {
  contextColors,
  danger,
  fontFamilies,
  moduleAccents,
  neutral,
  radii,
  textRoles,
  type ContextKey,
  type ModuleAccent,
  type ModuleKey,
  type TextRoleKey,
} from "./src/core/theme/tokens";

// ============================================================================
// Redesign tokens — generated from src/core/theme/tokens.ts so every value has
// one source. Naming: $neutralCard, $studentsTint, $schoolFrom, $trashText…
// ============================================================================

type ModuleColorTokens = Record<`${ModuleKey}${Capitalize<keyof ModuleAccent>}`, string>;
type ContextColorTokens = Record<
  `${ContextKey}${"From" | "Via" | "To" | "Fg" | "FgSoft" | "Glow" | "Label" | "Fill"}`,
  string
>;

const capitalize = <S extends string>(value: S) =>
  (value.charAt(0).toUpperCase() + value.slice(1)) as Capitalize<S>;

const moduleColorTokens = Object.fromEntries(
  (Object.keys(moduleAccents) as ModuleKey[]).flatMap((module) =>
    (Object.keys(moduleAccents[module]) as (keyof ModuleAccent)[]).map((key) => [
      `${module}${capitalize(key)}`,
      moduleAccents[module][key],
    ])
  )
) as ModuleColorTokens;

const contextColorTokens = Object.fromEntries(
  (Object.keys(contextColors) as ContextKey[]).flatMap((context) => {
    const c = contextColors[context];
    return [
      [`${context}From`, c.gradient[0].color],
      [`${context}Via`, c.gradient[1].color],
      [`${context}To`, c.gradient[c.gradient.length - 1].color],
      [`${context}Fg`, c.fg],
      [`${context}FgSoft`, c.fgSoft],
      [`${context}Glow`, c.glow],
      [`${context}Label`, c.label],
      [`${context}Fill`, c.fill],
    ];
  })
) as ContextColorTokens;

const designColorTokens = {
  neutralPage: neutral.page,
  neutralCard: neutral.card,
  neutralCardBorder: neutral.cardBorder,
  neutralRaised: neutral.raised,
  neutralRaisedBorder: neutral.raisedBorder,
  neutralText: neutral.text,
  neutralMuted: neutral.muted,
  neutralPlaceholder: neutral.placeholder,
  neutralControl: neutral.control,
  neutralTint: neutral.tint,
  neutralTintFill: neutral.tintFill,
  synced: neutral.synced,
  syncedFill: neutral.syncedFill,
  alertDot: neutral.alertDot,
  neutralShadow: neutral.shadow,
  trashText: danger.text,
  trashFill: danger.fill,
  trashBorder: danger.border,
  ...contextColorTokens,
  ...moduleColorTokens,
};

// Manrope ships 500–800; v3's 400 steps fall back to Medium.
const manropeFace = {
  400: { normal: fontFamilies[500] },
  500: { normal: fontFamilies[500] },
  600: { normal: fontFamilies[600] },
  700: { normal: fontFamilies[700] },
  800: { normal: fontFamilies[800] },
};

const roleKeys = Object.keys(textRoles) as TextRoleKey[];
const fromRoles = <T>(pick: (role: (typeof textRoles)[TextRoleKey]) => T) =>
  Object.fromEntries(roleKeys.map((key) => [key, pick(textRoles[key])])) as Record<
    TextRoleKey,
    T
  >;

// Keeps v3's numeric scale (existing screens keep their metrics) and adds the
// named redesign roles: fontSize="$section", fontWeight="$section", …
function manrope(base: typeof config.fonts.body) {
  return createFont({
    ...base,
    family: fontFamilies[500],
    size: { ...base.size, ...fromRoles((r) => r.size) },
    lineHeight: { ...base.lineHeight, ...fromRoles((r) => Math.round(r.size * 1.3)) },
    weight: { ...base.weight, ...fromRoles((r) => String(r.weight)) },
    letterSpacing: { ...base.letterSpacing, ...fromRoles((r) => r.letterSpacing) },
    face: manropeFace,
  });
}

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

    ...designColorTokens,
  },
  radius: {
    ...config.tokens.radius,
    ...radii,
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
  dangerSurfaceSubtle: "#FEF2F2",
  dangerText: "#B91C1C",
  warningSurface: "#fbefd2",
  warningText: "#D97706",
  infoSurface: "#cffafe",
  infoText: "#0E7490",
  primarySurface: "#dbeafe",
  primaryText: "#1E40AF",
  roseSurface: "#ffe4e6",
  // Solid accent fills behind white content (radix step 11 in light, step 9 in dark,
  // where step 11 turns pastel).
  blueFill: "#006ADC",
  purpleFill: "#793AAF",
};

// Dark neutrals follow the redesign (src/core/theme/tokens.ts).
const darkSemantic: typeof lightSemantic = {
  surface: neutral.card,
  surfaceTranslucent: "rgba(19, 24, 35, 0.7)",
  textPrimary: neutral.text,
  textBody: "#E2E8F0",
  textSecondary: neutral.muted,
  textMuted: "#7D889F",
  fillMuted: "#3A4458",
  borderStrong: "#3A4458",
  fillStrong: neutral.raisedBorder,
  borderSubtle: neutral.cardBorder,
  fillSubtle: neutral.raised,
  successSurface: "#022C22",
  successText: "#6EE7B7",
  dangerSurface: "#450A0A",
  dangerSurfaceSubtle: "#2A0A0A",
  dangerText: "#FCA5A5",
  warningSurface: "#451A03",
  warningText: "#FCD34D",
  infoSurface: "#083344",
  infoText: "#67E8F9",
  primarySurface: "#172554",
  primaryText: "#93C5FD",
  roseSurface: "#4C0519",
  blueFill: "#0090FF",
  purpleFill: "#8E4EC6",
};

/** Raw values for non-Tamagui consumers (navigation theme, root views). */
export const themeColors = {
  light: { background: "#F8FAFC", ...lightSemantic },
  dark: { background: neutral.page, ...darkSemantic },
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
  fonts: {
    ...config.fonts,
    heading: manrope(config.fonts.heading),
    body: manrope(config.fonts.body),
  },
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
      background: neutral.page,
      backgroundHover: neutral.raised,
      backgroundPress: neutral.raisedBorder,
      backgroundFocus: neutral.raisedBorder,
      color: neutral.text,
      colorHover: "#E2E8F0",
      colorPress: neutral.muted,
      colorFocus: neutral.muted,
      borderColor: neutral.cardBorder,
      borderColorHover: neutral.raisedBorder,
      borderColorPress: "#3A4458",
      borderColorFocus: "#3A4458",
    },
  },
  defaultTheme: "light",
});

export type AppConfig = typeof tamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig;
