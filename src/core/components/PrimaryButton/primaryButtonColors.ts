import { resolveListAccent, type ListAccent } from "../List/accent";

export interface PrimaryButtonColors {
  /** Gradient start (135deg). */
  from: string;
  /** Gradient end. */
  to: string;
  /** Label / icon color on the gradient (≥ 4.5:1). */
  text: string;
}

/**
 * Colors of a primary button: the accent's button gradient (module, context
 * or neutral), with any field of `colors` taking over.
 */
export function resolvePrimaryButtonColors(
  accent: ListAccent,
  colors?: Partial<PrimaryButtonColors>,
): PrimaryButtonColors {
  const a = resolveListAccent(accent);
  return {
    from: colors?.from ?? a.from,
    to: colors?.to ?? a.to,
    text: colors?.text ?? a.onGradient,
  };
}
