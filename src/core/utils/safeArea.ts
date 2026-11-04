/** Space kept between the content and the system bar under it. */
export const SYSTEM_BAR_GAP = 16;

/**
 * Bottom padding of content that reaches the bottom of the screen (sheet
 * footers, the end of a scroll view). The app draws edge-to-edge on Android,
 * so the navigation bar covers the last `insetBottom` points: the designed
 * `base` padding is kept, raised to the inset plus a gap when the bar is
 * taller (3-button bar ~48dp).
 */
export function bottomInsetPadding(base: number, insetBottom: number): number {
  const inset = Number.isFinite(insetBottom) && insetBottom > 0 ? insetBottom : 0;
  return Math.max(base, inset + SYSTEM_BAR_GAP);
}
