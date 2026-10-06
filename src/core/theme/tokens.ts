/**
 * Evolync design tokens — the one place the redesign's values live.
 *
 * Mirrors canvas boards "0 · Color and label rules" and "S · Styleguide"
 * (see .claude/skills/design-mockups/SKILL.md). tamagui.config.ts turns these
 * into `$` tokens; components read the tokens, never raw hex values.
 */

// ============================================================================
// Neutrals (dark UI)
// ============================================================================

export const neutral = {
  page: "#0B0E14",
  card: "#131823",
  cardBorder: "#232B3B",
  raised: "#1A2130",
  raisedBorder: "#2A3345",
  text: "#F4F6FA",
  muted: "#A7B1C6",
  /** Field placeholder and hint text. */
  placeholder: "#7D889F",
  /** Empty checkbox / radio ring, Absent bar segment. */
  control: "#3A4458",
  /** Settings rows and other chrome that belongs to no module. */
  tint: "#CBD5E1",
  tintFill: "rgba(148,163,184,0.16)",
  synced: "#4ADE9F",
  syncedFill: "rgba(52,211,153,0.12)",
  alertDot: "#FF5A5A",
  /** Floating bottom nav shadow. */
  shadow: "rgba(0,0,0,0.5)",
} as const;

/** Destructive (trash) button: red in every context, never neutral gray. */
export const danger = {
  text: "#FF8A8A",
  fill: "rgba(255,90,90,0.10)",
  border: "rgba(255,90,90,0.4)",
  /** Destructive primary button (10E "Cancel event"): gradient and label. */
  from: "#EF4444",
  to: "#B91C1C",
  buttonText: "#FFFFFF",
} as const;

/** Warning text, e.g. "Out of stock" in the 12F size rows. */
export const warning = {
  text: "#FBBF24",
} as const;

// ============================================================================
// Context colors — tint only the header box, the Home pill, the context
// switcher and the page glow. Never used for module tiles.
// ============================================================================

export type ContextKey = "organization" | "school" | "student";

export interface ContextColors {
  /** Header box gradient stops (135deg), with their positions 0..1. */
  gradient: readonly { color: string; at: number }[];
  /** Text on the header box. */
  fg: string;
  fgSoft: string;
  /** Decorative rings on the header box. */
  ring: string;
  /** Event / training rows inside the header box. */
  rowBg: string;
  iconButton: string;
  chipBg: string;
  chipFg: string;
  /** Radial glow at the top of the page. */
  glow: string;
  /** Eyebrow / label color on the page. */
  label: string;
  /** 16% fill of the label, for "Add new" and similar chrome. */
  fill: string;
}

export const contextColors: Record<ContextKey, ContextColors> = {
  organization: {
    gradient: [
      { color: "#FBBF24", at: 0 },
      { color: "#F59E0B", at: 0.45 },
      { color: "#D97706", at: 1 },
    ],
    fg: "#1B1203",
    fgSoft: "#3D2A06",
    ring: "rgba(27,18,3,0.16)",
    rowBg: "rgba(27,18,3,0.12)",
    iconButton: "rgba(27,18,3,0.14)",
    chipBg: "#1B1203",
    chipFg: "#FBBF24",
    glow: "rgba(245,158,11,0.22)",
    label: "#FBBF24",
    fill: "rgba(245,158,11,0.16)",
  },
  school: {
    gradient: [
      { color: "#DC2626", at: 0 },
      { color: "#9F1239", at: 0.55 },
      { color: "#4C0519", at: 1 },
    ],
    fg: "#FFFFFF",
    fgSoft: "rgba(255,255,255,0.9)",
    ring: "rgba(255,255,255,0.16)",
    rowBg: "rgba(255,255,255,0.14)",
    iconButton: "rgba(255,255,255,0.18)",
    chipBg: "#FFFFFF",
    chipFg: "#9F1239",
    glow: "rgba(239,68,68,0.22)",
    label: "#FF8F8F",
    fill: "rgba(239,68,68,0.16)",
  },
  student: {
    gradient: [
      { color: "#3F5AE0", at: 0 },
      { color: "#2B3DB0", at: 0.5 },
      { color: "#17205E", at: 1 },
    ],
    fg: "#FFFFFF",
    fgSoft: "rgba(255,255,255,0.88)",
    ring: "rgba(255,255,255,0.16)",
    rowBg: "rgba(255,255,255,0.14)",
    iconButton: "rgba(255,255,255,0.18)",
    chipBg: "#FFFFFF",
    chipFg: "#2B3DB0",
    glow: "rgba(79,107,240,0.26)",
    label: "#9DB0FF",
    fill: "rgba(79,107,240,0.16)",
  },
};

