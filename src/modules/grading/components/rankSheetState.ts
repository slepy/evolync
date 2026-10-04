/** Color the picker shows when a rank has none yet. */
export const DEFAULT_RANK_COLOR = "#FFFFFF";

/**
 * Color the picker step starts from — the same one it shows, so Confirm
 * without touching the panel keeps that color.
 */
export function pickerStartColor(color: string | null): string {
  return color || DEFAULT_RANK_COLOR;
}

/**
 * Create needs a name; Save needs a name and a change to the name or color.
 */
export function canSubmitRank(
  name: string,
  color: string | null,
  rank?: { name: string; color?: string | null } | null,
): boolean {
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (!rank) return true;
  return trimmed !== rank.name || color !== (rank.color ?? null);
}
