/** One bar segment: its flex (the count) and its corner radii. */
export interface StatusBarSegment {
  key: string;
  flex: number;
  color: string;
  /** Left corners (5 on the bar's outer end, 2 between segments). */
  radiusLeft: number;
  /** Right corners. */
  radiusRight: number;
}

const OUTER_RADIUS = 5;
const INNER_RADIUS = 2;

/**
 * Segments of the Status summary bar (board S §6): zero counts are dropped
 * and the segments left at either end get the outer radius. An all-zero
 * summary has no segments (the bar shows its empty track).
 */
export const statusSummaryBar = (
  items: ReadonlyArray<{ key: string; count: number; barColor: string }>,
): StatusBarSegment[] => {
  const visible = items.filter((item) => item.count > 0);
  return visible.map((item, index) => ({
    key: item.key,
    flex: item.count,
    color: item.barColor,
    radiusLeft: index === 0 ? OUTER_RADIUS : INNER_RADIUS,
    radiusRight: index === visible.length - 1 ? OUTER_RADIUS : INNER_RADIUS,
  }));
};
