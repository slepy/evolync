import {
  contextColors,
  moduleAccents,
  neutral,
  type ContextKey,
  type ModuleKey,
} from "@/core/theme/tokens";

/** Module color, context color (Add new in a school / organization) or neutral chrome. */
export type ListAccent = ModuleKey | ContextKey | "neutral";

export interface ResolvedListAccent {
  /** Text / icon color. */
  tint: string;
  /** Tint at 16%: icon squares, chips, the Add new pill. */
  fill: string;
  /** Tint at 8%: selected row background. */
  selectedFill: string;
  /** Checkbox gradient and the check drawn on it. */
  from: string;
  to: string;
  onGradient: string;
}

/** `#RRGGBB` → `rgba(r,g,b,alpha)`. */
export function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function resolveListAccent(accent: ListAccent): ResolvedListAccent {
  if (accent === "neutral") {
    return {
      tint: neutral.tint,
      fill: neutral.tintFill,
      selectedFill: withAlpha(neutral.tint, 0.08),
      from: neutral.tint,
      to: neutral.tint,
      onGradient: neutral.page,
    };
  }

  if (accent in contextColors) {
    const c = contextColors[accent as ContextKey];
    return {
      tint: c.label,
      fill: c.fill,
      selectedFill: withAlpha(c.label, 0.08),
      from: c.gradient[0].color,
      to: c.gradient[c.gradient.length - 1].color,
      onGradient: c.fg,
    };
  }

  const m = moduleAccents[accent as ModuleKey];
  return {
    tint: m.tint,
    fill: m.fill,
    selectedFill: withAlpha(m.tint, 0.08),
    from: m.from,
    to: m.to,
    onGradient: m.buttonText,
  };
}
