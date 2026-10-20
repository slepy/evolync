export type ListAvatarSize = 64 | 48 | 44 | 36;

/** Side of the rotated square that draws the rank corner (16A: 26px on a 44px avatar, 16E: 38px on 64px). */
export const rankCornerSize = (size: ListAvatarSize): number => Math.round(size * 0.59);

/** True for colors too dark to see on the page (black belt). */
export function isDarkColor(color: string): boolean {
  const hex = color.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return false;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r! + 0.587 * g! + 0.114 * b! < 48;
}