// ============================================================================
// Module accents — one module, one color, in every context. Tinted for
// chrome (tint + fill), solid gradient for actions (from → to + buttonText).
// ============================================================================

export type ModuleKey =
  | "students"
  | "attendance"
  | "payments"
  | "grading"
  | "orders"
  | "products"
  | "events"
  | "trainings"
  | "tags"
  | "notebook";

export interface ModuleAccent {
  /** Text / icon color. */
  tint: string;
  /** Tile, icon square and quick-action fill (tint at 16%). */
  fill: string;
  /** Primary button gradient. */
  from: string;
  to: string;
  /** Text on the primary button (dark on light accents, ≥ 4.5:1). */
  buttonText: string;
}

export const moduleAccents: Record<ModuleKey, ModuleAccent> = {
  students: {
    tint: "#FB923C",
    fill: "rgba(251,146,60,0.16)",
    from: "#FB923C",
    to: "#C2410C",
    buttonText: "#1B0A02",
  },
  attendance: {
    tint: "#8DB8FF",
    fill: "rgba(141,184,255,0.16)",
    from: "#2563EB",
    to: "#1E40AF",
    buttonText: "#FFFFFF",
  },
  payments: {
    tint: "#4ADE9F",
    fill: "rgba(74,222,159,0.16)",
    from: "#059669",
    to: "#065F46",
    buttonText: "#FFFFFF",
  },
  grading: {
    tint: "#CBD5E1",
    fill: "rgba(203,213,225,0.16)",
    from: "#64748B",
    to: "#334155",
    buttonText: "#FFFFFF",
  },
  orders: {
    tint: "#C4AEFF",
    fill: "rgba(196,174,255,0.16)",
    from: "#7C3AED",
    to: "#5B21B6",
    buttonText: "#FFFFFF",
  },
  products: {
    tint: "#F9A8D4",
    fill: "rgba(249,168,212,0.16)",
    from: "#DB2777",
    to: "#9D174D",
    buttonText: "#FFFFFF",
  },
  events: {
    tint: "#F5B53D",
    fill: "rgba(245,181,61,0.16)",
    from: "#FBBF24",
    to: "#D97706",
    buttonText: "#1B1203",
  },
  trainings: {
    tint: "#5EEAD4",
    fill: "rgba(94,234,212,0.16)",
    from: "#2DD4BF",
    to: "#0F766E",
    buttonText: "#04201D",
  },
  tags: {
    tint: "#FB7185",
    fill: "rgba(251,113,133,0.16)",
    from: "#FB7185",
    to: "#E11D48",
    buttonText: "#FFFFFF",
  },
  notebook: {
    tint: "#67E8F9",
    fill: "rgba(34,211,238,0.16)",
    from: "#22D3EE",
    to: "#0891B2",
    buttonText: "#03222A",
  },
};

// ============================================================================
// Radii
// ============================================================================

export const radii = {
  header: 28,
  card: 22,
  pill: 20,
  headerRow: 18,
  rowIcon: 16,
  tileIcon: 14,
  chip: 8,
} as const;

// ============================================================================
// Typography — Manrope 500/600/700/800
// ============================================================================

export const fontFamilies = {
  500: "Manrope_500Medium",
  600: "Manrope_600SemiBold",
  700: "Manrope_700Bold",
  800: "Manrope_800ExtraBold",
} as const;

export type FontWeight = keyof typeof fontFamilies;

export interface TextRole {
  size: number;
  weight: FontWeight;
  letterSpacing: number;
  uppercase?: boolean;
}

export const textRoles = {
  /** Board / screen title. */
  title: { size: 28, weight: 800, letterSpacing: -0.4 },
  /** Header box title line (date). */
  headerTitle: { size: 24, weight: 800, letterSpacing: -0.4 },
  section: { size: 20, weight: 800, letterSpacing: -0.2 },
  tileTitle: { size: 17, weight: 800, letterSpacing: 0 },
  rowTitle: { size: 16, weight: 800, letterSpacing: 0 },
  button: { size: 14, weight: 800, letterSpacing: 0 },
  secondary: { size: 13, weight: 500, letterSpacing: 0 },
  eyebrow: { size: 11, weight: 800, letterSpacing: 0.8, uppercase: true },
  chip: { size: 10.5, weight: 800, letterSpacing: 0.6, uppercase: true },
} as const satisfies Record<string, TextRole>;

export type TextRoleKey = keyof typeof textRoles;
